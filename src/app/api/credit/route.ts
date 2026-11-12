import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Demo user ID - in production this would come from authentication
const DEMO_USER_ID = 'demo-consumer-user-001';

// Credit Score Configuration
const creditConfig = {
  minScore: 300,
  maxScore: 850,
  scoreBands: [
    { min: 300, max: 549, rating: 'Poor', color: '#EF4444' },
    { min: 550, max: 649, rating: 'Fair', color: '#F59E0B' },
    { min: 650, max: 699, rating: 'Good', color: '#10B981' },
    { min: 700, max: 749, rating: 'Very Good', color: '#3B82F6' },
    { min: 750, max: 850, rating: 'Excellent', color: '#8B5CF6' },
  ],
};

// Loan Lenders - 10 providers each
const lenders = {
  personal: [
    { id: 'investec', name: 'Investec Personal Loans', aprMin: 9.5, aprMax: 18.5, maxAmount: 500000, minTerm: 12, maxTerm: 84, rating: 4.9, logo: '💼', ncrRegistration: 'NCRCP 596' },
    { id: 'discovery', name: 'Discovery Personal Loans', aprMin: 10.5, aprMax: 22.5, maxAmount: 350000, minTerm: 12, maxTerm: 84, rating: 4.9, logo: '💙', ncrRegistration: 'NCRCP 452' },
    { id: 'fnb', name: 'FNB Personal Loans', aprMin: 11.0, aprMax: 23.5, maxAmount: 300000, minTerm: 6, maxTerm: 60, rating: 4.6, logo: '🏦', ncrRegistration: 'NCRCP 20' },
    { id: 'standard', name: 'Standard Bank Personal', aprMin: 11.5, aprMax: 24.5, maxAmount: 300000, minTerm: 12, maxTerm: 72, rating: 4.5, logo: '🔷', ncrRegistration: 'NCRCP 7' },
    { id: 'nedbank', name: 'Nedbank Personal Loan', aprMin: 12.0, aprMax: 24.0, maxAmount: 250000, minTerm: 6, maxTerm: 60, rating: 4.4, logo: '🟢', ncrRegistration: 'NCRCP 9' },
    { id: 'old_mutual', name: 'Old Mutual Finance', aprMin: 12.5, aprMax: 25.5, maxAmount: 200000, minTerm: 12, maxTerm: 60, rating: 4.3, logo: '🛡️', ncrRegistration: 'NCRCP 157' },
    { id: 'capitec', name: 'Capitec Credit', aprMin: 12.75, aprMax: 26.0, maxAmount: 250000, minTerm: 6, maxTerm: 84, rating: 4.5, logo: '🔴', ncrRegistration: 'NCRCP 232' },
    { id: 'african_bank', name: 'African Bank', aprMin: 13.0, aprMax: 27.0, maxAmount: 250000, minTerm: 12, maxTerm: 72, rating: 4.2, logo: '🌍', ncrRegistration: 'NCRCP 34' },
    { id: 'capfin', name: 'Capfin', aprMin: 14.0, aprMax: 28.0, maxAmount: 50000, minTerm: 6, maxTerm: 24, rating: 4.1, logo: '💰', ncrRegistration: 'NCRCP 430' },
    { id: 'bayport', name: 'Bayport Financial', aprMin: 14.5, aprMax: 28.5, maxAmount: 180000, minTerm: 12, maxTerm: 60, rating: 4.0, logo: '🏢', ncrRegistration: 'NCRCP 374' },
  ],
  business: [
    { id: 'standard_biz', name: 'Standard Bank Business', aprMin: 12.0, aprMax: 20.0, maxAmount: 5000000, minTerm: 12, maxTerm: 84, rating: 4.7, logo: '🔷', ncrRegistration: 'NCRCP 7' },
    { id: 'business_partners', name: 'Business Partners Ltd', aprMin: 12.5, aprMax: 22.5, maxAmount: 5000000, minTerm: 12, maxTerm: 84, rating: 4.6, logo: '🤝', ncrRegistration: 'NCRCP 89' },
    { id: 'fnb_biz', name: 'FNB Business', aprMin: 13.0, aprMax: 21.5, maxAmount: 3000000, minTerm: 12, maxTerm: 60, rating: 4.5, logo: '🏦', ncrRegistration: 'NCRCP 20' },
    { id: 'nedbank_biz', name: 'Nedbank Business', aprMin: 13.5, aprMax: 22.0, maxAmount: 3000000, minTerm: 12, maxTerm: 72, rating: 4.4, logo: '🟢', ncrRegistration: 'NCRCP 9' },
    { id: 'absa_biz', name: 'Absa Business Banking', aprMin: 14.0, aprMax: 23.5, maxAmount: 2500000, minTerm: 12, maxTerm: 60, rating: 4.3, logo: '🔴', ncrRegistration: 'NCRCP 8' },
    { id: 'bidvest', name: 'Bidvest Bank Business', aprMin: 14.5, aprMax: 24.0, maxAmount: 2000000, minTerm: 12, maxTerm: 60, rating: 4.2, logo: '💼', ncrRegistration: 'NCRCP 175' },
    { id: 'capitec_biz', name: 'Capitec Business', aprMin: 14.0, aprMax: 24.5, maxAmount: 1500000, minTerm: 12, maxTerm: 60, rating: 4.4, logo: '🔴', ncrRegistration: 'NCRCP 232' },
    { id: 'grindrod', name: 'Grindrod Bank', aprMin: 15.0, aprMax: 25.0, maxAmount: 2000000, minTerm: 12, maxTerm: 60, rating: 4.0, logo: '🚢', ncrRegistration: 'NCRCP 198' },
    { id: 'merchant', name: 'Merchant Capital', aprMin: 15.5, aprMax: 26.0, maxAmount: 1000000, minTerm: 6, maxTerm: 36, rating: 4.1, logo: '📈', ncrRegistration: 'NCRCP 520' },
    { id: 'sasfin', name: 'Sasfin Bank', aprMin: 16.0, aprMax: 27.0, maxAmount: 1500000, minTerm: 12, maxTerm: 48, rating: 3.9, logo: '🏦', ncrRegistration: 'NCRCP 72' },
  ],
};

