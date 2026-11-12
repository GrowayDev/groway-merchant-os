'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Truck,
  Package,
  MapPin,
  Phone,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Send,
  Eye,
  Printer,
  RefreshCw,
  ArrowRight,
  Building2,
  Navigation,
  Calendar,
  Weight,
  Ruler,
  Box,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  Info,
  Calculator,
  Timer,
  CalendarDays,
  DollarSign,
  Route,
  Zap,
} from 'lucide-react'

// ============================================
// TYPES
// ============================================

interface CourierIntegration {
  id: string
  courierId: string
  courierName: string
  accountNumber: string
  apiKey?: string
  status: 'active' | 'pending' | 'error' | 'inactive'
  defaultServiceType: string
  autoCreateWaybill: boolean
  lastSync?: string
  totalShipments: number
  successRate: number
}

interface Shipment {
  id: string
  waybillNumber: string
  courierId: string
  courierName: string
  recipientName: string
  recipientPhone: string
  destinationCity: string
  destinationAddress: string
  status: 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned'
  shippedDate: string
  estimatedDelivery?: string
  actualDelivery?: string
  weight: number
  parcelCount: number
  serviceType: string
  orderReference: string
  trackingEvents: TrackingEvent[]
  cost?: number
}

interface TrackingEvent {
  id: string
  timestamp: string
  status: string
  location: string
  description: string
}

interface CourierInfo {
  id: string
  name: string
  logo?: string
  serviceTypes: string[]
  coverage: string[]
  features: string[]
  baseRate: number
  perKgRate: number
  perKmRate: number
}

interface PickupSchedule {
  id: string
  courierId: string
  courierName: string
  scheduledDate: string
  scheduledTime: string
  address: string
  contactName: string
  contactPhone: string
  parcelCount: number
  totalWeight: number
  specialInstructions?: string
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  reference?: string
  createdAt: string
}

interface DeliveryQuote {
  courierId: string
  courierName: string
  serviceType: string
  baseCost: number
  weightCost: number
  distanceCost: number
  surcharge: number
  totalCost: number
  estimatedDays: number
  features: string[]
}

// ============================================
// SAMPLE DATA
// ============================================

const courierInfo: CourierInfo[] = [
  {
    id: 'dsv',
    name: 'DSV',
    serviceTypes: ['Express', 'Economy', 'Overnight', 'Same Day'],
    coverage: ['National', 'International'],
    features: ['Real-time tracking', 'Insurance', 'Signature required'],
    baseRate: 45,
    perKgRate: 8.50,
    perKmRate: 0.15,
  },
  {
    id: 'ram',
    name: 'RAM Hand-to-Hand',
    serviceTypes: ['Hand-to-Hand', 'Door-to-Door', 'Economy'],
    coverage: ['National'],
    features: ['POD capture', 'SMS notifications', 'Returns handling'],
    baseRate: 35,
    perKgRate: 6.00,
    perKmRate: 0.12,
  },
  {
    id: 'paxi',
    name: 'PAXI (Pep)',
    serviceTypes: ['Paxi Express', 'Paxi Standard'],
    coverage: ['National'],
    features: ['Pick-up points', 'Low cost', '3-5 days delivery'],
    baseRate: 25,
    perKgRate: 3.50,
    perKmRate: 0,
  },
  {
    id: 'aramex',
    name: 'Aramex',
    serviceTypes: ['Express', 'Domestic', 'International'],
    coverage: ['National', 'International'],
    features: ['Real-time tracking', 'Customs clearance', 'Insurance'],
    baseRate: 55,
    perKgRate: 9.00,
    perKmRate: 0.18,
  },
  {
    id: 'fastway',
    name: 'Fastway',
    serviceTypes: ['Parcel', 'Satchel', 'Express'],
    coverage: ['National'],
    features: ['Next day delivery', 'Real-time tracking', 'Franchise network'],
    baseRate: 40,
    perKgRate: 7.00,
    perKmRate: 0.10,
  },
]

const sampleIntegrations: CourierIntegration[] = [
  {
    id: 'int_1',
    courierId: 'dsv',
    courierName: 'DSV',
    accountNumber: 'DSV-789456123',
    status: 'active',
    defaultServiceType: 'Express',
    autoCreateWaybill: true,
    lastSync: new Date().toISOString(),
    totalShipments: 1245,
    successRate: 98.5,
  },
  {
    id: 'int_2',
    courierId: 'ram',
    courierName: 'RAM Hand-to-Hand',
    accountNumber: 'RAM-456789012',
    status: 'active',
    defaultServiceType: 'Hand-to-Hand',
    autoCreateWaybill: true,
    lastSync: new Date(Date.now() - 3600000).toISOString(),
    totalShipments: 892,
    successRate: 97.8,
  },
  {
    id: 'int_3',
    courierId: 'paxi',
    courierName: 'PAXI (Pep)',
    accountNumber: 'PAXI-123456789',
    status: 'pending',
    defaultServiceType: 'Paxi Standard',
    autoCreateWaybill: false,
    totalShipments: 0,
    successRate: 0,
  },
]

