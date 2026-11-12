'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Leaf,
  Tractor,
  Wheat,
  TreeDeciduous,
  Fish,
  Bird,
  Milk,
  Flower2,
  Grape,
  Sun,
  Droplets,
  Wind,
  Plus,
  Search,
  MapPin,
  Calendar,
  TrendingUp,
  Package,
  Users,
  BarChart3,
  Settings,
  Bell,
  FileText,
  Camera,
  Thermometer,
  CloudRain,
  Activity,
  Weight,
  Heart,
  Zap,
} from 'lucide-react'

// Import the Livestock Management Container (Phase 2)
import { LivestockManagementContainer } from './livestock/LivestockManagementContainer'

// Agriculture sub-vertical configurations
const agricultureSubVerticals = [
  { id: 'cattle-farming', name: 'Cattle Farming', icon: Leaf, color: '#8B4513' },
  { id: 'sheep-farming', name: 'Sheep Farming', icon: Leaf, color: '#A0522D' },
  { id: 'goat-farming', name: 'Goat Farming', icon: Leaf, color: '#D2691E' },
  { id: 'piggery', name: 'Piggery', icon: Leaf, color: '#FFC0CB' },
  { id: 'poultry-farming', name: 'Poultry Farming', icon: Bird, color: '#FFD700' },
  { id: 'dairy-farming', name: 'Dairy Farming', icon: Milk, color: '#F5F5DC' },
  { id: 'equine', name: 'Equine / Horse Stud', icon: Zap, color: '#8B0000' },
  { id: 'game-farming', name: 'Game Farming', icon: Leaf, color: '#556B2F' },
  { id: 'crop-farming', name: 'Crop Farming', icon: Wheat, color: '#DAA520' },
  { id: 'horticulture', name: 'Horticulture', icon: Flower2, color: '#228B22' },
  { id: 'orchards', name: 'Orchards / Vineyards', icon: Grape, color: '#800020' },
  { id: 'aquaculture', name: 'Aquaculture', icon: Fish, color: '#006994' },
  { id: 'animal-feed', name: 'Animal Feed Production', icon: Package, color: '#8B7355' },
  { id: 'agricultural-services', name: 'Agricultural Services', icon: Tractor, color: '#2F4F4F' },
]

interface Farm {
  id: string
  farmName: string
  province: string
  totalHectares: number
  farmType: string
  status: string
  createdAt: string
}

interface LivestockRecord {
  id: string
  tagNumber: string
  type: string
  breed: string
  weight: number
  status: string
  birthDate: string
}

interface CropRecord {
  id: string
  fieldName: string
  cropType: string
  variety: string
  hectares: number
  plantingDate: string
  expectedHarvest: string
  status: string
}

interface AgricultureViewProps {
  subVerticalId?: string
}

