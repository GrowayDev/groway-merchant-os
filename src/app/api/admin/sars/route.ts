import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Types for SARS submissions
interface VATReturnData {
  id: string;
  merchantId: string;
  periodStart: string;
  periodEnd: string;
  outputVat: number;
  inputVat: number;
  netVat: number;
  totalSales: number;
  capitalGoods: number;
  totalPurchases: number;
  exports: number;
  zeroRated: number;
  status: string;
  paymentDueDate?: string;
  submittedAt?: Date;
  submittedBy?: string;
  sarsReference?: string;
  createdAt: Date;
}

interface PAYERecordData {
  id: string;
  merchantId: string;
  taxYear: string;
  period: string;
  payrollAmount: number;
  payeDeducted: number;
  uifDeducted: number;
  sdlDeducted: number;
  employeesCount: number;
  status: string;
  dueDate: Date;
  submittedAt?: Date;
}

interface ProvisionalTaxData {
  id: string;
  merchantId: string;
  taxYear: string;
  period: string;
  estimatedTaxableIncome: number;
  taxPayable: number;
  amountPaid: number;
  balanceDue: number;
  status: string;
  dueDate: Date;
  submittedAt?: Date;
}

interface FilingCalendarEntry {
  id: string;
  type: string;
  name: string;
  dueDate: Date;
  status: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

// GET /api/admin/sars - Get SARS submissions and filing calendar
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId') || 'merchant-001';
    const isAudit = searchParams.get('audit') === 'true';

