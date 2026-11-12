import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateReference, generateIdempotencyKey, SA_AIRPORTS, SA_AIRLINES, type ApiResponse } from '@/lib/wallet-utils'
import { nanoid } from 'nanoid'

// Extended airports data with all SA airports
const SA_AIRPORTS_EXTENDED = [
  { code: 'JNB', name: 'OR Tambo International', city: 'Johannesburg', province: 'Gauteng', lat: -26.1392, lng: 28.2460, isMajor: true },
  { code: 'CPT', name: 'Cape Town International', city: 'Cape Town', province: 'Western Cape', lat: -33.9649, lng: 18.6017, isMajor: true },
  { code: 'DUR', name: 'King Shaka International', city: 'Durban', province: 'KwaZulu-Natal', lat: -29.6144, lng: 31.1197, isMajor: true },
  { code: 'HLA', name: 'Lanseria International', city: 'Johannesburg', province: 'Gauteng', lat: -25.9361, lng: 27.9303, isMajor: true },
  { code: 'PLZ', name: 'Chief Dawid Stuurman International', city: 'Gqeberha', province: 'Eastern Cape', lat: -33.9813, lng: 25.6109, isMajor: false },
  { code: 'GRJ', name: 'George Airport', city: 'George', province: 'Western Cape', lat: -34.0075, lng: 22.3784, isMajor: false },
  { code: 'ELS', name: 'East London Airport', city: 'East London', province: 'Eastern Cape', lat: -32.9911, lng: 27.8258, isMajor: false },
  { code: 'BFN', name: 'Bram Fischer International', city: 'Bloemfontein', province: 'Free State', lat: -29.0928, lng: 26.3013, isMajor: false },
  { code: 'PRY', name: 'Wonderboom Airport', city: 'Pretoria', province: 'Gauteng', lat: -25.6561, lng: 28.2261, isMajor: false },
  { code: 'KIM', name: 'Kimberley Airport', city: 'Kimberley', province: 'Northern Cape', lat: -28.4767, lng: 24.7681, isMajor: false },
  { code: 'PTG', name: 'Polokwane International', city: 'Polokwane', province: 'Limpopo', lat: -23.8444, lng: 29.4533, isMajor: false },
  { code: 'MQP', name: 'Kruger Mpumalanga International', city: 'Nelspruit', province: 'Mpumalanga', lat: -25.5108, lng: 31.0919, isMajor: false },
  { code: 'UTT', name: 'Mthatha Airport', city: 'Mthatha', province: 'Eastern Cape', lat: -31.5458, lng: 28.6744, isMajor: false },
  { code: 'SZK', name: 'Skukuza Airport', city: 'Skukuza', province: 'Mpumalanga', lat: -24.9944, lng: 31.5856, isMajor: false },
  { code: 'UPU', name: 'Upington Airport', city: 'Upington', province: 'Northern Cape', lat: -28.4058, lng: 21.2603, isMajor: false }
]

// Extended airlines data
const SA_AIRLINES_EXTENDED = [
  { code: 'SA', name: 'South African Airways', iata: 'SA', icao: 'SAA', logo: '/airlines/saa.png', isActive: true, isLowCost: false },
  { code: 'FA', name: 'FlySafair', iata: 'FA', icao: 'SFA', logo: '/airlines/safair.png', isActive: true, isLowCost: true },
  { code: '4Z', name: 'Airlink', iata: '4Z', icao: 'LNK', logo: '/airlines/airlink.png', isActive: true, isLowCost: false },
  { code: '5Z', name: 'CemAir', iata: '5Z', icao: 'CEM', logo: '/airlines/cemair.png', isActive: true, isLowCost: false },
  { code: 'BA', name: 'British Airways (Comair)', iata: 'BA', icao: 'BCA', logo: '/airlines/ba.png', isActive: false, isLowCost: false },
  { code: 'MN', name: 'Kulula', iata: 'MN', icao: 'CAW', logo: '/airlines/kulula.png', isActive: false, isLowCost: true },
  { code: 'H4', name: 'FlyCemair', iata: 'H4', icao: 'H4C', logo: '/airlines/h4.png', isActive: true, isLowCost: false }
]

