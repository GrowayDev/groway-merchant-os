import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, unauthorizedResponse, badRequestResponse } from '@/lib/auth-context'

// ============================================
// MERCHANT OFFERS API
// Discounts, deals, and promotions
// SECURITY: All endpoints require authentication
// ============================================

// Sample offers data
const offersData = [
  {
    id: 'offer-1',
    merchantId: 'java-jungle',
    merchantName: 'Java Jungle Cafe',
    merchantInitials: 'JJ',
    merchantColor: '#8B4513',
    title: 'Morning Brew Special',
    description: 'Get 20% off any coffee beverage before 10am. Start your day with premium brews at a discount!',
    discountType: 'percentage',
    discountValue: 20,
    originalPrice: null,
    discountedPrice: null,
    category: 'food',
    tags: ['coffee', 'breakfast', 'morning'],
    distance: 0.3,
    expiresIn: '2h 30m',
    expiresAt: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString(),
    terms: 'Valid before 10am only. Not combinable with other offers. Single use per customer.',
    code: 'MORNING20',
    isActive: true,
    isFlash: false,
    clipped: false,
    redeemed: false,
  },
  {
    id: 'offer-2',
    merchantId: 'urban-style',
    merchantName: 'Urban Style Boutique',
    merchantInitials: 'US',
    merchantColor: '#E91E63',
    title: 'Flash Sale - 50% Off',
    description: 'Limited time flash sale! 50% off selected items. Grab the latest fashion trends at half price.',
    discountType: 'percentage',
    discountValue: 50,
    originalPrice: 599,
    discountedPrice: 299,
    category: 'shopping',
    tags: ['fashion', 'clothing', 'sale'],
    distance: 0.8,
    expiresIn: '3h',
    expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    terms: 'Selected items only. While stocks last. No exchanges on sale items.',
    code: 'FLASH50',
    isActive: true,
    isFlash: true,
    clipped: false,
    redeemed: false,
  },
  {
    id: 'offer-3',
    merchantId: 'braai-grill',
    merchantName: 'Braai & Grill House',
    merchantInitials: 'BG',
    merchantColor: '#FF5722',
    title: 'Buy 1 Get 1 Free',
    description: 'BOGO special on all main courses! Bring a friend and enjoy our legendary braai together.',
    discountType: 'bogo',
    discountValue: 100,
    originalPrice: null,
    discountedPrice: null,
    category: 'food',
    tags: ['restaurant', 'braai', 'dinner'],
    distance: 1.2,
    expiresIn: 'Today',
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    terms: 'Dine-in only. Equal or lesser value item free. Valid today only.',
    code: 'BOGO24',
    isActive: true,
    isFlash: false,
    clipped: false,
    redeemed: false,
  },
  {
    id: 'offer-4',
    merchantId: 'techzone',
    merchantName: 'TechZone Electronics',
    merchantInitials: 'TZ',
    merchantColor: '#2196F3',
    title: 'R500 Off Smartphones',
    description: 'Get R500 off any smartphone purchase over R5000. Upgrade your device today!',
    discountType: 'fixed',
    discountValue: 500,
    originalPrice: 6999,
    discountedPrice: 6499,
    category: 'shopping',
    tags: ['electronics', 'phones', 'tech'],
    distance: 2.1,
    expiresIn: '5 days',
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    terms: 'Minimum purchase R5000. One per customer. Cannot be combined with other offers.',
    code: 'TECH500',
    isActive: true,
    isFlash: false,
    clipped: false,
    redeemed: false,
  },
  {
    id: 'offer-5',
    merchantId: 'freshmart',
    merchantName: 'FreshMart Groceries',
    merchantInitials: 'FM',
    merchantColor: '#4CAF50',
    title: 'Double Cashback Weekend',
    description: 'Earn 2X cashback on all grocery purchases this weekend. Stock up and save more!',
    discountType: 'cashback',
    discountValue: 2,
    originalPrice: null,
    discountedPrice: null,
    category: 'food',
    tags: ['groceries', 'cashback', 'weekend'],
    distance: 0.5,
    expiresIn: '2 days',
    expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    terms: 'Cashback credited to Groway wallet. Valid Saturday & Sunday only. Max R200 cashback.',
    code: '2XCASH',
    isActive: true,
    isFlash: false,
    clipped: false,
    redeemed: false,
  },
  {
    id: 'offer-6',
    merchantId: 'shell-garage',
    merchantName: 'Shell Garage',
    merchantInitials: 'SHL',
    merchantColor: '#FBCE07',
    title: 'R2/L Off Fuel',
    description: 'Save R2 per liter on all fuel purchases. Fill up and save big on your commute!',
    discountType: 'fixed',
    discountValue: 2,
    originalPrice: null,
    discountedPrice: null,
    category: 'fuel',
    tags: ['fuel', 'automotive', 'travel'],
    distance: 1.8,
    expiresIn: '6 hours',
    expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    terms: 'Maximum 100 liters. Valid today only. Groway wallet payment required.',
    code: 'FUEL2',
    isActive: true,
    isFlash: true,
    clipped: false,
    redeemed: false,
  },
  {
    id: 'offer-7',
    merchantId: 'clicks-pharmacy',
    merchantName: 'Clicks Pharmacy',
    merchantInitials: 'CLK',
    merchantColor: '#00897B',
    title: '30% Off Skincare',
    description: 'Get 30% off all skincare products this week. Pamper yourself for less!',
    discountType: 'percentage',
    discountValue: 30,
    originalPrice: null,
    discountedPrice: null,
    category: 'beauty',
    tags: ['beauty', 'skincare', 'health'],
    distance: 0.4,
    expiresIn: '4 days',
    expiresAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    terms: 'Valid on selected brands. ClubCard members get additional 5% off.',
    code: 'GLOW30',
    isActive: true,
    isFlash: false,
    clipped: false,
    redeemed: false,
  },
  {
    id: 'offer-8',
    merchantId: 'nandos-sandton',
    merchantName: "Nando's Sandton",
    merchantInitials: 'NAN',
    merchantColor: '#E31837',
    title: 'Free Chicken Wing Bucket',
    description: 'Order any full platter and get a free 6-piece chicken wing bucket on the house!',
    discountType: 'freebie',
    discountValue: 89,
    originalPrice: 89,
    discountedPrice: 0,
    category: 'food',
    tags: ['restaurant', 'chicken', 'portuguese'],
    distance: 0.7,
    expiresIn: '3 days',
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    terms: 'Dine-in or takeout. Must order full platter. While stocks last.',
    code: 'WINGME',
    isActive: true,
    isFlash: false,
    clipped: false,
    redeemed: false,
  },
]

