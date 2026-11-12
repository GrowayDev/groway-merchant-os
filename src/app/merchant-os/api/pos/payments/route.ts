import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { processSaleIntegrations } from '../integrations/route';

// GET all payments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const method = searchParams.get('method');
    const status = searchParams.get('status');
    const processedBy = searchParams.get('processedBy');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    
    if (orderId) {
      where.orderId = orderId;
    }
    if (method) {
      where.method = method;
    }
    if (status) {
      where.status = status;
    }
    if (processedBy) {
      where.processedBy = processedBy;
    }
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [payments, total] = await Promise.all([
      db.pOSPayment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              tableNumber: true,
              customerName: true,
              total: true,
            },
          },
          staff: {
            select: {
              id: true,
              name: true,
              role: true,
              avatar: true,
            },
          },
        },
      }),
      db.pOSPayment.count({ where }),
    ]);

    // Calculate summary stats
    const summary = await db.pOSPayment.aggregate({
      where,
      _sum: {
        amount: true,
        tipAmount: true,
      },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: payments,
      summary: {
        totalAmount: summary._sum.amount || 0,
        totalTips: summary._sum.tipAmount || 0,
        count: summary._count,
      },
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + payments.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

// POST create payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      orderId,
      amount,
      method,
      tipAmount = 0,
      tipMethod,
      processedBy,
      pin,
      
      // Card payment details
      cardType,
      cardLastFour,
      cardHolderName,
      authCode,
      terminalId,
      
      // Mobile payment details
      mobileProvider,
      transactionRef,
      
      // Cash payment details
      cashTendered,
      changeGiven,
      
      // Split payment details
      splitOrderId,
      splitIndex,
      
      // Notes
      notes,
    } = body;

    // Validate required fields
    if (!orderId || !amount || !method || !processedBy || !pin) {
      return NextResponse.json(
        { success: false, error: 'orderId, amount, method, processedBy, and pin are required' },
        { status: 400 }
      );
    }

    // Validate payment method
    const validMethods = ['cash', 'card', 'mobile', 'wallet', 'voucher', 'split'];
    if (!validMethods.includes(method)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    // Verify staff and PIN
    const staff = await db.restaurantStaff.findUnique({
      where: { id: processedBy },
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

    // Get order
    const order = await db.pOSOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.paymentStatus === 'paid') {
      return NextResponse.json(
        { success: false, error: 'Order is already fully paid' },
        { status: 400 }
      );
    }

    // Calculate amounts
    const totalWithTip = amount + tipAmount;
    const newPaidAmount = order.paidAmount + amount;
    const remainingAmount = order.total - newPaidAmount;

    // Determine payment status
    let paymentStatus = 'unpaid';
    if (remainingAmount <= 0) {
      paymentStatus = 'paid';
    } else if (newPaidAmount > 0) {
      paymentStatus = 'partial';
    }

    // Validate cash payment
    if (method === 'cash') {
      if (cashTendered === undefined || cashTendered < totalWithTip) {
        return NextResponse.json(
          { success: false, error: 'Insufficient cash tendered' },
          { status: 400 }
        );
      }
    }

    // Create payment
    const payment = await db.pOSPayment.create({
      data: {
        orderId,
        amount,
        method,
        status: 'completed',
        tipAmount,
        tipMethod,
        processedBy,
        
        // Card details
        cardType: method === 'card' ? cardType : null,
        cardLastFour: method === 'card' ? cardLastFour : null,
        cardHolderName: method === 'card' ? cardHolderName : null,
        authCode: method === 'card' ? authCode : null,
        terminalId: method === 'card' ? terminalId : null,
        
        // Mobile details
        mobileProvider: method === 'mobile' ? mobileProvider : null,
        transactionRef: method === 'mobile' ? transactionRef : null,
        
        // Cash details
        cashTendered: method === 'cash' ? cashTendered : null,
        changeGiven: method === 'cash' ? changeGiven : null,
        
        // Split details
        splitOrderId: method === 'split' ? splitOrderId : null,
        splitIndex: method === 'split' ? splitIndex : null,
        
        processedAt: new Date(),
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            tableNumber: true,
            total: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            role: true,
            avatar: true,
          },
        },
      },
    });

    // Update order
    const orderUpdate: any = {
      paidAmount: newPaidAmount,
      paymentStatus,
    };

    if (paymentStatus === 'paid') {
      orderUpdate.status = 'closed';
      orderUpdate.closedAt = new Date();
    }

    // Update tip amount on order
    if (tipAmount > 0) {
      orderUpdate.tipAmount = order.tipAmount + tipAmount;
    }

    await db.pOSOrder.update({
      where: { id: orderId },
      data: orderUpdate,
    });

    // Update shift totals if staff is clocked in
    const today = new Date().toISOString().split('T')[0];
    const activeShift = await db.staffShift.findUnique({
      where: {
        staffId_date: {
          staffId: processedBy,
          date: today,
        },
      },
    });

    if (activeShift) {
      await db.staffShift.update({
        where: { id: activeShift.id },
        data: {
          totalSales: { increment: amount },
          totalTips: { increment: tipAmount },
          totalOrders: { increment: 1 },
        },
      });
    }

    // Process integrations (inventory deduction & accounting entry) when order is fully paid
    let integrationResult = null;
    if (paymentStatus === 'paid') {
      try {
        integrationResult = await processSaleIntegrations(orderId, payment.id);
        console.log(`[SALE INTEGRATION] Order ${order.orderNumber}:`, {
          inventory: integrationResult.inventory?.success,
          accounting: integrationResult.accounting?.success,
        });
      } catch (integrationError) {
        console.error('[SALE INTEGRATION ERROR]', integrationError);
        // Don't fail the payment if integration fails - just log it
        integrationResult = {
          success: false,
          error: integrationError instanceof Error ? integrationError.message : 'Integration failed',
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: payment,
      orderUpdate: {
        paidAmount: newPaidAmount,
        remainingAmount: Math.max(0, remainingAmount),
        paymentStatus,
      },
      integration: integrationResult,
      message: 'Payment processed successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}
