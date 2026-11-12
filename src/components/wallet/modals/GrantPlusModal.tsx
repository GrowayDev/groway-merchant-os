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
  Users,
  CheckCircle2,
  Calendar,
  Clock,
  Phone,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react'

interface GrantPlusModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const GRANT_TYPES = [
  { id: 'older_persons', name: "Older Person's Grant", amount: 2090, color: '#00897B' },
  { id: 'disability', name: 'Disability Grant', amount: 2090, color: '#2196F3' },
  { id: 'child_support', name: 'Child Support Grant', amount: 530, color: '#FF9800' },
  { id: 'foster_child', name: 'Foster Child Grant', amount: 1130, color: '#9C27B0' },
  { id: 'care_dependency', name: 'Care Dependency Grant', amount: 2090, color: '#E91E63' },
  { id: 'war_veterans', name: "War Veteran's Grant", amount: 2120, color: '#795548' },
  { id: 'srd', name: 'Social Relief of Distress', amount: 350, color: '#607D8B' },
]

export function GrantPlusModal({ open, onOpenChange }: GrantPlusModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'actions'>('overview')

  // Mock data for user's grant
  const userGrant = {
    type: GRANT_TYPES[0], // Older Person's Grant
    status: 'active',
    nextPaymentDate: '2025-05-03',
    nextPaymentAmount: 2090,
    lastPaymentDate: '2025-04-03',
    lastPaymentAmount: 2090,
    paymentMethod: 'Bank Account',
    bankLast4: '4567',
  }

  const paymentHistory = [
    { date: '2025-04-03', amount: 2090, status: 'paid' },
    { date: '2025-03-03', amount: 2090, status: 'paid' },
    { date: '2025-02-03', amount: 2050, status: 'paid' },
    { date: '2025-01-03', amount: 2050, status: 'paid' },
  ]

  // Calculate days until next payment
  const nextPayment = new Date(userGrant.nextPaymentDate)
  const today = new Date()
  const daysUntil = Math.ceil((nextPayment.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-500" />
            Grant+ for SASSA
          </DialogTitle>
        </DialogHeader>

        {/* Grant Status Card */}
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Badge className="bg-white/20 text-white border-0">
                {userGrant.type.name}
              </Badge>
              <Badge className="bg-green-400 text-green-900 border-0">
                {userGrant.status}
              </Badge>
            </div>
            <p className="text-orange-100 text-sm mb-1">Next Payment</p>
            <p className="text-3xl font-bold mb-1">R {userGrant.nextPaymentAmount.toLocaleString()}</p>
            <p className="text-orange-100 text-sm">
              {nextPayment.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </CardContent>
        </Card>

        {/* Countdown */}
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                <span className="text-sm font-medium text-orange-800">Payment in</span>
              </div>
              <span className="text-2xl font-bold text-orange-600">{daysUntil} days</span>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {(['overview', 'history', 'actions'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-[#00897B] border-b-2 border-[#00897B]'
                  : 'text-[#757575]'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Payment Method */}
            <div>
              <p className="text-sm font-medium text-[#1A1A1A] mb-2">Payment Method</p>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#E0F2F1] flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-[#00897B]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A]">{userGrant.paymentMethod}</p>
                    <p className="text-xs text-[#757575]">****{userGrant.bankLast4}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#757575]" />
              </div>
            </div>

            {/* Pay+ Integration */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-800">Access Grant Early with Pay+</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Get up to 60% of your grant early (3% fee applies)
                    </p>
                    <Button size="sm" className="mt-2 bg-blue-500 hover:bg-blue-600">
                      Learn More
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Grant Types Info */}
            <div>
              <p className="text-sm font-medium text-[#1A1A1A] mb-2">All Grant Types</p>
              <div className="space-y-1">
                {GRANT_TYPES.map((grant) => (
                  <div
                    key={grant.id}
                    className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: grant.color }}
                      />
                      <span className="text-xs text-[#1A1A1A]">{grant.name}</span>
                    </div>
                    <span className="text-xs font-medium text-[#757575]">
                      R {grant.amount.toLocaleString()}/mo
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-[#1A1A1A] mb-2">Payment History</p>
            {paymentHistory.map((payment, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
              >
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">
                    {new Date(payment.date).toLocaleDateString('en-ZA', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-600 capitalize">{payment.status}</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-[#1A1A1A]">
                  R {payment.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 active:bg-gray-50">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#00897B]" />
                <span className="text-sm font-medium text-[#1A1A1A]">Check Status</span>
              </div>
              <ChevronRight className="h-4 w-4 text-[#757575]" />
            </button>
            <button className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 active:bg-gray-50">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium text-[#1A1A1A]">View History</span>
              </div>
              <ChevronRight className="h-4 w-4 text-[#757575]" />
            </button>
            <button className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 active:bg-gray-50">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium text-[#1A1A1A]">Update Details</span>
              </div>
              <ChevronRight className="h-4 w-4 text-[#757575]" />
            </button>
            <button className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 active:bg-gray-50">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-orange-500" />
                <span className="text-sm font-medium text-[#1A1A1A]">Contact SASSA</span>
              </div>
              <ChevronRight className="h-4 w-4 text-[#757575]" />
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
