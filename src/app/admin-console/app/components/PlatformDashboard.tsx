'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Activity,
  Server,
  Database,
  Globe,
  CreditCard,
  Bell,
  Users,
  TrendingUp,
  TrendingDown,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Cpu,
  HardDrive,
  Wifi,
  Shield
} from 'lucide-react'

// System Services
const systemServices = [
  { name: 'Payment Gateway', status: 'operational', uptime: '99.99%', icon: CreditCard, latency: '45ms', load: 23 },
  { name: 'QR Service', status: 'operational', uptime: '99.98%', icon: Globe, latency: '32ms', load: 18 },
  { name: 'Wallet Service', status: 'operational', uptime: '99.97%', icon: Database, latency: '28ms', load: 31 },
  { name: 'KYC Service', status: 'degraded', uptime: '99.12%', icon: Users, latency: '450ms', load: 78 },
  { name: 'Notification Service', status: 'operational', uptime: '99.95%', icon: Bell, latency: '65ms', load: 42 },
  { name: 'Settlement Engine', status: 'operational', uptime: '99.99%', icon: Server, latency: '38ms', load: 15 },
  { name: 'GroSupply API', status: 'operational', uptime: '99.94%', icon: Globe, latency: '52ms', load: 28 },
  { name: 'Merchant OS', status: 'operational', uptime: '99.96%', icon: Activity, latency: '41ms', load: 35 },
]

// Platform Stats
const platformStats = [
  { label: 'Active Merchants', value: '14,847', change: '+127', trend: 'up', icon: Users },
  { label: 'Transactions Today', value: '847,234', change: '+12.4%', trend: 'up', icon: CreditCard },
  { label: 'Transaction Volume', value: 'R 47.2M', change: '+8.7%', trend: 'up', icon: TrendingUp },
  { label: 'System Uptime', value: '99.98%', change: '+0.02%', trend: 'up', icon: Server },
  { label: 'Avg Response Time', value: '124ms', change: '-8ms', trend: 'up', icon: Zap },
  { label: 'Active Users', value: '23,451', change: '+5.2%', trend: 'up', icon: Activity },
]

// Server Metrics
const serverMetrics = [
  { name: 'Production DB', cpu: 45, memory: 62, disk: 58, status: 'healthy' },
  { name: 'API Gateway', cpu: 32, memory: 48, disk: 25, status: 'healthy' },
  { name: 'Redis Cache', cpu: 28, memory: 71, disk: 12, status: 'healthy' },
  { name: 'File Storage', cpu: 15, memory: 34, disk: 78, status: 'warning' },
]

// Recent Incidents
const recentIncidents = [
  { id: 1, title: 'KYC Service degraded performance', severity: 'warning', time: '1h ago', status: 'investigating' },
  { id: 2, title: 'Database connection pool exhausted', severity: 'critical', time: '3h ago', status: 'resolved' },
  { id: 3, title: 'Payment gateway timeout spike', severity: 'warning', time: '6h ago', status: 'resolved' },
]

// Hourly Transaction Data
const hourlyData = [
  { hour: '00', transactions: 12500, volume: 850000 },
  { hour: '02', transactions: 8200, volume: 520000 },
  { hour: '04', transactions: 5100, volume: 340000 },
  { hour: '06', transactions: 15600, volume: 1200000 },
  { hour: '08', transactions: 28400, volume: 2400000 },
  { hour: '10', transactions: 45200, volume: 3800000 },
  { hour: '12', transactions: 52100, volume: 4200000 },
  { hour: '14', transactions: 48300, volume: 3900000 },
  { hour: '16', transactions: 42100, volume: 3500000 },
  { hour: '18', transactions: 38400, volume: 3200000 },
  { hour: '20', transactions: 31500, volume: 2600000 },
  { hour: '22', transactions: 21300, volume: 1700000 },
]

