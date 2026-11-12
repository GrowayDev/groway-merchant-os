'use client'

import { 
  Truck, 
  ShieldCheck, 
  CreditCard, 
  CheckCircle2, 
  ArrowRight,
  ArrowLeft,
  Building2,
  Users,
  Clock,
  Zap,
  BarChart3,
  Package,
  FileText,
  RefreshCw,
  Store,
  Wallet,
  Link2,
  TrendingUp,
  BadgeCheck,
  Globe,
  Menu,
  X,
  Sparkles,
  BoxIcon,
  Landmark
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

// Core Features
const coreFeatures = [
  {
    icon: Users,
    title: 'Supplier Network',
    description: 'Access 500+ B-BBEE verified South African suppliers across all verticals — from grocery to pharmacy.',
    highlight: 'B-BBEE Verified'
  },
  {
    icon: CreditCard,
    title: 'GroCredit',
    description: 'Get instant credit for stock purchases. NCR compliant with competitive rates. No more cash flow gaps.',
    highlight: 'NCR Compliant'
  },
  {
    icon: Zap,
    title: 'GroSettle',
    description: 'One-click payment settlement to suppliers. Instant, 30-day, or 60-day options with early payment discounts.',
    highlight: 'Instant Settlement'
  },
  {
    icon: FileText,
    title: '3-Way Match',
    description: 'Automatic reconciliation of Purchase Orders, Invoices, and Delivery Notes. Variance alerts built-in.',
    highlight: 'Auto Reconciliation'
  },
  {
    icon: Package,
    title: 'PO Management',
    description: 'Create, track, and manage purchase orders from request to delivery. Full audit trail included.',
    highlight: 'Full Visibility'
  },
  {
    icon: BoxIcon,
    title: 'Bulk Ordering',
    description: 'Order in bulk with negotiated prices. Join buying groups for even better deals.',
    highlight: 'Negotiated Prices'
  }
]

// How It Works Steps
const howItWorksSteps = [
  {
    step: 1,
    title: 'Browse Suppliers',
    description: 'Search and filter suppliers by category, B-BBEE level, rating, and delivery zones.',
    icon: Globe
  },
  {
    step: 2,
    title: 'Create Purchase Order',
    description: 'Generate POs manually or trigger automatic reorders based on inventory levels.',
    icon: FileText
  },
  {
    step: 3,
    title: 'Get Instant Credit',
    description: 'Apply for GroCredit and get instant approval for stock purchases — no cash needed.',
    icon: CreditCard
  },
  {
    step: 4,
    title: 'Receive Delivery',
    description: 'Track deliveries in real-time. Confirm receipt with barcode scanning via mobile app.',
    icon: Truck
  },
  {
    step: 5,
    title: 'Settle with One Click',
    description: 'Pay suppliers instantly via GoPay. Choose settlement timing that suits your cash flow.',
    icon: CheckCircle2
  }
]

// Value Propositions
const valueProps = [
  {
    icon: TrendingUp,
    title: 'No More Cash Flow Gaps',
    description: 'GroCredit bridges the gap between stock purchase and sales revenue.'
  },
  {
    icon: BadgeCheck,
    title: 'B-BBEE Compliant Procurement',
    description: 'All suppliers verified. Automatic compliance tracking and reporting.'
  },
  {
    icon: RefreshCw,
    title: 'Integrated with Merchant OS',
    description: 'Inventory syncs automatically. No double-entry or manual updates.'
  },
  {
    icon: Clock,
    title: 'Automatic Reorder Triggers',
    description: 'Never run out of stock. System creates RFQs when inventory hits threshold.'
  }
]

// Stats
const stats = [
  { value: '500+', label: 'Verified Suppliers' },
  { value: 'R17.4M', label: 'Year 1 GMV Target' },
  { value: '5K+', label: 'Active Merchants' },
  { value: '4h', label: 'Instant Settlement' }
]

// Compliance
const complianceBadges = [
  { name: 'NCR', desc: 'Credit compliance' },
  { name: 'POPIA', desc: 'Data protection' },
  { name: 'B-BBEE', desc: 'Verified suppliers' },
  { name: 'PCI-DSS', desc: 'Payment security' }
]

export default function GroSupplyPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#00897B] flex items-center justify-center">
                <Truck className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-[#1A1A1A]">GroSupply</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-[#757575] hover:text-[#00897B] transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Home
              </Link>
              <a href="#features" className="text-sm font-medium text-[#757575] hover:text-[#00897B] transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-sm font-medium text-[#757575] hover:text-[#00897B] transition-colors">
                How It Works
              </a>
              <a href="#integrations" className="text-sm font-medium text-[#757575] hover:text-[#00897B] transition-colors">
                Integrations
              </a>
            </div>
            
            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/grosupply/supplier/login">
                <Button variant="ghost" className="text-[#757575] hover:text-[#00897B] font-medium">
                  Supplier Login
                </Button>
              </Link>
              <Link href="/grosupply/supplier/onboarding">
                <Button variant="outline" className="border-[#00897B] text-[#00897B] hover:bg-[#E0F2F1] font-medium">
                  Become a Supplier
                </Button>
              </Link>
              <Link href="/grosupply/marketplace">
                <Button className="bg-[#00897B] hover:bg-[#00695C] text-white font-medium px-5">
                  Browse Marketplace
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200/50 py-4 px-4 space-y-4">
            <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-[#00897B]">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Home
            </Link>
            <a href="#features" className="block text-sm font-medium text-[#757575] hover:text-[#00897B]">Features</a>
            <a href="#how-it-works" className="block text-sm font-medium text-[#757575] hover:text-[#00897B]">How It Works</a>
            <a href="#integrations" className="block text-sm font-medium text-[#757575] hover:text-[#00897B]">Integrations</a>
            <div className="pt-4 border-t border-gray-200/50 flex flex-col gap-2">
              <Link href="/grosupply/supplier/login" className="w-full">
                <Button variant="ghost" className="w-full text-[#00897B]">Supplier Login</Button>
              </Link>
              <Link href="/grosupply/supplier/onboarding" className="w-full">
                <Button variant="outline" className="w-full border-[#00897B] text-[#00897B]">Become a Supplier</Button>
              </Link>
              <Link href="/grosupply/marketplace" className="w-full">
                <Button className="w-full bg-[#00897B] hover:bg-[#00695C] text-white">Browse Marketplace</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#00695C] via-[#00897B] to-[#4CAF50] pt-12 sm:pt-16 lg:pt-24 pb-16 sm:pb-24">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent" />
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-green-400/20 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <Sparkles className="h-3.5 w-3.5 text-green-300" />
              <span className="text-xs sm:text-sm font-medium text-white">B2B Procurement Platform</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-5 tracking-tight leading-tight">
              B2B Procurement,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-green-200 to-white">
                Simplified.
              </span>
            </h1>
            
            {/* Sub-headline */}
            <p className="text-base sm:text-lg lg:text-xl text-teal-100/90 max-w-3xl mx-auto mb-6">
              Source stock from verified suppliers, get instant credit for purchases, 
              and settle payments with one click. Built for South African businesses.
            </p>
            
            {/* Platform Highlights */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8">
              <Badge className="bg-white/10 text-white border-white/20 px-3 py-1 text-xs sm:text-sm">
                <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5" />
                B-BBEE Verified
              </Badge>
              <Badge className="bg-white/10 text-white border-white/20 px-3 py-1 text-xs sm:text-sm">
                <Landmark className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5" />
                NCR Compliant
              </Badge>
              <Badge className="bg-white/10 text-white border-white/20 px-3 py-1 text-xs sm:text-sm">
                <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5" />
                Instant Credit
              </Badge>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/grosupply/marketplace">
                <Button 
                  size="lg" 
                  className="bg-white text-[#00897B] hover:bg-teal-50 font-semibold px-6 py-5 text-base shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Browse Marketplace
                </Button>
              </Link>
              <Link href="/grosupply/supplier/onboarding">
                <Button 
                  size="lg" 
                  className="bg-[#E0F2F1] text-[#00695C] hover:bg-white font-semibold px-6 py-5 text-base shadow-lg transition-all duration-300"
                >
                  <Truck className="mr-2 h-4 w-4" />
                  Become a Supplier
                </Button>
              </Link>
            </div>
            
            {/* Trust Badges */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {complianceBadges.map((badge, index) => (
                <div key={index} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                  <CheckCircle2 className="h-3 w-3 text-green-300" />
                  <span className="text-xs text-white/90">{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#FAFAFA"/>
          </svg>
        </div>
      </header>

      {/* Stats Section */}
      <section className="py-10 sm:py-14 bg-[#FAFAFA] border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-[#00897B] mb-0.5">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-[#757575]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B] bg-[#E0F2F1] text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Core Features
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1A1A1A] mb-3">
              Everything You Need for <span className="text-[#00897B]">B2B Procurement</span>
            </h2>
            <p className="text-sm sm:text-base text-[#757575] max-w-2xl mx-auto">
              From sourcing to settlement, GroSupply handles the entire procurement lifecycle 
              with built-in compliance and financial controls.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {coreFeatures.map((feature, index) => (
              <Card 
                key={index}
                className="group relative overflow-hidden bg-[#FAFAFA] border border-gray-200 hover:border-[#00897B]/30 hover:shadow-lg hover:bg-white transition-all duration-300"
              >
                <CardContent className="p-5 sm:p-6">
                  {/* Icon - 32-40px minimal style */}
                  <div className="w-9 h-9 mb-4 bg-[#E0F2F1] text-[#00897B] rounded-lg flex items-center justify-center group-hover:bg-[#00897B] group-hover:text-white transition-colors">
                    <feature.icon className="h-[18px] w-[18px]" />
                  </div>
                  
                  {/* Badge */}
                  <Badge variant="secondary" className="text-[10px] bg-[#00897B]/10 text-[#00897B] mb-2">
                    {feature.highlight}
                  </Badge>
                  
                  <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A] mb-2">
                    {feature.title}
                  </h3>
                  
                  <p className="text-xs sm:text-sm text-[#757575] leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-12 sm:py-20 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B] bg-[#E0F2F1] text-xs">
              <Clock className="h-3 w-3 mr-1" />
              How It Works
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1A1A1A] mb-3">
              From Order to Delivery in <span className="text-[#00897B]">5 Simple Steps</span>
            </h2>
            <p className="text-sm sm:text-base text-[#757575] max-w-2xl mx-auto">
              Streamline your procurement process with our end-to-end workflow.
            </p>
          </div>

          {/* Steps */}
          <div className="relative">
            {/* Connection Line - Desktop */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-[#E0F2F1] -translate-y-1/2" />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
              {howItWorksSteps.map((step, index) => (
                <div key={index} className="relative">
                  {/* Step Card */}
                  <div className="relative bg-white rounded-xl border border-gray-200 p-5 hover:border-[#00897B]/30 hover:shadow-md transition-all h-full">
                    {/* Step Number */}
                    <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-[#00897B] text-white flex items-center justify-center text-sm font-bold shadow-lg">
                      {step.step}
                    </div>
                    
                    {/* Icon */}
                    <div className="w-9 h-9 mb-3 bg-[#E0F2F1] text-[#00897B] rounded-lg flex items-center justify-center ml-auto">
                      <step.icon className="h-[18px] w-[18px]" />
                    </div>
                    
                    <h3 className="text-sm sm:text-base font-bold text-[#1A1A1A] mb-2">
                      {step.title}
                    </h3>
                    
                    <p className="text-xs text-[#757575] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions Section */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B] bg-[#E0F2F1] text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              Why GroSupply
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1A1A1A] mb-3">
              Built for <span className="text-[#00897B]">South African Businesses</span>
            </h2>
          </div>

          {/* Value Props Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {valueProps.map((prop, index) => (
              <div 
                key={index}
                className="group bg-gradient-to-br from-[#E0F2F1] to-[#E8F5E9] rounded-xl p-5 sm:p-6 hover:shadow-md transition-all"
              >
                {/* Icon */}
                <div className="w-9 h-9 mb-4 bg-[#00897B] text-white rounded-lg flex items-center justify-center">
                  <prop.icon className="h-[18px] w-[18px]" />
                </div>
                
                <h3 className="text-sm sm:text-base font-bold text-[#1A1A1A] mb-2">
                  {prop.title}
                </h3>
                
                <p className="text-xs sm:text-sm text-[#757575] leading-relaxed">
                  {prop.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section id="integrations" className="py-12 sm:py-20 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B] bg-[#E0F2F1] text-xs">
              <Link2 className="h-3 w-3 mr-1" />
              Integrations
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1A1A1A] mb-3">
              Seamlessly Connected to <span className="text-[#00897B]">Groway Ecosystem</span>
            </h2>
            <p className="text-sm sm:text-base text-[#757575] max-w-2xl mx-auto">
              GroSupply integrates natively with other Groway applications for a unified business experience.
            </p>
          </div>

          {/* Integration Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Merchant OS Integration */}
            <div className="relative bg-white rounded-xl border border-gray-200 p-6 hover:border-[#00897B]/30 hover:shadow-lg transition-all overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#E0F2F1] rounded-bl-full" />
              
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#E0F2F1] text-[#00897B] rounded-lg flex items-center justify-center">
                    <Store className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#1A1A1A]">Merchant OS</h3>
                    <p className="text-xs text-[#757575]">Inventory & POS Integration</p>
                  </div>
                </div>
                
                <ul className="space-y-2 mb-4">
                  {[
                    'Real-time inventory sync',
                    'Automatic reorder triggers',
                    'Stock updates on GRN completion',
                    'Unified dashboard view'
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-[#757575]">
                      <CheckCircle2 className="h-4 w-4 text-[#00897B] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                
                <div className="flex items-center gap-2 text-xs text-[#00897B] font-medium">
                  <Link2 className="h-3.5 w-3.5" />
                  Bi-directional sync
                </div>
              </div>
            </div>

            {/* GoPay Integration */}
            <div className="relative bg-white rounded-xl border border-gray-200 p-6 hover:border-[#00897B]/30 hover:shadow-lg transition-all overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#E0F2F1] rounded-bl-full" />
              
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#E0F2F1] text-[#00897B] rounded-lg flex items-center justify-center">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#1A1A1A]">GoPay</h3>
                    <p className="text-xs text-[#757575]">Payment Rail Integration</p>
                  </div>
                </div>
                
                <ul className="space-y-2 mb-4">
                  {[
                    'Instant EFT settlements',
                    'PayShap integration',
                    'Early payment discounts',
                    'Secure PCI-DSS payments'
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-[#757575]">
                      <CheckCircle2 className="h-4 w-4 text-[#00897B] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                
                <div className="flex items-center gap-2 text-xs text-[#00897B] font-medium">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  PCI-DSS Level 1
                </div>
              </div>
            </div>
          </div>

          {/* Architecture Diagram Simplified */}
          <div className="mt-12 bg-gradient-to-br from-[#1A1A1A] to-[#2D2D2D] rounded-xl p-6 sm:p-8">
            <div className="text-center mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Two-Sided Marketplace Architecture</h3>
              <p className="text-xs sm:text-sm text-gray-400">A neutral GroSupply Ops layer manages the marketplace, disputes, compliance, and financial controls.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
              {/* Side A - Merchants */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-4 w-4 text-[#4CAF50]" />
                  <span className="text-sm font-bold text-white">Side A: Merchants</span>
                </div>
                <ul className="space-y-1.5">
                  {['Browse suppliers', 'Create POs', 'Get GroCredit', 'Receive deliveries', 'Pay via GroSettle'].map((item, idx) => (
                    <li key={idx} className="text-xs text-gray-400 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-[#4CAF50]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Middle - GroSupply Ops */}
              <div className="bg-[#00897B]/20 rounded-lg p-4 border border-[#00897B]/30">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-4 w-4 text-[#00897B]" />
                  <span className="text-sm font-bold text-white">GroSupply Ops</span>
                </div>
                <ul className="space-y-1.5">
                  {['Marketplace management', 'Dispute resolution', 'Compliance tracking', 'Financial controls', '3-way matching'].map((item, idx) => (
                    <li key={idx} className="text-xs text-teal-200 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-[#00897B]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Side B - Suppliers */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Truck className="h-4 w-4 text-[#4CAF50]" />
                  <span className="text-sm font-bold text-white">Side B: Suppliers</span>
                </div>
                <ul className="space-y-1.5">
                  {['List products', 'Quote on RFQs', 'Dispatch orders', 'Submit invoices', 'Get paid'].map((item, idx) => (
                    <li key={idx} className="text-xs text-gray-400 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-[#4CAF50]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 bg-[#FAFAFA]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#00695C] via-[#00897B] to-[#4CAF50] p-6 sm:p-10 text-center">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Ready to Transform Your Procurement?
              </h2>
              <p className="text-sm sm:text-base text-teal-100 mb-6 max-w-2xl mx-auto">
                Join thousands of South African businesses already using GroSupply 
                to streamline procurement and improve cash flow.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/grosupply/marketplace">
                  <Button 
                    size="lg" 
                    className="bg-white text-[#00897B] hover:bg-teal-50 font-medium px-6 py-5 shadow-lg"
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    Browse Marketplace
                  </Button>
                </Link>
                <Link href="/grosupply/supplier/onboarding">
                  <Button 
                    size="lg" 
                    className="bg-[#E0F2F1] text-[#00695C] hover:bg-white font-medium px-6 py-5 shadow-lg"
                  >
                    <Truck className="mr-2 h-4 w-4" />
                    Become a Supplier
                  </Button>
                </Link>
              </div>
              
              {/* Trust indicators */}
              <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-teal-200">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Free to join
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  No setup fees
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Cancel anytime
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 sm:py-10 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6">
            {/* Main Footer Content */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Logo & Copyright */}
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#00897B] flex items-center justify-center">
                    <Truck className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm font-bold text-[#1A1A1A]">GroSupply</span>
                </Link>
                <span className="text-xs text-[#757575]">
                  © 2024 Groway. All rights reserved.
                </span>
              </div>
              
              {/* Links */}
              <div className="flex items-center gap-5 text-xs text-[#757575]">
                <a href="#" className="hover:text-[#00897B] transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="hover:text-[#00897B] transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="hover:text-[#00897B] transition-colors">
                  Contact
                </a>
              </div>
            </div>
            
            {/* Compliance Badges */}
            <div className="flex flex-wrap justify-center gap-2">
              {complianceBadges.map((badge, index) => (
                <Badge key={index} variant="outline" className="text-[10px] border-[#00897B]/30 text-[#00897B] py-0.5">
                  {badge.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
