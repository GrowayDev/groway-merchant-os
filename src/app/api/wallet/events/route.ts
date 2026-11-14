import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateReference, generateIdempotencyKey, type ApiResponse } from '@/lib/wallet-utils'
import { nanoid } from 'nanoid'

// SA Venues
const SA_VENUES = [
  { id: 'fgt', name: 'FNB Stadium', city: 'Johannesburg', province: 'Gauteng', capacity: 94736, type: 'stadium' },
  { id: 'ellis', name: 'Ellis Park', city: 'Johannesburg', province: 'Gauteng', capacity: 62569, type: 'stadium' },
  { id: 'lfa', name: 'Loftus Versfeld', city: 'Pretoria', province: 'Gauteng', capacity: 51762, type: 'stadium' },
  { id: 'moses', name: 'Moses Mabhida Stadium', city: 'Durban', province: 'KwaZulu-Natal', capacity: 56000, type: 'stadium' },
  { id: 'cpt_stadium', name: 'Cape Town Stadium', city: 'Cape Town', province: 'Western Cape', capacity: 55000, type: 'stadium' },
  { id: 'sun_arean', name: 'Sun Arena', city: 'Pretoria', province: 'Gauteng', capacity: 8500, type: 'arena' },
  { id: 'ticketpro', name: 'Ticketpro Dome', city: 'Johannesburg', province: 'Gauteng', capacity: 19000, type: 'arena' },
  { id: 'grandwest', name: 'GrandWest Arena', city: 'Cape Town', province: 'Western Cape', capacity: 7000, type: 'arena' },
  { id: 'joburg_theatre', name: 'Joburg Theatre', city: 'Johannesburg', province: 'Gauteng', capacity: 1100, type: 'theatre' },
  { id: 'artscape', name: 'Artscape Theatre', city: 'Cape Town', province: 'Western Cape', capacity: 1400, type: 'theatre' },
  { id: 'playhouse', name: 'Playhouse Theatre', city: 'Durban', province: 'KwaZulu-Natal', capacity: 1200, type: 'theatre' },
  { id: 'parker', name: "Parker's Comedy", city: 'Johannesburg', province: 'Gauteng', capacity: 300, type: 'comedy' },
  { id: 'comedy_central', name: 'Comedy Central Africa', city: 'Johannesburg', province: 'Gauteng', capacity: 500, type: 'comedy' }
]

// Cinema Chains
const CINEMA_CHAINS = [
  { id: 'sterkinekor', name: 'Ster-Kinekor', logo: '/cinema/sterkinekor.png', venues: 52 },
  { id: 'nu_metro', name: 'Nu Metro', logo: '/cinema/numetro.png', venues: 24 },
  { id: 'scene', name: 'Scene at Rosebank', logo: '/cinema/scene.png', venues: 1, isPremium: true },
  { id: 'labia', name: 'The Labia Theatre', logo: '/cinema/labia.png', venues: 1, isIndependent: true }
]

