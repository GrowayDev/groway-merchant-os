import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/merchant-os/waiter-pad - Get waiter pad data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staffId')
    const type = searchParams.get('type') || 'assignments'

    switch (type) {
      case 'assignments':
        return await getWaiterAssignments(staffId)
      case 'tables':
        return await getTableAssignments(staffId)
      case 'orders':
        return await getWaiterOrders(staffId)
      case 'menu':
        return await getMenu()
      case 'performance':
        return await getWaiterPerformance(staffId)
      default:
        return await getWaiterAssignments(staffId)
    }
  } catch (error) {
    console.error('Error in waiter pad API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch waiter pad data' },
      { status: 500 }
    )
  }
}

// Get waiter table assignments
async function getWaiterAssignments(staffId: string | null) {
  if (!staffId) {
    return NextResponse.json(
      { error: 'staffId is required for assignments' },
      { status: 400 }
    )
  }

  const assignments = await db.waiterTableAssignment.findMany({
    where: {
      waiterId: staffId,
      status: { in: ['assigned', 'active'] }
    },
    orderBy: { assignedAt: 'desc' }
  })

  return NextResponse.json({ assignments })
}

// Get tables with waiter assignments
async function getTableAssignments(staffId: string | null) {
  const tables = await db.restaurantTable.findMany({
    include: {
      FloorSection: true,
    },
    orderBy: { number: 'asc' }
  })

  // Get active assignments
  const assignments = await db.waiterTableAssignment.findMany({
    where: {
      status: { in: ['assigned', 'active'] }
    }
  })

  // Map assignments to tables
  const tablesWithAssignments = tables.map(table => {
    const assignment = assignments.find(a => {
      if (a.tableIds) {
        try {
          const tableIds = JSON.parse(a.tableIds)
          return tableIds.includes(table.id)
        } catch {
          return false
        }
      }
      return false
    })

    return {
      ...table,
      section: table.FloorSection,
      assignment: assignment || null,
      isAssigned: !!assignment
    }
  })

  return NextResponse.json({ tables: tablesWithAssignments })
}

// Get orders for a waiter
async function getWaiterOrders(staffId: string | null) {
  if (!staffId) {
    return NextResponse.json(
      { error: 'staffId is required for orders' },
      { status: 400 }
    )
  }

  const orders = await db.pOSOrder.findMany({
    where: {
      staffId,
      status: { in: ['open', 'pending', 'preparing', 'ready'] }
    },
    include: {
      POSOrderItem: true,
      POSPayment: true,
    },
    orderBy: { openedAt: 'desc' }
  })

  return NextResponse.json({ orders })
}

