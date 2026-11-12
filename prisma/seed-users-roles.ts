import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Linking demo users to tenants and seeding roles...');
  const now = new Date();

  // Get all tenants
  const tenants = await prisma.platformTenant.findMany();
  console.log(`Found ${tenants.length} tenants`);

  // Get all users
  const consumers = await prisma.consumerUser.findMany();
  const admins = await prisma.adminUser.findMany();
  console.log(`Found ${consumers.length} consumers and ${admins.length} admins`);

  // ============================================
  // Task 1: Seed Default Roles
  // ============================================
  console.log('\n📋 Creating default roles...');

  const defaultRoles = [
    // Platform-wide roles
    {
      id: randomUUID(),
      name: 'super_admin',
      displayName: 'Super Administrator',
      description: 'Full platform access with all permissions',
      permissions: JSON.stringify(['*']),
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      name: 'platform_admin',
      displayName: 'Platform Administrator',
      description: 'Platform management without system configuration',
      permissions: JSON.stringify([
        'users.read', 'users.write', 'users.delete',
        'tenants.read', 'tenants.write',
        'merchants.read', 'merchants.write',
        'reports.read', 'reports.export',
        'audit.read',
      ]),
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      name: 'support_agent',
      displayName: 'Support Agent',
      description: 'Customer support with limited admin access',
      permissions: JSON.stringify([
        'users.read', 'users.write',
        'merchants.read',
        'tickets.read', 'tickets.write', 'tickets.resolve',
        'audit.read',
      ]),
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      name: 'compliance_officer',
      displayName: 'Compliance Officer',
      description: 'KYC/KYB verification and compliance management',
      permissions: JSON.stringify([
        'kyc.read', 'kyc.verify', 'kyc.reject',
        'kyb.read', 'kyb.verify', 'kyb.reject',
        'documents.read', 'documents.verify',
        'audit.read', 'audit.export',
        'reports.compliance',
      ]),
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
    // Tenant-level roles
    {
      id: randomUUID(),
      name: 'tenant_owner',
      displayName: 'Tenant Owner',
      description: 'Full access to tenant resources',
      permissions: JSON.stringify([
        'tenant.*',
        'users.*', 
        'merchants.*',
        'settings.*',
        'billing.*',
        'reports.*',
      ]),
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      name: 'tenant_admin',
      displayName: 'Tenant Administrator',
      description: 'Administrative access within tenant',
      permissions: JSON.stringify([
        'users.read', 'users.write', 'users.invite',
        'merchants.read', 'merchants.write',
        'settings.read', 'settings.write',
        'reports.read', 'reports.export',
      ]),
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      name: 'manager',
      displayName: 'Manager',
      description: 'Team management with reporting access',
      permissions: JSON.stringify([
        'pos.*',
        'inventory.read', 'inventory.write',
        'staff.read', 'staff.write',
        'reports.read',
        'customers.read', 'customers.write',
      ]),
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      name: 'cashier',
      displayName: 'Cashier',
      description: 'Point of sale operations',
      permissions: JSON.stringify([
        'pos.read', 'pos.write',
        'transactions.create',
        'customers.read',
        'inventory.read',
      ]),
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      name: 'staff',
      displayName: 'Staff Member',
      description: 'Basic staff access',
      permissions: JSON.stringify([
        'pos.read',
        'inventory.read',
        'profile.read', 'profile.write',
      ]),
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      name: 'viewer',
      displayName: 'Viewer',
      description: 'Read-only access',
      permissions: JSON.stringify([
        'dashboard.read',
        'reports.read',
        'inventory.read',
      ]),
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const role of defaultRoles) {
    try {
      await prisma.userRole.upsert({
        where: { name: role.name },
        update: role,
        create: role,
      });
      console.log(`  ✓ Role: ${role.displayName}`);
    } catch (error) {
      console.log(`  ⚠ Role exists: ${role.displayName}`);
    }
  }

  // ============================================
  // Task 2: Link Admin Users to Tenants
  // ============================================
  console.log('\n👥 Linking admin users to tenants...');

  const adminRoles = await prisma.userRole.findMany();
  const superAdminRole = adminRoles.find(r => r.name === 'super_admin');
  const platformAdminRole = adminRoles.find(r => r.name === 'platform_admin');
  const supportRole = adminRoles.find(r => r.name === 'support_agent');
  const complianceRole = adminRoles.find(r => r.name === 'compliance_officer');

  for (const admin of admins) {
    // Determine role based on admin role
    let role = platformAdminRole;
    if (admin.role === 'super_admin') role = superAdminRole;
    else if (admin.role === 'support') role = supportRole;
    else if (admin.role === 'compliance') role = complianceRole;

    // Link to all tenants
    for (const tenant of tenants) {
      const existing = await prisma.tenantUser.findFirst({
        where: { tenantId: tenant.id, userId: admin.id },
      });

      if (!existing) {
        await prisma.tenantUser.create({
          data: {
            id: randomUUID(),
            tenantId: tenant.id,
            userId: admin.id,
            userType: 'admin',
            role: admin.role === 'super_admin' ? 'owner' : 'admin',
            roleId: role?.id,
            permissions: role?.permissions,
            status: 'active',
            acceptedAt: now,
            updatedAt: now,
          },
        });
        console.log(`  ✓ Linked ${admin.name} to ${tenant.name}`);
      }
    }
  }

  // ============================================
  // Task 3: Link Consumer Users to Tenants
  // ============================================
  console.log('\n👥 Distributing consumers across tenants...');

  const tenantOwnerRole = adminRoles.find(r => r.name === 'tenant_owner');
  const managerRole = adminRoles.find(r => r.name === 'manager');
  const cashierRole = adminRoles.find(r => r.name === 'cashier');
  const staffRole = adminRoles.find(r => r.name === 'staff');
  const viewerRole = adminRoles.find(r => r.name === 'viewer');

  const roleWeights = [
    { role: 'owner', roleId: tenantOwnerRole?.id, weight: 0.01 },
    { role: 'manager', roleId: managerRole?.id, weight: 0.05 },
    { role: 'cashier', roleId: cashierRole?.id, weight: 0.20 },
    { role: 'staff', roleId: staffRole?.id, weight: 0.50 },
    { role: 'viewer', roleId: viewerRole?.id, weight: 0.24 },
  ];

  // Get existing tenant users to avoid duplicates
  const existingTenantUsers = await prisma.tenantUser.findMany({
    select: { tenantId: true, userId: true },
  });
  const existingSet = new Set(
    existingTenantUsers.map(tu => `${tu.tenantId}-${tu.userId}`)
  );

  let linkedCount = 0;
  const batchSize = 50;

  for (let i = 0; i < consumers.length; i++) {
    const consumer = consumers[i];
    
    // Skip if already linked
    const hasExisting = tenants.some(t => 
      existingSet.has(`${t.id}-${consumer.id}`)
    );
    if (hasExisting) continue;

    // Assign to 1-2 random tenants
    const numTenants = Math.random() > 0.7 ? 2 : 1;
    const selectedTenants = [...tenants]
      .sort(() => Math.random() - 0.5)
      .slice(0, numTenants);

    for (const tenant of selectedTenants) {
      // Skip if already linked to this tenant
      if (existingSet.has(`${tenant.id}-${consumer.id}`)) continue;

      // Determine role based on weights
      const rand = Math.random();
      let cumulativeWeight = 0;
      let selectedRole = roleWeights[roleWeights.length - 1];
      
      for (const rw of roleWeights) {
        cumulativeWeight += rw.weight;
        if (rand <= cumulativeWeight) {
          selectedRole = rw;
          break;
        }
      }

      await prisma.tenantUser.create({
        data: {
          id: randomUUID(),
          tenantId: tenant.id,
          userId: consumer.id,
          userType: 'consumer',
          role: selectedRole.role,
          roleId: selectedRole.roleId,
          status: consumer.accountStatus === 'active' ? 'active' : 'suspended',
          acceptedAt: now,
          lastActiveAt: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          updatedAt: now,
        },
      });

      existingSet.add(`${tenant.id}-${consumer.id}`);
      linkedCount++;
    }

    // Log progress
    if ((i + 1) % batchSize === 0) {
      console.log(`  Processed ${i + 1}/${consumers.length} consumers, linked ${linkedCount}...`);
    }
  }

  console.log(`  ✓ Linked ${linkedCount} consumer-tenant relationships`);

  // ============================================
  // Task 4: Create sample invitations
  // ============================================
  console.log('\n📧 Creating sample invitations...');

  const invitationRoles = ['manager', 'cashier', 'staff', 'viewer'];
  const invitationCount = 20;

  for (let i = 0; i < invitationCount; i++) {
    const tenant = tenants[Math.floor(Math.random() * tenants.length)];
    const role = invitationRoles[Math.floor(Math.random() * invitationRoles.length)];
    const email = `invited.user.${i + 1}@example.com`;

    try {
      await prisma.tenantInvitation.create({
        data: {
          id: randomUUID(),
          tenantId: tenant.id,
          email,
          role,
          permissions: null,
          invitedBy: admins[0]?.id,
          status: Math.random() > 0.3 ? 'pending' : 'accepted',
          expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          createdAt: now,
          updatedAt: now,
        },
      });
    } catch {
      // Skip duplicates
    }
  }
  console.log(`  ✓ Created ${invitationCount} sample invitations`);

  // ============================================
  // Summary
  // ============================================
  console.log('\n✅ Linking complete!\n');

  const summary = {
    tenants: await prisma.platformTenant.count(),
    admins: await prisma.adminUser.count(),
    consumers: await prisma.consumerUser.count(),
    tenantUsers: await prisma.tenantUser.count(),
    roles: await prisma.userRole.count(),
    invitations: await prisma.tenantInvitation.count(),
  };

  console.log('📊 Summary:');
  console.log(`  Tenants: ${summary.tenants}`);
  console.log(`  Admin Users: ${summary.admins}`);
  console.log(`  Consumer Users: ${summary.consumers}`);
  console.log(`  Tenant Memberships: ${summary.tenantUsers}`);
  console.log(`  Roles: ${summary.roles}`);
  console.log(`  Pending Invitations: ${summary.invitations}`);

  // Show distribution per tenant
  console.log('\n📈 Users per Tenant:');
  for (const tenant of tenants) {
    const count = await prisma.tenantUser.count({
      where: { tenantId: tenant.id },
    });
    console.log(`  ${tenant.name}: ${count} users`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
