import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { getUserId, ok, error } from '../../_lib/helpers'
import { ensureConsumerUser } from '../../_lib/ensureUser'
import { BUS_OPERATORS, BUS_CITIES, generateReceiptNo } from '@/lib/consumer-wallet/catalog'

/**
 * /api/consumer/travel/buses
 *
 * Intercity bus booking across ZA + MW using catalog operators and cities.
 *
 * GET  ?from=jhb&to=cpt&date=2026-01-15
 *      -> { operators, cities, buses: [...] }
 *
 * POST { busId, fromCity, toCity, date, passengers: [{name, idNumber, type}] }
 *      -> books seats, creates a ConsumerTransaction (type='bus_booking'),
 *         returns the booking reference + ticket number.
 */

type PassengerType = 'adult' | 'child'

interface PassengerInput {
  name: string
  idNumber: string
  type: PassengerType
}

interface BusQuote {
  id: string
  operatorId: string
  operatorName: string
  fromCityId: string
  toCityId: string
  fromCity: string
  toCity: string
  busType: string
  departure: string
  arrival: string
  duration: string
  priceCents: bigint
  seatsAvailable: number
  amenities: string[]
}

const ROUTE_BASE_PRICE: Record<string, number> = {
  'jhb-cpt': 650,
  'cpt-jhb': 650,
  'jhb-dbn': 380,
  'dbn-jhb': 380,
  'jhb-bf': 250,
  'bf-jhb': 250,
  'jhb-pl': 280,
  'pl-jhb': 280,
  'jhb-pe': 480,
  'pe-jhb': 480,
  'jhb-el': 420,
  'el-jhb': 420,
  'cpt-pl': 320,
  'pl-cpt': 320,
  'jhb-llw': 950,
  'llw-jhb': 950,
  'jhb-blz': 1100,
  'blz-jhb': 1100,
  'llw-blz': 450,
  'blz-llw': 450,
  'llw-mzu': 320,
  'mzu-llw': 320,
  'llw-zmb': 280,
  'zmb-llw': 280,
}

const DURATION_HOURS: Record<string, number> = {
  'jhb-cpt': 18,
  'cpt-jhb': 18,
  'jhb-dbn': 7,
  'dbn-jhb': 7,
  'jhb-bf': 5.5,
  'bf-jhb': 5.5,
  'jhb-pl': 5,
  'pl-jhb': 5,
  'jhb-pe': 11,
  'pe-jhb': 11,
  'jhb-el': 10,
  'el-jhb': 10,
  'cpt-pl': 6,
  'pl-cpt': 6,
  'jhb-llw': 28,
  'llw-jhb': 28,
  'jhb-blz': 32,
  'blz-jhb': 32,
  'llw-blz': 5,
  'blz-llw': 5,
  'llw-mzu': 4,
  'mzu-llw': 4,
  'llw-zmb': 3.5,
  'zmb-llw': 3.5,
}

const BUS_TYPES = ['Sleepliner', 'Luxury Liner', 'Semi-Luxury', 'Standard']
const AMENITIES_BY_TYPE: Record<string, string[]> = {
  Sleepliner: ['Reclining beds', 'Aircon', 'Onboard toilet', 'Charging ports'],
  'Luxury Liner': ['Reclining seats', 'Aircon', 'Onboard toilet', 'WiFi', 'Snacks'],
  'Semi-Luxury': ['Reclining seats', 'Aircon', 'Onboard toilet'],
  Standard: ['Standard seats', 'Aircon'],
}

function addHours(hhmm: string, hours: number): string {
  const [h, m] = hhmm.split(':').map(Number)
  const start = h * 60 + m
  const end = start + Math.round(hours * 60)
  const endH = Math.floor(end / 60) % 24
  const endM = end % 60
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
}

