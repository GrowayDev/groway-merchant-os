import { NextRequest, NextResponse } from 'next/server';

// ========================
// SASSA Grant Types - Official 2025 Amounts
// ========================
const grantTypes = [
  { 
    id: 'older_persons', 
    name: 'Older Person\'s Grant (Old Age)', 
    description: 'Social pension for citizens aged 60 and above',
    amount: 2180,
    ageRequirement: 60,
    icon: '👴',
    category: 'pension',
    meansTest: true,
    documents: ['SA ID', 'Proof of residence', 'Bank statements (3 months)'],
    processingDays: 90,
  },
  { 
    id: 'disability', 
    name: 'Disability Grant', 
    description: 'For people with disabilities aged 18-59 who cannot work',
    amount: 2180,
    ageRequirement: [18, 59],
    icon: '♿',
    category: 'disability',
    meansTest: true,
    documents: ['SA ID', 'Medical assessment report', 'Proof of residence', 'Bank statements'],
    processingDays: 90,
  },
  { 
    id: 'child_support', 
    name: 'Child Support Grant', 
    description: 'Support for children under 18 years',
    amount: 530,
    ageRequirement: null,
    icon: '👶',
    category: 'child',
    meansTest: true,
    documents: ['Child\'s birth certificate', 'Parent/Guardian ID', 'Proof of residence', 'Proof of income'],
    processingDays: 30,
  },
  { 
    id: 'foster_child', 
    name: 'Foster Child Grant', 
    description: 'Support for foster parents caring for children',
    amount: 1130,
    ageRequirement: null,
    icon: '👨‍👩‍👧',
    category: 'child',
    meansTest: false,
    documents: ['Foster court order', 'Child\'s birth certificate', 'Foster parent ID'],
    processingDays: 30,
  },
  { 
    id: 'care_dependency', 
    name: 'Care Dependency Grant', 
    description: 'For children with severe disabilities requiring full-time care',
    amount: 2180,
    ageRequirement: null,
    icon: '🤝',
    category: 'disability',
    meansTest: true,
    documents: ['Medical assessment report', 'Child\'s birth certificate', 'Parent ID', 'Proof of income'],
    processingDays: 90,
  },
  { 
    id: 'war_veterans', 
    name: 'War Veteran\'s Grant', 
    description: 'For veterans who served in WWII or Korean War',
    amount: 2220,
    ageRequirement: 60,
    icon: '🎖️',
    category: 'pension',
    meansTest: true,
    documents: ['SA ID', 'Proof of war service', 'Proof of residence', 'Bank statements'],
    processingDays: 90,
  },
  { 
    id: 'grant_in_aid', 
    name: 'Grant-in-Aid', 
    description: 'Additional support for those needing full-time care',
    amount: 510,
    ageRequirement: null,
    icon: '❤️',
    category: 'care',
    meansTest: false,
    documents: ['Medical report confirming need for care', 'Main grant approval letter'],
    processingDays: 30,
    requiresMainGrant: true,
  },
  { 
    id: 'social_relief', 
    name: 'Social Relief of Distress', 
    description: 'Temporary relief for those in desperate need',
    amount: 350,
    ageRequirement: null,
    icon: '🆘',
    category: 'temporary',
    meansTest: true,
    documents: ['SA ID', 'Affidavit of need', 'Proof of unemployment', 'Proof of residence'],
    processingDays: 7,
    isTemporary: true,
    durationMonths: 6,
  },
];

