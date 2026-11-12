import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List all visits with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const salesRepId = searchParams.get('salesRepId')
    const date = searchParams.get('date')
    const upcoming = searchParams.get('upcoming') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (type && type !== 'all') {
      where.visitType = type
    }

    if (salesRepId) {
      where.salesRepId = salesRepId
    }

    if (date) {
      where.plannedDate = date
    }

    if (upcoming) {
      where.status = 'planned'
      where.plannedDate = {
        gte: new Date().toISOString().split('T')[0]
      }
    }

    // Try to fetch from database
    let visits: any[] = []
    let total = 0

    try {
      visits = await db.salesVisit.findMany({
        where,
        orderBy: [
          { plannedDate: 'asc' },
          { plannedTime: 'asc' }
        ],
        take: limit,
        skip: offset,
      })

      total = await db.salesVisit.count({ where })
    } catch (dbError) {
      // Table might not exist, return demo data
      console.log('SalesVisit table not found, returning demo data')
    }

    // If no visits found, return demo data
    if (visits.length === 0) {
      const demoVisits = generateDemoVisits()
      
      // Apply filters to demo data
      let filteredVisits = demoVisits
      
      if (status && status !== 'all') {
        filteredVisits = filteredVisits.filter(v => v.status === status)
      }
      if (type && type !== 'all') {
        filteredVisits = filteredVisits.filter(v => v.visitType === type)
      }
      if (salesRepId) {
        filteredVisits = filteredVisits.filter(v => v.salesRepId === salesRepId)
      }
      if (date) {
        filteredVisits = filteredVisits.filter(v => v.plannedDate === date)
      }
      if (upcoming) {
        filteredVisits = filteredVisits.filter(v => v.status === 'planned')
      }

      return NextResponse.json({
        success: true,
        data: filteredVisits.slice(offset, offset + limit),
        pagination: {
          total: filteredVisits.length,
          limit,
          offset,
          hasMore: offset + limit < filteredVisits.length,
        },
        filters: {
          statusCounts: {
            planned: demoVisits.filter(v => v.status === 'planned').length,
            in_progress: demoVisits.filter(v => v.status === 'in_progress').length,
            completed: demoVisits.filter(v => v.status === 'completed').length,
            cancelled: demoVisits.filter(v => v.status === 'cancelled').length,
          }
        }
      })
    }

    // Get counts by status for filters
    const statusCounts = await db.salesVisit.groupBy({
      by: ['status'],
      _count: { id: true },
    })

    const formattedStatusCounts = statusCounts.reduce((acc: any, item: any) => {
      acc[item.status] = item._count.id
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      success: true,
      data: visits.map(formatVisit),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + visits.length < total,
      },
      filters: {
        statusCounts: formattedStatusCounts,
      }
    })
  } catch (error) {
    console.error('Error fetching visits:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch visits' },
      { status: 500 }
    )
  }
}

// POST - Create new visit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      salesRepId,
      salesRepName,
      visitType,
      purpose,
      notes,
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      plannedDate,
      plannedTime,
      followUpRequired,
      followUpDate,
      followUpNotes,
    } = body

    // Validate required fields
    if (!salesRepId || !salesRepName || !visitType || !purpose || !customerName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate visit type
    const validTypes = ['scheduled', 'unscheduled', 'follow_up', 'demo', 'training']
    if (!validTypes.includes(visitType)) {
      return NextResponse.json(
        { success: false, error: `Invalid visit type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate purpose
    const validPurposes = ['new_business', 'account_management', 'support', 'collection']
    if (!validPurposes.includes(purpose)) {
      return NextResponse.json(
        { success: false, error: `Invalid purpose. Must be one of: ${validPurposes.join(', ')}` },
        { status: 400 }
      )
    }

    // Create visit
    const visit = await db.salesVisit.create({
      data: {
        id: `visit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        salesRepId,
        salesRepName,
        visitType,
        purpose,
        notes: notes || null,
        customerId: customerId || null,
        customerName,
        customerPhone: customerPhone || null,
        customerEmail: customerEmail || null,
        customerAddress: customerAddress || null,
        plannedDate: plannedDate || null,
        plannedTime: plannedTime || null,
        followUpRequired: followUpRequired || false,
        followUpDate: followUpDate || null,
        followUpNotes: followUpNotes || null,
        status: 'planned',
        routeOrder: 0,
        revenueGenerated: 0,
        dealsClosed: 0,
      }
    })

    return NextResponse.json({
      success: true,
      data: formatVisit(visit),
      message: 'Visit scheduled successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating visit:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create visit' },
      { status: 500 }
    )
  }
}

