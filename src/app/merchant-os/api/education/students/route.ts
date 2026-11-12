import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/education/students - List students with class, grade, status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const grade = searchParams.get('grade')
    const classId = searchParams.get('classId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = {}

    if (grade && grade !== 'all') {
      where.grade = grade
    }

    if (classId && classId !== 'all') {
      where.classId = classId
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { studentNumber: { contains: search, mode: 'insensitive' } }
      ]
    }

    const students = await db.educationStudent.findMany({
      where,
      include: {
        class: true,
        studentParents: {
          include: {
            parent: true
          }
        },
        medicalInfo: true
      },
      orderBy: [
        { grade: 'asc' },
        { lastName: 'asc' }
      ]
    })

    // Transform data for frontend
    const formattedStudents = students.map(student => ({
      id: student.id,
      studentNumber: student.studentNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      fullName: `${student.firstName} ${student.lastName}`,
      dateOfBirth: student.dateOfBirth.toISOString().split('T')[0],
      gender: student.gender,
      idNumber: student.idNumber,
      grade: student.grade,
      classId: student.classId,
      className: student.class?.name || null,
      status: student.status,
      parents: student.studentParents.map(sp => ({
        id: sp.parent.id,
        firstName: sp.parent.firstName,
        lastName: sp.parent.lastName,
        fullName: `${sp.parent.firstName} ${sp.parent.lastName}`,
        email: sp.parent.email,
        phone: sp.parent.phone,
        relationship: sp.relationship,
        isPrimary: sp.isPrimary,
        emergencyContact: sp.emergencyContact
      })),
      medicalInfo: student.medicalInfo ? {
        allergies: student.medicalInfo.allergies,
        conditions: student.medicalInfo.conditions,
        medications: student.medicalInfo.medications
      } : null,
      createdAt: student.createdAt.toISOString(),
      updatedAt: student.updatedAt.toISOString()
    }))

    // Get summary stats
    const totalStudents = await db.educationStudent.count()
    const activeStudents = await db.educationStudent.count({ where: { status: 'active' } })
    const gradeDistribution = await db.educationStudent.groupBy({
      by: ['grade'],
      _count: { id: true }
    })

    return NextResponse.json({
      success: true,
      data: formattedStudents,
      count: formattedStudents.length,
      stats: {
        total: totalStudents,
        active: activeStudents,
        gradeDistribution: gradeDistribution.map(g => ({
          grade: g.grade,
          count: g._count.id
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}

// POST /api/education/students - Create new student
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      studentNumber,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      idNumber,
      grade,
      classId,
      status = 'active',
      parents = [],
      medicalInfo
    } = body

    // Validate required fields
    if (!studentNumber || !firstName || !lastName || !dateOfBirth || !gender || !grade) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: studentNumber, firstName, lastName, dateOfBirth, gender, grade' },
        { status: 400 }
      )
    }

    // Check for duplicate student number
    const existingStudent = await db.educationStudent.findUnique({
      where: { studentNumber }
    })

    if (existingStudent) {
      return NextResponse.json(
        { success: false, error: 'A student with this student number already exists' },
        { status: 400 }
      )
    }

    // Create student with optional relations
    const student = await db.educationStudent.create({
      data: {
        studentNumber,
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        idNumber: idNumber || null,
        grade,
        classId: classId || null,
        status,
        ...(parents.length > 0 && {
          studentParents: {
            create: parents.map((p: any) => ({
              parentId: p.parentId,
              relationship: p.relationship,
              isPrimary: p.isPrimary || false,
              emergencyContact: p.emergencyContact || false
            }))
          }
        }),
        ...(medicalInfo && {
          medicalInfo: {
            create: {
              allergies: medicalInfo.allergies || null,
              conditions: medicalInfo.conditions || null,
              medications: medicalInfo.medications || null,
              doctorName: medicalInfo.doctorName || null,
              doctorPhone: medicalInfo.doctorPhone || null,
              emergencyContact: medicalInfo.emergencyContact || null,
              emergencyPhone: medicalInfo.emergencyPhone || null,
              notes: medicalInfo.notes || null
            }
          }
        })
      },
      include: {
        class: true,
        studentParents: {
          include: {
            parent: true
          }
        },
        medicalInfo: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: student.id,
        studentNumber: student.studentNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        fullName: `${student.firstName} ${student.lastName}`,
        dateOfBirth: student.dateOfBirth.toISOString().split('T')[0],
        gender: student.gender,
        idNumber: student.idNumber,
        grade: student.grade,
        classId: student.classId,
        className: student.class?.name || null,
        status: student.status,
        createdAt: student.createdAt.toISOString(),
        updatedAt: student.updatedAt.toISOString()
      },
      message: 'Student created successfully'
    })
  } catch (error) {
    console.error('Error creating student:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create student' },
      { status: 500 }
    )
  }
}
