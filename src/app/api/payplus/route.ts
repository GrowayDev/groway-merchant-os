import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

// ==================== Pay+ (Earned Wage Access) API ====================
// Comprehensive EWA module synced with Merchant OS and Grosell

// Pay+ Configuration Constants
const PAYPLUS_CONFIG = {
  maxAccessPercent: 0.60,        // 60% of accrued salary
  serviceFeePercent: 2.5,        // 2.5% service fee
  minAdvanceAmount: 100,         // Minimum R100
  maxAdvanceAmount: 15000,       // Maximum R15,000
  maxAdvancesPerMonth: 2,        // Maximum 2 advances per month
  minEmploymentDays: 90,         // 3 months minimum employment
  settlementTime: 'instant',     // instant settlement to wallet
};

// Demo user ID for testing
const DEMO_USER_ID = 'demo-consumer-user-001';
const DEMO_MERCHANT_ID = 'demo-merchant-001';

// Helper: Calculate days worked in current pay period
function calculateDaysWorked(payDay: number): { daysWorked: number; daysInPeriod: number; daysUntilPayday: number } {
  const now = new Date();
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  
  // Calculate days worked in current pay period
  let daysWorked: number;
  if (currentDay >= payDay) {
    // After pay day - count from pay day to today
    daysWorked = currentDay - payDay + 1;
  } else {
    // Before pay day - count from previous pay day to today
    daysWorked = (daysInMonth - payDay) + currentDay + 1;
  }
  
  // Calculate days until next payday
  let nextPayday: Date;
  if (currentDay < payDay) {
    nextPayday = new Date(now.getFullYear(), now.getMonth(), payDay);
  } else {
    nextPayday = new Date(now.getFullYear(), now.getMonth() + 1, payDay);
  }
  const daysUntilPayday = Math.ceil((nextPayday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return { daysWorked, daysInPeriod: daysInMonth, daysUntilPayday };
}

// Helper: Calculate accrued salary
function calculateAccruedSalary(monthlySalary: number, payDay: number): {
  dailyRate: number;
  daysWorked: number;
  accruedSalary: number;
  maxAdvance: number;
  daysUntilPayday: number;
} {
  const { daysWorked, daysInPeriod, daysUntilPayday } = calculateDaysWorked(payDay);
  const dailyRate = monthlySalary / daysInPeriod;
  const accruedSalary = dailyRate * daysWorked;
  const maxAdvance = accruedSalary * PAYPLUS_CONFIG.maxAccessPercent;
  
  return {
    dailyRate: Math.round(dailyRate * 100) / 100,
    daysWorked,
    accruedSalary: Math.round(accruedSalary * 100) / 100,
    maxAdvance: Math.round(maxAdvance * 100) / 100,
    daysUntilPayday,
  };
}

// Helper: Generate reference number
function generateReferenceNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `EWA${dateStr}${random}`;
}

// Helper: Ensure demo data exists for testing
async function ensureDemoData() {
  try {
    // Check if demo employee exists
    let employee = await db.payPlusEmployee.findFirst({
      where: { phone: '+27821234567' }
    });
    
    if (!employee) {
      const now = new Date();
      const startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000); // 6 months ago
      
      employee = await db.payPlusEmployee.create({
        data: {
          id: randomUUID(),
          merchantId: DEMO_MERCHANT_ID,
          merchantName: 'Acme Corp (Pty) Ltd',
          firstName: 'Thabo',
          lastName: 'Molefe',
          phone: '+27821234567',
          email: 'thabo.molefe@example.com',
          department: 'Sales',
          position: 'Sales Representative',
          monthlySalary: 25000,
          payDay: 25,
          startDate: startDate.toISOString().split('T')[0],
          status: 'active',
          payplusEligible: true,
          merchantOSVerified: true,
          grosellVerified: true,
          updatedAt: now,
        },
      });
    }
    
    return employee;
  } catch (error) {
    console.error('Error ensuring demo data:', error);
    return null;
  }
}

