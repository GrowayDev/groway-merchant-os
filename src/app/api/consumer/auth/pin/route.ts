import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createHash } from 'crypto'

// Hash PIN for storage
function hashPIN(pin: string): string {
  return createHash('sha256').update(pin).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, pin, confirmPin } = body

    if (!userId || !pin || !confirmPin) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate PIN format
    if (!/^\d{6}$/.test(pin)) {
      return NextResponse.json(
        { success: false, error: 'PIN must be exactly 6 digits' },
        { status: 400 }
      )
    }

    // Check PINs match
    if (pin !== confirmPin) {
      return NextResponse.json(
        { success: false, error: 'PINs do not match' },
        { status: 400 }
      )
    }

    // Validate PIN is not too simple
    const simplePINs = ['000000', '111111', '222222', '333333', '444444', '555555', 
                        '666666', '777777', '888888', '999999', '123456', '654321']
    if (simplePINs.includes(pin)) {
      return NextResponse.json(
        { success: false, error: 'PIN is too simple. Choose a more secure PIN.' },
        { status: 400 }
      )
    }

    // Update user PIN
    const pinHash = hashPIN(pin)
    await db.consumerUser.update({
      where: { id: userId },
      data: { pinHash }
    })

    return NextResponse.json({
      success: true,
      message: 'PIN set successfully'
    })

  } catch (error) {
    console.error('PIN setup error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to set PIN' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, currentPin, newPin, confirmPin } = body

    if (!userId || !currentPin || !newPin || !confirmPin) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Get user
    const user = await db.consumerUser.findUnique({
      where: { id: userId }
    })

    if (!user || !user.pinHash) {
      return NextResponse.json(
        { success: false, error: 'User not found or PIN not set' },
        { status: 400 }
      )
    }

    // Verify current PIN
    const currentPinHash = hashPIN(currentPin)
    if (currentPinHash !== user.pinHash) {
      return NextResponse.json(
        { success: false, error: 'Current PIN is incorrect' },
        { status: 400 }
      )
    }

    // Validate new PIN
    if (!/^\d{6}$/.test(newPin)) {
      return NextResponse.json(
        { success: false, error: 'New PIN must be exactly 6 digits' },
        { status: 400 }
      )
    }

    // Check new PINs match
    if (newPin !== confirmPin) {
      return NextResponse.json(
        { success: false, error: 'New PINs do not match' },
        { status: 400 }
      )
    }

    // Don't allow same PIN
    if (currentPin === newPin) {
      return NextResponse.json(
        { success: false, error: 'New PIN must be different from current PIN' },
        { status: 400 }
      )
    }

    // Update PIN
    const newPinHash = hashPIN(newPin)
    await db.consumerUser.update({
      where: { id: userId },
      data: { pinHash: newPinHash }
    })

    return NextResponse.json({
      success: true,
      message: 'PIN changed successfully'
    })

  } catch (error) {
    console.error('PIN change error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to change PIN' },
      { status: 500 }
    )
  }
}
