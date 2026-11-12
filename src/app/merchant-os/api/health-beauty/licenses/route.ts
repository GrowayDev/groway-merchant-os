import { NextRequest, NextResponse } from 'next/server'

// Mock practitioner licenses data
const licenses = [
  {
    id: '1',
    staffId: 'staff-1',
    practitionerName: 'Sarah Johnson',
    practitionerPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    licenseType: 'hairdresser',
    licenseNumber: 'HBD-2024-001234',
    issuingBody: 'Health and Welfare SETA',
    issueDate: '2023-06-15',
    expiryDate: '2025-06-15',
    status: 'active',
    specializations: ['Color Specialist', 'Balayage', 'Bridal'],
    documentUrl: '/documents/licenses/hbd-001234.pdf',
    createdAt: '2023-06-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    staffId: 'staff-2',
    practitionerName: 'Emily Chen',
    practitionerPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    licenseType: 'aesthetician',
    licenseNumber: 'AES-2023-005678',
    issuingBody: 'CIDESCO International',
    issueDate: '2023-03-01',
    expiryDate: '2025-03-01',
    status: 'active',
    specializations: ['Microdermabrasion', 'Chemical Peels', 'LED Therapy'],
    documentUrl: '/documents/licenses/aes-005678.pdf',
    createdAt: '2023-03-01T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
  },
  {
    id: '3',
    staffId: 'staff-3',
    practitionerName: 'Michelle Williams',
    practitionerPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michelle',
    licenseType: 'nail_technician',
    licenseNumber: 'NLT-2022-009876',
    issuingBody: 'Beauty Therapy Institute',
    issueDate: '2022-09-10',
    expiryDate: '2024-09-10',
    status: 'expired',
    specializations: ['Gel Extensions', 'Nail Art', 'Manicure'],
    documentUrl: '/documents/licenses/nlt-009876.pdf',
    createdAt: '2022-09-10T10:00:00Z',
    updatedAt: '2024-09-10T10:00:00Z',
  },
  {
    id: '4',
    staffId: 'staff-4',
    practitionerName: 'James Thompson',
    practitionerPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    licenseType: 'massage_therapist',
    licenseNumber: 'MSG-2024-003456',
    issuingBody: 'South African Massage Therapy Association',
    issueDate: '2024-01-20',
    expiryDate: '2026-01-20',
    status: 'active',
    specializations: ['Deep Tissue', 'Sports Massage', 'Hot Stone'],
    documentUrl: '/documents/licenses/msg-003456.pdf',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
  },
  {
    id: '5',
    staffId: 'staff-5',
    practitionerName: 'Lisa Nkosi',
    practitionerPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
    licenseType: 'beautician',
    licenseNumber: 'BEC-2023-007890',
    issuingBody: 'International Beauty Institute',
    issueDate: '2023-11-01',
    expiryDate: '2025-02-01',
    status: 'suspended',
    specializations: ['Facials', 'Waxing', 'Eyebrow Shaping'],
    documentUrl: '/documents/licenses/bec-007890.pdf',
    createdAt: '2023-11-01T10:00:00Z',
    updatedAt: '2024-12-15T10:00:00Z',
  },
  {
    id: '6',
    staffId: 'staff-6',
    practitionerName: 'David Patel',
    practitionerPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    licenseType: 'aesthetician',
    licenseNumber: 'AES-2021-002345',
    issuingBody: 'Health Professions Council of SA',
    issueDate: '2021-05-15',
    expiryDate: '2023-05-15',
    status: 'revoked',
    specializations: ['Laser Treatment', 'Skin Analysis'],
    documentUrl: '/documents/licenses/aes-002345.pdf',
    createdAt: '2021-05-15T10:00:00Z',
    updatedAt: '2023-05-15T10:00:00Z',
  },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const type = searchParams.get('type')
  
  let filtered = [...licenses]
  
  if (status) {
    filtered = filtered.filter(l => l.status === status)
  }
  
  if (type) {
    filtered = filtered.filter(l => l.licenseType === type)
  }
  
  // Calculate days until expiry for each license
  const licensesWithExpiry = filtered.map(license => {
    const expiryDate = new Date(license.expiryDate)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return {
      ...license,
      daysUntilExpiry,
      isExpired: daysUntilExpiry <= 0,
      isExpiringSoon: daysUntilExpiry > 0 && daysUntilExpiry <= 30,
    }
  })
  
  return NextResponse.json(licensesWithExpiry)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const newLicense = {
      id: `${licenses.length + 1}`,
      staffId: body.staffId || `staff-${licenses.length + 1}`,
      practitionerName: body.practitionerName,
      practitionerPhoto: body.practitionerPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${body.practitionerName}`,
      licenseType: body.licenseType,
      licenseNumber: body.licenseNumber,
      issuingBody: body.issuingBody,
      issueDate: body.issueDate,
      expiryDate: body.expiryDate,
      status: 'active',
      specializations: body.specializations || [],
      documentUrl: body.documentUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    licenses.push(newLicense)
    
    return NextResponse.json(newLicense, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create license' }, { status: 400 })
  }
}
