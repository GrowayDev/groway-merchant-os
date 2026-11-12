import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET single payment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const payment = await db.pOSPayment.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            type: true,
            tableNumber: true,
            sectionName: true,
            customerName: true,
            customerPhone: true,
            subtotal: true,
            taxAmount: true,
            discountAmount: true,
            total: true,
            status: true,
            paymentStatus: true,
            paidAmount: true,
            createdAt: true,
            closedAt: true,
            items: {
              select: {
                id: true,
                name: true,
                quantity: true,
                unitPrice: true,
                totalPrice: true,
              },
            },
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            avatar: true,
            color: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Calculate refund eligibility
    const canRefund = payment.status === 'completed' && !payment.refundedAt;
    const maxRefundAmount = payment.amount - (payment.refundedAmount || 0);

    return NextResponse.json({
      success: true,
      data: {
        ...payment,
        refundInfo: {
          canRefund,
          maxRefundAmount,
          alreadyRefunded: payment.refundedAmount || 0,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment' },
      { status: 500 }
    );
  }
}

// PUT refund payment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      action,
      refundAmount,
      refundReason,
      refundedBy,
      pin,
      managerPin,
      notes,
    } = body;

    // Validate action
    if (action !== 'refund') {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Only "refund" is supported' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!refundAmount || !refundedBy || !pin) {
      return NextResponse.json(
        { success: false, error: 'refundAmount, refundedBy, and pin are required' },
        { status: 400 }
      );
    }

    // Verify staff and PIN
    const staff = await db.restaurantStaff.findUnique({
      where: { id: refundedBy },
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Staff not found' },
        { status: 404 }
      );
    }

    if (staff.pin !== pin) {
      return NextResponse.json(
        { success: false, error: 'Invalid PIN' },
        { status: 401 }
      );
    }

    // Check refund permission
    if (!staff.canRefund) {
      // Check for manager override
      if (!managerPin) {
        return NextResponse.json(
          { success: false, error: 'Staff does not have refund permission. Manager PIN required.', requiresManager: true },
          { status: 403 }
        );
      }

      // Verify manager PIN
      const managers = await db.restaurantStaff.findMany({
        where: {
          role: { in: ['manager', 'admin'] },
          status: 'active',
        },
      });
      
      const validManager = managers.find(m => m.pin === managerPin);
      if (!validManager) {
        return NextResponse.json(
          { success: false, error: 'Invalid manager PIN' },
          { status: 401 }
        );
      }
    }

    // Get payment
    const payment = await db.pOSPayment.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Validate refund
    if (payment.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Can only refund completed payments' },
        { status: 400 }
      );
    }

    if (payment.refundedAt && payment.refundedAmount === payment.amount) {
      return NextResponse.json(
        { success: false, error: 'Payment is already fully refunded' },
        { status: 400 }
      );
    }

    const maxRefundable = payment.amount - (payment.refundedAmount || 0);
    if (refundAmount > maxRefundable) {
      return NextResponse.json(
        { success: false, error: `Maximum refund amount is ${maxRefundable}` },
        { status: 400 }
      );
    }

    // Process refund
    const newRefundedAmount = (payment.refundedAmount || 0) + refundAmount;
    const isFullRefund = newRefundedAmount >= payment.amount;

    // Update payment
    const updatedPayment = await db.pOSPayment.update({
      where: { id },
      data: {
        refundedAmount: newRefundedAmount,
        refundedAt: new Date(),
        refundReason,
        refundedBy,
        status: isFullRefund ? 'refunded' : payment.status,
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            paidAmount: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // Update order paid amount
    const newOrderPaidAmount = payment.order.paidAmount - refundAmount;
    const newPaymentStatus = newOrderPaidAmount <= 0 ? 'refunded' : 'partial';

    await db.pOSOrder.update({
      where: { id: payment.orderId },
      data: {
        paidAmount: Math.max(0, newOrderPaidAmount),
        paymentStatus: newPaymentStatus,
      },
    });

    // Create void log for refund
    await db.voidLog.create({
      data: {
        orderId: payment.orderId,
        voidedBy: refundedBy,
        itemType: 'payment',
        itemName: `${payment.method} payment`,
        quantity: 1,
        amount: refundAmount,
        customReason: refundReason,
        managerApproved: managerPin || undefined,
        notes: notes || `Refund for payment ${id}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedPayment,
      refundDetails: {
        amount: refundAmount,
        reason: refundReason,
        refundedBy: staff.name,
        isFullRefund,
        previousRefunded: payment.refundedAmount || 0,
        totalRefunded: newRefundedAmount,
      },
      message: isFullRefund 
        ? 'Full refund processed successfully' 
        : 'Partial refund processed successfully',
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process refund' },
      { status: 500 }
    );
  }
}
