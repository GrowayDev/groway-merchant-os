'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Zap,
  CheckCircle2,
  Clock,
  Calendar,
  TrendingUp,
  AlertCircle,
  Loader2,
  ChevronRight
} from 'lucide-react'

interface PayPlusModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PayPlusModal({ open, onOpenChange }: PayPlusModalProps) {
  const [step, setStep] = useState<'main' | 'withdraw' | 'confirm' | 'success'>('main')
  const [selectedPlan, setSelectedPlan] = useState<'payperuse' | 'unlimited'>('payperuse')
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0)
  const [isProcessing, setIsProcessing] = useState(false)

  const availableWage = 5536
  const daysWorked = 18
  const totalDays = 22
  const accessPercentage = 60

  const quickAmounts = [500, 1000, 2000, 3000]

  const handleWithdraw = () => {
    if (withdrawAmount > 0 && withdrawAmount <= availableWage) {
      setStep('confirm')
    }
  }

  const processWithdrawal = async () => {
    setIsProcessing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsProcessing(false)
    setStep('success')
  }

  const fee = selectedPlan === 'payperuse' ? withdrawAmount * 0.03 : 0
  const totalReceive = withdrawAmount - fee

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Pay+ Earned Wage Access
          </DialogTitle>
        </DialogHeader>

        {step === 'main' && (
          <div className="space-y-4">
            {/* Employer Status */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Employer Verified</p>
                    <p className="text-xs text-green-600">ABC Manufacturing Pty Ltd</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Available Wage */}
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <p className="text-blue-100 text-sm mb-1">Available to Access</p>
                <p className="text-3xl font-bold mb-2">R {availableWage.toLocaleString()}</p>
                <div className="flex items-center justify-between text-sm text-blue-100">
                  <span>{accessPercentage}% of earned wages</span>
                  <Badge className="bg-white/20 text-white border-0">Day {daysWorked}</Badge>
                </div>
                <Progress value={(daysWorked / totalDays) * 100} className="h-2 mt-2 bg-blue-400" />
                <p className="text-xs text-blue-100 mt-1">{daysWorked} of {totalDays} days worked</p>
              </CardContent>
            </Card>

            {/* Days Worked Calendar */}
            <div>
              <p className="text-sm font-medium text-[#1A1A1A] mb-2">This Month</p>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 22 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                      i < daysWorked
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Plan Selection */}
            <div>
              <p className="text-sm font-medium text-[#1A1A1A] mb-2">Your Plan</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedPlan('payperuse')}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    selectedPlan === 'payperuse'
                      ? 'border-[#00897B] bg-[#E0F2F1]'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <p className="text-sm font-bold text-[#1A1A1A]">Pay Per Use</p>
                  <p className="text-xs text-[#757575]">3% fee per withdrawal</p>
                </button>
                <button
                  onClick={() => setSelectedPlan('unlimited')}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    selectedPlan === 'unlimited'
                      ? 'border-[#00897B] bg-[#E0F2F1]'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <p className="text-sm font-bold text-[#1A1A1A]">Unlimited</p>
                  <p className="text-xs text-[#757575]">R99/month, no fees</p>
                </button>
              </div>
            </div>

            {/* Quick Withdraw */}
            <div>
              <p className="text-sm font-medium text-[#1A1A1A] mb-2">Quick Withdraw</p>
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    onClick={() => {
                      setWithdrawAmount(amount)
                      setStep('withdraw')
                    }}
                    className="h-10"
                  >
                    R {amount}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={() => setStep('withdraw')}
              className="w-full bg-[#00897B] hover:bg-[#00695C]"
            >
              Withdraw Custom Amount
            </Button>
          </div>
        )}

        {step === 'withdraw' && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-[#1A1A1A] mb-2">Enter Amount</p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-[#757575]">R</span>
                <input
                  type="number"
                  value={withdrawAmount || ''}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full h-14 pl-8 pr-4 text-2xl font-bold text-center border-2 border-gray-200 rounded-xl focus:border-[#00897B] focus:outline-none"
                  max={availableWage}
                />
              </div>
              <p className="text-xs text-[#757575] mt-1 text-center">
                Maximum: R {availableWage.toLocaleString()}
              </p>
            </div>

            {withdrawAmount > availableWage && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <p className="text-sm text-red-600">Amount exceeds available balance</p>
              </div>
            )}

            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant={withdrawAmount === amount ? 'default' : 'outline'}
                  onClick={() => setWithdrawAmount(amount)}
                  className={`h-10 ${withdrawAmount === amount ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}`}
                >
                  R {amount}
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('main')} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleWithdraw}
                disabled={withdrawAmount <= 0 || withdrawAmount > availableWage}
                className="flex-1 bg-[#00897B] hover:bg-[#00695C]"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4">
            <Card className="bg-[#E0F2F1] border-[#00897B]">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#757575]">Withdrawal Amount</span>
                    <span className="font-bold">R {withdrawAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#757575]">Fee ({selectedPlan === 'payperuse' ? '3%' : '0%'})</span>
                    <span className="font-bold text-red-500">- R {fee.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-medium">You Receive</span>
                      <span className="font-bold text-[#00897B] text-lg">R {totalReceive.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
              <Clock className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-700">Funds will be available instantly</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('withdraw')} className="flex-1">
                Back
              </Button>
              <Button
                onClick={processWithdrawal}
                disabled={isProcessing}
                className="flex-1 bg-[#00897B] hover:bg-[#00695C]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm Withdrawal'
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">Withdrawal Successful!</h3>
            <p className="text-sm text-[#757575] mb-4">
              R {totalReceive.toFixed(2)} has been added to your wallet
            </p>
            <Button
              onClick={() => {
                setStep('main')
                setWithdrawAmount(0)
                onOpenChange(false)
              }}
              className="bg-[#00897B] hover:bg-[#00695C]"
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
