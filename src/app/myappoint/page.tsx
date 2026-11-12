'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Scissors,
  Sparkles,
  Palette,
  Flower2,
  Stethoscope,
  Brush,
  Eye,
  ArrowRight,
  CheckCircle2,
  Users,
  Calendar,
  CreditCard,
  BarChart3,
  Clock,
  Star
} from 'lucide-react'

// Vertical definitions
const verticals = [
  {
    id: 'hair_salon',
    name: 'Hair Salon',
    icon: Scissors,
    skus: 145,
    color: '#EC4899',
    features: ['Stylist Roster', 'Service Combos', 'Colour Formula Notes', 'Patch Test Tracking'],
    description: 'Full-service hair salon with stylist booking, colour tracking, and combo services'
  },
  {
    id: 'barber_shop',
    name: 'Barber Shop',
    icon: Sparkles,
    skus: 78,
    color: '#6366F1',
    features: ['Queue Management', 'Memberships', 'Quick Service Mode', 'Walk-in Board'],
    description: 'High-volume barber shop with queue system and subscription memberships'
  },
  {
    id: 'nail_salon',
    name: 'Nail Salon',
    icon: Palette,
    skus: 134,
    color: '#F59E0B',
    features: ['Design Catalogue', 'Loyalty Programme', 'Group Bookings', 'Nail Tech Assignment'],
    description: 'Nail studio with visual design library and tiered loyalty rewards'
  },
  {
    id: 'spa_wellness',
    name: 'Spa & Wellness',
    icon: Flower2,
    skus: 189,
    color: '#10B981',
    features: ['Treatment Packages', 'Gift Vouchers', 'Room Management', 'Intake Forms'],
    description: 'Full-service spa with packages, vouchers, and therapist scheduling'
  },
  {
    id: 'aesthetic_clinic',
    name: 'Aesthetic Clinic',
    icon: Stethoscope,
    skus: 156,
    color: '#8B5CF6',
    features: ['Consultation Workflow', 'Treatment Plans', 'Consent Forms', 'Before/After Photos'],
    description: 'Medical aesthetic clinic with clinical workflows and consent management'
  },
  {
    id: 'tattoo_studio',
    name: 'Tattoo Studio',
    icon: Brush,
    skus: 89,
    color: '#EF4444',
    features: ['Custom Quotes', 'Deposit Handling', 'Multi-Session Projects', 'Aftercare Instructions'],
    description: 'Tattoo studio with quote workflow, deposits, and project tracking'
  },
  {
    id: 'lash_brow',
    name: 'Lash & Brow Studio',
    icon: Eye,
    skus: 67,
    color: '#F97316',
    features: ['Infill Detection', 'Style Notes', 'Stamp Card Loyalty', 'Before/After Gallery'],
    description: 'Lash and brow studio with infill intelligence and style tracking'
  }
]

const coreFeatures = [
  { icon: Calendar, title: 'Booking Engine', desc: 'Day/Week views, online widget, waitlist, no-show protection' },
  { icon: Users, title: 'Client CRM', desc: 'Profiles, visit history, notes, loyalty, consent tracking' },
  { icon: CreditCard, title: 'POS Checkout', desc: 'One-screen checkout, split payments, tips, deposits' },
  { icon: Clock, title: 'Staff Management', desc: 'Roster, commission, clock-in, performance dashboard' },
  { icon: BarChart3, title: 'Reporting', desc: 'Daily summary, staff performance, inventory, tax reports' },
  { icon: Star, title: 'Loyalty & Marketing', desc: 'Points, tiers, campaigns, automated notifications' }
]

export default function MyAppointLanding() {
  const [selectedVertical, setSelectedVertical] = useState<string | null>(null)
  const [showFeatures, setShowFeatures] = useState(false)
  const router = useRouter()

  const handleSelectVertical = (verticalId: string) => {
    setSelectedVertical(verticalId)
  }

  const handleContinue = () => {
    if (selectedVertical) {
      router.push(`/myappoint/app?vertical=${selectedVertical}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">MyAppoint</h1>
              <p className="text-xs text-gray-500">Health & Beauty POS Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setShowFeatures(!showFeatures)}>
              Features
            </Button>
            <Button variant="outline" onClick={() => router.push('/myappoint/app')}>
              Launch App
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Badge className="bg-pink-100 text-pink-700 mb-4">858 SKUs Across 7 Verticals</Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Your Business, <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">Your Way</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Category-first POS platform built for Health & Beauty. Select your vertical and get a tailored experience instantly.
          </p>
        </div>

        {/* Vertical Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {verticals.map((vertical) => {
            const Icon = vertical.icon
            const isSelected = selectedVertical === vertical.id
            return (
              <Card
                key={vertical.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  isSelected
                    ? 'ring-2 ring-pink-500 shadow-lg'
                    : 'hover:border-pink-200'
                }`}
                onClick={() => handleSelectVertical(vertical.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${vertical.color}15` }}
                    >
                      <Icon className="h-6 w-6" style={{ color: vertical.color }} />
                    </div>
                    {isSelected && <CheckCircle2 className="h-5 w-5 text-pink-500" />}
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold text-gray-900 mb-1">{vertical.name}</h3>
                  <p className="text-xs text-gray-500 mb-3">{vertical.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {vertical.features.slice(0, 2).map((feature, idx) => (
                      <Badge key={idx} variant="secondary" className="text-[10px]">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-gray-400">{vertical.skus} SKUs</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Continue Button */}
        {selectedVertical && (
          <div className="text-center mb-16">
            <Button
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8"
              onClick={handleContinue}
            >
              Continue to {verticals.find(v => v.id === selectedVertical)?.name}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </section>

      {/* Core Features Section */}
      <section className="bg-white py-16 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Core Features for All Verticals</h3>
            <p className="text-gray-600">Shared foundation with vertical-specific enhancements</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreFeatures.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <Card key={idx} className="border-0 shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-pink-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                        <p className="text-sm text-gray-600">{feature.desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-pink-500 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">7</div>
              <div className="text-pink-100">Business Verticals</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">858</div>
              <div className="text-pink-100">Service SKUs</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">4</div>
              <div className="text-pink-100">User Roles</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">72h</div>
              <div className="text-pink-100">Offline Buffer</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-semibold text-white">MyAppoint</span>
          </div>
          <p className="text-sm">Health & Beauty POS Platform — Powered by Groway</p>
          <p className="text-xs mt-2">South Africa | POPIA Compliant | PCI-DSS Ready</p>
        </div>
      </footer>
    </div>
  )
}
