'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import {
  Hotel,
  Bed,
  BedDouble,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Key,
  LogIn,
  LogOut,
  CreditCard,
  Receipt,
  Building2,
  RefreshCw,
  Wifi,
  Coffee,
  Tv,
  Bath,
  Wind,
  Car,
  Star,
  Globe,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Coins,
  TrendingUp,
  TrendingDown,
  Phone,
  Mail,
  User,
  CalendarDays,
  DoorOpen,
  Sparkles,
  ShieldCheck,
  X,
  Edit,
  Trash2,
  Eye,
  Send,
  Download,
  Printer,
  MessageSquare,
  Bell,
  Settings,
  Zap,
  ArrowRight,
  Package,
} from 'lucide-react'

// Types
interface Room {
  id: string
  number: string
  type: 'single' | 'double' | 'twin' | 'suite' | 'family' | 'deluxe'
  floor: number
  status: 'available' | 'occupied' | 'reserved' | 'maintenance' | 'cleaning' | 'checkout'
  price: number
  capacity: number
  amenities: string[]
  guest?: {
    id: string
    name: string
    phone: string
    email: string
    checkIn: Date
    checkOut: Date
    folioBalance: number
  }
  reservation?: {
    id: string
    guestName: string
    checkIn: Date
    checkOut: Date
    source: 'direct' | 'booking_com' | 'airbnb' | 'expedia' | 'agoda'
  }
  lastCleaned?: Date
  notes?: string
}

interface GuestFolio {
  id: string
  guestId: string
  guestName: string
  roomNumber: string
  checkIn: Date
  checkOut: Date
  charges: FolioCharge[]
  payments: FolioPayment[]
  balance: number
  status: 'open' | 'closed' | 'pending'
}

interface FolioCharge {
  id: string
  date: Date
  description: string
  amount: number
  category: 'room' | 'restaurant' | 'bar' | 'minibar' | 'laundry' | 'spa' | 'phone' | 'other'
}

interface FolioPayment {
  id: string
  date: Date
  amount: number
  method: 'cash' | 'card' | 'eft' | 'voucher'
  reference: string
}

interface OTABooking {
  id: string
  channel: 'booking_com' | 'airbnb' | 'expedia' | 'agoda' | 'direct'
  guestName: string
  guestEmail: string
  guestPhone: string
  roomType: string
  checkIn: Date
  checkOut: Date
  totalPrice: number
  commission: number
  status: 'confirmed' | 'pending' | 'cancelled' | 'modified'
  syncStatus: 'synced' | 'pending' | 'error'
  specialRequests?: string
  createdAt: Date
}

interface ChannelConnection {
  id: string
  name: string
  logo: string
  status: 'connected' | 'disconnected' | 'error'
  lastSync: Date
  pendingBookings: number
  commission: number
}

// Sample Data
const sampleRooms: Room[] = [
  // Floor 1
  { id: '101', number: '101', type: 'single', floor: 1, status: 'available', price: 850, capacity: 1, amenities: ['wifi', 'tv', 'coffee'] },
  { id: '102', number: '102', type: 'double', floor: 1, status: 'occupied', price: 1200, capacity: 2, amenities: ['wifi', 'tv', 'coffee', 'bath'], guest: { id: 'g1', name: 'John Smith', phone: '+27 82 123 4567', email: 'john@email.com', checkIn: new Date('2026-02-10'), checkOut: new Date('2026-02-14'), folioBalance: 2400 } },
  { id: '103', number: '103', type: 'twin', floor: 1, status: 'reserved', price: 1200, capacity: 2, amenities: ['wifi', 'tv', 'coffee'], reservation: { id: 'r1', guestName: 'Sarah Johnson', checkIn: new Date('2026-02-12'), checkOut: new Date('2026-02-15'), source: 'booking_com' } },
  { id: '104', number: '104', type: 'double', floor: 1, status: 'cleaning', price: 1200, capacity: 2, amenities: ['wifi', 'tv', 'coffee', 'bath'], lastCleaned: new Date('2026-02-10T08:00:00') },
  { id: '105', number: '105', type: 'suite', floor: 1, status: 'occupied', price: 2500, capacity: 4, amenities: ['wifi', 'tv', 'coffee', 'bath', 'minibar', 'balcony'], guest: { id: 'g2', name: 'Van der Merwe Family', phone: '+27 83 987 6543', email: 'vdmerwe@email.com', checkIn: new Date('2026-02-08'), checkOut: new Date('2026-02-12'), folioBalance: 850 } },
  // Floor 2
  { id: '201', number: '201', type: 'single', floor: 2, status: 'available', price: 950, capacity: 1, amenities: ['wifi', 'tv', 'coffee', 'desk'] },
  { id: '202', number: '202', type: 'double', floor: 2, status: 'checkout', price: 1200, capacity: 2, amenities: ['wifi', 'tv', 'coffee', 'bath'], guest: { id: 'g3', name: 'Michael Brown', phone: '+27 84 555 1234', email: 'mbrown@email.com', checkIn: new Date('2026-02-09'), checkOut: new Date('2026-02-11'), folioBalance: 350 } },
  { id: '203', number: '203', type: 'twin', floor: 2, status: 'available', price: 1300, capacity: 2, amenities: ['wifi', 'tv', 'coffee', 'desk'] },
  { id: '204', number: '204', type: 'deluxe', floor: 2, status: 'occupied', price: 1800, capacity: 2, amenities: ['wifi', 'tv', 'coffee', 'bath', 'minibar', 'balcony'], guest: { id: 'g4', name: 'Jennifer Williams', phone: '+27 85 222 3333', email: 'jwilliams@email.com', checkIn: new Date('2026-02-10'), checkOut: new Date('2026-02-13'), folioBalance: 0 } },
  { id: '205', number: '205', type: 'family', floor: 2, status: 'maintenance', price: 2200, capacity: 5, amenities: ['wifi', 'tv', 'coffee', 'bath', 'kitchenette'], notes: 'AC repair scheduled' },
  // Floor 3
  { id: '301', number: '301', type: 'suite', floor: 3, status: 'available', price: 2800, capacity: 4, amenities: ['wifi', 'tv', 'coffee', 'bath', 'minibar', 'balcony', 'lounge'] },
  { id: '302', number: '302', type: 'deluxe', floor: 3, status: 'reserved', price: 1900, capacity: 2, amenities: ['wifi', 'tv', 'coffee', 'bath', 'minibar', 'balcony'], reservation: { id: 'r2', guestName: 'James Wilson', checkIn: new Date('2026-02-13'), checkOut: new Date('2026-02-16'), source: 'airbnb' } },
  { id: '303', number: '303', type: 'suite', floor: 3, status: 'occupied', price: 3200, capacity: 4, amenities: ['wifi', 'tv', 'coffee', 'bath', 'minibar', 'balcony', 'lounge', 'jacuzzi'], guest: { id: 'g5', name: 'Robert Thompson', phone: '+27 86 444 5555', email: 'rthompson@email.com', checkIn: new Date('2026-02-11'), checkOut: new Date('2026-02-14'), folioBalance: 1250 } },
  { id: '304', number: '304', type: 'double', floor: 3, status: 'available', price: 1300, capacity: 2, amenities: ['wifi', 'tv', 'coffee', 'bath'] },
  { id: '305', number: '305', type: 'deluxe', floor: 3, status: 'available', price: 1800, capacity: 2, amenities: ['wifi', 'tv', 'coffee', 'bath', 'minibar'] },
]

