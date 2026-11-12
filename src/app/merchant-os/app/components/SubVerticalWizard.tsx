'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Check, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Zap,
  Package,
  CreditCard,
  Users,
  Database,
  FileText,
  Shield,
  CheckCircle2,
  ArrowRight,
  Store,
  LucideIcon
} from 'lucide-react'

interface SubVertical {
  id: string
  name: string
  skuCount: number
  features: string[]
}

interface Vertical {
  id: string
  name: string
  icon: LucideIcon
  subCount: number
  description: string
  subVerticals: SubVertical[]
}

interface SubVerticalWizardProps {
  verticals: Vertical[]
  selectedVertical: Vertical | null
  selectedSubVertical: SubVertical | null
  onVerticalSelect: (vertical: Vertical) => void
  onSubVerticalSelect: (subVertical: SubVertical) => void
  onStartPOS: () => void
  vasTiles: string[]
}

// Auto-configuration items
const autoConfigItems = [
  { name: 'Chart of Accounts', icon: FileText, description: 'Vertical-specific GL structure' },
  { name: 'SKU Catalogue', icon: Package, description: 'Pre-loaded products' },
  { name: 'Compliance Overlays', icon: Shield, description: 'Industry regulations' },
  { name: 'VAT Treatment', icon: CreditCard, description: 'Tax rules per vertical' },
  { name: 'POS Screen Layout', icon: Store, description: 'Purpose-built interface' },
  { name: 'Digital Menu Template', icon: FileText, description: 'QR menu for customers' },
  { name: 'Geo-Discovery Tags', icon: Users, description: 'Customer discovery' },
  { name: 'Loyalty Categories', icon: Sparkles, description: 'Rewards structure' },
  { name: 'Supplier Catalogue', icon: Database, description: 'Verified suppliers' },
  { name: 'VAS Tiles', icon: Zap, description: 'Value-added services' },
]

export function SubVerticalWizard({
  verticals,
  selectedVertical,
  selectedSubVertical,
  onVerticalSelect,
  onSubVerticalSelect,
  onStartPOS,
  vasTiles
}: SubVerticalWizardProps) {
  const [step, setStep] = useState(1)

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100

  const goToStep2 = (vertical: Vertical) => {
    console.log('Vertical selected:', vertical.name)
    onVerticalSelect(vertical)
    setStep(2)
  }

  const goToStep3 = (subVertical: SubVertical) => {
    console.log('Sub-vertical selected:', subVertical.name)
    onSubVerticalSelect(subVertical)
    setStep(3)
  }

  const goBack = () => {
    if (step === 2) {
      setStep(1)
    } else if (step === 3) {
      setStep(2)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B] bg-[#E0F2F1] text-xs">
          <Sparkles className="h-3 w-3 mr-1" />
          Auto-Configuration Wizard
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-2">
          Set Up Your Business
        </h1>
        <p className="text-sm text-[#757575] max-w-xl mx-auto">
          Select your business type and we'll automatically configure your POS, inventory, 
          compliance rules, and more.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {['Select Vertical', 'Select Sub-Vertical', 'Review & Start'].map((label, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                step > index + 1 
                  ? 'bg-[#00897B] text-white' 
                  : step === index + 1 
                    ? 'bg-[#00897B] text-white' 
                    : 'bg-gray-200 text-gray-500'
              }`}>
                {step > index + 1 ? <Check className="h-3 w-3" /> : index + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${
                step >= index + 1 ? 'text-[#1A1A1A]' : 'text-gray-400'
              }`}>
                {label}
              </span>
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Step 1: Select Vertical */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1A1A1A]">
              What type of business do you run?
            </h2>
            <Badge variant="secondary" className="text-xs">
              12 Verticals
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {verticals.map((vertical) => (
              <button
                key={vertical.id}
                type="button"
                className="w-full text-left bg-white rounded-xl border border-gray-200 p-4 hover:border-[#00897B] hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00897B] focus:ring-offset-2"
                onClick={() => goToStep2(vertical)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center flex-shrink-0">
                    <vertical.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-[#1A1A1A] mb-0.5">
                      {vertical.name}
                    </h3>
                    <p className="text-[10px] text-[#00897B] font-medium mb-1">
                      {vertical.subCount} sub-verticals
                    </p>
                    <p className="text-[10px] text-[#757575] line-clamp-2">
                      {vertical.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-300" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Select Sub-Vertical */}
      {step === 2 && selectedVertical && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={goBack}
                className="text-xs"
              >
                <ChevronLeft className="h-3 w-3 mr-1" />
                Back
              </Button>
              <h2 className="text-lg font-semibold text-[#1A1A1A]">
                {selectedVertical.name}: Select Your Category
              </h2>
            </div>
            <Badge variant="secondary" className="text-xs">
              {selectedVertical.subCount} Options
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {selectedVertical.subVerticals.map((subVertical) => (
              <button
                key={subVertical.id}
                type="button"
                className="w-full text-left bg-white rounded-xl border border-gray-200 p-4 hover:border-[#00897B] hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00897B] focus:ring-offset-2"
                onClick={() => goToStep3(subVertical)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold text-[#1A1A1A]">
                    {subVertical.name}
                  </h3>
                  <Badge variant="outline" className="text-[10px] border-[#00897B]/30 text-[#00897B]">
                    {subVertical.skuCount} SKUs
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {subVertical.features.map((feature, idx) => (
                    <span 
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5F5F5] text-[#757575]"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Review Configuration */}
      {step === 3 && selectedVertical && selectedSubVertical && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={goBack}
                className="text-xs"
              >
                <ChevronLeft className="h-3 w-3 mr-1" />
                Back
              </Button>
              <h2 className="text-lg font-semibold text-[#1A1A1A]">
                Review Auto-Configuration
              </h2>
            </div>
          </div>

          {/* Selected Business Summary */}
          <div className="bg-gradient-to-br from-[#E0F2F1] to-[#E8F5E9] rounded-xl border border-[#00897B]/20 p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#00897B] text-white flex items-center justify-center flex-shrink-0">
                <selectedVertical.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-[#1A1A1A]">
                  {selectedSubVertical.name}
                </h3>
                <p className="text-xs text-[#757575] mb-2">
                  {selectedVertical.name}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-[10px] bg-white/60">
                    <Package className="h-3 w-3 mr-1" />
                    {selectedSubVertical.skuCount} Pre-loaded SKUs
                  </Badge>
                  {selectedSubVertical.features.map((feature, idx) => (
                    <Badge key={idx} variant="secondary" className="text-[10px] bg-white/60">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* What Gets Auto-Configured */}
          <div>
            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">
              What Groway Auto-Configures
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {autoConfigItems.map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-2 bg-white rounded-lg p-2.5 border border-gray-200"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium text-[#1A1A1A] truncate">{item.name}</p>
                    <p className="text-[9px] text-[#757575] truncate">{item.description}</p>
                  </div>
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#00897B] flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* VAS Tiles */}
          <div>
            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">
              Value-Added Services Enabled
            </h3>
            <div className="flex flex-wrap gap-2">
              {vasTiles.map((tile, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-xs border-[#00897B]/30 text-[#00897B] py-1"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  {tile}
                </Badge>
              ))}
            </div>
          </div>

          {/* Launch POS Button */}
          <div className="flex justify-center pt-4">
            <Button 
              size="lg"
              className="bg-[#00897B] hover:bg-[#00695C] text-white font-semibold px-8 py-6 text-base shadow-lg"
              onClick={() => {
                console.log('Launch POS clicked')
                onStartPOS()
              }}
            >
              <Store className="mr-2 h-5 w-5" />
              Launch POS
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
