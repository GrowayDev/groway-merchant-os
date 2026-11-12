'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
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
import { 
  Calendar,
  Clock,
  User,
  Users,
  Plus,
  Scissors,
  Search,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Timer,
  Sparkles,
  MessageSquare,
  MoreHorizontal,
  X,
  Edit,
  Trash2,
  Eye,
  Code,
  Send,
  Smartphone,
  CreditCard,
  Coins,
  Copy,
  Globe,
  Bell,
  BellRing,
  Settings,
  TrendingUp,
  Wallet,
  Percent,
  Check,
  ExternalLink,
  ShoppingCart,
  Package as PackageIcon,
  Gift,
  Ticket,
  Star,
  Palette,
  FileText,
  CalendarDays,
  Repeat,
  Zap,
  ShieldCheck,
  Lock,
  ArrowRight,
  ArrowLeft,
  Building2,
  Share2,
  QrCode,
  Link2,
  EyeOff,
  Monitor,
  Tablet,
  SmartphoneIcon,
  CheckCircle,
  AlertTriangle,
  Info,
  CreditCardIcon,
} from 'lucide-react'

// Types
interface BookingService {
  id: string
  name: string
  category: string
  duration: number
  price: number
  description?: string
  depositRequired?: boolean
  depositAmount?: number
  depositPercentage?: number
  bufferAfter?: number
}

interface Staff {
  id: string
  name: string
  avatar?: string
  color: string
  status: string
  rating: number
  specialties?: string[]
  workingHours?: Record<string, { start: string; end: string }>
}

interface TimeSlot {
  time: string
  available: boolean
  staffId?: string
  staffName?: string
}

interface BookingSettings {
  onlineBookingEnabled: boolean
  requireDeposit: boolean
  defaultDepositPct: number
  sendConfirmationSMS: boolean
  sendReminder24h: boolean
  sendReminder2h: boolean
  sendWhatsApp: boolean
  allowOnlineReschedule: boolean
  allowOnlineCancel: boolean
  cancellationPolicy: string
  cancellationHours: number
  minBookingNotice: number
  maxAdvanceBooking: number
  autoConfirmBookings: boolean
  bufferBetweenSlots: number
  workingHoursStart: string
  workingHoursEnd: string
  workingDays: string
  whatsappNumber?: string
}

// Sample data for demo
const sampleServices: BookingService[] = [
  { id: 's1', name: 'Haircut - Ladies', category: 'Hair', duration: 45, price: 180, depositRequired: true, depositAmount: 50 },
  { id: 's2', name: 'Haircut - Gentlemen', category: 'Hair', duration: 30, price: 120 },
  { id: 's3', name: 'Fade Cut', category: 'Hair', duration: 35, price: 150 },
  { id: 's4', name: 'Hair Coloring', category: 'Hair', duration: 120, price: 650, depositRequired: true, depositAmount: 200 },
  { id: 's5', name: 'Braids - Medium', category: 'Hair', duration: 240, price: 850, depositRequired: true, depositPercentage: 30 },
  { id: 's6', name: 'Manicure', category: 'Nails', duration: 45, price: 180 },
  { id: 's7', name: 'Pedicure', category: 'Nails', duration: 60, price: 250 },
  { id: 's8', name: 'Gel Nails', category: 'Nails', duration: 75, price: 350, depositRequired: true, depositAmount: 100 },
  { id: 's9', name: 'Facial Treatment', category: 'Spa', duration: 60, price: 450, depositRequired: true, depositAmount: 100 },
  { id: 's10', name: 'Beard Trim', category: 'Hair', duration: 20, price: 80 },
  { id: 's11', name: 'Wash & Blow Dry', category: 'Hair', duration: 30, price: 150 },
  { id: 's12', name: 'Full Spa Package', category: 'Spa', duration: 180, price: 1200, depositRequired: true, depositPercentage: 25 },
]

