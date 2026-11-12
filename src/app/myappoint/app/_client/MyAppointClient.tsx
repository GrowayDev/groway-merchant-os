'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Scissors,
  Sparkles,
  Palette,
  Flower2,
  Stethoscope,
  Brush,
  Eye,
  Calendar,
  Users,
  CreditCard,
  BarChart3,
  Clock,
  Star,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  User,
  Gift,
  Settings,
  Bell,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  ClipboardList,
  Building2,
  Timer,
  MessageSquare,
  Camera,
  FileText,
  Heart,
  Send,
  Printer,
  X,
  Check,
  Minus,
  RefreshCw,
  LayoutGrid,
  List,
  MoreVertical,
  Edit,
  Trash2,
  Eye as EyeIcon
} from 'lucide-react'

// Types
type Vertical = 'hair_salon' | 'barber_shop' | 'nail_salon' | 'spa_wellness' | 'aesthetic_clinic' | 'tattoo_studio' | 'lash_brow'
type ViewType = 'dashboard' | 'booking' | 'pos' | 'clients' | 'staff' | 'inventory' | 'reports' | 'settings'

interface Service {
  id: string
  name: string
  category: string
  duration: number // minutes
  price: number
  cost?: number
  description?: string
  staffOnly?: string[] // staff IDs who can perform
  requiresConsent?: boolean
  isCombo?: boolean
  comboServices?: string[]
}

interface Product {
  id: string
  name: string
  category: string
  sku: string
  price: number
  cost: number
  stock: number
  minStock: number
}

interface Staff {
  id: string
  name: string
  role: 'owner' | 'manager' | 'stylist' | 'therapist' | 'receptionist' | 'technician'
  avatar?: string
  color: string
  specialties: string[]
  commission: number
  status: 'active' | 'break' | 'off'
  workingHours?: Record<string, { start: string; end: string }>
}

interface Client {
  id: string
  name: string
  phone: string
  email?: string
  dob?: string
  notes?: string
  tags?: string[]
  loyaltyPoints: number
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum'
  totalSpent: number
  visitCount: number
  lastVisit?: string
  createdAt: string
  preferences?: Record<string, string>
  contraindications?: string[]
}

interface Appointment {
  id: string
  clientId: string
  clientName: string
  staffId: string
  staffName: string
  serviceId: string
  serviceName: string
  date: string
  time: string
  duration: number
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  notes?: string
  deposit?: number
  depositPaid?: boolean
  createdAt: string
}

interface CartItem {
  id: string
  type: 'service' | 'product'
  name: string
  price: number
  quantity: number
  staffId?: string
  staffName?: string
  duration?: number
}

// Vertical configurations
const verticalConfig: Record<Vertical, {
  name: string
  icon: any
  color: string
  categories: string[]
}> = {
  hair_salon: { name: 'Hair Salon', icon: Scissors, color: '#EC4899', categories: ['Cuts', 'Colour', 'Treatments', 'Styling', 'Packages'] },
  barber_shop: { name: 'Barber Shop', icon: Sparkles, color: '#6366F1', categories: ['Cuts', 'Beard', 'Packages', 'Add-ons'] },
  nail_salon: { name: 'Nail Salon', icon: Palette, color: '#F59E0B', categories: ['Manicure', 'Pedicure', 'Extensions', 'Art', 'Treatments'] },
  spa_wellness: { name: 'Spa & Wellness', icon: Flower2, color: '#10B981', categories: ['Massages', 'Facials', 'Body Treatments', 'Packages', 'Day Spa'] },
  aesthetic_clinic: { name: 'Aesthetic Clinic', icon: Stethoscope, color: '#8B5CF6', categories: ['Consultations', 'Injectables', 'Laser', 'Skin', 'Body'] },
  tattoo_studio: { name: 'Tattoo Studio', icon: Brush, color: '#EF4444', categories: ['Tattoos', 'Piercings', 'Touch-ups', 'Consultations', 'Aftercare'] },
  lash_brow: { name: 'Lash & Brow Studio', icon: Eye, color: '#F97316', categories: ['Lash Extensions', 'Lash Lifts', 'Brow Services', 'Tints', 'Combos'] }
}

// Sample data
const sampleStaff: Staff[] = [
  { id: 's1', name: 'Sarah Johnson', role: 'stylist', color: '#EC4899', specialties: ['Cuts', 'Colour'], commission: 35, status: 'active' },
  { id: 's2', name: 'Mike Chen', role: 'stylist', color: '#6366F1', specialties: ['Cuts', 'Beard'], commission: 35, status: 'active' },
  { id: 's3', name: 'Emma Williams', role: 'therapist', color: '#10B981', specialties: ['Massage', 'Facials'], commission: 40, status: 'active' },
  { id: 's4', name: 'Lisa Brown', role: 'technician', color: '#F59E0B', specialties: ['Nails', 'Art'], commission: 30, status: 'break' },
  { id: 's5', name: 'David Miller', role: 'manager', color: '#8B5CF6', specialties: ['All'], commission: 25, status: 'active' },
]

