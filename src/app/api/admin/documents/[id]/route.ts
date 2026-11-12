import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

// GET /api/admin/documents/[id] - Get document details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const documentSource = searchParams.get('documentSource'); // consumer_kyc, merchant_document

    let document = null;

    // Try to find in consumer KYC documents
    if (documentSource === 'consumer_kyc' || !documentSource) {
      document = await db.consumerKYCDocument.findUnique({
        where: { id },
        include: {
          ConsumerUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
              idNumber: true,
              dateOfBirth: true,
              kycStatus: true,
              kycLevel: true,
              kycVerifiedAt: true,
              accountStatus: true,
              createdAt: true,
            }
          }
        }
      });

      if (document) {
        document = {
          ...document,
          documentSource: 'consumer_kyc',
        };
      }
    }

    // Try to find in merchant documents
    if (!document && (documentSource === 'merchant_document' || !documentSource)) {
      document = await db.adminMerchantDocument.findUnique({
        where: { id },
        include: {
          AdminMerchant: {
            select: {
              id: true,
              businessName: true,
              tradingName: true,
              registrationNumber: true,
              vatNumber: true,
              kycStatus: true,
              kybStatus: true,
              riskScore: true,
              contactName: true,
              contactEmail: true,
              contactPhone: true,
              addressStreet: true,
              addressCity: true,
              addressProvince: true,
              addressPostalCode: true,
              tier: true,
              status: true,
              joinedDate: true,
            }
          }
        }
      });

      if (document) {
        document = {
          ...document,
          documentSource: 'merchant_document',
          fileName: document.type,
          fileUrl: document.url,
        };
      }
    }

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Get access logs for this document
    const accessLogs = await db.documentAccessLog.findMany({
      where: {
        documentType: document.documentSource,
        documentId: id,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Log the view action
    await db.documentAccessLog.create({
      data: {
        id: randomUUID(),
        documentType: document.documentSource,
        documentId: id,
        documentName: document.fileName,
        accessedBy: 'admin',
        accessedByName: 'Admin User',
        accessedByRole: 'admin',
        action: 'view',
      }
    });

    return NextResponse.json({
      document,
      accessLogs,
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/documents/[id] - Verify or reject document
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, documentSource, verifiedBy, verifiedByName, notes, rejectionReason, extractedData } = body;

    if (!action || !documentSource) {
      return NextResponse.json(
        { error: 'action and documentSource are required' },
        { status: 400 }
      );
    }

    const now = new Date();
    let document;

    if (documentSource === 'consumer_kyc') {
      if (action === 'verify') {
        document = await db.consumerKYCDocument.update({
          where: { id },
          data: {
            status: 'verified',
            verifiedBy: verifiedBy || 'admin',
            verifiedByName: verifiedByName || 'Admin User',
            verifiedAt: now,
            verificationNotes: notes,
            extractedData: extractedData ? JSON.stringify(extractedData) : undefined,
            updatedAt: now,
          },
        });

        // Check if all required documents are verified, then update user KYC status
        const userId = document.userId;
        const allDocs = await db.consumerKYCDocument.findMany({
          where: { userId, status: { not: 'rejected' } },
        });

        const requiredTypes = ['sa_id', 'proof_of_address'];
        const verifiedTypes = allDocs
          .filter(d => d.status === 'verified')
          .map(d => d.documentType);

        const allVerified = requiredTypes.every(type => verifiedTypes.includes(type));

        if (allVerified) {
          await db.consumerUser.update({
            where: { id: userId },
            data: {
              kycStatus: 'verified',
              kycVerifiedAt: now,
              kycLevel: 2,
            }
          });
        }
      } else if (action === 'reject') {
        document = await db.consumerKYCDocument.update({
          where: { id },
          data: {
            status: 'rejected',
            verifiedBy: verifiedBy || 'admin',
            verifiedByName: verifiedByName || 'Admin User',
            verifiedAt: now,
            rejectionReason,
            updatedAt: now,
          },
        });
      } else if (action === 'request_resubmission') {
        document = await db.consumerKYCDocument.update({
          where: { id },
          data: {
            status: 'pending',
            verificationNotes: notes || 'Document needs to be resubmitted',
            updatedAt: now,
          },
        });
      } else if (action === 'assign_reviewer') {
        document = await db.consumerKYCDocument.update({
          where: { id },
          data: {
            status: 'under_review',
            reviewAssignedTo: body.assignedTo,
            reviewAssignedAt: now,
            reviewPriority: body.priority || 'normal',
            updatedAt: now,
          },
        });
      }
    } else if (documentSource === 'merchant_document') {
      if (action === 'verify') {
        document = await db.adminMerchantDocument.update({
          where: { id },
          data: {
            status: 'verified',
            verifiedBy: verifiedBy || 'admin',
            verifiedAt: now,
            updatedAt: now,
          },
        });

        // Update merchant KYC/KYB status
        const merchantId = document.merchantId;
        const merchantDocs = await db.adminMerchantDocument.findMany({
          where: { merchantId },
        });

        const allVerified = merchantDocs.every(d => d.status === 'verified');

        if (allVerified && merchantDocs.length > 0) {
          await db.adminMerchant.update({
            where: { id: merchantId },
            data: {
              kycStatus: 'verified',
              kybStatus: 'verified',
            }
          });
        }
      } else if (action === 'reject') {
        document = await db.adminMerchantDocument.update({
          where: { id },
          data: {
            status: 'rejected',
            verifiedBy: verifiedBy || 'admin',
            verifiedAt: now,
            updatedAt: now,
          },
        });
      }
    }

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found or invalid action' },
        { status: 404 }
      );
    }

    // Log the action
    await db.documentAccessLog.create({
      data: {
        id: randomUUID(),
        documentType: documentSource,
        documentId: id,
        documentName: document.fileName || document.type,
        accessedBy: verifiedBy || 'admin',
        accessedByName: verifiedByName || 'Admin User',
        accessedByRole: 'admin',
        action: action,
        reason: notes || rejectionReason,
      }
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        id: randomUUID(),
        action: `document_${action}`,
        category: 'compliance',
        actorId: verifiedBy,
        actorName: verifiedByName || 'Admin User',
        targetType: documentSource,
        targetId: id,
        targetName: document.fileName || document.type,
        details: notes || rejectionReason,
      }
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/documents/[id] - Delete document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const documentSource = searchParams.get('documentSource');

    if (documentSource === 'consumer_kyc') {
      await db.consumerKYCDocument.delete({
        where: { id },
      });
    } else if (documentSource === 'merchant_document') {
      await db.adminMerchantDocument.delete({
        where: { id },
      });
    } else {
      return NextResponse.json(
        { error: 'documentSource is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
