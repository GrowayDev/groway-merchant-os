'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import {
  Split,
  Users,
  User,
  DollarSign,
  Percent,
  CreditCard,
  Banknote,
  QrCode,
  Wallet,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  ShoppingCart,
  Receipt,
  ArrowRight,
  RefreshCw,
  Lock,
  Unlock,
  Search,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  MoreVertical,
  UserPlus,
  ClipboardList,
  AlertCircle,
  Loader2,
} from 'lucide-react'

// Constants
const MAX_SPLITS = 100
const SPLITS_PER_PAGE = 10
const VAT_RATE = 0.15

// Types
interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  unitPrice?: number
  totalPrice?: number
  category: string
  notes?: string
  menuItemId?: string
  station?: string
  modifiers?: string
  status?: string
}

interface SplitPortion {
  id: string
  name: string
  items: string[] // Item IDs
  subtotal: number
  tip: number
  tipPercent: number
  total: number
  paymentMethod?: 'cash' | 'card' | 'qr' | 'wallet' | 'mobile'
  paid: boolean
  paidAt?: Date
  paymentRef?: string
}

interface POSOrder {
  id: string
  orderNumber: string
  tableNumber?: string
  items: OrderItem[]
  subtotal: number
  taxAmount: number
  total: number
  paymentStatus: string
  paidAmount: number
  tipAmount: number
  status: string
}

interface BillSplittingViewProps {
  tableNumber?: string
  orderId?: string
  items?: OrderItem[]
  onComplete?: () => void
  onCancel?: () => void
  onBack?: () => void
}

