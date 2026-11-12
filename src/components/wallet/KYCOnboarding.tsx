'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  IdCard,
  Home,
  User,
  Building2,
  CreditCard,
  ChevronRight,
  Camera,
  Shield,
  Info,
  Loader2,
  XCircle,
  RefreshCw
} from 'lucide-react'

interface KYCDocument {
  id: string
  documentType: string
  documentCategory: string
  fileName: string
  status: string
  uploadedAt: Date
  verifiedAt?: Date
  verifiedByName?: string
  rejectionReason?: string
  documentNumber?: string
  expiryDate?: string
  isExpired?: boolean
  reviewPriority?: string
}

interface KYCOnboardingProps {
  userId: string
  onComplete?: () => void
  onSkip?: () => void
}

const DOCUMENT_TYPES = [
  { 
    type: 'sa_id', 
    label: 'South African ID', 
    description: 'Green ID book or Smart ID card',
    icon: IdCard,
    category: 'identity',
    required: true
  },
  { 
    type: 'passport', 
    label: 'Passport', 
    description: 'Valid passport (non-SA citizens)',
    icon: CreditCard,
    category: 'identity',
    required: false
  },
  { 
    type: 'drivers_license', 
    label: 'Driver\'s License', 
    description: 'Valid South African driver\'s license',
    icon: CreditCard,
    category: 'identity',
    required: false
  },
  { 
    type: 'proof_of_address', 
    label: 'Proof of Address', 
    description: 'Utility bill or bank statement (not older than 3 months)',
    icon: Home,
    category: 'address',
    required: true
  },
  { 
    type: 'selfie', 
    label: 'Selfie Verification', 
    description: 'Take a photo holding your ID document',
    icon: Camera,
    category: 'biometric',
    required: true
  },
  { 
    type: 'bank_statement', 
    label: 'Bank Statement', 
    description: 'Last 3 months bank statement',
    icon: FileText,
    category: 'financial',
    required: false
  },
  { 
    type: 'proof_of_income', 
    label: 'Proof of Income', 
    description: 'Payslip or employment letter',
    icon: Building2,
    category: 'financial',
    required: false
  },
]

export function KYCOnboarding({ userId, onComplete, onSkip }: KYCOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [documents, setDocuments] = useState<KYCDocument[]>([])
  const [kycStatus, setKycStatus] = useState('pending')
  const [progress, setProgress] = useState({ total: 3, uploaded: 0, verified: 0, percentage: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentNumber, setDocumentNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')

  // Fetch KYC status
  const fetchKYCStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/kyc/upload?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
        setKycStatus(data.kycStatus || 'pending')
        setProgress(data.progress || { total: 3, uploaded: 0, verified: 0, percentage: 0 })
      }
    } catch (error) {
      console.error('Failed to fetch KYC status:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile || !selectedDocType) {
      toast.error('Please select a file and document type')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('userId', userId)
      formData.append('file', selectedFile)
      formData.append('documentType', selectedDocType)
      if (documentNumber) formData.append('documentNumber', documentNumber)
      if (expiryDate) formData.append('expiryDate', expiryDate)

      const response = await fetch('/api/kyc/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.document.message)
        setUploadDialogOpen(false)
        setSelectedFile(null)
        setDocumentNumber('')
        setExpiryDate('')
        fetchKYCStatus()
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

  // Get document status
  const getDocumentStatus = (docType: string) => {
    const doc = documents.find(d => d.documentType === docType)
    return doc?.status || 'not_uploaded'
  }

  // Get status icon
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

  // Required documents for current level
  const requiredDocs = DOCUMENT_TYPES.filter(d => 
    ['sa_id', 'proof_of_address', 'selfie'].includes(d.type) ||
    progress.total > 3
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#00897B]" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00897B] to-[#4CAF50] mx-auto flex items-center justify-center mb-4">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-[#1A1A1A]">Verify Your Identity</h2>
        <p className="text-sm text-[#757575] mt-2">
          Upload your documents to unlock all features
        </p>
      </div>

      {/* Progress */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#1A1A1A]">Verification Progress</span>
            <span className="text-sm font-bold text-[#00897B]">{progress.percentage}%</span>
          </div>
          <Progress value={progress.percentage} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-[#757575]">
            <span>{progress.verified} of {progress.total} verified</span>
            <Badge className={`${kycStatus === 'verified' ? 'bg-green-500/20 text-green-600' : 'bg-amber-500/20 text-amber-600'} border-0`}>
              {kycStatus.replace('_', ' ')}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Info Banner */}
      {kycStatus !== 'verified' && (
        <div className="bg-[#E0F2F1] rounded-lg p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-[#00897B] flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[#00695C]">
            <p className="font-medium">Why verify?</p>
            <p className="mt-1">Verified users get higher limits, access to credit, and more features.</p>
          </div>
        </div>
      )}

      {/* Document List */}
      <div className="space-y-3">
        {requiredDocs.map((doc) => {
          const status = getDocumentStatus(doc.type)
          const existingDoc = documents.find(d => d.documentType === doc.type)
          const DocIcon = doc.icon

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
                      <h4 className="font-medium text-[#1A1A1A]">{doc.label}</h4>
                      {doc.required && (
                        <Badge variant="outline" className="text-xs border-red-200 text-red-600">Required</Badge>
                      )}
                    </div>
                    <p className="text-xs text-[#757575] mt-0.5">{doc.description}</p>
                    {existingDoc?.rejectionReason && (
                      <p className="text-xs text-red-500 mt-1">{existingDoc.rejectionReason}</p>
                    )}
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

      {/* Add more documents */}
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

      {/* Action Buttons */}
      <div className="flex gap-3">
        {kycStatus !== 'verified' && onSkip && (
          <Button variant="outline" className="flex-1" onClick={onSkip}>
            Skip for Now
          </Button>
        )}
        {kycStatus === 'verified' ? (
          <Button className="flex-1 bg-[#00897B] hover:bg-[#00695C]" onClick={onComplete}>
            Continue <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={fetchKYCStatus}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Check Status
          </Button>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a clear photo or scan of your document
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Document Type Selection */}
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={selectedDocType || ''} onValueChange={setSelectedDocType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((doc) => (
                    <SelectItem key={doc.type} value={doc.type}>
                      {doc.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Document Number (optional) */}
            <div className="space-y-2">
              <Label>Document Number (Optional)</Label>
              <Input
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="e.g. ID number"
              />
            </div>

            {/* Expiry Date (optional) */}
            <div className="space-y-2">
              <Label>Expiry Date (Optional)</Label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>Document File</Label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  id="document-upload"
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
                <label htmlFor="document-upload" className="cursor-pointer">
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
