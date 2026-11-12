'use client'

import { useState, useRef, useEffect } from 'react'
import {
  MessageSquare,
  Search,
  Send,
  Paperclip,
  Image as ImageIcon,
  MoreVertical,
  Phone,
  Mail,
  Building2,
  Clock,
  Check,
  CheckCheck,
  Plus,
  X,
  FileText,
  ChevronLeft
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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

// Types
interface Message {
  id: string
  content: string
  timestamp: string
  senderId: string
  senderName: string
  isSupplier: boolean
  read: boolean
  attachments?: { name: string; size: string; type: string }[]
}

interface Conversation {
  id: string
  buyer: {
    id: string
    name: string
    code: string
    avatar?: string
  }
  subject: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  messages: Message[]
  createdAt: string
}

// Mock data
const mockConversations: Conversation[] = [
  {
    id: 'conv-001',
    buyer: { id: 'b1', name: 'Fresh Mart SA', code: 'FM001' },
    subject: 'Order PO-2024-001 Delivery Confirmation',
    lastMessage: 'Thank you for the quick response. We will expect the delivery tomorrow.',
    lastMessageTime: '2024-01-15T10:30:00Z',
    unreadCount: 0,
    createdAt: '2024-01-14T08:00:00Z',
    messages: [
      {
        id: 'm1',
        content: 'Hi, I wanted to confirm the delivery schedule for order PO-2024-001. We need the apples by Thursday morning.',
        timestamp: '2024-01-14T08:15:00Z',
        senderId: 'b1',
        senderName: 'Fresh Mart SA',
        isSupplier: false,
        read: true
      },
      {
        id: 'm2',
        content: 'Good morning! Yes, we have your order scheduled for delivery on Thursday, January 18th by 8:00 AM. Is that suitable for your receiving hours?',
        timestamp: '2024-01-14T09:30:00Z',
        senderId: 's1',
        senderName: 'Fresh Farm Produce SA',
        isSupplier: true,
        read: true
      },
      {
        id: 'm3',
        content: 'Perfect! 8:00 AM works well for us. Please ensure the Royal Gala apples are Grade A as specified in the PO.',
        timestamp: '2024-01-14T10:00:00Z',
        senderId: 'b1',
        senderName: 'Fresh Mart SA',
        isSupplier: false,
        read: true
      },
      {
        id: 'm4',
        content: 'Absolutely, all our apples are Grade A certified. I will personally ensure the quality check before dispatch. Would you like me to send photos of the batch before shipping?',
        timestamp: '2024-01-14T11:45:00Z',
        senderId: 's1',
        senderName: 'Fresh Farm Produce SA',
        isSupplier: true,
        read: true
      },
      {
        id: 'm5',
        content: 'That would be great! Please send them by Wednesday evening so we can prepare our receiving team.',
        timestamp: '2024-01-14T14:00:00Z',
        senderId: 'b1',
        senderName: 'Fresh Mart SA',
        isSupplier: false,
        read: true
      },
      {
        id: 'm6',
        content: 'Will do! I will also include the quality certificate with the delivery.',
        timestamp: '2024-01-14T15:30:00Z',
        senderId: 's1',
        senderName: 'Fresh Farm Produce SA',
        isSupplier: true,
        read: true
      },
      {
        id: 'm7',
        content: 'Thank you for the quick response. We will expect the delivery tomorrow.',
        timestamp: '2024-01-15T10:30:00Z',
        senderId: 'b1',
        senderName: 'Fresh Mart SA',
        isSupplier: false,
        read: true
      }
    ]
  },
  {
    id: 'conv-002',
    buyer: { id: 'b2', name: 'Shoprite Holdings', code: 'SH002' },
    subject: 'RFQ-2024-002 Clarification Request',
    lastMessage: 'Can you provide pricing for organic varieties as well?',
    lastMessageTime: '2024-01-15T09:15:00Z',
    unreadCount: 2,
    createdAt: '2024-01-13T11:00:00Z',
    messages: [
      {
        id: 'm1',
        content: 'Hello, we have a question about RFQ-2024-002. The quantities seem quite large - can you confirm the weekly delivery schedule?',
        timestamp: '2024-01-13T11:30:00Z',
        senderId: 'b2',
        senderName: 'Shoprite Holdings',
        isSupplier: false,
        read: true
      },
      {
        id: 'm2',
        content: 'Good afternoon! Yes, we can accommodate weekly deliveries for the quantities specified. The RFQ is for our new regional distribution center, so the volumes are higher than usual.',
        timestamp: '2024-01-13T14:00:00Z',
        senderId: 's1',
        senderName: 'Fresh Farm Produce SA',
        isSupplier: true,
        read: true
      },
      {
        id: 'm3',
        content: 'That makes sense. What is your lead time for such quantities?',
        timestamp: '2024-01-13T15:45:00Z',
        senderId: 'b2',
        senderName: 'Shoprite Holdings',
        isSupplier: false,
        read: true
      },
      {
        id: 'm4',
        content: 'For orders of this size, we typically require 48-72 hours notice. We can also set up a standing order for weekly deliveries if that works for you.',
        timestamp: '2024-01-13T16:30:00Z',
        senderId: 's1',
        senderName: 'Fresh Farm Produce SA',
        isSupplier: true,
        read: true
      },
      {
        id: 'm5',
        content: 'Standing order sounds good. Let me discuss with our procurement team.',
        timestamp: '2024-01-14T08:00:00Z',
        senderId: 'b2',
        senderName: 'Shoprite Holdings',
        isSupplier: false,
        read: true
      },
      {
        id: 'm6',
        content: 'Can you provide pricing for organic varieties as well?',
        timestamp: '2024-01-15T09:15:00Z',
        senderId: 'b2',
        senderName: 'Shoprite Holdings',
        isSupplier: false,
        read: false
      }
    ]
  },
  {
    id: 'conv-003',
    buyer: { id: 'b3', name: 'Woolworths Ltd', code: 'WL003' },
    subject: 'Quality Issue - Batch AVO-2024-015',
    lastMessage: 'We are investigating the quality issue you reported.',
    lastMessageTime: '2024-01-15T08:00:00Z',
    unreadCount: 1,
    createdAt: '2024-01-15T07:00:00Z',
    messages: [
      {
        id: 'm1',
        content: 'URGENT: We received batch AVO-2024-015 today and found significant quality issues. Approximately 30% of the avocados are overripe. This is affecting our store displays.',
        timestamp: '2024-01-15T07:30:00Z',
        senderId: 'b3',
        senderName: 'Woolworths Ltd',
        isSupplier: false,
        read: true,
        attachments: [
          { name: 'photo_1.jpg', size: '2.1 MB', type: 'image' },
          { name: 'quality_report.pdf', size: '156 KB', type: 'document' }
        ]
      },
      {
        id: 'm2',
        content: 'We sincerely apologize for this issue. We are investigating the quality issue you reported. Our quality team will review the cold chain logs and harvesting records.',
        timestamp: '2024-01-15T08:00:00Z',
        senderId: 's1',
        senderName: 'Fresh Farm Produce SA',
        isSupplier: true,
        read: false
      }
    ]
  },
  {
    id: 'conv-004',
    buyer: { id: 'b4', name: 'Pick n Pay Stores', code: 'PP004' },
    subject: 'New Product Request - Exotic Fruits',
    lastMessage: 'Let me check availability with our growers.',
    lastMessageTime: '2024-01-14T16:45:00Z',
    unreadCount: 0,
    createdAt: '2024-01-12T09:00:00Z',
    messages: [
      {
        id: 'm1',
        content: 'Hi there, we are looking to expand our exotic fruit range. Do you supply dragon fruit, passion fruit, or pomegranates?',
        timestamp: '2024-01-12T09:30:00Z',
        senderId: 'b4',
        senderName: 'Pick n Pay Stores',
        isSupplier: false,
        read: true
      },
      {
        id: 'm2',
        content: 'Hello! Yes, we do have access to exotic fruits through our network of growers. Let me check current availability and pricing for you.',
        timestamp: '2024-01-12T11:00:00Z',
        senderId: 's1',
        senderName: 'Fresh Farm Produce SA',
        isSupplier: true,
        read: true
      },
      {
        id: 'm3',
        content: 'That would be great! We are particularly interested in dragon fruit for our premium section.',
        timestamp: '2024-01-12T14:00:00Z',
        senderId: 'b4',
        senderName: 'Pick n Pay Stores',
        isSupplier: false,
        read: true
      },
      {
        id: 'm4',
        content: 'We have red and white dragon fruit available. Red dragon fruit is R180/box and white is R145/box. Minimum order is 20 boxes. Would you like me to send samples?',
        timestamp: '2024-01-12T16:00:00Z',
        senderId: 's1',
        senderName: 'Fresh Farm Produce SA',
        isSupplier: true,
        read: true
      },
      {
        id: 'm5',
        content: 'Yes, please send samples of both varieties. We will evaluate for our premium range.',
        timestamp: '2024-01-13T10:00:00Z',
        senderId: 'b4',
        senderName: 'Pick n Pay Stores',
        isSupplier: false,
        read: true
      },
      {
        id: 'm6',
        content: 'Samples will be dispatched today. You should receive them by tomorrow morning.',
        timestamp: '2024-01-14T09:00:00Z',
        senderId: 's1',
        senderName: 'Fresh Farm Produce SA',
        isSupplier: true,
        read: true
      },
      {
        id: 'm7',
        content: 'Also interested in passion fruit if available.',
        timestamp: '2024-01-14T14:30:00Z',
        senderId: 'b4',
        senderName: 'Pick n Pay Stores',
        isSupplier: false,
        read: true
      },
      {
        id: 'm8',
        content: 'Let me check availability with our growers.',
        timestamp: '2024-01-14T16:45:00Z',
        senderId: 's1',
        senderName: 'Fresh Farm Produce SA',
        isSupplier: true,
        read: true
      }
    ]
  },
  {
    id: 'conv-005',
    buyer: { id: 'b5', name: 'Spar Group SA', code: 'SP005' },
    subject: 'Seasonal Promotion Planning',
    lastMessage: 'Looking forward to the summer fruit campaign!',
    lastMessageTime: '2024-01-11T15:00:00Z',
    unreadCount: 0,
    createdAt: '2024-01-10T08:00:00Z',
    messages: [
      {
        id: 'm1',
        content: 'Hi, we are planning our summer fruit promotion for February. Would you be able to support with increased volumes of stone fruits?',
        timestamp: '2024-01-10T09:00:00Z',
        senderId: 'b5',
        senderName: 'Spar Group SA',
        isSupplier: false,
        read: true
      },
      {
        id: 'm2',
        content: 'Absolutely! Summer is peak season for stone fruits. We can supply peaches, nectarines, plums, and apricots. What volumes are you projecting?',
        timestamp: '2024-01-10T11:30:00Z',
        senderId: 's1',
        senderName: 'Fresh Farm Produce SA',
        isSupplier: true,
        read: true
      },
      {
        id: 'm3',
        content: 'We are looking at about 500 boxes per week across all stores. Can you commit to this volume?',
        timestamp: '2024-01-10T14:00:00Z',
        senderId: 'b5',
        senderName: 'Spar Group SA',
        isSupplier: false,
        read: true
      },
      {
        id: 'm4',
        content: 'Yes, we can definitely commit to that volume. Let me prepare a promotional pricing proposal for you.',
        timestamp: '2024-01-11T10:00:00Z',
        senderId: 's1',
        senderName: 'Fresh Farm Produce SA',
        isSupplier: true,
        read: true,
        attachments: [
          { name: 'summer_promo_pricing.pdf', size: '324 KB', type: 'document' }
        ]
      },
      {
        id: 'm5',
        content: 'Looking forward to the summer fruit campaign!',
        timestamp: '2024-01-11T15:00:00Z',
        senderId: 'b5',
        senderName: 'Spar Group SA',
        isSupplier: false,
        read: true
      }
    ]
  },
  {
    id: 'conv-006',
    buyer: { id: 'b6', name: 'Food Lovers Market', code: 'FLM006' },
    subject: 'Payment Terms Discussion',
    lastMessage: 'Approved for 30-day payment terms',
    lastMessageTime: '2024-01-10T11:00:00Z',
    unreadCount: 0,
    createdAt: '2024-01-08T10:00:00Z',
    messages: [
      {
        id: 'm1',
        content: 'Good morning, we would like to discuss extending our payment terms to 30 days. This would help with our cash flow management.',
        timestamp: '2024-01-08T10:30:00Z',
        senderId: 'b6',
        senderName: 'Food Lovers Market',
        isSupplier: false,
        read: true
      },
      {
        id: 'm2',
        content: 'Thank you for reaching out. We understand the need for flexible payment terms. Let me review your account history and credit standing.',
        timestamp: '2024-01-08T14:00:00Z',
        senderId: 's1',
        senderName: 'Fresh Farm Produce SA',
        isSupplier: true,
        read: true
      },
      {
        id: 'm3',
        content: 'Our account is in good standing with consistent orders for the past 12 months.',
        timestamp: '2024-01-09T09:00:00Z',
        senderId: 'b6',
        senderName: 'Food Lovers Market',
        isSupplier: false,
        read: true
      },
      {
        id: 'm4',
        content: 'Approved for 30-day payment terms',
        timestamp: '2024-01-10T11:00:00Z',
        senderId: 's1',
        senderName: 'Fresh Farm Produce SA',
        isSupplier: true,
        read: true,
        attachments: [
          { name: 'updated_terms_agreement.pdf', size: '98 KB', type: 'document' }
        ]
      }
    ]
  }
]

// Mock buyers for new message
const mockBuyers = [
  { id: 'b1', name: 'Fresh Mart SA', code: 'FM001' },
  { id: 'b2', name: 'Shoprite Holdings', code: 'SH002' },
  { id: 'b3', name: 'Woolworths Ltd', code: 'WL003' },
  { id: 'b4', name: 'Pick n Pay Stores', code: 'PP004' },
  { id: 'b5', name: 'Spar Group SA', code: 'SP005' },
  { id: 'b6', name: 'Food Lovers Market', code: 'FLM006' },
  { id: 'b7', name: 'Massmart Holdings', code: 'MM007' },
  { id: 'b8', name: 'Checkers Group', code: 'CG008' },
]

export default function MessagesPage() {
  const [conversations, setConversations] = useState(mockConversations)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [showComposeDialog, setShowComposeDialog] = useState(false)
  const [composeForm, setComposeForm] = useState({
    buyerId: '',
    subject: '',
    message: ''
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Filter conversations
  const filteredConversations = conversations.filter(conv =>
    !searchQuery ||
    conv.buyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Total unread count
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

  // Format time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    const diffDays = diffMs / (1000 * 60 * 60 * 24)

    if (diffHours < 1) {
      return 'Just now'
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`
    } else if (diffDays < 7) {
      return `${Math.floor(diffDays)}d ago`
    } else {
      return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
    }
  }

  // Format message time
  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('en-ZA', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConversation?.messages])

  // Handle select conversation
  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv)
    // Mark as read
    if (conv.unreadCount > 0) {
      setConversations(prev => prev.map(c =>
        c.id === conv.id ? { ...c, unreadCount: 0, messages: c.messages.map(m => ({ ...m, read: true })) } : c
      ))
    }
  }

  // Handle send message
  const handleSendMessage = () => {
    if (!selectedConversation || !newMessage.trim()) return

    const message: Message = {
      id: `m${Date.now()}`,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      senderId: 's1',
      senderName: 'Fresh Farm Produce SA',
      isSupplier: true,
      read: false
    }

    setConversations(prev => prev.map(c =>
      c.id === selectedConversation.id ? {
        ...c,
        messages: [...c.messages, message],
        lastMessage: message.content,
        lastMessageTime: message.timestamp
      } : c
    ))

    setSelectedConversation(prev => prev ? {
      ...prev,
      messages: [...prev.messages, message],
      lastMessage: message.content,
      lastMessageTime: message.timestamp
    } : null)

    setNewMessage('')
  }

  // Handle compose new message
  const handleComposeMessage = () => {
    if (!composeForm.buyerId || !composeForm.subject || !composeForm.message.trim()) return

    const buyer = mockBuyers.find(b => b.id === composeForm.buyerId)
    if (!buyer) return

    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      buyer: { id: buyer.id, name: buyer.name, code: buyer.code },
      subject: composeForm.subject,
      lastMessage: composeForm.message,
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
      createdAt: new Date().toISOString(),
      messages: [{
        id: `m${Date.now()}`,
        content: composeForm.message,
        timestamp: new Date().toISOString(),
        senderId: 's1',
        senderName: 'Fresh Farm Produce SA',
        isSupplier: true,
        read: false
      }]
    }

    setConversations(prev => [newConversation, ...prev])
    setShowComposeDialog(false)
    setComposeForm({ buyerId: '', subject: '', message: '' })
    setSelectedConversation(newConversation)
  }

  return (
    <div className="h-[calc(100vh-120px)] flex gap-4">
      {/* Conversations List */}
      <Card className={`w-full md:w-80 lg:w-96 flex-shrink-0 ${selectedConversation ? 'hidden md:flex' : 'flex'} flex-col`}>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Messages</CardTitle>
            <Button
              size="sm"
              className="bg-[#00897B] hover:bg-[#00695C]"
              onClick={() => setShowComposeDialog(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by buyer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {totalUnread > 0 && (
            <Badge className="mt-2 w-fit bg-[#00897B]">
              {totalUnread} unread message{totalUnread !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardHeader>
        <ScrollArea className="flex-1">
          <div className="divide-y divide-gray-100">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No conversations found</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedConversation?.id === conv.id ? 'bg-[#00897B]/5 border-l-2 border-[#00897B]' : ''
                  }`}
                  onClick={() => handleSelectConversation(conv)}
                >
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="bg-[#00897B] text-white text-sm">
                        {conv.buyer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-gray-900 truncate">{conv.buyer.name}</p>
                        <span className="text-xs text-gray-400 flex-shrink-0">{formatTime(conv.lastMessageTime)}</span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{conv.subject}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-400 truncate flex-1">{conv.lastMessage}</p>
                        {conv.unreadCount > 0 && (
                          <Badge className="bg-[#00897B] text-white text-xs px-1.5 ml-2">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Conversation Detail */}
      <Card className={`flex-1 flex flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
        {selectedConversation ? (
          <>
            {/* Conversation Header */}
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Avatar>
                    <AvatarFallback className="bg-[#00897B] text-white">
                      {selectedConversation.buyer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{selectedConversation.buyer.name}</CardTitle>
                    <p className="text-sm text-gray-500">{selectedConversation.subject}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Phone className="h-4 w-4 mr-2" />
                      Call Buyer
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Mail className="h-4 w-4 mr-2" />
                      Email Buyer
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Building2 className="h-4 w-4 mr-2" />
                      View Company Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <FileText className="h-4 w-4 mr-2" />
                      View Order History
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {selectedConversation.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isSupplier ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${msg.isSupplier ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`p-3 rounded-lg ${
                          msg.isSupplier
                            ? 'bg-[#00897B] text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className={`mt-2 space-y-1 ${msg.isSupplier ? 'text-white/80' : 'text-gray-500'}`}>
                            {msg.attachments.map((att, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs">
                                <Paperclip className="h-3 w-3" />
                                <span>{att.name}</span>
                                <span className="opacity-60">({att.size})</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className={`flex items-center gap-1 mt-1 text-xs text-gray-400 ${msg.isSupplier ? 'justify-end' : 'justify-start'}`}>
                        <span>{formatMessageTime(msg.timestamp)}</span>
                        {msg.isSupplier && (
                          msg.read ? (
                            <CheckCheck className="h-3 w-3 text-[#00897B]" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )
                        )}
                      </div>
                    </div>
                    {!msg.isSupplier && (
                      <Avatar className="h-8 w-8 ml-2 flex-shrink-0 order-2">
                        <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                          {msg.senderName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="flex-shrink-0">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="flex-shrink-0">
                  <ImageIcon className="h-4 w-4" />
                </Button>
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  className="bg-[#00897B] hover:bg-[#00695C] flex-shrink-0"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-700">Select a conversation</p>
              <p className="text-sm text-gray-400 mt-1">Choose a conversation from the list to view messages</p>
            </div>
          </div>
        )}
      </Card>

      {/* Compose New Message Dialog */}
      <Dialog open={showComposeDialog} onOpenChange={setShowComposeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
            <DialogDescription>
              Start a new conversation with a buyer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="buyer">Select Buyer *</Label>
              <Select
                value={composeForm.buyerId}
                onValueChange={(value) => setComposeForm(prev => ({ ...prev, buyerId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a buyer..." />
                </SelectTrigger>
                <SelectContent>
                  {mockBuyers.map((buyer) => (
                    <SelectItem key={buyer.id} value={buyer.id}>
                      {buyer.name} ({buyer.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={composeForm.subject}
                onChange={(e) => setComposeForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter message subject..."
              />
            </div>
            <div>
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={composeForm.message}
                onChange={(e) => setComposeForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Type your message..."
                rows={5}
              />
            </div>
            <div>
              <Label>Attachments (optional)</Label>
              <div className="mt-2 border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                <Paperclip className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Drag and drop files here or click to upload</p>
                <p className="text-xs text-gray-400 mt-1">Max 10MB per file</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowComposeDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#00897B] hover:bg-[#00695C]"
              onClick={handleComposeMessage}
              disabled={!composeForm.buyerId || !composeForm.subject || !composeForm.message.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
