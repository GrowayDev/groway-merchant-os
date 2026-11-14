/**
 * DebiCheck mandate management for BNPL and recurring payments.
 *
 * Phase 4 hardening: DebiCheck mandate flow.
 * DebiCheck is the South African debit order system regulated by PASA.
 * It requires the customer to authorise a mandate before the merchant can
 * collect recurring payments.
 *
 * In production, this integrates with a bank's DebiCheck API.
 * In development, mandates are simulated.
 *
 * To enable production:
 * 1. Set DEBICHECK_BANK_ID=your_bank_id in .env
 * 2. Set DEBICHECK_API_KEY=your_api_key in .env
 * 3. Set DEBICHECK_API_URL=https://api.bankserv.co.za/debicheck in .env
 */

export interface DebiCheckMandate {
  mandateId: string
  userId: string
  creditorName: string
  debtorBank: string
  debtorAccount: string // masked
  amountCents: bigint
  currency: string
  frequency: 'monthly' | 'weekly' | 'once'
  startDate: Date
  endDate?: Date
  status: 'pending' | 'authorised' | 'active' | 'cancelled' | 'expired'
  reference: string
  createdAt: Date
  authorisedAt?: Date
}

const IS_LIVE = !!process.env.DEBICHECK_API_KEY && !!process.env.DEBICHECK_API_URL

/**
 * Create a DebiCheck mandate.
 * The mandate starts in 'pending' status — the customer must authorise it
 * via their banking app or USSD.
 */
export async function createMandate(params: {
  userId: string
  creditorName: string
  debtorBank: string
  debtorAccount: string
  amountCents: bigint
  currency?: string
  frequency?: 'monthly' | 'weekly' | 'once'
  startDate: Date
  endDate?: Date
  reference: string
}): Promise<DebiCheckMandate> {
  const mandateId = `DC-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

  const mandate: DebiCheckMandate = {
    mandateId,
    userId: params.userId,
    creditorName: params.creditorName,
    debtorBank: params.debtorBank,
    debtorAccount: params.debtorAccount.replace(/\d(?=\d{4})/g, '*'),
    amountCents: params.amountCents,
    currency: params.currency || 'ZAR',
    frequency: params.frequency || 'monthly',
    startDate: params.startDate,
    endDate: params.endDate,
    status: 'pending',
    reference: params.reference,
    createdAt: new Date(),
  }

  if (IS_LIVE) {
    return createMandateLive(mandate)
  }

  // Simulated: mandate is created in pending state
  await delay(300)
  return mandate
}

/**
 * Authorise a DebiCheck mandate.
 * In production, this is done by the customer via their banking app or USSD.
 * In development, we auto-authorise for testing.
 */
export async function authoriseMandate(mandateId: string, userId: string): Promise<DebiCheckMandate> {
  if (IS_LIVE) {
    return authoriseMandateLive(mandateId, userId)
  }

  // Simulated: auto-authorise after 500ms
  await delay(500)
  return {
    mandateId,
    userId,
    creditorName: '',
    debtorBank: '',
    debtorAccount: '',
    amountCents: BigInt(0),
    currency: 'ZAR',
    frequency: 'monthly',
    startDate: new Date(),
    status: 'authorised',
    reference: '',
    createdAt: new Date(),
    authorisedAt: new Date(),
  }
}

/**
 * Check the status of a DebiCheck mandate.
 */
export async function getMandateStatus(mandateId: string): Promise<DebiCheckMandate['status']> {
  if (IS_LIVE) {
    return getMandateStatusLive(mandateId)
  }

  // Simulated: return 'authorised' (the customer authorised it)
  await delay(200)
  return 'authorised'
}

/**
 * Cancel a DebiCheck mandate.
 */
export async function cancelMandate(mandateId: string): Promise<boolean> {
  if (IS_LIVE) {
    return cancelMandateLive(mandateId)
  }

  await delay(200)
  return true
}

// --- Live DebiCheck API (stubs) ---

async function createMandateLive(mandate: DebiCheckMandate): Promise<DebiCheckMandate> {
  const res = await fetch(`${process.env.DEBICHECK_API_URL}/mandates`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.DEBICHECK_API_KEY}`,
      'Content-Type': 'application/json',
      'X-Bank-ID': process.env.DEBICHECK_BANK_ID || '',
    },
    body: JSON.stringify({
      mandateId: mandate.mandateId,
      creditorName: mandate.creditorName,
      debtorBank: mandate.debtorBank,
      debtorAccount: mandate.debtorAccount,
      amount: Number(mandate.amountCents) / 100,
      currency: mandate.currency,
      frequency: mandate.frequency,
      startDate: mandate.startDate.toISOString(),
      endDate: mandate.endDate?.toISOString(),
      reference: mandate.reference,
    }),
  })
  if (!res.ok) throw new Error(`DebiCheck mandate creation failed: ${res.status}`)
  const data = await res.json()
  return { ...mandate, mandateId: data.mandateId, status: data.status }
}

async function authoriseMandateLive(mandateId: string, _userId: string): Promise<DebiCheckMandate> {
  const res = await fetch(`${process.env.DEBICHECK_API_URL}/mandates/${mandateId}/authorise`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.DEBICHECK_API_KEY}`,
      'X-Bank-ID': process.env.DEBICHECK_BANK_ID || '',
    },
  })
  if (!res.ok) throw new Error(`DebiCheck mandate authorisation failed: ${res.status}`)
  const data = await res.json()
  return {
    mandateId,
    userId: _userId,
    creditorName: data.creditorName,
    debtorBank: data.debtorBank,
    debtorAccount: data.maskedAccount,
    amountCents: BigInt(Math.round(data.amount * 100)),
    currency: data.currency || 'ZAR',
    frequency: data.frequency,
    startDate: new Date(data.startDate),
    status: data.status,
    reference: data.reference,
    createdAt: new Date(data.createdAt),
    authorisedAt: data.authorisedAt ? new Date(data.authorisedAt) : undefined,
  }
}

async function getMandateStatusLive(mandateId: string): Promise<DebiCheckMandate['status']> {
  const res = await fetch(`${process.env.DEBICHECK_API_URL}/mandates/${mandateId}/status`, {
    headers: {
      'Authorization': `Bearer ${process.env.DEBICHECK_API_KEY}`,
      'X-Bank-ID': process.env.DEBICHECK_BANK_ID || '',
    },
  })
  if (!res.ok) throw new Error(`DebiCheck status check failed: ${res.status}`)
  const data = await res.json()
  return data.status
}

async function cancelMandateLive(mandateId: string): Promise<boolean> {
  const res = await fetch(`${process.env.DEBICHECK_API_URL}/mandates/${mandateId}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.DEBICHECK_API_KEY}`,
      'X-Bank-ID': process.env.DEBICHECK_BANK_ID || '',
    },
  })
  return res.ok
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
