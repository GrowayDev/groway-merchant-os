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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
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
  ChefHat,
  Coffee,
  Wine,
  Cake,
  Utensils,
  Soup,
  Salad,
  IceCream,
  Pizza,
  MapPin,
  Users,
  Phone,
  MessageCircle,
  ExternalLink,
  Printer,
  Smartphone,
  Monitor,
  Tablet,
  CheckCircle2,
  AlertCircle,
  Info,
  Sparkles,
  MoreVertical,
  MoveUp,
  MoveDown,
  Settings,
  Palette,
  Layout,
  Globe,
  ShoppingCart,
  Calendar,
  Zap,
  Heart,
  Camera,
  Filter,
} from 'lucide-react'

// Menu category interface
interface MenuCategory {
  id: string
  name: string
  description: string
  icon: string
  items: MenuItem[]
  active: boolean
  sortOrder: number
}

// Menu item interface
interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  image?: string
  dietary: ('vegetarian' | 'vegan' | 'gluten-free' | 'halaal' | 'kosher')[]
  allergens: string[]
  preparationTime: number // in minutes
  spicyLevel?: 1 | 2 | 3
  popular: boolean
  newItem: boolean
  available: boolean
  modifiers: MenuModifier[]
}

// Menu modifier interface
interface MenuModifier {
  id: string
  name: string
  required: boolean
  options: { name: string; price: number }[]
}

// Table interface
interface TableQR {
  id: string
  tableNumber: string
  tableLabel: string
  section: string
  qrCode: string
  active: boolean
  scanCount: number
  lastScanned?: string
}

// WhatsApp integration
interface WhatsAppSettings {
  enabled: boolean
  phoneNumber: string
  autoResponse: string
  orderChannelEnabled: boolean
  reservationEnabled: boolean
}

// Menu settings
interface MenuSettings {
  businessName: string
  logo?: string
  tagline: string
  currency: string
  showPrices: boolean
  showPreparationTime: boolean
  showDietaryInfo: boolean
  showAllergens: boolean
  allowPreOrder: boolean
  allowReservations: boolean
  themeColor: string
  fontFamily: string
  whatsappSettings: WhatsAppSettings
}

