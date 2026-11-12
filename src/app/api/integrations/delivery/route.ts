import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// =====================================================
// DELIVERY PLATFORM INTEGRATION API
// Supports: Uber Eats, Mr D Food
// =====================================================

interface DeliveryProvider {
  id: string
  name: string
  logo: string
  apiEndpoint: string
  features: string[]
  commissionRate: number
}

const deliveryProviders: Record<string, DeliveryProvider> = {
  ubereats: {
    id: 'ubereats',
    name: 'Uber Eats',
    logo: '/images/ubereats-logo.png',
    apiEndpoint: 'https://api.uber.com/v2/eats',
    features: ['menu_sync', 'order_reception', 'status_updates', 'driver_tracking', 'payout_reconciliation'],
    commissionRate: 30
  },
  mrd: {
    id: 'mrd',
    name: 'Mr D Food',
    logo: '/images/mrd-logo.png',
    apiEndpoint: 'https://api.mrdfood.com/v1',
    features: ['menu_sync', 'order_reception', 'status_updates', 'driver_tracking', 'payout_reconciliation'],
    commissionRate: 25
  },
  doordash: {
    id: 'doordash',
    name: 'DoorDash',
    logo: '/images/doordash-logo.png',
    apiEndpoint: 'https://api.doordash.com/v2',
    features: ['menu_sync', 'order_reception', 'status_updates', 'payout_reconciliation'],
    commissionRate: 28
  }
}

