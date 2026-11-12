'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  DollarSign,
  Calendar,
  Download,
  FileText,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Target,
  Award,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  ShoppingCart,
  CreditCard,
  Banknote,
  QrCode,
  Wallet,
  Printer,
  RefreshCw,
  Filter,
  ChevronRight,
  Minus,
  BarChart2,
  UserCheck,
  Timer,
  Percent,
  Layers,
  Box,
  Truck,
  Building2,
  Sparkles,
} from 'lucide-react'

// Types
interface SalesData {
  date: string
  total: number
  transactions: number
  avgBasket: number
  cash: number
  card: number
  qr: number
  wallet: number
  refunds: number
  voids: number
}

interface StaffPerformance {
  id: string
  name: string
  role: string
  hoursWorked: number
  transactions: number
  totalSales: number
  avgTransaction: number
  itemsPerHour: number
  refunds: number
  rating: number
}

interface ProductSales {
  sku: string
  name: string
  category: string
  qtySold: number
  revenue: number
  avgPrice: number
  margin: number
  velocity: 'fast' | 'normal' | 'slow' | 'dead'
  trend: number
}

interface StockReport {
  sku: string
  name: string
  category: string
  currentStock: number
  reorderPoint: number
  stockValue: number
  lastMovement: string
  turnover: number
  daysOfStock: number
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
}

interface CustomerMetric {
  id: string
  name: string
  segment: 'champion' | 'loyal' | 'potential' | 'at_risk' | 'new' | 'dormant'
  totalSpent: number
  visits: number
  avgBasket: number
  lastVisit: string
  daysSinceVisit: number
  ltv: number
  churnRisk: number
}

// Mock Data Generators
const generateSalesData = (): SalesData[] => {
  const data: SalesData[] = []
  const today = new Date()
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    
    const baseSales = isWeekend ? 15000 : 10000
    const variance = Math.random() * 5000 - 2500
    const total = baseSales + variance
    const transactions = Math.floor(total / 150 + Math.random() * 20)
    
    data.push({
      date: date.toISOString().split('T')[0],
      total: Math.round(total * 100) / 100,
      transactions,
      avgBasket: Math.round(total / transactions * 100) / 100,
      cash: Math.round(total * 0.3),
      card: Math.round(total * 0.45),
      qr: Math.round(total * 0.15),
      wallet: Math.round(total * 0.1),
      refunds: Math.round(Math.random() * 500),
      voids: Math.floor(Math.random() * 3),
    })
  }
  
  return data
}

const generateStaffPerformance = (): StaffPerformance[] => {
  const names = [
    { name: 'Thandi Zwane', role: 'Supervisor' },
    { name: 'Sipho Ndaba', role: 'Manager' },
    { name: 'Nomsa Dlamini', role: 'Cashier' },
    { name: 'Johan Botha', role: 'Cashier' },
    { name: 'Precious Mokoena', role: 'Cashier' },
    { name: 'David Khumalo', role: 'Waiter' },
  ]
  
  return names.map((n, i) => ({
    id: `STF-${String(i + 1).padStart(3, '0')}`,
    name: n.name,
    role: n.role,
    hoursWorked: 35 + Math.floor(Math.random() * 15),
    transactions: 150 + Math.floor(Math.random() * 200),
    totalSales: Math.round((25000 + Math.random() * 30000) * 100) / 100,
    avgTransaction: Math.round((100 + Math.random() * 80) * 100) / 100,
    itemsPerHour: Math.round(15 + Math.random() * 20),
    refunds: Math.floor(Math.random() * 8),
    rating: Math.round((4 + Math.random()) * 10) / 10,
  }))
}

const generateProductSales = (): ProductSales[] => {
  const products = [
    { name: 'Burger Combo', category: 'Mains', price: 89.90 },
    { name: 'Chicken Wings (12pc)', category: 'Mains', price: 99.90 },
    { name: 'Beef Burger Deluxe', category: 'Mains', price: 69.90 },
    { name: 'Coca-Cola 500ml', category: 'Beverages', price: 18.90 },
    { name: 'Fries Large', category: 'Sides', price: 34.90 },
    { name: 'Milkshake Chocolate', category: 'Beverages', price: 34.90 },
    { name: 'Onion Rings', category: 'Sides', price: 29.90 },
    { name: 'Garden Salad', category: 'Sides', price: 44.90 },
    { name: 'Veggie Wrap', category: 'Mains', price: 59.90 },
    { name: 'Ice Cream Sundae', category: 'Desserts', price: 39.90 },
    { name: 'Espresso', category: 'Beverages', price: 22.90 },
    { name: 'Cappuccino', category: 'Beverages', price: 32.90 },
    { name: 'Fresh Juice', category: 'Beverages', price: 28.90 },
    { name: 'Cheesecake Slice', category: 'Desserts', price: 49.90 },
    { name: 'Fish & Chips', category: 'Mains', price: 79.90 },
  ]
  
  return products.map((p, i) => {
    const qtySold = Math.floor(Math.random() * 300) + 20
    const revenue = qtySold * p.price
    const margin = 40 + Math.random() * 30
    const trend = Math.random() * 40 - 20
    const velocityScore = qtySold / 30
    
    return {
      sku: `SKU-${String(i + 1).padStart(4, '0')}`,
      name: p.name,
      category: p.category,
      qtySold,
      revenue: Math.round(revenue * 100) / 100,
      avgPrice: p.price,
      margin: Math.round(margin * 10) / 10,
      velocity: velocityScore > 8 ? 'fast' : velocityScore > 4 ? 'normal' : velocityScore > 1 ? 'slow' : 'dead',
      trend: Math.round(trend * 10) / 10,
    }
  })
}

