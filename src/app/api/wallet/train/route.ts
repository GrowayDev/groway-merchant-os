import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateReference, generateIdempotencyKey, GAUTRAIN_STATIONS, type ApiResponse } from '@/lib/wallet-utils'
import { nanoid } from 'nanoid'

// Gautrain Stations Extended with full details
const GAUTRAIN_STATIONS_EXTENDED = [
  { code: 'HBF', name: 'Hatfield', line: 'north', city: 'Pretoria', lat: -25.7498, lng: 28.2373, zone: 1, hasParking: true },
  { code: 'PTN', name: 'Pretoria', line: 'north', city: 'Pretoria', lat: -25.7461, lng: 28.1881, zone: 1, hasParking: true },
  { code: 'CEN', name: 'Centurion', line: 'north', city: 'Centurion', lat: -25.8547, lng: 28.1865, zone: 2, hasParking: true },
  { code: 'MID', name: 'Midrand', line: 'north', city: 'Midrand', lat: -25.9894, lng: 28.1283, zone: 3, hasParking: true },
  { code: 'MAR', name: 'Marlboro', line: 'north', city: 'Johannesburg', lat: -26.0997, lng: 28.0997, zone: 4, hasParking: false },
  { code: 'SAN', name: 'Sandton', line: 'north', city: 'Johannesburg', lat: -26.1076, lng: 28.0567, zone: 4, hasParking: true },
  { code: 'ROS', name: 'Rosebank', line: 'north', city: 'Johannesburg', lat: -26.1478, lng: 28.0436, zone: 5, hasParking: false },
  { code: 'PKT', name: 'Park Station', line: 'north', city: 'Johannesburg', lat: -26.2041, lng: 28.0473, zone: 5, hasParking: false },
  { code: 'RHO', name: 'Rhodesfield', line: 'east', city: 'Kempton Park', lat: -26.1356, lng: 28.1497, zone: 4, hasParking: true },
  { code: 'ORT', name: 'OR Tambo Airport', line: 'east', city: 'Johannesburg', lat: -26.1392, lng: 28.2460, zone: 4, hasParking: false }
]

// PRASA (Metrorail) Stations - Major ones
const PRASA_STATIONS = [
  // Gauteng
  { code: 'PRK', name: 'Pretoria Station', line: 'gauteng_north', city: 'Pretoria', province: 'Gauteng', isMajor: true },
  { code: 'JOB', name: 'Johannesburg Park', line: 'gauteng_central', city: 'Johannesburg', province: 'Gauteng', isMajor: true },
  { code: 'GJR', name: 'Germiston', line: 'gauteng_east', city: 'Germiston', province: 'Gauteng', isMajor: false },
  { code: 'SPR', name: 'Springs', line: 'gauteng_east', city: 'Springs', province: 'Gauteng', isMajor: false },
  { code: 'KEM', name: 'Kempton Park', line: 'gauteng_east', city: 'Kempton Park', province: 'Gauteng', isMajor: false },
  { code: 'PTA_NORTH', name: 'Pretoria North', line: 'gauteng_north', city: 'Pretoria', province: 'Gauteng', isMajor: false },
  
  // Western Cape
  { code: 'CPT', name: 'Cape Town Station', line: 'western_cape', city: 'Cape Town', province: 'Western Cape', isMajor: true },
  { code: 'BLL', name: 'Bellville', line: 'western_cape', city: 'Cape Town', province: 'Western Cape', isMajor: true },
  { code: 'STL', name: 'Stellenbosch', line: 'western_cape', city: 'Stellenbosch', province: 'Western Cape', isMajor: false },
  { code: 'WYN', name: 'Wynberg', line: 'western_cape', city: 'Cape Town', province: 'Western Cape', isMajor: false },
  
  // KwaZulu-Natal
  { code: 'DBN', name: 'Durban Station', line: 'kwazulu_natal', city: 'Durban', province: 'KwaZulu-Natal', isMajor: true },
  { code: 'PMB', name: 'Pietermaritzburg', line: 'kwazulu_natal', city: 'Pietermaritzburg', province: 'KwaZulu-Natal', isMajor: true },
  { code: 'KZN_SOUTH', name: 'Kingsburgh', line: 'kwazulu_natal', city: 'Durban', province: 'KwaZulu-Natal', isMajor: false },
  
  // Eastern Cape
  { code: 'PLZ', name: 'Gqeberha Station', line: 'eastern_cape', city: 'Gqeberha', province: 'Eastern Cape', isMajor: true },
  { code: 'ELS', name: 'East London', line: 'eastern_cape', city: 'East London', province: 'Eastern Cape', isMajor: true }
]

