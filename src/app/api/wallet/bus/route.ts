import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateReference, generateIdempotencyKey, BUS_OPERATORS, type ApiResponse } from '@/lib/wallet-utils'
import { nanoid } from 'nanoid'

// Bus Operators Extended
const BUS_OPERATORS_EXTENDED = [
  { code: 'GREYHOUND', name: 'Greyhound', logo: '/bus/greyhound.png', isActive: true, rating: 4.2, amenities: ['WiFi', 'USB Charging', 'Reclining Seats', 'Air Conditioning'] },
  { code: 'INTERCAPE', name: 'Intercape', logo: '/bus/intercape.png', isActive: true, rating: 4.4, amenities: ['WiFi', 'USB Charging', 'Reclining Seats', 'Air Conditioning', 'Blankets'] },
  { code: 'ELDORADO', name: 'Eldo Coaches', logo: '/bus/eldorado.png', isActive: true, rating: 4.0, amenities: ['WiFi', 'Air Conditioning', 'Reclining Seats'] },
  { code: 'CITILINER', name: 'Citiliner', logo: '/bus/citiliner.png', isActive: true, rating: 4.1, amenities: ['WiFi', 'Air Conditioning', 'USB Charging'] },
  { code: 'DELTA', name: 'Delta Coaches', logo: '/bus/delta.png', isActive: true, rating: 3.9, amenities: ['Air Conditioning', 'Reclining Seats'] },
  { code: 'BAZ', name: 'BAZ Bus', logo: '/bus/baz.png', isActive: true, rating: 4.5, amenities: ['WiFi', 'USB Charging', 'Luggage Storage', 'Hop-on Hop-off'], isBackpacker: true },
  { code: 'CITYTOLI', name: 'City to City', logo: '/bus/citytocity.png', isActive: true, rating: 3.8, amenities: ['Air Conditioning', 'Reclining Seats'] },
  { code: 'GOLDARROW', name: 'Golden Arrow', logo: '/bus/goldenarrow.png', isActive: true, rating: 3.7, amenities: ['Air Conditioning'], isCommuter: true },
  { code: 'PUTCO', name: 'PUTCO', logo: '/bus/putco.png', isActive: true, rating: 3.5, amenities: ['Air Conditioning'], isCommuter: true },
  { code: 'REAVAYA', name: 'Rea Vaya', logo: '/bus/reavaya.png', isActive: true, rating: 3.6, amenities: [], isBRT: true }
]

// SA Bus Stations/Cities
const SA_BUS_STATIONS = [
  // Gauteng
  { id: 'JHB_PARK', code: 'JHB', name: 'Johannesburg Park Station', city: 'Johannesburg', province: 'Gauteng', lat: -26.2041, lng: 28.0473, isMajor: true },
  { id: 'PTA', code: 'PTA', name: 'Pretoria Station', city: 'Pretoria', province: 'Gauteng', lat: -25.7461, lng: 28.1881, isMajor: true },
  { id: 'JHB_EAST', code: 'JHBE', name: 'Johannesburg Eastgate', city: 'Johannesburg', province: 'Gauteng', lat: -26.1811, lng: 28.1071, isMajor: false },
  { id: 'JHB_SOUTH', code: 'JHBS', name: 'Johannesburg Southgate', city: 'Johannesburg', province: 'Gauteng', lat: -26.2821, lng: 27.9658, isMajor: false },
  { id: 'PTA_NORTH', code: 'PTAN', name: 'Pretoria North', city: 'Pretoria', province: 'Gauteng', lat: -25.6721, lng: 28.1373, isMajor: false },
  
  // Western Cape
  { id: 'CPT', code: 'CPT', name: 'Cape Town Station', city: 'Cape Town', province: 'Western Cape', lat: -33.9249, lng: 18.4241, isMajor: true },
  { id: 'CPT_BELLVILLE', code: 'CPTB', name: 'Cape Town Bellville', city: 'Cape Town', province: 'Western Cape', lat: -33.8985, lng: 18.6334, isMajor: false },
  { id: 'CPT_WORCESTER', code: 'CPTW', name: 'Worcester', city: 'Worcester', province: 'Western Cape', lat: -33.6465, lng: 19.4459, isMajor: false },
  
  // KwaZulu-Natal
  { id: 'DBN', code: 'DBN', name: 'Durban Station', city: 'Durban', province: 'KwaZulu-Natal', lat: -29.8587, lng: 31.0218, isMajor: true },
  { id: 'DBN_PINETOWN', code: 'DBNP', name: 'Durban Pinetown', city: 'Durban', province: 'KwaZulu-Natal', lat: -29.8069, lng: 30.8624, isMajor: false },
  { id: 'PMB', code: 'PMB', name: 'Pietermaritzburg', city: 'Pietermaritzburg', province: 'KwaZulu-Natal', lat: -29.6178, lng: 30.3913, isMajor: false },
  
  // Eastern Cape
  { id: 'PLZ', code: 'PLZ', name: 'Gqeberha Station', city: 'Gqeberha', province: 'Eastern Cape', lat: -33.9608, lng: 25.6022, isMajor: true },
  { id: 'ELS', code: 'ELS', name: 'East London', city: 'East London', province: 'Eastern Cape', lat: -32.9885, lng: 27.9189, isMajor: false },
  
  // Free State
  { id: 'BFN', code: 'BFN', name: 'Bloemfontein Station', city: 'Bloemfontein', province: 'Free State', lat: -29.1211, lng: 26.2140, isMajor: true },
  
  // Limpopo
  { id: 'PTG', code: 'PTG', name: 'Polokwane', city: 'Polokwane', province: 'Limpopo', lat: -23.9045, lng: 29.4679, isMajor: true },
  
  // Mpumalanga
  { id: 'NLP', code: 'NLP', name: 'Nelspruit', city: 'Nelspruit', province: 'Mpumalanga', lat: -25.4653, lng: 30.9783, isMajor: true },
  
  // North West
  { id: 'RUSTENBURG', code: 'RUS', name: 'Rustenburg', city: 'Rustenburg', province: 'North West', lat: -25.6694, lng: 27.2411, isMajor: false },
  
  // Northern Cape
  { id: 'KIM', code: 'KIM', name: 'Kimberley', city: 'Kimberley', province: 'Northern Cape', lat: -28.7281, lng: 24.7499, isMajor: true },
  { id: 'UPINGTON', code: 'UPN', name: 'Upington', city: 'Upington', province: 'Northern Cape', lat: -28.4572, lng: 21.2567, isMajor: false }
]

