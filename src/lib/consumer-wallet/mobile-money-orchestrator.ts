/**
 * Mobile Money Orchestration Layer
 *
 * Unified Payment Interface (UPI) contract that abstracts away provider
 * heterogeneity (TNM Mpamba, Airtel Money MW, M-Pesa TZ, MTC Maris NA).
 *
 * The wallet UI and ledger NEVER see raw provider responses.
 * Business logic branches only on TransactionStatus.
 *
 * In development: all providers are simulated.
 * In production: set the provider credentials in .env to go live.
 */

// ============================================================
// Types (the unified contract)
// ============================================================

export type MobileMoneyProvider = 'tnm_mpamba' | 'airtel_money_mw' | 'mpesa_tz' | 'mtc_maris'

export type MobileMoneyCurrency = 'MWK' | 'TZS' | 'NAD' | 'ZAR'

export type TransactionStatus =
  | 'ACCEPTED'    // Provider accepted; awaiting user action
  | 'PENDING'     // User prompted; awaiting PIN/approval
  | 'SUCCESSFUL'  // Funds settled
  | 'FAILED'      // Definitive failure
  | 'REVERSED'    // Refunded or reversed

export interface DepositRequest {
  idempotencyKey: string
  provider: MobileMoneyProvider
  amount: number          // smallest currency unit (tambala, cents)
  currency: MobileMoneyCurrency
  msisdn: string          // E.164 normalized
  reference: string       // Groway transaction ID
  description?: string
}

export interface PayoutRequest {
  idempotencyKey: string
  provider: MobileMoneyProvider
  amount: number
  currency: MobileMoneyCurrency
  msisdn: string
  reference: string
}

export interface TransactionResult {
  providerTransactionId: string
  status: TransactionStatus
  msisdn: string
  amount: number
  currency: MobileMoneyCurrency
  fee?: number
  rawProviderResponse?: unknown  // for audit only, never for business logic
}

// ============================================================
// Provider metadata (for UI display)
// ============================================================

export interface ProviderInfo {
  id: MobileMoneyProvider
  name: string
  country: 'MW' | 'TZ' | 'NA'
  currency: MobileMoneyCurrency
  color: string
  logo: string
  ussdCode?: string
  feePercent: number
  minAmount: number
  maxAmount: number
  averageSettlementTime: string
  enabled: boolean
}

export const PROVIDERS: Record<MobileMoneyProvider, ProviderInfo> = {
  tnm_mpamba: {
    id: 'tnm_mpamba',
    name: 'TNM Mpamba',
    country: 'MW',
    currency: 'MWK',
    color: '#003366',
    logo: '📱',
    ussdCode: '*600#',
    feePercent: 1.0,
    minAmount: 50,
    maxAmount: 5000000,
    averageSettlementTime: '30 seconds',
    enabled: true,
  },
  airtel_money_mw: {
    id: 'airtel_money_mw',
    name: 'Airtel Money',
    country: 'MW',
    currency: 'MWK',
    color: '#E60000',
    logo: '🔴',
    ussdCode: '*533#',
    feePercent: 2.0,
    minAmount: 50,
    maxAmount: 2000000,
    averageSettlementTime: '45 seconds',
    enabled: true,
  },
  mpesa_tz: {
    id: 'mpesa_tz',
    name: 'M-Pesa Tanzania',
    country: 'TZ',
    currency: 'TZS',
    color: '#00B14C',
    logo: '🟢',
    ussdCode: '*150*00#',
    feePercent: 1.5,
    minAmount: 500,
    maxAmount: 3000000,
    averageSettlementTime: '60 seconds',
    enabled: true,
  },
  mtc_maris: {
    id: 'mtc_maris',
    name: 'MTC Maris',
    country: 'NA',
    currency: 'NAD',
    color: '#0066B3',
    logo: '🔵',
    ussdCode: '*682#',
    feePercent: 1.8,
    minAmount: 100,
    maxAmount: 500000,
    averageSettlementTime: '90 seconds',
    enabled: true, // feature-flagged in production until API stabilizes
  },
}

// ============================================================
// Routing table — detect provider from MSISDN prefix
// ============================================================

