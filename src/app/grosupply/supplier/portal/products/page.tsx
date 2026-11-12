'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  MoreVertical,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Eye,
  Upload,
  Download,
  Filter,
  Grid,
  List,
  Check,
  X,
  AlertCircle,
  Image as ImageIcon,
  FileSpreadsheet,
  Copy,
  Archive,
  Star,
  Tag,
  Boxes,
  Calendar,
  RefreshCw,
  ChevronDown,
  Layers,
  Settings2,
  Table2,
  Sparkles,
  Minus,
  Hash,
  Palette,
  Scale,
  Box,
  Award,
  Sliders,
  Generate
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { useSupplierAuth } from '../layout'

// ============================================
// VARIANT TYPE CONFIGURATIONS
// ============================================

interface VariantOption {
  id: string
  name: string
  suffix: string
  priceAdjustment?: number
}

interface VariantType {
  id: string
  name: string
  icon: any
  options: VariantOption[]
}

const VARIANT_TYPES: VariantType[] = [
  {
    id: 'size',
    name: 'Size',
    icon: Box,
    options: [
      { id: 'size-xs', name: 'Extra Small', suffix: 'XS', priceAdjustment: -5 },
      { id: 'size-s', name: 'Small', suffix: 'S', priceAdjustment: 0 },
      { id: 'size-m', name: 'Medium', suffix: 'M', priceAdjustment: 5 },
      { id: 'size-l', name: 'Large', suffix: 'L', priceAdjustment: 10 },
      { id: 'size-xl', name: 'Extra Large', suffix: 'XL', priceAdjustment: 15 },
      { id: 'size-2xl', name: '2X Large', suffix: '2XL', priceAdjustment: 20 },
      { id: 'size-3xl', name: '3X Large', suffix: '3XL', priceAdjustment: 25 },
    ]
  },
  {
    id: 'weight',
    name: 'Weight',
    icon: Scale,
    options: [
      { id: 'weight-250g', name: '250g', suffix: '250G', priceAdjustment: 0 },
      { id: 'weight-500g', name: '500g', suffix: '500G', priceAdjustment: 8 },
      { id: 'weight-1kg', name: '1kg', suffix: '1KG', priceAdjustment: 15 },
      { id: 'weight-2kg', name: '2kg', suffix: '2KG', priceAdjustment: 28 },
      { id: 'weight-5kg', name: '5kg', suffix: '5KG', priceAdjustment: 65 },
      { id: 'weight-10kg', name: '10kg', suffix: '10KG', priceAdjustment: 120 },
      { id: 'weight-20kg', name: '20kg', suffix: '20KG', priceAdjustment: 230 },
      { id: 'weight-50kg', name: '50kg', suffix: '50KG', priceAdjustment: 550 },
    ]
  },
  {
    id: 'color',
    name: 'Color',
    icon: Palette,
    options: [
      { id: 'color-white', name: 'White', suffix: 'WHT', priceAdjustment: 0 },
      { id: 'color-black', name: 'Black', suffix: 'BLK', priceAdjustment: 0 },
      { id: 'color-red', name: 'Red', suffix: 'RED', priceAdjustment: 2 },
      { id: 'color-blue', name: 'Blue', suffix: 'BLU', priceAdjustment: 2 },
      { id: 'color-green', name: 'Green', suffix: 'GRN', priceAdjustment: 2 },
      { id: 'color-yellow', name: 'Yellow', suffix: 'YLW', priceAdjustment: 2 },
      { id: 'color-orange', name: 'Orange', suffix: 'ORG', priceAdjustment: 2 },
      { id: 'color-purple', name: 'Purple', suffix: 'PRP', priceAdjustment: 3 },
      { id: 'color-pink', name: 'Pink', suffix: 'PNK', priceAdjustment: 3 },
      { id: 'color-brown', name: 'Brown', suffix: 'BRN', priceAdjustment: 0 },
    ]
  },
  {
    id: 'packaging',
    name: 'Packaging',
    icon: Box,
    options: [
      { id: 'pack-bag', name: 'Bag', suffix: 'BAG', priceAdjustment: 0 },
      { id: 'pack-box', name: 'Box', suffix: 'BOX', priceAdjustment: 5 },
      { id: 'pack-carton', name: 'Carton', suffix: 'CTN', priceAdjustment: 12 },
      { id: 'pack-pallet', name: 'Pallet', suffix: 'PLT', priceAdjustment: 45 },
      { id: 'pack-bottle', name: 'Bottle', suffix: 'BOT', priceAdjustment: 3 },
      { id: 'pack-jar', name: 'Jar', suffix: 'JAR', priceAdjustment: 4 },
      { id: 'pack-can', name: 'Can', suffix: 'CAN', priceAdjustment: 2 },
      { id: 'pack-pouch', name: 'Pouch', suffix: 'PCH', priceAdjustment: 1 },
    ]
  },
  {
    id: 'grade',
    name: 'Grade',
    icon: Award,
    options: [
      { id: 'grade-premium', name: 'Premium', suffix: 'PREM', priceAdjustment: 25 },
      { id: 'grade-a', name: 'Grade A', suffix: 'A', priceAdjustment: 10 },
      { id: 'grade-b', name: 'Grade B', suffix: 'B', priceAdjustment: 0 },
      { id: 'grade-standard', name: 'Standard', suffix: 'STD', priceAdjustment: 0 },
      { id: 'grade-economy', name: 'Economy', suffix: 'ECO', priceAdjustment: -10 },
      { id: 'grade-organic', name: 'Organic', suffix: 'ORG', priceAdjustment: 20 },
    ]
  }
]

// ============================================
// PRODUCT INTERFACES
// ============================================

interface ProductVariant {
  id: string
  skuSuffix: string
  name: string
  priceAdjustment: number
  stock: number
  barcode: string
  active: boolean
  variantOptions: { typeId: string; optionId: string; optionName: string }[]
}

interface Product {
  id: string
  sku: string
  name: string
  description: string
  category: string
  subCategory: string
  unit: string
  unitPrice: number
  costPrice: number
  bulkPrice?: number
  bulkMinQty?: number
  stock: number
  minStock: number
  maxStock: number
  reorderPoint: number
  reorderQty: number
  status: 'active' | 'inactive' | 'out_of_stock' | 'discontinued'
  images: string[]
  specifications: { key: string; value: string }[]
  certifications: string[]
  leadTime: number
  moq: number
  sold: number
  revenue: number
  createdAt: string
  updatedAt: string
  featured: boolean
  // Variant support
  hasVariants: boolean
  variants: ProductVariant[]
  variantTypes: string[]
}

const categories = [
  { id: 'fresh', name: 'Fresh Produce', subCategories: ['Vegetables', 'Fruits', 'Herbs'] },
  { id: 'dairy', name: 'Dairy', subCategories: ['Milk', 'Cheese', 'Yogurt', 'Butter'] },
  { id: 'beverages', name: 'Beverages', subCategories: ['Soft Drinks', 'Juices', 'Water', 'Energy Drinks'] },
  { id: 'grocery', name: 'Grocery', subCategories: ['Canned Goods', 'Dry Goods', 'Snacks', 'Condiments'] },
  { id: 'cleaning', name: 'Cleaning Supplies', subCategories: ['Industrial', 'Kitchen', 'Bathroom', 'General'] },
  { id: 'packaging', name: 'Packaging', subCategories: ['Bags', 'Containers', 'Wrap', 'Boxes'] },
  { id: 'frozen', name: 'Frozen Foods', subCategories: ['Meat', 'Vegetables', 'Ready Meals', 'Desserts'] },
]

// Helper to generate mock variants
const generateMockVariants = (baseSku: string, basePrice: number): ProductVariant[] => {
  const variantCombinations = [
    { suffix: '1KG-BAG', name: '1kg Bag', adj: 0, stock: 50 },
    { suffix: '5KG-BAG', name: '5kg Bag', adj: 35, stock: 30 },
    { suffix: '10KG-BOX', name: '10kg Box', adj: 65, stock: 20 },
    { suffix: '20KG-PLT', name: '20kg Pallet', adj: 120, stock: 10 },
  ]
  
  return variantCombinations.map((v, i) => ({
    id: `VAR-${baseSku}-${i}`,
    skuSuffix: v.suffix,
    name: v.name,
    priceAdjustment: v.adj,
    stock: v.stock,
    barcode: `600${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`,
    active: true,
    variantOptions: [
      { typeId: 'weight', optionId: `weight-${v.suffix.split('-')[0].toLowerCase()}`, optionName: v.suffix.split('-')[0] },
      { typeId: 'packaging', optionId: `pack-${v.suffix.split('-')[1].toLowerCase()}`, optionName: v.suffix.split('-')[1] },
    ]
  }))
}

