import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/education/fees - List fee transactions (with studentId filter)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const parentId = searchParams.get('parentId')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}

    if (studentId) {
      where.studentId = studentId
    }

    if (parentId) {
      where.parentId = parentId
    }

    if (type && type !== 'all') {
      where.type = type
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const fees = await db.educationFeeTransaction.findMany({
      where,
      include: {
        student: {
          select: {
            studentNumber: true,
            firstName: true,
            lastName: true,
            grade: true
          }
        },
        parent: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform data
    const formattedFees = fees.map(f => ({
      id: f.id,
      studentId: f.studentId,
      studentNumber: f.student?.studentNumber || null,
      studentName: f.student ? `${f.student.firstName} ${f.student.lastName}` : null,
      studentGrade: f.student?.grade || null,
      parentId: f.parentId,
      parentName: f.parent ? `${f.parent.firstName} ${f.parent.lastName}` : null,
      parentEmail: f.parent?.email || null,
      parentPhone: f.parent?.phone || null,
      type: f.type,
      amount: f.amount,
      description: f.description,
      dueDate: f.dueDate?.toISOString().split('T')[0] || null,
      paidDate: f.paidDate?.toISOString().split('T')[0] || null,
      method: f.method,
      reference: f.reference,
      status: f.status,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString()
    }))

    // Calculate summary stats
    let stats = null
    if (fees.length > 0) {
      const invoices = fees.filter(f => f.type === 'invoice' || f.type === 'tuition' || f.type === 'fee')
      const payments = fees.filter(f => f.type === 'payment')

      const totalInvoiced = invoices.reduce((sum, f) => sum + f.amount, 0)
      const totalPaid = payments.reduce((sum, f) => sum + f.amount, 0)
      const outstanding = totalInvoiced - totalPaid

      const pending = fees.filter(f => f.status === 'pending').reduce((sum, f) => sum + f.amount, 0)
      const overdueFees = fees.filter(f => f.status === 'overdue')
      const overdue = overdueFees.reduce((sum, f) => sum + f.amount, 0)

      stats = {
        totalInvoiced,
        totalPaid,
        outstanding,
        pending,
        overdue,
        overdueCount: overdueFees.length
      }
    }

    // Calculate outstanding balance per student if filtering by student
    let outstandingBalance = null
    if (studentId) {
      const studentFees = await db.educationFeeTransaction.findMany({
        where: { studentId }
      })

      const invoiced = studentFees
        .filter(f => f.type === 'invoice' || f.type === 'tuition' || f.type === 'fee')
        .reduce((sum, f) => sum + f.amount, 0)
      const paid = studentFees
        .filter(f => f.type === 'payment')
        .reduce((sum, f) => sum + f.amount, 0)

      outstandingBalance = {
        invoiced,
        paid,
        outstanding: invoiced - paid
      }
    }

    return NextResponse.json({
      success: true,
      data: formattedFees,
      count: formattedFees.length,
      stats,
      outstandingBalance
    })
  } catch (error) {
    console.error('Error fetching fees:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch fees' },
      { status: 500 }
    )
  }
}

// POST /api/education/fees - Create fee transaction (invoice/payment)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      studentId,
      parentId,
      type,
      amount,
      description,
      dueDate,
      paidDate,
      method,
      reference,
      status = 'pending'
    } = body

    // Validate required fields
    if (!type || !amount || !description) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, amount, description' },
        { status: 400 }
      )
    }

    // Validate type
    const validTypes = ['invoice', 'tuition', 'fee', 'payment', 'refund', 'other']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate student exists if provided
    if (studentId) {
      const student = await db.educationStudent.findUnique({
        where: { id: studentId }
      })
      if (!student) {
        return NextResponse.json(
          { success: false, error: 'Student not found' },
          { status: 404 }
        )
      }
    }

    // Validate parent exists if provided
    if (parentId) {
      const parent = await db.educationParent.findUnique({
        where: { id: parentId }
      })
      if (!parent) {
        return NextResponse.json(
          { success: false, error: 'Parent not found' },
          { status: 404 }
        )
      }
    }

    // Create fee transaction
    const fee = await db.educationFeeTransaction.create({
      data: {
        studentId: studentId || null,
        parentId: parentId || null,
        type,
        amount: parseFloat(amount),
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        paidDate: paidDate ? new Date(paidDate) : null,
        method: method || null,
        reference: reference || null,
        status
      },
      include: {
        student: {
          select: {
            studentNumber: true,
            firstName: true,
            lastName: true,
            grade: true
          }
        },
        parent: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    })

    // Calculate and return outstanding balance
    let outstandingBalance = null
    if (studentId) {
      const studentFees = await db.educationFeeTransaction.findMany({
        where: { studentId }
      })

      const invoiced = studentFees
        .filter(f => f.type === 'invoice' || f.type === 'tuition' || f.type === 'fee')
        .reduce((sum, f) => sum + f.amount, 0)
      const paid = studentFees
        .filter(f => f.type === 'payment')
        .reduce((sum, f) => sum + f.amount, 0)

      outstandingBalance = {
        invoiced,
        paid,
        outstanding: invoiced - paid
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: fee.id,
        studentId: fee.studentId,
        studentNumber: fee.student?.studentNumber || null,
        studentName: fee.student ? `${fee.student.firstName} ${fee.student.lastName}` : null,
        parentId: fee.parentId,
        parentName: fee.parent ? `${fee.parent.firstName} ${fee.parent.lastName}` : null,
        type: fee.type,
        amount: fee.amount,
        description: fee.description,
        dueDate: fee.dueDate?.toISOString().split('T')[0] || null,
        paidDate: fee.paidDate?.toISOString().split('T')[0] || null,
        method: fee.method,
        reference: fee.reference,
        status: fee.status,
        createdAt: fee.createdAt.toISOString()
      },
      outstandingBalance,
      message: `${type === 'payment' ? 'Payment' : 'Fee transaction'} recorded successfully`
    })
  } catch (error) {
    console.error('Error creating fee transaction:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create fee transaction' },
      { status: 500 }
    )
  }
}