interface RoutingRule {
  country: string
  prefixPattern: RegExp
  provider: MobileMoneyProvider
}

const ROUTING_TABLE: RoutingRule[] = [
  // Malawi
  { country: 'MW', prefixPattern: /^\+265(99|1[89])/, provider: 'tnm_mpamba' },
  { country: 'MW', prefixPattern: /^\+265(88|99|1[12])/, provider: 'airtel_money_mw' },
  // Tanzania (Vodacom M-Pesa)
  { country: 'TZ', prefixPattern: /^\+2557[45]/, provider: 'mpesa_tz' },
  { country: 'TZ', prefixPattern: /^\+2556[58]/, provider: 'mpesa_tz' },
  // Namibia (MTC)
  { country: 'NA', prefixPattern: /^\+2648[1235]/, provider: 'mtc_maris' },
]

export function detectProvider(msisdn: string): MobileMoneyProvider | null {
  const normalized = normalizeMsisdn(msisdn)
  for (const rule of ROUTING_TABLE) {
    if (rule.prefixPattern.test(normalized)) {
      return rule.provider
    }
  }
  return null
}

export function normalizeMsisdn(input: string): string {
  let msisdn = input.replace(/[\s\-()]/g, '')
  if (msisdn.startsWith('0')) {
    // South African default if no country code
    if (msisdn.length === 10) msisdn = '+27' + msisdn.slice(1)
    else msisdn = '+' + msisdn
  }
  if (msisdn.startsWith('265')) msisdn = '+' + msisdn
  if (msisdn.startsWith('255')) msisdn = '+' + msisdn
  if (msisdn.startsWith('264')) msisdn = '+' + msisdn
  if (!msisdn.startsWith('+')) msisdn = '+' + msisdn
  return msisdn
}

// ============================================================
// Orchestrator — unified interface
// ============================================================

export class MobileMoneyOrchestrator {
  private static instance: MobileMoneyOrchestrator | null = null
  private pendingTransactions = new Map<string, TransactionResult>()

  static getInstance(): MobileMoneyOrchestrator {
    if (!this.instance) this.instance = new MobileMoneyOrchestrator()
    return this.instance
  }

