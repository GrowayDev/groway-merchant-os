import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseGs1ElementString, computeSapeSignature } from '@/lib/sape'

// ============================================
// SAPE Layer 4 — POS Verification (<500ms SLA)
// Single-pass checks: existence → signature → expiry → network block
// ============================================

const SLA_TARGET_MS = 500

interface PosLookupResult {
  id: string
  serialNumber: string
  status: string
  ProductIdentity: {
    gtin: string
    batchNumber: string
    productName: string | null
    expiryDate: Date
    signature: string
    manufacturerId: string
    Manufacturer: { companyName: string } | null
  }
}

// POST /merchant-os/api/sape/pos/verify
export async function POST(request: NextRequest) {
  const startedAt = Date.now()
  try {
    const body = await request.json()
    const barcodeData = String(body.barcodeData || '').trim()
    const operatorId = body.operatorId ? String(body.operatorId) : null
    const merchantId = body.merchantId ? String(body.merchantId) : null
    const transactionId = body.transactionId ? String(body.transactionId) : null

    if (!barcodeData) {
      return NextResponse.json(
        { success: false, error: 'barcodeData is required' },
        { status: 400 }
      )
    }

    // 1) Parse GS1 element string (with or without parentheses); fall back to raw serial
    const parsed = parseGs1ElementString(barcodeData)
    const serialNumber = parsed.serial || (!parsed.gtin && !parsed.batch ? barcodeData : undefined)

    // 2) Lookup serial (or identity by gtin+batch → first serial)
    const serial: PosLookupResult | null = await lookupSerial(serialNumber, parsed.gtin, parsed.batch)

    if (!serial) {
      const responseTimeMs = Date.now() - startedAt
      await db.sapePosVerification.create({
        data: {
          id: crypto.randomUUID(),
          transactionId,
          productSerialId: null,
          gtin: parsed.gtin || null,
          batchNumber: parsed.batch || null,
          verificationResult: false,
          failureReason: 'SERIAL_NOT_FOUND',
          responseTimeMs,
          operatorId,
          merchantId,
        },
      })
      await db.sapeVerificationFailure.create({
        data: {
          id: crypto.randomUUID(),
          productSerialId: null,
          gtin: parsed.gtin || null,
          failureReason: 'SERIAL_NOT_FOUND',
          operatorId,
          merchantId,
          actionTaken: null,
        },
      })
      return NextResponse.json({
        success: true,
        verified: false,
        responseTimeMs,
        failureReason: 'SERIAL_NOT_FOUND',
        productIdentity: null,
        slaTargetMs: SLA_TARGET_MS,
        withinSla: responseTimeMs <= SLA_TARGET_MS,
      })
    }

    const identity = serial.ProductIdentity

    // 3) Signature check — recompute HMAC over identity fields
    const expectedSignature = computeSapeSignature(
      identity.gtin,
      identity.batchNumber,
      identity.expiryDate,
      identity.manufacturerId
    )
    const signatureValid = expectedSignature === identity.signature

    // 4) Expiry check
    const expired = identity.expiryDate.getTime() < Date.now()

    // 5) Network block check (active block for gtin)
    let blockReason: string | null = null
    if (signatureValid && !expired) {
      const block = await db.sapeNetworkBlock.findFirst({
        where: { productGtin: identity.gtin, active: true },
        select: { blockReason: true },
      })
      blockReason = block?.blockReason || null
    }

    const verified = signatureValid && !expired && !blockReason
    const failureReason = verified
      ? undefined
      : !signatureValid
        ? 'SIGNATURE_INVALID'
        : expired
          ? 'EXPIRED'
          : 'NETWORK_BLOCKED'

    const responseTimeMs = Date.now() - startedAt

    // Record the POS verification (+ failure log when failed). Serial status is NOT changed here.
    await db.sapePosVerification.create({
      data: {
        id: crypto.randomUUID(),
        transactionId,
        productSerialId: serial.id,
        gtin: identity.gtin,
        batchNumber: identity.batchNumber,
        verificationResult: verified,
        failureReason: failureReason || null,
        responseTimeMs,
        operatorId,
        merchantId,
      },
    })

    if (!verified) {
      await db.sapeVerificationFailure.create({
        data: {
          id: crypto.randomUUID(),
          productSerialId: serial.id,
          gtin: identity.gtin,
          failureReason: failureReason || 'UNKNOWN',
          operatorId,
          merchantId,
          actionTaken: blockReason ? 'NETWORK_BLOCK_ENFORCED' : null,
        },
      })
    }

    return NextResponse.json({
      success: true,
      verified,
      responseTimeMs,
      failureReason,
      productIdentity: {
        gtin: identity.gtin,
        batchNumber: identity.batchNumber,
        productName: identity.productName,
        expiryDate: identity.expiryDate,
        serialNumber: serial.serialNumber,
        serialStatus: serial.status,
        manufacturer: identity.Manufacturer?.companyName || null,
        signatureValid,
        expired,
        networkBlockReason: blockReason,
      },
      slaTargetMs: SLA_TARGET_MS,
      withinSla: responseTimeMs <= SLA_TARGET_MS,
    })
  } catch (error) {
    console.error('SAPE POS verify error:', error)
    const responseTimeMs = Date.now() - startedAt
    return NextResponse.json(
      { success: false, error: 'Verification failed', responseTimeMs },
      { status: 500 }
    )
  }
}

// Single indexed lookup: by serial number first, then by gtin+batch
async function lookupSerial(
  serialNumber?: string,
  gtin?: string,
  batch?: string
): Promise<PosLookupResult | null> {
  if (serialNumber) {
    const found = await db.sapeProductSerial.findUnique({
      where: { serialNumber },
      include: {
        ProductIdentity: {
          include: { Manufacturer: { select: { companyName: true } } },
        },
      },
    })
    if (!found) return null
    return {
      id: found.id,
      serialNumber: found.serialNumber,
      status: found.status,
      ProductIdentity: {
        gtin: found.ProductIdentity.gtin,
        batchNumber: found.ProductIdentity.batchNumber,
        productName: found.ProductIdentity.productName,
        expiryDate: found.ProductIdentity.expiryDate,
        signature: found.ProductIdentity.signature,
        manufacturerId: found.ProductIdentity.manufacturerId,
        Manufacturer: found.ProductIdentity.Manufacturer,
      },
    }
  }

  if (gtin && batch) {
    const identity = await db.sapeProductIdentity.findUnique({
      where: { gtin_batchNumber: { gtin, batchNumber: batch } },
      include: {
        Manufacturer: { select: { companyName: true } },
        Serials: { take: 1, orderBy: { createdAt: 'asc' } },
      },
    })
    if (!identity || identity.Serials.length === 0) return null
    const firstSerial = identity.Serials[0]
    return {
      id: firstSerial.id,
      serialNumber: firstSerial.serialNumber,
      status: firstSerial.status,
      ProductIdentity: {
        gtin: identity.gtin,
        batchNumber: identity.batchNumber,
        productName: identity.productName,
        expiryDate: identity.expiryDate,
        signature: identity.signature,
        manufacturerId: identity.manufacturerId,
        Manufacturer: identity.Manufacturer,
      },
    }
  }

  return null
}
