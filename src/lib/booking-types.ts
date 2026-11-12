// Shared types for booking system

export interface TimeSlot {
  time: string
  available: boolean
  staffId?: string
  staffName?: string
}

export interface BookingSettings {
  id: string
  merchantId: string
  onlineBookingEnabled: boolean
  requireDeposit: boolean
  defaultDepositPct: number
  sendConfirmationSMS: boolean
  sendReminder24h: boolean
  sendReminder2h: boolean
  sendWhatsApp: boolean
  allowOnlineReschedule: boolean
  allowOnlineCancel: boolean
  cancellationPolicy: string
  cancellationHours: number
  minBookingNotice: number
  maxAdvanceBooking: number
  autoConfirmBookings: boolean
  bufferBetweenSlots: number
  workingHoursStart: string
  workingHoursEnd: string
  workingDays: string
  whatsappNumber: string | null
}

export interface PublicBookingData {
  merchant: {
    id: string
    name: string
    logo?: string
    phone?: string
    email?: string
  }
  services: Array<{
    id: string
    name: string
    category: string
    duration: number
    price: number
    description: string | null
    depositRequired: boolean
    depositAmount: number | null
    depositPercentage: number | null
  }>
  staff: Array<{
    id: string
    name: string
    avatar: string | null
    color: string
    rating: number
    specialties: string[]
  }>
  settings: {
    requireDeposit: boolean
    defaultDepositPct: number
    minBookingNotice: number
    maxAdvanceBooking: number
    workingHoursStart: string
    workingHoursEnd: string
    workingDays: string
    allowOnlineReschedule: boolean
    allowOnlineCancel: boolean
    cancellationPolicy: string
    cancellationHours: number
  }
}

export interface CreateBookingRequest {
  customerName: string
  customerPhone: string
  customerEmail?: string
  staffId: string
  serviceId: string
  date: string
  time: string
  notes?: string
  source: 'online' | 'phone' | 'walk-in' | 'in-store'
  depositPaid?: boolean
  depositMethod?: 'online' | 'in-store' | 'wallet'
  depositReference?: string
}

export interface RecurringAppointmentData {
  customerId: string
  staffId: string
  serviceId: string
  frequency: 'weekly' | 'biweekly' | 'monthly'
  dayOfWeek?: number // 0-6 for weekly/biweekly
  dayOfMonth?: number // 1-31 for monthly
  time: string
  startDate: string
  endDate?: string
}

// SMS Template types
export interface SMSTemplate {
  type: 'confirmation' | 'reminder_24h' | 'reminder_2h' | 'custom'
  message: string
  variables: Record<string, string>
}

export function generateConfirmationMessage(data: {
  clientName: string
  serviceName: string
  staffName: string
  date: string
  time: string
  businessName: string
  depositAmount?: number
}): string {
  let message = `Hi ${data.clientName}! Your appointment at ${data.businessName} is confirmed.\n\n`
  message += `📅 ${data.date} at ${data.time}\n`
  message += `💇 ${data.serviceName} with ${data.staffName}\n`
  if (data.depositAmount) {
    message += `\n💳 Deposit of R${data.depositAmount} received.`
  }
  message += `\n\nReply CANCEL to cancel or call to reschedule.`
  return message
}

export function generateReminder24hMessage(data: {
  clientName: string
  serviceName: string
  staffName: string
  date: string
  time: string
  businessName: string
}): string {
  return `Reminder: ${data.clientName}, you have an appointment tomorrow at ${data.time}.\n\n` +
    `💇 ${data.serviceName} with ${data.staffName}\n` +
    `📍 ${data.businessName}\n\n` +
    `See you soon! Reply CANCEL if you need to reschedule.`
}

export function generateReminder2hMessage(data: {
  clientName: string
  serviceName: string
  staffName: string
  time: string
  businessName: string
}): string {
  return `Hi ${data.clientName}! Just a reminder that your appointment is in 2 hours at ${data.time}.\n\n` +
    `💇 ${data.serviceName} with ${data.staffName}\n` +
    `📍 ${data.businessName}\n\n` +
    `We look forward to seeing you!`
}

// Time utility functions
export function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number)
  const totalMinutes = hours * 60 + mins + minutes
  const newHours = Math.floor(totalMinutes / 60)
  const newMins = totalMinutes % 60
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`
}

export function timeToMinutes(time: string): number {
  const [hours, mins] = time.split(':').map(Number)
  return hours * 60 + mins
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

export function generateTimeSlots(
  startHour: number,
  endHour: number,
  intervalMinutes: number = 30
): string[] {
  const slots: string[] = []
  const startMinutes = startHour * 60
  const endMinutes = endHour * 60

  for (let mins = startMinutes; mins < endMinutes; mins += intervalMinutes) {
    slots.push(minutesToTime(mins))
  }

  return slots
}

export function formatDateForDisplay(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-ZA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

export function calculateDeposit(
  price: number,
  depositRequired: boolean,
  depositAmount?: number | null,
  depositPercentage?: number | null,
  defaultDepositPct?: number
): number {
  if (!depositRequired) return 0
  if (depositAmount) return depositAmount
  const pct = depositPercentage || defaultDepositPct || 20
  return Math.round(price * pct / 100)
}
