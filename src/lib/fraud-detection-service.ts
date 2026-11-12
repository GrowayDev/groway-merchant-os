/**
 * Fraud Detection Service
 * Centralized fraud detection for all Groways applications
 */

import { db } from '@/lib/db';

// Types
export interface FraudCheckResult {
  passed: boolean;
  riskScore: number;
  alerts: FraudAlertData[];
  blocked: boolean;
  recommendation: 'allow' | 'review' | 'block';
}

export interface FraudCheckContext {
  entityType: 'merchant' | 'consumer' | 'transaction';
  entityId: string;
  amount?: number;
  currency?: string;
  merchantId?: string;
  userId?: string;
  deviceId?: string;
  ipAddress?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    city?: string;
    country?: string;
  };
  metadata?: Record<string, unknown>;
  sourceApp: string;
}

export interface FraudAlertData {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  rule?: string;
  ruleId?: string;
  details?: Record<string, unknown>;
  riskScore: number;
}

// Default fraud rules configuration
const DEFAULT_RULES = [
  {
    name: 'High Velocity Check',
    code: 'VELOCITY_HIGH',
    category: 'velocity',
    type: 'threshold',
    priority: 1,
    description: 'Flags when more than 5 transactions occur within 10 minutes',
    conditions: { countThreshold: 5, timeWindowMinutes: 10 },
    thresholds: { transactionCount: 5, amountTotal: 50000 },
    actions: { action: 'alert', autoBlock: false },
    riskScoreWeight: 1.5,
  },
  {
    name: 'High Value Transaction',
    code: 'AMOUNT_HIGH',
    category: 'amount',
    type: 'threshold',
    priority: 1,
    description: 'Flags transactions above R100,000',
    conditions: { amountThreshold: 100000 },
    thresholds: { singleAmount: 100000 },
    actions: { action: 'review', autoBlock: false },
    riskScoreWeight: 1.3,
  },
  {
    name: 'Geolocation Anomaly',
    code: 'LOCATION_ANOMALY',
    category: 'location',
    type: 'rule_engine',
    priority: 2,
    description: 'Flags transactions from unexpected locations (>500km from usual)',
    conditions: { distanceThreshold: 500 },
    thresholds: { distanceKm: 500 },
    actions: { action: 'alert', autoBlock: false },
    riskScoreWeight: 1.2,
  },
  {
    name: 'New Device Detection',
    code: 'DEVICE_NEW',
    category: 'device',
    type: 'rule_engine',
    priority: 3,
    description: 'Flags first transactions from new devices',
    conditions: { firstTransaction: true },
    thresholds: {},
    actions: { action: 'alert', autoBlock: false },
    riskScoreWeight: 0.8,
  },
  {
    name: 'Behavior Pattern Anomaly',
    code: 'BEHAVIOR_ANOMALY',
    category: 'behavior',
    type: 'ml_model',
    priority: 2,
    description: 'AI-detected unusual transaction patterns',
    conditions: { modelThreshold: 0.7 },
    thresholds: { anomalyScore: 0.7 },
    actions: { action: 'alert', autoBlock: false },
    riskScoreWeight: 1.4,
  },
  {
    name: 'Night Transaction Alert',
    code: 'NIGHT_TRANSACTION',
    category: 'pattern',
    type: 'threshold',
    priority: 2,
    description: 'Flags high-value transactions between midnight and 5am',
    conditions: { startHour: 0, endHour: 5, minAmount: 10000 },
    thresholds: { amount: 10000 },
    actions: { action: 'alert', autoBlock: false },
    riskScoreWeight: 1.1,
  },
  {
    name: 'Rapid Successive Failures',
    code: 'RAPID_FAILURES',
    category: 'behavior',
    type: 'threshold',
    priority: 1,
    description: 'Flags after 3 failed attempts within 5 minutes',
    conditions: { failureThreshold: 3, timeWindowMinutes: 5 },
    thresholds: { failureCount: 3 },
    actions: { action: 'block', autoBlock: true },
    riskScoreWeight: 2.0,
  },
  {
    name: 'Cross-border Transaction',
    code: 'CROSS_BORDER',
    category: 'location',
    type: 'rule_engine',
    priority: 2,
    description: 'Flags transactions from different countries within 24 hours',
    conditions: { countryChange: true, timeWindowHours: 24 },
    thresholds: {},
    actions: { action: 'review', autoBlock: false },
    riskScoreWeight: 1.5,
  },
  {
    name: 'Unusual Amount Pattern',
    code: 'AMOUNT_PATTERN',
    category: 'pattern',
    type: 'ml_model',
    priority: 2,
    description: 'Flags amounts significantly different from user average',
    conditions: { deviationMultiplier: 5 },
    thresholds: { deviationFromAverage: 5 },
    actions: { action: 'alert', autoBlock: false },
    riskScoreWeight: 1.2,
  },
  {
    name: 'IP Blacklist Check',
    code: 'IP_BLACKLIST',
    category: 'device',
    type: 'rule_engine',
    priority: 1,
    description: 'Blocks transactions from blacklisted IPs',
    conditions: { checkBlacklist: true },
    thresholds: {},
    actions: { action: 'block', autoBlock: true },
    riskScoreWeight: 2.5,
  },
];

