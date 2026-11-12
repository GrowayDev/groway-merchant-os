import { NextRequest, NextResponse } from 'next/server'

// Types
interface ContractorOrder {
  id: string
  orderNumber: string
  contractorId: string
  contractorName: string
  items: OrderItem[]
  subtotal: number
  discount: number
  discountPercent: number
  tax: number
  total: number
  status: 'pending' | 'confirmed' | 'processing' | 'ready' | 'delivered' | 'cancelled'
  orderDate: string
  deliveryDate?: string
  notes?: string
  createdBy: string
}

interface OrderItem {
  id: string
  sku: string
  name: string
  quantity: number
  unitPrice: number
  discount: number
  total: number
}

// Sample data
let contractorOrders: ContractorOrder[] = [
  {
    id: 'ord1',
    orderNumber: 'ORD-2026-0145',
    contractorId: 'con4',
    contractorName: 'Nkosi Building Supplies',
    items: [
      { id: 'i1', sku: 'CEM-50', name: 'Portland Cement 50kg', quantity: 100, unitPrice: 95, discount: 12, total: 8360 },
      { id: 'i2', sku: 'SAND-1T', name: 'Building Sand 1 Ton', quantity: 5, unitPrice: 450, discount: 0, total: 2250 }
    ],
    subtotal: 11750,
    discount: 1140,
    discountPercent: 12,
    tax: 1591.50,
    total: 12201.50,
    status: 'processing',
    orderDate: '2026-02-19',
    createdBy: 'Thandi Ndlovu'
  },
  {
    id: 'ord2',
    orderNumber: 'ORD-2026-0144',
    contractorId: 'con1',
    contractorName: 'BuildRight Construction',
    items: [
      { id: 'i3', sku: 'PAINT-20L', name: 'White Wall Paint 20L', quantity: 25, unitPrice: 890, discount: 15, total: 18912.50 },
      { id: 'i4', sku: 'PRIMER-20L', name: 'Primer 20L', quantity: 10, unitPrice: 650, discount: 10, total: 5850 }
    ],
    subtotal: 28750,
    discount: 3987.50,
    discountPercent: 13.87,
    tax: 3714.38,
    total: 28476.88,
    status: 'ready',
    orderDate: '2026-02-18',
    createdBy: 'Thandi Ndlovu'
  },
  {
    id: 'ord3',
    orderNumber: 'ORD-2026-0143',
    contractorId: 'con2',
    contractorName: 'Mthembu Plumbing Services',
    items: [
      { id: 'i5', sku: 'PVC-110', name: 'PVC Pipe 110mm x 6m', quantity: 20, unitPrice: 99.99, discount: 10, total: 1799.82 }
    ],
    subtotal: 1999.80,
    discount: 199.98,
    discountPercent: 10,
    tax: 269.97,
    total: 2069.79,
    status: 'delivered',
    orderDate: '2026-02-17',
    deliveryDate: '2026-02-18',
    createdBy: 'System'
  },
  {
    id: 'ord4',
    orderNumber: 'ORD-2026-0142',
    contractorId: 'con1',
    contractorName: 'BuildRight Construction',
    items: [
      { id: 'i6', sku: 'BRICK-STD', name: 'Standard Brick', quantity: 5000, unitPrice: 2.50, discount: 5, total: 11875 },
      { id: 'i7', sku: 'CEM-50', name: 'Portland Cement 50kg', quantity: 200, unitPrice: 95, discount: 12, total: 16720 }
    ],
    subtotal: 28750,
    discount: 2155,
    discountPercent: 7.5,
    tax: 3989.25,
    total: 30584.25,
    status: 'confirmed',
    orderDate: '2026-02-16',
    createdBy: 'Thandi Ndlovu'
  },
  {
    id: 'ord5',
    orderNumber: 'ORD-2026-0141',
    contractorId: 'con3',
    contractorName: 'Van Der Berg Electrical',
    items: [
      { id: 'i8', sku: 'CABLE-4MM', name: 'Electrical Cable 4mm (100m)', quantity: 10, unitPrice: 850, discount: 5, total: 8075 }
    ],
    subtotal: 8500,
    discount: 425,
    discountPercent: 5,
    tax: 1211.25,
    total: 9286.25,
    status: 'pending',
    orderDate: '2026-02-19',
    createdBy: 'System'
  },
  {
    id: 'ord6',
    orderNumber: 'ORD-2026-0140',
    contractorId: 'con4',
    contractorName: 'Nkosi Building Supplies',
    items: [
      { id: 'i9', sku: 'ROOF-SHEET', name: 'Roofing Sheet 3m', quantity: 50, unitPrice: 285, discount: 7, total: 13247.50 }
    ],
    subtotal: 14250,
    discount: 1002.50,
    discountPercent: 7,
    tax: 1987.13,
    total: 15234.63,
    status: 'delivered',
    orderDate: '2026-02-15',
    deliveryDate: '2026-02-16',
    createdBy: 'Thandi Ndlovu'
  },
  {
    id: 'ord7',
    orderNumber: 'ORD-2026-0138',
    contractorId: 'con2',
    contractorName: 'Mthembu Plumbing Services',
    items: [
      { id: 'i10', sku: 'GYSER-150', name: 'Geyser 150L', quantity: 2, unitPrice: 4500, discount: 0, total: 9000 },
      { id: 'i11', sku: 'VALVE-SET', name: 'Valve Set Complete', quantity: 4, unitPrice: 350, discount: 0, total: 1400 }
    ],
    subtotal: 10400,
    discount: 0,
    discountPercent: 0,
    tax: 1560,
    total: 11960,
    status: 'cancelled',
    orderDate: '2026-02-14',
    notes: 'Cancelled by customer request',
    createdBy: 'System'
  }
]

