import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, getUserId, unauthorizedResponse } from '@/lib/auth-context'

// ============================================
// EVENTS & ENTERTAINMENT API
// Movies, concerts, sports, theatre tickets
// ============================================

// Sample events data
const eventsData = [
  // Movies
  {
    id: 'evt-1',
    type: 'movie',
    title: 'Spider-Man: Across the Spider-Verse',
    venue: 'Ster-Kinekor Sandton City',
    venueId: 'sk-sandton',
    date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    time: '18:30',
    price: 95,
    category: 'movies',
    rating: 'PG',
    duration: '2h 20m',
    image: '🎬',
    available: true,
    seats: 150
  },
  {
    id: 'evt-2',
    type: 'movie',
    title: 'Oppenheimer',
    venue: 'Nu Metro Montecasino',
    venueId: 'nm-monte',
    date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    time: '19:00',
    price: 110,
    category: 'movies',
    rating: '16',
    duration: '3h',
    image: '🎬',
    available: true,
    seats: 100
  },
  // Concerts
  {
    id: 'evt-3',
    type: 'concert',
    title: 'Kabza De Small Live',
    venue: 'Sun Arena, Pretoria',
    venueId: 'sun-arena',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    time: '20:00',
    price: 350,
    category: 'concerts',
    image: '🎵',
    available: true,
    seats: 500
  },
  {
    id: 'evt-4',
    type: 'concert',
    title: 'DJ Maphorisa & Tyler ICU',
    venue: 'Constitution Hill, JHB',
    venueId: 'const-hill',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    time: '18:00',
    price: 250,
    category: 'concerts',
    image: '🎤',
    available: true,
    seats: 2000
  },
  // Sports
  {
    id: 'evt-5',
    type: 'sports',
    title: 'Kaizer Chiefs vs Orlando Pirates',
    venue: 'FNB Stadium',
    venueId: 'fnb-stadium',
    date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    time: '15:00',
    price: 150,
    category: 'sports',
    image: '⚽',
    available: true,
    seats: 5000
  },
  {
    id: 'evt-6',
    type: 'sports',
    title: 'Springboks vs All Blacks',
    venue: 'Ellis Park Stadium',
    venueId: 'ellis-park',
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    time: '17:00',
    price: 450,
    category: 'sports',
    image: '🏉',
    available: true,
    seats: 3000
  },
  // Theatre
  {
    id: 'evt-7',
    type: 'theatre',
    title: 'Sarafina! The Musical',
    venue: 'Joburg Theatre',
    venueId: 'joburg-theatre',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    time: '19:30',
    price: 280,
    category: 'theatre',
    image: '🎭',
    available: true,
    seats: 200
  },
  {
    id: 'evt-8',
    type: 'theatre',
    title: 'Lion King',
    venue: 'Teatro at Montecasino',
    venueId: 'teatro-monte',
    date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    time: '20:00',
    price: 450,
    category: 'theatre',
    image: '🦁',
    available: true,
    seats: 150
  },
]

// User bookings
const userBookings = new Map<string, any[]>()

// Venues
const venues = [
  { id: 'sk-sandton', name: 'Ster-Kinekor Sandton City', location: 'Sandton', type: 'cinema' },
  { id: 'nm-monte', name: 'Nu Metro Montecasino', location: 'Fourways', type: 'cinema' },
  { id: 'sun-arena', name: 'Sun Arena', location: 'Pretoria', type: 'arena' },
  { id: 'fnb-stadium', name: 'FNB Stadium', location: 'Soweto', type: 'stadium' },
  { id: 'ellis-park', name: 'Ellis Park Stadium', location: 'Johannesburg', type: 'stadium' },
  { id: 'joburg-theatre', name: 'Joburg Theatre', location: 'Braamfontein', type: 'theatre' },
  { id: 'teatro-monte', name: 'Teatro at Montecasino', location: 'Fourways', type: 'theatre' },
]

