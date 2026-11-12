'use client'

import { useState, useEffect } from 'react'
import {
  FileText,
  Clock,
  CheckCircle2,
  DollarSign,
  Package,
  Search,
  Send,
  Timer,
  AlertCircle,
  MessageSquare,
  Building2,
  Calendar,
  Eye,
  XCircle,
  TrendingUp,
  Award,
  Target,
  Zap,
  RefreshCw,
  Download,
  Plus,
  Minus,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSupplierAuth } from '../layout'

interface RFQItem {
  id: string
  sku: string
  name: string
  description: string
  quantity: number
  unit: string
  specifications?: string
  quotedPrice?: number
  quotedLeadTime?: number
  inStock?: boolean
  notes?: string
}

interface RFQMessage {
  id: string
  sender: 'supplier' | 'buyer' | 'system'
  senderName: string
  content: string
  timestamp: string
}

interface Quote {
  id: string
  rfqId: string
  status: 'draft' | 'submitted' | 'accepted' | 'rejected' | 'expired'
  items: {
    id: string
    quotedPrice: number
    leadTime: number
    inStock: boolean
    notes?: string
  }[]
  totalAmount: number
  validUntil: string
  submittedAt?: string
  terms?: string
}

interface RFQ {
  id: string
  number: string
  merchant: {
    id: string
    name: string
    contactPerson: string
    email: string
    phone: string
    tier: string
  }
  items: RFQItem[]
  status: 'open' | 'quoted' | 'accepted' | 'rejected' | 'expired' | 'closed'
  deadline: string
  createdAt: string
  deliveryLocation: string
  paymentTerms: string
  requirements?: string
  potentialValue: number
  competitorQuotes: number
  myQuote?: Quote
  messages: RFQMessage[]
  bidRank?: number
  totalBidders?: number
}

