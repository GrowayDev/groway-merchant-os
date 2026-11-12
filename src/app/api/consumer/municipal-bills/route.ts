import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Mock municipal providers for demo
const mockMunicipalProviders = [
  {
    id: 'coj',
    name: 'City of Johannesburg',
    displayName: 'City of Johannesburg Metropolitan Municipality',
    province: 'Gauteng',
    municipalityType: 'metro',
    accountFormat: '\\d{10}',
    accountLabel: 'Municipal Account Number',
    supportedBillTypes: ['rates', 'water', 'electricity', 'refuse'],
    minAmount: 5000,
    maxAmount: 50000000,
    feeCents: 0,
    processingTime: 'same_day',
  },
  {
    id: 'cct',
    name: 'City of Cape Town',
    displayName: 'City of Cape Town Metropolitan Municipality',
    province: 'Western Cape',
    municipalityType: 'metro',
    accountFormat: '\\d{9}',
    accountLabel: 'Municipal Account Number',
    supportedBillTypes: ['rates', 'water', 'electricity', 'refuse'],
    minAmount: 5000,
    maxAmount: 50000000,
    feeCents: 0,
    processingTime: 'same_day',
  },
  {
    id: 'ethekwini',
    name: 'eThekwini',
    displayName: 'eThekwini Metropolitan Municipality',
    province: 'KwaZulu-Natal',
    municipalityType: 'metro',
    accountFormat: '\\d{11}',
    accountLabel: 'Municipal Account Number',
    supportedBillTypes: ['rates', 'water', 'electricity', 'refuse'],
    minAmount: 5000,
    maxAmount: 50000000,
    feeCents: 0,
    processingTime: 'same_day',
  },
  {
    id: 'tshwane',
    name: 'City of Tshwane',
    displayName: 'City of Tshwane Metropolitan Municipality',
    province: 'Gauteng',
    municipalityType: 'metro',
    accountFormat: '\\d{10}',
    accountLabel: 'Municipal Account Number',
    supportedBillTypes: ['rates', 'water', 'electricity', 'refuse'],
    minAmount: 5000,
    maxAmount: 50000000,
    feeCents: 0,
    processingTime: 'same_day',
  },
]

// Mock stored bills for demo
const mockBills: Map<string, any[]> = new Map()

// GET /api/consumer/municipal-bills - Get municipalities and bills
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const userId = searchParams.get('userId') || 'demo-user'
  const municipalityId = searchParams.get('municipalityId')
  const accountNumber = searchParams.get('accountNumber')

  // Get list of municipalities
  if (action === 'providers') {
    return NextResponse.json({
      success: true,
      data: mockMunicipalProviders.map(p => ({
        id: p.id,
        name: p.name,
        displayName: p.displayName,
        province: p.province,
        supportedBillTypes: p.supportedBillTypes,
      }))
    })
  }

  // Get bills for a user
  if (action === 'bills') {
    const bills = mockBills.get(userId) || []
    return NextResponse.json({
      success: true,
      data: bills
    })
  }

  // Bill lookup - fetch bill details from municipality
  if (action === 'lookup' && municipalityId && accountNumber) {
    const provider = mockMunicipalProviders.find(p => p.id === municipalityId)
    
    if (!provider) {
      return NextResponse.json({
        success: false,
        error: 'Municipality not found'
      }, { status: 404 })
    }

    // Validate account number format
    const regex = new RegExp(`^${provider.accountFormat}$`)
    if (!regex.test(accountNumber)) {
      return NextResponse.json({
        success: false,
        error: `Invalid account number format. Expected ${provider.accountLabel}.`
      }, { status: 400 })
    }

    // Mock bill lookup response
    const mockBillDetails = {
      accountNumber,
      accountName: 'THABO MOLEFE',
      municipality: provider.name,
      address: '123 Main Street, Johannesburg, 2001',
      bills: [
        {
          type: 'electricity',
          description: 'Electricity - November 2024',
          amountCents: 125000, // R1,250.00
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'unpaid'
        },
        {
          type: 'water',
          description: 'Water & Sanitation - November 2024',
          amountCents: 45000, // R450.00
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'unpaid'
        },
        {
          type: 'rates',
          description: 'Property Rates - Q4 2024',
          amountCents: 89000, // R890.00
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'unpaid'
        },
        {
          type: 'refuse',
          description: 'Refuse Removal - November 2024',
          amountCents: 15000, // R150.00
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'unpaid'
        }
      ],
      totalOutstandingCents: 274000, // R2,740.00
    }

    return NextResponse.json({
      success: true,
      data: mockBillDetails
    })
  }

  // Default: return providers
  return NextResponse.json({
    success: true,
    data: {
      providers: mockMunicipalProviders,
      recentPayments: mockBills.get(userId) || []
    }
  })
}

// POST /api/consumer/municipal-bills - Pay a municipal bill
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId = 'demo-user',
      municipalityId,
      accountNumber,
      billType,
      amountCents,
      reference
    } = body

    // Validate municipality
    const provider = mockMunicipalProviders.find(p => p.id === municipalityId)
    if (!provider) {
      return NextResponse.json({
        success: false,
        error: 'Municipality not found'
      }, { status: 404 })
    }

    // Validate amount
    if (amountCents < provider.minAmount || amountCents > provider.maxAmount) {
      return NextResponse.json({
        success: false,
        error: `Amount must be between R${provider.minAmount / 100} and R${provider.maxAmount / 100}`
      }, { status: 400 })
    }

    // Create payment record
    const payment = {
      id: `municipal-${Date.now()}`,
      userId,
      municipalityId,
      municipalityName: provider.name,
      accountNumber,
      billType,
      amountCents,
      feeCents: provider.feeCents,
      totalCents: amountCents + provider.feeCents,
      reference: reference || `MUNI-${Date.now()}`,
      receiptNumber: `RCP-${Date.now().toString(36).toUpperCase()}`,
      status: 'paid',
      processedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }

    // Store payment
    let bills = mockBills.get(userId) || []
    bills.unshift(payment)
    mockBills.set(userId, bills)

    return NextResponse.json({
      success: true,
      data: payment,
      message: 'Municipal bill paid successfully'
    })
  } catch (error) {
    console.error('Municipal bill payment error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process municipal bill payment'
    }, { status: 500 })
  }
}
