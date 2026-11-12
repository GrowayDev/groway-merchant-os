import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, getUserId, unauthorizedResponse } from '@/lib/auth-context'

// ============================================
// REWARDS & LOYALTY API
// Points, challenges, tier benefits
// ============================================

// Tier configurations
const tierConfigs = {
  bronze: { name: 'Bronze', minPoints: 0, multiplier: 1, color: '#CD7F32', benefits: ['Basic cashback', 'Birthday bonus'] },
  silver: { name: 'Silver', minPoints: 1500, multiplier: 1.25, color: '#C0C0C0', benefits: ['1.25x points', 'Priority support', 'Monthly bonus'] },
  gold: { name: 'Gold', minPoints: 3000, multiplier: 1.5, color: '#FFD700', benefits: ['1.5x points', 'Exclusive offers', 'Free transfers'] },
  platinum: { name: 'Platinum', minPoints: 5000, multiplier: 2, color: '#E5E4E2', benefits: ['2x points', 'VIP support', 'Premium rewards', 'Fee waivers'] },
  diamond: { name: 'Diamond', minPoints: 10000, multiplier: 2.5, color: '#B9F2FF', benefits: ['2.5x points', 'Concierge service', 'Exclusive events', 'Travel benefits'] },
}

// Available rewards catalog
const rewardsCatalog = [
  { id: 'r1', name: 'R50 Voucher', points: 500, category: 'voucher', icon: '🎟️', popular: true },
  { id: 'r2', name: 'R100 Airtime', points: 900, category: 'airtime', icon: '📱', popular: true },
  { id: 'r3', name: 'Free Transfer', points: 200, category: 'benefit', icon: '💸' },
  { id: 'r4', name: 'Coffee Voucher', points: 300, category: 'voucher', icon: '☕', popular: true },
  { id: 'r5', name: 'R250 Groceries', points: 2500, category: 'voucher', icon: '🛒' },
  { id: 'r6', name: 'Movie Ticket', points: 800, category: 'entertainment', icon: '🎬' },
  { id: 'r7', name: 'R500 Fashion', points: 5000, category: 'voucher', icon: '👗' },
  { id: 'r8', name: 'Uber R100', points: 1000, category: 'transport', icon: '🚗', popular: true },
  { id: 'r9', name: 'Netflix Month', points: 1500, category: 'entertainment', icon: '📺' },
  { id: 'r10', name: 'Spotify Premium', points: 800, category: 'entertainment', icon: '🎵' },
]

