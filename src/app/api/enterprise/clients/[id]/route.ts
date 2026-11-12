import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get single corporate client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const client = await db.enterpriseCorporateClient.findUnique({
      where: { id },
      include: {
        merchants: true,
        users: true,
        apiKeys: true,
        whiteLabelSettings: true,
        activities: {
          take: 20,
          orderBy: { createdAt: 'desc' }
        }
      }
    })
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }
    
    return NextResponse.json({ client })
  } catch (error) {
    console.error('Error fetching corporate client:', error)
    return NextResponse.json({ error: 'Failed to fetch corporate client' }, { status: 500 })
  }
}

// PUT - Update corporate client
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const client = await db.enterpriseCorporateClient.update({
      where: { id },
      data: {
        ...body,
        creditLimit: body.creditLimit ? parseFloat(body.creditLimit) : undefined,
        creditUsed: body.creditUsed ? parseFloat(body.creditUsed) : undefined,
        monthlyVolume: body.monthlyVolume ? parseFloat(body.monthlyVolume) : undefined,
        updatedAt: new Date()
      }
    })

    // Log activity
    await db.enterpriseActivity.create({
      data: {
        corporateId: id,
        type: 'client_updated',
        message: `Corporate client "${client.name}" updated`,
        entityType: 'corporate_client',
        entityId: id
      }
    })

    return NextResponse.json({ client })
  } catch (error) {
    console.error('Error updating corporate client:', error)
    return NextResponse.json({ error: 'Failed to update corporate client' }, { status: 500 })
  }
}

// DELETE - Delete corporate client
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await db.enterpriseCorporateClient.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting corporate client:', error)
    return NextResponse.json({ error: 'Failed to delete corporate client' }, { status: 500 })
  }
}
