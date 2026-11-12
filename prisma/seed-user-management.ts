import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding user management data...');

  const now = new Date();

  // Create Platform Tenants
  const tenants = [
    {
      id: randomUUID(),
      name: 'Merchant OS Demo',
      slug: 'merchant-os-demo',
      plan: 'professional',
      maxUsers: 1000,
      maxMerchants: 100,
      status: 'active',
      primaryColor: '#4CAF50',
      features: JSON.stringify(['pos', 'inventory', 'accounting', 'crm', 'staff']),
      settings: JSON.stringify({ timezone: 'Africa/Johannesburg', currency: 'ZAR' }),
      updatedAt: now,
    },
    {
      id: randomUUID(),
      name: 'GoPay Demo',
      slug: 'gopay-demo',
      plan: 'enterprise',
      maxUsers: 5000,
      maxMerchants: 500,
      status: 'active',
      primaryColor: '#00897B',
      features: JSON.stringify(['payments', 'settlements', 'devices', 'fraud_detection']),
      settings: JSON.stringify({ timezone: 'Africa/Johannesburg', currency: 'ZAR' }),
      updatedAt: now,
    },
    {
      id: randomUUID(),
      name: 'GroSell Demo',
      slug: 'grosell-demo',
      plan: 'starter',
      maxUsers: 100,
      maxMerchants: 10,
      status: 'active',
      primaryColor: '#8B5CF6',
      features: JSON.stringify(['ecommerce', 'products', 'orders', 'customers']),
      settings: JSON.stringify({ timezone: 'Africa/Johannesburg', currency: 'ZAR' }),
      updatedAt: now,
    },
    {
      id: randomUUID(),
      name: 'Consumer Wallet Demo',
      slug: 'consumer-wallet-demo',
      plan: 'enterprise',
      maxUsers: 10000,
      maxMerchants: 0,
      status: 'active',
      primaryColor: '#FF8F00',
      features: JSON.stringify(['wallet', 'qr_payments', 'transfers', 'airtime', 'bills']),
      settings: JSON.stringify({ timezone: 'Africa/Johannesburg', currency: 'ZAR' }),
      updatedAt: now,
    },
  ];

  console.log('Creating tenants...');
  for (const tenant of tenants) {
    await prisma.platformTenant.upsert({
      where: { slug: tenant.slug },
      update: tenant,
      create: tenant,
    });
    console.log(`  ✓ Tenant: ${tenant.name}`);
  }

  // Create Admin Users
  const adminUsers = [
    {
      id: randomUUID(),
      email: 'admin@groway.co.za',
      name: 'John Admin',
      role: 'super_admin',
      department: 'Engineering',
      phone: '+27821234567',
      passwordHash: '$2b$10$demo.hash.not.for.production',
      mfaEnabled: true,
      status: 'active',
      updatedAt: now,
    },
    {
      id: randomUUID(),
      email: 'support@groway.co.za',
      name: 'Sarah Support',
      role: 'support',
      department: 'Customer Success',
      phone: '+27821234568',
      passwordHash: '$2b$10$demo.hash.not.for.production',
      mfaEnabled: true,
      status: 'active',
      updatedAt: now,
    },
    {
      id: randomUUID(),
      email: 'compliance@groway.co.za',
      name: 'Mike Compliance',
      role: 'compliance',
      department: 'Compliance',
      phone: '+27821234569',
      passwordHash: '$2b$10$demo.hash.not.for.production',
      mfaEnabled: true,
      status: 'active',
      updatedAt: now,
    },
  ];

  console.log('Creating admin users...');
  for (const admin of adminUsers) {
    await prisma.adminUser.upsert({
      where: { email: admin.email },
      update: admin,
      create: admin,
    });
    console.log(`  ✓ Admin: ${admin.name} (${admin.role})`);
  }

  // Create sample Consumer Users (500 users for demo)
  console.log('Creating consumer users (500 users)...');
  const consumerUsers = [];
  const firstNames = ['Thabo', 'Lerato', 'Sipho', 'Nomsa', 'Johan', 'Pieter', 'Maria', 'David', 'Grace', 'Michael', 'Precious', 'Jacob', 'Elizabeth', 'Samuel', 'Ruth'];
  const lastNames = ['Mokoena', 'Ndlovu', 'Van der Merwe', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore'];
  const provinces = ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape'];

  for (let i = 0; i < 500; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const phone = `+27${Math.floor(Math.random() * 900000000 + 100000000)}`;
    const kycStatus = Math.random() > 0.3 ? 'verified' : (Math.random() > 0.5 ? 'pending' : 'rejected');
    const kycLevel = kycStatus === 'verified' ? Math.floor(Math.random() * 3) + 1 : 0;

    consumerUsers.push({
      id: randomUUID(),
      phone,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
      firstName,
      lastName,
      idNumber: Math.random() > 0.5 ? `${Math.floor(Math.random() * 9000000000000 + 1000000000000)}` : null,
      kycStatus,
      kycLevel,
      accountStatus: Math.random() > 0.1 ? 'active' : 'suspended',
      languagePreference: Math.random() > 0.7 ? 'zu' : (Math.random() > 0.5 ? 'af' : 'en'),
      updatedAt: now,
    });
  }

  // Batch insert consumer users
  for (const user of consumerUsers) {
    try {
      await prisma.consumerUser.create({ data: user });
    } catch {
      // Skip duplicates
    }
  }
  console.log('  ✓ Created 500 consumer users');

  // Create Tenant Users (link admins and consumers to tenants)
  console.log('Creating tenant memberships...');
  
  // Link admins to tenants
  for (const admin of adminUsers) {
    for (const tenant of tenants.slice(0, 2)) {
      await prisma.tenantUser.create({
        data: {
          id: randomUUID(),
          tenantId: tenant.id,
          userId: admin.id,
          userType: 'admin',
          role: admin.role === 'super_admin' ? 'owner' : 'admin',
          permissions: JSON.stringify(['*']),
          status: 'active',
          acceptedAt: now,
          updatedAt: now,
        },
      }).catch(() => {}); // Skip if exists
    }
  }

  // Link some consumers to tenants
  const allConsumers = await prisma.consumerUser.findMany({ take: 200 });
  const roles = ['member', 'viewer', 'cashier', 'manager'];
  
  for (const consumer of allConsumers.slice(0, 100)) {
    const tenant = tenants[Math.floor(Math.random() * tenants.length)];
    await prisma.tenantUser.create({
      data: {
        id: randomUUID(),
        tenantId: tenant.id,
        userId: consumer.id,
        userType: 'consumer',
        role: roles[Math.floor(Math.random() * roles.length)],
        status: 'active',
        acceptedAt: now,
        updatedAt: now,
      },
    }).catch(() => {}); // Skip if exists
  }
  console.log('  ✓ Created tenant memberships');

  // Create Audit Log Entries
  console.log('Creating audit log entries...');
  const actions = [
    'user_created', 'user_updated', 'user_deleted', 'user_login',
    'tenant_created', 'invitation_sent', 'invitation_accepted',
    'permission_changed', 'settings_changed'
  ];
  const categories = ['user_management', 'tenant_management', 'authentication', 'authorization', 'settings'];

  for (let i = 0; i < 100; i++) {
    const action = actions[Math.floor(Math.random() * actions.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const user = allConsumers[Math.floor(Math.random() * allConsumers.length)];
    
    await prisma.auditLogEntry.create({
      data: {
        id: randomUUID(),
        userId: user?.id,
        userType: 'consumer',
        action,
        category,
        targetType: 'user',
        targetId: user?.id,
        details: JSON.stringify({ source: 'seed', index: i }),
        createdAt: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log('  ✓ Created 100 audit log entries');

  // Create Tenant Subscriptions
  console.log('Creating subscriptions...');
  for (const tenant of tenants) {
    await prisma.tenantSubscription.create({
      data: {
        id: randomUUID(),
        tenantId: tenant.id,
        planId: tenant.plan,
        planName: tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1),
        billingCycle: 'monthly',
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        amount: tenant.plan === 'enterprise' ? 9999 : tenant.plan === 'professional' ? 4999 : 999,
        updatedAt: now,
      },
    }).catch(() => {}); // Skip if exists
  }
  console.log('  ✓ Created subscriptions');

  console.log('\n✅ User management seeding completed!');
  
  // Print summary
  const summary = {
    tenants: await prisma.platformTenant.count(),
    admins: await prisma.adminUser.count(),
    consumers: await prisma.consumerUser.count(),
    tenantUsers: await prisma.tenantUser.count(),
    auditLogs: await prisma.auditLogEntry.count(),
    subscriptions: await prisma.tenantSubscription.count(),
  };
  
  console.log('\n📊 Summary:');
  console.log(`  Tenants: ${summary.tenants}`);
  console.log(`  Admins: ${summary.admins}`);
  console.log(`  Consumers: ${summary.consumers}`);
  console.log(`  Tenant Members: ${summary.tenantUsers}`);
  console.log(`  Audit Logs: ${summary.auditLogs}`);
  console.log(`  Subscriptions: ${summary.subscriptions}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