const sampleClients: Client[] = [
  { id: 'c1', name: 'Thandi Nkosi', phone: '+27 82 123 4567', email: 'thandi@email.com', loyaltyPoints: 1250, loyaltyTier: 'gold', totalSpent: 8500, visitCount: 12, createdAt: '2024-01-15' },
  { id: 'c2', name: 'John Smith', phone: '+27 83 987 6543', loyaltyPoints: 450, loyaltyTier: 'silver', totalSpent: 3200, visitCount: 5, createdAt: '2024-06-20' },
  { id: 'c3', name: 'Precious Molefe', phone: '+27 76 543 2109', email: 'precious@email.com', loyaltyPoints: 2800, loyaltyTier: 'platinum', totalSpent: 15000, visitCount: 22, createdAt: '2023-08-10' },
  { id: 'c4', name: 'Michael Van Der Berg', phone: '+27 79 888 7777', loyaltyPoints: 150, loyaltyTier: 'bronze', totalSpent: 850, visitCount: 2, createdAt: '2025-01-10' },
  { id: 'c5', name: 'Zanele Dlamini', phone: '+27 84 111 2222', email: 'zanele@email.com', loyaltyPoints: 890, loyaltyTier: 'silver', totalSpent: 4200, visitCount: 8, createdAt: '2024-03-05' },
]