// PRASA Long Distance Trains (Shosholoza Meyl)
const PRASA_LONG_DISTANCE = [
  { id: 'PREMIUM_DUR_JHB', name: 'Premier Classe Durban-Johannesburg', route: 'Durban - Johannesburg', frequency: 'Weekly', type: 'premiere' },
  { id: 'PREMIUM_CPT_JHB', name: 'Premier Classe Cape Town-Johannesburg', route: 'Cape Town - Johannesburg', frequency: 'Weekly', type: 'premiere' },
  { id: 'SHOSHOLOZA_DUR', name: 'Shosholoza Meyl Durban', route: 'Durban - Johannesburg', frequency: 'Daily', type: 'economy' },
  { id: 'SHOSHOLOZA_CPT', name: 'Shosholoza Meyl Cape Town', route: 'Cape Town - Johannesburg', frequency: 'Daily', type: 'economy' },
  { id: 'SHOSHOLOZA_EAST', name: 'Shosholoza Meyl Eastern', route: 'Johannesburg - East London', frequency: 'Weekly', type: 'economy' }
]

// Gautrain Fares (in cents)
const GAUTRAIN_FARES: Record<string, Record<string, number>> = {
  'HBF': { 'PTN': 2100, 'CEN': 3800, 'MID': 5200, 'MAR': 6100, 'SAN': 6500, 'ROS': 7000, 'PKT': 7500, 'RHO': 6800, 'ORT': 8500 },
  'PTN': { 'HBF': 2100, 'CEN': 2900, 'MID': 4500, 'MAR': 5400, 'SAN': 5800, 'ROS': 6300, 'PKT': 6800, 'RHO': 6100, 'ORT': 7800 },
  'CEN': { 'HBF': 3800, 'PTN': 2900, 'MID': 2800, 'MAR': 3700, 'SAN': 4100, 'ROS': 4600, 'PKT': 5100, 'RHO': 4400, 'ORT': 6100 },
  'MID': { 'HBF': 5200, 'PTN': 4500, 'CEN': 2800, 'MAR': 2100, 'SAN': 2500, 'ROS': 3000, 'PKT': 3500, 'RHO': 2800, 'ORT': 4500 },
  'MAR': { 'HBF': 6100, 'PTN': 5400, 'CEN': 3700, 'MID': 2100, 'SAN': 1500, 'ROS': 2000, 'PKT': 2500, 'RHO': 1600, 'ORT': 3300 },
  'SAN': { 'HBF': 6500, 'PTN': 5800, 'CEN': 4100, 'MID': 2500, 'MAR': 1500, 'ROS': 1700, 'PKT': 2200, 'RHO': 1800, 'ORT': 2800 },
  'ROS': { 'HBF': 7000, 'PTN': 6300, 'CEN': 4600, 'MID': 3000, 'MAR': 2000, 'SAN': 1700, 'PKT': 1100, 'RHO': 2500, 'ORT': 3600 },
  'PKT': { 'HBF': 7500, 'PTN': 6800, 'CEN': 5100, 'MID': 3500, 'MAR': 2500, 'SAN': 2200, 'ROS': 1100, 'RHO': 3200, 'ORT': 4300 },
  'RHO': { 'HBF': 6800, 'PTN': 6100, 'CEN': 4400, 'MID': 2800, 'MAR': 1600, 'SAN': 1800, 'ROS': 2500, 'PKT': 3200, 'ORT': 1500 },
  'ORT': { 'HBF': 8500, 'PTN': 7800, 'CEN': 6100, 'MID': 4500, 'MAR': 3300, 'SAN': 2800, 'ROS': 3600, 'PKT': 4300, 'RHO': 1500 }
}

