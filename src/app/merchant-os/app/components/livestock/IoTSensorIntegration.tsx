'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Cpu,
  Thermometer,
  Droplets,
  MapPin,
  Wifi,
  WifiOff,
  Battery,
  Activity,
  AlertTriangle,
  CheckCircle,
  Plus,
  Settings,
  RefreshCw,
  Loader2,
  Signal,
  Zap,
  Radio,
  Gauge,
  Wind,
  Sun,
  CloudRain,
  Eye,
  History,
  Power,
} from 'lucide-react'

// ============================================
// TYPES
// ============================================

interface Sensor {
  id: string
  name: string
  type: 'temperature' | 'humidity' | 'water_level' | 'gps' | 'motion' | 'weather' | 'weight_scale'
  location: string
  status: 'online' | 'offline' | 'low_battery' | 'error'
  batteryLevel?: number
  signalStrength: number
  lastReading: SensorReading | null
  lastSync: string
  enabled: boolean
  alertThresholds?: {
    min?: number
    max?: number
  }
}

interface SensorReading {
  sensorId: string
  value: number
  unit: string
  timestamp: string
  additionalData?: Record<string, unknown>
}

interface SensorAlert {
  id: string
  sensorId: string
  sensorName: string
  type: 'warning' | 'critical' | 'info'
  message: string
  value: number
  threshold: number
  timestamp: string
  acknowledged: boolean
}

interface IoTSensorIntegrationProps {
  farmId: string
}

const sensorTypeConfig: Record<string, { name: string; icon: React.ElementType; color: string; unit: string }> = {
  temperature: { name: 'Temperature', icon: Thermometer, color: 'text-red-500', unit: '°C' },
  humidity: { name: 'Humidity', icon: Droplets, color: 'text-blue-500', unit: '%' },
  water_level: { name: 'Water Level', icon: Droplets, color: 'text-cyan-500', unit: 'L' },
  gps: { name: 'GPS Tracker', icon: MapPin, color: 'text-green-500', unit: 'coords' },
  motion: { name: 'Motion Sensor', icon: Activity, color: 'text-purple-500', unit: 'events' },
  weather: { name: 'Weather Station', icon: Sun, color: 'text-amber-500', unit: 'mixed' },
  weight_scale: { name: 'Weight Scale', icon: Gauge, color: 'text-orange-500', unit: 'kg' },
}

const statusColors: Record<string, string> = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  low_battery: 'bg-amber-500',
  error: 'bg-red-500',
}

// Mock sensors data
const mockSensors: Sensor[] = [
  {
    id: 'sensor-1',
    name: 'Barn Temperature Sensor',
    type: 'temperature',
    location: 'Main Barn - Section A',
    status: 'online',
    batteryLevel: 85,
    signalStrength: 92,
    lastReading: { sensorId: 'sensor-1', value: 22.5, unit: '°C', timestamp: new Date().toISOString() },
    lastSync: new Date().toISOString(),
    enabled: true,
    alertThresholds: { min: 5, max: 35 },
  },
  {
    id: 'sensor-2',
    name: 'Water Tank Level Monitor',
    type: 'water_level',
    location: 'North Pasture Tank',
    status: 'online',
    batteryLevel: 72,
    signalStrength: 88,
    lastReading: { sensorId: 'sensor-2', value: 4500, unit: 'L', timestamp: new Date().toISOString() },
    lastSync: new Date().toISOString(),
    enabled: true,
    alertThresholds: { min: 500, max: 10000 },
  },
  {
    id: 'sensor-3',
    name: 'Cattle GPS Collar #1',
    type: 'gps',
    location: 'North Pasture',
    status: 'online',
    batteryLevel: 65,
    signalStrength: 78,
    lastReading: {
      sensorId: 'sensor-3',
      value: 0,
      unit: 'coords',
      timestamp: new Date().toISOString(),
      additionalData: { lat: -25.7479, lng: 28.2293, speed: 0.5 },
    },
    lastSync: new Date().toISOString(),
    enabled: true,
  },
  {
    id: 'sensor-4',
    name: 'Weather Station',
    type: 'weather',
    location: 'Farm Center',
    status: 'online',
    batteryLevel: 100,
    signalStrength: 95,
    lastReading: {
      sensorId: 'sensor-4',
      value: 28,
      unit: '°C',
      timestamp: new Date().toISOString(),
      additionalData: { humidity: 45, windSpeed: 12, rainfall: 0 },
    },
    lastSync: new Date().toISOString(),
    enabled: true,
  },
  {
    id: 'sensor-5',
    name: 'Feedlot Scale',
    type: 'weight_scale',
    location: 'Processing Area',
    status: 'online',
    batteryLevel: 100,
    signalStrength: 90,
    lastReading: { sensorId: 'sensor-5', value: 485, unit: 'kg', timestamp: new Date().toISOString() },
    lastSync: new Date().toISOString(),
    enabled: true,
  },
  {
    id: 'sensor-6',
    name: 'Motion Detector - Gate A',
    type: 'motion',
    location: 'Main Gate',
    status: 'low_battery',
    batteryLevel: 15,
    signalStrength: 65,
    lastReading: { sensorId: 'sensor-6', value: 0, unit: 'events', timestamp: new Date(Date.now() - 3600000).toISOString() },
    lastSync: new Date(Date.now() - 1800000).toISOString(),
    enabled: true,
  },
]

