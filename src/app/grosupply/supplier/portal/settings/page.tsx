'use client'

import { useState } from 'react'
import {
  Settings,
  Building2,
  CreditCard,
  Bell,
  Plug,
  Save,
  Eye,
  EyeOff,
  Copy,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  Key,
  Globe,
  Mail,
  Phone,
  MapPin,
  FileText,
  ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
import { Separator } from '@/components/ui/separator'

// Types
interface CompanyProfile {
  companyName: string
  tradingName: string
  registrationNumber: string
  vatNumber: string
  email: string
  phone: string
  website: string
  address: {
    street: string
    suburb: string
    city: string
    province: string
    postalCode: string
    country: string
  }
  contactPerson: {
    name: string
    email: string
    phone: string
  }
}

interface BankDetails {
  bankName: string
  accountName: string
  accountNumber: string
  branchCode: string
  accountType: string
}

interface NotificationSettings {
  orderConfirmation: boolean
  orderCancellation: boolean
  newRfq: boolean
  invoiceGenerated: boolean
  paymentReceived: boolean
  disputeOpened: boolean
  disputeResolved: boolean
  lowStock: boolean
  marketingEmails: boolean
  weeklyReport: boolean
  monthlyReport: boolean
  notificationEmail: string
  notificationPhone: string
}

interface ApiKey {
  id: string
  name: string
  key: string
  createdAt: string
  lastUsed: string | null
  status: 'active' | 'revoked'
}

interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  status: 'active' | 'disabled'
  secret: string
}

// Mock initial data
const initialCompanyProfile: CompanyProfile = {
  companyName: 'Fresh Farm Produce SA (Pty) Ltd',
  tradingName: 'Fresh Farm Produce',
  registrationNumber: '2018/123456/07',
  vatNumber: '4567890123',
  email: 'info@freshfarmproduce.co.za',
  phone: '+27 11 234 5678',
  website: 'https://freshfarmproduce.co.za',
  address: {
    street: '123 Farm Road',
    suburb: 'Ceres',
    city: 'Ceres',
    province: 'Western Cape',
    postalCode: '6835',
    country: 'South Africa',
  },
  contactPerson: {
    name: 'Johan van der Merwe',
    email: 'johan@freshfarmproduce.co.za',
    phone: '+27 82 123 4567',
  },
}

const initialBankDetails: BankDetails = {
  bankName: 'FNB',
  accountName: 'Fresh Farm Produce SA (Pty) Ltd',
  accountNumber: '6284 7391 825',
  branchCode: '250655',
  accountType: 'Business Cheque Account',
}

const initialNotifications: NotificationSettings = {
  orderConfirmation: true,
  orderCancellation: true,
  newRfq: true,
  invoiceGenerated: true,
  paymentReceived: true,
  disputeOpened: true,
  disputeResolved: true,
  lowStock: true,
  marketingEmails: false,
  weeklyReport: true,
  monthlyReport: true,
  notificationEmail: 'johan@freshfarmproduce.co.za',
  notificationPhone: '+27 82 123 4567',
}

const initialApiKeys: ApiKey[] = [
  {
    id: '1',
    name: 'Production API Key',
    key: 'gsk_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    createdAt: '2023-06-15',
    lastUsed: '2024-01-15',
    status: 'active',
  },
  {
    id: '2',
    name: 'Test API Key',
    key: 'gsk_test_x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6',
    createdAt: '2023-08-20',
    lastUsed: '2024-01-10',
    status: 'active',
  },
]

const initialWebhooks: Webhook[] = [
  {
    id: '1',
    name: 'Order Sync',
    url: 'https://api.freshfarmproduce.co.za/webhooks/orders',
    events: ['order.created', 'order.updated', 'order.cancelled'],
    status: 'active',
    secret: 'whsec_abc123def456',
  },
  {
    id: '2',
    name: 'Inventory Update',
    url: 'https://api.freshfarmproduce.co.za/webhooks/inventory',
    events: ['inventory.low', 'inventory.updated'],
    status: 'active',
    secret: 'whsec_xyz789uvw012',
  },
]

