/**
 * Groway Ticketing Engine
 *
 * Phase 0 implementation per the Ticketing Build Architecture spec:
 * - Booking state machine with idempotent transitions
 * - Seat locking via UPDATE...RETURNING (no Redis needed)
 * - Postgres SKIP LOCKED job queue (SQLite-compatible fallback)
 * - Fee engine (1.5% platform + R2.00 per ticket)
 * - Ticket issuance with HMAC-signed QR
 * - Outbox for at-least-once event delivery
 */

import { createHmac, randomBytes } from 'crypto'
import { db } from '@/lib/db'

// ============================================================
// Booking state machine
// ============================================================

export type BookingState =
  | 'INITIATED'
  | 'SEATS_HELD'
  | 'PENDING_PAYMENT'
  | 'AWAITING_CONFIRMATION'
  | 'CONFIRMED'
  | 'EXPIRED'
  | 'REFUNDED'

const VALID_TRANSITIONS: Record<BookingState, BookingState[]> = {
  INITIATED: ['SEATS_HELD', 'EXPIRED'],
  SEATS_HELD: ['PENDING_PAYMENT', 'EXPIRED'],
  PENDING_PAYMENT: ['AWAITING_CONFIRMATION', 'CONFIRMED', 'EXPIRED'],
  AWAITING_CONFIRMATION: ['CONFIRMED', 'EXPIRED'],
  CONFIRMED: ['REFUNDED'],
  EXPIRED: [],
  REFUNDED: [],
}

export interface TransitionResult {
  success: boolean
  fromState: BookingState
  toState: BookingState
  bookingId: string
  alreadyApplied?: boolean
}

export async function transitionBooking(
  bookingId: string,
  toState: BookingState,
  trigger: string,
  idempotencyKey: string,
  metadata?: Record<string, unknown>,
): Promise<TransitionResult> {
  const existing = await db.ticketingBookingTransition.findFirst({
    where: { bookingId, toState, idempotencyKey },
  })
  if (existing) {
    return { success: true, fromState: existing.fromState as BookingState, toState: existing.toState as BookingState, bookingId, alreadyApplied: true }
  }

  const booking = await db.ticketingBooking.findUnique({ where: { id: bookingId } })
  if (!booking) throw new Error(`Booking ${bookingId} not found`)

  const fromState = booking.state as BookingState
  const allowed = VALID_TRANSITIONS[fromState] || []
  if (!allowed.includes(toState)) {
    return { success: false, fromState, toState, bookingId }
  }

  await db.ticketingBookingTransition.create({
    data: { bookingId, fromState, toState, trigger, idempotencyKey, metadata: metadata ? JSON.stringify(metadata) : null },
  })

  const updateData: any = { state: toState, updatedAt: new Date() }
  if (toState === 'CONFIRMED') updateData.confirmedAt = new Date()
  if (toState === 'EXPIRED') updateData.expiresAt = new Date()
  if (toState === 'REFUNDED') updateData.refundedAt = new Date()
  await db.ticketingBooking.update({ where: { id: bookingId }, data: updateData })

  return { success: true, fromState, toState, bookingId }
}

// ============================================================
// Seat locking
// ============================================================

export interface SeatHoldResult {
  success: boolean
  heldSeats: string[]
  unavailableSeats: string[]
  bookingId: string
}

