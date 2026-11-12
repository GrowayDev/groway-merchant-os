'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Store, 
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Zap,
  TrendingUp,
  BarChart3,
  Users,
  Package,
  Calculator,
  Megaphone,
  Utensils,
  ShoppingBag,
  Scissors,
  Pill,
  Hotel,
  Wrench,
  Wine,
  Shirt,
  Dumbbell,
  Baby,
  Building2,
  CheckCircle2,
  Menu,
  X,
  QrCode,
  MapPin,
  Globe,
  Truck,
  CreditCard,
  Sparkles,
  Database,
  PieChart,
  FileText,
  MessageSquare,
  Ticket,
  Gift,
  Receipt,
  Wallet,
  Landmark,
  Clock,
  Target,
  UserCheck,
  Banknote,
  RefreshCw,
  Crown,
  Star,
  Download,
  Building,
  User,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Subscription Plans with pricing
const subscriptionPlans = [
  {
    id: 'starter',
    code: 'starter',
    name: 'Starter',
    price: 299,
    description: 'Perfect for small businesses getting started',
    color: '#6B7280',
    icon: Store,
    features: [
      'Point of Sale (POS)',
      'Inventory Management',
      'Basic Reports',
      'Customer Management',
      'Mobile App Access',
      'Up to 2 Users',
      '1 Location',
      'Email Support'
    ],
    limits: { users: 2, branches: 1, products: 500 },
    trialDays: 14
  },
  {
    id: 'pro',
    code: 'pro',
    name: 'Pro',
    price: 499,
    description: 'For growing businesses with advanced needs',
    color: '#00897B',
    icon: Zap,
    isPopular: true,
    features: [
      'Everything in Starter',
      'Accounting & Finance',
      'Multi-Location Support',
      'Staff Management',
      'Integrations',
      'Loyalty Program',
      'Online Store',
      'Up to 10 Users',
      '3 Locations',
      'Priority Support'
    ],
    limits: { users: 10, branches: 3, products: 5000 },
    trialDays: 14
  },
  {
    id: 'enterprise',
    code: 'enterprise',
    name: 'Enterprise',
    price: 999,
    description: 'For large operations with unlimited features',
    color: '#7C3AED',
    icon: Crown,
    features: [
      'Everything in Pro',
      'API Access',
      'White Label Options',
      'Dedicated Support',
      'Custom Reports',
      'Audit Logs',
      'GroSupply Pro',
      'GroCredit Access',
      'Up to 50 Users',
      '10 Locations',
      'SSO Authentication'
    ],
    limits: { users: 50, branches: 10, products: 50000 },
    trialDays: 30
  }
]

// Business Verticals
const businessVerticals = [
  { name: 'Food & Beverage', icon: Utensils, subCount: 8 },
  { name: 'Liquor & Nightlife', icon: Wine, subCount: 6 },
  { name: 'Grocery & FMCG', icon: ShoppingBag, subCount: 7 },
  { name: 'Health & Beauty', icon: Scissors, subCount: 7 },
  { name: 'Fashion & Apparel', icon: Shirt, subCount: 6 },
  { name: 'Health & Pharmacy', icon: Pill, subCount: 6 },
  { name: 'Hospitality', icon: Hotel, subCount: 7 },
  { name: 'Hardware & Building', icon: Wrench, subCount: 6 },
  { name: 'Electronics & Tech', icon: Smartphone, subCount: 4 },
  { name: 'Sport & Leisure', icon: Dumbbell, subCount: 6 },
  { name: 'Childcare & Education', icon: Baby, subCount: 5 },
  { name: 'Professional Services', icon: Building2, subCount: 6 },
]

