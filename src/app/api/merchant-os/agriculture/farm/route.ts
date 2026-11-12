import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// GET /api/merchant-os/agriculture/farm - Get farm details
export async function GET(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') || 
                       request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ 
        farm: null, 
        message: 'No merchant ID provided' 
      })
    }

    const farm = await db.farm.findUnique({
      where: { merchantId },
      include: {
        _count: {
          select: { 
            Livestock: { where: { status: 'active' } },
            CropField: { where: { status: 'active' } },
            FarmCompliance: { where: { status: 'pending' } }
          }
        }
      }
    })

    if (!farm) {
      return NextResponse.json({ 
        farm: null, 
        message: 'No farm registered. Create your farm profile to get started.' 
      })
    }

    // Get livestock summary
    const livestockSummary = await db.livestock.groupBy({
      by: ['animalType', 'status'],
      where: { merchantId },
      _count: true
    })

    return NextResponse.json({ 
      farm: {
        ...farm,
        livestockCount: farm._count.Livestock,
        cropFieldCount: farm._count.CropField,
        pendingCompliance: farm._count.FarmCompliance,
        livestockByType: livestockSummary
      }
    })
  } catch (error) {
    console.error('Error fetching farm:', error)
    return NextResponse.json({ farm: null, message: 'Error fetching farm' })
  }
}

// POST /api/merchant-os/agriculture/farm - Create farm
export async function POST(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') ||
                       request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Merchant ID required' 
      }, { status: 400 })
    }

    const body = await request.json()
    
    // Check if farm already exists for this merchant
    const existingFarm = await db.farm.findUnique({
      where: { merchantId }
    })
    
    if (existingFarm) {
      return NextResponse.json({ 
        success: false, 
        error: 'Farm already exists for this merchant' 
      }, { status: 400 })
    }
    
    const farmId = `FRM-${nanoid(8).toUpperCase()}`

    const farm = await db.farm.create({
      data: {
        id: farmId,
        merchantId,
        farmName: body.farmName || 'My Farm',
        farmNumber: body.farmNumber,
        registrationNumber: body.registrationNumber,
        province: body.province || 'Unknown',
        district: body.district,
        municipality: body.municipality,
        totalHectares: body.totalHectares ? parseFloat(body.totalHectares) : 0,
        arableHectares: body.arableHectares,
        grazingHectares: body.grazingHectares,
        farmType: body.farmType || 'mixed',
        organicCertified: body.organicCertified || false,
        organicCertBody: body.organicCertBody,
        organicCertExpiry: body.organicCertExpiry,
        globalGapCertified: body.globalGapCertified || false,
        globalGapNumber: body.globalGapNumber,
        globalGapExpiry: body.globalGapExpiry,
        status: 'active',
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, farm })
  } catch (error) {
    console.error('Error creating farm:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create farm',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PATCH /api/merchant-os/agriculture/farm - Update farm
export async function PATCH(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') ||
                       request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Merchant ID required' 
      }, { status: 400 })
    }

    const body = await request.json()

    const farm = await db.farm.update({
      where: { merchantId },
      data: {
        ...body,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, farm })
  } catch (error) {
    console.error('Error updating farm:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update farm' 
    }, { status: 500 })
  }
}
