import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Mock agent ID for authentication
const MOCK_AGENT_ID = 'sales-demo-001'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const source = searchParams.get('source')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {
      agentId: MOCK_AGENT_ID,
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (priority && priority !== 'all') {
      where.priority = priority
    }

    if (source && source !== 'all') {
      where.source = source
    }

    if (search) {
      where.OR = [
        { businessName: { contains: search } },
        { contactName: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ]
    }

    // Fetch leads
    const leads = await db.salesforceLead.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    })

    // Get total count
    const total = await db.salesforceLead.count({ where })

    // Get counts by status for filters
    const statusCounts = await db.salesforceLead.groupBy({
      by: ['status'],
      where: { agentId: MOCK_AGENT_ID },
      _count: { id: true },
    })

    const formattedStatusCounts = statusCounts.reduce((acc: any, item: any) => {
      acc[item.status] = item._count.id
      return acc
    }, {} as Record<string, number>)

    // If no leads exist, return demo data
    if (leads.length === 0 && !status && !search) {
      const demoLeads = await seedDemoLeads()
      return NextResponse.json({
        success: true,
        data: demoLeads,
        pagination: {
          total: demoLeads.length,
          limit,
          offset,
          hasMore: false,
        },
        filters: {
          statusCounts: {
            new: 2,
            contacted: 1,
            meeting: 1,
            proposal: 1,
            won: 0,
            lost: 0,
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: leads.map(formatLead),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + leads.length < total,
      },
      filters: {
        statusCounts: formattedStatusCounts,
      }
    })
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      businessName,
      contactName,
      phone,
      email,
      address,
      city,
      province,
      postalCode,
      latitude,
      longitude,
      businessType,
      vertical,
      subVertical,
      estimatedRevenue,
      currentPOS,
      painPoints,
      source,
      priority,
      notes,
      tags,
    } = body

    // Validate required fields
    if (!businessName || !contactName || !phone) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: businessName, contactName, phone' },
        { status: 400 }
      )
    }

    // Create lead
    const lead = await db.salesforceLead.create({
      data: {
        id: `lead-${Date.now()}`,
        agentId: MOCK_AGENT_ID,
        businessName,
        contactName,
        phone,
        email: email || null,
        address: address || null,
        city: city || null,
        province: province || null,
        postalCode: postalCode || null,
        latitude: latitude || null,
        longitude: longitude || null,
        businessType: businessType || null,
        vertical: vertical || null,
        subVertical: subVertical || null,
        estimatedRevenue: estimatedRevenue || null,
        currentPOS: currentPOS || null,
        painPoints: painPoints || null,
        source: source || 'self_generated',
        status: 'new',
        stage: 'prospecting',
        priority: priority || 'medium',
        assignedAt: new Date(),
        notes: notes || null,
        tags: tags || null,
      }
    })

    return NextResponse.json({
      success: true,
      data: formatLead(lead),
      message: 'Lead created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating lead:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create lead' },
      { status: 500 }
    )
  }
}

// Helper function to format lead response
function formatLead(lead: any) {
  return {
    id: lead.id,
    businessName: lead.businessName,
    contactName: lead.contactName,
    phone: lead.phone,
    email: lead.email,
    address: lead.address,
    city: lead.city,
    province: lead.province,
    postalCode: lead.postalCode,
    location: lead.latitude && lead.longitude ? {
      latitude: lead.latitude,
      longitude: lead.longitude,
    } : null,
    businessType: lead.businessType,
    vertical: lead.vertical,
    subVertical: lead.subVertical,
    estimatedRevenue: lead.estimatedRevenue,
    currentPOS: lead.currentPOS,
    painPoints: lead.painPoints,
    status: lead.status,
    stage: lead.stage,
    priority: lead.priority,
    source: lead.source,
    originalSource: lead.originalSource,
    assignedAt: lead.assignedAt,
    lastContactAt: lead.lastContactAt,
    lastContactMethod: lead.lastContactMethod,
    nextFollowUp: lead.nextFollowUp,
    contactAttempts: lead.contactAttempts,
    wonAt: lead.wonAt,
    lostAt: lead.lostAt,
    lossReason: lead.lossReason,
    merchantId: lead.merchantId,
    notes: lead.notes,
    tags: lead.tags ? lead.tags.split(',') : [],
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  }
}

// Seed demo leads if none exist
async function seedDemoLeads() {
  const demoLeads = [
    {
      id: 'lead-001',
      businessName: "Sipho's Spaza Shop",
      contactName: 'Sipho Mokoena',
      phone: '0835551234',
      email: 'sipho@example.com',
      address: '123 Church St',
      city: 'Pretoria',
      province: 'Gauteng',
      postalCode: '0001',
      businessType: 'Retail',
      vertical: 'spaza',
      status: 'new',
      stage: 'prospecting',
      priority: 'high',
      source: 'self_generated',
      estimatedRevenue: 5000,
    },
    {
      id: 'lead-002',
      businessName: 'Thandi Beauty Salon',
      contactName: 'Thandi Nkosi',
      phone: '0845555678',
      email: 'thandi@example.com',
      address: '45 Stanza Bopape St',
      city: 'Sunnyside',
      province: 'Gauteng',
      postalCode: '0002',
      businessType: 'Services',
      vertical: 'beauty',
      status: 'contacted',
      stage: 'prospecting',
      priority: 'medium',
      source: 'marketing',
      estimatedRevenue: 8000,
    },
    {
      id: 'lead-003',
      businessName: "Mpho's Auto Repair",
      contactName: 'Mpho Dlamini',
      phone: '0855559012',
      email: 'mpho@example.com',
      address: '78 Steve Biko Rd',
      city: 'Arcadia',
      province: 'Gauteng',
      postalCode: '0003',
      businessType: 'Services',
      vertical: 'automotive',
      status: 'meeting',
      stage: 'qualification',
      priority: 'high',
      source: 'referral',
      estimatedRevenue: 12000,
    },
    {
      id: 'lead-004',
      businessName: 'KwaMai Shisa Nyama',
      contactName: 'Mai Ndlovu',
      phone: '0865553456',
      email: 'mai@example.com',
      address: '12 DF Malan Dr',
      city: 'Mamelodi',
      province: 'Gauteng',
      postalCode: '0004',
      businessType: 'Restaurant',
      vertical: 'restaurant',
      status: 'proposal',
      stage: 'proposal',
      priority: 'high',
      source: 'self_generated',
      estimatedRevenue: 15000,
    },
  ]

  for (const lead of demoLeads) {
    try {
      await db.salesforceLead.create({
        data: {
          ...lead,
          agentId: MOCK_AGENT_ID,
          assignedAt: new Date(),
          notes: null,
          tags: null,
        }
      })
    } catch (e) {
      // Lead may already exist
    }
  }

  return demoLeads.map(formatLead)
}
