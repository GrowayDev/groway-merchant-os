'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  TrendingUp,
  TrendingDown,
  Coins,
  ShoppingCart,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CreditCard,
  Banknote,
  QrCode,
  Wallet,
  RefreshCw,
  Truck,
  PiggyBank,
  Zap,
  Bot,
  Target,
  AlertCircle,
  Lightbulb,
  ExternalLink,
  ArrowRight,
  CheckCircle2,
  Timer,
  Percent,
  Building2,
  Plus,
  HardDrive,
  Smartphone,
  Tablet,
  Wifi,
  WifiOff,
  Printer,
  Scan,
} from 'lucide-react'

interface Transaction {
  id: string
  time: string
  amount: number
  method: 'cash' | 'card' | 'qr' | 'wallet'
  items: number
  customer?: string
}

interface DashboardStats {
  todaySales: number
  todayTransactions: number
  avgTransaction: number
  topProducts: { name: string; sold: number; revenue: number }[]
  hourlySales: { hour: string; amount: number }[]
  paymentMethods: { method: string; count: number; amount: number }[]
}

interface GroSupplyData {
  pendingOrders: number
  lastOrderDate: string
  estimatedDelivery: string
  savingsThisMonth: number
  lowStockItems: number
  suggestedOrder: { items: number; value: number }
}

interface GroCreditData {
  availableCredit: number
  usedCredit: number
  totalLimit: number
  nextPaymentDate: string
  nextPaymentAmount: number
  creditScore: number
  status: 'good' | 'fair' | 'review'
}

interface GroAIInsight {
  id: string
  type: 'opportunity' | 'alert' | 'trend' | 'recommendation'
  title: string
  description: string
  action: string
  priority: 'high' | 'medium' | 'low'
  metric?: string
  change?: number
}

interface MerchantDashboardProps {
  verticalName: string
  subVerticalName: string
  onNewSale: () => void
  onNavigate?: (view: string) => void
}

// Generate mock data for demo
const generateMockData = (): { stats: DashboardStats; transactions: Transaction[]; groSupply: GroSupplyData; groCredit: GroCreditData; insights: GroAIInsight[] } => {
  const transactions: Transaction[] = []
  const methods: ('cash' | 'card' | 'qr' | 'wallet')[] = ['cash', 'card', 'qr', 'wallet']
  for (let i = 0; i < 12; i++) {
    const hour = 8 + Math.floor(i * 1.2)
    const minute = Math.floor(Math.random() * 60)
    transactions.push({
      id: `TXN-${Date.now() - i * 100000}`,
      time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      amount: 50 + Math.floor(Math.random() * 500),
      method: methods[Math.floor(Math.random() * methods.length)],
      items: 1 + Math.floor(Math.random() * 5),
      customer: Math.random() > 0.7 ? ['John D.', 'Sarah M.', 'Thabo K.', 'Lisa N.'][Math.floor(Math.random() * 4)] : undefined,
    })
  }

  const todaySales = transactions.reduce((sum, t) => sum + t.amount, 0)
  
  return {
    stats: {
      todaySales,
      todayTransactions: transactions.length,
      avgTransaction: Math.round(todaySales / transactions.length),
      topProducts: [
        { name: 'Burger Combo', sold: 24, revenue: 2157.60 },
        { name: 'Chicken Wings (12pc)', sold: 18, revenue: 1798.20 },
        { name: 'Coca-Cola 500ml', sold: 45, revenue: 850.50 },
        { name: 'Beef Burger Deluxe', sold: 15, revenue: 1048.50 },
        { name: 'Milkshake Chocolate', sold: 12, revenue: 418.80 },
      ],
      hourlySales: [
        { hour: '08:00', amount: 245.00 },
        { hour: '09:00', amount: 380.50 },
        { hour: '10:00', amount: 520.00 },
        { hour: '11:00', amount: 890.00 },
        { hour: '12:00', amount: 1450.00 },
        { hour: '13:00', amount: 1200.00 },
        { hour: '14:00', amount: 780.00 },
        { hour: '15:00', amount: 450.00 },
      ],
      paymentMethods: [
        { method: 'Card', count: 5, amount: 1850.00 },
        { method: 'Cash', count: 4, amount: 720.00 },
        { method: 'QR Pay', count: 2, amount: 480.00 },
        { method: 'Wallet', count: 1, amount: 150.00 },
      ],
    },
    transactions: transactions.sort((a, b) => b.time.localeCompare(a.time)),
    groSupply: {
      pendingOrders: 2,
      lastOrderDate: '2026-02-14',
      estimatedDelivery: '2026-02-17',
      savingsThisMonth: 3450,
      lowStockItems: 7,
      suggestedOrder: { items: 12, value: 15670 },
    },
    groCredit: {
      availableCredit: 75000,
      usedCredit: 25000,
      totalLimit: 100000,
      nextPaymentDate: '2026-03-15',
      nextPaymentAmount: 5250,
      creditScore: 720,
      status: 'good',
    },
    insights: [
      { id: 'INS-001', type: 'opportunity', title: 'Peak Hour Approaching', description: 'Historically, 12:00-13:00 is your busiest. Ensure adequate staff.', action: 'Schedule Staff', priority: 'high', metric: 'R1,450', change: 45 },
      { id: 'INS-002', type: 'alert', title: 'Low Stock Alert', description: '7 items are running low. Consider placing a GroSupply order.', action: 'Order Now', priority: 'high', metric: '7 items' },
      { id: 'INS-003', type: 'trend', title: 'Customer Growth', description: 'Returning customers increased by 15% this week. Loyalty program is working!', action: 'View Report', priority: 'medium', change: 15 },
      { id: 'INS-004', type: 'recommendation', title: 'GroCredit Available', description: 'R75,000 credit available. Consider investing in new equipment.', action: 'Explore Options', priority: 'low', metric: 'R75,000' },
    ],
  }
}