// Active challenges
const activeChallenges = [
  { id: 'c1', name: 'Weekend Shopper', description: 'Make 5 payments this weekend', points: 100, progress: 2, target: 5, icon: '🛍️', endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'c2', name: 'Bill Payer', description: 'Pay 3 bills this month', points: 150, progress: 1, target: 3, icon: '📄', endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'c3', name: 'Savings Streak', description: 'Top up your savings 4 weeks in a row', points: 300, progress: 2, target: 4, icon: '💰', endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'c4', name: 'Refer Friends', description: 'Invite 3 friends to join', points: 500, progress: 1, target: 3, icon: '👥', endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
]

// User rewards data
const userRewards = new Map<string, any>()

function initUser(userId: string) {
  if (!userRewards.has(userId)) {
    userRewards.set(userId, {
      points: 2450,
      tier: 'silver',
      totalEarned: 5680,
      totalRedeemed: 3230,
      pendingPoints: 150,
      cashbackEarned: 345,
      transactions: [
        { id: 'pt1', type: 'earned', points: 50, description: 'Payment at Shoprite', date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
        { id: 'pt2', type: 'earned', points: 100, description: 'Bonus points - Silver tier', date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
        { id: 'pt3', type: 'redeemed', points: -200, description: 'Free Transfer redeemed', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'pt4', type: 'earned', points: 75, description: 'Payment at Engen', date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
      ]
    })
  }
}

export async function GET(request: NextRequest) {
  // Get authenticated context
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse()
  }
  
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  
  // Get userId from params or context
  const userIdResult = getUserId(searchParams, context)
  if (userIdResult instanceof NextResponse) {
    return userIdResult
  }
  const userId = userIdResult

  initUser(userId)
  const userData = userRewards.get(userId)

  if (action === 'overview') {
    const tier = tierConfigs[userData.tier as keyof typeof tierConfigs]
    const nextTier = Object.values(tierConfigs).find(t => t.minPoints > userData.points)
    
    return NextResponse.json({
      success: true,
      data: {
        points: userData.points,
        tier: tier.name,
        tierColor: tier.color,
        multiplier: tier.multiplier,
        totalEarned: userData.totalEarned,
        totalRedeemed: userData.totalRedeemed,
        pendingPoints: userData.pendingPoints,
        cashbackEarned: userData.cashbackEarned,
        nextTier: nextTier ? {
          name: nextTier.name,
          pointsNeeded: nextTier.minPoints - userData.points
        } : null,
        benefits: tier.benefits
      }
    })
  }

  if (action === 'catalog') {
    const category = searchParams.get('category')
    let rewards = rewardsCatalog
    if (category) {
      rewards = rewards.filter(r => r.category === category)
    }
    return NextResponse.json({
      success: true,
      rewards,
      categories: ['voucher', 'airtime', 'entertainment', 'transport', 'benefit']
    })
  }

  if (action === 'challenges') {
    return NextResponse.json({
      success: true,
      challenges: activeChallenges
    })
  }

  if (action === 'history') {
    return NextResponse.json({
      success: true,
      transactions: userData.transactions
    })
  }

  if (action === 'tiers') {
    return NextResponse.json({
      success: true,
      tiers: Object.entries(tierConfigs).map(([key, value]) => ({
        id: key,
        ...value
      }))
    })
  }

  return NextResponse.json({
    success: true,
    message: 'Rewards API running',
    endpoints: ['overview', 'catalog', 'challenges', 'history', 'tiers']
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
    const { action, userId: bodyUserId, rewardId, points, description } = body
    
    // Validate userId - use body param or context
    let userId = bodyUserId
    if (!userId) {
      userId = context.userId
    }
    
    // Security check: ensure user can only access their own data
    if (userId !== context.userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    initUser(userId)
    const userData = userRewards.get(userId)

    if (action === 'redeem') {
      const reward = rewardsCatalog.find(r => r.id === rewardId)
      if (!reward) {
        return NextResponse.json({ success: false, error: 'Reward not found' }, { status: 404 })
      }

      if (userData.points < reward.points) {
        return NextResponse.json({ success: false, error: 'Insufficient points' }, { status: 400 })
      }

      // Deduct points and create redemption
      userData.points -= reward.points
      userData.totalRedeemed += reward.points
      userData.transactions.unshift({
        id: `pr-${Date.now()}`,
        type: 'redeemed',
        points: -reward.points,
        description: `${reward.name} redeemed`,
        date: new Date().toISOString()
      })

      return NextResponse.json({
        success: true,
        message: `${reward.name} redeemed successfully!`,
        remainingPoints: userData.points,
        redemption: {
          id: `red-${Date.now()}`,
          rewardId: reward.id,
          rewardName: reward.name,
          points: reward.points,
          code: `GRW-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
          redeemedAt: new Date().toISOString()
        }
      })
    }

    if (action === 'earn') {
      userData.points += points
      userData.totalEarned += points
      userData.transactions.unshift({
        id: `pe-${Date.now()}`,
        type: 'earned',
        points,
        description: description || 'Points earned',
        date: new Date().toISOString()
      })

      // Check tier upgrade
      const newTier = Object.entries(tierConfigs)
        .reverse()
        .find(([_, config]) => userData.points >= config.minPoints)
      
      if (newTier && newTier[0] !== userData.tier) {
        userData.tier = newTier[0]
      }

      return NextResponse.json({
        success: true,
        newBalance: userData.points,
        tier: userData.tier
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to process rewards' }, { status: 500 })
  }
}
