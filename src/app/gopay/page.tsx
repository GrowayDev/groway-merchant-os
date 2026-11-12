'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Smartphone, CreditCard, QrCode, Shield, Zap, Users, ArrowRight,
  CheckCircle, Star, Globe, Truck, Store, Building2, Wifi,
  ChevronRight, Menu, X, Phone, Mail, MapPin, Clock, TrendingUp,
  DollarSign, Package, BarChart3, Headphones, Lock, RefreshCw,
  Calculator, PiggyBank, Wallet, Send, Receive, Nfc
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

const devices = [
  {
    category: 'QR Code Terminals',
    icon: QrCode,
    description: 'Perfect for informal traders and mobile merchants',
    products: [
      { name: 'Gropay Y90B', price: 'R 799', features: ['5" Display', 'Dynamic QR', 'NFC Payment', 'Voice Prompt', 'IP54 Weatherproof'], target: 'Street vendors, markets' },
      { name: 'Gropay Q161 Pro', price: 'R 1,399', features: ['2.4" LCD', 'Dynamic QR', 'NFC + MSR', 'EMV L1&L2', 'Portable'], target: 'Retail, restaurants' },
      { name: 'Gropay MD718B', price: 'R 1,599', features: ['5" Touch', '58mm Printer', 'Dynamic QR', 'Numeric Keypad'], target: 'Shops, services' },
    ]
  },
  {
    category: 'SmartPOS Devices',
    icon: CreditCard,
    description: 'Premium payment terminals for established businesses',
    products: [
      { name: 'Gropay P8D', price: 'R 3,299', features: ['5.5" HD Touch', 'Android 11', 'EMV L1&L2', 'NFC + QR', '58mm Printer', '5MP Camera'], target: 'Retail, restaurants' },
      { name: 'Gropay P9', price: 'R 4,499', features: ['6" FHD Touch', 'Android 12', 'Octa-Core 2.0GHz', 'NFC + QR + MSR', 'Dual Camera'], target: 'High-volume retail' },
      { name: 'Gropay A75 Pro', price: 'R 3,799', features: ['5.5" HD IPS', 'Android 11', 'Barcode Scanner', 'NFC + QR', 'Premium build'], target: 'Enterprise retail' },
    ]
  },
  {
    category: 'Business Tablets',
    icon: Smartphone,
    description: 'Complete POS, ERP & CRM with VasyERP integration',
    products: [
      { name: 'Alldocube iPlay 60 Mini Pro', price: 'R 2,199', features: ['8.4" IPS', '8GB RAM', 'Android 14', '4G LTE', '5500mAh'], target: 'Field sales, delivery' },
      { name: 'Alldocube iPlay 60 Pro', price: 'R 2,399', features: ['10.95" IPS', '6GB RAM', '90Hz', '4G LTE', '7000mAh'], target: 'Restaurant POS' },
      { name: 'Alldocube iPlay 60 Pad Pro', price: 'R 2,699', features: ['12.1" IPS', '8GB RAM', '2560x1600', '4G LTE', '8000mAh'], target: 'Enterprise POS' },
    ]
  },
  {
    category: 'SoftPOS',
    icon: Nfc,
    description: 'Turn any NFC smartphone into a payment terminal',
    products: [
      { name: 'Gropay SoftPOS App', price: 'FREE', features: ['Zero Hardware', 'iOS & Android', 'Tap to Pay', 'PCI DSS Certified', 'Instant Setup'], target: 'Micro merchants' },
    ]
  },
]

const lendingFeatures = [
  { title: 'Instant Working Capital', description: 'Get up to R500,000 in minutes based on your transaction history', icon: Zap },
  { title: 'Flexible Repayment', description: 'Repay as a small % of daily sales - no fixed monthly amounts', icon: RefreshCw },
  { title: 'BNPL for Customers', description: 'Offer buy-now-pay-later to increase your sales by 30%', icon: ShoppingCart },
  { title: 'Equipment Finance', description: 'Finance your Gropay devices with 0% deposit', icon: Package },
  { title: 'Inventory Funding', description: 'Stock up before peak seasons with inventory loans', icon: Package },
  { title: 'Growth Loans', description: 'Expand your business with affordable term loans', icon: TrendingUp },
]

const marketStats = [
  { country: 'South Africa', flag: '🇿🇦', population: '60M', mobilePenetration: '85%', gdp: 'R6.4T', informalEconomy: '45%' },
  { country: 'Namibia', flag: '🇳🇦', population: '2.6M', mobilePenetration: '120%', gdp: 'NAD 195B', informalEconomy: '55%' },
  { country: 'Angola', flag: '🇦🇴', population: '35M', mobilePenetration: '55%', gdp: '$92B', informalEconomy: '70%' },
]