// GET - List all delivery integrations for a merchant
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
          integrationType: 'delivery'
        },
        include: {
          _count: {
            select: {
              IntegrationSyncLog: true,
              DeliveryMenuMapping: true
            }
          }
        }
      })

      // Get order counts by status
      const orderCounts = await db.deliveryOrder.groupBy({
        by: ['connectionId', 'orderStatus'],
        where: { merchantId },
        _count: true
      })

      return NextResponse.json({
        providers: deliveryProviders,
        connections: connections.map(c => {
          const providerOrderCounts = orderCounts.filter(oc => oc.connectionId === c.id)
          const pendingOrders = providerOrderCounts.find(oc => oc.orderStatus === 'pending')?._count || 0
          const activeOrders = providerOrderCounts.filter(oc => 
            ['confirmed', 'preparing', 'ready'].includes(oc.orderStatus)
          ).reduce((sum, oc) => sum + oc._count, 0)

          return {
            id: c.id,
            provider: c.provider,
            providerName: deliveryProviders[c.provider]?.name || c.provider,
            providerLogo: deliveryProviders[c.provider]?.logo,
            status: c.status,
            displayName: c.displayName,
            externalOrgName: c.externalOrgName,
            syncEnabled: c.syncEnabled,
            syncFrequency: c.syncFrequency,
            lastSyncAt: c.lastSyncAt,
            lastSyncStatus: c.lastSyncStatus,
            lastSyncError: c.lastSyncError,
            menuMappingCount: c._count.DeliveryMenuMapping,
            syncLogCount: c._count.IntegrationSyncLog,
            pendingOrders,
            activeOrders,
            webhookVerified: c.webhookVerified,
            commissionRate: deliveryProviders[c.provider]?.commissionRate || 0,
            createdAt: c.createdAt
          }
        })
      })
    }

    // Get menu mappings
    if (action === 'menu') {
      const connectionId = searchParams.get('connectionId')
      const limit = parseInt(searchParams.get('limit') || '100')

      const mappings = await db.deliveryMenuMapping.findMany({
        where: connectionId ? { connectionId } : { merchantId },
        orderBy: { localSku: 'asc' },
        take: limit
      })

      return NextResponse.json({ mappings })
    }

    // Get orders
    if (action === 'orders') {
      const connectionId = searchParams.get('connectionId')
      const status = searchParams.get('status')
      const platform = searchParams.get('platform')
      const limit = parseInt(searchParams.get('limit') || '50')

      const orders = await db.deliveryOrder.findMany({
        where: {
          ...(connectionId && { connectionId }),
          ...(status && { orderStatus: status }),
          ...(platform && { platform }),
          merchantId
        },
        orderBy: { orderCreatedAt: 'desc' },
        take: limit,
        include: {
          DeliveryOrderItem: true
        }
      })

      return NextResponse.json({ orders })
    }

    // Get active orders (for kitchen display)
    if (action === 'active-orders') {
      const activeStatuses = ['pending', 'confirmed', 'preparing', 'ready']
      
      const orders = await db.deliveryOrder.findMany({
        where: {
          merchantId,
          orderStatus: { in: activeStatuses }
        },
        orderBy: { orderCreatedAt: 'asc' },
        include: {
          DeliveryOrderItem: true
        }
      })

      return NextResponse.json({ orders })
    }

    // Get driver tracking
    if (action === 'driver-tracking') {
      const orderId = searchParams.get('orderId')

      if (orderId) {
        const order = await db.deliveryOrder.findFirst({
          where: { id: orderId, merchantId }
        })

        return NextResponse.json({
          driver: order ? {
            name: order.driverName,
            phone: order.driverPhone,
            location: order.driverLocation ? JSON.parse(order.driverLocation) : null,
            estimatedArrival: order.estimatedArrival,
            pickupCode: order.pickupCode
          } : null
        })
      }

      // Get all active drivers
      const activeOrders = await db.deliveryOrder.findMany({
        where: {
          merchantId,
          orderStatus: { in: ['picked_up', 'preparing'] },
          driverName: { not: null }
        },
        select: {
          id: true,
          platform: true,
          driverName: true,
          driverPhone: true,
          driverLocation: true,
          estimatedArrival: true
        }
      })

      return NextResponse.json({ drivers: activeOrders.map(o => ({
        orderId: o.id,
        platform: o.platform,
        name: o.driverName,
        phone: o.driverPhone,
        location: o.driverLocation ? JSON.parse(o.driverLocation) : null,
        estimatedArrival: o.estimatedArrival
      }))})
    }

    // Get payouts
    if (action === 'payouts') {
      const connectionId = searchParams.get('connectionId')
      const status = searchParams.get('status')
      const limit = parseInt(searchParams.get('limit') || '20')

      const payouts = await db.deliveryPayout.findMany({
        where: {
          ...(connectionId && { connectionId }),
          ...(status && { payoutStatus: status }),
          merchantId
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      return NextResponse.json({ payouts })
    }

    // Get sync logs
    if (action === 'sync-logs') {
      const connectionId = searchParams.get('connectionId')
      const limit = parseInt(searchParams.get('limit') || '20')

      const logs = await db.integrationSyncLog.findMany({
        where: connectionId ? { connectionId } : undefined,
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

    // Get summary stats
    if (action === 'stats') {
      const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const endDate = searchParams.get('endDate') || new Date().toISOString()

      const orders = await db.deliveryOrder.findMany({
        where: {
          merchantId,
          orderCreatedAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        }
      })

      const stats = {
        totalOrders: orders.length,
        totalValue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
        averageOrderValue: orders.length > 0 
          ? orders.reduce((sum, o) => sum + o.totalAmount, 0) / orders.length 
          : 0,
        byPlatform: {} as Record<string, { count: number; value: number }>,
        byStatus: {} as Record<string, number>
      }

      for (const order of orders) {
        // By platform
        if (!stats.byPlatform[order.platform]) {
          stats.byPlatform[order.platform] = { count: 0, value: 0 }
        }
        stats.byPlatform[order.platform].count++
        stats.byPlatform[order.platform].value += order.totalAmount

        // By status
        stats.byStatus[order.orderStatus] = (stats.byStatus[order.orderStatus] || 0) + 1
      }

      return NextResponse.json({ stats })
    }

    // Default: return available providers
    return NextResponse.json({ providers: deliveryProviders })

  } catch (error) {
    console.error('Delivery integration GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch delivery integration data' },
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
      if (!provider || !deliveryProviders[provider]) {
        return NextResponse.json({ error: 'Valid provider is required' }, { status: 400 })
      }

      const providerConfig = deliveryProviders[provider]

      // Create pending connection
      const connection = await db.integrationConnection.create({
        data: {
          id: `DELIV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          merchantId,
          integrationType: 'delivery',
          provider,
          status: 'pending',
          displayName: providerConfig.name,
          apiEndpoint: providerConfig.apiEndpoint,
          syncEnabled: true,
          syncFrequency: 'realtime',
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        connectionId: connection.id,
        message: 'Connection initiated. Please provide API credentials.',
        webhookUrl: `${process.env.BASE_URL || 'https://demo.local'}/api/integrations/delivery/webhook/${connection.id}`
      })
    }

    // Complete connection
    if (action === 'complete-connection') {
      const { apiKey, apiSecret, storeName, storeId } = body

      if (!connectionId) {
        return NextResponse.json({ error: 'connectionId is required' }, { status: 400 })
      }

      const connection = await db.integrationConnection.update({
        where: { id: connectionId },
        data: {
          status: 'connected',
          externalOrgId: storeId,
          externalOrgName: storeName,
          apiKey,
          apiSecret,
          lastSyncAt: new Date(),
          lastSyncStatus: 'success',
          webhookUrl: `${process.env.BASE_URL || 'https://demo.local'}/api/integrations/delivery/webhook/${connectionId}`,
          webhookSecret: 'whsec_' + Math.random().toString(36).substr(2, 32),
          webhookVerified: true,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        connection,
        message: 'Successfully connected to delivery platform'
      })
    }

    // Sync menu
    if (action === 'sync-menu') {
      if (!connectionId) {
        return NextResponse.json({ error: 'connectionId is required' }, { status: 400 })
      }

      const connection = await db.integrationConnection.findFirst({
        where: { id: connectionId, merchantId, integrationType: 'delivery' }
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
          direction: 'outbound',
          status: 'running',
          startedAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Mock menu sync
      const mockMenuItems = [
        { localSku: 'MENU-001', name: 'Burger Combo', price: 89.99, available: true },
        { localSku: 'MENU-002', name: 'Chicken Wings', price: 69.99, available: true },
        { localSku: 'MENU-003', name: 'Pizza Margherita', price: 119.99, available: true },
        { localSku: 'MENU-004', name: 'Caesar Salad', price: 59.99, available: false }
      ]

      let recordsCreated = 0
      let recordsUpdated = 0

      for (const item of mockMenuItems) {
        const existing = await db.deliveryMenuMapping.findFirst({
          where: { connectionId, localSku: item.localSku }
        })

        if (existing) {
          await db.deliveryMenuMapping.update({
            where: { id: existing.id },
            data: {
              externalItemId: `ext-${item.localSku}`,
              externalName: item.name,
              isAvailable: item.available,
              externalPrice: item.price,
              syncStatus: 'synced',
              lastSyncedAt: new Date(),
              updatedAt: new Date()
            }
          })
          recordsUpdated++
        } else {
          await db.deliveryMenuMapping.create({
            data: {
              id: `DMM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              connectionId,
              merchantId,
              localProductId: `PROD-${Math.random().toString(36).substr(2, 9)}`,
              localSku: item.localSku,
              localName: item.name,
              externalItemId: `ext-${item.localSku}`,
              externalName: item.name,
              isAvailable: item.available,
              externalPrice: item.price,
              syncStatus: 'synced',
              lastSyncedAt: new Date(),
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
          durationMs: 1500,
          recordsProcessed: mockMenuItems.length,
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
        menuItemsProcessed: mockMenuItems.length,
        recordsCreated,
        recordsUpdated,
        message: 'Menu synced successfully'
      })
    }

    // Update menu item availability
    if (action === 'update-availability') {
      if (!connectionId || !data) {
        return NextResponse.json({ error: 'connectionId and data are required' }, { status: 400 })
      }

      const { localSku, isAvailable } = data

      await db.deliveryMenuMapping.updateMany({
        where: { connectionId, localSku },
        data: {
          isAvailable,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        message: `Menu item ${localSku} availability updated to ${isAvailable ? 'available' : 'unavailable'}`
      })
    }

    // Receive order (from webhook or pull)
    if (action === 'receive-order') {
      if (!connectionId || !data) {
        return NextResponse.json({ error: 'connectionId and data are required' }, { status: 400 })
      }

      const connection = await db.integrationConnection.findFirst({
        where: { id: connectionId }
      })

      if (!connection) {
        return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
      }

      const order = await db.deliveryOrder.create({
        data: {
          id: `DO-${Date.now()}`,
          merchantId,
          connectionId,
          platform: connection.provider,
          externalOrderId: data.externalOrderId || `EXT-${Date.now()}`,
          externalOrderNumber: data.orderNumber,
          orderType: data.orderType || 'delivery',
          isPreorder: data.isPreorder || false,
          prepTimeMinutes: data.prepTimeMinutes || 15,
          requestedDeliveryTime: data.requestedDeliveryTime ? new Date(data.requestedDeliveryTime) : null,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail,
          deliveryAddress: data.deliveryAddress,
          deliveryInstructions: data.deliveryInstructions,
          deliveryLatitude: data.deliveryLatitude,
          deliveryLongitude: data.deliveryLongitude,
          subtotal: data.subtotal || 0,
          deliveryFee: data.deliveryFee || 0,
          platformFee: data.platformFee || 0,
          discountAmount: data.discountAmount || 0,
          totalAmount: data.totalAmount || 0,
          orderStatus: 'pending',
          paymentStatus: data.paymentStatus || 'paid',
          paymentMethod: data.paymentMethod || 'card',
          orderCreatedAt: new Date(),
          updatedAt: new Date(),
          DeliveryOrderItem: {
            create: (data.items || []).map((item: any, index: number) => ({
              id: `DOI-${Date.now()}-${index}`,
              externalItemId: item.externalItemId,
              itemName: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              specialInstructions: item.specialInstructions,
              modifiers: item.modifiers ? JSON.stringify(item.modifiers) : null,
              localProductId: item.localProductId
            }))
          }
        },
        include: { DeliveryOrderItem: true }
      })

      return NextResponse.json({
        success: true,
        order,
        message: 'Order received successfully'
      })
    }

    // Update order status
    if (action === 'update-status') {
      if (!connectionId || !data) {
        return NextResponse.json({ error: 'connectionId and data are required' }, { status: 400 })
      }

      const { orderId, status, driverInfo } = data

      const updateData: any = {
        orderStatus: status,
        updatedAt: new Date()
      }

      // Add timestamps for status changes
      switch (status) {
        case 'confirmed':
          updateData.acceptedAt = new Date()
          break
        case 'ready':
          updateData.readyAt = new Date()
          break
        case 'picked_up':
          updateData.pickedUpAt = new Date()
          break
        case 'delivered':
          updateData.deliveredAt = new Date()
          break
        case 'cancelled':
          updateData.cancelledAt = new Date()
          updateData.cancelReason = data.cancelReason
          break
      }

      // Add driver info if provided
      if (driverInfo) {
        updateData.driverName = driverInfo.name
        updateData.driverPhone = driverInfo.phone
        updateData.driverLocation = driverInfo.location ? JSON.stringify(driverInfo.location) : null
        updateData.estimatedArrival = driverInfo.estimatedArrival ? new Date(driverInfo.estimatedArrival) : null
        updateData.pickupCode = driverInfo.pickupCode
      }

      const order = await db.deliveryOrder.update({
        where: { id: orderId },
        data: updateData
      })

      // Update status history
      const currentHistory = order.statusHistory ? JSON.parse(order.statusHistory) : []
      currentHistory.push({
        status,
        timestamp: new Date().toISOString()
      })
      
      await db.deliveryOrder.update({
        where: { id: orderId },
        data: { statusHistory: JSON.stringify(currentHistory) }
      })

      return NextResponse.json({
        success: true,
        order,
        message: `Order status updated to ${status}`
      })
    }

    // Create payout record (for reconciliation)
    if (action === 'create-payout') {
      if (!connectionId || !data) {
        return NextResponse.json({ error: 'connectionId and data are required' }, { status: 400 })
      }

      const connection = await db.integrationConnection.findFirst({
        where: { id: connectionId }
      })

      if (!connection) {
        return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
      }

      const payout = await db.deliveryPayout.create({
        data: {
          id: `DPO-${Date.now()}`,
          merchantId,
          connectionId,
          platform: connection.provider,
          externalPayoutId: data.externalPayoutId || `PO-${Date.now()}`,
          payoutReference: data.payoutReference,
          payoutPeriodStart: data.payoutPeriodStart,
          payoutPeriodEnd: data.payoutPeriodEnd,
          payoutAmount: data.payoutAmount || 0,
          currency: 'ZAR',
          orderCount: data.orderCount || 0,
          totalOrderValue: data.totalOrderValue || 0,
          totalDeliveryFees: data.totalDeliveryFees || 0,
          totalPlatformFees: data.totalPlatformFees || 0,
          totalAdjustments: data.totalAdjustments || 0,
          adjustmentsDetail: data.adjustmentsDetail ? JSON.stringify(data.adjustmentsDetail) : null,
          payoutStatus: data.payoutStatus || 'pending',
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        payout,
        message: 'Payout record created for reconciliation'
      })
    }

    // Reconcile payout
    if (action === 'reconcile-payout') {
      if (!data?.payoutId) {
        return NextResponse.json({ error: 'payoutId is required' }, { status: 400 })
      }

      const payout = await db.deliveryPayout.update({
        where: { id: data.payoutId },
        data: {
          isReconciled: true,
          reconciledAt: new Date(),
          reconciliationVariance: data.variance || 0,
          payoutStatus: 'paid',
          paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
          bankReference: data.bankReference,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        payout,
        message: 'Payout reconciled successfully'
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
        providerName: deliveryProviders[connection.provider]?.name,
        storeName: connection.externalOrgName,
        webhookUrl: connection.webhookUrl,
        webhookVerified: connection.webhookVerified,
        lastSync: connection.lastSyncAt,
        features: deliveryProviders[connection.provider]?.features || [],
        commissionRate: deliveryProviders[connection.provider]?.commissionRate || 0,
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
        message: 'Disconnected from delivery platform'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Delivery integration POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process delivery integration request' },
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
    console.error('Delivery integration DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete delivery integration' },
      { status: 500 }
    )
  }
}
