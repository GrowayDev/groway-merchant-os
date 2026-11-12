import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// GET /api/merchant-os/childcare/attendance - Get attendance for a merchant
export async function GET(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') || 
                       request.nextUrl.searchParams.get('merchantId')
    const date = request.nextUrl.searchParams.get('date') || new Date().toISOString().split('T')[0]

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
    }

    const attendance = await db.childcareAttendance.findMany({
      where: { 
        merchantId,
        date
      },
      include: {
        ChildcareChild: {
          select: {
            firstName: true,
            lastName: true,
            ageGroup: true,
            classId: true
          }
        }
      }
    })

    // Transform to match frontend interface
    const transformedAttendance = attendance.map(att => ({
      id: att.id,
      childId: att.childId,
      child: att.ChildcareChild,
      date: att.date,
      status: att.status,
      checkInTime: att.checkInTime,
      checkOutTime: att.checkOutTime,
      checkedInBy: att.checkedInBy,
      checkedOutBy: att.checkedOutBy,
      notes: att.notes,
      latePickup: att.latePickup,
      latePickupFee: att.latePickupFee
    }))

    return NextResponse.json({ 
      attendance: transformedAttendance,
      date,
      summary: {
        total: attendance.length,
        present: attendance.filter(a => a.status === 'present').length,
        absent: attendance.filter(a => a.status === 'absent').length,
        notCheckedIn: attendance.filter(a => a.status === 'not_checked_in').length
      }
    })
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
  }
}

// POST /api/merchant-os/childcare/attendance - Check in/out a child
export async function POST(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') ||
                       request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
    }

    const body = await request.json()
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    // Check if attendance record exists for today
    const existing = await db.childcareAttendance.findUnique({
      where: {
        childId_date: {
          childId: body.childId,
          date: today
        }
      }
    })

    let attendance
    if (existing) {
      // Update existing record
      attendance = await db.childcareAttendance.update({
        where: { id: existing.id },
        data: {
          status: body.action === 'check_in' ? 'present' : body.action === 'check_out' ? 'checked_out' : existing.status,
          checkInTime: body.action === 'check_in' ? now : existing.checkInTime,
          checkOutTime: body.action === 'check_out' ? now : existing.checkOutTime,
          checkedInBy: body.action === 'check_in' ? body.checkedInBy : existing.checkedInBy,
          checkedOutBy: body.action === 'check_out' ? body.checkedOutBy : existing.checkedOutBy
        }
      })

      // Update child's check-in status
      await db.childcareChild.update({
        where: { id: body.childId },
        data: {
          checkInStatus: body.action === 'check_in' ? 'checked_in' : body.action === 'check_out' ? 'checked_out' : undefined,
          checkInTime: body.action === 'check_in' ? now : undefined,
          checkOutTime: body.action === 'check_out' ? now : undefined
        }
      })
    } else {
      // Create new attendance record
      const attId = `ATT-${nanoid(8).toUpperCase()}`
      attendance = await db.childcareAttendance.create({
        data: {
          id: attId,
          merchantId,
          childId: body.childId,
          date: today,
          status: body.action === 'check_in' ? 'present' : 'not_checked_in',
          checkInTime: body.action === 'check_in' ? now : null,
          checkedInBy: body.action === 'check_in' ? body.checkedInBy : null
        }
      })

      // Update child's check-in status
      if (body.action === 'check_in') {
        await db.childcareChild.update({
          where: { id: body.childId },
          data: {
            checkInStatus: 'checked_in',
            checkInTime: now
          }
        })
      }
    }

    return NextResponse.json({ success: true, attendance })
  } catch (error) {
    console.error('Error updating attendance:', error)
    return NextResponse.json({ error: 'Failed to update attendance' }, { status: 500 })
  }
}
