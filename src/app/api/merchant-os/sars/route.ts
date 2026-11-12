import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/merchant-os/sars - Get SARS configuration and returns
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const type = searchParams.get('type') || 'status'
    
    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
    }
    
    switch (type) {
      case 'status':
        const config = await prisma.sarsEfilingConfig.findUnique({
          where: { merchantId },
        })
        
        if (!config) {
          return NextResponse.json({ 
            configured: false,
            message: 'SARS eFiling not configured',
          })
        }
        
        // Get latest VAT return
        const latestReturn = await prisma.vatReturnSubmission.findFirst({
          where: { merchantId },
          orderBy: { periodEnd: 'desc' },
        })
        
        return NextResponse.json({
          configured: true,
          config: {
            ...config,
            taxNumber: `****${config.taxNumber.slice(-4)}`, // Masked
          },
          latestReturn,
        })
        
      case 'returns':
        const returns = await prisma.vatReturnSubmission.findMany({
          where: { merchantId },
          orderBy: { periodEnd: 'desc' },
          take: 24, // 2 years of returns
        })
        
        return NextResponse.json({ returns })
        
      case 'calculate':
        return await calculateVATReturn(merchantId, searchParams)
        
      case 'history':
        const history = await prisma.vatReturnSubmission.findMany({
          where: { 
            merchantId,
            status: { in: ['submitted', 'paid', 'refunded'] },
          },
          orderBy: { submittedAt: 'desc' },
          take: 12,
        })
        
        return NextResponse.json({ history })
        
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error fetching SARS data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SARS data' },
      { status: 500 }
    )
  }
}

// POST /api/merchant-os/sars - Configure, calculate, or submit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, merchantId } = body
    
    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
    }
    
    switch (action) {
      case 'configure':
        return await configureSARS(body)
      case 'calculate':
        return await calculateVATReturn(merchantId, null, body)
      case 'submit':
        return await submitVATReturn(body)
      case 'verify':
        return await verifyTaxNumber(body)
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error processing SARS request:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

// Configure SARS eFiling
async function configureSARS(body: any) {
  const { merchantId, taxNumber, taxType, registeredName, vatReturnFrequency } = body
  
  if (!taxNumber || !taxType) {
    return NextResponse.json({ 
      error: 'taxNumber and taxType are required' 
    }, { status: 400 })
  }
  
  // Validate SA tax number format (10 digits)
  if (!/^\d{10}$/.test(taxNumber)) {
    return NextResponse.json({ 
      error: 'Invalid tax number format. Must be 10 digits.' 
    }, { status: 400 })
  }
  
  const config = await prisma.sarsEfilingConfig.upsert({
    where: { merchantId },
    update: {
      taxNumber,
      taxType,
      registeredName,
      vatReturnFrequency,
      efilingStatus: 'pending',
    },
    create: {
      merchantId,
      taxNumber,
      taxType,
      registeredName,
      vatReturnFrequency,
      efilingStatus: 'pending',
    },
  })
  
  // Create integration config
  await prisma.integrationConfig.upsert({
    where: {
      merchantId_integrationType: {
        merchantId,
        integrationType: 'sars_efiling',
      },
    },
    update: {
      status: 'pending',
    },
    create: {
      merchantId,
      integrationType: 'sars_efiling',
      integrationName: 'SARS eFiling',
      provider: 'sars',
      status: 'pending',
    },
  })
  
  return NextResponse.json({
    success: true,
    config: {
      ...config,
      taxNumber: `****${taxNumber.slice(-4)}`, // Masked in response
    },
    message: 'SARS eFiling configuration saved. Verification may take 24-48 hours.',
  })
}

// Calculate VAT return
async function calculateVATReturn(merchantId: string, searchParams: URLSearchParams | null, body?: any) {
  let periodStart: string
  let periodEnd: string
  
  if (body) {
    periodStart = body.periodStart
    periodEnd = body.periodEnd
  } else if (searchParams) {
    periodStart = searchParams.get('periodStart') || getDefaultPeriodStart()
    periodEnd = searchParams.get('periodEnd') || getDefaultPeriodEnd()
  } else {
    periodStart = getDefaultPeriodStart()
    periodEnd = getDefaultPeriodEnd()
  }
  
  // Get sales for period
  const sales = await prisma.sale.findMany({
    where: {
      branch: { merchantId },
      saleDate: { gte: periodStart, lte: periodEnd },
      paymentStatus: 'completed',
    },
    select: {
      total: true,
      taxAmount: true,
    },
  })
  
  // Calculate totals
  const totalSales = sales.reduce((sum, s) => sum + s.total, 0)
  const outputVAT = sales.reduce((sum, s) => sum + (s.taxAmount || 0), 0)
  
  // Get purchases (from POs received in period)
  const purchases = await prisma.purchaseOrder.findMany({
    where: {
      supplier: { purchaseOrders: { some: { merchant: { id: merchantId } } } },
      status: 'delivered',
      createdAt: {
        gte: new Date(periodStart),
        lte: new Date(periodEnd),
      },
    },
    select: {
      total: true,
      vat: true,
    },
  })
  
  const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0)
  const inputVAT = purchases.reduce((sum, p) => sum + (p.vat || 0), 0)
  
  // Calculate VAT return boxes
  const calculation = {
    periodStart,
    periodEnd,
    // Box 1: Output VAT (VAT on sales)
    box1_outputVAT: outputVAT,
    // Box 2: Input VAT (VAT on purchases)
    box2_inputVAT: inputVAT,
    // Box 3: Net VAT payable/refundable
    box3_netVAT: outputVAT - inputVAT,
    // Box 4: Total value of supplies (excl VAT)
    box4_totalSupplies: totalSales / 1.15,
    // Box 5: Total value of acquisitions (excl VAT)
    box5_totalAcquisitions: totalPurchases / 1.15,
    // Box 6: Zero-rated supplies
    box6_zeroRated: 0, // Would need separate tracking
    // Box 7: Exports
    box7_exports: 0,
    // Box 8: Capital goods
    box8_capitalGoods: 0,
    // Calculated totals
    totalSales,
    totalPurchases,
    salesCount: sales.length,
    purchaseCount: purchases.length,
  }
  
  return NextResponse.json({
    success: true,
    calculation,
    dueDate: calculateDueDate(periodEnd),
  })
}

