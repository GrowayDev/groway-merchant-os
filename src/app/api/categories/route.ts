import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthContext, unauthorizedResponse, forbiddenResponse, badRequestResponse } from '@/lib/auth-context';

/**
 * GET /api/categories
 * List categories for a merchant
 * 
 * SECURITY: Requires authentication
 * - merchantId is validated against authenticated user's context
 * - Query params:
 *   - merchantId: required - Filter by merchant
 *   - includeInactive: optional - Include inactive categories (default: false)
 *   - includeProducts: optional - Include product count (default: true)
 */
export async function GET(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse('Authentication required to access categories')
  }

  try {
    const { searchParams } = new URL(request.url);
    
    const queryMerchantId = searchParams.get('merchantId');
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const includeProducts = searchParams.get('includeProducts') !== 'false';

    // Security: Determine merchantId with validation
    let merchantId: string;
    
    if ('merchantId' in context && context.merchantId) {
      // User has merchant context
      if (queryMerchantId && queryMerchantId !== context.merchantId) {
        // User is trying to access a different merchant's categories
        // Only allow if they're a platform admin
        if (context.role !== 'platform_admin' && context.role !== 'super_admin') {
          return forbiddenResponse('Access denied to this merchant\'s categories')
        }
        merchantId = queryMerchantId
      } else {
        merchantId = context.merchantId
      }
    } else if (queryMerchantId) {
      // No merchant context but trying to query - only for platform admins
      if (!('role' in context) || (context.role !== 'platform_admin' && context.role !== 'super_admin')) {
        return forbiddenResponse('Merchant context required')
      }
      merchantId = queryMerchantId
    } else {
      return badRequestResponse('merchantId is required')
    }

    // Build where clause
    const where: Record<string, unknown> = {
      merchantId,
    };

    if (!includeInactive) {
      where.isActive = true;
    }

    // Get categories with product counts
    const categories = await db.productCategory.findMany({
      where,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            color: true,
            sortOrder: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
        ...(includeProducts && {
          _count: {
            select: {
              products: {
                where: {
                  isActive: true,
                },
              },
            },
          },
        }),
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    // Build hierarchical structure
    const rootCategories = categories.filter(cat => !cat.parentId);
    const childCategories = categories.filter(cat => cat.parentId);

    // Map children to parents
    const categoriesWithChildren = rootCategories.map(category => {
      const children = childCategories
        .filter(child => child.parentId === category.id)
        .map(child => ({
          ...child,
          productCount: includeProducts ? (child._count?.products || 0) : undefined,
        }));

      return {
        ...category,
        productCount: includeProducts ? (category._count?.products || 0) : undefined,
        children: children.length > 0 ? children : undefined,
      };
    });

    // Add orphan children (children without parent in result)
    const orphans = childCategories.filter(
      child => !rootCategories.find(parent => parent.id === child.parentId)
    );

    const allCategories = [
      ...categoriesWithChildren,
      ...orphans.map(orphan => ({
        ...orphan,
        productCount: includeProducts ? (orphan._count?.products || 0) : undefined,
      })),
    ];

    return NextResponse.json({
      success: true,
      data: allCategories,
      meta: {
        total: categories.length,
        rootCategories: rootCategories.length,
        childCategories: childCategories.length,
      },
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories
 * Create a new category
 * 
 * SECURITY: Requires authentication
 * - merchantId is extracted from authenticated context
 * - Only authenticated users with proper permissions can create categories
 */
export async function POST(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse('Authentication required to create categories')
  }

  if (!('merchantId' in context)) {
    return forbiddenResponse('Merchant context required')
  }

  try {
    const body = await request.json();

    // Security: Use merchantId from authenticated context, not from body
    const merchantId = context.merchantId;

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Check if category with same name exists
    const existingCategory = await db.productCategory.findFirst({
      where: {
        merchantId,
        name: body.name,
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'A category with this name already exists' },
        { status: 409 }
      );
    }

    // Validate parent category if provided
    if (body.parentId) {
      const parentCategory = await db.productCategory.findFirst({
        where: {
          id: body.parentId,
          merchantId,
        },
      });

      if (!parentCategory) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 404 }
        );
      }

      // Prevent more than 2 levels of nesting
      if (parentCategory.parentId) {
        return NextResponse.json(
          { error: 'Maximum nesting level reached. Cannot create sub-category under a sub-category' },
          { status: 400 }
        );
      }
    }

    // Get max sort order for this merchant
    const maxSortOrder = await db.productCategory.aggregate({
      where: {
        merchantId,
        parentId: body.parentId || null,
      },
      _max: {
        sortOrder: true,
      },
    });

    const sortOrder = body.sortOrder ?? (maxSortOrder._max.sortOrder ?? -1) + 1;

    // Create category
    const category = await db.productCategory.create({
      data: {
        merchantId,
        name: body.name,
        description: body.description || null,
        parentId: body.parentId || null,
        image: body.image || null,
        color: body.color || '#00897B',
        sortOrder,
        isActive: body.isActive !== false,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: category,
      message: 'Category created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/categories
 * Update a category
 * 
 * SECURITY: Requires authentication
 * - merchantId is validated against authenticated context
 * - Body: { id, ...fields to update }
 */
export async function PUT(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse('Authentication required to update categories')
  }

  if (!('merchantId' in context)) {
    return forbiddenResponse('Merchant context required')
  }

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.id) {
      return NextResponse.json(
        { error: 'Category id is required' },
        { status: 400 }
      );
    }

    const merchantId = context.merchantId;

    // Check if category exists and belongs to merchant
    const existingCategory = await db.productCategory.findFirst({
      where: {
        id: body.id,
        merchantId,
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found or access denied' },
        { status: 404 }
      );
    }

    // Check for duplicate name if name is being changed
    if (body.name && body.name !== existingCategory.name) {
      const duplicateName = await db.productCategory.findFirst({
        where: {
          merchantId,
          name: body.name,
          id: { not: body.id },
        },
      });

      if (duplicateName) {
        return NextResponse.json(
          { error: 'A category with this name already exists' },
          { status: 409 }
        );
      }
    }

    // Validate parent category if being changed
    if (body.parentId !== undefined && body.parentId !== existingCategory.parentId) {
      if (body.parentId) {
        // Check if new parent exists
        const newParent = await db.productCategory.findFirst({
          where: {
            id: body.parentId,
            merchantId,
          },
        });

        if (!newParent) {
          return NextResponse.json(
            { error: 'Parent category not found' },
            { status: 404 }
          );
        }

        // Check if trying to set self as parent
        if (body.parentId === body.id) {
          return NextResponse.json(
            { error: 'Cannot set category as its own parent' },
            { status: 400 }
          );
        }

        // Prevent making a parent a child of its own child
        const existingChildren = await db.productCategory.findMany({
          where: {
            parentId: body.id,
          },
          select: { id: true },
        });
        const childIds = existingChildren.map(c => c.id);
        if (childIds.includes(body.parentId)) {
          return NextResponse.json(
            { error: 'Cannot set a child category as parent' },
            { status: 400 }
          );
        }

        // Prevent more than 2 levels of nesting
        if (newParent.parentId) {
          return NextResponse.json(
            { error: 'Maximum nesting level reached' },
            { status: 400 }
          );
        }
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    const updatableFields = [
      'name', 'description', 'parentId', 'image', 'color', 'sortOrder', 'isActive',
    ];

    for (const field of updatableFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Update category
    const category = await db.productCategory.update({
      where: { id: body.id },
      data: updateData,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: category,
      message: 'Category updated successfully',
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/categories
 * Delete a category
 * 
 * SECURITY: Requires authentication
 * - merchantId is validated against authenticated context
 * - Query params:
 *   - id: required - Category ID
 *   - reassignTo: optional - Category ID to reassign products to
 */
export async function DELETE(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse('Authentication required to delete categories')
  }

  if (!('merchantId' in context)) {
    return forbiddenResponse('Merchant context required')
  }

  try {
    const { searchParams } = new URL(request.url);
    
    const id = searchParams.get('id');
    const reassignTo = searchParams.get('reassignTo');

    if (!id) {
      return NextResponse.json(
        { error: 'Category id is required' },
        { status: 400 }
      );
    }

    const merchantId = context.merchantId;

    // Check if category exists and belongs to merchant
    const existingCategory = await db.productCategory.findFirst({
      where: {
        id,
        merchantId,
      },
      include: {
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found or access denied' },
        { status: 404 }
      );
    }

    // Check if category has children
    if (existingCategory._count.children > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with sub-categories. Delete or reassign sub-categories first.' },
        { status: 400 }
      );
    }

    // Handle products in this category
    if (existingCategory._count.products > 0) {
      if (reassignTo) {
        // Verify reassignment target exists and belongs to same merchant
        const targetCategory = await db.productCategory.findFirst({
          where: {
            id: reassignTo,
            merchantId,
          },
        });

        if (!targetCategory) {
          return NextResponse.json(
            { error: 'Target category for reassignment not found' },
            { status: 404 }
          );
        }

        // Reassign products to target category
        await db.product.updateMany({
          where: {
            categoryId: id,
            merchantId,
          },
          data: {
            categoryId: reassignTo,
            updatedAt: new Date(),
          },
        });
      } else {
        // Set products to no category
        await db.product.updateMany({
          where: {
            categoryId: id,
            merchantId,
          },
          data: {
            categoryId: null,
            updatedAt: new Date(),
          },
        });
      }
    }

    // Delete category
    await db.productCategory.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
      data: {
        id,
        productsReassigned: existingCategory._count.products,
        reassignedTo: reassignTo || null,
      },
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
