import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get single API key
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const apiKey = await db.enterpriseApiKey.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        status: true,
        lastUsed: true,
        createdAt: true,
        expiresAt: true,
        createdBy: true,
        notes: true,
        corporate: {
          select: { id: true, name: true }
        }
      }
    })
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }
    
    return NextResponse.json({ apiKey })
  } catch (error) {
    console.error('Error fetching API key:', error)
    return NextResponse.json({ error: 'Failed to fetch API key' }, { status: 500 })
  }
}

// PUT - Update API key
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const apiKey = await db.enterpriseApiKey.update({
      where: { id },
      data: {
        ...body,
        permissions: body.permissions ? JSON.stringify(body.permissions) : undefined,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ apiKey })
  } catch (error) {
    console.error('Error updating API key:', error)
    return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 })
  }
}

// DELETE - Revoke API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await db.enterpriseApiKey.update({
      where: { id },
      data: { status: 'revoked' }
    })

    return NextResponse.json({ success: true, message: 'API key revoked' })
  } catch (error) {
    console.error('Error revoking API key:', error)
    return NextResponse.json({ error: 'Failed to revoke API key' }, { status: 500 })
  }
}
