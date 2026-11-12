import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/permissions'
import { FIFOService } from '@/services/inventory/fifo-service'

/**
 * POST /api/inventory/sale
 * Process inventory deduction for a POS sale
 * 
 * Handles:
 * - Simple products (direct FIFO deduction)
 * - Recipe-based items (ingredient deduction)
 * - Bundle products (component deduction)
 * 
 * Body:
 * - items: Array of sale items
 * - merchantId: required
 * - branchId: required
 * - transactionId: required
 * - transactionNumber: required
 */
export async function POST(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_process_sales')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  const session = permissionCheck.session!

  try {
    const body = await request.json()
    const {
      items,
      merchantId,
      branchId,
      transactionId,
      transactionNumber,
    } = body

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required' },
        { status: 400 }
      )
    }

    if (!merchantId || !branchId || !transactionId) {
      return NextResponse.json(
        { error: 'Missing required fields: merchantId, branchId, transactionId' },
        { status: 400 }
      )
    }

    // Check if already processed (idempotency)
    const existingMovements = await db.stockMovement.findFirst({
      where: {
        referenceId: transactionId,
        referenceType: 'sale',
      },
    })

    if (existingMovements) {
      // Already processed, return success
      return NextResponse.json({
        success: true,
        message: 'Sale already processed',
        data: {
          transactionId,
          alreadyProcessed: true,
        },
      })
    }

    const results = []
    let totalCOGS = 0

    // Process each item in transaction
    await db.$transaction(async (tx) => {
      for (const item of items) {
        const quantity = parseFloat(item.quantity) || 1
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        })

        if (!product || !product.trackInventory) {
          // Product doesn't track inventory, skip
          results.push({
            productId: item.productId,
            quantity,
            cost: 0,
            type: 'non_tracked',
          })
          continue
        }

        // Handle recipe-based items
        if (item.isRecipe && item.recipeId) {
          const recipeResult = await processRecipeDeduction(tx, {
            recipeId: item.recipeId,
            merchantId,
            branchId,
            quantity,
            referenceId: transactionId,
            referenceNumber: transactionNumber || `TX-${transactionId}`,
            performedBy: session.userId,
            performedByName: session.user?.name || 'System',
          })

          if (!recipeResult.success) {
            throw new Error(recipeResult.error || 'Recipe deduction failed')
          }

          results.push({
            productId: item.productId,
            quantity,
            cost: recipeResult.totalCost,
            type: 'recipe',
          })
          totalCOGS += recipeResult.totalCost
          continue
        }

        // Handle bundle products
        if (item.isBundle && item.bundleComponents) {
          let bundleCost = 0

          for (const component of item.bundleComponents) {
            const componentQty = parseFloat(component.quantity) * quantity
            const fifoResult = await FIFOService.consumeFIFO({
              productId: component.productId,
              branchId,
              merchantId,
              quantity: componentQty,
              type: 'sale',
              referenceType: 'bundle_sale',
              referenceId: transactionId,
              referenceNumber: transactionNumber || `TX-${transactionId}`,
              performedBy: session.userId,
              performedByName: session.user?.name || 'System',
              idempotencyKey: `sale-${transactionId}-bundle-${item.productId}-${component.productId}`,
            })

            if (!fifoResult.success) {
              throw new Error(fifoResult.error || 'Bundle component deduction failed')
            }

            bundleCost += fifoResult.totalCost
          }

          results.push({
            productId: item.productId,
            quantity,
            cost: bundleCost,
            type: 'bundle',
          })
          totalCOGS += bundleCost
          continue
        }

        // Handle simple products with FIFO
        const fifoResult = await FIFOService.consumeFIFO({
          productId: item.productId,
          branchId,
          merchantId,
          quantity,
          type: 'sale',
          referenceType: 'sale',
          referenceId: transactionId,
          referenceNumber: transactionNumber || `TX-${transactionId}`,
          performedBy: session.userId,
          performedByName: session.user?.name || 'System',
          idempotencyKey: `sale-${transactionId}-${item.productId}`,
        })

        if (!fifoResult.success) {
          throw new Error(fifoResult.error || 'Product deduction failed')
        }

        results.push({
          productId: item.productId,
          quantity,
          cost: fifoResult.totalCost,
          type: 'simple',
        })
        totalCOGS += fifoResult.totalCost
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Inventory updated successfully',
      data: {
        transactionId,
        results,
        totalCOGS,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Process sale inventory error:', error)
    return NextResponse.json(
      { error: 'Failed to process sale inventory', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/inventory/sale
 * Get inventory impact preview for a sale
 */
export async function GET(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_view_inventory')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  try {
    const { searchParams } = new URL(request.url)
    const itemsJson = searchParams.get('items')
    const merchantId = searchParams.get('merchantId')
    const branchId = searchParams.get('branchId')

    if (!itemsJson || !merchantId || !branchId) {
      return NextResponse.json(
        { error: 'Missing required params: items, merchantId, branchId' },
        { status: 400 }
      )
    }

    const items = JSON.parse(itemsJson)
    const preview = []

    for (const item of items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
        select: {
          id: true,
          name: true,
          sku: true,
          currentStock: true,
          costPrice: true,
          sellingPrice: true,
          trackInventory: true,
        },
      })

      if (!product) {
        preview.push({
          productId: item.productId,
          error: 'Product not found',
        })
        continue
      }

      const quantity = parseFloat(item.quantity) || 1

      if (product.trackInventory) {
        preview.push({
          productId: product.id,
          name: product.name,
          sku: product.sku,
          currentStock: product.currentStock,
          quantityToDeduct: quantity,
          stockAfterSale: product.currentStock - quantity,
          sufficient: product.currentStock >= quantity,
          estimatedCOGS: quantity * product.costPrice,
          type: item.isRecipe ? 'recipe' : item.isBundle ? 'bundle' : 'simple',
        })
      } else {
        preview.push({
          productId: product.id,
          name: product.name,
          sku: product.sku,
          trackInventory: false,
          quantity: quantity,
          type: item.isRecipe ? 'recipe' : item.isBundle ? 'bundle' : 'simple',
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: preview,
    })
  } catch (error) {
    console.error('Preview sale inventory error:', error)
    return NextResponse.json(
      { error: 'Failed to preview sale inventory', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Helper function to process recipe deduction
 */
async function processRecipeDeduction(
  tx: any,
  options: {
    recipeId: string
    merchantId: string
    branchId: string
    quantity: number
    referenceId: string
    referenceNumber: string
    performedBy: string
    performedByName: string
  }
): Promise<{ success: boolean; totalCost: number; error?: string }> {
  const { recipeId, merchantId, branchId, quantity, referenceId, referenceNumber, performedBy, performedByName } = options

  // Get recipe with ingredients
  const recipe = await tx.recipe.findUnique({
    where: { id: recipeId },
    include: {
      ingredients: {
        include: {
          ingredient: true,
        },
      },
    },
  })

  if (!recipe) {
    return { success: false, totalCost: 0, error: 'Recipe not found' }
  }

  let totalCost = 0
  const idempotencyBase = `recipe-${recipeId}-${referenceId}`

  for (const recipeIngredient of recipe.ingredients) {
    const ingredient = recipeIngredient.ingredient
    const requiredQty = recipeIngredient.quantity * quantity

    // Find product by SKU
    const product = await tx.product.findFirst({
      where: {
        sku: ingredient.sku,
        merchantId,
      },
    })

    if (!product || !product.trackInventory) {
      continue
    }

    // Get available batches using FIFO
    const batches = await FIFOService.getAvailableBatches(product.id, branchId, merchantId)
    const totalAvailable = batches.reduce((sum, b) => sum + b.availableQty, 0)

    if (totalAvailable < requiredQty) {
      return {
        success: false,
        totalCost: 0,
        error: `Insufficient stock for ${ingredient.name}. Required: ${requiredQty}, Available: ${totalAvailable}`,
      }
    }

    let remaining = requiredQty
    let previousStock = product.currentStock
    let newStock = previousStock

    for (const batch of batches) {
      if (remaining <= 0) break

      const consumeQty = Math.min(batch.availableQty, remaining)
      const batchCost = consumeQty * batch.unitCost

      // Create stock movement
      await tx.stockMovement.create({
        data: {
          merchantId,
          branchId,
          productId: product.id,
          batchId: batch.id,
          idempotencyKey: `${idempotencyBase}-${batch.id}`,
          type: 'recipe',
          direction: 'out',
          quantity: consumeQty,
          previousStock,
          newStock: newStock - consumeQty,
          unitCost: batch.unitCost,
          totalCost: batchCost,
          referenceType: 'sale',
          referenceId,
          referenceNumber,
          reason: `Recipe: ${recipe.name}`,
          performedBy,
          performedByName,
        },
      })

      // Update batch
      const newBatchQty = batch.currentQty - consumeQty
      await tx.inventoryBatch.update({
        where: { id: batch.id },
        data: {
          currentQty: newBatchQty,
          availableQty: newBatchQty,
          status: newBatchQty <= 0 ? 'depleted' : 'active',
        },
      })

      // Create batch transaction
      await tx.batchTransaction.create({
        data: {
          batchId: batch.id,
          type: 'sold',
          quantity: -consumeQty,
          balanceAfter: newBatchQty,
          unitCost: batch.unitCost,
          totalCost: batchCost,
          referenceType: 'sale',
          referenceId,
          referenceNumber,
          performedBy,
          performedByName,
          notes: `Recipe: ${recipe.name}`,
        },
      })

      totalCost += batchCost
      remaining -= consumeQty
      newStock -= consumeQty
      previousStock = newStock
    }

    // Update product stock
    await tx.product.update({
      where: { id: product.id },
      data: {
        currentStock: newStock,
        lastSoldAt: new Date(),
      },
    })

    // Create stock deduction record
    await tx.stockDeduction.create({
      data: {
        recipeId,
        orderId: referenceId,
        ingredientId: ingredient.id,
        quantity: requiredQty,
        unit: recipeIngredient.unit,
        cost: totalCost,
      },
    })
  }

  // Update recipe stats
  await tx.recipe.update({
    where: { id: recipeId },
    data: {
      timesSold: { increment: quantity },
      deductionsLast30Days: { increment: totalCost },
    },
  })

  return { success: true, totalCost }
}
