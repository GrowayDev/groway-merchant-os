/**
 * Recipe Inventory Service
 * 
 * Handles inventory integration for the Recipe Engine:
 * 1. Deduct ingredients from inventory when dishes are sold
 * 2. Use FIFO for ingredient batch selection
 * 3. Handle recipe-based COGS calculation
 * 4. Support composite/bundle products
 */

import { db } from '@/lib/db';
import { FIFOService } from './fifo-service';

// Types
export interface IngredientDeduction {
  ingredientId: string;
  ingredientName: string;
  sku: string;
  quantity: number;
  unit: string;
  cost: number;
  batches: Array<{
    batchId: string;
    batchNumber: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }>;
}

export interface RecipeDeductionResult {
  success: boolean;
  recipeId: string;
  recipeName: string;
  deductions: IngredientDeduction[];
  totalIngredientCost: number;
  transactionId?: string;
  error?: string;
}

export interface RecipeDeductionOptions {
  recipeId: string;
  merchantId: string;
  branchId: string;
  quantity: number; // Number of servings/yields
  referenceType: string; // 'sale', 'adjustment', etc.
  referenceId: string; // Transaction ID
  referenceNumber?: string; // Transaction number
  performedBy?: string;
  performedByName?: string;
  idempotencyKey: string;
}

export interface SaleInventoryOptions {
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    isRecipe?: boolean;
    recipeId?: string;
    isBundle?: boolean;
    bundleComponents?: Array<{
      productId: string;
      quantity: number;
    }>;
  }>;
  merchantId: string;
  branchId: string;
  transactionId: string;
  transactionNumber: string;
  performedBy?: string;
  performedByName?: string;
}

export interface ReturnOptions {
  originalTransactionId: string;
  items: Array<{
    productId: string;
    quantity: number;
    originalBatchId?: string;
  }>;
  merchantId: string;
  branchId: string;
  returnTransactionId: string;
  performedBy?: string;
  performedByName?: string;
}

/**
 * Recipe Inventory Service Class
 */