const sampleFolio: GuestFolio = {
  id: 'f1',
  guestId: 'g2',
  guestName: 'Van der Merwe Family',
  roomNumber: '105',
  checkIn: new Date('2026-02-08'),
  checkOut: new Date('2026-02-12'),
  status: 'open',
  charges: [
    { id: 'c1', date: new Date('2026-02-08'), description: 'Room Charge - 4 nights', amount: 10000, category: 'room' },
    { id: 'c2', date: new Date('2026-02-09'), description: 'Restaurant - Dinner', amount: 650, category: 'restaurant' },
    { id: 'c3', date: new Date('2026-02-09'), description: 'Bar - Drinks', amount: 180, category: 'bar' },
    { id: 'c4', date: new Date('2026-02-10'), description: 'Room Service - Breakfast', amount: 320, category: 'restaurant' },
    { id: 'c5', date: new Date('2026-02-10'), description: 'Laundry Service', amount: 150, category: 'laundry' },
    { id: 'c6', date: new Date('2026-02-10'), description: 'Spa Treatment', amount: 850, category: 'spa' },
  ],
  payments: [
    { id: 'p1', date: new Date('2026-02-08'), amount: 5000, method: 'card', reference: 'POS-001234' },
  ],
  balance: 7150,
}

const channelConnections: ChannelConnection[] = [
  { id: 'booking_com', name: 'Booking.com', logo: 'B', status: 'connected', lastSync: new Date('2026-02-11T10:30:00'), pendingBookings: 3, commission: 15 },
  { id: 'airbnb', name: 'Airbnb', logo: 'A', status: 'connected', lastSync: new Date('2026-02-11T09:15:00'), pendingBookings: 1, commission: 12 },
  { id: 'expedia', name: 'Expedia', logo: 'E', status: 'connected', lastSync: new Date('2026-02-11T08:00:00'), pendingBookings: 0, commission: 18 },
  { id: 'agoda', name: 'Agoda', logo: 'G', status: 'error', lastSync: new Date('2026-02-10T14:00:00'), pendingBookings: 2, commission: 14 },
]

const sampleOTABookings: OTABooking[] = [
  {
    id: 'ota1',
    channel: 'booking_com',
    guestName: 'Sarah Johnson',
    guestEmail: 'sjohnson@email.com',
    guestPhone: '+27 72 111 2222',
    roomType: 'Twin',
    checkIn: new Date('2026-02-12'),
    checkOut: new Date('2026-02-15'),
    totalPrice: 3600,
    commission: 540,
    status: 'confirmed',
    syncStatus: 'synced',
    specialRequests: 'Late check-in around 8pm, please',
    createdAt: new Date('2026-02-08'),
  },
  {
    id: 'ota2',
    channel: 'airbnb',
    guestName: 'James Wilson',
    guestEmail: 'jwilson@email.com',
    guestPhone: '+27 73 333 4444',
    roomType: 'Deluxe',
    checkIn: new Date('2026-02-13'),
    checkOut: new Date('2026-02-16'),
    totalPrice: 5700,
    commission: 684,
    status: 'confirmed',
    syncStatus: 'synced',
    specialRequests: 'Honeymoon couple - room with view preferred',
    createdAt: new Date('2026-02-09'),
  },
  {
    id: 'ota3',
    channel: 'booking_com',
    guestName: 'Emma Davis',
    guestEmail: 'edavis@email.com',
    guestPhone: '+27 74 555 6666',
    roomType: 'Double',
    checkIn: new Date('2026-02-14'),
    checkOut: new Date('2026-02-16'),
    totalPrice: 2400,
    commission: 360,
    status: 'pending',
    syncStatus: 'pending',
    createdAt: new Date('2026-02-11'),
  },
  {
    id: 'ota4',
    channel: 'expedia',
    guestName: 'Thomas Anderson',
    guestEmail: 'tanderson@email.com',
    guestPhone: '+27 75 777 8888',
    roomType: 'Suite',
    checkIn: new Date('2026-02-15'),
    checkOut: new Date('2026-02-18'),
    totalPrice: 8400,
    commission: 1512,
    status: 'confirmed',
    syncStatus: 'synced',
    createdAt: new Date('2026-02-07'),
  },
  {
    id: 'ota5',
    channel: 'agoda',
    guestName: 'Lisa Chen',
    guestEmail: 'lchen@email.com',
    guestPhone: '+27 76 999 0000',
    roomType: 'Family',
    checkIn: new Date('2026-02-16'),
    checkOut: new Date('2026-02-20'),
    totalPrice: 8800,
    commission: 1232,
    status: 'modified',
    syncStatus: 'pending',
    specialRequests: 'Extra bed for child',
    createdAt: new Date('2026-02-06'),
  },
]

