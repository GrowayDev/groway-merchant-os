'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  Tag,
  Percent,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Edit,
  Trash2,
  Copy,
  MoreHorizontal,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  BarChart3,
  History,
  Zap,
  Target,
  Award,
  ShoppingBag,
  Store,
  Globe,
  Building2,
  Save,
  X,
  FileSpreadsheet,
  TableIcon,
  Check,
  Minus,
} from 'lucide-react'

// Types
interface Product {
  id: string
  sku: string
  barcode: string | null
  name: string
  description: string | null
  category: { id: string; name: string } | null
  categoryId: string | null
  costPrice: number
  sellingPrice: number
  compareAtPrice: number | null
  margin: number
  marginAmount: number
  unit: string
  isActive: boolean
  currentStock: number
  timesSold: number
  createdAt: string
  updatedAt: string
}

interface Category {
  id: string
  name: string
}

interface Stats {
  total: number
  avgMargin: number
  lowMargin: number
  highMargin: number
  active: number
}

interface ImportPreview {
  sku: string
  name: string
  costPrice: number
  sellingPrice: number
  margin: number
  isNew: boolean
  errors?: string[]
}

export function PriceManagementView() {
  const { toast } = useToast()
  
  // State
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, avgMargin: 0, lowMargin: 0, highMargin: 0, active: 0 })
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [marginFilter, setMarginFilter] = useState('all')
  
  // Selection
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  
  // Dialogs
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  
  // Edit state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  
  // Form state
  const [productForm, setProductForm] = useState({
    sku: '',
    barcode: '',
    name: '',
    description: '',
    categoryId: '',
    costPrice: 0,
    sellingPrice: 0,
    compareAtPrice: 0,
    unit: 'each',
    isActive: true,
  })
  
  // Bulk update state
  const [bulkForm, setBulkForm] = useState({
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    direction: 'increase' as 'increase' | 'decrease',
    applyTo: 'sellingPrice' as 'sellingPrice' | 'costPrice',
    reason: '',
  })
  
  // Import state
  const [importData, setImportData] = useState<ImportPreview[]>([])
  const [importRawData, setImportRawData] = useState<string>('')
  const [importing, setImporting] = useState(false)
  const [importUpdateExisting, setImportUpdateExisting] = useState(false)
  
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('products')

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      if (searchQuery) params.append('search', searchQuery)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (marginFilter === 'low') params.append('lowMargin', 'true')

      const response = await fetch(`/merchant-os/api/pricing/products?${params}`)
      const data = await response.json()

      if (data.success) {
        setProducts(data.products || [])
        setCategories(data.categories || [])
        setStats(data.stats || { total: 0, avgMargin: 0, lowMargin: 0, highMargin: 0, active: 0 })
      } else {
        throw new Error(data.error || 'Failed to fetch products')
      }
    } catch (error) {
      console.error('Fetch products error:', error)
      toast({
        title: 'Error',
        description: 'Failed to load products. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [categoryFilter, searchQuery, statusFilter, marginFilter, toast])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Filter products client-side for instant feedback
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.barcode && product.barcode.includes(searchQuery))
    
    const matchesMargin = marginFilter === 'all' ||
      (marginFilter === 'low' && product.margin < 30) ||
      (marginFilter === 'healthy' && product.margin >= 30 && product.margin < 50) ||
      (marginFilter === 'high' && product.margin >= 50)
    
    return matchesSearch && matchesMargin
  })

  // Format currency
  const formatCurrency = (amount: number) => {
    return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Get margin color
  const getMarginColor = (margin: number) => {
    if (margin < 25) return 'text-red-600'
    if (margin < 35) return 'text-orange-600'
    if (margin < 50) return 'text-green-600'
    return 'text-emerald-600'
  }

  const getMarginBgColor = (margin: number) => {
    if (margin < 25) return 'bg-red-100 text-red-700'
    if (margin < 35) return 'bg-orange-100 text-orange-700'
    if (margin < 50) return 'bg-green-100 text-green-700'
    return 'bg-emerald-100 text-emerald-700'
  }

  // Open product dialog for create/edit
  const openProductDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setProductForm({
        sku: product.sku,
        barcode: product.barcode || '',
        name: product.name,
        description: product.description || '',
        categoryId: product.category?.id || '',
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        compareAtPrice: product.compareAtPrice || 0,
        unit: product.unit,
        isActive: product.isActive,
      })
    } else {
      setEditingProduct(null)
      setProductForm({
        sku: '',
        barcode: '',
        name: '',
        description: '',
        categoryId: '',
        costPrice: 0,
        sellingPrice: 0,
        compareAtPrice: 0,
        unit: 'each',
        isActive: true,
      })
    }
    setProductDialogOpen(true)
  }

  // Save product
  const handleSaveProduct = async () => {
    if (!productForm.sku || !productForm.name) {
      toast({
        title: 'Validation Error',
        description: 'SKU and name are required',
        variant: 'destructive',
      })
      return
    }

    try {
      setSaving(true)
      
      if (editingProduct) {
        // Update existing product
        const response = await fetch(`/merchant-os/api/pricing/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...productForm,
            reason: 'manual_edit',
          }),
        })
        
        const data = await response.json()
        
        if (data.success) {
          toast({
            title: 'Product Updated',
            description: `${productForm.name} has been updated successfully`,
          })
          setProductDialogOpen(false)
          fetchProducts()
        } else {
          throw new Error(data.error || 'Failed to update product')
        }
      } else {
        // Create new product
        const response = await fetch('/merchant-os/api/pricing/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productForm),
        })
        
        const data = await response.json()
        
        if (data.success) {
          toast({
            title: 'Product Created',
            description: `${productForm.name} has been created successfully`,
          })
          setProductDialogOpen(false)
          fetchProducts()
        } else {
          throw new Error(data.error || 'Failed to create product')
        }
      }
    } catch (error) {
      console.error('Save product error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save product',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Delete product
  const handleDeleteProduct = async () => {
    if (!productToDelete) return

    try {
      setSaving(true)
      
      const response = await fetch(`/merchant-os/api/pricing/products/${productToDelete.id}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Product Deleted',
          description: `${productToDelete.name} has been deleted`,
        })
        setDeleteDialogOpen(false)
        setProductToDelete(null)
        fetchProducts()
      } else {
        throw new Error(data.error || 'Failed to delete product')
      }
    } catch (error) {
      console.error('Delete product error:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Bulk update
  const handleBulkUpdate = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: 'No Products Selected',
        description: 'Please select products to update',
        variant: 'destructive',
      })
      return
    }

    try {
      setSaving(true)
      
      const updates = selectedProducts.map(productId => {
        const product = products.find(p => p.id === productId)
        if (!product) return null

        let newPrice = product.sellingPrice
        let newCost = product.costPrice
        
        if (bulkForm.applyTo === 'sellingPrice') {
          if (bulkForm.type === 'percentage') {
            const change = product.sellingPrice * (bulkForm.value / 100)
            newPrice = bulkForm.direction === 'increase' 
              ? product.sellingPrice + change 
              : product.sellingPrice - change
          } else {
            newPrice = bulkForm.direction === 'increase' 
              ? product.sellingPrice + bulkForm.value 
              : product.sellingPrice - bulkForm.value
          }
        } else {
          if (bulkForm.type === 'percentage') {
            const change = product.costPrice * (bulkForm.value / 100)
            newCost = bulkForm.direction === 'increase' 
              ? product.costPrice + change 
              : product.costPrice - change
          } else {
            newCost = bulkForm.direction === 'increase' 
              ? product.costPrice + bulkForm.value 
              : product.costPrice - bulkForm.value
          }
        }

        return {
          productId,
          costPrice: newCost,
          sellingPrice: newPrice,
        }
      }).filter(Boolean)

      const response = await fetch('/merchant-os/api/pricing/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates,
          reason: bulkForm.reason || 'bulk_update',
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Bulk Update Complete',
          description: `${data.updated} products have been updated`,
        })
        setBulkUpdateDialogOpen(false)
        setSelectedProducts([])
        setBulkForm({ type: 'percentage', value: 0, direction: 'increase', applyTo: 'sellingPrice', reason: '' })
        fetchProducts()
      } else {
        throw new Error(data.error || 'Failed to update products')
      }
    } catch (error) {
      console.error('Bulk update error:', error)
      toast({
        title: 'Error',
        description: 'Failed to bulk update products',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Parse CSV for import
  const parseCSV = (csvText: string): ImportPreview[] => {
    const lines = csvText.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const results: ImportPreview[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const row: Record<string, string> = {}
      
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })

      const costPrice = parseFloat(row['cost_price'] || row['cost'] || row['costprice'] || '0') || 0
      const sellingPrice = parseFloat(row['selling_price'] || row['price'] || row['sellingprice'] || '0') || 0
      const margin = sellingPrice > 0 ? ((sellingPrice - costPrice) / sellingPrice) * 100 : 0
      
      const existing = products.find(p => p.sku.toLowerCase() === row['sku']?.toLowerCase())

      const preview: ImportPreview = {
        sku: row['sku'] || '',
        name: row['name'] || row['product_name'] || row['productname'] || '',
        costPrice,
        sellingPrice,
        margin: Math.round(margin * 10) / 10,
        isNew: !existing,
      }

      if (!preview.sku) {
        preview.errors = [...(preview.errors || []), 'SKU is required']
      }
      if (!preview.name) {
        preview.errors = [...(preview.errors || []), 'Name is required']
      }

      results.push(preview)
    }

    return results
  }

  // Handle import
  const handleImport = async () => {
    if (importData.length === 0) {
      toast({
        title: 'No Data',
        description: 'Please paste CSV data to import',
        variant: 'destructive',
      })
      return
    }

    const validData = importData.filter(d => !d.errors || d.errors.length === 0)
    if (validData.length === 0) {
      toast({
        title: 'Invalid Data',
        description: 'All rows have errors. Please fix before importing.',
        variant: 'destructive',
      })
      return
    }

    try {
      setImporting(true)
      
      const dataToImport = validData.map(d => ({
        sku: d.sku,
        name: d.name,
        costPrice: d.costPrice,
        sellingPrice: d.sellingPrice,
      }))

      const response = await fetch('/merchant-os/api/pricing/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: dataToImport,
          updateExisting: importUpdateExisting,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Import Complete',
          description: `Created: ${data.summary.created}, Updated: ${data.summary.updated}, Skipped: ${data.summary.skipped}`,
        })
        setImportDialogOpen(false)
        setImportData([])
        setImportRawData('')
        fetchProducts()
      } else {
        throw new Error(data.error || 'Failed to import')
      }
    } catch (error) {
      console.error('Import error:', error)
      toast({
        title: 'Import Error',
        description: 'Failed to import products',
        variant: 'destructive',
      })
    } finally {
      setImporting(false)
    }
  }

  // Export to CSV
  const handleExport = () => {
    const headers = ['SKU', 'Name', 'Category', 'Cost Price', 'Selling Price', 'Margin %', 'Status']
    const rows = filteredProducts.map(p => [
      p.sku,
      `"${p.name}"`,
      p.category?.name || '',
      p.costPrice,
      p.sellingPrice,
      p.margin.toFixed(1),
      p.isActive ? 'Active' : 'Inactive',
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pricing-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: 'Export Complete',
      description: `${filteredProducts.length} products exported`,
    })
  }

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id))
    }
  }

  // Toggle product selection
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  // Calculate preview margin for product form
  const previewMargin = productForm.sellingPrice > 0 
    ? ((productForm.sellingPrice - productForm.costPrice) / productForm.sellingPrice) * 100 
    : 0

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAFAFA] min-h-0">
        <RefreshCw className="h-8 w-8 animate-spin text-[#00897B]" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFA] min-h-0">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#00897B]" />
              Price Management
            </h1>
            <p className="text-sm text-[#757575]">Manage product pricing, margins, and bulk updates</p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" />Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-1" />Import
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setBulkUpdateDialogOpen(true)}
              disabled={selectedProducts.length === 0}
            >
              <Edit className="h-4 w-4 mr-1" />Bulk Update ({selectedProducts.length})
            </Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => openProductDialog()}>
              <Plus className="h-4 w-4 mr-1" />Add Product
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3">
          <div className="bg-[#E0F2F1] rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-[#00897B]">{stats.total}</p>
            <p className="text-xs text-[#757575]">Total Products</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.avgMargin.toFixed(1)}%</p>
            <p className="text-xs text-[#757575]">Avg Margin</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.lowMargin}</p>
            <p className="text-xs text-[#757575]">Low Margin</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.highMargin}</p>
            <p className="text-xs text-[#757575]">High Margin</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.active}</p>
            <p className="text-xs text-[#757575]">Active</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
            <Input
              placeholder="Search by name, SKU, or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={marginFilter} onValueChange={setMarginFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Margin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Margins</SelectItem>
              <SelectItem value="low">Low (&lt;30%)</SelectItem>
              <SelectItem value="healthy">Healthy (30-50%)</SelectItem>
              <SelectItem value="high">High (&gt;50%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Table */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-[#757575]">
                      No products found. Add your first product or import from CSV.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map(product => (
                    <TableRow key={product.id} className={!product.isActive ? 'opacity-60' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => toggleProductSelection(product.id)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          {product.barcode && (
                            <p className="text-xs text-[#757575]">{product.barcode}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category?.name || 'Uncategorized'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(product.costPrice)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(product.sellingPrice)}</TableCell>
                      <TableCell className="text-right">
                        <Badge className={getMarginBgColor(product.margin)}>
                          {product.margin.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {product.isActive ? (
                          <Badge className="bg-green-100 text-green-700">Active</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-600">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openProductDialog(product)}>
                              <Edit className="h-4 w-4 mr-2" />Edit Pricing
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              navigator.clipboard.writeText(product.sku)
                              toast({ title: 'Copied', description: 'SKU copied to clipboard' })
                            }}>
                              <Copy className="h-4 w-4 mr-2" />Copy SKU
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => {
                                setProductToDelete(product)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </ScrollArea>

      {/* Add/Edit Product Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product Pricing' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Update product pricing and details' : 'Create a new product with pricing information'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>SKU *</Label>
                <Input
                  value={productForm.sku}
                  onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="SKU-001"
                />
              </div>
              <div>
                <Label>Barcode</Label>
                <Input
                  value={productForm.barcode}
                  onChange={(e) => setProductForm(prev => ({ ...prev, barcode: e.target.value }))}
                  placeholder="6001234567890"
                />
              </div>
            </div>
            
            <div>
              <Label>Product Name *</Label>
              <Input
                value={productForm.name}
                onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Product name"
              />
            </div>

            <div>
              <Label>Category</Label>
              <Select 
                value={productForm.categoryId} 
                onValueChange={(v) => setProductForm(prev => ({ ...prev, categoryId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Cost Price (R)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={productForm.costPrice}
                  onChange={(e) => setProductForm(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label>Selling Price (R)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={productForm.sellingPrice}
                  onChange={(e) => setProductForm(prev => ({ ...prev, sellingPrice: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label>Compare At (R)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={productForm.compareAtPrice}
                  onChange={(e) => setProductForm(prev => ({ ...prev, compareAtPrice: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            {/* Margin Preview */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#757575]">Calculated Margin</span>
                <span className={`text-lg font-bold ${getMarginColor(previewMargin)}`}>
                  {previewMargin.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-[#757575]">Margin Amount</span>
                <span className="font-medium">{formatCurrency(productForm.sellingPrice - productForm.costPrice)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Unit</Label>
                <Select 
                  value={productForm.unit} 
                  onValueChange={(v) => setProductForm(prev => ({ ...prev, unit: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="each">Each</SelectItem>
                    <SelectItem value="kg">Kilogram</SelectItem>
                    <SelectItem value="g">Gram</SelectItem>
                    <SelectItem value="l">Litre</SelectItem>
                    <SelectItem value="ml">Millilitre</SelectItem>
                    <SelectItem value="pack">Pack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between pt-6">
                <Label>Active</Label>
                <Switch
                  checked={productForm.isActive}
                  onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, isActive: checked }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setProductDialogOpen(false)}>Cancel</Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]" 
              onClick={handleSaveProduct}
              disabled={saving}
            >
              {saving ? 'Saving...' : editingProduct ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Update Dialog */}
      <Dialog open={bulkUpdateDialogOpen} onOpenChange={setBulkUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Price Update</DialogTitle>
            <DialogDescription>
              Update pricing for {selectedProducts.length} selected products
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Apply To</Label>
                <Select 
                  value={bulkForm.applyTo} 
                  onValueChange={(v) => setBulkForm(prev => ({ ...prev, applyTo: v as 'sellingPrice' | 'costPrice' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sellingPrice">Selling Price</SelectItem>
                    <SelectItem value="costPrice">Cost Price</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Direction</Label>
                <Select 
                  value={bulkForm.direction} 
                  onValueChange={(v) => setBulkForm(prev => ({ ...prev, direction: v as 'increase' | 'decrease' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="increase">Increase</SelectItem>
                    <SelectItem value="decrease">Decrease</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Adjustment Type</Label>
                <Select 
                  value={bulkForm.type} 
                  onValueChange={(v) => setBulkForm(prev => ({ ...prev, type: v as 'percentage' | 'fixed' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (R)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Value</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={bulkForm.value}
                  onChange={(e) => setBulkForm(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                  placeholder={bulkForm.type === 'percentage' ? '10' : '5.00'}
                />
              </div>
            </div>

            <div>
              <Label>Reason (Optional)</Label>
              <Input
                value={bulkForm.reason}
                onChange={(e) => setBulkForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="e.g., Supplier cost increase"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkUpdateDialogOpen(false)}>Cancel</Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]" 
              onClick={handleBulkUpdate}
              disabled={saving}
            >
              {saving ? 'Updating...' : 'Apply Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Import Products</DialogTitle>
            <DialogDescription>
              Paste CSV data to import or update products. First row should be headers.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="bg-blue-50 rounded-lg p-3 text-sm">
              <p className="font-medium text-blue-800 mb-1">Expected CSV Format:</p>
              <code className="text-xs text-blue-700">
                sku,name,cost_price,selling_price,category
              </code>
              <p className="text-xs text-blue-600 mt-1">
                Additional columns: barcode, description, unit, compare_at_price
              </p>
            </div>

            <div>
              <Label>CSV Data</Label>
              <Textarea
                value={importRawData}
                onChange={(e) => {
                  setImportRawData(e.target.value)
                  if (e.target.value.trim()) {
                    setImportData(parseCSV(e.target.value))
                  } else {
                    setImportData([])
                  }
                }}
                placeholder={`sku,name,cost_price,selling_price,category
SKU-001,Product Name,10.00,25.00,Category`}
                className="font-mono text-xs min-h-[150px]"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="updateExisting"
                checked={importUpdateExisting}
                onCheckedChange={(checked) => setImportUpdateExisting(checked as boolean)}
              />
              <Label htmlFor="updateExisting" className="text-sm font-normal">
                Update existing products with matching SKU
              </Label>
            </div>

            {/* Preview */}
            {importData.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 border-b">
                  <span className="text-sm font-medium">Preview ({importData.length} rows)</span>
                </div>
                <ScrollArea className="max-h-[200px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Margin</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importData.slice(0, 50).map((row, i) => (
                        <TableRow key={i} className={row.errors && row.errors.length > 0 ? 'bg-red-50' : ''}>
                          <TableCell className="font-mono text-xs">{row.sku}</TableCell>
                          <TableCell>{row.name || '-'}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.costPrice)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.sellingPrice)}</TableCell>
                          <TableCell className="text-right">
                            <Badge className={getMarginBgColor(row.margin)}>{row.margin.toFixed(1)}%</Badge>
                          </TableCell>
                          <TableCell>
                            {row.errors && row.errors.length > 0 ? (
                              <Badge className="bg-red-100 text-red-700">{row.errors.join(', ')}</Badge>
                            ) : row.isNew ? (
                              <Badge className="bg-blue-100 text-blue-700">New</Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-700">Update</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Cancel</Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]" 
              onClick={handleImport}
              disabled={importing || importData.length === 0}
            >
              {importing ? 'Importing...' : `Import ${importData.filter(d => !d.errors || d.errors.length === 0).length} Products`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteProduct}
              disabled={saving}
            >
              {saving ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
