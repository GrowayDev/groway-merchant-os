import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import * as bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { nanoid } from 'nanoid'

// Generate a unique merchant code
async function generateMerchantCode(): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code: string
  let exists = true
  
  while (exists) {
    code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    const existing = await db.merchant.findUnique({ where: { code } })
    exists = !!existing
  }
  
  return code!
}

// Vertical-specific category mappings
const verticalCategories: Record<string, { name: string; subcategories?: string[] }[]> = {
  food_beverage: [
    { name: 'Starters & Appetizers', subcategories: ['Hot Starters', 'Cold Starters', 'Sharing Platters'] },
    { name: 'Mains', subcategories: ['Grilled', 'Fried', 'Stews', 'Seafood', 'Vegetarian'] },
    { name: 'Burgers & Sandwiches', subcategories: ['Beef Burgers', 'Chicken Burgers', 'Sandwiches', 'Wraps'] },
    { name: 'Pizzas', subcategories: ['Traditional', 'Specialty', 'Calzones'] },
    { name: 'Sides', subcategories: ['Fries', 'Salads', 'Vegetables'] },
    { name: 'Desserts', subcategories: ['Ice Cream', 'Cakes', 'Traditional'] },
    { name: 'Beverages', subcategories: ['Soft Drinks', 'Juices', 'Hot Drinks', 'Smoothies'] },
    { name: 'Alcoholic Beverages', subcategories: ['Beer', 'Wine', 'Spirits', 'Cocktails'] },
  ],
  retail: [
    { name: 'Groceries', subcategories: ['Fresh Produce', 'Dairy', 'Bakery', 'Pantry'] },
    { name: 'Household', subcategories: ['Cleaning', 'Kitchen', 'Bathroom'] },
    { name: 'Personal Care', subcategories: ['Skincare', 'Haircare', 'Toiletries'] },
    { name: 'Snacks & Confectionery', subcategories: ['Chips', 'Sweets', 'Chocolates', 'Biscuits'] },
    { name: 'Beverages', subcategories: ['Soft Drinks', 'Juices', 'Water', 'Energy Drinks'] },
    { name: 'Frozen Foods', subcategories: ['Ice Cream', 'Frozen Meals', 'Frozen Vegetables'] },
    { name: 'Baby & Kids', subcategories: ['Baby Food', 'Diapers', 'Toys'] },
  ],
  health_beauty: [
    { name: 'Hair Services', subcategories: ['Cuts', 'Colouring', 'Treatments', 'Styling'] },
    { name: 'Nail Services', subcategories: ['Manicure', 'Pedicure', 'Nail Art', 'Gel'] },
    { name: 'Skin Care', subcategories: ['Facials', 'Peels', 'Microdermabrasion'] },
    { name: 'Body Treatments', subcategories: ['Massage', 'Body Wraps', 'Scrubs'] },
    { name: 'Products', subcategories: ['Hair Products', 'Skin Products', 'Nail Products'] },
    { name: 'Retail', subcategories: ['Gift Sets', 'Accessories', 'Tools'] },
  ],
  pharmacy: [
    { name: 'Prescription Medicines', subcategories: ['Antibiotics', 'Chronic', 'Acute'] },
    { name: 'Over-the-Counter', subcategories: ['Pain Relief', 'Cold & Flu', 'Allergies', 'Digestive'] },
    { name: 'Vitamins & Supplements', subcategories: ['Multivitamins', 'Minerals', 'Herbal'] },
    { name: 'Personal Care', subcategories: ['Skincare', 'Feminine Care', 'Oral Care'] },
    { name: 'Baby & Mother', subcategories: ['Baby Care', 'Maternity', 'Feeding'] },
    { name: 'Medical Devices', subcategories: ['Blood Pressure', 'Diabetes', 'First Aid'] },
  ],
  hospitality: [
    { name: 'Room Charges', subcategories: ['Standard', 'Deluxe', 'Suite', 'Family'] },
    { name: 'Food & Beverage', subcategories: ['Restaurant', 'Room Service', 'Bar', 'Breakfast'] },
    { name: 'Services', subcategories: ['Laundry', 'Spa', 'Transport', 'Tours'] },
    { name: 'Minibar', subcategories: ['Drinks', 'Snacks'] },
    { name: 'Amenities', subcategories: ['Toiletries', 'Gifts', 'Extras'] },
  ],
  liquor_nightlife: [
    { name: 'Spirits', subcategories: ['Whisky', 'Vodka', 'Gin', 'Rum', 'Brandy', 'Tequila'] },
    { name: 'Beer', subcategories: ['Draft', 'Bottled', 'Craft', 'Ciders'] },
    { name: 'Wine', subcategories: ['Red', 'White', 'Rosé', 'Sparkling', 'Fortified'] },
    { name: 'Cocktails', subcategories: ['Classic', 'Signature', 'Mocktails'] },
    { name: 'Food', subcategories: ['Tapas', 'Platters', 'Light Meals'] },
    { name: 'Shisha', subcategories: ['Flavoured', 'Premium'] },
  ],
  fashion: [
    { name: 'Men', subcategories: ['Shirts', 'Pants', 'Shoes', 'Accessories'] },
    { name: 'Women', subcategories: ['Dresses', 'Tops', 'Pants', 'Shoes', 'Accessories'] },
    { name: 'Kids', subcategories: ['Boys', 'Girls', 'Babies'] },
    { name: 'Sportswear', subcategories: ['Tops', 'Bottoms', 'Shoes', 'Equipment'] },
    { name: 'Accessories', subcategories: ['Bags', 'Jewelry', 'Watches', 'Sunglasses'] },
    { name: 'Sale Items', subcategories: ['Men', 'Women', 'Kids'] },
  ],
  hardware: [
    { name: 'Building Materials', subcategories: ['Cement', 'Bricks', 'Roofing', 'Timber'] },
    { name: 'Tools', subcategories: ['Hand Tools', 'Power Tools', 'Garden Tools'] },
    { name: 'Paint & Finishes', subcategories: ['Interior', 'Exterior', 'Wood Finishes'] },
    { name: 'Plumbing', subcategories: ['Pipes', 'Fittings', 'Taps', 'Bathroom'] },
    { name: 'Electrical', subcategories: ['Lighting', 'Switches', 'Cables', 'Safety'] },
    { name: 'Garden', subcategories: ['Plants', 'Pots', 'Fertilizer', 'Irrigation'] },
  ],
  electronics: [
    { name: 'Phones & Tablets', subcategories: ['Smartphones', 'Tablets', 'Accessories', 'Repairs'] },
    { name: 'Computers', subcategories: ['Laptops', 'Desktops', 'Monitors', 'Accessories'] },
    { name: 'Audio', subcategories: ['Headphones', 'Speakers', 'Sound Systems'] },
    { name: 'Gaming', subcategories: ['Consoles', 'Games', 'Accessories'] },
    { name: 'Appliances', subcategories: ['Kitchen', 'Laundry', 'Climate'] },
    { name: 'Services', subcategories: ['Repairs', 'Installations', 'Support'] },
  ],
  sports_leisure: [
    { name: 'Fitness Equipment', subcategories: ['Weights', 'Cardio', 'Accessories'] },
    { name: 'Sports Gear', subcategories: ['Team Sports', 'Racket Sports', 'Water Sports'] },
    { name: 'Outdoor', subcategories: ['Camping', 'Hiking', 'Cycling'] },
    { name: 'Apparel', subcategories: ['Footwear', 'Clothing', 'Accessories'] },
    { name: 'Nutrition', subcategories: ['Protein', 'Vitamins', 'Energy'] },
    { name: 'Services', subcategories: ['Memberships', 'Classes', 'Training'] },
  ],
  childcare_education: [
    { name: 'Tuition', subcategories: ['Monthly', 'Termly', 'Annual'] },
    { name: 'Registration', subcategories: ['New Student', 'Returning', 'Late'] },
    { name: 'Activities', subcategories: ['Sports', 'Arts', 'Clubs', 'Excursions'] },
    { name: 'Meals', subcategories: ['Daily', 'Weekly', 'Monthly'] },
    { name: 'Supplies', subcategories: ['Books', 'Stationery', 'Uniforms'] },
    { name: 'Extra Lessons', subcategories: ['Mathematics', 'Languages', 'Sciences'] },
  ],
  professional_services: [
    { name: 'Consulting', subcategories: ['Strategy', 'Operations', 'Finance'] },
    { name: 'Legal', subcategories: ['Corporate', 'Property', 'Litigation'] },
    { name: 'Accounting', subcategories: ['Tax', 'Audit', 'Bookkeeping'] },
    { name: 'IT Services', subcategories: ['Support', 'Development', 'Security'] },
    { name: 'Marketing', subcategories: ['Digital', 'Print', 'Events'] },
    { name: 'HR Services', subcategories: ['Recruitment', 'Training', 'Compliance'] },
  ],
}