// Services by vertical
const servicesByVertical: Record<Vertical, Service[]> = {
  hair_salon: [
    { id: 'hs1', name: "Women's Cut & Blowdry", category: 'Cuts', duration: 45, price: 350, cost: 50 },
    { id: 'hs2', name: "Men's Cut", category: 'Cuts', duration: 30, price: 180, cost: 25 },
    { id: 'hs3', name: 'Full Head Colour', category: 'Colour', duration: 120, price: 650, cost: 120, requiresConsent: true },
    { id: 'hs4', name: 'Highlights (Half)', category: 'Colour', duration: 90, price: 450, cost: 80, requiresConsent: true },
    { id: 'hs5', name: 'Highlights (Full)', category: 'Colour', duration: 150, price: 750, cost: 150, requiresConsent: true },
    { id: 'hs6', name: 'Balayage', category: 'Colour', duration: 180, price: 950, cost: 180, requiresConsent: true },
    { id: 'hs7', name: 'Keratin Treatment', category: 'Treatments', duration: 120, price: 850, cost: 200 },
    { id: 'hs8', name: 'Deep Conditioning', category: 'Treatments', duration: 30, price: 150, cost: 30 },
    { id: 'hs9', name: 'Blowdry Only', category: 'Styling', duration: 30, price: 120, cost: 15 },
    { id: 'hs10', name: 'Special Occasion Style', category: 'Styling', duration: 60, price: 350, cost: 40 },
    { id: 'hs11', name: 'Cut + Colour Combo', category: 'Packages', duration: 165, price: 900, cost: 145, isCombo: true, comboServices: ['hs1', 'hs3'] },
    { id: 'hs12', name: 'Bridal Package', category: 'Packages', duration: 180, price: 1500, cost: 200, isCombo: true },
  ],
  barber_shop: [
    { id: 'bs1', name: 'Classic Cut', category: 'Cuts', duration: 30, price: 150, cost: 20 },
    { id: 'bs2', name: 'Fade Cut', category: 'Cuts', duration: 35, price: 180, cost: 25 },
    { id: 'bs3', name: 'Skin Fade', category: 'Cuts', duration: 40, price: 200, cost: 25 },
    { id: 'bs4', name: 'Beard Trim', category: 'Beard', duration: 15, price: 80, cost: 10 },
    { id: 'bs5', name: 'Beard Shape Up', category: 'Beard', duration: 20, price: 100, cost: 12 },
    { id: 'bs6', name: 'Hot Towel Shave', category: 'Beard', duration: 30, price: 150, cost: 20 },
    { id: 'bs7', name: 'Cut + Beard Combo', category: 'Packages', duration: 45, price: 250, cost: 30, isCombo: true },
    { id: 'bs8', name: 'The Full Works', category: 'Packages', duration: 60, price: 350, cost: 45, isCombo: true },
    { id: 'bs9', name: 'Hair Wash', category: 'Add-ons', duration: 10, price: 40, cost: 5 },
    { id: 'bs10', name: 'Scalp Massage', category: 'Add-ons', duration: 10, price: 50, cost: 5 },
  ],
  nail_salon: [
    { id: 'ns1', name: 'Basic Manicure', category: 'Manicure', duration: 30, price: 180, cost: 35 },
    { id: 'ns2', name: 'Gel Manicure', category: 'Manicure', duration: 45, price: 280, cost: 55 },
    { id: 'ns3', name: 'Acrylic Full Set', category: 'Extensions', duration: 90, price: 550, cost: 100 },
    { id: 'ns4', name: 'Gel Extensions', category: 'Extensions', duration: 75, price: 450, cost: 80 },
    { id: 'ns5', name: 'Basic Pedicure', category: 'Pedicure', duration: 45, price: 250, cost: 45 },
    { id: 'ns6', name: 'Spa Pedicure', category: 'Pedicure', duration: 60, price: 350, cost: 65 },
    { id: 'ns7', name: 'Nail Art (Per Nail)', category: 'Art', duration: 10, price: 25, cost: 5 },
    { id: 'ns8', name: 'French Tips', category: 'Art', duration: 15, price: 80, cost: 15 },
    { id: 'ns9', name: 'Gel Polish Soak Off', category: 'Treatments', duration: 20, price: 100, cost: 20 },
    { id: 'ns10', name: 'Nail Repair', category: 'Treatments', duration: 15, price: 50, cost: 10 },
    { id: 'ns11', name: 'Full Set + Design', category: 'Packages', duration: 120, price: 700, cost: 120, isCombo: true },
  ],
  spa_wellness: [
    { id: 'sw1', name: 'Swedish Massage (60min)', category: 'Massages', duration: 60, price: 650, cost: 100 },
    { id: 'sw2', name: 'Deep Tissue Massage (60min)', category: 'Massages', duration: 60, price: 750, cost: 120 },
    { id: 'sw3', name: 'Hot Stone Massage (75min)', category: 'Massages', duration: 75, price: 850, cost: 150 },
    { id: 'sw4', name: 'Classic Facial', category: 'Facials', duration: 60, price: 550, cost: 80 },
    { id: 'sw5', name: 'Anti-Aging Facial', category: 'Facials', duration: 75, price: 750, cost: 120 },
    { id: 'sw6', name: 'Body Scrub', category: 'Body Treatments', duration: 45, price: 450, cost: 70 },
    { id: 'sw7', name: 'Body Wrap', category: 'Body Treatments', duration: 60, price: 550, cost: 90 },
    { id: 'sw8', name: 'Half Day Spa Package', category: 'Day Spa', duration: 180, price: 1500, cost: 250, isCombo: true },
    { id: 'sw9', name: 'Full Day Spa Package', category: 'Day Spa', duration: 360, price: 2500, cost: 400, isCombo: true },
    { id: 'sw10', name: 'Couples Package', category: 'Packages', duration: 120, price: 1800, cost: 300, isCombo: true },
  ],
  aesthetic_clinic: [
    { id: 'ac1', name: 'Initial Consultation', category: 'Consultations', duration: 30, price: 350, cost: 0 },
    { id: 'ac2', name: 'Follow-up Consultation', category: 'Consultations', duration: 15, price: 200, cost: 0 },
    { id: 'ac3', name: 'Botox (Per Area)', category: 'Injectables', duration: 30, price: 1800, cost: 600, requiresConsent: true },
    { id: 'ac4', name: 'Dermal Fillers (Per Area)', category: 'Injectables', duration: 45, price: 3500, cost: 1200, requiresConsent: true },
    { id: 'ac5', name: 'Laser Hair Removal (Small)', category: 'Laser', duration: 30, price: 450, cost: 100 },
    { id: 'ac6', name: 'Laser Hair Removal (Large)', category: 'Laser', duration: 45, price: 850, cost: 180 },
    { id: 'ac7', name: 'Chemical Peel', category: 'Skin', duration: 45, price: 650, cost: 120, requiresConsent: true },
    { id: 'ac8', name: 'Microneedling', category: 'Skin', duration: 60, price: 1200, cost: 250, requiresConsent: true },
    { id: 'ac9', name: 'CoolSculpting', category: 'Body', duration: 60, price: 4500, cost: 1500, requiresConsent: true },
    { id: 'ac10', name: 'Skin Rejuvenation Package', category: 'Packages', duration: 90, price: 3500, cost: 800, isCombo: true, requiresConsent: true },
  ],
  tattoo_studio: [
    { id: 'ts1', name: 'Consultation', category: 'Consultations', duration: 30, price: 0, cost: 0 },
    { id: 'ts2', name: 'Small Tattoo (<5cm)', category: 'Tattoos', duration: 60, price: 800, cost: 100 },
    { id: 'ts3', name: 'Medium Tattoo (5-10cm)', category: 'Tattoos', duration: 120, price: 1500, cost: 200 },
    { id: 'ts4', name: 'Large Tattoo (>10cm)', category: 'Tattoos', duration: 180, price: 2500, cost: 350 },
    { id: 'ts5', name: 'Custom Piece (Hourly)', category: 'Tattoos', duration: 60, price: 1200, cost: 150 },
    { id: 'ts6', name: 'Ear Piercing', category: 'Piercings', duration: 15, price: 250, cost: 30 },
    { id: 'ts7', name: 'Body Piercing', category: 'Piercings', duration: 20, price: 350, cost: 50 },
    { id: 'ts8', name: 'Touch-up Session', category: 'Touch-ups', duration: 60, price: 400, cost: 50 },
    { id: 'ts9', name: 'Cover-up Consultation', category: 'Consultations', duration: 45, price: 200, cost: 0 },
    { id: 'ts10', name: 'Aftercare Kit', category: 'Aftercare', duration: 0, price: 150, cost: 45 },
  ],
  lash_brow: [
    { id: 'lb1', name: 'Classic Lash Set', category: 'Lash Extensions', duration: 90, price: 550, cost: 80 },
    { id: 'lb2', name: 'Volume Lash Set', category: 'Lash Extensions', duration: 120, price: 750, cost: 120 },
    { id: 'lb3', name: 'Hybrid Lash Set', category: 'Lash Extensions', duration: 105, price: 650, cost: 100 },
    { id: 'lb4', name: 'Lash Lift', category: 'Lash Lifts', duration: 60, price: 400, cost: 60 },
    { id: 'lb5', name: 'Lash Lift + Tint', category: 'Lash Lifts', duration: 75, price: 500, cost: 80 },
    { id: 'lb6', name: 'Brow Wax & Shape', category: 'Brow Services', duration: 20, price: 150, cost: 20 },
    { id: 'lb7', name: 'Brow Lamination', category: 'Brow Services', duration: 45, price: 350, cost: 50 },
    { id: 'lb8', name: 'Brow Tint', category: 'Tints', duration: 20, price: 120, cost: 15 },
    { id: 'lb9', name: 'Lash Infill (2 Week)', category: 'Lash Extensions', duration: 60, price: 300, cost: 40 },
    { id: 'lb10', name: 'Lash Infill (3 Week)', category: 'Lash Extensions', duration: 75, price: 400, cost: 60 },
    { id: 'lb11', name: 'Full Lash & Brow Combo', category: 'Combos', duration: 135, price: 850, cost: 130, isCombo: true },
  ],
}

