/**
 * PayShap BankServ integration stub.
 *
 * Phase 4 hardening: PayShap integration.
 * In production, this calls the real BankServ API for:
 * - Proxy lookup (resolve a PayShap ID to a bank account)
 * - Payment initiation (send money to a resolved account)
 * - Status polling (check payment status)
 *
 * In development, all operations are simulated with realistic delays.
 *
 * To enable production:
 * 1. Set PAYSHAP_BANK_ID=your_bank_id in .env
 * 2. Set PAYSHAP_API_KEY=your_api_key in .env
 * 3. Set PAYSHAP_API_URL=https://api.bankserv.co.za/payshap in .env
 */

export interface PayShapProxy {
  proxyId: string
  proxyType: 'mobile' | 'id_number' | 'email' | 'passport'
  accountHolderName: string
  bankName: string
  bankCode: string
  accountNumber: string // masked
  verified: boolean
}

export interface PayShapPayment {
  paymentId: string
  proxyId: string
  amountCents: bigint
  currency: string
  status: 'pending' | 'completed' | 'failed'
  reference: string
  initiatedAt: Date
  completedAt?: Date
  bankReference?: string
  failureReason?: string
}

const IS_LIVE = !!process.env.PAYSHAP_API_KEY && !!process.env.PAYSHAP_API_URL

/**
 * Look up a PayShap proxy (resolve a phone number / ID to a bank account).
 */
export async function lookupProxy(proxyId: string, proxyType: string): Promise<PayShapProxy> {
  if (IS_LIVE) {
    return lookupProxyLive(proxyId, proxyType)
  }

  // Simulated lookup
  await delay(500)

  // Return a realistic mock based on the proxy ID
  const banks = [
    { name: 'FNB', code: '250655' },
    { name: 'Standard Bank', code: '051001' },
    { name: 'ABSA', code: '632005' },
    { name: 'Nedbank', code: '198765' },
    { name: 'Capitec', code: '470010' },
  ]
  const bank = banks[Math.floor(Math.random() * banks.length)]
  const holderNames = ['John Doe', 'Jane Smith', 'Thabo Molefe', 'Nomsa Dlamini', 'Pieter van der Merwe']
  const holderName = holderNames[Math.floor(Math.random() * holderNames.length)]

  return {
    proxyId,
    proxyType: proxyType as PayShapProxy['proxyType'],
    accountHolderName: holderName,
    bankName: bank.name,
    bankCode: bank.code,
    accountNumber: `****${Math.floor(1000 + Math.random() * 9000)}`,
    verified: true,
  }
}

/**
 * Initiate a PayShap payment.
 */
export async function initiatePayment(
  proxyId: string,
  amountCents: bigint,
  currency: string,
  reference: string,
): Promise<PayShapPayment> {
  const paymentId = `PS-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

  if (IS_LIVE) {
    return initiatePaymentLive(paymentId, proxyId, amountCents, currency, reference)
  }

  // Simulated payment — mark as completed after 1 second
  await delay(1000)

  return {
    paymentId,
    proxyId,
    amountCents,
    currency,
    status: 'completed',
    reference,
    initiatedAt: new Date(),
    completedAt: new Date(),
    bankReference: `BNK${Date.now()}`,
  }
}

/**
 * Check the status of a PayShap payment.
 */
export async function getPaymentStatus(paymentId: string): Promise<PayShapPayment> {
  if (IS_LIVE) {
    return getPaymentStatusLive(paymentId)
  }

  // Simulated status check — always completed
  await delay(200)
  return {
    paymentId,
    proxyId: 'unknown',
    amountCents: BigInt(0),
    currency: 'ZAR',
    status: 'completed',
    reference: '',
    initiatedAt: new Date(),
    completedAt: new Date(),
  }
}

// --- Live BankServ integration (stubs for production) ---

async function lookupProxyLive(proxyId: string, proxyType: string): Promise<PayShapProxy> {
  const res = await fetch(`${process.env.PAYSHAP_API_URL}/proxy/lookup`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PAYSHAP_API_KEY}`,
      'Content-Type': 'application/json',
      'X-Bank-ID': process.env.PAYSHAP_BANK_ID || '',
    },
    body: JSON.stringify({ proxyId, proxyType }),
  })
  if (!res.ok) throw new Error(`PayShap lookup failed: ${res.status}`)
  const data = await res.json()
  return {
    proxyId: data.proxyId,
    proxyType: data.proxyType,
    accountHolderName: data.accountHolderName,
    bankName: data.bankName,
    bankCode: data.bankCode,
    accountNumber: data.maskedAccountNumber,
    verified: data.verified,
  }
}

async function initiatePaymentLive(
  paymentId: string,
  proxyId: string,
  amountCents: bigint,
  currency: string,
  reference: string,
): Promise<PayShapPayment> {
  const res = await fetch(`${process.env.PAYSHAP_API_URL}/payments/initiate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PAYSHAP_API_KEY}`,
      'Content-Type': 'application/json',
      'X-Bank-ID': process.env.PAYSHAP_BANK_ID || '',
    },
    body: JSON.stringify({
      paymentId,
      proxyId,
      amount: Number(amountCents) / 100,
      currency,
      reference,
    }),
  })
  if (!res.ok) throw new Error(`PayShap payment initiation failed: ${res.status}`)
  const data = await res.json()
  return {
    paymentId: data.paymentId,
    proxyId,
    amountCents,
    currency,
    status: data.status,
    reference,
    initiatedAt: new Date(),
    bankReference: data.bankReference,
  }
}

async function getPaymentStatusLive(paymentId: string): Promise<PayShapPayment> {
  const res = await fetch(`${process.env.PAYSHAP_API_URL}/payments/${paymentId}/status`, {
    headers: {
      'Authorization': `Bearer ${process.env.PAYSHAP_API_KEY}`,
      'X-Bank-ID': process.env.PAYSHAP_BANK_ID || '',
    },
  })
  if (!res.ok) throw new Error(`PayShap status check failed: ${res.status}`)
  const data = await res.json()
  return {
    paymentId: data.paymentId,
    proxyId: data.proxyId,
    amountCents: BigInt(Math.round(data.amount * 100)),
    currency: data.currency || 'ZAR',
    status: data.status,
    reference: data.reference,
    initiatedAt: new Date(data.initiatedAt),
    completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
    bankReference: data.bankReference,
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
