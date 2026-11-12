'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  Plus,
  Megaphone,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  PieChart,
  Users,
  Coins,
  Calendar,
  Clock,
  Eye,
  Edit,
  Trash2,
  Send,
  RefreshCw,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Bot,
  Lightbulb,
  Zap,
  Settings,
  Play,
  Pause,
  Copy,
  MessageCircle,
  MessageSquare,
  Mail,
  Bell,
  Share2,
  Heart,
  MousePointer,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  LineChart,
  X,
  Save,
  Image as ImageIcon,
  Link2,
  Globe,
  FileText,
  Star,
} from 'lucide-react'
import { useMerchantData } from '../hooks/useMerchantData'
import { EmptyState, NoDataEmptyState } from './EmptyState'

// Types
interface Campaign {
  id: string
  name: string
  type: 'whatsapp' | 'sms' | 'email' | 'push' | 'multi'
  targetSegment: string
  targetCount: number
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'failed'
  sentCount: number
  deliveredCount: number
  openedCount: number
  clickedCount: number
  convertedCount: number
  revenue: number
  cost: number
  roi: number
  scheduledDate?: string
  sentDate?: string
  createdAt: string
  subject?: string
  message: string
  channels: string[]
}

interface MarketingOffer {
  id: string
  name: string
  type: 'percentage' | 'fixed' | 'bogo' | 'bundle' | 'loyalty_boost'
  value: number
  minValue?: number
  maxValue?: number
  startDate: string
  endDate: string
  status: 'draft' | 'active' | 'paused' | 'expired'
  usageCount: number
  usageLimit?: number
  revenue: number
  redemptions: number
  targetSegments: string[]
  channels: string[]
  code?: string
  autoApply: boolean
}

interface MarketingInsight {
  id: string
  type: 'opportunity' | 'alert' | 'trend' | 'recommendation'
  title: string
  description: string
  metric?: string
  change?: number
  action: string
  priority: 'high' | 'medium' | 'low'
}

interface AnalyticsData {
  date: string
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  cost: number
}

interface Segment {
  id: string
  name: string
  count: number
  avgLTV: number
  totalRevenue: number
  lastCampaignDate?: string
}

// Email Template interface
interface EmailTemplate {
  id: string
  name: string
  subject: string
  previewText: string
  content: string
  category: 'promotional' | 'transactional' | 'newsletter' | 'welcome' | 'winback'
  variables: string[]
  usageCount: number
  lastUsed?: string
  isDefault: boolean
}

// SMS Template interface
interface SMSTemplate {
  id: string
  name: string
  content: string
  category: 'promotional' | 'transactional' | 'reminder' | 'welcome' | 'winback'
  variables: string[]
  usageCount: number
  lastUsed?: string
  isDefault: boolean
}

// Mock data generators removed - data now fetched from API

