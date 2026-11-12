import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get white label settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const corporateId = searchParams.get('corporateId')
    
    if (!corporateId) {
      return NextResponse.json({ error: 'corporateId is required' }, { status: 400 })
    }
    
    let settings = await db.enterpriseWhiteLabel.findUnique({
      where: { corporateId }
    })
    
    // Create default settings if not exist
    if (!settings) {
      settings = await db.enterpriseWhiteLabel.create({
        data: {
          corporateId,
          primaryColor: '#00897B',
          secondaryColor: '#00695C',
          accentColor: '#4CAF50'
        }
      })
    }
    
    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error fetching white label settings:', error)
    return NextResponse.json({ error: 'Failed to fetch white label settings' }, { status: 500 })
  }
}

// PUT - Update white label settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { corporateId, ...updateData } = body
    
    if (!corporateId) {
      return NextResponse.json({ error: 'corporateId is required' }, { status: 400 })
    }
    
    // Check if settings exist
    let settings = await db.enterpriseWhiteLabel.findUnique({
      where: { corporateId }
    })
    
    if (settings) {
      settings = await db.enterpriseWhiteLabel.update({
        where: { corporateId },
        data: {
          ...updateData,
          updatedAt: new Date()
        }
      })
    } else {
      settings = await db.enterpriseWhiteLabel.create({
        data: {
          corporateId,
          ...updateData
        }
      })
    }

    // Log activity
    await db.enterpriseActivity.create({
      data: {
        corporateId,
        type: 'whitelabel_updated',
        message: 'White label settings updated',
        entityType: 'whitelabel',
        entityId: settings.id
      }
    })

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error updating white label settings:', error)
    return NextResponse.json({ error: 'Failed to update white label settings' }, { status: 500 })
  }
}