// Submit VAT return
async function submitVATReturn(body: any) {
  const { merchantId, periodStart, periodEnd, calculation, submittedBy } = body
  
  // Check if already submitted
  const existing = await prisma.vatReturnSubmission.findFirst({
    where: { merchantId, periodStart, periodEnd },
  })
  
  if (existing && existing.status === 'submitted') {
    return NextResponse.json({ 
      error: 'VAT return already submitted for this period',
      existing,
    }, { status: 400 })
  }
  
  // Create or update submission
  const submission = await prisma.vatReturnSubmission.upsert({
    where: { id: existing?.id || 'new' },
    update: {
      outputVat: calculation.box1_outputVAT,
      inputVat: calculation.box2_inputVAT,
      netVat: calculation.box3_netVAT,
      totalSales: calculation.box4_totalSupplies,
      totalPurchases: calculation.box5_totalAcquisitions,
      status: 'submitted',
      submittedAt: new Date(),
      submittedBy,
    },
    create: {
      merchantId,
      periodStart,
      periodEnd,
      outputVat: calculation.box1_outputVAT,
      inputVat: calculation.box2_inputVAT,
      netVat: calculation.box3_netVAT,
      totalSales: calculation.box4_totalSupplies,
      totalPurchases: calculation.box5_totalAcquisitions,
      status: 'submitted',
      submittedAt: new Date(),
      submittedBy,
      paymentDueDate: calculateDueDate(periodEnd),
    },
  })
  
  // In production, submit to SARS eFiling API
  // POST to SARS eFiling endpoint with signed request
  
  // Simulate SARS reference
  const sarsReference = `VAT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
  
  await prisma.vatReturnSubmission.update({
    where: { id: submission.id },
    data: { sarsReferenceNumber: sarsReference },
  })
  
  return NextResponse.json({
    success: true,
    submission: {
      ...submission,
      sarsReferenceNumber: sarsReference,
    },
    message: 'VAT return submitted successfully',
    nextSteps: calculation.box3_netVAT > 0
      ? `Payment of R${calculation.box3_netVAT.toFixed(2)} due by ${calculateDueDate(periodEnd)}`
      : `Expect refund of R${Math.abs(calculation.box3_netVAT).toFixed(2)} within 21 business days`,
  })
}

// Verify tax number with SARS
async function verifyTaxNumber(body: any) {
  const { merchantId, taxNumber } = body
  
  // In production, call SARS verification API
  // GET to SARS verification endpoint
  
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Simulate verification
  const isValid = true
  const registeredName = 'Verified Business Name'
  
  if (isValid) {
    await prisma.sarsEfilingConfig.update({
      where: { merchantId },
      data: {
        efilingStatus: 'linked',
        registeredName,
      },
    })
    
    await prisma.integrationConfig.update({
      where: {
        merchantId_integrationType: {
          merchantId,
          integrationType: 'sars_efiling',
        },
      },
      data: { status: 'connected' },
    })
  }
  
  return NextResponse.json({
    success: isValid,
    registeredName: isValid ? registeredName : null,
    message: isValid 
      ? 'Tax number verified successfully'
      : 'Could not verify tax number with SARS',
  })
}

// Helper functions
function getDefaultPeriodStart(): string {
  const date = new Date()
  date.setDate(1)
  date.setMonth(date.getMonth() - 1)
  return date.toISOString().split('T')[0]
}

function getDefaultPeriodEnd(): string {
  const date = new Date()
  date.setDate(0) // Last day of previous month
  return date.toISOString().split('T')[0]
}

function calculateDueDate(periodEnd: string): string {
  const date = new Date(periodEnd)
  date.setMonth(date.getMonth() + 1)
  date.setDate(25) // VAT due by 25th of following month
  return date.toISOString().split('T')[0]
}
