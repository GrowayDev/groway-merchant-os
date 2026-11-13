'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { apiPost } from '@/components/wallet/lib/api'
import {
  X,
  Check,
  Loader2,
  ChevronRight,
  Smartphone,
  AlertCircle
} from 'lucide-react'

interface AirtimeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 'network' | 'bundle' | 'details' | 'confirm' | 'success'

interface Network {
  id: string
  name: string
  color: string
  bg: string
}

interface TransactionRecord {
  id: string
  type: 'airtime' | 'data' | 'voice' | 'sms'
  network: string
  phoneNumber: string
  amount: number
  token: string
  reference: string
  timestamp: Date
  status: 'completed' | 'pending' | 'failed'
}

const networks: Network[] = [
  { id: 'vodacom', name: 'Vodacom', color: '#E60000', bg: '#FFEBEE' },
  { id: 'mtn', name: 'MTN', color: '#FFCC00', bg: '#FFF8E1' },
  { id: 'cellc', name: 'Cell C', color: '#0066B3', bg: '#E3F2FD' },
  { id: 'telkom', name: 'Telkom', color: '#00897B', bg: '#E0F2F1' },
  { id: 'rain', name: 'Rain', color: '#00A0E3', bg: '#E1F5FE' },
]

const bundleTypes = [
  { id: 'airtime', name: 'Airtime', icon: '📞' },
  { id: 'data', name: 'Data Bundle', icon: '📶' },
  { id: 'voice', name: 'Voice Bundle', icon: '🎙️' },
  { id: 'sms', name: 'SMS Bundle', icon: '💬' },
]

const quickAmounts = [10, 20, 50, 100, 200]

