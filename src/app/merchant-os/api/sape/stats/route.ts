import { NextRequest, NextResponse } from 'next/server'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'
import { db } from '@/lib/db'
export async function GET(request: NextRequest) {
  try { const m = await getMerchantIdWithDevFallback(request); if (!m) return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 })
    const [totalProducts, totalVerifications, authenticCount, counterfeitCount, openAlerts] = await Promise.all([
      db.sapeProduct.count().catch(() => 0), db.sapeVerification.count().catch(() => 0),
      db.sapeVerification.count({ where: { result: 'authentic' } }).catch(() => 0),
      db.sapeVerification.count({ where: { result: 'counterfeit' } }).catch(() => 0),
      db.sapeAlert.count({ where: { status: 'open' } }).catch(() => 0),
    ])
    return NextResponse.json({ success: true, stats: { totalProducts, totalVerifications, authenticCount, counterfeitCount, openAlerts, authorityNotifications: openAlerts } })
  } catch { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }) }
}