const sampleStaff: Staff[] = [
  { id: 'st1', name: 'Nomsa Dlamini', avatar: '👩🏿', color: '#00897B', status: 'active', rating: 4.9, specialties: ['Haircut', 'Coloring', 'Braids'] },
  { id: 'st2', name: 'Thabo Molefe', avatar: '👨🏿', color: '#FF6B6B', status: 'active', rating: 4.8, specialties: ['Haircut', 'Fade', 'Beard'] },
  { id: 'st3', name: 'Zanele Nkosi', avatar: '👩🏿', color: '#4ECDC4', status: 'active', rating: 4.7, specialties: ['Nails', 'Manicure', 'Pedicure'] },
  { id: 'st4', name: 'Kagiso Mokoena', avatar: '👨🏿', color: '#9B59B6', status: 'active', rating: 4.6, specialties: ['Haircut', 'Styling', 'Treatment'] },
  { id: 'st5', name: 'Lerato Sithole', avatar: '👩🏿', color: '#E74C3C', status: 'active', rating: 4.9, specialties: ['Makeup', 'Facial', 'Spa'] },
]

const defaultSettings: BookingSettings = {
  onlineBookingEnabled: true,
  requireDeposit: true,
  defaultDepositPct: 20,
  sendConfirmationSMS: true,
  sendReminder24h: true,
  sendReminder2h: true,
  sendWhatsApp: true,
  allowOnlineReschedule: true,
  allowOnlineCancel: true,
  cancellationPolicy: 'moderate',
  cancellationHours: 24,
  minBookingNotice: 2,
  maxAdvanceBooking: 30,
  autoConfirmBookings: false,
  bufferBetweenSlots: 0,
  workingHoursStart: '08:00',
  workingHoursEnd: '18:00',
  workingDays: '1,2,3,4,5,6',
}

// Widget embed code generator
function generateWidgetCode(merchantId: string, options: {
  primaryColor: string
  showServices: boolean
  showStaff: boolean
  requireDeposit: boolean
  language: string
  position: 'bottom-right' | 'bottom-left' | 'inline'
}) {
  const config = {
    merchantId,
    primaryColor: options.primaryColor,
    showServices: options.showServices,
    showStaff: options.showStaff,
    requireDeposit: options.requireDeposit,
    language: options.language,
  }
  
  const scriptUrl = 'https://booking.groway.co.za/widget.js'
  
  if (options.position === 'inline') {
    return `<!-- Groway Booking Widget - Inline -->
<div id="groway-booking-widget"></div>
<script src="${scriptUrl}" data-config='${JSON.stringify(config)}'></script>`
  }
  
  return `<!-- Groway Booking Widget - Floating Button -->
<script src="${scriptUrl}" 
  data-merchant="${merchantId}"
  data-color="${options.primaryColor}"
  data-position="${options.position}"
  data-show-services="${options.showServices}"
  data-show-staff="${options.showStaff}"
  data-require-deposit="${options.requireDeposit}"
  data-language="${options.language}">
</script>`
}

// Google Business Profile link generator
function generateGoogleBookingLink(merchantId: string, businessName: string) {
  return `https://business.google.com/r/appointments/book?id=${merchantId}&name=${encodeURIComponent(businessName)}`
}

