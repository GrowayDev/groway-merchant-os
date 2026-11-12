'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Shield,
  Store,
  CreditCard,
  Wallet,
  Briefcase,
  Network,
  Layers,
  Globe,
  Zap,
  Building2,
  Users,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowUpRight,
  ArrowRight,
  RefreshCw,
  DollarSign,
  ShoppingCart,
  Package,
  UserCheck,
  Target,
  Award,
  Clock
} from 'lucide-react'

// All Groway Applications with comprehensive metrics
const applications = [
  {
    id: 'admin-console',
    name: 'Admin Console',
    description: 'Platform management & oversight',
    icon: Shield,
    href: '/admin-console/app',
    color: '#00897B',
    status: 'operational' as const,
    metrics: {
      users: { value: 47, label: 'Active Admins', trend: '+2' },
      alerts: { value: 8, label: 'Open Alerts', trend: '-3' },
      uptime: { value: '99.99%', label: 'Uptime', trend: '+0.01%' }
    },
    features: ['Merchant Management', 'Compliance', 'Fraud Detection', 'Analytics']
  },
  {
    id: 'merchant-os',
    name: 'Merchant OS',
    description: 'POS & business management',
    icon: Store,
    href: '/merchant-os/app',
    color: '#4CAF50',
    status: 'operational' as const,
    metrics: {
      merchants: { value: 14847, label: 'Active Merchants', trend: '+127' },
      transactions: { value: '847K', label: 'Today Transactions', trend: '+12.4%' },
      volume: { value: 'R47.2M', label: 'Today Volume', trend: '+8.7%' }
    },
    features: ['POS Terminal', 'Inventory', 'Staff Management', 'Reports']
  },
  {
    id: 'gopay',
    name: 'GoPay',
    description: 'Payment gateway & devices',
    icon: CreditCard,
    href: '/gopay/portal',
    color: '#00897B',
    status: 'operational' as const,
    metrics: {
      devices: { value: 12453, label: 'Active Devices', trend: '+234' },
      payments: { value: 'R89.4M', label: 'Month Volume', trend: '+15.2%' },
      success: { value: '99.7%', label: 'Success Rate', trend: '+0.2%' }
    },
    features: ['EMV QR', 'PayShap', 'Card Payments', 'Device Management']
  },
  {
    id: 'consumer-wallet',
    name: 'Consumer Wallet',
    description: 'Consumer financial services',
    icon: Wallet,
    href: '/consumer-wallet/app',
    color: '#FF8F00',
    status: 'operational' as const,
    metrics: {
      users: { value: 234567, label: 'Wallet Users', trend: '+3,421' },
      balance: { value: 'R12.4M', label: 'Total Balance', trend: '+5.8%' },
      transactions: { value: '45K', label: 'Daily TXNs', trend: '+8.3%' }
    },
    features: ['Send Money', 'Airtime', 'Bills', 'Vouchers']
  },
  {
    id: 'salesforce',
    name: 'Field Salesforce',
    description: 'Sales team management & recruitment',
    icon: Briefcase,
    href: '/salesforce/portal',
    color: '#7C3AED',
    status: 'operational' as const,
    metrics: {
      agents: { value: 1247, label: 'Active Agents', trend: '+89' },
      visits: { value: 3421, label: 'Today Visits', trend: '+156' },
      conversions: { value: '34%', label: 'Conversion Rate', trend: '+2.1%' }
    },
    features: ['Lead Tracking', 'Visit Scheduling', 'Commissions', 'Training']
  },
  {
    id: 'agent-network',
    name: 'Agent Network',
    description: 'Referral & commission system',
    icon: Network,
    href: '/agent-network/portal',
    color: '#EC4899',
    status: 'operational' as const,
    metrics: {
      agents: { value: 8934, label: 'Network Agents', trend: '+234' },
      referrals: { value: 12453, label: 'Month Referrals', trend: '+18.5%' },
      commissions: { value: 'R2.4M', label: 'Month Paid', trend: '+12.3%' }
    },
    features: ['Referral Tracking', 'Commission Payouts', 'Training', 'Resources']
  },
  {
    id: 'grosupply',
    name: 'GroSupply',
    description: 'B2B marketplace & procurement',
    icon: Layers,
    href: '/grosupply/marketplace',
    color: '#14B8A6',
    status: 'operational' as const,
    metrics: {
      suppliers: { value: 234, label: 'Active Suppliers', trend: '+12' },
      orders: { value: 8934, label: 'Month Orders', trend: '+23.4%' },
      volume: { value: 'R34.2M', label: 'Month GMV', trend: '+18.7%' }
    },
    features: ['RFQ Engine', 'Supplier Portal', 'PO Management', 'GRN']
  },
  {
    id: 'grosell',
    name: 'GroSell',
    description: 'E-commerce & online selling',
    icon: Globe,
    href: '/grosell/app',
    color: '#8B5CF6',
    status: 'operational' as const,
    metrics: {
      stores: { value: 3421, label: 'Active Stores', trend: '+89' },
      orders: { value: 23456, label: 'Month Orders', trend: '+15.6%' },
      revenue: { value: 'R8.9M', label: 'Month Revenue', trend: '+12.1%' }
    },
    features: ['Online Store', 'WhatsApp Selling', 'Delivery', 'Analytics']
  },
  {
    id: 'grocredit',
    name: 'GroCredit',
    description: 'Lending & credit services',
    icon: Zap,
    href: '/grocredit',
    color: '#F59E0B',
    status: 'operational' as const,
    metrics: {
      active: { value: 4521, label: 'Active Facilities', trend: '+234' },
      disbursed: { value: 'R45.2M', label: 'Total Disbursed', trend: '+8.9%' },
      collections: { value: '97.2%', label: 'Collection Rate', trend: '+1.2%' }
    },
    features: ['Credit Scoring', 'Disbursements', 'Collections', 'Risk Management']
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Multi-tenant management',
    icon: Building2,
    href: '/enterprise/portal',
    color: '#6366F1',
    status: 'operational' as const,
    metrics: {
      tenants: { value: 23, label: 'Enterprise Tenants', trend: '+2' },
      merchants: { value: 4521, label: 'Managed Merchants', trend: '+234' },
      revenue: { value: 'R2.1M', label: 'Month Revenue', trend: '+15.4%' }
    },
    features: ['Tenant Management', 'White Label', 'API Keys', 'Analytics']
  }
]

