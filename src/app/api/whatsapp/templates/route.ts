/**
 * WhatsApp Templates API
 * Manage WhatsApp notification templates
 */

import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// Get all WhatsApp templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    
    const templates = await db.notificationTemplate.findMany({
      where: {
        channel: 'whatsapp',
        isActive: true,
        OR: [
          { merchantId },
          { isSystem: true },
        ],
      },
      orderBy: [
        { isSystem: 'desc' },
        { name: 'asc' },
      ],
    })
    
    return NextResponse.json({ templates })
  } catch (error) {
    console.error('[WHATSAPP TEMPLATES] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get templates' },
      { status: 500 }
    )
  }
}

// Create or update a template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, merchantId, name, code, body: templateBody, variables } = body
    
    // Validate required fields
    if (!name || !code || !templateBody) {
      return NextResponse.json(
        { error: 'Name, code, and body are required' },
        { status: 400 }
      )
    }
    
    // Check if template code already exists
    const existing = await db.notificationTemplate.findUnique({
      where: { code },
    })
    
    if (existing && existing.id !== id) {
      return NextResponse.json(
        { error: 'Template code already exists' },
        { status: 400 }
      )
    }
    
    let template
    
    if (id) {
      // Update existing template
      template = await db.notificationTemplate.update({
        where: { id },
        data: {
          name,
          body: templateBody,
          updatedAt: new Date(),
        },
      })
    } else {
      // Create new template
      template = await db.notificationTemplate.create({
        data: {
          merchantId: merchantId || null,
          name,
          code,
          channel: 'whatsapp',
          body: templateBody,
          isSystem: false,
          isActive: true,
        },
      })
    }
    
    return NextResponse.json({ template })
  } catch (error) {
    console.error('[WHATSAPP TEMPLATES] Error:', error)
    return NextResponse.json(
      { error: 'Failed to save template' },
      { status: 500 }
    )
  }
}

// Delete a template
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Template ID required' },
        { status: 400 }
      )
    }
    
    // Check if it's a system template
    const template = await db.notificationTemplate.findUnique({
      where: { id },
    })
    
    if (template?.isSystem) {
      return NextResponse.json(
        { error: 'Cannot delete system templates' },
        { status: 400 }
      )
    }
    
    await db.notificationTemplate.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[WHATSAPP TEMPLATES] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}
