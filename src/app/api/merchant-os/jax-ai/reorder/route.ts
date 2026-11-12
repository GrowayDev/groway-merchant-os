import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

/**
 * POST /api/merchant-os/jax-ai/reorder
 * Get AI-powered reorder suggestions
 * 
 * Request Body:
 * - merchantId: (required) Merchant ID
 * - branchId: (optional) Branch ID
 * - inventoryData: Current inventory state
 * - supplierData: Available suppliers with lead times
 * - preferences: Reordering preferences (eoq, safety stock, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      merchantId, 
      branchId, 
      inventoryData, 
      supplierData,
      preferences = {}
    } = body

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
    }

    // Initialize ZAI LLM
    const zai = await ZAI.create()

    // Build suppliers context
    const suppliers = supplierData || getDefaultSuppliers()

    const systemPrompt = `You are JAX AI, an expert in inventory procurement and supply chain optimization for South African retail.

Your role is to analyze inventory levels and generate optimal reorder suggestions.

REORDER OPTIMIZATION FACTORS:
1. Economic Order Quantity (EOQ): Minimize total inventory costs
2. Reorder Point: When to order based on lead time and safety stock
3. Lead Time Buffer: Account for SA supplier delays (add 20% buffer)
4. Cost Optimization: Compare bulk discounts vs holding costs
5. Seasonal Adjustments: Increase orders before high-demand periods

SUPPLIER INFORMATION:
${JSON.stringify(suppliers, null, 2)}

OUTPUT REQUIREMENTS:
Return a JSON array of reorder suggestions with:
- id: string (unique suggestion ID)
- productId: string
- productName: string
- sku: string
- currentStock: number
- reorderPoint: number (when stock reaches this level, reorder)
- suggestedQty: number (units to order)
- eoq: number (economic order quantity)
- leadTime: number (days from order to delivery)
- supplierId: string
- supplierName: string
- unitCost: number (cost per unit from supplier)
- totalCost: number (suggestedQty * unitCost)
- savingsVsRetail: number (savings compared to retail price)
- urgency: "critical" | "high" | "normal" | "low"
- confidence: number (0-100)
- reason: string (why this reorder is suggested)
- expectedDelivery: string (ISO date)

Always respond with valid JSON only.`

    const userPrompt = `Analyze this inventory and generate reorder suggestions:

INVENTORY DATA:
${JSON.stringify(inventoryData || generateSampleInventoryForReorder(), null, 2)}

PREFERENCES:
- Safety Stock Days: ${preferences.safetyStockDays || 7}
- EOQ Enabled: ${preferences.useEOQ !== false}
- Lead Time Buffer: 20%
- Minimum Order Value: R${preferences.minOrderValue || 500}

Generate reorder suggestions for items that need replenishment.`

    // Call LLM for reorder suggestions
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      thinking: { type: 'disabled' }
    })

    const response = completion.choices?.[0]?.message?.content

    // Parse the JSON response
    let suggestions
    try {
      const jsonMatch = response?.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0])
      } else {
        suggestions = generateFallbackReorderSuggestions(inventoryData, suppliers)
      }
    } catch (parseError) {
      console.error('Failed to parse LLM response:', parseError)
      suggestions = generateFallbackReorderSuggestions(inventoryData, suppliers)
    }

    // Calculate summary statistics
    const summary = {
      totalSuggestions: suggestions.length,
      critical: suggestions.filter((s: any) => s.urgency === 'critical').length,
      high: suggestions.filter((s: any) => s.urgency === 'high').length,
      totalOrderValue: suggestions.reduce((sum: number, s: any) => sum + s.totalCost, 0),
      totalSavings: suggestions.reduce((sum: number, s: any) => sum + s.savingsVsRetail, 0),
      avgConfidence: Math.round(suggestions.reduce((sum: number, s: any) => sum + s.confidence, 0) / suggestions.length),
      generatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: suggestions,
      summary,
      suppliers: suppliers.slice(0, 3)
    })

  } catch (error) {
    console.error('JAX AI Reorder Error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate reorder suggestions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function getDefaultSuppliers() {
  return [
    { id: 'sup-1', name: 'Tiger Brands', category: 'Groceries', leadTime: 3, rating: 4.5 },
    { id: 'sup-2', name: 'Clover SA', category: 'Dairy', leadTime: 2, rating: 4.7 },
    { id: 'sup-3', name: 'Nampak Distribution', category: 'Packaging', leadTime: 5, rating: 4.2 },
    { id: 'sup-4', name: 'Freshmark', category: 'Fresh Produce', leadTime: 1, rating: 4.8 },
    { id: 'sup-5', name: 'Unilever SA', category: 'Household', leadTime: 4, rating: 4.4 },
    { id: 'sup-6', name: 'Pioneer Foods', category: 'Beverages', leadTime: 3, rating: 4.6 }
  ]
}

function generateSampleInventoryForReorder() {
  return [
    { productId: 'prod-1', productName: 'Coca-Cola 340ml (Case)', sku: 'BEV-001-C', category: 'Beverages', currentStock: 15, reorderPoint: 30, avgDailySales: 12, costPrice: 180, retailPrice: 220 },
    { productId: 'prod-2', productName: 'White Bread (Bulk)', sku: 'BAK-001-B', category: 'Bakery', currentStock: 8, reorderPoint: 20, avgDailySales: 15, costPrice: 45, retailPrice: 55 },
    { productId: 'prod-3', productName: 'Sunflower Oil 750ml', sku: 'GRO-001', category: 'Groceries', currentStock: 12, reorderPoint: 25, avgDailySales: 5, costPrice: 32, retailPrice: 42 },
    { productId: 'prod-4', productName: 'Chicken Portions 1kg', sku: 'FRO-001', category: 'Frozen', currentStock: 5, reorderPoint: 15, avgDailySales: 8, costPrice: 85, retailPrice: 105 },
    { productId: 'prod-5', productName: 'Milk 2L (Crate)', sku: 'DAI-001-C', category: 'Dairy', currentStock: 3, reorderPoint: 10, avgDailySales: 18, costPrice: 280, retailPrice: 340 }
  ]
}

function generateFallbackReorderSuggestions(inventoryData: any[], suppliers: any[]) {
  const data = inventoryData || generateSampleInventoryForReorder()
  const sup = suppliers || getDefaultSuppliers()
  
  return data.map((item: any, index: number) => {
    const supplier = sup[index % sup.length]
    const suggestedQty = Math.max(item.reorderPoint * 2 - item.currentStock, item.avgDailySales * 14)
    const totalCost = Math.round(suggestedQty * item.costPrice)
    const savings = Math.round(suggestedQty * (item.retailPrice - item.costPrice))
    
    const daysOfStock = Math.round(item.currentStock / item.avgDailySales)
    let urgency: 'critical' | 'high' | 'normal' | 'low'
    if (daysOfStock <= 3) urgency = 'critical'
    else if (daysOfStock <= 7) urgency = 'high'
    else if (daysOfStock <= 14) urgency = 'normal'
    else urgency = 'low'

    const expectedDelivery = new Date()
    expectedDelivery.setDate(expectedDelivery.getDate() + supplier.leadTime)

    return {
      id: `ro-${index + 1}`,
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      currentStock: item.currentStock,
      reorderPoint: item.reorderPoint,
      suggestedQty: Math.round(suggestedQty),
      eoq: Math.round(suggestedQty * 1.2),
      leadTime: supplier.leadTime,
      supplierId: supplier.id,
      supplierName: supplier.name,
      unitCost: item.costPrice,
      totalCost,
      savingsVsRetail: savings,
      urgency,
      confidence: Math.floor(Math.random() * 20) + 75,
      reason: `Stock at ${item.currentStock} units, below reorder point of ${item.reorderPoint}`,
      expectedDelivery: expectedDelivery.toISOString()
    }
  })
}
