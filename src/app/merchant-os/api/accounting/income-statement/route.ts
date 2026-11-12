import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/accounting/income-statement - Generate income statement report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const startDate = searchParams.get('startDate'); // YYYY-MM-DD
    const endDate = searchParams.get('endDate'); // YYYY-MM-DD

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    // Get all income and expense accounts for this merchant
    const accounts = await db.chartOfAccount.findMany({
      where: {
        merchantId,
        isActive: true,
        type: { in: ['income', 'revenue', 'expense'] },
      },
      orderBy: [
        { type: 'asc' },
        { code: 'asc' },
      ],
    });

    // Get all posted journal entry lines for this merchant within the date range
    const journalLines = await db.journalEntryLine.findMany({
      where: {
        JournalEntry: {
          merchantId,
          status: 'posted',
          entryDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      include: {
        JournalEntry: {
          select: {
            entryDate: true,
            entryNumber: true,
            description: true,
          },
        },
      },
    });

    // Calculate balances for each account
    const accountBalances: Record<string, number> = {};
    
    // Initialize with zero (income statement is for a period, not cumulative)
    for (const account of accounts) {
      accountBalances[account.code] = 0;
    }

    // Apply journal entry lines
    for (const line of journalLines) {
      const account = accounts.find((a) => a.code === line.accountCode);
      if (account) {
        if (account.normalBalance === 'debit') {
          // For expense accounts: debit increases
          accountBalances[line.accountCode] = (accountBalances[line.accountCode] || 0) + line.debit - line.credit;
        } else {
          // For income accounts: credit increases
          accountBalances[line.accountCode] = (accountBalances[line.accountCode] || 0) + line.credit - line.debit;
        }
      }
    }

    // Build income statement sections
    const income: Array<{
      code: string;
      name: string;
      subType: string | null;
      amount: number;
    }> = [];
    
    const expenses: Array<{
      code: string;
      name: string;
      subType: string | null;
      amount: number;
    }> = [];

    let totalIncome = 0;
    let totalExpenses = 0;

    for (const account of accounts) {
      const balance = accountBalances[account.code] || 0;
      
      const accountData = {
        code: account.code,
        name: account.name,
        subType: account.subType,
        amount: Math.abs(balance), // Show as positive in report
      };

      switch (account.type) {
        case 'income':
        case 'revenue':
          income.push(accountData);
          totalIncome += Math.abs(balance);
          break;
        case 'expense':
          expenses.push(accountData);
          totalExpenses += Math.abs(balance);
          break;
      }
    }

    // Group income by sub-type
    const incomeBySubType: Record<string, typeof income> = {};
    for (const inc of income) {
      const subType = inc.subType || 'general';
      if (!incomeBySubType[subType]) {
        incomeBySubType[subType] = [];
      }
      incomeBySubType[subType].push(inc);
    }

    // Group expenses by sub-type
    const expensesBySubType: Record<string, typeof expenses> = {};
    for (const exp of expenses) {
      const subType = exp.subType || 'general';
      if (!expensesBySubType[subType]) {
        expensesBySubType[subType] = [];
      }
      expensesBySubType[subType].push(exp);
    }

    // Calculate gross profit (if we have cost of sales accounts)
    const costOfSales = expenses.filter((e) => 
      e.subType === 'cost_of_sales' || 
      e.subType === 'cost_of_goods_sold' ||
      e.code.startsWith('5')
    );
    const totalCostOfSales = costOfSales.reduce((sum, c) => sum + c.amount, 0);
    const grossProfit = totalIncome - totalCostOfSales;

    // Calculate operating profit
    const operatingExpenses = expenses.filter((e) => 
      e.subType !== 'cost_of_sales' && 
      e.subType !== 'cost_of_goods_sold' &&
      !e.code.startsWith('5')
    );
    const totalOperatingExpenses = operatingExpenses.reduce((sum, e) => sum + e.amount, 0);
    const operatingProfit = grossProfit - totalOperatingExpenses;

    // Calculate net profit
    const netProfit = totalIncome - totalExpenses;

    // Calculate profit margin
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    return NextResponse.json({
      period: {
        startDate,
        endDate,
      },
      merchantId,
      income: {
        accounts: income,
        bySubType: incomeBySubType,
        total: totalIncome,
      },
      costOfSales: {
        accounts: costOfSales,
        total: totalCostOfSales,
      },
      expenses: {
        accounts: expenses,
        bySubType: expensesBySubType,
        total: totalExpenses,
        operatingExpenses: {
          accounts: operatingExpenses,
          total: totalOperatingExpenses,
        },
      },
      summary: {
        totalIncome,
        totalCostOfSales,
        grossProfit,
        totalOperatingExpenses,
        operatingProfit,
        totalExpenses,
        netProfit,
        profitMargin,
      },
      // Comparison with previous period (if available)
      // This would require additional logic to fetch and compare
    });
  } catch (error) {
    console.error('Error generating income statement:', error);
    return NextResponse.json(
      { error: 'Failed to generate income statement' },
      { status: 500 }
    );
  }
}
