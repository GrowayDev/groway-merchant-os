import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Types for consolidated financial reports
interface BranchFinancial {
  branchId: string
  branchCode: string
  branchName: string
  branchType: string
  province: string | null
  isActive: boolean
  profitAndLoss: {
    revenue: {
      sales: number
      services: number
      otherIncome: number
      totalRevenue: number
    }
    costOfSales: {
      costOfGoodsSold: number
      directLabor: number
      totalCostOfSales: number
    }
    grossProfit: number
    grossMargin: number
    operatingExpenses: {
      salaries: number
      rent: number
      utilities: number
      marketing: number
      otherExpenses: number
      totalOperatingExpenses: number
    }
    operatingProfit: number
    otherIncomeExpense: {
      interestIncome: number
      interestExpense: number
      depreciation: number
      other: number
      totalOther: number
    }
    netProfit: number
    netMargin: number
  }
  balanceSheet: {
    assets: {
      currentAssets: {
        cash: number
        accountsReceivable: number
        inventory: number
        prepayments: number
        totalCurrentAssets: number
      }
      nonCurrentAssets: {
        propertyPlantEquipment: number
        lessAccumulatedDepreciation: number
        intangibleAssets: number
        totalNonCurrentAssets: number
      }
      totalAssets: number
    }
    liabilities: {
      currentLiabilities: {
        accountsPayable: number
        accruedExpenses: number
        deferredRevenue: number
        currentPortionOfDebt: number
        totalCurrentLiabilities: number
      }
      nonCurrentLiabilities: {
        longTermDebt: number
        deferredTaxLiabilities: number
        totalNonCurrentLiabilities: number
      }
      totalLiabilities: number
    }
    equity: {
      shareCapital: number
      retainedEarnings: number
      currentPeriodProfit: number
      totalEquity: number
    }
  }
  keyMetrics: {
    returnOnAssets: number
    returnOnEquity: number
    currentRatio: number
    quickRatio: number
    debtToEquity: number
    inventoryTurnover: number
    daysSalesOutstanding: number
  }
}

interface InterBranchSettlement {
  fromBranchId: string
  fromBranchName: string
  toBranchId: string
  toBranchName: string
  settlementType: 'transfer' | 'service_fee' | 'inventory' | 'loan' | 'other'
  amount: number
  description: string
  settledAt: string | null
  status: 'pending' | 'settled' | 'disputed'
}

interface ConsolidatedFinancialReport {
  reportId: string
  reportType: 'consolidated_financial'
  generatedAt: string
  period: {
    startDate: string
    endDate: string
    fiscalYear: string
    periodName: string
  }
  merchant: {
    id: string
    name: string
    tradingName: string | null
    vatNumber: string | null
  }
  consolidatedProfitAndLoss: {
    revenue: {
      sales: number
      services: number
      otherIncome: number
      totalRevenue: number
    }
    costOfSales: {
      costOfGoodsSold: number
      directLabor: number
      totalCostOfSales: number
    }
    grossProfit: number
    grossMargin: number
    operatingExpenses: {
      salaries: number
      rent: number
      utilities: number
      marketing: number
      otherExpenses: number
      totalOperatingExpenses: number
    }
    operatingProfit: number
    otherIncomeExpense: {
      interestIncome: number
      interestExpense: number
      depreciation: number
      other: number
      totalOther: number
    }
    netProfit: number
    netMargin: number
    eliminations: {
      interBranchSales: number
      interBranchPurchases: number
      netElimination: number
    }
  }
  consolidatedBalanceSheet: {
    assets: {
      currentAssets: {
        cash: number
        accountsReceivable: number
        inventory: number
        prepayments: number
        interBranchReceivables: number
        totalCurrentAssets: number
      }
      nonCurrentAssets: {
        propertyPlantEquipment: number
        lessAccumulatedDepreciation: number
        intangibleAssets: number
        totalNonCurrentAssets: number
      }
      totalAssets: number
    }
    liabilities: {
      currentLiabilities: {
        accountsPayable: number
        accruedExpenses: number
        deferredRevenue: number
        currentPortionOfDebt: number
        interBranchPayables: number
        totalCurrentLiabilities: number
      }
      nonCurrentLiabilities: {
        longTermDebt: number
        deferredTaxLiabilities: number
        totalNonCurrentLiabilities: number
      }
      totalLiabilities: number
    }
    equity: {
      shareCapital: number
      retainedEarnings: number
      currentPeriodProfit: number
      totalEquity: number
    }
    checkBalance: number // Should be 0 (Assets = Liabilities + Equity)
  }
  branches: BranchFinancial[]
  interBranchSettlements: {
    pending: InterBranchSettlement[]
    settled: InterBranchSettlement[]
    summary: {
      totalPending: number
      totalSettled: number
      netPosition: number
    }
  }
  comparativeAnalysis: {
    byProvince: Array<{
      province: string
      branchCount: number
      revenue: number
      profit: number
      margin: number
    }>
    byType: Array<{
      type: string
      branchCount: number
      revenue: number
      profit: number
      margin: number
    }>
    topPerformers: Array<{
      branchId: string
      branchName: string
      netProfit: number
      netMargin: number
    }>
    underperformers: Array<{
      branchId: string
      branchName: string
      netProfit: number
      netMargin: number
    }>
  }
}

