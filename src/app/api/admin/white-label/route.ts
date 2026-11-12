import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/white-label - Get all white-label configurations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const corporateId = searchParams.get('corporateId')
    const domain = searchParams.get('domain')
    const active = searchParams.get('active')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {}
    
    if (corporateId) {
      where.corporateId = corporateId
    }
    if (domain) {
      where.customDomain = { contains: domain, mode: 'insensitive' }
    }
    if (active !== null && active !== undefined) {
      where.active = active === 'true'
    }

    // Get total count
    const total = await db.enterpriseWhiteLabel.count({ where })

    // Get configurations with pagination
    const configs = await db.enterpriseWhiteLabel.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        EnterpriseCorporateClient: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Parse JSON fields for each config
    const parsedConfigs = configs.map(config => ({
      ...config,
      socialLinks: config.socialLinks ? JSON.parse(config.socialLinks) : null,
      customFonts: config.customFonts ? JSON.parse(config.customFonts) : null
    }))

    return NextResponse.json({
      configs: parsedConfigs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching white-label configs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch white-label configurations' },
      { status: 500 }
    )
  }
}

// POST /api/admin/white-label - Create a new white-label configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      corporateId,
      primaryColor,
      secondaryColor,
      accentColor,
      logoUrl,
      logoDarkUrl,
      faviconUrl,
      customDomain,
      companyName,
      tagline,
      footerText,
      supportEmail,
      supportPhone,
      privacyPolicyUrl,
      termsUrl,
      customCss,
      emailHeaderHtml,
      emailFooterHtml,
      invoiceHeaderHtml,
      invoiceFooterHtml,
      receiptHeaderHtml,
      receiptFooterHtml,
      loginBackgroundUrl,
      customFonts,
      socialLinks,
      customScripts,
      active
    } = body

    // Validate required fields
    if (!corporateId) {
      return NextResponse.json(
        { error: 'corporateId is required' },
        { status: 400 }
      )
    }

    // Check if corporate client exists
    const corporate = await db.enterpriseCorporateClient.findUnique({
      where: { id: corporateId }
    })

    if (!corporate) {
      return NextResponse.json(
        { error: 'Corporate client not found' },
        { status: 404 }
      )
    }

    // Check if configuration already exists
    const existing = await db.enterpriseWhiteLabel.findUnique({
      where: { corporateId }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'White-label configuration already exists for this corporate client' },
        { status: 400 }
      )
    }

    // Create configuration
    const config = await db.enterpriseWhiteLabel.create({
      data: {
        id: `wl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        corporateId,
        primaryColor: primaryColor || '#00897B',
        secondaryColor: secondaryColor || '#00695C',
        accentColor: accentColor || '#4CAF50',
        logoUrl,
        logoDarkUrl,
        faviconUrl,
        customDomain,
        companyName: companyName || corporate.name,
        tagline,
        footerText,
        supportEmail,
        supportPhone,
        privacyPolicyUrl,
        termsUrl,
        customCss,
        emailHeaderHtml,
        emailFooterHtml,
        invoiceHeaderHtml,
        invoiceFooterHtml,
        receiptHeaderHtml,
        receiptFooterHtml,
        loginBackgroundUrl,
        customFonts: customFonts ? JSON.stringify(customFonts) : null,
        socialLinks: socialLinks ? JSON.stringify(socialLinks) : null,
        customScripts,
        active: active ?? true,
        updatedAt: new Date()
      },
      include: {
        EnterpriseCorporateClient: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Log activity
    try {
      await db.enterpriseActivity.create({
        data: {
          corporateId,
          type: 'whitelabel_created',
          message: `White-label configuration created for ${corporate.name}`,
          entityType: 'whitelabel',
          entityId: config.id
        }
      })
    } catch {
      // Ignore if activity logging fails
    }

    return NextResponse.json({
      success: true,
      config: {
        ...config,
        socialLinks: config.socialLinks ? JSON.parse(config.socialLinks) : null,
        customFonts: config.customFonts ? JSON.parse(config.customFonts) : null
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating white-label config:', error)
    return NextResponse.json(
      { error: 'Failed to create white-label configuration' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/white-label - Update a white-label configuration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { corporateId, id, ...updateData } = body

    // Validate required fields
    if (!corporateId && !id) {
      return NextResponse.json(
        { error: 'corporateId or id is required' },
        { status: 400 }
      )
    }

    // Find existing configuration
    const where = id ? { id } : { corporateId }
    const existing = await db.enterpriseWhiteLabel.findUnique({ where })

    if (!existing) {
      return NextResponse.json(
        { error: 'White-label configuration not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const data: Record<string, unknown> = {
      ...updateData,
      updatedAt: new Date()
    }

    // Handle JSON fields
    if (updateData.socialLinks !== undefined) {
      data.socialLinks = updateData.socialLinks ? JSON.stringify(updateData.socialLinks) : null
    }
    if (updateData.customFonts !== undefined) {
      data.customFonts = updateData.customFonts ? JSON.stringify(updateData.customFonts) : null
    }

    // Update configuration
    const config = await db.enterpriseWhiteLabel.update({
      where,
      data,
      include: {
        EnterpriseCorporateClient: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Log activity
    try {
      await db.enterpriseActivity.create({
        data: {
          corporateId: config.corporateId,
          type: 'whitelabel_updated',
          message: `White-label configuration updated`,
          entityType: 'whitelabel',
          entityId: config.id
        }
      })
    } catch {
      // Ignore if activity logging fails
    }

    return NextResponse.json({
      success: true,
      config: {
        ...config,
        socialLinks: config.socialLinks ? JSON.parse(config.socialLinks) : null,
        customFonts: config.customFonts ? JSON.parse(config.customFonts) : null
      }
    })
  } catch (error) {
    console.error('Error updating white-label config:', error)
    return NextResponse.json(
      { error: 'Failed to update white-label configuration' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/white-label - Delete a white-label configuration
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const corporateId = searchParams.get('corporateId')
    const id = searchParams.get('id')

    if (!corporateId && !id) {
      return NextResponse.json(
        { error: 'corporateId or id is required' },
        { status: 400 }
      )
    }

    // Find existing configuration
    const where = id ? { id } : { corporateId }
    const existing = await db.enterpriseWhiteLabel.findUnique({ where })

    if (!existing) {
      return NextResponse.json(
        { error: 'White-label configuration not found' },
        { status: 404 }
      )
    }

    // Delete configuration
    await db.enterpriseWhiteLabel.delete({ where })

    // Log activity
    try {
      await db.enterpriseActivity.create({
        data: {
          corporateId: existing.corporateId,
          type: 'whitelabel_deleted',
          message: `White-label configuration deleted`,
          entityType: 'whitelabel',
          entityId: existing.id
        }
      })
    } catch {
      // Ignore if activity logging fails
    }

    return NextResponse.json({
      success: true,
      message: 'White-label configuration deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting white-label config:', error)
    return NextResponse.json(
      { error: 'Failed to delete white-label configuration' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/white-label - Toggle active status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { corporateId, id, active } = body

    if (!corporateId && !id) {
      return NextResponse.json(
        { error: 'corporateId or id is required' },
        { status: 400 }
      )
    }

    if (typeof active !== 'boolean') {
      return NextResponse.json(
        { error: 'active must be a boolean' },
        { status: 400 }
      )
    }

    // Find and update configuration
    const where = id ? { id } : { corporateId }
    const config = await db.enterpriseWhiteLabel.update({
      where,
      data: {
        active,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      config: {
        ...config,
        socialLinks: config.socialLinks ? JSON.parse(config.socialLinks) : null,
        customFonts: config.customFonts ? JSON.parse(config.customFonts) : null
      }
    })
  } catch (error) {
    console.error('Error toggling white-label config:', error)
    return NextResponse.json(
      { error: 'Failed to toggle white-label configuration' },
      { status: 500 }
    )
  }
}
