'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  Wrench,
  Building2,
  Users,
  Coins,
  Percent,
  Package,
  Truck,
  FileText,
  Plus,
  Calculator,
  CreditCard,
  Settings,
  Search,
  Eye,
  Edit,
  Trash2,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  FileBarChart,
  X,
  Printer,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react'

// Types
interface Contractor {
  id: string
  companyName: string
  contactPerson: string
  phone: string
  email: string
  businessType: 'sole_proprietor' | 'cc' | 'pty_ltd'
  registrationNumber: string
  vatNumber?: string
  creditLimit: number
  creditUsed: number
  paymentTerms: 'cod' | 'net7' | 'net15' | 'net30' | 'net60'
  discountLevel: number
  status: 'active' | 'suspended' | 'closed'
  totalPurchases: number
  address: {
    street: string
    city: string
    province: string
    postalCode: string
  }
  createdAt: string
  lastPurchase?: string
}

interface BulkPricingTier {
  id: string
  name: string
  productCategory: string
  productId?: string
  productName?: string
  minQuantity: number
  maxQuantity: number | null
  discountType: 'percentage' | 'fixed'
  discountValue: number
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

interface ContractorOrder {
  id: string
  orderNumber: string
  contractorId: string
  contractorName: string
  items: OrderItem[]
  subtotal: number
  discount: number
  discountPercent: number
  tax: number
  total: number
  status: 'pending' | 'confirmed' | 'processing' | 'ready' | 'delivered' | 'cancelled'
  orderDate: string
  deliveryDate?: string
  notes?: string
  createdBy: string
}

interface OrderItem {
  id: string
  sku: string
  name: string
  quantity: number
  unitPrice: number
  discount: number
  total: number
}

interface CreditHistoryEntry {
  id: string
  contractorId: string
  type: 'set_limit' | 'increase_used' | 'decrease_used' | 'payment' | 'purchase'
  amount: number
  previousValue: number
  newValue: number
  description: string
  createdAt: string
  createdBy: string
}

// Sample data
const sampleContractors: Contractor[] = [
  {
    id: 'con1',
    companyName: 'BuildRight Construction',
    contactPerson: 'John Mokoena',
    phone: '+27 82 123 4567',
    email: 'john@buildright.co.za',
    businessType: 'pty_ltd',
    registrationNumber: '2023/123456/07',
    vatNumber: '4567890123',
    creditLimit: 150000,
    creditUsed: 45000,
    paymentTerms: 'net30',
    discountLevel: 12,
    status: 'active',
    totalPurchases: 2450000,
    address: {
      street: '123 Construction Ave',
      city: 'Johannesburg',
      province: 'Gauteng',
      postalCode: '2001'
    },
    createdAt: '2023-06-15',
    lastPurchase: '2026-02-18'
  },
  {
    id: 'con2',
    companyName: 'Mthembu Plumbing Services',
    contactPerson: 'Sipho Mthembu',
    phone: '+27 83 234 5678',
    email: 'sipho@mthembuplumbing.co.za',
    businessType: 'cc',
    registrationNumber: 'CK 2022/456789/23',
    creditLimit: 50000,
    creditUsed: 32000,
    paymentTerms: 'net15',
    discountLevel: 8,
    status: 'active',
    totalPurchases: 890000,
    address: {
      street: '45 Pipe Street',
      city: 'Durban',
      province: 'KwaZulu-Natal',
      postalCode: '4001'
    },
    createdAt: '2023-09-20',
    lastPurchase: '2026-02-17'
  },
  {
    id: 'con3',
    companyName: 'Van Der Berg Electrical',
    contactPerson: 'Pieter van der Berg',
    phone: '+27 84 345 6789',
    email: 'pieter@vdbelectrical.co.za',
    businessType: 'sole_proprietor',
    registrationNumber: '2021/789012/07',
    creditLimit: 30000,
    creditUsed: 28500,
    paymentTerms: 'net7',
    discountLevel: 5,
    status: 'active',
    totalPurchases: 456000,
    address: {
      street: '78 Spark Road',
      city: 'Pretoria',
      province: 'Gauteng',
      postalCode: '0001'
    },
    createdAt: '2024-01-10',
    lastPurchase: '2026-02-15'
  },
  {
    id: 'con4',
    companyName: 'Nkosi Building Supplies',
    contactPerson: 'Nomsa Nkosi',
    phone: '+27 72 456 7890',
    email: 'nomsa@nkosibuilding.co.za',
    businessType: 'pty_ltd',
    registrationNumber: '2022/234567/07',
    vatNumber: '7890123456',
    creditLimit: 200000,
    creditUsed: 180000,
    paymentTerms: 'net60',
    discountLevel: 15,
    status: 'active',
    totalPurchases: 5670000,
    address: {
      street: '12 Builder Boulevard',
      city: 'Cape Town',
      province: 'Western Cape',
      postalCode: '8001'
    },
    createdAt: '2022-11-05',
    lastPurchase: '2026-02-19'
  },
  {
    id: 'con5',
    companyName: 'QuickFix Maintenance',
    contactPerson: 'David Pretorius',
    phone: '+27 76 567 8901',
    email: 'david@quickfix.co.za',
    businessType: 'cc',
    registrationNumber: 'CK 2023/890123/23',
    creditLimit: 25000,
    creditUsed: 25000,
    paymentTerms: 'cod',
    discountLevel: 3,
    status: 'suspended',
    totalPurchases: 123000,
    address: {
      street: '34 Fixit Lane',
      city: 'Bloemfontein',
      province: 'Free State',
      postalCode: '9301'
    },
    createdAt: '2024-06-22',
    lastPurchase: '2025-12-10'
  }
]

const sampleBulkPricing: BulkPricingTier[] = [
  {
    id: 'bp1',
    name: 'Cement Bulk Discount',
    productCategory: 'Building Materials',
    minQuantity: 50,
    maxQuantity: 99,
    discountType: 'percentage',
    discountValue: 8,
    status: 'active',
    createdAt: '2025-10-15',
    updatedAt: '2026-01-20'
  },
  {
    id: 'bp2',
    name: 'Cement Large Order',
    productCategory: 'Building Materials',
    minQuantity: 100,
    maxQuantity: null,
    discountType: 'percentage',
    discountValue: 12,
    status: 'active',
    createdAt: '2025-10-15',
    updatedAt: '2026-01-20'
  },
  {
    id: 'bp3',
    name: 'Paint Contractor Special',
    productCategory: 'Paint & Finishes',
    minQuantity: 20,
    maxQuantity: 49,
    discountType: 'percentage',
    discountValue: 10,
    status: 'active',
    createdAt: '2025-11-01',
    updatedAt: '2025-11-01'
  },
  {
    id: 'bp4',
    name: 'Paint Bulk Order',
    productCategory: 'Paint & Finishes',
    minQuantity: 50,
    maxQuantity: null,
    discountType: 'percentage',
    discountValue: 15,
    status: 'active',
    createdAt: '2025-11-01',
    updatedAt: '2025-11-01'
  },
  {
    id: 'bp5',
    name: 'Piping Fixed Price',
    productCategory: 'Plumbing',
    productId: 'prod123',
    productName: 'PVC Pipe 110mm x 6m',
    minQuantity: 10,
    maxQuantity: null,
    discountType: 'fixed',
    discountValue: 89.99,
    status: 'active',
    createdAt: '2025-12-10',
    updatedAt: '2025-12-10'
  },
  {
    id: 'bp6',
    name: 'Electrical Cable Discount',
    productCategory: 'Electrical',
    minQuantity: 100,
    maxQuantity: 499,
    discountType: 'percentage',
    discountValue: 5,
    status: 'active',
    createdAt: '2026-01-05',
    updatedAt: '2026-01-05'
  },
  {
    id: 'bp7',
    name: 'Cable Mega Discount',
    productCategory: 'Electrical',
    minQuantity: 500,
    maxQuantity: null,
    discountType: 'percentage',
    discountValue: 10,
    status: 'active',
    createdAt: '2026-01-05',
    updatedAt: '2026-01-05'
  },
  {
    id: 'bp8',
    name: 'Roofing Special',
    productCategory: 'Roofing',
    minQuantity: 50,
    maxQuantity: null,
    discountType: 'percentage',
    discountValue: 7,
    status: 'inactive',
    createdAt: '2025-09-20',
    updatedAt: '2026-02-01'
  }
]

const sampleOrders: ContractorOrder[] = [
  {
    id: 'ord1',
    orderNumber: 'ORD-2026-0145',
    contractorId: 'con4',
    contractorName: 'Nkosi Building Supplies',
    items: [
      { id: 'i1', sku: 'CEM-50', name: 'Portland Cement 50kg', quantity: 100, unitPrice: 95, discount: 12, total: 8360 },
      { id: 'i2', sku: 'SAND-1T', name: 'Building Sand 1 Ton', quantity: 5, unitPrice: 450, discount: 0, total: 2250 }
    ],
    subtotal: 11750,
    discount: 1140,
    discountPercent: 12,
    tax: 1591.50,
    total: 12201.50,
    status: 'processing',
    orderDate: '2026-02-19',
    createdBy: 'Thandi Ndlovu'
  },
  {
    id: 'ord2',
    orderNumber: 'ORD-2026-0144',
    contractorId: 'con1',
    contractorName: 'BuildRight Construction',
    items: [
      { id: 'i3', sku: 'PAINT-20L', name: 'White Wall Paint 20L', quantity: 25, unitPrice: 890, discount: 15, total: 18912.50 },
      { id: 'i4', sku: 'PRIMER-20L', name: 'Primer 20L', quantity: 10, unitPrice: 650, discount: 10, total: 5850 }
    ],
    subtotal: 28750,
    discount: 3987.50,
    discountPercent: 13.87,
    tax: 3714.38,
    total: 28476.88,
    status: 'ready',
    orderDate: '2026-02-18',
    createdBy: 'Thandi Ndlovu'
  },
  {
    id: 'ord3',
    orderNumber: 'ORD-2026-0143',
    contractorId: 'con2',
    contractorName: 'Mthembu Plumbing Services',
    items: [
      { id: 'i5', sku: 'PVC-110', name: 'PVC Pipe 110mm x 6m', quantity: 20, unitPrice: 99.99, discount: 10, total: 1799.82 }
    ],
    subtotal: 1999.80,
    discount: 199.98,
    discountPercent: 10,
    tax: 269.97,
    total: 2069.79,
    status: 'delivered',
    orderDate: '2026-02-17',
    deliveryDate: '2026-02-18',
    createdBy: 'System'
  },
  {
    id: 'ord4',
    orderNumber: 'ORD-2026-0142',
    contractorId: 'con1',
    contractorName: 'BuildRight Construction',
    items: [
      { id: 'i6', sku: 'BRICK-STD', name: 'Standard Brick', quantity: 5000, unitPrice: 2.50, discount: 5, total: 11875 },
      { id: 'i7', sku: 'CEM-50', name: 'Portland Cement 50kg', quantity: 200, unitPrice: 95, discount: 12, total: 16720 }
    ],
    subtotal: 28750,
    discount: 2155,
    discountPercent: 7.5,
    tax: 3989.25,
    total: 30584.25,
    status: 'confirmed',
    orderDate: '2026-02-16',
    createdBy: 'Thandi Ndlovu'
  },
  {
    id: 'ord5',
    orderNumber: 'ORD-2026-0141',
    contractorId: 'con3',
    contractorName: 'Van Der Berg Electrical',
    items: [
      { id: 'i8', sku: 'CABLE-4MM', name: 'Electrical Cable 4mm (100m)', quantity: 10, unitPrice: 850, discount: 5, total: 8075 }
    ],
    subtotal: 8500,
    discount: 425,
    discountPercent: 5,
    tax: 1211.25,
    total: 9286.25,
    status: 'pending',
    orderDate: '2026-02-19',
    createdBy: 'System'
  },
  {
    id: 'ord6',
    orderNumber: 'ORD-2026-0140',
    contractorId: 'con4',
    contractorName: 'Nkosi Building Supplies',
    items: [
      { id: 'i9', sku: 'ROOF-SHEET', name: 'Roofing Sheet 3m', quantity: 50, unitPrice: 285, discount: 7, total: 13247.50 }
    ],
    subtotal: 14250,
    discount: 1002.50,
    discountPercent: 7,
    tax: 1987.13,
    total: 15234.63,
    status: 'delivered',
    orderDate: '2026-02-15',
    deliveryDate: '2026-02-16',
    createdBy: 'Thandi Ndlovu'
  },
  {
    id: 'ord7',
    orderNumber: 'ORD-2026-0138',
    contractorId: 'con2',
    contractorName: 'Mthembu Plumbing Services',
    items: [
      { id: 'i10', sku: 'GYSER-150', name: 'Geyser 150L', quantity: 2, unitPrice: 4500, discount: 0, total: 9000 },
      { id: 'i11', sku: 'VALVE-SET', name: 'Valve Set Complete', quantity: 4, unitPrice: 350, discount: 0, total: 1400 }
    ],
    subtotal: 10400,
    discount: 0,
    discountPercent: 0,
    tax: 1560,
    total: 11960,
    status: 'cancelled',
    orderDate: '2026-02-14',
    notes: 'Cancelled by customer request',
    createdBy: 'System'
  }
]

const sampleCreditHistory: CreditHistoryEntry[] = [
  {
    id: 'ch1',
    contractorId: 'con1',
    type: 'purchase',
    amount: 15000,
    previousValue: 30000,
    newValue: 45000,
    description: 'Order ORD-2026-0142',
    createdAt: '2026-02-18T14:30:00',
    createdBy: 'System'
  },
  {
    id: 'ch2',
    contractorId: 'con1',
    type: 'payment',
    amount: 25000,
    previousValue: 55000,
    newValue: 30000,
    description: 'EFT Payment - Ref: EFT123456',
    createdAt: '2026-02-15T09:15:00',
    createdBy: 'Jane Smith'
  },
  {
    id: 'ch3',
    contractorId: 'con1',
    type: 'set_limit',
    amount: 150000,
    previousValue: 100000,
    newValue: 150000,
    description: 'Credit limit increase approved',
    createdAt: '2026-01-20T11:00:00',
    createdBy: 'Credit Manager'
  }
]

const productCategories = [
  'Building Materials',
  'Paint & Finishes',
  'Plumbing',
  'Electrical',
  'Roofing',
  'Tools & Equipment',
  'Hardware & Fixings',
  'Timber & Board',
  'Adhesives & Sealants',
  'Safety Equipment'
]

const businessTypeLabels: Record<string, string> = {
  sole_proprietor: 'Sole Proprietor',
  cc: 'Close Corporation',
  pty_ltd: 'Pty Ltd'
}

const paymentTermsLabels: Record<string, string> = {
  cod: 'COD',
  net7: 'Net 7',
  net15: 'Net 15',
  net30: 'Net 30',
  net60: 'Net 60'
}

export function HardwareBuildingView() {
  const [selectedTab, setSelectedTab] = useState('contractors')
  const [contractors, setContractors] = useState<Contractor[]>(sampleContractors)
  const [bulkPricing, setBulkPricing] = useState<BulkPricingTier[]>(sampleBulkPricing)
  const [orders, setOrders] = useState<ContractorOrder[]>(sampleOrders)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Dialog states
  const [addContractorOpen, setAddContractorOpen] = useState(false)
  const [creditManagementOpen, setCreditManagementOpen] = useState(false)
  const [addBulkPricingOpen, setAddBulkPricingOpen] = useState(false)
  const [orderDetailOpen, setOrderDetailOpen] = useState(false)
  const [contractorDetailOpen, setContractorDetailOpen] = useState(false)
  
  // Selected items
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<ContractorOrder | null>(null)
  const [selectedPricingTier, setSelectedPricingTier] = useState<BulkPricingTier | null>(null)
  
  // Form states
  const [newContractorForm, setNewContractorForm] = useState({
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    businessType: 'sole_proprietor' as 'sole_proprietor' | 'cc' | 'pty_ltd',
    registrationNumber: '',
    vatNumber: '',
    creditLimit: 0,
    paymentTerms: 'cod' as 'cod' | 'net7' | 'net15' | 'net30' | 'net60',
    discountLevel: 0,
    address: {
      street: '',
      city: '',
      province: '',
      postalCode: ''
    }
  })
  
  const [creditAdjustmentForm, setCreditAdjustmentForm] = useState({
    action: 'set_limit' as 'set_limit' | 'increase_used' | 'decrease_used',
    amount: 0,
    description: ''
  })
  
  const [newBulkPricingForm, setNewBulkPricingForm] = useState({
    name: '',
    productCategory: '',
    productId: '',
    productName: '',
    minQuantity: 1,
    maxQuantity: null as number | null,
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0
  })

  // Stats
  const stats = useMemo(() => {
    const activeContractors = contractors.filter(c => c.status === 'active').length
    const totalCreditOutstanding = contractors.reduce((sum, c) => sum + c.creditUsed, 0)
    const activePricingTiers = bulkPricing.filter(t => t.status === 'active').length
    
    // Orders this month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const ordersThisMonth = orders.filter(o => 
      new Date(o.orderDate) >= startOfMonth
    ).length
    
    return {
      activeContractors,
      totalCreditOutstanding,
      activePricingTiers,
      ordersThisMonth
    }
  }, [contractors, bulkPricing, orders])

