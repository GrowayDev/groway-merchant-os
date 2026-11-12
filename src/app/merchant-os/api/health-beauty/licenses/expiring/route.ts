import { NextRequest, NextResponse } from 'next/server'

// Mock expiring licenses data
const expiringLicenses = [
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
    daysUntilExpiry: -45,
    isExpired: true,
    isExpiringSoon: false,
    renewalUrl: '/renew/NLT-2022-009876',
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
    daysUntilExpiry: 15,
    isExpired: false,
    isExpiringSoon: true,
    renewalUrl: '/renew/BEC-2023-007890',
  },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '30')
  
  // Filter licenses expiring within the specified days
  const filtered = expiringLicenses.filter(license => 
    license.daysUntilExpiry <= days && license.daysUntilExpiry > -60
  )
  
  return NextResponse.json({
    expiringLicenses: filtered,
    totalExpiring: filtered.filter(l => !l.isExpired).length,
    totalExpired: filtered.filter(l => l.isExpired).length,
    daysThreshold: days,
  })
}
