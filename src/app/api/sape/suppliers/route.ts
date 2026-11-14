/**
 * SAPE Layer 1 — Authenticated Supplier registry.
 * GET  /api/sape/suppliers          (merchant auth)
 * POST /api/sape/suppliers          (merchant auth — register supplier)
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSapeAuth, isNextResponse } from '@/lib/sape/auth'
import { randomUUID } from 'crypto'

export async function GET(request: NextRequest) {
  const auth = requireSapeAuth(request)
  if (isNextResponse(auth)) return auth

  try {
    const suppliers = await db.authenticatedSupplier.findMany({
      where: { merchantId: auth.merchantId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    return NextResponse.json({ success: true, data: suppliers, count: suppliers.length })
  } catch (error) {
    console.error('SAPE suppliers GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load suppliers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = requireSapeAuth(request)
  if (isNextResponse(auth)) return auth

  try {
    const body = await request.json().catch(() => ({}))
    const { name, registrationNumber, country, sappraLicense, nccRegistration, contactEmail, contactPhone, notes } = body

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ success: false, error: 'Supplier name is required' }, { status: 400 })
    }

    // Heuristic risk score: presence of registration + licenses lowers risk.
    let riskScore = 60
    if (registrationNumber) riskScore -= 15
    if (sappraLicense) riskScore -= 15
    if (nccRegistration) riskScore -= 10
    if (contactEmail) riskScore -= 5

    const verificationStatus =
      registrationNumber && (sappraLicense || nccRegistration) ? 'verified' : 'pending'

    const supplier = await db.authenticatedSupplier.create({
      data: {
        id: randomUUID(),
        merchantId: auth.merchantId,
        supplierCode: `SUP-${Date.now().toString(36).toUpperCase()}`,
        name: name.trim(),
        registrationNumber: registrationNumber || null,
        country: country || 'ZA',
        verificationStatus,
        sappraLicense: sappraLicense || null,
        nccRegistration: nccRegistration || null,
        accreditations: JSON.stringify(body.accreditations ?? []),
        riskScore,
        verifiedAt: verificationStatus === 'verified' ? new Date() : null,
        verifiedBy: verificationStatus === 'verified' ? auth.userId : null,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        notes: notes || null,
      },
    })

    return NextResponse.json({ success: true, data: supplier }, { status: 201 })
  } catch (error) {
    console.error('SAPE suppliers POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to register supplier' }, { status: 500 })
  }
}
