import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/whitelabel - Get white-label configuration
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const corporateId = searchParams.get('corporateId')
    const domain = searchParams.get('domain')

    let where: Record<string, unknown> = {}
    
    if (corporateId) {
      where.corporateId = corporateId
    } else if (domain) {
      where.customDomain = domain
    } else {
      // Return all configurations
      const configs = await db.enterpriseWhiteLabel.findMany({
        where: { active: true },
        orderBy: { createdAt: 'desc' }
      })
      
      return NextResponse.json({ configs })
    }

    const config = await db.enterpriseWhiteLabel.findFirst({ where })

    if (!config) {
      return NextResponse.json({ error: 'White-label configuration not found' }, { status: 404 })
    }

    // Parse JSON fields
    const response = {
      ...config,
      socialLinks: config.socialLinks ? JSON.parse(config.socialLinks) : null,
      customFonts: config.customFonts ? JSON.parse(config.customFonts) : null
    }

    return NextResponse.json({ config: response })
  } catch (error) {
    console.error('Error fetching white-label config:', error)
    return NextResponse.json({ error: 'Failed to fetch white-label configuration' }, { status: 500 })
  }
}

// POST /api/whitelabel - Create a new white-label configuration
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
      customScripts
    } = body

    if (!corporateId) {
      return NextResponse.json({ error: 'corporateId is required' }, { status: 400 })
    }

    // Check if configuration already exists
    const existing = await db.enterpriseWhiteLabel.findUnique({
      where: { corporateId }
    })

    if (existing) {
      return NextResponse.json({ error: 'Configuration already exists for this corporate' }, { status: 400 })
    }

    const config = await db.enterpriseWhiteLabel.create({
      data: {
        id: `wl-${Date.now()}`,
        corporateId,
        primaryColor: primaryColor || '#00897B',
        secondaryColor: secondaryColor || '#00695C',
        accentColor: accentColor || '#4CAF50',
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
        customFonts: customFonts ? JSON.stringify(customFonts) : null,
        socialLinks: socialLinks ? JSON.stringify(socialLinks) : null,
        customScripts,
        active: true,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, config })
  } catch (error) {
    console.error('Error creating white-label config:', error)
    return NextResponse.json({ error: 'Failed to create white-label configuration' }, { status: 500 })
  }
}

// PUT /api/whitelabel - Update a white-label configuration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { corporateId, ...updateData } = body

    if (!corporateId) {
      return NextResponse.json({ error: 'corporateId is required' }, { status: 400 })
    }

    // Prepare update data
    const data: Record<string, unknown> = {
      ...updateData,
      updatedAt: new Date()
    }

    // Handle JSON fields
    if (updateData.socialLinks) {
      data.socialLinks = JSON.stringify(updateData.socialLinks)
    }
    if (updateData.customFonts) {
      data.customFonts = JSON.stringify(updateData.customFonts)
    }

    const config = await db.enterpriseWhiteLabel.update({
      where: { corporateId },
      data
    })

    return NextResponse.json({ success: true, config })
  } catch (error) {
    console.error('Error updating white-label config:', error)
    return NextResponse.json({ error: 'Failed to update white-label configuration' }, { status: 500 })
  }
}
