import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET single staff member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const staff = await db.restaurantStaff.findUnique({
      where: { id },
      include: {
        shifts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        orders: {
          where: { status: 'open' },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            orders: true,
            payments: true,
            voidLogs: true,
          },
        },
      },
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Staff not found' },
        { status: 404 }
      );
    }

    // Return staff without PIN
    const { pin, ...staffWithoutPin } = staff;

    return NextResponse.json({
      success: true,
      data: staffWithoutPin,
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch staff' },
      { status: 500 }
    );
  }
}

// PUT update staff
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if staff exists
    const existingStaff = await db.restaurantStaff.findUnique({
      where: { id },
    });

    if (!existingStaff) {
      return NextResponse.json(
        { success: false, error: 'Staff not found' },
        { status: 404 }
      );
    }

    const {
      name,
      email,
      phone,
      pin,
      role,
      avatar,
      color,
      canVoid,
      canDiscount,
      canRefund,
      canCloseShift,
      canManageStaff,
      canViewReports,
      assignedSections,
      status,
    } = body;

    // If email is being updated, check for duplicates
    if (email && email !== existingStaff.email) {
      const duplicateEmail = await db.restaurantStaff.findUnique({
        where: { email },
      });
      if (duplicateEmail) {
        return NextResponse.json(
          { success: false, error: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['waiter', 'bartender', 'host', 'supervisor', 'manager', 'admin'];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { success: false, error: 'Invalid role' },
          { status: 400 }
        );
      }
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['active', 'inactive', 'terminated'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (pin !== undefined) updateData.pin = pin;
    if (role !== undefined) updateData.role = role;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (color !== undefined) updateData.color = color;
    if (canVoid !== undefined) updateData.canVoid = canVoid;
    if (canDiscount !== undefined) updateData.canDiscount = canDiscount;
    if (canRefund !== undefined) updateData.canRefund = canRefund;
    if (canCloseShift !== undefined) updateData.canCloseShift = canCloseShift;
    if (canManageStaff !== undefined) updateData.canManageStaff = canManageStaff;
    if (canViewReports !== undefined) updateData.canViewReports = canViewReports;
    if (assignedSections !== undefined) updateData.assignedSections = assignedSections;
    if (status !== undefined) updateData.status = status;

    const staff = await db.restaurantStaff.update({
      where: { id },
      data: updateData,
    });

    // Return staff without PIN
    const { pin: _, ...staffWithoutPin } = staff;

    return NextResponse.json({
      success: true,
      data: staffWithoutPin,
      message: 'Staff updated successfully',
    });
  } catch (error) {
    console.error('Error updating staff:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update staff' },
      { status: 500 }
    );
  }
}

// DELETE staff
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if staff exists
    const existingStaff = await db.restaurantStaff.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            shifts: { where: { status: 'active' } },
            orders: { where: { status: 'open' } },
          },
        },
      },
    });

    if (!existingStaff) {
      return NextResponse.json(
        { success: false, error: 'Staff not found' },
        { status: 404 }
      );
    }

    // Check for active shifts or orders
    if (existingStaff._count.shifts > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete staff with active shift' },
        { status: 400 }
      );
    }

    if (existingStaff._count.orders > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete staff with open orders' },
        { status: 400 }
      );
    }

    // Soft delete by setting status to terminated
    await db.restaurantStaff.update({
      where: { id },
      data: { status: 'terminated' },
    });

    return NextResponse.json({
      success: true,
      message: 'Staff deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting staff:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete staff' },
      { status: 500 }
    );
  }
}