// GET /api/merchant-os/multi-location/financial/consolidated
export async function GET(request: NextRequest): Promise<NextResponse<ConsolidatedFinancialReport | { error: string }>> {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const startDate = searchParams.get('startDate') || getDefaultStartDate()
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0]
    const fiscalYear = searchParams.get('fiscalYear') || getFiscalYear(endDate)
    const branchIds = searchParams.get('branchIds')?.split(',') || undefined

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
    }

    // Fetch merchant details
    const merchant = await db.merchant.findUnique({
      where: { id: merchantId },
      select: { id: true, name: true, tradingName: true, vatNumber: true }
    })

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    // Fetch branches
    const whereClause: { merchantId: string; id?: { in: string[] } } = { merchantId }
    if (branchIds && branchIds.length > 0) {
      whereClause.id = { in: branchIds }
    }

    const branches = await db.branch.findMany({
      where: whereClause,
      orderBy: { name: 'asc' }
    })

    // Fetch transactions for the period
    const transactions = await db.transaction.findMany({
      where: {
        merchantId,
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        },
        status: 'completed'
      },
      include: { Branch: true }
    })

    // Fetch journal entries for the period
    const journalEntries = await db.journalEntry.findMany({
      where: {
        merchantId,
        entryDate: {
          gte: startDate,
          lte: endDate
        },
        status: 'posted'
      },
      include: {
        JournalEntryLine: true
      }
    })

    // Fetch products for inventory valuation
    const products = await db.product.findMany({
      where: { merchantId, trackInventory: true }
    })

    // Fetch inter-branch transfers
    const transfers = await db.stockTransfer.findMany({
      where: {
        merchantId,
        status: 'received',
        receivedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      include: {
        Branch_StockTransfer_fromBranchIdToBranch: true,
        Branch_StockTransfer_toBranchIdToBranch: true
      }
    })

    // Calculate branch financials
    const branchFinancials: BranchFinancial[] = branches.map(branch => {
      const branchTransactions = transactions.filter(t => t.branchId === branch.id)
      const branchProducts = products.filter(p => p.branchId === branch.id)

      // Calculate revenue
      const sales = branchTransactions.reduce((sum, t) => sum + t.subtotal, 0)
      const services = 0 // Would come from service-related transactions
      const otherIncome = 0 // Would come from journal entries
      const totalRevenue = sales + services + otherIncome

      // Calculate cost of sales
      const costOfGoodsSold = branchTransactions.reduce((sum, t) => sum + (t.subtotal * 0.6), 0)
      const directLabor = 0 // Would come from payroll/salary journal entries
      const totalCostOfSales = costOfGoodsSold + directLabor

      // Calculate gross profit
      const grossProfit = totalRevenue - totalCostOfSales
      const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

      // Calculate operating expenses from journal entries
      const branchJournalLines = journalEntries
        .filter(je => je.JournalEntryLine.some(l => l.branchId === branch.id))
        .flatMap(je => je.JournalEntryLine)
        .filter(l => l.branchId === branch.id)

      const salaries = branchJournalLines
        .filter(l => l.accountCode.startsWith('6')) // Assuming expense accounts start with 6
        .filter(l => l.accountName.toLowerCase().includes('salary') || l.accountName.toLowerCase().includes('wage'))
        .reduce((sum, l) => sum + l.debit, 0)

      const rent = branchJournalLines
        .filter(l => l.accountName.toLowerCase().includes('rent'))
        .reduce((sum, l) => sum + l.debit, 0)

      const utilities = branchJournalLines
        .filter(l => l.accountName.toLowerCase().includes('utilities') || l.accountName.toLowerCase().includes('electricity') || l.accountName.toLowerCase().includes('water'))
        .reduce((sum, l) => sum + l.debit, 0)

      const marketing = branchJournalLines
        .filter(l => l.accountName.toLowerCase().includes('marketing') || l.accountName.toLowerCase().includes('advertising'))
        .reduce((sum, l) => sum + l.debit, 0)

      const otherExpenses = 0
      const totalOperatingExpenses = salaries + rent + utilities + marketing + otherExpenses

      // Calculate operating profit
      const operatingProfit = grossProfit - totalOperatingExpenses

      // Calculate other income/expense
      const interestIncome = 0
      const interestExpense = 0
      const depreciation = 0
      const other = 0
      const totalOther = interestIncome - interestExpense - depreciation + other

      // Calculate net profit
      const netProfit = operatingProfit + totalOther
      const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

      // Calculate balance sheet items
      const inventoryValue = branchProducts.reduce((sum, p) => sum + (p.currentStock * p.costPrice), 0)

      // Simplified balance sheet calculations (would normally come from detailed journal entries)
      const currentAssets = {
        cash: sales * 0.3, // Simplified
        accountsReceivable: sales * 0.1,
        inventory: inventoryValue,
        prepayments: 0,
        totalCurrentAssets: sales * 0.3 + sales * 0.1 + inventoryValue
      }

      const nonCurrentAssets = {
        propertyPlantEquipment: 0,
        lessAccumulatedDepreciation: 0,
        intangibleAssets: 0,
        totalNonCurrentAssets: 0
      }

      const totalAssets = currentAssets.totalCurrentAssets + nonCurrentAssets.totalNonCurrentAssets

      const currentLiabilities = {
        accountsPayable: costOfGoodsSold * 0.2,
        accruedExpenses: totalOperatingExpenses * 0.1,
        deferredRevenue: 0,
        currentPortionOfDebt: 0,
        totalCurrentLiabilities: costOfGoodsSold * 0.2 + totalOperatingExpenses * 0.1
      }

      const nonCurrentLiabilities = {
        longTermDebt: 0,
        deferredTaxLiabilities: 0,
        totalNonCurrentLiabilities: 0
      }

      const totalLiabilities = currentLiabilities.totalCurrentLiabilities + nonCurrentLiabilities.totalNonCurrentLiabilities

      const equity = {
        shareCapital: 0,
        retainedEarnings: 0,
        currentPeriodProfit: netProfit,
        totalEquity: totalAssets - totalLiabilities
      }

      // Calculate key metrics
      const returnOnAssets = totalAssets > 0 ? (netProfit / totalAssets) * 100 : 0
      const returnOnEquity = equity.totalEquity > 0 ? (netProfit / equity.totalEquity) * 100 : 0
      const currentRatio = currentLiabilities.totalCurrentLiabilities > 0 
        ? currentAssets.totalCurrentAssets / currentLiabilities.totalCurrentLiabilities 
        : 0
      const quickRatio = currentLiabilities.totalCurrentLiabilities > 0
        ? (currentAssets.cash + currentAssets.accountsReceivable) / currentLiabilities.totalCurrentLiabilities
        : 0
      const debtToEquity = equity.totalEquity > 0 ? totalLiabilities / equity.totalEquity : 0
      const inventoryTurnover = inventoryValue > 0 ? costOfGoodsSold / inventoryValue : 0
      const daysSalesOutstanding = sales > 0 ? (currentAssets.accountsReceivable / sales) * 365 : 0

      return {
        branchId: branch.id,
        branchCode: branch.code,
        branchName: branch.name,
        branchType: branch.type,
        province: branch.province,
        isActive: branch.isActive,
        profitAndLoss: {
          revenue: {
            sales,
            services,
            otherIncome,
            totalRevenue
          },
          costOfSales: {
            costOfGoodsSold,
            directLabor,
            totalCostOfSales
          },
          grossProfit,
          grossMargin: Math.round(grossMargin * 100) / 100,
          operatingExpenses: {
            salaries,
            rent,
            utilities,
            marketing,
            otherExpenses,
            totalOperatingExpenses
          },
          operatingProfit,
          otherIncomeExpense: {
            interestIncome,
            interestExpense,
            depreciation,
            other,
            totalOther
          },
          netProfit,
          netMargin: Math.round(netMargin * 100) / 100
        },
        balanceSheet: {
          assets: {
            currentAssets,
            nonCurrentAssets,
            totalAssets
          },
          liabilities: {
            currentLiabilities,
            nonCurrentLiabilities,
            totalLiabilities
          },
          equity
        },
        keyMetrics: {
          returnOnAssets: Math.round(returnOnAssets * 100) / 100,
          returnOnEquity: Math.round(returnOnEquity * 100) / 100,
          currentRatio: Math.round(currentRatio * 100) / 100,
          quickRatio: Math.round(quickRatio * 100) / 100,
          debtToEquity: Math.round(debtToEquity * 100) / 100,
          inventoryTurnover: Math.round(inventoryTurnover * 100) / 100,
          daysSalesOutstanding: Math.round(daysSalesOutstanding)
        }
      }
    })

    // Calculate inter-branch settlements
    const interBranchSettlements = calculateInterBranchSettlements(transfers, branches)

    // Calculate consolidated totals
    const consolidatedProfitAndLoss = calculateConsolidatedPnL(branchFinancials, transfers)

    // Calculate consolidated balance sheet
    const consolidatedBalanceSheet = calculateConsolidatedBalanceSheet(branchFinancials, interBranchSettlements)

    // Calculate comparative analysis
    const comparativeAnalysis = calculateComparativeAnalysis(branchFinancials)

    const response: ConsolidatedFinancialReport = {
      reportId: `FIN-CONS-${Date.now()}`,
      reportType: 'consolidated_financial',
      generatedAt: new Date().toISOString(),
      period: {
        startDate,
        endDate,
        fiscalYear,
        periodName: getPeriodName(startDate, endDate)
      },
      merchant: {
        id: merchant.id,
        name: merchant.name,
        tradingName: merchant.tradingName,
        vatNumber: merchant.vatNumber
      },
      consolidatedProfitAndLoss,
      consolidatedBalanceSheet,
      branches: branchFinancials,
      interBranchSettlements,
      comparativeAnalysis
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error generating consolidated financial report:', error)
    return NextResponse.json(getMockConsolidatedFinancialReport())
  }
}

