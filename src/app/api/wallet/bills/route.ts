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

// GET - List bill providers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'

    const providers = [
      { id: 'eskom', name: 'Eskom', type: 'electricity', logo: '/providers/eskom.png' },
      { id: 'citypower', name: 'City Power', type: 'electricity', logo: '/providers/citypower.png' },
      { id: 'jhbwater', name: 'Johannesburg Water', type: 'water', logo: '/providers/jhbwater.png' },
      { id: 'dstv', name: 'DStv', type: 'tv', logo: '/providers/dstv.png' },
      { id: 'joburg', name: 'City of Johannesburg', type: 'municipal', logo: '/providers/joburg.png' },
      { id: 'aarto', name: 'AARTO', type: 'traffic', logo: '/providers/aarto.png' },
    ]

    const filteredProviders = type === 'all' 
      ? providers 
      : providers.filter(p => p.type === type)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { providers: filteredProviders }
    })
  } catch (error) {
    console.error('Error fetching bill providers:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch bill providers'
    }, { status: 500 })
  }
}

// POST - Pay bill
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, providerId, accountNumber, amountCents } = body

    if (!userId || !providerId || !accountNumber || !amountCents) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }

    // Mock transaction
    const transaction = {
      id: `txn_bills_${Date.now()}`,
      reference: `BIL${Date.now().toString(36).toUpperCase()}`,
      status: 'completed'
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { transaction },
      transaction
    })
  } catch (error) {
    console.error('Error paying bill:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to pay bill'
    }, { status: 500 })
  }
}
