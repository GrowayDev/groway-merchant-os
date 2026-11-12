import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Demo user ID - in production this would come from authentication
const DEMO_USER_ID = 'demo-consumer-user-001';

// Insurance Categories and Providers
const insuranceCategories = [
  { id: 'funeral', name: 'Funeral Cover', icon: '🕊️', description: 'Peace of mind for your family' },
  { id: 'life', name: 'Life Insurance', icon: '❤️', description: 'Protect your loved ones future' },
  { id: 'health', name: 'Health Cover', icon: '🏥', description: 'Medical expense protection' },
  { id: 'vehicle', name: 'Vehicle Insurance', icon: '🚗', description: 'Car and motorcycle cover' },
  { id: 'home', name: 'Home Insurance', icon: '🏠', description: 'Protect your property' },
  { id: 'business', name: 'Business Insurance', icon: '🏢', description: 'Protect your business' },
];

// Insurance Providers - 10 providers
const providers = [
  { id: 'old_mutual', name: 'Old Mutual', logo: '🛡️', rating: 4.8, fscaLicense: 'FSP 1234', established: 1845 },
  { id: 'discovery', name: 'Discovery', logo: '💙', rating: 4.7, fscaLicense: 'FSP 2345', established: 1992 },
  { id: 'hollard', name: 'Hollard', logo: '🟠', rating: 4.6, fscaLicense: 'FSP 3456', established: 1980 },
  { id: 'santam', name: 'Santam', logo: '🔷', rating: 4.8, fscaLicense: 'FSP 4567', established: 1918 },
  { id: 'liberty', name: 'Liberty', logo: '🗽', rating: 4.5, fscaLicense: 'FSP 5678', established: 1957 },
  { id: 'momentum', name: 'Momentum', logo: '⚡', rating: 4.6, fscaLicense: 'FSP 6789', established: 1966 },
  { id: 'sanlam', name: 'Sanlam', logo: '🏔️', rating: 4.7, fscaLicense: 'FSP 7890', established: 1918 },
  { id: 'clientele', name: 'Clientèle', logo: '👥', rating: 4.4, fscaLicense: 'FSP 8901', established: 1989 },
  { id: 'outsurance', name: 'OUTsurance', logo: '🎯', rating: 4.5, fscaLicense: 'FSP 9012', established: 1998 },
  { id: 'miway', name: 'MiWay', logo: '🚀', rating: 4.3, fscaLicense: 'FSP 0123', established: 2008 },
];