// Debt Counselling Services
const debtCounsellingServices = [
  { id: 'ndcr', name: 'NDCR - National Debt Counselling', logo: '🏛️', rating: 4.8, ncrRegistration: 'NCRDC 45', fee: 'R300/month', features: ['Free assessment', 'Reduced payments', 'Legal protection', 'Single monthly payment'], contact: '0861 333 456' },
  { id: 'debtrescue', name: 'Debt Rescue', logo: '🚁', rating: 4.7, ncrRegistration: 'NCRDC 12', fee: 'R250/month', features: ['Immediate relief', 'Interest rate reduction', 'Asset protection', 'Online portal'], contact: '0861 222 456' },
  { id: 'debtsafe', name: 'DebtSafe', logo: '🛡️', rating: 4.6, ncrRegistration: 'NCRDC 78', fee: 'R280/month', features: ['Free consultation', 'Negotiation with creditors', 'Budget planning', 'Debt review clearance'], contact: '0861 432 789' },
  { id: 'capitec_dc', name: 'Capitec Debt Review', logo: '🔴', rating: 4.5, ncrRegistration: 'NCRDC 232', fee: 'R200/month', features: ['Integrated banking', 'Lower fees', 'Quick processing', 'Mobile app'], contact: '0860 10 20 43' },
  { id: 'vericred', name: 'VeriCred Credit Solutions', logo: '✅', rating: 4.4, ncrRegistration: 'NCRDC 156', fee: 'R350/month', features: ['Credit bureau disputes', 'Debt review removal', 'Credit score improvement', 'Financial education'], contact: '0861 444 333' },
];

