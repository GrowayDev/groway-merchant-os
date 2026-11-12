import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// Generate unique share code
function generateShareCode() {
  return nanoid(10).toUpperCase()
}

// GET /api/supplier/catalogs - Get supplier catalogs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplierId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!supplierId) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 })
    }

    const where: any = { supplierId }

    if (status) {
      where.status = status
    }

    if (search) {
      where.name = { contains: search }
    }

    const [catalogs, total] = await Promise.all([
      db.supplierCatalog.findMany({
        where,
        include: {
          products: {
            include: {
              product: {
                include: {
                  bulkPricing: { where: { active: true } }
                }
              }
            },
            orderBy: { sortOrder: 'asc' }
          },
          _count: {
            select: { products: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      db.supplierCatalog.count({ where })
    ])

    // Calculate stats
    const stats = {
      total,
      draft: await db.supplierCatalog.count({ where: { supplierId, status: 'draft' } }),
      published: await db.supplierCatalog.count({ where: { supplierId, status: 'published' } }),
      archived: await db.supplierCatalog.count({ where: { supplierId, status: 'archived' } }),
      totalViews: await db.supplierCatalog.aggregate({
        where: { supplierId },
        _sum: { viewCount: true }
      }),
      totalProducts: await db.supplierCatalogProduct.count({
        where: { catalog: { supplierId } }
      })
    }

    return NextResponse.json({
      catalogs: catalogs.map(c => ({
        ...c,
        productCount: c._count?.products || 0,
        featuredProducts: c.products?.filter((p: any) => p.featured).slice(0, 4) || []
      })),
      total,
      stats: {
        ...stats,
        totalViews: stats.totalViews._sum.viewCount || 0
      }
    })
  } catch (error) {
    console.error('Error fetching catalogs:', error)
    return NextResponse.json({ error: 'Failed to fetch catalogs' }, { status: 500 })
  }
}

// POST /api/supplier/catalogs - Create a new catalog
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { supplierId, name, description, visibility, productIds, coverImage } = body

    // Check if catalog name already exists for this supplier
    const existing = await db.supplierCatalog.findFirst({
      where: { supplierId, name }
    })

    if (existing) {
      return NextResponse.json({ error: 'Catalog name already exists' }, { status: 400 })
    }

    const catalog = await db.supplierCatalog.create({
      data: {
        supplierId,
        name,
        description,
        visibility: visibility || 'private',
        shareCode: generateShareCode(),
        coverImage,
        status: 'draft',
        productCount: productIds?.length || 0
      },
      include: { products: true }
    })

    // Add products if provided
    if (productIds && productIds.length > 0) {
      await db.supplierCatalogProduct.createMany({
        data: productIds.map((productId: string, index: number) => ({
          catalogId: catalog.id,
          productId,
          sortOrder: index
        }))
      })
    }

    return NextResponse.json({ catalog })
  } catch (error) {
    console.error('Error creating catalog:', error)
    return NextResponse.json({ error: 'Failed to create catalog' }, { status: 500 })
  }
}

// PUT /api/supplier/catalogs - Update catalog
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action, productIds, ...updates } = body

    const catalog = await db.supplierCatalog.findUnique({
      where: { id },
      include: { products: true }
    })

    if (!catalog) {
      return NextResponse.json({ error: 'Catalog not found' }, { status: 404 })
    }

    let updateData: any = { ...updates }

    switch (action) {
      case 'publish':
        updateData.status = 'published'
        updateData.publishedAt = new Date()
        break

      case 'unpublish':
        updateData.status = 'draft'
        break

      case 'archive':
        updateData.status = 'archived'
        break

      case 'regenerate_code':
        updateData.shareCode = generateShareCode()
        break

      case 'add_products':
        if (productIds && productIds.length > 0) {
          const existingProductIds = catalog.products.map((p: any) => p.productId)
          const newProductIds = productIds.filter((id: string) => !existingProductIds.includes(id))

          if (newProductIds.length > 0) {
            await db.supplierCatalogProduct.createMany({
              data: newProductIds.map((productId: string) => ({
                catalogId: id,
                productId
              }))
            })
          }

          updateData.productCount = catalog.products.length + newProductIds.length
        }
        break

      case 'remove_products':
        if (productIds && productIds.length > 0) {
          await db.supplierCatalogProduct.deleteMany({
            where: {
              catalogId: id,
              productId: { in: productIds }
            }
          })

          updateData.productCount = catalog.products.length - productIds.length
        }
        break

      case 'reorder_products':
        if (updates.productOrder) {
          for (const item of updates.productOrder) {
            await db.supplierCatalogProduct.update({
              where: { id: item.id },
              data: { sortOrder: item.sortOrder, featured: item.featured }
            })
          }
        }
        break

      case 'update_product_price':
        if (updates.productId && updates.customPrice !== undefined) {
          await db.supplierCatalogProduct.update({
            where: {
              catalogId: id,
              productId: updates.productId
            },
            data: { customPrice: updates.customPrice }
          })
        }
        break
    }

    const updated = await db.supplierCatalog.update({
      where: { id },
      data: updateData,
      include: {
        products: {
          include: { product: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    return NextResponse.json({ catalog: updated })
  } catch (error) {
    console.error('Error updating catalog:', error)
    return NextResponse.json({ error: 'Failed to update catalog' }, { status: 500 })
  }
}

// DELETE /api/supplier/catalogs - Delete a catalog
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Catalog ID is required' }, { status: 400 })
    }

    // Delete all product links first
    await db.supplierCatalogProduct.deleteMany({
      where: { catalogId: id }
    })

    // Delete catalog
    await db.supplierCatalog.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Catalog deleted successfully' })
  } catch (error) {
    console.error('Error deleting catalog:', error)
    return NextResponse.json({ error: 'Failed to delete catalog' }, { status: 500 })
  }
}
