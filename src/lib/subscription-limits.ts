/**
 * Subscription Plan Limits
 * 
 * Defines limits for different subscription tiers.
 * Used to enforce feature restrictions across the platform.
 */

export type PlanTier = 'starter' | 'growth' | 'pro' | 'enterprise'

export interface PlanLimits {
  // Products & Inventory
  maxProducts: number
  maxCategories: number
  maxBranches: number
  
  // Staff & Users
  maxStaff: number
  maxAdminUsers: number
  
  // Transactions
  maxTransactionsPerMonth: number
  maxTransactionAmount: number
  
  // Features
  hasOnlineStore: boolean
  hasBooking: boolean
  hasDelivery: boolean
  hasMultiLocation: boolean
  hasAdvancedReports: boolean
  hasAPIAccess: boolean
  hasWhiteLabel: boolean
  
  // Integrations
  hasGroSupply: boolean
  hasGroCredit: boolean
  hasGroSell: boolean
  hasGopay: boolean
  
  // Support
  supportLevel: 'community' | 'email' | 'priority' | 'dedicated'
  
  // Pricing
  monthlyPrice: number
  annualPrice: number
}

export const planLimits: Record<PlanTier, PlanLimits> = {
  starter: {
    // Products & Inventory
    maxProducts: 100,
    maxCategories: 10,
    maxBranches: 1,
    
    // Staff & Users
    maxStaff: 3,
    maxAdminUsers: 1,
    
    // Transactions
    maxTransactionsPerMonth: 500,
    maxTransactionAmount: 50000,
    
    // Features
    hasOnlineStore: false,
    hasBooking: false,
    hasDelivery: false,
    hasMultiLocation: false,
    hasAdvancedReports: false,
    hasAPIAccess: false,
    hasWhiteLabel: false,
    
    // Integrations
    hasGroSupply: true,
    hasGroCredit: false,
    hasGroSell: true,
    hasGopay: true,
    
    // Support
    supportLevel: 'community',
    
    // Pricing (ZAR)
    monthlyPrice: 0,
    annualPrice: 0
  },
  
  growth: {
    // Products & Inventory
    maxProducts: 500,
    maxCategories: 25,
    maxBranches: 3,
    
    // Staff & Users
    maxStaff: 10,
    maxAdminUsers: 3,
    
    // Transactions
    maxTransactionsPerMonth: 2000,
    maxTransactionAmount: 200000,
    
    // Features
    hasOnlineStore: true,
    hasBooking: true,
    hasDelivery: false,
    hasMultiLocation: true,
    hasAdvancedReports: true,
    hasAPIAccess: false,
    hasWhiteLabel: false,
    
    // Integrations
    hasGroSupply: true,
    hasGroCredit: true,
    hasGroSell: true,
    hasGopay: true,
    
    // Support
    supportLevel: 'email',
    
    // Pricing (ZAR)
    monthlyPrice: 299,
    annualPrice: 2990
  },
  
  pro: {
    // Products & Inventory
    maxProducts: 2000,
    maxCategories: 50,
    maxBranches: 10,
    
    // Staff & Users
    maxStaff: 25,
    maxAdminUsers: 5,
    
    // Transactions
    maxTransactionsPerMonth: 10000,
    maxTransactionAmount: 1000000,
    
    // Features
    hasOnlineStore: true,
    hasBooking: true,
    hasDelivery: true,
    hasMultiLocation: true,
    hasAdvancedReports: true,
    hasAPIAccess: true,
    hasWhiteLabel: false,
    
    // Integrations
    hasGroSupply: true,
    hasGroCredit: true,
    hasGroSell: true,
    hasGopay: true,
    
    // Support
    supportLevel: 'priority',
    
    // Pricing (ZAR)
    monthlyPrice: 599,
    annualPrice: 5990
  },
  
  enterprise: {
    // Products & Inventory
    maxProducts: -1, // Unlimited
    maxCategories: -1,
    maxBranches: -1,
    
    // Staff & Users
    maxStaff: -1,
    maxAdminUsers: -1,
    
    // Transactions
    maxTransactionsPerMonth: -1,
    maxTransactionAmount: -1,
    
    // Features
    hasOnlineStore: true,
    hasBooking: true,
    hasDelivery: true,
    hasMultiLocation: true,
    hasAdvancedReports: true,
    hasAPIAccess: true,
    hasWhiteLabel: true,
    
    // Integrations
    hasGroSupply: true,
    hasGroCredit: true,
    hasGroSell: true,
    hasGopay: true,
    
    // Support
    supportLevel: 'dedicated',
    
    // Pricing (ZAR) - Custom pricing
    monthlyPrice: 0,
    annualPrice: 0
  }
}

