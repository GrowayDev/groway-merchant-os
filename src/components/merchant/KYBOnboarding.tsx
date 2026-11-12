'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { 
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  CreditCard,
  ChevronRight,
  Shield,
  Info,
  Loader2,
  XCircle,
  RefreshCw,
  FileCheck,
  Users,
  MapPin
} from 'lucide-react'

interface KYBDocument {
  id: string
  documentType: string
  status: string
  uploadedAt: Date
  verifiedAt?: Date
  verifiedBy?: string
  url?: string
}

interface MerchantInfo {
  id: string
  businessName: string
  tradingName?: string
  registrationNumber?: string
  vatNumber?: string
  tier: string
  status: string
  kybStatus: string
  kycStatus: string
  riskScore: number
  contactName?: string
  contactEmail?: string
  contactPhone?: string
}

interface RequiredDocument {
  type: string
  label: string
  required: boolean
  uploaded: boolean
  verified: boolean
}

interface KYBOnboardingProps {
  merchantId: string
  onComplete?: () => void
  onSkip?: () => void
}

const KYB_DOCUMENT_INFO: Record<string, { label: string; description: string; icon: React.ElementType }> = {
  cip14_registration: { 
    label: 'CIP14 Company Registration', 
    description: 'Companies and Intellectual Property Commission registration document',
    icon: FileText 
  },
  memorandum_incorporation: { 
    label: 'Memorandum of Incorporation', 
    description: 'MOI document showing company structure',
    icon: FileText 
  },
  directors_id: { 
    label: 'Director\'s ID', 
    description: 'ID document of all directors',
    icon: CreditCard 
  },
  proof_of_address: { 
    label: 'Proof of Business Address', 
    description: 'Utility bill or lease agreement (not older than 3 months)',
    icon: MapPin 
  },
  vat_certificate: { 
    label: 'VAT Certificate', 
    description: 'SARS VAT registration certificate',
    icon: FileCheck 
  },
  tax_clearance: { 
    label: 'Tax Clearance Certificate', 
    description: 'SARS tax clearance certificate',
    icon: FileCheck 
  },
  bank_statement: { 
    label: 'Bank Statement', 
    description: 'Business bank statement (last 3 months)',
    icon: Building2 
  },
  bbbee_certificate: { 
    label: 'B-BBEE Certificate', 
    description: 'B-BBEE affidavit or certificate',
    icon: FileCheck 
  },
  share_certificate: { 
    label: 'Share Certificate', 
    description: 'Company share certificates',
    icon: FileText 
  },
  board_resolution: { 
    label: 'Board Resolution', 
    description: 'Resolution authorizing account opening',
    icon: Users 
  },
  authorization_letter: { 
    label: 'Authorization Letter', 
    description: 'Letter authorizing representative',
    icon: FileText 
  },
  business_license: { 
    label: 'Business License', 
    description: 'Industry-specific license or permit',
    icon: FileCheck 
  },
}

