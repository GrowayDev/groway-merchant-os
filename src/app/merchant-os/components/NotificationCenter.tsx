'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Bell,
  MessageSquare,
  Mail,
  Smartphone,
  Send,
  Settings,
  History,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Trash2,
  Copy,
  Download,
  QrCode,
  Share2
} from 'lucide-react';

// WhatsApp Icon Component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

interface Notification {
  id: string;
  recipientName: string;
  recipientPhone: string;
  channel: 'whatsapp' | 'sms' | 'email';
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'read';
  body: string;
  cost: number;
  createdAt: string;
  sentAt?: string;
  deliveredAt?: string;
}

interface EReceipt {
  id: string;
  receiptNumber: string;
  transactionNumber: string;
  customerName: string;
  customerPhone: string;
  total: number;
  sentViaWhatsapp: boolean;
  whatsappSentAt?: string;
  viewCount: number;
  createdAt: string;
}

interface NotificationSettings {
  whatsappEnabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
  autoSendReceipts: boolean;
  receiptChannel: 'whatsapp' | 'sms' | 'email';
}

interface NotificationTemplate {
  id: string;
  code: string;
  name: string;
  channel: string;
  body: string;
  variables: string[];
  status: string;
}

// Mock data
const mockNotifications: Notification[] = [
  {
    id: '1',
    recipientName: 'Thandi Nkosi',
    recipientPhone: '+27821234567',
    channel: 'whatsapp',
    status: 'delivered',
    body: '🧾 E-Receipt for R450.00 - Thank you for shopping with us!',
    cost: 0.35,
    createdAt: '2025-01-09T10:30:00Z',
    sentAt: '2025-01-09T10:30:05Z',
    deliveredAt: '2025-01-09T10:30:08Z',
  },
  {
    id: '2',
    recipientName: 'Johan van der Berg',
    recipientPhone: '+27829876543',
    channel: 'whatsapp',
    status: 'sent',
    body: '📅 Appointment Reminder: Your appointment is tomorrow at 14:00',
    cost: 0.35,
    createdAt: '2025-01-09T09:00:00Z',
    sentAt: '2025-01-09T09:00:02Z',
  },
  {
    id: '3',
    recipientName: 'Sipho Mokoena',
    recipientPhone: '+27834567890',
    channel: 'sms',
    status: 'failed',
    body: 'Your order #1234 is ready for collection',
    cost: 0.50,
    createdAt: '2025-01-09T08:45:00Z',
  },
];

const mockEReceipts: EReceipt[] = [
  {
    id: '1',
    receiptNumber: 'RCP-20250109-ABC1',
    transactionNumber: 'TXN-20250109-001',
    customerName: 'Thandi Nkosi',
    customerPhone: '+27821234567',
    total: 450.00,
    sentViaWhatsapp: true,
    whatsappSentAt: '2025-01-09T10:30:05Z',
    viewCount: 3,
    createdAt: '2025-01-09T10:30:00Z',
  },
  {
    id: '2',
    receiptNumber: 'RCP-20250109-ABC2',
    transactionNumber: 'TXN-20250109-002',
    customerName: 'Walk-in Customer',
    customerPhone: '+27821234568',
    total: 125.50,
    sentViaWhatsapp: true,
    whatsappSentAt: '2025-01-09T11:15:00Z',
    viewCount: 1,
    createdAt: '2025-01-09T11:15:00Z',
  },
];

const mockTemplates: NotificationTemplate[] = [
  {
    id: '1',
    code: 'ereceipt_whatsapp',
    name: 'E-Receipt (WhatsApp)',
    channel: 'whatsapp',
    body: '🧾 *E-RECEIPT*\n...\n*TOTAL:* R{{total}}\n\nThank you for your business!',
    variables: ['merchant_name', 'total', 'items', 'date'],
    status: 'approved',
  },
  {
    id: '2',
    code: 'appointment_reminder',
    name: 'Appointment Reminder',
    channel: 'whatsapp',
    body: '📅 Reminder: Your appointment is on {{date}} at {{time}}',
    variables: ['customer_name', 'service', 'date', 'time', 'staff_name'],
    status: 'approved',
  },
  {
    id: '3',
    code: 'order_ready',
    name: 'Order Ready Notification',
    channel: 'whatsapp',
    body: '✅ Your order #{{order_number}} is ready for collection!',
    variables: ['customer_name', 'order_number'],
    status: 'approved',
  },
  {
    id: '4',
    code: 'payment_reminder',
    name: 'Payment Reminder',
    channel: 'whatsapp',
    body: '💳 Payment of R{{amount}} due on {{due_date}}',
    variables: ['customer_name', 'amount', 'due_date'],
    status: 'pending_approval',
  },
];

