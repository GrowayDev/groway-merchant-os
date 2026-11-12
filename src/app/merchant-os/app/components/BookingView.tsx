'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
} from 'lucide-react'

// Types
interface Stylist {
  id: string
  name: string
  avatar: string
  specialties: string[]
  rating: number
  status: 'available' | 'busy' | 'break' | 'off'
  color: string
}

interface Service {
  id: string
  name: string
  category: string
  duration: number // in minutes
  price: number
  description?: string
}

interface Appointment {
  id: string
  customerId: string
  customerName: string
  customerPhone: string
  stylistId: string
  serviceId: string
  date: string
  time: string
  duration: number
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show'
  notes?: string
  total: number
}

interface WalkIn {
  id: string
  customerName: string
  phone?: string
  service: string
  stylistPreference?: string
  waitTime: number
  position: number
  status: 'waiting' | 'called' | 'seated'
}

// Sample Data
const sampleStylists: Stylist[] = [
  { id: 's1', name: 'Nomsa Dlamini', avatar: '👩🏿', specialties: ['Haircut', 'Coloring', 'Braids'], rating: 4.9, status: 'available', color: '#00897B' },
  { id: 's2', name: 'Thabo Molefe', avatar: '👨🏿', specialties: ['Haircut', 'Fade', 'Beard'], rating: 4.8, status: 'busy', color: '#FF6B6B' },
  { id: 's3', name: 'Zanele Nkosi', avatar: '👩🏿', specialties: ['Nails', 'Manicure', 'Pedicure'], rating: 4.7, status: 'available', color: '#4ECDC4' },
  { id: 's4', name: 'Kagiso Mokoena', avatar: '👨🏿', specialties: ['Haircut', 'Styling', 'Treatment'], rating: 4.6, status: 'break', color: '#9B59B6' },
  { id: 's5', name: 'Lerato Sithole', avatar: '👩🏿', specialties: ['Makeup', 'Facial', 'Spa'], rating: 4.9, status: 'off', color: '#E74C3C' },
]

const sampleServices: Service[] = [
  { id: 'sv1', name: 'Haircut - Ladies', category: 'Hair', duration: 45, price: 180, description: 'Wash, cut & style' },
  { id: 'sv2', name: 'Haircut - Gentlemen', category: 'Hair', duration: 30, price: 120, description: 'Cut & style' },
  { id: 'sv3', name: 'Fade Cut', category: 'Hair', duration: 35, price: 150, description: 'Precision fade' },
  { id: 'sv4', name: 'Hair Coloring', category: 'Hair', duration: 120, price: 650, description: 'Full color' },
  { id: 'sv5', name: 'Braids - Medium', category: 'Hair', duration: 240, price: 850, description: 'Medium box braids' },
  { id: 'sv6', name: 'Manicure', category: 'Nails', duration: 45, price: 180, description: 'File, shape & polish' },
  { id: 'sv7', name: 'Pedicure', category: 'Nails', duration: 60, price: 250, description: 'Soak, scrub & polish' },
  { id: 'sv8', name: 'Gel Nails', category: 'Nails', duration: 75, price: 350, description: 'Full set gel' },
  { id: 'sv9', name: 'Facial Treatment', category: 'Spa', duration: 60, price: 450, description: 'Deep cleanse facial' },
  { id: 'sv10', name: 'Beard Trim', category: 'Hair', duration: 20, price: 80, description: 'Shape & trim' },
  { id: 'sv11', name: 'Wash & Blow Dry', category: 'Hair', duration: 30, price: 150, description: 'Wash & style' },
  { id: 'sv12', name: 'Full Spa Package', category: 'Spa', duration: 180, price: 1200, description: 'Facial, massage & nails' },
]

const sampleAppointments: Appointment[] = [
  { id: 'a1', customerId: 'c1', customerName: 'Precious Mokoena', customerPhone: '082 123 4567', stylistId: 's1', serviceId: 'sv1', date: '2026-02-20', time: '09:00', duration: 45, status: 'confirmed', total: 180 },
  { id: 'a2', customerId: 'c2', customerName: 'John Khumalo', customerPhone: '083 234 5678', stylistId: 's2', serviceId: 'sv3', date: '2026-02-20', time: '09:30', duration: 35, status: 'in-progress', total: 150 },
  { id: 'a3', customerId: 'c3', customerName: 'Dineo Tshabalala', customerPhone: '084 345 6789', stylistId: 's3', serviceId: 'sv6', date: '2026-02-20', time: '10:00', duration: 45, status: 'scheduled', total: 180 },
  { id: 'a4', customerId: 'c4', customerName: 'Sipho Ndaba', customerPhone: '085 456 7890', stylistId: 's1', serviceId: 'sv4', date: '2026-02-20', time: '11:00', duration: 120, status: 'scheduled', total: 650 },
  { id: 'a5', customerId: 'c5', customerName: 'Mpho Mokoena', customerPhone: '086 567 8901', stylistId: 's4', serviceId: 'sv2', date: '2026-02-20', time: '14:00', duration: 30, status: 'scheduled', total: 120 },
]