export default function PlatformDashboard() {
  const [currentTime, setCurrentTime] = useState<string>('')
  const [refreshing, setRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Initialize and update time only on client to avoid hydration mismatch
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-ZA', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }))
    }
    
    updateTime() // Set initial time on mount
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      const refreshTimer = setInterval(() => {
        // Simulate data refresh
      }, 30000)
      return () => clearInterval(refreshTimer)
    }
  }, [autoRefresh])

  const handleRefresh = async () => {
    setRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setRefreshing(false)
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
        return 'text-green-500'
      case 'degraded':
        return 'text-amber-500'
      case 'down':
        return 'text-red-500'
      default:
        return 'text-green-500'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'warning':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    }
  }

  const maxTransactions = Math.max(...hourlyData.map(d => d.transactions))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Dashboard</h1>
          <p className="text-gray-400 text-sm">Real-time monitoring and system health</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="h-4 w-4" />
            <span className="font-mono">
              {currentTime || '--:--:--'}
            </span>
            <span className="text-gray-500">SAST</span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {platformStats.map((stat, index) => (
          <Card key={index} className="bg-[#1E293B] border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#00897B]/20 text-[#00897B] flex items-center justify-center">
                  <stat.icon className="h-4 w-4" />
                </div>
                <span className={`text-xs flex items-center gap-1 ${stat.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {stat.change}
                </span>
              </div>
              <div className="text-xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-gray-400">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Health Overview */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Services Status */}
        <Card className="lg:col-span-2 bg-[#1E293B] border-gray-700">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Server className="h-4 w-4 text-[#00897B]" />
                System Services
              </CardTitle>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                7/8 Operational
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {systemServices.map((service, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 rounded-lg bg-[#0F172A] border border-gray-700/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      service.status === 'operational' ? 'bg-green-500/20 text-green-400' :
                      service.status === 'degraded' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      <service.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{service.name}</p>
                      <p className="text-xs text-gray-400">Uptime: {service.uptime}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(service.status)}
                      <span className={`text-xs capitalize ${getStatusColor(service.status)}`}>
                        {service.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{service.latency}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Incidents & Alerts */}
        <Card className="bg-[#1E293B] border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-400" />
              Recent Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentIncidents.map((incident) => (
                <div 
                  key={incident.id}
                  className={`p-3 rounded-lg border ${getSeverityColor(incident.severity)}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{incident.title}</p>
                      <p className="text-xs opacity-70 mt-1">{incident.time}</p>
                    </div>
                    <Badge className={`text-[10px] ${
                      incident.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {incident.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4 border-gray-600 text-gray-300 hover:bg-gray-700">
              View All Incidents
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Volume Chart */}
      <Card className="bg-[#1E293B] border-gray-700">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#00897B]" />
              Transaction Volume (24h)
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-lg font-bold text-white">847,234</p>
                <p className="text-xs text-green-400">+12.4% vs yesterday</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-end justify-between gap-1 px-2">
            {hourlyData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className="w-full bg-gradient-to-t from-[#00897B] to-[#4CAF50] rounded-t transition-all hover:from-[#00897B]/80 hover:to-[#4CAF50]/80 cursor-pointer"
                  style={{ height: `${(data.transactions / maxTransactions) * 100}%` }}
                  title={`${data.transactions.toLocaleString()} transactions`}
                />
                <span className="text-[10px] text-gray-500">{data.hour}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Server Metrics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {serverMetrics.map((server, index) => (
          <Card key={index} className="bg-[#1E293B] border-gray-700">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-sm">{server.name}</CardTitle>
                <Badge className={`${
                  server.status === 'healthy' ? 'bg-green-500/20 text-green-400' :
                  'bg-amber-500/20 text-amber-400'
                }`}>
                  {server.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Cpu className="h-3 w-3" /> CPU
                  </span>
                  <span className="text-white">{server.cpu}%</span>
                </div>
                <Progress value={server.cpu} className="h-1.5 bg-gray-700" />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-400 flex items-center gap-1">
                    <HardDrive className="h-3 w-3" /> Memory
                  </span>
                  <span className="text-white">{server.memory}%</span>
                </div>
                <Progress value={server.memory} className="h-1.5 bg-gray-700" />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Database className="h-3 w-3" /> Disk
                  </span>
                  <span className="text-white">{server.disk}%</span>
                </div>
                <Progress value={server.disk} className="h-1.5 bg-gray-700" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 h-auto py-3 flex-col">
              <RefreshCw className="h-5 w-5 mb-2" />
              <span className="text-xs">Restart Service</span>
            </Button>
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 h-auto py-3 flex-col">
              <Database className="h-5 w-5 mb-2" />
              <span className="text-xs">Clear Cache</span>
            </Button>
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 h-auto py-3 flex-col">
              <Shield className="h-5 w-5 mb-2" />
              <span className="text-xs">Security Scan</span>
            </Button>
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 h-auto py-3 flex-col">
              <Wifi className="h-5 w-5 mb-2" />
              <span className="text-xs">Test Endpoints</span>
            </Button>
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 h-auto py-3 flex-col">
              <Activity className="h-5 w-5 mb-2" />
              <span className="text-xs">Run Diagnostics</span>
            </Button>
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 h-auto py-3 flex-col">
              <Globe className="h-5 w-5 mb-2" />
              <span className="text-xs">View Logs</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
