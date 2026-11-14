import { NextRequest, NextResponse } from 'next/server'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'
import { db } from '@/lib/db'

// GET /merchant-os/api/staff/employees — list employees
export async function GET(request: NextRequest) {
  try {
    const merchantId = await getMerchantIdWithDevFallback(request)
    if (!merchantId) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    const employees = await db.employee.findMany({
      where: { merchantId },
      orderBy: { name: 'asc' },
    }).catch(() => [])
    return NextResponse.json({ success: true, employees, count: employees.length })
  } catch (error) {
    console.error('[staff/employees] GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch employees' }, { status: 500 })
  }
}

// POST /merchant-os/api/staff/employees — create employee
export async function POST(request: NextRequest) {
  try {
    const merchantId = await getMerchantIdWithDevFallback(request)
    if (!merchantId) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    const body = await request.json()
    const { name, email, phone, idNumber, taxNumber, role, department, employmentType, payFrequency, monthlySalary, hourlyRate, bankName, bankAccountNo, bankBranchCode, startDate } = body
    if (!name) return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 })
    const employee = await db.employee.create({
      data: {
        merchantId,
        name,
        email: email || null,
        phone: phone || null,
        idNumber: idNumber || null,
        taxNumber: taxNumber || null,
        role: role || 'staff',
        department: department || null,
        employmentType: employmentType || 'permanent',
        payFrequency: payFrequency || 'monthly',
        monthlySalary: monthlySalary || 0,
        hourlyRate: hourlyRate || 0,
        bankName: bankName || null,
        bankAccountNo: bankAccountNo || null,
        bankBranchCode: bankBranchCode || null,
        startDate: startDate ? new Date(startDate) : new Date(),
        updatedAt: new Date(),
      },
    })
    return NextResponse.json({ success: true, employee })
  } catch (error) {
    console.error('[staff/employees] POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create employee' }, { status: 500 })
  }
}
