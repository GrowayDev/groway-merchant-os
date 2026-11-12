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

// GET - Get lenders and offers
export async function GET(request: NextRequest) {
  try {
    const lenders = [
      { id: 'capitec', name: 'Capitec Bank', type: 'personal', minAmount: 1000, maxAmount: 250000, interestRateMin: 12.5, interestRateMax: 27.5, termMin: 12, termMax: 84, ncrNumber: 'NCRCP58', rating: 4.8 },
      { id: 'african_bank', name: 'African Bank', type: 'personal', minAmount: 1000, maxAmount: 300000, interestRateMin: 15.0, interestRateMax: 27.5, termMin: 6, termMax: 72, ncrNumber: 'NCRCP10', rating: 4.6 },
      { id: 'fnb', name: 'FNB Loans', type: 'personal', minAmount: 2000, maxAmount: 200000, interestRateMin: 10.5, interestRateMax: 21.0, termMin: 12, termMax: 60, ncrNumber: 'NCRCP20', rating: 4.5 },
      { id: 'tyme', name: 'TymeBank', type: 'personal', minAmount: 1000, maxAmount: 150000, interestRateMin: 16.0, interestRateMax: 24.0, termMin: 6, termMax: 48, ncrNumber: 'NCRCP78', rating: 4.4 },
      { id: 'mfc', name: 'MFC', type: 'personal', minAmount: 1000, maxAmount: 100000, interestRateMin: 18.0, interestRateMax: 27.5, termMin: 6, termMax: 36, ncrNumber: 'NCRCP35', rating: 4.2 },
    ]

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { lenders, preQualified: true, maxAmount: 150000 }
    })
  } catch (error) {
    console.error('Error fetching credit lenders:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch credit lenders'
    }, { status: 500 })
  }
}

// POST - Apply for credit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, lenderId, amount, termMonths, purpose } = body

    if (!userId || !lenderId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User ID and lender ID are required'
      }, { status: 400 })
    }

    const application = {
      id: `crapp_${Date.now()}`,
      reference: `CR${Date.now().toString(36).toUpperCase()}`,
      status: 'pending',
      amount,
      termMonths,
      purpose,
      submittedAt: new Date().toISOString()
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
    console.error('Error applying for credit:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to apply for credit'
    }, { status: 500 })
  }
}
