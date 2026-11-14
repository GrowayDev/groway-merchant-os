import { NextRequest, NextResponse } from 'next/server'

interface ApiResponse {
  success: boolean
  data?: unknown
  error?: string
  transaction?: {
    id: string
    reference?: string
    status: string
  }
}

// GET - Get BNPL status and limits
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Mock BNPL data
    const bnplData = {
      creditScore: 680,
      totalLimit: 5000,
      availableLimit: 3500,
      activePlans: [
        { id: '1', merchant: 'Takealot', amount: 1200, paid: 600, nextPayment: '2025-05-15' }
      ],
      status: 'active',
      nextPaymentDue: '2025-05-15'
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: bnplData
    })
  } catch (error) {
    console.error('Error fetching BNPL:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch BNPL data'
    }, { status: 500 })
  }
}

// POST - Create BNPL application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount, merchantId, merchantName, ncaAccepted, debitCheckAccepted } = body

    if (!userId || !amount) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }

    if (!ncaAccepted || !debitCheckAccepted) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'NCA and DebiCheck acceptance required'
      }, { status: 400 })
    }

    const application = {
      id: `bnpl_${Date.now()}`,
      reference: `BNPL${Date.now().toString(36).toUpperCase()}`,
      status: 'approved',
      amount,
      firstPayment: amount / 2,
      secondPayment: amount / 2,
      firstDueDate: new Date().toISOString(),
      secondDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      merchantName: merchantName || 'Merchant'
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: application,
      transaction: {
        id: application.id,
        reference: application.reference,
        status: application.status
      }
    })
  } catch (error) {
    console.error('Error creating BNPL:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to create BNPL application'
    }, { status: 500 })
  }
}

// PUT - Update BNPL plan
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { bnplId, action } = body

    const result = {
      id: bnplId,
      status: action === 'cancel' ? 'cancelled' : 'updated',
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error updating BNPL:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to update BNPL'
    }, { status: 500 })
  }
}
