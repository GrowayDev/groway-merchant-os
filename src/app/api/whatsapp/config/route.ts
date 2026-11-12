/**
 * WhatsApp Configuration API
 * Manage WhatsApp Business API integration settings
 */

import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// Get WhatsApp configuration
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    
    const config = await db.integrationConfig.findFirst({
      where: {
        provider: 'whatsapp',
        service: 'messaging',
        ...(merchantId ? { merchantId } : { merchantId: null }),
      },
    })
    
    if (!config) {
      return NextResponse.json({
        configured: false,
        config: null,
      })
    }
    
    // Parse credentials but mask sensitive data
    const credentials = JSON.parse(config.credentials)
    
    return NextResponse.json({
      configured: true,
      config: {
        id: config.id,
        isActive: config.isActive,
        isDefault: config.isDefault,
        healthStatus: config.healthStatus,
        lastUsedAt: config.lastUsedAt,
        lastError: config.lastError,
        // Mask sensitive credentials
        phoneNumberId: credentials.phoneNumberId,
        businessAccountId: credentials.businessAccountId,
        appId: credentials.appId,
        hasAccessToken: !!credentials.accessToken,
        hasWebhookVerifyToken: !!credentials.webhookVerifyToken,
        hasAppSecret: !!credentials.appSecret,
      },
    })
  } catch (error) {
    console.error('[WHATSAPP CONFIG] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get configuration' },
      { status: 500 }
    )
  }
}

// Save WhatsApp configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { merchantId, phoneNumberId, businessAccountId, appId, appSecret, accessToken, webhookVerifyToken } = body
    
    // Validate required fields
    if (!phoneNumberId || !accessToken) {
      return NextResponse.json(
        { error: 'Phone Number ID and Access Token are required' },
        { status: 400 }
      )
    }
    
    // Check if config already exists
    const existing = await db.integrationConfig.findFirst({
      where: {
        provider: 'whatsapp',
        service: 'messaging',
        ...(merchantId ? { merchantId } : { merchantId: null }),
      },
    })
    
    const credentials = JSON.stringify({
      phoneNumberId,
      businessAccountId: businessAccountId || '',
      appId: appId || '',
      appSecret: appSecret || '',
      accessToken,
      webhookVerifyToken: webhookVerifyToken || `verify_${Date.now()}`,
    })
    
    let config
    
    if (existing) {
      // Update existing config
      config = await db.integrationConfig.update({
        where: { id: existing.id },
        data: {
          credentials,
          isActive: true,
          healthStatus: 'unknown',
          updatedAt: new Date(),
        },
      })
    } else {
      // Create new config
      config = await db.integrationConfig.create({
        data: {
          merchantId: merchantId || null,
          provider: 'whatsapp',
          service: 'messaging',
          credentials,
          isActive: true,
          isDefault: !merchantId,
          healthStatus: 'unknown',
        },
      })
    }
    
    return NextResponse.json({
      success: true,
      id: config.id,
      message: 'WhatsApp configuration saved successfully',
    })
  } catch (error) {
    console.error('[WHATSAPP CONFIG] Error:', error)
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    )
  }
}

// Delete WhatsApp configuration
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    
    await db.integrationConfig.deleteMany({
      where: {
        provider: 'whatsapp',
        service: 'messaging',
        ...(merchantId ? { merchantId } : { merchantId: null }),
      },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[WHATSAPP CONFIG] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete configuration' },
      { status: 500 }
    )
  }
}

// Test WhatsApp connection
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { merchantId, testPhone } = body
    
    if (!testPhone) {
      return NextResponse.json(
        { error: 'Test phone number required' },
        { status: 400 }
      )
    }
    
    // Call WhatsApp service to test
    const response = await fetch('http://localhost:3005/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantId, to: testPhone }),
    })
    
    const result = await response.json()
    
    // Update health status
    const config = await db.integrationConfig.findFirst({
      where: {
        provider: 'whatsapp',
        service: 'messaging',
        ...(merchantId ? { merchantId } : { merchantId: null }),
      },
    })
    
    if (config) {
      await db.integrationConfig.update({
        where: { id: config.id },
        data: {
          healthStatus: result.success ? 'healthy' : 'unhealthy',
          lastUsedAt: new Date(),
          lastError: result.success ? null : result.error,
        },
      })
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('[WHATSAPP CONFIG] Error:', error)
    return NextResponse.json(
      { error: 'Failed to test connection' },
      { status: 500 }
    )
  }
}
