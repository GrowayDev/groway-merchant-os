'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  Send,
  Users,
  MessageSquare,
  BarChart3,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  RefreshCw,
  Plus,
  Eye,
  Trash2,
  Copy,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Percent,
  Target,
  Zap,
  FileText,
  Settings,
  Loader2,
  AlertCircle,
  Megaphone,
  Mail,
  Globe,
  Smartphone
} from 'lucide-react'

// Types
interface Campaign {
  id: string
  name: string
  type: string
  message: string
  status: string
  totalRecipients: number
  sentCount: number
  deliveredCount: number
  failedCount: number
  openedCount: number
  clickedCount: number
  scheduledAt?: Date
  startedAt?: Date
  completedAt?: Date
  createdAt: Date
}

interface Template {
  id: string
  name: string
  category: string
  status: string
  body: string
  variables: string[]
}

interface BroadcastList {
  id: string
  name: string
  count: number
  segments: string[]
}

export default function WhatsAppCampaignEngine() {
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [broadcastLists, setBroadcastLists] = useState<BroadcastList[]>([])
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    totalRecipients: 0,
    totalDelivered: 0,
    totalOpened: 0
  })

  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [processing, setProcessing] = useState(false)

  // New campaign form
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    type: 'broadcast',
    message: '',
    templateId: '',
    scheduledAt: '',
    listId: ''
  })

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/whatsapp/campaigns')
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
        setStats(data.stats || {})
      }

      // Mock templates
      setTemplates([
        { id: 'tpl-001', name: 'Order Confirmation', category: 'transactional', status: 'approved', body: 'Order {{order_number}} confirmed! Total: {{amount}}', variables: ['order_number', 'amount'] },
        { id: 'tpl-002', name: 'Delivery Update', category: 'transactional', status: 'approved', body: 'Your order {{order_number}} is {{status}}. Track: {{link}}', variables: ['order_number', 'status', 'link'] },
        { id: 'tpl-003', name: 'Promotional Offer', category: 'marketing', status: 'approved', body: '🎉 {{offer}}! Use code {{code}} before {{expiry}}.', variables: ['offer', 'code', 'expiry'] },
        { id: 'tpl-004', name: 'Loyalty Points', category: 'utility', status: 'pending', body: 'You have {{points}} points! Redeem at {{link}}', variables: ['points', 'link'] }
      ])

      // Mock broadcast lists
      setBroadcastLists([
        { id: 'list-001', name: 'All Customers', count: 12500, segments: ['all'] },
        { id: 'list-002', name: 'Active Buyers (30 days)', count: 3500, segments: ['active_30d'] },
        { id: 'list-003', name: 'Loyalty Members', count: 2800, segments: ['loyalty'] },
        { id: 'list-004', name: 'New Customers (7 days)', count: 450, segments: ['new_7d'] },
        { id: 'list-005', name: 'Cart Abandoners', count: 890, segments: ['cart_abandon'] }
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }, [])

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchData()
      setLoading(false)
    }
    loadData()
  }, [fetchData])

  // Create campaign
  const createCampaign = async () => {
    if (!newCampaign.name || !newCampaign.message) {
      toast.error('Please fill in campaign name and message')
      return
    }

    setProcessing(true)
    try {
      const response = await fetch('/api/whatsapp/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCampaign)
      })

      if (response.ok) {
        toast.success('Campaign created successfully')
        setCreateDialogOpen(false)
        setNewCampaign({ name: '', type: 'broadcast', message: '', templateId: '', scheduledAt: '', listId: '' })
        fetchData()
      }
    } catch {
      toast.error('Failed to create campaign')
    }
    setProcessing(false)
  }

  // Campaign action
  const handleCampaignAction = async (campaign: Campaign, action: string) => {
    setProcessing(true)
    try {
      const response = await fetch('/api/whatsapp/campaigns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: campaign.id, action })
      })

      if (response.ok) {
        toast.success(`Campaign ${action} successful`)
        fetchData()
        setDetailDialogOpen(false)
      }
    } catch {
      toast.error('Action failed')
    }
    setProcessing(false)
  }

  // Format date
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-ZA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      paused: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      completed: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/30'
    }
    return <Badge className={`${styles[status] || 'bg-gray-500/20 text-gray-400'} border capitalize`}>
      {status}
    </Badge>
  }

  // Get type badge
  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      broadcast: 'bg-[#00897B]/20 text-[#00897B] border-[#00897B]/30',
      template: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      automated: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
    }
    return <Badge className={`${styles[type] || 'bg-gray-500/20 text-gray-400'} border capitalize`}>
      {type}
    </Badge>
  }

  // Calculate delivery rate
  const getDeliveryRate = (campaign: Campaign) => {
    if (campaign.sentCount === 0) return 0
    return Math.round((campaign.deliveredCount / campaign.sentCount) * 100)
  }

  // Calculate open rate
  const getOpenRate = (campaign: Campaign) => {
    if (campaign.deliveredCount === 0) return 0
    return Math.round((campaign.openedCount / campaign.deliveredCount) * 100)
  }

  // Calculate click rate
  const getClickRate = (campaign: Campaign) => {
    if (campaign.deliveredCount === 0) return 0
    return Math.round((campaign.clickedCount / campaign.deliveredCount) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-[#00897B]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-[#00897B]" />
            WhatsApp Campaign Engine
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Broadcast campaigns, template management, and analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
            onClick={fetchData}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            size="sm"
            className="bg-[#00897B] hover:bg-[#00695C] text-white"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#1E293B] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#00897B]/20 text-[#00897B]">
                <Megaphone className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-gray-400">Total Campaigns</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1E293B] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-500/20 text-green-400">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalRecipients?.toLocaleString()}</p>
            <p className="text-xs text-gray-400">Total Recipients</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1E293B] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/20 text-blue-400">
                <Target className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">
              {stats.totalDelivered > 0 ? Math.round((stats.totalOpened / stats.totalDelivered) * 100) : 0}%
            </p>
            <p className="text-xs text-gray-400">Avg Open Rate</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1E293B] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-500/20 text-purple-400">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{stats.active}</p>
            <p className="text-xs text-gray-400">Active Campaigns</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Campaign List */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="all">
            <TabsList className="bg-[#1E293B] border border-gray-700 mb-4">
              <TabsTrigger value="all" className="data-[state=active]:bg-[#00897B]">All</TabsTrigger>
              <TabsTrigger value="active" className="data-[state=active]:bg-[#00897B]">Active</TabsTrigger>
              <TabsTrigger value="scheduled" className="data-[state=active]:bg-[#00897B]">Scheduled</TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-[#00897B]">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <Card className="bg-[#1E293B] border-gray-700">
                <CardContent className="p-4">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {campaigns.map((campaign) => (
                        <div 
                          key={campaign.id}
                          className="p-4 rounded-lg bg-[#0F172A] border border-gray-700/50 cursor-pointer hover:border-gray-600"
                          onClick={() => { setSelectedCampaign(campaign); setDetailDialogOpen(true); }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                campaign.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                campaign.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                                campaign.status === 'completed' ? 'bg-purple-500/20 text-purple-400' :
                                'bg-gray-500/20 text-gray-400'
                              }`}>
                                <MessageSquare className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-white font-medium">{campaign.name}</p>
                                <p className="text-xs text-gray-400">{formatDate(campaign.createdAt)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getTypeBadge(campaign.type)}
                              {getStatusBadge(campaign.status)}
                            </div>
                          </div>

                          {/* Progress */}
                          {campaign.status === 'active' && campaign.totalRecipients > 0 && (
                            <div className="mb-3">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-gray-400">
                                  {campaign.sentCount.toLocaleString()} / {campaign.totalRecipients.toLocaleString()} sent
                                </span>
                                <span className="text-gray-400">
                                  {Math.round((campaign.sentCount / campaign.totalRecipients) * 100)}%
                                </span>
                              </div>
                              <Progress 
                                value={(campaign.sentCount / campaign.totalRecipients) * 100} 
                                className="h-2 bg-gray-700"
                              />
                            </div>
                          )}

                          {/* Stats */}
                          <div className="grid grid-cols-4 gap-2 text-center text-xs">
                            <div className="bg-gray-800/50 p-2 rounded">
                              <p className="text-gray-400">Sent</p>
                              <p className="text-white font-medium">{campaign.sentCount.toLocaleString()}</p>
                            </div>
                            <div className="bg-gray-800/50 p-2 rounded">
                              <p className="text-gray-400">Delivered</p>
                              <p className="text-white font-medium">{campaign.deliveredCount.toLocaleString()}</p>
                            </div>
                            <div className="bg-gray-800/50 p-2 rounded">
                              <p className="text-gray-400">Opened</p>
                              <p className="text-white font-medium">{campaign.openedCount.toLocaleString()}</p>
                            </div>
                            <div className="bg-gray-800/50 p-2 rounded">
                              <p className="text-gray-400">Clicked</p>
                              <p className="text-white font-medium">{campaign.clickedCount.toLocaleString()}</p>
                            </div>
                          </div>

                          {campaign.status === 'active' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="w-full mt-3 border-gray-600 text-gray-300"
                              onClick={(e) => { e.stopPropagation(); handleCampaignAction(campaign, 'pause'); }}
                            >
                              <Pause className="h-4 w-4 mr-2" />
                              Pause Campaign
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="active">
              <Card className="bg-[#1E293B] border-gray-700">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {campaigns.filter(c => c.status === 'active').map((campaign) => (
                      <div key={campaign.id} className="p-4 rounded-lg bg-[#0F172A] border border-green-500/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">{campaign.name}</p>
                            <p className="text-xs text-gray-400">{campaign.sentCount} / {campaign.totalRecipients} sent</p>
                          </div>
                          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                            <Pause className="h-4 w-4 mr-2" />
                            Pause
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scheduled">
              <Card className="bg-[#1E293B] border-gray-700">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {campaigns.filter(c => c.status === 'scheduled').map((campaign) => (
                      <div key={campaign.id} className="p-4 rounded-lg bg-[#0F172A] border border-blue-500/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">{campaign.name}</p>
                            <p className="text-xs text-blue-400">
                              Scheduled: {campaign.scheduledAt ? formatDate(campaign.scheduledAt) : 'N/A'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="border-gray-600 text-gray-300">
                              Edit
                            </Button>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                              <Play className="h-4 w-4 mr-2" />
                              Start Now
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="completed">
              <Card className="bg-[#1E293B] border-gray-700">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {campaigns.filter(c => c.status === 'completed').map((campaign) => (
                      <div key={campaign.id} className="p-4 rounded-lg bg-[#0F172A] border border-purple-500/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">{campaign.name}</p>
                            <p className="text-xs text-gray-400">
                              {campaign.deliveredCount} delivered • {getOpenRate(campaign)}% open rate
                            </p>
                          </div>
                          <Button size="sm" variant="outline" className="border-gray-600 text-gray-300">
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Broadcast Lists */}
          <Card className="bg-[#1E293B] border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-[#00897B]" />
                Broadcast Lists
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {broadcastLists.map((list) => (
                  <div 
                    key={list.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#0F172A] hover:bg-gray-800 cursor-pointer"
                  >
                    <div>
                      <p className="text-white text-sm">{list.name}</p>
                      <p className="text-xs text-gray-400">{list.count.toLocaleString()} contacts</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-3 border-gray-600 text-gray-300">
                <Plus className="h-4 w-4 mr-2" />
                Create List
              </Button>
            </CardContent>
          </Card>

          {/* Templates */}
          <Card className="bg-[#1E293B] border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#00897B]" />
                Message Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {templates.map((template) => (
                  <div 
                    key={template.id}
                    className="p-3 rounded-lg bg-[#0F172A]"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white text-sm">{template.name}</p>
                      <Badge className={`${template.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'} border-0`}>
                        {template.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{template.body}</p>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-3 border-gray-600 text-gray-300">
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-[#1E293B] border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#00897B]" />
                Performance (30 days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Delivery Rate</span>
                    <span className="text-white">96.2%</span>
                  </div>
                  <Progress value={96.2} className="h-2 bg-gray-700" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Open Rate</span>
                    <span className="text-white">74.5%</span>
                  </div>
                  <Progress value={74.5} className="h-2 bg-gray-700" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Click Rate</span>
                    <span className="text-white">23.8%</span>
                  </div>
                  <Progress value={23.8} className="h-2 bg-gray-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Campaign Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1E293B] border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#00897B]" />
              Campaign Details
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedCampaign?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedCampaign && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                {getTypeBadge(selectedCampaign.type)}
                {getStatusBadge(selectedCampaign.status)}
              </div>

              {/* Message Preview */}
              <div className="bg-[#0F172A] p-4 rounded-lg">
                <p className="text-gray-400 text-xs mb-2">Message</p>
                <p className="text-white">{selectedCampaign.message}</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#0F172A] p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-white">{selectedCampaign.totalRecipients.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Recipients</p>
                </div>
                <div className="bg-[#0F172A] p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-white">{selectedCampaign.sentCount.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Sent</p>
                </div>
                <div className="bg-[#0F172A] p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-400">{selectedCampaign.deliveredCount.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Delivered</p>
                </div>
                <div className="bg-[#0F172A] p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-400">{selectedCampaign.failedCount.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Failed</p>
                </div>
              </div>

              {/* Rates */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#0F172A] p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Delivery Rate</span>
                    <span className="text-white font-medium">{getDeliveryRate(selectedCampaign)}%</span>
                  </div>
                  <Progress value={getDeliveryRate(selectedCampaign)} className="h-2 bg-gray-700" />
                </div>
                <div className="bg-[#0F172A] p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Open Rate</span>
                    <span className="text-white font-medium">{getOpenRate(selectedCampaign)}%</span>
                  </div>
                  <Progress value={getOpenRate(selectedCampaign)} className="h-2 bg-gray-700" />
                </div>
                <div className="bg-[#0F172A] p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Click Rate</span>
                    <span className="text-white font-medium">{getClickRate(selectedCampaign)}%</span>
                  </div>
                  <Progress value={getClickRate(selectedCampaign)} className="h-2 bg-gray-700" />
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-[#0F172A] p-4 rounded-lg">
                <p className="text-gray-400 text-xs mb-3">Timeline</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <span className="text-gray-400">Created:</span>
                    <span className="text-white">{formatDate(selectedCampaign.createdAt)}</span>
                  </div>
                  {selectedCampaign.startedAt && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-gray-400">Started:</span>
                      <span className="text-white">{formatDate(selectedCampaign.startedAt)}</span>
                    </div>
                  )}
                  {selectedCampaign.completedAt && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-400" />
                      <span className="text-gray-400">Completed:</span>
                      <span className="text-white">{formatDate(selectedCampaign.completedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {selectedCampaign.status === 'active' && (
                  <Button 
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={() => handleCampaignAction(selectedCampaign, 'pause')}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                    Pause Campaign
                  </Button>
                )}
                {selectedCampaign.status === 'paused' && (
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleCampaignAction(selectedCampaign, 'resume')}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                    Resume Campaign
                  </Button>
                )}
                {selectedCampaign.status === 'draft' && (
                  <Button 
                    className="flex-1 bg-[#00897B] hover:bg-[#00695C] text-white"
                    onClick={() => handleCampaignAction(selectedCampaign, 'start')}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    Start Campaign
                  </Button>
                )}
                {selectedCampaign.status === 'scheduled' && (
                  <>
                    <Button 
                      variant="outline"
                      className="border-gray-600 text-gray-300"
                      onClick={() => handleCampaignAction(selectedCampaign, 'cancel')}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="flex-1 bg-[#00897B] hover:bg-[#00695C] text-white"
                      onClick={() => handleCampaignAction(selectedCampaign, 'start')}
                      disabled={processing}
                    >
                      {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                      Start Now
                    </Button>
                  </>
                )}
                {selectedCampaign.status === 'completed' && (
                  <Button 
                    variant="outline"
                    className="flex-1 border-gray-600 text-gray-300"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate Campaign
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Campaign Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg bg-[#1E293B] border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-[#00897B]" />
              Create Campaign
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Set up a new WhatsApp broadcast campaign
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Campaign Name</Label>
              <Input
                value={newCampaign.name}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Summer Sale Announcement"
                className="bg-[#0F172A] border-gray-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Campaign Type</Label>
              <Select 
                value={newCampaign.type} 
                onValueChange={(v) => setNewCampaign(prev => ({ ...prev, type: v }))}
              >
                <SelectTrigger className="bg-[#0F172A] border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="broadcast">Broadcast</SelectItem>
                  <SelectItem value="template">Template-based</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Recipient List</Label>
              <Select 
                value={newCampaign.listId} 
                onValueChange={(v) => setNewCampaign(prev => ({ ...prev, listId: v }))}
              >
                <SelectTrigger className="bg-[#0F172A] border-gray-600 text-white">
                  <SelectValue placeholder="Select recipient list" />
                </SelectTrigger>
                <SelectContent>
                  {broadcastLists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.name} ({list.count.toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Message</Label>
              <Textarea
                value={newCampaign.message}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Type your message here... Use {{variable}} for personalization"
                className="bg-[#0F172A] border-gray-600 text-white min-h-[120px]"
              />
              <p className="text-xs text-gray-500">
                Available variables: {'{{name}}'}, {'{{phone}}'}, {'{{loyalty_points}}'}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Schedule (Optional)</Label>
              <Input
                type="datetime-local"
                value={newCampaign.scheduledAt}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, scheduledAt: e.target.value }))}
                className="bg-[#0F172A] border-gray-600 text-white"
              />
              <p className="text-xs text-gray-500">Leave empty to save as draft</p>
            </div>

            {/* POPIA Warning */}
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5" />
                <div className="text-sm">
                  <p className="text-amber-400 font-medium">POPIA Compliance</p>
                  <p className="text-gray-400">Ensure all recipients have opted in to receive marketing messages.</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              className="border-gray-600 text-gray-300"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C] text-white"
              onClick={createCampaign}
              disabled={processing}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
