import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

// Generate unique codes
function generateAgentCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'AG';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET /api/agents - List agents
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || '';
    const tier = searchParams.get('tier') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (tier) where.tier = tier;

    const agents = await db.agent.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            referrals: true,
            commissions: true,
          },
        },
      },
    });

    const total = await db.agent.count({ where });

    return NextResponse.json({
      agents: agents.map(agent => ({
        id: agent.id,
        agentCode: agent.agentCode,
        referralCode: agent.referralCode,
        firstName: agent.firstName,
        lastName: agent.lastName,
        email: agent.email,
        phone: agent.phone,
        businessName: agent.businessName,
        province: agent.province,
        city: agent.city,
        tier: agent.tier,
        commissionRate: agent.commissionRate,
        totalReferrals: agent.totalReferrals,
        activeReferrals: agent.activeReferrals,
        totalEarnings: agent.totalEarnings,
        pendingEarnings: agent.pendingEarnings,
        status: agent.status,
        kycStatus: agent.kycStatus,
        createdAt: agent.createdAt,
        _count: agent._count,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

// POST /api/agents - Register new agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      idNumber,
      businessName,
      businessType,
      province,
      city,
      merchantId,
      parentReferralCode,
      bankName,
      accountNumber,
      accountHolder,
      branchCode,
      termsAccepted,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !province || !city) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!termsAccepted) {
      return NextResponse.json(
        { error: 'Terms must be accepted' },
        { status: 400 }
      );
    }

    // Check for existing agent
    const existing = await db.agent.findFirst({
      where: {
        OR: [
          { email },
          { phone },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'An agent with this email or phone already exists' },
        { status: 400 }
      );
    }

    const now = new Date();
    
    // Generate unique codes
    let agentCode = generateAgentCode();
    let referralCode = generateReferralCode();
    
    // Ensure uniqueness
    while (await db.agent.findUnique({ where: { agentCode } })) {
      agentCode = generateAgentCode();
    }
    while (await db.agent.findUnique({ where: { referralCode } })) {
      referralCode = generateReferralCode();
    }

    // Find parent agent if referral code provided
    let parentAgentId: string | null = null;
    if (parentReferralCode) {
      const parentAgent = await db.agent.findUnique({
        where: { referralCode: parentReferralCode },
      });
      if (parentAgent) {
        parentAgentId = parentAgent.id;
      }
    }

    const agent = await db.agent.create({
      data: {
        id: randomUUID(),
        agentCode,
        referralCode,
        firstName,
        lastName,
        email,
        phone,
        idNumber: idNumber || null,
        businessName: businessName || null,
        businessType: businessType || null,
        province,
        city,
        merchantId: merchantId || null,
        parentAgentId,
        tier: 'starter',
        commissionRate: 0.05,
        bankName: bankName || null,
        accountNumber: accountNumber || null,
        accountHolder: accountHolder || null,
        branchCode: branchCode || null,
        status: 'pending',
        kycStatus: 'pending',
        termsAccepted: true,
        termsAcceptedAt: now,
        updatedAt: now,
      },
    });

    // Create audit log
    await db.auditLogEntry.create({
      data: {
        id: randomUUID(),
        action: 'agent_registered',
        category: 'agent_network',
        targetType: 'agent',
        targetId: agent.id,
        details: JSON.stringify({ 
          agentCode, 
          referralCode, 
          email, 
          parentAgentId 
        }),
        createdAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        agentCode: agent.agentCode,
        referralCode: agent.referralCode,
        status: agent.status,
        tier: agent.tier,
        commissionRate: agent.commissionRate,
        createdAt: agent.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { error: 'Failed to register agent' },
      { status: 500 }
    );
  }
}