// GET - Pay+ data and status
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  const phone = searchParams.get('phone');
  const employeeId = searchParams.get('employeeId');
  const merchantId = searchParams.get('merchantId');

  try {
    // GET config - Return Pay+ configuration
    if (action === 'config') {
      return NextResponse.json({
        success: true,
        data: {
          ...PAYPLUS_CONFIG,
          features: [
            'Access up to 60% of accrued salary',
            'Instant transfer to your Groway wallet',
            'No interest charged - flat service fee only',
            `Service fee: ${PAYPLUS_CONFIG.serviceFeePercent}% of advance amount`,
            'Automatic repayment on payday via payroll deduction',
            `Maximum ${PAYPLUS_CONFIG.maxAdvancesPerMonth} advances per month`,
            `Minimum employment: ${PAYPLUS_CONFIG.minEmploymentDays} days`,
          ],
          eligibility: [
            'Employed for 3+ months with registered employer',
            'Salary paid via bank account or payroll system',
            'Employer registered with Pay+ via Merchant OS',
            'No outstanding advances or late repayments',
            'Active Groway wallet account',
          ],
          compliance: {
            ncaCompliant: true,
            noInterestCharged: true,
            feeTransparent: true,
            autoDeduction: true,
          },
        },
      });
    }

    // GET status - Return employee Pay+ status and available advance
    if (action === 'status') {
      // Ensure demo data exists
      const demoEmployee = await ensureDemoData();
      
      // Find employee by phone or ID
      let employee = null;
      if (employeeId) {
        employee = await db.payPlusEmployee.findUnique({
          where: { id: employeeId },
        });
      } else if (phone) {
        employee = await db.payPlusEmployee.findFirst({
          where: { phone },
        });
      }
      
      // Use demo employee if no specific employee found
      if (!employee && demoEmployee) {
        employee = demoEmployee;
      }

      if (!employee) {
        // Return demo data for unregistered users
        const demoSalary = 25000;
        const demoPayDay = 25;
        const { dailyRate, daysWorked, accruedSalary, maxAdvance, daysUntilPayday } = calculateAccruedSalary(demoSalary, demoPayDay);
        
        return NextResponse.json({
          success: true,
          data: {
            registered: false,
            eligible: false,
            reason: 'Employee not registered for Pay+. Please contact your employer to enable this benefit.',
            demo: {
              employeeId: 'DEMO001',
              employer: 'Demo Company (Pty) Ltd',
              monthlySalary: demoSalary,
              payDay: demoPayDay,
              dailyRate,
              daysWorked,
              accruedSalary,
              maxAdvance,
              daysUntilPayday,
              nextPayDay: new Date(new Date().getFullYear(), new Date().getMonth() + 1, demoPayDay).toISOString(),
            },
          },
        });
      }

      // Check if employee is eligible
      if (!employee.payplusEligible) {
        return NextResponse.json({
          success: true,
          data: {
            registered: true,
            eligible: false,
            reason: 'Employee not yet eligible for Pay+. Please wait for employer verification.',
            employee: {
              id: employee.id,
              name: `${employee.firstName} ${employee.lastName}`,
              employer: employee.merchantName,
            },
          },
        });
      }

      // Calculate current advance availability
      const { dailyRate, daysWorked, accruedSalary, maxAdvance, daysUntilPayday } = calculateAccruedSalary(
        employee.monthlySalary,
        employee.payDay
      );

      // Get advances this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const advancesThisMonth = await db.payPlusAdvance.count({
        where: {
          employeeId: employee.id,
          createdAt: { gte: startOfMonth },
          status: { in: ['approved', 'processing', 'settled'] },
        },
      });

      // Get outstanding advance amount
      const outstandingAdvances = await db.payPlusAdvance.aggregate({
        where: {
          employeeId: employee.id,
          status: { in: ['approved', 'processing', 'settled'] },
        },
        _sum: { requestedAmount: true },
      });
      const outstandingAmount = outstandingAdvances._sum.requestedAmount || 0;

      // Calculate available advance (max minus outstanding)
      const availableAdvance = Math.max(0, maxAdvance - outstandingAmount);
      const canRequest = employee.status === 'active' && 
                        advancesThisMonth < PAYPLUS_CONFIG.maxAdvancesPerMonth && 
                        availableAdvance >= PAYPLUS_CONFIG.minAdvanceAmount;

      return NextResponse.json({
        success: true,
        data: {
          registered: true,
          eligible: true,
          employee: {
            id: employee.id,
            name: `${employee.firstName} ${employee.lastName}`,
            employer: employee.merchantName,
            department: employee.department,
            position: employee.position,
          },
          salary: {
            monthlySalary: employee.monthlySalary,
            dailyRate,
            payDay: employee.payDay,
            salaryFrequency: employee.salaryFrequency,
          },
          accrual: {
            daysWorked,
            accruedSalary,
            maxAdvance,
            availableAdvance,
            outstandingAmount,
          },
          limits: {
            advancesThisMonth,
            maxAdvancesPerMonth: PAYPLUS_CONFIG.maxAdvancesPerMonth,
            advancesRemaining: PAYPLUS_CONFIG.maxAdvancesPerMonth - advancesThisMonth,
          },
          timing: {
            daysUntilPayday,
            nextPayDay: new Date(new Date().getFullYear(), new Date().getMonth() + 1, employee.payDay).toISOString(),
          },
          canRequest,
          feeExample: {
            amount: 1000,
            feePercent: PAYPLUS_CONFIG.serviceFeePercent,
            fee: 1000 * (PAYPLUS_CONFIG.serviceFeePercent / 100),
            net: 1000 - (1000 * (PAYPLUS_CONFIG.serviceFeePercent / 100)),
          },
        },
      });
    }

    // GET history - Return advance history for employee
    if (action === 'history') {
      // Ensure demo data exists
      const demoEmployee = await ensureDemoData();
      
      let employee = null;
      if (employeeId) {
        employee = await db.payPlusEmployee.findUnique({ where: { id: employeeId } });
      } else if (phone) {
        employee = await db.payPlusEmployee.findFirst({ where: { phone } });
      }
      
      if (!employee && demoEmployee) {
        employee = demoEmployee;
      }

      if (!employee) {
        return NextResponse.json({
          success: true,
          data: [],
        });
      }

      const advances = await db.payPlusAdvance.findMany({
        where: { employeeId: employee.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      return NextResponse.json({
        success: true,
        data: advances,
      });
    }

    // GET calculate - Calculate fee for a specific amount
    if (action === 'calculate') {
      const amount = parseFloat(searchParams.get('amount') || '1000');
      
      // Ensure demo data
      const demoEmployee = await ensureDemoData();
      
      let employee = null;
      const empId = searchParams.get('employeeId');
      const empPhone = searchParams.get('phone');

      if (empId) {
        employee = await db.payPlusEmployee.findUnique({ where: { id: empId } });
      } else if (empPhone) {
        employee = await db.payPlusEmployee.findFirst({ where: { phone: empPhone } });
      }
      
      if (!employee && demoEmployee) {
        employee = demoEmployee;
      }

      // Default calculation if no employee found
      if (!employee) {
        const maxAdvance = 11250; // Demo max
        const fee = amount * (PAYPLUS_CONFIG.serviceFeePercent / 100);
        return NextResponse.json({
          success: true,
          data: {
            requestedAmount: amount,
            serviceFeePercent: PAYPLUS_CONFIG.serviceFeePercent,
            serviceFee: Math.round(fee * 100) / 100,
            netAmount: Math.round((amount - fee) * 100) / 100,
            canAfford: amount <= maxAdvance,
            maxAvailable: maxAdvance,
          },
        });
      }

      const { maxAdvance } = calculateAccruedSalary(employee.monthlySalary, employee.payDay);
      
      // Get outstanding advances
      const outstandingAdvances = await db.payPlusAdvance.aggregate({
        where: {
          employeeId: employee.id,
          status: { in: ['approved', 'processing', 'settled'] },
        },
        _sum: { requestedAmount: true },
      });
      const outstandingAmount = outstandingAdvances._sum.requestedAmount || 0;
      const availableAdvance = Math.max(0, maxAdvance - outstandingAmount);

      const fee = amount * (PAYPLUS_CONFIG.serviceFeePercent / 100);

      return NextResponse.json({
        success: true,
        data: {
          requestedAmount: amount,
          serviceFeePercent: PAYPLUS_CONFIG.serviceFeePercent,
          serviceFee: Math.round(fee * 100) / 100,
          netAmount: Math.round((amount - fee) * 100) / 100,
          canAfford: amount <= availableAdvance,
          maxAvailable: availableAdvance,
          utilizationPercent: Math.round((amount / maxAdvance) * 100),
        },
      });
    }

    // GET merchant - Get Pay+ status for a merchant
    if (action === 'merchant') {
      if (!merchantId) {
        return NextResponse.json({
          success: false,
          error: 'Merchant ID required',
        }, { status: 400 });
      }

      const config = await db.payPlusMerchantConfig.findUnique({
        where: { merchantId },
      });

      const employeeCount = await db.payPlusEmployee.count({
        where: { merchantId, status: 'active' },
      });

      return NextResponse.json({
        success: true,
        data: {
          enabled: config?.enabled ?? false,
          config: config || null,
          employeeCount,
        },
      });
    }

    // Default: Return overview
    return NextResponse.json({
      success: true,
      data: {
        message: 'Pay+ Earned Wage Access API',
        version: '2.0',
        endpoints: {
          'GET ?action=config': 'Get Pay+ configuration',
          'GET ?action=status&phone=xxx': 'Get employee status and available advance',
          'GET ?action=history&employeeId=xxx': 'Get advance history',
          'GET ?action=calculate&amount=xxx': 'Calculate fee for amount',
          'GET ?action=merchant&merchantId=xxx': 'Get merchant Pay+ status',
          'POST': 'Request a new advance',
        },
      },
    });
  } catch (error: any) {
    console.error('Pay+ GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process request',
      details: error.message,
    }, { status: 500 });
  }
}

