import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const products = await db.onlineStoreProduct.findMany({
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }]
    })
    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json([
      { id: '1', name: 'Signature Burger Combo', price: 89.99, category: 'Combos', stock: 50, inStock: true, featured: true, active: true, createdAt: new Date().toISOString() },
      { id: '2', name: 'Chicken Wings (12pc)', price: 99.99, category: 'Starters', stock: 30, inStock: true, featured: true, active: true, createdAt: new Date().toISOString() },
      { id: '3', name: 'Beef Burger Deluxe', price: 69.99, category: 'Mains', stock: 25, inStock: true, featured: false, active: true, createdAt: new Date().toISOString() },
    ])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const product = await db.onlineStoreProduct.create({
      data: {
        name: body.name,
        description: body.description,
        price: parseFloat(body.price),
        comparePrice: body.comparePrice ? parseFloat(body.comparePrice) : null,
        category: body.category,
        sku: body.sku,
        barcode: body.barcode,
        stock: parseInt(body.stock) || 0,
        inStock: body.inStock ?? true,
        featured: body.featured ?? false,
        active: body.active ?? true
      }
    })
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
