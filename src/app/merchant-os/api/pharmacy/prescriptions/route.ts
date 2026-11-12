import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: List prescriptions with patient info
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const merchantId = searchParams.get('merchantId')
    const status = searchParams.get('status')
    const patientIdNumber = searchParams.get('patientIdNumber')
    const search = searchParams.get('search')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: 'merchantId is required' },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = { merchantId }

    if (status) {
      where.status = status
    }

    if (patientIdNumber) {
      where.patientIdNumber = patientIdNumber
    }

    if (search) {
      where.OR = [
        { prescriptionNumber: { contains: search } },
        { patientName: { contains: search } },
        { doctorName: { contains: search } }
      ]
    }

    if (dateFrom || dateTo) {
      const dateFilter: Record<string, unknown> = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
      where.issueDate = dateFilter
    }

    const prescriptions = await db.pharmacyPrescription.findMany({
      where,
      include: {
        PharmacyPrescriptionDispensing: {
          orderBy: { dispensedAt: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate summary statistics
    const summary = {
      total: prescriptions.length,
      pending: 0,
      dispensed: 0,
      partial: 0,
      expired: 0,
      repeatsAvailable: 0
    }

    const today = new Date()

    const prescriptionsWithStatus = prescriptions.map(rx => {
      // Count by status
      switch (rx.status) {
        case 'pending': summary.pending++; break
        case 'dispensed': summary.dispensed++; break
        case 'partial': summary.partial++; break
        case 'expired': summary.expired++; break
      }

      // Check for repeats available
      if (rx.repeatsRemaining > 0 && rx.status !== 'expired') {
        summary.repeatsAvailable++
      }

      // Check if expired
      const isExpired = rx.expiryDate && new Date(rx.expiryDate) < today
      const medications = rx.medications ? JSON.parse(rx.medications) : []

      return {
        ...rx,
        isExpired,
        medicationsList: medications,
        dispensingHistory: rx.PharmacyPrescriptionDispensing,
        canDispense: !isExpired && rx.repeatsRemaining > 0 && rx.status !== 'cancelled'
      }
    })

    return NextResponse.json({
      success: true,
      data: prescriptionsWithStatus,
      summary
    })
  } catch (error) {
    console.error('Error fetching prescriptions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch prescriptions' },
      { status: 500 }
    )
  }
}

// POST: Create new prescription record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      merchantId,
      patientName,
      patientIdNumber,
      patientPhone,
      patientEmail,
      patientDob,
      patientAddress,
      doctorName,
      doctorPracticeNumber,
      doctorPhone,
      doctorEmail,
      hpcsaRegNo,
      diagnosisCode,
      diagnosis,
      medications,
      totalRepeats,
      issueDate,
      expiryDate,
      notes
    } = body

    if (!merchantId || !patientName || !doctorName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: merchantId, patientName, doctorName' },
        { status: 400 }
      )
    }

    // Generate prescription number
    const prescriptionNumber = `RX-${Date.now().toString(36).toUpperCase()}`

    // Parse and validate medications
    let medicationsJson = '[]'
    if (medications) {
      if (typeof medications === 'string') {
        medicationsJson = medications
      } else {
        medicationsJson = JSON.stringify(medications)
      }
    }

    // Validate ICD-10 code format if provided
    if (diagnosisCode && !/^[A-Z]\d{2}(\.[A-Z0-9]{1,4})?$/.test(diagnosisCode)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ICD-10 code format' },
        { status: 400 }
      )
    }

    const prescription = await db.pharmacyPrescription.create({
      data: {
        merchantId,
        prescriptionNumber,
        patientName,
        patientIdNumber,
        patientPhone,
        patientEmail,
        patientDob,
        patientAddress,
        doctorName,
        doctorPracticeNumber,
        doctorPhone,
        doctorEmail,
        hpcsaRegNo,
        diagnosisCode,
        diagnosis,
        medications: medicationsJson,
        totalRepeats: totalRepeats || 0,
        repeatsRemaining: totalRepeats || 0,
        dispensedCount: 0,
        status: 'pending',
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        notes
      }
    })

    return NextResponse.json({
      success: true,
      data: prescription,
      message: 'Prescription created successfully'
    })
  } catch (error) {
    console.error('Error creating prescription:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create prescription' },
      { status: 500 }
    )
  }
}

// PATCH: Dispense prescription
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      prescriptionId,
      merchantId,
      dispensedBy,
      medications,
      totalAmount,
      paymentMethod,
      medicalAidClaimId,
      notes
    } = body

    if (!prescriptionId || !merchantId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: prescriptionId, merchantId' },
        { status: 400 }
      )
    }

    // Get prescription
    const prescription = await db.pharmacyPrescription.findFirst({
      where: { id: prescriptionId, merchantId }
    })

    if (!prescription) {
      return NextResponse.json(
        { success: false, error: 'Prescription not found' },
        { status: 404 }
      )
    }

    // Check if can dispense
    if (prescription.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Cannot dispense a cancelled prescription' },
        { status: 400 }
      )
    }

    if (prescription.expiryDate && new Date(prescription.expiryDate) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Prescription has expired' },
        { status: 400 }
      )
    }

    if (prescription.repeatsRemaining <= 0) {
      return NextResponse.json(
        { success: false, error: 'No repeats remaining on this prescription' },
        { status: 400 }
      )
    }

    // Create dispensing record
    const dispensing = await db.pharmacyPrescriptionDispensing.create({
      data: {
        prescriptionId,
        dispensedBy,
        dispensedAt: new Date(),
        medications: medications ? JSON.stringify(medications) : '[]',
        totalAmount: totalAmount || 0,
        paymentMethod,
        medicalAidClaimId,
        notes
      }
    })

    // Update prescription
    const newRepeatsRemaining = prescription.repeatsRemaining - 1
    const newDispensedCount = prescription.dispensedCount + 1
    const newStatus = newRepeatsRemaining === 0 ? 'dispensed' : 'partial'

    const updatedPrescription = await db.pharmacyPrescription.update({
      where: { id: prescriptionId },
      data: {
        repeatsRemaining: newRepeatsRemaining,
        dispensedCount: newDispensedCount,
        status: newStatus,
        lastDispensedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        dispensing,
        prescription: updatedPrescription
      },
      message: `Prescription dispensed. ${newRepeatsRemaining} repeats remaining.`
    })
  } catch (error) {
    console.error('Error dispensing prescription:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to dispense prescription' },
      { status: 500 }
    )
  }
}