// Mock Events Data
const MOCK_EVENTS = [
  // Concerts
  {
    id: 'concert_001',
    type: 'concert',
    title: 'Cassper Nyovest Live',
    description: 'South African hip-hop sensation live in concert',
    venue: SA_VENUES[0],
    date: '2025-04-15',
    time: '19:00',
    ticketPrices: { general: 35000, vip: 85000, vvip: 150000 },
    availableTickets: 5000,
    image: '/events/cassper.jpg',
    status: 'on_sale',
    genre: 'Hip-Hop'
  },
  {
    id: 'concert_002',
    type: 'concert',
    title: 'Black Coffee World Tour',
    description: 'DJ Black Coffee brings his signature sound',
    venue: SA_VENUES[6],
    date: '2025-05-20',
    time: '20:00',
    ticketPrices: { general: 45000, vip: 120000 },
    availableTickets: 2000,
    image: '/events/blackcoffee.jpg',
    status: 'on_sale',
    genre: 'House'
  },
  {
    id: 'concert_003',
    type: 'concert',
    title: 'Miriam Makeba Tribute',
    description: 'Celebrating the legacy of Mama Africa',
    venue: SA_VENUES[8],
    date: '2025-04-25',
    time: '18:00',
    ticketPrices: { general: 25000, premium: 55000 },
    availableTickets: 800,
    image: '/events/makeba.jpg',
    status: 'on_sale',
    genre: 'Jazz'
  },
  // Sports
  {
    id: 'sports_001',
    type: 'sports',
    title: 'Kaizer Chiefs vs Orlando Pirates',
    description: 'Soweto Derby - Premier Soccer League',
    venue: SA_VENUES[0],
    date: '2025-04-12',
    time: '15:00',
    ticketPrices: { general: 15000, grandstand: 35000, suite: 95000 },
    availableTickets: 25000,
    image: '/events/soweto_derby.jpg',
    status: 'on_sale',
    sport: 'Football'
  },
  {
    id: 'sports_002',
    type: 'sports',
    title: 'Springboks vs All Blacks',
    description: 'Rugby Championship - The Ultimate Rivalry',
    venue: SA_VENUES[0],
    date: '2025-08-09',
    time: '17:05',
    ticketPrices: { general: 45000, premium: 125000, suite: 350000 },
    availableTickets: 40000,
    image: '/events/springboks.jpg',
    status: 'on_sale',
    sport: 'Rugby'
  },
  {
    id: 'sports_003',
    type: 'sports',
    title: 'Proteas T20 International',
    description: 'South Africa vs India T20 Series',
    venue: SA_VENUES[3],
    date: '2025-06-15',
    time: '14:00',
    ticketPrices: { general: 12000, pavilion: 35000 },
    availableTickets: 15000,
    image: '/events/proteas.jpg',
    status: 'on_sale',
    sport: 'Cricket'
  },
  // Theatre
  {
    id: 'theatre_001',
    type: 'theatre',
    title: 'Sarafina! The Musical',
    description: 'The iconic South African musical returns',
    venue: SA_VENUES[8],
    date: '2025-04-10',
    time: '19:30',
    ticketPrices: { general: 20000, premium: 35000 },
    availableTickets: 200,
    image: '/events/sarafina.jpg',
    status: 'on_sale',
    genre: 'Musical'
  },
  {
    id: 'theatre_002',
    type: 'theatre',
    title: 'Lion King Johannesburg',
    description: 'Disney\'s award-winning musical',
    venue: SA_VENUES[8],
    date: '2025-05-01',
    time: '19:00',
    ticketPrices: { general: 45000, premium: 75000 },
    availableTickets: 500,
    image: '/events/lionking.jpg',
    status: 'on_sale',
    genre: 'Musical'
  },
  // Comedy
  {
    id: 'comedy_001',
    type: 'comedy',
    title: 'Trevor Noah Live',
    description: 'An evening with South Africa\'s favorite comedian',
    venue: SA_VENUES[11],
    date: '2025-04-20',
    time: '20:00',
    ticketPrices: { general: 55000, vip: 95000 },
    availableTickets: 280,
    image: '/events/trevor.jpg',
    status: 'on_sale',
    genre: 'Stand-up'
  },
  {
    id: 'comedy_002',
    type: 'comedy',
    title: 'Comedy Central Festival',
    description: 'SA\'s top comedians all on one stage',
    venue: SA_VENUES[12],
    date: '2025-05-10',
    time: '19:00',
    ticketPrices: { general: 25000 },
    availableTickets: 450,
    image: '/events/comedy_fest.jpg',
    status: 'on_sale',
    genre: 'Stand-up'
  }
]

