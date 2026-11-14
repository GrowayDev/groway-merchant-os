/**
 * SAPE Layer 2 — Product identity (GTIN) registration with origin declaration.
 * GET  /api/sape/products   (merchant auth)
 * POST /api/sape/products   (merchant auth)
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSapeAuth, isNextResponse } from '@/lib/sape/auth'
import { randomUUID } from 'crypto'

export async function GET(request: NextRequest) {
  const auth = requireSapeAuth(request)
  if (isNextResponse(auth)) return auth

  try {
    const products = await db.productIdentity.findMany({
      where: { merchantId: auth.merchantId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    return NextResponse.json({ success: true, data: products, count: products.length })
  } catch (error) {
    console.error('SAPE products GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = requireSapeAuth(request)
  if (isNextResponse(auth)) return auth

  try {
    const body = await request.json().catch(() => ({}))
    const { gtin, productName, sku, category, brand, origin } = body

    if (!gtin || !/^\d{6,14}$/.test(String(gtin))) {
      return NextResponse.json(
        { success: false, error: 'GTIN must be 6–14 digits (GS1 standard)' },
        { status: 400 }
      )
    }
    if (!productName || typeof productName !== 'string' || productName.trim().length < 2) {
      return NextResponse.json({ success: false, error: 'Product name is required' }, { status: 400 })
    }

    const existing = await db.productIdentity.findUnique({
      where: { merchantId_gtin: { merchantId: auth.merchantId, gtin: String(gtin) } },
    })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A product with this GTIN already exists' },
        { status: 409 }
      )
    }

    let originId: string | null = null
    if (origin && typeof origin === 'object') {
      const originRecord = await db.productOrigin.create({
        data: {
          id: randomUUID(),
          productId: `${auth.merchantId}:${gtin}`,
          gtin: String(gtin),
          productName: productName.trim(),
          manufacturerName: origin.manufacturerName || null,
          manufacturerCountry: origin.manufacturerCountry || 'ZA',
          region: origin.region || null,
          farmOrFacilityId: origin.farmOrFacilityId || null,
          farmCoordinates: origin.farmCoordinates || null,
          harvestDate: origin.harvestDate ? new Date(origin.harvestDate) : null,
          productionDate: origin.productionDate ? new Date(origin.productionDate) : null,
          certificates: JSON.stringify(origin.certificates ?? []),
          originStory: origin.originStory || null,
          declaredBy: auth.userId,
        },
      })
      originId = originRecord.id
    }

    const product = await db.productIdentity.create({
      data: {
        id: randomUUID(),
        merchantId: auth.merchantId,
        gtin: String(gtin),
        productName: productName.trim(),
        sku: sku || null,
        category: category || null,
        brand: brand || null,
        originId,
      },
    })

    return NextResponse.json({ success: true, data: product }, { status: 201 })
  } catch (error) {
    console.error('SAPE products POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to register product' }, { status: 500 })
  }
}
