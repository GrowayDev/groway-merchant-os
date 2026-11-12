import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/products/[id]
 * Get product by ID with stock info
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeStockMovements = searchParams.get('includeStock') === 'true';
    const stockMovementLimit = parseInt(searchParams.get('stockLimit') || '20', 10);

    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true,
            color: true,
            image: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
            province: true,
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
            name: true,
            sku: true,
            sellingPrice: true,
            currentStock: true,
            variantAttributes: true,
            isActive: true,
          },
          where: {
            isActive: true,
          },
        },
        ...(includeStockMovements && {
          stockMovements: {
            take: stockMovementLimit,
            orderBy: {
              createdAt: 'desc',
            },
            select: {
              id: true,
              type: true,
              quantity: true,
              previousStock: true,
              newStock: true,
              unitCost: true,
              totalValue: true,
              referenceType: true,
              referenceId: true,
              reason: true,
              notes: true,
              performedBy: true,
              performedByName: true,
              createdAt: true,
            },
          },
        }),
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Calculate additional stock info
    let stockStatus = 'in_stock';
    if (product.currentStock <= 0) {
      stockStatus = 'out_of_stock';
    } else if (product.currentStock <= product.lowStockThreshold) {
      stockStatus = 'low_stock';
    }

    // Get stock movement summary
    const stockSummary = await db.stockMovement.aggregate({
      where: {
        productId: id,
      },
      _count: true,
      _sum: {
        quantity: true,
        totalValue: true,
      },
    });

    // Get recent sales velocity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSales = await db.stockMovement.aggregate({
      where: {
        productId: id,
        type: 'sale',
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _sum: {
        quantity: true,
      },
    });

    const dailySalesVelocity = recentSales._sum.quantity 
      ? Math.abs(recentSales._sum.quantity) / 30 
      : 0;

    // Calculate days of stock remaining
    const daysOfStockRemaining = dailySalesVelocity > 0 
      ? Math.floor(product.currentStock / dailySalesVelocity) 
      : null;

    const productWithDetails = {
      ...product,
      stockStatus,
      stockValue: product.currentStock * product.costPrice,
      marginPercent: product.sellingPrice > 0 
        ? ((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100 
        : 0,
      stockSummary: {
        totalMovements: stockSummary._count,
        netQuantity: stockSummary._sum.quantity || 0,
        totalValue: stockSummary._sum.totalValue || 0,
      },
      salesMetrics: {
        dailyVelocity: dailySalesVelocity,
        monthlyVelocity: dailySalesVelocity * 30,
        daysOfStockRemaining,
        needsReorder: product.currentStock <= product.reorderPoint,
      },
    };

    return NextResponse.json({
      success: true,
      data: productWithDetails,
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
 * PUT /api/products/[id]
 * Update product details
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

    // If SKU is being changed, check for duplicates
    if (body.sku && body.sku !== existingProduct.sku) {
      const duplicateSku = await db.product.findFirst({
        where: {
          merchantId: existingProduct.merchantId,
          sku: body.sku,
          id: { not: id },
        },
      });

      if (duplicateSku) {
        return NextResponse.json(
          { error: 'A product with this SKU already exists' },
          { status: 409 }
        );
      }
    }

    // If barcode is being changed, check for duplicates
    if (body.barcode && body.barcode !== existingProduct.barcode) {
      const duplicateBarcode = await db.product.findFirst({
        where: {
          merchantId: existingProduct.merchantId,
          barcode: body.barcode,
          id: { not: id },
        },
      });

      if (duplicateBarcode) {
        return NextResponse.json(
          { error: 'A product with this barcode already exists' },
          { status: 409 }
        );
      }
    }

    // Calculate margin if pricing changed
    const costPrice = body.costPrice !== undefined ? body.costPrice : existingProduct.costPrice;
    const sellingPrice = body.sellingPrice !== undefined ? body.sellingPrice : existingProduct.sellingPrice;
    const margin = sellingPrice > 0 
      ? ((sellingPrice - costPrice) / sellingPrice) * 100 
      : 0;

    // Build update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Only update fields that are provided
    const updatableFields = [
      'sku', 'barcode', 'name', 'description', 'image', 'images',
      'type', 'unit', 'costPrice', 'sellingPrice', 'compareAtPrice',
      'vatRate', 'vatExempt', 'zeroRated', 'trackInventory',
      'lowStockThreshold', 'reorderPoint', 'reorderQuantity',
      'hasVariants', 'variantOptions', 'variantAttributes', 'parentId',
      'isActive', 'isFeatured', 'isAvailableOnline', 'categoryId', 'branchId',
    ];

    for (const field of updatableFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Always update margin when pricing changes
    if (body.costPrice !== undefined || body.sellingPrice !== undefined) {
      updateData.margin = margin;
    }

    // Update product
    const product = await db.product.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
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
 * DELETE /api/products/[id]
 * Soft delete product (set isActive = false)
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

    // Check if product has active variants
    if (existingProduct._count.variants > 0) {
      // Soft delete variants first
      await db.product.updateMany({
        where: {
          parentId: id,
          isActive: true,
        },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });
    }

    // Soft delete the product
    await db.product.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Product deactivated successfully',
      data: {
        id,
        isActive: false,
      },
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
