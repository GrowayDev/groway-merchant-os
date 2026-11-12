import { db } from '@/lib/db'

export type Frequency = 'weekly' | 'biweekly' | 'monthly'

export interface RecurringTemplate {
  customerId: string
  staffId: string
  serviceId: string
  frequency: Frequency
  dayOfWeek?: number // 0-6 (Sunday = 0)
  dayOfMonth?: number // 1-31
  time: string
  startDate: string
  endDate?: string
}

/**
 * Calculate the next occurrence date for a recurring appointment
 */
export function getNextOccurrence(
  template: {
    frequency: Frequency
    dayOfWeek?: number | null
    dayOfMonth?: number | null
    time: string
  },
  afterDate: Date
): Date | null {
  const after = new Date(afterDate)
  
  switch (template.frequency) {
    case 'weekly': {
      if (template.dayOfWeek === undefined || template.dayOfWeek === null) return null
      const targetDay = template.dayOfWeek
      const currentDay = after.getDay()
      const daysUntil = (targetDay - currentDay + 7) % 7 || 7
      const nextDate = new Date(after)
      nextDate.setDate(nextDate.getDate() + daysUntil)
      return nextDate
    }
    
    case 'biweekly': {
      if (template.dayOfWeek === undefined || template.dayOfWeek === null) return null
      const targetDay = template.dayOfWeek
      const currentDay = after.getDay()
      // First try next week
      let daysUntil = (targetDay - currentDay + 7) % 7
      if (daysUntil === 0) daysUntil = 7 // Move to next week if same day
      const nextDate = new Date(after)
      nextDate.setDate(nextDate.getDate() + daysUntil)
      // Check if we need to skip a week (biweekly logic)
      // For simplicity, we alternate weeks from the start date
      return nextDate
    }
    
    case 'monthly': {
      if (template.dayOfMonth === undefined || template.dayOfMonth === null) return null
      const targetDay = template.dayOfMonth
      const nextDate = new Date(after)
      // Move to next month
      nextDate.setMonth(nextDate.getMonth() + 1)
      // Set to target day (or last day of month if target doesn't exist)
      const lastDayOfMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate()
      nextDate.setDate(Math.min(targetDay, lastDayOfMonth))
      return nextDate
    }
    
    default:
      return null
  }
}

/**
 * Generate individual appointments from a recurring template
 */
