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
  Home,
  Building2,
  Users,
  FileText,
  DollarSign,
  Calendar,
  Phone,
  MapPin,
  Key,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Download,
  Printer,
  RefreshCw,
  Eye,
  Edit,
  Clock,
  TrendingUp,
  TrendingDown,
  Loader2,
  CreditCard,
  Banknote,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Fingerprint,
  AlertCircle,
  Award,
  Briefcase,
  Scale,
  Wallet,
  UserCheck,
  ClipboardList,
  Image,
} from 'lucide-react'

// Types specific to Real Estate / Estate Agents
type PropertyStatus = 'available' | 'pending_sale' | 'sold' | 'pending_rent' | 'rented' | 'withdrawn'
type PropertyType = 'house' | 'apartment' | 'townhouse' | 'vacant_land' | 'commercial' | 'industrial' | 'farm'
type ListingType = 'sale' | 'rental'
type MandateType = 'sole' | 'open' | 'exclusive'
type FICAStatus = 'pending' | 'verified' | 'rejected' | 'expired'
type DealStatus = 'pending' | 'documents_pending' | 'conveyancing' | 'registration' | 'completed' | 'cancelled'

interface PropertyListing {
  id: string
  referenceNumber: string
  title: string
  propertyType: PropertyType
  listingType: ListingType
  address: string
  suburb: string
  city: string
  province: string
  erfSize: number // in sqm
  buildingSize: number // in sqm
  bedrooms: number
  bathrooms: number
  garages: number
  price: number
  levy?: number
  rates?: number
  description: string
  features: string[]
  images: string[]
  status: PropertyStatus
  mandateType: MandateType
  mandateExpiry: string
  sellerLandlord: Contact
  agentId: string
  agentName: string
  createdAt: string
  views: number
  inquiries: number
}

interface Contact {
  id: string
  name: string
  phone: string
  email: string
  address: string
  idNumber?: string
  type: 'individual' | 'company'
  companyName?: string
  companyReg?: string
}

interface FICARecord {
  id: string
  contactId: string
  contactName: string
  contactType: 'buyer' | 'seller' | 'landlord' | 'tenant'
  idDocument: 'id' | 'passport' | 'company_registration'
  documentNumber: string
  proofOfAddress: boolean
  verifiedBy: string
  verificationDate: string
  status: FICAStatus
  expiryDate: string
  notes?: string
}

interface TrustAccountEntry {
  id: string
  propertyReference: string
  clientName: string
  transactionType: 'deposit' | 'release' | 'commission' | 'refund'
  amount: number
  balance: number
  description: string
  reference: string
  reconciled: boolean
  reconciledDate?: string
  createdAt: string
}

interface SalesDeal {
  id: string
  dealNumber: string
  property: PropertyListing
  buyer: Contact
  seller: Contact
  salePrice: number
  commissionRate: number // percentage
  commissionAmount: number
  vatAmount: number
  netCommission: number
  status: DealStatus
  conveyancer: string
  conveyancerContact: string
  depositReceived: boolean
  depositAmount: number
  bondAmount: number
  bondBank: string
  registrationDate?: string
  createdAt: string
  documents: DocumentRecord[]
}

interface DocumentRecord {
  id: string
  name: string
  type: 'offer_to_purchase' | 'mandate' | 'fica_seller' | 'fica_buyer' | 'transfer_docs' | 'bond_docs' | 'other'
  status: 'pending' | 'uploaded' | 'verified'
  uploadedAt?: string
}

interface EAABCompliance {
  id: string
  category: 'ffd_certificate' | 'cpd' | 'audit' | 'trust_account'
  description: string
  required: boolean
  status: 'compliant' | 'pending' | 'non_compliant'
  expiryDate?: string
  points?: number
  requiredPoints?: number
}