const faqs = [
  { q: 'How quickly can I start accepting payments?', a: 'With SoftPOS, you can start within 5 minutes. For hardware devices, delivery takes 2-5 business days.' },
  { q: 'What payment types do Gropay devices support?', a: 'All devices support cards (Visa, Mastercard, Amex), NFC tap, QR codes, and mobile money. Premium devices also support magnetic stripe.' },
  { q: 'Is there a monthly fee?', a: 'No monthly fees for SoftPOS or QR terminals. SmartPOS devices have optional cloud management at R99/month.' },
  { q: 'How do I qualify for lending?', a: 'After 3 months of active transactions, you automatically qualify for working capital. BNPL requires NCA compliance.' },
  { q: 'What is the transaction success rate?', a: '99.7% success rate with average transaction time under 5 seconds.' },
]

export default function GopayPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDeviceTab, setActiveDeviceTab] = useState('QR Code Terminals')

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <img src="/groway-logo.png" alt="Groway" className="h-8 w-auto" />
              </Link>
              <div className="hidden sm:flex items-center gap-1 bg-gradient-to-r from-[#00897B] to-[#4CAF50] text-white px-3 py-1 rounded-full text-sm font-medium">
                <Nfc className="h-3.5 w-3.5" />
                Gopay
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <a href="#devices" className="text-sm text-[#757575] hover:text-[#00897B] transition-colors">Devices</a>
              <a href="#lending" className="text-sm text-[#757575] hover:text-[#00897B] transition-colors">Lending</a>
              <a href="#markets" className="text-sm text-[#757575] hover:text-[#00897B] transition-colors">Markets</a>
              <a href="#pricing" className="text-sm text-[#757575] hover:text-[#00897B] transition-colors">Pricing</a>
              <Link href="/gopay/portal">
                <Button className="bg-[#00897B] hover:bg-[#00695C] text-white">
                  Merchant Portal
                </Button>
              </Link>
            </div>

            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4 space-y-3">
            <a href="#devices" className="block text-sm text-[#757575] hover:text-[#00897B]" onClick={() => setMobileMenuOpen(false)}>Devices</a>
            <a href="#lending" className="block text-sm text-[#757575] hover:text-[#00897B]" onClick={() => setMobileMenuOpen(false)}>Lending</a>
            <a href="#markets" className="block text-sm text-[#757575] hover:text-[#00897B]" onClick={() => setMobileMenuOpen(false)}>Markets</a>
            <a href="#pricing" className="block text-sm text-[#757575] hover:text-[#00897B]" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <Link href="/gopay/portal" className="block">
              <Button className="w-full bg-[#00897B] hover:bg-[#00695C] text-white">Merchant Portal</Button>
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 lg:pt-32 lg:pb-24 bg-gradient-to-br from-[#E0F2F1] via-white to-[#E8F5E9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-[#E0F2F1] text-[#00897B] border-[#B2DFDB] mb-4">
                Transforming Financial Access Across Africa
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold text-[#1A1A1A] leading-tight mb-6">
                Payment Devices & <br />
                <span className="text-[#00897B]">Lending Solutions</span>
              </h1>
              <p className="text-lg text-[#757575] mb-8 leading-relaxed">
                From wearable QR terminals for informal traders to premium SmartPOS for retail chains. 
                Plus instant working capital to grow your business. Gopay empowers every merchant across Southern Africa.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/gopay/portal">
                  <Button size="lg" className="w-full sm:w-auto bg-[#00897B] hover:bg-[#00695C] text-white px-8">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-[#00897B] text-[#00897B] hover:bg-[#E0F2F1]">
                  Compare Devices
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-2xl font-bold text-[#00897B]">99.7%</p>
                  <p className="text-xs text-[#757575]">Success Rate</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-2xl font-bold text-[#00897B]">&lt;5s</p>
                  <p className="text-xs text-[#757575]">Transaction Time</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-2xl font-bold text-[#00897B]">R799</p>
                  <p className="text-xs text-[#757575]">Starting Price</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-[#00897B] to-[#00695C] rounded-3xl p-8 text-white">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                    <QrCode className="h-8 w-8 mb-2" />
                    <p className="font-semibold">QR Terminals</p>
                    <p className="text-sm opacity-80">From R799</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                    <CreditCard className="h-8 w-8 mb-2" />
                    <p className="font-semibold">SmartPOS</p>
                    <p className="text-sm opacity-80">From R3,299</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                    <Smartphone className="h-8 w-8 mb-2" />
                    <p className="font-semibold">SoftPOS</p>
                    <p className="text-sm opacity-80">FREE App</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                    <PiggyBank className="h-8 w-8 mb-2" />
                    <p className="font-semibold">Lending</p>
                    <p className="text-sm opacity-80">Up to R500K</p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm opacity-80">Today's Sales</span>
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <p className="text-3xl font-bold">R 24,850</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-green-400/20 text-green-100">+23%</Badge>
                    <span className="text-xs opacity-70">vs yesterday</span>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">Instant Settlement</p>
                  <p className="text-xs text-[#757575]">Funds in seconds</p>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-[#E0F2F1] rounded-full flex items-center justify-center">
                  <Shield className="h-5 w-5 text-[#00897B]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">PCI DSS L1</p>
                  <p className="text-xs text-[#757575]">Bank-grade security</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="py-8 bg-[#00897B] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl lg:text-4xl font-bold">50+</p>
              <p className="text-sm opacity-80">Device Models</p>
            </div>
            <div>
              <p className="text-3xl lg:text-4xl font-bold">3</p>
              <p className="text-sm opacity-80">Countries</p>
            </div>
            <div>
              <p className="text-3xl lg:text-4xl font-bold">30-40%</p>
              <p className="text-sm opacity-80">Below Competitors</p>
            </div>
            <div>
              <p className="text-3xl lg:text-4xl font-bold">R500K</p>
              <p className="text-sm opacity-80">Max Lending</p>
            </div>
          </div>
        </div>
      </section>

      {/* Device Portfolio */}
      <section id="devices" className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="bg-[#E0F2F1] text-[#00897B] mb-4">Device Portfolio</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#1A1A1A] mb-4">
              Payment Solutions for Every Business
            </h2>
            <p className="text-lg text-[#757575] max-w-2xl mx-auto">
              From street vendors in Kapana Market to high-volume retail chains, 
              we have the perfect device for your payment needs.
            </p>
          </div>

          <Tabs value={activeDeviceTab} onValueChange={setActiveDeviceTab} className="w-full">
            <TabsList className="flex flex-wrap justify-center gap-2 bg-transparent mb-8">
              {devices.map((category) => (
                <TabsTrigger 
                  key={category.category} 
                  value={category.category}
                  className="data-[state=active]:bg-[#00897B] data-[state=active]:text-white"
                >
                  <category.icon className="h-4 w-4 mr-2" />
                  {category.category}
                </TabsTrigger>
              ))}
            </TabsList>

            {devices.map((category) => (
              <TabsContent key={category.category} value={category.category}>
                <p className="text-center text-[#757575] mb-8">{category.description}</p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.products.map((product, idx) => (
                    <Card key={idx} className="border border-gray-200 hover:border-[#00897B]/30 hover:shadow-lg transition-all">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{product.name}</CardTitle>
                          <Badge className="bg-[#E0F2F1] text-[#00897B]">{product.price}</Badge>
                        </div>
                        <CardDescription>Best for: {product.target}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {product.features.map((feature, fidx) => (
                            <li key={fidx} className="flex items-center gap-2 text-sm text-[#757575]">
                              <CheckCircle className="h-4 w-4 text-[#00897B] flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <Button className="w-full mt-4 bg-[#00897B] hover:bg-[#00695C] text-white">
                          Get This Device
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Lending Section */}
      <section id="lending" className="py-16 lg:py-24 bg-gradient-to-br from-[#FFF8E1] to-[#FFECB3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-[#FFA000] text-white mb-4">
                <PiggyBank className="h-3.5 w-3.5 mr-1" />
                Gopay Lending
              </Badge>
              <h2 className="text-3xl lg:text-4xl font-bold text-[#1A1A1A] mb-6">
                Grow Your Business with <span className="text-[#FF8F00]">Instant Capital</span>
              </h2>
              <p className="text-lg text-[#757575] mb-8">
                Already processing payments with Gopay? You automatically qualify for working capital. 
                No paperwork, no waiting - just instant funding based on your transaction history.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FF8F00]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="h-5 w-5 text-[#FF8F00]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1A1A1A]">Up to R500,000 Instant</p>
                    <p className="text-sm text-[#757575]">Get approved in minutes, funds in your account within 24 hours</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FF8F00]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <RefreshCw className="h-5 w-5 text-[#FF8F00]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1A1A1A]">Flexible Repayment</p>
                    <p className="text-sm text-[#757575]">Repay as a small percentage of daily sales - no fixed monthly payments</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FF8F00]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-5 w-5 text-[#FF8F00]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1A1A1A]">Build Credit Score</p>
                    <p className="text-sm text-[#757575]">Good repayment history unlocks higher limits and lower rates</p>
                  </div>
                </div>
              </div>

              <Link href="/gopay/portal">
                <Button size="lg" className="bg-[#FF8F00] hover:bg-[#F57C00] text-white">
                  Check Your Eligibility
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {lendingFeatures.map((feature, idx) => (
                <Card key={idx} className="border border-amber-200 bg-white/80 backdrop-blur">
                  <CardContent className="p-4">
                    <feature.icon className="h-8 w-8 text-[#FF8F00] mb-3" />
                    <h3 className="font-semibold text-[#1A1A1A] mb-1">{feature.title}</h3>
                    <p className="text-xs text-[#757575]">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Markets Section */}
      <section id="markets" className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="bg-[#E0F2F1] text-[#00897B] mb-4">Our Markets</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#1A1A1A] mb-4">
              Building Financial Infrastructure Across Southern Africa
            </h2>
            <p className="text-lg text-[#757575] max-w-2xl mx-auto">
              We understand African markets because we operate in them. Our devices are designed for the 
              realities of informal traders, border commerce, and emerging retail environments.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {marketStats.map((market, idx) => (
              <Card key={idx} className="border border-gray-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{market.flag}</span>
                    <div>
                      <CardTitle>{market.country}</CardTitle>
                      <CardDescription>Population: {market.population}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#757575]">Mobile Penetration</span>
                      <Badge className="bg-[#E0F2F1] text-[#00897B]">{market.mobilePenetration}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#757575]">GDP</span>
                      <span className="text-sm font-medium">{market.gdp}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#757575]">Informal Economy</span>
                      <span className="text-sm font-medium">{market.informalEconomy}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Key Locations */}
          <div className="mt-12 grid md:grid-cols-4 gap-4">
            <Card className="text-center p-6">
              <MapPin className="h-8 w-8 text-[#00897B] mx-auto mb-3" />
              <h3 className="font-semibold text-[#1A1A1A]">Kapana Market</h3>
              <p className="text-sm text-[#757575]">Windhoek, Namibia</p>
              <p className="text-xs text-[#757575] mt-1">Street vendors, informal traders</p>
            </Card>
            <Card className="text-center p-6">
              <MapPin className="h-8 w-8 text-[#00897B] mx-auto mb-3" />
              <h3 className="font-semibold text-[#1A1A1A]">Kwa Mai Mai</h3>
              <p className="text-sm text-[#757575]">Johannesburg, SA</p>
              <p className="text-xs text-[#757575] mt-1">Traditional healers, markets</p>
            </Card>
            <Card className="text-center p-6">
              <MapPin className="h-8 w-8 text-[#00897B] mx-auto mb-3" />
              <h3 className="font-semibold text-[#1A1A1A]">CDM Mercado</h3>
              <p className="text-sm text-[#757575]">Maputo, Mozambique</p>
              <p className="text-xs text-[#757575] mt-1">Central market hub</p>
            </Card>
            <Card className="text-center p-6">
              <MapPin className="h-8 w-8 text-[#00897B] mx-auto mb-3" />
              <h3 className="font-semibold text-[#1A1A1A]">Oshikango Border</h3>
              <p className="text-sm text-[#757575]">Namibia-Angola</p>
              <p className="text-xs text-[#757575] mt-1">Cross-border commerce</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section id="pricing" className="py-16 lg:py-24 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="bg-[#E0F2F1] text-[#00897B] mb-4">Competitive Pricing</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#1A1A1A] mb-4">
              30-40% Below Competitors
            </h2>
            <p className="text-lg text-[#757575] max-w-2xl mx-auto">
              We believe every merchant deserves access to affordable payment technology. 
              That's why our devices cost significantly less than comparable solutions.
            </p>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#00897B] text-white">
                  <tr>
                    <th className="text-left px-6 py-4 font-semibold">Device Category</th>
                    <th className="text-center px-6 py-4 font-semibold">Gopay</th>
                    <th className="text-center px-6 py-4 font-semibold">Competitor A</th>
                    <th className="text-center px-6 py-4 font-semibold">Competitor B</th>
                    <th className="text-center px-6 py-4 font-semibold">Your Savings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="bg-white">
                    <td className="px-6 py-4 font-medium">Entry QR Terminal</td>
                    <td className="px-6 py-4 text-center text-[#00897B] font-bold">R 799</td>
                    <td className="px-6 py-4 text-center text-[#757575]">R 1,299</td>
                    <td className="px-6 py-4 text-center text-[#757575]">R 1,199</td>
                    <td className="px-6 py-4 text-center"><Badge className="bg-green-100 text-green-700">38%</Badge></td>
                  </tr>
                  <tr className="bg-[#FAFAFA]">
                    <td className="px-6 py-4 font-medium">Basic SmartPOS</td>
                    <td className="px-6 py-4 text-center text-[#00897B] font-bold">R 2,399</td>
                    <td className="px-6 py-4 text-center text-[#757575]">R 3,999</td>
                    <td className="px-6 py-4 text-center text-[#757575]">R 3,699</td>
                    <td className="px-6 py-4 text-center"><Badge className="bg-green-100 text-green-700">40%</Badge></td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-6 py-4 font-medium">Premium SmartPOS</td>
                    <td className="px-6 py-4 text-center text-[#00897B] font-bold">R 3,299</td>
                    <td className="px-6 py-4 text-center text-[#757575]">R 5,499</td>
                    <td className="px-6 py-4 text-center text-[#757575]">R 4,999</td>
                    <td className="px-6 py-4 text-center"><Badge className="bg-green-100 text-green-700">40%</Badge></td>
                  </tr>
                  <tr className="bg-[#FAFAFA]">
                    <td className="px-6 py-4 font-medium">Desktop Terminal</td>
                    <td className="px-6 py-4 text-center text-[#00897B] font-bold">R 2,899</td>
                    <td className="px-6 py-4 text-center text-[#757575]">R 4,799</td>
                    <td className="px-6 py-4 text-center text-[#757575]">R 4,299</td>
                    <td className="px-6 py-4 text-center"><Badge className="bg-green-100 text-green-700">38%</Badge></td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-6 py-4 font-medium">Business Tablet</td>
                    <td className="px-6 py-4 text-center text-[#00897B] font-bold">R 2,699</td>
                    <td className="px-6 py-4 text-center text-[#757575]">R 5,999</td>
                    <td className="px-6 py-4 text-center text-[#757575]">R 5,499</td>
                    <td className="px-6 py-4 text-center"><Badge className="bg-green-100 text-green-700">55%</Badge></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-sm text-[#757575] mb-4">Plus: Zero setup fees • Zero monthly fees • Instant settlement</p>
            <Link href="/gopay/portal">
              <Button size="lg" className="bg-[#00897B] hover:bg-[#00695C] text-white">
                Get Started Today
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="bg-[#E0F2F1] text-[#00897B] mb-4">FAQ</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#1A1A1A] mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <Card key={idx} className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-base">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[#757575]">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-r from-[#00897B] to-[#00695C]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Payment Experience?
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Join thousands of merchants across Southern Africa who trust Gopay for their payment needs.
            Start accepting payments in minutes, not days.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/gopay/portal">
              <Button size="lg" className="w-full sm:w-auto bg-white text-[#00897B] hover:bg-gray-100 px-8">
                Access Merchant Portal
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10">
              <Phone className="mr-2 h-4 w-4" />
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1A1A1A] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <img src="/groway-logo.png" alt="Groway" className="h-8 w-auto mb-4 brightness-0 invert" />
              <p className="text-sm text-gray-400 mb-4">
                Transforming financial access across Africa with affordable, reliable payment solutions.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Mail className="h-4 w-4" />
                <span>bridge@groway.co.za</span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Products</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">QR Terminals</a></li>
                <li><a href="#" className="hover:text-white transition-colors">SmartPOS Devices</a></li>
                <li><a href="#" className="hover:text-white transition-colors">SoftPOS App</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Business Tablets</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Lending</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                <li><Link href="/merchant-os" className="hover:text-white transition-colors">Merchant OS</Link></li>
                <li><Link href="/enterprise" className="hover:text-white transition-colors">Enterprise</Link></li>
                <li><Link href="/admin-console" className="hover:text-white transition-colors">Admin Console</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Markets</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">🇿🇦 South Africa</li>
                <li className="flex items-center gap-2">🇳🇦 Namibia</li>
                <li className="flex items-center gap-2">🇦🇴 Angola</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            <p>© 2026 Groway. All rights reserved. | PCI DSS L1 Certified | NCR Registered</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Missing import
function ShoppingCart({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}
