'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
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
  Car,
  Wrench,
  Clock,
  Users,
  FileText,
  DollarSign,
  Package,
  Calendar,
  Phone,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Download,
  Printer,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  History,
  Building2,
  Timer,
  OilCan,
  Battery,
  Gauge,
  Cog,
  CircleDot,
  Loader2,
  CreditCard,
  Banknote,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck,
  ClipboardList,
} from 'lucide-react'

// Types specific to Auto Repair
type JobStatus = 'pending' | 'diagnosing' | 'awaiting_parts' | 'in_progress' | 'quality_check' | 'completed' | 'invoiced' | 'collected'
type Priority = 'low' | 'normal' | 'high' | 'urgent'

interface Vehicle {
  id: string
  registration: string
  make: string
  model: string
  year: number
  color: string
  vin: string
  engineNumber: string
  mileage: number
  fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid'
  customerId: string
  customerName: string
  customerPhone: string
  customerEmail: string
}

interface Mechanic {
  id: string
  name: string
  specialization: string
  status: 'available' | 'busy' | 'on_break' | 'off_duty'
  currentJobs: number
  completedToday: number
}

interface Part {
  id: string
  name: string
  partNumber: string
  category: 'engine' | 'transmission' | 'brakes' | 'suspension' | 'electrical' | 'body' | 'consumables'
  quantity: number
  unitPrice: number
  supplier: string
  inStock: boolean
}

interface LaborItem {
  id: string
  description: string
  hours: number
  rate: number
  mechanicId: string
  mechanicName: string
  status: 'pending' | 'in_progress' | 'completed'
}

interface JobCard {
  id: string
  jobNumber: string
  vehicle: Vehicle
  customerReport: string
  diagnosis: string
  recommendedRepairs: string
  parts: Part[]
  labor: LaborItem[]
  status: JobStatus
  priority: Priority
  assignedMechanic: Mechanic
  estimatedHours: number
  actualHours: number
  estimatedCost: number
  actualCost: number
  startDate: string
  targetDate: string
  completedDate?: string
  notes: string
  createdAt: string
}

interface ServiceHistory {
  id: string
  date: string
  serviceType: string
  mileage: number
  cost: number
  notes: string
}

