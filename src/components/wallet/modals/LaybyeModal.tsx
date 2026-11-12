'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ShoppingBag,
  CheckCircle2,
  Calendar,
  Clock,
  ChevronRight,
  Plus,
  Loader2,
  AlertCircle
} from 'lucide-react'

interface LaybyeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LaybyeModal({ open, onOpenChange }: LaybyeModalProps) {
  const [activeView, setActiveView] = useState<'list' | 'detail' | 'new' | 'payment' | 'success'>('list')
  const [selectedLaybye, setSelectedLaybye] = useState<number | null>(null)
  const [newLaybyeStep, setNewLaybyeStep] = useState(1)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [isProcessing, setIsProcessing] = useState(false)

  // Mock laybye data
  const activeLaybyes = [
    {
      id: 1,
      item: 'Samsung 32" Smart TV',
      totalAmount: 4500,
      paidAmount: 2700,
      deposit: 450,
      weeklyPayment: 225,
      nextPaymentDate: '2025-04-07',
      status: 'active',
      weeksRemaining: 8,
    },
    {
      id: 2,
      item: 'Nike Air Max Sneakers',
      totalAmount: 2200,
      paidAmount: 1100,
      deposit: 220,
      weeklyPayment: 110,
      nextPaymentDate: '2025-04-08',
      status: 'active',
      weeksRemaining: 10,
    },
  ]

  const completedLaybyes = [
    {
      id: 3,
      item: 'Apple AirPods Pro',
      totalAmount: 3500,
      paidAmount: 3500,
      completedDate: '2025-03-15',
      status: 'completed',
    },
  ]

  const popularItems = [
    'Samsung TV',
    'iPhone 15',
    'Nike Sneakers',
    'HP Laptop',
    'DSTV Decoder',
    'Furniture',
  ]

  const handleNewPayment = () => {
    if (paymentAmount > 0) {
      setIsProcessing(true)
      setTimeout(() => {
        setIsProcessing(false)
        setActiveView('success')
      }, 2000)
    }
  }