// Generate QR code for train ticket
function generateTrainTicketQR(bookingId: string, ref: string, origin: string, destination: string): string {
  const qrData = {
    type: 'train_ticket',
    bookingId,
    ref,
    origin,
    destination,
    timestamp: Date.now(),
    validFor: 24 * 60 * 60 * 1000 // 24 hours
  }
  return Buffer.from(JSON.stringify(qrData)).toString('base64')
}

// Calculate Gautrain fare
function calculateGautrainFare(origin: string, destination: string, ticketType: string = 'single'): number {
  const baseFare = GAUTRAIN_FARES[origin]?.[destination] || 5000
  const multiplier = ticketType === 'return' ? 1.9 : ticketType === 'weekly' ? 8 : ticketType === 'monthly' ? 28 : 1
  return Math.round(baseFare * multiplier)
}

// GET - List stations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const system = searchParams.get('system') || 'gautrain'
    const origin = searchParams.get('origin')
    const destination = searchParams.get('destination')

    if (action === 'stations') {
      if (system === 'gautrain') {
        return NextResponse.json<ApiResponse>({
          success: true,
          data: {
            system: 'gautrain',
            stations: GAUTRAIN_STATIONS_EXTENDED,
            lines: [
              { name: 'North-South Line', stations: ['HBF', 'PTN', 'CEN', 'MID', 'MAR', 'SAN', 'ROS', 'PKT'] },
              { name: 'East-West Line (Airport)', stations: ['SAN', 'MAR', 'RHO', 'ORT'] }
            ],
            operatingHours: {
              weekdays: '05:30 - 20:30',
              weekends: '06:00 - 20:00',
              frequency: 'Every 10-20 minutes'
            },
            fares: GAUTRAIN_FARES
          }
        })
      } else if (system === 'prasa') {
        return NextResponse.json<ApiResponse>({
          success: true,
          data: {
            system: 'prasa',
            stations: PRASA_STATIONS,
            longDistanceTrains: PRASA_LONG_DISTANCE,
            commuterLines: [
              { name: 'Gauteng North', stations: PRASA_STATIONS.filter(s => s.line === 'gauteng_north') },
              { name: 'Gauteng Central', stations: PRASA_STATIONS.filter(s => s.line === 'gauteng_central') },
              { name: 'Gauteng East', stations: PRASA_STATIONS.filter(s => s.line === 'gauteng_east') },
              { name: 'Western Cape', stations: PRASA_STATIONS.filter(s => s.line === 'western_cape') },
              { name: 'KwaZulu-Natal', stations: PRASA_STATIONS.filter(s => s.line === 'kwazulu_natal') }
            ]
          }
        })
      }
    }

    if (action === 'fare' && origin && destination) {
      const fare = calculateGautrainFare(origin, destination)
      const returnFare = calculateGautrainFare(origin, destination, 'return')
      const weeklyFare = calculateGautrainFare(origin, destination, 'weekly')
      const monthlyFare = calculateGautrainFare(origin, destination, 'monthly')

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          origin: GAUTRAIN_STATIONS_EXTENDED.find(s => s.code === origin),
          destination: GAUTRAIN_STATIONS_EXTENDED.find(s => s.code === destination),
          fares: {
            single: fare / 100,
            return: returnFare / 100,
            weekly: weeklyFare / 100,
            monthly: monthlyFare / 100
          },
          faresCents: {
            single: fare,
            return: returnFare,
            weekly: weeklyFare,
            monthly: monthlyFare
          },
          travelTime: calculateTravelTime(origin, destination)
        }
      })
    }

    // Default: return all stations
    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        gautrain: GAUTRAIN_STATIONS_EXTENDED,
        prasa: PRASA_STATIONS,
        longDistance: PRASA_LONG_DISTANCE
      }
    })
  } catch (error) {
    console.error('Error in train API:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to process train request'
    }, { status: 500 })
  }
}