// Get menu items
async function getMenu() {
  // Return mock menu for now - in production this would come from a Menu model
  const menu = {
    categories: [
      { id: 'starters', name: 'Starters', icon: 'Salad' },
      { id: 'mains', name: 'Main Courses', icon: 'Utensils' },
      { id: 'burgers', name: 'Burgers & Sandwiches', icon: 'Pizza' },
      { id: 'hot-drinks', name: 'Hot Beverages', icon: 'Coffee' },
      { id: 'cold-drinks', name: 'Cold Drinks', icon: 'GlassWater' },
      { id: 'alcohol', name: 'Alcohol', icon: 'Wine' },
      { id: 'desserts', name: 'Desserts', icon: 'Cake' },
      { id: 'sides', name: 'Sides', icon: 'Soup' },
    ],
    items: [
      // Starters - Fried items go to fryer
      { id: 'item-1', name: 'Crispy Calamari', price: 89, category: 'starters', preparationTime: 12, available: true, popular: true, dietary: [], station: 'kitchen-fryer' },
      { id: 'item-2', name: 'Loaded Nachos', price: 79, category: 'starters', preparationTime: 10, available: true, popular: false, dietary: ['vegetarian'], station: 'kitchen-grill' },
      { id: 'item-3', name: 'Chicken Wings', price: 99, category: 'starters', preparationTime: 15, available: true, popular: true, dietary: ['halaal'], station: 'kitchen-fryer' },
      { id: 'item-4', name: 'Garlic Bread', price: 49, category: 'starters', preparationTime: 8, available: true, popular: false, dietary: ['vegetarian'], station: 'kitchen-grill' },
      { id: 'item-24', name: 'Bruschetta', price: 69, category: 'starters', preparationTime: 8, available: true, popular: false, dietary: ['vegetarian'], station: 'kitchen-cold' },

      // Mains - Grill station
      { id: 'item-5', name: 'Grilled Sirloin Steak', price: 269, category: 'mains', preparationTime: 25, available: true, popular: true, dietary: ['halaal'], station: 'kitchen-grill' },
      { id: 'item-6', name: 'Grilled Salmon', price: 229, category: 'mains', preparationTime: 20, available: true, popular: true, dietary: ['gluten-free'], station: 'kitchen-grill' },
      { id: 'item-7', name: 'Chicken Parmesan', price: 189, category: 'mains', preparationTime: 22, available: true, popular: false, dietary: ['halaal'], station: 'kitchen-grill' },
      { id: 'item-8', name: 'Vegetable Stir Fry', price: 149, category: 'mains', preparationTime: 15, available: true, popular: false, dietary: ['vegetarian', 'vegan', 'gluten-free'], station: 'kitchen-grill' },
      { id: 'item-9', name: 'Lamb Chops', price: 289, category: 'mains', preparationTime: 25, available: true, popular: true, dietary: ['halaal'], station: 'kitchen-grill' },

      // Burgers - Grill station
      { id: 'item-10', name: 'Classic Beef Burger', price: 139, category: 'burgers', preparationTime: 15, available: true, popular: true, dietary: [], station: 'kitchen-grill' },
      { id: 'item-11', name: 'Chicken Burger', price: 129, category: 'burgers', preparationTime: 15, available: true, popular: false, dietary: ['halaal'], station: 'kitchen-grill' },
      { id: 'item-12', name: 'Veggie Burger', price: 119, category: 'burgers', preparationTime: 12, available: true, popular: false, dietary: ['vegetarian', 'vegan'], station: 'kitchen-grill' },

      // Hot Beverages - Bar Hot Station
      { id: 'item-17', name: 'Cappuccino', price: 35, category: 'hot-drinks', preparationTime: 5, available: true, popular: true, dietary: ['vegetarian'], station: 'bar-hot', isBeverage: true },
      { id: 'item-25', name: 'Espresso', price: 28, category: 'hot-drinks', preparationTime: 3, available: true, popular: true, dietary: ['vegan'], station: 'bar-hot', isBeverage: true },
      { id: 'item-26', name: 'Latte', price: 38, category: 'hot-drinks', preparationTime: 5, available: true, popular: true, dietary: ['vegetarian'], station: 'bar-hot', isBeverage: true },

      // Cold Drinks - Bar Cold Station
      { id: 'item-13', name: 'Coca-Cola', price: 29, category: 'cold-drinks', preparationTime: 1, available: true, popular: true, dietary: ['vegan'], station: 'bar-cold', isBeverage: true },
      { id: 'item-14', name: 'Fresh Orange Juice', price: 39, category: 'cold-drinks', preparationTime: 3, available: true, popular: false, dietary: ['vegan'], station: 'bar-cold', isBeverage: true },

      // Alcohol - Bar Cold Station
      { id: 'item-15', name: 'Craft Beer', price: 49, category: 'alcohol', preparationTime: 2, available: true, popular: true, dietary: ['vegan'], station: 'bar-cold', isBeverage: true, isAlcoholic: true },
      { id: 'item-16', name: 'House Wine (Glass)', price: 59, category: 'alcohol', preparationTime: 2, available: true, popular: false, dietary: ['vegan'], station: 'bar-cold', isBeverage: true, isAlcoholic: true },

      // Desserts - Dessert Station
      { id: 'item-18', name: 'Chocolate Brownie', price: 59, category: 'desserts', preparationTime: 10, available: true, popular: true, dietary: ['vegetarian'], station: 'kitchen-dessert' },
      { id: 'item-19', name: 'Ice Cream Sundae', price: 49, category: 'desserts', preparationTime: 5, available: true, popular: false, dietary: ['vegetarian'], station: 'kitchen-dessert' },
      { id: 'item-20', name: 'Cheesecake', price: 69, category: 'desserts', preparationTime: 5, available: true, popular: true, dietary: ['vegetarian'], station: 'kitchen-dessert' },

      // Sides - Various stations
      { id: 'item-21', name: 'French Fries', price: 39, category: 'sides', preparationTime: 10, available: true, popular: true, dietary: ['vegetarian', 'vegan'], station: 'kitchen-fryer' },
      { id: 'item-22', name: 'Mashed Potato', price: 35, category: 'sides', preparationTime: 10, available: true, popular: false, dietary: ['vegetarian'], station: 'kitchen-grill' },
      { id: 'item-23', name: 'Side Salad', price: 35, category: 'sides', preparationTime: 5, available: true, popular: false, dietary: ['vegetarian', 'vegan', 'gluten-free'], station: 'kitchen-cold' },
    ]
  }

  return NextResponse.json(menu)
}

