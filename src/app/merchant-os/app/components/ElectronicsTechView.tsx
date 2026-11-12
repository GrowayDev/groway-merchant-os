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
  Cpu,
  Wrench,
  Clock,
  Users,
  FileText,
  DollarSign,
  Package,
  Calendar,
  Phone,
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
  Battery,
  Shield,
  ShieldCheck,
  CircleDot,
  CreditCard,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck,
  ClipboardList,
  Smartphone,
  Laptop,
  Tablet,
  Monitor,
  Headphones,
  Watch,
  Camera,
  Gamepad,
  Tv,
  Server,
  Tool,
  Settings,
  Zap,
  Award,
  TrendingUp,
  BarChart3,
  MessageSquare,
  Ticket,
  FileCheck,
  ArrowRightLeft,
  Tag,
  Percent,
  AlertCircle,
  Info,
  ChevronRight,
  Boxes,
  User,
  Mail,
  MapPin,
  Loader2,
  ArrowLeftRight,
  CircleDollarSign,
  HardDrive,
  MemoryStick,
} from 'lucide-react'

// Types specific to Electronics & Tech
type RepairStatus = 'pending' | 'diagnosing' | 'awaiting_parts' | 'in_progress' | 'testing' | 'completed' | 'awaiting_collection' | 'collected'
type Priority = 'low' | 'normal' | 'high' | 'urgent'
type DeviceCategory = 'smartphone' | 'laptop' | 'tablet' | 'desktop' | 'gaming' | 'audio' | 'wearable' | 'camera' | 'tv' | 'other'
type WarrantyStatus = 'active' | 'expired' | 'claim_in_progress' | 'claim_approved' | 'claim_rejected'
type TradeInStatus = 'pending_evaluation' | 'evaluated' | 'accepted' | 'rejected' | 'processed'
type ContractStatus = 'active' | 'expired' | 'pending_renewal' | 'cancelled'

interface Device {
  id: string
  serialNumber: string
  imei?: string
  brand: string
  model: string
  category: DeviceCategory
  customerId: string
  customerName: string
  customerPhone: string
  customerEmail: string
  purchaseDate: string
  warrantyExpiry?: string
  warrantyProvider?: string
  notes?: string
}

interface Technician {
  id: string
  name: string
  specialization: string
  status: 'available' | 'busy' | 'on_break' | 'off_duty'
  currentJobs: number
  completedToday: number
  certifications: string[]
}

interface Part {
  id: string
  name: string
  partNumber: string
  category: 'screen' | 'battery' | 'memory' | 'storage' | 'motherboard' | 'camera' | 'speaker' | 'port' | 'cable' | 'accessory' | 'other'
  quantity: number
  unitPrice: number
  supplier: string
  inStock: boolean
  compatibleModels: string[]
}

interface LaborItem {
  id: string
  description: string
  hours: number
  rate: number
  technicianId: string
  technicianName: string
  status: 'pending' | 'in_progress' | 'completed'
}

interface RepairJob {
  id: string
  jobNumber: string
  device: Device
  customerReport: string
  diagnosis: string
  issueFound: string
  solution: string
  parts: Part[]
  labor: LaborItem[]
  status: RepairStatus
  priority: Priority
  assignedTechnician: Technician
  estimatedHours: number
  actualHours: number
  estimatedCost: number
  actualCost: number
  startDate: string
  targetDate: string
  completedDate?: string
  collectedDate?: string
  quotationId?: string
  quotationAmount?: number
  quotationStatus?: 'pending' | 'approved' | 'rejected'
  notes: string
  createdAt: string
}

interface Warranty {
  id: string
  warrantyNumber: string
  device: Device
  provider: string
  planName: string
  startDate: string
  endDate: string
  coverageType: 'manufacturer' | 'extended' | 'third_party'
  status: WarrantyStatus
  claimsCount: number
  maxClaims: number
  remainingCoverage: number
  terms?: string
}

interface WarrantyClaim {
  id: string
  claimNumber: string
  warrantyId: string
  warrantyNumber: string
  device: Device
  issueDescription: string
  claimDate: string
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'completed'
  approvedAmount?: number
  rejectionReason?: string
  resolution?: string
}

interface TradeIn {
  id: string
  tradeInNumber: string
  customerName: string
  customerPhone: string
  customerEmail: string
  deviceType: string
  deviceBrand: string
  deviceModel: string
  serialNumber?: string
  imei?: string
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'non_functional'
  evaluationNotes: string
  estimatedValue: number
  offeredValue: number
  finalValue?: number
  status: TradeInStatus
  evaluatedBy?: string
  evaluationDate?: string
  createdAt: string
  creditApplied?: boolean
  creditAppliedTo?: string
}

interface ServiceContract {
  id: string
  contractNumber: string
  customerId: string
  customerName: string
  customerPhone: string
  customerEmail: string
  planName: string
  planType: 'basic' | 'standard' | 'premium' | 'enterprise'
  coveredDevices: Device[]
  startDate: string
  endDate: string
  monthlyFee: number
  includedServices: string[]
  usageLimits: { service: string; limit: number; used: number }[]
  status: ContractStatus
  autoRenew: boolean
}

interface SupportTicket {
  id: string
  ticketNumber: string
  customerId: string
  customerName: string
  deviceId?: string
  deviceInfo?: string
  category: 'hardware' | 'software' | 'network' | 'warranty' | 'billing' | 'other'
  priority: Priority
  subject: string
  description: string
  status: 'open' | 'in_progress' | 'waiting_customer' | 'waiting_parts' | 'resolved' | 'closed'
  assignedTo?: string
  createdAt: string
  updatedAt: string
  resolution?: string
  contractId?: string
}

interface CustomerDeviceHistory {
  id: string
  customerId: string
  customerName: string
  customerPhone: string
  customerEmail: string
  devices: Device[]
  repairs: { id: string; jobNumber: string; device: string; date: string; cost: number; status: string }[]
  warranties: { id: string; warrantyNumber: string; device: string; status: string }[]
  tradeIns: { id: string; tradeInNumber: string; device: string; value: number; date: string }[]
  contracts: { id: string; contractNumber: string; planName: string; status: string }[]
  totalSpent: number
  outstandingBalance: number
  lastVisit: string
}

