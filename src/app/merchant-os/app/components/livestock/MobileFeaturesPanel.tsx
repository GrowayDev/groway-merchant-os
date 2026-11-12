'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Smartphone,
  WifiOff,
  QrCode,
  Camera,
  Download,
  Upload,
  Cloud,
  CloudOff,
  MapPin,
  Battery,
  Signal,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Settings,
  Bell,
  Vibrate,
  Volume2,
  Sun,
  Moon,
  Trash2,
  FileText,
  Image,
  Wifi,
  Loader2,
  Zap,
  HardDrive,
  Database,
  Repeat,
  XCircle,
  Eye,
  Copy,
  ExternalLink,
} from 'lucide-react'

// ============================================
// TYPES
// ============================================

interface OfflineRecord {
  id: string
  type: 'weight' | 'health' | 'movement' | 'birth' | 'vaccination' | 'photo'
  animalTag: string
  data: Record<string, unknown>
  timestamp: string
  synced: boolean
  syncedAt?: string
  photoUrl?: string
}

interface MobileSettings {
  offlineMode: boolean
  autoSync: boolean
  syncOnWifiOnly: boolean
  notifyOnSync: boolean
  vibrationFeedback: boolean
  soundFeedback: boolean
  darkMode: boolean
  highContrast: boolean
  largeText: boolean
  autoDetectLocation: boolean
  photoQuality: 'low' | 'medium' | 'high'
  dataRetentionDays: number
}

interface SyncStatus {
  lastSync: string | null
  pendingRecords: number
  syncProgress: number
  isSyncing: boolean
  syncErrors: string[]
}

interface FieldOperation {
  id: string
  name: string
  description: string
  icon: React.ElementType
  offlineCapable: boolean
  requiredData: string[]
}

interface MobileFeaturesPanelProps {
  farmId: string
}

const fieldOperations: FieldOperation[] = [
  {
    id: 'weight',
    name: 'Record Weight',
    description: 'Weigh animals and record measurements',
    icon: Smartphone,
    offlineCapable: true,
    requiredData: ['animalTag', 'weight'],
  },
  {
    id: 'health',
    name: 'Health Check',
    description: 'Record health observations and treatments',
    icon: Camera,
    offlineCapable: true,
    requiredData: ['animalTag', 'condition'],
  },
  {
    id: 'movement',
    name: 'Record Movement',
    description: 'Track animal movements between camps',
    icon: MapPin,
    offlineCapable: true,
    requiredData: ['animalTag', 'fromCamp', 'toCamp'],
  },
  {
    id: 'birth',
    name: 'Record Birth',
    description: 'Register new animal births',
    icon: Camera,
    offlineCapable: true,
    requiredData: ['damTag', 'birthDate'],
  },
  {
    id: 'scan',
    name: 'Scan QR/Tag',
    description: 'Quick scan animal tags or QR codes',
    icon: QrCode,
    offlineCapable: true,
    requiredData: ['tagCode'],
  },
  {
    id: 'photo',
    name: 'Capture Photo',
    description: 'Take animal photos for AI analysis',
    icon: Camera,
    offlineCapable: true,
    requiredData: ['animalTag', 'photoUrl'],
  },
]

// Mock offline records
const mockOfflineRecords: OfflineRecord[] = [
  {
    id: 'offline-1',
    type: 'weight',
    animalTag: 'C045',
    data: { weight: 485, bodyConditionScore: 3.5, notes: 'Good condition' },
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    synced: false,
  },
  {
    id: 'offline-2',
    type: 'health',
    animalTag: 'C032',
    data: { condition: 'healthy', temperature: 38.5, notes: 'Routine check' },
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    synced: false,
  },
  {
    id: 'offline-3',
    type: 'movement',
    animalTag: 'C018',
    data: { fromCamp: 'North Pasture', toCamp: 'South Camp', reason: 'Rotation' },
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    synced: true,
    syncedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'offline-4',
    type: 'photo',
    animalTag: 'C055',
    data: { angle: 'side', analysisStatus: 'pending' },
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    synced: false,
    photoUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PC9zdmc+',
  },
]

// ============================================
// MAIN COMPONENT
// ============================================

