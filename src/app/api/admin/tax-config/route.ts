import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/tax-config - Get tax configuration for a merchant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId') || 'merchant-001';

    // Fetch tax configuration
    let config = await db.taxConfig.findUnique({
      where: { merchantId },
    });

    // If no config exists, create default
    if (!config) {
      config = await db.taxConfig.create({
        data: {
          id: `tax-config-${Date.now()}`,
          merchantId,
          vatRegistered: false,
          vatFilingPeriod: 'bi_monthly',
          vatFilingDay: 25,
          payeRegistered: false,
          payeFilingDay: 7,
          uifRegistered: false,
          sdlRegistered: false,
          provisionalTaxpayer: false,
          efilingConnected: false,
        },
      });
    }

    // Get merchant details for additional context
    const merchant = await db.adminMerchant.findUnique({
      where: { id: merchantId },
      select: {
        businessName: true,
        vatNumber: true,
        registrationNumber: true,
      },
    });

    return NextResponse.json({
      config,
      merchant,
    });
  } catch (error) {
    console.error('Error fetching tax config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tax configuration' },
      { status: 500 }
    );
  }
}

// POST /api/admin/tax-config - Create or update tax configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      merchantId,
      vatNumber,
      incomeTaxNumber,
      payeNumber,
      uifNumber,
      sdlNumber,
      vatRegistered,
      vatFilingPeriod,
      vatFilingDay,
      payeRegistered,
      payeFilingDay,
      uifRegistered,
      sdlRegistered,
      companyTaxYearEnd,
      provisionalTaxpayer,
    } = body;

    const targetMerchantId = merchantId || 'merchant-001';

    // Check if config exists
    const existingConfig = await db.taxConfig.findUnique({
      where: { merchantId: targetMerchantId },
    });

    let config;

    if (existingConfig) {
      // Update existing config
      config = await db.taxConfig.update({
        where: { merchantId: targetMerchantId },
        data: {
          vatNumber,
          incomeTaxNumber,
          payeNumber,
          uifNumber,
          sdlNumber,
          vatRegistered: vatRegistered ?? existingConfig.vatRegistered,
          vatFilingPeriod: vatFilingPeriod ?? existingConfig.vatFilingPeriod,
          vatFilingDay: vatFilingDay ?? existingConfig.vatFilingDay,
          payeRegistered: payeRegistered ?? existingConfig.payeRegistered,
          payeFilingDay: payeFilingDay ?? existingConfig.payeFilingDay,
          uifRegistered: uifRegistered ?? existingConfig.uifRegistered,
          sdlRegistered: sdlRegistered ?? existingConfig.sdlRegistered,
          companyTaxYearEnd,
          provisionalTaxpayer: provisionalTaxpayer ?? existingConfig.provisionalTaxpayer,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new config
      config = await db.taxConfig.create({
        data: {
          id: `tax-config-${Date.now()}`,
          merchantId: targetMerchantId,
          vatNumber,
          incomeTaxNumber,
          payeNumber,
          uifNumber,
          sdlNumber,
          vatRegistered: vatRegistered ?? false,
          vatFilingPeriod: vatFilingPeriod ?? 'bi_monthly',
          vatFilingDay: vatFilingDay ?? 25,
          payeRegistered: payeRegistered ?? false,
          payeFilingDay: payeFilingDay ?? 7,
          uifRegistered: uifRegistered ?? false,
          sdlRegistered: sdlRegistered ?? false,
          companyTaxYearEnd,
          provisionalTaxpayer: provisionalTaxpayer ?? false,
        },
      });
    }

    // Update merchant VAT number if provided
    if (vatNumber) {
      await db.adminMerchant.update({
        where: { id: targetMerchantId },
        data: { vatNumber },
      });
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'tax_config_updated',
        category: 'sars',
        actorName: 'Admin User',
        targetType: 'tax_config',
        targetId: config.id,
        targetName: 'Tax Configuration',
        details: JSON.stringify({
          vatRegistered,
          payeRegistered,
          provisionalTaxpayer,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      config,
      message: 'Tax configuration saved successfully',
    });
  } catch (error) {
    console.error('Error saving tax config:', error);
    return NextResponse.json(
      { error: 'Failed to save tax configuration' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/tax-config - Connect/disconnect eFiling
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantId, action, credentials } = body;

    const targetMerchantId = merchantId || 'merchant-001';

    if (action === 'connect_efiling') {
      // In production, this would integrate with SARS eFiling API
      // For now, simulate successful connection

      const config = await db.taxConfig.update({
        where: { merchantId: targetMerchantId },
        data: {
          efilingConnected: true,
          efilingConnectedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Create audit log
      await db.auditLog.create({
        data: {
          action: 'efiling_connected',
          category: 'sars',
          actorName: 'Admin User',
          targetType: 'tax_config',
          targetId: config.id,
          targetName: 'SARS eFiling Connection',
          details: JSON.stringify({
            connectedAt: new Date(),
          }),
        },
      });

      return NextResponse.json({
        success: true,
        config,
        message: 'Successfully connected to SARS eFiling',
      });
    }

    if (action === 'disconnect_efiling') {
      const config = await db.taxConfig.update({
        where: { merchantId: targetMerchantId },
        data: {
          efilingConnected: false,
          updatedAt: new Date(),
        },
      });

      // Create audit log
      await db.auditLog.create({
        data: {
          action: 'efiling_disconnected',
          category: 'sars',
          actorName: 'Admin User',
          targetType: 'tax_config',
          targetId: config.id,
          targetName: 'SARS eFiling Connection',
        },
      });

      return NextResponse.json({
        success: true,
        config,
        message: 'Disconnected from SARS eFiling',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating eFiling connection:', error);
    return NextResponse.json(
      { error: 'Failed to update eFiling connection' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/tax-config - Delete tax configuration
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId') || 'merchant-001';

    await db.taxConfig.delete({
      where: { merchantId },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'tax_config_deleted',
        category: 'sars',
        actorName: 'Admin User',
        targetType: 'tax_config',
        targetId: merchantId,
        targetName: 'Tax Configuration',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Tax configuration deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting tax config:', error);
    return NextResponse.json(
      { error: 'Failed to delete tax configuration' },
      { status: 500 }
    );
  }
}
