'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  CreditCard,
  Printer,
  Scan,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Settings,
  Power,
  Battery,
  Signal,
  Usb,
  Bluetooth,
  X,
  CheckCircle,
  Loader2,
  Receipt,
  HardDrive,
  Smartphone,
  Tablet,
  QrCode,
  Monitor,
  Radio,
  Zap,
  Shield,
  TouchpadIcon,
  Cpu,
  MemoryStick,
} from 'lucide-react'

// ============================================
// GROPAY DEVICE PORTFOLIO TYPES
// ============================================

interface Device {
  id: string
  name: string
  brand: string
  category: 'smartpos' | 'qr_terminal' | 'tablet' | 'softpos' | 'mobile_reader' | 'desktop' | 'connectivity'
  model: string
  price: number
  currency: 'ZAR' | 'NAD' | 'USD'
  specs: {
    display?: string
    processor?: string
    ram?: string
    storage?: string
    os?: string
    battery?: string
    payment?: string[]
    printer?: string
    camera?: string
    connectivity?: string[]
    security?: string[]
  }
  features: string[]
  targetUse: string[]
  status: 'available' | 'connected' | 'disconnected' | 'busy' | 'error'
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock'
  image?: string
}

// ============================================
// GROPAY DEVICE PORTFOLIO DATA
// Based on Gropay Device Portfolio (October 2025)
// ============================================