function formatDurationHours(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}h ${String(m).padStart(2, '0')}m`
}

function buildBusSchedules(fromCityId: string, toCityId: string, date: string): BusQuote[] {
  const routeKey = `${fromCityId}-${toCityId}`
  const base = ROUTE_BASE_PRICE[routeKey]
  if (!base) return []

  const fromCity = BUS_CITIES.find((c) => c.id === fromCityId)
  const toCity = BUS_CITIES.find((c) => c.id === toCityId)
  if (!fromCity || !toCity) return []

  const departureSlots = ['07:00', '10:30', '14:00', '18:00', '20:30', '22:00']
  // Eligible operators: same-country preferred, cross-border all
  const eligible = BUS_OPERATORS.filter(() => true).slice(0, 4)

  const buses: BusQuote[] = []
  eligible.forEach((op, idx) => {
    const depTime = departureSlots[(idx * 2) % departureSlots.length]
    const hours = DURATION_HOURS[routeKey] ?? 6
    const arrTime = addHours(depTime, hours)
    const busType = BUS_TYPES[idx % BUS_TYPES.length]
    const priceVariance = 1 + ((idx % 3) - 1) * 0.1
    const priceCents = BigInt(Math.round(base * priceVariance * 100))
    const seatsBase = 8 + ((idx * 9 + (date ? date.charCodeAt(2) : 3)) % 32)

    buses.push({
      id: `BUS-${op.id}-${fromCityId}-${toCityId}-${idx + 1}`,
      operatorId: op.id,
      operatorName: op.name,
      fromCityId,
      toCityId,
      fromCity: fromCity.name,
      toCity: toCity.name,
      busType,
      departure: depTime,
      arrival: arrTime,
      duration: formatDurationHours(hours),
      priceCents,
      seatsAvailable: seatsBase,
      amenities: AMENITIES_BY_TYPE[busType] ?? ['Aircon'],
    })
  })

  return buses
}

// Booking ref: 8-char uppercase alphanumeric
function generateBusRef(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let ref = ''
  const bytes = randomBytes(8)
  for (let i = 0; i < 8; i++) ref += chars[bytes[i] % chars.length]
  return ref
}

// Ticket number: ZA/<operator-2-char>/<7-digit-serial>/<check-char>
function generateBusTicketNumber(operatorId: string): string {
  const prefix = operatorId.slice(0, 2).toUpperCase()
  let serial = ''
  for (let i = 0; i < 7; i++) serial += Math.floor(Math.random() * 10).toString()
  const checkChars = 'XABCDEFGHJKLMNPQ'
  const checkIdx = parseInt(serial.slice(-2), 10) % checkChars.length
  return `ZA/${prefix}/${serial}/${checkChars[checkIdx]}`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from') || ''
    const to = searchParams.get('to') || ''
    const date = searchParams.get('date') || ''

    if (from && to && from === to) {
      return error('Departure and destination cities cannot be the same', 400)
    }

    const buses = from && to ? buildBusSchedules(from, to, date) : []

    return ok({
      operators: BUS_OPERATORS,
      cities: BUS_CITIES,
      search: { from, to, date },
      buses,
    })
  } catch (err) {
    console.error('Buses GET error:', err)
    return error('Failed to fetch buses', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await request.json()
    const { busId, fromCity, toCity, date, passengers } = (body || {}) as {
      busId: string
      fromCity: string
      toCity: string
      date: string
      passengers: PassengerInput[]
    }

    if (!busId) return error('busId is required', 400)
    if (!fromCity || !toCity) return error('fromCity and toCity are required', 400)
    if (!date) return error('date is required', 400)
    if (!Array.isArray(passengers) || passengers.length === 0) {
      return error('At least one passenger is required', 400)
    }

    for (const [i, p] of passengers.entries()) {
      if (!p?.name || !p?.idNumber) {
        return error(`Passenger ${i + 1} is missing name or ID number`, 400)
      }
      if (p.type !== 'adult' && p.type !== 'child') {
        return error(`Passenger ${i + 1} has invalid type (must be adult or child)`, 400)
      }
    }

    // Parse busId: BUS-{operatorId}-{from}-{to}-{idx}
    const parts = busId.split('-')
    if (parts.length < 5 || parts[0] !== 'BUS') {
      return error('Invalid busId format', 400)
    }
    // operatorId may contain '-' itself? In our catalog it doesn't, so split is safe.
    const operatorId = parts[1]
    const idx = parseInt(parts[parts.length - 1], 10)

    const operator = BUS_OPERATORS.find((o) => o.id === operatorId)
    if (!operator) return error('Unknown bus operator', 400)
    const fromCityObj = BUS_CITIES.find((c) => c.id === fromCity)
    const toCityObj = BUS_CITIES.find((c) => c.id === toCity)
    if (!fromCityObj || !toCityObj) return error('Unknown city', 400)

    const schedules = buildBusSchedules(fromCity, toCity, date)
    const bus = schedules[idx - 1]
    if (!bus) return error('Bus not found for this route', 404)

    // Adults full price, children 50% off
    const totalCents = passengers.reduce((sum, p) => {
      const price =
        p.type === 'child'
          ? BigInt(Math.round(Number(bus.priceCents) * 0.5))
          : bus.priceCents
      return sum + price
    }, BigInt(0))

    const bookingRef = generateBusRef()
    const ticketNumber = generateBusTicketNumber(operator.id)
    const receiptNo = generateReceiptNo('BUS')
    const txId = `tx-${randomBytes(8).toString('hex')}`

    // Ensure the consumer user row exists so the FK constraint is satisfied.
    await ensureConsumerUser(userId)

    await db.consumerTransaction.create({
      data: {
        id: txId,
        idempotencyKey: `${bookingRef}-${userId}`,
        userId,
        transactionType: 'bus_booking',
        direction: 'debit',
        amountCents: totalCents,
        feeCents: BigInt(0),
        netAmountCents: totalCents,
        currency: 'ZAR',
        status: 'completed',
        description: `Bus ${operator.name} ${fromCityObj.name} -> ${toCityObj.name} (${passengers.length} pax)`,
        reference: bookingRef,
        category: 'travel',
        counterpartyId: operator.id,
        counterpartyName: operator.name,
        counterpartyType: 'bus_operator',
        paymentMethod: 'wallet',
        providerRef: ticketNumber,
        voucherToken: ticketNumber,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    // Assign seat numbers 1..N
    const seats = passengers.map((_, i) => i + 1)

    return ok({
      bookingRef,
      ticketNumber,
      receiptNo,
      bus: {
        ...bus,
        priceCents: bus.priceCents.toString(),
      },
      passengers: passengers.map((p, i) => ({
        ...p,
        sequence: i + 1,
        seatNumber: seats[i],
        ticketNumber: generateBusTicketNumber(operator.id),
      })),
      totalAmount: totalCents.toString(),
      currency: 'ZAR',
      transactionId: txId,
      notice:
        'Present your ticket number and ID at the boarding gate 30 minutes before departure. Children travel at 50% fare.',
    })
  } catch (err) {
    console.error('Buses POST error:', err)
    return error('Failed to book bus', 500)
  }
}
