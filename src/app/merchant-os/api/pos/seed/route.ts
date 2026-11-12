import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * DEMO/SEED DATA ENDPOINT
 * 
 * This endpoint seeds demo data for testing and development purposes.
 * The hardcoded merchant ID 'merchant-001' is intentional for demo data creation.
 * 
 * WARNING: This should only be used in development/staging environments.
 * In production, merchants should be created through the proper onboarding flow.
 */

async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10)
}

// Demo merchant ID for seed data - this is intentional for demo purposes
const DEMO_MERCHANT_ID = 'merchant-001'
const DEMO_BRANCH_ID = 'branch-001'

export async function POST() {
  try {
    const results = {
      merchant: { created: 0, existing: 0 },
      branch: { created: 0, existing: 0 },
      staff: { created: 0, existing: 0 },
      voidReasons: { created: 0, existing: 0 },
      paymentMethods: { created: 0, existing: 0 },
      tipOptions: { created: 0, existing: 0 },
    }

    // 0. SEED MERCHANT (required for transactions)
    const merchantId = DEMO_MERCHANT_ID
    const existingMerchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    })

    if (!existingMerchant) {
      await prisma.merchant.create({
        data: {
          id: merchantId,
          code: 'MERCH001',
          name: 'Demo Restaurant',
          tradingName: 'Demo Restaurant & Bar',
          vertical: 'restaurant',
          subVertical: 'casual-dining',
          phone: '+27123456789',
          email: 'info@demorestaurant.co.za',
          city: 'Johannesburg',
          province: 'Gauteng',
          postalCode: '2000',
          country: 'South Africa',
          plan: 'professional',
          planStatus: 'active',
          status: 'active',
          updatedAt: new Date(),
        },
      })
      results.merchant.created++
    } else {
      results.merchant.existing++
    }

    // 0.1 SEED BRANCH (required for transactions)
    const branchId = 'branch-001'
    const existingBranch = await prisma.branch.findUnique({
      where: { id: branchId },
    })

    if (!existingBranch) {
      await prisma.branch.create({
        data: {
          id: branchId,
          merchantId: merchantId,
          code: 'BR001',
          name: 'Main Branch',
          type: 'store',
          isDefault: true,
          isActive: true,
          updatedAt: new Date(),
        },
      })
      results.branch.created++
    } else {
      results.branch.existing++
    }

    // 1. SEED STAFF MEMBERS
    const staffData = [
      {
        name: 'Manager',
        email: 'manager@groway.co',
        phone: '+27123456780',
        pin: '1234',
        role: 'admin',
        status: 'active',
        color: '#E91E63',
        canVoid: true,
        canDiscount: true,
        canRefund: true,
        canCloseShift: true,
        canManageStaff: true,
        canViewReports: true,
      },
      {
        name: 'Supervisor',
        email: 'supervisor@groway.co',
        phone: '+27123456781',
        pin: '5678',
        role: 'supervisor',
        status: 'active',
        color: '#9C27B0',
        canVoid: true,
        canDiscount: true,
        canRefund: false,
        canCloseShift: true,
        canManageStaff: false,
        canViewReports: true,
      },
      {
        name: 'Waiter 1',
        email: 'waiter1@groway.co',
        phone: '+27123456782',
        pin: '1111',
        role: 'waiter',
        status: 'active',
        color: '#2196F3',
      },
      {
        name: 'Waiter 2',
        email: 'waiter2@groway.co',
        phone: '+27123456783',
        pin: '2222',
        role: 'waiter',
        status: 'active',
        color: '#00BCD4',
      },
      {
        name: 'Bartender',
        email: 'bartender@groway.co',
        phone: '+27123456784',
        pin: '3333',
        role: 'bartender',
        status: 'active',
        color: '#FF9800',
      },
    ]

    for (const staff of staffData) {
      const existing = await prisma.restaurantStaff.findUnique({
        where: { email: staff.email },
      })

      if (!existing) {
        const hashedPin = await hashPin(staff.pin)
        await prisma.restaurantStaff.create({
          data: {
            id: `staff-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            name: staff.name,
            email: staff.email,
            phone: staff.phone,
            pin: hashedPin,
            role: staff.role,
            status: staff.status,
            color: staff.color,
            canVoid: staff.canVoid || false,
            canDiscount: staff.canDiscount || false,
            canRefund: staff.canRefund || false,
            canCloseShift: staff.canCloseShift || false,
            canManageStaff: staff.canManageStaff || false,
            canViewReports: staff.canViewReports || false,
            updatedAt: new Date(),
          },
        })
        results.staff.created++
      } else {
        results.staff.existing++
      }
    }

    // 2. SEED VOID REASONS
    const voidReasonsData = [
      { reason: 'Customer changed mind', category: 'customer', requireManager: false, sortOrder: 1 },
      { reason: 'Item not available', category: 'kitchen', requireManager: false, sortOrder: 2 },
      { reason: 'Wrong item ordered', category: 'staff', requireManager: false, sortOrder: 3 },
      { reason: 'Kitchen error', category: 'kitchen', requireManager: false, sortOrder: 4 },
      { reason: 'Complimentary/Manager', category: 'staff', requireManager: true, sortOrder: 5 },
      { reason: 'Other', category: 'general', requireManager: false, sortOrder: 6 },
    ]

    for (const voidReason of voidReasonsData) {
      const existing = await prisma.voidReason.findFirst({
        where: { reason: voidReason.reason },
      })

      if (!existing) {
        await prisma.voidReason.create({
          data: {
            id: `void-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            reason: voidReason.reason,
            category: voidReason.category,
            requireManager: voidReason.requireManager,
            sortOrder: voidReason.sortOrder,
            active: true,
            updatedAt: new Date(),
          },
        })
        results.voidReasons.created++
      } else {
        results.voidReasons.existing++
      }
    }

    // 3. SEED PAYMENT METHODS
    const paymentMethodsData = [
      { name: 'Cash', type: 'cash', icon: 'banknote', sortOrder: 1, feeType: null, feeAmount: 0 },
      { name: 'Credit/Debit Card', type: 'card', icon: 'credit-card', sortOrder: 2, feeType: 'percentage', feeAmount: 2.5 },
      { name: 'Mobile Payment', type: 'mobile', icon: 'smartphone', sortOrder: 3, feeType: 'percentage', feeAmount: 1.5 },
      { name: 'Voucher', type: 'voucher', icon: 'ticket', sortOrder: 4, feeType: null, feeAmount: 0 },
    ]

    for (const paymentMethod of paymentMethodsData) {
      const existing = await prisma.paymentMethod.findFirst({
        where: { name: paymentMethod.name },
      })

      if (!existing) {
        await prisma.paymentMethod.create({
          data: {
            id: `pm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            name: paymentMethod.name,
            type: paymentMethod.type,
            icon: paymentMethod.icon,
            sortOrder: paymentMethod.sortOrder,
            feeType: paymentMethod.feeType,
            feeAmount: paymentMethod.feeAmount,
            active: true,
            updatedAt: new Date(),
          },
        })
        results.paymentMethods.created++
      } else {
        results.paymentMethods.existing++
      }
    }

    // 4. SEED TIP OPTIONS
    const tipOptionsData = [
      { percentage: 10, label: 'Good', sortOrder: 1 },
      { percentage: 15, label: 'Great', sortOrder: 2 },
      { percentage: 18, label: 'Excellent', sortOrder: 3 },
      { percentage: 20, label: 'Outstanding', sortOrder: 4 },
    ]

    for (const tipOption of tipOptionsData) {
      const existing = await prisma.tipOption.findFirst({
        where: { percentage: tipOption.percentage },
      })

      if (!existing) {
        await prisma.tipOption.create({
          data: {
            id: `tip-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            percentage: tipOption.percentage,
            label: tipOption.label,
            sortOrder: tipOption.sortOrder,
            active: true,
            updatedAt: new Date(),
          },
        })
        results.tipOptions.created++
      } else {
        results.tipOptions.existing++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'POS seed data initialized successfully',
      results,
      seededData: {
        merchant: { id: merchantId, name: 'Demo Restaurant' },
        branch: { id: branchId, name: 'Main Branch' },
        staff: staffData.map(s => ({ name: s.name, role: s.role, pin: s.pin })),
        voidReasons: voidReasonsData,
        paymentMethods: paymentMethodsData.map(p => ({ name: p.name, type: p.type })),
        tipOptions: tipOptionsData,
      },
    })
  } catch (error) {
    console.error('Error seeding POS data:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to seed POS data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