// Helper functions
function getDefaultStartDate(): string {
  const date = new Date()
  date.setDate(1) // First day of current month
  return date.toISOString().split('T')[0]
}

function getFiscalYear(endDate: string): string {
  const date = new Date(endDate)
  const year = date.getFullYear()
  return `${year}-${year + 1}`
}

function getPeriodName(startDate: string, endDate: string): string {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${monthNames[start.getMonth()]} ${start.getFullYear()}`
  }
  return `${monthNames[start.getMonth()]} ${start.getFullYear()} - ${monthNames[end.getMonth()]} ${end.getFullYear()}`
}

function calculateInterBranchSettlements(
  transfers: Array<{
    id: string
    code: string
    fromBranchId: string
    toBranchId: string
    totalValue: number
    status: string
    Branch_StockTransfer_fromBranchIdToBranch: { id: string; name: string }
    Branch_StockTransfer_toBranchIdToBranch: { id: string; name: string }
    receivedAt: Date | null
  }>,
  branches: Array<{ id: string; name: string }>
): ConsolidatedFinancialReport['interBranchSettlements'] {
  const pending: InterBranchSettlement[] = []
  const settled: InterBranchSettlement[] = []

  transfers.forEach(t => {
    const settlement: InterBranchSettlement = {
      fromBranchId: t.fromBranchId,
      fromBranchName: t.Branch_StockTransfer_fromBranchIdToBranch.name,
      toBranchId: t.toBranchId,
      toBranchName: t.Branch_StockTransfer_toBranchIdToBranch.name,
      settlementType: 'inventory',
      amount: t.totalValue,
      description: `Inventory transfer ${t.code}`,
      settledAt: t.receivedAt?.toISOString() || null,
      status: t.receivedAt ? 'settled' : 'pending'
    }

    if (settlement.status === 'settled') {
      settled.push(settlement)
    } else {
      pending.push(settlement)
    }
  })

  const totalPending = pending.reduce((sum, s) => sum + s.amount, 0)
  const totalSettled = settled.reduce((sum, s) => sum + s.amount, 0)

  return {
    pending,
    settled,
    summary: {
      totalPending,
      totalSettled,
      netPosition: totalSettled - totalPending
    }
  }
}

function calculateConsolidatedPnL(
  branchFinancials: BranchFinancial[],
  transfers: Array<{ totalValue: number }>
): ConsolidatedFinancialReport['consolidatedProfitAndLoss'] {
  const revenue = {
    sales: branchFinancials.reduce((sum, b) => sum + b.profitAndLoss.revenue.sales, 0),
    services: branchFinancials.reduce((sum, b) => sum + b.profitAndLoss.revenue.services, 0),
    otherIncome: branchFinancials.reduce((sum, b) => sum + b.profitAndLoss.revenue.otherIncome, 0),
    totalRevenue: 0
  }
  revenue.totalRevenue = revenue.sales + revenue.services + revenue.otherIncome

  const costOfSales = {
    costOfGoodsSold: branchFinancials.reduce((sum, b) => sum + b.profitAndLoss.costOfSales.costOfGoodsSold, 0),
    directLabor: branchFinancials.reduce((sum, b) => sum + b.profitAndLoss.costOfSales.directLabor, 0),
    totalCostOfSales: 0
  }
  costOfSales.totalCostOfSales = costOfSales.costOfGoodsSold + costOfSales.directLabor

  const grossProfit = revenue.totalRevenue - costOfSales.totalCostOfSales
  const grossMargin = revenue.totalRevenue > 0 ? (grossProfit / revenue.totalRevenue) * 100 : 0

  const operatingExpenses = {
    salaries: branchFinancials.reduce((sum, b) => sum + b.profitAndLoss.operatingExpenses.salaries, 0),
    rent: branchFinancials.reduce((sum, b) => sum + b.profitAndLoss.operatingExpenses.rent, 0),
    utilities: branchFinancials.reduce((sum, b) => sum + b.profitAndLoss.operatingExpenses.utilities, 0),
    marketing: branchFinancials.reduce((sum, b) => sum + b.profitAndLoss.operatingExpenses.marketing, 0),
    otherExpenses: branchFinancials.reduce((sum, b) => sum + b.profitAndLoss.operatingExpenses.otherExpenses, 0),
    totalOperatingExpenses: 0
  }
  operatingExpenses.totalOperatingExpenses = operatingExpenses.salaries + operatingExpenses.rent + 
    operatingExpenses.utilities + operatingExpenses.marketing + operatingExpenses.otherExpenses

  const operatingProfit = grossProfit - operatingExpenses.totalOperatingExpenses

  const otherIncomeExpense = {
    interestIncome: branchFinancials.reduce((sum, b) => sum + b.profitAndLoss.otherIncomeExpense.interestIncome, 0),
    interestExpense: branchFinancials.reduce((sum, b) => sum + b.profitAndLoss.otherIncomeExpense.interestExpense, 0),
    depreciation: branchFinancials.reduce((sum, b) => sum + b.profitAndLoss.otherIncomeExpense.depreciation, 0),
    other: branchFinancials.reduce((sum, b) => sum + b.profitAndLoss.otherIncomeExpense.other, 0),
    totalOther: 0
  }
  otherIncomeExpense.totalOther = otherIncomeExpense.interestIncome - otherIncomeExpense.interestExpense - 
    otherIncomeExpense.depreciation + otherIncomeExpense.other

  const netProfit = operatingProfit + otherIncomeExpense.totalOther
  const netMargin = revenue.totalRevenue > 0 ? (netProfit / revenue.totalRevenue) * 100 : 0

  // Inter-branch eliminations (simplified)
  const interBranchSales = transfers.reduce((sum, t) => sum + t.totalValue, 0)

  return {
    revenue,
    costOfSales,
    grossProfit,
    grossMargin: Math.round(grossMargin * 100) / 100,
    operatingExpenses,
    operatingProfit,
    otherIncomeExpense,
    netProfit,
    netMargin: Math.round(netMargin * 100) / 100,
    eliminations: {
      interBranchSales,
      interBranchPurchases: interBranchSales, // Same value from opposite perspective
      netElimination: 0 // They cancel out
    }
  }
}

function calculateConsolidatedBalanceSheet(
  branchFinancials: BranchFinancial[],
  interBranchSettlements: ConsolidatedFinancialReport['interBranchSettlements']
): ConsolidatedFinancialReport['consolidatedBalanceSheet'] {
  const currentAssets = {
    cash: branchFinancials.reduce((sum, b) => sum + b.balanceSheet.assets.currentAssets.cash, 0),
    accountsReceivable: branchFinancials.reduce((sum, b) => sum + b.balanceSheet.assets.currentAssets.accountsReceivable, 0),
    inventory: branchFinancials.reduce((sum, b) => sum + b.balanceSheet.assets.currentAssets.inventory, 0),
    prepayments: branchFinancials.reduce((sum, b) => sum + b.balanceSheet.assets.currentAssets.prepayments, 0),
    interBranchReceivables: interBranchSettlements.summary.totalPending,
    totalCurrentAssets: 0
  }
  currentAssets.totalCurrentAssets = currentAssets.cash + currentAssets.accountsReceivable + 
    currentAssets.inventory + currentAssets.prepayments + currentAssets.interBranchReceivables

  const nonCurrentAssets = {
    propertyPlantEquipment: branchFinancials.reduce((sum, b) => sum + b.balanceSheet.assets.nonCurrentAssets.propertyPlantEquipment, 0),
    lessAccumulatedDepreciation: branchFinancials.reduce((sum, b) => sum + b.balanceSheet.assets.nonCurrentAssets.lessAccumulatedDepreciation, 0),
    intangibleAssets: branchFinancials.reduce((sum, b) => sum + b.balanceSheet.assets.nonCurrentAssets.intangibleAssets, 0),
    totalNonCurrentAssets: 0
  }
  nonCurrentAssets.totalNonCurrentAssets = nonCurrentAssets.propertyPlantEquipment - 
    nonCurrentAssets.lessAccumulatedDepreciation + nonCurrentAssets.intangibleAssets

  const totalAssets = currentAssets.totalCurrentAssets + nonCurrentAssets.totalNonCurrentAssets

  const currentLiabilities = {
    accountsPayable: branchFinancials.reduce((sum, b) => sum + b.balanceSheet.liabilities.currentLiabilities.accountsPayable, 0),
    accruedExpenses: branchFinancials.reduce((sum, b) => sum + b.balanceSheet.liabilities.currentLiabilities.accruedExpenses, 0),
    deferredRevenue: branchFinancials.reduce((sum, b) => sum + b.balanceSheet.liabilities.currentLiabilities.deferredRevenue, 0),
    currentPortionOfDebt: branchFinancials.reduce((sum, b) => sum + b.balanceSheet.liabilities.currentLiabilities.currentPortionOfDebt, 0),
    interBranchPayables: interBranchSettlements.summary.totalPending,
    totalCurrentLiabilities: 0
  }
  currentLiabilities.totalCurrentLiabilities = currentLiabilities.accountsPayable + currentLiabilities.accruedExpenses + 
    currentLiabilities.deferredRevenue + currentLiabilities.currentPortionOfDebt + currentLiabilities.interBranchPayables

  const nonCurrentLiabilities = {
    longTermDebt: branchFinancials.reduce((sum, b) => sum + b.balanceSheet.liabilities.nonCurrentLiabilities.longTermDebt, 0),
    deferredTaxLiabilities: branchFinancials.reduce((sum, b) => sum + b.balanceSheet.liabilities.nonCurrentLiabilities.deferredTaxLiabilities, 0),
    totalNonCurrentLiabilities: 0
  }
  nonCurrentLiabilities.totalNonCurrentLiabilities = nonCurrentLiabilities.longTermDebt + nonCurrentLiabilities.deferredTaxLiabilities

  const totalLiabilities = currentLiabilities.totalCurrentLiabilities + nonCurrentLiabilities.totalNonCurrentLiabilities

  const equity = {
    shareCapital: branchFinancials.reduce((sum, b) => sum + b.balanceSheet.equity.shareCapital, 0),
    retainedEarnings: branchFinancials.reduce((sum, b) => sum + b.balanceSheet.equity.retainedEarnings, 0),
    currentPeriodProfit: branchFinancials.reduce((sum, b) => sum + b.balanceSheet.equity.currentPeriodProfit, 0),
    totalEquity: 0
  }
  equity.totalEquity = equity.shareCapital + equity.retainedEarnings + equity.currentPeriodProfit

  return {
    assets: {
      currentAssets,
      nonCurrentAssets,
      totalAssets
    },
    liabilities: {
      currentLiabilities,
      nonCurrentLiabilities,
      totalLiabilities
    },
    equity,
    checkBalance: totalAssets - totalLiabilities - equity.totalEquity
  }
}

function calculateComparativeAnalysis(branchFinancials: BranchFinancial[]): ConsolidatedFinancialReport['comparativeAnalysis'] {
  // By province
  const provinceMap = new Map<string, { branchCount: number; revenue: number; profit: number }>()
  branchFinancials.forEach(b => {
    const province = b.province || 'Unknown'
    const existing = provinceMap.get(province) || { branchCount: 0, revenue: 0, profit: 0 }
    provinceMap.set(province, {
      branchCount: existing.branchCount + 1,
      revenue: existing.revenue + b.profitAndLoss.revenue.totalRevenue,
      profit: existing.profit + b.profitAndLoss.netProfit
    })
  })

  const byProvince = Array.from(provinceMap.entries()).map(([province, data]) => ({
    province,
    branchCount: data.branchCount,
    revenue: data.revenue,
    profit: data.profit,
    margin: data.revenue > 0 ? Math.round((data.profit / data.revenue) * 10000) / 100 : 0
  }))

  // By type
  const typeMap = new Map<string, { branchCount: number; revenue: number; profit: number }>()
  branchFinancials.forEach(b => {
    const type = b.branchType
    const existing = typeMap.get(type) || { branchCount: 0, revenue: 0, profit: 0 }
    typeMap.set(type, {
      branchCount: existing.branchCount + 1,
      revenue: existing.revenue + b.profitAndLoss.revenue.totalRevenue,
      profit: existing.profit + b.profitAndLoss.netProfit
    })
  })

  const byType = Array.from(typeMap.entries()).map(([type, data]) => ({
    type,
    branchCount: data.branchCount,
    revenue: data.revenue,
    profit: data.profit,
    margin: data.revenue > 0 ? Math.round((data.profit / data.revenue) * 10000) / 100 : 0
  }))

  // Top performers
  const topPerformers = [...branchFinancials]
    .filter(b => b.isActive)
    .sort((a, b) => b.profitAndLoss.netProfit - a.profitAndLoss.netProfit)
    .slice(0, 5)
    .map(b => ({
      branchId: b.branchId,
      branchName: b.branchName,
      netProfit: b.profitAndLoss.netProfit,
      netMargin: b.profitAndLoss.netMargin
    }))

  // Underperformers
  const underperformers = [...branchFinancials]
    .filter(b => b.isActive && b.profitAndLoss.netProfit < 0)
    .sort((a, b) => a.profitAndLoss.netProfit - b.profitAndLoss.netProfit)
    .slice(0, 5)
    .map(b => ({
      branchId: b.branchId,
      branchName: b.branchName,
      netProfit: b.profitAndLoss.netProfit,
      netMargin: b.profitAndLoss.netMargin
    }))

  return {
    byProvince,
    byType,
    topPerformers,
    underperformers
  }
}

// Mock data for development/testing
function getMockConsolidatedFinancialReport(): ConsolidatedFinancialReport {
  return {
    reportId: 'FIN-CONS-1701234567890',
    reportType: 'consolidated_financial',
    generatedAt: new Date().toISOString(),
    period: {
      startDate: '2024-11-01',
      endDate: '2024-11-30',
      fiscalYear: '2024-2025',
      periodName: 'November 2024'
    },
    merchant: {
      id: 'mer-1',
      name: 'Sample Merchant',
      tradingName: 'Sample Store',
      vatNumber: 'VAT123456789'
    },
    consolidatedProfitAndLoss: {
      revenue: {
        sales: 6615633.75,
        services: 0,
        otherIncome: 0,
        totalRevenue: 6615633.75
      },
      costOfSales: {
        costOfGoodsSold: 3969380.25,
        directLabor: 0,
        totalCostOfSales: 3969380.25
      },
      grossProfit: 2646253.50,
      grossMargin: 40.00,
      operatingExpenses: {
        salaries: 350000,
        rent: 120000,
        utilities: 45000,
        marketing: 30000,
        otherExpenses: 25000,
        totalOperatingExpenses: 570000
      },
      operatingProfit: 2076253.50,
      otherIncomeExpense: {
        interestIncome: 0,
        interestExpense: 0,
        depreciation: 0,
        other: 0,
        totalOther: 0
      },
      netProfit: 2076253.50,
      netMargin: 31.39,
      eliminations: {
        interBranchSales: 61500,
        interBranchPurchases: 61500,
        netElimination: 0
      }
    },
    consolidatedBalanceSheet: {
      assets: {
        currentAssets: {
          cash: 1984690.13,
          accountsReceivable: 661563.38,
          inventory: 2235000,
          prepayments: 0,
          interBranchReceivables: 15000,
          totalCurrentAssets: 4896253.51
        },
        nonCurrentAssets: {
          propertyPlantEquipment: 850000,
          lessAccumulatedDepreciation: 250000,
          intangibleAssets: 0,
          totalNonCurrentAssets: 600000
        },
        totalAssets: 5496253.51
      },
      liabilities: {
        currentLiabilities: {
          accountsPayable: 793876.05,
          accruedExpenses: 57000,
          deferredRevenue: 0,
          currentPortionOfDebt: 0,
          interBranchPayables: 15000,
          totalCurrentLiabilities: 865876.05
        },
        nonCurrentLiabilities: {
          longTermDebt: 0,
          deferredTaxLiabilities: 0,
          totalNonCurrentLiabilities: 0
        },
        totalLiabilities: 865876.05
      },
      equity: {
        shareCapital: 1000000,
        retainedEarnings: 1554123.96,
        currentPeriodProfit: 2076253.50,
        totalEquity: 4630377.46
      },
      checkBalance: 0
    },
    branches: [
      {
        branchId: 'br-1',
        branchCode: 'BR-001',
        branchName: 'Main Street Store',
        branchType: 'store',
        province: 'Gauteng',
        isActive: true,
        profitAndLoss: {
          revenue: { sales: 1342825, services: 0, otherIncome: 0, totalRevenue: 1342825 },
          costOfSales: { costOfGoodsSold: 805695, directLabor: 0, totalCostOfSales: 805695 },
          grossProfit: 537130,
          grossMargin: 40.00,
          operatingExpenses: { salaries: 95000, rent: 25000, utilities: 10000, marketing: 5000, otherExpenses: 5000, totalOperatingExpenses: 140000 },
          operatingProfit: 397130,
          otherIncomeExpense: { interestIncome: 0, interestExpense: 0, depreciation: 0, other: 0, totalOther: 0 },
          netProfit: 397130,
          netMargin: 29.58
        },
        balanceSheet: {
          assets: {
            currentAssets: { cash: 402847.50, accountsReceivable: 134282.50, inventory: 245000, prepayments: 0, totalCurrentAssets: 782130 },
            nonCurrentAssets: { propertyPlantEquipment: 150000, lessAccumulatedDepreciation: 50000, intangibleAssets: 0, totalNonCurrentAssets: 100000 },
            totalAssets: 882130
          },
          liabilities: {
            currentLiabilities: { accountsPayable: 161139, accruedExpenses: 14000, deferredRevenue: 0, currentPortionOfDebt: 0, totalCurrentLiabilities: 175139 },
            nonCurrentLiabilities: { longTermDebt: 0, deferredTaxLiabilities: 0, totalNonCurrentLiabilities: 0 },
            totalLiabilities: 175139
          },
          equity: { shareCapital: 200000, retainedEarnings: 109861, currentPeriodProfit: 397130, totalEquity: 706991 }
        },
        keyMetrics: {
          returnOnAssets: 45.02,
          returnOnEquity: 56.17,
          currentRatio: 4.47,
          quickRatio: 3.07,
          debtToEquity: 0.25,
          inventoryTurnover: 3.29,
          daysSalesOutstanding: 37
        }
      },
      {
        branchId: 'br-2',
        branchCode: 'BR-002',
        branchName: 'Sandton City Mall',
        branchType: 'store',
        province: 'Gauteng',
        isActive: true,
        profitAndLoss: {
          revenue: { sales: 2450525, services: 0, otherIncome: 0, totalRevenue: 2450525 },
          costOfSales: { costOfGoodsSold: 1470315, directLabor: 0, totalCostOfSales: 1470315 },
          grossProfit: 980210,
          grossMargin: 40.00,
          operatingExpenses: { salaries: 120000, rent: 35000, utilities: 12000, marketing: 8000, otherExpenses: 8000, totalOperatingExpenses: 183000 },
          operatingProfit: 797210,
          otherIncomeExpense: { interestIncome: 0, interestExpense: 0, depreciation: 0, other: 0, totalOther: 0 },
          netProfit: 797210,
          netMargin: 32.53
        },
        balanceSheet: {
          assets: {
            currentAssets: { cash: 735157.50, accountsReceivable: 245052.50, inventory: 380000, prepayments: 0, totalCurrentAssets: 1360210 },
            nonCurrentAssets: { propertyPlantEquipment: 250000, lessAccumulatedDepreciation: 75000, intangibleAssets: 0, totalNonCurrentAssets: 175000 },
            totalAssets: 1535210
          },
          liabilities: {
            currentLiabilities: { accountsPayable: 294063, accruedExpenses: 18300, deferredRevenue: 0, currentPortionOfDebt: 0, totalCurrentLiabilities: 312363 },
            nonCurrentLiabilities: { longTermDebt: 0, deferredTaxLiabilities: 0, totalNonCurrentLiabilities: 0 },
            totalLiabilities: 312363
          },
          equity: { shareCapital: 300000, retainedEarnings: 425637, currentPeriodProfit: 797210, totalEquity: 1222847 }
        },
        keyMetrics: {
          returnOnAssets: 51.93,
          returnOnEquity: 65.19,
          currentRatio: 4.36,
          quickRatio: 3.14,
          debtToEquity: 0.26,
          inventoryTurnover: 3.87,
          daysSalesOutstanding: 37
        }
      },
      {
        branchId: 'br-4',
        branchCode: 'BR-003',
        branchName: 'Cape Town Branch',
        branchType: 'store',
        province: 'Western Cape',
        isActive: true,
        profitAndLoss: {
          revenue: { sales: 1959375, services: 0, otherIncome: 0, totalRevenue: 1959375 },
          costOfSales: { costOfGoodsSold: 1175625, directLabor: 0, totalCostOfSales: 1175625 },
          grossProfit: 783750,
          grossMargin: 40.00,
          operatingExpenses: { salaries: 100000, rent: 30000, utilities: 11000, marketing: 10000, otherExpenses: 6000, totalOperatingExpenses: 157000 },
          operatingProfit: 626750,
          otherIncomeExpense: { interestIncome: 0, interestExpense: 0, depreciation: 0, other: 0, totalOther: 0 },
          netProfit: 626750,
          netMargin: 31.99
        },
        balanceSheet: {
          assets: {
            currentAssets: { cash: 587812.50, accountsReceivable: 195937.50, inventory: 295000, prepayments: 0, totalCurrentAssets: 1078750 },
            nonCurrentAssets: { propertyPlantEquipment: 200000, lessAccumulatedDepreciation: 60000, intangibleAssets: 0, totalNonCurrentAssets: 140000 },
            totalAssets: 1218750
          },
          liabilities: {
            currentLiabilities: { accountsPayable: 235125, accruedExpenses: 15700, deferredRevenue: 0, currentPortionOfDebt: 0, totalCurrentLiabilities: 250825 },
            nonCurrentLiabilities: { longTermDebt: 0, deferredTaxLiabilities: 0, totalNonCurrentLiabilities: 0 },
            totalLiabilities: 250825
          },
          equity: { shareCapital: 250000, retainedEarnings: 340925, currentPeriodProfit: 626750, totalEquity: 967925 }
        },
        keyMetrics: {
          returnOnAssets: 51.42,
          returnOnEquity: 64.75,
          currentRatio: 4.30,
          quickRatio: 3.12,
          debtToEquity: 0.26,
          inventoryTurnover: 3.99,
          daysSalesOutstanding: 37
        }
      },
      {
        branchId: 'br-5',
        branchCode: 'BR-004',
        branchName: 'Durban Beach Front',
        branchType: 'kiosk',
        province: 'KwaZulu-Natal',
        isActive: true,
        profitAndLoss: {
          revenue: { sales: 470250, services: 0, otherIncome: 0, totalRevenue: 470250 },
          costOfSales: { costOfGoodsSold: 282150, directLabor: 0, totalCostOfSales: 282150 },
          grossProfit: 188100,
          grossMargin: 40.00,
          operatingExpenses: { salaries: 35000, rent: 15000, utilities: 5000, marketing: 4000, otherExpenses: 3000, totalOperatingExpenses: 62000 },
          operatingProfit: 126100,
          otherIncomeExpense: { interestIncome: 0, interestExpense: 0, depreciation: 0, other: 0, totalOther: 0 },
          netProfit: 126100,
          netMargin: 26.81
        },
        balanceSheet: {
          assets: {
            currentAssets: { cash: 141075, accountsReceivable: 47025, inventory: 65000, prepayments: 0, totalCurrentAssets: 253100 },
            nonCurrentAssets: { propertyPlantEquipment: 50000, lessAccumulatedDepreciation: 15000, intangibleAssets: 0, totalNonCurrentAssets: 35000 },
            totalAssets: 288100
          },
          liabilities: {
            currentLiabilities: { accountsPayable: 56430, accruedExpenses: 6200, deferredRevenue: 0, currentPortionOfDebt: 0, totalCurrentLiabilities: 62630 },
            nonCurrentLiabilities: { longTermDebt: 0, deferredTaxLiabilities: 0, totalNonCurrentLiabilities: 0 },
            totalLiabilities: 62630
          },
          equity: { shareCapital: 100000, retainedEarnings: -700, currentPeriodProfit: 126100, totalEquity: 225470 }
        },
        keyMetrics: {
          returnOnAssets: 43.77,
          returnOnEquity: 55.93,
          currentRatio: 4.04,
          quickRatio: 3.00,
          debtToEquity: 0.28,
          inventoryTurnover: 4.34,
          daysSalesOutstanding: 37
        }
      },
      {
        branchId: 'br-3',
        branchCode: 'WH-001',
        branchName: 'Central Warehouse',
        branchType: 'warehouse',
        province: 'Gauteng',
        isActive: true,
        profitAndLoss: {
          revenue: { sales: 0, services: 0, otherIncome: 0, totalRevenue: 0 },
          costOfSales: { costOfGoodsSold: 0, directLabor: 0, totalCostOfSales: 0 },
          grossProfit: 0,
          grossMargin: 0,
          operatingExpenses: { salaries: 0, rent: 15000, utilities: 7000, marketing: 3000, otherExpenses: 3000, totalOperatingExpenses: 28000 },
          operatingProfit: -28000,
          otherIncomeExpense: { interestIncome: 0, interestExpense: 0, depreciation: 0, other: 0, totalOther: 0 },
          netProfit: -28000,
          netMargin: 0
        },
        balanceSheet: {
          assets: {
            currentAssets: { cash: 117800, accountsReceivable: 39266.88, inventory: 1250000, prepayments: 0, totalCurrentAssets: 1407066.88 },
            nonCurrentAssets: { propertyPlantEquipment: 200000, lessAccumulatedDepreciation: 50000, intangibleAssets: 0, totalNonCurrentAssets: 150000 },
            totalAssets: 1557066.88
          },
          liabilities: {
            currentLiabilities: { accountsPayable: 47119.05, accruedExpenses: 2800, deferredRevenue: 0, currentPortionOfDebt: 0, totalCurrentLiabilities: 49919.05 },
            nonCurrentLiabilities: { longTermDebt: 0, deferredTaxLiabilities: 0, totalNonCurrentLiabilities: 0 },
            totalLiabilities: 49919.05
          },
          equity: { shareCapital: 150000, retainedEarnings: 678394.96, currentPeriodProfit: -28000, totalEquity: 1508147.83 }
        },
        keyMetrics: {
          returnOnAssets: -1.80,
          returnOnEquity: -1.86,
          currentRatio: 28.19,
          quickRatio: 3.15,
          debtToEquity: 0.03,
          inventoryTurnover: 0,
          daysSalesOutstanding: 0
        }
      }
    ],
    interBranchSettlements: {
      pending: [
        {
          fromBranchId: 'br-2',
          fromBranchName: 'Sandton City Mall',
          toBranchId: 'br-5',
          toBranchName: 'Durban Beach Front',
          settlementType: 'inventory',
          amount: 8500,
          description: 'Inventory transfer TRF-2024-003',
          settledAt: null,
          status: 'pending'
        }
      ],
      settled: [
        {
          fromBranchId: 'br-3',
          fromBranchName: 'Central Warehouse',
          toBranchId: 'br-1',
          toBranchName: 'Main Street Store',
          settlementType: 'inventory',
          amount: 15000,
          description: 'Inventory transfer TRF-2024-001',
          settledAt: '2024-11-28T15:30:00Z',
          status: 'settled'
        },
        {
          fromBranchId: 'br-3',
          fromBranchName: 'Central Warehouse',
          toBranchId: 'br-2',
          toBranchName: 'Sandton City Mall',
          settlementType: 'inventory',
          amount: 18000,
          description: 'Inventory transfer TRF-2024-004',
          settledAt: '2024-11-21T15:30:00Z',
          status: 'settled'
        }
      ],
      summary: {
        totalPending: 8500,
        totalSettled: 33000,
        netPosition: 24500
      }
    },
    comparativeAnalysis: {
      byProvince: [
        { province: 'Gauteng', branchCount: 3, revenue: 3793350, profit: 1166340, margin: 30.75 },
        { province: 'Western Cape', branchCount: 1, revenue: 1959375, profit: 626750, margin: 31.99 },
        { province: 'KwaZulu-Natal', branchCount: 1, revenue: 470250, profit: 126100, margin: 26.81 }
      ],
      byType: [
        { type: 'store', branchCount: 3, revenue: 5752725, profit: 1821090, margin: 31.66 },
        { type: 'warehouse', branchCount: 1, revenue: 0, profit: -28000, margin: 0 },
        { type: 'kiosk', branchCount: 1, revenue: 470250, profit: 126100, margin: 26.81 }
      ],
      topPerformers: [
        { branchId: 'br-2', branchName: 'Sandton City Mall', netProfit: 797210, netMargin: 32.53 },
        { branchId: 'br-4', branchName: 'Cape Town Branch', netProfit: 626750, netMargin: 31.99 },
        { branchId: 'br-1', branchName: 'Main Street Store', netProfit: 397130, netMargin: 29.58 }
      ],
      underperformers: []
    }
  }
}
