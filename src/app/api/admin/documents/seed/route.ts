import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

// POST /api/admin/documents/seed - Seed demo documents for testing
export async function POST(request: NextRequest) {
  try {
    const now = new Date();
    const seededDocuments = [];

    // Create demo consumer users with documents
    const demoConsumers = [
      {
        id: 'demo-consumer-kyc-001',
        phone: '+27821234567',
        firstName: 'Thabo',
        lastName: 'Mokoena',
        email: 'thabo.mokoena@email.com',
        idNumber: '8501015800081',
        dateOfBirth: '1985-01-01',
        kycStatus: 'pending',
        documents: [
          { type: 'sa_id', status: 'pending', priority: 'high' },
          { type: 'proof_of_address', status: 'pending', priority: 'normal' },
        ]
      },
      {
        id: 'demo-consumer-kyc-002',
        phone: '+278323456789',
        firstName: 'Lerato',
        lastName: 'Dlamini',
        email: 'lerato.dlamini@email.com',
        idNumber: '9203150456082',
        dateOfBirth: '1992-03-15',
        kycStatus: 'under_review',
        documents: [
          { type: 'sa_id', status: 'verified', priority: 'normal' },
          { type: 'proof_of_address', status: 'pending', priority: 'high' },
          { type: 'selfie', status: 'pending', priority: 'normal' },
        ]
      },
      {
        id: 'demo-consumer-kyc-003',
        phone: '+278434567890',
        firstName: 'Johan',
        lastName: 'van der Berg',
        email: 'johan.vdb@email.com',
        idNumber: '8806205432098',
        dateOfBirth: '1988-06-20',
        kycStatus: 'pending',
        documents: [
          { type: 'passport', status: 'rejected', priority: 'urgent', rejectionReason: 'Document expired - passport expired on 2023-12-01' },
          { type: 'proof_of_address', status: 'pending', priority: 'normal' },
        ]
      },
      {
        id: 'demo-consumer-kyc-004',
        phone: '+278545678901',
        firstName: 'Priya',
        lastName: 'Naidoo',
        email: 'priya.naidoo@email.com',
        idNumber: '9508120287091',
        dateOfBirth: '1995-08-12',
        kycStatus: 'pending',
        documents: [
          { type: 'sa_id', status: 'pending', priority: 'urgent' },
          { type: 'bank_statement', status: 'pending', priority: 'normal' },
        ]
      },
    ];

    // Create demo merchants with documents
    const demoMerchants = [
      {
        id: 'demo-merchant-kyc-001',
        businessName: 'Soweto Spaza Shop',
        tradingName: 'Soweto Supermarket',
        registrationNumber: '2023/123456/07',
        vatNumber: '4123456789',
        kycStatus: 'pending',
        kybStatus: 'pending',
        documents: [
          { type: 'CIPC Registration', status: 'pending' },
          { type: 'Proof of Business Address', status: 'pending' },
          { type: 'Director ID', status: 'pending' },
        ]
      },
      {
        id: 'demo-merchant-kyc-002',
        businessName: 'Cape Town Coffee Co',
        tradingName: 'CT Coffee Roasters',
        registrationNumber: '2022/654321/07',
        vatNumber: '4987654321',
        kycStatus: 'in_review',
        kybStatus: 'in_review',
        documents: [
          { type: 'CIPC Registration', status: 'verified' },
          { type: 'Proof of Business Address', status: 'pending' },
          { type: 'Director ID', status: 'verified' },
          { type: 'Bank Statement', status: 'under_review' },
        ]
      },
    ];

    // Create consumers and their documents
    for (const consumer of demoConsumers) {
      // Check if consumer exists
      let existingConsumer = await db.consumerUser.findUnique({
        where: { id: consumer.id }
      });

      if (!existingConsumer) {
        existingConsumer = await db.consumerUser.create({
          data: {
            id: consumer.id,
            phone: consumer.phone,
            firstName: consumer.firstName,
            lastName: consumer.lastName,
            email: consumer.email,
            idNumber: consumer.idNumber,
            idType: 'sa_id',
            dateOfBirth: consumer.dateOfBirth,
            kycStatus: consumer.kycStatus,
            kycLevel: 0,
            accountStatus: 'active',
            updatedAt: now,
          }
        });
      }

      // Create documents
      for (const doc of consumer.documents) {
        const docId = `doc-${consumer.id}-${doc.type}`;
        
        // Check if document exists
        const existingDoc = await db.consumerKYCDocument.findUnique({
          where: { id: docId }
        });

        if (!existingDoc) {
          const document = await db.consumerKYCDocument.create({
            data: {
              id: docId,
              userId: consumer.id,
              documentType: doc.type,
              documentCategory: doc.type === 'sa_id' || doc.type === 'passport' ? 'identity' : 
                               doc.type === 'proof_of_address' ? 'address' : 
                               doc.type === 'selfie' ? 'biometric' : 'financial',
              fileName: `${doc.type}_${consumer.firstName.toLowerCase()}_${consumer.lastName.toLowerCase()}.pdf`,
              fileUrl: `/uploads/demo/${consumer.id}/${doc.type}.pdf`,
              fileSize: Math.floor(Math.random() * 2000000) + 500000,
              fileType: 'application/pdf',
              status: doc.status,
              reviewPriority: doc.priority,
              documentNumber: doc.type === 'sa_id' ? consumer.idNumber : undefined,
              rejectionReason: doc.rejectionReason,
              updatedAt: now,
            }
          });
          seededDocuments.push({ ...document, entityName: `${consumer.firstName} ${consumer.lastName}` });
        }
      }
    }

    // Create merchants and their documents
    for (const merchant of demoMerchants) {
      // Check if merchant exists
      let existingMerchant = await db.adminMerchant.findUnique({
        where: { id: merchant.id }
      });

      if (!existingMerchant) {
        existingMerchant = await db.adminMerchant.create({
          data: {
            id: merchant.id,
            businessName: merchant.businessName,
            tradingName: merchant.tradingName,
            registrationNumber: merchant.registrationNumber,
            vatNumber: merchant.vatNumber,
            kycStatus: merchant.kycStatus,
            kybStatus: merchant.kybStatus,
            tier: 'starter',
            status: 'pending',
            riskScore: 50,
            updatedAt: now,
          }
        });
      }

      // Create documents
      for (const doc of merchant.documents) {
        const docId = `doc-merchant-${merchant.id}-${doc.type.replace(/\s+/g, '-').toLowerCase()}`;
        
        const existingDoc = await db.adminMerchantDocument.findUnique({
          where: { id: docId }
        });

        if (!existingDoc) {
          const document = await db.adminMerchantDocument.create({
            data: {
              id: docId,
              merchantId: merchant.id,
              type: doc.type,
              status: doc.status,
              url: `/uploads/demo/${merchant.id}/${doc.type.replace(/\s+/g, '-')}.pdf`,
              updatedAt: now,
            }
          });
          seededDocuments.push({ ...document, documentSource: 'merchant_document', entityName: merchant.businessName });
        }
      }
    }

    // Create some POPIA requests
    const popiaRequests = [
      {
        id: 'popia-001',
        requestType: 'access',
        requesterName: 'Jane Smith',
        requesterEmail: 'jane.smith@email.com',
        requesterPhone: '+27821234500',
        description: 'Requesting access to all personal data held by Groways',
        status: 'pending',
        dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
      },
      {
        id: 'popia-002',
        requestType: 'deletion',
        requesterName: 'Michael Brown',
        requesterEmail: 'm.brown@email.com',
        requesterPhone: '+27832345600',
        description: 'Requesting deletion of all my personal data',
        status: 'processing',
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      },
      {
        id: 'popia-003',
        requestType: 'correction',
        requesterName: 'Sarah Johnson',
        requesterEmail: 's.johnson@email.com',
        requesterPhone: '+27843456700',
        description: 'Requesting correction of my email address and phone number',
        status: 'completed',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      },
    ];

    for (const req of popiaRequests) {
      const existing = await db.pOPIARequest.findUnique({ where: { id: req.id } });
      if (!existing) {
        await db.pOPIARequest.create({ data: req });
      }
    }

    // Create some AML alerts
    const amlAlerts = [
      {
        id: 'aml-001',
        type: 'sanctions',
        entityName: 'International Traders SA',
        entityType: 'organization',
        triggeredAt: new Date().toISOString(),
        severity: 'critical',
        status: 'new',
        matchScore: 95,
        details: 'Potential match with EU sanctions list - Company Directors',
      },
      {
        id: 'aml-002',
        type: 'pep',
        entityName: 'Mohammed Al-Farsi',
        entityType: 'individual',
        triggeredAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        severity: 'high',
        status: 'investigating',
        matchScore: 78,
        details: 'Potential Politically Exposed Person match - Foreign Government Official',
      },
    ];

    for (const alert of amlAlerts) {
      const existing = await db.amlAlert.findUnique({ where: { id: alert.id } });
      if (!existing) {
        await db.amlAlert.create({ data: alert });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Demo documents seeded successfully',
      count: seededDocuments.length,
      documents: seededDocuments,
    });
  } catch (error) {
    console.error('Error seeding demo documents:', error);
    return NextResponse.json(
      { error: 'Failed to seed demo documents', details: String(error) },
      { status: 500 }
    );
  }
}
