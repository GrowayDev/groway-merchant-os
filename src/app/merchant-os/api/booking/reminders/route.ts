import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/booking/reminders - Get reminder templates or reminders sent
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'templates' or 'sent'
    
    if (type === 'templates') {
      const templates = await db.reminderTemplate.findMany({
        where: { active: true },
        orderBy: { name: 'asc' }
      })
      return NextResponse.json({ templates })
    }
    
    // Get sent reminders
    const appointmentId = searchParams.get('appointmentId')
    
    const reminders = await db.appointmentReminder.findMany({
      where: appointmentId ? { appointmentId } : undefined,
      orderBy: { sentAt: 'desc' },
      take: 50,
      include: {
        appointment: {
          include: {
            service: true,
            staff: true
          }
        }
      }
    })

    return NextResponse.json({ reminders })
  } catch (error) {
    console.error('Error fetching reminders:', error)
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 })
  }
}

// POST /api/booking/reminders - Send a reminder
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Create reminder record
    const reminder = await db.appointmentReminder.create({
      data: {
        appointmentId: body.appointmentId,
        type: body.type, // confirmation, reminder_24h, reminder_2h
        channel: body.channel, // sms, whatsapp, email
        sentAt: new Date(),
        status: 'sent',
        message: body.message
      }
    })

    // Update appointment reminder flags
    if (body.type === 'confirmation') {
      await db.appointment.update({
        where: { id: body.appointmentId },
        data: { confirmationSent: true }
      })
    } else if (body.type === 'reminder_24h') {
      await db.appointment.update({
        where: { id: body.appointmentId },
        data: { reminder24hSent: true }
      })
    } else if (body.type === 'reminder_2h') {
      await db.appointment.update({
        where: { id: body.appointmentId },
        data: { reminder2hSent: true }
      })
    }

    return NextResponse.json({ reminder }, { status: 201 })
  } catch (error) {
    console.error('Error sending reminder:', error)
    return NextResponse.json({ error: 'Failed to send reminder' }, { status: 500 })
  }
}
