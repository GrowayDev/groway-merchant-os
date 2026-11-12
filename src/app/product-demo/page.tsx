'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Wallet,
  Store,
  Truck,
  CreditCard,
  Shield,
  Building2,
  ArrowRight,
  Smartphone,
  Globe,
  Zap,
  Users,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Menu,
  X,
  Send,
  User,
  Mail,
  Phone,
  Calendar,
  QrCode,
  Clock,
  Receipt,
  Layers,
  Lock,
  Cpu,
  Activity,
  Target,
  AlertTriangle,
  Gift,
  Bell,
  DollarSign,
  Calculator,
  FileText,
  Building,
  PieChart,
  LayoutDashboard,
  Settings,
  Handshake,
  Landmark,
} from 'lucide-react'

// Brand colors
const BRAND = {
  green: '#1B5E20',
  teal: '#00897B',
  lightGreen: '#4CAF50',
  accentGreen: '#E8F5E9',
}

// Applications Data
const applications = [
  {
    id: 'merchant-os',
    name: 'Merchant OS',
    tagline: 'One Platform. Every Business Type.',
    description: 'Multi-vertical Business OS with vertical-specific POS, inventory, accounting, and compliance for South African businesses.',
    icon: Store,
    status: 'Core Product',
    users: '15,000+',
    transactions: 'R2.5B+ monthly',
    features: [
      'Vertical-Specific POS',
      'Smart Inventory',
      'Built-in Accounting',
      'QR Digital Menu',
      'Staff Management',
      'Compliance Suite',
      'Multi-Location',
      'Offline Mode',
    ],
    verticals: ['Restaurant', 'Shisa Nyama', 'Pharmacy', 'Salon', 'Hotel', 'Retail'],
    devices: ['Tablet', 'Smartphone', 'POS Terminal'],
    color: BRAND.teal,
  },
  {
    id: 'consumer-wallet',
    name: 'Consumer Wallet',
    tagline: 'Your Financial Life, One Tap Away',
    description: 'Pay, send, save, and grow your money with South Africa\'s most powerful mobile wallet.',
    icon: Wallet,
    status: 'Core Product',
    users: '2.5M+',
    transactions: 'R4.2B processed',
    features: [
      'Virtual Cards',
      'QR Payments',
      'PayShap',
      'MTN MOMO',
      'Bill Pay',
      'Savings Goals',
      'P2P Transfers',
      'Remittance',
    ],
    verticals: ['Individuals', 'Families', 'Stokvels'],
    devices: ['Android', 'iOS'],
    color: BRAND.green,
  },
  {
    id: 'grosupply',
    name: 'GroSupply',
    tagline: 'B2B Procurement, Simplified',
    description: 'Source stock from verified suppliers, get instant credit, and settle with one click.',
    icon: Truck,
    status: 'Active',
    users: '5,000+',
    transactions: 'R850M+ GMV',
    features: [
      'Supplier Network',
      'GroCredit Integration',
      'GroSettle',
      '3-Way Match',
      'RFQ System',
      'PO Management',
      'GRN Processing',
      'Bulk Ordering',
    ],
    verticals: ['FMCG', 'Liquor', 'Pharmacy', 'Hardware'],
    devices: ['Web Portal', 'Mobile App'],
    color: '#1565C0',
  },
  {
    id: 'grocredit',
    name: 'GroCredit',
    tagline: 'Business Credit When You Need It',
    description: 'Instant revolving credit lines for merchants based on transaction history and business health.',
    icon: CreditCard,
    status: 'Active',
    users: '3,200+',
    transactions: 'R420M+ disbursed',
    features: [
      'Revolving Credit',
      'Instant Approval',
      'Tiered Limits',
      'Flexible Repayment',
      'Interest Calculator',
      'Draw Requests',
      'Auto-Repayment',
      'Credit Building',
    ],
    verticals: ['SME Retailers', 'Restaurants', 'Service Businesses'],
    devices: ['Integrated in Merchant OS'],
    color: '#7B1FA2',
  },
  {
    id: 'gopay',
    name: 'GoPay',
    tagline: 'Payments That Move At The Speed Of Business',
    description: 'Payment gateway processing cards, QR, EFT, and PayShap with PCI-DSS compliance.',
    icon: CreditCard,
    status: 'Infrastructure',
    users: '10M+ txns/month',
    transactions: 'R3.5B+ processed',
    features: [
      'Card Processing',
      'PayShap Integration',
      'Instant EFT',
      'QR Payments',
      'PCI-DSS Level 1',
      'Multi-Currency',
      'Recurring Billing',
      'Webhooks',
    ],
    verticals: ['E-commerce', 'POS Integration', 'Enterprise'],
    devices: ['API', 'SDK', 'Web Portal'],
    color: '#E65100',
  },
  {
    id: 'admin-console',
    name: 'Admin Console',
    tagline: 'Platform Operations, Under Control',
    description: 'Monitor platform health, manage merchants, handle compliance, and detect fraud.',
    icon: Shield,
    status: 'Internal',
    users: 'Internal Team',
    transactions: 'Platform-wide',
    features: [
      'Platform Dashboard',
      'Merchant Management',
      'Compliance Center',
      'Fraud Detection',
      'Support Tools',
      'Audit Logs',
      'Analytics',
      'Configuration',
    ],
    verticals: ['Operations', 'Compliance', 'Support'],
    devices: ['Web Portal'],
    color: '#37474F',
  },
  {
    id: 'agent-network',
    name: 'Agent Network',
    tagline: 'Turn Your Network Into Revenue',
    description: 'Earn up to 15% commission by referring merchants. Build your network and create passive income.',
    icon: Gift,
    status: 'Growth Program',
    users: '1,234 agents',
    transactions: 'R15M+ commissions paid',
    features: [
      '5-Tier Commission',
      'Network Override',
      'Dashboard & Analytics',
      'Training Portal',
      'Lead Management',
      'Payout Tracking',
      'Marketing Materials',
      'Support',
    ],
    verticals: ['Entrepreneurs', 'Community Leaders', 'Sales Agents'],
    devices: ['Web Portal', 'Mobile App'],
    color: '#00695C',
  },
]