const mockRFQs: RFQ[] = [
  {
    id: 'RFQ-001',
    number: 'RFQ-2026-0200',
    merchant: {
      id: 'MER-001',
      name: 'QuickSpar Foods',
      contactPerson: 'John Mokoena',
      email: 'procurement@quickspar.co.za',
      phone: '+27 82 123 4567',
      tier: 'gold'
    },
    items: [
      { id: 'ITM-001', sku: 'FP-100', name: 'Fresh Vegetables Mix', description: 'Mixed seasonal vegetables, Grade A', quantity: 50, unit: 'kg', specifications: 'No preservatives, organic preferred' },
      { id: 'ITM-002', sku: 'FP-101', name: 'Potatoes 10kg Bag', description: 'Washed potatoes, medium size', quantity: 100, unit: 'bags', specifications: 'Firm, no green spots' },
      { id: 'ITM-003', sku: 'FP-102', name: 'Onions 10kg Bag', description: 'Brown onions', quantity: 80, unit: 'bags', specifications: 'Dry, firm outer skin' },
    ],
    status: 'open',
    deadline: '2026-01-17T18:00:00',
    createdAt: '2026-01-15T10:00:00',
    deliveryLocation: 'Johannesburg Distribution Center',
    paymentTerms: 'Net 30',
    requirements: 'Looking for reliable supplier with consistent quality. Preference for suppliers with cold chain logistics.',
    potentialValue: 25000,
    competitorQuotes: 2,
    messages: [
      { id: 'MSG-001', sender: 'buyer', senderName: 'John Mokoena', content: 'We need urgent delivery by Friday. Can you accommodate?', timestamp: '2026-01-15T14:00:00' }
    ]
  },
  {
    id: 'RFQ-002',
    number: 'RFQ-2026-0201',
    merchant: {
      id: 'MER-002',
      name: 'Fresh Market SA',
      contactPerson: 'Sarah van der Berg',
      email: 'buying@freshmarket.co.za',
      phone: '+27 83 234 5678',
      tier: 'platinum'
    },
    items: [
      { id: 'ITM-004', sku: 'DR-200', name: 'Full Cream Milk 1L', description: 'Fresh pasteurized milk', quantity: 200, unit: 'liters', specifications: '3.5% fat content minimum' },
      { id: 'ITM-005', sku: 'DR-201', name: 'Greek Yogurt 500g', description: 'Plain Greek yogurt', quantity: 100, unit: 'tubs', specifications: 'No added sugar, live cultures' },
    ],
    status: 'open',
    deadline: '2026-01-18T12:00:00',
    createdAt: '2026-01-14T09:00:00',
    deliveryLocation: 'Sandton Store',
    paymentTerms: 'Net 15',
    potentialValue: 18000,
    competitorQuotes: 1,
    messages: []
  },
  {
    id: 'RFQ-003',
    number: 'RFQ-2026-0202',
    merchant: {
      id: 'MER-003',
      name: 'City Butchery',
      contactPerson: 'Peter Nkosi',
      email: 'orders@citybutchery.co.za',
      phone: '+27 84 345 6789',
      tier: 'silver'
    },
    items: [
      { id: 'ITM-006', sku: 'PK-300', name: 'Vacuum Packaging Rolls', description: 'Food-grade vacuum bags', quantity: 50, unit: 'rolls', specifications: '30cm width, 500m per roll' },
      { id: 'ITM-007', sku: 'CL-301', name: 'Food-Safe Sanitizer', description: 'Industrial sanitizer concentrate', quantity: 20, unit: 'containers', specifications: 'SABS approved, 5L containers' },
    ],
    status: 'quoted',
    deadline: '2026-01-16T10:00:00',
    createdAt: '2026-01-13T08:00:00',
    deliveryLocation: 'Pretoria Warehouse',
    paymentTerms: 'Net 30',
    potentialValue: 12000,
    competitorQuotes: 3,
    myQuote: {
      id: 'QTE-001',
      rfqId: 'RFQ-003',
      status: 'submitted',
      items: [
        { id: 'ITM-006', quotedPrice: 85.00, leadTime: 2, inStock: true },
        { id: 'ITM-007', quotedPrice: 120.00, leadTime: 2, inStock: true }
      ],
      totalAmount: 6650.00,
      validUntil: '2026-01-20',
      submittedAt: '2026-01-14T16:00:00',
      terms: 'Standard terms apply. Free delivery for orders over R5000.'
    },
    bidRank: 2,
    totalBidders: 4,
    messages: [
      { id: 'MSG-002', sender: 'supplier', senderName: 'Demo Supplier', content: 'Quote submitted. We can deliver within 48 hours.', timestamp: '2026-01-14T16:05:00' }
    ]
  },
  {
    id: 'RFQ-004',
    number: 'RFQ-2026-0203',
    merchant: {
      id: 'MER-004',
      name: 'Metro Supermarket',
      contactPerson: 'Linda Sithole',
      email: 'procurement@metro.co.za',
      phone: '+27 85 456 7890',
      tier: 'gold'
    },
    items: [
      { id: 'ITM-008', sku: 'BV-400', name: 'Soft Drinks Case', description: 'Assorted cold drinks, 24 cans per case', quantity: 30, unit: 'cases', specifications: 'Mix of Coke, Fanta, Sprite' },
    ],
    status: 'expired',
    deadline: '2026-01-14T16:00:00',
    createdAt: '2026-01-10T11:00:00',
    deliveryLocation: 'Durban Central',
    paymentTerms: 'Net 30',
    potentialValue: 8500,
    competitorQuotes: 4,
    messages: []
  },
  {
    id: 'RFQ-005',
    number: 'RFQ-2026-0204',
    merchant: {
      id: 'MER-005',
      name: 'Corner Cafe',
      contactPerson: 'Mike Thompson',
      email: 'orders@cornercafe.co.za',
      phone: '+27 86 567 8901',
      tier: 'bronze'
    },
    items: [
      { id: 'ITM-009', sku: 'SN-500', name: 'Snack Variety Pack', description: 'Assorted chips and snacks', quantity: 20, unit: 'boxes', specifications: 'Mix of popular brands' },
    ],
    status: 'accepted',
    deadline: '2026-01-13T10:00:00',
    createdAt: '2026-01-10T08:00:00',
    deliveryLocation: 'Cape Town CBD',
    paymentTerms: 'Net 15',
    potentialValue: 4500,
    competitorQuotes: 2,
    myQuote: {
      id: 'QTE-002',
      rfqId: 'RFQ-005',
      status: 'accepted',
      items: [
        { id: 'ITM-009', quotedPrice: 180.00, leadTime: 1, inStock: true }
      ],
      totalAmount: 3600.00,
      validUntil: '2026-01-18',
      submittedAt: '2026-01-11T09:00:00',
      terms: 'Includes free delivery to Cape Town area.'
    },
    bidRank: 1,
    totalBidders: 3,
    messages: [
      { id: 'MSG-003', sender: 'buyer', senderName: 'Mike Thompson', content: 'Congratulations! Your quote has been accepted. We will proceed with the order.', timestamp: '2026-01-12T10:00:00' }
    ]
  }
]