// Mock Movies Data
const MOCK_MOVIES = [
  {
    id: 'movie_001',
    title: 'Spider-Man: Beyond the Spider-Verse',
    genre: 'Animation',
    rating: 'PG',
    duration: 140,
    releaseDate: '2025-04-01',
    poster: '/movies/spiderverse.jpg',
    synopsis: 'Miles Morales continues his journey across the multiverse.',
    status: 'now_showing',
    showtimes: ['10:00', '13:00', '16:00', '19:00', '21:30'],
    prices: { standard: 8500, deluxe: 12000, imax: 18000, '3d': 15000 }
  },
  {
    id: 'movie_002',
    title: 'Mission: Impossible - Dead Reckoning Part 2',
    genre: 'Action',
    rating: 'PG13',
    duration: 155,
    releaseDate: '2025-05-01',
    poster: '/movies/mi.jpg',
    synopsis: 'Ethan Hunt faces his most dangerous mission yet.',
    status: 'now_showing',
    showtimes: ['11:00', '14:30', '18:00', '21:00'],
    prices: { standard: 8500, deluxe: 12000, imax: 18000 }
  },
  {
    id: 'movie_003',
    title: 'Oppenheimer',
    genre: 'Drama',
    rating: 'R',
    duration: 180,
    releaseDate: '2024-07-21',
    poster: '/movies/oppenheimer.jpg',
    synopsis: 'The story of American scientist J. Robert Oppenheimer.',
    status: 'now_showing',
    showtimes: ['12:00', '16:00', '20:00'],
    prices: { standard: 7500, deluxe: 10000 }
  },
  {
    id: 'movie_004',
    title: 'Knuckles',
    genre: 'Comedy',
    rating: 'PG',
    duration: 98,
    releaseDate: '2025-04-05',
    poster: '/movies/knuckles.jpg',
    synopsis: 'Sonic\'s rival gets his own adventure.',
    status: 'now_showing',
    showtimes: ['10:30', '13:30', '16:30', '19:30'],
    prices: { standard: 8500, deluxe: 12000 }
  },
  {
    id: 'movie_005',
    title: 'Dune: Part Three',
    genre: 'Sci-Fi',
    rating: 'PG13',
    duration: 165,
    releaseDate: '2025-11-15',
    poster: '/movies/dune3.jpg',
    synopsis: 'The epic conclusion to the Dune saga.',
    status: 'coming_soon',
    showtimes: [],
    prices: { standard: 9500, imax: 20000 }
  },
  {
    id: 'movie_006',
    title: 'Indlala',
    genre: 'Drama',
    rating: 'PG13',
    duration: 120,
    releaseDate: '2025-03-28',
    poster: '/movies/indlala.jpg',
    synopsis: 'A powerful South African story of resilience and hope.',
    status: 'now_showing',
    showtimes: ['11:30', '14:00', '17:00', '20:00'],
    prices: { standard: 7000, deluxe: 10000 }
  }
]

// Generate QR code for ticket
function generateEventTicketQR(bookingId: string, ref: string): string {
  const qrData = {
    type: 'event_ticket',
    bookingId,
    ref,
    timestamp: Date.now()
  }
  return Buffer.from(JSON.stringify(qrData)).toString('base64')
}

