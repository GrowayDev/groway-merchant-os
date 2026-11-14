/**
 * SAPE Layer 2 — Batch serialisation (GS1 DataMatrix payloads + HMAC signatures).
 * POST /api/sape/serials/generate   (merchant auth)
 * Body: { gtin, batch, expiry (ISO), quantity (1–500), supplierCode? }
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSapeAuth, isNextResponse } from '@/lib/sape/auth'
import {
  buildGs1Payload,
  generateUnitSerial,
  signSerial,
} from '@/lib/sape/engine'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  const auth = requireSapeAuth(request)
  if (isNextResponse(auth)) return auth

  try {
    const body = await request.json().catch(() => ({}))
    const { gtin, batch, expiry, quantity } = body

    if (!gtin || !/^\d{6,14}$/.test(String(gtin))) {
      return NextResponse.json({ success: false, error: 'Valid GTIN required' }, { status: 400 })
    }
    const qty = Math.min(Math.max(parseInt(String(quantity || '1'), 10) || 1, 1), 500)

    const product = await db.productIdentity.findUnique({
      where: { merchantId_gtin: { merchantId: auth.merchantId, gtin: String(gtin) } },
    })
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not registered under this GTIN' },
        { status: 404 }
      )
    }

    const expiryDate = expiry ? new Date(String(expiry)) : null
    if (expiryDate && isNaN(expiryDate.getTime())) {
      return NextResponse.json({ success: false, error: 'Invalid expiry date' }, { status: 400 })
    }

    const now = new Date()
    const records = []
    for (let i = 0; i < qty; i++) {
      const serial = generateUnitSerial(String(gtin))
      const payload = buildGs1Payload({ gtin: String(gtin), batch, expiry: expiryDate, serial })
      const signature = signSerial(payload)
      records.push({
        id: randomUUID(),
        productIdentityId: product.id,
        merchantId: auth.merchantId,
        serial,
        gs1Payload: payload,
        batchNumber: batch || null,
        expiryDate,
        signature,
        producedAt: now,
      })
    }

    await db.productSerial.createMany({ data: records })

    return NextResponse.json(
      {
        success: true,
        data: {
          generated: records.length,
          product: { gtin: product.gtin, productName: product.productName },
          serials: records.map((r) => ({
            serial: r.serial,
            gs1Payload: r.gs1Payload,
            signed: true,
          })),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('SAPE serials generate error:', error)
    return NextResponse.json({ success: false, error: 'Failed to generate serials' }, { status: 500 })
  }
}
