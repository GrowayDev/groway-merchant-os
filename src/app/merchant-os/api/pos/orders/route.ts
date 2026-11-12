import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper to generate order number
async function generateOrderNumber(): Promise<string> {
  const today = new Date();
  const prefix = `ORD-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  
  // Get count of orders today
  const todayStart = new Date(today.setHours(0, 0, 0, 0));
  const todayEnd = new Date(today.setHours(23, 59, 59, 999));
  
  const count = await db.pOSOrder.count({
    where: {
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
  });
  
  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
}

// Helper to create kitchen order from POS order
async function createKitchenOrderFromPOS(order: any, items: any[], staffName?: string) {
  try {
    // Get unique stations from items
    const stations = [...new Set(items.map((item: any) => item.station || 'grill'))];
    
    // Calculate estimated time based on longest prep time
    const maxPrepTime = Math.max(...items.map((item: any) => item.preparationTime || 15));
    
    const kitchenOrder = await db.kitchenOrder.create({
      data: {
        id: `ko-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        orderNumber: order.orderNumber,
        type: order.type || 'dine-in',
        priority: 'normal',
        tableNumber: order.tableNumber,
        customerName: order.customerName,
        estimatedTime: maxPrepTime,
        notes: order.notes,
        waiterName: staffName,
        updatedAt: new Date(),
      },
    });
    
    // Create kitchen order items
    for (const item of items) {
      await db.kitchenOrderItem.create({
        data: {
          id: `koi-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          orderId: kitchenOrder.id,
          name: item.name,
          quantity: item.quantity || 1,
          notes: item.notes,
          modifiers: item.modifiers ? JSON.stringify(item.modifiers) : null,
          status: 'pending',
          station: item.station || 'grill',
          preparationTime: item.preparationTime || 15,
          dietary: item.dietary ? JSON.stringify(item.dietary) : null,
          allergens: item.allergens ? JSON.stringify(item.allergens) : null,
          spicyLevel: item.spicyLevel,
          updatedAt: new Date(),
        },
      });
    }
    
    // Create kitchen order stations
    for (const station of stations) {
      await db.kitchenOrderStation.create({
        data: {
          id: `kos-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          orderId: kitchenOrder.id,
          station: station,
        },
      });
    }
    
    return kitchenOrder;
  } catch (error) {
    console.error('Error creating kitchen order:', error);
    return null;
  }
}

// GET all orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const staffId = searchParams.get('staffId');
    const tableId = searchParams.get('tableId');
    const type = searchParams.get('type');
    const paymentStatus = searchParams.get('paymentStatus');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    if (staffId) {
      where.staffId = staffId;
    }
    if (tableId) {
      where.tableId = tableId;
    }
    if (type) {
      where.type = type;
    }
    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [orders, total] = await Promise.all([
      db.pOSOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          POSOrderItem: {
            orderBy: { createdAt: 'asc' },
          },
          POSPayment: true,
          RestaurantStaff: {
            select: {
              id: true,
              name: true,
              role: true,
              avatar: true,
              color: true,
            },
          },
        },
      }),
      db.pOSOrder.count({ where }),
    ]);

    // Transform to expected format
    const transformedOrders = orders.map(order => ({
      ...order,
      items: order.POSOrderItem,
      payments: order.POSPayment,
      staff: order.RestaurantStaff,
    }));

    return NextResponse.json({
      success: true,
      data: transformedOrders,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + transformedOrders.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST create order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      type = 'dine-in',
      tableId,
      tableNumber,
      sectionId,
      sectionName,
      customerName,
      customerPhone,
      customerEmail,
      guests = 1,
      staffId,
      staffName,
      notes,
      specialRequests,
      items = [],
    } = body;

    // Validate items
    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order must have at least one item' },
        { status: 400 }
      );
    }

    // Validate order type
    const validTypes = ['dine-in', 'takeaway', 'delivery', 'drive-through'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order type' },
        { status: 400 }
      );
    }

    // Generate order number
    const orderNumber = await generateOrderNumber();

    // Calculate totals
    let subtotal = 0;
    const orderItems = items.map((item: any, index: number) => {
      const itemTotal = item.unitPrice * item.quantity;
      subtotal += itemTotal;
      return {
        menuItemId: item.menuItemId,
        name: item.name,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice,
        totalPrice: itemTotal,
        modifiers: item.modifiers ? JSON.stringify(item.modifiers) : null,
        notes: item.notes,
        dietary: item.dietary ? JSON.stringify(item.dietary) : null,
        allergens: item.allergens ? JSON.stringify(item.allergens) : null,
        spicyLevel: item.spicyLevel,
        station: item.station || 'grill',
        status: 'pending',
        preparationTime: item.preparationTime || 15,
      };
    });

    // Calculate tax (15% VAT for South Africa)
    const taxRate = 0.15;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    // Create order with items
    const order = await db.pOSOrder.create({
      data: {
        id: `pos-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        orderNumber,
        type,
        tableId,
        tableNumber,
        sectionId,
        sectionName,
        customerName,
        customerPhone,
        customerEmail,
        guests,
        staffId,
        staffName,
        notes,
        specialRequests,
        subtotal,
        taxAmount,
        total,
        status: 'open',
        kitchenStatus: 'pending',
        paymentStatus: 'unpaid',
        paidAmount: 0,
        updatedAt: new Date(),
        POSOrderItem: {
          create: orderItems.map(item => ({
            id: `poi-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            ...item,
            updatedAt: new Date(),
          })),
        },
      },
      include: {
        POSOrderItem: true,
        RestaurantStaff: {
          select: {
            id: true,
            name: true,
            role: true,
            avatar: true,
            color: true,
          },
        },
      },
    });

    // Transform to expected format
    const transformedOrder = {
      ...order,
      items: order.POSOrderItem,
      staff: order.RestaurantStaff,
    };

    // Also create kitchen order for kitchen display
    await createKitchenOrderFromPOS(order, items, staffName);

    return NextResponse.json({
      success: true,
      data: transformedOrder,
      message: 'Order created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
