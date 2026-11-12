import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// CPD requirements by council
const CPD_REQUIREMENTS: Record<string, { points: number; period: string; description: string }> = {
  'HPCSA': { points: 30, period: 'yearly', description: '30 CEU per calendar year' },
  'ECSA': { points: 25, period: '3-years', description: '25 points over 3 years' },
  'SAICA': { points: 120, period: '3-years', description: '120 hours over 3 years' },
  'LPC': { points: 5, period: 'yearly', description: '5 points per year' },
  'SANC': { points: 30, period: 'yearly', description: '30 CEU per calendar year' },
  'SAPC': { points: 40, period: 'yearly', description: '40 CEU per calendar year' },
}

// GET: Return compliance dashboard data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const practiceId = searchParams.get('practiceId')

    if (!practiceId) {
      return NextResponse.json(
        { success: false, error: 'practiceId is required' },
        { status: 400 }
      )
    }

    // Get practice with compliance info
    const practice = await db.professionalPractice.findUnique({
      where: { id: practiceId },
      include: {
        practiceCompliance: true,
        trustAccount: true,
      }
    })

    if (!practice) {
      return NextResponse.json(
        { success: false, error: 'Practice not found' },
        { status: 404 }
      )
    }

    const now = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(now.getDate() + 30)
    const ninetyDaysFromNow = new Date()
    ninetyDaysFromNow.setDate(now.getDate() + 90)
    const currentYear = now.getFullYear()

    // Get all staff with their registrations
    const staff = await db.professionalStaff.findMany({
      where: { practiceId },
      include: {
        professionalRegistrations: {
          include: {
            certificates: true,
            renewals: {
              orderBy: { renewalYear: 'desc' },
              take: 1
            }
          }
        },
        cpdRecords: {
          where: {
            date: {
              gte: new Date(`${currentYear}-01-01`),
              lte: new Date(`${currentYear}-12-31`)
            }
          }
        }
      }
    })

    // Analyze registration status
    const registrationAlerts: Array<{
      staffId: string;
      staffName: string;
      council: string;
      registrationNumber: string;
      expiryDate: Date;
      status: 'expired' | 'expiring_30' | 'expiring_90';
      daysUntilExpiry: number;
    }> = []

    const cpdProgress: Array<{
      staffId: string;
      staffName: string;
      council: string;
      currentPoints: number;
      requiredPoints: number;
      progress: number;
      isCompliant: boolean;
      verifiedPoints: number;
    }> = []

    let compliantStaffCount = 0
    let nonCompliantStaffCount = 0

    for (const member of staff) {
      // Check registrations
      for (const reg of member.professionalRegistrations) {
        const expiryDate = new Date(reg.expiryDate)
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (expiryDate < now) {
          registrationAlerts.push({
            staffId: member.id,
            staffName: `${member.firstName} ${member.lastName}`,
            council: reg.council,
            registrationNumber: reg.registrationNumber,
            expiryDate: reg.expiryDate,
            status: 'expired',
            daysUntilExpiry,
          })
        } else if (expiryDate < thirtyDaysFromNow) {
          registrationAlerts.push({
            staffId: member.id,
            staffName: `${member.firstName} ${member.lastName}`,
            council: reg.council,
            registrationNumber: reg.registrationNumber,
            expiryDate: reg.expiryDate,
            status: 'expiring_30',
            daysUntilExpiry,
          })
        } else if (expiryDate < ninetyDaysFromNow) {
          registrationAlerts.push({
            staffId: member.id,
            staffName: `${member.firstName} ${member.lastName}`,
            council: reg.council,
            registrationNumber: reg.registrationNumber,
            expiryDate: reg.expiryDate,
            status: 'expiring_90',
            daysUntilExpiry,
          })
        }
      }

      // Calculate CPD progress
      const totalPoints = member.cpdRecords.reduce((sum, r) => sum + (r.points || 0), 0)
      const verifiedPoints = member.cpdRecords
        .filter(r => r.verified)
        .reduce((sum, r) => sum + (r.points || 0), 0)

      const requirement = CPD_REQUIREMENTS[member.council] || CPD_REQUIREMENTS['HPCSA']
      const progress = Math.min(100, Math.round((totalPoints / requirement.points) * 100))
      const isCompliant = totalPoints >= requirement.points

      cpdProgress.push({
        staffId: member.id,
        staffName: `${member.firstName} ${member.lastName}`,
        council: member.council,
        currentPoints: totalPoints,
        requiredPoints: requirement.points,
        progress,
        isCompliant,
        verifiedPoints,
      })

      // Count compliance
      const hasRegistrationIssue = registrationAlerts.some(a => a.staffId === member.id && a.status === 'expired')
      if (!hasRegistrationIssue && isCompliant) {
        compliantStaffCount++
      } else {
        nonCompliantStaffCount++
      }
    }

    // Check practice compliance items
    const practiceComplianceAlerts: Array<{
      type: string;
      name: string;
      expiryDate: Date | null;
      status: 'expired' | 'expiring_30' | 'expiring_90' | 'missing';
      daysUntilExpiry: number | null;
    }> = []

    if (practice.practiceCompliance) {
      const compliance = practice.practiceCompliance

      // Fidelity Fund
      if (compliance.fidelityFundExpiry) {
        const expiry = new Date(compliance.fidelityFundExpiry)
        const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        if (expiry < now) {
          practiceComplianceAlerts.push({
            type: 'fidelity_fund',
            name: 'Fidelity Fund Certificate',
            expiryDate: compliance.fidelityFundExpiry,
            status: 'expired',
            daysUntilExpiry: daysUntil,
          })
        } else if (expiry < thirtyDaysFromNow) {
          practiceComplianceAlerts.push({
            type: 'fidelity_fund',
            name: 'Fidelity Fund Certificate',
            expiryDate: compliance.fidelityFundExpiry,
            status: 'expiring_30',
            daysUntilExpiry: daysUntil,
          })
        } else if (expiry < ninetyDaysFromNow) {
          practiceComplianceAlerts.push({
            type: 'fidelity_fund',
            name: 'Fidelity Fund Certificate',
            expiryDate: compliance.fidelityFundExpiry,
            status: 'expiring_90',
            daysUntilExpiry: daysUntil,
          })
        }
      } else if (['LPC'].includes(practice.council)) {
        practiceComplianceAlerts.push({
          type: 'fidelity_fund',
          name: 'Fidelity Fund Certificate',
          expiryDate: null,
          status: 'missing',
          daysUntilExpiry: null,
        })
      }

      // Health Certificate
      if (compliance.healthCertExpiry) {
        const expiry = new Date(compliance.healthCertExpiry)
        const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        if (expiry < now) {
          practiceComplianceAlerts.push({
            type: 'health_certificate',
            name: 'Health Certificate',
            expiryDate: compliance.healthCertExpiry,
            status: 'expired',
            daysUntilExpiry: daysUntil,
          })
        } else if (expiry < thirtyDaysFromNow) {
          practiceComplianceAlerts.push({
            type: 'health_certificate',
            name: 'Health Certificate',
            expiryDate: compliance.healthCertExpiry,
            status: 'expiring_30',
            daysUntilExpiry: daysUntil,
          })
        }
      }

      // Fire Certificate
      if (compliance.fireCertExpiry) {
        const expiry = new Date(compliance.fireCertExpiry)
        const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        if (expiry < now) {
          practiceComplianceAlerts.push({
            type: 'fire_certificate',
            name: 'Fire Certificate',
            expiryDate: compliance.fireCertExpiry,
            status: 'expired',
            daysUntilExpiry: daysUntil,
          })
        } else if (expiry < thirtyDaysFromNow) {
          practiceComplianceAlerts.push({
            type: 'fire_certificate',
            name: 'Fire Certificate',
            expiryDate: compliance.fireCertExpiry,
            status: 'expiring_30',
            daysUntilExpiry: daysUntil,
          })
        }
      }

      // Audit
      if (compliance.nextAudit) {
        const auditDate = new Date(compliance.nextAudit)
        const daysUntil = Math.ceil((auditDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        if (auditDate < ninetyDaysFromNow) {
          practiceComplianceAlerts.push({
            type: 'audit',
            name: 'Practice Audit',
            expiryDate: compliance.nextAudit,
            status: daysUntil < 0 ? 'expired' : daysUntil < 30 ? 'expiring_30' : 'expiring_90',
            daysUntilExpiry: daysUntil,
          })
        }
      }
    }

    // Get trust account reconciliation status
    let trustReconciliationStatus = null
    if (practice.trustAccount) {
      const lastReconciliation = practice.trustAccount.lastReconciliation
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(now.getDate() - 30)

      trustReconciliationStatus = {
        accountId: practice.trustAccount.id,
        accountName: practice.trustAccount.accountName,
        balance: practice.trustAccount.balance,
        lastReconciliation,
        isOverdue: lastReconciliation ? new Date(lastReconciliation) < thirtyDaysAgo : true,
        daysSinceReconciliation: lastReconciliation
          ? Math.ceil((now.getTime() - new Date(lastReconciliation).getTime()) / (1000 * 60 * 60 * 24))
          : null,
      }
    }

    // Calculate overall compliance score
    const totalStaff = staff.length
    const complianceRate = totalStaff > 0 ? Math.round((compliantStaffCount / totalStaff) * 100) : 100

    // Summary stats
    const summary = {
      totalStaff,
      compliantStaff: compliantStaffCount,
      nonCompliantStaff: nonCompliantStaffCount,
      complianceRate,
      expiredRegistrations: registrationAlerts.filter(a => a.status === 'expired').length,
      expiringRegistrations: registrationAlerts.filter(a => a.status === 'expiring_30').length,
      practiceAlerts: practiceComplianceAlerts.length,
      trustReconciliationOverdue: trustReconciliationStatus?.isOverdue || false,
    }

    return NextResponse.json({
      success: true,
      data: {
        practice: {
          id: practice.id,
          name: practice.name,
          council: practice.council,
          status: practice.status,
        },
        summary,
        registrationAlerts: registrationAlerts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry),
        cpdProgress: cpdProgress.sort((a, b) => a.progress - b.progress),
        practiceComplianceAlerts,
        trustReconciliationStatus,
        cpdRequirements: CPD_REQUIREMENTS,
      }
    })
  } catch (error) {
    console.error('Error fetching compliance data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch compliance data' },
      { status: 500 }
    )
  }
}
