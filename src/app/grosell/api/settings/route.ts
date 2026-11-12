import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// GET - Get settings for a merchant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId required' }, { status: 400 })
    }

    let settings = await db.groSellSettings.findUnique({
      where: { merchantId }
    })

    // Create default settings if not exists
    if (!settings) {
      settings = await db.groSellSettings.create({
        data: {
          id: `gss_${nanoid(12)}`,
          merchantId,
          whatsappNumber: '+27817184013', // Default number from user
          businessName: 'My Business',
          greetingMessage: 'Welcome to our WhatsApp store! Browse our products and place your order.',
          awayMessage: 'We are currently closed. We will respond during business hours.',
          orderConfirmationMsg: 'Thank you for your order! We will prepare it shortly.',
          paymentInstructions: 'Please pay via EFT, Card, or Cash on Delivery.',
          updatedAt: new Date()
        }
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error fetching GroSell settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// PUT - Update settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { merchantId, ...updateData } = body

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId required' }, { status: 400 })
    }

    // Check if settings exist
    let settings = await db.groSellSettings.findUnique({
      where: { merchantId }
    })

    if (settings) {
      settings = await db.groSellSettings.update({
        where: { merchantId },
        data: {
          ...updateData,
          updatedAt: new Date()
        }
      })
    } else {
      settings = await db.groSellSettings.create({
        data: {
          id: `gss_${nanoid(12)}`,
          merchantId,
          ...updateData,
          updatedAt: new Date()
        }
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error updating GroSell settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
