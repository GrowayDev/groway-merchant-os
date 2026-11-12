import { NextRequest, NextResponse } from 'next/server'

// ============================================
// TRAVEL & TRANSPORT API - PORT 3020
// ============================================

// South African Airports with IATA codes
const SA_AIRPORTS = [
  // Major International
  { code: 'JNB', name: 'O.R. Tambo International', city: 'Johannesburg', province: 'Gauteng', type: 'international' },
  { code: 'CPT', name: 'Cape Town International', city: 'Cape Town', province: 'Western Cape', type: 'international' },
  { code: 'DUR', name: 'King Shaka International', city: 'Durban', province: 'KwaZulu-Natal', type: 'international' },
  // Domestic Airports
  { code: 'PLZ', name: 'Chief Dawid Stuurman', city: 'Port Elizabeth', province: 'Eastern Cape', type: 'domestic' },
  { code: 'ELS', name: 'King Phalo Airport', city: 'East London', province: 'Eastern Cape', type: 'domestic' },
  { code: 'GRJ', name: 'George Airport', city: 'George', province: 'Western Cape', type: 'domestic' },
  { code: 'KIM', name: 'Kimberley Airport', city: 'Kimberley', province: 'Northern Cape', type: 'domestic' },
  { code: 'BFN', name: 'Bram Fischer International', city: 'Bloemfontein', province: 'Free State', type: 'domestic' },
  { code: 'PTA', name: 'Wonderboom Airport', city: 'Pretoria', province: 'Gauteng', type: 'domestic' },
  { code: 'POL', name: 'Polokwane International', city: 'Polokwane', province: 'Limpopo', type: 'domestic' },
  { code: 'MQP', name: 'Kruger Mpumalanga International', city: 'Nelspruit', province: 'Mpumalanga', type: 'domestic' },
  { code: 'LDA', name: 'Lanseria International', city: 'Johannesburg', province: 'Gauteng', type: 'domestic' },
  { code: 'UTN', name: 'Upington Airport', city: 'Upington', province: 'Northern Cape', type: 'domestic' },
  { code: 'SIS', name: 'Sishen Airport', city: 'Sishen', province: 'Northern Cape', type: 'domestic' },
  { code: 'MGH', name: 'Mafikeng Airport', city: 'Mafikeng', province: 'North West', type: 'domestic' },
]

// South African Airlines
const SA_AIRLINES = [
  { code: 'SA', name: 'South African Airways', type: 'flag_carrier', logo: 'SAA' },
  { code: 'MN', name: 'Mango Airlines', type: 'low_cost', logo: 'Mango' },
  { code: 'FA', name: 'FlySafair', type: 'low_cost', logo: 'Safair' },
  { code: 'BA', name: 'British Airways (Comair)', type: 'full_service', logo: 'BA' },
  { code: '4Z', name: 'Airlink', type: 'regional', logo: 'Airlink' },
  { code: 'LIFT', name: 'LIFT Airlines', type: 'hybrid', logo: 'LIFT' },
  { code: 'CR', name: 'CemAir', type: 'regional', logo: 'CemAir' },
]

// Bus Services - Intercity
const BUS_OPERATORS = [
  { id: 'intercape', name: 'Intercape', logo: 'INT', color: '#003399', routes: 150, rating: 4.2 },
  { id: 'greyhound', name: 'Greyhound', logo: 'GRY', color: '#1B4F72', routes: 80, rating: 4.0 },
  { id: 'eldo', name: 'Eldo Coaches', logo: 'ELD', color: '#FF6600', routes: 45, rating: 4.1 },
  { id: 'citiliner', name: 'Citiliner', logo: 'CTY', color: '#E74C3C', routes: 35, rating: 3.9 },
  { id: 'apm', name: 'APM', logo: 'APM', color: '#27AE60', routes: 25, rating: 4.3 },
  { id: 'eagle', name: 'Eagle Liner', logo: 'EGL', color: '#8E44AD', routes: 30, rating: 3.8 },
  { id: 'basil', name: 'Basil Comfort', logo: 'BAS', color: '#D35400', routes: 20, rating: 4.0 },
  { id: 'delta', name: 'Delta Coaches', logo: 'DLT', color: '#2980B9', routes: 15, rating: 3.7 },
]

