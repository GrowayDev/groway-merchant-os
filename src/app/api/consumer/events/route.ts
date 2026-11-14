import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { getUserId, ok, error } from '../_lib/helpers'
import { ensureConsumerUser } from '../_lib/ensureUser'
import {
  EVENT_CATEGORIES,
  MOVIE_CHAINS,
  EVENT_TICKET_TYPES,
  generateReceiptNo,
} from '@/lib/consumer-wallet/catalog'

/**
 * /api/consumer/events
 *
 * Browse events (concerts, sports, movies, comedy, theatre, festivals) and
 * buy tickets. Uses EVENT_CATEGORIES and MOVIE_CHAINS from the catalog.
 *
 * GET  ?category=music|sports|movies|comedy|theatre|festivals
 *      -> { categories, events: [...] }
 *
 * POST { eventId, ticketType, quantity }
 *      -> Creates a ConsumerTransaction (type='event_ticket'),
 *         returns { ticketNo, qrCode, event, tickets, totalAmount, receiptNo }
 */

interface EventItem {
  id: string
  category: string
  type: string
  title: string
  venue: string
  venueId: string
  city: string
  date: string // ISO
  dateLabel: string
  time: string
  durationMinutes: number
  ageRating: string
  image: string
  description: string
  basePriceCents: bigint
  basePriceLabel: string
  availableTickets: number
  seatMap: boolean
  performer?: string
}

