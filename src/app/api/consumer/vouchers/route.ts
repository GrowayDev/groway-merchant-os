import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, getUserId, unauthorizedResponse } from '@/lib/auth-context'

// ============================================
// VOUCHER MARKETPLACE API
// Gift cards, vouchers, and digital goods
// ============================================

// Voucher providers and categories
const voucherProviders = {
  groceries: [
    { id: 'checkers', name: 'Checkers', logo: 'CHK', minAmount: 50, maxAmount: 5000, popular: true },
    { id: 'shoprite', name: 'Shoprite', logo: 'SHP', minAmount: 50, maxAmount: 5000, popular: true },
    { id: 'woolworths', name: 'Woolworths', logo: 'WW', minAmount: 100, maxAmount: 10000 },
    { id: 'picknpay', name: 'Pick n Pay', logo: 'PnP', minAmount: 50, maxAmount: 5000 },
    { id: 'spar', name: 'Spar', logo: 'SPR', minAmount: 50, maxAmount: 3000 },
  ],
  fashion: [
    { id: 'truworths', name: 'Truworths', logo: 'TRU', minAmount: 100, maxAmount: 10000 },
    { id: 'foschini', name: 'Foschini', logo: 'TFG', minAmount: 100, maxAmount: 10000 },
    { id: 'edgars', name: 'Edgars', logo: 'EDG', minAmount: 100, maxAmount: 10000 },
    { id: 'jet', name: 'Jet', logo: 'JET', minAmount: 50, maxAmount: 5000 },
    { id: 'mrprice', name: 'Mr Price', logo: 'MRP', minAmount: 50, maxAmount: 5000, popular: true },
  ],
  electronics: [
    { id: 'istore', name: 'iStore', logo: '🍎', minAmount: 200, maxAmount: 50000 },
    { id: 'samsung', name: 'Samsung', logo: 'SAM', minAmount: 200, maxAmount: 50000 },
    { id: 'makro', name: 'Makro', logo: 'MKR', minAmount: 100, maxAmount: 20000, popular: true },
    { id: 'game', name: 'Game', logo: 'GME', minAmount: 100, maxAmount: 20000 },
  ],
  entertainment: [
    { id: 'spotify', name: 'Spotify', logo: '🎵', minAmount: 15, maxAmount: 200, popular: true },
    { id: 'netflix', name: 'Netflix', logo: 'N', minAmount: 99, maxAmount: 400 },
    { id: 'showmax', name: 'Showmax', logo: 'SHW', minAmount: 99, maxAmount: 500 },
    { id: 'dstv', name: 'DStv', logo: 'DST', minAmount: 100, maxAmount: 2000 },
  ],
  dining: [
    { id: 'nandos', name: "Nando's", logo: '🌶️', minAmount: 50, maxAmount: 1000, popular: true },
    { id: 'steers', name: 'Steers', logo: 'ST', minAmount: 30, maxAmount: 500 },
    { id: 'kfc', name: 'KFC', logo: 'KFC', minAmount: 30, maxAmount: 500 },
    { id: 'spur', name: 'Spur', logo: 'SPR', minAmount: 100, maxAmount: 2000 },
  ],
  fuel: [
    { id: 'shell', name: 'Shell', logo: '⛽', minAmount: 100, maxAmount: 5000, popular: true },
    { id: 'bp', name: 'BP', logo: 'BP', minAmount: 100, maxAmount: 5000 },
    { id: 'engen', name: 'Engen', logo: 'ENG', minAmount: 100, maxAmount: 5000 },
    { id: 'sasol', name: 'Sasol', logo: 'SAS', minAmount: 100, maxAmount: 5000 },
  ],
}

// User vouchers storage (in production, use database)
const userVouchers = new Map<string, any[]>()

export async function GET(request: NextRequest) {
  // Get authenticated context
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse()
  }
  
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const category = searchParams.get('category')
  
  // Get userId from params or context
  const userIdResult = getUserId(searchParams, context as any)
  if (userIdResult instanceof NextResponse) {
    return userIdResult
  }
  const userId = userIdResult

  if (action === 'categories') {
    return NextResponse.json({
      success: true,
      categories: Object.keys(voucherProviders).map(key => ({
        id: key,
        name: key.charAt(0).toUpperCase() + key.slice(1),
        count: voucherProviders[key as keyof typeof voucherProviders].length
      }))
    })
  }

  if (action === 'providers') {
    if (category && voucherProviders[category as keyof typeof voucherProviders]) {
      return NextResponse.json({
        success: true,
        category,
        providers: voucherProviders[category as keyof typeof voucherProviders]
      })
    }
    
    // Return all providers
    return NextResponse.json({
      success: true,
      providers: voucherProviders
    })
  }

  if (action === 'my-vouchers') {
    const vouchers = userVouchers.get(userId) || []
    return NextResponse.json({
      success: true,
      vouchers,
      totalValue: vouchers.reduce((sum, v) => sum + v.amount, 0)
    })
  }

  if (action === 'popular') {
    const popular = Object.values(voucherProviders).flat().filter(p => p.popular)
    return NextResponse.json({
      success: true,
      providers: popular
    })
  }

  return NextResponse.json({
    success: true,
    message: 'Voucher API running',
    endpoints: ['categories', 'providers', 'my-vouchers', 'popular']
  })
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated context
    const context = await getAuthContext(request)
    if (!context) {
      return unauthorizedResponse()
    }
    
    const body = await request.json()
    const { action, userId: bodyUserId, providerId, amount, recipientPhone, recipientName } = body
    
    // Validate userId - use body param or context
    let userId = bodyUserId
    if (!userId) {
      userId = (context as any).userId
    }
    
    // Security check: ensure user can only access their own data
    if (userId !== (context as any).userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    if (action === 'purchase') {
      // Find provider
      let provider: any = null
      for (const providers of Object.values(voucherProviders)) {
        provider = providers.find(p => p.id === providerId)
        if (provider) break
      }

      if (!provider) {
        return NextResponse.json({
          success: false,
          error: 'Provider not found'
        }, { status: 404 })
      }

      // Validate amount
      if (amount < provider.minAmount || amount > provider.maxAmount) {
        return NextResponse.json({
          success: false,
          error: `Amount must be between R${provider.minAmount} and R${provider.maxAmount}`
        }, { status: 400 })
      }

      // Generate voucher
      const voucher = {
        id: `voucher-${Date.now()}`,
        providerId,
        providerName: provider.name,
        amount,
        code: `${provider.logo}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        pin: Math.floor(1000 + Math.random() * 9000).toString(),
        recipientPhone,
        recipientName,
        purchasedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      }

      // Store voucher
      const userVoucherList = userVouchers.get(userId) || []
      userVoucherList.push(voucher)
      userVouchers.set(userId, userVoucherList)

      return NextResponse.json({
        success: true,
        voucher,
        message: `Voucher purchased successfully for ${provider.name}`
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to process voucher request'
    }, { status: 500 })
  }
}
