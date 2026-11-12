import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Valid integration types
const VALID_INTEGRATION_TYPES = [
  'sars_efiling',
  'fnb',
  'capitec',
  'standard_bank',
  'absa',
  'nedbank',
  'investec',
  'whatsapp',
  'courier',
  'paystack',
  'yoco',
  'ozow',
  'peach_payments',
  'xero',
  'sage',
  'quickbooks'
]

// Valid integration statuses
const VALID_STATUSES = ['pending', 'connected', 'error', 'disconnected']

// Valid sync frequencies
const VALID_SYNC_FREQUENCIES = ['realtime', 'hourly', 'daily', 'weekly']

// GET /api/sars/integrations - List integration configs with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const integrationType = searchParams.get('integrationType')
    const status = searchParams.get('status')

    // Build where clause
    const where: Record<string, unknown> = {}

    if (merchantId) {
      where.merchantId = merchantId
    }

    if (integrationType) {
      where.integrationType = integrationType
    }

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
          { status: 400 }
        )
      }
      where.status = status
    }

    const integrations = await db.integrationConfig.findMany({
      where,
      orderBy: [
        { status: 'asc' }, // connected first
        { createdAt: 'desc' }
      ]
    })

    // Parse JSON fields for each integration
    const parsedIntegrations = integrations.map(integration => ({
      ...integration,
      config: integration.config ? JSON.parse(integration.config) : null,
      credentials: integration.credentials ? '[ENCRYPTED]' : null // Don't expose credentials
    }))

    return NextResponse.json(parsedIntegrations)
  } catch (error) {
    console.error('Error fetching integration configs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch integration configurations' },
      { status: 500 }
    )
  }
}

// POST /api/sars/integrations - Create a new integration config
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      merchantId,
      integrationType,
      integrationName,
      provider,
      status,
      config,
      credentials,
      syncFrequency,
      autoSync
    } = body

    // Validate required fields
    if (!merchantId || !integrationType || !integrationName) {
      return NextResponse.json(
        { error: 'Missing required fields: merchantId, integrationType, integrationName' },
        { status: 400 }
      )
    }

    // Validate integrationType
    if (!VALID_INTEGRATION_TYPES.includes(integrationType)) {
      return NextResponse.json(
        { 
          error: `Invalid integrationType. Must be one of: ${VALID_INTEGRATION_TYPES.join(', ')}`,
          validTypes: VALID_INTEGRATION_TYPES 
        },
        { status: 400 }
      )
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate syncFrequency if provided
    if (syncFrequency && !VALID_SYNC_FREQUENCIES.includes(syncFrequency)) {
      return NextResponse.json(
        { error: `Invalid syncFrequency. Must be one of: ${VALID_SYNC_FREQUENCIES.join(', ')}` },
        { status: 400 }
      )
    }

    // Check for existing integration of this type for the merchant
    const existing = await db.integrationConfig.findUnique({
      where: {
        merchantId_integrationType: {
          merchantId,
          integrationType
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        { 
          error: `Integration of type '${integrationType}' already exists for this merchant. Use PUT to update.`,
          existingId: existing.id
        },
        { status: 409 }
      )
    }

    // Validate config is valid JSON if provided
    let configJson: string | null = null
    if (config) {
      try {
        if (typeof config === 'string') {
          JSON.parse(config) // Validate it's valid JSON
          configJson = config
        } else {
          configJson = JSON.stringify(config)
        }
      } catch {
        return NextResponse.json(
          { error: 'Invalid config: must be valid JSON' },
          { status: 400 }
        )
      }
    }

    // Validate credentials is valid JSON if provided (will be encrypted in production)
    let credentialsJson: string | null = null
    if (credentials) {
      try {
        if (typeof credentials === 'string') {
          JSON.parse(credentials) // Validate it's valid JSON
          credentialsJson = credentials
        } else {
          credentialsJson = JSON.stringify(credentials)
        }
      } catch {
        return NextResponse.json(
          { error: 'Invalid credentials: must be valid JSON' },
          { status: 400 }
        )
      }
    }

    const integration = await db.integrationConfig.create({
      data: {
        merchantId,
        integrationType,
        integrationName,
        provider,
        status: status || 'pending',
        config: configJson,
        credentials: credentialsJson,
        syncFrequency: syncFrequency || 'daily',
        autoSync: autoSync ?? true
      }
    })

    // Return without exposing credentials
    const response = {
      ...integration,
      credentials: integration.credentials ? '[ENCRYPTED]' : null
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating integration config:', error)
    return NextResponse.json(
      { error: 'Failed to create integration configuration' },
      { status: 500 }
    )
  }
}

// PUT /api/sars/integrations - Update an integration config (by ID in body)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, config, credentials, syncFrequency, autoSync, lastError } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      )
    }

    // Check if integration exists
    const existing = await db.integrationConfig.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Integration configuration not found' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
          { status: 400 }
        )
      }
      updateData.status = status
    }

    if (syncFrequency !== undefined) {
      if (!VALID_SYNC_FREQUENCIES.includes(syncFrequency)) {
        return NextResponse.json(
          { error: `Invalid syncFrequency. Must be one of: ${VALID_SYNC_FREQUENCIES.join(', ')}` },
          { status: 400 }
        )
      }
      updateData.syncFrequency = syncFrequency
    }

    if (autoSync !== undefined) {
      updateData.autoSync = autoSync
    }

    if (config !== undefined) {
      try {
        if (typeof config === 'string') {
          JSON.parse(config)
          updateData.config = config
        } else {
          updateData.config = JSON.stringify(config)
        }
      } catch {
        return NextResponse.json(
          { error: 'Invalid config: must be valid JSON' },
          { status: 400 }
        )
      }
    }

    if (credentials !== undefined) {
      try {
        if (typeof credentials === 'string') {
          JSON.parse(credentials)
          updateData.credentials = credentials
        } else {
          updateData.credentials = JSON.stringify(credentials)
        }
      } catch {
        return NextResponse.json(
          { error: 'Invalid credentials: must be valid JSON' },
          { status: 400 }
        )
      }
    }

    if (lastError !== undefined) {
      updateData.lastError = lastError
      updateData.lastErrorAt = new Date()
      updateData.errorCount = existing.errorCount + 1
    }

    // Reset error count if status is 'connected'
    if (status === 'connected') {
      updateData.errorCount = 0
      updateData.lastError = null
      updateData.lastErrorAt = null
    }

    const integration = await db.integrationConfig.update({
      where: { id },
      data: updateData
    })

    // Return without exposing credentials
    const response = {
      ...integration,
      credentials: integration.credentials ? '[ENCRYPTED]' : null
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating integration config:', error)
    return NextResponse.json(
      { error: 'Failed to update integration configuration' },
      { status: 500 }
    )
  }
}

// DELETE /api/sars/integrations - Delete an integration config (by ID in body)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required query parameter: id' },
        { status: 400 }
      )
    }

    // Check if integration exists
    const existing = await db.integrationConfig.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Integration configuration not found' },
        { status: 404 }
      )
    }

    await db.integrationConfig.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Integration configuration deleted successfully' })
  } catch (error) {
    console.error('Error deleting integration config:', error)
    return NextResponse.json(
      { error: 'Failed to delete integration configuration' },
      { status: 500 }
    )
  }
}
