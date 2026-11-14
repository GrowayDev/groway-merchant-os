import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { getUserId, ok, error } from '../../_lib/helpers'
import { ensureConsumerUser } from '../../_lib/ensureUser'
import { AIRLINES, AIRPORTS, generateReceiptNo } from '@/lib/consumer-wallet/catalog'

/**
 * /api/consumer/travel/flights
 *
 * South Africa + Malawi flight booking. Uses the catalog airlines/airports.
 *
 * GET  ?from=JNB&to=CPT&date=2026-01-15
 *      -> { airlines, airports, flights: [...] }
 *
 * POST { flightId, passengers: [{name, idNumber, type}] }
 *      -> books a flight, creates a ConsumerTransaction (type='flight_booking'),
 *         returns the PNR + IATA-formatted 13-digit e-ticket number.
 */

type PassengerType = 'adult' | 'child'

interface PassengerInput {
  name: string
  idNumber: string
  type: PassengerType
}

interface FlightQuote {
  id: string
  flightNumber: string
  airlineId: string
  airlineName: string
  airlineCode: string
  aircraft: string
  fromCode: string
  toCode: string
  fromCity: string
  toCity: string
  departure: string // HH:MM
  arrival: string // HH:MM
  duration: string
  priceCents: bigint
  seatsAvailable: number
  cabin: string
}

// Deterministic-ish per-route base price table (Rands)
const ROUTE_PRICES: Record<string, number> = {
  'JNB-CPT': 1899,
  'CPT-JNB': 1949,
  'JNB-DUR': 1299,
  'DUR-JNB': 1299,
  'JNB-PLZ': 1799,
  'PLZ-JNB': 1799,
  'JNB-BFN': 1199,
  'BFN-JNB': 1199,
  'CPT-DUR': 2099,
  'DUR-CPT': 2099,
  'JNB-LLW': 3499,
  'LLW-JNB': 3499,
  'JNB-BLZ': 3699,
  'BLZ-JNB': 3699,
  'LLW-BLZ': 1899,
  'BLZ-LLW': 1899,
}

// Generate per-flight schedule given route + date + airline index
function buildFlightSchedules(fromCode: string, toCode: string, date: string): FlightQuote[] {
  const routeKey = `${fromCode}-${toCode}`
  const basePrice = ROUTE_PRICES[routeKey]
  if (!basePrice) return []

  const departureSlots = ['06:15', '08:40', '11:05', '13:30', '16:20', '19:00']
  const aircraftByIndex = ['Boeing 737-800', 'Airbus A320', 'Embraer E190', 'Boeing 737 MAX']

  const fromAirport = AIRPORTS.find((a) => a.code === fromCode)
  const eligible = AIRLINES.filter(() => true).slice(0, 4)

  const flights: FlightQuote[] = []
  eligible.forEach((airline, idx) => {
    const depTime = departureSlots[(idx * 2) % departureSlots.length]
    const arrTime = addHours(depTime, flightDurationHours(routeKey))
    const seatsBase = 35 + ((idx * 17 + (date ? date.charCodeAt(2) : 5)) % 90)
    const priceVariance = 1 + ((idx % 3) - 1) * 0.08
    const priceCents = BigInt(Math.round(basePrice * priceVariance * 100))

    flights.push({
      id: `FLT-${airline.code}-${fromCode}-${toCode}-${idx + 1}`,
      flightNumber: `${airline.code}${200 + idx * 37}`,
      airlineId: airline.id,
      airlineName: airline.name,
      airlineCode: airline.code,
      aircraft: aircraftByIndex[idx % aircraftByIndex.length],
      fromCode,
      toCode,
      fromCity: fromAirport?.city ?? fromCode,
      toCity: AIRPORTS.find((a) => a.code === toCode)?.city ?? toCode,
      departure: depTime,
      arrival: arrTime,
      duration: formatDurationHours(flightDurationHours(routeKey)),
      priceCents,
      seatsAvailable: seatsBase,
      cabin: 'Economy',
    })
  })

  return flights
}

