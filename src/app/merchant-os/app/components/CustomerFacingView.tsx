'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  MapPin,
  Globe,
  ShoppingCart,
  QrCode,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Share2,
  Copy,
  Image as ImageIcon,
  Coins,
  Clock,
  Star,
  Phone,
  Mail,
  ExternalLink,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Settings,
  Palette,
  Truck,
  CreditCard,
  Package,
  Tag,
  Users,
  TrendingUp,
  BarChart3,
  Wifi,
  Navigation,
  Crosshair,
  Building2,
  Search,
  Filter,
  Map,
  Layers,
  RefreshCw,
  Zap,
  Store,
  MessageCircle,
  Instagram,
  Facebook,
  Twitter,
  Globe2,
  Lock,
  Unlock,
  EyeOff,
  FileText,
  ImagePlus,
  Link2,
  X,
} from 'lucide-react'

// ============================================
// TYPES & INTERFACES
// ============================================

interface GeoLocation {
  enabled: boolean
  latitude: number
  longitude: number
  address: string
  city: string
  province: string
  postalCode: string
  country: string
  radius: number // km
}

interface GeoDiscoverySettings {
  enabled: boolean
  showOnMap: boolean
  allowCheckIns: boolean
  showNearbyCompetitors: boolean
  displayDistance: boolean
  featuredListing: boolean
  categories: string[]
  keywords: string[]
  openingHoursShow: boolean
  contactShow: boolean
  photosShow: boolean
  reviewsShow: boolean
  promotionsShow: boolean
}

interface BusinessProfile {
  name: string
  description: string
  category: string
  subcategory: string
  logo?: string
  coverImage?: string
  photos: string[]
  phone: string
  email: string
  website: string
  socialMedia: {
    instagram?: string
    facebook?: string
    twitter?: string
  }
  openingHours: {
    day: string
    open: string
    close: string
    closed: boolean
  }[]
  amenities: string[]
  priceRange: string
  paymentMethods: string[]
}

interface OnlineStoreSettings {
  enabled: boolean
  storeName: string
  storeDescription: string
  currency: string
  logo?: string
  banner?: string
  themeColor: string
  allowPickup: boolean
  allowDelivery: boolean
  deliveryRadius: number // km
  deliveryFee: number
  freeDeliveryMin: number
  minOrderValue: number
  acceptedPayments: string[]
  showPrices: boolean
  allowPreOrder: boolean
  requireLogin: boolean
  termsUrl?: string
  privacyUrl?: string
}

interface StoreProduct {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  image?: string
  category: string
  available: boolean
  stock: number
  sku: string
  featured: boolean
  tags: string[]
}

interface StoreCategory {
  id: string
  name: string
  description: string
  image?: string
  productCount: number
}

interface StoreOrder {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  items: {
    name: string
    quantity: number
    price: number
  }[]
  subtotal: number
  deliveryFee: number
  total: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'dispatched' | 'delivered' | 'cancelled'
  type: 'pickup' | 'delivery'
  address?: string
  notes?: string
  createdAt: string
}

interface QRMenuLink {
  id: string
  name: string
  url: string
  qrCode: string
  scans: number
  active: boolean
}

// ============================================
// SAMPLE DATA
// ============================================

const defaultGeoLocation: GeoLocation = {
  enabled: true,
  latitude: -33.9249,
  longitude: 18.4241,
  address: '123 Long Street',
  city: 'Cape Town',
  province: 'Western Cape',
  postalCode: '8001',
  country: 'South Africa',
  radius: 5
}

const defaultGeoSettings: GeoDiscoverySettings = {
  enabled: true,
  showOnMap: true,
  allowCheckIns: true,
  showNearbyCompetitors: false,
  displayDistance: true,
  featuredListing: false,
  categories: ['Restaurant', 'Cafe', 'Bar'],
  keywords: ['food', 'dining', 'drinks'],
  openingHoursShow: true,
  contactShow: true,
  photosShow: true,
  reviewsShow: true,
  promotionsShow: true
}

