import { NextRequest, NextResponse } from 'next/server'

// Mock allergy profiles data
const allergyProfiles = [
  {
    id: '1',
    clientId: 'client-1',
    clientName: 'Amanda Smith',
    clientPhone: '+27 82 123 4567',
    skinType: 'combination',
    allergies: [
      { name: 'Paraphenylenediamine (PPD)', severity: 'severe', reaction: 'Contact dermatitis, swelling' },
      { name: 'Lanolin', severity: 'moderate', reaction: 'Itching, redness' },
    ],
    sensitivities: [
      { name: 'Fragrances', severity: 'mild', notes: 'May cause mild irritation' },
      { name: 'Retinol', severity: 'moderate', notes: 'Causes excessive dryness' },
    ],
    previousReactions: [
      { date: '2024-03-15', product: 'Permanent Hair Dye', reaction: 'Severe scalp irritation, facial swelling', treatment: 'Oral antihistamines, topical steroid' },
      { date: '2023-08-20', product: 'Lanolim-based moisturizer', reaction: 'Itchy rash on face', treatment: 'Discontinued product' },
    ],
    medicalConditions: ['Eczema (mild)', 'Asthma'],
    medications: ['Albuterol inhaler as needed'],
    notes: 'Always perform patch test 48h before any color service. Use ammonia-free products only.',
    emergencyContact: 'John Smith (husband) +27 82 987 6543',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2025-01-05T10:00:00Z',
  },
  {
    id: '2',
    clientId: 'client-2',
    clientName: 'Jennifer Brown',
    clientPhone: '+27 83 456 7890',
    skinType: 'oily',
    allergies: [
      { name: 'Sulfates', severity: 'moderate', reaction: 'Scalp itching, hair breakage' },
    ],
    sensitivities: [
      { name: 'Salicylic Acid', severity: 'mild', notes: 'Use in low concentrations only' },
      { name: 'Benzoyl Peroxide', severity: 'moderate', notes: 'Causes excessive dryness and peeling' },
    ],
    previousReactions: [
      { date: '2024-06-10', product: 'Sulfate-based shampoo', reaction: 'Severe scalp itching', treatment: 'Switched to sulfate-free products' },
    ],
    medicalConditions: [],
    medications: [],
    notes: 'Use sulfate-free products. Prefers lightweight, non-comedogenic formulations.',
    emergencyContact: 'Mark Brown (partner) +27 83 456 7891',
    createdAt: '2024-02-15T10:00:00Z',
    updatedAt: '2025-01-10T10:00:00Z',
  },
  {
    id: '3',
    clientId: 'client-3',
    clientName: 'Sarah Ndlovu',
    clientPhone: '+27 84 567 8901',
    skinType: 'normal',
    allergies: [],
    sensitivities: [
      { name: 'Essential Oils', severity: 'mild', notes: 'May cause mild sensitivity on sensitive areas' },
    ],
    previousReactions: [],
    medicalConditions: [],
    medications: [],
    notes: 'No known allergies. Generally tolerant of most products.',
    emergencyContact: 'Peter Ndlovu (brother) +27 84 567 8902',
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-03-01T10:00:00Z',
  },
  {
    id: '4',
    clientId: 'client-4',
    clientName: 'Emma Wilson',
    clientPhone: '+27 85 678 9012',
    skinType: 'dry',
    allergies: [
      { name: 'Shellfish-derived ingredients', severity: 'moderate', reaction: 'Skin rash, mild swelling' },
      { name: 'Nickle', severity: 'severe', reaction: 'Contact dermatitis' },
    ],
    sensitivities: [
      { name: 'Alcohol-based products', severity: 'moderate', notes: 'Causes excessive dryness and irritation' },
    ],
    previousReactions: [
      { date: '2024-09-05', product: 'Metal nail file', reaction: 'Red, itchy patches around nails', treatment: 'Switched to glass file' },
    ],
    medicalConditions: ['Hypothyroidism'],
    medications: ['Levothyroxine 50mcg daily'],
    notes: 'Check all metal tools for nickel content. Use hydrating products. No shellfish-derived ingredients (some gel polishes contain these).',
    emergencyContact: 'Lisa Wilson (mother) +27 85 678 9013',
    createdAt: '2024-04-20T10:00:00Z',
    updatedAt: '2024-09-10T10:00:00Z',
  },
  {
    id: '5',
    clientId: 'client-5',
    clientName: 'Thandi Mokoena',
    clientPhone: '+27 86 789 0123',
    skinType: 'sensitive',
    allergies: [
      { name: 'Formaldehyde', severity: 'severe', reaction: 'Severe contact dermatitis, blistering' },
      { name: 'Formaldehyde-releasing preservatives', severity: 'severe', reaction: 'Same as formaldehyde' },
    ],
    sensitivities: [
      { name: 'Alpha Hydroxy Acids (AHAs)', severity: 'moderate', notes: 'Use at low concentrations' },
      { name: 'Vitamin C', severity: 'mild', notes: 'May cause tingling sensation' },
    ],
    previousReactions: [
      { date: '2024-01-15', product: 'Nail hardener with formaldehyde', reaction: 'Severe nail bed irritation, onycholysis', treatment: 'Topical steroid, discontinued product' },
      { date: '2023-11-20', product: 'Prescription skin cream', reaction: 'Facial swelling, difficulty breathing', treatment: 'Emergency room visit, antihistamines' },
    ],
    medicalConditions: ['Allergic rhinitis'],
    medications: ['Cetirizine 10mg as needed'],
    notes: 'CRITICAL: Must verify ALL products are formaldehyde-free. Check ingredient lists carefully. Keep emergency antihistamines nearby.',
    emergencyContact: 'Doctor Mokoena (sister) +27 86 789 0124',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2025-01-12T10:00:00Z',
  },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')
  const skinType = searchParams.get('skinType')
  
  let filtered = [...allergyProfiles]
  
  if (clientId) {
    filtered = filtered.filter(p => p.clientId === clientId)
  }
  
  if (skinType) {
    filtered = filtered.filter(p => p.skinType === skinType)
  }
  
  return NextResponse.json(filtered)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const newProfile = {
      id: `${allergyProfiles.length + 1}`,
      clientId: body.clientId,
      clientName: body.clientName,
      clientPhone: body.clientPhone,
      skinType: body.skinType,
      allergies: body.allergies || [],
      sensitivities: body.sensitivities || [],
      previousReactions: body.previousReactions || [],
      medicalConditions: body.medicalConditions || [],
      medications: body.medications || [],
      notes: body.notes || '',
      emergencyContact: body.emergencyContact,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    allergyProfiles.push(newProfile)
    
    return NextResponse.json(newProfile, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create allergy profile' }, { status: 400 })
  }
}
