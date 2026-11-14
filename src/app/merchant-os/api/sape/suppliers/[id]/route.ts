import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ============================================
// SAPE Layer 1 — Supplier detail
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

// GET /merchant-os/api/sape/suppliers/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supplier = await db.sapeAuthenticatedSupplier.findUnique({
      where: { id },
      include: {
        ProductIdentities: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { _count: { select: { Serials: true } } },
        },
      },
    })

    if (!supplier) {
      return NextResponse.json({ success: false, error: 'Supplier not found' }, { status: 404 })
    }

    // Recent POS verifications across this supplier's serials
    const recentVerifications = await db.sapePosVerification.findMany({
      where: {
        ProductSerial: { ProductIdentity: { manufacturerId: id } },
      },
      orderBy: { scannedAt: 'desc' },
      take: 20,
      include: {
        ProductSerial: { include: { ProductIdentity: { select: { gtin: true, productName: true } } } },
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
        checks: {
          cic: supplier.checkCic,
          tax: supplier.checkTax,
          sabs: supplier.checkSabs,
          sahpra: supplier.checkSahpra,
          noc: supplier.checkNoc,
          bank: supplier.checkBank,
          insurance: supplier.checkInsurance,
        },
        verificationDate: supplier.verificationDate,
        validUntil: supplier.validUntil,
        contactEmail: supplier.contactEmail,
        contactPhone: supplier.contactPhone,
        city: supplier.city,
        province: supplier.province,
        verticals: supplier.verticals,
        notes: supplier.notes,
        createdAt: supplier.createdAt,
      },
      productIdentities: supplier.ProductIdentities.map((p) => ({
        id: p.id,
        gtin: p.gtin,
        batchNumber: p.batchNumber,
        productName: p.productName,
        expiryDate: p.expiryDate,
        status: p.status,
        serialCount: p._count.Serials,
        createdAt: p.createdAt,
      })),
      recentVerifications: recentVerifications.map((v) => ({
        id: v.id,
        gtin: v.gtin,
        productName: v.ProductSerial?.ProductIdentity?.productName || null,
        verified: v.verificationResult,
        failureReason: v.failureReason,
        responseTimeMs: v.responseTimeMs,
        scannedAt: v.scannedAt,
      })),
    })
  } catch (error) {
    console.error('SAPE supplier GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch supplier' }, { status: 500 })
  }
}

// PATCH /merchant-os/api/sape/suppliers/[id] — update checks/status, recompute trust score
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const supplier = await db.sapeAuthenticatedSupplier.findUnique({ where: { id } })
    if (!supplier) {
      return NextResponse.json({ success: false, error: 'Supplier not found' }, { status: 404 })
    }

    // Merge incoming checks with existing values
    const merged = {
      cic: body.checks?.cic ?? supplier.checkCic,
      tax: body.checks?.tax ?? supplier.checkTax,
      sabs: body.checks?.sabs ?? supplier.checkSabs,
      sahpra: body.checks?.sahpra ?? supplier.checkSahpra,
      noc: body.checks?.noc ?? supplier.checkNoc,
      bank: body.checks?.bank ?? supplier.checkBank,
      insurance: body.checks?.insurance ?? supplier.checkInsurance,
    }

    let score = 0
    for (const [key, weight] of Object.entries(CHECK_WEIGHTS)) {
      if ((merged as Record<string, boolean>)[key] === true) score += weight
    }
    score = Math.floor(score)

    const verificationStatus =
      body.verificationStatus !== undefined
        ? String(body.verificationStatus)
        : score >= 70
          ? 'VERIFIED'
          : 'PENDING'

    const now = new Date()
    const validUntil = new Date(now)
    validUntil.setFullYear(validUntil.getFullYear() + 1)

    const updated = await db.sapeAuthenticatedSupplier.update({
      where: { id },
      data: {
        checkCic: merged.cic === true,
        checkTax: merged.tax === true,
        checkSabs: merged.sabs === true,
        checkSahpra: merged.sahpra === true,
        checkNoc: merged.noc === true,
        checkBank: merged.bank === true,
        checkInsurance: merged.insurance === true,
        trustScore: score,
        verificationStatus,
        verificationDate: now,
        validUntil,
        ...(body.companyName !== undefined ? { companyName: String(body.companyName) } : {}),
        ...(body.notes !== undefined ? { notes: body.notes ? String(body.notes) : null } : {}),
        ...(body.contactEmail !== undefined ? { contactEmail: body.contactEmail || null } : {}),
        ...(body.contactPhone !== undefined ? { contactPhone: body.contactPhone || null } : {}),
      },
    })

    return NextResponse.json({
      success: true,
      supplier: {
        id: updated.id,
        companyName: updated.companyName,
        verificationStatus: updated.verificationStatus,
        trustScore: updated.trustScore,
      },
    })
  } catch (error) {
    console.error('SAPE supplier PATCH error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update supplier' }, { status: 500 })
  }
}
