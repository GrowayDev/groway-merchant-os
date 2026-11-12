import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// South African Liquor License Types
// - On-consumption: Bars, restaurants, hotels (alcohol consumed on premises)
// - Off-consumption: Bottle stores, liquor stores, supermarkets
// - Micro-manufacturing: Breweries, distilleries, wineries
// - Special events: Temporary licenses for events

const LICENSE_TYPES = {
  on_consumption: {
    name: 'On-Consumption',
    description: 'Bars, restaurants, hotels - alcohol consumed on premises',
    examples: ['Bar', 'Restaurant', 'Hotel', 'Nightclub', 'Shebeen']
  },
  off_consumption: {
    name: 'Off-Consumption', 
    description: 'Bottle stores, liquor stores - alcohol sold for off-premises consumption',
    examples: ['Bottle Store', 'Liquor Store', 'Supermarket', 'Convenience Store']
  },
  both: {
    name: 'Combined License',
    description: 'Both on and off consumption allowed',
    examples: ['Hotel with bar', 'Restaurant with takeaway', 'Wine farm']
  },
  micro_manufacturing: {
    name: 'Micro-Manufacturing',
    description: 'Small-scale production of alcohol',
    examples: ['Microbrewery', 'Craft distillery', 'Wine farm']
  },
  special_events: {
    name: 'Special Events',
    description: 'Temporary license for specific events',
    examples: ['Festival', 'Concert', 'Wedding', 'Corporate event']
  }
} as const

// GET - License details
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const licenseId = searchParams.get('id')
    const includeDocuments = searchParams.get('includeDocuments') === 'true'
    const includeAudits = searchParams.get('includeAudits') === 'true'
    
    if (licenseId) {
      // Get specific license
      const license = await db.liquorLicense.findUnique({
        where: { id: licenseId },
        include: {
          documents: includeDocuments ? {
            orderBy: { createdAt: 'desc' },
            take: 20
          } : false,
          audits: includeAudits ? {
            orderBy: { auditDate: 'desc' },
            take: 20
          } : false,
        }
      })
      
      if (!license) {
        return NextResponse.json(
          { success: false, error: 'License not found' },
          { status: 404 }
        )
      }
      
      // Calculate expiry status
      const today = new Date()
      const expiryDate = new Date(license.expiryDate)
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      const isExpired = daysUntilExpiry < 0
      const isExpiringSoon = daysUntilExpiry >= 0 && daysUntilExpiry <= 30
      
      // Get RSA manager certifications
      let rsaManager = null
      if (license.managerId) {
        rsaManager = await db.rSACertification.findFirst({
          where: { staffId: license.managerId }
        })
      }
      
      return NextResponse.json({
        success: true,
        data: {
          ...license,
          isExpired,
          isExpiringSoon,
          daysUntilExpiry,
          rsaManager
        }
      })
    }
    
    // Get all licenses
    const licenses = await db.liquorLicense.findMany({
      include: {
        documents: { take: 3, orderBy: { createdAt: 'desc' } },
        audits: { take: 3, orderBy: { auditDate: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    })
    
    // Add expiry status to each
    const today = new Date()
    const licensesWithStatus = licenses.map(license => {
      const expiryDate = new Date(license.expiryDate)
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return {
        ...license,
        isExpired: daysUntilExpiry < 0,
        isExpiringSoon: daysUntilExpiry >= 0 && daysUntilExpiry <= 30,
        daysUntilExpiry
      }
    })
    
    // Summary statistics
    const stats = {
      total: licenses.length,
      active: licensesWithStatus.filter(l => l.status === 'active' && !l.isExpired).length,
      expired: licensesWithStatus.filter(l => l.isExpired).length,
      expiringSoon: licensesWithStatus.filter(l => l.isExpiringSoon && !l.isExpired).length,
      suspended: licenses.filter(l => l.status === 'suspended').length,
      pendingRenewal: licenses.filter(l => l.status === 'pending_renewal').length,
    }
    
    // Get upcoming renewal reminders (licenses expiring in next 60 days)
    const upcomingRenewals = licensesWithStatus
      .filter(l => l.daysUntilExpiry >= 0 && l.daysUntilExpiry <= 60 && l.status === 'active')
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
    
    return NextResponse.json({
      success: true,
      data: licensesWithStatus,
      stats,
      upcomingRenewals,
      licenseTypes: LICENSE_TYPES
    })
  } catch (error) {
    console.error('Error fetching licenses:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch licenses' },
      { status: 500 }
    )
  }
}

// POST - Create or update license
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.licenseNumber || !body.licenseType || !body.licenseHolder || !body.expiryDate) {
      return NextResponse.json(
        { success: false, error: 'License number, type, holder, and expiry date are required' },
        { status: 400 }
      )
    }
    
    // Check if license number already exists
    const existing = await db.liquorLicense.findUnique({
      where: { licenseNumber: body.licenseNumber }
    })
    
    if (existing && !body.id) {
      return NextResponse.json(
        { success: false, error: 'License number already exists' },
        { status: 400 }
      )
    }
    
    let license
    if (body.id) {
      // Update existing license
      license = await db.liquorLicense.update({
        where: { id: body.id },
        data: {
          licenseType: body.licenseType,
          licenseHolder: body.licenseHolder,
          tradingName: body.tradingName,
          registrationNumber: body.registrationNumber,
          issuedBy: body.issuedBy,
          issueDate: body.issueDate,
          expiryDate: body.expiryDate,
          status: body.status || 'active',
          premisesAddress: body.premisesAddress,
          premisesType: body.premisesType,
          conditions: body.conditions,
          authorizedHours: body.authorizedHours,
          maxCapacity: body.maxCapacity,
          managerName: body.managerName,
          managerId: body.managerId,
          contactPhone: body.contactPhone,
          contactEmail: body.contactEmail,
          updatedAt: new Date()
        }
      })
    } else {
      // Create new license
      license = await db.liquorLicense.create({
        data: {
          licenseNumber: body.licenseNumber,
          licenseType: body.licenseType,
          licenseHolder: body.licenseHolder,
          tradingName: body.tradingName,
          registrationNumber: body.registrationNumber,
          issuedBy: body.issuedBy || 'Gauteng Liquor Board', // Default issuing authority
          issueDate: body.issueDate,
          expiryDate: body.expiryDate,
          status: body.status || 'active',
          premisesAddress: body.premisesAddress,
          premisesType: body.premisesType,
          conditions: body.conditions,
          authorizedHours: body.authorizedHours,
          maxCapacity: body.maxCapacity,
          managerName: body.managerName,
          managerId: body.managerId,
          contactPhone: body.contactPhone,
          contactEmail: body.contactEmail,
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      data: license,
      message: body.id ? 'License updated successfully' : 'License created successfully'
    })
  } catch (error) {
    console.error('Error creating/updating license:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create/update license' },
      { status: 500 }
    )
  }
}
