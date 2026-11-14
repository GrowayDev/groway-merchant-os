/**
 * SAPE — SpazaBox Authentication & Provenance Engine
 * Shared server-side helpers: GS1 parsing, cryptographic signatures,
 * GS1 DataMatrix encoding and serial number generation.
 */

import { createHmac, createHash, randomUUID } from 'node:crypto'

export const SAPE_SIGNING_KEY = process.env.SAPE_SIGNING_KEY || 'sape-dev-signing-key'

/** Canonical expiry (YYYY-MM-DD) so signatures stay stable across DB round-trips */
export function canonicalExpiry(expiry: string | Date): string {
  return new Date(expiry).toISOString().slice(0, 10)
}

/** GS1 (17) expiry AI: YYMMDD */
export function gs1ExpiryYYMMDD(expiry: string | Date): string {
  return new Date(expiry).toISOString().slice(2, 10).replace(/-/g, '')
}

/** HMAC-SHA256 hex signature of `gtin|batch|expiry|manufacturerId` */
export function computeSapeSignature(
  gtin: string,
  batchNumber: string,
  expiryDate: string | Date,
  manufacturerId: string
): string {
  const payload = [
    gtin.trim(),
    batchNumber.trim(),
    canonicalExpiry(expiryDate),
    manufacturerId,
  ].join('|')
  return createHmac('sha256', SAPE_SIGNING_KEY).update(payload).digest('hex')
}

/** Base64-encoded GS1 DataMatrix payload: (01)GTIN(17)YYMMDD(10)BATCH */
export function buildGs1DataMatrix(
  gtin: string,
  expiryDate: string | Date,
  batchNumber: string
): string {
  const gs1 = `(01)${gtin.trim()}(17)${gs1ExpiryYYMMDD(expiryDate)}(10)${batchNumber.trim()}`
  return Buffer.from(gs1, 'utf-8').toString('base64')
}

/** SHA-256 anchor hash of signature + timestamp */
export function computeAnchorHash(signature: string, timestamp: Date): string {
  return createHash('sha256').update(`${signature}${timestamp.toISOString()}`).digest('hex')
}

/** SAPE-{gtin last 6}-{batch}-{base36 counter padded} */
export function buildSerialNumber(gtin: string, batchNumber: string, counter: number): string {
  const gtinPart = gtin.trim().slice(-6)
  const batchPart = batchNumber.trim().replace(/\s+/g, '')
  return `SAPE-${gtinPart}-${batchPart}-${counter.toString(36).toUpperCase().padStart(4, '0')}`
}

export interface ParsedGs1 {
  gtin?: string
  expiry?: string // YYMMDD
  batch?: string
  serial?: string
  productionDate?: string // YYMMDD
}

/**
 * Parse a GS1 element string, with or without parentheses.
 * e.g. "(01)06001234000017(17)250101(10)ABC123(21)SAPE-..." or
 *      "01060012340000171725010110ABC12321SAPE-..."
 */
export function parseGs1ElementString(raw: string): ParsedGs1 {
  const data = (raw || '').trim()
  if (!data) return {}

  const result: ParsedGs1 = {}

  // Bracketed format
  if (data.includes('(')) {
    const re = /\((\d{2})\)([^()]*)/g
    let m: RegExpExecArray | null
    while ((m = re.exec(data)) !== null) {
      const ai = m[1]
      const value = m[2].trim()
      if (ai === '01') result.gtin = value
      else if (ai === '17') result.expiry = value
      else if (ai === '10') result.batch = value
      else if (ai === '21') result.serial = value
      else if (ai === '11') result.productionDate = value
    }
    return result
  }

  // Unbracketed format — fixed-length AIs (01: 14, 17/11: 6), variable AIs (10, 21)
  let pos = 0
  while (pos + 2 <= data.length) {
    const ai = data.slice(pos, pos + 2)
    pos += 2
    if (ai === '01') {
      if (pos + 14 > data.length) break
      result.gtin = data.slice(pos, pos + 14)
      pos += 14
    } else if (ai === '17' || ai === '11') {
      if (pos + 6 > data.length) break
      const v = data.slice(pos, pos + 6)
      pos += 6
      if (ai === '17') result.expiry = v
      else result.productionDate = v
    } else if (ai === '10') {
      // Variable length: runs until the next AI marker ('21') or end of string
      const idx = data.indexOf('21', pos)
      if (idx > pos) {
        result.batch = data.slice(pos, idx)
        pos = idx
      } else {
        result.batch = data.slice(pos)
        pos = data.length
      }
    } else if (ai === '21') {
      result.serial = data.slice(pos)
      pos = data.length
    } else {
      break
    }
  }
  return result
}

/** Build a human-readable sample element string from identity parts */
export function buildSampleBarcode(
  gtin: string,
  expiryDate: string | Date,
  batchNumber: string,
  serialNumber: string
): string {
  return `(01)${gtin}(17)${gs1ExpiryYYMMDD(expiryDate)}(10)${batchNumber}(21)${serialNumber}`
}

export { randomUUID as sapeId }

export const SAPE_AUTHORITIES = ['SAHPRA', 'NCC', 'SARS', 'SAPS', 'DTIC', 'SABS'] as const

export const SAPE_CUSTODY_EVENTS = [
  'MANUFACTURED',
  'IMPORTED',
  'RECEIVED_GROSUPPLY',
  'DISPATCHED_NODE',
  'RECEIVED_NODE',
  'SHELVED',
  'SOLD',
] as const