async function seedDefaultCategories(tx: any, merchantId: string, vertical: string) {
  const categories = verticalCategories[vertical] || verticalCategories.retail
  const now = new Date()

  for (const category of categories) {
    const categoryId = `cat_${nanoid(12)}`
    const createdCategory = await tx.productCategory.create({
      data: {
        id: categoryId,
        merchantId,
        name: category.name,
        description: `${category.name} category`,
        updatedAt: now,
      },
    })

    // Create subcategories if they exist
    if (category.subcategories) {
      for (const subcategory of category.subcategories) {
        await tx.productCategory.create({
          data: {
            id: `cat_${nanoid(12)}`,
            merchantId,
            name: subcategory,
            parentId: createdCategory.id,
            description: `${subcategory} items`,
            updatedAt: now,
          },
        })
      }
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, phone, vertical, subVertical, businessName, tradingName, planCode, authProvider, authProviderId, avatarUrl } = body

    // Validate required fields
    // For social logins, password is generated by frontend
    if (!email || !name || !vertical || !businessName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // For email signup, password is required
    if ((!authProvider || authProvider === 'email') && !password) {
      return NextResponse.json(
        { success: false, error: 'Password is required for email signup' },
        { status: 400 }
      )
    }

    // Get the subscription plan (default to 'starter' if not specified)
    const plan = await db.subscriptionPlan.findUnique({
      where: { code: planCode || 'starter' }
    })
    
    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Invalid subscription plan' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password (for social logins, use the generated password from frontend)
    const passwordHash = password ? await bcrypt.hash(password, 12) : null

    // Generate merchant code
    const merchantCode = await generateMerchantCode()

    // Create user, merchant, and merchant user in a transaction
    const now = new Date()
    const result = await db.$transaction(async (tx) => {
      // Create user with generated ID
      const userId = `user_${nanoid(12)}`
      const user = await tx.user.create({
        data: {
          id: userId,
          email: email.toLowerCase(),
          name,
          phone,
          passwordHash,
          updatedAt: now,
          // Store auth provider for social logins
          ...(authProvider && { authProvider }),
          ...(authProviderId && { authProviderId }),
          ...(avatarUrl && { avatarUrl }),
          // Auto-verify email for OAuth users
          ...(authProvider && authProvider !== 'email' && { emailVerified: new Date() }),
        },
      })

      // Calculate trial end date based on plan
      const trialEndsAt = new Date(Date.now() + plan.trialDays * 24 * 60 * 60 * 1000)

      // Create merchant with generated ID
      const merchantId = `merchant_${nanoid(12)}`
      const merchant = await tx.merchant.create({
        data: {
          id: merchantId,
          code: merchantCode,
          name: businessName,
          tradingName: tradingName || businessName,
          vertical,
          subVertical,
          status: 'active',
          plan: plan.code,
          planStatus: 'trial',
          trialEndsAt,
          onboardingComplete: false,
          onboardingStep: 'welcome',
          updatedAt: now,
        },
      })

      // Create merchant subscription with generated ID
      await tx.merchantSubscription.create({
        data: {
          id: `sub_${nanoid(12)}`,
          merchantId: merchant.id,
          planId: plan.id,
          status: 'trial',
          billingCycle: 'monthly',
          trialEndsAt,
          currentPeriodStart: new Date(),
          currentPeriodEnd: trialEndsAt,
          updatedAt: now,
        },
      })

      // Create default branch with generated ID
      const branchId = `branch_${nanoid(12)}`
      const branch = await tx.branch.create({
        data: {
          id: branchId,
          merchantId: merchant.id,
          code: 'HQ',
          name: 'Main Branch',
          type: 'headquarters',
          isActive: true,
          isDefault: true,
          updatedAt: now,
        },
      })

      // Create merchant user (owner role) with generated ID
      await tx.merchantUser.create({
        data: {
          id: `mu_${nanoid(12)}`,
          merchantId: merchant.id,
          userId: user.id,
          role: 'owner',
          branchId: branch.id,
          isActive: true,
          acceptedAt: new Date(),
          updatedAt: now,
        },
      })

      // Seed default categories based on vertical
      await seedDefaultCategories(tx, merchant.id, vertical)

      return { user, merchant, branch, plan }
    })

    // Create session
    const sessionToken = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await db.session.create({
      data: {
        id: `sess_${nanoid(12)}`,
        userId: result.user.id,
        token: sessionToken,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent'),
        expiresAt,
      },
    })

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('groway_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    })

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        avatar: result.user.avatar,
        phone: result.user.phone,
      },
      merchant: {
        id: result.merchant.id,
        code: result.merchant.code,
        name: result.merchant.name,
        tradingName: result.merchant.tradingName,
        vertical: result.merchant.vertical,
        subVertical: result.merchant.subVertical,
        logo: result.merchant.logo,
        currency: result.merchant.currency,
        vatRate: result.merchant.vatRate,
        vatRegistered: result.merchant.vatRegistered,
        plan: result.merchant.plan,
        planStatus: result.merchant.planStatus,
        status: result.merchant.status,
        onboardingComplete: result.merchant.onboardingComplete,
        onboardingStep: result.merchant.onboardingStep,
      },
      branch: {
        id: result.branch.id,
        code: result.branch.code,
        name: result.branch.name,
        type: result.branch.type,
      },
      role: 'owner',
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, error: 'An error occurred during registration' },
      { status: 500 }
    )
  }
}