// Platform-wide stats
const platformStats = [
  { label: 'Total Users', value: '1.2M', change: '+12.4%', trend: 'up', icon: Users },
  { label: 'Total Merchants', value: '14,847', change: '+127', trend: 'up', icon: Store },
  { label: 'Total Transactions', value: '2.4M', change: '+8.7%', trend: 'up', icon: Activity },
  { label: 'Platform Volume', value: 'R189.4M', change: '+15.2%', trend: 'up', icon: DollarSign }
]

// System health overview
const systemHealth = [
  { service: 'Payment Gateway', status: 'operational', uptime: '99.99%', latency: '45ms' },
  { service: 'QR Service', status: 'operational', uptime: '99.98%', latency: '32ms' },
  { service: 'Wallet Service', status: 'operational', uptime: '99.97%', latency: '28ms' },
  { service: 'KYC Service', status: 'degraded', uptime: '99.12%', latency: '450ms' },
  { service: 'Notification Service', status: 'operational', uptime: '99.95%', latency: '65ms' },
  { service: 'Settlement Engine', status: 'operational', uptime: '99.99%', latency: '38ms' }
]

export default function ApplicationsOverview() {
  const [isLoading, setIsLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const handleRefresh = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setLastRefresh(new Date())
    setIsLoading(false)
  }

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'degraded':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'down':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-green-500/20 text-green-400 border-green-500/30'
    }
  }

  const operationalCount = applications.filter(a => a.status === 'operational').length
  const degradedCount = applications.filter(a => a.status === 'degraded').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Layers className="h-6 w-6 text-[#00897B]" />
            Application Switcher
          </h1>
          <p className="text-gray-400 text-sm">Unified view of all Groway applications</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="h-4 w-4" />
            <span>Last updated: {lastRefresh.toLocaleTimeString('en-ZA')}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Platform-wide Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {platformStats.map((stat, index) => (
          <Card key={index} className="bg-[#1E293B] border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#00897B]/20 text-[#00897B] flex items-center justify-center">
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                </div>
                <span className={`text-xs flex items-center gap-1 ${stat.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {stat.change}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Health Banner */}
      <Card className="bg-[#1E293B] border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Platform Health: Operational</p>
                <p className="text-xs text-gray-400">{operationalCount}/{applications.length} applications running normally</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              {systemHealth.slice(0, 4).map((service, index) => (
                <div key={index} className="flex items-center gap-2">
                  {getStatusIcon(service.status)}
                  <span className="text-gray-300">{service.service}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {applications.map((app) => {
          const AppIcon = app.icon
          return (
            <Link key={app.id} href={app.href}>
              <Card className="bg-[#1E293B] border-gray-700 hover:border-gray-600 hover:bg-[#1E293B]/80 transition-all duration-300 cursor-pointer h-full group">
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                        style={{ backgroundColor: `${app.color}20`, color: app.color }}
                      >
                        <AppIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">{app.name}</h3>
                        <p className="text-xs text-gray-400">{app.description}</p>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(app.status)} border capitalize text-[10px]`}>
                      {app.status}
                    </Badge>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {Object.entries(app.metrics).map(([key, metric]) => (
                      <div key={key} className="bg-[#0F172A] rounded-lg p-2 text-center">
                        <p className="text-sm font-bold text-white">{metric.value}</p>
                        <p className="text-[10px] text-gray-400 truncate">{metric.label}</p>
                        <span className={`text-[9px] ${metric.trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                          {metric.trend}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {app.features.map((feature, idx) => (
                      <span 
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-[#0F172A] text-gray-400 border border-gray-700"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* Launch Button */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
                    <span className="text-xs text-gray-400">Click to launch</span>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#00897B] group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* System Services Detail */}
      <Card className="bg-[#1E293B] border-gray-700">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#00897B]" />
              System Services Health
            </CardTitle>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              {systemHealth.filter(s => s.status === 'operational').length}/{systemHealth.length} Operational
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {systemHealth.map((service, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border ${
                  service.status === 'operational' 
                    ? 'bg-green-500/5 border-green-500/20' 
                    : 'bg-amber-500/5 border-amber-500/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(service.status)}
                  <span className="text-xs font-medium text-white">{service.service}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-400">Uptime</span>
                    <span className="text-white">{service.uptime}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-400">Latency</span>
                    <span className={service.latency.includes('450') ? 'text-amber-400' : 'text-white'}>
                      {service.latency}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-[#1E293B] border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Link href="/admin-console/app">
              <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 h-auto py-3 flex-col">
                <Shield className="h-5 w-5 mb-2" />
                <span className="text-xs">Admin Dashboard</span>
              </Button>
            </Link>
            <Link href="/gopay/portal">
              <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 h-auto py-3 flex-col">
                <CreditCard className="h-5 w-5 mb-2" />
                <span className="text-xs">GoPay Portal</span>
              </Button>
            </Link>
            <Link href="/salesforce/portal">
              <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 h-auto py-3 flex-col">
                <Briefcase className="h-5 w-5 mb-2" />
                <span className="text-xs">Salesforce</span>
              </Button>
            </Link>
            <Link href="/agent-network/portal">
              <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 h-auto py-3 flex-col">
                <Network className="h-5 w-5 mb-2" />
                <span className="text-xs">Agent Network</span>
              </Button>
            </Link>
            <Link href="/merchant-os/app">
              <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 h-auto py-3 flex-col">
                <Store className="h-5 w-5 mb-2" />
                <span className="text-xs">Merchant OS</span>
              </Button>
            </Link>
            <Link href="/consumer-wallet/app">
              <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 h-auto py-3 flex-col">
                <Wallet className="h-5 w-5 mb-2" />
                <span className="text-xs">Consumer Wallet</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