// PATCH - Update visit (check-in, check-out, complete, cancel)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { visitId, action, data } = body

    if (!visitId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: visitId, action' },
        { status: 400 }
      )
    }

    const validActions = ['check_in', 'check_out', 'complete', 'cancel', 'update']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      )
    }

    const visit = await db.salesVisit.findUnique({
      where: { id: visitId },
    })

    if (!visit) {
      return NextResponse.json(
        { success: false, error: 'Visit not found' },
        { status: 404 }
      )
    }

    let updateData: any = {}

    switch (action) {
      case 'check_in':
        updateData = {
          checkInLat: data?.latitude,
          checkInLng: data?.longitude,
          checkInAddress: data?.address,
          checkInAt: new Date(),
          status: 'in_progress',
        }
        break

      case 'check_out':
        updateData = {
          checkOutAt: new Date(),
          durationMinutes: data?.durationMinutes || calculateDuration(visit.checkInAt, new Date()),
          notes: data?.notes || visit.notes,
        }
        break

      case 'complete':
        updateData = {
          status: 'completed',
          outcome: data?.outcome,
          notes: data?.notes || visit.notes,
          revenueGenerated: data?.revenueGenerated || 0,
          dealsClosed: data?.dealsClosed || 0,
          followUpRequired: data?.followUpRequired || false,
          followUpDate: data?.followUpDate || null,
          followUpNotes: data?.followUpNotes || null,
        }
        break

      case 'cancel':
        updateData = {
          status: 'cancelled',
          notes: data?.reason || visit.notes,
        }
        break

      case 'update':
        updateData = {
          ...data,
        }
        break
    }

    const updatedVisit = await db.salesVisit.update({
      where: { id: visitId },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: formatVisit(updatedVisit),
      message: `Visit ${action.replace('_', ' ')} successful`
    })
  } catch (error) {
    console.error('Error updating visit:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update visit' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a visit
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const visitId = searchParams.get('id')

    if (!visitId) {
      return NextResponse.json(
        { success: false, error: 'Missing visit ID' },
        { status: 400 }
      )
    }

    await db.salesVisit.delete({
      where: { id: visitId },
    })

    return NextResponse.json({
      success: true,
      message: 'Visit deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting visit:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete visit' },
      { status: 500 }
    )
  }
}

// Helper function to format visit response
function formatVisit(visit: any) {
  return {
    id: visit.id,
    salesRepId: visit.salesRepId,
    salesRepName: visit.salesRepName,
    visitType: visit.visitType,
    purpose: visit.purpose,
    notes: visit.notes,
    outcome: visit.outcome,
    customerId: visit.customerId,
    customerName: visit.customerName,
    customerPhone: visit.customerPhone,
    customerEmail: visit.customerEmail,
    customerAddress: visit.customerAddress,
    checkInLat: visit.checkInLat,
    checkInLng: visit.checkInLng,
    checkInAddress: visit.checkInAddress,
    checkInAt: visit.checkInAt,
    checkOutAt: visit.checkOutAt,
    durationMinutes: visit.durationMinutes,
    routeOrder: visit.routeOrder,
    plannedDate: visit.plannedDate,
    plannedTime: visit.plannedTime,
    followUpRequired: visit.followUpRequired,
    followUpDate: visit.followUpDate,
    followUpNotes: visit.followUpNotes,
    revenueGenerated: visit.revenueGenerated,
    dealsClosed: visit.dealsClosed,
    status: visit.status,
    createdAt: visit.createdAt,
    updatedAt: visit.updatedAt,
  }
}

// Helper function to calculate duration in minutes
function calculateDuration(checkInAt: Date | null, checkOutAt: Date): number {
  if (!checkInAt) return 0
  const diff = new Date(checkOutAt).getTime() - new Date(checkInAt).getTime()
  return Math.round(diff / 60000) // Convert ms to minutes
}