export class RecipeInventoryService {
  /**
   * Deduct ingredients for a recipe sale using FIFO
   */
  static async deductRecipeIngredients(
    options: RecipeDeductionOptions
  ): Promise<RecipeDeductionResult> {
    const {
      recipeId,
      merchantId,
      branchId,
      quantity,
      referenceType,
      referenceId,
      referenceNumber,
      performedBy,
      performedByName,
      idempotencyKey,
    } = options;

    // Get recipe with ingredients
    const recipe = await db.recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (!recipe) {
      return {
        success: false,
        recipeId,
        recipeName: 'Unknown',
        deductions: [],
        totalIngredientCost: 0,
        error: 'Recipe not found',
      };
    }

    // Check for existing deduction (idempotency)
    const existingDeduction = await db.stockDeduction.findFirst({
      where: {
        recipeId,
        orderId: referenceId,
      },
    });

    if (existingDeduction) {
      // Already processed, return success
      return {
        success: true,
        recipeId,
        recipeName: recipe.name,
        deductions: [],
        totalIngredientCost: 0,
        transactionId: existingDeduction.id,
      };
    }

    const deductions: IngredientDeduction[] = [];
    let totalCost = 0;

    // Process each ingredient
    await db.$transaction(async (tx) => {
      for (const recipeIngredient of recipe.ingredients) {
        const ingredient = recipeIngredient.ingredient;
        const requiredQty = recipeIngredient.quantity * quantity; // Scale by number of servings

        // Find product by SKU (ingredients are linked to products via SKU)
        const product = await tx.product.findFirst({
          where: {
            sku: ingredient.sku,
            merchantId,
          },
        });

        if (!product) {
          // If no product found, skip (ingredient might not be tracked)
          continue;
        }

        // Get FIFO batches for this ingredient
        const batches = await FIFOService.getAvailableBatches(
          product.id,
          branchId,
          merchantId
        );

        const totalAvailable = batches.reduce((sum, b) => sum + b.availableQty, 0);

        if (totalAvailable < requiredQty) {
          throw new Error(
            `Insufficient stock for ${ingredient.name}. Required: ${requiredQty}, Available: ${totalAvailable}`
          );
        }

        // Deduct from batches using FIFO
        const ingredientDeduction: IngredientDeduction = {
          ingredientId: ingredient.id,
          ingredientName: ingredient.name,
          sku: ingredient.sku,
          quantity: requiredQty,
          unit: recipeIngredient.unit,
          cost: 0,
          batches: [],
        };

        let remaining = requiredQty;
        const previousStock = product.currentStock;
        let newStock = previousStock;

        for (const batch of batches) {
          if (remaining <= 0) break;

          const consumeQty = Math.min(batch.availableQty, remaining);
          const batchCost = consumeQty * batch.unitCost;

          // Create stock movement
          await tx.stockMovement.create({
            data: {
              merchantId,
              branchId,
              productId: product.id,
              batchId: batch.id,
              idempotencyKey: `${idempotencyKey}-${batch.id}`,
              type: 'recipe',
              direction: 'out',
              quantity: consumeQty,
              previousStock: newStock,
              newStock: newStock - consumeQty,
              unitCost: batch.unitCost,
              totalCost: batchCost,
              referenceType,
              referenceId,
              referenceNumber,
              reason: `Recipe: ${recipe.name} (x${quantity})`,
              performedBy,
              performedByName,
            },
          });

          // Update batch
          const updatedBatchQty = batch.currentQty - consumeQty;
          await tx.inventoryBatch.update({
            where: { id: batch.id },
            data: {
              currentQty: updatedBatchQty,
              availableQty: updatedBatchQty,
              status: updatedBatchQty <= 0 ? 'depleted' : 'active',
            },
          });

          // Create batch transaction
          await tx.batchTransaction.create({
            data: {
              batchId: batch.id,
              type: 'sold',
              quantity: -consumeQty,
              balanceAfter: updatedBatchQty,
              unitCost: batch.unitCost,
              totalCost: batchCost,
              referenceType,
              referenceId,
              referenceNumber,
              performedBy,
              performedByName,
              notes: `Recipe: ${recipe.name}`,
            },
          });

          ingredientDeduction.batches.push({
            batchId: batch.id,
            batchNumber: batch.batchNumber,
            quantity: consumeQty,
            unitCost: batch.unitCost,
            totalCost: batchCost,
          });

          ingredientDeduction.cost += batchCost;
          remaining -= consumeQty;
          newStock -= consumeQty;
        }

        // Update product stock
        await tx.product.update({
          where: { id: product.id },
          data: {
            currentStock: newStock,
            updatedAt: new Date(),
          },
        });

        // Create stock deduction record
        await tx.stockDeduction.create({
          data: {
            recipeId,
            orderId: referenceId,
            ingredientId: ingredient.id,
            quantity: requiredQty,
            unit: recipeIngredient.unit,
            cost: ingredientDeduction.cost,
          },
        });

        deductions.push(ingredientDeduction);
        totalCost += ingredientDeduction.cost;
      }

      // Update recipe stats
      await tx.recipe.update({
        where: { id: recipeId },
        data: {
          timesSold: { increment: quantity },
          deductionsLast30Days: { increment: totalCost },
        },
      });
    });

    return {
      success: true,
      recipeId,
      recipeName: recipe.name,
      deductions,
      totalIngredientCost: totalCost,
    };
  }

