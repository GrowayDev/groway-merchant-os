'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CreditCard,
  PiggyBank,
  Shield,
  Calendar,
  ShoppingBag,
  Zap,
  DollarSign,
  Smartphone,
  Droplet,
  Tv,
  Building,
  Car,
  Plane,
  Bus,
  Train,
  Ticket,
  Gift,
  Globe,
  GraduationCap,
  Settings,
  Bell,
  HelpCircle,
  Lock,
  TrendingUp
} from 'lucide-react'

interface ServicesTabProps {
  onOpenPayPlus: () => void
  onOpenLaybye: () => void
  onOpenBNPL: () => void
  onOpenMTNMoMo: () => void
  onOpenCredit: () => void
  onOpenInsurance: () => void
  onOpenBills: () => void
  onOpenAirtime: () => void
  onOpenVouchers: () => void
  onOpenFlights: () => void
  onOpenBus: () => void
  onOpenTrain: () => void
  onOpenEvents: () => void
  onOpenRemittance: () => void
  onOpenPayShap: () => void
  onOpenSavings: () => void
  onOpenGrantPlus: () => void
}

export function ServicesTab({
  onOpenPayPlus,
  onOpenLaybye,
  onOpenBNPL,
  onOpenMTNMoMo,
  onOpenCredit,
  onOpenInsurance,
  onOpenBills,
  onOpenAirtime,
  onOpenVouchers,
  onOpenFlights,
  onOpenBus,
  onOpenTrain,
  onOpenEvents,
  onOpenRemittance,
  onOpenPayShap,
  onOpenSavings,
  onOpenGrantPlus,
}: ServicesTabProps) {
  const [selectedService, setSelectedService] = useState<string | null>(null)

  const financialServices = [
    { id: 'credit', name: 'Credit', icon: CreditCard, color: '#00897B', onClick: onOpenCredit },
    { id: 'savings', name: 'Savings', icon: PiggyBank, color: '#4CAF50', onClick: onOpenSavings },
    { id: 'insurance', name: 'Insurance', icon: Shield, color: '#2196F3', onClick: onOpenInsurance },
    { id: 'bnpl', name: 'BNPL', icon: Calendar, color: '#9C27B0', onClick: onOpenBNPL },
    { id: 'laybye', name: 'Laybye', icon: ShoppingBag, color: '#FF5722', onClick: onOpenLaybye },
    { id: 'payplus', name: 'Pay+', icon: Zap, color: '#FFC107', onClick: onOpenPayPlus },
    { id: 'grantplus', name: 'Grant+', icon: Users, color: '#FF9800', onClick: onOpenGrantPlus },
  ]

  const billsUtilities = [
    { id: 'electricity', name: 'Electricity', icon: Zap, color: '#FFC107', onClick: onOpenBills },
    { id: 'water', name: 'Water', icon: Droplet, color: '#03A9F4', onClick: onOpenBills },
    { id: 'dstv', name: 'DStv', icon: Tv, color: '#00897B', onClick: onOpenBills },
    { id: 'municipal', name: 'Municipal', icon: Building, color: '#607D8B', onClick: onOpenBills },
    { id: 'traffic', name: 'Traffic', icon: Car, color: '#F44336', onClick: onOpenBills },
    { id: 'allbills', name: 'All Bills', icon: DollarSign, color: '#00897B', onClick: onOpenBills },
  ]

  const airtimeData = [
    { id: 'vodacom', name: 'Vodacom', icon: Smartphone, color: '#E60000', onClick: onOpenAirtime },
    { id: 'mtn', name: 'MTN', icon: Smartphone, color: '#FFCC00', onClick: onOpenMTNMoMo },
    { id: 'cellc', name: 'Cell C', icon: Smartphone, color: '#0066B3', onClick: onOpenAirtime },
    { id: 'telkom', name: 'Telkom', icon: Smartphone, color: '#0066FF', onClick: onOpenAirtime },
  ]

  const travelEvents = [
    { id: 'flights', name: 'Flights', icon: Plane, color: '#00897B', onClick: onOpenFlights },
    { id: 'buses', name: 'Buses', icon: Bus, color: '#FF5722', onClick: onOpenBus },
    { id: 'trains', name: 'Trains', icon: Train, color: '#2196F3', onClick: onOpenTrain },
    { id: 'events', name: 'Events', icon: Ticket, color: '#9C27B0', onClick: onOpenEvents },
  ]

  const moreServices = [
    { id: 'vouchers', name: 'Vouchers', icon: Gift, color: '#E91E63', onClick: onOpenVouchers },
    { id: 'remittance', name: 'Send Abroad', icon: Globe, color: '#00BCD4', onClick: onOpenRemittance },
    { id: 'school', name: 'School Fees', icon: GraduationCap, color: '#795548', onClick: () => {} },
    { id: 'payshap', name: 'PayShap', icon: DollarSign, color: '#4CAF50', onClick: onOpenPayShap },
  ]

  const settingsSupport = [
    { id: 'settings', name: 'Settings', icon: Settings, color: '#607D8B', onClick: () => {} },
    { id: 'notifications', name: 'Alerts', icon: Bell, color: '#FF9800', onClick: () => {} },
    { id: 'security', name: 'Security', icon: Lock, color: '#F44336', onClick: () => {} },
    { id: 'help', name: 'Help', icon: HelpCircle, color: '#2196F3', onClick: () => {} },
  ]

  const renderServiceGrid = (services: typeof financialServices, title: string) => (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-[#1A1A1A] mb-2">{title}</h3>
      <div className="grid grid-cols-4 gap-2">
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => {
              setSelectedService(service.id)
              service.onClick()
            }}
            className="flex flex-col items-center p-2 rounded-xl bg-white border border-gray-100 active:scale-95 transition-transform hover:border-[#00897B]"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-1"
              style={{ backgroundColor: `${service.color}20` }}
            >
              <service.icon className="h-5 w-5" style={{ color: service.color }} />
            </div>
            <span className="text-[10px] text-[#1A1A1A] text-center">{service.name}</span>
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="px-4 py-4 pb-20">
      {/* Financial Health Card */}
      <Card className="bg-gradient-to-r from-[#00897B] to-[#4CAF50] mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-white" />
              <span className="text-white font-bold">Financial Health</span>
            </div>
            <Badge className="bg-white/20 text-white border-0">Good</Badge>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-white/70 text-xs">Credit Score</p>
              <p className="text-white font-bold">682</p>
            </div>
            <div className="text-center">
              <p className="text-white/70 text-xs">Savings Rate</p>
              <p className="text-white font-bold">15%</p>
            </div>
            <div className="text-center">
              <p className="text-white/70 text-xs">Debt Ratio</p>
              <p className="text-white font-bold">23%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Categories */}
      {renderServiceGrid(financialServices, 'Financial Services')}
      {renderServiceGrid(billsUtilities, 'Bills & Utilities')}
      {renderServiceGrid(airtimeData, 'Airtime & Data')}
      {renderServiceGrid(travelEvents, 'Travel & Events')}
      {renderServiceGrid(moreServices, 'More Services')}
      {renderServiceGrid(settingsSupport, 'Settings & Support')}

      {/* Recent Bills */}
      <Card className="bg-white border border-gray-100 mt-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#1A1A1A]">Recent Bills</h3>
            <Badge variant="outline" className="text-xs">2 Due</Badge>
          </div>
          <div className="space-y-2">
            <button
              onClick={onOpenBills}
              className="w-full flex items-center justify-between p-2 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-red-500" />
                <div className="text-left">
                  <p className="text-xs font-medium text-[#1A1A1A]">City Power</p>
                  <p className="text-[10px] text-red-500">Due tomorrow</p>
                </div>
              </div>
              <span className="text-sm font-bold text-[#1A1A1A]">R 450</span>
            </button>
            <button
              onClick={onOpenBills}
              className="w-full flex items-center justify-between p-2 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Tv className="h-4 w-4 text-orange-500" />
                <div className="text-left">
                  <p className="text-xs font-medium text-[#1A1A1A]">DStv Premium</p>
                  <p className="text-[10px] text-orange-500">Due in 5 days</p>
                </div>
              </div>
              <span className="text-sm font-bold text-[#1A1A1A]">R 879</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