// Calculate travel time between stations
function calculateTravelTime(origin: string, destination: string): number {
  // Approximate times based on zones
  const stations = GAUTRAIN_STATIONS_EXTENDED
  const originStation = stations.find(s => s.code === origin)
  const destStation = stations.find(s => s.code === destination)
  
  if (!originStation || !destStation) return 30
  
  const zoneDiff = Math.abs(originStation.zone - destStation.zone)
  return zoneDiff * 8 + 5 // ~8 min per zone + base time
}

// POST - Book train ticket
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, system, origin, destination, ticketType, travelDate, returnDate, passengers, idempotencyKey } = body

    if (action === 'book') {
      if (!userId || !origin || !destination || !ticketType) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Missing required booking information'
        }, { status: 400 })
      }

      // Check idempotency
      const idempKey = idempotencyKey || generateIdempotencyKey()
      
      // Generate booking reference
      const bookingRef = generateReference('TRN')
      const bookingId = `train_booking_${nanoid(12)}`

      if (system === 'gautrain' || !system) {
        const fareCents = calculateGautrainFare(origin, destination, ticketType)
        const bookingFee = 500 // R5 booking fee
        const totalCents = (fareCents + bookingFee) * (passengers || 1)

        // Generate QR code
        const qrCode = generateTrainTicketQR(bookingId, bookingRef, origin, destination)

        const booking = {
          id: bookingId,
          bookingRef,
          userId,
          system: 'gautrain',
          status: 'confirmed',
          ticket: {
            type: ticketType,
            origin: GAUTRAIN_STATIONS_EXTENDED.find(s => s.code === origin),
            destination: GAUTRAIN_STATIONS_EXTENDED.find(s => s.code === destination),
            travelDate,
            returnDate: ticketType === 'return' ? returnDate : null,
            validFrom: new Date(travelDate || Date.now()).toISOString(),
            validUntil: ticketType === 'monthly' 
              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          },
          passengers: passengers || 1,
          pricing: {
            fareCents,
            bookingFeeCents: bookingFee,
            totalCents,
            currency: 'ZAR'
          },
          qrCode,
          travelTime: calculateTravelTime(origin, destination),
          createdAt: new Date().toISOString(),
          ticketUrl: `/train/ticket/${bookingRef}`
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

      // PRASA Long Distance booking
      if (system === 'prasa_longdistance') {
        const train = PRASA_LONG_DISTANCE.find(t => t.id === body.trainId)
        if (!train) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Train not found'
          }, { status: 404 })
          }
        
        const baseFare = train.type === 'premiere' ? 120000 : 45000 // Premiere vs Economy
        const totalCents = baseFare * (passengers || 1)

        const booking = {
          id: bookingId,
          bookingRef,
          userId,
          system: 'prasa_longdistance',
          status: 'confirmed',
          train: {
            id: train.id,
            name: train.name,
            route: train.route,
            type: train.type
          },
          travelDate,
          passengers: passengers || 1,
          pricing: {
            fareCents: baseFare,
            totalCents,
            currency: 'ZAR'
          },
          createdAt: new Date().toISOString()
        }

        return NextResponse.json<ApiResponse>({
          success: true,
          data: booking,
          transaction: {
            id: bookingId,
            reference: bookingRef,
            status: 'confirmed'
          }
        })
      }
    }

    if (action === 'check_capacity') {
      // Simulate checking train capacity
      const capacity = Math.floor(Math.random() * 50) + 100
      const available = Math.floor(Math.random() * 30) + 10

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          origin,
          destination,
          travelDate,
          capacity,
          available,
          recommended: available < 20
        }
      })
    }

    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })
  } catch (error) {
    console.error('Error in train POST:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to process train booking'
    }, { status: 500 })
  }
}

// PUT - Update booking (cancel, confirm payment)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, bookingId } = body

    if (action === 'confirm_payment') {
      const paymentRef = generateReference('TRNPAY')
      
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
      const cancellationRef = generateReference('TRNCANC')
      
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
    console.error('Error in train PUT:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to update booking'
    }, { status: 500 })
  }
}
