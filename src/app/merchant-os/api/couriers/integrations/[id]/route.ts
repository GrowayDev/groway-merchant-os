import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const VALID_STATUSES = ['pending', 'active', 'error'];
const VALID_SERVICES = ['overnight', 'economy', 'same_day'];

// GET /api/couriers/integrations/[id] - Get a single courier integration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const integration = await db.courierIntegration.findUnique({
      where: { id },
      include: {
        shipments: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            waybillNumber: true,
            status: true,
            recipientName: true,
            recipientCity: true,
            shippingCost: true,
            createdAt: true,
            shippedAt: true,
            deliveredAt: true,
          }
        },
        _count: {
          select: { shipments: true }
        }
      }
    });

    if (!integration) {
      return NextResponse.json(
        { success: false, error: 'Courier integration not found' },
        { status: 404 }
      );
    }

    // Calculate shipment stats
    const shipmentStats = await db.shipment.aggregate({
      where: { courierId: id },
      _count: true,
      _sum: { shippingCost: true },
    });

    const statusCounts = await db.shipment.groupBy({
      by: ['status'],
      where: { courierId: id },
      _count: true,
    });

    const response = {
      ...integration,
      shipmentCount: integration._count.shipments,
      _count: undefined,
      stats: {
        totalShipments: shipmentStats._count,
        totalShippingCost: shipmentStats._sum.shippingCost || 0,
        statusBreakdown: statusCounts.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
      }
    };

    return NextResponse.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error fetching courier integration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch courier integration' },
      { status: 500 }
    );
  }
}

// PUT /api/couriers/integrations/[id] - Update a courier integration
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if integration exists
    const existingIntegration = await db.courierIntegration.findUnique({
      where: { id }
    });

    if (!existingIntegration) {
      return NextResponse.json(
        { success: false, error: 'Courier integration not found' },
        { status: 404 }
      );
    }

    // Validate status if provided
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Valid statuses: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate service if provided
    if (body.defaultService && !VALID_SERVICES.includes(body.defaultService)) {
      return NextResponse.json(
        { success: false, error: `Invalid default service. Valid services: ${VALID_SERVICES.join(', ')}` },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    
    if (body.courierName !== undefined) updateData.courierName = body.courierName;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.apiKey !== undefined) updateData.apiKey = body.apiKey;
    if (body.accountNumber !== undefined) updateData.accountNumber = body.accountNumber;
    if (body.autoCreateWaybill !== undefined) updateData.autoCreateWaybill = body.autoCreateWaybill;
    if (body.defaultService !== undefined) updateData.defaultService = body.defaultService;

    // Update the integration
    const integration = await db.courierIntegration.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      data: integration,
      message: 'Courier integration updated successfully'
    });
  } catch (error) {
    console.error('Error updating courier integration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update courier integration' },
      { status: 500 }
    );
  }
}

// DELETE /api/couriers/integrations/[id] - Delete a courier integration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if integration exists
    const existingIntegration = await db.courierIntegration.findUnique({
      where: { id },
      include: {
        _count: {
          select: { shipments: true }
        }
      }
    });

    if (!existingIntegration) {
      return NextResponse.json(
        { success: false, error: 'Courier integration not found' },
        { status: 404 }
      );
    }

    // Check if there are associated shipments
    if (existingIntegration._count.shipments > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete integration with ${existingIntegration._count.shipments} associated shipments. Consider deactivating instead.` 
        },
        { status: 400 }
      );
    }

    // Delete the integration
    await db.courierIntegration.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Courier integration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting courier integration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete courier integration' },
      { status: 500 }
    );
  }
}
