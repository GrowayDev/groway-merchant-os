import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function getSession(request: NextRequest) {
  const sessionToken = request.cookies.get('groway_session')?.value
  if (!sessionToken) return null
  
  try {
    return await db.merchantSession.findFirst({
      where: { 
        token: sessionToken,
        expiresAt: { gt: new Date() }
      },
      include: { user: true, merchant: true },
    })
  } catch {
    return null
  }
}

// GET /api/pricing/settings - Get pricing configuration
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let settings = await db.pricingSetup.findUnique({
      where: { merchantId: session.merchantId },
    })

    // Create default settings if not exists
    if (!settings) {
      settings = await db.pricingSetup.create({
        data: {
          merchantId: session.merchantId,
          onboardingComplete: false,
          currentStep: 'welcome',
          defaultMarginType: 'percentage',
          defaultMarginValue: 45,
          minMarginThreshold: 30,
          maxMarginThreshold: 70,
          priceRounding: 'nearest_0.99',
          autoUpdateCosts: true,
          autoApplyMargin: false,
          alertOnLowMargin: true,
          lowMarginAlertThreshold: 30,
          competitorTrackingEnabled: false,
          groAiSuggestionsEnabled: true,
        },
      })
    }

    return NextResponse.json({
      success: true,
      settings,
    })
  } catch (error) {
    console.error('Get pricing settings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PUT /api/pricing/settings - Update pricing configuration
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      defaultMarginType,
      defaultMarginValue,
      minMarginThreshold,
      maxMarginThreshold,
      priceRounding,
      autoUpdateCosts,
      autoApplyMargin,
      alertOnLowMargin,
      lowMarginAlertThreshold,
      competitorTrackingEnabled,
      groAiSuggestionsEnabled,
      onboardingComplete,
      currentStep,
    } = body

    const settings = await db.pricingSetup.upsert({
      where: { merchantId: session.merchantId },
      create: {
        merchantId: session.merchantId,
        defaultMarginType: defaultMarginType || 'percentage',
        defaultMarginValue: defaultMarginValue || 45,
        minMarginThreshold: minMarginThreshold || 30,
        maxMarginThreshold: maxMarginThreshold || 70,
        priceRounding: priceRounding || 'nearest_0.99',
        autoUpdateCosts: autoUpdateCosts ?? true,
        autoApplyMargin: autoApplyMargin ?? false,
        alertOnLowMargin: alertOnLowMargin ?? true,
        lowMarginAlertThreshold: lowMarginAlertThreshold || 30,
        competitorTrackingEnabled: competitorTrackingEnabled ?? false,
        groAiSuggestionsEnabled: groAiSuggestionsEnabled ?? true,
        onboardingComplete: onboardingComplete ?? false,
        currentStep: currentStep || 'welcome',
      },
      update: {
        ...(defaultMarginType !== undefined && { defaultMarginType }),
        ...(defaultMarginValue !== undefined && { defaultMarginValue }),
        ...(minMarginThreshold !== undefined && { minMarginThreshold }),
        ...(maxMarginThreshold !== undefined && { maxMarginThreshold }),
        ...(priceRounding !== undefined && { priceRounding }),
        ...(autoUpdateCosts !== undefined && { autoUpdateCosts }),
        ...(autoApplyMargin !== undefined && { autoApplyMargin }),
        ...(alertOnLowMargin !== undefined && { alertOnLowMargin }),
        ...(lowMarginAlertThreshold !== undefined && { lowMarginAlertThreshold }),
        ...(competitorTrackingEnabled !== undefined && { competitorTrackingEnabled }),
        ...(groAiSuggestionsEnabled !== undefined && { groAiSuggestionsEnabled }),
        ...(onboardingComplete !== undefined && { onboardingComplete }),
        ...(currentStep !== undefined && { currentStep }),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      settings,
    })
  } catch (error) {
    console.error('Update pricing settings error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}

// POST /api/pricing/settings/complete-onboarding - Complete onboarding
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { applyToAll } = body

    // Mark onboarding complete
    const settings = await db.pricingSetup.upsert({
      where: { merchantId: session.merchantId },
      create: {
        merchantId: session.merchantId,
        onboardingComplete: true,
        currentStep: 'complete',
        defaultMarginType: 'percentage',
        defaultMarginValue: 45,
        minMarginThreshold: 30,
        maxMarginThreshold: 70,
        priceRounding: 'nearest_0.99',
        autoUpdateCosts: true,
        autoApplyMargin: false,
        alertOnLowMargin: true,
        lowMarginAlertThreshold: 30,
        competitorTrackingEnabled: false,
        groAiSuggestionsEnabled: true,
      },
      update: {
        onboardingComplete: true,
        currentStep: 'complete',
        updatedAt: new Date(),
      },
    })

    // If applyToAll is true, apply default margin to all products without prices
    if (applyToAll) {
      const products = await db.product.findMany({
        where: {
          merchantId: session.merchantId,
          isActive: true,
          OR: [
            { sellingPrice: 0 },
            { sellingPrice: null },
          ],
        },
      })

      for (const product of products) {
        const cost = product.costPrice || 0
        if (cost > 0) {
          const suggestedPrice = cost / (1 - settings.defaultMarginValue / 100)
          
          await db.product.update({
            where: { id: product.id },
            data: {
              sellingPrice: suggestedPrice,
              margin: settings.defaultMarginValue,
              updatedAt: new Date(),
            },
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Pricing setup completed',
      settings,
    })
  } catch (error) {
    console.error('Complete onboarding error:', error)
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    )
  }
}
