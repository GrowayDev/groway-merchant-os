'use client'

import { useState } from 'react'
import {
  Store, BarChart3, ShoppingCart, Package, Users, Settings,
  Plus, Minus, Trash2, CreditCard, QrCode, Banknote, Smartphone,
  Search, Menu, X, ChevronRight, ChevronLeft, Check, AlertCircle,
  Zap, TrendingUp, TrendingDown, Coins, ShoppingBag, Bell,
  User, Gift, Receipt, CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  businessVerticals, products, vasItems, sampleCustomers,
  getProductsBySubVertical, formatPrice, formatPriceShort, getVerticalById
} from '@/lib/merchant-os-data'
import { Product, CartItem, Customer, BusinessVertical, SubVertical } from '@/lib/merchant-os-types'

export default function MerchantOSApp() {
  const [currentScreen, setCurrentScreen] = useState<'selection' | 'dashboard' | 'pos' | 'inventory' | 'crm' | 'settings'>('selection')
  const [selectedVertical, setSelectedVertical] = useState<string | null>(null)
  const [selectedSubVertical, setSelectedSubVertical] = useState<string | null>(null)
  const [showOnboardingQuestions, setShowOnboardingQuestions] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'qr' | 'split'>('cash')
  const [cashReceived, setCashReceived] = useState('')
  const [showReceipt, setShowReceipt] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showCustomerSelect, setShowCustomerSelect] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showVAS, setShowVAS] = useState(false)
  const [showVariants, setShowVariants] = useState<Product | null>(null)
  
  const vertical = selectedVertical ? getVerticalById(selectedVertical) : null
  const subVertical = vertical?.subVerticals.find(sv => sv.id === selectedSubVertical)
  
  const currentProducts = selectedSubVertical 
    ? getProductsBySubVertical(selectedSubVertical)
    : selectedVertical 
      ? products.filter(p => p.vertical === selectedVertical)
      : []
  
  const categories = [...new Set(currentProducts.map(p => p.category))]
  
  const filteredProducts = currentProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || p.category === selectedCategory
    return matchesSearch && matchesCategory && p.isAvailable
  })
  
  const cartSubtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0)
  const cartVat = cart.reduce((sum, item) => {
    if (typeof item.product.vatRate === 'number') {
      const basePrice = item.product.sellingPrice + (item.variant?.priceModifier || 0)
      return sum + Math.round((basePrice * item.product.vatRate / 100) * item.quantity)
    }
    return sum
  }, 0)
  const cartTotal = cartSubtotal + cartVat
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const addToCart = (product: Product, variant?: any) => {
    const existingIndex = cart.findIndex(item => 
      item.product.id === product.id && item.variant?.id === variant?.id
    )
    
    if (existingIndex > -1) {
      const newCart = [...cart]
      const basePrice = product.sellingPrice + (variant?.priceModifier || 0)
      newCart[existingIndex].quantity++
      newCart[existingIndex].lineTotal = basePrice * newCart[existingIndex].quantity
      setCart(newCart)
    } else {
      const basePrice = product.sellingPrice + (variant?.priceModifier || 0)
      setCart([...cart, {
        product,
        quantity: 1,
        variant,
        discount: 0,
        lineTotal: basePrice
      }])
    }
  }

  const updateQuantity = (index: number, delta: number) => {
    const newCart = [...cart]
    const newQty = newCart[index].quantity + delta
    if (newQty <= 0) {
      newCart.splice(index, 1)
    } else {
      const basePrice = newCart[index].product.sellingPrice + (newCart[index].variant?.priceModifier || 0)
      newCart[index].quantity = newQty
      newCart[index].lineTotal = basePrice * newQty
    }
    setCart(newCart)
  }

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  const completeSale = () => {
    setShowReceipt(true)
    setTimeout(() => {
      setShowReceipt(false)
      setShowPaymentModal(false)
      setCart([])
      setCashReceived('')
      setSelectedCustomer(null)
      setCurrentScreen('dashboard')
    }, 3000)
  }

  const handleSelectVertical = (verticalId: string) => {
    setSelectedVertical(verticalId)
    const v = getVerticalById(verticalId)
    if (v && v.subVerticals.length === 1) {
      setSelectedSubVertical(v.subVerticals[0].id)
      setCurrentScreen('dashboard')
    }
  }

  const handleSelectSubVertical = (subVerticalId: string) => {
    setSelectedSubVertical(subVerticalId)
    setCurrentScreen('dashboard')
  }

  // Render sub-vertical selection
  if (currentScreen === 'selection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#00695C] via-[#00897B] to-[#4CAF50] flex flex-col">
        <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Store className="h-8 w-8 text-white" />
              <div>
                <h1 className="text-xl font-bold text-white">Groway Merchant OS</h1>
                <p className="text-xs text-teal-200">Select your business type to begin</p>
              </div>
            </div>
            <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => setShowOnboardingQuestions(!showOnboardingQuestions)}>
              {showOnboardingQuestions ? 'Show All Options' : 'Not Sure? Get Help'}
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto px-4 py-6">
            {showOnboardingQuestions ? (
              <OnboardingWizard
                onDone={(verticalId, subVerticalId) => {
                  setSelectedVertical(verticalId)
                  setSelectedSubVertical(subVerticalId)
                  setCurrentScreen('dashboard')
                }}
              />
            ) : !selectedVertical ? (
              <>
                <div className="text-center mb-6">
                  <Badge className="bg-white/20 text-white border-white/30">Step 1 of 2</Badge>
                  <h2 className="text-2xl font-bold text-white mt-3">What type of business are you?</h2>
                  <p className="text-teal-200 mt-1">Select your main business category</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {businessVerticals.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => handleSelectVertical(v.id)}
                      className="p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-left hover:bg-white/20 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-white group-hover:bg-[#00897B] transition-colors">
                          <Store className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-sm">{v.name}</p>
                          <p className="text-xs text-teal-200">{v.subCount} sub-types</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <button 
                    onClick={() => { setSelectedVertical(null); setSelectedSubVertical(null) }}
                    className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div>
                    <Badge className="bg-white/20 text-white border-white/30">Step 2 of 2</Badge>
                    <h2 className="text-2xl font-bold text-white mt-2">
                      {vertical?.name} - Choose Your Specific Type
                    </h2>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {vertical?.subVerticals.map((sv) => (
                    <button
                      key={sv.id}
                      onClick={() => handleSelectSubVertical(sv.id)}
                      className="p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-left hover:bg-white/20 transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-white">{sv.name}</p>
                          <p className="text-sm text-teal-200 mt-1">{sv.description}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-white/50 group-hover:text-white transition-colors" />
                      </div>
                      {sv.requiresLicense && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-300">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Requires: {sv.licenseType}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <button
                    onClick={() => { setSelectedSubVertical(null); setCurrentScreen('dashboard') }}
                    className="text-sm text-white/70 hover:text-white underline"
                  >
                    Skip - Continue with {vertical?.name} (general)
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    )
  }

  // Main Application
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1.5">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div>
            <p className="font-bold text-[#1A1A1A]">{vertical?.name}</p>
            {subVertical && <p className="text-xs text-[#757575]">{subVertical.name}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 relative">
            <Bell className="h-5 w-5 text-[#757575]" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200">
              <p className="font-bold text-[#00897B]">Groway Merchant OS</p>
              <p className="text-xs text-[#757575] mt-1">{vertical?.name} {subVertical && `• ${subVertical.name}`}</p>
            </div>
            <nav className="p-2">
              {[
                { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
                { id: 'pos', icon: ShoppingCart, label: 'POS' },
                { id: 'inventory', icon: Package, label: 'Inventory' },
                { id: 'crm', icon: Users, label: 'CRM & Loyalty' },
                { id: 'settings', icon: Settings, label: 'Settings' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => { setCurrentScreen(item.id as any); setMobileMenuOpen(false) }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    currentScreen === item.id ? 'bg-[#E0F2F1] text-[#00897B]' : 'text-[#757575] hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#00897B] text-white flex items-center justify-center">
                <Store className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-[#1A1A1A]">Merchant OS</p>
                <p className="text-xs text-[#757575]">{vertical?.name}</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-2 space-y-1">
            {[
              { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
              { id: 'pos', icon: ShoppingCart, label: 'Point of Sale', badge: cartItemCount },
              { id: 'inventory', icon: Package, label: 'Inventory' },
              { id: 'crm', icon: Users, label: 'CRM & Loyalty' },
              { id: 'settings', icon: Settings, label: 'Settings' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentScreen(item.id as any)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                  currentScreen === item.id ? 'bg-[#E0F2F1] text-[#00897B]' : 'text-[#757575] hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </span>
                {item.badge && item.badge > 0 && (
                  <Badge className="bg-[#00897B] text-white text-[10px] px-1.5 py-0.5">
                    {item.badge}
                  </Badge>
                )}
              </button>
            ))}
          </nav>
          <div className="p-3 border-t border-gray-200">
            <button
              onClick={() => setCurrentScreen('selection')}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#757575] hover:text-[#00897B] rounded-lg hover:bg-gray-100"
            >
              <ChevronLeft className="h-4 w-4" />
              Change Business Type
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {currentScreen === 'dashboard' && (
            <DashboardScreen vertical={vertical} subVertical={subVertical} onStartSale={() => setCurrentScreen('pos')} />
          )}
          {currentScreen === 'pos' && (
            <POSScreen
              products={filteredProducts}
              categories={categories}
              cart={cart}
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              selectedCustomer={selectedCustomer}
              onSearch={setSearchQuery}
              onCategoryChange={setSelectedCategory}
              onAddToCart={addToCart}
              onUpdateQuantity={updateQuantity}
              onRemoveFromCart={removeFromCart}
              onCheckout={() => setShowPaymentModal(true)}
              onSelectCustomer={() => setShowCustomerSelect(true)}
              onShowVAS={() => setShowVAS(true)}
              vertical={vertical}
              subVertical={subVertical}
              showVariants={showVariants}
              setShowVariants={setShowVariants}
            />
          )}
          {currentScreen === 'inventory' && (
            <InventoryScreen products={currentProducts} />
          )}
          {currentScreen === 'crm' && (
            <CRMScreen customers={sampleCustomers} />
          )}
          {currentScreen === 'settings' && (
            <SettingsScreen vertical={vertical} subVertical={subVertical} onChangeType={() => setCurrentScreen('selection')} />
          )}
        </main>
      </div>

      {/* Modals */}
      {showPaymentModal && (
        <PaymentModal
          total={cartTotal}
          vat={cartVat}
          subtotal={cartSubtotal}
          items={cart}
          customer={selectedCustomer}
          paymentMethod={paymentMethod}
          cashReceived={cashReceived}
          onPaymentMethodChange={setPaymentMethod}
          onCashReceivedChange={setCashReceived}
          onComplete={completeSale}
          onClose={() => setShowPaymentModal(false)}
          showReceipt={showReceipt}
        />
      )}

      {showCustomerSelect && (
        <CustomerSelectModal
          customers={sampleCustomers}
          selected={selectedCustomer}
          onSelect={(customer) => { setSelectedCustomer(customer); setShowCustomerSelect(false) }}
          onClose={() => setShowCustomerSelect(false)}
        />
      )}

      {showVAS && (
        <VASModal
          items={vasItems}
          onSelect={() => setShowVAS(false)}
          onClose={() => setShowVAS(false)}
        />
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 px-4 z-50">
        {[
          { id: 'dashboard', icon: BarChart3 },
          { id: 'pos', icon: ShoppingCart, badge: cartItemCount },
          { id: 'inventory', icon: Package },
          { id: 'crm', icon: Users },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentScreen(item.id as any)}
            className={`flex flex-col items-center p-2 relative ${
              currentScreen === item.id ? 'text-[#00897B]' : 'text-[#757575]'
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.badge && item.badge > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#008979] text-white text-[10px] rounded-full flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}

// Sub-components
function OnboardingWizard({ onDone }: { onDone: (verticalId: string, subVerticalId: string) => void }) {
  const [step, setStep] = useState(1)
  const [answers, setAnswers] = useState<Record<number, string>>({})

  const questions = [
    {
      question: 'Do you prepare and sell food on-site?',
      options: [
        { label: 'Yes, we cook/prepare food', value: 'food-yes' },
        { label: 'No, we only sell pre-packaged items', value: 'food-no' },
      ]
    },
    {
      question: 'Do customers typically sit down at your establishment?',
      options: [
        { label: 'Yes, we have seating', value: 'sit-yes' },
        { label: 'No, it\'s mostly take-away', value: 'sit-no' },
      ]
    },
    {
      question: 'Do you sell alcohol?',
      options: [
        { label: 'Yes, we have a liquor license', value: 'alcohol-yes' },
        { label: 'No, we don\'t sell alcohol', value: 'alcohol-no' },
      ]
    }
  ]

  const getRecommendation = () => {
    const [food, sit, alcohol] = [answers[1], answers[2], answers[3]]
    if (food === 'food-yes' && sit === 'sit-yes' && alcohol === 'alcohol-yes') {
      return { vertical: 'food-beverage', subVertical: 'tavern', name: 'Tavern / Restaurant with Bar' }
    }
    if (food === 'food-yes' && sit === 'sit-yes') {
      return { vertical: 'food-beverage', subVertical: 'sit-down', name: 'Sit-Down Restaurant' }
    }
    if (food === 'food-yes' && sit === 'sit-no') {
      return { vertical: 'food-beverage', subVertical: 'qsr', name: 'Quick Service Restaurant' }
    }
    if (food === 'food-no' && alcohol === 'alcohol-yes') {
      return { vertical: 'liquor-nightlife', subVertical: 'liquor-store', name: 'Liquor Store' }
    }
    return { vertical: 'grocery-fmcg', subVertical: 'spaza-shop', name: 'Spaza Shop' }
  }

  return (
    <div className="max-w-xl mx-auto">
      {step <= 3 ? (
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-white/70">Question {step} of 3</span>
            <div className="flex gap-1.5">
              {[1, 2, 3].map(s => (
                <div key={s} className={`w-8 h-1.5 rounded-full ${s <= step ? 'bg-white' : 'bg-white/30'}`} />
              ))}
            </div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-4">
            {questions[step - 1].question}
          </h3>
          <div className="space-y-2">
            {questions[step - 1].options.map(opt => (
              <button
                key={opt.value}
                onClick={() => {
                  setAnswers({ ...answers, [step]: opt.value })
                  if (step < 3) setStep(step + 1)
                }}
                className="w-full p-4 text-left bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors"
              >
                {opt.label}
              </button>
            ))}
          </div>
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="mt-4 text-sm text-white/70 hover:text-white flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#4CAF50] rounded-full flex items-center justify-center">
            <Check className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">We found your business type!</h3>
          <p className="text-teal-200 mb-4">Based on your answers, we recommend:</p>
          <div className="bg-white/20 rounded-lg p-4 mb-6">
            <p className="text-lg font-semibold text-white">{getRecommendation().name}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="border-white/30 text-white hover:bg-white/10"
            >
              Start Over
            </Button>
            <Button
              onClick={() => onDone(getRecommendation().vertical, getRecommendation().subVertical)}
              className="bg-white text-[#00897B] hover:bg-teal-50"
            >
              Start Selling
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function DashboardScreen({ vertical, subVertical, onStartSale }: { 
  vertical: BusinessVertical | undefined
  subVertical: SubVertical | undefined
  onStartSale: () => void 
}) {
  const stats = [
    { label: 'Today\'s Revenue', value: 'R 12 450,00', change: '+12%', positive: true, icon: Coins },
    { label: 'Transactions', value: '47', change: '+8%', positive: true, icon: ShoppingBag },
    { label: 'Avg. Transaction', value: 'R 265,00', change: '+5%', positive: true, icon: TrendingUp },
    { label: 'Items Sold', value: '189', change: '+15%', positive: true, icon: Package },
  ]

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Dashboard</h1>
          <p className="text-sm text-[#757575]">{vertical?.name} {subVertical && `• ${subVertical.name}`}</p>
        </div>
        <Button onClick={onStartSale} className="bg-[#00897B] hover:bg-[#00695C] text-white gap-2">
          <Plus className="h-4 w-4" />
          New Sale
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center">
                  <stat.icon className="h-4 w-4" />
                </div>
                <span className={`text-xs font-medium flex items-center gap-0.5 ${
                  stat.positive ? 'text-green-600' : 'text-red-500'
                }`}>
                  {stat.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {stat.change}
                </span>
              </div>
              <p className="text-xl font-bold text-[#1A1A1A] mt-3">{stat.value}</p>
              <p className="text-xs text-[#757575]">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#1A1A1A]">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { icon: ShoppingCart, label: 'New Sale', action: onStartSale },
              { icon: Plus, label: 'Add Product', action: () => {} },
              { icon: Gift, label: 'Sell VAS (Airtime, etc)', action: () => {} },
              { icon: Receipt, label: 'View Transactions', action: () => {} },
            ].map((action, i) => (
              <button
                key={i}
                onClick={action.action}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-[#00897B]/30 hover:bg-[#E0F2F1]/50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center">
                  <action.icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-[#1A1A1A]">{action.label}</span>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#1A1A1A]">Recent Transactions</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-[#757575]">View All</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { time: '14:32', items: '3 items', total: 'R 185,00', method: 'QR' },
                { time: '14:15', items: '1 item', total: 'R 45,00', method: 'Cash' },
                { time: '13:58', items: '5 items', total: 'R 320,00', method: 'Card' },
                { time: '13:45', items: '2 items', total: 'R 95,00', method: 'QR' },
              ].map((tx, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#FAFAFA]">
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-[#757575] w-12">{tx.time}</div>
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">{tx.items}</p>
                      <Badge variant="outline" className="text-[10px] mt-0.5">{tx.method}</Badge>
                    </div>
                  </div>
                  <span className="font-semibold text-[#1A1A1A]">{tx.total}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-[#00897B]/30 bg-gradient-to-r from-[#E0F2F1] to-white">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00897B] text-white flex items-center justify-center flex-shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-[#1A1A1A]">JAX AI Insight</p>
              <p className="text-sm text-[#757575] mt-1">
                Your peak hours are between 12:00-14:00. Consider adding a lunch special to increase average transaction value by an estimated R45.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function POSScreen({ 
  products, categories, cart, searchQuery, selectedCategory, selectedCustomer,
  onSearch, onCategoryChange, onAddToCart, onUpdateQuantity, onRemoveFromCart, onCheckout, onSelectCustomer, onShowVAS,
  vertical, subVertical, showVariants, setShowVariants
}: {
  products: Product[]
  categories: string[]
  cart: CartItem[]
  searchQuery: string
  selectedCategory: string | null
  selectedCustomer: Customer | null
  onSearch: (q: string) => void
  onCategoryChange: (c: string | null) => void
  onAddToCart: (product: Product, variant?: any) => void
  onUpdateQuantity: (index: number, delta: number) => void
  onRemoveFromCart: (index: number) => void
  onCheckout: () => void
  onSelectCustomer: () => void
  onShowVAS: () => void
  vertical: BusinessVertical | undefined
  subVertical: SubVertical | undefined
  showVariants: Product | null
  setShowVariants: (p: Product | null) => void
}) {
  const cartSubtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0)
  const cartVat = cart.reduce((sum, item) => {
    if (typeof item.product.vatRate === 'number') {
      const basePrice = item.product.sellingPrice + (item.variant?.priceModifier || 0)
      return sum + Math.round((basePrice * item.product.vatRate / 100) * item.quantity)
    }
    return sum
  }, 0)
  const cartTotal = cartSubtotal + cartVat

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-56px)] lg:h-screen">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={onShowVAS}
              className="h-10 w-10 border-[#00897B]/30"
            >
              <Zap className="h-4 w-4 text-[#00897B]" />
            </Button>
          </div>
          
          <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCategoryChange(null)}
              className={selectedCategory === null ? 'bg-[#00897B] text-white' : 'text-xs'}
            >
              All
            </Button>
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => onCategoryChange(cat)}
                className={selectedCategory === cat ? 'bg-[#00897B] text-white' : 'text-xs whitespace-nowrap'}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-3 bg-[#FAFAFA]">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2">
            {products.map(product => (
              <button
                key={product.id}
                onClick={() => {
                  if (product.hasVariants && product.variants && product.variants.length > 0) {
                    setShowVariants(product)
                  } else {
                    onAddToCart(product)
                  }
                }}
                className="bg-white p-3 rounded-lg border border-gray-200 hover:border-[#00897B]/30 hover:shadow-md transition-all text-left"
              >
                <div className="aspect-square bg-[#F5F5F5] rounded-lg mb-2 flex items-center justify-center">
                  {product.isService ? (
                    <Gift className="h-8 w-8 text-[#757575]" />
                  ) : (
                    <ShoppingBag className="h-8 w-8 text-[#757575]" />
                  )}
                </div>
                <p className="text-xs font-medium text-[#1A1A1A] line-clamp-2 min-h-[2.25rem]">
                  {product.posLabel || product.name}
                </p>
                <p className="text-sm font-bold text-[#00897B] mt-1">
                  {formatPriceShort(product.sellingPrice)}
                </p>
                {product.hasVariants && (
                  <Badge variant="outline" className="text-[10px] mt-1">
                    {product.variants?.length} options
                  </Badge>
                )}
                {!product.isService && product.stock <= product.minStock && (
                  <div className="flex items-center gap-1 text-[10px] text-amber-600 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    Low stock: {product.stock}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-gray-200 bg-white flex flex-col">
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#1A1A1A]">Cart</h3>
            {cart.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => cart.forEach((_, i) => onRemoveFromCart(i))}
                className="text-xs text-[#757575]"
              >
                Clear All
              </Button>
            )}
          </div>
          
          <button
            onClick={onSelectCustomer}
            className="w-full mt-2 flex items-center gap-2 p-2 rounded-lg border border-dashed border-gray-300 hover:border-[#00897B] transition-colors"
          >
            {selectedCustomer ? (
              <>
                <div className="w-8 h-8 rounded-full bg-[#E0F2F1] text-[#00897B] flex items-center justify-center text-xs font-bold">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-[#1A1A1A]">{selectedCustomer.name}</p>
                  <p className="text-xs text-[#757575]">
                    {selectedCustomer.loyaltyTier.charAt(0).toUpperCase() + selectedCustomer.loyaltyTier.slice(1)} Member
                  </p>
                </div>
              </>
            ) : (
              <>
                <User className="h-4 w-4 text-[#757575]" />
                <span className="text-sm text-[#757575]">Add customer (optional)</span>
              </>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-auto p-3">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-[#757575]">Your cart is empty</p>
              <p className="text-xs text-[#757575] mt-1">Tap on products to add them</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item, index) => (
                <div key={`${item.product.id}-${item.variant?.id}`} className="flex items-start gap-3 p-2 rounded-lg bg-[#FAFAFA]">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1A1A1A] truncate">
                      {item.product.posLabel || item.product.name}
                    </p>
                    {item.variant && (
                      <p className="text-xs text-[#757575]">{item.variant.name}</p>
                    )}
                    <p className="text-xs text-[#00897B] font-medium">
                      {formatPriceShort(item.product.sellingPrice + (item.variant?.priceModifier || 0))} each
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onUpdateQuantity(index, -1)}
                      className="w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(index, 1)}
                      className="w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => onRemoveFromCart(index)}
                      className="w-7 h-7 rounded-md text-red-500 hover:bg-red-50 flex items-center justify-center ml-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-gray-200 bg-[#FAFAFA]">
          <div className="space-y-1.5 mb-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#757575]">Subtotal</span>
              <span className="font-medium">{formatPrice(cartSubtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#757575]">VAT (15%)</span>
              <span className="font-medium">{formatPrice(cartVat)}</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t">
              <span>Total</span>
              <span className="text-[#00897B]">{formatPrice(cartTotal)}</span>
            </div>
          </div>
          <Button 
            className="w-full bg-[#00897B] hover:bg-[#00695C] text-white h-12 text-base font-semibold"
            disabled={cart.length === 0}
            onClick={onCheckout}
          >
            Checkout
          </Button>
        </div>
      </div>

      {showVariants && showVariants.variants && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold">Select Option</h3>
              <button onClick={() => setShowVariants(null)} className="p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-3 space-y-2">
              {showVariants.variants.map(variant => (
                <button
                  key={variant.id}
                  onClick={() => {
                    onAddToCart(showVariants, variant)
                    setShowVariants(null)
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-[#00897B] hover:bg-[#E0F2F1]/50 transition-colors"
                >
                  <span className="font-medium">{variant.name}</span>
                  <span className="font-bold text-[#00897B]">
                    {formatPriceShort(showVariants.sellingPrice + variant.priceModifier)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InventoryScreen({ products }: { products: Product[] }) {
  const [tab, setTab] = useState<'products' | 'low_stock'>('products')
  const [search, setSearch] = useState('')

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  )
  const lowStockProducts = products.filter(p => p.stock <= p.minStock && !p.isService)

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Inventory</h1>
          <p className="text-sm text-[#757575]">{products.length} products</p>
        </div>
        <Button className="bg-[#00897B] hover:bg-[#00695C] text-white gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-[#1A1A1A]">{products.length}</p>
            <p className="text-xs text-[#757575]">Total Products</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-amber-600">{lowStockProducts.length}</p>
            <p className="text-xs text-[#757575]">Low Stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-[#1A1A1A]">
              {products.filter(p => !p.isService).reduce((sum, p) => sum + p.sellingPrice * p.stock, 0) > 0 ? formatPriceShort(products.filter(p => !p.isService).reduce((sum, p) => sum + p.sellingPrice * p.stock, 0)) : 'R0'}
            </p>
            <p className="text-xs text-[#757575]">Stock Value</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-[#00897B]">
              {products.filter(p => p.isService).length}
            </p>
            <p className="text-xs text-[#757575]">Services</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 mb-4 border-b border-gray-200">
        {[
          { id: 'products', label: 'All Products' },
          { id: 'low_stock', label: `Low Stock (${lowStockProducts.length})` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t.id 
                ? 'border-[#00897B] text-[#00897B]' 
                : 'border-transparent text-[#757575] hover:text-[#1A1A1A]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {tab === 'products' && (
            <>
              <div className="p-3 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                  <Input
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="divide-y divide-gray-100 max-h-[400px] overflow-auto">
                {filteredProducts.map(product => (
                  <div key={product.id} className="flex items-center gap-3 p-3 hover:bg-[#FAFAFA]">
                    <div className="w-10 h-10 bg-[#F5F5F5] rounded-lg flex items-center justify-center">
                      {product.isService ? <Gift className="h-5 w-5 text-[#757575]" /> : <Package className="h-5 w-5 text-[#757575]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A1A] truncate">{product.name}</p>
                      <p className="text-xs text-[#757575]">{product.sku} • {product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#00897B]">{formatPriceShort(product.sellingPrice)}</p>
                      <p className={`text-xs ${product.stock <= product.minStock ? 'text-amber-600 font-medium' : 'text-[#757575]'}`}>
                        Stock: {product.isService ? '∞' : product.stock}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {tab === 'low_stock' && (
            <div className="divide-y divide-gray-100 max-h-[400px] overflow-auto">
              {lowStockProducts.length === 0 ? (
                <div className="p-8 text-center text-[#757575]">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p>All products are well stocked!</p>
                </div>
              ) : (
                lowStockProducts.map(product => (
                  <div key={product.id} className="flex items-center gap-3 p-3 bg-amber-50/50">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A1A] truncate">{product.name}</p>
                      <p className="text-xs text-[#757575]">Min: {product.minStock}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-amber-600">{product.stock} left</p>
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        Reorder
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function CRMScreen({ customers }: { customers: Customer[] }) {
  const [search, setSearch] = useState('')
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  const tierColors: Record<string, string> = {
    bronze: 'bg-amber-100 text-amber-700',
    silver: 'bg-gray-200 text-gray-700',
    gold: 'bg-yellow-100 text-yellow-700',
    platinum: 'bg-purple-100 text-purple-700'
  }

  const tierIcons: Record<string, string> = {
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '💎'
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">CRM & Loyalty</h1>
          <p className="text-sm text-[#757575]">{customers.length} customers</p>
        </div>
        <Button className="bg-[#00897B] hover:bg-[#00695C] text-white gap-2">
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Total Customers</p>
            <p className="text-2xl font-bold text-[#1A1A1A] mt-2">{customers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Platinum</p>
            <p className="text-2xl font-bold text-purple-600 mt-2">
              {customers.filter(c => c.loyaltyTier === 'platinum').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Total Points</p>
            <p className="text-xl font-bold text-[#00897B] mt-2">
              {customers.reduce((sum, c) => sum + c.loyaltyPoints, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Total Spent</p>
            <p className="text-xl font-bold text-[#00897B] mt-2">
              {formatPriceShort(customers.reduce((sum, c) => sum + c.totalSpent, 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-2">
        {filteredCustomers.map(customer => (
          <Card key={customer.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#E0F2F1] text-[#00897B] flex items-center justify-center font-bold text-sm">
                  {customer.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[#1A1A1A]">{customer.name}</p>
                    <Badge className={`text-[10px] ${tierColors[customer.loyaltyTier]}`}>
                      {tierIcons[customer.loyaltyTier]} {customer.loyaltyTier.charAt(0).toUpperCase() + customer.loyaltyTier.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#757575]">{customer.phone}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#00897B]">{formatPriceShort(customer.totalSpent)}</p>
                  <p className="text-xs text-[#757575]">{customer.loyaltyPoints.toLocaleString()} pts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function SettingsScreen({ vertical, subVertical, onChangeType }: { 
  vertical: BusinessVertical | undefined
  subVertical: SubVertical | undefined
  onChangeType: () => void 
}) {
  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6">Settings</h1>

      <div className="space-y-4 max-w-2xl">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-[#FAFAFA] rounded-lg">
              <div>
                <p className="text-sm font-medium text-[#1A1A1A]">Business Type</p>
                <p className="text-xs text-[#757575]">{vertical?.name} {subVertical ? `• ${subVertical.name}` : ''}</p>
              </div>
              <Button variant="outline" size="sm" onClick={onChangeType}>
                Change
              </Button>
            </div>
            <div className="grid gap-3">
              <div>
                <Label className="text-xs text-[#757575] mb-1.5 block">Business Name</Label>
                <Input placeholder="Enter business name" />
              </div>
              <div>
                <Label className="text-xs text-[#757575] mb-1.5 block">Phone Number</Label>
                <Input placeholder="+27 00 000 0000" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { id: 'cash', icon: Banknote, label: 'Cash', enabled: true },
              { id: 'card', icon: CreditCard, label: 'Card', enabled: true },
              { id: 'qr', icon: QrCode, label: 'QR (Groway Wallet)', enabled: true },
              { id: 'payshap', icon: Smartphone, label: 'PayShap', enabled: false },
            ].map(method => (
              <div key={method.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-[#FAFAFA]">
                <div className="flex items-center gap-3">
                  <method.icon className="h-4 w-4 text-[#757575]" />
                  <span className="text-sm text-[#1A1A1A]">{method.label}</span>
                </div>
                <Badge variant={method.enabled ? 'default' : 'outline'} className={method.enabled ? 'bg-[#00897B] text-white' : ''}>
                  {method.enabled ? 'Active' : 'Setup Required'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {subVertical?.requiresLicense && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">{subVertical.licenseType}</p>
                  <p className="text-xs text-amber-700 mt-1">
                    This business type requires additional licensing. Please ensure you have the necessary permits.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function PaymentModal({ 
  total, vat, subtotal, items, customer, paymentMethod, cashReceived, showReceipt,
  onPaymentMethodChange, onCashReceivedChange, onComplete, onClose
}: {
  total: number
  vat: number
  subtotal: number
  items: CartItem[]
  customer: Customer | null
  paymentMethod: 'cash' | 'card' | 'qr' | 'split'
  cashReceived: string
  showReceipt: boolean
  onPaymentMethodChange: (method: 'cash' | 'card' | 'qr' | 'split') => void
  onCashReceivedChange: (value: string) => void
  onComplete: () => void
  onClose: () => void
}) {
  const cashReceivedNum = parseFloat(cashReceived.replace(/[^\d.]/g, '')) * 100 || 0
  const change = cashReceivedNum - total

  if (showReceipt) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-sm p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-[#1A1A1A]">Payment Successful!</h2>
          <p className="text-[#757575] mt-1">Transaction completed</p>
          <div className="mt-6 p-4 bg-[#FAFAFA] rounded-lg">
            <p className="text-2xl font-bold text-[#00897B]">{formatPrice(total)}</p>
            <p className="text-sm text-[#757575] mt-1">{items.length} items</p>
          </div>
          <Button className="w-full mt-4" onClick={onComplete}>
            Done
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
      <div className="bg-white rounded-t-2xl lg:rounded-xl w-full lg:max-w-md max-h-[90vh] overflow-auto">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="font-semibold text-[#1A1A1A]">Complete Payment</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[#757575]">Subtotal</span>
            <span className="font-medium">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[#757575]">VAT</span>
            <span className="font-medium">{formatPrice(vat)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t">
            <span>Total</span>
            <span className="text-[#00897B]">{formatPrice(total)}</span>
          </div>
          {customer && (
            <div className="mt-3 flex items-center gap-2 text-sm text-[#757575]">
              <User className="h-4 w-4" />
              {customer.name}
            </div>
          )}
        </div>

        <div className="p-4">
          <p className="text-sm font-medium text-[#1A1A1A] mb-3">Payment Method</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'cash', icon: Banknote, label: 'Cash' },
              { id: 'card', icon: CreditCard, label: 'Card' },
              { id: 'qr', icon: QrCode, label: 'QR' },
            ].map(method => (
              <button
                key={method.id}
                onClick={() => onPaymentMethodChange(method.id as any)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-colors ${
                  paymentMethod === method.id 
                    ? 'border-[#00897B] bg-[#E0F2F1]' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <method.icon className={`h-5 w-5 ${paymentMethod === method.id ? 'text-[#00897B]' : 'text-[#757575]'}`} />
                <span className={`text-xs font-medium ${paymentMethod === method.id ? 'text-[#00897B]' : 'text-[#757575]'}`}>
                  {method.label}
                </span>
              </button>
            ))}
          </div>

          {paymentMethod === 'cash' && (
            <div className="mt-4">
              <Label className="text-sm font-medium text-[#1A1A1A] mb-2 block">Cash Received</Label>
              <Input
                placeholder="0.00"
                value={cashReceived}
                onChange={(e) => onCashReceivedChange(e.target.value)}
                className="text-xl font-bold h-14"
              />
              <div className="flex gap-2 mt-2">
                {[100, 200, 500].map(amount => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => onCashReceivedChange(amount.toString())}
                    className="flex-1"
                  >
                    R{amount}
                  </Button>
                ))}
              </div>
              {change >= 0 && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-green-700">Change</span>
                  <span className="text-lg font-bold text-green-700">{formatPrice(change)}</span>
                </div>
              )}
            </div>
          )}

          {paymentMethod === 'qr' && (
            <div className="mt-4 p-4 bg-[#FAFAFA] rounded-lg text-center">
              <QrCode className="h-16 w-16 mx-auto text-[#00897B] mb-2" />
              <p className="text-sm text-[#757575]">
                Customer scans with Groway Wallet app to pay
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 sticky bottom-0 bg-white">
          <Button 
            className="w-full bg-[#00897B] hover:bg-[#00695C] text-white h-12 text-base font-semibold"
            onClick={onComplete}
            disabled={paymentMethod === 'cash' && change < 0}
          >
            {paymentMethod === 'cash' && change < 0 ? 'Enter cash amount' : 'Complete Sale'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function CustomerSelectModal({ customers, selected, onSelect, onClose }: {
  customers: Customer[]
  selected: Customer | null
  onSelect: (customer: Customer) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold">Select Customer</h3>
          <button onClick={onClose} className="p-1">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-3">
          <Input
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="max-h-64 overflow-auto p-2 space-y-1">
          {filtered.map(customer => (
            <button
              key={customer.id}
              onClick={() => onSelect(customer)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#FAFAFA] ${
                selected?.id === customer.id ? 'bg-[#E0F2F1]' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-[#E0F2F1] text-[#00897B] flex items-center justify-center text-xs font-bold">
                {customer.name.charAt(0)}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-[#1A1A1A]">{customer.name}</p>
                <p className="text-xs text-[#757575]">{customer.phone}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function VASModal({ items, onClose }: {
  items: VASItem[]
  onSelect: (item: VASItem, amount: number) => void
  onClose: () => void
}) {
  const categories = [...new Set(items.map(i => i.category))]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold">Value-Added Services</h3>
          <button onClick={onClose} className="p-1">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 space-y-4 overflow-auto max-h-[400px]">
          {categories.map(cat => (
            <div key={cat}>
              <h4 className="text-xs font-semibold text-[#757575] uppercase mb-2">
                {cat}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {items.filter(i => i.category === cat).map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-3 rounded-lg border border-gray-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center">
                      <Smartphone className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-[#1A1A1A]">{item.name}</p>
                      <p className="text-xs text-[#757575]">{item.provider}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