const paymentMethods = [
  { id: 'cash', label: 'Cash', icon: Banknote, color: 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200' },
  { id: 'card', label: 'Card', icon: CreditCard, color: 'bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-200' },
  { id: 'qr', label: 'QR Pay', icon: QrCode, color: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200' },
  { id: 'wallet', label: 'Wallet', icon: Wallet, color: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200' },
  { id: 'mobile', label: 'Mobile', icon: Smartphone, color: 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200' },
]

// Import Smartphone icon
import { Smartphone } from 'lucide-react'

export function BillSplittingView({ 
  tableNumber: propTableNumber,
  orderId: propOrderId,
  items: externalItems,
  onComplete,
  onCancel,
  onBack
}: BillSplittingViewProps) {
  // State for fetching order
  const [order, setOrder] = useState<POSOrder | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  
  // Use props or fetched order data
  const tableNumber = propTableNumber || order?.tableNumber || '12'
  const orderId = propOrderId || order?.orderNumber || 'ORD-001'
  
  // Transform order items or use external items
  const items = useMemo(() => {
    if (externalItems && externalItems.length > 0) {
      return externalItems
    }
    if (order?.items && order.items.length > 0) {
      return order.items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.unitPrice || item.price,
        category: item.category || 'General',
        notes: item.notes,
      }))
    }
    return []
  }, [externalItems, order])

  // Split management state
  const [splits, setSplits] = useState<SplitPortion[]>([
    { id: 'split-1', name: 'Person 1', items: [], subtotal: 0, tip: 0, tipPercent: 0, total: 0, paid: false }
  ])
  
  const [activeSplit, setActiveSplit] = useState<string>('split-1')
  const [splitMode, setSplitMode] = useState<'equal' | 'items' | 'percentage' | 'custom'>('items')
  const [equalParts, setEqualParts] = useState(2)
  const [percentageInputs, setPercentageInputs] = useState<Record<string, number>>({})
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedSplitForPayment, setSelectedSplitForPayment] = useState<SplitPortion | null>(null)
  const [processingPayment, setProcessingPayment] = useState(false)
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')
  
  // Pagination for splits
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(splits.length / SPLITS_PER_PAGE)
  
  // Cash payment state
  const [cashTendered, setCashTendered] = useState<number>(0)
  
  // Staff PIN for payment
  const [staffPin, setStaffPin] = useState('')
  const [staffId, setStaffId] = useState<string | null>(null)
  
  // Fetch order on mount if orderId provided
  useEffect(() => {
    const fetchOrder = async () => {
      if (!propOrderId) return
      
      setIsLoading(true)
      setFetchError(null)
      
      try {
        const response = await fetch(`/merchant-os/api/pos/orders/${propOrderId}`)
        const data = await response.json()
        
        if (data.success) {
          setOrder(data.data)
          
          // Initialize splits from existing payments if any
          if (data.data.payments && data.data.payments.length > 0) {
            // Handle existing split payments
            const existingSplits = data.data.payments.map((payment: any, index: number) => ({
              id: `split-${payment.id || index}`,
              name: payment.splitIndex ? `Person ${payment.splitIndex + 1}` : `Payment ${index + 1}`,
              items: [],
              subtotal: payment.amount,
              tip: payment.tipAmount || 0,
              tipPercent: 0,
              total: payment.amount + (payment.tipAmount || 0),
              paid: payment.status === 'completed',
              paidAt: payment.processedAt ? new Date(payment.processedAt) : undefined,
              paymentMethod: payment.method,
              paymentRef: payment.id,
            }))
            
            if (existingSplits.length > 0) {
              setSplits(existingSplits)
            }
          }
        } else {
          setFetchError(data.error || 'Failed to load order')
        }
      } catch (error) {
        console.error('Error fetching order:', error)
        setFetchError('Failed to load order')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchOrder()
  }, [propOrderId])
  
  // Get staff info from session
  useEffect(() => {
    const sessionStr = localStorage.getItem('groway_session')
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr)
        setStaffId(session.userId)
      } catch (e) {
        console.error('Failed to parse session:', e)
      }
    }
  }, [])

  // Filter splits by search
  const filteredSplits = useMemo(() => {
    if (!searchQuery.trim()) return splits
    const query = searchQuery.toLowerCase()
    return splits.filter(split => 
      split.name.toLowerCase().includes(query) ||
      split.items.some(itemId => {
        const item = items.find(i => i.id === itemId)
        return item?.name.toLowerCase().includes(query)
      })
    )
  }, [splits, searchQuery, items])

  // Paginated splits
  const paginatedSplits = useMemo(() => {
    const start = (currentPage - 1) * SPLITS_PER_PAGE
    const end = start + SPLITS_PER_PAGE
    return filteredSplits.slice(start, end)
  }, [filteredSplits, currentPage])

  // Calculate totals
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + (item.price * item.quantity), 0), [items])
  const vat = subtotal * VAT_RATE
  const total = subtotal + vat
  const unpaidTotal = splits.filter(s => !s.paid).reduce((sum, s) => sum + s.total, 0)
  const paidSplits = splits.filter(s => s.paid).length
  const allPaid = splits.length > 0 && splits.every(s => s.paid)
  const partialPayment = splits.some(s => s.paid) && !allPaid

  // Get items not assigned to any split
  const unassignedItems = useMemo(() => {
    const assignedIds = new Set(splits.flatMap(s => s.items))
    return items.filter(item => !assignedIds.has(item.id))
  }, [items, splits])

  // Recalculate split totals when items change
  const recalculateSplitTotals = useCallback((splitsList: SplitPortion[]) => {
    return splitsList.map(split => {
      const splitItems = items.filter(item => split.items.includes(item.id))
      const splitSubtotal = splitItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const splitVat = splitSubtotal * VAT_RATE
      const splitSubtotalWithVat = splitSubtotal + splitVat
      const tipAmount = split.tipPercent > 0 ? splitSubtotalWithVat * (split.tipPercent / 100) : split.tip
      const splitTotal = splitSubtotalWithVat + tipAmount
      return { ...split, subtotal: splitSubtotalWithVat, tip: tipAmount, total: splitTotal }
    })
  }, [items])

  // Add item to split
  const addItemToSplit = useCallback((itemId: string, splitId: string) => {
    setSplits(prev => {
      // Remove from all splits first
      const cleaned = prev.map(s => ({
        ...s,
        items: s.items.filter(id => id !== itemId)
      }))
      // Add to target split
      const updated = cleaned.map(s => 
        s.id === splitId ? { ...s, items: [...s.items, itemId] } : s
      )
      return recalculateSplitTotals(updated)
    })
  }, [recalculateSplitTotals])

  // Remove item from split
  const removeItemFromSplit = useCallback((itemId: string, splitId: string) => {
    setSplits(prev => {
      const updated = prev.map(s => 
        s.id === splitId ? { ...s, items: s.items.filter(id => id !== itemId) } : s
      )
      return recalculateSplitTotals(updated)
    })
  }, [recalculateSplitTotals])

  // Add new split
  const addSplit = useCallback(() => {
    if (splits.length >= MAX_SPLITS) {
      toast.error(`Maximum ${MAX_SPLITS} splits allowed`)
      return
    }
    
    const newSplit: SplitPortion = {
      id: `split-${Date.now()}`,
      name: `Person ${splits.length + 1}`,
      items: [],
      subtotal: 0,
      tip: 0,
      tipPercent: 0,
      total: 0,
      paid: false
    }
    setSplits(prev => [...prev, newSplit])
    setActiveSplit(newSplit.id)
    
    // Adjust pagination to show new split
    const newPage = Math.ceil((splits.length + 1) / SPLITS_PER_PAGE)
    setCurrentPage(newPage)
    
    toast.success(`Added Person ${splits.length + 1}`)
  }, [splits.length])

  // Add multiple splits at once
  const addMultipleSplits = useCallback((count: number) => {
    if (splits.length + count > MAX_SPLITS) {
      toast.error(`Cannot add ${count} splits. Maximum ${MAX_SPLITS} allowed.`)
      return
    }
    
    const newSplits: SplitPortion[] = []
    for (let i = 0; i < count; i++) {
      newSplits.push({
        id: `split-${Date.now()}-${i}`,
        name: `Person ${splits.length + i + 1}`,
        items: [],
        subtotal: 0,
        tip: 0,
        tipPercent: 0,
        total: 0,
        paid: false
      })
    }
    
    setSplits(prev => [...prev, ...newSplits])
    const newPage = Math.ceil((splits.length + count) / SPLITS_PER_PAGE)
    setCurrentPage(newPage)
    
    toast.success(`Added ${count} splits`)
  }, [splits.length])

  // Remove split
  const removeSplit = useCallback((splitId: string) => {
    if (splits.length <= 1) {
      toast.error('Cannot remove the last split')
      return
    }
    
    const split = splits.find(s => s.id === splitId)
    if (split?.paid) {
      toast.error('Cannot remove a paid split')
      return
    }
    
    setSplits(prev => {
      const filtered = prev.filter(s => s.id !== splitId)
      return recalculateSplitTotals(filtered)
    })
    
    if (activeSplit === splitId) {
      setActiveSplit(splits[0].id)
    }
    
    // Adjust pagination
    const newTotalPages = Math.ceil((splits.length - 1) / SPLITS_PER_PAGE)
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages)
    }
  }, [splits, activeSplit, currentPage, recalculateSplitTotals])

  // Rename split
  const renameSplit = useCallback((splitId: string, name: string) => {
    setSplits(prev => prev.map(s => s.id === splitId ? { ...s, name } : s))
  }, [])

  // Split equally
  const splitEqually = useCallback(() => {
    if (equalParts > MAX_SPLITS) {
      toast.error(`Maximum ${MAX_SPLITS} splits allowed`)
      return
    }
    
    if (equalParts < 1) {
      toast.error('At least 1 split required')
      return
    }
    
    const perPerson = total / equalParts
    const newSplits: SplitPortion[] = []
    
    for (let i = 0; i < equalParts; i++) {
      newSplits.push({
        id: `split-${Date.now()}-${i}`,
        name: `Person ${i + 1}`,
        items: [],
        subtotal: perPerson,
        tip: 0,
        tipPercent: 0,
        total: perPerson,
        paid: false
      })
    }
    
    // Distribute items as evenly as possible
    items.forEach((item, index) => {
      const splitIndex = index % equalParts
      newSplits[splitIndex].items.push(item.id)
    })
    
    setSplits(newSplits)
    setCurrentPage(1)
    toast.success(`Split bill into ${equalParts} equal parts`)
  }, [equalParts, total, items])

  // Split by percentage
  const splitByPercentage = useCallback(() => {
    const totalPercentage = Object.values(percentageInputs).reduce((sum, p) => sum + p, 0)
    
    if (Math.abs(totalPercentage - 100) > 0.1) {
      toast.error('Percentages must add up to 100%')
      return
    }
    
    const newSplits = splits.map((split) => {
      const percentage = percentageInputs[split.id] || 0
      const splitTotal = (total * percentage) / 100
      return {
        ...split,
        subtotal: splitTotal,
        tip: 0,
        tipPercent: 0,
        total: splitTotal,
        items: []
      }
    })
    
    setSplits(newSplits)
    toast.success('Split by percentage applied')
  }, [percentageInputs, splits, total])

  // Auto-assign items by category
  const autoAssignItems = useCallback(() => {
    if (splits.length === 0) return
    
    const categories = [...new Set(items.map(i => i.category))]
    const newSplits = splits.map((split) => ({
      ...split,
      items: [] as string[]
    }))
    
    categories.forEach((category, catIndex) => {
      const categoryItems = items.filter(i => i.category === category)
      const targetSplit = catIndex % newSplits.length
      categoryItems.forEach(item => {
        newSplits[targetSplit].items.push(item.id)
      })
    })
    
    setSplits(recalculateSplitTotals(newSplits))
    toast.success('Items auto-assigned by category')
  }, [items, splits, recalculateSplitTotals])

  // Bulk assign unassigned items
  const bulkAssignUnassigned = useCallback(() => {
    const unpaidSplits = splits.filter(s => !s.paid)
    if (unpaidSplits.length === 0) {
      toast.error('No unpaid splits to assign to')
      return
    }
    
    const newSplits = splits.map(s => ({ ...s }))
    
    unassignedItems.forEach((item, index) => {
      const targetSplit = unpaidSplits[index % unpaidSplits.length]
      const split = newSplits.find(s => s.id === targetSplit.id)
      if (split && !split.items.includes(item.id)) {
        split.items.push(item.id)
      }
    })
    
    setSplits(recalculateSplitTotals(newSplits))
    toast.success(`${unassignedItems.length} items distributed`)
  }, [splits, unassignedItems, recalculateSplitTotals])

  // Assign all items to one split
  const assignAllToSplit = useCallback((splitId: string) => {
    const split = splits.find(s => s.id === splitId)
    if (!split || split.paid) return
    
    setSplits(prev => {
      const updated = prev.map(s => {
        if (s.id === splitId) {
          return { ...s, items: items.map(i => i.id) }
        }
        return { ...s, items: [] }
      })
      return recalculateSplitTotals(updated)
    })
    toast.success('All items assigned to ' + split.name)
  }, [splits, items, recalculateSplitTotals])

  // Add tip to split
  const addTip = useCallback((splitId: string, percent: number) => {
    setSplits(prev => prev.map(s => {
      if (s.id === splitId) {
        const tip = (s.subtotal * percent) / 100
        return { ...s, tip, tipPercent: percent, total: s.subtotal + tip }
      }
      return s
    }))
  }, [])

  // Process payment via API
  const processPayment = useCallback(async (split: SplitPortion, method: 'cash' | 'card' | 'qr' | 'wallet' | 'mobile') => {
    if (!staffId) {
      toast.error('Staff ID not found. Please log in again.')
      return
    }
    
    if (!propOrderId && !order?.id) {
      toast.error('Order ID not found')
      return
    }
    
    setProcessingPayment(true)
    
    try {
      const paymentData: any = {
        orderId: propOrderId || order?.id,
        amount: split.subtotal,
        method: method,
        tipAmount: split.tip,
        processedBy: staffId,
        pin: staffPin || '0000', // Default PIN for demo
        splitIndex: splits.indexOf(split),
        notes: `Split payment for ${split.name}`,
      }
      
      if (method === 'cash') {
        paymentData.cashTendered = cashTendered || split.total
        paymentData.changeGiven = Math.max(0, (cashTendered || split.total) - split.total)
      }
      
      const response = await fetch('/merchant-os/api/pos/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Update split as paid
        setSplits(prev => prev.map(s => 
          s.id === split.id ? { 
            ...s, 
            paid: true, 
            paymentMethod: method, 
            paidAt: new Date(),
            paymentRef: data.data.id 
          } : s
        ))
        
        setPaymentDialogOpen(false)
        setSelectedSplitForPayment(null)
        setCashTendered(0)
        setStaffPin('')
        
        toast.success(`Payment of R${split.total.toFixed(2)} received via ${method}`)
        
        // Check if all splits are paid
        const updatedSplits = splits.map(s => 
          s.id === split.id ? { ...s, paid: true } : s
        )
        
        if (updatedSplits.every(s => s.paid)) {
          toast.success('All payments complete!')
          // Refresh order to get updated status
          if (propOrderId) {
            const orderResponse = await fetch(`/merchant-os/api/pos/orders/${propOrderId}`)
            const orderData = await orderResponse.json()
            if (orderData.success) {
              setOrder(orderData.data)
            }
          }
        }
      } else {
        toast.error(data.error || 'Payment failed')
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Failed to process payment')
    } finally {
      setProcessingPayment(false)
    }
  }, [staffId, propOrderId, order, staffPin, splits, cashTendered])

  // Reset splits
  const resetSplits = useCallback(() => {
    // Check if any splits are paid
    const paidCount = splits.filter(s => s.paid).length
    if (paidCount > 0) {
      toast.error(`Cannot reset: ${paidCount} splits already paid`)
      return
    }
    
    setSplits([
      { id: 'split-1', name: 'Person 1', items: [], subtotal: 0, tip: 0, tipPercent: 0, total: 0, paid: false }
    ])
    setActiveSplit('split-1')
    setPercentageInputs({})
    setCurrentPage(1)
    setSearchQuery('')
    toast.success('Splits reset')
  }, [splits])

  const activeSplitData = splits.find(s => s.id === activeSplit)

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#FAFAFA]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#00897B]" />
          <p className="text-[#757575]">Loading order...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (fetchError && !externalItems?.length) {
    return (
      <div className="h-full flex items-center justify-center bg-[#FAFAFA]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <p className="text-[#1A1A1A] font-medium mb-2">Failed to load order</p>
          <p className="text-[#757575] text-sm mb-4">{fetchError}</p>
          <Button onClick={onCancel || onBack} variant="outline">Go Back</Button>
        </div>
      </div>
    )
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-[#FAFAFA]">
        <div className="text-center">
          <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-[#1A1A1A] font-medium mb-2">No items to split</p>
          <p className="text-[#757575] text-sm mb-4">Add items to the order first</p>
          <Button onClick={onCancel || onBack} variant="outline">Go Back</Button>
        </div>
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
              <Split className="h-5 w-5 text-[#00897B]" />
              Bill Splitting
            </h1>
            <p className="text-sm text-[#757575]">
              Table {tableNumber} · {orderId} · {items.length} items
              {splits.length > SPLITS_PER_PAGE && ` · ${splits.length} splits`}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={resetSplits} disabled={splits.some(s => s.paid)}>
              <RefreshCw className="h-4 w-4 mr-1" />Reset
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={autoAssignItems}>
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Auto-assign by category
                </DropdownMenuItem>
                <DropdownMenuItem onClick={bulkAssignUnassigned} disabled={unassignedItems.length === 0}>
                  <Users className="h-4 w-4 mr-2" />
                  Distribute unassigned ({unassignedItems.length})
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => addMultipleSplits(5)} disabled={splits.length + 5 > MAX_SPLITS}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add 5 splits
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addMultipleSplits(10)} disabled={splits.length + 10 > MAX_SPLITS}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add 10 splits
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {allPaid ? (
              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={onComplete}>
                <CheckCircle2 className="h-4 w-4 mr-1" />Complete
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={onCancel || onBack}>
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-5 gap-3">
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-[#1A1A1A]">R{subtotal.toFixed(2)}</p>
            <p className="text-[10px] text-[#757575]">Subtotal</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-[#1A1A1A]">R{vat.toFixed(2)}</p>
            <p className="text-[10px] text-[#757575]">VAT (15%)</p>
          </div>
          <div className="bg-[#E0F2F1] rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-[#00897B]">R{total.toFixed(2)}</p>
            <p className="text-[10px] text-[#757575]">Total</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-amber-600">R{unpaidTotal.toFixed(2)}</p>
            <p className="text-[10px] text-[#757575]">Unpaid</p>
          </div>
          <div className={`rounded-lg p-2 text-center ${allPaid ? 'bg-green-50' : partialPayment ? 'bg-amber-50' : 'bg-gray-50'}`}>
            <p className={`text-xl font-bold ${allPaid ? 'text-green-600' : partialPayment ? 'text-amber-600' : 'text-[#1A1A1A]'}`}>
              {paidSplits}/{splits.length}
            </p>
            <p className="text-[10px] text-[#757575]">Paid</p>
          </div>
        </div>
        
        {/* Progress bar for many splits */}
        {splits.length > SPLITS_PER_PAGE && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-[#757575] mb-1">
              <span>Payment Progress</span>
              <span>{paidSplits} of {splits.length} paid</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${(paidSplits / splits.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel - Splits */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-[#757575]">SPLITS ({splits.length}/{MAX_SPLITS})</p>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0"
                  onClick={() => setViewMode(viewMode === 'cards' ? 'list' : 'cards')}
                >
                  {viewMode === 'cards' ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm" className="h-7" onClick={addSplit} disabled={splits.length >= MAX_SPLITS}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
              <Input
                placeholder="Search splits..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1) // Reset to first page on search
                }}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {paginatedSplits.map((split) => (
                <Card 
                  key={split.id}
                  className={`cursor-pointer transition-all ${
                    activeSplit === split.id ? 'border-[#00897B] border-2' : 'border-gray-200'
                  } ${split.paid ? 'bg-green-50' : ''}`}
                  onClick={() => setActiveSplit(split.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Input
                        value={split.name}
                        onChange={(e) => renameSplit(split.id, e.target.value)}
                        className="h-7 text-sm font-medium border-none p-0 focus-visible:ring-0 bg-transparent"
                        disabled={split.paid}
                      />
                      <div className="flex items-center gap-1">
                        {split.paid && (
                          <Badge className="bg-green-600 text-white text-[10px]">
                            <CheckCircle2 className="h-3 w-3 mr-1" />Paid
                          </Badge>
                        )}
                        {!split.paid && splits.length > 1 && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-red-400 hover:text-red-600"
                            onClick={(e) => { e.stopPropagation(); removeSplit(split.id) }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-sm text-[#757575] mb-2">
                      {split.items.length} items
                      {split.tip > 0 && <span className="text-green-600 ml-2">+R{split.tip.toFixed(2)} tip</span>}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <p className="text-lg font-bold">R{split.total.toFixed(2)}</p>
                      
                      {!split.paid && (
                        <Button 
                          size="sm" 
                          className="bg-[#00897B] hover:bg-[#00695C]"
                          onClick={(e) => { 
                            e.stopPropagation()
                            setSelectedSplitForPayment(split)
                            setPaymentDialogOpen(true)
                          }}
                        >
                          Pay
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-gray-200 flex items-center justify-between">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-[#757575]">
                Page {currentPage} of {totalPages}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Quick Split Options */}
          <div className="p-3 border-t border-gray-200">
            <p className="text-xs font-medium text-[#757575] mb-2">QUICK SPLIT</p>
            <div className="flex gap-2 mb-2">
              <Button 
                variant={splitMode === 'equal' ? 'default' : 'outline'} 
                size="sm" 
                className="flex-1"
                onClick={() => setSplitMode('equal')}
              >
                <Users className="h-4 w-4 mr-1" />Equal
              </Button>
              <Button 
                variant={splitMode === 'percentage' ? 'default' : 'outline'} 
                size="sm" 
                className="flex-1"
                onClick={() => setSplitMode('percentage')}
              >
                <Percent className="h-4 w-4 mr-1" />%
              </Button>
            </div>
            
            {splitMode === 'equal' && (
              <div className="flex gap-2">
                <Input 
                  type="number" 
                  value={equalParts} 
                  onChange={(e) => setEqualParts(Math.min(MAX_SPLITS, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="h-8"
                  min={1}
                  max={MAX_SPLITS}
                />
                <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]" onClick={splitEqually}>
                  Split
                </Button>
              </div>
            )}
            
            {splitMode === 'percentage' && (
              <div className="space-y-2">
                {splits.filter(s => !s.paid).slice(0, 5).map(split => (
                  <div key={split.id} className="flex items-center gap-2">
                    <span className="text-xs flex-1 truncate">{split.name}</span>
                    <Input 
                      type="number"
                      className="w-16 h-7 text-xs"
                      value={percentageInputs[split.id] || ''}
                      onChange={(e) => setPercentageInputs(prev => ({
                        ...prev,
                        [split.id]: parseFloat(e.target.value) || 0
                      }))}
                      placeholder="%"
                    />
                  </div>
                ))}
                <Button size="sm" className="w-full bg-[#00897B] hover:bg-[#00695C]" onClick={splitByPercentage}>
                  Apply Percentages
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Center Panel - Unassigned Items */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-3 border-b border-gray-200 bg-white flex items-center justify-between">
            <p className="text-xs font-medium text-[#757575]">
              UNASSIGNED ITEMS ({unassignedItems.length})
            </p>
            {unassignedItems.length > 0 && (
              <Button size="sm" variant="outline" onClick={bulkAssignUnassigned}>
                Distribute All
              </Button>
            )}
          </div>
          
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-2">
              {unassignedItems.map((item) => (
                <Card key={item.id} className="border-gray-200 hover:border-[#00897B] transition-colors">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-[#757575]">{item.category} · Qty: {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-sm">R{(item.price * item.quantity).toFixed(2)}</p>
                      <Select
                        value=""
                        onValueChange={(splitId) => addItemToSplit(item.id, splitId)}
                      >
                        <SelectTrigger className="w-28 h-8 text-xs">
                          <SelectValue placeholder="Assign to..." />
                        </SelectTrigger>
                        <SelectContent>
                          {splits.filter(s => !s.paid).map(split => (
                            <SelectItem key={split.id} value={split.id}>
                              {split.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {unassignedItems.length === 0 && (
                <div className="text-center py-8 text-[#757575]">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>All items assigned</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Active Split Details */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-3 border-b border-gray-200 flex items-center justify-between">
            <p className="text-xs font-medium text-[#757575]">
              {activeSplitData?.name} - ASSIGNED ITEMS
            </p>
            {activeSplitData && !activeSplitData.paid && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 text-xs"
                onClick={() => assignAllToSplit(activeSplitData.id)}
              >
                Assign All
              </Button>
            )}
          </div>
          
          {activeSplitData && (
            <>
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-2">
                  {items
                    .filter(item => activeSplitData.items.includes(item.id))
                    .map((item) => (
                      <Card key={item.id} className="border-gray-200">
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.name}</p>
                            <p className="text-xs text-[#757575]">Qty: {item.quantity}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm">R{(item.price * item.quantity).toFixed(2)}</p>
                            {!activeSplitData.paid && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-red-400 hover:text-red-600"
                                onClick={() => removeItemFromSplit(item.id, activeSplitData.id)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  
                  {activeSplitData.items.length === 0 && (
                    <div className="text-center py-8 text-[#757575]">
                      <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No items assigned</p>
                      <p className="text-xs">Select items to assign</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Totals and Tip */}
              <div className="p-3 border-t border-gray-200 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#757575]">Subtotal + VAT</span>
                  <span>R{activeSplitData.subtotal.toFixed(2)}</span>
                </div>
                
                {!activeSplitData.paid && (
                  <div>
                    <p className="text-xs text-[#757575] mb-2">Add Tip</p>
                    <div className="flex gap-2">
                      {[0, 10, 15, 18, 20].map(pct => (
                        <Button
                          key={pct}
                          variant={activeSplitData.tipPercent === pct ? 'default' : 'outline'}
                          size="sm"
                          className={`h-7 text-xs ${activeSplitData.tipPercent === pct ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}`}
                          onClick={() => addTip(activeSplitData.id, pct)}
                        >
                          {pct}%
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                
                {activeSplitData.tip > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Tip ({activeSplitData.tipPercent}%)</span>
                    <span className="text-green-600">+R{activeSplitData.tip.toFixed(2)}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>R{activeSplitData.total.toFixed(2)}</span>
                </div>

                {!activeSplitData.paid && (
                  <Button 
                    className="w-full bg-[#00897B] hover:bg-[#00695C]"
                    onClick={() => {
                      setSelectedSplitForPayment(activeSplitData)
                      setPaymentDialogOpen(true)
                    }}
                    disabled={activeSplitData.items.length === 0 && activeSplitData.subtotal === 0}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />Take Payment
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment for {selectedSplitForPayment?.name}</DialogTitle>
            <DialogDescription>
              Total due: R{selectedSplitForPayment?.total.toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {/* Order Summary */}
            {selectedSplitForPayment && selectedSplitForPayment.items.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm max-h-32 overflow-y-auto">
                <p className="font-medium mb-2">Items:</p>
                {items
                  .filter(item => selectedSplitForPayment.items.includes(item.id))
                  .map(item => (
                    <div key={item.id} className="flex justify-between text-[#757575]">
                      <span>{item.name} x{item.quantity}</span>
                      <span>R{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
              </div>
            )}
            
            <p className="text-sm text-[#757575]">Select payment method:</p>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => (
                <Button
                  key={method.id}
                  variant="outline"
                  className={`h-16 flex flex-col gap-1 border-2 ${method.color}`}
                  onClick={() => processPayment(selectedSplitForPayment!, method.id as any)}
                  disabled={processingPayment}
                >
                  {processingPayment ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <method.icon className="h-5 w-5" />
                  )}
                  <span className="text-xs font-medium">{method.label}</span>
                </Button>
              ))}
            </div>
            
            {/* Cash tendered for cash payments */}
            <div className="space-y-2">
              <Label className="text-sm">Cash Tendered (for cash payments)</Label>
              <Input
                type="number"
                value={cashTendered || ''}
                onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)}
                placeholder="Enter cash amount"
                className="h-10"
              />
              {cashTendered > 0 && selectedSplitForPayment && (
                <p className="text-sm text-green-600">
                  Change: R{(cashTendered - selectedSplitForPayment.total).toFixed(2)}
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
