'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  X,
  Check,
  Loader2,
  Zap,
  Droplets,
  Tv,
  Building2,
  Car,
  ChevronRight,
  Search
} from 'lucide-react'

interface BillsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 'categories' | 'provider' | 'details' | 'confirm' | 'success'

interface BillCategory {
  id: string
  name: string
  icon: typeof Zap
  color: string
  bg: string
  providers: string[]
}

interface BillTransaction {
  id: string
  category: string
  provider: string
  accountNumber: string
  amount: number
  token?: string
  receiptNumber: string
  reference: string
  timestamp: Date
  status: 'completed' | 'pending' | 'failed'
  accountHolder?: string
}

const billCategories: BillCategory[] = [
  { id: 'electricity', name: 'Electricity', icon: Zap, color: '#FFC107', bg: '#FFF8E1', providers: ['Eskom', 'City Power', 'Prepaid'] },
  { id: 'water', name: 'Water', icon: Droplets, color: '#2196F3', bg: '#E3F2FD', providers: ['Johannesburg Water', 'City of Cape Town'] },
  { id: 'dstv', name: 'DStv', icon: Tv, color: '#00897B', bg: '#E0F2F1', providers: ['MultiChoice'] },
  { id: 'municipal', name: 'Municipal', icon: Building2, color: '#607D8B', bg: '#ECEFF1', providers: ['City of Joburg', 'City of Tshwane'] },
  { id: 'traffic', name: 'Traffic Fines', icon: Car, color: '#F44336', bg: '#FFEBEE', providers: ['AARTO', 'Metro Police'] },
]

