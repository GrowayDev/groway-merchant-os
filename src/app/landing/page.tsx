'use client'

import Link from 'next/link'
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
  CheckCircle2,
  Menu,
  X,
  Send,
  User,
  Mail,
  Phone,
  MessageSquare,
  Building,
  Briefcase
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useState } from 'react'

// Business Verticals - Core Differentiator (Alipay-style minimal icons)
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

// Platform Applications
const applications = [
  {
    id: 'consumer-wallet',
    name: 'Consumer Wallet',
    tagline: 'Your Financial Life, One Tap Away',
    description: 'Pay, send, save, and grow your money with South Africa\'s most powerful mobile wallet.',
    icon: Wallet,
    features: ['QR Payments', 'P2P Transfers', 'Remittance', 'Bill Pay'],
    users: '2.5M+',
    cta: 'Download App',
  },
  {
    id: 'merchant-os',
    name: 'Merchant OS',
    tagline: 'One Platform. Every Business Type.',
    description: 'Multi-vertical Business OS with vertical-specific POS, inventory, accounting, and compliance.',
    icon: Store,
    features: ['Smart POS', 'Inventory', 'Accounting', 'Analytics'],
    users: '15K+',
    cta: 'Start Free Trial',
  },
  {
    id: 'grosupply',
    name: 'GroSupply',
    tagline: 'B2B Procurement, Simplified',
    description: 'Source stock from verified suppliers, get instant credit, and settle with one click.',
    icon: Truck,
    features: ['Supplier Network', 'GroCredit', 'GroSettle', '3-Way Match'],
    users: '5K+',
    cta: 'Join Marketplace',
  },
  {
    id: 'gopay',
    name: 'GoPay',
    tagline: 'Payments That Move At The Speed Of Business',
    description: 'Payment gateway processing cards, QR, EFT, and PayShap with PCI-DSS compliance.',
    icon: CreditCard,
    features: ['PayShap', 'Card Processing', 'Instant EFT', 'PCI-DSS'],
    users: '10M+ txns',
    cta: 'Integrate Now',
  },
  {
    id: 'admin-console',
    name: 'Admin Console',
    tagline: 'Platform Operations, Under Control',
    description: 'Monitor platform health, manage merchants, handle compliance, and detect fraud.',
    icon: Shield,
    features: ['Compliance', 'Fraud Detection', 'Analytics', 'Support'],
    users: 'Internal',
    cta: 'Learn More',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Scale Your Business Across Locations',
    description: 'Multi-branch management, consolidated reporting, and enterprise-grade controls.',
    icon: Building2,
    features: ['Multi-Branch', 'Consolidated Reports', 'RBAC', 'API Access'],
    users: '500+',
    cta: 'Contact Sales',
  }
]

// Platform Stats
const platformStats = [
  { label: 'API Endpoints', value: '528+', icon: Zap },
  { label: 'Microservices', value: '35', icon: TrendingUp },
  { label: 'Business Verticals', value: '12', icon: Store },
  { label: 'Countries', value: '6+', icon: Globe },
]

// Compliance badges
const complianceBadges = [
  { name: 'PCI-DSS Level 1', desc: 'Payment security' },
  { name: 'POPIA', desc: 'Data protection' },
  { name: 'SARB', desc: 'Banking regulation' },
  { name: 'NCR', desc: 'Credit compliance' },
]

