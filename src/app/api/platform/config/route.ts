import { NextRequest, NextResponse } from 'next/server'

// Platform configuration - public settings
// This endpoint returns public configuration for the platform
// No authentication required - these are public settings

interface PlatformFeature {
  id: string
  name: string
  description: string
  enabled: boolean
  requiresPlan: string[]
}

interface PlatformLimit {
  id: string
  name: string
  description: string
  limits: Record<string, number>
}

// GET /api/platform/config - Get platform configuration
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenant = searchParams.get('tenant') || 'default'
    
    // Platform features
    const features: PlatformFeature[] = [
      {
        id: 'merchant_os',
        name: 'Merchant OS',
        description: 'Point of sale and business management system',
        enabled: true,
        requiresPlan: ['starter', 'growth', 'enterprise']
      },
      {
        id: 'gopay',
        name: 'GoPay',
        description: 'Payment processing and merchant services',
        enabled: true,
        requiresPlan: ['starter', 'growth', 'enterprise']
      },
      {
        id: 'grosell',
        name: 'GroSell',
        description: 'WhatsApp-based e-commerce platform',
        enabled: true,
        requiresPlan: ['growth', 'enterprise']
      },
      {
        id: 'consumer_wallet',
        name: 'Consumer Wallet',
        description: 'Digital wallet for consumers',
        enabled: true,
        requiresPlan: ['starter', 'growth', 'enterprise']
      },
      {
        id: 'grocredit',
        name: 'GroCredit',
        description: 'Merchant financing and credit facilities',
        enabled: true,
        requiresPlan: ['growth', 'enterprise']
      },
      {
        id: 'grosupply',
        name: 'GroSupply',
        description: 'B2B wholesale ordering platform',
        enabled: true,
        requiresPlan: ['growth', 'enterprise']
      },
      {
        id: 'loyalty',
        name: 'Loyalty Program',
        description: 'Customer loyalty and rewards',
        enabled: true,
        requiresPlan: ['starter', 'growth', 'enterprise']
      },
      {
        id: 'booking',
        name: 'Booking & Appointments',
        description: 'Service booking and scheduling',
        enabled: true,
        requiresPlan: ['growth', 'enterprise']
      },
      {
        id: 'online_store',
        name: 'Online Store',
        description: 'E-commerce storefront',
        enabled: true,
        requiresPlan: ['growth', 'enterprise']
      },
      {
        id: 'multi_branch',
        name: 'Multi-Branch',
        description: 'Multiple location management',
        enabled: true,
        requiresPlan: ['enterprise']
      },
      {
        id: 'api_access',
        name: 'API Access',
        description: 'REST API access for integrations',
        enabled: true,
        requiresPlan: ['growth', 'enterprise']
      },
      {
        id: 'advanced_reports',
        name: 'Advanced Reports',
        description: 'Advanced analytics and reporting',
        enabled: true,
        requiresPlan: ['enterprise']
      }
    ]
    
    // Platform limits by plan
    const limits: PlatformLimit[] = [
      {
        id: 'users',
        name: 'User Limit',
        description: 'Maximum number of users per tenant',
        limits: {
          starter: 5,
          growth: 25,
          enterprise: 1000
        }
      },
      {
        id: 'merchants',
        name: 'Merchant Limit',
        description: 'Maximum number of merchants per tenant',
        limits: {
          starter: 1,
          growth: 5,
          enterprise: 100
        }
      },
      {
        id: 'products',
        name: 'Product Limit',
        description: 'Maximum number of products per merchant',
        limits: {
          starter: 500,
          growth: 5000,
          enterprise: 50000
        }
      },
      {
        id: 'transactions',
        name: 'Monthly Transactions',
        description: 'Maximum transactions per month',
        limits: {
          starter: 1000,
          growth: 10000,
          enterprise: 1000000
        }
      },
      {
        id: 'storage',
        name: 'Storage Limit',
        description: 'Storage limit in MB',
        limits: {
          starter: 500,
          growth: 5000,
          enterprise: 100000
        }
      },
      {
        id: 'api_calls',
        name: 'API Calls',
        description: 'API calls per month',
        limits: {
          starter: 1000,
          growth: 50000,
          enterprise: 10000000
        }
      }
    ]
    
    // Platform settings
    const settings = {
      currency: 'ZAR',
      currencySymbol: 'R',
      timezone: 'Africa/Johannesburg',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      locale: 'en-ZA',
      vatRate: 15,
      companyRegistration: 'Groway Studios (Pty) Ltd',
      supportEmail: 'support@groway.studio',
      supportPhone: '+27 11 123 4567',
      termsUrl: 'https://groway.studio/terms',
      privacyUrl: 'https://groway.studio/privacy'
    }
    
    // Payment methods supported
    const paymentMethods = [
      { id: 'card', name: 'Card Payment', enabled: true },
      { id: 'eft', name: 'EFT/Bank Transfer', enabled: true },
      { id: 'payshap', name: 'PayShap', enabled: true },
      { id: 'mtn_momo', name: 'MTN MoMo', enabled: true },
      { id: 'vodapay', name: 'VodaPay', enabled: false },
      { id: 'snapscan', name: 'SnapScan', enabled: true },
      { id: 'wallet', name: 'Wallet Balance', enabled: true }
    ]
    
    // Supported verticals
    const verticals = [
      { id: 'fnb', name: 'Food & Beverage', icon: 'utensils' },
      { id: 'liquor', name: 'Liquor Store', icon: 'wine' },
      { id: 'grocery', name: 'Grocery', icon: 'shopping-cart' },
      { id: 'health-beauty', name: 'Health & Beauty', icon: 'sparkles' },
      { id: 'health-pharmacy', name: 'Pharmacy', icon: 'pill' },
      { id: 'fashion', name: 'Fashion', icon: 'shirt' },
      { id: 'electronics', name: 'Electronics', icon: 'smartphone' },
      { id: 'hardware', name: 'Hardware', icon: 'hammer' },
      { id: 'hospitality', name: 'Hospitality', icon: 'bed' },
      { id: 'sport-leisure', name: 'Sport & Leisure', icon: 'dumbbell' },
      { id: 'childcare', name: 'Childcare', icon: 'baby' },
      { id: 'professional', name: 'Professional Services', icon: 'briefcase' }
    ]
    
    // Plans available
    const plans = [
      {
        id: 'starter',
        name: 'Starter',
        price: 0,
        currency: 'ZAR',
        billingCycle: 'monthly',
        features: ['merchant_os', 'consumer_wallet', 'loyalty'],
        limits: {
          users: 5,
          merchants: 1,
          products: 500,
          transactions: 1000
        }
      },
      {
        id: 'growth',
        name: 'Growth',
        price: 499,
        currency: 'ZAR',
        billingCycle: 'monthly',
        features: ['merchant_os', 'gopay', 'grosell', 'consumer_wallet', 'grocredit', 'grosupply', 'loyalty', 'booking', 'online_store', 'api_access'],
        limits: {
          users: 25,
          merchants: 5,
          products: 5000,
          transactions: 10000
        }
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 2999,
        currency: 'ZAR',
        billingCycle: 'monthly',
        features: ['merchant_os', 'gopay', 'grosell', 'consumer_wallet', 'grocredit', 'grosupply', 'loyalty', 'booking', 'online_store', 'multi_branch', 'api_access', 'advanced_reports'],
        limits: {
          users: 1000,
          merchants: 100,
          products: 50000,
          transactions: 1000000
        }
      }
    ]
    
    return NextResponse.json({
      success: true,
      data: {
        features,
        limits,
        settings,
        paymentMethods,
        verticals,
        plans,
        version: '1.0.0',
        buildNumber: process.env.BUILD_NUMBER || 'local'
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        'X-Config-Version': '1.0.0'
      }
    })
  } catch (error) {
    console.error('Platform config error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch platform configuration' },
      { status: 500 }
    )
  }
}