const paymentIcons = {
  cash: Banknote,
  card: CreditCard,
  qr: QrCode,
  wallet: Wallet,
}

const formatCurrency = (amount: number) => `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function MerchantDashboard({ verticalName, subVerticalName, onNewSale, onNavigate }: MerchantDashboardProps) {
  const [data, setData] = useState<ReturnType<typeof generateMockData> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(generateMockData())
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const refreshData = () => {
    setIsLoading(true)
    setTimeout(() => {
      setData(generateMockData())
      setIsLoading(false)
    }, 500)
  }

  if (isLoading || !data) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-[#00897B]" />
          <p className="text-[#757575]">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const { stats, transactions, groSupply, groCredit, insights } = data

  return (
    <ScrollArea className="flex-1">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Dashboard</h1>
            <p className="text-sm text-[#757575]">{subVerticalName} • {new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refreshData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={onNewSale}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              New Sale
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-[#00897B]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#757575] mb-1">Today's Sales</p>
                  <p className="text-2xl font-bold text-[#1A1A1A]">{formatCurrency(stats.todaySales)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-500">+12.5%</span>
                    <span className="text-xs text-[#757575]">vs yesterday</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#E0F2F1] flex items-center justify-center">
                  <Coins className="h-6 w-6 text-[#00897B]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#757575] mb-1">Transactions</p>
                  <p className="text-2xl font-bold text-[#1A1A1A]">{stats.todayTransactions}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-500">+3</span>
                    <span className="text-xs text-[#757575]">more today</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#757575] mb-1">Avg. Transaction</p>
                  <p className="text-2xl font-bold text-[#1A1A1A]">{formatCurrency(stats.avgTransaction)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                    <span className="text-xs text-red-500">-2.3%</span>
                    <span className="text-xs text-[#757575]">vs avg</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
                  <Package className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#757575] mb-1">Customers Today</p>
                  <p className="text-2xl font-bold text-[#1A1A1A]">{Math.floor(stats.todayTransactions * 0.8)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-[#757575]">{Math.floor(stats.todayTransactions * 0.2)} returning</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
                  <Users className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* GroSupply & GroCredit Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* GroSupply Widget */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-500" />
                  GroSupply
                </CardTitle>
                <Badge className="bg-blue-100 text-blue-700">Connected</Badge>
              </div>
              <CardDescription>Smart procurement & inventory sync</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-[#757575]">Pending Orders</p>
                  <p className="text-xl font-bold text-[#1A1A1A]">{groSupply.pendingOrders}</p>
                  <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                    <Truck className="h-3 w-3" />
                    Est. {groSupply.estimatedDelivery}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-[#757575]">Savings This Month</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(groSupply.savingsThisMonth)}</p>
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3" />
                    vs. retail prices
                  </p>
                </div>
              </div>
              
              {groSupply.lowStockItems > 0 && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <div>
                      <p className="text-sm font-medium text-amber-700">{groSupply.lowStockItems} items low on stock</p>
                      <p className="text-xs text-amber-600">Suggested order value: {formatCurrency(groSupply.suggestedOrder.value)}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button className="flex-1 bg-blue-500 hover:bg-blue-600" onClick={() => onNavigate?.('grosupply')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Quick Order
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => onNavigate?.('gromarket')}>
                  View Catalog
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* GroCredit Widget */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <PiggyBank className="h-5 w-5 text-purple-500" />
                  GroCredit
                </CardTitle>
                <Badge className={`${groCredit.status === 'good' ? 'bg-green-100 text-green-700' : groCredit.status === 'fair' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                  {groCredit.status === 'good' ? 'Good Standing' : groCredit.status === 'fair' ? 'Fair' : 'Under Review'}
                </Badge>
              </div>
              <CardDescription>Merchant capital & financing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#757575]">Credit Utilization</span>
                  <span className="font-medium">{formatCurrency(groCredit.usedCredit)} / {formatCurrency(groCredit.totalLimit)}</span>
                </div>
                <Progress value={(groCredit.usedCredit / groCredit.totalLimit) * 100} className="h-3" />
                <p className="text-xs text-[#757575] mt-1">{formatCurrency(groCredit.availableCredit)} available</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-[#757575]">Credit Score</p>
                  <p className="text-xl font-bold text-[#1A1A1A]">{groCredit.creditScore}</p>
                  <p className="text-xs text-green-600">Excellent</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-[#757575]">Next Payment</p>
                  <p className="text-xl font-bold text-[#1A1A1A]">{formatCurrency(groCredit.nextPaymentAmount)}</p>
                  <p className="text-xs text-[#757575]">{groCredit.nextPaymentDate}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button className="flex-1 bg-purple-500 hover:bg-purple-600" onClick={() => onNavigate?.('grocredit')}>
                  <Zap className="h-4 w-4 mr-2" />
                  Apply for More
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => onNavigate?.('payments')}>
                  Make Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settlement Status Card */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-green-500" />
                Settlement Status
              </CardTitle>
              <Badge className="bg-green-100 text-green-700">T+1 Active</Badge>
            </div>
            <CardDescription>Payment settlements & next payout</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Next Settlement */}
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#757575]">Next Settlement</span>
                <span className="text-xs font-medium text-green-600">Tomorrow 10:00</span>
              </div>
              <p className="text-2xl font-bold text-[#1A1A1A]">{formatCurrency(3850.00)}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600">+R850 from last settlement</span>
              </div>
            </div>
            
            {/* Settlement Breakdown */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-2 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-[#757575]">Card</p>
                <p className="text-sm font-bold text-[#1A1A1A]">{formatCurrency(2850)}</p>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-[#757575]">QR Pay</p>
                <p className="text-sm font-bold text-[#1A1A1A]">{formatCurrency(650)}</p>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-[#757575]">EFT</p>
                <p className="text-sm font-bold text-[#1A1A1A]">{formatCurrency(350)}</p>
              </div>
            </div>
            
            {/* Pending Settlements */}
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#757575]">Pending Settlements</p>
                  <p className="text-lg font-bold text-[#1A1A1A]">{formatCurrency(1250.00)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#757575]">3 transactions</p>
                  <p className="text-xs text-amber-600">Processing</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button className="flex-1 bg-green-500 hover:bg-green-600" onClick={() => onNavigate?.('transactions')}>
                View Settlements
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => onNavigate?.('accounting')}>
                Export Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Hardware & Terminals Widget */}
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-amber-500" />
                Hardware & Terminals
              </CardTitle>
              <Badge className="bg-amber-100 text-amber-700">3 Connected</Badge>
            </div>
            <CardDescription>Payment terminals, printers & devices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {/* SmartPOS */}
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  <span className="text-xs font-medium text-green-700">SmartPOS</span>
                </div>
                <p className="text-sm font-bold text-[#1A1A1A]">Gropay P9</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Online
                </p>
              </div>
              
              {/* QR Terminal */}
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <QrCode className="h-5 w-5 text-green-600" />
                  <span className="text-xs font-medium text-green-700">QR Terminal</span>
                </div>
                <p className="text-sm font-bold text-[#1A1A1A]">Gropay Y90B</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Online
                </p>
              </div>
              
              {/* Mobile Reader */}
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="h-5 w-5 text-green-600" />
                  <span className="text-xs font-medium text-green-700">mPOS Reader</span>
                </div>
                <p className="text-sm font-bold text-[#1A1A1A]">AF60S</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Online
                </p>
              </div>
            </div>
            
            {/* Quick Device Actions */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Printer className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">Receipt Printer</p>
                  <p className="text-xs text-[#757575]">Thermal 80mm</p>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Scan className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">Barcode Scanner</p>
                  <p className="text-xs text-[#757575]">2D Handheld</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                className="flex-1 bg-amber-500 hover:bg-amber-600"
                onClick={() => onNavigate?.('hardware')}
              >
                <HardDrive className="h-4 w-4 mr-2" />
                Manage Devices
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => onNavigate?.('hardware')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Device
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* GroAI Insights */}
        <Card className="border-l-4 border-l-[#00897B]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bot className="h-4 w-4 text-[#00897B]" />
              GroAI Business Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insights.map(insight => {
                const typeIcons = {
                  opportunity: Lightbulb,
                  alert: AlertCircle,
                  trend: TrendingUp,
                  recommendation: Target,
                }
                const priorityColors = {
                  high: 'border-red-200 bg-red-50',
                  medium: 'border-amber-200 bg-amber-50',
                  low: 'border-green-200 bg-green-50',
                }
                const Icon = typeIcons[insight.type]
                
                return (
                  <div key={insight.id} className={`p-3 rounded-lg border ${priorityColors[insight.priority]}`}>
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 mt-0.5 ${
                        insight.priority === 'high' ? 'text-red-600' : 
                        insight.priority === 'medium' ? 'text-amber-600' : 'text-green-600'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-medium text-sm truncate">{insight.title}</h4>
                          {insight.change !== undefined && insight.change !== 0 && (
                            <div className={`flex items-center gap-0.5 text-xs shrink-0 ${
                              insight.change > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {insight.change > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                              {Math.abs(insight.change)}%
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-[#757575] mt-1 line-clamp-2">{insight.description}</p>
                        <Button size="sm" variant="outline" className="mt-2 h-7 text-xs" onClick={() => {
                          // Map insight actions to views
                          const actionToView: Record<string, string> = {
                            'Schedule Staff': 'staff',
                            'Order Now': 'grosupply',
                            'View Report': 'transactions',
                            'Explore Options': 'grocredit',
                          }
                          const view = actionToView[insight.action]
                          if (view) onNavigate?.(view)
                        }}>
                          {insight.action}
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Hourly Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-end gap-2">
                {stats.hourlySales.map((hour, i) => {
                  const maxAmount = Math.max(...stats.hourlySales.map(h => h.amount))
                  const height = (hour.amount / maxAmount) * 100
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="text-[10px] text-[#757575]">{formatCurrency(hour.amount)}</div>
                      <div 
                        className="w-full bg-gradient-to-t from-[#00897B] to-[#4CAF50] rounded-t-sm min-h-[4px] transition-all hover:from-[#00695C] hover:to-[#388E3C] cursor-pointer"
                        style={{ height: `${height}%` }}
                      />
                      <div className="text-[10px] text-[#757575]">{hour.hour}</div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Payment Methods</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.paymentMethods.map((pm, i) => {
                const percentage = (pm.amount / stats.todaySales) * 100
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#1A1A1A]">{pm.method}</span>
                      <span className="text-[#757575]">{formatCurrency(pm.amount)}</span>
                    </div>
                    <Progress value={percentage} className="h-2 bg-gray-100" />
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Top Products Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topProducts.map((product, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#E0F2F1] flex items-center justify-center text-xs font-bold text-[#00897B]">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A1A] truncate">{product.name}</p>
                      <p className="text-xs text-[#757575]">{product.sold} sold</p>
                    </div>
                    <p className="text-sm font-semibold text-[#00897B]">{formatCurrency(product.revenue)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs text-[#00897B]" onClick={() => onNavigate?.('transactions')}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.slice(0, 5).map((txn, i) => {
                  const PaymentIcon = paymentIcons[txn.method]
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#F5F5F5] flex items-center justify-center">
                        <PaymentIcon className="h-4 w-4 text-[#757575]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1A1A1A]">
                          {txn.customer || 'Walk-in Customer'}
                        </p>
                        <p className="text-xs text-[#757575]">{txn.items} items • {txn.time}</p>
                      </div>
                      <p className="text-sm font-semibold text-green-600">+{formatCurrency(txn.amount)}</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  )
}
