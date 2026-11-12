import { NextRequest, NextResponse } from 'next/server'

// Placeholder for hotel rooms API
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    data: [],
    message: 'Hotel rooms API - not implemented'
  })
}
