'use client'

import { useState, useEffect } from 'react'
import {
  MessageSquare,
  Send,
  Users,
  Clock,
  BarChart3,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Play,
  Pause,
  Copy,
  Trash2,
  Eye,
  Edit,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Target,
  TestTube,
  FileText,
  Settings,
  Download,
  Upload,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Sparkles,
  X,
  Save,
  Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'

// Types
interface Campaign {
  id: string
  campaignName: string
  campaignType: 'broadcast' | 'promotional' | 'transactional' | 'reminder'
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled'
  targetAudience?: string
  recipientCount: number
  messageTemplate: string
  templateId?: string
  mediaUrl?: string
  mediaType?: string
  scheduledAt?: string
  sentAt?: string
  isABTest: boolean
  abTestVariant?: string
  abParentId?: string
  deliveredCount: number
  readCount: number
  clickedCount: number
  repliedCount: number
  failedCount: number
  optOutCount: number
  totalCost: number
  createdAt: string
  updatedAt: string
}

interface Template {
  id: string
  templateName: string
  templateId?: string
  category: 'marketing' | 'utility' | 'authentication'
  language: string
  bodyText: string
  headerText?: string
  footerText?: string
  buttonConfig?: string
  exampleData?: string
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string
  createdAt: string
  updatedAt: string
}

interface Segment {
  id: string
  segmentName: string
  description?: string
  filterCriteria?: string
  contactCount: number
  createdAt: string
  updatedAt: string
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    draft: { color: 'bg-gray-500/20 text-gray-400', icon: <FileText className="h-3 w-3" /> },
    scheduled: { color: 'bg-blue-500/20 text-blue-400', icon: <Clock className="h-3 w-3" /> },
    sending: { color: 'bg-yellow-500/20 text-yellow-400', icon: <RefreshCw className="h-3 w-3 animate-spin" /> },
    sent: { color: 'bg-green-500/20 text-green-400', icon: <CheckCircle className="h-3 w-3" /> },
    failed: { color: 'bg-red-500/20 text-red-400', icon: <XCircle className="h-3 w-3" /> },
    cancelled: { color: 'bg-gray-500/20 text-gray-400', icon: <XCircle className="h-3 w-3" /> },
    pending: { color: 'bg-yellow-500/20 text-yellow-400', icon: <Clock className="h-3 w-3" /> },
    approved: { color: 'bg-green-500/20 text-green-400', icon: <CheckCircle className="h-3 w-3" /> },
    rejected: { color: 'bg-red-500/20 text-red-400', icon: <XCircle className="h-3 w-3" /> },
  }

  const config = statusConfig[status] || statusConfig.draft

  return (
    <Badge variant="outline" className={`${config.color} border-0 flex items-center gap-1`}>
      {config.icon}
      <span className="capitalize">{status}</span>
    </Badge>
  )
}

// Campaign type badge
function CampaignTypeBadge({ type }: { type: string }) {
  const typeConfig: Record<string, { color: string; label: string }> = {
    broadcast: { color: 'bg-teal-500/20 text-teal-400', label: 'Broadcast' },
    promotional: { color: 'bg-purple-500/20 text-purple-400', label: 'Promotional' },
    transactional: { color: 'bg-blue-500/20 text-blue-400', label: 'Transactional' },
    reminder: { color: 'bg-orange-500/20 text-orange-400', label: 'Reminder' },
  }

  const config = typeConfig[type] || typeConfig.broadcast

  return (
    <Badge variant="outline" className={`${config.color} border-0`}>
      {config.label}
    </Badge>
  )
}

