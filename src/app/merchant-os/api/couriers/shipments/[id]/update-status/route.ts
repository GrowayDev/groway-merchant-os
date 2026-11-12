import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Valid shipment statuses
const VALID_STATUSES = [
  'pending',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'failed'
];

// Valid status transitions (current status -> allowed next statuses)
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['picked_up', 'failed'],
  picked_up: ['in_transit', 'failed'],
  in_transit: ['out_for_delivery', 'failed'],
  out_for_delivery: ['delivered', 'failed'],
  delivered: [], // No transitions allowed from delivered
  failed: ['pending'], // Can retry from failed
};

// PUT /api/couriers/shipments/[id]/update-status - Update shipment status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, location, notes, details } = body;

    // Validate status
    if (!status) {
      return NextResponse.json(
        { success: false, error: 'status is required' },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Valid statuses: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

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

    // Validate status transition
    const currentStatus = existingShipment.status;
    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];

    if (currentStatus === 'delivered') {
      return NextResponse.json(
        { success: false, error: 'Cannot update status of a delivered shipment' },
        { status: 400 }
      );
    }

    // Allow same status update (for adding tracking events)
    if (status !== currentStatus && !allowedTransitions.includes(status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid status transition from '${currentStatus}' to '${status}'. Allowed transitions: ${allowedTransitions.join(', ') || 'none'}` 
        },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      status,
    };

    // Handle timestamps based on status
    if (status === 'picked_up' && currentStatus !== 'picked_up') {
      updateData.shippedAt = new Date();
    }

    if (status === 'delivered' && currentStatus !== 'delivered') {
      updateData.deliveredAt = new Date();
    }

    // Build tracking event
    const trackingEvent = {
      timestamp: new Date().toISOString(),
      status,
      location: location || existingShipment.recipientCity,
      description: notes || `Status updated to ${status}`,
      details: details || null,
    };

    // Parse existing tracking events
    let trackingEvents: Array<Record<string, unknown>> = [];
    if (existingShipment.trackingEvents) {
      try {
        trackingEvents = JSON.parse(existingShipment.trackingEvents);
      } catch {
        trackingEvents = [];
      }
    }

    // Add new tracking event
    trackingEvents.push(trackingEvent);
    updateData.trackingEvents = JSON.stringify(trackingEvents);

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

    // Build status transition info
    const statusTransition = {
      previousStatus: currentStatus,
      newStatus: status,
      timestamp: new Date().toISOString(),
      isValidTransition: status === currentStatus || allowedTransitions.includes(status),
    };

    return NextResponse.json({
      success: true,
      data: {
        shipment,
        statusTransition,
        trackingEvent,
      },
      message: status === currentStatus 
        ? 'Tracking event added successfully' 
        : `Shipment status updated from '${currentStatus}' to '${status}'`
    });
  } catch (error) {
    console.error('Error updating shipment status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update shipment status' },
      { status: 500 }
    );
  }
}