// ========================
// Payment Date Calculator
// SASSA pays grants based on the last digit of ID number
// ========================
function calculatePaymentDates(year: number, month: number, lastDigit: number): { 
  olderPersons: string; 
  disability: string; 
  childSupport: { start: string; end: string };
} {
  // Older Person's Grant: Paid first, based on last digit (0-4: day 3, 5-9: day 4)
  const olderPersonDay = lastDigit <= 4 ? 3 : 4;
  
  // Disability Grant: Paid second (day after older persons)
  const disabilityDay = olderPersonDay + 1;
  
  // Child Support Grant: Spread over multiple days (5 days starting day 5)
  const childSupportStart = 5;
  const childSupportEnd = childSupportStart + 4;
  
  const padDay = (day: number) => day.toString().padStart(2, '0');
  const padMonth = (m: number) => m.toString().padStart(2, '0');
  
  return {
    olderPersons: `${year}-${padMonth(month)}-${padDay(olderPersonDay)}`,
    disability: `${year}-${padMonth(month)}-${padDay(disabilityDay)}`,
    childSupport: {
      start: `${year}-${padMonth(month)}-${padDay(childSupportStart)}`,
      end: `${year}-${padMonth(month)}-${padDay(childSupportEnd)}`,
    },
  };
}

// Generate 12-month payment calendar
function generatePaymentCalendar(lastDigit: number): unknown[] {
  const calendar = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  for (let i = 0; i < 12; i++) {
    let month = currentMonth + i;
    let year = currentYear;
    if (month > 12) {
      month -= 12;
      year += 1;
    }
    
    const dates = calculatePaymentDates(year, month, lastDigit);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    calendar.push({
      month: `${monthNames[month - 1]} ${year}`,
      monthNum: month,
      year,
      dates,
    });
  }
  
  return calendar;
}

// Extract last digit from SA ID number
function extractLastDigit(idNumber: string): number {
  const cleaned = idNumber.replace(/\D/g, '');
  if (cleaned.length >= 13) {
    return parseInt(cleaned.charAt(cleaned.length - 1));
  }
  return Math.floor(Math.random() * 10); // Fallback for demo
}

// ========================
// User SASSA Data Store (In-memory for demo)
// ========================
interface SASSAGrant {
  type: string;
  name: string;
  amount: number;
  beneficiaries: number;
  totalAmount: number;
  status: 'pending' | 'approved' | 'active' | 'suspended';
  nextPayment?: string;
  lastPayment?: string;
  applicationDate?: string;
  approvalDate?: string;
}

interface SASSAApplication {
  id: string;
  type: string;
  grantName: string;
  status: 'draft' | 'submitted' | 'processing' | 'approved' | 'rejected';
  submittedAt: string;
  documents: string[];
  estimatedProcessingDays: number;
  processedAt?: string;
  rejectionReason?: string;
  notes?: string;
}

interface SASSAPayment {
  id: string;
  grantType: string;
  amount: number;
  date: string;
  status: 'processed' | 'pending' | 'failed';
  reference: string;
}

let userSASSA = {
  linked: true,
  idNumber: '6705055009088',
  maskedIdNumber: '****5009****88',
  status: 'active',
  grants: [] as SASSAGrant[],
  totalMonthlyIncome: 0,
  lastDigit: 8,
};

// Initialize sample grants
userSASSA.grants = [
  {
    type: 'child_support',
    name: 'Child Support Grant',
    amount: 530,
    beneficiaries: 2,
    totalAmount: 1060,
    status: 'active',
    nextPayment: calculatePaymentDates(new Date().getFullYear(), new Date().getMonth() + 1, 8).childSupport.start,
    lastPayment: new Date(Date.now() - 2592000000).toISOString().split('T')[0],
  },
  {
    type: 'older_persons',
    name: 'Older Person\'s Grant',
    amount: 2180,
    beneficiaries: 1,
    totalAmount: 2180,
    status: 'active',
    nextPayment: calculatePaymentDates(new Date().getFullYear(), new Date().getMonth() + 1, 8).olderPersons,
    lastPayment: new Date(Date.now() - 2592000000).toISOString().split('T')[0],
  },
];

userSASSA.totalMonthlyIncome = userSASSA.grants.reduce((sum, g) => sum + g.totalAmount, 0);

let applications: SASSAApplication[] = [
  {
    id: 'APP-2024-001234',
    type: 'child_support',
    grantName: 'Child Support Grant',
    status: 'approved',
    submittedAt: new Date(Date.now() - 7776000000).toISOString(),
    documents: ['Birth Certificate', 'ID Copy', 'Proof of Residence'],
    estimatedProcessingDays: 30,
    processedAt: new Date(Date.now() - 5184000000).toISOString(),
  },
];

