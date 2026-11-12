import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/accounting/balance-sheet - Generate balance sheet report
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
    });

    // Calculate balances for each account
    const accountBalances: Record<string, number> = {};
    
    // Initialize with opening balances
    for (const account of accounts) {
      accountBalances[account.code] = account.openingBalance;
    }

    // Apply journal entry lines
    for (const line of journalLines) {
      const account = accounts.find((a) => a.code === line.accountCode);
      if (account) {
        if (account.normalBalance === 'debit') {
          accountBalances[line.accountCode] = (accountBalances[line.accountCode] || 0) + line.debit - line.credit;
        } else {
          accountBalances[line.accountCode] = (accountBalances[line.accountCode] || 0) + line.credit - line.debit;
        }
      }
    }

    // Build balance sheet sections
    const assets: Array<{
      code: string;
      name: string;
      subType: string | null;
      amount: number;
    }> = [];
    
    const liabilities: Array<{
      code: string;
      name: string;
      subType: string | null;
      amount: number;
    }> = [];
    
    const equity: Array<{
      code: string;
      name: string;
      subType: string | null;
      amount: number;
    }> = [];

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    for (const account of accounts) {
      const balance = accountBalances[account.code] || 0;
      
      // Skip accounts with zero balance
      if (Math.abs(balance) < 0.01) continue;

      const accountData = {
        code: account.code,
        name: account.name,
        subType: account.subType,
        amount: balance,
      };

      switch (account.type) {
        case 'asset':
          assets.push(accountData);
          totalAssets += balance;
          break;
        case 'liability':
          liabilities.push(accountData);
          totalLiabilities += balance;
          break;
        case 'equity':
          equity.push(accountData);
          totalEquity += balance;
          break;
      }
    }

    // Group assets by sub-type
    const assetsBySubType: Record<string, typeof assets> = {};
    for (const asset of assets) {
      const subType = asset.subType || 'general';
      if (!assetsBySubType[subType]) {
        assetsBySubType[subType] = [];
      }
      assetsBySubType[subType].push(asset);
    }

    // Group liabilities by sub-type
    const liabilitiesBySubType: Record<string, typeof liabilities> = {};
    for (const liability of liabilities) {
      const subType = liability.subType || 'general';
      if (!liabilitiesBySubType[subType]) {
        liabilitiesBySubType[subType] = [];
      }
      liabilitiesBySubType[subType].push(liability);
    }

    // Group equity by sub-type
    const equityBySubType: Record<string, typeof equity> = {};
    for (const eq of equity) {
      const subType = eq.subType || 'general';
      if (!equityBySubType[subType]) {
        equityBySubType[subType] = [];
      }
      equityBySubType[subType].push(eq);
    }

    // Calculate retained earnings (income - expense from previous periods)
    // For now, this would be calculated from the income statement
    // In a complete system, this would come from the equity account balances

    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
    const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01;

    return NextResponse.json({
      asOfDate: asOfDate || new Date().toISOString().split('T')[0],
      merchantId,
      assets: {
        accounts: assets,
        bySubType: assetsBySubType,
        total: totalAssets,
      },
      liabilities: {
        accounts: liabilities,
        bySubType: liabilitiesBySubType,
        total: totalLiabilities,
      },
      equity: {
        accounts: equity,
        bySubType: equityBySubType,
        total: totalEquity,
      },
      totals: {
        totalAssets,
        totalLiabilities,
        totalEquity,
        totalLiabilitiesAndEquity,
      },
      isBalanced,
      difference: Math.abs(totalAssets - totalLiabilitiesAndEquity),
    });
  } catch (error) {
    console.error('Error generating balance sheet:', error);
    return NextResponse.json(
      { error: 'Failed to generate balance sheet' },
      { status: 500 }
    );
  }
}
