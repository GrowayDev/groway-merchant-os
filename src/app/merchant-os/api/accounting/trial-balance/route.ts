import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/accounting/trial-balance - Generate trial balance report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const asOfDate = searchParams.get('asOfDate'); // YYYY-MM-DD

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      );
    }

    // Get all accounts for this merchant
    const accounts = await db.chartOfAccount.findMany({
      where: {
        merchantId,
        isActive: true,
      },
      orderBy: [
        { type: 'asc' },
        { code: 'asc' },
      ],
    });

    // Get all posted journal entry lines for this merchant
    const journalEntryWhere: Record<string, unknown> = {
      merchantId,
      status: 'posted',
    };

    if (asOfDate) {
      journalEntryWhere.entryDate = { lte: asOfDate };
    }

    const journalLines = await db.journalEntryLine.findMany({
      where: {
        entry: journalEntryWhere,
      },
      include: {
        entry: {
          select: {
            entryDate: true,
            entryNumber: true,
            status: true,
          },
        },
      },
    });

    // Calculate balances for each account
    const accountBalances: Record<string, { debit: number; credit: number }> = {};
    
    // Initialize with opening balances
    for (const account of accounts) {
      accountBalances[account.code] = {
        debit: account.normalBalance === 'debit' ? account.openingBalance : 0,
        credit: account.normalBalance === 'credit' ? account.openingBalance : 0,
      };
    }

    // Sum up journal entry lines
    for (const line of journalLines) {
      if (!accountBalances[line.accountCode]) {
        accountBalances[line.accountCode] = { debit: 0, credit: 0 };
      }
      accountBalances[line.accountCode].debit += line.debit;
      accountBalances[line.accountCode].credit += line.credit;
    }

    // Build trial balance
    const trialBalance: Array<{
      code: string;
      name: string;
      type: string;
      subType: string | null;
      normalBalance: string;
      openingBalance: number;
      debit: number;
      credit: number;
      closingBalance: number;
    }> = [];

    let totalDebit = 0;
    let totalCredit = 0;

    for (const account of accounts) {
      const balances = accountBalances[account.code] || { debit: 0, credit: 0 };
      
      // Calculate closing balance based on normal balance
      let closingBalance: number;
      if (account.normalBalance === 'debit') {
        closingBalance = account.openingBalance + balances.debit - balances.credit;
      } else {
        closingBalance = account.openingBalance + balances.credit - balances.debit;
      }

      // For trial balance, show positive balances in their normal side
      const trialDebit = account.normalBalance === 'debit' ? Math.max(0, closingBalance) : Math.max(0, -closingBalance);
      const trialCredit = account.normalBalance === 'credit' ? Math.max(0, closingBalance) : Math.max(0, -closingBalance);

      totalDebit += trialDebit;
      totalCredit += trialCredit;

      trialBalance.push({
        code: account.code,
        name: account.name,
        type: account.type,
        subType: account.subType,
        normalBalance: account.normalBalance,
        openingBalance: account.openingBalance,
        debit: trialDebit,
        credit: trialCredit,
        closingBalance,
      });
    }

    // Group by account type
    const groupedByType: Record<string, typeof trialBalance> = {};
    for (const item of trialBalance) {
      if (!groupedByType[item.type]) {
        groupedByType[item.type] = [];
      }
      groupedByType[item.type].push(item);
    }

    // Calculate type totals
    const typeTotals: Record<string, { debit: number; credit: number }> = {};
    for (const [type, items] of Object.entries(groupedByType)) {
      typeTotals[type] = {
        debit: items.reduce((sum, item) => sum + item.debit, 0),
        credit: items.reduce((sum, item) => sum + item.credit, 0),
      };
    }

    // Check if trial balance is balanced
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    return NextResponse.json({
      asOfDate: asOfDate || new Date().toISOString().split('T')[0],
      merchantId,
      trialBalance,
      groupedByType,
      typeTotals,
      totals: {
        debit: totalDebit,
        credit: totalCredit,
        difference: Math.abs(totalDebit - totalCredit),
      },
      isBalanced,
      accountCount: trialBalance.length,
    });
  } catch (error) {
    console.error('Error generating trial balance:', error);
    return NextResponse.json(
      { error: 'Failed to generate trial balance' },
      { status: 500 }
    );
  }
}