// Mock alerts
const mockAlerts: SensorAlert[] = [
  {
    id: 'alert-1',
    sensorId: 'sensor-6',
    sensorName: 'Motion Detector - Gate A',
    type: 'warning',
    message: 'Low battery level (15%)',
    value: 15,
    threshold: 20,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    acknowledged: false,
  },
]

// ============================================
// MAIN COMPONENT
// ============================================

export function IoTSensorIntegration({ farmId }: IoTSensorIntegrationProps) {
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [sensors, setSensors] = useState<Sensor[]>(mockSensors)
  const [alerts, setAlerts] = useState<SensorAlert[]>(mockAlerts)
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null)
  const [addSensorDialogOpen, setAddSensorDialogOpen] = useState(false)
  const [sensorDetailDialogOpen, setSensorDetailDialogOpen] = useState(false)

  // New sensor form
  const [newSensor, setNewSensor] = useState({
    name: '',
    type: 'temperature' as Sensor['type'],
    location: '',
  })

  // Refresh sensors
  const refreshSensors = async () => {
    setRefreshing(true)
    try {
      const sessionStr = localStorage.getItem('groway_session')
      const session = sessionStr ? JSON.parse(sessionStr) : null
      const merchantId = session?.merchantId || 'test-merchant'

      const response = await fetch(
        `/api/merchant-os/agriculture/livestock/iot/sensors?merchantId=${merchantId}&farmId=${farmId}`
      )

      if (response.ok) {
        const data = await response.json()
        setSensors(data.sensors || mockSensors)
        setAlerts(data.alerts || mockAlerts)
      }
    } catch (error) {
      console.error('Failed to refresh sensors:', error)
    } finally {
      setRefreshing(false)
    }
  }

  // Toggle sensor
  const toggleSensor = (sensorId: string) => {
    setSensors(prev =>
      prev.map(sensor =>
        sensor.id === sensorId ? { ...sensor, enabled: !sensor.enabled } : sensor
      )
    )
  }

  // Add sensor
  const addSensor = async () => {
    if (!newSensor.name || !newSensor.location) return

    try {
      const sessionStr = localStorage.getItem('groway_session')
      const session = sessionStr ? JSON.parse(sessionStr) : null
      const merchantId = session?.merchantId || 'test-merchant'

      const response = await fetch('/api/merchant-os/agriculture/livestock/iot/sensors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmId,
          merchantId,
          ...newSensor,
        }),
      })

      if (response.ok) {
        const sensor = await response.json()
        setSensors(prev => [...prev, sensor])
        setAddSensorDialogOpen(false)
        setNewSensor({ name: '', type: 'temperature', location: '' })
      }
    } catch (error) {
      console.error('Failed to add sensor:', error)
    }
  }

  // Acknowledge alert
  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    )
  }

  // Stats
  const stats = {
    totalSensors: sensors.length,
    onlineSensors: sensors.filter(s => s.status === 'online').length,
    offlineSensors: sensors.filter(s => s.status === 'offline').length,
    lowBatterySensors: sensors.filter(s => s.status === 'low_battery').length,
    activeAlerts: alerts.filter(a => !a.acknowledged).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Cpu className="w-5 h-5" />
            IoT Sensor Integration
          </h2>
          <p className="text-sm text-gray-500">Monitor and manage farm sensors and devices</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshSensors} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            className="bg-amber-600 hover:bg-amber-700"
            onClick={() => setAddSensorDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Sensor
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Sensors</p>
                <p className="text-xl font-bold">{stats.totalSensors}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Wifi className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Online</p>
                <p className="text-xl font-bold text-green-600">{stats.onlineSensors}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <WifiOff className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Offline</p>
                <p className="text-xl font-bold">{stats.offlineSensors}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Battery className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Low Battery</p>
                <p className="text-xl font-bold text-amber-600">{stats.lowBatterySensors}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Alerts</p>
                <p className="text-xl font-bold text-red-600">{stats.activeAlerts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="sensors">All Sensors</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts
            {stats.activeAlerts > 0 && (
              <Badge className="ml-2 bg-red-500">{stats.activeAlerts}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="map">GPS Map</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Sensors Grid */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Active Sensors</CardTitle>
                <CardDescription>Real-time sensor readings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sensors.filter(s => s.enabled).map((sensor) => {
                    const config = sensorTypeConfig[sensor.type]
                    const Icon = config.icon

                    return (
                      <div
                        key={sensor.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 ${
                          sensor.status === 'offline' ? 'opacity-50' : ''
                        }`}
                        onClick={() => {
                          setSelectedSensor(sensor)
                          setSensorDetailDialogOpen(true)
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center`}>
                              <Icon className={`w-5 h-5 ${config.color}`} />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{sensor.name}</p>
                              <p className="text-xs text-gray-500">{sensor.location}</p>
                            </div>
                          </div>
                          <div className={`w-2 h-2 rounded-full ${statusColors[sensor.status]}`} />
                        </div>

                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-2xl font-bold">
                              {sensor.lastReading ? sensor.lastReading.value : '--'}
                              <span className="text-sm font-normal text-gray-500 ml-1">{config.unit}</span>
                            </p>
                            <p className="text-xs text-gray-400">
                              {sensor.lastSync ? new Date(sensor.lastSync).toLocaleTimeString() : 'Never'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {sensor.batteryLevel !== undefined && (
                              <span className="flex items-center gap-1">
                                <Battery className="w-3 h-3" />
                                {sensor.batteryLevel}%
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Signal className="w-3 h-3" />
                              {sensor.signalStrength}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Weather Widget */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Weather Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const weatherSensor = sensors.find(s => s.type === 'weather')
                  const weatherData = weatherSensor?.lastReading?.additionalData as { humidity: number; windSpeed: number; rainfall: number } | undefined

                  return (
                    <div className="space-y-4">
                      <div className="text-center py-4">
                        <Sun className="w-16 h-16 mx-auto text-amber-500 mb-2" />
                        <p className="text-4xl font-bold">{weatherSensor?.lastReading?.value || '--'}°C</p>
                        <p className="text-gray-500">Partly Cloudy</p>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <Droplets className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                          <p className="text-lg font-bold">{weatherData?.humidity || '--'}%</p>
                          <p className="text-xs text-gray-500">Humidity</p>
                        </div>
                        <div>
                          <Wind className="w-5 h-5 mx-auto text-gray-500 mb-1" />
                          <p className="text-lg font-bold">{weatherData?.windSpeed || '--'}</p>
                          <p className="text-xs text-gray-500">km/h Wind</p>
                        </div>
                        <div>
                          <CloudRain className="w-5 h-5 mx-auto text-cyan-500 mb-1" />
                          <p className="text-lg font-bold">{weatherData?.rainfall || 0}</p>
                          <p className="text-xs text-gray-500">mm Rain</p>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* All Sensors Tab */}
        <TabsContent value="sensors">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">All Sensors</CardTitle>
              <CardDescription>Manage and configure sensors</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {sensors.map((sensor) => {
                    const config = sensorTypeConfig[sensor.type]
                    const Icon = config.icon

                    return (
                      <div key={sensor.id} className="flex items-center gap-4 p-4 rounded-lg border">
                        <Switch
                          checked={sensor.enabled}
                          onCheckedChange={() => toggleSensor(sensor.id)}
                        />
                        <div className={`w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{sensor.name}</p>
                            <Badge variant="outline">{config.name}</Badge>
                            <div className={`w-2 h-2 rounded-full ${statusColors[sensor.status]}`} />
                          </div>
                          <p className="text-sm text-gray-500">{sensor.location}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Battery className="w-3 h-3" />
                              {sensor.batteryLevel || 'N/A'}%
                            </span>
                            <span className="flex items-center gap-1">
                              <Signal className="w-3 h-3" />
                              {sensor.signalStrength}%
                            </span>
                            <span>Last sync: {new Date(sensor.lastSync).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">
                            {sensor.lastReading ? sensor.lastReading.value : '--'}
                            <span className="text-sm font-normal text-gray-500 ml-1">{config.unit}</span>
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedSensor(sensor)
                            setSensorDetailDialogOpen(true)
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sensor Alerts</CardTitle>
              <CardDescription>Alerts from sensor readings</CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.filter(a => !a.acknowledged).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium">No Active Alerts</p>
                  <p className="text-sm">All sensors are operating normally</p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {alerts
                      .filter(a => !a.acknowledged)
                      .map((alert) => (
                        <div
                          key={alert.id}
                          className={`flex items-center gap-4 p-4 rounded-lg border ${
                            alert.type === 'critical' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                          }`}
                        >
                          <AlertTriangle className={`w-5 h-5 ${alert.type === 'critical' ? 'text-red-500' : 'text-amber-500'}`} />
                          <div className="flex-1">
                            <p className="font-medium">{alert.sensorName}</p>
                            <p className="text-sm text-gray-600">{alert.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(alert.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            Acknowledge
                          </Button>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* GPS Map Tab */}
        <TabsContent value="map">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">GPS Tracking Map</CardTitle>
              <CardDescription>Real-time animal locations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MapPin className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium">GPS Map View</p>
                  <p className="text-sm">Interactive map would display animal locations</p>
                  <p className="text-xs mt-2">
                    {sensors.filter(s => s.type === 'gps' && s.status === 'online').length} GPS devices online
                  </p>
                </div>
              </div>

              {/* GPS Devices List */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {sensors
                  .filter(s => s.type === 'gps')
                  .map((sensor) => {
                    const gpsData = sensor.lastReading?.additionalData as { lat: number; lng: number; speed: number } | undefined

                    return (
                      <div key={sensor.id} className="flex items-center gap-4 p-3 rounded-lg border">
                        <div className={`w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center`}>
                          <MapPin className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{sensor.name}</p>
                          <p className="text-xs text-gray-500">
                            {gpsData?.lat.toFixed(4)}, {gpsData?.lng.toFixed(4)}
                          </p>
                          <p className="text-xs text-gray-400">
                            Speed: {gpsData?.speed || 0} km/h
                          </p>
                        </div>
                        <Badge className={sensor.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}>
                          {sensor.status}
                        </Badge>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Sensor Dialog */}
      <Dialog open={addSensorDialogOpen} onOpenChange={setAddSensorDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Sensor</DialogTitle>
            <DialogDescription>
              Register a new IoT sensor or device
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sensorName">Sensor Name</Label>
              <Input
                id="sensorName"
                placeholder="e.g., Barn Temperature Sensor"
                value={newSensor.name}
                onChange={(e) => setNewSensor({ ...newSensor, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sensorType">Sensor Type</Label>
              <Select
                value={newSensor.type}
                onValueChange={(value) => setNewSensor({ ...newSensor, type: value as Sensor['type'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(sensorTypeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <config.icon className={`w-4 h-4 ${config.color}`} />
                        {config.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sensorLocation">Location</Label>
              <Input
                id="sensorLocation"
                placeholder="e.g., Main Barn - Section A"
                value={newSensor.location}
                onChange={(e) => setNewSensor({ ...newSensor, location: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSensorDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={addSensor}
              disabled={!newSensor.name || !newSensor.location}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Add Sensor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sensor Detail Dialog */}
      <Dialog open={sensorDetailDialogOpen} onOpenChange={setSensorDetailDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedSensor?.name}</DialogTitle>
            <DialogDescription>{selectedSensor?.location}</DialogDescription>
          </DialogHeader>
          {selectedSensor && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${statusColors[selectedSensor.status]}`} />
                    <p className="font-medium capitalize">{selectedSensor.status}</p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Signal Strength</p>
                  <Progress value={selectedSensor.signalStrength} className="h-2 mt-2" />
                  <p className="text-sm font-medium mt-1">{selectedSensor.signalStrength}%</p>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg text-center">
                <p className="text-xs text-gray-500">Current Reading</p>
                <p className="text-4xl font-bold text-amber-600 mt-2">
                  {selectedSensor.lastReading?.value || '--'}
                  <span className="text-lg font-normal text-gray-500 ml-2">
                    {sensorTypeConfig[selectedSensor.type].unit}
                  </span>
                </p>
              </div>

              {selectedSensor.batteryLevel !== undefined && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-500">Battery Level</p>
                    <p className="font-medium">{selectedSensor.batteryLevel}%</p>
                  </div>
                  <Progress value={selectedSensor.batteryLevel} className="h-2" />
                </div>
              )}

              {selectedSensor.alertThresholds && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-500">Min Threshold</p>
                    <p className="font-medium">
                      {selectedSensor.alertThresholds.min ?? '--'} {sensorTypeConfig[selectedSensor.type].unit}
                    </p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-xs text-gray-500">Max Threshold</p>
                    <p className="font-medium">
                      {selectedSensor.alertThresholds.max ?? '--'} {sensorTypeConfig[selectedSensor.type].unit}
                    </p>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-400 text-center">
                Last synced: {new Date(selectedSensor.lastSync).toLocaleString()}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
