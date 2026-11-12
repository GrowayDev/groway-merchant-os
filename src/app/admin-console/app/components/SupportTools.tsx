'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { 
  Headphones,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  User,
  Mail,
  Phone,
  Building2,
  MessageSquare,
  Send,
  Eye,
  ArrowRight,
  AlertTriangle,
  Calendar,
  ChevronRight,
  MoreVertical,
  Paperclip,
  FileText
} from 'lucide-react'

// Ticket Types
type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed'
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
type TicketCategory = 'technical' | 'billing' | 'compliance' | 'account' | 'other'

interface SupportTicket {
  id: string
  subject: string
  merchantId: string
  merchantName: string
  category: TicketCategory
  status: TicketStatus
  priority: TicketPriority
  createdAt: string
  updatedAt: string
  assignee?: string
  messages: { 
    id: string
    author: string
    content: string
    timestamp: string
    isInternal: boolean
  }[]
}

// Sample Data
const supportTickets: SupportTicket[] = [
  {
    id: 'TKT-001',
    subject: 'Payment not reflecting in wallet',
    merchantId: 'M-8821',
    merchantName: 'Quick Mart Sandton',
    category: 'technical',
    status: 'open',
    priority: 'high',
    createdAt: '2025-03-10T14:30:00',
    updatedAt: '2025-03-10T15:00:00',
    assignee: 'Sarah M.',
    messages: [
      { id: 'm1', author: 'merchant', content: 'A customer paid R2,500 via QR but the amount is not showing in my wallet. Transaction ID: TXN-998877.', timestamp: '2025-03-10T14:30:00', isInternal: false },
      { id: 'm2', author: 'Sarah M.', content: 'Thank you for reporting this. I am investigating the transaction now.', timestamp: '2025-03-10T14:45:00', isInternal: false },
    ]
  },
  {
    id: 'TKT-002',
    subject: 'Request for transaction history export',
    merchantId: 'M-4521',
    merchantName: 'Cape Town Electronics',
    category: 'account',
    status: 'in_progress',
    priority: 'medium',
    createdAt: '2025-03-10T12:00:00',
    updatedAt: '2025-03-10T13:30:00',
    assignee: 'John D.',
    messages: [
      { id: 'm1', author: 'merchant', content: 'I need a full transaction history export for the past 6 months for audit purposes.', timestamp: '2025-03-10T12:00:00', isInternal: false },
      { id: 'm2', author: 'John D.', content: 'I will generate this export for you. It should be ready within 24 hours.', timestamp: '2025-03-10T13:30:00', isInternal: false },
    ]
  },
  {
    id: 'TKT-003',
    subject: 'Settlement delay inquiry',
    merchantId: 'M-7788',
    merchantName: 'Luxury Goods SA',
    category: 'billing',
    status: 'waiting',
    priority: 'urgent',
    createdAt: '2025-03-09T16:00:00',
    updatedAt: '2025-03-10T10:00:00',
    assignee: 'Thabo K.',
    messages: [
      { id: 'm1', author: 'merchant', content: 'My T+1 settlement has not been received. Expected R85,000 on March 9th.', timestamp: '2025-03-09T16:00:00', isInternal: false },
      { id: 'm2', author: 'Thabo K.', content: 'I am checking with the settlement team. There appears to be a batch processing delay.', timestamp: '2025-03-09T17:00:00', isInternal: false },
      { id: 'm3', author: 'Thabo K.', content: '[INTERNAL] Merchant has high risk score. Checking if settlement was held for review.', timestamp: '2025-03-10T10:00:00', isInternal: true },
    ]
  },
  {
    id: 'TKT-004',
    subject: 'POS device not connecting',
    merchantId: 'M-3344',
    merchantName: 'Daily Fresh Market',
    category: 'technical',
    status: 'resolved',
    priority: 'high',
    createdAt: '2025-03-09T08:00:00',
    updatedAt: '2025-03-09T11:00:00',
    assignee: 'Lisa N.',
    messages: [
      { id: 'm1', author: 'merchant', content: 'My Gropay P8D is showing "Connection Error" and cannot process payments.', timestamp: '2025-03-09T08:00:00', isInternal: false },
      { id: 'm2', author: 'Lisa N.', content: 'Please try restarting the device. If that does not work, I will walk you through a network reset.', timestamp: '2025-03-09T08:30:00', isInternal: false },
      { id: 'm3', author: 'merchant', content: 'Restart worked! Thank you for the quick assistance.', timestamp: '2025-03-09T11:00:00', isInternal: false },
    ]
  },
  {
    id: 'TKT-005',
    subject: 'KYC document upload issue',
    merchantId: 'M-5566',
    merchantName: 'Corner Café',
    category: 'compliance',
    status: 'open',
    priority: 'medium',
    createdAt: '2025-03-10T09:00:00',
    updatedAt: '2025-03-10T09:00:00',
    messages: [
      { id: 'm1', author: 'merchant', content: 'I am trying to upload my ID document but keep getting an error saying "File too large".', timestamp: '2025-03-10T09:00:00', isInternal: false },
    ]
  },
]