export function KYBOnboarding({ merchantId, onComplete, onSkip }: KYBOnboardingProps) {
  const [merchant, setMerchant] = useState<MerchantInfo | null>(null)
  const [documents, setDocuments] = useState<KYBDocument[]>([])
  const [requiredDocs, setRequiredDocs] = useState<RequiredDocument[]>([])
  const [progress, setProgress] = useState({ total: 0, uploaded: 0, verified: 0, percentage: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [notes, setNotes] = useState('')

  const fetchKYBStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/kyb/upload?merchantId=${merchantId}`)
      if (response.ok) {
        const data = await response.json()
        setMerchant(data.merchant)
        setDocuments(data.documents || [])
        setRequiredDocs(data.requiredDocuments || [])
        setProgress(data.progress || { total: 0, uploaded: 0, verified: 0, percentage: 0 })
      }
    } catch (error) {
      console.error('Failed to fetch KYB status:', error)
    } finally {
      setIsLoading(false)
    }
  }, [merchantId])

  useEffect(() => {
    fetchKYBStatus()
  }, [fetchKYBStatus])

  const handleUpload = async () => {
    if (!selectedFile || !selectedDocType) {
      toast.error('Please select a file and document type')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('merchantId', merchantId)
      formData.append('file', selectedFile)
      formData.append('documentType', selectedDocType)
      if (notes) formData.append('notes', notes)

      const response = await fetch('/api/kyb/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.document.message)
        setUploadDialogOpen(false)
        setSelectedFile(null)
        setNotes('')
        fetchKYBStatus()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  const getDocumentStatus = (docType: string) => {
    const doc = documents.find(d => d.documentType === docType)
    return doc?.status || 'not_uploaded'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'pending':
      case 'under_review':
        return <Clock className="h-5 w-5 text-amber-500" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#00897B]" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00897B] to-[#4CAF50] mx-auto flex items-center justify-center mb-4">
          <Building2 className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-[#1A1A1A]">Verify Your Business</h2>
        <p className="text-sm text-[#757575] mt-2">
          Upload your business documents to complete verification
        </p>
      </div>

      {merchant && (
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#E0F2F1] flex items-center justify-center">
                <Building2 className="h-6 w-6 text-[#00897B]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#1A1A1A]">{merchant.businessName}</h3>
                <p className="text-sm text-[#757575]">
                  {merchant.tradingName && `Trading as: ${merchant.tradingName}`}
                  {merchant.registrationNumber && ` • Reg: ${merchant.registrationNumber}`}
                </p>
              </div>
              <Badge className={`${
                merchant.kybStatus === 'verified' ? 'bg-green-500/20 text-green-600' :
                merchant.kybStatus === 'in_review' ? 'bg-amber-500/20 text-amber-600' :
                'bg-gray-500/20 text-gray-600'
              } border-0 capitalize`}>
                {merchant.kybStatus.replace('_', ' ')}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#1A1A1A]">Verification Progress</span>
            <span className="text-sm font-bold text-[#00897B]">{progress.percentage}%</span>
          </div>
          <Progress value={progress.percentage} className="h-2" />
          <p className="text-xs text-[#757575] mt-2">
            {progress.verified} of {progress.total} documents verified
          </p>
        </CardContent>
      </Card>

      {merchant?.kybStatus !== 'verified' && (
        <div className="bg-[#E0F2F1] rounded-lg p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-[#00897B] flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[#00695C]">
            <p className="font-medium">Why verify your business?</p>
            <p className="mt-1">Verified businesses get access to higher transaction limits, GroCredit, and premium features.</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-semibold text-[#1A1A1A]">Required Documents</h3>
        {requiredDocs.map((doc) => {
          const status = getDocumentStatus(doc.type)
          const docInfo = KYB_DOCUMENT_INFO[doc.type]
          const DocIcon = docInfo?.icon || FileText

          return (
            <Card 
              key={doc.type}
              className={`bg-white border ${
                status === 'verified' ? 'border-green-200' : 
                status === 'rejected' ? 'border-red-200' : 
                'border-gray-200'
              } cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => {
                if (status !== 'verified' && status !== 'under_review') {
                  setSelectedDocType(doc.type)
                  setUploadDialogOpen(true)
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    status === 'verified' ? 'bg-green-100' :
                    status === 'rejected' ? 'bg-red-100' :
                    'bg-[#E0F2F1]'
                  }`}>
                    <DocIcon className={`h-6 w-6 ${
                      status === 'verified' ? 'text-green-600' :
                      status === 'rejected' ? 'text-red-600' :
                      'text-[#00897B]'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-[#1A1A1A]">{docInfo?.label || doc.type}</h4>
                      {doc.required && (
                        <Badge variant="outline" className="text-xs border-red-200 text-red-600">Required</Badge>
                      )}
                    </div>
                    <p className="text-xs text-[#757575] mt-0.5">{docInfo?.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status)}
                    {status !== 'verified' && status !== 'under_review' && (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Button 
        variant="outline" 
        className="w-full border-dashed"
        onClick={() => {
          setSelectedDocType(null)
          setUploadDialogOpen(true)
        }}
      >
        <Upload className="h-4 w-4 mr-2" />
        Upload Additional Document
      </Button>

      <div className="flex gap-3">
        {merchant?.kybStatus !== 'verified' && onSkip && (
          <Button variant="outline" className="flex-1" onClick={onSkip}>
            Skip for Now
          </Button>
        )}
        {merchant?.kybStatus === 'verified' ? (
          <Button className="flex-1 bg-[#00897B] hover:bg-[#00695C]" onClick={onComplete}>
            Continue <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={fetchKYBStatus}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Check Status
          </Button>
        )}
      </div>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Business Document</DialogTitle>
            <DialogDescription>
              Upload a clear scan or photo of your document
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={selectedDocType || ''} onValueChange={setSelectedDocType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(KYB_DOCUMENT_INFO).map(([type, info]) => (
                    <SelectItem key={type} value={type}>
                      {info.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this document..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Document File</Label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  id="kyb-document-upload"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      if (file.size > 10 * 1024 * 1024) {
                        toast.error('File size must be under 10MB')
                        return
                      }
                      setSelectedFile(file)
                    }
                  }}
                />
                <label htmlFor="kyb-document-upload" className="cursor-pointer">
                  {selectedFile ? (
                    <div className="text-sm">
                      <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      <Upload className="h-8 w-8 mx-auto mb-2" />
                      <p>Click to upload or drag and drop</p>
                      <p className="text-xs mt-1">JPEG, PNG, WebP or PDF (max 10MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]"
              onClick={handleUpload}
              disabled={!selectedFile || !selectedDocType || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Document'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
