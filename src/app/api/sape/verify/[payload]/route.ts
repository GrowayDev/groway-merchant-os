/**
 * SAPE Layer 5 — PUBLIC consumer QR verification (no auth).
 * GET /api/sape/verify/[payload]
 * The proxy allowlists /api/sape/verify/ in publicApiRoutes.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseGs1Payload, verifySerialSignature } from '@/lib/sape/engine'
import { randomUUID } from 'crypto'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ payload: string }> }
) {
  const started = Date.now()
  try {
    const { payload: rawPayload } = await params
    const payload = decodeURIComponent(rawPayload || '').trim()
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Missing code' }, { status: 400 })
    }

    const parsed = parseGs1Payload(payload)
    const latencyMs = Date.now() - started

    if (!parsed.valid) {
      await db.consumerScan.create({
        data: {
          id: randomUUID(),
          scannedPayload: payload.slice(0, 200),
          result: 'INVALID',
        },
      })
      return NextResponse.json({
        success: true,
        data: {
          verdict: 'INVALID',
          headline: 'This code is not a valid SAPE product code',
          detail: 'It does not follow the GS1 DataMatrix structure (AI 01/10/17/21).',
          latencyMs,
        },
      })
    }

    const serial = await db.productSerial.findUnique({
      where: { serial: parsed.serial! },
    })

    if (!serial) {
      await db.consumerScan.create({
        data: {
          id: randomUUID(),
          scannedPayload: payload.slice(0, 200),
          result: 'UNKNOWN',
        },
      })
      return NextResponse.json({
        success: true,
        data: {
          verdict: 'UNKNOWN',
          headline: 'Code not recognised in the SAPE registry',
          detail:
            'This product serial does not exist in the registry. It may be counterfeit or issued before SAPE onboarding.',
          latencyMs,
        },
      })
    }

    const signatureOk = verifySerialSignature(serial.gs1Payload, serial.signature)
    const productIdentity = await db.productIdentity.findUnique({
      where: { id: serial.productIdentityId },
    })
    const origin = productIdentity?.originId
      ? await db.productOrigin.findUnique({ where: { id: productIdentity.originId } })
      : null
    const anomalies = await db.custodyAnomaly.count({
      where: { serialId: serial.id, resolved: false },
    })
    const custody = await db.custodyEvent.findMany({
      where: { serialId: serial.id },
      orderBy: { occurredAt: 'asc' },
      take: 20,
    })

    let verdict: 'AUTHENTIC' | 'SUSPECT' | 'RECALLED' = 'AUTHENTIC'
    if (serial.status === 'recalled') verdict = 'RECALLED'
    else if (!signatureOk || anomalies > 0 || serial.status === 'sold') verdict = 'SUSPECT'

    await db.consumerScan.create({
      data: {
        id: randomUUID(),
        serialId: serial.id,
        productIdentityId: serial.productIdentityId,
        scannedPayload: payload.slice(0, 200),
        result: verdict,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        verdict,
        headline:
          verdict === 'AUTHENTIC'
            ? '✓ Verified authentic product'
            : verdict === 'RECALLED'
              ? '⚠ This product has been RECALLED'
              : '⚠ Verification failed — suspected counterfeit',
        detail:
          verdict === 'AUTHENTIC'
            ? 'Signature, registry and custody checks all passed.'
            : verdict === 'RECALLED'
              ? 'The manufacturer has recalled this batch. Do not consume. Report below.'
              : 'One or more integrity checks failed (signature, custody gaps or prior sale). Report below.',
        product: {
          name: productIdentity?.productName ?? 'Unknown product',
          gtin: productIdentity?.gtin ?? parsed.gtin,
          brand: productIdentity?.brand ?? null,
        },
        origin: origin
          ? {
              manufacturer: origin.manufacturerName,
              country: origin.manufacturerCountry,
              region: origin.region,
              harvestDate: origin.harvestDate,
              certificates: JSON.parse(origin.certificates || '[]'),
              story: origin.originStory,
            }
          : null,
        batch: serial.batchNumber,
        expiry: serial.expiryDate,
        custodyTrail: custody.map((e) => ({
          eventType: e.eventType,
          location: e.location,
          at: e.occurredAt,
          hash: e.eventHash.slice(0, 12),
        })),
        chainIntegrity: { signatureOk, openAnomalies: anomalies },
        latencyMs: Date.now() - started,
      },
    })
  } catch (error) {
    console.error('SAPE public verify error:', error)
    return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 })
  }
}