const gropayDevices: Device[] = [
  // ==========================================
  // SMARTPOS DEVICES - Premium Payment Terminals
  // ==========================================
  {
    id: 'p8d',
    name: 'Gropay P8D',
    brand: 'Telpo',
    category: 'smartpos',
    model: 'Android SmartPOS',
    price: 3299,
    currency: 'ZAR',
    specs: {
      display: '5.5" HD Touch',
      processor: 'Quad-Core 1.5GHz',
      os: 'Android 11',
      payment: ['EMV L1&L2', 'NFC', 'QR'],
      printer: '58mm Thermal',
      camera: '5MP Auto-focus',
      connectivity: ['WiFi', '4G LTE', 'Bluetooth'],
      security: ['PCI DSS Certified', 'EMV Certified'],
    },
    features: ['All Payment Types', 'Cloud Management', '24/7 Support'],
    targetUse: ['Retail stores', 'Restaurants', 'Service businesses'],
    status: 'available',
    stockStatus: 'in_stock',
  },
  {
    id: 'p9',
    name: 'Gropay P9',
    brand: 'Telpo',
    category: 'smartpos',
    model: 'Premium Android SmartPOS',
    price: 4499,
    currency: 'ZAR',
    specs: {
      display: '6" FHD Touch',
      processor: 'Octa-Core 2.0GHz',
      os: 'Android 12',
      payment: ['EMV L1&L2', 'NFC', 'QR', 'MSR'],
      printer: '58mm High-speed Thermal',
      camera: '8MP + 2MP Dual',
      connectivity: ['WiFi', '4G LTE', 'Bluetooth'],
      security: ['PCI DSS Certified', 'EMV Certified'],
    },
    features: ['All Payment Types', 'Cloud Management', '24/7 Support', 'Barcode Scanner'],
    targetUse: ['High-volume retail', 'Hospitality', 'Franchises'],
    status: 'available',
    stockStatus: 'in_stock',
  },
  {
    id: 'a11',
    name: 'Gropay A11 Smart PIN Pad',
    brand: 'Aisino Vanstone',
    category: 'smartpos',
    model: 'Till-Side Payment Terminal',
    price: 2899,
    currency: 'ZAR',
    specs: {
      display: '3.5" Color Touch',
      processor: 'ARM Cortex-A7',
      os: 'Linux-based',
      payment: ['EMV L1&L2', 'NFC', 'MSR'],
      connectivity: ['USB', 'Bluetooth', 'WiFi'],
      security: ['PCI PTS 5.x', 'EMV Certified'],
    },
    features: ['Till-Side Integration', 'PCI PTS 5.x', 'Compact Design'],
    targetUse: ['Supermarket checkouts', 'Cash register integration'],
    status: 'available',
    stockStatus: 'in_stock',
  },
  {
    id: 'a75pro',
    name: 'Gropay A75 Pro',
    brand: 'Aisino Vanstone',
    category: 'smartpos',
    model: 'Premium Android POS',
    price: 3799,
    currency: 'ZAR',
    specs: {
      display: '5.5" HD IPS Touch',
      processor: 'Quad-Core 1.8GHz',
      os: 'Android 11',
      payment: ['EMV L1&L2', 'NFC', 'QR', 'MSR'],
      printer: '58mm Thermal',
      camera: '5MP + Barcode Scanner',
      connectivity: ['WiFi', '4G LTE', 'Bluetooth'],
      security: ['PCI DSS Certified', 'EMV Certified'],
    },
    features: ['All Payment Types', 'Built-in Scanner', 'Premium Build'],
    targetUse: ['Premium retail', 'Enterprise deployments'],
    status: 'available',
    stockStatus: 'in_stock',
  },

  // ==========================================
  // QR CODE TERMINALS - Dynamic Payment
  // Hemipay Suite for Informal Traders
  // ==========================================
  {
    id: 'y90b',
    name: 'Gropay Y90B',
    brand: 'Hemipay',
    category: 'qr_terminal',
    model: 'Wearable QR Terminal',
    price: 2500,
    currency: 'NAD',
    specs: {
      display: '2.4" LCD',
      payment: ['Dynamic QR', 'NFC'],
      battery: '3000mAh',
      connectivity: ['4G LTE', 'GPRS'],
      security: ['EMV L1&L2'],
    },
    features: ['Wearable Design', 'Neck Strap', 'Voice Prompt', 'IP54 Weatherproof', 'Hands-free Operation'],
    targetUse: ['Street vendors', 'Informal markets', 'Mobile traders', 'Kapana Market', 'Car washes'],
    status: 'available',
    stockStatus: 'in_stock',
  },
  {
    id: 'q161pro',
    name: 'Gropay Q161 Pro',
    brand: 'Hemipay',
    category: 'qr_terminal',
    model: 'Premium QR Terminal',
    price: 4299,
    currency: 'NAD',
    specs: {
      display: '2.4" LCD',
      payment: ['Dynamic QR', 'NFC', 'MSR'],
      battery: '2600mAh',
      connectivity: ['4G LTE', 'GPRS'],
      security: ['EMV L1&L2'],
    },
    features: ['Premium Build', 'All Payment Methods', 'Compact Design'],
    targetUse: ['Retail stores', 'Restaurants', 'Service providers'],
    status: 'available',
    stockStatus: 'in_stock',
  },
  {
    id: 'md718b',
    name: 'Gropay MD718B',
    brand: 'Hemipay',
    category: 'qr_terminal',
    model: 'QR Terminal with Printer',
    price: 3499,
    currency: 'NAD',
    specs: {
      display: '5" Touch',
      payment: ['Dynamic QR'],
      printer: '58mm Thermal',
      battery: '3500mAh',
      connectivity: ['4G LTE', 'GPRS'],
    },
    features: ['Built-in Printer', 'Touch Display', 'Numeric Keypad'],
    targetUse: ['Shops', 'Service providers', 'Small retailers'],
    status: 'available',
    stockStatus: 'in_stock',
  },
  {
    id: 'y68b',
    name: 'Gropay Y68B',
    brand: 'Hemipay',
    category: 'qr_terminal',
    model: 'Compact QR Terminal',
    price: 2599,
    currency: 'NAD',
    specs: {
      display: '4.3" LCD',
      payment: ['Dynamic QR', 'NFC'],
      battery: '2800mAh',
      connectivity: ['4G LTE', 'GPRS'],
    },
    features: ['Compact Design', 'Lightweight', 'Easy Setup'],
    targetUse: ['Airtime vendors', 'Car washes', 'Pubs', 'Shebeens'],
    status: 'available',
    stockStatus: 'in_stock',
  },
  {
    id: 'y80b',
    name: 'Gropay Y80B',
    brand: 'Hemipay',
    category: 'qr_terminal',
    model: 'Street Vendor QR Terminal',
    price: 2899,
    currency: 'NAD',
    specs: {
      display: '5" LCD',
      payment: ['Dynamic QR', 'NFC'],
      battery: '3000mAh',
      connectivity: ['4G LTE', 'GPRS'],
    },
    features: ['Wearable', 'Voice Prompt', 'Weatherproof', 'Neck Strap Included'],
    targetUse: ['Markets', 'Mobile traders', 'Street vendors', 'Informal traders'],
    status: 'available',
    stockStatus: 'in_stock',
  },

  // ==========================================
  // BUSINESS TABLETS - Alldocube Suite
  // Complete POS, ERP & CRM with Embedded Merchant OS
  // ==========================================
  {
    id: 'iplay60minipro',
    name: 'iPlay 60 Mini Pro',
    brand: 'Alldocube',
    category: 'tablet',
    model: 'Business Tablet 8.4"',
    price: 2199,
    currency: 'ZAR',
    specs: {
      display: '8.4" IPS 1920x1200',
      processor: 'Helio G99 8-Core',
      ram: '8GB',
      storage: '128GB',
      os: 'Android 14',
      battery: '5500mAh',
      connectivity: ['WiFi 6', '4G LTE'],
    },
    features: ['Merchant OS Optimized', 'POS Ready', 'ERP Ready', 'CRM Ready'],
    targetUse: ['Field sales', 'Mobile workers', 'Delivery & logistics', 'Inventory scanning'],
    status: 'available',
    stockStatus: 'in_stock',
  },
  {
    id: 'iplay60pro',
    name: 'iPlay 60 Pro',
    brand: 'Alldocube',
    category: 'tablet',
    model: 'Business Tablet 10.95"',
    price: 2399,
    currency: 'ZAR',
    specs: {
      display: '10.95" IPS 1920x1200 90Hz',
      processor: 'MediaTek G99 8-Core',
      ram: '6GB',
      storage: '128GB UFS',
      os: 'Android 14',
      battery: '7000mAh',
      connectivity: ['WiFi 6', '4G LTE'],
    },
    features: ['Merchant OS Optimized', 'POS Ready', 'ERP Ready', 'CRM Ready'],
    targetUse: ['Restaurant POS', 'Retail checkout', 'Small business management'],
    status: 'available',
    stockStatus: 'in_stock',
  },
  {
    id: 'iplay60padpro',
    name: 'iPlay 60 Pad Pro',
    brand: 'Alldocube',
    category: 'tablet',
    model: 'Business Tablet 12.1"',
    price: 2699,
    currency: 'ZAR',
    specs: {
      display: '12.1" IPS 2560x1600 90Hz',
      processor: 'MediaTek G99 8-Core',
      ram: '8GB',
      storage: '128GB UFS',
      os: 'Android 14',
      battery: '8000mAh',
      connectivity: ['WiFi 6', '4G LTE'],
    },
    features: ['Merchant OS Optimized', 'Full ERP', 'Full CRM', 'Multi-location Support'],
    targetUse: ['Enterprise POS', 'Multi-location management', 'Full ERP & CRM solutions'],
    status: 'available',
    stockStatus: 'in_stock',
  },

  // ==========================================
  // DESKTOP TERMINALS - Retail Fixed POS
  // ==========================================
  {
    id: 'c8',
    name: 'Gropay C8',
    brand: 'Telpo',
    category: 'desktop',
    model: 'Desktop POS Terminal',
    price: 2899,
    currency: 'ZAR',
    specs: {
      display: '6.5" HD Touch',
      processor: 'Octa-Core 2.0GHz',
      ram: '4GB',
      storage: '64GB',
      os: 'Android 13',
      payment: ['EMV L1&L2', 'NFC', 'QR'],
      printer: '58mm Thermal',
      connectivity: ['WiFi', '4G LTE', 'Ethernet'],
    },
    features: ['PCI DSS Certified', 'All Payment Methods', 'Cloud & Local'],
    targetUse: ['Retail counters', 'Supermarkets', 'Service centers'],
    status: 'available',
    stockStatus: 'in_stock',
  },
  {
    id: 'tabpay',
    name: 'Gropay Tab/Pay',
    brand: 'Alldocube',
    category: 'desktop',
    model: '12.1" Tablet POS',
    price: 2699,
    currency: 'ZAR',
    specs: {
      display: '12.1" IPS 2560x1600 90Hz',
      processor: 'MediaTek G99 8-Core',
      ram: '8GB',
      storage: '128GB',
      os: 'Android 14',
      battery: '8000mAh',
      payment: ['EMV L1&L2', 'NFC', 'QR'],
      connectivity: ['WiFi 6', '4G LTE'],
    },
    features: ['Merchant OS POS/ERP/CRM', 'Mobile POS', 'All Payment Methods'],
    targetUse: ['Mobile POS', 'Restaurants', 'Multi-location management'],
    status: 'available',
    stockStatus: 'in_stock',
  },

  // ==========================================
  // SOFTPOS - Smartphone Payment
  // Zero Hardware Investment
  // ==========================================
  {
    id: 'softpos',
    name: 'Gropay SoftPOS',
    brand: 'Gropay',
    category: 'softpos',
    model: 'Tap to Pay',
    price: 0,
    currency: 'ZAR',
    specs: {
      os: 'iOS 14+ / Android 8.0+ with NFC',
      payment: ['Visa', 'Mastercard', 'Amex', 'UnionPay', 'Apple Pay', 'Google Pay', 'Samsung Pay'],
      security: ['PCI DSS Certified', 'End-to-End Encryption'],
    },
    features: ['Zero Hardware', 'Tap to Pay', '5-minute Setup', 'Real-time Analytics', '2.75% + R1.50 per transaction'],
    targetUse: ['Street vendors', 'Service providers', 'Delivery drivers', 'Pop-up businesses', 'Home businesses'],
    status: 'available',
    stockStatus: 'in_stock',
  },

  // ==========================================
  // MOBILE CARD READERS
  // ==========================================
  {
    id: 'af60s',
    name: 'AF60S mPOS',
    brand: 'AFI',
    category: 'mobile_reader',
    model: 'Mobile Payment Terminal',
    price: 1299,
    currency: 'ZAR',
    specs: {
      processor: '32-bit High Performance Security CPU',
      payment: ['IC Card', 'NFC 13.56MHz', 'Magnetic Card Track 1/2/3'],
      connectivity: ['Bluetooth 4.0-5.0', 'Micro-USB'],
      battery: '1500mAh Li-battery',
      security: ['EMV', 'PBOC', 'PCI', 'UnionPay PIN Input'],
    },
    features: ['EMV/PBOC/PCI Certified', 'PIN Input', 'Long Standby', 'Lightweight'],
    targetUse: ['Mobile merchants', 'Delivery services', 'Field sales'],
    status: 'available',
    stockStatus: 'in_stock',
  },

  // ==========================================
  // CONNECTIVITY SOLUTIONS
  // ==========================================
  {
    id: 'wavlink',
    name: 'Wavlink WL-WN572HE4',
    brand: 'Wavlink',
    category: 'connectivity',
    model: 'AC1200 WiFi Booster & 4G LTE Router',
    price: 2499,
    currency: 'ZAR',
    specs: {
      connectivity: ['4G LTE', 'WiFi AC1200'],
      battery: 'N/A (PoE supported)',
    },
    features: ['100 Concurrent Users', '4G LTE Backup', '300m Coverage', 'IP65 Weatherproof', 'PoE Support'],
    targetUse: ['Bars & Shebeens', 'Markets', 'Restaurants', 'Craft markets', 'Car washes'],
    status: 'available',
    stockStatus: 'in_stock',
  },
]

