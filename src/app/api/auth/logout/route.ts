import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('groway_session')?.value

    if (sessionToken) {
      // Delete session from database
      await db.merchantSession.deleteMany({
        where: { token: sessionToken },
      })
    }

    // Clear session cookie
    cookieStore.delete('groway_session')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    // Still clear the cookie even if there's an error
    const cookieStore = await cookies()
    cookieStore.delete('groway_session')
    
    return NextResponse.json({ success: true })
  }
}
