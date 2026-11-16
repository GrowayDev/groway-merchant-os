import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, error, getUserId, serialize } from '../_lib/helpers'
import { createBooking, confirmBooking, FeeBreakdown } from '@/lib/ticketing'

// GET /api/consumer/events — list events with performances
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const countryCode = searchParams.get('country') || 'ZA'

    const events = await db.ticketingEvent.findMany({
      where: {
        status: 'published',
        countryCode,
        ...(category && category !== 'all' ? { category } : {}),
      },
      include: {
        performances: { where: { status: 'on_sale' }, orderBy: { startTime: 'asc' } },
        ticketTypes: { where: { status: 'active' } },
        venue: true,
        organiser: true,
      },
      orderBy: { startDate: 'asc' },
      take: 50,
    })

    return ok({ events })
  } catch (e: any) {
    return error(e.message, 500)
  }
}

// POST /api/consumer/events — create booking or confirm payment
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await request.json()

    if (body.action === 'book') {
      // Create a booking
      const result = await createBooking({
        performanceId: body.performanceId,
        userId,
        ticketType: body.ticketType || 'Regular',
        quantity: body.quantity || 1,
        seatLabels: body.seatLabels,
        countryCode: body.country || 'ZA',
      })

      return ok({
        bookingId: result.bookingId,
        fees: serialize(result.fees) as any,
        status: 'SEATS_HELD',
        expiresIn: 600, // 10 minutes
        message: 'Seats held. Complete payment within 10 minutes.',
      }, 201)
    }

    if (body.action === 'confirm') {
      // Confirm a booking after payment
      const qrPayloads = await confirmBooking(body.bookingId, body.paymentRef, body.paymentRail || 'payshap')

      return ok({
        bookingId: body.bookingId,
        status: 'CONFIRMED',
        tickets: qrPayloads,
        message: 'Booking confirmed. Tickets issued with QR codes.',
      })
    }

    if (body.action === 'seed') {
      // Seed demo events (for testing)
      await seedDemoEvents()
      return ok({ message: 'Demo events seeded' })
    }

    return error('Invalid action. Use "book" or "confirm" or "seed".', 400)
  } catch (e: any) {
    return error(e.message, 500)
  }
}

async function seedDemoEvents() {
  // Create organiser
  const organiser = await db.ticketingOrganiser.upsert({
    where: { id: 'org-demo' },
    update: {},
    create: { id: 'org-demo', name: 'Groway Events', email: 'events@groway.co.za', settlementMode: 'PLATFORM', countryCode: 'ZA' },
  })

  // Create venue
  const venue = await db.ticketingVenue.upsert({
    where: { id: 'venue-demo' },
    update: {},
    create: { id: 'venue-demo', name: 'Groway Arena', city: 'Johannesburg', countryCode: 'ZA', capacity: 5000 },
  })

  const events = [
    { title: 'Amapiano Live Concert', category: 'music', image: '🎵', desc: 'The hottest Amapiano artists live on stage' },
    { title: 'Kaizer Chiefs vs Orlando Pirates', category: 'sports', image: '⚽', desc: 'Soweto Derby at FNB Stadium' },
    { title: 'Dune: Part Two (IMAX)', category: 'movies', image: '🎬', desc: 'Epic sci-fi on the biggest screen' },
    { title: 'Trevor Noah Live', category: 'comedy', image: '🎤', desc: 'South African comedy legend returns home' },
    { title: 'Macbeth by Shakespeare', category: 'theatre', image: '🎭', desc: 'Classic theatre at the Market Theatre' },
    { title: 'Rocking the Daisies Festival', category: 'festival', image: '🎪', desc: 'Music and lifestyle festival' },
  ]

  for (const e of events) {
    const eventId = `evt-${e.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
    const event = await db.ticketingEvent.upsert({
      where: { id: eventId },
      update: {},
      create: {
        id: eventId, organiserId: organiser.id, venueId: venue.id,
        title: e.title, description: e.desc, category: e.category, image: e.image,
        status: 'published', startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        countryCode: 'ZA',
      },
    })

    // Create ticket types
    const regular = await db.ticketingTicketType.upsert({
      where: { id: `tt-${eventId}-regular` },
      update: {},
      create: { id: `tt-${eventId}-regular`, eventId: event.id, name: 'Regular', priceCents: BigInt(15000), currency: 'ZAR', totalQuantity: 1000 },
    })
    const vip = await db.ticketingTicketType.upsert({
      where: { id: `tt-${eventId}-vip` },
      update: {},
      create: { id: `tt-${eventId}-vip`, eventId: event.id, name: 'VIP', priceCents: BigInt(50000), currency: 'ZAR', totalQuantity: 100, multiplier: 1.0 },
    })

    // Create performance with seats
    const perfId = `perf-${eventId}-1`
    const perf = await db.ticketingPerformance.upsert({
      where: { id: perfId },
      update: {},
      create: {
        id: perfId, eventId: event.id, startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'on_sale', seatsTotal: 200, seatsAvailable: 200,
      },
    })

    // Create seats (grid layout A-T x 1-10)
    const rows = 'ABCDEFGHIJKLMNOPQRST'
    for (let r = 0; r < 20; r++) {
      for (let c = 1; c <= 10; c++) {
        const label = `${rows[r]}${c}`
        const priceCents = r < 5 ? BigInt(50000) : r < 10 ? BigInt(25000) : BigInt(15000)
        try {
          await db.ticketingSeat.create({
            data: { performanceId: perf.id, label, section: r < 5 ? 'VIP' : r < 10 ? 'Premium' : 'General', row: rows[r], seatNumber: String(c), state: 'AVAILABLE', priceCents, currency: 'ZAR', updatedAt: new Date() },
          })
        } catch {}
      }
    }
  }

  // Create fee schedule
  await db.ticketingFeeSchedule.upsert({
    where: { countryCode_settlementMode: { countryCode: 'ZA', settlementMode: 'PLATFORM' } },
    update: {},
    create: { countryCode: 'ZA', settlementMode: 'PLATFORM', platformFeePct: 1.5, bookingFeeMinor: BigInt(200) },
  })
}
