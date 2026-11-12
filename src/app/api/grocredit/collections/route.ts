import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Types for collections management
interface DelinquentAccount {
  id: string;
  merchantId: string;
  businessName: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  creditFacilityId: string;
  totalOutstanding: number;
  overdueAmount: number;
  daysPastDue: number;
  delinquencyStage: 'early' | 'moderate' | 'severe' | 'critical' | 'write_off';
  lastPaymentDate: string | null;
  lastContactDate: string | null;
  nextActionDate: string | null;
  assignedTo: string | null;
  assignedToName: string | null;
  collectionActions: CollectionAction[];
  paymentArrangements: PaymentArrangement[];
  riskScore: number;
  totalRepaid: number;
  approvedLimit: number;
  status: string;
}

interface CollectionAction {
  id: string;
  type: 'reminder' | 'call' | 'email' | 'sms' | 'letter' | 'escalation' | 'legal_referral' | 'payment_arrangement';
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'scheduled';
  scheduledDate: string | null;
  completedDate: string | null;
  performedBy: string | null;
  performedByName: string | null;
  notes: string | null;
  outcome: string | null;
  createdAt: string;
}

interface PaymentArrangement {
  id: string;
  type: 'installment' | 'deferred' | 'restructured' | 'settlement';
  totalAmount: number;
  installmentAmount: number;
  numberOfInstallments: number;
  startDate: string;
  endDate: string;
  status: 'pending' | 'active' | 'completed' | 'defaulted' | 'cancelled';
  installmentsPaid: number;
  amountPaid: number;
  remainingAmount: number;
  createdAt: string;
  approvedBy: string | null;
  approvedByName: string | null;
}

// Helper to calculate days past due
function calculateDaysPastDue(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
}

// Helper to determine delinquency stage
function getDelinquencyStage(daysPastDue: number): DelinquentAccount['delinquencyStage'] {
  if (daysPastDue <= 30) return 'early';
  if (daysPastDue <= 60) return 'moderate';
  if (daysPastDue <= 90) return 'severe';
  if (daysPastDue <= 180) return 'critical';
  return 'write_off';
}

