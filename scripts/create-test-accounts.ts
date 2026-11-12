import { db } from '../src/lib/db'
import { nanoid } from 'nanoid'
import * as bcrypt from 'bcryptjs'

// Business verticals data
const verticalMappings: Record<string, { vertical: string; subVertical: string }> = {
  'Burger King': { vertical: 'food_beverage', subVertical: 'QSR' },
  'The Salon': { vertical: 'health_beauty', subVertical: 'Hair Salon' },
  'City Pharmacy': { vertical: 'health_pharmacy', subVertical: 'Full Pharmacy' },
}

async function createTestAccounts() {
  console.log('🚀 Creating 3 test accounts to demonstrate signup flow...\n')
  
  const plans = await db.subscriptionPlan.findMany({ orderBy: { sortOrder: 'asc' } })
  
  if (plans.length === 0) {
    console.error('❌ No subscription plans found. Run seed-plans.ts first.')
    return
  }
  
  // Test account configurations
  const testAccounts = [
    {
      name: 'John Starter',
      email: 'john@starter.com',
      phone: '+27 11 111 1111',
      password: 'Starter123!',
      businessName: 'Burger King',
      planCode: 'starter',
    },
    {
      name: 'Sarah Pro',
      email: 'sarah@pro.com',
      phone: '+27 22 222 2222',
      password: 'Pro456!@',
      businessName: 'The Salon',
      planCode: 'pro',
    },
    {
      name: 'Mike Enterprise',
      email: 'mike@enterprise.com',
      phone: '+27 33 333 3333',
      password: 'Enterprise789!',
      businessName: 'City Pharmacy',
      planCode: 'enterprise',
    },
  ]
  
  for (const account of testAccounts) {
    console.log(`\n📝 Creating account for ${account.name} (${account.planCode} plan)...`)
    
    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { email: account.email.toLowerCase() }
    })
    
    if (existingUser) {
      console.log(`   ⚠️  User ${account.email} already exists, skipping...`)
      continue
    }
    
    const plan = plans.find(p => p.code === account.planCode)
    if (!plan) {
      console.log(`   ❌ Plan ${account.planCode} not found`)
      continue
    }
    
    const verticalData = verticalMappings[account.businessName]
    if (!verticalData) {
      console.log(`   ❌ Vertical mapping not found for ${account.businessName}`)
      continue
    }
    
    const passwordHash = await bcrypt.hash(account.password, 12)
    const merchantCode = nanoid(6).toUpperCase()
    const trialEndsAt = new Date(Date.now() + plan.trialDays * 24 * 60 * 60 * 1000)
    const now = new Date()
    
    try {
      const result = await db.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            id: nanoid(),
            email: account.email.toLowerCase(),
            name: account.name,
            phone: account.phone,
            passwordHash,
            authProvider: 'email',
            updatedAt: now,
          },
        })
        
        // Create merchant
        const merchant = await tx.merchant.create({
          data: {
            id: nanoid(),
            code: merchantCode,
            name: account.businessName,
            tradingName: account.businessName,
            vertical: verticalData.vertical,
            subVertical: verticalData.subVertical,
            status: 'active',
            plan: plan.code,
            planStatus: 'trial',
            trialEndsAt,
            onboardingComplete: false,
            onboardingStep: 'welcome',
            updatedAt: now,
          },
        })
        
        // Create merchant subscription
        await tx.merchantSubscription.create({
          data: {
            id: nanoid(),
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
        
        // Create default branch
        const branch = await tx.branch.create({
          data: {
            id: nanoid(),
            merchantId: merchant.id,
            code: 'HQ',
            name: 'Main Branch',
            type: 'headquarters',
            isActive: true,
            isDefault: true,
            updatedAt: now,
          },
        })
        
        // Create merchant user
        await tx.merchantUser.create({
          data: {
            id: nanoid(),
            merchantId: merchant.id,
            userId: user.id,
            role: 'owner',
            branchId: branch.id,
            isActive: true,
            acceptedAt: new Date(),
            updatedAt: now,
          },
        })
        
        return { user, merchant, branch, plan }
      })
      
      console.log(`   ✅ Account created successfully!`)
      console.log(`   📧 Email: ${account.email}`)
      console.log(`   🔑 Password: ${account.password}`)
      console.log(`   🏪 Business: ${account.businessName} (${merchantCode})`)
      console.log(`   📦 Plan: ${plan.name} (R${plan.priceMonthly}/month)`)
      console.log(`   ⏰ Trial ends: ${trialEndsAt.toDateString()}`)
      
    } catch (error) {
      console.error(`   ❌ Failed to create account:`, error)
    }
  }
  
  console.log('\n\n🎉 Test accounts creation complete!')
  console.log('\n📋 Summary:')
  console.log('   - All accounts are in trial mode')
  console.log('   - You can log in with the credentials above')
  console.log('   - Each account demonstrates a different subscription tier')
  
  await db.$disconnect()
}

createTestAccounts().catch(console.error)
