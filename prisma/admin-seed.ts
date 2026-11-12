import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding admin console data...')

  // Create admin users
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const superAdmin = await prisma.adminUser.upsert({
    where: { email: 'admin@groway.co.za' },
    update: {},
    create: {
      email: 'admin@groway.co.za',
      name: 'Super Admin',
      role: 'super_admin',
      department: 'Operations',
      phone: '+27 82 123 4567',
      passwordHash: hashedPassword,
      mfaEnabled: true,
      status: 'active'
    }
  })

  const complianceOfficer = await prisma.adminUser.upsert({
    where: { email: 'sarah@groway.co.za' },
    update: {},
    create: {
      email: 'sarah@groway.co.za',
      name: 'Sarah M.',
      role: 'compliance',
      department: 'Compliance',
      phone: '+27 83 234 5678',
      passwordHash: hashedPassword,
      mfaEnabled: true,
      status: 'active'
    }
  })

  const supportAgent = await prisma.adminUser.upsert({
    where: { email: 'john@groway.co.za' },
    update: {},
    create: {
      email: 'john@groway.co.za',
      name: 'John D.',
      role: 'support',
      department: 'Support',
      phone: '+27 84 345 6789',
      passwordHash: hashedPassword,
      mfaEnabled: true,
      status: 'active'
    }
  })

  console.log('Created admin users:', { superAdmin, complianceOfficer, supportAgent })

  // Create sample merchants
  const merchants = await Promise.all([
    prisma.adminMerchant.create({
      data: {
        businessName: 'Cape Town Coffee Co (Pty) Ltd',
        tradingName: 'Cape Town Coffee Co',
        registrationNumber: '2023/123456/07',
        vatNumber: '4123456789',
        tier: 'growth',
        status: 'active',
        vertical: 'Food & Beverage',
        subVertical: 'Coffee Shop',
        contactName: 'Thabo Molefe',
        contactEmail: 'thabo@capetowncoffee.co.za',
        contactPhone: '+27 82 123 4567',
        addressStreet: '123 Long Street',
        addressCity: 'Cape Town',
        addressProvince: 'Western Cape',
        addressPostalCode: '8001',
        kycStatus: 'verified',
        kybStatus: 'verified',
        riskScore: 15,
        monthlyVolume: 485000,
        totalTransactions: 12450,
        joinedDate: new Date('2024-06-15')
      }
    }),
    prisma.adminMerchant.create({
      data: {
        businessName: 'Sandton Electronics CC',
        tradingName: 'TechHub Sandton',
        registrationNumber: '2022/987654/23',
        vatNumber: '4987654321',
        tier: 'enterprise',
        status: 'active',
        vertical: 'Electronics & Tech',
        subVertical: 'Electronics Retail',
        contactName: 'Priya Naidoo',
        contactEmail: 'priya@techhub.co.za',
        contactPhone: '+27 83 987 6543',
        addressStreet: '45 Sandton Drive',
        addressCity: 'Sandton',
        addressProvince: 'Gauteng',
        addressPostalCode: '2196',
        kycStatus: 'verified',
        kybStatus: 'verified',
        riskScore: 22,
        monthlyVolume: 1250000,
        totalTransactions: 8900,
        joinedDate: new Date('2024-03-20')
      }
    }),
    prisma.adminMerchant.create({
      data: {
        businessName: 'Soweto Spaza Shop',
        tradingName: 'Soweto Spaza',
        registrationNumber: '',
        vatNumber: '',
        tier: 'starter',
        status: 'kyc_pending',
        vertical: 'Grocery & FMCG',
        subVertical: 'Spaza Shop',
        contactName: 'Johannes Khumalo',
        contactEmail: 'johannes@gmail.com',
        contactPhone: '+27 76 543 2109',
        addressStreet: '789 Vilakazi Street',
        addressCity: 'Soweto',
        addressProvince: 'Gauteng',
        addressPostalCode: '1804',
        kycStatus: 'pending',
        kybStatus: 'pending',
        riskScore: 35,
        monthlyVolume: 45000,
        totalTransactions: 2100,
        joinedDate: new Date('2025-01-10')
      }
    }),
    prisma.adminMerchant.create({
      data: {
        businessName: 'Durban Fresh Market',
        tradingName: 'Durban Fresh',
        registrationNumber: '2024/555123/07',
        vatNumber: '',
        tier: 'growth',
        status: 'suspended',
        vertical: 'Grocery & FMCG',
        subVertical: 'Farm Stall',
        contactName: 'Nisha Pillay',
        contactEmail: 'nisha@durbanfresh.co.za',
        contactPhone: '+27 84 111 2222',
        addressStreet: '12 Victoria Embankment',
        addressCity: 'Durban',
        addressProvince: 'KwaZulu-Natal',
        addressPostalCode: '4001',
        kycStatus: 'verified',
        kybStatus: 'verified',
        riskScore: 68,
        monthlyVolume: 0,
        totalTransactions: 3400,
        joinedDate: new Date('2024-08-05')
      }
    }),
    prisma.adminMerchant.create({
      data: {
        businessName: 'Pretoria Pharmacy (Pty) Ltd',
        tradingName: 'Pretoria Med Pharmacy',
        registrationNumber: '2021/777888/07',
        vatNumber: '4777888999',
        tier: 'enterprise',
        status: 'active',
        vertical: 'Health & Pharmacy',
        subVertical: 'Full Pharmacy',
        contactName: 'Dr. Ahmed Hassan',
        contactEmail: 'ahmed@pretoriamed.co.za',
        contactPhone: '+27 12 345 6789',
        addressStreet: '321 Church Street',
        addressCity: 'Pretoria',
        addressProvince: 'Gauteng',
        addressPostalCode: '0001',
        kycStatus: 'verified',
        kybStatus: 'verified',
        riskScore: 12,
        monthlyVolume: 890000,
        totalTransactions: 15600,
        joinedDate: new Date('2023-11-20')
      }
    }),
    prisma.adminMerchant.create({
      data: {
        businessName: 'New Restaurant Application',
        tradingName: 'TBD',
        registrationNumber: '',
        vatNumber: '',
        tier: 'starter',
        status: 'pending',
        vertical: 'Food & Beverage',
        subVertical: 'Restaurant',
        contactName: 'Michael Chen',
        contactEmail: 'michael.chen@gmail.com',
        contactPhone: '+27 79 888 7777',
        addressStreet: 'Unknown',
        addressCity: 'Johannesburg',
        addressProvince: 'Gauteng',
        addressPostalCode: '2000',
        kycStatus: 'pending',
        kybStatus: 'pending',
        riskScore: 50,
        monthlyVolume: 0,
        totalTransactions: 0,
        joinedDate: new Date('2025-03-08')
      }
    })
  ])

  console.log(`Created ${merchants.length} merchants`)

  // Create fraud alerts
  const fraudAlerts = await Promise.all([
    prisma.fraudAlert.create({
      data: {
        type: 'velocity',
        severity: 'critical',
        status: 'new',
        merchantId: merchants[0].id,
        merchantName: merchants[0].tradingName || merchants[0].businessName,
        transactionId: 'TXN-998877',
        amount: 250000,
        description: 'Multiple high-value transactions within 10 minutes',
        riskScore: 92,
        rule: 'High Velocity Rule',
        details: JSON.stringify({
          device: 'Gropay P8D',
          location: 'Sandton City Mall',
          previousTransactions: 5,
          timeDiff: '8 minutes'
        })
      }
    }),
    prisma.fraudAlert.create({
      data: {
        type: 'location',
        severity: 'high',
        status: 'investigating',
        merchantId: merchants[1].id,
        merchantName: merchants[1].tradingName || merchants[1].businessName,
        transactionId: 'TXN-887766',
        amount: 85000,
        description: 'Transaction from unexpected location',
        riskScore: 78,
        rule: 'Geolocation Anomaly',
        assignedTo: 'John D.',
        details: JSON.stringify({
          device: 'Mobile App',
          location: 'Lagos, Nigeria',
          ipAddress: '41.xxx.xxx.xxx',
          previousTransactions: 12
        })
      }
    }),
    prisma.fraudAlert.create({
      data: {
        type: 'amount',
        severity: 'high',
        status: 'new',
        merchantId: merchants[4].id,
        merchantName: merchants[4].tradingName || merchants[4].businessName,
        transactionId: 'TXN-776655',
        amount: 475000,
        description: 'Transaction amount exceeds normal pattern',
        riskScore: 85,
        rule: 'High Value Alert',
        details: JSON.stringify({
          device: 'Gropay A11',
          location: 'Melrose Arch',
          previousTransactions: 23,
          timeDiff: '2 hours'
        })
      }
    })
  ])

  console.log(`Created ${fraudAlerts.length} fraud alerts`)

  // Create monitoring rules
  const rules = await Promise.all([
    prisma.monitoringRule.create({
      data: {
        name: 'Velocity Check',
        type: 'velocity',
        status: 'active',
        threshold: '>5 txns/10min',
        action: 'alert',
        priority: 1,
        triggers24h: 1240
      }
    }),
    prisma.monitoringRule.create({
      data: {
        name: 'Geolocation Anomaly',
        type: 'location',
        status: 'active',
        threshold: '>500km from usual',
        action: 'review',
        priority: 2,
        triggers24h: 340
      }
    }),
    prisma.monitoringRule.create({
      data: {
        name: 'High Value Alert',
        type: 'amount',
        status: 'active',
        threshold: '>R100,000',
        action: 'alert',
        priority: 1,
        triggers24h: 89
      }
    }),
    prisma.monitoringRule.create({
      data: {
        name: 'New Device Detection',
        type: 'device',
        status: 'active',
        threshold: 'First transaction',
        action: 'alert',
        priority: 3,
        triggers24h: 520
      }
    }),
    prisma.monitoringRule.create({
      data: {
        name: 'Behavior Pattern',
        type: 'behavior',
        status: 'active',
        threshold: 'AI-detected anomaly',
        action: 'alert',
        priority: 2,
        triggers24h: 156
      }
    }),
    prisma.monitoringRule.create({
      data: {
        name: 'Night Transaction Block',
        type: 'pattern',
        status: 'paused',
        threshold: '00:00-05:00 >R10,000',
        action: 'block',
        priority: 1,
        triggers24h: 0
      }
    })
  ])

  console.log(`Created ${rules.length} monitoring rules`)

  // Create support tickets
  const tickets = await Promise.all([
    prisma.supportTicket.create({
      data: {
        subject: 'Payment not reflecting in wallet',
        merchantId: merchants[0].id,
        merchantName: merchants[0].tradingName || merchants[0].businessName,
        category: 'technical',
        status: 'open',
        priority: 'high',
        assignee: 'Sarah M.',
        messages: JSON.stringify([
          { id: 'm1', author: 'merchant', content: 'A customer paid R2,500 via QR but the amount is not showing in my wallet. Transaction ID: TXN-998877.', timestamp: '2025-03-10T14:30:00', isInternal: false },
          { id: 'm2', author: 'Sarah M.', content: 'Thank you for reporting this. I am investigating the transaction now.', timestamp: '2025-03-10T14:45:00', isInternal: false }
        ])
      }
    }),
    prisma.supportTicket.create({
      data: {
        subject: 'Request for transaction history export',
        merchantId: merchants[1].id,
        merchantName: merchants[1].tradingName || merchants[1].businessName,
        category: 'account',
        status: 'in_progress',
        priority: 'medium',
        assignee: 'John D.',
        messages: JSON.stringify([
          { id: 'm1', author: 'merchant', content: 'I need a full transaction history export for the past 6 months for audit purposes.', timestamp: '2025-03-10T12:00:00', isInternal: false },
          { id: 'm2', author: 'John D.', content: 'I will generate this export for you. It should be ready within 24 hours.', timestamp: '2025-03-10T13:30:00', isInternal: false }
        ])
      }
    }),
    prisma.supportTicket.create({
      data: {
        subject: 'Settlement delay inquiry',
        merchantId: merchants[3].id,
        merchantName: merchants[3].tradingName || merchants[3].businessName,
        category: 'billing',
        status: 'waiting',
        priority: 'urgent',
        assignee: 'Thabo K.',
        messages: JSON.stringify([
          { id: 'm1', author: 'merchant', content: 'My T+1 settlement has not been received. Expected R85,000 on March 9th.', timestamp: '2025-03-09T16:00:00', isInternal: false },
          { id: 'm2', author: 'Thabo K.', content: 'I am checking with the settlement team. There appears to be a batch processing delay.', timestamp: '2025-03-09T17:00:00', isInternal: false },
          { id: 'm3', author: 'Thabo K.', content: '[INTERNAL] Merchant has high risk score. Checking if settlement was held for review.', timestamp: '2025-03-10T10:00:00', isInternal: true }
        ])
      }
    })
  ])

  console.log(`Created ${tickets.length} support tickets`)

  // Create AML alerts
  const amlAlerts = await Promise.all([
    prisma.amlAlert.create({
      data: {
        type: 'sanctions',
        entityName: 'International Traders SA',
        entityType: 'organization',
        triggeredAt: new Date().toISOString(),
        severity: 'critical',
        status: 'new',
        matchScore: 95,
        details: 'Potential match with EU sanctions list - Company Directors'
      }
    }),
    prisma.amlAlert.create({
      data: {
        type: 'pep',
        entityName: 'Mohammed Al-Farsi',
        entityType: 'individual',
        triggeredAt: new Date(Date.now() - 86400000).toISOString(),
        severity: 'high',
        status: 'investigating',
        matchScore: 78,
        details: 'Potential Politically Exposed Person match - Foreign Government Official'
      }
    })
  ])

  console.log(`Created ${amlAlerts.length} AML alerts`)

  // Create POPIA requests
  const popiaRequests = await Promise.all([
    prisma.popiaRequest.create({
      data: {
        type: 'access',
        requesterName: 'Jane Smith',
        requesterEmail: 'jane.smith@email.com',
        submittedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        status: 'pending',
        dueDate: new Date(Date.now() + 25 * 86400000).toISOString()
      }
    }),
    prisma.popiaRequest.create({
      data: {
        type: 'deletion',
        requesterName: 'Michael Brown',
        requesterEmail: 'm.brown@email.com',
        submittedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        status: 'processing',
        dueDate: new Date(Date.now() + 23 * 86400000).toISOString()
      }
    })
  ])

  console.log(`Created ${popiaRequests.length} POPIA requests`)

  // Create audit logs
  const auditLogs = await Promise.all([
    prisma.auditLog.create({
      data: {
        action: 'Merchant Approved',
        category: 'merchant',
        actorId: complianceOfficer.id,
        actorName: complianceOfficer.name,
        targetType: 'Merchant',
        targetId: merchants[0].id,
        targetName: merchants[0].businessName,
        details: 'KYC verification completed and merchant account approved',
        ipAddress: '41.xxx.xxx.xxx',
        userAgent: 'Chrome/122.0 Windows'
      }
    }),
    prisma.auditLog.create({
      data: {
        action: 'Transaction Refunded',
        category: 'transaction',
        actorId: supportAgent.id,
        actorName: supportAgent.name,
        targetType: 'Transaction',
        targetId: 'TXN-998877',
        targetName: 'R2,500 QR Payment',
        details: 'Full refund processed - customer complaint resolved',
        ipAddress: '105.xxx.xxx.xxx',
        userAgent: 'Firefox/123.0 MacOS'
      }
    }),
    prisma.auditLog.create({
      data: {
        action: 'Fraud Alert Resolved',
        category: 'compliance',
        actorId: supportAgent.id,
        actorName: supportAgent.name,
        targetType: 'Alert',
        targetId: 'FA-002',
        targetName: 'Geolocation Anomaly',
        details: 'Verified with merchant - legitimate travel transaction',
        ipAddress: '105.xxx.xxx.xxx',
        userAgent: 'Firefox/123.0 MacOS'
      }
    }),
    prisma.auditLog.create({
      data: {
        action: 'User Login',
        category: 'user',
        actorId: superAdmin.id,
        actorName: superAdmin.name,
        targetType: 'Session',
        targetId: 'SES-1234',
        targetName: 'Admin Console',
        details: 'Successful MFA authentication',
        ipAddress: '169.xxx.xxx.xxx',
        userAgent: 'Safari/17.3 iPhone'
      }
    }),
    prisma.auditLog.create({
      data: {
        action: 'System Configuration Changed',
        category: 'system',
        actorName: 'System Admin',
        targetType: 'Setting',
        targetId: 'CFG-RATE-LIMIT',
        targetName: 'Rate Limiting Rules',
        details: 'Updated velocity check threshold from 5 to 7 transactions per 10 minutes',
        ipAddress: '10.0.0.1',
        userAgent: 'Internal Service'
      }
    })
  ])

  console.log(`Created ${auditLogs.length} audit logs`)

  // Create platform stats
  const stats = await Promise.all([
    prisma.platformStat.create({
      data: {
        key: 'active_merchants',
        value: '14847',
        previousValue: '14720',
        changePercent: 0.86
      }
    }),
    prisma.platformStat.create({
      data: {
        key: 'transactions_today',
        value: '847234',
        previousValue: '753892',
        changePercent: 12.4
      }
    }),
    prisma.platformStat.create({
      data: {
        key: 'transaction_volume',
        value: '47200000',
        previousValue: '43400000',
        changePercent: 8.7
      }
    }),
    prisma.platformStat.create({
      data: {
        key: 'system_uptime',
        value: '99.98',
        previousValue: '99.96',
        changePercent: 0.02
      }
    })
  ])

  console.log(`Created ${stats.length} platform stats`)

  console.log('✅ Admin console seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