// Products (retail)
const sampleProducts: Product[] = [
  { id: 'p1', name: 'Shampoo 250ml', category: 'Hair Care', sku: 'HC001', price: 180, cost: 90, stock: 24, minStock: 5 },
  { id: 'p2', name: 'Conditioner 250ml', category: 'Hair Care', sku: 'HC002', price: 180, cost: 90, stock: 20, minStock: 5 },
  { id: 'p3', name: 'Hair Serum 50ml', category: 'Hair Care', sku: 'HC003', price: 250, cost: 120, stock: 15, minStock: 3 },
  { id: 'p4', name: 'Nail Polish Remover', category: 'Nail Care', sku: 'NC001', price: 65, cost: 25, stock: 30, minStock: 10 },
  { id: 'p5', name: 'Cuticle Oil 15ml', category: 'Nail Care', sku: 'NC002', price: 95, cost: 35, stock: 18, minStock: 5 },
  { id: 'p6', name: 'Hand Cream 75ml', category: 'Skin Care', sku: 'SC001', price: 120, cost: 45, stock: 22, minStock: 5 },
  { id: 'p7', name: 'Facial Cleanser', category: 'Skin Care', sku: 'SC002', price: 220, cost: 85, stock: 12, minStock: 3 },
  { id: 'p8', name: 'Aftercare Balm', category: 'Tattoo', sku: 'TT001', price: 150, cost: 45, stock: 40, minStock: 10 },
]

