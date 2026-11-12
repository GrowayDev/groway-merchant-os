import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Valid shipment statuses
const VALID_SHIPMENT_STATUSES = [
  'pending',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'failed'
];

// Valid order types
const VALID_ORDER_TYPES = ['sale', 'transfer', 'purchase_order'];

// Generate a waybill number
function generateWaybillNumber(courierCode: string): string {
  const prefix = courierCode.toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// GET /api/couriers/shipments - List all shipments with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const status = searchParams.get('status');
    const courierId = searchParams.get('courierId');
    const orderType = searchParams.get('orderType');
    const waybillNumber = searchParams.get('waybillNumber');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: Record<string, unknown> = {};
    
    if (merchantId) where.merchantId = merchantId;
    if (status && VALID_SHIPMENT_STATUSES.includes(status)) where.status = status;
    if (courierId) where.courierId = courierId;
    if (orderType && VALID_ORDER_TYPES.includes(orderType)) where.orderType = orderType;
    if (waybillNumber) where.waybillNumber = { contains: waybillNumber };

    // Get total count for pagination
    const total = await db.shipment.count({ where });

    const shipments = await db.shipment.findMany({
      where,
      include: {
        courier: {
          select: {
            id: true,
            courierName: true,
            courierCode: true,
            status: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Get status breakdown for the merchant
    const statusBreakdown = await db.shipment.groupBy({
      by: ['status'],
      where: merchantId ? { merchantId } : {},
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: shipments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        statusBreakdown: statusBreakdown.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
      },
      meta: {
        validStatuses: VALID_SHIPMENT_STATUSES,
        validOrderTypes: VALID_ORDER_TYPES,
      }
    });
  } catch (error) {
    console.error('Error fetching shipments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shipments' },
      { status: 500 }
    );
  }
}

// POST /api/couriers/shipments - Create a new shipment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      merchantId,
      orderType,
      orderId,
      orderNumber,
      courierId,
      // Sender details
      senderAddress,
      senderCity,
      senderPostalCode,
      // Recipient details
      recipientName,
      recipientPhone,
      recipientAddress,
      recipientCity,
      recipientPostalCode,
      // Package details
      weight,
      dimensions,
      parcelCount,
      // Cost
      shippingCost,
    } = body;

    // Validate required fields
    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: 'merchantId is required' },
        { status: 400 }
      );
    }

    if (!courierId) {
      return NextResponse.json(
        { success: false, error: 'courierId is required' },
        { status: 400 }
      );
    }

    if (!orderType || !VALID_ORDER_TYPES.includes(orderType)) {
      return NextResponse.json(
        { success: false, error: `orderType is required and must be one of: ${VALID_ORDER_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    if (!recipientName || !recipientPhone || !recipientAddress || !recipientCity) {
      return NextResponse.json(
        { success: false, error: 'Recipient details (name, phone, address, city) are required' },
        { status: 400 }
      );
    }

    if (!senderAddress || !senderCity) {
      return NextResponse.json(
        { success: false, error: 'Sender details (address, city) are required' },
        { status: 400 }
      );
    }

    // Check if courier integration exists and is active
    const courierIntegration = await db.courierIntegration.findUnique({
      where: { id: courierId }
    });

    if (!courierIntegration) {
      return NextResponse.json(
        { success: false, error: 'Courier integration not found' },
        { status: 404 }
      );
    }

    if (courierIntegration.status !== 'active') {
      return NextResponse.json(
        { success: false, error: `Courier integration is ${courierIntegration.status}. Only active integrations can create shipments.` },
        { status: 400 }
      );
    }

    // Generate waybill number if autoCreateWaybill is enabled
    let waybillNumber = body.waybillNumber || null;
    if (courierIntegration.autoCreateWaybill && !waybillNumber) {
      waybillNumber = generateWaybillNumber(courierIntegration.courierCode);
    }

    // Create the shipment
    const shipment = await db.shipment.create({
      data: {
        merchantId,
        orderType,
        orderId: orderId || null,
        orderNumber: orderNumber || null,
        courierId,
        waybillNumber,
        senderAddress,
        senderCity,
        senderPostalCode: senderPostalCode || null,
        recipientName,
        recipientPhone,
        recipientAddress,
        recipientCity,
        recipientPostalCode: recipientPostalCode || null,
        weight: weight || null,
        dimensions: dimensions || null,
        parcelCount: parcelCount || 1,
        status: 'pending',
        shippingCost: shippingCost || 0,
        estimatedDelivery: null,
      },
      include: {
        courier: {
          select: {
            id: true,
            courierName: true,
            courierCode: true,
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: shipment,
      message: 'Shipment created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating shipment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create shipment' },
      { status: 500 }
    );
  }
}
