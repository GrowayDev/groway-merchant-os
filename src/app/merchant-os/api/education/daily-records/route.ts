import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/education/daily-records - Get daily record by student and date
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const recordedBy = searchParams.get('recordedBy')

    const where: any = {}

    if (studentId) {
      where.studentId = studentId
    }

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

    if (recordedBy) {
      where.recordedBy = recordedBy
    }

    const dailyRecords = await db.childcareDailyRecord.findMany({
      where,
      include: {
        student: {
          select: {
            studentNumber: true,
            firstName: true,
            lastName: true,
            grade: true,
            class: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Transform data
    const formattedRecords = dailyRecords.map(r => ({
      id: r.id,
      studentId: r.studentId,
      studentNumber: r.student.studentNumber,
      studentName: `${r.student.firstName} ${r.student.lastName}`,
      grade: r.student.grade,
      className: r.student.class?.name || null,
      date: r.date.toISOString().split('T')[0],
      arrivalTime: r.arrivalTime,
      departureTime: r.departureTime,
      mood: r.mood,
      meals: r.meals ? JSON.parse(r.meals) : null,
      naps: r.naps ? JSON.parse(r.naps) : null,
      activities: r.activities ? JSON.parse(r.activities) : null,
      toiletDiapers: r.toiletDiapers ? JSON.parse(r.toiletDiapers) : null,
      notes: r.notes,
      recordedBy: r.recordedBy,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString()
    }))

    // Get summary stats for the date range
    let stats = null
    if (formattedRecords.length > 0) {
      const moodCounts: Record<string, number> = {}
      formattedRecords.forEach(r => {
        if (r.mood) {
          moodCounts[r.mood] = (moodCounts[r.mood] || 0) + 1
        }
      })

      stats = {
        totalRecords: formattedRecords.length,
        moodDistribution: Object.entries(moodCounts).map(([mood, count]) => ({
          mood,
          count
        }))
      }
    }

    return NextResponse.json({
      success: true,
      data: formattedRecords,
      count: formattedRecords.length,
      stats
    })
  } catch (error) {
    console.error('Error fetching daily records:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch daily records' },
      { status: 500 }
    )
  }
}

// POST /api/education/daily-records - Create/update daily record (meals, naps, activities)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      studentId,
      date,
      arrivalTime,
      departureTime,
      mood,
      meals,
      naps,
      activities,
      toiletDiapers,
      notes,
      recordedBy
    } = body

    // Validate required fields
    if (!studentId || !date) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: studentId, date' },
        { status: 400 }
      )
    }

    // Validate student exists
    const student = await db.educationStudent.findUnique({
      where: { id: studentId }
    })

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      )
    }

    const recordDate = new Date(date)

    // Check if record already exists for this student on this date
    const existing = await db.childcareDailyRecord.findFirst({
      where: {
        studentId,
        date: {
          gte: new Date(recordDate.setHours(0, 0, 0, 0)),
          lt: new Date(recordDate.setHours(23, 59, 59, 999))
        }
      }
    })

    // Prepare data
    const recordData = {
      arrivalTime: arrivalTime || null,
      departureTime: departureTime || null,
      mood: mood || null,
      meals: meals ? JSON.stringify(meals) : null,
      naps: naps ? JSON.stringify(naps) : null,
      activities: activities ? JSON.stringify(activities) : null,
      toiletDiapers: toiletDiapers ? JSON.stringify(toiletDiapers) : null,
      notes: notes || null,
      recordedBy: recordedBy || null
    }

    let record
    if (existing) {
      // Update existing record
      record = await db.childcareDailyRecord.update({
        where: { id: existing.id },
        data: {
          ...recordData,
          updatedAt: new Date()
        },
        include: {
          student: {
            select: {
              studentNumber: true,
              firstName: true,
              lastName: true,
              grade: true
            }
          }
        }
      })
    } else {
      // Create new record
      record = await db.childcareDailyRecord.create({
        data: {
          studentId,
          date: new Date(date),
          ...recordData
        },
        include: {
          student: {
            select: {
              studentNumber: true,
              firstName: true,
              lastName: true,
              grade: true
            }
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: record.id,
        studentId: record.studentId,
        studentNumber: record.student.studentNumber,
        studentName: `${record.student.firstName} ${record.student.lastName}`,
        date: record.date.toISOString().split('T')[0],
        arrivalTime: record.arrivalTime,
        departureTime: record.departureTime,
        mood: record.mood,
        meals: record.meals ? JSON.parse(record.meals) : null,
        naps: record.naps ? JSON.parse(record.naps) : null,
        activities: record.activities ? JSON.parse(record.activities) : null,
        toiletDiapers: record.toiletDiapers ? JSON.parse(record.toiletDiapers) : null,
        notes: record.notes,
        recordedBy: record.recordedBy,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString()
      },
      message: existing ? 'Daily record updated successfully' : 'Daily record created successfully'
    })
  } catch (error) {
    console.error('Error creating/updating daily record:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create/update daily record' },
      { status: 500 }
    )
  }
}