// Insurance Products by Category
const products = {
  funeral: [
    { id: 'FUN001', provider: 'old_mutual', name: 'Old Mutual Funeral Plan', coverAmount: 50000, premium: 150, waitingPeriod: 6, benefits: ['Immediate family cover', 'Groceries benefit', 'Tombstone benefit'], description: 'Comprehensive funeral cover for your entire family' },
    { id: 'FUN002', provider: 'discovery', name: 'Discovery Funeral Care', coverAmount: 75000, premium: 200, waitingPeriod: 6, benefits: ['Family cover', 'Cash payout', 'Memorial benefit'], description: 'Premium funeral cover with cash back option' },
    { id: 'FUN003', provider: 'clientele', name: 'Clientèle Funeral Cover', coverAmount: 30000, premium: 89, waitingPeriod: 3, benefits: ['No medical exams', 'Immediate cover available', 'Extended family'], description: 'Affordable funeral cover with quick activation' },
    { id: 'FUN004', provider: 'hollard', name: 'Hollard Funeral Plan', coverAmount: 100000, premium: 280, waitingPeriod: 6, benefits: ['Premium holiday', 'Policy loan', 'Accidental death benefit'], description: 'High cover with flexible payment options' },
    { id: 'FUN005', provider: 'sanlam', name: 'Sanlam Funeral Cover', coverAmount: 60000, premium: 175, waitingPeriod: 6, benefits: ['Extended family', 'Cash back after 10 years', 'Repatriation'], description: 'Long-term funeral protection with cash back' },
  ],
  life: [
    { id: 'LIF001', provider: 'old_mutual', name: 'Old Mutual Life Cover', coverAmount: 500000, premium: 350, waitingPeriod: 0, benefits: ['Level premiums', 'Terminal illness benefit', 'Premium waiver'], description: 'Comprehensive life insurance for your family' },
    { id: 'LIF002', provider: 'discovery', name: 'Discovery Life Series', coverAmount: 1000000, premium: 450, waitingPeriod: 0, benefits: ['Vitality integration', 'Global cover', 'Income protector'], description: 'Life cover with wellness rewards' },
    { id: 'LIF003', provider: 'liberty', name: 'Liberty Life Cover', coverAmount: 750000, premium: 380, waitingPeriod: 0, benefits: ['Flexible cover', 'Premium increase option', 'Disability benefit'], description: 'Flexible life cover with disability protection' },
    { id: 'LIF004', provider: 'momentum', name: 'Momentum Life Cover', coverAmount: 600000, premium: 320, waitingPeriod: 0, benefits: ['Multiply rewards', 'Premium back', 'Critical illness'], description: 'Life cover with rewards and critical illness benefit' },
    { id: 'LIF005', provider: 'sanlam', name: 'Sanlam Life Cover', coverAmount: 800000, premium: 410, waitingPeriod: 0, benefits: ['Accelerated death benefit', 'Premium waiver', 'Conversion option'], description: 'Comprehensive life protection' },
  ],
  health: [
    { id: 'HLT001', provider: 'discovery', name: 'Discovery Health Plan', coverAmount: 0, premium: 2500, waitingPeriod: 3, benefits: ['Medical aid', 'Hospital cover', 'Chronic medication'], description: 'Full medical aid coverage' },
    { id: 'HLT002', provider: 'momentum', name: 'Momentum Health', coverAmount: 0, premium: 2200, waitingPeriod: 3, benefits: ['Health saver', 'GP network', 'Specialist cover'], description: 'Comprehensive health insurance' },
    { id: 'HLT003', provider: 'bonitas', name: 'Bonitas Medical Fund', coverAmount: 0, premium: 1800, waitingPeriod: 3, benefits: ['Day-to-day cover', 'Hospital plan', 'Maternity benefits'], description: 'Affordable medical aid' },
    { id: 'HLT004', provider: 'fedhealth', name: 'Fedhealth Medical Scheme', coverAmount: 0, premium: 2100, waitingPeriod: 3, benefits: ['Day-to-day savings', 'Hospital cover', 'Chronic cover'], description: 'Flexible medical scheme' },
  ],
  vehicle: [
    { id: 'VEH001', provider: 'santam', name: 'Santam Motor Insurance', coverAmount: 0, premium: 850, waitingPeriod: 0, benefits: ['Comprehensive', 'Roadside assist', 'Car hire'], description: 'Comprehensive vehicle protection' },
    { id: 'VEH002', provider: 'discovery', name: 'Discovery Insure', coverAmount: 0, premium: 780, waitingPeriod: 0, benefits: ['Safe driving rewards', 'Uber credits', 'Glass cover'], description: 'Vehicle insurance with driving rewards' },
    { id: 'VEH003', provider: 'outsurance', name: 'OUTsurance Car', coverAmount: 0, premium: 720, waitingPeriod: 0, benefits: ['OUTbonus', 'Fixed excess', 'Hail cover'], description: 'Car insurance with bonus payouts' },
    { id: 'VEH004', provider: 'hollard', name: 'Hollard Motor Cover', coverAmount: 0, premium: 690, waitingPeriod: 0, benefits: ['Pay as you drive', 'Accident management', 'Windscreen cover'], description: 'Usage-based vehicle insurance' },
    { id: 'VEH005', provider: 'miway', name: 'MiWay Car Insurance', coverAmount: 0, premium: 750, waitingPeriod: 0, benefits: ['No claim bonus', 'Roadside assist', 'Car hire'], description: 'Simple and affordable car insurance' },
  ],
  home: [
    { id: 'HOM001', provider: 'santam', name: 'Santam Home Insurance', coverAmount: 0, premium: 450, waitingPeriod: 0, benefits: ['Building cover', 'Contents cover', 'Liability cover'], description: 'Complete home protection' },
    { id: 'HOM002', provider: 'hollard', name: 'Hollard Home Cover', coverAmount: 0, premium: 380, waitingPeriod: 0, benefits: ['Building insurance', 'Household goods', 'Geyser cover'], description: 'Affordable home insurance' },
    { id: 'HOM003', provider: 'outsurance', name: 'OUTsurance Home', coverAmount: 0, premium: 420, waitingPeriod: 0, benefits: ['OUTbonus', 'All risk cover', 'Public liability'], description: 'Home insurance with rewards' },
  ],
};

// GroAI Insurance Insights
const insuranceInsights = [
  { type: 'tip', icon: '💡', message: 'Bundling your policies could save R320/month', recommendation: 'Combine your funeral and life cover with the same provider' },
  { type: 'warning', icon: '⚠️', message: 'Your vehicle premium increased 12% this year', recommendation: 'Consider shopping for better rates with your good driving record' },
  { type: 'positive', icon: '✅', message: 'You have R150,000 total life cover', recommendation: 'Consider increasing to R500,000 for better family protection' },
  { type: 'info', icon: '📊', message: 'Funeral cover waiting period expires in 2 months', recommendation: 'Full benefits will be available from June 2025' },
];

// Helper to ensure demo user and insurance data exist
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
  
  // Check if user has any insurance policies
  const existingPolicies = await db.consumerInsurance.findMany({
    where: { userId: DEMO_USER_ID }
  });
  
  // Create a demo policy if none exist
  if (existingPolicies.length === 0) {
    const now = new Date();
    await db.consumerInsurance.create({
      data: {
        id: `POL-DEMO-001`,
        userId: DEMO_USER_ID,
        productId: 'FUN001',
        provider: 'old_mutual',
        name: 'Old Mutual Funeral Plan',
        category: 'funeral',
        coverAmount: 50000,
        premium: 150,
        startDate: new Date(Date.now() - 31536000000),
        status: 'active',
        nextPayment: new Date(Date.now() + 2592000000),
        updatedAt: now,
      }
    });
  }
  
  return user;
}

