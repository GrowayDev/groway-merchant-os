import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/commissions/rules - List all commission rules
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const active = searchParams.get('active')
    const type = searchParams.get('type')

    const where: Record<string, unknown> = {}
    
    if (active !== null) {
      where.active = active === 'true'
    }
    if (type) {
      where.ruleType = type
    }

    const rules = await db.commissionRule.findMany({
      where,
      orderBy: [
        { active: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    // If no rules exist, return demo data
    if (rules.length === 0) {
      const demoRules = generateDemoRules()
      return NextResponse.json({ rules: demoRules })
    }

    return NextResponse.json({ rules })
  } catch (error) {
    console.error('Error fetching commission rules:', error)
    return NextResponse.json({ error: 'Failed to fetch commission rules' }, { status: 500 })
  }
}

// POST /api/admin/commissions/rules - Create a new commission rule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      ruleName,
      ruleType,
      minAmount = 0,
      maxAmount,
      commissionRate = 0,
      fixedAmount = 0,
      capAmount,
      bronzeMultiplier = 1.0,
      silverMultiplier = 1.25,
      goldMultiplier = 1.5,
      platinumMultiplier = 2.0,
      validFrom,
      validTo,
      active = true
    } = body

    // Validation
    if (!ruleName || !ruleType) {
      return NextResponse.json({ 
        error: 'Missing required fields: ruleName, ruleType' 
      }, { status: 400 })
    }

    const validTypes = ['signup', 'transaction', 'subscription', 'tier_override', 'bonus']
    if (!validTypes.includes(ruleType)) {
      return NextResponse.json({ 
        error: `Invalid rule type. Must be one of: ${validTypes.join(', ')}` 
      }, { status: 400 })
    }

    const rule = await db.commissionRule.create({
      data: {
        id: `rule-${Date.now()}`,
        ruleName,
        ruleType,
        minAmount,
        maxAmount,
        commissionRate,
        fixedAmount,
        capAmount,
        bronzeMultiplier,
        silverMultiplier,
        goldMultiplier,
        platinumMultiplier,
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null,
        active,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, rule })
  } catch (error) {
    console.error('Error creating commission rule:', error)
    return NextResponse.json({ error: 'Failed to create commission rule' }, { status: 500 })
  }
}

// PUT /api/admin/commissions/rules - Update a commission rule
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing rule id' }, { status: 400 })
    }

    // Check if rule exists
    const existingRule = await db.commissionRule.findUnique({
      where: { id }
    })

    if (!existingRule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    // Prepare update data
    const data: Record<string, unknown> = {
      ...updateData,
      updatedAt: new Date()
    }

    // Handle date fields
    if (updateData.validFrom !== undefined) {
      data.validFrom = updateData.validFrom ? new Date(updateData.validFrom) : null
    }
    if (updateData.validTo !== undefined) {
      data.validTo = updateData.validTo ? new Date(updateData.validTo) : null
    }

    const rule = await db.commissionRule.update({
      where: { id },
      data
    })

    return NextResponse.json({ success: true, rule })
  } catch (error) {
    console.error('Error updating commission rule:', error)
    return NextResponse.json({ error: 'Failed to update commission rule' }, { status: 500 })
  }
}

// DELETE /api/admin/commissions/rules - Delete a commission rule
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing rule id' }, { status: 400 })
    }

    // Check if rule exists
    const existingRule = await db.commissionRule.findUnique({
      where: { id }
    })

    if (!existingRule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    await db.commissionRule.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting commission rule:', error)
    return NextResponse.json({ error: 'Failed to delete commission rule' }, { status: 500 })
  }
}

// Generate demo rules
function generateDemoRules() {
  return [
    {
      id: 'rule-001',
      ruleName: 'Standard Signup Commission',
      ruleType: 'signup',
      minAmount: 0,
      maxAmount: null,
      commissionRate: 5,
      fixedAmount: 0,
      capAmount: null,
      bronzeMultiplier: 1.0,
      silverMultiplier: 1.25,
      goldMultiplier: 1.5,
      platinumMultiplier: 2.0,
      active: true,
      validFrom: null,
      validTo: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'rule-002',
      ruleName: 'Transaction Commission',
      ruleType: 'transaction',
      minAmount: 0,
      maxAmount: null,
      commissionRate: 2,
      fixedAmount: 0,
      capAmount: 500,
      bronzeMultiplier: 1.0,
      silverMultiplier: 1.25,
      goldMultiplier: 1.5,
      platinumMultiplier: 2.0,
      active: true,
      validFrom: null,
      validTo: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'rule-003',
      ruleName: 'Override Commission (Level 1)',
      ruleType: 'tier_override',
      minAmount: 0,
      maxAmount: null,
      commissionRate: 1,
      fixedAmount: 0,
      capAmount: null,
      bronzeMultiplier: 0.5,
      silverMultiplier: 0.75,
      goldMultiplier: 1.0,
      platinumMultiplier: 1.25,
      active: true,
      validFrom: null,
      validTo: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'rule-004',
      ruleName: 'Subscription Commission',
      ruleType: 'subscription',
      minAmount: 0,
      maxAmount: null,
      commissionRate: 10,
      fixedAmount: 50,
      capAmount: null,
      bronzeMultiplier: 1.0,
      silverMultiplier: 1.25,
      goldMultiplier: 1.5,
      platinumMultiplier: 2.0,
      active: true,
      validFrom: null,
      validTo: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'rule-005',
      ruleName: 'High Value Transaction Bonus',
      ruleType: 'bonus',
      minAmount: 10000,
      maxAmount: null,
      commissionRate: 0,
      fixedAmount: 100,
      capAmount: 500,
      bronzeMultiplier: 1.0,
      silverMultiplier: 1.25,
      goldMultiplier: 1.5,
      platinumMultiplier: 2.0,
      active: true,
      validFrom: null,
      validTo: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'rule-006',
      ruleName: 'Inactive Rule Example',
      ruleType: 'signup',
      minAmount: 0,
      maxAmount: null,
      commissionRate: 8,
      fixedAmount: 0,
      capAmount: null,
      bronzeMultiplier: 1.0,
      silverMultiplier: 1.25,
      goldMultiplier: 1.5,
      platinumMultiplier: 2.0,
      active: false,
      validFrom: null,
      validTo: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
}