// POST - Request advance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      amount, 
      reason, 
      employeeId, 
      phone,
      merchantId,
      autoConfirm = false,
    } = body;

    // Validate required fields
    if (!amount || amount < PAYPLUS_CONFIG.minAdvanceAmount) {
      return NextResponse.json({
        success: false,
        error: `Minimum advance amount is R${PAYPLUS_CONFIG.minAdvanceAmount}`,
      }, { status: 400 });
    }

    if (amount > PAYPLUS_CONFIG.maxAdvanceAmount) {
      return NextResponse.json({
        success: false,
        error: `Maximum advance amount is R${PAYPLUS_CONFIG.maxAdvanceAmount}`,
      }, { status: 400 });
    }

    // Ensure demo data exists
    const demoEmployee = await ensureDemoData();

    // Find or create employee
    let employee = null;
    if (employeeId) {
      employee = await db.payPlusEmployee.findUnique({ where: { id: employeeId } });
    } else if (phone) {
      employee = await db.payPlusEmployee.findFirst({ where: { phone } });
    }
    
    // Use demo employee if none found
    if (!employee && demoEmployee) {
      employee = demoEmployee;
    }

    // For demo/unregistered users with merchantId, create a temporary employee record
    if (!employee && merchantId) {
      // Verify merchant exists
      const merchant = await db.merchant.findUnique({ where: { id: merchantId } });
      if (!merchant) {
        return NextResponse.json({
          success: false,
          error: 'Merchant not found',
        }, { status: 400 });
      }

      // Create demo employee
      const employeeRecordId = randomUUID();
      employee = await db.payPlusEmployee.create({
        data: {
          id: employeeRecordId,
          merchantId,
          merchantName: merchant.name,
          firstName: 'Demo',
          lastName: 'Employee',
          phone: phone || `demo-${Date.now()}`,
          monthlySalary: 25000,
          payDay: 25,
          startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 months ago
          status: 'active',
          payplusEligible: true,
          merchantOSVerified: true,
          grosellVerified: true,
        },
      });
    }

    if (!employee) {
      return NextResponse.json({
        success: false,
        error: 'Employee not found. Please register with your employer first.',
      }, { status: 400 });
    }

    // Check eligibility
    if (!employee.payplusEligible) {
      return NextResponse.json({
        success: false,
        error: 'You are not eligible for Pay+ advances yet',
      }, { status: 400 });
    }

    if (employee.status !== 'active') {
      return NextResponse.json({
        success: false,
        error: 'Your account is not active',
      }, { status: 400 });
    }

    // Calculate available advance
    const { dailyRate, daysWorked, accruedSalary, maxAdvance, daysUntilPayday } = calculateAccruedSalary(
      employee.monthlySalary,
      employee.payDay
    );

    // Check monthly limit
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const advancesThisMonth = await db.payPlusAdvance.count({
      where: {
        employeeId: employee.id,
        createdAt: { gte: startOfMonth },
        status: { in: ['approved', 'processing', 'settled'] },
      },
    });

    if (advancesThisMonth >= PAYPLUS_CONFIG.maxAdvancesPerMonth) {
      return NextResponse.json({
        success: false,
        error: `You have reached the maximum of ${PAYPLUS_CONFIG.maxAdvancesPerMonth} advances this month`,
      }, { status: 400 });
    }

    // Check outstanding advances
    const outstandingAdvances = await db.payPlusAdvance.aggregate({
      where: {
        employeeId: employee.id,
        status: { in: ['approved', 'processing', 'settled'] },
      },
      _sum: { requestedAmount: true },
    });
    const outstandingAmount = outstandingAdvances._sum.requestedAmount || 0;
    const availableAdvance = maxAdvance - outstandingAmount;

    if (amount > availableAdvance) {
      return NextResponse.json({
        success: false,
        error: `Maximum available advance is R${availableAdvance.toFixed(2)}`,
      }, { status: 400 });
    }

    // Calculate fees and net amount
    const serviceFee = Math.round(amount * (PAYPLUS_CONFIG.serviceFeePercent / 100) * 100) / 100;
    const netAmount = Math.round((amount - serviceFee) * 100) / 100;

    // Generate reference number
    const referenceNumber = generateReferenceNumber();

    // Calculate repayment date (next payday)
    const now = new Date();
    let repaymentDate: Date;
    if (now.getDate() < employee.payDay) {
      repaymentDate = new Date(now.getFullYear(), now.getMonth(), employee.payDay);
    } else {
      repaymentDate = new Date(now.getFullYear(), now.getMonth() + 1, employee.payDay);
    }

    // Create advance record
    const advanceId = randomUUID();
    const advance = await db.payPlusAdvance.create({
      data: {
        id: advanceId,
        employeeId: employee.id,
        merchantId: employee.merchantId,
        referenceNumber,
        requestedAmount: amount,
        serviceFeePercent: PAYPLUS_CONFIG.serviceFeePercent,
        serviceFeeAmount: serviceFee,
        netAmount,
        accruedSalaryAtRequest: accruedSalary,
        daysWorked,
        dailyRate,
        maxAllowedAmount: maxAdvance,
        utilizationPercent: Math.round((amount / maxAdvance) * 100),
        status: 'approved',
        reason: reason || 'Early wage access',
        repaymentDate: repaymentDate.toISOString().split('T')[0],
        walletCredited: true,
        walletCreditedAt: new Date(),
      },
    });

    // Create transaction record
    await db.payPlusTransaction.create({
      data: {
        id: randomUUID(),
        advanceId: advance.id,
        employeeId: employee.id,
        merchantId: employee.merchantId,
        type: 'advance',
        amount: netAmount,
        direction: 'credit',
        description: `Pay+ advance - ${referenceNumber}`,
        reference: referenceNumber,
        status: 'completed',
      },
    });

    // Create fee transaction
    await db.payPlusTransaction.create({
      data: {
        id: randomUUID(),
        advanceId: advance.id,
        employeeId: employee.id,
        merchantId: employee.merchantId,
        type: 'fee',
        amount: serviceFee,
        direction: 'debit',
        description: `Pay+ service fee - ${referenceNumber}`,
        reference: referenceNumber,
        status: 'completed',
      },
    });

    // Update employee stats
    await db.payPlusEmployee.update({
      where: { id: employee.id },
      data: {
        advancesThisMonth: { increment: 1 },
        totalAdvanceAmount: { increment: amount },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        advance: {
          id: advance.id,
          referenceNumber,
          amount,
          serviceFee,
          netAmount,
          status: 'settled',
          repaymentDate: repaymentDate.toISOString(),
        },
        message: `R${netAmount.toFixed(2)} has been credited to your wallet. Service fee: R${serviceFee.toFixed(2)}. Repayment will be automatically deducted on ${repaymentDate.toLocaleDateString('en-ZA')}.`,
      },
    });
  } catch (error: any) {
    console.error('Pay+ POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process advance request',
      details: error.message,
    }, { status: 500 });
  }
}
