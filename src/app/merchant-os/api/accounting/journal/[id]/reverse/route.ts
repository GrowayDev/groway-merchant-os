import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper function to generate entry number: JE-YYYYMMDD-XXXX
async function generateEntryNumber(merchantId: string, entryDate: string): Promise<string> {
  const dateStr = entryDate.replace(/-/g, '');
  
  const latestEntry = await db.journalEntry.findFirst({
    where: {
      merchantId,
      entryNumber: {
        startsWith: `JE-${dateStr}`,
      },
    },
    orderBy: {
      entryNumber: 'desc',
    },
  });

  let sequence = 1;
  if (latestEntry) {
    const parts = latestEntry.entryNumber.split('-');
    if (parts.length === 3) {
      sequence = parseInt(parts[2], 10) + 1;
    }
  }

  return `JE-${dateStr}-${sequence.toString().padStart(4, '0')}`;
}

// POST /api/accounting/journal/[id]/reverse - Reverse a posted journal entry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { reversalReason, reversedBy } = body;

    // Check if entry exists and is posted
    const existingEntry = await db.journalEntry.findUnique({
      where: { id },
      include: { lines: true },
    });

    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Journal entry not found' },
        { status: 404 }
      );
    }

    if (existingEntry.status !== 'posted') {
      return NextResponse.json(
        { error: 'Only posted journal entries can be reversed' },
        { status: 400 }
      );
    }

    if (existingEntry.status === 'reversed') {
      return NextResponse.json(
        { error: 'Journal entry is already reversed' },
        { status: 400 }
      );
    }

    if (!reversalReason) {
      return NextResponse.json(
        { error: 'reversalReason is required' },
        { status: 400 }
      );
    }

    // Get current date for the reversal entry
    const today = new Date().toISOString().split('T')[0];

    // Create reversal entry and update original in a transaction
    const result = await db.$transaction(async (tx) => {
      // Generate entry number for reversal
      const reversalEntryNumber = await generateEntryNumber(existingEntry.merchantId, today);

      // Create the reversal journal entry (swap debits and credits)
      const reversalEntry = await tx.journalEntry.create({
        data: {
          entryNumber: reversalEntryNumber,
          merchantId: existingEntry.merchantId,
          entryDate: today,
          description: `Reversal: ${existingEntry.description}`,
          reference: `Reversal of ${existingEntry.entryNumber}`,
          sourceType: 'adjustment',
          totalDebit: existingEntry.totalCredit, // Swap
          totalCredit: existingEntry.totalDebit, // Swap
          status: 'posted',
          postedBy: reversedBy,
          postedAt: new Date(),
          createdBy: reversedBy,
          notes: reversalReason,
        },
      });

      // Create reversal lines (swap debits and credits)
      await tx.journalEntryLine.createMany({
        data: existingEntry.lines.map((line) => ({
          entryId: reversalEntry.id,
          accountCode: line.accountCode,
          accountName: line.accountName,
          debit: line.credit, // Swap
          credit: line.debit, // Swap
          lineDescription: line.lineDescription,
          branchId: line.branchId,
          departmentId: line.departmentId,
        })),
      });

      // Update account balances for reversal
      for (const line of existingEntry.lines) {
        const account = await tx.chartOfAccount.findFirst({
          where: {
            merchantId: existingEntry.merchantId,
            code: line.accountCode,
          },
        });

        if (account) {
          // Reverse the balance change
          let balanceChange = 0;
          
          if (account.normalBalance === 'debit') {
            // Original: debit increases, credit decreases
            // Reversal: credit increases, debit decreases
            balanceChange = line.credit - line.debit;
          } else {
            // Original: credit increases, debit decreases
            // Reversal: debit increases, credit decreases
            balanceChange = line.debit - line.credit;
          }

          await tx.chartOfAccount.update({
            where: { id: account.id },
            data: {
              currentBalance: account.currentBalance + balanceChange,
            },
          });
        }
      }

      // Update the original entry to mark as reversed
      await tx.journalEntry.update({
        where: { id },
        data: {
          status: 'reversed',
          reversedBy,
          reversedAt: new Date(),
          reversalReason,
          reversalEntryId: reversalEntry.id,
        },
      });

      return tx.journalEntry.findUnique({
        where: { id: reversalEntry.id },
        include: {
          lines: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    });

    return NextResponse.json({
      message: 'Journal entry reversed successfully',
      reversalEntry: result,
      originalEntryId: id,
    });
  } catch (error) {
    console.error('Error reversing journal entry:', error);
    return NextResponse.json(
      { error: 'Failed to reverse journal entry' },
      { status: 500 }
    );
  }
}
