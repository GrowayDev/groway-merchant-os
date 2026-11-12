import { NextRequest, NextResponse } from 'next/server'

// Credit history type
interface CreditHistoryEntry {
  id: string
  contractorId: string
  type: 'set_limit' | 'increase_used' | 'decrease_used' | 'payment' | 'purchase'
  amount: number
  previousValue: number
  newValue: number
  description: string
  createdAt: string
  createdBy: string
}

// Sample contractor data (in a real app, this would come from a database)
let contractors = [
  {
    id: 'con1',
    companyName: 'BuildRight Construction',
    creditLimit: 150000,
    creditUsed: 45000
  },
  {
    id: 'con2',
    companyName: 'Mthembu Plumbing Services',
    creditLimit: 50000,
    creditUsed: 32000
  },
  {
    id: 'con3',
    companyName: 'Van Der Berg Electrical',
    creditLimit: 30000,
    creditUsed: 28500
  },
  {
    id: 'con4',
    companyName: 'Nkosi Building Supplies',
    creditLimit: 200000,
    creditUsed: 180000
  },
  {
    id: 'con5',
    companyName: 'QuickFix Maintenance',
    creditLimit: 25000,
    creditUsed: 25000
  }
]

// Sample credit history
let creditHistory: CreditHistoryEntry[] = [
  {
    id: 'ch1',
    contractorId: 'con1',
    type: 'purchase',
    amount: 15000,
    previousValue: 30000,
    newValue: 45000,
    description: 'Order ORD-2026-0142',
    createdAt: '2026-02-18T14:30:00',
    createdBy: 'System'
  },
  {
    id: 'ch2',
    contractorId: 'con1',
    type: 'payment',
    amount: 25000,
    previousValue: 55000,
    newValue: 30000,
    description: 'EFT Payment - Ref: EFT123456',
    createdAt: '2026-02-15T09:15:00',
    createdBy: 'Jane Smith'
  },
  {
    id: 'ch3',
    contractorId: 'con1',
    type: 'set_limit',
    amount: 150000,
    previousValue: 100000,
    newValue: 150000,
    description: 'Credit limit increase approved',
    createdAt: '2026-01-20T11:00:00',
    createdBy: 'Credit Manager'
  },
  {
    id: 'ch4',
    contractorId: 'con2',
    type: 'purchase',
    amount: 8000,
    previousValue: 24000,
    newValue: 32000,
    description: 'Order ORD-2026-0138',
    createdAt: '2026-02-17T16:45:00',
    createdBy: 'System'
  },
  {
    id: 'ch5',
    contractorId: 'con4',
    type: 'purchase',
    amount: 35000,
    previousValue: 145000,
    newValue: 180000,
    description: 'Order ORD-2026-0145',
    createdAt: '2026-02-19T10:20:00',
    createdBy: 'System'
  }
]

// GET - Get contractor credit status and history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const contractor = contractors.find(c => c.id === id)
  
  if (!contractor) {
    return NextResponse.json(
      { success: false, error: 'Contractor not found' },
      { status: 404 }
    )
  }
  
  const creditAvailable = contractor.creditLimit - contractor.creditUsed
  const utilization = contractor.creditLimit > 0 
    ? (contractor.creditUsed / contractor.creditLimit) * 100 
    : 0
  
  const history = creditHistory
    .filter(h => h.contractorId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  
  return NextResponse.json({
    success: true,
    data: {
      contractor: {
        id: contractor.id,
        companyName: contractor.companyName
      },
      creditStatus: {
        limit: contractor.creditLimit,
        used: contractor.creditUsed,
        available: creditAvailable,
        utilization: Math.round(utilization * 100) / 100
      },
      history
    }
  })
}

// PUT - Adjust contractor credit
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const contractorIndex = contractors.findIndex(c => c.id === id)
    
    if (contractorIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Contractor not found' },
        { status: 404 }
      )
    }
    
    const contractor = contractors[contractorIndex]
    const { action, amount, description } = body
    
    let previousValue: number
    let newValue: number
    let historyType: CreditHistoryEntry['type']
    
    switch (action) {
      case 'set_limit':
        previousValue = contractor.creditLimit
        newValue = amount
        contractor.creditLimit = amount
        historyType = 'set_limit'
        break
        
      case 'increase_used':
        previousValue = contractor.creditUsed
        newValue = contractor.creditUsed + amount
        if (newValue > contractor.creditLimit) {
          return NextResponse.json(
            { success: false, error: 'Amount exceeds credit limit' },
            { status: 400 }
          )
        }
        contractor.creditUsed = newValue
        historyType = 'increase_used'
        break
        
      case 'decrease_used':
        previousValue = contractor.creditUsed
        newValue = Math.max(0, contractor.creditUsed - amount)
        contractor.creditUsed = newValue
        historyType = 'decrease_used'
        break
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
    
    // Add history entry
    const historyEntry: CreditHistoryEntry = {
      id: `ch${Date.now()}`,
      contractorId: id,
      type: historyType,
      amount,
      previousValue,
      newValue,
      description: description || `Credit ${action}`,
      createdAt: new Date().toISOString(),
      createdBy: 'Current User'
    }
    
    creditHistory.push(historyEntry)
    contractors[contractorIndex] = contractor
    
    return NextResponse.json({
      success: true,
      data: {
        creditStatus: {
          limit: contractor.creditLimit,
          used: contractor.creditUsed,
          available: contractor.creditLimit - contractor.creditUsed,
          utilization: Math.round((contractor.creditUsed / contractor.creditLimit) * 100 * 100) / 100
        },
        historyEntry
      },
      message: 'Credit adjusted successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to adjust credit' },
      { status: 400 }
    )
  }
}
