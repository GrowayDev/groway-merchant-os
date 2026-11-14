/**
 * SAPE Layer 4 — POS verification (target <500ms end-to-end).
 * POST /api/sape/pos/verify   (merchant auth)
 * Body: { payload, branchId?, cashierId?, saleAmount? }
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSapeAuth, isNextResponse } from '@/lib/sape/auth'
import {
  parseGs1Payload,
  screenSale,
  verifySerialSignature,
  type VerifyResult,
} from '@/lib/sape/engine'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  const auth = requireSapeAuth(request)
  if (isNextResponse(auth)) return auth

  const started = Date.now()
  try {
    const body = await request.json().catch(() => ({}))
    const payload = String(body.payload || '').trim()
    if (!payload) {
      return NextResponse.json({ success: false, error: 'payload is required' }, { status: 400 })
    }

    const parsed = parseGs1Payload(payload)
    let result: VerifyResult = 'AUTHENTIC'
    let serialId: string | null = null
    let findings: ReturnType<typeof screenSale> = []

    if (!parsed.valid) {
      result = 'INVALID_PAYLOAD'
    } else {
      const serial = await db.productSerial.findUnique({
        where: { serial: parsed.serial! },
      })
      if (!serial || serial.merchantId !== auth.merchantId) {
        result = 'UNKNOWN_SERIAL'
      } else {
        serialId = serial.id
        const signatureOk = verifySerialSignature(serial.gs1Payload, serial.signature)
        const since = new Date(Date.now() - 60_000)
        const recentScans = await db.pOSVerification.count({
          where: { serialId: serial.id, checkedAt: { gte: since } },
        })
        findings = screenSale({
          serialStatus: serial.status,
          expiry: serial.expiryDate,
          recentScansLast60s: recentScans,
          lastSoldAt: serial.soldAt,
        })
        if (!signatureOk) {
          findings.push({
            anomalyType: 'signature-mismatch',
            severity: 'critical',
            description: 'HMAC signature verification failed — payload tampering suspected',
          })
        }
        if (serial.status === 'recalled') result = 'RECALLED'
        else if (!signatureOk || findings.some((f) => f.severity === 'critical' || f.severity === 'high'))
          result = 'SUSPECT'
      }
    }

    const latencyMs = Date.now() - started

    const verification = await db.pOSVerification.create({
      data: {
        id: randomUUID(),
        merchantId: auth.merchantId,
        branchId: body.branchId || null,
        serialId,
        scannedPayload: payload,
        result,
        latencyMs,
        cashierId: body.cashierId || null,
        saleAmount: typeof body.saleAmount === 'number' ? body.saleAmount : null,
      },
    })

    if (result !== 'AUTHENTIC') {
      await db.verificationFailure.create({
        data: {
          id: randomUUID(),
          posVerificationId: verification.id,
          merchantId: auth.merchantId,
          payload,
          failureReason: findings.map((f) => f.description).join('; ') || result,
          failureCode: result,
        },
      })
      await db.custodyAnomaly.createMany({
        data: findings
          .filter((f) => f.severity === 'critical' || f.severity === 'high')
          .map((f) => ({
            id: randomUUID(),
            serialId,
            merchantId: auth.merchantId,
            anomalyType: f.anomalyType,
            severity: f.severity,
            description: f.description,
            evidence: JSON.stringify({ payload, verificationId: verification.id }),
          })),
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        verificationId: verification.id,
        result,
        findings,
        latencyMs,
        withinSla: latencyMs < 500,
        product: serialId
          ? {
              gtin: parsed.gtin,
              batch: parsed.batch,
              expiry: parsed.expiry,
            }
          : null,
      },
    })
  } catch (error) {
    console.error('SAPE pos verify error:', error)
    return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 })
  }
}
