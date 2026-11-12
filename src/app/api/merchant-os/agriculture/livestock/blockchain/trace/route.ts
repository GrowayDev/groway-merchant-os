import { NextRequest, NextResponse } from 'next/server'

// GET /api/merchant-os/agriculture/livestock/blockchain/trace
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const animalTag = searchParams.get('animalTag')

    if (!merchantId) {
      return NextResponse.json(
        { error: 'Missing merchantId parameter' },
        { status: 400 }
      )
    }

    // Mock blockchain records
    const records = animalTag ? [
      {
        id: 'block-1',
        animalId: 'animal-001',
        animalTag: animalTag,
        blockNumber: 1234567,
        transactionHash: '0x7f9fade1c0d57a7af66ab4ead7c2eb7b11a91385',
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        eventType: 'birth',
        data: { breed: 'Brahman', dam: 'D045', sire: 'S012', weight: 35 },
        verifiedBy: ['Farm Manager', 'Veterinarian'],
        previousHash: '0x0000000000000000',
        currentHash: '0x7f9fade1c0d57a7af66ab4ead7c2eb7b11a91385',
        status: 'verified',
      },
      {
        id: 'block-2',
        animalId: 'animal-001',
        animalTag: animalTag,
        blockNumber: 1234568,
        transactionHash: '0x8a0gbef2d1e68b8bg77bc5fbe8d3fc8c22a02496',
        timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        eventType: 'vaccination',
        data: { vaccine: 'FMD', batch: 'FMD-2024-001', veterinarian: 'Dr. Smith' },
        verifiedBy: ['Veterinarian', 'Quality Control'],
        previousHash: '0x7f9fade1c0d57a7af66ab4ead7c2eb7b11a91385',
        currentHash: '0x8a0gbef2d1e68b8bg77bc5fbe8d3fc8c22a02496',
        status: 'verified',
      },
      {
        id: 'block-3',
        animalId: 'animal-001',
        animalTag: animalTag,
        blockNumber: 1234569,
        transactionHash: '0x9b1hcff3e2f79c9ch88cd6gcf9e4gd9d33b13507',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        eventType: 'weight',
        data: { weight: 420, method: 'scale', bodyConditionScore: 3.5 },
        verifiedBy: ['Farm Manager'],
        previousHash: '0x8a0gbef2d1e68b8bg77bc5fbe8d3fc8c22a02496',
        currentHash: '0x9b1hcff3e2f79c9ch88cd6gcf9e4gd9d33b13507',
        status: 'confirmed',
      },
    ] : []

    // Mock supply chain events
    const supplyChain = animalTag ? [
      {
        id: 'sc-1',
        animalId: 'animal-001',
        stage: 'farm',
        location: 'Leruo Farm, North Pasture',
        handler: 'John Farmer',
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        verified: true,
        transactionHash: '0x7f9fade1c0d57a7af66ab4ead7c2eb7b11a91385',
        notes: 'Animal born and raised on farm',
      },
      {
        id: 'sc-2',
        animalId: 'animal-001',
        stage: 'transport',
        location: 'Route: Farm → Auction',
        handler: 'SafeTrans Logistics',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        verified: true,
        transactionHash: '0xab2idgg4f3h8bd0di99de7hdg0f5he0e44c24618',
        temperature: 22,
        notes: 'Transport completed in 3 hours',
      },
    ] : []

    // Mock certificate
    const certificate = animalTag ? {
      id: `cert-${animalTag}`,
      animalId: 'animal-001',
      animalTag: animalTag,
      breed: 'Brahman',
      birthDate: '2023-06-15',
      birthLocation: 'Leruo Farm, North Pasture',
      currentStatus: 'At Auction',
      healthRecords: {
        vaccinations: 5,
        treatments: 1,
        healthChecks: 8,
      },
      certifications: ['Animal Welfare Approved', 'Grass-Fed Certified', 'Antibiotic-Free'],
      supplyChainLength: supplyChain.length,
      blockchainVerified: true,
      lastUpdated: new Date().toISOString(),
    } : null

    return NextResponse.json({
      records,
      supplyChain,
      certificate,
    })
  } catch (error) {
    console.error('Error fetching blockchain trace:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blockchain data' },
      { status: 500 }
    )
  }
}

// POST /api/merchant-os/agriculture/livestock/blockchain/trace
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { farmId, merchantId, animalId, eventType, data } = body

    if (!farmId || !merchantId || !animalId || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create a new blockchain record
    const record = {
      id: `block-${Date.now()}`,
      animalId,
      blockNumber: Math.floor(Math.random() * 10000000) + 1000000,
      transactionHash: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      timestamp: new Date().toISOString(),
      eventType,
      data,
      verifiedBy: ['System'],
      status: 'pending',
    }

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Error creating blockchain record:', error)
    return NextResponse.json(
      { error: 'Failed to create blockchain record' },
      { status: 500 }
    )
  }
}
