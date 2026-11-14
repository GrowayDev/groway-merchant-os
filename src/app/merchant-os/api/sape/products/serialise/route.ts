import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  computeSapeSignature,
  buildGs1DataMatrix,
  computeAnchorHash,
  buildSerialNumber,
} from '@/lib/sape'

// ============================================
// SAPE Layer 2 — Product Serialisation (GS1 + signatures)
// ============================================

// POST /merchant-os/api/sape/products/serialise
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { gtin, batchNumber, expiryDate, productionDate, manufacturerId, productName, quantity } = body

    if (!gtin || !batchNumber || !expiryDate || !manufacturerId) {
      return NextResponse.json(
        { success: false, error: 'gtin, batchNumber, expiryDate and manufacturerId are required' },
        { status: 400 }
      )
    }

    const quantityNum = Math.max(1, Math.min(parseInt(String(quantity || 1), 10) || 1, 500))

    const manufacturer = await db.sapeAuthenticatedSupplier.findUnique({
      where: { id: manufacturerId },
    })
    if (!manufacturer) {
      return NextResponse.json({ success: false, error: 'Manufacturer (supplier) not found' }, { status: 404 })
    }

    const expiry = new Date(expiryDate)
    if (isNaN(expiry.getTime())) {
      return NextResponse.json({ success: false, error: 'Invalid expiryDate' }, { status: 400 })
    }

    // Cryptographic signature: HMAC-SHA256 of gtin|batch|expiry|manufacturerId
    const signature = computeSapeSignature(String(gtin), String(batchNumber), expiry, String(manufacturerId))
    const now = new Date()
    const anchorHash = computeAnchorHash(signature, now)
    const gs1DataMatrix = buildGs1DataMatrix(String(gtin), expiry, String(batchNumber))

    // Reuse identity if (gtin, batch) already exists — append serials to it
    const identity = await db.sapeProductIdentity.upsert({
      where: { gtin_batchNumber: { gtin: String(gtin), batchNumber: String(batchNumber) } },
      create: {
        id: crypto.randomUUID(),
        gtin: String(gtin),
        batchNumber: String(batchNumber),
        expiryDate: expiry,
        productionDate: productionDate ? new Date(productionDate) : null,
        manufacturerId,
        productName: productName ? String(productName) : null,
        signature,
        signatureAlg: 'HMAC-SHA256',
        anchorHash,
        gs1DataMatrix,
        status: 'ACTIVE',
      },
      update: {
        expiryDate: expiry,
        productionDate: productionDate ? new Date(productionDate) : null,
        ...(productName ? { productName: String(productName) } : {}),
        signature,
        signatureAlg: 'HMAC-SHA256',
        anchorHash,
        gs1DataMatrix,
      },
    })

    // Serial numbers: SAPE-{gtin last 6}-{batch}-{base36 counter padded}
    const existingCount = await db.sapeProductSerial.count({ where: { productIdentityId: identity.id } })

    const serialsData = Array.from({ length: quantityNum }, (_, i) => ({
      id: crypto.randomUUID(),
      productIdentityId: identity.id,
      serialNumber: buildSerialNumber(String(gtin), String(batchNumber), existingCount + i + 1),
      status: 'ACTIVE',
      currentLocation: 'MANUFACTURER',
    }))

    await db.sapeProductSerial.createMany({ data: serialsData })

    const serials = await db.sapeProductSerial.findMany({
      where: { productIdentityId: identity.id },
      orderBy: { createdAt: 'desc' },
      take: quantityNum,
    })

    return NextResponse.json({
      success: true,
      identity: {
        id: identity.id,
        gtin: identity.gtin,
        batchNumber: identity.batchNumber,
        productName: identity.productName,
        expiryDate: identity.expiryDate,
        manufacturer: { id: manufacturer.id, companyName: manufacturer.companyName },
        signature: identity.signature,
        signatureAlg: identity.signatureAlg,
        anchorHash: identity.anchorHash,
        gs1DataMatrix: identity.gs1DataMatrix,
        status: identity.status,
      },
      serialsCreated: serialsData.length,
      serials: serials.map((s) => ({
        id: s.id,
        serialNumber: s.serialNumber,
        status: s.status,
        currentLocation: s.currentLocation,
      })),
    })
  } catch (error) {
    console.error('SAPE serialise POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to serialise product' }, { status: 500 })
  }
}

// GET /merchant-os/api/sape/products/serialise — list identities with serial counts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gtin = searchParams.get('gtin')
    const manufacturerId = searchParams.get('manufacturerId')

    const where: Record<string, unknown> = {}
    if (gtin) where.gtin = { contains: gtin }
    if (manufacturerId) where.manufacturerId = manufacturerId

    const identities = await db.sapeProductIdentity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        Manufacturer: { select: { id: true, companyName: true, verificationStatus: true } },
        _count: { select: { Serials: true } },
        Serials: { take: 1, select: { serialNumber: true }, orderBy: { createdAt: 'asc' } },
      },
    })

    return NextResponse.json({
      success: true,
      identities: identities.map((p) => ({
        id: p.id,
        gtin: p.gtin,
        batchNumber: p.batchNumber,
        productName: p.productName,
        expiryDate: p.expiryDate,
        status: p.status,
        signature: p.signature,
        signatureAlg: p.signatureAlg,
        anchorHash: p.anchorHash,
        gs1DataMatrix: p.gs1DataMatrix,
        manufacturer: p.Manufacturer,
        serialCount: p._count.Serials,
        sampleSerial: p.Serials[0]?.serialNumber || null,
        createdAt: p.createdAt,
      })),
      total: identities.length,
    })
  } catch (error) {
    console.error('SAPE serialise GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch product identities' }, { status: 500 })
  }
}
