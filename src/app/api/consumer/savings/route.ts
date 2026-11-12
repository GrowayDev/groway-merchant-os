import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch all savings pockets for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Fetch from database
    const pockets = await db.savingsPocket.findMany({
      where: { userId, status: 'active' },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate total saved
    const totalSaved = pockets.reduce((sum, p) => sum + Number(p.currentCents), 0)

    return NextResponse.json({
      success: true,
      data: {
        pockets: pockets.map(p => ({
          id: p.id,
          userId: p.userId,
          name: p.name,
          icon: p.icon,
          color: p.color,
          targetCents: p.targetCents?.toString() || null,
          currentCents: p.currentCents.toString(),
          interestRate: p.interestRate,
          interestEarned: p.interestEarned.toString(),
          autoSaveRule: p.autoSaveRule,
          targetDate: p.targetDate,
          status: p.status,
          createdAt: p.createdAt,
          progress: p.targetCents ? (Number(p.currentCents) / Number(p.targetCents)) * 100 : null
        })),
        totalSaved: totalSaved.toString(),
        totalPockets: pockets.length
      }
    })

  } catch (error) {
    console.error('Get savings pockets error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get savings pockets' },
      { status: 500 }
    )
  }
}

// POST - Create a new savings pocket
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId, 
      name, 
      targetCents, 
      color, 
      icon,
      autoSaveRule, 
      targetDate 
    } = body

    if (!userId || !name) {
      return NextResponse.json(
        { success: false, error: 'User ID and name are required' },
        { status: 400 }
      )
    }

    // Check user exists
    const user = await db.consumerUser.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Create pocket in database
    const pocket = await db.savingsPocket.create({
      data: {
        id: `pocket-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        userId,
        name,
        icon: icon || 'wallet',
        color: color || '#00897B',
        targetCents: targetCents ? BigInt(targetCents) : null,
        currentCents: BigInt(0),
        interestRate: 0.05, // 5% annual interest
        interestEarned: BigInt(0),
        autoSaveRule: autoSaveRule || null,
        targetDate: targetDate || null,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Savings pocket created successfully',
      data: {
        id: pocket.id,
        name: pocket.name,
        icon: pocket.icon,
        color: pocket.color,
        targetCents: pocket.targetCents?.toString() || null,
        currentCents: pocket.currentCents.toString(),
        interestRate: pocket.interestRate,
        autoSaveRule: pocket.autoSaveRule,
        targetDate: pocket.targetDate,
        createdAt: pocket.createdAt
      }
    })

  } catch (error) {
    console.error('Create savings pocket error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create savings pocket' },
      { status: 500 }
    )
  }
}

// PUT - Deposit to or withdraw from a savings pocket
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { pocketId, action, amountCents, userId } = body

    if (!pocketId || !action || !amountCents || !userId) {
      return NextResponse.json(
        { success: false, error: 'Pocket ID, action, amount, and user ID are required' },
        { status: 400 }
      )
    }

    if (!['deposit', 'withdraw'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Action must be "deposit" or "withdraw"' },
        { status: 400 }
      )
    }

    const amount = BigInt(amountCents)
    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Get pocket
    const pocket = await db.savingsPocket.findUnique({
      where: { id: pocketId }
    })

    if (!pocket || pocket.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Pocket not found' },
        { status: 404 }
      )
    }

    // Get user wallet
    const user = await db.consumerUser.findUnique({
      where: { id: userId },
      include: { wallet: true }
    })

    if (!user || !user.wallet) {
      return NextResponse.json(
        { success: false, error: 'User wallet not found' },
        { status: 404 }
      )
    }

    if (action === 'deposit') {
      // Check wallet balance
      if (user.wallet.balanceCents < amount) {
        return NextResponse.json(
          { success: false, error: 'Insufficient funds in wallet' },
          { status: 400 }
        )
      }

      // Deduct from wallet
      await db.consumerWallet.update({
        where: { userId },
        data: {
          balanceCents: { decrement: amount }
        }
      })

      // Add to pocket
      await db.savingsPocket.update({
        where: { id: pocketId },
        data: {
          currentCents: { increment: amount },
          updatedAt: new Date()
        }
      })

      // Create transaction
      await db.consumerTransaction.create({
        data: {
          id: `ctx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          idempotencyKey: `sav-dep-${Date.now()}`,
          userId,
          transactionType: 'savings_deposit',
          direction: 'debit',
          amountCents: amount,
          feeCents: BigInt(0),
          netAmountCents: amount,
          currency: 'ZAR',
          status: 'completed',
          description: `Deposit to ${pocket.name}`,
          reference: `SAV${Date.now()}`,
          category: 'savings',
          paymentMethod: 'wallet',
          completedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      })

    } else {
      // Withdraw
      // Check pocket balance
      if (pocket.currentCents < amount) {
        return NextResponse.json(
          { success: false, error: 'Insufficient funds in savings pocket' },
          { status: 400 }
        )
      }

      // Deduct from pocket
      await db.savingsPocket.update({
        where: { id: pocketId },
        data: {
          currentCents: { decrement: amount },
          updatedAt: new Date()
        }
      })

      // Add to wallet
      await db.consumerWallet.update({
        where: { userId },
        data: {
          balanceCents: { increment: amount }
        }
      })

      // Create transaction
      await db.consumerTransaction.create({
        data: {
          id: `ctx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          idempotencyKey: `sav-wdr-${Date.now()}`,
          userId,
          transactionType: 'savings_withdrawal',
          direction: 'credit',
          amountCents: amount,
          feeCents: BigInt(0),
          netAmountCents: amount,
          currency: 'ZAR',
          status: 'completed',
          description: `Withdrawal from ${pocket.name}`,
          reference: `SAVW${Date.now()}`,
          category: 'savings',
          paymentMethod: 'wallet',
          completedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      })
    }

    // Get updated pocket
    const updatedPocket = await db.savingsPocket.findUnique({
      where: { id: pocketId }
    })

    return NextResponse.json({
      success: true,
      message: `${action === 'deposit' ? 'Deposit' : 'Withdrawal'} successful`,
      data: {
        pocketId,
        newBalance: updatedPocket?.currentCents.toString(),
        action,
        amountCents: amount.toString()
      }
    })

  } catch (error) {
    console.error('Savings operation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process savings operation' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a savings pocket
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pocketId = searchParams.get('pocketId')
    const userId = searchParams.get('userId')

    if (!pocketId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Pocket ID and User ID are required' },
        { status: 400 }
      )
    }

    // Get pocket
    const pocket = await db.savingsPocket.findUnique({
      where: { id: pocketId }
    })

    if (!pocket || pocket.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Pocket not found' },
        { status: 404 }
      )
    }

    // If pocket has balance, transfer back to wallet
    if (pocket.currentCents > 0) {
      const user = await db.consumerUser.findUnique({
        where: { id: userId },
        include: { wallet: true }
      })

      if (user?.wallet) {
        // Transfer to wallet
        await db.consumerWallet.update({
          where: { userId },
          data: {
            balanceCents: { increment: pocket.currentCents }
          }
        })
      }
    }

    // Soft delete (mark as closed)
    await db.savingsPocket.update({
      where: { id: pocketId },
      data: {
        status: 'closed',
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Savings pocket closed successfully'
    })

  } catch (error) {
    console.error('Delete savings pocket error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete savings pocket' },
      { status: 500 }
    )
  }
}
