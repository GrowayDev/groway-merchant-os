import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SAPE_CUSTODY_EVENTS } from '@/lib/sape'

// ============================================
// SAPE Layer 3 — Chain of Custody
// ============================================

// POST /merchant-os/api/sape/custody — append a custody event to a serial
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { serialNumber, eventType, locationLat, locationLng, locationLabel, actorId, actorName, metadata } = body

    if (!serialNumber || !eventType) {
      return NextResponse.json(
        { success: false, error: 'serialNumber and eventType are required' },
        { status: 400 }
      )
    }
    if (!SAPE_CUSTODY_EVENTS.includes(eventType)) {
      return NextResponse.json(
        { success: false, error: `eventType must be one of: ${SAPE_CUSTODY_EVENTS.join(', ')}` },
        { status: 400 }
      )
    }
    if (!actorId) {
      return NextResponse.json({ success: false, error: 'actorId is required' }, { status: 400 })
    }

    const serial = await db.sapeProductSerial.findUnique({
      where: { serialNumber },
      include: { ProductIdentity: { select: { gtin: true, productName: true } } },
    })
    if (!serial) {
      return NextResponse.json({ success: false, error: 'Serial not found' }, { status: 404 })
    }

    const now = new Date()

    const event = await db.sapeCustodyEvent.create({
      data: {
        id: crypto.randomUUID(),
        productSerialId: serial.id,
        eventType,
        locationLat: typeof locationLat === 'number' ? locationLat : locationLat ? parseFloat(String(locationLat)) : null,
        locationLng: typeof locationLng === 'number' ? locationLng : locationLng ? parseFloat(String(locationLng)) : null,
        locationLabel: locationLabel ? String(locationLabel) : null,
        actorId: String(actorId),
        actorName: actorName ? String(actorName) : null,
        timestamp: now,
        metadata: metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null,
      },
    })

    // Update serial state
    const nextStatus =
      eventType === 'SOLD' ? 'SOLD' : eventType === 'DISPATCHED_NODE' ? 'IN_TRANSIT' : 'ACTIVE'

    const updatedSerial = await db.sapeProductSerial.update({
      where: { id: serial.id },
      data: {
        status: nextStatus,
        currentLocation: locationLabel ? String(locationLabel) : serial.currentLocation,
        ...(eventType === 'SOLD' ? { soldAt: now } : {}),
      },
    })

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        eventType: event.eventType,
        locationLabel: event.locationLabel,
        actorId: event.actorId,
        actorName: event.actorName,
        timestamp: event.timestamp,
      },
      serial: {
        serialNumber: updatedSerial.serialNumber,
        status: updatedSerial.status,
        currentLocation: updatedSerial.currentLocation,
        soldAt: updatedSerial.soldAt,
      },
      product: serial.ProductIdentity,
    })
  } catch (error) {
    console.error('SAPE custody POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to record custody event' }, { status: 500 })
  }
}

// GET /merchant-os/api/sape/custody?serialNumber=...  (or ?identityId=... to use the first serial)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serialNumber = searchParams.get('serialNumber')
    const identityId = searchParams.get('identityId')

    let serial = null
    if (serialNumber) {
      serial = await db.sapeProductSerial.findUnique({
        where: { serialNumber },
        include: {
          ProductIdentity: {
            include: { Manufacturer: { select: { id: true, companyName: true } } },
          },
        },
      })
    } else if (identityId) {
      const firstSerial = await db.sapeProductSerial.findFirst({
        where: { productIdentityId: identityId },
        orderBy: { createdAt: 'asc' },
        include: {
          ProductIdentity: {
            include: { Manufacturer: { select: { id: true, companyName: true } } },
          },
        },
      })
      serial = firstSerial
    } else {
      return NextResponse.json(
        { success: false, error: 'serialNumber or identityId query param is required' },
        { status: 400 }
      )
    }

    if (!serial) {
      return NextResponse.json({ success: false, error: 'Serial not found' }, { status: 404 })
    }

    const chain = await db.sapeCustodyEvent.findMany({
      where: { productSerialId: serial.id },
      orderBy: { timestamp: 'asc' },
      take: 200,
    })

    return NextResponse.json({
      success: true,
      serial: {
        id: serial.id,
        serialNumber: serial.serialNumber,
        status: serial.status,
        currentLocation: serial.currentLocation,
        soldAt: serial.soldAt,
      },
      productIdentity: {
        id: serial.ProductIdentity.id,
        gtin: serial.ProductIdentity.gtin,
        batchNumber: serial.ProductIdentity.batchNumber,
        productName: serial.ProductIdentity.productName,
        expiryDate: serial.ProductIdentity.expiryDate,
        signature: serial.ProductIdentity.signature,
        gs1DataMatrix: serial.ProductIdentity.gs1DataMatrix,
        manufacturer: serial.ProductIdentity.Manufacturer?.companyName || null,
      },
      custodyChain: chain.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        locationLabel: e.locationLabel,
        locationLat: e.locationLat,
        locationLng: e.locationLng,
        actorId: e.actorId,
        actorName: e.actorName,
        timestamp: e.timestamp,
        metadata: e.metadata,
      })),
    })
  } catch (error) {
    console.error('SAPE custody GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch custody chain' }, { status: 500 })
  }
}