/**
 * Seed default fraud rules into the database
 */
export async function seedFraudRules(): Promise<void> {
  for (const rule of DEFAULT_RULES) {
    const existing = await db.fraudRule.findUnique({
      where: { code: rule.code }
    });

    if (!existing) {
      await db.fraudRule.create({
        data: {
          id: `fr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: rule.name,
          code: rule.code,
          category: rule.category,
          type: rule.type,
          priority: rule.priority,
          description: rule.description,
          conditions: JSON.stringify(rule.conditions),
          thresholds: JSON.stringify(rule.thresholds),
          actions: JSON.stringify(rule.actions),
          riskScoreWeight: rule.riskScoreWeight,
          autoAction: rule.actions.autoBlock || false,
          autoActionType: rule.actions.autoBlock ? 'block' : undefined,
          status: 'active',
        }
      });
    }
  }
}

/**
 * Main fraud check function
 */
export async function performFraudCheck(context: FraudCheckContext): Promise<FraudCheckResult> {
  const alerts: FraudAlertData[] = [];
  let totalRiskScore = 0;
  let blocked = false;

  try {
    // Get active fraud rules
    const rules = await db.fraudRule.findMany({
      where: { status: 'active' },
      orderBy: { priority: 'asc' }
    });

    // Check IP blacklist first
    if (context.ipAddress) {
      const ipBlacklisted = await db.iPBlacklist.findFirst({
        where: { ipAddress: context.ipAddress, isActive: true }
      });

      if (ipBlacklisted) {
        alerts.push({
          type: 'device',
          severity: 'critical',
          description: `Transaction from blacklisted IP: ${context.ipAddress}`,
          rule: 'IP_BLACKLIST',
          riskScore: 100,
          details: { ipAddress: context.ipAddress, reason: ipBlacklisted.reason }
        });
        blocked = true;
        totalRiskScore += 100;
      }
    }

    // Check velocity limits
    const velocityAlert = await checkVelocity(context);
    if (velocityAlert) {
      alerts.push(velocityAlert);
      totalRiskScore += velocityAlert.riskScore;
    }

    // Check amount thresholds
    const amountAlert = await checkAmountThreshold(context);
    if (amountAlert) {
      alerts.push(amountAlert);
      totalRiskScore += amountAlert.riskScore;
    }

    // Check location anomalies
    const locationAlert = await checkLocationAnomaly(context);
    if (locationAlert) {
      alerts.push(locationAlert);
      totalRiskScore += locationAlert.riskScore;
    }

    // Check device fingerprint
    const deviceAlert = await checkDeviceFingerprint(context);
    if (deviceAlert) {
      alerts.push(deviceAlert);
      totalRiskScore += deviceAlert.riskScore;
    }

    // Check behavioral patterns
    const behaviorAlert = await checkBehaviorPattern(context);
    if (behaviorAlert) {
      alerts.push(behaviorAlert);
      totalRiskScore += behaviorAlert.riskScore;
    }

    // Check risk profile
    const profileAlert = await checkRiskProfile(context);
    if (profileAlert) {
      alerts.push(profileAlert);
      totalRiskScore += profileAlert.riskScore;
    }

    // Check for auto-block rules
    for (const rule of rules) {
      if (rule.autoAction && rule.autoActionType === 'block') {
        const shouldBlock = await evaluateRule(rule, context);
        if (shouldBlock) {
          blocked = true;
        }
      }
    }

    // Calculate final risk score (cap at 100)
    totalRiskScore = Math.min(100, totalRiskScore);

    // Determine recommendation
    let recommendation: 'allow' | 'review' | 'block';
    if (blocked || totalRiskScore >= 80) {
      recommendation = 'block';
    } else if (totalRiskScore >= 50) {
      recommendation = 'review';
    } else {
      recommendation = 'allow';
    }

    // Create alerts in database if any
    if (alerts.length > 0) {
      await createAlerts(alerts, context);
    }

    // Update risk profile
    await updateRiskProfile(context, totalRiskScore);

    return {
      passed: !blocked && totalRiskScore < 80,
      riskScore: totalRiskScore,
      alerts,
      blocked,
      recommendation
    };
  } catch (error) {
    console.error('Fraud check error:', error);
    // On error, allow transaction but log
    return {
      passed: true,
      riskScore: 0,
      alerts: [],
      blocked: false,
      recommendation: 'allow'
    };
  }
}

/**
 * Check velocity limits
 */
async function checkVelocity(context: FraudCheckContext): Promise<FraudAlertData | null> {
  const { entityId, entityType, amount } = context;
  
  // Check transaction count in last 10 minutes
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  
  const velocityCheck = await db.velocityCheck.findFirst({
    where: {
      entityId,
      entityType,
      checkType: 'transaction_count',
      period: '10m',
      createdAt: { gte: tenMinutesAgo }
    }
  });

  if (velocityCheck && velocityCheck.currentValue >= 5) {
    return {
      type: 'velocity',
      severity: velocityCheck.currentValue >= 10 ? 'critical' : 'high',
      description: `High velocity detected: ${velocityCheck.currentValue} transactions in 10 minutes`,
      rule: 'VELOCITY_HIGH',
      riskScore: velocityCheck.currentValue >= 10 ? 85 : 60,
      details: { transactionCount: velocityCheck.currentValue, threshold: 5 }
    };
  }

  // Check total amount in last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const amountCheck = await db.velocityCheck.findFirst({
    where: {
      entityId,
      entityType,
      checkType: 'amount_total',
      period: '1h',
      createdAt: { gte: oneHourAgo }
    }
  });

  if (amountCheck && amountCheck.currentValue >= 100000) {
    return {
      type: 'velocity',
      severity: 'high',
      description: `High transaction volume: R${amountCheck.currentValue} in 1 hour`,
      rule: 'AMOUNT_HIGH',
      riskScore: 70,
      details: { totalAmount: amountCheck.currentValue, threshold: 100000 }
    };
  }

  return null;
}

/**
 * Check amount thresholds
 */
async function checkAmountThreshold(context: FraudCheckContext): Promise<FraudAlertData | null> {
  const { amount, entityId, entityType } = context;
  
  if (!amount) return null;

  // High value check
  if (amount >= 100000) {
    return {
      type: 'amount',
      severity: amount >= 500000 ? 'critical' : 'high',
      description: `High value transaction: R${amount}`,
      rule: 'AMOUNT_HIGH',
      riskScore: amount >= 500000 ? 90 : 65,
      details: { amount, threshold: 100000 }
    };
  }

  // Check deviation from average
  const lastTransactions = await db.consumerTransaction.findMany({
    where: { userId: entityId },
    take: 30,
    orderBy: { createdAt: 'desc' }
  });

  if (lastTransactions.length >= 5) {
    const avgAmount = lastTransactions.reduce((sum, t) => sum + Number(t.amountCents) / 100, 0) / lastTransactions.length;
    
    if (amount > avgAmount * 5 && amount > 5000) {
      return {
        type: 'pattern',
        severity: 'medium',
        description: `Unusual amount: R${amount} (average: R${avgAmount.toFixed(2)})`,
        rule: 'AMOUNT_PATTERN',
        riskScore: 55,
        details: { amount, average: avgAmount, multiplier: amount / avgAmount }
      };
    }
  }

  return null;
}

/**
 * Check location anomalies
 */
async function checkLocationAnomaly(context: FraudCheckContext): Promise<FraudAlertData | null> {
  const { location, ipAddress, entityId } = context;
  
  if (!location?.latitude || !location?.longitude) return null;

  // Get last known location from recent transactions
  const recentTransaction = await db.consumerTransaction.findFirst({
    where: { userId: entityId },
    orderBy: { createdAt: 'desc' }
  });

  // Check IP location vs declared location
  // In production, we'd use a geolocation service
  if (ipAddress) {
    // Placeholder for IP geolocation check
    // Would compare IP location with declared location
  }

  return null;
}

/**
 * Check device fingerprint
 */
async function checkDeviceFingerprint(context: FraudCheckContext): Promise<FraudAlertData | null> {
  const { deviceId, entityId } = context;
  
  if (!deviceId) return null;

  const fingerprint = await db.deviceFingerprint.findUnique({
    where: { fingerprint: deviceId }
  });

  if (fingerprint) {
    // Check if device is flagged
    if (fingerprint.flagged) {
      return {
        type: 'device',
        severity: 'high',
        description: `Flagged device detected: ${deviceId}`,
        rule: 'DEVICE_FLAGGED',
        riskScore: 80,
        details: { deviceId, flagReason: fingerprint.flagReason }
      };
    }

    // Check for multiple users on same device
    const users = fingerprint.associatedUsers ? JSON.parse(fingerprint.associatedUsers) : [];
    if (users.length >= 3 && !users.includes(entityId)) {
      return {
        type: 'device',
        severity: 'medium',
        description: `Device associated with multiple users`,
        rule: 'DEVICE_SHARED',
        riskScore: 50,
        details: { deviceId, userCount: users.length }
      };
    }
  } else {
    // New device
    await db.deviceFingerprint.create({
      data: {
        id: `df_${Date.now()}`,
        fingerprint: deviceId,
        associatedUsers: JSON.stringify([entityId]),
      }
    });

    return {
      type: 'device',
      severity: 'low',
      description: 'New device detected',
      rule: 'DEVICE_NEW',
      riskScore: 25,
      details: { deviceId }
    };
  }

  return null;
}

/**
 * Check behavioral patterns
 */
async function checkBehaviorPattern(context: FraudCheckContext): Promise<FraudAlertData | null> {
  const { entityId, sourceApp, metadata } = context;
  
  // Check for rapid successive failures
  if (metadata?.failedAttempts) {
    const failures = Number(metadata.failedAttempts);
    if (failures >= 3) {
      return {
        type: 'behavior',
        severity: failures >= 5 ? 'critical' : 'high',
        description: `Multiple failed attempts: ${failures}`,
        rule: 'RAPID_FAILURES',
        riskScore: failures >= 5 ? 95 : 75,
        details: { failedAttempts: failures }
      };
    }
  }

  // Check for night transactions (00:00 - 05:00)
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 5 && context.amount && context.amount >= 10000) {
    return {
      type: 'pattern',
      severity: 'medium',
      description: 'High-value night transaction detected',
      rule: 'NIGHT_TRANSACTION',
      riskScore: 45,
      details: { hour, amount: context.amount }
    };
  }

  return null;
}

/**
 * Check risk profile
 */
async function checkRiskProfile(context: FraudCheckContext): Promise<FraudAlertData | null> {
  const { entityId, entityType } = context;

  const profile = await db.riskProfile.findUnique({
    where: {
      entityType_entityId: {
        entityType,
        entityId
      }
    }
  });

  if (profile) {
    if (profile.status === 'blocked') {
      return {
        type: 'behavior',
        severity: 'critical',
        description: 'Account is blocked',
        rule: 'PROFILE_BLOCKED',
        riskScore: 100,
        details: { blockedReason: profile.blockedReason }
      };
    }

    if (profile.riskScore >= 80) {
      return {
        type: 'behavior',
        severity: 'high',
        description: `High-risk profile: score ${profile.riskScore}`,
        rule: 'HIGH_RISK_PROFILE',
        riskScore: profile.riskScore,
        details: { riskFactors: profile.riskFactors }
      };
    }
  }

  return null;
}

/**
 * Evaluate a specific rule
 */
async function evaluateRule(rule: { conditions: string | null }, context: FraudCheckContext): Promise<boolean> {
  if (!rule.conditions) return false;
  
  const conditions = JSON.parse(rule.conditions);
  
  // Simple rule evaluation logic
  // In production, this would use a proper rule engine
  
  if (conditions.checkBlacklist && context.ipAddress) {
    const blacklisted = await db.iPBlacklist.findFirst({
      where: { ipAddress: context.ipAddress, isActive: true }
    });
    return !!blacklisted;
  }

  return false;
}

/**
 * Create alerts in database
 */
async function createAlerts(alerts: FraudAlertData[], context: FraudCheckContext): Promise<void> {
  for (const alert of alerts) {
    try {
      await db.fraudAlert.create({
        data: {
          id: `fa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: alert.type,
          severity: alert.severity,
          description: alert.description,
          rule: alert.rule,
          riskScore: alert.riskScore,
          details: alert.details ? JSON.stringify(alert.details) : null,
          merchantId: context.merchantId,
          userId: context.entityType === 'consumer' ? context.entityId : undefined,
          amount: context.amount,
          sourceApp: context.sourceApp,
          deviceId: context.deviceId,
          ipAddress: context.ipAddress,
          location: context.location?.city,
          latitude: context.location?.latitude,
          longitude: context.location?.longitude,
        }
      });

      // Update rule trigger count
      if (alert.rule) {
        await db.fraudRule.updateMany({
          where: { code: alert.rule },
          data: {
            triggers24h: { increment: 1 },
            triggers7d: { increment: 1 },
            triggers30d: { increment: 1 },
            lastTriggeredAt: new Date()
          }
        });
      }
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  }
}

/**
 * Update risk profile
 */
async function updateRiskProfile(context: FraudCheckContext, riskScore: number): Promise<void> {
  const { entityId, entityType } = context;

  try {
    const existing = await db.riskProfile.findUnique({
      where: {
        entityType_entityId: {
          entityType,
          entityId
        }
      }
    });

    if (existing) {
      // Update existing profile
      const newScore = Math.round((existing.riskScore + riskScore) / 2);
      const riskLevel = newScore >= 80 ? 'critical' : newScore >= 60 ? 'high' : newScore >= 40 ? 'medium' : 'low';

      await db.riskProfile.update({
        where: { id: existing.id },
        data: {
          riskScore: newScore,
          riskLevel,
          lastAssessmentAt: new Date(),
          assessmentCount: { increment: 1 },
          alertsTriggered: riskScore >= 50 ? { increment: 1 } : undefined,
        }
      });
    } else {
      // Create new profile
      const riskLevel = riskScore >= 80 ? 'critical' : riskScore >= 60 ? 'high' : riskScore >= 40 ? 'medium' : 'low';

      await db.riskProfile.create({
        data: {
          id: `rp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          entityType,
          entityId,
          riskScore,
          riskLevel,
          lastAssessmentAt: new Date(),
          assessmentCount: 1,
        }
      });
    }
  } catch (error) {
    console.error('Error updating risk profile:', error);
  }
}

/**
 * Record velocity check
 */
export async function recordVelocity(context: FraudCheckContext): Promise<void> {
  const { entityId, entityType, amount, transactionId } = context;

  try {
    // Record transaction count
    await db.velocityCheck.create({
      data: {
        id: `vc_${Date.now()}`,
        entityType,
        entityId,
        checkType: 'transaction_count',
        period: '10m',
        threshold: 5,
        currentValue: 1,
        transactionIds: transactionId ? JSON.stringify([transactionId]) : null,
      }
    });

    // Record amount total
    if (amount) {
      await db.velocityCheck.create({
        data: {
          id: `vc_${Date.now()}_amt`,
          entityType,
          entityId,
          checkType: 'amount_total',
          period: '1h',
          threshold: 100000,
          currentValue: amount,
          transactionIds: transactionId ? JSON.stringify([transactionId]) : null,
        }
      });
    }
  } catch (error) {
    console.error('Error recording velocity:', error);
  }
}