// Utility functions
const getStatusColor = (status: Room['status']) => {
  switch (status) {
    case 'available': return 'bg-green-100 text-green-700 border-green-200'
    case 'occupied': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'reserved': return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'maintenance': return 'bg-red-100 text-red-700 border-red-200'
    case 'cleaning': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'checkout': return 'bg-orange-100 text-orange-700 border-orange-200'
    default: return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

const getRoomTypeIcon = (type: Room['type']) => {
  switch (type) {
    case 'single': return <Bed className="h-4 w-4" />
    case 'double': return <BedDouble className="h-4 w-4" />
    case 'twin': return <Users className="h-4 w-4" />
    case 'suite': return <Sparkles className="h-4 w-4" />
    case 'family': return <Users className="h-4 w-4" />
    case 'deluxe': return <Star className="h-4 w-4" />
    default: return <Bed className="h-4 w-4" />
  }
}

const getAmenityIcon = (amenity: string) => {
  switch (amenity) {
    case 'wifi': return <Wifi className="h-3 w-3" />
    case 'tv': return <Tv className="h-3 w-3" />
    case 'coffee': return <Coffee className="h-3 w-3" />
    case 'bath': return <Bath className="h-3 w-3" />
    case 'minibar': return <Package className="h-3 w-3" />
    case 'balcony': return <DoorOpen className="h-3 w-3" />
    case 'desk': return <Building2 className="h-3 w-3" />
    case 'kitchenette': return <Coffee className="h-3 w-3" />
    case 'lounge': return <Users className="h-3 w-3" />
    case 'jacuzzi': return <Bath className="h-3 w-3" />
    default: return null
  }
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount)
}

export function HotelManagementView() {
  const [rooms, setRooms] = useState<Room[]>(sampleRooms)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [selectedFolio, setSelectedFolio] = useState<GuestFolio | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterFloor, setFilterFloor] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  
  // Dialogs
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false)
  const [checkOutDialogOpen, setCheckOutDialogOpen] = useState(false)
  const [folioDialogOpen, setFolioDialogOpen] = useState(false)
  const [addChargeDialogOpen, setAddChargeDialogOpen] = useState(false)
  const [addPaymentDialogOpen, setAddPaymentDialogOpen] = useState(false)
  const [reservationDialogOpen, setReservationDialogOpen] = useState(false)
  const [otaBookingDialogOpen, setOTABookingDialogOpen] = useState(false)
  
  // Forms
  const [checkInForm, setCheckInForm] = useState({
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    checkOut: '',
    idNumber: '',
    notes: '',
  })
  const [newCharge, setNewCharge] = useState({ description: '', amount: '', category: 'restaurant' })
  const [newPayment, setNewPayment] = useState({ amount: '', method: 'cash', reference: '' })
  
  // Calculate stats
  const stats = {
    totalRooms: rooms.length,
    available: rooms.filter(r => r.status === 'available').length,
    occupied: rooms.filter(r => r.status === 'occupied').length,
    reserved: rooms.filter(r => r.status === 'reserved').length,
    maintenance: rooms.filter(r => r.status === 'maintenance').length,
    checkout: rooms.filter(r => r.status === 'checkout').length,
    occupancyRate: Math.round((rooms.filter(r => r.status === 'occupied').length / rooms.length) * 100),
    todayRevenue: rooms.filter(r => r.guest).reduce((sum, r) => sum + (r.price || 0), 0),
    pendingFolios: rooms.filter(r => r.guest && r.guest.folioBalance > 0).length,
    totalFolioBalance: rooms.filter(r => r.guest).reduce((sum, r) => sum + (r.guest?.folioBalance || 0), 0),
  }

  // Filter rooms
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.number.includes(searchQuery) || 
      room.guest?.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFloor = filterFloor === 'all' || room.floor.toString() === filterFloor
    const matchesStatus = filterStatus === 'all' || room.status === filterStatus
    return matchesSearch && matchesFloor && matchesStatus
  })

  // Group rooms by floor
  const roomsByFloor = filteredRooms.reduce((acc, room) => {
    if (!acc[room.floor]) acc[room.floor] = []
    acc[room.floor].push(room)
    return acc
  }, {} as Record<number, Room[]>)

  // Handle check-in
  const handleCheckIn = () => {
    if (!selectedRoom) return
    
    const updatedRooms = rooms.map(r => {
      if (r.id === selectedRoom.id) {
        return {
          ...r,
          status: 'occupied' as const,
          guest: {
            id: `g${Date.now()}`,
            name: checkInForm.guestName,
            phone: checkInForm.guestPhone,
            email: checkInForm.guestEmail,
            checkIn: new Date(),
            checkOut: new Date(checkInForm.checkOut),
            folioBalance: 0,
          }
        }
      }
      return r
    })
    
    setRooms(updatedRooms)
    setCheckInDialogOpen(false)
    setCheckInForm({ guestName: '', guestPhone: '', guestEmail: '', checkOut: '', idNumber: '', notes: '' })
    setSelectedRoom(null)
  }

  // Handle check-out
  const handleCheckOut = () => {
    if (!selectedRoom || !selectedRoom.guest) return
    
    const updatedRooms = rooms.map(r => {
      if (r.id === selectedRoom.id) {
        return {
          ...r,
          status: 'cleaning' as const,
          guest: undefined,
          lastCleaned: new Date(),
        }
      }
      return r
    })
    
    setRooms(updatedRooms)
    setCheckOutDialogOpen(false)
    setSelectedRoom(null)
  }

  // Handle add charge
  const handleAddCharge = () => {
    if (!selectedFolio) return
    
    const charge: FolioCharge = {
      id: `c${Date.now()}`,
      date: new Date(),
      description: newCharge.description,
      amount: parseFloat(newCharge.amount),
      category: newCharge.category as FolioCharge['category'],
    }
    
    setSelectedFolio({
      ...selectedFolio,
      charges: [...selectedFolio.charges, charge],
      balance: selectedFolio.balance + charge.amount,
    })
    
    setAddChargeDialogOpen(false)
    setNewCharge({ description: '', amount: '', category: 'restaurant' })
  }

  // Handle add payment
  const handleAddPayment = () => {
    if (!selectedFolio) return
    
    const payment: FolioPayment = {
      id: `p${Date.now()}`,
      date: new Date(),
      amount: parseFloat(newPayment.amount),
      method: newPayment.method as FolioPayment['method'],
      reference: newPayment.reference,
    }
    
    setSelectedFolio({
      ...selectedFolio,
      payments: [...selectedFolio.payments, payment],
      balance: selectedFolio.balance - payment.amount,
    })
    
    setAddPaymentDialogOpen(false)
    setNewPayment({ amount: '', method: 'cash', reference: '' })
  }

  // Render Room Card
  const renderRoomCard = (room: Room) => (
    <Card 
      key={room.id}
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        selectedRoom?.id === room.id ? 'ring-2 ring-[#00897B]' : ''
      } ${getStatusColor(room.status)} border`}
      onClick={() => setSelectedRoom(room)}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {getRoomTypeIcon(room.type)}
            <span className="font-bold text-lg">{room.number}</span>
          </div>
          <Badge variant="outline" className="text-xs capitalize bg-white/50">
            {room.status}
          </Badge>
        </div>
        
        <div className="text-xs text-gray-600 mb-2">
          <div className="flex items-center gap-1">
            <span className="capitalize">{room.type}</span>
            <span className="text-gray-400">•</span>
            <span>{room.capacity} pax</span>
          </div>
          <div className="font-medium text-gray-800">{formatCurrency(room.price)}/night</div>
        </div>

        {/* Guest Info */}
        {room.guest && (
          <div className="mt-2 p-2 bg-white/50 rounded text-xs">
            <div className="font-medium truncate">{room.guest.name}</div>
            <div className="text-gray-600 flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {formatDate(room.guest.checkIn)} → {formatDate(room.guest.checkOut)}
            </div>
            {room.guest.folioBalance > 0 && (
              <div className="text-red-600 font-medium mt-1">
                Folio: {formatCurrency(room.guest.folioBalance)}
              </div>
            )}
          </div>
        )}

        {/* Reservation Info */}
        {room.reservation && !room.guest && (
          <div className="mt-2 p-2 bg-purple-50 rounded text-xs">
            <div className="font-medium truncate">{room.reservation.guestName}</div>
            <div className="text-purple-600 flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {formatDate(room.reservation.checkIn)} → {formatDate(room.reservation.checkOut)}
            </div>
            <Badge variant="outline" className="mt-1 text-[10px] bg-purple-100">
              {room.reservation.source.replace('_', '.')}
            </Badge>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-2 flex gap-1">
          {room.status === 'available' && (
            <Button 
              size="sm" 
              className="flex-1 h-7 text-xs bg-[#00897B] hover:bg-[#00695C]"
              onClick={(e) => {
                e.stopPropagation()
                setSelectedRoom(room)
                setCheckInDialogOpen(true)
              }}
            >
              <LogIn className="h-3 w-3 mr-1" />
              Check In
            </Button>
          )}
          {room.status === 'occupied' && room.guest && (
            <>
              <Button 
                size="sm" 
                variant="outline"
                className="flex-1 h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedRoom(room)
                  setSelectedFolio(sampleFolio) // In real app, fetch actual folio
                  setFolioDialogOpen(true)
                }}
              >
                <Receipt className="h-3 w-3 mr-1" />
                Folio
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="flex-1 h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedRoom(room)
                  setCheckOutDialogOpen(true)
                }}
              >
                <LogOut className="h-3 w-3 mr-1" />
                Out
              </Button>
            </>
          )}
          {room.status === 'checkout' && (
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1 h-7 text-xs border-orange-300 text-orange-700"
              onClick={(e) => {
                e.stopPropagation()
                // Process check-out
                const updatedRooms = rooms.map(r => 
                  r.id === room.id ? { ...r, status: 'cleaning' as const, guest: undefined, lastCleaned: new Date() } : r
                )
                setRooms(updatedRooms)
              }}
            >
              <LogOut className="h-3 w-3 mr-1" />
              Complete
            </Button>
          )}
          {room.status === 'cleaning' && (
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1 h-7 text-xs border-amber-300 text-amber-700"
              onClick={(e) => {
                e.stopPropagation()
                const updatedRooms = rooms.map(r => 
                  r.id === room.id ? { ...r, status: 'available' as const } : r
                )
                setRooms(updatedRooms)
              }}
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Ready
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA]">
      <Tabs defaultValue="rooms" className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <TabsList className="bg-gray-100">
              <TabsTrigger value="rooms" className="data-[state=active]:bg-white">
                <Bed className="h-4 w-4 mr-2" />
                Room Grid
              </TabsTrigger>
              <TabsTrigger value="checkinout" className="data-[state=active]:bg-white">
                <Key className="h-4 w-4 mr-2" />
                Check In/Out
              </TabsTrigger>
              <TabsTrigger value="folios" className="data-[state=active]:bg-white">
                <Receipt className="h-4 w-4 mr-2" />
                Guest Folios
              </TabsTrigger>
              <TabsTrigger value="ota" className="data-[state=active]:bg-white">
                <Globe className="h-4 w-4 mr-2" />
                OTA Manager
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {stats.occupancyRate}% Occupancy
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {stats.occupied}/{stats.totalRooms} Rooms
              </Badge>
            </div>
          </div>
        </div>

        {/* Room Management Grid */}
        <TabsContent value="rooms" className="flex-1 overflow-hidden m-0">
          <div className="h-full flex">
            {/* Room Grid */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Filters */}
              <div className="bg-white border-b border-gray-200 px-4 py-2">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search room or guest..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={filterFloor} onValueChange={setFilterFloor}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Floor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Floors</SelectItem>
                      <SelectItem value="1">Floor 1</SelectItem>
                      <SelectItem value="2">Floor 2</SelectItem>
                      <SelectItem value="3">Floor 3</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="cleaning">Cleaning</SelectItem>
                      <SelectItem value="checkout">Check Out</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Status Legend */}
              <div className="bg-white border-b border-gray-200 px-4 py-2">
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-500"></div>
                    <span>Available ({stats.available})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    <span>Occupied ({stats.occupied})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-purple-500"></div>
                    <span>Reserved ({stats.reserved})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-orange-500"></div>
                    <span>Check Out ({stats.checkout})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-amber-500"></div>
                    <span>Cleaning</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-red-500"></div>
                    <span>Maintenance ({stats.maintenance})</span>
                  </div>
                </div>
              </div>

              {/* Room Grid by Floor */}
              <ScrollArea className="flex-1 p-4">
                {Object.entries(roomsByFloor).sort(([a], [b]) => Number(a) - Number(b)).map(([floor, floorRooms]) => (
                  <div key={floor} className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      <h3 className="font-semibold text-gray-700">Floor {floor}</h3>
                      <Badge variant="outline" className="text-xs">
                        {floorRooms.length} rooms
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                      {floorRooms.map(renderRoomCard)}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>

            {/* Room Detail Panel */}
            {selectedRoom && (
              <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Room {selectedRoom.number}</h3>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedRoom(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Badge className={`mt-2 ${getStatusColor(selectedRoom.status)}`}>
                    {selectedRoom.status}
                  </Badge>
                </div>
                
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {/* Room Details */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Room Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type</span>
                          <span className="font-medium capitalize">{selectedRoom.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Floor</span>
                          <span className="font-medium">{selectedRoom.floor}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Capacity</span>
                          <span className="font-medium">{selectedRoom.capacity} guests</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Rate</span>
                          <span className="font-medium text-[#00897B]">{formatCurrency(selectedRoom.price)}/night</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Amenities */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Amenities</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedRoom.amenities.map(amenity => (
                          <Badge key={amenity} variant="outline" className="text-xs">
                            {getAmenityIcon(amenity)}
                            <span className="ml-1 capitalize">{amenity}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Guest Info */}
                    {selectedRoom.guest && (
                      <>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Current Guest</h4>
                          <div className="p-3 bg-blue-50 rounded-lg space-y-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-blue-200 text-blue-700">
                                  {selectedRoom.guest.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{selectedRoom.guest.name}</div>
                                <div className="text-xs text-gray-500">{selectedRoom.guest.email}</div>
                              </div>
                            </div>
                            <div className="text-sm space-y-1">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Phone className="h-3 w-3" />
                                {selectedRoom.guest.phone}
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <CalendarDays className="h-3 w-3" />
                                {formatDate(selectedRoom.guest.checkIn)} → {formatDate(selectedRoom.guest.checkOut)}
                              </div>
                              <div className="flex items-center gap-2 font-medium">
                                <Coins className="h-3 w-3" />
                                Folio Balance: {formatCurrency(selectedRoom.guest.folioBalance)}
                              </div>
                            </div>
                          </div>
                        </div>
                        <Separator />
                      </>
                    )}

                    {/* Reservation Info */}
                    {selectedRoom.reservation && !selectedRoom.guest && (
                      <>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Upcoming Reservation</h4>
                          <div className="p-3 bg-purple-50 rounded-lg space-y-2">
                            <div className="font-medium">{selectedRoom.reservation.guestName}</div>
                            <div className="text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <CalendarDays className="h-3 w-3" />
                                {formatDate(selectedRoom.reservation.checkIn)} → {formatDate(selectedRoom.reservation.checkOut)}
                              </div>
                            </div>
                            <Badge variant="outline" className="bg-purple-100 text-purple-700">
                              {selectedRoom.reservation.source.replace('_', '.')}
                            </Badge>
                          </div>
                        </div>
                        <Separator />
                      </>
                    )}

                    {/* Notes */}
                    {selectedRoom.notes && (
                      <>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Notes</h4>
                          <div className="p-3 bg-amber-50 rounded-lg text-sm text-amber-800">
                            {selectedRoom.notes}
                          </div>
                        </div>
                        <Separator />
                      </>
                    )}

                    {/* Actions */}
                    <div className="space-y-2">
                      {selectedRoom.status === 'available' && (
                        <Button 
                          className="w-full bg-[#00897B] hover:bg-[#00695C]"
                          onClick={() => setCheckInDialogOpen(true)}
                        >
                          <LogIn className="h-4 w-4 mr-2" />
                          Check In Guest
                        </Button>
                      )}
                      {selectedRoom.status === 'occupied' && selectedRoom.guest && (
                        <>
                          <Button 
                            className="w-full bg-[#00897B] hover:bg-[#00695C]"
                            onClick={() => {
                              setSelectedFolio(sampleFolio)
                              setFolioDialogOpen(true)
                            }}
                          >
                            <Receipt className="h-4 w-4 mr-2" />
                            Manage Folio
                          </Button>
                          <Button 
                            variant="outline"
                            className="w-full"
                            onClick={() => setCheckOutDialogOpen(true)}
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Check Out
                          </Button>
                        </>
                      )}
                      {selectedRoom.status === 'maintenance' && (
                        <Button 
                          variant="outline"
                          className="w-full border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() => {
                            const updated = rooms.map(r => 
                              r.id === selectedRoom.id ? { ...r, status: 'available' as const, notes: undefined } : r
                            )
                            setRooms(updated)
                            setSelectedRoom({ ...selectedRoom, status: 'available', notes: undefined })
                          }}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Mark Fixed
                        </Button>
                      )}
                      <Button variant="outline" className="w-full">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Room
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Check In/Out Flow */}
        <TabsContent value="checkinout" className="flex-1 overflow-hidden m-0">
          <div className="h-full flex gap-4 p-4">
            {/* Arrivals Today */}
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogIn className="h-5 w-5 text-green-600" />
                  Arrivals Today
                </CardTitle>
                <CardDescription>
                  {formatDate(new Date())} • {sampleOTABookings.filter(b => 
                    b.checkIn.toDateString() === new Date().toDateString() && b.status !== 'cancelled'
                  ).length} expected
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {sampleOTABookings
                      .filter(b => b.checkIn >= new Date() && b.status !== 'cancelled')
                      .sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime())
                      .slice(0, 5)
                      .map(booking => (
                        <div key={booking.id} className="p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-medium">{booking.guestName}</div>
                              <div className="text-sm text-gray-500">{booking.roomType}</div>
                            </div>
                            <Badge variant="outline" className={
                              booking.status === 'confirmed' ? 'bg-green-50 text-green-700' :
                              booking.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                              'bg-gray-50 text-gray-700'
                            }>
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-3 w-3" />
                              {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                            </div>
                            <div className="flex items-center gap-2">
                              <Globe className="h-3 w-3" />
                              {booking.channel.replace('_', '.')}
                            </div>
                            {booking.specialRequests && (
                              <div className="text-amber-600 text-xs mt-1">
                                ⚠ {booking.specialRequests}
                              </div>
                            )}
                          </div>
                          <div className="mt-2 flex gap-2">
                            <Button 
                              size="sm" 
                              className="flex-1 bg-[#00897B] hover:bg-[#00695C]"
                              onClick={() => {
                                // Find available room matching type
                                const availableRoom = rooms.find(r => 
                                  r.status === 'available' && 
                                  r.type.toLowerCase().includes(booking.roomType.toLowerCase())
                                )
                                if (availableRoom) {
                                  setSelectedRoom(availableRoom)
                                  setCheckInForm({
                                    guestName: booking.guestName,
                                    guestPhone: booking.guestPhone,
                                    guestEmail: booking.guestEmail,
                                    checkOut: booking.checkOut.toISOString().split('T')[0],
                                    idNumber: '',
                                    notes: booking.specialRequests || '',
                                  })
                                  setCheckInDialogOpen(true)
                                }
                              }}
                            >
                              <LogIn className="h-3 w-3 mr-1" />
                              Check In
                            </Button>
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Departures Today */}
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogOut className="h-5 w-5 text-orange-600" />
                  Departures Today
                </CardTitle>
                <CardDescription>
                  {formatDate(new Date())} • {rooms.filter(r => 
                    r.guest && r.guest.checkOut.toDateString() === new Date().toDateString()
                  ).length} scheduled
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {rooms
                      .filter(r => r.guest && r.status === 'occupied')
                      .map(room => (
                        <div key={room.id} className="p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-medium">{room.guest!.name}</div>
                              <div className="text-sm text-gray-500">Room {room.number}</div>
                            </div>
                            <Badge className={
                              room.guest!.folioBalance > 0 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-green-100 text-green-700'
                            }>
                              {room.guest!.folioBalance > 0 ? 'Balance Due' : 'Settled'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              {room.guest!.phone}
                            </div>
                            <div className="flex items-center gap-2">
                              <Coins className="h-3 w-3" />
                              Folio Balance: {formatCurrency(room.guest!.folioBalance)}
                            </div>
                          </div>
                          <div className="mt-2 flex gap-2">
                            {room.guest!.folioBalance > 0 ? (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="flex-1 border-orange-200 text-orange-700"
                                onClick={() => {
                                  setSelectedRoom(room)
                                  setSelectedFolio(sampleFolio)
                                  setFolioDialogOpen(true)
                                }}
                              >
                                <Receipt className="h-3 w-3 mr-1" />
                                Settle Folio
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                className="flex-1 bg-orange-600 hover:bg-orange-700"
                                onClick={() => {
                                  setSelectedRoom(room)
                                  setCheckOutDialogOpen(true)
                                }}
                              >
                                <LogOut className="h-3 w-3 mr-1" />
                                Check Out
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3 mr-1" />
                              Folio
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* In-House Guests */}
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  In-House Guests
                </CardTitle>
                <CardDescription>
                  Currently staying • {stats.occupied} guests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {rooms
                      .filter(r => r.guest && r.status === 'occupied')
                      .map(room => (
                        <div key={room.id} className="p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-blue-100 text-blue-700">
                                {room.guest!.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{room.guest!.name}</div>
                              <div className="text-sm text-gray-500">Room {room.number}</div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setSelectedRoom(room)
                                  setSelectedFolio(sampleFolio)
                                  setFolioDialogOpen(true)
                                }}>
                                  <Receipt className="h-4 w-4 mr-2" />
                                  View Folio
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedRoom(room)
                                  setAddChargeDialogOpen(true)
                                }}>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Charge
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Send Message
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <LogOut className="h-4 w-4 mr-2" />
                                  Early Check Out
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Guest Folios */}
        <TabsContent value="folios" className="flex-1 overflow-hidden m-0">
          <div className="h-full flex gap-4 p-4">
            {/* Folio List */}
            <Card className="w-80">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Open Folios</CardTitle>
                  <Badge variant="outline">{rooms.filter(r => r.guest).length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {rooms.filter(r => r.guest).map(room => (
                      <div 
                        key={room.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedFolio?.guestId === room.guest!.id 
                            ? 'bg-[#E0F2F1] border border-[#00897B]' 
                            : 'hover:bg-gray-50 border'
                        }`}
                        onClick={() => setSelectedFolio(sampleFolio)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{room.guest!.name}</span>
                          <span className="text-sm text-gray-500">#{room.number}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">
                            {formatDate(room.guest!.checkIn)} - {formatDate(room.guest!.checkOut)}
                          </span>
                          <span className={`font-medium ${room.guest!.folioBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(room.guest!.folioBalance)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Folio Detail */}
            {selectedFolio && (
              <Card className="flex-1">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Guest Folio</CardTitle>
                      <CardDescription>
                        Room {selectedFolio.roomNumber} • {selectedFolio.guestName}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setAddChargeDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Charge
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setAddPaymentDialogOpen(true)}>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Add Payment
                      </Button>
                      <Button variant="outline" size="sm">
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-600">Total Charges</div>
                      <div className="text-xl font-bold text-blue-700">
                        {formatCurrency(selectedFolio.charges.reduce((sum, c) => sum + c.amount, 0))}
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-sm text-green-600">Total Payments</div>
                      <div className="text-xl font-bold text-green-700">
                        {formatCurrency(selectedFolio.payments.reduce((sum, p) => sum + p.amount, 0))}
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg ${selectedFolio.balance > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                      <div className={`text-sm ${selectedFolio.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        Balance Due
                      </div>
                      <div className={`text-xl font-bold ${selectedFolio.balance > 0 ? 'text-red-700' : 'text-green-700'}`}>
                        {formatCurrency(selectedFolio.balance)}
                      </div>
                    </div>
                  </div>

                  <Tabs defaultValue="charges">
                    <TabsList>
                      <TabsTrigger value="charges">
                        Charges ({selectedFolio.charges.length})
                      </TabsTrigger>
                      <TabsTrigger value="payments">
                        Payments ({selectedFolio.payments.length})
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="charges" className="mt-4">
                      <ScrollArea className="h-[300px]">
                        <table className="w-full">
                          <thead className="sticky top-0 bg-white">
                            <tr className="border-b">
                              <th className="text-left py-2 text-sm font-medium text-gray-500">Date</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-500">Description</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-500">Category</th>
                              <th className="text-right py-2 text-sm font-medium text-gray-500">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedFolio.charges.map(charge => (
                              <tr key={charge.id} className="border-b hover:bg-gray-50">
                                <td className="py-2 text-sm">{formatDate(charge.date)}</td>
                                <td className="py-2 text-sm">{charge.description}</td>
                                <td className="py-2">
                                  <Badge variant="outline" className="capitalize text-xs">
                                    {charge.category}
                                  </Badge>
                                </td>
                                <td className="py-2 text-sm text-right font-medium">
                                  {formatCurrency(charge.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2">
                              <td colSpan={3} className="py-2 text-sm font-medium">Total Charges</td>
                              <td className="py-2 text-sm text-right font-bold">
                                {formatCurrency(selectedFolio.charges.reduce((sum, c) => sum + c.amount, 0))}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </ScrollArea>
                    </TabsContent>
                    <TabsContent value="payments" className="mt-4">
                      <ScrollArea className="h-[300px]">
                        <table className="w-full">
                          <thead className="sticky top-0 bg-white">
                            <tr className="border-b">
                              <th className="text-left py-2 text-sm font-medium text-gray-500">Date</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-500">Method</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-500">Reference</th>
                              <th className="text-right py-2 text-sm font-medium text-gray-500">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedFolio.payments.map(payment => (
                              <tr key={payment.id} className="border-b hover:bg-gray-50">
                                <td className="py-2 text-sm">{formatDate(payment.date)}</td>
                                <td className="py-2">
                                  <Badge variant="outline" className="capitalize text-xs bg-green-50 text-green-700">
                                    {payment.method}
                                  </Badge>
                                </td>
                                <td className="py-2 text-sm text-gray-500">{payment.reference}</td>
                                <td className="py-2 text-sm text-right font-medium text-green-600">
                                  -{formatCurrency(payment.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2">
                              <td colSpan={3} className="py-2 text-sm font-medium">Total Payments</td>
                              <td className="py-2 text-sm text-right font-bold text-green-600">
                                -{formatCurrency(selectedFolio.payments.reduce((sum, p) => sum + p.amount, 0))}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* OTA Channel Manager */}
        <TabsContent value="ota" className="flex-1 overflow-hidden m-0">
          <div className="h-full flex flex-col p-4 gap-4">
            {/* Channel Connections */}
            <div className="grid grid-cols-4 gap-4">
              {channelConnections.map(channel => (
                <Card key={channel.id} className={channel.status === 'error' ? 'border-red-200 bg-red-50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                        channel.status === 'connected' ? 'bg-[#00897B]' :
                        channel.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                      }`}>
                        {channel.logo}
                      </div>
                      <div>
                        <div className="font-medium">{channel.name}</div>
                        <div className={`text-xs ${
                          channel.status === 'connected' ? 'text-green-600' :
                          channel.status === 'error' ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {channel.status === 'connected' ? 'Connected' :
                           channel.status === 'error' ? 'Sync Error' : 'Disconnected'}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Commission</span>
                        <span className="font-medium">{channel.commission}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pending</span>
                        <span className={`font-medium ${channel.pendingBookings > 0 ? 'text-amber-600' : ''}`}>
                          {channel.pendingBookings}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Last sync</span>
                        <span>{channel.lastSync.toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        disabled={channel.status === 'disconnected'}
                      >
                        <RefreshCw className="h-3 w-3 mr-2" />
                        Sync Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* OTA Bookings */}
            <Card className="flex-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Channel Bookings</CardTitle>
                    <CardDescription>
                      Manage bookings from all connected channels
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sync All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[350px]">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b">
                        <th className="text-left py-2 text-sm font-medium text-gray-500">Channel</th>
                        <th className="text-left py-2 text-sm font-medium text-gray-500">Guest</th>
                        <th className="text-left py-2 text-sm font-medium text-gray-500">Room</th>
                        <th className="text-left py-2 text-sm font-medium text-gray-500">Dates</th>
                        <th className="text-right py-2 text-sm font-medium text-gray-500">Amount</th>
                        <th className="text-center py-2 text-sm font-medium text-gray-500">Status</th>
                        <th className="text-center py-2 text-sm font-medium text-gray-500">Sync</th>
                        <th className="text-center py-2 text-sm font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sampleOTABookings.map(booking => (
                        <tr key={booking.id} className="border-b hover:bg-gray-50">
                          <td className="py-3">
                            <Badge variant="outline" className="capitalize">
                              {booking.channel.replace('_', '.')}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <div>
                              <div className="font-medium text-sm">{booking.guestName}</div>
                              <div className="text-xs text-gray-500">{booking.guestPhone}</div>
                            </div>
                          </td>
                          <td className="py-3 text-sm">{booking.roomType}</td>
                          <td className="py-3">
                            <div className="text-sm">
                              <div>{formatDate(booking.checkIn)}</div>
                              <div className="text-gray-500">to {formatDate(booking.checkOut)}</div>
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            <div className="font-medium">{formatCurrency(booking.totalPrice)}</div>
                            <div className="text-xs text-gray-500">
                              Fee: {formatCurrency(booking.commission)}
                            </div>
                          </td>
                          <td className="py-3 text-center">
                            <Badge className={
                              booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                              booking.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              booking.status === 'modified' ? 'bg-blue-100 text-blue-700' :
                              'bg-red-100 text-red-700'
                            }>
                              {booking.status}
                            </Badge>
                          </td>
                          <td className="py-3 text-center">
                            {booking.syncStatus === 'synced' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                            ) : booking.syncStatus === 'pending' ? (
                              <Clock className="h-4 w-4 text-amber-500 mx-auto" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-red-500 mx-auto" />
                            )}
                          </td>
                          <td className="py-3 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Modify Booking
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <LogIn className="h-4 w-4 mr-2" />
                                  Assign Room
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Message Guest
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancel Booking
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Check-In Dialog */}
      <Dialog open={checkInDialogOpen} onOpenChange={setCheckInDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5 text-[#00897B]" />
              Check In Guest
            </DialogTitle>
            <DialogDescription>
              Room {selectedRoom?.number} - {selectedRoom?.type} ({formatCurrency(selectedRoom?.price || 0)}/night)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="guestName">Guest Name *</Label>
              <Input
                id="guestName"
                value={checkInForm.guestName}
                onChange={(e) => setCheckInForm({ ...checkInForm, guestName: e.target.value })}
                placeholder="Full name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guestPhone">Phone Number *</Label>
                <Input
                  id="guestPhone"
                  value={checkInForm.guestPhone}
                  onChange={(e) => setCheckInForm({ ...checkInForm, guestPhone: e.target.value })}
                  placeholder="+27 82 123 4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guestEmail">Email</Label>
                <Input
                  id="guestEmail"
                  type="email"
                  value={checkInForm.guestEmail}
                  onChange={(e) => setCheckInForm({ ...checkInForm, guestEmail: e.target.value })}
                  placeholder="guest@email.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="checkOut">Check-out Date *</Label>
                <Input
                  id="checkOut"
                  type="date"
                  value={checkInForm.checkOut}
                  onChange={(e) => setCheckInForm({ ...checkInForm, checkOut: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="idNumber">ID Number</Label>
                <Input
                  id="idNumber"
                  value={checkInForm.idNumber}
                  onChange={(e) => setCheckInForm({ ...checkInForm, idNumber: e.target.value })}
                  placeholder="SA ID or Passport"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Special Requests / Notes</Label>
              <Textarea
                id="notes"
                value={checkInForm.notes}
                onChange={(e) => setCheckInForm({ ...checkInForm, notes: e.target.value })}
                placeholder="Any special requests..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckInDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]"
              onClick={handleCheckIn}
              disabled={!checkInForm.guestName || !checkInForm.guestPhone || !checkInForm.checkOut}
            >
              <Key className="h-4 w-4 mr-2" />
              Complete Check-In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Check-Out Dialog */}
      <Dialog open={checkOutDialogOpen} onOpenChange={setCheckOutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-orange-600" />
              Check Out Guest
            </DialogTitle>
            <DialogDescription>
              Room {selectedRoom?.number} - {selectedRoom?.guest?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Guest</span>
                <span className="font-medium">{selectedRoom?.guest?.name}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Check In</span>
                <span className="font-medium">{selectedRoom?.guest && formatDate(selectedRoom.guest.checkIn)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Check Out</span>
                <span className="font-medium">{selectedRoom?.guest && formatDate(selectedRoom.guest.checkOut)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between">
                <span className="text-gray-600">Folio Balance</span>
                <span className={`font-bold ${selectedRoom?.guest?.folioBalance && selectedRoom.guest.folioBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(selectedRoom?.guest?.folioBalance || 0)}
                </span>
              </div>
            </div>
            
            {selectedRoom?.guest?.folioBalance && selectedRoom.guest.folioBalance > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  Outstanding Balance
                </div>
                <p className="text-sm text-red-600 mt-1">
                  The guest has an outstanding balance of {formatCurrency(selectedRoom.guest.folioBalance)}. 
                  Please settle the folio before checking out.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckOutDialogOpen(false)}>
              Cancel
            </Button>
            {selectedRoom?.guest?.folioBalance && selectedRoom.guest.folioBalance > 0 ? (
              <Button 
                className="bg-orange-600 hover:bg-orange-700"
                onClick={() => {
                  setCheckOutDialogOpen(false)
                  setSelectedFolio(sampleFolio)
                  setFolioDialogOpen(true)
                }}
              >
                <Receipt className="h-4 w-4 mr-2" />
                Settle Folio First
              </Button>
            ) : (
              <Button 
                className="bg-[#00897B] hover:bg-[#00695C]"
                onClick={handleCheckOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Complete Check-Out
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Charge Dialog */}
      <Dialog open={addChargeDialogOpen} onOpenChange={setAddChargeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Charge to Folio</DialogTitle>
            <DialogDescription>
              {selectedFolio?.guestName} - Room {selectedFolio?.roomNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={newCharge.category} onValueChange={(v) => setNewCharge({ ...newCharge, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="minibar">Minibar</SelectItem>
                  <SelectItem value="laundry">Laundry</SelectItem>
                  <SelectItem value="spa">Spa</SelectItem>
                  <SelectItem value="phone">Phone Calls</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={newCharge.description}
                onChange={(e) => setNewCharge({ ...newCharge, description: e.target.value })}
                placeholder="e.g., Room Service - Dinner"
              />
            </div>
            <div className="space-y-2">
              <Label>Amount (ZAR)</Label>
              <Input
                type="number"
                value={newCharge.amount}
                onChange={(e) => setNewCharge({ ...newCharge, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddChargeDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]"
              onClick={handleAddCharge}
              disabled={!newCharge.description || !newCharge.amount}
            >
              Add Charge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={addPaymentDialogOpen} onOpenChange={setAddPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment to Folio</DialogTitle>
            <DialogDescription>
              {selectedFolio?.guestName} - Room {selectedFolio?.roomNumber}
            </DialogDescription>
            <div className="mt-1 font-medium text-muted-foreground">
              Current Balance: {formatCurrency(selectedFolio?.balance || 0)}
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={newPayment.method} onValueChange={(v) => setNewPayment({ ...newPayment, method: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="eft">EFT</SelectItem>
                  <SelectItem value="voucher">Voucher</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (ZAR)</Label>
              <Input
                type="number"
                value={newPayment.amount}
                onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                placeholder="0.00"
              />
              {selectedFolio && (
                <div className="flex gap-2 mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setNewPayment({ ...newPayment, amount: (selectedFolio.balance / 2).toFixed(2) })}
                  >
                    Half
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setNewPayment({ ...newPayment, amount: selectedFolio.balance.toFixed(2) })}
                  >
                    Full Amount
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Reference</Label>
              <Input
                value={newPayment.reference}
                onChange={(e) => setNewPayment({ ...newPayment, reference: e.target.value })}
                placeholder="Transaction reference"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={handleAddPayment}
              disabled={!newPayment.amount}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
