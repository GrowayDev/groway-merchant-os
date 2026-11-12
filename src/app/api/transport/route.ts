import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const DEMO_USER_ID = 'demo-consumer-user-001';

// ==================== GAUTRAIN ====================
const gautrainStations = [
  { id: 'OR', name: 'OR Tambo International', zone: 1 },
  { id: 'CS', name: 'Centurion', zone: 2 },
  { id: 'PT', name: 'Pretoria', zone: 3 },
  { id: 'RH', name: 'Rhodesfield', zone: 1 },
  { id: 'ML', name: 'Marlboro', zone: 1 },
  { id: 'SP', name: 'Sandton', zone: 1 },
  { id: 'RO', name: 'Rosebank', zone: 1 },
  { id: 'PK', name: 'Park Station', zone: 1 },
  { id: 'MI', name: 'Midrand', zone: 2 },
];

const gautrainFares: Record<string, Record<string, { peak: number; offPeak: number; distance: string }>> = {
  'OR': {
    'SP': { peak: 195, offPeak: 162, distance: '15 km' },
    'PT': { peak: 260, offPeak: 217, distance: '45 km' },
    'CS': { peak: 230, offPeak: 192, distance: '38 km' },
    'RH': { peak: 175, offPeak: 146, distance: '12 km' },
    'PK': { peak: 210, offPeak: 175, distance: '22 km' },
  },
  'SP': {
    'OR': { peak: 195, offPeak: 162, distance: '15 km' },
    'PT': { peak: 62, offPeak: 52, distance: '30 km' },
    'CS': { peak: 48, offPeak: 40, distance: '22 km' },
    'RO': { peak: 25, offPeak: 21, distance: '5 km' },
    'PK': { peak: 31, offPeak: 26, distance: '8 km' },
  },
  'PK': {
    'SP': { peak: 31, offPeak: 26, distance: '8 km' },
    'RO': { peak: 25, offPeak: 21, distance: '4 km' },
    'OR': { peak: 210, offPeak: 175, distance: '22 km' },
  },
  'PT': {
    'SP': { peak: 62, offPeak: 52, distance: '30 km' },
    'OR': { peak: 260, offPeak: 217, distance: '45 km' },
    'CS': { peak: 28, offPeak: 23, distance: '12 km' },
    'MI': { peak: 35, offPeak: 29, distance: '18 km' },
  },
};

const ticketTypes = [
  { id: 'single', name: 'Single Trip', multiplier: 1 },
  { id: 'return', name: 'Return Trip', multiplier: 1.9 },
  { id: 'weekly', name: 'Weekly Pass', multiplier: 8 },
  { id: 'monthly', name: 'Monthly Pass', multiplier: 28 },
];

// ==================== BUS ====================
const busOperators = [
  { id: 'intercape', name: 'Intercape', logo: '🚌', rating: 4.3, routes: ['JHB-CPT', 'JHB-DBN', 'JHB-PTA', 'CPT-DBN'], amenities: ['WiFi', 'AC', 'USB', 'Snacks'] },
  { id: 'greyhound', name: 'Greyhound', logo: '🐕', rating: 4.5, routes: ['JHB-CPT', 'JHB-DBN', 'JHB-PTA', 'CPT-DBN'], amenities: ['WiFi', 'AC', 'USB', 'Reclining Seats', 'Blanket'] },
  { id: 'translux', name: 'Translux', logo: '🚍', rating: 4.2, routes: ['JHB-CPT', 'JHB-DBN', 'JHB-BFN'], amenities: ['WiFi', 'AC', 'USB'] },
  { id: 'eldo', name: 'Eldo Coaches', logo: '🚌', rating: 4.1, routes: ['JHB-CPT', 'JHB-DBN'], amenities: ['WiFi', 'AC'] },
  { id: 'sa_roadlink', name: 'SA Roadlink', logo: '🛣️', rating: 3.9, routes: ['JHB-CPT', 'JHB-DBN'], amenities: ['AC', 'USB'] },
];

const busCities = [
  { id: 'JHB', name: 'Johannesburg', province: 'Gauteng' },
  { id: 'CPT', name: 'Cape Town', province: 'Western Cape' },
  { id: 'DBN', name: 'Durban', province: 'KwaZulu-Natal' },
  { id: 'PTA', name: 'Pretoria', province: 'Gauteng' },
  { id: 'BFN', name: 'Bloemfontein', province: 'Free State' },
  { id: 'EL', name: 'East London', province: 'Eastern Cape' },
  { id: 'PLZ', name: 'Port Elizabeth', province: 'Eastern Cape' },
  { id: 'PTH', name: 'Polokwane', province: 'Limpopo' },
  { id: 'NLP', name: 'Nelspruit', province: 'Mpumalanga' },
];

