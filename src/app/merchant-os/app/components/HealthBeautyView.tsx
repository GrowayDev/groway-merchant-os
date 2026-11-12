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
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'
import {
  Scissors,
  User,
  Award,
  AlertTriangle,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  Plus,
  Eye,
  Printer,
  Heart,
  Shield,
  RefreshCw,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  ChevronRight,
  XCircle,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  FileWarning,
  Users,
  Activity,
  Sparkles,
  Droplets,
} from 'lucide-react'

// Types
type LicenseType = 'hairdresser' | 'beautician' | 'nail_technician' | 'aesthetician' | 'massage_therapist'
type LicenseStatus = 'active' | 'expired' | 'suspended' | 'revoked'
type SkinType = 'oily' | 'dry' | 'combination' | 'sensitive' | 'normal'

interface PractitionerLicense {
  id: string
  staffId: string
  practitionerName: string
  practitionerPhoto: string
  licenseType: LicenseType
  licenseNumber: string
  issuingBody: string
  issueDate: string
  expiryDate: string
  status: LicenseStatus
  specializations: string[]
  documentUrl?: string
  daysUntilExpiry: number
  isExpired: boolean
  isExpiringSoon: boolean
  createdAt: string
  updatedAt: string
}

interface TreatmentRecord {
  id: string
  clientId: string
  clientName: string
  clientPhone: string
  practitionerId: string
  practitionerName: string
  serviceName: string
  serviceCategory: string
  treatmentDate: string
  treatmentTime: string
  duration: number
  productsUsed: Array<{ name: string; quantity: number; unit: string }>
  preTreatmentNotes: string
  postTreatmentNotes: string
  consentObtained: boolean
  consentDocumentUrl?: string
  followUpRequired: boolean
  followUpDate?: string
  followUpReason?: string
  beforePhotos: string[]
  afterPhotos: string[]
  totalPrice: number
  createdAt: string
  updatedAt: string
}

interface AllergyProfile {
  id: string
  clientId: string
  clientName: string
  clientPhone: string
  skinType: SkinType
  allergies: Array<{ name: string; severity: string; reaction: string }>
  sensitivities: Array<{ name: string; severity: string; notes: string }>
  previousReactions: Array<{ date: string; product: string; reaction: string; treatment: string }>
  medicalConditions: string[]
  medications: string[]
  notes: string
  emergencyContact: string
  createdAt: string
  updatedAt: string
}

// License type labels
const licenseTypeLabels: Record<LicenseType, string> = {
  hairdresser: 'Hairdresser',
  beautician: 'Beautician',
  nail_technician: 'Nail Technician',
  aesthetician: 'Aesthetician',
  massage_therapist: 'Massage Therapist',
}

// License status colors
const licenseStatusColors: Record<LicenseStatus, { bg: string; text: string }> = {
  active: { bg: 'bg-green-100', text: 'text-green-700' },
  expired: { bg: 'bg-red-100', text: 'text-red-700' },
  suspended: { bg: 'bg-amber-100', text: 'text-amber-700' },
  revoked: { bg: 'bg-gray-100', text: 'text-gray-700' },
}

// Skin type labels
const skinTypeLabels: Record<SkinType, string> = {
  oily: 'Oily',
  dry: 'Dry',
  combination: 'Combination',
  sensitive: 'Sensitive',
  normal: 'Normal',
}

// Skin type colors
const skinTypeColors: Record<SkinType, { bg: string; text: string }> = {
  oily: { bg: 'bg-blue-100', text: 'text-blue-700' },
  dry: { bg: 'bg-amber-100', text: 'text-amber-700' },
  combination: { bg: 'bg-purple-100', text: 'text-purple-700' },
  sensitive: { bg: 'bg-red-100', text: 'text-red-700' },
  normal: { bg: 'bg-green-100', text: 'text-green-700' },
}

// Severity colors
const severityColors: Record<string, { bg: string; text: string }> = {
  severe: { bg: 'bg-red-100', text: 'text-red-700' },
  moderate: { bg: 'bg-amber-100', text: 'text-amber-700' },
  mild: { bg: 'bg-blue-100', text: 'text-blue-700' },
}