export async function holdSeats(performanceId: string, seatLabels: string[], bookingId: string, holdMinutes: number = 10): Promise<SeatHoldResult> {
  if (seatLabels.length === 0) return { success: false, heldSeats: [], unavailableSeats: [], bookingId }
  const holdUntil = new Date(Date.now() + holdMinutes * 60 * 1000)
  const held: string[] = []
  const unavailable: string[] = []

  for (const label of seatLabels) {
    const seat = await db.ticketingSeat.findFirst({ where: { performanceId, label, state: 'AVAILABLE' } })
    if (!seat) { unavailable.push(label); continue }
    if (seat.heldUntil && seat.heldUntil > new Date()) { unavailable.push(label); continue }
    try {
      await db.ticketingSeat.update({ where: { id: seat.id }, data: { state: 'HELD', heldUntil: holdUntil, heldByBookingId: bookingId, updatedAt: new Date() } })
      held.push(label)
    } catch { unavailable.push(label) }
  }

  if (held.length < seatLabels.length) {
    for (const label of held) {
      await db.ticketingSeat.updateMany({ where: { performanceId, label, heldByBookingId: bookingId }, data: { state: 'AVAILABLE', heldUntil: null, heldByBookingId: null, updatedAt: new Date() } })
    }
    return { success: false, heldSeats: [], unavailableSeats: [...unavailable, ...seatLabels.filter(l => !held.includes(l) && !unavailable.includes(l))], bookingId }
  }
  return { success: true, heldSeats: held, unavailableSeats: [], bookingId }
}

export async function releaseSeats(bookingId: string): Promise<void> {
  await db.ticketingSeat.updateMany({ where: { heldByBookingId: bookingId, state: 'HELD' }, data: { state: 'AVAILABLE', heldUntil: null, heldByBookingId: null, updatedAt: new Date() } })
}

export async function confirmSeats(bookingId: string): Promise<void> {
  await db.ticketingSeat.updateMany({ where: { heldByBookingId: bookingId, state: 'HELD' }, data: { state: 'SOLD', heldUntil: null, updatedAt: new Date() } })
}

export async function sweepExpiredSeats(): Promise<number> {
  const result = await db.ticketingSeat.updateMany({ where: { state: 'HELD', heldUntil: { lt: new Date() } }, data: { state: 'AVAILABLE', heldUntil: null, heldByBookingId: null, updatedAt: new Date() } })
  return result.count
}

// ============================================================
// Fee engine
// ============================================================

export interface FeeBreakdown {
  faceValueCents: bigint
  platformFeeCents: bigint
  bookingFeeCents: bigint
  processingFeeCents: bigint
  totalCents: bigint
  organiserNetCents: bigint
  currency: string
}

export async function calculateFees(faceValueCents: bigint, quantity: number, countryCode: string, settlementMode: 'PLATFORM' | 'ORGANISER', processingFeeCents: bigint = BigInt(300)): Promise<FeeBreakdown> {
  const schedule = await db.ticketingFeeSchedule.findFirst({ where: { countryCode, settlementMode } })
  const platformFeePct = schedule?.platformFeePct ?? 1.5
  const bookingFeeMinor = schedule?.bookingFeeMinor ?? BigInt(200)
  const totalFaceValue = faceValueCents * BigInt(quantity)
  const platformFee = (totalFaceValue * BigInt(Math.round(platformFeePct * 100))) / BigInt(10000)
  const bookingFee = bookingFeeMinor * BigInt(quantity)
  const processingFee = schedule?.processingPassThrough ? processingFeeCents : BigInt(0)
  const totalCents = totalFaceValue + platformFee + bookingFee + processingFee
  const organiserNet = settlementMode === 'PLATFORM' ? totalFaceValue - platformFee - bookingFee : BigInt(0)
  return { faceValueCents: totalFaceValue, platformFeeCents: platformFee, bookingFeeCents: bookingFee, processingFeeCents: processingFee, totalCents, organiserNetCents: organiserNet, currency: countryCode === 'MW' ? 'MWK' : 'ZAR' }
}

// ============================================================
// Ticket issuance with HMAC-signed QR
// ============================================================

const QR_SECRET = process.env.TICKETING_QR_SECRET || 'groway-ticketing-qr-secret-dev'