// Core Features
const coreFeatures = [
  { id: 'smart-pos', name: 'Smart POS', tagline: 'Vertical-Specific POS Layouts', description: 'Every business type gets a purpose-built POS screen layout.', icon: Store, color: '#00897B' },
  { id: 'inventory', name: 'Inventory Management', tagline: 'Vertical-Aware Stock Control', description: 'Pre-loaded SKU catalogues with 3,930+ items.', icon: Package, color: '#00897B' },
  { id: 'accounting', name: 'ERP & Accounting', tagline: 'Comprehensive Financial Management', description: 'Full double-entry ledger with vertical-specific chart of accounts.', icon: Calculator, color: '#00897B' },
  { id: 'crm', name: 'CRM & Loyalty', tagline: 'Customer Engagement Engine', description: 'RFM customer analytics. Loyalty programme with 4 tiers.', icon: Users, color: '#00897B' },
  { id: 'analytics', name: 'Analytics Dashboard', tagline: 'AI-Powered Business Insights', description: 'Real-time revenue dashboards. Peak hours analysis.', icon: BarChart3, color: '#00897B' },
  { id: 'hrm-payroll', name: 'HRM & Payroll', tagline: 'Complete Workforce Management', description: 'PAYE/UIF/SDL calculations. Payslip generation.', icon: UserCheck, color: '#00897B' },
]

// EFT Payment Details
const eftDetails = {
  bankName: 'FNB Bank',
  accountHolder: 'Groway (Pty) Ltd',
  accountNumber: '63100111169',
  accountType: 'Business Cheque Account',
  branchCode: '250655',
  referencePrefix: 'GRO'
}

// Generate unique EFT reference
function generateEFTReference(businessName: string): string {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '')
  const cleanName = businessName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 10)
  return `GRO-${cleanName}-${date}`
}

