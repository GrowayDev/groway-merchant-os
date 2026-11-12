import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

// GET /api/accounting/journal/[id] - Get a single journal entry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');

    const entry = await db.journalEntry.findFirst({
      where: {
        id,
        ...(merchantId && { merchantId }),
      },
      include: {
        JournalEntryLine: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!entry) {
      return NextResponse.json(
        { success: false, error: 'Journal entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: entry });
  } catch (error) {
    console.error('Error fetching journal entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch journal entry' },
      { status: 500 }
    );
  }
}

// PUT /api/accounting/journal/[id] - Update a journal entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      entryDate,
      description,
      reference,
      sourceType,
      sourceId,
      lines,
      notes,
    } = body;

    // Check if entry exists and is a draft
    const existingEntry = await db.journalEntry.findUnique({
      where: { id },
      include: { JournalEntryLine: true },
    });

    if (!existingEntry) {
      return NextResponse.json(
        { success: false, error: 'Journal entry not found' },
        { status: 404 }
      );
    }

    // Only allow updates to draft entries
    if (existingEntry.status !== 'draft') {
      return NextResponse.json(
        { success: false, error: 'Only draft journal entries can be modified' },
        { status: 403 }
      );
    }

    // If lines are provided, validate and recalculate totals
    let totalDebit = existingEntry.totalDebit;
    let totalCredit = existingEntry.totalCredit;

    if (lines && Array.isArray(lines)) {
      if (lines.length === 0) {
        return NextResponse.json(
          { success: false, error: 'At least one journal entry line is required' },
          { status: 400 }
        );
      }

      // Validate each line
      for (const line of lines) {
        if (!line.accountCode || !line.accountName) {
          return NextResponse.json(
            { success: false, error: 'Each line must have accountCode and accountName' },
            { status: 400 }
          );
        }
      }

      // Calculate totals
      totalDebit = lines.reduce((sum: number, line: { debit?: number }) => sum + (line.debit || 0), 0);
      totalCredit = lines.reduce((sum: number, line: { credit?: number }) => sum + (line.credit || 0), 0);

      // Validate that debits equal credits
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return NextResponse.json(
          { success: false, error: `Journal entry must balance. Total debit (${totalDebit}) does not equal total credit (${totalCredit})` },
          { status: 400 }
        );
      }
    }

    // Update in a transaction
    const entry = await db.$transaction(async (tx) => {
      // Update the journal entry
      const updatedEntry = await tx.journalEntry.update({
        where: { id },
        data: {
          ...(entryDate && { entryDate }),
          ...(description && { description }),
          ...(reference !== undefined && { reference }),
          ...(sourceType !== undefined && { sourceType }),
          ...(sourceId !== undefined && { sourceId }),
          totalDebit,
          totalCredit,
          updatedAt: new Date(),
          ...(notes !== undefined && { notes }),
        },
      });

      // If lines are provided, delete old lines and create new ones
      if (lines && Array.isArray(lines)) {
        await tx.journalEntryLine.deleteMany({
          where: { entryId: id },
        });

        await tx.journalEntryLine.createMany({
          data: lines.map((line: {
            accountCode: string;
            accountName: string;
            debit?: number;
            credit?: number;
            lineDescription?: string;
            branchId?: string;
            departmentId?: string;
          }) => ({
            id: randomUUID(),
            entryId: id,
            accountCode: line.accountCode,
            accountName: line.accountName,
            debit: line.debit || 0,
            credit: line.credit || 0,
            lineDescription: line.lineDescription,
            branchId: line.branchId,
            departmentId: line.departmentId,
          })),
        });
      }

      return tx.journalEntry.findUnique({
        where: { id },
        include: {
          JournalEntryLine: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    });

    return NextResponse.json({ success: true, data: entry });
  } catch (error) {
    console.error('Error updating journal entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update journal entry' },
      { status: 500 }
    );
  }
}

// DELETE /api/accounting/journal/[id] - Delete a journal entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if entry exists and is a draft
    const existingEntry = await db.journalEntry.findUnique({
      where: { id },
    });

    if (!existingEntry) {
      return NextResponse.json(
        { success: false, error: 'Journal entry not found' },
        { status: 404 }
      );
    }

    // Only allow deletion of draft entries
    if (existingEntry.status !== 'draft') {
      return NextResponse.json(
        { success: false, error: 'Only draft journal entries can be deleted. Use reversal for posted entries.' },
        { status: 403 }
      );
    }

    // Delete in a transaction (cascade will delete lines)
    await db.$transaction(async (tx) => {
      await tx.journalEntryLine.deleteMany({
        where: { entryId: id },
      });
      await tx.journalEntry.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Journal entry deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete journal entry' },
      { status: 500 }
    );
  }
}