    // If requesting audit log
    if (isAudit) {
      const auditLog = await db.auditLog.findMany({
        where: { category: 'sars' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return NextResponse.json({ auditLog });
    }

    // Fetch VAT returns
    const vatSubmissions = await db.sARSSubmission.findMany({
      where: {
        merchantId,
        submissionType: 'VAT201',
      },
      orderBy: { periodStart: 'desc' },
      take: 12,
    });

    // Fetch PAYE records
    const payeSubmissions = await db.sARSSubmission.findMany({
      where: {
        merchantId,
        submissionType: { in: ['EMP201', 'EMP501'] },
      },
      orderBy: { periodStart: 'desc' },
      take: 24,
    });

    // Fetch provisional tax
    const provisionalSubmissions = await db.sARSSubmission.findMany({
      where: {
        merchantId,
        submissionType: 'PROV',
      },
      orderBy: { periodStart: 'desc' },
      take: 6,
    });

    // Calculate stats
    const pendingFilings = await db.sARSSubmission.count({
      where: {
        merchantId,
        filingStatus: { in: ['draft', 'ready'] },
      },
    });

    // Get recent accepted/paid submissions for compliance score
    const successfulFilings = await db.sARSSubmission.count({
      where: {
        merchantId,
        filingStatus: { in: ['accepted', 'paid'] },
      },
    });

    const totalFilings = await db.sARSSubmission.count({ where: { merchantId } });
    const complianceScore = totalFilings > 0 ? Math.round((successfulFilings / totalFilings) * 100) : 100;

    // Generate filing calendar based on current date
    const now = new Date();
    const filingCalendar: FilingCalendarEntry[] = [];

    // VAT201 deadlines (bi-monthly)
    const vatMonth = new Date(now.getFullYear(), now.getMonth() + 1, 25);
    filingCalendar.push({
      id: `vat-${vatMonth.getTime()}`,
      type: 'VAT201',
      name: `${vatMonth.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })} VAT Return`,
      dueDate: vatMonth,
      status: 'pending',
      description: 'Bi-monthly VAT submission',
      priority: 'high',
    });

    // EMP201 deadlines (monthly - 7th of next month)
    const payeMonth = new Date(now.getFullYear(), now.getMonth() + 1, 7);
    filingCalendar.push({
      id: `emp201-${payeMonth.getTime()}`,
      type: 'EMP201',
      name: `${payeMonth.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })} PAYE`,
      dueDate: payeMonth,
      status: 'pending',
      description: 'Monthly PAYE declaration',
      priority: 'high',
    });

    // EMP501 deadline (annual - May 31st or October 31st)
    const emp501Date = now.getMonth() < 5 
      ? new Date(now.getFullYear(), 4, 31) // May 31
      : new Date(now.getFullYear(), 9, 31); // October 31
    filingCalendar.push({
      id: `emp501-${emp501Date.getTime()}`,
      type: 'EMP501',
      name: 'Annual PAYE Reconciliation',
      dueDate: emp501Date,
      status: 'pending',
      description: 'Annual employer reconciliation',
      priority: 'medium',
    });

    // Provisional tax deadlines
    const provTaxYear = now.getMonth() >= 2 ? now.getFullYear() + 1 : now.getFullYear();
    const provFirst = new Date(provTaxYear - 1, 8, 30); // Sep 30
    const provSecond = new Date(provTaxYear - 1, 1, 28); // Feb 28
    const provThird = new Date(provTaxYear - 1, 8, 30); // Sep 30

    const nextProvDeadline = now < provFirst ? provFirst 
      : now < provSecond ? provSecond 
      : provThird;

    filingCalendar.push({
      id: `prov-${nextProvDeadline.getTime()}`,
      type: 'Provisional',
      name: 'Provisional Tax Payment',
      dueDate: nextProvDeadline,
      status: 'pending',
      description: 'Provisional tax payment',
      priority: 'high',
    });

    // Format response data
    const vatReturns: VATReturnData[] = vatSubmissions.map(s => ({
      id: s.id,
      merchantId: s.merchantId,
      periodStart: s.periodStart,
      periodEnd: s.periodEnd,
      outputVat: s.taxableAmount * 0.15,
      inputVat: s.totalAmount - s.taxDue,
      netVat: s.taxDue,
      totalSales: s.taxableAmount,
      capitalGoods: 0,
      totalPurchases: s.totalAmount,
      exports: 0,
      zeroRated: 0,
      status: s.filingStatus,
      paymentDueDate: s.paymentDate || undefined,
      submittedAt: s.submittedAt || undefined,
      submittedBy: s.preparedByName || undefined,
      sarsReference: s.submissionRef || undefined,
      createdAt: s.createdAt,
    }));

    const payeRecords: PAYERecordData[] = payeSubmissions.map(s => ({
      id: s.id,
      merchantId: s.merchantId,
      taxYear: s.taxNumber || '2025/2026',
      period: s.periodStart,
      payrollAmount: s.taxableAmount,
      payeDeducted: s.taxDue,
      uifDeducted: s.taxableAmount * 0.01,
      sdlDeducted: s.taxableAmount * 0.01,
      employeesCount: Math.round(s.taxableAmount / 50000),
      status: s.filingStatus,
      dueDate: new Date(s.periodEnd),
      submittedAt: s.submittedAt || undefined,
    }));

    const provisionalTax: ProvisionalTaxData[] = provisionalSubmissions.map(s => ({
      id: s.id,
      merchantId: s.merchantId,
      taxYear: s.taxNumber || new Date().getFullYear().toString(),
      period: s.periodStart.includes('First') ? 'First' : s.periodStart.includes('Second') ? 'Second' : 'Third',
      estimatedTaxableIncome: s.taxableAmount,
      taxPayable: s.taxDue,
      amountPaid: s.totalAmount,
      balanceDue: s.taxDue - s.totalAmount,
      status: s.filingStatus,
      dueDate: new Date(s.periodEnd),
      submittedAt: s.submittedAt || undefined,
    }));

    return NextResponse.json({
      vatReturns,
      payeRecords,
      provisionalTax,
      filingCalendar: filingCalendar.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()),
      stats: {
        totalVatLiability: vatReturns.reduce((sum, v) => sum + (v.status === 'ready' ? v.netVat : 0), 0),
        totalPayeLiability: payeRecords.reduce((sum, p) => sum + (p.status === 'draft' ? p.payeDeducted + p.uifDeducted + p.sdlDeducted : 0), 0),
        totalProvisionalLiability: provisionalTax.reduce((sum, p) => sum + (p.status === 'pending' ? p.balanceDue : 0), 0),
        pendingFilings,
        complianceScore,
        nextDeadline: filingCalendar[0]?.dueDate || null,
      },
    });
  } catch (error) {
    console.error('Error fetching SARS data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SARS data' },
      { status: 500 }
    );
  }
}

