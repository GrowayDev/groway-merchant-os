'use client'

import { useState, useEffect } from 'react'
import {
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Eye,
  Send,
  ArrowRight,
  Building2,
  Package,
  DollarSign,
  Calendar,
  FileText,
  Upload,
  Paperclip,
  Image as ImageIcon,
  X,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  User,
  Bot,
  FileCheck,
  XCircle,
  RefreshCw,
  Clock4
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSupplierAuth } from '../layout'

interface DisputeMessage {
  id: string
  sender: 'supplier' | 'buyer' | 'system' | 'mediator'
  senderName: string
  senderRole?: string
  content: string
  timestamp: string
  attachments?: {
    name: string
    type: string
    url: string
  }[]
  isInternal?: boolean
}

interface DisputeEvent {
  id: string
  type: 'created' | 'status_change' | 'response' | 'resolution' | 'escalation' | 'evidence'
  description: string
  timestamp: string
  actor?: string
}

interface Dispute {
  id: string
  order: string
  orderNumber: string
  type: 'short_delivery' | 'quality' | 'price_mismatch' | 'non_delivery' | 'damaged' | 'late_delivery' | 'other'
  status: 'open' | 'under_review' | 'awaiting_response' | 'escalated' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  raisedBy: 'merchant' | 'supplier'
  description: string
  createdAt: string
  updatedAt: string
  merchant: {
    id: string
    name: string
    contactPerson: string
    email: string
  }
  resolution?: string
  resolvedAt?: string
  resolutionType?: 'refund' | 'credit' | 'replacement' | 'partial' | 'rejected'
  refundAmount?: number
  messages: DisputeMessage[]
  timeline: DisputeEvent[]
  evidence: {
    id: string
    name: string
    type: string
    uploadedBy: string
    uploadedAt: string
  }[]
  slaDeadline: string
  responseDue?: string
}