export function RealEstateView() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Data states
  const [properties, setProperties] = useState<PropertyListing[]>([])
  const [deals, setDeals] = useState<SalesDeal[]>([])
  const [ficaRecords, setFicaRecords] = useState<FICARecord[]>([])
  const [trustEntries, setTrustEntries] = useState<TrustAccountEntry[]>([])
  const [complianceItems, setComplianceItems] = useState<EAABCompliance[]>([])

  // Dialog states
  const [newPropertyDialogOpen, setNewPropertyDialogOpen] = useState(false)
  const [newDealDialogOpen, setNewDealDialogOpen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null)

  // Update time
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Mock data
  useEffect(() => {
    const timer = setTimeout(() => {
      setProperties([
        {
          id: 'prop-1',
          referenceNumber: 'RE-2026-001',
          title: 'Modern 3 Bedroom House in Sandton',
          propertyType: 'house',
          listingType: 'sale',
          address: '123 Oak Avenue, Sandhurst',
          suburb: 'Sandhurst',
          city: 'Sandton',
          province: 'Gauteng',
          erfSize: 1200,
          buildingSize: 450,
          bedrooms: 3,
          bathrooms: 2.5,
          garages: 2,
          price: 4500000,
          levy: 0,
          rates: 3500,
          description: 'Beautiful modern home with pool and garden',
          features: ['Pool', 'Garden', 'Security', 'Staff Quarters'],
          images: [],
          status: 'pending_sale',
          mandateType: 'sole',
          mandateExpiry: '2026-08-14',
          sellerLandlord: {
            id: 'contact-1',
            name: 'Johan van der Merwe',
            phone: '0821234567',
            email: 'johan.vdm@email.com',
            address: '123 Oak Avenue, Sandhurst, Sandton',
            idNumber: '7001015001087',
            type: 'individual'
          },
          agentId: 'agent-1',
          agentName: 'Thandi Nkosi',
          createdAt: '2026-02-01',
          views: 145,
          inquiries: 12
        },
        {
          id: 'prop-2',
          referenceNumber: 'RE-2026-002',
          title: 'Luxury Apartment in Rosebank',
          propertyType: 'apartment',
          listingType: 'sale',
          address: '456 The Firs, Main Street',
          suburb: 'Rosebank',
          city: 'Johannesburg',
          province: 'Gauteng',
          erfSize: 0,
          buildingSize: 120,
          bedrooms: 2,
          bathrooms: 1,
          garages: 1,
          price: 1850000,
          levy: 2800,
          rates: 1200,
          description: 'Modern apartment in secure complex',
          features: ['Balcony', '24hr Security', 'Pool in Complex', 'Gym'],
          images: [],
          status: 'available',
          mandateType: 'open',
          mandateExpiry: '2026-05-14',
          sellerLandlord: {
            id: 'contact-2',
            name: 'Investment Properties (Pty) Ltd',
            phone: '0115551234',
            email: 'sales@invprops.co.za',
            address: '789 Main Street, Rosebank',
            type: 'company',
            companyName: 'Investment Properties (Pty) Ltd',
            companyReg: '2020/123456/07'
          },
          agentId: 'agent-2',
          agentName: 'Mike Peters',
          createdAt: '2026-02-10',
          views: 89,
          inquiries: 5
        },
        {
          id: 'prop-3',
          referenceNumber: 'RE-2026-003',
          title: 'Commercial Office Space - Soweto',
          propertyType: 'commercial',
          listingType: 'rental',
          address: '123 Chris Hani Road, Orlando East',
          suburb: 'Orlando East',
          city: 'Soweto',
          province: 'Gauteng',
          erfSize: 500,
          buildingSize: 200,
          bedrooms: 0,
          bathrooms: 2,
          garages: 4,
          price: 35000, // monthly rental
          levy: 0,
          rates: 0,
          description: 'Prime commercial space in growing Soweto',
          features: ['Parking', 'Kitchen', 'Aircon', 'Security'],
          images: [],
          status: 'available',
          mandateType: 'sole',
          mandateExpiry: '2026-11-14',
          sellerLandlord: {
            id: 'contact-3',
            name: 'Soweto Development Corp',
            phone: '0119876543',
            email: 'leasing@sowetodev.co.za',
            address: '123 Chris Hani Road, Orlando East, Soweto',
            type: 'company',
            companyName: 'Soweto Development Corporation',
            companyReg: '2018/654321/07'
          },
          agentId: 'agent-1',
          agentName: 'Thandi Nkosi',
          createdAt: '2026-02-12',
          views: 34,
          inquiries: 3
        },
      ])

      setDeals([
        {
          id: 'deal-1',
          dealNumber: 'DEAL-2026-001',
          property: properties[0] || {} as PropertyListing,
          buyer: {
            id: 'buyer-1',
            name: 'Sipho and Nomsa Dlamini',
            phone: '0835557890',
            email: 'dlaminifamily@email.com',
            address: '789 Maple Street, Midrand',
            idNumber: '8102015678090',
            type: 'individual'
          },
          seller: {
            id: 'contact-1',
            name: 'Johan van der Merwe',
            phone: '0821234567',
            email: 'johan.vdm@email.com',
            address: '123 Oak Avenue, Sandhurst, Sandton',
            idNumber: '7001015001087',
            type: 'individual'
          },
          salePrice: 4300000,
          commissionRate: 5,
          commissionAmount: 215000,
          vatAmount: 32250,
          netCommission: 247250,
          status: 'conveyancing',
          conveyancer: 'Webber Wentzel Attorneys',
          conveyancerContact: '0115551234',
          depositReceived: true,
          depositAmount: 430000,
          bondAmount: 3870000,
          bondBank: 'Standard Bank',
          createdAt: '2026-02-10',
          documents: [
            { id: 'd1', name: 'Offer to Purchase', type: 'offer_to_purchase', status: 'verified', uploadedAt: '2026-02-10' },
            { id: 'd2', name: 'Seller FICA', type: 'fica_seller', status: 'verified', uploadedAt: '2026-02-10' },
            { id: 'd3', name: 'Buyer FICA', type: 'fica_buyer', status: 'verified', uploadedAt: '2026-02-11' },
            { id: 'd4', name: 'Transfer Documents', type: 'transfer_docs', status: 'pending' },
          ]
        },
      ])

      setFicaRecords([
        {
          id: 'fica-1',
          contactId: 'buyer-1',
          contactName: 'Sipho and Nomsa Dlamini',
          contactType: 'buyer',
          idDocument: 'id',
          documentNumber: 'ID-810201-5678',
          proofOfAddress: true,
          verifiedBy: 'Thandi Nkosi',
          verificationDate: '2026-02-11',
          status: 'verified',
          expiryDate: '2027-02-11'
        },
        {
          id: 'fica-2',
          contactId: 'contact-1',
          contactName: 'Johan van der Merwe',
          contactType: 'seller',
          idDocument: 'id',
          documentNumber: 'ID-700101-5001',
          proofOfAddress: true,
          verifiedBy: 'Thandi Nkosi',
          verificationDate: '2026-02-10',
          status: 'verified',
          expiryDate: '2027-02-10'
        },
        {
          id: 'fica-3',
          contactId: 'buyer-2',
          contactName: 'Mpho Mokoena',
          contactType: 'buyer',
          idDocument: 'id',
          documentNumber: 'ID-850615-5432',
          proofOfAddress: false,
          status: 'pending',
          expiryDate: '2027-02-14'
        },
      ])

      setTrustEntries([
        {
          id: 'te-1',
          propertyReference: 'RE-2026-001',
          clientName: 'Sipho and Nomsa Dlamini',
          transactionType: 'deposit',
          amount: 430000,
          balance: 430000,
          description: 'Purchase deposit - 10%',
          reference: 'DEP-2026-001',
          reconciled: true,
          reconciledDate: '2026-02-10',
          createdAt: '2026-02-10T14:00:00'
        },
        {
          id: 'te-2',
          propertyReference: 'RE-2026-001',
          clientName: 'Johan van der Merwe',
          transactionType: 'release',
          amount: -430000,
          balance: 0,
          description: 'Release to conveyancer',
          reference: 'REL-2026-001',
          reconciled: false,
          createdAt: '2026-02-14T10:00:00'
        },
      ])

      setComplianceItems([
        { id: 'comp-1', category: 'ffd_certificate', description: 'EAAB Fidelity Fund Certificate', required: true, status: 'compliant', expiryDate: '2027-03-31' },
        { id: 'comp-2', category: 'cpd', description: 'Continuing Professional Development', required: true, status: 'pending', points: 8, requiredPoints: 10 },
        { id: 'comp-3', category: 'trust_account', description: 'Trust Account Audit', required: true, status: 'compliant', expiryDate: '2026-12-31' },
        { id: 'comp-4', category: 'audit', description: 'Annual Audit Submission', required: true, status: 'compliant', expiryDate: '2026-06-30' },
      ])

      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Stats
  const stats = {
    activeListings: properties.filter(p => p.status === 'available').length,
    pendingSales: properties.filter(p => p.status === 'pending_sale').length,
    soldThisMonth: properties.filter(p => p.status === 'sold').length,
    totalViews: properties.reduce((sum, p) => sum + p.views, 0),
    totalInquiries: properties.reduce((sum, p) => sum + p.inquiries, 0),
    activeDeals: deals.filter(d => !['completed', 'cancelled'].includes(d.status)).length,
    pendingFICA: ficaRecords.filter(f => f.status === 'pending').length,
    trustBalance: trustEntries.length > 0 ? trustEntries[trustEntries.length - 1].balance : 0,
    commissionPipeline: deals.reduce((sum, d) => sum + d.netCommission, 0),
    complianceScore: Math.round((complianceItems.filter(c => c.status === 'compliant').length / complianceItems.length) * 100),
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: 'bg-green-100 text-green-700',
      pending_sale: 'bg-blue-100 text-blue-700',
      sold: 'bg-gray-100 text-gray-700',
      pending_rent: 'bg-blue-100 text-blue-700',
      rented: 'bg-gray-100 text-gray-700',
      withdrawn: 'bg-red-100 text-red-700',
      pending: 'bg-yellow-100 text-yellow-700',
      documents_pending: 'bg-orange-100 text-orange-700',
      conveyancing: 'bg-purple-100 text-purple-700',
      registration: 'bg-cyan-100 text-cyan-700',
      completed: 'bg-green-100 text-green-700',
      verified: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      compliant: 'bg-green-100 text-green-700',
      non_compliant: 'bg-red-100 text-red-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const formatCurrency = (amount: number) => {
    return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`
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
              <Home className="h-5 w-5 text-[#00897B]" />
              Estate Agency Management
            </h1>
            <p className="text-sm text-[#757575]">Property listings, trust accounts, FICA & EAAB compliance</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-mono font-bold">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-xs text-[#757575]">{currentTime.toLocaleDateString()}</p>
            </div>

            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setNewPropertyDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />New Listing
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-10 gap-2">
          <div className="bg-[#E0F2F1] rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-[#00897B]">{stats.activeListings}</p>
            <p className="text-[9px] text-[#757575]">Active Listings</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-blue-600">{stats.pendingSales}</p>
            <p className="text-[9px] text-[#757575]">Pending Sales</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-green-600">{stats.activeDeals}</p>
            <p className="text-[9px] text-[#757575]">Active Deals</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-purple-600">{stats.totalViews}</p>
            <p className="text-[9px] text-[#757575]">Views</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-orange-600">{stats.totalInquiries}</p>
            <p className="text-[9px] text-[#757575]">Inquiries</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-yellow-600">{stats.pendingFICA}</p>
            <p className="text-[9px] text-[#757575]">FICA Pending</p>
          </div>
          <div className="bg-cyan-50 rounded-lg p-2 text-center">
            <p className="text-sm font-bold text-cyan-600">{formatCurrency(stats.trustBalance)}</p>
            <p className="text-[9px] text-[#757575]">Trust Balance</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-sm font-bold text-green-600">{formatCurrency(stats.commissionPipeline)}</p>
            <p className="text-[9px] text-[#757575]">Pipeline</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-green-600">{stats.complianceScore}%</p>
            <p className="text-[9px] text-[#757575]">EAAB Score</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-gray-600">{stats.soldThisMonth}</p>
            <p className="text-[9px] text-[#757575]">Sold</p>
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
              <TabsTrigger value="listings" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Home className="h-4 w-4 mr-1" />Listings
              </TabsTrigger>
              <TabsTrigger value="deals" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <ClipboardList className="h-4 w-4 mr-1" />Sales Pipeline
              </TabsTrigger>
              <TabsTrigger value="fica" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Fingerprint className="h-4 w-4 mr-1" />FICA
              </TabsTrigger>
              <TabsTrigger value="trust" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Wallet className="h-4 w-4 mr-1" />Trust Account
              </TabsTrigger>
              <TabsTrigger value="compliance" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <ShieldCheck className="h-4 w-4 mr-1" />EAAB
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-4">
            {/* Overview Tab */}
            <TabsContent value="overview" className="m-0">
              <div className="grid grid-cols-2 gap-4">
                {/* Active Deals */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-[#00897B]" />
                      Active Sales Pipeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {deals.filter(d => !['completed', 'cancelled'].includes(d.status)).map(deal => (
                        <div key={deal.id} className="p-2 bg-purple-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{deal.property?.title || 'Property Deal'}</p>
                              <p className="text-xs text-[#757575]">{deal.dealNumber} | {formatCurrency(deal.salePrice)}</p>
                            </div>
                            <Badge className={getStatusColor(deal.status)}>{deal.status}</Badge>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs">
                            <span className="text-[#757575]">Commission: {formatCurrency(deal.netCommission)}</span>
                            <span className="text-[#757575]">{deal.documents.filter(d => d.status === 'verified').length}/{deal.documents.length} docs</span>
                          </div>
                        </div>
                      ))}
                      {deals.filter(d => !['completed', 'cancelled'].includes(d.status)).length === 0 && (
                        <p className="text-center text-sm text-[#757575] py-4">No active deals</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* FICA Alerts */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Fingerprint className="h-5 w-5 text-orange-600" />
                      FICA Pending Verification
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {ficaRecords.filter(f => f.status === 'pending').map(record => (
                        <div key={record.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{record.contactName}</p>
                            <p className="text-xs text-[#757575]">{record.contactType} | {record.idDocument}</p>
                          </div>
                          <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]">Verify</Button>
                        </div>
                      ))}
                      {ficaRecords.filter(f => f.status === 'pending').length === 0 && (
                        <p className="text-center text-sm text-green-600 py-4">All FICA verified</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Trust Account */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-[#00897B]" />
                      Trust Account Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.trustBalance)}</p>
                        <p className="text-xs text-[#757575]">Current Balance</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">{trustEntries.filter(t => !t.reconciled).length}</p>
                        <p className="text-xs text-[#757575]">Unreconciled</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs text-[#757575] mb-1">Recent Transactions</p>
                      {trustEntries.slice(0, 2).map(entry => (
                        <div key={entry.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                          <span>{entry.description}</span>
                          <span className={entry.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {entry.amount >= 0 ? '+' : ''}{formatCurrency(entry.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* EAAB Compliance */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-[#00897B]" />
                      EAAB Compliance Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {complianceItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            {item.status === 'compliant' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-orange-600" />
                            )}
                            <div>
                              <p className="text-sm">{item.description}</p>
                              {item.points !== undefined && (
                                <p className="text-xs text-[#757575]">{item.points}/{item.requiredPoints} points</p>
                              )}
                            </div>
                          </div>
                          <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Listings Tab */}
            <TabsContent value="listings" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Property Listings</h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search properties..." className="pl-9 w-64" />
                  </div>
                  <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setNewPropertyDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />New Listing
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {properties.map(property => (
                  <Card key={property.id} className="cursor-pointer hover:border-[#00897B]" onClick={() => setSelectedProperty(property)}>
                    <CardContent className="p-4">
                      <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                        <Image className="h-12 w-12 text-gray-300" />
                      </div>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-bold text-sm line-clamp-1">{property.title}</p>
                          <p className="text-xs text-[#757575]">{property.referenceNumber}</p>
                        </div>
                        <Badge className={getStatusColor(property.status)}>{property.status}</Badge>
                      </div>
                      <p className="text-xs text-[#757575] mb-2">{property.suburb}, {property.city}</p>
                      <p className="text-lg font-bold text-[#00897B]">
                        {formatCurrency(property.price)}
                        {property.listingType === 'rental' && <span className="text-xs text-[#757575]">/mo</span>}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-[#757575]">
                        {property.bedrooms > 0 && <span>{property.bedrooms} bed</span>}
                        {property.bathrooms > 0 && <span>{property.bathrooms} bath</span>}
                        {property.garages > 0 && <span>{property.garages} gar</span>}
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs">
                        <span className="text-[#757575]">{property.views} views | {property.inquiries} inquiries</span>
                        <Badge variant="outline">{property.mandateType} mandate</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Sales Pipeline Tab */}
            <TabsContent value="deals" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Sales Pipeline</h2>
                <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setNewDealDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />New Deal
                </Button>
              </div>

              <div className="space-y-3">
                {deals.map(deal => (
                  <Card key={deal.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold">{deal.dealNumber}</p>
                            <Badge className={getStatusColor(deal.status)}>{deal.status}</Badge>
                          </div>
                          <p className="text-sm text-[#757575] mt-1">Property: {deal.property?.title || 'RE-2026-001'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-[#00897B]">{formatCurrency(deal.salePrice)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
                        <div>
                          <p className="text-xs text-[#757575]">Buyer</p>
                          <p className="text-sm font-medium">{deal.buyer.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#757575]">Seller</p>
                          <p className="text-sm font-medium">{deal.seller.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#757575]">Conveyancer</p>
                          <p className="text-sm font-medium">{deal.conveyancer}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#757575]">Commission (Net)</p>
                          <p className="text-sm font-bold text-green-600">{formatCurrency(deal.netCommission)}</p>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className={`h-4 w-4 ${deal.depositReceived ? 'text-green-600' : 'text-gray-300'}`} />
                              <span className="text-xs">Deposit ({formatCurrency(deal.depositAmount)})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-gray-300" />
                              <span className="text-xs">Bond ({deal.bondBank})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-gray-300" />
                              <span className="text-xs">Transfer</span>
                            </div>
                          </div>
                          <div className="text-xs text-[#757575]">
                            {deal.documents.filter(d => d.status === 'verified').length}/{deal.documents.length} documents verified
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* FICA Tab */}
            <TabsContent value="fica" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">FICA Records</h2>
                <Button className="bg-[#00897B] hover:bg-[#00695C]">
                  <Plus className="h-4 w-4 mr-2" />New Verification
                </Button>
              </div>

              <div className="space-y-3">
                {ficaRecords.map(record => (
                  <Card key={record.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${record.status === 'verified' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                            <Fingerprint className={`h-5 w-5 ${record.status === 'verified' ? 'text-green-600' : 'text-yellow-600'}`} />
                          </div>
                          <div>
                            <p className="font-bold">{record.contactName}</p>
                            <p className="text-sm text-[#757575]">Type: {record.contactType}</p>
                            <p className="text-sm text-[#757575]">Document: {record.idDocument} ({record.documentNumber})</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(record.status)}>{record.status}</Badge>
                          {record.status === 'verified' && (
                            <>
                              <p className="text-xs text-[#757575] mt-2">Verified: {record.verificationDate}</p>
                              <p className="text-xs text-[#757575]">Expires: {record.expiryDate}</p>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Trust Account Tab */}
            <TabsContent value="trust" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Trust Account Register</h2>
                  <p className="text-sm text-[#757575]">Balance: {formatCurrency(stats.trustBalance)}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />Export
                  </Button>
                  <Button className="bg-[#00897B] hover:bg-[#00695C]">
                    <Plus className="h-4 w-4 mr-2" />New Transaction
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {trustEntries.map(entry => (
                  <Card key={entry.id} className={!entry.reconciled ? 'border-orange-300' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${entry.amount >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                            {entry.amount >= 0 ? (
                              <ArrowUpRight className="h-5 w-5 text-green-600" />
                            ) : (
                              <ArrowDownRight className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{entry.description}</p>
                              {!entry.reconciled && (
                                <Badge className="bg-orange-100 text-orange-700">Unreconciled</Badge>
                              )}
                            </div>
                            <p className="text-sm text-[#757575]">Property: {entry.propertyReference} | Client: {entry.clientName}</p>
                            <p className="text-sm text-[#757575]">Ref: {entry.reference}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-lg ${entry.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {entry.amount >= 0 ? '+' : ''}{formatCurrency(entry.amount)}
                          </p>
                          <p className="text-xs text-[#757575]">Balance: {formatCurrency(entry.balance)}</p>
                          <p className="text-xs text-[#757575]">{new Date(entry.createdAt).toLocaleString()}</p>
                          {!entry.reconciled && (
                            <Button size="sm" className="mt-2 bg-[#00897B] hover:bg-[#00695C]">Reconcile</Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* EAAB Compliance Tab */}
            <TabsContent value="compliance" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">EAAB Compliance</h2>
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />Refresh Status
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Fidelity Fund Certificate (FFC)</CardTitle>
                    <CardDescription>Required to operate as estate agent in South Africa</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {complianceItems.filter(c => c.category === 'ffd_certificate').map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Award className="h-8 w-8 text-green-600" />
                          <div>
                            <p className="font-medium">FFC Active</p>
                            <p className="text-sm text-[#757575]">Expires: {item.expiryDate}</p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-700">Compliant</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>CPD Points</CardTitle>
                    <CardDescription>Continuing Professional Development</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {complianceItems.filter(c => c.category === 'cpd').map(item => (
                      <div key={item.id}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm">{item.points} / {item.requiredPoints} points</span>
                          <Badge className={item.points! >= item.requiredPoints! ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}>
                            {item.points! >= item.requiredPoints! ? 'Compliant' : 'In Progress'}
                          </Badge>
                        </div>
                        <Progress value={(item.points! / item.requiredPoints!) * 100} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Trust Account Audit</CardTitle>
                    <CardDescription>Annual audit by registered auditor</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {complianceItems.filter(c => c.category === 'trust_account').map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium">Audit Complete</p>
                          <p className="text-sm text-[#757575]">Valid until: {item.expiryDate}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-700">Compliant</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Annual Requirements</CardTitle>
                    <CardDescription>EAAB statutory requirements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {complianceItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <span>{item.description}</span>
                          <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  )
}
