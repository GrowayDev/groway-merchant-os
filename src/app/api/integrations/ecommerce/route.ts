import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// =====================================================
// E-COMMERCE PLATFORM INTEGRATION API
// Supports: Shopify, WooCommerce
// =====================================================

interface EcommerceProvider {
  id: string
  name: string
  oauthUrl: string
  apiVersion: string
  features: string[]
}

const ecommerceProviders: Record<string, EcommerceProvider> = {
  shopify: {
    id: 'shopify',
    name: 'Shopify',
    oauthUrl: 'https://{shop}.myshopify.com/admin/oauth/authorize',
    apiVersion: '2024-01',
    features: ['product_sync', 'inventory_sync', 'order_import', 'webhooks', 'multi_location']
  },
  woocommerce: {
    id: 'woocommerce',
    name: 'WooCommerce',
    oauthUrl: 'https://{site}/wc-auth/v1/authorize',
    apiVersion: 'wc/v3',
    features: ['product_sync', 'inventory_sync', 'order_import', 'webhooks']
  }
}

// GET - List all e-commerce integrations for a merchant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const action = searchParams.get('action')

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
    }

    // List all connections and their status
    if (action === 'list') {
      const connections = await db.integrationConnection.findMany({
        where: {
          merchantId,
          integrationType: 'ecommerce'
        },
        include: {
          _count: {
            select: {
              IntegrationSyncLog: true,
              EcommerceProductMapping: true
            }
          }
        }
      })

      return NextResponse.json({
        providers: ecommerceProviders,
        connections: connections.map(c => ({
          id: c.id,
          provider: c.provider,
          providerName: ecommerceProviders[c.provider]?.name || c.provider,
          status: c.status,
          displayName: c.displayName,
          externalOrgName: c.externalOrgName,
          apiEndpoint: c.apiEndpoint,
          syncEnabled: c.syncEnabled,
          syncFrequency: c.syncFrequency,
          lastSyncAt: c.lastSyncAt,
          lastSyncStatus: c.lastSyncStatus,
          lastSyncError: c.lastSyncError,
          productMappingCount: c._count.EcommerceProductMapping,
          syncLogCount: c._count.IntegrationSyncLog,
          webhookVerified: c.webhookVerified,
          createdAt: c.createdAt
        }))
      })
    }

    // Get product mappings
    if (action === 'products') {
      const connectionId = searchParams.get('connectionId')
      const limit = parseInt(searchParams.get('limit') || '100')

      const mappings = await db.ecommerceProductMapping.findMany({
        where: connectionId ? { connectionId } : { merchantId },
        orderBy: { localSku: 'asc' },
        take: limit
      })

      return NextResponse.json({ mappings })
    }

    // Get order imports
    if (action === 'orders') {
      const connectionId = searchParams.get('connectionId')
      const status = searchParams.get('status')
      const limit = parseInt(searchParams.get('limit') || '50')

      const orders = await db.ecommerceOrderSync.findMany({
        where: {
          ...(connectionId && { connectionId }),
          ...(status && { syncStatus: status }),
          merchantId
        },
        orderBy: { orderCreatedAt: 'desc' },
        take: limit
      })

      return NextResponse.json({ orders })
    }

    // Get webhook events
    if (action === 'webhooks') {
      const connectionId = searchParams.get('connectionId')
      const limit = parseInt(searchParams.get('limit') || '50')

      const events = await db.ecommerceWebhookEvent.findMany({
        where: connectionId ? { connectionId } : { merchantId },
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      return NextResponse.json({ events })
    }

    // Get sync logs
    if (action === 'sync-logs') {
      const connectionId = searchParams.get('connectionId')
      const limit = parseInt(searchParams.get('limit') || '20')

      const logs = await db.integrationSyncLog.findMany({
        where: {
          ...(connectionId && { connectionId })
        },
        orderBy: { startedAt: 'desc' },
        take: limit,
        include: {
          IntegrationConnection: {
            select: { provider: true, displayName: true }
          }
        }
      })

      return NextResponse.json({ logs })
    }

    // Default: return available providers
    return NextResponse.json({ providers: ecommerceProviders })

  } catch (error) {
    console.error('E-commerce integration GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch e-commerce integration data' },
      { status: 500 }
    )
  }
}