// Generate QR code for ticket
function generateTicketQR(bookingId: string, ref: string): string {
  const qrData = {
    type: 'bus_ticket',
    bookingId,
    ref,
    timestamp: Date.now()
  }
  return Buffer.from(JSON.stringify(qrData)).toString('base64')
}

// Generate mock bus routes
function generateMockBusRoutes(origin: string, destination: string, date: string, passengers: number) {
  const routes = []
  const operators = BUS_OPERATORS_EXTENDED.filter(o => o.isActive && !o.isCommuter && !o.isBRT)
  const originStation = SA_BUS_STATIONS.find(s => s.code === origin)
  const destStation = SA_BUS_STATIONS.find(s => s.code === destination)
  
  if (!originStation || !destStation) return []

  // Calculate approximate distance and duration
  const latDiff = Math.abs(originStation.lat - destStation.lat)
  const lngDiff = Math.abs(originStation.lng - destStation.lng)
  const distanceKm = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111
  const baseDurationMin = Math.round(60 + distanceKm / 1.2) // Bus speed ~80km/h average

  // Generate 2-5 routes for the day
  const numRoutes = Math.floor(Math.random() * 4) + 2
  const usedTimes = new Set<number>()

  for (let i = 0; i < numRoutes; i++) {
    const operator = operators[Math.floor(Math.random() * operators.length)]
    
    // Generate departure time
    let hour: number
    do {
      hour = Math.floor(Math.random() * 20) + 4 // 4am to midnight
    } while (usedTimes.has(hour))
    usedTimes.add(hour)

    const minute = Math.floor(Math.random() * 4) * 15
    const depTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    
    // Add variability to duration
    const durationVariation = Math.floor(Math.random() * 60) - 30
    const duration = baseDurationMin + durationVariation
    
    const arrHour = Math.floor((hour * 60 + minute + duration) / 60) % 24
    const arrMin = (hour * 60 + minute + duration) % 60
    const arrTime = `${arrHour.toString().padStart(2, '0')}:${arrMin.toString().padStart(2, '0')}`

    // Calculate price
    const basePrice = distanceKm * 0.5 + 100 // R0.50 per km + R100 base
    const operatorFactor = operator.rating / 4
    const timeFactor = (hour >= 6 && hour <= 9) || (hour >= 16 && hour <= 19) ? 1.2 : 1.0
    const price = Math.round(basePrice * operatorFactor * timeFactor * passengers * 100) // in cents

    // Determine service class
    const isLuxury = operator.rating >= 4.3 && Math.random() > 0.5
    const serviceClass = isLuxury ? 'luxury' : 'standard'

    routes.push({
      id: `route_${nanoid(8)}`,
      operator: {
        code: operator.code,
        name: operator.name,
        logo: operator.logo,
        rating: operator.rating,
        amenities: operator.amenities
      },
      origin: {
        code: originStation.code,
        name: originStation.name,
        city: originStation.city
      },
      destination: {
        code: destStation.code,
        name: destStation.name,
        city: destStation.city
      },
      departureDate: date,
      departureTime: depTime,
      arrivalTime: arrTime,
      duration: duration,
      distanceKm: Math.round(distanceKm),
      priceCents: price,
      priceZAR: price / 100,
      availableSeats: Math.floor(Math.random() * 30) + 5,
      serviceClass,
      amenities: isLuxury ? [...operator.amenities, 'Extra Legroom', 'Snacks'] : operator.amenities,
      refundable: Math.random() > 0.3,
      busType: isLuxury ? 'Double Decker' : 'Standard Coach'
    })
  }

  return routes.sort((a, b) => a.priceCents - b.priceCents)
}