// GET - List events or movies
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const type = searchParams.get('type')
    const movieId = searchParams.get('movieId')
    const eventId = searchParams.get('eventId')

    if (action === 'movies') {
      if (movieId) {
        const movie = MOCK_MOVIES.find(m => m.id === movieId)
        if (!movie) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Movie not found'
          }, { status: 404 })
        }
        return NextResponse.json<ApiResponse>({
          success: true,
          data: {
            movie,
            cinemas: CINEMA_CHAINS,
            venues: SA_VENUES.filter(v => v.type !== 'stadium')
          }
        })
      }

      const nowShowing = MOCK_MOVIES.filter(m => m.status === 'now_showing')
      const comingSoon = MOCK_MOVIES.filter(m => m.status === 'coming_soon')

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          nowShowing,
          comingSoon,
          cinemas: CINEMA_CHAINS,
          genres: ['Action', 'Comedy', 'Drama', 'Sci-Fi', 'Animation', 'Horror', 'Romance']
        }
      })
    }

    if (action === 'events') {
      if (eventId) {
        const event = MOCK_EVENTS.find(e => e.id === eventId)
        if (!event) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Event not found'
          }, { status: 404 })
        }
        return NextResponse.json<ApiResponse>({
          success: true,
          data: {
            event,
            venue: event.venue,
            relatedEvents: MOCK_EVENTS.filter(e => e.type === event.type && e.id !== event.id).slice(0, 3)
          }
        })
      }

      let events = MOCK_EVENTS
      if (type && type !== 'all') {
        events = MOCK_EVENTS.filter(e => e.type === type)
      }

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          events,
          types: [
            { id: 'concert', name: 'Concerts', icon: 'Music' },
            { id: 'sports', name: 'Sports', icon: 'Trophy' },
            { id: 'theatre', name: 'Theatre', icon: 'Theater' },
            { id: 'comedy', name: 'Comedy', icon: 'Laugh' }
          ],
          venues: SA_VENUES
        }
      })
    }

    if (action === 'venues') {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          venues: SA_VENUES,
          byType: {
            stadiums: SA_VENUES.filter(v => v.type === 'stadium'),
            arenas: SA_VENUES.filter(v => v.type === 'arena'),
            theatres: SA_VENUES.filter(v => v.type === 'theatre'),
            comedy: SA_VENUES.filter(v => v.type === 'comedy')
          }
        }
      })
    }

    // Default response
    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        events: MOCK_EVENTS,
        movies: MOCK_MOVIES.filter(m => m.status === 'now_showing'),
        cinemas: CINEMA_CHAINS
      }
    })
  } catch (error) {
    console.error('Error in events API:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch events'
    }, { status: 500 })
  }
}

