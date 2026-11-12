import { db } from '../src/lib/db'
import { nanoid } from 'nanoid'

async function seed() {
  const now = new Date()
  
  // Check if plans already exist
  const existingPlans = await db.subscriptionPlan.findMany()
  
  if (existingPlans.length > 0) {
    console.log('Plans already seeded:', existingPlans.length)
    return
  }
  
  // Create the 3 subscription plans
  const starter = await db.subscriptionPlan.create({
    data: {
      id: nanoid(),
      code: 'starter',
      name: 'Starter',
      description: 'Perfect for small businesses getting started',
      priceMonthly: 299,
      priceAnnual: 2990,
      currency: 'ZAR',
      maxUsers: 2,
      maxBranches: 1,
      maxProducts: 500,
      maxTransactions: 1000,
      features: JSON.stringify([
        'Point of Sale (POS)',
        'Inventory Management',
        'Basic Reports',
        'Customer Management',
        'Mobile App Access',
        'Email Support'
      ]),
      trialDays: 14,
      isPopular: false,
      sortOrder: 1,
      color: '#6B7280',
      icon: 'Store',
      isActive: true,
      createdAt: now,
      updatedAt: now
    }
  })
  console.log('Created Starter plan:', starter.id)
  
  const pro = await db.subscriptionPlan.create({
    data: {
      id: nanoid(),
      code: 'pro',
      name: 'Pro',
      description: 'For growing businesses with advanced needs',
      priceMonthly: 499,
      priceAnnual: 4990,
      currency: 'ZAR',
      maxUsers: 10,
      maxBranches: 3,
      maxProducts: 5000,
      maxTransactions: 10000,
      features: JSON.stringify([
        'Everything in Starter',
        'Accounting & Finance',
        'Multi-Location Support',
        'Staff Management',
        'Integrations',
        'Loyalty Program',
        'Online Store',
        'Priority Support',
        'WhatsApp Business'
      ]),
      trialDays: 14,
      isPopular: true,
      sortOrder: 2,
      color: '#00897B',
      icon: 'Zap',
      isActive: true,
      createdAt: now,
      updatedAt: now
    }
  })
  console.log('Created Pro plan:', pro.id)
  
  const enterprise = await db.subscriptionPlan.create({
    data: {
      id: nanoid(),
      code: 'enterprise',
      name: 'Enterprise',
      description: 'For large operations with unlimited features',
      priceMonthly: 999,
      priceAnnual: 9990,
      currency: 'ZAR',
      maxUsers: 50,
      maxBranches: 10,
      maxProducts: 50000,
      maxTransactions: 100000,
      features: JSON.stringify([
        'Everything in Pro',
        'API Access',
        'White Label Options',
        'Dedicated Support',
        'Custom Reports',
        'Audit Logs',
        'GroSupply Pro',
        'GroCredit Access',
        'Multi-Company',
        'SSO Authentication'
      ]),
      trialDays: 30,
      isPopular: false,
      sortOrder: 3,
      color: '#7C3AED',
      icon: 'Crown',
      isActive: true,
      createdAt: now,
      updatedAt: now
    }
  })
  console.log('Created Enterprise plan:', enterprise.id)
  
  console.log('All plans seeded successfully!')
}

seed().catch(e => {
  console.error(e)
  process.exit(1)
})
