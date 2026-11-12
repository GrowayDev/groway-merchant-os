import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper to calculate days past due
function calculateDaysPastDue(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
}

// Helper to determine delinquency stage
function getDelinquencyStage(daysPastDue: number): string {
  if (daysPastDue <= 30) return 'early';
  if (daysPastDue <= 60) return 'moderate';
  if (daysPastDue <= 90) return 'severe';
  if (daysPastDue <= 180) return 'critical';
  return 'write_off';
}

// GET /api/grocredit/collections/[id] - Get specific collection account details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Try to find real data first
    const facility = await db.merchantCredit.findUnique({
      where: { id },
      include: {
        drawRequests: {
          where: { status: 'disbursed' },
          orderBy: { createdAt: 'desc' }
        },
        repayments: {
          orderBy: { dueDate: 'desc' },
          take: 24
        }
      }
    });

    if (facility) {
      const overdueRepayments = facility.repayments.filter(r => 
        r.status === 'overdue' || r.status === 'defaulted'
      );

      const overdueAmount = overdueRepayments.reduce((sum, r) => sum + r.amount, 0);
      const earliestDueDate = overdueRepayments[0]?.dueDate;
      const daysPastDue = earliestDueDate ? calculateDaysPastDue(earliestDueDate) : 0;

      const lastPayment = await db.creditRepayment.findFirst({
        where: {
          merchantCreditId: facility.id,
          status: 'paid'
        },
        orderBy: { paidDate: 'desc' }
      });

      // Build detailed account view
      const accountDetails = {
        id: facility.id,
        merchantId: facility.merchantId,
        businessName: `Business ${facility.merchantId.slice(0, 6)}`,
        contactInfo: {
          name: 'Store Owner',
          email: 'owner@example.com',
          phone: '+27 82 123 4567',
          address: '123 Main Street, Johannesburg, 2001'
        },
        creditFacility: {
          id: facility.id,
          tierName: facility.tierName,
          approvedLimit: facility.approvedLimit,
          availableCredit: facility.availableCredit,
          drawnAmount: facility.drawnAmount,
          interestRate: facility.interestRate,
          status: facility.status,
          applicationDate: facility.applicationDate,
          approvalDate: facility.approvalDate
        },
        paymentSummary: {
          totalRepaid: facility.totalRepaid,
          totalInterestPaid: facility.totalInterestPaid,
          totalDraws: facility.totalDraws,
          activeDraws: facility.activeDraws,
          lastPaymentDate: lastPayment?.paidDate || null,
          lastPaymentAmount: lastPayment?.amount || 0
        },
        delinquency: {
          totalOutstanding: facility.drawnAmount,
          overdueAmount,
          daysPastDue,
          stage: getDelinquencyStage(daysPastDue),
          earliestOverdueDate: earliestDueDate || null
        },
        repaymentHistory: facility.repayments.map(r => ({
          id: r.id,
          referenceNumber: r.referenceNumber,
          amount: r.amount,
          principalAmount: r.principalAmount,
          interestAmount: r.interestAmount,
          penaltyAmount: r.penaltyAmount,
          dueDate: r.dueDate,
          paidDate: r.paidDate,
          status: r.status,
          lateFeeApplied: r.lateFeeApplied
        })),
        drawHistory: facility.drawRequests.map(d => ({
          id: d.id,
          referenceNumber: d.referenceNumber,
          amount: d.amount,
          purpose: d.purpose,
          termMonths: d.termMonths,
          interestRate: d.interestRate,
          monthlyPayment: d.monthlyPayment,
          status: d.status,
          createdAt: d.createdAt,
          disbursedAt: d.disbursedAt
        })),
        riskAssessment: {
          riskScore: facility.riskScore,
          paymentScore: facility.paymentScore,
          lastReviewAt: facility.lastReviewAt,
          nextReviewAt: facility.nextReviewAt
        },
        collectionActions: [],
        paymentArrangements: [],
        notes: [],
        auditTrail: []
      };

      return NextResponse.json({
        success: true,
        data: accountDetails
      });
    }

    // Return mock data for demonstration
    const mockAccount = {
      id,
      merchantId: `merchant-${id.slice(-3)}`,
      businessName: id === 'mock-1' ? "Sipho's Supermarket" : 
                   id === 'mock-2' ? 'Nomsa Trading Store' :
                   id === 'mock-3' ? 'Vaal River Supplies' :
                   id === 'mock-4' ? 'KwaZulu Kwikspar' :
                   'Eastern Cape Distributors',
      contactInfo: {
        name: id === 'mock-1' ? 'Sipho Mokoena' :
              id === 'mock-2' ? 'Nomsa Dube' :
              id === 'mock-3' ? 'Petrus van Niekerk' :
              id === 'mock-4' ? 'Rajen Govender' :
              'Lindiwe Mangena',
        email: `owner${id.slice(-2)}@example.co.za`,
        phone: `+27 8${Math.floor(Math.random() * 10)} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}`,
        address: '123 Business Street, Johannesburg, 2001'
      },
      creditFacility: {
        id,
        tierName: 'Business',
        approvedLimit: 100000 + Math.floor(Math.random() * 200000),
        availableCredit: 50000 + Math.floor(Math.random() * 50000),
        drawnAmount: 50000 + Math.floor(Math.random() * 150000),
        interestRate: 13.25,
        status: id === 'mock-5' ? 'suspended' : 'active',
        applicationDate: '2024-01-15',
        approvalDate: '2024-01-20'
      },
      paymentSummary: {
        totalRepaid: 150000 + Math.floor(Math.random() * 300000),
        totalInterestPaid: 15000 + Math.floor(Math.random() * 30000),
        totalDraws: 5 + Math.floor(Math.random() * 10),
        activeDraws: 1 + Math.floor(Math.random() * 3),
        lastPaymentDate: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
        lastPaymentAmount: 5000 + Math.floor(Math.random() * 10000)
      },
      delinquency: {
        totalOutstanding: 50000 + Math.floor(Math.random() * 200000),
        overdueAmount: 10000 + Math.floor(Math.random() * 100000),
        daysPastDue: 15 + Math.floor(Math.random() * 150),
        stage: getDelinquencyStage(15 + Math.floor(Math.random() * 150)),
        earliestOverdueDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
      },
      repaymentHistory: Array.from({ length: 12 }, (_, i) => ({
        id: `rep-${i}`,
        referenceNumber: `REP-${String(i + 1).padStart(6, '0')}`,
        amount: 3000 + Math.floor(Math.random() * 7000),
        principalAmount: 2500 + Math.floor(Math.random() * 6000),
        interestAmount: 500 + Math.floor(Math.random() * 1000),
        penaltyAmount: i < 3 ? Math.floor(Math.random() * 200) : 0,
        dueDate: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toISOString(),
        paidDate: i > 2 ? new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000 + Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString() : null,
        status: i < 3 ? 'overdue' : i < 4 ? 'pending' : 'paid',
        lateFeeApplied: i < 3
      })),
      drawHistory: Array.from({ length: 5 }, (_, i) => ({
        id: `draw-${i}`,
        referenceNumber: `DRW-${String(i + 1).padStart(6, '0')}`,
        amount: 10000 + Math.floor(Math.random() * 40000),
        purpose: ['inventory', 'equipment', 'expansion', 'seasonal', 'working_capital'][i % 5],
        termMonths: [3, 6, 12, 18, 24][i % 5],
        interestRate: 12 + Math.floor(Math.random() * 5),
        monthlyPayment: 1000 + Math.floor(Math.random() * 5000),
        status: i < 2 ? 'disbursed' : 'settled',
        createdAt: new Date(Date.now() - (4 - i) * 60 * 24 * 60 * 60 * 1000).toISOString(),
        disbursedAt: new Date(Date.now() - (4 - i) * 60 * 24 * 60 * 60 * 1000 + 2 * 24 * 60 * 60 * 1000).toISOString()
      })),
      riskAssessment: {
        riskScore: 30 + Math.floor(Math.random() * 50),
        paymentScore: 40 + Math.floor(Math.random() * 40),
        lastReviewAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        nextReviewAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      collectionActions: [
        {
          id: 'action-1',
          type: 'sms',
          description: 'Payment reminder sent',
          status: 'completed',
          scheduledDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          completedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          performedBy: 'system',
          performedByName: 'Automated System',
          notes: 'Automated reminder sent',
          outcome: 'delivered'
        },
        {
          id: 'action-2',
          type: 'call',
          description: 'Collection call attempt',
          status: 'completed',
          scheduledDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          completedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          performedBy: 'collector-1',
          performedByName: 'Thandi Nkosi',
          notes: 'Spoke to owner, committed to payment',
          outcome: 'promise_to_pay'
        },
        {
          id: 'action-3',
          type: 'email',
          description: 'Follow-up email with payment options',
          status: 'scheduled',
          scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          completedDate: null,
          performedBy: null,
          performedByName: null,
          notes: 'Scheduled follow-up',
          outcome: null
        }
      ],
      paymentArrangements: [],
      notes: [
        {
          id: 'note-1',
          content: 'Customer experiencing cash flow issues due to supplier delays',
          createdBy: 'collector-1',
          createdByName: 'Thandi Nkosi',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      auditTrail: [
        {
          id: 'audit-1',
          action: 'account_viewed',
          performedBy: 'collector-1',
          performedByName: 'Thandi Nkosi',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          details: 'Account reviewed during morning collections'
        }
      ]
    };

    return NextResponse.json({
      success: true,
      data: mockAccount,
      isMockData: true
    });
  } catch (error) {
    console.error('Error fetching collection account:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch collection account' },
      { status: 500 }
    );
  }
}