const busPrices: Record<string, Record<string, { min: number; max: number; duration: string }>> = {
  'JHB': {
    'CPT': { min: 450, max: 850, duration: '18h 30m' },
    'DBN': { min: 280, max: 550, duration: '8h 15m' },
    'PTA': { min: 120, max: 200, duration: '1h 30m' },
    'BFN': { min: 350, max: 500, duration: '5h 45m' },
  },
  'CPT': {
    'JHB': { min: 450, max: 850, duration: '18h 30m' },
    'DBN': { min: 520, max: 900, duration: '22h 15m' },
  },
  'DBN': {
    'JHB': { min: 280, max: 550, duration: '8h 15m' },
    'CPT': { min: 520, max: 900, duration: '22h 15m' },
  },
};

// ==================== FLIGHTS ====================
const airlines = [
  { id: 'flysafair', name: 'FlySafair', logo: '✈️', rating: 4.4, code: 'FA', baggage: '7kg carry-on included' },
  { id: 'lift', name: 'Lift Airline', logo: '🛫', rating: 4.6, code: 'GE', baggage: '10kg carry-on included' },
  { id: 'airlink', name: 'Airlink', logo: '🛩️', rating: 4.3, code: '4Z', baggage: '8kg carry-on included' },
  { id: 'cemair', name: 'CemAir', logo: '🛫', rating: 4.0, code: '5Z', baggage: '7kg carry-on included' },
  { id: 'south_african', name: 'South African Airways', logo: '🇿🇦', rating: 4.2, code: 'SA', baggage: '23kg checked included' },
];

const airports = [
  { id: 'JNB', name: 'O.R. Tambo International', city: 'Johannesburg', code: 'JNB', lounges: ['BidAir Lounge', 'SAA Premier Lounge', 'Shongololo Lounge'] },
  { id: 'CPT', name: 'Cape Town International', city: 'Cape Town', code: 'CPT', lounges: ['BidAir Lounge', 'Slow Lounge'] },
  { id: 'DUR', name: 'King Shaka International', city: 'Durban', code: 'DUR', lounges: ['BidAir Lounge'] },
  { id: 'PLZ', name: 'Port Elizabeth Airport', city: 'Port Elizabeth', code: 'PLZ', lounges: [] },
  { id: 'ELS', name: 'East London Airport', city: 'East London', code: 'ELS', lounges: [] },
  { id: 'BFN', name: 'Bram Fischer International', city: 'Bloemfontein', code: 'BFN', lounges: [] },
  { id: 'PTG', name: 'Pilanesberg International', city: 'Sun City', code: 'PTG', lounges: [] },
  { id: 'GRJ', name: 'George Airport', city: 'George', code: 'GRJ', lounges: [] },
];

const airportLounges = [
  { id: 'bidair-jnb', name: 'BidAir Lounge', airport: 'JNB', price: 350, amenities: ['Buffet', 'Bar', 'WiFi', 'Showers'] },
  { id: 'saa-jnb', name: 'SAA Premier Lounge', airport: 'JNB', price: 450, amenities: ['A La Carte', 'Bar', 'WiFi', 'Showers', 'Spa'] },
  { id: 'shongololo-jnb', name: 'Shongololo Lounge', airport: 'JNB', price: 280, amenities: ['Snacks', 'Drinks', 'WiFi'] },
  { id: 'bidair-cpt', name: 'BidAir Lounge', airport: 'CPT', price: 320, amenities: ['Buffet', 'Bar', 'WiFi'] },
  { id: 'slow-cpt', name: 'Slow Lounge', airport: 'CPT', price: 380, amenities: ['Buffet', 'Bar', 'WiFi', 'Kids Area'] },
  { id: 'bidair-dur', name: 'BidAir Lounge', airport: 'DUR', price: 300, amenities: ['Snacks', 'Drinks', 'WiFi'] },
];

const flightPrices: Record<string, Record<string, { min: number; max: number; duration: string }>> = {
  'JNB': {
    'CPT': { min: 899, max: 2800, duration: '2h 10m' },
    'DUR': { min: 750, max: 1800, duration: '1h 15m' },
    'PLZ': { min: 1100, max: 2200, duration: '1h 50m' },
    'ELS': { min: 1200, max: 2400, duration: '1h 40m' },
    'BFN': { min: 950, max: 1900, duration: '1h 00m' },
    'PTG': { min: 1300, max: 2500, duration: '1h 10m' },
    'GRJ': { min: 1400, max: 2600, duration: '1h 55m' },
  },
  'CPT': {
    'JNB': { min: 899, max: 2800, duration: '2h 00m' },
    'DUR': { min: 950, max: 2000, duration: '2h 20m' },
    'PLZ': { min: 750, max: 1500, duration: '1h 25m' },
  },
  'DUR': {
    'JNB': { min: 750, max: 1800, duration: '1h 10m' },
    'CPT': { min: 950, max: 2000, duration: '2h 15m' },
  },
};