// Component
export function MarketingView() {
  // Get merchant data from session
  const { merchantId, isLoading: isLoadingMerchant } = useMerchantData()
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [offers, setOffers] = useState<MarketingOffer[]>([])
  const [insights, setInsights] = useState<MarketingInsight[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([])
  const [smsTemplates, setSmsTemplates] = useState<SMSTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  
  const [activeTab, setActiveTab] = useState<string>('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  
  // Dialog states
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [offerDialogOpen, setOfferDialogOpen] = useState(false)
  const [editingOffer, setEditingOffer] = useState<MarketingOffer | null>(null)
  const [campaignDetailOpen, setCampaignDetailOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)

  // Get merchant ID from session
  const getMerchantId = useCallback(() => {
    if (typeof window !== 'undefined') {
      const sessionStr = localStorage.getItem('groway_session')
      const session = sessionStr ? JSON.parse(sessionStr) : null
      return session?.merchantId || 'merchant-001'
    }
    return 'merchant-001'
  }, [])

  // Fetch campaigns from API
  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const merchantId = getMerchantId()
      const response = await fetch(`/merchant-os/api/marketing/campaigns?merchantId=${merchantId}`)
      const result = await response.json()
      
      if (result.success) {
        // Map API data to component format
        const mappedCampaigns: Campaign[] = result.data.map((c: any) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          targetSegment: c.targetSegment || 'All Customers',
          targetCount: c.targetCount || 0,
          status: c.status,
          sentCount: c.sentCount || 0,
          deliveredCount: c.deliveredCount || 0,
          openedCount: c.openedCount || 0,
          clickedCount: c.clickedCount || 0,
          convertedCount: c.convertedCount || 0,
          revenue: c.revenue || 0,
          cost: c.cost || 0,
          roi: c.cost > 0 ? Math.round((c.revenue - c.cost) / c.cost * 100) : 0,
          scheduledDate: c.scheduledAt?.split('T')[0],
          sentDate: c.sentAt?.split('T')[0],
          createdAt: c.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          subject: c.subject,
          message: c.content || '',
          channels: c.channels || []
        }))
        setCampaigns(mappedCampaigns)
      } else {
        setError(result.error || 'Failed to fetch campaigns')
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err)
      setError('Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }, [getMerchantId])

  // Load campaigns on mount
  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  // Computed stats
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length
  const totalMessagesSent = campaigns.reduce((s, c) => s + c.sentCount, 0)
  const avgOpenRate = campaigns.filter(c => c.sentCount > 0).reduce((s, c) => s + (c.openedCount / c.deliveredCount * 100), 0) / campaigns.filter(c => c.sentCount > 0).length || 0
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0)
  const totalCost = campaigns.reduce((s, c) => s + c.cost, 0)
  const avgROI = campaigns.filter(c => c.roi > 0).reduce((s, c) => s + c.roi, 0) / campaigns.filter(c => c.roi > 0).length || 0

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => campaigns.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    const matchesType = typeFilter === 'all' || c.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  }), [campaigns, searchQuery, statusFilter, typeFilter])

  // Format currency
  const formatCurrency = (amount: number) => `R${amount.toLocaleString()}`

  // Get status color
  const getStatusColor = (status: Campaign['status']) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      scheduled: 'bg-blue-100 text-blue-700',
      active: 'bg-green-100 text-green-700',
      paused: 'bg-amber-100 text-amber-700',
      completed: 'bg-purple-100 text-purple-700',
      failed: 'bg-red-100 text-red-700',
    }
    return colors[status]
  }

  // Get channel icon
  const getChannelIcon = (channel: string) => {
    const icons: Record<string, typeof MessageSquare> = {
      whatsapp: MessageCircle,
      sms: MessageSquare,
      email: Mail,
      push: Bell,
    }
    const Icon = icons[channel] || MessageSquare
    return <Icon className="h-3 w-3" />
  }

  // Handle campaign actions
  const handleCampaignAction = async (campaignId: string, action: 'pause' | 'resume' | 'duplicate' | 'delete') => {
    try {
      if (action === 'delete') {
        const response = await fetch(`/merchant-os/api/marketing/campaigns/${campaignId}`, {
          method: 'DELETE'
        })
        const result = await response.json()
        if (result.success) {
          setCampaigns(prev => prev.filter(c => c.id !== campaignId))
        } else {
          setError(result.error || 'Failed to delete campaign')
        }
        return
      }

      const newStatus = action === 'pause' ? 'paused' : action === 'resume' ? 'active' : 'draft'
      
      const response = await fetch(`/merchant-os/api/marketing/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      const result = await response.json()

      if (result.success) {
        setCampaigns(prev => prev.map(c => {
          if (c.id === campaignId) {
            if (action === 'pause') return { ...c, status: 'paused' as const }
            if (action === 'resume') return { ...c, status: 'active' as const }
            if (action === 'duplicate') return { ...c, id: result.data.id, name: result.data.name, status: 'draft' as const }
          }
          return c
        }))
      } else {
        setError(result.error || 'Failed to update campaign')
      }
    } catch (err) {
      console.error('Error updating campaign:', err)
      setError('Failed to update campaign')
    }
  }

  // Handle save campaign (create or update)
  const handleSaveCampaign = async (campaign: Partial<Campaign>) => {
    try {
      setSaving(true)
      const merchantId = getMerchantId()
      
      if (campaign.id && editingCampaign?.id) {
        // Update existing campaign
        const response = await fetch(`/merchant-os/api/marketing/campaigns/${campaign.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: campaign.name,
            type: campaign.type,
            targetSegment: campaign.targetSegment,
            status: campaign.status,
            content: campaign.message,
            subject: campaign.subject,
            channels: campaign.channels,
            scheduledAt: campaign.scheduledDate
          })
        })
        const result = await response.json()
        if (result.success) {
          fetchCampaigns() // Refresh the list
          setCampaignDialogOpen(false)
          setEditingCampaign(null)
        } else {
          setError(result.error || 'Failed to update campaign')
        }
      } else {
        // Create new campaign
        const response = await fetch('/merchant-os/api/marketing/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            merchantId,
            name: campaign.name,
            type: campaign.type,
            targetSegment: campaign.targetSegment,
            status: campaign.status || 'draft',
            content: campaign.message,
            subject: campaign.subject,
            channels: campaign.channels,
            scheduledAt: campaign.scheduledDate
          })
        })
        const result = await response.json()
        if (result.success) {
          fetchCampaigns() // Refresh the list
          setCampaignDialogOpen(false)
          setEditingCampaign(null)
        } else {
          setError(result.error || 'Failed to create campaign')
        }
      }
    } catch (err) {
      console.error('Error saving campaign:', err)
      setError('Failed to save campaign')
    } finally {
      setSaving(false)
    }
  }

  // Handle offer actions
  const handleOfferAction = (offerId: string, action: 'pause' | 'resume' | 'delete') => {
    setOffers(prev => prev.map(o => {
      if (o.id === offerId) {
        if (action === 'pause') return { ...o, status: 'paused' as const }
        if (action === 'resume') return { ...o, status: 'active' as const }
      }
      return o
    }))
    if (action === 'delete') {
      setOffers(prev => prev.filter(o => o.id !== offerId))
    }
  }

  // Render GroAI Insights
  const renderInsights = () => (
    <Card className="border-l-4 border-l-[#00897B]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bot className="h-4 w-4 text-[#00897B]" />
          GroAI Marketing Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map(insight => {
            const typeIcons = {
              opportunity: Lightbulb,
              alert: AlertCircle,
              trend: TrendingUp,
              recommendation: Target,
            }
            const priorityColors = {
              high: 'border-red-200 bg-red-50',
              medium: 'border-amber-200 bg-amber-50',
              low: 'border-green-200 bg-green-50',
            }
            const Icon = typeIcons[insight.type]
            return (
              <div key={insight.id} className={`p-3 rounded-lg border ${priorityColors[insight.priority]}`}>
                <div className="flex items-start gap-3">
                  <Icon className={`h-5 w-5 mt-0.5 ${insight.priority === 'high' ? 'text-red-600' : insight.priority === 'medium' ? 'text-amber-600' : 'text-green-600'}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                      {insight.change !== 0 && (
                        <div className={`flex items-center gap-1 text-xs ${insight.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {insight.change > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {Math.abs(insight.change)}%
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-[#757575] mt-1">{insight.description}</p>
                    <Button size="sm" variant="outline" className="mt-2 h-7 text-xs">
                      {insight.action}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )

  // Render Dashboard
  const renderDashboard = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-[#00897B]" />
          <span className="ml-2 text-[#757575]">Loading campaigns...</span>
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button variant="outline" onClick={fetchCampaigns}>
            <RefreshCw className="h-4 w-4 mr-2" />Retry
          </Button>
        </div>
      )
    }

    return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-[#00897B]">
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Active Campaigns</p>
            <p className="text-2xl font-bold">{activeCampaigns}</p>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />+2 this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Messages Sent</p>
            <p className="text-2xl font-bold">{totalMessagesSent.toLocaleString()}</p>
            <p className="text-xs text-[#757575]">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Avg Open Rate</p>
            <p className="text-2xl font-bold">{avgOpenRate.toFixed(1)}%</p>
            <Progress value={avgOpenRate} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Revenue Generated</p>
            <p className="text-2xl font-bold text-[#00897B]">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-[#757575]">From campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Avg ROI</p>
            <p className="text-2xl font-bold">{avgROI.toFixed(0)}%</p>
            <p className="text-xs text-green-600">Cost: {formatCurrency(totalCost)}</p>
          </CardContent>
        </Card>
      </div>

      {/* GroAI Insights */}
      {renderInsights()}

      {/* Quick Stats & Channel Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#00897B]" />
              Campaign Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { stage: 'Sent', count: campaigns.reduce((s, c) => s + c.sentCount, 0), color: 'bg-blue-500' },
                { stage: 'Delivered', count: campaigns.reduce((s, c) => s + c.deliveredCount, 0), color: 'bg-indigo-500' },
                { stage: 'Opened', count: campaigns.reduce((s, c) => s + c.openedCount, 0), color: 'bg-purple-500' },
                { stage: 'Clicked', count: campaigns.reduce((s, c) => s + c.clickedCount, 0), color: 'bg-pink-500' },
                { stage: 'Converted', count: campaigns.reduce((s, c) => s + c.convertedCount, 0), color: 'bg-green-500' },
              ].map((stage, i) => {
                const maxCount = campaigns.reduce((s, c) => Math.max(s, c.sentCount), 0)
                return (
                  <div key={stage.stage}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{stage.stage}</span>
                      <span>{stage.count.toLocaleString()}</span>
                    </div>
                    <Progress value={(stage.count / maxCount) * 100} className="h-2" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <PieChart className="h-4 w-4 text-[#00897B]" />
              Channel Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[
                { channel: 'WhatsApp', sent: 1523, rate: 42, color: 'text-green-600', bg: 'bg-green-100' },
                { channel: 'SMS', sent: 890, rate: 18.5, color: 'text-blue-600', bg: 'bg-blue-100' },
                { channel: 'Email', sent: 2156, rate: 35.2, color: 'text-purple-600', bg: 'bg-purple-100' },
                { channel: 'Push', sent: 650, rate: 28, color: 'text-orange-600', bg: 'bg-orange-100' },
              ].map(ch => (
                <div key={ch.channel} className={`p-3 rounded-lg ${ch.bg}`}>
                  <div className="flex items-center gap-2">
                    {getChannelIcon(ch.channel.toLowerCase())}
                    <span className="font-medium text-sm">{ch.channel}</span>
                  </div>
                  <div className="mt-2">
                    <p className={`text-lg font-bold ${ch.color}`}>{ch.rate}%</p>
                    <p className="text-xs text-[#757575]">{ch.sent.toLocaleString()} sent</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Campaigns */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Recent Campaigns</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setActiveTab('campaigns')}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {campaigns.slice(0, 4).map(campaign => (
              <div 
                key={campaign.id} 
                className="flex items-center gap-4 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                onClick={() => { setSelectedCampaign(campaign); setCampaignDetailOpen(true) }}
              >
                <div className="flex gap-1">
                  {campaign.channels.map(ch => (
                    <div key={ch} className="p-1.5 rounded bg-gray-100">
                      {getChannelIcon(ch)}
                    </div>
                  ))}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{campaign.name}</h4>
                    <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
                  </div>
                  <p className="text-xs text-[#757575]">{campaign.targetSegment} • {campaign.targetCount.toLocaleString()} recipients</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#00897B]">{formatCurrency(campaign.revenue)}</p>
                  <p className="text-xs text-[#757575]">ROI: {campaign.roi}%</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Render Campaigns List
  const renderCampaigns = () => (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
          <Input placeholder="Search campaigns..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="push">Push</SelectItem>
            <SelectItem value="multi">Multi-channel</SelectItem>
          </SelectContent>
        </Select>
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => { setEditingCampaign(null); setCampaignDialogOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />New Campaign
        </Button>
      </div>

      {/* Campaign List */}
      <ScrollArea className="flex-1">
        <div className="space-y-3">
          {filteredCampaigns.map(campaign => (
            <Card key={campaign.id} className="cursor-pointer hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex gap-1">
                    {campaign.channels.map(ch => (
                      <div key={ch} className={`p-2 rounded-lg ${ch === 'whatsapp' ? 'bg-green-100' : ch === 'sms' ? 'bg-blue-100' : ch === 'email' ? 'bg-purple-100' : 'bg-orange-100'}`}>
                        {getChannelIcon(ch)}
                      </div>
                    ))}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{campaign.name}</h4>
                      <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
                    </div>
                    <p className="text-xs text-[#757575] mt-1">{campaign.targetSegment} • {campaign.targetCount.toLocaleString()} recipients</p>
                    {campaign.scheduledDate && (
                      <p className="text-xs text-blue-600 mt-1">Scheduled: {campaign.scheduledDate}</p>
                    )}
                  </div>
                  
                  {campaign.sentCount > 0 && (
                    <div className="flex gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-bold">{campaign.sentCount}</p>
                        <p className="text-xs text-[#757575]">Sent</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold">{campaign.deliveredCount}</p>
                        <p className="text-xs text-[#757575]">Delivered</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold">{Math.round(campaign.openedCount / campaign.deliveredCount * 100)}%</p>
                        <p className="text-xs text-[#757575]">Open</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-[#00897B]">{formatCurrency(campaign.revenue)}</p>
                        <p className="text-xs text-[#757575]">Revenue</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-1">
                    {campaign.status === 'active' && (
                      <Button size="sm" variant="ghost" onClick={() => handleCampaignAction(campaign.id, 'pause')}>
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    {campaign.status === 'paused' && (
                      <Button size="sm" variant="ghost" onClick={() => handleCampaignAction(campaign.id, 'resume')}>
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => { setSelectedCampaign(campaign); setCampaignDetailOpen(true) }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleCampaignAction(campaign.id, 'duplicate')}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleCampaignAction(campaign.id, 'delete')}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )

  // Render Offers
  const renderOffers = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-bold">Marketing Offers</h2>
          <p className="text-sm text-[#757575]">Create and manage promotional offers</p>
        </div>
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => { setEditingOffer(null); setOfferDialogOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />Create Offer
        </Button>
      </div>

      {/* Active Offers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {offers.map(offer => {
          const typeColors = {
            percentage: 'bg-green-100 text-green-700',
            fixed: 'bg-blue-100 text-blue-700',
            bogo: 'bg-purple-100 text-purple-700',
            bundle: 'bg-orange-100 text-orange-700',
            loyalty_boost: 'bg-yellow-100 text-yellow-700',
          }
          const typeLabels = {
            percentage: '% Off',
            fixed: 'Fixed Amount',
            bogo: 'Buy 1 Get 1',
            bundle: 'Bundle Deal',
            loyalty_boost: 'Points Boost',
          }
          return (
            <Card key={offer.id} className={`${offer.status !== 'active' ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{offer.name}</h4>
                      <Badge className={typeColors[offer.type]}>{typeLabels[offer.type]}</Badge>
                    </div>
                    {offer.code && (
                      <p className="text-xs text-[#757575] mt-1">Code: <span className="font-mono font-bold">{offer.code}</span></p>
                    )}
                  </div>
                  <Badge className={offer.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                    {offer.status}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl font-bold text-[#00897B]">
                    {offer.type === 'percentage' ? `${offer.value}%` : offer.type === 'loyalty_boost' ? `${offer.value}x` : formatCurrency(offer.value)}
                  </span>
                  {offer.minValue && (
                    <span className="text-xs text-[#757575]">min spend {formatCurrency(offer.minValue)}</span>
                  )}
                </div>

                <div className="flex gap-4 text-xs text-[#757575] mb-3">
                  <span>{formatCurrency(offer.revenue)} revenue</span>
                  <span>{offer.redemptions} redemptions</span>
                  {offer.usageLimit && <span>{offer.usageCount}/{offer.usageLimit} used</span>}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {offer.channels.map(ch => (
                      <Badge key={ch} variant="outline" className="text-[10px]">{ch}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    {offer.status === 'active' && (
                      <Button size="sm" variant="ghost" onClick={() => handleOfferAction(offer.id, 'pause')}>
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    {offer.status === 'paused' && (
                      <Button size="sm" variant="ghost" onClick={() => handleOfferAction(offer.id, 'resume')}>
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => { setEditingOffer(offer); setOfferDialogOpen(true) }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleOfferAction(offer.id, 'delete')}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )

  // Render Analytics
  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* Performance Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-[#00897B]">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-[#757575]">Total Revenue</p>
            <p className="text-xs text-green-600 mt-1">↑ 23% vs last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{avgOpenRate.toFixed(1)}%</p>
            <p className="text-xs text-[#757575]">Avg Open Rate</p>
            <p className="text-xs text-green-600 mt-1">↑ 5% vs last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">12.5%</p>
            <p className="text-xs text-[#757575]">Click-through Rate</p>
            <p className="text-xs text-red-600 mt-1">↓ 2% vs last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{avgROI.toFixed(0)}%</p>
            <p className="text-xs text-[#757575]">Avg ROI</p>
            <p className="text-xs text-green-600 mt-1">↑ 18% vs last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Channel Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Channel Effectiveness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { channel: 'WhatsApp', sent: 1523, delivered: 1498, opened: 892, clicked: 324, cost: 450, revenue: 28500 },
                { channel: 'SMS', sent: 890, delivered: 865, opened: 160, clicked: 45, cost: 890, revenue: 8900 },
                { channel: 'Email', sent: 2156, delivered: 2089, opened: 735, clicked: 289, cost: 50, revenue: 45000 },
                { channel: 'Push', sent: 650, delivered: 640, opened: 179, clicked: 78, cost: 0, revenue: 12300 },
              ].map(ch => (
                <div key={ch.channel} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getChannelIcon(ch.channel.toLowerCase())}
                      <span className="font-medium">{ch.channel}</span>
                    </div>
                    <span className="font-bold text-[#00897B]">{formatCurrency(ch.revenue)}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <p className="text-[#757575]">Delivered</p>
                      <p className="font-medium">{ch.delivered}</p>
                    </div>
                    <div>
                      <p className="text-[#757575]">Opened</p>
                      <p className="font-medium">{Math.round(ch.opened / ch.delivered * 100)}%</p>
                    </div>
                    <div>
                      <p className="text-[#757575]">Clicked</p>
                      <p className="font-medium">{Math.round(ch.clicked / ch.opened * 100)}%</p>
                    </div>
                    <div>
                      <p className="text-[#757575]">Cost</p>
                      <p className="font-medium">{formatCurrency(ch.cost)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Segment Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {segments.slice(0, 6).map(segment => (
                <div key={segment.id} className="flex items-center gap-3 p-2 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{segment.name}</p>
                    <p className="text-xs text-[#757575]">{segment.count.toLocaleString()} customers</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{formatCurrency(segment.avgLTV)}</p>
                    <p className="text-xs text-[#757575]">Avg LTV</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Export Reports</h4>
              <p className="text-xs text-[#757575]">Download detailed analytics reports</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />CSV
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Render Templates
  const renderTemplates = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-bold">Campaign Templates</h2>
          <p className="text-sm text-[#757575]">Manage email and SMS templates for your campaigns</p>
        </div>
      </div>

      {/* Template Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-purple-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{emailTemplates.length}</p>
            <p className="text-xs text-purple-600">Email Templates</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{smsTemplates.length}</p>
            <p className="text-xs text-green-600">SMS Templates</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{emailTemplates.filter(t => t.isDefault).length + smsTemplates.filter(t => t.isDefault).length}</p>
            <p className="text-xs text-blue-600">Default Templates</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{emailTemplates.reduce((s, t) => s + t.usageCount, 0) + smsTemplates.reduce((s, t) => s + t.usageCount, 0)}</p>
            <p className="text-xs text-amber-600">Total Uses</p>
          </CardContent>
        </Card>
      </div>

      {/* Email Templates */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Mail className="h-4 w-4 text-purple-600" />
              Email Templates
            </CardTitle>
            <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]">
              <Plus className="h-3 w-3 mr-1" />Create Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {emailTemplates.map(template => (
              <div key={template.id} className="flex items-center gap-4 p-3 border rounded-lg hover:border-[#00897B]/30 transition-all">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">{template.name}</h4>
                    {template.isDefault && (
                      <Badge className="bg-yellow-100 text-yellow-700 text-[10px]">
                        <Star className="h-3 w-3 mr-1" />Default
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px] capitalize">{template.category}</Badge>
                  </div>
                  <p className="text-xs text-[#757575] mt-1">Subject: {template.subject}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-[#757575]">Variables: {template.variables.join(', ')}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{template.usageCount} uses</p>
                  <p className="text-xs text-[#757575]">Last: {template.lastUsed || 'Never'}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost"><Edit className="h-3 w-3" /></Button>
                  <Button size="sm" variant="ghost"><Copy className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SMS Templates */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-green-600" />
              SMS Templates
            </CardTitle>
            <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]">
              <Plus className="h-3 w-3 mr-1" />Create Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {smsTemplates.map(template => (
              <div key={template.id} className="flex items-center gap-4 p-3 border rounded-lg hover:border-[#00897B]/30 transition-all">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">{template.name}</h4>
                    {template.isDefault && (
                      <Badge className="bg-yellow-100 text-yellow-700 text-[10px]">
                        <Star className="h-3 w-3 mr-1" />Default
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px] capitalize">{template.category}</Badge>
                  </div>
                  <p className="text-xs text-[#757575] mt-1 line-clamp-1">{template.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-[#757575]">Variables: {template.variables.join(', ')}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{template.usageCount} uses</p>
                  <p className="text-xs text-[#757575]">Last: {template.lastUsed || 'Never'}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost"><Edit className="h-3 w-3" /></Button>
                  <Button size="sm" variant="ghost"><Copy className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Template Variables Guide */}
      <Card className="border-l-4 border-l-[#00897B]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Available Template Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-[#1A1A1A]">Customer</p>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-[#757575]"><code className="bg-gray-100 px-1 rounded">{'{{customer_name}}'}</code> - Full name</p>
                <p className="text-xs text-[#757575]"><code className="bg-gray-100 px-1 rounded">{'{{customer_id}}'}</code> - Customer ID</p>
                <p className="text-xs text-[#757575]"><code className="bg-gray-100 px-1 rounded">{'{{loyalty_points}}'}</code> - Points balance</p>
              </div>
            </div>
            <div>
              <p className="font-medium text-[#1A1A1A]">Business</p>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-[#757575]"><code className="bg-gray-100 px-1 rounded">{'{{business_name}}'}</code> - Your business name</p>
                <p className="text-xs text-[#757575]"><code className="bg-gray-100 px-1 rounded">{'{{discount}}'}</code> - Discount amount</p>
                <p className="text-xs text-[#757575]"><code className="bg-gray-100 px-1 rounded">{'{{expiry}}'}</code> - Offer expiry date</p>
              </div>
            </div>
            <div>
              <p className="font-medium text-[#1A1A1A]">Transaction</p>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-[#757575]"><code className="bg-gray-100 px-1 rounded">{'{{order_id}}'}</code> - Order reference</p>
                <p className="text-xs text-[#757575]"><code className="bg-gray-100 px-1 rounded">{'{{order_total}}'}</code> - Order amount</p>
                <p className="text-xs text-[#757575]"><code className="bg-gray-100 px-1 rounded">{'{{time}}'}</code> - Appointment time</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Tabs */}
      <div className="bg-white border-b px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent h-12">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <BarChart3 className="h-4 w-4 mr-2" />Dashboard
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Megaphone className="h-4 w-4 mr-2" />Campaigns
            </TabsTrigger>
            <TabsTrigger value="offers" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Zap className="h-4 w-4 mr-2" />Offers
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <LineChart className="h-4 w-4 mr-2" />Analytics
            </TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <FileText className="h-4 w-4 mr-2" />Templates
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'campaigns' && renderCampaigns()}
        {activeTab === 'offers' && renderOffers()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'templates' && renderTemplates()}
      </ScrollArea>

      {/* Campaign Detail Dialog */}
      <Dialog open={campaignDetailOpen} onOpenChange={setCampaignDetailOpen}>
        <DialogContent className="sm:max-w-2xl">
          {selectedCampaign && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedCampaign.name}</DialogTitle>
                <DialogDescription>Campaign performance details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(selectedCampaign.status)}>{selectedCampaign.status}</Badge>
                  {selectedCampaign.channels.map(ch => (
                    <Badge key={ch} variant="outline">{ch}</Badge>
                  ))}
                </div>
                
                {selectedCampaign.sentCount > 0 && (
                  <>
                    <div className="grid grid-cols-5 gap-3 text-center">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xl font-bold">{selectedCampaign.sentCount}</p>
                        <p className="text-xs text-[#757575]">Sent</p>
                      </div>
                      <div className="p-3 bg-indigo-50 rounded-lg">
                        <p className="text-xl font-bold">{selectedCampaign.deliveredCount}</p>
                        <p className="text-xs text-[#757575]">Delivered</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <p className="text-xl font-bold">{Math.round(selectedCampaign.openedCount / selectedCampaign.deliveredCount * 100)}%</p>
                        <p className="text-xs text-[#757575]">Opened</p>
                      </div>
                      <div className="p-3 bg-pink-50 rounded-lg">
                        <p className="text-xl font-bold">{Math.round(selectedCampaign.clickedCount / selectedCampaign.openedCount * 100)}%</p>
                        <p className="text-xs text-[#757575]">Clicked</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-xl font-bold">{selectedCampaign.convertedCount}</p>
                        <p className="text-xs text-[#757575]">Converted</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 border rounded-lg">
                        <p className="text-lg font-bold text-[#00897B]">{formatCurrency(selectedCampaign.revenue)}</p>
                        <p className="text-xs text-[#757575]">Revenue Generated</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <p className="text-lg font-bold">{formatCurrency(selectedCampaign.cost)}</p>
                        <p className="text-xs text-[#757575]">Campaign Cost</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <p className="text-lg font-bold text-green-600">{selectedCampaign.roi}%</p>
                        <p className="text-xs text-[#757575]">ROI</p>
                      </div>
                    </div>
                  </>
                )}

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-[#757575] mb-1">Message Preview</p>
                  <p className="text-sm">{selectedCampaign.message}</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCampaignDetailOpen(false)}>Close</Button>
                {selectedCampaign.status === 'draft' && (
                  <Button className="bg-[#00897B] hover:bg-[#00695C]">
                    <Send className="h-4 w-4 mr-2" />Launch Campaign
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Campaign Create/Edit Dialog */}
      <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCampaign?.id ? 'Edit Campaign' : 'Create New Campaign'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Campaign Name</Label>
              <Input placeholder="Enter campaign name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Target Segment</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select segment" /></SelectTrigger>
                  <SelectContent>
                    {segments.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.count})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Channels</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select channel" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="push">Push Notification</SelectItem>
                    <SelectItem value="multi">Multi-channel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Message</Label>
              <Textarea placeholder="Enter your message..." rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Schedule Date</Label>
                <Input type="date" />
              </div>
              <div>
                <Label className="text-xs">Schedule Time</Label>
                <Input type="time" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCampaignDialogOpen(false)}>Cancel</Button>
            <Button variant="outline">Save as Draft</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">Schedule Campaign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Offer Create/Edit Dialog */}
      <Dialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingOffer?.id ? 'Edit Offer' : 'Create New Offer'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Offer Name</Label>
              <Input placeholder="Enter offer name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Type</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage Off</SelectItem>
                    <SelectItem value="fixed">Fixed Amount Off</SelectItem>
                    <SelectItem value="bogo">Buy One Get One</SelectItem>
                    <SelectItem value="bundle">Bundle Deal</SelectItem>
                    <SelectItem value="loyalty_boost">Points Boost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Value</Label>
                <Input type="number" placeholder="Enter value" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Start Date</Label>
                <Input type="date" />
              </div>
              <div>
                <Label className="text-xs">End Date</Label>
                <Input type="date" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Promo Code (Optional)</Label>
              <Input placeholder="e.g. SUMMER20" />
            </div>
            <div className="flex items-center gap-2">
              <Switch />
              <Label className="text-xs">Auto-apply at checkout</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOfferDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">Save Offer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
