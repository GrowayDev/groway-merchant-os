/**
 * Seed script for sample tenant data
 * Run with: bun run scripts/seed-tenants.ts
 */

import { db } from '../src/lib/db'

const SAMPLE_TENANTS = [
  {
    id: 'tenant_acme_corp',
    name: 'Acme Corporation',
    slug: 'acme-corp',
    domain: 'acme.groway.co.za',
    plan: 'enterprise',
    status: 'active',
    maxUsers: 500,
    maxMerchants: 50,
    features: JSON.stringify(['pos', 'inventory', 'accounting', 'advanced_reports', 'integrations', 'multi_location', 'api_access', 'white_label', 'priority_support']),
    settings: JSON.stringify({ theme: 'dark', timezone: 'Africa/Johannesburg' }),
  },
  {
    id: 'tenant_spar_jhb',
    name: 'SPAR Johannesburg',
    slug: 'spar-jhb',
    domain: 'spar-jhb.groway.co.za',
    plan: 'professional',
    status: 'active',
    maxUsers: 50,
    maxMerchants: 5,
    features: JSON.stringify(['pos', 'inventory', 'accounting', 'advanced_reports', 'integrations', 'multi_location']),
    settings: JSON.stringify({ theme: 'light', timezone: 'Africa/Johannesburg' }),
  },
  {
    id: 'tenant_shisa_nyama',
    name: 'Shisa Nyama Grill',
    slug: 'shisa-nyama',
    plan: 'starter',
    status: 'active',
    maxUsers: 10,
    maxMerchants: 1,
    features: JSON.stringify(['pos', 'inventory', 'basic_reports']),
    settings: JSON.stringify({ theme: 'light', timezone: 'Africa/Johannesburg' }),
  },
  {
    id: 'tenant_tech_startup',
    name: 'TechStart Solutions',
    slug: 'techstart',
    domain: 'techstart.groway.co.za',
    plan: 'professional',
    status: 'trial',
    maxUsers: 50,
    maxMerchants: 5,
    features: JSON.stringify(['pos', 'inventory', 'accounting', 'advanced_reports', 'integrations', 'multi_location']),
    settings: JSON.stringify({ theme: 'dark', timezone: 'Africa/Johannesburg' }),
  },
  {
    id: 'tenant_pharmacy_sa',
    name: 'HealthFirst Pharmacy',
    slug: 'healthfirst-pharmacy',
    plan: 'professional',
    status: 'active',
    maxUsers: 50,
    maxMerchants: 3,
    features: JSON.stringify(['pos', 'inventory', 'accounting', 'advanced_reports', 'integrations']),
    settings: JSON.stringify({ theme: 'light', timezone: 'Africa/Johannesburg' }),
  },
  {
    id: 'tenant_liquor_store',
    name: 'Top Shelf Liquors',
    slug: 'top-shelf-liquors',
    plan: 'starter',
    status: 'pending',
    maxUsers: 10,
    maxMerchants: 1,
    features: JSON.stringify(['pos', 'inventory', 'basic_reports']),
    settings: JSON.stringify({ theme: 'light', timezone: 'Africa/Johannesburg' }),
  },
  {
    id: 'tenant_fashion_boutique',
    name: 'Style Avenue Boutique',
    slug: 'style-avenue',
    plan: 'starter',
    status: 'suspended',
    maxUsers: 10,
    maxMerchants: 1,
    features: JSON.stringify(['pos', 'inventory', 'basic_reports']),
    settings: JSON.stringify({ theme: 'light', timezone: 'Africa/Johannesburg' }),
  },
  {
    id: 'tenant_hardware_city',
    name: 'Hardware City',
    slug: 'hardware-city',
    domain: 'hardwarecity.groway.co.za',
    plan: 'enterprise',
    status: 'active',
    maxUsers: 500,
    maxMerchants: 25,
    features: JSON.stringify(['pos', 'inventory', 'accounting', 'advanced_reports', 'integrations', 'multi_location', 'api_access']),
    settings: JSON.stringify({ theme: 'light', timezone: 'Africa/Johannesburg' }),
  },
]

async function seedTenants() {
  console.log('Seeding tenant data...')
  
  for (const tenant of SAMPLE_TENANTS) {
    try {
      const existing = await db.platformTenant.findUnique({
        where: { id: tenant.id },
      })
      
      if (existing) {
        console.log(`Tenant ${tenant.name} already exists, skipping...`)
        continue
      }
      
      await db.platformTenant.create({
        data: {
          ...tenant,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })
      
      console.log(`Created tenant: ${tenant.name}`)
    } catch (error) {
      console.error(`Error creating tenant ${tenant.name}:`, error)
    }
  }
  
  console.log('Done seeding tenants!')
  
  // Show summary
  const count = await db.platformTenant.count()
  console.log(`Total tenants in database: ${count}`)
  
  process.exit(0)
}

seedTenants()
