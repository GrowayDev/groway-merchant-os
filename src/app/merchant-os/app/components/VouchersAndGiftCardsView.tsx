'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Progress } from '@/components/ui/progress'
import { 
  Gift,
  Ticket,
  CreditCard,
  ShoppingCart,
  Users,
  Building2,
  Search,
  Plus,
  Clock,
  TrendingUp,
  Coins,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Eye,
  Phone,
  Zap,
  Gamepad2,
  Tv,
  Fuel,
  Heart,
  Store,
  QrCode,
  Copy,
  Star,
  Settings,
  Wallet,
  Receipt,
  Timer,
  RefreshCw,
  ExternalLink,
  Shield,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react'

// ============================================
// SOUTH AFRICAN GIFT CARDS vs VOUCHERS DEFINITIONS
// ============================================

/**
 * GIFT CARDS (South Africa):
 * - Pre-loaded monetary value stored on a card (physical or digital)
 * - Redeemable at specific retailer(s) for goods/services
 * - 3-YEAR EXPIRY MANDATED by Consumer Protection Act (from July 2024)
 * - Cannot charge admin fees for first 3 years
 * - Examples: Shoprite Gift Card, Woolworths Gift Card, Game Gift Card
 * 
 * VOUCHERS (South Africa):
 * - Digital or paper-based codes representing value
 * - Often for specific products/services (airtime, data, electricity, betting)
 * - Expiry varies by type (not always 3 years)
 * - Popular types: Mobile vouchers, Betting vouchers, Utility vouchers
 * - Examples: 1voucher, OTT Voucher, Flash Voucher, Blu Voucher, EasyLoad
 */

// Types
interface GiftCardProduct {
  id: string
  name: string
  brand: string
  type: 'gift_card' | 'voucher'
  category: GiftCardCategory
  logo: string
  denominations: number[]
  margin: number
  popular: boolean
  description: string
  expiryMonths: number // 36 for gift cards (3 years mandated), varies for vouchers
  redemptionType: 'in_store' | 'online' | 'both'
  platforms?: string[] // For vouchers - where they can be used
}

interface MerchantGiftCard {
  id: string
  merchantId: string
  merchantName: string
  cardNumber: string
  pin: string
  value: number
  balance: number
  issuedTo?: string
  issuedPhone?: string
  issuedDate: string
  expiryDate: string
  status: 'active' | 'redeemed' | 'expired' | 'cancelled'
  transactions: GiftCardTransaction[]
  design: 'standard' | 'premium' | 'seasonal'
  customMessage?: string
}

interface MerchantVoucher {
  id: string
  merchantId: string
  merchantName: string
  code: string
  type: 'discount' | 'value' | 'product'
  value: number // Percentage for discount, amount for value
  description: string
  minPurchase?: number
  validFrom: string
  validTo: string
  maxRedemptions: number
  currentRedemptions: number
  status: 'active' | 'paused' | 'expired' | 'exhausted'
  singleUse: boolean
}

interface PurchasedItem {
  id: string
  productId: string
  productName: string
  brand: string
  type: 'gift_card' | 'voucher'
  code: string
  pin?: string
  value: number
  purchaserName: string
  purchaserPhone: string
  recipientName?: string
  recipientPhone?: string
  purchaseDate: string
  expiryDate: string
  status: 'active' | 'redeemed' | 'expired'
  redemptionDate?: string
  qrCode?: string
  serialNumber?: string
}

interface GiftCardTransaction {
  id: string
  type: 'issue' | 'topup' | 'redeem' | 'refund'
  amount: number
  balanceAfter: number
  date: string
  location?: string
  staffMember?: string
}

type GiftCardCategory = 
  | 'retail' 
  | 'gaming' 
  | 'streaming' 
  | 'food' 
  | 'fuel' 
  | 'health' 
  | 'lifestyle'
  | 'mobile'      // Airtime, Data
  | 'utilities'   // Electricity, Water
  | 'betting'     // Sports betting, Lotto
  | 'entertainment' // Movies, Events

// ============================================
// SAMPLE DATA
// ============================================

// Third-Party Gift Cards (Retailer-issued)
const thirdPartyGiftCards: GiftCardProduct[] = [
  // Retail Gift Cards
  { id: 'gc1', name: 'Shoprite Gift Card', brand: 'Shoprite', type: 'gift_card', category: 'retail', logo: '🛒', denominations: [50, 100, 200, 500, 1000], margin: 0.025, popular: true, description: 'Redeemable at Shoprite, Checkers, U-Save', expiryMonths: 36, redemptionType: 'in_store' },
  { id: 'gc2', name: 'Pick n Pay Gift Card', brand: 'Pick n Pay', type: 'gift_card', category: 'retail', logo: '🛍️', denominations: [50, 100, 200, 500], margin: 0.025, popular: true, description: 'Shop at any Pick n Pay store', expiryMonths: 36, redemptionType: 'both' },
  { id: 'gc3', name: 'Woolworths Gift Card', brand: 'Woolworths', type: 'gift_card', category: 'retail', logo: '🧥', denominations: [100, 200, 500, 1000], margin: 0.03, popular: true, description: 'Premium shopping experience', expiryMonths: 36, redemptionType: 'both' },
  { id: 'gc4', name: 'Game Gift Card', brand: 'Game', type: 'gift_card', category: 'retail', logo: '🎮', denominations: [100, 250, 500, 1000], margin: 0.025, popular: false, description: 'Electronics and homeware', expiryMonths: 36, redemptionType: 'in_store' },
  { id: 'gc5', name: 'Makro Gift Card', brand: 'Makro', type: 'gift_card', category: 'retail', logo: '🏪', denominations: [200, 500, 1000], margin: 0.02, popular: false, description: 'Wholesale shopping', expiryMonths: 36, redemptionType: 'in_store' },
  { id: 'gc6', name: 'Spar Gift Card', brand: 'Spar', type: 'gift_card', category: 'retail', logo: '🏪', denominations: [50, 100, 200, 500], margin: 0.025, popular: false, description: 'Neighbourhood shopping', expiryMonths: 36, redemptionType: 'in_store' },
  
  // Food Gift Cards
  { id: 'gc13', name: 'KFC Gift Card', brand: 'KFC', type: 'gift_card', category: 'food', logo: '🍗', denominations: [50, 100, 200], margin: 0.03, popular: true, description: 'Kentucky Fried Chicken', expiryMonths: 36, redemptionType: 'in_store' },
  { id: 'gc14', name: "Nando's Gift Card", brand: "Nando's", type: 'gift_card', category: 'food', logo: '🌶️', denominations: [100, 200, 500], margin: 0.03, popular: true, description: 'Flame-grilled peri-peri chicken', expiryMonths: 36, redemptionType: 'in_store' },
  { id: 'gc15', name: 'Steers Gift Card', brand: 'Steers', type: 'gift_card', category: 'food', logo: '🍔', denominations: [50, 100, 200], margin: 0.03, popular: false, description: 'Real burgers and chips', expiryMonths: 36, redemptionType: 'in_store' },
  
  // Fuel Gift Cards
  { id: 'gc16', name: 'Engen Gift Card', brand: 'Engen', type: 'gift_card', category: 'fuel', logo: '⛽', denominations: [100, 250, 500, 1000], margin: 0.025, popular: true, description: 'Fuel and convenience store', expiryMonths: 36, redemptionType: 'in_store' },
  { id: 'gc17', name: 'Shell Gift Card', brand: 'Shell', type: 'gift_card', category: 'fuel', logo: '🛢️', denominations: [100, 250, 500], margin: 0.025, popular: false, description: 'Fuel and select services', expiryMonths: 36, redemptionType: 'in_store' },
  { id: 'gc18', name: 'BP Gift Card', brand: 'BP', type: 'gift_card', category: 'fuel', logo: '⛽', denominations: [100, 250, 500], margin: 0.025, popular: false, description: 'BP service stations', expiryMonths: 36, redemptionType: 'in_store' },
  
  // Health Gift Cards
  { id: 'gc19', name: 'Dis-Chem Gift Card', brand: 'Dis-Chem', type: 'gift_card', category: 'health', logo: '💊', denominations: [100, 250, 500], margin: 0.03, popular: true, description: 'Pharmacy and wellness', expiryMonths: 36, redemptionType: 'in_store' },
  { id: 'gc20', name: 'Clicks Gift Card', brand: 'Clicks', type: 'gift_card', category: 'health', logo: '🧴', denominations: [100, 250, 500], margin: 0.03, popular: true, description: 'Health, beauty, pharmacy', expiryMonths: 36, redemptionType: 'in_store' },
  
  // Lifestyle Gift Cards
  { id: 'gc21', name: 'Spa Gift Voucher', brand: 'Various Spas', type: 'gift_card', category: 'lifestyle', logo: '💆', denominations: [250, 500, 1000], margin: 0.05, popular: true, description: 'Pamper yourself or a loved one', expiryMonths: 36, redemptionType: 'in_store' },
]

// Third-Party Vouchers (Digital codes for services)
const thirdPartyVouchers: GiftCardProduct[] = [
  // Betting & Gaming Vouchers - SOUTH AFRICA'S MOST POPULAR
  { id: 'v1', name: '1voucher', brand: '1voucher', type: 'voucher', category: 'betting', logo: '1️⃣', denominations: [10, 20, 50, 100, 200, 500], margin: 0.04, popular: true, description: 'Deposit voucher for betting sites: Hollywoodbets, Betway, Sportingbet, SunBet, Worldsportsbetting & more', expiryMonths: 12, redemptionType: 'online', platforms: ['Hollywoodbets', 'Betway', 'Sportingbet', 'SunBet', 'WSB', 'YesPlay', '10bet'] },
  { id: 'v2', name: 'OTT Voucher', brand: 'OTT Voucher', type: 'voucher', category: 'betting', logo: '🎰', denominations: [10, 20, 50, 100, 200, 500, 1000], margin: 0.04, popular: true, description: 'Online betting voucher for betting & gaming platforms. Top up your betting account instantly.', expiryMonths: 12, redemptionType: 'online', platforms: ['Hollywoodbets', 'Betway', 'GGBet', 'Sportingbet', 'SunBet', 'WSB'] },
  { id: 'v3', name: 'Blu Voucher', brand: 'Blu Voucher', type: 'voucher', category: 'mobile', logo: '🔵', denominations: [5, 10, 20, 50, 100], margin: 0.03, popular: true, description: 'Airtime & data voucher for all SA networks', expiryMonths: 24, redemptionType: 'online', platforms: ['Vodacom', 'MTN', 'Cell C', 'Telkom'] },
  { id: 'v4', name: 'Flash Voucher', brand: 'Flash', type: 'voucher', category: 'utilities', logo: '⚡', denominations: [20, 50, 100, 200, 500], margin: 0.025, popular: true, description: 'Electricity, airtime, data, and more', expiryMonths: 24, redemptionType: 'online', platforms: ['Prepaid Electricity', 'Airtime', 'Data', 'DSTV', 'Netflix'] },
  
  // Mobile Vouchers
  { id: 'v5', name: 'Vodacom Airtime', brand: 'Vodacom', type: 'voucher', category: 'mobile', logo: '📱', denominations: [5, 10, 20, 50, 100, 200], margin: 0.02, popular: true, description: 'Vodacom airtime voucher', expiryMonths: 999, redemptionType: 'online', platforms: ['Vodacom'] },
  { id: 'v6', name: 'MTN Airtime', brand: 'MTN', type: 'voucher', category: 'mobile', logo: '📱', denominations: [5, 10, 20, 50, 100, 200], margin: 0.02, popular: true, description: 'MTN airtime voucher', expiryMonths: 999, redemptionType: 'online', platforms: ['MTN'] },
  { id: 'v7', name: 'Cell C Airtime', brand: 'Cell C', type: 'voucher', category: 'mobile', logo: '📱', denominations: [5, 10, 20, 50, 100], margin: 0.02, popular: false, description: 'Cell C airtime voucher', expiryMonths: 999, redemptionType: 'online', platforms: ['Cell C'] },
  { id: 'v8', name: 'Telkom Data', brand: 'Telkom', type: 'voucher', category: 'mobile', logo: '📶', denominations: [10, 20, 50, 100, 200], margin: 0.025, popular: true, description: 'Telkom data bundles', expiryMonths: 24, redemptionType: 'online', platforms: ['Telkom'] },
  
  // Gaming Vouchers
  { id: 'v9', name: 'PlayStation Store Card', brand: 'Sony', type: 'voucher', category: 'gaming', logo: '🎮', denominations: [150, 300, 500, 1000], margin: 0.04, popular: true, description: 'PSN games, DLC, subscriptions', expiryMonths: 36, redemptionType: 'online', platforms: ['PlayStation Store'] },
  { id: 'v10', name: 'Xbox Gift Card', brand: 'Microsoft', type: 'voucher', category: 'gaming', logo: '🎯', denominations: [150, 300, 500, 1000], margin: 0.04, popular: true, description: 'Xbox games, Game Pass', expiryMonths: 36, redemptionType: 'online', platforms: ['Xbox Store', 'Microsoft Store'] },
  { id: 'v11', name: 'Steam Gift Card', brand: 'Valve', type: 'voucher', category: 'gaming', logo: '💨', denominations: [100, 250, 500], margin: 0.04, popular: true, description: 'PC gaming platform', expiryMonths: 36, redemptionType: 'online', platforms: ['Steam'] },
  
  // Streaming Vouchers
  { id: 'v12', name: 'Netflix Gift Card', brand: 'Netflix', type: 'voucher', category: 'streaming', logo: '📺', denominations: [150, 300, 500], margin: 0.05, popular: true, description: 'Streaming subscription', expiryMonths: 36, redemptionType: 'online', platforms: ['Netflix'] },
  { id: 'v13', name: 'Spotify Gift Card', brand: 'Spotify', type: 'voucher', category: 'streaming', logo: '🎵', denominations: [60, 120, 180], margin: 0.05, popular: true, description: 'Music streaming premium', expiryMonths: 36, redemptionType: 'online', platforms: ['Spotify'] },
  { id: 'v14', name: 'Showmax Gift Card', brand: 'Showmax', type: 'voucher', category: 'streaming', logo: '🎬', denominations: [99, 199, 399], margin: 0.045, popular: false, description: 'African streaming service', expiryMonths: 24, redemptionType: 'online', platforms: ['Showmax'] },
  { id: 'v15', name: 'DSTV BoxOffice', brand: 'DSTV', type: 'voucher', category: 'entertainment', logo: '📡', denominations: [40, 80, 120], margin: 0.04, popular: false, description: 'DSTV BoxOffice rentals', expiryMonths: 12, redemptionType: 'online', platforms: ['DSTV'] },
  
  // Utility Vouchers
  { id: 'v16', name: 'Prepaid Electricity', brand: 'Various', type: 'voucher', category: 'utilities', logo: '💡', denominations: [20, 50, 100, 200, 500], margin: 0.02, popular: true, description: 'Prepaid electricity token', expiryMonths: 999, redemptionType: 'online', platforms: ['Eskom', 'Municipal'] },
]

// Sample merchant-issued gift cards
const sampleMerchantGiftCards: MerchantGiftCard[] = [
  {
    id: 'mgc1',
    merchantId: 'm1',
    merchantName: 'Nomsa\'s Hair Salon',
    cardNumber: 'GC-2026-00001',
    pin: '4567',
    value: 500,
    balance: 350,
    issuedTo: 'Thandi Dlamini',
    issuedPhone: '082 123 4567',
    issuedDate: '2026-01-15',
    expiryDate: '2029-01-15',
    status: 'active',
    design: 'premium',
    customMessage: 'Happy Birthday! Enjoy your pamper session',
    transactions: [
      { id: 't1', type: 'issue', amount: 500, balanceAfter: 500, date: '2026-01-15', staffMember: 'Nomsa' },
      { id: 't2', type: 'redeem', amount: 150, balanceAfter: 350, date: '2026-02-10', staffMember: 'Thabo' },
    ]
  },
]

// Sample merchant vouchers
const sampleMerchantVouchers: MerchantVoucher[] = [
  {
    id: 'mv1',
    merchantId: 'm1',
    merchantName: 'Nomsa\'s Hair Salon',
    code: 'SALON20',
    type: 'discount',
    value: 20,
    description: '20% off any hair treatment',
    minPurchase: 200,
    validFrom: '2026-02-01',
    validTo: '2026-03-31',
    maxRedemptions: 100,
    currentRedemptions: 23,
    status: 'active',
    singleUse: true
  },
  {
    id: 'mv2',
    merchantId: 'm1',
    merchantName: 'Nomsa\'s Hair Salon',
    code: 'NEWCLIENT',
    type: 'value',
    value: 100,
    description: 'R100 off for new clients',
    validFrom: '2026-02-01',
    validTo: '2026-06-30',
    maxRedemptions: 500,
    currentRedemptions: 87,
    status: 'active',
    singleUse: true
  },
]

// Sample purchased items
const samplePurchasedItems: PurchasedItem[] = [
  { id: 'pi1', productId: 'v1', productName: '1voucher', brand: '1voucher', type: 'voucher', code: '1V-ABC123XYZ', value: 100, purchaserName: 'John Dlamini', purchaserPhone: '082 123 4567', purchaseDate: '2026-02-18', expiryDate: '2027-02-18', status: 'active' },
  { id: 'pi2', productId: 'v2', productName: 'OTT Voucher', brand: 'OTT Voucher', type: 'voucher', code: 'OTT-987654321', value: 200, purchaserName: 'Thabo Molefe', purchaserPhone: '084 345 6789', purchaseDate: '2026-02-15', expiryDate: '2027-02-15', status: 'active' },
  { id: 'pi3', productId: 'gc1', productName: 'Shoprite Gift Card', brand: 'Shoprite', type: 'gift_card', code: 'SR2026ABC123', pin: '4567', value: 200, purchaserName: 'Sipho Nkosi', purchaserPhone: '085 456 7890', purchaseDate: '2026-02-10', expiryDate: '2029-02-10', status: 'active' },
]

// ============================================
// MAIN COMPONENT
// ============================================

export function VouchersAndGiftCardsView() {
  const [selectedTab, setSelectedTab] = useState('catalog')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<'all' | 'gift_card' | 'voucher'>('all')
  const [purchasedItems, setPurchasedItems] = useState<PurchasedItem[]>(samplePurchasedItems)
  const [merchantGiftCards, setMerchantGiftCards] = useState<MerchantGiftCard[]>(sampleMerchantGiftCards)
  const [merchantVouchers, setMerchantVouchers] = useState<MerchantVoucher[]>(sampleMerchantVouchers)
  
  // Dialog states
  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<GiftCardProduct | null>(null)
  const [itemDetailOpen, setItemDetailOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PurchasedItem | null>(null)
  const [createMerchantCardOpen, setCreateMerchantCardOpen] = useState(false)
  const [createMerchantVoucherOpen, setCreateMerchantVoucherOpen] = useState(false)
  const [merchantCardDetailOpen, setMerchantCardDetailOpen] = useState(false)
  const [selectedMerchantCard, setSelectedMerchantCard] = useState<MerchantGiftCard | null>(null)
  
  // Purchase form
  const [purchaseForm, setPurchaseForm] = useState({
    denomination: 0,
    purchaserName: '',
    purchaserPhone: '',
    recipientName: '',
    recipientPhone: '',
    message: '',
  })

  // Merchant gift card form
  const [merchantCardForm, setMerchantCardForm] = useState({
    value: 100,
    issuedTo: '',
    issuedPhone: '',
    customMessage: '',
    design: 'standard' as 'standard' | 'premium' | 'seasonal',
  })

  // Merchant voucher form
  const [merchantVoucherForm, setMerchantVoucherForm] = useState({
    type: 'discount' as 'discount' | 'value' | 'product',
    value: 10,
    description: '',
    minPurchase: 0,
    validDays: 90,
    maxRedemptions: 100,
    singleUse: true,
  })

  // Gift Card Wizard state
  const [wizardStep, setWizardStep] = useState(1)
  const [balanceInquiryOpen, setBalanceInquiryOpen] = useState(false)
  const [balanceInquiryCode, setBalanceInquiryCode] = useState('')
  const [redemptionDialogOpen, setRedemptionDialogOpen] = useState(false)
  const [redemptionForm, setRedemptionForm] = useState({ code: '', amount: 0, staffMember: '' })
  const [expiryAlertsOpen, setExpiryAlertsOpen] = useState(false)

  // Combine all products
  const allProducts = [...thirdPartyGiftCards, ...thirdPartyVouchers]

  // Filter products
  const filteredProducts = useMemo(() => {
    return allProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.brand.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
      const matchesType = selectedType === 'all' || product.type === selectedType
      return matchesSearch && matchesCategory && matchesType
    })
  }, [searchQuery, selectedCategory, selectedType])

  // Stats
  const stats = useMemo(() => {
    const giftCards = purchasedItems.filter(p => p.type === 'gift_card')
    const vouchers = purchasedItems.filter(p => p.type === 'voucher')
    const activeItems = purchasedItems.filter(p => p.status === 'active')
    const totalValue = activeItems.reduce((sum, p) => sum + p.value, 0)
    const revenue = purchasedItems.reduce((sum, p) => {
      const product = allProducts.find(prod => prod.id === p.productId)
      return sum + (product ? p.value * product.margin : 0)
    }, 0)
    
    return {
      totalItems: purchasedItems.length,
      giftCards: giftCards.length,
      vouchers: vouchers.length,
      totalValue,
      revenue,
      merchantCards: merchantGiftCards.length,
      merchantVouchers: merchantVouchers.length,
    }
  }, [purchasedItems, allProducts, merchantGiftCards, merchantVouchers])

  // Handle purchase
  const handlePurchase = () => {
    if (!selectedProduct || !purchaseForm.purchaserName || purchaseForm.denomination === 0) return
    
    const newItem: PurchasedItem = {
      id: `pi${Date.now()}`,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      brand: selectedProduct.brand,
      type: selectedProduct.type,
      code: `${selectedProduct.brand.substring(0, 2).toUpperCase()}${Date.now().toString(36).toUpperCase()}`,
      pin: selectedProduct.type === 'gift_card' ? Math.random().toString().substring(2, 6) : undefined,
      value: purchaseForm.denomination,
      purchaserName: purchaseForm.purchaserName,
      purchaserPhone: purchaseForm.purchaserPhone,
      recipientName: purchaseForm.recipientName || undefined,
      recipientPhone: purchaseForm.recipientPhone || undefined,
      purchaseDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + selectedProduct.expiryMonths * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active',
    }
    
    setPurchasedItems(prev => [newItem, ...prev])
    setPurchaseOpen(false)
    setSelectedProduct(null)
    setPurchaseForm({
      denomination: 0,
      purchaserName: '',
      purchaserPhone: '',
      recipientName: '',
      recipientPhone: '',
      message: '',
    })
  }

  // Create merchant gift card
  const handleCreateMerchantCard = () => {
    const newCard: MerchantGiftCard = {
      id: `mgc${Date.now()}`,
      merchantId: 'current',
      merchantName: 'Your Business',
      cardNumber: `GC-${new Date().getFullYear()}-${String(merchantGiftCards.length + 1).padStart(5, '0')}`,
      pin: Math.random().toString().substring(2, 6),
      value: merchantCardForm.value,
      balance: merchantCardForm.value,
      issuedTo: merchantCardForm.issuedTo || undefined,
      issuedPhone: merchantCardForm.issuedPhone || undefined,
      issuedDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 36 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active',
      design: merchantCardForm.design,
      customMessage: merchantCardForm.customMessage || undefined,
      transactions: [
        { id: 't1', type: 'issue', amount: merchantCardForm.value, balanceAfter: merchantCardForm.value, date: new Date().toISOString().split('T')[0] }
      ]
    }
    
    setMerchantGiftCards(prev => [newCard, ...prev])
    setCreateMerchantCardOpen(false)
    setMerchantCardForm({
      value: 100,
      issuedTo: '',
      issuedPhone: '',
      customMessage: '',
      design: 'standard',
    })
  }

  // Create merchant voucher
  const handleCreateMerchantVoucher = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const newVoucher: MerchantVoucher = {
      id: `mv${Date.now()}`,
      merchantId: 'current',
      merchantName: 'Your Business',
      code,
      type: merchantVoucherForm.type,
      value: merchantVoucherForm.value,
      description: merchantVoucherForm.description,
      minPurchase: merchantVoucherForm.minPurchase || undefined,
      validFrom: new Date().toISOString().split('T')[0],
      validTo: new Date(Date.now() + merchantVoucherForm.validDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      maxRedemptions: merchantVoucherForm.maxRedemptions,
      currentRedemptions: 0,
      status: 'active',
      singleUse: merchantVoucherForm.singleUse,
    }
    
    setMerchantVouchers(prev => [newVoucher, ...prev])
    setCreateMerchantVoucherOpen(false)
    setMerchantVoucherForm({
      type: 'discount',
      value: 10,
      description: '',
      minPurchase: 0,
      validDays: 90,
      maxRedemptions: 100,
      singleUse: true,
    })
  }

  // Category helpers
  const getCategoryLabel = (category: GiftCardCategory) => {
    const labels: Record<GiftCardCategory, string> = {
      retail: 'Retail',
      gaming: 'Gaming',
      streaming: 'Streaming',
      food: 'Food & Dining',
      fuel: 'Fuel',
      health: 'Health & Wellness',
      lifestyle: 'Lifestyle',
      mobile: 'Mobile (Airtime/Data)',
      utilities: 'Utilities',
      betting: 'Betting & Gaming',
      entertainment: 'Entertainment',
    }
    return labels[category] || category
  }

  const getCategoryColor = (category: GiftCardCategory) => {
    const colors: Record<GiftCardCategory, string> = {
      retail: 'bg-blue-100 text-blue-700',
      gaming: 'bg-purple-100 text-purple-700',
      streaming: 'bg-red-100 text-red-700',
      food: 'bg-orange-100 text-orange-700',
      fuel: 'bg-yellow-100 text-yellow-700',
      health: 'bg-green-100 text-green-700',
      lifestyle: 'bg-pink-100 text-pink-700',
      mobile: 'bg-cyan-100 text-cyan-700',
      utilities: 'bg-amber-100 text-amber-700',
      betting: 'bg-emerald-100 text-emerald-700',
      entertainment: 'bg-violet-100 text-violet-700',
    }
    return colors[category] || 'bg-gray-100 text-gray-700'
  }

  const getTypeIcon = (type: 'gift_card' | 'voucher') => {
    return type === 'gift_card' ? <Gift className="h-4 w-4" /> : <Ticket className="h-4 w-4" />
  }

  const getTypeColor = (type: 'gift_card' | 'voucher') => {
    return type === 'gift_card' ? 'bg-[#00897B]/10 text-[#00897B]' : 'bg-amber-100 text-amber-700'
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
              <Gift className="h-5 w-5 text-[#00897B]" />
              Gift Cards & Vouchers
            </h1>
            <p className="text-sm text-[#757575]">
              Third-party sales • Merchant issuance • SA compliant (3-year expiry on gift cards)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setBalanceInquiryOpen(true)}>
              <Search className="h-4 w-4 mr-2" />
              Balance Inquiry
            </Button>
            <Button variant="outline" onClick={() => setRedemptionDialogOpen(true)}>
              <Receipt className="h-4 w-4 mr-2" />
              Redeem
            </Button>
            <Button variant="outline" onClick={() => setExpiryAlertsOpen(true)}>
              <Timer className="h-4 w-4 mr-2" />
              Expiry Alerts
            </Button>
            <Button variant="outline" onClick={() => setCreateMerchantVoucherOpen(true)}>
              <Ticket className="h-4 w-4 mr-2" />
              Create Voucher
            </Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => { setWizardStep(1); setCreateMerchantCardOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Issue Gift Card
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col">
        <div className="border-b border-gray-200 px-6">
          <TabsList className="h-12 bg-transparent">
            <TabsTrigger value="catalog" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Third-Party Catalog
            </TabsTrigger>
            <TabsTrigger value="my-items" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Wallet className="h-4 w-4 mr-2" />
              Purchased ({stats.totalItems})
            </TabsTrigger>
            <TabsTrigger value="merchant-cards" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Gift className="h-4 w-4 mr-2" />
              My Gift Cards ({stats.merchantCards})
            </TabsTrigger>
            <TabsTrigger value="merchant-vouchers" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Ticket className="h-4 w-4 mr-2" />
              My Vouchers ({stats.merchantVouchers})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Catalog Tab */}
        <TabsContent value="catalog" className="flex-1 m-0 overflow-auto p-6">
          {/* SA Compliance Notice */}
          <Card className="mb-6 border-[#00897B]/30 bg-[#E0F2F1]/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-[#00897B] mt-0.5" />
                <div>
                  <h3 className="font-medium text-[#1A1A1A]">South African Gift Card Regulations (July 2024)</h3>
                  <p className="text-sm text-[#757575] mt-1">
                    Gift cards are valid for <strong>3 years (36 months)</strong> from date of issue. No admin fees may be charged during this period. 
                    Vouchers may have different expiry terms depending on type (airtime, betting, electricity, etc.).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search and Filter */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
              <Input
                placeholder="Search gift cards or vouchers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedType} onValueChange={(v) => setSelectedType(v as typeof selectedType)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="gift_card">Gift Cards</SelectItem>
                  <SelectItem value="voucher">Vouchers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category Quick Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              className={selectedCategory === 'all' ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}
              onClick={() => setSelectedCategory('all')}
            >
              All
            </Button>
            {['betting', 'mobile', 'retail', 'gaming', 'streaming', 'food', 'fuel', 'health', 'utilities'].map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                className={selectedCategory === cat ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'betting' && '🎰'}
                {cat === 'mobile' && '📱'}
                {cat === 'retail' && '🛒'}
                {cat === 'gaming' && '🎮'}
                {cat === 'streaming' && '📺'}
                {cat === 'food' && '🍔'}
                {cat === 'fuel' && '⛽'}
                {cat === 'health' && '💊'}
                {cat === 'utilities' && '💡'}
                <span className="ml-1">{getCategoryLabel(cat as GiftCardCategory)}</span>
              </Button>
            ))}
          </div>

          {/* Popular Section */}
          {selectedCategory === 'all' && selectedType === 'all' && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                South Africa's Most Popular
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {filteredProducts.filter(p => p.popular).slice(0, 12).map(product => (
                  <Card 
                    key={product.id}
                    className="cursor-pointer hover:border-[#00897B] hover:shadow-md transition-all"
                    onClick={() => {
                      setSelectedProduct(product)
                      setPurchaseForm(prev => ({ ...prev, denomination: product.denominations[0] }))
                      setPurchaseOpen(true)
                    }}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl mb-2">{product.logo}</div>
                      <p className="font-medium text-sm text-[#1A1A1A]">{product.name}</p>
                      <Badge className={`mt-2 text-[10px] ${getTypeColor(product.type)}`}>
                        {getTypeIcon(product.type)}
                        <span className="ml-1">{product.type === 'gift_card' ? 'Gift Card' : 'Voucher'}</span>
                      </Badge>
                      <p className="text-xs text-[#757575] mt-1">From R{product.denominations[0]}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* 1voucher & OTT Special Section */}
          {(selectedCategory === 'all' || selectedCategory === 'betting') && selectedType !== 'gift_card' && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-emerald-500" />
                Betting & Gaming Vouchers
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {thirdPartyVouchers.filter(v => v.category === 'betting').map(product => (
                  <Card 
                    key={product.id}
                    className="cursor-pointer hover:border-[#00897B] hover:shadow-md transition-all"
                    onClick={() => {
                      setSelectedProduct(product)
                      setPurchaseForm(prev => ({ ...prev, denomination: product.denominations[0] }))
                      setPurchaseOpen(true)
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="text-4xl">{product.logo}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-[#1A1A1A]">{product.name}</p>
                            <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Popular</Badge>
                          </div>
                          <p className="text-sm text-[#757575] mt-1">{product.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {product.platforms?.slice(0, 5).map(p => (
                              <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>
                            ))}
                            {product.platforms && product.platforms.length > 5 && (
                              <Badge variant="outline" className="text-[10px]">+{product.platforms.length - 5} more</Badge>
                            )}
                          </div>
                          <p className="text-xs text-[#757575] mt-2">
                            Denominations: {product.denominations.map(d => `R${d}`).join(', ')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* All Products */}
          <div>
            <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">
              {selectedType !== 'all' 
                ? selectedType === 'gift_card' ? 'All Gift Cards' : 'All Vouchers'
                : selectedCategory !== 'all' 
                  ? getCategoryLabel(selectedCategory as GiftCardCategory)
                  : 'All Gift Cards & Vouchers'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <Card 
                  key={product.id}
                  className="cursor-pointer hover:border-[#00897B] hover:shadow-md transition-all"
                  onClick={() => {
                    setSelectedProduct(product)
                    setPurchaseForm(prev => ({ ...prev, denomination: product.denominations[0] }))
                    setPurchaseOpen(true)
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{product.logo}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-[#1A1A1A]">{product.name}</p>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge className={`text-[10px] ${getTypeColor(product.type)}`}>
                            {getTypeIcon(product.type)}
                            <span className="ml-1">{product.type === 'gift_card' ? 'Gift Card' : 'Voucher'}</span>
                          </Badge>
                          <Badge className={`text-[10px] ${getCategoryColor(product.category)}`}>
                            {getCategoryLabel(product.category)}
                          </Badge>
                        </div>
                        <p className="text-xs text-[#757575] mt-1 line-clamp-2">{product.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {product.denominations.slice(0, 4).map(d => (
                            <Badge key={d} variant="outline" className="text-[10px]">
                              R{d}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2">
                          Expires: {product.expiryMonths >= 999 ? 'Never' : `${product.expiryMonths} months`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Purchased Items Tab */}
        <TabsContent value="my-items" className="flex-1 m-0 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {purchasedItems.map(item => {
              const product = allProducts.find(p => p.id === item.productId)
              return (
                <Card 
                  key={item.id}
                  className="cursor-pointer hover:border-[#00897B] hover:shadow-md transition-all"
                  onClick={() => {
                    setSelectedItem(item)
                    setItemDetailOpen(true)
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{product?.logo || '🎁'}</div>
                        <div>
                          <p className="font-medium text-[#1A1A1A]">{item.productName}</p>
                          <div className="flex items-center gap-1">
                            <Badge className={`text-[10px] ${getTypeColor(item.type)}`}>
                              {item.type === 'gift_card' ? 'Gift Card' : 'Voucher'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Badge className={
                        item.status === 'active' ? 'bg-green-100 text-green-700' :
                        item.status === 'redeemed' ? 'bg-gray-100 text-gray-700' :
                        'bg-red-100 text-red-700'
                      }>
                        {item.status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#757575]">Value</span>
                        <span className="font-bold text-[#00897B]">R{item.value}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#757575]">Code</span>
                        <span className="font-mono text-[#1A1A1A]">{item.code}</span>
                      </div>
                      {item.pin && (
                        <div className="flex justify-between text-sm">
                          <span className="text-[#757575]">PIN</span>
                          <span className="font-mono text-[#1A1A1A]">{item.pin}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-[#757575]">Expires</span>
                        <span className="text-[#1A1A1A]">{item.expiryDate}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Merchant Gift Cards Tab */}
        <TabsContent value="merchant-cards" className="flex-1 m-0 overflow-auto p-6">
          {/* SA Compliance Notice */}
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-[#1A1A1A]">Merchant Gift Card Obligations</h3>
                  <p className="text-sm text-[#757575] mt-1">
                    As a merchant issuing gift cards, you must comply with the Consumer Protection Act: 
                    Gift cards are valid for <strong>3 years</strong>, no admin fees for first 3 years, 
                    and you must maintain proper records of all issued cards.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-[#00897B]">{merchantGiftCards.length}</p>
                <p className="text-xs text-[#757575]">Active Cards</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-[#1A1A1A]">R{merchantGiftCards.reduce((sum, c) => sum + c.balance, 0).toLocaleString()}</p>
                <p className="text-xs text-[#757575]">Outstanding Balance</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-[#1A1A1A]">R{merchantGiftCards.reduce((sum, c) => sum + c.value, 0).toLocaleString()}</p>
                <p className="text-xs text-[#757575]">Total Issued</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-[#1A1A1A]">{merchantGiftCards.filter(c => c.status === 'redeemed').length}</p>
                <p className="text-xs text-[#757575]">Fully Redeemed</p>
              </CardContent>
            </Card>
          </div>

          {/* Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {merchantGiftCards.map(card => (
              <Card 
                key={card.id}
                className="cursor-pointer hover:border-[#00897B] hover:shadow-md transition-all"
                onClick={() => {
                  setSelectedMerchantCard(card)
                  setMerchantCardDetailOpen(true)
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-mono font-bold text-[#1A1A1A]">{card.cardNumber}</p>
                      {card.issuedTo && <p className="text-sm text-[#757575]">{card.issuedTo}</p>}
                    </div>
                    <Badge className={
                      card.status === 'active' ? 'bg-green-100 text-green-700' :
                      card.status === 'redeemed' ? 'bg-gray-100 text-gray-700' :
                      'bg-red-100 text-red-700'
                    }>
                      {card.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#757575]">Original Value</span>
                      <span className="text-[#1A1A1A]">R{card.value}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#757575]">Balance</span>
                      <span className="font-bold text-[#00897B]">R{card.balance}</span>
                    </div>
                    <Progress value={(card.balance / card.value) * 100} className="h-2" />
                    <div className="flex justify-between text-xs text-[#757575]">
                      <span>Issued: {card.issuedDate}</span>
                      <span>Expires: {card.expiryDate}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Merchant Vouchers Tab */}
        <TabsContent value="merchant-vouchers" className="flex-1 m-0 overflow-auto p-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-[#00897B]">{merchantVouchers.filter(v => v.status === 'active').length}</p>
                <p className="text-xs text-[#757575]">Active Vouchers</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-[#1A1A1A]">{merchantVouchers.reduce((sum, v) => sum + v.currentRedemptions, 0)}</p>
                <p className="text-xs text-[#757575]">Total Redemptions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-[#1A1A1A]">{merchantVouchers.filter(v => v.singleUse).length}</p>
                <p className="text-xs text-[#757575]">Single-Use</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-[#1A1A1A]">{merchantVouchers.filter(v => !v.singleUse).length}</p>
                <p className="text-xs text-[#757575]">Multi-Use</p>
              </CardContent>
            </Card>
          </div>

          {/* Vouchers Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Vouchers</CardTitle>
              <CardDescription>Vouchers you've created for customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {merchantVouchers.map(voucher => (
                  <div key={voucher.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center">
                        <Ticket className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-mono font-bold text-[#1A1A1A]">{voucher.code}</p>
                          <Badge className={
                            voucher.type === 'discount' ? 'bg-blue-100 text-blue-700' :
                            voucher.type === 'value' ? 'bg-green-100 text-green-700' :
                            'bg-purple-100 text-purple-700'
                          }>
                            {voucher.type === 'discount' ? `${voucher.value}% Off` : `R${voucher.value} Off`}
                          </Badge>
                        </div>
                        <p className="text-sm text-[#757575]">{voucher.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Valid: {voucher.validFrom} to {voucher.validTo} • 
                          {voucher.singleUse ? 'Single use' : 'Multi-use'} •
                          {voucher.currentRedemptions}/{voucher.maxRedemptions} redeemed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={
                        voucher.status === 'active' ? 'bg-green-100 text-green-700' :
                        voucher.status === 'paused' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }>
                        {voucher.status}
                      </Badge>
                      <Button variant="ghost" size="icon">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="flex-1 m-0 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sales by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['gift_card', 'voucher'].map(type => {
                    const items = purchasedItems.filter(p => p.type === type)
                    const value = items.reduce((sum, p) => sum + p.value, 0)
                    const percentage = (value / (stats.totalValue || 1)) * 100
                    
                    return (
                      <div key={type} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#757575] capitalize">{type.replace('_', ' ')}s</span>
                          <span className="font-medium text-[#1A1A1A]">R{value.toLocaleString()}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${type === 'gift_card' ? 'bg-[#00897B]' : 'bg-amber-500'}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Key Metrics (Month)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#E0F2F1] rounded-lg">
                    <p className="text-2xl font-bold text-[#00897B]">R{stats.revenue.toFixed(0)}</p>
                    <p className="text-sm text-[#757575]">Commission Earned</p>
                  </div>
                  <div className="p-4 bg-gray-100 rounded-lg">
                    <p className="text-2xl font-bold text-[#1A1A1A]">{stats.totalItems}</p>
                    <p className="text-sm text-[#757575]">Items Sold</p>
                  </div>
                  <div className="p-4 bg-gray-100 rounded-lg">
                    <p className="text-2xl font-bold text-[#1A1A1A]">{stats.giftCards}</p>
                    <p className="text-sm text-[#757575]">Gift Cards</p>
                  </div>
                  <div className="p-4 bg-gray-100 rounded-lg">
                    <p className="text-2xl font-bold text-[#1A1A1A]">{stats.vouchers}</p>
                    <p className="text-sm text-[#757575]">Vouchers</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SA Market Insights */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#00897B]" />
                  South African Gift Card & Voucher Market
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4">
                    <p className="text-3xl font-bold text-[#00897B]">$1.64B</p>
                    <p className="text-sm text-[#757575]">Market Size 2026</p>
                  </div>
                  <div className="text-center p-4">
                    <p className="text-3xl font-bold text-[#00897B]">11.3%</p>
                    <p className="text-sm text-[#757575]">Annual Growth</p>
                  </div>
                  <div className="text-center p-4">
                    <p className="text-3xl font-bold text-[#00897B]">78%</p>
                    <p className="text-sm text-[#757575]">Corporate Adoption</p>
                  </div>
                  <div className="text-center p-4">
                    <p className="text-3xl font-bold text-[#00897B]">~45%</p>
                    <p className="text-sm text-[#757575]">Digital Share</p>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#757575]">
                    <span className="font-medium text-[#1A1A1A]">3-Year Expiry</span> mandated by Consumer Protection Act (July 2024)
                  </p>
                  <Badge className="bg-green-100 text-green-700">Compliant</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Purchase Dialog */}
      <Dialog open={purchaseOpen} onOpenChange={setPurchaseOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-2xl">{selectedProduct.logo}</span>
                  Purchase {selectedProduct.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedProduct.description}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-2">
                  <Badge className={getTypeColor(selectedProduct.type)}>
                    {getTypeIcon(selectedProduct.type)}
                    <span className="ml-1">{selectedProduct.type === 'gift_card' ? 'Gift Card' : 'Voucher'}</span>
                  </Badge>
                  <Badge className={getCategoryColor(selectedProduct.category)}>
                    {getCategoryLabel(selectedProduct.category)}
                  </Badge>
                </div>
                
                {selectedProduct.platforms && (
                  <div>
                    <p className="text-xs text-[#757575] mb-2">Accepted on:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedProduct.platforms.map(p => (
                        <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-[#1A1A1A] mb-2 block">Select Value</label>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedProduct.denominations.map(d => (
                      <Button
                        key={d}
                        variant={purchaseForm.denomination === d ? 'default' : 'outline'}
                        className={purchaseForm.denomination === d ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}
                        onClick={() => setPurchaseForm(prev => ({ ...prev, denomination: d }))}
                      >
                        R{d}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[#1A1A1A] mb-1 block">Your Name</label>
                    <Input 
                      value={purchaseForm.purchaserName}
                      onChange={(e) => setPurchaseForm(prev => ({ ...prev, purchaserName: e.target.value }))}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1A1A1A] mb-1 block">Phone</label>
                    <Input 
                      value={purchaseForm.purchaserPhone}
                      onChange={(e) => setPurchaseForm(prev => ({ ...prev, purchaserPhone: e.target.value }))}
                      placeholder="082 123 4567"
                    />
                  </div>
                </div>
                
                <Separator />
                <p className="text-sm text-[#757575]">
                  <strong>Expiry:</strong> {selectedProduct.expiryMonths >= 999 ? 'Never' : `${selectedProduct.expiryMonths} months from purchase`}
                </p>
              </div>
              <DialogFooter className="flex-col gap-2">
                <div className="flex items-center justify-between w-full p-3 bg-[#E0F2F1] rounded-lg">
                  <span className="text-sm text-[#757575]">Total</span>
                  <span className="text-xl font-bold text-[#00897B]">R{purchaseForm.denomination}</span>
                </div>
                <Button 
                  className="w-full bg-[#00897B] hover:bg-[#00695C]"
                  disabled={purchaseForm.denomination === 0 || !purchaseForm.purchaserName}
                  onClick={handlePurchase}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Purchase {selectedProduct.type === 'gift_card' ? 'Gift Card' : 'Voucher'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Merchant Gift Card Dialog */}
      <Dialog open={createMerchantCardOpen} onOpenChange={setCreateMerchantCardOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-[#00897B]" />
              Issue Merchant Gift Card
            </DialogTitle>
            <DialogDescription>
              Create a gift card for your business (3-year expiry as per SA law)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-[#1A1A1A] mb-2 block">Value (R)</label>
              <Input 
                type="number"
                value={merchantCardForm.value}
                onChange={(e) => setMerchantCardForm(prev => ({ ...prev, value: parseInt(e.target.value) || 0 }))}
                placeholder="100"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[#1A1A1A] mb-1 block">Issued To (Optional)</label>
                <Input 
                  value={merchantCardForm.issuedTo}
                  onChange={(e) => setMerchantCardForm(prev => ({ ...prev, issuedTo: e.target.value }))}
                  placeholder="Customer name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1A1A1A] mb-1 block">Phone (Optional)</label>
                <Input 
                  value={merchantCardForm.issuedPhone}
                  onChange={(e) => setMerchantCardForm(prev => ({ ...prev, issuedPhone: e.target.value }))}
                  placeholder="082 123 4567"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[#1A1A1A] mb-2 block">Design</label>
              <Select value={merchantCardForm.design} onValueChange={(v) => setMerchantCardForm(prev => ({ ...prev, design: v as typeof merchantCardForm.design }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (Free)</SelectItem>
                  <SelectItem value="premium">Premium (+R10)</SelectItem>
                  <SelectItem value="seasonal">Seasonal (+R15)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-[#1A1A1A] mb-1 block">Custom Message (Optional)</label>
              <Input 
                value={merchantCardForm.customMessage}
                onChange={(e) => setMerchantCardForm(prev => ({ ...prev, customMessage: e.target.value }))}
                placeholder="Happy Birthday! 🎂"
              />
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
              <p className="text-xs text-amber-700">
                <strong>SA Compliance:</strong> Gift card will expire 3 years from today as mandated by the Consumer Protection Act.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateMerchantCardOpen(false)}>Cancel</Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]"
              disabled={merchantCardForm.value <= 0}
              onClick={handleCreateMerchantCard}
            >
              Issue Gift Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Merchant Voucher Dialog */}
      <Dialog open={createMerchantVoucherOpen} onOpenChange={setCreateMerchantVoucherOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-[#00897B]" />
              Create Merchant Voucher
            </DialogTitle>
            <DialogDescription>
              Create a promotional voucher for your customers
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-[#1A1A1A] mb-2 block">Voucher Type</label>
              <Select value={merchantVoucherForm.type} onValueChange={(v) => setMerchantVoucherForm(prev => ({ ...prev, type: v as typeof merchantVoucherForm.type }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discount">Percentage Discount</SelectItem>
                  <SelectItem value="value">Fixed Value Off</SelectItem>
                  <SelectItem value="product">Free Product</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-[#1A1A1A] mb-2 block">
                {merchantVoucherForm.type === 'discount' ? 'Discount (%)' : 'Value (R)'}
              </label>
              <Input 
                type="number"
                value={merchantVoucherForm.value}
                onChange={(e) => setMerchantVoucherForm(prev => ({ ...prev, value: parseInt(e.target.value) || 0 }))}
                placeholder={merchantVoucherForm.type === 'discount' ? '10' : '50'}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#1A1A1A] mb-1 block">Description</label>
              <Input 
                value={merchantVoucherForm.description}
                onChange={(e) => setMerchantVoucherForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="10% off all hair treatments"
              />
            </div>
            {merchantVoucherForm.type !== 'product' && (
              <div>
                <label className="text-sm font-medium text-[#1A1A1A] mb-1 block">Minimum Purchase (R)</label>
                <Input 
                  type="number"
                  value={merchantVoucherForm.minPurchase}
                  onChange={(e) => setMerchantVoucherForm(prev => ({ ...prev, minPurchase: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[#1A1A1A] mb-1 block">Valid For (Days)</label>
                <Input 
                  type="number"
                  value={merchantVoucherForm.validDays}
                  onChange={(e) => setMerchantVoucherForm(prev => ({ ...prev, validDays: parseInt(e.target.value) || 90 }))}
                  placeholder="90"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1A1A1A] mb-1 block">Max Redemptions</label>
                <Input 
                  type="number"
                  value={merchantVoucherForm.maxRedemptions}
                  onChange={(e) => setMerchantVoucherForm(prev => ({ ...prev, maxRedemptions: parseInt(e.target.value) || 100 }))}
                  placeholder="100"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="singleUse"
                checked={merchantVoucherForm.singleUse}
                onChange={(e) => setMerchantVoucherForm(prev => ({ ...prev, singleUse: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="singleUse" className="text-sm text-[#757575]">Single-use per customer</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateMerchantVoucherOpen(false)}>Cancel</Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]"
              disabled={!merchantVoucherForm.description || merchantVoucherForm.value <= 0}
              onClick={handleCreateMerchantVoucher}
            >
              Create Voucher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Detail Dialog */}
      <Dialog open={itemDetailOpen} onOpenChange={setItemDetailOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-2xl">{allProducts.find(p => p.id === selectedItem.productId)?.logo}</span>
                  {selectedItem.productName}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-6 bg-gradient-to-br from-[#00897B] to-[#4CAF50] rounded-xl text-white text-center">
                  <p className="text-sm opacity-80 mb-1">{selectedItem.type === 'gift_card' ? 'Gift Card' : 'Voucher'} Value</p>
                  <p className="text-4xl font-bold">R{selectedItem.value}</p>
                  <Badge className="mt-2 bg-white/20 text-white">
                    {selectedItem.status}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-[#757575]">Code</p>
                      <p className="font-mono font-bold text-[#1A1A1A]">{selectedItem.code}</p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {selectedItem.pin && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-xs text-[#757575]">PIN</p>
                        <p className="font-mono font-bold text-[#1A1A1A]">{selectedItem.pin}</p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-[#757575]">Expiry Date</p>
                      <p className="font-medium text-[#1A1A1A]">{selectedItem.expiryDate}</p>
                    </div>
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  
                  {selectedItem.recipientName && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-[#757575]">Recipient</p>
                      <p className="font-medium text-[#1A1A1A]">{selectedItem.recipientName}</p>
                      {selectedItem.recipientPhone && <p className="text-sm text-[#757575]">{selectedItem.recipientPhone}</p>}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setItemDetailOpen(false)}>Close</Button>
                <Button className="bg-[#00897B] hover:bg-[#00695C]">
                  <QrCode className="h-4 w-4 mr-2" />
                  Show QR
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Merchant Card Detail Dialog */}
      <Dialog open={merchantCardDetailOpen} onOpenChange={setMerchantCardDetailOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedMerchantCard && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-[#00897B]" />
                  Gift Card {selectedMerchantCard.cardNumber}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-6 bg-gradient-to-br from-[#00897B] to-[#4CAF50] rounded-xl text-white text-center">
                  <p className="text-sm opacity-80 mb-1">Available Balance</p>
                  <p className="text-4xl font-bold">R{selectedMerchantCard.balance}</p>
                  <p className="text-sm opacity-80 mt-1">of R{selectedMerchantCard.value} original</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#757575]">PIN</span>
                    <span className="font-mono font-bold text-[#1A1A1A]">{selectedMerchantCard.pin}</span>
                  </div>
                  {selectedMerchantCard.issuedTo && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#757575]">Issued To</span>
                      <span className="text-[#1A1A1A]">{selectedMerchantCard.issuedTo}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-[#757575]">Issued</span>
                    <span className="text-[#1A1A1A]">{selectedMerchantCard.issuedDate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#757575]">Expires</span>
                    <span className="text-[#1A1A1A]">{selectedMerchantCard.expiryDate}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A] mb-2">Transaction History</p>
                  <div className="space-y-2 max-h-32 overflow-auto">
                    {selectedMerchantCard.transactions.map(txn => (
                      <div key={txn.id} className="flex justify-between text-xs p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <Badge className={
                            txn.type === 'issue' ? 'bg-blue-100 text-blue-700' :
                            txn.type === 'redeem' ? 'bg-red-100 text-red-700' :
                            txn.type === 'topup' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }>
                            {txn.type}
                          </Badge>
                          <span className="text-gray-400">{txn.date}</span>
                        </div>
                        <div className="text-right">
                          <span className={txn.type === 'redeem' ? 'text-red-600' : 'text-green-600'}>
                            {txn.type === 'redeem' ? '-' : '+'}R{txn.amount}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter className="flex-col gap-2">
                <div className="flex gap-2 w-full">
                  <Button variant="outline" className="flex-1">
                    Top Up
                  </Button>
                  <Button className="flex-1 bg-[#00897B] hover:bg-[#00695C]">
                    Redeem
                  </Button>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setMerchantCardDetailOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Balance Inquiry Dialog */}
      <Dialog open={balanceInquiryOpen} onOpenChange={setBalanceInquiryOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-[#00897B]" />
              Balance Inquiry
            </DialogTitle>
            <DialogDescription>
              Check the balance of a gift card or voucher
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-[#757575]">Card Number or Voucher Code</Label>
              <Input 
                placeholder="Enter code (e.g., GC-2026-00001 or VCH-ABC123)" 
                value={balanceInquiryCode}
                onChange={e => setBalanceInquiryCode(e.target.value)}
                className="mt-1"
              />
            </div>
            
            {balanceInquiryCode && (
              <Card className="bg-[#E0F2F1]/50 border-[#00897B]/20">
                <CardContent className="p-4">
                  {(() => {
                    const card = merchantGiftCards.find(c => c.cardNumber.toLowerCase() === balanceInquiryCode.toLowerCase())
                    const voucher = merchantVouchers.find(v => v.code.toLowerCase() === balanceInquiryCode.toLowerCase())
                    const purchased = purchasedItems.find(p => p.code.toLowerCase() === balanceInquiryCode.toLowerCase())
                    
                    if (card) {
                      return (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Gift className="h-5 w-5 text-[#00897B]" />
                            <span className="font-medium">Gift Card Found</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-[#757575]">Issued To:</span> <span className="font-medium">{card.issuedTo || 'N/A'}</span></div>
                            <div><span className="text-[#757575]">Original Value:</span> <span className="font-medium">R{card.value}</span></div>
                            <div><span className="text-[#757575]">Current Balance:</span> <span className="font-bold text-[#00897B] text-lg">R{card.balance}</span></div>
                            <div><span className="text-[#757575]">Expiry:</span> <span className="font-medium">{card.expiryDate}</span></div>
                            <div><span className="text-[#757575]">Status:</span> <Badge className={card.status === 'active' ? 'bg-green-100 text-green-700' : card.status === 'expired' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}>{card.status}</Badge></div>
                          </div>
                        </div>
                      )
                    } else if (voucher) {
                      return (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Ticket className="h-5 w-5 text-amber-600" />
                            <span className="font-medium">Voucher Found</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-[#757575]">Code:</span> <span className="font-mono font-bold">{voucher.code}</span></div>
                            <div><span className="text-[#757575]">Type:</span> <span className="font-medium capitalize">{voucher.type}</span></div>
                            <div><span className="text-[#757575]">Value:</span> <span className="font-bold text-[#00897B]">{voucher.type === 'discount' ? `${voucher.value}%` : `R${voucher.value}`}</span></div>
                            <div><span className="text-[#757575]">Redemptions:</span> <span className="font-medium">{voucher.currentRedemptions}/{voucher.maxRedemptions}</span></div>
                            <div><span className="text-[#757575]">Valid Until:</span> <span className="font-medium">{voucher.validTo}</span></div>
                            <div><span className="text-[#757575]">Status:</span> <Badge className={voucher.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{voucher.status}</Badge></div>
                          </div>
                        </div>
                      )
                    } else if (purchased) {
                      return (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {purchased.type === 'gift_card' ? <Gift className="h-5 w-5 text-[#00897B]" /> : <Ticket className="h-5 w-5 text-amber-600" />}
                            <span className="font-medium">Third-Party {purchased.type === 'gift_card' ? 'Gift Card' : 'Voucher'} Found</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-[#757575]">Product:</span> <span className="font-medium">{purchased.productName}</span></div>
                            <div><span className="text-[#757575]">Value:</span> <span className="font-bold text-[#00897B]">R{purchased.value}</span></div>
                            <div><span className="text-[#757575]">Expiry:</span> <span className="font-medium">{purchased.expiryDate}</span></div>
                            <div><span className="text-[#757575]">Status:</span> <Badge className={purchased.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{purchased.status}</Badge></div>
                          </div>
                        </div>
                      )
                    } else {
                      return (
                        <div className="text-center py-4">
                          <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-[#757575]">No matching card or voucher found</p>
                        </div>
                      )
                    }
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setBalanceInquiryOpen(false); setBalanceInquiryCode(''); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Redemption Dialog */}
      <Dialog open={redemptionDialogOpen} onOpenChange={setRedemptionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-[#00897B]" />
              Redeem Gift Card / Voucher
            </DialogTitle>
            <DialogDescription>
              Process a redemption for a gift card or voucher
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-[#757575]">Card/Voucher Code</Label>
              <Input 
                placeholder="Enter code" 
                value={redemptionForm.code}
                onChange={e => setRedemptionForm(prev => ({ ...prev, code: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs text-[#757575]">Redemption Amount (R)</Label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={redemptionForm.amount || ''}
                onChange={e => setRedemptionForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label className="text-xs text-[#757575]">Staff Member</Label>
              <Input 
                placeholder="Staff name" 
                value={redemptionForm.staffMember}
                onChange={e => setRedemptionForm(prev => ({ ...prev, staffMember: e.target.value }))}
              />
            </div>
            
            {redemptionForm.code && (
              <Card className="bg-gray-50">
                <CardContent className="p-3">
                  {(() => {
                    const card = merchantGiftCards.find(c => c.cardNumber.toLowerCase() === redemptionForm.code.toLowerCase())
                    const voucher = merchantVouchers.find(v => v.code.toLowerCase() === redemptionForm.code.toLowerCase())
                    
                    if (card) {
                      const isValid = card.status === 'active' && card.balance >= redemptionForm.amount
                      return (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Available Balance:</span>
                            <span className="font-bold text-[#00897B]">R{card.balance}</span>
                          </div>
                          {redemptionForm.amount > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Balance After:</span>
                              <span className={`font-bold ${card.balance >= redemptionForm.amount ? 'text-green-600' : 'text-red-600'}`}>
                                R{card.balance - redemptionForm.amount}
                              </span>
                            </div>
                          )}
                          <Badge className={isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                            {isValid ? '✓ Valid for redemption' : '✗ Cannot redeem (insufficient balance or inactive)'}
                          </Badge>
                        </div>
                      )
                    } else if (voucher) {
                      return (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Voucher Type:</span>
                            <span className="font-medium capitalize">{voucher.type}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Value:</span>
                            <span className="font-bold text-[#00897B]">{voucher.type === 'discount' ? `${voucher.value}% off` : `R${voucher.value}`}</span>
                          </div>
                          <Badge className={voucher.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                            {voucher.status === 'active' ? '✓ Voucher is active' : '✗ Voucher is not active'}
                          </Badge>
                        </div>
                      )
                    }
                    return <p className="text-sm text-[#757575] text-center py-2">Enter a code to see details</p>
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => { setRedemptionDialogOpen(false); setRedemptionForm({ code: '', amount: 0, staffMember: '' }); }}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">
              <Receipt className="h-4 w-4 mr-2" />Process Redemption
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expiry Alerts Dialog */}
      <Dialog open={expiryAlertsOpen} onOpenChange={setExpiryAlertsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-amber-600" />
              Expiry Management
            </DialogTitle>
            <DialogDescription>
              Monitor and manage gift cards and vouchers approaching expiry
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Expiry Summary */}
            <div className="grid grid-cols-4 gap-3">
              <Card className="bg-red-50">
                <CardContent className="p-3 text-center">
                  <p className="text-xl font-bold text-red-600">{merchantGiftCards.filter(c => c.status === 'expired').length}</p>
                  <p className="text-xs text-red-600">Expired</p>
                </CardContent>
              </Card>
              <Card className="bg-amber-50">
                <CardContent className="p-3 text-center">
                  <p className="text-xl font-bold text-amber-600">{merchantGiftCards.filter(c => {
                    const daysToExpiry = Math.ceil((new Date(c.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    return daysToExpiry > 0 && daysToExpiry <= 30 && c.status === 'active'
                  }).length}</p>
                  <p className="text-xs text-amber-600">Expiring in 30 days</p>
                </CardContent>
              </Card>
              <Card className="bg-yellow-50">
                <CardContent className="p-3 text-center">
                  <p className="text-xl font-bold text-yellow-600">{merchantGiftCards.filter(c => {
                    const daysToExpiry = Math.ceil((new Date(c.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    return daysToExpiry > 30 && daysToExpiry <= 90 && c.status === 'active'
                  }).length}</p>
                  <p className="text-xs text-yellow-600">Expiring in 90 days</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50">
                <CardContent className="p-3 text-center">
                  <p className="text-xl font-bold text-green-600">{merchantGiftCards.filter(c => c.status === 'active').length}</p>
                  <p className="text-xs text-green-600">Active</p>
                </CardContent>
              </Card>
            </div>

            {/* Expiring Soon List */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Cards Expiring Within 90 Days
              </h4>
              <ScrollArea className="max-h-64">
                <div className="space-y-2">
                  {merchantGiftCards
                    .filter(c => {
                      const daysToExpiry = Math.ceil((new Date(c.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      return daysToExpiry > 0 && daysToExpiry <= 90 && c.status === 'active'
                    })
                    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
                    .map(card => {
                      const daysToExpiry = Math.ceil((new Date(card.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      return (
                        <div key={card.id} className={`flex items-center gap-3 p-3 rounded-lg border ${daysToExpiry <= 30 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                          <Gift className={`h-5 w-5 ${daysToExpiry <= 30 ? 'text-red-500' : 'text-amber-500'}`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{card.cardNumber}</span>
                              <span className="text-xs text-[#757575]">{card.issuedTo || 'Unassigned'}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-[#757575]">
                              <span>Balance: R{card.balance}</span>
                              <span>Expires: {card.expiryDate}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={daysToExpiry <= 30 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
                              {daysToExpiry} days left
                            </Badge>
                          </div>
                          <Button size="sm" variant="outline">
                            <Phone className="h-3 w-3 mr-1" />
                            Remind
                          </Button>
                        </div>
                      )
                    })}
                  {merchantGiftCards.filter(c => {
                    const daysToExpiry = Math.ceil((new Date(c.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    return daysToExpiry > 0 && daysToExpiry <= 90 && c.status === 'active'
                  }).length === 0 && (
                    <div className="text-center py-4 text-[#757575]">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p>No cards expiring soon</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Voucher Expiry */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Ticket className="h-4 w-4 text-amber-500" />
                Vouchers Expiring Within 90 Days
              </h4>
              <ScrollArea className="max-h-48">
                <div className="space-y-2">
                  {merchantVouchers
                    .filter(v => {
                      const daysToExpiry = Math.ceil((new Date(v.validTo).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      return daysToExpiry > 0 && daysToExpiry <= 90 && v.status === 'active'
                    })
                    .sort((a, b) => new Date(a.validTo).getTime() - new Date(b.validTo).getTime())
                    .map(voucher => {
                      const daysToExpiry = Math.ceil((new Date(voucher.validTo).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      return (
                        <div key={voucher.id} className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50">
                          <Ticket className="h-5 w-5 text-amber-500" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm">{voucher.code}</span>
                              <span className="text-xs text-[#757575]">{voucher.description}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-[#757575]">
                              <span>Value: {voucher.type === 'discount' ? `${voucher.value}%` : `R${voucher.value}`}</span>
                              <span>Used: {voucher.currentRedemptions}/{voucher.maxRedemptions}</span>
                            </div>
                          </div>
                          <Badge className={daysToExpiry <= 30 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
                            {daysToExpiry} days left
                          </Badge>
                        </div>
                      )
                    })}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpiryAlertsOpen(false)}>Close</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">
              <Phone className="h-4 w-4 mr-2" />Send Bulk Reminders
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gift Card Creation Wizard Dialog */}
      <Dialog open={createMerchantCardOpen} onOpenChange={(open) => { setCreateMerchantCardOpen(open); if (!open) setWizardStep(1); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-[#00897B]" />
              Issue Gift Card
            </DialogTitle>
            <DialogDescription>
              Step {wizardStep} of 3 - {wizardStep === 1 ? 'Card Details' : wizardStep === 2 ? 'Recipient Information' : 'Review & Confirm'}
            </DialogDescription>
          </DialogHeader>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map(step => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  wizardStep >= step ? 'bg-[#00897B] text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {wizardStep > step ? <CheckCircle2 className="h-4 w-4" /> : step}
                </div>
                {step < 3 && <div className={`w-16 h-1 mx-1 ${wizardStep > step ? 'bg-[#00897B]' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {wizardStep === 1 && (
              <>
                <div>
                  <Label className="text-xs text-[#757575]">Card Value (R)</Label>
                  <Select value={merchantCardForm.value.toString()} onValueChange={v => setMerchantCardForm(prev => ({ ...prev, value: parseInt(v) }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[50, 100, 200, 500, 1000, 2000, 5000].map(val => (
                        <SelectItem key={val} value={val.toString()}>R{val}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-[#757575]">Card Design</Label>
                  <Select value={merchantCardForm.design} onValueChange={(v: 'standard' | 'premium' | 'seasonal') => setMerchantCardForm(prev => ({ ...prev, design: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (Free)</SelectItem>
                      <SelectItem value="premium">Premium (+R25)</SelectItem>
                      <SelectItem value="seasonal">Seasonal (+R50)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-xs text-[#757575]">
                  <Shield className="h-4 w-4 inline mr-1" />
                  Cards expire 3 years from issue date (SA Consumer Protection Act compliant)
                </div>
              </>
            )}

            {wizardStep === 2 && (
              <>
                <div>
                  <Label className="text-xs text-[#757575]">Recipient Name (Optional)</Label>
                  <Input 
                    placeholder="John Doe" 
                    value={merchantCardForm.issuedTo}
                    onChange={e => setMerchantCardForm(prev => ({ ...prev, issuedTo: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#757575]">Recipient Phone (Optional)</Label>
                  <Input 
                    placeholder="+27 82 123 4567" 
                    value={merchantCardForm.issuedPhone}
                    onChange={e => setMerchantCardForm(prev => ({ ...prev, issuedPhone: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#757575]">Custom Message (Optional)</Label>
                  <Textarea 
                    placeholder="Happy Birthday! Enjoy your gift." 
                    value={merchantCardForm.customMessage}
                    onChange={e => setMerchantCardForm(prev => ({ ...prev, customMessage: e.target.value }))}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </>
            )}

            {wizardStep === 3 && (
              <div className="space-y-3">
                <Card className="bg-[#E0F2F1]/50 border-[#00897B]/20">
                  <CardContent className="p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#757575]">Card Value:</span>
                        <span className="font-bold text-[#00897B]">R{merchantCardForm.value}</span>
                      </div>
                      {merchantCardForm.issuedTo && (
                        <div className="flex justify-between">
                          <span className="text-[#757575]">Recipient:</span>
                          <span className="font-medium">{merchantCardForm.issuedTo}</span>
                        </div>
                      )}
                      {merchantCardForm.issuedPhone && (
                        <div className="flex justify-between">
                          <span className="text-[#757575]">Phone:</span>
                          <span className="font-medium">{merchantCardForm.issuedPhone}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-[#757575]">Design:</span>
                        <span className="font-medium capitalize">{merchantCardForm.design}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#757575]">Expiry Date:</span>
                        <span className="font-medium">{new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}</span>
                      </div>
                      {merchantCardForm.customMessage && (
                        <div className="pt-2 border-t mt-2">
                          <span className="text-[#757575]">Message:</span>
                          <p className="mt-1 text-[#1A1A1A]">{merchantCardForm.customMessage}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            {wizardStep > 1 && (
              <Button variant="outline" onClick={() => setWizardStep(wizardStep - 1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />Back
              </Button>
            )}
            {wizardStep < 3 ? (
              <Button className="bg-[#00897B] hover:bg-[#00695C] ml-auto" onClick={() => setWizardStep(wizardStep + 1)}>
                Next<ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button className="bg-[#00897B] hover:bg-[#00695C] ml-auto" onClick={handleCreateMerchantCard}>
                <CheckCircle2 className="h-4 w-4 mr-2" />Issue Gift Card
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default VouchersAndGiftCardsView
