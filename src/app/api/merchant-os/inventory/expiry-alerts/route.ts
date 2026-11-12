import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

/**
 * GET /api/merchant-os/inventory/expiry-alerts
 * Get expiry alerts with filtering and pagination
 * 
 * Query Parameters:
 * - merchantId: Filter by merchant (via product)
 * - productId: Filter by product
 * - branchId: Filter by branch
 * - alertType: Filter by alert type (near_expiry, expired, critical)
 * - status: Filter by status (active, acknowledged, resolved, dismissed)
 * - daysAhead: Include batches expiring within N days (default: 30)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const merchantId = searchParams.get('merchantId')
    const productId = searchParams.get('productId')
    const branchId = searchParams.get('branchId')
    const alertType = searchParams.get('alertType')
    const status = searchParams.get('status')
    const daysAhead = parseInt(searchParams.get('daysAhead') || '30')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build where clause
    const where: Prisma.ExpiryAlertWhereInput = {}
    
    if (productId) where.productId = productId
    if (branchId) where.branchId = branchId
    if (alertType) where.alertType = alertType
    if (status) where.status = status

    // Get expiry alerts
    const alerts = await db.expiryAlert.findMany({
      where: {
        ...where,
        product: merchantId ? { merchantId } : undefined
      },
      include: {
        product: {
          select: { 
            id: true, 
            name: true, 
            sku: true,
            costPrice: true,
            sellingPrice: true,
            merchantId: true 
          }
        },
        batch: {
          select: {
            id: true,
            batchNumber: true,
            quantityRemaining: true,
            locationAisle: true,
            locationShelf: true,
            locationBin: true
          }
        }
      },
      orderBy: [
        { daysUntilExpiry: 'asc' }, // Most urgent first
        { createdAt: 'desc' }
      ],
      take: limit,
      skip
    })

    const total = await db.expiryAlert.count({
      where: {
        ...where,
        product: merchantId ? { merchantId } : undefined
      }
    })

    const totalPages = Math.ceil(total / limit)

    // Get summary statistics
    const summaryStats = await db.expiryAlert.groupBy({
      by: ['alertType', 'status'],
      where: {
        ...where,
        product: merchantId ? { merchantId } : undefined
      },
      _count: {
        id: true
      },
      _sum: {
        quantityAtRisk: true,
        valueAtRisk: true
      }
    })

    // If no alerts exist, check batches and generate alerts
    if (alerts.length === 0 && !status) {
      // Find batches that might need alerts
      const today = new Date()
      const futureDate = new Date(today)
      futureDate.setDate(futureDate.getDate() + daysAhead)
      
      const expiringBatches = await db.productBatch.findMany({
        where: {
          status: 'active',
          expiryDate: {
            lte: futureDate.toISOString().split('T')[0]
          },
          quantityRemaining: { gt: 0 },
          product: merchantId ? { merchantId } : undefined
        },
        include: {
          product: {
            select: { 
              id: true, 
              name: true, 
              sku: true,
              costPrice: true,
              merchantId: true 
            }
          }
        }
      })

      // Generate mock alerts for batches that don't have alerts yet
      for (const batch of expiringBatches) {
        if (!batch.expiryDate) continue
        
        const expiry = new Date(batch.expiryDate)
        const daysUntil = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        let newAlertType: 'near_expiry' | 'expired' | 'critical'
        if (daysUntil < 0) {
          newAlertType = 'expired'
        } else if (daysUntil <= 7) {
          newAlertType = 'critical'
        } else {
          newAlertType = 'near_expiry'
        }

        // Try to create alert if it doesn't exist
        try {
          const existingAlert = await db.expiryAlert.findFirst({
            where: {
              productId: batch.productId,
              batchId: batch.id,
              status: 'active'
            }
          })

          if (!existingAlert) {
            await db.expiryAlert.create({
              data: {
                productId: batch.productId,
                batchId: batch.id,
                branchId: batch.branchId,
                alertType: newAlertType,
                expiryDate: batch.expiryDate,
                daysUntilExpiry: daysUntil,
                quantityAtRisk: batch.quantityRemaining,
                valueAtRisk: batch.quantityRemaining * (batch.unitCost || batch.product?.costPrice || 0),
                status: 'active'
              }
            })
          }
        } catch {
          // Ignore duplicate errors
        }
      }
    }

    return NextResponse.json({
      data: alerts.map(a => ({
        id: a.id,
        alertType: a.alertType,
        productId: a.productId,
        productName: a.product?.name,
        sku: a.product?.sku,
        batchId: a.batchId,
        batchNumber: a.batch?.batchNumber,
        branchId: a.branchId,
        expiryDate: a.expiryDate,
        daysUntilExpiry: a.daysUntilExpiry,
        quantityAtRisk: a.quantityAtRisk,
        valueAtRisk: a.valueAtRisk,
        status: a.status,
        acknowledgedBy: a.acknowledgedBy,
        acknowledgedAt: a.acknowledgedAt,
        resolvedBy: a.resolvedBy,
        resolvedAt: a.resolvedAt,
        resolutionNotes: a.resolutionNotes,
        location: a.batch ? {
          aisle: a.batch.locationAisle,
          shelf: a.batch.locationShelf,
          bin: a.batch.locationBin
        } : null,
        notificationSent: a.notificationSent,
        reminderCount: a.reminderCount,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt
      })),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      summary: summaryStats.map(s => ({
        alertType: s.alertType,
        status: s.status,
        count: s._count.id,
        totalQuantityAtRisk: s._sum.quantityAtRisk || 0,
        totalValueAtRisk: s._sum.valueAtRisk || 0
      }))
    })
  } catch (error) {
    console.error('Error fetching expiry alerts:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch expiry alerts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * PATCH /api/merchant-os/inventory/expiry-alerts
 * Update expiry alert status
 * 
 * Request Body:
 * - alertId: (required) Alert ID
 * - action: (required) Action to perform (acknowledge, resolve, dismiss)
 * - notes: Resolution notes
 * - userId: User ID performing the action
 * - userName: User name
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.alertId) {
      return NextResponse.json({ error: 'alertId is required' }, { status: 400 })
    }
    if (!body.action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 })
    }

    const validActions = ['acknowledge', 'resolve', 'dismiss']
    if (!validActions.includes(body.action)) {
      return NextResponse.json({ 
        error: `action must be one of: ${validActions.join(', ')}` 
      }, { status: 400 })
    }

    const alert = await db.expiryAlert.findUnique({
      where: { id: body.alertId }
    })

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    const now = new Date()
    let updateData: Prisma.ExpiryAlertUpdateInput = {}

    switch (body.action) {
      case 'acknowledge':
        updateData = {
          status: 'acknowledged',
          acknowledgedBy: body.userName,
          acknowledgedAt: now
        }
        break
      case 'resolve':
        updateData = {
          status: 'resolved',
          resolvedBy: body.userName,
          resolvedAt: now,
          resolutionNotes: body.notes
        }
        break
      case 'dismiss':
        updateData = {
          status: 'dismissed',
          resolvedBy: body.userName,
          resolvedAt: now,
          resolutionNotes: body.notes || 'Dismissed'
        }
        break
    }

    const updatedAlert = await db.expiryAlert.update({
      where: { id: body.alertId },
      data: updateData,
      include: {
        product: {
          select: { id: true, name: true, sku: true }
        },
        batch: {
          select: { id: true, batchNumber: true }
        }
      }
    })

    return NextResponse.json({
      data: updatedAlert,
      message: `Alert ${body.action}d successfully`
    })
  } catch (error) {
    console.error('Error updating expiry alert:', error)
    return NextResponse.json({ 
      error: 'Failed to update expiry alert',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
