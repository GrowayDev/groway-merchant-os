import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/education/grades - Get grades (with studentId, subject, term filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const subject = searchParams.get('subject')
    const term = searchParams.get('term')
    const academicYear = searchParams.get('academicYear')
    const grade = searchParams.get('grade') // Grade level filter

    const where: any = {}

    if (studentId) {
      where.studentId = studentId
    }

    if (subject && subject !== 'all') {
      where.subject = subject
    }

    if (term && term !== 'all') {
      where.term = term
    }

    if (academicYear) {
      where.academicYear = academicYear
    }

    // Filter by student's grade level
    if (grade && grade !== 'all') {
      where.student = {
        grade
      }
    }

    const grades = await db.educationGrade.findMany({
      where,
      include: {
        student: {
          include: {
            class: true
          }
        }
      },
      orderBy: [
        { academicYear: 'desc' },
        { term: 'asc' },
        { subject: 'asc' }
      ]
    })

    // Transform data
    const formattedGrades = grades.map(g => ({
      id: g.id,
      studentId: g.studentId,
      studentNumber: g.student.studentNumber,
      studentName: `${g.student.firstName} ${g.student.lastName}`,
      grade: g.student.grade,
      className: g.student.class?.name || null,
      subject: g.subject,
      assessment: g.assessment,
      mark: g.mark,
      weight: g.weight,
      term: g.term,
      academicYear: g.academicYear,
      comments: g.comments,
      gradedBy: g.gradedBy,
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt.toISOString()
    }))

    // Calculate summary stats if filtering by student
    let stats = null
    if (studentId && formattedGrades.length > 0) {
      const subjectAverages: Record<string, { total: number; count: number }> = {}
      
      formattedGrades.forEach(g => {
        if (!subjectAverages[g.subject]) {
          subjectAverages[g.subject] = { total: 0, count: 0 }
        }
        subjectAverages[g.subject].total += g.mark * g.weight
        subjectAverages[g.subject].count += g.weight
      })

      const subjectStats = Object.entries(subjectAverages).map(([subject, data]) => ({
        subject,
        average: data.count > 0 ? Math.round((data.total / data.count) * 100) / 100 : 0,
        count: formattedGrades.filter(g => g.subject === subject).length
      }))

      const totalMarks = formattedGrades.reduce((sum, g) => sum + g.mark * g.weight, 0)
      const totalWeight = formattedGrades.reduce((sum, g) => sum + g.weight, 0)
      const overallAverage = totalWeight > 0 ? Math.round((totalMarks / totalWeight) * 100) / 100 : 0

      stats = {
        totalAssessments: formattedGrades.length,
        overallAverage,
        subjectStats
      }
    }

    // Get unique subjects for filtering
    const uniqueSubjects = [...new Set(grades.map(g => g.subject))]

    return NextResponse.json({
      success: true,
      data: formattedGrades,
      count: formattedGrades.length,
      stats,
      filters: {
        subjects: uniqueSubjects
      }
    })
  } catch (error) {
    console.error('Error fetching grades:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch grades' },
      { status: 500 }
    )
  }
}

// POST /api/education/grades - Add grade record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      studentId,
      subject,
      assessment,
      mark,
      weight = 1,
      term,
      academicYear,
      comments,
      gradedBy
    } = body

    // Validate required fields
    if (!studentId || !subject || !assessment || mark === undefined || !term || !academicYear) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: studentId, subject, assessment, mark, term, academicYear' },
        { status: 400 }
      )
    }

    // Validate mark range (0-100 typically)
    if (mark < 0 || mark > 100) {
      return NextResponse.json(
        { success: false, error: 'Mark must be between 0 and 100' },
        { status: 400 }
      )
    }

    // Verify student exists
    const student = await db.educationStudent.findUnique({
      where: { id: studentId }
    })

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      )
    }

    // Create grade record
    const grade = await db.educationGrade.create({
      data: {
        studentId,
        subject,
        assessment,
        mark: parseFloat(mark),
        weight: parseFloat(weight),
        term,
        academicYear,
        comments: comments || null,
        gradedBy: gradedBy || null
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

    return NextResponse.json({
      success: true,
      data: {
        id: grade.id,
        studentId: grade.studentId,
        studentNumber: grade.student.studentNumber,
        studentName: `${grade.student.firstName} ${grade.student.lastName}`,
        subject: grade.subject,
        assessment: grade.assessment,
        mark: grade.mark,
        weight: grade.weight,
        term: grade.term,
        academicYear: grade.academicYear,
        comments: grade.comments,
        gradedBy: grade.gradedBy,
        createdAt: grade.createdAt.toISOString()
      },
      message: 'Grade recorded successfully'
    })
  } catch (error) {
    console.error('Error creating grade:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create grade' },
      { status: 500 }
    )
  }
}
