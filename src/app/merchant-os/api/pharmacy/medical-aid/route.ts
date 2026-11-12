import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: Check claim status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const merchantId = searchParams.get('merchantId')
    const claimNumber = searchParams.get('claimNumber')
    const status = searchParams.get('status')
    const medicalAidName = searchParams.get('medicalAidName')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: 'merchantId is required' },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = { merchantId }

    if (claimNumber) {
      where.claimNumber = claimNumber
    }

    if (status) {
      where.status = status
    }

    if (medicalAidName) {
      where.medicalAidName = medicalAidName
    }

    if (dateFrom || dateTo) {
      const dateFilter: Record<string, unknown> = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
      where.createdAt = dateFilter
    }

    const claims = await db.pharmacyMedicalAidClaim.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    // Calculate summary statistics
    const summary = {
      total: claims.length,
      pending: 0,
      submitted: 0,
      adjudicated: 0,
      paid: 0,
      rejected: 0,
      totalAmount: 0,
      totalPatientPortion: 0,
      totalSchemePortion: 0,
      byMedicalAid: {} as Record<string, number>
    }

    const claimsWithDetails = claims.map(claim => {
      // Count by status
      switch (claim.status) {
        case 'pending': summary.pending++; break
        case 'submitted': summary.submitted++; break
        case 'adjudicated': summary.adjudicated++; break
        case 'paid': summary.paid++; break
        case 'rejected': summary.rejected++; break
      }

      // Sum amounts
      summary.totalAmount += claim.totalAmount
      summary.totalPatientPortion += claim.patientPortion
      summary.totalSchemePortion += claim.schemePortion

      // Count by medical aid
      summary.byMedicalAid[claim.medicalAidName] = (summary.byMedicalAid[claim.medicalAidName] || 0) + 1

      // Parse JSON fields
      const icd10Codes = claim.icd10Codes ? JSON.parse(claim.icd10Codes) : []
      const nappiCodes = claim.nappiCodes ? JSON.parse(claim.nappiCodes) : []
      const tariffCodes = claim.tariffCodes ? JSON.parse(claim.tariffCodes) : []

      return {
        ...claim,
        icd10CodesList: icd10Codes,
        nappiCodesList: nappiCodes,
        tariffCodesList: tariffCodes
      }
    })

    return NextResponse.json({
      success: true,
      data: claimsWithDetails,
      summary,
      medicalAids: getMajorMedicalAids()
    })
  } catch (error) {
    console.error('Error fetching medical aid claims:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch medical aid claims' },
      { status: 500 }
    )
  }
}

// POST: Submit claim to medical aid
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      merchantId,
      medicalAidName,
      medicalAidScheme,
      memberNumber,
      dependantCode,
      patientName,
      patientIdNumber,
      prescriptionId,
      icd10Codes,
      nappiCodes,
      tariffCodes,
      totalAmount,
      patientPortion,
      schemePortion
    } = body

    if (!merchantId || !medicalAidName || !memberNumber || !patientName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: merchantId, medicalAidName, memberNumber, patientName' },
        { status: 400 }
      )
    }

    // Generate claim number
    const claimNumber = `MA-${Date.now().toString(36).toUpperCase()}`

    // Validate ICD-10 codes
    const icd10Array = Array.isArray(icd10Codes) ? icd10Codes : (icd10Codes ? JSON.parse(icd10Codes) : [])
    for (const code of icd10Array) {
      if (!/^[A-Z]\d{2}(\.[A-Z0-9]{1,4})?$/.test(code)) {
        return NextResponse.json(
          { success: false, error: `Invalid ICD-10 code format: ${code}` },
          { status: 400 }
        )
      }
    }

    // Validate NAPPI codes format (8-10 digits)
    const nappiArray = Array.isArray(nappiCodes) ? nappiCodes : (nappiCodes ? JSON.parse(nappiCodes) : [])
    for (const item of nappiArray) {
      const code = typeof item === 'object' ? item.code : item
      if (code && !/^\d{7,10}$/.test(String(code))) {
        return NextResponse.json(
          { success: false, error: `Invalid NAPPI code format: ${code}` },
          { status: 400 }
        )
      }
    }

    // Calculate amounts if not provided
    const calculatedTotal = totalAmount || 0
    const calculatedPatientPortion = patientPortion || 0
    const calculatedSchemePortion = schemePortion || (calculatedTotal - calculatedPatientPortion)

    // Create claim
    const claim = await db.pharmacyMedicalAidClaim.create({
      data: {
        merchantId,
        claimNumber,
        medicalAidName,
        medicalAidScheme,
        memberNumber,
        dependantCode,
        patientName,
        patientIdNumber,
        prescriptionId,
        icd10Codes: JSON.stringify(icd10Array),
        nappiCodes: JSON.stringify(nappiArray),
        tariffCodes: tariffCodes ? (typeof tariffCodes === 'string' ? tariffCodes : JSON.stringify(tariffCodes)) : '[]',
        totalAmount: calculatedTotal,
        patientPortion: calculatedPatientPortion,
        schemePortion: calculatedSchemePortion,
        status: 'pending'
      }
    })

    // Simulate submission to medical aid (in production, this would be an API call)
    // For now, we'll auto-progress the status
    const submittedClaim = await db.pharmacyMedicalAidClaim.update({
      where: { id: claim.id },
      data: {
        status: 'submitted',
        submittedAt: new Date(),
        referenceNumber: `REF-${claimNumber}`
      }
    })

    return NextResponse.json({
      success: true,
      data: submittedClaim,
      message: 'Medical aid claim submitted successfully',
      nextSteps: [
        'Claim has been submitted to the medical aid',
        'Adjudication typically takes 24-48 hours',
        'You will be notified of the claim outcome'
      ]
    })
  } catch (error) {
    console.error('Error submitting medical aid claim:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit medical aid claim' },
      { status: 500 }
    )
  }
}

