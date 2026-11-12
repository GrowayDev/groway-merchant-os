import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

/**
 * POST /api/products/bulk
 * Bulk operations on products
 * 
 * Action types:
 * - create: Bulk create products (for import)
 * - update: Bulk update products
 * - stock: Bulk update stock levels
 * - delete: Bulk soft delete products
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, merchantId, branchId, products, performedBy, performedByName } = body;

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: 'action is required (create, update, stock, delete)' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'create':
        return await bulkCreateProducts(merchantId, branchId, products, performedBy, performedByName);
      case 'update':
        return await bulkUpdateProducts(merchantId, products);
      case 'stock':
        return await bulkUpdateStock(merchantId, branchId, products, performedBy, performedByName);
      case 'delete':
        return await bulkDeleteProducts(merchantId, products);
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: create, update, stock, or delete' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in bulk operation:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk operation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Bulk create products (for import)
 */
async function bulkCreateProducts(
  merchantId: string,
  branchId: string | undefined,
  products: Array<Record<string, unknown>>,
  performedBy?: string,
  performedByName?: string
) {
  if (!products || !Array.isArray(products) || products.length === 0) {
    return NextResponse.json(
      { error: 'products array is required for create action' },
      { status: 400 }
    );
  }

  const results = {
    created: 0,
    skipped: 0,
    errors: [] as Array<{ sku: string; error: string }>,
    createdProducts: [] as Array<{ id: string; sku: string; name: string }>,
  };

  // Get existing SKUs for this merchant
  const existingSkus = await db.product.findMany({
    where: { merchantId },
    select: { sku: true, barcode: true },
  });
  const skuSet = new Set(existingSkus.map(p => p.sku));
  const barcodeSet = new Set(existingSkus.map(p => p.barcode).filter(Boolean));

  // Process each product
  for (const product of products) {
    try {
      // Validate required fields
      if (!product.sku || !product.name) {
        results.skipped++;
        results.errors.push({
          sku: String(product.sku || 'unknown'),
          error: 'SKU and name are required',
        });
        continue;
      }

      // Check for duplicate SKU
      if (skuSet.has(product.sku as string)) {
        results.skipped++;
        results.errors.push({
          sku: product.sku as string,
          error: 'SKU already exists',
        });
        continue;
      }

      // Check for duplicate barcode if provided
      if (product.barcode && barcodeSet.has(product.barcode as string)) {
        results.skipped++;
        results.errors.push({
          sku: product.sku as string,
          error: 'Barcode already exists',
        });
        continue;
      }

      // Calculate margin
      const costPrice = (product.costPrice as number) || 0;
      const sellingPrice = (product.sellingPrice as number) || 0;
      const margin = sellingPrice > 0 
        ? ((sellingPrice - costPrice) / sellingPrice) * 100 
        : 0;

      // Create product
      const newProduct = await db.product.create({
        data: {
          merchantId,
          branchId: (product.branchId as string) || branchId || null,
          categoryId: product.categoryId as string || null,
          sku: product.sku as string,
          barcode: product.barcode as string || null,
          name: product.name as string,
          description: product.description as string || null,
          image: product.image as string || null,
          type: (product.type as string) || 'standard',
          unit: (product.unit as string) || 'each',
          costPrice,
          sellingPrice,
          compareAtPrice: product.compareAtPrice as number || null,
          margin,
          vatRate: product.vatRate as number || null,
          vatExempt: (product.vatExempt as boolean) || false,
          zeroRated: (product.zeroRated as boolean) || false,
          trackInventory: product.trackInventory !== false,
          currentStock: (product.currentStock as number) || 0,
          lowStockThreshold: (product.lowStockThreshold as number) || 10,
          reorderPoint: (product.reorderPoint as number) || 5,
          reorderQuantity: (product.reorderQuantity as number) || 10,
          isActive: product.isActive !== false,
        },
      });

      // Add to sets to prevent duplicates in same batch
      skuSet.add(product.sku as string);
      if (product.barcode) {
        barcodeSet.add(product.barcode as string);
      }

      // Create stock movement if initial stock
      if (product.currentStock && (product.currentStock as number) > 0) {
        const productBranchId = (product.branchId as string) || branchId;
        if (productBranchId) {
          await db.stockMovement.create({
            data: {
              merchantId,
              branchId: productBranchId,
              productId: newProduct.id,
              type: 'purchase',
              quantity: product.currentStock as number,
              previousStock: 0,
              newStock: product.currentStock as number,
              unitCost: costPrice,
              totalValue: (product.currentStock as number) * costPrice,
              referenceType: 'manual',
              reason: 'Bulk import - Initial stock',
              performedBy,
              performedByName,
            },
          });
        }
      }

      results.created++;
      results.createdProducts.push({
        id: newProduct.id,
        sku: newProduct.sku,
        name: newProduct.name,
      });
    } catch (err) {
      results.skipped++;
      results.errors.push({
        sku: String(product.sku || 'unknown'),
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return NextResponse.json({
    success: true,
    message: `Bulk create completed: ${results.created} created, ${results.skipped} skipped`,
    data: results,
  }, { status: 201 });
}

/**
 * Bulk update products
 */
async function bulkUpdateProducts(
  merchantId: string,
  products: Array<{ id: string; data: Record<string, unknown> }>
) {
  if (!products || !Array.isArray(products) || products.length === 0) {
    return NextResponse.json(
      { error: 'products array with id and data is required for update action' },
      { status: 400 }
    );
  }

  const results = {
    updated: 0,
    failed: 0,
    errors: [] as Array<{ id: string; error: string }>,
  };

  for (const item of products) {
    try {
      if (!item.id || !item.data) {
        results.failed++;
        results.errors.push({
          id: item.id || 'unknown',
          error: 'Product ID and data are required',
        });
        continue;
      }

      // Verify product belongs to merchant
      const existingProduct = await db.product.findFirst({
        where: {
          id: item.id,
          merchantId,
        },
      });

      if (!existingProduct) {
        results.failed++;
        results.errors.push({
          id: item.id,
          error: 'Product not found or does not belong to merchant',
        });
        continue;
      }

      // Calculate margin if pricing changed
      const costPrice = item.data.costPrice !== undefined 
        ? item.data.costPrice as number 
        : existingProduct.costPrice;
      const sellingPrice = item.data.sellingPrice !== undefined 
        ? item.data.sellingPrice as number 
        : existingProduct.sellingPrice;
      const margin = sellingPrice > 0 
        ? ((sellingPrice - costPrice) / sellingPrice) * 100 
        : 0;

      // Build update data
      const updateData: Record<string, unknown> = {
        ...item.data,
        updatedAt: new Date(),
      };

      if (item.data.costPrice !== undefined || item.data.sellingPrice !== undefined) {
        updateData.margin = margin;
      }

      // Update product
      await db.product.update({
        where: { id: item.id },
        data: updateData,
      });

      results.updated++;
    } catch (err) {
      results.failed++;
      results.errors.push({
        id: item.id || 'unknown',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return NextResponse.json({
    success: true,
    message: `Bulk update completed: ${results.updated} updated, ${results.failed} failed`,
    data: results,
  });
}

/**
 * Bulk update stock levels
 */
async function bulkUpdateStock(
  merchantId: string,
  branchId: string | undefined,
  items: Array<{
    productId: string;
    sku?: string;
    quantity: number;
    type?: string;
    reason?: string;
    notes?: string;
  }>,
  performedBy?: string,
  performedByName?: string
) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: 'items array is required for stock action' },
      { status: 400 }
    );
  }

  if (!branchId) {
    return NextResponse.json(
      { error: 'branchId is required for stock updates' },
      { status: 400 }
    );
  }

  const results = {
    updated: 0,
    failed: 0,
    errors: [] as Array<{ productId: string; error: string }>,
    movements: [] as Array<{ productId: string; previousStock: number; newStock: number }>,
  };

  // Use transaction for atomicity
  try {
    await db.$transaction(async (tx) => {
      for (const item of items) {
        try {
          // Find product by ID or SKU
          let product;
          if (item.productId) {
            product = await tx.product.findFirst({
              where: {
                id: item.productId,
                merchantId,
              },
            });
          } else if (item.sku) {
            product = await tx.product.findFirst({
              where: {
                sku: item.sku,
                merchantId,
              },
            });
          }

          if (!product) {
            results.failed++;
            results.errors.push({
              productId: item.productId || item.sku || 'unknown',
              error: 'Product not found',
            });
            return;
          }

          const previousStock = product.currentStock;
          const movementType = item.type || 'adjustment';
          let newStock: number;

          // Calculate new stock based on movement type
          if (['purchase', 'transfer_in', 'return'].includes(movementType)) {
            newStock = previousStock + Math.abs(item.quantity);
          } else if (['sale', 'transfer_out', 'waste'].includes(movementType)) {
            newStock = previousStock - Math.abs(item.quantity);
          } else {
            // adjustment - can be positive or negative
            newStock = previousStock + item.quantity;
          }

          // Ensure stock doesn't go negative
          if (newStock < 0) {
            results.failed++;
            results.errors.push({
              productId: product.id,
              error: 'Insufficient stock for this operation',
            });
            return;
          }

          // Update product stock
          await tx.product.update({
            where: { id: product.id },
            data: {
              currentStock: newStock,
              updatedAt: new Date(),
            },
          });

          // Create stock movement record
          await tx.stockMovement.create({
            data: {
              merchantId,
              branchId,
              productId: product.id,
              type: movementType,
              quantity: item.quantity,
              previousStock,
              newStock,
              unitCost: product.costPrice,
              totalValue: Math.abs(item.quantity) * product.costPrice,
              referenceType: 'manual',
              reason: item.reason || 'Bulk stock adjustment',
              notes: item.notes,
              performedBy,
              performedByName,
            },
          });

          results.updated++;
          results.movements.push({
            productId: product.id,
            previousStock,
            newStock,
          });
        } catch (err) {
          results.failed++;
          results.errors.push({
            productId: item.productId || item.sku || 'unknown',
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }
    });
  } catch (txError) {
    console.error('Transaction error:', txError);
    return NextResponse.json(
      { error: 'Transaction failed, all changes rolled back', details: txError instanceof Error ? txError.message : 'Unknown error' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `Stock update completed: ${results.updated} updated, ${results.failed} failed`,
    data: results,
  });
}

/**
 * Bulk soft delete products
 */
async function bulkDeleteProducts(
  merchantId: string,
  productIds: string[]
) {
  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    return NextResponse.json(
      { error: 'productIds array is required for delete action' },
      { status: 400 }
    );
  }

  const results = {
    deleted: 0,
    failed: 0,
    errors: [] as Array<{ id: string; error: string }>,
  };

  for (const productId of productIds) {
    try {
      // Verify product belongs to merchant
      const existingProduct = await db.product.findFirst({
        where: {
          id: productId,
          merchantId,
        },
      });

      if (!existingProduct) {
        results.failed++;
        results.errors.push({
          id: productId,
          error: 'Product not found or does not belong to merchant',
        });
        continue;
      }

      // Soft delete variants first
      await db.product.updateMany({
        where: {
          parentId: productId,
          merchantId,
        },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      // Soft delete the product
      await db.product.update({
        where: { id: productId },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      results.deleted++;
    } catch (err) {
      results.failed++;
      results.errors.push({
        id: productId,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return NextResponse.json({
    success: true,
    message: `Bulk delete completed: ${results.deleted} deleted, ${results.failed} failed`,
    data: results,
  });
}