// Use Cases
const useCases = [
  {
    persona: 'Restaurant Owner',
    avatar: '🍽️',
    business: 'Thabo\'s Shisa Nyama',
    location: 'Soweto, Johannesburg',
    challenge: 'Managing orders, inventory, and payments across a busy weekend rush with limited staff.',
    solution: 'Merchant OS configured for Shisa Nyama vertical with QR ordering, kitchen display, and PayShap integration.',
    results: ['35% faster table turnover', 'R12,000/month saved on stock waste', 'Real-time sales tracking'],
    apps: ['Merchant OS', 'Consumer Wallet (customers)', 'GroSupply'],
  },
  {
    persona: 'Pharmacy Manager',
    avatar: '💊',
    business: 'MediCare Pharmacy',
    location: 'Durban Central',
    challenge: 'Tracking expiry dates, managing Schedule 1-6 compliance, and supplier orders.',
    solution: 'Pharmacy vertical with Schedule drug tracking, expiry alerts, and integrated GroSupply ordering.',
    results: ['Zero compliance violations', '40% reduction in expired stock', 'Automated reordering'],
    apps: ['Merchant OS', 'GroSupply', 'GoPay'],
  },
  {
    persona: 'Salon Owner',
    avatar: '✂️',
    business: 'Glamour Studio',
    location: 'Cape Town',
    challenge: 'Managing appointments, staff commissions, and retail product sales.',
    solution: 'Salon vertical with built-in booking, commission tracking, and inventory management.',
    results: ['25% increase in bookings', 'Staff retention improved', 'Retail revenue +45%'],
    apps: ['Merchant OS', 'Consumer Wallet (loyalty)'],
  },
  {
    persona: 'Small Retailer',
    avatar: '🏪',
    business: 'Mama Nomsa\'s Spaza',
    location: 'Orange Farm',
    challenge: 'No access to formal credit, stock shortages, and cash handling risks.',
    solution: 'Merchant OS with GroCredit line, GroSupply marketplace, and digital payments via Consumer Wallet.',
    results: ['R25,000 credit facility approved', 'Steady stock supply', '40% digital transactions'],
    apps: ['Merchant OS', 'GroCredit', 'GroSupply', 'Consumer Wallet'],
  },
]

// Target Audiences
const targetAudiences = [
  {
    group: 'Investors',
    icon: TrendingUp,
    color: BRAND.teal,
    description: 'Africa\'s fintech opportunity with proven traction',
    keyPoints: [
      'R4.2B+ in consumer transactions',
      '15,000+ merchant businesses',
      '6 African countries active',
      'Regulatory compliance (SARB, NCR, FSCA)',
      'Proven unit economics',
    ],
    ask: 'Series A funding for expansion',
  },
  {
    group: 'Partners & Integrators',
    icon: Handshake,
    color: BRAND.green,
    description: 'API-first platform for seamless integration',
    keyPoints: [
      '528+ REST API endpoints',
      'Webhook notifications',
      'SDK for mobile & web',
      'PCI-DSS Level 1 certified',
      'Dedicated partner portal',
    ],
    ask: 'Technical partnership discussions',
  },
  {
    group: 'Merchants',
    icon: Store,
    color: '#1565C0',
    description: 'Modern business tools for every vertical',
    keyPoints: [
      'Free 30-day trial',
      'No setup fees',
      'Hardware included options',
      '24/7 support',
      'Training provided',
    ],
    ask: 'Start your free trial',
  },
  {
    group: 'Suppliers',
    icon: Truck,
    color: '#7B1FA2',
    description: 'Access 15,000+ active merchant buyers',
    keyPoints: [
      'No listing fees',
      'Guaranteed payments via GroSettle',
      'Bulk order management',
      'Analytics dashboard',
      'National reach',
    ],
    ask: 'Join the supplier network',
  },
  {
    group: 'Credit Partners',
    icon: Landmark,
    color: '#E65100',
    description: 'Co-lending opportunities for SME finance',
    keyPoints: [
      'Alternative credit scoring',
      'Transaction data insights',
      'Risk sharing models',
      'NCR registered',
      'R420M+ disbursed',
    ],
    ask: 'Explore lending partnership',
  },
]

// Platform Stats
const platformStats = [
  { label: 'Active Users', value: '2.5M+', icon: Users },
  { label: 'Merchants', value: '15,000+', icon: Store },
  { label: 'Monthly GMV', value: 'R4.2B+', icon: TrendingUp },
  { label: 'Countries', value: '6+', icon: Globe },
  { label: 'API Endpoints', value: '528+', icon: Zap },
  { label: 'Business Verticals', value: '12', icon: Layers },
]

// Compliance
const complianceBadges = [
  { name: 'PCI-DSS Level 1', desc: 'Payment security' },
  { name: 'POPIA', desc: 'Data protection' },
  { name: 'SARB', desc: 'Banking regulation' },
  { name: 'NCR', desc: 'Credit compliance' },
  { name: 'FSCA', desc: 'Financial services' },
]

