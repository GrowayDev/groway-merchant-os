/**
 * GroSell Cart API
 * 
 * Manages shopping carts for WhatsApp commerce
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const merchantId = searchParams.get('merchantId')
    const customerPhone = searchParams.get('customerPhone')
    const cartId = searchParams.get('cartId')

    if (!merchantId) {
      return NextResponse.json({ error: 'Missing merchantId' }, { status: 400 })
    }

    if (cartId) {
      const cart = await db.groSellCartSession.findUnique({
        where: { id: cartId }
      })
      return NextResponse.json({ success: true, cart })
    }

    if (!customerPhone) {
      return NextResponse.json({ error: 'Missing customerPhone or cartId' }, { status: 400 })
    }

    const cart = await db.groSellCartSession.findFirst({
      where: { merchantId, customerPhone, status: 'active' }
    })

    return NextResponse.json({
      success: true,
      cart: cart || null,
      items: cart ? JSON.parse(cart.items) : []
    })
  } catch (error) {
    console.error('GroSell cart get error:', error)
    return NextResponse.json({ error: 'Failed to get cart' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { merchantId, customerPhone, items } = body

    if (!merchantId || !customerPhone || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Missing required fields: merchantId, customerPhone, items' },
        { status: 400 }
      )
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0)
    const itemCount = items.reduce((sum: number, item: any) => 
      sum + item.quantity, 0)

    // Find or create cart
    let cart = await db.groSellCartSession.findFirst({
      where: { merchantId, customerPhone, status: 'active' }
    })

    if (cart) {
      cart = await db.groSellCartSession.update({
        where: { id: cart.id },
        data: {
          items: JSON.stringify(items),
          itemCount,
          subtotal,
          total: subtotal,
          updatedAt: new Date()
        }
      })
    } else {
      cart = await db.groSellCartSession.create({
        data: {
          id: `cart_${nanoid(12)}`,
          merchantId,
          customerPhone,
          items: JSON.stringify(items),
          itemCount,
          subtotal,
          total: subtotal,
          status: 'active',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      cart,
      itemCount,
      subtotal
    })
  } catch (error) {
    console.error('GroSell cart post error:', error)
    return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { cartId, action, productId, quantity } = body

    if (!cartId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: cartId, action' },
        { status: 400 }
      )
    }

    const cart = await db.groSellCartSession.findUnique({
      where: { id: cartId }
    })

    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 })
    }

    let items = JSON.parse(cart.items)

    switch (action) {
      case 'add':
        const existingIndex = items.findIndex((i: any) => i.productId === productId)
        if (existingIndex >= 0) {
          items[existingIndex].quantity += quantity || 1
        } else {
          items.push({ productId, quantity: quantity || 1 })
        }
        break
      case 'remove':
        items = items.filter((i: any) => i.productId !== productId)
        break
      case 'update':
        const updateIndex = items.findIndex((i: any) => i.productId === productId)
        if (updateIndex >= 0) {
          if (quantity && quantity > 0) {
            items[updateIndex].quantity = quantity
          } else {
            items.splice(updateIndex, 1)
          }
        }
        break
      case 'clear':
        items = []
        break
    }

    const subtotal = items.reduce((sum: number, item: any) => 
      sum + (item.price || 0) * item.quantity, 0)
    const itemCount = items.reduce((sum: number, item: any) => 
      sum + item.quantity, 0)

    const updatedCart = await db.groSellCartSession.update({
      where: { id: cartId },
      data: {
        items: JSON.stringify(items),
        itemCount,
        subtotal,
        total: subtotal,
        status: items.length === 0 ? 'abandoned' : 'active',
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      cart: updatedCart,
      items
    })
  } catch (error) {
    console.error('GroSell cart put error:', error)
    return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const cartId = searchParams.get('cartId')

    if (!cartId) {
      return NextResponse.json({ error: 'Missing cartId' }, { status: 400 })
    }

    await db.groSellCartSession.update({
      where: { id: cartId },
      data: { status: 'abandoned', abandonedAt: new Date(), updatedAt: new Date() }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('GroSell cart delete error:', error)
    return NextResponse.json({ error: 'Failed to delete cart' }, { status: 500 })
  }
}