const defaultBusinessProfile: BusinessProfile = {
  name: 'The Braai House',
  description: 'Authentic South African cuisine with a modern twist. Famous for our flame-grilled meats and traditional dishes.',
  category: 'Restaurant',
  subcategory: 'South African',
  phone: '+27 21 123 4567',
  email: 'info@braaihouse.co.za',
  website: 'www.braaihouse.co.za',
  socialMedia: {
    instagram: '@braaihouse',
    facebook: 'braaihousect',
    twitter: '@braaihouse'
  },
  openingHours: [
    { day: 'Monday', open: '11:00', close: '22:00', closed: false },
    { day: 'Tuesday', open: '11:00', close: '22:00', closed: false },
    { day: 'Wednesday', open: '11:00', close: '22:00', closed: false },
    { day: 'Thursday', open: '11:00', close: '22:00', closed: false },
    { day: 'Friday', open: '11:00', close: '23:00', closed: false },
    { day: 'Saturday', open: '10:00', close: '23:00', closed: false },
    { day: 'Sunday', open: '10:00', close: '21:00', closed: false }
  ],
  amenities: ['WiFi', 'Parking', 'Card Payment', 'Outdoor Seating', 'Wheelchair Access'],
  priceRange: '$$',
  paymentMethods: ['Cash', 'Card', 'EFT', 'SnapScan', 'Zapper']
}

const defaultStoreSettings: OnlineStoreSettings = {
  enabled: true,
  storeName: 'The Braai House Online',
  storeDescription: 'Order your favorite South African dishes online for pickup or delivery.',
  currency: 'ZAR',
  themeColor: '#00897B',
  allowPickup: true,
  allowDelivery: true,
  deliveryRadius: 10,
  deliveryFee: 35,
  freeDeliveryMin: 250,
  minOrderValue: 50,
  acceptedPayments: ['Card', 'EFT', 'SnapScan', 'Zapper'],
  showPrices: true,
  allowPreOrder: true,
  requireLogin: false
}

const sampleCategories: StoreCategory[] = [
  { id: 'starters', name: 'Starters', description: 'Begin your meal', productCount: 5 },
  { id: 'mains', name: 'Main Courses', description: 'Hearty dishes', productCount: 8 },
  { id: 'burgers', name: 'Burgers & Sandwiches', description: 'Hand-crafted comfort food', productCount: 4 },
  { id: 'drinks', name: 'Beverages', description: 'Refreshing drinks', productCount: 6 },
  { id: 'desserts', name: 'Desserts', description: 'Sweet endings', productCount: 3 }
]

const sampleProducts: StoreProduct[] = [
  { id: 'p1', name: 'Crispy Calamari', description: 'Tender calamari rings with garlic aioli', price: 89, category: 'starters', available: true, stock: 50, sku: 'STR-001', featured: true, tags: ['seafood', 'starter'] },
  { id: 'p2', name: 'Bunny Chow Starter', description: 'Quarter loaf with lamb curry', price: 75, category: 'starters', available: true, stock: 30, sku: 'STR-002', featured: false, tags: ['traditional'] },
  { id: 'p3', name: 'Shisa Nyama Platter', description: 'Grilled meats with pap and chakalaka', price: 245, category: 'mains', available: true, stock: 20, sku: 'MAIN-001', featured: true, tags: ['signature', 'bbq'] },
  { id: 'p4', name: 'Grilled Kingklip', description: 'Line-caught fish with roasted vegetables', price: 195, category: 'mains', available: true, stock: 15, sku: 'MAIN-002', featured: false, tags: ['seafood', 'healthy'] },
  { id: 'p5', name: 'The Gatsby', description: 'Foot-long roll loaded with chips and polony', price: 125, category: 'burgers', available: true, stock: 25, sku: 'BRG-001', featured: true, tags: ['traditional', 'popular'] },
  { id: 'p6', name: 'Craft Beer Selection', description: 'Local craft beers on rotation', price: 55, category: 'drinks', available: true, stock: 100, sku: 'DRK-001', featured: false, tags: ['alcohol', 'craft'] },
  { id: 'p7', name: 'Malva Pudding', description: 'Warm sticky pudding with custard', price: 65, category: 'desserts', available: true, stock: 15, sku: 'DES-001', featured: true, tags: ['traditional', 'sweet'] }
]

