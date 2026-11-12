import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all shifts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staffId');
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};
    
    if (staffId) {
      where.staffId = staffId;
    }
    if (date) {
      where.date = date;
    }
    if (status) {
      where.status = status;
    }
    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const shifts = await db.staffShift.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            avatar: true,
            color: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: shifts,
      count: shifts.length,
    });
  } catch (error) {
    console.error('Error fetching shifts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shifts' },
      { status: 500 }
    );
  }
}

// POST clock in
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { staffId, pin, notes } = body;

    if (!staffId || !pin) {
      return NextResponse.json(
        { success: false, error: 'Staff ID and PIN are required' },
        { status: 400 }
      );
    }

    // Verify staff and PIN
    const staff = await db.restaurantStaff.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Staff not found' },
        { status: 404 }
      );
    }

    if (staff.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Staff is not active' },
        { status: 400 }
      );
    }

    // Compare raw PIN (will be hashed later)
    if (staff.pin !== pin) {
      return NextResponse.json(
        { success: false, error: 'Invalid PIN' },
        { status: 401 }
      );
    }

    // Check if already clocked in
    const today = new Date().toISOString().split('T')[0];
    const existingShift = await db.staffShift.findUnique({
      where: {
        staffId_date: {
          staffId,
          date: today,
        },
      },
    });

    if (existingShift && !existingShift.clockOut) {
      return NextResponse.json(
        { success: false, error: 'Already clocked in', data: existingShift },
        { status: 400 }
      );
    }

    // Create new shift
    const shift = await db.staffShift.create({
      data: {
        id: `shift-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        staffId,
        date: today,
        clockIn: new Date(),
        status: 'active',
        notes,
        updatedAt: new Date(),
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            role: true,
            avatar: true,
            color: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: shift,
      message: `${staff.name} clocked in successfully`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error clocking in:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clock in' },
      { status: 500 }
    );
  }
}