// Train Services
const TRAIN_OPERATORS = [
  { 
    id: 'rovos', 
    name: 'Rovos Rail', 
    type: 'luxury',
    logo: 'ROV',
    color: '#8B4513',
    description: 'The Pride of Africa - Luxury rail safaris',
    routes: ['Pretoria to Cape Town', 'Pretoria to Victoria Falls', 'Cape Town to Dar es Salaam'],
    priceRange: 'R35,000 - R95,000',
    rating: 4.9
  },
  { 
    id: 'blue', 
    name: 'The Blue Train', 
    type: 'luxury',
    logo: 'BLU',
    color: '#1E3A5F',
    description: 'Africa\'s premier luxury train experience',
    routes: ['Pretoria to Cape Town', 'Cape Town to Pretoria'],
    priceRange: 'R18,000 - R28,000',
    rating: 4.8
  },
  { 
    id: 'metrorail', 
    name: 'PRASA Metrorail', 
    type: 'commuter',
    logo: 'MET',
    color: '#2E7D32',
    description: 'Urban commuter rail services',
    routes: ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape'],
    priceRange: 'R7 - R50',
    rating: 3.2
  },
  { 
    id: 'gautrain', 
    name: 'Gautrain', 
    type: 'rapid',
    logo: 'GAU',
    color: '#0077C8',
    description: 'Gauteng rapid rail network',
    routes: ['OR Tambo to Pretoria', 'OR Tambo to Rosebank', 'Sandton to Midrand'],
    priceRange: 'R21 - R75',
    rating: 4.6
  },
  { 
    id: 'shosholoza', 
    name: 'Shosholoza Meyl', 
    type: 'intercity',
    logo: 'SHO',
    color: '#DAA520',
    description: 'Long-distance passenger rail',
    routes: ['Johannesburg to Cape Town', 'Johannesburg to Durban'],
    priceRange: 'R200 - R1,500',
    rating: 3.5
  },
]

// Airport Lounges
const AIRPORT_LOUNGES = [
  {
    id: 'bidvest-jnb',
    name: 'Bidvest Premier Lounge',
    airport: 'JNB',
    terminal: 'International Departures',
    price: 450,
    amenities: ['WiFi', 'Food & Beverages', 'Shower', 'Spa', 'Sleep Pods'],
    rating: 4.5,
    hours: '24/7'
  },
  {
    id: 'saa-cpt',
    name: 'SAA Mango Lounge',
    airport: 'CPT',
    terminal: 'Domestic Departures',
    price: 320,
    amenities: ['WiFi', 'Food & Beverages', 'Bar'],
    rating: 4.2,
    hours: '05:00 - 21:00'
  },
  {
    id: 'bidvest-dur',
    name: 'Bidvest Premier Lounge',
    airport: 'DUR',
    terminal: 'International Departures',
    price: 380,
    amenities: ['WiFi', 'Food & Beverages', 'Shower'],
    rating: 4.3,
    hours: '06:00 - 20:00'
  },
  {
    id: 'ascend-jnb',
    name: 'Ascend Lounge',
    airport: 'JNB',
    terminal: 'Domestic Departures',
    price: 350,
    amenities: ['WiFi', 'Food & Beverages', 'Business Center'],
    rating: 4.1,
    hours: '05:00 - 22:00'
  },
]

// International Remittance Providers
const REMITTANCE_PROVIDERS = [
  { id: 'chipper', name: 'Chipper Cash', logo: 'CHIP', color: '#00C853', fee: '1.5%', speed: 'Instant', countries: ['NG', 'GH', 'KE', 'UG', 'RW', 'ZA'] },
  { id: 'mukuru', name: 'Mukuru', logo: 'MUK', color: '#FF6B00', fee: '2.0%', speed: '1-2 hours', countries: ['ZW', 'ZM', 'MW', 'MZ', 'BW', 'LS', 'SZ'] },
  { id: 'terrapay', name: 'TerraPay', logo: 'TER', color: '#1E88E5', fee: '1.8%', speed: 'Instant', countries: ['Global'] },
  { id: 'worldremit', name: 'WorldRemit', logo: 'WR', color: '#6C3483', fee: '2.5%', speed: '1-24 hours', countries: ['Global'] },
  { id: 'interafrica', name: 'InterAfrica', logo: 'IAF', color: '#C0392B', fee: '1.2%', speed: 'Same day', countries: ['ZW', 'MW', 'MZ', 'ZM'] },
]

