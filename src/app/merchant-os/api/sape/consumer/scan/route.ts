import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseGs1ElementString, computeSapeSignature } from '@/lib/sape'

// ============================================
// SAPE Layer 5 — Consumer Verification (PUBLIC, no auth)
// GET /merchant-os/api/sape/consumer/scan?serial=... or ?code=...
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rawCode = (searchParams.get('code') || searchParams.get('serial') || '').trim()
    const scanSource = searchParams.get('source') || 'qr'
    const deviceInfo = request.headers.get('user-agent') || undefined

    if (!rawCode) {
      return NextResponse.json(
        { success: false, verified: false, reason: 'MISSING_CODE', error: 'code or serial query param is required' },
        { status: 400 }
      )
    }

    // Accept a raw serial number or a full GS1 element string
    const parsed = parseGs1ElementString(rawCode)
    const serialNumber = parsed.serial || (!parsed.gtin && !parsed.batch ? rawCode : null)

    let serial = null
    if (serialNumber) {
      serial = await db.sapeProductSerial.findUnique({
        where: { serialNumber },
        include: {
          ProductIdentity: {
            include: { Manufacturer: { select: { companyName: true } } },
          },
        },
      })
    } else if (parsed.gtin && parsed.batch) {
      const identity = await db.sapeProductIdentity.findUnique({
        where: { gtin_batchNumber: { gtin: parsed.gtin, batchNumber: parsed.batch } },
        include: { Manufacturer: { select: { companyName: true } } },
      })
      if (identity) {
        const firstSerial = await db.sapeProductSerial.findFirst({
          where: { productIdentityId: identity.id },
          orderBy: { createdAt: 'asc' },
          include: {
            ProductIdentity: {
              include: { Manufacturer: { select: { companyName: true } } },
            },
          },
        })
        serial = firstSerial
      }
    }

    if (!serial) {
      await db.sapeConsumerScan.create({
        data: {
          id: crypto.randomUUID(),
          serialNumber: rawCode.slice(0, 120),
          gtin: parsed.gtin || null,
          productName: null,
          scanResult: 'FAILED',
          scanSource,
          deviceInfo,
          locationLabel: null,
        },
      })
      return NextResponse.json({
        success: true,
        verified: false,
        reason: 'SERIAL_NOT_FOUND',
        message: 'This code could not be found in the SAPE provenance registry.',
      })
    }

    const identity = serial.ProductIdentity
    const signatureValid =
      computeSapeSignature(identity.gtin, identity.batchNumber, identity.expiryDate, identity.manufacturerId) ===
      identity.signature
    const expired = identity.expiryDate.getTime() < Date.now()
    const activeBlock = await db.sapeNetworkBlock.findFirst({
      where: { productGtin: identity.gtin, active: true },
      select: { blockReason: true },
    })

    const verified = signatureValid && !expired && !activeBlock
    const reason = verified ? undefined : !signatureValid ? 'SIGNATURE_INVALID' : expired ? 'EXPIRED' : 'NETWORK_BLOCKED'

    const verificationCount = await db.sapeConsumerScan.count({ where: { serialNumber: serial.serialNumber } })

    await db.sapeConsumerScan.create({
      data: {
        id: crypto.randomUUID(),
        serialNumber: serial.serialNumber,
        gtin: identity.gtin,
        productName: identity.productName,
        scanResult: verified ? 'VERIFIED' : 'FAILED',
        scanSource,
        deviceInfo,
        locationLabel: null,
      },
    })

    // Custody summary: up to 6 most recent events, oldest → newest
    const recentEvents = await db.sapeCustodyEvent.findMany({
      where: { productSerialId: serial.id },
      orderBy: { timestamp: 'desc' },
      take: 6,
    })

    return NextResponse.json({
      success: true,
      verified,
      reason,
      productName: identity.productName || 'Registered Product',
      manufacturer: identity.Manufacturer?.companyName || null,
      gtin: identity.gtin,
      batchNumber: identity.batchNumber,
      serialNumber: serial.serialNumber,
      serialStatus: serial.status,
      expiry: identity.expiryDate,
      signatureValid,
      expired,
      networkBlockReason: activeBlock?.blockReason || null,
      verificationCount: verificationCount + 1,
      custodySummary: recentEvents
        .slice()
        .reverse()
        .map((e) => ({
          eventType: e.eventType,
          locationLabel: e.locationLabel,
          timestamp: e.timestamp,
          actorName: e.actorName,
        })),
    })
  } catch (error) {
    console.error('SAPE consumer scan error:', error)
    return NextResponse.json(
      { success: false, verified: false, reason: 'SERVER_ERROR', error: 'Scan failed' },
      { status: 500 }
    )
  }
}
