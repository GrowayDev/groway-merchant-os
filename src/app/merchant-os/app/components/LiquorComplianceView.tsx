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
import { Switch } from '@/components/ui/switch'
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
import { toast } from 'sonner'
import {
  ShieldCheck,
  UserCheck,
  Clock,
  FileText,
  AlertTriangle,
  Calendar,
  CreditCard,
  IdCard,
  Wine,
  Beer,
  GlassWater,
  FlaskConical,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  History,
  Users,
  Building2,
  FileWarning,
  Timer,
  Lock,
  Unlock,
  BadgeCheck,
  Ban,
  Loader2,
} from 'lucide-react'

// Types
type DocumentType = 'id_card' | 'passport' | 'drivers_license'
type VerificationMethod = 'manual' | 'scanner' | 'app'
type LicenseStatus = 'active' | 'suspended' | 'revoked' | 'expired' | 'pending_renewal'
type AlertType = 'underage' | 'banned' | 'restricted'

interface AgeVerification {
  id: string
  verificationId: string
  documentType: DocumentType
  documentNumber?: string
  customerName?: string
  dateOfBirth: string
  ageVerified: boolean
  verificationMethod: VerificationMethod
  verifiedByName?: string
  confidence?: number
  productName?: string
  flagged: boolean
  flagReason?: string
  createdAt: string
}

interface TradingHour {
  id: string
  dayOfWeek: number
  openTime: string
  closeTime: string
  licenseType: string
  isActive: boolean
}

interface TradingHoursCheck {
  canSell: boolean
  reason: string
  openTime?: string
  closeTime?: string
  currentTime?: string
  type: string
}

interface LiquorLicense {
  id: string
  licenseNumber: string
  licenseType: string
  licenseHolder: string
  tradingName?: string
  issueDate: string
  expiryDate: string
  status: LicenseStatus
  premisesAddress?: string
  managerName?: string
  isExpired: boolean
  daysUntilExpiry: number
}

interface RSACertification {
  id: string
  staffName: string
  rsaNumber: string
  certificateType: string
  issueDate: string
  expiryDate: string
  status: string
  isExpired: boolean
  daysUntilExpiry: number
}

interface CustomerAlert {
  id: string
  alertType: AlertType
  customerName?: string
  reason: string
  source: string
  startDate: string
  endDate?: string
  isActive: boolean
}

interface Violation {
  id: string
  violationId: string
  type: string
  occurredAt: string
  productName?: string
  blocked: boolean
  resolved: boolean
  overriddenBy?: string
}

interface ExciseEntry {
  id: string
  entryNumber: string
  entryType: string
  entryDate: string
  productName: string
  productCategory: string
  volumeLiters: number
  alcoholLiters: number
  dutyAmount: number
}

