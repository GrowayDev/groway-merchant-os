'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Settings,
  Store,
  CreditCard,
  Percent,
  Bell,
  Shield,
  Globe,
  Palette,
  Clock,
  Mail,
  Phone,
  MapPin,
  Save,
  RefreshCw,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Plus,
  X,
  Eye,
  EyeOff,
  Key,
  Smartphone,
  Printer,
  Database,
  Cloud,
  HardDrive,
  Globe2,
  ChevronRight,
  Building,
  User,
  FileText,
  Download,
  Upload,
  Info,
  Zap,
} from 'lucide-react'

// Business settings interface
interface BusinessSettings {
  businessName: string
  tradingName: string
  registrationNumber: string
  vatNumber: string
  email: string
  phone: string
  website: string
  address: {
    street: string
    city: string
    province: string
    postalCode: string
    country: string
  }
  logo: string | null
  currency: string
  timezone: string
  language: string
}

// Payment method interface
interface PaymentMethod {
  id: string
  name: string
  type: 'card' | 'cash' | 'qr' | 'wallet' | 'eft'
  enabled: boolean
  provider?: string
  fee?: number
}

// Tax settings interface
interface TaxSettings {
  vatEnabled: boolean
  vatRate: number
  vatNumber: string
  inclusivePricing: boolean
  taxExemptCategories: string[]
}

// Receipt settings interface
interface ReceiptSettings {
  showLogo: boolean
  showVatNumber: boolean
  showAddress: boolean
  showPhone: boolean
  showEmail: boolean
  customMessage: string
  footerText: string
  paperSize: '58mm' | '80mm'
  autoPrint: boolean
}

// Notification settings
interface NotificationSettings {
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  lowStockAlerts: boolean
  dailySummary: boolean
  weeklyReport: boolean
  marketingAlerts: boolean
}

// Initial settings
const initialBusinessSettings: BusinessSettings = {
  businessName: 'My Business',
  tradingName: 'My Shop',
  registrationNumber: '2026/123456/07',
  vatNumber: '4123456789',
  email: 'info@mybusiness.co.za',
  phone: '+27 11 123 4567',
  website: 'www.mybusiness.co.za',
  address: {
    street: '123 Main Street',
    city: 'Johannesburg',
    province: 'Gauteng',
    postalCode: '2001',
    country: 'South Africa'
  },
  logo: null,
  currency: 'ZAR',
  timezone: 'Africa/Johannesburg',
  language: 'en-ZA'
}

const initialPaymentMethods: PaymentMethod[] = [
  { id: '1', name: 'Cash', type: 'cash', enabled: true },
  { id: '2', name: 'Card (Yoco)', type: 'card', enabled: true, provider: 'Yoco', fee: 2.95 },
  { id: '3', name: 'Card (Paystack)', type: 'card', enabled: false, provider: 'Paystack', fee: 1.5 },
  { id: '4', name: 'Gopay QR', type: 'qr', enabled: true, provider: 'Gopay', fee: 1.25 },
  { id: '5', name: 'Gopay Wallet', type: 'wallet', enabled: true, provider: 'Gopay', fee: 0 },
  { id: '6', name: 'Instant EFT (Ozow)', type: 'eft', enabled: true, provider: 'Ozow', fee: 1.5 },
]

const initialTaxSettings: TaxSettings = {
  vatEnabled: true,
  vatRate: 15,
  vatNumber: '4123456789',
  inclusivePricing: true,
  taxExemptCategories: ['Zero-Rated', 'Exempt']
}

const initialReceiptSettings: ReceiptSettings = {
  showLogo: true,
  showVatNumber: true,
  showAddress: true,
  showPhone: true,
  showEmail: true,
  customMessage: 'Thank you for your business!',
  footerText: 'Visit us again soon!',
  paperSize: '80mm',
  autoPrint: true
}

const initialNotificationSettings: NotificationSettings = {
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  lowStockAlerts: true,
  dailySummary: true,
  weeklyReport: true,
  marketingAlerts: false
}

