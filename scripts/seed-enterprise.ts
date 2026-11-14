import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  const now = new Date()
  const existing = await db.enterpriseCorporateClient.count()
  if (existing > 0) {
    console.log(`Enterprise data already seeded (${existing} corporates). Skipping.`)
    return
  }

  console.log('Seeding enterprise demo data...')

  const corp1 = await db.enterpriseCorporateClient.create({
    data: {
      id: 'corp_sa_001',
      code: 'ENT-001',
      name: 'Soweto Retail Alliance',
      tier: 'Platinum',
      merchantsCount: 3,
      monthlyVolume: 2847500,
      creditLimit: 5000000,
      creditUsed: 1620000,
      status: 'active',
      contactPerson: 'Thabo Mokoena',
      contactEmail: 'thabo@sowetoretail.co.za',
      contactPhone: '+27 11 934 5521',
      city: 'Johannesburg',
      province: 'Gauteng',
      country: 'South Africa',
      registrationNumber: '2016/447821/07',
      vatNumber: '4820271831',
      updatedAt: now,
    }
  })

  const corp2 = await db.enterpriseCorporateClient.create({
    data: {
      id: 'corp_sa_002',
      code: 'ENT-002',
      name: 'KZN Traders Collective',
      tier: 'Gold',
      merchantsCount: 0,
      monthlyVolume: 1240000,
      creditLimit: 2500000,
      creditUsed: 480000,
      status: 'active',
      contactPerson: 'Naidoo Pillay',
      contactEmail: 'nadia@kzntraders.co.za',
      contactPhone: '+27 31 309 7742',
      city: 'Durban',
      province: 'KwaZulu-Natal',
      country: 'South Africa',
      registrationNumber: '2018/229104/06',
      vatNumber: '4930118227',
      updatedAt: now,
    }
  })

  const m1 = await db.enterpriseMerchant.create({
    data: {
      id: 'entm_001',
      code: 'ENTM-001',
      name: 'Mapetla SuperSpar Spaza',
      corporateId: corp1.id,
      location: 'Soweto, Gauteng',
      city: 'Johannesburg',
      province: 'Gauteng',
      status: 'active',
      vertical: 'grocery',
      monthlyRevenue: 986500,
      totalTransactions: 14210,
      openedDate: '2021-03-15',
      managerName: 'Lerato Dlamini',
      managerPhone: '+27 82 445 1190',
      updatedAt: now,
    }
  })

  const m2 = await db.enterpriseMerchant.create({
    data: {
      id: 'entm_002',
      code: 'ENTM-002',
      name: 'Khayelitsha Fresh Hub',
      corporateId: corp1.id,
      location: 'Khayelitsha, Western Cape',
      city: 'Cape Town',
      province: 'Western Cape',
      status: 'active',
      vertical: 'grocery',
      monthlyRevenue: 742300,
      totalTransactions: 11040,
      openedDate: '2022-06-01',
      managerName: 'Sipho Nkosi',
      managerPhone: '+27 83 220 8845',
      updatedAt: now,
    }
  })

  const m3 = await db.enterpriseMerchant.create({
    data: {
      id: 'entm_003',
      code: 'ENTM-003',
      name: 'Umlazi Corner Store',
      corporateId: corp2.id,
      location: 'Umlazi, KwaZulu-Natal',
      city: 'Durban',
      province: 'KwaZulu-Natal',
      status: 'active',
      vertical: 'grocery',
      monthlyRevenue: 511800,
      totalTransactions: 8320,
      openedDate: '2023-01-20',
      managerName: 'Zanele Gumede',
      managerPhone: '+27 84 671 3327',
      updatedAt: now,
    }
  })

  await db.enterpriseMerchant.update({ where: { id: corp2.id }, data: {} }).catch(() => {})
  await db.enterpriseCorporateClient.update({ where: { id: corp2.id }, data: { merchantsCount: 1 } })

  const invData = [
    { merchantId: m1.id, sku: 'MAI-25KG', name: 'Maize Meal 25kg', category: 'Staples', stock: 42, unit: 'bags', lowStock: 10, value: 92400, costPrice: 2200, sellingPrice: 2699, reorderPoint: 15, reorderQty: 50, supplier: 'Pioneer Foods' },
    { merchantId: m1.id, sku: 'OIL-2L', name: 'Cooking Oil 2L', category: 'Staples', stock: 88, unit: 'bottles', lowStock: 20, value: 39600, costPrice: 450, sellingPrice: 549, reorderPoint: 30, reorderQty: 100, supplier: 'Willards Foods' },
    { merchantId: m1.id, sku: 'SUG-10KG', name: 'Sugar 10kg', category: 'Staples', stock: 8, unit: 'packs', lowStock: 15, value: 13600, costPrice: 1700, sellingPrice: 2099, reorderPoint: 20, reorderQty: 60, supplier: 'Tongaat Hulett' },
    { merchantId: m2.id, sku: 'BRE-500G', name: 'Bread Flour 500g', category: 'Bakery', stock: 130, unit: 'packs', lowStock: 30, value: 22100, costPrice: 170, sellingPrice: 229, reorderPoint: 40, reorderQty: 150, supplier: 'Premier Milling' },
    { merchantId: m2.id, sku: 'RIC-10KG', name: 'Rice 10kg', category: 'Staples', stock: 55, unit: 'bags', lowStock: 12, value: 77000, costPrice: 1400, sellingPrice: 1799, reorderPoint: 20, reorderQty: 80, supplier: 'Tastic' },
    { merchantId: m3.id, sku: 'SAMP-5KG', name: ' Samp 5kg', category: 'Staples', stock: 34, unit: 'packs', lowStock: 10, value: 19380, costPrice: 570, sellingPrice: 749, reorderPoint: 15, reorderQty: 50, supplier: 'Grain Field Chickens' },
  ]
  for (const [i, d] of invData.entries()) {
    await db.enterpriseInventory.create({ data: { id: `enti_00${i + 1}`, ...d, updatedAt: now } })
  }

  await db.enterpriseUser.create({
    data: { id: 'entu_001', name: 'Thabo Mokoena', email: 'thabo@sowetoretail.co.za', phone: '+27 82 110 4471', role: 'Admin', corporateId: corp1.id, status: 'active', jobTitle: 'Group Operations Director', department: 'Operations', updatedAt: now }
  })
  await db.enterpriseUser.create({
    data: { id: 'entu_002', name: 'Naidoo Pillay', email: 'nadia@kzntraders.co.za', phone: '+27 83 909 1122', role: 'Manager', corporateId: corp2.id, status: 'active', jobTitle: 'Network Manager', department: 'Operations', updatedAt: now }
  })
  await db.enterpriseUser.create({
    data: { id: 'entu_003', name: 'Ayanda Khumalo', email: 'ayanda@sowetoretail.co.za', phone: '+27 84 220 9911', role: 'Viewer', corporateId: corp1.id, status: 'active', jobTitle: 'Finance Analyst', department: 'Finance', updatedAt: now }
  })

  const t1 = await db.enterpriseTransfer.create({
    data: {
      id: 'entt_001',
      code: 'TRF-0001',
      fromMerchantId: m1.id,
      toMerchantId: m2.id,
      corporateId: corp1.id,
      status: 'in_transit',
      itemsCount: 2,
      totalValue: 62000,
      requestedBy: 'Lerato Dlamini',
      approvedBy: 'Thabo Mokoena',
      estimatedArrival: '2 business days',
      updatedAt: now,
    }
  })
  await db.enterpriseTransferItem.create({
    data: { id: 'entti_001', transferId: t1.id, sku: 'SUG-10KG', name: 'Sugar 10kg', quantity: 20, unit: 'packs', unitValue: 1700, totalValue: 34000, updatedAt: now }
  })
  await db.enterpriseTransferItem.create({
    data: { id: 'entti_002', transferId: t1.id, sku: 'OIL-2L', name: 'Cooking Oil 2L', quantity: 40, unit: 'bottles', unitValue: 450, totalValue: 18000, updatedAt: now }
  })

  await db.enterpriseCustomer.create({
    data: { id: 'entc_001', code: 'ENTC-001', name: 'Nomvula Sithole', email: 'nomvula@example.co.za', phone: '+27 71 220 3344', merchantId: m1.id, totalSpent: 18420, visitCount: 64, tier: 'Gold', loyaltyPoints: 1840, firstVisit: new Date('2024-02-11'), updatedAt: now }
  })
  await db.enterpriseCustomer.create({
    data: { id: 'entc_002', code: 'ENTC-002', name: 'Jabu Mahlangu', email: 'jabu@example.co.za', phone: '+27 73 884 9012', merchantId: m1.id, totalSpent: 9260, visitCount: 31, tier: 'Silver', loyaltyPoints: 920, firstVisit: new Date('2024-05-03'), updatedAt: now }
  })

  await db.enterpriseActivity.create({
    data: { id: 'enta_001', corporateId: corp1.id, type: 'transfer', message: 'Stock transfer TRF-0001 dispatched from Mapetla to Khayelitsha', entityType: 'transfer', entityId: t1.id, userName: 'Thabo Mokoena' }
  })

  console.log('Enterprise seed complete.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
