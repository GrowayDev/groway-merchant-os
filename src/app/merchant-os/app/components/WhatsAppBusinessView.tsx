'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  MessageSquare,
  Send,
  Phone,
  FileText,
  Image as ImageIcon,
  File,
  Clock,
  Check,
  CheckCheck,
  AlertCircle,
  Plus,
  Settings,
  RefreshCw,
  Search,
  Eye,
  Edit,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  Bot,
  Zap,
  X,
  Save,
  Copy,
  Globe,
  MessageCircle,
  Users,
  Calendar,
  Play,
  Pause,
  Radio,
  Timer,
  Sparkles,
  Megaphone,
  Contact,
  Hash,
} from 'lucide-react'

// Custom WhatsApp Icon (lucide-react doesn't include brand icons)
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
)

// Types
interface WhatsAppConfig {
  id: string
  phoneNumber: string
  businessAccountId: string
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error'
  dailyLimit: number
  dailyUsed: number
  autoReply: boolean
  businessHoursOnly: boolean
  webhookUrl: string
  accessToken: string
  lastSync: string
  autoReplyMessage: string
  autoReplyGreeting: string
  autoReplyWorkingHours: { start: string; end: string }
  autoReplyAwayMessage: string
}

interface WhatsAppMessage {
  id: string
  recipientNumber: string
  recipientName?: string
  messageType: 'text' | 'template' | 'image' | 'document'
  content: string
  direction: 'inbound' | 'outbound'
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  sentAt: string
  templateName?: string
  mediaUrl?: string
  errorMessage?: string
  isScheduled?: boolean
  scheduledFor?: string
}

interface WhatsAppTemplate {
  id: string
  name: string
  category: 'auth' | 'marketing' | 'utility'
  language: string
  status: 'pending' | 'approved' | 'rejected'
  bodyText: string
  headerText?: string
  footerText?: string
  buttons?: string
  createdAt: string
  rejectionReason?: string
}

interface BroadcastList {
  id: string
  name: string
  description?: string
  contactCount: number
  lastSentAt?: string
  totalSent: number
  createdAt: string
  contacts: BroadcastContact[]
}

interface BroadcastContact {
  id: string
  name: string
  phone: string
  tags?: string[]
}

interface ScheduledMessage {
  id: string
  content: string
  templateName?: string
  scheduledFor: string
  status: 'pending' | 'sent' | 'cancelled'
  targetType: 'single' | 'broadcast'
  targetId: string
  targetName: string
  createdAt: string
}

interface ChatConversation {
  id: string
  contactName: string
  contactPhone: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  messages: WhatsAppMessage[]
}

// Mock data
const generateConfig = (): WhatsAppConfig => ({
  id: 'WAC-001',
  phoneNumber: '+27 82 123 4567',
  businessAccountId: 'WABA-123456789012345',
  connectionStatus: 'connected',
  dailyLimit: 1000,
  dailyUsed: 342,
  autoReply: true,
  businessHoursOnly: false,
  webhookUrl: 'https://webhook.groway.com/whatsapp/callback',
  accessToken: 'EAAxxxxxxxxxxxxxxxxxxxxxxxx',
  lastSync: new Date().toISOString(),
  autoReplyMessage: 'Thank you for contacting us! We will respond shortly.',
  autoReplyGreeting: 'Welcome to our business! How can we help you today?',
  autoReplyWorkingHours: { start: '08:00', end: '17:00' },
  autoReplyAwayMessage: 'We are currently closed. We will respond when we reopen.',
})

const generateMessages = (): WhatsAppMessage[] => [
  { id: 'MSG-001', recipientNumber: '+27 82 123 4567', recipientName: 'Thabo Mokoena', messageType: 'template', content: 'Your order #ORD-1234 has been confirmed and is being processed. Expected delivery: Tomorrow by 5 PM.', direction: 'outbound', status: 'read', sentAt: '2026-02-15T10:30:00', templateName: 'order_confirmation' },
  { id: 'MSG-002', recipientNumber: '+27 83 234 5678', recipientName: 'Sarah Naidoo', messageType: 'text', content: 'Thank you for your purchase! Your loyalty points have been updated.', direction: 'outbound', status: 'delivered', sentAt: '2026-02-15T10:25:00' },
  { id: 'MSG-003', recipientNumber: '+27 84 345 6789', recipientName: 'John van der Merwe', messageType: 'image', content: 'Check out our new arrivals!', direction: 'outbound', status: 'sent', sentAt: '2026-02-15T10:15:00', mediaUrl: 'https://example.com/image.jpg' },
  { id: 'MSG-004', recipientNumber: '+27 82 123 4567', recipientName: 'Thabo Mokoena', messageType: 'text', content: 'Hi, I would like to know my order status. Order #ORD-1234', direction: 'inbound', status: 'read', sentAt: '2026-02-15T09:45:00' },
  { id: 'MSG-005', recipientNumber: '+27 76 567 8901', recipientName: 'Lerato Dlamini', messageType: 'document', content: 'Invoice #INV-5678', direction: 'outbound', status: 'pending', sentAt: '2026-02-15T09:30:00', mediaUrl: 'https://example.com/invoice.pdf' },
  { id: 'MSG-006', recipientNumber: '+27 72 678 9012', recipientName: 'Michael Smith', messageType: 'template', content: 'We miss you! Come back and enjoy 25% off your next purchase.', direction: 'outbound', status: 'failed', sentAt: '2026-02-15T09:00:00', templateName: 'win_back', errorMessage: 'Recipient number invalid' },
  { id: 'MSG-007', recipientNumber: '+27 81 789 0123', recipientName: 'Nomsa Zwane', messageType: 'text', content: 'Your appointment is confirmed for tomorrow at 2 PM.', direction: 'outbound', status: 'delivered', sentAt: '2026-02-14T16:30:00' },
  { id: 'MSG-008', recipientNumber: '+27 83 890 1234', recipientName: 'David Williams', messageType: 'template', content: 'Your verification code is 123456. Valid for 5 minutes.', direction: 'outbound', status: 'read', sentAt: '2026-02-14T15:00:00', templateName: 'verification_code' },
]