// Enquiry types
const enquiryTypes = [
  { value: 'consumer', label: 'Consumer Sign Up', icon: User },
  { value: 'merchant', label: 'Merchant / Business', icon: Store },
  { value: 'enterprise', label: 'Enterprise Solution', icon: Building },
  { value: 'partnership', label: 'Partnership Enquiry', icon: Briefcase },
  { value: 'general', label: 'General Enquiry', icon: MessageSquare },
]

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    enquiryType: 'consumer',
    message: '',
    businessName: '',
    businessType: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSubmitStatus('success')
        setFormData({
          name: '',
          email: '',
          phone: '',
          enquiryType: 'consumer',
          message: '',
          businessName: '',
          businessType: ''
        })
      } else {
        setSubmitStatus('error')
      }
    } catch {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center">
              <img 
                src="/groway-logo.png" 
                alt="Groway" 
                className="h-8 sm:h-10 w-auto"
              />
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#platform" className="text-sm font-medium text-[#757575] hover:text-[#00897B] transition-colors">
                Platform
              </a>
              <a href="#verticals" className="text-sm font-medium text-[#757575] hover:text-[#00897B] transition-colors">
                Business Verticals
              </a>
              <a href="#applications" className="text-sm font-medium text-[#757575] hover:text-[#00897B] transition-colors">
                Applications
              </a>
              <a href="#downloads" className="text-sm font-medium text-[#757575] hover:text-[#00897B] transition-colors">
                Downloads
              </a>
              <a href="#contact" className="text-sm font-medium text-[#757575] hover:text-[#00897B] transition-colors">
                Contact
              </a>
            </div>
            
            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" className="text-[#1A1A1A] font-medium">
                Sign In
              </Button>
              <Button className="bg-[#00897B] hover:bg-[#00695C] text-white font-medium px-5">
                Get Started
              </Button>
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
            <a href="#platform" className="block text-sm font-medium text-[#757575] hover:text-[#00897B]">Platform</a>
            <a href="#verticals" className="block text-sm font-medium text-[#757575] hover:text-[#00897B]">Business Verticals</a>
            <a href="#applications" className="block text-sm font-medium text-[#757575] hover:text-[#00897B]">Applications</a>
            <a href="#downloads" className="block text-sm font-medium text-[#757575] hover:text-[#00897B]">Downloads</a>
            <a href="#contact" className="block text-sm font-medium text-[#757575] hover:text-[#00897B]">Contact</a>
            <div className="pt-4 border-t border-gray-200/50 flex gap-3">
              <Button variant="outline" className="flex-1">Sign In</Button>
              <Button className="flex-1 bg-[#00897B] hover:bg-[#00695C] text-white">Get Started</Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#00695C] via-[#00897B] to-[#4CAF50] pt-12 sm:pt-16 lg:pt-20 pb-20 sm:pb-28">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent" />
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-green-400/20 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <Sparkles className="h-3.5 w-3.5 text-green-300" />
              <span className="text-xs sm:text-sm font-medium text-white">Africa&apos;s Integrated Financial Operating System</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-5 tracking-tight leading-tight">
              One Superapp.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-green-200 to-white">
                Every Financial Need.
              </span>
            </h1>
            
            {/* Sub-headlines */}
            <div className="max-w-4xl mx-auto mb-8 space-y-3">
              <p className="text-lg sm:text-xl text-white font-medium">
                For Individuals: Your complete financial life in one app
              </p>
              <p className="text-base sm:text-lg text-teal-100/90 max-w-3xl mx-auto">
                For Businesses: <span className="font-semibold text-white">Multi-vertical Merchant OS</span> — 
                purpose-built for every business type, from Shisa Nyama to pharmacy.
              </p>
            </div>
            
            {/* Platform Highlights */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8">
              <Badge className="bg-white/10 text-white border-white/20 px-3 py-1 text-xs sm:text-sm">
                <Smartphone className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5" />
                Mobile-First
              </Badge>
              <Badge className="bg-white/10 text-white border-white/20 px-3 py-1 text-xs sm:text-sm">
                <Globe className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5" />
                Any Screen
              </Badge>
              <Badge className="bg-white/10 text-white border-white/20 px-3 py-1 text-xs sm:text-sm">
                <Store className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5" />
                12 Verticals
              </Badge>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-[#00897B] hover:bg-teal-50 font-semibold px-6 py-5 text-base shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <Smartphone className="mr-2 h-4 w-4" />
                Download Consumer App
              </Button>
              <Button 
                size="lg" 
                className="bg-[#E0F2F1] text-[#00695C] hover:bg-white font-semibold px-6 py-5 text-base shadow-lg transition-all duration-300"
              >
                <Store className="mr-2 h-4 w-4" />
                Start Merchant Trial
              </Button>
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

      {/* Platform Stats */}
      <section id="platform" className="py-10 sm:py-14 bg-[#FAFAFA] border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-8">
            {platformStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#E0F2F1] text-[#00897B] mb-2">
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-0.5">
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

      {/* Multi-Vertical Section */}
      <section id="verticals" className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B] bg-[#E0F2F1] text-xs">
              <Store className="h-3 w-3 mr-1" />
              The Groway Difference
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1A1A1A] mb-3">
              One Platform. <span className="text-[#00897B]">Every Business Type.</span>
            </h2>
            <p className="text-sm sm:text-base text-[#757575] max-w-3xl mx-auto">
              A restaurant and a Shisa Nyama are legally, operationally, and culturally different businesses. 
              Groway understands this — each vertical gets its own POS layout, SKU catalogue, compliance rules, 
              and chart of accounts.
            </p>
          </div>

          {/* Verticals Grid - Alipay-style minimal icons */}
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 mb-10">
            {businessVerticals.map((vertical, index) => (
              <div 
                key={index}
                className="group flex flex-col items-center text-center p-3 sm:p-4 rounded-lg bg-[#FAFAFA] hover:bg-white border border-gray-200 hover:border-[#00897B]/30 hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center mb-2 group-hover:bg-[#00897B] group-hover:text-white transition-colors">
                  <vertical.icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                </div>
                <h3 className="text-[10px] sm:text-xs font-medium text-[#1A1A1A] leading-tight">
                  {vertical.name}
                </h3>
                <p className="text-[10px] text-[#757575] mt-0.5">
                  {vertical.subCount} sub-types
                </p>
              </div>
            ))}
          </div>

          {/* What Gets Auto-Configured */}
          <div className="bg-gradient-to-br from-[#E0F2F1] to-[#E8F5E9] rounded-xl p-5 sm:p-8">
            <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A] mb-4 text-center">
              What Groway Auto-Configures Per Vertical
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
              {[
                'Chart of Accounts',
                'SKU Catalogue',
                'Compliance Overlays',
                'VAT Treatment',
                'POS Screen Layout',
                'Digital Menu',
                'Geo-Discovery Tags',
                'Loyalty Categories',
                'Supplier Catalogue',
                'VAS Tiles',
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-1.5 bg-white rounded-lg px-3 py-2 shadow-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#00897B] flex-shrink-0" />
                  <span className="text-xs text-[#1A1A1A]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Applications Grid */}
      <section id="applications" className="py-12 sm:py-20 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B] bg-[#E0F2F1] text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Superapp Platform
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-3">
              Six Applications. One Ecosystem.
            </h2>
            <p className="text-sm sm:text-base text-[#757575] max-w-2xl mx-auto">
              Each product works seamlessly together, creating an ecosystem that empowers 
              consumers, merchants, and enterprises across Africa.
            </p>
          </div>
          
          {/* Products Grid - Alipay-style minimal icons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {applications.map((app) => (
              <Link key={app.id} href={`/${app.id}`}>
                <Card 
                  className="group relative overflow-hidden bg-white border border-gray-200 hover:border-[#00897B]/30 hover:shadow-lg transition-all duration-300 cursor-pointer h-full"
                >
                  <CardContent className="p-5 sm:p-6">
                    {/* Icon - Smaller, Alipay-style */}
                    <div className="w-10 h-10 mb-4 bg-[#E0F2F1] text-[#00897B] rounded-lg flex items-center justify-center group-hover:bg-[#00897B] group-hover:text-white transition-colors">
                      <app.icon className="h-5 w-5" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex items-start justify-between mb-1.5">
                      <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A]">
                        {app.name}
                      </h3>
                      <Badge variant="secondary" className="text-[10px] bg-[#F5F5F5]">
                        {app.users}
                      </Badge>
                    </div>
                    
                    <p className="text-xs sm:text-sm font-medium text-[#00897B] mb-2">
                      {app.tagline}
                    </p>
                    
                    <p className="text-xs text-[#757575] mb-3 leading-relaxed">
                      {app.description}
                    </p>
                    
                    {/* Features */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {app.features.map((feature, idx) => (
                        <span 
                          key={idx}
                          className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-[#F5F5F5] text-[#757575] border border-gray-200"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                    
                    {/* CTA */}
                    <div className="flex items-center text-xs font-semibold text-[#00897B] group-hover:text-[#00695C] transition-colors">
                      <span>{app.cta}</span>
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* For Individuals vs For Businesses */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-3">
              Built for Everyone
            </h2>
            <p className="text-sm sm:text-base text-[#757575] max-w-2xl mx-auto">
              Whether you&apos;re managing your personal finances or running a business, 
              Groway has you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* For Individuals */}
            <div className="relative bg-gradient-to-br from-[#00897B] to-[#4CAF50] rounded-xl p-6 sm:p-8 text-white overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold">For Individuals</h3>
                </div>
                <p className="text-sm sm:text-base text-teal-100 mb-4">
                  Your complete financial life in one superapp — pay, send, save, and grow your money.
                </p>
                <ul className="space-y-2 mb-6">
                  {[
                    'QR Payments at any Groway merchant',
                    'P2P Transfers to friends and family',
                    'Remittance across borders',
                    'Bill Pay & Prepaid Services',
                    'Savings Goals & Investment',
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-300 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button className="bg-white text-[#00897B] hover:bg-teal-50 font-medium px-5 text-sm">
                  Download the App
                </Button>
              </div>
            </div>

            {/* For Businesses */}
            <div className="relative bg-gradient-to-br from-[#1A1A1A] to-[#2D2D2D] rounded-xl p-6 sm:p-8 text-white overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-[#00897B]/30 rounded-lg flex items-center justify-center">
                    <Store className="h-4 w-4 text-[#4CAF50]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold">For Businesses</h3>
                </div>
                <p className="text-sm sm:text-base text-gray-300 mb-4">
                  Multi-vertical Business OS — purpose-built for every business type in South Africa.
                </p>
                <ul className="space-y-2 mb-6">
                  {[
                    'Vertical-specific POS layouts',
                    'Pre-loaded SKU catalogues',
                    'Built-in Accounting & ERP',
                    'QR Digital Menu & Geo-Discovery',
                    'GroSupply B2B Procurement',
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#4CAF50] flex-shrink-0" />
                      <span className="text-xs sm:text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button className="bg-[#00897B] text-white hover:bg-[#00695C] font-medium px-5 text-sm">
                  Start Free Trial
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" className="py-12 sm:py-20 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Contact Info */}
            <div>
              <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B] bg-[#E0F2F1] text-xs">
                <Mail className="h-3 w-3 mr-1" />
                Get in Touch
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-4">
                Let&apos;s Start Your Journey
              </h2>
              <p className="text-sm sm:text-base text-[#757575] mb-8">
                Whether you&apos;re an individual looking to take control of your finances, 
                a business owner ready to streamline operations, or an enterprise seeking 
                scalable solutions — we&apos;re here to help.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center flex-shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#1A1A1A]">Email Us</h4>
                    <p className="text-sm text-[#757575]">info@groway.co.za</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#1A1A1A]">Call Us</h4>
                    <p className="text-sm text-[#757575]">+27 (0) 11 123 4567</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center flex-shrink-0">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#1A1A1A]">Coverage</h4>
                    <p className="text-sm text-[#757575]">South Africa & 6+ African countries</p>
                  </div>
                </div>
              </div>

              {/* Response Time */}
              <div className="mt-8 p-4 rounded-lg bg-white border border-gray-200">
                <p className="text-xs text-[#757575]">
                  <span className="font-medium text-[#00897B]">Response Time:</span> We typically respond within 24-48 hours during business days.
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-8 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Enquiry Type */}
                <div>
                  <Label className="text-sm font-medium text-[#1A1A1A] mb-2 block">
                    I&apos;m interested in...
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {enquiryTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, enquiryType: type.value }))}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          formData.enquiryType === type.value
                            ? 'bg-[#00897B] text-white'
                            : 'bg-[#F5F5F5] text-[#757575] hover:bg-[#E0F2F1] hover:text-[#00897B]'
                        }`}
                      >
                        <type.icon className="h-3.5 w-3.5" />
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name & Email */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-[#1A1A1A] mb-1.5 block">
                      Full Name *
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Your name"
                      required
                      className="h-10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-[#1A1A1A] mb-1.5 block">
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your@email.com"
                      required
                      className="h-10"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-[#1A1A1A] mb-1.5 block">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+27 00 000 0000"
                    className="h-10"
                  />
                </div>

                {/* Business Fields - Show for merchant/enterprise */}
                {(formData.enquiryType === 'merchant' || formData.enquiryType === 'enterprise') && (
                  <div className="grid sm:grid-cols-2 gap-4 p-3 bg-[#F5F5F5] rounded-lg">
                    <div>
                      <Label htmlFor="businessName" className="text-xs font-medium text-[#1A1A1A] mb-1 block">
                        Business Name
                      </Label>
                      <Input
                        id="businessName"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleInputChange}
                        placeholder="Your business name"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="businessType" className="text-xs font-medium text-[#1A1A1A] mb-1 block">
                        Business Type
                      </Label>
                      <select
                        id="businessType"
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleInputChange}
                        className="w-full h-9 px-3 rounded-md border border-gray-300 text-sm bg-white"
                      >
                        <option value="">Select type...</option>
                        {businessVerticals.map(v => (
                          <option key={v.name} value={v.name}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Message */}
                <div>
                  <Label htmlFor="message" className="text-sm font-medium text-[#1A1A1A] mb-1.5 block">
                    Message *
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell us how we can help..."
                    required
                    rows={4}
                    className="resize-none"
                  />
                </div>

                {/* Status Messages */}
                {submitStatus === 'success' && (
                  <div className="p-3 rounded-lg bg-[#E8F5E9] border border-[#4CAF50]/30">
                    <p className="text-sm text-[#2E7D32] font-medium">
                      ✓ Thank you! Your enquiry has been submitted. We&apos;ll be in touch soon.
                    </p>
                  </div>
                )}
                {submitStatus === 'error' && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm text-red-600 font-medium">
                      ✕ Something went wrong. Please try again or email us directly.
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#00897B] hover:bg-[#00695C] text-white font-medium py-5"
                >
                  {isSubmitting ? (
                    <>Sending...</>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Enquiry
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Downloads Section */}
      <section id="downloads" className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B] bg-[#E0F2F1] text-xs">
              <Briefcase className="h-3 w-3 mr-1" />
              Resources
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-3">
              Project Documents & Downloads
            </h2>
            <p className="text-sm sm:text-base text-[#757575] max-w-2xl mx-auto">
              Access the full Groway project documentation, specifications, and source code backup.
            </p>
          </div>

          {/* Downloads Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {/* Master Build Document */}
            <a href="/downloads/Groway_Master_Build_Document.docx" download className="group flex items-start gap-4 p-4 rounded-xl bg-[#FAFAFA] hover:bg-white border border-gray-200 hover:border-[#00897B]/30 hover:shadow-md transition-all duration-200">
              <div className="w-10 h-10 rounded-lg bg-[#00897B]/10 text-[#00897B] flex items-center justify-center flex-shrink-0 group-hover:bg-[#00897B] group-hover:text-white transition-colors">
                <Briefcase className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">Master Build Document</h3>
                <p className="text-xs text-[#757575] mb-2">Complete platform specification & architecture</p>
                <span className="text-xs text-[#00897B] font-medium">DOCX • 82 KB</span>
              </div>
            </a>

            {/* Brand Guide */}
            <a href="/downloads/Groway_Brand_Guide_v3.pdf" download className="group flex items-start gap-4 p-4 rounded-xl bg-[#FAFAFA] hover:bg-white border border-gray-200 hover:border-[#00897B]/30 hover:shadow-md transition-all duration-200">
              <div className="w-10 h-10 rounded-lg bg-[#00897B]/10 text-[#00897B] flex items-center justify-center flex-shrink-0 group-hover:bg-[#00897B] group-hover:text-white transition-colors">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">Brand Guide v3</h3>
                <p className="text-xs text-[#757575] mb-2">Visual identity, colors, typography & guidelines</p>
                <span className="text-xs text-[#00897B] font-medium">PDF • 1.8 MB</span>
              </div>
            </a>

            {/* MultiVertical POS Spec */}
            <a href="/downloads/Groway_MultiVertical_POS_Spec.docx" download className="group flex items-start gap-4 p-4 rounded-xl bg-[#FAFAFA] hover:bg-white border border-gray-200 hover:border-[#00897B]/30 hover:shadow-md transition-all duration-200">
              <div className="w-10 h-10 rounded-lg bg-[#00897B]/10 text-[#00897B] flex items-center justify-center flex-shrink-0 group-hover:bg-[#00897B] group-hover:text-white transition-colors">
                <Store className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">Multi-Vertical POS Spec</h3>
                <p className="text-xs text-[#757575] mb-2">12 verticals, 47 sub-verticals, 3,930+ SKUs</p>
                <span className="text-xs text-[#00897B] font-medium">DOCX • 71 KB</span>
              </div>
            </a>

            {/* Payment Gateway */}
            <a href="/downloads/Groway_PaymentGateway.docx" download className="group flex items-start gap-4 p-4 rounded-xl bg-[#FAFAFA] hover:bg-white border border-gray-200 hover:border-[#00897B]/30 hover:shadow-md transition-all duration-200">
              <div className="w-10 h-10 rounded-lg bg-[#00897B]/10 text-[#00897B] flex items-center justify-center flex-shrink-0 group-hover:bg-[#00897B] group-hover:text-white transition-colors">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">Payment Gateway Spec</h3>
                <p className="text-xs text-[#757575] mb-2">GoPay, PayShap, QR, EFT integration</p>
                <span className="text-xs text-[#00897B] font-medium">DOCX • 36 KB</span>
              </div>
            </a>

            {/* Inventory Management */}
            <a href="/downloads/Groway_Inventory_Management.docx" download className="group flex items-start gap-4 p-4 rounded-xl bg-[#FAFAFA] hover:bg-white border border-gray-200 hover:border-[#00897B]/30 hover:shadow-md transition-all duration-200">
              <div className="w-10 h-10 rounded-lg bg-[#00897B]/10 text-[#00897B] flex items-center justify-center flex-shrink-0 group-hover:bg-[#00897B] group-hover:text-white transition-colors">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">Inventory Management</h3>
                <p className="text-xs text-[#757575] mb-2">Stock control, suppliers, warehouse logic</p>
                <span className="text-xs text-[#00897B] font-medium">DOCX • 92 KB</span>
              </div>
            </a>

            {/* Gift Card Strategy */}
            <a href="/downloads/Groway_Gift_Card_Strategy_Report_Feb2026.docx" download className="group flex items-start gap-4 p-4 rounded-xl bg-[#FAFAFA] hover:bg-white border border-gray-200 hover:border-[#00897B]/30 hover:shadow-md transition-all duration-200">
              <div className="w-10 h-10 rounded-lg bg-[#00897B]/10 text-[#00897B] flex items-center justify-center flex-shrink-0 group-hover:bg-[#00897B] group-hover:text-white transition-colors">
                <Wallet className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">Gift Card Strategy</h3>
                <p className="text-xs text-[#757575] mb-2">Digital gift cards, loyalty integration</p>
                <span className="text-xs text-[#00897B] font-medium">DOCX • 27 KB</span>
              </div>
            </a>

            {/* UX Improvement Report */}
            <a href="/downloads/Groway_UX_Improvement_Report.docx" download className="group flex items-start gap-4 p-4 rounded-xl bg-[#FAFAFA] hover:bg-white border border-gray-200 hover:border-[#00897B]/30 hover:shadow-md transition-all duration-200">
              <div className="w-10 h-10 rounded-lg bg-[#00897B]/10 text-[#00897B] flex items-center justify-center flex-shrink-0 group-hover:bg-[#00897B] group-hover:text-white transition-colors">
                <Smartphone className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">UX Improvement Report</h3>
                <p className="text-xs text-[#757575] mb-2">Mobile-first design, Alipay-inspired UI</p>
                <span className="text-xs text-[#00897B] font-medium">DOCX • 26 KB</span>
              </div>
            </a>

            {/* GroSupply Spec */}
            <a href="/downloads/GroSupply_Standalone_Spec_v4.0.docx" download className="group flex items-start gap-4 p-4 rounded-xl bg-[#FAFAFA] hover:bg-white border border-gray-200 hover:border-[#00897B]/30 hover:shadow-md transition-all duration-200">
              <div className="w-10 h-10 rounded-lg bg-[#00897B]/10 text-[#00897B] flex items-center justify-center flex-shrink-0 group-hover:bg-[#00897B] group-hover:text-white transition-colors">
                <Truck className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">GroSupply B2B Spec</h3>
                <p className="text-xs text-[#757575] mb-2">B2B marketplace, GroCredit, procurement</p>
                <span className="text-xs text-[#00897B] font-medium">DOCX • 25 KB</span>
              </div>
            </a>

            {/* Source Code Backup - Latest */}
            <a href="/downloads/groway_source_backup_20260309.tar.gz" download className="group flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-[#00897B]/10 to-[#4CAF50]/10 hover:from-[#00897B]/20 hover:to-[#4CAF50]/20 border-2 border-[#00897B]/30 hover:border-[#00897B] hover:shadow-lg transition-all duration-200">
              <div className="w-10 h-10 rounded-lg bg-[#00897B] text-white flex items-center justify-center flex-shrink-0">
                <Zap className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-[#1A1A1A]">Source Code Backup</h3>
                  <Badge className="bg-[#4CAF50] text-white text-[10px] px-1.5 py-0.5">LATEST</Badge>
                </div>
                <p className="text-xs text-[#757575] mb-2">Full CRUD: Floor Plan, Kitchen Display, Recipe Engine • Mar 9, 2026</p>
                <span className="text-xs text-[#00897B] font-medium">TAR.GZ • 403 KB</span>
              </div>
            </a>

            {/* Previous Source Code Backup */}
            <a href="/downloads/backup_20260309_054457.tar.gz" download className="group flex items-start gap-4 p-4 rounded-xl bg-[#FAFAFA] hover:bg-white border border-gray-200 hover:border-[#00897B]/30 hover:shadow-md transition-all duration-200">
              <div className="w-10 h-10 rounded-lg bg-[#00897B]/10 text-[#00897B] flex items-center justify-center flex-shrink-0 group-hover:bg-[#00897B] group-hover:text-white transition-colors">
                <Zap className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">Source Code (Previous)</h3>
                <p className="text-xs text-[#757575] mb-2">Initial backup • Mar 9, 2026 05:44</p>
                <span className="text-xs text-[#00897B] font-medium">TAR.GZ • 3.3 MB</span>
              </div>
            </a>
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
                Ready to Grow?
              </h2>
              <p className="text-sm sm:text-base text-teal-100 mb-6 max-w-2xl mx-auto">
                Join millions of South Africans who are already using Groway 
                to pay, save, and grow their businesses.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  size="lg" 
                  className="bg-white text-[#00897B] hover:bg-teal-50 font-medium px-6 py-5 shadow-lg"
                >
                  <Smartphone className="mr-2 h-4 w-4" />
                  Download Consumer App
                </Button>
                <Button 
                  size="lg" 
                  className="bg-[#E0F2F1] text-[#00695C] hover:bg-white font-medium px-6 py-5 shadow-lg"
                >
                  <Store className="mr-2 h-4 w-4" />
                  Start Merchant Trial
                </Button>
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
                <img 
                  src="/groway-logo.png" 
                  alt="Groway" 
                  className="h-7 w-auto"
                />
                <span className="text-xs text-[#757575]">
                  © 2026 Groway. All rights reserved.
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