// GroAI Credit Insights
const creditInsights = [
  { type: 'positive', icon: '📈', message: 'Your credit score improved by 7 points this month', recommendation: 'Keep paying on time to maintain momentum' },
  { type: 'warning', icon: '⚠️', message: 'Credit utilization at 45% - ideal is below 30%', recommendation: 'Consider paying down R8,500 to optimize your score' },
  { type: 'tip', icon: '💡', message: 'You qualify for better rates with your current score', recommendation: 'Refinancing your loan could save R450/month' },
  { type: 'info', icon: '📊', message: 'Your credit age is 4 years - good for your score', recommendation: 'Keep old accounts open to maintain credit history' },
];

// Loan Types
const loanTypes = [
  { id: 'personal', name: 'Personal Loan', icon: '👤', description: 'For personal expenses' },
  { id: 'payday', name: 'Payday Loan', icon: '💸', description: 'Short-term cash advance' },
  { id: 'debt_consolidation', name: 'Debt Consolidation', icon: '📊', description: 'Combine your debts' },
  { id: 'vehicle', name: 'Vehicle Finance', icon: '🚗', description: 'Car and bike loans' },
  { id: 'home', name: 'Home Loan', icon: '🏠', description: 'Mortgage finance' },
  { id: 'business', name: 'Business Loan', icon: '🏢', description: 'Business funding' },
  { id: 'education', name: 'Education Loan', icon: '🎓', description: 'Study funding' },
  { id: 'medical', name: 'Medical Loan', icon: '🏥', description: 'Healthcare expenses' },
];

// POPIA Compliance notice for credit score access
const popiaNotice = {
  title: 'Credit Score Access (POPIA Compliance)',
  message: 'Your credit score is retrieved from registered credit bureaus in compliance with the Protection of Personal Information Act (POPIA). Your data is processed lawfully and used solely for credit assessment purposes.',
  bureaus: ['TransUnion', 'Experian', 'Compuscan', 'XDS'],
  lastConsent: new Date().toISOString(),
  rights: ['Access your data', 'Correct inaccuracies', 'Object to processing', 'Request deletion'],
};

// Helper to ensure demo user and credit data exist
async function ensureDemoData() {
  let user = await db.consumerUser.findUnique({
    where: { id: DEMO_USER_ID }
  });
  
  if (!user) {
    const now = new Date();
    user = await db.consumerUser.create({
      data: {
        id: DEMO_USER_ID,
        phone: '+27821234567',
        email: 'thabo.molefe@example.com',
        firstName: 'Thabo',
        lastName: 'Molefe',
        kycLevel: 2,
        kycStatus: 'verified',
        kycVerifiedAt: now,
        accountStatus: 'active',
        createdAt: now,
        updatedAt: now,
      }
    });
  }
  
  // Ensure credit score exists
  let creditScore = await db.consumerCreditScore.findUnique({
    where: { userId: DEMO_USER_ID }
  });
  
  if (!creditScore) {
    const now = new Date();
    creditScore = await db.consumerCreditScore.create({
      data: {
        id: `credit-${DEMO_USER_ID}`,
        userId: DEMO_USER_ID,
        score: 672,
        lastUpdated: now,
        history: JSON.stringify([
          { date: new Date(Date.now() - 7776000000).toISOString(), score: 665 },
          { date: new Date(Date.now() - 5184000000).toISOString(), score: 668 },
          { date: new Date(Date.now() - 2592000000).toISOString(), score: 670 },
          { date: now.toISOString(), score: 672 },
        ]),
        factors: JSON.stringify([
          { factor: 'Payment History', score: 95, weight: 35 },
          { factor: 'Credit Utilization', score: 78, weight: 30 },
          { factor: 'Credit Age', score: 70, weight: 15 },
          { factor: 'Credit Mix', score: 85, weight: 10 },
          { factor: 'New Credit', score: 90, weight: 10 },
        ]),
        updatedAt: now,
      }
    });
  }
  
  // Ensure demo loan exists
  const existingLoans = await db.consumerLoan.findMany({
    where: { userId: DEMO_USER_ID }
  });
  
  if (existingLoans.length === 0) {
    const now = new Date();
    await db.consumerLoan.create({
      data: {
        id: `loan-demo-001`,
        userId: DEMO_USER_ID,
        lenderId: 'discovery',
        lenderName: 'Discovery Personal Loans',
        loanType: 'personal',
        amount: 50000,
        outstanding: 42000,
        monthlyPayment: 2200,
        interestRate: 15.5,
        termMonths: 36,
        monthsRemaining: 24,
        status: 'active',
        updatedAt: now,
      }
    });
  }
  
  return creditScore;
}

