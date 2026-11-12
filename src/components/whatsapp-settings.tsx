'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { 
  MessageCircle, 
  Send, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  Copy,
  FileText,
  ShoppingCart,
  Calendar,
  Bell,
  TestTube
} from 'lucide-react'
import { toast } from 'sonner'

interface WhatsAppConfig {
  id: string
  isActive: boolean
  healthStatus: string
  lastUsedAt: string | null
  lastError: string | null
  phoneNumberId: string
  businessAccountId: string
  appId: string
  hasAccessToken: boolean
  hasWebhookVerifyToken: boolean
  hasAppSecret: boolean
}

interface WhatsAppStats {
  pending: number
  sent: number
  failed: number
  delivered: number
}

interface NotificationTemplate {
  id: string
  name: string
  code: string
  body: string
  isActive: boolean
  isSystem: boolean
  timesUsed: number
}

interface RecentNotification {
  id: string
  recipientPhone: string
  recipientName: string | null
  body: string
  status: string
  createdAt: string
}

export function WhatsAppSettings() {
  const [loading, setLoading] = useState(true)
  const [configured, setConfigured] = useState(false)
  const [config, setConfig] = useState<WhatsAppConfig | null>(null)
  const [stats, setStats] = useState<WhatsAppStats>({ pending: 0, sent: 0, failed: 0, delivered: 0 })
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [recentNotifications, setRecentNotifications] = useState<RecentNotification[]>([])
  
  // Form states
  const [phoneNumberId, setPhoneNumberId] = useState('')
  const [businessAccountId, setBusinessAccountId] = useState('')
  const [appId, setAppId] = useState('')
  const [appSecret, setAppSecret] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [webhookVerifyToken, setWebhookVerifyToken] = useState('')
  const [testPhone, setTestPhone] = useState('')
  const [testingConnection, setTestingConnection] = useState(false)
  
  // Template dialog
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [templateCode, setTemplateCode] = useState('')
  const [templateBody, setTemplateBody] = useState('')
  
  // Send test receipt dialog
  const [testReceiptOpen, setTestReceiptOpen] = useState(false)
  const [testReceiptPhone, setTestReceiptPhone] = useState('')
  
  // Fetch data
  const fetchData = async () => {
    try {
      const response = await fetch('/api/whatsapp')
      const data = await response.json()
      
      setConfigured(data.configured)
      setConfig(data.config)
      setStats(data.stats || { pending: 0, sent: 0, failed: 0, delivered: 0 })
      setRecentNotifications(data.recentNotifications || [])
    } catch (error) {
      console.error('Failed to fetch WhatsApp data:', error)
      toast.error('Failed to load WhatsApp settings')
    } finally {
      setLoading(false)
    }
  }
  
  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/whatsapp/templates')
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    }
  }
  
  useEffect(() => {
    fetchData()
    fetchTemplates()
  }, [])
  
  // Save configuration
  const saveConfig = async () => {
    try {
      const response = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumberId,
          businessAccountId,
          appId,
          appSecret,
          accessToken,
          webhookVerifyToken,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('WhatsApp configuration saved')
        fetchData()
      } else {
        toast.error(data.error || 'Failed to save configuration')
      }
    } catch (error) {
      console.error('Failed to save config:', error)
      toast.error('Failed to save configuration')
    }
  }
  
  // Test connection
  const testConnection = async () => {
    if (!testPhone) {
      toast.error('Please enter a test phone number')
      return
    }
    
    setTestingConnection(true)
    
    try {
      const response = await fetch('/api/whatsapp/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testPhone }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Test message sent successfully!')
      } else {
        toast.error(data.error || 'Failed to send test message')
      }
    } catch (error) {
      console.error('Failed to test connection:', error)
      toast.error('Failed to send test message')
    } finally {
      setTestingConnection(false)
    }
  }
  
  // Send test receipt
  const sendTestReceipt = async () => {
    if (!testReceiptPhone) {
      toast.error('Please enter a phone number')
      return
    }
    
    try {
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'receipt',
          to: testReceiptPhone,
          data: {
            businessName: 'Test Store',
            businessAddress: '123 Main Street, Johannesburg',
            businessPhone: '+27 11 123 4567',
            receiptNumber: 'RCP-TEST-001',
            date: new Date().toLocaleDateString('en-ZA'),
            time: new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }),
            items: [
              { name: 'Coffee', quantity: 2, price: 35.00, total: 70.00 },
              { name: 'Muffin', quantity: 1, price: 28.00, total: 28.00 },
            ],
            subtotal: 98.00,
            tax: 14.70,
            total: 112.70,
            paymentMethod: 'Card',
            cashierName: 'John Doe',
          },
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Test receipt sent!')
        setTestReceiptOpen(false)
      } else {
        toast.error(data.error || 'Failed to send receipt')
      }
    } catch (error) {
      console.error('Failed to send test receipt:', error)
      toast.error('Failed to send receipt')
    }
  }
  
  // Save template
  const saveTemplate = async () => {
    if (!templateName || !templateCode || !templateBody) {
      toast.error('Please fill in all fields')
      return
    }
    
    try {
      const response = await fetch('/api/whatsapp/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTemplate?.id,
          name: templateName,
          code: templateCode,
          body: templateBody,
        }),
      })
      
      const data = await response.json()
      
      if (data.template) {
        toast.success(editingTemplate ? 'Template updated' : 'Template created')
        setTemplateDialogOpen(false)
        setEditingTemplate(null)
        setTemplateName('')
        setTemplateCode('')
        setTemplateBody('')
        fetchTemplates()
      } else {
        toast.error(data.error || 'Failed to save template')
      }
    } catch (error) {
      console.error('Failed to save template:', error)
      toast.error('Failed to save template')
    }
  }
  
  // Delete template
  const deleteTemplate = async (id: string) => {
    try {
      const response = await fetch(`/api/whatsapp/templates?id=${id}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Template deleted')
        fetchTemplates()
      } else {
        toast.error(data.error || 'Failed to delete template')
      }
    } catch (error) {
      console.error('Failed to delete template:', error)
      toast.error('Failed to delete template')
    }
  }
  
  // Edit template
  const editTemplate = (template: NotificationTemplate) => {
    setEditingTemplate(template)
    setTemplateName(template.name)
    setTemplateCode(template.code)
    setTemplateBody(template.body)
    setTemplateDialogOpen(true)
  }
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      pending: { variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
      sent: { variant: 'default', icon: <Send className="h-3 w-3" /> },
      delivered: { variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
      failed: { variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
    }
    
    const { variant, icon } = variants[status] || { variant: 'outline', icon: <AlertCircle className="h-3 w-3" /> }
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {icon}
        {status}
      </Badge>
    )
  }
  
  // Get health status badge
  const getHealthBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      healthy: 'default',
      degraded: 'secondary',
      unhealthy: 'destructive',
      unknown: 'outline',
    }
    
    return (
      <Badge variant={variants[status] || 'outline'} className="capitalize">
        {status}
      </Badge>
    )
  }
  
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
            <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">WhatsApp Integration</h2>
            <p className="text-sm text-muted-foreground">
              Send e-receipts, booking confirmations, and notifications via WhatsApp
            </p>
          </div>
        </div>
        <Badge variant={configured ? 'default' : 'secondary'} className="gap-1">
          {configured ? (
            <>
              <CheckCircle className="h-3 w-3" />
              Connected
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3" />
              Not Connected
            </>
          )}
        </Badge>
      </div>
      
      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Clock className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="test" className="gap-2">
            <TestTube className="h-4 w-4" />
            Test
          </TabsTrigger>
        </TabsList>
        
        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Business API Configuration</CardTitle>
              <CardDescription>
                Connect your WhatsApp Business Account to send notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {configured && config && (
                <div className="rounded-lg border p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Current Configuration</span>
                    {getHealthBadge(config.healthStatus)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div>Phone Number ID: <span className="font-mono">{config.phoneNumberId}</span></div>
                    <div>Business Account: <span className="font-mono">{config.businessAccountId || 'Not set'}</span></div>
                    <div>Last Used: {config.lastUsedAt ? new Date(config.lastUsedAt).toLocaleString() : 'Never'}</div>
                    {config.lastError && (
                      <div className="col-span-2 text-red-500">Last Error: {config.lastError}</div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phoneNumberId">Phone Number ID *</Label>
                  <Input
                    id="phoneNumberId"
                    placeholder="e.g., 123456789012345"
                    value={phoneNumberId}
                    onChange={(e) => setPhoneNumberId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Found in WhatsApp Business Dashboard under Phone Numbers
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="accessToken">Access Token *</Label>
                  <Input
                    id="accessToken"
                    type="password"
                    placeholder="Your permanent access token"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Generate from WhatsApp Business Dashboard or Meta for Developers
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="businessAccountId">Business Account ID</Label>
                  <Input
                    id="businessAccountId"
                    placeholder="e.g., 123456789012345"
                    value={businessAccountId}
                    onChange={(e) => setBusinessAccountId(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="appId">App ID</Label>
                  <Input
                    id="appId"
                    placeholder="Your Meta App ID"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="appSecret">App Secret</Label>
                  <Input
                    id="appSecret"
                    type="password"
                    placeholder="Your Meta App Secret"
                    value={appSecret}
                    onChange={(e) => setAppSecret(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="webhookVerifyToken">Webhook Verify Token</Label>
                  <Input
                    id="webhookVerifyToken"
                    placeholder="Auto-generated if empty"
                    value={webhookVerifyToken}
                    onChange={(e) => setWebhookVerifyToken(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for webhook verification (optional)
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center gap-2">
                <Button onClick={saveConfig}>
                  <Settings className="h-4 w-4 mr-2" />
                  Save Configuration
                </Button>
                
                {configured && (
                  <Button variant="outline" onClick={() => fetchData()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Stats Cards */}
          {configured && (
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
                  <div className="text-sm text-muted-foreground">Sent</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
                  <div className="text-sm text-muted-foreground">Delivered</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        
        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Message Templates</CardTitle>
                <CardDescription>
                  Create reusable message templates for WhatsApp notifications
                </CardDescription>
              </div>
              <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingTemplate(null)
                    setTemplateName('')
                    setTemplateCode('')
                    setTemplateBody('')
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Template
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
                    <DialogDescription>
                      Create a reusable message template for WhatsApp
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="templateName">Template Name</Label>
                      <Input
                        id="templateName"
                        placeholder="e.g., Booking Confirmation"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="templateCode">Template Code</Label>
                      <Input
                        id="templateCode"
                        placeholder="e.g., booking_confirmation"
                        value={templateCode}
                        onChange={(e) => setTemplateCode(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                        disabled={!!editingTemplate?.isSystem}
                      />
                      <p className="text-xs text-muted-foreground">
                        Used to reference this template in code
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="templateBody">Message Body</Label>
                      <Textarea
                        id="templateBody"
                        placeholder="Hi {{customerName}}, your booking is confirmed..."
                        value={templateBody}
                        onChange={(e) => setTemplateBody(e.target.value)}
                        rows={6}
                      />
                      <p className="text-xs text-muted-foreground">
                        Use {'{{variable}}'} syntax for dynamic content
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={saveTemplate}>Save Template</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {templates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No templates yet. Create your first template!
                    </div>
                  ) : (
                    templates.map((template) => (
                      <div
                        key={template.id}
                        className="flex items-start justify-between p-4 rounded-lg border hover:bg-muted/50"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{template.name}</span>
                            {template.isSystem && (
                              <Badge variant="secondary" className="text-xs">System</Badge>
                            )}
                          </div>
                          <code className="text-xs text-muted-foreground">{template.code}</code>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {template.body}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Used {template.timesUsed} times
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => editTemplate(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!template.isSystem && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteTemplate(template.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>
                View recently sent WhatsApp messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {recentNotifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No notifications sent yet
                    </div>
                  ) : (
                    recentNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="flex items-start justify-between p-4 rounded-lg border"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{notification.recipientName || notification.recipientPhone}</span>
                            {getStatusBadge(notification.status)}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {notification.body}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Test Tab */}
        <TabsContent value="test" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  Test Connection
                </CardTitle>
                <CardDescription>
                  Send a test message to verify your configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="testPhone">Phone Number</Label>
                  <Input
                    id="testPhone"
                    placeholder="+27 82 123 4567"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Include country code (e.g., +27 for South Africa)
                  </p>
                </div>
                <Button 
                  onClick={testConnection} 
                  disabled={testingConnection || !configured}
                  className="w-full"
                >
                  {testingConnection ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Test Message
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Test E-Receipt
                </CardTitle>
                <CardDescription>
                  Send a sample e-receipt to test the receipt format
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="testReceiptPhone">Phone Number</Label>
                  <Input
                    id="testReceiptPhone"
                    placeholder="+27 82 123 4567"
                    value={testReceiptPhone}
                    onChange={(e) => setTestReceiptPhone(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={sendTestReceipt} 
                  disabled={!configured || !testReceiptPhone}
                  className="w-full"
                  variant="outline"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Send Test Receipt
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Send Custom Message</CardTitle>
              <CardDescription>
                Send a custom WhatsApp message for testing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Phone Number</Label>
                  <Input placeholder="+27 82 123 4567" />
                </div>
                <div className="grid gap-2">
                  <Label>Message Type</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors">
                    <option value="text">Text Message</option>
                    <option value="booking">Booking Confirmation</option>
                    <option value="reminder">Appointment Reminder</option>
                    <option value="order">Order Update</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Message</Label>
                <Textarea placeholder="Enter your message here..." rows={4} />
              </div>
              <Button disabled={!configured}>
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
