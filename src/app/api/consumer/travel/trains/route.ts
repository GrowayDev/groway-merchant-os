import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { getUserId, ok, error } from '../../_lib/helpers'
import { ensureConsumerUser } from '../../_lib/ensureUser'
import { TRAIN_OPERATORS, generateReceiptNo } from '@/lib/consumer-wallet/catalog'

/**
 * /api/consumer/travel/trains
 *
 * Train ticket booking using catalog TRAIN_OPERATORS (Gautrain + Shosholoza Meyl).
 *
 * GET  -> { operators: [{ ...TRAIN_OPERATORS, routes: [...] }] }
 *
 * POST { operatorId, routeId, passengers: [{name, idNumber, type}] }
 *      -> routeId is the 1-based index into operator.routes
 *      -> creates a ConsumerTransaction (type='train_booking'),
 *         returns the booking ref + ticket number.
 */

type PassengerType = 'adult' | 'child' | 'pensioner'

interface PassengerInput {
  name: string
  idNumber: string
  type: PassengerType
}

interface OperatorWithRoutes {
  id: string
  name: string
  country: string
  routes: Array<{
    id: string
    from: string
    to: string
    price: number // Rands
    priceCents: bigint
    duration: string
  }>
}

// Build operator list with route IDs
function getOperatorsWithRoutes(): OperatorWithRoutes[] {
  return TRAIN_OPERATORS.map((op) => ({
    id: op.id,
    name: op.name,
    country: op.country,
    routes: op.routes.map((r, i) => ({
      id: `${op.id}-R${i + 1}`,
      from: r.from,
      to: r.to,
      price: r.price,
      priceCents: BigInt(Math.round(r.price * 100)),
      duration: r.duration,
    })),
  }))
}

// Booking ref: TRN-XXXXXX (6 chars)
function generateTrainRef(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let ref = ''
  const bytes = randomBytes(6)
  for (let i = 0; i < 6; i++) ref += chars[bytes[i] % chars.length]
  return `TRN-${ref}`
}

// Ticket number: ZA-{operatorId}-7-digit-serial with check digit (Luhn)
function generateTrainTicketNumber(operatorId: string): string {
  const prefix = operatorId.slice(0, 3).toUpperCase()
  let serial = ''
  for (let i = 0; i < 7; i++) serial += Math.floor(Math.random() * 10).toString()
  // Luhn check digit on prefix-as-digits + serial (map letters to digits 0-9 by ASCII)
  const body = (prefix + serial).split('').map((c) => {
    const code = c.charCodeAt(0)
    return String(code % 10)
  }).join('')
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
  return `ZA-${prefix}-${serial}-${check}`
}

function priceMultiplier(type: PassengerType): number {
  switch (type) {
    case 'child':
      return 0.5
    case 'pensioner':
      return 0.7
    default:
      return 1.0
  }
}

export async function GET(request: NextRequest) {
  try {
    const operators = getOperatorsWithRoutes()
    return ok({ operators })
  } catch (err) {
    console.error('Trains GET error:', err)
    return error('Failed to fetch train operators', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await request.json()
    const { operatorId, routeId, passengers } = (body || {}) as {
      operatorId: string
      routeId: string
      passengers: PassengerInput[]
    }

    if (!operatorId) return error('operatorId is required', 400)
    if (!routeId) return error('routeId is required', 400)
    if (!Array.isArray(passengers) || passengers.length === 0) {
      return error('At least one passenger is required', 400)
    }

    for (const [i, p] of passengers.entries()) {
      if (!p?.name || !p?.idNumber) {
        return error(`Passenger ${i + 1} is missing name or ID number`, 400)
      }
      if (p.type !== 'adult' && p.type !== 'child' && p.type !== 'pensioner') {
        return error(`Passenger ${i + 1} has invalid type (adult, child, or pensioner)`, 400)
      }
    }

    const operators = getOperatorsWithRoutes()
    const operator = operators.find((o) => o.id === operatorId)
    if (!operator) return error('Unknown train operator', 400)
    const route = operator.routes.find((r) => r.id === routeId)
    if (!route) return error('Unknown route for operator', 400)

    const totalCents = passengers.reduce((sum, p) => {
      const price = BigInt(
        Math.round(Number(route.priceCents) * priceMultiplier(p.type))
      )
      return sum + price
    }, BigInt(0))

    const bookingRef = generateTrainRef()
    const ticketNumber = generateTrainTicketNumber(operator.id)
    const receiptNo = generateReceiptNo('TRN')
    const txId = `tx-${randomBytes(8).toString('hex')}`

    // Ensure the consumer user row exists so the FK constraint is satisfied.
    await ensureConsumerUser(userId)

    await db.consumerTransaction.create({
      data: {
        id: txId,
        idempotencyKey: `${bookingRef}-${userId}`,
        userId,
        transactionType: 'train_booking',
        direction: 'debit',
        amountCents: totalCents,
        feeCents: BigInt(0),
        netAmountCents: totalCents,
        currency: 'ZAR',
        status: 'completed',
        description: `Train ${operator.name}: ${route.from} -> ${route.to} (${passengers.length} pax)`,
        reference: bookingRef,
        category: 'travel',
        counterpartyId: operator.id,
        counterpartyName: operator.name,
        counterpartyType: 'train_operator',
        paymentMethod: 'wallet',
        providerRef: ticketNumber,
        voucherToken: ticketNumber,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    const coach = `C${1 + (Math.floor(Math.random() * 6))}`
    const seatAssignments = passengers.map((p, i) => ({
      ...p,
      sequence: i + 1,
      coach,
      seatNumber: `${10 + i + Math.floor(Math.random() * 30)}`,
      ticketNumber: generateTrainTicketNumber(operator.id),
    }))

    return ok({
      bookingRef,
      ticketNumber,
      receiptNo,
      operator: {
        id: operator.id,
        name: operator.name,
        country: operator.country,
      },
      route: {
        id: route.id,
        from: route.from,
        to: route.to,
        duration: route.duration,
        priceCents: route.priceCents.toString(),
      },
      passengers: seatAssignments,
      totalAmount: totalCents.toString(),
      currency: 'ZAR',
      transactionId: txId,
      notice:
        'Train tickets must be presented at the gate with valid ID. Children travel at 50% fare, pensioners at 30% discount.',
    })
  } catch (err) {
    console.error('Trains POST error:', err)
    return error('Failed to book train', 500)
  }
}
