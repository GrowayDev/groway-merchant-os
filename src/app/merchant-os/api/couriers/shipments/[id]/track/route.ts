import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Status descriptions for user-friendly display
const STATUS_DESCRIPTIONS: Record<string, string> = {
  pending: 'Shipment is pending pickup',
  picked_up: 'Shipment has been picked up',
  in_transit: 'Shipment is in transit',
  out_for_delivery: 'Shipment is out for delivery',
  delivered: 'Shipment has been delivered',
  failed: 'Delivery attempt failed',
};

// GET /api/couriers/shipments/[id]/track - Get tracking information for a shipment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const shipment = await db.shipment.findUnique({
      where: { id },
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

    if (!shipment) {
      return NextResponse.json(
        { success: false, error: 'Shipment not found' },
        { status: 404 }
      );
    }

    // Parse existing tracking events
    let trackingEvents: Array<{
      timestamp: string;
      status: string;
      location?: string;
      description?: string;
      details?: Record<string, unknown>;
    }> = [];

    if (shipment.trackingEvents) {
      try {
        trackingEvents = JSON.parse(shipment.trackingEvents);
      } catch {
        trackingEvents = [];
      }
    }

    // Build the current status event
    const currentStatusEvent = {
      timestamp: new Date().toISOString(),
      status: shipment.status,
      description: STATUS_DESCRIPTIONS[shipment.status] || shipment.status,
      location: shipment.recipientCity,
      isCurrent: true,
    };

    // Calculate estimated delivery if not set and shipment is in progress
    let estimatedDelivery = shipment.estimatedDelivery;
    if (!estimatedDelivery && ['picked_up', 'in_transit', 'out_for_delivery'].includes(shipment.status)) {
      // Estimate delivery in 2-5 days based on status
      const daysToAdd = shipment.status === 'out_for_delivery' ? 0 : 
                       shipment.status === 'in_transit' ? 3 : 5;
      const estimatedDate = new Date();
      estimatedDate.setDate(estimatedDate.getDate() + daysToAdd);
      estimatedDelivery = estimatedDate.toISOString().split('T')[0];
    }

    // Build tracking timeline
    const timeline = [
      // Add initial pending event if no events exist
      ...(trackingEvents.length === 0 ? [{
        timestamp: shipment.createdAt.toISOString(),
        status: 'pending',
        description: 'Shipment created',
        location: shipment.senderCity,
        isCurrent: shipment.status === 'pending',
      }] : []),
      // Add all recorded tracking events
      ...trackingEvents.map(event => ({
        ...event,
        isCurrent: event.status === shipment.status,
      })),
      // Add current status event if different from last event
      ...(trackingEvents.length === 0 || 
          trackingEvents[trackingEvents.length - 1]?.status !== shipment.status 
        ? [currentStatusEvent] 
        : []),
    ];

    // Build response
    const trackingResponse = {
      // Basic info
      waybillNumber: shipment.waybillNumber,
      courierId: shipment.courierId,
      courier: shipment.courier,
      
      // Status info
      status: shipment.status,
      statusDescription: STATUS_DESCRIPTIONS[shipment.status],
      
      // Route info
      origin: {
        address: shipment.senderAddress,
        city: shipment.senderCity,
        postalCode: shipment.senderPostalCode,
      },
      destination: {
        name: shipment.recipientName,
        phone: shipment.recipientPhone,
        address: shipment.recipientAddress,
        city: shipment.recipientCity,
        postalCode: shipment.recipientPostalCode,
      },
      
      // Package info
      package: {
        weight: shipment.weight,
        dimensions: shipment.dimensions,
        parcelCount: shipment.parcelCount,
      },
      
      // Dates
      createdAt: shipment.createdAt,
      shippedAt: shipment.shippedAt,
      deliveredAt: shipment.deliveredAt,
      estimatedDelivery,
      
      // Tracking timeline
      timeline,
      
      // Cost
      shippingCost: shipment.shippingCost,
      
      // Order reference
      order: {
        type: shipment.orderType,
        id: shipment.orderId,
        number: shipment.orderNumber,
      },
    };

    return NextResponse.json({
      success: true,
      data: trackingResponse
    });
  } catch (error) {
    console.error('Error fetching tracking info:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tracking information' },
      { status: 500 }
    );
  }
}