const cabinClasses = [
  { id: 'economy', name: 'Economy', multiplier: 1 },
  { id: 'premium_economy', name: 'Premium Economy', multiplier: 1.5 },
  { id: 'business', name: 'Business', multiplier: 2.5 },
];

// ==================== EVENTS ====================
const eventCategories = [
  { id: 'concert', name: 'Concerts', icon: '🎵' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
  { id: 'comedy', name: 'Comedy', icon: '😂' },
  { id: 'theatre', name: 'Theatre', icon: '🎭' },
  { id: 'festival', name: 'Festivals', icon: '🎪' },
  { id: 'exhibition', name: 'Exhibitions', icon: '🎨' },
];

const events = [
  { id: 'EVT001', name: 'Cassper Nyovest Live', category: 'concert', venue: 'Sun Arena, Pretoria', venueAddress: 'Time Square, Menlyn Maine, Pretoria', date: '2025-05-15', time: '19:00', minPrice: 250, maxPrice: 850, available: true, image: '🎤', ticketTypes: [
    { id: 'general', name: 'General Admission', price: 250 },
    { id: 'golden', name: 'Golden Circle', price: 450 },
    { id: 'vip', name: 'VIP Experience', price: 850 },
  ]},
  { id: 'EVT002', name: 'Kaizer Chiefs vs Orlando Pirates', category: 'sports', venue: 'FNB Stadium', venueAddress: 'Nasrec Road, Johannesburg', date: '2025-05-20', time: '15:00', minPrice: 80, maxPrice: 450, available: true, image: '⚽', ticketTypes: [
    { id: 'standing', name: 'Standing Area', price: 80 },
    { id: 'seated', name: 'Seated', price: 150 },
    { id: 'premium', name: 'Premium Seating', price: 350 },
    { id: 'vip', name: 'VIP Box', price: 450 },
  ]},
  { id: 'EVT003', name: 'Trevor Noah Live', category: 'comedy', venue: 'Grand Arena, Cape Town', venueAddress: 'GrandWest Casino, Cape Town', date: '2025-05-25', time: '20:00', minPrice: 450, maxPrice: 1200, available: true, image: '😂', ticketTypes: [
    { id: 'general', name: 'General', price: 450 },
    { id: 'premium', name: 'Premium', price: 750 },
    { id: 'meet_greet', name: 'Meet & Greet', price: 1200 },
  ]},
  { id: 'EVT004', name: 'Lion King Musical', category: 'theatre', venue: 'Teatro, Montecasino', venueAddress: 'Montecasino, Fourways, Johannesburg', date: '2025-05-18', time: '14:00', minPrice: 350, maxPrice: 750, available: true, image: '🦁', ticketTypes: [
    { id: 'balcony', name: 'Balcony', price: 350 },
    { id: 'stalls', name: 'Stalls', price: 550 },
    { id: 'orchestra', name: 'Orchestra', price: 750 },
  ]},
  { id: 'EVT005', name: 'Ultra South Africa', category: 'festival', venue: 'Nasrec Expo Centre', venueAddress: 'Nasrec Road, Johannesburg', date: '2025-06-01', time: '12:00', minPrice: 695, maxPrice: 2500, available: true, image: '🎧', ticketTypes: [
    { id: 'general', name: 'General Admission', price: 695 },
    { id: 'vip', name: 'VIP', price: 1500 },
    { id: 'vvip', name: 'VVIP', price: 2500 },
  ]},
  { id: 'EVT006', name: 'Art Basel Cape Town', category: 'exhibition', venue: 'CTICC', venueAddress: 'Convention Square, Cape Town', date: '2025-06-05', time: '10:00', minPrice: 150, maxPrice: 350, available: true, image: '🎨', ticketTypes: [
    { id: 'day', name: 'Day Pass', price: 150 },
    { id: 'weekend', name: 'Weekend Pass', price: 250 },
    { id: 'vip', name: 'VIP Preview', price: 350 },
  ]},
];

async function ensureDemoUser() {
  let user = await db.consumerUser.findUnique({
    where: { id: DEMO_USER_ID }
  });
  
  if (!user) {
    const now = new Date();
    user = await db.consumerUser.create({
      data: {
        id: DEMO_USER_ID,
        phone: '+27821234567',
        email: 'thabo.molefe@example.com',
        firstName: 'Thabo',
        lastName: 'Molefe',
        kycLevel: 2,
        kycStatus: 'verified',
        kycVerifiedAt: now,
        accountStatus: 'active',
        createdAt: now,
        updatedAt: now,
      }
    });
  }
  
  return user;
}

// Helper to get or create Gautrain card
async function getOrCreateGautrainCard() {
  // Check if GautrainCard model exists in the database
  try {
    // @ts-ignore - GautrainCard might not exist in older Prisma clients
    if (db.gautrainCard) {
      let card = await db.gautrainCard.findUnique({
        where: { userId: DEMO_USER_ID }
      });
      
      if (!card) {
        const cardNumber = `GT${Date.now().toString().slice(-10)}`;
        card = await db.gautrainCard.create({
          data: {
            id: `GTC${Date.now()}`,
            userId: DEMO_USER_ID,
            cardNumber,
            balance: 127.50,
            cardType: 'virtual',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        });
        console.log('Created new Gautrain card:', card.id);
      }
      
      return card;
    }
  } catch (error) {
    console.error('Error accessing GautrainCard model:', error);
  }
  
  // Fallback: Return a virtual card without database persistence
  // This is used when the database model is not available
  console.log('Using in-memory fallback for Gautrain card');
  return {
    id: `GTC-DEMO-001`,
    userId: DEMO_USER_ID,
    cardNumber: 'GT1234567890',
    balance: 127.50,
    cardType: 'virtual',
    status: 'active',
    createdAt: new Date(Date.now() - 604800000),
    updatedAt: new Date(),
  };
}

// GET - Transport data
export async function GET(request: NextRequest) {
  try {
    await ensureDemoUser();
    
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const action = searchParams.get('action');

    // GAUTRAIN
    if (type === 'gautrain') {
      if (action === 'stations') {
        return NextResponse.json({ success: true, data: gautrainStations });
      }
      if (action === 'fares') {
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        if (from && to) {
          const fare = gautrainFares[from]?.[to] || gautrainFares[to]?.[from] || { peak: 62, offPeak: 52, distance: 'Unknown' };
          return NextResponse.json({ success: true, data: { ...fare, from, to } });
        }
        return NextResponse.json({ success: true, data: gautrainFares });
      }
      if (action === 'ticket-types') {
        return NextResponse.json({ success: true, data: ticketTypes });
      }
      if (action === 'card') {
        const card = await getOrCreateGautrainCard();
        return NextResponse.json({ success: true, data: card });
      }
      
      const card = await getOrCreateGautrainCard();
      return NextResponse.json({
        success: true,
        data: {
          stations: gautrainStations,
          fares: gautrainFares,
          ticketTypes,
          card,
          operatingHours: { weekday: '05:30 - 20:30', weekend: '06:00 - 20:00' },
        }
      });
    }

    // BUS
    if (type === 'bus') {
      const from = searchParams.get('from');
      const to = searchParams.get('to');
      const date = searchParams.get('date');

      if (action === 'operators') {
        return NextResponse.json({ success: true, data: busOperators });
      }
      if (action === 'cities') {
        return NextResponse.json({ success: true, data: busCities });
      }
      if (action === 'search' && from && to && date) {
        const priceInfo = busPrices[from]?.[to] || busPrices[to]?.[from] || { min: 350, max: 600, duration: '10h 00m' };
        
        // Filter operators that serve this route
        let matchingOperators = busOperators.filter(op => 
          op.routes.some(r => r.includes(from) && r.includes(to))
        );
        
        // If no operators match, use all operators (for demo purposes)
        if (matchingOperators.length === 0) {
          console.log(`No direct routes found for ${from}-${to}, showing all operators`);
          matchingOperators = busOperators;
        }
        
        const results = matchingOperators.map((op, idx) => ({
          id: `${op.id}-${Date.now()}-${idx}`,
          operator: op,
          departureTime: ['06:30', '08:00', '10:00', '14:00', '18:00', '20:30'][idx % 6],
          arrivalTime: ['18:45', '20:15', '22:15', '02:15', '06:15', '08:45'][idx % 6],
          duration: priceInfo.duration,
          price: Math.round(priceInfo.min + (Math.random() * (priceInfo.max - priceInfo.min))),
          seatsAvailable: Math.floor(Math.random() * 20) + 5,
          busType: op.id === 'greyhound' ? 'Luxury Liner' : op.id === 'intercape' ? 'Sleepliner' : 'Standard',
          amenities: op.amenities,
          fromCity: busCities.find(c => c.id === from)?.name || from,
          toCity: busCities.find(c => c.id === to)?.name || to,
        }));
        
        console.log(`Bus search: ${from} -> ${to} on ${date}, found ${results.length} results`);
        return NextResponse.json({ success: true, data: { from, to, date, results } });
      }
      return NextResponse.json({
        success: true,
        data: { operators: busOperators, cities: busCities }
      });
    }

    // FLIGHTS
    if (type === 'flights') {
      const from = searchParams.get('from');
      const to = searchParams.get('to');
      const date = searchParams.get('date');

      if (action === 'airlines') {
        return NextResponse.json({ success: true, data: airlines });
      }
      if (action === 'airports') {
        return NextResponse.json({ success: true, data: airports });
      }
      if (action === 'classes') {
        return NextResponse.json({ success: true, data: cabinClasses });
      }
      if (action === 'lounges') {
        const airport = searchParams.get('airport');
        const filtered = airport ? airportLounges.filter(l => l.airport === airport) : airportLounges;
        return NextResponse.json({ success: true, data: filtered });
      }
      if (action === 'search' && from && to && date) {
        const priceInfo = flightPrices[from]?.[to] || flightPrices[to]?.[from] || { min: 1200, max: 2500, duration: '2h 00m' };
        
        const results = airlines.map((airline, idx) => {
          const basePrice = Math.round(priceInfo.min + (Math.random() * (priceInfo.max - priceInfo.min)));
          const departureHour = [6, 9, 13, 16, 19][idx % 5];
          return {
            id: `${airline.id}-${Date.now()}-${idx}`,
            airline,
            flightNumber: `${airline.code}${Math.floor(Math.random() * 900) + 100}`,
            departureTime: `${departureHour.toString().padStart(2, '0')}:${['00', '15', '30', '45'][idx % 4]}`,
            arrivalTime: `${((departureHour + 2) % 24).toString().padStart(2, '0')}:${['10', '25', '40', '55'][idx % 4]}`,
            duration: priceInfo.duration,
            price: basePrice,
            economyPrice: basePrice,
            premiumEconomyPrice: Math.round(basePrice * 1.5),
            businessPrice: Math.round(basePrice * 2.5),
            class: 'Economy',
            seatsLeft: Math.floor(Math.random() * 30) + 1,
            fromAirport: airports.find(a => a.code === from),
            toAirport: airports.find(a => a.code === to),
            baggage: airline.baggage,
          };
        });
        return NextResponse.json({ success: true, data: { from, to, date, results, lounges: airportLounges.filter(l => l.airport === from || l.airport === to) } });
      }
      return NextResponse.json({
        success: true,
        data: { airlines, airports, classes: cabinClasses, lounges: airportLounges }
      });
    }

    // EVENTS
    if (type === 'events') {
      const category = searchParams.get('category');
      const eventId = searchParams.get('eventId');

      if (action === 'categories') {
        return NextResponse.json({ success: true, data: eventCategories });
      }
      if (action === 'list') {
        let filteredEvents = events;
        if (category) {
          filteredEvents = events.filter(e => e.category === category);
        }
        return NextResponse.json({ success: true, data: filteredEvents });
      }
      if (action === 'detail' && eventId) {
        const event = events.find(e => e.id === eventId);
        if (event) {
          return NextResponse.json({ success: true, data: event });
        }
        return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        data: { categories: eventCategories, events }
      });
    }

    // Default: return all transport options
    return NextResponse.json({
      success: true,
      data: {
        gautrain: { stations: gautrainStations, fares: gautrainFares, ticketTypes },
        bus: { operators: busOperators, cities: busCities },
        flights: { airlines, airports, classes: cabinClasses, lounges: airportLounges },
        events: { categories: eventCategories, events },
      },
    });
  } catch (error) {
    console.error('Transport GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch transport data' }, { status: 500 });
  }
}