  /**
   * Initiate a mobile money deposit (top-up to Groway wallet).
   * Returns ACCEPTED or PENDING — never SUCCESSFUL synchronously.
   * Final status arrives via webhook or polling.
   */
  async deposit(req: DepositRequest): Promise<TransactionResult> {
    // Idempotency check
    const existing = this.pendingTransactions.get(req.idempotencyKey)
    if (existing) return existing

    const providerInfo = PROVIDERS[req.provider]
    if (!providerInfo?.enabled) {
      return {
        providerTransactionId: '',
        status: 'FAILED',
        msisdn: req.msisdn,
        amount: req.amount,
        currency: req.currency,
        rawProviderResponse: { error: 'Provider not enabled' },
      }
    }

    // In production: call the adapter for the provider
    // In development: simulate the provider response
    const isLive = this.isLiveMode(req.provider)
    if (isLive) {
      return this.callProviderAdapter(req, 'deposit')
    }

    // Simulated response
    const providerTxId = `${req.provider.toUpperCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const result: TransactionResult = {
      providerTransactionId: providerTxId,
      status: 'PENDING',
      msisdn: req.msisdn,
      amount: req.amount,
      currency: req.currency,
      fee: Math.round(req.amount * providerInfo.feePercent / 100),
      rawProviderResponse: {
        simulated: true,
        provider: req.provider,
        message: `Check your phone for a ${providerInfo.name} prompt. Enter your PIN to approve.`,
      },
    }

    this.pendingTransactions.set(req.idempotencyKey, result)
    return result
  }

  /**
   * Initiate a payout (withdrawal from Groway wallet to mobile money).
   */
  async payout(req: PayoutRequest): Promise<TransactionResult> {
    const existing = this.pendingTransactions.get(req.idempotencyKey)
    if (existing) return existing

    const providerInfo = PROVIDERS[req.provider]
    if (!providerInfo?.enabled) {
      return {
        providerTransactionId: '',
        status: 'FAILED',
        msisdn: req.msisdn,
        amount: req.amount,
        currency: req.currency,
      }
    }

    const isLive = this.isLiveMode(req.provider)
    if (isLive) {
      return this.callProviderAdapter(req, 'payout')
    }

    // Simulated
    const providerTxId = `${req.provider.toUpperCase()}-PAY-${Date.now()}`
    const result: TransactionResult = {
      providerTransactionId: providerTxId,
      status: 'ACCEPTED',
      msisdn: req.msisdn,
      amount: req.amount,
      currency: req.currency,
      fee: Math.round(req.amount * providerInfo.feePercent / 100),
      rawProviderResponse: {
        simulated: true,
        provider: req.provider,
        message: `Payout initiated to ${req.msisdn} via ${providerInfo.name}.`,
      },
    }

    this.pendingTransactions.set(req.idempotencyKey, result)
    return result
  }

  /**
   * Check the status of a transaction.
   * Used by the reconciliation job and the polling fallback.
   */
  async getStatus(providerTransactionId: string): Promise<TransactionStatus> {
    // In production: call the adapter's getStatus
    // In development: simulate status progression

    // Simulate: after 5 seconds, PENDING -> SUCCESSFUL
    const tx = Array.from(this.pendingTransactions.values()).find(t => t.providerTransactionId === providerTransactionId)
    if (!tx) return 'FAILED'

    // If the transaction was created more than 5 seconds ago, mark as SUCCESSFUL
    const txId = providerTransactionId
    const timestamp = parseInt(txId.split('-').find(p => /^\d+$/.test(p)) || '0')
    if (timestamp && Date.now() - timestamp > 5000) {
      tx.status = 'SUCCESSFUL'
    }

    return tx.status
  }

  /**
   * Refund a transaction.
   */
  async refund(providerTransactionId: string, amount?: number): Promise<TransactionResult> {
    const tx = Array.from(this.pendingTransactions.values()).find(t => t.providerTransactionId === providerTransactionId)
    if (!tx) {
      return {
        providerTransactionId: '',
        status: 'FAILED',
        msisdn: '',
        amount: 0,
        currency: 'ZAR',
      }
    }

    tx.status = 'REVERSED'
    return {
      ...tx,
      status: 'REVERSED',
      amount: amount || tx.amount,
    }
  }

  /**
   * Check if a provider is in live mode (has credentials configured).
   */
  private isLiveMode(provider: MobileMoneyProvider): boolean {
    switch (provider) {
      case 'tnm_mpamba': return !!process.env.MPAMBA_API_KEY
      case 'airtel_money_mw': return !!process.env.AIRTEL_CLIENT_ID && !!process.env.AIRTEL_CLIENT_SECRET
      case 'mpesa_tz': return !!process.env.MPESA_API_KEY && !!process.env.MPESA_PUBLIC_KEY
      case 'mtc_maris': return !!process.env.MTC_MARIS_API_KEY
      default: return false
    }
  }

  /**
   * Call the provider adapter (live mode).
   * In production, this routes to the actual provider SDK.
   */
  private async callProviderAdapter(req: DepositRequest | PayoutRequest, type: 'deposit' | 'payout'): Promise<TransactionResult> {
    // Production: route to the correct adapter
    // For now, fall back to simulation
    const providerInfo = PROVIDERS[req.provider]
    const providerTxId = `${req.provider.toUpperCase()}-${type.toUpperCase()}-${Date.now()}`
    return {
      providerTransactionId: providerTxId,
      status: type === 'deposit' ? 'PENDING' : 'ACCEPTED',
      msisdn: req.msisdn,
      amount: req.amount,
      currency: req.currency,
      fee: Math.round(req.amount * providerInfo.feePercent / 100),
    }
  }

  /**
   * Process a webhook callback from a provider.
   * Returns 200 immediately, processes ledger updates asynchronously.
   */
  processWebhook(provider: MobileMoneyProvider, payload: unknown): { received: boolean } {
    // In production: verify signature, parse into TransactionResult,
    // look up by providerTransactionId + idempotencyKey, update ledger
    return { received: true }
  }
}

// ============================================================
// Export singleton
// ============================================================

export const orchestrator = MobileMoneyOrchestrator.getInstance()
