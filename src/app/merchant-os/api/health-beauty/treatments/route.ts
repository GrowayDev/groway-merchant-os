import { NextRequest, NextResponse } from 'next/server'

// Mock treatment records data
const treatments = [
  {
    id: '1',
    clientId: 'client-1',
    clientName: 'Amanda Smith',
    clientPhone: '+27 82 123 4567',
    practitionerId: 'staff-1',
    practitionerName: 'Sarah Johnson',
    serviceName: 'Full Highlights & Cut',
    serviceCategory: 'Hair',
    treatmentDate: '2025-01-15',
    treatmentTime: '10:30',
    duration: 120,
    productsUsed: [
      { name: 'L\'Oreal Blonde Me', quantity: 1, unit: 'tube' },
      { name: 'Wella T18 Toner', quantity: 1, unit: 'bottle' },
      { name: 'Moroccan Oil Treatment', quantity: 1, unit: 'application' },
    ],
    preTreatmentNotes: 'Client requested natural-looking highlights, avoiding brassiness. Previous color: Level 6 brown.',
    postTreatmentNotes: 'Excellent result. Used olaplex treatment. Client happy with color. Recommended purple shampoo.',
    consentObtained: true,
    consentDocumentUrl: '/consent/highlight-001.pdf',
    followUpRequired: true,
    followUpDate: '2025-02-15',
    followUpReason: 'Color maintenance check',
    beforePhotos: ['/photos/before/001-a.jpg'],
    afterPhotos: ['/photos/after/001-a.jpg', '/photos/after/001-b.jpg'],
    totalPrice: 1850,
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-01-15T12:30:00Z',
  },
  {
    id: '2',
    clientId: 'client-2',
    clientName: 'Jennifer Brown',
    clientPhone: '+27 83 456 7890',
    practitionerId: 'staff-2',
    practitionerName: 'Emily Chen',
    serviceName: 'Chemical Peel - Deep',
    serviceCategory: 'Skin',
    treatmentDate: '2025-01-14',
    treatmentTime: '14:00',
    duration: 60,
    productsUsed: [
      { name: 'Glycolic Acid 30%', quantity: 1, unit: 'application' },
      { name: 'Post-Peel Soothing Serum', quantity: 1, unit: 'bottle' },
    ],
    preTreatmentNotes: 'Client has combination skin with hyperpigmentation. No active breakouts. Not on retinoids for 2 weeks.',
    postTreatmentNotes: 'Peel applied successfully. Mild redness expected for 24-48 hours. Provided aftercare instructions.',
    consentObtained: true,
    consentDocumentUrl: '/consent/peel-002.pdf',
    followUpRequired: true,
    followUpDate: '2025-01-28',
    followUpReason: 'Post-peel assessment',
    beforePhotos: ['/photos/before/002-a.jpg'],
    afterPhotos: [],
    totalPrice: 1200,
    createdAt: '2025-01-14T14:00:00Z',
    updatedAt: '2025-01-14T15:00:00Z',
  },
  {
    id: '3',
    clientId: 'client-3',
    clientName: 'Sarah Ndlovu',
    clientPhone: '+27 84 567 8901',
    practitionerId: 'staff-4',
    practitionerName: 'James Thompson',
    serviceName: 'Deep Tissue Massage - 90min',
    serviceCategory: 'Massage',
    treatmentDate: '2025-01-16',
    treatmentTime: '09:00',
    duration: 90,
    productsUsed: [
      { name: 'Arnica Massage Oil', quantity: 1, unit: 'application' },
      { name: 'Hot Stones', quantity: 1, unit: 'set' },
    ],
    preTreatmentNotes: 'Client reports lower back tension from desk work. No injuries. Prefers firm pressure.',
    postTreatmentNotes: 'Significant tension release in lumbar region. Recommended stretching exercises. Client very satisfied.',
    consentObtained: true,
    consentDocumentUrl: '/consent/massage-003.pdf',
    followUpRequired: false,
    followUpDate: null,
    followUpReason: null,
    beforePhotos: [],
    afterPhotos: [],
    totalPrice: 850,
    createdAt: '2025-01-16T09:00:00Z',
    updatedAt: '2025-01-16T10:30:00Z',
  },
  {
    id: '4',
    clientId: 'client-4',
    clientName: 'Emma Wilson',
    clientPhone: '+27 85 678 9012',
    practitionerId: 'staff-3',
    practitionerName: 'Michelle Williams',
    serviceName: 'Gel Extensions - Natural',
    serviceCategory: 'Nails',
    treatmentDate: '2025-01-15',
    treatmentTime: '11:00',
    duration: 90,
    productsUsed: [
      { name: 'Gel Extension Kit', quantity: 1, unit: 'set' },
      { name: 'Base Coat', quantity: 1, unit: 'application' },
      { name: 'Top Coat', quantity: 1, unit: 'application' },
    ],
    preTreatmentNotes: 'Client wants natural-looking medium length. No nail damage reported.',
    postTreatmentNotes: 'Extensions applied successfully. Recommended bi-weekly maintenance.',
    consentObtained: true,
    consentDocumentUrl: '/consent/nails-004.pdf',
    followUpRequired: true,
    followUpDate: '2025-01-29',
    followUpReason: 'Fill-in appointment',
    beforePhotos: ['/photos/before/004-a.jpg'],
    afterPhotos: ['/photos/after/004-a.jpg'],
    totalPrice: 650,
    createdAt: '2025-01-15T11:00:00Z',
    updatedAt: '2025-01-15T12:30:00Z',
  },
  {
    id: '5',
    clientId: 'client-5',
    clientName: 'Thandi Mokoena',
    clientPhone: '+27 86 789 0123',
    practitionerId: 'staff-5',
    practitionerName: 'Lisa Nkosi',
    serviceName: 'European Facial',
    serviceCategory: 'Skin',
    treatmentDate: '2025-01-13',
    treatmentTime: '15:30',
    duration: 75,
    productsUsed: [
      { name: 'Gentle Cleanser', quantity: 1, unit: 'application' },
      { name: 'Enzyme Exfoliant', quantity: 1, unit: 'application' },
      { name: 'Hydrating Mask', quantity: 1, unit: 'application' },
      { name: 'SPF Moisturizer', quantity: 1, unit: 'application' },
    ],
    preTreatmentNotes: 'Client has dry, sensitive skin. Avoiding strong actives.',
    postTreatmentNotes: 'Gentle treatment performed. Skin looks refreshed and hydrated. Recommended hydrating serum.',
    consentObtained: true,
    consentDocumentUrl: '/consent/facial-005.pdf',
    followUpRequired: false,
    followUpDate: null,
    followUpReason: null,
    beforePhotos: [],
    afterPhotos: [],
    totalPrice: 750,
    createdAt: '2025-01-13T15:30:00Z',
    updatedAt: '2025-01-13T16:45:00Z',
  },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')
  const practitionerId = searchParams.get('practitionerId')
  const category = searchParams.get('category')
  const date = searchParams.get('date')
  const limit = parseInt(searchParams.get('limit') || '50')
  
  let filtered = [...treatments]
  
  if (clientId) {
    filtered = filtered.filter(t => t.clientId === clientId)
  }
  
  if (practitionerId) {
    filtered = filtered.filter(t => t.practitionerId === practitionerId)
  }
  
  if (category) {
    filtered = filtered.filter(t => t.serviceCategory === category)
  }
  
  if (date) {
    filtered = filtered.filter(t => t.treatmentDate === date)
  }
  
  return NextResponse.json({
    data: filtered.slice(0, limit),
    total: filtered.length,
    limit,
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const newTreatment = {
      id: `${treatments.length + 1}`,
      clientId: body.clientId,
      clientName: body.clientName,
      clientPhone: body.clientPhone,
      practitionerId: body.practitionerId,
      practitionerName: body.practitionerName,
      serviceName: body.serviceName,
      serviceCategory: body.serviceCategory,
      treatmentDate: body.treatmentDate,
      treatmentTime: body.treatmentTime,
      duration: body.duration,
      productsUsed: body.productsUsed || [],
      preTreatmentNotes: body.preTreatmentNotes || '',
      postTreatmentNotes: body.postTreatmentNotes || '',
      consentObtained: body.consentObtained || false,
      consentDocumentUrl: body.consentDocumentUrl,
      followUpRequired: body.followUpRequired || false,
      followUpDate: body.followUpDate,
      followUpReason: body.followUpReason,
      beforePhotos: body.beforePhotos || [],
      afterPhotos: body.afterPhotos || [],
      totalPrice: body.totalPrice || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    treatments.push(newTreatment)
    
    return NextResponse.json(newTreatment, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create treatment record' }, { status: 400 })
  }
}