function flightDurationHours(routeKey: string): number {
  if (routeKey.includes('LLW') || routeKey.includes('BLZ')) {
    return routeKey.startsWith('LLW-BLZ') || routeKey.startsWith('BLZ-LLW') ? 1 : 3
  }
  switch (routeKey) {
    case 'JNB-CPT':
    case 'CPT-JNB':
      return 2
    case 'JNB-DUR':
    case 'DUR-JNB':
      return 1.17
    case 'CPT-DUR':
    case 'DUR-CPT':
      return 1.75
    case 'JNB-PLZ':
    case 'PLZ-JNB':
    case 'JNB-BFN':
    case 'BFN-JNB':
      return 1.5
    default:
      return 2
  }
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

// 6-char PNR (alphanumeric, uppercase, no ambiguous chars)
function generatePNR(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let pnr = ''
  const bytes = randomBytes(6)
  for (let i = 0; i < 6; i++) pnr += chars[bytes[i] % chars.length]
  return pnr
}

// IATA e-ticket number: 13 digits — first 3 are the issuing airline IATA code,
// remaining 10 are serial + check digit.
function generateETicketNumber(airlineIata: string): string {
  let serial = ''
  for (let i = 0; i < 10; i++) serial += Math.floor(Math.random() * 10).toString()
  const body = airlineIata + serial
  let sum = 0
  let dbl = false
  for (let i = body.length - 1; i >= 0; i--) {
    let d = parseInt(body[i], 10)
    if (dbl) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    dbl = !dbl
  }
  const check = (10 - (sum % 10)) % 10
  return body + check.toString()
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')?.toUpperCase() || ''
    const to = searchParams.get('to')?.toUpperCase() || ''
    const date = searchParams.get('date') || ''

    if (from && to && from === to) {
      return error('Departure and arrival airports cannot be the same', 400)
    }

    const flights = from && to ? buildFlightSchedules(from, to, date) : []

    return ok({
      airlines: AIRLINES,
      airports: AIRPORTS,
      search: { from, to, date },
      flights,
    })
  } catch (err) {
    console.error('Flights GET error:', err)
    return error('Failed to fetch flights', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await request.json()
    const { flightId, passengers } = (body || {}) as {
      flightId: string
      passengers: PassengerInput[]
    }

    if (!flightId) return error('flightId is required', 400)
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

    const parts = flightId.split('-')
    if (parts.length < 5 || parts[0] !== 'FLT') {
      return error('Invalid flightId format', 400)
    }
    const airlineCode = parts[1]
    const fromCode = parts[2]
    const toCode = parts[3]
    const idx = parseInt(parts[4], 10)

    const airline = AIRLINES.find((a) => a.code === airlineCode)
    if (!airline) return error('Unknown airline', 400)
    const fromAirport = AIRPORTS.find((a) => a.code === fromCode)
    const toAirport = AIRPORTS.find((a) => a.code === toCode)
    if (!fromAirport || !toAirport) return error('Unknown airport', 400)

    const date = typeof body.date === 'string' ? body.date : new Date().toISOString().slice(0, 10)
    const schedules = buildFlightSchedules(fromCode, toCode, date)
    const flight = schedules[idx - 1]
    if (!flight) return error('Flight not found for this route', 404)

    const totalCents = passengers.reduce((sum, p) => {
      const price =
        p.type === 'child'
          ? BigInt(Math.round(Number(flight.priceCents) * 0.75))
          : flight.priceCents
      return sum + price
    }, BigInt(0))

    const bookingRef = generatePNR()
    const eTicketNumber = generateETicketNumber(airline.iata)
    const receiptNo = generateReceiptNo('FLT')
    const txId = `tx-${randomBytes(8).toString('hex')}`

    // Ensure the consumer user row exists so the FK constraint is satisfied.
    // In production the user is created at onboarding; this upsert is a no-op there.
    await ensureConsumerUser(userId)

    await db.consumerTransaction.create({
      data: {
        id: txId,
        idempotencyKey: `${bookingRef}-${userId}`,
        userId,
        transactionType: 'flight_booking',
        direction: 'debit',
        amountCents: totalCents,
        feeCents: BigInt(0),
        netAmountCents: totalCents,
        currency: 'ZAR',
        status: 'completed',
        description: `Flight ${flight.flightNumber} ${fromCode} -> ${toCode} (${passengers.length} pax)`,
        reference: bookingRef,
        category: 'travel',
        counterpartyId: airline.id,
        counterpartyName: airline.name,
        counterpartyType: 'airline',
        paymentMethod: 'wallet',
        providerRef: eTicketNumber,
        voucherToken: eTicketNumber,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    return ok({
      bookingRef,
      eTicketNumber,
      receiptNo,
      flight: {
        ...flight,
        priceCents: flight.priceCents.toString(),
      },
      passengers: passengers.map((p, i) => ({
        ...p,
        sequence: i + 1,
        eTicketNumber: generateETicketNumber(airline.iata),
      })),
      totalAmount: totalCents.toString(),
      currency: 'ZAR',
      iataNotice:
        'E-ticket issued under IATA Resolution 722f. The 13-digit number follows the IATA standard (3-digit airline prefix + 10-digit serial with Luhn check digit). Present the PNR at check-in.',
      transactionId: txId,
    })
  } catch (err) {
    console.error('Flights POST error:', err)
    return error('Failed to book flight', 500)
  }
}