const mockDisputes: Dispute[] = [
  {
    id: 'DSP-001',
    order: 'ORD-001',
    orderNumber: 'PO-2026-00123',
    type: 'short_delivery',
    status: 'open',
    priority: 'high',
    raisedBy: 'merchant',
    description: '3 items missing from delivery. Order was for 10 Fresh Produce Bundles but only 7 were received. The delivery driver noted 7 items on the POD but didn\'t mention any shortage.',
    createdAt: '2026-01-15T10:00:00',
    updatedAt: '2026-01-15T14:30:00',
    merchant: {
      id: 'MER-001',
      name: 'QuickSpar Foods',
      contactPerson: 'John Mokoena',
      email: 'john@quickspar.co.za'
    },
    messages: [
      {
        id: 'MSG-001',
        sender: 'buyer',
        senderName: 'John Mokoena',
        senderRole: 'Procurement Manager',
        content: 'We received the delivery today but found 3 Fresh Produce Bundles missing from the order. The delivery note shows 7 items but our PO was for 10. Please investigate and resolve urgently as we need these for our weekend stock.',
        timestamp: '2026-01-15T10:30:00',
        attachments: [
          { name: 'POD_Scan.pdf', type: 'pdf', url: '#' },
          { name: 'Delivery_Photo.jpg', type: 'image', url: '#' }
        ]
      },
      {
        id: 'MSG-002',
        sender: 'system',
        senderName: 'GroSupply Support',
        content: 'Dispute created and assigned to supplier. Response required within 24 hours.',
        timestamp: '2026-01-15T10:00:00'
      }
    ],
    timeline: [
      { id: 'TL-001', type: 'created', description: 'Dispute created by buyer', timestamp: '2026-01-15T10:00:00', actor: 'John Mokoena' },
      { id: 'TL-002', type: 'status_change', description: 'Status changed to Open', timestamp: '2026-01-15T10:00:00' }
    ],
    evidence: [
      { id: 'EV-001', name: 'POD_Scan.pdf', type: 'document', uploadedBy: 'John Mokoena', uploadedAt: '2026-01-15T10:30:00' },
      { id: 'EV-002', name: 'Delivery_Photo.jpg', type: 'image', uploadedBy: 'John Mokoena', uploadedAt: '2026-01-15T10:30:00' }
    ],
    slaDeadline: '2026-01-16T10:00:00',
    responseDue: '2026-01-16T10:00:00'
  },
  {
    id: 'DSP-002',
    order: 'ORD-002',
    orderNumber: 'PO-2026-00124',
    type: 'quality',
    status: 'under_review',
    priority: 'medium',
    raisedBy: 'merchant',
    description: 'Product quality does not match specifications. The Greek Yogurt delivered has a different fat content than ordered (2% instead of 5%) and the packaging shows different branding.',
    createdAt: '2026-01-12T14:00:00',
    updatedAt: '2026-01-14T11:00:00',
    merchant: {
      id: 'MER-002',
      name: 'Fresh Market SA',
      contactPerson: 'Sarah van der Berg',
      email: 'sarah@freshmarket.co.za'
    },
    messages: [
      {
        id: 'MSG-003',
        sender: 'buyer',
        senderName: 'Sarah van der Berg',
        content: 'The yogurt we received is not what we ordered. We ordered full-fat Greek yogurt (5% fat content) but received low-fat version (2%). The packaging is also different from our previous orders. This affects our menu offerings.',
        timestamp: '2026-01-12T14:30:00',
        attachments: [
          { name: 'Yogurt_Comparison.jpg', type: 'image', url: '#' }
        ]
      },
      {
        id: 'MSG-004',
        sender: 'supplier',
        senderName: 'Demo Supplier',
        content: 'Thank you for bringing this to our attention. We are investigating with our warehouse team to understand what happened. We believe there may have been a picking error. We can arrange an exchange for the correct product or offer a credit note.',
        timestamp: '2026-01-13T09:00:00'
      },
      {
        id: 'MSG-005',
        sender: 'buyer',
        senderName: 'Sarah van der Berg',
        content: 'We would prefer an exchange as we need the correct yogurt for our menu. When can you deliver the correct product?',
        timestamp: '2026-01-13T14:00:00'
      },
      {
        id: 'MSG-006',
        sender: 'system',
        senderName: 'GroSupply Support',
        content: 'Dispute escalated to Under Review. A support representative will assist with resolution.',
        timestamp: '2026-01-14T11:00:00'
      }
    ],
    timeline: [
      { id: 'TL-003', type: 'created', description: 'Dispute created by buyer', timestamp: '2026-01-12T14:00:00', actor: 'Sarah van der Berg' },
      { id: 'TL-004', type: 'response', description: 'Supplier responded', timestamp: '2026-01-13T09:00:00', actor: 'Demo Supplier' },
      { id: 'TL-005', type: 'escalation', description: 'Dispute escalated for review', timestamp: '2026-01-14T11:00:00' }
    ],
    evidence: [
      { id: 'EV-003', name: 'Yogurt_Comparison.jpg', type: 'image', uploadedBy: 'Sarah van der Berg', uploadedAt: '2026-01-12T14:30:00' }
    ],
    slaDeadline: '2026-01-17T14:00:00'
  },
  {
    id: 'DSP-003',
    order: 'ORD-003',
    orderNumber: 'PO-2026-00125',
    type: 'price_mismatch',
    status: 'resolved',
    priority: 'low',
    raisedBy: 'supplier',
    description: 'Invoice amount differs from agreed price. The PO shows R450 per box but our quote was R480 per box. 2 boxes were delivered.',
    createdAt: '2026-01-08T09:00:00',
    updatedAt: '2026-01-10T15:00:00',
    merchant: {
      id: 'MER-003',
      name: 'City Butchery',
      contactPerson: 'Peter Nkosi',
      email: 'peter@citybutchery.co.za'
    },
    resolution: 'Credit note of R60 issued to buyer as per agreed pricing. Invoice corrected.',
    resolvedAt: '2026-01-10T15:00:00',
    resolutionType: 'credit',
    refundAmount: 60,
    messages: [
      {
        id: 'MSG-007',
        sender: 'supplier',
        senderName: 'Demo Supplier',
        content: 'There appears to be a pricing discrepancy. Our quote for the Vacuum Pack Bags was R480 per box, but the PO shows R450. This is a difference of R30 per box × 2 boxes = R60. Can we clarify the agreed price?',
        timestamp: '2026-01-08T09:30:00'
      },
      {
        id: 'MSG-008',
        sender: 'buyer',
        senderName: 'Peter Nkosi',
        content: 'Apologies, you\'re right. We had an older price in our system. We will issue a payment for the correct amount.',
        timestamp: '2026-01-10T14:00:00'
      },
      {
        id: 'MSG-009',
        sender: 'system',
        senderName: 'GroSupply Support',
        content: 'Dispute resolved. Credit note of R60 issued.',
        timestamp: '2026-01-10T15:00:00'
      }
    ],
    timeline: [
      { id: 'TL-006', type: 'created', description: 'Dispute created by supplier', timestamp: '2026-01-08T09:00:00', actor: 'Demo Supplier' },
      { id: 'TL-007', type: 'response', description: 'Buyer responded', timestamp: '2026-01-10T14:00:00', actor: 'Peter Nkosi' },
      { id: 'TL-008', type: 'resolution', description: 'Dispute resolved - Credit issued', timestamp: '2026-01-10T15:00:00' }
    ],
    evidence: [],
    slaDeadline: '2026-01-12T09:00:00'
  },
  {
    id: 'DSP-004',
    order: 'ORD-004',
    orderNumber: 'PO-2026-00126',
    type: 'damaged',
    status: 'awaiting_response',
    priority: 'high',
    raisedBy: 'merchant',
    description: 'Products arrived damaged. 5 out of 30 cases of beverages had crushed cans due to poor packaging.',
    createdAt: '2026-01-14T16:00:00',
    updatedAt: '2026-01-15T08:00:00',
    merchant: {
      id: 'MER-004',
      name: 'Metro Supermarket',
      contactPerson: 'Linda Sithole',
      email: 'linda@metro.co.za'
    },
    messages: [
      {
        id: 'MSG-010',
        sender: 'buyer',
        senderName: 'Linda Sithole',
        content: 'We received a delivery today but 5 cases of soft drinks have crushed cans. The boxes were wet and the cans are not sellable. Please see attached photos. We need replacement urgently.',
        timestamp: '2026-01-14T16:30:00',
        attachments: [
          { name: 'Damaged_Goods_1.jpg', type: 'image', url: '#' },
          { name: 'Damaged_Goods_2.jpg', type: 'image', url: '#' }
        ]
      }
    ],
    timeline: [
      { id: 'TL-009', type: 'created', description: 'Dispute created by buyer', timestamp: '2026-01-14T16:00:00', actor: 'Linda Sithole' }
    ],
    evidence: [
      { id: 'EV-004', name: 'Damaged_Goods_1.jpg', type: 'image', uploadedBy: 'Linda Sithole', uploadedAt: '2026-01-14T16:30:00' },
      { id: 'EV-005', name: 'Damaged_Goods_2.jpg', type: 'image', uploadedBy: 'Linda Sithole', uploadedAt: '2026-01-14T16:30:00' }
    ],
    slaDeadline: '2026-01-15T16:00:00',
    responseDue: '2026-01-15T16:00:00'
  }
]

