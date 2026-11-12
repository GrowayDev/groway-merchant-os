import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/fraud/rules - List fraud rules with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const view = searchParams.get('view');
    const ruleId = searchParams.get('ruleId');

    // Get single rule with details
    if (ruleId) {
      const rule = await db.fraudRule.findUnique({
        where: { id: ruleId },
      });

      if (!rule) {
        return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
      }

      // Get recent executions
      const executions = await db.fraudRuleExecution.findMany({
        where: { ruleId },
        orderBy: { triggeredAt: 'desc' },
        take: 50,
      });

      // Get versions
      const versions = await db.fraudRuleVersion.findMany({
        where: { ruleId },
        orderBy: { versionNumber: 'desc' },
        take: 10,
      });

      // Get impact analysis
      const impact = await db.fraudRuleImpact.findFirst({
        where: { ruleId },
        orderBy: { periodStart: 'desc' },
      });

      return NextResponse.json({
        rule,
        executions,
        versions,
        impact,
      });
    }

    // Dashboard view
    if (view === 'dashboard') {
      const [
        totalRules,
        activeRules,
        pausedRules,
        totalTriggers24h,
        topTriggeringRules,
        rulesByCategory,
        recentExecutions,
      ] = await Promise.all([
        db.fraudRule.count(),
        db.fraudRule.count({ where: { status: 'active' } }),
        db.fraudRule.count({ where: { status: 'paused' } }),
        db.fraudRule.aggregate({
          _sum: { triggers24h: true },
        }),
        db.fraudRule.findMany({
          where: { status: 'active' },
          orderBy: { triggers24h: 'desc' },
          take: 5,
        }),
        db.fraudRule.groupBy({
          by: ['category'],
          _count: true,
        }),
        db.fraudRuleExecution.findMany({
          take: 20,
          orderBy: { triggeredAt: 'desc' },
        }),
      ]);

      return NextResponse.json({
        stats: {
          totalRules,
          activeRules,
          pausedRules,
          totalTriggers24h: totalTriggers24h._sum.triggers24h || 0,
        },
        topTriggeringRules,
        rulesByCategory: rulesByCategory.reduce((acc, item) => {
          acc[item.category] = item._count;
          return acc;
        }, {} as Record<string, number>),
        recentExecutions,
      });
    }

    // Build filter
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (category) where.category = category;

    const rules = await db.fraudRule.findMany({
      where,
      orderBy: [
        { priority: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Error fetching fraud rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fraud rules' },
      { status: 500 }
    );
  }
}

// POST /api/admin/fraud/rules - Create a new fraud rule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      code,
      description,
      category,
      type = 'threshold',
      priority = 5,
      conditions,
      thresholds,
      actions,
      riskScoreWeight = 1.0,
      autoAction = false,
      autoActionType,
      cooldownMinutes = 60,
    } = body;

    if (!name || !code || !category) {
      return NextResponse.json(
        { error: 'name, code, and category are required' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingRule = await db.fraudRule.findUnique({ where: { code } });
    if (existingRule) {
      return NextResponse.json(
        { error: 'Rule code already exists' },
        { status: 400 }
      );
    }

    const ruleId = `RUL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const rule = await db.fraudRule.create({
      data: {
        id: ruleId,
        name,
        code,
        description,
        category,
        type,
        status: 'active',
        priority,
        conditions: conditions ? JSON.stringify(conditions) : null,
        thresholds: thresholds ? JSON.stringify(thresholds) : null,
        actions: actions ? JSON.stringify(actions) : null,
        riskScoreWeight,
        autoAction,
        autoActionType,
        cooldownMinutes,
        triggers24h: 0,
        triggers7d: 0,
        triggers30d: 0,
        truePositives: 0,
        falsePositives: 0,
      },
    });

    // Create initial version
    await db.fraudRuleVersion.create({
      data: {
        id: `VER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ruleId: rule.id,
        versionNumber: 1,
        name,
        code,
        description,
        category,
        conditions: conditions ? JSON.stringify(conditions) : null,
        thresholds: thresholds ? JSON.stringify(thresholds) : null,
        actions: actions ? JSON.stringify(actions) : null,
        changedBy: body.changedBy || 'system',
        changedByName: body.changedByName || 'System',
        changeReason: 'Initial rule creation',
        isActive: true,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'fraud_rule_created',
        category: 'fraud_rules',
        actorName: body.changedByName || 'System',
        targetType: 'fraud_rule',
        targetId: rule.id,
        targetName: name,
        details: JSON.stringify({ category, type }),
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('Error creating fraud rule:', error);
    return NextResponse.json(
      { error: 'Failed to create fraud rule' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/fraud/rules - Update a fraud rule
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, ...data } = body;

    if (!id || !action) {
      return NextResponse.json(
        { error: 'id and action are required' },
        { status: 400 }
      );
    }

    const existingRule = await db.fraudRule.findUnique({ where: { id } });
    if (!existingRule) {
      return NextResponse.json(
        { error: 'Rule not found' },
        { status: 404 }
      );
    }

    let updateData: Record<string, unknown> = { updatedAt: new Date() };

    switch (action) {
      case 'activate':
        updateData = { ...updateData, status: 'active' };
        break;

      case 'pause':
        updateData = { ...updateData, status: 'paused' };
        break;

      case 'disable':
        updateData = { ...updateData, status: 'disabled' };
        break;

      case 'update':
        updateData = {
          ...updateData,
          ...data,
          conditions: data.conditions ? JSON.stringify(data.conditions) : existingRule.conditions,
          thresholds: data.thresholds ? JSON.stringify(data.thresholds) : existingRule.thresholds,
          actions: data.actions ? JSON.stringify(data.actions) : existingRule.actions,
        };

        // Create new version
        const latestVersion = await db.fraudRuleVersion.findFirst({
          where: { ruleId: id },
          orderBy: { versionNumber: 'desc' },
        });

        const newVersionNumber = (latestVersion?.versionNumber || 0) + 1;

        await db.fraudRuleVersion.create({
          data: {
            id: `VER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ruleId: id,
            versionNumber: newVersionNumber,
            name: data.name || existingRule.name,
            code: existingRule.code,
            description: data.description || existingRule.description,
            category: data.category || existingRule.category,
            conditions: data.conditions ? JSON.stringify(data.conditions) : existingRule.conditions,
            thresholds: data.thresholds ? JSON.stringify(data.thresholds) : existingRule.thresholds,
            actions: data.actions ? JSON.stringify(data.actions) : existingRule.actions,
            changedBy: data.changedBy || 'system',
            changedByName: data.changedByName || 'System',
            changeReason: data.changeReason || 'Rule update',
            isActive: true,
          },
        });
        break;

      case 'test':
        // Simulate rule execution
        const testResult = await simulateRule(existingRule, data.testData);

        // Log test execution
        await db.fraudRuleExecution.create({
          data: {
            id: `EXEC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ruleId: id,
            executionType: 'test',
            inputEntity: data.testData ? JSON.stringify(data.testData) : null,
            result: testResult.passed ? 'pass' : 'fail',
            riskScore: testResult.riskScore,
            matchedConditions: testResult.matchedConditions ? JSON.stringify(testResult.matchedConditions) : null,
          },
        });

        return NextResponse.json({
          success: true,
          testResult,
        });

      case 'simulate':
        // Run impact simulation
        const simulationResult = await simulateRuleImpact(existingRule, data.simulationPeriod || '7d');

        return NextResponse.json({
          success: true,
          simulationResult,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    const updatedRule = await db.fraudRule.update({
      where: { id },
      data: updateData,
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        action: `fraud_rule_${action}`,
        category: 'fraud_rules',
        actorName: data.actorName || 'System',
        targetType: 'fraud_rule',
        targetId: id,
        targetName: existingRule.name,
        details: JSON.stringify({ action }),
      },
    });

    return NextResponse.json(updatedRule);
  } catch (error) {
    console.error('Error updating fraud rule:', error);
    return NextResponse.json(
      { error: 'Failed to update fraud rule' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/fraud/rules - Delete a fraud rule
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    // Soft delete by setting status to disabled
    const rule = await db.fraudRule.update({
      where: { id },
      data: { status: 'disabled' },
    });

    return NextResponse.json({ success: true, rule });
  } catch (error) {
    console.error('Error deleting fraud rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete fraud rule' },
      { status: 500 }
    );
  }
}

// Helper function to simulate rule execution
async function simulateRule(rule: {
  id: string;
  name: string;
  category: string;
  conditions: string | null;
  thresholds: string | null;
  riskScoreWeight: number;
}, testData: Record<string, unknown>) {
  const conditions = rule.conditions ? JSON.parse(rule.conditions) : {};
  const thresholds = rule.thresholds ? JSON.parse(rule.thresholds) : {};

  let riskScore = 0;
  const matchedConditions: string[] = [];

  // Simple simulation logic based on category
  switch (rule.category) {
    case 'velocity':
      if (testData.transactionCount && thresholds.maxTransactions) {
        if (Number(testData.transactionCount) > Number(thresholds.maxTransactions)) {
          riskScore += 30 * rule.riskScoreWeight;
          matchedConditions.push('transaction_count_exceeded');
        }
      }
      break;

    case 'amount':
      if (testData.amount && thresholds.maxAmount) {
        if (Number(testData.amount) > Number(thresholds.maxAmount)) {
          riskScore += 40 * rule.riskScoreWeight;
          matchedConditions.push('amount_exceeded');
        }
      }
      break;

    case 'location':
      if (testData.location && thresholds.blockedLocations) {
        const blockedLocations = JSON.parse(thresholds.blockedLocations as string) as string[];
        if (blockedLocations.includes(String(testData.location))) {
          riskScore += 50 * rule.riskScoreWeight;
          matchedConditions.push('blocked_location');
        }
      }
      break;

    case 'behavior':
      if (testData.behaviorScore && thresholds.behaviorThreshold) {
        if (Number(testData.behaviorScore) > Number(thresholds.behaviorThreshold)) {
          riskScore += 35 * rule.riskScoreWeight;
          matchedConditions.push('anomalous_behavior');
        }
      }
      break;

    default:
      // Generic condition matching
      for (const [key, value] of Object.entries(conditions)) {
        if (testData[key] === value) {
          riskScore += 20 * rule.riskScoreWeight;
          matchedConditions.push(key);
        }
      }
  }

  // Cap at 100
  riskScore = Math.min(riskScore, 100);

  return {
    passed: riskScore < 50,
    riskScore: Math.round(riskScore),
    matchedConditions,
    recommendation: riskScore >= 80 ? 'block' : riskScore >= 50 ? 'review' : 'allow',
  };
}

// Helper function to simulate rule impact
async function simulateRuleImpact(rule: {
  id: string;
  name: string;
  category: string;
}, period: string) {
  // Get existing execution data
  const days = period === '30d' ? 30 : period === '7d' ? 7 : 1;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const executions = await db.fraudRuleExecution.findMany({
    where: {
      ruleId: rule.id,
      triggeredAt: { gte: startDate },
    },
  });

  const totalExecutions = executions.length;
  const failCount = executions.filter(e => e.result === 'fail').length;
  const passCount = executions.filter(e => e.result === 'pass').length;

  // Calculate projected impact
  const projectedBlockRate = totalExecutions > 0 ? (failCount / totalExecutions) * 100 : 0;

  return {
    period,
    totalExecutions,
    passCount,
    failCount,
    projectedBlockRate,
    avgRiskScore: executions.length > 0
      ? executions.reduce((sum, e) => sum + (e.riskScore || 0), 0) / executions.length
      : 0,
    recommendations: [
      projectedBlockRate > 20 ? 'High block rate - consider adjusting thresholds' : 'Block rate within acceptable range',
      failCount > 100 ? 'High trigger volume - review rule effectiveness' : 'Normal trigger volume',
    ],
  };
}
