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
  Heart,
  Calendar,
  Users,
  FileText,
  DollarSign,
  Clock,
  MapPin,
  Phone,
  Mail,
  Car,
  Music,
  Flower2,
  Church,
  Building2,
  CreditCard,
  Banknote,
  Receipt,
  Plus,
  Search,
  Download,
  Printer,
  RefreshCw,
  Eye,
  Edit,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ClipboardList,
  Wallet,
  UserCheck,
  Archive,
  Scale,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'

// Types specific to Funeral Services
type FuneralStatus = 'pending' | 'planning' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
type PaymentPlanStatus = 'active' | 'completed' | 'defaulted' | 'pending'

interface DeceasedRecord {
  id: string
  fullName: string
  idNumber: string
  dateOfBirth: string
  dateOfDeath: string
  placeOfDeath: string
  causeOfDeath: string
  nextOfKin: string
  nextOfKinPhone: string
  nextOfKinRelation: string
  status: 'collected' | 'in_care' | 'released'
  collectedAt?: string
  releasedAt?: string
}

interface FuneralPackage {
  id: string
  name: string
  description: string
  basePrice: number
  items: PackageItem[]
  isCustom: boolean
}

interface PackageItem {
  id: string
  name: string
  category: 'transport' | 'casket' | 'flowers' | 'music' | 'venue' | 'catering' | 'documentation' | 'other'
  price: number
  included: boolean
}

interface FuneralCase {
  id: string
  caseNumber: string
  deceased: DeceasedRecord
  familyContact: {
    name: string
    phone: string
    email: string
    address: string
  }
  package: FuneralPackage
  customizations: PackageItem[]
  totalCost: number
  paidAmount: number
  balance: number
  paymentPlan?: PaymentPlan
  status: FuneralStatus
  serviceDate: string
  serviceTime: string
  venue: string
  pastorOfficiant: string
  notes: string
  createdAt: string
  documents: DocumentRecord[]
}

interface PaymentPlan {
  id: string
  totalAmount: number
  depositAmount: number
  depositPaid: boolean
  installments: number
  installmentAmount: number
  frequency: 'weekly' | 'biweekly' | 'monthly'
  nextPaymentDate: string
  paymentsMade: number
  status: PaymentPlanStatus
}

interface DocumentRecord {
  id: string
  name: string
  type: 'death_certificate' | 'burial_order' | 'id_copy' | 'police_report' | 'medical_certificate' | 'other'
  status: 'pending' | 'uploaded' | 'verified'
  uploadedAt?: string
}

interface ComplianceRecord {
  id: string
  category: 'burial_order' | 'health_certificate' | 'transport_permit' | 'cremation_permit'
  description: string
  required: boolean
  obtained: boolean
  expiryDate?: string
}