const generateStockReport = (): StockReport[] => {
  const products = [
    { name: 'Beef Patty (frozen)', category: 'Ingredients', stock: 150, unit: 'pcs' },
    { name: 'Chicken Wings', category: 'Ingredients', stock: 80, unit: 'kg' },
    { name: 'Burger Buns', category: 'Ingredients', stock: 200, unit: 'pcs' },
    { name: 'Coca-Cola 500ml', category: 'Beverages', stock: 48, unit: 'bottles' },
    { name: 'Potatoes (10kg)', category: 'Ingredients', stock: 5, unit: 'bags' },
    { name: 'Cooking Oil (5L)', category: 'Ingredients', stock: 12, unit: 'bottles' },
    { name: 'Cheddar Cheese', category: 'Ingredients', stock: 8, unit: 'kg' },
    { name: 'Lettuce', category: 'Fresh Produce', stock: 15, unit: 'heads' },
    { name: 'Tomatoes', category: 'Fresh Produce', stock: 0, unit: 'kg' },
    { name: 'Onions', category: 'Fresh Produce', stock: 25, unit: 'kg' },
    { name: 'Ice Cream (5L)', category: 'Desserts', stock: 3, unit: 'tubs' },
    { name: 'Coffee Beans', category: 'Beverages', stock: 6, unit: 'kg' },
  ]
  
  return products.map((p, i) => {
    const reorderPoint = 20 + Math.floor(Math.random() * 30)
    const status = p.stock === 0 ? 'out_of_stock' : p.stock < reorderPoint ? 'low_stock' : 'in_stock'
    
    return {
      sku: `INV-${String(i + 1).padStart(4, '0')}`,
      name: p.name,
      category: p.category,
      currentStock: p.stock,
      reorderPoint,
      stockValue: Math.round(p.stock * (10 + Math.random() * 50) * 100) / 100,
      lastMovement: `${Math.floor(Math.random() * 5) + 1} days ago`,
      turnover: Math.round((2 + Math.random() * 8) * 10) / 10,
      daysOfStock: p.stock > 0 ? Math.floor(p.stock / 5) + 3 : 0,
      status,
    }
  })
}