// Generate mock collection actions
function generateMockCollectionActions(accountId: string, daysPastDue: number): CollectionAction[] {
  const actions: CollectionAction[] = [];
  const baseDate = new Date();
  
  if (daysPastDue > 7) {
    actions.push({
      id: `action-${accountId}-1`,
      type: 'sms',
      description: 'Payment reminder sent via SMS',
      status: 'completed',
      scheduledDate: new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      completedDate: new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      performedBy: 'system',
      performedByName: 'Automated System',
      notes: 'Automated reminder sent',
      outcome: 'delivered',
      createdAt: new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  if (daysPastDue > 14) {
    actions.push({
      id: `action-${accountId}-2`,
      type: 'email',
      description: 'Overdue payment notice sent via email',
      status: 'completed',
      scheduledDate: new Date(baseDate.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      completedDate: new Date(baseDate.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      performedBy: 'system',
      performedByName: 'Automated System',
      notes: 'Formal overdue notice',
      outcome: 'delivered',
      createdAt: new Date(baseDate.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  if (daysPastDue > 30) {
    actions.push({
      id: `action-${accountId}-3`,
      type: 'call',
      description: 'Collection call attempt',
      status: 'completed',
      scheduledDate: new Date(baseDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      completedDate: new Date(baseDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      performedBy: 'collector-1',
      performedByName: 'Thandi Nkosi',
      notes: 'Spoke to owner, committed to payment next week',
      outcome: 'promise_to_pay',
      createdAt: new Date(baseDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  if (daysPastDue > 60) {
    actions.push({
      id: `action-${accountId}-4`,
      type: 'letter',
      description: 'Final demand letter sent',
      status: 'completed',
      scheduledDate: new Date(baseDate.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      completedDate: new Date(baseDate.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      performedBy: 'collector-2',
      performedByName: 'Johan van der Berg',
      notes: 'Registered mail, awaiting response',
      outcome: 'delivered',
      createdAt: new Date(baseDate.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  if (daysPastDue > 90) {
    actions.push({
      id: `action-${accountId}-5`,
      type: 'escalation',
      description: 'Account escalated to senior collections',
      status: 'completed',
      scheduledDate: new Date(baseDate.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      completedDate: new Date(baseDate.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      performedBy: 'manager-1',
      performedByName: 'Nomsa Dlamini',
      notes: 'Account marked for legal review',
      outcome: 'escalated',
      createdAt: new Date(baseDate.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
    });
  }

  return actions;
}

// Generate mock payment arrangements
function generateMockPaymentArrangements(accountId: string): PaymentArrangement[] {
  // Only some accounts have arrangements
  if (Math.random() > 0.4) return [];
  
  const arrangement: PaymentArrangement = {
    id: `arr-${accountId}`,
    type: 'installment',
    totalAmount: 25000,
    installmentAmount: 5000,
    numberOfInstallments: 5,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'active',
    installmentsPaid: 2,
    amountPaid: 10000,
    remainingAmount: 15000,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    approvedBy: 'manager-1',
    approvedByName: 'Nomsa Dlamini'
  };
  
  return [arrangement];
}

// GET /api/grocredit/collections - Get all delinquent accounts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage'); // early, moderate, severe, critical, write_off
    const assignedTo = searchParams.get('assignedTo');
    const daysOverdueMin = parseInt(searchParams.get('daysOverdueMin') || '0');
    const daysOverdueMax = parseInt(searchParams.get('daysOverdueMax') || '999');

    // Get all facilities with overdue repayments
    const facilities = await db.merchantCredit.findMany({
      where: {
        status: { in: ['active', 'suspended'] }
      },
      include: {
        repayments: {
          where: {
            status: { in: ['overdue', 'defaulted'] }
          },
          orderBy: { dueDate: 'asc' }
        },
        drawRequests: {
          where: {
            status: 'disbursed'
          }
        }
      }
    });

    // Process facilities to find delinquent accounts
    const delinquentAccounts: DelinquentAccount[] = [];
    
    for (const facility of facilities) {
      const overdueRepayments = facility.repayments.filter(r => 
        r.status === 'overdue' || r.status === 'defaulted'
      );
      
      if (overdueRepayments.length === 0) continue;

      const overdueAmount = overdueRepayments.reduce((sum, r) => sum + r.amount, 0);
      const earliestDueDate = overdueRepayments[0]?.dueDate;
      const daysPastDue = earliestDueDate ? calculateDaysPastDue(earliestDueDate) : 0;
      const delinquencyStage = getDelinquencyStage(daysPastDue);

      // Apply filters
      if (stage && delinquencyStage !== stage) continue;
      if (daysPastDue < daysOverdueMin || daysPastDue > daysOverdueMax) continue;

      const lastPayment = await db.creditRepayment.findFirst({
        where: {
          merchantCreditId: facility.id,
          status: 'paid'
        },
        orderBy: { paidDate: 'desc' }
      });

      const mockActions = generateMockCollectionActions(facility.id, daysPastDue);
      const mockArrangements = generateMockPaymentArrangements(facility.id);

      delinquentAccounts.push({
        id: facility.id,
        merchantId: facility.merchantId,
        businessName: `Business ${facility.merchantId.slice(0, 6)}`,
        contactName: 'Store Owner',
        contactEmail: 'owner@example.com',
        contactPhone: '+27 82 123 4567',
        creditFacilityId: facility.id,
        totalOutstanding: facility.drawnAmount,
        overdueAmount,
        daysPastDue,
        delinquencyStage,
        lastPaymentDate: lastPayment?.paidDate || null,
        lastContactDate: mockActions.length > 0 ? mockActions[mockActions.length - 1].completedDate : null,
        nextActionDate: null,
        assignedTo: 'collector-1',
        assignedToName: 'Thandi Nkosi',
        collectionActions: mockActions,
        paymentArrangements: mockArrangements,
        riskScore: facility.riskScore,
        totalRepaid: facility.totalRepaid,
        approvedLimit: facility.approvedLimit,
        status: facility.status
      });
    }

    // Add mock data for demonstration if no real delinquent accounts
    if (delinquentAccounts.length === 0) {
      const mockAccounts: DelinquentAccount[] = [
        {
          id: 'mock-1',
          merchantId: 'merchant-001',
          businessName: 'Sipho\'s Supermarket',
          contactName: 'Sipho Mokoena',
          contactEmail: 'sipho@supermarket.co.za',
          contactPhone: '+27 72 345 6789',
          creditFacilityId: 'cf-001',
          totalOutstanding: 45000,
          overdueAmount: 12500,
          daysPastDue: 15,
          delinquencyStage: 'early',
          lastPaymentDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          lastContactDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          nextActionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          assignedTo: 'collector-1',
          assignedToName: 'Thandi Nkosi',
          collectionActions: generateMockCollectionActions('mock-1', 15),
          paymentArrangements: [],
          riskScore: 72,
          totalRepaid: 85000,
          approvedLimit: 100000,
          status: 'active'
        },
        {
          id: 'mock-2',
          merchantId: 'merchant-002',
          businessName: 'Nomsa Trading Store',
          contactName: 'Nomsa Dube',
          contactEmail: 'nomsa@trading.co.za',
          contactPhone: '+27 83 456 7890',
          creditFacilityId: 'cf-002',
          totalOutstanding: 78000,
          overdueAmount: 35000,
          daysPastDue: 45,
          delinquencyStage: 'moderate',
          lastPaymentDate: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
          lastContactDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          nextActionDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          assignedTo: 'collector-2',
          assignedToName: 'Johan van der Berg',
          collectionActions: generateMockCollectionActions('mock-2', 45),
          paymentArrangements: generateMockPaymentArrangements('mock-2'),
          riskScore: 58,
          totalRepaid: 120000,
          approvedLimit: 150000,
          status: 'active'
        },
        {
          id: 'mock-3',
          merchantId: 'merchant-003',
          businessName: 'Vaal River Supplies',
          contactName: 'Petrus van Niekerk',
          contactEmail: 'petrus@vaalriver.co.za',
          contactPhone: '+27 82 567 8901',
          creditFacilityId: 'cf-003',
          totalOutstanding: 125000,
          overdueAmount: 85000,
          daysPastDue: 75,
          delinquencyStage: 'severe',
          lastPaymentDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          lastContactDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          nextActionDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          assignedTo: 'manager-1',
          assignedToName: 'Nomsa Dlamini',
          collectionActions: generateMockCollectionActions('mock-3', 75),
          paymentArrangements: [],
          riskScore: 42,
          totalRepaid: 250000,
          approvedLimit: 200000,
          status: 'suspended'
        },
        {
          id: 'mock-4',
          merchantId: 'merchant-004',
          businessName: 'KwaZulu Kwikspar',
          contactName: 'Rajen Govender',
          contactEmail: 'rajen@kwiksparks.co.za',
          contactPhone: '+27 84 678 9012',
          creditFacilityId: 'cf-004',
          totalOutstanding: 200000,
          overdueAmount: 180000,
          daysPastDue: 105,
          delinquencyStage: 'critical',
          lastPaymentDate: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
          lastContactDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          nextActionDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          assignedTo: 'legal-1',
          assignedToName: 'Legal Department',
          collectionActions: generateMockCollectionActions('mock-4', 105),
          paymentArrangements: [],
          riskScore: 28,
          totalRepaid: 450000,
          approvedLimit: 250000,
          status: 'suspended'
        },
        {
          id: 'mock-5',
          merchantId: 'merchant-005',
          businessName: 'Eastern Cape Distributors',
          contactName: 'Lindiwe Mangena',
          contactEmail: 'lindiwe@ecdistrib.co.za',
          contactPhone: '+27 72 789 0123',
          creditFacilityId: 'cf-005',
          totalOutstanding: 320000,
          overdueAmount: 320000,
          daysPastDue: 195,
          delinquencyStage: 'write_off',
          lastPaymentDate: new Date(Date.now() - 240 * 24 * 60 * 60 * 1000).toISOString(),
          lastContactDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          nextActionDate: null,
          assignedTo: 'legal-1',
          assignedToName: 'Legal Department',
          collectionActions: generateMockCollectionActions('mock-5', 195),
          paymentArrangements: [],
          riskScore: 15,
          totalRepaid: 180000,
          approvedLimit: 350000,
          status: 'suspended'
        }
      ];

      // Apply filters to mock data
      let filtered = mockAccounts;
      if (stage) {
        filtered = filtered.filter(a => a.delinquencyStage === stage);
      }
      if (daysOverdueMin > 0 || daysOverdueMax < 999) {
        filtered = filtered.filter(a => 
          a.daysPastDue >= daysOverdueMin && a.daysPastDue <= daysOverdueMax
        );
      }

      return NextResponse.json({
        success: true,
        data: filtered,
        stats: calculateCollectionStats(filtered),
        isMockData: true
      });
    }

    return NextResponse.json({
      success: true,
      data: delinquentAccounts,
      stats: calculateCollectionStats(delinquentAccounts)
    });
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch collections data' },
      { status: 500 }
    );
  }
}

// Calculate collection statistics
function calculateCollectionStats(accounts: DelinquentAccount[]) {
  const now = new Date();
  
  return {
    totalAccounts: accounts.length,
    totalOutstanding: accounts.reduce((sum, a) => sum + a.totalOutstanding, 0),
    totalOverdue: accounts.reduce((sum, a) => sum + a.overdueAmount, 0),
    byStage: {
      early: accounts.filter(a => a.delinquencyStage === 'early').length,
      moderate: accounts.filter(a => a.delinquencyStage === 'moderate').length,
      severe: accounts.filter(a => a.delinquencyStage === 'severe').length,
      critical: accounts.filter(a => a.delinquencyStage === 'critical').length,
      write_off: accounts.filter(a => a.delinquencyStage === 'write_off').length
    },
    averageDaysPastDue: accounts.length > 0 
      ? Math.round(accounts.reduce((sum, a) => sum + a.daysPastDue, 0) / accounts.length)
      : 0,
    activeArrangements: accounts.filter(a => 
      a.paymentArrangements.some(arr => arr.status === 'active')
    ).length,
    arrangementsValue: accounts.reduce((sum, a) => 
      sum + a.paymentArrangements.filter(arr => arr.status === 'active')
        .reduce((s, arr) => s + arr.remainingAmount, 0), 0
    ),
    pendingActions: accounts.reduce((sum, a) => 
      sum + a.collectionActions.filter(action => action.status === 'pending').length, 0
    ),
    recoveryRate: accounts.length > 0 
      ? Math.round((accounts.reduce((sum, a) => sum + a.totalRepaid, 0) / 
          accounts.reduce((sum, a) => sum + a.approvedLimit, 0)) * 100)
      : 0
  };
}

// POST /api/grocredit/collections - Create a collection action or payment arrangement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, accountId, ...data } = body;

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Handle different action types
    switch (action) {
      case 'add_note': {
        const { note, performedBy } = data;
        // In production, this would save to a database
        return NextResponse.json({
          success: true,
          message: 'Note added successfully',
          data: {
            accountId,
            note,
            performedBy,
            createdAt: new Date().toISOString()
          }
        });
      }

      case 'schedule_action': {
        const { actionType, scheduledDate, description, performedBy } = data;
        // In production, this would create a scheduled task
        return NextResponse.json({
          success: true,
          message: 'Action scheduled successfully',
          data: {
            accountId,
            type: actionType,
            scheduledDate,
            description,
            performedBy,
            status: 'scheduled',
            createdAt: new Date().toISOString()
          }
        });
      }

      case 'create_arrangement': {
        const { 
          type, 
          totalAmount, 
          installmentAmount, 
          numberOfInstallments, 
          startDate,
          approvedBy 
        } = data;
        
        // Validate arrangement
        if (!totalAmount || !installmentAmount || !numberOfInstallments) {
          return NextResponse.json(
            { success: false, error: 'Missing required arrangement details' },
            { status: 400 }
          );
        }

        const arrangement = {
          id: `arr-${Date.now()}`,
          type,
          totalAmount,
          installmentAmount,
          numberOfInstallments,
          startDate,
          endDate: new Date(
            new Date(startDate).getTime() + numberOfInstallments * 30 * 24 * 60 * 60 * 1000
          ).toISOString().split('T')[0],
          status: 'pending',
          installmentsPaid: 0,
          amountPaid: 0,
          remainingAmount: totalAmount,
          createdAt: new Date().toISOString(),
          approvedBy,
          approvedByName: 'Collection Manager'
        };

        return NextResponse.json({
          success: true,
          message: 'Payment arrangement created successfully',
          data: arrangement
        });
      }

      case 'escalate_to_legal': {
        const { reason, documents, escalatedBy } = data;
        // In production, this would trigger legal workflow
        return NextResponse.json({
          success: true,
          message: 'Account escalated to legal department',
          data: {
            accountId,
            reason,
            documents,
            escalatedBy,
            escalatedAt: new Date().toISOString(),
            status: 'legal_review'
          }
        });
      }

      case 'write_off': {
        const { reason, amount, approvedBy } = data;
        // In production, this would update the facility status
        return NextResponse.json({
          success: true,
          message: 'Account marked for write-off',
          data: {
            accountId,
            reason,
            amount,
            approvedBy,
            writtenOffAt: new Date().toISOString(),
            status: 'written_off'
          }
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing collection action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process collection action' },
      { status: 500 }
    );
  }
}
