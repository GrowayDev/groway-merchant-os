import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: Search products by NAPPI code
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const nappiCode = searchParams.get('nappiCode')
    const search = searchParams.get('search')
    const genericName = searchParams.get('genericName')
    const schedule = searchParams.get('schedule')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build where clause
    const where: Record<string, unknown> = { isActive: true }

    if (nappiCode) {
      where.nappiCode = nappiCode
    }

    if (search) {
      where.OR = [
        { productName: { contains: search } },
        { genericName: { contains: search } },
        { nappiCode: { contains: search } }
      ]
    }

    if (genericName) {
      where.genericName = { contains: genericName }
    }

    if (schedule) {
      where.schedule = parseInt(schedule)
    }

    const products = await db.pharmacyNAPPIProduct.findMany({
      where,
      take: limit,
      orderBy: { productName: 'asc' }
    })

    // Calculate pricing
    const productsWithPricing = products.map(product => {
      const sellingPrice = product.sepPrice + product.dispensingFee
      const vatAmount = sellingPrice * (product.vatRate / 100)
      const totalWithVat = sellingPrice + vatAmount

      return {
        ...product,
        calculatedPricing: {
          sepPrice: product.sepPrice,
          dispensingFee: product.dispensingFee,
          subTotal: sellingPrice,
          vatRate: product.vatRate,
          vatAmount,
          totalWithVat
        }
      }
    })

    // Find alternatives for the searched product
    let alternatives: Array<{
      id: string;
      nappiCode: string;
      productName: string;
      genericName: string | null;
      sepPrice: number;
      savingPercentage: number;
    }> = []
    if (nappiCode && products.length > 0) {
      const mainProduct = products[0]
      if (mainProduct.genericName) {
        alternatives = await db.pharmacyNAPPIProduct.findMany({
          where: {
            genericName: mainProduct.genericName,
            nappiCode: { not: nappiCode },
            isActive: true
          },
          take: 5,
          orderBy: { sepPrice: 'asc' }
        }).then(alts => alts.map(alt => ({
          id: alt.id,
          nappiCode: alt.nappiCode,
          productName: alt.productName,
          genericName: alt.genericName,
          sepPrice: alt.sepPrice,
          savingPercentage: mainProduct.sepPrice > 0 
            ? Math.round(((mainProduct.sepPrice - alt.sepPrice) / mainProduct.sepPrice) * 100)
            : 0
        })))
      }
    }

    return NextResponse.json({
      success: true,
      data: productsWithPricing,
      alternatives,
      summary: {
        totalFound: products.length,
        searchCriteria: { nappiCode, search, genericName, schedule }
      },
      pricingInfo: {
        description: 'SEP = Single Exit Price (regulated by DoH)',
        dispensingFeeNote: 'Dispensing fee may vary by pharmacy',
        vatNote: 'VAT rate may vary based on product category'
      }
    })
  } catch (error) {
    console.error('Error searching NAPPI products:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search NAPPI products' },
      { status: 500 }
    )
  }
}

// POST: Add or update NAPPI product (for seeding/admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      nappiCode,
      productName,
      genericName,
      schedule,
      strength,
      packSize,
      unit,
      manufacturer,
      sepPrice,
      dispensingFee,
      vatRate
    } = body

    if (!nappiCode || !productName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: nappiCode, productName' },
        { status: 400 }
      )
    }

    // Validate NAPPI code format (7-10 digits)
    if (!/^\d{7,10}$/.test(nappiCode)) {
      return NextResponse.json(
        { success: false, error: 'Invalid NAPPI code format. Must be 7-10 digits' },
        { status: 400 }
      )
    }

    // Upsert product
    const product = await db.pharmacyNAPPIProduct.upsert({
      where: { nappiCode },
      create: {
        nappiCode,
        productName,
        genericName,
        schedule,
        strength,
        packSize,
        unit,
        manufacturer,
        sepPrice: sepPrice || 0,
        dispensingFee: dispensingFee || 0,
        vatRate: vatRate || 0,
        isActive: true
      },
      update: {
        productName,
        genericName,
        schedule,
        strength,
        packSize,
        unit,
        manufacturer,
        sepPrice,
        dispensingFee,
        vatRate,
        lastUpdated: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: product,
      message: 'NAPPI product saved successfully'
    })
  } catch (error) {
    console.error('Error saving NAPPI product:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save NAPPI product' },
      { status: 500 }
    )
  }
}

// PATCH: Bulk import NAPPI products
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { products } = body

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No products provided for import' },
        { status: 400 }
      )
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const product of products) {
      try {
        if (!product.nappiCode || !product.productName) {
          results.failed++
          results.errors.push(`Missing required fields for product: ${JSON.stringify(product)}`)
          continue
        }

        await db.pharmacyNAPPIProduct.upsert({
          where: { nappiCode: product.nappiCode },
          create: {
            nappiCode: product.nappiCode,
            productName: product.productName,
            genericName: product.genericName,
            schedule: product.schedule,
            strength: product.strength,
            packSize: product.packSize,
            unit: product.unit,
            manufacturer: product.manufacturer,
            sepPrice: product.sepPrice || 0,
            dispensingFee: product.dispensingFee || 0,
            vatRate: product.vatRate || 0,
            isActive: true
          },
          update: {
            productName: product.productName,
            genericName: product.genericName,
            schedule: product.schedule,
            strength: product.strength,
            packSize: product.packSize,
            unit: product.unit,
            manufacturer: product.manufacturer,
            sepPrice: product.sepPrice,
            dispensingFee: product.dispensingFee,
            vatRate: product.vatRate,
            lastUpdated: new Date()
          }
        })
        results.success++
      } catch {
        results.failed++
        results.errors.push(`Failed to import: ${product.nappiCode}`)
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: `Import complete: ${results.success} succeeded, ${results.failed} failed`
    })
  } catch (error) {
    console.error('Error bulk importing NAPPI products:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to bulk import NAPPI products' },
      { status: 500 }
    )
  }
}
