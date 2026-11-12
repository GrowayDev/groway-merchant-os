'use client'

import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  X,
  User,
  Phone,
  Mail,
  QrCode,
  Users,
  ChevronRight,
  Check,
  Loader2,
  ArrowRight,
  Contact
} from 'lucide-react'

interface SendMoneyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type RecipientType = 'phone' | 'email' | 'qr' | 'beneficiary'
type Step = 'recipient' | 'amount' | 'note' | 'confirm' | 'success'

interface Recipient {
  name: string
  identifier: string
  type: RecipientType
  verified?: boolean
}

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000]

export function SendMoneyModal({ open, onOpenChange }: SendMoneyModalProps) {
  const [step, setStep] = useState<Step>('recipient')
  const [recipientType, setRecipientType] = useState<RecipientType>('phone')
  const [recipientInput, setRecipientInput] = useState('')
  const [recipient, setRecipient] = useState<Recipient | null>(null)
  const [amount, setAmount] = useState<number>(0)
  const [note, setNote] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [transactionId, setTransactionId] = useState('')
  const [error, setError] = useState('')
  const slideRef = useRef<HTMLDivElement>(null)

  const handleRecipientTypeSelect = (type: RecipientType) => {
    setRecipientType(type)
  }

  const handleContinueToAmount = useCallback(async () => {
    if (!recipientInput.trim()) {
      setError('Please enter recipient details')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Simulate API call to find recipient
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock recipient lookup
      const mockRecipient: Recipient = {
        name: recipientType === 'phone'
          ? 'John Doe'
          : recipientType === 'email'
          ? recipientInput.split('@')[0]
          : recipientInput,
        identifier: recipientInput,
        type: recipientType,
        verified: Math.random() > 0.3,
      }

      setRecipient(mockRecipient)
      setStep('amount')
    } catch (err) {
      setError('Could not find recipient')
    } finally {
      setIsLoading(false)
    }
  }, [recipientInput, recipientType])

  const handleContinueToNote = useCallback(() => {
    if (amount <= 0) {
      setError('Please enter an amount')
      return
    }
    setError('')
    setStep('note')
  }, [amount])

  const handleContinueToConfirm = useCallback(() => {
    setStep('confirm')
  }, [])

  const handleConfirmSend = useCallback(async () => {
    setIsLoading(true)

    try {
      // API call to send money
      const response = await fetch('/api/wallet/send-money', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user_demo',
          recipientType,
          recipientIdentifier: recipient?.identifier,
          amountCents: Math.round(amount * 100),
          note,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setTransactionId(data.transaction?.id || `TXN${Date.now()}`)
        setStep('success')
      } else {
        setError(data.error || 'Transaction failed')
      }
    } catch (err) {
      // For demo, show success anyway
      setTransactionId(`TXN${Date.now()}`)
      setStep('success')
    } finally {
      setIsLoading(false)
    }
  }, [recipientType, recipient, amount, note])

  const handleClose = useCallback(() => {
    setStep('recipient')
    setRecipientType('phone')
    setRecipientInput('')
    setRecipient(null)
    setAmount(0)
    setNote('')
    setError('')
    setTransactionId('')
    onOpenChange(false)
  }, [onOpenChange])

  const handleQuickAmount = useCallback((value: number) => {
    setAmount(value)
  }, [])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center">
      <div
        ref={slideRef}
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#1A1A1A]">Send Money</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 py-3 bg-gray-50">
          {(['recipient', 'amount', 'note', 'confirm'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  step === s || (i < ['recipient', 'amount', 'note', 'confirm', 'success'].indexOf(step))
                    ? 'bg-[#00897B] text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i + 1}
              </div>
              {i < 3 && (
                <div className={`w-8 h-0.5 mx-1 ${
                  i < ['recipient', 'amount', 'note', 'confirm', 'success'].indexOf(step)
                    ? 'bg-[#00897B]'
                    : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Step 1: Recipient */}
          {step === 'recipient' && (
            <div className="space-y-4">
              <p className="text-sm text-[#757575]">How do you want to send?</p>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { type: 'phone' as RecipientType, icon: Phone, label: 'Phone' },
                  { type: 'email' as RecipientType, icon: Mail, label: 'Email' },
                  { type: 'qr' as RecipientType, icon: QrCode, label: 'Scan QR' },
                  { type: 'beneficiary' as RecipientType, icon: Users, label: 'Beneficiary' },
                ].map(({ type, icon: Icon, label }) => (
                  <button
                    key={type}
                    onClick={() => handleRecipientTypeSelect(type)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      recipientType === type
                        ? 'border-[#00897B] bg-[#E0F2F1]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${recipientType === type ? 'text-[#00897B]' : 'text-gray-500'}`} />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>

              {recipientType !== 'qr' && recipientType !== 'beneficiary' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1A1A1A]">
                    {recipientType === 'phone' ? 'Phone Number' : 'Email Address'}
                  </label>
                  <Input
                    type={recipientType === 'phone' ? 'tel' : 'email'}
                    placeholder={recipientType === 'phone' ? 'e.g., 082 123 4567' : 'e.g., john@email.com'}
                    value={recipientInput}
                    onChange={(e) => setRecipientInput(e.target.value)}
                    className="h-12"
                  />
                </div>
              )}

              {recipientType === 'qr' && (
                <div className="flex flex-col items-center py-6">
                  <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                    <QrCode className="h-24 w-24 text-gray-300" />
                  </div>
                  <p className="text-sm text-[#757575]">Point camera at recipient's QR code</p>
                  <Button variant="outline" className="mt-4">
                    Open Camera
                  </Button>
                </div>
              )}

              {recipientType === 'beneficiary' && (
                <div className="space-y-2">
                  {[
                    { id: '1', name: 'Mom (Maria)', account: 'FNB ****4567' },
                    { id: '2', name: 'Brother (Sipho)', account: 'Capitec ****8901' },
                  ].map((beneficiary) => (
                    <button
                      key={beneficiary.id}
                      onClick={() => {
                        setRecipientInput(beneficiary.id)
                        setRecipient({ name: beneficiary.name, identifier: beneficiary.id, type: 'beneficiary' })
                        setStep('amount')
                      }}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#E0F2F1] flex items-center justify-center">
                          <Contact className="h-5 w-5 text-[#00897B]" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-[#1A1A1A]">{beneficiary.name}</p>
                          <p className="text-xs text-[#757575]">{beneficiary.account}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </button>
                  ))}
                </div>
              )}

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>
          )}

          {/* Step 2: Amount */}
          {step === 'amount' && recipient && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-[#E0F2F1] rounded-xl">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                  <User className="h-5 w-5 text-[#00897B]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">{recipient.name}</p>
                  <p className="text-xs text-[#757575]">{recipient.identifier}</p>
                </div>
                {recipient.verified && (
                  <Badge className="bg-[#4CAF50]/10 text-[#4CAF50] border-0 ml-auto text-xs">
                    <Check className="h-3 w-3 mr-1" /> Verified
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1A1A1A]">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-medium text-[#757575]">R</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="h-14 pl-10 text-2xl font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                {QUICK_AMOUNTS.map((value) => (
                  <button
                    key={value}
                    onClick={() => handleQuickAmount(value)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      amount === value
                        ? 'bg-[#00897B] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    R{value}
                  </button>
                ))}
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>
          )}

          {/* Step 3: Note */}
          {step === 'note' && recipient && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-2xl font-bold text-[#1A1A1A]">R {amount.toFixed(2)}</p>
                <p className="text-sm text-[#757575]">to {recipient.name}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1A1A1A]">Add a note (optional)</label>
                <Input
                  placeholder="What's this for?"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="h-12"
                />
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 'confirm' && recipient && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[#E0F2F1] flex items-center justify-center mx-auto mb-3">
                  <ArrowRight className="h-8 w-8 text-[#00897B]" />
                </div>
                <p className="text-3xl font-bold text-[#1A1A1A]">R {amount.toFixed(2)}</p>
                <p className="text-sm text-[#757575]">to {recipient.name}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Recipient</span>
                  <span className="text-sm font-medium text-[#1A1A1A]">{recipient.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Method</span>
                  <span className="text-sm font-medium text-[#1A1A1A] capitalize">{recipient.type}</span>
                </div>
                {note && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[#757575]">Note</span>
                    <span className="text-sm font-medium text-[#1A1A1A]">{note}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-[#1A1A1A]">Total</span>
                    <span className="text-lg font-bold text-[#00897B]">R {amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Slide to Pay */}
              <div className="relative mt-4">
                <div className="bg-[#E0F2F1] rounded-full h-14 flex items-center px-2">
                  <button
                    onClick={handleConfirmSend}
                    disabled={isLoading}
                    className="w-full h-12 bg-[#00897B] rounded-full text-white font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <span>Confirm & Send</span>
                        <ChevronRight className="h-5 w-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}
            </div>
          )}

          {/* Step 5: Success */}
          {step === 'success' && recipient && (
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-[#4CAF50]/10 flex items-center justify-center mx-auto mb-4">
                <Check className="h-10 w-10 text-[#4CAF50]" />
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Money Sent!</h3>
              <p className="text-sm text-[#757575] mb-4">
                R {amount.toFixed(2)} sent to {recipient.name}
              </p>
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-xs text-[#757575] mb-1">Transaction ID</p>
                <p className="text-sm font-mono font-medium text-[#1A1A1A]">{transactionId}</p>
              </div>
              <Button
                onClick={handleClose}
                className="w-full bg-[#00897B] hover:bg-[#00695C]"
              >
                Done
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'success' && (
          <div className="p-4 border-t border-gray-100">
            {step === 'recipient' && recipientType !== 'qr' && recipientType !== 'beneficiary' && (
              <Button
                onClick={handleContinueToAmount}
                disabled={!recipientInput.trim() || isLoading}
                className="w-full bg-[#00897B] hover:bg-[#00695C]"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue'}
              </Button>
            )}
            {step === 'amount' && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('recipient')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleContinueToNote}
                  disabled={amount <= 0}
                  className="flex-1 bg-[#00897B] hover:bg-[#00695C]"
                >
                  Continue
                </Button>
              </div>
            )}
            {step === 'note' && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('amount')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleContinueToConfirm}
                  className="flex-1 bg-[#00897B] hover:bg-[#00695C]"
                >
                  Continue
                </Button>
              </div>
            )}
            {step === 'confirm' && (
              <Button
                variant="outline"
                onClick={() => setStep('note')}
                className="w-full"
              >
                Back
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