// Generate mock flights
function generateMockFlights(origin: string, destination: string, date: string, passengers: number) {
  const flights = []
  const airlines = SA_AIRLINES_EXTENDED.filter(a => a.isActive)
  const originAirport = SA_AIRPORTS_EXTENDED.find(a => a.code === origin)
  const destAirport = SA_AIRPORTS_EXTENDED.find(a => a.code === destination)
  
  if (!originAirport || !destAirport) return []

  // Calculate approximate flight duration based on distance
  const latDiff = Math.abs(originAirport.lat - destAirport.lat)
  const lngDiff = Math.abs(originAirport.lng - destAirport.lng)
  const distanceKm = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111
  const baseDurationMin = Math.round(60 + distanceKm / 10) // ~60min base + distance factor

  // Generate 3-6 flights for the day
  const numFlights = Math.floor(Math.random() * 4) + 3
  const usedTimes = new Set<number>()

  for (let i = 0; i < numFlights; i++) {
    const airline = airlines[Math.floor(Math.random() * airlines.length)]
    
    // Generate departure time
    let hour: number
    do {
      hour = Math.floor(Math.random() * 18) + 5 // 5am to 11pm
    } while (usedTimes.has(hour))
    usedTimes.add(hour)

    const minute = Math.floor(Math.random() * 4) * 15
    const depTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    
    // Add some variability to duration
    const durationVariation = Math.floor(Math.random() * 30) - 15
    const duration = baseDurationMin + durationVariation
    
    const arrHour = Math.floor((hour * 60 + minute + duration) / 60) % 24
    const arrMin = (hour * 60 + minute + duration) % 60
    const arrTime = `${arrHour.toString().padStart(2, '0')}:${arrMin.toString().padStart(2, '0')}`

    // Calculate price (distance-based with airline variation)
    const basePrice = distanceKm * 0.8 + 300 // Base price per km + flat fee
    const airlineFactor = airline.isLowCost ? 0.7 : 1.0
    const timeFactor = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19) ? 1.3 : 1.0
    const price = Math.round(basePrice * airlineFactor * timeFactor * passengers * 100) // in cents

    const flightNumber = `${airline.iata}${Math.floor(Math.random() * 9000) + 100}`

    flights.push({
      id: `flight_${nanoid(8)}`,
      flightNumber,
      airline: {
        code: airline.code,
        name: airline.name,
        iata: airline.iata,
        logo: airline.logo,
        isLowCost: airline.isLowCost
      },
      origin: {
        code: originAirport.code,
        name: originAirport.name,
        city: originAirport.city
      },
      destination: {
        code: destAirport.code,
        name: destAirport.name,
        city: destAirport.city
      },
      departureDate: date,
      departureTime: depTime,
      arrivalTime: arrTime,
      duration: duration,
      aircraft: ['Boeing 737-800', 'Airbus A320', 'Boeing 737 MAX 8', 'Embraer ERJ-145'][Math.floor(Math.random() * 4)],
      priceCents: price,
      priceZAR: price / 100,
      availableSeats: Math.floor(Math.random() * 50) + 5,
      class: 'economy',
      stops: 0,
      refundable: !airline.isLowCost && Math.random() > 0.5,
      baggageIncluded: airline.isLowCost ? '7kg carry-on' : '23kg checked + 7kg carry-on'
    })
  }

  // Sort by price
  return flights.sort((a, b) => a.priceCents - b.priceCents)
}

// GET - List airports or airlines
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const origin = searchParams.get('origin')
    const destination = searchParams.get('destination')
    const date = searchParams.get('date')
    const passengers = parseInt(searchParams.get('passengers') || '1')

    if (action === 'airports') {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          airports: SA_AIRPORTS_EXTENDED.map(a => ({
            code: a.code,
            name: a.name,
            city: a.city,
            province: a.province,
            isMajor: a.isMajor
          })),
          majorAirports: SA_AIRPORTS_EXTENDED.filter(a => a.isMajor).map(a => ({
            code: a.code,
            name: a.name,
            city: a.city
          }))
        }
      })
    }

    if (action === 'airlines') {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          airlines: SA_AIRLINES_EXTENDED.filter(a => a.isActive).map(a => ({
            code: a.code,
            name: a.name,
            iata: a.iata,
            logo: a.logo,
            isLowCost: a.isLowCost
          })),
          allAirlines: SA_AIRLINES_EXTENDED
        }
      })
    }

    if (action === 'search' && origin && destination && date) {
      const flights = generateMockFlights(origin, destination, date, passengers)
      
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          flights,
          searchParams: {
            origin,
            destination,
            date,
            passengers
          },
          originAirport: SA_AIRPORTS_EXTENDED.find(a => a.code === origin),
          destinationAirport: SA_AIRPORTS_EXTENDED.find(a => a.code === destination)
        }
      })
    }

    // Default: return airports and airlines
    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        airports: SA_AIRPORTS_EXTENDED,
        airlines: SA_AIRLINES_EXTENDED.filter(a => a.isActive)
      }
    })
  } catch (error) {
    console.error('Error in flights API:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to process flights request'
    }, { status: 500 })
  }
}