// POST - Book transport/event
export async function POST(request: NextRequest) {
  try {
    await ensureDemoUser();
    
    const body = await request.json();
    const { type, ...bookingData } = body;

    // Gautrain top-up
    if (type === 'gautrain-topup') {
      const { amount } = bookingData;
      
      if (!amount || amount < 10 || amount > 5000) {
        return NextResponse.json({ success: false, error: 'Amount must be between R10 and R5000' }, { status: 400 });
      }

      // Get wallet
      const wallet = await db.consumerWallet.findUnique({
        where: { userId: DEMO_USER_ID }
      });

      if (!wallet) {
        return NextResponse.json({ success: false, error: 'Wallet not found' }, { status: 404 });
      }

      const amountCents = BigInt(Math.round(amount * 100));

      // Check balance
      if (wallet.balanceCents < amountCents) {
        return NextResponse.json({ success: false, error: 'Insufficient funds' }, { status: 400 });
      }

      // Get or create card
      const card = await getOrCreateGautrainCard();

      // Create transaction
      const txn = await db.consumerTransaction.create({
        data: {
          id: `GTR${Date.now()}`,
          idempotencyKey: `IDMGTR${Date.now()}`,
          userId: DEMO_USER_ID,
          transactionType: 'gautrain_topup',
          direction: 'debit',
          amountCents: -amountCents,
          feeCents: BigInt(0),
          netAmountCents: -amountCents,
          currency: 'ZAR',
          status: 'completed',
          description: `Gautrain card top-up - Card: ${card.cardNumber}`,
          reference: `GTR-${Date.now()}`,
          category: 'Transport',
          processedAt: new Date(),
          completedAt: new Date(),
          updatedAt: new Date(),
        }
      });

      // Update wallet balance
      await db.consumerWallet.update({
        where: { userId: DEMO_USER_ID },
        data: {
          balanceCents: wallet.balanceCents - amountCents,
          updatedAt: new Date(),
        }
      });

      // Update card balance
      const previousBalance = Number(card.balance);
      const newBalance = previousBalance + amount;
      
      try {
        // @ts-ignore
        if (db.gautrainCard) {
          const updatedCard = await db.gautrainCard.update({
            where: { userId: DEMO_USER_ID },
            data: { balance: newBalance, updatedAt: new Date() }
          });
          console.log('Gautrain card updated successfully:', { 
            cardId: updatedCard.id, 
            previousBalance, 
            newBalance: updatedCard.balance 
          });
        }
      } catch (error) {
        console.error('Failed to update Gautrain card balance:', error);
        // Continue even if card update fails - the transaction was already created
      }

      return NextResponse.json({
        success: true,
        data: {
          transactionId: txn.id,
          amount,
          previousBalance,
          newCardBalance: newBalance,
          cardNumber: card.cardNumber,
          reference: txn.reference,
          timestamp: txn.completedAt?.toISOString(),
        },
        message: `Gautrain card topped up with R${amount.toFixed(2)}`,
      });
    }

    // Gautrain ticket purchase
    if (type === 'gautrain-ticket') {
      const { fromStation, toStation, ticketType, isPeak, passengers } = bookingData;
      
      const from = gautrainStations.find(s => s.id === fromStation);
      const to = gautrainStations.find(s => s.id === toStation);
      const tType = ticketTypes.find(t => t.id === ticketType);
      
      if (!from || !to || !tType) {
        return NextResponse.json({ success: false, error: 'Invalid stations or ticket type' }, { status: 400 });
      }

      const fare = gautrainFares[fromStation]?.[toStation] || gautrainFares[toStation]?.[fromStation] || { peak: 62, offPeak: 52 };
      const baseFare = isPeak ? fare.peak : fare.offPeak;
      const totalAmount = Math.round(baseFare * tType.multiplier * (passengers || 1));

      // Get wallet
      const wallet = await db.consumerWallet.findUnique({
        where: { userId: DEMO_USER_ID }
      });

      if (!wallet || wallet.balanceCents < BigInt(totalAmount * 100)) {
        return NextResponse.json({ success: false, error: 'Insufficient funds' }, { status: 400 });
      }

      const amountCents = BigInt(totalAmount * 100);
      const ticketRef = `GTT-${Date.now().toString(36).toUpperCase()}`;

      // Create transaction
      const txn = await db.consumerTransaction.create({
        data: {
          id: `GTT${Date.now()}`,
          idempotencyKey: `IDMGTT${Date.now()}`,
          userId: DEMO_USER_ID,
          transactionType: 'gautrain_ticket',
          direction: 'debit',
          amountCents: -amountCents,
          feeCents: BigInt(0),
          netAmountCents: -amountCents,
          currency: 'ZAR',
          status: 'completed',
          description: `Gautrain ${tType.name}: ${from.name} → ${to.name} (${passengers} passenger${passengers > 1 ? 's' : ''})`,
          reference: ticketRef,
          category: 'Transport',
          processedAt: new Date(),
          completedAt: new Date(),
          updatedAt: new Date(),
        }
      });

      // Update wallet
      await db.consumerWallet.update({
        where: { userId: DEMO_USER_ID },
        data: {
          balanceCents: wallet.balanceCents - amountCents,
          updatedAt: new Date(),
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          ticketId: txn.id,
          ticketRef,
          from: from.name,
          to: to.name,
          ticketType: tType.name,
          passengers: passengers || 1,
          isPeak,
          baseFare,
          totalAmount,
          validUntil: new Date(Date.now() + (ticketType === 'monthly' ? 30 : ticketType === 'weekly' ? 7 : 1) * 24 * 60 * 60 * 1000).toISOString(),
          timestamp: txn.completedAt?.toISOString(),
        },
        message: `Ticket purchased: ${from.name} → ${to.name} (${tType.name})`,
      });
    }

    // Bus booking
    if (type === 'bus-ticket') {
      const { operatorId, from, to, date, departureTime, passengers, price, busType, selectedSeats, travellers, ticketClass, isReturn, returnDate, returnOperatorId, returnDepartureTime, returnPrice, totalAmount } = bookingData;
      
      const operator = busOperators.find(o => o.id === operatorId);
      const fromCity = busCities.find(c => c.id === from);
      const toCity = busCities.find(c => c.id === to);
      const numPassengers = travellers?.length || passengers || 1;
      const finalAmount = totalAmount || (price * numPassengers);

      if (!operator || !fromCity || !toCity) {
        return NextResponse.json({ success: false, error: 'Invalid booking details' }, { status: 400 });
      }

      // Get wallet
      const wallet = await db.consumerWallet.findUnique({
        where: { userId: DEMO_USER_ID }
      });

      if (!wallet || wallet.balanceCents < BigInt(finalAmount * 100)) {
        return NextResponse.json({ success: false, error: 'Insufficient funds' }, { status: 400 });
      }

      const bookingRef = `BUS${Date.now().toString(36).toUpperCase()}`;
      const amountCents = BigInt(finalAmount * 100);

      // Create transaction
      const txn = await db.consumerTransaction.create({
        data: {
          id: `BUS${Date.now()}`,
          idempotencyKey: `IDMBUS${Date.now()}`,
          userId: DEMO_USER_ID,
          transactionType: 'bus_ticket',
          direction: 'debit',
          amountCents: -amountCents,
          feeCents: BigInt(0),
          netAmountCents: -amountCents,
          currency: 'ZAR',
          status: 'completed',
          description: `Bus ticket: ${operator.name} - ${fromCity.name} → ${toCity.name}${isReturn ? ' (Return)' : ''}`,
          reference: bookingRef,
          category: 'Transport',
          counterpartyName: operator.name,
          processedAt: new Date(),
          completedAt: new Date(),
          updatedAt: new Date(),
        }
      });

      // Update wallet
      await db.consumerWallet.update({
        where: { userId: DEMO_USER_ID },
        data: {
          balanceCents: wallet.balanceCents - amountCents,
          updatedAt: new Date(),
        }
      });

      // Generate seat numbers
      const seatNumbers = Array.from({ length: numPassengers }, (_, i) => `${Math.floor(i / 4) + 1}${String.fromCharCode(65 + (i % 4))}`);

      return NextResponse.json({
        success: true,
        data: {
          bookingRef,
          ticketId: txn.id,
          operator: operator.name,
          operatorLogo: operator.logo,
          route: `${fromCity.name} → ${toCity.name}`,
          date,
          departureTime,
          passengers: numPassengers,
          travellers: travellers || [],
          seats: seatNumbers,
          pricePerTicket: price,
          totalAmount: finalAmount,
          busType,
          ticketClass: ticketClass || 'Economy',
          amenities: operator.amenities,
          status: 'confirmed',
          boardingPoint: `${fromCity.name} Bus Terminal`,
          reportingTime: `${(parseInt(departureTime.split(':')[0]) - 1).toString().padStart(2, '0')}:${departureTime.split(':')[1]}`,
          isReturn: isReturn || false,
          returnDate: returnDate || null,
          returnDepartureTime: returnDepartureTime || null,
          eTicket: `https://tickets.groway.io/bus/${bookingRef}`,
          timestamp: txn.completedAt?.toISOString(),
        },
        message: `Bus ticket booked successfully. Reference: ${bookingRef}`,
      });
    }

    // Flight booking
    if (type === 'flight-ticket') {
      const { airlineId, flightNumber, from, to, date, departureTime, arrivalTime, passengers, cabinClass, price, loungeAccess, travellers, isReturn, returnDate, returnAirlineId, returnFlightNumber, returnDepartureTime, returnArrivalTime, returnPrice, totalAmount } = bookingData;
      
      const airline = airlines.find(a => a.id === airlineId);
      const fromAirport = airports.find(a => a.code === from);
      const toAirport = airports.find(a => a.code === to);
      const cabin = cabinClasses.find(c => c.id === cabinClass) || cabinClasses[0];
      const numPassengers = travellers?.length || passengers || 1;
      
      let finalAmount = totalAmount || (price * numPassengers);
      let loungeDetails = null;

      // Add lounge if selected
      if (loungeAccess && loungeAccess !== 'none') {
        const lounge = airportLounges.find(l => l.id === loungeAccess);
        if (lounge) {
          finalAmount += lounge.price * numPassengers;
          loungeDetails = lounge;
        }
      }

      if (!airline || !fromAirport || !toAirport) {
        return NextResponse.json({ success: false, error: 'Invalid booking details' }, { status: 400 });
      }

      // Get wallet
      const wallet = await db.consumerWallet.findUnique({
        where: { userId: DEMO_USER_ID }
      });

      if (!wallet || wallet.balanceCents < BigInt(finalAmount * 100)) {
        return NextResponse.json({ success: false, error: 'Insufficient funds' }, { status: 400 });
      }

      const bookingRef = `FLT${Date.now().toString(36).toUpperCase()}`;
      const pnrCode = `${airline.code}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const amountCents = BigInt(finalAmount * 100);

      // Create transaction
      const txn = await db.consumerTransaction.create({
        data: {
          id: `FLT${Date.now()}`,
          idempotencyKey: `IDMFLT${Date.now()}`,
          userId: DEMO_USER_ID,
          transactionType: 'flight_ticket',
          direction: 'debit',
          amountCents: -amountCents,
          feeCents: BigInt(0),
          netAmountCents: -amountCents,
          currency: 'ZAR',
          status: 'completed',
          description: `Flight: ${airline.name} ${flightNumber} - ${fromAirport.city} → ${toAirport.city}${isReturn ? ' (Return)' : ''}`,
          reference: bookingRef,
          category: 'Travel',
          counterpartyName: airline.name,
          processedAt: new Date(),
          completedAt: new Date(),
          updatedAt: new Date(),
        }
      });

      // Update wallet
      await db.consumerWallet.update({
        where: { userId: DEMO_USER_ID },
        data: {
          balanceCents: wallet.balanceCents - amountCents,
          updatedAt: new Date(),
        }
      });

      // Generate seats for all passengers
      const seatNumbers = Array.from({ length: numPassengers }, (_, i) => 
        `${Math.floor(i / 6) + 1}${String.fromCharCode(65 + (i % 6))}`
      );

      return NextResponse.json({
        success: true,
        data: {
          bookingRef,
          pnr: pnrCode,
          ticketId: txn.id,
          airline: airline.name,
          airlineLogo: airline.logo,
          flightNumber,
          route: `${fromAirport.city} (${fromAirport.code}) → ${toAirport.city} (${toAirport.code})`,
          fromAirport: fromAirport.name,
          toAirport: toAirport.name,
          date,
          departureTime,
          arrivalTime,
          passengers: numPassengers,
          travellers: travellers || [],
          cabinClass: cabin.name,
          pricePerTicket: price,
          loungeAccess: loungeDetails,
          totalAmount: finalAmount,
          baggage: airline.baggage,
          status: 'confirmed',
          gate: `${['A', 'B', 'C'][Math.floor(Math.random() * 3)]}${Math.floor(Math.random() * 20) + 1}`,
          seats: seatNumbers,
          isReturn: isReturn || false,
          returnDate: returnDate || null,
          returnFlightNumber: returnFlightNumber || null,
          returnDepartureTime: returnDepartureTime || null,
          checkInOpens: `${(parseInt(departureTime.split(':')[0]) - 2).toString().padStart(2, '0')}:${departureTime.split(':')[1]}`,
          eTicket: `https://tickets.groway.io/flight/${bookingRef}`,
          timestamp: txn.completedAt?.toISOString(),
        },
        message: `Flight booked successfully. PNR: ${pnrCode}`,
      });
    }

    // Event booking
    if (type === 'event-ticket') {
      const { eventId, ticketTypeId, quantity } = bookingData;
      
      const event = events.find(e => e.id === eventId);
      if (!event) {
        return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
      }

      const ticketType = event.ticketTypes?.find(t => t.id === ticketTypeId) || event.ticketTypes?.[0];
      if (!ticketType) {
        return NextResponse.json({ success: false, error: 'Invalid ticket type' }, { status: 400 });
      }

      const numTickets = quantity || 1;
      const totalAmount = ticketType.price * numTickets;

      // Get wallet
      const wallet = await db.consumerWallet.findUnique({
        where: { userId: DEMO_USER_ID }
      });

      if (!wallet || wallet.balanceCents < BigInt(totalAmount * 100)) {
        return NextResponse.json({ success: false, error: 'Insufficient funds' }, { status: 400 });
      }

      const bookingRef = `EVT${Date.now().toString(36).toUpperCase()}`;
      const seatNumbers = Array.from({ length: numTickets }, (_, i) => `${String.fromCharCode(65 + Math.floor(i / 10))}${(i % 10) + 1}`);
      const amountCents = BigInt(totalAmount * 100);

      // Create transaction
      const txn = await db.consumerTransaction.create({
        data: {
          id: `EVT${Date.now()}`,
          idempotencyKey: `IDMEVT${Date.now()}`,
          userId: DEMO_USER_ID,
          transactionType: 'event_ticket',
          direction: 'debit',
          amountCents: -amountCents,
          feeCents: BigInt(0),
          netAmountCents: -amountCents,
          currency: 'ZAR',
          status: 'completed',
          description: `Event ticket: ${event.name} - ${ticketType.name} x${numTickets}`,
          reference: bookingRef,
          category: 'Entertainment',
          counterpartyName: event.venue,
          processedAt: new Date(),
          completedAt: new Date(),
          updatedAt: new Date(),
        }
      });

      // Update wallet
      await db.consumerWallet.update({
        where: { userId: DEMO_USER_ID },
        data: {
          balanceCents: wallet.balanceCents - amountCents,
          updatedAt: new Date(),
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          bookingRef,
          ticketId: txn.id,
          event: event.name,
          eventImage: event.image,
          venue: event.venue,
          venueAddress: event.venueAddress,
          date: event.date,
          time: event.time,
          ticketType: ticketType.name,
          quantity: numTickets,
          seats: seatNumbers,
          pricePerTicket: ticketType.price,
          totalAmount,
          status: 'confirmed',
          qrCode: `EVT-${bookingRef}-${Date.now()}`,
          eTicket: `https://tickets.grosell.io/event/${bookingRef}`,
          timestamp: txn.completedAt?.toISOString(),
        },
        message: `Booked ${numTickets} ticket(s) for ${event.name}`,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid booking type' }, { status: 400 });
  } catch (error) {
    console.error('Transport POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process booking' }, { status: 500 });
  }
}
