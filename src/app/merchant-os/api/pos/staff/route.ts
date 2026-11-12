import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all staff
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const role = searchParams.get('role');

    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    if (role) {
      where.role = role;
    }

    const staff = await db.restaurantStaff.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        shifts: {
          where: {
            status: 'active',
          },
          take: 1,
        },
        _count: {
          select: {
            orders: true,
            payments: true,
          },
        },
      },
    });

    // Return staff without PINs
    const staffWithoutPins = staff.map(({ pin, ...rest }) => rest);

    return NextResponse.json({
      success: true,
      data: staffWithoutPins,
      count: staff.length,
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch staff' },
      { status: 500 }
    );
  }
}

// POST create new staff
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      name,
      email,
      phone,
      pin,
      role = 'waiter',
      avatar,
      color = '#00897B',
      canVoid = false,
      canDiscount = false,
      canRefund = false,
      canCloseShift = false,
      canManageStaff = false,
      canViewReports = false,
      assignedSections,
    } = body;

    // Validate required fields
    if (!name || !pin) {
      return NextResponse.json(
        { success: false, error: 'Name and PIN are required' },
        { status: 400 }
      );
    }

    // Validate PIN length
    if (pin.length < 4 || pin.length > 6) {
      return NextResponse.json(
        { success: false, error: 'PIN must be 4-6 digits' },
        { status: 400 }
      );
    }

    // Check if email already exists
    if (email) {
      const existingStaff = await db.restaurantStaff.findUnique({
        where: { email },
      });
      if (existingStaff) {
        return NextResponse.json(
          { success: false, error: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    // Validate role
    const validRoles = ['waiter', 'bartender', 'host', 'supervisor', 'manager', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    const staff = await db.restaurantStaff.create({
      data: {
        name,
        email,
        phone,
        pin, // Raw PIN - will be hashed later
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
        status: 'active',
      },
    });

    // Return staff without PIN
    const { pin: _, ...staffWithoutPin } = staff;

    return NextResponse.json({
      success: true,
      data: staffWithoutPin,
      message: 'Staff created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating staff:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create staff' },
      { status: 500 }
    );
  }
}
