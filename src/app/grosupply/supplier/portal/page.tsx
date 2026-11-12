'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, FileText, DollarSign, CheckCircle2, Clock, Truck, TrendingUp, TrendingDown, Sparkles, Wallet, MessageSquare, BarChart3, Receipt } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSupplierAuth } from './layout'

const quickStats = [
  { label: 'Pending Orders', value: '3', icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
  { label: 'Open RFQs', value: '5', icon: FileText, color: 'text-amber-600', bg: 'bg-amber-100' },
  { label: 'Unread Messages', value: '8', icon: MessageSquare, color: 'text-red-500', bg: 'bg-red-100' },
  { label: 'Monthly Revenue', value: 'R45,230', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
]

const recentActivity = [
  { type: 'order', description: 'New order from QuickSpar Foods', time: '2 hours ago' },
  { type: 'rfq', description: 'Quote submitted for Fresh Produce Co.', time: '3 hours ago' },
  { type: 'payment', description: 'Payment received - R15,500', time: '1 hour ago' },
  { type: 'dispatch', description: 'Order dispatched to Hardware Supplies', time: '4 hours ago' },
]

const performanceMetrics = [
  { label: 'Quote Acceptance Rate', value: 85, target: 90 },
  { label: 'On-Time Delivery', value: 96, target: 98 },
  { label: 'Order Fulfillment', value: 99, target: 100 },
  { label: 'Customer Rating', value: 96, target: 100 },
]

const topProducts = [
  { name: 'Fresh Produce Bundle', sold: 45, revenue: 22500, growth: 12 },
  { name: 'Dairy Products', sold: 38, revenue: 18200, growth: 8 },
  { name: 'Beverages', sold: 52, revenue: 15600, growth: -3 },
  { name: 'Cleaning Supplies', sold: 29, revenue: 8700, growth: 5 },
  { name: 'Packaging Materials', sold: 41, revenue: 12300, growth: 15 },
]

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'order': return Package
    case 'rfq': return FileText
    case 'payment': return Wallet
    case 'dispatch': return Truck
    default: return Clock
  }
}

export default function SupplierDashboard() {
  const { supplier } = useSupplierAuth()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [supplier])

  const formatCurrency = (amount: number) => `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-[#00897B] border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-6 space-y-6">
        {/* Welcome Banner */}
        <Card className="border-l-4 border-l-[#00897B]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-[#00897B]" />
              <div>
                <h3 className="font-semibold text-[#1A1A1A]">New orders awaiting your response!</h3>
                <p className="text-sm text-[#757575]">You have 3 pending orders and 5 open RFQs requiring quotes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat, idx) => (
            <Card key={idx} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-[#1A1A1A]">{stat.value}</p>
                    <p className="text-xs text-[#757575]">{stat.label}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Orders */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Pending Orders</CardTitle>
                <Link href="/grosupply/supplier/portal/orders">
                  <Button variant="ghost" size="sm" className="text-[#00897B]">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { id: 'PO-2026-00123', amount: 4500, items: 12, status: 'pending', customer: 'QuickSpar Foods' },
                  { id: 'PO-2026-00122', amount: 2300, items: 8, status: 'pending', customer: 'Fresh Market Cafe' },
                  { id: 'PO-2026-00124', amount: 1850, items: 5, status: 'pending', customer: 'Downtown Bistro' },
                ].map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Package className="h-4 w-4 text-[#757575]" />
                      <div>
                        <p className="font-medium text-sm text-[#1A1A1A]">{order.id}</p>
                        <p className="text-xs text-[#757575]">{order.customer}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#1A1A1A]">{formatCurrency(order.amount)}</p>
                      <Badge variant="outline" className="text-xs">{order.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Open RFQs */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Open RFQs</CardTitle>
                <Link href="/grosupply/supplier/portal/rfqs">
                  <Button variant="ghost" size="sm" className="text-[#00897B]">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { id: 'RFQ-2026-0089', category: 'Fresh Produce', items: 15, deadline: '2 days', potential: 'R8,500' },
                  { id: 'RFQ-2026-0090', category: 'Dairy Products', items: 8, deadline: '3 days', potential: 'R4,200' },
                ].map((rfq) => (
                  <div key={rfq.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg hover:bg-amber-100 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-amber-600" />
                      <div>
                        <p className="font-medium text-sm text-[#1A1A1A]">{rfq.id}</p>
                        <p className="text-xs text-[#757575]">{rfq.items} items • {rfq.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-amber-600">Due in {rfq.deadline}</p>
                      <p className="text-xs text-[#757575]">{rfq.potential}</p>
                    </div>
                  </div>
                ))}
                <div className="mt-3 p-2 bg-[#E0F2F1] rounded text-xs text-[#00897B] text-center">
                  Submit quotes quickly to improve your chances!
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Top Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topProducts.map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-[#1A1A1A]">{product.name}</p>
                      <p className="text-xs text-[#757575]">{product.sold} sold</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-[#00897B]">{formatCurrency(product.revenue)}</p>
                      <div className={`flex items-center gap-1 text-xs ${product.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {product.growth > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(product.growth)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceMetrics.map((metric) => (
                  <div key={metric.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-[#757575]">{metric.label}</span>
                      <span className="text-sm font-medium text-[#1A1A1A]">{metric.value}%</span>
                    </div>
                    <Progress value={metric.value} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/grosupply/supplier/portal/orders">
            <Card className="hover:border-[#00897B]/30 transition-colors cursor-pointer">
              <CardContent className="p-4 text-center">
                <Package className="h-6 w-6 text-[#00897B] mx-auto mb-2" />
                <p className="text-sm font-medium">View Orders</p>
                <Badge variant="secondary" className="mt-2">3 pending</Badge>
              </CardContent>
            </Card>
          </Link>
          <Link href="/grosupply/supplier/portal/rfqs">
            <Card className="hover:border-[#00897B]/30 transition-colors cursor-pointer">
              <CardContent className="p-4 text-center">
                <FileText className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-medium">View RFQs</p>
                <Badge variant="secondary" className="mt-2 bg-amber-100 text-amber-700">5 new</Badge>
              </CardContent>
            </Card>
          </Link>
          <Link href="/grosupply/supplier/portal/products">
            <Card className="hover:border-[#00897B]/30 transition-colors cursor-pointer">
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-6 w-6 text-[#00897B] mx-auto mb-2" />
                <p className="text-sm font-medium">Manage Products</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/grosupply/supplier/portal/invoices">
            <Card className="hover:border-[#00897B]/30 transition-colors cursor-pointer">
              <CardContent className="p-4 text-center">
                <Receipt className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Submit Invoice</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity, idx) => {
                const Icon = getActivityIcon(activity.type)
                const colors: Record<string, string> = {
                  order: 'bg-blue-100 text-blue-600',
                  rfq: 'bg-amber-100 text-amber-600',
                  payment: 'bg-green-100 text-green-600',
                  dispatch: 'bg-purple-100 text-purple-600',
                }
                return (
                  <div key={idx} className="flex items-center gap-3 p-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[activity.type]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-[#1A1A1A]">{activity.description}</p>
                      <p className="text-xs text-[#757575]">{activity.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