export async function GET(request: NextRequest) {
  // Get authenticated context
  const context = await getAuthContext(request)
  
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const category = searchParams.get('category')
  const eventId = searchParams.get('eventId')
  
  // Get userId from params or context
  let userId: string | null = null
  if (context) {
    const userIdResult = getUserId(searchParams, context)
    if (userIdResult instanceof NextResponse) {
      return userIdResult
    }
    userId = userIdResult
  }

  if (action === 'events') {
    let events = eventsData
    if (category && category !== 'all') {
      events = events.filter(e => e.category === category)
    }
    return NextResponse.json({
      success: true,
      events,
      categories: ['all', 'movies', 'concerts', 'sports', 'theatre']
    })
  }

  if (action === 'event' && eventId) {
    const event = eventsData.find(e => e.id === eventId)
    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 })
    }
    return NextResponse.json({
      success: true,
      event,
      venue: venues.find(v => v.id === event.venueId)
    })
  }

  if (action === 'venues') {
    return NextResponse.json({
      success: true,
      venues
    })
  }

  if (action === 'bookings') {
    if (!userId) {
      return unauthorizedResponse()
    }
    const bookings = userBookings.get(userId) || []
    return NextResponse.json({
      success: true,
      bookings
    })
  }

  if (action === 'categories') {
    return NextResponse.json({
      success: true,
      categories: [
        { id: 'all', name: 'All Events', icon: '🎪' },
        { id: 'movies', name: 'Movies', icon: '🎬' },
        { id: 'concerts', name: 'Concerts', icon: '🎵' },
        { id: 'sports', name: 'Sports', icon: '⚽' },
        { id: 'theatre', name: 'Theatre', icon: '🎭' },
        { id: 'festivals', name: 'Festivals', icon: '🎪' },
      ]
    })
  }

  return NextResponse.json({
    success: true,
    message: 'Events API running',
    endpoints: ['events', 'event', 'venues', 'bookings', 'categories']
  })
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated context
    const context = await getAuthContext(request)
    if (!context) {
      return unauthorizedResponse()
    }
    
    const body = await request.json()
    const { action, userId: bodyUserId, eventId, tickets, seatType } = body
    
    // Validate userId - use body param or context
    let userId = bodyUserId
    if (!userId) {
      userId = context.userId
    }
    
    // Security check: ensure user can only access their own data
    if (userId !== context.userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    if (action === 'book') {
      const event = eventsData.find(e => e.id === eventId)
      if (!event) {
        return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 })
      }

      if (event.seats < tickets) {
        return NextResponse.json({ success: false, error: 'Not enough seats available' }, { status: 400 })
      }

      const totalAmount = event.price * tickets
      const booking = {
        id: `booking-${Date.now()}`,
        eventId,
        eventTitle: event.title,
        venue: event.venue,
        date: event.date,
        time: event.time,
        tickets,
        seatType: seatType || 'standard',
        totalAmount,
        status: 'confirmed',
        bookingCode: `GRO-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        bookedAt: new Date().toISOString()
      }

      // Store booking
      const userBookingList = userBookings.get(userId) || []
      userBookingList.push(booking)
      userBookings.set(userId, userBookingList)

      // Update available seats
      event.seats -= tickets

      return NextResponse.json({
        success: true,
        booking,
        message: `Successfully booked ${tickets} ticket(s) for ${event.title}`
      })
    }

    if (action === 'cancel') {
      const { bookingId } = body
      const userBookingList = userBookings.get(userId) || []
      const bookingIndex = userBookingList.findIndex(b => b.id === bookingId)
      
      if (bookingIndex === -1) {
        return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
      }

      const booking = userBookingList[bookingIndex]
      booking.status = 'cancelled'
      booking.cancelledAt = new Date().toISOString()

      // Restore seats
      const event = eventsData.find(e => e.id === booking.eventId)
      if (event) {
        event.seats += booking.tickets
      }

      return NextResponse.json({
        success: true,
        message: 'Booking cancelled successfully',
        refundAmount: booking.totalAmount
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to process booking' }, { status: 500 })
  }
}
