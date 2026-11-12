'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Smartphone,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Copy,
  Check
} from 'lucide-react'

interface MTNMOMOModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MTNMOMOModal({ open, onOpenChange }: MTNMOMOModalProps) {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState<'push' | 'pull' | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [amount, setAmount] = useState<number>(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transactionId, setTransactionId] = useState('')
  const [copied, setCopied] = useState(false)

  const quickAmounts = [50, 100, 200, 500]

  const handleConfirm = () => {
    setIsProcessing(true)
    setTimeout(() => {
      setIsProcessing(false)
      setTransactionId(`MTN${Date.now().toString().slice(-8)}`)
      setStep(5)
    }, 2000)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(transactionId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const resetModal = () => {
    setStep(1)
    setDirection(null)
    setPhoneNumber('')
    setAmount(0)
    setTransactionId('')
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetModal()
      onOpenChange(open)
    }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FFCC00] flex items-center justify-center">
              <Smartphone className="h-4 w-4 text-black" />
            </div>
            MTN MoMo
          </DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`w-8 h-1 rounded-full ${
                s <= step ? 'bg-[#FFCC00]' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-center text-[#757575]">Select transaction type</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setDirection('push')
                  setStep(2)
                }}
                className="p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-[#FFCC00] active:scale-95 transition-all"
              >
                <ArrowUpRight className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-[#1A1A1A]">Push</p>
                <p className="text-xs text-[#757575]">Send Money</p>
              </button>
              <button
                onClick={() => {
                  setDirection('pull')
                  setStep(2)
                }}
                className="p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-[#FFCC00] active:scale-95 transition-all"
              >
                <ArrowDownLeft className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-[#1A1A1A]">Pull</p>
                <p className="text-xs text-[#757575]">Request Money</p>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-center text-[#757575]">
              {direction === 'push' ? 'Send money to' : 'Request money from'}
            </p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#757575]">+27</span>
              <Input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 9))}
                placeholder="00 000 0000"
                className="h-14 pl-12 text-xl text-center font-medium"
              />
            </div>
            <p className="text-xs text-center text-[#757575]">
              Enter MTN Mobile Money number
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={phoneNumber.length < 9}
                className="flex-1 bg-[#FFCC00] hover:bg-[#FFD54F] text-black"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-center text-[#757575]">Enter amount</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-[#757575]">R</span>
              <Input
                type="number"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="0.00"
                className="h-14 pl-8 text-2xl font-bold text-center"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((amt) => (
                <Button
                  key={amt}
                  variant={amount === amt ? 'default' : 'outline'}
                  onClick={() => setAmount(amt)}
                  className={`h-10 ${amount === amt ? 'bg-[#FFCC00] hover:bg-[#FFD54F] text-black' : ''}`}
                >
                  R{amt}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => setStep(4)}
                disabled={amount <= 0}
                className="flex-1 bg-[#FFCC00] hover:bg-[#FFD54F] text-black"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-center text-[#757575]">Review & Confirm</p>
            <Card className="bg-[#FFF8E1] border-[#FFCC00]">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#757575]">Type</span>
                    <span className="font-medium capitalize">{direction}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#757575]">Phone</span>
                    <span className="font-medium">+27 {phoneNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#757575]">Amount</span>
                    <span className="font-bold text-lg">R {amount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-xs">PIN</span>
              </div>
              <Input
                type="password"
                placeholder="Enter PIN"
                className="flex-1 h-10"
                maxLength={4}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isProcessing}
                className="flex-1 bg-[#FFCC00] hover:bg-[#FFD54F] text-black"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm'
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">Transaction Successful!</h3>
            <p className="text-sm text-[#757575] mb-4">
              {direction === 'push' ? 'Money sent successfully' : 'Money request sent'}
            </p>
            <Card className="bg-gray-50 mb-4">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#757575]">Transaction ID</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">{transactionId}</span>
                    <button onClick={handleCopy}>
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-[#757575]" />
                      )}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Button
              onClick={() => {
                resetModal()
                onOpenChange(false)
              }}
              className="w-full bg-[#FFCC00] hover:bg-[#FFD54F] text-black"
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