// Stats Card Component
function StatsCard({ 
  title, 
  value, 
  change, 
  icon, 
  trend 
}: { 
  title: string
  value: string | number
  change?: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <Card className="bg-[#1E293B] border-gray-700">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
            {change && (
              <p className={`text-xs mt-1 flex items-center gap-1 ${
                trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'
              }`}>
                {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : trend === 'down' ? <TrendingDown className="h-3 w-3" /> : null}
                {change}
              </p>
            )}
          </div>
          <div className="h-10 w-10 rounded-lg bg-[#00897B]/20 flex items-center justify-center text-[#00897B]">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Campaign Wizard Component
function CampaignWizard({ 
  isOpen, 
  onClose, 
  onSave,
  templates,
  segments 
}: { 
  isOpen: boolean
  onClose: () => void
  onSave: (campaign: Partial<Campaign>) => void
  templates: Template[]
  segments: Segment[]
}) {
  const [step, setStep] = useState(1)
  const [campaign, setCampaign] = useState<Partial<Campaign>>({
    campaignName: '',
    campaignType: 'broadcast',
    messageTemplate: '',
    recipientCount: 0,
    isABTest: false,
  })

  const handleSave = () => {
    onSave(campaign)
    setStep(1)
    setCampaign({
      campaignName: '',
      campaignType: 'broadcast',
      messageTemplate: '',
      recipientCount: 0,
      isABTest: false,
    })
    onClose()
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Campaign Name</Label>
              <Input
                value={campaign.campaignName}
                onChange={(e) => setCampaign({ ...campaign, campaignName: e.target.value })}
                placeholder="Enter campaign name..."
                className="bg-[#0F172A] border-gray-600 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-300">Campaign Type</Label>
              <Select
                value={campaign.campaignType}
                onValueChange={(value) => setCampaign({ ...campaign, campaignType: value as Campaign['campaignType'] })}
              >
                <SelectTrigger className="bg-[#0F172A] border-gray-600 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1E293B] border-gray-700 text-white">
                  <SelectItem value="broadcast">Broadcast</SelectItem>
                  <SelectItem value="promotional">Promotional</SelectItem>
                  <SelectItem value="transactional">Transactional</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={campaign.isABTest}
                onCheckedChange={(checked) => setCampaign({ ...campaign, isABTest: checked })}
              />
              <Label className="text-gray-300">Enable A/B Testing</Label>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Select Template</Label>
              <Select
                value={campaign.templateId}
                onValueChange={(value) => {
                  const template = templates.find(t => t.id === value)
                  setCampaign({ 
                    ...campaign, 
                    templateId: value,
                    messageTemplate: template?.bodyText || ''
                  })
                }}
              >
                <SelectTrigger className="bg-[#0F172A] border-gray-600 text-white mt-1">
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1E293B] border-gray-700 text-white">
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.templateName} ({template.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Message Content</Label>
              <Textarea
                value={campaign.messageTemplate}
                onChange={(e) => setCampaign({ ...campaign, messageTemplate: e.target.value })}
                placeholder="Enter your message..."
                rows={5}
                className="bg-[#0F172A] border-gray-600 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-300">Media (Optional)</Label>
              <div className="mt-1 flex items-center gap-2">
                <Button variant="outline" className="border-gray-600 text-gray-300">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
                <span className="text-xs text-gray-500">JPG, PNG up to 5MB</span>
              </div>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Select Segment</Label>
              <Select
                onValueChange={(value) => {
                  const segment = segments.find(s => s.id === value)
                  setCampaign({ 
                    ...campaign, 
                    targetAudience: value,
                    recipientCount: segment?.contactCount || 0
                  })
                }}
              >
                <SelectTrigger className="bg-[#0F172A] border-gray-600 text-white mt-1">
                  <SelectValue placeholder="Select a segment..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1E293B] border-gray-700 text-white">
                  {segments.map((segment) => (
                    <SelectItem key={segment.id} value={segment.id}>
                      {segment.segmentName} ({segment.contactCount} contacts)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {campaign.recipientCount > 0 && (
              <div className="p-3 bg-[#00897B]/10 rounded-lg border border-[#00897B]/20">
                <p className="text-sm text-[#00897B]">
                  <Users className="h-4 w-4 inline mr-1" />
                  This campaign will reach <strong>{campaign.recipientCount.toLocaleString()}</strong> recipients
                </p>
              </div>
            )}
            <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <p className="text-sm text-yellow-400">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                POPIA Compliance: Ensure recipients have opted in to receive marketing messages
              </p>
            </div>
          </div>
        )
      case 4:
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Schedule (Optional)</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Input
                  type="date"
                  className="bg-[#0F172A] border-gray-600 text-white"
                  onChange={(e) => setCampaign({ 
                    ...campaign, 
                    scheduledAt: `${e.target.value}T${campaign.scheduledAt?.split('T')[1] || '09:00'}:00`
                  })}
                />
                <Input
                  type="time"
                  className="bg-[#0F172A] border-gray-600 text-white"
                  defaultValue="09:00"
                  onChange={(e) => {
                    const date = campaign.scheduledAt?.split('T')[0] || new Date().toISOString().split('T')[0]
                    setCampaign({ ...campaign, scheduledAt: `${date}T${e.target.value}:00` })
                  }}
                />
              </div>
            </div>
            <div className="p-4 bg-[#0F172A] rounded-lg border border-gray-700">
              <h4 className="text-sm font-medium text-white mb-3">Campaign Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Name:</span>
                  <span className="text-white">{campaign.campaignName || 'Untitled'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <CampaignTypeBadge type={campaign.campaignType || 'broadcast'} />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Recipients:</span>
                  <span className="text-white">{campaign.recipientCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">A/B Test:</span>
                  <span className="text-white">{campaign.isABTest ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Schedule:</span>
                  <span className="text-white">{campaign.scheduledAt ? new Date(campaign.scheduledAt).toLocaleString() : 'Send immediately'}</span>
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1E293B] border-gray-700 text-white max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-white">Create Campaign</DialogTitle>
          <DialogDescription className="text-gray-400">
            Step {step} of 4 - {step === 1 ? 'Basic Info' : step === 2 ? 'Content' : step === 3 ? 'Audience' : 'Review & Schedule'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex-1">
                <div className={`h-1.5 rounded-full ${s <= step ? 'bg-[#00897B]' : 'bg-gray-700'}`} />
              </div>
            ))}
          </div>
          
          {renderStep()}
        </div>
        
        <DialogFooter className="gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="border-gray-600 text-gray-300">
              Back
            </Button>
          )}
          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)} className="bg-[#00897B] hover:bg-[#00796B]">
              Next
            </Button>
          ) : (
            <Button onClick={handleSave} className="bg-[#00897B] hover:bg-[#00796B]">
              <Send className="h-4 w-4 mr-2" />
              {campaign.scheduledAt ? 'Schedule Campaign' : 'Launch Campaign'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Template Editor Dialog
function TemplateEditorDialog({
  isOpen,
  onClose,
  onSave,
  template
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (template: Partial<Template>) => void
  template?: Template
}) {
  // Initialize form data based on template prop
  const getInitialFormData = (): Partial<Template> => {
    if (template) {
      return template
    }
    return {
      templateName: '',
      category: 'marketing',
      language: 'en',
      bodyText: '',
      headerText: '',
      footerText: '',
    }
  }
  
  const [formData, setFormData] = useState<Partial<Template>>(getInitialFormData)

  const handleSave = () => {
    onSave(formData)
    onClose()
  }

  // Reset form when template changes using a key pattern
  const dialogKey = template?.id || 'new'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent key={dialogKey} className="bg-[#1E293B] border-gray-700 text-white max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-white">
            {template ? 'Edit Template' : 'Create Template'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            WhatsApp Business API message template
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label className="text-gray-300">Template Name</Label>
            <Input
              value={formData.templateName}
              onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
              placeholder="e.g., welcome_message"
              className="bg-[#0F172A] border-gray-600 text-white mt-1"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as Template['category'] })}
              >
                <SelectTrigger className="bg-[#0F172A] border-gray-600 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1E293B] border-gray-700 text-white">
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="utility">Utility</SelectItem>
                  <SelectItem value="authentication">Authentication</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Language</Label>
              <Select
                value={formData.language}
                onValueChange={(value) => setFormData({ ...formData, language: value })}
              >
                <SelectTrigger className="bg-[#0F172A] border-gray-600 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1E293B] border-gray-700 text-white">
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="af">Afrikaans</SelectItem>
                  <SelectItem value="zu">Zulu</SelectItem>
                  <SelectItem value="xh">Xhosa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label className="text-gray-300">Header (Optional)</Label>
            <Input
              value={formData.headerText}
              onChange={(e) => setFormData({ ...formData, headerText: e.target.value })}
              placeholder="Header text..."
              className="bg-[#0F172A] border-gray-600 text-white mt-1"
            />
          </div>
          
          <div>
            <Label className="text-gray-300">Body Text</Label>
            <Textarea
              value={formData.bodyText}
              onChange={(e) => setFormData({ ...formData, bodyText: e.target.value })}
              placeholder="Hi {{name}}, check out our latest offers!"
              rows={4}
              className="bg-[#0F172A] border-gray-600 text-white mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Use {'{{variable}}'} for dynamic content</p>
          </div>
          
          <div>
            <Label className="text-gray-300">Footer (Optional)</Label>
            <Input
              value={formData.footerText}
              onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
              placeholder="Footer text..."
              className="bg-[#0F172A] border-gray-600 text-white mt-1"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-[#00897B] hover:bg-[#00796B]">
            <Save className="h-4 w-4 mr-2" />
            Save Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Segment Builder Dialog
function SegmentBuilderDialog({
  isOpen,
  onClose,
  onSave,
  segment
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (segment: Partial<Segment>) => void
  segment?: Segment
}) {
  const [formData, setFormData] = useState<Partial<Segment>>({
    segmentName: '',
    description: '',
    contactCount: 0,
    ...segment
  })

  const [filters, setFilters] = useState([
    { field: 'last_purchase', operator: 'within', value: '30' },
  ])

  const filterFields = [
    { value: 'last_purchase', label: 'Last Purchase' },
    { value: 'total_spent', label: 'Total Spent' },
    { value: 'visit_count', label: 'Visit Count' },
    { value: 'loyalty_tier', label: 'Loyalty Tier' },
    { value: 'location', label: 'Location' },
    { value: 'opt_in', label: 'Opt-in Status' },
  ]

  const handleSave = () => {
    onSave({
      ...formData,
      filterCriteria: JSON.stringify(filters),
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1E293B] border-gray-700 text-white max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-white">
            {segment ? 'Edit Segment' : 'Create Segment'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Define audience filters for targeting
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label className="text-gray-300">Segment Name</Label>
            <Input
              value={formData.segmentName}
              onChange={(e) => setFormData({ ...formData, segmentName: e.target.value })}
              placeholder="e.g., VIP Customers"
              className="bg-[#0F172A] border-gray-600 text-white mt-1"
            />
          </div>
          
          <div>
            <Label className="text-gray-300">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe this segment..."
              rows={2}
              className="bg-[#0F172A] border-gray-600 text-white mt-1"
            />
          </div>
          
          <div>
            <Label className="text-gray-300">Filters</Label>
            <div className="space-y-2 mt-2">
              {filters.map((filter, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Select value={filter.field} onValueChange={(value) => {
                    const newFilters = [...filters]
                    newFilters[index].field = value
                    setFilters(newFilters)
                  }}>
                    <SelectTrigger className="bg-[#0F172A] border-gray-600 text-white flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1E293B] border-gray-700 text-white">
                      {filterFields.map((f) => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filter.operator} onValueChange={(value) => {
                    const newFilters = [...filters]
                    newFilters[index].operator = value
                    setFilters(newFilters)
                  }}>
                    <SelectTrigger className="bg-[#0F172A] border-gray-600 text-white w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1E293B] border-gray-700 text-white">
                      <SelectItem value="within">Within</SelectItem>
                      <SelectItem value="greater">Greater than</SelectItem>
                      <SelectItem value="less">Less than</SelectItem>
                      <SelectItem value="equals">Equals</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={filter.value}
                    onChange={(e) => {
                      const newFilters = [...filters]
                      newFilters[index].value = e.target.value
                      setFilters(newFilters)
                    }}
                    className="bg-[#0F172A] border-gray-600 text-white w-24"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFilters(filters.filter((_, i) => i !== index))}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters([...filters, { field: 'last_purchase', operator: 'within', value: '' }])}
              className="mt-2 border-gray-600 text-gray-300"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Filter
            </Button>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-[#00897B] hover:bg-[#00796B]">
            <Save className="h-4 w-4 mr-2" />
            Save Segment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// A/B Test Comparison View
function ABTestComparisonView({ campaign }: { campaign: Campaign }) {
  return (
    <Card className="bg-[#1E293B] border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TestTube className="h-5 w-5 text-purple-400" />
          A/B Test Results
        </CardTitle>
        <CardDescription className="text-gray-400">
          Compare performance between variants
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Variant A */}
          <div className="p-4 bg-[#0F172A] rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <Badge className="bg-blue-500/20 text-blue-400">Variant A</Badge>
              <span className="text-xs text-gray-400">50% of audience</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Delivered</span>
                <span className="text-white">{Math.floor(campaign.deliveredCount * 0.5).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Read Rate</span>
                <span className="text-green-400">78%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Click Rate</span>
                <span className="text-white">12.5%</span>
              </div>
            </div>
          </div>
          
          {/* Variant B */}
          <div className="p-4 bg-[#0F172A] rounded-lg border border-[#00897B]/50">
            <div className="flex items-center justify-between mb-3">
              <Badge className="bg-[#00897B]/20 text-[#00897B]">Variant B</Badge>
              <span className="text-xs text-gray-400">50% of audience</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Delivered</span>
                <span className="text-white">{Math.floor(campaign.deliveredCount * 0.5).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Read Rate</span>
                <span className="text-green-400">82%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Click Rate</span>
                <span className="text-green-400">15.2%</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-xs text-[#00897B]">
                <Sparkles className="h-3 w-3 inline mr-1" />
                Winner: +4% read rate, +2.7% click rate
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Main Component
export default function WhatsAppCampaignView() {
  const [activeTab, setActiveTab] = useState('campaigns')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Dialog states
  const [campaignWizardOpen, setCampaignWizardOpen] = useState(false)
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false)
  const [segmentBuilderOpen, setSegmentBuilderOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | undefined>()
  const [selectedSegment, setSelectedSegment] = useState<Segment | undefined>()

  // Chart data
  const deliveryData = [
    { name: 'Mon', delivered: 4200, failed: 120, read: 3100 },
    { name: 'Tue', delivered: 3800, failed: 80, read: 2800 },
    { name: 'Wed', delivered: 4500, failed: 150, read: 3600 },
    { name: 'Thu', delivered: 5200, failed: 100, read: 4100 },
    { name: 'Fri', delivered: 4800, failed: 90, read: 3900 },
    { name: 'Sat', delivered: 3500, failed: 70, read: 2800 },
    { name: 'Sun', delivered: 2800, failed: 60, read: 2100 },
  ]

  const campaignTypeData = [
    { name: 'Broadcast', value: 45, color: '#00897B' },
    { name: 'Promotional', value: 30, color: '#7C3AED' },
    { name: 'Transactional', value: 15, color: '#3B82F6' },
    { name: 'Reminder', value: 10, color: '#F59E0B' },
  ]

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch campaigns
        const campaignsRes = await fetch('/api/admin/whatsapp/campaigns')
        if (campaignsRes.ok) {
          const campaignsData = await campaignsRes.json()
          setCampaigns(campaignsData.campaigns || [])
        }

        // Fetch templates
        const templatesRes = await fetch('/api/admin/whatsapp/templates')
        if (templatesRes.ok) {
          const templatesData = await templatesRes.json()
          setTemplates(templatesData.templates || [])
        }

        // Fetch segments
        const segmentsRes = await fetch('/api/admin/whatsapp/segments')
        if (segmentsRes.ok) {
          const segmentsData = await segmentsRes.json()
          setSegments(segmentsData.segments || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Handlers
  const handleSaveCampaign = async (campaign: Partial<Campaign>) => {
    try {
      const res = await fetch('/api/admin/whatsapp/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaign),
      })
      if (res.ok) {
        const newCampaign = await res.json()
        setCampaigns([newCampaign.campaign, ...campaigns])
      }
    } catch (error) {
      console.error('Error saving campaign:', error)
    }
  }

  const handleSaveTemplate = async (template: Partial<Template>) => {
    try {
      const res = await fetch('/api/admin/whatsapp/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      })
      if (res.ok) {
        const newTemplate = await res.json()
        setTemplates([newTemplate.template, ...templates])
      }
    } catch (error) {
      console.error('Error saving template:', error)
    }
  }

  const handleSaveSegment = async (segment: Partial<Segment>) => {
    try {
      const res = await fetch('/api/admin/whatsapp/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(segment),
      })
      if (res.ok) {
        const newSegment = await res.json()
        setSegments([newSegment.segment, ...segments])
      }
    } catch (error) {
      console.error('Error saving segment:', error)
    }
  }

  const handleCampaignAction = async (campaignId: string, action: string) => {
    try {
      const res = await fetch('/api/admin/whatsapp/campaigns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, action }),
      })
      if (res.ok) {
        // Refresh campaigns
        const campaignsRes = await fetch('/api/admin/whatsapp/campaigns')
        if (campaignsRes.ok) {
          const campaignsData = await campaignsRes.json()
          setCampaigns(campaignsData.campaigns || [])
        }
      }
    } catch (error) {
      console.error('Error updating campaign:', error)
    }
  }

  // Calculate stats
  const stats = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'sending' || c.status === 'scheduled').length,
    totalRecipients: campaigns.reduce((sum, c) => sum + c.recipientCount, 0),
    totalDelivered: campaigns.reduce((sum, c) => sum + c.deliveredCount, 0),
    totalRead: campaigns.reduce((sum, c) => sum + c.readCount, 0),
    totalOptOuts: campaigns.reduce((sum, c) => sum + c.optOutCount, 0),
    deliveryRate: campaigns.length > 0 
      ? Math.round((campaigns.reduce((sum, c) => sum + c.deliveredCount, 0) / campaigns.reduce((sum, c) => sum + c.recipientCount, 0)) * 100)
      : 0,
    readRate: campaigns.length > 0 
      ? Math.round((campaigns.reduce((sum, c) => sum + c.readCount, 0) / campaigns.reduce((sum, c) => sum + c.deliveredCount, 0)) * 100)
      : 0,
  }

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.campaignName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-[#00897B]" />
            WhatsApp Campaign Engine
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage campaigns, templates, and audience segments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setCampaignWizardOpen(true)}
            className="bg-[#00897B] hover:bg-[#00796B]"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Campaigns"
          value={stats.totalCampaigns}
          change="+3 this week"
          icon={<Send className="h-5 w-5" />}
          trend="up"
        />
        <StatsCard
          title="Active Campaigns"
          value={stats.activeCampaigns}
          icon={<Play className="h-5 w-5" />}
        />
        <StatsCard
          title="Delivery Rate"
          value={`${stats.deliveryRate}%`}
          change="+2.5% from last month"
          icon={<Target className="h-5 w-5" />}
          trend="up"
        />
        <StatsCard
          title="Read Rate"
          value={`${stats.readRate}%`}
          change="Industry avg: 45%"
          icon={<Eye className="h-5 w-5" />}
          trend="up"
        />
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#1E293B] border border-gray-700">
          <TabsTrigger value="campaigns" className="data-[state=active]:bg-[#00897B] data-[state=active]:text-white">
            <Send className="h-4 w-4 mr-2" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-[#00897B] data-[state=active]:text-white">
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="segments" className="data-[state=active]:bg-[#00897B] data-[state=active]:text-white">
            <Users className="h-4 w-4 mr-2" />
            Segments
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-[#00897B] data-[state=active]:text-white">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="optouts" className="data-[state=active]:bg-[#00897B] data-[state=active]:text-white">
            <XCircle className="h-4 w-4 mr-2" />
            Opt-outs
          </TabsTrigger>
        </TabsList>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search campaigns..."
                className="pl-10 bg-[#1E293B] border-gray-700 text-white"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-[#1E293B] border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1E293B] border-gray-700 text-white">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="sending">Sending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campaigns Table */}
          <Card className="bg-[#1E293B] border-gray-700">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 hover:bg-gray-700/50">
                  <TableHead className="text-gray-400">Campaign</TableHead>
                  <TableHead className="text-gray-400">Type</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Recipients</TableHead>
                  <TableHead className="text-gray-400">Delivered</TableHead>
                  <TableHead className="text-gray-400">Read</TableHead>
                  <TableHead className="text-gray-400">Cost</TableHead>
                  <TableHead className="text-gray-400"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                      Loading campaigns...
                    </TableCell>
                  </TableRow>
                ) : filteredCampaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                      No campaigns found. Create your first campaign!
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCampaigns.map((campaign) => (
                    <TableRow key={campaign.id} className="border-gray-700 hover:bg-gray-700/50">
                      <TableCell>
                        <div>
                          <p className="text-white font-medium">{campaign.campaignName}</p>
                          <p className="text-xs text-gray-400">{new Date(campaign.createdAt).toLocaleDateString()}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <CampaignTypeBadge type={campaign.campaignType} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={campaign.status} />
                      </TableCell>
                      <TableCell className="text-white">{campaign.recipientCount.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="text-white">
                          {campaign.deliveredCount.toLocaleString()}
                          <span className="text-xs text-gray-400 ml-1">
                            ({Math.round((campaign.deliveredCount / campaign.recipientCount) * 100) || 0}%)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-white">
                          {campaign.readCount.toLocaleString()}
                          <span className="text-xs text-gray-400 ml-1">
                            ({Math.round((campaign.readCount / campaign.deliveredCount) * 100) || 0}%)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">R{campaign.totalCost.toFixed(2)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-gray-400">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#1E293B] border-gray-700 text-white">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-gray-700" />
                            <DropdownMenuItem className="hover:bg-gray-700/50">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {campaign.status === 'draft' && (
                              <DropdownMenuItem 
                                onClick={() => handleCampaignAction(campaign.id, 'start')}
                                className="hover:bg-gray-700/50"
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Start Campaign
                              </DropdownMenuItem>
                            )}
                            {campaign.status === 'sending' && (
                              <DropdownMenuItem 
                                onClick={() => handleCampaignAction(campaign.id, 'pause')}
                                className="hover:bg-gray-700/50"
                              >
                                <Pause className="h-4 w-4 mr-2" />
                                Pause Campaign
                              </DropdownMenuItem>
                            )}
                            {campaign.status === 'scheduled' && (
                              <DropdownMenuItem 
                                onClick={() => handleCampaignAction(campaign.id, 'cancel')}
                                className="hover:bg-gray-700/50 text-red-400"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="hover:bg-gray-700/50">
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-gray-700" />
                            <DropdownMenuItem className="hover:bg-gray-700/50 text-red-400">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search templates..."
                className="pl-10 bg-[#1E293B] border-gray-700 text-white"
              />
            </div>
            <Button 
              onClick={() => {
                setSelectedTemplate(undefined)
                setTemplateEditorOpen(true)
              }}
              className="bg-[#00897B] hover:bg-[#00796B]"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.length === 0 ? (
              <Card className="bg-[#1E293B] border-gray-700 col-span-full">
                <CardContent className="py-8 text-center text-gray-400">
                  No templates found. Create your first template!
                </CardContent>
              </Card>
            ) : (
              templates.map((template) => (
                <Card key={template.id} className="bg-[#1E293B] border-gray-700 hover:border-gray-600 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-sm">{template.templateName}</CardTitle>
                      <StatusBadge status={template.status} />
                    </div>
                    <CardDescription className="text-gray-400 text-xs">
                      {template.category} • {template.language}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 text-sm line-clamp-3">{template.bodyText}</p>
                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(template)
                          setTemplateEditorOpen(true)
                        }}
                        className="border-gray-600 text-gray-300"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-gray-300"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Duplicate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Segments Tab */}
        <TabsContent value="segments" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search segments..."
                className="pl-10 bg-[#1E293B] border-gray-700 text-white"
              />
            </div>
            <Button 
              onClick={() => {
                setSelectedSegment(undefined)
                setSegmentBuilderOpen(true)
              }}
              className="bg-[#00897B] hover:bg-[#00796B]"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Segment
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {segments.length === 0 ? (
              <Card className="bg-[#1E293B] border-gray-700 col-span-full">
                <CardContent className="py-8 text-center text-gray-400">
                  No segments found. Create your first segment!
                </CardContent>
              </Card>
            ) : (
              segments.map((segment) => (
                <Card key={segment.id} className="bg-[#1E293B] border-gray-700 hover:border-gray-600 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-sm">{segment.segmentName}</CardTitle>
                      <Badge className="bg-[#00897B]/20 text-[#00897B]">
                        {segment.contactCount.toLocaleString()} contacts
                      </Badge>
                    </div>
                    {segment.description && (
                      <CardDescription className="text-gray-400 text-xs">
                        {segment.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSegment(segment)
                          setSegmentBuilderOpen(true)
                        }}
                        className="border-gray-600 text-gray-300"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-gray-300"
                      >
                        <Users className="h-3 w-3 mr-1" />
                        View Contacts
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Delivery Chart */}
            <Card className="bg-[#1E293B] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Delivery Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={deliveryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="delivered" stroke="#00897B" fill="#00897B" fillOpacity={0.2} />
                      <Area type="monotone" dataKey="read" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Campaign Types */}
            <Card className="bg-[#1E293B] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Campaign Types</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={campaignTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {campaignTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {campaignTypeData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-gray-400">{item.name}: {item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card className="bg-[#1E293B] border-gray-700 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white text-sm">Key Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-[#0F172A] rounded-lg">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                      <Target className="h-4 w-4" />
                      Delivery Rate
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.deliveryRate}%</p>
                    <Progress value={stats.deliveryRate} className="mt-2 h-1" />
                  </div>
                  <div className="p-4 bg-[#0F172A] rounded-lg">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                      <Eye className="h-4 w-4" />
                      Read Rate
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.readRate}%</p>
                    <Progress value={stats.readRate} className="mt-2 h-1" />
                  </div>
                  <div className="p-4 bg-[#0F172A] rounded-lg">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                      <ClickCircle className="h-4 w-4" />
                      Click Rate
                    </div>
                    <p className="text-2xl font-bold text-white">8.5%</p>
                    <Progress value={8.5} className="mt-2 h-1" />
                  </div>
                  <div className="p-4 bg-[#0F172A] rounded-lg">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                      <XCircle className="h-4 w-4" />
                      Opt-out Rate
                    </div>
                    <p className="text-2xl font-bold text-white">0.3%</p>
                    <Progress value={0.3} className="mt-2 h-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Opt-outs Tab */}
        <TabsContent value="optouts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <StatsCard
              title="Total Opt-outs"
              value={stats.totalOptOuts}
              icon={<XCircle className="h-5 w-5" />}
            />
            <StatsCard
              title="Opt-out Rate"
              value="0.3%"
              change="Industry avg: 1%"
              icon={<Percent className="h-5 w-5" />}
              trend="up"
            />
            <StatsCard
              title="This Month"
              value={23}
              change="-12 from last month"
              icon={<TrendingDown className="h-5 w-5" />}
              trend="down"
            />
          </div>

          <Card className="bg-[#1E293B] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Opt-outs</CardTitle>
              <CardDescription className="text-gray-400">
                Users who have opted out of WhatsApp messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-gray-700/50">
                    <TableHead className="text-gray-400">Phone</TableHead>
                    <TableHead className="text-gray-400">Campaign</TableHead>
                    <TableHead className="text-gray-400">Reason</TableHead>
                    <TableHead className="text-gray-400">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-gray-700 hover:bg-gray-700/50">
                    <TableCell className="text-white">+27 82 *** 4567</TableCell>
                    <TableCell className="text-gray-300">Summer Sale Announcement</TableCell>
                    <TableCell className="text-gray-300">Not interested</TableCell>
                    <TableCell className="text-gray-400">Today, 10:32</TableCell>
                  </TableRow>
                  <TableRow className="border-gray-700 hover:bg-gray-700/50">
                    <TableCell className="text-white">+27 71 *** 2345</TableCell>
                    <TableCell className="text-gray-300">New Product Launch</TableCell>
                    <TableCell className="text-gray-300">Too frequent</TableCell>
                    <TableCell className="text-gray-400">Yesterday, 15:45</TableCell>
                  </TableRow>
                  <TableRow className="border-gray-700 hover:bg-gray-700/50">
                    <TableCell className="text-white">+27 83 *** 8901</TableCell>
                    <TableCell className="text-gray-300">Flash Sale - 4 Hours</TableCell>
                    <TableCell className="text-gray-300">No longer using WhatsApp</TableCell>
                    <TableCell className="text-gray-400">2 days ago</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CampaignWizard
        isOpen={campaignWizardOpen}
        onClose={() => setCampaignWizardOpen(false)}
        onSave={handleSaveCampaign}
        templates={templates}
        segments={segments}
      />
      
      <TemplateEditorDialog
        isOpen={templateEditorOpen}
        onClose={() => setTemplateEditorOpen(false)}
        onSave={handleSaveTemplate}
        template={selectedTemplate}
      />
      
      <SegmentBuilderDialog
        isOpen={segmentBuilderOpen}
        onClose={() => setSegmentBuilderOpen(false)}
        onSave={handleSaveSegment}
        segment={selectedSegment}
      />
    </div>
  )
}

// Click icon for analytics
function ClickCircle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  )
}