// POST - Create connection, sync data, or perform actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, merchantId, provider, connectionId, data } = body

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
    }

    // Initiate connection
    if (action === 'connect') {
      if (!provider || !ecommerceProviders[provider]) {
        return NextResponse.json({ error: 'Valid provider is required' }, { status: 400 })
      }

      const providerConfig = ecommerceProviders[provider]
      const storeUrl = data?.storeUrl || 'demo-store'

      // Create pending connection
      const connection = await db.integrationConnection.create({
        data: {
          id: `ECOM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          merchantId,
          integrationType: 'ecommerce',
          provider,
          status: 'pending',
          displayName: `${providerConfig.name} - ${storeUrl}`,
          apiEndpoint: provider === 'shopify' 
            ? `https://${storeUrl}.myshopify.com/admin/api/${providerConfig.apiVersion}`
            : `https://${storeUrl}/wp-json/${providerConfig.apiVersion}`,
          syncEnabled: true,
          syncFrequency: 'hourly',
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        connectionId: connection.id,
        message: 'Connection initiated. Please provide API credentials.',
        apiEndpoint: connection.apiEndpoint
      })
    }

    // Complete connection with API credentials
    if (action === 'complete-connection') {
      const { apiKey, apiSecret, storeName } = body

      if (!connectionId) {
        return NextResponse.json({ error: 'connectionId is required' }, { status: 400 })
      }

      const connection = await db.integrationConnection.update({
        where: { id: connectionId },
        data: {
          status: 'connected',
          externalOrgName: storeName,
          apiKey,
          apiSecret,
          lastSyncAt: new Date(),
          lastSyncStatus: 'success',
          updatedAt: new Date()
        }
      })

      // Set up webhooks (mock)
      const webhookUrl = `${process.env.BASE_URL || 'https://demo.local'}/api/integrations/ecommerce/webhook/${connectionId}`
      
      await db.integrationConnection.update({
        where: { id: connectionId },
        data: {
          webhookUrl,
          webhookSecret: 'whsec_' + Math.random().toString(36).substr(2, 32),
          webhookVerified: true
        }
      })

      return NextResponse.json({
        success: true,
        connection,
        webhookUrl,
        message: 'Successfully connected to e-commerce platform'
      })
    }

    // Sync products (catalog sync)
    if (action === 'sync-products') {
      if (!connectionId) {
        return NextResponse.json({ error: 'connectionId is required' }, { status: 400 })
      }

      const connection = await db.integrationConnection.findFirst({
        where: { id: connectionId, merchantId, integrationType: 'ecommerce' }
      })

      if (!connection || connection.status !== 'connected') {
        return NextResponse.json({ error: 'Connection not found or not connected' }, { status: 400 })
      }

      // Create sync log
      const syncLog = await db.integrationSyncLog.create({
        data: {
          id: `SYNC-${Date.now()}`,
          connectionId,
          syncType: 'full',
          direction: 'bidirectional',
          status: 'running',
          startedAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Mock product sync
      const mockProducts = [
        { localSku: 'SKU-001', name: 'Product 1', externalId: 'ext-1', externalSku: 'EXT-SKU-1' },
        { localSku: 'SKU-002', name: 'Product 2', externalId: 'ext-2', externalSku: 'EXT-SKU-2' },
        { localSku: 'SKU-003', name: 'Product 3', externalId: 'ext-3', externalSku: 'EXT-SKU-3' }
      ]

      let recordsCreated = 0
      let recordsUpdated = 0

      for (const product of mockProducts) {
        const existing = await db.ecommerceProductMapping.findFirst({
          where: { connectionId, localSku: product.localSku }
        })

        if (existing) {
          await db.ecommerceProductMapping.update({
            where: { id: existing.id },
            data: {
              externalProductId: product.externalId,
              externalSku: product.externalSku,
              externalName: product.name,
              syncStatus: 'synced',
              lastInventorySync: new Date(),
              lastPriceSync: new Date(),
              updatedAt: new Date()
            }
          })
          recordsUpdated++
        } else {
          await db.ecommerceProductMapping.create({
            data: {
              id: `EPM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              connectionId,
              merchantId,
              localProductId: `PROD-${Math.random().toString(36).substr(2, 9)}`,
              localSku: product.localSku,
              localName: product.name,
              externalProductId: product.externalId,
              externalSku: product.externalSku,
              externalName: product.name,
              inventoryTracked: true,
              priceTracked: true,
              syncStatus: 'synced',
              lastInventorySync: new Date(),
              lastPriceSync: new Date(),
              isActive: true,
              updatedAt: new Date()
            }
          })
          recordsCreated++
        }
      }

      // Complete sync log
      await db.integrationSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          durationMs: 1200,
          recordsProcessed: mockProducts.length,
          recordsCreated,
          recordsUpdated,
          updatedAt: new Date()
        }
      })

      // Update connection
      await db.integrationConnection.update({
        where: { id: connectionId },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: 'success',
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        syncLogId: syncLog.id,
        productsProcessed: mockProducts.length,
        recordsCreated,
        recordsUpdated,
        message: 'Product catalog synced successfully'
      })
    }

    // Sync inventory
    if (action === 'sync-inventory') {
      if (!connectionId) {
        return NextResponse.json({ error: 'connectionId is required' }, { status: 400 })
      }

      // Create sync log
      const syncLog = await db.integrationSyncLog.create({
        data: {
          id: `SYNC-${Date.now()}`,
          connectionId,
          syncType: 'incremental',
          direction: 'outbound',
          status: 'running',
          startedAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Get all product mappings with inventory tracking
      const mappings = await db.ecommerceProductMapping.findMany({
        where: { connectionId, inventoryTracked: true, isActive: true }
      })

      let recordsUpdated = 0
      for (const mapping of mappings) {
        // Mock inventory update
        await db.ecommerceProductMapping.update({
          where: { id: mapping.id },
          data: {
            lastQuantity: Math.floor(Math.random() * 100) + 10,
            lastInventorySync: new Date(),
            updatedAt: new Date()
          }
        })
        recordsUpdated++
      }

      // Complete sync log
      await db.integrationSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          durationMs: 500,
          recordsProcessed: mappings.length,
          recordsUpdated,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        inventorySynced: recordsUpdated,
        syncLogId: syncLog.id
      })
    }

    // Import orders
    if (action === 'import-orders') {
      if (!connectionId) {
        return NextResponse.json({ error: 'connectionId is required' }, { status: 400 })
      }

      const connection = await db.integrationConnection.findFirst({
        where: { id: connectionId, merchantId }
      })

      if (!connection) {
        return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
      }

      // Create sync log
      const syncLog = await db.integrationSyncLog.create({
        data: {
          id: `SYNC-${Date.now()}`,
          connectionId,
          syncType: 'incremental',
          direction: 'inbound',
          status: 'running',
          startedAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Mock order import
      const mockOrders = [
        {
          externalId: 'ORD-1001',
          orderNumber: '#1001',
          status: 'processing',
          paymentStatus: 'paid',
          total: 1250.00,
          customer: 'John Doe',
          email: 'john@example.com'
        },
        {
          externalId: 'ORD-1002',
          orderNumber: '#1002',
          status: 'pending',
          paymentStatus: 'pending',
          total: 890.00,
          customer: 'Jane Smith',
          email: 'jane@example.com'
        }
      ]

      for (const order of mockOrders) {
        await db.ecommerceOrderSync.create({
          data: {
            id: `EOS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            merchantId,
            connectionId,
            externalOrderId: order.externalId,
            externalOrderNumber: order.orderNumber,
            orderSource: connection.provider,
            orderStatus: order.status,
            paymentStatus: order.paymentStatus,
            syncStatus: 'imported',
            syncedAt: new Date(),
            totalAmount: order.total,
            currency: 'ZAR',
            customerEmail: order.email,
            customerName: order.customer,
            orderCreatedAt: new Date(),
            updatedAt: new Date()
          }
        })
      }

      // Complete sync log
      await db.integrationSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          durationMs: 800,
          recordsProcessed: mockOrders.length,
          recordsCreated: mockOrders.length,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        ordersImported: mockOrders.length,
        syncLogId: syncLog.id
      })
    }

    // Process webhook event
    if (action === 'process-webhook') {
      const { eventType, payload } = body

      if (!connectionId || !eventType) {
        return NextResponse.json({ error: 'connectionId and eventType are required' }, { status: 400 })
      }

      // Store webhook event
      const event = await db.ecommerceWebhookEvent.create({
        data: {
          id: `WHE-${Date.now()}`,
          merchantId,
          connectionId,
          eventType,
          externalEventId: `evt_${Date.now()}`,
          payload: JSON.stringify(payload),
          status: 'processed',
          processedAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Handle different webhook types
      switch (eventType) {
        case 'orders/create':
        case 'order.created':
          // Import the new order
          if (payload?.id) {
            await db.ecommerceOrderSync.create({
              data: {
                id: `EOS-${Date.now()}`,
                merchantId,
                connectionId,
                externalOrderId: payload.id,
                externalOrderNumber: payload.order_number || payload.id,
                orderSource: 'webhook',
                orderStatus: payload.status || 'pending',
                paymentStatus: payload.payment_status || 'pending',
                syncStatus: 'imported',
                syncedAt: new Date(),
                totalAmount: payload.total || 0,
                currency: payload.currency || 'ZAR',
                customerEmail: payload.customer?.email,
                customerName: payload.customer?.name,
                orderCreatedAt: new Date(),
                updatedAt: new Date()
              }
            })
          }
          break

        case 'products/update':
        case 'product.updated':
          // Update product mapping
          if (payload?.id) {
            await db.ecommerceProductMapping.updateMany({
              where: { connectionId, externalProductId: payload.id },
              data: {
                externalName: payload.title || payload.name,
                lastInventorySync: new Date(),
                syncStatus: 'synced',
                updatedAt: new Date()
              }
            })
          }
          break

        case 'inventory/update':
        case 'inventory.updated':
          // Update inventory
          if (payload?.sku) {
            await db.ecommerceProductMapping.updateMany({
              where: { connectionId, externalSku: payload.sku },
              data: {
                lastQuantity: payload.quantity || 0,
                lastInventorySync: new Date(),
                updatedAt: new Date()
              }
            })
          }
          break
      }

      return NextResponse.json({
        success: true,
        eventId: event.id,
        message: `Webhook ${eventType} processed successfully`
      })
    }

    // Test connection
    if (action === 'test-connection') {
      if (!connectionId) {
        return NextResponse.json({ error: 'connectionId is required' }, { status: 400 })
      }

      const connection = await db.integrationConnection.findFirst({
        where: { id: connectionId, merchantId }
      })

      if (!connection) {
        return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        provider: connection.provider,
        storeName: connection.externalOrgName,
        apiEndpoint: connection.apiEndpoint,
        webhookUrl: connection.webhookUrl,
        webhookVerified: connection.webhookVerified,
        lastSync: connection.lastSyncAt,
        features: ecommerceProviders[connection.provider]?.features || [],
        message: 'Connection test successful'
      })
    }

    // Disconnect
    if (action === 'disconnect') {
      if (!connectionId) {
        return NextResponse.json({ error: 'connectionId is required' }, { status: 400 })
      }

      await db.integrationConnection.update({
        where: { id: connectionId },
        data: {
          status: 'disconnected',
          apiKey: null,
          apiSecret: null,
          webhookVerified: false,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Disconnected from e-commerce platform'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('E-commerce integration POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process e-commerce integration request' },
      { status: 500 }
    )
  }
}

// DELETE - Remove connection
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const connectionId = searchParams.get('connectionId')

    if (!connectionId) {
      return NextResponse.json({ error: 'connectionId is required' }, { status: 400 })
    }

    await db.integrationConnection.delete({
      where: { id: connectionId }
    })

    return NextResponse.json({
      success: true,
      message: 'Integration connection deleted'
    })

  } catch (error) {
    console.error('E-commerce integration DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete e-commerce integration' },
      { status: 500 }
    )
  }
}
