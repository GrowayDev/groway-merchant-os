import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'

// Create a fresh PrismaClient instance
const getPrisma = () => {
  const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({ log: ['query'] })
  }
  return globalForPrisma.prisma
}
const db = getPrisma()

// GET - List all age verifications
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const flagged = searchParams.get('flagged')
    
    const where: any = {}
    if (flagged === 'true') where.flagged = true
    
    const verifications = await db.ageVerification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })
    
    const total = await db.ageVerification.count({ where })
    
    return NextResponse.json({
      data: verifications,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching age verifications:', error)
    return NextResponse.json({ error: 'Failed to fetch age verifications' }, { status: 500 })
  }
}

// POST - Create new age verification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const verification = await db.ageVerification.create({
      data: {
        verificationId: `AV-${Date.now()}-${nanoid(6)}`,
        documentType: body.documentType,
        documentNumber: body.documentNumber,
        customerName: body.customerName,
        dateOfBirth: body.dateOfBirth,
        ageVerified: body.ageVerified ?? false,
        verificationMethod: body.verificationMethod || 'manual',
        verifiedBy: body.verifiedBy,
        verifiedByName: body.verifiedByName,
        imageUrl: body.imageUrl,
        confidence: body.confidence,
        productId: body.productId,
        productName: body.productName,
        saleId: body.saleId,
        location: body.location,
        notes: body.notes,
        flagged: body.flagged || false,
        flagReason: body.flagReason,
      },
    })
    
    return NextResponse.json(verification, { status: 201 })
  } catch (error) {
    console.error('Error creating age verification:', error)
    return NextResponse.json({ error: 'Failed to create age verification' }, { status: 500 })
  }
}