// GET - Credit and loan data
export async function GET(request: NextRequest) {
  try {
    const creditScore = await ensureDemoData();
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const loanType = searchParams.get('type');
    const amount = parseFloat(searchParams.get('amount') || '50000');
    const term = parseInt(searchParams.get('term') || '24');

    if (action === 'score') {
      const band = creditConfig.scoreBands.find(b => creditScore.score >= b.min && creditScore.score <= b.max);
      return NextResponse.json({
        success: true,
        data: {
          score: creditScore.score,
          lastUpdated: creditScore.lastUpdated.toISOString(),
          history: creditScore.history ? JSON.parse(creditScore.history) : [],
          factors: creditScore.factors ? JSON.parse(creditScore.factors) : [],
          band,
        },
      });
    }

    if (action === 'lenders') {
      const type = loanType === 'business' ? 'business' : 'personal';
      return NextResponse.json({ success: true, data: lenders[type] });
    }

    if (action === 'types') {
      return NextResponse.json({ success: true, data: loanTypes });
    }

    if (action === 'calculator') {
      const type = loanType === 'business' ? 'business' : 'personal';
      const typeLenders = lenders[type];
      
      const quotes = typeLenders.map(lender => {
        const apr = (lender.aprMin + lender.aprMax) / 2;
        const monthlyRate = apr / 100 / 12;
        const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);
        const totalRepayment = monthlyPayment * term;
        
        return {
          lender,
          loanAmount: amount,
          term,
          apr,
          monthlyPayment: Math.round(monthlyPayment * 100) / 100,
          totalRepayment: Math.round(totalRepayment * 100) / 100,
          totalInterest: Math.round((totalRepayment - amount) * 100) / 100,
        };
      });

      return NextResponse.json({
        success: true,
        data: {
          amount,
          term,
          quotes: quotes.sort((a, b) => a.monthlyPayment - b.monthlyPayment),
        },
      });
    }

    if (action === 'my-loans') {
      const loans = await db.consumerLoan.findMany({
        where: { userId: DEMO_USER_ID },
        orderBy: { createdAt: 'desc' }
      });
      
      return NextResponse.json({ 
        success: true, 
        data: loans.map(l => ({
          id: l.id,
          lenderId: l.lenderId,
          lenderName: l.lenderName,
          type: l.loanType,
          amount: l.amount,
          outstanding: l.outstanding,
          monthlyPayment: l.monthlyPayment,
          interestRate: l.interestRate,
          termMonths: l.termMonths,
          monthsRemaining: l.monthsRemaining,
          status: l.status
        }))
      });
    }

    if (action === 'prequalify') {
      const eligibleLenders = lenders.personal.filter(l => {
        if (creditScore.score >= 700) return true;
        if (creditScore.score >= 650 && l.aprMin < 15) return true;
        if (creditScore.score >= 600 && l.aprMin < 20) return true;
        return l.aprMin < 25;
      });

      return NextResponse.json({
        success: true,
        data: {
          creditScore: creditScore.score,
          eligibleLenders: eligibleLenders.map(l => ({
            ...l,
            prequalified: true,
            estimatedApr: l.aprMin + (l.aprMax - l.aprMin) * (1 - (creditScore.score - 300) / 550),
          })),
        },
      });
    }

    if (action === 'debt-counselling') {
      return NextResponse.json({
        success: true,
        data: {
          services: debtCounsellingServices,
          userDebtStatus: {
            totalDebt: 92000,
            monthlyPayments: 4200,
            debtToIncomeRatio: 0.38,
            recommendation: 'Your debt-to-income ratio is moderate. Consider debt counselling if struggling.',
          },
        },
      });
    }

    if (action === 'insights') {
      return NextResponse.json({
        success: true,
        data: {
          insights: creditInsights,
          scoreFactors: creditScore.factors ? JSON.parse(creditScore.factors) : [],
          improvementTips: [
            { tip: 'Pay all accounts on time', impact: '+15 points in 3 months' },
            { tip: 'Reduce credit utilization to 30%', impact: '+20 points in 2 months' },
            { tip: 'Avoid applying for new credit', impact: '+5 points in 1 month' },
            { tip: 'Keep old accounts open', impact: '+10 points long-term' },
          ],
          popiaCompliance: popiaNotice,
        },
      });
    }

    if (action === 'all-providers') {
      return NextResponse.json({
        success: true,
        data: {
          personal: lenders.personal,
          business: lenders.business,
          debtCounselling: debtCounsellingServices,
          total: lenders.personal.length + lenders.business.length,
        },
      });
    }

    // Get user loans
    const userLoans = await db.consumerLoan.findMany({
      where: { userId: DEMO_USER_ID }
    });

    // Default: return comprehensive credit data
    const band = creditConfig.scoreBands.find(b => creditScore.score >= b.min && creditScore.score <= b.max);
    
    return NextResponse.json({
      success: true,
      data: {
        creditScore: {
          score: creditScore.score,
          band,
          lastUpdated: creditScore.lastUpdated.toISOString(),
          history: creditScore.history ? JSON.parse(creditScore.history) : [],
          factors: creditScore.factors ? JSON.parse(creditScore.factors) : [],
          popiaCompliance: popiaNotice,
        },
        loanTypes,
        personalLenders: lenders.personal,
        businessLenders: lenders.business,
        debtCounsellingServices,
        creditInsights,
        activeLoans: userLoans.map(l => ({
          id: l.id,
          lenderId: l.lenderId,
          lenderName: l.lenderName,
          type: l.loanType,
          amount: l.amount,
          outstanding: l.outstanding,
          monthlyPayment: l.monthlyPayment,
          interestRate: l.interestRate,
          termMonths: l.termMonths,
          monthsRemaining: l.monthsRemaining,
          status: l.status
        })),
      },
    });
  } catch (error) {
    console.error('Credit GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch credit data' }, { status: 500 });
  }
}