// Sample menu categories
const sampleCategories: MenuCategory[] = [
  {
    id: 'starters',
    name: 'Starters',
    description: 'Begin your culinary journey',
    icon: 'salad',
    active: true,
    sortOrder: 1,
    items: [
      {
        id: 's1',
        name: 'Crispy Calamari',
        description: 'Tender calamari rings, lightly battered and fried, served with garlic aioli and lemon',
        price: 89,
        dietary: [],
        allergens: ['shellfish', 'gluten'],
        preparationTime: 12,
        popular: true,
        newItem: false,
        available: true,
        modifiers: [
          {
            id: 'm1',
            name: 'Sauce',
            required: false,
            options: [
              { name: 'Garlic Aioli', price: 0 },
              { name: 'Sweet Chilli', price: 0 },
              { name: 'Peri-Peri', price: 5 },
            ]
          }
        ]
      },
      {
        id: 's2',
        name: 'Bunny Chow Starter',
        description: 'Quarter loaf filled with mild lamb curry, a Durban classic',
        price: 75,
        dietary: [],
        allergens: ['gluten'],
        preparationTime: 15,
        popular: false,
        newItem: true,
        available: true,
        modifiers: []
      },
      {
        id: 's3',
        name: 'Bobotie Spring Rolls',
        description: 'Crispy spring rolls filled with spiced bobotie mince, served with apricot chutney',
        price: 68,
        dietary: [],
        allergens: ['gluten', 'egg'],
        preparationTime: 10,
        popular: true,
        newItem: false,
        available: true,
        modifiers: []
      },
    ]
  },
  {
    id: 'mains',
    name: 'Main Courses',
    description: 'Hearty dishes for every appetite',
    icon: 'utensils',
    active: true,
    sortOrder: 2,
    items: [
      {
        id: 'm1',
        name: 'Grilled Kingklip',
        description: 'Line-caught kingklip fillet, grilled with lemon butter, served with roasted vegetables and mashed potato',
        price: 195,
        originalPrice: 225,
        dietary: ['gluten-free'],
        allergens: ['fish', 'dairy'],
        preparationTime: 20,
        popular: true,
        newItem: false,
        available: true,
        modifiers: [
          {
            id: 'm2',
            name: 'Cooking Style',
            required: true,
            options: [
              { name: 'Grilled', price: 0 },
              { name: 'Pan-Seared', price: 0 },
              { name: 'Baked', price: 15 },
            ]
          }
        ]
      },
      {
        id: 'm2',
        name: 'Shisa Nyama Platter',
        description: 'Grilled beef ribs, boerewors, and chicken, served with pap, chakalaka, and salsa',
        price: 245,
        dietary: [],
        allergens: [],
        preparationTime: 25,
        popular: true,
        newItem: false,
        available: true,
        spicyLevel: 2,
        modifiers: [
          {
            id: 'm3',
            name: 'Meat Selection',
            required: false,
            options: [
              { name: 'Extra Ribs', price: 45 },
              { name: 'Extra Wors', price: 25 },
              { name: 'Extra Chicken', price: 35 },
            ]
          }
        ]
      },
      {
        id: 'm3',
        name: 'Veggie Bobotie',
        description: 'Traditional spiced mince with lentils and vegetables, topped with golden egg custard',
        price: 145,
        dietary: ['vegetarian', 'halaal'],
        allergens: ['egg', 'dairy'],
        preparationTime: 18,
        popular: false,
        newItem: false,
        available: true,
        modifiers: []
      },
      {
        id: 'm4',
        name: 'Peri-Peri Chicken',
        description: 'Half chicken marinated in peri-peri sauce, grilled to perfection with chips and coleslaw',
        price: 165,
        dietary: ['halaal'],
        allergens: [],
        preparationTime: 22,
        popular: true,
        newItem: false,
        available: true,
        spicyLevel: 3,
        modifiers: [
          {
            id: 'm4',
            name: 'Spice Level',
            required: true,
            options: [
              { name: 'Mild', price: 0 },
              { name: 'Medium', price: 0 },
              { name: 'Hot', price: 0 },
              { name: 'Extra Hot', price: 0 },
            ]
          }
        ]
      },
    ]
  },
  {
    id: 'burgers',
    name: 'Burgers & Sandwiches',
    description: 'Hand-crafted comfort food',
    icon: 'pizza',
    active: true,
    sortOrder: 3,
    items: [
      {
        id: 'b1',
        name: 'The Gatsby',
        description: 'Foot-long roll loaded with slap chips, polony, cheese, egg, and your choice of sauce',
        price: 125,
        dietary: [],
        allergens: ['gluten', 'egg', 'dairy'],
        preparationTime: 15,
        popular: true,
        newItem: false,
        available: true,
        modifiers: [
          {
            id: 'b1',
            name: 'Add Protein',
            required: false,
            options: [
              { name: 'Steak', price: 35 },
              { name: 'Chicken', price: 25 },
              { name: 'Fish', price: 30 },
            ]
          }
        ]
      },
      {
        id: 'b2',
        name: 'Bunny Chow Burger',
        description: 'Burger patty topped with lamb curry on a brioche bun - a fusion masterpiece',
        price: 145,
        dietary: [],
        allergens: ['gluten', 'dairy'],
        preparationTime: 18,
        popular: false,
        newItem: true,
        available: true,
        modifiers: []
      },
    ]
  },
  {
    id: 'drinks',
    name: 'Beverages',
    description: 'Refreshing drinks for any occasion',
    icon: 'coffee',
    active: true,
    sortOrder: 4,
    items: [
      {
        id: 'd1',
        name: 'Craft Beer Selection',
        description: 'Choose from our rotating selection of local craft beers',
        price: 55,
        dietary: ['vegetarian', 'vegan'],
        allergens: [],
        preparationTime: 2,
        popular: true,
        newItem: false,
        available: true,
        modifiers: [
          {
            id: 'd1',
            name: 'Beer Selection',
            required: true,
            options: [
              { name: 'CBC Amber Weiss', price: 0 },
              { name: 'Devils Peak IPA', price: 0 },
              { name: 'Jack Black Lager', price: 0 },
              { name: ' Stellenbrau Craven Craft', price: 0 },
            ]
          }
        ]
      },
      {
        id: 'd2',
        name: 'Ginger Beer',
        description: 'Traditional stone ginger beer, made fresh daily',
        price: 35,
        dietary: ['vegetarian', 'vegan', 'gluten-free'],
        allergens: [],
        preparationTime: 2,
        popular: false,
        newItem: false,
        available: true,
        modifiers: []
      },
      {
        id: 'd3',
        name: 'Rooibos Iced Tea',
        description: 'South African rooibos with honey and lemon, served over ice',
        price: 32,
        dietary: ['vegetarian', 'vegan', 'gluten-free', 'halaal'],
        allergens: [],
        preparationTime: 3,
        popular: false,
        newItem: false,
        available: true,
        modifiers: []
      },
    ]
  },
  {
    id: 'desserts',
    name: 'Desserts',
    description: 'Sweet endings to your meal',
    icon: 'cake',
    active: true,
    sortOrder: 5,
    items: [
      {
        id: 'ds1',
        name: 'Malva Pudding',
        description: 'Warm, sticky apricot pudding with vanilla custard or ice cream',
        price: 65,
        dietary: ['vegetarian'],
        allergens: ['gluten', 'dairy', 'egg'],
        preparationTime: 10,
        popular: true,
        newItem: false,
        available: true,
        modifiers: [
          {
            id: 'ds1',
            name: 'Serving',
            required: true,
            options: [
              { name: 'With Custard', price: 0 },
              { name: 'With Ice Cream', price: 0 },
              { name: 'Both', price: 10 },
            ]
          }
        ]
      },
      {
        id: 'ds2',
        name: 'Koeksisters',
        description: 'Twisted doughnuts soaked in syrup, served in pairs',
        price: 35,
        dietary: ['vegetarian', 'halaal'],
        allergens: ['gluten', 'egg'],
        preparationTime: 5,
        popular: true,
        newItem: false,
        available: true,
        modifiers: []
      },
    ]
  },
]

