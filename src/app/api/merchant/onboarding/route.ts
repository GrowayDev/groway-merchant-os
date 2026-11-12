import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import * as bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('groway_session')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Find session
    const session = await db.merchantSession.findUnique({
      where: { token: sessionToken },
      include: { merchant: true },
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { branch, tradingHours, staff, products, payments } = body

    // Update merchant as onboarded
    await db.merchant.update({
      where: { id: session.merchantId },
      data: {
        onboardingComplete: true,
        onboardingStep: 'complete',
      },
    })

    // Update branch if provided
    if (branch && branch.name) {
      await db.branch.updateMany({
        where: { 
          merchantId: session.merchantId,
          isDefault: true,
        },
        data: {
          name: branch.name,
          phone: branch.phone,
          email: branch.email,
          addressLine1: branch.address,
          city: branch.city,
          province: branch.province,
          postalCode: branch.postalCode,
        },
      })
    }

    // Create staff members
    if (staff && staff.length > 0) {
      for (const member of staff) {
        // Create user for staff member
        const pinHash = member.pin ? await bcrypt.hash(member.pin, 10) : null
        
        const staffUser = await db.user.create({
          data: {
            email: member.email || `staff_${Date.now()}@temp.groway.app`,
            name: member.name,
            phone: member.phone,
            pinHash,
          },
        })

        // Create merchant user
        await db.merchantUser.create({
          data: {
            merchantId: session.merchantId,
            userId: staffUser.id,
            role: member.role,
            isActive: true,
            acceptedAt: new Date(),
          },
        })
      }
    }

    // Create products
    if (products && products.length > 0) {
      for (const product of products) {
        // Find or create category
        let category = null
        if (product.category) {
          category = await db.productCategory.findFirst({
            where: {
              merchantId: session.merchantId,
              name: product.category,
            },
          })
          
          if (!category) {
            category = await db.productCategory.create({
              data: {
                merchantId: session.merchantId,
                name: product.category,
                description: `${product.category} products`,
              },
            })
          }
        }

        // Generate SKU
        const sku = `SKU-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

        await db.product.create({
          data: {
            merchantId: session.merchantId,
            sku,
            name: product.name,
            description: product.name,
            price: product.price,
            costPrice: product.cost || 0,
            categoryId: category?.id,
            isActive: true,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
    })
  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save onboarding data' },
      { status: 500 }
    )
  }
}