const generateCustomerMetrics = (): CustomerMetric[] => {
  const segments: CustomerMetric['segment'][] = ['champion', 'loyal', 'potential', 'at_risk', 'new', 'dormant']
  const firstNames = ['John', 'Sarah', 'Thabo', 'Lisa', 'Mike', 'Nomsa', 'David', 'Precious', 'Johan', 'Thandi', 'Sipho', 'Maria', 'Peter', 'Grace', 'Samuel']
  const lastNames = ['Doe', 'Smith', 'Khumalo', 'Johnson', 'Williams', 'Ndaba', 'Botha', 'Mokoena', 'van der Berg', 'Zwane', 'Naidoo', 'Peters', 'van Wyk', 'Mahlangu', 'Nkosi']
  
  return Array.from({ length: 50 }, (_, i) => {
    const segment = segments[Math.floor(Math.random() * segments.length)]
    const visits = segment === 'champion' ? 30 + Math.floor(Math.random() * 40) :
                   segment === 'loyal' ? 15 + Math.floor(Math.random() * 20) :
                   segment === 'potential' ? 5 + Math.floor(Math.random() * 10) :
                   segment === 'at_risk' ? 3 + Math.floor(Math.random() * 5) :
                   segment === 'new' ? 1 + Math.floor(Math.random() * 3) : 0
    
    const totalSpent = visits * (100 + Math.random() * 200)
    const daysSinceVisit = segment === 'dormant' ? 60 + Math.floor(Math.random() * 100) :
                          segment === 'at_risk' ? 30 + Math.floor(Math.random() * 30) :
                          Math.floor(Math.random() * 14)
    
    return {
      id: `CUS-${String(i + 1).padStart(4, '0')}`,
      name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
      segment,
      totalSpent: Math.round(totalSpent * 100) / 100,
      visits,
      avgBasket: Math.round(totalSpent / visits * 100) / 100,
      lastVisit: new Date(Date.now() - daysSinceVisit * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      daysSinceVisit,
      ltv: Math.round(totalSpent * (1 + Math.random() * 2)),
      churnRisk: segment === 'at_risk' ? 60 + Math.floor(Math.random() * 30) :
                 segment === 'dormant' ? 90 :
                 segment === 'potential' ? 20 + Math.floor(Math.random() * 20) :
                 Math.floor(Math.random() * 20),
    }
  })
}

// Format helpers
const formatCurrency = (amount: number) => `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const formatPercent = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`

const segmentColors: Record<CustomerMetric['segment'], string> = {
  champion: 'bg-purple-100 text-purple-700',
  loyal: 'bg-green-100 text-green-700',
  potential: 'bg-blue-100 text-blue-700',
  at_risk: 'bg-orange-100 text-orange-700',
  new: 'bg-cyan-100 text-cyan-700',
  dormant: 'bg-gray-100 text-gray-700',
}

const velocityColors: Record<ProductSales['velocity'], string> = {
  fast: 'bg-green-100 text-green-700',
  normal: 'bg-blue-100 text-blue-700',
  slow: 'bg-orange-100 text-orange-700',
  dead: 'bg-red-100 text-red-700',
}

const statusColors: Record<StockReport['status'], string> = {
  in_stock: 'bg-green-100 text-green-700',
  low_stock: 'bg-orange-100 text-orange-700',
  out_of_stock: 'bg-red-100 text-red-700',
}

export function ReportsView() {
  const [activeTab, setActiveTab] = useState('sales')
  const [periodFilter, setPeriodFilter] = useState('30')
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  
  // Data
  const salesData = useMemo(() => generateSalesData(), [])
  const staffPerformance = useMemo(() => generateStaffPerformance(), [])
  const productSales = useMemo(() => generateProductSales(), [])
  const stockReport = useMemo(() => generateStockReport(), [])
  const customerMetrics = useMemo(() => generateCustomerMetrics(), [])
  
  // Filtered data
  const filteredSalesData = useMemo(() => {
    const days = parseInt(periodFilter)
    return salesData.slice(-days)
  }, [salesData, periodFilter])
  
  // Summary stats
  const salesStats = useMemo(() => {
    const total = filteredSalesData.reduce((sum, d) => sum + d.total, 0)
    const transactions = filteredSalesData.reduce((sum, d) => sum + d.transactions, 0)
    const avgBasket = total / transactions
    const lastDay = filteredSalesData[filteredSalesData.length - 1]
    const prevDay = filteredSalesData[filteredSalesData.length - 2]
    const dayOverDay = lastDay && prevDay ? ((lastDay.total - prevDay.total) / prevDay.total) * 100 : 0
    
    return {
      total,
      transactions,
      avgBasket,
      dayOverDay,
      cashTotal: filteredSalesData.reduce((sum, d) => sum + d.cash, 0),
      cardTotal: filteredSalesData.reduce((sum, d) => sum + d.card, 0),
      qrTotal: filteredSalesData.reduce((sum, d) => sum + d.qr, 0),
      walletTotal: filteredSalesData.reduce((sum, d) => sum + d.wallet, 0),
      refundsTotal: filteredSalesData.reduce((sum, d) => sum + d.refunds, 0),
    }
  }, [filteredSalesData])
  
  const staffStats = useMemo(() => {
    const totalHours = staffPerformance.reduce((sum, s) => sum + s.hoursWorked, 0)
    const totalSales = staffPerformance.reduce((sum, s) => sum + s.totalSales, 0)
    const avgRating = staffPerformance.reduce((sum, s) => sum + s.rating, 0) / staffPerformance.length
    
    return { totalHours, totalSales, avgRating, staffCount: staffPerformance.length }
  }, [staffPerformance])
  
  const productStats = useMemo(() => {
    const totalRevenue = productSales.reduce((sum, p) => sum + p.revenue, 0)
    const totalQty = productSales.reduce((sum, p) => sum + p.qtySold, 0)
    const avgMargin = productSales.reduce((sum, p) => sum + p.margin, 0) / productSales.length
    const fastMovers = productSales.filter(p => p.velocity === 'fast').length
    const deadStock = productSales.filter(p => p.velocity === 'dead').length
    
    return { totalRevenue, totalQty, avgMargin, fastMovers, deadStock, productCount: productSales.length }
  }, [productSales])
  
  const stockStats = useMemo(() => {
    const totalValue = stockReport.reduce((sum, s) => sum + s.stockValue, 0)
    const lowStock = stockReport.filter(s => s.status === 'low_stock').length
    const outOfStock = stockReport.filter(s => s.status === 'out_of_stock').length
    const avgTurnover = stockReport.reduce((sum, s) => sum + s.turnover, 0) / stockReport.length
    
    return { totalValue, lowStock, outOfStock, avgTurnover, itemCount: stockReport.length }
  }, [stockReport])
  
  const customerStats = useMemo(() => {
    const totalRevenue = customerMetrics.reduce((sum, c) => sum + c.totalSpent, 0)
    const avgLtv = customerMetrics.reduce((sum, c) => sum + c.ltv, 0) / customerMetrics.length
    const atRisk = customerMetrics.filter(c => c.segment === 'at_risk' || c.segment === 'dormant').length
    const champions = customerMetrics.filter(c => c.segment === 'champion').length
    
    return { totalRevenue, avgLtv, atRisk, champions, customerCount: customerMetrics.length }
  }, [customerMetrics])

  // Render Sales Reports
  const renderSalesReports = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-[#00897B]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Total Sales</p>
                <p className="text-xl font-bold text-[#1A1A1A]">{formatCurrency(salesStats.total)}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#E0F2F1] flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-[#00897B]" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              {salesStats.dayOverDay >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-600" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-600" />
              )}
              <span className={`text-xs ${salesStats.dayOverDay >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(salesStats.dayOverDay)} vs yesterday
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Transactions</p>
                <p className="text-xl font-bold text-[#1A1A1A]">{salesStats.transactions.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Avg Basket</p>
                <p className="text-xl font-bold text-[#1A1A1A]">{formatCurrency(salesStats.avgBasket)}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Refunds</p>
                <p className="text-xl font-bold text-orange-600">{formatCurrency(salesStats.refundsTotal)}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Net Revenue</p>
                <p className="text-xl font-bold text-[#00897B]">{formatCurrency(salesStats.total - salesStats.refundsTotal)}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Payment Methods Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#00897B]" />
              Payment Methods Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Card', value: salesStats.cardTotal, icon: CreditCard, color: 'bg-blue-500' },
                { label: 'Cash', value: salesStats.cashTotal, icon: Banknote, color: 'bg-green-500' },
                { label: 'QR Pay', value: salesStats.qrTotal, icon: QrCode, color: 'bg-purple-500' },
                { label: 'Wallet', value: salesStats.walletTotal, icon: Wallet, color: 'bg-orange-500' },
              ].map((method) => {
                const percent = (method.value / salesStats.total) * 100
                return (
                  <div key={method.label}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <method.icon className="h-4 w-4 text-[#757575]" />
                        <span className="text-sm">{method.label}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">{formatCurrency(method.value)}</span>
                        <span className="text-[#757575] ml-2">({percent.toFixed(1)}%)</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${method.color} rounded-full transition-all`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
        
        {/* Daily Sales Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-[#00897B]" />
              Daily Sales Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end gap-1">
              {filteredSalesData.slice(-14).map((day, i) => {
                const height = (day.total / Math.max(...filteredSalesData.map(d => d.total))) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-[#00897B] rounded-t transition-all hover:bg-[#00695C] cursor-pointer"
                      style={{ height: `${height}%` }}
                      title={`${day.date}: ${formatCurrency(day.total)}`}
                    />
                    {i % 2 === 0 && (
                      <span className="text-[10px] text-[#757575] -rotate-45 origin-center">
                        {new Date(day.date).getDate()}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Sales by Hour Report */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#00897B]" />
            Sales by Hour (Typical Day)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-12 gap-2">
            {[
              { hour: '08:00', sales: 1200 },
              { hour: '09:00', sales: 2800 },
              { hour: '10:00', sales: 3500 },
              { hour: '11:00', sales: 4200 },
              { hour: '12:00', sales: 8500 },
              { hour: '13:00', sales: 9200 },
              { hour: '14:00', sales: 6500 },
              { hour: '15:00', sales: 4800 },
              { hour: '16:00', sales: 5200 },
              { hour: '17:00', sales: 7800 },
              { hour: '18:00', sales: 8200 },
              { hour: '19:00', sales: 5500 },
            ].map((slot) => {
              const maxSales = 9200
              const height = (slot.sales / maxSales) * 100
              return (
                <div key={slot.hour} className="flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-gradient-to-t from-[#00897B] to-[#4DB6AC] rounded-t transition-all hover:from-[#00695C] hover:to-[#00897B] cursor-pointer"
                    style={{ height: `${Math.max(height, 10)}px` }}
                    title={`${slot.hour}: ${formatCurrency(slot.sales)}`}
                  />
                  <span className="text-[9px] text-[#757575]">{slot.hour.split(':')[0]}</span>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-3 text-xs text-[#757575]">
            <span>Peak: 13:00 (R9,200)</span>
            <span>Lunch rush: 11:00-14:00</span>
            <span>Dinner rush: 17:00-19:00</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Detailed Sales Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Daily Sales Detail</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-3 w-3 mr-1" /> Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium text-[#757575]">Date</th>
                  <th className="text-right py-2 px-2 font-medium text-[#757575]">Total</th>
                  <th className="text-right py-2 px-2 font-medium text-[#757575]">Txns</th>
                  <th className="text-right py-2 px-2 font-medium text-[#757575]">Avg Basket</th>
                  <th className="text-right py-2 px-2 font-medium text-[#757575]">Cash</th>
                  <th className="text-right py-2 px-2 font-medium text-[#757575]">Card</th>
                  <th className="text-right py-2 px-2 font-medium text-[#757575]">QR</th>
                  <th className="text-right py-2 px-2 font-medium text-[#757575]">Refunds</th>
                </tr>
              </thead>
              <tbody>
                {filteredSalesData.slice(-10).reverse().map((day, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50 cursor-pointer">
                    <td className="py-2 px-2">{day.date}</td>
                    <td className="py-2 px-2 text-right font-medium">{formatCurrency(day.total)}</td>
                    <td className="py-2 px-2 text-right">{day.transactions}</td>
                    <td className="py-2 px-2 text-right">{formatCurrency(day.avgBasket)}</td>
                    <td className="py-2 px-2 text-right">{formatCurrency(day.cash)}</td>
                    <td className="py-2 px-2 text-right">{formatCurrency(day.card)}</td>
                    <td className="py-2 px-2 text-right">{formatCurrency(day.qr)}</td>
                    <td className="py-2 px-2 text-right text-orange-600">{formatCurrency(day.refunds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Render Staff Performance Reports
  const renderStaffReports = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#00897B]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Total Staff</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">{staffStats.staffCount}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#E0F2F1] flex items-center justify-center">
                <Users className="h-5 w-5 text-[#00897B]" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Total Hours</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">{staffStats.totalHours}h</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Timer className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Sales Generated</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">{formatCurrency(staffStats.totalSales)}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Avg Rating</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">{staffStats.avgRating.toFixed(1)}⭐</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center">
                <Award className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Staff Leaderboard */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="h-4 w-4 text-[#00897B]" />
            Sales Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {staffPerformance
              .sort((a, b) => b.totalSales - a.totalSales)
              .slice(0, 5)
              .map((staff, i) => {
                const rankColors = ['bg-yellow-500', 'bg-gray-400', 'bg-amber-600', 'bg-blue-400', 'bg-green-400']
                return (
                  <div key={staff.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                    <div className={`w-8 h-8 rounded-full ${rankColors[i]} flex items-center justify-center text-white font-bold text-sm`}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{staff.name}</p>
                        <Badge variant="outline">{staff.role}</Badge>
                      </div>
                      <p className="text-xs text-[#757575]">{staff.transactions} transactions • {staff.hoursWorked}h worked</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#00897B]">{formatCurrency(staff.totalSales)}</p>
                      <p className="text-xs text-[#757575]">{formatCurrency(staff.avgTransaction)} avg</p>
                    </div>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>
      
      {/* Performance Metrics Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Staff Performance Detail</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-3 w-3 mr-1" /> Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium text-[#757575]">Staff</th>
                  <th className="text-left py-2 px-2 font-medium text-[#757575]">Role</th>
                  <th className="text-right py-2 px-2 font-medium text-[#757575]">Hours</th>
                  <th className="text-right py-2 px-2 font-medium text-[#757575]">Txns</th>
                  <th className="text-right py-2 px-2 font-medium text-[#757575]">Sales</th>
                  <th className="text-right py-2 px-2 font-medium text-[#757575]">Avg Txn</th>
                  <th className="text-right py-2 px-2 font-medium text-[#757575]">Items/Hr</th>
                  <th className="text-right py-2 px-2 font-medium text-[#757575]">Rating</th>
                </tr>
              </thead>
              <tbody>
                {staffPerformance.map((staff) => (
                  <tr key={staff.id} className="border-b hover:bg-gray-50 cursor-pointer">
                    <td className="py-2 px-2 font-medium">{staff.name}</td>
                    <td className="py-2 px-2">
                      <Badge variant="outline" className="text-xs">{staff.role}</Badge>
                    </td>
                    <td className="py-2 px-2 text-right">{staff.hoursWorked}h</td>
                    <td className="py-2 px-2 text-right">{staff.transactions}</td>
                    <td className="py-2 px-2 text-right font-medium text-[#00897B]">{formatCurrency(staff.totalSales)}</td>
                    <td className="py-2 px-2 text-right">{formatCurrency(staff.avgTransaction)}</td>
                    <td className="py-2 px-2 text-right">{staff.itemsPerHour}</td>
                    <td className="py-2 px-2 text-right">
                      <span className={staff.rating >= 4.5 ? 'text-green-600' : staff.rating >= 4 ? 'text-blue-600' : 'text-orange-600'}>
                        {staff.rating}⭐
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Sales per Hour by Staff */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#00897B]" />
              Productivity (Items/Hour)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {staffPerformance
                .sort((a, b) => b.itemsPerHour - a.itemsPerHour)
                .slice(0, 6)
                .map((staff) => {
                  const maxItems = Math.max(...staffPerformance.map(s => s.itemsPerHour))
                  const width = (staff.itemsPerHour / maxItems) * 100
                  return (
                    <div key={staff.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{staff.name}</span>
                        <span className="font-medium">{staff.itemsPerHour} items/hr</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00897B] rounded-full" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-[#00897B]" />
              Refunds Processed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {staffPerformance
                .sort((a, b) => b.refunds - a.refunds)
                .slice(0, 6)
                .map((staff) => {
                  const refundRate = (staff.refunds / staff.transactions) * 100
                  return (
                    <div key={staff.id} className="flex items-center justify-between p-2 rounded border">
                      <div>
                        <p className="text-sm font-medium">{staff.name}</p>
                        <p className="text-xs text-[#757575]">{staff.transactions} transactions</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{staff.refunds} refunds</p>
                        <p className={`text-xs ${refundRate > 3 ? 'text-red-600' : 'text-[#757575]'}`}>
                          {refundRate.toFixed(1)}% rate
                        </p>
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Render Product Reports
  const renderProductReports = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-[#00897B]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Total Revenue</p>
                <p className="text-xl font-bold text-[#1A1A1A]">{formatCurrency(productStats.totalRevenue)}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#E0F2F1] flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-[#00897B]" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Units Sold</p>
                <p className="text-xl font-bold text-[#1A1A1A]">{productStats.totalQty.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Avg Margin</p>
                <p className="text-xl font-bold text-[#1A1A1A]">{productStats.avgMargin.toFixed(1)}%</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <Percent className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Fast Movers</p>
                <p className="text-xl font-bold text-green-600">{productStats.fastMovers}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Dead Stock</p>
                <p className="text-xl font-bold text-red-600">{productStats.deadStock}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#00897B]" />
              Top 10 Products by Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {productSales
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 10)
                .map((product, i) => {
                  const maxRevenue = Math.max(...productSales.map(p => p.revenue))
                  const width = (product.revenue / maxRevenue) * 100
                  return (
                    <div key={product.sku} className="flex items-center gap-3">
                      <span className="w-6 text-xs text-[#757575]">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium truncate">{product.name}</span>
                          <span className="font-medium">{formatCurrency(product.revenue)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#00897B] rounded-full" style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#00897B]" />
              Sales by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const categories = productSales.reduce((acc, p) => {
                acc[p.category] = (acc[p.category] || 0) + p.revenue
                return acc
              }, {} as Record<string, number>)
              
              const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1])
              const total = sorted.reduce((sum, [, val]) => sum + val, 0)
              const colors = ['bg-[#00897B]', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500']
              
              return (
                <div className="space-y-3">
                  {/* Pie chart visualization */}
                  <div className="flex h-4 rounded-full overflow-hidden">
                    {sorted.map(([, value], i) => (
                      <div
                        key={i}
                        className={`${colors[i % colors.length]}`}
                        style={{ width: `${(value / total) * 100}%` }}
                      />
                    ))}
                  </div>
                  
                  {/* Legend */}
                  <div className="grid grid-cols-2 gap-2">
                    {sorted.map(([category, value], i) => (
                      <div key={category} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${colors[i % colors.length]}`} />
                        <span className="text-sm flex-1">{category}</span>
                        <span className="text-sm font-medium">{formatCurrency(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      </div>
      
      {/* Product Performance Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Product Performance Detail</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-3 w-3 mr-1" /> Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium text-[#757575]">Product</th>
                  <th className="text-left py-2 px-2 font-medium text-[#757575]">Category</th>
                  <th className="text-right py-2 px-2 font-medium text-[#757575]">Qty Sold</th>
                  <th className="text-right py-2 px-2 font-medium text-[#757575]">Revenue</th>
                  <th className="text-right py-2 px-2 font-medium text-[#757575]">Avg Price</th>
                  <th className="text-right py-2 px-2 font-medium text-[#757575]">Margin</th>
                  <th className="text-left py-2 px-2 font-medium text-[#757575]">Velocity</th>
                  <th className="text-right py-2 px-2 font-medium text-[#757575]">Trend</th>
                </tr>
              </thead>
              <tbody>
                {productSales.sort((a, b) => b.revenue - a.revenue).map((product) => (
                  <tr key={product.sku} className="border-b hover:bg-gray-50 cursor-pointer">
                    <td className="py-2 px-2">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-[#757575]">{product.sku}</p>
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <Badge variant="outline" className="text-xs">{product.category}</Badge>
                    </td>
                    <td className="py-2 px-2 text-right">{product.qtySold}</td>
                    <td className="py-2 px-2 text-right font-medium">{formatCurrency(product.revenue)}</td>
                    <td className="py-2 px-2 text-right">{formatCurrency(product.avgPrice)}</td>
                    <td className="py-2 px-2 text-right">
                      <span className={product.margin >= 50 ? 'text-green-600' : product.margin >= 30 ? 'text-blue-600' : 'text-orange-600'}>
                        {product.margin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <Badge className={velocityColors[product.velocity]}>{product.velocity}</Badge>
                    </td>
                    <td className="py-2 px-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {product.trend > 0 ? (
                          <ArrowUpRight className="h-3 w-3 text-green-600" />
                        ) : product.trend < 0 ? (
                          <ArrowDownRight className="h-3 w-3 text-red-600" />
                        ) : (
                          <Minus className="h-3 w-3 text-gray-400" />
                        )}
                        <span className={product.trend > 0 ? 'text-green-600' : product.trend < 0 ? 'text-red-600' : 'text-gray-500'}>
                          {formatPercent(product.trend)}
                        </span>
                      </div>
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

  // Render Stock Reports
  const renderStockReports = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-[#00897B]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Stock Value</p>
                <p className="text-xl font-bold text-[#1A1A1A]">{formatCurrency(stockStats.totalValue)}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#E0F2F1] flex items-center justify-center">
                <Box className="h-5 w-5 text-[#00897B]" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">SKUs Tracked</p>
                <p className="text-xl font-bold text-[#1A1A1A]">{stockStats.itemCount}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Layers className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Low Stock</p>
                <p className="text-xl font-bold text-orange-600">{stockStats.lowStock}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Out of Stock</p>
                <p className="text-xl font-bold text-red-600">{stockStats.outOfStock}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Avg Turnover</p>
                <p className="text-xl font-bold text-[#1A1A1A]">{stockStats.avgTurnover.toFixed(1)}x</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Stock Alerts */}
      {(stockStats.lowStock > 0 || stockStats.outOfStock > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium text-orange-800">Stock Attention Required</p>
                <p className="text-sm text-orange-700 mt-1">
                  {stockStats.outOfStock > 0 && `${stockStats.outOfStock} items are out of stock. `}
                  {stockStats.lowStock > 0 && `${stockStats.lowStock} items are below reorder point. `}
                  Review and place orders to avoid lost sales.
                </p>
              </div>
              <Button size="sm" className="ml-auto bg-orange-600 hover:bg-orange-700">
                <Truck className="h-4 w-4 mr-1" /> Order Stock
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Stock Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <PieChart className="h-4 w-4 text-[#00897B]" />
              Stock Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const inStock = stockReport.filter(s => s.status === 'in_stock').length
              const lowStock = stockReport.filter(s => s.status === 'low_stock').length
              const outOfStock = stockReport.filter(s => s.status === 'out_of_stock').length
              const total = stockReport.length
              
              return (
                <div className="space-y-4">
                  <div className="flex h-6 rounded-full overflow-hidden">
                    <div className="bg-green-500" style={{ width: `${(inStock / total) * 100}%` }} />
                    <div className="bg-orange-500" style={{ width: `${(lowStock / total) * 100}%` }} />
                    <div className="bg-red-500" style={{ width: `${(outOfStock / total) * 100}%` }} />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-1">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-lg font-bold text-green-600">{inStock}</p>
                      <p className="text-xs text-[#757575]">In Stock</p>
                    </div>
                    <div className="text-center">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-1">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                      </div>
                      <p className="text-lg font-bold text-orange-600">{lowStock}</p>
                      <p className="text-xs text-[#757575]">Low Stock</p>
                    </div>
                    <div className="text-center">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-1">
                        <XCircle className="h-4 w-4 text-red-600" />
                      </div>
                      <p className="text-lg font-bold text-red-600">{outOfStock}</p>
                      <p className="text-xs text-[#757575]">Out of Stock</p>
                    </div>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#00897B]" />
              Days of Stock Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stockReport
                .filter(s => s.status !== 'in_stock')
                .sort((a, b) => a.daysOfStock - b.daysOfStock)
                .slice(0, 5)
                .map((item) => (
                  <div key={item.sku} className="flex items-center justify-between p-2 rounded border">
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-[#757575]">Current: {item.currentStock} units</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${item.daysOfStock === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                        {item.daysOfStock === 0 ? 'OUT' : `${item.daysOfStock}d`}
                      </p>
                      <p className="text-xs text-[#757575]">days left</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Stock Report Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Stock Valuation Report</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-3 w-3 mr-1" /> Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium text-[#757575]">Item</th>
                  <th className="text-left py-2 px-2 font-medium text-[#757575]">Category</th>
                  <th className="text-right py-2 px-2 font-medium text-[#757575]">Stock</th>
                  <th className="text-right py-2 px-2 font-medium text-[#757575]">Reorder Pt</th>
                  <th className="text-right py-2 px-2 font-medium text-[#757575]">Value</th>
                  <th className="text-right py-2 px-2 font-medium text-[#757575]">Turnover</th>
                  <th className="text-right py-2 px-2 font-medium text-[#757575]">Days Left</th>
                  <th className="text-left py-2 px-2 font-medium text-[#757575]">Status</th>
                </tr>
              </thead>
              <tbody>
                {stockReport.map((item) => (
                  <tr key={item.sku} className="border-b hover:bg-gray-50 cursor-pointer">
                    <td className="py-2 px-2">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-[#757575]">{item.sku}</p>
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <Badge variant="outline" className="text-xs">{item.category}</Badge>
                    </td>
                    <td className="py-2 px-2 text-right">{item.currentStock}</td>
                    <td className="py-2 px-2 text-right">{item.reorderPoint}</td>
                    <td className="py-2 px-2 text-right font-medium">{formatCurrency(item.stockValue)}</td>
                    <td className="py-2 px-2 text-right">{item.turnover}x</td>
                    <td className="py-2 px-2 text-right">
                      <span className={item.daysOfStock < 7 ? 'text-red-600 font-medium' : ''}>
                        {item.daysOfStock}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <Badge className={statusColors[item.status]}>
                        {item.status.replace('_', ' ')}
                      </Badge>
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

  // Render Customer Reports
  const renderCustomerReports = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-[#00897B]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Total Customers</p>
                <p className="text-xl font-bold text-[#1A1A1A]">{customerStats.customerCount}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#E0F2F1] flex items-center justify-center">
                <Users className="h-5 w-5 text-[#00897B]" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Total Revenue</p>
                <p className="text-xl font-bold text-[#1A1A1A]">{formatCurrency(customerStats.totalRevenue)}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Avg LTV</p>
                <p className="text-xl font-bold text-[#1A1A1A]">{formatCurrency(customerStats.avgLtv)}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Champions</p>
                <p className="text-xl font-bold text-purple-600">{customerStats.champions}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">At Risk</p>
                <p className="text-xl font-bold text-orange-600">{customerStats.atRisk}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Segment Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <PieChart className="h-4 w-4 text-[#00897B]" />
              Customer Segmentation (RFM)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const segments = customerMetrics.reduce((acc, c) => {
                acc[c.segment] = (acc[c.segment] || 0) + 1
                return acc
              }, {} as Record<string, number>)
              
              const sorted = Object.entries(segments).sort((a, b) => b[1] - a[1])
              const total = sorted.reduce((sum, [, val]) => sum + val, 0)
              
              return (
                <div className="space-y-3">
                  {sorted.map(([segment, count]) => {
                    const percent = (count / total) * 100
                    const segmentLabels: Record<string, string> = {
                      champion: 'Champions',
                      loyal: 'Loyal Customers',
                      potential: 'Potential Loyalists',
                      at_risk: 'At Risk',
                      new: 'New Customers',
                      dormant: 'Dormant',
                    }
                    
                    return (
                      <div key={segment}>
                        <div className="flex justify-between text-sm mb-1">
                          <div className="flex items-center gap-2">
                            <Badge className={segmentColors[segment as CustomerMetric['segment']]}>
                              {segmentLabels[segment]}
                            </Badge>
                          </div>
                          <span>{count} ({percent.toFixed(1)}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              segment === 'champion' ? 'bg-purple-500' :
                              segment === 'loyal' ? 'bg-green-500' :
                              segment === 'potential' ? 'bg-blue-500' :
                              segment === 'at_risk' ? 'bg-orange-500' :
                              segment === 'new' ? 'bg-cyan-500' : 'bg-gray-400'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#00897B]" />
              Churn Risk Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const low = customerMetrics.filter(c => c.churnRisk < 30).length
              const medium = customerMetrics.filter(c => c.churnRisk >= 30 && c.churnRisk < 60).length
              const high = customerMetrics.filter(c => c.churnRisk >= 60).length
              const total = customerMetrics.length
              
              return (
                <div className="space-y-4">
                  <div className="flex h-6 rounded-full overflow-hidden">
                    <div className="bg-green-500" style={{ width: `${(low / total) * 100}%` }} />
                    <div className="bg-orange-500" style={{ width: `${(medium / total) * 100}%` }} />
                    <div className="bg-red-500" style={{ width: `${(high / total) * 100}%` }} />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 rounded-lg bg-green-50">
                      <p className="text-2xl font-bold text-green-600">{low}</p>
                      <p className="text-xs text-[#757575]">Low Risk (&lt;30%)</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-orange-50">
                      <p className="text-2xl font-bold text-orange-600">{medium}</p>
                      <p className="text-xs text-[#757575]">Medium (30-60%)</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-red-50">
                      <p className="text-2xl font-bold text-red-600">{high}</p>
                      <p className="text-xs text-[#757575]">High Risk (&gt;60%)</p>
                    </div>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      </div>
      
      {/* Top Customers & At Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Award className="h-4 w-4 text-[#00897B]" />
              Top 10 Customers by LTV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {customerMetrics
                .sort((a, b) => b.ltv - a.ltv)
                .slice(0, 10)
                .map((customer, i) => (
                  <div key={customer.id} className="flex items-center gap-3 p-2 rounded border">
                    <span className="w-6 h-6 rounded-full bg-[#00897B] text-white flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{customer.name}</p>
                      <p className="text-xs text-[#757575]">{customer.visits} visits</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#00897B]">{formatCurrency(customer.ltv)}</p>
                      <Badge className={segmentColors[customer.segment]}>{customer.segment}</Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              Customers At Risk (Win-back)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {customerMetrics
                .filter(c => c.segment === 'at_risk' || c.segment === 'dormant')
                .sort((a, b) => b.churnRisk - a.churnRisk)
                .slice(0, 10)
                .map((customer) => (
                  <div key={customer.id} className="flex items-center gap-3 p-2 rounded border border-orange-200 bg-orange-50">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{customer.name}</p>
                      <p className="text-xs text-[#757575]">Last visit: {customer.daysSinceVisit} days ago</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(customer.totalSpent)} spent</p>
                      <Badge className="bg-red-100 text-red-700">{customer.churnRisk}% churn</Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Customer Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Customer Analytics Detail</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-3 w-3 mr-1" /> Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium text-[#757575]">Customer</th>
                  <th className="text-left py-2 px-2 font-medium text-[#757575]">Segment</th>
                  <th className="text-right py-2 px-2 font-medium text-[#757575]">Total Spent</th>
                  <th className="text-right py-2 px-2 font-medium text-[#757575]">Visits</th>
                  <th className="text-right py-2 px-2 font-medium text-[#757575]">Avg Basket</th>
                  <th className="text-right py-2 px-2 font-medium text-[#757575]">LTV</th>
                  <th className="text-right py-2 px-2 font-medium text-[#757575]">Churn Risk</th>
                </tr>
              </thead>
              <tbody>
                {customerMetrics.slice(0, 30).map((customer) => (
                  <tr key={customer.id} className="border-b hover:bg-gray-50 cursor-pointer">
                    <td className="py-2 px-2">
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-xs text-[#757575]">{customer.id}</p>
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <Badge className={segmentColors[customer.segment]}>{customer.segment}</Badge>
                    </td>
                    <td className="py-2 px-2 text-right font-medium">{formatCurrency(customer.totalSpent)}</td>
                    <td className="py-2 px-2 text-right">{customer.visits}</td>
                    <td className="py-2 px-2 text-right">{formatCurrency(customer.avgBasket)}</td>
                    <td className="py-2 px-2 text-right font-medium text-[#00897B]">{formatCurrency(customer.ltv)}</td>
                    <td className="py-2 px-2 text-right">
                      <span className={`font-medium ${customer.churnRisk >= 60 ? 'text-red-600' : customer.churnRisk >= 30 ? 'text-orange-600' : 'text-green-600'}`}>
                        {customer.churnRisk}%
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

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-[#00897B]" />
              Reports & Analytics
            </h1>
            <p className="text-sm text-[#757575]">Comprehensive business intelligence and reporting</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" /> Export All
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Export to CSV</DropdownMenuItem>
                <DropdownMenuItem>Export to PDF</DropdownMenuItem>
                <DropdownMenuItem>Export to Excel</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
          </div>
        </div>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent p-0 h-auto">
            <TabsTrigger value="sales" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <DollarSign className="h-4 w-4 mr-2" /> Sales
            </TabsTrigger>
            <TabsTrigger value="staff" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Users className="h-4 w-4 mr-2" /> Staff
            </TabsTrigger>
            <TabsTrigger value="products" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Package className="h-4 w-4 mr-2" /> Products
            </TabsTrigger>
            <TabsTrigger value="stock" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Box className="h-4 w-4 mr-2" /> Stock
            </TabsTrigger>
            <TabsTrigger value="customers" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Users className="h-4 w-4 mr-2" /> Customers
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {activeTab === 'sales' && renderSalesReports()}
          {activeTab === 'staff' && renderStaffReports()}
          {activeTab === 'products' && renderProductReports()}
          {activeTab === 'stock' && renderStockReports()}
          {activeTab === 'customers' && renderCustomerReports()}
        </div>
      </ScrollArea>
    </div>
  )
}
