'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  X,
  Check,
  Loader2,
  Shield,
  Heart,
  Car,
  User,
  ChevronRight,
  Star,
  Umbrella
} from 'lucide-react'

interface InsuranceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 'types' | 'quote' | 'compare' | 'apply' | 'success'

interface InsuranceType {
  id: string
  name: string
  icon: typeof Heart
  color: string
  bg: string
  description: string
}

interface InsuranceProvider {
  id: string
  name: string
  logo: string
  monthlyPremium: number
  rating: number
  features: string[]
}

const insuranceTypes: InsuranceType[] = [
  { id: 'funeral', name: 'Funeral Cover', icon: Heart, color: '#9C27B0', bg: '#F3E5F5', description: 'From R30/month' },
  { id: 'life', name: 'Life Insurance', icon: Shield, color: '#00897B', bg: '#E0F2F1', description: 'From R100/month' },
  { id: 'health', name: 'Health Cover', icon: Heart, color: '#E91E63', bg: '#FCE4EC', description: 'From R250/month' },
  { id: 'vehicle', name: 'Vehicle Insurance', icon: Car, color: '#2196F3', bg: '#E3F2FD', description: 'From R300/month' },
]

const providers: InsuranceProvider[] = [
  { id: '1', name: 'Hollard', logo: 'H', monthlyPremium: 150, rating: 4.5, features: ['Fast claims', '24/7 support'] },
  { id: '2', name: 'Old Mutual', logo: 'O', monthlyPremium: 165, rating: 4.7, features: ['Trusted brand', 'Flexible cover'] },
  { id: '3', name: 'Sanlam', logo: 'S', monthlyPremium: 145, rating: 4.6, features: ['Low premiums', 'Quick payout'] },
  { id: '4', name: 'Metropolitan', logo: 'M', monthlyPremium: 140, rating: 4.4, features: ['Affordable', 'Easy claims'] },
]

export function InsuranceModal({ open, onOpenChange }: InsuranceModalProps) {
  const [step, setStep] = useState<Step>('types')
  const [selectedType, setSelectedType] = useState<InsuranceType | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<InsuranceProvider | null>(null)
  const [coverAmount, setCoverAmount] = useState<number>(50000)
  const [isLoading, setIsLoading] = useState(false)

  const handleGetQuote = useCallback(async () => {
    if (!selectedType) return
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setStep('compare')
    setIsLoading(false)
  }, [selectedType])

  const handleApply = useCallback(async () => {
    if (!selectedProvider) return
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setStep('success')
    setIsLoading(false)
  }, [selectedProvider])

  const handleClose = useCallback(() => {
    setStep('types')
    setSelectedType(null)
    setSelectedProvider(null)
    onOpenChange(false)
  }, [onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#1A1A1A]">Insurance</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {step === 'types' && (
            <div className="space-y-4">
              <p className="text-sm text-[#757575]">Choose insurance type</p>

              <div className="grid grid-cols-2 gap-3">
                {insuranceTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.id}
                      onClick={() => {
                        setSelectedType(type)
                        setStep('quote')
                      }}
                      className="p-4 rounded-xl border border-gray-200 hover:border-[#00897B] transition-all text-left"
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-2"
                        style={{ backgroundColor: type.bg }}
                      >
                        <Icon className="h-6 w-6" style={{ color: type.color }} />
                      </div>
                      <p className="text-sm font-bold text-[#1A1A1A]">{type.name}</p>
                      <p className="text-xs text-[#757575]">{type.description}</p>
                    </button>
                  )
                })}
              </div>

              <div className="bg-[#E0F2F1] rounded-xl p-4 mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Umbrella className="h-5 w-5 text-[#00897B]" />
                  <span className="text-sm font-bold text-[#1A1A1A]">Already covered?</span>
                </div>
                <p className="text-xs text-[#757575]">View and manage your active policies</p>
              </div>
            </div>
          )}

          {step === 'quote' && selectedType && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: selectedType.bg }}
                >
                  <selectedType.icon className="h-6 w-6" style={{ color: selectedType.color }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1A1A1A]">{selectedType.name}</p>
                  <p className="text-xs text-[#757575]">Get a personalized quote</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#1A1A1A]">Cover Amount</label>
                  <div className="relative mt-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">R</span>
                    <Input
                      type="number"
                      value={coverAmount}
                      onChange={(e) => setCoverAmount(parseInt(e.target.value) || 0)}
                      className="pl-8 h-12"
                    />
                  </div>
                </div>

                <Input placeholder="Your age" type="number" className="h-12" />
                <Input placeholder="Your income" type="number" className="h-12" />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('types')} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleGetQuote}
                  disabled={isLoading}
                  className="flex-1 bg-[#00897B] hover:bg-[#00695C]"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Get Quote'}
                </Button>
              </div>
            </div>
          )}

          {step === 'compare' && selectedType && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-[#757575]">Cover Amount</p>
                <p className="text-xl font-bold text-[#1A1A1A]">R {coverAmount.toLocaleString()}</p>
              </div>

              <h3 className="text-sm font-semibold text-[#1A1A1A]">Compare Providers</h3>

              <div className="space-y-3">
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => setSelectedProvider(provider)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      selectedProvider?.id === provider.id
                        ? 'border-[#00897B] bg-[#E0F2F1]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <span className="text-sm font-bold text-[#00897B]">{provider.logo}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#1A1A1A]">{provider.name}</p>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs text-[#757575]">{provider.rating}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#00897B]">R{provider.monthlyPremium}</p>
                        <p className="text-xs text-[#757575]">/month</p>
                      </div>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {provider.features.map((feature, i) => (
                        <Badge key={i} variant="outline" className="text-[10px]">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('quote')} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={() => setStep('apply')}
                  disabled={!selectedProvider}
                  className="flex-1 bg-[#00897B] hover:bg-[#00695C]"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 'apply' && selectedType && selectedProvider && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[#1A1A1A]">Apply for {selectedType.name}</h3>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Provider</span>
                  <span className="text-sm font-medium text-[#1A1A1A]">{selectedProvider.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Cover</span>
                  <span className="text-sm font-medium text-[#1A1A1A]">R {coverAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Monthly Premium</span>
                  <span className="text-sm font-bold text-[#00897B]">R {selectedProvider.monthlyPremium}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Input placeholder="Full name" className="h-12" />
                <Input placeholder="ID Number" className="h-12" />
                <Input placeholder="Phone number" type="tel" className="h-12" />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('compare')} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleApply}
                  disabled={isLoading}
                  className="flex-1 bg-[#00897B] hover:bg-[#00695C]"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                </Button>
              </div>
            </div>
          )}

          {step === 'success' && selectedType && selectedProvider && (
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-[#4CAF50]/10 flex items-center justify-center mx-auto mb-4">
                <Check className="h-10 w-10 text-[#4CAF50]" />
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Application Submitted!</h3>
              <p className="text-sm text-[#757575] mb-4">
                Your {selectedType.name} application with {selectedProvider.name} is being processed
              </p>
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-xs text-[#757575] mb-1">Reference</p>
                <p className="text-sm font-mono font-medium text-[#1A1A1A]">INS{Date.now().toString(36).toUpperCase()}</p>
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