// Sample tables
const sampleTables: TableQR[] = [
  { id: 't1', tableNumber: '1', tableLabel: 'Table 1', section: 'Main', qrCode: 'QR-T1-001', active: true, scanCount: 45 },
  { id: 't2', tableNumber: '2', tableLabel: 'Table 2', section: 'Main', qrCode: 'QR-T2-002', active: true, scanCount: 32 },
  { id: 't3', tableNumber: '3', tableLabel: 'Table 3', section: 'Main', qrCode: 'QR-T3-003', active: true, scanCount: 28 },
  { id: 't4', tableNumber: '4', tableLabel: 'Table 4', section: 'Patio', qrCode: 'QR-T4-004', active: true, scanCount: 19 },
  { id: 't5', tableNumber: '5', tableLabel: 'Table 5', section: 'Patio', qrCode: 'QR-T5-005', active: true, scanCount: 22 },
  { id: 't6', tableNumber: 'V1', tableLabel: 'VIP Room', section: 'VIP', qrCode: 'QR-V1-006', active: true, scanCount: 8 },
  { id: 't7', tableNumber: 'B1', tableLabel: 'Bar Seat 1', section: 'Bar', qrCode: 'QR-B1-007', active: true, scanCount: 15 },
  { id: 't8', tableNumber: 'P1', tableLabel: 'Private Dining', section: 'Private', qrCode: 'QR-P1-008', active: false, scanCount: 5 },
]

const defaultSettings: MenuSettings = {
  businessName: 'The Braai House',
  tagline: 'Authentic South African Flavors',
  currency: 'ZAR',
  showPrices: true,
  showPreparationTime: true,
  showDietaryInfo: true,
  showAllergens: true,
  allowPreOrder: true,
  allowReservations: true,
  themeColor: '#00897B',
  fontFamily: 'Poppins',
  whatsappSettings: {
    enabled: true,
    phoneNumber: '+27 11 123 4567',
    autoResponse: 'Thank you for your order! We\'ll have it ready shortly.',
    orderChannelEnabled: true,
    reservationEnabled: true,
  }
}

// Dietary badge colors
const dietaryColors: Record<string, string> = {
  'vegetarian': 'bg-green-100 text-green-700',
  'vegan': 'bg-green-200 text-green-800',
  'gluten-free': 'bg-amber-100 text-amber-700',
  'halaal': 'bg-purple-100 text-purple-700',
  'kosher': 'bg-blue-100 text-blue-700',
}

// Icon map
const iconMap: Record<string, any> = {
  'salad': Salad,
  'utensils': Utensils,
  'pizza': Pizza,
  'coffee': Coffee,
  'cake': Cake,
  'soup': Soup,
  'ice-cream': IceCream,
  'wine': Wine,
}

