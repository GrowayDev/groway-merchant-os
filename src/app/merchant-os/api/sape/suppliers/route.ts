import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ============================================
// SAPE Layer 1 — Supplier Verification
// ============================================

const CHECK_WEIGHTS: Record<string, number> = {
  cic: 25,
  tax: 20,
  bank: 20,
  insurance: 10,
  sabs: 10,
  sahpra: 10,
  noc: 5,
}

interface SupplierChecks {
  cic?: boolean
  tax?: boolean
  sabs?: boolean
  sahpra?: boolean
  noc?: boolean
  bank?: boolean
  insurance?: boolean
}

function computeTrustScore(checks: SupplierChecks): { score: number; passed: Record<string, boolean> } {
  const passed: Record<string, boolean> = {}
  let score = 0
  for (const [key, weight] of Object.entries(CHECK_WEIGHTS)) {
    const value = (checks as Record<string, boolean | undefined>)[key]
    // Scored only if the check is applicable (provided) and passed
    const isPassed = value === true
    passed[key] = isPassed
    if (isPassed) score += weight
  }
  return { score: Math.floor(score), passed }
}

// GET /merchant-os/api/sape/suppliers — list suppliers with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const verificationStatus = searchParams.get('verificationStatus')
    const q = searchParams.get('q')

    const where: Record<string, unknown> = {}
    if (verificationStatus && verificationStatus !== 'ALL') {
      where.verificationStatus = verificationStatus
    }
    if (q) {
      where.OR = [
        { companyName: { contains: q } },
        { cicNumber: { contains: q } },
        { city: { contains: q } },
      ]
    }

    const suppliers = await db.sapeAuthenticatedSupplier.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        _count: { select: { ProductIdentities: true } },
      },
    })

    const byStatus = await db.sapeAuthenticatedSupplier.groupBy({
      by: ['verificationStatus'],
      _count: { _all: true },
    })

    const statusCounts: Record<string, number> = {}
    for (const g of byStatus) statusCounts[g.verificationStatus] = g._count._all

    return NextResponse.json({
      success: true,
      suppliers: suppliers.map((s) => ({
        id: s.id,
        cicNumber: s.cicNumber,
        companyName: s.companyName,
        verificationStatus: s.verificationStatus,
        trustScore: s.trustScore,
        checks: {
          cic: s.checkCic,
          tax: s.checkTax,
          sabs: s.checkSabs,
          sahpra: s.checkSahpra,
          noc: s.checkNoc,
          bank: s.checkBank,
          insurance: s.checkInsurance,
        },
        verificationDate: s.verificationDate,
        validUntil: s.validUntil,
        contactEmail: s.contactEmail,
        contactPhone: s.contactPhone,
        city: s.city,
        province: s.province,
        verticals: s.verticals,
        productIdentityCount: s._count.ProductIdentities,
        createdAt: s.createdAt,
      })),
      statusCounts,
      total: suppliers.length,
    })
  } catch (error) {
    console.error('SAPE suppliers GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch suppliers' }, { status: 500 })
  }
}

// POST /merchant-os/api/sape/suppliers — verify a supplier (upsert by cicNumber)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cicNumber, companyName, contactEmail, contactPhone, city, province, verticals, checks } = body

    if (!cicNumber || !companyName) {
      return NextResponse.json(
        { success: false, error: 'cicNumber and companyName are required' },
        { status: 400 }
      )
    }

    const { score, passed } = computeTrustScore((checks || {}) as SupplierChecks)
    const verificationStatus = score >= 70 ? 'VERIFIED' : 'PENDING'
    const now = new Date()
    const validUntil = new Date(now)
    validUntil.setFullYear(validUntil.getFullYear() + 1)

    const supplier = await db.sapeAuthenticatedSupplier.upsert({
      where: { cicNumber },
      create: {
        id: crypto.randomUUID(),
        cicNumber,
        companyName,
        verificationStatus,
        trustScore: score,
        checkCic: passed.cic,
        checkTax: passed.tax,
        checkSabs: passed.sabs,
        checkSahpra: passed.sahpra,
        checkNoc: passed.noc,
        checkBank: passed.bank,
        checkInsurance: passed.insurance,
        verificationDate: now,
        validUntil,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        city: city || null,
        province: province || null,
        verticals: verticals ? (typeof verticals === 'string' ? verticals : JSON.stringify(verticals)) : null,
      },
      update: {
        companyName,
        verificationStatus,
        trustScore: score,
        checkCic: passed.cic,
        checkTax: passed.tax,
        checkSabs: passed.sabs,
        checkSahpra: passed.sahpra,
        checkNoc: passed.noc,
        checkBank: passed.bank,
        checkInsurance: passed.insurance,
        verificationDate: now,
        validUntil,
        ...(contactEmail !== undefined ? { contactEmail: contactEmail || null } : {}),
        ...(contactPhone !== undefined ? { contactPhone: contactPhone || null } : {}),
        ...(city !== undefined ? { city: city || null } : {}),
        ...(province !== undefined ? { province: province || null } : {}),
        ...(verticals !== undefined
          ? { verticals: typeof verticals === 'string' ? verticals : JSON.stringify(verticals) }
          : {}),
      },
    })

    return NextResponse.json({
      success: true,
      supplier: {
        id: supplier.id,
        cicNumber: supplier.cicNumber,
        companyName: supplier.companyName,
        verificationStatus: supplier.verificationStatus,
        trustScore: supplier.trustScore,
        verificationDate: supplier.verificationDate,
        validUntil: supplier.validUntil,
      },
      trustScore: score,
      verificationStatus,
    })
  } catch (error) {
    console.error('SAPE suppliers POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to verify supplier' }, { status: 500 })
  }
}