export default function MerchantOSLanding() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(subscriptionPlans[1]) // Default to Pro

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/" className="flex items-center gap-2">
              <img src="/groway-logo.png" alt="Groway" className="h-8 sm:h-10 w-auto" />
              <Badge variant="outline" className="hidden sm:inline-flex text-[10px] border-[#00897B]/30 text-[#00897B]">
                Merchant OS
              </Badge>
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              <a href="#pricing" className="text-sm font-medium text-[#757575] hover:text-[#00897B]">Pricing</a>
              <a href="#features" className="text-sm font-medium text-[#757575] hover:text-[#00897B]">Features</a>
              <a href="#verticals" className="text-sm font-medium text-[#757575] hover:text-[#00897B]">Verticals</a>
              <a href="#payment" className="text-sm font-medium text-[#757575] hover:text-[#00897B]">Payment</a>
            </div>
            
            <div className="hidden md:flex items-center gap-3">
              <Link href="/merchant-os/login">
                <Button variant="ghost" className="text-[#1A1A1A] font-medium">Sign In</Button>
              </Link>
              <Link href="/merchant-os/signup">
                <Button className="bg-[#00897B] hover:bg-[#00695C] text-white font-medium px-5">
                  Start Free Trial
                </Button>
              </Link>
            </div>

            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200/50 py-4 px-4 space-y-4">
            <a href="#pricing" className="block text-sm font-medium text-[#757575]">Pricing</a>
            <a href="#features" className="block text-sm font-medium text-[#757575]">Features</a>
            <a href="#verticals" className="block text-sm font-medium text-[#757575]">Verticals</a>
            <a href="#payment" className="block text-sm font-medium text-[#757575]">Payment</a>
            <div className="pt-4 border-t border-gray-200/50 flex gap-3">
              <Link href="/merchant-os/login" className="flex-1">
                <Button variant="outline" className="w-full">Sign In</Button>
              </Link>
              <Link href="/merchant-os/signup" className="flex-1">
                <Button className="w-full bg-[#00897B] hover:bg-[#00695C] text-white">Sign Up</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#00695C] via-[#00897B] to-[#4CAF50] pt-10 sm:pt-16 lg:pt-20 pb-16 sm:pb-24">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <Store className="h-3.5 w-3.5 text-green-300" />
              <span className="text-xs sm:text-sm font-medium text-white">Multi-Vertical Business Operating System</span>
            </div>
            
            <p className="text-lg sm:text-xl font-medium text-teal-200 mb-4">
              Grow your Business, your way
            </p>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-5 tracking-tight leading-tight">
              One Platform.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-green-200 to-white">
                Every Business Type.
              </span>
            </h1>
            
            <p className="text-base sm:text-lg text-teal-100/90 max-w-3xl mx-auto mb-8">
              From Shisa Nyama to pharmacy, from spaza shop to hotel — each vertical gets 
              its own POS layout, SKU catalogue, compliance rules, and chart of accounts.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/merchant-os/signup">
                <Button size="lg" className="bg-white text-[#00897B] hover:bg-teal-50 font-semibold px-8 py-6 text-base shadow-xl">
                  <Store className="mr-2 h-4 w-4" />
                  Start Free Trial
                </Button>
              </Link>
              <Link href="#pricing">
                <Button size="lg" variant="outline" className="bg-transparent text-white border-white/30 hover:bg-white/10 font-semibold px-8 py-6">
                  View Pricing
                </Button>
              </Link>
            </div>
            
            <p className="text-sm text-teal-200/80 mt-4">
              Free 14-day trial • No credit card required • Cancel anytime
            </p>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#FAFAFA"/>
          </svg>
        </div>
      </header>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-20 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B] bg-[#E0F2F1] text-xs">
              <CreditCard className="h-3 w-3 mr-1" />
              Simple Pricing
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-3">
              Choose Your <span className="text-[#00897B]">Plan</span>
            </h2>
            <p className="text-sm sm:text-base text-[#757575] max-w-2xl mx-auto">
              Start with a free trial. Upgrade when you&apos;re ready. No hidden fees.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {subscriptionPlans.map((plan) => (
              <div
                key={plan.code}
                className={`relative rounded-xl border-2 transition-all ${
                  plan.isPopular 
                    ? 'border-[#00897B] shadow-xl scale-105' 
                    : 'border-gray-200 hover:border-[#00897B]/50'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[#00897B] text-white px-3 py-1">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <div className="p-6 text-center">
                  <div 
                    className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${plan.color}20`, color: plan.color }}
                  >
                    <plan.icon className="h-6 w-6" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-[#1A1A1A]">{plan.name}</h3>
                  <p className="text-xs text-[#757575] mt-1 mb-4">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-[#1A1A1A]">R{plan.price}</span>
                    <span className="text-[#757575]">/month</span>
                  </div>
                  
                  <div className="space-y-2 text-left mb-6">
                    {plan.features.slice(0, 6).map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-[#424242]">
                        <CheckCircle2 className="h-4 w-4 text-[#00897B] flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                    {plan.features.length > 6 && (
                      <div className="text-xs text-[#757575] text-center pt-2">
                        +{plan.features.length - 6} more features
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-[#757575] border-t border-gray-200 pt-4 mb-4">
                    {plan.limits.users} users • {plan.limits.branches} location{plan.limits.branches > 1 ? 's' : ''} • {plan.limits.products.toLocaleString()} products
                  </div>
                  
                  <Link href={`/merchant-os/signup?plan=${plan.code}`}>
                    <Button 
                      className={`w-full py-5 font-medium ${
                        plan.isPopular 
                          ? 'bg-[#00897B] hover:bg-[#00695C] text-white' 
                          : 'bg-gray-100 hover:bg-gray-200 text-[#1A1A1A]'
                      }`}
                    >
                      Start {plan.trialDays}-Day Free Trial
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How Signup Works */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-3">
              How to Get Started
            </h2>
            <p className="text-sm sm:text-base text-[#757575]">
              Sign up in minutes. No technical knowledge required.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'Choose Plan', desc: 'Select Starter, Pro, or Enterprise based on your needs.', icon: CreditCard, color: '#6B7280' },
              { step: '2', title: 'Create Account', desc: 'Sign up with Gmail, Apple, or your email address.', icon: User, color: '#00897B' },
              { step: '3', title: 'Setup Business', desc: 'Tell us your business name and choose your vertical.', icon: Store, color: '#7C3AED' },
              { step: '4', title: 'Start Selling', desc: 'Your POS is pre-configured. Start accepting payments!', icon: TrendingUp, color: '#4CAF50' },
            ].map((item, index) => (
              <div key={index} className="relative text-center p-5 bg-[#FAFAFA] rounded-xl border border-gray-200">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center" style={{ backgroundColor: item.color }}>
                  {item.step}
                </div>
                <div className="w-10 h-10 mx-auto mb-3 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">{item.title}</h3>
                <p className="text-xs text-[#757575]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-20 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B] bg-[#E0F2F1] text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Complete Business OS
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-3">
              Everything You Need to Run Your Business
            </h2>
            <p className="text-sm sm:text-base text-[#757575] max-w-2xl mx-auto">
              Merchant OS replaces your POS, accounting, payroll, CRM, and inventory systems — all integrated.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {coreFeatures.map((feature) => (
              <Card key={feature.id} className="group bg-white border border-gray-200 hover:border-[#00897B]/30 hover:shadow-lg transition-all">
                <CardContent className="p-5 sm:p-6">
                  <div className="w-10 h-10 mb-4 bg-[#E0F2F1] text-[#00897B] rounded-lg flex items-center justify-center group-hover:bg-[#00897B] group-hover:text-white transition-colors">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A] mb-1">{feature.name}</h3>
                  <p className="text-xs sm:text-sm font-medium text-[#00897B] mb-2">{feature.tagline}</p>
                  <p className="text-xs text-[#757575]">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Verticals Section */}
      <section id="verticals" className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B] bg-[#E0F2F1] text-xs">
              <Store className="h-3 w-3 mr-1" />
              12 Verticals · 47 Sub-Verticals
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-3">
              Purpose-Built for <span className="text-[#00897B]">Every Business Type</span>
            </h2>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {businessVerticals.map((vertical, index) => (
              <div key={index} className="group flex flex-col items-center text-center p-3 sm:p-4 rounded-lg bg-[#FAFAFA] hover:bg-white border border-gray-200 hover:border-[#00897B]/30 hover:shadow-md transition-all cursor-pointer">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center mb-2 group-hover:bg-[#00897B] group-hover:text-white transition-colors">
                  <vertical.icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                </div>
                <h3 className="text-[10px] sm:text-xs font-medium text-[#1A1A1A] leading-tight">
                  {vertical.name}
                </h3>
                <p className="text-[10px] text-[#757575] mt-0.5">{vertical.subCount} sub-types</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Options Section */}
      <section id="payment" className="py-12 sm:py-20 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B] bg-[#E0F2F1] text-xs">
              <Landmark className="h-3 w-3 mr-1" />
              Payment Options
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-3">
              Pay Your <span className="text-[#00897B]">Subscription</span>
            </h2>
            <p className="text-sm sm:text-base text-[#757575] max-w-2xl mx-auto">
              Choose how you want to pay for your subscription. EFT or Paystack.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* EFT Option */}
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#00897B]/10 text-[#00897B] flex items-center justify-center">
                    <Building className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#1A1A1A]">EFT / Bank Transfer</h3>
                    <p className="text-xs text-[#757575]">Direct bank deposit</p>
                  </div>
                </div>
                
                <div className="bg-[#F5F5F5] rounded-lg p-4 space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#757575]">Bank:</span>
                    <span className="font-medium text-[#1A1A1A]">{eftDetails.bankName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#757575]">Account Holder:</span>
                    <span className="font-medium text-[#1A1A1A]">{eftDetails.accountHolder}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#757575]">Account Number:</span>
                    <span className="font-medium text-[#1A1A1A] font-mono">{eftDetails.accountNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#757575]">Branch Code:</span>
                    <span className="font-medium text-[#1A1A1A] font-mono">{eftDetails.branchCode}</span>
                  </div>
                </div>
                
                <div className="bg-[#E0F2F1] rounded-lg p-3 mb-4">
                  <p className="text-xs text-[#00897B] font-medium mb-1">Payment Reference Format:</p>
                  <p className="text-sm font-mono text-[#1A1A1A]">GRO-[CompanyName]-[YYYYMMDD]</p>
                  <p className="text-[10px] text-[#757575] mt-1">Example: GRO-BURGERKING-20250115</p>
                </div>
                
                <p className="text-xs text-[#757575]">
                  Use your company name and today&apos;s date in the reference. Email proof of payment to accounts@groway.co.za
                </p>
              </CardContent>
            </Card>
            
            {/* Paystack Option */}
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#6B7280]/10 text-[#6B7280] flex items-center justify-center">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#1A1A1A]">Paystack</h3>
                    <p className="text-xs text-[#757575]">Card, EFT, QR, USSD</p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-[#424242]">
                    <CheckCircle2 className="h-4 w-4 text-[#00897B]" />
                    <span>Pay with Card (Visa, Mastercard)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#424242]">
                    <CheckCircle2 className="h-4 w-4 text-[#00897B]" />
                    <span>Instant EFT from major banks</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#424242]">
                    <CheckCircle2 className="h-4 w-4 text-[#00897B]" />
                    <span>QR code payment</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#424242]">
                    <CheckCircle2 className="h-4 w-4 text-[#00897B]" />
                    <span>USSD for mobile banking</span>
                  </div>
                </div>
                
                <div className="bg-[#F5F5F5] rounded-lg p-3">
                  <p className="text-xs text-[#757575]">
                    Paystack is a secure payment gateway. Your card details are encrypted and never stored on our servers.
                  </p>
                </div>
                
                <Badge variant="outline" className="mt-4 text-[10px] border-green-500/30 text-green-600">
                  Instant activation
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="py-10 sm:py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#1A1A1A] rounded-xl p-6 sm:p-8 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-lg sm:text-xl font-bold mb-2">Compliance Built-In</h3>
                <p className="text-sm text-gray-400">POPIA · FICA · BCEA · VAT · NCA · PCI-DSS Level 1</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {['PCI-DSS L1', 'POPIA', 'SARB', 'NCR', 'FSCA'].map((badge, index) => (
                  <div key={index} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/10">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#4CAF50]" />
                    <span className="text-xs font-medium">{badge}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 bg-[#FAFAFA]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#00695C] via-[#00897B] to-[#4CAF50] p-6 sm:p-10 text-center">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Ready to Transform Your Business?
              </h2>
              <p className="text-sm sm:text-base text-teal-100 mb-6">
                Join thousands of South African businesses using Groway Merchant OS.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/merchant-os/signup">
                  <Button size="lg" className="bg-white text-[#00897B] hover:bg-teal-50 font-semibold px-8 py-5 shadow-lg">
                    <Store className="mr-2 h-4 w-4" />
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="/merchant-os/login">
                  <Button size="lg" variant="outline" className="bg-transparent text-white border-white/30 hover:bg-white/10 font-semibold px-8 py-5">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 sm:py-10 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <img src="/groway-logo.png" alt="Groway" className="h-7 w-auto" />
                <span className="text-xs text-[#757575]">© 2025 Groway (Pty) Ltd. All rights reserved.</span>
              </div>
              
              <div className="flex items-center gap-5 text-xs text-[#757575]">
                <Link href="/" className="hover:text-[#00897B] transition-colors flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3" />
                  Home
                </Link>
                <a href="#" className="hover:text-[#00897B] transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-[#00897B] transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-[#00897B] transition-colors">Contact</a>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-2">
              {['PCI-DSS L1', 'POPIA', 'SARB', 'NCR', 'FSCA'].map((badge, index) => (
                <Badge key={index} variant="outline" className="text-[10px] border-[#00897B]/30 text-[#00897B] py-0.5">
                  {badge}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
