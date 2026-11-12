import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/fraud-alerts - List all fraud alerts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    
    if (status) {
      where.status = status;
    }
    if (severity) {
      where.severity = severity;
    }
    if (type) {
      where.type = type;
    }

    const [alerts, total] = await Promise.all([
      db.fraudAlert.findMany({
        where,
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      db.fraudAlert.count({ where }),
    ]);

    // Get monitoring rules stats
    const rules = await db.monitoringRule.findMany({
      where: { status: 'active' },
      orderBy: { triggers24h: 'desc' },
    });

    return NextResponse.json({
      alerts,
      rules,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching fraud alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fraud alerts' },
      { status: 500 }
    );
  }
}

// POST /api/admin/fraud-alerts - Create a new fraud alert
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      severity = 'medium',
      merchantId,
      merchantName,
      transactionId,
      amount,
      description,
      riskScore,
      rule,
      details,
    } = body;

    if (!type || !description) {
      return NextResponse.json(
        { error: 'Type and description are required' },
        { status: 400 }
      );
    }

    const alert = await db.fraudAlert.create({
      data: {
        type,
        severity,
        merchantId,
        merchantName,
        transactionId,
        amount,
        description,
        riskScore,
        rule,
        details: details ? JSON.stringify(details) : null,
        status: 'new',
      },
    });

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    console.error('Error creating fraud alert:', error);
    return NextResponse.json(
      { error: 'Failed to create fraud alert' },
      { status: 500 }
    );
  }
}
