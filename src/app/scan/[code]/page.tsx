'use client'

/**
 * SAPE Public Consumer Verification Page
 * Standalone QR target: /scan/{code}
 * Calls the public consumer scan API (no auth) and shows provenance results.
 */

import { useState, useEffect, use, useCallback } from 'react'
import Link from 'next/link'

interface ScanResult {
  verified: boolean
  reason?: string
  productName?: string
  manufacturer?: string | null
  gtin?: string
  batchNumber?: string
  serialNumber?: string
  serialStatus?: string
  expiry?: string
  signatureValid?: boolean
  expired?: boolean
  networkBlockReason?: string | null
  verificationCount?: number
  custodySummary?: {
    eventType: string
    locationLabel: string | null
    timestamp: string
    actorName: string | null
  }[]
}

export default function ConsumerScanPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<ScanResult | null>(null)

  const fetchScan = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/merchant-os/api/sape/consumer/scan?code=${encodeURIComponent(decodeURIComponent(code))}`
      )
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ verified: false, reason: 'NETWORK_ERROR' })
    } finally {
      setLoading(false)
    }
  }, [code])

  useEffect(() => {
    fetchScan()
  }, [fetchScan])

  const fmtDateTime = (value: string) =>
    new Date(value).toLocaleString('en-ZA', {
      timeZone: 'Africa/Johannesburg',
      dateStyle: 'medium',
      timeStyle: 'short',
    })

  const fmtDate = (value: string) =>
    new Date(value).toLocaleDateString('en-ZA', { timeZone: 'Africa/Johannesburg' })

  const eventColor = (eventType: string) => {
    switch (eventType) {
      case 'MANUFACTURED':
      case 'IMPORTED':
        return 'bg-teal-100 text-teal-800'
      case 'RECEIVED_GROSUPPLY':
      case 'RECEIVED_NODE':
      case 'SHELVED':
        return 'bg-emerald-100 text-emerald-800'
      case 'DISPATCHED_NODE':
        return 'bg-amber-100 text-amber-800'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      {/* Minimal header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[#00897B] flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
              width="18"
              height="18"
            >
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-[#1A1A1A]">SAPE Verify</p>
            <p className="text-[10px] text-[#757575]">Groway Merchant OS · Anti-Counterfeit Provenance</p>
          </div>
          <Link href="/merchant-os" className="text-[10px] text-[#00897B] underline underline-offset-2">
            Merchant OS
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-24 bg-gray-200 rounded-2xl" />
            <div className="h-40 bg-gray-200 rounded-2xl" />
            <div className="h-40 bg-gray-200 rounded-2xl" />
          </div>
        ) : !result ? (
          <ResultCard
            tone="red"
            icon="✕"
            title="Verification error"
            message="Something went wrong. Please try scanning again."
          />
        ) : result.verified ? (
          <div className="space-y-4">
            {/* Verified banner */}
            <div className="rounded-2xl bg-emerald-600 text-white p-5 text-center shadow-sm">
              <div className="mx-auto h-14 w-14 rounded-full bg-white/20 flex items-center justify-center text-3xl mb-2">
                ✓
              </div>
              <p className="text-lg font-bold">Genuine Product</p>
              <p className="text-xs text-emerald-100 mt-1">
                Verified against the SAPE provenance registry
              </p>
            </div>

            {/* Product details */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-bold text-[#1A1A1A]">
                  {result.productName || 'Registered Product'}
                </p>
                <p className="text-xs text-[#757575]">
                  {result.manufacturer ? `Made by ${result.manufacturer}` : 'Manufacturer unknown'}
                </p>
              </div>
              <dl className="px-4 py-3 space-y-2 text-xs">
                <DetailRow label="GTIN" value={result.gtin} mono />
                <DetailRow label="Batch" value={result.batchNumber} mono />
                <DetailRow label="Serial" value={result.serialNumber} mono />
                <DetailRow label="Expiry" value={result.expiry ? fmtDate(result.expiry) : null} />
                <DetailRow label="Status" value={result.serialStatus} />
                <DetailRow label="Times scanned" value={result.verificationCount != null ? `${result.verificationCount}` : null} />
              </dl>
            </div>

            {/* Custody journey */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-bold text-[#1A1A1A]">Journey</p>
                <p className="text-[11px] text-[#757575]">Chain of custody, oldest to newest</p>
              </div>
              <div className="px-4 py-4">
                {result.custodySummary && result.custodySummary.length > 0 ? (
                  <div className="relative pl-5 space-y-4 border-l-2 border-gray-200">
                    {result.custodySummary.map((e, i) => (
                      <div key={i} className="relative">
                        <span className="absolute -left-[26px] top-1 h-3 w-3 rounded-full bg-[#00897B] ring-2 ring-white" />
                        <span
                          className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${eventColor(e.eventType)}`}
                        >
                          {e.eventType.replace(/_/g, ' ')}
                        </span>
                        {e.locationLabel && (
                          <p className="text-xs text-[#1A1A1A] mt-1">{e.locationLabel}</p>
                        )}
                        <p className="text-[10px] text-[#757575] mt-0.5">
                          {fmtDateTime(e.timestamp)}
                          {e.actorName ? ` · ${e.actorName}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#757575]">No custody journey recorded yet.</p>
                )}
              </div>
            </div>

            <p className="text-center text-[10px] text-[#757575]">
              Scanned {result.verificationCount ?? 1} time(s) · SAPE serial #{result.serialNumber}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <ResultCard
              tone="red"
              icon="⚠"
              title="Cannot Verify Product"
              message={
                result.reason === 'SERIAL_NOT_FOUND'
                  ? 'This code is not in the SAPE registry. It may be counterfeit — do not use or consume this product.'
                  : result.reason === 'EXPIRED'
                    ? 'This product has expired. Do not sell or consume it.'
                    : result.reason === 'NETWORK_BLOCKED'
                      ? 'This product has been blocked by authorities. Do not sell or consume it.'
                      : result.reason === 'SIGNATURE_INVALID'
                        ? 'The product signature does not match — possible tampering or counterfeit.'
                        : 'Verification failed. Please try again.'
              }
            />
            <div className="bg-white rounded-2xl border border-gray-200 px-4 py-3">
              <p className="text-xs font-semibold text-[#1A1A1A] mb-1">What to do</p>
              <ul className="text-xs text-[#757575] list-disc pl-4 space-y-1">
                <li>Do not use or consume this product.</li>
                <li>Report it to the shop owner or submit a tip-off in the Merchant OS.</li>
                <li>Authorities (SAPS / NCC) are automatically alerted on repeated failures.</li>
              </ul>
            </div>
          </div>
        )}
      </main>

      <footer className="py-4 bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-md mx-auto px-4 text-center">
          <p className="text-[10px] text-[#757575]">
            Powered by SAPE · SpazaBox Authentication &amp; Provenance Engine
          </p>
        </div>
      </footer>
    </div>
  )
}

function DetailRow({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[#757575] shrink-0">{label}</dt>
      <dd className={`text-right font-medium text-[#1A1A1A] truncate ${mono ? 'font-mono text-[11px]' : ''}`}>
        {value || '—'}
      </dd>
    </div>
  )
}

function ResultCard({
  tone,
  icon,
  title,
  message,
}: {
  tone: 'red' | 'amber'
  icon: string
  title: string
  message: string
}) {
  const tones = tone === 'red' ? 'bg-red-600' : 'bg-amber-500'
  return (
    <div className={`${tones} text-white rounded-2xl p-5 text-center shadow-sm`}>
      <div className="mx-auto h-14 w-14 rounded-full bg-white/20 flex items-center justify-center text-3xl mb-2">
        {icon}
      </div>
      <p className="text-lg font-bold">{title}</p>
      <p className="text-xs text-white/90 mt-1">{message}</p>
    </div>
  )
}
