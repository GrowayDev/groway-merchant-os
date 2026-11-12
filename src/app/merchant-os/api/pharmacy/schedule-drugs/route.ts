import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: List scheduled drugs with tracking
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const merchantId = searchParams.get('merchantId')
    const schedule = searchParams.get('schedule')
    const search = searchParams.get('search')
    const includeTransactions = searchParams.get('includeTransactions') === 'true'
    const lowStock = searchParams.get('lowStock') === 'true'

    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: 'merchantId is required' },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = {
      merchantId,
      isActive: true
    }

    if (schedule) {
      where.schedule = parseInt(schedule)
    }

    if (search) {
      where.OR = [
        { productName: { contains: search } },
        { nappiCode: { contains: search } },
        { activeIngredient: { contains: search } }
      ]
    }

    if (lowStock) {
      // Filter for items where currentStock <= reorderLevel
      // This needs raw query for SQLite, or we handle client-side
    }

    const drugs = await db.pharmacyScheduleDrug.findMany({
      where,
      include: includeTransactions ? {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      } : undefined,
      orderBy: [
        { schedule: 'asc' },
        { productName: 'asc' }
      ]
    })

    // Calculate summary statistics
    const summary = {
      totalDrugs: drugs.length,
      bySchedule: {} as Record<number, number>,
      lowStockCount: 0,
      outOfStockCount: 0,
      totalValue: 0
    }

    const drugsWithAlerts = drugs.map(drug => {
      // Count by schedule
      summary.bySchedule[drug.schedule] = (summary.bySchedule[drug.schedule] || 0) + 1

      // Check stock levels
      const isLowStock = drug.currentStock <= drug.reorderLevel
      const isOutOfStock = drug.currentStock === 0

      if (isLowStock) summary.lowStockCount++
      if (isOutOfStock) summary.outOfStockCount++

      // Calculate value
      summary.totalValue += drug.currentStock * drug.unitPrice

      return {
        ...drug,
        stockStatus: isOutOfStock ? 'out_of_stock' : isLowStock ? 'low_stock' : 'in_stock',
        stockValue: drug.currentStock * drug.unitPrice
      }
    })

    // Filter low stock if requested
    const filteredDrugs = lowStock 
      ? drugsWithAlerts.filter(d => d.stockStatus !== 'in_stock')
      : drugsWithAlerts

    return NextResponse.json({
      success: true,
      data: filteredDrugs,
      summary,
      scheduleInfo: getScheduleInfo()
    })
  } catch (error) {
    console.error('Error fetching scheduled drugs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scheduled drugs' },
      { status: 500 }
    )
  }
}

// POST: Record schedule drug transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      merchantId,
      drugId,
      transactionType,
      quantity,
      referenceNumber,
      patientName,
      patientIdNumber,
      prescriberName,
      prescriberRegNo,
      reason,
      notes,
      recordedBy
    } = body

    if (!merchantId || !drugId || !transactionType || quantity === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: merchantId, drugId, transactionType, quantity' },
        { status: 400 }
      )
    }

    // Get current drug info
    const drug = await db.pharmacyScheduleDrug.findFirst({
      where: { id: drugId, merchantId }
    })

    if (!drug) {
      return NextResponse.json(
        { success: false, error: 'Drug not found' },
        { status: 404 }
      )
    }

    const previousStock = drug.currentStock
    let newStock = previousStock

    // Calculate new stock based on transaction type
    switch (transactionType) {
      case 'purchase':
      case 'return':
        newStock = previousStock + Math.abs(quantity)
        break
      case 'sale':
      case 'adjustment':
        if (quantity < 0) {
          newStock = previousStock - Math.abs(quantity)
        } else {
          newStock = previousStock + quantity
        }
        break
      default:
        newStock = previousStock + quantity
    }

    // Validate stock for sales
    if (transactionType === 'sale' && newStock < 0) {
      return NextResponse.json(
        { success: false, error: 'Insufficient stock for this sale' },
        { status: 400 }
      )
    }

    // For Schedule 5 and 6 drugs, require patient and prescriber info for sales
    if (transactionType === 'sale' && drug.schedule >= 5) {
      if (!patientName || !patientIdNumber || !prescriberName || !prescriberRegNo) {
        return NextResponse.json(
          { success: false, error: 'Schedule 5-6 drugs require patient name, ID, prescriber name, and HPCSA registration number' },
          { status: 400 }
        )
      }
    }

    // Create transaction and update stock in a transaction
    const [transaction] = await db.$transaction([
      db.pharmacyScheduleDrugTransaction.create({
        data: {
          drugId,
          transactionType,
          quantity,
          previousStock,
          newStock,
          referenceNumber: referenceNumber || `TXN-${Date.now()}`,
          patientName,
          patientIdNumber,
          prescriberName,
          prescriberRegNo,
          reason,
          notes,
          recordedBy
        }
      }),
      db.pharmacyScheduleDrug.update({
        where: { id: drugId },
        data: {
          currentStock: Math.max(0, newStock),
          lastTransactionAt: new Date()
        }
      })
    ])

    // Check compliance requirements
    const complianceAlerts = []
    if (drug.schedule >= 5 && transactionType === 'sale') {
      complianceAlerts.push({
        type: 'schedule_drug_sale',
        message: `Schedule ${drug.schedule} drug sale recorded. Ensure proper documentation is maintained.`,
        severity: 'info'
      })
    }

    return NextResponse.json({
      success: true,
      data: transaction,
      previousStock,
      newStock: Math.max(0, newStock),
      complianceAlerts
    })
  } catch (error) {
    console.error('Error recording schedule drug transaction:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to record transaction' },
      { status: 500 }
    )
  }
}

// SAHPRA Schedule Drug Information
function getScheduleInfo() {
  return {
    1: {
      name: 'Schedule 1',
      description: 'Health supplements, vitamins, minerals',
      recordingRequired: false,
      prescriptionRequired: false
    },
    2: {
      name: 'Schedule 2',
      description: 'Mild painkillers, antihistamines (higher doses)',
      recordingRequired: false,
      prescriptionRequired: false
    },
    3: {
      name: 'Schedule 3',
      description: 'Stronger painkillers, some antibiotics',
      recordingRequired: false,
      prescriptionRequired: false
    },
    4: {
      name: 'Schedule 4',
      description: 'Prescription medicines, most antibiotics',
      recordingRequired: true,
      prescriptionRequired: true
    },
    5: {
      name: 'Schedule 5',
      description: 'Controlled substances, narcotics for pain',
      recordingRequired: true,
      prescriptionRequired: true,
      specialRequirements: ['Patient ID required', 'Prescriber HPCSA number required', 'Balance record required']
    },
    6: {
      name: 'Schedule 6',
      description: 'Highly controlled substances (morphine, methadone)',
      recordingRequired: true,
      prescriptionRequired: true,
      specialRequirements: ['Patient ID required', 'Prescriber HPCSA number required', 'Balance record required', 'SAHPRA permit may be required']
    }
  }
}
