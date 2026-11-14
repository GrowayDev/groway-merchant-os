import { NextRequest, NextResponse } from 'next/server'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'
import { db } from '@/lib/db'

// GET /merchant-os/api/staff/payroll/payslips — list payslips (optionally filtered by payRunId)
export async function GET(request: NextRequest) {
  try {
    const merchantId = await getMerchantIdWithDevFallback(request)
    if (!merchantId) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const payRunId = searchParams.get('payRunId')

    const where: any = { merchantId }
    if (payRunId) where.payRunId = payRunId

    const payslips = await db.payslip.findMany({
      where,
      orderBy: { generatedAt: 'desc' },
      include: {
        employee: { select: { name: true, role: true, email: true, bankName: true, bankAccountNo: true } },
      },
    }).catch(() => [])

    return NextResponse.json({ success: true, payslips, count: payslips.length })
  } catch (error) {
    console.error('[staff/payslips] GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch payslips' }, { status: 500 })
  }
}