const mockProducts: Product[] = [
  {
    id: 'PRD-001',
    sku: 'FP-VEG-001',
    name: 'Fresh Vegetables Mix',
    description: 'Premium mixed seasonal vegetables, perfect for restaurants and catering. Includes carrots, beans, peas, and corn.',
    category: 'fresh',
    subCategory: 'Vegetables',
    unit: 'kg',
    unitPrice: 45.00,
    costPrice: 28.00,
    bulkPrice: 38.00,
    bulkMinQty: 50,
    stock: 150,
    minStock: 20,
    maxStock: 500,
    reorderPoint: 30,
    reorderQty: 100,
    status: 'active',
    images: [],
    specifications: [
      { key: 'Origin', value: 'South Africa' },
      { key: 'Storage', value: 'Keep refrigerated 2-4°C' },
      { key: 'Shelf Life', value: '7 days' }
    ],
    certifications: ['HACCP', 'ISO 22000'],
    leadTime: 2,
    moq: 10,
    sold: 245,
    revenue: 11025,
    createdAt: '2025-06-15',
    updatedAt: '2026-01-10',
    featured: true,
    hasVariants: true,
    variants: generateMockVariants('FP-VEG-001', 45.00),
    variantTypes: ['weight', 'packaging']
  },
  {
    id: 'PRD-002',
    sku: 'FP-FRU-002',
    name: 'Seasonal Fruit Selection',
    description: 'Fresh seasonal fruits including apples, oranges, bananas, and pears. Sourced from local farms.',
    category: 'fresh',
    subCategory: 'Fruits',
    unit: 'box',
    unitPrice: 120.00,
    costPrice: 75.00,
    bulkPrice: 100.00,
    bulkMinQty: 20,
    stock: 80,
    minStock: 15,
    maxStock: 200,
    reorderPoint: 20,
    reorderQty: 50,
    status: 'active',
    images: [],
    specifications: [
      { key: 'Origin', value: 'Local Farms SA' },
      { key: 'Storage', value: 'Cool dry place' },
      { key: 'Shelf Life', value: '5-7 days' }
    ],
    certifications: ['Halaal'],
    leadTime: 1,
    moq: 5,
    sold: 180,
    revenue: 21600,
    createdAt: '2025-07-20',
    updatedAt: '2026-01-12',
    featured: false,
    hasVariants: true,
    variants: [
      { id: 'VAR-001', skuSuffix: 'SM-BOX', name: 'Small Box (5kg)', priceAdjustment: 0, stock: 30, barcode: '6001234567890', active: true, variantOptions: [{ typeId: 'size', optionId: 'size-s', optionName: 'Small' }] },
      { id: 'VAR-002', skuSuffix: 'MED-BOX', name: 'Medium Box (10kg)', priceAdjustment: 20, stock: 35, barcode: '6001234567891', active: true, variantOptions: [{ typeId: 'size', optionId: 'size-m', optionName: 'Medium' }] },
      { id: 'VAR-003', skuSuffix: 'LG-BOX', name: 'Large Box (20kg)', priceAdjustment: 45, stock: 15, barcode: '6001234567892', active: true, variantOptions: [{ typeId: 'size', optionId: 'size-l', optionName: 'Large' }] },
    ],
    variantTypes: ['size']
  },
  {
    id: 'PRD-003',
    sku: 'DR-MLK-001',
    name: 'Full Cream Milk 2L',
    description: 'Fresh pasteurized full cream milk. Perfect for cafes, restaurants, and catering businesses.',
    category: 'dairy',
    subCategory: 'Milk',
    unit: 'bottle',
    unitPrice: 32.50,
    costPrice: 22.00,
    bulkPrice: 28.00,
    bulkMinQty: 50,
    stock: 200,
    minStock: 50,
    maxStock: 400,
    reorderPoint: 60,
    reorderQty: 150,
    status: 'active',
    images: [],
    specifications: [
      { key: 'Fat Content', value: '3.5%' },
      { key: 'Pasteurized', value: 'Yes' },
      { key: 'Storage', value: 'Refrigerate 2-4°C' }
    ],
    certifications: ['Halaal', 'Kosher'],
    leadTime: 1,
    moq: 20,
    sold: 320,
    revenue: 10400,
    createdAt: '2025-05-10',
    updatedAt: '2026-01-14',
    featured: true,
    hasVariants: false,
    variants: [],
    variantTypes: []
  },
  {
    id: 'PRD-004',
    sku: 'DR-CHS-001',
    name: 'Cheddar Cheese Block',
    description: 'Premium aged cheddar cheese. Sharp flavor, perfect for cooking or sandwiches.',
    category: 'dairy',
    subCategory: 'Cheese',
    unit: 'block',
    unitPrice: 145.00,
    costPrice: 95.00,
    bulkPrice: 125.00,
    bulkMinQty: 10,
    stock: 45,
    minStock: 10,
    maxStock: 100,
    reorderPoint: 15,
    reorderQty: 30,
    status: 'active',
    images: [],
    specifications: [
      { key: 'Aging', value: '12 months' },
      { key: 'Type', value: 'Sharp Cheddar' },
      { key: 'Storage', value: 'Refrigerate 4-8°C' }
    ],
    certifications: ['Halaal'],
    leadTime: 2,
    moq: 5,
    sold: 89,
    revenue: 12905,
    createdAt: '2025-08-01',
    updatedAt: '2026-01-11',
    featured: false,
    hasVariants: true,
    variants: [
      { id: 'VAR-010', skuSuffix: '500G', name: '500g Block', priceAdjustment: -55, stock: 20, barcode: '6009876543210', active: true, variantOptions: [{ typeId: 'weight', optionId: 'weight-500g', optionName: '500g' }] },
      { id: 'VAR-011', skuSuffix: '1KG', name: '1kg Block', priceAdjustment: 0, stock: 15, barcode: '6009876543211', active: true, variantOptions: [{ typeId: 'weight', optionId: 'weight-1kg', optionName: '1kg' }] },
      { id: 'VAR-012', skuSuffix: '2KG', name: '2kg Block', priceAdjustment: 55, stock: 10, barcode: '6009876543212', active: true, variantOptions: [{ typeId: 'weight', optionId: 'weight-2kg', optionName: '2kg' }] },
    ],
    variantTypes: ['weight']
  },
  {
    id: 'PRD-005',
    sku: 'CL-IND-001',
    name: 'Industrial Cleaner 5L',
    description: 'Multi-surface industrial cleaner. Effective on grease, grime, and dirt. SABS approved.',
    category: 'cleaning',
    subCategory: 'Industrial',
    unit: 'container',
    unitPrice: 85.00,
    costPrice: 52.00,
    bulkPrice: 70.00,
    bulkMinQty: 12,
    stock: 0,
    minStock: 10,
    maxStock: 50,
    reorderPoint: 12,
    reorderQty: 24,
    status: 'out_of_stock',
    images: [],
    specifications: [
      { key: 'Dilution', value: '1:10 with water' },
      { key: 'pH Level', value: 'Neutral' },
      { key: 'Scent', value: 'Lemon' }
    ],
    certifications: ['SABS Approved'],
    leadTime: 3,
    moq: 6,
    sold: 67,
    revenue: 5695,
    createdAt: '2025-04-20',
    updatedAt: '2026-01-08',
    featured: false,
    hasVariants: false,
    variants: [],
    variantTypes: []
  },
  {
    id: 'PRD-006',
    sku: 'BV-SFT-001',
    name: 'Coca-Cola 2L Case',
    description: 'Case of 12 x 2L Coca-Cola bottles. Perfect for restaurants and catering.',
    category: 'beverages',
    subCategory: 'Soft Drinks',
    unit: 'case',
    unitPrice: 220.00,
    costPrice: 165.00,
    bulkPrice: 195.00,
    bulkMinQty: 10,
    stock: 60,
    minStock: 15,
    maxStock: 100,
    reorderPoint: 20,
    reorderQty: 40,
    status: 'active',
    images: [],
    specifications: [
      { key: 'Pack Size', value: '12 x 2L' },
      { key: 'Storage', value: 'Cool dry place' }
    ],
    certifications: [],
    leadTime: 1,
    moq: 5,
    sold: 156,
    revenue: 34320,
    createdAt: '2025-03-15',
    updatedAt: '2026-01-13',
    featured: true,
    hasVariants: false,
    variants: [],
    variantTypes: []
  },
  {
    id: 'PRD-007',
    sku: 'PK-BAG-001',
    name: 'Vacuum Pack Rolls 500pcs',
    description: 'Food-grade vacuum packaging rolls. Suitable for commercial vacuum sealers.',
    category: 'packaging',
    subCategory: 'Bags',
    unit: 'roll',
    unitPrice: 450.00,
    costPrice: 320.00,
    bulkPrice: 380.00,
    bulkMinQty: 5,
    stock: 25,
    minStock: 5,
    maxStock: 50,
    reorderPoint: 8,
    reorderQty: 15,
    status: 'active',
    images: [],
    specifications: [
      { key: 'Width', value: '30cm' },
      { key: 'Length', value: '500m' },
      { key: 'Material', value: 'PA/PE' }
    ],
    certifications: ['Food Safe'],
    leadTime: 3,
    moq: 2,
    sold: 45,
    revenue: 20250,
    createdAt: '2025-09-01',
    updatedAt: '2026-01-09',
    featured: false,
    hasVariants: false,
    variants: [],
    variantTypes: []
  },
]

