'use client'

import { useState } from 'react'
import {
  Brain,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Package,
  ShoppingCart,
  BarChart3,
  LineChart,
  Target,
  Lightbulb,
  RefreshCw,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Zap,
  Clock,
  Calendar
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// AI Confidence indicator
const ConfidenceBadge = ({ score }: { score: number }) => {
  const color = score >= 90 ? 'bg-green-100 text-green-700' :
                score >= 70 ? 'bg-yellow-100 text-yellow-700' :
                'bg-orange-100 text-orange-700'
  return (
    <Badge className={`${color} border-0 text-xs`}>
      {score}% confidence
    </Badge>
  )
}

// Simple SVG line chart - defined outside component
const ForecastChart = () => {
  const data = [30, 45, 35, 50, 40, 55, 60, 75, 65, 80, 85, 95]
  const max = Math.max(...data)
  const points = data.map((v, i) => `${i * 40},${100 - (v / max) * 80}`).join(' ')
  const futurePoints = data.slice(-4).map((v, i) => `${(i + 8) * 40},${100 - (v / max) * 80}`).join(' ')

  return (
    <svg viewBox="0 0 480 120" className="w-full h-32">
      {/* Grid lines */}
      {[0, 1, 2, 3].map(i => (
        <line key={i} x1="0" y1={25 + i * 25} x2="480" y2={25 + i * 25} stroke="#e5e7eb" strokeWidth="1" />
      ))}
      {/* Actual data */}
      <polyline points={points.slice(0, -4)} fill="none" stroke="#00897B" strokeWidth="2" />
      {/* Prediction */}
      <polyline points={points.slice(-5)} fill="none" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="4" />
      {/* Confidence band */}
      <polygon
        points={`${points.slice(-5)} ${points.slice(-5).split(' ').reverse().map((p: string) => {
          const [x, y] = p.split(',')
          return `${x},${parseInt(y) + 15}`
        }).join(' ')}`}
        fill="#8B5CF620"
      />
      {/* Labels */}
      <text x="0" y="115" className="text-xs fill-gray-400">Jan</text>
      <text x="160" y="115" className="text-xs fill-gray-400">Mar</text>
      <text x="320" y="115" className="text-xs fill-gray-400">May</text>
      <text x="440" y="115" className="text-xs fill-gray-400">Jul</text>
      <text x="350" y="20" className="text-xs fill-purple-500">→ Forecast</text>
    </svg>
  )
}

// Insight card component
const InsightCard = ({ 
  title, 
  description, 
  impact, 
  confidence, 
  action,
  priority 
}: { 
  title: string
  description: string
  impact: string
  confidence: number
  action: string
  priority: 'high' | 'medium' | 'low'
}) => {
  const priorityColors = {
    high: 'border-l-red-500',
    medium: 'border-l-yellow-500',
    low: 'border-l-green-500'
  }

  return (
    <Card className={`border-l-4 ${priorityColors[priority]}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-gray-900">{title}</h4>
          <ConfidenceBadge score={confidence} />
        </div>
        <p className="text-sm text-gray-600 mb-3">{description}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#00897B]">{impact}</span>
          <Button size="sm" variant="outline" className="text-xs">
            {action}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function GroAIInsightsPage() {
  const [lastUpdated] = useState(new Date())
  const [showInsightDetail, setShowInsightDetail] = useState(false)
  const [selectedInsight, setSelectedInsight] = useState<any>(null)

  // Mock AI insights data
  const demandForecasts = [
    { product: 'Royal Gala Apples', current: 500, predicted: 720, change: 44, confidence: 92, trend: 'up' },
    { product: 'Hass Avocados', current: 120, predicted: 180, change: 50, confidence: 88, trend: 'up' },
    { product: 'Cavendish Bananas', current: 800, predicted: 680, change: -15, confidence: 85, trend: 'down' },
    { product: 'Valencia Oranges', current: 350, predicted: 310, change: -11, confidence: 78, trend: 'down' },
    { product: 'Seedless Grapes', current: 200, predicted: 350, change: 75, confidence: 94, trend: 'up' },
  ]

  const pricingRecommendations = [
    { product: 'Hass Avocados', currentPrice: 280, suggestedPrice: 310, reason: 'High demand + low supply', impact: '+R5,400/mo', confidence: 91, risk: 'low' },
    { product: 'Royal Gala Apples', currentPrice: 120, suggestedPrice: 135, reason: 'Below market average', impact: '+R7,500/mo', confidence: 87, risk: 'low' },
    { product: 'Cavendish Bananas', currentPrice: 85, suggestedPrice: 78, reason: 'Competitor pricing pressure', impact: 'Maintain volume', confidence: 82, risk: 'medium' },
    { product: 'Seedless Grapes', currentPrice: 165, suggestedPrice: 185, reason: 'Seasonal demand spike', impact: '+R9,000/mo', confidence: 89, risk: 'low' },
  ]

  const performanceMetrics = {
    healthScore: 87,
    fulfillmentRate: { current: 97.5, benchmark: 95, trend: 'up' },
    onTimeDelivery: { current: 94.2, benchmark: 92, trend: 'up' },
    qualityScore: { current: 4.6, benchmark: 4.2, trend: 'up' },
    responseTime: { current: 2.3, benchmark: 4.0, trend: 'up' },
  }

  const actionItems = [
    { id: 1, title: 'Increase Hass Avocado stock by 50%', impact: 'R12,500/mo revenue', confidence: 92, priority: 'high', type: 'inventory' },
    { id: 2, title: 'Adjust Grape pricing to R185/box', impact: 'R9,000/mo revenue', confidence: 89, priority: 'high', type: 'pricing' },
    { id: 3, title: 'Respond to 2 pending RFQs', impact: 'R45,000 potential', confidence: 85, priority: 'medium', type: 'orders' },
    { id: 4, title: 'Review Banana stock levels', impact: 'Reduce overstock risk', confidence: 78, priority: 'medium', type: 'inventory' },
    { id: 5, title: 'Update Apple product images', impact: 'Improve conversion', confidence: 72, priority: 'low', type: 'catalog' },
  ]

  const marketIntelligence = [
    { category: 'Fresh Fruits', trend: 'up', change: 12, insight: 'Demand for organic produce increasing' },
    { category: 'Vegetables', trend: 'stable', change: 2, insight: 'Market stable, maintain current pricing' },
    { category: 'Dairy Products', trend: 'down', change: -8, insight: 'Seasonal decline expected' },
  ]

  const anomalies = [
    { type: 'demand_spike', product: 'Hass Avocados', severity: 'high', message: 'Unusual demand spike detected - 45% above normal' },
    { type: 'price_deviation', product: 'Cavendish Bananas', severity: 'medium', message: 'Your price 12% above market average' },
    { type: 'stock_risk', product: 'Valencia Oranges', severity: 'low', message: 'Stock may run low in 5 days at current rate' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-[#00897B] flex items-center justify-center">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">GroAI Insights</h1>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-purple-500" />
              AI-powered business intelligence
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-gray-500">Last updated</p>
            <p className="text-sm font-medium">{lastUpdated.toLocaleTimeString()}</p>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* AI Confidence Banner */}
      <Card className="bg-gradient-to-r from-purple-500 to-[#00897B] text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Overall AI Confidence Score</p>
              <p className="text-4xl font-bold mt-1">94%</p>
              <p className="text-sm opacity-75 mt-1">Based on 2,847 data points</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Potential Revenue Impact</p>
              <p className="text-3xl font-bold mt-1">+R28,500</p>
              <p className="text-sm opacity-75 mt-1">if all recommendations followed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Priority Action Items
            </CardTitle>
            <Badge className="bg-purple-100 text-purple-700 border-0">
              {actionItems.length} actions
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {actionItems.map((item) => (
              <div key={item.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    item.priority === 'high' ? 'bg-red-500' :
                    item.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-500">{item.impact}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ConfidenceBadge score={item.confidence} />
                  <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]">
                    Take Action
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="demand" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="demand">Demand</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="market">Market</TabsTrigger>
        </TabsList>

        {/* Demand Forecasting Tab */}
        <TabsContent value="demand" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  90-Day Demand Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ForecastChart />
                <div className="flex items-center justify-between mt-4 text-sm">
                  <span className="text-gray-500">Predicted growth: <span className="text-green-600 font-medium">+23%</span></span>
                  <span className="text-purple-600 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI Forecast
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Product-Level Forecasts</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {demandForecasts.map((item, idx) => (
                    <div key={idx} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{item.product}</span>
                        <div className="flex items-center gap-2">
                          {item.trend === 'up' ? (
                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-500" />
                          )}
                          <span className={item.change > 0 ? 'text-green-600' : 'text-red-600'}>
                            {item.change > 0 ? '+' : ''}{item.change}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          Current: {item.current} → Predicted: {item.predicted}
                        </span>
                        <ConfidenceBadge score={item.confidence} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stockout Risk Alert */}
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900">Stockout Risk Detected</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Hass Avocados predicted to stock out in 5 days. AI recommends increasing order quantity by 50%.
                  </p>
                  <Button size="sm" variant="destructive" className="mt-2">
                    Create Reorder PO
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Recommendations Tab */}
        <TabsContent value="pricing" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <p className="text-sm text-green-600">Underpriced Products</p>
                <p className="text-2xl font-bold text-green-900 mt-1">3</p>
                <p className="text-xs text-green-600 mt-1">Opportunity: +R21,900/mo</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <p className="text-sm text-yellow-600">Optimally Priced</p>
                <p className="text-2xl font-bold text-yellow-900 mt-1">12</p>
                <p className="text-xs text-yellow-600 mt-1">Within market range</p>
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <p className="text-sm text-red-600">Overpriced Products</p>
                <p className="text-2xl font-bold text-red-900 mt-1">1</p>
                <p className="text-xs text-red-600 mt-1">Risk: Volume decline</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Price Optimization Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-gray-50 text-sm">
                  <tr>
                    <th className="text-left p-3">Product</th>
                    <th className="text-right p-3">Current</th>
                    <th className="text-right p-3">Suggested</th>
                    <th className="text-left p-3">Reason</th>
                    <th className="text-right p-3">Impact</th>
                    <th className="text-center p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pricingRecommendations.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-3 font-medium">{item.product}</td>
                      <td className="p-3 text-right">R{item.currentPrice}</td>
                      <td className="p-3 text-right">
                        <span className={item.suggestedPrice > item.currentPrice ? 'text-green-600' : 'text-red-600'}>
                          R{item.suggestedPrice}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-gray-500">{item.reason}</td>
                      <td className="p-3 text-right text-sm font-medium text-[#00897B]">{item.impact}</td>
                      <td className="p-3 text-center">
                        <Button size="sm" variant="outline">Apply</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Health Score */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Supplier Health Score</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="relative inline-flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-32 h-32">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                    <circle 
                      cx="50" cy="50" r="45" 
                      fill="none" 
                      stroke="#00897B" 
                      strokeWidth="8"
                      strokeDasharray={`${performanceMetrics.healthScore * 2.83} 283`}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute">
                    <p className="text-3xl font-bold text-gray-900">{performanceMetrics.healthScore}</p>
                    <p className="text-xs text-gray-500">/ 100</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-4">Excellent - Top 15% of suppliers</p>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Key Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Fulfillment Rate</span>
                    <span className="text-sm font-medium">{performanceMetrics.fulfillmentRate.current}%</span>
                  </div>
                  <Progress value={performanceMetrics.fulfillmentRate.current} className="h-2" />
                  <p className="text-xs text-green-600 mt-1">Benchmark: {performanceMetrics.fulfillmentRate.benchmark}% ✓</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">On-Time Delivery</span>
                    <span className="text-sm font-medium">{performanceMetrics.onTimeDelivery.current}%</span>
                  </div>
                  <Progress value={performanceMetrics.onTimeDelivery.current} className="h-2" />
                  <p className="text-xs text-green-600 mt-1">Benchmark: {performanceMetrics.onTimeDelivery.benchmark}% ✓</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Quality Score</span>
                    <span className="text-sm font-medium">{performanceMetrics.qualityScore.current}/5.0</span>
                  </div>
                  <Progress value={performanceMetrics.qualityScore.current * 20} className="h-2" />
                  <p className="text-xs text-green-600 mt-1">Benchmark: {performanceMetrics.qualityScore.benchmark}/5.0 ✓</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Improvement Areas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-500" />
                Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-yellow-100 text-yellow-700">Medium Priority</Badge>
                  </div>
                  <h4 className="font-medium">Response Time Improvement</h4>
                  <p className="text-sm text-gray-600 mt-1">Average RFQ response time is 2.3 hours. Reducing to under 1 hour could improve acceptance rate by 15%.</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-green-100 text-green-700">Low Priority</Badge>
                  </div>
                  <h4 className="font-medium">Catalog Completeness</h4>
                  <p className="text-sm text-gray-600 mt-1">Adding product images to all items could improve conversion by 8%.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Intelligence Tab */}
        <TabsContent value="market" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-4">
            {marketIntelligence.map((item, idx) => (
              <Card key={idx}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{item.category}</span>
                    {item.trend === 'up' ? (
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    ) : item.trend === 'down' ? (
                      <TrendingDown className="h-5 w-5 text-red-500" />
                    ) : (
                      <BarChart3 className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <p className={`text-2xl font-bold ${item.change > 0 ? 'text-green-600' : item.change < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {item.change > 0 ? '+' : ''}{item.change}%
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{item.insight}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Anomaly Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Market Anomalies Detected
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {anomalies.map((anomaly, idx) => (
                  <div key={idx} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        anomaly.severity === 'high' ? 'bg-red-500' :
                        anomaly.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900">{anomaly.product}</p>
                        <p className="text-sm text-gray-500">{anomaly.message}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Info className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Competitive Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Competitive Position</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Your Average Price Position</span>
                  <Badge className="bg-green-100 text-green-700">3% below market</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Fulfillment Speed Ranking</span>
                  <Badge className="bg-purple-100 text-purple-700">#8 of 156 suppliers</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Product Variety Score</span>
                  <Badge className="bg-blue-100 text-blue-700">Above average</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