// POST - Book event or movie ticket
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, bookingType, id, tickets, showtime, date, cinemaId, venueId, idempotencyKey } = body

    if (action === 'book') {
      if (!userId || !bookingType || !id || !tickets) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Missing required booking information'
        }, { status: 400 })
      }

      // Check idempotency
      const idempKey = idempotencyKey || generateIdempotencyKey()
      
      // Generate booking reference
      const bookingRef = generateReference(bookingType === 'movie' ? 'MOV' : 'EVT')
      const bookingId = `${bookingType}_booking_${nanoid(12)}`

      if (bookingType === 'movie') {
        const movie = MOCK_MOVIES.find(m => m.id === id)
        if (!movie) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Movie not found'
          }, { status: 404 })
        }

        const cinema = CINEMA_CHAINS.find(c => c.id === cinemaId) || CINEMA_CHAINS[0]
        const pricePerTicket = movie.prices.standard // Default to standard
        const totalCents = pricePerTicket * tickets.length

        // Generate seat numbers
        const seats = tickets.map((_: unknown, idx: number) => 
          `${Math.floor(idx / 10) + 1}${String.fromCharCode(65 + (idx % 10))}`
        )

        // Generate QR code
        const qrCode = generateEventTicketQR(bookingId, bookingRef)

        const booking = {
          id: bookingId,
          bookingRef,
          userId,
          type: 'movie',
          status: 'confirmed',
          movie: {
            id: movie.id,
            title: movie.title,
            genre: movie.genre,
            rating: movie.rating,
            duration: movie.duration,
            poster: movie.poster
          },
          cinema: {
            id: cinema.id,
            name: cinema.name
          },
          showtime,
          date,
          seats,
          tickets: tickets.length,
          pricing: {
            pricePerTicketCents: pricePerTicket,
            totalCents,
            currency: 'ZAR'
          },
          qrCode,
          createdAt: new Date().toISOString(),
          ticketUrl: `/movies/ticket/${bookingRef}`
        }

        return NextResponse.json<ApiResponse>({
          success: true,
          data: {
            ...booking,
            qrCodeDataUrl: `data:image/svg+xml;base64,${qrCode}`
          },
          transaction: {
            id: bookingId,
            reference: bookingRef,
            status: 'confirmed',
            confirmationUrl: booking.ticketUrl
          }
        })
      }

      if (bookingType === 'event') {
        const event = MOCK_EVENTS.find(e => e.id === id)
        if (!event) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Event not found'
          }, { status: 404 })
        }

        // Calculate price based on ticket type
        const ticketType = tickets[0]?.type || 'general'
        const pricePerTicket = event.ticketPrices[ticketType as keyof typeof event.ticketPrices] || event.ticketPrices.general
        const totalCents = pricePerTicket * tickets.length

        // Generate QR code
        const qrCode = generateEventTicketQR(bookingId, bookingRef)

        const booking = {
          id: bookingId,
          bookingRef,
          userId,
          type: 'event',
          status: 'confirmed',
          event: {
            id: event.id,
            title: event.title,
            type: event.type,
            venue: event.venue,
            date: event.date,
            time: event.time,
            image: event.image
          },
          tickets: tickets.map((t: { type: string; name?: string }, idx: number) => ({
            type: t.type,
            seatNumber: `${event.venue.name.split(' ')[0]}-${idx + 1}`,
            holderName: t.name
          })),
          ticketType,
          pricing: {
            pricePerTicketCents: pricePerTicket,
            totalCents,
            bookingFeeCents: 2500,
            grandTotalCents: totalCents + 2500,
            currency: 'ZAR'
          },
          qrCode,
          createdAt: new Date().toISOString(),
          ticketUrl: `/events/ticket/${bookingRef}`
        }

        return NextResponse.json<ApiResponse>({
          success: true,
          data: {
            ...booking,
            qrCodeDataUrl: `data:image/svg+xml;base64,${qrCode}`
          },
          transaction: {
            id: bookingId,
            reference: bookingRef,
            status: 'confirmed',
            confirmationUrl: booking.ticketUrl
          }
        })
      }
    }

    if (action === 'check_seats') {
      // Simulate seat availability check
      const availableSeats = Math.floor(Math.random() * 50) + 20

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          id,
          showtime,
          date,
          availableSeats,
          totalSeats: 100,
          seatMap: generateMockSeatMap(availableSeats)
        }
      })
    }

    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })
  } catch (error) {
    console.error('Error in events POST:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to process booking'
    }, { status: 500 })
  }
}

// Generate mock seat map
function generateMockSeatMap(availableSeats: number): Array<{ row: string; seat: number; status: string }> {
  const seats = []
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  let availableCount = 0

  for (const row of rows) {
    for (let seat = 1; seat <= 12; seat++) {
      const isAvailable = availableCount < availableSeats && Math.random() > 0.3
      if (isAvailable) availableCount++
      seats.push({
        row,
        seat,
        status: isAvailable ? 'available' : 'taken'
      })
    }
  }

  return seats
}

// PUT - Update booking (cancel, confirm payment)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, bookingId } = body

    if (action === 'confirm_payment') {
      const paymentRef = generateReference('EVTPAY')
      
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          bookingId,
          paymentStatus: 'paid',
          paymentRef,
          paidAt: new Date().toISOString(),
          ticketsIssued: true
        },
        transaction: {
          id: bookingId,
          reference: paymentRef,
          status: 'completed'
        }
      })
    }

    if (action === 'cancel') {
      const cancellationRef = generateReference('EVTCANC')
      
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          bookingId,
          status: 'cancelled',
          cancelledAt: new Date().toISOString(),
          cancellationRef,
          refundAmount: 0,
          refundStatus: 'processing'
        },
        transaction: {
          id: bookingId,
          reference: cancellationRef,
          status: 'cancelled'
        }
      })
    }

    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })
  } catch (error) {
    console.error('Error in events PUT:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to update booking'
    }, { status: 500 })
  }
}
