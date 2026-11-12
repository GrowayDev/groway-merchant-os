import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// GET /api/booking/appointments - List appointments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const staffId = searchParams.get('staffId')
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Prisma.AppointmentWhereInput = {}
    
    if (date) where.date = date
    if (staffId) where.staffId = staffId
    if (status) where.status = status
    if (customerId) where.customerId = customerId
    if (startDate && endDate) {
      where.AND = [
        { date: { gte: startDate } },
        { date: { lte: endDate } }
      ]
    }

    const appointments = await db.appointment.findMany({
      where,
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
      include: {
        service: true,
        staff: true,
        customer: true,
        reminders: true
      }
    })

    return NextResponse.json({ appointments })
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 })
  }
}

// POST /api/booking/appointments - Create a new appointment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Check for conflicts
    const existingAppointment = await db.appointment.findFirst({
      where: {
        staffId: body.staffId,
        date: body.date,
        status: { notIn: ['cancelled', 'no-show'] }
      }
    })

    if (existingAppointment) {
      const existingEnd = addMinutes(existingAppointment.time, existingAppointment.duration)
      const newEnd = addMinutes(body.time, body.duration || 30)
      
      if (body.time < existingEnd && newEnd > existingAppointment.time) {
        return NextResponse.json({ 
          error: 'Time slot conflict',
          conflictWith: existingAppointment 
        }, { status: 409 })
      }
    }

    const appointment = await db.appointment.create({
      data: {
        customerId: body.customerId,
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        customerEmail: body.customerEmail,
        staffId: body.staffId,
        serviceId: body.serviceId,
        date: body.date,
        time: body.time,
        duration: body.duration || 30,
        status: body.status || 'scheduled',
        total: body.total || 0,
        depositAmount: body.depositAmount,
        depositPaid: body.depositPaid || false,
        depositMethod: body.depositMethod,
        notes: body.notes,
        source: body.source || 'online'
      },
      include: {
        service: true,
        staff: true,
        customer: true
      }
    })

    // Update customer stats if customerId provided
    if (body.customerId) {
      await db.customer.update({
        where: { id: body.customerId },
        data: {
          visitCount: { increment: 1 },
          totalSpent: { increment: body.total || 0 },
          lastVisit: new Date()
        }
      })
    }

    return NextResponse.json({ appointment }, { status: 201 })
  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 })
  }
}

// Helper function to add minutes to time string
function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number)
  const totalMinutes = hours * 60 + mins + minutes
  const newHours = Math.floor(totalMinutes / 60)
  const newMins = totalMinutes % 60
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`
}
