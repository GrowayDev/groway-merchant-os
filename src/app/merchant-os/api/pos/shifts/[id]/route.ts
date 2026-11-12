import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET single shift
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const shift = await db.staffShift.findUnique({
      where: { id },
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

    if (!shift) {
      return NextResponse.json(
        { success: false, error: 'Shift not found' },
        { status: 404 }
      );
    }

    // Calculate shift duration
    const clockIn = new Date(shift.clockIn);
    const clockOut = shift.clockOut ? new Date(shift.clockOut) : new Date();
    const totalMinutes = Math.floor((clockOut.getTime() - clockIn.getTime()) / (1000 * 60));
    const workMinutes = totalMinutes - (shift.breakMinutes || 0);

    return NextResponse.json({
      success: true,
      data: {
        ...shift,
        calculatedDuration: {
          totalMinutes,
          workMinutes,
          breakMinutes: shift.breakMinutes || 0,
          hoursWorked: (workMinutes / 60).toFixed(2),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching shift:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shift' },
      { status: 500 }
    );
  }
}

// PUT update shift (clock out, break)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if shift exists
    const existingShift = await db.staffShift.findUnique({
      where: { id },
      include: { staff: true },
    });

    if (!existingShift) {
      return NextResponse.json(
        { success: false, error: 'Shift not found' },
        { status: 404 }
      );
    }

    const { action, pin, notes, breakMinutes } = body;

    // Validate PIN for sensitive actions
    if (pin && existingShift.staff.pin !== pin) {
      return NextResponse.json(
        { success: false, error: 'Invalid PIN' },
        { status: 401 }
      );
    }

    const updateData: any = {};
    let message = '';

    switch (action) {
      case 'clockOut':
        if (existingShift.clockOut) {
          return NextResponse.json(
            { success: false, error: 'Already clocked out' },
            { status: 400 }
          );
        }
        updateData.clockOut = new Date();
        updateData.status = 'completed';
        if (notes) updateData.notes = notes;
        message = `${existingShift.staff.name} clocked out successfully`;
        break;

      case 'breakStart':
        if (existingShift.breakStart && !existingShift.breakEnd) {
          return NextResponse.json(
            { success: false, error: 'Already on break' },
            { status: 400 }
          );
        }
        updateData.breakStart = new Date();
        message = 'Break started';
        break;

      case 'breakEnd':
        if (!existingShift.breakStart) {
          return NextResponse.json(
            { success: false, error: 'No break in progress' },
            { status: 400 }
          );
        }
        if (existingShift.breakEnd) {
          return NextResponse.json(
            { success: false, error: 'Break already ended' },
            { status: 400 }
          );
        }
        updateData.breakEnd = new Date();
        // Calculate break duration
        const breakStart = new Date(existingShift.breakStart);
        const breakEnd = new Date();
        const additionalBreakMinutes = Math.floor((breakEnd.getTime() - breakStart.getTime()) / (1000 * 60));
        updateData.breakMinutes = (existingShift.breakMinutes || 0) + additionalBreakMinutes;
        message = `Break ended (${additionalBreakMinutes} minutes)`;
        break;

      case 'updateTotals':
        if (body.totalOrders !== undefined) updateData.totalOrders = body.totalOrders;
        if (body.totalSales !== undefined) updateData.totalSales = body.totalSales;
        if (body.totalTips !== undefined) updateData.totalTips = body.totalTips;
        message = 'Shift totals updated';
        break;

      case 'updateBreak':
        if (breakMinutes !== undefined) {
          updateData.breakMinutes = breakMinutes;
        }
        message = 'Break time updated';
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    const shift = await db.staffShift.update({
      where: { id },
      data: updateData,
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
      message,
    });
  } catch (error) {
    console.error('Error updating shift:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update shift' },
      { status: 500 }
    );
  }
}
