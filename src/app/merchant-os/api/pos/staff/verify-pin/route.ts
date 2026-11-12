import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// Demo PINs for fallback
const DEMO_STAFF = [
  {
    id: 'demo-manager',
    name: 'Manager',
    email: 'manager@groway.co',
    phone: '+27123456780',
    pin: '1234',
    role: 'admin',
    status: 'active',
    color: '#E91E63',
    canVoid: true,
    canDiscount: true,
    canRefund: true,
    canCloseShift: true,
    canManageStaff: true,
    canViewReports: true,
  },
  {
    id: 'demo-supervisor',
    name: 'Supervisor',
    email: 'supervisor@groway.co',
    phone: '+27123456781',
    pin: '5678',
    role: 'supervisor',
    status: 'active',
    color: '#9C27B0',
    canVoid: true,
    canDiscount: true,
    canRefund: false,
    canCloseShift: true,
    canManageStaff: false,
    canViewReports: true,
  },
  {
    id: 'demo-waiter1',
    name: 'Waiter 1',
    email: 'waiter1@groway.co',
    phone: '+27123456782',
    pin: '1111',
    role: 'waiter',
    status: 'active',
    color: '#2196F3',
    canVoid: false,
    canDiscount: false,
    canRefund: false,
    canCloseShift: false,
    canManageStaff: false,
    canViewReports: false,
  },
  {
    id: 'demo-waiter2',
    name: 'Waiter 2',
    email: 'waiter2@groway.co',
    phone: '+27123456783',
    pin: '2222',
    role: 'waiter',
    status: 'active',
    color: '#00BCD4',
    canVoid: false,
    canDiscount: false,
    canRefund: false,
    canCloseShift: false,
    canManageStaff: false,
    canViewReports: false,
  },
  {
    id: 'demo-bartender',
    name: 'Bartender',
    email: 'bartender@groway.co',
    phone: '+27123456784',
    pin: '3333',
    role: 'bartender',
    status: 'active',
    color: '#FF9800',
    canVoid: false,
    canDiscount: false,
    canRefund: false,
    canCloseShift: false,
    canManageStaff: false,
    canViewReports: false,
  },
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pin } = body

    if (!pin || pin.length < 4) {
      return NextResponse.json({ valid: false, error: 'PIN is required (at least 4 digits)' }, { status: 400 })
    }

    // Try to get staff from database
    let staffList = []
    try {
      staffList = await db.restaurantStaff.findMany({
        where: { status: 'active' },
      })
    } catch (dbError) {
      console.log('Database not available, using demo staff')
    }

    // If no staff in database, seed demo staff
    if (staffList.length === 0) {
      try {
        // Call the seed endpoint
        await fetch(new URL('/merchant-os/api/pos/seed', request.url), { method: 'POST' })
        
        // Try to get staff again
        staffList = await db.restaurantStaff.findMany({
          where: { status: 'active' },
        })
      } catch (seedError) {
        console.log('Seed failed, using demo staff directly:', seedError)
      }
    }

    // If still no staff, use demo staff for verification
    if (staffList.length === 0) {
      console.log('Using demo staff for PIN verification')
      for (const staff of DEMO_STAFF) {
        if (staff.pin === pin) {
          const { pin: _, ...staffWithoutPin } = staff
          return NextResponse.json({
            valid: true,
            staff: staffWithoutPin,
          })
        }
      }
      return NextResponse.json({ valid: false, error: 'Invalid PIN. Try: 1234, 5678, 1111, 2222, or 3333' }, { status: 401 })
    }

    // Check each staff's PIN from database
    for (const staff of staffList) {
      if (!staff.pin) continue

      try {
        // Compare PIN with stored hash
        const isValid = await bcrypt.compare(pin, staff.pin)
        if (isValid) {
          // Return staff without PIN
          const { pin: _, ...staffWithoutPin } = staff
          return NextResponse.json({
            valid: true,
            staff: staffWithoutPin,
          })
        }
      } catch (compareError) {
        // PIN might be stored as plaintext, try direct comparison
        if (staff.pin === pin) {
          const { pin: _, ...staffWithoutPin } = staff
          return NextResponse.json({
            valid: true,
            staff: staffWithoutPin,
          })
        }
      }
    }

    return NextResponse.json({ valid: false, error: 'Invalid PIN. Try: 1234, 5678, 1111, 2222, or 3333' }, { status: 401 })
  } catch (error) {
    console.error('Error verifying PIN:', error)
    return NextResponse.json({ valid: false, error: 'Verification failed. Try demo PINs: 1234, 5678, 1111, 2222, 3333' }, { status: 500 })
  }
}
