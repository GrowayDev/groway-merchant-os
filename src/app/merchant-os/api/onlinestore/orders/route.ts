import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Return sample orders
  return NextResponse.json([
    { id: '1', orderNumber: 'ORD-001', customerName: 'John D.', customerEmail: 'john@test.com', items: [{ productName: 'Burger', quantity: 2, price: 89.99 }], subtotal: 179.98, vat: 27.00, total: 206.98, status: 'pending', paymentStatus: 'pending', createdAt: new Date().toISOString() },
    { id: '2', orderNumber: 'ORD-002', customerName: 'Sarah M.', customerEmail: 'sarah@test.com', items: [{ productName: 'Wings', quantity: 1, price: 99.99 }], subtotal: 99.99, vat: 15.00, total: 114.99, status: 'confirmed', paymentStatus: 'paid', createdAt: new Date().toISOString() },
  ])
}