export function FuneralServicesView() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Data states
  const [cases, setCases] = useState<FuneralCase[]>([])
  const [packages, setPackages] = useState<FuneralPackage[]>([])
  const [complianceItems, setComplianceItems] = useState<ComplianceRecord[]>([])

  // Dialog states
  const [newCaseDialogOpen, setNewCaseDialogOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedCase, setSelectedCase] = useState<FuneralCase | null>(null)

  // Update time
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Mock data
  useEffect(() => {
    const timer = setTimeout(() => {
      setPackages([
        {
          id: 'pkg-1',
          name: 'Basic Funeral Package',
          description: 'Essential funeral services for dignified farewell',
          basePrice: 15000,
          isCustom: false,
          items: [
            { id: 'i1', name: 'Basic Casket', category: 'casket', price: 5000, included: true },
            { id: 'i2', name: 'Hearse Transport', category: 'transport', price: 2500, included: true },
            { id: 'i3', name: 'Family Car', category: 'transport', price: 1500, included: true },
            { id: 'i4', name: 'Basic Flowers', category: 'flowers', price: 2000, included: true },
            { id: 'i5', name: 'Program Cards (50)', category: 'documentation', price: 500, included: true },
          ]
        },
        {
          id: 'pkg-2',
          name: 'Standard Funeral Package',
          description: 'Complete funeral service with additional amenities',
          basePrice: 25000,
          isCustom: false,
          items: [
            { id: 'i1', name: 'Premium Casket', category: 'casket', price: 8000, included: true },
            { id: 'i2', name: 'Hearse Transport', category: 'transport', price: 2500, included: true },
            { id: 'i3', name: 'Family Cars (2)', category: 'transport', price: 3000, included: true },
            { id: 'i4', name: 'Premium Flowers', category: 'flowers', price: 4000, included: true },
            { id: 'i5', name: 'Program Cards (100)', category: 'documentation', price: 800, included: true },
            { id: 'i6', name: 'PA System', category: 'music', price: 1500, included: true },
          ]
        },
        {
          id: 'pkg-3',
          name: 'Premium Funeral Package',
          description: 'Comprehensive funeral service with all amenities',
          basePrice: 45000,
          isCustom: false,
          items: [
            { id: 'i1', name: 'Luxury Casket', category: 'casket', price: 15000, included: true },
            { id: 'i2', name: 'Hearse & Motorcycle Escort', category: 'transport', price: 5000, included: true },
            { id: 'i3', name: 'Family Cars (3)', category: 'transport', price: 4500, included: true },
            { id: 'i4', name: 'Luxury Flower Arrangement', category: 'flowers', price: 8000, included: true },
            { id: 'i5', name: 'Premium Programs & Bookmarks', category: 'documentation', price: 2000, included: true },
            { id: 'i6', name: 'Live Band', category: 'music', price: 5000, included: true },
            { id: 'i7', name: 'Catering (100 pax)', category: 'catering', price: 10000, included: true },
          ]
        },
      ])

      setCases([
        {
          id: 'case-1',
          caseNumber: 'FUN-2026-001',
          deceased: {
            id: 'dec-1',
            fullName: 'Johannes Mokoena',
            idNumber: '1950081560871',
            dateOfBirth: '1950-08-15',
            dateOfDeath: '2026-02-10',
            placeOfDeath: 'Johannesburg General Hospital',
            causeOfDeath: 'Natural causes',
            nextOfKin: 'Thandi Mokoena',
            nextOfKinPhone: '0821234567',
            nextOfKinRelation: 'Wife',
            status: 'in_care'
          },
          familyContact: {
            name: 'Thandi Mokoena',
            phone: '0821234567',
            email: 'tmokoena@email.com',
            address: '123 Soweto Street, Soweto, 1804'
          },
          package: {
            id: 'pkg-2',
            name: 'Standard Funeral Package',
            description: 'Complete funeral service',
            basePrice: 25000,
            isCustom: false,
            items: []
          },
          customizations: [
            { id: 'c1', name: 'Extra Family Car', category: 'transport', price: 1500, included: true }
          ],
          totalCost: 26500,
          paidAmount: 15000,
          balance: 11500,
          paymentPlan: {
            id: 'pp-1',
            totalAmount: 11500,
            depositAmount: 5000,
            depositPaid: false,
            installments: 4,
            installmentAmount: 2875,
            frequency: 'monthly',
            nextPaymentDate: '2026-03-01',
            paymentsMade: 0,
            status: 'active'
          },
          status: 'planning',
          serviceDate: '2026-02-17',
          serviceTime: '08:00',
          venue: 'Grace Bible Church, Soweto',
          pastorOfficiant: 'Pastor David Sithole',
          notes: 'Family requests traditional hymns only',
          createdAt: '2026-02-11T10:00:00',
          documents: [
            { id: 'd1', name: 'Death Certificate', type: 'death_certificate', status: 'verified', uploadedAt: '2026-02-12' },
            { id: 'd2', name: 'Burial Order', type: 'burial_order', status: 'pending' },
          ]
        },
        {
          id: 'case-2',
          caseNumber: 'FUN-2026-002',
          deceased: {
            id: 'dec-2',
            fullName: 'Maria Nkosi',
            idNumber: '1965032154082',
            dateOfBirth: '1965-03-21',
            dateOfDeath: '2026-02-12',
            placeOfDeath: 'Chris Hani Baragwanath Hospital',
            causeOfDeath: 'Illness',
            nextOfKin: 'Sipho Nkosi',
            nextOfKinPhone: '0839876543',
            nextOfKinRelation: 'Son',
            status: 'collected'
          },
          familyContact: {
            name: 'Sipho Nkosi',
            phone: '0839876543',
            email: 'snkosi@email.com',
            address: '456 Diepkloof Zone 3, Soweto, 1864'
          },
          package: {
            id: 'pkg-3',
            name: 'Premium Funeral Package',
            description: 'Comprehensive funeral service',
            basePrice: 45000,
            isCustom: false,
            items: []
          },
          customizations: [],
          totalCost: 45000,
          paidAmount: 45000,
          balance: 0,
          status: 'confirmed',
          serviceDate: '2026-02-18',
          serviceTime: '09:00',
          venue: 'Regina Mundi Church, Rockville',
          pastorOfficiant: 'Bishop Peter Mahlangu',
          notes: 'Family choir will perform, catering for 150 guests',
          createdAt: '2026-02-13T14:00:00',
          documents: [
            { id: 'd1', name: 'Death Certificate', type: 'death_certificate', status: 'verified', uploadedAt: '2026-02-13' },
            { id: 'd2', name: 'Burial Order', type: 'burial_order', status: 'verified', uploadedAt: '2026-02-13' },
          ]
        },
      ])

      setComplianceItems([
        { id: 'comp-1', category: 'burial_order', description: 'Municipal Burial Order', required: true, obtained: true },
        { id: 'comp-2', category: 'health_certificate', description: 'Health Department Certificate', required: true, obtained: true },
        { id: 'comp-3', category: 'transport_permit', description: 'Cross-border Transport Permit', required: false, obtained: false },
        { id: 'comp-4', category: 'cremation_permit', description: 'Cremation Authorization', required: false, obtained: false },
      ])

      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Stats
  const stats = {
    activeCases: cases.filter(c => !['completed', 'cancelled'].includes(c.status)).length,
    planning: cases.filter(c => c.status === 'planning').length,
    confirmed: cases.filter(c => c.status === 'confirmed').length,
    completed: cases.filter(c => c.status === 'completed').length,
    totalRevenue: cases.reduce((sum, c) => sum + c.totalCost, 0),
    collectedPayments: cases.reduce((sum, c) => sum + c.paidAmount, 0),
    outstandingBalance: cases.reduce((sum, c) => sum + c.balance, 0),
    complianceComplete: complianceItems.filter(i => i.required && i.obtained).length,
    compliancePending: complianceItems.filter(i => i.required && !i.obtained).length,
  }

  const getStatusColor = (status: FuneralStatus) => {
    const colors: Record<FuneralStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      planning: 'bg-blue-100 text-blue-700',
      confirmed: 'bg-green-100 text-green-700',
      in_progress: 'bg-orange-100 text-orange-700',
      completed: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700',
    }
    return colors[status]
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
              <Heart className="h-5 w-5 text-[#00897B]" />
              Funeral Services Management
            </h1>
            <p className="text-sm text-[#757575]">Package builder, payment plans, compliance & case management</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-mono font-bold">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-xs text-[#757575]">{currentTime.toLocaleDateString()}</p>
            </div>

            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setNewCaseDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />New Case
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-8 gap-3">
          <div className="bg-[#E0F2F1] rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-[#00897B]">{stats.activeCases}</p>
            <p className="text-[10px] text-[#757575]">Active Cases</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-blue-600">{stats.planning}</p>
            <p className="text-[10px] text-[#757575]">Planning</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-green-600">{stats.confirmed}</p>
            <p className="text-[10px] text-[#757575]">Confirmed</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-purple-600">{formatCurrency(stats.collectedPayments)}</p>
            <p className="text-[10px] text-[#757575]">Collected</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-orange-600">{formatCurrency(stats.outstandingBalance)}</p>
            <p className="text-[10px] text-[#757575]">Outstanding</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-amber-600">{stats.compliancePending}</p>
            <p className="text-[10px] text-[#757575]">Compliance Due</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-green-600">{stats.complianceComplete}</p>
            <p className="text-[10px] text-[#757575]">Compliance OK</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-gray-600">{stats.completed}</p>
            <p className="text-[10px] text-[#757575]">Completed</p>
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
              <TabsTrigger value="cases" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <ClipboardList className="h-4 w-4 mr-1" />Cases
              </TabsTrigger>
              <TabsTrigger value="packages" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Archive className="h-4 w-4 mr-1" />Packages
              </TabsTrigger>
              <TabsTrigger value="payments" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Wallet className="h-4 w-4 mr-1" />Payment Plans
              </TabsTrigger>
              <TabsTrigger value="compliance" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <ShieldCheck className="h-4 w-4 mr-1" />Compliance
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-4">
            {/* Overview Tab */}
            <TabsContent value="overview" className="m-0">
              <div className="grid grid-cols-2 gap-4">
                {/* Upcoming Services */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-[#00897B]" />
                      Upcoming Services
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {cases.filter(c => ['planning', 'confirmed'].includes(c.status)).map(funeralCase => (
                        <div key={funeralCase.id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{funeralCase.deceased.fullName}</p>
                            <p className="text-xs text-[#757575]">{funeralCase.serviceDate} at {funeralCase.serviceTime}</p>
                            <p className="text-xs text-[#757575]">{funeralCase.venue}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(funeralCase.status)}>
                              {funeralCase.status}
                            </Badge>
                            <p className="text-xs text-[#757575] mt-1">{funeralCase.caseNumber}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Plans Alert */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-[#00897B]" />
                      Active Payment Plans
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {cases.filter(c => c.paymentPlan && c.balance > 0).map(funeralCase => (
                        <div key={funeralCase.id} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{funeralCase.deceased.fullName}</p>
                            <p className="text-xs text-[#757575]">Next payment: {funeralCase.paymentPlan?.nextPaymentDate}</p>
                            <p className="text-xs text-[#757575]">
                              {funeralCase.paymentPlan?.paymentsMade}/{funeralCase.paymentPlan?.installments} installments
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-orange-600">{formatCurrency(funeralCase.balance)}</p>
                            <Button size="sm" className="mt-1 bg-[#00897B] hover:bg-[#00695C]">
                              Record Payment
                            </Button>
                          </div>
                        </div>
                      ))}
                      {cases.filter(c => c.paymentPlan && c.balance > 0).length === 0 && (
                        <p className="text-center text-sm text-[#757575] py-4">No active payment plans</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Documents Pending */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-5 w-5 text-[#00897B]" />
                      Pending Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {cases.flatMap(c => c.documents.filter(d => d.status === 'pending').map(d => ({ ...d, caseNumber: c.caseNumber, deceasedName: c.deceased.fullName }))).map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{doc.name}</p>
                            <p className="text-xs text-[#757575]">{doc.caseNumber} - {doc.deceasedName}</p>
                          </div>
                          <Button size="sm" variant="outline">Upload</Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Compliance Status */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-[#00897B]" />
                      Compliance Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {complianceItems.filter(i => i.required).map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            {item.obtained ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-orange-600" />
                            )}
                            <p className="text-sm">{item.description}</p>
                          </div>
                          <Badge className={item.obtained ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}>
                            {item.obtained ? 'Obtained' : 'Required'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Cases Tab */}
            <TabsContent value="cases" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Funeral Cases</h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search cases..." className="pl-9 w-64" />
                  </div>
                  <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setNewCaseDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />New Case
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {cases.map(funeralCase => (
                  <Card key={funeralCase.id} className="cursor-pointer hover:border-[#00897B]" onClick={() => setSelectedCase(funeralCase)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-lg bg-[#E0F2F1]">
                            <Heart className="h-5 w-5 text-[#00897B]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold">{funeralCase.deceased.fullName}</p>
                              <Badge className={getStatusColor(funeralCase.status)}>
                                {funeralCase.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-[#757575]">{funeralCase.caseNumber}</p>
                            <p className="text-sm text-[#757575]">ID: {funeralCase.deceased.idNumber}</p>
                            <p className="text-sm text-[#757575]">Family Contact: {funeralCase.familyContact.name} ({funeralCase.familyContact.phone})</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-[#757575]">Package</p>
                          <p className="font-medium">{funeralCase.package.name}</p>
                          <p className="text-lg font-bold text-[#00897B]">{formatCurrency(funeralCase.totalCost)}</p>
                          <div className="mt-2">
                            <p className="text-xs text-[#757575]">Paid: {formatCurrency(funeralCase.paidAmount)}</p>
                            {funeralCase.balance > 0 && (
                              <p className="text-xs text-orange-600">Balance: {formatCurrency(funeralCase.balance)}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Service Details */}
                      <div className="mt-4 pt-4 border-t grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-[#757575]">Service Date</p>
                          <p className="font-medium">{funeralCase.serviceDate}</p>
                        </div>
                        <div>
                          <p className="text-[#757575]">Time</p>
                          <p className="font-medium">{funeralCase.serviceTime}</p>
                        </div>
                        <div>
                          <p className="text-[#757575]">Venue</p>
                          <p className="font-medium">{funeralCase.venue}</p>
                        </div>
                        <div>
                          <p className="text-[#757575]">Documents</p>
                          <p className="font-medium">
                            {funeralCase.documents.filter(d => d.status === 'verified').length}/{funeralCase.documents.length} verified
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Packages Tab */}
            <TabsContent value="packages" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Funeral Packages</h2>
                <Button className="bg-[#00897B] hover:bg-[#00695C]">
                  <Plus className="h-4 w-4 mr-2" />Create Package
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {packages.map(pkg => (
                  <Card key={pkg.id} className="hover:border-[#00897B] cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg">{pkg.name}</CardTitle>
                      <CardDescription>{pkg.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-[#00897B] mb-4">{formatCurrency(pkg.basePrice)}</p>
                      <div className="space-y-2">
                        {pkg.items.filter(i => i.included).map(item => (
                          <div key={item.id} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span>{item.name}</span>
                          </div>
                        ))}
                      </div>
                      <Separator className="my-4" />
                      <Button className="w-full bg-[#00897B] hover:bg-[#00695C]">
                        Select Package
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Payment Plans & Collections</h2>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />Export Report
                </Button>
              </div>

              <div className="space-y-3">
                {cases.filter(c => c.paymentPlan).map(funeralCase => (
                  <Card key={funeralCase.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="font-bold">{funeralCase.deceased.fullName}</p>
                          <p className="text-sm text-[#757575]">{funeralCase.caseNumber}</p>
                          <p className="text-sm text-[#757575]">Contact: {funeralCase.familyContact.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#00897B]">{formatCurrency(funeralCase.totalCost)}</p>
                          <Badge className={funeralCase.balance > 0 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}>
                            {funeralCase.balance > 0 ? 'Balance Outstanding' : 'Paid in Full'}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-[#757575]">Total Cost</p>
                          <p className="font-bold text-green-700">{formatCurrency(funeralCase.totalCost)}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-[#757575]">Paid</p>
                          <p className="font-bold text-blue-700">{formatCurrency(funeralCase.paidAmount)}</p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-3">
                          <p className="text-[#757575]">Balance</p>
                          <p className="font-bold text-orange-700">{formatCurrency(funeralCase.balance)}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-3">
                          <p className="text-[#757575]">Installment</p>
                          <p className="font-bold text-purple-700">{formatCurrency(funeralCase.paymentPlan?.installmentAmount || 0)}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Progress value={(funeralCase.paidAmount / funeralCase.totalCost) * 100} className="w-48" />
                          <span className="text-sm">{Math.round((funeralCase.paidAmount / funeralCase.totalCost) * 100)}%</span>
                        </div>
                        <Button className="bg-[#00897B] hover:bg-[#00695C]">
                          <CreditCard className="h-4 w-4 mr-2" />Record Payment
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Compliance Tab */}
            <TabsContent value="compliance" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Regulatory Compliance</h2>
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />Refresh Status
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Required Documentation</CardTitle>
                  <CardDescription>South African funeral service regulatory requirements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {complianceItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {item.obtained ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-orange-600" />
                          )}
                          <div>
                            <p className="font-medium">{item.description}</p>
                            <p className="text-sm text-[#757575]">Category: {item.category.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.required && (
                            <Badge variant="outline">Required</Badge>
                          )}
                          <Badge className={item.obtained ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}>
                            {item.obtained ? 'Compliant' : 'Pending'}
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
