'use client'

import { 
  Building2,
  ArrowRight,
  ArrowLeft,
  Globe,
  Users,
  BarChart3,
  Key,
  Palette,
  Headphones,
  Package,
  ArrowLeftRight,
  Database,
  FileSpreadsheet,
  TrendingUp,
  Settings,
  Download,
  Shield,
  Workflow,
  Clock,
  DollarSign,
  CheckCircle2,
  Menu,
  X,
  Calendar,
  Phone,
  Mail
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

// Core Features
const coreFeatures = [
  {
    icon: Building2,
    title: 'Multi-Branch Management',
    description: 'Manage all locations from one unified dashboard with real-time visibility across your entire network.',
  },
  {
    icon: BarChart3,
    title: 'Consolidated Reporting',
    description: 'Aggregated financial reports across all branches with drill-down capabilities for detailed insights.',
  },
  {
    icon: Users,
    title: 'Role-Based Access',
    description: 'Granular permissions per user and branch. Control who sees what with flexible access controls.',
  },
  {
    icon: Key,
    title: 'API Access',
    description: 'Full REST API for seamless integrations with your existing systems and third-party applications.',
  },
  {
    icon: Palette,
    title: 'White-Label Options',
    description: 'Custom branding for your enterprise. Make the platform truly yours with personalized themes.',
  },
  {
    icon: Headphones,
    title: 'Dedicated Support',
    description: 'Priority support channels with dedicated account managers and 24/7 availability.',
  },
]

// Multi-Branch Capabilities
const multiBranchCapabilities = [
  {
    icon: Package,
    title: 'Central Inventory Management',
    description: 'Track and manage stock across all locations from a single dashboard.',
  },
  {
    icon: ArrowLeftRight,
    title: 'Inter-Branch Transfers',
    description: 'Seamlessly move inventory between locations with full audit trails.',
  },
  {
    icon: Database,
    title: 'Unified Customer Database',
    description: 'One customer view across all branches with consolidated transaction history.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Consolidated Accounting',
    description: 'Automated financial consolidation with multi-currency support.',
  },
  {
    icon: TrendingUp,
    title: 'Branch Performance Comparison',
    description: 'Benchmark and compare performance metrics across all locations.',
  },
]

// Enterprise Features
const enterpriseFeatures = [
  {
    icon: Settings,
    title: 'Custom Integrations',
    description: 'Connect with your ERP, CRM, and other business-critical systems.',
  },
  {
    icon: Download,
    title: 'Data Export/Import',
    description: 'Bulk data operations with support for multiple formats.',
  },
  {
    icon: Database,
    title: 'Bulk Operations',
    description: 'Execute changes across multiple branches simultaneously.',
  },
  {
    icon: Shield,
    title: 'SSO Integration',
    description: 'Single sign-on with SAML 2.0 and OAuth 2.0 support.',
  },
  {
    icon: Workflow,
    title: 'Custom Workflows',
    description: 'Automate business processes with configurable approval chains.',
  },
]

// ROI Metrics
const roiMetrics = [
  {
    icon: Clock,
    value: '80%',
    label: 'Time saved on reporting',
    description: 'Automated consolidation eliminates manual report creation',
  },
  {
    icon: Package,
    value: '25%',
    label: 'Inventory optimization',
    description: 'Better visibility reduces overstock and stockouts',
  },
  {
    icon: DollarSign,
    value: '40%',
    label: 'Reduced operational costs',
    description: 'Streamlined processes and eliminated redundancies',
  },
  {
    icon: CheckCircle2,
    value: '99%',
    label: 'Improved compliance',
    description: 'Standardized controls and automated audit trails',
  },
]

// Pricing Tiers
const pricingTiers = [
  {
    name: 'Growth',
    branches: '1-5 branches',
    description: 'Perfect for growing businesses expanding to multiple locations.',
    features: [
      'Multi-branch dashboard',
      'Basic consolidated reporting',
      'Standard API access',
      'Email support',
      'User management',
    ],
    highlight: false,
  },
  {
    name: 'Scale',
    branches: '6-20 branches',
    description: 'For established businesses with a regional presence.',
    features: [
      'Everything in Growth',
      'Advanced analytics',
      'Inter-branch transfers',
      'Priority support',
      'Custom integrations',
      'Role-based permissions',
    ],
    highlight: true,
  },
  {
    name: 'Enterprise',
    branches: '20+ branches',
    description: 'For large organizations with complex operations.',
    features: [
      'Everything in Scale',
      'White-label options',
      'Dedicated account manager',
      '24/7 premium support',
      'SSO integration',
      'Custom workflows',
      'SLA guarantee',
    ],
    highlight: false,
  },
]

export default function EnterprisePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <img 
                src="/groway-logo.png" 
                alt="Groway" 
                className="h-8 sm:h-10 w-auto"
              />
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-[#757575] hover:text-[#00897B] transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Home
              </Link>
              <a href="#features" className="text-sm font-medium text-[#757575] hover:text-[#00897B] transition-colors">
                Features
              </a>
              <a href="#capabilities" className="text-sm font-medium text-[#757575] hover:text-[#00897B] transition-colors">
                Capabilities
              </a>
              <a href="#pricing" className="text-sm font-medium text-[#757575] hover:text-[#00897B] transition-colors">
                Pricing
              </a>
            </div>
            
            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/enterprise/portal">
                <Button variant="ghost" className="text-[#1A1A1A] font-medium">
                  Sign In
                </Button>
              </Link>
              <Button className="bg-[#00897B] hover:bg-[#00695C] text-white font-medium px-5">
                Contact Sales
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
            <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-[#00897B]">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Home
            </Link>
            <a href="#features" className="block text-sm font-medium text-[#757575] hover:text-[#00897B]">Features</a>
            <a href="#capabilities" className="block text-sm font-medium text-[#757575] hover:text-[#00897B]">Capabilities</a>
            <a href="#pricing" className="block text-sm font-medium text-[#757575] hover:text-[#00897B]">Pricing</a>
            <div className="pt-4 border-t border-gray-200/50 flex gap-3">
              <Link href="/enterprise/portal" className="flex-1">
                <Button variant="outline" className="w-full">Sign In</Button>
              </Link>
              <Button className="flex-1 bg-[#00897B] hover:bg-[#00695C] text-white">Contact Sales</Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#00695C] via-[#00897B] to-[#4CAF50] pt-12 sm:pt-16 lg:pt-24 pb-16 sm:pb-24">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent" />
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-green-400/20 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <Building2 className="h-3.5 w-3.5 text-green-300" />
              <span className="text-xs sm:text-sm font-medium text-white">Enterprise-Grade Solutions</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-5 tracking-tight leading-tight">
              Scale Your Business
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-green-200 to-white">
                Across Locations
              </span>
            </h1>
            
            {/* Sub-headline */}
            <div className="max-w-3xl mx-auto mb-8">
              <p className="text-base sm:text-lg text-teal-100/90">
                Multi-branch management, consolidated reporting, and enterprise-grade controls 
                designed for growing businesses across Africa.
              </p>
            </div>
            
            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-6 sm:gap-10 mb-8">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">500+</div>
                <div className="text-xs text-teal-200">Enterprise Clients</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">10K+</div>
                <div className="text-xs text-teal-200">Branches Managed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">99.9%</div>
                <div className="text-xs text-teal-200">Uptime SLA</div>
              </div>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/enterprise/portal">
                <Button 
                  size="lg" 
                  className="bg-white text-[#00897B] hover:bg-teal-50 font-semibold px-6 py-5 text-base shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Access Portal
                </Button>
              </Link>
              <Button 
                size="lg" 
                className="bg-[#E0F2F1] text-[#00695C] hover:bg-white font-semibold px-6 py-5 text-base shadow-lg transition-all duration-300"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Book a Demo
              </Button>
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

      {/* Core Features */}
      <section id="features" className="py-12 sm:py-20 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B] bg-[#E0F2F1] text-xs">
              <Building2 className="h-3 w-3 mr-1" />
              Enterprise Features
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1A1A1A] mb-3">
              Everything You Need to <span className="text-[#00897B]">Scale</span>
            </h2>
            <p className="text-sm sm:text-base text-[#757575] max-w-2xl mx-auto">
              Powerful tools designed for multi-location businesses, giving you complete 
              control and visibility across your entire operation.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {coreFeatures.map((feature, index) => (
              <Card 
                key={index}
                className="group relative overflow-hidden bg-white border border-gray-200 hover:border-[#00897B]/30 hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="p-5 sm:p-6">
                  {/* Icon */}
                  <div className="w-10 h-10 mb-4 bg-[#E0F2F1] text-[#00897B] rounded-lg flex items-center justify-center group-hover:bg-[#00897B] group-hover:text-white transition-colors">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  
                  {/* Content */}
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

      {/* Multi-Branch Capabilities */}
      <section id="capabilities" className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B] bg-[#E0F2F1] text-xs">
              <Globe className="h-3 w-3 mr-1" />
              Multi-Branch Power
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1A1A1A] mb-3">
              Manage Multiple Locations <span className="text-[#00897B]">Effortlessly</span>
            </h2>
            <p className="text-sm sm:text-base text-[#757575] max-w-2xl mx-auto">
              From inventory to accounting, everything works together across all your branches.
            </p>
          </div>

          {/* Capabilities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {multiBranchCapabilities.map((capability, index) => (
              <div 
                key={index}
                className="flex items-start gap-4 p-5 rounded-xl bg-[#FAFAFA] border border-gray-200 hover:border-[#00897B]/30 hover:shadow-md transition-all duration-200"
              >
                <div className="w-9 h-9 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center flex-shrink-0">
                  <capability.icon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">
                    {capability.title}
                  </h3>
                  <p className="text-xs text-[#757575]">
                    {capability.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise Features */}
      <section className="py-12 sm:py-20 bg-gradient-to-br from-[#E0F2F1] to-[#E8F5E9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B] bg-white text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Enterprise-Grade
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1A1A1A] mb-3">
              Built for <span className="text-[#00897B]">Large Organizations</span>
            </h2>
            <p className="text-sm sm:text-base text-[#757575] max-w-2xl mx-auto">
              Advanced capabilities that scale with your business needs.
            </p>
          </div>

          {/* Features List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {enterpriseFeatures.map((feature, index) => (
              <div 
                key={index}
                className="flex flex-col items-center text-center p-4 rounded-xl bg-white border border-gray-200 hover:border-[#00897B]/30 hover:shadow-md transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center mb-3">
                  <feature.icon className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">
                  {feature.title}
                </h3>
                <p className="text-xs text-[#757575]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B] bg-[#E0F2F1] text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              Real Results
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1A1A1A] mb-3">
              Measurable <span className="text-[#00897B]">ROI</span>
            </h2>
            <p className="text-sm sm:text-base text-[#757575] max-w-2xl mx-auto">
              Our enterprise customers see significant improvements across key metrics.
            </p>
          </div>

          {/* ROI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {roiMetrics.map((metric, index) => (
              <div 
                key={index}
                className="text-center p-6 rounded-xl bg-[#FAFAFA] border border-gray-200"
              >
                <div className="w-9 h-9 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center mx-auto mb-3">
                  <metric.icon className="h-4 w-4" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-[#00897B] mb-1">
                  {metric.value}
                </div>
                <div className="text-sm font-semibold text-[#1A1A1A] mb-1">
                  {metric.label}
                </div>
                <div className="text-xs text-[#757575]">
                  {metric.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-20 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B] bg-[#E0F2F1] text-xs">
              <DollarSign className="h-3 w-3 mr-1" />
              Flexible Pricing
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1A1A1A] mb-3">
              Plans That <span className="text-[#00897B]">Scale</span> With You
            </h2>
            <p className="text-sm sm:text-base text-[#757575] max-w-2xl mx-auto">
              Choose the plan that fits your current needs. Upgrade as you grow.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {pricingTiers.map((tier, index) => (
              <Card 
                key={index}
                className={`relative overflow-hidden ${
                  tier.highlight 
                    ? 'border-2 border-[#00897B] shadow-xl' 
                    : 'border border-gray-200'
                }`}
              >
                {tier.highlight && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00897B] to-[#4CAF50]" />
                )}
                <CardContent className="p-6">
                  {/* Tier Header */}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-[#1A1A1A] mb-1">
                      {tier.name}
                    </h3>
                    <p className="text-sm text-[#00897B] font-medium mb-2">
                      {tier.branches}
                    </p>
                    <p className="text-xs text-[#757575]">
                      {tier.description}
                    </p>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[#00897B] flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-[#757575]">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button 
                    className={`w-full ${
                      tier.highlight 
                        ? 'bg-[#00897B] hover:bg-[#00695C] text-white' 
                        : 'bg-[#E0F2F1] text-[#00695C] hover:bg-[#00897B] hover:text-white'
                    }`}
                  >
                    Contact Sales
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Custom Enterprise Note */}
          <div className="mt-8 text-center">
            <p className="text-sm text-[#757575]">
              Need a custom solution? <a href="#" className="text-[#00897B] font-medium hover:underline">Contact our sales team</a> for tailored pricing.
            </p>
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
                Ready to Scale Your Business?
              </h2>
              <p className="text-sm sm:text-base text-teal-100 mb-6 max-w-2xl mx-auto">
                Join hundreds of enterprises already using Groway to manage 
                their multi-location operations efficiently.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/enterprise/portal">
                  <Button 
                    size="lg" 
                    className="bg-white text-[#00897B] hover:bg-teal-50 font-medium px-6 py-5 shadow-lg"
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    Access Enterprise Portal
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  className="bg-[#E0F2F1] text-[#00695C] hover:bg-white font-medium px-6 py-5 shadow-lg"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Book a Demo
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
                <a href="#" className="hover:text-[#00897B] transition-colors flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Contact
                </a>
              </div>
            </div>
            
            {/* Compliance Badges */}
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="outline" className="text-[10px] border-[#00897B]/30 text-[#00897B] py-0.5">
                PCI-DSS Level 1
              </Badge>
              <Badge variant="outline" className="text-[10px] border-[#00897B]/30 text-[#00897B] py-0.5">
                POPIA
              </Badge>
              <Badge variant="outline" className="text-[10px] border-[#00897B]/30 text-[#00897B] py-0.5">
                SARB
              </Badge>
              <Badge variant="outline" className="text-[10px] border-[#00897B]/30 text-[#00897B] py-0.5">
                NCR
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