// PATCH: Update claim status (for callbacks)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      claimId,
      merchantId,
      status,
      rejectionReason,
      referenceNumber,
      patientPortion,
      schemePortion
    } = body

    if (!claimId || !merchantId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: claimId, merchantId, status' },
        { status: 400 }
      )
    }

    // Verify claim belongs to merchant
    const existingClaim = await db.pharmacyMedicalAidClaim.findFirst({
      where: { id: claimId, merchantId }
    })

    if (!existingClaim) {
      return NextResponse.json(
        { success: false, error: 'Claim not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = { status }

    switch (status) {
      case 'adjudicated':
        updateData.adjudicatedAt = new Date()
        if (patientPortion !== undefined) updateData.patientPortion = patientPortion
        if (schemePortion !== undefined) updateData.schemePortion = schemePortion
        break
      case 'paid':
        updateData.paidAt = new Date()
        break
      case 'rejected':
        updateData.rejectionReason = rejectionReason
        break
    }

    if (referenceNumber) {
      updateData.referenceNumber = referenceNumber
    }

    const updatedClaim = await db.pharmacyMedicalAidClaim.update({
      where: { id: claimId },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: updatedClaim,
      message: `Claim status updated to ${status}`
    })
  } catch (error) {
    console.error('Error updating medical aid claim:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update claim' },
      { status: 500 }
    )
  }
}

// Major South African Medical Aids
function getMajorMedicalAids() {
  return [
    { name: 'Discovery Health', schemes: ['KeyCare', 'Core', 'Saver', 'Coastal Core', 'Classic', 'Essential', 'Priority'] },
    { name: 'Bonitas', schemes: ['BonEssential', 'BonFit', 'BonSave', 'BonComplete', 'BonClassic'] },
    { name: 'Medical Aid for South Africa (Medscheme)', schemes: ['Resolution Health', 'Health Squared'] },
    { name: 'Momentum Health', schemes: ['Ingwe', 'Custom', 'Summit', 'Extender'] },
    { name: 'Fedhealth', schemes: ['Flex', 'Maxima', 'Unity'] },
    { name: 'Bestmed', schemes: ['Beat', 'Rhythm', 'Pulse'] },
    { name: 'GEMS', schemes: ['Tanzanite One', 'Beryl', 'Ruby', 'Emerald', 'Onyx'] },
    { name: 'Profmed', schemes: ['Profmed'] },
    { name: 'Bankmed', schemes: ['Bankmed'] },
    { name: 'Sizwe Medical Aid', schemes: ['Sizwe'] },
    { name: 'KeyHealth', schemes: ['KeyHealth'] },
    { name: 'Genesis', schemes: ['Genesis'] },
    { name: 'CompCare', schemes: ['Networx', 'UnlimitEd', 'Pace', 'MedElect'] }
  ]
}