  // Helper functions
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700 border-green-200',
      suspended: 'bg-red-100 text-red-700 border-red-200',
      closed: 'bg-gray-100 text-gray-700 border-gray-200',
      pending: 'bg-gray-100 text-gray-700',
      confirmed: 'bg-blue-100 text-blue-700',
      processing: 'bg-amber-100 text-amber-700',
      ready: 'bg-purple-100 text-purple-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      inactive: 'bg-gray-100 text-gray-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getCreditUtilizationColor = (utilization: number) => {
    if (utilization < 50) return 'bg-green-500'
    if (utilization < 75) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const getCreditUtilizationTextColor = (utilization: number) => {
    if (utilization < 50) return 'text-green-600'
    if (utilization < 75) return 'text-amber-600'
    return 'text-red-600'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  // Handlers
  const handleAddContractor = () => {
    const newContractor: Contractor = {
      id: `con${Date.now()}`,
      ...newContractorForm,
      creditUsed: 0,
      status: 'active',
      totalPurchases: 0,
      createdAt: new Date().toISOString().split('T')[0]
    }
    setContractors(prev => [...prev, newContractor])
    setAddContractorOpen(false)
    setNewContractorForm({
      companyName: '',
      contactPerson: '',
      phone: '',
      email: '',
      businessType: 'sole_proprietor',
      registrationNumber: '',
      vatNumber: '',
      creditLimit: 0,
      paymentTerms: 'cod',
      discountLevel: 0,
      address: {
        street: '',
        city: '',
        province: '',
        postalCode: ''
      }
    })
  }

  const handleCreditAdjustment = () => {
    if (!selectedContractor) return
    
    setContractors(prev => prev.map(c => {
      if (c.id !== selectedContractor.id) return c
      
      let newCreditUsed = c.creditUsed
      let newCreditLimit = c.creditLimit
      
      switch (creditAdjustmentForm.action) {
        case 'set_limit':
          newCreditLimit = creditAdjustmentForm.amount
          break
        case 'increase_used':
          newCreditUsed = Math.min(c.creditUsed + creditAdjustmentForm.amount, c.creditLimit)
          break
        case 'decrease_used':
          newCreditUsed = Math.max(0, c.creditUsed - creditAdjustmentForm.amount)
          break
      }
      
      return {
        ...c,
        creditLimit: newCreditLimit,
        creditUsed: newCreditUsed
      }
    }))
    
    setCreditManagementOpen(false)
    setCreditAdjustmentForm({
      action: 'set_limit',
      amount: 0,
      description: ''
    })
  }

  const handleAddBulkPricing = () => {
    const newTier: BulkPricingTier = {
      id: `bp${Date.now()}`,
      ...newBulkPricingForm,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    }
    setBulkPricing(prev => [...prev, newTier])
    setAddBulkPricingOpen(false)
    setNewBulkPricingForm({
      name: '',
      productCategory: '',
      productId: '',
      productName: '',
      minQuantity: 1,
      maxQuantity: null,
      discountType: 'percentage',
      discountValue: 0
    })
  }

  const handleTogglePricingStatus = (tierId: string) => {
    setBulkPricing(prev => prev.map(t => 
      t.id === tierId 
        ? { ...t, status: t.status === 'active' ? 'inactive' : 'active', updatedAt: new Date().toISOString().split('T')[0] }
        : t
    ))
  }

  const handleDeletePricingTier = (tierId: string) => {
    setBulkPricing(prev => prev.filter(t => t.id !== tierId))
  }

  const handleUpdateOrderStatus = (orderId: string, status: ContractorOrder['status']) => {
    setOrders(prev => prev.map(o => 
      o.id === orderId 
        ? { 
            ...o, 
            status,
            deliveryDate: status === 'delivered' ? new Date().toISOString().split('T')[0] : o.deliveryDate
          } 
        : o
    ))
    setOrderDetailOpen(false)
  }

  // Filtered data
  const filteredContractors = useMemo(() => {
    if (!searchQuery) return contractors
    return contractors.filter(c => 
      c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
    )
  }, [contractors, searchQuery])

  const filteredOrders = useMemo(() => {
    return orders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
  }, [orders])

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
              <Wrench className="h-5 w-5 text-[#00897B]" />
              Hardware & Building
            </h1>
            <p className="text-sm text-[#757575]">Contractor accounts, bulk pricing, and orders</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-[#E0F2F1] border-[#00897B] text-[#00897B]">
              <Sparkles className="h-3 w-3 mr-1" />
              Vertical View
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1A1A1A]">{stats.activeContractors}</p>
                  <p className="text-xs text-[#757575]">Active Contractors</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1A1A1A]">{formatCurrency(stats.totalCreditOutstanding)}</p>
                  <p className="text-xs text-[#757575]">Credit Outstanding</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Percent className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1A1A1A]">{stats.activePricingTiers}</p>
                  <p className="text-xs text-[#757575]">Bulk Pricing Tiers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1A1A1A]">{stats.ordersThisMonth}</p>
                  <p className="text-xs text-[#757575]">Orders This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-200 px-6">
          <TabsList className="h-12 bg-transparent">
            <TabsTrigger value="contractors" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Building2 className="h-4 w-4 mr-2" />
              Contractors
            </TabsTrigger>
            <TabsTrigger value="bulkpricing" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Percent className="h-4 w-4 mr-2" />
              Bulk Pricing
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Package className="h-4 w-4 mr-2" />
              Orders
              {orders.filter(o => o.status === 'pending').length > 0 && (
                <Badge className="ml-2 bg-amber-100 text-amber-700 text-[10px]">
                  {orders.filter(o => o.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Contractors Tab */}
        <TabsContent value="contractors" className="flex-1 m-0 overflow-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search contractors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => setAddContractorOpen(true)} className="bg-[#00897B] hover:bg-[#00695C]">
              <Plus className="h-4 w-4 mr-2" />
              Add Contractor
            </Button>
          </div>

          <div className="space-y-4">
            {filteredContractors.map(contractor => {
              const creditAvailable = contractor.creditLimit - contractor.creditUsed
              const utilization = contractor.creditLimit > 0 
                ? (contractor.creditUsed / contractor.creditLimit) * 100 
                : 0
              
              return (
                <Card 
                  key={contractor.id}
                  className="cursor-pointer hover:border-[#00897B] transition-colors"
                  onClick={() => {
                    setSelectedContractor(contractor)
                    setContractorDetailOpen(true)
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12 bg-[#E0F2F1] text-[#00897B]">
                          <AvatarFallback className="bg-[#E0F2F1] text-[#00897B] font-bold">
                            {contractor.companyName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-[#1A1A1A]">{contractor.companyName}</h3>
                            <Badge className={getStatusColor(contractor.status)}>
                              {contractor.status}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {businessTypeLabels[contractor.businessType]}
                            </Badge>
                          </div>
                          <p className="text-sm text-[#757575] mb-1">{contractor.contactPerson}</p>
                          <div className="flex items-center gap-4 text-xs text-[#757575]">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {contractor.phone}
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {contractor.email}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Credit Status */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-[#757575] mb-1">Credit Status</p>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium">
                            {formatCurrency(contractor.creditUsed)} / {formatCurrency(contractor.creditLimit)}
                          </span>
                        </div>
                        <Progress 
                          value={utilization} 
                          className="h-2"
                        />
                        <div className="flex justify-between mt-1">
                          <span className={`text-xs ${getCreditUtilizationTextColor(utilization)}`}>
                            {utilization.toFixed(0)}% used
                          </span>
                          <span className="text-xs text-green-600">
                            {formatCurrency(creditAvailable)} available
                          </span>
                        </div>
                      </div>

                      {/* Payment Terms */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-[#757575] mb-1">Payment Terms</p>
                        <p className="text-lg font-bold text-[#1A1A1A]">{paymentTermsLabels[contractor.paymentTerms]}</p>
                        <p className="text-xs text-[#757575]">Discount: {contractor.discountLevel}%</p>
                      </div>

                      {/* Total Purchases */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-[#757575] mb-1">Total Purchases</p>
                        <p className="text-lg font-bold text-[#00897B]">{formatCurrency(contractor.totalPurchases)}</p>
                        {contractor.lastPurchase && (
                          <p className="text-xs text-[#757575]">Last: {contractor.lastPurchase}</p>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="flex flex-col gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedContractor(contractor)
                            setCreditManagementOpen(true)
                          }}
                        >
                          <CreditCard className="h-3 w-3 mr-1" />
                          Manage Credit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Create new order logic
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          New Order
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Bulk Pricing Tab */}
        <TabsContent value="bulkpricing" className="flex-1 m-0 overflow-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-[#757575]">
              {bulkPricing.filter(t => t.status === 'active').length} active pricing tiers
            </p>
            <Button onClick={() => setAddBulkPricingOpen(true)} className="bg-[#00897B] hover:bg-[#00695C]">
              <Plus className="h-4 w-4 mr-2" />
              Add Pricing Tier
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tier Name</TableHead>
                  <TableHead>Product/Category</TableHead>
                  <TableHead>Quantity Range</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bulkPricing.map(tier => (
                  <TableRow key={tier.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-[#1A1A1A]">{tier.name}</p>
                        <p className="text-xs text-[#757575]">{tier.productCategory}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {tier.productName ? (
                        <div>
                          <p className="text-sm">{tier.productName}</p>
                          <p className="text-xs text-[#757575]">Specific product</p>
                        </div>
                      ) : (
                        <Badge variant="outline">{tier.productCategory}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {tier.minQuantity} - {tier.maxQuantity || '∞'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={tier.discountType === 'percentage' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}>
                        {tier.discountType === 'percentage' 
                          ? `${tier.discountValue}% off`
                          : formatCurrency(tier.discountValue)
                        }
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleTogglePricingStatus(tier.id)}
                        className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                          tier.status === 'active' 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {tier.status}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setSelectedPricingTier(tier)
                            setNewBulkPricingForm({
                              name: tier.name,
                              productCategory: tier.productCategory,
                              productId: tier.productId || '',
                              productName: tier.productName || '',
                              minQuantity: tier.minQuantity,
                              maxQuantity: tier.maxQuantity,
                              discountType: tier.discountType,
                              discountValue: tier.discountValue
                            })
                            setAddBulkPricingOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeletePricingTier(tier.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="flex-1 m-0 overflow-auto p-6">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Contractor</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <span className="font-medium text-[#00897B]">{order.orderNumber}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{order.contractorName}</span>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(order.subtotal)}</TableCell>
                    <TableCell className="text-right">
                      {order.discount > 0 ? (
                        <span className="text-green-600">-{formatCurrency(order.discount)}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(order.tax)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(order.total)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-[#757575]">{order.orderDate}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setSelectedOrder(order)
                            setOrderDetailOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Contractor Dialog */}
      <Dialog open={addContractorOpen} onOpenChange={setAddContractorOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Contractor</DialogTitle>
            <DialogDescription>
              Create a new contractor account with credit facilities
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Company Information */}
            <div>
              <h4 className="text-sm font-medium text-[#1A1A1A] mb-3">Company Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-[#757575]">Company Name *</Label>
                  <Input
                    value={newContractorForm.companyName}
                    onChange={(e) => setNewContractorForm(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#757575]">Business Type *</Label>
                  <Select 
                    value={newContractorForm.businessType}
                    onValueChange={(value: 'sole_proprietor' | 'cc' | 'pty_ltd') => 
                      setNewContractorForm(prev => ({ ...prev, businessType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sole_proprietor">Sole Proprietor</SelectItem>
                      <SelectItem value="cc">Close Corporation</SelectItem>
                      <SelectItem value="pty_ltd">Pty Ltd</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-[#757575]">Registration Number *</Label>
                  <Input
                    value={newContractorForm.registrationNumber}
                    onChange={(e) => setNewContractorForm(prev => ({ ...prev, registrationNumber: e.target.value }))}
                    placeholder="e.g., 2023/123456/07"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#757575]">VAT Number (Optional)</Label>
                  <Input
                    value={newContractorForm.vatNumber}
                    onChange={(e) => setNewContractorForm(prev => ({ ...prev, vatNumber: e.target.value }))}
                    placeholder="e.g., 4567890123"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <div>
              <h4 className="text-sm font-medium text-[#1A1A1A] mb-3">Contact Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-[#757575]">Contact Person *</Label>
                  <Input
                    value={newContractorForm.contactPerson}
                    onChange={(e) => setNewContractorForm(prev => ({ ...prev, contactPerson: e.target.value }))}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#757575]">Phone *</Label>
                  <Input
                    value={newContractorForm.phone}
                    onChange={(e) => setNewContractorForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+27 XX XXX XXXX"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-[#757575]">Email *</Label>
                  <Input
                    type="email"
                    value={newContractorForm.email}
                    onChange={(e) => setNewContractorForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@company.co.za"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Address */}
            <div>
              <h4 className="text-sm font-medium text-[#1A1A1A] mb-3">Address</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-xs text-[#757575]">Street Address</Label>
                  <Input
                    value={newContractorForm.address.street}
                    onChange={(e) => setNewContractorForm(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, street: e.target.value }
                    }))}
                    placeholder="Street address"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#757575]">City</Label>
                  <Input
                    value={newContractorForm.address.city}
                    onChange={(e) => setNewContractorForm(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, city: e.target.value }
                    }))}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#757575]">Province</Label>
                  <Input
                    value={newContractorForm.address.province}
                    onChange={(e) => setNewContractorForm(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, province: e.target.value }
                    }))}
                    placeholder="Province"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#757575]">Postal Code</Label>
                  <Input
                    value={newContractorForm.address.postalCode}
                    onChange={(e) => setNewContractorForm(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, postalCode: e.target.value }
                    }))}
                    placeholder="Postal code"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Credit & Payment Settings */}
            <div>
              <h4 className="text-sm font-medium text-[#1A1A1A] mb-3">Credit & Payment Settings</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-[#757575]">Credit Limit</Label>
                  <Input
                    type="number"
                    value={newContractorForm.creditLimit}
                    onChange={(e) => setNewContractorForm(prev => ({ 
                      ...prev, 
                      creditLimit: parseFloat(e.target.value) || 0 
                    }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#757575]">Payment Terms</Label>
                  <Select 
                    value={newContractorForm.paymentTerms}
                    onValueChange={(value: 'cod' | 'net7' | 'net15' | 'net30' | 'net60') => 
                      setNewContractorForm(prev => ({ ...prev, paymentTerms: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cod">COD</SelectItem>
                      <SelectItem value="net7">Net 7</SelectItem>
                      <SelectItem value="net15">Net 15</SelectItem>
                      <SelectItem value="net30">Net 30</SelectItem>
                      <SelectItem value="net60">Net 60</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-[#757575]">Discount Level %</Label>
                  <Input
                    type="number"
                    value={newContractorForm.discountLevel}
                    onChange={(e) => setNewContractorForm(prev => ({ 
                      ...prev, 
                      discountLevel: parseFloat(e.target.value) || 0 
                    }))}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddContractorOpen(false)}>Cancel</Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]"
              disabled={!newContractorForm.companyName || !newContractorForm.contactPerson || !newContractorForm.phone}
              onClick={handleAddContractor}
            >
              Add Contractor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credit Management Dialog */}
      <Dialog open={creditManagementOpen} onOpenChange={setCreditManagementOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#00897B]" />
              Credit Management
            </DialogTitle>
            <DialogDescription>
              {selectedContractor?.companyName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedContractor && (
            <div className="space-y-6 py-4">
              {/* Current Credit Status */}
              <div className="p-4 bg-gradient-to-br from-[#00897B] to-[#4CAF50] rounded-xl text-white">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm opacity-80">Available Credit</p>
                    <p className="text-3xl font-bold">
                      {formatCurrency(selectedContractor.creditLimit - selectedContractor.creditUsed)}
                    </p>
                  </div>
                  <Badge className="bg-white/20 text-white">
                    {selectedContractor.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="opacity-80">Credit Limit</span>
                    <span>{formatCurrency(selectedContractor.creditLimit)}</span>
                  </div>
                  <Progress 
                    value={(selectedContractor.creditUsed / selectedContractor.creditLimit) * 100} 
                    className="h-2 bg-white/20"
                  />
                  <div className="flex justify-between text-sm">
                    <span className="opacity-80">Used</span>
                    <span>{formatCurrency(selectedContractor.creditUsed)}</span>
                  </div>
                </div>
              </div>

              {/* Credit Utilization Indicator */}
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-[#757575]">Utilization:</span>
                <span className={`text-lg font-bold ${getCreditUtilizationTextColor(
                  (selectedContractor.creditUsed / selectedContractor.creditLimit) * 100
                )}`}>
                  {((selectedContractor.creditUsed / selectedContractor.creditLimit) * 100).toFixed(1)}%
                </span>
              </div>

              <Separator />

              {/* Adjust Credit Form */}
              <div>
                <h4 className="text-sm font-medium text-[#1A1A1A] mb-3">Adjust Credit</h4>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-[#757575]">Action</Label>
                    <Select 
                      value={creditAdjustmentForm.action}
                      onValueChange={(value: 'set_limit' | 'increase_used' | 'decrease_used') => 
                        setCreditAdjustmentForm(prev => ({ ...prev, action: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="set_limit">Set Credit Limit</SelectItem>
                        <SelectItem value="increase_used">Increase Used (Add Purchase)</SelectItem>
                        <SelectItem value="decrease_used">Decrease Used (Record Payment)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-[#757575]">Amount (R)</Label>
                    <Input
                      type="number"
                      value={creditAdjustmentForm.amount}
                      onChange={(e) => setCreditAdjustmentForm(prev => ({ 
                        ...prev, 
                        amount: parseFloat(e.target.value) || 0 
                      }))}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-[#757575]">Description</Label>
                    <Input
                      value={creditAdjustmentForm.description}
                      onChange={(e) => setCreditAdjustmentForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Reason for adjustment"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Credit History */}
              <div>
                <h4 className="text-sm font-medium text-[#1A1A1A] mb-3">Recent History</h4>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {sampleCreditHistory
                      .filter(h => h.contractorId === selectedContractor.id)
                      .map(entry => (
                        <div key={entry.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                          <div className="flex items-center gap-2">
                            {entry.type === 'payment' && <ArrowDownRight className="h-4 w-4 text-green-600" />}
                            {entry.type === 'purchase' && <ArrowUpRight className="h-4 w-4 text-red-600" />}
                            {entry.type === 'set_limit' && <Settings className="h-4 w-4 text-blue-600" />}
                            <div>
                              <p className="font-medium">{entry.description}</p>
                              <p className="text-xs text-[#757575]">
                                {new Date(entry.createdAt).toLocaleDateString('en-ZA')}
                              </p>
                            </div>
                          </div>
                          <span className={entry.type === 'payment' ? 'text-green-600' : entry.type === 'purchase' ? 'text-red-600' : 'text-blue-600'}>
                            {formatCurrency(entry.amount)}
                          </span>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditManagementOpen(false)}>Cancel</Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]"
              disabled={creditAdjustmentForm.amount <= 0}
              onClick={handleCreditAdjustment}
            >
              Apply Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Bulk Pricing Dialog */}
      <Dialog open={addBulkPricingOpen} onOpenChange={setAddBulkPricingOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedPricingTier ? 'Edit Bulk Pricing Tier' : 'Add Bulk Pricing Tier'}</DialogTitle>
            <DialogDescription>
              Configure volume-based discounts for contractors
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-xs text-[#757575]">Tier Name *</Label>
              <Input
                value={newBulkPricingForm.name}
                onChange={(e) => setNewBulkPricingForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Cement Bulk Discount"
              />
            </div>

            <div>
              <Label className="text-xs text-[#757575]">Product Category *</Label>
              <Select 
                value={newBulkPricingForm.productCategory}
                onValueChange={(value) => setNewBulkPricingForm(prev => ({ ...prev, productCategory: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {productCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-[#757575]">Product (Optional)</Label>
              <Input
                value={newBulkPricingForm.productName}
                onChange={(e) => setNewBulkPricingForm(prev => ({ ...prev, productName: e.target.value }))}
                placeholder="Leave blank for category-wide discount"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-[#757575]">Min Quantity *</Label>
                <Input
                  type="number"
                  value={newBulkPricingForm.minQuantity}
                  onChange={(e) => setNewBulkPricingForm(prev => ({ 
                    ...prev, 
                    minQuantity: parseInt(e.target.value) || 1 
                  }))}
                  placeholder="1"
                />
              </div>
              <div>
                <Label className="text-xs text-[#757575]">Max Quantity (Optional)</Label>
                <Input
                  type="number"
                  value={newBulkPricingForm.maxQuantity || ''}
                  onChange={(e) => setNewBulkPricingForm(prev => ({ 
                    ...prev, 
                    maxQuantity: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                  placeholder="∞"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-[#757575]">Discount Type</Label>
                <Select 
                  value={newBulkPricingForm.discountType}
                  onValueChange={(value: 'percentage' | 'fixed') => 
                    setNewBulkPricingForm(prev => ({ ...prev, discountType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Price (R)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-[#757575]">
                  {newBulkPricingForm.discountType === 'percentage' ? 'Discount %' : 'Fixed Price (R)'}
                </Label>
                <Input
                  type="number"
                  value={newBulkPricingForm.discountValue}
                  onChange={(e) => setNewBulkPricingForm(prev => ({ 
                    ...prev, 
                    discountValue: parseFloat(e.target.value) || 0 
                  }))}
                  placeholder={newBulkPricingForm.discountType === 'percentage' ? '10' : '89.99'}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddBulkPricingOpen(false)
              setSelectedPricingTier(null)
              setNewBulkPricingForm({
                name: '',
                productCategory: '',
                productId: '',
                productName: '',
                minQuantity: 1,
                maxQuantity: null,
                discountType: 'percentage',
                discountValue: 0
              })
            }}>Cancel</Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]"
              disabled={!newBulkPricingForm.name || !newBulkPricingForm.productCategory}
              onClick={handleAddBulkPricing}
            >
              {selectedPricingTier ? 'Update Tier' : 'Add Tier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Detail Dialog */}
      <Dialog open={orderDetailOpen} onOpenChange={setOrderDetailOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedOrder?.orderNumber}
              {selectedOrder && (
                <Badge className={getStatusColor(selectedOrder.status)}>
                  {selectedOrder.status}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedOrder?.contractorName} • {selectedOrder?.orderDate}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4 py-4">
              {/* Order Items */}
              <div>
                <h4 className="text-sm font-medium text-[#1A1A1A] mb-2">Order Items</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>SKU</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Disc.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="text-right">{item.discount}%</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#757575]">Subtotal</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#757575]">Discount ({selectedOrder.discountPercent.toFixed(1)}%)</span>
                    <span className="text-green-600">-{formatCurrency(selectedOrder.discount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#757575]">VAT (15%)</span>
                    <span>{formatCurrency(selectedOrder.tax)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-[#00897B]">{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {/* Update Status */}
              {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                <div>
                  <h4 className="text-sm font-medium text-[#1A1A1A] mb-2">Update Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedOrder.status === 'pending' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'confirmed')}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Confirm
                      </Button>
                    )}
                    {selectedOrder.status === 'confirmed' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'processing')}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Start Processing
                      </Button>
                    )}
                    {selectedOrder.status === 'processing' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'ready')}
                      >
                        <Package className="h-3 w-3 mr-1" />
                        Ready for Pickup
                      </Button>
                    )}
                    {selectedOrder.status === 'ready' && (
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'delivered')}
                      >
                        <Truck className="h-3 w-3 mr-1" />
                        Mark Delivered
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'cancelled')}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel Order
                    </Button>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> {selectedOrder.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderDetailOpen(false)}>Close</Button>
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print Invoice
            </Button>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              View Statement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contractor Detail Dialog */}
      <Dialog open={contractorDetailOpen} onOpenChange={setContractorDetailOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedContractor?.companyName}
              {selectedContractor && (
                <Badge className={getStatusColor(selectedContractor.status)}>
                  {selectedContractor.status}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Contractor account details
            </DialogDescription>
          </DialogHeader>
          
          {selectedContractor && (
            <div className="space-y-6 py-4">
              {/* Contact & Business Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-[#1A1A1A] mb-3">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#757575]" />
                      <span>{selectedContractor.contactPerson}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[#757575]" />
                      <span>{selectedContractor.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-[#757575]" />
                      <span>{selectedContractor.email}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-[#757575] mt-0.5" />
                      <span>
                        {selectedContractor.address.street}<br />
                        {selectedContractor.address.city}, {selectedContractor.address.province} {selectedContractor.address.postalCode}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-[#1A1A1A] mb-3">Business Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#757575]">Type</span>
                      <span>{businessTypeLabels[selectedContractor.businessType]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#757575]">Reg. Number</span>
                      <span className="font-mono">{selectedContractor.registrationNumber}</span>
                    </div>
                    {selectedContractor.vatNumber && (
                      <div className="flex justify-between">
                        <span className="text-[#757575]">VAT Number</span>
                        <span className="font-mono">{selectedContractor.vatNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[#757575]">Payment Terms</span>
                      <span>{paymentTermsLabels[selectedContractor.paymentTerms]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#757575]">Discount Level</span>
                      <span className="text-[#00897B] font-medium">{selectedContractor.discountLevel}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Credit Status */}
              <div>
                <h4 className="text-sm font-medium text-[#1A1A1A] mb-3">Credit Status</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-[#757575] mb-1">Credit Limit</p>
                    <p className="text-lg font-bold text-[#1A1A1A]">{formatCurrency(selectedContractor.creditLimit)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-[#757575] mb-1">Credit Used</p>
                    <p className="text-lg font-bold text-amber-600">{formatCurrency(selectedContractor.creditUsed)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-[#757575] mb-1">Available</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(selectedContractor.creditLimit - selectedContractor.creditUsed)}</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#E0F2F1] rounded-lg p-3 text-center">
                  <p className="text-xs text-[#757575] mb-1">Total Purchases</p>
                  <p className="text-2xl font-bold text-[#00897B]">{formatCurrency(selectedContractor.totalPurchases)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-[#757575] mb-1">Last Purchase</p>
                  <p className="text-lg font-medium text-[#1A1A1A]">{selectedContractor.lastPurchase || 'Never'}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setContractorDetailOpen(false)}>Close</Button>
            <Button variant="outline" onClick={() => {
              setContractorDetailOpen(false)
              setCreditManagementOpen(true)
            }}>
              <CreditCard className="h-4 w-4 mr-2" />
              Manage Credit
            </Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">
              <FileBarChart className="h-4 w-4 mr-2" />
              View Statement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default HardwareBuildingView