const sampleOrders: StoreOrder[] = [
  { id: 'o1', orderNumber: 'ORD-001', customerName: 'John Doe', customerPhone: '+27 82 123 4567', items: [{ name: 'Shisa Nyama Platter', quantity: 1, price: 245 }], subtotal: 245, deliveryFee: 35, total: 280, status: 'pending', type: 'delivery', address: '45 Kloof Street, Cape Town', createdAt: new Date().toISOString() },
  { id: 'o2', orderNumber: 'ORD-002', customerName: 'Jane Smith', customerPhone: '+27 83 987 6543', items: [{ name: 'The Gatsby', quantity: 2, price: 125 }, { name: 'Craft Beer Selection', quantity: 2, price: 55 }], subtotal: 360, deliveryFee: 0, total: 360, status: 'preparing', type: 'pickup', createdAt: new Date(Date.now() - 3600000).toISOString() }
]

const sampleQRLinks: QRMenuLink[] = [
  { id: 'qr1', name: 'Main Entrance', url: 'https://menu.groway.co.za/braaihouse', qrCode: 'QR-MAIN-001', scans: 1245, active: true },
  { id: 'qr2', name: 'Table QR Sheet', url: 'https://menu.groway.co.za/braaihouse/tables', qrCode: 'QR-TABLES-001', scans: 856, active: true },
  { id: 'qr3', name: 'Takeaway Menu', url: 'https://menu.groway.co.za/braaihouse/takeaway', qrCode: 'QR-TAKE-001', scans: 432, active: true }
]

// ============================================
// MAIN COMPONENT
// ============================================