export function HealthBeautyView() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  
  // Data states
  const [licenses, setLicenses] = useState<PractitionerLicense[]>([])
  const [expiringLicenses, setExpiringLicenses] = useState<PractitionerLicense[]>([])
  const [treatments, setTreatments] = useState<TreatmentRecord[]>([])
  const [allergyProfiles, setAllergyProfiles] = useState<AllergyProfile[]>([])
  
  // Dialog states
  const [licenseDialogOpen, setLicenseDialogOpen] = useState(false)
  const [treatmentDialogOpen, setTreatmentDialogOpen] = useState(false)
  const [licenseDetailOpen, setLicenseDetailOpen] = useState(false)
  const [treatmentDetailOpen, setTreatmentDetailOpen] = useState(false)
  const [profileDetailOpen, setProfileDetailOpen] = useState(false)
  
  // Selected items
  const [selectedLicense, setSelectedLicense] = useState<PractitionerLicense | null>(null)
  const [selectedTreatment, setSelectedTreatment] = useState<TreatmentRecord | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<AllergyProfile | null>(null)
  
  // Form states
  const [newLicense, setNewLicense] = useState({
    practitionerName: '',
    licenseType: 'hairdresser' as LicenseType,
    licenseNumber: '',
    issuingBody: '',
    issueDate: '',
    expiryDate: '',
    specializations: [] as string[],
    documentUrl: '',
  })
  
  const [newTreatment, setNewTreatment] = useState({
    clientName: '',
    clientPhone: '',
    practitionerName: '',
    serviceName: '',
    serviceCategory: '',
    treatmentDate: '',
    treatmentTime: '',
    duration: 60,
    productsUsed: '',
    preTreatmentNotes: '',
    postTreatmentNotes: '',
    consentObtained: false,
    followUpRequired: false,
    followUpDate: '',
    followUpReason: '',
    beforePhotos: '',
    afterPhotos: '',
  })
  
  const [saving, setSaving] = useState(false)
  
  // Search/filter states
  const [licenseSearch, setLicenseSearch] = useState('')
  const [treatmentSearch, setTreatmentSearch] = useState('')
  const [profileSearch, setProfileSearch] = useState('')
  const [licenseFilter, setLicenseFilter] = useState<string>('all')
  const [treatmentFilter, setTreatmentFilter] = useState<string>('all')

  // Fetch data on mount
  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchLicenses(),
        fetchExpiringLicenses(),
        fetchTreatments(),
        fetchAllergyProfiles(),
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchLicenses = async () => {
    try {
      const res = await fetch('/merchant-os/api/health-beauty/licenses')
      if (res.ok) {
        const data = await res.json()
        setLicenses(data)
      }
    } catch (error) {
      console.error('Error fetching licenses:', error)
    }
  }

  const fetchExpiringLicenses = async () => {
    try {
      const res = await fetch('/merchant-os/api/health-beauty/licenses/expiring')
      if (res.ok) {
        const data = await res.json()
        setExpiringLicenses(data.expiringLicenses || [])
      }
    } catch (error) {
      console.error('Error fetching expiring licenses:', error)
    }
  }

  const fetchTreatments = async () => {
    try {
      const res = await fetch('/merchant-os/api/health-beauty/treatments?limit=20')
      if (res.ok) {
        const data = await res.json()
        setTreatments(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching treatments:', error)
    }
  }

  const fetchAllergyProfiles = async () => {
    try {
      const res = await fetch('/merchant-os/api/health-beauty/allergy-profiles')
      if (res.ok) {
        const data = await res.json()
        setAllergyProfiles(data)
      }
    } catch (error) {
      console.error('Error fetching allergy profiles:', error)
    }
  }

  // Create license
  const createLicense = async () => {
    if (!newLicense.practitionerName || !newLicense.licenseNumber || !newLicense.expiryDate) {
      toast.error('Please fill all required fields')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/merchant-os/api/health-beauty/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLicense),
      })
      
      if (!res.ok) throw new Error('Failed to create license')
      
      toast.success('License created successfully')
      setLicenseDialogOpen(false)
      setNewLicense({
        practitionerName: '',
        licenseType: 'hairdresser',
        licenseNumber: '',
        issuingBody: '',
        issueDate: '',
        expiryDate: '',
        specializations: [],
        documentUrl: '',
      })
      fetchLicenses()
    } catch (error) {
      console.error('Error creating license:', error)
      toast.error('Failed to create license')
    } finally {
      setSaving(false)
    }
  }

  // Create treatment record
  const createTreatment = async () => {
    if (!newTreatment.clientName || !newTreatment.practitionerName || !newTreatment.serviceName || !newTreatment.treatmentDate) {
      toast.error('Please fill all required fields')
      return
    }
    
    if (!newTreatment.consentObtained) {
      toast.error('Consent must be obtained before creating a treatment record')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/merchant-os/api/health-beauty/treatments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTreatment,
          clientId: `client-${Date.now()}`,
          practitionerId: `staff-${Date.now()}`,
          productsUsed: newTreatment.productsUsed ? JSON.parse(newTreatment.productsUsed) : [],
          beforePhotos: newTreatment.beforePhotos ? newTreatment.beforePhotos.split(',').map(s => s.trim()) : [],
          afterPhotos: newTreatment.afterPhotos ? newTreatment.afterPhotos.split(',').map(s => s.trim()) : [],
        }),
      })
      
      if (!res.ok) throw new Error('Failed to create treatment record')
      
      toast.success('Treatment record created successfully')
      setTreatmentDialogOpen(false)
      setNewTreatment({
        clientName: '',
        clientPhone: '',
        practitionerName: '',
        serviceName: '',
        serviceCategory: '',
        treatmentDate: '',
        treatmentTime: '',
        duration: 60,
        productsUsed: '',
        preTreatmentNotes: '',
        postTreatmentNotes: '',
        consentObtained: false,
        followUpRequired: false,
        followUpDate: '',
        followUpReason: '',
        beforePhotos: '',
        afterPhotos: '',
      })
      fetchTreatments()
    } catch (error) {
      console.error('Error creating treatment:', error)
      toast.error('Failed to create treatment record')
    } finally {
      setSaving(false)
    }
  }

  // Calculate compliance score
  const calculateComplianceScore = () => {
    if (licenses.length === 0) return 100
    const activeLicenses = licenses.filter(l => l.status === 'active').length
    const validLicenses = licenses.filter(l => !l.isExpired).length
    return Math.round((validLicenses / licenses.length) * 100)
  }

  // Stats
  const stats = {
    totalLicenses: licenses.length,
    activeLicenses: licenses.filter(l => l.status === 'active' && !l.isExpired).length,
    expiringLicenses: expiringLicenses.filter(l => !l.isExpired).length,
    expiredLicenses: licenses.filter(l => l.isExpired).length,
    totalTreatments: treatments.length,
    todayTreatments: treatments.filter(t => t.treatmentDate === new Date().toISOString().split('T')[0]).length,
    consentRate: treatments.length > 0 
      ? Math.round((treatments.filter(t => t.consentObtained).length / treatments.length) * 100) 
      : 100,
    followUpRate: treatments.length > 0 
      ? Math.round((treatments.filter(t => t.followUpRequired).length / treatments.length) * 100) 
      : 0,
    totalProfiles: allergyProfiles.length,
    criticalAllergies: allergyProfiles.filter(p => p.allergies.some(a => a.severity === 'severe')).length,
  }

  // Filtered data
  const filteredLicenses = licenses.filter(license => {
    const matchesSearch = license.practitionerName.toLowerCase().includes(licenseSearch.toLowerCase()) ||
      license.licenseNumber.toLowerCase().includes(licenseSearch.toLowerCase())
    const matchesFilter = licenseFilter === 'all' || license.status === licenseFilter
    return matchesSearch && matchesFilter
  })

  const filteredTreatments = treatments.filter(treatment => {
    const matchesSearch = treatment.clientName.toLowerCase().includes(treatmentSearch.toLowerCase()) ||
      treatment.practitionerName.toLowerCase().includes(treatmentSearch.toLowerCase()) ||
      treatment.serviceName.toLowerCase().includes(treatmentSearch.toLowerCase())
    const matchesFilter = treatmentFilter === 'all' || treatment.serviceCategory === treatmentFilter
    return matchesSearch && matchesFilter
  })

  const filteredProfiles = allergyProfiles.filter(profile => 
    profile.clientName.toLowerCase().includes(profileSearch.toLowerCase())
  )

  // Get days until expiry color
  const getExpiryColor = (days: number) => {
    if (days <= 0) return 'text-red-600'
    if (days <= 7) return 'text-red-600'
    if (days <= 30) return 'text-amber-600'
    return 'text-green-600'
  }

  // Get expiry background color
  const getExpiryBgColor = (days: number) => {
    if (days <= 0) return 'bg-red-50'
    if (days <= 7) return 'bg-red-50'
    if (days <= 30) return 'bg-amber-50'
    return 'bg-green-50'
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#FAFAFA]">
        <Loader2 className="h-8 w-8 animate-spin text-[#00897B]" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
              <Scissors className="h-5 w-5 text-[#00897B]" />
              Health & Beauty Compliance
            </h1>
            <p className="text-sm text-[#757575]">Practitioner licenses, treatment records & client safety profiles</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Compliance Score Badge */}
            <div className="flex items-center gap-2 px-4 py-2 bg-[#E0F2F1] rounded-lg">
              <Shield className="h-5 w-5 text-[#00897B]" />
              <div>
                <p className="text-xs text-[#757575]">Compliance Score</p>
                <p className="text-lg font-bold text-[#00897B]">{calculateComplianceScore()}%</p>
              </div>
            </div>
            
            <Button variant="outline" size="sm" onClick={fetchAllData}>
              <RefreshCw className="h-4 w-4 mr-1" />Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-10 gap-2">
          <div className="bg-[#E0F2F1] rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-[#00897B]">{stats.totalLicenses}</p>
            <p className="text-[10px] text-[#757575]">Total Licenses</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-green-600">{stats.activeLicenses}</p>
            <p className="text-[10px] text-[#757575]">Active</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-amber-600">{stats.expiringLicenses}</p>
            <p className="text-[10px] text-[#757575]">Expiring</p>
          </div>
          <div className="bg-red-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-red-600">{stats.expiredLicenses}</p>
            <p className="text-[10px] text-[#757575]">Expired</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-blue-600">{stats.totalTreatments}</p>
            <p className="text-[10px] text-[#757575]">Treatments</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-purple-600">{stats.todayTreatments}</p>
            <p className="text-[10px] text-[#757575]">Today</p>
          </div>
          <div className="bg-indigo-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-indigo-600">{stats.consentRate}%</p>
            <p className="text-[10px] text-[#757575]">Consent Rate</p>
          </div>
          <div className="bg-teal-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-teal-600">{stats.followUpRate}%</p>
            <p className="text-[10px] text-[#757575]">Follow-up Rate</p>
          </div>
          <div className="bg-cyan-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-cyan-600">{stats.totalProfiles}</p>
            <p className="text-[10px] text-[#757575]">Allergy Profiles</p>
          </div>
          <div className="bg-rose-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-rose-600">{stats.criticalAllergies}</p>
            <p className="text-[10px] text-[#757575]">Critical</p>
          </div>
        </div>
      </div>

      {/* Expiring Soon Alert */}
      {expiringLicenses.filter(l => !l.isExpired).length > 0 && (
        <div className="p-4">
          <Alert className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Licenses Expiring Soon</AlertTitle>
            <AlertDescription className="text-amber-700">
              <div className="mt-2 flex flex-wrap gap-2">
                {expiringLicenses.filter(l => !l.isExpired).map(license => (
                  <Badge key={license.id} className="bg-amber-100 text-amber-700">
                    {license.practitionerName} ({license.licenseType}) - {license.daysUntilExpiry} days
                  </Badge>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Tabs */}
      <div className="flex-1 flex flex-col min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="bg-white border-b border-gray-200 px-4">
            <TabsList className="bg-transparent h-12">
              <TabsTrigger value="overview" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                Overview
              </TabsTrigger>
              <TabsTrigger value="licenses" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Award className="h-4 w-4 mr-1" />Practitioner Licenses
              </TabsTrigger>
              <TabsTrigger value="treatments" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <FileText className="h-4 w-4 mr-1" />Treatment Records
              </TabsTrigger>
              <TabsTrigger value="allergies" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Heart className="h-4 w-4 mr-1" />Allergy Profiles
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-4">
            {/* Overview Tab */}
            <TabsContent value="overview" className="m-0">
              <div className="grid grid-cols-2 gap-4">
                {/* License Summary */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Award className="h-5 w-5 text-[#00897B]" />
                      License Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#757575]">Compliance Rate</span>
                        <span className="font-bold text-[#00897B]">{calculateComplianceScore()}%</span>
                      </div>
                      <Progress value={calculateComplianceScore()} className="h-2" />
                      
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="p-3 bg-green-50 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{stats.activeLicenses}</p>
                          <p className="text-xs text-[#757575]">Active Licenses</p>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg">
                          <p className="text-2xl font-bold text-amber-600">{stats.expiringLicenses}</p>
                          <p className="text-xs text-[#757575]">Expiring Soon</p>
                        </div>
                      </div>
                      
                      <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setActiveTab('licenses')}>
                        View All Licenses <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Treatments */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-5 w-5 text-[#00897B]" />
                      Recent Treatments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {treatments.slice(0, 4).map(treatment => (
                        <div key={treatment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{treatment.clientName}</p>
                            <p className="text-xs text-[#757575]">{treatment.serviceName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-[#757575]">{treatment.treatmentDate}</p>
                            {treatment.followUpRequired && (
                              <Badge className="bg-blue-100 text-blue-700 text-[10px]">Follow-up</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => setActiveTab('treatments')}>
                      View All Treatments <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-[#00897B]" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        className="bg-[#00897B] hover:bg-[#00695C] h-auto py-3 flex-col"
                        onClick={() => setLicenseDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4 mb-1" />
                        Add License
                      </Button>
                      <Button 
                        className="bg-[#00897B] hover:bg-[#00695C] h-auto py-3 flex-col"
                        onClick={() => setTreatmentDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4 mb-1" />
                        New Treatment
                      </Button>
                      <Button variant="outline" className="h-auto py-3 flex-col">
                        <FileText className="h-4 w-4 mb-1" />
                        Generate Report
                      </Button>
                      <Button variant="outline" className="h-auto py-3 flex-col">
                        <Download className="h-4 w-4 mb-1" />
                        Export Data
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Critical Allergies Alert */}
                <Card className={stats.criticalAllergies > 0 ? 'border-red-200' : ''}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Heart className="h-5 w-5 text-[#00897B]" />
                      Client Safety Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.criticalAllergies > 0 ? (
                      <div className="space-y-2">
                        {allergyProfiles
                          .filter(p => p.allergies.some(a => a.severity === 'severe'))
                          .slice(0, 3)
                          .map(profile => (
                            <div key={profile.id} className="p-2 bg-red-50 rounded-lg border border-red-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-sm text-red-800">{profile.clientName}</p>
                                  <p className="text-xs text-red-600">
                                    {profile.allergies.filter(a => a.severity === 'severe').map(a => a.name).join(', ')}
                                  </p>
                                </div>
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-[#757575]">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                        <p>No critical allergy alerts</p>
                      </div>
                    )}
                    
                    <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => setActiveTab('allergies')}>
                      View All Profiles <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Licenses Tab */}
            <TabsContent value="licenses" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                    <Input
                      placeholder="Search by name or license number..."
                      value={licenseSearch}
                      onChange={(e) => setLicenseSearch(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <Select value={licenseFilter} onValueChange={setLicenseFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="revoked">Revoked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setLicenseDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />Add License
                </Button>
              </div>
              
              <div className="bg-white rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Practitioner</TableHead>
                      <TableHead>License Type</TableHead>
                      <TableHead>License Number</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Days Left</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLicenses.map(license => (
                      <TableRow key={license.id} className={license.isExpired ? 'bg-red-50/50' : license.isExpiringSoon ? 'bg-amber-50/50' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={license.practitionerPhoto} alt={license.practitionerName} />
                              <AvatarFallback>{license.practitionerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{license.practitionerName}</p>
                              <p className="text-xs text-[#757575]">{license.issuingBody}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-[#E0F2F1] text-[#00897B]">
                            {licenseTypeLabels[license.licenseType]}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">{license.licenseNumber}</TableCell>
                        <TableCell>{new Date(license.issueDate).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(license.expiryDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className={`font-bold ${getExpiryColor(license.daysUntilExpiry)}`}>
                            {license.daysUntilExpiry <= 0 ? 'Expired' : `${license.daysUntilExpiry}d`}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${licenseStatusColors[license.status].bg} ${licenseStatusColors[license.status].text}`}>
                            {license.status.charAt(0).toUpperCase() + license.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedLicense(license)
                                setLicenseDetailOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            {license.isExpiringSoon && !license.isExpired && (
                              <Button variant="ghost" size="sm" className="text-amber-600">
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            )}
                            {license.documentUrl && (
                              <Button variant="ghost" size="sm">
                                <FileText className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {filteredLicenses.length === 0 && (
                <div className="text-center py-12 text-[#757575]">
                  <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No licenses found</p>
                </div>
              )}
            </TabsContent>

            {/* Treatments Tab */}
            <TabsContent value="treatments" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                    <Input
                      placeholder="Search by client, practitioner, or service..."
                      value={treatmentSearch}
                      onChange={(e) => setTreatmentSearch(e.target.value)}
                      className="pl-9 w-80"
                    />
                  </div>
                  <Select value={treatmentFilter} onValueChange={setTreatmentFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Hair">Hair</SelectItem>
                      <SelectItem value="Skin">Skin</SelectItem>
                      <SelectItem value="Nails">Nails</SelectItem>
                      <SelectItem value="Massage">Massage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setTreatmentDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />New Treatment
                </Button>
              </div>
              
              <div className="bg-white rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Practitioner</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Consent</TableHead>
                      <TableHead>Follow-up</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTreatments.map(treatment => (
                      <TableRow key={treatment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{treatment.clientName}</p>
                            <p className="text-xs text-[#757575]">{treatment.clientPhone}</p>
                          </div>
                        </TableCell>
                        <TableCell>{treatment.practitionerName}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{treatment.serviceName}</p>
                            <Badge variant="outline" className="text-[10px]">{treatment.serviceCategory}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{new Date(treatment.treatmentDate).toLocaleDateString()}</p>
                            <p className="text-xs text-[#757575]">{treatment.treatmentTime}</p>
                          </div>
                        </TableCell>
                        <TableCell>{treatment.duration} min</TableCell>
                        <TableCell>
                          {treatment.consentObtained ? (
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle className="h-3 w-3 mr-1" />Obtained
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700">
                              <XCircle className="h-3 w-3 mr-1" />Missing
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {treatment.followUpRequired ? (
                            <Badge className="bg-blue-100 text-blue-700">
                              <Calendar className="h-3 w-3 mr-1" />
                              {treatment.followUpDate ? new Date(treatment.followUpDate).toLocaleDateString() : 'Scheduled'}
                            </Badge>
                          ) : (
                            <span className="text-[#757575]">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedTreatment(treatment)
                                setTreatmentDetailOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Printer className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {filteredTreatments.length === 0 && (
                <div className="text-center py-12 text-[#757575]">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No treatment records found</p>
                </div>
              )}
            </TabsContent>

            {/* Allergy Profiles Tab */}
            <TabsContent value="allergies" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                  <Input
                    placeholder="Search by client name..."
                    value={profileSearch}
                    onChange={(e) => setProfileSearch(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <Button className="bg-[#00897B] hover:bg-[#00695C]">
                  <Plus className="h-4 w-4 mr-2" />Add Profile
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {filteredProfiles.map(profile => (
                  <Card 
                    key={profile.id} 
                    className={profile.allergies.some(a => a.severity === 'severe') ? 'border-red-300' : ''}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{profile.clientName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{profile.clientName}</p>
                            <p className="text-xs text-[#757575]">{profile.clientPhone}</p>
                          </div>
                        </div>
                        <Badge className={`${skinTypeColors[profile.skinType].bg} ${skinTypeColors[profile.skinType].text}`}>
                          <Droplets className="h-3 w-3 mr-1" />
                          {skinTypeLabels[profile.skinType]} Skin
                        </Badge>
                      </div>
                      
                      {profile.allergies.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-[#757575] mb-1">Allergies</p>
                          <div className="flex flex-wrap gap-1">
                            {profile.allergies.map((allergy, idx) => (
                              <Badge 
                                key={idx} 
                                className={`${severityColors[allergy.severity]?.bg || 'bg-gray-100'} ${severityColors[allergy.severity]?.text || 'text-gray-700'}`}
                              >
                                {allergy.name} ({allergy.severity})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {profile.sensitivities.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-[#757575] mb-1">Sensitivities</p>
                          <div className="flex flex-wrap gap-1">
                            {profile.sensitivities.map((sensitivity, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {sensitivity.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {profile.medicalConditions.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-[#757575] mb-1">Medical Conditions</p>
                          <p className="text-sm">{profile.medicalConditions.join(', ')}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="text-xs text-[#757575]">
                          Emergency: {profile.emergencyContact}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedProfile(profile)
                            setProfileDetailOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />View Full Profile
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {filteredProfiles.length === 0 && (
                <div className="text-center py-12 text-[#757575]">
                  <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No allergy profiles found</p>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>

      {/* Add License Dialog */}
      <Dialog open={licenseDialogOpen} onOpenChange={setLicenseDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Practitioner License</DialogTitle>
            <DialogDescription>
              Register a new practitioner license for compliance tracking
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Practitioner Name *</Label>
                <Input 
                  value={newLicense.practitionerName}
                  onChange={(e) => setNewLicense(prev => ({ ...prev, practitionerName: e.target.value }))}
                  placeholder="Full name"
                />
              </div>
              <div>
                <Label>License Type *</Label>
                <Select 
                  value={newLicense.licenseType}
                  onValueChange={(v) => setNewLicense(prev => ({ ...prev, licenseType: v as LicenseType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hairdresser">Hairdresser</SelectItem>
                    <SelectItem value="beautician">Beautician</SelectItem>
                    <SelectItem value="nail_technician">Nail Technician</SelectItem>
                    <SelectItem value="aesthetician">Aesthetician</SelectItem>
                    <SelectItem value="massage_therapist">Massage Therapist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>License Number *</Label>
                <Input 
                  value={newLicense.licenseNumber}
                  onChange={(e) => setNewLicense(prev => ({ ...prev, licenseNumber: e.target.value }))}
                  placeholder="e.g., HBD-2024-001234"
                />
              </div>
              <div>
                <Label>Issuing Body</Label>
                <Input 
                  value={newLicense.issuingBody}
                  onChange={(e) => setNewLicense(prev => ({ ...prev, issuingBody: e.target.value }))}
                  placeholder="Certifying organization"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Issue Date</Label>
                <Input 
                  type="date"
                  value={newLicense.issueDate}
                  onChange={(e) => setNewLicense(prev => ({ ...prev, issueDate: e.target.value }))}
                />
              </div>
              <div>
                <Label>Expiry Date *</Label>
                <Input 
                  type="date"
                  value={newLicense.expiryDate}
                  onChange={(e) => setNewLicense(prev => ({ ...prev, expiryDate: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <Label>Document URL</Label>
              <Input 
                value={newLicense.documentUrl}
                onChange={(e) => setNewLicense(prev => ({ ...prev, documentUrl: e.target.value }))}
                placeholder="Link to license document"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setLicenseDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={createLicense} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add License
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Treatment Record Dialog */}
      <Dialog open={treatmentDialogOpen} onOpenChange={setTreatmentDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Treatment Record</DialogTitle>
            <DialogDescription>
              Record a new treatment with client details, products used, and consent
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Client Name *</Label>
                <Input 
                  value={newTreatment.clientName}
                  onChange={(e) => setNewTreatment(prev => ({ ...prev, clientName: e.target.value }))}
                  placeholder="Full name"
                />
              </div>
              <div>
                <Label>Client Phone</Label>
                <Input 
                  value={newTreatment.clientPhone}
                  onChange={(e) => setNewTreatment(prev => ({ ...prev, clientPhone: e.target.value }))}
                  placeholder="+27 XX XXX XXXX"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Practitioner *</Label>
                <Input 
                  value={newTreatment.practitionerName}
                  onChange={(e) => setNewTreatment(prev => ({ ...prev, practitionerName: e.target.value }))}
                  placeholder="Practitioner name"
                />
              </div>
              <div>
                <Label>Service Category</Label>
                <Select 
                  value={newTreatment.serviceCategory}
                  onValueChange={(v) => setNewTreatment(prev => ({ ...prev, serviceCategory: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hair">Hair</SelectItem>
                    <SelectItem value="Skin">Skin</SelectItem>
                    <SelectItem value="Nails">Nails</SelectItem>
                    <SelectItem value="Massage">Massage</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Service Name *</Label>
                <Input 
                  value={newTreatment.serviceName}
                  onChange={(e) => setNewTreatment(prev => ({ ...prev, serviceName: e.target.value }))}
                  placeholder="e.g., Full Highlights"
                />
              </div>
              <div>
                <Label>Treatment Date *</Label>
                <Input 
                  type="date"
                  value={newTreatment.treatmentDate}
                  onChange={(e) => setNewTreatment(prev => ({ ...prev, treatmentDate: e.target.value }))}
                />
              </div>
              <div>
                <Label>Time</Label>
                <Input 
                  type="time"
                  value={newTreatment.treatmentTime}
                  onChange={(e) => setNewTreatment(prev => ({ ...prev, treatmentTime: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duration (minutes)</Label>
                <Input 
                  type="number"
                  value={newTreatment.duration}
                  onChange={(e) => setNewTreatment(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label>Total Price (R)</Label>
                <Input 
                  type="number"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div>
              <Label>Products Used (JSON format)</Label>
              <Textarea 
                value={newTreatment.productsUsed}
                onChange={(e) => setNewTreatment(prev => ({ ...prev, productsUsed: e.target.value }))}
                placeholder='[{"name": "Product Name", "quantity": 1, "unit": "application"}]'
                className="font-mono text-sm"
              />
            </div>
            
            <div>
              <Label>Pre-Treatment Notes</Label>
              <Textarea 
                value={newTreatment.preTreatmentNotes}
                onChange={(e) => setNewTreatment(prev => ({ ...prev, preTreatmentNotes: e.target.value }))}
                placeholder="Client concerns, skin/hair condition, previous treatments..."
              />
            </div>
            
            <div>
              <Label>Post-Treatment Notes</Label>
              <Textarea 
                value={newTreatment.postTreatmentNotes}
                onChange={(e) => setNewTreatment(prev => ({ ...prev, postTreatmentNotes: e.target.value }))}
                placeholder="Treatment results, recommendations, aftercare instructions..."
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="consent"
                  checked={newTreatment.consentObtained}
                  onCheckedChange={(checked) => setNewTreatment(prev => ({ ...prev, consentObtained: checked as boolean }))}
                />
                <Label htmlFor="consent" className="text-sm font-medium">
                  Consent obtained from client *
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="followup"
                  checked={newTreatment.followUpRequired}
                  onCheckedChange={(checked) => setNewTreatment(prev => ({ ...prev, followUpRequired: checked as boolean }))}
                />
                <Label htmlFor="followup" className="text-sm font-medium">
                  Follow-up required
                </Label>
              </div>
            </div>
            
            {newTreatment.followUpRequired && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Follow-up Date</Label>
                  <Input 
                    type="date"
                    value={newTreatment.followUpDate}
                    onChange={(e) => setNewTreatment(prev => ({ ...prev, followUpDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Follow-up Reason</Label>
                  <Input 
                    value={newTreatment.followUpReason}
                    onChange={(e) => setNewTreatment(prev => ({ ...prev, followUpReason: e.target.value }))}
                    placeholder="e.g., Color check, post-peel assessment"
                  />
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Before Photos (comma-separated URLs)</Label>
                <Input 
                  value={newTreatment.beforePhotos}
                  onChange={(e) => setNewTreatment(prev => ({ ...prev, beforePhotos: e.target.value }))}
                  placeholder="url1.jpg, url2.jpg"
                />
              </div>
              <div>
                <Label>After Photos (comma-separated URLs)</Label>
                <Input 
                  value={newTreatment.afterPhotos}
                  onChange={(e) => setNewTreatment(prev => ({ ...prev, afterPhotos: e.target.value }))}
                  placeholder="url1.jpg, url2.jpg"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setTreatmentDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={createTreatment} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* License Detail Dialog */}
      <Dialog open={licenseDetailOpen} onOpenChange={setLicenseDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>License Details</DialogTitle>
          </DialogHeader>
          
          {selectedLicense && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedLicense.practitionerPhoto} alt={selectedLicense.practitionerName} />
                  <AvatarFallback>{selectedLicense.practitionerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedLicense.practitionerName}</h3>
                  <Badge className={`${licenseStatusColors[selectedLicense.status].bg} ${licenseStatusColors[selectedLicense.status].text}`}>
                    {selectedLicense.status.charAt(0).toUpperCase() + selectedLicense.status.slice(1)}
                  </Badge>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#757575]">License Type</p>
                  <p className="font-medium">{licenseTypeLabels[selectedLicense.licenseType]}</p>
                </div>
                <div>
                  <p className="text-[#757575]">License Number</p>
                  <p className="font-medium font-mono">{selectedLicense.licenseNumber}</p>
                </div>
                <div>
                  <p className="text-[#757575]">Issuing Body</p>
                  <p className="font-medium">{selectedLicense.issuingBody}</p>
                </div>
                <div>
                  <p className="text-[#757575]">Days Until Expiry</p>
                  <p className={`font-bold ${getExpiryColor(selectedLicense.daysUntilExpiry)}`}>
                    {selectedLicense.daysUntilExpiry <= 0 ? 'Expired' : `${selectedLicense.daysUntilExpiry} days`}
                  </p>
                </div>
                <div>
                  <p className="text-[#757575]">Issue Date</p>
                  <p className="font-medium">{new Date(selectedLicense.issueDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-[#757575]">Expiry Date</p>
                  <p className="font-medium">{new Date(selectedLicense.expiryDate).toLocaleDateString()}</p>
                </div>
              </div>
              
              {selectedLicense.specializations.length > 0 && (
                <div>
                  <p className="text-sm text-[#757575] mb-2">Specializations</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedLicense.specializations.map((spec, idx) => (
                      <Badge key={idx} variant="outline">{spec}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedLicense.documentUrl && (
                <Button variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  View License Document
                </Button>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setLicenseDetailOpen(false)}>Close</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">
              <Edit className="h-4 w-4 mr-2" />Edit License
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Treatment Detail Dialog */}
      <Dialog open={treatmentDetailOpen} onOpenChange={setTreatmentDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Treatment Record Details</DialogTitle>
          </DialogHeader>
          
          {selectedTreatment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-[#757575]">Client</p>
                    <p className="font-semibold">{selectedTreatment.clientName}</p>
                    <p className="text-sm text-[#757575]">{selectedTreatment.clientPhone}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-[#757575]">Practitioner</p>
                    <p className="font-semibold">{selectedTreatment.practitionerName}</p>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#757575]">Service</p>
                      <p className="font-semibold">{selectedTreatment.serviceName}</p>
                    </div>
                    <Badge variant="outline">{selectedTreatment.serviceCategory}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                    <div>
                      <p className="text-xs text-[#757575]">Date</p>
                      <p>{new Date(selectedTreatment.treatmentDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#757575]">Time</p>
                      <p>{selectedTreatment.treatmentTime}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#757575]">Duration</p>
                      <p>{selectedTreatment.duration} min</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {selectedTreatment.productsUsed.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Products Used</p>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                    {selectedTreatment.productsUsed.map((product, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{product.name}</span>
                        <span className="text-[#757575]">{product.quantity} {product.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedTreatment.preTreatmentNotes && (
                <div>
                  <p className="text-sm font-medium mb-2">Pre-Treatment Notes</p>
                  <p className="text-sm text-[#757575] bg-gray-50 rounded-lg p-3">{selectedTreatment.preTreatmentNotes}</p>
                </div>
              )}
              
              {selectedTreatment.postTreatmentNotes && (
                <div>
                  <p className="text-sm font-medium mb-2">Post-Treatment Notes</p>
                  <p className="text-sm text-[#757575] bg-gray-50 rounded-lg p-3">{selectedTreatment.postTreatmentNotes}</p>
                </div>
              )}
              
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${selectedTreatment.consentObtained ? 'bg-green-50' : 'bg-red-50'}`}>
                  {selectedTreatment.consentObtained ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm ${selectedTreatment.consentObtained ? 'text-green-700' : 'text-red-700'}`}>
                    Consent {selectedTreatment.consentObtained ? 'Obtained' : 'Missing'}
                  </span>
                </div>
                
                {selectedTreatment.followUpRequired && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-700">
                      Follow-up: {selectedTreatment.followUpDate ? new Date(selectedTreatment.followUpDate).toLocaleDateString() : 'Scheduled'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setTreatmentDetailOpen(false)}>Close</Button>
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />Print
            </Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">
              <Edit className="h-4 w-4 mr-2" />Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Allergy Profile Detail Dialog */}
      <Dialog open={profileDetailOpen} onOpenChange={setProfileDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Allergy Profile</DialogTitle>
          </DialogHeader>
          
          {selectedProfile && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{selectedProfile.clientName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedProfile.clientName}</h3>
                    <p className="text-sm text-[#757575]">{selectedProfile.clientPhone}</p>
                  </div>
                </div>
                <Badge className={`${skinTypeColors[selectedProfile.skinType].bg} ${skinTypeColors[selectedProfile.skinType].text}`}>
                  <Droplets className="h-3 w-3 mr-1" />
                  {skinTypeLabels[selectedProfile.skinType]} Skin
                </Badge>
              </div>
              
              <Separator />
              
              {selectedProfile.allergies.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    Allergies ({selectedProfile.allergies.length})
                  </p>
                  <div className="space-y-2">
                    {selectedProfile.allergies.map((allergy, idx) => (
                      <div key={idx} className={`p-3 rounded-lg ${severityColors[allergy.severity]?.bg || 'bg-gray-50'}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{allergy.name}</span>
                          <Badge className={`${severityColors[allergy.severity]?.bg || 'bg-gray-100'} ${severityColors[allergy.severity]?.text || 'text-gray-700'}`}>
                            {allergy.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-[#757575] mt-1">Reaction: {allergy.reaction}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedProfile.sensitivities.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Sensitivities</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedProfile.sensitivities.map((sensitivity, idx) => (
                      <div key={idx} className="p-2 bg-gray-50 rounded-lg">
                        <p className="font-medium text-sm">{sensitivity.name}</p>
                        <p className="text-xs text-[#757575]">{sensitivity.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedProfile.previousReactions.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Previous Reactions</p>
                  <div className="space-y-2">
                    {selectedProfile.previousReactions.map((reaction, idx) => (
                      <div key={idx} className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{reaction.product}</span>
                          <span className="text-xs text-[#757575]">{new Date(reaction.date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-red-700">{reaction.reaction}</p>
                        <p className="text-xs text-[#757575] mt-1">Treatment: {reaction.treatment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedProfile.medicalConditions.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Medical Conditions</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.medicalConditions.map((condition, idx) => (
                      <Badge key={idx} variant="outline">{condition}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedProfile.medications.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Current Medications</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.medications.map((medication, idx) => (
                      <Badge key={idx} variant="outline">{medication}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedProfile.notes && (
                <div>
                  <p className="text-sm font-medium mb-2">Additional Notes</p>
                  <p className="text-sm text-[#757575] bg-amber-50 rounded-lg p-3 border border-amber-200">{selectedProfile.notes}</p>
                </div>
              )}
              
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-600 font-medium">Emergency Contact</p>
                <p className="text-sm text-blue-800">{selectedProfile.emergencyContact}</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileDetailOpen(false)}>Close</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">
              <Edit className="h-4 w-4 mr-2" />Edit Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