// POST - Apply for loan
export async function POST(request: NextRequest) {
  try {
    await ensureDemoData();
    const body = await request.json();
    const { lenderId, amount, term, type, purpose } = body;

    const allLenders = [...lenders.personal, ...lenders.business];
    const lender = allLenders.find(l => l.id === lenderId);

    if (!lender) {
      return NextResponse.json({ success: false, error: 'Lender not found' }, { status: 404 });
    }

    if (amount > lender.maxAmount) {
      return NextResponse.json({
        success: false,
        error: `Maximum loan amount is R${lender.maxAmount.toLocaleString()}`,
      }, { status: 400 });
    }

    if (term < lender.minTerm || term > lender.maxTerm) {
      return NextResponse.json({
        success: false,
        error: `Term must be between ${lender.minTerm} and ${lender.maxTerm} months`,
      }, { status: 400 });
    }

    const now = new Date();
    const application = await db.consumerLoanApplication.create({
      data: {
        id: `LA${Date.now()}`,
        userId: DEMO_USER_ID,
        lenderId,
        lenderName: lender.name,
        amount,
        term,
        loanType: type,
        purpose,
        status: 'pending',
        updatedAt: now,
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: application.id,
        lenderId: application.lenderId,
        lenderName: application.lenderName,
        amount: application.amount,
        term: application.term,
        loanType: application.loanType,
        status: application.status,
        createdAt: application.createdAt.toISOString(),
        estimatedResponse: '24-48 hours',
      },
      message: `Loan application submitted to ${lender.name}. You will receive a response within 24-48 hours.`,
    });
  } catch (error) {
    console.error('Credit POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process request' }, { status: 500 });
  }
}