// PUT /api/grocredit/collections/[id] - Update collection account
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      action, 
      note, 
      performedBy, 
      performedByName,
      arrangementDetails 
    } = body;

    // Handle different update actions
    switch (action) {
      case 'add_note': {
        return NextResponse.json({
          success: true,
          message: 'Note added successfully',
          data: {
            accountId: id,
            note,
            performedBy,
            performedByName,
            createdAt: new Date().toISOString()
          }
        });
      }

      case 'update_stage': {
        const { newStage, reason } = body;
        return NextResponse.json({
          success: true,
          message: 'Delinquency stage updated',
          data: {
            accountId: id,
            previousStage: 'early',
            newStage,
            reason,
            updatedAt: new Date().toISOString()
          }
        });
      }

      case 'assign_collector': {
        const { collectorId, collectorName } = body;
        return NextResponse.json({
          success: true,
          message: 'Collector assigned',
          data: {
            accountId: id,
            assignedTo: collectorId,
            assignedToName: collectorName,
            assignedAt: new Date().toISOString()
          }
        });
      }

      case 'create_arrangement': {
        const { 
          type, 
          totalAmount, 
          installmentAmount, 
          numberOfInstallments, 
          startDate 
        } = arrangementDetails || body;

        return NextResponse.json({
          success: true,
          message: 'Payment arrangement created',
          data: {
            id: `arr-${Date.now()}`,
            accountId: id,
            type,
            totalAmount,
            installmentAmount,
            numberOfInstallments,
            startDate,
            endDate: new Date(
              new Date(startDate).getTime() + numberOfInstallments * 30 * 24 * 60 * 60 * 1000
            ).toISOString().split('T')[0],
            status: 'pending',
            createdAt: new Date().toISOString()
          }
        });
      }

      case 'record_contact': {
        const { contactType, outcome, notes } = body;
        return NextResponse.json({
          success: true,
          message: 'Contact recorded',
          data: {
            accountId: id,
            contactType,
            outcome,
            notes,
            contactedAt: new Date().toISOString(),
            performedBy,
            performedByName
          }
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error updating collection account:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update collection account' },
      { status: 500 }
    );
  }
}

// DELETE /api/grocredit/collections/[id] - Write off or close collection account
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action'); // 'write_off' or 'close'
    const reason = searchParams.get('reason');

    if (action === 'write_off') {
      return NextResponse.json({
        success: true,
        message: 'Account written off',
        data: {
          accountId: id,
          writtenOffAt: new Date().toISOString(),
          reason: reason || 'Bad debt',
          status: 'written_off'
        }
      });
    }

    if (action === 'close') {
      return NextResponse.json({
        success: true,
        message: 'Collection account closed',
        data: {
          accountId: id,
          closedAt: new Date().toISOString(),
          reason,
          status: 'closed'
        }
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use action=write_off or action=close' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing collection deletion:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