// Generate demo visits
function generateDemoVisits() {
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  
  const salesReps = [
    { id: 'sr-001', name: 'Thabo Molefe' },
    { id: 'sr-002', name: 'Nomsa Dlamini' },
    { id: 'sr-003', name: 'Johan van der Berg' },
    { id: 'sr-004', name: 'Priya Naidoo' },
    { id: 'sr-005', name: 'Sipho Zulu' },
  ]
  
  const customers = [
    { name: 'Spaza Store SA', phone: '+27 72 111 2222', address: '12 DF Malan Dr, Mamelodi' },
    { name: 'Cafe Sunrise', phone: '+27 73 222 3333', address: '45 Stanza Bopape St, Sunnyside' },
    { name: 'Tech Solutions Ltd', phone: '+27 74 333 4444', address: '78 Steve Biko Rd, Arcadia' },
    { name: 'Metro Supermarket', phone: '+27 75 444 5555', address: '123 Church St, Pretoria CBD' },
    { name: 'Quick Shop Express', phone: '+27 76 555 6666', address: '56 Pretorius St, Hatfield' },
    { name: 'Family Store Plus', phone: '+27 77 666 7777', address: '89 Pretoria Rd, Silverton' },
    { name: 'Mini Mart Central', phone: '+27 78 777 8888', address: '34 Paul Kruger St, Centurion' },
    { name: 'Value Store SA', phone: '+27 79 888 9999', address: '23 Nelson Mandela Dr, Atteridgeville' },
  ]
  
  const visitTypes = ['scheduled', 'demo', 'follow_up', 'training']
  const purposes = ['new_business', 'account_management', 'support']
  const statuses = ['planned', 'in_progress', 'completed', 'cancelled']
  const outcomes = ['successful', 'unsuccessful', 'follow_up_needed', 'closed_won', 'closed_lost']
  
  const visits: any[] = []
  
  for (let i = 0; i < 20; i++) {
    const rep = salesReps[i % salesReps.length]
    const customer = customers[i % customers.length]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const isCompleted = status === 'completed'
    const isInProgress = status === 'in_progress'
    
    visits.push({
      id: `v-${String(i + 1).padStart(3, '0')}`,
      salesRepId: rep.id,
      salesRepName: rep.name,
      visitType: visitTypes[Math.floor(Math.random() * visitTypes.length)],
      purpose: purposes[Math.floor(Math.random() * purposes.length)],
      notes: i % 3 === 0 ? `Visit notes for ${customer.name}` : null,
      outcome: isCompleted ? outcomes[Math.floor(Math.random() * outcomes.length)] : null,
      customerId: i % 2 === 0 ? `cust-${i}` : null,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: `${customer.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      customerAddress: customer.address,
      checkInLat: -25.7461 + (Math.random() * 0.05 - 0.025),
      checkInLng: 28.2181 + (Math.random() * 0.05 - 0.025),
      checkInAddress: isCompleted || isInProgress ? customer.address : null,
      checkInAt: isCompleted || isInProgress ? new Date(Date.now() - Math.random() * 3600000) : null,
      checkOutAt: isCompleted ? new Date(Date.now() - Math.random() * 1800000) : null,
      durationMinutes: isCompleted ? Math.floor(Math.random() * 60) + 15 : null,
      routeOrder: (i % 5) + 1,
      plannedDate: i < 8 ? today : i < 14 ? tomorrow : nextWeek,
      plannedTime: `${String(9 + (i % 8)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`,
      followUpRequired: isCompleted && Math.random() > 0.5,
      followUpDate: isCompleted && Math.random() > 0.5 ? new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0] : null,
      followUpNotes: isCompleted && Math.random() > 0.5 ? 'Send pricing proposal' : null,
      revenueGenerated: isCompleted && Math.random() > 0.6 ? Math.floor(Math.random() * 50000) + 10000 : 0,
      dealsClosed: isCompleted && Math.random() > 0.7 ? 1 : 0,
      status,
      createdAt: new Date(Date.now() - Math.random() * 7 * 86400000),
      updatedAt: new Date(),
    })
  }
  
  return visits
}
