'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { 
  Wallet, 
  Store, 
  Truck, 
  ArrowRight,
  Smartphone,
  Globe,
  Users,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Menu,
  X,
  Mail,
  Send,
  Phone,
  MessageSquare,
  Building,
  Briefcase,
  BarChart3,
  PiggyBank,
  Download,
  ChevronLeft,
  ChevronRight,
  QrCode,
  Ticket,
  Monitor,
  Package,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useState, useEffect, useCallback } from 'react'
import { 
  businessVerticals, 
  applications, 
  growthPrograms, 
  platformStats, 
  complianceBadges, 
  enquiryTypes 
} from './components/LandingData'

// Dynamically import the heavy PhoneMockup component with ssr: false
const PhoneMockup = dynamic(() => import('./components/PhoneMockups').then(m => ({ default: m.PhoneMockup })), { ssr: false })

export default function GrowayLandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeAppIndex, setActiveAppIndex] = useState(0)
  const [showDeployButton, setShowDeployButton] = useState(true)
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

  // Check if deploy button was already clicked (persists across refresh)
  useEffect(() => {
    const deployDownloaded = localStorage.getItem('groway_deploy_downloaded')
    if (deployDownloaded === 'true') {
      setShowDeployButton(false)
    }
  }, [])

  // Handle deploy button click - hide and remember
  const handleDeployClick = () => {
    localStorage.setItem('groway_deploy_downloaded', 'true')
    setShowDeployButton(false)
  }

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

  const nextApp = useCallback(() => {
    setActiveAppIndex((prev) => (prev + 1) % applications.length)
  }, [])

  const prevApp = useCallback(() => {
    setActiveAppIndex((prev) => (prev - 1 + applications.length) % applications.length)
  }, [])

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
              <a href="#growth" className="text-sm font-medium text-[#757575] hover:text-[#00897B] transition-colors">
                Growth
              </a>
              <a href="#contact" className="text-sm font-medium text-[#757575] hover:text-[#00897B] transition-colors">
                Contact
              </a>
            </div>
            
            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/enterprise/portal">
                <Button variant="ghost" className="text-[#1A1A1A] font-medium">
                  Enterprise Portal
                </Button>
              </Link>
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
            <a href="#growth" className="block text-sm font-medium text-[#757575] hover:text-[#00897B]">Growth</a>
            <a href="#contact" className="block text-sm font-medium text-[#757575] hover:text-[#00897B]">Contact</a>
            <div className="pt-4 border-t border-gray-200/50 flex gap-3">
              <Link href="/enterprise/portal" className="flex-1">
                <Button variant="outline" className="w-full">Enterprise Portal</Button>
              </Link>
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#004D40]/80 backdrop-blur-sm border border-white/30 mb-6 shadow-lg">
              <Sparkles className="h-4 w-4 text-emerald-300" />
              <span className="text-sm sm:text-base font-semibold text-white drop-shadow-sm">Africa&apos;s Integrated Financial Operating System</span>
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
            <div className="max-w-4xl mx-auto mb-8 space-y-4">
              <p className="text-xl sm:text-2xl text-white font-semibold drop-shadow-md">
                For Individuals: Your complete financial life in one app
              </p>
              <p className="text-base sm:text-lg text-white max-w-3xl mx-auto leading-relaxed drop-shadow-sm">
                For Businesses: <span className="font-bold text-emerald-200">Multi-vertical Merchant OS</span> — 
                purpose-built for every business type, from Shisa Nyama to pharmacy.
              </p>
            </div>
            
            {/* Platform Highlights */}
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#004D40]/90 backdrop-blur-sm border border-white/30 shadow-md">
                <Smartphone className="h-4 w-4 text-emerald-300" />
                <span className="text-sm font-semibold text-white">Mobile-First</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#004D40]/90 backdrop-blur-sm border border-white/30 shadow-md">
                <Globe className="h-4 w-4 text-emerald-300" />
                <span className="text-sm font-semibold text-white">Any Screen</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#004D40]/90 backdrop-blur-sm border border-white/30 shadow-md">
                <Store className="h-4 w-4 text-emerald-300" />
                <span className="text-sm font-semibold text-white">12 Verticals</span>
              </div>
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
              {showDeployButton && (
                <a
                  href="/groway-netlify-deploy.zip"
                  download
                  onClick={handleDeployClick}
                >
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 font-semibold px-6 py-5 text-base shadow-lg transition-all duration-300"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Deploy to Netlify
                  </Button>
                </a>
              )}
              <a
                href="/api/download"
                download
              >
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-amber-400/50 text-amber-200 hover:bg-amber-500/20 font-semibold px-6 py-5 text-base shadow-lg transition-all duration-300"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Pitch Deck
                </Button>
              </a>
            </div>
            
            {/* Trust Badges */}
            <div className="mt-10 flex flex-wrap justify-center gap-3 sm:gap-4">
              {complianceBadges.map((badge, index) => (
                <div key={index} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#004D40]/70 backdrop-blur-sm border border-white/25 shadow-md">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  <span className="text-sm font-medium text-white drop-shadow-sm">{badge.name}</span>
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

      {/* Applications Grid with Phone Mockups */}
      <section id="applications" className="py-12 sm:py-20 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B] bg-[#E0F2F1] text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Superapp Platform
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-3">
              Nine Applications. One Ecosystem.
            </h2>
            <p className="text-sm sm:text-base text-[#757575] max-w-2xl mx-auto">
              Each product works seamlessly together, creating an ecosystem that empowers 
              consumers, merchants, and enterprises across Africa.
            </p>
          </div>
          
          {/* Featured App with Phone Mockup */}
          <div className="mb-16">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="grid lg:grid-cols-2 gap-8 p-6 lg:p-8">
                {/* Phone Mockup */}
                <div className="flex items-center justify-center py-8 order-2 lg:order-1">
                  <div className="relative">
                    <PhoneMockup app={applications[activeAppIndex]} isActive={true} />
                    
                    {/* Navigation Arrows */}
                    <button 
                      onClick={prevApp}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors hidden lg:flex"
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <button 
                      onClick={nextApp}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors hidden lg:flex"
                    >
                      <ChevronRight className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                </div>
                
                {/* App Info */}
                <div className="flex flex-col justify-center order-1 lg:order-2">
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${applications[activeAppIndex].color}20` }}
                    >
                      {(() => {
                        const IconComponent = applications[activeAppIndex].icon;
                        return <IconComponent className="h-6 w-6" style={{ color: applications[activeAppIndex].color }} />;
                      })()}
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-[#1A1A1A]">
                        {applications[activeAppIndex].name}
                      </h3>
                      <p className="text-sm text-[#00897B] font-medium">
                        {applications[activeAppIndex].tagline}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-[#757575] mb-6 leading-relaxed">
                    {applications[activeAppIndex].description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {applications[activeAppIndex].features.map((feature, idx) => (
                      <span 
                        key={idx}
                        className="text-xs px-3 py-1.5 rounded-full bg-[#F5F5F5] text-[#757575] border border-gray-200"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href={`/${applications[activeAppIndex].id}`}>
                      <Button 
                        className="font-semibold px-6 text-white"
                        style={{ backgroundColor: applications[activeAppIndex].color }}
                      >
                        {applications[activeAppIndex].cta}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/${applications[activeAppIndex].id}/app`}>
                      <Button variant="outline" className="font-semibold px-6">
                        Open App
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            
            {/* App Selector Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {applications.map((app, idx) => (
                <button
                  key={app.id}
                  onClick={() => setActiveAppIndex(idx)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    activeAppIndex === idx 
                      ? 'w-8' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  style={{ backgroundColor: activeAppIndex === idx ? app.color : undefined }}
                />
              ))}
            </div>
          </div>
          
          {/* All Apps Grid - Premium Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {applications.map((app) => (
              <Link key={app.id} href={`/${app.id}`}>
                <Card 
                  className="group relative overflow-hidden bg-white border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-500 cursor-pointer h-full"
                >
                  {/* Gradient overlay on hover */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `linear-gradient(135deg, ${app.color}08 0%, ${app.color}15 100%)` }}
                  />
                  
                  <CardContent className="relative p-5 sm:p-6">
                    {/* Header with Icon and User Count */}
                    <div className="flex items-start justify-between mb-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110"
                        style={{ backgroundColor: app.color, boxShadow: `0 4px 20px ${app.color}40` }}
                      >
                        <app.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100">
                        <Users className="h-3 w-3 text-[#00897B]" />
                        <span className="text-xs font-semibold text-gray-700">{app.users}</span>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-lg sm:text-xl font-bold text-[#1A1A1A] mb-1.5">
                      {app.name}
                    </h3>
                    
                    <p className="text-sm font-semibold mb-2" style={{ color: app.color }}>
                      {app.tagline}
                    </p>
                    
                    <p className="text-sm text-[#616161] mb-4 leading-relaxed line-clamp-2">
                      {app.description}
                    </p>
                    
                    {/* Features */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {app.features.map((feature, idx) => (
                        <span 
                          key={idx}
                          className="text-xs px-2.5 py-1 rounded-full font-medium transition-colors"
                          style={{ backgroundColor: `${app.color}12`, color: app.color }}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                    
                    {/* CTA */}
                    <div 
                      className="flex items-center gap-2 text-sm font-bold transition-all duration-300 group-hover:gap-3"
                      style={{ color: app.color }}
                    >
                      <span>{app.cta}</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Growth Programs Section */}
      <section id="growth" className="py-16 sm:py-24 bg-gradient-to-b from-white to-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#00897B]/10 to-[#4CAF50]/10 border border-[#00897B]/20 mb-6">
              <TrendingUp className="h-4 w-4 text-[#00897B]" />
              <span className="text-sm font-semibold text-[#00897B]">Grow With Us</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-4">
              Growth Programs
            </h2>
            <p className="text-base sm:text-lg text-[#616161] max-w-3xl mx-auto leading-relaxed">
              Join our network and earn by helping businesses grow. Whether you&apos;re a merchant 
              referring friends or a professional sales agent, there&apos;s an opportunity for you.
            </p>
          </div>
          
          {/* Programs Grid - Premium Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {growthPrograms.map((program, index) => (
              <Link key={program.id} href={`/${program.id}`}>
                <Card 
                  className="group relative overflow-hidden bg-white border border-gray-100 hover:border-[#00897B]/30 hover:shadow-2xl transition-all duration-500 cursor-pointer h-full"
                >
                  {/* Decorative gradient */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#00897B]/5 to-[#4CAF50]/10 rounded-full blur-3xl transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700" />
                  
                  <CardContent className="relative p-6 sm:p-8">
                    {/* Header with Icon and Badge */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-14 h-14 bg-gradient-to-br from-[#00897B] to-[#4CAF50] text-white rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        <program.icon className="h-7 w-7" />
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#E0F2F1] to-[#E8F5E9] border border-[#00897B]/20">
                        <Users className="h-3.5 w-3.5 text-[#00897B]" />
                        <span className="text-xs font-bold text-[#00897B]">{program.users} members</span>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] mb-2">
                      {program.name}
                    </h3>
                    
                    <p className="text-base font-semibold text-[#00897B] mb-3">
                      {program.tagline}
                    </p>
                    
                    <p className="text-sm text-[#616161] mb-5 leading-relaxed">
                      {program.description}
                    </p>
                    
                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {program.features.map((feature, idx) => (
                        <span 
                          key={idx}
                          className="text-xs px-3 py-1.5 rounded-full bg-[#E0F2F1] text-[#00897B] font-semibold border border-[#00897B]/10"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                    
                    {/* CTA Button */}
                    <div className="flex items-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-[#00897B] to-[#00695C] hover:from-[#00695C] hover:to-[#004D40] rounded-xl px-5 py-3 shadow-lg hover:shadow-xl transition-all duration-300 w-fit group-hover:gap-3">
                      <span>{program.cta}</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* For Individuals vs For Businesses */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1A1A1A]/5 border border-[#1A1A1A]/10 mb-6">
              <Users className="h-4 w-4 text-[#1A1A1A]" />
              <span className="text-sm font-semibold text-[#1A1A1A]">Built for Everyone</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-4">
              One Platform, Two Experiences
            </h2>
            <p className="text-base sm:text-lg text-[#616161] max-w-3xl mx-auto leading-relaxed">
              Whether you&apos;re managing your personal finances or running a business, 
              Groway has you covered with purpose-built experiences.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
            {/* For Individuals */}
            <div className="group relative bg-gradient-to-br from-[#00897B] via-[#00897B] to-[#4CAF50] rounded-2xl p-6 sm:p-8 text-white overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-20 -translate-y-20 group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-green-400/20 rounded-full blur-3xl transform -translate-x-16 translate-y-16" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                    <Wallet className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold">For Individuals</h3>
                    <p className="text-sm text-white/80">Consumer Superapp</p>
                  </div>
                </div>
                
                <p className="text-base sm:text-lg text-white/90 mb-6 leading-relaxed font-medium">
                  Your complete financial life in one superapp — pay, send, save, and grow your money.
                </p>
                
                <ul className="space-y-3 mb-8">
                  {[
                    { icon: QrCode, text: 'QR Payments at any Groway merchant' },
                    { icon: Send, text: 'P2P Transfers to friends and family' },
                    { icon: Globe, text: 'Remittance across borders' },
                    { icon: Ticket, text: 'Bill Pay & Prepaid Services' },
                    { icon: PiggyBank, text: 'Savings Goals & Investment' },
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2.5">
                      <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center flex-shrink-0">
                        <item.icon className="h-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-sm font-medium">{item.text}</span>
                    </li>
                  ))}
                </ul>
                
                <Button className="bg-white text-[#00897B] hover:bg-teal-50 font-bold px-6 py-3 text-base shadow-lg hover:shadow-xl transition-all">
                  <Smartphone className="mr-2 h-4 w-4" />
                  Download the App
                </Button>
              </div>
            </div>

            {/* For Businesses */}
            <div className="group relative bg-gradient-to-br from-[#1A1A1A] via-[#1A1A1A] to-[#2D2D2D] rounded-2xl p-6 sm:p-8 text-white overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#00897B]/20 rounded-full blur-3xl transform translate-x-20 -translate-y-20 group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#4CAF50]/10 rounded-full blur-3xl transform -translate-x-16 translate-y-16" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 bg-[#00897B]/30 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                    <Store className="h-6 w-6 text-[#4CAF50]" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold">For Businesses</h3>
                    <p className="text-sm text-gray-400">Merchant OS Platform</p>
                  </div>
                </div>
                
                <p className="text-base sm:text-lg text-gray-300 mb-6 leading-relaxed font-medium">
                  Multi-vertical Business OS — purpose-built for every business type in South Africa.
                </p>
                
                <ul className="space-y-3 mb-8">
                  {[
                    { icon: Monitor, text: 'Vertical-specific POS layouts' },
                    { icon: Package, text: 'Pre-loaded SKU catalogues' },
                    { icon: BarChart3, text: 'Built-in Accounting & ERP' },
                    { icon: QrCode, text: 'QR Digital Menu & Geo-Discovery' },
                    { icon: Truck, text: 'GroSupply B2B Procurement' },
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-lg px-4 py-2.5 border border-white/10">
                      <div className="w-6 h-6 bg-[#00897B]/30 rounded-md flex items-center justify-center flex-shrink-0">
                        <item.icon className="h-3.5 h-3.5 text-[#4CAF50]" />
                      </div>
                      <span className="text-sm font-medium text-gray-200">{item.text}</span>
                    </li>
                  ))}
                </ul>
                
                <Button className="bg-gradient-to-r from-[#00897B] to-[#00695C] text-white hover:from-[#00695C] hover:to-[#004D40] font-bold px-6 py-3 text-base shadow-lg hover:shadow-xl transition-all">
                  <Store className="mr-2 h-4 w-4" />
                  Start Free Trial
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" className="py-12 sm:py-20 bg-white">
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
                    <p className="text-sm text-[#757575]">W: +27 81 718 4013</p>
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
              <div className="mt-8 p-4 rounded-lg bg-[#FAFAFA] border border-gray-200">
                <p className="text-xs text-[#757575]">
                  <span className="font-medium text-[#00897B]">Response Time:</span> We typically respond within 24-48 hours during business days.
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-[#FAFAFA] rounded-xl border border-gray-200 p-5 sm:p-8 shadow-sm">
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
                            : 'bg-white text-[#757575] hover:bg-[#E0F2F1] hover:text-[#00897B]'
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
                      className="h-10 bg-white"
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
                      className="h-10 bg-white"
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
                    className="h-10 bg-white"
                  />
                </div>

                {/* Business Fields - Show for merchant/enterprise */}
                {(formData.enquiryType === 'merchant' || formData.enquiryType === 'enterprise') && (
                  <div className="grid sm:grid-cols-2 gap-4 p-3 bg-white rounded-lg">
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
                    className="resize-none bg-white"
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
                      ✗ Something went wrong. Please try again.
                    </p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-[#00897B] hover:bg-[#00695C] text-white font-medium py-5"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1A1A1A] text-white py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Platform */}
            <div>
              <h4 className="text-sm font-semibold mb-4">Platform</h4>
              <ul className="space-y-2">
                <li><a href="#platform" className="text-sm text-gray-400 hover:text-white transition-colors">Overview</a></li>
                <li><a href="#verticals" className="text-sm text-gray-400 hover:text-white transition-colors">Business Verticals</a></li>
                <li><a href="#applications" className="text-sm text-gray-400 hover:text-white transition-colors">Applications</a></li>
                <li><a href="#growth" className="text-sm text-gray-400 hover:text-white transition-colors">Growth Programs</a></li>
              </ul>
            </div>
            
            {/* Applications */}
            <div>
              <h4 className="text-sm font-semibold mb-4">Applications</h4>
              <ul className="space-y-2">
                <li><Link href="/consumer-wallet" className="text-sm text-gray-400 hover:text-white transition-colors">Consumer Wallet</Link></li>
                <li><Link href="/merchant-os" className="text-sm text-gray-400 hover:text-white transition-colors">Merchant OS</Link></li>
                <li><Link href="/grosell" className="text-sm text-gray-400 hover:text-white transition-colors">GroSell</Link></li>
                <li><Link href="/grosupply" className="text-sm text-gray-400 hover:text-white transition-colors">GroSupply</Link></li>
              </ul>
            </div>
            
            {/* More Apps */}
            <div>
              <h4 className="text-sm font-semibold mb-4">More</h4>
              <ul className="space-y-2">
                <li><Link href="/gopay" className="text-sm text-gray-400 hover:text-white transition-colors">GoPay</Link></li>
                <li><Link href="/enterprise" className="text-sm text-gray-400 hover:text-white transition-colors">Enterprise</Link></li>
                <li><Link href="/admin-console" className="text-sm text-gray-400 hover:text-white transition-colors">Admin Console</Link></li>
                <li><Link href="/salesforce" className="text-sm text-gray-400 hover:text-white transition-colors">Field Salesforce</Link></li>
              </ul>
            </div>
            
            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#contact" className="text-sm text-gray-400 hover:text-white transition-colors">Contact</a></li>
                <li><span className="text-sm text-gray-400">About</span></li>
                <li><span className="text-sm text-gray-400">Careers</span></li>
                <li><span className="text-sm text-gray-400">Privacy</span></li>
              </ul>
            </div>
            
            {/* Deploy */}
            {showDeployButton && (
              <div className="col-span-2 md:col-span-4 mt-4">
                <div className="bg-gradient-to-r from-[#00897B]/20 to-[#43A047]/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Deploy Groway on Netlify</h4>
                    <p className="text-xs text-gray-400 mt-1">Download the complete package and deploy your own instance</p>
                  </div>
                  <a
                    href="/groway-netlify-deploy.zip"
                    download
                    onClick={handleDeployClick}
                    className="shrink-0"
                  >
                    <Button className="bg-[#00897B] hover:bg-[#00695C] text-white font-medium px-4 py-2 text-sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download (7.5 MB)
                    </Button>
                  </a>
                </div>
              </div>
            )}
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img 
                src="/groway-logo.png" 
                alt="Groway" 
                className="h-6 w-auto"
              />
              <span className="text-sm text-gray-400">© {new Date().getFullYear()} Groway. All rights reserved.</span>
            </div>
            
            <div className="flex items-center gap-4">
              {complianceBadges.map((badge, index) => (
                <div key={index} className="flex items-center gap-1 text-xs text-gray-400">
                  <CheckCircle2 className="h-3 w-3 text-[#4CAF50]" />
                  <span>{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
