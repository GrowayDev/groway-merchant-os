import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

// GET /api/admin/documents - List documents with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentType = searchParams.get('documentType'); // consumer_kyc, merchant_document, credit_document
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const merchantId = searchParams.get('merchantId');
    const priority = searchParams.get('priority');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    let documents: unknown[] = [];
    let total = 0;

    // Fetch from different document tables based on type
    if (documentType === 'consumer_kyc' || !documentType) {
      const where: Record<string, unknown> = {};
      if (status) where.status = status;
      if (userId) where.userId = userId;
      if (priority) where.reviewPriority = priority;

      const [consumerDocs, consumerCount] = await Promise.all([
        db.consumerKYCDocument.findMany({
          where,
          include: {
            ConsumerUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
                kycStatus: true,
                kycLevel: true,
              }
            }
          },
          orderBy: [
            { reviewPriority: 'desc' },
            { createdAt: 'desc' },
          ],
          skip: documentType ? skip : 0,
          take: documentType ? limit : 100,
        }),
        db.consumerKYCDocument.count({ where }),
      ]);

      documents = consumerDocs.map(doc => ({
        ...doc,
        documentSource: 'consumer_kyc',
        entityName: doc.ConsumerUser ? `${doc.ConsumerUser.firstName || ''} ${doc.ConsumerUser.lastName || ''}`.trim() || doc.ConsumerUser.phone : 'Unknown',
        entityType: 'consumer',
      }));

      if (documentType === 'consumer_kyc') {
        total = consumerCount;
      }
    }

    if (documentType === 'merchant_document' || !documentType) {
      const where: Record<string, unknown> = {};
      if (status) where.status = status;
      if (merchantId) where.merchantId = merchantId;

      const [merchantDocs, merchantCount] = await Promise.all([
        db.adminMerchantDocument.findMany({
          where,
          include: {
            AdminMerchant: {
              select: {
                id: true,
                businessName: true,
                tradingName: true,
                kycStatus: true,
                kybStatus: true,
                riskScore: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: documentType ? skip : 0,
          take: documentType ? limit : 100,
        }),
        db.adminMerchantDocument.count({ where }),
      ]);

      const merchantDocsWithSource = merchantDocs.map(doc => ({
        ...doc,
        documentSource: 'merchant_document',
        entityName: doc.AdminMerchant?.businessName || doc.AdminMerchant?.tradingName || 'Unknown',
        entityType: 'merchant',
      }));

      if (!documentType) {
        documents = [...documents, ...merchantDocsWithSource];
      } else {
        documents = merchantDocsWithSource;
        total = merchantCount;
      }
    }

    // Sort combined results if fetching all
    if (!documentType) {
      documents.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const priorityOrder: Record<string, number> = { urgent: 4, high: 3, normal: 2, low: 1 };
        const aPriority = priorityOrder[(a.reviewPriority as string) || (a.status as string)] || 0;
        const bPriority = priorityOrder[(b.reviewPriority as string) || (b.status as string)] || 0;
        return bPriority - aPriority;
      });
      total = documents.length;
      documents = documents.slice(skip, skip + limit);
    }

    // Get stats
    const stats = await getDocumentStats();

    return NextResponse.json({
      documents,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// POST /api/admin/documents - Upload a new document
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const documentType = formData.get('documentType') as string;
    const documentSource = formData.get('documentSource') as string; // consumer_kyc, merchant_document
    const file = formData.get('file') as File | null;
    
    // Get metadata
    const userId = formData.get('userId') as string | null;
    const merchantId = formData.get('merchantId') as string | null;
    const documentCategory = formData.get('documentCategory') as string | null;
    const documentNumber = formData.get('documentNumber') as string | null;
    const issueDate = formData.get('issueDate') as string | null;
    const expiryDate = formData.get('expiryDate') as string | null;

    if (!documentType || !documentSource) {
      return NextResponse.json(
        { error: 'documentType and documentSource are required' },
        { status: 400 }
      );
    }

    if (!userId && !merchantId) {
      return NextResponse.json(
        { error: 'Either userId or merchantId is required' },
        { status: 400 }
      );
    }

    // In production, you would upload to S3/CloudStorage
    // For demo, we'll create a mock URL
    let fileUrl = '';
    let fileName = '';
    let fileSize: number | undefined;
    let fileType: string | undefined;

    if (file) {
      fileName = file.name;
      fileSize = file.size;
      fileType = file.type;
      // Mock URL - in production, this would be the actual S3 URL
      fileUrl = `/uploads/documents/${randomUUID()}-${file.name}`;
    } else {
      // Demo mode - create mock document
      fileName = `${documentType}_demo.pdf`;
      fileUrl = `/uploads/demo/${documentType}_${Date.now()}.pdf`;
    }

    const id = randomUUID();
    const now = new Date();

    let document;

    if (documentSource === 'consumer_kyc' && userId) {
      document = await db.consumerKYCDocument.create({
        data: {
          id,
          userId,
          documentType,
          documentCategory: documentCategory || 'identity',
          fileName,
          fileUrl,
          fileSize,
          fileType,
          status: 'pending',
          documentNumber,
          issueDate,
          expiryDate,
          updatedAt: now,
        },
        include: {
          ConsumerUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            }
          }
        }
      });

      // Update user KYC status to pending if not already
      await db.consumerUser.update({
        where: { id: userId },
        data: { kycStatus: 'pending' }
      });
    } else if (documentSource === 'merchant_document' && merchantId) {
      document = await db.adminMerchantDocument.create({
        data: {
          id,
          merchantId,
          type: documentType,
          status: 'pending',
          url: fileUrl,
          updatedAt: now,
        },
        include: {
          AdminMerchant: {
            select: {
              id: true,
              businessName: true,
            }
          }
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid document source or missing entity ID' },
        { status: 400 }
      );
    }

    // Log the upload
    await db.documentAccessLog.create({
      data: {
        id: randomUUID(),
        documentType: documentSource,
        documentId: id,
        documentName: fileName,
        accessedBy: 'admin',
        accessedByName: 'Admin User',
        accessedByRole: 'admin',
        action: 'upload',
      }
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}

async function getDocumentStats() {
  try {
    const [
      consumerPending,
      consumerVerified,
      consumerRejected,
      merchantPending,
      merchantVerified,
      merchantRejected,
    ] = await Promise.all([
      db.consumerKYCDocument.count({ where: { status: 'pending' } }),
      db.consumerKYCDocument.count({ where: { status: 'verified' } }),
      db.consumerKYCDocument.count({ where: { status: 'rejected' } }),
      db.adminMerchantDocument.count({ where: { status: 'pending' } }),
      db.adminMerchantDocument.count({ where: { status: 'verified' } }),
      db.adminMerchantDocument.count({ where: { status: 'rejected' } }),
    ]);

    return {
      consumer: {
        pending: consumerPending,
        verified: consumerVerified,
        rejected: consumerRejected,
      },
      merchant: {
        pending: merchantPending,
        verified: merchantVerified,
        rejected: merchantRejected,
      },
      totalPending: consumerPending + merchantPending,
      totalVerified: consumerVerified + merchantVerified,
      totalRejected: consumerRejected + merchantRejected,
    };
  } catch {
    return {
      consumer: { pending: 0, verified: 0, rejected: 0 },
      merchant: { pending: 0, verified: 0, rejected: 0 },
      totalPending: 0,
      totalVerified: 0,
      totalRejected: 0,
    };
  }
}
