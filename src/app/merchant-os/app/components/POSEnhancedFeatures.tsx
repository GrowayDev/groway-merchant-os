'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Coins,
  Percent,
  Tag,
  User,
  Users,
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  QrCode,
  Wallet,
  Clock,
  FileText,
  Printer,
  Pause,
  Play,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  DollarSign,
  Receipt,
  ArrowRightLeft,
  HandCoins,
  Building2,
  Phone,
  Mail,
  Star,
  ShoppingBag,
  Edit3,
  Save,
  RotateCcw,
} from 'lucide-react'

// Types
export interface CartItem {
  id: string
  name: string
  price: number
  originalPrice?: number
  quantity: number
  category: string
  customerId?: string
  customerName?: string
  customerPhone?: string
  appointmentId?: string
  discount?: number
  discountType?: 'percentage' | 'fixed'
  priceOverride?: number
  notes?: string
}

export interface HeldTransaction {
  id: string
  items: CartItem[]
  subtotal: number
  discount: number
  discountType: 'percentage' | 'fixed'
  notes?: string
  customerName?: string
  customerId?: string
  heldAt: Date
}

export interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  loyaltyPoints?: number
  totalSpent?: number
  lastVisit?: Date
}

export interface SplitPayment {
  id: string
  method: 'cash' | 'card' | 'qr' | 'wallet' | 'voucher' | 'account'
  amount: number
  reference?: string
}

export interface Discount {
  type: 'percentage' | 'fixed'
  value: number
  reason?: string
}

// Quick Charge Presets Component
interface QuickChargeProps {
  onSelectAmount: (amount: number, label?: string) => void
  customAmount?: boolean
}

