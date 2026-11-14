import { NextRequest, NextResponse } from 'next/server'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'
import { db } from '@/lib/db'
export async function GET(request: NextRequest) {
  try { const m = await getMerchantIdWithDevFallback(request); if (!m) return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 })
    const alerts = await db.sapeAlert.findMany({ orderBy: { notifiedAt: 'desc' }, take: 20 }).catch(() => [])
    return NextResponse.json({ success: true, alerts })
  } catch { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }) }
}
