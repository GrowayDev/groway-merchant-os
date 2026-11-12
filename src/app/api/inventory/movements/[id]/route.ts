import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/inventory/movements/[id]
 * Get a single stock movement with full details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const movement = await db.stockMovement.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
            unit: true,
            costPrice: true,
            sellingPrice: true,
            currentStock: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        batch: {
          select: {
            id: true,
            batchNumber: true,
            lotNumber: true,
            expiryDate: true,
            status: true,
            productionDate: true,
            currentQty: true,
            unitCost: true,
          },
        },
      },
    });

    if (!movement) {
      return NextResponse.json(
        { error: 'Stock movement not found' },
        { status: 404 }
      );
    }

    // Get related movements for the same reference
    let relatedMovements: unknown[] = [];
    if (movement.referenceId && movement.referenceType) {
      relatedMovements = await db.stockMovement.findMany({
        where: {
          referenceId: movement.referenceId,
          referenceType: movement.referenceType,
          id: { not: id },
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...movement,
        relatedMovements,
      },
    });
  } catch (error) {
    console.error('Error fetching stock movement:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock movement', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