const SA_BANKS = [
  'Absa',
  'African Bank',
  'Capitec Bank',
  'FNB',
  'Investec',
  'Nedbank',
  'Standard Bank',
  'TymeBank',
]

const SA_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
  'Western Cape',
]

export default function SupplierSettingsPage() {
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(initialCompanyProfile)
  const [bankDetails, setBankDetails] = useState<BankDetails>(initialBankDetails)
  const [notifications, setNotifications] = useState<NotificationSettings>(initialNotifications)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialApiKeys)
  const [webhooks, setWebhooks] = useState<Webhook[]>(initialWebhooks)
  
  const [showApiKey, setShowApiKey] = useState<string | null>(null)
  const [showBankAccount, setShowBankAccount] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  
  const [showAddApiDialog, setShowAddApiDialog] = useState(false)
  const [showAddWebhookDialog, setShowAddWebhookDialog] = useState(false)
  const [newApiKeyName, setNewApiKeyName] = useState('')
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [] as string[],
  })

  // Handle save
  const handleSave = async (section: string) => {
    setSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
    setSaveSuccess(section)
    setTimeout(() => setSaveSuccess(null), 3000)
  }

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // Generate new API key
  const generateApiKey = () => {
    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: newApiKeyName,
      key: `gsk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      createdAt: new Date().toISOString().split('T')[0],
      lastUsed: null,
      status: 'active',
    }
    setApiKeys(prev => [...prev, newKey])
    setShowAddApiDialog(false)
    setNewApiKeyName('')
  }

  // Revoke API key
  const revokeApiKey = (id: string) => {
    setApiKeys(prev => prev.map(k => k.id === id ? { ...k, status: 'revoked' } : k))
  }

  // Add webhook
  const addWebhook = () => {
    const webhook: Webhook = {
      id: Date.now().toString(),
      name: newWebhook.name,
      url: newWebhook.url,
      events: newWebhook.events,
      status: 'active',
      secret: `whsec_${Math.random().toString(36).substring(2, 15)}`,
    }
    setWebhooks(prev => [...prev, webhook])
    setShowAddWebhookDialog(false)
    setNewWebhook({ name: '', url: '', events: [] })
  }

  // Delete webhook
  const deleteWebhook = (id: string) => {
    setWebhooks(prev => prev.filter(w => w.id !== id))
  }

  // Toggle webhook event
  const toggleWebhookEvent = (event: string) => {
    setNewWebhook(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }))
  }

  const WEBHOOK_EVENTS = [
    { id: 'order.created', label: 'Order Created' },
    { id: 'order.updated', label: 'Order Updated' },
    { id: 'order.cancelled', label: 'Order Cancelled' },
    { id: 'order.delivered', label: 'Order Delivered' },
    { id: 'invoice.generated', label: 'Invoice Generated' },
    { id: 'payment.received', label: 'Payment Received' },
    { id: 'rfq.created', label: 'RFQ Created' },
    { id: 'inventory.low', label: 'Low Stock Alert' },
    { id: 'inventory.updated', label: 'Inventory Updated' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Manage your account and preferences</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Company Profile</span>
            <span className="sm:hidden">Company</span>
          </TabsTrigger>
          <TabsTrigger value="bank" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Bank Details</span>
            <span className="sm:hidden">Bank</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
            <span className="sm:hidden">Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Plug className="h-4 w-4" />
            <span className="hidden sm:inline">Integrations</span>
            <span className="sm:hidden">API</span>
          </TabsTrigger>
        </TabsList>

        {/* Company Profile Tab */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#00897B]" />
                Company Profile
              </CardTitle>
              <CardDescription>
                Update your company information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Company Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Company Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={companyProfile.companyName}
                      onChange={(e) => setCompanyProfile(prev => ({ ...prev, companyName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tradingName">Trading Name</Label>
                    <Input
                      id="tradingName"
                      value={companyProfile.tradingName}
                      onChange={(e) => setCompanyProfile(prev => ({ ...prev, tradingName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="regNumber">Registration Number *</Label>
                    <Input
                      id="regNumber"
                      value={companyProfile.registrationNumber}
                      onChange={(e) => setCompanyProfile(prev => ({ ...prev, registrationNumber: e.target.value }))}
                      placeholder="20XX/XXXXXX/07"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vatNumber">VAT Number *</Label>
                    <Input
                      id="vatNumber"
                      value={companyProfile.vatNumber}
                      onChange={(e) => setCompanyProfile(prev => ({ ...prev, vatNumber: e.target.value }))}
                      placeholder="XXXXXXXXXX"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={companyProfile.email}
                        onChange={(e) => setCompanyProfile(prev => ({ ...prev, email: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        value={companyProfile.phone}
                        onChange={(e) => setCompanyProfile(prev => ({ ...prev, phone: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="website"
                        value={companyProfile.website}
                        onChange={(e) => setCompanyProfile(prev => ({ ...prev, website: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Address */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Business Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="street">Street Address *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="street"
                        value={companyProfile.address.street}
                        onChange={(e) => setCompanyProfile(prev => ({
                          ...prev,
                          address: { ...prev.address, street: e.target.value }
                        }))}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="suburb">Suburb</Label>
                    <Input
                      id="suburb"
                      value={companyProfile.address.suburb}
                      onChange={(e) => setCompanyProfile(prev => ({
                        ...prev,
                        address: { ...prev.address, suburb: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={companyProfile.address.city}
                      onChange={(e) => setCompanyProfile(prev => ({
                        ...prev,
                        address: { ...prev.address, city: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="province">Province *</Label>
                    <Select
                      value={companyProfile.address.province}
                      onValueChange={(value) => setCompanyProfile(prev => ({
                        ...prev,
                        address: { ...prev.address, province: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SA_PROVINCES.map(province => (
                          <SelectItem key={province} value={province}>{province}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal Code *</Label>
                    <Input
                      id="postalCode"
                      value={companyProfile.address.postalCode}
                      onChange={(e) => setCompanyProfile(prev => ({
                        ...prev,
                        address: { ...prev.address, postalCode: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact Person */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Primary Contact Person</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="contactName">Full Name *</Label>
                    <Input
                      id="contactName"
                      value={companyProfile.contactPerson.name}
                      onChange={(e) => setCompanyProfile(prev => ({
                        ...prev,
                        contactPerson: { ...prev.contactPerson, name: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactEmail">Email *</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={companyProfile.contactPerson.email}
                      onChange={(e) => setCompanyProfile(prev => ({
                        ...prev,
                        contactPerson: { ...prev.contactPerson, email: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPhone">Phone *</Label>
                    <Input
                      id="contactPhone"
                      value={companyProfile.contactPerson.phone}
                      onChange={(e) => setCompanyProfile(prev => ({
                        ...prev,
                        contactPerson: { ...prev.contactPerson, phone: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-end gap-3 pt-4">
                {saveSuccess === 'company' && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm">Saved successfully</span>
                  </div>
                )}
                <Button
                  className="bg-[#00897B] hover:bg-[#00695C]"
                  onClick={() => handleSave('company')}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bank Details Tab */}
        <TabsContent value="bank">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#00897B]" />
                Bank Details
              </CardTitle>
              <CardDescription>
                Update your banking information for payments and settlements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Important</p>
                    <p className="mt-1">Your bank details are used for settlement payments. Ensure all details are accurate to avoid payment delays.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Select
                    value={bankDetails.bankName}
                    onValueChange={(value) => setBankDetails(prev => ({ ...prev, bankName: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {SA_BANKS.map(bank => (
                        <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="accountName">Account Name *</Label>
                  <Input
                    id="accountName"
                    value={bankDetails.accountName}
                    onChange={(e) => setBankDetails(prev => ({ ...prev, accountName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="accountNumber">Account Number *</Label>
                  <div className="relative">
                    <Input
                      id="accountNumber"
                      type={showBankAccount ? 'text' : 'password'}
                      value={bankDetails.accountNumber}
                      onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowBankAccount(!showBankAccount)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showBankAccount ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="branchCode">Branch Code *</Label>
                  <Input
                    id="branchCode"
                    value={bankDetails.branchCode}
                    onChange={(e) => setBankDetails(prev => ({ ...prev, branchCode: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="accountType">Account Type *</Label>
                  <Select
                    value={bankDetails.accountType}
                    onValueChange={(value) => setBankDetails(prev => ({ ...prev, accountType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Business Cheque Account">Business Cheque Account</SelectItem>
                      <SelectItem value="Business Savings Account">Business Savings Account</SelectItem>
                      <SelectItem value="Current Account">Current Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Verification Status */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Bank Account Verified</p>
                    <p className="text-sm text-green-700">Your bank account was verified on 2023-06-15</p>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-end gap-3 pt-4">
                {saveSuccess === 'bank' && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm">Saved successfully</span>
                  </div>
                )}
                <Button
                  className="bg-[#00897B] hover:bg-[#00695C]"
                  onClick={() => handleSave('bank')}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-[#00897B]" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Order Notifications */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Order Notifications</h4>
                <div className="space-y-4">
                  {[
                    { key: 'orderConfirmation', label: 'Order Confirmations', description: 'When a buyer confirms an order' },
                    { key: 'orderCancellation', label: 'Order Cancellations', description: 'When a buyer cancels an order' },
                    { key: 'newRfq', label: 'New RFQ Requests', description: 'When a new RFQ is submitted' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{item.label}</p>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                      <Switch
                        checked={notifications[item.key as keyof NotificationSettings] as boolean}
                        onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, [item.key]: checked }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Financial Notifications */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Financial Notifications</h4>
                <div className="space-y-4">
                  {[
                    { key: 'invoiceGenerated', label: 'Invoice Generated', description: 'When an invoice is generated for an order' },
                    { key: 'paymentReceived', label: 'Payment Received', description: 'When payment is received from a buyer' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{item.label}</p>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                      <Switch
                        checked={notifications[item.key as keyof NotificationSettings] as boolean}
                        onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, [item.key]: checked }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Dispute Notifications */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Dispute Notifications</h4>
                <div className="space-y-4">
                  {[
                    { key: 'disputeOpened', label: 'Dispute Opened', description: 'When a dispute is opened against you' },
                    { key: 'disputeResolved', label: 'Dispute Resolved', description: 'When a dispute is resolved' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{item.label}</p>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                      <Switch
                        checked={notifications[item.key as keyof NotificationSettings] as boolean}
                        onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, [item.key]: checked }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Other Notifications */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Other Notifications</h4>
                <div className="space-y-4">
                  {[
                    { key: 'lowStock', label: 'Low Stock Alerts', description: 'When product stock falls below threshold' },
                    { key: 'marketingEmails', label: 'Marketing Emails', description: 'News, updates and promotional content' },
                    { key: 'weeklyReport', label: 'Weekly Report', description: 'Summary of weekly activity' },
                    { key: 'monthlyReport', label: 'Monthly Report', description: 'Detailed monthly business report' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{item.label}</p>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                      <Switch
                        checked={notifications[item.key as keyof NotificationSettings] as boolean}
                        onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, [item.key]: checked }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Contact Details for Notifications */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Notification Delivery</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="notificationEmail">Email for Notifications</Label>
                    <Input
                      id="notificationEmail"
                      type="email"
                      value={notifications.notificationEmail}
                      onChange={(e) => setNotifications(prev => ({ ...prev, notificationEmail: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notificationPhone">Phone for SMS Alerts</Label>
                    <Input
                      id="notificationPhone"
                      value={notifications.notificationPhone}
                      onChange={(e) => setNotifications(prev => ({ ...prev, notificationPhone: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-end gap-3 pt-4">
                {saveSuccess === 'notifications' && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm">Saved successfully</span>
                  </div>
                )}
                <Button
                  className="bg-[#00897B] hover:bg-[#00695C]"
                  onClick={() => handleSave('notifications')}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <div className="space-y-6">
            {/* API Keys */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5 text-[#00897B]" />
                      API Keys
                    </CardTitle>
                    <CardDescription>
                      Manage API keys for programmatic access
                    </CardDescription>
                  </div>
                  <Button
                    className="bg-[#00897B] hover:bg-[#00695C]"
                    onClick={() => setShowAddApiDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Key
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {apiKeys.map((apiKey) => (
                    <div key={apiKey.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900">{apiKey.name}</p>
                          <Badge className={apiKey.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                            {apiKey.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-white px-2 py-1 rounded border font-mono">
                            {showApiKey === apiKey.id ? apiKey.key : '••••••••••••••••••••••••••••••••'}
                          </code>
                          <button
                            onClick={() => setShowApiKey(showApiKey === apiKey.id ? null : apiKey.id)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            {showApiKey === apiKey.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(apiKey.key)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Created: {apiKey.createdAt}</span>
                          {apiKey.lastUsed && <span>Last used: {apiKey.lastUsed}</span>}
                        </div>
                      </div>
                      {apiKey.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => revokeApiKey(apiKey.id)}
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Webhooks */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-[#00897B]" />
                      Webhooks
                    </CardTitle>
                    <CardDescription>
                      Configure webhooks for real-time event notifications
                    </CardDescription>
                  </div>
                  <Button
                    className="bg-[#00897B] hover:bg-[#00695C]"
                    onClick={() => setShowAddWebhookDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Webhook
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {webhooks.map((webhook) => (
                    <div key={webhook.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900">{webhook.name}</p>
                            <Badge className={webhook.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                              {webhook.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 break-all">{webhook.url}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {webhook.events.map(event => (
                              <Badge key={event} variant="outline" className="text-xs">
                                {event}
                              </Badge>
                            ))}
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            <span>Secret: {webhook.secret.substring(0, 10)}...</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => deleteWebhook(webhook.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* API Documentation Link */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#00897B]/10 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-[#00897B]" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">API Documentation</p>
                      <p className="text-sm text-gray-500">Learn how to integrate with GroSupply API</p>
                    </div>
                  </div>
                  <Button variant="outline">
                    View Docs
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add API Key Dialog */}
      <Dialog open={showAddApiDialog} onOpenChange={setShowAddApiDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for programmatic access
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="apiKeyName">Key Name</Label>
            <Input
              id="apiKeyName"
              value={newApiKeyName}
              onChange={(e) => setNewApiKeyName(e.target.value)}
              placeholder="e.g., Production Integration"
            />
            <p className="text-xs text-gray-500 mt-2">
              Give your API key a descriptive name to help you identify it later.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddApiDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#00897B] hover:bg-[#00695C]"
              onClick={generateApiKey}
              disabled={!newApiKeyName}
            >
              Generate Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Webhook Dialog */}
      <Dialog open={showAddWebhookDialog} onOpenChange={setShowAddWebhookDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Webhook</DialogTitle>
            <DialogDescription>
              Configure a new webhook endpoint
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="webhookName">Webhook Name</Label>
              <Input
                id="webhookName"
                value={newWebhook.name}
                onChange={(e) => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Order Sync"
              />
            </div>
            <div>
              <Label htmlFor="webhookUrl">Endpoint URL</Label>
              <Input
                id="webhookUrl"
                value={newWebhook.url}
                onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://your-api.com/webhooks/grosupply"
              />
            </div>
            <div>
              <Label>Events to Subscribe</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {WEBHOOK_EVENTS.map(event => (
                  <label
                    key={event.id}
                    className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                      newWebhook.events.includes(event.id)
                        ? 'bg-[#00897B]/10 border-[#00897B]'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={newWebhook.events.includes(event.id)}
                      onChange={() => toggleWebhookEvent(event.id)}
                      className="sr-only"
                    />
                    <span className="text-sm">{event.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddWebhookDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#00897B] hover:bg-[#00695C]"
              onClick={addWebhook}
              disabled={!newWebhook.name || !newWebhook.url || newWebhook.events.length === 0}
            >
              Add Webhook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