  const selectedLaybyeData = activeLaybyes.find(l => l.id === selectedLaybye)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-[#FF5722]" />
            Digital Laybye
          </DialogTitle>
        </DialogHeader>

        {activeView === 'list' && (
          <div className="space-y-4">
            {/* Active Laybyes */}
            <div>
              <p className="text-sm font-medium text-[#1A1A1A] mb-2">Active Laybyes</p>
              {activeLaybyes.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-xl">
                  <ShoppingBag className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-[#757575]">No active laybyes</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeLaybyes.map((laybye) => (
                    <button
                      key={laybye.id}
                      onClick={() => {
                        setSelectedLaybye(laybye.id)
                        setActiveView('detail')
                      }}
                      className="w-full p-3 bg-white rounded-xl border border-gray-200 text-left active:scale-[0.98] transition-transform"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-[#1A1A1A]">{laybye.item}</span>
                        <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                          Active
                        </Badge>
                      </div>
                      <Progress value={(laybye.paidAmount / laybye.totalAmount) * 100} className="h-2 mb-1" />
                      <div className="flex justify-between text-xs text-[#757575]">
                        <span>R {laybye.paidAmount.toLocaleString()} paid</span>
                        <span>R {laybye.totalAmount.toLocaleString()} total</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Laybyes */}
            {completedLaybyes.length > 0 && (
              <div>
                <p className="text-sm font-medium text-[#1A1A1A] mb-2">Completed</p>
                <div className="space-y-2">
                  {completedLaybyes.map((laybye) => (
                    <div
                      key={laybye.id}
                      className="p-3 bg-green-50 rounded-xl border border-green-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-[#1A1A1A]">{laybye.item}</span>
                        </div>
                        <span className="text-xs text-green-600">Completed</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={() => setActiveView('new')}
              className="w-full bg-[#FF5722] hover:bg-[#E64A19]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Start New Laybye
            </Button>
          </div>
        )}

        {activeView === 'detail' && selectedLaybyeData && (
          <div className="space-y-4">
            <button
              onClick={() => setActiveView('list')}
              className="text-sm text-[#00897B]"
            >
              ← Back to Laybyes
            </button>

            <Card className="bg-gradient-to-r from-[#FF5722] to-[#E64A19] text-white">
              <CardContent className="p-4">
                <p className="text-white/70 text-xs mb-1">{selectedLaybyeData.item}</p>
                <p className="text-2xl font-bold mb-2">R {selectedLaybyeData.totalAmount.toLocaleString()}</p>
                <Progress
                  value={(selectedLaybyeData.paidAmount / selectedLaybyeData.totalAmount) * 100}
                  className="h-3 bg-white/30"
                />
                <div className="flex justify-between text-sm text-white/80 mt-1">
                  <span>R {selectedLaybyeData.paidAmount.toLocaleString()} paid</span>
                  <span>R {(selectedLaybyeData.totalAmount - selectedLaybyeData.paidAmount).toLocaleString()} remaining</span>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-[#757575]">Weekly Payment</p>
                  <p className="text-lg font-bold text-[#1A1A1A]">R {selectedLaybyeData.weeklyPayment}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-[#757575]">Weeks Left</p>
                  <p className="text-lg font-bold text-[#1A1A1A]">{selectedLaybyeData.weeksRemaining}</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
              <Calendar className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-700">
                Next payment: {new Date(selectedLaybyeData.nextPaymentDate).toLocaleDateString('en-ZA')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => setActiveView('payment')}
                className="bg-[#00897B] hover:bg-[#00695C]"
              >
                Make Payment
              </Button>
              <Button variant="outline">
                View Schedule
              </Button>
            </div>
          </div>
        )}

        {activeView === 'new' && (
          <div className="space-y-4">
            <button
              onClick={() => setActiveView('list')}
              className="text-sm text-[#00897B]"
            >
              ← Back
            </button>

            {newLaybyeStep === 1 && (
              <>
                <p className="text-sm font-medium text-[#1A1A1A]">Step 1: Select Item</p>
                <div className="grid grid-cols-2 gap-2">
                  {popularItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => setNewLaybyeStep(2)}
                      className="p-3 bg-white rounded-xl border border-gray-200 text-left active:scale-95 transition-transform"
                    >
                      <span className="text-sm text-[#1A1A1A]">{item}</span>
                    </button>
                  ))}
                </div>
                <Button variant="outline" className="w-full" onClick={() => setNewLaybyeStep(2)}>
                  Custom Item
                </Button>
              </>
            )}

            {newLaybyeStep === 2 && (
              <>
                <p className="text-sm font-medium text-[#1A1A1A]">Step 2: Set Deposit</p>
                <div className="grid grid-cols-2 gap-2">
                  {[10, 15, 20, 25].map((percent) => (
                    <button
                      key={percent}
                      onClick={() => setNewLaybyeStep(3)}
                      className="p-3 bg-white rounded-xl border border-gray-200 text-center active:scale-95 transition-transform"
                    >
                      <span className="text-lg font-bold text-[#00897B]">{percent}%</span>
                      <p className="text-xs text-[#757575]">deposit</p>
                    </button>
                  ))}
                </div>
              </>
            )}

            {newLaybyeStep === 3 && (
              <>
                <p className="text-sm font-medium text-[#1A1A1A]">Step 3: Payment Schedule</p>
                <div className="space-y-2">
                  {['weekly', 'biweekly', 'monthly'].map((freq) => (
                    <button
                      key={freq}
                      onClick={() => setNewLaybyeStep(4)}
                      className="w-full p-3 bg-white rounded-xl border border-gray-200 text-left flex justify-between items-center active:scale-[0.98] transition-transform"
                    >
                      <span className="text-sm text-[#1A1A1A] capitalize">{freq}</span>
                      <ChevronRight className="h-4 w-4 text-[#757575]" />
                    </button>
                  ))}
                </div>
              </>
            )}

            {newLaybyeStep === 4 && (
              <>
                <p className="text-sm font-medium text-[#1A1A1A]">Step 4: Confirm</p>
                <Card className="bg-[#E0F2F1] border-[#00897B]">
                  <CardContent className="p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#757575]">Item</span>
                        <span className="font-medium">Selected Item</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#757575]">Total Amount</span>
                        <span className="font-medium">R 2,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#757575]">Deposit</span>
                        <span className="font-medium">R 200</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#757575]">Weekly Payment</span>
                        <span className="font-medium">R 90</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Button
                  onClick={() => {
                    setActiveView('success')
                    setTimeout(() => {
                      setActiveView('list')
                      setNewLaybyeStep(1)
                    }, 2000)
                  }}
                  className="w-full bg-[#00897B] hover:bg-[#00695C]"
                >
                  Start Laybye
                </Button>
              </>
            )}
          </div>
        )}

        {activeView === 'payment' && (
          <div className="space-y-4">
            <button
              onClick={() => setActiveView('detail')}
              className="text-sm text-[#00897B]"
            >
              ← Back
            </button>

            <p className="text-sm font-medium text-[#1A1A1A]">Make a Payment</p>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-[#757575]">R</span>
              <Input
                type="number"
                value={paymentAmount || ''}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                placeholder="0.00"
                className="h-14 pl-8 text-2xl font-bold text-center"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[100, 200, 500].map((amount) => (
                <Button
                  key={amount}
                  variant={paymentAmount === amount ? 'default' : 'outline'}
                  onClick={() => setPaymentAmount(amount)}
                  className={paymentAmount === amount ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}
                >
                  R {amount}
                </Button>
              ))}
            </div>

            <Button
              onClick={handleNewPayment}
              disabled={paymentAmount <= 0 || isProcessing}
              className="w-full bg-[#00897B] hover:bg-[#00695C]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Pay Now'
              )}
            </Button>
          </div>
        )}

        {activeView === 'success' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">Success!</h3>
            <p className="text-sm text-[#757575]">
              Your action was completed successfully
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
