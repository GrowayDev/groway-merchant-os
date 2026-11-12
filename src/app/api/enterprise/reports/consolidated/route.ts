import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

// GET - Get consolidated reports
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const corporateId = searchParams.get('corporateId')
    const reportType = searchParams.get('reportType')
    const action = searchParams.get('action') || 'list'
    
    if (!corporateId) {
      return NextResponse.json({ error: 'corporateId is required' }, { status: 400 })
    }
    
    if (action === 'pnl') {
      // Generate consolidated P&L report
      const periodStart = searchParams.get('periodStart')
      const periodEnd = searchParams.get('periodEnd')
      
      if (!periodStart || !periodEnd) {
        return NextResponse.json({ error: 'periodStart and periodEnd are required' }, { status: 400 })
      }
      
      // Get all merchants for this corporate
      const merchants = await db.enterpriseMerchant.findMany({
        where: { corporateId }
      })
      
      const merchantIds = merchants.map(m => m.id)
      
      // Calculate revenue per merchant (mock calculation)
      const merchantData = await Promise.all(merchants.map(async (merchant) => {
        // Get inventory value as proxy for revenue calculation
        const inventory = await db.enterpriseInventory.findMany({
          where: { merchantId: merchant.id }
        })
        
        const totalValue = inventory.reduce((sum, item) => sum + (item.value || 0), 0)
        
        return {
          merchantId: merchant.id,
          merchantName: merchant.name,
          location: merchant.location,
          revenue: merchant.monthlyRevenue || totalValue * 0.3,
          costOfSales: (merchant.monthlyRevenue || totalValue * 0.3) * 0.65,
          grossProfit: (merchant.monthlyRevenue || totalValue * 0.3) * 0.35,
          expenses: (merchant.monthlyRevenue || totalValue * 0.3) * 0.20,
          netProfit: (merchant.monthlyRevenue || totalValue * 0.3) * 0.15
        }
      }))
      
      // Calculate totals
      const totals = merchantData.reduce((acc, m) => ({
        revenue: acc.revenue + m.revenue,
        costOfSales: acc.costOfSales + m.costOfSales,
        grossProfit: acc.grossProfit + m.grossProfit,
        expenses: acc.expenses + m.expenses,
        netProfit: acc.netProfit + m.netProfit
      }), { revenue: 0, costOfSales: 0, grossProfit: 0, expenses: 0, netProfit: 0 })
      
      // Calculate inter-company eliminations
      const interCompanyTransfers = await db.enterpriseTransfer.findMany({
        where: {
          corporateId,
          status: 'completed',
          receivedAt: {
            gte: new Date(periodStart),
            lte: new Date(periodEnd)
          }
        },
        include: { items: true }
      })
      
      const interCompanySales = interCompanyTransfers.reduce((sum, t) => sum + t.totalValue, 0)
      
      const report = {
        reportType: 'pnl',
        periodStart,
        periodEnd,
        currency: 'ZAR',
        totals: {
          ...totals,
          interCompanySales,
          consolidatedRevenue: totals.revenue - interCompanySales,
          consolidatedGrossProfit: totals.grossProfit - interCompanySales * 0.65,
          consolidatedNetProfit: totals.netProfit - interCompanySales * 0.15
        },
        segments: merchantData,
        eliminations: {
          interCompanySales,
          description: 'Inter-company transfers eliminated from consolidated results'
        }
      }
      
      return NextResponse.json({ report })
    }
    
    if (action === 'balance_sheet') {
      // Generate consolidated balance sheet
      const asOfDate = searchParams.get('asOfDate') || new Date().toISOString().split('T')[0]
      
      const merchants = await db.enterpriseMerchant.findMany({
        where: { corporateId }
      })
      
      // Get inventory values for each merchant
      const merchantAssets = await Promise.all(merchants.map(async (merchant) => {
        const inventory = await db.enterpriseInventory.findMany({
          where: { merchantId: merchant.id }
        })
        
        const inventoryValue = inventory.reduce((sum, item) => sum + (item.value || 0), 0)
        
        // Mock asset/liability calculations
        const cashEquivalents = (merchant.monthlyRevenue || 100000) * 0.2
        const receivables = (merchant.monthlyRevenue || 100000) * 0.15
        const fixedAssets = (merchant.monthlyRevenue || 100000) * 0.5
        const payables = (merchant.monthlyRevenue || 100000) * 0.1
        const accruedExpenses = (merchant.monthlyRevenue || 100000) * 0.05
        
        return {
          merchantId: merchant.id,
          merchantName: merchant.name,
          currentAssets: cashEquivalents + receivables + inventoryValue,
          nonCurrentAssets: fixedAssets,
          totalAssets: cashEquivalents + receivables + inventoryValue + fixedAssets,
          currentLiabilities: payables + accruedExpenses,
          longTermLiabilities: 0,
          totalLiabilities: payables + accruedExpenses,
          equity: cashEquivalents + receivables + inventoryValue + fixedAssets - payables - accruedExpenses,
          breakdown: {
            cashEquivalents,
            receivables,
            inventory: inventoryValue,
            fixedAssets,
            payables,
            accruedExpenses
          }
        }
      }))
      
      const totals = merchantAssets.reduce((acc, m) => ({
        currentAssets: acc.currentAssets + m.currentAssets,
        nonCurrentAssets: acc.nonCurrentAssets + m.nonCurrentAssets,
        totalAssets: acc.totalAssets + m.totalAssets,
        currentLiabilities: acc.currentLiabilities + m.currentLiabilities,
        longTermLiabilities: acc.longTermLiabilities + m.longTermLiabilities,
        totalLiabilities: acc.totalLiabilities + m.totalLiabilities,
        equity: acc.equity + m.equity
      }), { currentAssets: 0, nonCurrentAssets: 0, totalAssets: 0, currentLiabilities: 0, longTermLiabilities: 0, totalLiabilities: 0, equity: 0 })
      
      const report = {
        reportType: 'balance_sheet',
        asOfDate,
        currency: 'ZAR',
        totals,
        segments: merchantAssets,
        interCompanyEliminations: {
          interCompanyReceivables: 0,
          interCompanyPayables: 0
        }
      }
      
      return NextResponse.json({ report })
    }
    
    if (action === 'cash_flow') {
      // Generate consolidated cash flow statement
      const periodStart = searchParams.get('periodStart')
      const periodEnd = searchParams.get('periodEnd')
      
      if (!periodStart || !periodEnd) {
        return NextResponse.json({ error: 'periodStart and periodEnd are required' }, { status: 400 })
      }
      
      const merchants = await db.enterpriseMerchant.findMany({
        where: { corporateId }
      })
      
      // Mock cash flow calculation
      const cashFlowData = merchants.map(merchant => {
        const monthlyRevenue = merchant.monthlyRevenue || 100000
        return {
          merchantId: merchant.id,
          merchantName: merchant.name,
          operatingActivities: monthlyRevenue * 0.3,
          investingActivities: -monthlyRevenue * 0.1,
          financingActivities: 0,
          netCashFlow: monthlyRevenue * 0.2
        }
      })
      
      const totals = cashFlowData.reduce((acc, m) => ({
        operatingActivities: acc.operatingActivities + m.operatingActivities,
        investingActivities: acc.investingActivities + m.investingActivities,
        financingActivities: acc.financingActivities + m.financingActivities,
        netCashFlow: acc.netCashFlow + m.netCashFlow
      }), { operatingActivities: 0, investingActivities: 0, financingActivities: 0, netCashFlow: 0 })
      
      const report = {
        reportType: 'cash_flow',
        periodStart,
        periodEnd,
        currency: 'ZAR',
        totals,
        segments: cashFlowData
      }
      
      return NextResponse.json({ report })
    }
    
    if (action === 'segment') {
      // Generate segment reporting
      const periodStart = searchParams.get('periodStart')
      const periodEnd = searchParams.get('periodEnd')
      const segmentBy = searchParams.get('segmentBy') || 'branch'
      
      if (!periodStart || !periodEnd) {
        return NextResponse.json({ error: 'periodStart and periodEnd are required' }, { status: 400 })
      }
      
      const merchants = await db.enterpriseMerchant.findMany({
        where: { corporateId }
      })
      
      // Group by segment type
      let segments: Record<string, { revenue: number; profit: number; count: number }> = {}
      
      merchants.forEach(merchant => {
        const segmentKey = segmentBy === 'region' 
          ? (merchant.province || 'Unknown')
          : segmentBy === 'vertical'
          ? (merchant.vertical || 'Unknown')
          : merchant.name
        
        if (!segments[segmentKey]) {
          segments[segmentKey] = { revenue: 0, profit: 0, count: 0 }
        }
        
        const revenue = merchant.monthlyRevenue || 0
        segments[segmentKey].revenue += revenue
        segments[segmentKey].profit += revenue * 0.15
        segments[segmentKey].count += 1
      })
      
      const totalRevenue = Object.values(segments).reduce((sum, s) => sum + s.revenue, 0)
      
      const segmentReport = Object.entries(segments).map(([name, data]) => ({
        segmentName: name,
        segmentType: segmentBy,
        revenue: data.revenue,
        profit: data.profit,
        locationCount: data.count,
        revenuePercent: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
      }))
      
      return NextResponse.json({ 
        report: {
          reportType: 'segment',
          segmentBy,
          periodStart,
          periodEnd,
          totalRevenue,
          segments: segmentReport
        }
      })
    }
    
    if (action === 'eliminations') {
      // Get inter-company elimination entries
      const periodStart = searchParams.get('periodStart')
      const periodEnd = searchParams.get('periodEnd')
      
      const transfers = await db.enterpriseTransfer.findMany({
        where: {
          corporateId,
          status: { in: ['completed', 'completed_with_discrepancy'] },
          receivedAt: periodStart && periodEnd ? {
            gte: new Date(periodStart),
            lte: new Date(periodEnd)
          } : undefined
        },
        include: {
          fromMerchant: { select: { id: true, name: true } },
          toMerchant: { select: { id: true, name: true } },
          items: true
        }
      })
      
      const eliminations = transfers.map(transfer => ({
        id: transfer.id,
        code: transfer.code,
        fromMerchant: transfer.fromMerchant,
        toMerchant: transfer.toMerchant,
        totalValue: transfer.totalValue,
        type: 'inter_company_transfer',
        eliminationAmount: transfer.totalValue
      }))
      
      const totalEliminations = eliminations.reduce((sum, e) => sum + e.eliminationAmount, 0)
      
      return NextResponse.json({ eliminations, totalEliminations, count: eliminations.length })
    }
    
    if (action === 'saved') {
      // Get saved reports
      const where: Record<string, unknown> = { corporateId }
      if (reportType) where.reportType = reportType
      
      const reports = await db.consolidatedReport.findMany({
        where,
        include: {
          ReportSegment: true,
          EliminationEntry: true
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      })
      
      return NextResponse.json({ reports })
    }
    
    // Default: list report templates
    const templates = [
      { id: 'pnl', name: 'Profit & Loss', description: 'Consolidated income statement across all branches' },
      { id: 'balance_sheet', name: 'Balance Sheet', description: 'Consolidated financial position' },
      { id: 'cash_flow', name: 'Cash Flow Statement', description: 'Consolidated cash movements' },
      { id: 'segment', name: 'Segment Report', description: 'Performance by branch, region, or vertical' },
      { id: 'eliminations', name: 'Inter-Company Eliminations', description: 'Transactions between related entities' }
    ]
    
    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}