// Day names
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function LiquorComplianceView() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Data states
  const [tradingHoursCheck, setTradingHoursCheck] = useState<TradingHoursCheck | null>(null)
  const [ageVerifications, setAgeVerifications] = useState<AgeVerification[]>([])
  const [tradingHours, setTradingHours] = useState<TradingHour[]>([])
  const [licenses, setLicenses] = useState<LiquorLicense[]>([])
  const [rsaCerts, setRsaCerts] = useState<RSACertification[]>([])
  const [alerts, setAlerts] = useState<CustomerAlert[]>([])
  const [violations, setViolations] = useState<Violation[]>([])
  const [exciseEntries, setExciseEntries] = useState<ExciseEntry[]>([])
  
  // Dialog states
  const [ageVerifyDialogOpen, setAgeVerifyDialogOpen] = useState(false)
  const [licenseDialogOpen, setLicenseDialogOpen] = useState(false)
  const [rsaDialogOpen, setRsaDialogOpen] = useState(false)
  const [alertDialogOpen, setAlertDialogOpen] = useState(false)
  const [tradingHoursDialogOpen, setTradingHoursDialogOpen] = useState(false)
  
  // Form states
  const [newVerification, setNewVerification] = useState({
    documentType: 'id_card' as DocumentType,
    documentNumber: '',
    customerName: '',
    dateOfBirth: '',
    verificationMethod: 'manual' as VerificationMethod,
    productName: '',
  })
  
  const [newLicense, setNewLicense] = useState({
    licenseNumber: '',
    licenseType: 'on_consumption',
    licenseHolder: '',
    tradingName: '',
    issueDate: '',
    expiryDate: '',
    premisesAddress: '',
    managerName: '',
  })
  
  const [newRsa, setNewRsa] = useState({
    staffName: '',
    rsaNumber: '',
    certificateType: 'standard',
    issueDate: '',
    expiryDate: '',
    issuingBody: '',
  })
  
  const [newAlert, setNewAlert] = useState({
    alertType: 'underage' as AlertType,
    customerName: '',
    reason: '',
    source: 'internal',
  })
  
  const [saving, setSaving] = useState(false)
  const [dateOfBirthInput, setDateOfBirthInput] = useState('')
  const [ageResult, setAgeResult] = useState<{ age: number; isAdult: boolean } | null>(null)

  // Update time
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Fetch data on mount
  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchTradingHoursCheck(),
        fetchAgeVerifications(),
        fetchTradingHours(),
        fetchLicenses(),
        fetchRsaCerts(),
        fetchAlerts(),
        fetchViolations(),
        fetchExciseEntries(),
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchTradingHoursCheck = async () => {
    try {
      const res = await fetch('/merchant-os/api/liquor-compliance/trading-hours/check')
      if (res.ok) {
        const data = await res.json()
        setTradingHoursCheck(data)
      }
    } catch (error) {
      console.error('Error fetching trading hours check:', error)
    }
  }

  const fetchAgeVerifications = async () => {
    try {
      const res = await fetch('/merchant-os/api/liquor-compliance/age-verifications?limit=10')
      if (res.ok) {
        const data = await res.json()
        setAgeVerifications(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching age verifications:', error)
    }
  }

  const fetchTradingHours = async () => {
    try {
      const res = await fetch('/merchant-os/api/liquor-compliance/trading-hours')
      if (res.ok) {
        const data = await res.json()
        setTradingHours(data.tradingHours || [])
      }
    } catch (error) {
      console.error('Error fetching trading hours:', error)
    }
  }

  const fetchLicenses = async () => {
    try {
      const res = await fetch('/merchant-os/api/liquor-compliance/licenses')
      if (res.ok) {
        const data = await res.json()
        setLicenses(data || [])
      }
    } catch (error) {
      console.error('Error fetching licenses:', error)
    }
  }

  const fetchRsaCerts = async () => {
    try {
      const res = await fetch('/merchant-os/api/liquor-compliance/rsa')
      if (res.ok) {
        const data = await res.json()
        setRsaCerts(data || [])
      }
    } catch (error) {
      console.error('Error fetching RSA certs:', error)
    }
  }

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/merchant-os/api/liquor-compliance/alerts?active=true')
      if (res.ok) {
        const data = await res.json()
        setAlerts(data || [])
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
    }
  }

  const fetchViolations = async () => {
    try {
      const res = await fetch('/merchant-os/api/liquor-compliance/violations?limit=10')
      if (res.ok) {
        const data = await res.json()
        setViolations(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching violations:', error)
    }
  }

  const fetchExciseEntries = async () => {
    try {
      const res = await fetch('/merchant-os/api/liquor-compliance/excise?limit=10')
      if (res.ok) {
        const data = await res.json()
        setExciseEntries(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching excise entries:', error)
    }
  }

  // Calculate age from DOB
  const calculateAge = (dob: string) => {
    if (!dob) return null
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return { age, isAdult: age >= 18 }
  }

  // Handle DOB input change
  const handleDobChange = (value: string) => {
    setDateOfBirthInput(value)
    setNewVerification(prev => ({ ...prev, dateOfBirth: value }))
    const result = calculateAge(value)
    setAgeResult(result)
  }

  // Create age verification
  const createAgeVerification = async () => {
    if (!newVerification.dateOfBirth) {
      toast.error('Date of birth is required')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/merchant-os/api/liquor-compliance/age-verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newVerification,
          ageVerified: ageResult?.isAdult ?? false,
          flagged: !ageResult?.isAdult,
          flagReason: !ageResult?.isAdult ? 'Underage customer' : undefined,
        }),
      })
      
      if (!res.ok) throw new Error('Failed to create verification')
      
      toast.success(ageResult?.isAdult ? 'Age verified - Customer is 18+' : 'Customer is underage - Sale blocked')
      setAgeVerifyDialogOpen(false)
      setNewVerification({
        documentType: 'id_card',
        documentNumber: '',
        customerName: '',
        dateOfBirth: '',
        verificationMethod: 'manual',
        productName: '',
      })
      setDateOfBirthInput('')
      setAgeResult(null)
      fetchAgeVerifications()
    } catch (error) {
      console.error('Error creating verification:', error)
      toast.error('Failed to create verification')
    } finally {
      setSaving(false)
    }
  }

  // Create license
  const createLicense = async () => {
    if (!newLicense.licenseNumber || !newLicense.licenseHolder || !newLicense.expiryDate) {
      toast.error('Please fill all required fields')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/merchant-os/api/liquor-compliance/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLicense),
      })
      
      if (!res.ok) throw new Error('Failed to create license')
      
      toast.success('License created successfully')
      setLicenseDialogOpen(false)
      setNewLicense({
        licenseNumber: '',
        licenseType: 'on_consumption',
        licenseHolder: '',
        tradingName: '',
        issueDate: '',
        expiryDate: '',
        premisesAddress: '',
        managerName: '',
      })
      fetchLicenses()
    } catch (error) {
      console.error('Error creating license:', error)
      toast.error('Failed to create license')
    } finally {
      setSaving(false)
    }
  }

  // Create RSA certification
  const createRsa = async () => {
    if (!newRsa.staffName || !newRsa.rsaNumber || !newRsa.expiryDate) {
      toast.error('Please fill all required fields')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/merchant-os/api/liquor-compliance/rsa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRsa),
      })
      
      if (!res.ok) throw new Error('Failed to create RSA certification')
      
      toast.success('RSA certification added successfully')
      setRsaDialogOpen(false)
      setNewRsa({
        staffName: '',
        rsaNumber: '',
        certificateType: 'standard',
        issueDate: '',
        expiryDate: '',
        issuingBody: '',
      })
      fetchRsaCerts()
    } catch (error) {
      console.error('Error creating RSA:', error)
      toast.error('Failed to create RSA certification')
    } finally {
      setSaving(false)
    }
  }

  // Create customer alert
  const createAlert = async () => {
    if (!newAlert.customerName || !newAlert.reason) {
      toast.error('Please fill all required fields')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/merchant-os/api/liquor-compliance/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAlert),
      })
      
      if (!res.ok) throw new Error('Failed to create alert')
      
      toast.success('Customer alert created')
      setAlertDialogOpen(false)
      setNewAlert({
        alertType: 'underage',
        customerName: '',
        reason: '',
        source: 'internal',
      })
      fetchAlerts()
    } catch (error) {
      console.error('Error creating alert:', error)
      toast.error('Failed to create alert')
    } finally {
      setSaving(false)
    }
  }

  // Stats
  const stats = {
    verificationsToday: ageVerifications.filter(v => 
      new Date(v.createdAt).toDateString() === new Date().toDateString()
    ).length,
    activeLicenses: licenses.filter(l => !l.isExpired && l.status === 'active').length,
    expiredLicenses: licenses.filter(l => l.isExpired).length,
    activeRsa: rsaCerts.filter(r => !r.isExpired && r.status === 'active').length,
    expiredRsa: rsaCerts.filter(r => r.isExpired).length,
    activeAlerts: alerts.filter(a => a.isActive).length,
    violations: violations.filter(v => !v.resolved).length,
    blockedSales: violations.filter(v => v.blocked).length,
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
              <ShieldCheck className="h-5 w-5 text-[#00897B]" />
              Liquor Compliance
            </h1>
            <p className="text-sm text-[#757575]">Age verification, trading hours, licenses & excise register</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-mono font-bold">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-xs text-[#757575]">{currentTime.toLocaleDateString()}</p>
            </div>
            
            {/* Trading Status */}
            {tradingHoursCheck && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                tradingHoursCheck.canSell ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {tradingHoursCheck.canSell ? (
                  <>
                    <Unlock className="h-5 w-5" />
                    <span className="font-medium">Liquor Sales Allowed</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5" />
                    <span className="font-medium">Sales Restricted</span>
                  </>
                )}
              </div>
            )}
            
            <Button variant="outline" size="sm" onClick={fetchAllData}>
              <RefreshCw className="h-4 w-4 mr-1" />Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-8 gap-3">
          <div className="bg-[#E0F2F1] rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-[#00897B]">{stats.verificationsToday}</p>
            <p className="text-[10px] text-[#757575]">Verifications</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-green-600">{stats.activeLicenses}</p>
            <p className="text-[10px] text-[#757575]">Active Licenses</p>
          </div>
          <div className="bg-red-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-red-600">{stats.expiredLicenses}</p>
            <p className="text-[10px] text-[#757575]">Expired Licenses</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-blue-600">{stats.activeRsa}</p>
            <p className="text-[10px] text-[#757575]">Active RSA</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-amber-600">{stats.expiredRsa}</p>
            <p className="text-[10px] text-[#757575]">Expired RSA</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-purple-600">{stats.activeAlerts}</p>
            <p className="text-[10px] text-[#757575]">Alerts</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-orange-600">{stats.violations}</p>
            <p className="text-[10px] text-[#757575]">Violations</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-gray-600">{stats.blockedSales}</p>
            <p className="text-[10px] text-[#757575]">Blocked</p>
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
              <TabsTrigger value="age-verify" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <UserCheck className="h-4 w-4 mr-1" />Age Verification
              </TabsTrigger>
              <TabsTrigger value="trading-hours" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Clock className="h-4 w-4 mr-1" />Trading Hours
              </TabsTrigger>
              <TabsTrigger value="licenses" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <FileText className="h-4 w-4 mr-1" />Licenses
              </TabsTrigger>
              <TabsTrigger value="excise" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <FlaskConical className="h-4 w-4 mr-1" />Excise Register
              </TabsTrigger>
              <TabsTrigger value="rsa" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <BadgeCheck className="h-4 w-4 mr-1" />RSA Staff
              </TabsTrigger>
              <TabsTrigger value="alerts" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <AlertTriangle className="h-4 w-4 mr-1" />Alerts
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-4">
            {/* Overview Tab */}
            <TabsContent value="overview" className="m-0">
              <div className="grid grid-cols-2 gap-4">
                {/* Quick Age Verify */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-[#00897B]" />
                      Quick Age Verification
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-[#757575]">Document Type</Label>
                          <Select value={newVerification.documentType} onValueChange={(v) => setNewVerification(prev => ({ ...prev, documentType: v as DocumentType }))}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="id_card">ID Card</SelectItem>
                              <SelectItem value="passport">Passport</SelectItem>
                              <SelectItem value="drivers_license">Driver's License</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-[#757575]">Date of Birth</Label>
                          <Input 
                            type="date" 
                            className="mt-1"
                            value={dateOfBirthInput}
                            onChange={(e) => handleDobChange(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      {ageResult && (
                        <div className={`p-3 rounded-lg ${ageResult.isAdult ? 'bg-green-50' : 'bg-red-50'}`}>
                          <div className="flex items-center gap-2">
                            {ageResult.isAdult ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                            <span className={`font-medium ${ageResult.isAdult ? 'text-green-700' : 'text-red-700'}`}>
                              Age: {ageResult.age} years - {ageResult.isAdult ? 'VERIFIED (18+)' : 'UNDERAGE - SALE BLOCKED'}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <Button 
                        className="w-full bg-[#00897B] hover:bg-[#00695C]"
                        onClick={() => setAgeVerifyDialogOpen(true)}
                      >
                        <IdCard className="h-4 w-4 mr-2" />Full Verification
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Trading Status */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-5 w-5 text-[#00897B]" />
                      Current Trading Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {tradingHoursCheck ? (
                      <div className={`p-4 rounded-lg ${tradingHoursCheck.canSell ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {tradingHoursCheck.canSell ? (
                              <Unlock className="h-6 w-6 text-green-600" />
                            ) : (
                              <Lock className="h-6 w-6 text-red-600" />
                            )}
                            <span className={`text-lg font-bold ${tradingHoursCheck.canSell ? 'text-green-700' : 'text-red-700'}`}>
                              {tradingHoursCheck.canSell ? 'LIQUOR SALES ALLOWED' : 'SALES RESTRICTED'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="text-center p-2 bg-white rounded">
                            <p className="text-[#757575]">Current</p>
                            <p className="font-bold">{tradingHoursCheck.currentTime}</p>
                          </div>
                          <div className="text-center p-2 bg-white rounded">
                            <p className="text-[#757575]">Opens</p>
                            <p className="font-bold text-green-600">{tradingHoursCheck.openTime || '--:--'}</p>
                          </div>
                          <div className="text-center p-2 bg-white rounded">
                            <p className="text-[#757575]">Closes</p>
                            <p className="font-bold text-red-600">{tradingHoursCheck.closeTime || '--:--'}</p>
                          </div>
                        </div>
                        
                        <p className="text-xs text-[#757575] mt-2">{tradingHoursCheck.reason}</p>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-[#757575]">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                        <p>No trading hours configured</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* License Status */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-5 w-5 text-[#00897B]" />
                      License Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {licenses.length > 0 ? (
                      <div className="space-y-2">
                        {licenses.slice(0, 3).map(license => (
                          <div key={license.id} className={`p-2 rounded-lg ${license.isExpired ? 'bg-red-50' : license.daysUntilExpiry <= 30 ? 'bg-amber-50' : 'bg-green-50'}`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{license.licenseNumber}</p>
                                <p className="text-xs text-[#757575]">{license.licenseHolder}</p>
                              </div>
                              <div className="text-right">
                                {license.isExpired ? (
                                  <Badge className="bg-red-100 text-red-700">Expired</Badge>
                                ) : license.daysUntilExpiry <= 30 ? (
                                  <Badge className="bg-amber-100 text-amber-700">{license.daysUntilExpiry}d left</Badge>
                                ) : (
                                  <Badge className="bg-green-100 text-green-700">Active</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-[#757575]">
                        <FileWarning className="h-8 w-8 mx-auto mb-2" />
                        <p>No licenses registered</p>
                      </div>
                    )}
                    
                    <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => setActiveTab('licenses')}>
                      View All Licenses
                    </Button>
                  </CardContent>
                </Card>

                {/* Recent Violations */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-[#00897B]" />
                      Recent Violations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {violations.length > 0 ? (
                      <div className="space-y-2">
                        {violations.slice(0, 5).map(violation => (
                          <div key={violation.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-sm">{violation.type}</p>
                              <p className="text-xs text-[#757575]">{new Date(violation.occurredAt).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {violation.blocked ? (
                                <Badge className="bg-red-100 text-red-700">Blocked</Badge>
                              ) : (
                                <Badge className="bg-amber-100 text-amber-700">Override</Badge>
                              )}
                              {violation.resolved && (
                                <Badge className="bg-green-100 text-green-700">Resolved</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-[#757575]">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
                        <p>No violations recorded</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Age Verification Tab */}
            <TabsContent value="age-verify" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Age Verification Records</h2>
                <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setAgeVerifyDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />New Verification
                </Button>
              </div>
              
              <div className="space-y-3">
                {ageVerifications.map(verification => (
                  <Card key={verification.id} className={verification.flagged ? 'border-red-300' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${verification.ageVerified ? 'bg-green-100' : 'bg-red-100'}`}>
                            {verification.ageVerified ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{verification.customerName || 'Unknown Customer'}</p>
                            <p className="text-sm text-[#757575]">
                              DOB: {new Date(verification.dateOfBirth).toLocaleDateString()} · 
                              {verification.documentType.replace('_', ' ').toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            {verification.ageVerified ? (
                              <Badge className="bg-green-100 text-green-700">18+ Verified</Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-700">Underage</Badge>
                            )}
                            {verification.flagged && (
                              <Badge className="bg-amber-100 text-amber-700">
                                <AlertTriangle className="h-3 w-3 mr-1" />Flagged
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-[#757575] mt-1">
                            {new Date(verification.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {verification.productName && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-sm text-[#757575]">Product: {verification.productName}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                
                {ageVerifications.length === 0 && (
                  <div className="text-center py-12 text-[#757575]">
                    <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No age verifications recorded</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Trading Hours Tab */}
            <TabsContent value="trading-hours" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Trading Hours Configuration</h2>
                <Button variant="outline" onClick={() => setTradingHoursDialogOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />Edit Hours
                </Button>
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {dayNames.map((day, index) => {
                  const hours = tradingHours.find(h => h.dayOfWeek === index)
                  return (
                    <Card key={day} className={hours?.isActive ? '' : 'opacity-50'}>
                      <CardHeader className="pb-2 pt-3">
                        <CardTitle className="text-sm text-center">{shortDayNames[index]}</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center pb-3">
                        {hours ? (
                          <div>
                            <p className="font-bold text-green-600">{hours.openTime}</p>
                            <p className="text-xs text-[#757575]">to</p>
                            <p className="font-bold text-red-600">{hours.closeTime}</p>
                            {index === new Date().getDay() && (
                              <Badge className="mt-2 bg-[#00897B] text-white text-[10px]">Today</Badge>
                            )}
                          </div>
                        ) : (
                          <div className="text-[#757575]">
                            <XCircle className="h-5 w-5 mx-auto" />
                            <p className="text-xs mt-1">Closed</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
              
              {/* Violations Log */}
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Recent Trading Violations</h3>
                <div className="space-y-2">
                  {violations.filter(v => v.type.includes('hours') || v.type.includes('trading')).map(violation => (
                    <Card key={violation.id}>
                      <CardContent className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{violation.type}</p>
                          <p className="text-xs text-[#757575]">
                            {new Date(violation.occurredAt).toLocaleString()}
                            {violation.productName && ` · ${violation.productName}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {violation.blocked ? (
                            <Badge className="bg-red-100 text-red-700">Blocked</Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-700">Override</Badge>
                          )}
                          {!violation.resolved && (
                            <Button size="sm" variant="outline">Resolve</Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Licenses Tab */}
            <TabsContent value="licenses" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Liquor Licenses</h2>
                <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setLicenseDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />Add License
                </Button>
              </div>
              
              <div className="space-y-3">
                {licenses.map(license => (
                  <Card key={license.id} className={license.isExpired ? 'border-red-300' : license.daysUntilExpiry <= 30 ? 'border-amber-300' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-lg">{license.licenseNumber}</p>
                            {license.isExpired ? (
                              <Badge className="bg-red-100 text-red-700">Expired</Badge>
                            ) : license.daysUntilExpiry <= 30 ? (
                              <Badge className="bg-amber-100 text-amber-700">Expiring Soon</Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-700">Active</Badge>
                            )}
                          </div>
                          <p className="text-[#757575]">{license.licenseHolder}</p>
                          {license.tradingName && <p className="text-sm text-[#757575]">Trading as: {license.tradingName}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-[#757575]">Type: {license.licenseType.replace('_', ' ')}</p>
                          <p className="text-sm text-[#757575]">Expires: {new Date(license.expiryDate).toLocaleDateString()}</p>
                          {!license.isExpired && (
                            <p className={`text-sm font-medium ${license.daysUntilExpiry <= 30 ? 'text-amber-600' : 'text-green-600'}`}>
                              {license.daysUntilExpiry} days remaining
                            </p>
                          )}
                        </div>
                      </div>
                      {license.premisesAddress && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-sm text-[#757575]">{license.premisesAddress}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                
                {licenses.length === 0 && (
                  <div className="text-center py-12 text-[#757575]">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No liquor licenses registered</p>
                    <p className="text-sm">Add your license to enable tracking and renewal reminders</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Excise Register Tab */}
            <TabsContent value="excise" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Excise Register</h2>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />Export
                  </Button>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />Add Entry
                  </Button>
                </div>
              </div>
              
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                <Card>
                  <CardContent className="p-3 text-center">
                    <Wine className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                    <p className="text-lg font-bold">1,250L</p>
                    <p className="text-xs text-[#757575]">Wine Volume</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <Beer className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                    <p className="text-lg font-bold">3,400L</p>
                    <p className="text-xs text-[#757575]">Beer Volume</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <GlassWater className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                    <p className="text-lg font-bold">850L</p>
                    <p className="text-xs text-[#757575]">Spirits Volume</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <FlaskConical className="h-5 w-5 mx-auto mb-1 text-green-500" />
                    <p className="text-lg font-bold">R45,230</p>
                    <p className="text-xs text-[#757575]">Total Duty</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Entries Table */}
              <div className="bg-white rounded-lg border">
                <div className="grid grid-cols-6 gap-4 p-3 border-b bg-gray-50 text-sm font-medium text-[#757575]">
                  <div>Date</div>
                  <div>Type</div>
                  <div>Product</div>
                  <div>Volume</div>
                  <div>Alcohol L</div>
                  <div>Duty</div>
                </div>
                {exciseEntries.map(entry => (
                  <div key={entry.id} className="grid grid-cols-6 gap-4 p-3 border-b text-sm">
                    <div>{new Date(entry.entryDate).toLocaleDateString()}</div>
                    <div>
                      <Badge variant="outline" className={
                        entry.entryType === 'receipt' ? 'text-green-600' :
                        entry.entryType === 'sale' ? 'text-blue-600' :
                        'text-amber-600'
                      }>
                        {entry.entryType}
                      </Badge>
                    </div>
                    <div>{entry.productName}</div>
                    <div>{entry.volumeLiters.toFixed(2)}L</div>
                    <div>{entry.alcoholLiters.toFixed(2)}L</div>
                    <div>R{entry.dutyAmount.toFixed(2)}</div>
                  </div>
                ))}
                {exciseEntries.length === 0 && (
                  <div className="p-8 text-center text-[#757575]">
                    <FlaskConical className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No excise entries recorded</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* RSA Staff Tab */}
            <TabsContent value="rsa" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">RSA Certified Staff</h2>
                <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setRsaDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />Add Certification
                </Button>
              </div>
              
              <div className="space-y-3">
                {rsaCerts.map(cert => (
                  <Card key={cert.id} className={cert.isExpired ? 'border-red-300' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${cert.isExpired ? 'bg-red-100' : 'bg-green-100'}`}>
                            <BadgeCheck className={`h-5 w-5 ${cert.isExpired ? 'text-red-600' : 'text-green-600'}`} />
                          </div>
                          <div>
                            <p className="font-medium">{cert.staffName}</p>
                            <p className="text-sm text-[#757575]">RSA: {cert.rsaNumber}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {cert.isExpired ? (
                            <Badge className="bg-red-100 text-red-700">Expired</Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700">Valid</Badge>
                          )}
                          <p className="text-xs text-[#757575] mt-1">
                            Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                          </p>
                          {!cert.isExpired && (
                            <p className={`text-xs font-medium ${cert.daysUntilExpiry <= 30 ? 'text-amber-600' : 'text-green-600'}`}>
                              {cert.daysUntilExpiry} days remaining
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {rsaCerts.length === 0 && (
                  <div className="text-center py-12 text-[#757575]">
                    <BadgeCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No RSA certifications registered</p>
                    <p className="text-sm">All staff serving alcohol must have valid RSA certification</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Alerts Tab */}
            <TabsContent value="alerts" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Customer Alerts & Bans</h2>
                <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setAlertDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />Add Alert
                </Button>
              </div>
              
              <div className="space-y-3">
                {alerts.map(alert => (
                  <Card key={alert.id} className={alert.alertType === 'banned' ? 'border-red-300' : alert.alertType === 'underage' ? 'border-amber-300' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            alert.alertType === 'banned' ? 'bg-red-100' :
                            alert.alertType === 'underage' ? 'bg-amber-100' :
                            'bg-blue-100'
                          }`}>
                            {alert.alertType === 'banned' ? (
                              <Ban className="h-5 w-5 text-red-600" />
                            ) : alert.alertType === 'underage' ? (
                              <UserCheck className="h-5 w-5 text-amber-600" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{alert.customerName || 'Unknown'}</p>
                            <p className="text-sm text-[#757575]">{alert.reason}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={
                            alert.alertType === 'banned' ? 'bg-red-100 text-red-700' :
                            alert.alertType === 'underage' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }>
                            {alert.alertType}
                          </Badge>
                          <p className="text-xs text-[#757575] mt-1">
                            Added: {new Date(alert.startDate).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-[#757575]">Source: {alert.source}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {alerts.length === 0 && (
                  <div className="text-center py-12 text-[#757575]">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No customer alerts</p>
                    <p className="text-sm">Add alerts for banned or underage customers</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>

      {/* Age Verification Dialog */}
      <Dialog open={ageVerifyDialogOpen} onOpenChange={setAgeVerifyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-[#00897B]" />
              Age Verification
            </DialogTitle>
            <DialogDescription>
              Verify customer age before selling alcohol products
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Document Type</Label>
                <Select value={newVerification.documentType} onValueChange={(v) => setNewVerification(prev => ({ ...prev, documentType: v as DocumentType }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="id_card">ID Card</SelectItem>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="drivers_license">Driver's License</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Document Number</Label>
                <Input 
                  className="mt-1"
                  value={newVerification.documentNumber}
                  onChange={(e) => setNewVerification(prev => ({ ...prev, documentNumber: e.target.value }))}
                  placeholder="Last 4 digits"
                />
              </div>
            </div>
            
            <div>
              <Label>Customer Name</Label>
              <Input 
                className="mt-1"
                value={newVerification.customerName}
                onChange={(e) => setNewVerification(prev => ({ ...prev, customerName: e.target.value }))}
                placeholder="As appears on document"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date of Birth</Label>
                <Input 
                  type="date"
                  className="mt-1"
                  value={dateOfBirthInput}
                  onChange={(e) => handleDobChange(e.target.value)}
                />
              </div>
              <div>
                <Label>Method</Label>
                <Select value={newVerification.verificationMethod} onValueChange={(v) => setNewVerification(prev => ({ ...prev, verificationMethod: v as VerificationMethod }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Check</SelectItem>
                    <SelectItem value="scanner">ID Scanner</SelectItem>
                    <SelectItem value="app">Mobile App</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Product (Optional)</Label>
              <Input 
                className="mt-1"
                value={newVerification.productName}
                onChange={(e) => setNewVerification(prev => ({ ...prev, productName: e.target.value }))}
                placeholder="Product being purchased"
              />
            </div>
            
            {ageResult && (
              <div className={`p-4 rounded-lg ${ageResult.isAdult ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-3">
                  {ageResult.isAdult ? (
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-600" />
                  )}
                  <div>
                    <p className={`text-lg font-bold ${ageResult.isAdult ? 'text-green-700' : 'text-red-700'}`}>
                      Age: {ageResult.age} years
                    </p>
                    <p className={`text-sm ${ageResult.isAdult ? 'text-green-600' : 'text-red-600'}`}>
                      {ageResult.isAdult ? 'VERIFIED - Customer is 18 or older' : 'UNDERAGE - Sale of alcohol is prohibited'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAgeVerifyDialogOpen(false)}>Cancel</Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]"
              onClick={createAgeVerification}
              disabled={saving || !newVerification.dateOfBirth}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Record Verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* License Dialog */}
      <Dialog open={licenseDialogOpen} onOpenChange={setLicenseDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#00897B]" />
              Add Liquor License
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>License Number *</Label>
                <Input 
                  className="mt-1"
                  value={newLicense.licenseNumber}
                  onChange={(e) => setNewLicense(prev => ({ ...prev, licenseNumber: e.target.value }))}
                  placeholder="License number"
                />
              </div>
              <div>
                <Label>License Type</Label>
                <Select value={newLicense.licenseType} onValueChange={(v) => setNewLicense(prev => ({ ...prev, licenseType: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_consumption">On Consumption</SelectItem>
                    <SelectItem value="off_consumption">Off Consumption</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>License Holder *</Label>
              <Input 
                className="mt-1"
                value={newLicense.licenseHolder}
                onChange={(e) => setNewLicense(prev => ({ ...prev, licenseHolder: e.target.value }))}
                placeholder="Legal entity name"
              />
            </div>
            
            <div>
              <Label>Trading Name</Label>
              <Input 
                className="mt-1"
                value={newLicense.tradingName}
                onChange={(e) => setNewLicense(prev => ({ ...prev, tradingName: e.target.value }))}
                placeholder="DBA / Trading as"
              />
            </div>
            
            <div>
              <Label>Premises Address</Label>
              <Textarea 
                className="mt-1"
                value={newLicense.premisesAddress}
                onChange={(e) => setNewLicense(prev => ({ ...prev, premisesAddress: e.target.value }))}
                placeholder="Licensed premises address"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Issue Date</Label>
                <Input 
                  type="date"
                  className="mt-1"
                  value={newLicense.issueDate}
                  onChange={(e) => setNewLicense(prev => ({ ...prev, issueDate: e.target.value }))}
                />
              </div>
              <div>
                <Label>Expiry Date *</Label>
                <Input 
                  type="date"
                  className="mt-1"
                  value={newLicense.expiryDate}
                  onChange={(e) => setNewLicense(prev => ({ ...prev, expiryDate: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <Label>Duty Manager Name</Label>
              <Input 
                className="mt-1"
                value={newLicense.managerName}
                onChange={(e) => setNewLicense(prev => ({ ...prev, managerName: e.target.value }))}
                placeholder="RSA Manager name"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setLicenseDialogOpen(false)}>Cancel</Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]"
              onClick={createLicense}
              disabled={saving}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add License
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RSA Dialog */}
      <Dialog open={rsaDialogOpen} onOpenChange={setRsaDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-[#00897B]" />
              Add RSA Certification
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Staff Name *</Label>
              <Input 
                className="mt-1"
                value={newRsa.staffName}
                onChange={(e) => setNewRsa(prev => ({ ...prev, staffName: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>RSA Number *</Label>
                <Input 
                  className="mt-1"
                  value={newRsa.rsaNumber}
                  onChange={(e) => setNewRsa(prev => ({ ...prev, rsaNumber: e.target.value }))}
                  placeholder="Certification number"
                />
              </div>
              <div>
                <Label>Certificate Type</Label>
                <Select value={newRsa.certificateType} onValueChange={(v) => setNewRsa(prev => ({ ...prev, certificateType: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Issuing Body</Label>
              <Input 
                className="mt-1"
                value={newRsa.issuingBody}
                onChange={(e) => setNewRsa(prev => ({ ...prev, issuingBody: e.target.value }))}
                placeholder="e.g., HWSETA"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Issue Date</Label>
                <Input 
                  type="date"
                  className="mt-1"
                  value={newRsa.issueDate}
                  onChange={(e) => setNewRsa(prev => ({ ...prev, issueDate: e.target.value }))}
                />
              </div>
              <div>
                <Label>Expiry Date *</Label>
                <Input 
                  type="date"
                  className="mt-1"
                  value={newRsa.expiryDate}
                  onChange={(e) => setNewRsa(prev => ({ ...prev, expiryDate: e.target.value }))}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRsaDialogOpen(false)}>Cancel</Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]"
              onClick={createRsa}
              disabled={saving}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Certification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog */}
      <Dialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#00897B]" />
              Add Customer Alert
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Alert Type</Label>
              <Select value={newAlert.alertType} onValueChange={(v) => setNewAlert(prev => ({ ...prev, alertType: v as AlertType }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="underage">Underage</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Customer Name *</Label>
              <Input 
                className="mt-1"
                value={newAlert.customerName}
                onChange={(e) => setNewAlert(prev => ({ ...prev, customerName: e.target.value }))}
                placeholder="Customer name"
              />
            </div>
            
            <div>
              <Label>Reason *</Label>
              <Textarea 
                className="mt-1"
                value={newAlert.reason}
                onChange={(e) => setNewAlert(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Reason for alert/ban"
              />
            </div>
            
            <div>
              <Label>Source</Label>
              <Select value={newAlert.source} onValueChange={(v) => setNewAlert(prev => ({ ...prev, source: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="police">Police</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAlertDialogOpen(false)}>Cancel</Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]"
              onClick={createAlert}
              disabled={saving}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