const generateTemplates = (): WhatsAppTemplate[] => [
  { id: 'TPL-001', name: 'order_confirmation', category: 'utility', language: 'en', status: 'approved', bodyText: 'Your order {{1}} has been confirmed. Expected delivery: {{2}}.', headerText: 'Order Confirmed', footerText: 'Thank you for shopping with us!', createdAt: '2026-01-15' },
  { id: 'TPL-002', name: 'delivery_update', category: 'utility', language: 'en', status: 'approved', bodyText: 'Your order {{1}} is out for delivery. Track your package: {{2}}', createdAt: '2026-01-15' },
  { id: 'TPL-003', name: 'verification_code', category: 'auth', language: 'en', status: 'approved', bodyText: 'Your verification code is {{1}}. Valid for {{2}} minutes.', createdAt: '2026-01-20' },
  { id: 'TPL-004', name: 'win_back', category: 'marketing', language: 'en', status: 'approved', bodyText: 'We miss you! Come back and enjoy {{1}}% off your next purchase. Use code: {{2}}', headerText: 'Special Offer Just For You', createdAt: '2026-01-25' },
  { id: 'TPL-005', name: 'appointment_reminder', category: 'utility', language: 'en', status: 'approved', bodyText: 'Reminder: Your appointment is scheduled for {{1}} at {{2}}.', headerText: 'Appointment Reminder', footerText: 'Reply CANCEL to reschedule', createdAt: '2026-02-01' },
  { id: 'TPL-006', name: 'promo_weekly', category: 'marketing', language: 'en', status: 'pending', bodyText: 'This week\'s specials: {{1}}. Offer valid until {{2}}.', createdAt: '2026-02-10' },
  { id: 'TPL-007', name: 'loyalty_update', category: 'utility', language: 'en', status: 'rejected', bodyText: 'You\'ve earned {{1}} points! Total: {{2}} points.', rejectionReason: 'Template content too promotional for utility category', createdAt: '2026-02-05' },
  { id: 'TPL-008', name: 'new_product', category: 'marketing', language: 'en', status: 'approved', bodyText: 'Introducing {{1}}! Be the first to try it. {{2}}', headerText: 'New Arrival', buttons: '[{"type":"QUICK_REPLY","text":"Learn More"},{"type":"QUICK_REPLY","text":"Shop Now"}]', createdAt: '2026-02-08' },
]

const generateBroadcastLists = (): BroadcastList[] => [
  {
    id: 'BL-001',
    name: 'VIP Customers',
    description: 'High-value customers with loyalty status',
    contactCount: 156,
    lastSentAt: '2026-02-10T14:00:00',
    totalSent: 5,
    createdAt: '2026-01-01',
    contacts: [
      { id: 'C1', name: 'Thabo Mokoena', phone: '+27 82 123 4567', tags: ['VIP', 'Frequent'] },
      { id: 'C2', name: 'Sarah Naidoo', phone: '+27 83 234 5678', tags: ['VIP'] },
      { id: 'C3', name: 'John van der Merwe', phone: '+27 84 345 6789', tags: ['VIP', 'Wholesale'] },
    ]
  },
  {
    id: 'BL-002',
    name: 'Newsletter Subscribers',
    description: 'Customers opted in for marketing messages',
    contactCount: 1245,
    lastSentAt: '2026-02-12T09:00:00',
    totalSent: 12,
    createdAt: '2025-06-15',
    contacts: [
      { id: 'C4', name: 'Lerato Dlamini', phone: '+27 76 567 8901', tags: ['Newsletter'] },
      { id: 'C5', name: 'Michael Smith', phone: '+27 72 678 9012', tags: ['Newsletter', 'Promo'] },
    ]
  },
  {
    id: 'BL-003',
    name: 'Inactive Customers',
    description: 'Customers who haven\'t purchased in 60+ days',
    contactCount: 89,
    totalSent: 2,
    createdAt: '2026-01-15',
    contacts: [
      { id: 'C6', name: 'Nomsa Zwane', phone: '+27 81 789 0123', tags: ['Inactive'] },
    ]
  },
]

const generateScheduledMessages = (): ScheduledMessage[] => [
  {
    id: 'SM-001',
    content: 'Flash Sale! 50% off all items this weekend only.',
    templateName: 'promo_weekly',
    scheduledFor: '2026-02-20T08:00:00',
    status: 'pending',
    targetType: 'broadcast',
    targetId: 'BL-002',
    targetName: 'Newsletter Subscribers',
    createdAt: '2026-02-15T10:00:00'
  },
  {
    id: 'SM-002',
    content: 'Your order has been shipped and is on its way!',
    scheduledFor: '2026-02-16T14:00:00',
    status: 'pending',
    targetType: 'single',
    targetId: '+27 82 123 4567',
    targetName: 'Thabo Mokoena',
    createdAt: '2026-02-15T11:00:00'
  },
  {
    id: 'SM-003',
    content: 'Happy Birthday! Enjoy a special 20% discount on your next purchase.',
    scheduledFor: '2026-02-18T09:00:00',
    status: 'pending',
    targetType: 'single',
    targetId: '+27 83 234 5678',
    targetName: 'Sarah Naidoo',
    createdAt: '2026-02-14T15:00:00'
  },
]

const generateChatConversations = (): ChatConversation[] => [
  {
    id: 'CHAT-001',
    contactName: 'Thabo Mokoena',
    contactPhone: '+27 82 123 4567',
    lastMessage: 'Thanks for the update!',
    lastMessageTime: '2026-02-15T10:35:00',
    unreadCount: 0,
    messages: [
      { id: 'M1', recipientNumber: '+27 82 123 4567', recipientName: 'Thabo Mokoena', messageType: 'template', content: 'Your order #ORD-1234 has been confirmed and is being processed. Expected delivery: Tomorrow by 5 PM.', direction: 'outbound', status: 'read', sentAt: '2026-02-15T10:30:00', templateName: 'order_confirmation' },
      { id: 'M2', recipientNumber: '+27 82 123 4567', recipientName: 'Thabo Mokoena', messageType: 'text', content: 'Hi, I would like to know my order status. Order #ORD-1234', direction: 'inbound', status: 'read', sentAt: '2026-02-15T09:45:00' },
      { id: 'M3', recipientNumber: '+27 82 123 4567', recipientName: 'Thabo Mokoena', messageType: 'text', content: 'Thanks for the update!', direction: 'inbound', status: 'read', sentAt: '2026-02-15T10:35:00' },
    ]
  },
  {
    id: 'CHAT-002',
    contactName: 'Sarah Naidoo',
    contactPhone: '+27 83 234 5678',
    lastMessage: 'When will my order arrive?',
    lastMessageTime: '2026-02-15T11:00:00',
    unreadCount: 2,
    messages: [
      { id: 'M4', recipientNumber: '+27 83 234 5678', recipientName: 'Sarah Naidoo', messageType: 'text', content: 'Thank you for your purchase! Your loyalty points have been updated.', direction: 'outbound', status: 'delivered', sentAt: '2026-02-15T10:25:00' },
      { id: 'M5', recipientNumber: '+27 83 234 5678', recipientName: 'Sarah Naidoo', messageType: 'text', content: 'When will my order arrive?', direction: 'inbound', status: 'delivered', sentAt: '2026-02-15T11:00:00' },
    ]
  },
  {
    id: 'CHAT-003',
    contactName: 'John van der Merwe',
    contactPhone: '+27 84 345 6789',
    lastMessage: 'I need to change my delivery address',
    lastMessageTime: '2026-02-15T09:00:00',
    unreadCount: 1,
    messages: [
      { id: 'M6', recipientNumber: '+27 84 345 6789', recipientName: 'John van der Merwe', messageType: 'text', content: 'I need to change my delivery address', direction: 'inbound', status: 'delivered', sentAt: '2026-02-15T09:00:00' },
    ]
  },
]

