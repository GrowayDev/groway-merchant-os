'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Store, 
  ArrowRight, 
  ArrowLeft, 
  Loader2,
  CheckCircle2,
  Building2,
  User,
  MapPin,
  FileText,
  Sparkles,
  Utensils,
  Wine,
  ShoppingBag,
  Scissors,
  Shirt,
  Pill,
  Hotel,
  Wrench,
  Smartphone,
  Dumbbell,
  Baby,
  Building,
  LucideIcon
} from 'lucide-react'

// Business verticals with icons
const verticals: { id: string; name: string; icon: LucideIcon; subVerticals: string[] }[] = [
  { 
    id: 'fnb', 
    name: 'Food & Beverage', 
    icon: Utensils,
    subVerticals: ['Quick Service Restaurant', 'Sit-Down Restaurant', 'Shisa Nyama', 'Coffee Shop', 'Bakery', 'Food Truck', 'Cloud Kitchen', 'Catering']
  },
  { 
    id: 'liquor', 
    name: 'Liquor & Nightlife', 
    icon: Wine,
    subVerticals: ['Liquor Store', 'Bar/Pub', 'Nightclub', 'Shebeen', 'Bottle Store', 'Wine Farm']
  },
  { 
    id: 'grocery', 
    name: 'Grocery & FMCG', 
    icon: ShoppingBag,
    subVerticals: ['Superette', 'Spaza Shop', 'Butchery', 'Deli', 'Farm Stall', 'Cash & Carry']
  },
  { 
    id: 'health-beauty', 
    name: 'Health & Beauty', 
    icon: Scissors,
    subVerticals: ['Hair Salon', 'Barber Shop', 'Nail Salon', 'Spa & Wellness', 'Aesthetic Clinic', 'Tattoo Studio']
  },
  { 
    id: 'fashion', 
    name: 'Fashion & Apparel', 
    icon: Shirt,
    subVerticals: ['Clothing Boutique', 'Shoe Store', 'Accessories', 'Uniform Supplier', 'Second-hand/Thrift']
  },
  { 
    id: 'health-pharmacy', 
    name: 'Health & Pharmacy', 
    icon: Pill,
    subVerticals: ['Full Pharmacy', 'Health Shop (OTC)', 'Herbal Medicine', 'Optometry', 'Dentistry', 'Veterinary']
  },
  { 
    id: 'hospitality', 
    name: 'Hospitality', 
    icon: Hotel,
    subVerticals: ['Hotel', 'Guest House', 'B&B', 'Backpackers', 'Lodge', 'Self-Catering']
  },
  { 
    id: 'hardware', 
    name: 'Hardware & Building', 
    icon: Wrench,
    subVerticals: ['Hardware Store', 'Building Supplies', 'Paint Shop', 'Plumbing', 'Electrical', 'Agri-Supply']
  },
  { 
    id: 'electronics', 
    name: 'Electronics & Tech', 
    icon: Smartphone,
    subVerticals: ['Phone & Accessories', 'Computer & IT', 'Electronics Retail', 'Repair Workshop']
  },
  { 
    id: 'sport-leisure', 
    name: 'Sport & Leisure', 
    icon: Dumbbell,
    subVerticals: ['Gym', 'Fitness Studio', 'Sports Club', 'Events Venue', 'Entertainment Centre']
  },
  { 
    id: 'childcare', 
    name: 'Childcare & Education', 
    icon: Baby,
    subVerticals: ['Crèche/Daycare', 'After-School Care', 'Tutoring Centre', 'Driving School', 'Skills Training']
  },
  { 
    id: 'professional', 
    name: 'Professional Services', 
    icon: Building,
    subVerticals: ['Auto Repair', 'Dry Cleaning', 'Funeral Home', 'Legal Services', 'Accounting']
  },
]

interface OnboardingWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: (data: { merchantId: string; token: string }) => void
}