// POST /api/admin/sars - Submit tax filing to SARS
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, submissionId, action, data } = body;

    // Validate required fields
    if (!type || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: type, action' },
        { status: 400 }
      );
    }

    // Handle different actions
    switch (action) {
      case 'submit': {
        // Update submission status
        const submission = await db.sARSSubmission.update({
          where: { id: submissionId },
          data: {
            filingStatus: 'submitted',
            submittedAt: new Date(),
            preparedByName: 'Admin User',
          },
        });

        // Create audit log
        await db.auditLog.create({
          data: {
            action: `${type}_submitted`,
            category: 'sars',
            actorName: 'Admin User',
            targetType: `${type}_return`,
            targetId: submissionId,
            targetName: `${type} Submission`,
            details: JSON.stringify({
              reference: submission.submissionRef,
              amount: submission.taxDue,
            }),
          },
        });

        return NextResponse.json({
          success: true,
          submission,
          message: `${type.toUpperCase()} submitted successfully to SARS eFiling`,
        });
      }

      case 'create': {
        // Create new submission
        const newSubmission = await db.sARSSubmission.create({
          data: {
            id: `sars-${Date.now()}`,
            merchantId: data.merchantId || 'merchant-001',
            submissionType: type,
            periodStart: data.periodStart,
            periodEnd: data.periodEnd,
            totalAmount: data.totalAmount || 0,
            taxableAmount: data.taxableAmount || 0,
            taxDue: data.taxDue || 0,
            filingStatus: 'draft',
          },
        });

        // Create audit log
        await db.auditLog.create({
          data: {
            action: `${type}_created`,
            category: 'sars',
            actorName: 'Admin User',
            targetType: `${type}_return`,
            targetId: newSubmission.id,
            targetName: `${type} Submission`,
            details: JSON.stringify({
              periodStart: data.periodStart,
              periodEnd: data.periodEnd,
            }),
          },
        });

        return NextResponse.json({
          success: true,
          submission: newSubmission,
          message: `${type.toUpperCase()} created successfully`,
        }, { status: 201 });
      }

      case 'generate_irp5': {
        // Generate IRP5 certificates for employees
        const { merchantId, taxYear } = data;

        // In production, this would generate actual IRP5 certificates
        // For now, create audit log entry
        await db.auditLog.create({
          data: {
            action: 'irp5_generated',
            category: 'sars',
            actorName: 'System',
            targetType: 'irp5_batch',
            targetId: `batch-${Date.now()}`,
            targetName: `IRP5 Batch - ${taxYear}`,
            details: JSON.stringify({
              merchantId,
              taxYear,
              count: data.employeeCount || 0,
            }),
          },
        });

        return NextResponse.json({
          success: true,
          message: 'IRP5 certificates generated successfully',
          downloadUrl: `/api/admin/sars/documents/irp5-${taxYear}.zip`,
        });
      }

      case 'calculate_vat': {
        // Auto-calculate VAT from transaction data
        const { merchantId, periodStart, periodEnd } = data;

        // In production, this would query transaction data
        // Mock calculation for demo
        const outputVat = 156780.50;
        const inputVat = 98450.25;
        const netVat = outputVat - inputVat;

        return NextResponse.json({
          success: true,
          calculation: {
            outputVat,
            inputVat,
            netVat,
            totalSales: outputVat / 0.15,
            totalPurchases: inputVat / 0.15,
          },
        });
      }

      case 'calculate_paye': {
        // Auto-calculate PAYE from payroll data
        const { merchantId, periodStart, periodEnd } = data;

        // Mock calculation for demo
        return NextResponse.json({
          success: true,
          calculation: {
            payrollAmount: 2450000,
            payeDeducted: 478500,
            uifDeducted: 24112,
            sdlDeducted: 2450,
            employeesCount: 47,
          },
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing SARS request:', error);
    return NextResponse.json(
      { error: 'Failed to process SARS request' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/sars - Update submission
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { submissionId, data } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Missing submissionId' },
        { status: 400 }
      );
    }

    const submission = await db.sARSSubmission.update({
      where: { id: submissionId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'submission_updated',
        category: 'sars',
        actorName: 'Admin User',
        targetType: 'submission',
        targetId: submissionId,
        targetName: `${submission.submissionType} Submission`,
        details: JSON.stringify(data),
      },
    });

    return NextResponse.json({
      success: true,
      submission,
    });
  } catch (error) {
    console.error('Error updating SARS submission:', error);
    return NextResponse.json(
      { error: 'Failed to update submission' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/sars - Delete submission (draft only)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('id');

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Missing submission id' },
        { status: 400 }
      );
    }

    // Check if submission is draft
    const submission = await db.sARSSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    if (submission.filingStatus !== 'draft') {
      return NextResponse.json(
        { error: 'Can only delete draft submissions' },
        { status: 400 }
      );
    }

    await db.sARSSubmission.delete({
      where: { id: submissionId },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'submission_deleted',
        category: 'sars',
        actorName: 'Admin User',
        targetType: 'submission',
        targetId: submissionId,
        targetName: `${submission.submissionType} Submission`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Submission deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting SARS submission:', error);
    return NextResponse.json(
      { error: 'Failed to delete submission' },
      { status: 500 }
    );
  }
}