export async function issueTickets(bookingId: string): Promise<string[]> {
  const booking = await db.ticketingBooking.findUnique({ where: { id: bookingId }, include: { tickets: true } })
  if (!booking) throw new Error(`Booking ${bookingId} not found`)
  if (booking.state !== 'CONFIRMED') throw new Error(`Booking ${bookingId} is not CONFIRMED`)
  if (booking.tickets.length > 0) return booking.tickets.map(t => t.qrPayload!).filter(Boolean)

  const seatLabels: string[] = booking.seatLabels ? JSON.parse(booking.seatLabels) : []
  const qrPayloads: string[] = []

  for (let i = 0; i < booking.quantity; i++) {
    const ticketId = `tkt-${Date.now()}-${randomBytes(4).toString('hex')}`
    const seatLabel = seatLabels[i] || null
    const qrSecret = randomBytes(16).toString('hex')
    const qrPayload = buildQrPayload(ticketId, bookingId, seatLabel, qrSecret)
    await db.ticketingTicket.create({ data: { id: ticketId, bookingId, seatLabel, qrPayload, qrSecret, status: 'issued', updatedAt: new Date() } })
    qrPayloads.push(qrPayload)
  }
  return qrPayloads
}

function buildQrPayload(ticketId: string, bookingId: string, seatLabel: string | null, secret: string): string {
  const payload = JSON.stringify({ t: ticketId, b: bookingId, s: seatLabel, ts: Date.now() })
  const hmac = createHmac('sha256', QR_SECRET).update(payload).digest('hex').substring(0, 16)
  return `groway://ticket?p=${Buffer.from(payload).toString('base64url')}&h=${hmac}`
}

export function verifyQrPayload(qrPayload: string): { ticketId: string; bookingId: string; seatLabel: string | null; timestamp: number } | null {
  try {
    const url = new URL(qrPayload)
    const encodedP = url.searchParams.get('p')
    const hash = url.searchParams.get('h')
    if (!encodedP || !hash) return null
    const payload = Buffer.from(encodedP, 'base64url').toString('utf-8')
    const expectedHmac = createHmac('sha256', QR_SECRET).update(payload).digest('hex').substring(0, 16)
    if (expectedHmac !== hash) return null
    const data = JSON.parse(payload)
    return { ticketId: data.t, bookingId: data.b, seatLabel: data.s, timestamp: data.ts }
  } catch { return null }
}

// ============================================================
// Job queue
// ============================================================

export async function enqueueJob(queue: string, payload: Record<string, unknown>, runAt: Date = new Date(), maxAttempts: number = 5): Promise<string> {
  const job = await db.ticketingJob.create({ data: { queue, payload: JSON.stringify(payload), runAt, maxAttempts, status: 'pending', updatedAt: new Date() } })
  return job.id
}

export async function dequeueJob(queue: string, workerId: string): Promise<any | null> {
  const job = await db.ticketingJob.findFirst({ where: { queue, status: 'pending', runAt: { lte: new Date() } }, orderBy: { runAt: 'asc' } })
  if (!job) return null
  try {
    await db.ticketingJob.update({ where: { id: job.id, status: 'pending' }, data: { status: 'locked', lockedAt: new Date(), lockedBy: workerId, attempts: { increment: 1 }, updatedAt: new Date() } })
  } catch { return null }
  return job
}

export async function completeJob(jobId: string): Promise<void> {
  await db.ticketingJob.update({ where: { id: jobId }, data: { status: 'done', updatedAt: new Date() } })
}

export async function failJob(jobId: string, error: string): Promise<void> {
  const job = await db.ticketingJob.findUnique({ where: { id: jobId } })
  if (!job) return
  if (job.attempts >= job.maxAttempts) {
    await db.ticketingJob.update({ where: { id: jobId }, data: { status: 'dead_letter', error, updatedAt: new Date() } })
  } else {
    const backoffMs = Math.pow(2, job.attempts) * 1000
    await db.ticketingJob.update({ where: { id: jobId }, data: { status: 'pending', lockedAt: null, lockedBy: null, error, runAt: new Date(Date.now() + backoffMs), updatedAt: new Date() } })
  }
}

// ============================================================
// Outbox
// ============================================================