export function AgricultureView({ subVerticalId = 'cattle-farming' }: AgricultureViewProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [farm, setFarm] = useState<Farm | null>(null)
  const [livestock, setLivestock] = useState<LivestockRecord[]>([])
  const [crops, setCrops] = useState<CropRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateFarm, setShowCreateFarm] = useState(false)
  
  // Form state for farm creation
  const [farmForm, setFarmForm] = useState({
    farmName: '',
    province: '',
    totalHectares: 0,
    farmType: 'mixed',
  })

  // Get sub-vertical config
  const subVertical = agricultureSubVerticals.find(sv => sv.id === subVerticalId) || agricultureSubVerticals[0]
  const SubVerticalIcon = subVertical.icon

  // Fetch farm data
  useEffect(() => {
    const fetchFarm = async () => {
      try {
        const sessionStr = localStorage.getItem('groway_session')
        const session = sessionStr ? JSON.parse(sessionStr) : null
        const merchantId = session?.merchantId || 'test-merchant'
        
        const response = await fetch(`/api/merchant-os/agriculture/farm?merchantId=${merchantId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.farms && data.farms.length > 0) {
            setFarm(data.farms[0])
          }
        }
      } catch (error) {
        console.error('Failed to fetch farm:', error)
      }
    }
    
    fetchFarm()
  }, [])

  // Create farm
  const handleCreateFarm = async () => {
    setLoading(true)
    try {
      const sessionStr = localStorage.getItem('groway_session')
      const session = sessionStr ? JSON.parse(sessionStr) : null
      const merchantId = session?.merchantId || 'test-merchant'
      
      const response = await fetch(`/api/merchant-os/agriculture/farm?merchantId=${merchantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(farmForm),
      })
      
      if (response.ok) {
        const data = await response.json()
        setFarm(data.farm)
        setShowCreateFarm(false)
      }
    } catch (error) {
      console.error('Failed to create farm:', error)
    } finally {
      setLoading(false)
    }
  }

  // Mock weather data
  const weatherData = {
    temperature: 24,
    humidity: 65,
    windSpeed: 12,
    rainfall: 0,
    forecast: 'Partly Cloudy',
  }

  // Mock market prices
  const marketPrices = [
    { commodity: 'Maize (White)', price: 4250, unit: 'R/ton', change: +2.3 },
    { commodity: 'Beef (Class A)', price: 62.50, unit: 'R/kg', change: -1.2 },
    { commodity: 'Wool (Merino)', price: 185, unit: 'R/kg', change: +0.8 },
    { commodity: 'Milk (Bulk)', price: 6.80, unit: 'R/L', change: +0.5 },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${subVertical.color}20` }}
            >
              <SubVerticalIcon className="w-5 h-5" style={{ color: subVertical.color }} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{subVertical.name}</h1>
              <p className="text-sm text-gray-500">{farm?.farmName || 'Create your farm profile to get started'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Activity className="w-3 h-3 mr-1" />
              Active
            </Badge>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {!farm && !showCreateFarm ? (
          /* Create Farm Prompt */
          <Card className="max-w-xl mx-auto">
            <CardHeader className="text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${subVertical.color}20` }}
              >
                <SubVerticalIcon className="w-8 h-8" style={{ color: subVertical.color }} />
              </div>
              <CardTitle>Create Your Farm Profile</CardTitle>
              <CardDescription>
                Set up your farm to access specialized management tools for {subVertical.name.toLowerCase()}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full" 
                onClick={() => setShowCreateFarm(true)}
                style={{ backgroundColor: subVertical.color }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Farm Profile
              </Button>
            </CardContent>
          </Card>
        ) : showCreateFarm ? (
          /* Farm Creation Form */
          <Card className="max-w-xl mx-auto">
            <CardHeader>
              <CardTitle>Create Farm Profile</CardTitle>
              <CardDescription>Enter your farm details to get started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="farmName">Farm Name</Label>
                <Input
                  id="farmName"
                  placeholder="Enter farm name"
                  value={farmForm.farmName}
                  onChange={(e) => setFarmForm({ ...farmForm, farmName: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="province">Province</Label>
                <Select 
                  value={farmForm.province} 
                  onValueChange={(value) => setFarmForm({ ...farmForm, province: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Eastern Cape">Eastern Cape</SelectItem>
                    <SelectItem value="Free State">Free State</SelectItem>
                    <SelectItem value="Gauteng">Gauteng</SelectItem>
                    <SelectItem value="KwaZulu-Natal">KwaZulu-Natal</SelectItem>
                    <SelectItem value="Limpopo">Limpopo</SelectItem>
                    <SelectItem value="Mpumalanga">Mpumalanga</SelectItem>
                    <SelectItem value="Northern Cape">Northern Cape</SelectItem>
                    <SelectItem value="North West">North West</SelectItem>
                    <SelectItem value="Western Cape">Western Cape</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="totalHectares">Total Hectares</Label>
                <Input
                  id="totalHectares"
                  type="number"
                  placeholder="Enter farm size in hectares"
                  value={farmForm.totalHectares || ''}
                  onChange={(e) => setFarmForm({ ...farmForm, totalHectares: parseFloat(e.target.value) || 0 })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="farmType">Farm Type</Label>
                <Select 
                  value={farmForm.farmType} 
                  onValueChange={(value) => setFarmForm({ ...farmForm, farmType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select farm type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="livestock">Livestock</SelectItem>
                    <SelectItem value="crop">Crop</SelectItem>
                    <SelectItem value="mixed">Mixed (Livestock & Crops)</SelectItem>
                    <SelectItem value="dairy">Dairy</SelectItem>
                    <SelectItem value="poultry">Poultry</SelectItem>
                    <SelectItem value="game">Game Farm</SelectItem>
                    <SelectItem value="aquaculture">Aquaculture</SelectItem>
                    <SelectItem value="horticulture">Horticulture</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowCreateFarm(false)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateFarm} 
                  disabled={loading || !farmForm.farmName || !farmForm.province}
                  className="flex-1"
                  style={{ backgroundColor: subVertical.color }}
                >
                  {loading ? 'Creating...' : 'Create Farm'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Main Dashboard */
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white border">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="livestock">Livestock</TabsTrigger>
              <TabsTrigger value="crops">Crops</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="records">Records</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Farm Size</p>
                        <p className="text-xl font-semibold">{farm?.totalHectares || 0} ha</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <Leaf className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Farm Type</p>
                        <p className="text-xl font-semibold capitalize">{farm?.farmType || 'Mixed'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Province</p>
                        <p className="text-xl font-semibold">{farm?.province || '-'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <p className="text-xl font-semibold capitalize">{farm?.status || 'Active'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Weather & Market Prices */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weather Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sun className="w-5 h-5 text-amber-500" />
                      Weather
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{weatherData.temperature}°C</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{weatherData.humidity}% Humidity</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wind className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{weatherData.windSpeed} km/h</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CloudRain className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{weatherData.rainfall}mm Rain</span>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-gray-500">Forecast: {weatherData.forecast}</p>
                  </CardContent>
                </Card>

                {/* Market Prices Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      Market Prices
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {marketPrices.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{item.commodity}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">R{item.price.toFixed(2)}</span>
                            <span className={`text-xs ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.change >= 0 ? '+' : ''}{item.change}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Livestock Tab */}
            <TabsContent value="livestock" className="space-y-6">
              {farm ? (
                <LivestockManagementContainer 
                  farmId={farm.id} 
                  subVerticalColor={subVertical.color}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Livestock Management</CardTitle>
                      <Button size="sm" style={{ backgroundColor: subVertical.color }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Animal
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-gray-500">
                      <Leaf className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p>No livestock records yet</p>
                      <p className="text-sm">Add your first animal to start tracking</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Crops Tab */}
            <TabsContent value="crops" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Crop Management</CardTitle>
                    <Button size="sm" style={{ backgroundColor: subVertical.color }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Field
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-gray-500">
                    <Wheat className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No crop records yet</p>
                    <p className="text-sm">Add your first field to start tracking</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Inventory Tab */}
            <TabsContent value="inventory" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Inventory</CardTitle>
                    <Button size="sm" style={{ backgroundColor: subVertical.color }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No inventory items yet</p>
                    <p className="text-sm">Add feed, medicine, equipment, and more</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Records Tab */}
            <TabsContent value="records" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Farm Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No records yet</p>
                    <p className="text-sm">Health records, breeding logs, and more will appear here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}

export default AgricultureView
