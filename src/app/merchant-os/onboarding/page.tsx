'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Store, 
  Users, 
  Package, 
  CreditCard, 
  Sparkles,
  RefreshCw,
  MapPin,
  Phone,
  Mail,
  Clock,
  Plus,
  Trash2,
  Check,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

// Inline auth types and context
interface AuthUser {
  id: string
  email: string
  name: string | null
  avatar: string | null
  phone: string | null
}

interface AuthMerchant {
  id: string
  code: string
  name: string
  tradingName: string | null
  vertical: string | null
  subVertical: string | null
  logo: string | null
  currency: string
  vatRate: number
  vatRegistered: boolean
  plan: string
  planStatus: string
  status: string
  onboardingComplete: boolean
  onboardingStep: string | null
}

interface AuthContextType {
  user: AuthUser | null
  merchant: AuthMerchant | null
  branchId: string | null
  role: string
  isLoading: boolean
  isAuthenticated: boolean
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

const onboardingSteps = [
  { id: 'welcome', title: 'Welcome', icon: Sparkles, description: 'Get started' },
  { id: 'branch', title: 'Location', icon: Store, description: 'Your branch' },
  { id: 'hours', title: 'Hours', icon: Clock, description: 'Business hours' },
  { id: 'staff', title: 'Staff', icon: Users, description: 'Team members' },
  { id: 'products', title: 'Products', icon: Package, description: 'Add items' },
  { id: 'payments', title: 'Payments', icon: CreditCard, description: 'Payment setup' },
  { id: 'complete', title: 'Complete', icon: CheckCircle2, description: 'All done!' },
]

const weekDays = [
  { id: 'mon', name: 'Monday', short: 'Mon' },
  { id: 'tue', name: 'Tuesday', short: 'Tue' },
  { id: 'wed', name: 'Wednesday', short: 'Wed' },
  { id: 'thu', name: 'Thursday', short: 'Thu' },
  { id: 'fri', name: 'Friday', short: 'Fri' },
  { id: 'sat', name: 'Saturday', short: 'Sat' },
  { id: 'sun', name: 'Sunday', short: 'Sun' },
]

const staffRoles = [
  { id: 'manager', name: 'Manager', permissions: ['All access', 'Reports', 'Staff management'] },
  { id: 'cashier', name: 'Cashier', permissions: ['POS', 'Refunds (limited)', 'Cash up'] },
  { id: 'waiter', name: 'Waiter', permissions: ['Orders', 'Tables', 'Payments'] },
  { id: 'chef', name: 'Chef/Kitchen', permissions: ['Kitchen orders', 'Menu items'] },
  { id: 'stock_clerk', name: 'Stock Clerk', permissions: ['Inventory', 'Receiving'] },
]

interface StaffMember {
  id: string
  name: string
  email: string
  phone: string
  role: string
  pin: string
}

interface Product {
  id: string
  name: string
  category: string
  price: number
  cost: number
}

function OnboardingContent() {
  const router = useRouter()
  const { user, merchant, refresh } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  
  // Branch data
  const [branchName, setBranchName] = useState('')
  const [branchPhone, setBranchPhone] = useState('')
  const [branchEmail, setBranchEmail] = useState('')
  const [branchAddress, setBranchAddress] = useState('')
  const [branchCity, setBranchCity] = useState('')
  const [branchProvince, setBranchProvince] = useState('')
  const [branchPostalCode, setBranchPostalCode] = useState('')
  
  // Business hours
  const [tradingHours, setTradingHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>({
    mon: { open: '08:00', close: '17:00', closed: false },
    tue: { open: '08:00', close: '17:00', closed: false },
    wed: { open: '08:00', close: '17:00', closed: false },
    thu: { open: '08:00', close: '17:00', closed: false },
    fri: { open: '08:00', close: '17:00', closed: false },
    sat: { open: '09:00', close: '13:00', closed: false },
    sun: { open: '09:00', close: '13:00', closed: true },
  })
  
  // Staff
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [newStaffName, setNewStaffName] = useState('')
  const [newStaffEmail, setNewStaffEmail] = useState('')
  const [newStaffPhone, setNewStaffPhone] = useState('')
  const [newStaffRole, setNewStaffRole] = useState('cashier')
  const [newStaffPin, setNewStaffPin] = useState('')
  
  // Products
  const [products, setProducts] = useState<Product[]>([])
  const [newProductName, setNewProductName] = useState('')
  const [newProductCategory, setNewProductCategory] = useState('')
  const [newProductPrice, setNewProductPrice] = useState('')
  const [newProductCost, setNewProductCost] = useState('')
  
  // Payments
  const [acceptCash, setAcceptCash] = useState(true)
  const [acceptCard, setAcceptCard] = useState(true)
  const [acceptQR, setAcceptQR] = useState(true)
  const [acceptWallet, setAcceptWallet] = useState(true)
  const [bankName, setBankName] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [bankBranch, setBankBranch] = useState('')

  const southAfricanProvinces = [
    'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 
    'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'
  ]

  useEffect(() => {
    // Pre-fill from merchant data if available
    if (merchant) {
      setBranchName(merchant.tradingName || merchant.name || '')
    }
    if (user) {
      setBranchEmail(user.email || '')
      setBranchPhone(user.phone || '')
    }
  }, [merchant, user])

  const addStaffMember = () => {
    if (!newStaffName || !newStaffRole) return
    
    const newStaff: StaffMember = {
      id: `staff_${Date.now()}`,
      name: newStaffName,
      email: newStaffEmail,
      phone: newStaffPhone,
      role: newStaffRole,
      pin: newStaffPin || Math.floor(1000 + Math.random() * 9000).toString(),
    }
    
    setStaff([...staff, newStaff])
    setNewStaffName('')
    setNewStaffEmail('')
    setNewStaffPhone('')
    setNewStaffRole('cashier')
    setNewStaffPin('')
  }

  const removeStaffMember = (id: string) => {
    setStaff(staff.filter(s => s.id !== id))
  }

  const addProduct = () => {
    if (!newProductName || !newProductPrice) return
    
    const newProd: Product = {
      id: `prod_${Date.now()}`,
      name: newProductName,
      category: newProductCategory,
      price: parseFloat(newProductPrice),
      cost: newProductCost ? parseFloat(newProductCost) : 0,
    }
    
    setProducts([...products, newProd])
    setNewProductName('')
    setNewProductCategory('')
    setNewProductPrice('')
    setNewProductCost('')
  }

  const removeProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id))
  }

  const handleComplete = async () => {
    setIsLoading(true)
    
    try {
      // Save onboarding data
      const response = await fetch('/api/merchant/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch: {
            name: branchName,
            phone: branchPhone,
            email: branchEmail,
            address: branchAddress,
            city: branchCity,
            province: branchProvince,
            postalCode: branchPostalCode,
          },
          tradingHours,
          staff,
          products,
          payments: {
            cash: acceptCash,
            card: acceptCard,
            qr: acceptQR,
            wallet: acceptWallet,
            bankName,
            bankAccount,
            bankBranch,
          },
        }),
        credentials: 'include',
      })
      
      if (response.ok) {
        await refresh()
        router.push('/merchant-os/app')
      }
    } catch (error) {
      console.error('Onboarding save error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    if (currentStep < onboardingSteps.length - 2) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 2) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const progress = ((currentStep + 1) / onboardingSteps.length) * 100
  const StepIcon = onboardingSteps[currentStep].icon

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <img src="/groway-logo.png" alt="Groway" className="h-8 w-auto" />
              </Link>
              <Badge variant="secondary" className="text-xs">Setup Wizard</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/merchant-os/app')} className="text-xs">
              Skip for now
            </Button>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress value={progress} className="h-2" />
            </div>
            <span className="text-xs text-[#757575]">{Math.round(progress)}% complete</span>
          </div>
          <div className="flex justify-between mt-3">
            {onboardingSteps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => index <= currentStep && setCurrentStep(index)}
                className={`flex flex-col items-center gap-1 ${index <= currentStep ? 'opacity-100' : 'opacity-40'}`}
                disabled={index > currentStep}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index < currentStep 
                    ? 'bg-[#00897B] text-white' 
                    : index === currentStep 
                      ? 'bg-[#00897B] text-white' 
                      : 'bg-gray-200 text-[#757575]'
                }`}>
                  {index < currentStep ? <Check className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
                </div>
                <span className="text-[10px] font-medium hidden sm:block">{step.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#E0F2F1] flex items-center justify-center">
                <StepIcon className="h-6 w-6 text-[#00897B]" />
              </div>
              <div>
                <CardTitle>{onboardingSteps[currentStep].title}</CardTitle>
                <CardDescription>{onboardingSteps[currentStep].description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Welcome Step */}
            {currentStep === 0 && (
              <div className="text-center py-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00897B] to-[#4CAF50] mx-auto flex items-center justify-center mb-4">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Welcome to Groway, {user?.name?.split(' ')[0] || 'there'}!</h2>
                <p className="text-[#757575] max-w-md mx-auto mb-6">
                  Let's set up your Merchant OS. This will take about 5 minutes and you can skip any step.
                </p>
                <div className="bg-[#E0F2F1] rounded-lg p-4 max-w-sm mx-auto text-left">
                  <p className="text-sm font-medium text-[#00695C] mb-2">Your merchant code:</p>
                  <p className="text-2xl font-bold text-[#00897B] tracking-wider">{merchant?.code}</p>
                  <p className="text-xs text-[#757575] mt-1">Use this code for PIN login at terminals</p>
                </div>
              </div>
            )}

            {/* Branch Step */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-[#757575]">
                  Tell us about your primary location. You can add more branches later.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="branchName">Branch Name *</Label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                      <Input
                        id="branchName"
                        value={branchName}
                        onChange={(e) => setBranchName(e.target.value)}
                        placeholder="e.g. Main Branch"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="branchPhone">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                      <Input
                        id="branchPhone"
                        value={branchPhone}
                        onChange={(e) => setBranchPhone(e.target.value)}
                        placeholder="082 123 4567"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="branchEmail">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                    <Input
                      id="branchEmail"
                      type="email"
                      value={branchEmail}
                      onChange={(e) => setBranchEmail(e.target.value)}
                      placeholder="branch@example.com"
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="branchAddress">Street Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                    <Input
                      id="branchAddress"
                      value={branchAddress}
                      onChange={(e) => setBranchAddress(e.target.value)}
                      placeholder="123 Main Street"
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={branchCity}
                      onChange={(e) => setBranchCity(e.target.value)}
                      placeholder="Johannesburg"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Province</Label>
                    <Select value={branchProvince} onValueChange={setBranchProvince}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {southAfricanProvinces.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Postal Code</Label>
                    <Input
                      value={branchPostalCode}
                      onChange={(e) => setBranchPostalCode(e.target.value)}
                      placeholder="2001"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Hours Step */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-[#757575]">
                  Set your trading hours. This helps with reporting and staffing.
                </p>
                
                <div className="space-y-3">
                  {weekDays.map((day) => (
                    <div key={day.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-20">
                        <span className="font-medium">{day.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`${day.id}-closed`}
                          checked={tradingHours[day.id].closed}
                          onCheckedChange={(checked) => 
                            setTradingHours({
                              ...tradingHours,
                              [day.id]: { ...tradingHours[day.id], closed: checked as boolean }
                            })
                          }
                        />
                        <Label htmlFor={`${day.id}-closed`} className="text-sm">Closed</Label>
                      </div>
                      
                      {!tradingHours[day.id].closed && (
                        <>
                          <Input
                            type="time"
                            value={tradingHours[day.id].open}
                            onChange={(e) => 
                              setTradingHours({
                                ...tradingHours,
                                [day.id]: { ...tradingHours[day.id], open: e.target.value }
                              })
                            }
                            className="w-32"
                          />
                          <span className="text-[#757575]">to</span>
                          <Input
                            type="time"
                            value={tradingHours[day.id].close}
                            onChange={(e) => 
                              setTradingHours({
                                ...tradingHours,
                                [day.id]: { ...tradingHours[day.id], close: e.target.value }
                              })
                            }
                            className="w-32"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Staff Step */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-[#757575]">
                  Add your team members. They'll get an email invitation to join.
                </p>
                
                {/* Add staff form */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Name *</Label>
                      <Input
                        value={newStaffName}
                        onChange={(e) => setNewStaffName(e.target.value)}
                        placeholder="Staff name"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Role *</Label>
                      <Select value={newStaffRole} onValueChange={setNewStaffRole}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {staffRoles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Email</Label>
                      <Input
                        type="email"
                        value={newStaffEmail}
                        onChange={(e) => setNewStaffEmail(e.target.value)}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Phone</Label>
                      <Input
                        value={newStaffPhone}
                        onChange={(e) => setNewStaffPhone(e.target.value)}
                        placeholder="082 123 4567"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">PIN (optional)</Label>
                      <Input
                        value={newStaffPin}
                        onChange={(e) => setNewStaffPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="Auto-gen"
                        maxLength={4}
                      />
                    </div>
                  </div>
                  
                  <Button onClick={addStaffMember} variant="outline" size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-1" /> Add Staff Member
                  </Button>
                </div>
                
                {/* Staff list */}
                {staff.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Team Members ({staff.length})</Label>
                    {staff.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#E0F2F1] flex items-center justify-center">
                            <Users className="h-4 w-4 text-[#00897B]" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{member.name}</p>
                            <p className="text-xs text-[#757575]">{staffRoles.find(r => r.id === member.role)?.name} • PIN: {member.pin}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeStaffMember(member.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {staff.length === 0 && (
                  <div className="text-center py-8 text-[#757575]">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No staff members added yet</p>
                    <p className="text-xs">You can always add them later</p>
                  </div>
                )}
              </div>
            )}

            {/* Products Step */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <p className="text-sm text-[#757575]">
                  Add a few products to get started. You can import more later.
                </p>
                
                {/* Add product form */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Product Name *</Label>
                      <Input
                        value={newProductName}
                        onChange={(e) => setNewProductName(e.target.value)}
                        placeholder="e.g. Beef Burger"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Category</Label>
                      <Input
                        value={newProductCategory}
                        onChange={(e) => setNewProductCategory(e.target.value)}
                        placeholder="e.g. Mains"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Selling Price *</Label>
                      <Input
                        type="number"
                        value={newProductPrice}
                        onChange={(e) => setNewProductPrice(e.target.value)}
                        placeholder="R 0.00"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Cost Price</Label>
                      <Input
                        type="number"
                        value={newProductCost}
                        onChange={(e) => setNewProductCost(e.target.value)}
                        placeholder="R 0.00"
                      />
                    </div>
                  </div>
                  
                  <Button onClick={addProduct} variant="outline" size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-1" /> Add Product
                  </Button>
                </div>
                
                {/* Product list */}
                {products.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Products ({products.length})</Label>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {products.map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-[#E0F2F1] flex items-center justify-center">
                              <Package className="h-4 w-4 text-[#00897B]" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{product.name}</p>
                              <p className="text-xs text-[#757575]">{product.category || 'Uncategorized'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-sm">R{product.price.toFixed(2)}</span>
                            <Button variant="ghost" size="sm" onClick={() => removeProduct(product.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {products.length === 0 && (
                  <div className="text-center py-8 text-[#757575]">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No products added yet</p>
                    <p className="text-xs">You can import products from a spreadsheet later</p>
                  </div>
                )}
              </div>
            )}

            {/* Payments Step */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <p className="text-sm text-[#757575]">
                  Choose which payment methods you'll accept.
                </p>
                
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Accepted Payment Methods</Label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium">Cash</span>
                      <Switch checked={acceptCash} onCheckedChange={setAcceptCash} />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium">Card</span>
                      <Switch checked={acceptCard} onCheckedChange={setAcceptCard} />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium">QR Payment</span>
                      <Switch checked={acceptQR} onCheckedChange={setAcceptQR} />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium">Wallet</span>
                      <Switch checked={acceptWallet} onCheckedChange={setAcceptWallet} />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 pt-4 border-t">
                  <Label className="text-sm font-medium">Settlement Bank Account</Label>
                  <p className="text-xs text-[#757575]">Where we'll deposit your payments</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Bank Name</Label>
                      <Select value={bankName} onValueChange={setBankName}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bank" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fnb">FNB</SelectItem>
                          <SelectItem value="standard">Standard Bank</SelectItem>
                          <SelectItem value="absa">Absa</SelectItem>
                          <SelectItem value="capitec">Capitec</SelectItem>
                          <SelectItem value="nedbank">Nedbank</SelectItem>
                          <SelectItem value="african">African Bank</SelectItem>
                          <SelectItem value="tyme">TymeBank</SelectItem>
                          <SelectItem value="discovery">Discovery Bank</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Branch Code</Label>
                      <Input
                        value={bankBranch}
                        onChange={(e) => setBankBranch(e.target.value)}
                        placeholder="e.g. 250655"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="Enter your account number"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Complete Step */}
            {currentStep === 6 && (
              <div className="text-center py-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00897B] to-[#4CAF50] mx-auto flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">You're All Set!</h2>
                <p className="text-[#757575] max-w-md mx-auto mb-6">
                  Your Merchant OS is ready. Start adding products, processing sales, and growing your business.
                </p>
                
                <div className="bg-[#E0F2F1] rounded-lg p-4 max-w-sm mx-auto text-left space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-[#757575]">Branch</span>
                    <span className="text-sm font-medium">{branchName || 'Main Branch'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#757575]">Staff</span>
                    <span className="text-sm font-medium">{staff.length + 1} members</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#757575]">Products</span>
                    <span className="text-sm font-medium">{products.length} items</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#757575]">Payments</span>
                    <span className="text-sm font-medium">
                      {[acceptCash && 'Cash', acceptCard && 'Card', acceptQR && 'QR', acceptWallet && 'Wallet'].filter(Boolean).join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              
              <div className="flex gap-2">
                {currentStep > 0 && currentStep < onboardingSteps.length - 1 && (
                  <Button variant="ghost" onClick={handleSkip}>
                    Skip
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  disabled={isLoading}
                  className="bg-[#00897B] hover:bg-[#00695C] text-white"
                >
                  {isLoading ? (
                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                  ) : currentStep === onboardingSteps.length - 1 ? (
                    <>Go to Dashboard</>
                  ) : (
                    <>Continue <ArrowRight className="h-4 w-4 ml-2" /></>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-4 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 text-center text-xs text-[#757575]">
          <p>Need help? Contact support@groway.co.za or call 0861 GROWAY</p>
        </div>
      </footer>
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [merchant, setMerchant] = useState<AuthMerchant | null>(null)
  const [branchId, setBranchId] = useState<string | null>(null)
  const [role, setRole] = useState<string>('staff')

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUser(data.user)
          setMerchant(data.merchant)
          setBranchId(data.branchId)
          setRole(data.role)
          return { authenticated: true }
        }
      }
      return { authenticated: false }
    } catch (error) {
      console.error('Auth check error:', error)
      return { authenticated: false }
    }
  }

  const refresh = async () => {
    await checkAuth()
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
    setUser(null)
    setMerchant(null)
    router.push('/merchant-os/login')
  }

  useEffect(() => {
    const init = async () => {
      const result = await checkAuth()
      
      if (!result.authenticated) {
        router.push('/merchant-os/login')
      }
      
      setIsLoading(false)
    }
    init()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#00897B] mx-auto" />
          <p className="text-sm text-[#757575]">Verifying session...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      merchant, 
      branchId, 
      role, 
      isLoading: false, 
      isAuthenticated: true,
      refresh,
      logout
    }}>
      <OnboardingContent />
    </AuthContext.Provider>
  )
}