export default function SupplierRFQsPage() {
  const { supplier } = useSupplierAuth()
  const [rfqs, setRFQs] = useState<RFQ[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null)
  const [activeTab, setActiveTab] = useState('details')

  // Quote submission
  const [quoteItems, setQuoteItems] = useState<{ id: string; price: string; leadTime: string; inStock: boolean; notes: string }[]>([])
  const [quoteTerms, setQuoteTerms] = useState('')
  const [quoteValidDays, setQuoteValidDays] = useState('7')

  // Message
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setRFQs(mockRFQs)
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [supplier])

  const openRFQs = rfqs.filter(r => r.status === 'open')
  const quotedRFQs = rfqs.filter(r => r.status === 'quoted')
  const acceptedRFQs = rfqs.filter(r => r.status === 'accepted')
  const expiredRFQs = rfqs.filter(r => r.status === 'expired' || r.status === 'rejected')

  const getTimeRemaining = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 0) return { text: 'Expired', urgent: true }
    if (hours < 24) return { text: `${hours}h remaining`, urgent: true }
    const days = Math.floor(hours / 24)
    return { text: `${days}d ${hours % 24}h remaining`, urgent: false }
  }

  const formatCurrency = (amount: number) => 
    `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-ZA', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const initializeQuote = (rfq: RFQ) => {
    setQuoteItems(rfq.items.map(item => ({
      id: item.id,
      price: '',
      leadTime: '3',
      inStock: true,
      notes: ''
    })))
    setQuoteTerms('')
    setQuoteValidDays('7')
  }

  const updateQuoteItem = (index: number, field: string, value: string | boolean) => {
    setQuoteItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ))
  }

  const calculateQuoteTotal = () => {
    if (!selectedRFQ) return 0
    return quoteItems.reduce((sum, qi, index) => {
      const rfqItem = selectedRFQ.items[index]
      const price = parseFloat(qi.price) || 0
      return sum + (price * rfqItem.quantity)
    }, 0)
  }

  const submitQuote = () => {
    if (!selectedRFQ || quoteItems.some(qi => !qi.price)) return

    const newQuote: Quote = {
      id: `QTE-${Date.now()}`,
      rfqId: selectedRFQ.id,
      status: 'submitted',
      items: quoteItems.map((qi, index) => ({
        id: qi.id,
        quotedPrice: parseFloat(qi.price),
        leadTime: parseInt(qi.leadTime),
        inStock: qi.inStock,
        notes: qi.notes
      })),
      totalAmount: calculateQuoteTotal(),
      validUntil: new Date(Date.now() + parseInt(quoteValidDays) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      submittedAt: new Date().toISOString(),
      terms: quoteTerms
    }

    setRFQs(prev => prev.map(rfq => 
      rfq.id === selectedRFQ.id 
        ? { ...rfq, status: 'quoted' as const, myQuote: newQuote }
        : rfq
    ))

    setSelectedRFQ(prev => prev ? { ...prev, status: 'quoted', myQuote: newQuote } : null)
    setActiveTab('details')
  }

  const sendMessage = () => {
    if (!selectedRFQ || !newMessage.trim()) return
    setRFQs(prev => prev.map(rfq => 
      rfq.id === selectedRFQ.id 
        ? {
            ...rfq,
            messages: [
              ...rfq.messages,
              {
                id: `MSG-${Date.now()}`,
                sender: 'supplier' as const,
                senderName: supplier?.name || 'Supplier',
                content: newMessage,
                timestamp: new Date().toISOString()
              }
            ]
          }
        : rfq
    ))
    setNewMessage('')
  }

  const statusConfig: Record<string, { color: string; bgColor: string; label: string }> = {
    open: { color: 'text-green-700', bgColor: 'bg-green-100', label: 'Open for Quotes' },
    quoted: { color: 'text-blue-700', bgColor: 'bg-blue-100', label: 'Quote Submitted' },
    accepted: { color: 'text-emerald-700', bgColor: 'bg-emerald-100', label: 'Accepted' },
    rejected: { color: 'text-red-700', bgColor: 'bg-red-100', label: 'Rejected' },
    expired: { color: 'text-gray-700', bgColor: 'bg-gray-100', label: 'Expired' },
    closed: { color: 'text-slate-700', bgColor: 'bg-slate-100', label: 'Closed' },
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
          <h1 className="text-2xl font-bold text-[#1A1A1A]">RFQs</h1>
          <p className="text-[#757575]">Respond to requests for quotes from buyers</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
          <Input placeholder="Search RFQs..." className="pl-9 w-64" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#1A1A1A]">{openRFQs.length}</p>
                <p className="text-sm text-[#757575]">Open RFQs</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#1A1A1A]">{quotedRFQs.length}</p>
                <p className="text-sm text-[#757575]">Quotes Submitted</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Send className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#1A1A1A]">{acceptedRFQs.length}</p>
                <p className="text-sm text-[#757575]">Accepted</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Award className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#1A1A1A]">
                  {formatCurrency([...openRFQs, ...quotedRFQs].reduce((sum, r) => sum + r.potentialValue, 0))}
                </p>
                <p className="text-sm text-[#757575]">Potential Value</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RFQ Tabs */}
      <Tabs defaultValue="open" className="space-y-4">
        <TabsList>
          <TabsTrigger value="open">Open ({openRFQs.length})</TabsTrigger>
          <TabsTrigger value="quoted">Quoted ({quotedRFQs.length})</TabsTrigger>
          <TabsTrigger value="accepted">Accepted ({acceptedRFQs.length})</TabsTrigger>
          <TabsTrigger value="expired">Expired ({expiredRFQs.length})</TabsTrigger>
        </TabsList>

        {['open', 'quoted', 'accepted', 'expired'].map((tab) => {
          const rfqsToShow = tab === 'open' ? openRFQs 
            : tab === 'quoted' ? quotedRFQs 
            : tab === 'accepted' ? acceptedRFQs 
            : expiredRFQs

          return (
            <TabsContent key={tab} value={tab} className="space-y-3">
              {rfqsToShow.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-[#757575]">No RFQs in this category</p>
                  </CardContent>
                </Card>
              ) : (
                rfqsToShow.map((rfq) => {
                  const timeInfo = getTimeRemaining(rfq.deadline)
                  const config = statusConfig[rfq.status]

                  return (
                    <Card key={rfq.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedRFQ(rfq)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                              <FileText className={`h-6 w-6 ${config.color}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-[#1A1A1A]">{rfq.number}</p>
                                <Badge className={`${config.bgColor} ${config.color} border-0`}>{config.label}</Badge>
                                {rfq.bidRank && (
                                  <Badge variant="outline" className="text-xs">
                                    <Target className="h-3 w-3 mr-1" />
                                    Rank #{rfq.bidRank} of {rfq.totalBidders}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-[#757575] mb-2">
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3.5 w-3.5" />
                                  {rfq.merchant.name}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Package className="h-3.5 w-3.5" />
                                  {rfq.items.length} items
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-xs">
                                <span className={`flex items-center gap-1 ${timeInfo.urgent ? 'text-red-600 font-medium' : 'text-[#757575]'}`}>
                                  <Timer className="h-3 w-3" />
                                  {timeInfo.text}
                                </span>
                                <span className="text-[#757575]">
                                  {rfq.competitorQuotes} other quotes
                                </span>
                                <span className="text-[#00897B] font-medium">
                                  ~{formatCurrency(rfq.potentialValue)}
                                </span>
                              </div>
                              {rfq.messages.length > 0 && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-blue-600">
                                  <MessageSquare className="h-3 w-3" />
                                  {rfq.messages.length} messages
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {rfq.status === 'open' && (
                              <Button 
                                className="bg-[#00897B] hover:bg-[#00695C]"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  initializeQuote(rfq)
                                  setSelectedRFQ(rfq)
                                  setActiveTab('submit')
                                }}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Submit Quote
                              </Button>
                            )}
                            {rfq.status === 'quoted' && rfq.myQuote && (
                              <div className="text-right">
                                <p className="font-bold text-[#1A1A1A]">{formatCurrency(rfq.myQuote.totalAmount)}</p>
                                <p className="text-xs text-[#757575]">Your quote</p>
                              </div>
                            )}
                            {rfq.status === 'accepted' && (
                              <Badge className="bg-emerald-100 text-emerald-700 border-0">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Won!
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </TabsContent>
          )
        })}
      </Tabs>

      {/* RFQ Detail Dialog */}
      <Dialog open={!!selectedRFQ} onOpenChange={(open) => !open && setSelectedRFQ(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl">{selectedRFQ?.number}</DialogTitle>
                <DialogDescription>
                  {selectedRFQ?.merchant.name} • {selectedRFQ?.items.length} items
                </DialogDescription>
              </div>
              {selectedRFQ && (
                <Badge className={`${statusConfig[selectedRFQ.status].bgColor} ${statusConfig[selectedRFQ.status].color} border-0`}>
                  {statusConfig[selectedRFQ.status].label}
                </Badge>
              )}
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: selectedRFQ?.status === 'open' ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)' }}>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="items">Items</TabsTrigger>
              <TabsTrigger value="messages">Messages ({selectedRFQ?.messages.length})</TabsTrigger>
              {selectedRFQ?.status === 'open' && <TabsTrigger value="submit">Submit Quote</TabsTrigger>}
            </TabsList>

            <TabsContent value="details" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Buyer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{selectedRFQ?.merchant.name}</p>
                      <Badge variant="outline" className="text-xs">{selectedRFQ?.merchant.tier}</Badge>
                    </div>
                    <p className="text-[#757575]">{selectedRFQ?.merchant.contactPerson}</p>
                    <p className="text-[#757575]">{selectedRFQ?.merchant.email}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      RFQ Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#757575]">Deadline</span>
                      <span className={getTimeRemaining(selectedRFQ?.deadline || '').urgent ? 'text-red-600 font-medium' : ''}>
                        {selectedRFQ && formatDate(selectedRFQ.deadline)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#757575]">Delivery Location</span>
                      <span>{selectedRFQ?.deliveryLocation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#757575]">Payment Terms</span>
                      <span>{selectedRFQ?.paymentTerms}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#757575]">Other Bidders</span>
                      <span>{selectedRFQ?.competitorQuotes}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedRFQ?.requirements && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Special Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[#757575]">{selectedRFQ.requirements}</p>
                  </CardContent>
                </Card>
              )}

              {selectedRFQ?.myQuote && (
                <Card className="border-l-4 border-l-blue-400">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-500" />
                      Your Quote
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-[#757575]">Total Amount</p>
                        <p className="text-xl font-bold text-[#00897B]">{formatCurrency(selectedRFQ.myQuote.totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-[#757575]">Valid Until</p>
                        <p className="font-medium">{selectedRFQ.myQuote.validUntil}</p>
                      </div>
                      <div>
                        <p className="text-[#757575]">Submitted</p>
                        <p className="font-medium">{selectedRFQ.myQuote.submittedAt && formatDate(selectedRFQ.myQuote.submittedAt)}</p>
                      </div>
                    </div>
                    {selectedRFQ.myQuote.terms && (
                      <p className="text-sm text-[#757575] italic">"{selectedRFQ.myQuote.terms}"</p>
                    )}
                    {selectedRFQ.bidRank && (
                      <div className="flex items-center gap-2 mt-2">
                        <Target className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-medium">Current rank: #{selectedRFQ.bidRank} of {selectedRFQ.totalBidders} bidders</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="items" className="mt-4">
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {selectedRFQ?.items.map((item) => (
                    <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-[#757575]">{item.sku} • {item.description}</p>
                          {item.specifications && (
                            <p className="text-xs text-blue-600 mt-1">Specs: {item.specifications}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{item.quantity} {item.unit}</p>
                          {selectedRFQ?.myQuote && (
                            <p className="text-sm text-[#00897B]">
                              Quoted: {formatCurrency(selectedRFQ.myQuote.items.find(qi => qi.id === item.id)?.quotedPrice || 0)} each
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="messages" className="mt-4">
              <div className="space-y-4">
                <ScrollArea className="h-[250px]">
                  <div className="space-y-3 pr-4">
                    {selectedRFQ?.messages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`flex ${msg.sender === 'supplier' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] rounded-lg p-3 ${
                          msg.sender === 'supplier' 
                            ? 'bg-[#E0F2F1] text-[#1A1A1A]' 
                            : 'bg-gray-200 text-[#1A1A1A]'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">
                              {msg.sender === 'supplier' ? 'You' : msg.senderName}
                            </span>
                            <span className="text-xs text-[#757575]">
                              {formatDate(msg.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {selectedRFQ?.messages.length === 0 && (
                      <div className="text-center py-8 text-[#757575]">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No messages yet</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Type a message..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button onClick={sendMessage} className="bg-[#00897B] hover:bg-[#00695C]">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            {selectedRFQ?.status === 'open' && (
              <TabsContent value="submit" className="mt-4">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4 pr-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                      <AlertCircle className="h-4 w-4 inline mr-2" />
                      Provide competitive pricing. This RFQ has {selectedRFQ.competitorQuotes} other quotes.
                    </div>

                    {selectedRFQ.items.map((item, index) => (
                      <Card key={item.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">{item.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-4 text-sm text-[#757575]">
                            <span>{item.sku}</span>
                            <span>{item.quantity} {item.unit}</span>
                            {item.specifications && <span className="text-blue-600">{item.specifications}</span>}
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label className="text-xs">Unit Price (R) *</Label>
                              <Input 
                                type="number" 
                                placeholder="0.00"
                                value={quoteItems[index]?.price || ''}
                                onChange={(e) => updateQuoteItem(index, 'price', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Lead Time (days)</Label>
                              <Input 
                                type="number" 
                                placeholder="3"
                                value={quoteItems[index]?.leadTime || '3'}
                                onChange={(e) => updateQuoteItem(index, 'leadTime', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Availability</Label>
                              <Select 
                                value={quoteItems[index]?.inStock ? 'in_stock' : 'backorder'} 
                                onValueChange={(v) => updateQuoteItem(index, 'inStock', v === 'in_stock')}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="in_stock">In Stock</SelectItem>
                                  <SelectItem value="backorder">Backorder</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Item Notes (optional)</Label>
                            <Input 
                              placeholder="Any specific notes for this item..."
                              value={quoteItems[index]?.notes || ''}
                              onChange={(e) => updateQuoteItem(index, 'notes', e.target.value)}
                            />
                          </div>
                          {quoteItems[index]?.price && (
                            <div className="text-right text-sm">
                              <span className="text-[#757575]">Line total: </span>
                              <span className="font-bold text-[#00897B]">
                                {formatCurrency((parseFloat(quoteItems[index].price) || 0) * item.quantity)}
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}

                    <Separator />

                    <div>
                      <Label>Quote Terms & Conditions</Label>
                      <Textarea 
                        placeholder="Enter any terms, conditions, or notes for the buyer..."
                        value={quoteTerms}
                        onChange={(e) => setQuoteTerms(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Quote Valid For</Label>
                        <Select value={quoteValidDays} onValueChange={setQuoteValidDays}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">3 days</SelectItem>
                            <SelectItem value="7">7 days</SelectItem>
                            <SelectItem value="14">14 days</SelectItem>
                            <SelectItem value="30">30 days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="bg-[#E0F2F1] rounded-lg p-4 text-center">
                        <p className="text-sm text-[#757575]">Total Quote Amount</p>
                        <p className="text-2xl font-bold text-[#00897B]">{formatCurrency(calculateQuoteTotal())}</p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            )}
          </Tabs>

          <DialogFooter className="mt-4">
            <div className="flex items-center justify-between w-full">
              <Button variant="outline" onClick={() => setSelectedRFQ(null)}>
                Close
              </Button>
              {selectedRFQ?.status === 'open' && activeTab === 'submit' && (
                <Button 
                  onClick={submitQuote}
                  disabled={quoteItems.some(qi => !qi.price)}
                  className="bg-[#00897B] hover:bg-[#00695C]"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit Quote
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
