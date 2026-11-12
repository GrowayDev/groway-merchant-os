import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List all licenses
export async function GET(request: NextRequest) {
  try {
    const licenses = await db.liquorLicense.findMany({
      include: {
        documents: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        audits: {
          orderBy: { auditDate: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    
    // Check expiry status
    const today = new Date().toISOString().split('T')[0]
    const licensesWithStatus = licenses.map(license => ({
      ...license,
      isExpired: license.expiryDate < today,
      daysUntilExpiry: Math.ceil((new Date(license.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
    }))
    
    return NextResponse.json(licensesWithStatus)
  } catch (error) {
    console.error('Error fetching licenses:', error)
    return NextResponse.json({ error: 'Failed to fetch licenses' }, { status: 500 })
  }
}

// POST - Create new license
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const license = await db.liquorLicense.create({
      data: {
        licenseNumber: body.licenseNumber,
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
      },
    })
    
    return NextResponse.json(license, { status: 201 })
  } catch (error) {
    console.error('Error creating license:', error)
    return NextResponse.json({ error: 'Failed to create license' }, { status: 500 })
  }
}