export default function SupplierProductsPage() {
  const { supplier } = useSupplierAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])

  // Dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [bulkImportDialogOpen, setBulkImportDialogOpen] = useState(false)
  const [productDetailOpen, setProductDetailOpen] = useState(false)
  const [variantEditorOpen, setVariantEditorOpen] = useState(false)
  const [bulkVariantDialogOpen, setBulkVariantDialogOpen] = useState(false)

  // Form state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    subCategory: '',
    description: '',
    unit: 'kg',
    unitPrice: '',
    costPrice: '',
    bulkPrice: '',
    bulkMinQty: '',
    stock: '',
    minStock: '',
    reorderPoint: '',
    reorderQty: '',
    leadTime: '3',
    moq: '1',
    specifications: [{ key: '', value: '' }],
    certifications: [] as string[],
    featured: false,
    hasVariants: false,
    variantTypes: [] as string[],
  })

  // Variant management state
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  const [variantFormData, setVariantFormData] = useState({
    skuSuffix: '',
    name: '',
    priceAdjustment: '',
    stock: '',
    barcode: '',
    active: true,
  })
  const [selectedVariantTypes, setSelectedVariantTypes] = useState<string[]>([])
  const [selectedVariantOptions, setSelectedVariantOptions] = useState<Record<string, string[]>>({})

  // Bulk import
  const [importData, setImportData] = useState<string>('')
  const [importPreview, setImportPreview] = useState<Partial<Product>[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      if (!supplier?.id) return
      
      try {
        setIsLoading(true)
        const response = await fetch(`/api/supplier/products?supplierId=${supplier.id}`)
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products.map((p: any) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            description: p.description || '',
            category: p.category || '',
            subCategory: '',
            unit: p.unit || 'each',
            unitPrice: p.basePrice || 0,
            costPrice: p.costPrice || 0,
            bulkPrice: p.bulkPricing?.[0]?.discountedPrice,
            bulkMinQty: p.bulkPricing?.[0]?.minQty,
            stock: p.stockQty || 0,
            minStock: p.minOrderQty || 10,
            maxStock: p.maxOrderQty || 500,
            reorderPoint: 10,
            reorderQty: 20,
            status: !p.active ? 'inactive' : !p.inStock ? 'out_of_stock' : 'active',
            images: p.images || [],
            specifications: p.specifications || [],
            certifications: [],
            leadTime: p.leadTime || 3,
            moq: p.minOrderQty || 1,
            sold: 0,
            revenue: 0,
            createdAt: new Date(p.createdAt).toISOString().split('T')[0],
            updatedAt: new Date(p.updatedAt).toISOString().split('T')[0],
            featured: false,
            hasVariants: false,
            variants: [],
            variantTypes: []
          })))
        }
      } catch (error) {
        console.error('Failed to fetch products:', error)
        // Use mock data if API fails
        setProducts(mockProducts)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProducts()
  }, [supplier])

  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    outOfStock: products.filter(p => p.status === 'out_of_stock').length,
    lowStock: products.filter(p => p.stock <= p.reorderPoint && p.status !== 'out_of_stock').length,
    totalRevenue: products.reduce((sum, p) => sum + p.revenue, 0),
    totalStock: products.reduce((sum, p) => sum + p.stock, 0),
    productsWithVariants: products.filter(p => p.hasVariants).length,
    totalVariants: products.reduce((sum, p) => sum + p.variants.length, 0)
  }

  const formatCurrency = (amount: number) => 
    `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      category: '',
      subCategory: '',
      description: '',
      unit: 'kg',
      unitPrice: '',
      costPrice: '',
      bulkPrice: '',
      bulkMinQty: '',
      stock: '',
      minStock: '',
      reorderPoint: '',
      reorderQty: '',
      leadTime: '3',
      moq: '1',
      specifications: [{ key: '', value: '' }],
      certifications: [],
      featured: false,
      hasVariants: false,
      variantTypes: [],
    })
    setSelectedVariantTypes([])
    setSelectedVariantOptions({})
  }

  const resetVariantForm = () => {
    setVariantFormData({
      skuSuffix: '',
      name: '',
      priceAdjustment: '',
      stock: '',
      barcode: '',
      active: true,
    })
    setEditingVariant(null)
  }

  const handleAddProduct = async () => {
    if (!supplier?.id) return
    
    const newProduct: Product = {
      id: `PRD-${String(products.length + 1).padStart(3, '0')}`,
      sku: formData.sku,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      subCategory: formData.subCategory,
      unit: formData.unit,
      unitPrice: parseFloat(formData.unitPrice) || 0,
      costPrice: parseFloat(formData.costPrice) || 0,
      bulkPrice: formData.bulkPrice ? parseFloat(formData.bulkPrice) : undefined,
      bulkMinQty: formData.bulkMinQty ? parseInt(formData.bulkMinQty) : undefined,
      stock: parseInt(formData.stock) || 0,
      minStock: parseInt(formData.minStock) || 10,
      maxStock: 500,
      reorderPoint: parseInt(formData.reorderPoint) || 10,
      reorderQty: parseInt(formData.reorderQty) || 20,
      status: (parseInt(formData.stock) || 0) > 0 ? 'active' : 'out_of_stock',
      images: [],
      specifications: formData.specifications.filter(s => s.key && s.value),
      certifications: formData.certifications,
      leadTime: parseInt(formData.leadTime) || 3,
      moq: parseInt(formData.moq) || 1,
      sold: 0,
      revenue: 0,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      featured: formData.featured,
      hasVariants: formData.hasVariants,
      variants: [],
      variantTypes: formData.hasVariants ? formData.variantTypes : []
    }

    setProducts(prev => [...prev, newProduct])
    setAddDialogOpen(false)
    resetForm()
  }

  const handleEditProduct = () => {
    if (!editingProduct) return

    setProducts(prev => prev.map(p => {
      if (p.id === editingProduct.id) {
        return {
          ...p,
          name: formData.name,
          sku: formData.sku,
          category: formData.category,
          subCategory: formData.subCategory,
          description: formData.description,
          unit: formData.unit,
          unitPrice: parseFloat(formData.unitPrice) || 0,
          costPrice: parseFloat(formData.costPrice) || 0,
          bulkPrice: formData.bulkPrice ? parseFloat(formData.bulkPrice) : undefined,
          bulkMinQty: formData.bulkMinQty ? parseInt(formData.bulkMinQty) : undefined,
          stock: formData.hasVariants ? p.variants.reduce((sum, v) => sum + v.stock, 0) : (parseInt(formData.stock) || 0),
          minStock: parseInt(formData.minStock) || 10,
          reorderPoint: parseInt(formData.reorderPoint) || 10,
          reorderQty: parseInt(formData.reorderQty) || 20,
          leadTime: parseInt(formData.leadTime) || 3,
          moq: parseInt(formData.moq) || 1,
          specifications: formData.specifications.filter(s => s.key && s.value),
          certifications: formData.certifications,
          featured: formData.featured,
          hasVariants: formData.hasVariants,
          variantTypes: formData.hasVariants ? formData.variantTypes : [],
          status: formData.hasVariants 
            ? (p.variants.some(v => v.stock > 0 && v.active) ? 'active' : 'out_of_stock')
            : ((parseInt(formData.stock) || 0) > 0 ? 'active' : 'out_of_stock'),
          updatedAt: new Date().toISOString().split('T')[0]
        }
      }
      return p
    }))

    setEditDialogOpen(false)
    setEditingProduct(null)
    resetForm()
  }

  const handleDeleteProduct = () => {
    if (!editingProduct) return
    setProducts(prev => prev.filter(p => p.id !== editingProduct.id))
    setDeleteDialogOpen(false)
    setEditingProduct(null)
  }

  const handleBulkDelete = () => {
    setProducts(prev => prev.filter(p => !selectedProducts.includes(p.id)))
    setSelectedProducts([])
  }

  const handleBulkStatusChange = (status: 'active' | 'inactive') => {
    setProducts(prev => prev.map(p => 
      selectedProducts.includes(p.id) ? { ...p, status } : p
    ))
    setSelectedProducts([])
  }

  // Variant management handlers
  const handleAddVariant = () => {
    if (!editingProduct) return

    const newVariant: ProductVariant = {
      id: `VAR-${Date.now()}`,
      skuSuffix: variantFormData.skuSuffix,
      name: variantFormData.name,
      priceAdjustment: parseFloat(variantFormData.priceAdjustment) || 0,
      stock: parseInt(variantFormData.stock) || 0,
      barcode: variantFormData.barcode,
      active: variantFormData.active,
      variantOptions: []
    }

    setProducts(prev => prev.map(p => {
      if (p.id === editingProduct.id) {
        return {
          ...p,
          variants: [...p.variants, newVariant],
          stock: [...p.variants, newVariant].reduce((sum, v) => sum + v.stock, 0),
          hasVariants: true
        }
      }
      return p
    }))

    setEditingProduct(prev => prev ? {
      ...prev,
      variants: [...prev.variants, newVariant],
      stock: [...prev.variants, newVariant].reduce((sum, v) => sum + v.stock, 0),
      hasVariants: true
    } : null)

    resetVariantForm()
  }

  const handleEditVariant = () => {
    if (!editingProduct || !editingVariant) return

    setProducts(prev => prev.map(p => {
      if (p.id === editingProduct.id) {
        const updatedVariants = p.variants.map(v => {
          if (v.id === editingVariant.id) {
            return {
              ...v,
              skuSuffix: variantFormData.skuSuffix,
              name: variantFormData.name,
              priceAdjustment: parseFloat(variantFormData.priceAdjustment) || 0,
              stock: parseInt(variantFormData.stock) || 0,
              barcode: variantFormData.barcode,
              active: variantFormData.active,
            }
          }
          return v
        })
        return {
          ...p,
          variants: updatedVariants,
          stock: updatedVariants.reduce((sum, v) => sum + v.stock, 0)
        }
      }
      return p
    }))

    setEditingProduct(prev => prev ? {
      ...prev,
      variants: prev.variants.map(v => v.id === editingVariant.id ? {
        ...v,
        skuSuffix: variantFormData.skuSuffix,
        name: variantFormData.name,
        priceAdjustment: parseFloat(variantFormData.priceAdjustment) || 0,
        stock: parseInt(variantFormData.stock) || 0,
        barcode: variantFormData.barcode,
        active: variantFormData.active,
      } : v)
    } : null)

    resetVariantForm()
  }

  const handleDeleteVariant = (variantId: string) => {
    if (!editingProduct) return

    setProducts(prev => prev.map(p => {
      if (p.id === editingProduct.id) {
        const updatedVariants = p.variants.filter(v => v.id !== variantId)
        return {
          ...p,
          variants: updatedVariants,
          stock: updatedVariants.reduce((sum, v) => sum + v.stock, 0),
          hasVariants: updatedVariants.length > 0
        }
      }
      return p
    }))

    setEditingProduct(prev => prev ? {
      ...prev,
      variants: prev.variants.filter(v => v.id !== variantId),
      stock: prev.variants.filter(v => v.id !== variantId).reduce((sum, v) => sum + v.stock, 0),
      hasVariants: prev.variants.filter(v => v.id !== variantId).length > 0
    } : null)
  }

  // Generate variants from selected types and options
  const generateVariants = () => {
    if (!editingProduct || selectedVariantTypes.length === 0) return

    const optionCombinations: { typeId: string; optionId: string; optionName: string }[][] = []
    
    const generateCombinations = (typeIndex: number, current: { typeId: string; optionId: string; optionName: string }[]) => {
      if (typeIndex === selectedVariantTypes.length) {
        optionCombinations.push([...current])
        return
      }
      
      const typeId = selectedVariantTypes[typeIndex]
      const options = selectedVariantOptions[typeId] || []
      const variantType = VARIANT_TYPES.find(t => t.id === typeId)
      
      for (const optionId of options) {
        const option = variantType?.options.find(o => o.id === optionId)
        if (option) {
          current.push({ typeId, optionId, optionName: option.name })
          generateCombinations(typeIndex + 1, current)
          current.pop()
        }
      }
    }
    
    generateCombinations(0, [])

    const newVariants: ProductVariant[] = optionCombinations.map((combo, i) => {
      const suffix = combo.map(c => {
        const vt = VARIANT_TYPES.find(t => t.id === c.typeId)
        const opt = vt?.options.find(o => o.id === c.optionId)
        return opt?.suffix || ''
      }).join('-')
      
      const name = combo.map(c => c.optionName).join(' / ')
      const priceAdj = combo.reduce((sum, c) => {
        const vt = VARIANT_TYPES.find(t => t.id === c.typeId)
        const opt = vt?.options.find(o => o.id === c.optionId)
        return sum + (opt?.priceAdjustment || 0)
      }, 0)

      return {
        id: `VAR-${Date.now()}-${i}`,
        skuSuffix: suffix,
        name,
        priceAdjustment: priceAdj,
        stock: 0,
        barcode: `600${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`,
        active: true,
        variantOptions: combo
      }
    })

    setProducts(prev => prev.map(p => {
      if (p.id === editingProduct.id) {
        return {
          ...p,
          variants: [...p.variants, ...newVariants],
          hasVariants: true,
          variantTypes: selectedVariantTypes
        }
      }
      return p
    }))

    setEditingProduct(prev => prev ? {
      ...prev,
      variants: [...prev.variants, ...newVariants],
      hasVariants: true,
      variantTypes: selectedVariantTypes
    } : null)

    setBulkVariantDialogOpen(false)
    setSelectedVariantTypes([])
    setSelectedVariantOptions({})
  }

  const parseCSV = (csv: string) => {
    const lines = csv.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const preview: Partial<Product>[] = []

    for (let i = 1; i < Math.min(lines.length, 11); i++) {
      const values = lines[i].split(',')
      const product: Partial<Product> = {}
      
      headers.forEach((header, index) => {
        const value = values[index]?.trim() || ''
        switch (header) {
          case 'sku': product.sku = value; break
          case 'name': product.name = value; break
          case 'category': product.category = value; break
          case 'unit': product.unit = value; break
          case 'price': product.unitPrice = parseFloat(value) || 0; break
          case 'stock': product.stock = parseInt(value) || 0; break
        }
      })

      if (product.sku && product.name) {
        preview.push(product)
      }
    }

    return preview
  }

  const handleImport = () => {
    const newProducts = importPreview.map((p, i) => ({
      id: `PRD-${String(products.length + i + 1).padStart(3, '0')}`,
      sku: p.sku || '',
      name: p.name || '',
      description: p.description || '',
      category: p.category || 'grocery',
      subCategory: '',
      unit: p.unit || 'unit',
      unitPrice: p.unitPrice || 0,
      costPrice: (p.unitPrice || 0) * 0.7,
      stock: p.stock || 0,
      minStock: 10,
      maxStock: 500,
      reorderPoint: 10,
      reorderQty: 20,
      status: (p.stock || 0) > 0 ? 'active' : 'out_of_stock',
      images: [],
      specifications: [],
      certifications: [],
      leadTime: 3,
      moq: 1,
      sold: 0,
      revenue: 0,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      featured: false,
      hasVariants: false,
      variants: [],
      variantTypes: []
    })) as Product[]

    setProducts(prev => [...prev, ...newProducts])
    setBulkImportDialogOpen(false)
    setImportData('')
    setImportPreview([])
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      subCategory: product.subCategory,
      description: product.description,
      unit: product.unit,
      unitPrice: String(product.unitPrice),
      costPrice: String(product.costPrice),
      bulkPrice: product.bulkPrice ? String(product.bulkPrice) : '',
      bulkMinQty: product.bulkMinQty ? String(product.bulkMinQty) : '',
      stock: String(product.stock),
      minStock: String(product.minStock),
      reorderPoint: String(product.reorderPoint),
      reorderQty: String(product.reorderQty),
      leadTime: String(product.leadTime),
      moq: String(product.moq),
      specifications: product.specifications.length > 0 ? product.specifications : [{ key: '', value: '' }],
      certifications: product.certifications,
      featured: product.featured,
      hasVariants: product.hasVariants,
      variantTypes: product.variantTypes,
    })
    setEditDialogOpen(true)
  }

  const statusConfig: Record<string, { color: string; bgColor: string; label: string }> = {
    active: { color: 'text-green-700', bgColor: 'bg-green-100', label: 'Active' },
    inactive: { color: 'text-gray-700', bgColor: 'bg-gray-100', label: 'Inactive' },
    out_of_stock: { color: 'text-red-700', bgColor: 'bg-red-100', label: 'Out of Stock' },
    discontinued: { color: 'text-slate-700', bgColor: 'bg-slate-100', label: 'Discontinued' },
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-[#00897B] border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Product Catalog</h1>
          <p className="text-[#757575]">Manage your products, variants, and pricing</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setBulkImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => { resetForm(); setAddDialogOpen(true); }} className="bg-[#00897B] hover:bg-[#00695C]">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-[#1A1A1A]">{stats.total}</p>
            <p className="text-xs text-[#757575]">Total Products</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            <p className="text-xs text-[#757575]">Active</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-400">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
            <p className="text-xs text-[#757575]">Out of Stock</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-400">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-amber-600">{stats.lowStock}</p>
            <p className="text-xs text-[#757575]">Low Stock</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-400">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-purple-600">{stats.productsWithVariants}</p>
            <p className="text-xs text-[#757575]">With Variants</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-indigo-400">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-indigo-600">{stats.totalVariants}</p>
            <p className="text-xs text-[#757575]">Total Variants</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-[#00897B]">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-xs text-[#757575]">Total Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
          <Input
            placeholder="Search products by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1 border rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-sm font-medium">{selectedProducts.length} products selected</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange('active')}>
                <Check className="h-4 w-4 mr-1" /> Activate
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange('inactive')}>
                <Archive className="h-4 w-4 mr-1" /> Deactivate
              </Button>
              <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedProducts([])}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const config = statusConfig[product.status]
            return (
              <Card 
                key={product.id} 
                className={`cursor-pointer hover:shadow-md transition-all ${product.featured ? 'border-amber-400' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedProducts(prev => [...prev, product.id])
                          } else {
                            setSelectedProducts(prev => prev.filter(id => id !== product.id))
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="w-12 h-12 rounded-lg bg-[#E0F2F1] flex items-center justify-center relative">
                        <Package className="h-6 w-6 text-[#00897B]" />
                        {product.hasVariants && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                            <Layers className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {product.featured && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                      <Badge className={`${config.bgColor} ${config.color} border-0`}>{config.label}</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="font-semibold truncate">{product.name}</p>
                      <p className="text-xs text-[#757575]">{product.sku} • {product.subCategory || product.category}</p>
                    </div>
                    
                    {/* Variant indicator */}
                    {product.hasVariants && (
                      <div className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 rounded px-2 py-1">
                        <Layers className="h-3 w-3" />
                        <span>{product.variants.length} variants</span>
                        <span className="text-purple-400">•</span>
                        <span>{product.variants.filter(v => v.stock > 0).length} in stock</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-lg text-[#00897B]">
                          {product.hasVariants ? (
                            <>
                              {formatCurrency(product.unitPrice + Math.min(...product.variants.map(v => v.priceAdjustment)))}
                              {product.variants.length > 1 && (
                                <span className="text-xs text-[#757575] font-normal"> - {formatCurrency(product.unitPrice + Math.max(...product.variants.map(v => v.priceAdjustment)))}</span>
                              )}
                            </>
                          ) : (
                            formatCurrency(product.unitPrice)
                          )}
                        </p>
                        {!product.hasVariants && product.bulkPrice && (
                          <p className="text-xs text-[#757575]">Bulk: {formatCurrency(product.bulkPrice)} (min {product.bulkMinQty})</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${product.stock <= product.reorderPoint ? 'text-red-600' : ''}`}>
                          {product.hasVariants ? (
                            product.variants.reduce((sum, v) => sum + v.stock, 0)
                          ) : (
                            product.stock
                          )} {product.unit}
                        </p>
                        <p className="text-xs text-[#757575]">in stock</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#757575]">
                      <span>{product.sold} sold</span>
                      <span>{formatCurrency(product.revenue)} revenue</span>
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {product.certifications.slice(0, 2).map(cert => (
                        <Badge key={cert} variant="outline" className="text-[10px]">{cert}</Badge>
                      ))}
                      {product.hasVariants && (
                        <Badge variant="outline" className="text-[10px] text-purple-600 border-purple-300">
                          <Layers className="h-3 w-3 mr-1" />
                          {product.variantTypes.length} types
                        </Badge>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditingProduct(product); setProductDetailOpen(true); }}>
                          <Eye className="h-4 w-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(product)}>
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setEditingProduct(product); setVariantEditorOpen(true); }}>
                          <Layers className="h-4 w-4 mr-2" /> Manage Variants
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(product.sku)}>
                          <Copy className="h-4 w-4 mr-2" /> Copy SKU
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => { setEditingProduct(product); setDeleteDialogOpen(true); }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="divide-y">
                {filteredProducts.map((product) => {
                  const config = statusConfig[product.status]
                  return (
                    <div key={product.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedProducts(prev => [...prev, product.id])
                              } else {
                                setSelectedProducts(prev => prev.filter(id => id !== product.id))
                              }
                            }}
                          />
                          <div className="w-12 h-12 rounded-lg bg-[#E0F2F1] flex items-center justify-center relative">
                            <Package className="h-6 w-6 text-[#00897B]" />
                            {product.hasVariants && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                                <Layers className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{product.name}</p>
                              {product.featured && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                              <Badge className={`${config.bgColor} ${config.color} border-0`}>{config.label}</Badge>
                              {product.hasVariants && (
                                <Badge variant="outline" className="text-purple-600 border-purple-300">
                                  <Layers className="h-3 w-3 mr-1" />
                                  {product.variants.length}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-[#757575]">{product.sku} • {product.subCategory || product.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="text-right">
                            <p className="font-bold">
                              {product.hasVariants ? (
                                `${formatCurrency(product.unitPrice + Math.min(...product.variants.map(v => v.priceAdjustment)))}+`
                              ) : (
                                formatCurrency(product.unitPrice)
                              )}
                            </p>
                            {!product.hasVariants && product.bulkPrice && <p className="text-xs text-[#757575]">Bulk: {formatCurrency(product.bulkPrice)}</p>}
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${product.stock <= product.reorderPoint ? 'text-red-600' : ''}`}>
                              {product.hasVariants ? product.variants.reduce((sum, v) => sum + v.stock, 0) : product.stock}
                            </p>
                            <p className="text-xs text-[#757575]">stock</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{product.sold}</p>
                            <p className="text-xs text-[#757575]">sold</p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { setEditingProduct(product); setVariantEditorOpen(true); }}>
                              <Layers className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { setEditingProduct(product); setDeleteDialogOpen(true); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Add Product Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>Add a new product to your catalog</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Product Name *</Label>
                <Input placeholder="Enter product name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div>
                <Label>SKU *</Label>
                <Input placeholder="e.g., FP-VEG-001" value={formData.sku} onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v, subCategory: '' }))}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sub-Category</Label>
                <Select value={formData.subCategory} onValueChange={(v) => setFormData(prev => ({ ...prev, subCategory: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select sub-category" /></SelectTrigger>
                  <SelectContent>
                    {categories.find(c => c.id === formData.category)?.subCategories.map(sub => (
                      <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea placeholder="Product description..." rows={3} value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} />
            </div>
            
            {/* Variant toggle */}
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-900">Product has variants</p>
                  <p className="text-xs text-purple-600">Enable if this product comes in different sizes, weights, colors, etc.</p>
                </div>
              </div>
              <Switch
                checked={formData.hasVariants}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasVariants: checked }))}
              />
            </div>
            
            {/* Variant types selection */}
            {formData.hasVariants && (
              <div className="space-y-3">
                <Label>Variant Types</Label>
                <div className="flex flex-wrap gap-2">
                  {VARIANT_TYPES.map(vt => (
                    <Badge
                      key={vt.id}
                      variant={formData.variantTypes.includes(vt.id) ? 'default' : 'outline'}
                      className={`cursor-pointer ${formData.variantTypes.includes(vt.id) ? 'bg-purple-600' : 'border-purple-300 text-purple-600'}`}
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          variantTypes: prev.variantTypes.includes(vt.id)
                            ? prev.variantTypes.filter(t => t !== vt.id)
                            : [...prev.variantTypes, vt.id]
                        }))
                      }}
                    >
                      <vt.icon className="h-3 w-3 mr-1" />
                      {vt.name}
                    </Badge>
                  ))}
                </div>
                {formData.variantTypes.length > 0 && (
                  <p className="text-xs text-[#757575]">
                    Variants will be created when you edit this product. Select the types you need.
                  </p>
                )}
              </div>
            )}
            
            {!formData.hasVariants && (
              <>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label>Unit *</Label>
                    <Select value={formData.unit} onValueChange={(v) => setFormData(prev => ({ ...prev, unit: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Kilogram (kg)</SelectItem>
                        <SelectItem value="unit">Unit</SelectItem>
                        <SelectItem value="box">Box</SelectItem>
                        <SelectItem value="case">Case</SelectItem>
                        <SelectItem value="pack">Pack</SelectItem>
                        <SelectItem value="bottle">Bottle</SelectItem>
                        <SelectItem value="container">Container</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Unit Price (R) *</Label>
                    <Input type="number" placeholder="0.00" value={formData.unitPrice} onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Cost Price (R)</Label>
                    <Input type="number" placeholder="0.00" value={formData.costPrice} onChange={(e) => setFormData(prev => ({ ...prev, costPrice: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Stock Qty</Label>
                    <Input type="number" placeholder="0" value={formData.stock} onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label>Bulk Price (R)</Label>
                    <Input type="number" placeholder="Optional" value={formData.bulkPrice} onChange={(e) => setFormData(prev => ({ ...prev, bulkPrice: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Bulk Min Qty</Label>
                    <Input type="number" placeholder="0" value={formData.bulkMinQty} onChange={(e) => setFormData(prev => ({ ...prev, bulkMinQty: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Lead Time (days)</Label>
                    <Input type="number" placeholder="3" value={formData.leadTime} onChange={(e) => setFormData(prev => ({ ...prev, leadTime: e.target.value }))} />
                  </div>
                  <div>
                    <Label>MOQ</Label>
                    <Input type="number" placeholder="1" value={formData.moq} onChange={(e) => setFormData(prev => ({ ...prev, moq: e.target.value }))} />
                  </div>
                </div>
              </>
            )}
            
            {formData.hasVariants && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Base Unit Price (R) *</Label>
                  <Input type="number" placeholder="Base price for variants" value={formData.unitPrice} onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: e.target.value }))} />
                  <p className="text-xs text-[#757575] mt-1">Variant prices will be adjusted from this base</p>
                </div>
                <div>
                  <Label>Cost Price (R)</Label>
                  <Input type="number" placeholder="0.00" value={formData.costPrice} onChange={(e) => setFormData(prev => ({ ...prev, costPrice: e.target.value }))} />
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Checkbox 
                id="featured" 
                checked={formData.featured} 
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: !!checked }))} 
              />
              <Label htmlFor="featured" className="cursor-pointer">Featured product</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddProduct} disabled={!formData.name || !formData.sku || !formData.category || !formData.unitPrice} className="bg-[#00897B] hover:bg-[#00695C]">
              <Plus className="h-4 w-4 mr-2" />Add Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update product information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Product Name *</Label>
                <Input placeholder="Enter product name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div>
                <Label>SKU *</Label>
                <Input placeholder="e.g., FP-VEG-001" value={formData.sku} onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v, subCategory: '' }))}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sub-Category</Label>
                <Select value={formData.subCategory} onValueChange={(v) => setFormData(prev => ({ ...prev, subCategory: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select sub-category" /></SelectTrigger>
                  <SelectContent>
                    {categories.find(c => c.id === formData.category)?.subCategories.map(sub => (
                      <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea placeholder="Product description..." rows={3} value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} />
            </div>
            
            {/* Variant toggle */}
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-900">Product has variants</p>
                  <p className="text-xs text-purple-600">Enable if this product comes in different sizes, weights, colors, etc.</p>
                </div>
              </div>
              <Switch
                checked={formData.hasVariants}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasVariants: checked }))}
              />
            </div>
            
            {/* Show variants info if enabled */}
            {formData.hasVariants && editingProduct && (
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-purple-900">Variants ({editingProduct.variants.length})</span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-purple-300 text-purple-600"
                    onClick={() => { setEditDialogOpen(false); setVariantEditorOpen(true); }}
                  >
                    <Settings2 className="h-4 w-4 mr-1" />
                    Manage Variants
                  </Button>
                </div>
                
                {editingProduct.variants.length > 0 ? (
                  <div className="space-y-2">
                    {editingProduct.variants.slice(0, 3).map(variant => (
                      <div key={variant.id} className="flex items-center justify-between text-sm bg-white rounded p-2">
                        <div>
                          <span className="font-medium">{variant.name}</span>
                          <span className="text-[#757575] ml-2">({formData.sku}-{variant.skuSuffix})</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={variant.priceAdjustment >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {variant.priceAdjustment >= 0 ? '+' : ''}{formatCurrency(variant.priceAdjustment)}
                          </span>
                          <span className={variant.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                            {variant.stock} units
                          </span>
                        </div>
                      </div>
                    ))}
                    {editingProduct.variants.length > 3 && (
                      <p className="text-xs text-[#757575] text-center">
                        +{editingProduct.variants.length - 3} more variants
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-purple-600 text-center py-2">
                    No variants configured. Click "Manage Variants" to add them.
                  </p>
                )}
              </div>
            )}
            
            {!formData.hasVariants && (
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>Unit *</Label>
                  <Select value={formData.unit} onValueChange={(v) => setFormData(prev => ({ ...prev, unit: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilogram (kg)</SelectItem>
                      <SelectItem value="unit">Unit</SelectItem>
                      <SelectItem value="box">Box</SelectItem>
                      <SelectItem value="case">Case</SelectItem>
                      <SelectItem value="pack">Pack</SelectItem>
                      <SelectItem value="bottle">Bottle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Unit Price (R) *</Label>
                  <Input type="number" placeholder="0.00" value={formData.unitPrice} onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: e.target.value }))} />
                </div>
                <div>
                  <Label>Cost Price (R)</Label>
                  <Input type="number" placeholder="0.00" value={formData.costPrice} onChange={(e) => setFormData(prev => ({ ...prev, costPrice: e.target.value }))} />
                </div>
                <div>
                  <Label>Stock Qty</Label>
                  <Input type="number" placeholder="0" value={formData.stock} onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))} />
                </div>
              </div>
            )}
            
            {formData.hasVariants && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Base Unit Price (R) *</Label>
                  <Input type="number" placeholder="Base price for variants" value={formData.unitPrice} onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: e.target.value }))} />
                </div>
                <div>
                  <Label>Cost Price (R)</Label>
                  <Input type="number" placeholder="0.00" value={formData.costPrice} onChange={(e) => setFormData(prev => ({ ...prev, costPrice: e.target.value }))} />
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Checkbox id="featured-edit" checked={formData.featured} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: !!checked }))} />
              <Label htmlFor="featured-edit" className="cursor-pointer">Featured product</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditProduct} disabled={!formData.name || !formData.sku || !formData.category || !formData.unitPrice} className="bg-[#00897B] hover:bg-[#00695C]">
              <Check className="h-4 w-4 mr-2" />Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Variant Editor Dialog */}
      <Dialog open={variantEditorOpen} onOpenChange={setVariantEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-600" />
              Manage Variants
            </DialogTitle>
            <DialogDescription>
              {editingProduct?.name} ({editingProduct?.sku})
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex flex-col py-4">
            <Tabs defaultValue="list" className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="list">
                    <List className="h-4 w-4 mr-2" />
                    Variant List
                  </TabsTrigger>
                  <TabsTrigger value="matrix">
                    <Table2 className="h-4 w-4 mr-2" />
                    Matrix View
                  </TabsTrigger>
                </TabsList>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setBulkVariantDialogOpen(true)}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Variants
                  </Button>
                  <Button size="sm" onClick={() => { resetVariantForm(); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Variant
                  </Button>
                </div>
              </div>
              
              <TabsContent value="list" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-[400px] border rounded-lg">
                  {editingProduct?.variants && editingProduct.variants.length > 0 ? (
                    <div className="divide-y">
                      {editingProduct.variants.map((variant) => (
                        <div key={variant.id} className="p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                <Package className="h-5 w-5 text-purple-600" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{variant.name}</p>
                                  {!variant.active && (
                                    <Badge variant="outline" className="text-gray-500">Inactive</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-[#757575]">
                                  {editingProduct.sku}-{variant.skuSuffix} • Barcode: {variant.barcode}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className={`text-sm font-medium ${variant.priceAdjustment >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {variant.priceAdjustment >= 0 ? '+' : ''}{formatCurrency(variant.priceAdjustment)}
                                </p>
                                <p className="text-xs text-[#757575]">price adj.</p>
                              </div>
                              <div className="text-right">
                                <p className={`text-sm font-medium ${variant.stock > 0 ? '' : 'text-red-600'}`}>
                                  {variant.stock}
                                </p>
                                <p className="text-xs text-[#757575]">stock</p>
                              </div>
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => {
                                    setEditingVariant(variant)
                                    setVariantFormData({
                                      skuSuffix: variant.skuSuffix,
                                      name: variant.name,
                                      priceAdjustment: String(variant.priceAdjustment),
                                      stock: String(variant.stock),
                                      barcode: variant.barcode,
                                      active: variant.active,
                                    })
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="text-red-600"
                                  onClick={() => handleDeleteVariant(variant.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                      <Layers className="h-12 w-12 text-purple-300 mb-4" />
                      <p className="text-lg font-medium text-[#757575]">No variants yet</p>
                      <p className="text-sm text-[#757575] mb-4">Add variants manually or generate them from variant types</p>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setBulkVariantDialogOpen(true)}>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Variants
                        </Button>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="matrix" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-[400px] border rounded-lg p-4">
                  {editingProduct?.variants && editingProduct.variants.length > 0 ? (
                    <div className="space-y-4">
                      {/* Matrix Header */}
                      <div className="grid grid-cols-6 gap-2 text-xs font-medium text-[#757575] border-b pb-2">
                        <div>Variant</div>
                        <div>SKU Suffix</div>
                        <div>Price Adj.</div>
                        <div>Stock</div>
                        <div>Status</div>
                        <div>Actions</div>
                      </div>
                      
                      {/* Matrix Rows */}
                      {editingProduct.variants.map((variant) => (
                        <div key={variant.id} className="grid grid-cols-6 gap-2 items-center py-2 border-b border-gray-100">
                          <div className="font-medium text-sm">{variant.name}</div>
                          <div className="text-xs text-[#757575] font-mono">{variant.skuSuffix}</div>
                          <div>
                            <Input
                              type="number"
                              value={variant.priceAdjustment}
                              className="h-8 text-sm"
                              onChange={(e) => {
                                const newPrice = parseFloat(e.target.value) || 0
                                setProducts(prev => prev.map(p => {
                                  if (p.id === editingProduct.id) {
                                    return {
                                      ...p,
                                      variants: p.variants.map(v => 
                                        v.id === variant.id ? { ...v, priceAdjustment: newPrice } : v
                                      )
                                    }
                                  }
                                  return p
                                }))
                                setEditingProduct(prev => prev ? {
                                  ...prev,
                                  variants: prev.variants.map(v => 
                                    v.id === variant.id ? { ...v, priceAdjustment: newPrice } : v
                                  )
                                } : null)
                              }}
                            />
                          </div>
                          <div>
                            <Input
                              type="number"
                              value={variant.stock}
                              className="h-8 text-sm"
                              onChange={(e) => {
                                const newStock = parseInt(e.target.value) || 0
                                setProducts(prev => prev.map(p => {
                                  if (p.id === editingProduct.id) {
                                    return {
                                      ...p,
                                      variants: p.variants.map(v => 
                                        v.id === variant.id ? { ...v, stock: newStock } : v
                                      ),
                                      stock: p.variants.reduce((sum, v) => 
                                        sum + (v.id === variant.id ? newStock : v.stock), 0
                                      )
                                    }
                                  }
                                  return p
                                }))
                                setEditingProduct(prev => prev ? {
                                  ...prev,
                                  variants: prev.variants.map(v => 
                                    v.id === variant.id ? { ...v, stock: newStock } : v
                                  ),
                                  stock: prev.variants.reduce((sum, v) => 
                                    sum + (v.id === variant.id ? newStock : v.stock), 0
                                  )
                                } : null)
                              }}
                            />
                          </div>
                          <div>
                            <Switch
                              checked={variant.active}
                              onCheckedChange={(checked) => {
                                setProducts(prev => prev.map(p => {
                                  if (p.id === editingProduct.id) {
                                    return {
                                      ...p,
                                      variants: p.variants.map(v => 
                                        v.id === variant.id ? { ...v, active: checked } : v
                                      )
                                    }
                                  }
                                  return p
                                }))
                                setEditingProduct(prev => prev ? {
                                  ...prev,
                                  variants: prev.variants.map(v => 
                                    v.id === variant.id ? { ...v, active: checked } : v
                                  )
                                } : null)
                              }}
                            />
                          </div>
                          <div>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDeleteVariant(variant.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {/* Matrix Summary */}
                      <div className="grid grid-cols-6 gap-2 pt-4 border-t font-medium">
                        <div>Total ({editingProduct.variants.length})</div>
                        <div></div>
                        <div className="text-sm">
                          {formatCurrency(editingProduct.variants.reduce((sum, v) => sum + v.priceAdjustment, 0) / editingProduct.variants.length)} avg
                        </div>
                        <div className="text-sm">
                          {editingProduct.variants.reduce((sum, v) => sum + v.stock, 0)} total
                        </div>
                        <div></div>
                        <div></div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                      <Table2 className="h-12 w-12 text-purple-300 mb-4" />
                      <p className="text-lg font-medium text-[#757575]">No variants to display</p>
                      <p className="text-sm text-[#757575]">Generate variants to see them in matrix view</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
            
            {/* Add/Edit Variant Form */}
            {(editingVariant || true) && (
              <div className="border-t pt-4 mt-4">
                <div className="grid grid-cols-6 gap-3 items-end">
                  <div>
                    <Label className="text-xs">SKU Suffix</Label>
                    <Input
                      placeholder="1KG-BAG"
                      value={variantFormData.skuSuffix}
                      onChange={(e) => setVariantFormData(prev => ({ ...prev, skuSuffix: e.target.value }))}
                      className="h-9"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Name</Label>
                    <Input
                      placeholder="1kg Bag"
                      value={variantFormData.name}
                      onChange={(e) => setVariantFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Price Adj.</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={variantFormData.priceAdjustment}
                      onChange={(e) => setVariantFormData(prev => ({ ...prev, priceAdjustment: e.target.value }))}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Stock</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={variantFormData.stock}
                      onChange={(e) => setVariantFormData(prev => ({ ...prev, stock: e.target.value }))}
                      className="h-9"
                    />
                  </div>
                  <div>
                    {editingVariant ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleEditVariant} className="bg-[#00897B] hover:bg-[#00695C]">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={resetVariantForm}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        onClick={handleAddVariant} 
                        disabled={!variantFormData.skuSuffix || !variantFormData.name}
                        className="bg-[#00897B] hover:bg-[#00695C] w-full"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setVariantEditorOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Generate Variants Dialog */}
      <Dialog open={bulkVariantDialogOpen} onOpenChange={setBulkVariantDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Generate Variants
            </DialogTitle>
            <DialogDescription>
              Select variant types and options to automatically generate all combinations
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Variant Type Selection */}
            <div className="space-y-3">
              <Label>Select Variant Types</Label>
              <div className="flex flex-wrap gap-2">
                {VARIANT_TYPES.map(vt => (
                  <Badge
                    key={vt.id}
                    variant={selectedVariantTypes.includes(vt.id) ? 'default' : 'outline'}
                    className={`cursor-pointer ${selectedVariantTypes.includes(vt.id) ? 'bg-purple-600' : 'border-purple-300 text-purple-600'}`}
                    onClick={() => {
                      setSelectedVariantTypes(prev => 
                        prev.includes(vt.id) ? prev.filter(t => t !== vt.id) : [...prev, vt.id]
                      )
                      // Clear options for removed type
                      if (selectedVariantTypes.includes(vt.id)) {
                        const newOptions = { ...selectedVariantOptions }
                        delete newOptions[vt.id]
                        setSelectedVariantOptions(newOptions)
                      }
                    }}
                  >
                    <vt.icon className="h-3 w-3 mr-1" />
                    {vt.name}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Options for each selected type */}
            {selectedVariantTypes.map(typeId => {
              const variantType = VARIANT_TYPES.find(t => t.id === typeId)
              if (!variantType) return null
              
              return (
                <div key={typeId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <variantType.icon className="h-4 w-4 text-purple-600" />
                      {variantType.name} Options
                    </Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs"
                      onClick={() => {
                        setSelectedVariantOptions(prev => ({
                          ...prev,
                          [typeId]: variantType.options.map(o => o.id)
                        }))
                      }}
                    >
                      Select All
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {variantType.options.map(option => (
                      <Badge
                        key={option.id}
                        variant={(selectedVariantOptions[typeId] || []).includes(option.id) ? 'default' : 'outline'}
                        className={`cursor-pointer ${(selectedVariantOptions[typeId] || []).includes(option.id) ? 'bg-[#00897B]' : 'border-gray-300'}`}
                        onClick={() => {
                          setSelectedVariantOptions(prev => {
                            const current = prev[typeId] || []
                            return {
                              ...prev,
                              [typeId]: current.includes(option.id)
                                ? current.filter(id => id !== option.id)
                                : [...current, option.id]
                            }
                          })
                        }}
                      >
                        {option.name}
                        {option.priceAdjustment !== 0 && (
                          <span className="ml-1 text-xs opacity-75">
                            ({option.priceAdjustment >= 0 ? '+' : ''}{option.priceAdjustment})
                          </span>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              )
            })}
            
            {/* Preview */}
            {selectedVariantTypes.length > 0 && Object.values(selectedVariantOptions).some(opts => opts.length > 0) && (
              <div className="bg-gray-50 rounded-lg p-4">
                <Label className="mb-2 block">Preview</Label>
                <div className="text-sm text-[#757575]">
                  {(() => {
                    const combinations = selectedVariantTypes.reduce((acc, typeId) => {
                      const options = selectedVariantOptions[typeId] || []
                      return acc * (options.length || 1)
                    }, 1)
                    return `${combinations} variant${combinations !== 1 ? 's' : ''} will be generated`
                  })()}
                </div>
                <ScrollArea className="h-32 mt-2">
                  <div className="space-y-1 text-xs">
                    {(() => {
                      const previews: string[] = []
                      const generatePreview = (typeIndex: number, current: string[]) => {
                        if (typeIndex === selectedVariantTypes.length) {
                          previews.push(current.join(' / '))
                          return
                        }
                        const typeId = selectedVariantTypes[typeIndex]
                        const options = selectedVariantOptions[typeId] || []
                        const vt = VARIANT_TYPES.find(t => t.id === typeId)
                        for (const optionId of options.slice(0, 3)) {
                          const opt = vt?.options.find(o => o.id === optionId)
                          if (opt) {
                            generatePreview(typeIndex + 1, [...current, opt.name])
                          }
                        }
                      }
                      generatePreview(0, [])
                      return previews.slice(0, 10).map((p, i) => (
                        <div key={i} className="text-[#757575]">• {p}</div>
                      ))
                    })()}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setBulkVariantDialogOpen(false)
              setSelectedVariantTypes([])
              setSelectedVariantOptions({})
            }}>
              Cancel
            </Button>
            <Button 
              onClick={generateVariants}
              disabled={selectedVariantTypes.length === 0 || !Object.values(selectedVariantOptions).some(opts => opts.length > 0)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Variants
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>Are you sure you want to delete "{editingProduct?.name}"?</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-50 rounded-lg p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              This action cannot be undone. The product will be permanently removed from your catalog.
              {editingProduct?.hasVariants && editingProduct.variants.length > 0 && (
                <p className="mt-2">This will also delete {editingProduct.variants.length} associated variants.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteProduct} variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />Delete Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={bulkImportDialogOpen} onOpenChange={setBulkImportDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Bulk Import Products</DialogTitle>
            <DialogDescription>Import products from CSV file or paste data</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Tabs defaultValue="paste">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="paste">Paste CSV Data</TabsTrigger>
                <TabsTrigger value="upload">Upload File</TabsTrigger>
              </TabsList>
              <TabsContent value="paste" className="space-y-4">
                <div>
                  <Label>CSV Data</Label>
                  <Textarea
                    placeholder="sku,name,category,unit,price,stock&#10;FP-001,Fresh Veggies,fresh,kg,45.00,100&#10;DR-001,Milk 2L,dairy,bottle,32.50,200"
                    rows={6}
                    value={importData}
                    onChange={(e) => {
                      setImportData(e.target.value)
                      setImportPreview(parseCSV(e.target.value))
                    }}
                  />
                </div>
              </TabsContent>
              <TabsContent value="upload" className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-[#757575]" />
                  <p className="text-sm text-[#757575] mb-2">Drop your CSV file here or</p>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    Browse Files
                  </Button>
                  <input ref={fileInputRef} type="file" accept=".csv" className="hidden" />
                </div>
              </TabsContent>
            </Tabs>

            {importPreview.length > 0 && (
              <div>
                <Label className="mb-2">Preview ({importPreview.length} products)</Label>
                <ScrollArea className="h-[200px] border rounded-lg">
                  <div className="divide-y">
                    {importPreview.map((product, i) => (
                      <div key={i} className="p-2 flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium">{product.name}</span>
                          <span className="text-[#757575] ml-2">({product.sku})</span>
                        </div>
                        <div className="text-[#757575]">
                          {product.unitPrice && formatCurrency(product.unitPrice)} • {product.stock} {product.unit}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setBulkImportDialogOpen(false); setImportData(''); setImportPreview([]); }}>Cancel</Button>
            <Button onClick={handleImport} disabled={importPreview.length === 0} className="bg-[#00897B] hover:bg-[#00695C]">
              <Upload className="h-4 w-4 mr-2" />Import {importPreview.length} Products
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Detail Dialog */}
      <Dialog open={productDetailOpen} onOpenChange={setProductDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProduct?.name}</DialogTitle>
            <DialogDescription>{editingProduct?.sku}</DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <p className="text-sm text-[#757575]">Category</p>
                    <p className="font-medium">{editingProduct.subCategory || editingProduct.category}</p>
                    <p className="text-sm text-[#757575] mt-2">Lead Time</p>
                    <p className="font-medium">{editingProduct.leadTime} days</p>
                    <p className="text-sm text-[#757575] mt-2">Min Order Qty</p>
                    <p className="font-medium">{editingProduct.moq} {editingProduct.unit}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <p className="text-sm text-[#757575]">Unit Price</p>
                    <p className="text-2xl font-bold text-[#00897B]">
                      {editingProduct.hasVariants ? (
                        <>
                          {formatCurrency(editingProduct.unitPrice + Math.min(...editingProduct.variants.map(v => v.priceAdjustment)))}
                          {editingProduct.variants.length > 1 && (
                            <span className="text-sm text-[#757575] font-normal"> - {formatCurrency(editingProduct.unitPrice + Math.max(...editingProduct.variants.map(v => v.priceAdjustment)))}</span>
                          )}
                        </>
                      ) : (
                        formatCurrency(editingProduct.unitPrice)
                      )}
                    </p>
                    {!editingProduct.hasVariants && editingProduct.bulkPrice && (
                      <>
                        <p className="text-sm text-[#757575] mt-2">Bulk Price (min {editingProduct.bulkMinQty})</p>
                        <p className="font-medium">{formatCurrency(editingProduct.bulkPrice)}</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Variants section */}
              {editingProduct.hasVariants && editingProduct.variants.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-purple-600" />
                      Variants ({editingProduct.variants.length})
                    </Label>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => { setProductDetailOpen(false); setVariantEditorOpen(true); }}
                    >
                      <Settings2 className="h-4 w-4 mr-1" />
                      Manage
                    </Button>
                  </div>
                  <ScrollArea className="h-40 border rounded-lg">
                    <div className="divide-y">
                      {editingProduct.variants.map(variant => (
                        <div key={variant.id} className="p-2 flex items-center justify-between text-sm">
                          <div>
                            <span className="font-medium">{variant.name}</span>
                            <span className="text-[#757575] ml-2">({editingProduct.sku}-{variant.skuSuffix})</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={variant.priceAdjustment >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {variant.priceAdjustment >= 0 ? '+' : ''}{formatCurrency(variant.priceAdjustment)}
                            </span>
                            <span className={variant.stock > 0 ? '' : 'text-red-600'}>
                              {variant.stock} units
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
              
              <div>
                <Label>Description</Label>
                <p className="text-sm mt-1">{editingProduct.description}</p>
              </div>
              {editingProduct.specifications.length > 0 && (
                <div>
                  <Label>Specifications</Label>
                  <div className="mt-2 space-y-1">
                    {editingProduct.specifications.map((spec, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-[#757575]">{spec.key}</span>
                        <span>{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {editingProduct.certifications.length > 0 && (
                <div>
                  <Label>Certifications</Label>
                  <div className="flex gap-2 mt-2">
                    {editingProduct.certifications.map((cert, i) => (
                      <Badge key={i} variant="outline">{cert}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {editingProduct.hasVariants 
                      ? editingProduct.variants.reduce((sum, v) => sum + v.stock, 0)
                      : editingProduct.stock}
                  </p>
                  <p className="text-xs text-[#757575]">In Stock</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{editingProduct.sold}</p>
                  <p className="text-xs text-[#757575]">Sold</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#00897B]">{formatCurrency(editingProduct.revenue)}</p>
                  <p className="text-xs text-[#757575]">Revenue</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductDetailOpen(false)}>Close</Button>
            <Button onClick={() => { setProductDetailOpen(false); openEditDialog(editingProduct!); }} className="bg-[#00897B] hover:bg-[#00695C]">
              <Edit className="h-4 w-4 mr-2" />Edit Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