// Time slots for booking
const generateTimeSlots = () => {
  const slots = []
  for (let hour = 8; hour < 20; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`)
    slots.push(`${hour.toString().padStart(2, '0')}:30`)
  }
  return slots
}

const timeSlots = generateTimeSlots()

// Main App Component (uses useSearchParams - needs Suspense wrapper)
function MyAppointAppContent() {
  const searchParams = useSearchParams()
  const verticalParam = searchParams.get('vertical') as Vertical | null
  
  const [selectedVertical, setSelectedVertical] = useState<Vertical>(verticalParam || 'hair_salon')
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  // Data states
  const [staff] = useState<Staff[]>(sampleStaff)
  const [clients, setClients] = useState<Client[]>(sampleClients)
  const [appointments, setAppointments] = useState<Appointment[]>([
    { id: 'a1', clientId: 'c1', clientName: 'Thandi Nkosi', staffId: 's1', staffName: 'Sarah Johnson', serviceId: 'hs1', serviceName: "Women's Cut & Blowdry", date: '2026-03-11', time: '09:00', duration: 45, status: 'confirmed', createdAt: '2026-03-10' },
    { id: 'a2', clientId: 'c2', clientName: 'John Smith', staffId: 's2', staffName: 'Mike Chen', serviceId: 'bs1', serviceName: 'Classic Cut', date: '2026-03-11', time: '10:00', duration: 30, status: 'scheduled', createdAt: '2026-03-10' },
    { id: 'a3', clientId: 'c3', clientName: 'Precious Molefe', staffId: 's3', staffName: 'Emma Williams', serviceId: 'sw1', serviceName: 'Swedish Massage (60min)', date: '2026-03-11', time: '11:00', duration: 60, status: 'in_progress', createdAt: '2026-03-09' },
  ])
  const [cart, setCart] = useState<CartItem[]>([])
  const [products] = useState<Product[]>(sampleProducts)
  
  // UI states
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Dialog states
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const [showClientDialog, setShowClientDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showNewClientDialog, setShowNewClientDialog] = useState(false)
  
  // New client form
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '', notes: '' })
  
  // Get vertical config
  const vertical = verticalConfig[selectedVertical]
  const services = servicesByVertical[selectedVertical]
  const VerticalIcon = vertical.icon
  
  // Calculate cart total
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const cartDuration = cart.reduce((sum, item) => sum + (item.duration || 0), 0)
  
  // Add to cart
  const addToCart = (item: Service | Product, type: 'service' | 'product', staffMember?: Staff) => {
    const existingIndex = cart.findIndex(c => c.id === item.id && c.type === type)
    if (existingIndex >= 0) {
      const updated = [...cart]
      updated[existingIndex].quantity += 1
      setCart(updated)
    } else {
      setCart([...cart, {
        id: item.id,
        type,
        name: item.name,
        price: item.price,
        quantity: 1,
        duration: 'duration' in item ? item.duration : undefined,
        staffId: staffMember?.id,
        staffName: staffMember?.name
      }])
    }
    toast.success(`Added ${item.name} to ticket`)
  }
  
  // Remove from cart
  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
  }
  
  // Create appointment
  const createAppointment = () => {
    if (!selectedClient || !selectedStaff || !selectedService || !selectedTime) {
      toast.error('Please fill all fields')
      return
    }
    
    const service = services.find(s => s.id === selectedService)
    const staffMember = staff.find(s => s.id === selectedStaff)
    
    const newAppt: Appointment = {
      id: `a${Date.now()}`,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      staffId: selectedStaff,
      staffName: staffMember?.name || '',
      serviceId: selectedService,
      serviceName: service?.name || '',
      date: selectedDate,
      time: selectedTime,
      duration: service?.duration || 30,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    }
    
    setAppointments([...appointments, newAppt])
    setShowBookingDialog(false)
    toast.success('Appointment created successfully!')
    
    // Reset form
    setSelectedClient(null)
    setSelectedService(null)
    setSelectedTime(null)
  }
  
  // Create new client
  const createClient = () => {
    if (!newClient.name || !newClient.phone) {
      toast.error('Name and phone are required')
      return
    }
    
    const client: Client = {
      id: `c${Date.now()}`,
      name: newClient.name,
      phone: newClient.phone,
      email: newClient.email,
      notes: newClient.notes,
      loyaltyPoints: 0,
      loyaltyTier: 'bronze',
      totalSpent: 0,
      visitCount: 0,
      createdAt: new Date().toISOString()
    }
    
    setClients([...clients, client])
    setShowNewClientDialog(false)
    setSelectedClient(client)
    setNewClient({ name: '', phone: '', email: '', notes: '' })
    toast.success('Client created!')
  }
  
  // Process payment
  const processPayment = (method: string) => {
    toast.success(`Payment of R${cartTotal.toFixed(2)} via ${method} successful!`)
    setCart([])
    setShowPaymentDialog(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center flex-shrink-0">
              <VerticalIcon className="h-5 w-5" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="font-bold text-gray-900">MyAppoint</h1>
                <p className="text-xs text-gray-500">{vertical.name}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Vertical Selector */}
        {!sidebarCollapsed && (
          <div className="p-3 border-b border-gray-100">
            <Select value={selectedVertical} onValueChange={(v) => setSelectedVertical(v as Vertical)}>
              <SelectTrigger className="bg-gray-50 border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(verticalConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {[
            { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
            { id: 'booking', icon: Calendar, label: 'Booking' },
            { id: 'pos', icon: ShoppingCart, label: 'POS' },
            { id: 'clients', icon: Users, label: 'Clients' },
            { id: 'staff', icon: User, label: 'Staff' },
            { id: 'inventory', icon: ClipboardList, label: 'Inventory' },
            { id: 'reports', icon: TrendingUp, label: 'Reports' },
            { id: 'settings', icon: Settings, label: 'Settings' },
          ].map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as ViewType)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-pink-50 text-pink-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5" />
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            )
          })}
        </nav>
        
        {/* Collapse Button */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-50"
          >
            <ArrowLeft className={`h-4 w-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search clients, services..." 
                className="pl-10 w-80 bg-gray-50 border-gray-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-gray-500" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
            </Button>
            <div className="w-px h-6 bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-sm font-medium">
                AD
              </div>
              <span className="text-sm font-medium text-gray-700">Admin</span>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <div className="flex-1 p-6 overflow-auto">
          {currentView === 'dashboard' && (
            <DashboardView 
              vertical={vertical}
              appointments={appointments}
              clients={clients}
              staff={staff}
              services={services}
              selectedDate={selectedDate}
            />
          )}
          
          {currentView === 'booking' && (
            <BookingView
              vertical={vertical}
              appointments={appointments}
              clients={clients}
              staff={staff}
              services={services}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              onNewBooking={() => setShowBookingDialog(true)}
            />
          )}
          
          {currentView === 'pos' && (
            <POSView
              vertical={vertical}
              services={services}
              products={products}
              staff={staff}
              cart={cart}
              addToCart={addToCart}
              removeFromCart={removeFromCart}
              cartTotal={cartTotal}
              cartDuration={cartDuration}
              onCheckout={() => setShowPaymentDialog(true)}
            />
          )}
          
          {currentView === 'clients' && (
            <ClientsView
              clients={clients}
              onNewClient={() => setShowNewClientDialog(true)}
              onSelectClient={(client) => {
                setSelectedClient(client)
                setShowClientDialog(true)
              }}
            />
          )}
          
          {currentView === 'staff' && (
            <StaffView staff={staff} />
          )}
          
          {currentView === 'inventory' && (
            <InventoryView products={products} />
          )}
          
          {currentView === 'reports' && (
            <ReportsView />
          )}
          
          {currentView === 'settings' && (
            <SettingsView vertical={vertical} />
          )}
        </div>
      </main>
      
      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>New Appointment</DialogTitle>
            <DialogDescription>Create a new booking</DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-4">
              <div>
                <Label>Client</Label>
                <div className="flex gap-2 mt-1">
                  <Select value={selectedClient?.id} onValueChange={(v) => setSelectedClient(clients.find(c => c.id === v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="outline" onClick={() => setShowNewClientDialog(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div>
                <Label>Service</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} - R{s.price} ({s.duration}min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Staff</Label>
                <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.filter(s => s.status === 'active').map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Date</Label>
                <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="mt-1" />
              </div>
              
              <div>
                <Label>Time</Label>
                <Select value={selectedTime || ''} onValueChange={setSelectedTime}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {timeSlots.map(slot => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedService && (
                <div className="p-3 bg-pink-50 rounded-lg">
                  <div className="text-sm text-gray-600">Selected Service</div>
                  <div className="font-semibold">{services.find(s => s.id === selectedService)?.name}</div>
                  <div className="text-sm text-gray-500">
                    {services.find(s => s.id === selectedService)?.duration} min • R{services.find(s => s.id === selectedService)?.price}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookingDialog(false)}>Cancel</Button>
            <Button onClick={createAppointment} className="bg-pink-500 hover:bg-pink-600">Create Booking</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* New Client Dialog */}
      <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>New Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Name *</Label>
              <Input value={newClient.name} onChange={(e) => setNewClient({...newClient, name: e.target.value})} />
            </div>
            <div>
              <Label>Phone *</Label>
              <Input value={newClient.phone} onChange={(e) => setNewClient({...newClient, phone: e.target.value})} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={newClient.email} onChange={(e) => setNewClient({...newClient, email: e.target.value})} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={newClient.notes} onChange={(e) => setNewClient({...newClient, notes: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewClientDialog(false)}>Cancel</Button>
            <Button onClick={createClient} className="bg-pink-500 hover:bg-pink-600">Create Client</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="text-center mb-6">
              <div className="text-3xl font-bold">R{cartTotal.toFixed(2)}</div>
              <div className="text-gray-500">{cart.length} items</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['Cash', 'Card', 'EFT', 'Gift Card'].map(method => (
                <Button
                  key={method}
                  variant="outline"
                  className="h-16 text-lg"
                  onClick={() => processPayment(method)}
                >
                  {method}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Client Detail Dialog */}
      <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>Client Profile</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="py-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xl font-bold">
                  {selectedClient.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedClient.name}</h3>
                  <p className="text-gray-500">{selectedClient.phone}</p>
                  <Badge className="mt-1">{selectedClient.loyaltyTier} member</Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold">R{selectedClient.totalSpent.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Total Spent</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold">{selectedClient.visitCount}</div>
                  <div className="text-xs text-gray-500">Visits</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold">{selectedClient.loyaltyPoints}</div>
                  <div className="text-xs text-gray-500">Points</div>
                </div>
              </div>
              
              {selectedClient.email && (
                <div className="text-sm text-gray-600">
                  <Mail className="h-4 w-4 inline mr-2" />
                  {selectedClient.email}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Dashboard View Component
function DashboardView({ vertical, appointments, clients, staff, services, selectedDate }: {
  vertical: typeof verticalConfig[Vertical]
  appointments: Appointment[]
  clients: Client[]
  staff: Staff[]
  services: Service[]
  selectedDate: string
}) {
  const todaysAppointments = appointments.filter(a => a.date === selectedDate)
  const totalRevenue = services.reduce((sum, s) => sum + s.price, 0)
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back! Here's your {vertical.name} overview.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          {new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Today's Bookings", value: todaysAppointments.length, icon: Calendar, color: '#EC4899' },
          { label: 'Total Clients', value: clients.length, icon: Users, color: '#6366F1' },
          { label: 'Active Staff', value: staff.filter(s => s.status === 'active').length, icon: User, color: '#10B981' },
          { label: 'Services', value: services.length, icon: Star, color: '#F59E0B' },
        ].map((kpi, idx) => {
          const Icon = kpi.icon
          return (
            <Card key={idx}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{kpi.label}</p>
                    <p className="text-2xl font-bold">{kpi.value}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${kpi.color}15` }}>
                    <Icon className="h-6 w-6" style={{ color: kpi.color }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {/* Today's Schedule */}
      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            {todaysAppointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No appointments scheduled for today
              </div>
            ) : (
              <div className="space-y-3">
                {todaysAppointments.map(appt => (
                  <div key={appt.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-mono text-gray-500 w-16">{appt.time}</div>
                    <div className="flex-1">
                      <div className="font-medium">{appt.clientName}</div>
                      <div className="text-sm text-gray-500">{appt.serviceName} • {appt.staffName}</div>
                    </div>
                    <Badge className={
                      appt.status === 'completed' ? 'bg-green-100 text-green-700' :
                      appt.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      appt.status === 'confirmed' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }>
                      {appt.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Staff Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {staff.map(s => (
                <div key={s.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full text-white flex items-center justify-center text-sm font-medium" style={{ backgroundColor: s.color }}>
                    {s.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{s.name}</div>
                    <div className="text-xs text-gray-500">{s.role}</div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${s.status === 'active' ? 'bg-green-500' : s.status === 'break' ? 'bg-yellow-500' : 'bg-gray-300'}`} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Booking View Component
function BookingView({ vertical, appointments, clients, staff, services, selectedDate, setSelectedDate, onNewBooking }: {
  vertical: typeof verticalConfig[Vertical]
  appointments: Appointment[]
  clients: Client[]
  staff: Staff[]
  services: Service[]
  selectedDate: string
  setSelectedDate: (d: string) => void
  onNewBooking: () => void
}) {
  const hours = Array.from({ length: 12 }, (_, i) => i + 8) // 8am to 8pm
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Booking Calendar</h1>
        <Button onClick={onNewBooking} className="bg-pink-500 hover:bg-pink-600">
          <Plus className="h-4 w-4 mr-2" />
          New Booking
        </Button>
      </div>
      
      <div className="flex gap-4">
        <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-48" />
        <Select defaultValue="all">
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Staff" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Staff</SelectItem>
            {staff.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-[80px_1fr]">
            {/* Time column */}
            <div className="border-r border-gray-100">
              {hours.map(hour => (
                <div key={hour} className="h-16 border-b border-gray-50 flex items-center justify-center text-xs text-gray-400">
                  {hour}:00
                </div>
              ))}
            </div>
            
            {/* Appointments grid */}
            <div className="relative">
              {hours.map(hour => (
                <div key={hour} className="h-16 border-b border-gray-50" />
              ))}
              
              {/* Appointment blocks */}
              {appointments.filter(a => a.date === selectedDate).map(appt => {
                const startHour = parseInt(appt.time.split(':')[0])
                const top = (startHour - 8) * 64 // 64px per hour
                const height = (appt.duration / 60) * 64
                
                return (
                  <div
                    key={appt.id}
                    className="absolute left-2 right-2 bg-pink-100 border-l-4 border-pink-500 rounded-r p-2 cursor-pointer hover:bg-pink-200"
                    style={{ top, height }}
                  >
                    <div className="text-xs font-medium text-pink-900">{appt.time} - {appt.clientName}</div>
                    <div className="text-xs text-pink-700">{appt.serviceName}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// POS View Component
function POSView({ vertical, services, products, staff, cart, addToCart, removeFromCart, cartTotal, cartDuration, onCheckout }: {
  vertical: typeof verticalConfig[Vertical]
  services: Service[]
  products: Product[]
  staff: Staff[]
  cart: CartItem[]
  addToCart: (item: Service | Product, type: 'service' | 'product', staffMember?: Staff) => void
  removeFromCart: (index: number) => void
  cartTotal: number
  cartDuration: number
  onCheckout: () => void
}) {
  const [activeTab, setActiveTab] = useState('services')
  const [selectedCategory, setSelectedCategory] = useState('all')
  
  const filteredServices = selectedCategory === 'all' ? services : services.filter(s => s.category === selectedCategory)
  
  return (
    <div className="flex gap-6 h-[calc(100vh-140px)]">
      {/* Left: Service/Product Selection */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Categories */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <Button variant={selectedCategory === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory('all')}
            className={selectedCategory === 'all' ? 'bg-pink-500 hover:bg-pink-600' : ''}>
            All
          </Button>
          {vertical.categories.map(cat => (
            <Button key={cat} variant={selectedCategory === cat ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(cat)}
              className={selectedCategory === cat ? 'bg-pink-500 hover:bg-pink-600' : ''}>
              {cat}
            </Button>
          ))}
        </div>
        
        {/* Items Grid */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'services' ? (
            <div className="grid grid-cols-3 gap-3">
              {filteredServices.map(service => (
                <Card key={service.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => addToCart(service, 'service')}>
                  <CardContent className="p-3">
                    <div className="font-medium text-sm">{service.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{service.duration} min</div>
                    <div className="text-lg font-bold mt-2" style={{ color: vertical.color }}>R{service.price}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {products.map(product => (
                <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => addToCart(product, 'product')}>
                  <CardContent className="p-3">
                    <div className="font-medium text-sm">{product.name}</div>
                    <div className="text-xs text-gray-500">{product.sku}</div>
                    <div className="text-lg font-bold mt-2">R{product.price}</div>
                    <div className="text-xs text-gray-400 mt-1">Stock: {product.stock}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Right: Cart/Ticket */}
      <Card className="w-96 flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Current Ticket</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {cart.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No items in ticket</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-2 overflow-auto">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{item.name}</div>
                      {item.staffName && <div className="text-xs text-gray-500">{item.staffName}</div>}
                      {item.duration && <div className="text-xs text-gray-400">{item.duration} min</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-bold">R{(item.price * item.quantity).toFixed(0)}</div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFromCart(idx)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Duration</span>
                  <span>{cartDuration} min</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>R{cartTotal.toFixed(2)}</span>
                </div>
                <Button onClick={onCheckout} className="w-full bg-pink-500 hover:bg-pink-600">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Checkout
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Clients View Component
function ClientsView({ clients, onNewClient, onSelectClient }: {
  clients: Client[]
  onNewClient: () => void
  onSelectClient: (client: Client) => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <Button onClick={onNewClient} className="bg-pink-500 hover:bg-pink-600">
          <Plus className="h-4 w-4 mr-2" />
          New Client
        </Button>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {clients.map(client => (
          <Card key={client.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onSelectClient(client)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold">
                  {client.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{client.name}</div>
                  <div className="text-sm text-gray-500">{client.phone}</div>
                </div>
                <Badge>{client.loyaltyTier}</Badge>
              </div>
              <div className="mt-3 flex justify-between text-sm text-gray-500">
                <span>{client.visitCount} visits</span>
                <span>R{client.totalSpent.toLocaleString()} spent</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Staff View Component
function StaffView({ staff }: { staff: Staff[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
        <Button className="bg-pink-500 hover:bg-pink-600">
          <Plus className="h-4 w-4 mr-2" />
          Add Staff
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {staff.map(s => (
          <Card key={s.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full text-white flex items-center justify-center text-lg font-bold" style={{ backgroundColor: s.color }}>
                  {s.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-sm text-gray-500 capitalize">{s.role}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${s.status === 'active' ? 'bg-green-500' : s.status === 'break' ? 'bg-yellow-500' : 'bg-gray-300'}`} />
                    <span className="text-xs text-gray-500 capitalize">{s.status}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{s.commission}%</div>
                  <div className="text-xs text-gray-500">Commission</div>
                </div>
              </div>
              <div className="mt-3 flex gap-1 flex-wrap">
                {s.specialties.map((spec, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">{spec}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Inventory View Component
function InventoryView({ products }: { products: Product[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <Button className="bg-pink-500 hover:bg-pink-600">
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-gray-500">Product</th>
                <th className="text-left p-3 text-sm font-medium text-gray-500">SKU</th>
                <th className="text-left p-3 text-sm font-medium text-gray-500">Category</th>
                <th className="text-right p-3 text-sm font-medium text-gray-500">Price</th>
                <th className="text-right p-3 text-sm font-medium text-gray-500">Stock</th>
                <th className="text-right p-3 text-sm font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-t border-gray-100">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 text-gray-500">{p.sku}</td>
                  <td className="p-3 text-gray-500">{p.category}</td>
                  <td className="p-3 text-right">R{p.price}</td>
                  <td className="p-3 text-right">{p.stock}</td>
                  <td className="p-3 text-right">
                    <Badge className={p.stock <= p.minStock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                      {p.stock <= p.minStock ? 'Low Stock' : 'In Stock'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

// Reports View Component
function ReportsView() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
      
      <div className="grid grid-cols-2 gap-4">
        {[
          { name: 'Daily Sales', icon: DollarSign },
          { name: 'Staff Performance', icon: Users },
          { name: 'Client Analytics', icon: BarChart3 },
          { name: 'Service Popularity', icon: Star },
        ].map((report, idx) => {
          const Icon = report.icon
          return (
            <Card key={idx} className="cursor-pointer hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-pink-500" />
                  </div>
                  <div>
                    <div className="font-semibold">{report.name}</div>
                    <div className="text-sm text-gray-500">View report</div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// Settings View Component
function SettingsView({ vertical }: { vertical: typeof verticalConfig[Vertical] }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Business Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Business Name</Label>
              <Input defaultValue="MyAppoint Salon" className="mt-1" />
            </div>
            <div>
              <Label>Vertical</Label>
              <Input value={vertical.name} disabled className="mt-1" />
            </div>
            <div>
              <Label>VAT Rate (%)</Label>
              <Input defaultValue="15" type="number" className="mt-1" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Booking Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Minimum Booking Notice (hours)</Label>
              <Input defaultValue="2" type="number" className="mt-1" />
            </div>
            <div>
              <Label>Maximum Advance Booking (days)</Label>
              <Input defaultValue="90" type="number" className="mt-1" />
            </div>
            <div>
              <Label>Default Deposit (%)</Label>
              <Input defaultValue="20" type="number" className="mt-1" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Loading fallback component
function MyAppointAppLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 animate-pulse" />
        <p className="text-gray-500">Loading MyAppoint...</p>
      </div>
    </div>
  )
}

// Export wrapped in Suspense for useSearchParams
export default function MyAppointApp() {
  return (
    <Suspense fallback={<MyAppointAppLoading />}>
      <MyAppointAppContent />
    </Suspense>
  )
}

