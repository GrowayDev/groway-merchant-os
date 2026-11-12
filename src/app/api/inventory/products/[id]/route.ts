import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/inventory/products/[id]
 * Get a single product with full details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: true,
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        variants: {
          select: {
            id: true,
            sku: true,
            name: true,
            barcode: true,
            variantAttributes: true,
            currentStock: true,
            costPrice: true,
            sellingPrice: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: { name: 'asc' },
        },
        batches: {
          where: {
            currentQty: { gt: 0 },
            status: 'active',
          },
          select: {
            id: true,
            batchNumber: true,
            currentQty: true,
            unitCost: true,
            expiryDate: true,
            status: true,
            productionDate: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        stockMovements: {
          select: {
            id: true,
            type: true,
            direction: true,
            quantity: true,
            newStock: true,
            unitCost: true,
            referenceType: true,
            referenceNumber: true,
            reason: true,
            performedByName: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: {
          select: {
            stockMovements: true,
            batches: true,
            transactionItems: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Calculate stats
    const stockValue = product.currentStock * product.costPrice;
    const marginPercent = product.sellingPrice > 0 
      ? ((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100 
      : 0;

    // Calculate stock status
    let stockStatus = 'in_stock';
    const lowThreshold = product.lowStockThreshold || 10;
    if (product.currentStock <= 0) {
      stockStatus = 'out_of_stock';
    } else if (product.currentStock <= lowThreshold) {
      stockStatus = 'low_stock';
    }

    // Calculate days of stock remaining (based on last 30 days sales)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSales = await db.stockMovement.aggregate({
      where: {
        productId: id,
        type: 'sale',
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: {
        quantity: true,
      },
    });

    const avgDailySales = recentSales._sum.quantity 
      ? recentSales._sum.quantity / 30 
      : 0;
    const daysOfStock = avgDailySales > 0 
      ? Math.floor(product.currentStock / avgDailySales) 
      : null;

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        stockStatus,
        stockValue,
        marginPercent: Math.round(marginPercent * 100) / 100,
        analytics: {
          avgDailySales: Math.round(avgDailySales * 100) / 100,
          daysOfStock,
          totalBatches: product._count.batches,
          totalMovements: product._count.stockMovements,
          timesSold: product._count.transactionItems,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/inventory/products/[id]
 * Update a product
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // If SKU is being changed, check for conflicts
    if (body.sku && body.sku !== existingProduct.sku) {
      const skuConflict = await db.product.findFirst({
        where: {
          merchantId: existingProduct.merchantId,
          sku: body.sku,
          id: { not: id },
        },
      });

      if (skuConflict) {
        return NextResponse.json(
          { error: 'A product with this SKU already exists' },
          { status: 409 }
        );
      }
    }

    // If barcode is being changed, check for conflicts
    if (body.barcode && body.barcode !== existingProduct.barcode) {
      const barcodeConflict = await db.product.findFirst({
        where: {
          merchantId: existingProduct.merchantId,
          barcode: body.barcode,
          id: { not: id },
        },
      });

      if (barcodeConflict) {
        return NextResponse.json(
          { error: 'A product with this barcode already exists' },
          { status: 409 }
        );
      }
    }

    // Calculate margin if prices changed
    const costPrice = body.costPrice ?? existingProduct.costPrice;
    const sellingPrice = body.sellingPrice ?? existingProduct.sellingPrice;
    const margin = sellingPrice > 0 
      ? ((sellingPrice - costPrice) / sellingPrice) * 100 
      : 0;

    // Update product
    const product = await db.product.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        barcode: body.barcode,
        categoryId: body.categoryId,
        branchId: body.branchId,
        costPrice: body.costPrice,
        sellingPrice: body.sellingPrice,
        compareAtPrice: body.compareAtPrice,
        margin,
        vatRate: body.vatRate,
        vatExempt: body.vatExempt,
        zeroRated: body.zeroRated,
        trackInventory: body.trackInventory,
        lowStockThreshold: body.lowStockThreshold,
        reorderPoint: body.reorderPoint,
        reorderQuantity: body.reorderQuantity,
        unit: body.unit,
        image: body.image,
        images: body.images,
        isActive: body.isActive,
        isFeatured: body.isFeatured,
        isAvailableOnline: body.isAvailableOnline,
        variantOptions: body.variantOptions,
        updatedAt: new Date(),
      },
      include: {
        category: true,
        branch: true,
        variants: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Product updated successfully',
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/inventory/products/[id]
 * Soft delete a product (archive)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            variants: true,
            batches: { where: { currentQty: { gt: 0 } } },
          },
        },
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product has active batches
    if (existingProduct._count.batches > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product with active batches. Deplete or transfer batches first.' },
        { status: 400 }
      );
    }

    // Soft delete (archive) - set isActive to false
    await db.product.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    // Also archive variants
    await db.product.updateMany({
      where: { parentId: id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Product archived successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
