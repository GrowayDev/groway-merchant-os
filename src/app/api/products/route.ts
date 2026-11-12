import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/products
 * List products with filters
 * Query params:
 * - merchantId: required - Filter by merchant
 * - categoryId: optional - Filter by category
 * - search: optional - Search by name, SKU, or barcode
 * - lowStock: optional - Filter products below low stock threshold
 * - isActive: optional - Filter by active status (default: true)
 * - branchId: optional - Filter by branch
 * - page: optional - Page number (default: 1)
 * - limit: optional - Items per page (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const merchantId = searchParams.get('merchantId');
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const lowStock = searchParams.get('lowStock');
    const isActive = searchParams.get('isActive');
    const branchId = searchParams.get('branchId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: Record<string, unknown> = {
      merchantId,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (isActive !== null && isActive !== 'all') {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (lowStock === 'true') {
      // Products where currentStock <= lowStockThreshold
      where.currentStock = { lte: db.product.fields.lowStockThreshold };
    }

    // Get total count
    const total = await db.product.count({ where });

    // Get products with pagination
    const products = await db.product.findMany({
      where,
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
        _count: {
          select: {
            stockMovements: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate stock status for each product
    const productsWithStatus = products.map((product) => {
      let stockStatus = 'in_stock';
      if (product.currentStock <= 0) {
        stockStatus = 'out_of_stock';
      } else if (product.currentStock <= product.lowStockThreshold) {
        stockStatus = 'low_stock';
      }

      return {
        ...product,
        stockStatus,
        stockValue: product.currentStock * product.costPrice,
        marginPercent: product.sellingPrice > 0 
          ? ((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100 
          : 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: productsWithStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products
 * Create a new product
 * Body: Product data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      );
    }

    if (!body.sku) {
      return NextResponse.json(
        { error: 'SKU is required' },
        { status: 400 }
      );
    }

    if (!body.name) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    // Check if SKU already exists for this merchant
    const existingProduct = await db.product.findFirst({
      where: {
        merchantId: body.merchantId,
        sku: body.sku,
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: 'A product with this SKU already exists' },
        { status: 409 }
      );
    }

    // Check if barcode exists (if provided)
    if (body.barcode) {
      const existingBarcode = await db.product.findFirst({
        where: {
          merchantId: body.merchantId,
          barcode: body.barcode,
        },
      });

      if (existingBarcode) {
        return NextResponse.json(
          { error: 'A product with this barcode already exists' },
          { status: 409 }
        );
      }
    }

    // Calculate margin if not provided
    const costPrice = body.costPrice || 0;
    const sellingPrice = body.sellingPrice || 0;
    const margin = sellingPrice > 0 
      ? ((sellingPrice - costPrice) / sellingPrice) * 100 
      : 0;

    // Create product
    const product = await db.product.create({
      data: {
        merchantId: body.merchantId,
        branchId: body.branchId || null,
        categoryId: body.categoryId || null,
        sku: body.sku,
        barcode: body.barcode || null,
        name: body.name,
        description: body.description || null,
        image: body.image || null,
        images: body.images || null,
        type: body.type || 'standard',
        unit: body.unit || 'each',
        costPrice,
        sellingPrice,
        compareAtPrice: body.compareAtPrice || null,
        margin,
        vatRate: body.vatRate || null,
        vatExempt: body.vatExempt || false,
        zeroRated: body.zeroRated || false,
        trackInventory: body.trackInventory !== false,
        currentStock: body.currentStock || 0,
        lowStockThreshold: body.lowStockThreshold || 10,
        reorderPoint: body.reorderPoint || 5,
        reorderQuantity: body.reorderQuantity || 10,
        hasVariants: body.hasVariants || false,
        variantOptions: body.variantOptions || null,
        variantAttributes: body.variantAttributes || null,
        parentId: body.parentId || null,
        isActive: body.isActive !== false,
        isFeatured: body.isFeatured || false,
        isAvailableOnline: body.isAvailableOnline !== false,
      },
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

    // If initial stock is provided, create a stock movement
    if (body.currentStock && body.currentStock > 0 && body.branchId) {
      await db.stockMovement.create({
        data: {
          merchantId: body.merchantId,
          branchId: body.branchId,
          productId: product.id,
          type: 'purchase',
          quantity: body.currentStock,
          previousStock: 0,
          newStock: body.currentStock,
          unitCost: costPrice,
          totalValue: body.currentStock * costPrice,
          referenceType: 'manual',
          reason: 'Initial stock on product creation',
          performedBy: body.performedBy || null,
          performedByName: body.performedByName || null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Product created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
