/**
 * Inventory Export API
 * 
 * Phase 11: Compliance & Reporting
 * Export inventory data in CSV format
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/inventory/export - Export inventory data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const type = searchParams.get('type') || 'products'

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId required' }, { status: 400 })
    }

    let csvContent = ''
    let filename = ''

    switch (type) {
      case 'products':
        csvContent = await exportProducts(merchantId)
        filename = `products-export-${new Date().toISOString().split('T')[0]}`
        break
      case 'movements':
        csvContent = await exportMovements(merchantId)
        filename = `movements-export-${new Date().toISOString().split('T')[0]}`
        break
      case 'valuation':
        csvContent = await exportValuation(merchantId)
        filename = `valuation-export-${new Date().toISOString().split('T')[0]}`
        break
      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
    }

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}

async function exportProducts(merchantId: string): Promise<string> {
  const products = await db.product.findMany({
    where: { merchantId },
    include: {
      category: { select: { name: true } },
      supplier: { select: { name: true } },
    },
    orderBy: { name: 'asc' },
  })

  const headers = [
    'SKU', 'Name', 'Category', 'Barcode', 'Current Stock', 'Reorder Point',
    'Reorder Qty', 'Min Stock', 'Max Stock', 'Unit', 'Cost Price', 'Selling Price',
    'Supplier', 'Location', 'Batch Tracked', 'Last Updated',
  ]

  const rows = products.map(p => [
    p.sku,
    `"${p.name.replace(/"/g, '""')}"`,
    p.category?.name || '',
    p.barcode || '',
    p.currentStock,
    p.reorderPoint,
    p.reorderQuantity,
    p.minStock,
    p.maxStock || '',
    p.unit,
    p.costPrice || 0,
    p.sellingPrice,
    p.supplier?.name || '',
    p.location || '',
    p.trackInventory ? 'Yes' : 'No',
    p.updatedAt?.toISOString().split('T')[0] || '',
  ])

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}

async function exportMovements(merchantId: string): Promise<string> {
  const movements = await db.stockMovement.findMany({
    where: { merchantId },
    include: {
      product: { select: { name: true, sku: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 5000,
  })

  const headers = [
    'Date', 'Time', 'Type', 'Direction', 'SKU', 'Product',
    'Quantity', 'Previous Stock', 'New Stock', 'Unit Cost',
    'Total Value', 'Reason', 'Notes', 'User',
  ]

  const rows = movements.map(m => [
    m.createdAt.toISOString().split('T')[0],
    m.createdAt.toISOString().split('T')[1].split('.')[0],
    m.type,
    m.quantity >= 0 ? 'IN' : 'OUT',
    m.product?.sku || '',
    `"${(m.product?.name || '').replace(/"/g, '""')}"`,
    Math.abs(m.quantity),
    m.previousStock || '',
    m.newStock || '',
    m.unitCost || 0,
    m.totalValue || 0,
    m.reason || '',
    m.notes || '',
    m.performedByName || '',
  ])

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}

async function exportValuation(merchantId: string): Promise<string> {
  const products = await db.product.findMany({
    where: { merchantId, trackInventory: true },
    include: { category: { select: { name: true } } },
    orderBy: { name: 'asc' },
  })

  const headers = [
    'SKU', 'Product', 'Category', 'Current Stock', 'Unit',
    'Cost Price', 'Selling Price', 'Stock Value (Cost)', 'Stock Value (Retail)',
    'Potential Profit', 'Margin %',
  ]

  const rows = products.map(p => {
    const costValue = p.currentStock * (p.costPrice || 0)
    const retailValue = p.currentStock * p.sellingPrice
    const profit = retailValue - costValue
    const margin = retailValue > 0 ? ((retailValue - costValue) / retailValue * 100).toFixed(1) : '0'

    return [
      p.sku,
      `"${p.name.replace(/"/g, '""')}"`,
      p.category?.name || '',
      p.currentStock,
      p.unit,
      p.costPrice || 0,
      p.sellingPrice,
      costValue.toFixed(2),
      retailValue.toFixed(2),
      profit.toFixed(2),
      margin,
    ]
  })

  // Add totals row
  const totalCost = products.reduce((sum, p) => sum + p.currentStock * (p.costPrice || 0), 0)
  const totalRetail = products.reduce((sum, p) => sum + p.currentStock * p.sellingPrice, 0)

  rows.push(['', 'TOTAL', '', '', '', '', '', totalCost.toFixed(2), totalRetail.toFixed(2), (totalRetail - totalCost).toFixed(2), ''])

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}