// GET - Insurance data
export async function GET(request: NextRequest) {
  try {
    await ensureDemoData();
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const category = searchParams.get('category');

    if (action === 'categories') {
      return NextResponse.json({ success: true, data: insuranceCategories });
    }

    if (action === 'providers') {
      return NextResponse.json({ success: true, data: providers });
    }

    if (action === 'products' && category) {
      const categoryProducts = products[category as keyof typeof products] || [];
      const enrichedProducts = categoryProducts.map(p => ({
        ...p,
        providerDetails: providers.find(pr => pr.id === p.provider),
      }));
      return NextResponse.json({ success: true, data: enrichedProducts });
    }

    if (action === 'my-policies') {
      const policies = await db.consumerInsurance.findMany({
        where: { userId: DEMO_USER_ID },
        orderBy: { createdAt: 'desc' }
      });
      
      return NextResponse.json({ 
        success: true, 
        data: policies.map(p => ({
          id: p.id,
          productId: p.productId,
          provider: p.provider,
          name: p.name,
          category: p.category,
          coverAmount: p.coverAmount,
          premium: p.premium,
          startDate: p.startDate?.toISOString(),
          status: p.status,
          nextPayment: p.nextPayment?.toISOString(),
        }))
      });
    }

    if (action === 'quotes' && category) {
      const categoryProducts = products[category as keyof typeof products] || [];
      // Simulate quote comparison
      const quotes = categoryProducts.map(p => ({
        ...p,
        providerDetails: providers.find(pr => pr.id === p.provider),
        estimatedPremium: p.premium,
        features: p.benefits,
      }));
      
      return NextResponse.json({
        success: true,
        data: quotes.sort((a, b) => a.premium - b.premium),
      });
    }

    if (action === 'insights') {
      return NextResponse.json({
        success: true,
        data: {
          insights: insuranceInsights,
          recommendations: [
            { type: 'coverage_gap', message: 'Consider adding vehicle insurance for complete protection', priority: 'high' },
            { type: 'savings', message: 'Bundling policies could save R350/month', priority: 'medium' },
            { type: 'review', message: 'Your funeral cover is below recommended amount', priority: 'low' },
          ],
        },
      });
    }

    if (action === 'all-providers') {
      return NextResponse.json({
        success: true,
        data: {
          providers,
          total: providers.length,
        },
      });
    }

    // Default: return comprehensive insurance data
    // Fetch user policies from database
    const userPolicies = await db.consumerInsurance.findMany({
      where: { userId: DEMO_USER_ID },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: {
        categories: insuranceCategories,
        providers,
        insights: insuranceInsights,
        userPolicies: userPolicies.map(p => ({
          id: p.id,
          productId: p.productId,
          provider: p.provider,
          name: p.name,
          category: p.category,
          coverAmount: p.coverAmount,
          premium: p.premium,
          startDate: p.startDate?.toISOString(),
          status: p.status,
          nextPayment: p.nextPayment?.toISOString(),
        })),
        totalCover: userPolicies.reduce((sum, p) => sum + p.coverAmount, 0),
        monthlyPremium: userPolicies.reduce((sum, p) => sum + p.premium, 0),
      },
    });
  } catch (error) {
    console.error('Insurance GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch insurance data' }, { status: 500 });
  }
}

// POST - Purchase insurance
export async function POST(request: NextRequest) {
  try {
    await ensureDemoData();
    const body = await request.json();
    const { action, productId, personalDetails } = body;

    if (action === 'purchase' && productId) {
      // Find product across all categories
      let product = null;
      let category = '';
      for (const [cat, prods] of Object.entries(products)) {
        const found = prods.find(p => p.id === productId);
        if (found) {
          product = found;
          category = cat;
          break;
        }
      }

      if (!product) {
        return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
      }

      const now = new Date();
      const policy = await db.consumerInsurance.create({
        data: {
          id: `POL${Date.now()}`,
          userId: DEMO_USER_ID,
          productId: product.id,
          provider: product.provider,
          name: product.name,
          category,
          coverAmount: product.coverAmount,
          premium: product.premium,
          startDate: new Date(),
          status: 'pending',
          nextPayment: new Date(Date.now() + 2592000000),
          personalDetails: personalDetails ? JSON.stringify({
            name: personalDetails.name,
            idNumber: '****' + personalDetails.idNumber?.slice(-4)
          }) : null,
          updatedAt: now,
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          id: policy.id,
          productId: policy.productId,
          provider: policy.provider,
          name: policy.name,
          category: policy.category,
          coverAmount: policy.coverAmount,
          premium: policy.premium,
          startDate: policy.startDate?.toISOString(),
          status: policy.status,
        },
        message: `Insurance policy created. First premium of R${product.premium} will be debited on activation.`,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Insurance POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process request' }, { status: 500 });
  }
}