const generateShipments = (): Shipment[] => {
  const statuses: Shipment['status'][] = ['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed']
  const couriers = ['DSV', 'RAM Hand-to-Hand', 'PAXI', 'Aramex', 'Fastway']
  const cities = ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London']
  const names = ['Thabo Mokoena', 'Sarah Naidoo', 'John van der Merwe', 'Lerato Dlamini', 'Michael Smith', 'Nomsa Zwane', 'David Williams']
  const services = ['Express', 'Economy', 'Overnight', 'Same Day', 'Hand-to-Hand', 'Paxi Standard']

  const shipments: Shipment[] = []

  for (let i = 0; i < 25; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const shippedDate = new Date(Date.now() - Math.random() * 7 * 86400000)
    const weight = Math.round((Math.random() * 10 + 0.5) * 100) / 100

    shipments.push({
      id: `SHP${Date.now() - i * 60000}`,
      waybillNumber: `WB${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      courierId: couriers[Math.floor(Math.random() * couriers.length)].toLowerCase(),
      courierName: couriers[Math.floor(Math.random() * couriers.length)],
      recipientName: names[Math.floor(Math.random() * names.length)],
      recipientPhone: `+27 ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}`,
      destinationCity: cities[Math.floor(Math.random() * cities.length)],
      destinationAddress: `${Math.floor(Math.random() * 900) + 100} Main Street, ${cities[Math.floor(Math.random() * cities.length)]}`,
      status: status,
      shippedDate: shippedDate.toISOString(),
      estimatedDelivery: status !== 'delivered' ? new Date(shippedDate.getTime() + (Math.random() * 5 + 1) * 86400000).toISOString() : undefined,
      actualDelivery: status === 'delivered' ? new Date(shippedDate.getTime() + (Math.random() * 3 + 1) * 86400000).toISOString() : undefined,
      weight: weight,
      parcelCount: Math.floor(Math.random() * 3) + 1,
      serviceType: services[Math.floor(Math.random() * services.length)],
      orderReference: `ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      trackingEvents: generateTrackingEvents(status, shippedDate),
      cost: Math.round((Math.random() * 200 + 50) * 100) / 100,
    })
  }

  return shipments
}

const generatePickupSchedules = (): PickupSchedule[] => [
  {
    id: 'PKP-001',
    courierId: 'dsv',
    courierName: 'DSV',
    scheduledDate: '2026-02-16',
    scheduledTime: '10:00',
    address: '123 Business Park, Johannesburg',
    contactName: 'Operations Manager',
    contactPhone: '+27 11 123 4567',
    parcelCount: 15,
    totalWeight: 45.5,
    specialInstructions: 'Please ring doorbell at loading dock',
    status: 'confirmed',
    reference: 'PICKUP-2026-0216-001',
    createdAt: '2026-02-15T09:00:00',
  },
  {
    id: 'PKP-002',
    courierId: 'ram',
    courierName: 'RAM Hand-to-Hand',
    scheduledDate: '2026-02-16',
    scheduledTime: '14:00',
    address: '456 Commerce Street, Sandton',
    contactName: 'Warehouse Supervisor',
    contactPhone: '+27 11 234 5678',
    parcelCount: 8,
    totalWeight: 22.0,
    status: 'scheduled',
    reference: 'PICKUP-2026-0216-002',
    createdAt: '2026-02-15T10:30:00',
  },
  {
    id: 'PKP-003',
    courierId: 'fastway',
    courierName: 'Fastway',
    scheduledDate: '2026-02-15',
    scheduledTime: '11:00',
    address: '789 Industrial Area, Midrand',
    contactName: 'Dispatch Team',
    contactPhone: '+27 11 345 6789',
    parcelCount: 25,
    totalWeight: 78.3,
    status: 'completed',
    reference: 'PICKUP-2026-0215-001',
    createdAt: '2026-02-14T14:00:00',
  },
]

const generateTrackingEvents = (currentStatus: string, startDate: Date): TrackingEvent[] => {
  const events: TrackingEvent[] = []
  const locations = ['Johannesburg Hub', 'Cape Town Depot', 'Durban Distribution Centre', 'In Transit', 'Out for Delivery', 'Delivered']
  const statusMap: Record<string, { status: string; desc: string }[]> = {
    pending: [{ status: 'Pending Pickup', desc: 'Shipment created, awaiting collection' }],
    picked_up: [
      { status: 'Pending Pickup', desc: 'Shipment created, awaiting collection' },
      { status: 'Picked Up', desc: 'Package collected from sender' },
    ],
    in_transit: [
      { status: 'Pending Pickup', desc: 'Shipment created, awaiting collection' },
      { status: 'Picked Up', desc: 'Package collected from sender' },
      { status: 'In Transit', desc: 'Package in transit to destination hub' },
    ],
    out_for_delivery: [
      { status: 'Pending Pickup', desc: 'Shipment created, awaiting collection' },
      { status: 'Picked Up', desc: 'Package collected from sender' },
      { status: 'In Transit', desc: 'Package in transit to destination hub' },
      { status: 'At Destination Hub', desc: 'Package arrived at destination hub' },
      { status: 'Out for Delivery', desc: 'Package out for delivery' },
    ],
    delivered: [
      { status: 'Pending Pickup', desc: 'Shipment created, awaiting collection' },
      { status: 'Picked Up', desc: 'Package collected from sender' },
      { status: 'In Transit', desc: 'Package in transit to destination hub' },
      { status: 'At Destination Hub', desc: 'Package arrived at destination hub' },
      { status: 'Out for Delivery', desc: 'Package out for delivery' },
      { status: 'Delivered', desc: 'Package successfully delivered' },
    ],
    failed: [
      { status: 'Pending Pickup', desc: 'Shipment created, awaiting collection' },
      { status: 'Picked Up', desc: 'Package collected from sender' },
      { status: 'In Transit', desc: 'Package in transit to destination hub' },
      { status: 'Delivery Failed', desc: 'Delivery attempt failed - Recipient not available' },
    ],
  }

  const relevantEvents = statusMap[currentStatus] || statusMap.pending

  relevantEvents.forEach((event, index) => {
    events.push({
      id: `EVT${index}`,
      timestamp: new Date(startDate.getTime() + index * 3600000 * 6).toISOString(),
      status: event.status,
      location: locations[Math.min(index, locations.length - 1)],
      description: event.desc,
    })
  })

  return events
}

