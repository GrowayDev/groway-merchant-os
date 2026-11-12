#!/usr/bin/env bun
/**
 * Seed POS data for WaiterPad and other F&B features
 * Creates RestaurantStaff, VoidReasons, PaymentMethods, TipOptions
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10)
}

async function main() {
  console.log('Seeding POS data...')
  
  const results = {
    merchant: { created: 0, existing: 0 },
    branch: { created: 0, existing: 0 },
    staff: { created: 0, existing: 0 },
    voidReasons: { created: 0, existing: 0 },
    paymentMethods: { created: 0, existing: 0 },
    tipOptions: { created: 0, existing: 0 },
    sections: { created: 0, existing: 0 },
    tables: { created: 0, existing: 0 },
  }

  // 0. SEED MERCHANT (required for transactions)
  const merchantId = 'merchant-001'
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
        vertical: 'fnb',
        subVertical: 'sit-down-restaurant',
        phone: '+27123456789',
        email: 'info@demorestaurant.co.za',
        city: 'Johannesburg',
        province: 'Gauteng',
        postalCode: '2000',
        country: 'South Africa',
        plan: 'professional',
        planStatus: 'active',
        status: 'active',
        onboardingComplete: true,
        onboardingStep: 'complete',
        updatedAt: new Date(),
      },
    })
    results.merchant.created++
    console.log('✅ Created merchant')
  } else {
    results.merchant.existing++
    console.log('ℹ️ Merchant already exists')
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
    console.log('✅ Created branch')
  } else {
    results.branch.existing++
    console.log('ℹ️ Branch already exists')
  }

  // 1. SEED STAFF MEMBERS
  console.log('Seeding staff members...')
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
      console.log(`  ✅ Created staff: ${staff.name} (PIN: ${staff.pin})`)
    } else {
      results.staff.existing++
      console.log(`  ℹ️ Staff already exists: ${staff.name}`)
    }
  }

  // 2. SEED VOID REASONS
  console.log('Seeding void reasons...')
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
  console.log(`  ✅ Void reasons: ${results.voidReasons.created} created, ${results.voidReasons.existing} existing`)

  // 3. SEED PAYMENT METHODS
  console.log('Seeding payment methods...')
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
  console.log(`  ✅ Payment methods: ${results.paymentMethods.created} created, ${results.paymentMethods.existing} existing`)

  // 4. SEED TIP OPTIONS
  console.log('Seeding tip options...')
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
  console.log(`  ✅ Tip options: ${results.tipOptions.created} created, ${results.tipOptions.existing} existing`)

  // 5. SEED FLOOR SECTIONS
  console.log('Seeding floor sections...')
  const sectionsData = [
    { name: 'Main Dining', color: '#4CAF50' },
    { name: 'Patio', color: '#2196F3' },
    { name: 'VIP', color: '#9C27B0' },
    { name: 'Bar', color: '#FF9800' },
  ]

  for (const section of sectionsData) {
    const existing = await prisma.floorSection.findFirst({
      where: { name: section.name },
    })

    if (!existing) {
      await prisma.floorSection.create({
        data: {
          id: `section-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          name: section.name,
          color: section.color,
          updatedAt: new Date(),
        },
      })
      results.sections.created++
    } else {
      results.sections.existing++
    }
  }
  console.log(`  ✅ Floor sections: ${results.sections.created} created, ${results.sections.existing} existing`)

  // 6. SEED TABLES
  console.log('Seeding tables...')
  const sections = await prisma.floorSection.findMany()
  
  if (sections.length > 0) {
    const tablesData = [
      { number: '1', seats: 4, shape: 'circle', sectionIndex: 0 },
      { number: '2', seats: 4, shape: 'circle', sectionIndex: 0 },
      { number: '3', seats: 2, shape: 'square', sectionIndex: 0 },
      { number: '4', seats: 6, shape: 'rectangle', sectionIndex: 0 },
      { number: '5', seats: 4, shape: 'circle', sectionIndex: 1 },
      { number: '6', seats: 4, shape: 'circle', sectionIndex: 1 },
      { number: '7', seats: 8, shape: 'rectangle', sectionIndex: 2 },
      { number: '8', seats: 2, shape: 'square', sectionIndex: 3 },
      { number: '9', seats: 2, shape: 'square', sectionIndex: 3 },
      { number: '10', seats: 4, shape: 'booth', sectionIndex: 3 },
    ]

    for (const table of tablesData) {
      const sectionId = sections[table.sectionIndex]?.id || sections[0].id
      const existing = await prisma.restaurantTable.findFirst({
        where: { number: table.number },
      })

      if (!existing) {
        await prisma.restaurantTable.create({
          data: {
            id: `table-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            number: table.number,
            seats: table.seats,
            shape: table.shape,
            sectionId: sectionId,
            status: 'available',
            x: Math.random() * 400,
            y: Math.random() * 400,
            updatedAt: new Date(),
          },
        })
        results.tables.created++
      } else {
        results.tables.existing++
      }
    }
    console.log(`  ✅ Tables: ${results.tables.created} created, ${results.tables.existing} existing`)
  }

  console.log('')
  console.log('═══════════════════════════════════════════════════')
  console.log('✅ POS SEED COMPLETE')
  console.log('═══════════════════════════════════════════════════')
  console.log('')
  console.log('Demo Staff PINs:')
  console.log('─'.repeat(50))
  console.log('Manager:    1234 (full access)')
  console.log('Supervisor: 5678 (void, discount, close shift)')
  console.log('Waiter 1:   1111 (basic)')
  console.log('Waiter 2:   2222 (basic)')
  console.log('Bartender:  3333 (basic)')
  console.log('─'.repeat(50))
}

main()
  .catch((e) => {
    console.error('Error seeding POS data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