// User clipped offers (in-memory store - use database in production)
const userClippedOffers = new Map<string, Set<string>>()

/**
 * GET /api/consumer/offers
 * 
 * SECURITY: Requires authentication
 * - userId is extracted from authenticated context, NOT from query params
 * - This prevents IDOR attacks where users could access other users' clipped offers
 */
export async function GET(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse('Authentication required to access offers')
  }

  // Get userId from authenticated context - NO HARDCODED DEFAULTS
  const userId = context.userId
  
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const category = searchParams.get('category')
  const offerId = searchParams.get('offerId')

  if (action === 'offers') {
    let offers = offersData
    const clippedIds = userClippedOffers.get(userId) || new Set()
    
    // Add clipped status for this user
    offers = offers.map(o => ({ ...o, clipped: clippedIds.has(o.id) }))
    
    // Filter by category
    if (category && category !== 'all') {
      offers = offers.filter(o => o.category === category)
    }
    
    return NextResponse.json({
      success: true,
      offers,
      categories: [
        { id: 'all', name: 'All Offers', icon: '🏷️' },
        { id: 'food', name: 'Food & Dining', icon: '🍔' },
        { id: 'shopping', name: 'Shopping', icon: '🛍️' },
        { id: 'fuel', name: 'Fuel', icon: '⛽' },
        { id: 'beauty', name: 'Beauty & Health', icon: '💄' },
        { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
      ]
    })
  }

  if (action === 'offer' && offerId) {
    const offer = offersData.find(o => o.id === offerId)
    if (!offer) {
      return NextResponse.json({ success: false, error: 'Offer not found' }, { status: 404 })
    }
    const clippedIds = userClippedOffers.get(userId) || new Set()
    return NextResponse.json({
      success: true,
      offer: { ...offer, clipped: clippedIds.has(offer.id) }
    })
  }

  if (action === 'clipped') {
    // Return offers clipped by the authenticated user
    const clippedIds = userClippedOffers.get(userId) || new Set()
    const clippedOffers = offersData
      .filter(o => clippedIds.has(o.id))
      .map(o => ({ ...o, clipped: true }))
    
    return NextResponse.json({
      success: true,
      offers: clippedOffers,
      count: clippedOffers.length,
      userId // Return userId so client knows whose offers these are
    })
  }

  if (action === 'nearby') {
    const lat = parseFloat(searchParams.get('lat') || '-26.2041')
    const lng = parseFloat(searchParams.get('lng') || '28.0473')
    const radius = parseFloat(searchParams.get('radius') || '5')
    
    // Filter by distance (simplified)
    const nearbyOffers = offersData.filter(o => o.distance <= radius)
    
    return NextResponse.json({
      success: true,
      offers: nearbyOffers,
      location: { lat, lng },
      radius
    })
  }

  if (action === 'flash') {
    const flashOffers = offersData.filter(o => o.isFlash && o.isActive)
    return NextResponse.json({
      success: true,
      offers: flashOffers
    })
  }

  if (action === 'categories') {
    return NextResponse.json({
      success: true,
      categories: [
        { id: 'all', name: 'All Offers', icon: '🏷️' },
        { id: 'food', name: 'Food & Dining', icon: '🍔' },
        { id: 'shopping', name: 'Shopping', icon: '🛍️' },
        { id: 'fuel', name: 'Fuel', icon: '⛽' },
        { id: 'beauty', name: 'Beauty & Health', icon: '💄' },
        { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
      ]
    })
  }

  return NextResponse.json({
    success: true,
    message: 'Offers API running',
    endpoints: ['offers', 'offer', 'clipped', 'nearby', 'flash', 'categories']
  })
}

/**
 * POST /api/consumer/offers
 * 
 * SECURITY: Requires authentication
 * - userId is extracted from authenticated context, NOT from request body
 * - This prevents users from clipping offers for other users
 */
export async function POST(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse('Authentication required to manage offers')
  }

  // Get userId from authenticated context - NO HARDCODED DEFAULTS
  const userId = context.userId
  
  try {
    const body = await request.json()
    const { action, offerId } = body

    // Validate required parameters
    if (!action) {
      return badRequestResponse('Action is required')
    }
    if (!offerId && action !== 'list') {
      return badRequestResponse('Offer ID is required')
    }

    if (action === 'clip') {
      const offer = offersData.find(o => o.id === offerId)
      if (!offer) {
        return NextResponse.json({ success: false, error: 'Offer not found' }, { status: 404 })
      }

      const clippedIds = userClippedOffers.get(userId) || new Set()
      clippedIds.add(offerId)
      userClippedOffers.set(userId, clippedIds)

      return NextResponse.json({
        success: true,
        message: `Offer "${offer.title}" clipped successfully!`,
        clippedCount: clippedIds.size,
        userId // Confirm which user this was clipped for
      })
    }

    if (action === 'unclip') {
      const clippedIds = userClippedOffers.get(userId)
      if (clippedIds) {
        clippedIds.delete(offerId)
      }

      return NextResponse.json({
        success: true,
        message: 'Offer removed from your wallet',
        userId
      })
    }

    if (action === 'redeem') {
      const clippedIds = userClippedOffers.get(userId)
      if (!clippedIds || !clippedIds.has(offerId)) {
        return NextResponse.json({ success: false, error: 'Offer not clipped' }, { status: 400 })
      }

      const offer = offersData.find(o => o.id === offerId)
      if (!offer) {
        return NextResponse.json({ success: false, error: 'Offer not found' }, { status: 404 })
      }

      // Remove from clipped
      clippedIds.delete(offerId)

      return NextResponse.json({
        success: true,
        message: `Offer "${offer.title}" redeemed!`,
        code: offer.code,
        discount: offer.discountValue,
        discountType: offer.discountType,
        userId
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error processing offer:', error)
    return NextResponse.json({ success: false, error: 'Failed to process offer' }, { status: 500 })
  }
}