export default function SupplierDisputesPage() {
  const { supplier } = useSupplierAuth()
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [responseText, setResponseText] = useState('')
  const [responseType, setResponseType] = useState<'response' | 'resolution'>('response')
  const [resolutionType, setResolutionType] = useState<string>('')
  const [resolutionAmount, setResolutionAmount] = useState('')
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisputes(mockDisputes)
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [supplier])

  const openDisputes = disputes.filter(d => d.status === 'open' || d.status === 'under_review' || d.status === 'awaiting_response')
  const resolvedDisputes = disputes.filter(d => d.status === 'resolved' || d.status === 'closed')

  const formatCurrency = (amount: number) => 
    `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('en-ZA', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeRemaining = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 0) return { text: 'Overdue', urgent: true }
    if (hours < 24) return { text: `${hours}h remaining`, urgent: true }
    return { text: `${Math.floor(hours / 24)}d remaining`, urgent: false }
  }

  const statusConfig: Record<string, { color: string; bgColor: string; label: string; icon: typeof AlertCircle }> = {
    open: { color: 'text-red-700', bgColor: 'bg-red-100', label: 'Open', icon: AlertCircle },
    under_review: { color: 'text-amber-700', bgColor: 'bg-amber-100', label: 'Under Review', icon: Clock },
    awaiting_response: { color: 'text-purple-700', bgColor: 'bg-purple-100', label: 'Awaiting Response', icon: Clock4 },
    escalated: { color: 'text-orange-700', bgColor: 'bg-orange-100', label: 'Escalated', icon: AlertTriangle },
    resolved: { color: 'text-green-700', bgColor: 'bg-green-100', label: 'Resolved', icon: CheckCircle2 },
    closed: { color: 'text-gray-700', bgColor: 'bg-gray-100', label: 'Closed', icon: XCircle },
  }

  const typeConfig: Record<string, { label: string; icon: typeof Package }> = {
    short_delivery: { label: 'Short Delivery', icon: Package },
    quality: { label: 'Quality Issue', icon: AlertTriangle },
    price_mismatch: { label: 'Price Mismatch', icon: DollarSign },
    non_delivery: { label: 'Non-Delivery', icon: XCircle },
    damaged: { label: 'Damaged Goods', icon: AlertCircle },
    late_delivery: { label: 'Late Delivery', icon: Clock },
    other: { label: 'Other', icon: MessageSquare },
  }

  const priorityConfig: Record<string, { color: string; label: string }> = {
    critical: { color: 'text-red-600', label: 'Critical' },
    high: { color: 'text-orange-600', label: 'High' },
    medium: { color: 'text-amber-600', label: 'Medium' },
    low: { color: 'text-blue-600', label: 'Low' },
  }

  const handleSendMessage = () => {
    if (!selectedDispute || !responseText.trim()) return

    const newMessage: DisputeMessage = {
      id: `MSG-${Date.now()}`,
      sender: 'supplier',
      senderName: supplier?.name || 'Supplier',
      content: responseText,
      timestamp: new Date().toISOString()
    }

    const newEvent: DisputeEvent = {
      id: `TL-${Date.now()}`,
      type: responseType === 'resolution' ? 'resolution' : 'response',
      description: responseType === 'resolution' ? 'Resolution proposed' : 'Supplier responded',
      timestamp: new Date().toISOString(),
      actor: supplier?.name
    }

    setDisputes(prev => prev.map(d => {
      if (d.id === selectedDispute.id) {
        return {
          ...d,
          messages: [...d.messages, newMessage],
          timeline: [...d.timeline, newEvent],
          status: responseType === 'resolution' ? 'resolved' : d.status,
          updatedAt: new Date().toISOString(),
          ...(responseType === 'resolution' && {
            resolution: responseText,
            resolvedAt: new Date().toISOString(),
            resolutionType: resolutionType as any,
            ...(resolutionAmount && { refundAmount: parseFloat(resolutionAmount) })
          })
        }
      }
      return d
    }))

    setResponseText('')
    setResolutionType('')
    setResolutionAmount('')
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
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Disputes</h1>
          <p className="text-[#757575]">Manage order disputes and resolutions</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-400">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{disputes.filter(d => d.status === 'open').length}</p>
            <p className="text-sm text-[#757575]">Open</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-400">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{disputes.filter(d => d.status === 'under_review' || d.status === 'awaiting_response').length}</p>
            <p className="text-sm text-[#757575]">In Progress</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-400">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{resolvedDisputes.length}</p>
            <p className="text-sm text-[#757575]">Resolved</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-400">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{disputes.filter(d => d.responseDue && getTimeRemaining(d.responseDue).urgent).length}</p>
            <p className="text-sm text-[#757575]">Urgent Response</p>
          </CardContent>
        </Card>
      </div>

      {/* Disputes Tabs */}
      <Tabs defaultValue="open" className="space-y-4">
        <TabsList>
          <TabsTrigger value="open">Open ({openDisputes.length})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({resolvedDisputes.length})</TabsTrigger>
          <TabsTrigger value="all">All ({disputes.length})</TabsTrigger>
        </TabsList>

        {['open', 'resolved', 'all'].map((tab) => {
          const disputesToShow = tab === 'open' ? openDisputes 
            : tab === 'resolved' ? resolvedDisputes 
            : disputes

          return (
            <TabsContent key={tab} value="open" className="space-y-3">
              {disputesToShow.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-[#757575]">No disputes in this category</p>
                  </CardContent>
                </Card>
              ) : (
                disputesToShow.map((dispute) => {
                  const statusConf = statusConfig[dispute.status]
                  const typeConf = typeConfig[dispute.type]
                  const priorityConf = priorityConfig[dispute.priority]
                  const StatusIcon = statusConf.icon
                  const TypeIcon = typeConf.icon
                  const timeInfo = dispute.responseDue ? getTimeRemaining(dispute.responseDue) : null

                  return (
                    <Card 
                      key={dispute.id} 
                      className={`hover:shadow-md transition-shadow cursor-pointer ${timeInfo?.urgent ? 'border-red-300' : ''}`}
                      onClick={() => setSelectedDispute(dispute)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-lg ${statusConf.bgColor} flex items-center justify-center`}>
                              <StatusIcon className={`h-6 w-6 ${statusConf.color}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-[#1A1A1A]">{dispute.orderNumber}</p>
                                <Badge className={`${statusConf.bgColor} ${statusConf.color} border-0`}>{statusConf.label}</Badge>
                                <span className={`text-xs font-medium ${priorityConf.color}`}>{priorityConf.label}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-[#757575] mb-1">
                                <TypeIcon className="h-4 w-4" />
                                <span>{typeConf.label}</span>
                              </div>
                              <p className="text-sm text-[#757575] line-clamp-1">{dispute.description}</p>
                              <div className="flex items-center gap-4 text-xs text-[#757575] mt-2">
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {dispute.merchant.name}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(dispute.createdAt)}
                                </span>
                                {dispute.messages.length > 0 && (
                                  <span className="flex items-center gap-1 text-blue-600">
                                    <MessageSquare className="h-3 w-3" />
                                    {dispute.messages.length} messages
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {timeInfo && (
                              <p className={`text-xs font-medium ${timeInfo.urgent ? 'text-red-600' : 'text-[#757575]'}`}>
                                {timeInfo.text}
                              </p>
                            )}
                            <Button size="sm" className="mt-2 bg-[#00897B] hover:bg-[#00695C]">
                              {dispute.status === 'open' || dispute.status === 'awaiting_response' ? 'Respond' : 'View'}
                            </Button>
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

      {/* Dispute Detail Dialog */}
      <Dialog open={!!selectedDispute} onOpenChange={(open) => !open && setSelectedDispute(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl">{selectedDispute?.orderNumber}</DialogTitle>
                <DialogDescription>{selectedDispute && typeConfig[selectedDispute.type].label}</DialogDescription>
              </div>
              {selectedDispute && (
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${priorityConfig[selectedDispute.priority].color}`}>
                    {priorityConfig[selectedDispute.priority].label}
                  </span>
                  <Badge className={`${statusConfig[selectedDispute.status].bgColor} ${statusConfig[selectedDispute.status].color} border-0`}>
                    {statusConfig[selectedDispute.status].label}
                  </Badge>
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-4 mt-4">
            {/* Main Content - Messages */}
            <div className="col-span-2 space-y-4">
              {/* Description */}
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm font-medium mb-2">Issue Description</p>
                  <p className="text-sm text-[#757575]">{selectedDispute?.description}</p>
                  {selectedDispute?.resolution && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm font-medium text-green-700 mb-1">Resolution</p>
                      <p className="text-sm text-[#757575]">{selectedDispute.resolution}</p>
                      {selectedDispute.refundAmount && (
                        <p className="text-sm font-medium text-[#00897B] mt-2">
                          {selectedDispute.resolutionType === 'credit' ? 'Credit' : 'Refund'}: {formatCurrency(selectedDispute.refundAmount)}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Messages */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Conversation Thread</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[250px]">
                    <div className="space-y-4 pr-4">
                      {selectedDispute?.messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'supplier' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-lg p-3 ${
                            msg.sender === 'supplier' 
                              ? 'bg-[#E0F2F1] text-[#1A1A1A]' 
                              : msg.sender === 'system'
                              ? 'bg-gray-100 text-[#757575]'
                              : 'bg-gray-200 text-[#1A1A1A]'
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              {msg.sender === 'system' ? (
                                <Bot className="h-4 w-4 text-[#757575]" />
                              ) : (
                                <User className="h-4 w-4" />
                              )}
                              <span className="text-xs font-medium">
                                {msg.sender === 'supplier' ? 'You' : msg.senderName}
                              </span>
                              {msg.senderRole && (
                                <span className="text-xs text-[#757575]">({msg.senderRole})</span>
                              )}
                              <span className="text-xs text-[#757575]">
                                {formatDateTime(msg.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {msg.attachments.map((att, i) => (
                                  <Button key={i} variant="outline" size="sm">
                                    <Paperclip className="h-3 w-3 mr-1" />
                                    {att.name}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Response Input */}
                  {selectedDispute && selectedDispute.status !== 'resolved' && selectedDispute.status !== 'closed' && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <div className="flex gap-2">
                        <Button 
                          variant={responseType === 'response' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setResponseType('response')}
                          className={responseType === 'response' ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Response
                        </Button>
                        <Button 
                          variant={responseType === 'resolution' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setResponseType('resolution')}
                          className={responseType === 'resolution' ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Propose Resolution
                        </Button>
                      </div>

                      {responseType === 'resolution' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Resolution Type</Label>
                            <Select value={resolutionType} onValueChange={setResolutionType}>
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="refund">Full Refund</SelectItem>
                                <SelectItem value="credit">Credit Note</SelectItem>
                                <SelectItem value="replacement">Replacement</SelectItem>
                                <SelectItem value="partial">Partial Refund</SelectItem>
                                <SelectItem value="rejected">Reject Claim</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Amount (if applicable)</Label>
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              value={resolutionAmount}
                              onChange={(e) => setResolutionAmount(e.target.value)}
                              className="h-8"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Textarea 
                          placeholder={responseType === 'resolution' ? 'Describe your proposed resolution...' : 'Type your response...'}
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="flex justify-between">
                        <Button variant="outline" size="sm" onClick={() => setAttachmentDialogOpen(true)}>
                          <Paperclip className="h-4 w-4 mr-2" />
                          Attach File
                        </Button>
                        <Button 
                          onClick={handleSendMessage} 
                          disabled={!responseText.trim() || (responseType === 'resolution' && !resolutionType)}
                          className="bg-[#00897B] hover:bg-[#00695C]"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {responseType === 'resolution' ? 'Submit Resolution' : 'Send Response'}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Info */}
            <div className="space-y-4">
              {/* Dispute Info */}
              <Card>
                <CardContent className="p-4 space-y-3 text-sm">
                  <div>
                    <p className="text-[#757575]">Dispute ID</p>
                    <p className="font-medium">{selectedDispute?.id}</p>
                  </div>
                  <div>
                    <p className="text-[#757575]">Created</p>
                    <p className="font-medium">{selectedDispute && formatDateTime(selectedDispute.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-[#757575]">Raised By</p>
                    <p className="font-medium capitalize">{selectedDispute?.raisedBy}</p>
                  </div>
                  {selectedDispute?.responseDue && (
                    <div>
                      <p className="text-[#757575]">Response Due</p>
                      <p className={`font-medium ${getTimeRemaining(selectedDispute.responseDue).urgent ? 'text-red-600' : ''}`}>
                        {selectedDispute && formatDateTime(selectedDispute.responseDue)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Buyer Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Buyer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="font-medium">{selectedDispute?.merchant.name}</p>
                  <p className="text-[#757575]">{selectedDispute?.merchant.contactPerson}</p>
                  <p className="text-[#757575]">{selectedDispute?.merchant.email}</p>
                </CardContent>
              </Card>

              {/* Evidence */}
              {selectedDispute?.evidence && selectedDispute.evidence.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Evidence</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedDispute.evidence.map((ev) => (
                        <Button key={ev.id} variant="outline" size="sm" className="w-full justify-start">
                          {ev.type === 'image' ? <ImageIcon className="h-4 w-4 mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                          <span className="truncate">{ev.name}</span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Timeline */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[150px]">
                    <div className="relative pl-4">
                      {selectedDispute?.timeline.map((event, index) => (
                        <div key={event.id} className="relative pb-4">
                          {index < selectedDispute.timeline.length - 1 && (
                            <div className="absolute left-[5px] top-3 bottom-0 w-0.5 bg-gray-200" />
                          )}
                          <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-[#00897B]" />
                          <div className="ml-4">
                            <p className="text-sm font-medium">{event.description}</p>
                            <p className="text-xs text-[#757575]">{formatDateTime(event.timestamp)}</p>
                            {event.actor && <p className="text-xs text-[#757575]">by {event.actor}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDispute(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
