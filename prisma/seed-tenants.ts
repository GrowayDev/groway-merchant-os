/**
 * Multi-Tenant Database Seeder
 * 
 * Creates demo tenants for Merchant OS, GoPay, Grosell, and Consumer Wallet.
 * Assigns existing users to tenants and sets up default roles and permissions.
 */

import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

// Demo tenant definitions
const DEMO_TENANTS = [
  {
    id: 'tenant-merchant-os-demo',
    name: 'Merchant OS Demo',
    slug: 'merchant-os-demo',
    domain: 'merchant-os.groway.local',
    primaryColor: '#4CAF50',
    plan: 'enterprise',
    maxUsers: 10000,
    maxMerchants: 100,
    features: [
      'merchant_os',
      'multi_location',
      'advanced_reporting',
      'api_access',
      'webhooks',
      'audit_logs',
      'custom_roles',
    ],
    settings: {
      timezone: 'Africa/Johannesburg',
      currency: 'ZAR',
      locale: 'en-ZA',
      defaultVatRate: 15,
      receiptFooter: 'Thank you for shopping with us!',
    },
  },
  {
    id: 'tenant-gopay-demo',
    name: 'GoPay Demo',
    slug: 'gopay-demo',
    domain: 'gopay.groway.local',
    primaryColor: '#00897B',
    plan: 'enterprise',
    maxUsers: 5000,
    maxMerchants: 50,
    features: [
      'gopay',
      'advanced_reporting',
      'api_access',
      'webhooks',
      'audit_logs',
    ],
    settings: {
      timezone: 'Africa/Johannesburg',
      currency: 'ZAR',
      locale: 'en-ZA',
      settlementCurrency: 'ZAR',
      autoSettleEnabled: true,
    },
  },
  {
    id: 'tenant-grosell-demo',
    name: 'Grosell Demo',
    slug: 'grosell-demo',
    domain: 'grosell.groway.local',
    primaryColor: '#8B5CF6',
    plan: 'business',
    maxUsers: 2000,
    maxMerchants: 20,
    features: [
      'grosell',
      'advanced_reporting',
      'api_access',
      'webhooks',
    ],
    settings: {
      timezone: 'Africa/Johannesburg',
      currency: 'ZAR',
      locale: 'en-ZA',
      defaultShippingMethod: 'courier',
      orderConfirmationEmail: true,
    },
  },
  {
    id: 'tenant-consumer-wallet-demo',
    name: 'Consumer Wallet Demo',
    slug: 'consumer-wallet-demo',
    domain: 'wallet.groway.local',
    primaryColor: '#FF8F00',
    plan: 'enterprise',
    maxUsers: 50000,
    maxMerchants: 0,
    features: [
      'consumer_wallet',
      'api_access',
      'audit_logs',
    ],
    settings: {
      timezone: 'Africa/Johannesburg',
      currency: 'ZAR',
      locale: 'en-ZA',
      maxWalletBalance: 50000,
      dailyTransactionLimit: 25000,
      kycRequired: true,
    },
  },
]

// Default global roles (not tenant-specific)
const DEFAULT_ROLES = [
  {
    name: 'platform_admin',
    displayName: 'Platform Administrator',
    description: 'Full administrative access to the entire platform',
    permissions: ['*'],
    isSystem: true,
  },
  {
    name: 'tenant_owner',
    displayName: 'Tenant Owner',
    description: 'Full administrative access to the tenant',
    permissions: [
      'users.read', 'users.write', 'users.delete', 'users.invite',
      'settings.read', 'settings.write',
      'reports.read', 'reports.export',
      'audit.read',
      'billing.read', 'billing.write',
    ],
    isSystem: true,
  },
  {
    name: 'tenant_admin',
    displayName: 'Tenant Administrator',
    description: 'Administrative access with limited permissions',
    permissions: [
      'users.read', 'users.write', 'users.invite',
      'settings.read', 'settings.write',
      'reports.read', 'reports.export',
      'audit.read',
    ],
    isSystem: true,
  },
  {
    name: 'tenant_manager',
    displayName: 'Tenant Manager',
    description: 'Team management and operational access',
    permissions: [
      'users.read',
      'reports.read',
      'settings.read',
    ],
    isSystem: true,
  },
  {
    name: 'tenant_member',
    displayName: 'Tenant Member',
    description: 'Basic access for regular users',
    permissions: [
      'profile.read', 'profile.write',
    ],
    isSystem: true,
  },
]

