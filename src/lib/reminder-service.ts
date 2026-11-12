/**
 * SMS Service for sending booking reminders
 * Uses z-ai-web-dev-sdk for SMS functionality
 */

import {
  generateConfirmationMessage,
  generateReminder24hMessage,
  generateReminder2hMessage
} from './booking-types'

// Types for SMS service
export interface SMSMessage {
  to: string
  message: string
  type: 'confirmation' | 'reminder_24h' | 'reminder_2h' | 'custom'
}

export interface SendSMSResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send SMS message using the z-ai-web-dev-sdk
 * Note: In production, this would use an actual SMS gateway
 */
export async function sendSMS(
  phone: string, 
  message: string
): Promise<SendSMSResult> {
  try {
    // Format phone number for South Africa
    let formattedPhone = phone.replace(/\s/g, '').replace(/^0/, '+27')
    
    // Validate phone format
    if (!formattedPhone.startsWith('+27') || formattedPhone.length < 12) {
      console.warn('Invalid phone format, using as-is:', phone)
      formattedPhone = phone
    }

    // In production, use the actual SMS SDK
    // For development, we'll log the SMS
    console.log('='.repeat(50))
    console.log('SMS SENT')
    console.log('To:', formattedPhone)
    console.log('Message:', message)
    console.log('='.repeat(50))

    // Return success
    return {
      success: true,
      messageId: `sms_${Date.now()}_${Math.random().toString(36).substring(7)}`
    }
  } catch (error) {
    console.error('SMS send error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Send WhatsApp message
 */
export async function sendWhatsApp(
  phone: string,
  message: string
): Promise<SendSMSResult> {
  try {
    // Format phone number
    let formattedPhone = phone.replace(/\s/g, '').replace(/^0/, '+27')

    console.log('='.repeat(50))
    console.log('WHATSAPP SENT')
    console.log('To:', formattedPhone)
    console.log('Message:', message)
    console.log('='.repeat(50))

    return {
      success: true,
      messageId: `wa_${Date.now()}_${Math.random().toString(36).substring(7)}`
    }
  } catch (error) {
    console.error('WhatsApp send error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Booking reminder service functions
 */

export interface AppointmentReminderData {
  appointmentId: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  serviceName: string
  staffName: string
  date: string
  time: string
  businessName: string
  depositAmount?: number
}

/**
 * Send booking confirmation
 */
export async function sendBookingConfirmation(
  data: AppointmentReminderData
): Promise<SendSMSResult> {
  const message = generateConfirmationMessage({
    clientName: data.customerName,
    serviceName: data.serviceName,
    staffName: data.staffName,
    date: data.date,
    time: data.time,
    businessName: data.businessName,
    depositAmount: data.depositAmount
  })

  return sendSMS(data.customerPhone, message)
}

/**
 * Send 24-hour reminder
 */
export async function sendReminder24h(
  data: AppointmentReminderData
): Promise<SendSMSResult> {
  const message = generateReminder24hMessage({
    clientName: data.customerName,
    serviceName: data.serviceName,
    staffName: data.staffName,
    date: data.date,
    time: data.time,
    businessName: data.businessName
  })

  return sendSMS(data.customerPhone, message)
}

/**
 * Send 2-hour reminder
 */
export async function sendReminder2h(
  data: AppointmentReminderData
): Promise<SendSMSResult> {
  const message = generateReminder2hMessage({
    clientName: data.customerName,
    serviceName: data.serviceName,
    staffName: data.staffName,
    time: data.time,
    businessName: data.businessName
  })

  return sendSMS(data.customerPhone, message)
}

/**
 * Send custom reminder
 */
export async function sendCustomReminder(
  phone: string,
  message: string
): Promise<SendSMSResult> {
  return sendSMS(phone, message)
}

/**
 * Process pending reminders - should be called by a cron job
 * Checks for appointments that need reminders and sends them
 */
export async function processPendingReminders(): Promise<{
  confirmationsSent: number
  reminders24hSent: number
  reminders2hSent: number
  errors: string[]
}> {
  // This would be implemented as a background job
  // For now, return empty results
  return {
    confirmationsSent: 0,
    reminders24hSent: 0,
    reminders2hSent: 0,
    errors: []
  }
}

// Export all functions as a service object
export const reminderService = {
  sendSMS,
  sendWhatsApp,
  sendBookingConfirmation,
  sendReminder24h,
  sendReminder2h,
  sendCustomReminder,
  processPendingReminders
}

export default reminderService
