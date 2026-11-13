'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { apiGet, apiPost } from '@/components/wallet/lib/api'
import {
  X,
  QrCode,
  Camera,
  Check,
  Loader2,
  Copy,
  Share2,
  ArrowRight,
  AlertCircle
} from 'lucide-react'

interface QRPayModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Mode = 'scan' | 'generate' | 'pay'
type Step = 'scan' | 'amount' | 'confirm' | 'success'

export function QRPayModal({ open, onOpenChange }: QRPayModalProps) {
  const [mode, setMode] = useState<Mode>('scan')
  const [step, setStep] = useState<Step>('scan')
  const [amount, setAmount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [scannedData, setScannedData] = useState<string | null>(null)
  const [scannedMerchant, setScannedMerchant] = useState<string>('Merchant')
  const [transactionId, setTransactionId] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [myQrPayload, setMyQrPayload] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(false)

  const growayId = 'GW-THABO-8472'

  // Generate (or fetch) the user's own QR payload when they switch to My QR tab.
  useEffect(() => {
    if (!open || mode !== 'generate') return
    let cancelled = false
    async function loadMyQr() {
      setQrLoading(true)
      try {
        const res = await apiGet<{ success?: boolean; data?: Record<string, unknown> }>('/payments/qr')
        if (cancelled) return
        const data = (res?.data ?? {}) as Record<string, unknown>
        setMyQrPayload(String(data.payload || data.qrPayload || JSON.stringify({ userId: 'user-001', growayId })))
      } catch {
        if (!cancelled) {
          setMyQrPayload(JSON.stringify({ userId: 'user-001', growayId }))
        }
      } finally {
        if (!cancelled) setQrLoading(false)
      }
    }
    loadMyQr()
    return () => {
      cancelled = true
    }
  }, [open, mode])

  const handleScan = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // In a real native client this would come from the camera. We hit the
      // QR endpoint to "decode" a simulated merchant payload + amount.
      const res = await apiGet<{ success?: boolean; data?: Record<string, unknown> }>('/payments/qr?demo=1')
      const data = (res?.data ?? {}) as Record<string, unknown>
      const merchant = String(data.merchantName || data.merchant || 'Shoprite #1234')
      const scannedAmount = Number(data.amountCents ?? data.amount ?? 23450) / 100
      setScannedMerchant(merchant)
      setAmount(scannedAmount)
      setScannedData(`Merchant: ${merchant}\nAmount: R ${scannedAmount.toFixed(2)}`)
      setStep('confirm')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handlePay = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await apiPost<{ success?: boolean; data?: Record<string, unknown>; error?: string }>('/payments/qr', {
        merchantName: scannedMerchant,
        amountCents: Math.round(amount * 100),
        currency: 'ZAR',
      })
      if (res?.success === false) {
        setError(res.error || 'Payment failed')
        return
      }
      const data = (res?.data ?? {}) as Record<string, unknown>
      setTransactionId(String(data.id || data.transactionId || `QR${Date.now()}`))
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setIsLoading(false)
    }
  }, [scannedMerchant, amount])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(growayId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [growayId])

  const handleClose = useCallback(() => {
    setMode('scan')
    setStep('scan')
    setAmount(0)
    setScannedData(null)
    setScannedMerchant('Merchant')
    setTransactionId('')
    setError(null)
    onOpenChange(false)
  }, [onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#1A1A1A]">QR Pay</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-1 p-2 bg-gray-50 mx-4 mt-4 rounded-lg">
          {[
            { id: 'scan' as Mode, label: 'Scan' },
            { id: 'generate' as Mode, label: 'My QR' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                mode === id
                  ? 'bg-white text-[#00897B] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Scan Mode */}
          {mode === 'scan' && (
            <>
              {step === 'scan' && (
                <div className="flex flex-col items-center py-6">
                  <div className="relative w-64 h-64 bg-black rounded-2xl overflow-hidden mb-4">
                    {/* Camera View Placeholder */}
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                      {isLoading ? (
                        <Loader2 className="h-12 w-12 text-white animate-spin" />
                      ) : (
                        <Camera className="h-16 w-16 text-gray-600" />
                      )}
                    </div>
                    {/* Scan Frame */}
                    <div className="absolute inset-8 border-2 border-white/50 rounded-lg">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#00897B]" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#00897B]" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#00897B]" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#00897B]" />
                    </div>
                  </div>
                  <p className="text-sm text-[#757575] mb-4 text-center">
                    Point your camera at a merchant QR code to scan
                  </p>
                  <Button
                    onClick={handleScan}
                    disabled={isLoading}
                    className="w-full bg-[#00897B] hover:bg-[#00695C]"
                  >
                    {isLoading ? 'Scanning...' : 'Scan QR Code'}
                  </Button>

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                </div>
              )}

              {step === 'confirm' && scannedData && (
                <div className="space-y-4">
                  <div className="bg-[#E0F2F1] rounded-xl p-4">
                    <p className="text-sm text-[#757575] whitespace-pre-line">{scannedData}</p>
                  </div>

                  <div className="text-center">
                    <p className="text-3xl font-bold text-[#1A1A1A]">R {amount.toFixed(2)}</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-[#757575]">Merchant</span>
                      <span className="text-sm font-medium text-[#1A1A1A]">{scannedMerchant}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[#757575]">Reference</span>
                      <span className="text-sm font-medium text-[#1A1A1A]">QR-{Date.now().toString(36).toUpperCase()}</span>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <Button
                    onClick={handlePay}
                    disabled={isLoading}
                    className="w-full bg-[#00897B] hover:bg-[#00695C] h-12"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Pay R {amount.toFixed(2)} <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              )}

              {step === 'success' && (
                <div className="text-center py-6">
                  <div className="w-20 h-20 rounded-full bg-[#4CAF50]/10 flex items-center justify-center mx-auto mb-4">
                    <Check className="h-10 w-10 text-[#4CAF50]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Payment Successful!</h3>
                  <p className="text-sm text-[#757575] mb-4">
                    R {amount.toFixed(2)} paid to {scannedMerchant}
                  </p>
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-xs text-[#757575] mb-1">Transaction ID</p>
                    <p className="text-sm font-mono font-medium text-[#1A1A1A]">{transactionId}</p>
                  </div>
                  <Button onClick={handleClose} className="w-full bg-[#00897B] hover:bg-[#00695C]">
                    Done
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Generate/My QR Mode */}
          {mode === 'generate' && (
            <div className="flex flex-col items-center py-6">
              {qrLoading ? (
                <div className="w-56 h-56 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 animate-pulse">
                  <Loader2 className="h-8 w-8 text-[#00897B] animate-spin" />
                </div>
              ) : (
                <div className="w-56 h-56 bg-white rounded-2xl shadow-lg p-4 mb-4 border border-gray-100">
                  <div className="w-full h-full bg-[#E0F2F1] rounded-xl flex items-center justify-center">
                    <QrCode className="h-40 w-40 text-[#00897B]" />
                  </div>
                </div>
              )}
              <p className="text-lg font-bold text-[#1A1A1A] mb-1">Your QR Code</p>
              <p className="text-sm text-[#757575] mb-4">Scan to pay you</p>

              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2 mb-4">
                <span className="text-sm font-mono text-[#1A1A1A]">{growayId}</span>
                <button
                  onClick={handleCopy}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-[#4CAF50]" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              </div>

              <div className="w-full space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'My Groway QR',
                        text: `Pay me via Groway Wallet: ${growayId}`,
                      })
                    }
                  }}
                >
                  <Share2 className="h-4 w-4 mr-2" /> Share QR Code
                </Button>
              </div>

              {/* Generate Dynamic QR */}
              <div className="w-full mt-6 pt-6 border-t border-gray-100">
                <p className="text-sm font-medium text-[#1A1A1A] mb-3">Request Specific Amount</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R</span>
                    <Input
                      type="number"
                      placeholder="0.00"
                      className="pl-8"
                    />
                  </div>
                  <Button className="bg-[#00897B] hover:bg-[#00695C]">
                    Generate
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