// Demo users to create for each tenant
const DEMO_USERS = [
  {
    email: 'admin@merchant-os.demo',
    name: 'Merchant OS Admin',
    role: 'owner',
    tenantSlug: 'merchant-os-demo',
  },
  {
    email: 'manager@merchant-os.demo',
    name: 'Merchant OS Manager',
    role: 'manager',
    tenantSlug: 'merchant-os-demo',
  },
  {
    email: 'admin@gopay.demo',
    name: 'GoPay Admin',
    role: 'owner',
    tenantSlug: 'gopay-demo',
  },
  {
    email: 'admin@grosell.demo',
    name: 'Grosell Admin',
    role: 'owner',
    tenantSlug: 'grosell-demo',
  },
  {
    email: 'admin@wallet.demo',
    name: 'Wallet Admin',
    role: 'owner',
    tenantSlug: 'consumer-wallet-demo',
  },
]

async function main() {
  console.log('🌱 Starting multi-tenant database seed...')

  // 1. Create tenants
  console.log('\n📋 Creating tenants...')
  for (const tenantData of DEMO_TENANTS) {
    const existingTenant = await prisma.platformTenant.findUnique({
      where: { slug: tenantData.slug },
    })

    if (existingTenant) {
      console.log(`  ✓ Tenant ${tenantData.name} already exists`)
      continue
    }

    await prisma.platformTenant.create({
      data: {
        id: tenantData.id,
        name: tenantData.name,
        slug: tenantData.slug,
        domain: tenantData.domain,
        primaryColor: tenantData.primaryColor,
        plan: tenantData.plan,
        maxUsers: tenantData.maxUsers,
        maxMerchants: tenantData.maxMerchants,
        status: 'active',
        features: JSON.stringify(tenantData.features),
        settings: JSON.stringify(tenantData.settings),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    console.log(`  ✓ Created tenant: ${tenantData.name}`)
  }

  // 2. Create tenant subscriptions
  console.log('\n💳 Creating tenant subscriptions...')
  for (const tenantData of DEMO_TENANTS) {
    const existingSubscription = await prisma.tenantSubscription.findUnique({
      where: { tenantId: tenantData.id },
    })

    if (existingSubscription) {
      console.log(`  ✓ Subscription for ${tenantData.name} already exists`)
      continue
    }

    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setMonth(periodEnd.getMonth() + 1)

    await prisma.tenantSubscription.create({
      data: {
        id: `sub-${tenantData.id}`,
        tenantId: tenantData.id,
        planId: `${tenantData.plan}-plan`,
        planName: tenantData.plan.charAt(0).toUpperCase() + tenantData.plan.slice(1),
        billingCycle: 'monthly',
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        createdAt: now,
        updatedAt: now,
      },
    })
    console.log(`  ✓ Created subscription for: ${tenantData.name}`)
  }

  // 3. Create global roles (if not exists)
  console.log('\n🔐 Creating default roles...')
  for (const roleData of DEFAULT_ROLES) {
    const existingRole = await prisma.userRole.findUnique({
      where: { name: roleData.name },
    })

    if (existingRole) {
      continue
    }

    await prisma.userRole.create({
      data: {
        id: `role-${roleData.name}`,
        name: roleData.name,
        displayName: roleData.displayName,
        description: roleData.description,
        permissions: JSON.stringify(roleData.permissions),
        isSystem: roleData.isSystem,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    console.log(`  ✓ Created role: ${roleData.displayName}`)
  }

  // 4. Create demo users and assign to tenants
  console.log('\n👥 Creating demo users...')
  for (const userData of DEMO_USERS) {
    const tenant = await prisma.platformTenant.findUnique({
      where: { slug: userData.tenantSlug },
    })

    if (!tenant) {
      console.log(`  ⚠ Tenant not found: ${userData.tenantSlug}`)
      continue
    }

    // Check if user exists
    let consumerUser = await prisma.consumerUser.findUnique({
      where: { email: userData.email },
    })

    if (!consumerUser) {
      consumerUser = await prisma.consumerUser.create({
        data: {
          id: `user-${randomUUID().slice(0, 8)}`,
          phone: `+27${Math.floor(Math.random() * 900000000 + 100000000)}`,
          email: userData.email,
          firstName: userData.name.split(' ')[0],
          lastName: userData.name.split(' ').slice(1).join(' '),
          status: 'active',
          kycStatus: 'verified',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })
      console.log(`  ✓ Created user: ${userData.name}`)
    } else {
      console.log(`  ✓ User already exists: ${userData.name}`)
    }

    // Assign user to tenant
    const existingTenantUser = await prisma.tenantUser.findUnique({
      where: {
        tenantId_userId: {
          tenantId: tenant.id,
          userId: consumerUser.id,
        },
      },
    })

    if (!existingTenantUser) {
      await prisma.tenantUser.create({
        data: {
          id: `tu-${randomUUID().slice(0, 8)}`,
          tenantId: tenant.id,
          userId: consumerUser.id,
          userType: 'consumer',
          role: userData.role,
          status: 'active',
          permissions: JSON.stringify([]),
          acceptedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })
      console.log(`  ✓ Assigned ${userData.name} to ${tenant.name}`)
    }
  }

  // 5. Assign existing users to appropriate tenants
  console.log('\n🔗 Assigning existing users to tenants...')
  
  // Get all existing consumer users
  const existingUsers = await prisma.consumerUser.findMany({
    take: 100,
  })

  console.log(`  Found ${existingUsers.length} existing consumer users`)

  // Assign to consumer wallet tenant by default
  const consumerWalletTenant = await prisma.platformTenant.findUnique({
    where: { slug: 'consumer-wallet-demo' },
  })

  if (consumerWalletTenant) {
    for (const user of existingUsers.slice(0, 50)) {
      const existingTenantUser = await prisma.tenantUser.findUnique({
        where: {
          tenantId_userId: {
            tenantId: consumerWalletTenant.id,
            userId: user.id,
          },
        },
      })

      if (!existingTenantUser) {
        await prisma.tenantUser.create({
          data: {
            id: `tu-${randomUUID().slice(0, 8)}`,
            tenantId: consumerWalletTenant.id,
            userId: user.id,
            userType: 'consumer',
            role: 'member',
            status: 'active',
            permissions: JSON.stringify([]),
            acceptedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })
      }
    }
    console.log(`  ✓ Assigned existing users to Consumer Wallet tenant`)
  }

  // 6. Create sample invitations
  console.log('\n📧 Creating sample invitations...')
  const sampleInvites = [
    { email: 'newuser@example.com', tenantSlug: 'merchant-os-demo', role: 'member' },
    { email: 'manager@example.com', tenantSlug: 'gopay-demo', role: 'admin' },
  ]

  for (const invite of sampleInvites) {
    const tenant = await prisma.platformTenant.findUnique({
      where: { slug: invite.tenantSlug },
    })

    if (!tenant) continue

    const existingInvite = await prisma.tenantInvitation.findFirst({
      where: {
        tenantId: tenant.id,
        email: invite.email,
        status: 'pending',
      },
    })

    if (!existingInvite) {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      await prisma.tenantInvitation.create({
        data: {
          id: `inv-${randomUUID().slice(0, 8)}`,
          tenantId: tenant.id,
          email: invite.email,
          role: invite.role,
          permissions: JSON.stringify([]),
          invitedBy: 'system',
          invitedByName: 'System',
          token: randomUUID(),
          status: 'pending',
          expiresAt,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })
      console.log(`  ✓ Created invitation for ${invite.email}`)
    }
  }

  // Summary
  console.log('\n✅ Multi-tenant seed completed!')
  console.log('\n📊 Summary:')
  
  const tenantCount = await prisma.platformTenant.count()
  const userCount = await prisma.tenantUser.count()
  const inviteCount = await prisma.tenantInvitation.count({ where: { status: 'pending' } })
  const roleCount = await prisma.userRole.count()
  const subscriptionCount = await prisma.tenantSubscription.count()

  console.log(`  - Tenants: ${tenantCount}`)
  console.log(`  - Tenant Users: ${userCount}`)
  console.log(`  - Pending Invitations: ${inviteCount}`)
  console.log(`  - Roles: ${roleCount}`)
  console.log(`  - Subscriptions: ${subscriptionCount}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