export function AutoRepairView() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Data states
  const [jobCards, setJobCards] = useState<JobCard[]>([])
  const [mechanics, setMechanics] = useState<Mechanic[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [partsLowStock, setPartsLowStock] = useState<Part[]>([])

  // Dialog states
  const [newJobDialogOpen, setNewJobDialogOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobCard | null>(null)

  // Update time
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Mock data
  useEffect(() => {
    const timer = setTimeout(() => {
      setMechanics([
        { id: 'm1', name: 'Sipho Mokoena', specialization: 'Engine & Transmission', status: 'busy', currentJobs: 2, completedToday: 1 },
        { id: 'm2', name: 'Thabo Dlamini', specialization: 'Electrical & Diagnostics', status: 'available', currentJobs: 1, completedToday: 2 },
        { id: 'm3', name: 'Johan van der Berg', specialization: 'Brakes & Suspension', status: 'busy', currentJobs: 2, completedToday: 0 },
        { id: 'm4', name: 'Blessing Ndaba', specialization: 'General Maintenance', status: 'available', currentJobs: 0, completedToday: 3 },
      ])

      setJobCards([
        {
          id: 'job-1',
          jobNumber: 'JOB-2026-001',
          vehicle: {
            id: 'v1',
            registration: 'CA 123 456',
            make: 'Toyota',
            model: 'Hilux 2.4 D-4D',
            year: 2019,
            color: 'White',
            vin: 'MR0JX22G700123456',
            engineNumber: '2GD-123456',
            mileage: 145000,
            fuelType: 'diesel',
            customerId: 'cust-1',
            customerName: 'ABC Construction (Pty) Ltd',
            customerPhone: '0115551234',
            customerEmail: 'fleet@abcconstruction.co.za',
          },
          customerReport: 'Engine making unusual noise, loss of power on acceleration',
          diagnosis: 'Turbocharger failure, boost leak detected. Intercooler pipes damaged.',
          recommendedRepairs: 'Replace turbocharger unit, replace intercooler pipes, replace oil and filter',
          parts: [
            { id: 'p1', name: 'Turbocharger Assembly', partNumber: 'TC-TOY-2.4D', category: 'engine', quantity: 1, unitPrice: 18500, supplier: 'Toyota SA Parts', inStock: true },
            { id: 'p2', name: 'Intercooler Pipe Kit', partNumber: 'IC-PIP-TOY', category: 'engine', quantity: 1, unitPrice: 2500, supplier: 'AutoZone', inStock: true },
            { id: 'p3', name: 'Engine Oil 5W-40 (5L)', partNumber: 'OIL-5W40-5L', category: 'consumables', quantity: 2, unitPrice: 450, supplier: 'Local Supplier', inStock: true },
            { id: 'p4', name: 'Oil Filter', partNumber: 'OF-TOY-001', category: 'consumables', quantity: 1, unitPrice: 180, supplier: 'Toyota SA Parts', inStock: true },
          ],
          labor: [
            { id: 'l1', description: 'Turbocharger replacement', hours: 4, rate: 450, mechanicId: 'm1', mechanicName: 'Sipho Mokoena', status: 'in_progress' },
            { id: 'l2', description: 'Intercooler pipe installation', hours: 1.5, rate: 450, mechanicId: 'm1', mechanicName: 'Sipho Mokoena', status: 'pending' },
            { id: 'l3', description: 'Oil and filter change', hours: 0.5, rate: 350, mechanicId: 'm4', mechanicName: 'Blessing Ndaba', status: 'completed' },
          ],
          status: 'in_progress',
          priority: 'high',
          assignedMechanic: { id: 'm1', name: 'Sipho Mokoena', specialization: 'Engine & Transmission', status: 'busy', currentJobs: 2, completedToday: 1 },
          estimatedHours: 6,
          actualHours: 3,
          estimatedCost: 32000,
          actualCost: 0,
          startDate: '2026-02-14',
          targetDate: '2026-02-15',
          notes: 'Customer needs vehicle urgently for construction site',
          createdAt: '2026-02-14T08:00:00',
        },
        {
          id: 'job-2',
          jobNumber: 'JOB-2026-002',
          vehicle: {
            id: 'v2',
            registration: 'GP 789 012',
            make: 'Volkswagen',
            model: 'Polo Vivo 1.4',
            year: 2021,
            color: 'Silver',
            vin: 'WVWZZZ6CZPW123456',
            engineNumber: 'CGPA-123456',
            mileage: 67000,
            fuelType: 'petrol',
            customerId: 'cust-2',
            customerName: 'Thandi Zwane',
            customerPhone: '0825557890',
            customerEmail: 'thandi.z@email.com',
          },
          customerReport: 'Brake warning light on, grinding noise when braking',
          diagnosis: 'Front brake pads worn beyond limit, brake discs scored',
          recommendedRepairs: 'Replace front brake pads, machine or replace front discs',
          parts: [
            { id: 'p5', name: 'Front Brake Pad Set', partNumber: 'BP-VW-POLO-F', category: 'brakes', quantity: 1, unitPrice: 950, supplier: 'Bosch SA', inStock: true },
            { id: 'p6', name: 'Front Brake Disc Pair', partNumber: 'BD-VW-POLO-F', category: 'brakes', quantity: 2, unitPrice: 1200, supplier: 'Bosch SA', inStock: true },
          ],
          labor: [
            { id: 'l4', description: 'Front brake pads and disc replacement', hours: 2, rate: 400, mechanicId: 'm3', mechanicName: 'Johan van der Berg', status: 'completed' },
          ],
          status: 'quality_check',
          priority: 'normal',
          assignedMechanic: { id: 'm3', name: 'Johan van der Berg', specialization: 'Brakes & Suspension', status: 'busy', currentJobs: 2, completedToday: 0 },
          estimatedHours: 2,
          actualHours: 1.5,
          estimatedCost: 5000,
          actualCost: 4700,
          startDate: '2026-02-14',
          targetDate: '2026-02-14',
          notes: '',
          createdAt: '2026-02-14T10:00:00',
        },
        {
          id: 'job-3',
          jobNumber: 'JOB-2026-003',
          vehicle: {
            id: 'v3',
            registration: 'FS 345 678',
            make: 'Ford',
            model: 'Ranger 3.2 TDCi',
            year: 2020,
            color: 'Blue',
            vin: 'MNARXXTG2AW123456',
            engineNumber: 'P5AT-123456',
            mileage: 89000,
            fuelType: 'diesel',
            customerId: 'cust-3',
            customerName: 'Mike Peters Transport',
            customerPhone: '0515553456',
            customerEmail: 'service@mptransport.co.za',
          },
          customerReport: 'Major service due, check all fluids',
          diagnosis: 'Routine major service required',
          recommendedRepairs: 'Major service including all filters, fluids, and inspection',
          parts: [
            { id: 'p7', name: 'Oil Filter', partNumber: 'OF-FORD-RNG', category: 'consumables', quantity: 1, unitPrice: 220, supplier: 'Ford SA', inStock: true },
            { id: 'p8', name: 'Air Filter', partNumber: 'AF-FORD-RNG', category: 'consumables', quantity: 1, unitPrice: 380, supplier: 'Ford SA', inStock: true },
            { id: 'p9', name: 'Fuel Filter', partNumber: 'FF-FORD-RNG', category: 'consumables', quantity: 1, unitPrice: 520, supplier: 'Ford SA', inStock: false },
            { id: 'p10', name: 'Diesel Oil 5W-30 (10L)', partNumber: 'OIL-5W30-10L', category: 'consumables', quantity: 1, unitPrice: 1200, supplier: 'Local Supplier', inStock: true },
          ],
          labor: [
            { id: 'l5', description: 'Major service', hours: 3, rate: 400, mechanicId: 'm4', mechanicName: 'Blessing Ndaba', status: 'pending' },
          ],
          status: 'awaiting_parts',
          priority: 'low',
          assignedMechanic: { id: 'm4', name: 'Blessing Ndaba', specialization: 'General Maintenance', status: 'available', currentJobs: 0, completedToday: 3 },
          estimatedHours: 3,
          actualHours: 0,
          estimatedCost: 4500,
          actualCost: 0,
          startDate: '2026-02-15',
          targetDate: '2026-02-16',
          notes: 'Fuel filter on backorder - ETA 2 days',
          createdAt: '2026-02-14T11:00:00',
        },
      ])

      setPartsLowStock([
        { id: 'p11', name: 'Brake Fluid 500ml', partNumber: 'BF-500', category: 'consumables', quantity: 3, unitPrice: 120, supplier: 'Local Supplier', inStock: true },
        { id: 'p12', name: 'Coolant 1L', partNumber: 'CL-1L', category: 'consumables', quantity: 5, unitPrice: 85, supplier: 'Local Supplier', inStock: true },
        { id: 'p13', name: 'Spark Plug (set of 4)', partNumber: 'SP-VW-SET4', category: 'electrical', quantity: 2, unitPrice: 480, supplier: 'NGK', inStock: true },
      ])

      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Stats
  const stats = {
    activeJobs: jobCards.filter(j => !['completed', 'invoiced', 'collected'].includes(j.status)).length,
    pending: jobCards.filter(j => j.status === 'pending').length,
    inProgress: jobCards.filter(j => j.status === 'in_progress').length,
    awaitingParts: jobCards.filter(j => j.status === 'awaiting_parts').length,
    qualityCheck: jobCards.filter(j => j.status === 'quality_check').length,
    completedToday: jobCards.filter(j => j.status === 'completed').length,
    availableMechanics: mechanics.filter(m => m.status === 'available').length,
    totalMechanics: mechanics.length,
    estimatedRevenue: jobCards.reduce((sum, j) => sum + j.estimatedCost, 0),
    lowStockItems: partsLowStock.length,
  }

  const getStatusColor = (status: JobStatus) => {
    const colors: Record<JobStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      diagnosing: 'bg-blue-100 text-blue-700',
      awaiting_parts: 'bg-orange-100 text-orange-700',
      in_progress: 'bg-purple-100 text-purple-700',
      quality_check: 'bg-cyan-100 text-cyan-700',
      completed: 'bg-green-100 text-green-700',
      invoiced: 'bg-gray-100 text-gray-700',
      collected: 'bg-gray-100 text-gray-700',
    }
    return colors[status]
  }

  const getPriorityColor = (priority: Priority) => {
    const colors: Record<Priority, string> = {
      low: 'bg-gray-100 text-gray-700',
      normal: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700',
    }
    return colors[priority]
  }

  const formatCurrency = (amount: number) => {
    return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAFAFA] min-h-0">
        <Loader2 className="h-8 w-8 animate-spin text-[#00897B]" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFA] min-h-0">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
              <Wrench className="h-5 w-5 text-[#00897B]" />
              Workshop Management
            </h1>
            <p className="text-sm text-[#757575]">Job cards, parts billing, time tracking & vehicle records</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-mono font-bold">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-xs text-[#757575]">{currentTime.toLocaleDateString()}</p>
            </div>

            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setNewJobDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />New Job Card
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-9 gap-3">
          <div className="bg-[#E0F2F1] rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-[#00897B]">{stats.activeJobs}</p>
            <p className="text-[10px] text-[#757575]">Active Jobs</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-[10px] text-[#757575]">Pending</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-purple-600">{stats.inProgress}</p>
            <p className="text-[10px] text-[#757575]">In Progress</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-orange-600">{stats.awaitingParts}</p>
            <p className="text-[10px] text-[#757575]">Awaiting Parts</p>
          </div>
          <div className="bg-cyan-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-cyan-600">{stats.qualityCheck}</p>
            <p className="text-[10px] text-[#757575]">QC</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-green-600">{stats.completedToday}</p>
            <p className="text-[10px] text-[#757575]">Completed</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-blue-600">{stats.availableMechanics}/{stats.totalMechanics}</p>
            <p className="text-[10px] text-[#757575]">Mechanics</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-green-600">{formatCurrency(stats.estimatedRevenue)}</p>
            <p className="text-[10px] text-[#757575]">Est. Revenue</p>
          </div>
          <div className="bg-red-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-red-600">{stats.lowStockItems}</p>
            <p className="text-[10px] text-[#757575]">Low Stock</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 flex flex-col min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="bg-white border-b border-gray-200 px-4">
            <TabsList className="bg-transparent h-12">
              <TabsTrigger value="overview" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                Overview
              </TabsTrigger>
              <TabsTrigger value="jobcards" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <ClipboardList className="h-4 w-4 mr-1" />Job Cards
              </TabsTrigger>
              <TabsTrigger value="mechanics" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Users className="h-4 w-4 mr-1" />Mechanics
              </TabsTrigger>
              <TabsTrigger value="vehicles" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Car className="h-4 w-4 mr-1" />Vehicles
              </TabsTrigger>
              <TabsTrigger value="parts" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Package className="h-4 w-4 mr-1" />Parts
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-4">
            {/* Overview Tab */}
            <TabsContent value="overview" className="m-0">
              <div className="grid grid-cols-2 gap-4">
                {/* Active Jobs */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-[#00897B]" />
                      Active Jobs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {jobCards.filter(j => ['in_progress', 'diagnosing'].includes(j.status)).map(job => (
                        <div key={job.id} className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{job.vehicle.registration}</p>
                            <p className="text-xs text-[#757575]">{job.vehicle.make} {job.vehicle.model}</p>
                            <p className="text-xs text-[#757575]">Mechanic: {job.assignedMechanic.name}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
                            <p className="text-xs text-[#757575] mt-1">{job.actualHours}/{job.estimatedHours} hrs</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Mechanics Status */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-5 w-5 text-[#00897B]" />
                      Mechanics Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {mechanics.map(mechanic => (
                        <div key={mechanic.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              mechanic.status === 'available' ? 'bg-green-500' :
                              mechanic.status === 'busy' ? 'bg-orange-500' : 'bg-gray-400'
                            }`} />
                            <div>
                              <p className="font-medium text-sm">{mechanic.name}</p>
                              <p className="text-xs text-[#757575]">{mechanic.specialization}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">{mechanic.currentJobs} jobs</p>
                            <p className="text-xs text-green-600">{mechanic.completedToday} done today</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Awaiting Parts */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-5 w-5 text-[#00897B]" />
                      Awaiting Parts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {jobCards.filter(j => j.status === 'awaiting_parts').map(job => (
                        <div key={job.id} className="p-2 bg-orange-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{job.vehicle.registration}</p>
                              <p className="text-xs text-[#757575]">{job.jobNumber}</p>
                            </div>
                            <Badge className="bg-orange-100 text-orange-700">Awaiting Parts</Badge>
                          </div>
                          <div className="mt-2">
                            {job.parts.filter(p => !p.inStock).map(part => (
                              <p key={part.id} className="text-xs text-orange-600">
                                - {part.name} ({part.partNumber})
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                      {jobCards.filter(j => j.status === 'awaiting_parts').length === 0 && (
                        <p className="text-center text-sm text-[#757575] py-4">No jobs awaiting parts</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Low Stock Alert */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      Low Stock Alert
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {partsLowStock.map(part => (
                        <div key={part.id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{part.name}</p>
                            <p className="text-xs text-[#757575]">{part.partNumber}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-red-600">{part.quantity} left</p>
                            <Button size="sm" variant="outline" className="text-xs">Reorder</Button>
                          </div>
                        </div>
                      ))}
                      {partsLowStock.length === 0 && (
                        <p className="text-center text-sm text-[#757575] py-4">All parts adequately stocked</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Job Cards Tab */}
            <TabsContent value="jobcards" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Job Cards</h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search jobs, vehicles..." className="pl-9 w-64" />
                  </div>
                  <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setNewJobDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />New Job Card
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {jobCards.map(job => (
                  <Card key={job.id} className="cursor-pointer hover:border-[#00897B]" onClick={() => setSelectedJob(job)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-lg bg-[#E0F2F1]">
                            <Car className="h-5 w-5 text-[#00897B]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold">{job.vehicle.registration}</p>
                              <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
                              <Badge className={getPriorityColor(job.priority)}>{job.priority}</Badge>
                            </div>
                            <p className="text-sm text-[#757575]">{job.jobNumber}</p>
                            <p className="text-sm text-[#757575]">{job.vehicle.make} {job.vehicle.model} ({job.vehicle.year})</p>
                            <p className="text-sm text-[#757575]">{job.vehicle.mileage.toLocaleString()} km</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#00897B]">{formatCurrency(job.estimatedCost)}</p>
                          <p className="text-xs text-[#757575]">Est. {job.estimatedHours} hrs</p>
                          {job.actualHours > 0 && (
                            <p className="text-xs text-purple-600">Actual: {job.actualHours} hrs</p>
                          )}
                        </div>
                      </div>

                      {/* Job Details */}
                      <div className="mt-4 pt-4 border-t">
                        <div className="mb-2">
                          <p className="text-xs text-[#757575]">Customer Report:</p>
                          <p className="text-sm">{job.customerReport}</p>
                        </div>
                        <div className="mb-2">
                          <p className="text-xs text-[#757575]">Diagnosis:</p>
                          <p className="text-sm">{job.diagnosis}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                          <div>
                            <p className="text-[#757575]">Assigned To</p>
                            <p className="font-medium">{job.assignedMechanic.name}</p>
                          </div>
                          <div>
                            <p className="text-[#757575]">Customer</p>
                            <p className="font-medium">{job.vehicle.customerName}</p>
                          </div>
                          <div>
                            <p className="text-[#757575]">Target Date</p>
                            <p className="font-medium">{job.targetDate}</p>
                          </div>
                        </div>
                      </div>

                      {/* Parts & Labor Summary */}
                      <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium text-[#757575] mb-2">Parts ({job.parts.length})</p>
                          <div className="space-y-1">
                            {job.parts.slice(0, 3).map(part => (
                              <div key={part.id} className="flex justify-between text-xs">
                                <span>{part.name}</span>
                                <span className={part.inStock ? 'text-green-600' : 'text-orange-600'}>
                                  {formatCurrency(part.unitPrice * part.quantity)}
                                </span>
                              </div>
                            ))}
                            {job.parts.length > 3 && (
                              <p className="text-xs text-[#757575]">+{job.parts.length - 3} more parts</p>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-[#757575] mb-2">Labor ({job.labor.length})</p>
                          <div className="space-y-1">
                            {job.labor.map(labor => (
                              <div key={labor.id} className="flex justify-between text-xs">
                                <span>{labor.description}</span>
                                <span className={labor.status === 'completed' ? 'text-green-600' : 'text-blue-600'}>
                                  {labor.hours}h @ {formatCurrency(labor.rate)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Mechanics Tab */}
            <TabsContent value="mechanics" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Mechanics</h2>
                <Button className="bg-[#00897B] hover:bg-[#00695C]">
                  <Plus className="h-4 w-4 mr-2" />Add Mechanic
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {mechanics.map(mechanic => (
                  <Card key={mechanic.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                          mechanic.status === 'available' ? 'bg-green-500' :
                          mechanic.status === 'busy' ? 'bg-orange-500' : 'bg-gray-400'
                        }`}>
                          {mechanic.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold">{mechanic.name}</p>
                            <Badge className={
                              mechanic.status === 'available' ? 'bg-green-100 text-green-700' :
                              mechanic.status === 'busy' ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-100 text-gray-700'
                            }>
                              {mechanic.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-[#757575]">{mechanic.specialization}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-[#00897B]">{mechanic.currentJobs}</p>
                          <p className="text-xs text-[#757575]">Current Jobs</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{mechanic.completedToday}</p>
                          <p className="text-xs text-[#757575]">Completed Today</p>
                        </div>
                        <div className="text-center">
                          <Button size="sm" variant="outline" className="w-full">View Schedule</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Vehicles Tab */}
            <TabsContent value="vehicles" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Vehicle Records</h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search by registration..." className="pl-9 w-64" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {jobCards.map(job => (
                  <Card key={job.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-lg bg-[#E0F2F1]">
                            <Car className="h-5 w-5 text-[#00897B]" />
                          </div>
                          <div>
                            <p className="font-bold">{job.vehicle.registration}</p>
                            <p className="text-sm text-[#757575]">{job.vehicle.make} {job.vehicle.model} ({job.vehicle.year})</p>
                            <p className="text-sm text-[#757575]">VIN: {job.vehicle.vin}</p>
                            <p className="text-sm text-[#757575]">Engine: {job.vehicle.engineNumber}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-[#757575]">Mileage</p>
                          <p className="font-bold">{job.vehicle.mileage.toLocaleString()} km</p>
                          <p className="text-xs text-[#757575] mt-2">Owner</p>
                          <p className="text-sm">{job.vehicle.customerName}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Parts Tab */}
            <TabsContent value="parts" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Parts & Inventory</h2>
                <Button className="bg-[#00897B] hover:bg-[#00695C]">
                  <Plus className="h-4 w-4 mr-2" />Add Part
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Parts Used in Active Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {jobCards.flatMap(j => j.parts.map(p => ({ ...p, jobNumber: j.jobNumber, vehicle: j.vehicle.registration }))).map((part, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${part.inStock ? 'bg-green-100' : 'bg-orange-100'}`}>
                            <Package className={`h-4 w-4 ${part.inStock ? 'text-green-600' : 'text-orange-600'}`} />
                          </div>
                          <div>
                            <p className="font-medium">{part.name}</p>
                            <p className="text-sm text-[#757575]">{part.partNumber} | {part.category}</p>
                            <p className="text-xs text-[#757575]">{part.jobNumber} - {part.vehicle}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(part.unitPrice)}</p>
                          <p className="text-xs text-[#757575]">Qty: {part.quantity}</p>
                          <Badge className={part.inStock ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}>
                            {part.inStock ? 'In Stock' : 'On Order'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  )
}