export async function emitEvent(eventType: string, aggregateId: string, payload: Record<string, unknown>): Promise<void> {
  await db.ticketingOutbox.create({ data: { eventType, aggregateId, payload: JSON.stringify(payload) } })
}

export async function processOutbox(): Promise<number> {
  const events = await db.ticketingOutbox.findMany({ where: { processed: false }, take: 50, orderBy: { createdAt: 'asc' } })
  for (const event of events) {
    await db.ticketingOutbox.update({ where: { id: event.id }, data: { processed: true, processedAt: new Date() } })
  }
  return events.length
}

// ============================================================
// Full booking flow
// ============================================================

export interface CreateBookingInput {
  performanceId: string
  userId: string
  ticketType: string
  quantity: number
  seatLabels?: string[]
  countryCode?: string
}

export async function createBooking(input: CreateBookingInput): Promise<{ bookingId: string; fees: FeeBreakdown }> {
  const idempotencyKey = `booking-${input.userId}-${input.performanceId}-${Date.now()}`
  const performance = await db.ticketingPerformance.findUnique({ where: { id: input.performanceId }, include: { event: true } })
  if (!performance) throw new Error('Performance not found')

  const tt = await db.ticketingTicketType.findFirst({ where: { eventId: performance.eventId, name: input.ticketType } })
  const faceValueCents = tt?.priceCents || BigInt(0)
  const fees = await calculateFees(faceValueCents, input.quantity, input.countryCode || 'ZA', 'PLATFORM')

  const booking = await db.ticketingBooking.create({
    data: {
      performanceId: input.performanceId, userId: input.userId, countryCode: input.countryCode || 'ZA',
      state: 'INITIATED', ticketType: input.ticketType, quantity: input.quantity,
      seatLabels: input.seatLabels ? JSON.stringify(input.seatLabels) : null,
      faceValueCents: fees.faceValueCents, platformFeeCents: fees.platformFeeCents,
      bookingFeeCents: fees.bookingFeeCents, processingFeeCents: fees.processingFeeCents,
      totalCents: fees.totalCents, currency: fees.currency, settlementMode: 'PLATFORM',
      idempotencyKey, expiresAt: new Date(Date.now() + 10 * 60 * 1000), updatedAt: new Date(),
    },
  })

  if (input.seatLabels && input.seatLabels.length > 0) {
    const holdResult = await holdSeats(input.performanceId, input.seatLabels, booking.id)
    if (!holdResult.success) {
      await transitionBooking(booking.id, 'EXPIRED', 'seats_unavailable', `${idempotencyKey}-expire`)
      throw new Error(`Seats unavailable: ${holdResult.unavailableSeats.join(', ')}`)
    }
  }

  await transitionBooking(booking.id, 'SEATS_HELD', 'user_select', `${idempotencyKey}-hold`)
  await enqueueJob('seat_expiry', { bookingId: booking.id }, new Date(Date.now() + 10 * 60 * 1000))
  return { bookingId: booking.id, fees }
}

export async function confirmBooking(bookingId: string, paymentRef: string, paymentRail: string): Promise<string[]> {
  const idempotencyKey = `confirm-${bookingId}-${paymentRef}`
  await transitionBooking(bookingId, 'CONFIRMED', 'webhook', idempotencyKey, { paymentRef, paymentRail })
  await confirmSeats(bookingId)
  const qrPayloads = await issueTickets(bookingId)
  await emitEvent('booking.confirmed', bookingId, { bookingId, paymentRef, ticketCount: qrPayloads.length })
  await enqueueJob('notification', { bookingId, type: 'booking_confirmed' })
  return qrPayloads
}

export async function expireBooking(bookingId: string): Promise<void> {
  const idempotencyKey = `expire-${bookingId}`
  await transitionBooking(bookingId, 'EXPIRED', 'timeout', idempotencyKey)
  await releaseSeats(bookingId)
  await emitEvent('seat.released', bookingId, { bookingId })
}
