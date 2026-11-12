import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/education/attendance - Get attendance by date (with classId filter)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const classId = searchParams.get('classId')
    const studentId = searchParams.get('studentId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause
    const where: any = {}

    if (date) {
      const targetDate = new Date(date)
      const nextDay = new Date(targetDate)
      nextDay.setDate(nextDay.getDate() + 1)
      where.date = {
        gte: targetDate,
        lt: nextDay
      }
    } else if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    // If classId is provided, filter by students in that class
    if (classId && classId !== 'all') {
      where.student = {
        classId
      }
    }

    if (studentId) {
      where.studentId = studentId
    }

    const attendance = await db.educationAttendance.findMany({
      where,
      include: {
        student: {
          include: {
            class: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Transform data
    const formattedAttendance = attendance.map(a => ({
      id: a.id,
      studentId: a.studentId,
      studentNumber: a.student.studentNumber,
      studentName: `${a.student.firstName} ${a.student.lastName}`,
      grade: a.student.grade,
      className: a.student.class?.name || null,
      date: a.date.toISOString().split('T')[0],
      status: a.status,
      checkIn: a.checkIn?.toISOString() || null,
      checkOut: a.checkOut?.toISOString() || null,
      notes: a.notes,
      markedBy: a.markedBy,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString()
    }))

    // Calculate summary stats if filtering by date
    let stats = null
    if (date && formattedAttendance.length > 0) {
      const present = formattedAttendance.filter(a => a.status === 'present').length
      const absent = formattedAttendance.filter(a => a.status === 'absent').length
      const late = formattedAttendance.filter(a => a.status === 'late').length
      const excused = formattedAttendance.filter(a => a.status === 'excused').length
      const total = formattedAttendance.length

      stats = {
        total,
        present,
        absent,
        late,
        excused,
        attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0
      }
    }

    return NextResponse.json({
      success: true,
      data: formattedAttendance,
      count: formattedAttendance.length,
      stats
    })
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attendance' },
      { status: 500 }
    )
  }
}

// POST /api/education/attendance - Mark attendance (single or bulk)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { records, single } = body

    // Handle single attendance record
    if (single) {
      const { studentId, date, status, checkIn, checkOut, notes, markedBy } = single

      if (!studentId || !date || !status) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields: studentId, date, status' },
          { status: 400 }
        )
      }

      const attendanceDate = new Date(date)

      // Check if attendance already exists for this student on this date
      const existing = await db.educationAttendance.findFirst({
        where: {
          studentId,
          date: {
            gte: new Date(attendanceDate.setHours(0, 0, 0, 0)),
            lt: new Date(attendanceDate.setHours(23, 59, 59, 999))
          }
        }
      })

      let attendance
      if (existing) {
        // Update existing record
        attendance = await db.educationAttendance.update({
          where: { id: existing.id },
          data: {
            status,
            checkIn: checkIn ? new Date(checkIn) : null,
            checkOut: checkOut ? new Date(checkOut) : null,
            notes: notes || null,
            markedBy: markedBy || null,
            updatedAt: new Date()
          }
        })
      } else {
        // Create new record
        attendance = await db.educationAttendance.create({
          data: {
            studentId,
            date: attendanceDate,
            status,
            checkIn: checkIn ? new Date(checkIn) : null,
            checkOut: checkOut ? new Date(checkOut) : null,
            notes: notes || null,
            markedBy: markedBy || null
          }
        })
      }

      return NextResponse.json({
        success: true,
        data: {
          id: attendance.id,
          studentId: attendance.studentId,
          date: attendance.date.toISOString().split('T')[0],
          status: attendance.status,
          checkIn: attendance.checkIn?.toISOString() || null,
          checkOut: attendance.checkOut?.toISOString() || null,
          notes: attendance.notes,
          markedBy: attendance.markedBy
        },
        message: 'Attendance recorded successfully'
      })
    }

    // Handle bulk attendance records
    if (records && Array.isArray(records)) {
      const results = []
      const errors = []

      for (const record of records) {
        try {
          const { studentId, date, status, checkIn, checkOut, notes, markedBy } = record

          if (!studentId || !date || !status) {
            errors.push({ studentId, error: 'Missing required fields' })
            continue
          }

          const attendanceDate = new Date(date)

          // Check if attendance already exists
          const existing = await db.educationAttendance.findFirst({
            where: {
              studentId,
              date: {
                gte: new Date(attendanceDate.setHours(0, 0, 0, 0)),
                lt: new Date(attendanceDate.setHours(23, 59, 59, 999))
              }
            }
          })

          let attendance
          if (existing) {
            attendance = await db.educationAttendance.update({
              where: { id: existing.id },
              data: {
                status,
                checkIn: checkIn ? new Date(checkIn) : null,
                checkOut: checkOut ? new Date(checkOut) : null,
                notes: notes || null,
                markedBy: markedBy || null,
                updatedAt: new Date()
              }
            })
          } else {
            attendance = await db.educationAttendance.create({
              data: {
                studentId,
                date: attendanceDate,
                status,
                checkIn: checkIn ? new Date(checkIn) : null,
                checkOut: checkOut ? new Date(checkOut) : null,
                notes: notes || null,
                markedBy: markedBy || null
              }
            })
          }

          results.push({
            id: attendance.id,
            studentId: attendance.studentId,
            date: attendance.date.toISOString().split('T')[0],
            status: attendance.status
          })
        } catch (err) {
          errors.push({ studentId: record.studentId, error: 'Failed to record attendance' })
        }
      }

      return NextResponse.json({
        success: true,
        data: results,
        errors,
        processed: results.length,
        failed: errors.length,
        message: `Processed ${results.length} attendance records${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request body. Provide either "single" or "records" array.' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error recording attendance:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to record attendance' },
      { status: 500 }
    )
  }
}