export default function ProductDemoPage() {
  const [activeApp, setActiveApp] = useState('merchant-os')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [demoFormSubmitted, setDemoFormSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    interest: 'merchant',
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setDemoFormSubmitted(true)
  }

  const currentApp = applications.find(a => a.id === activeApp) || applications[0]

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/" className="flex items-center gap-2">
              <img src="/groway-logo.png" alt="Groway" className="h-8 sm:h-10 w-auto" />
              <span className="hidden sm:inline text-xs font-medium text-[#00897B] bg-[#E0F2F1] px-2 py-1 rounded-full">
                Product Demo
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6">
              <a href="#platform" className="text-sm font-medium text-[#757575] hover:text-[#00897B] transition-colors">
                Platform
              </a>
              <a href="#applications" className="text-sm font-medium text-[#757575] hover:text-[#00897B] transition-colors">
                Applications
              </a>
              <a href="#use-cases" className="text-sm font-medium text-[#757575] hover:text-[#00897B] transition-colors">
                Use Cases
              </a>
              <a href="#audiences" className="text-sm font-medium text-[#757575] hover:text-[#00897B] transition-colors">
                For Partners
              </a>
              <a href="#demo" className="text-sm font-medium text-[#757575] hover:text-[#00897B] transition-colors">
                Request Demo
              </a>
            </div>
            
            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" className="text-[#1A1A1A] font-medium">
                  Back to Main Site
                </Button>
              </Link>
              <a href="#demo">
                <Button className="bg-[#00897B] hover:bg-[#00695C] text-white font-medium px-5">
                  Request Demo
                </Button>
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="lg:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200 py-4 px-4 space-y-4">
            <a href="#platform" className="block text-sm font-medium text-[#757575]">Platform</a>
            <a href="#applications" className="block text-sm font-medium text-[#757575]">Applications</a>
            <a href="#use-cases" className="block text-sm font-medium text-[#757575]">Use Cases</a>
            <a href="#audiences" className="block text-sm font-medium text-[#757575]">For Partners</a>
            <a href="#demo" className="block text-sm font-medium text-[#757575]">Request Demo</a>
            <div className="pt-4 border-t border-gray-200">
              <Link href="/" className="block">
                <Button variant="outline" className="w-full mb-2">Back to Main Site</Button>
              </Link>
              <Button className="w-full bg-[#00897B] text-white">Request Demo</Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#00695C] via-[#00897B] to-[#1B5E20] py-16 lg:py-24">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent" />
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-green-400/20 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <Layers className="h-3.5 w-3.5 text-green-300" />
              <span className="text-xs sm:text-sm font-medium text-white">Product Portfolio Overview</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-5 tracking-tight leading-tight">
              Africa&apos;s Integrated
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-green-200 to-white">
                Financial Operating System
              </span>
            </h1>
            
            {/* Sub-headline */}
            <p className="text-base sm:text-lg text-teal-100/90 max-w-3xl mx-auto mb-8">
              A comprehensive platform connecting consumers, merchants, suppliers, and financial services 
              across South Africa and the African continent.
            </p>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-8">
              {platformStats.slice(0, 4).map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-white/70">{stat.label}</div>
                </div>
              ))}
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="#applications">
                <Button 
                  size="lg" 
                  className="bg-white text-[#00897B] hover:bg-teal-50 font-semibold px-6 py-5 text-base shadow-xl"
                >
                  <Layers className="mr-2 h-4 w-4" />
                  Explore Applications
                </Button>
              </a>
              <a href="#demo">
                <Button 
                  size="lg" 
                  className="bg-[#E0F2F1] text-[#00695C] hover:bg-white font-semibold px-6 py-5 text-base shadow-lg"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Request a Demo
                </Button>
              </a>
            </div>
          </div>
        </div>
        
        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </header>

      {/* Platform Stats Bar */}
      <section id="platform" className="py-8 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 lg:gap-6">
            {platformStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#E0F2F1] text-[#00897B] mb-2">
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="text-lg sm:text-xl font-bold text-[#1A1A1A]">{stat.value}</div>
                <div className="text-xs text-[#757575]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Overview */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B] bg-[#E0F2F1] text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Platform Architecture
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-3">
              Seven Applications. One Ecosystem.
            </h2>
            <p className="text-sm sm:text-base text-[#757575] max-w-3xl mx-auto">
              Each application is purpose-built for its users while sharing a common infrastructure, 
              data layer, and compliance framework.
            </p>
          </div>

          {/* Application Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {applications.map((app) => (
              <button
                key={app.id}
                onClick={() => setActiveApp(app.id)}
                className={`group text-left p-4 rounded-xl transition-all duration-200 ${
                  activeApp === app.id
                    ? 'bg-gradient-to-br from-[#E0F2F1] to-[#E8F5E9] border-2 border-[#00897B] shadow-lg'
                    : 'bg-[#FAFAFA] border border-gray-200 hover:border-[#00897B]/30 hover:shadow-md'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                  activeApp === app.id ? 'bg-[#00897B] text-white' : 'bg-white text-[#00897B]'
                }`}>
                  <app.icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-[#1A1A1A] mb-1">{app.name}</h3>
                <p className="text-[10px] text-[#757575] line-clamp-2">{app.tagline}</p>
                {app.status && (
                  <Badge className={`mt-2 text-[10px] ${
                    app.status === 'Core Product' ? 'bg-[#1B5E20]/10 text-[#1B5E20]' :
                    app.status === 'Infrastructure' ? 'bg-[#E65100]/10 text-[#E65100]' :
                    'bg-gray-100 text-[#757575]'
                  }`}>
                    {app.status}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {/* Detailed Application View */}
          <Card className="overflow-hidden border-0 shadow-xl">
            <div className="grid lg:grid-cols-2">
              {/* Left - Mockup Area */}
              <div className="bg-gradient-to-br from-[#F5F5F5] to-[#E0E0E0] p-6 sm:p-8 flex items-center justify-center min-h-[400px]">
                {currentApp.id === 'merchant-os' && <MerchantOSMockup />}
                {currentApp.id === 'consumer-wallet' && <ConsumerWalletMockup />}
                {currentApp.id === 'grosupply' && <GroSupplyMockup />}
                {currentApp.id === 'grocredit' && <GroCreditMockup />}
                {currentApp.id === 'gopay' && <GoPayMockup />}
                {currentApp.id === 'admin-console' && <AdminConsoleMockup />}
                {currentApp.id === 'agent-network' && <AgentNetworkMockup />}
              </div>
              
              {/* Right - Details */}
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Badge className="bg-[#00897B]/10 text-[#00897B]">{currentApp.status}</Badge>
                  <Badge variant="outline" className="text-[#757575]">{currentApp.users} users</Badge>
                </div>
                
                <h3 className="text-2xl font-bold text-[#1A1A1A] mb-2">{currentApp.name}</h3>
                <p className="text-sm font-medium text-[#00897B] mb-4">{currentApp.tagline}</p>
                <p className="text-sm text-[#757575] mb-6">{currentApp.description}</p>
                
                {/* Features */}
                <div className="mb-6">
                  <h4 className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-3">Key Features</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {currentApp.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[#00897B] flex-shrink-0" />
                        <span className="text-xs text-[#424242]">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Verticals */}
                <div className="mb-6">
                  <h4 className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-2">Target Verticals</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentApp.verticals.map((vertical, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">{vertical}</Badge>
                    ))}
                  </div>
                </div>
                
                {/* Devices */}
                <div className="mb-6">
                  <h4 className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-2">Available On</h4>
                  <div className="flex items-center gap-2">
                    {currentApp.devices.map((device, idx) => (
                      <span key={idx} className="text-xs text-[#757575] flex items-center gap-1">
                        <Smartphone className="h-3 w-3" />
                        {device}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* CTA */}
                <div className="flex items-center gap-3">
                  <Link href={`/${currentApp.id}`}>
                    <Button className="bg-[#00897B] hover:bg-[#00695C] text-white">
                      Learn More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <a href="#demo">
                    <Button variant="outline">
                      Request Demo
                    </Button>
                  </a>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>
      </section>

      {/* Applications Detailed Section */}
      <section id="applications" className="py-12 sm:py-16 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B] bg-[#E0F2F1] text-xs">
              <Layers className="h-3 w-3 mr-1" />
              Product Portfolio
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-3">
              Core Products
            </h2>
          </div>

          {/* Core Products - Merchant OS & Consumer Wallet */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Merchant OS */}
            <Card className="overflow-hidden border-0 shadow-lg">
              <div className="bg-gradient-to-br from-[#00897B] to-[#00695C] p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Store className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Merchant OS</h3>
                      <p className="text-xs text-white/70">Core Product - 15,000+ merchants</p>
                    </div>
                  </div>
                  <Badge className="bg-white/20 text-white">R2.5B+ monthly</Badge>
                </div>
                <p className="text-sm text-white/80 mb-4">
                  Multi-vertical Business OS with vertical-specific POS, inventory, accounting, 
                  and compliance. Built for South African businesses from Shisa Nyama to pharmacy.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Restaurant', 'Shisa Nyama', 'Pharmacy', 'Salon', 'Hotel', 'Retail'].map(v => (
                    <Badge key={v} variant="outline" className="text-white/70 border-white/30 text-xs">
                      {v}
                    </Badge>
                  ))}
                </div>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-[#E0F2F1] rounded-lg">
                    <Smartphone className="h-5 w-5 text-[#00897B] mb-1" />
                    <p className="text-xs font-medium text-[#1A1A1A]">Multi-Device</p>
                    <p className="text-[10px] text-[#757575]">Tablet, Phone, POS Terminal</p>
                  </div>
                  <div className="p-3 bg-[#E8F5E9] rounded-lg">
                    <Clock className="h-5 w-5 text-[#4CAF50] mb-1" />
                    <p className="text-xs font-medium text-[#1A1A1A]">Offline Mode</p>
                    <p className="text-[10px] text-[#757575]">72-hour sync capability</p>
                  </div>
                  <div className="p-3 bg-[#FAFAFA] rounded-lg">
                    <QrCode className="h-5 w-5 text-[#00897B] mb-1" />
                    <p className="text-xs font-medium text-[#1A1A1A]">QR Ordering</p>
                    <p className="text-[10px] text-[#757575]">Customer self-service</p>
                  </div>
                  <div className="p-3 bg-[#FAFAFA] rounded-lg">
                    <Receipt className="h-5 w-5 text-[#00897B] mb-1" />
                    <p className="text-xs font-medium text-[#1A1A1A]">Built-in Accounting</p>
                    <p className="text-[10px] text-[#757575]">Tax & VAT ready</p>
                  </div>
                </div>
                <Link href="/merchant-os">
                  <Button className="w-full bg-[#00897B] hover:bg-[#00695C] text-white">
                    Explore Merchant OS
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Consumer Wallet */}
            <Card className="overflow-hidden border-0 shadow-lg">
              <div className="bg-gradient-to-br from-[#1B5E20] to-[#4CAF50] p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Wallet className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Consumer Wallet</h3>
                      <p className="text-xs text-white/70">Core Product - 2.5M+ users</p>
                    </div>
                  </div>
                  <Badge className="bg-white/20 text-white">R4.2B+ processed</Badge>
                </div>
                <p className="text-sm text-white/80 mb-4">
                  Your complete financial life in one superapp. Pay, send, save, and grow your money 
                  with virtual cards, QR payments, PayShap, and MTN MOMO integration.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Virtual Cards', 'QR Pay', 'PayShap', 'MTN MOMO', 'Bills', 'Savings'].map(v => (
                    <Badge key={v} variant="outline" className="text-white/70 border-white/30 text-xs">
                      {v}
                    </Badge>
                  ))}
                </div>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-[#E8F5E9] rounded-lg">
                    <CreditCard className="h-5 w-5 text-[#4CAF50] mb-1" />
                    <p className="text-xs font-medium text-[#1A1A1A]">Virtual Cards</p>
                    <p className="text-[10px] text-[#757575]">Instant Visa & Mastercard</p>
                  </div>
                  <div className="p-3 bg-[#E0F2F1] rounded-lg">
                    <Send className="h-5 w-5 text-[#00897B] mb-1" />
                    <p className="text-xs font-medium text-[#1A1A1A]">PayShap</p>
                    <p className="text-[10px] text-[#757575]">Instant bank transfers</p>
                  </div>
                  <div className="p-3 bg-[#FAFAFA] rounded-lg">
                    <Shield className="h-5 w-5 text-[#4CAF50] mb-1" />
                    <p className="text-xs font-medium text-[#1A1A1A]">Bank-Grade Security</p>
                    <p className="text-[10px] text-[#757575]">PCI-DSS Level 1</p>
                  </div>
                  <div className="p-3 bg-[#FAFAFA] rounded-lg">
                    <DollarSign className="h-5 w-5 text-[#4CAF50] mb-1" />
                    <p className="text-xs font-medium text-[#1A1A1A]">Savings Goals</p>
                    <p className="text-[10px] text-[#757575]">Auto-save & interest</p>
                  </div>
                </div>
                <Link href="/consumer-wallet">
                  <Button className="w-full bg-[#4CAF50] hover:bg-[#388E3C] text-white">
                    Explore Consumer Wallet
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Other Products */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {applications.filter(a => a.id !== 'merchant-os' && a.id !== 'consumer-wallet').map((app) => (
              <Link key={app.id} href={`/${app.id}`}>
                <Card className="h-full border border-gray-200 hover:border-[#00897B]/30 hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#E0F2F1] to-[#E8F5E9] flex items-center justify-center">
                        <app.icon className="h-5 w-5 text-[#00897B]" />
                      </div>
                      <Badge className="text-[10px] bg-gray-100 text-[#757575]">{app.status}</Badge>
                    </div>
                    <h3 className="text-base font-bold text-[#1A1A1A] mb-1">{app.name}</h3>
                    <p className="text-xs text-[#00897B] font-medium mb-2">{app.tagline}</p>
                    <p className="text-xs text-[#757575] mb-3 line-clamp-2">{app.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#757575]">{app.users}</span>
                      <ArrowRight className="h-4 w-4 text-[#00897B]" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B] bg-[#E0F2F1] text-xs">
              <Users className="h-3 w-3 mr-1" />
              Real-World Success
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-3">
              Use Cases & Success Stories
            </h2>
            <p className="text-sm sm:text-base text-[#757575] max-w-3xl mx-auto">
              See how South African businesses are transforming with Groway.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {useCases.map((useCase, index) => (
              <Card key={index} className="overflow-hidden border border-gray-200">
                <div className="p-5 sm:p-6">
                  {/* Persona Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-[#E0F2F1] flex items-center justify-center text-2xl">
                      {useCase.avatar}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#1A1A1A]">{useCase.business}</h3>
                      <p className="text-xs text-[#757575]">{useCase.persona} - {useCase.location}</p>
                    </div>
                  </div>
                  
                  {/* Challenge */}
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Challenge
                    </h4>
                    <p className="text-sm text-[#424242]">{useCase.challenge}</p>
                  </div>
                  
                  {/* Solution */}
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-[#00897B] uppercase tracking-wider mb-2 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Groway Solution
                    </h4>
                    <p className="text-sm text-[#424242]">{useCase.solution}</p>
                  </div>
                  
                  {/* Results */}
                  <div className="bg-[#E8F5E9] rounded-lg p-4 mb-4">
                    <h4 className="text-xs font-semibold text-[#1B5E20] uppercase tracking-wider mb-2">Results</h4>
                    <ul className="space-y-1">
                      {useCase.results.map((result, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-[#424242]">
                          <TrendingUp className="h-3 w-3 text-[#4CAF50]" />
                          {result}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Apps Used */}
                  <div className="flex flex-wrap gap-1">
                    {useCase.apps.map((app, idx) => (
                      <Badge key={idx} variant="outline" className="text-[10px]">{app}</Badge>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Target Audiences Section */}
      <section id="audiences" className="py-12 sm:py-16 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B] bg-[#E0F2F1] text-xs">
              <Target className="h-3 w-3 mr-1" />
              Partnership Opportunities
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-3">
              Who We Work With
            </h2>
            <p className="text-sm sm:text-base text-[#757575] max-w-3xl mx-auto">
              Groway offers unique opportunities for different types of partners and stakeholders.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {targetAudiences.map((audience, index) => (
              <Card key={index} className="border border-gray-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center" style={{ backgroundColor: `${audience.color}20` }}>
                    <audience.icon className="h-6 w-6" style={{ color: audience.color }} />
                  </div>
                  <h3 className="text-base font-bold text-[#1A1A1A] mb-1">{audience.group}</h3>
                  <p className="text-xs text-[#757575] mb-3">{audience.description}</p>
                  <ul className="space-y-1.5 mb-4">
                    {audience.keyPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-xs text-[#424242]">
                        <CheckCircle2 className="h-3 w-3 text-[#00897B] flex-shrink-0 mt-0.5" />
                        {point}
                      </li>
                    ))}
                  </ul>
                  <Badge className="text-[10px]" style={{ backgroundColor: `${audience.color}15`, color: audience.color }}>
                    {audience.ask}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B] bg-[#E0F2F1] text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Trust & Compliance
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-4">
                Built on Trust, Backed by Compliance
              </h2>
              <p className="text-sm sm:text-base text-[#757575] mb-6">
                Groway operates under strict regulatory oversight, ensuring your data and money 
                are protected by South African and international standards.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {complianceBadges.map((badge, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-[#FAFAFA] rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-[#00897B]" />
                    <div>
                      <p className="text-xs font-semibold text-[#1A1A1A]">{badge.name}</p>
                      <p className="text-[10px] text-[#757575]">{badge.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#E0F2F1] to-[#E8F5E9] rounded-xl p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <Lock className="h-8 w-8 text-[#00897B] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-[#1A1A1A]">256-bit</p>
                  <p className="text-xs text-[#757575]">Encryption</p>
                </div>
                <div className="text-center">
                  <Cpu className="h-8 w-8 text-[#00897B] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-[#1A1A1A]">AI</p>
                  <p className="text-xs text-[#757575]">Fraud Detection</p>
                </div>
                <div className="text-center">
                  <Activity className="h-8 w-8 text-[#4CAF50] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-[#1A1A1A]">99.9%</p>
                  <p className="text-xs text-[#757575]">Uptime</p>
                </div>
                <div className="text-center">
                  <Globe className="h-8 w-8 text-[#4CAF50] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-[#1A1A1A]">6+</p>
                  <p className="text-xs text-[#757575]">Countries</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Request Demo Section */}
      <section id="demo" className="py-12 sm:py-16 bg-gradient-to-br from-[#00695C] via-[#00897B] to-[#1B5E20]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left - Info */}
            <div className="text-white">
              <Badge className="mb-4 bg-white/10 text-white border-white/20">
                <Calendar className="h-3 w-3 mr-1" />
                Book a Demo
              </Badge>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
                See Groway in Action
              </h2>
              <p className="text-base text-white/80 mb-6">
                Schedule a personalized demo with our team. We&apos;ll walk you through the platform 
                and show you how Groway can transform your business.
              </p>
              
              {/* Contact Info */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Email Us</p>
                    <p className="text-sm text-white/70">bridge@groway.co.za</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Call Us</p>
                    <p className="text-sm text-white/70">+27 817184013</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Website</p>
                    <p className="text-sm text-white/70">www.groway.co.za</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Form */}
            <Card className="border-0 shadow-xl">
              <CardContent className="p-6 sm:p-8">
                {demoFormSubmitted ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-[#E8F5E9] flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="h-8 w-8 text-[#4CAF50]" />
                    </div>
                    <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Demo Requested!</h3>
                    <p className="text-sm text-[#757575] mb-4">
                      Thank you for your interest. Our team will contact you within 24-48 hours 
                      to schedule your personalized demo.
                    </p>
                    <Button onClick={() => setDemoFormSubmitted(false)} variant="outline">
                      Submit Another Request
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-[#1A1A1A] mb-1.5 block">
                        I&apos;m interested in...
                      </Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                          { value: 'merchant', label: 'Merchant OS' },
                          { value: 'consumer', label: 'Consumer Wallet' },
                          { value: 'partner', label: 'Partnership' },
                          { value: 'investor', label: 'Investment' },
                          { value: 'supplier', label: 'GroSupply' },
                          { value: 'credit', label: 'GroCredit' },
                        ].map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, interest: type.value }))}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                              formData.interest === type.value
                                ? 'bg-[#00897B] text-white'
                                : 'bg-[#F5F5F5] text-[#757575] hover:bg-[#E0F2F1]'
                            }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name" className="text-sm font-medium text-[#1A1A1A] mb-1.5 block">
                          Full Name *
                        </Label>
                        <Input
                          id="name"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Your name"
                          className="h-10"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-sm font-medium text-[#1A1A1A] mb-1.5 block">
                          Email Address *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="your@email.com"
                          className="h-10"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="company" className="text-sm font-medium text-[#1A1A1A] mb-1.5 block">
                        Company / Organization
                      </Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                        placeholder="Your company name"
                        className="h-10"
                      />
                    </div>

                    <div>
                      <Label htmlFor="message" className="text-sm font-medium text-[#1A1A1A] mb-1.5 block">
                        Message
                      </Label>
                      <Textarea
                        id="message"
                        rows={3}
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Tell us about your needs..."
                        className="resize-none"
                      />
                    </div>

                    <Button type="submit" className="w-full bg-[#00897B] hover:bg-[#00695C] text-white h-11">
                      Request Demo
                      <Send className="ml-2 h-4 w-4" />
                    </Button>

                    <p className="text-[10px] text-[#757575] text-center">
                      By submitting, you agree to our Privacy Policy and Terms of Service.
                    </p>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/groway-logo.png" alt="Groway" className="h-6 w-auto" />
              <span className="text-xs text-[#757575]">Product Portfolio Demo</span>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-[#757575]">
              <span>bridge@groway.co.za</span>
              <span>|</span>
              <span>+27 817184013</span>
              <span>|</span>
              <span>www.groway.co.za</span>
            </div>
            
            <p className="text-xs text-[#757575]">2026 Groway (Pty) Ltd. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Mockup Components

function MerchantOSMockup() {
  return (
    <div className="relative">
      {/* Tablet Frame */}
      <div className="w-[320px] h-[220px] bg-[#1A1A1A] rounded-xl p-1.5 shadow-2xl">
        <div className="w-full h-full bg-white rounded-lg overflow-hidden flex">
          {/* Sidebar */}
          <div className="w-14 bg-[#00897B] flex flex-col items-center py-2 gap-1">
            {['Home', 'Sales', 'Book', 'Stock', 'Fin', 'Team', 'More'].map((item, i) => (
              <div key={i} className={`w-9 h-9 rounded-lg flex items-center justify-center text-[8px] font-medium ${i === 0 ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10'}`}>
                {item}
              </div>
            ))}
          </div>
          {/* Main Content */}
          <div className="flex-1 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-[#1A1A1A]">Dashboard</span>
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 rounded-full bg-[#E0F2F1]" />
              </div>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="bg-[#E8F5E9] rounded p-2">
                <span className="text-[8px] text-[#4CAF50]">Today&apos;s Sales</span>
                <p className="text-sm font-bold text-[#1B5E20]">R12,450</p>
              </div>
              <div className="bg-[#E0F2F1] rounded p-2">
                <span className="text-[8px] text-[#00897B]">Orders</span>
                <p className="text-sm font-bold text-[#00695C]">47</p>
              </div>
            </div>
            {/* Chart placeholder */}
            <div className="h-16 bg-[#F5F5F5] rounded flex items-end justify-around px-2 pb-1">
              {[40, 60, 35, 80, 55, 70, 45].map((h, i) => (
                <div key={i} className="w-3 bg-[#00897B] rounded-t" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Phone Frame */}
      <div className="absolute -right-8 -bottom-4 w-[100px] h-[180px] bg-[#1A1A1A] rounded-xl p-1 shadow-xl">
        <div className="w-full h-full bg-white rounded-lg overflow-hidden">
          <div className="h-6 bg-[#00897B] flex items-center justify-center">
            <span className="text-[8px] text-white font-medium">POS</span>
          </div>
          <div className="p-2">
            <div className="grid grid-cols-2 gap-1">
              {['Item 1', 'Item 2', 'Item 3', 'Item 4'].map((item, i) => (
                <div key={i} className="w-9 h-9 bg-[#F5F5F5] rounded flex items-center justify-center text-[6px] text-center">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-2 h-6 bg-[#E8F5E9] rounded flex items-center justify-center">
              <span className="text-[8px] text-[#4CAF50] font-medium">R285.00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConsumerWalletMockup() {
  return (
    <div className="relative">
      {/* Main Phone */}
      <div className="w-[180px] h-[360px] bg-[#1B5E20] rounded-[32px] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[24px] overflow-hidden">
          {/* Status Bar */}
          <div className="h-8 bg-[#4CAF50] flex items-center justify-between px-4">
            <span className="text-white text-[10px]">9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-1.5 bg-white/80 rounded-sm" />
              <div className="w-3 h-1.5 bg-white rounded-sm" />
            </div>
          </div>
          
          {/* Balance Card */}
          <div className="p-3">
            <div className="bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] rounded-xl p-3 mb-3">
              <p className="text-white/70 text-[8px] mb-0.5">Available Balance</p>
              <p className="text-white text-lg font-bold">R 2,450.00</p>
              <div className="flex items-center gap-1 mt-1">
                <Badge className="bg-white/20 text-white text-[6px] px-1 py-0">Bronze</Badge>
              </div>
            </div>
            
            {/* Payment Hub */}
            <div className="bg-[#F5F5F5] rounded-lg p-2 mb-2">
              <div className="grid grid-cols-4 gap-1">
                {[
                  { icon: CreditCard, label: 'Cards' },
                  { icon: QrCode, label: 'QR' },
                  { icon: Send, label: 'Send' },
                  { icon: Phone, label: 'MoMo' },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${i === 0 ? 'bg-[#1B5E20] text-white' : 'bg-[#E8F5E9] text-[#4CAF50]'}`}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="text-[6px] text-[#424242] mt-0.5">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Transactions */}
            <p className="text-[8px] text-[#424242] font-medium mb-1">Recent</p>
            <div className="space-y-1">
              {[
                { name: 'City Power', amount: '-R350' },
                { name: 'John Dube', amount: '+R500' },
              ].map((tx, i) => (
                <div key={i} className="flex items-center justify-between py-1 border-b border-gray-100">
                  <span className="text-[8px] text-[#1B5E20]">{tx.name}</span>
                  <span className={`text-[8px] font-medium ${tx.amount.startsWith('+') ? 'text-[#4CAF50]' : 'text-[#F44336]'}`}>
                    {tx.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function GroSupplyMockup() {
  return (
    <div className="relative w-[400px] h-[280px] bg-[#F5F5F5] rounded-xl p-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1565C0] rounded-lg flex items-center justify-center">
            <Truck className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#1A1A1A]">GroSupply</span>
            <p className="text-[8px] text-[#757575]">B2B Marketplace</p>
          </div>
        </div>
        <Badge className="bg-[#E3F2FD] text-[#1565C0] text-[8px]">3 Active Orders</Badge>
      </div>
      
      {/* Search */}
      <div className="bg-white rounded-lg p-2 mb-3 flex items-center gap-2">
        <div className="w-4 h-4 text-[#757575]" />
        <span className="text-[10px] text-[#9E9E9E]">Search suppliers, products...</span>
      </div>
      
      {/* Categories */}
      <div className="flex gap-2 mb-3">
        {['FMCG', 'Liquor', 'Pharmacy', 'Hardware'].map((cat, i) => (
          <Badge key={i} variant="outline" className="text-[8px]">{cat}</Badge>
        ))}
      </div>
      
      {/* Product Cards */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { name: 'Coca-Cola 2L', price: 'R18.50', supplier: 'AB InBev' },
          { name: 'Maize Meal 5kg', price: 'R45.00', supplier: 'Tiger Brands' },
          { name: 'Cooking Oil 2L', price: 'R62.00', supplier: 'Unilever' },
        ].map((product, i) => (
          <div key={i} className="bg-white rounded-lg p-2">
            <div className="w-full h-12 bg-[#F5F5F5] rounded mb-1" />
            <p className="text-[8px] font-medium text-[#1A1A1A] truncate">{product.name}</p>
            <p className="text-[10px] font-bold text-[#1565C0]">{product.price}</p>
            <p className="text-[6px] text-[#757575]">{product.supplier}</p>
          </div>
        ))}
      </div>
      
      {/* GroCredit Banner */}
      <div className="absolute bottom-4 left-4 right-4 bg-gradient-to-r from-[#7B1FA2] to-[#9C27B0] rounded-lg p-2 flex items-center justify-between">
        <div className="text-white">
          <p className="text-[10px] font-medium">GroCredit Available</p>
          <p className="text-[8px] text-white/70">R25,000 credit limit</p>
        </div>
        <Badge className="bg-white/20 text-white text-[8px]">Apply Now</Badge>
      </div>
    </div>
  )
}

function GroCreditMockup() {
  return (
    <div className="relative w-[380px] h-[260px] bg-gradient-to-br from-[#7B1FA2] to-[#4A148C] rounded-xl p-5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <div className="text-white">
            <span className="text-sm font-bold">GroCredit</span>
            <p className="text-[8px] text-white/70">Revolving Credit Facility</p>
          </div>
        </div>
        <Badge className="bg-white/20 text-white text-[8px]">Tier 2</Badge>
      </div>
      
      {/* Credit Limit Card */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-[10px] text-white/70">Available Credit</p>
            <p className="text-2xl font-bold text-white">R 25,000</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/70">Total Limit</p>
            <p className="text-sm font-medium text-white">R 50,000</p>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-white rounded-full" />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[8px] text-white/70">R 25,000 used</span>
          <span className="text-[8px] text-white/70">50% utilized</span>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white/10 rounded-lg p-2 text-center">
          <DollarSign className="h-4 w-4 text-white mx-auto mb-1" />
          <p className="text-[8px] text-white">Draw</p>
        </div>
        <div className="bg-white/10 rounded-lg p-2 text-center">
          <Calculator className="h-4 w-4 text-white mx-auto mb-1" />
          <p className="text-[8px] text-white">Calculator</p>
        </div>
        <div className="bg-white/10 rounded-lg p-2 text-center">
          <FileText className="h-4 w-4 text-white mx-auto mb-1" />
          <p className="text-[8px] text-white">Statements</p>
        </div>
      </div>
    </div>
  )
}

function GoPayMockup() {
  return (
    <div className="relative w-[400px] h-[260px] bg-[#F5F5F5] rounded-xl p-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#E65100] rounded-lg flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#1A1A1A]">GoPay Gateway</span>
            <p className="text-[8px] text-[#757575]">Payment Processing</p>
          </div>
        </div>
        <Badge className="bg-[#FFF3E0] text-[#E65100] text-[8px]">Live</Badge>
      </div>
      
      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[
          { label: 'Today', value: 'R1.2M' },
          { label: 'Transactions', value: '8,432' },
          { label: 'Success Rate', value: '99.8%' },
          { label: 'Avg Time', value: '1.2s' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-lg p-2 text-center">
            <p className="text-[10px] font-bold text-[#1A1A1A]">{stat.value}</p>
            <p className="text-[6px] text-[#757575]">{stat.label}</p>
          </div>
        ))}
      </div>
      
      {/* Payment Methods */}
      <p className="text-[10px] font-medium text-[#1A1A1A] mb-2">Payment Methods</p>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[
          { name: 'Card', icon: CreditCard },
          { name: 'PayShap', icon: Send },
          { name: 'EFT', icon: Building },
          { name: 'QR', icon: QrCode },
        ].map((method, i) => (
          <div key={i} className="bg-white rounded-lg p-2 flex flex-col items-center">
            <method.icon className="h-5 w-5 text-[#E65100] mb-1" />
            <span className="text-[8px] text-[#424242]">{method.name}</span>
          </div>
        ))}
      </div>
      
      {/* Recent Transactions */}
      <div className="bg-white rounded-lg p-2">
        <p className="text-[8px] font-medium text-[#1A1A1A] mb-1">Recent Transactions</p>
        <div className="space-y-1">
          {[
            { id: 'TXN-8421', amount: 'R 2,450.00', status: 'Success' },
            { id: 'TXN-8420', amount: 'R 890.00', status: 'Success' },
          ].map((tx, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-[8px] text-[#424242]">{tx.id}</span>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-medium">{tx.amount}</span>
                <Badge className="bg-[#E8F5E9] text-[#4CAF50] text-[6px]">{tx.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AdminConsoleMockup() {
  return (
    <div className="relative w-[450px] h-[280px] bg-[#263238] rounded-xl overflow-hidden">
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-12 bg-[#1A1A1A] flex flex-col items-center py-3 gap-2">
          {[
            LayoutDashboard, Users, Shield, AlertTriangle, Settings, FileText
          ].map((Icon, i) => (
            <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center ${i === 0 ? 'bg-[#00897B]' : 'hover:bg-white/10'}`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
          ))}
        </div>
        
        {/* Main Content */}
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-white">Platform Dashboard</span>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-white/50" />
              <div className="w-6 h-6 rounded-full bg-[#00897B]" />
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { label: 'Merchants', value: '15,234', color: '#00897B' },
              { label: 'Users', value: '2.5M', color: '#4CAF50' },
              { label: 'Alerts', value: '12', color: '#FF9800' },
              { label: 'Revenue', value: 'R8.2M', color: '#2196F3' },
            ].map((stat, i) => (
              <div key={i} className="bg-[#37474F] rounded-lg p-2">
                <p className="text-[8px] text-white/70">{stat.label}</p>
                <p className="text-sm font-bold text-white">{stat.value}</p>
              </div>
            ))}
          </div>
          
          {/* Charts Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#37474F] rounded-lg p-3">
              <p className="text-[8px] text-white/70 mb-2">Transaction Volume</p>
              <div className="h-12 flex items-end gap-1">
                {[60, 80, 45, 90, 70, 85, 95].map((h, i) => (
                  <div key={i} className="flex-1 bg-[#00897B] rounded-t" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
            <div className="bg-[#37474F] rounded-lg p-3">
              <p className="text-[8px] text-white/70 mb-2">Alert Distribution</p>
              <div className="flex items-center justify-center h-12">
                <PieChart className="h-8 w-8 text-[#00897B]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AgentNetworkMockup() {
  return (
    <div className="relative w-[380px] h-[260px] bg-gradient-to-br from-[#00695C] to-[#004D40] rounded-xl p-5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Gift className="h-5 w-5 text-white" />
          </div>
          <div className="text-white">
            <span className="text-sm font-bold">Agent Network</span>
            <p className="text-[8px] text-white/70">5-Tier Commission System</p>
          </div>
        </div>
      </div>
      
      {/* Commission Card */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-3">
        <div className="flex justify-between items-center mb-2">
          <div>
            <p className="text-[10px] text-white/70">Your Earnings</p>
            <p className="text-xl font-bold text-white">R 12,450</p>
          </div>
          <Badge className="bg-[#4CAF50] text-white text-[10px]">Level 3 Agent</Badge>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="text-center">
            <p className="text-[10px] font-bold text-white">47</p>
            <p className="text-[6px] text-white/70">Referrals</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold text-white">15%</p>
            <p className="text-[6px] text-white/70">Commission</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold text-white">234</p>
            <p className="text-[6px] text-white/70">Network</p>
          </div>
        </div>
      </div>
      
      {/* Network Visualization */}
      <div className="flex items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#4CAF50]/50" />
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#4CAF50]/50" />
          <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#4CAF50]/50" />
          <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#4CAF50]/50" />
        </div>
      </div>
    </div>
  )
}
