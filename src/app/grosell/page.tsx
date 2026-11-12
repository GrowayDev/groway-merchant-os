'use client'

import Link from 'next/link'
import { 
  MessageCircle,
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  Smartphone,
  Zap,
  CheckCircle,
  ArrowRight,
  Menu,
  X,
  Bot,
  QrCode,
  BarChart3,
  Globe,
  Clock,
  Shield,
  Star,
  Send,
  Phone,
  Image as ImageIcon,
  ShoppingBag,
  Heart,
  ChevronRight,
  Play
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

const phoneMockupSteps = [
  {
    step: 1,
    title: 'Customer Browses Catalog',
    subtitle: 'Your products at their fingertips',
    screen: 'catalog',
    description: 'Customer sees your product catalog with images, prices, and descriptions'
  },
  {
    step: 2,
    title: 'Starts WhatsApp Chat',
    subtitle: 'One tap to connect',
    screen: 'chat-start',
    description: 'Customer taps to start a WhatsApp conversation with your business'
  },
  {
    step: 3,
    title: 'Places Order via Chat',
    subtitle: 'Natural conversation',
    screen: 'order',
    description: 'Order is placed through natural chat - no complex forms needed'
  },
  {
    step: 4,
    title: 'Receives Confirmation',
    subtitle: 'Instant confirmation',
    screen: 'confirm',
    description: 'Customer gets order confirmation with payment details instantly'
  }
]

export default function GroSellLanding() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeStep, setActiveStep] = useState(0)

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/grosell" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#1A1A1A]">GroSell</h1>
                <p className="text-xs text-[#757575] hidden sm:block">WhatsApp Commerce</p>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-sm text-[#757575] hover:text-[#00897B] transition-colors">How It Works</a>
              <a href="#features" className="text-sm text-[#757575] hover:text-[#00897B] transition-colors">Features</a>
              <a href="#pricing" className="text-sm text-[#757575] hover:text-[#00897B] transition-colors">Pricing</a>
              <Link href="/grosell/app">
                <Button variant="outline" size="sm" className="gap-2">Login</Button>
              </Link>
              <Link href="/grosell/app">
                <Button size="sm" className="gap-2 bg-[#4CAF50] hover:bg-[#43A047]">
                  Start Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-100 px-4 py-4 space-y-4">
            <a href="#how-it-works" className="block text-sm text-[#757575]">How It Works</a>
            <a href="#features" className="block text-sm text-[#757575]">Features</a>
            <a href="#pricing" className="block text-sm text-[#757575]">Pricing</a>
            <div className="pt-4 space-y-2">
              <Link href="/grosell/app" className="block"><Button variant="outline" className="w-full">Login</Button></Link>
              <Link href="/grosell/app" className="block"><Button className="w-full bg-[#4CAF50]">Start Free</Button></Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section with Phone Mockups - 2/3 Screen */}
      <section className="pt-20 lg:pt-24 min-h-[85vh] bg-gradient-to-br from-[#E0F2F1] via-white to-[#E8F5E9] relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-[#25D366]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#00897B]/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - Text Content */}
            <div className="relative z-10">
              <Badge className="mb-4 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 text-sm px-4 py-1">
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp Commerce Platform
              </Badge>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-[#1A1A1A] leading-tight mb-6">
                Sell on WhatsApp
                <span className="block text-[#00897B] mt-2">Without Business API</span>
              </h1>
              <p className="text-lg lg:text-xl text-[#757575] mb-8 leading-relaxed max-w-xl">
                Turn your WhatsApp into a powerful sales channel. Share products, take orders, 
                and get paid - all through simple chat conversations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/grosell/app">
                  <Button size="lg" className="gap-2 bg-[#4CAF50] hover:bg-[#43A047] w-full sm:w-auto text-lg px-8 py-6 rounded-xl shadow-lg shadow-[#4CAF50]/30">
                    Start Selling Free
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto text-lg px-8 py-6 rounded-xl">
                  <Play className="h-5 w-5" />
                  Watch Demo
                </Button>
              </div>
              <div className="flex items-center gap-6 mt-8">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00897B] to-[#4CAF50] border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                      {['T','M','S','A'][i-1]}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-[#757575]">5,000+ merchants trust us</p>
                </div>
              </div>
            </div>

            {/* Right Side - Phone Mockups (2/3 of section) */}
            <div className="relative lg:h-[600px] flex items-center justify-center">
              {/* Main Phone Mockup */}
              <div className="relative w-[280px] sm:w-[300px] lg:w-[320px]">
                {/* Phone Frame */}
                <div className="relative bg-[#1A1A1A] rounded-[3rem] p-3 shadow-2xl">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-[#1A1A1A] rounded-b-2xl z-10"></div>
                  
                  {/* Screen */}
                  <div className="bg-white rounded-[2.5rem] overflow-hidden h-[520px] lg:h-[580px]">
                    {/* Status Bar */}
                    <div className="bg-[#075E54] px-6 py-2 flex items-center justify-between text-white text-xs">
                      <span>9:41</span>
                      <div className="flex items-center gap-1">
                        <Smartphone className="h-3 w-3" />
                        <span>WiFi</span>
                      </div>
                    </div>
                    
                    {/* WhatsApp Header */}
                    <div className="bg-[#075E54] px-4 py-3 text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                          <ShoppingBag className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">Your Business Store</p>
                          <p className="text-xs opacity-80">Online</p>
                        </div>
                      </div>
                    </div>

                    {/* Chat Content - Changes based on active step */}
                    <div className="h-[400px] lg:h-[450px] overflow-y-auto bg-[#ECE5DD] p-4" style={{
                      backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
                    }}>
                      {/* Step 0: Catalog */}
                      {activeStep === 0 && (
                        <div className="space-y-3 animate-fadeIn">
                          <div className="text-center text-xs text-gray-500 mb-4">Today</div>
                          <div className="bg-white rounded-lg p-3 shadow-sm max-w-[85%]">
                            <p className="text-sm font-medium text-[#075E54] mb-2">📦 Our Products</p>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { name: 'Chicken Burger', price: 'R49', img: '🍔' },
                                { name: 'Beef Steak', price: 'R89', img: '🥩' },
                                { name: 'Fish & Chips', price: 'R65', img: '🐟' },
                                { name: 'Veggie Bowl', price: 'R55', img: '🥗' }
                              ].map((item, i) => (
                                <div key={i} className="bg-gray-50 rounded-lg p-2 text-center border">
                                  <span className="text-2xl">{item.img}</span>
                                  <p className="text-xs font-medium mt-1">{item.name}</p>
                                  <p className="text-xs text-[#00897B] font-bold">{item.price}</p>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-2 text-center">Tap to order any item</p>
                          </div>
                          <div className="bg-[#DCF8C6] rounded-lg p-3 shadow-sm max-w-[85%] ml-auto">
                            <p className="text-sm">Hi! I&apos;d like to see your menu 👋</p>
                            <p className="text-[10px] text-gray-500 text-right mt-1">10:30 AM ✓✓</p>
                          </div>
                        </div>
                      )}

                      {/* Step 1: Chat Start */}
                      {activeStep === 1 && (
                        <div className="space-y-3 animate-fadeIn">
                          <div className="text-center text-xs text-gray-500 mb-4">Today</div>
                          <div className="bg-[#DCF8C6] rounded-lg p-3 shadow-sm max-w-[85%] ml-auto">
                            <p className="text-sm">Hi! I&apos;d like to see your menu 👋</p>
                            <p className="text-[10px] text-gray-500 text-right mt-1">10:30 AM ✓✓</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-sm max-w-[85%]">
                            <p className="text-sm">Hi there! 👋 Welcome to our store!</p>
                            <p className="text-sm mt-2">Here&apos;s our menu for today:</p>
                            <div className="mt-2 space-y-2">
                              {['🍔 Chicken Burger - R49', '🥩 Beef Steak - R89', '🐟 Fish & Chips - R65'].map((item, i) => (
                                <p key={i} className="text-sm bg-[#E0F2F1] rounded p-2">{item}</p>
                              ))}
                            </div>
                            <p className="text-[10px] text-gray-500 text-right mt-2">10:31 AM ✓✓</p>
                          </div>
                        </div>
                      )}

                      {/* Step 2: Order */}
                      {activeStep === 2 && (
                        <div className="space-y-3 animate-fadeIn">
                          <div className="text-center text-xs text-gray-500 mb-4">Today</div>
                          <div className="bg-[#DCF8C6] rounded-lg p-3 shadow-sm max-w-[85%] ml-auto">
                            <p className="text-sm">I&apos;ll take 2x Chicken Burgers please!</p>
                            <p className="text-[10px] text-gray-500 text-right mt-1">10:32 AM ✓✓</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-sm max-w-[85%]">
                            <p className="text-sm">Great choice! 🎉</p>
                            <div className="bg-[#E0F2F1] rounded-lg p-3 mt-2">
                              <p className="text-sm font-semibold text-[#075E54]">Order Summary</p>
                              <p className="text-xs mt-1">2x Chicken Burger</p>
                              <p className="text-xs text-gray-500">Subtotal: R98.00</p>
                              <p className="text-xs text-gray-500">Delivery: R15.00</p>
                              <p className="text-sm font-bold text-[#00897B] mt-2">Total: R113.00</p>
                            </div>
                            <p className="text-sm mt-2">Please confirm your order 👇</p>
                            <p className="text-[10px] text-gray-500 text-right mt-1">10:33 AM ✓✓</p>
                          </div>
                          <div className="bg-[#DCF8C6] rounded-lg p-3 shadow-sm max-w-[85%] ml-auto">
                            <p className="text-sm">✅ Yes, confirm my order!</p>
                            <p className="text-[10px] text-gray-500 text-right mt-1">10:34 AM ✓✓</p>
                          </div>
                        </div>
                      )}

                      {/* Step 3: Confirmation */}
                      {activeStep === 3 && (
                        <div className="space-y-3 animate-fadeIn">
                          <div className="text-center text-xs text-gray-500 mb-4">Today</div>
                          <div className="bg-white rounded-lg p-3 shadow-sm max-w-[85%]">
                            <div className="text-center mb-2">
                              <span className="text-3xl">🎉</span>
                            </div>
                            <p className="text-sm font-semibold text-[#075E54] text-center">Order Confirmed!</p>
                            <div className="bg-[#E8F5E9] rounded-lg p-3 mt-2">
                              <p className="text-xs text-center text-gray-600">Order #GS-2847</p>
                              <p className="text-xs text-center mt-1">Estimated delivery: 30-45 mins</p>
                            </div>
                            <div className="mt-3 bg-[#FFF3E0] rounded-lg p-2">
                              <p className="text-xs font-medium text-orange-700">💳 Payment Link</p>
                              <p className="text-xs text-gray-600 mt-1">Pay R113.00 via card or EFT</p>
                              <div className="mt-2 bg-white rounded p-2 text-center">
                                <p className="text-xs text-[#00897B] font-medium">Pay Now →</p>
                              </div>
                            </div>
                            <p className="text-[10px] text-gray-500 text-right mt-2">10:35 AM ✓✓</p>
                          </div>
                          <div className="bg-[#DCF8C6] rounded-lg p-3 shadow-sm max-w-[85%] ml-auto">
                            <p className="text-sm">Thank you! Paid ✅</p>
                            <p className="text-[10px] text-gray-500 text-right mt-1">10:36 AM ✓✓</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Input Bar */}
                    <div className="bg-[#F0F0F0] px-3 py-2 flex items-center gap-2">
                      <div className="flex-1 bg-white rounded-full px-4 py-2 text-xs text-gray-400">
                        Type a message...
                      </div>
                      <div className="w-8 h-8 rounded-full bg-[#00897B] flex items-center justify-center">
                        <Send className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating notification cards */}
                <div className="absolute -top-4 -right-8 bg-white rounded-xl shadow-xl p-3 border animate-bounce">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#4CAF50]/20 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-[#4CAF50]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">New Order!</p>
                      <p className="text-[10px] text-gray-500">R113.00 received</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-8 bg-white rounded-xl shadow-xl p-3 border">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#25D366]/20 flex items-center justify-center">
                      <MessageCircle className="h-4 w-4 text-[#25D366]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">Order via Chat</p>
                      <p className="text-[10px] text-gray-500">No app needed!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step Selector - Below Phone */}
        <div className="max-w-5xl mx-auto px-4 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {phoneMockupSteps.map((step, index) => (
              <button
                key={index}
                onClick={() => setActiveStep(index)}
                className={`p-4 rounded-xl transition-all text-left ${
                  activeStep === index 
                    ? 'bg-[#00897B] text-white shadow-lg shadow-[#00897B]/30' 
                    : 'bg-white text-gray-600 hover:bg-gray-50 border'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold ${
                    activeStep === index ? 'text-white/80' : 'text-[#00897B]'
                  }`}>Step {step.step}</span>
                  {activeStep === index && <ChevronRight className="h-4 w-4" />}
                </div>
                <p className={`text-sm font-medium ${
                  activeStep === index ? 'text-white' : 'text-gray-900'
                }`}>{step.title}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-[#25D366]/10 text-[#25D366]">How It Works</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#1A1A1A] mb-4">
              Start Selling in Minutes
            </h2>
            <p className="text-lg text-[#757575] max-w-2xl mx-auto">
              No complex setup. No Business API required. Just add your products and share your link.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                number: '01',
                title: 'Add Your Products',
                description: 'Upload product images, set prices, and organize your catalog in minutes.',
                icon: Package,
                color: 'bg-[#25D366]/10 text-[#25D366]'
              },
              {
                number: '02',
                title: 'Share Your Link',
                description: 'Get your unique WhatsApp link. Share it anywhere - social media, flyers, or word of mouth.',
                icon: ShareIcon,
                color: 'bg-[#00897B]/10 text-[#00897B]'
              },
              {
                number: '03',
                title: 'Get Orders on WhatsApp',
                description: 'Customers browse and order through chat. You manage everything from your phone.',
                icon: MessageCircle,
                color: 'bg-[#4CAF50]/10 text-[#4CAF50]'
              }
            ].map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-[#FAFAFA] rounded-2xl p-6 border border-gray-100 h-full hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-4xl font-bold text-[#E0F2F1]">{step.number}</span>
                    <div className={`w-12 h-12 rounded-lg ${step.color} flex items-center justify-center`}>
                      <step.icon className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">{step.title}</h3>
                  <p className="text-[#757575] text-sm">{step.description}</p>
                </div>
                {index < 2 && (
                  <ArrowRight className="hidden md:block absolute top-1/2 -right-4 h-6 w-6 text-[#00897B]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 lg:py-24 bg-[#E0F2F1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-[#00897B]/10 text-[#00897B]">Features</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#1A1A1A] mb-4">
              Everything You Need to Sell on WhatsApp
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Package, title: 'Product Catalog', description: 'Beautiful product listings with images, prices, and descriptions.', color: 'bg-[#00897B]/10 text-[#00897B]' },
              { icon: ShoppingCart, title: 'Order Management', description: 'Track orders, update status, and communicate with customers easily.', color: 'bg-[#25D366]/10 text-[#25D366]' },
              { icon: Users, title: 'Customer Profiles', description: 'Build customer profiles with order history and preferences.', color: 'bg-purple-100 text-purple-600' },
              { icon: CreditCard, title: 'Payment Links', description: 'Send payment links directly in chat. Accept cards, EFT, mobile money.', color: 'bg-blue-100 text-blue-600' },
              { icon: BarChart3, title: 'Sales Analytics', description: 'Track your best sellers, revenue, and customer insights.', color: 'bg-orange-100 text-orange-600' },
              { icon: Zap, title: 'Quick Setup', description: 'Get started in under 5 minutes. No technical knowledge needed.', color: 'bg-yellow-100 text-yellow-600' }
            ].map((feature, index) => (
              <Card key={index} className="border-0 shadow-sm hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">{feature.title}</h3>
                  <p className="text-[#757575] text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 lg:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-[#00897B]/10 text-[#00897B]">Pricing</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#1A1A1A] mb-4">
              Start Free, Grow With Us
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Free',
                price: 'R0',
                period: '/month',
                description: 'Perfect for starting out',
                features: ['Up to 50 products', 'Unlimited orders', 'WhatsApp link', 'Basic analytics'],
                cta: 'Start Free',
                popular: false
              },
              {
                name: 'Pro',
                price: 'R299',
                period: '/month',
                description: 'For growing businesses',
                features: ['Unlimited products', 'Priority support', 'Advanced analytics', 'Custom branding', 'Staff accounts'],
                cta: 'Start Pro Trial',
                popular: true
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                period: '',
                description: 'For large operations',
                features: ['Everything in Pro', 'Custom integrations', 'Dedicated support', 'White-label options'],
                cta: 'Contact Sales',
                popular: false
              }
            ].map((plan, index) => (
              <Card 
                key={index} 
                className={`relative ${plan.popular ? 'border-2 border-[#00897B] shadow-xl' : 'border border-gray-200'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[#00897B] text-white">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-[#1A1A1A] mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-bold text-[#00897B]">{plan.price}</span>
                    <span className="text-[#757575]">{plan.period}</span>
                  </div>
                  <p className="text-sm text-[#757575] mb-6">{plan.description}</p>
                  
                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, fIndex) => (
                      <div key={fIndex} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-[#4CAF50] flex-shrink-0" />
                        <span className="text-sm text-[#757575]">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Link href="/grosell/app" className="block">
                    <Button 
                      className={`w-full ${plan.popular ? 'bg-[#4CAF50] hover:bg-[#43A047]' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-[#00897B] to-[#00695C]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Start Selling on WhatsApp?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Join thousands of African businesses using GroSell to grow their sales.
          </p>
          <Link href="/grosell/app">
            <Button size="lg" className="gap-2 bg-white text-[#00897B] hover:bg-gray-100 text-lg px-8 py-6 rounded-xl shadow-xl">
              Get Started Free <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1A1A1A] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">GroSell</h1>
                <p className="text-xs text-gray-400">by Groway</p>
              </div>
            </div>
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} GroSell. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

// Share icon component
function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  )
}
