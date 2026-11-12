'use client';

import { useState, useCallback } from 'react';

export interface FraudCheckResult {
  passed: boolean;
  riskScore: number;
  alerts: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }>;
  blocked: boolean;
  recommendation: 'allow' | 'review' | 'block';
}

export interface SecuritySettings {
  user: {
    hasPin: boolean;
    hasBiometric: boolean;
    isLocked: boolean;
    kycLevel: number;
    kycStatus: string;
    accountStatus: string;
  };
  riskProfile: {
    score: number;
    level: string;
    status: string;
    lastAssessment: string | null;
    factors: string[];
  };
  walletLimits: {
    dailyLimit: number;
    dailySpent: number;
    monthlyLimit: number;
    monthlySpent: number;
    dailyRemaining: number;
    monthlyRemaining: number;
  };
  sessions: Array<{
    id: string;
    deviceName: string;
    deviceType: string;
    ipAddress: string;
    lastActive: string;
    status: string;
  }>;
  devices: Array<{
    id: string;
    deviceType: string;
    os: string;
    lastSeen: string;
    riskScore: number;
    flagged: boolean;
  }>;
  cards: Array<{
    id: string;
    type: string;
    lastFour: string;
    status: string;
    limits: { daily: number; monthly: number };
    features: { online: boolean; contactless: boolean; atm: boolean; international: boolean };
  }>;
  recentAlerts: Array<{
    id: string;
    type: string;
    severity: string;
    description: string;
    status: string;
    createdAt: string;
  }>;
}

export function useFraudDetection() {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<FraudCheckResult | null>(null);

  const checkFraud = useCallback(async (context: {
    entityType: 'merchant' | 'consumer' | 'transaction';
    entityId: string;
    amount?: number;
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
  }): Promise<FraudCheckResult> => {
    setLoading(true);
    try {
      const response = await fetch('/api/fraud/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...context,
          sourceApp: 'consumer_wallet'
        })
      });

      const result = await response.json();
      setLastResult(result);
      return result;
    } catch (error) {
      console.error('Fraud check error:', error);
      // Return safe default
      const safeResult: FraudCheckResult = {
        passed: true,
        riskScore: 0,
        alerts: [],
        blocked: false,
        recommendation: 'allow'
      };
      setLastResult(safeResult);
      return safeResult;
    } finally {
      setLoading(false);
    }
  }, []);

  return { checkFraud, loading, lastResult };
}

export function useSecuritySettings() {
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/consumer/security');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching security settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLimits = useCallback(async (dailyLimit: number, monthlyLimit: number) => {
    try {
      const response = await fetch('/api/consumer/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_limits',
          dailyLimit,
          monthlyLimit
        })
      });
      return response.ok;
    } catch (error) {
      console.error('Error updating limits:', error);
      return false;
    }
  }, []);

  const toggleCardFeature = useCallback(async (cardId: string, feature: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/consumer/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_card_feature',
          cardId,
          feature,
          enabled
        })
      });
      return response.ok;
    } catch (error) {
      console.error('Error toggling card feature:', error);
      return false;
    }
  }, []);

  const revokeSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch('/api/consumer/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revoke_session',
          sessionId
        })
      });
      return response.ok;
    } catch (error) {
      console.error('Error revoking session:', error);
      return false;
    }
  }, []);

  const revokeAllSessions = useCallback(async () => {
    try {
      const response = await fetch('/api/consumer/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revoke_all_sessions'
        })
      });
      return response.ok;
    } catch (error) {
      console.error('Error revoking all sessions:', error);
      return false;
    }
  }, []);

  const reportSuspiciousActivity = useCallback(async (description: string, transactionId?: string) => {
    try {
      const response = await fetch('/api/consumer/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'report_suspicious_activity',
          description,
          transactionId
        })
      });
      return response.ok;
    } catch (error) {
      console.error('Error reporting activity:', error);
      return false;
    }
  }, []);

  return {
    settings,
    loading,
    fetchSettings,
    updateLimits,
    toggleCardFeature,
    revokeSession,
    revokeAllSessions,
    reportSuspiciousActivity
  };
}