export function ElectronicsTechView() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Data states
  const [repairJobs, setRepairJobs] = useState<RepairJob[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [partsInventory, setPartsInventory] = useState<Part[]>([])
  const [warranties, setWarranties] = useState<Warranty[]>([])
  const [warrantyClaims, setWarrantyClaims] = useState<WarrantyClaim[]>([])
  const [tradeIns, setTradeIns] = useState<TradeIn[]>([])
  const [serviceContracts, setServiceContracts] = useState<ServiceContract[]>([])
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([])
  const [customers, setCustomers] = useState<CustomerDeviceHistory[]>([])

  // Dialog states
  const [newRepairDialogOpen, setNewRepairDialogOpen] = useState(false)
  const [newQuotationDialogOpen, setNewQuotationDialogOpen] = useState(false)
  const [tradeInDialogOpen, setTradeInDialogOpen] = useState(false)
  const [selectedRepair, setSelectedRepair] = useState<RepairJob | null>(null)
  const [repairDetailDialogOpen, setRepairDetailDialogOpen] = useState(false)

  // Update time
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Mock data
  useEffect(() => {
    const timer = setTimeout(() => {
      setTechnicians([
        { 
          id: 't1', 
          name: 'Kagiso Molefe', 
          specialization: 'Smartphones & Tablets', 
          status: 'busy', 
          currentJobs: 2, 
          completedToday: 2,
          certifications: ['Apple Certified', 'Samsung Certified']
        },
        { 
          id: 't2', 
          name: 'Priya Naidoo', 
          specialization: 'Laptops & Desktops', 
          status: 'available', 
          currentJobs: 1, 
          completedToday: 3,
          certifications: ['Dell Certified', 'HP Certified']
        },
        { 
          id: 't3', 
          name: 'Johan van Wyk', 
          specialization: 'Gaming & Audio', 
          status: 'busy', 
          currentJobs: 1, 
          completedToday: 1,
          certifications: ['Sony Certified', 'Microsoft Certified']
        },
        { 
          id: 't4', 
          name: 'Lerato Dlamini', 
          specialization: 'Wearables & IoT', 
          status: 'available', 
          currentJobs: 0, 
          completedToday: 4,
          certifications: ['Apple Watch Certified', 'Fitbit Certified']
        },
      ])

      setRepairJobs([
        {
          id: 'r1',
          jobNumber: 'REP-2026-001',
          device: {
            id: 'd1',
            serialNumber: 'iPhone15Pro-123456',
            imei: '359123456789012',
            brand: 'Apple',
            model: 'iPhone 15 Pro',
            category: 'smartphone',
            customerId: 'cust-1',
            customerName: 'Thabo Mokoena',
            customerPhone: '0821234567',
            customerEmail: 'thabo.mokoena@email.com',
            purchaseDate: '2024-03-15',
            warrantyExpiry: '2025-03-15',
            warrantyProvider: 'Apple',
          },
          customerReport: 'Screen cracked after dropping, phone still works but touch not responding in some areas',
          diagnosis: 'Cracked OLED display with digitizer damage. Battery health at 82%, recommend replacement.',
          issueFound: 'Display assembly damaged, digitizer malfunction on lower right quadrant',
          solution: 'Replace display assembly with genuine Apple part, replace battery',
          parts: [
            { id: 'p1', name: 'iPhone 15 Pro Display Assembly', partNumber: 'IP15P-DISP-OEM', category: 'screen', quantity: 1, unitPrice: 4500, supplier: 'Apple Authorized', inStock: true, compatibleModels: ['iPhone 15 Pro'] },
            { id: 'p2', name: 'iPhone 15 Pro Battery', partNumber: 'IP15P-BAT-OEM', category: 'battery', quantity: 1, unitPrice: 850, supplier: 'Apple Authorized', inStock: true, compatibleModels: ['iPhone 15 Pro'] },
          ],
          labor: [
            { id: 'l1', description: 'Display replacement', hours: 1, rate: 450, technicianId: 't1', technicianName: 'Kagiso Molefe', status: 'in_progress' },
            { id: 'l2', description: 'Battery replacement', hours: 0.5, rate: 450, technicianId: 't1', technicianName: 'Kagiso Molefe', status: 'pending' },
          ],
          status: 'in_progress',
          priority: 'high',
          assignedTechnician: { id: 't1', name: 'Kagiso Molefe', specialization: 'Smartphones & Tablets', status: 'busy', currentJobs: 2, completedToday: 2, certifications: ['Apple Certified', 'Samsung Certified'] },
          estimatedHours: 2,
          actualHours: 0.5,
          estimatedCost: 6300,
          actualCost: 0,
          startDate: '2026-02-14',
          targetDate: '2026-02-15',
          notes: 'Customer needs phone urgently for work',
          createdAt: '2026-02-14T08:00:00',
          quotationId: 'Q-2026-001',
          quotationAmount: 6300,
          quotationStatus: 'approved',
        },
        {
          id: 'r2',
          jobNumber: 'REP-2026-002',
          device: {
            id: 'd2',
            serialNumber: 'MacBookPro-M3-789',
            brand: 'Apple',
            model: 'MacBook Pro 14" M3',
            category: 'laptop',
            customerId: 'cust-2',
            customerName: 'Sarah van der Berg',
            customerPhone: '0839876543',
            customerEmail: 'sarah.vdb@email.com',
            purchaseDate: '2023-11-20',
            warrantyExpiry: '2026-11-20',
            warrantyProvider: 'AppleCare+',
          },
          customerReport: 'Battery drains quickly, laptop gets hot, fan runs constantly',
          diagnosis: 'Battery health at 67%, thermal paste degraded, fan needs cleaning',
          issueFound: 'Battery degradation, thermal throttling due to degraded thermal compound',
          solution: 'Replace battery, reapply thermal paste, clean internal components',
          parts: [
            { id: 'p3', name: 'MacBook Pro 14" Battery', partNumber: 'MBP14-BAT-M3', category: 'battery', quantity: 1, unitPrice: 2800, supplier: 'Apple Authorized', inStock: true, compatibleModels: ['MacBook Pro 14" M3'] },
            { id: 'p4', name: 'Thermal Paste (Premium)', partNumber: 'TP-PRM-1G', category: 'other', quantity: 1, unitPrice: 150, supplier: 'Local Supplier', inStock: true, compatibleModels: [] },
          ],
          labor: [
            { id: 'l3', description: 'Battery replacement and thermal service', hours: 2.5, rate: 550, technicianId: 't2', technicianName: 'Priya Naidoo', status: 'pending' },
          ],
          status: 'awaiting_parts',
          priority: 'normal',
          assignedTechnician: { id: 't2', name: 'Priya Naidoo', specialization: 'Laptops & Desktops', status: 'available', currentJobs: 1, completedToday: 3, certifications: ['Dell Certified', 'HP Certified'] },
          estimatedHours: 3,
          actualHours: 0,
          estimatedCost: 4325,
          actualCost: 0,
          startDate: '2026-02-15',
          targetDate: '2026-02-17',
          notes: 'Customer has AppleCare+ - check warranty claim options',
          createdAt: '2026-02-14T10:00:00',
          quotationId: 'Q-2026-002',
          quotationAmount: 4325,
          quotationStatus: 'pending',
        },
        {
          id: 'r3',
          jobNumber: 'REP-2026-003',
          device: {
            id: 'd3',
            serialNumber: 'PS5-456789',
            brand: 'Sony',
            model: 'PlayStation 5',
            category: 'gaming',
            customerId: 'cust-3',
            customerName: 'Michael Peters',
            customerPhone: '0845678901',
            customerEmail: 'mike.peters@email.com',
            purchaseDate: '2022-12-25',
            warrantyExpiry: '2024-12-25',
          },
          customerReport: 'Console makes loud noise and shuts down after 30 minutes of gaming',
          diagnosis: 'Fan failure causing overheating, thermal shutdown protection activating',
          issueFound: 'Cooling fan bearing failure, heatsink clogged with dust',
          solution: 'Replace cooling fan, clean heatsink and internal components',
          parts: [
            { id: 'p5', name: 'PS5 Cooling Fan Assembly', partNumber: 'PS5-FAN-OEM', category: 'other', quantity: 1, unitPrice: 1200, supplier: 'Sony Parts', inStock: false, compatibleModels: ['PlayStation 5'] },
          ],
          labor: [
            { id: 'l4', description: 'Fan replacement and cleaning', hours: 1.5, rate: 400, technicianId: 't3', technicianName: 'Johan van Wyk', status: 'pending' },
          ],
          status: 'awaiting_parts',
          priority: 'normal',
          assignedTechnician: { id: 't3', name: 'Johan van Wyk', specialization: 'Gaming & Audio', status: 'busy', currentJobs: 1, completedToday: 1, certifications: ['Sony Certified', 'Microsoft Certified'] },
          estimatedHours: 2,
          actualHours: 0,
          estimatedCost: 1800,
          actualCost: 0,
          startDate: '2026-02-15',
          targetDate: '2026-02-18',
          notes: 'Fan on backorder - ETA 3 days',
          createdAt: '2026-02-14T11:00:00',
        },
        {
          id: 'r4',
          jobNumber: 'REP-2026-004',
          device: {
            id: 'd4',
            serialNumber: 'GalaxyS24U-999',
            imei: '359987654321098',
            brand: 'Samsung',
            model: 'Galaxy S24 Ultra',
            category: 'smartphone',
            customerId: 'cust-4',
            customerName: 'Nomsa Dube',
            customerPhone: '0723456789',
            customerEmail: 'nomsa.dube@email.com',
            purchaseDate: '2024-02-01',
            warrantyExpiry: '2026-02-01',
            warrantyProvider: 'Samsung',
          },
          customerReport: 'Phone not charging properly, cable keeps falling out',
          diagnosis: 'Charging port debris and wear, port needs replacement',
          issueFound: 'USB-C port damaged from debris and wear',
          solution: 'Replace charging port board',
          parts: [
            { id: 'p6', name: 'S24 Ultra Charging Port Board', partNumber: 'S24U-PORT-OEM', category: 'port', quantity: 1, unitPrice: 650, supplier: 'Samsung Parts', inStock: true, compatibleModels: ['Galaxy S24 Ultra'] },
          ],
          labor: [
            { id: 'l5', description: 'Charging port replacement', hours: 0.75, rate: 450, technicianId: 't1', technicianName: 'Kagiso Molefe', status: 'completed' },
          ],
          status: 'testing',
          priority: 'normal',
          assignedTechnician: { id: 't1', name: 'Kagiso Molefe', specialization: 'Smartphones & Tablets', status: 'busy', currentJobs: 2, completedToday: 2, certifications: ['Apple Certified', 'Samsung Certified'] },
          estimatedHours: 1,
          actualHours: 0.75,
          estimatedCost: 987.50,
          actualCost: 987.50,
          startDate: '2026-02-14',
          targetDate: '2026-02-14',
          completedDate: '2026-02-14',
          notes: '',
          createdAt: '2026-02-14T09:00:00',
        },
      ])

      setPartsInventory([
        { id: 'pi1', name: 'iPhone 15 Pro Display Assembly', partNumber: 'IP15P-DISP-OEM', category: 'screen', quantity: 5, unitPrice: 4500, supplier: 'Apple Authorized', inStock: true, compatibleModels: ['iPhone 15 Pro'] },
        { id: 'pi2', name: 'iPhone 15 Pro Battery', partNumber: 'IP15P-BAT-OEM', category: 'battery', quantity: 8, unitPrice: 850, supplier: 'Apple Authorized', inStock: true, compatibleModels: ['iPhone 15 Pro'] },
        { id: 'pi3', name: 'MacBook Pro 14" Battery', partNumber: 'MBP14-BAT-M3', category: 'battery', quantity: 2, unitPrice: 2800, supplier: 'Apple Authorized', inStock: true, compatibleModels: ['MacBook Pro 14" M3'] },
        { id: 'pi4', name: 'Samsung S24 Ultra Screen', partNumber: 'S24U-DISP-OEM', category: 'screen', quantity: 3, unitPrice: 3800, supplier: 'Samsung Parts', inStock: true, compatibleModels: ['Galaxy S24 Ultra'] },
        { id: 'pi5', name: 'PS5 Cooling Fan Assembly', partNumber: 'PS5-FAN-OEM', category: 'other', quantity: 0, unitPrice: 1200, supplier: 'Sony Parts', inStock: false, compatibleModels: ['PlayStation 5'] },
        { id: 'pi6', name: 'USB-C Charging Port (Universal)', partNumber: 'USBC-PORT-UNI', category: 'port', quantity: 15, unitPrice: 180, supplier: 'Local Supplier', inStock: true, compatibleModels: [] },
        { id: 'pi7', name: 'Thermal Paste (Premium)', partNumber: 'TP-PRM-1G', category: 'other', quantity: 20, unitPrice: 150, supplier: 'Local Supplier', inStock: true, compatibleModels: [] },
        { id: 'pi8', name: 'SSD 1TB NVMe', partNumber: 'SSD-1TB-NVME', category: 'storage', quantity: 12, unitPrice: 1450, supplier: 'Local Supplier', inStock: true, compatibleModels: [] },
        { id: 'pi9', name: 'DDR5 16GB RAM', partNumber: 'RAM-DDR5-16', category: 'memory', quantity: 8, unitPrice: 950, supplier: 'Local Supplier', inStock: true, compatibleModels: [] },
        { id: 'pi10', name: 'HDMI Cable 2m', partNumber: 'HDMI-2M', category: 'cable', quantity: 3, unitPrice: 120, supplier: 'Local Supplier', inStock: true, compatibleModels: [] },
      ])

      setWarranties([
        {
          id: 'w1',
          warrantyNumber: 'WAR-2024-001',
          device: {
            id: 'd1',
            serialNumber: 'iPhone15Pro-123456',
            imei: '359123456789012',
            brand: 'Apple',
            model: 'iPhone 15 Pro',
            category: 'smartphone',
            customerId: 'cust-1',
            customerName: 'Thabo Mokoena',
            customerPhone: '0821234567',
            customerEmail: 'thabo.mokoena@email.com',
            purchaseDate: '2024-03-15',
            warrantyExpiry: '2025-03-15',
            warrantyProvider: 'Apple',
          },
          provider: 'Apple',
          planName: 'Apple Limited Warranty',
          startDate: '2024-03-15',
          endDate: '2025-03-15',
          coverageType: 'manufacturer',
          status: 'active',
          claimsCount: 0,
          maxClaims: 2,
          remainingCoverage: 28900,
        },
        {
          id: 'w2',
          warrantyNumber: 'WAR-2024-002',
          device: {
            id: 'd2',
            serialNumber: 'MacBookPro-M3-789',
            brand: 'Apple',
            model: 'MacBook Pro 14" M3',
            category: 'laptop',
            customerId: 'cust-2',
            customerName: 'Sarah van der Berg',
            customerPhone: '0839876543',
            customerEmail: 'sarah.vdb@email.com',
            purchaseDate: '2023-11-20',
            warrantyExpiry: '2026-11-20',
            warrantyProvider: 'AppleCare+',
          },
          provider: 'AppleCare+',
          planName: 'AppleCare+ for Mac',
          startDate: '2023-11-20',
          endDate: '2026-11-20',
          coverageType: 'extended',
          status: 'active',
          claimsCount: 1,
          maxClaims: 3,
          remainingCoverage: 45000,
        },
        {
          id: 'w3',
          warrantyNumber: 'WAR-2023-045',
          device: {
            id: 'd5',
            serialNumber: 'DellXPS15-123',
            brand: 'Dell',
            model: 'XPS 15 9520',
            category: 'laptop',
            customerId: 'cust-5',
            customerName: 'James Wilson',
            customerPhone: '0765432189',
            customerEmail: 'james.wilson@email.com',
            purchaseDate: '2023-01-15',
            warrantyExpiry: '2024-01-15',
          },
          provider: 'Dell',
          planName: 'Dell ProSupport',
          startDate: '2023-01-15',
          endDate: '2024-01-15',
          coverageType: 'manufacturer',
          status: 'expired',
          claimsCount: 2,
          maxClaims: 3,
          remainingCoverage: 0,
        },
      ])

      setWarrantyClaims([
        {
          id: 'wc1',
          claimNumber: 'CLM-2026-001',
          warrantyId: 'w2',
          warrantyNumber: 'WAR-2024-002',
          device: {
            id: 'd2',
            serialNumber: 'MacBookPro-M3-789',
            brand: 'Apple',
            model: 'MacBook Pro 14" M3',
            category: 'laptop',
            customerId: 'cust-2',
            customerName: 'Sarah van der Berg',
            customerPhone: '0839876543',
            customerEmail: 'sarah.vdb@email.com',
            purchaseDate: '2023-11-20',
          },
          issueDescription: 'Battery drain and overheating issues',
          claimDate: '2026-02-14',
          status: 'submitted',
        },
      ])

      setTradeIns([
        {
          id: 'ti1',
          tradeInNumber: 'TRD-2026-001',
          customerName: 'Amanda Ndaba',
          customerPhone: '0812345678',
          customerEmail: 'amanda.ndaba@email.com',
          deviceType: 'Smartphone',
          deviceBrand: 'Apple',
          deviceModel: 'iPhone 12 Pro',
          serialNumber: 'iPhone12P-OLD',
          imei: '359876543210987',
          condition: 'good',
          evaluationNotes: 'Minor scratches on frame, battery health 85%, all functions working',
          estimatedValue: 5500,
          offeredValue: 5000,
          status: 'evaluated',
          evaluatedBy: 'Kagiso Molefe',
          evaluationDate: '2026-02-14',
          createdAt: '2026-02-14T09:00:00',
        },
        {
          id: 'ti2',
          tradeInNumber: 'TRD-2026-002',
          customerName: 'Peter Mthembu',
          customerPhone: '0823456789',
          customerEmail: 'peter.mthembu@email.com',
          deviceType: 'Laptop',
          deviceBrand: 'Dell',
          deviceModel: 'XPS 13 9310',
          serialNumber: 'DellXPS13-OLD',
          condition: 'fair',
          evaluationNotes: 'Screen has minor burn-in, keyboard worn, SSD healthy, RAM 16GB',
          estimatedValue: 8000,
          offeredValue: 7000,
          status: 'pending_evaluation',
          createdAt: '2026-02-14T11:00:00',
        },
        {
          id: 'ti3',
          tradeInNumber: 'TRD-2026-003',
          customerName: 'Lindiwe Sithole',
          customerPhone: '0834567890',
          customerEmail: 'lindiwe.s@email.com',
          deviceType: 'Gaming Console',
          deviceBrand: 'Sony',
          deviceModel: 'PlayStation 4 Pro',
          serialNumber: 'PS4PRO-OLD',
          condition: 'excellent',
          evaluationNotes: 'Excellent condition, includes 2 controllers and original box',
          estimatedValue: 4500,
          offeredValue: 4200,
          finalValue: 4200,
          status: 'processed',
          evaluatedBy: 'Johan van Wyk',
          evaluationDate: '2026-02-13',
          createdAt: '2026-02-13T14:00:00',
          creditApplied: true,
          creditAppliedTo: 'INV-2026-0456',
        },
      ])

      setServiceContracts([
        {
          id: 'sc1',
          contractNumber: 'SVC-2024-001',
          customerId: 'cust-6',
          customerName: 'TechStart Solutions',
          customerPhone: '0115551234',
          customerEmail: 'support@techstart.co.za',
          planName: 'Business Premium',
          planType: 'premium',
          coveredDevices: [
            { id: 'cd1', serialNumber: 'LAPTOP-001', brand: 'Dell', model: 'Latitude 5540', category: 'laptop', customerId: 'cust-6', customerName: 'TechStart Solutions', customerPhone: '0115551234', customerEmail: 'support@techstart.co.za', purchaseDate: '2024-01-01' },
            { id: 'cd2', serialNumber: 'LAPTOP-002', brand: 'Dell', model: 'Latitude 5540', category: 'laptop', customerId: 'cust-6', customerName: 'TechStart Solutions', customerPhone: '0115551234', customerEmail: 'support@techstart.co.za', purchaseDate: '2024-01-01' },
            { id: 'cd3', serialNumber: 'LAPTOP-003', brand: 'Dell', model: 'Latitude 5540', category: 'laptop', customerId: 'cust-6', customerName: 'TechStart Solutions', customerPhone: '0115551234', customerEmail: 'support@techstart.co.za', purchaseDate: '2024-01-01' },
          ],
          startDate: '2024-01-01',
          endDate: '2025-12-31',
          monthlyFee: 2500,
          includedServices: ['Priority Repairs', 'On-site Support', 'Data Backup', 'Software Updates'],
          usageLimits: [
            { service: 'On-site visits', limit: 4, used: 2 },
            { service: 'Priority repairs', limit: 10, used: 5 },
            { service: 'Data recovery', limit: 2, used: 0 },
          ],
          status: 'active',
          autoRenew: true,
        },
        {
          id: 'sc2',
          contractNumber: 'SVC-2024-002',
          customerId: 'cust-7',
          customerName: 'Creative Studio SA',
          customerPhone: '0115559876',
          customerEmail: 'it@creativestudio.co.za',
          planName: 'Enterprise',
          planType: 'enterprise',
          coveredDevices: [
            { id: 'cd4', serialNumber: 'MAC-STUDIO-001', brand: 'Apple', model: 'Mac Studio', category: 'desktop', customerId: 'cust-7', customerName: 'Creative Studio SA', customerPhone: '0115559876', customerEmail: 'it@creativestudio.co.za', purchaseDate: '2024-03-01' },
            { id: 'cd5', serialNumber: 'IMAC-001', brand: 'Apple', model: 'iMac 27"', category: 'desktop', customerId: 'cust-7', customerName: 'Creative Studio SA', customerPhone: '0115559876', customerEmail: 'it@creativestudio.co.za', purchaseDate: '2024-03-01' },
          ],
          startDate: '2024-03-01',
          endDate: '2025-02-28',
          monthlyFee: 4500,
          includedServices: ['Unlimited Priority Repairs', 'On-site Support', 'Data Backup', 'Software Updates', 'Loaner Devices', '24/7 Support'],
          usageLimits: [
            { service: 'On-site visits', limit: -1, used: 8 },
            { service: 'Priority repairs', limit: -1, used: 12 },
            { service: 'Data recovery', limit: -1, used: 1 },
          ],
          status: 'pending_renewal',
          autoRenew: true,
        },
      ])

      setSupportTickets([
        {
          id: 'st1',
          ticketNumber: 'TKT-2026-001',
          customerId: 'cust-1',
          customerName: 'Thabo Mokoena',
          deviceId: 'd1',
          deviceInfo: 'iPhone 15 Pro',
          category: 'hardware',
          priority: 'high',
          subject: 'Screen replacement question',
          description: 'Customer asking about warranty coverage for screen replacement',
          status: 'resolved',
          assignedTo: 'Kagiso Molefe',
          createdAt: '2026-02-13T10:00:00',
          updatedAt: '2026-02-13T14:00:00',
          resolution: 'Explained warranty terms, customer opted for paid repair with genuine parts',
          contractId: undefined,
        },
        {
          id: 'st2',
          ticketNumber: 'TKT-2026-002',
          customerId: 'cust-6',
          customerName: 'TechStart Solutions',
          category: 'network',
          priority: 'urgent',
          subject: 'Multiple laptops not connecting to WiFi',
          description: '3 laptops showing limited connectivity after Windows update',
          status: 'in_progress',
          assignedTo: 'Priya Naidoo',
          createdAt: '2026-02-14T08:00:00',
          updatedAt: '2026-02-14T09:30:00',
          contractId: 'sc1',
        },
        {
          id: 'st3',
          ticketNumber: 'TKT-2026-003',
          customerId: 'cust-8',
          customerName: 'Bongani Khumalo',
          category: 'software',
          priority: 'normal',
          subject: 'Data recovery needed',
          description: 'Accidentally formatted external hard drive, need to recover photos',
          status: 'open',
          createdAt: '2026-02-14T11:00:00',
          updatedAt: '2026-02-14T11:00:00',
        },
      ])

      setCustomers([
        {
          id: 'cust-1',
          customerId: 'CUST-001',
          customerName: 'Thabo Mokoena',
          customerPhone: '0821234567',
          customerEmail: 'thabo.mokoena@email.com',
          devices: [
            { id: 'd1', serialNumber: 'iPhone15Pro-123456', imei: '359123456789012', brand: 'Apple', model: 'iPhone 15 Pro', category: 'smartphone', customerId: 'cust-1', customerName: 'Thabo Mokoena', customerPhone: '0821234567', customerEmail: 'thabo.mokoena@email.com', purchaseDate: '2024-03-15', warrantyExpiry: '2025-03-15', warrantyProvider: 'Apple' },
          ],
          repairs: [
            { id: 'r1', jobNumber: 'REP-2026-001', device: 'iPhone 15 Pro', date: '2026-02-14', cost: 6300, status: 'in_progress' },
            { id: 'r0', jobNumber: 'REP-2025-089', device: 'iPhone 13', date: '2025-08-15', cost: 2800, status: 'completed' },
          ],
          warranties: [
            { id: 'w1', warrantyNumber: 'WAR-2024-001', device: 'iPhone 15 Pro', status: 'active' },
          ],
          tradeIns: [],
          contracts: [],
          totalSpent: 9100,
          outstandingBalance: 0,
          lastVisit: '2026-02-14',
        },
        {
          id: 'cust-2',
          customerId: 'CUST-002',
          customerName: 'Sarah van der Berg',
          customerPhone: '0839876543',
          customerEmail: 'sarah.vdb@email.com',
          devices: [
            { id: 'd2', serialNumber: 'MacBookPro-M3-789', brand: 'Apple', model: 'MacBook Pro 14" M3', category: 'laptop', customerId: 'cust-2', customerName: 'Sarah van der Berg', customerPhone: '0839876543', customerEmail: 'sarah.vdb@email.com', purchaseDate: '2023-11-20', warrantyExpiry: '2026-11-20', warrantyProvider: 'AppleCare+' },
          ],
          repairs: [
            { id: 'r2', jobNumber: 'REP-2026-002', device: 'MacBook Pro 14"', date: '2026-02-14', cost: 4325, status: 'awaiting_parts' },
          ],
          warranties: [
            { id: 'w2', warrantyNumber: 'WAR-2024-002', device: 'MacBook Pro 14" M3', status: 'active' },
          ],
          tradeIns: [],
          contracts: [],
          totalSpent: 4325,
          outstandingBalance: 0,
          lastVisit: '2026-02-14',
        },
        {
          id: 'cust-6',
          customerId: 'CUST-006',
          customerName: 'TechStart Solutions',
          customerPhone: '0115551234',
          customerEmail: 'support@techstart.co.za',
          devices: [
            { id: 'cd1', serialNumber: 'LAPTOP-001', brand: 'Dell', model: 'Latitude 5540', category: 'laptop', customerId: 'cust-6', customerName: 'TechStart Solutions', customerPhone: '0115551234', customerEmail: 'support@techstart.co.za', purchaseDate: '2024-01-01' },
            { id: 'cd2', serialNumber: 'LAPTOP-002', brand: 'Dell', model: 'Latitude 5540', category: 'laptop', customerId: 'cust-6', customerName: 'TechStart Solutions', customerPhone: '0115551234', customerEmail: 'support@techstart.co.za', purchaseDate: '2024-01-01' },
          ],
          repairs: [
            { id: 'r5', jobNumber: 'REP-2025-145', device: 'Dell Latitude 5540', date: '2025-12-10', cost: 1850, status: 'completed' },
          ],
          warranties: [],
          tradeIns: [],
          contracts: [
            { id: 'sc1', contractNumber: 'SVC-2024-001', planName: 'Business Premium', status: 'active' },
          ],
          totalSpent: 30000,
          outstandingBalance: 0,
          lastVisit: '2026-02-14',
        },
      ])

      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Stats
  const stats = {
    activeRepairs: repairJobs.filter(j => !['completed', 'awaiting_collection', 'collected'].includes(j.status)).length,
    pending: repairJobs.filter(j => j.status === 'pending').length,
    inProgress: repairJobs.filter(j => j.status === 'in_progress').length,
    diagnosing: repairJobs.filter(j => j.status === 'diagnosing').length,
    awaitingParts: repairJobs.filter(j => j.status === 'awaiting_parts').length,
    testing: repairJobs.filter(j => j.status === 'testing').length,
    awaitingCollection: repairJobs.filter(j => j.status === 'awaiting_collection').length,
    completedToday: repairJobs.filter(j => j.status === 'completed' || j.status === 'testing').length,
    availableTechnicians: technicians.filter(t => t.status === 'available').length,
    totalTechnicians: technicians.length,
    estimatedRevenue: repairJobs.reduce((sum, j) => sum + j.estimatedCost, 0),
    lowStockParts: partsInventory.filter(p => p.quantity <= 3).length,
    activeWarranties: warranties.filter(w => w.status === 'active').length,
    expiringWarranties: warranties.filter(w => {
      const expiry = new Date(w.endDate)
      const now = new Date()
      const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0
    }).length,
    pendingTradeIns: tradeIns.filter(t => t.status === 'pending_evaluation' || t.status === 'evaluated').length,
    activeContracts: serviceContracts.filter(c => c.status === 'active').length,
    openTickets: supportTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length,
    pendingQuotations: repairJobs.filter(j => j.quotationStatus === 'pending').length,
  }

  const getStatusColor = (status: RepairStatus) => {
    const colors: Record<RepairStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      diagnosing: 'bg-blue-100 text-blue-700',
      awaiting_parts: 'bg-orange-100 text-orange-700',
      in_progress: 'bg-purple-100 text-purple-700',
      testing: 'bg-cyan-100 text-cyan-700',
      completed: 'bg-green-100 text-green-700',
      awaiting_collection: 'bg-teal-100 text-teal-700',
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

  const getDeviceIcon = (category: DeviceCategory) => {
    const icons: Record<DeviceCategory, typeof Smartphone> = {
      smartphone: Smartphone,
      laptop: Laptop,
      tablet: Tablet,
      desktop: Monitor,
      gaming: Gamepad,
      audio: Headphones,
      wearable: Watch,
      camera: Camera,
      tv: Tv,
      other: Cpu,
    }
    const Icon = icons[category] || Cpu
    return <Icon className="h-5 w-5 text-[#00897B]" />
  }

  const formatCurrency = (amount: number) => {
    return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
  }

  const getWarrantyStatusColor = (status: WarrantyStatus) => {
    const colors: Record<WarrantyStatus, string> = {
      active: 'bg-green-100 text-green-700',
      expired: 'bg-gray-100 text-gray-700',
      claim_in_progress: 'bg-yellow-100 text-yellow-700',
      claim_approved: 'bg-blue-100 text-blue-700',
      claim_rejected: 'bg-red-100 text-red-700',
    }
    return colors[status]
  }

  const getTradeInStatusColor = (status: TradeInStatus) => {
    const colors: Record<TradeInStatus, string> = {
      pending_evaluation: 'bg-yellow-100 text-yellow-700',
      evaluated: 'bg-blue-100 text-blue-700',
      accepted: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      processed: 'bg-gray-100 text-gray-700',
    }
    return colors[status]
  }

  const getConditionColor = (condition: TradeIn['condition']) => {
    const colors: Record<TradeIn['condition'], string> = {
      excellent: 'bg-green-100 text-green-700',
      good: 'bg-blue-100 text-blue-700',
      fair: 'bg-yellow-100 text-yellow-700',
      poor: 'bg-orange-100 text-orange-700',
      non_functional: 'bg-red-100 text-red-700',
    }
    return colors[condition]
  }

  const getTicketStatusColor = (status: SupportTicket['status']) => {
    const colors: Record<SupportTicket['status'], string> = {
      open: 'bg-red-100 text-red-700',
      in_progress: 'bg-blue-100 text-blue-700',
      waiting_customer: 'bg-yellow-100 text-yellow-700',
      waiting_parts: 'bg-orange-100 text-orange-700',
      resolved: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700',
    }
    return colors[status]
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
              <Cpu className="h-5 w-5 text-[#00897B]" />
              Electronics & Tech Services
            </h1>
            <p className="text-sm text-[#757575]">Device repairs, warranty management, trade-ins & service contracts</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-mono font-bold">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-xs text-[#757575]">{currentTime.toLocaleDateString()}</p>
            </div>

            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setNewRepairDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />New Repair Job
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-10 gap-2">
          <div className="bg-[#E0F2F1] rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-[#00897B]">{stats.activeRepairs}</p>
            <p className="text-[10px] text-[#757575]">Active Repairs</p>
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
            <p className="text-xl font-bold text-cyan-600">{stats.testing}</p>
            <p className="text-[10px] text-[#757575]">Testing</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-green-600">{stats.completedToday}</p>
            <p className="text-[10px] text-[#757575]">Completed</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-blue-600">{stats.availableTechnicians}/{stats.totalTechnicians}</p>
            <p className="text-[10px] text-[#757575]">Technicians</p>
          </div>
          <div className="bg-teal-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-teal-600">{stats.activeWarranties}</p>
            <p className="text-[10px] text-[#757575]">Warranties</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-amber-600">{stats.pendingTradeIns}</p>
            <p className="text-[10px] text-[#757575]">Trade-Ins</p>
          </div>
          <div className="bg-indigo-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-indigo-600">{stats.openTickets}</p>
            <p className="text-[10px] text-[#757575]">Open Tickets</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-green-600">{formatCurrency(stats.estimatedRevenue)}</p>
            <p className="text-[10px] text-[#757575]">Est. Revenue</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 flex flex-col min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="bg-white border-b border-gray-200 px-4">
            <TabsList className="bg-transparent h-12">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <BarChart3 className="h-4 w-4 mr-1" />Dashboard
              </TabsTrigger>
              <TabsTrigger value="repairs" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Wrench className="h-4 w-4 mr-1" />Repairs
              </TabsTrigger>
              <TabsTrigger value="inventory" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Package className="h-4 w-4 mr-1" />Inventory
              </TabsTrigger>
              <TabsTrigger value="warranties" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Shield className="h-4 w-4 mr-1" />Warranties
              </TabsTrigger>
              <TabsTrigger value="tradeins" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <ArrowLeftRight className="h-4 w-4 mr-1" />Trade-Ins
              </TabsTrigger>
              <TabsTrigger value="customers" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Users className="h-4 w-4 mr-1" />Customers
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-4">
            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="m-0">
              <div className="grid grid-cols-3 gap-4">
                {/* Active Repairs */}
                <Card className="col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-[#00897B]" />
                      Active Repairs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {repairJobs.filter(j => ['in_progress', 'diagnosing', 'testing'].includes(j.status)).map(job => (
                        <div 
                          key={job.id} 
                          className="flex items-center justify-between p-3 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors"
                          onClick={() => { setSelectedRepair(job); setRepairDetailDialogOpen(true); }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg">
                              {getDeviceIcon(job.device.category)}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{job.device.brand} {job.device.model}</p>
                              <p className="text-xs text-[#757575]">{job.jobNumber} | {job.device.serialNumber}</p>
                              <p className="text-xs text-[#757575]">Tech: {job.assignedTechnician.name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(job.status)}>{job.status.replace('_', ' ')}</Badge>
                            <p className="text-xs text-[#757575] mt-1">{job.actualHours}/{job.estimatedHours} hrs</p>
                            <p className="text-sm font-bold text-[#00897B]">{formatCurrency(job.estimatedCost)}</p>
                          </div>
                        </div>
                      ))}
                      {repairJobs.filter(j => ['in_progress', 'diagnosing', 'testing'].includes(j.status)).length === 0 && (
                        <p className="text-center text-sm text-[#757575] py-8">No active repairs</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Technician Status */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-5 w-5 text-[#00897B]" />
                      Technician Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {technicians.map(tech => (
                        <div key={tech.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              tech.status === 'available' ? 'bg-green-500' :
                              tech.status === 'busy' ? 'bg-orange-500' : 'bg-gray-400'
                            }`} />
                            <div>
                              <p className="font-medium text-sm">{tech.name}</p>
                              <p className="text-xs text-[#757575]">{tech.specialization}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">{tech.currentJobs} jobs</p>
                            <p className="text-xs text-green-600">{tech.completedToday} done</p>
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
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {repairJobs.filter(j => j.status === 'awaiting_parts').map(job => (
                        <div key={job.id} className="p-2 bg-orange-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{job.device.brand} {job.device.model}</p>
                              <p className="text-xs text-[#757575]">{job.jobNumber}</p>
                            </div>
                            <Badge className="bg-orange-100 text-orange-700">Waiting</Badge>
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
                      {repairJobs.filter(j => j.status === 'awaiting_parts').length === 0 && (
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
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {partsInventory.filter(p => p.quantity <= 3).map(part => (
                        <div key={part.id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{part.name}</p>
                            <p className="text-xs text-[#757575]">{part.partNumber}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-red-600">{part.quantity} left</p>
                            <Button size="sm" variant="outline" className="text-xs h-6">Reorder</Button>
                          </div>
                        </div>
                      ))}
                      {partsInventory.filter(p => p.quantity <= 3).length === 0 && (
                        <p className="text-center text-sm text-[#757575] py-4">All parts adequately stocked</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Pending Trade-Ins */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ArrowLeftRight className="h-5 w-5 text-[#00897B]" />
                      Pending Trade-Ins
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {tradeIns.filter(t => ['pending_evaluation', 'evaluated'].includes(t.status)).map(tradeIn => (
                        <div key={tradeIn.id} className="p-2 bg-amber-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{tradeIn.deviceBrand} {tradeIn.deviceModel}</p>
                              <p className="text-xs text-[#757575]">{tradeIn.customerName}</p>
                            </div>
                            <div className="text-right">
                              <Badge className={getTradeInStatusColor(tradeIn.status)}>
                                {tradeIn.status.replace('_', ' ')}
                              </Badge>
                              <p className="text-xs text-[#757575] mt-1">Est: {formatCurrency(tradeIn.estimatedValue)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {tradeIns.filter(t => ['pending_evaluation', 'evaluated'].includes(t.status)).length === 0 && (
                        <p className="text-center text-sm text-[#757575] py-4">No pending trade-ins</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Support Tickets */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Ticket className="h-5 w-5 text-[#00897B]" />
                      Open Support Tickets
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {supportTickets.filter(t => ['open', 'in_progress'].includes(t.status)).map(ticket => (
                        <div key={ticket.id} className="p-2 bg-blue-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{ticket.subject}</p>
                              <p className="text-xs text-[#757575]">{ticket.customerName}</p>
                              <p className="text-xs text-[#757575]">{ticket.ticketNumber}</p>
                            </div>
                            <div className="text-right">
                              <Badge className={getTicketStatusColor(ticket.status)}>{ticket.status}</Badge>
                              <Badge className={`ml-1 ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                      {supportTickets.filter(t => ['open', 'in_progress'].includes(t.status)).length === 0 && (
                        <p className="text-center text-sm text-[#757575] py-4">No open tickets</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Service Contracts */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileCheck className="h-5 w-5 text-[#00897B]" />
                      Service Contracts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {serviceContracts.filter(c => c.status === 'active' || c.status === 'pending_renewal').map(contract => (
                        <div key={contract.id} className={`p-3 rounded-lg ${contract.status === 'pending_renewal' ? 'bg-amber-50' : 'bg-green-50'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{contract.customerName}</p>
                              <p className="text-xs text-[#757575]">{contract.planName} - {contract.coveredDevices.length} devices</p>
                              <p className="text-xs text-[#757575]">{formatCurrency(contract.monthlyFee)}/month</p>
                            </div>
                            <div className="text-right">
                              <Badge className={contract.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                                {contract.status}
                              </Badge>
                              <p className="text-xs text-[#757575] mt-1">Ends: {contract.endDate}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="h-5 w-5 text-[#00897B]" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="h-auto py-3 flex flex-col items-center gap-1" onClick={() => setNewRepairDialogOpen(true)}>
                        <Wrench className="h-5 w-5 text-[#00897B]" />
                        <span className="text-xs">New Repair</span>
                      </Button>
                      <Button variant="outline" className="h-auto py-3 flex flex-col items-center gap-1" onClick={() => setTradeInDialogOpen(true)}>
                        <ArrowLeftRight className="h-5 w-5 text-[#00897B]" />
                        <span className="text-xs">Trade-In</span>
                      </Button>
                      <Button variant="outline" className="h-auto py-3 flex flex-col items-center gap-1" onClick={() => setNewQuotationDialogOpen(true)}>
                        <FileText className="h-5 w-5 text-[#00897B]" />
                        <span className="text-xs">Quotation</span>
                      </Button>
                      <Button variant="outline" className="h-auto py-3 flex flex-col items-center gap-1">
                        <Shield className="h-5 w-5 text-[#00897B]" />
                        <span className="text-xs">Warranty Claim</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Repairs Tab */}
            <TabsContent value="repairs" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Repair Jobs</h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search jobs, devices, serials..." className="pl-9 w-64" />
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="awaiting_parts">Awaiting Parts</SelectItem>
                      <SelectItem value="testing">Testing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setNewRepairDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />New Repair Job
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {repairJobs.map(job => (
                  <Card 
                    key={job.id} 
                    className="cursor-pointer hover:border-[#00897B] transition-colors"
                    onClick={() => { setSelectedRepair(job); setRepairDetailDialogOpen(true); }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-lg bg-[#E0F2F1]">
                            {getDeviceIcon(job.device.category)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold">{job.jobNumber}</p>
                              <Badge className={getStatusColor(job.status)}>{job.status.replace('_', ' ')}</Badge>
                              <Badge className={getPriorityColor(job.priority)}>{job.priority}</Badge>
                              {job.quotationStatus && (
                                <Badge variant="outline" className={
                                  job.quotationStatus === 'approved' ? 'border-green-500 text-green-600' :
                                  job.quotationStatus === 'rejected' ? 'border-red-500 text-red-600' :
                                  'border-yellow-500 text-yellow-600'
                                }>
                                  Quote: {job.quotationStatus}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium mt-1">{job.device.brand} {job.device.model}</p>
                            <p className="text-xs text-[#757575]">SN: {job.device.serialNumber} {job.device.imei && `| IMEI: ${job.device.imei}`}</p>
                            <p className="text-xs text-[#757575]">Customer: {job.device.customerName}</p>
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
                            <p className="font-medium">{job.assignedTechnician.name}</p>
                          </div>
                          <div>
                            <p className="text-[#757575]">Target Date</p>
                            <p className="font-medium">{job.targetDate}</p>
                          </div>
                          <div>
                            <p className="text-[#757575]">Contact</p>
                            <p className="font-medium">{job.device.customerPhone}</p>
                          </div>
                        </div>
                      </div>

                      {/* Parts & Labor Summary */}
                      <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium text-[#757575] mb-2">Parts ({job.parts.length})</p>
                          <div className="space-y-1">
                            {job.parts.map(part => (
                              <div key={part.id} className="flex justify-between text-xs">
                                <span>{part.name}</span>
                                <span className={part.inStock ? 'text-green-600' : 'text-orange-600'}>
                                  {formatCurrency(part.unitPrice * part.quantity)}
                                  {!part.inStock && ' (on order)'}
                                </span>
                              </div>
                            ))}
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

            {/* Inventory Tab */}
            <TabsContent value="inventory" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Parts & Device Inventory</h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search parts..." className="pl-9 w-64" />
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="screen">Screens</SelectItem>
                      <SelectItem value="battery">Batteries</SelectItem>
                      <SelectItem value="memory">Memory</SelectItem>
                      <SelectItem value="storage">Storage</SelectItem>
                      <SelectItem value="port">Ports</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="bg-[#00897B] hover:bg-[#00695C]">
                    <Plus className="h-4 w-4 mr-2" />Add Part
                  </Button>
                </div>
              </div>

              {/* Inventory Stats */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#E0F2F1] rounded-lg">
                        <Boxes className="h-5 w-5 text-[#00897B]" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{partsInventory.length}</p>
                        <p className="text-xs text-[#757575]">Total SKUs</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{partsInventory.filter(p => p.inStock && p.quantity > 3).length}</p>
                        <p className="text-xs text-[#757575]">In Stock</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-50 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-red-600">{stats.lowStockParts}</p>
                        <p className="text-xs text-[#757575]">Low Stock</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#E0F2F1] rounded-lg">
                        <CircleDollarSign className="h-5 w-5 text-[#00897B]" />
                      </div>
                      <div>
                        <p className="text-lg font-bold">{formatCurrency(partsInventory.reduce((sum, p) => sum + (p.unitPrice * p.quantity), 0))}</p>
                        <p className="text-xs text-[#757575]">Stock Value</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Parts List */}
              <Card>
                <CardHeader>
                  <CardTitle>Parts Inventory</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {partsInventory.map(part => (
                      <div key={part.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${part.quantity > 3 ? 'bg-green-100' : part.quantity > 0 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                            {part.category === 'screen' ? <Smartphone className={`h-4 w-4 ${part.quantity > 3 ? 'text-green-600' : part.quantity > 0 ? 'text-yellow-600' : 'text-red-600'}`} /> :
                             part.category === 'battery' ? <Battery className={`h-4 w-4 ${part.quantity > 3 ? 'text-green-600' : part.quantity > 0 ? 'text-yellow-600' : 'text-red-600'}`} /> :
                             part.category === 'storage' ? <HardDrive className={`h-4 w-4 ${part.quantity > 3 ? 'text-green-600' : part.quantity > 0 ? 'text-yellow-600' : 'text-red-600'}`} /> :
                             part.category === 'memory' ? <MemoryStick className={`h-4 w-4 ${part.quantity > 3 ? 'text-green-600' : part.quantity > 0 ? 'text-yellow-600' : 'text-red-600'}`} /> :
                             <Package className={`h-4 w-4 ${part.quantity > 3 ? 'text-green-600' : part.quantity > 0 ? 'text-yellow-600' : 'text-red-600'}`} />}
                          </div>
                          <div>
                            <p className="font-medium">{part.name}</p>
                            <p className="text-sm text-[#757575]">{part.partNumber} | {part.category}</p>
                            {part.compatibleModels.length > 0 && (
                              <p className="text-xs text-[#757575]">Compatible: {part.compatibleModels.join(', ')}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <div>
                            <p className="font-bold">{formatCurrency(part.unitPrice)}</p>
                            <p className="text-xs text-[#757575]">per unit</p>
                          </div>
                          <div className="w-20 text-center">
                            <p className={`text-lg font-bold ${part.quantity <= 3 ? 'text-red-600' : 'text-green-600'}`}>
                              {part.quantity}
                            </p>
                            <p className="text-xs text-[#757575]">in stock</p>
                          </div>
                          <Badge className={part.quantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                            {part.quantity > 0 ? 'Available' : 'Out of Stock'}
                          </Badge>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Warranties Tab */}
            <TabsContent value="warranties" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Warranty Management</h2>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />New Warranty Claim
                  </Button>
                  <Button className="bg-[#00897B] hover:bg-[#00695C]">
                    <Plus className="h-4 w-4 mr-2" />Register Warranty
                  </Button>
                </div>
              </div>

              {/* Warranty Stats */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <ShieldCheck className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">{stats.activeWarranties}</p>
                        <p className="text-xs text-[#757575]">Active Warranties</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-50 rounded-lg">
                        <Clock className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-amber-600">{stats.expiringWarranties}</p>
                        <p className="text-xs text-[#757575]">Expiring Soon</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-50 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{warrantyClaims.filter(c => c.status === 'submitted' || c.status === 'under_review').length}</p>
                        <p className="text-xs text-[#757575]">Pending Claims</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <FileText className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{warranties.length}</p>
                        <p className="text-xs text-[#757575]">Total Registered</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Active Warranties */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="h-5 w-5 text-[#00897B]" />
                      Registered Warranties
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {warranties.map(warranty => (
                        <div key={warranty.id} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-[#E0F2F1] rounded-lg">
                                {getDeviceIcon(warranty.device.category)}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{warranty.device.brand} {warranty.device.model}</p>
                                <p className="text-xs text-[#757575]">{warranty.warrantyNumber}</p>
                                <p className="text-xs text-[#757575]">Customer: {warranty.device.customerName}</p>
                              </div>
                            </div>
                            <Badge className={getWarrantyStatusColor(warranty.status)}>{warranty.status}</Badge>
                          </div>
                          <div className="mt-2 pt-2 border-t grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-[#757575]">Provider</p>
                              <p className="font-medium">{warranty.provider} - {warranty.planName}</p>
                            </div>
                            <div>
                              <p className="text-[#757575]">Valid Until</p>
                              <p className="font-medium">{warranty.endDate}</p>
                            </div>
                            <div>
                              <p className="text-[#757575]">Claims Used</p>
                              <p className="font-medium">{warranty.claimsCount}/{warranty.maxClaims}</p>
                            </div>
                            <div>
                              <p className="text-[#757575]">Coverage Left</p>
                              <p className="font-medium">{formatCurrency(warranty.remainingCoverage)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Warranty Claims */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileCheck className="h-5 w-5 text-[#00897B]" />
                      Warranty Claims
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {warrantyClaims.length > 0 ? warrantyClaims.map(claim => (
                        <div key={claim.id} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-sm">{claim.claimNumber}</p>
                              <p className="text-xs text-[#757575]">{claim.device.brand} {claim.device.model}</p>
                              <p className="text-xs text-[#757575]">Customer: {claim.device.customerName}</p>
                            </div>
                            <Badge className={
                              claim.status === 'approved' || claim.status === 'completed' ? 'bg-green-100 text-green-700' :
                              claim.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }>{claim.status}</Badge>
                          </div>
                          <div className="mt-2">
                            <p className="text-xs text-[#757575]">Issue:</p>
                            <p className="text-sm">{claim.issueDescription}</p>
                          </div>
                          <div className="mt-2 pt-2 border-t text-xs">
                            <p className="text-[#757575]">Submitted: {claim.claimDate}</p>
                            {claim.approvedAmount && <p className="text-green-600">Approved: {formatCurrency(claim.approvedAmount)}</p>}
                            {claim.rejectionReason && <p className="text-red-600">Reason: {claim.rejectionReason}</p>}
                          </div>
                        </div>
                      )) : (
                        <p className="text-center text-sm text-[#757575] py-8">No warranty claims</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Trade-Ins Tab */}
            <TabsContent value="tradeins" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Trade-In Program</h2>
                <div className="flex gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending_evaluation">Pending</SelectItem>
                      <SelectItem value="evaluated">Evaluated</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="processed">Processed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setTradeInDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />New Trade-In
                  </Button>
                </div>
              </div>

              {/* Trade-In Stats */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-50 rounded-lg">
                        <Clock className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{tradeIns.filter(t => t.status === 'pending_evaluation').length}</p>
                        <p className="text-xs text-[#757575]">Pending Evaluation</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Eye className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{tradeIns.filter(t => t.status === 'evaluated').length}</p>
                        <p className="text-xs text-[#757575]">Awaiting Decision</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{tradeIns.filter(t => t.status === 'processed').length}</p>
                        <p className="text-xs text-[#757575]">Processed Today</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#E0F2F1] rounded-lg">
                        <TrendingUp className="h-5 w-5 text-[#00897B]" />
                      </div>
                      <div>
                        <p className="text-lg font-bold">{formatCurrency(tradeIns.filter(t => t.status === 'processed').reduce((sum, t) => sum + (t.finalValue || 0), 0))}</p>
                        <p className="text-xs text-[#757575]">Total Trade-In Value</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Trade-In List */}
              <div className="grid grid-cols-2 gap-4">
                {tradeIns.map(tradeIn => (
                  <Card key={tradeIn.id} className={tradeIn.status === 'pending_evaluation' ? 'border-yellow-300' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-[#E0F2F1] rounded-lg">
                            <ArrowLeftRight className="h-5 w-5 text-[#00897B]" />
                          </div>
                          <div>
                            <p className="font-bold">{tradeIn.tradeInNumber}</p>
                            <p className="text-sm font-medium">{tradeIn.deviceBrand} {tradeIn.deviceModel}</p>
                            <p className="text-xs text-[#757575]">{tradeIn.deviceType}</p>
                            {tradeIn.serialNumber && (
                              <p className="text-xs text-[#757575]">SN: {tradeIn.serialNumber}</p>
                            )}
                          </div>
                        </div>
                        <Badge className={getTradeInStatusColor(tradeIn.status)}>
                          {tradeIn.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-[#757575]" />
                          <p className="text-sm">{tradeIn.customerName}</p>
                          <Phone className="h-4 w-4 text-[#757575] ml-2" />
                          <p className="text-sm">{tradeIn.customerPhone}</p>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getConditionColor(tradeIn.condition)}>{tradeIn.condition}</Badge>
                        </div>
                        <p className="text-xs text-[#757575] mb-2">{tradeIn.evaluationNotes}</p>
                      </div>

                      <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-xs text-[#757575]">Est. Value</p>
                          <p className="font-bold">{formatCurrency(tradeIn.estimatedValue)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#757575]">Offered</p>
                          <p className="font-bold text-[#00897B]">{formatCurrency(tradeIn.offeredValue)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#757575]">Final</p>
                          <p className="font-bold text-green-600">{tradeIn.finalValue ? formatCurrency(tradeIn.finalValue) : '-'}</p>
                        </div>
                      </div>

                      {tradeIn.status === 'pending_evaluation' && (
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" className="flex-1 bg-[#00897B] hover:bg-[#00695C]">
                            Evaluate
                          </Button>
                        </div>
                      )}
                      {tradeIn.status === 'evaluated' && (
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1 text-red-600 border-red-300">
                            Reject
                          </Button>
                          <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                            Accept
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Customers Tab */}
            <TabsContent value="customers" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Customer Device History</h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search customers..." className="pl-9 w-64" />
                  </div>
                  <Button className="bg-[#00897B] hover:bg-[#00695C]">
                    <Plus className="h-4 w-4 mr-2" />Add Customer
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {customers.map(customer => (
                  <Card key={customer.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-[#E0F2F1] flex items-center justify-center">
                            <User className="h-6 w-6 text-[#00897B]" />
                          </div>
                          <div>
                            <p className="font-bold text-lg">{customer.customerName}</p>
                            <div className="flex items-center gap-4 text-sm text-[#757575]">
                              <span className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />{customer.customerPhone}
                              </span>
                              <span className="flex items-center gap-1">
                                <Mail className="h-4 w-4" />{customer.customerEmail}
                              </span>
                            </div>
                            <p className="text-xs text-[#757575] mt-1">Last visit: {customer.lastVisit}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#00897B]">{formatCurrency(customer.totalSpent)}</p>
                          <p className="text-xs text-[#757575]">Total spent</p>
                          {customer.outstandingBalance > 0 && (
                            <p className="text-sm text-red-600 font-medium">{formatCurrency(customer.outstandingBalance)} outstanding</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t grid grid-cols-4 gap-4">
                        {/* Devices */}
                        <div>
                          <p className="text-xs font-medium text-[#757575] mb-2 flex items-center gap-1">
                            <Cpu className="h-3 w-3" />Devices ({customer.devices.length})
                          </p>
                          <div className="space-y-1">
                            {customer.devices.map(device => (
                              <div key={device.id} className="flex items-center gap-2 p-1 bg-gray-50 rounded text-xs">
                                {getDeviceIcon(device.category)}
                                <span>{device.brand} {device.model}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Repairs */}
                        <div>
                          <p className="text-xs font-medium text-[#757575] mb-2 flex items-center gap-1">
                            <Wrench className="h-3 w-3" />Repairs ({customer.repairs.length})
                          </p>
                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {customer.repairs.map(repair => (
                              <div key={repair.id} className="p-1 bg-gray-50 rounded text-xs">
                                <p className="font-medium">{repair.jobNumber}</p>
                                <p className="text-[#757575]">{repair.device} - {formatCurrency(repair.cost)}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Warranties */}
                        <div>
                          <p className="text-xs font-medium text-[#757575] mb-2 flex items-center gap-1">
                            <Shield className="h-3 w-3" />Warranties ({customer.warranties.length})
                          </p>
                          <div className="space-y-1">
                            {customer.warranties.map(warranty => (
                              <div key={warranty.id} className="p-1 bg-gray-50 rounded text-xs">
                                <p className="font-medium">{warranty.warrantyNumber}</p>
                                <p className="text-[#757575]">{warranty.device}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Contracts */}
                        <div>
                          <p className="text-xs font-medium text-[#757575] mb-2 flex items-center gap-1">
                            <FileCheck className="h-3 w-3" />Contracts ({customer.contracts.length})
                          </p>
                          <div className="space-y-1">
                            {customer.contracts.map(contract => (
                              <div key={contract.id} className="p-1 bg-gray-50 rounded text-xs">
                                <p className="font-medium">{contract.contractNumber}</p>
                                <p className="text-[#757575]">{contract.planName}</p>
                              </div>
                            ))}
                            {customer.contracts.length === 0 && (
                              <p className="text-xs text-[#757575]">No contracts</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />View Full History
                        </Button>
                        <Button size="sm" variant="outline">
                          <Plus className="h-4 w-4 mr-1" />New Repair
                        </Button>
                        <Button size="sm" variant="outline">
                          <FileText className="h-4 w-4 mr-1" />Create Quote
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>

      {/* New Repair Dialog */}
      <Dialog open={newRepairDialogOpen} onOpenChange={setNewRepairDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-[#00897B]" />
              Create New Repair Job
            </DialogTitle>
            <DialogDescription>
              Enter device and customer details to create a new repair job
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Customer Information */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Customer Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input id="customerName" placeholder="Full name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Phone Number</Label>
                  <Input id="customerPhone" placeholder="e.g., 0821234567" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email</Label>
                <Input id="customerEmail" type="email" placeholder="email@example.com" />
              </div>
            </div>

            <Separator />

            {/* Device Information */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Device Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deviceCategory">Device Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="smartphone">Smartphone</SelectItem>
                      <SelectItem value="laptop">Laptop</SelectItem>
                      <SelectItem value="tablet">Tablet</SelectItem>
                      <SelectItem value="desktop">Desktop</SelectItem>
                      <SelectItem value="gaming">Gaming Console</SelectItem>
                      <SelectItem value="audio">Audio Equipment</SelectItem>
                      <SelectItem value="wearable">Wearable</SelectItem>
                      <SelectItem value="camera">Camera</SelectItem>
                      <SelectItem value="tv">TV</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deviceBrand">Brand</Label>
                  <Input id="deviceBrand" placeholder="e.g., Apple, Samsung, Dell" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deviceModel">Model</Label>
                  <Input id="deviceModel" placeholder="e.g., iPhone 15 Pro" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input id="serialNumber" placeholder="Device serial number" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="imei">IMEI (if applicable)</Label>
                <Input id="imei" placeholder="IMEI number for mobile devices" />
              </div>
            </div>

            <Separator />

            {/* Repair Details */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Repair Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="technician">Assign Technician</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select technician" />
                    </SelectTrigger>
                    <SelectContent>
                      {technicians.map(tech => (
                        <SelectItem key={tech.id} value={tech.id}>
                          {tech.name} - {tech.specialization}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerReport">Customer Report / Issue Description</Label>
                <Textarea id="customerReport" placeholder="Describe the issue reported by customer..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea id="notes" placeholder="Any additional notes..." rows={2} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNewRepairDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setNewRepairDialogOpen(false)}>
              <Plus className="h-4 w-4 mr-2" />Create Repair Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Repair Detail Dialog */}
      <Dialog open={repairDetailDialogOpen} onOpenChange={setRepairDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedRepair && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getDeviceIcon(selectedRepair.device.category)}
                  {selectedRepair.jobNumber} - {selectedRepair.device.brand} {selectedRepair.device.model}
                </DialogTitle>
                <DialogDescription>
                  Repair details and progress tracking
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Status and Priority */}
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(selectedRepair.status)}>{selectedRepair.status.replace('_', ' ')}</Badge>
                  <Badge className={getPriorityColor(selectedRepair.priority)}>{selectedRepair.priority}</Badge>
                  {selectedRepair.quotationStatus && (
                    <Badge variant="outline">Quote: {selectedRepair.quotationStatus}</Badge>
                  )}
                </div>

                {/* Device Info */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Device Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-[#757575]">Serial Number</p>
                      <p className="font-medium">{selectedRepair.device.serialNumber}</p>
                    </div>
                    {selectedRepair.device.imei && (
                      <div>
                        <p className="text-[#757575]">IMEI</p>
                        <p className="font-medium">{selectedRepair.device.imei}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[#757575]">Category</p>
                      <p className="font-medium capitalize">{selectedRepair.device.category}</p>
                    </div>
                    <div>
                      <p className="text-[#757575]">Purchase Date</p>
                      <p className="font-medium">{selectedRepair.device.purchaseDate}</p>
                    </div>
                    {selectedRepair.device.warrantyExpiry && (
                      <div>
                        <p className="text-[#757575]">Warranty Expiry</p>
                        <p className="font-medium">{selectedRepair.device.warrantyExpiry}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Customer Info */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-[#757575]">Name</p>
                      <p className="font-medium">{selectedRepair.device.customerName}</p>
                    </div>
                    <div>
                      <p className="text-[#757575]">Phone</p>
                      <p className="font-medium">{selectedRepair.device.customerPhone}</p>
                    </div>
                    <div>
                      <p className="text-[#757575]">Email</p>
                      <p className="font-medium">{selectedRepair.device.customerEmail}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Repair Details */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Repair Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-[#757575] text-xs">Customer Report</p>
                      <p className="text-sm">{selectedRepair.customerReport}</p>
                    </div>
                    <div>
                      <p className="text-[#757575] text-xs">Diagnosis</p>
                      <p className="text-sm">{selectedRepair.diagnosis}</p>
                    </div>
                    <div>
                      <p className="text-[#757575] text-xs">Issue Found</p>
                      <p className="text-sm">{selectedRepair.issueFound}</p>
                    </div>
                    <div>
                      <p className="text-[#757575] text-xs">Solution</p>
                      <p className="text-sm">{selectedRepair.solution}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Parts */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Parts Used</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedRepair.parts.map(part => (
                        <div key={part.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                          <div>
                            <p className="font-medium">{part.name}</p>
                            <p className="text-xs text-[#757575]">{part.partNumber}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(part.unitPrice * part.quantity)}</p>
                            <Badge className={part.inStock ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}>
                              {part.inStock ? 'In Stock' : 'On Order'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Labor */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Labor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedRepair.labor.map(labor => (
                        <div key={labor.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                          <div>
                            <p className="font-medium">{labor.description}</p>
                            <p className="text-xs text-[#757575]">By: {labor.technicianName}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{labor.hours}h @ {formatCurrency(labor.rate)}/hr</p>
                            <p className="text-xs font-bold">{formatCurrency(labor.hours * labor.rate)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Cost Summary */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Cost Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Parts:</span>
                        <span>{formatCurrency(selectedRepair.parts.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0))}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Labor:</span>
                        <span>{formatCurrency(selectedRepair.labor.reduce((sum, l) => sum + l.hours * l.rate, 0))}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold">
                        <span>Total Estimated:</span>
                        <span className="text-[#00897B]">{formatCurrency(selectedRepair.estimatedCost)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={() => setRepairDetailDialogOpen(false)}>
                  Close
                </Button>
                <Button variant="outline">
                  <Printer className="h-4 w-4 mr-2" />Print Job Card
                </Button>
                <Button className="bg-[#00897B] hover:bg-[#00695C]">
                  <Edit className="h-4 w-4 mr-2" />Update Status
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New Trade-In Dialog */}
      <Dialog open={tradeInDialogOpen} onOpenChange={setTradeInDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-[#00897B]" />
              New Trade-In
            </DialogTitle>
            <DialogDescription>
              Register a new device for trade-in evaluation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tiCustomerName">Customer Name</Label>
                <Input id="tiCustomerName" placeholder="Full name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tiCustomerPhone">Phone Number</Label>
                <Input id="tiCustomerPhone" placeholder="Phone number" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiCustomerEmail">Email</Label>
              <Input id="tiCustomerEmail" type="email" placeholder="Email address" />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tiDeviceType">Device Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="smartphone">Smartphone</SelectItem>
                    <SelectItem value="laptop">Laptop</SelectItem>
                    <SelectItem value="tablet">Tablet</SelectItem>
                    <SelectItem value="gaming">Gaming Console</SelectItem>
                    <SelectItem value="wearable">Wearable</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tiBrand">Brand</Label>
                <Input id="tiBrand" placeholder="Device brand" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tiModel">Model</Label>
                <Input id="tiModel" placeholder="Device model" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tiCondition">Condition</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="non_functional">Non-Functional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiSerial">Serial Number (if available)</Label>
              <Input id="tiSerial" placeholder="Serial number or IMEI" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTradeInDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setTradeInDialogOpen(false)}>
              <Plus className="h-4 w-4 mr-2" />Create Trade-In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Quotation Dialog */}
      <Dialog open={newQuotationDialogOpen} onOpenChange={setNewQuotationDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#00897B]" />
              Create Quotation
            </DialogTitle>
            <DialogDescription>
              Generate a repair quotation for customer approval
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Repair Job</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select pending repair job" />
                </SelectTrigger>
                <SelectContent>
                  {repairJobs.filter(j => !j.quotationStatus || j.quotationStatus === 'pending').map(job => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.jobNumber} - {job.device.brand} {job.device.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Quotation Items</Label>
              <div className="p-4 border rounded-lg bg-gray-50">
                <p className="text-sm text-[#757575]">Select a repair job to view items</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validUntil">Valid Until</Label>
                <Input id="validUntil" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">Discount (%)</Label>
                <Input id="discount" type="number" placeholder="0" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quoteNotes">Notes</Label>
              <Textarea id="quoteNotes" placeholder="Additional notes for the quotation..." rows={2} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNewQuotationDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />Save Draft
            </Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">
              <Printer className="h-4 w-4 mr-2" />Generate Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
