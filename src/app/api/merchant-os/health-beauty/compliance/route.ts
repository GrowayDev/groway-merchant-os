import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// GET /api/merchant-os/health-beauty/compliance - Get all health & beauty compliance data
export async function GET(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') ||
      request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
    }

    // Fetch all compliance data in parallel
    const [
      healthCertificates,
      fireSafetyCertificates,
      professionalRegistrations,
      sheComplianceItems
    ] = await Promise.all([
      // Health certificates for health/beauty
      db.healthCertificate.findMany({
        where: { merchantId },
        orderBy: { createdAt: 'desc' }
      }),
      // Fire safety certificates
      db.fireSafetyCertificate.findMany({
        where: { merchantId },
        orderBy: { createdAt: 'desc' }
      }),
      // Professional registrations (HPCSA for health professionals, etc.)
      db.professionalRegistration.findMany({
        where: {
          merchantId,
          council: { in: ['HPCSA', 'SAVC', 'SACA', 'SACAP'] }
        },
        orderBy: { createdAt: 'desc' }
      }),
      // SHE compliance items for health/beauty (hygiene, equipment, chemical safety)
      db.sHECompliance.findMany({
        where: {
          merchantId,
          complianceType: { in: ['health', 'safety', 'hygiene', 'equipment', 'chemical'] }
        },
        orderBy: { dueDate: 'asc' }
      })
    ])

    // Calculate statistics
    const now = new Date()
    const threeMonthsFromNow = new Date()
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)

    // Health certificate stats
    const healthCertStats = {
      total: healthCertificates.length,
      active: healthCertificates.filter(c => c.status === 'active' && (!c.expiryDate || new Date(c.expiryDate) > now)).length,
      expiringSoon: healthCertificates.filter(c => {
        if (!c.expiryDate) return false
        const expiry = new Date(c.expiryDate)
        return expiry > now && expiry <= threeMonthsFromNow
      }).length,
      expired: healthCertificates.filter(c => c.expiryDate && new Date(c.expiryDate) <= now).length
    }

    // Fire safety stats
    const fireSafetyStats = {
      total: fireSafetyCertificates.length,
      active: fireSafetyCertificates.filter(c => c.status === 'active' && (!c.expiryDate || new Date(c.expiryDate) > now)).length,
      expiringSoon: fireSafetyCertificates.filter(c => {
        if (!c.expiryDate) return false
        const expiry = new Date(c.expiryDate)
        return expiry > now && expiry <= threeMonthsFromNow
      }).length,
      expired: fireSafetyCertificates.filter(c => c.expiryDate && new Date(c.expiryDate) <= now).length
    }

    // Professional registration stats
    const profRegStats = {
      total: professionalRegistrations.length,
      active: professionalRegistrations.filter(r => r.status === 'active' && (!r.expiryDate || new Date(r.expiryDate) > now)).length,
      pendingRenewal: professionalRegistrations.filter(r => {
        if (!r.expiryDate) return false
        const expiry = new Date(r.expiryDate)
        return expiry > now && expiry <= threeMonthsFromNow
      }).length,
      expired: professionalRegistrations.filter(r => r.expiryDate && new Date(r.expiryDate) <= now).length
    }

    // SHE compliance stats
    const sheStats = {
      total: sheComplianceItems.length,
      pending: sheComplianceItems.filter(i => i.status === 'pending').length,
      completed: sheComplianceItems.filter(i => i.status === 'completed').length,
      overdue: sheComplianceItems.filter(i => i.status === 'pending' && new Date(i.dueDate) < now).length
    }

    return NextResponse.json({
      healthCertificates: healthCertificates.map(c => ({
        id: c.id,
        certificateType: c.certificateType,
        certificateNumber: c.certificateNumber,
        issuingAuthority: c.issuingAuthority,
        issueDate: c.issueDate,
        expiryDate: c.expiryDate,
        status: getCertificateStatus(c.expiryDate),
        holderName: c.holderName,
        holderIdNumber: c.holderIdNumber,
        nextInspectionDate: c.nextInspectionDate,
        documentUrl: c.documentUrl,
        notes: c.notes
      })),
      fireSafetyCertificates: fireSafetyCertificates.map(c => ({
        id: c.id,
        certificateNumber: c.certificateNumber,
        issuingAuthority: c.issuingAuthority,
        issueDate: c.issueDate,
        expiryDate: c.expiryDate,
        status: getCertificateStatus(c.expiryDate),
        lastDrillDate: c.lastDrillDate,
        nextDrillDate: c.nextDrillDate,
        extinguisherCount: c.extinguisherCount,
        emergencyExits: c.emergencyExits,
        evacuationPlan: c.evacuationPlan,
        documentUrl: c.documentUrl
      })),
      professionalRegistrations: professionalRegistrations.map(r => ({
        id: r.id,
        professionalName: r.professionalName,
        council: r.council,
        registrationNumber: r.registrationNumber,
        registrationType: r.registrationType,
        category: r.category,
        specialty: r.specialty,
        issueDate: r.issueDate,
        expiryDate: r.expiryDate,
        status: getRegistrationStatus(r.expiryDate),
        cpdPoints: r.cpdPoints,
        cpdRequired: r.cpdRequired,
        practiceNumber: r.practiceNumber
      })),
      sheCompliance: sheComplianceItems.map(i => ({
        id: i.id,
        complianceType: i.complianceType,
        category: i.category,
        title: i.title,
        description: i.description,
        responsiblePerson: i.responsiblePerson,
        dueDate: i.dueDate,
        completedDate: i.completedDate,
        status: i.status,
        frequency: i.frequency,
        riskLevel: i.riskLevel,
        notes: i.notes
      })),
      stats: {
        healthCertificates: healthCertStats,
        fireSafety: fireSafetyStats,
        professionalRegistrations: profRegStats,
        sheCompliance: sheStats
      }
    })
  } catch (error) {
    console.error('Error fetching health-beauty compliance:', error)
    return NextResponse.json({ error: 'Failed to fetch compliance data' }, { status: 500 })
  }
}

// Helper function to determine certificate status
function getCertificateStatus(expiryDate: string | null): string {
  if (!expiryDate) return 'active'
  
  const expiry = new Date(expiryDate)
  const now = new Date()
  const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysUntilExpiry < 0) return 'expired'
  if (daysUntilExpiry <= 90) return 'expiring_soon'
  return 'active'
}

// Helper function to determine registration status
function getRegistrationStatus(expiryDate: string | null): string {
  if (!expiryDate) return 'active'
  
  const expiry = new Date(expiryDate)
  const now = new Date()
  const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysUntilExpiry < 0) return 'expired'
  if (daysUntilExpiry <= 90) return 'expiring_soon'
  return 'active'
}