export function QuickChargePresets({ onSelectAmount, customAmount = true }: QuickChargeProps) {
  const [showCustom, setShowCustom] = useState(false)
  const [customValue, setCustomValue] = useState('')

  const presetAmounts = [
    { amount: 10, label: 'R10' },
    { amount: 20, label: 'R20' },
    { amount: 50, label: 'R50' },
    { amount: 100, label: 'R100' },
    { amount: 150, label: 'R150' },
    { amount: 200, label: 'R200' },
    { amount: 300, label: 'R300' },
    { amount: 500, label: 'R500' },
  ]

  const handleCustomSubmit = () => {
    const amount = parseFloat(customValue)
    if (!isNaN(amount) && amount > 0) {
      onSelectAmount(amount, `Custom R${amount.toFixed(2)}`)
      setCustomValue('')
      setShowCustom(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-[#757575]">Quick Charge</Label>
        {customAmount && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-[#00897B]"
            onClick={() => setShowCustom(!showCustom)}
          >
            <Edit3 className="h-3 w-3 mr-1" />
            Custom
          </Button>
        )}
      </div>

      {showCustom && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">R</span>
            <Input
              type="number"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder="0.00"
              className="pl-7"
              autoFocus
            />
          </div>
          <Button size="sm" onClick={handleCustomSubmit} className="bg-[#00897B] hover:bg-[#00695C]">
            Add
          </Button>
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        {presetAmounts.map((preset) => (
          <Button
            key={preset.amount}
            variant="outline"
            size="sm"
            className="h-9 text-xs font-medium hover:bg-[#E0F2F1] hover:text-[#00897B] hover:border-[#00897B]"
            onClick={() => onSelectAmount(preset.amount, preset.label)}
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

// Price Override Dialog
interface PriceOverrideProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: CartItem | null
  onApply: (itemId: string, newPrice: number, reason: string) => void
}

export function PriceOverrideDialog({ open, onOpenChange, item, onApply }: PriceOverrideProps) {
  const reasons = [
    'Price Match',
    'Damaged Item',
    'Manager Approval',
    'Customer Complaint',
    'Promotional Pricing',
    'Other',
  ]

  // Calculate initial price from item
  const initialPrice = item ? (item.priceOverride?.toString() || item.price.toString()) : ''
  const [newPrice, setNewPrice] = useState(initialPrice)
  const [reason, setReason] = useState('')
  const [selectedReason, setSelectedReason] = useState('')

  // Reset when item changes using key pattern workaround
  const itemKey = item?.id || 'no-item'

  const handleApply = () => {
    const price = parseFloat(newPrice)
    if (!isNaN(price) && price > 0 && item) {
      onApply(item.id, price, selectedReason || reason || 'Price Override')
      onOpenChange(false)
    }
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-[#00897B]" />
            Price Override
          </DialogTitle>
          <DialogDescription>
            Override the price for "{item.name}"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-500">Current Price</p>
            <p className="text-lg font-bold text-[#1A1A1A]">R{item.price.toFixed(2)}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-price">New Price</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">R</span>
              <Input
                id="new-price"
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="0.00"
                className="pl-7 text-lg"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedReason === 'Other' && (
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason..."
                rows={2}
              />
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} className="bg-[#00897B] hover:bg-[#00695C]">
            Apply Override
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Discount Dialog
interface DiscountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'item' | 'cart'
  item?: CartItem | null
  cartTotal?: number
  onApply: (discount: Discount, itemId?: string) => void
}

export function DiscountDialog({ open, onOpenChange, mode, item, cartTotal, onApply }: DiscountDialogProps) {
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [discountValue, setDiscountValue] = useState('')
  const [reason, setReason] = useState('')

  const quickDiscounts = [
    { type: 'percentage' as const, value: 5, label: '5%' },
    { type: 'percentage' as const, value: 10, label: '10%' },
    { type: 'percentage' as const, value: 15, label: '15%' },
    { type: 'percentage' as const, value: 20, label: '20%' },
    { type: 'percentage' as const, value: 25, label: '25%' },
    { type: 'percentage' as const, value: 50, label: '50%' },
  ]

  // Reset state when dialog closes using the dialog's onOpenChange
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setDiscountValue('')
      setReason('')
      setDiscountType('percentage')
    }
    onOpenChange(isOpen)
  }

  const handleApply = () => {
    const value = parseFloat(discountValue)
    if (!isNaN(value) && value > 0) {
      onApply({ type: discountType, value, reason }, item?.id)
      onOpenChange(false)
    }
  }

  const handleQuickDiscount = (type: 'percentage' | 'fixed', value: number) => {
    onApply({ type, value, reason: 'Quick discount' }, item?.id)
    onOpenChange(false)
  }

  const baseAmount = mode === 'item' ? (item?.price || 0) * (item?.quantity || 1) : (cartTotal || 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-[#00897B]" />
            {mode === 'item' ? 'Item Discount' : 'Cart Discount'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'item' && item
              ? `Apply discount to "${item.name}"`
              : `Apply discount to entire cart`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-500">{mode === 'item' ? 'Item Total' : 'Cart Total'}</p>
            <p className="text-lg font-bold text-[#1A1A1A]">R{baseAmount.toFixed(2)}</p>
          </div>

          <div>
            <Label className="text-sm mb-2 block">Quick Discounts</Label>
            <div className="grid grid-cols-6 gap-2">
              {quickDiscounts.map((d) => (
                <Button
                  key={d.value}
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => handleQuickDiscount(d.type, d.value)}
                >
                  {d.label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Custom Discount</Label>
            <div className="flex gap-2">
              <Button
                variant={discountType === 'percentage' ? 'default' : 'outline'}
                size="sm"
                className={discountType === 'percentage' ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}
                onClick={() => setDiscountType('percentage')}
              >
                <Percent className="h-3 w-3 mr-1" />
                Percentage
              </Button>
              <Button
                variant={discountType === 'fixed' ? 'default' : 'outline'}
                size="sm"
                className={discountType === 'fixed' ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}
                onClick={() => setDiscountType('fixed')}
              >
                <DollarSign className="h-3 w-3 mr-1" />
                Fixed Amount
              </Button>
            </div>
            <div className="relative">
              {discountType === 'fixed' && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">R</span>
              )}
              <Input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === 'percentage' ? 'Enter %' : '0.00'}
                className={discountType === 'fixed' ? 'pl-7' : ''}
              />
              {discountType === 'percentage' && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">%</span>
              )}
            </div>
            {discountValue && (
              <p className="text-sm text-[#00897B]">
                Discount: -R{discountType === 'percentage'
                  ? (baseAmount * parseFloat(discountValue) / 100).toFixed(2)
                  : parseFloat(discountValue).toFixed(2)}
              </p>
            )}
          </div>

          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for discount (optional)"
            rows={2}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} className="bg-[#00897B] hover:bg-[#00695C]">
            Apply Discount
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Split Payment Dialog
interface SplitPaymentProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  total: number
  onComplete: (payments: SplitPayment[]) => void
}

export function SplitPaymentDialog({ open, onOpenChange, total, onComplete }: SplitPaymentProps) {
  const [payments, setPayments] = useState<SplitPayment[]>([])
  const [selectedMethod, setSelectedMethod] = useState<SplitPayment['method']>('cash')
  const [amount, setAmount] = useState('')

  const paymentMethods = [
    { id: 'cash', icon: Banknote, label: 'Cash' },
    { id: 'card', icon: CreditCard, label: 'Card' },
    { id: 'qr', icon: QrCode, label: 'QR Pay' },
    { id: 'wallet', icon: Wallet, label: 'Wallet' },
    { id: 'voucher', icon: Tag, label: 'Voucher' },
    { id: 'account', icon: Building2, label: 'On Account' },
  ]

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const remaining = total - totalPaid

  // Handle open change with reset
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setPayments([])
      setAmount('')
      setSelectedMethod('cash')
    }
    onOpenChange(isOpen)
  }

  const addPayment = () => {
    const paymentAmount = parseFloat(amount)
    if (!isNaN(paymentAmount) && paymentAmount > 0 && paymentAmount <= remaining) {
      setPayments([
        ...payments,
        { id: Date.now().toString(), method: selectedMethod, amount: paymentAmount }
      ])
      setAmount('')
    }
  }

  const removePayment = (id: string) => {
    setPayments(payments.filter((p) => p.id !== id))
  }

  const addExactRemaining = () => {
    if (remaining > 0) {
      setAmount(remaining.toFixed(2))
    }
  }

  const handleComplete = () => {
    if (remaining === 0 && payments.length > 0) {
      onComplete(payments)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-[#00897B]" />
            Split Payment
          </DialogTitle>
          <DialogDescription>
            Total amount: R{total.toFixed(2)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Payment Progress */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-500">Total</span>
              <span className="font-bold">R{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-500">Paid</span>
              <span className="font-medium text-green-600">R{totalPaid.toFixed(2)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Remaining</span>
              <span className={`font-bold ${remaining > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                R{remaining.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Added Payments */}
          {payments.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">Payments Added</Label>
              <div className="space-y-2">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between bg-[#E0F2F1] rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      {paymentMethods.find((m) => m.id === payment.method)?.icon && (
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                          {(() => {
                            const Icon = paymentMethods.find((m) => m.id === payment.method)!.icon
                            return <Icon className="h-4 w-4 text-[#00897B]" />
                          })()}
                        </div>
                      )}
                      <span className="font-medium capitalize">{payment.method}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">R{payment.amount.toFixed(2)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500"
                        onClick={() => removePayment(payment.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Payment */}
          {remaining > 0 && (
            <div className="space-y-3 border-t pt-4">
              <Label className="text-sm">Add Payment</Label>
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                      selectedMethod === method.id
                        ? 'border-[#00897B] bg-[#E0F2F1]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedMethod(method.id as SplitPayment['method'])}
                  >
                    <method.icon className={`h-5 w-5 ${selectedMethod === method.id ? 'text-[#00897B]' : 'text-gray-500'}`} />
                    <span className="text-xs font-medium">{method.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">R</span>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-7"
                  />
                </div>
                <Button variant="outline" onClick={addExactRemaining}>
                  Exact
                </Button>
                <Button onClick={addPayment} className="bg-[#00897B] hover:bg-[#00695C]">
                  Add
                </Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            disabled={remaining > 0}
            className="bg-[#00897B] hover:bg-[#00695C]"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Complete Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Customer Lookup Dialog
interface CustomerLookupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (customer: Customer) => void
}

export function CustomerLookupDialog({ open, onOpenChange, onSelect }: CustomerLookupProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' })

  // Mock customers - in production this would fetch from API
  const mockCustomers: Customer[] = [
    { id: '1', name: 'John Smith', phone: '+27123456789', email: 'john@email.com', loyaltyPoints: 150, totalSpent: 2500, lastVisit: new Date('2024-01-15') },
    { id: '2', name: 'Sarah Johnson', phone: '+27987654321', email: 'sarah@email.com', loyaltyPoints: 320, totalSpent: 5800, lastVisit: new Date('2024-01-20') },
    { id: '3', name: 'Michael Brown', phone: '+27821234567', email: 'mike@email.com', loyaltyPoints: 75, totalSpent: 1200, lastVisit: new Date('2024-01-10') },
    { id: '4', name: 'Emily Davis', phone: '+27734567890', email: 'emily@email.com', loyaltyPoints: 500, totalSpent: 8500, lastVisit: new Date('2024-01-22') },
    { id: '5', name: 'Robert Wilson', phone: '+27647890123', email: 'rob@email.com', loyaltyPoints: 200, totalSpent: 3200, lastVisit: new Date('2024-01-18') },
  ]

  // Handle open change with reset
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setCustomers(mockCustomers)
    }
    if (!isOpen) {
      setSearchQuery('')
      setSelectedCustomer(null)
      setShowNewCustomer(false)
    }
    onOpenChange(isOpen)
  }

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelect = () => {
    if (selectedCustomer) {
      onSelect(selectedCustomer)
      onOpenChange(false)
    }
  }

  const handleCreateNew = () => {
    if (newCustomer.name) {
      const customer: Customer = {
        id: Date.now().toString(),
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email,
        loyaltyPoints: 0,
        totalSpent: 0,
      }
      onSelect(customer)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#00897B]" />
            Select Customer
          </DialogTitle>
          <DialogDescription>
            Search for an existing customer or add a new one
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, or email..."
              className="pl-9"
            />
          </div>

          <Tabs value={showNewCustomer ? 'new' : 'search'} onValueChange={(v) => setShowNewCustomer(v === 'new')}>
            <TabsList className="w-full">
              <TabsTrigger value="search" className="flex-1">Search Existing</TabsTrigger>
              <TabsTrigger value="new" className="flex-1">Add New</TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="mt-4">
              <ScrollArea className="h-64">
                {filteredCustomers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <User className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No customers found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                          selectedCustomer?.id === customer.id
                            ? 'border-[#00897B] bg-[#E0F2F1]'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-[#1A1A1A]">{customer.name}</p>
                            {customer.phone && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {customer.phone}
                              </p>
                            )}
                            {customer.email && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {customer.email}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            {customer.loyaltyPoints !== undefined && customer.loyaltyPoints > 0 && (
                              <Badge variant="secondary" className="mb-1">
                                <Star className="h-3 w-3 mr-1" />
                                {customer.loyaltyPoints} pts
                              </Badge>
                            )}
                            <p className="text-xs text-gray-500">
                              Spent R{customer.totalSpent?.toFixed(0) || 0}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="new" className="mt-4 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="customer-name">Name *</Label>
                <Input
                  id="customer-name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="Customer name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-phone">Phone</Label>
                <Input
                  id="customer-phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="+27"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-email">Email</Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {showNewCustomer ? (
            <Button onClick={handleCreateNew} className="bg-[#00897B] hover:bg-[#00695C]">
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          ) : (
            <Button onClick={handleSelect} disabled={!selectedCustomer} className="bg-[#00897B] hover:bg-[#00695C]">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Select Customer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hold Transaction Dialog
interface HoldTransactionProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  heldTransactions: HeldTransaction[]
  onHold: (notes?: string) => void
  onResume: (transaction: HeldTransaction) => void
  onDelete: (id: string) => void
  hasItems: boolean
}

export function HoldTransactionDialog({
  open,
  onOpenChange,
  heldTransactions,
  onHold,
  onResume,
  onDelete,
  hasItems
}: HoldTransactionProps) {
  const [notes, setNotes] = useState('')
  const [showHoldForm, setShowHoldForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Handle open change with reset
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setNotes('')
      setShowHoldForm(false)
    }
    onOpenChange(isOpen)
  }

  const handleHold = () => {
    onHold(notes)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pause className="h-5 w-5 text-[#00897B]" />
            Held Transactions
          </DialogTitle>
          <DialogDescription>
            {hasItems ? 'Hold current sale or resume a previous one' : 'Resume a previously held transaction'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Hold Current Sale */}
          {hasItems && (
            <div className="border rounded-lg p-4 bg-amber-50 border-amber-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Pause className="h-4 w-4 text-amber-600" />
                  <span className="font-medium text-amber-800">Hold Current Sale</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHoldForm(!showHoldForm)}
                >
                  {showHoldForm ? 'Cancel' : 'Hold Sale'}
                </Button>
              </div>
              {showHoldForm && (
                <div className="space-y-3">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes (e.g., customer name, table number)"
                    rows={2}
                  />
                  <Button onClick={handleHold} className="w-full bg-amber-600 hover:bg-amber-700">
                    <Pause className="h-4 w-4 mr-2" />
                    Hold Transaction
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Held Transactions List */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Held Transactions ({heldTransactions.length})</Label>
            <ScrollArea className="h-48">
              {heldTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No held transactions</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {heldTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div>
                        <p className="font-medium text-[#1A1A1A]">
                          {transaction.customerName || `${transaction.items.length} items`}
                        </p>
                        <p className="text-sm text-gray-500">
                          R{transaction.subtotal.toFixed(2)} • {new Date(transaction.heldAt).toLocaleTimeString()}
                        </p>
                        {transaction.notes && (
                          <p className="text-xs text-gray-400">{transaction.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onResume(transaction)}
                          className="text-[#00897B]"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteConfirm(transaction.id)}
                          className="text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Held Transaction?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The transaction will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-500 hover:bg-red-600"
                onClick={() => {
                  if (deleteConfirm) {
                    onDelete(deleteConfirm)
                    setDeleteConfirm(null)
                  }
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  )
}

// Receipt Preview Component
interface ReceiptPreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: {
    id: string
    number: string
    items: CartItem[]
    subtotal: number
    discount?: number
    vat: number
    total: number
    paymentMethod?: string
    customerName?: string
    createdAt: Date
  } | null
  onPrint: () => void
  onEmail: (email: string) => void
  onSms: (phone: string) => void
}

export function ReceiptPreview({ open, onOpenChange, transaction, onPrint, onEmail, onSms }: ReceiptPreviewProps) {
  const [sendMethod, setSendMethod] = useState<'print' | 'email' | 'sms'>('print')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  if (!transaction) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-[#00897B]" />
            Receipt Preview
          </DialogTitle>
          <DialogDescription>
            Transaction {transaction.number}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Receipt Preview */}
          <div className="bg-white border rounded-lg p-4 font-mono text-xs">
            <div className="text-center mb-4">
              <p className="font-bold text-sm">DEMO BUSINESS</p>
              <p className="text-gray-500">123 Main Street</p>
              <p className="text-gray-500">Johannesburg, 2000</p>
              <p className="text-gray-500">Tel: +27 11 123 4567</p>
            </div>
            <Separator className="my-2" />
            <div className="mb-2">
              <p>Date: {transaction.createdAt.toLocaleDateString()}</p>
              <p>Time: {transaction.createdAt.toLocaleTimeString()}</p>
              <p>Receipt: {transaction.number}</p>
              {transaction.customerName && (
                <p>Customer: {transaction.customerName}</p>
              )}
            </div>
            <Separator className="my-2" />
            <div className="space-y-1">
              {transaction.items.map((item) => (
                <div key={item.id}>
                  <div className="flex justify-between">
                    <span>{item.name}</span>
                    <span>R{((item.priceOverride || item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>  {item.quantity} x R{(item.priceOverride || item.price).toFixed(2)}</span>
                    {item.discount && item.discount > 0 && (
                      <span className="text-red-500">-R{item.discount.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Separator className="my-2" />
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>R{transaction.subtotal.toFixed(2)}</span>
              </div>
              {transaction.discount && transaction.discount > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Discount:</span>
                  <span>-R{transaction.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>VAT (15%):</span>
                <span>R{transaction.vat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm">
                <span>TOTAL:</span>
                <span>R{transaction.total.toFixed(2)}</span>
              </div>
            </div>
            {transaction.paymentMethod && (
              <>
                <Separator className="my-2" />
                <p>Payment: {transaction.paymentMethod.toUpperCase()}</p>
              </>
            )}
            <Separator className="my-2" />
            <div className="text-center text-gray-500">
              <p>Thank you for your purchase!</p>
              <p>VAT No: 1234567890</p>
            </div>
          </div>

          {/* Send Options */}
          <div className="space-y-3">
            <Label>Send Receipt</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={sendMethod === 'print' ? 'default' : 'outline'}
                size="sm"
                className={sendMethod === 'print' ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}
                onClick={() => setSendMethod('print')}
              >
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
              <Button
                variant={sendMethod === 'email' ? 'default' : 'outline'}
                size="sm"
                className={sendMethod === 'email' ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}
                onClick={() => setSendMethod('email')}
              >
                <Mail className="h-4 w-4 mr-1" />
                Email
              </Button>
              <Button
                variant={sendMethod === 'sms' ? 'default' : 'outline'}
                size="sm"
                className={sendMethod === 'sms' ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}
                onClick={() => setSendMethod('sms')}
              >
                <Phone className="h-4 w-4 mr-1" />
                SMS
              </Button>
            </div>
            {sendMethod === 'email' && (
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@email.com"
              />
            )}
            {sendMethod === 'sms' && (
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+27"
              />
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={() => {
              if (sendMethod === 'print') onPrint()
              else if (sendMethod === 'email') onEmail(email)
              else onSms(phone)
            }}
            className="bg-[#00897B] hover:bg-[#00695C]"
          >
            {sendMethod === 'print' && <><Printer className="h-4 w-4 mr-2" />Print Receipt</>}
            {sendMethod === 'email' && <><Mail className="h-4 w-4 mr-2" />Send Email</>}
            {sendMethod === 'sms' && <><Phone className="h-4 w-4 mr-2" />Send SMS</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Void/Refund Dialog
interface VoidRefundProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'void' | 'refund'
  transaction?: {
    id: string
    number: string
    total: number
    items: CartItem[]
    paymentMethod?: string
    createdAt: Date
  } | null
  onConfirm: (reason: string, refundMethod?: 'original' | 'cash' | 'store_credit') => void
}

export function VoidRefundDialog({ open, onOpenChange, mode, transaction, onConfirm }: VoidRefundProps) {
  const [reason, setReason] = useState('')
  const [selectedReason, setSelectedReason] = useState('')
  const [refundMethod, setRefundMethod] = useState<'original' | 'cash' | 'store_credit'>('original')

  const voidReasons = [
    'Customer Request',
    'Incorrect Price',
    'Wrong Item',
    'System Error',
    'Manager Approval',
    'Damaged Goods',
    'Other',
  ]

  // Handle open change with reset
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setReason('')
      setSelectedReason('')
      setRefundMethod('original')
    }
    onOpenChange(isOpen)
  }

  const handleConfirm = () => {
    if ((selectedReason || reason) && transaction) {
      onConfirm(selectedReason || reason, mode === 'refund' ? refundMethod : undefined)
      onOpenChange(false)
    }
  }

  if (!transaction) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'void' ? (
              <>
                <X className="h-5 w-5 text-red-500" />
                Void Transaction
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5 text-amber-500" />
                Process Refund
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            Transaction {transaction.number} • R{transaction.total.toFixed(2)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">
                {mode === 'void' ? 'Void Transaction?' : 'Process Refund?'}
              </p>
              <p className="text-sm text-red-600">
                {mode === 'void'
                  ? 'This will cancel the entire transaction. This action cannot be undone.'
                  : 'This will process a refund for this transaction.'}
              </p>
            </div>
          </div>

          {/* Transaction Items */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm font-medium mb-2">Items ({transaction.items.length})</p>
            <ScrollArea className="h-24">
              {transaction.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm py-1">
                  <span>{item.name} x{item.quantity}</span>
                  <span>R{((item.priceOverride || item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </ScrollArea>
          </div>

          {/* Refund Method */}
          {mode === 'refund' && (
            <div className="space-y-2">
              <Label>Refund Method</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={refundMethod === 'original' ? 'default' : 'outline'}
                  size="sm"
                  className={refundMethod === 'original' ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}
                  onClick={() => setRefundMethod('original')}
                >
                  Original
                </Button>
                <Button
                  variant={refundMethod === 'cash' ? 'default' : 'outline'}
                  size="sm"
                  className={refundMethod === 'cash' ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}
                  onClick={() => setRefundMethod('cash')}
                >
                  <Banknote className="h-3 w-3 mr-1" />
                  Cash
                </Button>
                <Button
                  variant={refundMethod === 'store_credit' ? 'default' : 'outline'}
                  size="sm"
                  className={refundMethod === 'store_credit' ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}
                  onClick={() => setRefundMethod('store_credit')}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  Credit
                </Button>
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason *</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {voidReasons.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedReason === 'Other' && (
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason..."
                rows={2}
              />
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedReason && !reason}
            className={mode === 'void' ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'}
          >
            {mode === 'void' ? 'Void Transaction' : 'Process Refund'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Cart Item with Actions
interface CartItemWithActionsProps {
  item: CartItem
  onUpdateQuantity: (id: string, delta: number) => void
  onRemove: (id: string) => void
  onPriceOverride: (item: CartItem) => void
  onItemDiscount: (item: CartItem) => void
}

export function CartItemWithActions({
  item,
  onUpdateQuantity,
  onRemove,
  onPriceOverride,
  onItemDiscount
}: CartItemWithActionsProps) {
  const itemTotal = (item.priceOverride || item.price) * item.quantity
  const itemDiscount = item.discount || 0

  return (
    <div className="flex items-center gap-3 p-2 bg-[#FAFAFA] rounded-lg group">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[#1A1A1A] truncate">{item.name}</p>
        <div className="flex items-center gap-2">
          <p className="text-[10px] text-[#757575]">
            {item.priceOverride ? (
              <>
                <span className="line-through text-gray-400">R{item.price.toFixed(2)}</span>
                <span className="ml-1 text-[#00897B]">R{item.priceOverride.toFixed(2)}</span>
              </>
            ) : (
              `R${item.price.toFixed(2)}`
            )}
            {' '}each
          </p>
          {itemDiscount > 0 && (
            <Badge className="bg-red-100 text-red-700 text-[9px]">-R{itemDiscount.toFixed(2)}</Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-6 w-6"
          onClick={() => onUpdateQuantity(item.id, -1)}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-6 w-6"
          onClick={() => onUpdateQuantity(item.id, 1)}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-[#00897B]"
          onClick={() => onPriceOverride(item)}
          title="Price Override"
        >
          <Edit3 className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-[#00897B]"
          onClick={() => onItemDiscount(item)}
          title="Item Discount"
        >
          <Percent className="h-3 w-3" />
        </Button>
        <button
          className="text-red-400 hover:text-red-600"
          onClick={() => onRemove(item.id)}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <span className="text-xs font-bold text-[#00897B] w-16 text-right">
        R{(itemTotal - itemDiscount).toFixed(2)}
      </span>
    </div>
  )
}