// Payment simulation state
interface Transaction {
  id: string
  amount: number
  status: 'pending' | 'processing' | 'approved' | 'declined' | 'cancelled'
  cardType?: string
  lastFour?: string
  timestamp: string
  reference?: string
}

// Sample connected devices for demo
const sampleConnectedDevices = [
  { ...gropayDevices.find(d => d.id === 'p9')!, status: 'connected' as const },
  { ...gropayDevices.find(d => d.id === 'y90b')!, status: 'connected' as const },
  { ...gropayDevices.find(d => d.id === 'af60s')!, status: 'connected' as const },
]

export function HardwareIntegration() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [connectedDevices, setConnectedDevices] = useState<Device[]>(sampleConnectedDevices)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [deviceDetailOpen, setDeviceDetailOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null)
  const [paymentStep, setPaymentStep] = useState<'idle' | 'initiating' | 'waiting_card' | 'processing' | 'pin' | 'approved' | 'declined'>('idle')

  // Filter devices
  const filteredDevices = selectedCategory === 'all' 
    ? gropayDevices 
    : gropayDevices.filter(d => d.category === selectedCategory)

  // Get category label
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      smartpos: 'SmartPOS',
      qr_terminal: 'QR Terminals',
      tablet: 'Business Tablets',
      softpos: 'SoftPOS',
      mobile_reader: 'Mobile Readers',
      desktop: 'Desktop POS',
      connectivity: 'Connectivity',
    }
    return labels[category] || category
  }

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'smartpos': return <CreditCard className="h-4 w-4" />
      case 'qr_terminal': return <QrCode className="h-4 w-4" />
      case 'tablet': return <Tablet className="h-4 w-4" />
      case 'softpos': return <Smartphone className="h-4 w-4" />
      case 'mobile_reader': return <Scan className="h-4 w-4" />
      case 'desktop': return <Monitor className="h-4 w-4" />
      case 'connectivity': return <Wifi className="h-4 w-4" />
      default: return <HardDrive className="h-4 w-4" />
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'available':
      case 'approved':
      case 'in_stock':
        return 'bg-green-100 text-green-700'
      case 'busy':
      case 'processing':
      case 'waiting_card':
      case 'pin':
        return 'bg-blue-100 text-blue-700'
      case 'disconnected':
      case 'error':
      case 'declined':
      case 'out_of_stock':
        return 'bg-red-100 text-red-700'
      case 'low_stock':
        return 'bg-amber-100 text-amber-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  // Handle payment simulation
  const handleInitiatePayment = () => {
    if (paymentAmount <= 0) return
    
    const terminal = connectedDevices.find(d => d.category === 'smartpos' && d.status === 'connected')
    if (!terminal) {
      alert('No connected SmartPOS terminal available')
      return
    }
    
    setPaymentStep('initiating')
    setCurrentTransaction({
      id: `txn_${Date.now()}`,
      amount: paymentAmount,
      status: 'pending',
      timestamp: new Date().toISOString(),
    })
    
    // Simulate payment flow
    setTimeout(() => {
      setPaymentStep('waiting_card')
      setTimeout(() => {
        setPaymentStep('processing')
        setTimeout(() => {
          setPaymentStep('pin')
          setTimeout(() => {
            const success = Math.random() > 0.1
            if (success) {
              setPaymentStep('approved')
              setCurrentTransaction(prev => prev ? {
                ...prev,
                status: 'approved',
                cardType: 'Visa',
                lastFour: '4242',
                reference: `REF${Date.now().toString().slice(-8)}`,
              } : null)
            } else {
              setPaymentStep('declined')
              setCurrentTransaction(prev => prev ? { ...prev, status: 'declined' } : null)
            }
          }, 2000)
        }, 1500)
      }, 1000)
    }, 500)
  }

  // Handle connect device
  const handleConnectDevice = (device: Device) => {
    if (connectedDevices.find(d => d.id === device.id)) {
      // Disconnect
      setConnectedDevices(prev => prev.filter(d => d.id !== device.id))
    } else {
      // Connect
      setConnectedDevices(prev => [...prev, { ...device, status: 'connected' }])
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#1A1A1A] flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-[#00897B]" />
              Hardware Integration
            </h1>
            <p className="text-sm text-[#757575]">Gropay Device Portfolio - SmartPOS, QR Terminals, Tablets, SoftPOS</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => {
              setConnectedDevices(sampleConnectedDevices)
            }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setPaymentDialogOpen(true)}>
              <CreditCard className="h-4 w-4 mr-2" />
              Process Payment
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 p-6 bg-gray-50 border-b border-gray-200">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#1A1A1A]">{connectedDevices.filter(d => d.status === 'connected').length}</p>
                <p className="text-xs text-[#757575]">Connected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#00897B]/10 text-[#00897B] flex items-center justify-center">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#1A1A1A]">{gropayDevices.filter(d => d.category === 'smartpos').length}</p>
                <p className="text-xs text-[#757575]">SmartPOS</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <QrCode className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#1A1A1A]">{gropayDevices.filter(d => d.category === 'qr_terminal').length}</p>
                <p className="text-xs text-[#757575]">QR Terminals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                <Tablet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#1A1A1A]">{gropayDevices.filter(d => d.category === 'tablet').length}</p>
                <p className="text-xs text-[#757575]">Tablets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                <Wifi className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#1A1A1A]">Online</p>
                <p className="text-xs text-[#757575]">System Status</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Tabs */}
      <div className="px-6 pt-4 bg-white">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            className={selectedCategory === 'all' ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}
            onClick={() => setSelectedCategory('all')}
          >
            All Devices ({gropayDevices.length})
          </Button>
          {['smartpos', 'qr_terminal', 'tablet', 'desktop', 'softpos', 'mobile_reader', 'connectivity'].map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              className={selectedCategory === cat ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}
              onClick={() => setSelectedCategory(cat)}
            >
              {getCategoryIcon(cat)}
              <span className="ml-1">{getCategoryLabel(cat)}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Device Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDevices.map(device => {
            const isConnected = connectedDevices.find(d => d.id === device.id)
            return (
              <Card 
                key={device.id}
                className={`cursor-pointer hover:border-[#00897B] hover:shadow-md transition-all ${isConnected ? 'border-green-300 bg-green-50/50' : ''}`}
                onClick={() => {
                  setSelectedDevice(device)
                  setDeviceDetailOpen(true)
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg ${isConnected ? 'bg-green-100 text-green-600' : 'bg-[#E0F2F1] text-[#00897B]'} flex items-center justify-center`}>
                        {getCategoryIcon(device.category)}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-[#1A1A1A]">{device.name}</p>
                        <p className="text-xs text-[#757575]">{device.brand}</p>
                      </div>
                    </div>
                    {device.price === 0 ? (
                      <Badge className="bg-purple-100 text-purple-700">Free</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-700">
                        {device.currency === 'ZAR' ? 'R' : device.currency === 'NAD' ? 'N$' : '$'}{device.price.toLocaleString()}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-xs text-[#757575] mb-2">{device.model}</p>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {device.specs.payment?.slice(0, 3).map(p => (
                      <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>
                    ))}
                  </div>
                  
                  <div className="space-y-1 text-xs text-[#757575]">
                    {device.specs.display && (
                      <div className="flex items-center gap-1">
                        <Monitor className="h-3 w-3" />
                        <span>{device.specs.display}</span>
                      </div>
                    )}
                    {device.specs.battery && (
                      <div className="flex items-center gap-1">
                        <Battery className="h-3 w-3" />
                        <span>{device.specs.battery}</span>
                      </div>
                    )}
                  </div>
                  
                  <Separator className="my-3" />
                  
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(device.stockStatus)}>
                      {device.stockStatus.replace('_', ' ')}
                    </Badge>
                    <Button 
                      size="sm" 
                      variant={isConnected ? 'default' : 'outline'}
                      className={isConnected ? 'bg-green-600 hover:bg-green-700' : ''}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleConnectDevice(device)
                      }}
                    >
                      {isConnected ? 'Connected' : 'Connect'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Device Detail Dialog */}
      <Dialog open={deviceDetailOpen} onOpenChange={setDeviceDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          {selectedDevice && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center">
                    {getCategoryIcon(selectedDevice.category)}
                  </div>
                  {selectedDevice.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedDevice.brand} • {selectedDevice.model}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Price */}
                <div className="flex items-center justify-between p-4 bg-[#E0F2F1] rounded-lg">
                  <span className="text-[#757575]">Price</span>
                  <span className="text-2xl font-bold text-[#00897B]">
                    {selectedDevice.price === 0 ? 'Free' : `${selectedDevice.currency === 'ZAR' ? 'R' : selectedDevice.currency === 'NAD' ? 'N$' : '$'}${selectedDevice.price.toLocaleString()}`}
                  </span>
                </div>
                
                {/* Specs Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {selectedDevice.specs.display && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-[#757575] mb-1">Display</p>
                      <p className="text-sm font-medium text-[#1A1A1A]">{selectedDevice.specs.display}</p>
                    </div>
                  )}
                  {selectedDevice.specs.processor && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-[#757575] mb-1">Processor</p>
                      <p className="text-sm font-medium text-[#1A1A1A]">{selectedDevice.specs.processor}</p>
                    </div>
                  )}
                  {selectedDevice.specs.ram && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-[#757575] mb-1">RAM</p>
                      <p className="text-sm font-medium text-[#1A1A1A]">{selectedDevice.specs.ram}</p>
                    </div>
                  )}
                  {selectedDevice.specs.os && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-[#757575] mb-1">OS</p>
                      <p className="text-sm font-medium text-[#1A1A1A]">{selectedDevice.specs.os}</p>
                    </div>
                  )}
                  {selectedDevice.specs.battery && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-[#757575] mb-1">Battery</p>
                      <p className="text-sm font-medium text-[#1A1A1A]">{selectedDevice.specs.battery}</p>
                    </div>
                  )}
                  {selectedDevice.specs.printer && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-[#757575] mb-1">Printer</p>
                      <p className="text-sm font-medium text-[#1A1A1A]">{selectedDevice.specs.printer}</p>
                    </div>
                  )}
                </div>
                
                {/* Payment Methods */}
                {selectedDevice.specs.payment && (
                  <div>
                    <p className="text-xs text-[#757575] mb-2">Payment Methods</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedDevice.specs.payment.map(p => (
                        <Badge key={p} variant="outline">{p}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Security */}
                {selectedDevice.specs.security && (
                  <div>
                    <p className="text-xs text-[#757575] mb-2">Security</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedDevice.specs.security.map(s => (
                        <Badge key={s} className="bg-green-100 text-green-700">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Features */}
                <div>
                  <p className="text-xs text-[#757575] mb-2">Key Features</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedDevice.features.map(f => (
                      <Badge key={f} className="bg-[#00897B]/10 text-[#00897B]">{f}</Badge>
                    ))}
                  </div>
                </div>
                
                {/* Target Use */}
                <div>
                  <p className="text-xs text-[#757575] mb-2">Best For</p>
                  <p className="text-sm text-[#1A1A1A]">{selectedDevice.targetUse.join(' • ')}</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeviceDetailOpen(false)}>Close</Button>
                <Button 
                  className="bg-[#00897B] hover:bg-[#00695C]"
                  onClick={() => {
                    handleConnectDevice(selectedDevice)
                    setDeviceDetailOpen(false)
                  }}
                >
                  {connectedDevices.find(d => d.id === selectedDevice.id) ? 'Disconnect' : 'Connect Device'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#00897B]" />
              Process Card Payment
            </DialogTitle>
            <DialogDescription>
              Use connected SmartPOS terminal to accept payment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {paymentStep === 'idle' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#1A1A1A] mb-2 block">Amount (ZAR)</label>
                  <Input
                    type="number"
                    value={paymentAmount || ''}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="text-2xl font-bold text-center"
                  />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[50, 100, 200, 500].map(amount => (
                    <Button
                      key={amount}
                      variant="outline"
                      onClick={() => setPaymentAmount(amount)}
                    >
                      R{amount}
                    </Button>
                  ))}
                </div>
                
                <Separator />
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-[#757575] mb-2">Available Terminals</p>
                  {connectedDevices.filter(d => d.category === 'smartpos').map(d => (
                    <div key={d.id} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {paymentStep !== 'idle' && (
              <div className="text-center py-8">
                <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  paymentStep === 'approved' ? 'bg-green-100' :
                  paymentStep === 'declined' ? 'bg-red-100' :
                  'bg-blue-100'
                }`}>
                  {paymentStep === 'approved' ? (
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  ) : paymentStep === 'declined' ? (
                    <AlertCircle className="h-10 w-10 text-red-600" />
                  ) : (
                    <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                  )}
                </div>
                
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">
                  {paymentStep === 'initiating' && 'Initiating Payment...'}
                  {paymentStep === 'waiting_card' && 'Present Card'}
                  {paymentStep === 'processing' && 'Processing...'}
                  {paymentStep === 'pin' && 'Enter PIN on Device'}
                  {paymentStep === 'approved' && 'Payment Approved!'}
                  {paymentStep === 'declined' && 'Payment Declined'}
                </h3>
                
                <p className="text-[#757575]">
                  R{currentTransaction?.amount.toFixed(2)}
                </p>
                
                {currentTransaction?.lastFour && (
                  <p className="text-sm text-[#757575] mt-2">
                    Card ending in ****{currentTransaction.lastFour}
                  </p>
                )}
                
                {currentTransaction?.reference && (
                  <p className="text-xs text-gray-400 mt-1">
                    Ref: {currentTransaction.reference}
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            {paymentStep === 'idle' && (
              <>
                <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
                <Button 
                  className="bg-[#00897B] hover:bg-[#00695C]"
                  disabled={paymentAmount <= 0 || !connectedDevices.find(d => d.category === 'smartpos')}
                  onClick={handleInitiatePayment}
                >
                  Process Payment
                </Button>
              </>
            )}
            {(paymentStep === 'approved' || paymentStep === 'declined') && (
              <Button 
                className="w-full bg-[#00897B] hover:bg-[#00695C]"
                onClick={() => {
                  setPaymentDialogOpen(false)
                  setPaymentStep('idle')
                  setCurrentTransaction(null)
                  setPaymentAmount(0)
                }}
              >
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default HardwareIntegration