const stats = [
  { label: 'Open Tickets', value: 12, color: '#EF4444', icon: AlertTriangle },
  { label: 'In Progress', value: 8, color: '#F59E0B', icon: Clock },
  { label: 'Waiting', value: 5, color: '#6B7280', icon: User },
  { label: 'Resolved Today', value: 23, color: '#10B981', icon: CheckCircle2 },
]

export default function SupportTools() {
  const [activeTab, setActiveTab] = useState('queue')
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const getStatusBadge = (status: TicketStatus) => {
    const styles: Record<TicketStatus, string> = {
      open: 'bg-red-500/20 text-red-400 border-red-500/30',
      in_progress: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      waiting: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
      closed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    }
    return <Badge className={`${styles[status]} border capitalize`}>{status.replace('_', ' ')}</Badge>
  }

  const getPriorityBadge = (priority: TicketPriority) => {
    const styles: Record<TicketPriority, string> = {
      low: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      medium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      high: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
    }
    return <Badge className={`${styles[priority]} border capitalize`}>{priority}</Badge>
  }

  const getCategoryBadge = (category: TicketCategory) => {
    const colors: Record<TicketCategory, string> = {
      technical: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      billing: 'bg-green-500/20 text-green-400 border-green-500/30',
      compliance: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      account: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      other: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    }
    return <Badge className={`${colors[category]} border capitalize`}>{category}</Badge>
  }

  const filteredTickets = supportTickets.filter(ticket => {
    const matchesSearch = 
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedTicket) {
      toast.success(isInternal ? 'Internal note added' : 'Reply sent')
      setNewMessage('')
    }
  }

  const handleResolve = () => {
    toast.success('Ticket marked as resolved')
    setTicketDialogOpen(false)
  }

  const handleEscalate = () => {
    toast.success('Ticket escalated to senior support')
    setTicketDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Support Tools</h1>
          <p className="text-gray-400 text-sm">Ticket management, merchant lookup, and customer support</p>
        </div>
        <Button className="bg-[#00897B] hover:bg-[#00695C] text-white">
          <Send className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-[#1E293B] border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                </div>
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}20`, color: stat.color }}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#1E293B] border border-gray-700">
          <TabsTrigger value="queue" className="data-[state=active]:bg-[#00897B]">Ticket Queue</TabsTrigger>
          <TabsTrigger value="lookup" className="data-[state=active]:bg-[#00897B]">Merchant Lookup</TabsTrigger>
          <TabsTrigger value="search" className="data-[state=active]:bg-[#00897B]">Transaction Search</TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-[#00897B]">Templates</TabsTrigger>
        </TabsList>

        {/* Ticket Queue Tab */}
        <TabsContent value="queue" className="mt-4">
          <Card className="bg-[#1E293B] border-gray-700">
            <CardContent className="p-4">
              <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-[#0F172A] border-gray-600 text-white"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 bg-[#0F172A] border-gray-600 text-white">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1E293B] border-gray-700 text-white">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="waiting">Waiting</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                {filteredTickets.map((ticket) => (
                  <div 
                    key={ticket.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-[#0F172A] border border-gray-700/50 cursor-pointer hover:border-gray-600 transition-colors"
                    onClick={() => {
                      setSelectedTicket(ticket)
                      setTicketDialogOpen(true)
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        ticket.status === 'open' ? 'bg-red-500/20 text-red-400' :
                        ticket.status === 'in_progress' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-white">{ticket.subject}</p>
                          {getPriorityBadge(ticket.priority)}
                          {getCategoryBadge(ticket.category)}
                        </div>
                        <p className="text-xs text-gray-400">
                          {ticket.merchantName} • {ticket.id} • {new Date(ticket.createdAt).toLocaleString('en-ZA')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(ticket.status)}
                      {ticket.assignee && (
                        <div className="text-right">
                          <p className="text-xs text-white">{ticket.assignee}</p>
                          <p className="text-[10px] text-gray-400">Assigned</p>
                        </div>
                      )}
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Merchant Lookup Tab */}
        <TabsContent value="lookup" className="mt-4">
          <Card className="bg-[#1E293B] border-gray-700">
            <CardContent className="p-6">
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-6">
                  <Building2 className="h-12 w-12 text-[#00897B] mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">Merchant Lookup</h3>
                  <p className="text-sm text-gray-400">Search for merchants by ID, name, phone, or email</p>
                </div>
                <div className="flex gap-3">
                  <Input 
                    placeholder="Enter merchant ID, name, phone, or email..."
                    className="flex-1 bg-[#0F172A] border-gray-600 text-white"
                  />
                  <Button className="bg-[#00897B] hover:bg-[#00695C] text-white">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transaction Search Tab */}
        <TabsContent value="search" className="mt-4">
          <Card className="bg-[#1E293B] border-gray-700">
            <CardContent className="p-6">
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-6">
                  <FileText className="h-12 w-12 text-[#00897B] mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">Transaction Search</h3>
                  <p className="text-sm text-gray-400">Find transactions by ID, amount, date, or reference</p>
                </div>
                <div className="flex gap-3">
                  <Input 
                    placeholder="Enter transaction ID, amount, or reference..."
                    className="flex-1 bg-[#0F172A] border-gray-600 text-white"
                  />
                  <Button className="bg-[#00897B] hover:bg-[#00695C] text-white">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-4">
          <Card className="bg-[#1E293B] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-base">Response Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { name: 'Payment Issue', category: 'technical', preview: 'Thank you for reporting this payment issue. I am investigating the transaction now...' },
                  { name: 'Settlement Inquiry', category: 'billing', preview: 'I have checked your settlement status. Your next settlement is scheduled for...' },
                  { name: 'KYC Assistance', category: 'compliance', preview: 'Thank you for your KYC submission. To complete your verification, please...' },
                  { name: 'Account Update', category: 'account', preview: 'I have updated your account details as requested. Please verify the changes...' },
                ].map((template, index) => (
                  <div key={index} className="p-4 rounded-lg bg-[#0F172A] border border-gray-700/50 cursor-pointer hover:border-gray-600 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-white">{template.name}</p>
                      <Badge className="bg-gray-500/20 text-gray-400 capitalize">{template.category}</Badge>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2">{template.preview}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ticket Detail Dialog */}
      <Dialog open={ticketDialogOpen} onOpenChange={setTicketDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#1E293B] border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#00897B]" />
              {selectedTicket?.subject}
            </DialogTitle>
            <DialogDescription className="text-gray-400 flex items-center gap-4">
              <span>{selectedTicket?.id}</span>
              <span>•</span>
              <span>{selectedTicket?.merchantName}</span>
              <span>•</span>
              <span>{selectedTicket?.merchantId}</span>
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4">
              {/* Ticket Meta */}
              <div className="flex flex-wrap gap-2">
                {getStatusBadge(selectedTicket.status)}
                {getPriorityBadge(selectedTicket.priority)}
                {getCategoryBadge(selectedTicket.category)}
                {selectedTicket.assignee && (
                  <Badge className="bg-[#00897B]/20 text-[#00897B] border-[#00897B]/30">
                    Assigned: {selectedTicket.assignee}
                  </Badge>
                )}
              </div>

              {/* Message Thread */}
              <div className="bg-[#0F172A] rounded-lg p-4 space-y-4 max-h-80 overflow-y-auto">
                {selectedTicket.messages.map((message) => (
                  <div 
                    key={message.id}
                    className={`p-3 rounded-lg ${
                      message.isInternal 
                        ? 'bg-amber-500/10 border border-amber-500/30' 
                        : message.author === 'merchant' 
                        ? 'bg-gray-700/50' 
                        : 'bg-[#00897B]/10 border border-[#00897B]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white capitalize">{message.author}</span>
                        {message.isInternal && (
                          <Badge className="bg-amber-500/20 text-amber-400 text-[10px]">Internal</Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(message.timestamp).toLocaleString('en-ZA')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{message.content}</p>
                  </div>
                ))}
              </div>

              {/* Reply Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button 
                    variant={!isInternal ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsInternal(false)}
                    className={!isInternal ? "bg-[#00897B] text-white" : "border-gray-600 text-gray-300"}
                  >
                    Reply
                  </Button>
                  <Button 
                    variant={isInternal ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsInternal(true)}
                    className={isInternal ? "bg-amber-600 text-white" : "border-gray-600 text-gray-300"}
                  >
                    Internal Note
                  </Button>
                </div>
                <Textarea
                  placeholder={isInternal ? "Add internal note (not visible to merchant)..." : "Type your reply..."}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="bg-[#0F172A] border-gray-600 text-white min-h-[100px]"
                />
                <div className="flex justify-between">
                  <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                    <Paperclip className="h-4 w-4 mr-2" />
                    Attach File
                  </Button>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={handleResolve}
                      className="border-green-500 text-green-400 hover:bg-green-500/20"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Resolve
                    </Button>
                    <Button 
                      className="bg-[#00897B] hover:bg-[#00695C] text-white"
                      onClick={handleSendMessage}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isInternal ? 'Add Note' : 'Send Reply'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