// GET - List operators or stations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const origin = searchParams.get('origin')
    const destination = searchParams.get('destination')
    const date = searchParams.get('date')
    const passengers = parseInt(searchParams.get('passengers') || '1')

    if (action === 'operators') {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          operators: BUS_OPERATORS_EXTENDED.filter(o => o.isActive).map(o => ({
            code: o.code,
            name: o.name,
            logo: o.logo,
            rating: o.rating,
            amenities: o.amenities,
            isBackpacker: o.isBackpacker,
            isCommuter: o.isCommuter,
            isBRT: o.isBRT
          }))
        }
      })
    }

    if (action === 'stations') {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          stations: SA_BUS_STATIONS.map(s => ({
            id: s.id,
            code: s.code,
            name: s.name,
            city: s.city,
            province: s.province,
            isMajor: s.isMajor
          })),
          majorStations: SA_BUS_STATIONS.filter(s => s.isMajor),
          stationsByProvince: SA_BUS_STATIONS.reduce((acc, s) => {
            if (!acc[s.province]) acc[s.province] = []
            acc[s.province].push(s)
            return acc
          }, {} as Record<string, typeof SA_BUS_STATIONS>)
        }
      })
    }

    if (action === 'search' && origin && destination && date) {
      const routes = generateMockBusRoutes(origin, destination, date, passengers)
      
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          routes,
          searchParams: {
            origin,
            destination,
            date,
            passengers
          },
          originStation: SA_BUS_STATIONS.find(s => s.code === origin),
          destinationStation: SA_BUS_STATIONS.find(s => s.code === destination)
        }
      })
    }

    // Default response
    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        operators: BUS_OPERATORS_EXTENDED.filter(o => o.isActive),
        stations: SA_BUS_STATIONS
      }
    })
  } catch (error) {
    console.error('Error in bus API:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to process bus request'
    }, { status: 500 })
  }
}

// POST - Search routes or book
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, searchParams, bookingData, idempotencyKey } = body

    if (action === 'search') {
      const { origin, destination, date, passengers = 1 } = searchParams

      if (!origin || !destination || !date) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Origin, destination and date are required'
        }, { status: 400 })
      }
      
      const routes = generateMockBusRoutes(origin, destination, date, passengers)

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          routes,
          searchParams: { origin, destination, date, passengers }
        }
      })
    }

    if (action === 'book') {
      const { route, passengers, contactDetails, paymentMethod, seatNumbers } = bookingData

      if (!route || !passengers || !userId) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Missing required booking information'
        }, { status: 400 })
      }
      
      // Check idempotency
      const idempKey = idempotencyKey || generateIdempotencyKey()
      
      // Generate booking reference
      const bookingRef = generateReference('BUS')
      const bookingId = `bus_booking_${nanoid(12)}`

      // Calculate total
      const basePrice = route.priceCents
      const bookingFee = 2500 // R25 booking fee
      const totalCents = basePrice + bookingFee

      // Generate QR code
      const qrCode = generateTicketQR(bookingId, bookingRef)

      // Create booking record
      const booking = {
        id: bookingId,
        bookingRef,
        userId,
        status: 'confirmed',
        route: {
          operator: route.operator,
          origin: route.origin,
          destination: route.destination,
          departureDate: route.departureDate,
          departureTime: route.departureTime,
          arrivalTime: route.arrivalTime,
          duration: route.duration,
          busType: route.busType
        },
        passengers: passengers.map((p: { firstName: string; lastName: string; idNumber?: string }, idx: number) => ({
          ...p,
          seatNumber: seatNumbers?.[idx] || `${Math.floor(idx / 4) + 1}${String.fromCharCode(65 + (idx % 4))}`,
          ticketNumber: `${route.operator.code}${nanoid(6).toUpperCase()}`
        })),
        pricing: {
          baseFareCents: basePrice,
          bookingFeeCents: bookingFee,
          totalCents,
          currency: 'ZAR'
        },
        contactDetails,
        paymentMethod,
        paymentStatus: 'pending',
        qrCode,
        createdAt: new Date().toISOString(),
        ticketUrl: `/bus/ticket/${bookingRef}`
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

    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })
  } catch (error) {
    console.error('Error in bus POST:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to process bus request'
    }, { status: 500 })
  }
}

// PUT - Update booking (cancel, confirm payment)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, bookingId } = body

    if (action === 'confirm_payment') {
      const paymentRef = generateReference('BUSPAY')
      
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          bookingId,
          paymentStatus: 'paid',
          paymentRef,
          paidAt: new Date().toISOString(),
          ticketIssued: true
        },
        transaction: {
          id: bookingId,
          reference: paymentRef,
          status: 'completed'
        }
      })
    }

    if (action === 'cancel') {
      const cancellationRef = generateReference('BUSCANC')
      
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
    console.error('Error in bus PUT:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to update booking'
    }, { status: 500 })
  }
}
