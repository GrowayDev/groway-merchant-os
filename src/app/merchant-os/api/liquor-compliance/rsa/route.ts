import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List RSA certifications
export async function GET(request: NextRequest) {
  try {
    const certifications = await db.rSACertification.findMany({
      orderBy: { staffName: 'asc' },
    })
    
    // Check expiry status
    const today = new Date().toISOString().split('T')[0]
    const certificationsWithStatus = certifications.map(cert => ({
      ...cert,
      isExpired: cert.expiryDate < today,
      daysUntilExpiry: Math.ceil((new Date(cert.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
    }))
    
    return NextResponse.json(certificationsWithStatus)
  } catch (error) {
    console.error('Error fetching RSA certifications:', error)
    return NextResponse.json({ error: 'Failed to fetch RSA certifications' }, { status: 500 })
  }
}

// POST - Create RSA certification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const cert = await db.rSACertification.create({
      data: {
        staffId: body.staffId,
        staffName: body.staffName,
        rsaNumber: body.rsaNumber,
        certificateType: body.certificateType || 'standard',
        issuingBody: body.issuingBody,
        issueDate: body.issueDate,
        expiryDate: body.expiryDate,
        status: body.status || 'active',
        trainingProvider: body.trainingProvider,
        trainingDate: body.trainingDate,
        notes: body.notes,
      },
    })
    
    return NextResponse.json(cert, { status: 201 })
  } catch (error) {
    console.error('Error creating RSA certification:', error)
    return NextResponse.json({ error: 'Failed to create RSA certification' }, { status: 500 })
  }
}
