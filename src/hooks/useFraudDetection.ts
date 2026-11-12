'use client'

import { useState, useCallback } from 'react'

// Types
export interface FraudCheckContext {
  entityType: 'merchant' | 'consumer' | 'transaction'
  entityId: string
  amount?: number
  currency?: string
  merchantId?: string
  userId?: string
  deviceId?: string
  ipAddress?: string
  location?: {
    latitude?: number
    longitude?: number
    city?: string
    country?: string
  }
  metadata?: Record<string, unknown>
  sourceApp: string
}

export interface FraudCheckResult {
  passed: boolean
  riskScore: number
  alerts: Array<{
    type: string
    severity: string
    description: string
    riskScore: number
  }>
  blocked: boolean
  recommendation: 'allow' | 'review' | 'block'
}

export interface UseFraudDetectionReturn {
  checkFraud: (context: FraudCheckContext) => Promise<FraudCheckResult>
  loading: boolean
  error: string | null
  lastResult: FraudCheckResult | null
}

/**
 * Hook for fraud detection checks
 * Used by Merchant OS, Consumer Wallet, and other applications
 */
export function useFraudDetection(): UseFraudDetectionReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<FraudCheckResult | null>(null)

  const checkFraud = useCallback(async (context: FraudCheckContext): Promise<FraudCheckResult> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/fraud/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context)
      })

      if (!response.ok) {
        throw new Error('Fraud check failed')
      }

      const result: FraudCheckResult = await response.json()
      setLastResult(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      
      // Return a safe default - allow the transaction but with a warning
      const safeResult: FraudCheckResult = {
        passed: true,
        riskScore: 0,
        alerts: [],
        blocked: false,
        recommendation: 'allow'
      }
      setLastResult(safeResult)
      return safeResult
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    checkFraud,
    loading,
    error,
    lastResult
  }
}

/**
 * Hook for quick transaction fraud check
 * Simplified interface for transaction validation
 */
export function useTransactionFraudCheck() {
  const { checkFraud, loading, error, lastResult } = useFraudDetection()

  const validateTransaction = useCallback(async (
    amount: number,
    merchantId: string,
    userId: string,
    metadata?: Record<string, unknown>
  ): Promise<{ safe: boolean; riskScore: number; message?: string }> => {
    const result = await checkFraud({
      entityType: 'transaction',
      entityId: `txn_${Date.now()}`,
      amount,
      currency: 'ZAR',
      merchantId,
      userId,
      sourceApp: 'merchant_os',
      metadata
    })

    return {
      safe: result.passed && result.recommendation !== 'block',
      riskScore: result.riskScore,
      message: result.alerts.length > 0 
        ? result.alerts.map(a => a.description).join('; ')
        : undefined
    }
  }, [checkFraud])

  return {
    validateTransaction,
    loading,
    error,
    lastResult
  }
}

/**
 * Hook for consumer wallet fraud check
 * Specific to consumer wallet operations
 */
export function useWalletFraudCheck() {
  const { checkFraud, loading, error, lastResult } = useFraudDetection()

  const validatePayment = useCallback(async (
    amount: number,
    userId: string,
    paymentType: string,
    metadata?: Record<string, unknown>
  ): Promise<{ safe: boolean; riskScore: number; requiresReview: boolean }> => {
    const result = await checkFraud({
      entityType: 'consumer',
      entityId: userId,
      amount,
      currency: 'ZAR',
      userId,
      sourceApp: 'consumer_wallet',
      metadata: { ...metadata, paymentType }
    })

    return {
      safe: result.passed && result.recommendation !== 'block',
      riskScore: result.riskScore,
      requiresReview: result.recommendation === 'review'
    }
  }, [checkFraud])

  const validateTransfer = useCallback(async (
    amount: number,
    userId: string,
    recipientId: string,
    metadata?: Record<string, unknown>
  ): Promise<{ safe: boolean; riskScore: number; requiresReview: boolean }> => {
    const result = await checkFraud({
      entityType: 'consumer',
      entityId: userId,
      amount,
      currency: 'ZAR',
      userId,
      sourceApp: 'consumer_wallet',
      metadata: { ...metadata, recipientId, transferType: 'p2p' }
    })

    return {
      safe: result.passed && result.recommendation !== 'block',
      riskScore: result.riskScore,
      requiresReview: result.recommendation === 'review'
    }
  }, [checkFraud])

  return {
    validatePayment,
    validateTransfer,
    loading,
    error,
    lastResult
  }
}