// GET - List all contractor orders
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const contractorId = searchParams.get('contractorId')
  
  let filteredOrders = [...contractorOrders]
  
  if (status) {
    filteredOrders = filteredOrders.filter(o => o.status === status)
  }
  
  if (contractorId) {
    filteredOrders = filteredOrders.filter(o => o.contractorId === contractorId)
  }
  
  // Get orders this month
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const ordersThisMonth = contractorOrders.filter(o => 
    new Date(o.orderDate) >= startOfMonth
  )
  
  return NextResponse.json({
    success: true,
    data: filteredOrders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()),
    stats: {
      total: contractorOrders.length,
      pending: contractorOrders.filter(o => o.status === 'pending').length,
      confirmed: contractorOrders.filter(o => o.status === 'confirmed').length,
      processing: contractorOrders.filter(o => o.status === 'processing').length,
      ready: contractorOrders.filter(o => o.status === 'ready').length,
      delivered: contractorOrders.filter(o => o.status === 'delivered').length,
      cancelled: contractorOrders.filter(o => o.status === 'cancelled').length,
      ordersThisMonth: ordersThisMonth.length,
      totalValueThisMonth: ordersThisMonth.reduce((sum, o) => sum + o.total, 0)
    }
  })
}

// POST - Create new contractor order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const orderNumber = `ORD-2026-${String(contractorOrders.length + 146).padStart(4, '0')}`
    
    const newOrder: ContractorOrder = {
      id: `ord${Date.now()}`,
      orderNumber,
      contractorId: body.contractorId,
      contractorName: body.contractorName,
      items: body.items,
      subtotal: body.subtotal,
      discount: body.discount || 0,
      discountPercent: body.discountPercent || 0,
      tax: body.tax,
      total: body.total,
      status: 'pending',
      orderDate: new Date().toISOString().split('T')[0],
      notes: body.notes,
      createdBy: 'System'
    }
    
    contractorOrders.push(newOrder)
    
    return NextResponse.json({
      success: true,
      data: newOrder,
      message: 'Order created successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 400 }
    )
  }
}