export function MobileFeaturesPanel({ farmId }: MobileFeaturesPanelProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [settings, setSettings] = useState<MobileSettings>({
    offlineMode: false,
    autoSync: true,
    syncOnWifiOnly: false,
    notifyOnSync: true,
    vibrationFeedback: true,
    soundFeedback: false,
    darkMode: false,
    highContrast: false,
    largeText: false,
    autoDetectLocation: true,
    photoQuality: 'medium',
    dataRetentionDays: 30,
  })
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    pendingRecords: 3,
    syncProgress: 0,
    isSyncing: false,
    syncErrors: [],
  })
  const [offlineRecords, setOfflineRecords] = useState<OfflineRecord[]>(mockOfflineRecords)
  const [scanDialogOpen, setScanDialogOpen] = useState(false)
  const [scannedTag, setScannedTag] = useState('')
  const [quickRecordDialogOpen, setQuickRecordDialogOpen] = useState(false)
  const [quickRecordType, setQuickRecordType] = useState<string | null>(null)

  // Simulate online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Sync data
  const syncData = async () => {
    setSyncStatus(prev => ({ ...prev, isSyncing: true, syncProgress: 0 }))

    // Simulate sync progress
    for (let i = 0; i <= 100; i += 20) {
      await new Promise(resolve => setTimeout(resolve, 500))
      setSyncStatus(prev => ({ ...prev, syncProgress: i }))
    }

    // Mark all records as synced
    setOfflineRecords(prev =>
      prev.map(record => ({
        ...record,
        synced: true,
        syncedAt: new Date().toISOString(),
      }))
    )

    setSyncStatus(prev => ({
      ...prev,
      isSyncing: false,
      lastSync: new Date().toISOString(),
      pendingRecords: 0,
    }))
  }

  // Clear synced records
  const clearSyncedRecords = () => {
    setOfflineRecords(prev => prev.filter(r => !r.synced))
  }

  // Delete offline record
  const deleteRecord = (recordId: string) => {
    setOfflineRecords(prev => prev.filter(r => r.id !== recordId))
  }

  // Update settings
  const updateSetting = <K extends keyof MobileSettings>(key: K, value: MobileSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  // Get record type color
  const getTypeColor = (type: OfflineRecord['type']) => {
    const colors: Record<string, string> = {
      weight: 'bg-amber-100 text-amber-800',
      health: 'bg-red-100 text-red-800',
      movement: 'bg-blue-100 text-blue-800',
      birth: 'bg-pink-100 text-pink-800',
      vaccination: 'bg-green-100 text-green-800',
      photo: 'bg-purple-100 text-purple-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  // Stats
  const stats = {
    totalRecords: offlineRecords.length,
    pendingSync: offlineRecords.filter(r => !r.synced).length,
    synced: offlineRecords.filter(r => r.synced).length,
    storageUsed: '2.4 MB',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Mobile Features
          </h2>
          <p className="text-sm text-gray-500">Offline mode, field operations, and mobile sync</p>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Badge className="bg-green-500">
              <Wifi className="w-3 h-3 mr-1" />
              Online
            </Badge>
          ) : (
            <Badge className="bg-amber-500">
              <WifiOff className="w-3 h-3 mr-1" />
              Offline
            </Badge>
          )}
        </div>
      </div>

      {/* Connection Status & Sync */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={isOnline ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isOnline ? 'bg-green-100' : 'bg-amber-100'
              }`}>
                {isOnline ? (
                  <Cloud className="w-5 h-5 text-green-600" />
                ) : (
                  <CloudOff className="w-5 h-5 text-amber-600" />
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500">Connection</p>
                <p className="font-medium">{isOnline ? 'Connected' : 'Offline Mode'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Pending Sync</p>
                <p className="text-xl font-bold">{stats.pendingSync}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Synced</p>
                <p className="text-xl font-bold">{stats.synced}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Storage</p>
                <p className="font-medium">{stats.storageUsed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Progress */}
      {syncStatus.isSyncing && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
              <div className="flex-1">
                <p className="font-medium text-blue-800">Syncing data...</p>
                <Progress value={syncStatus.syncProgress} className="h-2 mt-2" />
              </div>
              <p className="text-sm text-blue-600">{syncStatus.syncProgress}%</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="operations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="operations">Field Operations</TabsTrigger>
          <TabsTrigger value="offline">
            Offline Records
            {stats.pendingSync > 0 && (
              <Badge className="ml-2 bg-amber-500">{stats.pendingSync}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sync">Sync Settings</TabsTrigger>
        </TabsList>

        {/* Field Operations Tab */}
        <TabsContent value="operations">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fieldOperations.map((operation) => (
              <Card
                key={operation.id}
                className="cursor-pointer hover:bg-amber-50 transition-colors"
                onClick={() => {
                  if (operation.id === 'scan') {
                    setScanDialogOpen(true)
                  } else {
                    setQuickRecordType(operation.id)
                    setQuickRecordDialogOpen(true)
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                      <operation.icon className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{operation.name}</p>
                        {operation.offlineCapable && (
                          <Badge variant="outline" className="text-xs">
                            <WifiOff className="w-3 h-3 mr-1" />
                            Offline
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{operation.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
              <CardDescription>Common field tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col gap-2"
                  onClick={() => setScanDialogOpen(true)}
                >
                  <QrCode className="w-6 h-6" />
                  <span className="text-sm">Scan Tag</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col gap-2"
                  onClick={() => {
                    setQuickRecordType('weight')
                    setQuickRecordDialogOpen(true)
                  }}
                >
                  <Smartphone className="w-6 h-6" />
                  <span className="text-sm">Quick Weight</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col gap-2"
                  onClick={() => {
                    setQuickRecordType('photo')
                    setQuickRecordDialogOpen(true)
                  }}
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-sm">Take Photo</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col gap-2"
                  onClick={syncData}
                  disabled={!isOnline || syncStatus.isSyncing}
                >
                  <Repeat className="w-6 h-6" />
                  <span className="text-sm">Sync Now</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Offline Records Tab */}
        <TabsContent value="offline">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Offline Records</CardTitle>
                  <CardDescription>Records stored locally, waiting to sync</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSyncedRecords}
                    disabled={stats.synced === 0}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Synced
                  </Button>
                  <Button
                    size="sm"
                    onClick={syncData}
                    disabled={!isOnline || syncStatus.isSyncing || stats.pendingSync === 0}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Sync All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {offlineRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium">No Offline Records</p>
                  <p className="text-sm">All data has been synced</p>
                </div>
              ) : (
                <ScrollArea className="h-80">
                  <div className="space-y-3">
                    {offlineRecords.map((record) => (
                      <div
                        key={record.id}
                        className={`flex items-center gap-4 p-4 rounded-lg border ${
                          record.synced ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          record.synced ? 'bg-green-100' : 'bg-amber-100'
                        }`}>
                          {record.synced ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-amber-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge className={getTypeColor(record.type)}>{record.type}</Badge>
                            <span className="font-medium">{record.animalTag}</span>
                            {record.synced && (
                              <Badge variant="outline" className="text-green-600 border-green-300">
                                Synced
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(record.timestamp).toLocaleString()}
                          </p>
                          {record.photoUrl && (
                            <div className="mt-2 w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                              <Image className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => {}}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {!record.synced && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500"
                              onClick={() => deleteRecord(record.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync Settings Tab */}
        <TabsContent value="sync">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sync Settings</CardTitle>
                <CardDescription>Configure data synchronization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto Sync</p>
                    <p className="text-sm text-gray-500">Automatically sync when online</p>
                  </div>
                  <Switch
                    checked={settings.autoSync}
                    onCheckedChange={(checked) => updateSetting('autoSync', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sync on Wi-Fi Only</p>
                    <p className="text-sm text-gray-500">Save mobile data</p>
                  </div>
                  <Switch
                    checked={settings.syncOnWifiOnly}
                    onCheckedChange={(checked) => updateSetting('syncOnWifiOnly', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sync Notifications</p>
                    <p className="text-sm text-gray-500">Get notified after sync completes</p>
                  </div>
                  <Switch
                    checked={settings.notifyOnSync}
                    onCheckedChange={(checked) => updateSetting('notifyOnSync', checked)}
                  />
                </div>

                <Separator />

                <div>
                  <p className="font-medium mb-2">Last Sync</p>
                  <p className="text-sm text-gray-500">
                    {syncStatus.lastSync
                      ? new Date(syncStatus.lastSync).toLocaleString()
                      : 'Never'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mobile Settings</CardTitle>
                <CardDescription>App preferences for field use</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Vibrate className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium">Vibration Feedback</p>
                      <p className="text-sm text-gray-500">Haptic feedback for actions</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.vibrationFeedback}
                    onCheckedChange={(checked) => updateSetting('vibrationFeedback', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium">Sound Feedback</p>
                      <p className="text-sm text-gray-500">Audio confirmations</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.soundFeedback}
                    onCheckedChange={(checked) => updateSetting('soundFeedback', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium">Auto-detect Location</p>
                      <p className="text-sm text-gray-500">Tag records with GPS location</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.autoDetectLocation}
                    onCheckedChange={(checked) => updateSetting('autoDetectLocation', checked)}
                  />
                </div>

                <Separator />

                <div>
                  <p className="font-medium mb-2">Photo Quality</p>
                  <div className="flex gap-2">
                    {['low', 'medium', 'high'].map((quality) => (
                      <Button
                        key={quality}
                        variant={settings.photoQuality === quality ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateSetting('photoQuality', quality as 'low' | 'medium' | 'high')}
                        className={settings.photoQuality === quality ? 'bg-amber-600 hover:bg-amber-700' : ''}
                      >
                        {quality.charAt(0).toUpperCase() + quality.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Data Management</CardTitle>
                <CardDescription>Manage local storage and data retention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Database className="w-5 h-5 text-gray-500" />
                      <p className="font-medium">Storage Used</p>
                    </div>
                    <p className="text-2xl font-bold">{stats.storageUsed}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {offlineRecords.length} records stored locally
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-5 h-5 text-gray-500" />
                      <p className="font-medium">Data Retention</p>
                    </div>
                    <p className="text-2xl font-bold">{settings.dataRetentionDays} days</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Offline data auto-deleted after retention period
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Download className="w-5 h-5 text-gray-500" />
                      <p className="font-medium">Export Data</p>
                    </div>
                    <Button variant="outline" size="sm" className="mt-1">
                      <Download className="w-4 h-4 mr-2" />
                      Export All
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Scan Tag Dialog */}
      <Dialog open={scanDialogOpen} onOpenChange={setScanDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Animal Tag</DialogTitle>
            <DialogDescription>
              Scan QR code or enter tag number manually
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <QrCode className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-sm text-gray-500">Camera viewfinder would appear here</p>
                <Button variant="outline" size="sm" className="mt-4">
                  <Camera className="w-4 h-4 mr-2" />
                  Open Camera
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or enter manually</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagNumber">Tag Number</Label>
              <Input
                id="tagNumber"
                placeholder="e.g., C001"
                value={scannedTag}
                onChange={(e) => setScannedTag(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScanDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                console.log('Scanned tag:', scannedTag)
                setScanDialogOpen(false)
                setQuickRecordType('weight')
                setQuickRecordDialogOpen(true)
              }}
              disabled={!scannedTag}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Record Dialog */}
      <Dialog open={quickRecordDialogOpen} onOpenChange={setQuickRecordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Record: {quickRecordType?.charAt(0).toUpperCase()}{quickRecordType?.slice(1)}</DialogTitle>
            <DialogDescription>
              Record data offline - will sync when connected
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quickAnimalTag">Animal Tag</Label>
              <Input id="quickAnimalTag" placeholder="e.g., C001" />
            </div>

            {quickRecordType === 'weight' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quickWeight">Weight (kg)</Label>
                  <Input id="quickWeight" type="number" placeholder="450" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quickBCS">Body Condition</Label>
                  <Input id="quickBCS" type="number" min="1" max="5" placeholder="3" />
                </div>
              </div>
            )}

            {quickRecordType === 'photo' && (
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Camera className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Tap to capture photo</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="quickNotes">Notes (Optional)</Label>
              <Input id="quickNotes" placeholder="Add notes..." />
            </div>

            <div className="p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
              <WifiOff className="w-4 h-4 inline mr-2" />
              This record will be saved offline and synced later
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickRecordDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                // Save offline record
                const newRecord: OfflineRecord = {
                  id: `offline-${Date.now()}`,
                  type: quickRecordType as OfflineRecord['type'],
                  animalTag: 'New',
                  data: {},
                  timestamp: new Date().toISOString(),
                  synced: false,
                }
                setOfflineRecords(prev => [newRecord, ...prev])
                setQuickRecordDialogOpen(false)
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Save Offline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
