import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Valid courier names and codes
const VALID_COURIERS = [
  { name: 'DSV', code: 'dsv' },
  { name: 'RAM', code: 'ram' },
  { name: 'Paxi', code: 'paxi' },
  { name: 'Aramex', code: 'aramex' },
  { name: 'Fastway', code: 'fastway' },
];

const VALID_STATUSES = ['pending', 'active', 'error'];
const VALID_SERVICES = ['overnight', 'economy', 'same_day'];

// GET /api/couriers/integrations - List all courier integrations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const status = searchParams.get('status');
    const courierCode = searchParams.get('courierCode');

    // Build filter conditions
    const where: Record<string, unknown> = {};
    
    if (merchantId) {
      where.merchantId = merchantId;
    }
    
    if (status && VALID_STATUSES.includes(status)) {
      where.status = status;
    }
    
    if (courierCode && VALID_COURIERS.some(c => c.code === courierCode)) {
      where.courierCode = courierCode;
    }

    const integrations = await db.courierIntegration.findMany({
      where,
      include: {
        _count: {
          select: { shipments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform the response to include shipment count
    const response = integrations.map(integration => ({
      ...integration,
      shipmentCount: integration._count.shipments,
      _count: undefined,
    }));

    return NextResponse.json({
      success: true,
      data: response,
      meta: {
        validCouriers: VALID_COURIERS,
        validStatuses: VALID_STATUSES,
        validServices: VALID_SERVICES,
      }
    });
  } catch (error) {
    console.error('Error fetching courier integrations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch courier integrations' },
      { status: 500 }
    );
  }
}

// POST /api/couriers/integrations - Create a new courier integration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      merchantId,
      courierName,
      courierCode,
      status,
      apiKey,
      accountNumber,
      autoCreateWaybill,
      defaultService,
    } = body;

    // Validate required fields
    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: 'merchantId is required' },
        { status: 400 }
      );
    }

    if (!courierName || !courierCode) {
      return NextResponse.json(
        { success: false, error: 'courierName and courierCode are required' },
        { status: 400 }
      );
    }

    // Validate courier code
    const validCourier = VALID_COURIERS.find(c => c.code === courierCode.toLowerCase());
    if (!validCourier) {
      return NextResponse.json(
        { success: false, error: `Invalid courier code. Valid codes: ${VALID_COURIERS.map(c => c.code).join(', ')}` },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Valid statuses: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate service if provided
    if (defaultService && !VALID_SERVICES.includes(defaultService)) {
      return NextResponse.json(
        { success: false, error: `Invalid default service. Valid services: ${VALID_SERVICES.join(', ')}` },
        { status: 400 }
      );
    }

    // Check for existing integration with same merchantId and courierCode
    const existingIntegration = await db.courierIntegration.findUnique({
      where: {
        merchantId_courierCode: {
          merchantId,
          courierCode: courierCode.toLowerCase(),
        }
      }
    });

    if (existingIntegration) {
      return NextResponse.json(
        { success: false, error: 'Courier integration already exists for this merchant and courier' },
        { status: 409 }
      );
    }

    // Create the integration
    const integration = await db.courierIntegration.create({
      data: {
        merchantId,
        courierName: courierName || validCourier.name,
        courierCode: courierCode.toLowerCase(),
        status: status || 'pending',
        apiKey: apiKey || null,
        accountNumber: accountNumber || null,
        autoCreateWaybill: autoCreateWaybill ?? false,
        defaultService: defaultService || null,
      }
    });

    return NextResponse.json({
      success: true,
      data: integration,
      message: 'Courier integration created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating courier integration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create courier integration' },
      { status: 500 }
    );
  }
}
