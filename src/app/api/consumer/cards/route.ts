import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, getUserId, unauthorizedResponse, badRequestResponse } from '@/lib/auth-context'

// In-memory storage for demo (replace with database in production)
const cardsStore: Map<string, any[]> = new Map()

// GET /api/consumer/cards - Get all cards for a user
export async function GET(request: NextRequest) {
  // Get authenticated context
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse()
  }
  
  const { searchParams } = new URL(request.url)
  
  // Get userId from params or context
  const userIdResult = getUserId(searchParams, context)
  if (userIdResult instanceof NextResponse) {
    return userIdResult
  }
  const userId = userIdResult
  
  // Get existing cards or create demo cards
  let cards = cardsStore.get(userId)
  
  if (!cards) {
    // Demo cards
    cards = [
      {
        id: `card-${userId}-1`,
        type: 'visa',
        cardType: 'virtual',
        lastFour: '4242',
        cardholderName: 'THABO MOLEFE',
        expiryMonth: '12',
        expiryYear: '28',
        cardNumber: '4242424242424242',
        cvv: '123',
        status: 'active',
        onlineEnabled: true,
        contactlessEnabled: true,
        internationalEnabled: false,
        atmEnabled: true,
        spentThisMonthCents: 150000,
        monthlyLimitCents: 500000,
        dailyLimitCents: 20000,
        createdAt: new Date().toISOString(),
        color: 'green',
      }
    ]
    cardsStore.set(userId, cards)
  }
  
  return NextResponse.json({
    success: true,
    data: cards
  })
}

// POST /api/consumer/cards - Create a new virtual card
export async function POST(request: NextRequest) {
  try {
    // Get authenticated context
    const context = await getAuthContext(request)
    if (!context) {
      return unauthorizedResponse()
    }
    
    const body = await request.json()
    const { userId: bodyUserId, cardType = 'visa', monthlyLimit = 500000 } = body
    
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
    
    // Generate card details
    const cardNumber = generateCardNumber(cardType)
    const cvv = generateCVV()
    const expiryMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')
    const expiryYear = String(new Date().getFullYear() + 4).slice(-2)
    
    const newCard = {
      id: `card-${userId}-${Date.now()}`,
      type: cardType,
      cardType: 'virtual',
      lastFour: cardNumber.slice(-4),
      cardholderName: body.cardholderName?.toUpperCase() || 'GROWAY USER',
      expiryMonth,
      expiryYear,
      cardNumber,
      cvv,
      status: 'active',
      onlineEnabled: true,
      contactlessEnabled: true,
      internationalEnabled: false,
      atmEnabled: false,
      spentThisMonthCents: 0,
      monthlyLimitCents: monthlyLimit,
      dailyLimitCents: 20000,
      createdAt: new Date().toISOString(),
      color: ['green', 'blue', 'purple', 'orange'][Math.floor(Math.random() * 4)],
    }
    
    // Get existing cards and add new one
    let cards = cardsStore.get(userId) || []
    cards.push(newCard)
    cardsStore.set(userId, cards)
    
    return NextResponse.json({
      success: true,
      data: newCard,
      message: 'Virtual card created successfully'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to create card'
    }, { status: 500 })
  }
}

// PATCH /api/consumer/cards - Update card settings
export async function PATCH(request: NextRequest) {
  try {
    // Get authenticated context
    const context = await getAuthContext(request)
    if (!context) {
      return unauthorizedResponse()
    }
    
    const body = await request.json()
    const { userId: bodyUserId, cardId, updates } = body
    
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
    
    let cards = cardsStore.get(userId) || []
    const cardIndex = cards.findIndex(c => c.id === cardId)
    
    if (cardIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Card not found'
      }, { status: 404 })
    }
    
    // Update allowed fields
    const allowedUpdates = ['status', 'onlineEnabled', 'contactlessEnabled', 'internationalEnabled', 'atmEnabled', 'monthlyLimitCents', 'dailyLimitCents']
    
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        cards[cardIndex][key] = updates[key]
      }
    }
    
    cardsStore.set(userId, cards)
    
    return NextResponse.json({
      success: true,
      data: cards[cardIndex],
      message: 'Card updated successfully'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to update card'
    }, { status: 500 })
  }
}

// DELETE /api/consumer/cards - Delete/terminate a card
export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated context
    const context = await getAuthContext(request)
    if (!context) {
      return unauthorizedResponse()
    }
    
    const { searchParams } = new URL(request.url)
    
    // Get userId from params or context
    const userIdResult = getUserId(searchParams, context)
    if (userIdResult instanceof NextResponse) {
      return userIdResult
    }
    const userId = userIdResult
    
    const cardId = searchParams.get('cardId')
    
    if (!cardId) {
      return NextResponse.json({
        success: false,
        error: 'Card ID required'
      }, { status: 400 })
    }
    
    let cards = cardsStore.get(userId) || []
    const cardIndex = cards.findIndex(c => c.id === cardId)
    
    if (cardIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Card not found'
      }, { status: 404 })
    }
    
    // Mark as terminated instead of removing
    cards[cardIndex].status = 'terminated'
    cards[cardIndex].terminatedAt = new Date().toISOString()
    
    cardsStore.set(userId, cards)
    
    return NextResponse.json({
      success: true,
      message: 'Card terminated successfully'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to terminate card'
    }, { status: 500 })
  }
}

function generateCardNumber(type: string): string {
  if (type === 'visa') {
    return '4' + Array(15).fill(0).map(() => Math.floor(Math.random() * 10)).join('')
  } else if (type === 'mastercard') {
    const prefix = ['51', '52', '53', '54', '55'][Math.floor(Math.random() * 5)]
    return prefix + Array(14).fill(0).map(() => Math.floor(Math.random() * 10)).join('')
  }
  return '4' + Array(15).fill(0).map(() => Math.floor(Math.random() * 10)).join('')
}

function generateCVV(): string {
  return String(Math.floor(Math.random() * 900) + 100)
}
