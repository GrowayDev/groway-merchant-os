import { NextRequest, NextResponse } from 'next/server'
import { sign } from 'jsonwebtoken'
import {
  hashPassword,
  checkUserExists,
  createNewUser,
  createNewMerchant,
  createSession
} from '@/lib/auth-hybrid'
import { seedProductsForMerchant } from '@/lib/product-seed'
import { db } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// POST /merchant-os/api/auth/register - Register new merchant and user (Hybrid)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      // User details
      email,
      password,
      name,
      phone,
      
      // Merchant details (support both naming conventions)
      businessName,
      merchantName,
      tradingName,
      vertical,
      subVertical,
      
      // Address
      addressLine1,
      city,
      province,
      postalCode,
      
      // Business details
      vatRegistered = false,
      vatNumber,
      registrationNumber,
    } = body

    // Support both businessName and merchantName
    const finalMerchantName = businessName || merchantName

    // Validate required fields
    if (!email || !password || !finalMerchantName || !vertical) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email, password, business name, and vertical are required' 
        },
        { status: 400 }
      )
    }

    // Check if user already exists using hybrid auth
    const userExists = await checkUserExists(email)
    
    if (userExists) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user using hybrid auth
    const user = await createNewUser({
      email,
      passwordHash,
      name,
      phone
    })

    // Create merchant using hybrid auth
    const { merchant, branch, merchantUser } = await createNewMerchant({
      userId: user.id,
      name: finalMerchantName,
      tradingName: tradingName || finalMerchantName,
      vertical,
      subVertical,
      phone,
      email,
      addressLine1,
      city,
      province,
      postalCode,
      vatRegistered,
      vatNumber: vatRegistered ? vatNumber : undefined,
      registrationNumber
    })

    // Seed default product categories based on vertical
    let seededProducts = { created: 0, categories: [] as string[] }
    try {
      // Create default categories for the vertical
      const categoryMap: Record<string, string[]> = {
        fnb: ['Food', 'Beverages', 'Desserts', 'Sides', 'Ingredients', 'Packaging'],
        liquor: ['Spirits', 'Wine', 'Beer', 'Ciders', 'Coolers', 'Mixers', 'Snacks'],
        grocery: ['Fresh Produce', 'Dairy', 'Bakery', 'Meat', 'Pantry', 'Frozen', 'Beverages', 'Household'],
        'health-beauty': ['Hair Services', 'Nail Services', 'Skin Care', 'Massage', 'Products', 'Packages'],
        fashion: ['Clothing', 'Shoes', 'Accessories', 'Bags', 'Jewelry'],
        'health-pharmacy': ['Medicines', 'Healthcare', 'Supplements', 'Personal Care', 'Baby Care'],
        hospitality: ['Room Charges', 'Restaurant', 'Bar', 'Spa', 'Laundry', 'Other Services'],
        hardware: ['Building Materials', 'Tools', 'Paint', 'Plumbing', 'Electrical', 'Garden'],
        electronics: ['Phones', 'Computers', 'Accessories', 'Repairs', 'Audio', 'Gaming'],
        'sport-leisure': ['Equipment', 'Apparel', 'Memberships', 'Classes', 'Supplements'],
        childcare: ['Tuition', 'Registration', 'Meals', 'Activities', 'Supplies'],
        professional: ['Services', 'Parts', 'Materials', 'Labor', 'Consultations']
      }

      const categories = categoryMap[vertical] || ['General', 'Services', 'Products']
      
      for (const categoryName of categories) {
        await db.productCategory.create({
          data: {
            merchantId: merchant.id,
            name: categoryName,
            description: `${categoryName} for ${vertical} business`
          }
        })
      }

      // Seed products based on vertical and subVertical
      seededProducts = await seedProductsForMerchant(
        db,
        merchant.id,
        vertical,
        subVertical
      )
      
      console.log(`[Registration] Seeded ${seededProducts.created} products for merchant ${merchant.id}`)
    } catch (seedError) {
      console.warn('[Registration] Failed to seed products (non-critical):', seedError)
      // Continue even if seeding fails - merchant is still created
    }

    // Generate session token
    const token = sign(
      { 
        userId: user.id, 
        merchantId: merchant.id,
        branchId: branch.id,
        role: 'owner' 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Create session using hybrid auth
    await createSession(
      user.id,
      token,
      request.headers.get('user-agent') || undefined,
      request.headers.get('x-forwarded-for')?.split(',')[0] || undefined
    )

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      merchant: {
        id: merchant.id,
        code: merchant.code,
        name: merchant.name,
        vertical: merchant.vertical,
        subVertical: merchant.subVertical,
        onboardingComplete: merchant.onboardingComplete
      },
      branchId: branch?.id,
      seededProducts: seededProducts.created,
      token,
      message: 'Account created successfully'
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