// Payment history (3 months)
let paymentHistory: SASSAPayment[] = [
  // Current month
  {
    id: 'PAY-2025-001',
    grantType: 'older_persons',
    amount: 2180,
    date: calculatePaymentDates(new Date().getFullYear(), new Date().getMonth() + 1, 8).olderPersons,
    status: 'pending',
    reference: 'SASSA-OP-2025-' + (new Date().getMonth() + 1),
  },
  {
    id: 'PAY-2025-002',
    grantType: 'child_support',
    amount: 1060,
    date: calculatePaymentDates(new Date().getFullYear(), new Date().getMonth() + 1, 8).childSupport.start,
    status: 'pending',
    reference: 'SASSA-CS-2025-' + (new Date().getMonth() + 1),
  },
  // Previous month
  {
    id: 'PAY-2024-098',
    grantType: 'older_persons',
    amount: 2180,
    date: new Date(Date.now() - 2592000000).toISOString().split('T')[0],
    status: 'processed',
    reference: 'SASSA-OP-2024-' + new Date(Date.now() - 2592000000).getMonth(),
  },
  {
    id: 'PAY-2024-099',
    grantType: 'child_support',
    amount: 1060,
    date: new Date(Date.now() - 2678400000).toISOString().split('T')[0],
    status: 'processed',
    reference: 'SASSA-CS-2024-' + new Date(Date.now() - 2678400000).getMonth(),
  },
  // 2 months ago
  {
    id: 'PAY-2024-090',
    grantType: 'older_persons',
    amount: 2180,
    date: new Date(Date.now() - 5184000000).toISOString().split('T')[0],
    status: 'processed',
    reference: 'SASSA-OP-2024-' + new Date(Date.now() - 5184000000).getMonth(),
  },
  {
    id: 'PAY-2024-091',
    grantType: 'child_support',
    amount: 1060,
    date: new Date(Date.now() - 5270400000).toISOString().split('T')[0],
    status: 'processed',
    reference: 'SASSA-CS-2024-' + new Date(Date.now() - 5270400000).getMonth(),
  },
];

// ========================
// Early Access Configuration (Pay+ Integration)
// ========================
const earlyAccessConfig = {
  enabled: true,
  maxAdvancePercent: 0.85, // 85% of grant amount
  feePercent: 0.025, // 2.5% fee
  minDaysBeforePayment: 5, // Minimum days before official payment
  maxDaysEarly: 10, // Maximum days early you can access
  providers: ['Pay+', 'Tymebank', 'Capitec'],
};

// ========================
// API Handlers
// ========================

