'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Store, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  ArrowLeft,
  User,
  Phone,
  Building2,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Utensils,
  Wine,
  ShoppingBag,
  Scissors,
  Pill,
  Hotel,
  Wrench,
  Smartphone,
  Dumbbell,
  Baby,
  Shirt,
  Sparkles,
  Crown,
  Zap,
  Star,
  CreditCard,
  Building,
  Landmark,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

// Subscription Plans
const subscriptionPlans = [
  {
    id: 'starter',
    code: 'starter',
    name: 'Starter',
    price: 299,
    description: 'Perfect for small businesses getting started',
    color: '#6B7280',
    icon: Store,
    features: [
      'Point of Sale (POS)',
      'Inventory Management',
      'Basic Reports',
      'Customer Management',
      'Mobile App Access',
      'Up to 2 Users',
      '1 Location'
    ],
    limits: { users: 2, branches: 1, products: 500 },
    trialDays: 14
  },
  {
    id: 'pro',
    code: 'pro',
    name: 'Pro',
    price: 499,
    description: 'For growing businesses with advanced needs',
    color: '#00897B',
    icon: Zap,
    isPopular: true,
    features: [
      'Everything in Starter',
      'Accounting & Finance',
      'Multi-Location Support',
      'Staff Management',
      'Integrations',
      'Loyalty Program',
      'Online Store',
      'Up to 10 Users',
      '3 Locations'
    ],
    limits: { users: 10, branches: 3, products: 5000 },
    trialDays: 14
  },
  {
    id: 'enterprise',
    code: 'enterprise',
    name: 'Enterprise',
    price: 999,
    description: 'For large operations with unlimited features',
    color: '#7C3AED',
    icon: Crown,
    features: [
      'Everything in Pro',
      'API Access',
      'White Label Options',
      'Priority Support',
      'Custom Reports',
      'Audit Logs',
      'GroSupply Pro',
      'GroCredit Access',
      'Up to 50 Users',
      '10 Locations'
    ],
    limits: { users: 50, branches: 10, products: 50000 },
    trialDays: 30
  }
]

// Business Verticals with icons
const businessVerticals = [
  { id: 'food_beverage', name: 'Food & Beverage', icon: Utensils, subVerticals: ['QSR', 'Sit-down Restaurant', 'Shisa Nyama', 'Coffee Shop', 'Bakery', 'Food Truck', 'Cloud Kitchen', 'Catering'] },
  { id: 'liquor_nightlife', name: 'Liquor & Nightlife', icon: Wine, subVerticals: ['Liquor Store', 'Bar/Pub', 'Nightclub', 'Shebeen', 'Bottle Store', 'Wine Farm'] },
  { id: 'grocery_fmcg', name: 'Grocery & FMCG', icon: ShoppingBag, subVerticals: ['Superette', 'Spaza Shop', 'Butchery', 'Deli', 'Farm Stall', 'Cash & Carry', 'Bakery Retail'] },
  { id: 'health_beauty', name: 'Health & Beauty', icon: Scissors, subVerticals: ['Hair Salon', 'Barber', 'Nail Salon', 'Spa & Wellness', 'Aesthetic Clinic', 'Tattoo Studio', 'Lash & Brow'] },
  { id: 'health_pharmacy', name: 'Health & Pharmacy', icon: Pill, subVerticals: ['Full Pharmacy', 'Health Shop', 'Herbal Medicine', 'Optometry', 'Dentistry', 'Veterinary'] },
  { id: 'hospitality', name: 'Hospitality', icon: Hotel, subVerticals: ['Hotel', 'Guest House', 'B&B', 'Backpackers', 'Lodge', 'Self-Catering', 'Airbnb-style'] },
  { id: 'hardware_building', name: 'Hardware & Building', icon: Wrench, subVerticals: ['Hardware Store', 'Building Supplies', 'Paint Shop', 'Plumbing', 'Electrical', 'Agri-Supply'] },
  { id: 'electronics_tech', name: 'Electronics & Tech', icon: Smartphone, subVerticals: ['Phone & Accessories', 'Computer & IT', 'Electronics Retail', 'Repair Workshop'] },
  { id: 'sport_leisure', name: 'Sport & Leisure', icon: Dumbbell, subVerticals: ['Gym', 'Fitness Studio', 'Sports Club', 'Events Venue', 'Entertainment Centre', 'Escape Room'] },
  { id: 'childcare_education', name: 'Childcare & Education', icon: Baby, subVerticals: ['Crèche/Daycare', 'After-School Care', 'Tutoring Centre', 'Driving School', 'Skills Training'] },
  { id: 'fashion_apparel', name: 'Fashion & Apparel', icon: Shirt, subVerticals: ['Clothing Boutique', 'Shoe Store', 'Accessories', 'Uniform Supplier', 'Thrift', 'Tailor'] },
  { id: 'professional_services', name: 'Professional Services', icon: Building2, subVerticals: ['Auto Repair', 'Dry Cleaning', 'Funeral Home', 'Legal Services', 'Accounting', 'Consulting'] },
]

