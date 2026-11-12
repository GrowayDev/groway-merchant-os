import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Credit scoring weights based on NCA best practices
const SCORING_WEIGHTS = {
  paymentHistory: 0.35,       // 35% - Most important factor
  creditUtilization: 0.30,    // 30% - How much of available credit is used
  lengthOfCreditHistory: 0.15, // 15% - How long the account has been active
  typesOfCredit: 0.10,        // 10% - Mix of credit types
  newCreditInquiries: 0.10    // 10% - Recent applications for credit
};

interface CreditScoreBreakdown {
  paymentHistory: {
    score: number;
    weight: number;
    factors: {
      onTimePayments: number;
      latePayments: number;
      missedPayments: number;
      totalPayments: number;
    };
  };
  creditUtilization: {
    score: number;
    weight: number;
    utilizedPercent: number;
    availableCredit: number;
    usedCredit: number;
  };
  lengthOfCreditHistory: {
    score: number;
    weight: number;
    monthsActive: number;
    averageAccountAge: number;
  };
  typesOfCredit: {
    score: number;
    weight: number;
    creditTypes: string[];
    diversityScore: number;
  };
  newCreditInquiries: {
    score: number;
    weight: number;
    recentInquiries: number;
    inquiryImpact: string;
  };
}

interface CreditScoreResult {
  totalScore: number;
  scoreBand: 'excellent' | 'good' | 'fair' | 'poor' | 'very_poor';
  riskRating: string;
  breakdown: CreditScoreBreakdown;
  recommendations: string[];
  lastUpdated: string;
}

// Calculate payment history score (0-100)
function calculatePaymentHistoryScore(repayments: { status: string; paidDate: string | null; dueDate: string }[]): { score: number; factors: CreditScoreBreakdown['paymentHistory']['factors'] } {
  const totalPayments = repayments.length;
  
  if (totalPayments === 0) {
    return {
      score: 75, // Default score for new accounts
      factors: {
        onTimePayments: 0,
        latePayments: 0,
        missedPayments: 0,
        totalPayments: 0
      }
    };
  }

  let onTimePayments = 0;
  let latePayments = 0;
  let missedPayments = 0;

  for (const repayment of repayments) {
    if (repayment.status === 'paid') {
      const paidDate = repayment.paidDate ? new Date(repayment.paidDate) : null;
      const dueDate = new Date(repayment.dueDate);
      
      if (paidDate && paidDate <= dueDate) {
        onTimePayments++;
      } else if (paidDate) {
        latePayments++;
      }
    } else if (repayment.status === 'overdue' || repayment.status === 'defaulted') {
      missedPayments++;
    }
  }

  // Calculate score based on payment performance
  const onTimeRate = totalPayments > 0 ? onTimePayments / totalPayments : 1;
  const latePenalty = latePayments * 5;
  const missedPenalty = missedPayments * 15;
  
  const score = Math.max(0, Math.min(100, (onTimeRate * 100) - latePenalty - missedPenalty));

  return {
    score: Math.round(score),
    factors: {
      onTimePayments,
      latePayments,
      missedPayments,
      totalPayments
    }
  };
}

// Calculate credit utilization score (0-100)
function calculateUtilizationScore(approvedLimit: number, drawnAmount: number): { score: number; utilizedPercent: number } {
  const utilizedPercent = approvedLimit > 0 ? (drawnAmount / approvedLimit) * 100 : 0;
  
  // Scoring based on utilization ranges
  // 0-30%: Excellent (90-100)
  // 31-50%: Good (70-89)
  // 51-70%: Fair (50-69)
  // 71-90%: Poor (30-49)
  // 91-100%: Very Poor (0-29)
  
  let score: number;
  if (utilizedPercent <= 30) {
    score = 90 + (30 - utilizedPercent);
  } else if (utilizedPercent <= 50) {
    score = 70 + ((50 - utilizedPercent) / 20) * 19;
  } else if (utilizedPercent <= 70) {
    score = 50 + ((70 - utilizedPercent) / 20) * 19;
  } else if (utilizedPercent <= 90) {
    score = 30 + ((90 - utilizedPercent) / 20) * 19;
  } else {
    score = Math.max(0, 30 - (utilizedPercent - 90));
  }

  return {
    score: Math.round(score),
    utilizedPercent: Math.round(utilizedPercent * 100) / 100
  };
}