// GET - SASSA data
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  const idNumber = searchParams.get('idNumber');

  // Get all grant types
  if (action === 'grant-types') {
    return NextResponse.json({ 
      success: true, 
      data: grantTypes.map(gt => ({
        id: gt.id,
        name: gt.name,
        description: gt.description,
        amount: gt.amount,
        icon: gt.icon,
        category: gt.category,
        documents: gt.documents,
        processingDays: gt.processingDays,
      }))
    });
  }

  // Get payment calendar
  if (action === 'payment-calendar') {
    const lastDigit = idNumber ? extractLastDigit(idNumber) : userSASSA.lastDigit;
    const calendar = generatePaymentCalendar(lastDigit);
    
    return NextResponse.json({
      success: true,
      data: {
        lastDigit,
        calendar,
        currentMonth: calendar[0],
      },
    });
  }

  // Get user's SASSA status
  if (action === 'status') {
    return NextResponse.json({
      success: true,
      data: {
        linked: userSASSA.linked,
        maskedIdNumber: userSASSA.maskedIdNumber,
        status: userSASSA.status,
        grants: userSASSA.grants,
        totalMonthlyIncome: userSASSA.totalMonthlyIncome,
        nextPaymentDate: userSASSA.grants.length > 0 ? 
          userSASSA.grants.reduce((earliest, g) => 
            !g.nextPayment || (earliest && g.nextPayment < earliest) ? g.nextPayment : earliest, 
            userSASSA.grants[0]?.nextPayment || null
          ) : null,
      },
    });
  }

  // Get applications
  if (action === 'applications') {
    return NextResponse.json({ 
      success: true, 
      data: applications,
      pending: applications.filter(a => a.status === 'processing').length,
    });
  }

  // Get payment history
  if (action === 'payment-history') {
    const months = parseInt(searchParams.get('months') || '3');
    const limitedHistory = paymentHistory.slice(0, months * 2); // Approx 2 payments per month
    
    return NextResponse.json({
      success: true,
      data: limitedHistory,
      totalReceived: limitedHistory
        .filter(p => p.status === 'processed')
        .reduce((sum, p) => sum + p.amount, 0),
    });
  }

  // Check eligibility
  if (action === 'check-eligibility') {
    const grantId = searchParams.get('grantType');
    const grant = grantTypes.find(g => g.id === grantId);
    
    if (!grant) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid grant type' 
      }, { status: 400 });
    }

    // Simulate eligibility check
    const eligible = Math.random() > 0.2; // 80% chance of eligible
    const reasons: string[] = [];
    
    if (!eligible) {
      reasons.push('Income exceeds means test threshold');
    }
    
    return NextResponse.json({
      success: true,
      data: {
        grantType: grantId,
        grantName: grant.name,
        eligible,
        reasons,
        documents: grant.documents,
        estimatedProcessingDays: grant.processingDays,
        estimatedAmount: grant.amount,
      },
    });
  }

  // Get early access info (Pay+ integration)
  if (action === 'early-access') {
    const upcomingPayments = paymentHistory
      .filter(p => p.status === 'pending')
      .map(p => {
        const grant = userSASSA.grants.find(g => g.type === p.grantType);
        return {
          ...p,
          grantName: grant?.name || p.grantType,
          availableAdvance: Math.round(p.amount * earlyAccessConfig.maxAdvancePercent),
          fee: Math.round(p.amount * earlyAccessConfig.maxAdvancePercent * earlyAccessConfig.feePercent * 100) / 100,
          netAmount: Math.round(p.amount * earlyAccessConfig.maxAdvancePercent * (1 - earlyAccessConfig.feePercent) * 100) / 100,
          daysUntilPayment: Math.ceil((new Date(p.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        };
      });
    
    return NextResponse.json({
      success: true,
      data: {
        enabled: earlyAccessConfig.enabled,
        config: {
          maxAdvancePercent: earlyAccessConfig.maxAdvancePercent,
          feePercent: earlyAccessConfig.feePercent,
          minDaysBeforePayment: earlyAccessConfig.minDaysBeforePayment,
        },
        upcomingPayments,
        totalAdvanceable: upcomingPayments.reduce((sum, p) => sum + p.availableAdvance, 0),
      },
    });
  }

  // Default response
  return NextResponse.json({
    success: true,
    data: {
      grantTypes: grantTypes.map(gt => ({
        id: gt.id,
        name: gt.name,
        amount: gt.amount,
        icon: gt.icon,
      })),
      userSASSA: userSASSA.linked ? {
        maskedIdNumber: userSASSA.maskedIdNumber,
        grants: userSASSA.grants,
        totalMonthlyIncome: userSASSA.totalMonthlyIncome,
      } : null,
    },
  });
}

// POST - Apply or manage
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, grantType, idNumber, documents, applicationId, paymentId } = body;

    // Link SASSA account
    if (action === 'link') {
      if (!idNumber || idNumber.length < 6) {
        return NextResponse.json({ 
          success: false, 
          error: 'Valid ID number required' 
        }, { status: 400 });
      }

      const lastDigit = extractLastDigit(idNumber);
      
      // Simulate linking - in production this would verify with SASSA
      userSASSA.linked = true;
      userSASSA.idNumber = idNumber;
      userSASSA.maskedIdNumber = '****' + idNumber.slice(4, 8) + '****' + idNumber.slice(-2);
      userSASSA.lastDigit = lastDigit;
      userSASSA.status = 'active';

      return NextResponse.json({
        success: true,
        data: userSASSA,
        message: 'SASSA account linked successfully! Your grants will appear in your wallet.',
      });
    }

    // Apply for grant
    if (action === 'apply') {
      const grant = grantTypes.find(g => g.id === grantType);
      if (!grant) {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid grant type' 
        }, { status: 400 });
      }

      const application: SASSAApplication = {
        id: `APP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
        type: grantType,
        grantName: grant.name,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        documents: documents || [],
        estimatedProcessingDays: grant.processingDays,
        notes: `Application submitted via Groway Wallet. Estimated processing: ${grant.processingDays} days.`,
      };

      applications.unshift(application);

      return NextResponse.json({
        success: true,
        data: application,
        message: `Application for ${grant.name} submitted successfully! Reference: ${application.id}. Estimated processing time: ${grant.processingDays} days.`,
      });
    }

    // Check application status
    if (action === 'check-application') {
      const app = applications.find(a => a.id === applicationId);
      if (!app) {
        return NextResponse.json({ 
          success: false, 
          error: 'Application not found' 
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        data: app,
      });
    }

    // Early access to grant (Pay+ integration)
    if (action === 'early-access') {
      const upcomingPayment = paymentHistory.find(p => 
        p.status === 'pending' && p.id === paymentId
      );
      
      if (!upcomingPayment) {
        return NextResponse.json({ 
          success: false, 
          error: 'No upcoming payment found' 
        }, { status: 400 });
      }

      const daysUntilPayment = Math.ceil(
        (new Date(upcomingPayment.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilPayment < earlyAccessConfig.minDaysBeforePayment) {
        return NextResponse.json({ 
          success: false, 
          error: `Early access only available ${earlyAccessConfig.minDaysBeforePayment}+ days before payment` 
        }, { status: 400 });
      }

      const advanceAmount = Math.round(upcomingPayment.amount * earlyAccessConfig.maxAdvancePercent);
      const fee = Math.round(advanceAmount * earlyAccessConfig.feePercent * 100) / 100;
      const netAmount = advanceAmount - fee;

      return NextResponse.json({
        success: true,
        data: {
          paymentId: upcomingPayment.id,
          grantType: upcomingPayment.grantType,
          originalAmount: upcomingPayment.amount,
          advanceAmount,
          fee,
          netAmount,
          paymentDate: upcomingPayment.date,
          daysEarly: daysUntilPayment,
          provider: 'Pay+',
        },
        message: `R${netAmount.toFixed(2)} will be credited to your wallet. Fee: R${fee.toFixed(2)}. The advance will be recovered from your SASSA payment on ${upcomingPayment.date}.`,
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Invalid action' 
    }, { status: 400 });
  } catch {
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid request' 
    }, { status: 400 });
  }
}

// PUT - Update grant details
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { grantType, beneficiaries, action } = body;

    if (action === 'update-beneficiaries') {
      const grant = userSASSA.grants.find(g => g.type === grantType);
      if (!grant) {
        return NextResponse.json({ 
          success: false, 
          error: 'Grant not found' 
        }, { status: 404 });
      }

      const grantInfo = grantTypes.find(gt => gt.id === grantType);
      grant.beneficiaries = beneficiaries;
      grant.totalAmount = beneficiaries * (grantInfo?.amount || grant.amount);

      userSASSA.totalMonthlyIncome = userSASSA.grants.reduce((sum, g) => sum + g.totalAmount, 0);

      return NextResponse.json({
        success: true,
        data: grant,
        message: `Beneficiary count updated to ${beneficiaries}`,
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Invalid action' 
    }, { status: 400 });
  } catch {
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid request' 
    }, { status: 400 });
  }
}
