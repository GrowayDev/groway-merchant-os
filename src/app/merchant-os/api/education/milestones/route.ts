import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/education/milestones - List milestones (with studentId filter)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    const where: any = {}

    if (studentId) {
      where.studentId = studentId
    }

    if (category && category !== 'all') {
      where.category = category
    }

    if (status && status !== 'all') {
      where.status = status
    }

    const milestones = await db.childcareMilestone.findMany({
      where,
      include: {
        student: {
          select: {
            studentNumber: true,
            firstName: true,
            lastName: true,
            grade: true,
            dateOfBirth: true,
            class: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { category: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Transform data
    const formattedMilestones = milestones.map(m => ({
      id: m.id,
      studentId: m.studentId,
      studentNumber: m.student.studentNumber,
      studentName: `${m.student.firstName} ${m.student.lastName}`,
      studentAge: calculateAge(m.student.dateOfBirth),
      grade: m.student.grade,
      className: m.student.class?.name || null,
      category: m.category,
      milestone: m.milestone,
      achievedDate: m.achievedDate?.toISOString().split('T')[0] || null,
      status: m.status,
      notes: m.notes,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString()
    }))

    // Calculate summary stats
    let stats = null
    if (milestones.length > 0) {
      const categoryCounts: Record<string, { total: number; achieved: number; pending: number }> = {}
      
      milestones.forEach(m => {
        if (!categoryCounts[m.category]) {
          categoryCounts[m.category] = { total: 0, achieved: 0, pending: 0 }
        }
        categoryCounts[m.category].total++
        if (m.status === 'achieved') {
          categoryCounts[m.category].achieved++
        } else {
          categoryCounts[m.category].pending++
        }
      })

      const totalAchieved = milestones.filter(m => m.status === 'achieved').length
      const totalPending = milestones.filter(m => m.status === 'pending').length

      stats = {
        total: milestones.length,
        achieved: totalAchieved,
        pending: totalPending,
        achievementRate: milestones.length > 0 ? Math.round((totalAchieved / milestones.length) * 100) : 0,
        byCategory: Object.entries(categoryCounts).map(([category, counts]) => ({
          category,
          ...counts,
          achievementRate: counts.total > 0 ? Math.round((counts.achieved / counts.total) * 100) : 0
        }))
      }
    }

    // Get unique categories for filtering
    const uniqueCategories = [...new Set(milestones.map(m => m.category))]

    return NextResponse.json({
      success: true,
      data: formattedMilestones,
      count: formattedMilestones.length,
      stats,
      filters: {
        categories: uniqueCategories
      }
    })
  } catch (error) {
    console.error('Error fetching milestones:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch milestones' },
      { status: 500 }
    )
  }
}

// POST /api/education/milestones - Add milestone achievement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      studentId,
      category,
      milestone,
      achievedDate,
      status = 'pending',
      notes
    } = body

    // Validate required fields
    if (!studentId || !category || !milestone) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: studentId, category, milestone' },
        { status: 400 }
      )
    }

    // Validate category
    const validCategories = ['motor', 'language', 'social', 'cognitive', 'self-care', 'emotional', 'other']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
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

    // Check for duplicate milestone for this student
    const existing = await db.childcareMilestone.findFirst({
      where: {
        studentId,
        category,
        milestone
      }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A milestone with this category and name already exists for this student' },
        { status: 400 }
      )
    }

    // Create milestone
    const newMilestone = await db.childcareMilestone.create({
      data: {
        studentId,
        category,
        milestone,
        achievedDate: achievedDate ? new Date(achievedDate) : null,
        status,
        notes: notes || null
      },
      include: {
        student: {
          select: {
            studentNumber: true,
            firstName: true,
            lastName: true,
            grade: true,
            dateOfBirth: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: newMilestone.id,
        studentId: newMilestone.studentId,
        studentNumber: newMilestone.student.studentNumber,
        studentName: `${newMilestone.student.firstName} ${newMilestone.student.lastName}`,
        studentAge: calculateAge(newMilestone.student.dateOfBirth),
        category: newMilestone.category,
        milestone: newMilestone.milestone,
        achievedDate: newMilestone.achievedDate?.toISOString().split('T')[0] || null,
        status: newMilestone.status,
        notes: newMilestone.notes,
        createdAt: newMilestone.createdAt.toISOString()
      },
      message: status === 'achieved' 
        ? 'Milestone achievement recorded successfully' 
        : 'Milestone added successfully'
    })
  } catch (error) {
    console.error('Error creating milestone:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create milestone' },
      { status: 500 }
    )
  }
}

// Helper function to calculate age from date of birth
function calculateAge(dateOfBirth: Date): string {
  const today = new Date()
  const birth = new Date(dateOfBirth)
  
  let years = today.getFullYear() - birth.getFullYear()
  let months = today.getMonth() - birth.getMonth()
  
  if (months < 0) {
    years--
    months += 12
  }
  
  if (years === 0) {
    return `${months} months`
  } else if (months === 0) {
    return `${years} year${years > 1 ? 's' : ''}`
  } else {
    return `${years} year${years > 1 ? 's' : ''} ${months} month${months > 1 ? 's' : ''}`
  }
}