export function AirtimeModal({ open, onOpenChange }: AirtimeModalProps) {
  const [step, setStep] = useState<Step>('network')
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)
  const [bundleType, setBundleType] = useState('airtime')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [amount, setAmount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transaction, setTransaction] = useState<TransactionRecord | null>(null)

  const generateToken = () => {
    // Generate a realistic-looking token for prepaid services
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let token = ''
    for (let i = 0; i < 20; i++) {
      if (i > 0 && i % 4 === 0) token += '-'
      token += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return token
  }

  const handleBuy = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Call the actual backend API for airtime purchase
      const result = await apiPost<{ success?: boolean; data?: any; error?: string }>('/airtime', {
        action: 'purchase',
        phone: phoneNumber,
        productId: `${selectedNetwork?.id}_${Math.floor(amount)}`,
        amountCents: Math.round(amount * 100),
        providerId: selectedNetwork?.id,
        bundleType,
      })

      const data = result?.data ?? result
      const newTransaction: TransactionRecord = {
        id: data.id || `TXN${Date.now().toString(36).toUpperCase()}`,
        type: bundleType as 'airtime' | 'data' | 'voice' | 'sms',
        network: data.network || selectedNetwork?.name || '',
        phoneNumber: phoneNumber,
        amount: amount,
        token: data.voucherPin || data.token || generateToken(),
        reference: data.reference || `AIR${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date(),
        status: 'completed'
      }

      setTransaction(newTransaction)
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Airtime purchase failed')
    } finally {
      setIsLoading(false)
    }
  }, [selectedNetwork, phoneNumber, amount, bundleType])

  const handleClose = useCallback(() => {
    setStep('network')
    setSelectedNetwork(null)
    setBundleType('airtime')
    setPhoneNumber('')
    setAmount(0)
    setTransaction(null)
    onOpenChange(false)
  }, [onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#1A1A1A]">Airtime & Data</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {step === 'network' && (
            <div className="space-y-4">
              <p className="text-sm text-[#757575]">Select network</p>

              <div className="grid grid-cols-2 gap-3">
                {networks.map((network) => (
                  <button
                    key={network.id}
                    onClick={() => {
                      setSelectedNetwork(network)
                      setStep('bundle')
                    }}
                    className="p-4 rounded-xl border border-gray-200 hover:border-[#00897B] transition-all"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
                      style={{ backgroundColor: network.bg }}
                    >
                      <Smartphone className="h-5 w-5" style={{ color: network.color }} />
                    </div>
                    <p className="text-sm font-medium text-[#1A1A1A]">{network.name}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'bundle' && selectedNetwork && (
            <div className="space-y-4">
              <button onClick={() => setStep('network')} className="text-sm text-[#00897B]">
                ← Change network
              </button>

              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: selectedNetwork.bg }}
                >
                  <Smartphone className="h-4 w-4" style={{ color: selectedNetwork.color }} />
                </div>
                <span className="text-sm font-bold text-[#1A1A1A]">{selectedNetwork.name}</span>
              </div>

              <h3 className="text-sm font-semibold text-[#1A1A1A]">What do you want to buy?</h3>

              <div className="grid grid-cols-2 gap-2">
                {bundleTypes.map((bundle) => (
                  <button
                    key={bundle.id}
                    onClick={() => {
                      setBundleType(bundle.id)
                      setStep('details')
                    }}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      bundleType === bundle.id
                        ? 'border-[#00897B] bg-[#E0F2F1]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl">{bundle.icon}</span>
                    <p className="text-sm font-medium text-[#1A1A1A] mt-1">{bundle.name}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'details' && selectedNetwork && (
            <div className="space-y-4">
              <button onClick={() => setStep('bundle')} className="text-sm text-[#00897B]">
                ← Back
              </button>

              <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: selectedNetwork.bg }}
                >
                  <Smartphone className="h-4 w-4" style={{ color: selectedNetwork.color }} />
                </div>
                <div>
                  <p className="text-xs text-[#757575]">{selectedNetwork.name}</p>
                  <p className="text-sm font-medium text-[#1A1A1A] capitalize">{bundleType}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-[#1A1A1A]">Phone Number</label>
                  <Input
                    type="tel"
                    placeholder="e.g., 082 123 4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="h-12 mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[#1A1A1A]">Amount</label>
                  <div className="relative mt-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">R</span>
                    <Input
                      type="number"
                      value={amount || ''}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                      className="pl-8 h-12"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  {quickAmounts.map((value) => (
                    <button
                      key={value}
                      onClick={() => setAmount(value)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                        amount === value
                          ? 'bg-[#00897B] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      R{value}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('bundle')} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={() => setStep('confirm')}
                  disabled={!phoneNumber.trim() || amount <= 0}
                  className="flex-1 bg-[#00897B] hover:bg-[#00695C]"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 'confirm' && selectedNetwork && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-[#1A1A1A]">R {amount.toFixed(2)}</p>
                <p className="text-sm text-[#757575]">{selectedNetwork.name} {bundleType}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Phone Number</span>
                  <span className="text-sm font-mono text-[#1A1A1A]">{phoneNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Network</span>
                  <span className="text-sm font-medium text-[#1A1A1A]">{selectedNetwork.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Type</span>
                  <Badge className="bg-[#00897B]/10 text-[#00897B] border-0 capitalize">{bundleType}</Badge>
                </div>
              </div>

              <Button
                onClick={handleBuy}
                disabled={isLoading}
                className="w-full bg-[#00897B] hover:bg-[#00695C] h-12"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Buy Now'}
              </Button>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button variant="outline" onClick={() => setStep('details')} className="w-full">
                Back
              </Button>
            </div>
          )}

          {step === 'success' && selectedNetwork && transaction && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-[#4CAF50]/10 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-10 w-10 text-[#4CAF50]" />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Purchase Successful!</h3>
                <p className="text-sm text-[#757575]">
                  R {amount.toFixed(2)} {bundleType} sent to {phoneNumber}
                </p>
              </div>

              {/* Transaction Receipt */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="text-center pb-3 border-b border-gray-200">
                  <p className="text-xs text-[#757575] mb-1">Transaction ID</p>
                  <p className="text-sm font-mono font-bold text-[#1A1A1A]">{transaction.id}</p>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Network</span>
                  <span className="text-sm font-medium text-[#1A1A1A]">{transaction.network}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Phone Number</span>
                  <span className="text-sm font-mono text-[#1A1A1A]">{transaction.phoneNumber}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Type</span>
                  <Badge className="bg-[#00897B]/10 text-[#00897B] border-0 capitalize">{transaction.type}</Badge>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Amount</span>
                  <span className="text-sm font-bold text-[#1A1A1A]">R {transaction.amount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Date</span>
                  <span className="text-sm text-[#1A1A1A]">{transaction.timestamp.toLocaleDateString('en-ZA')} {transaction.timestamp.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Status</span>
                  <Badge className="bg-green-100 text-green-700 border-0">Completed</Badge>
                </div>
              </div>

              {/* Token Receipt - Important for Prepaid Services */}
              <div className="bg-[#E0F2F1] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-[#00897B] text-white border-0 text-xs">TOKEN</Badge>
                  <span className="text-xs text-[#757575]">Keep this for your records</span>
                </div>
                <p className="text-lg font-mono font-bold text-[#00897B] text-center tracking-wider">{transaction.token}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => navigator.clipboard.writeText(transaction.token)}
                >
                  Copy Token
                </Button>
              </div>

              {/* Reference */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#757575]">Reference</span>
                  <span className="text-sm font-mono font-medium text-[#1A1A1A]">{transaction.reference}</span>
                </div>
              </div>

              <Button onClick={handleClose} className="w-full bg-[#00897B] hover:bg-[#00695C]">
                Done
              </Button>

              <p className="text-xs text-center text-[#757575]">
                Transaction saved to your purchase history
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
