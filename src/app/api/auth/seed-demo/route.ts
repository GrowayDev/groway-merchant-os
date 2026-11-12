import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as bcrypt from 'bcryptjs'

// Demo seeding endpoint - DISABLED IN PRODUCTION
// Demo credentials have been removed for security. Users must register with their own email.
// 
// For development reference only - these credentials are no longer active:
// DEMO_EMAIL = 'demo@groway.app', DEMO_PASSWORD = 'demo123', DEMO_PIN = '1234'

export async function POST() {
  // Always disabled in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Demo seeding is disabled in production. Please register a new account.' },
      { status: 403 }
    )
  }

  // Even in development, this is disabled unless explicitly enabled
  return NextResponse.json(
    { success: false, error: 'Demo seeding is disabled. Please register a new account with your email or use Google OAuth.' },
    { status: 403 }
  )
}

// GET endpoint - also disabled
export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'Demo credentials are no longer available. Please register a new account.',
    exists: false,
    credentials: null,
  })
}
