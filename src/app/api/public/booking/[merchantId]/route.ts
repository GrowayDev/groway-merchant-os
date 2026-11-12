import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

// GET /api/public/booking/[merchantId] - Get public booking data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    const { merchantId } = await params

    // Get booking settings
    let settings = await db.bookingSettings.findUnique({
      where: { merchantId }
    })

    // Create default settings if not exist
    if (!settings) {
      settings = await db.bookingSettings.create({
        data: { merchantId }
      })
    }

    // Check if online booking is enabled
    if (!settings.onlineBookingEnabled) {
      return NextResponse.json(
        { error: 'Online booking is not available for this merchant' },
        { status: 403, headers: corsHeaders }
      )
    }

    // Get services
    const services = await db.bookingService.findMany({
      where: { active: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    })

    // Get staff with their services
    const staff = await db.staff.findMany({
      where: { status: 'active' },
      include: {
        services: {
          include: {
            service: true
          }
        }
      }
    })

    // Format response
    const publicData = {
      merchant: {
        id: merchantId,
        name: 'Groway Salon & Spa', // In production, fetch from merchant table
        logo: null,
        phone: '+27 11 123 4567',
        email: 'bookings@groway.co.za'
      },
      services: services.map(s => ({
        id: s.id,
        name: s.name,
        category: s.category,
        duration: s.duration,
        price: s.price,
        description: s.description,
        depositRequired: s.depositRequired,
        depositAmount: s.depositAmount,
        depositPercentage: s.depositPercentage
      })),
      staff: staff.map(s => ({
        id: s.id,
        name: s.name,
        avatar: s.avatar,
        color: s.color,
        rating: s.rating,
        specialties: s.services.map(ss => ss.service.name),
        services: s.services.map(ss => ({
          id: ss.serviceId,
          customPrice: ss.customPrice,
          isPrimary: ss.isPrimary
        }))
      })),
      settings: {
        requireDeposit: settings.requireDeposit,
        defaultDepositPct: settings.defaultDepositPct,
        minBookingNotice: settings.minBookingNotice,
        maxAdvanceBooking: settings.maxAdvanceBooking,
        workingHoursStart: settings.workingHoursStart,
        workingHoursEnd: settings.workingHoursEnd,
        workingDays: settings.workingDays,
        allowOnlineReschedule: settings.allowOnlineReschedule,
        allowOnlineCancel: settings.allowOnlineCancel,
        cancellationPolicy: settings.cancellationPolicy,
        cancellationHours: settings.cancellationHours
      }
    }

    return NextResponse.json(publicData, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching public booking data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch booking data' },
      { status: 500, headers: corsHeaders }
    )
  }
}