// Calculate length of credit history score (0-100)
function calculateLengthScore(applicationDate: string | null): { score: number; monthsActive: number } {
  if (!applicationDate) {
    return { score: 50, monthsActive: 0 };
  }

  const application = new Date(applicationDate);
  const now = new Date();
  const monthsActive = Math.floor((now.getTime() - application.getTime()) / (1000 * 60 * 60 * 24 * 30));

  // Scoring based on account age
  // 0-6 months: 40-50
  // 6-12 months: 50-65
  // 12-24 months: 65-80
  // 24-36 months: 80-90
  // 36+ months: 90-100

  let score: number;
  if (monthsActive < 6) {
    score = 40 + (monthsActive / 6) * 10;
  } else if (monthsActive < 12) {
    score = 50 + ((monthsActive - 6) / 6) * 15;
  } else if (monthsActive < 24) {
    score = 65 + ((monthsActive - 12) / 12) * 15;
  } else if (monthsActive < 36) {
    score = 80 + ((monthsActive - 24) / 12) * 10;
  } else {
    score = Math.min(100, 90 + ((monthsActive - 36) / 12) * 2.5);
  }

  return {
    score: Math.round(score),
    monthsActive
  };
}

// Calculate types of credit score (0-100)
function calculateTypesOfCreditScore(drawRequests: { purpose: string | null }[]): { score: number; creditTypes: string[]; diversityScore: number } {
  const creditTypes = new Set<string>();
  
  for (const request of drawRequests) {
    if (request.purpose) {
      creditTypes.add(request.purpose);
    }
  }

  const typesList = Array.from(creditTypes);
  
  // Base score plus diversity bonus
  const diversityScore = typesList.length;
  const score = Math.min(100, 60 + (diversityScore * 10));

  return {
    score,
    creditTypes: typesList,
    diversityScore
  };
}

// Calculate new credit inquiries score (0-100)
function calculateNewCreditScore(drawRequests: { createdAt: Date; status: string }[]): { score: number; recentInquiries: number; inquiryImpact: string } {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - (180 * 24 * 60 * 60 * 1000));
  
  const recentInquiries = drawRequests.filter(
    req => new Date(req.createdAt) > sixMonthsAgo && req.status === 'pending'
  ).length;

  // Impact based on recent inquiries
  // 0-1: Minimal impact (85-100)
  // 2-3: Moderate impact (70-84)
  // 4-5: Significant impact (50-69)
  // 6+: Major impact (0-49)

  let score: number;
  let inquiryImpact: string;

  if (recentInquiries === 0) {
    score = 100;
    inquiryImpact = 'No recent credit activity';
  } else if (recentInquiries === 1) {
    score = 95;
    inquiryImpact = 'Minimal impact from recent inquiry';
  } else if (recentInquiries <= 3) {
    score = 85 - (recentInquiries - 1) * 5;
    inquiryImpact = 'Moderate impact from recent inquiries';
  } else if (recentInquiries <= 5) {
    score = 70 - (recentInquiries - 3) * 10;
    inquiryImpact = 'Significant impact - multiple recent inquiries';
  } else {
    score = Math.max(20, 50 - (recentInquiries - 5) * 5);
    inquiryImpact = 'High impact - many recent credit applications';
  }

  return {
    score,
    recentInquiries,
    inquiryImpact
  };
}

// Determine score band based on total score
function getScoreBand(score: number): CreditScoreResult['scoreBand'] {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 55) return 'fair';
  if (score >= 40) return 'poor';
  return 'very_poor';
}

// Get risk rating based on score band
function getRiskRating(band: CreditScoreResult['scoreBand']): string {
  const ratings = {
    excellent: 'Low Risk - Excellent credit profile',
    good: 'Low-Medium Risk - Good payment behavior',
    fair: 'Medium Risk - Some credit concerns',
    poor: 'Medium-High Risk - Significant credit issues',
    very_poor: 'High Risk - Serious credit problems'
  };
  return ratings[band];
}

// Generate recommendations based on breakdown
function generateRecommendations(breakdown: CreditScoreBreakdown): string[] {
  const recommendations: string[] = [];

  // Payment history recommendations
  if (breakdown.paymentHistory.score < 80) {
    if (breakdown.paymentHistory.factors.missedPayments > 0) {
      recommendations.push('Address all missed payments immediately to improve your payment history score');
    }
    if (breakdown.paymentHistory.factors.latePayments > 0) {
      recommendations.push('Set up automatic payments or reminders to avoid late payments');
    }
  }

  // Utilization recommendations
  if (breakdown.creditUtilization.utilizedPercent > 50) {
    recommendations.push('Reduce your credit utilization below 50% to improve your score');
  }
  if (breakdown.creditUtilization.utilizedPercent > 30) {
    recommendations.push('Aim to keep credit utilization below 30% for optimal scoring');
  }

  // Credit history recommendations
  if (breakdown.lengthOfCreditHistory.monthsActive < 12) {
    recommendations.push('Maintain your account in good standing to build credit history');
  }

  // New credit recommendations
  if (breakdown.newCreditInquiries.recentInquiries > 3) {
    recommendations.push('Avoid applying for multiple credit facilities in a short period');
  }

  // Positive reinforcement
  if (breakdown.paymentHistory.score >= 90 && breakdown.creditUtilization.utilizedPercent <= 30) {
    recommendations.push('Excellent credit management! Keep up the good work');
  }

  return recommendations;
}

