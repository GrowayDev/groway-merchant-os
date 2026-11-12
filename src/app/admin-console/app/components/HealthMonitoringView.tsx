'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  Activity,
  Server,
  Database,
  Globe,
  Cpu,
  HardDrive,
  Wifi,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Minus,
  Zap,
  Shield,
  Gauge,
  BarChart3,
  AlertCircle
} from 'lucide-react'

interface HealthScore {
  score: number
  status: string
  breakdown: Record<string, number>
}

interface SystemMetrics {
  cpu: { current: number; threshold: number; status: string }
  memory: { current: number; threshold: number; status: string }
  disk: { current: number; threshold: number; status: string }
  network: { latency: number; throughput: number; status: string }
}

interface ServiceStatus {
  serviceName: string
  displayName: string
  serviceType: string
  status: string
  statusMessage?: string
  lastCheckAt?: string
  uptimePercent?: number
}

interface DatabaseHealth {
  activeConnections: number
  idleConnections: number
  maxConnections: number
  connectionPoolUsage: number
  avgQueryTimeMs: number
  slowQueryCount?: number
  databaseSizeMb: number
  status: string
}

interface APIMetric {
  name: string
  path: string
  method: string
  avgResponseTime: number
  status: string
  errorRate: number
}

export default function HealthMonitoringView() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null)
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [services, setServices] = useState<ServiceStatus[]>([])
  const [serviceSummary, setServiceSummary] = useState({
    total: 0,
    operational: 0,
    degraded: 0,
    partialOutage: 0,
    majorOutage: 0,
    maintenance: 0,
  })
  const [apiMetrics, setApiMetrics] = useState<APIMetric[]>([])
  const [dbHealth, setDbHealth] = useState<DatabaseHealth | null>(null)
  const [incidents, setIncidents] = useState<Array<{ id: string; title: string; severity: string; createdAt: string }>>([])

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/health/dashboard?view=overview')
      if (response.ok) {
        const data = await response.json()
        setHealthScore(data.healthScore)
        setSystemMetrics(data.systemMetrics)
        setServices(data.serviceStatus?.services || [])
        setServiceSummary(data.serviceStatus?.summary || {})
        setApiMetrics(data.apiMetrics || [])
        setDbHealth(data.databaseHealth)
        setIncidents(data.incidents || [])
      }
    } catch (error) {
      console.error('Error fetching health dashboard:', error)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const loadData = async () => {
      await fetchDashboard()
    }
    loadData()
    const interval = setInterval(() => {
      const refreshData = async () => {
        await fetchDashboard()
      }
      void refreshData()
    }, 30000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      operational: 'bg-green-500/20 text-green-400 border-green-500/30',
      healthy: 'bg-green-500/20 text-green-400 border-green-500/30',
      degraded: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      partial_outage: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      major_outage: 'bg-red-500/20 text-red-400 border-red-500/30',
      critical: 'bg-red-500/20 text-red-400 border-red-500/30',
      maintenance: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    }
    return <Badge className={`${styles[status] || 'bg-gray-500/20 text-gray-400'} border capitalize`}>{status.replace('_', ' ')}</Badge>
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
      case 'healthy':
        return <CheckCircle2 className="h-4 w-4 text-green-400" />
      case 'degraded':
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-400" />
      case 'partial_outage':
      case 'major_outage':
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-400" />
      case 'maintenance':
        return <Clock className="h-4 w-4 text-blue-400" />
      default:
        return <Minus className="h-4 w-4 text-gray-400" />
    }
  }

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'api': return <Globe className="h-4 w-4" />
      case 'database': return <Database className="h-4 w-4" />
      case 'cache': return <Zap className="h-4 w-4" />
      case 'worker': return <Cpu className="h-4 w-4" />
      case 'external': return <Wifi className="h-4 w-4" />
      default: return <Server className="h-4 w-4" />
    }
  }

  const formatUptime = (percent: number) => {
    if (percent >= 99.99) return '99.99%+'
    return `${percent.toFixed(2)}%`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-[#00897B]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-[#00897B]" />
            Platform Health Monitoring
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time system metrics, service status, and health monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
            onClick={fetchDashboard}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Health Score Overview */}
      {healthScore && (
        <Card className="bg-[#1E293B] border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                  healthScore.status === 'healthy' ? 'bg-green-500/20' :
                  healthScore.status === 'warning' ? 'bg-amber-500/20' :
                  healthScore.status === 'degraded' ? 'bg-orange-500/20' :
                  'bg-red-500/20'
                }`}>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${
                      healthScore.status === 'healthy' ? 'text-green-400' :
                      healthScore.status === 'warning' ? 'text-amber-400' :
                      healthScore.status === 'degraded' ? 'text-orange-400' :
                      'text-red-400'
                    }`}>{healthScore.score}</p>
                    <p className="text-xs text-gray-400">Health</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white capitalize mb-2">
                    Platform Status: {healthScore.status}
                  </h3>
                  <div className="flex gap-4 text-sm">
                    {Object.entries(healthScore.breakdown).slice(0, 4).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-gray-400 capitalize">{key}:</span>
                        <span className="text-white">{Math.round(value)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-8">
                <div className="text-center">
                  <p className="text-xl font-bold text-green-400">{serviceSummary.operational}</p>
                  <p className="text-xs text-gray-400">Operational</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-amber-400">{serviceSummary.degraded}</p>
                  <p className="text-xs text-gray-400">Degraded</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-red-400">{serviceSummary.majorOutage}</p>
                  <p className="text-xs text-gray-400">Major Outage</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#1E293B] border border-gray-700 grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#00897B]">Overview</TabsTrigger>
          <TabsTrigger value="services" className="data-[state=active]:bg-[#00897B]">Services</TabsTrigger>
          <TabsTrigger value="api" className="data-[state=active]:bg-[#00897B]">API</TabsTrigger>
          <TabsTrigger value="database" className="data-[state=active]:bg-[#00897B]">Database</TabsTrigger>
          <TabsTrigger value="incidents" className="data-[state=active]:bg-[#00897B]">Incidents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {systemMetrics && (
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="bg-[#1E293B] border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Cpu className="h-5 w-5 text-blue-400" />
                    {getStatusBadge(systemMetrics.cpu.status)}
                  </div>
                  <p className="text-2xl font-bold text-white">{systemMetrics.cpu.current.toFixed(1)}%</p>
                  <p className="text-xs text-gray-400">CPU Usage</p>
                  <Progress value={systemMetrics.cpu.current} className="h-1.5 mt-2 bg-gray-700 [&>div]:bg-blue-500" />
                </CardContent>
              </Card>

              <Card className="bg-[#1E293B] border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Activity className="h-5 w-5 text-purple-400" />
                    {getStatusBadge(systemMetrics.memory.status)}
                  </div>
                  <p className="text-2xl font-bold text-white">{systemMetrics.memory.current.toFixed(1)}%</p>
                  <p className="text-xs text-gray-400">Memory Usage</p>
                  <Progress value={systemMetrics.memory.current} className="h-1.5 mt-2 bg-gray-700 [&>div]:bg-purple-500" />
                </CardContent>
              </Card>

              <Card className="bg-[#1E293B] border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <HardDrive className="h-5 w-5 text-green-400" />
                    {getStatusBadge(systemMetrics.disk.status)}
                  </div>
                  <p className="text-2xl font-bold text-white">{systemMetrics.disk.current.toFixed(1)}%</p>
                  <p className="text-xs text-gray-400">Disk Usage</p>
                  <Progress value={systemMetrics.disk.current} className="h-1.5 mt-2 bg-gray-700 [&>div]:bg-green-500" />
                </CardContent>
              </Card>

              <Card className="bg-[#1E293B] border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Wifi className="h-5 w-5 text-amber-400" />
                    {getStatusBadge(systemMetrics.network.status)}
                  </div>
                  <p className="text-2xl font-bold text-white">{systemMetrics.network.latency}ms</p>
                  <p className="text-xs text-gray-400">Network Latency</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Services Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-[#1E293B] border-gray-700 md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-base">Service Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {services.slice(0, 8).map((service) => (
                    <div key={service.serviceName} className="p-3 rounded-lg bg-[#0F172A] border border-gray-700/50">
                      <div className="flex items-center gap-2 mb-2">
                        {getServiceIcon(service.serviceType)}
                        {getStatusIcon(service.status)}
                      </div>
                      <p className="text-sm font-medium text-white truncate">{service.displayName}</p>
                      <p className="text-xs text-gray-400">{formatUptime(service.uptimePercent || 99.9)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {dbHealth && (
              <Card className="bg-[#1E293B] border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Database
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Connections</span>
                        <span className="text-white">{dbHealth.activeConnections}/{dbHealth.maxConnections}</span>
                      </div>
                      <Progress value={dbHealth.connectionPoolUsage} className="h-2 bg-gray-700 [&>div]:bg-blue-500" />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Query Time</span>
                      <span className="text-white">{dbHealth.avgQueryTimeMs}ms</span>
                    </div>
                    {getStatusBadge(dbHealth.status)}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="mt-4">
          <Card className="bg-[#1E293B] border-gray-700">
            <CardContent className="p-4">
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {services.map((service) => (
                    <div key={service.serviceName} className="flex items-center justify-between p-4 rounded-lg bg-[#0F172A] border border-gray-700/50">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          service.status === 'operational' ? 'bg-green-500/20 text-green-400' :
                          service.status === 'degraded' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {getServiceIcon(service.serviceType)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{service.displayName}</p>
                          <p className="text-xs text-gray-400">{service.serviceType}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-white">{formatUptime(service.uptimePercent || 99.9)}</p>
                          <p className="text-xs text-gray-400">Uptime</p>
                        </div>
                        {getStatusBadge(service.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Tab */}
        <TabsContent value="api" className="mt-4">
          <Card className="bg-[#1E293B] border-gray-700">
            <CardContent className="p-4">
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {apiMetrics.map((endpoint, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-[#0F172A] border border-gray-700/50">
                      <div className="flex items-center gap-3">
                        <Badge className={`${
                          endpoint.method === 'GET' ? 'bg-green-500/20 text-green-400' :
                          endpoint.method === 'POST' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-amber-500/20 text-amber-400'
                        } border-0 font-mono`}>
                          {endpoint.method}
                        </Badge>
                        <div>
                          <p className="text-sm text-white font-mono">{endpoint.path}</p>
                          <p className="text-xs text-gray-400">{endpoint.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-white">{endpoint.avgResponseTime}ms</p>
                          <p className="text-xs text-gray-400">Response</p>
                        </div>
                        {getStatusBadge(endpoint.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database" className="mt-4">
          {dbHealth && (
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-[#1E293B] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-base">Connection Pool</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Active</span>
                      <span className="text-white">{dbHealth.activeConnections}</span>
                    </div>
                    <Progress value={dbHealth.connectionPoolUsage} className="h-3 bg-gray-700 [&>div]:bg-blue-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-[#0F172A] border border-gray-700/50">
                      <p className="text-lg font-bold text-white">{dbHealth.idleConnections}</p>
                      <p className="text-xs text-gray-400">Idle</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#0F172A] border border-gray-700/50">
                      <p className="text-lg font-bold text-white">{dbHealth.maxConnections}</p>
                      <p className="text-xs text-gray-400">Max</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1E293B] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-base">Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between p-3 rounded-lg bg-[#0F172A] border border-gray-700/50">
                    <span className="text-gray-400">Avg Query Time</span>
                    <span className="text-white">{dbHealth.avgQueryTimeMs}ms</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-lg bg-[#0F172A] border border-gray-700/50">
                    <span className="text-gray-400">Slow Queries</span>
                    <span className="text-white">{dbHealth.slowQueryCount || 0}</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-lg bg-[#0F172A] border border-gray-700/50">
                    <span className="text-gray-400">Database Size</span>
                    <span className="text-white">{dbHealth.databaseSizeMb} MB</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="mt-4">
          <Card className="bg-[#1E293B] border-gray-700">
            <CardContent className="p-4">
              {incidents.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {incidents.map((incident) => (
                      <div key={incident.id} className="p-4 rounded-lg bg-[#0F172A] border border-gray-700/50">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-white">{incident.title}</p>
                          <Badge className="bg-amber-500/20 text-amber-400 border-0">{incident.severity}</Badge>
                        </div>
                        <p className="text-xs text-gray-400">{new Date(incident.createdAt).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No incidents recorded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
