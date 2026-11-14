import { NextRequest, NextResponse } from 'next/server'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'
import { db } from '@/lib/db'

// GET /merchant-os/api/staff/payroll/pay-runs — list pay runs
export async function GET(request: NextRequest) {
  try {
    const merchantId = await getMerchantIdWithDevFallback(request)
    if (!merchantId) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    const payRuns = await db.payRun.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
      include: { payslips: { select: { id: true, netPay: true, status: true } } },
    }).catch(() => [])
    return NextResponse.json({ success: true, payRuns })
  } catch (error) {
    console.error('[staff/pay-runs] GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch pay runs' }, { status: 500 })
  }
}

// POST /merchant-os/api/staff/payroll/pay-runs — create + process a pay run (generates payslips)
export async function POST(request: NextRequest) {
  try {
    const merchantId = await getMerchantIdWithDevFallback(request)
    if (!merchantId) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })

    const body = await request.json()
    const { payPeriod, startDate, endDate, payDate } = body
    if (!payPeriod || !startDate || !endDate) {
      return NextResponse.json({ success: false, error: 'payPeriod, startDate, endDate are required' }, { status: 400 })
    }

    // Get all active employees
    const employees = await db.employee.findMany({
      where: { merchantId, status: 'active' },
    }).catch(() => [])

    if (employees.length === 0) {
      return NextResponse.json({ success: false, error: 'No active employees found. Add employees first.' }, { status: 400 })
    }

    // Create the pay run
    const payRun = await db.payRun.create({
      data: {
        merchantId,
        payPeriod,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        payDate: payDate ? new Date(payDate) : new Date(),
        status: 'processed',
        employeeCount: employees.length,
        updatedAt: new Date(),
      },
    })

    // Generate payslips for each employee
    let totalGross = 0
    let totalDeductions = 0
    let totalNet = 0

    for (const emp of employees) {
      const basicSalary = emp.monthlySalary || 0
      const overtimePay = 0
      const bonus = 0
      const commission = 0
      const totalEarnings = basicSalary + overtimePay + bonus + commission

      // SA payroll deductions (simplified)
      const uif = Math.min(totalEarnings * 0.01, 177.12) // 1% UIF capped at R177.12
      const payeTax = computePAYE(totalEarnings) // progressive tax
      const pension = 0 // configurable
      const medicalAid = 0 // configurable
      const otherDeductions = 0
      const totalDed = uif + payeTax + pension + medicalAid + otherDeductions

      const netPay = totalEarnings - totalDed

      await db.payslip.create({
        data: {
          payRunId: payRun.id,
          employeeId: emp.id,
          merchantId,
          basicSalary,
          overtimePay,
          bonus,
          commission,
          totalEarnings,
          payeTax,
          uif,
          pension,
          medicalAid,
          otherDeductions,
          totalDeductions: totalDed,
          netPay,
          leaveDaysTaken: 0,
          status: 'generated',
        },
      }).catch((e) => console.error(`Payslip creation failed for ${emp.name}:`, e.message))

      totalGross += totalEarnings
      totalDeductions += totalDed
      totalNet += netPay
    }

    // Update pay run totals
    await db.payRun.update({
      where: { id: payRun.id },
      data: { totalGross, totalDeductions, totalNet, updatedAt: new Date() },
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      payRun: { ...payRun, totalGross, totalDeductions, totalNet, employeeCount: employees.length },
      payslipCount: employees.length,
    })
  } catch (error) {
    console.error('[staff/pay-runs] POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create pay run' }, { status: 500 })
  }
}

// Simplified SA PAYE tax calculation (2024/2025 tax year)
function computePAYE(annualTaxableIncome: number): number {
  // Convert monthly to annual for tax bracket calculation
  const annual = annualTaxableIncome * 12
  let annualTax = 0

  if (annual <= 95750) annualTax = annual * 0.18
  else if (annual <= 237100) annualTax = 17235 + (annual - 95750) * 0.26
  else if (annual <= 370500) annualTax = 54037.50 + (annual - 237100) * 0.31
  else if (annual <= 512800) annualTax = 95442.50 + (annual - 370500) * 0.36
  else if (annual <= 673000) annualTax = 146618 + (annual - 512800) * 0.39
  else if (annual <= 857900) annualTax = 209032 + (annual - 673000) * 0.41
  else if (annual <= 1817000) annualTax = 284649 + (annual - 857900) * 0.45
  else annualTax = 716349 + (annual - 1817000) * 0.50

  // Primary rebate (under 65)
  annualTax -= 17235

  // Don't allow negative tax
  annualTax = Math.max(0, annualTax)

  // Convert back to monthly
  return Math.round(annualTax / 12 * 100) / 100
}
