'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  DollarSign,
  Activity,
  Download,
  Calendar,
  Building2,
  Globe,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  LineChart
} from 'lucide-react'

export default function AnalyticsView() {
  const [dateRange, setDateRange] = useState('7d')

  const overviewStats = [
    { label: 'Total Revenue', value: 'R 47.2M', change: '+12.4%', trend: 'up', icon: DollarSign },
    { label: 'Total Transactions', value: '2.4M', change: '+8.7%', trend: 'up', icon: CreditCard },
    { label: 'Active Merchants', value: '14,847', change: '+127', trend: 'up', icon: Building2 },
    { label: 'Active Users', value: '847K', change: '+5.2%', trend: 'up', icon: Users },
  ]

  const platformMetrics = [
    { label: 'Payment Success Rate', value: '98.7%', target: '99%', status: 'good' },
    { label: 'Avg Transaction Time', value: '1.2s', target: '<2s', status: 'good' },
    { label: 'System Uptime', value: '99.98%', target: '99.9%', status: 'excellent' },
    { label: 'Support Resolution', value: '4.2h', target: '<6h', status: 'good' },
  ]

  const merchantGrowth = [
    { month: 'Jan', merchants: 12400, transactions: 1800000 },
    { month: 'Feb', merchants: 12850, transactions: 1950000 },
    { month: 'Mar', merchants: 13200, transactions: 2100000 },
    { month: 'Apr', merchants: 13680, transactions: 2250000 },
    { month: 'May', merchants: 14050, transactions: 2350000 },
    { month: 'Jun', merchants: 14420, transactions: 2480000 },
  ]

  const topVerticals = [
    { name: 'Food & Beverage', merchants: 3240, volume: 12500000, share: 26 },
    { name: 'Grocery & FMCG', merchants: 2890, volume: 9800000, share: 21 },
    { name: 'Health & Pharmacy', merchants: 1850, volume: 7200000, share: 15 },
    { name: 'Electronics & Tech', merchants: 1240, volume: 6500000, share: 14 },
    { name: 'Fashion & Apparel', merchants: 1560, volume: 5800000, share: 12 },
    { name: 'Other Verticals', merchants: 4067, volume: 5400000, share: 12 },
  ]

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `R ${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `R ${(value / 1000).toFixed(0)}K`
    return `R ${value}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Analytics</h1>
          <p className="text-gray-400 text-sm">Business intelligence and operational reporting</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-36 bg-[#1E293B] border-gray-700 text-white">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent className="bg-[#1E293B] border-gray-700 text-white">
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-[#00897B] hover:bg-[#00695C] text-white">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {overviewStats.map((stat, index) => (
          <Card key={index} className="bg-[#1E293B] border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-[#00897B]/20 text-[#00897B] flex items-center justify-center">
                  <stat.icon className="h-5 w-5" />
                </div>
                <span className={`text-sm flex items-center gap-1 ${stat.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.trend === 'up' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Platform Metrics */}
      <Card className="bg-[#1E293B] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#00897B]" />
            Platform Health Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {platformMetrics.map((metric, index) => (
              <div key={index} className="bg-[#0F172A] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">{metric.label}</span>
                  <Badge className={`${
                    metric.status === 'excellent' ? 'bg-green-500/20 text-green-400' :
                    metric.status === 'good' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-amber-500/20 text-amber-400'
                  } capitalize`}>
                    {metric.status}
                  </Badge>
                </div>
                <p className="text-xl font-bold text-white mb-1">{metric.value}</p>
                <p className="text-xs text-gray-500">Target: {metric.target}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Transaction Volume Chart */}
        <Card className="bg-[#1E293B] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#00897B]" />
              Merchant Growth Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-3 px-2">
              {merchantGrowth.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col gap-1" style={{ height: '200px' }}>
                    <div 
                      className="w-full bg-[#00897B] rounded-t transition-all hover:bg-[#00897B]/80"
                      style={{ height: `${(data.merchants / 15000) * 100}%` }}
                      title={`${data.merchants.toLocaleString()} merchants`}
                    />
                    <div 
                      className="w-full bg-[#4CAF50] rounded-t transition-all hover:bg-[#4CAF50]/80"
                      style={{ height: `${(data.transactions / 2500000) * 100}%` }}
                      title={`${data.transactions.toLocaleString()} transactions`}
                    />
                  </div>
                  <span className="text-xs text-gray-400 mt-2">{data.month}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-[#00897B]" />
                <span className="text-xs text-gray-400">Merchants</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-[#4CAF50]" />
                <span className="text-xs text-gray-400">Transactions</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vertical Distribution */}
        <Card className="bg-[#1E293B] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <PieChart className="h-4 w-4 text-[#00897B]" />
              Transaction Volume by Vertical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topVerticals.map((vertical, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white">{vertical.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{vertical.merchants.toLocaleString()} merchants</span>
                      <span className="text-sm font-medium text-white">{formatCurrency(vertical.volume)}</span>
                    </div>
                  </div>
                  <Progress value={vertical.share} className="h-2 bg-gray-700" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Merchants */}
      <Card className="bg-[#1E293B] border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#00897B]" />
              Top Performing Merchants
            </CardTitle>
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-700">
                  <th className="text-left pb-3">Merchant</th>
                  <th className="text-left pb-3">Vertical</th>
                  <th className="text-right pb-3">Transactions</th>
                  <th className="text-right pb-3">Volume</th>
                  <th className="text-right pb-3">Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {[
                  { name: 'Sandton City Mall', vertical: 'Retail', transactions: 45230, volume: 12500000, growth: 24 },
                  { name: 'Cape Town Coffee Co', vertical: 'F&B', transactions: 38450, volume: 8900000, growth: 18 },
                  { name: 'Pretoria Pharmacy', vertical: 'Health', transactions: 32100, volume: 7500000, growth: 15 },
                  { name: 'Durban Fresh Market', vertical: 'Grocery', transactions: 28900, volume: 6200000, growth: 12 },
                  { name: 'TechHub Sandton', vertical: 'Electronics', transactions: 25600, volume: 5800000, growth: 22 },
                ].map((merchant, index) => (
                  <tr key={index} className="hover:bg-[#0F172A]/50">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-[#00897B]/20 text-[#00897B] flex items-center justify-center">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <span className="text-sm text-white">{merchant.name}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge className="bg-gray-500/20 text-gray-300">{merchant.vertical}</Badge>
                    </td>
                    <td className="py-3 text-right text-sm text-white">{merchant.transactions.toLocaleString()}</td>
                    <td className="py-3 text-right text-sm text-white">{formatCurrency(merchant.volume)}</td>
                    <td className="py-3 text-right">
                      <span className="text-sm text-green-400 flex items-center justify-end gap-1">
                        <ArrowUpRight className="h-3 w-3" />
                        {merchant.growth}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