// Component
export function WhatsAppBusinessView() {
  const [config, setConfig] = useState<WhatsAppConfig>(generateConfig)
  const [messages, setMessages] = useState<WhatsAppMessage[]>(generateMessages)
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(generateTemplates)
  const [broadcastLists, setBroadcastLists] = useState<BroadcastList[]>(generateBroadcastLists)
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>(generateScheduledMessages)
  const [conversations, setConversations] = useState<ChatConversation[]>(generateChatConversations)
  
  const [activeTab, setActiveTab] = useState('messages')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  
  // Dialog states
  const [sendMessageOpen, setSendMessageOpen] = useState(false)
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false)
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [messageDetailOpen, setMessageDetailOpen] = useState(false)
  const [createBroadcastOpen, setCreateBroadcastOpen] = useState(false)
  const [sendBroadcastOpen, setSendBroadcastOpen] = useState(false)
  const [scheduleMessageOpen, setScheduleMessageOpen] = useState(false)
  const [autoReplySettingsOpen, setAutoReplySettingsOpen] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<WhatsAppMessage | null>(null)
  const [selectedBroadcast, setSelectedBroadcast] = useState<BroadcastList | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null)
  
  // Form states
  const [newMessage, setNewMessage] = useState({
    recipientNumber: '',
    recipientName: '',
    messageType: 'text' as 'text' | 'template' | 'image' | 'document',
    content: '',
    templateName: '',
    mediaUrl: '',
  })
  
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: 'utility' as 'auth' | 'marketing' | 'utility',
    language: 'en',
    headerText: '',
    bodyText: '',
    footerText: '',
    buttons: '',
  })

  const [newBroadcast, setNewBroadcast] = useState({
    name: '',
    description: '',
  })

  const [broadcastForm, setBroadcastForm] = useState({
    broadcastId: '',
    templateName: '',
    customMessage: '',
    useTemplate: true,
  })

  const [scheduleForm, setScheduleForm] = useState({
    targetType: 'single' as 'single' | 'broadcast',
    targetId: '',
    targetName: '',
    templateName: '',
    content: '',
    scheduledDate: '',
    scheduledTime: '',
  })

  const [chatInput, setChatInput] = useState('')

  // Computed stats
  const totalMessages = messages.length
  const sentCount = messages.filter(m => m.direction === 'outbound' && m.status !== 'pending').length
  const deliveredCount = messages.filter(m => m.status === 'delivered' || m.status === 'read').length
  const readCount = messages.filter(m => m.status === 'read').length
  const failedCount = messages.filter(m => m.status === 'failed').length
  const pendingScheduled = scheduledMessages.filter(s => s.status === 'pending').length
  const totalBroadcastContacts = broadcastLists.reduce((sum, bl) => sum + bl.contactCount, 0)
  const unreadConversations = conversations.filter(c => c.unreadCount > 0).length

  // Filtered messages
  const filteredMessages = useMemo(() => messages.filter(m => {
    const matchesSearch = m.recipientNumber.includes(searchQuery) || m.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter
    const matchesType = typeFilter === 'all' || m.messageType === typeFilter
    return matchesSearch && matchesStatus && matchesType
  }), [messages, searchQuery, statusFilter, typeFilter])

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('en-ZA', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    })
  }

  // Get status color
  const getStatusColor = (status: WhatsAppMessage['status']) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-700',
      sent: 'bg-blue-100 text-blue-700',
      delivered: 'bg-green-100 text-green-700',
      read: 'bg-purple-100 text-purple-700',
      failed: 'bg-red-100 text-red-700',
    }
    return colors[status]
  }

  // Get status icon
  const getStatusIcon = (status: WhatsAppMessage['status']) => {
    const icons = {
      pending: <Clock className="h-3 w-3" />,
      sent: <Check className="h-3 w-3" />,
      delivered: <CheckCheck className="h-3 w-3" />,
      read: <CheckCheck className="h-3 w-3 text-purple-600" />,
      failed: <AlertCircle className="h-3 w-3" />,
    }
    return icons[status]
  }

  // Get message type icon
  const getMessageTypeIcon = (type: WhatsAppMessage['messageType']) => {
    const icons = {
      text: <MessageSquare className="h-3 w-3" />,
      template: <FileText className="h-3 w-3" />,
      image: <ImageIcon className="h-3 w-3" />,
      document: <File className="h-3 w-3" />,
    }
    return icons[type]
  }

  // Get category color
  const getCategoryColor = (category: WhatsAppTemplate['category']) => {
    const colors = {
      auth: 'bg-blue-100 text-blue-700',
      marketing: 'bg-purple-100 text-purple-700',
      utility: 'bg-green-100 text-green-700',
    }
    return colors[category]
  }

  // Get template status color
  const getTemplateStatusColor = (status: WhatsAppTemplate['status']) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    }
    return colors[status]
  }

  // Handle send message
  const handleSendMessage = () => {
    const message: WhatsAppMessage = {
      id: `MSG-${Date.now()}`,
      recipientNumber: newMessage.recipientNumber,
      recipientName: newMessage.recipientName,
      messageType: newMessage.messageType,
      content: newMessage.content,
      direction: 'outbound',
      status: 'sent',
      sentAt: new Date().toISOString(),
      templateName: newMessage.templateName || undefined,
      mediaUrl: newMessage.mediaUrl || undefined,
    }
    setMessages(prev => [message, ...prev])
    setNewMessage({ recipientNumber: '', recipientName: '', messageType: 'text', content: '', templateName: '', mediaUrl: '' })
    setSendMessageOpen(false)
  }

  // Handle create template
  const handleCreateTemplate = () => {
    const template: WhatsAppTemplate = {
      id: `TPL-${Date.now()}`,
      name: newTemplate.name,
      category: newTemplate.category,
      language: newTemplate.language,
      status: 'pending',
      bodyText: newTemplate.bodyText,
      headerText: newTemplate.headerText || undefined,
      footerText: newTemplate.footerText || undefined,
      buttons: newTemplate.buttons || undefined,
      createdAt: new Date().toISOString().split('T')[0],
    }
    setTemplates(prev => [template, ...prev])
    setNewTemplate({ name: '', category: 'utility', language: 'en', headerText: '', bodyText: '', footerText: '', buttons: '' })
    setCreateTemplateOpen(false)
  }

  // Handle delete template
  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId))
  }

  // Handle config update
  const handleConfigUpdate = (updates: Partial<WhatsAppConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  // Handle resend message
  const handleResendMessage = (messageId: string) => {
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, status: 'sent', sentAt: new Date().toISOString(), errorMessage: undefined } : m
    ))
  }

  // Handle create broadcast list
  const handleCreateBroadcast = () => {
    const broadcast: BroadcastList = {
      id: `BL-${Date.now()}`,
      name: newBroadcast.name,
      description: newBroadcast.description,
      contactCount: 0,
      totalSent: 0,
      createdAt: new Date().toISOString().split('T')[0],
      contacts: []
    }
    setBroadcastLists(prev => [...prev, broadcast])
    setNewBroadcast({ name: '', description: '' })
    setCreateBroadcastOpen(false)
  }

  // Handle send broadcast
  const handleSendBroadcast = () => {
    if (!selectedBroadcast) return
    
    setBroadcastLists(prev => prev.map(bl => 
      bl.id === selectedBroadcast.id 
        ? { ...bl, lastSentAt: new Date().toISOString(), totalSent: bl.totalSent + 1 }
        : bl
    ))
    setSendBroadcastOpen(false)
    setSelectedBroadcast(null)
  }

  // Handle schedule message
  const handleScheduleMessage = () => {
    const scheduled: ScheduledMessage = {
      id: `SM-${Date.now()}`,
      content: scheduleForm.useTemplate ? '' : scheduleForm.content,
      templateName: scheduleForm.templateName || undefined,
      scheduledFor: `${scheduleForm.scheduledDate}T${scheduleForm.scheduledTime}:00`,
      status: 'pending',
      targetType: scheduleForm.targetType,
      targetId: scheduleForm.targetId,
      targetName: scheduleForm.targetName,
      createdAt: new Date().toISOString()
    }
    setScheduledMessages(prev => [...prev, scheduled])
    setScheduleForm({
      targetType: 'single',
      targetId: '',
      targetName: '',
      templateName: '',
      content: '',
      scheduledDate: '',
      scheduledTime: '',
    })
    setScheduleMessageOpen(false)
  }

  // Handle cancel scheduled message
  const handleCancelScheduled = (id: string) => {
    setScheduledMessages(prev => prev.map(sm => 
      sm.id === id ? { ...sm, status: 'cancelled' } : sm
    ))
  }

  // Handle send chat message
  const handleSendChatMessage = () => {
    if (!selectedConversation || !chatInput.trim()) return
    
    const newMsg: WhatsAppMessage = {
      id: `MSG-${Date.now()}`,
      recipientNumber: selectedConversation.contactPhone,
      recipientName: selectedConversation.contactName,
      messageType: 'text',
      content: chatInput,
      direction: 'outbound',
      status: 'sent',
      sentAt: new Date().toISOString()
    }
    
    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversation.id 
        ? { 
            ...conv, 
            messages: [...conv.messages, newMsg],
            lastMessage: chatInput,
            lastMessageTime: new Date().toISOString()
          }
        : conv
    ))
    
    setSelectedConversation(prev => prev ? {
      ...prev,
      messages: [...prev.messages, newMsg],
      lastMessage: chatInput,
      lastMessageTime: new Date().toISOString()
    } : null)
    
    setChatInput('')
  }

  // Render Stats Cards
  const renderStatsCards = () => (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-[#757575]">Total Messages</p>
          <p className="text-2xl font-bold">{totalMessages}</p>
          <p className="text-xs text-[#757575]">Today</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-[#757575]">Sent</p>
          <p className="text-2xl font-bold text-blue-600">{sentCount}</p>
          <Badge className="bg-blue-100 text-blue-700 mt-1">Outbound</Badge>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-[#757575]">Delivered</p>
          <p className="text-2xl font-bold text-green-600">{deliveredCount}</p>
          <p className="text-xs text-green-600">{Math.round(deliveredCount / sentCount * 100) || 0}% rate</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-[#757575]">Read</p>
          <p className="text-2xl font-bold text-purple-600">{readCount}</p>
          <p className="text-xs text-purple-600">{Math.round(readCount / deliveredCount * 100) || 0}% rate</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-[#757575]">Failed</p>
          <p className="text-2xl font-bold text-red-600">{failedCount}</p>
          <p className="text-xs text-red-600">Needs attention</p>
        </CardContent>
      </Card>
    </div>
  )

  // Render Configuration Card
  const renderConfigCard = () => (
    <Card className="border-l-4 border-l-[#25D366]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="h-4 w-4 text-[#25D366]" />
            WhatsApp Business Configuration
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setAutoReplySettingsOpen(true)}>
              <Bot className="h-3 w-3 mr-1" />
              Auto-Reply
            </Button>
            <Button size="sm" variant="outline" onClick={() => setConfigDialogOpen(true)}>
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-[#757575]">Phone Number</p>
            <p className="font-medium flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#25D366]" />
              {config.phoneNumber}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#757575]">Business Account ID</p>
            <p className="font-medium font-mono text-sm">{config.businessAccountId}</p>
          </div>
          <div>
            <p className="text-xs text-[#757575]">Connection Status</p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                config.connectionStatus === 'connected' ? 'bg-green-500' :
                config.connectionStatus === 'connecting' ? 'bg-amber-500 animate-pulse' :
                'bg-red-500'
              }`} />
              <Badge className={
                config.connectionStatus === 'connected' ? 'bg-green-100 text-green-700' :
                config.connectionStatus === 'connecting' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }>
                {config.connectionStatus}
              </Badge>
            </div>
          </div>
          <div>
            <p className="text-xs text-[#757575]">Daily Message Limit</p>
            <div className="flex items-center gap-2">
              <span className="font-medium">{config.dailyUsed} / {config.dailyLimit}</span>
              <Progress value={(config.dailyUsed / config.dailyLimit) * 100} className="h-2 w-20" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#757575]">Auto-Reply</p>
              <p className="font-medium">{config.autoReply ? 'Enabled' : 'Disabled'}</p>
            </div>
            <Switch 
              checked={config.autoReply} 
              onCheckedChange={(checked) => handleConfigUpdate({ autoReply: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#757575]">Business Hours Only</p>
              <p className="font-medium">{config.businessHoursOnly ? 'Yes' : 'No'}</p>
            </div>
            <Switch 
              checked={config.businessHoursOnly} 
              onCheckedChange={(checked) => handleConfigUpdate({ businessHoursOnly: checked })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // Render Messages Section
  const renderMessagesSection = () => (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[#25D366]" />
            Messages
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">{filteredMessages.length} messages</Badge>
            <Button size="sm" variant="outline" className="h-7">
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
            <Input 
              placeholder="Search by number or content..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              className="pl-9" 
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="template">Template</SelectItem>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="document">Document</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Messages Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Recipient</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent Time</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMessages.slice(0, 10).map(message => (
                <TableRow key={message.id} className="cursor-pointer hover:bg-gray-50" onClick={() => { setSelectedMessage(message); setMessageDetailOpen(true) }}>
                  <TableCell>
                    <div>
                      <p className="font-mono text-sm">{message.recipientNumber}</p>
                      {message.recipientName && <p className="text-xs text-[#757575]">{message.recipientName}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center gap-1 w-fit">
                      {getMessageTypeIcon(message.messageType)}
                      {message.messageType}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">{message.content}</TableCell>
                  <TableCell>
                    <div className={`flex items-center gap-1 ${message.direction === 'inbound' ? 'text-blue-600' : 'text-green-600'}`}>
                      {message.direction === 'inbound' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      <span className="text-xs">{message.direction}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(message.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(message.status)}
                        {message.status}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-[#757575]">{formatDate(message.sentAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedMessage(message); setMessageDetailOpen(true) }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {message.status === 'failed' && (
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleResendMessage(message.id) }}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )

  // Render Templates Section
  const renderTemplatesSection = () => (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#25D366]" />
            Message Templates
          </CardTitle>
          <Button size="sm" className="bg-[#25D366] hover:bg-[#1DA851] text-white" onClick={() => { setEditingTemplate(null); setCreateTemplateOpen(true) }}>
            <Plus className="h-4 w-4 mr-1" />
            Create Template
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {templates.map(template => (
            <Card key={template.id} className={`border ${template.status === 'rejected' ? 'border-red-200 bg-red-50/30' : template.status === 'pending' ? 'border-amber-200 bg-amber-50/30' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium font-mono text-sm">{template.name}</h4>
                      <Badge className={getCategoryColor(template.category)}>{template.category}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        <Globe className="h-3 w-3 mr-1" />
                        {template.language}
                      </Badge>
                      <Badge className={getTemplateStatusColor(template.status)}>{template.status}</Badge>
                    </div>
                  </div>
                </div>
                
                {template.headerText && (
                  <p className="text-sm font-medium text-[#424242] mb-1">{template.headerText}</p>
                )}
                <p className="text-sm text-[#757575] line-clamp-2">{template.bodyText}</p>
                {template.footerText && (
                  <p className="text-xs text-[#9E9E9E] mt-1">{template.footerText}</p>
                )}
                
                {template.rejectionReason && (
                  <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-700">
                    <AlertCircle className="h-3 w-3 inline mr-1" />
                    {template.rejectionReason}
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <span className="text-xs text-[#9E9E9E]">Created: {template.createdAt}</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setEditingTemplate(template); setCreateTemplateOpen(true) }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDeleteTemplate(template.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  // Render Broadcast Lists Section
  const renderBroadcastSection = () => (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Broadcast Lists</p>
                <p className="text-2xl font-bold">{broadcastLists.length}</p>
              </div>
              <Radio className="h-8 w-8 text-[#25D366] opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Total Contacts</p>
                <p className="text-2xl font-bold">{totalBroadcastContacts.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Scheduled</p>
                <p className="text-2xl font-bold">{pendingScheduled}</p>
              </div>
              <Timer className="h-8 w-8 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Unread Chats</p>
                <p className="text-2xl font-bold">{unreadConversations}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Broadcast Lists */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-[#25D366]" />
              Broadcast Lists
            </CardTitle>
            <Button size="sm" className="bg-[#25D366] hover:bg-[#1DA851] text-white" onClick={() => setCreateBroadcastOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              New List
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {broadcastLists.map(list => (
              <div key={list.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-[#25D366]" />
                  </div>
                  <div>
                    <h4 className="font-medium">{list.name}</h4>
                    <p className="text-sm text-[#757575]">{list.description || 'No description'}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-[#757575]">
                      <span className="flex items-center gap-1">
                        <Contact className="h-3 w-3" />
                        {list.contactCount} contacts
                      </span>
                      <span className="flex items-center gap-1">
                        <Send className="h-3 w-3" />
                        {list.totalSent} sent
                      </span>
                      {list.lastSentAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last: {formatDate(list.lastSentAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setSelectedBroadcast(list); setSendBroadcastOpen(true) }}>
                    <Send className="h-4 w-4 mr-1" />
                    Send
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Messages */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Timer className="h-4 w-4 text-[#25D366]" />
              Scheduled Messages
            </CardTitle>
            <Button size="sm" className="bg-[#25D366] hover:bg-[#1DA851] text-white" onClick={() => setScheduleMessageOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Schedule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Target</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Scheduled For</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scheduledMessages.map(sm => (
                <TableRow key={sm.id}>
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {sm.targetType === 'broadcast' ? <Users className="h-3 w-3 mr-1" /> : <Contact className="h-3 w-3 mr-1" />}
                          {sm.targetType}
                        </Badge>
                        <span className="font-medium">{sm.targetName}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">
                    {sm.templateName ? (
                      <Badge variant="outline" className="text-xs">{sm.templateName}</Badge>
                    ) : (
                      sm.content
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#757575]" />
                      <span className="text-sm">{formatDateTime(sm.scheduledFor)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      sm.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      sm.status === 'sent' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }>
                      {sm.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {sm.status === 'pending' && (
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleCancelScheduled(sm.id)}>
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )

  // Render Chat Inbox Section
  const renderChatInbox = () => (
    <Card className="h-[600px]">
      <div className="flex h-full">
        {/* Conversations List */}
        <div className="w-1/3 border-r">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
              <Input placeholder="Search conversations..." className="pl-9" />
            </div>
          </div>
          <ScrollArea className="h-[calc(100%-60px)]">
            {conversations.map(conv => (
              <div 
                key={conv.id} 
                className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${selectedConversation?.id === conv.id ? 'bg-gray-100' : ''}`}
                onClick={() => setSelectedConversation(conv)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white font-bold">
                    {conv.contactName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm truncate">{conv.contactName}</h4>
                      <span className="text-xs text-[#757575]">{formatDate(conv.lastMessageTime)}</span>
                    </div>
                    <p className="text-xs text-[#757575] truncate">{conv.lastMessage}</p>
                    <p className="text-xs text-[#757575]">{conv.contactPhone}</p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <Badge className="bg-[#25D366] text-white">{conv.unreadCount}</Badge>
                  )}
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-3 border-b flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white font-bold">
                  {selectedConversation.contactName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-medium">{selectedConversation.contactName}</h4>
                  <p className="text-xs text-[#757575]">{selectedConversation.contactPhone}</p>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {selectedConversation.messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.direction === 'inbound' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[70%] rounded-lg p-3 ${
                        msg.direction === 'inbound' 
                          ? 'bg-gray-100 text-gray-900' 
                          : 'bg-[#DCF8C6] text-gray-900'
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-xs text-[#757575]">{formatDate(msg.sentAt)}</span>
                          {msg.direction === 'outbound' && (
                            <span className="text-[#757575]">
                              {getStatusIcon(msg.status)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Type a message..." 
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSendChatMessage()}
                    className="flex-1"
                  />
                  <Button className="bg-[#25D366] hover:bg-[#1DA851] text-white" onClick={handleSendChatMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#757575]">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#25D366] flex items-center justify-center">
            <WhatsAppIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              WhatsApp Business
              <Badge className={config.connectionStatus === 'connected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                {config.connectionStatus}
              </Badge>
            </h1>
            <p className="text-sm text-[#757575]">Manage your WhatsApp Business API integration</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setScheduleMessageOpen(true)}>
            <Timer className="h-4 w-4 mr-2" />
            Schedule
          </Button>
          <Button className="bg-[#25D366] hover:bg-[#1DA851] text-white" onClick={() => setSendMessageOpen(true)}>
            <Send className="h-4 w-4 mr-2" />
            Send Message
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-12 bg-transparent">
            <TabsTrigger value="messages" className="data-[state=active]:border-b-2 data-[state=active]:border-[#25D366] data-[state=active]:shadow-none rounded-none">
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="inbox" className="data-[state=active]:border-b-2 data-[state=active]:border-[#25D366] data-[state=active]:shadow-none rounded-none">
              <MessageCircle className="h-4 w-4 mr-2" />
              Inbox
              {unreadConversations > 0 && (
                <Badge className="ml-2 bg-[#25D366] text-white">{unreadConversations}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="broadcast" className="data-[state=active]:border-b-2 data-[state=active]:border-[#25D366] data-[state=active]:shadow-none rounded-none">
              <Megaphone className="h-4 w-4 mr-2" />
              Broadcast
            </TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:border-b-2 data-[state=active]:border-[#25D366] data-[state=active]:shadow-none rounded-none">
              <FileText className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6">
          {/* Stats */}
          {renderStatsCards()}
          
          {/* Configuration */}
          {renderConfigCard()}

          {/* Tab Content */}
          {activeTab === 'messages' && renderMessagesSection()}
          {activeTab === 'inbox' && renderChatInbox()}
          {activeTab === 'broadcast' && renderBroadcastSection()}
          {activeTab === 'templates' && renderTemplatesSection()}
        </div>
      </ScrollArea>

      {/* Send Message Dialog */}
      <Dialog open={sendMessageOpen} onOpenChange={setSendMessageOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-[#25D366]" />
              Send Message
            </DialogTitle>
            <DialogDescription>
              Send a message to a customer via WhatsApp
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Recipient Phone Number</Label>
              <Input 
                placeholder="+27 XX XXX XXXX" 
                value={newMessage.recipientNumber}
                onChange={e => setNewMessage(prev => ({ ...prev, recipientNumber: e.target.value }))}
              />
            </div>
            
            <div>
              <Label>Recipient Name (Optional)</Label>
              <Input 
                placeholder="John Doe" 
                value={newMessage.recipientName}
                onChange={e => setNewMessage(prev => ({ ...prev, recipientName: e.target.value }))}
              />
            </div>
            
            <div>
              <Label>Message Type</Label>
              <Select 
                value={newMessage.messageType} 
                onValueChange={(v: 'text' | 'template' | 'image' | 'document') => 
                  setNewMessage(prev => ({ ...prev, messageType: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text Message</SelectItem>
                  <SelectItem value="template">Template Message</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {newMessage.messageType === 'template' && (
              <div>
                <Label>Template</Label>
                <Select 
                  value={newMessage.templateName} 
                  onValueChange={v => setNewMessage(prev => ({ ...prev, templateName: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.filter(t => t.status === 'approved').map(t => (
                      <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {(newMessage.messageType === 'image' || newMessage.messageType === 'document') && (
              <div>
                <Label>Media URL</Label>
                <Input 
                  placeholder="https://example.com/file.jpg" 
                  value={newMessage.mediaUrl}
                  onChange={e => setNewMessage(prev => ({ ...prev, mediaUrl: e.target.value }))}
                />
              </div>
            )}
            
            <div>
              <Label>Content</Label>
              <Textarea 
                placeholder="Type your message here..." 
                rows={4}
                value={newMessage.content}
                onChange={e => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
              />
            </div>
            
            {/* Preview */}
            {newMessage.content && (
              <div className="border rounded-lg p-3 bg-gray-50">
                <p className="text-xs text-[#757575] mb-1">Preview</p>
                <div className="bg-[#DCF8C6] p-2 rounded-lg text-sm max-w-[250px]">
                  {newMessage.content}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendMessageOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-[#25D366] hover:bg-[#1DA851] text-white"
              onClick={handleSendMessage}
              disabled={!newMessage.recipientNumber || !newMessage.content}
            >
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog open={createTemplateOpen} onOpenChange={setCreateTemplateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#25D366]" />
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </DialogTitle>
            <DialogDescription>
              Create a new WhatsApp message template for approval
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label>Template Name</Label>
              <Input 
                placeholder="e.g., order_confirmation" 
                value={editingTemplate?.name || newTemplate.name}
                onChange={e => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
              />
              <p className="text-xs text-[#757575] mt-1">Use lowercase letters and underscores only</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select 
                  value={editingTemplate?.category || newTemplate.category} 
                  onValueChange={(v: 'auth' | 'marketing' | 'utility') => 
                    setNewTemplate(prev => ({ ...prev, category: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auth">Authentication</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="utility">Utility</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Language</Label>
                <Select 
                  value={editingTemplate?.language || newTemplate.language} 
                  onValueChange={v => setNewTemplate(prev => ({ ...prev, language: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="af">Afrikaans</SelectItem>
                    <SelectItem value="zu">Zulu</SelectItem>
                    <SelectItem value="xh">Xhosa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Header Text (Optional)</Label>
              <Input 
                placeholder="e.g., Order Confirmed" 
                value={editingTemplate?.headerText || newTemplate.headerText}
                onChange={e => setNewTemplate(prev => ({ ...prev, headerText: e.target.value }))}
              />
            </div>
            
            <div>
              <Label>Body Text</Label>
              <Textarea 
                placeholder="Your order {{1}} has been confirmed. Expected delivery: {{2}}." 
                rows={4}
                value={editingTemplate?.bodyText || newTemplate.bodyText}
                onChange={e => setNewTemplate(prev => ({ ...prev, bodyText: e.target.value }))}
              />
              <p className="text-xs text-[#757575] mt-1">Use {'{{1}}'}, {'{{2}}'}, etc. for variable placeholders</p>
            </div>
            
            <div>
              <Label>Footer Text (Optional)</Label>
              <Input 
                placeholder="e.g., Thank you for shopping with us!" 
                value={editingTemplate?.footerText || newTemplate.footerText}
                onChange={e => setNewTemplate(prev => ({ ...prev, footerText: e.target.value }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateTemplateOpen(false); setEditingTemplate(null) }}>
              Cancel
            </Button>
            <Button 
              className="bg-[#25D366] hover:bg-[#1DA851] text-white"
              onClick={handleCreateTemplate}
              disabled={!newTemplate.name || !newTemplate.bodyText}
            >
              <Save className="h-4 w-4 mr-2" />
              {editingTemplate ? 'Update' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Detail Dialog */}
      <Dialog open={messageDetailOpen} onOpenChange={setMessageDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#25D366]" />
              Message Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedMessage && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#757575]">Message ID</p>
                  <p className="font-mono text-sm">{selectedMessage.id}</p>
                </div>
                <div>
                  <p className="text-xs text-[#757575]">Status</p>
                  <Badge className={getStatusColor(selectedMessage.status)}>
                    {getStatusIcon(selectedMessage.status)}
                    {selectedMessage.status}
                  </Badge>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-[#757575]">Recipient</p>
                <p className="font-mono">{selectedMessage.recipientNumber}</p>
                {selectedMessage.recipientName && (
                  <p className="text-sm text-[#757575]">{selectedMessage.recipientName}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#757575]">Type</p>
                  <Badge variant="outline" className="flex items-center gap-1 w-fit">
                    {getMessageTypeIcon(selectedMessage.messageType)}
                    {selectedMessage.messageType}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-[#757575]">Direction</p>
                  <div className={`flex items-center gap-1 ${selectedMessage.direction === 'inbound' ? 'text-blue-600' : 'text-green-600'}`}>
                    {selectedMessage.direction === 'inbound' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    {selectedMessage.direction}
                  </div>
                </div>
              </div>
              
              {selectedMessage.templateName && (
                <div>
                  <p className="text-xs text-[#757575]">Template</p>
                  <p className="font-mono text-sm">{selectedMessage.templateName}</p>
                </div>
              )}
              
              <div>
                <p className="text-xs text-[#757575]">Content</p>
                <div className="bg-gray-50 p-3 rounded-lg text-sm mt-1">
                  {selectedMessage.content}
                </div>
              </div>
              
              {selectedMessage.mediaUrl && (
                <div>
                  <p className="text-xs text-[#757575]">Media URL</p>
                  <p className="font-mono text-sm text-blue-600 underline">{selectedMessage.mediaUrl}</p>
                </div>
              )}
              
              {selectedMessage.errorMessage && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-red-700 font-medium">Error</p>
                  <p className="text-sm text-red-600">{selectedMessage.errorMessage}</p>
                </div>
              )}
              
              <div>
                <p className="text-xs text-[#757575]">Sent At</p>
                <p className="text-sm">{formatDate(selectedMessage.sentAt)}</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageDetailOpen(false)}>
              Close
            </Button>
            {selectedMessage?.status === 'failed' && (
              <Button 
                className="bg-[#25D366] hover:bg-[#1DA851] text-white"
                onClick={() => { handleResendMessage(selectedMessage.id); setMessageDetailOpen(false) }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Resend
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Config Edit Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-[#25D366]" />
              Edit Configuration
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Phone Number</Label>
              <Input 
                value={config.phoneNumber}
                onChange={e => handleConfigUpdate({ phoneNumber: e.target.value })}
              />
            </div>
            
            <div>
              <Label>Business Account ID</Label>
              <Input 
                value={config.businessAccountId}
                onChange={e => handleConfigUpdate({ businessAccountId: e.target.value })}
                className="font-mono"
              />
            </div>
            
            <div>
              <Label>Webhook URL</Label>
              <Input 
                value={config.webhookUrl}
                onChange={e => handleConfigUpdate({ webhookUrl: e.target.value })}
                className="font-mono text-sm"
              />
            </div>
            
            <div>
              <Label>Access Token</Label>
              <Input 
                type="password"
                value={config.accessToken}
                onChange={e => handleConfigUpdate({ accessToken: e.target.value })}
                className="font-mono text-sm"
              />
            </div>
            
            <div>
              <Label>Daily Message Limit</Label>
              <Input 
                type="number"
                value={config.dailyLimit}
                onChange={e => handleConfigUpdate({ dailyLimit: parseInt(e.target.value) })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Auto-Reply</Label>
              <Switch 
                checked={config.autoReply}
                onCheckedChange={(checked) => handleConfigUpdate({ autoReply: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Business Hours Only</Label>
              <Switch 
                checked={config.businessHoursOnly}
                onCheckedChange={(checked) => handleConfigUpdate({ businessHoursOnly: checked })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-[#25D366] hover:bg-[#1DA851] text-white"
              onClick={() => setConfigDialogOpen(false)}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto-Reply Settings Dialog */}
      <Dialog open={autoReplySettingsOpen} onOpenChange={setAutoReplySettingsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-[#25D366]" />
              Auto-Reply Settings
            </DialogTitle>
            <DialogDescription>
              Configure automatic responses for incoming messages
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Enable Auto-Reply</p>
                <p className="text-xs text-[#757575]">Automatically respond to incoming messages</p>
              </div>
              <Switch 
                checked={config.autoReply}
                onCheckedChange={(checked) => handleConfigUpdate({ autoReply: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Business Hours Only</p>
                <p className="text-xs text-[#757575]">Only auto-reply outside business hours</p>
              </div>
              <Switch 
                checked={config.businessHoursOnly}
                onCheckedChange={(checked) => handleConfigUpdate({ businessHoursOnly: checked })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Working Hours Start</Label>
                <Input 
                  type="time"
                  value={config.autoReplyWorkingHours.start}
                  onChange={e => handleConfigUpdate({ 
                    autoReplyWorkingHours: { ...config.autoReplyWorkingHours, start: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label>Working Hours End</Label>
                <Input 
                  type="time"
                  value={config.autoReplyWorkingHours.end}
                  onChange={e => handleConfigUpdate({ 
                    autoReplyWorkingHours: { ...config.autoReplyWorkingHours, end: e.target.value }
                  })}
                />
              </div>
            </div>

            <div>
              <Label>Greeting Message</Label>
              <Textarea 
                placeholder="Welcome message sent when customer first messages"
                rows={2}
                value={config.autoReplyGreeting}
                onChange={e => handleConfigUpdate({ autoReplyGreeting: e.target.value })}
              />
            </div>

            <div>
              <Label>Default Auto-Reply</Label>
              <Textarea 
                placeholder="Message sent when auto-reply is triggered"
                rows={2}
                value={config.autoReplyMessage}
                onChange={e => handleConfigUpdate({ autoReplyMessage: e.target.value })}
              />
            </div>

            <div>
              <Label>Away Message (Outside Hours)</Label>
              <Textarea 
                placeholder="Message sent outside business hours"
                rows={2}
                value={config.autoReplyAwayMessage}
                onChange={e => handleConfigUpdate({ autoReplyAwayMessage: e.target.value })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAutoReplySettingsOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-[#25D366] hover:bg-[#1DA851] text-white"
              onClick={() => setAutoReplySettingsOpen(false)}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Broadcast List Dialog */}
      <Dialog open={createBroadcastOpen} onOpenChange={setCreateBroadcastOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#25D366]" />
              Create Broadcast List
            </DialogTitle>
            <DialogDescription>
              Create a new list for broadcast messaging
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>List Name</Label>
              <Input 
                placeholder="e.g., VIP Customers" 
                value={newBroadcast.name}
                onChange={e => setNewBroadcast(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div>
              <Label>Description (Optional)</Label>
              <Textarea 
                placeholder="Describe this list..."
                rows={2}
                value={newBroadcast.description}
                onChange={e => setNewBroadcast(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateBroadcastOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-[#25D366] hover:bg-[#1DA851] text-white"
              onClick={handleCreateBroadcast}
              disabled={!newBroadcast.name}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Broadcast Dialog */}
      <Dialog open={sendBroadcastOpen} onOpenChange={setSendBroadcastOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-[#25D366]" />
              Send Broadcast
            </DialogTitle>
            <DialogDescription>
              Send a message to {selectedBroadcast?.contactCount} contacts in {selectedBroadcast?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Use Template</p>
                <p className="text-xs text-[#757575]">Send using an approved template</p>
              </div>
              <Switch 
                checked={broadcastForm.useTemplate}
                onCheckedChange={(checked) => setBroadcastForm(prev => ({ ...prev, useTemplate: checked }))}
              />
            </div>

            {broadcastForm.useTemplate ? (
              <div>
                <Label>Select Template</Label>
                <Select 
                  value={broadcastForm.templateName}
                  onValueChange={v => setBroadcastForm(prev => ({ ...prev, templateName: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.filter(t => t.status === 'approved').map(t => (
                      <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label>Message Content</Label>
                <Textarea 
                  placeholder="Type your broadcast message..."
                  rows={4}
                  value={broadcastForm.customMessage}
                  onChange={e => setBroadcastForm(prev => ({ ...prev, customMessage: e.target.value }))}
                />
                <p className="text-xs text-amber-600 mt-1">
                  <AlertCircle className="h-3 w-3 inline mr-1" />
                  Non-template messages can only be sent within 24 hours of customer interaction
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendBroadcastOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-[#25D366] hover:bg-[#1DA851] text-white"
              onClick={handleSendBroadcast}
            >
              <Send className="h-4 w-4 mr-2" />
              Send to {selectedBroadcast?.contactCount} Contacts
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Message Dialog */}
      <Dialog open={scheduleMessageOpen} onOpenChange={setScheduleMessageOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-[#25D366]" />
              Schedule Message
            </DialogTitle>
            <DialogDescription>
              Schedule a message to be sent later
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Target Type</Label>
              <Select 
                value={scheduleForm.targetType}
                onValueChange={(v: 'single' | 'broadcast') => setScheduleForm(prev => ({ ...prev, targetType: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Contact</SelectItem>
                  <SelectItem value="broadcast">Broadcast List</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {scheduleForm.targetType === 'single' ? (
              <div>
                <Label>Phone Number</Label>
                <Input 
                  placeholder="+27 XX XXX XXXX"
                  value={scheduleForm.targetId}
                  onChange={e => setScheduleForm(prev => ({ ...prev, targetId: e.target.value, targetName: e.target.value }))}
                />
              </div>
            ) : (
              <div>
                <Label>Broadcast List</Label>
                <Select 
                  value={scheduleForm.targetId}
                  onValueChange={v => {
                    const list = broadcastLists.find(b => b.id === v)
                    setScheduleForm(prev => ({ ...prev, targetId: v, targetName: list?.name || '' }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a list" />
                  </SelectTrigger>
                  <SelectContent>
                    {broadcastLists.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name} ({b.contactCount} contacts)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Template (Optional)</Label>
              <Select 
                value={scheduleForm.templateName}
                onValueChange={v => setScheduleForm(prev => ({ ...prev, templateName: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (Custom Message)</SelectItem>
                  {templates.filter(t => t.status === 'approved').map(t => (
                    <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!scheduleForm.templateName && (
              <div>
                <Label>Message Content</Label>
                <Textarea 
                  placeholder="Type your message..."
                  rows={3}
                  value={scheduleForm.content}
                  onChange={e => setScheduleForm(prev => ({ ...prev, content: e.target.value }))}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input 
                  type="date"
                  value={scheduleForm.scheduledDate}
                  onChange={e => setScheduleForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                />
              </div>
              <div>
                <Label>Time</Label>
                <Input 
                  type="time"
                  value={scheduleForm.scheduledTime}
                  onChange={e => setScheduleForm(prev => ({ ...prev, scheduledTime: e.target.value }))}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleMessageOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-[#25D366] hover:bg-[#1DA851] text-white"
              onClick={handleScheduleMessage}
              disabled={!scheduleForm.scheduledDate || !scheduleForm.scheduledTime}
            >
              <Timer className="h-4 w-4 mr-2" />
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
