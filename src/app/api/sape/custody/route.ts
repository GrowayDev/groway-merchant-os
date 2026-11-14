/**
 * SAPE Layer 3 — Chain-of-custody events with hash-chaining + block anchoring.
 * GET  /api/sape/custody?payload=…   (merchant auth — timeline for a serial)
 * POST /api/sape/custody             (merchant auth — record event + anchor)
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSapeAuth, isNextResponse } from '@/lib/sape/auth'
import {
  GENESIS_HASH,
  hashBlock,
  hashEvent,
  merkleRoot,
  parseGs1Payload,
  signSerial,
} from '@/lib/sape/engine'
import { randomUUID } from 'crypto'

async function findSerialByPayload(payload: string) {
  const parsed = parseGs1Payload(payload)
  if (parsed.serial) {
    const bySerial = await db.productSerial.findUnique({ where: { serial: parsed.serial } })
    if (bySerial) return bySerial
  }
  if (parsed.raw) {
    const byPayload = await db.productSerial.findUnique({ where: { gs1Payload: parsed.raw } })
    if (byPayload) return byPayload
  }
  return null
}

export async function GET(request: NextRequest) {
  const auth = requireSapeAuth(request)
  if (isNextResponse(auth)) return auth

  try {
    const payload = request.nextUrl.searchParams.get('payload') || ''
    const serial = await findSerialByPayload(payload)
    if (!serial || serial.merchantId !== auth.merchantId) {
      return NextResponse.json({ success: false, error: 'Serial not found' }, { status: 404 })
    }
    const events = await db.custodyEvent.findMany({
      where: { serialId: serial.id },
      orderBy: { occurredAt: 'asc' },
    })
    const lastBlock = await db.networkBlock.findFirst({ orderBy: { blockNumber: 'desc' } })
    return NextResponse.json({
      success: true,
      data: { serial, events, chainHead: lastBlock?.blockHash ?? GENESIS_HASH },
    })
  } catch (error) {
    console.error('SAPE custody GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load custody trail' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = requireSapeAuth(request)
  if (isNextResponse(auth)) return auth

  try {
    const body = await request.json().catch(() => ({}))
    const { payload, eventType, fromParty, toParty, location, notes } = body

    if (!payload || !eventType) {
      return NextResponse.json(
        { success: false, error: 'payload and eventType are required' },
        { status: 400 }
      )
    }
    const ALLOWED = ['manufactured', 'shipped', 'received', 'sold', 'returned', 'destroyed', 'recalled']
    if (!ALLOWED.includes(String(eventType))) {
      return NextResponse.json(
        { success: false, error: `eventType must be one of: ${ALLOWED.join(', ')}` },
        { status: 400 }
      )
    }

    const serial = await findSerialByPayload(String(payload))
    if (!serial || serial.merchantId !== auth.merchantId) {
      return NextResponse.json({ success: false, error: 'Serial not found' }, { status: 404 })
    }

    const lastEvent = await db.custodyEvent.findFirst({
      where: { serialId: serial.id },
      orderBy: { occurredAt: 'desc' },
    })
    const previousHash = lastEvent?.eventHash ?? GENESIS_HASH
    const occurredAt = new Date()

    const eventHash = hashEvent({
      serial: serial.serial,
      eventType: String(eventType),
      from: fromParty || null,
      to: toParty || null,
      location: location || null,
      occurredAt: occurredAt.toISOString(),
      previousHash,
    })

    const event = await db.custodyEvent.create({
      data: {
        id: randomUUID(),
        serialId: serial.id,
        merchantId: auth.merchantId,
        eventType: String(eventType),
        fromPartyType: fromParty ? String(fromParty).split(':')[0] : null,
        fromPartyId: fromParty ? String(fromParty).split(':')[1] ?? null : null,
        toPartyType: toParty ? String(toParty).split(':')[0] : null,
        toPartyId: toParty ? String(toParty).split(':')[1] ?? null : null,
        location: location || null,
        eventHash,
        previousHash,
        signature: signSerial(eventHash),
        actorUserId: auth.userId,
        notes: notes || null,
        occurredAt,
      },
    })

    // Update serial holder/status
    const holderType = toParty ? String(toParty).split(':')[0] : serial.currentHolderType
    const holderId = toParty ? String(toParty).split(':')[1] ?? null : serial.currentHolderId
    await db.productSerial.update({
      where: { id: serial.id },
      data: {
        currentHolderType: holderType,
        currentHolderId: holderId,
        status: eventType === 'sold' ? 'sold' : eventType === 'recalled' ? 'recalled' : serial.status,
        soldAt: eventType === 'sold' ? occurredAt : serial.soldAt,
      },
    })

    // Anchor the event into the local append-only chain
    const lastBlock = await db.networkBlock.findFirst({ orderBy: { blockNumber: 'desc' } })
    const blockNumber = (lastBlock?.blockNumber ?? 0) + 1
    const previousBlockHash = lastBlock?.blockHash ?? GENESIS_HASH
    const anchoredAt = new Date()
    const root = merkleRoot([eventHash])
    const blockHash = hashBlock({
      blockNumber,
      previousHash: previousBlockHash,
      merkleRoot: root,
      eventCount: 1,
      anchoredAt: anchoredAt.toISOString(),
    })

    const block = await db.networkBlock.create({
      data: {
        id: randomUUID(),
        blockNumber,
        blockHash,
        previousHash: previousBlockHash,
        merkleRoot: root,
        eventCount: 1,
        eventType: String(eventType),
        payload: JSON.stringify({ events: [eventHash] }),
        anchoredAt,
      },
    })
    await db.blockchainAnchor.create({
      data: {
        id: randomUUID(),
        blockId: block.id,
        merkleRoot: root,
        anchorType: 'internal-chain',
        status: 'anchored',
        eventCount: 1,
        anchoredAt,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          event: {
            id: event.id,
            eventType: event.eventType,
            eventHash: event.eventHash,
            previousHash: event.previousHash,
          },
          block: {
            blockNumber: block.blockNumber,
            blockHash: block.blockHash,
            previousHash: block.previousHash,
            merkleRoot: block.merkleRoot,
          },
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('SAPE custody POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to record custody event' }, { status: 500 })
  }
}