// Get waiter performance stats
async function getWaiterPerformance(staffId: string | null) {
  if (!staffId) {
    return NextResponse.json(
      { error: 'staffId is required for performance' },
      { status: 400 }
    )
  }

  // Get completed assignments
  const assignments = await db.waiterTableAssignment.findMany({
    where: {
      waiterId: staffId,
      status: 'completed'
    }
  })

  // Calculate stats
  const totalOrders = assignments.reduce((sum, a) => sum + a.totalOrders, 0)
  const totalSales = assignments.reduce((sum, a) => sum + a.totalSales, 0)
  const totalTips = assignments.reduce((sum, a) => sum + a.totalTips, 0)
  const tablesServed = assignments.reduce((sum, a) => sum + a.tablesServed, 0)

  return NextResponse.json({
    stats: {
      totalOrders,
      totalSales,
      totalTips,
      tablesServed,
      avgOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
      avgTipsPerOrder: totalOrders > 0 ? totalTips / totalOrders : 0,
    }
  })
}

// POST /api/merchant-os/waiter-pad - Create waiter assignment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, ...data } = body

    switch (type) {
      case 'assignment':
        return await createAssignment(data)
      case 'order':
        return await createOrder(data)
      case 'bill-split':
        return await splitBill(data)
      case 'tip':
        return await addTip(data)
      default:
        return NextResponse.json(
          { error: 'Invalid type' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in waiter pad POST:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

// Create waiter table assignment
async function createAssignment(data: any) {
  const { waiterId, waiterName, sectionId, tableIds, shiftId, notes } = data

  if (!waiterId || !waiterName) {
    return NextResponse.json(
      { error: 'waiterId and waiterName are required' },
      { status: 400 }
    )
  }

  const assignment = await db.waiterTableAssignment.create({
    data: {
      waiterId,
      waiterName,
      sectionId,
      tableIds: tableIds ? JSON.stringify(tableIds) : null,
      shiftId,
      notes,
      status: 'assigned',
    }
  })

  return NextResponse.json({ assignment }, { status: 201 })
}

// Create order from waiter pad
async function createOrder(data: any) {
  const {
    orderNumber,
    type = 'dine-in',
    tableId,
    tableNumber,
    staffId,
    staffName,
    items = [],
    subtotal,
    taxAmount,
    total,
    notes,
  } = data

  if (!orderNumber || !staffId) {
    return NextResponse.json(
      { error: 'orderNumber and staffId are required' },
      { status: 400 }
    )
  }

  // Create POS order
  const order = await db.pOSOrder.create({
    data: {
      orderNumber,
      type,
      tableId,
      tableNumber,
      staffId,
      staffName,
      subtotal: subtotal || 0,
      taxAmount: taxAmount || 0,
      total: total || 0,
      notes,
      status: 'open',
      kitchenStatus: 'pending',
      paymentStatus: 'unpaid',
    }
  })

  // Create order items
  for (const item of items) {
    await db.pOSOrderItem.create({
      data: {
        orderId: order.id,
        menuItemId: item.id,
        name: item.name,
        quantity: item.quantity || 1,
        unitPrice: item.price,
        totalPrice: item.price * (item.quantity || 1),
        notes: item.notes,
        station: item.station || 'grill',
        status: 'pending',
        sentToKitchen: false,
        preparationTime: item.preparationTime || 15,
      }
    })
  }

  // Update waiter assignment stats
  if (staffId) {
    await db.waiterTableAssignment.updateMany({
      where: {
        waiterId: staffId,
        status: 'active'
      },
      data: {
        totalOrders: { increment: 1 },
        totalSales: { increment: total || 0 }
      }
    })
  }

  return NextResponse.json({ order }, { status: 201 })
}

// Split bill
async function splitBill(data: any) {
  const { orderId, splits, payments } = data

  if (!orderId || !splits || !payments) {
    return NextResponse.json(
      { error: 'orderId, splits, and payments are required' },
      { status: 400 }
    )
  }

  // Get original order
  const originalOrder = await db.pOSOrder.findUnique({
    where: { id: orderId },
    include: { POSOrderItem: true }
  })

  if (!originalOrder) {
    return NextResponse.json(
      { error: 'Order not found' },
      { status: 404 }
    )
  }

  // Create payments for each split
  const splitPayments = []
  for (const payment of payments) {
    const posPayment = await db.pOSPayment.create({
      data: {
        orderId,
        amount: payment.amount,
        method: payment.method,
        status: 'completed',
        tipAmount: payment.tipAmount || 0,
        cashTendered: payment.cashTendered,
        changeGiven: payment.changeGiven,
        processedBy: payment.processedBy,
        processedAt: new Date()
      }
    })
    splitPayments.push(posPayment)
  }

  // Update order payment status
  const totalPaid = payments.reduce((sum: any, p: any) => sum + p.amount + (p.tipAmount || 0), 0)
  const isFullyPaid = totalPaid >= originalOrder.total

  await db.pOSOrder.update({
    where: { id: orderId },
    data: {
      paymentStatus: isFullyPaid ? 'paid' : 'partial',
      paidAmount: totalPaid,
      status: isFullyPaid ? 'closed' : 'open',
      closedAt: isFullyPaid ? new Date() : null
    }
  })

  return NextResponse.json({
    success: true,
    splits,
    payments: splitPayments,
    isFullyPaid
  })
}

// Add tip to order
async function addTip(data: any) {
  const { orderId, tipAmount, tipMethod, staffId } = data

  if (!orderId || !tipAmount) {
    return NextResponse.json(
      { error: 'orderId and tipAmount are required' },
      { status: 400 }
    )
  }

  // Update order with tip
  const order = await db.pOSOrder.update({
    where: { id: orderId },
    data: {
      tipAmount,
    }
  })

  // Update waiter assignment with tip
  if (staffId) {
    await db.waiterTableAssignment.updateMany({
      where: {
        waiterId: staffId,
        status: 'active'
      },
      data: {
        totalTips: { increment: tipAmount }
      }
    })
  }

  return NextResponse.json({ success: true, tipAmount })
}

// PUT /api/merchant-os/waiter-pad - Update waiter assignment
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { assignmentId, ...updates } = body

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'assignmentId is required' },
        { status: 400 }
      )
    }

    const assignment = await db.waiterTableAssignment.update({
      where: { id: assignmentId },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ assignment })
  } catch (error) {
    console.error('Error updating waiter assignment:', error)
    return NextResponse.json(
      { error: 'Failed to update waiter assignment' },
      { status: 500 }
    )
  }
}
