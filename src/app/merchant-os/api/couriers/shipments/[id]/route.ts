import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/couriers/shipments/[id] - Get a single shipment
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
            status: true,
            autoCreateWaybill: true,
            defaultService: true,
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

    // Parse tracking events if they exist
    let trackingEvents = [];
    if (shipment.trackingEvents) {
      try {
        trackingEvents = JSON.parse(shipment.trackingEvents);
      } catch {
        trackingEvents = [];
      }
    }

    const response = {
      ...shipment,
      trackingEvents,
    };

    return NextResponse.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error fetching shipment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shipment' },
      { status: 500 }
    );
  }
}

// PUT /api/couriers/shipments/[id] - Update a shipment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if shipment exists
    const existingShipment = await db.shipment.findUnique({
      where: { id }
    });

    if (!existingShipment) {
      return NextResponse.json(
        { success: false, error: 'Shipment not found' },
        { status: 404 }
      );
    }

    // Don't allow updates to delivered or failed shipments
    if (existingShipment.status === 'delivered' || existingShipment.status === 'failed') {
      return NextResponse.json(
        { success: false, error: `Cannot update shipment with status: ${existingShipment.status}` },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    
    // Updatable fields
    if (body.orderId !== undefined) updateData.orderId = body.orderId;
    if (body.orderNumber !== undefined) updateData.orderNumber = body.orderNumber;
    if (body.waybillNumber !== undefined) updateData.waybillNumber = body.waybillNumber;
    if (body.senderAddress !== undefined) updateData.senderAddress = body.senderAddress;
    if (body.senderCity !== undefined) updateData.senderCity = body.senderCity;
    if (body.senderPostalCode !== undefined) updateData.senderPostalCode = body.senderPostalCode;
    if (body.recipientName !== undefined) updateData.recipientName = body.recipientName;
    if (body.recipientPhone !== undefined) updateData.recipientPhone = body.recipientPhone;
    if (body.recipientAddress !== undefined) updateData.recipientAddress = body.recipientAddress;
    if (body.recipientCity !== undefined) updateData.recipientCity = body.recipientCity;
    if (body.recipientPostalCode !== undefined) updateData.recipientPostalCode = body.recipientPostalCode;
    if (body.weight !== undefined) updateData.weight = body.weight;
    if (body.dimensions !== undefined) updateData.dimensions = body.dimensions;
    if (body.parcelCount !== undefined) updateData.parcelCount = body.parcelCount;
    if (body.shippingCost !== undefined) updateData.shippingCost = body.shippingCost;
    if (body.estimatedDelivery !== undefined) updateData.estimatedDelivery = body.estimatedDelivery;

    // Handle tracking events - append new events
    if (body.trackingEvents && Array.isArray(body.trackingEvents)) {
      let existingEvents = [];
      if (existingShipment.trackingEvents) {
        try {
          existingEvents = JSON.parse(existingShipment.trackingEvents);
        } catch {
          existingEvents = [];
        }
      }
      // Merge existing events with new ones
      const allEvents = [...existingEvents, ...body.trackingEvents];
      updateData.trackingEvents = JSON.stringify(allEvents);
    }

    // Update the shipment
    const shipment = await db.shipment.update({
      where: { id },
      data: updateData,
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
      message: 'Shipment updated successfully'
    });
  } catch (error) {
    console.error('Error updating shipment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update shipment' },
      { status: 500 }
    );
  }
}