export function BillsModal({ open, onOpenChange }: BillsModalProps) {
  const [step, setStep] = useState<Step>('categories')
  const [selectedCategory, setSelectedCategory] = useState<BillCategory | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [accountNumber, setAccountNumber] = useState('')
  const [amount, setAmount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [accountInfo, setAccountInfo] = useState<{ name: string; balance: number } | null>(null)
  const [transaction, setTransaction] = useState<BillTransaction | null>(null)

  const generateToken = () => {
    // Generate a realistic-looking prepaid electricity token
    const digits = '0123456789'
    let token = ''
    for (let i = 0; i < 20; i++) {
      if (i > 0 && i % 4 === 0) token += ' '
      token += digits.charAt(Math.floor(Math.random() * digits.length))
    }
    return token
  }

  const handleLookupAccount = useCallback(async () => {
    if (!accountNumber.trim()) return
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setAccountInfo({ name: 'J. Mokoena', balance: 1250.50 })
    setAmount(1250.50)
    setIsLoading(false)
  }, [accountNumber])

  const handlePay = useCallback(async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Create transaction record with token for prepaid services
    const isPrepaid = selectedCategory?.id === 'electricity' || selectedCategory?.id === 'water'
    const newTransaction: BillTransaction = {
      id: `TXN${Date.now().toString(36).toUpperCase()}`,
      category: selectedCategory?.name || '',
      provider: selectedProvider,
      accountNumber: accountNumber,
      amount: amount,
      token: isPrepaid ? generateToken() : undefined,
      receiptNumber: `RCP${Date.now().toString(36).toUpperCase()}`,
      reference: `BIL${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date(),
      status: 'completed',
      accountHolder: accountInfo?.name
    }

    setTransaction(newTransaction)
    setStep('success')
    setIsLoading(false)
  }, [selectedCategory, selectedProvider, accountNumber, amount, accountInfo])

  const handleClose = useCallback(() => {
    setStep('categories')
    setSelectedCategory(null)
    setSelectedProvider('')
    setAccountNumber('')
    setAmount(0)
    setAccountInfo(null)
    setTransaction(null)
    onOpenChange(false)
  }, [onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#1A1A1A]">Pay Bills</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {step === 'categories' && (
            <div className="space-y-4">
              <p className="text-sm text-[#757575]">Select bill category</p>

              <div className="grid grid-cols-2 gap-3">
                {billCategories.map((category) => {
                  const Icon = category.icon
                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category)
                        setStep('provider')
                      }}
                      className="p-4 rounded-xl border border-gray-200 hover:border-[#00897B] transition-all text-left"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
                        style={{ backgroundColor: category.bg }}
                      >
                        <Icon className="h-5 w-5" style={{ color: category.color }} />
                      </div>
                      <p className="text-sm font-medium text-[#1A1A1A]">{category.name}</p>
                    </button>
                  )
                })}
              </div>

              <div className="mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search for biller..." className="pl-10" />
                </div>
              </div>
            </div>
          )}

          {step === 'provider' && selectedCategory && (
            <div className="space-y-4">
              <button onClick={() => setStep('categories')} className="text-sm text-[#00897B]">
                ← Back to categories
              </button>

              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: selectedCategory.bg }}
                >
                  <selectedCategory.icon className="h-5 w-5" style={{ color: selectedCategory.color }} />
                </div>
                <p className="text-sm font-bold text-[#1A1A1A]">{selectedCategory.name}</p>
              </div>

              <h3 className="text-sm font-semibold text-[#1A1A1A]">Select Provider</h3>

              <div className="space-y-2">
                {selectedCategory.providers.map((provider) => (
                  <button
                    key={provider}
                    onClick={() => {
                      setSelectedProvider(provider)
                      setStep('details')
                    }}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100"
                  >
                    <span className="text-sm font-medium text-[#1A1A1A]">{provider}</span>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'details' && selectedCategory && (
            <div className="space-y-4">
              <button onClick={() => setStep('provider')} className="text-sm text-[#00897B]">
                ← Back to providers
              </button>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-[#757575]">Provider</p>
                <p className="text-sm font-bold text-[#1A1A1A]">{selectedProvider}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-[#1A1A1A]">Account / Meter Number</label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="Enter account number"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="h-12 flex-1"
                    />
                    <Button
                      onClick={handleLookupAccount}
                      disabled={!accountNumber.trim() || isLoading}
                      variant="outline"
                      className="px-4"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lookup'}
                    </Button>
                  </div>
                </div>

                {accountInfo && (
                  <div className="bg-[#E0F2F1] rounded-xl p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-[#757575]">Account Holder</span>
                      <span className="text-sm font-medium text-[#1A1A1A]">{accountInfo.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[#757575]">Amount Due</span>
                      <span className="text-sm font-bold text-[#00897B]">R {accountInfo.balance.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-[#1A1A1A]">Amount to Pay</label>
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
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('provider')} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={() => setStep('confirm')}
                  disabled={amount <= 0}
                  className="flex-1 bg-[#00897B] hover:bg-[#00695C]"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 'confirm' && selectedCategory && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-[#1A1A1A]">R {amount.toFixed(2)}</p>
                <p className="text-sm text-[#757575]">{selectedProvider} • {selectedCategory.name}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Account Number</span>
                  <span className="text-sm font-mono text-[#1A1A1A]">{accountNumber}</span>
                </div>
                {accountInfo && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[#757575]">Account Holder</span>
                    <span className="text-sm font-medium text-[#1A1A1A]">{accountInfo.name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Fee</span>
                  <span className="text-sm font-medium text-[#4CAF50]">FREE</span>
                </div>
              </div>

              <Button
                onClick={handlePay}
                disabled={isLoading}
                className="w-full bg-[#00897B] hover:bg-[#00695C] h-12"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Pay Now'}
              </Button>

              <Button variant="outline" onClick={() => setStep('details')} className="w-full">
                Back
              </Button>
            </div>
          )}

          {step === 'success' && transaction && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-[#4CAF50]/10 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-10 w-10 text-[#4CAF50]" />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Payment Successful!</h3>
                <p className="text-sm text-[#757575]">
                  R {amount.toFixed(2)} paid to {selectedProvider}
                </p>
              </div>

              {/* Transaction Receipt */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="text-center pb-3 border-b border-gray-200">
                  <p className="text-xs text-[#757575] mb-1">Transaction ID</p>
                  <p className="text-sm font-mono font-bold text-[#1A1A1A]">{transaction.id}</p>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Provider</span>
                  <span className="text-sm font-medium text-[#1A1A1A]">{transaction.provider}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Category</span>
                  <Badge className="bg-[#00897B]/10 text-[#00897B] border-0">{transaction.category}</Badge>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Account Number</span>
                  <span className="text-sm font-mono text-[#1A1A1A]">{transaction.accountNumber}</span>
                </div>

                {transaction.accountHolder && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[#757575]">Account Holder</span>
                    <span className="text-sm font-medium text-[#1A1A1A]">{transaction.accountHolder}</span>
                  </div>
                )}

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

              {/* Token Receipt - For Prepaid Electricity/Water */}
              {transaction.token && (
                <div className="bg-[#E0F2F1] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-[#00897B] text-white border-0 text-xs">PREPAID TOKEN</Badge>
                    <span className="text-xs text-[#757575]">Enter this token on your meter</span>
                  </div>
                  <p className="text-xl font-mono font-bold text-[#00897B] text-center tracking-wider">{transaction.token}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => navigator.clipboard.writeText(transaction.token || '')}
                  >
                    Copy Token
                  </Button>
                </div>
              )}

              {/* Receipt Number */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#757575]">Receipt Number</span>
                  <span className="text-sm font-mono font-medium text-[#1A1A1A]">{transaction.receiptNumber}</span>
                </div>
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