// Generate events for the current month (and next, to ensure availability).
function buildEvents(categoryFilter?: string): EventItem[] {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  // Helper to make an ISO date at day D, this month (or next)
  const dateAt = (day: number, monthOffset = 0): string => {
    const d = new Date(year, month + monthOffset, day, 19, 30, 0, 0)
    return d.toISOString()
  }
  const dateLabel = (iso: string): string => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-ZA', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const all: EventItem[] = []

  // --- Movies (use MOVIE_CHAINS) ---
  const movieTitles = [
    { title: 'Wicked: The Movie', rating: 'PG', duration: 160 },
    { title: 'Dune: Part Three', rating: '13', duration: 165 },
    { title: 'Spider-Man: Beyond the Spider-Verse', rating: 'PG', duration: 140 },
    { title: 'Oppenheimer Re-release', rating: '16', duration: 180 },
    { title: 'Amapiano: The Documentary', rating: '13', duration: 95 },
    { title: 'Sarafina! 4K Restoration', rating: 'PG', duration: 117 },
  ]
  const movieDays = [3, 6, 9, 12, 15, 18, 21, 24, 27]
  let movieIdx = 0
  for (const chain of MOVIE_CHAINS) {
    for (const venue of chain.venues) {
      // 2 movies per venue per month
      for (let k = 0; k < 2; k++) {
        const movie = movieTitles[(movieIdx + k) % movieTitles.length]
        const day = movieDays[(movieIdx * 2 + k) % movieDays.length]
        const iso = dateAt(day, movieIdx > 3 ? 1 : 0)
        all.push({
          id: `EVT-MOV-${chain.id}-${venue.id}-${movieIdx}-${k}`,
          category: 'movies',
          type: 'movie',
          title: movie.title,
          venue: `${chain.name} ${venue.name}`,
          venueId: venue.id,
          city: venue.location,
          date: iso,
          dateLabel: dateLabel(iso),
          time: k === 0 ? '18:30' : '20:45',
          durationMinutes: movie.duration,
          ageRating: movie.rating,
          image: '🎬',
          description: `${movie.title} — showing at ${chain.name} ${venue.name}. Runtime ${movie.duration} min. Age restriction ${movie.rating}.`,
          basePriceCents: BigInt(9500),
          basePriceLabel: 'R 95.00',
          availableTickets: 80 + ((movieIdx + k) % 4) * 30,
          seatMap: true,
        })
        movieIdx++
      }
    }
  }

  // --- Music events ---
  const musicEvents = [
    { title: 'Kabza De Small Live', performer: 'Kabza De Small', venue: 'Sun Arena', city: 'Pretoria', price: 350, age: '13', dur: 240 },
    { title: 'DJ Maphorisa & Tyler ICU', performer: 'DJ Maphorisa', venue: 'Constitution Hill', city: 'Johannesburg', price: 280, age: '13', dur: 300 },
    { title: 'Burna Boy Live in Cape Town', performer: 'Burna Boy', venue: 'Grand Arena', city: 'Cape Town', price: 650, age: '13', dur: 180 },
    { title: 'Miriam Makeba Tribute Concert', performer: 'Various Artists', venue: 'Joburg Theatre', city: 'Johannesburg', price: 320, age: 'PG', dur: 150 },
    { title: 'Amapiano to the World Festival', performer: 'Multiple DJs', venue: 'Nasrec Expo Centre', city: 'Johannesburg', price: 450, age: '18', dur: 480 },
  ]
  musicEvents.forEach((m, i) => {
    const day = 5 + i * 4
    const iso = dateAt(day, i > 3 ? 1 : 0)
    all.push({
      id: `EVT-MUS-${i + 1}`,
      category: 'music',
      type: 'concert',
      title: m.title,
      performer: m.performer,
      venue: m.venue,
      venueId: `venue-${i}`,
      city: m.city,
      date: iso,
      dateLabel: dateLabel(iso),
      time: ['18:00', '19:30', '20:00', '17:00', '14:00'][i % 5],
      durationMinutes: m.dur,
      ageRating: m.age,
      image: '🎵',
      description: `${m.title} — live performance by ${m.performer} at ${m.venue}, ${m.city}.`,
      basePriceCents: BigInt(Math.round(m.price * 100)),
      basePriceLabel: `R ${m.price}.00`,
      availableTickets: 200 + (i % 4) * 400,
      seatMap: true,
    })
  })

  // --- Sports ---
  const sportsEvents = [
    { title: 'Kaizer Chiefs vs Orlando Pirates', venue: 'FNB Stadium', city: 'Soweto', price: 150, age: 'PG', dur: 105, sport: 'Football' },
    { title: 'Springboks vs All Blacks', venue: 'Ellis Park Stadium', city: 'Johannesburg', price: 450, age: 'PG', dur: 100, sport: 'Rugby' },
    { title: 'Proteas vs India ODI', venue: 'Wanderers Stadium', city: 'Johannesburg', price: 220, age: 'PG', dur: 480, sport: 'Cricket' },
    { title: 'DSTV Premiership: Sundowns vs Chiefs', venue: 'Loftus Versfeld', city: 'Pretoria', price: 120, age: 'PG', dur: 105, sport: 'Football' },
    { title: 'Boxing: African Cruiserweight Title', venue: 'Sun City Superbowl', city: 'North West', price: 380, age: '16', dur: 180, sport: 'Boxing' },
  ]
  sportsEvents.forEach((s, i) => {
    const day = 7 + i * 5
    const iso = dateAt(day, i > 3 ? 1 : 0)
    all.push({
      id: `EVT-SPT-${i + 1}`,
      category: 'sports',
      type: s.sport.toLowerCase(),
      title: s.title,
      venue: s.venue,
      venueId: `sport-${i}`,
      city: s.city,
      date: iso,
      dateLabel: dateLabel(iso),
      time: ['15:00', '17:00', '13:00', '19:00', '20:00'][i % 5],
      durationMinutes: s.dur,
      ageRating: s.age,
      image: ['⚽', '🏉', '🏏', '⚽', '🥊'][i % 5],
      description: `${s.title} — ${s.sport} at ${s.venue}, ${s.city}.`,
      basePriceCents: BigInt(Math.round(s.price * 100)),
      basePriceLabel: `R ${s.price}.00`,
      availableTickets: 500 + (i % 4) * 1500,
      seatMap: true,
    })
  })

  // --- Theatre ---
  const theatreEvents = [
    { title: 'Sarafina! The Musical', venue: 'Joburg Theatre', city: 'Braamfontein', price: 280, age: 'PG', dur: 150 },
    { title: 'Lion King', venue: 'Teatro at Montecasino', city: 'Fourways', price: 450, age: 'PG', dur: 165 },
    { title: 'The Color Purple', venue: 'Artscape Theatre', city: 'Cape Town', price: 320, age: '13', dur: 150 },
    { title: 'Sophiatown Reimagined', venue: 'Market Theatre', city: 'Johannesburg', price: 220, age: '13', dur: 120 },
  ]
  theatreEvents.forEach((t, i) => {
    const day = 8 + i * 6
    const iso = dateAt(day, i > 2 ? 1 : 0)
    all.push({
      id: `EVT-THR-${i + 1}`,
      category: 'theatre',
      type: 'musical',
      title: t.title,
      venue: t.venue,
      venueId: `theatre-${i}`,
      city: t.city,
      date: iso,
      dateLabel: dateLabel(iso),
      time: '19:30',
      durationMinutes: t.dur,
      ageRating: t.age,
      image: '🎭',
      description: `${t.title} — stage production at ${t.venue}, ${t.city}.`,
      basePriceCents: BigInt(Math.round(t.price * 100)),
      basePriceLabel: `R ${t.price}.00`,
      availableTickets: 100 + (i % 3) * 80,
      seatMap: true,
    })
  })

  // --- Comedy ---
  const comedyEvents = [
    { title: 'Trevor Noah Live', venue: 'Sun Arena', city: 'Pretoria', price: 550, age: '16', dur: 120 },
    { title: 'Laugh Club: Trevor Gumbi & Friends', venue: 'Parker\'s Comedy Club', city: 'Johannesburg', price: 180, age: '18', dur: 90 },
    { title: 'Comedy Central Live SA', venue: 'Grand Arena', city: 'Cape Town', price: 320, age: '16', dur: 150 },
  ]
  comedyEvents.forEach((c, i) => {
    const day = 10 + i * 7
    const iso = dateAt(day, i > 1 ? 1 : 0)
    all.push({
      id: `EVT-CMD-${i + 1}`,
      category: 'comedy',
      type: 'stand-up',
      title: c.title,
      venue: c.venue,
      venueId: `comedy-${i}`,
      city: c.city,
      date: iso,
      dateLabel: dateLabel(iso),
      time: '20:00',
      durationMinutes: c.dur,
      ageRating: c.age,
      image: '😂',
      description: `${c.title} — stand-up comedy at ${c.venue}, ${c.city}.`,
      basePriceCents: BigInt(Math.round(c.price * 100)),
      basePriceLabel: `R ${c.price}.00`,
      availableTickets: 200 + (i % 3) * 300,
      seatMap: true,
    })
  })

  // --- Festivals ---
  const festivals = [
    { title: 'Cape Town International Jazz Festival', venue: 'Cape Town ICC', city: 'Cape Town', price: 750, age: '13', dur: 600 },
    { title: 'Oppikoppi Awakening', venue: 'Oppikoppi Farm', city: 'Northam', price: 950, age: '18', dur: 2880 },
    { title: 'National Arts Festival', venue: 'Various venues', city: 'Makhanda', price: 250, age: 'PG', dur: 4320 },
    { title: 'Rocking the Daisies', venue: 'Cloof Wine Estate', city: 'Darling', price: 850, age: '18', dur: 2880 },
  ]
  festivals.forEach((f, i) => {
    const day = 14 + i * 4
    const iso = dateAt(day, i > 2 ? 1 : 0)
    all.push({
      id: `EVT-FST-${i + 1}`,
      category: 'festivals',
      type: 'festival',
      title: f.title,
      venue: f.venue,
      venueId: `fest-${i}`,
      city: f.city,
      date: iso,
      dateLabel: dateLabel(iso),
      time: '12:00',
      durationMinutes: f.dur,
      ageRating: f.age,
      image: '🎪',
      description: `${f.title} — multi-day festival at ${f.venue}, ${f.city}.`,
      basePriceCents: BigInt(Math.round(f.price * 100)),
      basePriceLabel: `R ${f.price}.00`,
      availableTickets: 1000 + (i % 3) * 1500,
      seatMap: false,
    })
  })

  // Sort by date
  all.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  if (categoryFilter && categoryFilter !== 'all') {
    return all.filter((e) => e.category === categoryFilter)
  }
  return all
}

