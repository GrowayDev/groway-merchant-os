import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/accounting/journal/[id]/post - Post a draft journal entry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { postedBy } = body;

    // Check if entry exists and is a draft
    const existingEntry = await db.journalEntry.findUnique({
      where: { id },
      include: { JournalEntryLine: true },
    });

    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Journal entry not found' },
        { status: 404 }
      );
    }

    if (existingEntry.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft journal entries can be posted' },
        { status: 400 }
      );
    }

    // Validate that debits equal credits
    if (Math.abs(existingEntry.totalDebit - existingEntry.totalCredit) > 0.01) {
      return NextResponse.json(
        { error: `Journal entry must balance before posting. Total debit (${existingEntry.totalDebit}) does not equal total credit (${existingEntry.totalCredit})` },
        { status: 400 }
      );
    }

    // Validate that there are lines
    if (!existingEntry.JournalEntryLine || existingEntry.JournalEntryLine.length === 0) {
      return NextResponse.json(
        { error: 'Journal entry must have at least one line' },
        { status: 400 }
      );
    }

    // Post the entry and update account balances in a transaction
    const entry = await db.$transaction(async (tx) => {
      // Update the journal entry status
      const updatedEntry = await tx.journalEntry.update({
        where: { id },
        data: {
          status: 'posted',
          postedBy,
          postedAt: new Date(),
        },
        include: {
          JournalEntryLine: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      // Update account balances for each line
      for (const line of existingEntry.JournalEntryLine || []) {
        const account = await tx.chartOfAccount.findFirst({
          where: {
            merchantId: existingEntry.merchantId,
            code: line.accountCode,
          },
        });

        if (account) {
          // Calculate balance change based on account type and normal balance
          let balanceChange = 0;
          
          // For debit normal accounts (assets, expenses): debit increases, credit decreases
          // For credit normal accounts (liabilities, equity, income): credit increases, debit decreases
          if (account.normalBalance === 'debit') {
            balanceChange = line.debit - line.credit;
          } else {
            balanceChange = line.credit - line.debit;
          }

          await tx.chartOfAccount.update({
            where: { id: account.id },
            data: {
              currentBalance: account.currentBalance + balanceChange,
            },
          });
        }
      }

      return updatedEntry;
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error posting journal entry:', error);
    return NextResponse.json(
      { error: 'Failed to post journal entry' },
      { status: 500 }
    );
  }
}
