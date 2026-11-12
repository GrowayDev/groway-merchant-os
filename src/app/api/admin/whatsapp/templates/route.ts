/**
 * Admin WhatsApp Templates API
 * Manage WhatsApp message templates for the admin console
 */

import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/whatsapp/templates - List all templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    const whereClause: Record<string, unknown> = {}
    if (category) whereClause.category = category
    if (status) whereClause.status = status

    // Try to fetch from database
    const templates = await db.whatsAppTemplate.findMany({
      where: whereClause,
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    // If no templates in database, return demo data
    if (templates.length === 0) {
      const demoTemplates = generateDemoTemplates()
      return NextResponse.json({ templates: demoTemplates })
    }

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('[ADMIN WHATSAPP TEMPLATES] Error:', error)
    // Return demo data on error
    const demoTemplates = generateDemoTemplates()
    return NextResponse.json({ templates: demoTemplates })
  }
}

// POST /api/admin/whatsapp/templates - Create a new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      templateName,
      templateId,
      category,
      language,
      bodyText,
      headerText,
      footerText,
      buttonConfig,
      exampleData,
    } = body

    // Validate required fields
    if (!templateName || !bodyText || !category) {
      return NextResponse.json(
        { error: 'Template name, body text, and category are required' },
        { status: 400 }
      )
    }

    // Check if template name already exists
    const existing = await db.whatsAppTemplate.findFirst({
      where: { templateName },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Template name already exists' },
        { status: 400 }
      )
    }

    const template = await db.whatsAppTemplate.create({
      data: {
        id: `wa-tmpl-${Date.now()}`,
        templateName,
        templateId: templateId || null,
        category,
        language: language || 'en',
        bodyText,
        headerText: headerText || null,
        footerText: footerText || null,
        buttonConfig: buttonConfig ? JSON.stringify(buttonConfig) : null,
        exampleData: exampleData ? JSON.stringify(exampleData) : null,
        status: 'pending',
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, template })
  } catch (error) {
    console.error('[ADMIN WHATSAPP TEMPLATES] Error creating template:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/whatsapp/templates - Update a template
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      templateName,
      templateId,
      category,
      language,
      bodyText,
      headerText,
      footerText,
      buttonConfig,
      exampleData,
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Check if template exists
    const existing = await db.whatsAppTemplate.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Check if new name conflicts with another template
    if (templateName && templateName !== existing.templateName) {
      const nameConflict = await db.whatsAppTemplate.findFirst({
        where: { templateName, id: { not: id } },
      })
      if (nameConflict) {
        return NextResponse.json(
          { error: 'Template name already exists' },
          { status: 400 }
        )
      }
    }

    const template = await db.whatsAppTemplate.update({
      where: { id },
      data: {
        templateName: templateName || existing.templateName,
        templateId: templateId !== undefined ? templateId : existing.templateId,
        category: category || existing.category,
        language: language || existing.language,
        bodyText: bodyText || existing.bodyText,
        headerText: headerText !== undefined ? headerText : existing.headerText,
        footerText: footerText !== undefined ? footerText : existing.footerText,
        buttonConfig: buttonConfig ? JSON.stringify(buttonConfig) : existing.buttonConfig,
        exampleData: exampleData ? JSON.stringify(exampleData) : existing.exampleData,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, template })
  } catch (error) {
    console.error('[ADMIN WHATSAPP TEMPLATES] Error updating template:', error)
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/whatsapp/templates - Delete a template
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Check if template is being used by any campaigns
    const campaignsUsing = await db.whatsAppCampaign.count({
      where: { templateId: id },
    })

    if (campaignsUsing > 0) {
      return NextResponse.json(
        { error: `Cannot delete template. It is being used by ${campaignsUsing} campaign(s)` },
        { status: 400 }
      )
    }

    await db.whatsAppTemplate.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ADMIN WHATSAPP TEMPLATES] Error deleting template:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}

// Generate demo templates
function generateDemoTemplates() {
  const now = Date.now()
  return [
    {
      id: 'wa-tmpl-001',
      templateName: 'welcome_message',
      templateId: 'welcome_message_en',
      category: 'marketing',
      language: 'en',
      bodyText: 'Welcome to {{business_name}}! 🎉 We\'re excited to have you. Use code WELCOME10 for 10% off your first order.',
      headerText: 'Welcome!',
      footerText: 'Reply STOP to opt out',
      buttonConfig: JSON.stringify([
        { type: 'quick_reply', text: 'Shop Now' },
        { type: 'quick_reply', text: 'Learn More' },
      ]),
      exampleData: JSON.stringify({ business_name: 'GroStore' }),
      status: 'approved',
      rejectionReason: null,
      createdAt: new Date(now - 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now - 30 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'wa-tmpl-002',
      templateName: 'order_confirmation',
      templateId: 'order_confirmation_en',
      category: 'utility',
      language: 'en',
      bodyText: 'Thank you for your order! 📦\n\nOrder: #{{order_number}}\nTotal: {{total}}\n\nWe\'ll notify you when it\'s on the way.',
      headerText: 'Order Confirmed',
      footerText: null,
      buttonConfig: JSON.stringify([
        { type: 'url', text: 'Track Order', url: '{{tracking_url}}' },
      ]),
      exampleData: JSON.stringify({ order_number: 'ORD-12345', total: 'R299.99', tracking_url: 'https://example.com/track' }),
      status: 'approved',
      rejectionReason: null,
      createdAt: new Date(now - 25 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now - 25 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'wa-tmpl-003',
      templateName: 'delivery_notification',
      templateId: 'delivery_notification_en',
      category: 'utility',
      language: 'en',
      bodyText: 'Your order #{{order_number}} is out for delivery! 🚚\n\nExpected arrival: {{delivery_time}}\n\nDriver: {{driver_name}}',
      headerText: 'Out for Delivery',
      footerText: null,
      buttonConfig: null,
      exampleData: JSON.stringify({ order_number: 'ORD-12345', delivery_time: '2:00 PM - 4:00 PM', driver_name: 'John' }),
      status: 'approved',
      rejectionReason: null,
      createdAt: new Date(now - 20 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now - 20 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'wa-tmpl-004',
      templateName: 'promotional_offer',
      templateId: null,
      category: 'marketing',
      language: 'en',
      bodyText: '🔥 {{offer_title}}!\n\n{{offer_description}}\n\nUse code {{promo_code}} at checkout.\nValid until {{expiry_date}}.',
      headerText: 'Special Offer',
      footerText: 'T&Cs apply. Reply STOP to opt out',
      buttonConfig: JSON.stringify([
        { type: 'url', text: 'Shop Now', url: '{{shop_url}}' },
      ]),
      exampleData: JSON.stringify({
        offer_title: 'Flash Sale',
        offer_description: 'Get 30% off all items',
        promo_code: 'FLASH30',
        expiry_date: '31 Dec 2024',
        shop_url: 'https://example.com/shop',
      }),
      status: 'pending',
      rejectionReason: null,
      createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'wa-tmpl-005',
      templateName: 'loyalty_points',
      templateId: 'loyalty_points_en',
      category: 'utility',
      language: 'en',
      bodyText: 'You have {{points}} loyalty points! ⭐\n\nThat\'s R{{value}} in rewards.\n\nPoints expire on {{expiry_date}}.',
      headerText: 'Loyalty Update',
      footerText: null,
      buttonConfig: JSON.stringify([
        { type: 'url', text: 'View Rewards', url: '{{rewards_url}}' },
      ]),
      exampleData: JSON.stringify({ points: '2,500', value: '250', expiry_date: '30 June 2025', rewards_url: 'https://example.com/rewards' }),
      status: 'approved',
      rejectionReason: null,
      createdAt: new Date(now - 15 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now - 15 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'wa-tmpl-006',
      templateName: 'abandoned_cart',
      templateId: null,
      category: 'marketing',
      language: 'en',
      bodyText: 'You left something behind! 🛒\n\n{{item_count}} item(s) waiting for you in your cart.\n\nComplete your purchase and get free shipping on orders over R500.',
      headerText: 'Don\'t Miss Out',
      footerText: 'Reply STOP to opt out',
      buttonConfig: JSON.stringify([
        { type: 'url', text: 'View Cart', url: '{{cart_url}}' },
      ]),
      exampleData: JSON.stringify({ item_count: '3', cart_url: 'https://example.com/cart' }),
      status: 'pending',
      rejectionReason: null,
      createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'wa-tmpl-007',
      templateName: 'appointment_reminder',
      templateId: 'appointment_reminder_en',
      category: 'utility',
      language: 'en',
      bodyText: 'Reminder: You have an appointment tomorrow 📅\n\nService: {{service}}\nTime: {{time}}\nLocation: {{location}}\n\nPlease arrive 10 minutes early.',
      headerText: 'Appointment Reminder',
      footerText: null,
      buttonConfig: JSON.stringify([
        { type: 'quick_reply', text: 'Confirm' },
        { type: 'quick_reply', text: 'Reschedule' },
        { type: 'quick_reply', text: 'Cancel' },
      ]),
      exampleData: JSON.stringify({ service: 'Haircut', time: '2:00 PM', location: '123 Main St' }),
      status: 'approved',
      rejectionReason: null,
      createdAt: new Date(now - 10 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now - 10 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'wa-tmpl-008',
      templateName: 'payment_receipt',
      templateId: 'payment_receipt_en',
      category: 'utility',
      language: 'en',
      bodyText: 'Payment Received ✅\n\nAmount: {{amount}}\nReference: {{reference}}\nDate: {{date}}\n\nThank you for your business!',
      headerText: 'Receipt',
      footerText: null,
      buttonConfig: JSON.stringify([
        { type: 'url', text: 'Download Receipt', url: '{{receipt_url}}' },
      ]),
      exampleData: JSON.stringify({ amount: 'R450.00', reference: 'PAY-12345', date: '15 Jan 2025', receipt_url: 'https://example.com/receipt' }),
      status: 'approved',
      rejectionReason: null,
      createdAt: new Date(now - 8 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now - 8 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'wa-tmpl-009',
      templateName: 'promo_rejected',
      templateId: null,
      category: 'marketing',
      language: 'en',
      bodyText: '🎉 HAPPY NEW YEAR! 🎉\n\nStart 2025 with amazing deals! Up to 50% off everything!\n\nShop now before it\'s gone!',
      headerText: 'NEW YEAR SALE',
      footerText: 'Reply STOP to opt out',
      buttonConfig: null,
      exampleData: null,
      status: 'rejected',
      rejectionReason: 'Template contains excessive punctuation and promotional language that doesn\'t meet WhatsApp guidelines.',
      createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'wa-tmpl-010',
      templateName: 'otp_verification',
      templateId: 'otp_verification_en',
      category: 'authentication',
      language: 'en',
      bodyText: 'Your verification code is {{otp_code}}.\n\nThis code expires in {{expiry_minutes}} minutes.\n\nDo not share this code with anyone.',
      headerText: 'Verification Code',
      footerText: null,
      buttonConfig: JSON.stringify([
        { type: 'copy', text: 'Copy Code', code: '{{otp_code}}' },
      ]),
      exampleData: JSON.stringify({ otp_code: '123456', expiry_minutes: '5' }),
      status: 'approved',
      rejectionReason: null,
      createdAt: new Date(now - 60 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now - 60 * 24 * 60 * 60 * 1000),
    },
  ]
}