// 8-char ticket number
function generateTicketNo(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let ref = ''
  const bytes = randomBytes(8)
  for (let i = 0; i < 8; i++) ref += chars[bytes[i] % chars.length]
  return `EVT-${ref}`
}

// QR code placeholder: a deterministic-looking base64-ish string
function generateQRPlaceholder(seed: string): string {
  // Use the seed to generate a stable-looking "QR" content payload
  // In production this would call a real QR generator or a ticketing API.
  const payload = `GROWAY-EVT|${seed}|${Date.now()}`
  const encoded = Buffer.from(payload).toString('base64')
  return `data:text/plain;base64,${encoded}`
}

// Determine price for a given event + ticket type
function priceFor(event: EventItem, ticketTypeValue: string): bigint {
  const tt = EVENT_TICKET_TYPES.find((t) => t.value === ticketTypeValue)
  const mult = tt ? tt.multiplier : 1.0
  return BigInt(Math.round(Number(event.basePriceCents) * mult))
}

// Determine seat assignment if applicable
function assignSeat(event: EventItem, idx: number): string | null {
  if (!event.seatMap) return null
  const row = String.fromCharCode(65 + (idx % 12)) // A-L
  const seatNum = 1 + (idx % 30)
  return `${row}${seatNum}`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || undefined

    const events = buildEvents(category)

    return ok({
      categories: EVENT_CATEGORIES,
      ticketTypes: EVENT_TICKET_TYPES,
      movieChains: MOVIE_CHAINS,
      events: events.map((e) => ({
        ...e,
        basePriceCents: e.basePriceCents.toString(),
      })),
    })
  } catch (err) {
    console.error('Events GET error:', err)
    return error('Failed to fetch events', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await request.json()
    const { eventId, ticketType, quantity } = (body || {}) as {
      eventId: string
      ticketType: string
      quantity: number
    }

    if (!eventId) return error('eventId is required', 400)
    if (!ticketType) return error('ticketType is required', 400)
    const tt = EVENT_TICKET_TYPES.find((t) => t.value === ticketType)
    if (!tt) return error(`Invalid ticketType (allowed: ${EVENT_TICKET_TYPES.map((t) => t.value).join(', ')})`, 400)
    const qty = Number(quantity)
    if (!Number.isFinite(qty) || qty < 1) return error('quantity must be a positive integer', 400)
    if (qty > 20) return error('Maximum 20 tickets per booking', 400)

    // Locate event in any category
    const allEvents = buildEvents()
    const event = allEvents.find((e) => e.id === eventId)
    if (!event) return error('Event not found', 404)
    if (event.availableTickets < qty) {
      return error(`Only ${event.availableTickets} tickets remaining`, 400)
    }

    const unitPrice = priceFor(event, ticketType)
    const totalCents = unitPrice * BigInt(qty)

    const ticketNo = generateTicketNo()
    const qrCode = generateQRPlaceholder(ticketNo)
    const receiptNo = generateReceiptNo('EVT')
    const txId = `tx-${randomBytes(8).toString('hex')}`

    // Ensure the consumer user row exists so the FK constraint is satisfied.
    await ensureConsumerUser(userId)

    await db.consumerTransaction.create({
      data: {
        id: txId,
        idempotencyKey: `${ticketNo}-${userId}`,
        userId,
        transactionType: 'event_ticket',
        direction: 'debit',
        amountCents: totalCents,
        feeCents: BigInt(0),
        netAmountCents: totalCents,
        currency: 'ZAR',
        status: 'completed',
        description: `${event.title} — ${qty} x ${tt.label} (${event.venue})`,
        reference: ticketNo,
        category: 'entertainment',
        counterpartyId: event.venueId,
        counterpartyName: event.venue,
        counterpartyType: 'venue',
        paymentMethod: 'wallet',
        providerRef: ticketNo,
        voucherToken: qrCode, // store the QR payload
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    const tickets = Array.from({ length: qty }, (_, i) => ({
      sequence: i + 1,
      seat: assignSeat(event, i),
      ticketType: tt.value,
      ticketTypeLabel: tt.label,
      holderName: null,
      entryCode: `${ticketNo}-${i + 1}`,
    }))

    return ok({
      ticketNo,
      qrCode,
      receiptNo,
      event: {
        id: event.id,
        title: event.title,
        venue: event.venue,
        city: event.city,
        date: event.date,
        dateLabel: event.dateLabel,
        time: event.time,
        durationMinutes: event.durationMinutes,
        ageRating: event.ageRating,
        category: event.category,
        image: event.image,
      },
      ticketType: { value: tt.value, label: tt.label, desc: tt.desc },
      tickets,
      totalAmount: totalCents.toString(),
      unitPrice: unitPrice.toString(),
      currency: 'ZAR',
      transactionId: txId,
      notice: 'Tickets are non-refundable. Present the QR code at the venue entrance. Age restrictions apply.',
    })
  } catch (err) {
    console.error('Events POST error:', err)
    return error('Failed to purchase event tickets', 500)
  }
}
