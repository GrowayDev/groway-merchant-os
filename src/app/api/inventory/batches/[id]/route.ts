import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/inventory/batches/[id]
 * Get a single batch with full details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const batch = await db.inventoryBatch.findUnique({
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
        batchTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        movements: {
          select: {
            id: true,
            type: true,
            direction: true,
            quantity: true,
            unitCost: true,
            totalCost: true,
            referenceType: true,
            referenceNumber: true,
            performedByName: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Calculate days until expiry
    let daysUntilExpiry: number | null = null;
    let expiryStatus = 'no_expiry';

    if (batch.expiryDate) {
      const now = new Date();
      const diffTime = batch.expiryDate.getTime() - now.getTime();
      daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry <= 0) {
        expiryStatus = 'expired';
      } else if (daysUntilExpiry <= 7) {
        expiryStatus = 'critical';
      } else if (daysUntilExpiry <= 30) {
        expiryStatus = 'warning';
      } else {
        expiryStatus = 'ok';
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...batch,
        daysUntilExpiry,
        expiryStatus,
        totalValue: batch.currentQty * batch.unitCost,
        depletionRate: batch.initialQty > 0 
          ? ((batch.initialQty - batch.currentQty) / batch.initialQty) * 100 
          : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching batch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batch', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/inventory/batches/[id]
 * Update a batch
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingBatch = await db.inventoryBatch.findUnique({
      where: { id },
    });

    if (!existingBatch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Update batch
    const batch = await db.inventoryBatch.update({
      where: { id },
      data: {
        lotNumber: body.lotNumber,
        productionDate: body.productionDate ? new Date(body.productionDate) : null,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        shelfLifeDays: body.shelfLifeDays,
        locationAisle: body.locationAisle,
        locationShelf: body.locationShelf,
        locationBin: body.locationBin,
        updatedAt: new Date(),
      },
      include: {
        product: true,
        branch: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: batch,
      message: 'Batch updated successfully',
    });
  } catch (error) {
    console.error('Error updating batch:', error);
    return NextResponse.json(
      { error: 'Failed to update batch', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