// GET /api/grocredit/credit-score - Get credit score for a merchant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId') || 'demo-merchant';

    // Get facility data
    const facility = await db.merchantCredit.findUnique({
      where: { merchantId },
      include: {
        drawRequests: {
          orderBy: { createdAt: 'desc' },
          take: 50
        },
        repayments: {
          orderBy: { dueDate: 'desc' },
          take: 50
        }
      }
    });

    if (!facility) {
      return NextResponse.json(
        { success: false, error: 'Credit facility not found' },
        { status: 404 }
      );
    }

    // Calculate individual components
    const paymentHistoryResult = calculatePaymentHistoryScore(
      facility.repayments.map(r => ({
        status: r.status,
        paidDate: r.paidDate,
        dueDate: r.dueDate
      }))
    );

    const utilizationResult = calculateUtilizationScore(
      facility.approvedLimit,
      facility.drawnAmount
    );

    const lengthResult = calculateLengthScore(facility.applicationDate || null);

    const typesResult = calculateTypesOfCreditScore(
      facility.drawRequests.map(d => ({ purpose: d.purpose }))
    );

    const newCreditResult = calculateNewCreditScore(
      facility.drawRequests.map(d => ({ createdAt: d.createdAt, status: d.status }))
    );

    // Calculate weighted total score
    const totalScore =
      paymentHistoryResult.score * SCORING_WEIGHTS.paymentHistory +
      utilizationResult.score * SCORING_WEIGHTS.creditUtilization +
      lengthResult.score * SCORING_WEIGHTS.lengthOfCreditHistory +
      typesResult.score * SCORING_WEIGHTS.typesOfCredit +
      newCreditResult.score * SCORING_WEIGHTS.newCreditInquiries;

    // Build breakdown
    const breakdown: CreditScoreBreakdown = {
      paymentHistory: {
        score: paymentHistoryResult.score,
        weight: SCORING_WEIGHTS.paymentHistory,
        factors: paymentHistoryResult.factors
      },
      creditUtilization: {
        score: utilizationResult.score,
        weight: SCORING_WEIGHTS.creditUtilization,
        utilizedPercent: utilizationResult.utilizedPercent,
        availableCredit: facility.approvedLimit - facility.drawnAmount,
        usedCredit: facility.drawnAmount
      },
      lengthOfCreditHistory: {
        score: lengthResult.score,
        weight: SCORING_WEIGHTS.lengthOfCreditHistory,
        monthsActive: lengthResult.monthsActive,
        averageAccountAge: lengthResult.monthsActive
      },
      typesOfCredit: {
        score: typesResult.score,
        weight: SCORING_WEIGHTS.typesOfCredit,
        creditTypes: typesResult.creditTypes,
        diversityScore: typesResult.diversityScore
      },
      newCreditInquiries: {
        score: newCreditResult.score,
        weight: SCORING_WEIGHTS.newCreditInquiries,
        recentInquiries: newCreditResult.recentInquiries,
        inquiryImpact: newCreditResult.inquiryImpact
      }
    };

    const scoreBand = getScoreBand(totalScore);
    const recommendations = generateRecommendations(breakdown);

    const result: CreditScoreResult = {
      totalScore: Math.round(totalScore),
      scoreBand,
      riskRating: getRiskRating(scoreBand),
      breakdown,
      recommendations,
      lastUpdated: new Date().toISOString()
    };

    // Update the facility's risk score
    await db.merchantCredit.update({
      where: { merchantId },
      data: {
        riskScore: Math.round(totalScore),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error calculating credit score:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate credit score' },
      { status: 500 }
    );
  }
}

// POST /api/grocredit/credit-score - Request a credit score recalculation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantId, forceRefresh } = body;

    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: 'Merchant ID is required' },
        { status: 400 }
      );
    }

    // If not forcing refresh, check if recent calculation exists
    if (!forceRefresh) {
      const facility = await db.merchantCredit.findUnique({
        where: { merchantId },
        select: { updatedAt: true, riskScore: true }
      });

      if (facility && facility.updatedAt) {
        const lastUpdate = new Date(facility.updatedAt);
        const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceUpdate < 24 && facility.riskScore > 0) {
          return NextResponse.json({
            success: true,
            message: 'Credit score is up to date',
            data: {
              score: facility.riskScore,
              lastUpdated: lastUpdate.toISOString()
            }
          });
        }
      }
    }

    // Trigger recalculation by calling GET
    const url = new URL(request.url);
    url.searchParams.set('merchantId', merchantId);
    
    const getRequest = new NextRequest(url.toString(), { method: 'GET' });
    return GET(getRequest);
  } catch (error) {
    console.error('Error in credit score recalculation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to recalculate credit score' },
      { status: 500 }
    );
  }
}
