import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

// GET /api/salesforce/applications - List applications
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || '';
    const province = searchParams.get('province') || '';
    const role = searchParams.get('role') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (province) where.province = province;
    if (role) where.appliedRole = role;

    const applications = await db.salesforceApplication.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await db.salesforceApplication.count({ where });

    return NextResponse.json({
      applications: applications.map(app => ({
        id: app.id,
        applicationId: app.applicationId,
        firstName: app.firstName,
        lastName: app.lastName,
        email: app.email,
        phone: app.phone,
        location: app.location,
        province: app.province,
        appliedRole: app.appliedRole,
        experience: app.experience,
        hasVehicle: app.hasVehicle,
        driversLicense: app.driversLicense,
        status: app.status,
        screeningScore: app.screeningScore,
        createdAt: app.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

// POST /api/salesforce/applications - Submit new application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      idNumber,
      location,
      province,
      appliedRole,
      experience,
      hasVehicle,
      driversLicense,
      currentEmployment,
      availability,
      hearAboutUs,
      motivation,
      resumeUrl,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !location || !province || !appliedRole) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check for existing application
    const existing = await db.salesforceApplication.findFirst({
      where: {
        OR: [
          { email },
          { phone },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'An application with this email or phone already exists', existingId: existing.applicationId },
        { status: 400 }
      );
    }

    const now = new Date();
    const applicationId = `SF-${Date.now().toString(36).toUpperCase()}`;

    const application = await db.salesforceApplication.create({
      data: {
        id: randomUUID(),
        applicationId,
        firstName,
        lastName,
        email,
        phone,
        idNumber: idNumber || null,
        location,
        province,
        appliedRole,
        experience: experience || null,
        hasVehicle: hasVehicle || false,
        driversLicense: driversLicense || false,
        currentEmployment: currentEmployment || null,
        availability: availability || null,
        hearAboutUs: hearAboutUs || null,
        motivation: motivation || null,
        resumeUrl: resumeUrl || null,
        status: 'pending',
        updatedAt: now,
      },
    });

    // Create audit log
    await db.auditLogEntry.create({
      data: {
        id: randomUUID(),
        action: 'salesforce_application_submitted',
        category: 'recruitment',
        targetType: 'salesforce_application',
        targetId: application.id,
        details: JSON.stringify({ applicationId, email, appliedRole }),
        createdAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      application: {
        id: application.id,
        applicationId: application.applicationId,
        status: application.status,
        createdAt: application.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}