const sampleWalkIns: WalkIn[] = [
  { id: 'w1', customerName: 'Walk-in Customer', phone: '', service: 'Haircut - Gentlemen', waitTime: 5, position: 1, status: 'waiting' },
  { id: 'w2', customerName: 'Siphiwe Mabaso', phone: '082 999 8888', service: 'Fade Cut', stylistPreference: 'Thabo', waitTime: 12, position: 2, status: 'waiting' },
]

// Time slots for the day
const timeSlots = Array.from({ length: 22 }, (_, i) => {
  const hour = Math.floor(8 + i / 2)
  const minute = i % 2 === 0 ? '00' : '30'
  return `${hour.toString().padStart(2, '0')}:${minute}`
})

export function BookingView() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedTab, setSelectedTab] = useState('calendar')
  const [selectedStylist, setSelectedStylist] = useState<string | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>(sampleAppointments)
  const [walkIns, setWalkIns] = useState<WalkIn[]>(sampleWalkIns)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Dialog states
  const [newBookingOpen, setNewBookingOpen] = useState(false)
  const [appointmentDetailOpen, setAppointmentDetailOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  
  // New booking form
  const [newBooking, setNewBooking] = useState({
    customerName: '',
    customerPhone: '',
    stylistId: '',
    serviceId: '',
    date: selectedDate,
    time: '09:00',
    notes: '',
  })

  // Get appointments for selected date
  const dayAppointments = useMemo(() => {
    return appointments.filter(a => a.date === selectedDate)
  }, [appointments, selectedDate])

  // Stats
  const stats = useMemo(() => {
    const todayAppts = appointments.filter(a => a.date === selectedDate)
    const completed = todayAppts.filter(a => a.status === 'completed').length
    const scheduled = todayAppts.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length
    const inProgress = todayAppts.filter(a => a.status === 'in-progress').length
    const totalRevenue = todayAppts.reduce((sum, a) => sum + a.total, 0)
    
    return { completed, scheduled, inProgress, total: todayAppts.length, totalRevenue, waiting: walkIns.length }
  }, [appointments, selectedDate, walkIns])

  // Get service by ID
  const getService = (id: string) => sampleServices.find(s => s.id === id)
  const getStylist = (id: string) => sampleStylists.find(s => s.id === id)

  // Navigate dates
  const navigateDate = (direction: 'prev' | 'next') => {
    const current = new Date(selectedDate)
    current.setDate(current.getDate() + (direction === 'next' ? 1 : -1))
    setSelectedDate(current.toISOString().split('T')[0])
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  // Create new appointment
  const handleCreateBooking = () => {
    const service = getService(newBooking.serviceId)
    if (!service) return

    const appointment: Appointment = {
      id: `a${Date.now()}`,
      customerId: `c${Date.now()}`,
      customerName: newBooking.customerName,
      customerPhone: newBooking.customerPhone,
      stylistId: newBooking.stylistId,
      serviceId: newBooking.serviceId,
      date: newBooking.date,
      time: newBooking.time,
      duration: service.duration,
      status: 'scheduled',
      notes: newBooking.notes,
      total: service.price,
    }

    setAppointments(prev => [...prev, appointment])
    setNewBookingOpen(false)
    setNewBooking({
      customerName: '',
      customerPhone: '',
      stylistId: '',
      serviceId: '',
      date: selectedDate,
      time: '09:00',
      notes: '',
    })
  }

  // Update appointment status
  const updateAppointmentStatus = (id: string, status: Appointment['status']) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  // Call walk-in
  const callWalkIn = (id: string) => {
    setWalkIns(prev => prev.map(w => w.id === id ? { ...w, status: 'called' } : w))
  }

  // Available time slots (not booked)
  const getAvailableSlots = (stylistId: string) => {
    const stylistAppts = dayAppointments.filter(a => a.stylistId === stylistId)
    const bookedTimes = stylistAppts.map(a => a.time)
    return timeSlots.filter(t => !bookedTimes.includes(t))
  }

  // Render calendar grid
  const renderCalendarGrid = () => {
    const hours = Array.from({ length: 11 }, (_, i) => i + 8) // 8 AM to 6 PM
    
    return (
      <div className="relative overflow-auto">
        {/* Time column */}
        <div className="flex">
          <div className="w-16 flex-shrink-0 border-r border-gray-200">
            <div className="h-12 border-b border-gray-200 bg-gray-50" />
            {hours.map(hour => (
              <div key={hour} className="h-16 border-b border-gray-100 flex items-start justify-end pr-2 pt-1">
                <span className="text-xs text-gray-500">{hour.toString().padStart(2, '0')}:00</span>
              </div>
            ))}
          </div>

          {/* Stylist columns */}
          <div className="flex-1 flex overflow-x-auto">
            {sampleStylists.filter(s => s.status !== 'off').map(stylist => (
              <div key={stylist.id} className="w-48 flex-shrink-0 border-r border-gray-200">
                {/* Stylist header */}
                <div 
                  className="h-12 border-b border-gray-200 p-2 flex items-center gap-2 cursor-pointer hover:bg-gray-50"
                  style={{ backgroundColor: stylist.status === 'available' ? `${stylist.color}10` : 'transparent' }}
                  onClick={() => setSelectedStylist(stylist.id)}
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                    style={{ backgroundColor: stylist.color + '20' }}
                  >
                    {stylist.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#1A1A1A] truncate">{stylist.name}</p>
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        stylist.status === 'available' ? 'bg-green-500' :
                        stylist.status === 'busy' ? 'bg-amber-500' :
                        stylist.status === 'break' ? 'bg-blue-500' : 'bg-gray-300'
                      }`} />
                      <span className="text-[9px] text-gray-500 capitalize">{stylist.status}</span>
                    </div>
                  </div>
                </div>

                {/* Time slots */}
                <div className="relative">
                  {hours.map(hour => (
                    <div key={hour} className="h-16 border-b border-gray-100 hover:bg-gray-50" />
                  ))}

                  {/* Appointments */}
                  {dayAppointments
                    .filter(a => a.stylistId === stylist.id)
                    .map(appointment => {
                      const service = getService(appointment.serviceId)
                      const startHour = parseInt(appointment.time.split(':')[0])
                      const startMinute = parseInt(appointment.time.split(':')[1])
                      const top = ((startHour - 8) * 64) + (startMinute / 60 * 64)
                      const height = (appointment.duration / 60) * 64

                      return (
                        <div
                          key={appointment.id}
                          className={`absolute left-1 right-1 rounded-md p-1.5 cursor-pointer overflow-hidden ${
                            appointment.status === 'completed' ? 'bg-green-100 border border-green-200' :
                            appointment.status === 'in-progress' ? 'bg-blue-100 border border-blue-200' :
                            appointment.status === 'cancelled' ? 'bg-red-50 border border-red-200 opacity-50' :
                            'bg-[#00897B]/10 border border-[#00897B]/30'
                          }`}
                          style={{ top, height }}
                          onClick={() => {
                            setSelectedAppointment(appointment)
                            setAppointmentDetailOpen(true)
                          }}
                        >
                          <p className="text-[10px] font-medium text-[#1A1A1A] truncate">
                            {appointment.customerName}
                          </p>
                          <p className="text-[9px] text-gray-600 truncate">
                            {service?.name}
                          </p>
                          <p className="text-[9px] text-[#00897B] font-medium">
                            {appointment.time} ({appointment.duration}min)
                          </p>
                        </div>
                      )
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
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
              <Calendar className="h-5 w-5 text-[#00897B]" />
              Booking & Appointments
            </h1>
            <p className="text-sm text-[#757575]">Manage appointments, walk-ins, and stylist schedules</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Eye className="h-4 w-4" />
              Today
            </Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C] gap-2"
              onClick={() => setNewBookingOpen(true)}
            >
              <Plus className="h-4 w-4" />
              New Booking
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-6 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#1A1A1A]">{stats.total}</p>
              <p className="text-[10px] text-[#757575]">Today's Bookings</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#1A1A1A]">{stats.scheduled}</p>
              <p className="text-[10px] text-[#757575]">Scheduled</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
              <Timer className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#1A1A1A]">{stats.inProgress}</p>
              <p className="text-[10px] text-[#757575]">In Progress</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#1A1A1A]">{stats.completed}</p>
              <p className="text-[10px] text-[#757575]">Completed</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#1A1A1A]">{stats.waiting}</p>
              <p className="text-[10px] text-[#757575]">Walk-ins Waiting</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00897B]/10 text-[#00897B] flex items-center justify-center">
              <span className="text-sm font-bold">R</span>
            </div>
            <div>
              <p className="text-lg font-bold text-[#1A1A1A]">R{stats.totalRevenue.toLocaleString()}</p>
              <p className="text-[10px] text-[#757575]">Today's Revenue</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col">
        <div className="px-6 pt-4 border-b border-gray-200">
          <TabsList className="bg-transparent">
            <TabsTrigger value="calendar" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Calendar className="h-4 w-4 mr-2" />
              Calendar View
            </TabsTrigger>
            <TabsTrigger value="list" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Clock className="h-4 w-4 mr-2" />
              List View
            </TabsTrigger>
            <TabsTrigger value="walkins" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Users className="h-4 w-4 mr-2" />
              Walk-in Queue
            </TabsTrigger>
            <TabsTrigger value="services" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Scissors className="h-4 w-4 mr-2" />
              Services
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="calendar" className="flex-1 m-0 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Date Navigation */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => navigateDate('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-center">
                  <p className="text-sm font-medium text-[#1A1A1A]">{formatDate(selectedDate)}</p>
                </div>
                <Button variant="outline" size="icon" onClick={() => navigateDate('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-md"
                />
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-auto">
              {renderCalendarGrid()}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="list" className="flex-1 m-0 overflow-auto p-6">
          <div className="space-y-3">
            {dayAppointments.map(appointment => {
              const stylist = getStylist(appointment.stylistId)
              const service = getService(appointment.serviceId)
              
              return (
                <Card key={appointment.id} className="cursor-pointer hover:border-[#00897B] transition-colors"
                  onClick={() => {
                    setSelectedAppointment(appointment)
                    setAppointmentDetailOpen(true)
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center text-lg">
                          {stylist?.avatar}
                        </div>
                        <div>
                          <p className="font-medium text-[#1A1A1A]">{appointment.customerName}</p>
                          <p className="text-sm text-[#757575]">{service?.name} • {stylist?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium text-[#1A1A1A]">{appointment.time}</p>
                          <p className="text-sm text-[#757575]">{appointment.duration} min</p>
                        </div>
                        <Badge className={
                          appointment.status === 'completed' ? 'bg-green-100 text-green-700' :
                          appointment.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                          appointment.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          appointment.status === 'confirmed' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }>
                          {appointment.status}
                        </Badge>
                        <p className="font-bold text-[#00897B]">R{appointment.total}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="walkins" className="flex-1 m-0 overflow-auto p-6">
          <div className="max-w-2xl mx-auto">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Walk-in Queue
                </CardTitle>
                <CardDescription>
                  Customers waiting without appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {walkIns.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-500" />
                    <p className="text-sm text-[#757575]">No walk-ins waiting</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {walkIns.map((walkIn, index) => (
                      <div key={walkIn.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                          #{walkIn.position}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-[#1A1A1A]">{walkIn.customerName || 'Walk-in Customer'}</p>
                          <p className="text-sm text-[#757575]">{walkIn.service}</p>
                          {walkIn.stylistPreference && (
                            <p className="text-xs text-[#00897B]">Prefers: {walkIn.stylistPreference}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-[#757575]">Waiting: {walkIn.waitTime} min</p>
                          <Badge className={walkIn.status === 'waiting' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}>
                            {walkIn.status}
                          </Badge>
                        </div>
                        {walkIn.status === 'waiting' && (
                          <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => callWalkIn(walkIn.id)}>
                            Call
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Button className="w-full" variant="outline" onClick={() => {
              setNewBooking({ ...newBooking, customerName: 'Walk-in Customer' })
              setNewBookingOpen(true)
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Walk-in
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="services" className="flex-1 m-0 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(
              sampleServices.reduce((acc, service) => {
                if (!acc[service.category]) acc[service.category] = []
                acc[service.category].push(service)
                return acc
              }, {} as Record<string, Service[]>)
            ).map(([category, services]) => (
              <Card key={category}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {services.map(service => (
                      <div key={service.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="text-sm font-medium text-[#1A1A1A]">{service.name}</p>
                          <p className="text-xs text-[#757575]">{service.duration} min</p>
                        </div>
                        <p className="font-bold text-[#00897B]">R{service.price}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* New Booking Dialog */}
      <Dialog open={newBookingOpen} onOpenChange={setNewBookingOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Booking</DialogTitle>
            <DialogDescription>
              Schedule an appointment for a customer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[#1A1A1A] mb-1 block">Customer Name</label>
                <Input 
                  value={newBooking.customerName}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, customerName: e.target.value }))}
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1A1A1A] mb-1 block">Phone</label>
                <Input 
                  value={newBooking.customerPhone}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, customerPhone: e.target.value }))}
                  placeholder="082 123 4567"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[#1A1A1A] mb-1 block">Service</label>
                <Select value={newBooking.serviceId} onValueChange={(v) => setNewBooking(prev => ({ ...prev, serviceId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {sampleServices.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - R{service.price} ({service.duration}min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#1A1A1A] mb-1 block">Stylist</label>
                <Select value={newBooking.stylistId} onValueChange={(v) => setNewBooking(prev => ({ ...prev, stylistId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stylist" />
                  </SelectTrigger>
                  <SelectContent>
                    {sampleStylists.filter(s => s.status !== 'off').map(stylist => (
                      <SelectItem key={stylist.id} value={stylist.id}>
                        {stylist.name} ({stylist.specialties.slice(0, 2).join(', ')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[#1A1A1A] mb-1 block">Date</label>
                <Input 
                  type="date"
                  value={newBooking.date}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1A1A1A] mb-1 block">Time</label>
                <Select value={newBooking.time} onValueChange={(v) => setNewBooking(prev => ({ ...prev, time: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.slice(0, 20).map(slot => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[#1A1A1A] mb-1 block">Notes</label>
              <Input 
                value={newBooking.notes}
                onChange={(e) => setNewBooking(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Special requests..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewBookingOpen(false)}>Cancel</Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]"
              disabled={!newBooking.customerName || !newBooking.serviceId || !newBooking.stylistId}
              onClick={handleCreateBooking}
            >
              Create Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Detail Dialog */}
      <Dialog open={appointmentDetailOpen} onOpenChange={setAppointmentDetailOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedAppointment && (
            <>
              <DialogHeader>
                <DialogTitle>Appointment Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center text-2xl">
                    {getStylist(selectedAppointment.stylistId)?.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-lg text-[#1A1A1A]">{selectedAppointment.customerName}</p>
                    <p className="text-sm text-[#757575]">{selectedAppointment.customerPhone}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[#757575]">Service</p>
                    <p className="font-medium text-[#1A1A1A]">{getService(selectedAppointment.serviceId)?.name}</p>
                  </div>
                  <div>
                    <p className="text-[#757575]">Stylist</p>
                    <p className="font-medium text-[#1A1A1A]">{getStylist(selectedAppointment.stylistId)?.name}</p>
                  </div>
                  <div>
                    <p className="text-[#757575]">Date & Time</p>
                    <p className="font-medium text-[#1A1A1A]">{selectedAppointment.time} ({selectedAppointment.duration}min)</p>
                  </div>
                  <div>
                    <p className="text-[#757575]">Status</p>
                    <Badge className={
                      selectedAppointment.status === 'completed' ? 'bg-green-100 text-green-700' :
                      selectedAppointment.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }>
                      {selectedAppointment.status}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-[#757575]">Total</span>
                  <span className="text-lg font-bold text-[#00897B]">R{selectedAppointment.total}</span>
                </div>
              </div>
              <DialogFooter className="flex-col gap-2">
                <div className="flex gap-2 w-full">
                  {selectedAppointment.status === 'scheduled' && (
                    <>
                      <Button variant="outline" className="flex-1" onClick={() => {
                        updateAppointmentStatus(selectedAppointment.id, 'confirmed')
                        setAppointmentDetailOpen(false)
                      }}>
                        Confirm
                      </Button>
                      <Button className="flex-1 bg-[#00897B] hover:bg-[#00695C]" onClick={() => {
                        updateAppointmentStatus(selectedAppointment.id, 'in-progress')
                        setAppointmentDetailOpen(false)
                      }}>
                        Start Service
                      </Button>
                    </>
                  )}
                  {selectedAppointment.status === 'confirmed' && (
                    <Button className="w-full bg-[#00897B] hover:bg-[#00695C]" onClick={() => {
                      updateAppointmentStatus(selectedAppointment.id, 'in-progress')
                      setAppointmentDetailOpen(false)
                    }}>
                      Start Service
                    </Button>
                  )}
                  {selectedAppointment.status === 'in-progress' && (
                    <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => {
                      updateAppointmentStatus(selectedAppointment.id, 'completed')
                      setAppointmentDetailOpen(false)
                    }}>
                      Complete Service
                    </Button>
                  )}
                </div>
                <div className="flex gap-2 w-full">
                  <Button variant="ghost" size="sm" className="flex-1 text-red-500 hover:text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
