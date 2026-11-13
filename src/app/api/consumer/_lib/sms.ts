/**
 * SMS provider abstraction for OTP delivery.
 *
 * Phase 4 hardening: OTP via SMS.
 * In production, integrate with Africa's Talking, Twilio, or Burst SMS.
 * In development, the OTP is returned in the API response (not sent via SMS).
 *
 * To enable production SMS:
 * 1. Set SMS_PROVIDER=africas_talking|twilio|burst in .env
 * 2. Set the provider API keys in .env
 * 3. Set SMS_FROM=your_sender_id
 */

export type SmsProvider = 'africas_talking' | 'twilio' | 'burst' | 'console'

interface SmsMessage {
  to: string
  body: string
}

interface SmsResult {
  success: boolean
  messageId?: string
  error?: string
  provider: SmsProvider
}

const PROVIDER = (process.env.SMS_PROVIDER as SmsProvider) || 'console'

/**
 * Send an SMS via the configured provider.
 * Falls back to console.log in development.
 */
export async function sendSms(message: SmsMessage): Promise<SmsResult> {
  const { to, body } = message

  // Normalize phone number (SA format: +27...)
  const normalizedPhone = normalizePhone(to)

  switch (PROVIDER) {
    case 'africas_talking':
      return sendViaAfricasTalking(normalizedPhone, body)
    case 'twilio':
      return sendViaTwilio(normalizedPhone, body)
    case 'burst':
      return sendViaBurst(normalizedPhone, body)
    case 'console':
    default:
      // Development mode: log the message
      console.log(`[SMS] To: ${normalizedPhone}\n[SMS] Body: ${body}`)
      return { success: true, messageId: `console-${Date.now()}`, provider: 'console' }
  }
}

/**
 * Send an OTP via SMS with a standard template.
 */
export async function sendOtp(phone: string, otp: string, purpose: string = 'verification'): Promise<SmsResult> {
  const body = `Your Groway ${purpose} code is ${otp}. Valid for 10 minutes. Do not share this code with anyone.`
  return sendSms({ to: phone, body })
}

function normalizePhone(phone: string): string {
  // Remove spaces and dashes
  let normalized = phone.replace(/[\s-]/g, '')
  // SA: convert 0X... to +27X...
  if (normalized.startsWith('0')) {
    normalized = '+27' + normalized.slice(1)
  }
  // If starts with 27, add +
  if (normalized.startsWith('27') && !normalized.startsWith('+')) {
    normalized = '+' + normalized
  }
  return normalized
}

// --- Africa's Talking ---
async function sendViaAfricasTalking(to: string, body: string): Promise<SmsResult> {
  const apiKey = process.env.AFRICAS_TALKING_API_KEY
  const senderId = process.env.SMS_FROM || 'GROWAY'
  if (!apiKey) return { success: false, error: 'Africa\'s Talking API key not set', provider: 'africas_talking' }

  try {
    const res = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey': apiKey,
      },
      body: new URLSearchParams({
        username: process.env.AFRICAS_TALKING_USERNAME || 'sandbox',
        to,
        message: body,
        from: senderId,
      }),
    })
    const data = await res.json()
    if (data.SMSMessageData?.Message === 'Sent to' || data.SMSMessageData?.Recipients?.length > 0) {
      return { success: true, messageId: data.SMSMessageData.Recipients[0]?.messageId, provider: 'africas_talking' }
    }
    return { success: false, error: data.SMSMessageData?.Message || 'Unknown error', provider: 'africas_talking' }
  } catch (e: any) {
    return { success: false, error: e.message, provider: 'africas_talking' }
  }
}

// --- Twilio ---
async function sendViaTwilio(to: string, body: string): Promise<SmsResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.SMS_FROM || process.env.TWILIO_PHONE_NUMBER
  if (!accountSid || !authToken || !from) {
    return { success: false, error: 'Twilio credentials not set', provider: 'twilio' }
  }

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }),
    })
    const data = await res.json()
    if (data.sid) {
      return { success: true, messageId: data.sid, provider: 'twilio' }
    }
    return { success: false, error: data.message || 'Unknown error', provider: 'twilio' }
  } catch (e: any) {
    return { success: false, error: e.message, provider: 'twilio' }
  }
}

// --- Burst SMS ---
async function sendViaBurst(to: string, body: string): Promise<SmsResult> {
  const apiKey = process.env.BURST_SMS_API_KEY
  const senderId = process.env.SMS_FROM || 'GROWAY'
  if (!apiKey) return { success: false, error: 'Burst SMS API key not set', provider: 'burst' }

  try {
    const res = await fetch('https://api.transmitsms.com/send-sms.json', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ message: body, to, from: senderId }),
    })
    const data = await res.json()
    if (data.message_id) {
      return { success: true, messageId: data.message_id, provider: 'burst' }
    }
    return { success: false, error: data.error?.message || 'Unknown error', provider: 'burst' }
  } catch (e: any) {
    return { success: false, error: e.message, provider: 'burst' }
  }
}