/**
 * Get limits for a specific plan
 */
export function getPlanLimits(plan: string): PlanLimits {
  return planLimits[plan as PlanTier] || planLimits.starter
}

/**
 * Check if a feature is available for a plan
 */
export function hasFeature(plan: string, feature: keyof PlanLimits): boolean {
  const limits = getPlanLimits(plan)
  const value = limits[feature]
  
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  
  return true
}

/**
 * Check if a limit is within bounds
 * Returns true if within limit, false if exceeded
 */
export function checkLimit(
  plan: string, 
  limitType: keyof PlanLimits, 
  currentCount: number
): { withinLimit: boolean; limit: number; remaining: number } {
  const limits = getPlanLimits(plan)
  const limit = limits[limitType] as number
  
  // -1 means unlimited
  if (limit === -1) {
    return { withinLimit: true, limit: -1, remaining: -1 }
  }
  
  const remaining = Math.max(0, limit - currentCount)
  const withinLimit = currentCount < limit
  
  return { withinLimit, limit, remaining }
}

/**
 * Get plan display name
 */
export function getPlanDisplayName(plan: string): string {
  const names: Record<PlanTier, string> = {
    starter: 'Starter',
    growth: 'Growth',
    pro: 'Pro',
    enterprise: 'Enterprise'
  }
  return names[plan as PlanTier] || 'Starter'
}

/**
 * Check if merchant can add more of something
 */
export async function canAddMore(
  plan: string,
  resourceType: 'products' | 'categories' | 'branches' | 'staff' | 'users',
  currentCount: number
): Promise<{ canAdd: boolean; reason?: string; upgradeNeeded?: boolean }> {
  const limitMap: Record<string, keyof PlanLimits> = {
    products: 'maxProducts',
    categories: 'maxCategories',
    branches: 'maxBranches',
    staff: 'maxStaff',
    users: 'maxAdminUsers'
  }
  
  const limitKey = limitMap[resourceType]
  const { withinLimit, limit } = checkLimit(plan, limitKey, currentCount)
  
  if (withinLimit) {
    return { canAdd: true }
  }
  
  const displayName = resourceType.charAt(0).toUpperCase() + resourceType.slice(1)
  
  return {
    canAdd: false,
    reason: limit === -1 
      ? `${displayName} limit reached`
      : `${displayName} limit of ${limit} reached. Upgrade your plan to add more.`,
    upgradeNeeded: true
  }
}

/**
 * Plan features for display in pricing tables
 */
export const planFeatures = {
  starter: [
    'Up to 100 products',
    '1 branch location',
    '3 staff accounts',
    'Basic POS features',
    'GroSupply marketplace access',
    'Gopay payment processing',
    'Community support'
  ],
  growth: [
    'Up to 500 products',
    '3 branch locations',
    '10 staff accounts',
    'Online store',
    'Booking & appointments',
    'Multi-location support',
    'Advanced reports',
    'GroCredit access',
    'Email support'
  ],
  pro: [
    'Up to 2,000 products',
    '10 branch locations',
    '25 staff accounts',
    'Everything in Growth',
    'Delivery management',
    'API access',
    'Priority support',
    'Custom integrations'
  ],
  enterprise: [
    'Unlimited products',
    'Unlimited locations',
    'Unlimited staff',
    'Everything in Pro',
    'White-label options',
    'Dedicated support',
    'Custom development',
    'SLA guarantee'
  ]
}
