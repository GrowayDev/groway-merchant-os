'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  X,
  Check,
  Loader2,
  ChevronRight,
  Globe,
  ArrowRight
} from 'lucide-react'

interface RemittanceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 'country' | 'provider' | 'details' | 'confirm' | 'success'

const countries = [
  { code: 'ZW', name: 'Zimbabwe', currency: 'USD', flag: '🇿🇼' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', currency: 'KES', flag: '🇰🇪' },
  { code: 'GH', name: 'Ghana', currency: 'GHS', flag: '🇬🇭' },
  { code: 'MW', name: 'Malawi', currency: 'MWK', flag: '🇲🇼' },
  { code: 'ZM', name: 'Zambia', currency: 'ZMW', flag: '🇿🇲' },
]

const providers = [
  { id: 'chipper', name: 'Chipper Cash', rate: 1.0, fee: 0, speed: 'Instant' },
  { id: 'mukuru', name: 'Mukuru', rate: 0.98, fee: 25, speed: 'Same day' },
  { id: 'worldremit', name: 'WorldRemit', rate: 0.97, fee: 35, speed: '1-2 days' },
  { id: 'western', name: 'Western Union', rate: 0.96, fee: 45, speed: '1-3 days' },
  { id: 'mama', name: 'Mama Money', rate: 0.99, fee: 15, speed: 'Same day' },
]

export function RemittanceModal({ open, onOpenChange }: RemittanceModalProps) {
  const [step, setStep] = useState<Step>('country')
  const [selectedCountry, setSelectedCountry] = useState<typeof countries[0] | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<typeof providers[0] | null>(null)
  const [amount, setAmount] = useState<number>(1000)
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [transactionId, setTransactionId] = useState('')

  const convertedAmount = selectedProvider ? Math.round(amount * selectedProvider.rate) : amount
  const totalFee = selectedProvider ? selectedProvider.fee : 0

  const handleSend = useCallback(async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setTransactionId(`REM${Date.now().toString(36).toUpperCase()}`)
    setStep('success')
    setIsLoading(false)
  }, [])

  const handleClose = useCallback(() => {
    setStep('country')
    setSelectedCountry(null)
    setSelectedProvider(null)
    setAmount(1000)
    setRecipientName('')
    setRecipientPhone('')
    onOpenChange(false)
  }, [onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#1A1A1A]">International Transfer</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {step === 'country' && (
            <div className="space-y-4">
              <p className="text-sm text-[#757575]">Send money to family and friends abroad</p>

              <div className="relative">
                <Globe className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input placeholder="Search country..." className="pl-10" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {countries.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => {
                      setSelectedCountry(country)
                      setStep('provider')
                    }}
                    className="p-3 rounded-xl border border-gray-200 hover:border-[#00897B] text-left flex items-center gap-2"
                  >
                    <span className="text-xl">{country.flag}</span>
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">{country.name}</p>
                      <p className="text-xs text-[#757575]">{country.currency}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'provider' && selectedCountry && (
            <div className="space-y-4">
              <button onClick={() => setStep('country')} className="text-sm text-[#00897B]">
                ← Change country
              </button>

              <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
                <span className="text-xl">{selectedCountry.flag}</span>
                <span className="text-sm font-bold text-[#1A1A1A]">Sending to {selectedCountry.name}</span>
              </div>

              <h3 className="text-sm font-semibold text-[#1A1A1A]">Compare Providers</h3>

              <div className="space-y-2">
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => {
                      setSelectedProvider(provider)
                      setStep('details')
                    }}
                    className="w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-[#00897B] text-left"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-[#1A1A1A]">{provider.name}</span>
                      <Badge className={provider.fee === 0 ? 'bg-[#4CAF50]/10 text-[#4CAF50] border-0' : 'bg-gray-100 text-gray-700 border-0'}>
                        {provider.fee === 0 ? 'No fee' : `R${provider.fee} fee`}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#757575]">Exchange Rate</span>
                      <span className="font-medium text-[#1A1A1A]">
                        1 ZAR = {(provider.rate * 0.053).toFixed(4)} {selectedCountry.currency}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-[#757575]">Speed</span>
                      <span className="text-[#00897B] font-medium">{provider.speed}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'details' && selectedCountry && selectedProvider && (
            <div className="space-y-4">
              <button onClick={() => setStep('provider')} className="text-sm text-[#00897B]">
                ← Change provider
              </button>

              <div className="bg-[#E0F2F1] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-[#757575]">You send</span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#757575]">R</span>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                      className="pl-8 w-32 text-right text-xl font-bold"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-center py-2">
                  <div className="w-8 h-8 rounded-full bg-[#00897B] flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#757575]">They receive</span>
                  <div className="text-right">
                    <p className="text-xl font-bold text-[#00897B]">
                      {(convertedAmount * 0.053).toFixed(2)} {selectedCountry.currency}
                    </p>
                    <p className="text-xs text-[#757575]">1 ZAR = {(selectedProvider.rate * 0.053).toFixed(4)} {selectedCountry.currency}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Input
                  placeholder="Recipient name"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="h-12"
                />
                <Input
                  placeholder="Recipient phone number"
                  type="tel"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#757575]">Transfer fee</span>
                  <span className="font-medium text-[#1A1A1A]">
                    {totalFee === 0 ? <span className="text-[#4CAF50]">FREE</span> : `R ${totalFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#757575]">Delivery</span>
                  <span className="font-medium text-[#00897B]">{selectedProvider.speed}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-bold text-[#1A1A1A]">Total to pay</span>
                    <span className="text-lg font-bold text-[#00897B]">R {amount + totalFee}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setStep('confirm')}
                disabled={!recipientName.trim() || !recipientPhone.trim()}
                className="w-full bg-[#00897B] hover:bg-[#00695C]"
              >
                Continue
              </Button>
            </div>
          )}

          {step === 'confirm' && selectedCountry && selectedProvider && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-[#1A1A1A]">R {amount + totalFee}</p>
                <p className="text-sm text-[#757575]">to {selectedCountry.name}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Recipient</span>
                  <span className="text-sm font-medium text-[#1A1A1A]">{recipientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Phone</span>
                  <span className="text-sm font-mono text-[#1A1A1A]">{recipientPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Amount sent</span>
                  <span className="text-sm font-medium text-[#1A1A1A]">R {amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">They receive</span>
                  <span className="text-sm font-bold text-[#00897B]">
                    {(convertedAmount * 0.053).toFixed(2)} {selectedCountry.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Provider</span>
                  <span className="text-sm font-medium text-[#1A1A1A]">{selectedProvider.name}</span>
                </div>
              </div>

              <Button
                onClick={handleSend}
                disabled={isLoading}
                className="w-full bg-[#00897B] hover:bg-[#00695C] h-12"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send Money'}
              </Button>

              <Button variant="outline" onClick={() => setStep('details')} className="w-full">
                Back
              </Button>
            </div>
          )}

          {step === 'success' && selectedCountry && selectedProvider && (
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-[#4CAF50]/10 flex items-center justify-center mx-auto mb-4">
                <Check className="h-10 w-10 text-[#4CAF50]" />
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Money Sent!</h3>
              <p className="text-sm text-[#757575] mb-4">
                R {amount} to {recipientName} in {selectedCountry.name}
              </p>
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-xs text-[#757575] mb-1">Transaction ID</p>
                <p className="text-sm font-mono font-medium text-[#1A1A1A]">{transactionId}</p>
              </div>
              <div className="flex items-center justify-center gap-2 p-3 bg-[#E0F2F1] rounded-xl mb-4">
                <span className="text-xl">{selectedCountry.flag}</span>
                <span className="text-sm font-medium text-[#00897B]">
                  {(convertedAmount * 0.053).toFixed(2)} {selectedCountry.currency} arriving {selectedProvider.speed.toLowerCase()}
                </span>
              </div>
              <Button onClick={handleClose} className="w-full bg-[#00897B] hover:bg-[#00695C]">
                Done
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