export function OnboardingWizard({ open, onOpenChange, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    // User info
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    
    // Business info
    merchantName: '',
    tradingName: '',
    vertical: '',
    subVertical: '',
    
    // Address
    addressLine1: '',
    city: '',
    province: '',
    postalCode: '',
    
    // Business details
    vatRegistered: false,
    vatNumber: '',
    registrationNumber: ''
  })

  const totalSteps = 4
  const progress = (step / totalSteps) * 100

  const selectedVertical = verticals.find(v => v.id === formData.vertical)

  const updateForm = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const validateStep = (): boolean => {
    switch (step) {
      case 1:
        if (!formData.email || !formData.password || !formData.name) {
          setError('Please fill in all required fields')
          return false
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters')
          return false
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match')
          return false
        }
        return true
      
      case 2:
        if (!formData.merchantName || !formData.vertical || !formData.subVertical) {
          setError('Please select your business type')
          return false
        }
        return true
      
      case 3:
        if (!formData.addressLine1 || !formData.city || !formData.province) {
          setError('Please enter your business address')
          return false
        }
        return true
      
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => Math.min(prev + 1, totalSteps))
    }
  }

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1))
    setError(null)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/merchant-os/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          merchantName: formData.merchantName,
          tradingName: formData.tradingName || formData.merchantName,
          vertical: formData.vertical,
          subVertical: formData.subVertical,
          addressLine1: formData.addressLine1,
          city: formData.city,
          province: formData.province,
          postalCode: formData.postalCode,
          vatRegistered: formData.vatRegistered,
          vatNumber: formData.vatNumber,
          registrationNumber: formData.registrationNumber
        })
      })

      const result = await response.json()

      if (result.success) {
        // Store token
        document.cookie = `auth_token=${result.data.token}; path=/; max-age=${7 * 24 * 60 * 60}`
        
        onComplete({
          merchantId: result.data.merchant.id,
          token: result.data.token
        })
        
        // Reset form
        setStep(1)
        setFormData({
          email: '', password: '', confirmPassword: '', name: '', phone: '',
          merchantName: '', tradingName: '', vertical: '', subVertical: '',
          addressLine1: '', city: '', province: '', postalCode: '',
          vatRegistered: false, vatNumber: '', registrationNumber: ''
        })
      } else {
        setError(result.error || 'Failed to create account')
      }
    } catch (err) {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-[#E0F2F1] flex items-center justify-center mx-auto mb-3">
                <User className="h-6 w-6 text-[#00897B]" />
              </div>
              <h3 className="font-semibold text-lg">Create Your Account</h3>
              <p className="text-sm text-gray-500">Enter your details to get started</p>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="John Smith"
                  value={formData.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@business.com"
                  value={formData.email}
                  onChange={(e) => updateForm('email', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="+27 00 000 0000"
                  value={formData.phone}
                  onChange={(e) => updateForm('phone', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => updateForm('password', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => updateForm('confirmPassword', e.target.value)}
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-[#E0F2F1] flex items-center justify-center mx-auto mb-3">
                <Store className="h-6 w-6 text-[#00897B]" />
              </div>
              <h3 className="font-semibold text-lg">Tell Us About Your Business</h3>
              <p className="text-sm text-gray-500">We'll customize the system for your industry</p>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="merchantName">Business Name *</Label>
                <Input
                  id="merchantName"
                  placeholder="My Business"
                  value={formData.merchantName}
                  onChange={(e) => updateForm('merchantName', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="tradingName">Trading Name (if different)</Label>
                <Input
                  id="tradingName"
                  placeholder="Trading As..."
                  value={formData.tradingName}
                  onChange={(e) => updateForm('tradingName', e.target.value)}
                />
              </div>

              <div>
                <Label>Select Your Industry *</Label>
                <div className="grid grid-cols-3 gap-2 mt-2 max-h-[200px] overflow-y-auto">
                  {verticals.map((v) => {
                    const Icon = v.icon
                    return (
                      <button
                        key={v.id}
                        type="button"
                        className={`p-3 rounded-lg border text-center transition-all ${
                          formData.vertical === v.id
                            ? 'border-[#00897B] bg-[#E0F2F1]'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          updateForm('vertical', v.id)
                          updateForm('subVertical', '')
                        }}
                      >
                        <Icon className={`h-5 w-5 mx-auto mb-1 ${
                          formData.vertical === v.id ? 'text-[#00897B]' : 'text-gray-400'
                        }`} />
                        <span className="text-xs font-medium">{v.name.split(' ')[0]}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {selectedVertical && (
                <div>
                  <Label>Business Type *</Label>
                  <Select
                    value={formData.subVertical}
                    onValueChange={(v) => updateForm('subVertical', v)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedVertical.subVerticals.map((sv) => (
                        <SelectItem key={sv} value={sv.toLowerCase().replace(/[^a-z]/g, '_')}>
                          {sv}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-[#E0F2F1] flex items-center justify-center mx-auto mb-3">
                <MapPin className="h-6 w-6 text-[#00897B]" />
              </div>
              <h3 className="font-semibold text-lg">Business Location</h3>
              <p className="text-sm text-gray-500">Where is your business located?</p>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="addressLine1">Street Address *</Label>
                <Input
                  id="addressLine1"
                  placeholder="123 Main Street"
                  value={formData.addressLine1}
                  onChange={(e) => updateForm('addressLine1', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="Johannesburg"
                    value={formData.city}
                    onChange={(e) => updateForm('city', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="province">Province *</Label>
                  <Select
                    value={formData.province}
                    onValueChange={(v) => updateForm('province', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gp">Gauteng</SelectItem>
                      <SelectItem value="wc">Western Cape</SelectItem>
                      <SelectItem value="kzn">KwaZulu-Natal</SelectItem>
                      <SelectItem value="ec">Eastern Cape</SelectItem>
                      <SelectItem value="fs">Free State</SelectItem>
                      <SelectItem value="lp">Limpopo</SelectItem>
                      <SelectItem value="mp">Mpumalanga</SelectItem>
                      <SelectItem value="nw">North West</SelectItem>
                      <SelectItem value="nc">Northern Cape</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  placeholder="2000"
                  value={formData.postalCode}
                  onChange={(e) => updateForm('postalCode', e.target.value)}
                />
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-[#E0F2F1] flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-[#00897B]" />
              </div>
              <h3 className="font-semibold text-lg">Business Details</h3>
              <p className="text-sm text-gray-500">Optional registration details</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="vatRegistered"
                  checked={formData.vatRegistered}
                  onChange={(e) => updateForm('vatRegistered', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="vatRegistered" className="font-normal">
                  VAT Registered
                </Label>
              </div>

              {formData.vatRegistered && (
                <div>
                  <Label htmlFor="vatNumber">VAT Number</Label>
                  <Input
                    id="vatNumber"
                    placeholder="48XXXXXXXXXX"
                    value={formData.vatNumber}
                    onChange={(e) => updateForm('vatNumber', e.target.value)}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="registrationNumber">Company Registration Number</Label>
                <Input
                  id="registrationNumber"
                  placeholder="20XX/XXXXXX/XX"
                  value={formData.registrationNumber}
                  onChange={(e) => updateForm('registrationNumber', e.target.value)}
                />
              </div>

              <div className="mt-6 p-4 bg-[#E0F2F1] rounded-lg">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-[#00897B] mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">You're almost there!</p>
                    <p className="text-xs text-gray-600 mt-1">
                      We'll set up your dashboard with pre-configured products, 
                      categories, and settings tailored for your business type.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="sr-only">Business Registration</DialogTitle>
          <DialogDescription className="sr-only">
            Register your business on Merchant OS
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        {renderStep()}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            <span>{error}</span>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <Button variant="outline" onClick={handleBack} disabled={loading}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          
          <div className="flex-1" />
          
          {step < totalSteps ? (
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]"
              onClick={handleNext}
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              className="bg-[#00897B] hover:bg-[#00695C]"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Complete Registration
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
