import { NextRequest, NextResponse } from 'next/server'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'
import { ConsentService } from '@/lib/grocore/consent/consent'
const globalForConsent = globalThis as unknown as { consentService?: ConsentService }
const consent = globalForConsent.consentService ?? new ConsentService()
if (process.env.NODE_ENV !== 'production') globalForConsent.consentService = consent
export async function GET(request: NextRequest) {
  try { const t = await getMerchantIdWithDevFallback(request); if (!t) return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 })
    return NextResponse.json({ success: true, events: (consent as any).log || [] })
  } catch { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }) }
}
export async function POST(request: NextRequest) {
  try { const t = await getMerchantIdWithDevFallback(request); if (!t) return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 })
    const { subject, purpose, expiresAt } = await request.json()
    if (!subject || !purpose) return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })
    consent.grant(subject, purpose, new Date(), expiresAt ? new Date(expiresAt) : undefined)
    return NextResponse.json({ success: true, message: 'Consent granted' })
  } catch { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }) }
}
export async function DELETE(request: NextRequest) {
  try { const t = await getMerchantIdWithDevFallback(request); if (!t) return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 })
    const { subject, purpose } = await request.json()
    if (!subject || !purpose) return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })
    consent.revoke(subject, purpose, new Date())
    return NextResponse.json({ success: true, message: 'Consent revoked' })
  } catch { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }) }
}
