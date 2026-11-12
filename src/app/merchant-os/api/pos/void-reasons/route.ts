import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all void reasons
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const where: any = {};
    
    if (category) {
      where.category = category;
    }
    if (activeOnly) {
      where.active = true;
    }

    const voidReasons = await db.voidReason.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    // Group by category for easier frontend consumption
    const grouped = voidReasons.reduce((acc, reason) => {
      const cat = reason.category || 'general';
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(reason);
      return acc;
    }, {} as Record<string, typeof voidReasons>);

    return NextResponse.json({
      success: true,
      data: voidReasons,
      grouped,
      count: voidReasons.length,
    });
  } catch (error) {
    console.error('Error fetching void reasons:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch void reasons' },
      { status: 500 }
    );
  }
}

// POST create void reason (admin only typically)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      reason,
      category = 'general',
      requireManager = false,
      sortOrder = 0,
    } = body;

    if (!reason) {
      return NextResponse.json(
        { success: false, error: 'Reason is required' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['general', 'kitchen', 'customer', 'staff', 'system'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category' },
        { status: 400 }
      );
    }

    const voidReason = await db.voidReason.create({
      data: {
        reason,
        category,
        requireManager,
        sortOrder,
        active: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: voidReason,
      message: 'Void reason created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating void reason:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create void reason' },
      { status: 500 }
    );
  }
}