export function CustomerFacingView() {
  const [activeTab, setActiveTab] = useState('geo')
  const [geoLocation, setGeoLocation] = useState<GeoLocation>(defaultGeoLocation)
  const [geoSettings, setGeoSettings] = useState<GeoDiscoverySettings>(defaultGeoSettings)
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(defaultBusinessProfile)
  const [storeSettings, setStoreSettings] = useState<OnlineStoreSettings>(defaultStoreSettings)
  const [categories, setCategories] = useState<StoreCategory[]>(sampleCategories)
  const [products, setProducts] = useState<StoreProduct[]>(sampleProducts)
  const [orders, setOrders] = useState<StoreOrder[]>(sampleOrders)
  const [qrLinks, setQRLinks] = useState<QRMenuLink[]>(sampleQRLinks)
  
  // Dialogs
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<StoreOrder | null>(null)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [storePreviewOpen, setStorePreviewOpen] = useState(false)
  
  // Form states
  const [newCategory, setNewCategory] = useState({ name: '', description: '' })
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    sku: ''
  })

  // Stats
  const totalProducts = products.length
  const activeProducts = products.filter(p => p.available).length
  const featuredProducts = products.filter(p => p.featured).length
  const totalScans = qrLinks.reduce((sum, qr) => sum + qr.scans, 0)
  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)

  // Toggle product availability
  const toggleProductAvailability = (productId: string) => {
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, available: !p.available } : p
    ))
  }

  // Update order status
  const updateOrderStatus = (orderId: string, status: StoreOrder['status']) => {
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, status } : o
    ))
  }

  // Get status color
  const getStatusColor = (status: StoreOrder['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-blue-100 text-blue-700',
      preparing: 'bg-orange-100 text-orange-700',
      ready: 'bg-green-100 text-green-700',
      dispatched: 'bg-purple-100 text-purple-700',
      delivered: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700'
    }
    return colors[status]
  }

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
              <Globe className="h-5 w-5 text-[#00897B]" />
              Customer-Facing Channels
            </h1>
            <p className="text-sm text-[#757575]">Manage your digital presence and online sales</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setPreviewDialogOpen(true)}>
              <Eye className="h-4 w-4 mr-2" />
              Preview All
            </Button>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-[#E0F2F1] rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-[#00897B]">{totalScans}</p>
            <p className="text-xs text-[#757575]">QR Scans</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{activeProducts}</p>
            <p className="text-xs text-[#757575]">Online Products</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{pendingOrders}</p>
            <p className="text-xs text-[#757575]">Pending Orders</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-600">R{totalRevenue.toFixed(0)}</p>
            <p className="text-xs text-[#757575]">Store Revenue</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-purple-600">{geoSettings.enabled ? 'Active' : 'Inactive'}</p>
            <p className="text-xs text-[#757575]">Geo Status</p>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="bg-white border-b border-gray-200 px-4">
            <TabsList className="h-12 bg-transparent">
              <TabsTrigger value="geo" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <MapPin className="h-4 w-4 mr-2" />
                Geo-Discovery
              </TabsTrigger>
              <TabsTrigger value="store" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Mini Online Store
              </TabsTrigger>
              <TabsTrigger value="qrlinks" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <QrCode className="h-4 w-4 mr-2" />
                QR Menu Links
              </TabsTrigger>
            </TabsList>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-4">
              {/* ============================================ */}
              {/* GEO-DISCOVERY TAB */}
              {/* ============================================ */}
              <TabsContent value="geo" className="m-0 space-y-4">
                {/* Location Settings */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Navigation className="h-4 w-4 text-[#00897B]" />
                          Location Settings
                        </CardTitle>
                        <CardDescription>Set your business location for geo-discovery</CardDescription>
                      </div>
                      <Switch
                        checked={geoLocation.enabled}
                        onCheckedChange={(checked) => setGeoLocation(prev => ({ ...prev, enabled: checked }))}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Address</Label>
                        <Input
                          value={geoLocation.address}
                          onChange={(e) => setGeoLocation(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="Street address"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input
                          value={geoLocation.city}
                          onChange={(e) => setGeoLocation(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="City"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Province</Label>
                        <Select
                          value={geoLocation.province}
                          onValueChange={(value) => setGeoLocation(prev => ({ ...prev, province: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Western Cape">Western Cape</SelectItem>
                            <SelectItem value="Gauteng">Gauteng</SelectItem>
                            <SelectItem value="KwaZulu-Natal">KwaZulu-Natal</SelectItem>
                            <SelectItem value="Eastern Cape">Eastern Cape</SelectItem>
                            <SelectItem value="Free State">Free State</SelectItem>
                            <SelectItem value="Limpopo">Limpopo</SelectItem>
                            <SelectItem value="Mpumalanga">Mpumalanga</SelectItem>
                            <SelectItem value="North West">North West</SelectItem>
                            <SelectItem value="Northern Cape">Northern Cape</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Postal Code</Label>
                        <Input
                          value={geoLocation.postalCode}
                          onChange={(e) => setGeoLocation(prev => ({ ...prev, postalCode: e.target.value }))}
                          placeholder="Postal code"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Latitude</Label>
                        <Input
                          type="number"
                          step="0.0001"
                          value={geoLocation.latitude}
                          onChange={(e) => setGeoLocation(prev => ({ ...prev, latitude: parseFloat(e.target.value) }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Longitude</Label>
                        <Input
                          type="number"
                          step="0.0001"
                          value={geoLocation.longitude}
                          onChange={(e) => setGeoLocation(prev => ({ ...prev, longitude: parseFloat(e.target.value) }))}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Discovery Radius (km)</Label>
                      <div className="flex items-center gap-4">
                        <Input
                          type="number"
                          value={geoLocation.radius}
                          onChange={(e) => setGeoLocation(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
                          className="w-24"
                        />
                        <span className="text-sm text-[#757575]">Customers within this radius will see your business</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Crosshair className="h-4 w-4 mr-2" />
                        Auto-detect Location
                      </Button>
                      <Button variant="outline" size="sm">
                        <Map className="h-4 w-4 mr-2" />
                        View on Map
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Business Profile */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Store className="h-4 w-4 text-[#00897B]" />
                      Business Profile
                    </CardTitle>
                    <CardDescription>How your business appears in discovery</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Business Name</Label>
                        <Input
                          value={businessProfile.name}
                          onChange={(e) => setBusinessProfile(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={businessProfile.category}
                          onValueChange={(value) => setBusinessProfile(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Restaurant">Restaurant</SelectItem>
                            <SelectItem value="Cafe">Cafe</SelectItem>
                            <SelectItem value="Bar">Bar</SelectItem>
                            <SelectItem value="Retail">Retail</SelectItem>
                            <SelectItem value="Service">Service</SelectItem>
                            <SelectItem value="Entertainment">Entertainment</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={businessProfile.description}
                        onChange={(e) => setBusinessProfile(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input
                          value={businessProfile.phone}
                          onChange={(e) => setBusinessProfile(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={businessProfile.email}
                          onChange={(e) => setBusinessProfile(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Website</Label>
                        <Input
                          value={businessProfile.website}
                          onChange={(e) => setBusinessProfile(prev => ({ ...prev, website: e.target.value }))}
                        />
                      </div>
                    </div>
                    
                    {/* Social Media */}
                    <div className="space-y-2">
                      <Label>Social Media</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex items-center gap-2">
                          <Instagram className="h-4 w-4 text-pink-500" />
                          <Input
                            placeholder="@username"
                            value={businessProfile.socialMedia.instagram || ''}
                            onChange={(e) => setBusinessProfile(prev => ({
                              ...prev,
                              socialMedia: { ...prev.socialMedia, instagram: e.target.value }
                            }))}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Facebook className="h-4 w-4 text-blue-600" />
                          <Input
                            placeholder="page name"
                            value={businessProfile.socialMedia.facebook || ''}
                            onChange={(e) => setBusinessProfile(prev => ({
                              ...prev,
                              socialMedia: { ...prev.socialMedia, facebook: e.target.value }
                            }))}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Twitter className="h-4 w-4 text-sky-500" />
                          <Input
                            placeholder="@handle"
                            value={businessProfile.socialMedia.twitter || ''}
                            onChange={(e) => setBusinessProfile(prev => ({
                              ...prev,
                              socialMedia: { ...prev.socialMedia, twitter: e.target.value }
                            }))}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Discovery Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Discovery Settings</CardTitle>
                    <CardDescription>Control how customers find you</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { key: 'showOnMap', label: 'Show on Map', icon: Map },
                        { key: 'allowCheckIns', label: 'Allow Check-ins', icon: CheckCircle2 },
                        { key: 'displayDistance', label: 'Display Distance', icon: Navigation },
                        { key: 'featuredListing', label: 'Featured Listing', icon: Star },
                        { key: 'openingHoursShow', label: 'Show Opening Hours', icon: Clock },
                        { key: 'contactShow', label: 'Show Contact Info', icon: Phone },
                        { key: 'photosShow', label: 'Show Photos', icon: ImageIcon },
                        { key: 'reviewsShow', label: 'Show Reviews', icon: Star },
                        { key: 'promotionsShow', label: 'Show Promotions', icon: Tag },
                      ].map(item => (
                        <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2">
                            <item.icon className="h-4 w-4 text-[#757575]" />
                            <span className="text-sm">{item.label}</span>
                          </div>
                          <Switch
                            checked={geoSettings[item.key as keyof GeoDiscoverySettings] as boolean}
                            onCheckedChange={(checked) => setGeoSettings(prev => ({ ...prev, [item.key]: checked }))}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ============================================ */}
              {/* MINI ONLINE STORE TAB */}
              {/* ============================================ */}
              <TabsContent value="store" className="m-0 space-y-4">
                {/* Store Settings */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Store className="h-4 w-4 text-[#00897B]" />
                          Store Settings
                        </CardTitle>
                        <CardDescription>Configure your online store</CardDescription>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={storeSettings.enabled}
                          onCheckedChange={(checked) => setStoreSettings(prev => ({ ...prev, enabled: checked }))}
                        />
                        <span className="text-sm">{storeSettings.enabled ? 'Store Active' : 'Store Inactive'}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Store Name</Label>
                        <Input
                          value={storeSettings.storeName}
                          onChange={(e) => setStoreSettings(prev => ({ ...prev, storeName: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Theme Color</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={storeSettings.themeColor}
                            onChange={(e) => setStoreSettings(prev => ({ ...prev, themeColor: e.target.value }))}
                            className="h-10 w-10 rounded cursor-pointer"
                          />
                          <Input value={storeSettings.themeColor} readOnly className="flex-1" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Store Description</Label>
                      <Textarea
                        value={storeSettings.storeDescription}
                        onChange={(e) => setStoreSettings(prev => ({ ...prev, storeDescription: e.target.value }))}
                        rows={2}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-[#757575]" />
                          <span className="text-sm">Allow Pickup</span>
                        </div>
                        <Switch
                          checked={storeSettings.allowPickup}
                          onCheckedChange={(checked) => setStoreSettings(prev => ({ ...prev, allowPickup: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-[#757575]" />
                          <span className="text-sm">Allow Delivery</span>
                        </div>
                        <Switch
                          checked={storeSettings.allowDelivery}
                          onCheckedChange={(checked) => setStoreSettings(prev => ({ ...prev, allowDelivery: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2">
                          <Coins className="h-4 w-4 text-[#757575]" />
                          <span className="text-sm">Show Prices</span>
                        </div>
                        <Switch
                          checked={storeSettings.showPrices}
                          onCheckedChange={(checked) => setStoreSettings(prev => ({ ...prev, showPrices: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-[#757575]" />
                          <span className="text-sm">Require Login</span>
                        </div>
                        <Switch
                          checked={storeSettings.requireLogin}
                          onCheckedChange={(checked) => setStoreSettings(prev => ({ ...prev, requireLogin: checked }))}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Delivery Radius (km)</Label>
                        <Input
                          type="number"
                          value={storeSettings.deliveryRadius}
                          onChange={(e) => setStoreSettings(prev => ({ ...prev, deliveryRadius: parseInt(e.target.value) }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Delivery Fee (R)</Label>
                        <Input
                          type="number"
                          value={storeSettings.deliveryFee}
                          onChange={(e) => setStoreSettings(prev => ({ ...prev, deliveryFee: parseFloat(e.target.value) }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Free Delivery Over (R)</Label>
                        <Input
                          type="number"
                          value={storeSettings.freeDeliveryMin}
                          onChange={(e) => setStoreSettings(prev => ({ ...prev, freeDeliveryMin: parseFloat(e.target.value) }))}
                        />
                      </div>
                    </div>
                    
                    <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setStorePreviewOpen(true)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview Store
                    </Button>
                  </CardContent>
                </Card>

                {/* Categories */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Product Categories</CardTitle>
                      <Button size="sm" onClick={() => setCategoryDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Category
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {categories.map((category) => (
                        <div
                          key={category.id}
                          className="bg-[#FAFAFA] rounded-lg border border-gray-200 p-3 cursor-pointer hover:border-[#00897B] transition-colors"
                        >
                          <div className="w-full h-16 bg-gradient-to-br from-[#E0F2F1] to-[#B2DFDB] rounded-lg mb-2 flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-[#00897B]/50" />
                          </div>
                          <h4 className="font-medium text-sm text-[#1A1A1A]">{category.name}</h4>
                          <p className="text-xs text-[#757575]">{category.productCount} products</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Products */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Products</CardTitle>
                      <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => {
                        setSelectedProduct(null)
                        setProductDialogOpen(true)
                      }}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Product
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {products.map((product) => (
                        <div
                          key={product.id}
                          className={`relative bg-[#FAFAFA] rounded-lg border ${
                            product.available ? 'border-gray-200 hover:border-[#00897B]/30' : 'border-gray-200 opacity-60'
                          } p-3 transition-colors cursor-pointer`}
                          onClick={() => {
                            setSelectedProduct(product)
                            setProductDialogOpen(true)
                          }}
                        >
                          {/* Image Placeholder */}
                          <div className="w-full h-24 bg-gradient-to-br from-[#E0F2F1] to-[#B2DFDB] rounded-lg mb-2 flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-[#00897B]/50" />
                          </div>
                          
                          {/* Badges */}
                          <div className="absolute top-2 right-2 flex flex-col gap-1">
                            {product.featured && (
                              <Badge className="bg-[#00897B] text-white text-[9px] px-1.5">
                                <Star className="h-2.5 w-2.5 mr-0.5" />
                                Featured
                              </Badge>
                            )}
                            {!product.available && (
                              <Badge className="bg-red-100 text-red-700 text-[9px] px-1.5">Unavailable</Badge>
                            )}
                          </div>
                          
                          {/* Product Info */}
                          <h4 className="font-semibold text-sm text-[#1A1A1A] mb-1">{product.name}</h4>
                          <p className="text-xs text-[#757575] mb-2 line-clamp-2">{product.description}</p>
                          
                          {/* Price & Stock */}
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#00897B]">R{product.price}</span>
                            <span className="text-xs text-[#757575]">Stock: {product.stock}</span>
                          </div>
                          
                          {/* Quick Actions */}
                          <div className="flex items-center gap-2 mt-2">
                            <Switch
                              checked={product.available}
                              onCheckedChange={() => toggleProductAvailability(product.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="text-xs text-[#757575]">Active</span>
                          </div>
                        </div>
                      ))}
                      
                      {/* Add Product Card */}
                      <div
                        className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-3 flex items-center justify-center cursor-pointer hover:border-[#00897B] transition-colors min-h-[200px]"
                        onClick={() => {
                          setSelectedProduct(null)
                          setProductDialogOpen(true)
                        }}
                      >
                        <div className="text-center">
                          <Plus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-[#757575]">Add Product</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Orders */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Recent Orders</CardTitle>
                      <Badge variant="outline">{orders.length} orders</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="bg-[#FAFAFA] rounded-lg border border-gray-200 p-4 cursor-pointer hover:border-[#00897B] transition-colors"
                          onClick={() => {
                            setSelectedOrder(order)
                            setOrderDialogOpen(true)
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-[#1A1A1A]">{order.orderNumber}</span>
                              <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                              <Badge variant="outline" className="text-xs">
                                {order.type === 'delivery' ? <Truck className="h-3 w-3 mr-1" /> : <Package className="h-3 w-3 mr-1" />}
                                {order.type}
                              </Badge>
                            </div>
                            <span className="font-bold text-[#00897B]">R{order.total.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[#757575]">{order.customerName} • {order.customerPhone}</span>
                            <span className="text-xs text-[#757575]">
                              {new Date(order.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ============================================ */}
              {/* QR MENU LINKS TAB */}
              {/* ============================================ */}
              <TabsContent value="qrlinks" className="m-0 space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">QR Menu Links</CardTitle>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Create Link
                      </Button>
                    </div>
                    <CardDescription>Generate QR codes for different menu access points</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {qrLinks.map((qr) => (
                        <Card key={qr.id} className={`cursor-pointer transition-all hover:border-[#00897B] ${!qr.active ? 'opacity-50' : ''}`}>
                          <CardContent className="p-4 text-center">
                            <div className="w-24 h-24 mx-auto bg-white rounded-lg border border-gray-200 flex items-center justify-center mb-3">
                              <QrCode className="h-16 w-16 text-[#00897B]" />
                            </div>
                            <h4 className="font-semibold text-sm text-[#1A1A1A] mb-1">{qr.name}</h4>
                            <p className="text-xs text-[#757575] mb-2 truncate">{qr.url}</p>
                            <div className="flex items-center justify-center gap-2 mb-3">
                              <Badge variant="outline">{qr.scans} scans</Badge>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                              <Switch
                                checked={qr.active}
                                onCheckedChange={() => setQRLinks(prev => prev.map(q =>
                                  q.id === qr.id ? { ...q, active: !q.active } : q
                                ))}
                              />
                              <span className="text-xs">{qr.active ? 'Active' : 'Inactive'}</span>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Button variant="outline" size="sm" className="flex-1">
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                              <Button variant="outline" size="sm" className="flex-1">
                                <Copy className="h-3 w-3 mr-1" />
                                Copy Link
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    {/* Batch Actions */}
                    <Separator className="my-4" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Button variant="outline" className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Download All QRs
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Menu Link
                      </Button>
                      <Button variant="outline" className="w-full">
                        <QrCode className="h-4 w-4 mr-2" />
                        Print QR Cards
                      </Button>
                      <Button variant="outline" className="w-full">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Analytics
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </div>

      {/* Product Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
            <DialogDescription>
              {selectedProduct ? 'Update product details' : 'Add a new product to your store'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input
                value={selectedProduct?.name || newProduct.name}
                onChange={(e) => setSelectedProduct(prev => prev ? { ...prev, name: e.target.value } : setNewProduct(prev => ({ ...prev, name: e.target.value })))}
                placeholder="Enter product name"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={selectedProduct?.description || newProduct.description}
                onChange={(e) => setSelectedProduct(prev => prev ? { ...prev, description: e.target.value } : setNewProduct(prev => ({ ...prev, description: e.target.value })))}
                placeholder="Product description"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (R)</Label>
                <Input
                  type="number"
                  value={selectedProduct?.price || newProduct.price}
                  onChange={(e) => setSelectedProduct(prev => prev ? { ...prev, price: parseFloat(e.target.value) } : setNewProduct(prev => ({ ...prev, price: e.target.value })))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input
                  type="number"
                  value={selectedProduct?.stock || newProduct.stock}
                  onChange={(e) => setSelectedProduct(prev => prev ? { ...prev, stock: parseInt(e.target.value) } : setNewProduct(prev => ({ ...prev, stock: e.target.value })))}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={selectedProduct?.category || newProduct.category}
                  onValueChange={(value) => setSelectedProduct(prev => prev ? { ...prev, category: value } : setNewProduct(prev => ({ ...prev, category: value })))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input
                  value={selectedProduct?.sku || newProduct.sku}
                  onChange={(e) => setSelectedProduct(prev => prev ? { ...prev, sku: e.target.value } : setNewProduct(prev => ({ ...prev, sku: e.target.value })))}
                  placeholder="SKU-001"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={selectedProduct?.featured || false}
                onCheckedChange={(checked) => setSelectedProduct(prev => prev ? { ...prev, featured: checked } : null)}
              />
              <Label className="text-sm">Featured Product</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setProductDialogOpen(false)}>
              {selectedProduct ? 'Save Changes' : 'Add Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Order {selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>
              {selectedOrder?.customerName} • {selectedOrder?.customerPhone}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <Badge className={getStatusColor(selectedOrder.status)}>{selectedOrder.status}</Badge>
                <Badge variant="outline">
                  {selectedOrder.type === 'delivery' ? <Truck className="h-3 w-3 mr-1" /> : <Package className="h-3 w-3 mr-1" />}
                  {selectedOrder.type}
                </Badge>
              </div>
              
              {selectedOrder.type === 'delivery' && selectedOrder.address && (
                <div className="bg-[#FAFAFA] rounded-lg p-3">
                  <Label className="text-xs text-[#757575]">Delivery Address</Label>
                  <p className="text-sm">{selectedOrder.address}</p>
                </div>
              )}
              
              <div>
                <Label className="text-xs text-[#757575]">Order Items</Label>
                <div className="mt-2 space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-[#FAFAFA] rounded-lg p-2">
                      <span className="text-sm">{item.name} x{item.quantity}</span>
                      <span className="font-medium">R{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>R{selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Delivery Fee</span>
                  <span>R{selectedOrder.deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>R{selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>
              
              {selectedOrder.notes && (
                <div className="bg-amber-50 rounded-lg p-3">
                  <Label className="text-xs text-amber-700">Customer Notes</Label>
                  <p className="text-sm text-amber-800">{selectedOrder.notes}</p>
                </div>
              )}
              
              <div>
                <Label className="text-xs text-[#757575]">Update Status</Label>
                <Select
                  value={selectedOrder.status}
                  onValueChange={(value) => updateOrderStatus(selectedOrder.id, value as StoreOrder['status'])}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="preparing">Preparing</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="dispatched">Dispatched</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderDialogOpen(false)}>Close</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">
              <Phone className="h-4 w-4 mr-2" />
              Contact Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Store Preview Dialog */}
      <Dialog open={storePreviewOpen} onOpenChange={setStorePreviewOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Store Preview</DialogTitle>
            <DialogDescription>
              This is how your online store will appear to customers
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 overflow-y-auto max-h-[60vh]">
            {/* Mock Store Front */}
            <div className="border rounded-lg overflow-hidden">
              {/* Header */}
              <div className="p-4 text-white" style={{ backgroundColor: storeSettings.themeColor }}>
                <h2 className="text-lg font-bold">{storeSettings.storeName}</h2>
                <p className="text-sm opacity-90">{storeSettings.storeDescription}</p>
              </div>
              
              {/* Products */}
              <div className="p-4 bg-[#FAFAFA]">
                <div className="grid grid-cols-2 gap-3">
                  {products.filter(p => p.available).slice(0, 4).map((product) => (
                    <div key={product.id} className="bg-white rounded-lg border border-gray-200 p-3">
                      <div className="w-full h-20 bg-gradient-to-br from-[#E0F2F1] to-[#B2DFDB] rounded-lg mb-2 flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-[#00897B]/50" />
                      </div>
                      <h4 className="font-medium text-sm truncate">{product.name}</h4>
                      <p className="text-xs text-[#757575] line-clamp-1">{product.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-sm" style={{ color: storeSettings.themeColor }}>R{product.price}</span>
                        <Button size="sm" style={{ backgroundColor: storeSettings.themeColor }}>Add</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStorePreviewOpen(false)}>Close</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Live Store
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
