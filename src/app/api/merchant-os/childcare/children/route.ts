import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// GET /api/merchant-os/childcare/children - Get all children for a merchant
export async function GET(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') || 
                       request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
    }

    const children = await db.childcareChild.findMany({
      where: { merchantId },
      include: {
        ChildcareGuardian: true,
        ChildcareAllergy: true,
        ChildcareImmunization: true,
        ChildcareClass: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform to match frontend interface
    const transformedChildren = children.map(child => ({
      id: child.id,
      firstName: child.firstName,
      lastName: child.lastName,
      dateOfBirth: child.dateOfBirth,
      gender: child.gender,
      profileImage: child.profileImage,
      enrollmentDate: child.enrollmentDate,
      status: child.status,
      ageGroup: child.ageGroup,
      classId: child.classId,
      medicalRecordNumber: child.medicalRecordNumber,
      allergies: child.ChildcareAllergy.map(a => ({
        id: a.id,
        allergen: a.allergen,
        severity: a.severity,
        symptoms: a.symptoms ? a.symptoms.split(',') : [],
        actionPlan: a.actionPlan
      })),
      specialNeeds: child.specialNeeds,
      dietaryRestrictions: child.dietaryRestrictions ? child.dietaryRestrictions.split(',') : [],
      emergencyContacts: child.ChildcareGuardian.map(g => ({
        id: g.id,
        name: g.name,
        relationship: g.relationship,
        phone: g.phone,
        alternatePhone: g.alternatePhone,
        email: g.email,
        isPrimary: g.isPrimary,
        authorizedPickup: g.authorizedPickup
      })),
      immunizations: child.ChildcareImmunization.map(i => ({
        id: i.id,
        vaccineName: i.vaccineName,
        dateAdministered: i.dateAdministered,
        nextDueDate: i.nextDueDate,
        administeredBy: i.administeredBy,
        batchNumber: i.batchNumber,
        status: i.status
      })),
      primaryGuardian: child.ChildcareGuardian.find(g => g.isPrimary) ? {
        name: child.ChildcareGuardian.find(g => g.isPrimary)!.name,
        relationship: child.ChildcareGuardian.find(g => g.isPrimary)!.relationship,
        phone: child.ChildcareGuardian.find(g => g.isPrimary)!.phone,
        email: child.ChildcareGuardian.find(g => g.isPrimary)!.email || '',
        address: child.ChildcareGuardian.find(g => g.isPrimary)!.address || ''
      } : null,
      enrollmentType: child.enrollmentType,
      schedule: child.schedule ? child.schedule.split(',') : [],
      billingInfo: {
        feePlan: child.enrollmentType === 'full_time' ? 'Full Time' : 'Part Time',
        monthlyFee: 0,
        siblingDiscount: 0,
        paymentMethod: ''
      },
      checkInStatus: child.checkInStatus,
      checkInTime: child.checkInTime,
      checkOutTime: child.checkOutTime
    }))

    return NextResponse.json({ children: transformedChildren })
  } catch (error) {
    console.error('Error fetching children:', error)
    return NextResponse.json({ error: 'Failed to fetch children' }, { status: 500 })
  }
}

// POST /api/merchant-os/childcare/children - Create a new child
export async function POST(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') ||
                       request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
    }

    const body = await request.json()
    const childId = `CHD-${nanoid(8).toUpperCase()}`

    // Create child with related data
    const child = await db.childcareChild.create({
      data: {
        id: childId,
        merchantId,
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: body.dateOfBirth,
        gender: body.gender || 'other',
        profileImage: body.profileImage,
        enrollmentDate: body.enrollmentDate || new Date().toISOString().split('T')[0],
        status: body.status || 'active',
        ageGroup: body.ageGroup || 'preschool',
        classId: body.classId,
        medicalRecordNumber: body.medicalRecordNumber || `MRN-${new Date().getFullYear()}-${nanoid(6).toUpperCase()}`,
        specialNeeds: body.specialNeeds,
        dietaryRestrictions: body.dietaryRestrictions ? body.dietaryRestrictions.join(',') : null,
        enrollmentType: body.enrollmentType || 'full_time',
        schedule: body.schedule ? body.schedule.join(',') : 'Monday,Tuesday,Wednesday,Thursday,Friday',
        ChildcareGuardian: {
          create: body.emergencyContacts?.map((contact: { name: string; relationship: string; phone: string; alternatePhone?: string; email?: string; address?: string; isPrimary: boolean; authorizedPickup: boolean }) => ({
            id: `EC-${nanoid(8).toUpperCase()}`,
            name: contact.name,
            relationship: contact.relationship,
            phone: contact.phone,
            alternatePhone: contact.alternatePhone,
            email: contact.email,
            address: contact.address,
            isPrimary: contact.isPrimary || false,
            authorizedPickup: contact.authorizedPickup || false
          })) || []
        },
        ChildcareAllergy: {
          create: body.allergies?.map((allergy: { allergen: string; severity: string; symptoms: string[]; actionPlan?: string }) => ({
            id: `ALG-${nanoid(8).toUpperCase()}`,
            allergen: allergy.allergen,
            severity: allergy.severity || 'mild',
            symptoms: allergy.symptoms ? allergy.symptoms.join(',') : null,
            actionPlan: allergy.actionPlan
          })) || []
        }
      },
      include: {
        ChildcareGuardian: true,
        ChildcareAllergy: true
      }
    })

    return NextResponse.json({ success: true, child })
  } catch (error) {
    console.error('Error creating child:', error)
    return NextResponse.json({ error: 'Failed to create child' }, { status: 500 })
  }
}
