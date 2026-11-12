import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { getAuthContext, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-context';

/**
 * GET /api/inventory/products
 * List products with pagination, search, and filters
 * 
 * Security: Requires authentication. merchantId must match authenticated user's merchant.
 * 
 * Query params:
 * - merchantId: required (validated against auth context)
 * - branchId: optional - Filter by branch
 * - categoryId: optional - Filter by category
 * - search: optional - Search by name, SKU, or barcode
 * - stockStatus: optional - Filter by stock status (in_stock, low_stock, out_of_stock)
 * - isActive: optional - Filter by active status (default: true)
 * - hasVariants: optional - Filter products with variants
 * - page: optional - Page number (default: 1)
 * - limit: optional - Items per page (default: 50)
 * - includeVariants: optional - Include variant children (default: false)
 */
export async function GET(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request);
  if (!context) {
    return unauthorizedResponse('Authentication required');
  }

  try {
    const { searchParams } = new URL(request.url);
    
    const queryMerchantId = searchParams.get('merchantId');
    const branchId = searchParams.get('branchId');
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const stockStatus = searchParams.get('stockStatus');
    const isActive = searchParams.get('isActive');
    const hasVariants = searchParams.get('hasVariants');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const includeVariants = searchParams.get('includeVariants') === 'true';

    // Security: Validate merchantId
    let merchantId: string;
    if ('merchantId' in context) {
      if (queryMerchantId && queryMerchantId !== context.merchantId) {
        if (context.role !== 'platform_admin' && context.role !== 'super_admin') {
          return forbiddenResponse('Access denied to this merchant');
        }
        merchantId = queryMerchantId;
      } else {
        merchantId = context.merchantId;
      }
    } else {
      if (!queryMerchantId) {
        return NextResponse.json(
          { error: 'merchantId is required' },
          { status: 400 }
        );
      }
      merchantId = queryMerchantId;
    }

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      merchantId,
      parentId: null, // Only parent products (not variants)
    };

    if (branchId) {
      where.branchId = branchId;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (isActive !== null && isActive !== 'all') {
      where.isActive = isActive === 'true';
    }

    if (hasVariants !== null) {
      where.hasVariants = hasVariants === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Stock status filter
    if (stockStatus) {
      const lowStockThreshold = 10; // Default threshold
      switch (stockStatus) {
        case 'out_of_stock':
          where.currentStock = { lte: 0 };
          break;
        case 'low_stock':
          where.AND = [
            { currentStock: { gt: 0 } },
            { currentStock: { lte: lowStockThreshold } },
          ];
          break;
        case 'in_stock':
          where.currentStock = { gt: lowStockThreshold };
          break;
      }
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
        variants: includeVariants ? {
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
          },
        } : false,
        _count: {
          select: {
            stockMovements: true,
            batches: true,
          },
        },
      },
      orderBy: [
        { name: 'asc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate stock status and margins for each product
    const productsWithStats = products.map((product) => {
      let calculatedStockStatus = 'in_stock';
      const lowThreshold = product.lowStockThreshold || 10;
      
      if (product.currentStock <= 0) {
        calculatedStockStatus = 'out_of_stock';
      } else if (product.currentStock <= lowThreshold) {
        calculatedStockStatus = 'low_stock';
      }

      const stockValue = product.currentStock * product.costPrice;
      const marginPercent = product.sellingPrice > 0 
        ? ((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100 
        : 0;

      return {
        ...product,
        stockStatus: calculatedStockStatus,
        stockValue,
        marginPercent: Math.round(marginPercent * 100) / 100,
      };
    });

    // Calculate summary stats
    const stats = await db.product.aggregate({
      where: { merchantId, parentId: null },
      _count: true,
      _sum: {
        currentStock: true,
      },
    });

    const lowStockCount = await db.product.count({
      where: {
        merchantId,
        parentId: null,
        currentStock: { gt: 0, lte: db.product.fields.lowStockThreshold },
      },
    });

    const outOfStockCount = await db.product.count({
      where: {
        merchantId,
        parentId: null,
        currentStock: { lte: 0 },
      },
    });

    return NextResponse.json({
      success: true,
      data: productsWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalProducts: stats._count,
        totalStockUnits: stats._sum.currentStock || 0,
        lowStockCount,
        outOfStockCount,
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
 * POST /api/inventory/products
 * Create a new product with optional variants
 * 
 * Security: Requires authentication. merchantId must match authenticated user's merchant.
 * 
 * Body: Product data
 * - merchantId: required (validated against auth context)
 * - name: required
 * - sku: required
 * - variants: optional array of variant data
 */
export async function POST(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request);
  if (!context) {
    return unauthorizedResponse('Authentication required');
  }

  try {
    const body = await request.json();

    // Security: Validate merchantId
    let merchantId: string;
    if ('merchantId' in context) {
      if (body.merchantId && body.merchantId !== context.merchantId) {
        if (context.role !== 'platform_admin' && context.role !== 'super_admin') {
          return forbiddenResponse('Access denied to this merchant');
        }
        merchantId = body.merchantId;
      } else {
        merchantId = context.merchantId;
      }
    } else {
      if (!body.merchantId) {
        return NextResponse.json(
          { error: 'merchantId is required' },
          { status: 400 }
        );
      }
      merchantId = body.merchantId;
    }

    // Validate required fields
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
        merchantId,
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
          merchantId,
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

    // Create product with optional variants in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create the main product
      const product = await tx.product.create({
        data: {
          merchantId,
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
          vatRate: body.vatRate || 15,
          vatExempt: body.vatExempt || false,
          zeroRated: body.zeroRated || false,
          trackInventory: body.trackInventory !== false,
          currentStock: body.currentStock || 0,
          lowStockThreshold: body.lowStockThreshold || 10,
          reorderPoint: body.reorderPoint || 5,
          reorderQuantity: body.reorderQuantity || 10,
          hasVariants: body.variants && body.variants.length > 0,
          variantOptions: body.variantOptions || null,
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

      // Create variants if provided
      if (body.variants && body.variants.length > 0) {
        for (const variant of body.variants) {
          await tx.product.create({
            data: {
              merchantId,
              branchId: body.branchId || null,
              categoryId: body.categoryId || null,
              parentId: product.id,
              sku: variant.sku,
              barcode: variant.barcode || null,
              name: `${product.name} - ${variant.name}`,
              type: 'variant',
              unit: body.unit || 'each',
              costPrice: variant.costPrice || costPrice,
              sellingPrice: variant.sellingPrice || sellingPrice,
              currentStock: variant.currentStock || 0,
              lowStockThreshold: body.lowStockThreshold || 10,
              reorderPoint: body.reorderPoint || 5,
              reorderQuantity: body.reorderQuantity || 10,
              variantAttributes: variant.attributes || null,
              isActive: variant.isActive !== false,
            },
          });
        }
      }

      // If initial stock is provided, create a stock movement
      if (body.currentStock && body.currentStock > 0 && body.branchId) {
        await tx.stockMovement.create({
          data: {
            merchantId,
            branchId: body.branchId,
            productId: product.id,
            idempotencyKey: `prod-${product.id}-init`,
            type: 'purchase',
            direction: 'in',
            quantity: body.currentStock,
            previousStock: 0,
            newStock: body.currentStock,
            unitCost: costPrice,
            totalCost: body.currentStock * costPrice,
            referenceType: 'manual',
            reason: 'Initial stock on product creation',
            performedBy: body.performedBy || null,
            performedByName: body.performedByName || null,
          },
        });
      }

      return product;
    });

    return NextResponse.json({
      success: true,
      data: result,
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
