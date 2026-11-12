'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { toast } from 'sonner'
import {
  Smartphone,
  FileText,
  Users,
  Clock,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  History,
  Building2,
  BadgeCheck,
  Ban,
  Loader2,
  ClipboardList,
  ShieldCheck,
  Activity,
  Calendar,
  Package,
  CreditCard,
  Hash,
  ArrowUpRight,
  ArrowDownRight,
  Timer,
  IdCard,
  MapPin,
  Phone,
  FileCheck,
  Upload,
  Wrench,
  AlertCircle,
  Box,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'

// Types
type IMEIStatus = 'in_stock' | 'sold' | 'returned' | 'defective'
type WarrantyClaimStatus = 'pending' | 'approved' | 'replaced' | 'repaired' | 'rejected'

interface IMEIRecord {
  id: string
  imei: string
  productId: string
  productName: string
  variantId?: string
  branchId: string
  branchName: string
  serialNumber?: string
  modelNumber?: string
  color?: string
  storageCapacity?: string
  status: IMEIStatus
  purchaseDate?: string
  saleDate?: string
  saleId?: string
  customerId?: string
  customerName?: string
  warrantyStartDate?: string
  warrantyEndDate?: string
  warrantyProvider?: string
  ricaRegistered: boolean
  ricaRegisteredAt?: string
  ricaReference?: string
  createdAt: string
  updatedAt: string
}

interface RICARegistration {
  id: string
  ricaReference: string
  simNumber: string
  imsi?: string
  networkProvider: string
  // Customer Details
  fullName: string
  saIdNumber: string
  contactNumber: string
  emailAddress?: string
  // Address
  streetAddress: string
  suburb: string
  city: string
  province: string
  postalCode: string
  // Documents
  idDocumentUploaded: boolean
  idDocumentUrl?: string
  proofOfResidenceUploaded: boolean
  proofOfResidenceUrl?: string
  // Status
  status: 'pending' | 'verified' | 'rejected'
  verifiedBy?: string
  verifiedAt?: string
  // Timestamps
  registeredAt: string
  createdAt: string
  // Sale reference
  saleId?: string
  imei?: string
}

interface WarrantyClaim {
  id: string
  claimNumber: string
  imei: string
  productId: string
  productName: string
  customerId: string
  customerName: string
  customerPhone?: string
  customerEmail?: string
  purchaseDate: string
  claimDate: string
  warrantyMonths: number
  warrantyEndDate: string
  status: WarrantyClaimStatus
  issueDescription: string
  faultCategory: string
  resolution?: string
  resolvedAt?: string
  replacementIMEI?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

interface StockItem {
  id: string
  productId: string
  productName: string
  sku: string
  serialTracked: boolean
  imeiTracked: boolean
  totalQuantity: number
  trackedQuantity: number
  untrackedQuantity: number
  branchName: string
  lastUpdated: string
}

// Status labels and colors
const imeiStatusLabels: Record<IMEIStatus, { label: string; color: string }> = {
  in_stock: { label: 'In Stock', color: 'bg-green-100 text-green-700' },
  sold: { label: 'Sold', color: 'bg-blue-100 text-blue-700' },
  returned: { label: 'Returned', color: 'bg-yellow-100 text-yellow-700' },
  defective: { label: 'Defective', color: 'bg-red-100 text-red-700' },
}

const warrantyStatusLabels: Record<WarrantyClaimStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700' },
  replaced: { label: 'Replaced', color: 'bg-blue-100 text-blue-700' },
  repaired: { label: 'Repaired', color: 'bg-purple-100 text-purple-700' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
}

const southAfricanProvinces = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape',
]

const networkProviders = [
  'Vodacom',
  'MTN',
  'Cell C',
  'Telkom',
  'Rain',
  'Lyca Mobile',
  'Other',
]

// IMEI Validation (Luhn algorithm)
const validateIMEI = (imei: string): boolean => {
  if (!/^\d{15}$/.test(imei)) return false
  
  let sum = 0
  for (let i = 0; i < 15; i++) {
    let digit = parseInt(imei[i])
    if (i % 2 === 1) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return sum % 10 === 0
}

// Format IMEI for display
const formatIMEI = (imei: string): string => {
  if (imei.length !== 15) return imei
  return `${imei.slice(0, 2)}-${imei.slice(2, 8)}-${imei.slice(8, 14)}-${imei.slice(14)}`
}

// South African ID validation
const validateSAId = (id: string): boolean => {
  if (!/^\d{13}$/.test(id)) return false
  
  // Validate date
  const year = parseInt(id.slice(0, 2))
  const month = parseInt(id.slice(2, 4))
  const day = parseInt(id.slice(4, 6))
  
  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false
  
  // Luhn check
  let sum = 0
  for (let i = 0; i < 13; i++) {
    let digit = parseInt(id[i])
    if (i % 2 === 1) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return sum % 10 === 0
}

export function ElectronicsComplianceView() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Data states
  const [imeiRecords, setImeiRecords] = useState<IMEIRecord[]>([])
  const [ricaRegistrations, setRicaRegistrations] = useState<RICARegistration[]>([])
  const [warrantyClaims, setWarrantyClaims] = useState<WarrantyClaim[]>([])
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  
  // Search and filter states
  const [imeiSearch, setImeiSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // Dialog states
  const [imeiDialogOpen, setImeiDialogOpen] = useState(false)
  const [ricaDialogOpen, setRicaDialogOpen] = useState(false)
  const [warrantyDialogOpen, setWarrantyDialogOpen] = useState(false)
  const [bulkImeiDialogOpen, setBulkImeiDialogOpen] = useState(false)
  const [imeiDetailDialogOpen, setImeiDetailDialogOpen] = useState(false)
  const [selectedIMEI, setSelectedIMEI] = useState<IMEIRecord | null>(null)
  
  // Form states
  const [saving, setSaving] = useState(false)
  
  const [newIMEI, setNewIMEI] = useState({
    imei: '',
    productId: '',
    productName: '',
    serialNumber: '',
    modelNumber: '',
    color: '',
    storageCapacity: '',
    warrantyMonths: 12,
    warrantyProvider: 'Manufacturer',
  })
  
  const [newRICA, setNewRICA] = useState({
    simNumber: '',
    networkProvider: '',
    fullName: '',
    saIdNumber: '',
    contactNumber: '',
    emailAddress: '',
    streetAddress: '',
    suburb: '',
    city: '',
    province: '',
    postalCode: '',
    imei: '',
  })
  
  const [newWarrantyClaim, setNewWarrantyClaim] = useState({
    imei: '',
    issueDescription: '',
    faultCategory: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
  })
  
  const [bulkIMEIs, setBulkIMEIs] = useState('')
  const [bulkProductId, setBulkProductId] = useState('')
  
  // Update time
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Fetch data on mount
  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchIMEIRecords(),
        fetchRICARegistrations(),
        fetchWarrantyClaims(),
        fetchStockItems(),
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchIMEIRecords = async () => {
    try {
      const res = await fetch('/api/merchant-os/electronics/imei')
      if (res.ok) {
        const data = await res.json()
        setImeiRecords(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching IMEI records:', error)
    }
  }

  const fetchRICARegistrations = async () => {
    try {
      const res = await fetch('/api/merchant-os/electronics/rica')
      if (res.ok) {
        const data = await res.json()
        setRicaRegistrations(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching RICA registrations:', error)
    }
  }

  const fetchWarrantyClaims = async () => {
    try {
      const res = await fetch('/api/merchant-os/electronics/warranty')
      if (res.ok) {
        const data = await res.json()
        setWarrantyClaims(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching warranty claims:', error)
    }
  }

  const fetchStockItems = async () => {
    // Mock data for stock items
    setStockItems([
      {
        id: 'stk_001',
        productId: 'prod_001',
        productName: 'iPhone 15 Pro Max 256GB',
        sku: 'IPHONE-15PM-256',
        serialTracked: true,
        imeiTracked: true,
        totalQuantity: 25,
        trackedQuantity: 25,
        untrackedQuantity: 0,
        branchName: 'Main Store',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'stk_002',
        productId: 'prod_002',
        productName: 'Samsung Galaxy S24 Ultra',
        sku: 'SAMSUNG-S24U-512',
        serialTracked: true,
        imeiTracked: true,
        totalQuantity: 18,
        trackedQuantity: 15,
        untrackedQuantity: 3,
        branchName: 'Main Store',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'stk_003',
        productId: 'prod_003',
        productName: 'Vodacom SIM Starter Pack',
        sku: 'SIM-VODA-START',
        serialTracked: false,
        imeiTracked: false,
        totalQuantity: 150,
        trackedQuantity: 0,
        untrackedQuantity: 150,
        branchName: 'Main Store',
        lastUpdated: new Date().toISOString(),
      },
    ])
  }

  // IMEI operations
  const createIMEI = async () => {
    if (!validateIMEI(newIMEI.imei)) {
      toast.error('Invalid IMEI number. Must be 15 digits and pass Luhn check.')
      return
    }
    
    if (!newIMEI.productName) {
      toast.error('Please select a product')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/api/merchant-os/electronics/imei', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIMEI),
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to register IMEI')
      }
      
      toast.success('IMEI registered successfully')
      setImeiDialogOpen(false)
      setNewIMEI({
        imei: '',
        productId: '',
        productName: '',
        serialNumber: '',
        modelNumber: '',
        color: '',
        storageCapacity: '',
        warrantyMonths: 12,
        warrantyProvider: 'Manufacturer',
      })
      fetchIMEIRecords()
    } catch (error: any) {
      console.error('Error creating IMEI:', error)
      toast.error(error.message || 'Failed to register IMEI')
    } finally {
      setSaving(false)
    }
  }

  const bulkImportIMEIs = async () => {
    const imeiList = bulkIMEIs.split('\n').map(i => i.trim()).filter(i => i.length === 15)
    
    if (imeiList.length === 0) {
      toast.error('No valid IMEI numbers found')
      return
    }
    
    if (!bulkProductId) {
      toast.error('Please select a product')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/api/merchant-os/electronics/imei', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bulk: true,
          imeis: imeiList,
          productId: bulkProductId,
        }),
      })
      
      if (!res.ok) throw new Error('Failed to import IMEIs')
      
      const data = await res.json()
      toast.success(`Imported ${data.imported} IMEI records`)
      setBulkImeiDialogOpen(false)
      setBulkIMEIs('')
      setBulkProductId('')
      fetchIMEIRecords()
    } catch (error) {
      console.error('Error bulk importing IMEIs:', error)
      toast.error('Failed to import IMEIs')
    } finally {
      setSaving(false)
    }
  }

  // RICA operations
  const createRICA = async () => {
    if (!validateSAId(newRICA.saIdNumber)) {
      toast.error('Invalid South African ID number')
      return
    }
    
    if (!newRICA.fullName || !newRICA.contactNumber || !newRICA.streetAddress) {
      toast.error('Please fill all required fields')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/api/merchant-os/electronics/rica', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRICA),
      })
      
      if (!res.ok) throw new Error('Failed to register RICA')
      
      toast.success('RICA registration submitted')
      setRicaDialogOpen(false)
      setNewRICA({
        simNumber: '',
        networkProvider: '',
        fullName: '',
        saIdNumber: '',
        contactNumber: '',
        emailAddress: '',
        streetAddress: '',
        suburb: '',
        city: '',
        province: '',
        postalCode: '',
        imei: '',
      })
      fetchRICARegistrations()
    } catch (error) {
      console.error('Error creating RICA:', error)
      toast.error('Failed to register RICA')
    } finally {
      setSaving(false)
    }
  }

  // Warranty operations
  const createWarrantyClaim = async () => {
    if (!newWarrantyClaim.imei || !newWarrantyClaim.issueDescription) {
      toast.error('Please fill all required fields')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/api/merchant-os/electronics/warranty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWarrantyClaim),
      })
      
      if (!res.ok) throw new Error('Failed to create warranty claim')
      
      toast.success('Warranty claim created')
      setWarrantyDialogOpen(false)
      setNewWarrantyClaim({
        imei: '',
        issueDescription: '',
        faultCategory: '',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
      })
      fetchWarrantyClaims()
    } catch (error) {
      console.error('Error creating warranty claim:', error)
      toast.error('Failed to create warranty claim')
    } finally {
      setSaving(false)
    }
  }

  // Stats for dashboard
  const stats = {
    devicesInStock: imeiRecords.filter(i => i.status === 'in_stock').length,
    imeiTrackedItems: imeiRecords.length,
    pendingRICA: ricaRegistrations.filter(r => r.status === 'pending').length,
    activeWarrantyClaims: warrantyClaims.filter(w => w.status === 'pending' || w.status === 'approved').length,
    warrantyExpiring: warrantyClaims.filter(w => {
      const endDate = new Date(w.warrantyEndDate)
      const thirtyDays = new Date()
      thirtyDays.setDate(thirtyDays.getDate() + 30)
      return endDate <= thirtyDays && w.status === 'approved'
    }).length,
    lowStockItems: stockItems.filter(s => s.totalQuantity < 5).length,
  }

  // Filter IMEI records
  const filteredIMEIRecords = imeiRecords.filter(record => {
    const matchesSearch = imeiSearch === '' || 
      record.imei.includes(imeiSearch) ||
      record.productName.toLowerCase().includes(imeiSearch.toLowerCase()) ||
      (record.customerName && record.customerName.toLowerCase().includes(imeiSearch.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#FAFAFA]">
        <Loader2 className="h-8 w-8 animate-spin text-[#00897B]" />
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
              <Smartphone className="h-5 w-5 text-[#00897B]" />
              Electronics Compliance
            </h1>
            <p className="text-sm text-[#757575]">IMEI tracking, RICA compliance & warranty management</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-mono font-bold">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-xs text-[#757575]">{currentTime.toLocaleDateString()}</p>
            </div>
            
            <Button variant="outline" size="sm" onClick={fetchAllData}>
              <RefreshCw className="h-4 w-4 mr-1" />Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-6 gap-3">
          <div className="bg-[#E0F2F1] rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-[#00897B]">{stats.devicesInStock}</p>
            <p className="text-[10px] text-[#757575]">Devices In Stock</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-blue-600">{stats.imeiTrackedItems}</p>
            <p className="text-[10px] text-[#757575]">IMEI Tracked</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-yellow-600">{stats.pendingRICA}</p>
            <p className="text-[10px] text-[#757575]">Pending RICA</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-purple-600">{stats.activeWarrantyClaims}</p>
            <p className="text-[10px] text-[#757575]">Warranty Claims</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-orange-600">{stats.warrantyExpiring}</p>
            <p className="text-[10px] text-[#757575]">Expiring Soon</p>
          </div>
          <div className="bg-red-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-red-600">{stats.lowStockItems}</p>
            <p className="text-[10px] text-[#757575]">Low Stock</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 flex flex-col min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="bg-white border-b border-gray-200 px-4">
            <TabsList className="bg-transparent h-12">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="imei" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Hash className="h-4 w-4 mr-1" />IMEI Register
              </TabsTrigger>
              <TabsTrigger value="rica" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <IdCard className="h-4 w-4 mr-1" />RICA
              </TabsTrigger>
              <TabsTrigger value="warranty" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <ShieldCheck className="h-4 w-4 mr-1" />Warranty
              </TabsTrigger>
              <TabsTrigger value="stock" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Package className="h-4 w-4 mr-1" />Stock Tracking
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-4">
            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="m-0">
              <div className="grid grid-cols-2 gap-4">
                {/* Recent IMEI Registrations */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Hash className="h-5 w-5 text-[#00897B]" />
                      Recent IMEI Registrations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {imeiRecords.slice(0, 5).map(record => (
                        <div key={record.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-mono text-sm font-medium">{formatIMEI(record.imei)}</p>
                            <p className="text-xs text-[#757575]">{record.productName}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={imeiStatusLabels[record.status].color}>
                              {imeiStatusLabels[record.status].label}
                            </Badge>
                            {record.ricaRegistered && (
                              <Badge className="bg-green-100 text-green-700">
                                RICA
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                      {imeiRecords.length === 0 && (
                        <div className="text-center py-4 text-[#757575]">
                          <Hash className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No IMEI records yet</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* RICA Compliance Status */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <IdCard className="h-5 w-5 text-[#00897B]" />
                      RICA Compliance Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-yellow-600" />
                          <div>
                            <p className="font-medium text-yellow-700">Pending Verification</p>
                            <p className="text-xs text-yellow-600">Require document verification</p>
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-yellow-600">{stats.pendingRICA}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-700">Verified Today</p>
                            <p className="text-xs text-green-600">Successfully registered</p>
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-green-600">
                          {ricaRegistrations.filter(r => r.status === 'verified' && 
                            new Date(r.verifiedAt || '').toDateString() === new Date().toDateString()
                          ).length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Warranty Claims Overview */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-[#00897B]" />
                      Active Warranty Claims
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {warrantyClaims.filter(w => w.status === 'pending' || w.status === 'approved').slice(0, 5).map(claim => (
                        <div key={claim.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{claim.claimNumber}</p>
                            <p className="text-xs text-[#757575]">{claim.productName}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={warrantyStatusLabels[claim.status].color}>
                              {warrantyStatusLabels[claim.status].label}
                            </Badge>
                            <p className="text-xs text-[#757575] mt-1">{claim.customerName}</p>
                          </div>
                        </div>
                      ))}
                      {warrantyClaims.length === 0 && (
                        <div className="text-center py-4 text-[#757575]">
                          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                          <p>No active warranty claims</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Low Stock Alerts */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-[#00897B]" />
                      Low Stock Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stockItems.filter(s => s.totalQuantity < 5).map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg border border-red-200">
                          <div>
                            <p className="font-medium text-sm text-red-700">{item.productName}</p>
                            <p className="text-xs text-red-600">SKU: {item.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-red-600">{item.totalQuantity}</p>
                            <p className="text-xs text-red-500">units left</p>
                          </div>
                        </div>
                      ))}
                      {stockItems.filter(s => s.totalQuantity < 5).length === 0 && (
                        <div className="text-center py-4 text-[#757575]">
                          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                          <p>All stock levels healthy</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* IMEI Register Tab */}
            <TabsContent value="imei" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                    <Input
                      placeholder="Search by IMEI, product, customer..."
                      value={imeiSearch}
                      onChange={(e) => setImeiSearch(e.target.value)}
                      className="pl-9 w-80"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="in_stock">In Stock</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                      <SelectItem value="returned">Returned</SelectItem>
                      <SelectItem value="defective">Defective</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setBulkImeiDialogOpen(true)}>
                    <Upload className="h-4 w-4 mr-1" />Bulk Import
                  </Button>
                  <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setImeiDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />Register IMEI
                  </Button>
                </div>
              </div>

              <div className="bg-white rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IMEI Number</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Model/Color</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sale Info</TableHead>
                      <TableHead>Warranty</TableHead>
                      <TableHead>RICA</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIMEIRecords.map(record => (
                      <TableRow key={record.id}>
                        <TableCell className="font-mono font-medium">{formatIMEI(record.imei)}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{record.productName}</p>
                            {record.serialNumber && (
                              <p className="text-xs text-[#757575]">S/N: {record.serialNumber}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {record.modelNumber && <p className="text-sm">{record.modelNumber}</p>}
                            {record.color && <p className="text-xs text-[#757575]">{record.color}{record.storageCapacity && ` • ${record.storageCapacity}`}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={imeiStatusLabels[record.status].color}>
                            {imeiStatusLabels[record.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {record.status === 'sold' ? (
                            <div>
                              <p className="text-sm">{record.customerName}</p>
                              <p className="text-xs text-[#757575]">{record.saleDate}</p>
                            </div>
                          ) : (
                            <span className="text-[#757575]">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.warrantyEndDate ? (
                            <div>
                              <p className="text-sm">{new Date(record.warrantyEndDate) > new Date() ? 'Active' : 'Expired'}</p>
                              <p className="text-xs text-[#757575]">{record.warrantyEndDate}</p>
                            </div>
                          ) : (
                            <span className="text-[#757575]">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.ricaRegistered ? (
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle2 className="h-3 w-3 mr-1" />Registered
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[#757575]">Not Required</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                setSelectedIMEI(record)
                                setImeiDetailDialogOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredIMEIRecords.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-[#757575]">
                          <Hash className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          No IMEI records found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* RICA Tab */}
            <TabsContent value="rica" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">RICA Registrations</h2>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />Export Report
                  </Button>
                  <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setRicaDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />New RICA Registration
                  </Button>
                </div>
              </div>

              {/* RICA Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-700">RICA Compliance Required</p>
                    <p className="text-sm text-blue-600">
                      The Regulation of Interception of Communications and Provision of Communication-Related Information Act (RICA) 
                      requires all SIM card activations to be registered with verified customer information. 
                      Failure to comply may result in penalties.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>RICA Reference</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>SA ID Number</TableHead>
                      <TableHead>SIM / Network</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Documents</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registered</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ricaRegistrations.map(reg => (
                      <TableRow key={reg.id}>
                        <TableCell className="font-medium">{reg.ricaReference}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{reg.fullName}</p>
                            <p className="text-xs text-[#757575]">{reg.contactNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{reg.saIdNumber}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{reg.simNumber}</p>
                            <p className="text-xs text-[#757575]">{reg.networkProvider}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{reg.streetAddress}</p>
                          <p className="text-xs text-[#757575]">{reg.city}, {reg.province}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Badge className={reg.idDocumentUploaded ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                              ID
                            </Badge>
                            <Badge className={reg.proofOfResidenceUploaded ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                              Proof
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            reg.status === 'verified' ? 'bg-green-100 text-green-700' :
                            reg.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }>
                            {reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{new Date(reg.registeredAt).toLocaleDateString()}</p>
                          <p className="text-xs text-[#757575]">{new Date(reg.registeredAt).toLocaleTimeString()}</p>
                        </TableCell>
                      </TableRow>
                    ))}
                    {ricaRegistrations.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-[#757575]">
                          <IdCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          No RICA registrations found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Warranty Tab */}
            <TabsContent value="warranty" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Warranty Claims</h2>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Search className="h-4 w-4 mr-1" />Lookup IMEI
                  </Button>
                  <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setWarrantyDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />New Claim
                  </Button>
                </div>
              </div>

              {/* CPA Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-700">Consumer Protection Act (CPA) Warranty</p>
                    <p className="text-sm text-green-600">
                      The CPA provides an implied warranty of 6 months minimum on all goods. 
                      Manufacturers may offer extended warranties beyond this period.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Claim #</TableHead>
                      <TableHead>IMEI / Product</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Issue</TableHead>
                      <TableHead>Purchase Date</TableHead>
                      <TableHead>Warranty End</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {warrantyClaims.map(claim => (
                      <TableRow key={claim.id}>
                        <TableCell className="font-medium">{claim.claimNumber}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-mono text-sm">{formatIMEI(claim.imei)}</p>
                            <p className="text-xs text-[#757575]">{claim.productName}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{claim.customerName}</p>
                            <p className="text-xs text-[#757575]">{claim.customerPhone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm max-w-xs truncate">{claim.issueDescription}</p>
                        </TableCell>
                        <TableCell>{claim.purchaseDate}</TableCell>
                        <TableCell>
                          <div>
                            <p className={new Date(claim.warrantyEndDate) < new Date() ? 'text-red-600 font-medium' : ''}>
                              {claim.warrantyEndDate}
                            </p>
                            <p className="text-xs text-[#757575]">{claim.warrantyMonths} months</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={warrantyStatusLabels[claim.status].color}>
                            {warrantyStatusLabels[claim.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {warrantyClaims.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-[#757575]">
                          <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          No warranty claims found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Stock Tracking Tab */}
            <TabsContent value="stock" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Serial-Tracked Stock</h2>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <ArrowDownRight className="h-4 w-4 mr-1" />Receiving
                  </Button>
                  <Button variant="outline" size="sm">
                    <ArrowRight className="h-4 w-4 mr-1" />Transfer
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#757575]">IMEI Tracked Items</p>
                        <p className="text-2xl font-bold">{stockItems.filter(s => s.imeiTracked).length}</p>
                      </div>
                      <Smartphone className="h-8 w-8 text-[#00897B]" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#757575]">Total Tracked Units</p>
                        <p className="text-2xl font-bold">{stockItems.reduce((sum, s) => sum + s.trackedQuantity, 0)}</p>
                      </div>
                      <Package className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#757575]">Untracked Items</p>
                        <p className="text-2xl font-bold">{stockItems.filter(s => s.untrackedQuantity > 0).length}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-white rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Tracking Type</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Tracked</TableHead>
                      <TableHead className="text-center">Untracked</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell className="font-mono">{item.sku}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {item.imeiTracked && (
                              <Badge className="bg-blue-100 text-blue-700">IMEI</Badge>
                            )}
                            {item.serialTracked && (
                              <Badge className="bg-purple-100 text-purple-700">Serial</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">{item.totalQuantity}</TableCell>
                        <TableCell className="text-center text-green-600">{item.trackedQuantity}</TableCell>
                        <TableCell className="text-center">
                          {item.untrackedQuantity > 0 ? (
                            <span className="text-orange-600 font-medium">{item.untrackedQuantity}</span>
                          ) : (
                            <span className="text-[#757575]">0</span>
                          )}
                        </TableCell>
                        <TableCell>{item.branchName}</TableCell>
                        <TableCell>
                          {item.totalQuantity < 5 ? (
                            <Badge className="bg-red-100 text-red-700">Low Stock</Badge>
                          ) : item.untrackedQuantity > 0 ? (
                            <Badge className="bg-yellow-100 text-yellow-700">Needs Tracking</Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700">OK</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {stockItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-[#757575]">
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          No stock items found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>

      {/* Register IMEI Dialog */}
      <Dialog open={imeiDialogOpen} onOpenChange={setImeiDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Register IMEI</DialogTitle>
            <DialogDescription>
              Add a new IMEI number to the tracking system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="imei">IMEI Number (15 digits) *</Label>
              <Input
                id="imei"
                placeholder="Enter 15-digit IMEI"
                value={newIMEI.imei}
                onChange={(e) => setNewIMEI({ ...newIMEI, imei: e.target.value.replace(/\D/g, '').slice(0, 15) })}
                className="font-mono"
              />
              {newIMEI.imei.length === 15 && (
                <p className={`text-xs ${validateIMEI(newIMEI.imei) ? 'text-green-600' : 'text-red-600'}`}>
                  {validateIMEI(newIMEI.imei) ? '✓ Valid IMEI (Luhn check passed)' : '✗ Invalid IMEI (Luhn check failed)'}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="product">Product *</Label>
              <Input
                id="product"
                placeholder="Enter product name"
                value={newIMEI.productName}
                onChange={(e) => setNewIMEI({ ...newIMEI, productName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="serial">Serial Number</Label>
                <Input
                  id="serial"
                  placeholder="Serial number"
                  value={newIMEI.serialNumber}
                  onChange={(e) => setNewIMEI({ ...newIMEI, serialNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model Number</Label>
                <Input
                  id="model"
                  placeholder="Model number"
                  value={newIMEI.modelNumber}
                  onChange={(e) => setNewIMEI({ ...newIMEI, modelNumber: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  placeholder="Color"
                  value={newIMEI.color}
                  onChange={(e) => setNewIMEI({ ...newIMEI, color: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storage">Storage Capacity</Label>
                <Input
                  id="storage"
                  placeholder="e.g., 256GB"
                  value={newIMEI.storageCapacity}
                  onChange={(e) => setNewIMEI({ ...newIMEI, storageCapacity: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="warrantyMonths">Warranty Period</Label>
                <Select 
                  value={newIMEI.warrantyMonths.toString()} 
                  onValueChange={(v) => setNewIMEI({ ...newIMEI, warrantyMonths: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">12 months</SelectItem>
                    <SelectItem value="24">24 months</SelectItem>
                    <SelectItem value="36">36 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="warrantyProvider">Warranty Provider</Label>
                <Select 
                  value={newIMEI.warrantyProvider} 
                  onValueChange={(v) => setNewIMEI({ ...newIMEI, warrantyProvider: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manufacturer">Manufacturer</SelectItem>
                    <SelectItem value="Extended">Extended Warranty</SelectItem>
                    <SelectItem value="Retailer">Retailer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImeiDialogOpen(false)}>Cancel</Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]"
              onClick={createIMEI}
              disabled={saving || newIMEI.imei.length !== 15 || !validateIMEI(newIMEI.imei)}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Register IMEI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk IMEI Import Dialog */}
      <Dialog open={bulkImeiDialogOpen} onOpenChange={setBulkImeiDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Bulk IMEI Import</DialogTitle>
            <DialogDescription>
              Import multiple IMEI numbers for receiving stock
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulkProduct">Product *</Label>
              <Input
                id="bulkProduct"
                placeholder="Enter product name"
                value={bulkProductId}
                onChange={(e) => setBulkProductId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulkImeis">IMEI Numbers (one per line)</Label>
              <Textarea
                id="bulkImeis"
                placeholder="Enter IMEI numbers, one per line&#10;Each IMEI must be exactly 15 digits"
                value={bulkIMEIs}
                onChange={(e) => setBulkIMEIs(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-xs text-[#757575]">
                {bulkIMEIs.split('\n').filter(i => i.trim().length === 15).length} valid IMEI(s) detected
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkImeiDialogOpen(false)}>Cancel</Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]"
              onClick={bulkImportIMEIs}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Import IMEIs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RICA Registration Dialog */}
      <Dialog open={ricaDialogOpen} onOpenChange={setRicaDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IdCard className="h-5 w-5 text-[#00897B]" />
              RICA Registration
            </DialogTitle>
            <DialogDescription>
              Register a new SIM card activation as required by RICA
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* SIM Details */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-[#757575] uppercase tracking-wide">SIM Card Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="simNumber">SIM Card Number *</Label>
                  <Input
                    id="simNumber"
                    placeholder="SIM card number"
                    value={newRICA.simNumber}
                    onChange={(e) => setNewRICA({ ...newRICA, simNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="network">Network Provider *</Label>
                  <Select 
                    value={newRICA.networkProvider} 
                    onValueChange={(v) => setNewRICA({ ...newRICA, networkProvider: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select network" />
                    </SelectTrigger>
                    <SelectContent>
                      {networkProviders.map(provider => (
                        <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ricaImei">Associated IMEI (optional)</Label>
                <Input
                  id="ricaImei"
                  placeholder="IMEI number if sold with device"
                  value={newRICA.imei}
                  onChange={(e) => setNewRICA({ ...newRICA, imei: e.target.value.replace(/\D/g, '').slice(0, 15) })}
                  className="font-mono"
                />
              </div>
            </div>

            <Separator />

            {/* Customer Details */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-[#757575] uppercase tracking-wide">Customer Information</h3>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="Full name as per ID"
                  value={newRICA.fullName}
                  onChange={(e) => setNewRICA({ ...newRICA, fullName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="saId">SA ID Number *</Label>
                  <Input
                    id="saId"
                    placeholder="13-digit SA ID number"
                    value={newRICA.saIdNumber}
                    onChange={(e) => setNewRICA({ ...newRICA, saIdNumber: e.target.value.replace(/\D/g, '').slice(0, 13) })}
                    className="font-mono"
                  />
                  {newRICA.saIdNumber.length === 13 && (
                    <p className={`text-xs ${validateSAId(newRICA.saIdNumber) ? 'text-green-600' : 'text-red-600'}`}>
                      {validateSAId(newRICA.saIdNumber) ? '✓ Valid SA ID' : '✗ Invalid SA ID'}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">Contact Number *</Label>
                  <Input
                    id="contact"
                    placeholder="+27 XX XXX XXXX"
                    value={newRICA.contactNumber}
                    onChange={(e) => setNewRICA({ ...newRICA, contactNumber: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email address"
                  value={newRICA.emailAddress}
                  onChange={(e) => setNewRICA({ ...newRICA, emailAddress: e.target.value })}
                />
              </div>
            </div>

            <Separator />

            {/* Address Details */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-[#757575] uppercase tracking-wide">Physical Address</h3>
              <div className="space-y-2">
                <Label htmlFor="street">Street Address *</Label>
                <Input
                  id="street"
                  placeholder="Street number and name"
                  value={newRICA.streetAddress}
                  onChange={(e) => setNewRICA({ ...newRICA, streetAddress: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="suburb">Suburb</Label>
                  <Input
                    id="suburb"
                    placeholder="Suburb"
                    value={newRICA.suburb}
                    onChange={(e) => setNewRICA({ ...newRICA, suburb: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="City"
                    value={newRICA.city}
                    onChange={(e) => setNewRICA({ ...newRICA, city: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="province">Province *</Label>
                  <Select 
                    value={newRICA.province} 
                    onValueChange={(v) => setNewRICA({ ...newRICA, province: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      {southAfricanProvinces.map(province => (
                        <SelectItem key={province} value={province}>{province}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code *</Label>
                  <Input
                    id="postalCode"
                    placeholder="Postal code"
                    value={newRICA.postalCode}
                    onChange={(e) => setNewRICA({ ...newRICA, postalCode: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Documents */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-[#757575] uppercase tracking-wide">Supporting Documents</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm font-medium">ID Document</p>
                  <p className="text-xs text-[#757575]">Click to upload</p>
                </div>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm font-medium">Proof of Residence</p>
                  <p className="text-xs text-[#757575]">Click to upload</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRicaDialogOpen(false)}>Cancel</Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]"
              onClick={createRICA}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit RICA Registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warranty Claim Dialog */}
      <Dialog open={warrantyDialogOpen} onOpenChange={setWarrantyDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Warranty Claim</DialogTitle>
            <DialogDescription>
              Submit a new warranty claim for a device
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="claimImei">IMEI Number *</Label>
              <Input
                id="claimImei"
                placeholder="Enter 15-digit IMEI"
                value={newWarrantyClaim.imei}
                onChange={(e) => setNewWarrantyClaim({ ...newWarrantyClaim, imei: e.target.value.replace(/\D/g, '').slice(0, 15) })}
                className="font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  placeholder="Customer name"
                  value={newWarrantyClaim.customerName}
                  onChange={(e) => setNewWarrantyClaim({ ...newWarrantyClaim, customerName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Customer Phone</Label>
                <Input
                  id="customerPhone"
                  placeholder="Contact number"
                  value={newWarrantyClaim.customerPhone}
                  onChange={(e) => setNewWarrantyClaim({ ...newWarrantyClaim, customerPhone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="faultCategory">Fault Category</Label>
              <Select 
                value={newWarrantyClaim.faultCategory} 
                onValueChange={(v) => setNewWarrantyClaim({ ...newWarrantyClaim, faultCategory: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select fault category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="battery">Battery Issue</SelectItem>
                  <SelectItem value="screen">Screen Defect</SelectItem>
                  <SelectItem value="software">Software Issue</SelectItem>
                  <SelectItem value="charging">Charging Port</SelectItem>
                  <SelectItem value="audio">Audio/Speaker</SelectItem>
                  <SelectItem value="camera">Camera Issue</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="issueDescription">Issue Description *</Label>
              <Textarea
                id="issueDescription"
                placeholder="Describe the issue in detail"
                value={newWarrantyClaim.issueDescription}
                onChange={(e) => setNewWarrantyClaim({ ...newWarrantyClaim, issueDescription: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWarrantyDialogOpen(false)}>Cancel</Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]"
              onClick={createWarrantyClaim}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit Claim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* IMEI Detail Dialog */}
      <Dialog open={imeiDetailDialogOpen} onOpenChange={setImeiDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>IMEI Details</DialogTitle>
          </DialogHeader>
          {selectedIMEI && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-[#757575] mb-1">IMEI Number</p>
                <p className="text-xl font-mono font-bold">{formatIMEI(selectedIMEI.imei)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#757575]">Product</p>
                  <p className="font-medium">{selectedIMEI.productName}</p>
                </div>
                <div>
                  <p className="text-sm text-[#757575]">Status</p>
                  <Badge className={imeiStatusLabels[selectedIMEI.status].color}>
                    {imeiStatusLabels[selectedIMEI.status].label}
                  </Badge>
                </div>
                {selectedIMEI.modelNumber && (
                  <div>
                    <p className="text-sm text-[#757575]">Model</p>
                    <p className="font-medium">{selectedIMEI.modelNumber}</p>
                  </div>
                )}
                {selectedIMEI.color && (
                  <div>
                    <p className="text-sm text-[#757575]">Color/Storage</p>
                    <p className="font-medium">{selectedIMEI.color}{selectedIMEI.storageCapacity && ` • ${selectedIMEI.storageCapacity}`}</p>
                  </div>
                )}
                {selectedIMEI.warrantyEndDate && (
                  <div>
                    <p className="text-sm text-[#757575]">Warranty</p>
                    <p className={`font-medium ${new Date(selectedIMEI.warrantyEndDate) > new Date() ? 'text-green-600' : 'text-red-600'}`}>
                      {new Date(selectedIMEI.warrantyEndDate) > new Date() ? 'Active' : 'Expired'} - {selectedIMEI.warrantyEndDate}
                    </p>
                  </div>
                )}
                {selectedIMEI.customerName && (
                  <div>
                    <p className="text-sm text-[#757575]">Customer</p>
                    <p className="font-medium">{selectedIMEI.customerName}</p>
                  </div>
                )}
                {selectedIMEI.saleDate && (
                  <div>
                    <p className="text-sm text-[#757575]">Sale Date</p>
                    <p className="font-medium">{selectedIMEI.saleDate}</p>
                  </div>
                )}
              </div>
              {selectedIMEI.ricaRegistered && (
                <div className="bg-green-50 rounded-lg p-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-700">RICA Registered</p>
                    <p className="text-xs text-green-600">Ref: {selectedIMEI.ricaReference}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setImeiDetailDialogOpen(false)}>Close</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