// EFT Payment Details
const eftDetails = {
  bankName: 'FNB Bank',
  accountHolder: 'Groway (Pty) Ltd',
  accountNumber: '63100111169',
  branchCode: '250655',
}

function SignupPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [signupMethod, setSignupMethod] = useState<'email' | 'google' | 'apple' | null>(null)
  const [socialLoginDone, setSocialLoginDone] = useState(false)
  const [oauthProviderId, setOauthProviderId] = useState<string | null>(null)
  const [oauthAvatar, setOauthAvatar] = useState<string | null>(null)
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    vertical: '',
    subVertical: '',
    planCode: searchParams.get('plan') || 'pro',
    paymentMethod: 'trial' // trial, eft, paystack
  })

  const selectedVertical = businessVerticals.find(v => v.id === formData.vertical)
  const selectedPlan = subscriptionPlans.find(p => p.code === formData.planCode)

  // Handle OAuth callback parameters on mount
  useEffect(() => {
    const oauthProvider = searchParams.get('oauth_provider')
    const oauthEmail = searchParams.get('oauth_email')
    const oauthName = searchParams.get('oauth_name')
    const oauthId = searchParams.get('oauth_id')
    const oauthAvatarParam = searchParams.get('oauth_avatar')
    const errorParam = searchParams.get('error')

    if (errorParam) {
      setError(`OAuth error: ${errorParam}. Please try again.`)
      return
    }

    if (oauthProvider && oauthEmail) {
      // User returned from OAuth
      setSignupMethod(oauthProvider as 'google' | 'apple')
      setSocialLoginDone(true)
      setOauthProviderId(oauthId)
      setOauthAvatar(oauthAvatarParam)
      
      setFormData(prev => ({
        ...prev,
        name: oauthName || 'New User',
        email: oauthEmail,
        // Generate a secure random password for OAuth users
        password: 'OAuth_' + Math.random().toString(36).slice(-12) + '!A1',
        confirmPassword: '',
      }))
      
      // Set confirm password after state updates
      setTimeout(() => {
        setFormData(prev => ({
          ...prev,
          confirmPassword: prev.password,
        }))
      }, 0)
      
      // Move to step 3 (business details) since account is already set
      setStep(3)
    }
  }, [searchParams])

  // Generate EFT reference
  const generateEFTReference = () => {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const cleanName = formData.businessName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 10)
    return `GRO-${cleanName}-${date}`
  }

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  // Real OAuth redirect - redirects to OAuth provider
  const handleSocialSignup = (provider: 'google' | 'apple') => {
    setSignupMethod(provider)
    setIsLoading(true)
    setError('')
    
    // Redirect to OAuth authorize endpoint
    const planCode = formData.planCode || 'pro'
    const redirectUrl = '/merchant-os/signup'
    
    if (provider === 'google') {
      window.location.href = `/api/auth/oauth/google/authorize?plan=${planCode}&redirect=${encodeURIComponent(redirectUrl)}`
    } else {
      window.location.href = `/api/auth/oauth/apple/authorize?plan=${planCode}&redirect=${encodeURIComponent(redirectUrl)}`
    }
    // No need to set isLoading to false - we're redirecting
  }

  const handleNext = () => {
    if (step === 1) {
      if (!formData.planCode) {
        setError('Please select a plan')
        return
      }
      setStep(2)
    } else if (step === 2) {
      // For social logins, password validation is skipped
      if (socialLoginDone) {
        // Social login - name and email are already filled
        if (!formData.name || !formData.email) {
          setError('Please fill in your name and email')
          return
        }
      } else {
        // Email signup - require password validation
        if (!formData.name || !formData.email || !formData.password) {
          setError('Please fill in all required fields')
          return
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match')
          return
        }
        if (formData.password.length < 8) {
          setError('Password must be at least 8 characters')
          return
        }
      }
      setStep(3)
    } else if (step === 3) {
      if (!formData.businessName || !formData.vertical || !formData.subVertical) {
        setError('Please select your business type')
        return
      }
      setStep(4) // Payment step
    } else if (step === 4) {
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          businessName: formData.businessName,
          vertical: formData.vertical,
          subVertical: formData.subVertical,
          planCode: formData.planCode,
          authProvider: signupMethod || 'email',
          authProviderId: oauthProviderId,
          avatarUrl: oauthAvatar,
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Set cookie for middleware auth
        const sessionData = {
          userId: data.user.id,
          merchantId: data.merchant.id,
          branchId: data.branch.id,
          token: data.token
        }
        document.cookie = `groway_session=${encodeURIComponent(JSON.stringify(sessionData))}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
        
        localStorage.setItem('groway_session', JSON.stringify({
          user: data.user,
          merchant: data.merchant,
          branch: data.branch,
          token: data.token
        }))
        router.push('/merchant-os/app')
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const progress = (step / 4) * 100

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#00695C] via-[#00897B] to-[#4CAF50]">
      {/* Header */}
      <header className="p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/merchant-os" className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to Overview</span>
          </Link>
          <img src="/groway-logo.png" alt="Groway" className="h-8 w-auto" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <Card className="border-0 shadow-2xl">
            <CardHeader className="text-center pb-2">
              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {[1, 2, 3, 4].map((s) => (
                    <Badge key={s} className={step >= s ? 'bg-[#00897B]' : 'bg-[#E0E0E0]'}>
                      {s}. {s === 1 ? 'Plan' : s === 2 ? 'Account' : s === 3 ? 'Business' : 'Payment'}
                    </Badge>
                  ))}
                </div>
                <Progress value={progress} className="h-1" />
              </div>

              <div className="w-16 h-16 mx-auto mb-4 bg-[#E0F2F1] text-[#00897B] rounded-xl flex items-center justify-center">
                <Store className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl font-bold text-[#1A1A1A]">
                {step === 1 ? 'Choose Your Plan' : step === 2 ? 'Create Your Account' : step === 3 ? 'Tell Us About Your Business' : 'Start Your Free Trial'}
              </CardTitle>
              <CardDescription>
                {step === 1 
                  ? 'Start with a free trial. No credit card required.'
                  : step === 2
                  ? 'Sign up with Google, Apple, or your email.'
                  : step === 3
                  ? 'We\'ll customize your Merchant OS experience.'
                  : 'Your trial starts now. Add payment details anytime.'
                }
              </CardDescription>
            </CardHeader>

            <CardContent>
              {step === 1 ? (
                /* Plan Selection */
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {subscriptionPlans.map((plan) => (
                      <div
                        key={plan.code}
                        onClick={() => updateFormData('planCode', plan.code)}
                        className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                          formData.planCode === plan.code
                            ? 'border-[#00897B] bg-[#E0F2F1] shadow-lg'
                            : 'border-gray-200 hover:border-[#00897B]/50 hover:bg-gray-50'
                        }`}
                      >
                        {plan.isPopular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <Badge className="bg-[#00897B] text-white">
                              <Star className="h-3 w-3 mr-1" />
                              Most Popular
                            </Badge>
                          </div>
                        )}
                        
                        <div className="text-center mb-4">
                          <div 
                            className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${plan.color}20`, color: plan.color }}
                          >
                            <plan.icon className="h-6 w-6" />
                          </div>
                          <h3 className="text-lg font-bold text-[#1A1A1A]">{plan.name}</h3>
                          <p className="text-sm text-[#757575] mt-1">{plan.description}</p>
                        </div>
                        
                        <div className="text-center mb-4">
                          <span className="text-3xl font-bold text-[#1A1A1A]">R{plan.price}</span>
                          <span className="text-[#757575]">/month</span>
                        </div>
                        
                        <div className="space-y-2">
                          {plan.features.slice(0, 5).map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-[#424242]">
                              <CheckCircle2 className="h-4 w-4 text-[#00897B] flex-shrink-0" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-[#E0F2F1] rounded-lg p-4 text-center">
                    <p className="text-sm text-[#00897B]">
                      <strong>Free {selectedPlan?.trialDays}-day trial</strong> • No credit card required • Cancel anytime
                    </p>
                  </div>
                  
                  {/* Social Login Buttons on Plan Selection */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-center text-sm text-[#757575] mb-4">
                      Or get started quickly with:
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-12 px-6 border-gray-300 hover:bg-gray-50"
                        onClick={() => handleSocialSignup('google')}
                        disabled={isLoading}
                      >
                        {isLoading && signupMethod === 'google' ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                        )}
                        Continue with Google
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        className="h-12 px-6 border-gray-300 hover:bg-gray-50"
                        onClick={() => handleSocialSignup('apple')}
                        disabled={isLoading}
                      >
                        {isLoading && signupMethod === 'apple' ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                          </svg>
                        )}
                        Continue with Apple
                      </Button>
                    </div>
                  </div>
                </div>
              ) : step === 2 ? (
                /* Account Details with Social Login */
                <div className="space-y-6">
                  {/* Show social login indicator if logged in via social */}
                  {socialLoginDone && signupMethod && (
                    <div className="bg-[#E0F2F1] rounded-lg p-4 flex items-center gap-3">
                      {signupMethod === 'google' ? (
                        <svg className="h-6 w-6" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      ) : (
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                        </svg>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#00897B]">
                          Signed in with {signupMethod === 'google' ? 'Google' : 'Apple'}
                        </p>
                        <p className="text-xs text-[#757575]">{formData.email}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSocialLoginDone(false)
                          setSignupMethod(null)
                          setFormData(prev => ({ ...prev, name: '', email: '', password: '', confirmPassword: '' }))
                        }}
                        className="text-xs text-[#757575]"
                      >
                        Change
                      </Button>
                    </div>
                  )}
                  
                  {/* Social Login Buttons - only show if not already logged in via social */}
                  {!socialLoginDone && (
                    <>
                      <div className="space-y-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-12 border-gray-300 hover:bg-gray-50"
                          onClick={() => handleSocialSignup('google')}
                          disabled={isLoading}
                        >
                          {isLoading && signupMethod === 'google' ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                          )}
                          Continue with Google
                        </Button>
                        
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-12 border-gray-300 hover:bg-gray-50"
                          onClick={() => handleSocialSignup('apple')}
                          disabled={isLoading}
                        >
                          {isLoading && signupMethod === 'apple' ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                            </svg>
                          )}
                          Continue with Apple
                        </Button>
                      </div>
                      
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white px-2 text-[#757575]">Or continue with email</span>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Email Form */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                        <Input
                          id="name"
                          placeholder="Your full name"
                          value={formData.name}
                          onChange={(e) => updateFormData('name', e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={formData.email}
                          onChange={(e) => updateFormData('email', e.target.value)}
                          className="pl-10"
                          required
                          disabled={socialLoginDone}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+27 00 000 0000"
                          value={formData.phone}
                          onChange={(e) => updateFormData('phone', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* Password fields - only show for email signup */}
                    {!socialLoginDone && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password *</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                            <Input
                              id="password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Min 8 characters"
                              value={formData.password}
                              onChange={(e) => updateFormData('password', e.target.value)}
                              className="pl-10 pr-10"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#757575] hover:text-[#1A1A1A]"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm Password *</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                            <Input
                              id="confirmPassword"
                              type="password"
                              placeholder="Confirm your password"
                              value={formData.confirmPassword}
                              onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Selected Plan Summary */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${selectedPlan?.color}20`, color: selectedPlan?.color }}
                      >
                        {selectedPlan?.icon && <selectedPlan.icon className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{selectedPlan?.name} Plan</p>
                        <p className="text-xs text-[#757575]">R{selectedPlan?.price}/month • {selectedPlan?.trialDays} day free trial</p>
                      </div>
                    </div>
                    <button onClick={() => setStep(1)} className="text-xs text-[#00897B] hover:underline">
                      Change
                    </button>
                  </div>
                </div>
              ) : step === 3 ? (
                /* Business Details */
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                      <Input
                        id="businessName"
                        placeholder="Your business name"
                        value={formData.businessName}
                        onChange={(e) => updateFormData('businessName', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Business Type *</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {businessVerticals.map((vertical) => (
                        <button
                          key={vertical.id}
                          type="button"
                          onClick={() => {
                            updateFormData('vertical', vertical.id)
                            updateFormData('subVertical', '')
                          }}
                          className={`flex flex-col items-center p-3 rounded-lg border transition-all ${
                            formData.vertical === vertical.id
                              ? 'border-[#00897B] bg-[#E0F2F1] text-[#00897B]'
                              : 'border-gray-200 hover:border-[#00897B]/50 hover:bg-[#FAFAFA]'
                          }`}
                        >
                          <vertical.icon className="h-5 w-5 mb-1" />
                          <span className="text-[10px] font-medium text-center leading-tight">
                            {vertical.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedVertical && (
                    <div className="space-y-2">
                      <Label>Specific Business Category *</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {selectedVertical.subVerticals.map((subVertical) => (
                          <button
                            key={subVertical}
                            type="button"
                            onClick={() => updateFormData('subVertical', subVertical)}
                            className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                              formData.subVertical === subVertical
                                ? 'border-[#00897B] bg-[#00897B] text-white'
                                : 'border-gray-200 hover:border-[#00897B]/50'
                            }`}
                          >
                            {subVertical}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.vertical && formData.subVertical && (
                    <div className="bg-[#E0F2F1] rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-4 w-4 text-[#00897B]" />
                        <span className="text-sm font-medium text-[#00897B]">
                          Auto-Configured For You
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {['Chart of Accounts', 'SKU Catalogue', 'POS Layout', 'Compliance Rules'].map((item) => (
                          <div key={item} className="flex items-center gap-1.5 text-xs text-[#1A1A1A]">
                            <CheckCircle2 className="h-3 w-3 text-[#00897B]" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Payment Step - Start Trial */
                <div className="space-y-6">
                  <div className="bg-[#E0F2F1] rounded-lg p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-[#00897B] rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">
                      Start Your {selectedPlan?.trialDays}-Day Free Trial
                    </h3>
                    <p className="text-sm text-[#757575]">
                      No payment required now. Add payment details anytime during your trial.
                    </p>
                  </div>
                  
                  {/* Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#757575]">Business Name:</span>
                      <span className="font-medium text-[#1A1A1A]">{formData.businessName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#757575]">Business Type:</span>
                      <span className="font-medium text-[#1A1A1A]">{formData.subVertical}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#757575]">Plan:</span>
                      <span className="font-medium text-[#1A1A1A]">{selectedPlan?.name} (R{selectedPlan?.price}/month)</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-[#757575]">Trial Period:</span>
                      <span className="font-medium text-[#00897B]">{selectedPlan?.trialDays} days FREE</span>
                    </div>
                  </div>
                  
                  {/* EFT Details for reference */}
                  <div className="bg-[#FAFAFA] rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Building className="h-4 w-4 text-[#757575]" />
                      <span className="text-sm font-medium text-[#1A1A1A]">Payment Details (for later)</span>
                    </div>
                    <div className="space-y-1 text-xs text-[#757575]">
                      <p><strong>Bank:</strong> {eftDetails.bankName}</p>
                      <p><strong>Account:</strong> {eftDetails.accountHolder}</p>
                      <p><strong>Acc No:</strong> {eftDetails.accountNumber}</p>
                      <p><strong>Ref:</strong> <span className="font-mono">{generateEFTReference()}</span></p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-800">
                      By starting your trial, you agree to our Terms of Service and Privacy Policy. 
                      You can cancel anytime before your trial ends.
                    </p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-6 flex gap-3">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    className="flex-1"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isLoading}
                  className="flex-1 bg-[#00897B] hover:bg-[#00695C] text-white font-medium py-5"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : step === 4 ? (
                    'Start Free Trial'
                  ) : (
                    <>
                      Continue
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-2 border-t pt-6">
              <p className="text-sm text-[#757575] text-center">
                Already have an account?
              </p>
              <Link href="/merchant-os/login" className="text-[#00897B] font-medium hover:underline">
                Sign In Instead
              </Link>
            </CardFooter>
          </Card>

          {/* Trust Info */}
          <div className="mt-6 text-center">
            <p className="text-sm text-white/80">
              Free trial • No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

// Loading fallback component
function SignupLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#00695C] via-[#00897B] to-[#4CAF50]">
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    </div>
  )
}

// Wrap in Suspense for useSearchParams
export default function SignupPage() {
  return (
    <Suspense fallback={<SignupLoading />}>
      <SignupPageContent />
    </Suspense>
  )
}
