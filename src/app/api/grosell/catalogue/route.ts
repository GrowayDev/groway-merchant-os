/**
 * GroSell Catalogue API
 * 
 * Manages product catalogues for WhatsApp commerce
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const merchantId = searchParams.get('merchantId')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const vertical = searchParams.get('vertical')

    if (!merchantId) {
      // Return demo catalogue if no merchantId
      return NextResponse.json({
        success: true,
        products: getDemoCatalogue(),
        categories: ['Fresh Produce', 'Groceries', 'Beverages', 'Household', 'Snacks']
      })
    }

    // Build query
    const where: any = { merchantId }
    if (category) where.category = category
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ]
    }

    const products = await db.product.findMany({
      where,
      orderBy: { name: 'asc' },
      take: 100
    })

    // Get unique categories
    const allProducts = await db.product.findMany({
      where: { merchantId },
      select: { category: true }
    })
    const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))]

    return NextResponse.json({
      success: true,
      products,
      categories,
      count: products.length
    })
  } catch (error) {
    console.error('GroSell catalogue error:', error)
    return NextResponse.json(
      { error: 'Failed to get catalogue' },
      { status: 500 }
    )
  }
}

// Demo catalogue for testing
function getDemoCatalogue() {
  return [
    {
      id: 'prod_001',
      name: 'Fresh Bread',
      description: 'Daily baked white bread',
      price: 18.99,
      category: 'Bakery',
      image: null,
      inStock: true,
      unit: 'loaf'
    },
    {
      id: 'prod_002',
      name: 'Full Cream Milk 2L',
      description: 'Fresh full cream milk',
      price: 34.99,
      category: 'Dairy',
      image: null,
      inStock: true,
      unit: 'bottle'
    },
    {
      id: 'prod_003',
      name: 'White Rice 5kg',
      description: 'Long grain white rice',
      price: 89.99,
      category: 'Groceries',
      image: null,
      inStock: true,
      unit: 'bag'
    },
    {
      id: 'prod_004',
      name: 'Cooking Oil 2L',
      description: 'Sunflower cooking oil',
      price: 64.99,
      category: 'Groceries',
      image: null,
      inStock: true,
      unit: 'bottle'
    },
    {
      id: 'prod_005',
      name: 'Sugar 2.5kg',
      description: 'White sugar',
      price: 52.99,
      category: 'Groceries',
      image: null,
      inStock: true,
      unit: 'bag'
    },
    {
      id: 'prod_006',
      name: 'Frozen Chicken 1.5kg',
      description: 'Mixed chicken portions',
      price: 99.99,
      category: 'Frozen',
      image: null,
      inStock: true,
      unit: 'pack'
    },
    {
      id: 'prod_007',
      name: 'Coca-Cola 2L',
      description: 'Classic Coca-Cola',
      price: 24.99,
      category: 'Beverages',
      image: null,
      inStock: true,
      unit: 'bottle'
    },
    {
      id: 'prod_008',
      name: 'Potato Chips 150g',
      description: 'Salted potato chips',
      price: 16.99,
      category: 'Snacks',
      image: null,
      inStock: true,
      unit: 'pack'
    },
    {
      id: 'prod_009',
      name: 'Tomatoes 1kg',
      description: 'Fresh red tomatoes',
      price: 24.99,
      category: 'Fresh Produce',
      image: null,
      inStock: true,
      unit: 'kg'
    },
    {
      id: 'prod_010',
      name: 'Eggs 30 pack',
      description: 'Large fresh eggs',
      price: 68.99,
      category: 'Dairy',
      image: null,
      inStock: true,
      unit: 'pack'
    }
  ]
}
