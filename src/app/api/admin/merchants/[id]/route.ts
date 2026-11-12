import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/merchants/[id] - Get a specific merchant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const merchant = await db.adminMerchant.findUnique({
      where: { id },
      include: {
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(merchant);
  } catch (error) {
    console.error('Error fetching merchant:', error);
    return NextResponse.json(
      { error: 'Failed to fetch merchant' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/merchants/[id] - Update a merchant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingMerchant = await db.adminMerchant.findUnique({
      where: { id },
    });

    if (!existingMerchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'businessName', 'tradingName', 'registrationNumber', 'vatNumber',
      'tier', 'status', 'vertical', 'subVertical',
      'contactName', 'contactEmail', 'contactPhone',
      'addressStreet', 'addressCity', 'addressProvince', 'addressPostalCode',
      'kycStatus', 'kybStatus', 'riskScore', 'monthlyVolume', 'totalTransactions',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const merchant = await db.adminMerchant.update({
      where: { id },
      data: updateData,
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'merchant_updated',
        category: 'merchant',
        actorName: body.actorName || 'System',
        targetType: 'merchant',
        targetId: id,
        targetName: merchant.businessName,
        details: JSON.stringify({ changes: Object.keys(updateData) }),
      },
    });

    return NextResponse.json(merchant);
  } catch (error) {
    console.error('Error updating merchant:', error);
    return NextResponse.json(
      { error: 'Failed to update merchant' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/merchants/[id] - Delete a merchant (soft delete by setting status)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingMerchant = await db.adminMerchant.findUnique({
      where: { id },
    });

    if (!existingMerchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting status to closed
    const merchant = await db.adminMerchant.update({
      where: { id },
      data: { status: 'closed' },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'merchant_deleted',
        category: 'merchant',
        actorName: 'System',
        targetType: 'merchant',
        targetId: id,
        targetName: merchant.businessName,
        details: JSON.stringify({ action: 'soft_delete' }),
      },
    });

    return NextResponse.json({ success: true, merchant });
  } catch (error) {
    console.error('Error deleting merchant:', error);
    return NextResponse.json(
      { error: 'Failed to delete merchant' },
      { status: 500 }
    );
  }
}