// Voucher Providers
const VOUCHER_PROVIDERS = [
  { id: 'google-play', name: 'Google Play', logo: 'GP', color: '#4285F4', denominations: [25, 50, 100, 150, 300, 500] },
  { id: 'itunes', name: 'Apple iTunes', logo: 'IT', color: '#E63946', denominations: [25, 50, 100, 150, 200, 500] },
  { id: 'netflix', name: 'Netflix', logo: 'NF', color: '#E50914', denominations: [99, 159, 199] },
  { id: 'spotify', name: 'Spotify', logo: 'SP', color: '#1DB954', denominations: [59, 99, 149] },
  { id: 'playstation', name: 'PlayStation Store', logo: 'PS', color: '#003791', denominations: [150, 300, 500, 750] },
  { id: 'xbox', name: 'Xbox Gift Card', logo: 'XB', color: '#107C10', denominations: [150, 300, 500, 750] },
  { id: 'steam', name: 'Steam Wallet', logo: 'ST', color: '#1B2838', denominations: [100, 200, 300, 500] },
  { id: 'amazon', name: 'Amazon.co.za', logo: 'AMZ', color: '#FF9900', denominations: [100, 200, 500, 1000] },
  { id: 'uber', name: 'Uber', logo: 'UB', color: '#000000', denominations: [50, 100, 200, 500] },
  { id: 'takealot', name: 'Takealot', logo: 'TK', color: '#2E86AB', denominations: [50, 100, 200, 500, 1000] },
  { id: 'checkers', name: 'Checkers Gift Card', logo: 'CHK', color: '#FF6600', denominations: [50, 100, 200, 500] },
  { id: 'woolworths', name: 'Woolworths WCard', logo: 'WW', color: '#1B365D', denominations: [50, 100, 200, 500] },
]

// Flight routes with pricing
const FLIGHT_ROUTES = [
  { from: 'JNB', to: 'CPT', duration: '2h 00m', airlines: ['SA', 'FA', 'MN', 'LIFT'], priceFrom: 799 },
  { from: 'JNB', to: 'DUR', duration: '1h 10m', airlines: ['SA', 'FA', 'MN', 'BA'], priceFrom: 599 },
  { from: 'CPT', to: 'JNB', duration: '2h 00m', airlines: ['SA', 'FA', 'MN', 'LIFT'], priceFrom: 849 },
  { from: 'CPT', to: 'DUR', duration: '1h 45m', airlines: ['SA', 'FA'], priceFrom: 999 },
  { from: 'DUR', to: 'CPT', duration: '1h 45m', airlines: ['SA', 'FA'], priceFrom: 1099 },
  { from: 'JNB', to: 'PLZ', duration: '1h 45m', airlines: ['SA', '4Z'], priceFrom: 1199 },
  { from: 'JNB', to: 'ELS', duration: '1h 25m', airlines: ['SA', '4Z'], priceFrom: 1299 },
  { from: 'JNB', to: 'GRJ', duration: '2h 00m', airlines: ['SA', '4Z'], priceFrom: 1399 },
  { from: 'JNB', to: 'BFN', duration: '1h 00m', airlines: ['SA', '4Z'], priceFrom: 899 },
  { from: 'JNB', to: 'MQP', duration: '1h 00m', airlines: ['SA', '4Z'], priceFrom: 999 },
]

// Bus routes
const BUS_ROUTES = [
  { from: 'Johannesburg', to: 'Cape Town', duration: '18h 00m', operators: ['intercape', 'greyhound', 'eldo'], priceFrom: 450 },
  { from: 'Johannesburg', to: 'Durban', duration: '7h 00m', operators: ['intercape', 'greyhound', 'eldo'], priceFrom: 280 },
  { from: 'Johannesburg', to: 'Bloemfontein', duration: '5h 30m', operators: ['intercape', 'greyhound'], priceFrom: 220 },
  { from: 'Johannesburg', to: 'Polokwane', duration: '5h 00m', operators: ['intercape', 'eagle'], priceFrom: 200 },
  { from: 'Cape Town', to: 'George', duration: '6h 00m', operators: ['intercape', 'greyhound'], priceFrom: 300 },
  { from: 'Cape Town', to: 'Port Elizabeth', duration: '10h 00m', operators: ['intercape', 'greyhound'], priceFrom: 380 },
  { from: 'Durban', to: 'Cape Town', duration: '18h 00m', operators: ['intercape', 'greyhound'], priceFrom: 480 },
]

