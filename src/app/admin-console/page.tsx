'use client'

import { 
  Shield,
  Activity,
  Users,
  FileCheck,
  AlertTriangle,
  BarChart3,
  Headphones,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Server,
  Database,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Lock,
  Key,
  Settings,
  Bell,
  FileText,
  UserCheck,
  Building2,
  CreditCard,
  Globe,
  Zap,
  Menu,
  X,
  ShieldCheck,
  FileSearch,
  ScrollText,
  ShieldAlert,
  Fingerprint,
  MonitorDot,
  Ban
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

// Platform Dashboard Features
const dashboardFeatures = [
  {
    title: 'Platform Dashboard',
    description: 'Real-time health monitoring across all services and infrastructure.',
    icon: Activity,
    features: ['Service Health', 'API Latency', 'Error Rates', 'Uptime Tracking'],
    color: '#00897B'
  },
  {
    title: 'Merchant Management',
    description: 'Onboarding, verification, and lifecycle management for all merchants.',
    icon: Users,
    features: ['Onboarding Queue', 'KYC/KYB Review', 'Account Status', 'Support Tickets'],
    color: '#1976D2'
  },
  {
    title: 'Compliance Center',
    description: 'POPIA, FICA, AML monitoring and regulatory reporting.',
    icon: FileCheck,
    features: ['FICA Compliance', 'POPIA Requests', 'AML Screening', 'Regulatory Reports'],
    color: '#7B1FA2'
  },
  {
    title: 'Fraud Detection',
    description: 'Transaction monitoring, alerts, and risk scoring engine.',
    icon: AlertTriangle,
    features: ['Rule Engine', 'Alert Queue', 'Risk Scoring', 'Case Management'],
    color: '#D32F2F'
  },
  {
    title: 'Analytics & Reporting',
    description: 'Business intelligence and operational reporting dashboards.',
    icon: BarChart3,
    features: ['Custom Reports', 'Data Export', 'Dashboards', 'Scheduled Reports'],
    color: '#388E3C'
  },
  {
    title: 'Support Tools',
    description: 'Ticket management, merchant lookup, and customer support utilities.',
    icon: Headphones,
    features: ['Ticket Queue', 'Merchant Lookup', 'Transaction Search', 'Audit Trail'],
    color: '#F57C00'
  }
]

// Operations Dashboard Stats
const operationsStats = [
  { label: 'Active Merchants', value: '14,847', change: '+127', trend: 'up', icon: Building2 },
  { label: 'Transactions Today', value: '847K', change: '+12.4%', trend: 'up', icon: CreditCard },
  { label: 'System Uptime', value: '99.98%', change: '+0.02%', trend: 'up', icon: Server },
  { label: 'Avg Response Time', value: '124ms', change: '-8ms', trend: 'up', icon: Zap }
]

// System Health Indicators
const systemHealth = [
  { service: 'Payment Gateway', status: 'operational', uptime: '99.99%', icon: CreditCard },
  { service: 'QR Service', status: 'operational', uptime: '99.98%', icon: Globe },
  { service: 'Wallet Service', status: 'operational', uptime: '99.97%', icon: Database },
  { service: 'KYC Service', status: 'degraded', uptime: '99.12%', icon: UserCheck },
  { service: 'Notification Service', status: 'operational', uptime: '99.95%', icon: Bell },
  { service: 'Settlement Engine', status: 'operational', uptime: '99.99%', icon: Server }
]

// Alert Queue
const alertQueue = [
  { id: 1, type: 'fraud', message: 'Unusual transaction pattern detected - Merchant #4521', severity: 'high', time: '2 min ago' },
  { id: 2, type: 'compliance', message: 'KYC verification pending - 23 merchants', severity: 'medium', time: '15 min ago' },
  { id: 3, type: 'system', message: 'KYC Service experiencing degraded performance', severity: 'medium', time: '1 hour ago' },
  { id: 4, type: 'fraud', message: 'Velocity rule triggered - User #892341', severity: 'low', time: '2 hours ago' }
]

// Compliance Queue Stats
const complianceQueue = [
  { title: 'KYC Verification', count: 234, color: '#00897B', icon: UserCheck },
  { title: 'KYB Review', count: 87, color: '#1976D2', icon: Building2 },
  { title: 'POPIA Requests', count: 12, color: '#7B1FA2', icon: FileText },
  { title: 'SAR Reports', count: 8, color: '#D32F2F', icon: AlertTriangle }
]

// Transaction Monitoring Rules
const monitoringRules = [
  { name: 'Velocity Check', status: 'active', triggers: '1.2K/day', type: 'fraud' },
  { name: 'Geolocation Anomaly', status: 'active', triggers: '340/day', type: 'fraud' },
  { name: 'High Value Alert', status: 'active', triggers: '89/day', type: 'fraud' },
  { name: 'AML Screening', status: 'active', triggers: '12K/day', type: 'compliance' },
  { name: 'Sanctions Check', status: 'active', triggers: '12K/day', type: 'compliance' }
]

// Security Features
const securityFeatures = [
  {
    title: 'Role-Based Access Control',
    description: 'Granular permissions with custom role management for all admin users.',
    icon: Key,
    features: ['Custom Roles', 'Permission Sets', 'Team Management', 'Access Logs']
  },
  {
    title: 'Audit Trails',
    description: 'Complete logging of all admin actions with immutable records.',
    icon: ScrollText,
    features: ['Action Logs', 'Data Access', 'Change History', 'Export Reports']
  },
  {
    title: 'Session Management',
    description: 'Secure session handling with automatic timeout and device tracking.',
    icon: MonitorDot,
    features: ['Active Sessions', 'Device Trust', 'Auto Timeout', 'Force Logout']
  },
  {
    title: 'IP Whitelisting',
    description: 'Restrict access to approved IP ranges and VPN connections.',
    icon: Globe,
    features: ['IP Rules', 'VPN Detection', 'Geo Blocking', 'Bypass Codes']
  }
]

// Audit Log Preview
const auditLogPreview = [
  { action: 'Merchant Approved', user: 'Sarah M.', target: 'Merchant #8821', time: '3 min ago', type: 'merchant' },
  { action: 'Fraud Alert Resolved', user: 'John D.', target: 'Case #4521', time: '12 min ago', type: 'fraud' },
  { action: 'KYC Document Verified', user: 'Thabo K.', target: 'User #234891', time: '18 min ago', type: 'compliance' },
  { action: 'Transaction Refunded', user: 'Lisa N.', target: 'TXN #8847291', time: '25 min ago', type: 'support' }
]

export default function AdminConsolePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-amber-500" />
      case 'down':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-700'
      case 'medium':
        return 'bg-amber-50 border-amber-200 text-amber-700'
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-700'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#00897B] text-white flex items-center justify-center">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <span className="text-sm sm:text-base font-bold text-[#1A1A1A]">Admin Console</span>
                <span className="hidden sm:inline text-xs text-[#757575] ml-2">| Groway Platform</span>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-[#757575] hover:text-[#00897B] transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Home
              </Link>
              <a href="#dashboard" className="text-sm font-medium text-[#757575] hover:text-[#00897B] transition-colors">
                Dashboard
              </a>
              <a href="#operations" className="text-sm font-medium text-[#757575] hover:text-[#00897B] transition-colors">
                Operations
              </a>
              <a href="#compliance" className="text-sm font-medium text-[#757575] hover:text-[#00897B] transition-colors">
                Compliance
              </a>
              <a href="#security" className="text-sm font-medium text-[#757575] hover:text-[#00897B] transition-colors">
                Security
              </a>
            </div>
            
            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/admin-console/login">
                <Button className="bg-[#00897B] hover:bg-[#00695C] text-white font-medium px-4 text-sm">
                  Sign In
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
          <div className="md:hidden bg-white border-t border-gray-200/50 py-4 px-4 space-y-3">
            <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-[#00897B]">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Home
            </Link>
            <a href="#dashboard" className="block text-sm font-medium text-[#757575] hover:text-[#00897B]">Dashboard</a>
            <a href="#operations" className="block text-sm font-medium text-[#757575] hover:text-[#00897B]">Operations</a>
            <a href="#compliance" className="block text-sm font-medium text-[#757575] hover:text-[#00897B]">Compliance</a>
            <a href="#security" className="block text-sm font-medium text-[#757575] hover:text-[#00897B]">Security</a>
            <div className="pt-3 border-t border-gray-200/50">
              <Link href="/admin-console/app">
                <Button className="w-full bg-[#00897B] hover:bg-[#00695C] text-white text-sm">Request Access</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#1A1A1A] via-[#2D2D2D] to-[#1A1A1A] pt-10 sm:pt-14 pb-16 sm:pb-20">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#00897B]/10 to-transparent" />
        <div className="absolute top-10 left-10 w-24 h-24 bg-[#00897B]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-20 w-32 h-32 bg-[#4CAF50]/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00897B]/20 backdrop-blur-sm border border-[#00897B]/30 mb-5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#4CAF50]" />
              <span className="text-xs sm:text-sm font-medium text-[#4CAF50]">Internal Operations Platform</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
              Platform Operations,
              <br />
              <span className="text-[#00897B]">Under Control</span>
            </h1>
            
            {/* Sub-headline */}
            <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto mb-6">
              Monitor platform health, manage merchants, handle compliance, detect fraud, 
              and support users — all from one powerful admin console.
            </p>
            
            {/* Feature Tags */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <Badge className="bg-white/10 text-white border-white/20 px-3 py-1 text-xs">
                <Activity className="h-3 w-3 mr-1" />
                Real-time Monitoring
              </Badge>
              <Badge className="bg-white/10 text-white border-white/20 px-3 py-1 text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Enterprise Security
              </Badge>
              <Badge className="bg-white/10 text-white border-white/20 px-3 py-1 text-xs">
                <FileCheck className="h-3 w-3 mr-1" />
                Compliance Ready
              </Badge>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/admin-console/login">
                <Button 
                  size="lg" 
                  className="bg-[#00897B] hover:bg-[#00695C] text-white font-semibold px-6 py-5 text-base shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline"
                className="bg-transparent text-white border-white/30 hover:bg-white/10 font-semibold px-6 py-5 text-base transition-all duration-300"
              >
                <Eye className="mr-2 h-4 w-4" />
                View Documentation
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Operations Stats Preview */}
      <section className="py-6 sm:py-8 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
            {operationsStats.map((stat, index) => (
              <div key={index} className="text-center p-3 rounded-lg bg-[#FAFAFA]">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#E0F2F1] text-[#00897B] mb-2">
                  <stat.icon className="h-4 w-4" />
                </div>
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <span className="text-xl sm:text-2xl font-bold text-[#1A1A1A]">{stat.value}</span>
                  <span className={`text-xs font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.trend === 'up' ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                  </span>
                </div>
                <div className="text-xs text-[#757575]">{stat.label}</div>
                <div className={`text-xs font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section id="dashboard" className="py-10 sm:py-16 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B] bg-[#E0F2F1] text-xs">
              <Settings className="h-3 w-3 mr-1" />
              Core Modules
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-2">
              Everything You Need to Run the Platform
            </h2>
            <p className="text-sm text-[#757575] max-w-2xl mx-auto">
              Six integrated modules designed for operations teams to monitor, manage, and scale.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {dashboardFeatures.map((feature, index) => (
              <Card 
                key={index}
                className="group relative overflow-hidden bg-white border border-gray-200 hover:border-[#00897B]/30 hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="p-5">
                  {/* Icon */}
                  <div 
                    className="w-9 h-9 mb-3 rounded-lg flex items-center justify-center transition-colors"
                    style={{ backgroundColor: `${feature.color}15`, color: feature.color }}
                  >
                    <feature.icon className="h-4 w-4" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-base font-bold text-[#1A1A1A] mb-1.5">
                    {feature.title}
                  </h3>
                  
                  <p className="text-xs text-[#757575] mb-3 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  {/* Features */}
                  <div className="flex flex-wrap gap-1.5">
                    {feature.features.map((f, idx) => (
                      <span 
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5F5F5] text-[#757575] border border-gray-200"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Operations Dashboard */}
      <section id="operations" className="py-10 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B] bg-[#E0F2F1] text-xs">
              <Activity className="h-3 w-3 mr-1" />
              Live Dashboard
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-2">
              Operations at a Glance
            </h2>
            <p className="text-sm text-[#757575] max-w-2xl mx-auto">
              Real-time visibility into platform health, alerts, and operational metrics.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
            {/* System Health */}
            <div className="lg:col-span-2">
              <Card className="bg-white border border-gray-200 h-full">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-[#1A1A1A]">System Health</h3>
                    <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
                      All Systems Operational
                    </Badge>
                  </div>
                  
                  <div className="space-y-2.5">
                    {systemHealth.map((service, index) => (
                      <div key={index} className="flex items-center justify-between p-2.5 rounded-lg bg-[#FAFAFA] hover:bg-[#F5F5F5] transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded bg-[#E0F2F1] text-[#00897B] flex items-center justify-center">
                            <service.icon className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-[#1A1A1A]">{service.service}</p>
                            <p className="text-[10px] text-[#757575]">Uptime: {service.uptime}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(service.status)}
                          <span className={`text-[10px] font-medium capitalize ${
                            service.status === 'operational' ? 'text-green-600' : 
                            service.status === 'degraded' ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {service.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alert Queue */}
            <div>
              <Card className="bg-white border border-gray-200 h-full">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-[#1A1A1A]">Alert Queue</h3>
                    <Badge className="bg-red-50 text-red-700 border-red-200 text-xs">
                      4 Active
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {alertQueue.map((alert) => (
                      <div 
                        key={alert.id} 
                        className={`p-2.5 rounded-lg border ${getSeverityColor(alert.severity)}`}
                      >
                        <div className="flex items-start gap-2">
                          {alert.type === 'fraud' ? (
                            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                          ) : alert.type === 'compliance' ? (
                            <FileCheck className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                          ) : (
                            <Server className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-medium leading-tight">{alert.message}</p>
                            <p className="text-[10px] opacity-70 mt-1">{alert.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full mt-3 text-xs">
                    View All Alerts
                    <ArrowRight className="ml-1.5 h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Transaction Volume Chart Placeholder */}
          <div className="mt-5">
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#1A1A1A]">Transaction Volume (24h)</h3>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[#E0F2F1] text-[#00897B] border-[#00897B]/20 text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +12.4%
                    </Badge>
                    <span className="text-xs text-[#757575]">vs yesterday</span>
                  </div>
                </div>
                
                {/* Chart Placeholder */}
                <div className="h-40 sm:h-48 bg-gradient-to-t from-[#E0F2F1] to-transparent rounded-lg flex items-end justify-around p-4">
                  {[65, 45, 78, 52, 88, 72, 95, 68, 82, 90, 75, 98].map((height, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div 
                        className="w-4 sm:w-6 bg-[#00897B]/80 rounded-t transition-all hover:bg-[#00897B]"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-[8px] sm:text-[10px] text-[#757575]">
                        {i * 2}h
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Compliance Center */}
      <section id="compliance" className="py-10 sm:py-16 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#7B1FA2]/30 text-[#7B1FA2] bg-[#F3E5F5] text-xs">
              <FileCheck className="h-3 w-3 mr-1" />
              Compliance Tools
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-2">
              Regulatory Compliance, Automated
            </h2>
            <p className="text-sm text-[#757575] max-w-2xl mx-auto">
              POPIA, FICA, AML compliance tools with automated screening and reporting.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-4 sm:gap-5">
            {/* Compliance Queue */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {complianceQueue.map((item, index) => (
                <Card key={index} className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${item.color}15`, color: item.color }}
                      >
                        <item.icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-medium text-[#757575]">{item.title}</span>
                    </div>
                    <div className="text-2xl font-bold text-[#1A1A1A] mb-2">{item.count}</div>
                    <Button variant="outline" size="sm" className="w-full text-xs h-8">
                      View Queue
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Transaction Monitoring Rules */}
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#1A1A1A]">Monitoring Rules</h3>
                  <Button variant="outline" size="sm" className="text-xs h-7">
                    <Settings className="h-3 w-3 mr-1" />
                    Configure
                  </Button>
                </div>
                
                <div className="space-y-2.5">
                  {monitoringRules.map((rule, index) => (
                    <div key={index} className="flex items-center justify-between p-2.5 rounded-lg bg-[#FAFAFA]">
                      <div className="flex items-center gap-2">
                        {rule.type === 'fraud' ? (
                          <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                        ) : (
                          <FileCheck className="h-3.5 w-3.5 text-purple-500" />
                        )}
                        <span className="text-xs font-medium text-[#1A1A1A]">{rule.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#757575]">{rule.triggers}</span>
                        <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px] py-0 px-1.5">
                          Active
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Audit Log Preview */}
          <div className="mt-5">
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#1A1A1A]">Recent Audit Activity</h3>
                  <Button variant="outline" size="sm" className="text-xs h-7">
                    <FileSearch className="h-3 w-3 mr-1" />
                    Full Audit Log
                  </Button>
                </div>
                
                <div className="overflow-x-auto">
                  <div className="min-w-full">
                    <div className="grid grid-cols-4 gap-4 text-xs font-medium text-[#757575] pb-2 border-b border-gray-200">
                      <div>Action</div>
                      <div>User</div>
                      <div>Target</div>
                      <div>Time</div>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {auditLogPreview.map((log, index) => (
                        <div key={index} className="grid grid-cols-4 gap-4 py-2.5 text-xs">
                          <div className="font-medium text-[#1A1A1A]">{log.action}</div>
                          <div className="text-[#757575]">{log.user}</div>
                          <div className="text-[#757575]">{log.target}</div>
                          <div className="text-[#00897B]">{log.time}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section id="security" className="py-10 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#D32F2F]/30 text-[#D32F2F] bg-[#FFEBEE] text-xs">
              <ShieldAlert className="h-3 w-3 mr-1" />
              Enterprise Security
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-2">
              Bank-Grade Security Controls
            </h2>
            <p className="text-sm text-[#757575] max-w-2xl mx-auto">
              Multi-layer security with comprehensive audit trails and access controls.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {securityFeatures.map((feature, index) => (
              <Card 
                key={index}
                className="group bg-white border border-gray-200 hover:border-[#00897B]/30 hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="p-5">
                  {/* Icon */}
                  <div className="w-9 h-9 mb-3 bg-[#E0F2F1] text-[#00897B] rounded-lg flex items-center justify-center group-hover:bg-[#00897B] group-hover:text-white transition-colors">
                    <feature.icon className="h-4 w-4" />
                  </div>
                  
                  <h3 className="text-sm font-bold text-[#1A1A1A] mb-1.5">
                    {feature.title}
                  </h3>
                  
                  <p className="text-[10px] sm:text-xs text-[#757575] mb-3 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  {/* Features */}
                  <div className="space-y-1.5">
                    {feature.features.map((f, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-[#00897B] flex-shrink-0" />
                        <span className="text-[10px] text-[#757575]">{f}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Security Stats */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-[#FAFAFA] border border-gray-200">
              <div className="w-8 h-8 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center mx-auto mb-2">
                <Fingerprint className="h-4 w-4" />
              </div>
              <div className="text-lg font-bold text-[#1A1A1A]">MFA</div>
              <div className="text-[10px] text-[#757575]">Required for all users</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-[#FAFAFA] border border-gray-200">
              <div className="w-8 h-8 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center mx-auto mb-2">
                <Ban className="h-4 w-4" />
              </div>
              <div className="text-lg font-bold text-[#1A1A1A]">IP Lock</div>
              <div className="text-[10px] text-[#757575]">Whitelist enforcement</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-[#FAFAFA] border border-gray-200">
              <div className="w-8 h-8 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center mx-auto mb-2">
                <Clock className="h-4 w-4" />
              </div>
              <div className="text-lg font-bold text-[#1A1A1A]">30 min</div>
              <div className="text-[10px] text-[#757575]">Session timeout</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-[#FAFAFA] border border-gray-200">
              <div className="w-8 h-8 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center mx-auto mb-2">
                <ScrollText className="h-4 w-4" />
              </div>
              <div className="text-lg font-bold text-[#1A1A1A]">100%</div>
              <div className="text-[10px] text-[#757575]">Actions logged</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 sm:py-16 bg-[#FAFAFA]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A1A1A] via-[#2D2D2D] to-[#1A1A1A] p-6 sm:p-10 text-center">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#00897B]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#4CAF50]/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-[#00897B]/20 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="h-6 w-6 text-[#00897B]" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Internal Operations Tool
              </h2>
              <p className="text-sm sm:text-base text-gray-400 mb-6 max-w-2xl mx-auto">
                Access to the Admin Console is restricted to authorized Groway team members. 
                Request access through your manager or the security team.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/admin-console/login">
                  <Button 
                    size="lg" 
                    className="bg-[#00897B] hover:bg-[#00695C] text-white font-medium px-6 py-5 shadow-lg"
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Sign In
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="bg-transparent text-white border-white/30 hover:bg-white/10 font-medium px-6 py-5"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View Documentation
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-6 sm:py-8 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4">
            {/* Main Footer Content */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Logo & Info */}
              <Link href="/" className="flex items-center gap-3">
                <div className="w-7 h-7 rounded bg-[#00897B] text-white flex items-center justify-center">
                  <Shield className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-[#1A1A1A]">Admin Console</span>
                  <span className="text-xs text-[#757575] ml-2">v2.4.1</span>
                </div>
              </Link>
              
              {/* Links */}
              <div className="flex items-center gap-4 text-xs text-[#757575]">
                <a href="#" className="hover:text-[#00897B] transition-colors flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Docs
                </a>
                <a href="#" className="hover:text-[#00897B] transition-colors flex items-center gap-1">
                  <Headphones className="h-3 w-3" />
                  Support
                </a>
                <a href="#" className="hover:text-[#00897B] transition-colors flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Security
                </a>
              </div>
            </div>
            
            {/* Compliance Badges */}
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="outline" className="text-[10px] border-[#00897B]/30 text-[#00897B] py-0.5">
                PCI-DSS Level 1
              </Badge>
              <Badge variant="outline" className="text-[10px] border-[#00897B]/30 text-[#00897B] py-0.5">
                POPIA Compliant
              </Badge>
              <Badge variant="outline" className="text-[10px] border-[#00897B]/30 text-[#00897B] py-0.5">
                SOC 2 Type II
              </Badge>
              <Badge variant="outline" className="text-[10px] border-[#00897B]/30 text-[#00897B] py-0.5">
                ISO 27001
              </Badge>
            </div>

            {/* Copyright */}
            <div className="text-center text-[10px] text-[#757575]">
              © 2026 Groway (Pty) Ltd. Internal use only. All actions are logged and audited.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