// POST - Search flights or book
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, searchParams, bookingData, idempotencyKey } = body

    if (action === 'search') {
      const { origin, destination, date, passengers = 1, returnDate, flightClass = 'economy' } = searchParams

      if (!origin || !destination || !date) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Origin, destination and date are required'
        }, { status: 400 })
        }
      
      const flights = generateMockFlights(origin, destination, date, passengers)
      
      let returnFlights = null
      if (returnDate) {
        returnFlights = generateMockFlights(destination, origin, returnDate, passengers)
      }

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          flights,
          returnFlights,
          searchParams: {
            origin,
            destination,
            date,
            passengers,
            returnDate,
            flightClass
          }
        }
      })
    }

    if (action === 'book') {
      const { flight, passengers, contactDetails, paymentMethod } = bookingData

      if (!flight || !passengers || !userId) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Missing required booking information'
        }, { status: 400 })
        }
      
      // Check idempotency
      const idempKey = idempotencyKey || generateIdempotencyKey()
      
      // Generate booking reference
      const bookingRef = generateReference('FLT')
      const bookingId = `booking_${nanoid(12)}`

      // Calculate total
      const basePrice = flight.priceCents
      const taxesFees = Math.round(basePrice * 0.15) // 15% taxes and fees
      const totalCents = basePrice + taxesFees

      // Create booking record
      const booking = {
        id: bookingId,
        bookingRef,
        userId,
        status: 'confirmed',
        flight: {
          flightNumber: flight.flightNumber,
          airline: flight.airline,
          origin: flight.origin,
          destination: flight.destination,
          departureDate: flight.departureDate,
          departureTime: flight.departureTime,
          arrivalTime: flight.arrivalTime,
          duration: flight.duration,
          aircraft: flight.aircraft
        },
        passengers: passengers.map((p: { firstName: string; lastName: string; idNumber?: string; seatPreference?: string }, idx: number) => ({
          ...p,
          seatNumber: `${String.fromCharCode(65 + Math.floor(idx / 6))}${(idx % 6) + 1}`,
          ticketNumber: `${flight.flightNumber}${nanoid(6).toUpperCase()}`
        })),
        pricing: {
          baseFareCents: basePrice,
          taxesFeesCents: taxesFees,
          totalCents,
          currency: 'ZAR'
        },
        contactDetails,
        paymentMethod,
        paymentStatus: 'pending',
        createdAt: new Date().toISOString(),
        eTicketIssued: false,
        confirmationUrl: `/flights/booking/${bookingRef}`
      }

      return NextResponse.json<ApiResponse>({
        success: true,
        data: booking,
        transaction: {
          id: bookingId,
          reference: bookingRef,
          status: 'confirmed',
          confirmationUrl: booking.confirmationUrl
        }
      })
    }

    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })
  } catch (error) {
    console.error('Error in flights POST:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to process flights request'
    }, { status: 500 })
  }
}

// PUT - Update booking (cancel, modify)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, bookingId, paymentConfirmed } = body

    if (action === 'confirm_payment') {
      const paymentRef = generateReference('FLPAY')
      
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          bookingId,
          paymentStatus: 'paid',
          paymentRef,
          paidAt: new Date().toISOString(),
          eTicketIssued: true,
          eTicketUrl: `/flights/eticket/${bookingId}`
        },
        transaction: {
          id: bookingId,
          reference: paymentRef,
          status: 'completed'
        }
      })
    }

    if (action === 'cancel') {
      const cancellationRef = generateReference('FLTCANC')
      
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          bookingId,
          status: 'cancelled',
          cancelledAt: new Date().toISOString(),
          cancellationRef,
          refundAmount: 0, // Would calculate based on fare rules
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
    console.error('Error in flights PUT:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to update booking'
    }, { status: 500 })
  }
}
