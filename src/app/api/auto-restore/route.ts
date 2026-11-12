import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Auto-restore endpoint - called on app startup
// This ensures data persists even when Turbopack cache clears

const REQUIRED_SUPPLIERS = 350
const REQUIRED_PRODUCTS = 400
const REQUIRED_WHOLESALERS = 8

export async function GET() {
  try {
    // Check current data counts
    const [supplierCount, productCount, wholesalerCount] = await Promise.all([
      db.supplier.count(),
      db.catalogProduct.count(),
      db.wholesaler.count()
    ])

    const needsRestore = 
      supplierCount < REQUIRED_SUPPLIERS || 
      productCount < REQUIRED_PRODUCTS ||
      wholesalerCount < REQUIRED_WHOLESALERS

    if (!needsRestore) {
      return NextResponse.json({
        status: 'healthy',
        suppliers: supplierCount,
        products: productCount,
        wholesalers: wholesalerCount
      })
    }

    // Auto-restore by redirecting to seed endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    // Trigger seed in background
    fetch(`${baseUrl}/api/seed-data?secret=groway-seed-2024&auto=true`).catch(() => {
      // Silent fail - we tried
    })

    return NextResponse.json({
      status: 'restoring',
      current: { suppliers: supplierCount, products: productCount, wholesalers: wholesalerCount },
      required: { suppliers: REQUIRED_SUPPLIERS, products: REQUIRED_PRODUCTS, wholesalers: REQUIRED_WHOLESALERS }
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