export function DigitalQRMenuView() {
  const [categories, setCategories] = useState<MenuCategory[]>(sampleCategories)
  const [tables, setTables] = useState<TableQR[]>(sampleTables)
  const [settings, setSettings] = useState<MenuSettings>(defaultSettings)
  const [activeTab, setActiveTab] = useState('menu')
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null)
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [tableDialogOpen, setTableDialogOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [selectedTable, setSelectedTable] = useState<TableQR | null>(null)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  
  // Stats
  const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0)
  const activeItems = categories.reduce((sum, cat) => sum + cat.items.filter(i => i.available).length, 0)
  const popularItems = categories.reduce((sum, cat) => sum + cat.items.filter(i => i.popular).length, 0)
  const totalScans = tables.reduce((sum, t) => sum + t.scanCount, 0)
  
  // Toggle item availability
  const toggleItemAvailability = (categoryId: string, itemId: string) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: cat.items.map(item => 
            item.id === itemId ? { ...item, available: !item.available } : item
          )
        }
      }
      return cat
    }))
  }
  
  // Toggle category active
  const toggleCategoryActive = (categoryId: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, active: !cat.active } : cat
    ))
  }
  
  // Generate QR code URL (simulated)
  const generateQRUrl = (qrCode: string) => {
    return `https://menu.groway.co.za/${qrCode.toLowerCase()}`
  }
  
  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }
  
  // Get category icon
  const getCategoryIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || Utensils
    return <Icon className="h-4 w-4" />
  }
  
  // Render spicy level
  const renderSpicyLevel = (level?: 1 | 2 | 3) => {
    if (!level) return null
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: level }).map((_, i) => (
          <span key={i} className="text-red-500 text-xs">🌶️</span>
        ))}
      </div>
    )
  }
  
  return (
    <div className="h-full flex flex-col bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
              <QrCode className="h-5 w-5 text-[#00897B]" />
              Digital QR Menu
            </h1>
            <p className="text-sm text-[#757575]">Create and manage your digital menu</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setPreviewOpen(true)}>
              <Eye className="h-4 w-4 mr-2" />
              Preview Menu
            </Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setSettingsDialogOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#E0F2F1] rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-[#00897B]">{categories.length}</p>
            <p className="text-xs text-[#757575]">Categories</p>
          </div>
          <div className="bg-[#E8F5E9] rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{activeItems}/{totalItems}</p>
            <p className="text-xs text-[#757575]">Active Items</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{tables.length}</p>
            <p className="text-xs text-[#757575]">Table QRs</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-purple-600">{totalScans}</p>
            <p className="text-xs text-[#757575]">Total Scans</p>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="bg-white border-b border-gray-200 px-4">
            <TabsList className="h-12 bg-transparent">
              <TabsTrigger value="menu" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Utensils className="h-4 w-4 mr-2" />
                Menu Items
              </TabsTrigger>
              <TabsTrigger value="tables" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <MapPin className="h-4 w-4 mr-2" />
                Table QR Codes
              </TabsTrigger>
              <TabsTrigger value="design" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Palette className="h-4 w-4 mr-2" />
                Design
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Sparkles className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-4">
              {/* Menu Items Tab */}
              <TabsContent value="menu" className="m-0 space-y-4">
                {/* Category Cards */}
                {categories.map((category) => (
                  <Card key={category.id} className={category.active ? '' : 'opacity-60'}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center">
                            {getCategoryIcon(category.icon)}
                          </div>
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              {category.name}
                              {category.items.filter(i => i.newItem).length > 0 && (
                                <Badge className="bg-green-100 text-green-700 text-[10px]">
                                  {category.items.filter(i => i.newItem).length} New
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription>{category.description}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{category.items.length} items</Badge>
                          <Switch
                            checked={category.active}
                            onCheckedChange={() => toggleCategoryActive(category.id)}
                          />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => setSelectedCategory(category)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Category
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <MoveUp className="h-4 w-4 mr-2" />
                                Move Up
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <MoveDown className="h-4 w-4 mr-2" />
                                Move Down
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {category.items.map((item) => (
                          <div
                            key={item.id}
                            className={`relative bg-[#FAFAFA] rounded-lg border ${
                              item.available ? 'border-gray-200 hover:border-[#00897B]/30' : 'border-gray-200 opacity-60'
                            } p-3 transition-colors cursor-pointer`}
                            onClick={() => {
                              setSelectedItem(item)
                              setSelectedCategory(category)
                              setItemDialogOpen(true)
                            }}
                          >
                            {/* Image Placeholder */}
                            {item.image ? (
                              <div className="w-full h-24 bg-gray-200 rounded-lg mb-2 overflow-hidden">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-full h-24 bg-gradient-to-br from-[#E0F2F1] to-[#B2DFDB] rounded-lg mb-2 flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-[#00897B]/50" />
                              </div>
                            )}
                            
                            {/* Badges */}
                            <div className="absolute top-2 right-2 flex flex-col gap-1">
                              {item.popular && (
                                <Badge className="bg-[#00897B] text-white text-[9px] px-1.5">
                                  <Star className="h-2.5 w-2.5 mr-0.5" />
                                  Popular
                                </Badge>
                              )}
                              {item.newItem && (
                                <Badge className="bg-green-600 text-white text-[9px] px-1.5">NEW</Badge>
                              )}
                              {!item.available && (
                                <Badge className="bg-red-100 text-red-700 text-[9px] px-1.5">Unavailable</Badge>
                              )}
                            </div>
                            
                            {/* Item Info */}
                            <h4 className="font-semibold text-sm text-[#1A1A1A] mb-1">{item.name}</h4>
                            <p className="text-xs text-[#757575] mb-2 line-clamp-2">{item.description}</p>
                            
                            {/* Dietary Badges */}
                            {item.dietary.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {item.dietary.map(d => (
                                  <Badge key={d} className={`${dietaryColors[d]} text-[9px] px-1.5`}>
                                    {d}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            
                            {/* Price & Time */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[#00897B]">R{item.price}</span>
                                {item.originalPrice && (
                                  <span className="text-xs text-[#757575] line-through">R{item.originalPrice}</span>
                                )}
                              </div>
                              {settings.showPreparationTime && (
                                <div className="flex items-center gap-1 text-xs text-[#757575]">
                                  <Clock className="h-3 w-3" />
                                  {item.preparationTime}min
                                </div>
                              )}
                            </div>
                            
                            {/* Spicy Level */}
                            {item.spicyLevel && (
                              <div className="mt-1">
                                {renderSpicyLevel(item.spicyLevel)}
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {/* Add Item Button */}
                        <div
                          className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-3 flex items-center justify-center cursor-pointer hover:border-[#00897B] transition-colors min-h-[180px]"
                          onClick={() => {
                            setSelectedCategory(category)
                            setSelectedItem(null)
                            setItemDialogOpen(true)
                          }}
                        >
                          <div className="text-center">
                            <Plus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-[#757575]">Add Item</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {/* Add Category Button */}
                <Button 
                  variant="outline" 
                  className="w-full h-20 border-dashed"
                  onClick={() => setCategoryDialogOpen(true)}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add New Category
                </Button>
              </TabsContent>
              
              {/* Table QR Codes Tab */}
              <TabsContent value="tables" className="m-0 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {['Main', 'Patio', 'VIP', 'Bar', 'Private'].map(section => (
                    <Card key={section}>
                      <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold text-[#1A1A1A]">
                          {tables.filter(t => t.section === section).length}
                        </p>
                        <p className="text-xs text-[#757575]">{section} Section</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Table QR Codes</CardTitle>
                      <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setTableDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Table
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {tables.map(table => (
                        <Card 
                          key={table.id} 
                          className={`cursor-pointer transition-all hover:border-[#00897B] ${!table.active ? 'opacity-50' : ''}`}
                          onClick={() => {
                            setSelectedTable(table)
                            setPreviewOpen(true)
                          }}
                        >
                          <CardContent className="p-3 text-center">
                            <div className="w-16 h-16 mx-auto bg-white rounded-lg border border-gray-200 flex items-center justify-center mb-2">
                              <QrCode className="h-10 w-10 text-[#00897B]" />
                            </div>
                            <p className="font-semibold text-sm text-[#1A1A1A]">{table.tableLabel}</p>
                            <p className="text-xs text-[#757575]">{table.section}</p>
                            <p className="text-xs text-[#00897B] mt-1">{table.scanCount} scans</p>
                            <Switch
                              checked={table.active}
                              onCheckedChange={() => {
                                setTables(prev => prev.map(t =>
                                  t.id === table.id ? { ...t, active: !t.active } : t
                                ))
                              }}
                              className="mt-2"
                            />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Batch QR Generation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Batch Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Button variant="outline" className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Download All QRs
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Printer className="h-4 w-4 mr-2" />
                        Print QR Cards
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Menu Link
                      </Button>
                      <Button variant="outline" className="w-full">
                        <QrCode className="h-4 w-4 mr-2" />
                        Regenerate All
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Design Tab */}
              <TabsContent value="design" className="m-0 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Menu Branding</CardTitle>
                    <CardDescription>Customize how your menu looks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Business Name</Label>
                        <Input
                          value={settings.businessName}
                          onChange={(e) => setSettings(prev => ({ ...prev, businessName: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Tagline</Label>
                        <Input
                          value={settings.tagline}
                          onChange={(e) => setSettings(prev => ({ ...prev, tagline: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Logo</Label>
                      <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        {settings.logo ? (
                          <img src={settings.logo} alt="Logo" className="h-16 mx-auto" />
                        ) : (
                          <>
                            <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-[#757575]">Click to upload logo</p>
                            <p className="text-xs text-gray-400">PNG, JPG up to 2MB</p>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Theme Color</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="color"
                            value={settings.themeColor}
                            onChange={(e) => setSettings(prev => ({ ...prev, themeColor: e.target.value }))}
                            className="h-10 w-10 rounded cursor-pointer"
                          />
                          <Input value={settings.themeColor} readOnly className="flex-1" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Font Family</Label>
                        <Select
                          value={settings.fontFamily}
                          onValueChange={(value) => setSettings(prev => ({ ...prev, fontFamily: value }))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Poppins">Poppins</SelectItem>
                            <SelectItem value="Roboto">Roboto</SelectItem>
                            <SelectItem value="Open Sans">Open Sans</SelectItem>
                            <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Currency</Label>
                        <Select
                          value={settings.currency}
                          onValueChange={(value) => setSettings(prev => ({ ...prev, currency: value }))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Display Options</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { key: 'showPrices', label: 'Show Prices', icon: Coins },
                        { key: 'showPreparationTime', label: 'Show Preparation Time', icon: Clock },
                        { key: 'showDietaryInfo', label: 'Show Dietary Info', icon: Heart },
                        { key: 'showAllergens', label: 'Show Allergens', icon: AlertCircle },
                        { key: 'allowPreOrder', label: 'Allow Pre-Order', icon: ShoppingCart },
                        { key: 'allowReservations', label: 'Allow Reservations', icon: Calendar },
                      ].map(item => (
                        <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2">
                            <item.icon className="h-4 w-4 text-[#757575]" />
                            <span className="text-sm">{item.label}</span>
                          </div>
                          <Switch
                            checked={settings[item.key as keyof MenuSettings] as boolean}
                            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, [item.key]: checked }))}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Menu Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Menu Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white border rounded-lg overflow-hidden max-w-sm mx-auto">
                      {/* Mobile Frame */}
                      <div className="bg-gray-100 px-4 py-2 flex items-center justify-center">
                        <div className="w-16 h-1 bg-gray-300 rounded-full"></div>
                      </div>
                      <div className="p-4" style={{ backgroundColor: settings.themeColor + '10' }}>
                        <div className="text-center mb-4">
                          <h3 className="font-bold text-lg" style={{ color: settings.themeColor }}>
                            {settings.businessName}
                          </h3>
                          <p className="text-xs text-[#757575]">{settings.tagline}</p>
                        </div>
                        
                        {categories.slice(0, 2).map(cat => (
                          <div key={cat.id} className="mb-4">
                            <h4 className="font-semibold text-sm mb-2">{cat.name}</h4>
                            <div className="space-y-2">
                              {cat.items.slice(0, 2).map(item => (
                                <div key={item.id} className="bg-white rounded-lg p-2 flex items-center gap-2">
                                  <div className="w-10 h-10 bg-gray-100 rounded"></div>
                                  <div className="flex-1">
                                    <p className="text-xs font-medium">{item.name}</p>
                                    <p className="text-xs text-[#00897B] font-bold">R{item.price}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* WhatsApp Tab */}
              <TabsContent value="whatsapp" className="m-0 space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>WhatsApp Business Integration</AlertTitle>
                  <AlertDescription>
                    Connect your WhatsApp Business account to enable ordering and reservations via WhatsApp.
                  </AlertDescription>
                </Alert>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">WhatsApp Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                      <div>
                        <p className="font-medium text-[#1A1A1A]">Enable WhatsApp Orders</p>
                        <p className="text-xs text-[#757575]">Allow customers to order via WhatsApp</p>
                      </div>
                      <Switch
                        checked={settings.whatsappSettings.orderChannelEnabled}
                        onCheckedChange={(checked) => setSettings(prev => ({
                          ...prev,
                          whatsappSettings: { ...prev.whatsappSettings, orderChannelEnabled: checked }
                        }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                      <div>
                        <p className="font-medium text-[#1A1A1A]">Enable Reservations</p>
                        <p className="text-xs text-[#757575]">"Reserve your fire for Saturday 2pm"</p>
                      </div>
                      <Switch
                        checked={settings.whatsappSettings.reservationEnabled}
                        onCheckedChange={(checked) => setSettings(prev => ({
                          ...prev,
                          whatsappSettings: { ...prev.whatsappSettings, reservationEnabled: checked }
                        }))}
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">WhatsApp Business Number</Label>
                      <Input
                        value={settings.whatsappSettings.phoneNumber}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          whatsappSettings: { ...prev.whatsappSettings, phoneNumber: e.target.value }
                        }))}
                        placeholder="+27 11 123 4567"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Auto-Response Message</Label>
                      <Textarea
                        value={settings.whatsappSettings.autoResponse}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          whatsappSettings: { ...prev.whatsappSettings, autoResponse: e.target.value }
                        }))}
                        placeholder="Thank you for your order!"
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">WhatsApp Order Flow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { step: 1, title: 'Customer scans QR', desc: 'Opens WhatsApp with pre-filled message' },
                        { step: 2, title: 'Customer sends order', desc: 'Order message sent to your WhatsApp' },
                        { step: 3, title: 'Auto-response sent', desc: 'Customer receives confirmation' },
                        { step: 4, title: 'Order appears in POS', desc: 'Process order as normal' },
                      ].map(item => (
                        <div key={item.step} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center flex-shrink-0">
                            {item.step}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-[#1A1A1A]">{item.title}</p>
                            <p className="text-xs text-[#757575]">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Quick Message Templates</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { name: 'Place Order', template: 'Hi! I\'d like to place an order from your menu.' },
                      { name: 'Make Reservation', template: 'Hi! I\'d like to make a reservation for [X] people on [date] at [time].' },
                      { name: 'Ask Question', template: 'Hi! I have a question about your menu.' },
                    ].map((template, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                        <div>
                          <p className="font-medium text-sm text-[#1A1A1A]">{template.name}</p>
                          <p className="text-xs text-[#757575]">{template.template}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Analytics Tab */}
              <TabsContent value="analytics" className="m-0 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <QrCode className="h-6 w-6 text-[#00897B] mx-auto mb-2" />
                      <p className="text-2xl font-bold text-[#1A1A1A]">{totalScans}</p>
                      <p className="text-xs text-[#757575]">Total QR Scans</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Eye className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-[#1A1A1A]">1,245</p>
                      <p className="text-xs text-[#757575]">Menu Views</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <ShoppingCart className="h-6 w-6 text-green-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-[#1A1A1A]">89</p>
                      <p className="text-xs text-[#757575]">WhatsApp Orders</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Calendar className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-[#1A1A1A]">23</p>
                      <p className="text-xs text-[#757575]">Reservations</p>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Most Viewed Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {categories.flatMap(c => c.items.filter(i => i.popular)).slice(0, 5).map((item, i) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-[#E0F2F1] text-[#00897B] text-xs font-bold flex items-center justify-center">
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm text-[#1A1A1A]">{item.name}</p>
                            <p className="text-xs text-[#757575]">{Math.floor(Math.random() * 100 + 50)} views this week</p>
                          </div>
                          <Progress value={Math.random() * 40 + 60} className="w-20" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Scan Activity by Hour</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-1 h-32">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-[#00897B] rounded-t opacity-70"
                          style={{ height: `${Math.random() * 80 + 20}%` }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-[#757575]">
                      <span>8am</span>
                      <span>12pm</span>
                      <span>4pm</span>
                      <span>8pm</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </div>
      
      {/* Item Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{selectedItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
            <DialogDescription>
              Configure the details for this menu item
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Item Name</Label>
                <Input placeholder="e.g., Grilled Kingklip" className="mt-1" defaultValue={selectedItem?.name} />
              </div>
              <div>
                <Label className="text-sm font-medium">Price (R)</Label>
                <Input type="number" placeholder="195" className="mt-1" defaultValue={selectedItem?.price} />
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Description</Label>
              <Textarea
                placeholder="Describe the dish..."
                className="mt-1"
                rows={2}
                defaultValue={selectedItem?.description}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Prep Time (min)</Label>
                <Input type="number" placeholder="15" className="mt-1" defaultValue={selectedItem?.preparationTime} />
              </div>
              <div>
                <Label className="text-sm font-medium">Spicy Level</Label>
                <Select defaultValue={selectedItem?.spicyLevel?.toString() || '0'}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">None</SelectItem>
                    <SelectItem value="1">🌶️ Mild</SelectItem>
                    <SelectItem value="2">🌶️🌶️ Medium</SelectItem>
                    <SelectItem value="3">🌶️🌶️🌶️ Hot</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Category</Label>
                <Select defaultValue={selectedCategory?.id}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Dietary Tags</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['vegetarian', 'vegan', 'gluten-free', 'halaal', 'kosher'].map(tag => (
                  <label key={tag} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" className="sr-only" />
                    <span className="text-xs capitalize">{tag}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked={selectedItem?.popular} className="rounded" />
                <span className="text-sm">Mark as Popular</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked={selectedItem?.newItem} className="rounded" />
                <span className="text-sm">Mark as New</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked={selectedItem?.available} className="rounded" />
                <span className="text-sm">Available</span>
              </label>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Item Image</Label>
              <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-[#00897B]">
                <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-[#757575]">Click to upload image</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">
              {selectedItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Menu Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-auto p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Menu Preview</DialogTitle>
          </DialogHeader>
          <div className="bg-gradient-to-br from-[#00897B] to-[#4CAF50] text-white p-4 text-center">
            <h2 className="text-lg font-bold">{settings.businessName}</h2>
            <p className="text-sm opacity-90">{settings.tagline}</p>
          </div>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="p-4 space-y-4">
              {categories.filter(c => c.active).map(category => (
                <div key={category.id}>
                  <h3 className="font-bold text-sm text-[#00897B] mb-2 flex items-center gap-2">
                    {getCategoryIcon(category.icon)}
                    {category.name}
                  </h3>
                  <div className="space-y-2">
                    {category.items.filter(i => i.available).map(item => (
                      <div key={item.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-sm">{item.name}</p>
                              {settings.showPreparationTime && (
                                <p className="text-xs text-[#757575] flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {item.preparationTime} min
                                </p>
                              )}
                            </div>
                            <p className="font-bold text-sm text-[#00897B]">R{item.price}</p>
                          </div>
                          <p className="text-xs text-[#757575] line-clamp-1">{item.description}</p>
                          {settings.showDietaryInfo && item.dietary.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {item.dietary.map(d => (
                                <Badge key={d} className={`${dietaryColors[d]} text-[8px] px-1`}>
                                  {d}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t">
            <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white">
              <MessageCircle className="h-4 w-4 mr-2" />
              Order via WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Add Table Dialog */}
      <Dialog open={tableDialogOpen} onOpenChange={setTableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Table QR</DialogTitle>
            <DialogDescription>
              Create a new QR code for a table or section
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Table Number</Label>
                <Input placeholder="e.g., 9" className="mt-1" />
              </div>
              <div>
                <Label className="text-sm font-medium">Label</Label>
                <Input placeholder="e.g., Table 9" className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Section</Label>
              <Select>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Main</SelectItem>
                  <SelectItem value="patio">Patio</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTableDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">
              <QrCode className="h-4 w-4 mr-2" />
              Generate QR Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>
              Create a new menu category
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium">Category Name</Label>
              <Input placeholder="e.g., Desserts" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium">Description</Label>
              <Input placeholder="e.g., Sweet treats to end your meal" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium">Icon</Label>
              <Select>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select icon" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utensils">🍽️ Utensils</SelectItem>
                  <SelectItem value="salad">🥗 Salad</SelectItem>
                  <SelectItem value="pizza">🍕 Pizza</SelectItem>
                  <SelectItem value="coffee">☕ Coffee</SelectItem>
                  <SelectItem value="cake">🍰 Cake</SelectItem>
                  <SelectItem value="soup">🍲 Soup</SelectItem>
                  <SelectItem value="wine">🍷 Wine</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">Add Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Menu Settings</DialogTitle>
            <DialogDescription>
              Configure your digital menu settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertTitle>Pro Tip</AlertTitle>
              <AlertDescription>
                Your menu is automatically saved and synced across all devices.
              </AlertDescription>
            </Alert>
            
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium text-sm">Auto-publish changes</p>
                <p className="text-xs text-[#757575]">Changes go live immediately</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium text-sm">Show unavailable items</p>
                <p className="text-xs text-[#757575]">Grey out instead of hide</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium text-sm">Enable customer reviews</p>
                <p className="text-xs text-[#757575]">Allow menu item ratings</p>
              </div>
              <Switch />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>Close</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">Save Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