export function OnlineBookingWidget() {
  // State
  const [activeTab, setActiveTab] = useState('widget')
  const [services, setServices] = useState<BookingService[]>(sampleServices)
  const [staff, setStaff] = useState<Staff[]>(sampleStaff)
  const [settings, setSettings] = useState<BookingSettings>(defaultSettings)
  
  // Widget configuration
  const [widgetConfig, setWidgetConfig] = useState({
    primaryColor: '#00897B',
    showServices: true,
    showStaff: true,
    requireDeposit: true,
    language: 'en',
    position: 'bottom-right' as 'bottom-right' | 'bottom-left' | 'inline',
    businessName: 'Groway Salon & Spa',
    merchantId: 'merch_abc123',
  })
  
  // Preview state
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  
  // Booking flow state for preview
  const [bookingStep, setBookingStep] = useState(1)
  const [selectedService, setSelectedService] = useState<BookingService | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  })
  const [depositPaid, setDepositPaid] = useState(false)
  const [bookingConfirmed, setBookingConfirmed] = useState(false)

  // Generate time slots for preview
  const generateTimeSlots = (staffId: string, date: string): TimeSlot[] => {
    const slots: TimeSlot[] = []
    const startHour = parseInt(settings.workingHoursStart.split(':')[0])
    const endHour = parseInt(settings.workingHoursEnd.split(':')[0])
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push({
          time,
          available: Math.random() > 0.3,
          staffId,
          staffName: staff.find(s => s.id === staffId)?.name
        })
      }
    }
    return slots
  }

  // Generate next 14 days for booking
  const generateAvailableDates = () => {
    const dates = []
    const workingDays = settings.workingDays.split(',').map(Number)
    
    for (let i = 0; i < settings.maxAdvanceBooking; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      const dayOfWeek = date.getDay()
      
      if (workingDays.includes(dayOfWeek)) {
        dates.push(date.toISOString().split('T')[0])
      }
      if (dates.length >= 14) break
    }
    return dates
  }

  // Get service categories
  const categories = useMemo(() => {
    const cats = new Set(services.map(s => s.category))
    return Array.from(cats)
  }, [services])

  // Filter services by category
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const filteredServices = useMemo(() => {
    if (selectedCategory === 'all') return services
    return services.filter(s => s.category === selectedCategory)
  }, [services, selectedCategory])

  // Calculate deposit amount
  const calculateDeposit = (service: BookingService): number => {
    if (!service.depositRequired) return 0
    if (service.depositAmount) return service.depositAmount
    if (service.depositPercentage) return Math.round(service.price * service.depositPercentage / 100)
    return Math.round(service.price * settings.defaultDepositPct / 100)
  }

  // Handle copy code
  const handleCopyCode = () => {
    const code = generateWidgetCode(widgetConfig.merchantId, widgetConfig)
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  // Reset booking flow
  const resetBookingFlow = () => {
    setBookingStep(1)
    setSelectedService(null)
    setSelectedStaff(null)
    setSelectedDate('')
    setSelectedTime('')
    setCustomerDetails({ name: '', phone: '', email: '', notes: '' })
    setDepositPaid(false)
    setBookingConfirmed(false)
  }

  // Render booking preview
  const renderBookingPreview = () => {
    const availableDates = generateAvailableDates()
    const timeSlots = selectedStaff && selectedDate ? generateTimeSlots(selectedStaff.id, selectedDate) : []

    return (
      <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${
        previewMode === 'mobile' ? 'max-w-sm' :
        previewMode === 'tablet' ? 'max-w-2xl' : 'max-w-4xl'
      }`}>
        {/* Header */}
        <div 
          className="p-4 text-white"
          style={{ backgroundColor: widgetConfig.primaryColor }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{widgetConfig.businessName}</h3>
              <p className="text-sm opacity-90">Book your appointment</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Step {bookingStep} of 5</span>
            </div>
          </div>
          <Progress 
            value={(bookingStep / 5) * 100} 
            className="mt-3 h-1 bg-white/30"
          />
        </div>

        {/* Content */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {/* Step 1: Select Service */}
          {bookingStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Scissors className="h-5 w-5" style={{ color: widgetConfig.primaryColor }} />
                <h4 className="font-medium">Select a Service</h4>
              </div>
              
              {/* Category filter */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                <Button
                  size="sm"
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory('all')}
                  className={selectedCategory === 'all' ? '' : ''}
                  style={selectedCategory === 'all' ? { backgroundColor: widgetConfig.primaryColor } : {}}
                >
                  All
                </Button>
                {categories.map(cat => (
                  <Button
                    key={cat}
                    size="sm"
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory(cat)}
                    style={selectedCategory === cat ? { backgroundColor: widgetConfig.primaryColor } : {}}
                  >
                    {cat}
                  </Button>
                ))}
              </div>

              {/* Services list */}
              <div className="space-y-2">
                {filteredServices.map(service => (
                  <div
                    key={service.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedService?.id === service.id ? 'border-2' : 'hover:border-gray-300'
                    }`}
                    style={selectedService?.id === service.id ? { borderColor: widgetConfig.primaryColor } : {}}
                    onClick={() => setSelectedService(service)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <Clock className="h-3 w-3" />
                          <span>{service.duration} min</span>
                          {service.depositRequired && (
                            <>
                              <span>•</span>
                              <ShieldCheck className="h-3 w-3" />
                              <span>R{calculateDeposit(service)} deposit</span>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="font-bold" style={{ color: widgetConfig.primaryColor }}>
                        R{service.price}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Select Staff */}
          {bookingStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5" style={{ color: widgetConfig.primaryColor }} />
                <h4 className="font-medium">Choose Your Stylist</h4>
              </div>

              <button
                className="w-full p-3 border rounded-lg hover:border-gray-300 text-left"
                onClick={() => {
                  setSelectedStaff({ id: 'any', name: 'Any Available', color: widgetConfig.primaryColor, status: 'active', rating: 0 })
                  setBookingStep(3)
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: widgetConfig.primaryColor }}
                  >
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Any Available</p>
                    <p className="text-sm text-gray-500">We'll assign the best available stylist</p>
                  </div>
                </div>
              </button>

              <div className="space-y-2">
                {staff.filter(s => s.status === 'active').map(member => (
                  <div
                    key={member.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedStaff?.id === member.id ? 'border-2' : 'hover:border-gray-300'
                    }`}
                    style={selectedStaff?.id === member.id ? { borderColor: widgetConfig.primaryColor } : {}}
                    onClick={() => {
                      setSelectedStaff(member)
                      setBookingStep(3)
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                        style={{ backgroundColor: member.color + '20' }}
                      >
                        {member.avatar || '👤'}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{member.name}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span>{member.rating}</span>
                          {member.specialties && (
                            <>
                              <span>•</span>
                              <span>{member.specialties.slice(0, 2).join(', ')}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Select Date & Time */}
          {bookingStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5" style={{ color: widgetConfig.primaryColor }} />
                <h4 className="font-medium">Select Date & Time</h4>
              </div>

              {/* Date selector */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {availableDates.slice(0, 7).map(date => {
                  const d = new Date(date)
                  const dayName = d.toLocaleDateString('en-ZA', { weekday: 'short' })
                  const dayNum = d.getDate()
                  const monthName = d.toLocaleDateString('en-ZA', { month: 'short' })
                  
                  return (
                    <button
                      key={date}
                      className={`flex flex-col items-center p-3 rounded-lg border min-w-16 ${
                        selectedDate === date ? 'text-white' : 'hover:border-gray-300'
                      }`}
                      style={selectedDate === date ? { backgroundColor: widgetConfig.primaryColor } : {}}
                      onClick={() => setSelectedDate(date)}
                    >
                      <span className="text-xs">{dayName}</span>
                      <span className="text-lg font-bold">{dayNum}</span>
                      <span className="text-xs">{monthName}</span>
                    </button>
                  )
                })}
              </div>

              {selectedDate && (
                <>
                  <Separator />
                  
                  {/* Time slots */}
                  <div>
                    <p className="text-sm font-medium mb-2">Available Times</p>
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.filter(s => s.available).map(slot => (
                        <button
                          key={slot.time}
                          className={`p-2 border rounded-lg text-sm font-medium ${
                            selectedTime === slot.time ? 'text-white' : 'hover:border-gray-300'
                          }`}
                          style={selectedTime === slot.time ? { backgroundColor: widgetConfig.primaryColor } : {}}
                          onClick={() => {
                            setSelectedTime(slot.time)
                            setBookingStep(4)
                          }}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 4: Customer Details */}
          {bookingStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Phone className="h-5 w-5" style={{ color: widgetConfig.primaryColor }} />
                <h4 className="font-medium">Your Details</h4>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input 
                    id="name"
                    value={customerDetails.name}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input 
                    id="phone"
                    value={customerDetails.phone}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="082 123 4567"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email (optional)</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={customerDetails.email}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="you@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Special Requests (optional)</Label>
                  <Textarea 
                    id="notes"
                    value={customerDetails.notes}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any allergies, preferences, or special requests..."
                    rows={2}
                  />
                </div>
              </div>

              {/* Deposit info */}
              {selectedService?.depositRequired && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800">Deposit Required</p>
                      <p className="text-sm text-amber-700">
                        A deposit of <strong>R{calculateDeposit(selectedService)}</strong> is required to secure this booking.
                        You'll receive a payment link via SMS/WhatsApp.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Confirmation */}
          {bookingStep === 5 && (
            <div className="space-y-4">
              {bookingConfirmed ? (
                <div className="text-center py-6">
                  <div 
                    className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4"
                    style={{ backgroundColor: widgetConfig.primaryColor + '20' }}
                  >
                    <CheckCircle className="h-8 w-8" style={{ color: widgetConfig.primaryColor }} />
                  </div>
                  <h4 className="text-lg font-semibold mb-2">Booking Confirmed!</h4>
                  <p className="text-gray-600 mb-4">
                    We've sent a confirmation to {customerDetails.phone}
                  </p>
                  
                  <div className="bg-gray-50 rounded-lg p-4 text-left">
                    <p className="text-sm text-gray-500 mb-2">Booking Summary</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service</span>
                        <span className="font-medium">{selectedService?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date</span>
                        <span className="font-medium">{new Date(selectedDate).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time</span>
                        <span className="font-medium">{selectedTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stylist</span>
                        <span className="font-medium">{selectedStaff?.name}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between">
                        <span className="font-semibold">Total</span>
                        <span className="font-bold" style={{ color: widgetConfig.primaryColor }}>
                          R{selectedService?.price}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="h-5 w-5" style={{ color: widgetConfig.primaryColor }} />
                    <h4 className="font-medium">Review & Confirm</h4>
                  </div>

                  {/* Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Scissors className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Service</p>
                        <p className="font-medium">{selectedService?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Stylist</p>
                        <p className="font-medium">{selectedStaff?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Date & Time</p>
                        <p className="font-medium">
                          {new Date(selectedDate).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })} at {selectedTime}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Duration</p>
                        <p className="font-medium">{selectedService?.duration} minutes</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <Coins className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="text-sm text-gray-500">Service Total</p>
                          <p className="font-medium">R{selectedService?.price}</p>
                        </div>
                        {selectedService?.depositRequired && (
                          <div className="flex justify-between mt-1">
                            <p className="text-sm text-amber-600">Deposit Required</p>
                            <p className="font-medium text-amber-600">R{calculateDeposit(selectedService)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reminder info */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-700">
                        <p className="font-medium">Reminders</p>
                        <ul className="mt-1 space-y-0.5 text-blue-600">
                          {settings.sendConfirmationSMS && <li>• Confirmation SMS sent immediately</li>}
                          {settings.sendReminder24h && <li>• Reminder 24 hours before</li>}
                          {settings.sendReminder2h && <li>• Reminder 2 hours before</li>}
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!bookingConfirmed && (
          <div className="p-4 border-t bg-gray-50">
            <div className="flex gap-2">
              {bookingStep > 1 && (
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setBookingStep(prev => prev - 1)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              <Button 
                className="flex-1"
                style={{ backgroundColor: widgetConfig.primaryColor }}
                disabled={
                  (bookingStep === 1 && !selectedService) ||
                  (bookingStep === 2 && !selectedStaff) ||
                  (bookingStep === 3 && !selectedTime) ||
                  (bookingStep === 4 && (!customerDetails.name || !customerDetails.phone))
                }
                onClick={() => {
                  if (bookingStep === 5) {
                    setBookingConfirmed(true)
                  } else {
                    setBookingStep(prev => prev + 1)
                  }
                }}
              >
                {bookingStep === 5 ? 'Confirm Booking' : 'Continue'}
                {bookingStep < 5 && <ArrowRight className="h-4 w-4 ml-2" />}
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#1A1A1A] flex items-center gap-2">
              <Globe className="h-5 w-5 text-[#00897B]" />
              Online Booking Widget
            </h1>
            <p className="text-sm text-[#757575]">Embed on your website or Google Business Profile</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setShowPreviewDialog(true)}>
              <Eye className="h-4 w-4 mr-2" />
              Full Preview
            </Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C] gap-2"
              onClick={handleCopyCode}
            >
              {copiedCode ? <Check className="h-4 w-4" /> : <Code className="h-4 w-4" />}
              {copiedCode ? 'Copied!' : 'Get Embed Code'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 pt-4 border-b border-gray-200">
          <TabsList className="bg-transparent">
            <TabsTrigger value="widget" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Code className="h-4 w-4 mr-2" />
              Widget Setup
            </TabsTrigger>
            <TabsTrigger value="services" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Scissors className="h-4 w-4 mr-2" />
              Services
            </TabsTrigger>
            <TabsTrigger value="staff" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Users className="h-4 w-4 mr-2" />
              Staff
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="reminders" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Bell className="h-4 w-4 mr-2" />
              Reminders
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Widget Tab */}
        <TabsContent value="widget" className="flex-1 overflow-auto p-6 m-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Widget Configuration</CardTitle>
                <CardDescription>Customize your booking widget appearance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input 
                    id="businessName"
                    value={widgetConfig.businessName}
                    onChange={(e) => setWidgetConfig(prev => ({ ...prev, businessName: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="primaryColor"
                      type="color"
                      value={widgetConfig.primaryColor}
                      onChange={(e) => setWidgetConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-16 h-10 p-1"
                    />
                    <Input 
                      value={widgetConfig.primaryColor}
                      onChange={(e) => setWidgetConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Widget Position</Label>
                  <Select 
                    value={widgetConfig.position} 
                    onValueChange={(v) => setWidgetConfig(prev => ({ ...prev, position: v as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-right">Bottom Right (Floating)</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left (Floating)</SelectItem>
                      <SelectItem value="inline">Inline (Embedded)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Language</Label>
                  <Select 
                    value={widgetConfig.language} 
                    onValueChange={(v) => setWidgetConfig(prev => ({ ...prev, language: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="af">Afrikaans</SelectItem>
                      <SelectItem value="zu">isiZulu</SelectItem>
                      <SelectItem value="xh">isiXhosa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showServices">Show Services List</Label>
                    <Switch 
                      id="showServices"
                      checked={widgetConfig.showServices}
                      onCheckedChange={(checked) => setWidgetConfig(prev => ({ ...prev, showServices: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showStaff">Allow Staff Selection</Label>
                    <Switch 
                      id="showStaff"
                      checked={widgetConfig.showStaff}
                      onCheckedChange={(checked) => setWidgetConfig(prev => ({ ...prev, showStaff: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="requireDeposit">Require Deposits</Label>
                    <Switch 
                      id="requireDeposit"
                      checked={widgetConfig.requireDeposit}
                      onCheckedChange={(checked) => setWidgetConfig(prev => ({ ...prev, requireDeposit: checked }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Live Preview</CardTitle>
                    <CardDescription>See how your widget will look</CardDescription>
                  </div>
                  <div className="flex items-center gap-1 border rounded-lg p-1">
                    <Button 
                      size="sm" 
                      variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                      onClick={() => setPreviewMode('desktop')}
                      className="h-8 px-2"
                    >
                      <Monitor className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                      onClick={() => setPreviewMode('tablet')}
                      className="h-8 px-2"
                    >
                      <Tablet className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                      onClick={() => setPreviewMode('mobile')}
                      className="h-8 px-2"
                    >
                      <Smartphone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 rounded-lg p-4 flex justify-center">
                  {renderBookingPreview()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Embed Code */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Code className="h-4 w-4" />
                Embed Code
              </CardTitle>
              <CardDescription>Copy and paste this code into your website</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 rounded-lg p-4 relative">
                <pre className="text-green-400 text-sm overflow-x-auto whitespace-pre-wrap">
                  {generateWidgetCode(widgetConfig.merchantId, widgetConfig)}
                </pre>
                <Button 
                  size="sm" 
                  className="absolute top-2 right-2"
                  onClick={handleCopyCode}
                >
                  {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Integration Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Google Business Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Add a "Book" button to your Google Business listing
                </p>
                <div className="flex items-center gap-2">
                  <Input 
                    value={generateGoogleBookingLink(widgetConfig.merchantId, widgetConfig.businessName)}
                    readOnly
                    className="text-sm"
                  />
                  <Button size="sm" variant="outline">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" className="w-full" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Setup in Google Business
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Direct Booking Link
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Share this link for direct booking access
                </p>
                <div className="flex items-center gap-2">
                  <Input 
                    value={`https://booking.groway.co.za/${widgetConfig.merchantId}`}
                    readOnly
                    className="text-sm"
                  />
                  <Button size="sm" variant="outline">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" className="w-full" size="sm">
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate QR Code
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="flex-1 overflow-auto p-6 m-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Booking Services</h3>
              <p className="text-sm text-gray-500">Manage services available for online booking</p>
            </div>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map(service => (
              <Card key={service.id} className="overflow-hidden">
                <div className="h-2" style={{ backgroundColor: 
                  service.category === 'Hair' ? '#00897B' :
                  service.category === 'Nails' ? '#E91E63' :
                  service.category === 'Spa' ? '#9C27B0' : '#607D8B'
                }} />
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <Badge variant="secondary" className="mt-1">{service.category}</Badge>
                    </div>
                    <p className="font-bold text-lg" style={{ color: '#00897B' }}>R{service.price}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {service.duration} min
                    </span>
                    {service.depositRequired && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <ShieldCheck className="h-3 w-3" />
                        R{calculateDeposit(service)} dep.
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <EyeOff className="h-3 w-3 mr-1" />
                      Hide
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Staff Tab */}
        <TabsContent value="staff" className="flex-1 overflow-auto p-6 m-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Staff Members</h3>
              <p className="text-sm text-gray-500">Manage staff available for online booking</p>
            </div>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">
              <Plus className="h-4 w-4 mr-2" />
              Add Staff
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {staff.map(member => (
              <Card key={member.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                      style={{ backgroundColor: member.color + '20' }}
                    >
                      {member.avatar || '👤'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{member.name}</p>
                        <Badge variant={member.status === 'active' ? 'default' : 'secondary'}
                          className={member.status === 'active' ? 'bg-green-100 text-green-700' : ''}>
                          {member.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span>{member.rating} rating</span>
                      </div>
                      {member.specialties && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {member.specialties.map(s => (
                            <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="flex-1 overflow-auto p-6 m-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Booking Settings</CardTitle>
              <CardDescription>Configure your online booking behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Online Booking Enabled</Label>
                  <p className="text-sm text-gray-500">Allow customers to book online</p>
                </div>
                <Switch 
                  checked={settings.onlineBookingEnabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, onlineBookingEnabled: checked }))}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Require Deposit</Label>
                  <p className="text-sm text-gray-500">Ask for deposit on all bookings</p>
                </div>
                <Switch 
                  checked={settings.requireDeposit}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireDeposit: checked }))}
                />
              </div>

              <div>
                <Label>Default Deposit Percentage</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Input 
                    type="number"
                    value={settings.defaultDepositPct}
                    onChange={(e) => setSettings(prev => ({ ...prev, defaultDepositPct: parseFloat(e.target.value) }))}
                    className="w-24"
                  />
                  <span className="text-gray-500">%</span>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-base">Cancellation Policy</Label>
                <Select 
                  value={settings.cancellationPolicy}
                  onValueChange={(v) => setSettings(prev => ({ ...prev, cancellationPolicy: v }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flexible">Flexible - Cancel anytime, full refund</SelectItem>
                    <SelectItem value="moderate">Moderate - 24 hours notice required</SelectItem>
                    <SelectItem value="strict">Strict - No refunds within 48 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Minimum Booking Notice</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input 
                      type="number"
                      value={settings.minBookingNotice}
                      onChange={(e) => setSettings(prev => ({ ...prev, minBookingNotice: parseInt(e.target.value) }))}
                    />
                    <span className="text-gray-500">hours</span>
                  </div>
                </div>
                <div>
                  <Label>Maximum Advance Booking</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input 
                      type="number"
                      value={settings.maxAdvanceBooking}
                      onChange={(e) => setSettings(prev => ({ ...prev, maxAdvanceBooking: parseInt(e.target.value) }))}
                    />
                    <span className="text-gray-500">days</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-base">Working Hours</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label className="text-sm text-gray-500">Start</Label>
                    <Input 
                      type="time"
                      value={settings.workingHoursStart}
                      onChange={(e) => setSettings(prev => ({ ...prev, workingHoursStart: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">End</Label>
                    <Input 
                      type="time"
                      value={settings.workingHoursEnd}
                      onChange={(e) => setSettings(prev => ({ ...prev, workingHoursEnd: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base">Working Days</Label>
                <div className="flex gap-2 mt-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                    <Button 
                      key={day}
                      size="sm"
                      variant={settings.workingDays.split(',').includes(i.toString()) ? 'default' : 'outline'}
                      style={settings.workingDays.split(',').includes(i.toString()) ? { backgroundColor: '#00897B' } : {}}
                    >
                      {day}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reminders Tab */}
        <TabsContent value="reminders" className="flex-1 overflow-auto p-6 m-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Confirmation SMS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Send instant confirmation when booking is made
                </p>
                <div className="flex items-center justify-between">
                  <Switch 
                    checked={settings.sendConfirmationSMS}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, sendConfirmationSMS: checked }))}
                  />
                  <Badge variant={settings.sendConfirmationSMS ? 'default' : 'secondary'}
                    className={settings.sendConfirmationSMS ? 'bg-green-100 text-green-700' : ''}>
                    {settings.sendConfirmationSMS ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  24-Hour Reminder
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Remind customers 24 hours before appointment
                </p>
                <div className="flex items-center justify-between">
                  <Switch 
                    checked={settings.sendReminder24h}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, sendReminder24h: checked }))}
                  />
                  <Badge variant={settings.sendReminder24h ? 'default' : 'secondary'}
                    className={settings.sendReminder24h ? 'bg-green-100 text-green-700' : ''}>
                    {settings.sendReminder24h ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BellRing className="h-4 w-4" />
                  2-Hour Reminder
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Final reminder 2 hours before appointment
                </p>
                <div className="flex items-center justify-between">
                  <Switch 
                    checked={settings.sendReminder2h}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, sendReminder2h: checked }))}
                  />
                  <Badge variant={settings.sendReminder2h ? 'default' : 'secondary'}
                    className={settings.sendReminder2h ? 'bg-green-100 text-green-700' : ''}>
                    {settings.sendReminder2h ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                WhatsApp Integration
              </CardTitle>
              <CardDescription>Send reminders via WhatsApp Business API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Enable WhatsApp Reminders</Label>
                  <p className="text-sm text-gray-500">Send reminders via WhatsApp in addition to SMS</p>
                </div>
                <Switch 
                  checked={settings.sendWhatsApp}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, sendWhatsApp: checked }))}
                />
              </div>
              {settings.sendWhatsApp && (
                <div>
                  <Label>WhatsApp Business Number</Label>
                  <Input 
                    value={settings.whatsappNumber || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                    placeholder="+27123456789"
                    className="mt-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reminder Templates */}
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Reminder Templates</CardTitle>
                  <CardDescription>Customize your reminder messages</CardDescription>
                </div>
                <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]">
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Booking Confirmation</p>
                    <Badge>SMS + WhatsApp</Badge>
                  </div>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    Hi {'{customer_name}'}, your booking at {'{business_name}'} is confirmed for {'{date}'} at {'{time}'}. Service: {'{service}'}. Amount: R{'{amount}'}. Reply CANCEL to cancel.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">24-Hour Reminder</p>
                    <Badge>SMS</Badge>
                  </div>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    Hi {'{customer_name}'}, reminder: your appointment at {'{business_name}'} is tomorrow at {'{time}'}. See you soon!
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">2-Hour Reminder</p>
                    <Badge>SMS</Badge>
                  </div>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    Hi {'{customer_name}'}, your appointment at {'{business_name}'} is in 2 hours ({'{time}'}). Please arrive 5 mins early.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Full Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Full Booking Widget Preview</DialogTitle>
            <DialogDescription>
              Test the complete booking flow from start to finish
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button 
                  size="sm" 
                  variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                  onClick={() => setPreviewMode('desktop')}
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  Desktop
                </Button>
                <Button 
                  size="sm" 
                  variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                  onClick={() => setPreviewMode('tablet')}
                >
                  <Tablet className="h-4 w-4 mr-2" />
                  Tablet
                </Button>
                <Button 
                  size="sm" 
                  variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                  onClick={() => setPreviewMode('mobile')}
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  Mobile
                </Button>
              </div>
            </div>
            <div className="bg-gray-100 rounded-lg p-6 flex justify-center">
              {renderBookingPreview()}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetBookingFlow}>
              Reset Preview
            </Button>
            <Button onClick={() => setShowPreviewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