export function SettingsView() {
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(initialBusinessSettings)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(initialPaymentMethods)
  const [taxSettings, setTaxSettings] = useState<TaxSettings>(initialTaxSettings)
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>(initialReceiptSettings)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(initialNotificationSettings)
  const [activeTab, setActiveTab] = useState('business')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  
  // Save all settings
  const handleSave = async () => {
    setSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }
  
  // Toggle payment method
  const togglePaymentMethod = (id: string) => {
    setPaymentMethods(prev => prev.map(m => 
      m.id === id ? { ...m, enabled: !m.enabled } : m
    ))
  }
  
  // Provinces for South Africa
  const provinces = [
    'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
    'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'
  ]
  
  return (
    <div className="h-full flex flex-col bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
              <Settings className="h-5 w-5 text-[#00897B]" />
              Settings
            </h1>
            <p className="text-sm text-[#757575]">Configure your Merchant OS</p>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <Badge className="bg-green-100 text-green-700">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Settings Saved
              </Badge>
            )}
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]"
              onClick={handleSave}
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
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="bg-white border-b border-gray-200 px-4">
            <TabsList className="h-12 bg-transparent flex-wrap">
              <TabsTrigger value="business" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Store className="h-4 w-4 mr-2" />
                Business
              </TabsTrigger>
              <TabsTrigger value="payments" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <CreditCard className="h-4 w-4 mr-2" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="tax" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Percent className="h-4 w-4 mr-2" />
                Tax & VAT
              </TabsTrigger>
              <TabsTrigger value="receipts" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <FileText className="h-4 w-4 mr-2" />
                Receipts
              </TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Shield className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="data" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Database className="h-4 w-4 mr-2" />
                Data
              </TabsTrigger>
            </TabsList>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-4">
              {/* Business Settings Tab */}
              <TabsContent value="business" className="m-0 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Business Information</CardTitle>
                    <CardDescription>Your business details for receipts and invoices</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Business Name</Label>
                        <Input
                          value={businessSettings.businessName}
                          onChange={(e) => setBusinessSettings(prev => ({ ...prev, businessName: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Trading Name</Label>
                        <Input
                          value={businessSettings.tradingName}
                          onChange={(e) => setBusinessSettings(prev => ({ ...prev, tradingName: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Registration Number</Label>
                        <Input
                          value={businessSettings.registrationNumber}
                          onChange={(e) => setBusinessSettings(prev => ({ ...prev, registrationNumber: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">VAT Number</Label>
                        <Input
                          value={businessSettings.vatNumber}
                          onChange={(e) => setBusinessSettings(prev => ({ ...prev, vatNumber: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Email</Label>
                        <Input
                          type="email"
                          value={businessSettings.email}
                          onChange={(e) => setBusinessSettings(prev => ({ ...prev, email: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Phone</Label>
                        <Input
                          value={businessSettings.phone}
                          onChange={(e) => setBusinessSettings(prev => ({ ...prev, phone: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium">Website</Label>
                        <Input
                          value={businessSettings.website}
                          onChange={(e) => setBusinessSettings(prev => ({ ...prev, website: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Address</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium">Street Address</Label>
                        <Input
                          value={businessSettings.address.street}
                          onChange={(e) => setBusinessSettings(prev => ({ 
                            ...prev, 
                            address: { ...prev.address, street: e.target.value }
                          }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">City</Label>
                        <Input
                          value={businessSettings.address.city}
                          onChange={(e) => setBusinessSettings(prev => ({ 
                            ...prev, 
                            address: { ...prev.address, city: e.target.value }
                          }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Province</Label>
                        <Select 
                          value={businessSettings.address.province}
                          onValueChange={(value) => setBusinessSettings(prev => ({ 
                            ...prev, 
                            address: { ...prev.address, province: value }
                          }))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {provinces.map(province => (
                              <SelectItem key={province} value={province}>{province}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Postal Code</Label>
                        <Input
                          value={businessSettings.address.postalCode}
                          onChange={(e) => setBusinessSettings(prev => ({ 
                            ...prev, 
                            address: { ...prev.address, postalCode: e.target.value }
                          }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Country</Label>
                        <Input
                          value={businessSettings.address.country}
                          disabled
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Regional Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Currency</Label>
                        <Select value={businessSettings.currency} onValueChange={(value) => setBusinessSettings(prev => ({ ...prev, currency: value }))}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                            <SelectItem value="GBP">GBP - British Pound</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Timezone</Label>
                        <Select value={businessSettings.timezone} onValueChange={(value) => setBusinessSettings(prev => ({ ...prev, timezone: value }))}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Africa/Johannesburg">South Africa (SAST)</SelectItem>
                            <SelectItem value="Africa/Lagos">West Africa (WAT)</SelectItem>
                            <SelectItem value="Africa/Nairobi">East Africa (EAT)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Language</Label>
                        <Select value={businessSettings.language} onValueChange={(value) => setBusinessSettings(prev => ({ ...prev, language: value }))}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en-ZA">English (South Africa)</SelectItem>
                            <SelectItem value="af">Afrikaans</SelectItem>
                            <SelectItem value="zu">isiZulu</SelectItem>
                            <SelectItem value="xh">isiXhosa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Payment Methods Tab */}
              <TabsContent value="payments" className="m-0 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Payment Methods</CardTitle>
                    <CardDescription>Enable or disable payment methods for your POS</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {paymentMethods.map(method => (
                      <div key={method.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-[#00897B]/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            method.enabled ? 'bg-[#E0F2F1] text-[#00897B]' : 'bg-gray-100 text-gray-400'
                          }`}>
                            {method.type === 'cash' && <Banknote className="h-5 w-5" />}
                            {method.type === 'card' && <CreditCard className="h-5 w-5" />}
                            {method.type === 'qr' && <QrCode className="h-5 w-5" />}
                            {method.type === 'wallet' && <Wallet className="h-5 w-5" />}
                            {method.type === 'eft' && <Building className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-medium text-[#1A1A1A]">{method.name}</p>
                            <p className="text-xs text-[#757575]">
                              {method.provider && `${method.provider} • `}
                              {method.fee ? `${method.fee}% fee` : 'No fee'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={method.enabled ? 'default' : 'outline'} className={method.enabled ? 'bg-green-100 text-green-700' : ''}>
                            {method.enabled ? 'Active' : 'Inactive'}
                          </Badge>
                          <Switch
                            checked={method.enabled}
                            onCheckedChange={() => togglePaymentMethod(method.id)}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Payment Processors</CardTitle>
                    <CardDescription>Configure your payment processor accounts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {['Yoco', 'Paystack', 'Ozow', 'Gropay'].map((processor) => (
                      <div key={processor} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center">
                            <CreditCard className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-[#1A1A1A]">{processor}</p>
                            <p className="text-xs text-green-600">Connected</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Configure</Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Tax & VAT Tab */}
              <TabsContent value="tax" className="m-0 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">VAT Configuration</CardTitle>
                    <CardDescription>Configure your VAT settings for South Africa</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                      <div>
                        <p className="font-medium text-[#1A1A1A]">Enable VAT</p>
                        <p className="text-xs text-[#757575]">Apply VAT to sales and generate VAT reports</p>
                      </div>
                      <Switch
                        checked={taxSettings.vatEnabled}
                        onCheckedChange={(checked) => setTaxSettings(prev => ({ ...prev, vatEnabled: checked }))}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">VAT Rate (%)</Label>
                        <Input
                          type="number"
                          value={taxSettings.vatRate}
                          onChange={(e) => setTaxSettings(prev => ({ ...prev, vatRate: parseFloat(e.target.value) }))}
                          className="mt-1"
                        />
                        <p className="text-xs text-[#757575] mt-1">Standard rate in South Africa is 15%</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">VAT Number</Label>
                        <Input
                          value={taxSettings.vatNumber}
                          onChange={(e) => setTaxSettings(prev => ({ ...prev, vatNumber: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                      <div>
                        <p className="font-medium text-[#1A1A1A]">Inclusive Pricing</p>
                        <p className="text-xs text-[#757575]">Prices include VAT (recommended for SA)</p>
                      </div>
                      <Switch
                        checked={taxSettings.inclusivePricing}
                        onCheckedChange={(checked) => setTaxSettings(prev => ({ ...prev, inclusivePricing: checked }))}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Tax Categories</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { name: 'Standard Rate (15%)', description: 'Most goods and services', active: true },
                      { name: 'Zero-Rated (0%)', description: 'Basic food items, exports', active: true },
                      { name: 'Exempt', description: 'Financial services, education', active: true },
                    ].map((category, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                        <div>
                          <p className="font-medium text-[#1A1A1A]">{category.name}</p>
                          <p className="text-xs text-[#757575]">{category.description}</p>
                        </div>
                        <Switch checked={category.active} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Receipts Tab */}
              <TabsContent value="receipts" className="m-0 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Receipt Layout</CardTitle>
                    <CardDescription>Customize what appears on receipts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { key: 'showLogo', label: 'Show Logo', icon: Store },
                        { key: 'showVatNumber', label: 'Show VAT Number', icon: FileText },
                        { key: 'showAddress', label: 'Show Address', icon: MapPin },
                        { key: 'showPhone', label: 'Show Phone', icon: Phone },
                        { key: 'showEmail', label: 'Show Email', icon: Mail },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2">
                            <item.icon className="h-4 w-4 text-[#757575]" />
                            <span className="text-sm">{item.label}</span>
                          </div>
                          <Switch
                            checked={receiptSettings[item.key as keyof ReceiptSettings] as boolean}
                            onCheckedChange={(checked) => setReceiptSettings(prev => ({ ...prev, [item.key]: checked }))}
                          />
                        </div>
                      ))}
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <Label className="text-sm font-medium">Custom Message</Label>
                      <Input
                        value={receiptSettings.customMessage}
                        onChange={(e) => setReceiptSettings(prev => ({ ...prev, customMessage: e.target.value }))}
                        className="mt-1"
                        placeholder="Thank you for your business!"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Footer Text</Label>
                      <Input
                        value={receiptSettings.footerText}
                        onChange={(e) => setReceiptSettings(prev => ({ ...prev, footerText: e.target.value }))}
                        className="mt-1"
                        placeholder="Visit us again soon!"
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Printer Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Paper Size</Label>
                        <Select 
                          value={receiptSettings.paperSize}
                          onValueChange={(value: '58mm' | '80mm') => setReceiptSettings(prev => ({ ...prev, paperSize: value }))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="58mm">58mm (Small)</SelectItem>
                            <SelectItem value="80mm">80mm (Standard)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <div className="flex items-center justify-between w-full p-3 rounded-lg border border-gray-200">
                          <span className="text-sm">Auto-print after sale</span>
                          <Switch
                            checked={receiptSettings.autoPrint}
                            onCheckedChange={(checked) => setReceiptSettings(prev => ({ ...prev, autoPrint: checked }))}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Receipt Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-xs mx-auto">
                      <div className="text-center border-b border-dashed border-gray-300 pb-3 mb-3">
                        {receiptSettings.showLogo && (
                          <div className="w-16 h-8 bg-[#00897B] rounded mx-auto mb-2" />
                        )}
                        <h3 className="font-bold text-sm">{businessSettings.tradingName}</h3>
                        {receiptSettings.showAddress && (
                          <p className="text-[10px] text-gray-600">{businessSettings.address.street}</p>
                        )}
                        {receiptSettings.showPhone && (
                          <p className="text-[10px] text-gray-600">{businessSettings.phone}</p>
                        )}
                        {receiptSettings.showVatNumber && (
                          <p className="text-[10px] text-gray-600">VAT: {businessSettings.vatNumber}</p>
                        )}
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Item x1</span>
                          <span>R50.00</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>VAT (15%)</span>
                          <span>R6.52</span>
                        </div>
                        <div className="border-t border-dashed border-gray-300 pt-1 mt-1 flex justify-between font-bold">
                          <span>Total</span>
                          <span>R50.00</span>
                        </div>
                      </div>
                      <div className="text-center mt-3 pt-3 border-t border-dashed border-gray-300">
                        <p className="text-[10px]">{receiptSettings.customMessage}</p>
                        <p className="text-[9px] text-gray-400 mt-1">{receiptSettings.footerText}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Notifications Tab */}
              <TabsContent value="notifications" className="m-0 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Notification Preferences</CardTitle>
                    <CardDescription>Choose how you want to receive alerts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive updates via email' },
                      { key: 'smsNotifications', label: 'SMS Notifications', description: 'Receive alerts via SMS' },
                      { key: 'pushNotifications', label: 'Push Notifications', description: 'Browser and mobile push alerts' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                        <div>
                          <p className="font-medium text-[#1A1A1A]">{item.label}</p>
                          <p className="text-xs text-[#757575]">{item.description}</p>
                        </div>
                        <Switch
                          checked={notificationSettings[item.key as keyof NotificationSettings] as boolean}
                          onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, [item.key]: checked }))}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Alert Types</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { key: 'lowStockAlerts', label: 'Low Stock Alerts', description: 'Get notified when items are running low' },
                      { key: 'dailySummary', label: 'Daily Summary', description: 'End of day sales report' },
                      { key: 'weeklyReport', label: 'Weekly Report', description: 'Weekly performance summary' },
                      { key: 'marketingAlerts', label: 'Marketing Alerts', description: 'Campaign performance updates' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                        <div>
                          <p className="font-medium text-[#1A1A1A]">{item.label}</p>
                          <p className="text-xs text-[#757575]">{item.description}</p>
                        </div>
                        <Switch
                          checked={notificationSettings[item.key as keyof NotificationSettings] as boolean}
                          onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, [item.key]: checked }))}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Security Tab */}
              <TabsContent value="security" className="m-0 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Account Security</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center">
                          <Key className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-[#1A1A1A]">Password</p>
                          <p className="text-xs text-[#757575]">Last changed 30 days ago</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Change</Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center">
                          <Smartphone className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-[#1A1A1A]">Two-Factor Authentication</p>
                          <p className="text-xs text-green-600">Enabled</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Manage</Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Staff Access</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <Info className="h-4 w-4 inline mr-1" />
                        Manage staff permissions and roles in the Staff & HR module
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Data Tab */}
              <TabsContent value="data" className="m-0 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Data Management</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center">
                          <Download className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-[#1A1A1A]">Export Data</p>
                          <p className="text-xs text-[#757575]">Download your business data</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Export</Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center">
                          <Upload className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-[#1A1A1A]">Import Data</p>
                          <p className="text-xs text-[#757575]">Upload products, customers, etc.</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Import</Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center">
                          <Cloud className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-[#1A1A1A]">Cloud Backup</p>
                          <p className="text-xs text-green-600">Last backup: 2 hours ago</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Backup Now</Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-base text-red-600 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Danger Zone
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Warning</AlertTitle>
                      <AlertDescription>
                        These actions are irreversible. Please proceed with caution.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg border border-red-200 bg-red-50">
                      <div>
                        <p className="font-medium text-[#1A1A1A]">Reset All Data</p>
                        <p className="text-xs text-[#757575]">Delete all transactions and reset to initial state</p>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => setResetDialogOpen(true)}>
                        Reset
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </div>
      
      {/* Reset Confirmation Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Reset All Data?</DialogTitle>
            <DialogDescription>
              This will permanently delete all your transactions, inventory data, and settings. 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Reset Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Custom icon components for missing Lucide icons
function Banknote({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="12" x="2" y="6" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  )
}

function QrCode({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="5" height="5" x="3" y="3" rx="1" />
      <rect width="5" height="5" x="16" y="3" rx="1" />
      <rect width="5" height="5" x="3" y="16" rx="1" />
      <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
      <path d="M21 21v.01" />
      <path d="M12 7v3a1 1 0 0 1-1 1h-2" />
      <path d="M12 21v-3a1 1 0 0 1 1-1h3" />
      <path d="M12 12h.01" />
    </svg>
  )
}

function Wallet({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  )
}