export async function generateAppointments(
  recurringId: string,
  numberOfAppointments: number = 4
): Promise<string[]> {
  // Get recurring template
  const recurring = await db.recurringAppointment.findUnique({
    where: { id: recurringId },
    include: {
      customer: true
    }
  })

  if (!recurring || !recurring.active) {
    throw new Error('Recurring appointment not found or inactive')
  }

  // Get service details
  const service = await db.bookingService.findUnique({
    where: { id: recurring.serviceId }
  })

  if (!service) {
    throw new Error('Service not found')
  }

  const createdAppointmentIds: string[] = []
  const startDate = new Date(recurring.startDate)
  const endDate = recurring.endDate ? new Date(recurring.endDate) : null
  let currentDate = new Date(startDate)
  let appointmentsCreated = 0

  while (appointmentsCreated < numberOfAppointments) {
    // Calculate next occurrence
    const nextDate = getNextOccurrence(
      {
        frequency: recurring.frequency as Frequency,
        dayOfWeek: recurring.dayOfWeek,
        dayOfMonth: recurring.dayOfMonth,
        time: recurring.time
      },
      currentDate
    )

    if (!nextDate) break

    // Check end date
    if (endDate && nextDate > endDate) break

    const dateStr = nextDate.toISOString().split('T')[0]

    // Check if appointment already exists for this date
    const existing = await db.appointment.findFirst({
      where: {
        customerId: recurring.customerId,
        staffId: recurring.staffId,
        serviceId: recurring.serviceId,
        date: dateStr,
        time: recurring.time
      }
    })

    if (!existing) {
      // Check for conflicts
      const conflictingAppointments = await db.appointment.findMany({
        where: {
          staffId: recurring.staffId,
          date: dateStr,
          status: { notIn: ['cancelled', 'no-show'] }
        }
      })

      const hasConflict = conflictingAppointments.some(apt => {
        const [aptHour, aptMin] = apt.time.split(':').map(Number)
        const [recurringHour, recurringMin] = recurring.time.split(':').map(Number)
        const aptMinutes = aptHour * 60 + aptMin
        const recurringMinutes = recurringHour * 60 + recurringMin
        return Math.abs(aptMinutes - recurringMinutes) < service.duration
      })

      if (!hasConflict) {
        // Create appointment
        const appointment = await db.appointment.create({
          data: {
            customerId: recurring.customerId,
            customerName: recurring.customer.name,
            customerPhone: recurring.customer.phone || '',
            customerEmail: recurring.customer.email,
            staffId: recurring.staffId,
            serviceId: recurring.serviceId,
            date: dateStr,
            time: recurring.time,
            duration: service.duration,
            status: 'scheduled',
            total: service.price,
            source: 'recurring',
            notes: `Auto-generated from recurring appointment ${recurringId}`
          }
        })

        createdAppointmentIds.push(appointment.id)
        appointmentsCreated++

        // Update recurring appointment
        await db.recurringAppointment.update({
          where: { id: recurringId },
          data: {
            appointmentsCreated: { increment: 1 },
            lastAppointmentDate: dateStr
          }
        })
      }
    }

    // Move to next potential date
    currentDate = new Date(nextDate)
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return createdAppointmentIds
}

/**
 * Create a new recurring appointment template
 */
export async function createRecurringAppointment(
  data: {
    customerId: string
    staffId: string
    serviceId: string
    frequency: Frequency
    dayOfWeek?: number
    dayOfMonth?: number
    time: string
    startDate: string
    endDate?: string
  }
): Promise<{ recurringId: string; appointmentIds: string[] }> {
  // Validate staff can perform service
  const staffService = await db.staffService.findFirst({
    where: {
      staffId: data.staffId,
      serviceId: data.serviceId
    }
  })

  if (!staffService) {
    throw new Error('Staff member cannot perform this service')
  }

  // Validate dayOfWeek for weekly/biweekly
  if ((data.frequency === 'weekly' || data.frequency === 'biweekly') && 
      (data.dayOfWeek === undefined || data.dayOfWeek < 0 || data.dayOfWeek > 6)) {
    throw new Error('dayOfWeek (0-6) is required for weekly/biweekly frequency')
  }

  // Validate dayOfMonth for monthly
  if (data.frequency === 'monthly' && 
      (data.dayOfMonth === undefined || data.dayOfMonth < 1 || data.dayOfMonth > 31)) {
    throw new Error('dayOfMonth (1-31) is required for monthly frequency')
  }

  // Create recurring template
  const recurring = await db.recurringAppointment.create({
    data: {
      customerId: data.customerId,
      staffId: data.staffId,
      serviceId: data.serviceId,
      frequency: data.frequency,
      dayOfWeek: data.dayOfWeek,
      dayOfMonth: data.dayOfMonth,
      time: data.time,
      startDate: data.startDate,
      endDate: data.endDate,
      active: true,
      appointmentsCreated: 0
    }
  })

  // Generate initial appointments (next 4)
  const appointmentIds = await generateAppointments(recurring.id, 4)

  return {
    recurringId: recurring.id,
    appointmentIds
  }
}

/**
 * Cancel a recurring appointment series
 */
export async function cancelRecurringAppointment(
  recurringId: string,
  cancelFuture: boolean = true
): Promise<{ cancelledAppointments: number }> {
  const recurring = await db.recurringAppointment.findUnique({
    where: { id: recurringId }
  })

  if (!recurring) {
    throw new Error('Recurring appointment not found')
  }

  // Mark as inactive
  await db.recurringAppointment.update({
    where: { id: recurringId },
    data: { active: false }
  })

  let cancelledCount = 0

  if (cancelFuture) {
    // Cancel all future scheduled appointments from this series
    const today = new Date().toISOString().split('T')[0]
    
    const result = await db.appointment.updateMany({
      where: {
        customerId: recurring.customerId,
        staffId: recurring.staffId,
        serviceId: recurring.serviceId,
        date: { gte: today },
        status: 'scheduled',
        notes: { contains: `recurring appointment ${recurringId}` }
      },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledReason: 'Recurring series cancelled'
      }
    })

    cancelledCount = result.count
  }

  return { cancelledAppointments: cancelledCount }
}