// POST - Create or save a consolidated report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, corporateId, reportType, reportName, periodStart, periodEnd, ...data } = body
    
    if (!corporateId) {
      return NextResponse.json({ error: 'corporateId is required' }, { status: 400 })
    }
    
    if (action === 'save') {
      // Save a generated report
      const report = await db.consolidatedReport.create({
        data: {
          id: randomUUID(),
          corporateId,
          reportType,
          reportName: reportName || `${reportType} - ${periodStart} to ${periodEnd}`,
          periodStart,
          periodEnd,
          currency: data.currency || 'ZAR',
          totalRevenue: data.totalRevenue || 0,
          totalCostOfSales: data.totalCostOfSales || 0,
          grossProfit: data.grossProfit || 0,
          totalExpenses: data.totalExpenses || 0,
          netProfit: data.netProfit || 0,
          totalAssets: data.totalAssets || 0,
          totalLiabilities: data.totalLiabilities || 0,
          totalEquity: data.totalEquity || 0,
          interCompanySales: data.interCompanySales || 0,
          interCompanyPurchases: data.interCompanyPurchases || 0,
          eliminationAdjustment: data.eliminationAdjustment || 0,
          status: 'completed',
          generatedAt: new Date(),
          generatedBy: data.generatedBy,
          includeBranches: data.includeBranches,
          excludeBranches: data.excludeBranches,
          segmentBy: data.segmentBy,
          ReportSegment: {
            create: (data.segments || []).map((segment: { segmentType: string; segmentId: string; segmentName: string; revenue: number; costOfSales: number; grossProfit: number; expenses: number; netProfit: number; assets: number; liabilities: number; revenuePercent: number; profitPercent: number }) => ({
              id: randomUUID(),
              segmentType: segment.segmentType,
              segmentId: segment.segmentId,
              segmentName: segment.segmentName,
              revenue: segment.revenue || 0,
              costOfSales: segment.costOfSales || 0,
              grossProfit: segment.grossProfit || 0,
              expenses: segment.expenses || 0,
              netProfit: segment.netProfit || 0,
              assets: segment.assets || 0,
              liabilities: segment.liabilities || 0,
              revenuePercent: segment.revenuePercent || 0,
              profitPercent: segment.profitPercent || 0
            }))
          },
          EliminationEntry: {
            create: (data.eliminations || []).map((elim: { fromMerchantId: string; toMerchantId: string; transactionType: string; originalAmount: number; eliminationType: string; eliminatedAmount: number; reason: string }) => ({
              id: randomUUID(),
              fromMerchantId: elim.fromMerchantId,
              toMerchantId: elim.toMerchantId,
              transactionType: elim.transactionType,
              originalAmount: elim.originalAmount || 0,
              eliminationType: elim.eliminationType || 'full',
              eliminatedAmount: elim.eliminatedAmount || 0,
              reason: elim.reason
            }))
          }
        },
        include: {
          ReportSegment: true,
          EliminationEntry: true
        }
      })
      
      return NextResponse.json({ report })
    }
    
    if (action === 'export') {
      // Export report (return formatted data)
      const { reportId, format = 'json' } = body
      
      const report = await db.consolidatedReport.findUnique({
        where: { id: reportId },
        include: {
          ReportSegment: true,
          EliminationEntry: true
        }
      })
      
      if (!report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 })
      }
      
      // Return export-ready data
      return NextResponse.json({ 
        export: {
          format,
          filename: `${report.reportName.replace(/\s+/g, '_')}.${format}`,
          data: report,
          generatedAt: new Date().toISOString()
        }
      })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error processing report:', error)
    return NextResponse.json({ error: 'Failed to process report' }, { status: 500 })
  }
}

// DELETE - Delete a saved report
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }
    
    await db.consolidatedReport.delete({ where: { id } })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting report:', error)
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 })
  }
}