export function NotificationCenter() {
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [eReceipts, setEReceipts] = useState<EReceipt[]>(mockEReceipts);
  const [templates, setTemplates] = useState<NotificationTemplate[]>(mockTemplates);
  const [settings, setSettings] = useState<NotificationSettings>({
    whatsappEnabled: true,
    smsEnabled: false,
    emailEnabled: true,
    autoSendReceipts: true,
    receiptChannel: 'whatsapp',
  });

  // Dialogs
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [receiptDetailOpen, setReceiptDetailOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<EReceipt | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Form state
  const [sendForm, setSendForm] = useState({
    recipientPhone: '',
    recipientName: '',
    channel: 'whatsapp' as 'whatsapp' | 'sms' | 'email',
    message: '',
  });

  // Stats
  const stats = {
    todaySent: notifications.filter(n => n.status === 'sent' || n.status === 'delivered').length,
    todayDelivered: notifications.filter(n => n.status === 'delivered').length,
    todayFailed: notifications.filter(n => n.status === 'failed').length,
    pendingQueue: notifications.filter(n => n.status === 'queued').length,
    todayCost: notifications.reduce((sum, n) => sum + n.cost, 0),
    eReceiptsSent: eReceipts.filter(r => r.sentViaWhatsapp).length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'queued':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'read':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return <WhatsAppIcon className="h-4 w-4 text-green-600" />;
      case 'sms':
        return <Smartphone className="h-4 w-4 text-blue-600" />;
      case 'email':
        return <Mail className="h-4 w-4 text-purple-600" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const handleSendNotification = async () => {
    // In production, this would call the API
    const newNotification: Notification = {
      id: Date.now().toString(),
      recipientName: sendForm.recipientName,
      recipientPhone: sendForm.recipientPhone,
      channel: sendForm.channel,
      status: 'sent',
      body: sendForm.message,
      cost: sendForm.channel === 'whatsapp' ? 0.35 : sendForm.channel === 'sms' ? 0.50 : 0.005,
      createdAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
    };
    setNotifications([newNotification, ...notifications]);
    setSendDialogOpen(false);
    setSendForm({ recipientPhone: '', recipientName: '', channel: 'whatsapp', message: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notification Center</h2>
          <p className="text-muted-foreground">
            WhatsApp, SMS & Email notifications with E-Receipt delivery
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setSendDialogOpen(true)}>
            <Send className="h-4 w-4 mr-2" />
            Send Message
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="ereceipts">E-Receipts</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Sent Today</p>
                    <p className="text-2xl font-bold">{stats.todaySent}</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Send className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Delivered</p>
                    <p className="text-2xl font-bold">{stats.todayDelivered}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">E-Receipts</p>
                    <p className="text-2xl font-bold">{stats.eReceiptsSent}</p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <QrCode className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Cost Today</p>
                    <p className="text-2xl font-bold">R{stats.todayCost.toFixed(2)}</p>
                  </div>
                  <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Channel Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Channel Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {/* WhatsApp */}
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <WhatsAppIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">WhatsApp</p>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">R0.35 per session message</p>
                  </div>
                  <Switch checked={settings.whatsappEnabled} />
                </div>

                {/* SMS */}
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Smartphone className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">SMS</p>
                      <Badge variant="outline">Setup Required</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">R0.50 per segment</p>
                  </div>
                  <Switch checked={settings.smsEnabled} />
                </div>

                {/* Email */}
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Mail className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">Email</p>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">R0.005 per email</p>
                  </div>
                  <Switch checked={settings.emailEnabled} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity & Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recent Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((notification) => (
                      <div key={notification.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        {getChannelIcon(notification.channel)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">{notification.recipientName}</p>
                            <Badge className={getStatusColor(notification.status)}>
                              {notification.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{notification.body}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notification.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline" onClick={() => setSendDialogOpen(true)}>
                  <Send className="h-4 w-4 mr-3" />
                  Send Quick Message
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('ereceipts')}>
                  <QrCode className="h-4 w-4 mr-3" />
                  Generate E-Receipt
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => {
                    setSendForm({ ...sendForm, message: '📢 BROADCAST MESSAGE\n\n' });
                    setSendDialogOpen(true);
                  }}>
                  <Users className="h-4 w-4 mr-3" />
                  Broadcast to Customers
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => setTemplateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-3" />
                  Create Template
                </Button>
                <Separator />
                <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('messages')}>
                  <History className="h-4 w-4 mr-3" />
                  View Full History
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search messages..." className="pl-9" />
                  </div>
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Channels</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="queued">Queued</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Messages List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Messages</CardTitle>
              <CardDescription>{notifications.length} messages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div key={notification.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50">
                    {getChannelIcon(notification.channel)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{notification.recipientName}</p>
                        <span className="text-sm text-muted-foreground">{notification.recipientPhone}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{notification.body}</p>
                    </div>
                    <Badge className={getStatusColor(notification.status)}>
                      {notification.status}
                    </Badge>
                    <div className="text-right">
                      <p className="text-sm font-medium">R{notification.cost.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* E-Receipts Tab */}
        <TabsContent value="ereceipts" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">E-Receipts</h3>
              <p className="text-sm text-muted-foreground">
                Digital receipts delivered via WhatsApp
              </p>
            </div>
            <Button>
              <QrCode className="h-4 w-4 mr-2" />
              Generate E-Receipt
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eReceipts.map((receipt) => (
              <Card key={receipt.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <WhatsAppIcon className="h-5 w-5 text-green-600" />
                      <Badge className="bg-green-100 text-green-800">
                        {receipt.sentViaWhatsapp ? 'Sent' : 'Pending'}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {receipt.viewCount} views
                    </span>
                  </div>
                  <CardTitle className="text-lg mt-2">R{receipt.total.toFixed(2)}</CardTitle>
                  <CardDescription>{receipt.receiptNumber}</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Customer:</span>
                      <span className="font-medium">{receipt.customerName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Phone:</span>
                      <span>{receipt.customerPhone}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Transaction:</span>
                      <span>{receipt.transactionNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sent:</span>
                      <span>{receipt.whatsappSentAt ? new Date(receipt.whatsappSentAt).toLocaleString() : 'Not sent'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Message Templates</h3>
              <p className="text-sm text-muted-foreground">
                Pre-approved templates for WhatsApp Business API
              </p>
            </div>
            <Button onClick={() => setTemplateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getChannelIcon(template.channel)}
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                    <Badge className={getStatusColor(template.status)}>
                      {template.status}
                    </Badge>
                  </div>
                  <CardDescription>Code: {template.code}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 p-3 rounded-lg mb-4">
                    <p className="text-sm whitespace-pre-line">{template.body}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {template.variables.map((variable) => (
                      <Badge key={variable} variant="outline" className="text-xs">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure how and when notifications are sent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* WhatsApp Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">WhatsApp Business API</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications via WhatsApp
                    </p>
                  </div>
                  <Switch
                    checked={settings.whatsappEnabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, whatsappEnabled: checked })}
                  />
                </div>
                <div className="pl-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Auto-send E-Receipts</Label>
                    <Switch
                      checked={settings.autoSendReceipts}
                      onCheckedChange={(checked) => setSettings({ ...settings, autoSendReceipts: checked })}
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <Label className="w-40">Receipt Channel</Label>
                    <Select
                      value={settings.receiptChannel}
                      onValueChange={(value: 'whatsapp' | 'sms' | 'email') => 
                        setSettings({ ...settings, receiptChannel: value })
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* SMS Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications via SMS (Twilio/Africa's Talking)
                    </p>
                  </div>
                  <Switch
                    checked={settings.smsEnabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, smsEnabled: checked })}
                  />
                </div>
              </div>

              <Separator />

              {/* Email Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailEnabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, emailEnabled: checked })}
                  />
                </div>
              </div>

              <Separator />

              {/* Reminder Settings */}
              <div className="space-y-4">
                <h4 className="font-medium">Appointment Reminders</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label>24-hour reminder</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>2-hour reminder</Label>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Quiet Hours */}
              <div className="space-y-4">
                <h4 className="font-medium">Quiet Hours</h4>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch defaultChecked={false} />
                    <Label>Enable quiet hours</Label>
                  </div>
                  <div className="flex gap-2">
                    <Input type="time" defaultValue="21:00" className="w-28" />
                    <span className="text-muted-foreground self-center">to</span>
                    <Input type="time" defaultValue="08:00" className="w-28" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp Business Setup */}
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Business API Setup</CardTitle>
              <CardDescription>Connect your WhatsApp Business account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>WhatsApp Business ID</Label>
                  <Input placeholder="Enter your Business ID" />
                </div>
                <div>
                  <Label>Phone Number ID</Label>
                  <Input placeholder="Enter Phone Number ID" />
                </div>
              </div>
              <div>
                <Label>Access Token</Label>
                <Input type="password" placeholder="Enter your access token" />
              </div>
              <div>
                <Label>Webhook Verify Token</Label>
                <div className="flex gap-2">
                  <Input value="groway_webhook_2024" readOnly />
                  <Button variant="outline">Copy</Button>
                  <Button variant="outline">Regenerate</Button>
                </div>
              </div>
              <Button className="w-full">
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Delivery Rate</p>
                <p className="text-2xl font-bold text-green-600">98.5%</p>
                <Progress value={98.5} className="mt-2 h-2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Read Rate</p>
                <p className="text-2xl font-bold">72.3%</p>
                <Progress value={72.3} className="mt-2 h-2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Monthly Cost</p>
                <p className="text-2xl font-bold">R{124.50.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">vs R98.00 last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">E-Receipt Savings</p>
                <p className="text-2xl font-bold text-green-600">R{450.00.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">vs paper receipts</p>
              </CardContent>
            </Card>
          </div>

          {/* Channel Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Channel Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <WhatsAppIcon className="h-6 w-6 text-green-600" />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">WhatsApp</span>
                      <span className="text-muted-foreground">356 messages</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div className="text-right">
                    <p className="font-medium">R124.60</p>
                    <p className="text-xs text-muted-foreground">98% delivery</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Smartphone className="h-6 w-6 text-blue-600" />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">SMS</span>
                      <span className="text-muted-foreground">45 messages</span>
                    </div>
                    <Progress value={15} className="h-2" />
                  </div>
                  <div className="text-right">
                    <p className="font-medium">R22.50</p>
                    <p className="text-xs text-muted-foreground">95% delivery</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Mail className="h-6 w-6 text-purple-600" />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Email</span>
                      <span className="text-muted-foreground">128 messages</span>
                    </div>
                    <Progress value={30} className="h-2" />
                  </div>
                  <div className="text-right">
                    <p className="font-medium">R0.64</p>
                    <p className="text-xs text-muted-foreground">42% open rate</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Send Message Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Quick Message</DialogTitle>
            <DialogDescription>
              Send a notification via WhatsApp, SMS, or Email
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Recipient Name</Label>
                <Input
                  placeholder="Customer name"
                  value={sendForm.recipientName}
                  onChange={(e) => setSendForm({ ...sendForm, recipientName: e.target.value })}
                />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  placeholder="+27..."
                  value={sendForm.recipientPhone}
                  onChange={(e) => setSendForm({ ...sendForm, recipientPhone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Channel</Label>
              <Select
                value={sendForm.channel}
                onValueChange={(value: 'whatsapp' | 'sms' | 'email') => 
                  setSendForm({ ...sendForm, channel: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">
                    <div className="flex items-center gap-2">
                      <WhatsAppIcon className="h-4 w-4 text-green-600" />
                      WhatsApp (R0.35)
                    </div>
                  </SelectItem>
                  <SelectItem value="sms">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-blue-600" />
                      SMS (R0.50)
                    </div>
                  </SelectItem>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-purple-600" />
                      Email (R0.005)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                placeholder="Type your message..."
                value={sendForm.message}
                onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })}
                rows={4}
              />
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Estimated cost:</span>
              <span className="font-medium">
                R{sendForm.channel === 'whatsapp' ? '0.35' : sendForm.channel === 'sms' ? '0.50' : '0.005'}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendNotification} disabled={!sendForm.recipientPhone || !sendForm.message}>
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Message Template</DialogTitle>
            <DialogDescription>
              Create a reusable template for notifications
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Template Name</Label>
                <Input placeholder="e.g., Welcome Message" />
              </div>
              <div>
                <Label>Template Code</Label>
                <Input placeholder="e.g., welcome_customer" />
              </div>
            </div>
            <div>
              <Label>Channel</Label>
              <Select defaultValue="whatsapp">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Message Body</Label>
              <Textarea
                placeholder="Hi {{customer_name}}, welcome to {{merchant_name}}!"
                rows={5}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use {'{{variable}}'} syntax for dynamic content
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
              Cancel
            </Button>
            <Button>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