  /**
   * Process inventory deduction for a POS sale
   * Handles both simple products and recipe-based items
   */
  static async processSaleInventory(
    options: SaleInventoryOptions
  ): Promise<{
    success: boolean;
    results: Array<{
      productId: string;
      quantity: number;
      cost: number;
      type: 'simple' | 'recipe' | 'bundle';
    }>;
    totalCOGS: number;
    error?: string;
  }> {
    const {
      items,
      merchantId,
      branchId,
      transactionId,
      transactionNumber,
      performedBy,
      performedByName,
    } = options;

    const results: Array<{
      productId: string;
      quantity: number;
      cost: number;
      type: 'simple' | 'recipe' | 'bundle';
    }> = [];
    let totalCOGS = 0;

    try {
      await db.$transaction(async (tx) => {
        for (const item of items) {
          // Handle recipe-based items
          if (item.isRecipe && item.recipeId) {
            const recipeResult = await this.deductRecipeIngredients({
              recipeId: item.recipeId,
              merchantId,
              branchId,
              quantity: item.quantity,
              referenceType: 'sale',
              referenceId: transactionId,
              referenceNumber: transactionNumber,
              performedBy,
              performedByName,
              idempotencyKey: `sale-${transactionId}-recipe-${item.recipeId}`,
            });

            if (!recipeResult.success) {
              throw new Error(recipeResult.error || 'Recipe deduction failed');
            }

            results.push({
              productId: item.productId,
              quantity: item.quantity,
              cost: recipeResult.totalIngredientCost,
              type: 'recipe',
            });

            totalCOGS += recipeResult.totalIngredientCost;
            continue;
          }

          // Handle bundle products
          if (item.isBundle && item.bundleComponents) {
            let bundleCost = 0;

            for (const component of item.bundleComponents) {
              const product = await tx.product.findUnique({
                where: { id: component.productId },
              });

              if (!product || !product.trackInventory) {
                continue;
              }

              const componentQty = component.quantity * item.quantity;
              const fifoResult = await FIFOService.consumeFIFO({
                productId: component.productId,
                branchId,
                merchantId,
                quantity: componentQty,
                type: 'sale',
                referenceType: 'bundle_sale',
                referenceId: transactionId,
                referenceNumber: transactionNumber,
                performedBy,
                performedByName,
                idempotencyKey: `sale-${transactionId}-bundle-${item.productId}-comp-${component.productId}`,
              });

              if (!fifoResult.success) {
                throw new Error(fifoResult.error || 'Bundle component deduction failed');
              }

              bundleCost += fifoResult.totalCost;
            }

            results.push({
              productId: item.productId,
              quantity: item.quantity,
              cost: bundleCost,
              type: 'bundle',
            });

            totalCOGS += bundleCost;
            continue;
          }

          // Handle simple products
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product || !product.trackInventory) {
            // Product doesn't track inventory, skip
            results.push({
              productId: item.productId,
              quantity: item.quantity,
              cost: 0,
              type: 'simple',
            });
            continue;
          }

          const fifoResult = await FIFOService.consumeFIFO({
            productId: item.productId,
            branchId,
            merchantId,
            quantity: item.quantity,
            type: 'sale',
            referenceType: 'sale',
            referenceId: transactionId,
            referenceNumber: transactionNumber,
            performedBy,
            performedByName,
            idempotencyKey: `sale-${transactionId}-product-${item.productId}`,
          });

          if (!fifoResult.success) {
            throw new Error(fifoResult.error || 'Product deduction failed');
          }

          results.push({
            productId: item.productId,
            quantity: item.quantity,
            cost: fifoResult.totalCost,
            type: 'simple',
          });

          totalCOGS += fifoResult.totalCost;
        }
      });

      return {
        success: true,
        results,
        totalCOGS,
      };
    } catch (error) {
      return {
        success: false,
        results: [],
        totalCOGS: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle customer return with batch restoration
   */
  static async processReturn(options: ReturnOptions): Promise<{
    success: boolean;
    restorations: Array<{
      productId: string;
      quantity: number;
      batchId?: string;
      cost: number;
    }>;
    error?: string;
  }> {
    const {
      originalTransactionId,
      items,
      merchantId,
      branchId,
      returnTransactionId,
      performedBy,
      performedByName,
    } = options;

    const restorations: Array<{
      productId: string;
      quantity: number;
      batchId?: string;
      cost: number;
    }> = [];

    try {
      await db.$transaction(async (tx) => {
        for (const item of items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            continue;
          }

          // Try to find the original batch this was sold from
          const originalMovement = await tx.stockMovement.findFirst({
            where: {
              productId: item.productId,
              referenceId: originalTransactionId,
              type: 'sale',
              direction: 'out',
            },
            orderBy: { createdAt: 'desc' },
          });

          const previousStock = product.currentStock;
          const newStock = previousStock + item.quantity;
          const unitCost = originalMovement?.unitCost || product.costPrice;
          const batchId = item.originalBatchId || originalMovement?.batchId;

          // Create return movement
          await tx.stockMovement.create({
            data: {
              merchantId,
              branchId,
              productId: item.productId,
              batchId,
              idempotencyKey: `return-${returnTransactionId}-${item.productId}`,
              type: 'return',
              direction: 'in',
              quantity: item.quantity,
              previousStock,
              newStock,
              unitCost,
              totalCost: item.quantity * unitCost,
              referenceType: 'return',
              referenceId: returnTransactionId,
              reason: 'Customer return',
              performedBy,
              performedByName,
            },
          });

          // Restore batch if found
          if (batchId) {
            await tx.inventoryBatch.update({
              where: { id: batchId },
              data: {
                currentQty: { increment: item.quantity },
                availableQty: { increment: item.quantity },
                status: 'active', // Reactivate if was depleted
              },
            });

            // Create batch transaction
            await tx.batchTransaction.create({
              data: {
                batchId,
                type: 'adjusted', // 'returned' would be better but we use what's available
                quantity: item.quantity,
                balanceAfter: 0, // Will be updated
                unitCost,
                totalCost: item.quantity * unitCost,
                referenceType: 'return',
                referenceId: returnTransactionId,
                performedBy,
                performedByName,
                notes: 'Customer return',
              },
            });
          }

          // Update product stock
          await tx.product.update({
            where: { id: item.productId },
            data: {
              currentStock: newStock,
              updatedAt: new Date(),
            },
          });

          restorations.push({
            productId: item.productId,
            quantity: item.quantity,
            batchId,
            cost: item.quantity * unitCost,
          });
        }
      });

      return {
        success: true,
        restorations,
      };
    } catch (error) {
      return {
        success: false,
        restorations: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get recipe COGS based on current ingredient costs
   */
  static async getRecipeCOGS(
    recipeId: string,
    merchantId: string,
    branchId: string
  ): Promise<{
    recipeId: string;
    recipeName: string;
    ingredientCosts: Array<{
      ingredientId: string;
      name: string;
      quantity: number;
      unit: string;
      unitCost: number;
      totalCost: number;
    }>;
    totalCost: number;
    margin: number;
    sellingPrice: number;
  }> {
    const recipe = await db.recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (!recipe) {
      throw new Error('Recipe not found');
    }

    const ingredientCosts = [];

    for (const recipeIngredient of recipe.ingredients) {
      const ingredient = recipeIngredient.ingredient;

      // Find product by SKU
      const product = await db.product.findFirst({
        where: {
          sku: ingredient.sku,
          merchantId,
        },
      });

      let unitCost = ingredient.costPerUnit;

      // Get FIFO cost if product found
      if (product) {
        unitCost = await FIFOService.getFIFOCost(product.id, branchId, merchantId);
      }

      ingredientCosts.push({
        ingredientId: ingredient.id,
        name: ingredient.name,
        quantity: recipeIngredient.quantity,
        unit: recipeIngredient.unit,
        unitCost,
        totalCost: recipeIngredient.quantity * unitCost,
      });
    }

    const totalCost = ingredientCosts.reduce((sum, i) => sum + i.totalCost, 0);
    const margin = recipe.sellingPrice > 0 
      ? ((recipe.sellingPrice - totalCost) / recipe.sellingPrice) * 100 
      : 0;

    return {
      recipeId,
      recipeName: recipe.name,
      ingredientCosts,
      totalCost,
      margin,
      sellingPrice: recipe.sellingPrice,
    };
  }
}

export default RecipeInventoryService;