// ============================================
// COMPONENT
// ============================================

export function CourierIntegrationView() {
  const [activeTab, setActiveTab] = useState('accounts')
  const [integrations, setIntegrations] = useState<CourierIntegration[]>(sampleIntegrations)
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [pickupSchedules, setPickupSchedules] = useState<PickupSchedule[]>(generatePickupSchedules())
  const [isLoading, setIsLoading] = useState(true)

  // Dialog states
  const [addCourierOpen, setAddCourierOpen] = useState(false)
  const [createShipmentOpen, setCreateShipmentOpen] = useState(false)
  const [trackingOpen, setTrackingOpen] = useState(false)
  const [updateStatusOpen, setUpdateStatusOpen] = useState(false)
  const [costCalculatorOpen, setCostCalculatorOpen] = useState(false)
  const [schedulePickupOpen, setSchedulePickupOpen] = useState(false)
  const [pickupDetailOpen, setPickupDetailOpen] = useState(false)

  // Selected items
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
  const [selectedPickup, setSelectedPickup] = useState<PickupSchedule | null>(null)

  // Form states
  const [newCourier, setNewCourier] = useState({
    courierId: '',
    accountNumber: '',
    apiKey: '',
    defaultServiceType: '',
    autoCreateWaybill: false,
  })

  const [newShipment, setNewShipment] = useState({
    orderReference: '',
    orderType: 'order',
    recipientName: '',
    recipientPhone: '',
    recipientAddress: '',
    recipientCity: '',
    recipientPostalCode: '',
    weight: '',
    length: '',
    width: '',
    height: '',
    parcelCount: '1',
    courierId: '',
    serviceType: '',
  })

  const [costCalcForm, setCostCalcForm] = useState({
    originCity: '',
    destinationCity: '',
    weight: '',
    length: '',
    width: '',
    height: '',
    serviceType: 'Express',
  })

  const [pickupForm, setPickupForm] = useState({
    courierId: '',
    scheduledDate: '',
    scheduledTime: '',
    address: '',
    contactName: '',
    contactPhone: '',
    parcelCount: '',
    totalWeight: '',
    specialInstructions: '',
  })

  const [calculatedQuotes, setCalculatedQuotes] = useState<DeliveryQuote[]>([])

  useEffect(() => {
    const timer = setTimeout(() => {
      setShipments(generateShipments())
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const formatCurrency = (amount: number) => `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('en-ZA', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'delivered':
      case 'completed':
      case 'confirmed':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'pending':
      case 'scheduled':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'picked_up':
      case 'in_transit':
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'out_for_delivery':
        return 'bg-cyan-100 text-cyan-700 border-cyan-200'
      case 'error':
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'returned':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pending',
      picked_up: 'Picked Up',
      in_transit: 'In Transit',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      failed: 'Failed',
      returned: 'Returned',
      active: 'Active',
      error: 'Error',
      inactive: 'Inactive',
      scheduled: 'Scheduled',
      confirmed: 'Confirmed',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    }
    return labels[status] || status
  }

  // Calculate delivery quotes
  const calculateQuotes = useMemo(() => {
    if (!costCalcForm.weight || !costCalcForm.originCity || !costCalcForm.destinationCity) {
      return []
    }

    const weight = parseFloat(costCalcForm.weight) || 0
    const distance = Math.floor(Math.random() * 1500 + 50) // Simulated distance

    return courierInfo.map(courier => {
      const baseCost = courier.baseRate
      const weightCost = weight * courier.perKgRate
      const distanceCost = distance * courier.perKmRate
      const surcharge = costCalcForm.serviceType === 'Express' ? 50 : costCalcForm.serviceType === 'Same Day' ? 100 : 0
      const totalCost = baseCost + weightCost + distanceCost + surcharge

      return {
        courierId: courier.id,
        courierName: courier.name,
        serviceType: costCalcForm.serviceType,
        baseCost,
        weightCost,
        distanceCost,
        surcharge,
        totalCost: Math.round(totalCost * 100) / 100,
        estimatedDays: costCalcForm.serviceType === 'Same Day' ? 0 : costCalcForm.serviceType === 'Express' ? 1 : costCalcForm.serviceType === 'Overnight' ? 2 : 3,
        features: courier.features,
      }
    })
  }, [costCalcForm])

  const handleAddCourier = () => {
    const courier = courierInfo.find(c => c.id === newCourier.courierId)
    if (!courier || !newCourier.accountNumber) return

    const integration: CourierIntegration = {
      id: `int_${Date.now()}`,
      courierId: newCourier.courierId,
      courierName: courier.name,
      accountNumber: newCourier.accountNumber,
      apiKey: newCourier.apiKey,
      status: 'pending',
      defaultServiceType: newCourier.defaultServiceType || courier.serviceTypes[0],
      autoCreateWaybill: newCourier.autoCreateWaybill,
      totalShipments: 0,
      successRate: 0,
    }

    setIntegrations([...integrations, integration])
    setAddCourierOpen(false)
    setNewCourier({
      courierId: '',
      accountNumber: '',
      apiKey: '',
      defaultServiceType: '',
      autoCreateWaybill: false,
    })
  }

  const handleCreateShipment = () => {
    const courier = courierInfo.find(c => c.id === newShipment.courierId)
    if (!courier || !newShipment.recipientName || !newShipment.recipientAddress) return

    const shipment: Shipment = {
      id: `SHP${Date.now()}`,
      waybillNumber: `WB${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      courierId: newShipment.courierId,
      courierName: courier.name,
      recipientName: newShipment.recipientName,
      recipientPhone: newShipment.recipientPhone,
      destinationCity: newShipment.recipientCity,
      destinationAddress: newShipment.recipientAddress,
      status: 'pending',
      shippedDate: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 3 * 86400000).toISOString(),
      weight: parseFloat(newShipment.weight) || 1,
      parcelCount: parseInt(newShipment.parcelCount) || 1,
      serviceType: newShipment.serviceType || courier.serviceTypes[0],
      orderReference: newShipment.orderReference,
      trackingEvents: [{
        id: 'EVT1',
        timestamp: new Date().toISOString(),
        status: 'Pending Pickup',
        location: 'Origin',
        description: 'Shipment created, awaiting collection',
      }],
      cost: Math.round((Math.random() * 200 + 50) * 100) / 100,
    }

    setShipments([shipment, ...shipments])
    setCreateShipmentOpen(false)
    setNewShipment({
      orderReference: '',
      orderType: 'order',
      recipientName: '',
      recipientPhone: '',
      recipientAddress: '',
      recipientCity: '',
      recipientPostalCode: '',
      weight: '',
      length: '',
      width: '',
      height: '',
      parcelCount: '1',
      courierId: '',
      serviceType: '',
    })
  }

  const handleSchedulePickup = () => {
    const courier = courierInfo.find(c => c.id === pickupForm.courierId)
    if (!courier || !pickupForm.scheduledDate || !pickupForm.address) return

    const pickup: PickupSchedule = {
      id: `PKP-${Date.now()}`,
      courierId: pickupForm.courierId,
      courierName: courier.name,
      scheduledDate: pickupForm.scheduledDate,
      scheduledTime: pickupForm.scheduledTime,
      address: pickupForm.address,
      contactName: pickupForm.contactName,
      contactPhone: pickupForm.contactPhone,
      parcelCount: parseInt(pickupForm.parcelCount) || 1,
      totalWeight: parseFloat(pickupForm.totalWeight) || 0,
      specialInstructions: pickupForm.specialInstructions,
      status: 'scheduled',
      reference: `PICKUP-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(pickupSchedules.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
    }

    setPickupSchedules([...pickupSchedules, pickup])
    setSchedulePickupOpen(false)
    setPickupForm({
      courierId: '',
      scheduledDate: '',
      scheduledTime: '',
      address: '',
      contactName: '',
      contactPhone: '',
      parcelCount: '',
      totalWeight: '',
      specialInstructions: '',
    })
  }

  const handleCancelPickup = (pickupId: string) => {
    setPickupSchedules(prev => prev.map(p => 
      p.id === pickupId ? { ...p, status: 'cancelled' } : p
    ))
  }

  const handleTrackShipment = (shipment: Shipment) => {
    setSelectedShipment(shipment)
    setTrackingOpen(true)
  }

  const handleUpdateStatus = (shipment: Shipment) => {
    setSelectedShipment(shipment)
    setUpdateStatusOpen(true)
  }

  const handlePrintLabel = (shipment: Shipment) => {
    // Simulate printing
    console.log('Printing label for:', shipment.waybillNumber)
  }

  const toggleAutoCreateWaybill = (integrationId: string) => {
    setIntegrations(integrations.map(int =>
      int.id === integrationId ? { ...int, autoCreateWaybill: !int.autoCreateWaybill } : int
    ))
  }

  // Stats
  const stats = {
    totalShipments: shipments.length,
    pendingShipments: shipments.filter(s => s.status === 'pending').length,
    inTransit: shipments.filter(s => ['picked_up', 'in_transit', 'out_for_delivery'].includes(s.status)).length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
    failed: shipments.filter(s => s.status === 'failed').length,
    activeIntegrations: integrations.filter(i => i.status === 'active').length,
    scheduledPickups: pickupSchedules.filter(p => p.status === 'scheduled' || p.status === 'confirmed').length,
    totalShippingCost: shipments.reduce((sum, s) => sum + (s.cost || 0), 0),
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-[#00897B]" />
          <p className="text-[#757575]">Loading courier integration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#1A1A1A] flex items-center gap-2">
              <Truck className="h-5 w-5 text-[#00897B]" />
              Courier Integration
            </h1>
            <p className="text-sm text-[#757575]">Manage courier integrations and shipments</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCostCalculatorOpen(true)}>
              <Calculator className="h-4 w-4 mr-2" />
              Cost Calculator
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSchedulePickupOpen(true)}>
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Pickup
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAddCourierOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Courier
            </Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setCreateShipmentOpen(true)}>
              <Send className="h-4 w-4 mr-2" />
              Create Shipment
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-12 bg-transparent">
            <TabsTrigger value="accounts" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none">
              Courier Accounts
            </TabsTrigger>
            <TabsTrigger value="shipments" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none">
              Shipments
            </TabsTrigger>
            <TabsTrigger value="pickups" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none">
              Pickup Schedules
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {/* Accounts Tab */}
          {activeTab === 'accounts' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-[#00897B]">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#757575] mb-1">Active Couriers</p>
                        <p className="text-2xl font-bold text-[#1A1A1A]">{stats.activeIntegrations}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-[#E0F2F1] flex items-center justify-center">
                        <Truck className="h-5 w-5 text-[#00897B]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#757575] mb-1">Total Shipments</p>
                        <p className="text-2xl font-bold text-[#1A1A1A]">{stats.totalShipments}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                        <Package className="h-5 w-5 text-blue-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#757575] mb-1">In Transit</p>
                        <p className="text-2xl font-bold text-[#1A1A1A]">{stats.inTransit}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center">
                        <Navigation className="h-5 w-5 text-cyan-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#757575] mb-1">Delivered</p>
                        <p className="text-2xl font-bold text-[#1A1A1A]">{stats.delivered}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Courier Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {integrations.map((integration) => {
                  const courier = courierInfo.find(c => c.id === integration.courierId)
                  return (
                    <Card key={integration.id} className="overflow-hidden">
                      <CardHeader className="pb-3 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-[#00897B] flex items-center justify-center text-white font-bold text-lg">
                              {integration.courierName.charAt(0)}
                            </div>
                            <div>
                              <CardTitle className="text-base">{integration.courierName}</CardTitle>
                              <p className="text-xs text-[#757575]">{integration.accountNumber}</p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(integration.status)}>
                            {getStatusLabel(integration.status)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 p-2 rounded-lg">
                              <p className="text-xs text-[#757575]">Total Shipments</p>
                              <p className="font-semibold">{integration.totalShipments}</p>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-lg">
                              <p className="text-xs text-[#757575]">Success Rate</p>
                              <p className="font-semibold">{integration.successRate}%</p>
                            </div>
                          </div>

                          {/* Default Service */}
                          <div className="flex items-center justify-between py-2 border-t border-b border-gray-100">
                            <span className="text-sm text-[#757575]">Default Service</span>
                            <Badge variant="outline">{integration.defaultServiceType}</Badge>
                          </div>

                          {/* Auto-create toggle */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">Auto-create Waybill</span>
                              {integration.status === 'active' ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                              )}
                            </div>
                            <Switch
                              checked={integration.autoCreateWaybill}
                              onCheckedChange={() => toggleAutoCreateWaybill(integration.id)}
                            />
                          </div>

                          {/* Last Sync */}
                          {integration.lastSync && (
                            <div className="text-xs text-[#757575] flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Last synced: {formatDateTime(integration.lastSync)}
                            </div>
                          )}

                          {/* Service Types */}
                          {courier && (
                            <div className="flex flex-wrap gap-1 pt-2 border-t border-gray-100">
                              {courier.serviceTypes.slice(0, 3).map(type => (
                                <Badge key={type} variant="secondary" className="text-xs">{type}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}

                {/* Add Courier Card */}
                <Card 
                  className="border-dashed cursor-pointer hover:border-[#00897B] hover:bg-gray-50 transition-all"
                  onClick={() => setAddCourierOpen(true)}
                >
                  <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[200px]">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                      <Plus className="h-6 w-6 text-[#757575]" />
                    </div>
                    <p className="font-medium text-[#757575]">Add Courier Integration</p>
                    <p className="text-xs text-[#757575] mt-1">Connect a new courier service</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Shipments Tab */}
          {activeTab === 'shipments' && (
            <div className="space-y-4">
              {/* Stats Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-amber-500">
                  <CardContent className="p-4">
                    <p className="text-xs text-[#757575]">Pending</p>
                    <p className="text-2xl font-bold">{stats.pendingShipments}</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <p className="text-xs text-[#757575]">In Transit</p>
                    <p className="text-2xl font-bold">{stats.inTransit}</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <p className="text-xs text-[#757575]">Delivered</p>
                    <p className="text-2xl font-bold">{stats.delivered}</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-[#00897B]">
                  <CardContent className="p-4">
                    <p className="text-xs text-[#757575]">Total Cost</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.totalShippingCost)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="relative flex-1 min-w-[200px]">
                      <Input placeholder="Search by waybill, recipient, or order..." />
                    </div>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_transit">In Transit</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Courier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Couriers</SelectItem>
                        {courierInfo.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setCreateShipmentOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Shipment
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Shipments Table */}
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Waybill #</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Destination</TableHead>
                        <TableHead>Courier</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Shipped</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shipments.slice(0, 20).map((shipment) => (
                        <TableRow key={shipment.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div>
                              <p className="font-medium text-[#00897B]">{shipment.waybillNumber}</p>
                              <p className="text-xs text-[#757575]">{shipment.orderReference}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{shipment.recipientName}</p>
                              <p className="text-xs text-[#757575]">{shipment.recipientPhone}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-[#757575]" />
                              <span>{shipment.destinationCity}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded bg-[#00897B] flex items-center justify-center text-white text-xs font-bold">
                                {shipment.courierName.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm">{shipment.courierName}</p>
                                <p className="text-xs text-[#757575]">{shipment.serviceType}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(shipment.status)}>
                              {getStatusLabel(shipment.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-[#757575]" />
                              <span className="text-sm">{formatDate(shipment.shippedDate)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{formatCurrency(shipment.cost || 0)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                title="Track"
                                onClick={() => handleTrackShipment(shipment)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                title="Update Status"
                                onClick={() => handleUpdateStatus(shipment)}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                title="Print Label"
                                onClick={() => handlePrintLabel(shipment)}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Pickups Tab */}
          {activeTab === 'pickups' && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-[#00897B]">
                  <CardContent className="p-4">
                    <p className="text-xs text-[#757575]">Scheduled Pickups</p>
                    <p className="text-2xl font-bold">{stats.scheduledPickups}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-[#757575]">Completed Today</p>
                    <p className="text-2xl font-bold">{pickupSchedules.filter(p => p.status === 'completed' && p.scheduledDate === new Date().toISOString().split('T')[0]).length}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Pickup Schedule List */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-[#00897B]" />
                      Scheduled Pickups
                    </CardTitle>
                    <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setSchedulePickupOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule Pickup
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pickupSchedules.map(pickup => (
                      <div key={pickup.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#00897B]/10 flex items-center justify-center">
                            <Truck className="h-5 w-5 text-[#00897B]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{pickup.courierName}</h4>
                              <Badge className={getStatusColor(pickup.status)}>
                                {getStatusLabel(pickup.status)}
                              </Badge>
                            </div>
                            <p className="text-sm text-[#757575]">{pickup.address}</p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-[#757575]">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(pickup.scheduledDate)} at {pickup.scheduledTime}
                              </span>
                              <span className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {pickup.parcelCount} parcels
                              </span>
                              <span className="flex items-center gap-1">
                                <Weight className="h-3 w-3" />
                                {pickup.totalWeight}kg
                              </span>
                            </div>
                            {pickup.reference && (
                              <p className="text-xs text-[#757575] mt-1">Ref: {pickup.reference}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {pickup.status === 'scheduled' && (
                            <Button size="sm" variant="outline" className="text-red-500" onClick={() => handleCancelPickup(pickup.id)}>
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => { setSelectedPickup(pickup); setPickupDetailOpen(true) }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Add Courier Dialog */}
      <Dialog open={addCourierOpen} onOpenChange={setAddCourierOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Courier Integration</DialogTitle>
            <DialogDescription>
              Connect a new courier service to your account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="courier">Courier Service</Label>
              <Select
                value={newCourier.courierId}
                onValueChange={(value) => {
                  const courier = courierInfo.find(c => c.id === value)
                  setNewCourier({
                    ...newCourier,
                    courierId: value,
                    defaultServiceType: courier?.serviceTypes[0] || '',
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a courier" />
                </SelectTrigger>
                <SelectContent>
                  {courierInfo.map(courier => (
                    <SelectItem key={courier.id} value={courier.id}>
                      {courier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                placeholder="Enter your account number"
                value={newCourier.accountNumber}
                onChange={(e) => setNewCourier({ ...newCourier, accountNumber: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key (Optional)</Label>
              <Input
                id="apiKey"
                placeholder="Enter API key if required"
                value={newCourier.apiKey}
                onChange={(e) => setNewCourier({ ...newCourier, apiKey: e.target.value })}
              />
            </div>

            {newCourier.courierId && (
              <div className="space-y-2">
                <Label htmlFor="serviceType">Default Service Type</Label>
                <Select
                  value={newCourier.defaultServiceType}
                  onValueChange={(value) => setNewCourier({ ...newCourier, defaultServiceType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {courierInfo.find(c => c.id === newCourier.courierId)?.serviceTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between py-2">
              <div>
                <Label>Auto-create Waybill</Label>
                <p className="text-xs text-[#757575]">Automatically create waybills for new orders</p>
              </div>
              <Switch
                checked={newCourier.autoCreateWaybill}
                onCheckedChange={(checked) => setNewCourier({ ...newCourier, autoCreateWaybill: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCourierOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleAddCourier}>
              Add Integration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Shipment Dialog */}
      <Dialog open={createShipmentOpen} onOpenChange={setCreateShipmentOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Shipment</DialogTitle>
            <DialogDescription>
              Enter shipment details to create a new waybill
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Order Reference */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Package className="h-4 w-4 text-[#00897B]" />
                Order Reference
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Reference Type</Label>
                  <Select
                    value={newShipment.orderType}
                    onValueChange={(value) => setNewShipment({ ...newShipment, orderType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="order">Order</SelectItem>
                      <SelectItem value="invoice">Invoice</SelectItem>
                      <SelectItem value="po">Purchase Order</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reference Number</Label>
                  <Input
                    placeholder="e.g., ORD-12345"
                    value={newShipment.orderReference}
                    onChange={(e) => setNewShipment({ ...newShipment, orderReference: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Recipient Details */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#00897B]" />
                Recipient Details
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Recipient Name *</Label>
                  <Input
                    placeholder="Full name"
                    value={newShipment.recipientName}
                    onChange={(e) => setNewShipment({ ...newShipment, recipientName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    placeholder="+27 XX XXX XXXX"
                    value={newShipment.recipientPhone}
                    onChange={(e) => setNewShipment({ ...newShipment, recipientPhone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Street Address *</Label>
                <Textarea
                  placeholder="Full street address"
                  value={newShipment.recipientAddress}
                  onChange={(e) => setNewShipment({ ...newShipment, recipientAddress: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City *</Label>
                  <Input
                    placeholder="City"
                    value={newShipment.recipientCity}
                    onChange={(e) => setNewShipment({ ...newShipment, recipientCity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Postal Code</Label>
                  <Input
                    placeholder="0000"
                    value={newShipment.recipientPostalCode}
                    onChange={(e) => setNewShipment({ ...newShipment, recipientPostalCode: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Package Details */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Box className="h-4 w-4 text-[#00897B]" />
                Package Details
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={newShipment.weight}
                    onChange={(e) => setNewShipment({ ...newShipment, weight: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Length (cm)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newShipment.length}
                    onChange={(e) => setNewShipment({ ...newShipment, length: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Width (cm)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newShipment.width}
                    onChange={(e) => setNewShipment({ ...newShipment, width: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Height (cm)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newShipment.height}
                    onChange={(e) => setNewShipment({ ...newShipment, height: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2 w-32">
                <Label>Parcel Count</Label>
                <Input
                  type="number"
                  min="1"
                  value={newShipment.parcelCount}
                  onChange={(e) => setNewShipment({ ...newShipment, parcelCount: e.target.value })}
                />
              </div>
            </div>

            <Separator />

            {/* Courier Selection */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Truck className="h-4 w-4 text-[#00897B]" />
                Courier Selection
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Courier *</Label>
                  <Select
                    value={newShipment.courierId}
                    onValueChange={(value) => {
                      const courier = courierInfo.find(c => c.id === value)
                      setNewShipment({
                        ...newShipment,
                        courierId: value,
                        serviceType: courier?.serviceTypes[0] || '',
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select courier" />
                    </SelectTrigger>
                    <SelectContent>
                      {courierInfo.map(courier => (
                        <SelectItem key={courier.id} value={courier.id}>
                          {courier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Service Type</Label>
                  <Select
                    value={newShipment.serviceType}
                    onValueChange={(value) => setNewShipment({ ...newShipment, serviceType: value })}
                    disabled={!newShipment.courierId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {courierInfo.find(c => c.id === newShipment.courierId)?.serviceTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateShipmentOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleCreateShipment}>
              <Send className="h-4 w-4 mr-2" />
              Create Shipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cost Calculator Dialog */}
      <Dialog open={costCalculatorOpen} onOpenChange={setCostCalculatorOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-[#00897B]" />
              Delivery Cost Calculator
            </DialogTitle>
            <DialogDescription>
              Compare delivery costs across different couriers
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Origin City</Label>
                <Select
                  value={costCalcForm.originCity}
                  onValueChange={v => setCostCalcForm(prev => ({ ...prev, originCity: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select origin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="johannesburg">Johannesburg</SelectItem>
                    <SelectItem value="cape_town">Cape Town</SelectItem>
                    <SelectItem value="durban">Durban</SelectItem>
                    <SelectItem value="pretoria">Pretoria</SelectItem>
                    <SelectItem value="port_elizabeth">Port Elizabeth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Destination City</Label>
                <Select
                  value={costCalcForm.destinationCity}
                  onValueChange={v => setCostCalcForm(prev => ({ ...prev, destinationCity: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="johannesburg">Johannesburg</SelectItem>
                    <SelectItem value="cape_town">Cape Town</SelectItem>
                    <SelectItem value="durban">Durban</SelectItem>
                    <SelectItem value="pretoria">Pretoria</SelectItem>
                    <SelectItem value="port_elizabeth">Port Elizabeth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={costCalcForm.weight}
                  onChange={e => setCostCalcForm(prev => ({ ...prev, weight: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Length (cm)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={costCalcForm.length}
                  onChange={e => setCostCalcForm(prev => ({ ...prev, length: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Width (cm)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={costCalcForm.width}
                  onChange={e => setCostCalcForm(prev => ({ ...prev, width: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Height (cm)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={costCalcForm.height}
                  onChange={e => setCostCalcForm(prev => ({ ...prev, height: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Service Type</Label>
              <Select
                value={costCalcForm.serviceType}
                onValueChange={v => setCostCalcForm(prev => ({ ...prev, serviceType: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Economy">Economy (3-5 days)</SelectItem>
                  <SelectItem value="Express">Express (1-2 days)</SelectItem>
                  <SelectItem value="Overnight">Overnight</SelectItem>
                  <SelectItem value="Same Day">Same Day</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results */}
            {costCalcForm.weight && costCalcForm.originCity && costCalcForm.destinationCity && (
              <div className="mt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Route className="h-4 w-4 text-[#00897B]" />
                  Delivery Quotes
                </h4>
                <div className="space-y-2">
                  {calculateQuotes.map(quote => (
                    <div key={quote.courierId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-[#00897B] flex items-center justify-center text-white font-bold">
                          {quote.courierName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{quote.courierName}</p>
                          <div className="flex items-center gap-2 text-xs text-[#757575]">
                            <Clock className="h-3 w-3" />
                            {quote.estimatedDays === 0 ? 'Same day' : `${quote.estimatedDays}-${quote.estimatedDays + 1} days`}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#00897B]">{formatCurrency(quote.totalCost)}</p>
                        <p className="text-xs text-[#757575]">Base: {formatCurrency(quote.baseCost)} + Weight: {formatCurrency(quote.weightCost)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCostCalculatorOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Pickup Dialog */}
      <Dialog open={schedulePickupOpen} onOpenChange={setSchedulePickupOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-[#00897B]" />
              Schedule Pickup
            </DialogTitle>
            <DialogDescription>
              Schedule a courier pickup for your shipments
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Courier</Label>
              <Select
                value={pickupForm.courierId}
                onValueChange={v => setPickupForm(prev => ({ ...prev, courierId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select courier" />
                </SelectTrigger>
                <SelectContent>
                  {integrations.filter(i => i.status === 'active').map(int => (
                    <SelectItem key={int.id} value={int.courierId}>{int.courierName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={pickupForm.scheduledDate}
                  onChange={e => setPickupForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={pickupForm.scheduledTime}
                  onChange={e => setPickupForm(prev => ({ ...prev, scheduledTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Pickup Address</Label>
              <Textarea
                placeholder="Full pickup address"
                value={pickupForm.address}
                onChange={e => setPickupForm(prev => ({ ...prev, address: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Name</Label>
                <Input
                  placeholder="Contact person"
                  value={pickupForm.contactName}
                  onChange={e => setPickupForm(prev => ({ ...prev, contactName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <Input
                  placeholder="+27 XX XXX XXXX"
                  value={pickupForm.contactPhone}
                  onChange={e => setPickupForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Parcel Count</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={pickupForm.parcelCount}
                  onChange={e => setPickupForm(prev => ({ ...prev, parcelCount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Total Weight (kg)</Label>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={pickupForm.totalWeight}
                  onChange={e => setPickupForm(prev => ({ ...prev, totalWeight: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Special Instructions (Optional)</Label>
              <Textarea
                placeholder="Any special instructions for the pickup..."
                value={pickupForm.specialInstructions}
                onChange={e => setPickupForm(prev => ({ ...prev, specialInstructions: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSchedulePickupOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleSchedulePickup}>
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Pickup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tracking Dialog */}
      <Dialog open={trackingOpen} onOpenChange={setTrackingOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Shipment Tracking</DialogTitle>
            <DialogDescription>
              {selectedShipment?.waybillNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedShipment && (
            <div className="space-y-4 py-4">
              {/* Shipment Info */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#757575]">Status</span>
                  <Badge className={getStatusColor(selectedShipment.status)}>
                    {getStatusLabel(selectedShipment.status)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#757575]">Courier</span>
                  <span className="font-medium">{selectedShipment.courierName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#757575]">Service</span>
                  <span className="font-medium">{selectedShipment.serviceType}</span>
                </div>
                {selectedShipment.cost && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#757575]">Cost</span>
                    <span className="font-medium">{formatCurrency(selectedShipment.cost)}</span>
                  </div>
                )}
              </div>

              {/* Tracking Timeline */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Tracking History</h4>
                <div className="relative">
                  {selectedShipment.trackingEvents.map((event, index) => (
                    <div key={event.id} className="flex gap-4 pb-4">
                      {/* Timeline line */}
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-[#00897B]' : 'bg-gray-300'
                        }`} />
                        {index < selectedShipment.trackingEvents.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 mt-1" />
                        )}
                      </div>
                      {/* Event content */}
                      <div className="flex-1 pb-2">
                        <div className="flex items-center justify-between">
                          <p className={`font-medium text-sm ${index === 0 ? 'text-[#00897B]' : ''}`}>
                            {event.status}
                          </p>
                          <span className="text-xs text-[#757575]">
                            {formatDateTime(event.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-[#757575]">{event.location}</p>
                        <p className="text-sm text-[#1A1A1A]">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recipient Info */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-sm mb-2">Delivery Details</h4>
                <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                  <p className="text-sm font-medium">{selectedShipment.recipientName}</p>
                  <p className="text-xs text-[#757575]">{selectedShipment.recipientPhone}</p>
                  <p className="text-xs text-[#757575]">{selectedShipment.destinationAddress}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrackingOpen(false)}>Close</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => {
              setTrackingOpen(false)
              if (selectedShipment) handlePrintLabel(selectedShipment)
            }}>
              <Printer className="h-4 w-4 mr-2" />
              Print Label
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={updateStatusOpen} onOpenChange={setUpdateStatusOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Shipment Status</DialogTitle>
            <DialogDescription>
              {selectedShipment?.waybillNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedShipment && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>New Status</Label>
                <Select defaultValue={selectedShipment.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="picked_up">Picked Up</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea placeholder="Add notes about this status update..." rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateStatusOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setUpdateStatusOpen(false)}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pickup Detail Dialog */}
      <Dialog open={pickupDetailOpen} onOpenChange={setPickupDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pickup Details</DialogTitle>
            <DialogDescription>
              {selectedPickup?.reference}
            </DialogDescription>
          </DialogHeader>
          {selectedPickup && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#757575]">Courier</span>
                  <span className="font-medium">{selectedPickup.courierName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#757575]">Status</span>
                  <Badge className={getStatusColor(selectedPickup.status)}>
                    {getStatusLabel(selectedPickup.status)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#757575]">Scheduled</span>
                  <span className="font-medium">{formatDate(selectedPickup.scheduledDate)} at {selectedPickup.scheduledTime}</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-2">Pickup Address</h4>
                <p className="text-sm text-[#757575]">{selectedPickup.address}</p>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-2">Contact</h4>
                <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                  <p className="text-sm font-medium">{selectedPickup.contactName}</p>
                  <p className="text-xs text-[#757575]">{selectedPickup.contactPhone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#757575]">Parcels</p>
                  <p className="font-medium">{selectedPickup.parcelCount}</p>
                </div>
                <div>
                  <p className="text-xs text-[#757575]">Total Weight</p>
                  <p className="font-medium">{selectedPickup.totalWeight} kg</p>
                </div>
              </div>

              {selectedPickup.specialInstructions && (
                <div>
                  <p className="text-xs text-[#757575] mb-1">Special Instructions</p>
                  <p className="text-sm bg-gray-50 p-2 rounded">{selectedPickup.specialInstructions}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPickupDetailOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
