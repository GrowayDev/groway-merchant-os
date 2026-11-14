/**
 * SAPE — SPZABOX Authentication & Provenance Engine
 * Core engine: GS1 DataMatrix encoding/parsing, event hash-chaining,
 * merkle anchoring, HMAC serial signatures, anomaly screening.
 *
 * Layer 1: Supplier verification (AuthenticatedSupplier model)
 * Layer 2: GS1 serialisation (ProductIdentity / ProductSerial)
 * Layer 3: Blockchain-anchored custody (CustodyEvent / NetworkBlock / BlockchainAnchor)
 * Layer 4: <500ms POS verification (POSVerification / VerificationFailure)
 * Layer 5: Consumer QR verification (ConsumerScan / ConsumerReport)
 * Layer 6: Authority feeds (AuthorityNotification / TipOff)
 */
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'crypto'

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

function signingKey(): string {
  return process.env.JWT_SECRET || process.env.INTERNAL_API_KEY || 'sape-dev-signing-key'
}

/** HMAC-SHA256 signature for a serial record (audit F1-compliant: server-only key). */
export function signSerial(data: string): string {
  return createHmac('sha256', signingKey()).update(data).digest('hex')
}

export function verifySerialSignature(data: string, signature: string): boolean {
  const expected = signSerial(data)
  if (expected.length !== signature.length) return false
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// GS1 Application Identifiers (AI 01 / 10 / 17 / 21)
// ---------------------------------------------------------------------------

export interface ParsedGs1 {
  gtin: string | null
  batch: string | null
  expiry: string | null // YYMMDD parsed to YYYY-MM-DD
  serial: string | null
  raw: string
  valid: boolean
}

/** Parse a GS1 DataMatrix-style payload: `010{gtin}10{batch}17{expiry}21{serial}`. */
export function parseGs1Payload(payload: string): ParsedGs1 {
  const raw = (payload || '').trim()
  const out: ParsedGs1 = { gtin: null, batch: null, expiry: null, serial: null, raw, valid: false }
  if (!raw) return out

  let rest = raw
  // AI(01) GTIN — 14 digits
  if (rest.startsWith('01') && rest.length >= 16) {
    out.gtin = rest.slice(2, 16)
    rest = rest.slice(16)
  }
  // AI(10) batch — variable, until next known AI (17/21)
  if (rest.startsWith('10')) {
    rest = rest.slice(2)
    const stop = rest.search(/17|21/)
    if (stop === -1) {
      out.batch = rest || null
      rest = ''
    } else {
      out.batch = rest.slice(0, stop) || null
      rest = rest.slice(stop)
    }
  }
  // AI(17) expiry — YYMMDD (6 digits)
  if (rest.startsWith('17') && rest.length >= 8) {
    const yy = rest.slice(2, 4)
    const mm = rest.slice(4, 6)
    const dd = rest.slice(6, 8)
    out.expiry = `20${yy}-${mm}-${dd}`
    rest = rest.slice(8)
  }
  // AI(21) serial — variable, remainder
  if (rest.startsWith('21')) {
    out.serial = rest.slice(2) || null
  }

  out.valid = !!(out.gtin && out.serial)
  return out
}

/** Build a GS1 payload string for a product serial. */
export function buildGs1Payload(opts: {
  gtin: string
  batch?: string | null
  expiry?: Date | null
  serial: string
}): string {
  let p = `01${opts.gtin.padStart(14, '0')}`
  if (opts.batch) p += `10${opts.batch}`
  if (opts.expiry) {
    const yy = String(opts.expiry.getUTCFullYear()).slice(2)
    const mm = String(opts.expiry.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(opts.expiry.getUTCDate()).padStart(2, '0')
    p += `17${yy}${mm}${dd}`
  }
  p += `21${opts.serial}`
  return p
}

/** Generate a compact unit serial: SAPE-<gtin last 5>-<base36 time>-<rand>. */
export function generateUnitSerial(gtin: string): string {
  const t = Date.now().toString(36).toUpperCase()
  const r = randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
  return `SAPE-${gtin.slice(-5).padStart(5, '0')}-${t}-${r}`
}

// ---------------------------------------------------------------------------
// Hash chain + merkle anchoring (Layer 3)
// ---------------------------------------------------------------------------

export const GENESIS_HASH = '0'.repeat(64)

export function hashEvent(input: {
  serial: string
  eventType: string
  from?: string | null
  to?: string | null
  location?: string | null
  occurredAt: string
  previousHash: string
}): string {
  return createHash('sha256')
    .update(JSON.stringify(input))
    .digest('hex')
}

export function merkleRoot(hashes: string[]): string {
  if (hashes.length === 0) return GENESIS_HASH
  let level = [...hashes]
  while (level.length > 1) {
    const next: string[] = []
    for (let i = 0; i < level.length; i += 2) {
      const a = level[i]
      const b = level[i + 1] ?? a
      next.push(createHash('sha256').update(a + b).digest('hex'))
    }
    level = next
  }
  return level[0]
}

export function hashBlock(input: {
  blockNumber: number
  previousHash: string
  merkleRoot: string
  eventCount: number
  anchoredAt: string
}): string {
  return createHash('sha256').update(JSON.stringify(input)).digest('hex')
}

// ---------------------------------------------------------------------------
// Anomaly screening (duplicate scans, recalled goods, expiry)
// ---------------------------------------------------------------------------

export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical'

export interface AnomalyFinding {
  anomalyType: string
  severity: AnomalySeverity
  description: string
}

export function screenSale(options: {
  serialStatus: string
  expiry: Date | null
  recentScansLast60s: number
  lastSoldAt: Date | null
}): AnomalyFinding[] {
  const findings: AnomalyFinding[] = []
  if (options.serialStatus === 'recalled') {
    findings.push({
      anomalyType: 'recalled-item-sale',
      severity: 'critical',
      description: 'Serial is flagged RECALLED and attempted for sale',
    })
  }
  if (options.serialStatus === 'sold' || options.lastSoldAt) {
    findings.push({
      anomalyType: 'duplicate-sale',
      severity: 'high',
      description: 'Serial was already marked sold — possible counterfeit re-use',
    })
  }
  if (options.recentScansLast60s > 2) {
    findings.push({
      anomalyType: 'scan-velocity',
      severity: 'medium',
      description: `Unusual scan velocity: ${options.recentScansLast60s} verifications in the last 60s`,
    })
  }
  if (options.expiry && options.expiry.getTime() < Date.now()) {
    findings.push({
      anomalyType: 'expired-batch',
      severity: 'medium',
      description: 'Batch expiry date has passed',
    })
  }
  return findings
}

// ---------------------------------------------------------------------------
// POS verification result contract
// ---------------------------------------------------------------------------

export type VerifyResult = 'AUTHENTIC' | 'INVALID_PAYLOAD' | 'UNKNOWN_SERIAL' | 'RECALLED' | 'SUSPECT'

export interface PosCheckOutcome {
  result: VerifyResult
  findings: AnomalyFinding[]
  latencyMs: number
  serialId: string | null
}