export async function GET(request: NextRequest) {
  const { searchParams } = request.URL ? new URL(request.url) : new URL(request.url, 'http://localhost')
  const action = searchParams.get('action')

  try {
    switch (action) {
      case 'airports':
        return NextResponse.json({ success: true, data: SA_AIRPORTS })

      case 'airlines':
        return NextResponse.json({ success: true, data: SA_AIRLINES })

      case 'flights-search':
        const fromCode = searchParams.get('from') || 'JNB'
        const toCode = searchParams.get('to') || 'CPT'
        return NextResponse.json({
          success: true,
          data: {
            from: SA_AIRPORTS.find(a => a.code === fromCode),
            to: SA_AIRPORTS.find(a => a.code === toCode),
            flights: [
              { id: 'FL001', airline: 'FA', flightNumber: 'FA202', departure: '06:00', arrival: '08:00', price: 899, seats: 45 },
              { id: 'FL002', airline: 'SA', flightNumber: 'SA303', departure: '07:30', arrival: '09:30', price: 1249, seats: 120 },
              { id: 'FL003', airline: 'LIFT', flightNumber: 'LIFT102', departure: '09:00', arrival: '11:00', price: 999, seats: 30 },
              { id: 'FL004', airline: 'MN', flightNumber: 'JE115', departure: '11:30', arrival: '13:30', price: 799, seats: 85 },
            ]
          }
        })

      case 'lounges':
        const airportFilter = searchParams.get('airport')
        let lounges = AIRPORT_LOUNGES
        if (airportFilter) lounges = lounges.filter(l => l.airport === airportFilter)
        return NextResponse.json({ success: true, data: lounges })

      case 'bus-operators':
        return NextResponse.json({ success: true, data: BUS_OPERATORS })

      case 'bus-search':
        return NextResponse.json({
          success: true,
          data: {
            buses: [
              { id: 'BUS001', operator: 'intercape', departure: '18:00', arrival: '12:00', price: 550, busType: 'Sleepliner', seats: 12 },
              { id: 'BUS002', operator: 'greyhound', departure: '19:00', arrival: '13:00', price: 480, busType: 'Luxury Liner', seats: 20 },
              { id: 'BUS003', operator: 'eldo', departure: '20:00', arrival: '14:00', price: 420, busType: 'Standard', seats: 25 },
            ]
          }
        })

      case 'train-operators':
        return NextResponse.json({ success: true, data: TRAIN_OPERATORS })

      case 'remittance-providers':
        return NextResponse.json({ success: true, data: REMITTANCE_PROVIDERS })

      case 'remittance-quote':
        const amount = parseFloat(searchParams.get('amount') || '1000')
        return NextResponse.json({
          success: true,
          data: REMITTANCE_PROVIDERS.map(p => ({
            provider: p.id,
            name: p.name,
            fee: Math.round(amount * parseFloat(p.fee) / 100),
            totalZAR: Math.round(amount * (1 + parseFloat(p.fee) / 100)),
            speed: p.speed,
          }))
        })

      case 'vouchers':
        return NextResponse.json({ success: true, data: VOUCHER_PROVIDERS })

      default:
        return NextResponse.json({
          success: true,
          summary: {
            airports: SA_AIRPORTS.length,
            airlines: SA_AIRLINES.length,
            busOperators: BUS_OPERATORS.length,
            trainOperators: TRAIN_OPERATORS.length,
            lounges: AIRPORT_LOUNGES.length,
            remittanceProviders: REMITTANCE_PROVIDERS.length,
            vouchers: VOUCHER_PROVIDERS.length
          }
        })
    }
  } catch {
    return NextResponse.json({ success: false, error: 'Travel service error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'flight-book':
        return NextResponse.json({ success: true, bookingId: `FL-${Date.now()}`, status: 'confirmed' })
      case 'bus-book':
        return NextResponse.json({ success: true, bookingId: `BUS-${Date.now()}`, status: 'confirmed' })
      case 'train-book':
        return NextResponse.json({ success: true, bookingId: `TR-${Date.now()}`, status: 'confirmed' })
      case 'lounge-book':
        return NextResponse.json({ success: true, bookingId: `LNG-${Date.now()}`, status: 'confirmed' })
      case 'remittance-send':
        return NextResponse.json({ success: true, transactionId: `REM-${Date.now()}`, status: 'processing' })
      case 'voucher-purchase':
        return NextResponse.json({ success: true, voucherId: `VCH-${Date.now()}`, status: 'active' })
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ success: false, error: 'Transaction failed' }, { status: 500 })
  }
}
