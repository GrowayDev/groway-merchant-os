'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Truck,
  ArrowLeft,
  ArrowRight,
  Building2,
  FileText,
  Award,
  CheckCircle2,
  Upload,
  X,
  FileIcon,
  Download,
  Loader2,
  Store,
  Utensils,
  Wine,
  ShoppingBag,
  Scissors,
  Pill,
  Hotel,
  Wrench,
  Smartphone,
  Dumbbell,
  Baby,
  Briefcase,
  ShieldCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Business Verticals with icons
const businessVerticals = [
  { id: 'fnb', name: 'Food & Beverage', icon: Utensils, subVerticals: ['Restaurant', 'Shisa Nyama', 'Fast Food', 'Cafe', 'Catering', 'Food Truck', 'Bakery', 'Butchery'] },
  { id: 'liquor', name: 'Liquor & Nightlife', icon: Wine, subVerticals: ['Bar', 'Nightclub', 'Tavern', 'Shebeen', 'Liquor Store', 'Wine Shop'] },
  { id: 'grocery', name: 'Grocery & FMCG', icon: ShoppingBag, subVerticals: ['Supermarket', 'Convenience Store', 'Spaza Shop', 'Wholesaler', 'Fruit & Veg', 'Butchery', 'Cash & Carry'] },
  { id: 'health-beauty', name: 'Health & Beauty', icon: Scissors, subVerticals: ['Hair Salon', 'Nail Salon', 'Beauty Spa', 'Barbershop', 'Nail Bar', 'Tattoo Studio', 'Massage Studio'] },
  { id: 'fashion', name: 'Fashion & Apparel', icon: Store, subVerticals: ['Clothing Store', 'Shoe Store', 'Boutique', 'Sportswear', 'Formal Wear', 'Streetwear'] },
  { id: 'pharmacy', name: 'Health & Pharmacy', icon: Pill, subVerticals: ['Pharmacy', 'Clinic', 'Health Shop', 'Supplement Store', 'Medical Practice', 'Optometry'] },
  { id: 'hospitality', name: 'Hospitality', icon: Hotel, subVerticals: ['Hotel', 'Guest House', 'B&B', 'Backpackers', 'Lodge', 'Conference Venue', 'Event Venue'] },
  { id: 'hardware', name: 'Hardware & Building', icon: Wrench, subVerticals: ['Hardware Store', 'Building Supplies', 'Paint Shop', 'Electrical', 'Plumbing', 'Garden Centre'] },
  { id: 'electronics', name: 'Electronics & Tech', icon: Smartphone, subVerticals: ['Electronics Store', 'Cell Phone Shop', 'Computer Store', 'Gaming'] },
  { id: 'sport', name: 'Sport & Leisure', icon: Dumbbell, subVerticals: ['Gym', 'Sports Club', 'Outdoor Store', 'Bicycle Shop', 'Fishing', 'Sports Bar'] },
  { id: 'childcare', name: 'Childcare & Education', icon: Baby, subVerticals: ['Daycare', 'Pre-School', 'Kids Party Venue', 'Toy Store', 'Baby Shop', 'Tutoring'] },
  { id: 'professional', name: 'Professional Services', icon: Briefcase, subVerticals: ['Accounting', 'Legal', 'Consulting', 'Marketing', 'IT Services', 'Design'] },
]

// Supplier Types
const supplierTypes = [
  { value: 'manufacturer', label: 'Manufacturer', desc: 'Produce or manufacture products' },
  { value: 'distributor', label: 'Distributor', desc: 'Distribute products for manufacturers' },
  { value: 'wholesaler', label: 'Wholesaler', desc: 'Sell products in bulk at wholesale prices' },
  { value: 'farmer', label: 'Farmer/Producer', desc: 'Grow or produce fresh goods' },
  { value: 'importer', label: 'Importer', desc: 'Import goods from overseas' },
]

// B-BBEE Levels
const bbbeeLevels = [
  { value: '1', label: 'Level 1 (135% recognition)', desc: 'Highest B-BBEE rating' },
  { value: '2', label: 'Level 2 (125% recognition)', desc: 'Excellent B-BBEE rating' },
  { value: '3', label: 'Level 3 (110% recognition)', desc: 'Good B-BBEE rating' },
  { value: '4', label: 'Level 4 (100% recognition)', desc: 'Standard B-BBEE rating' },
  { value: '5', label: 'Level 5 (80% recognition)', desc: 'Moderate B-BBEE rating' },
  { value: '6', label: 'Level 6 (60% recognition)', desc: 'Fair B-BBEE rating' },
  { value: '7', label: 'Level 7 (50% recognition)', desc: 'Below average B-BBEE rating' },
  { value: '8', label: 'Level 8 (10% recognition)', desc: 'Entry level B-BBEE rating' },
  { value: 'non-compliant', label: 'Non-Compliant', desc: 'No B-BBEE certification' },
]

// Provinces
const provinces = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo',
  'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'
]

// Categories
const productCategories = [
  'Fresh Produce', 'Dairy', 'Meat & Poultry', 'Bakery', 'Beverages', 'Groceries',
  'Frozen Foods', 'Snacks & Confectionery', 'Cleaning Supplies', 'Personal Care',
  'Packaging', 'Office Supplies', 'Kitchen Equipment', 'Cleaning Equipment',
  'Pharmaceuticals', 'Health Products', 'Beauty Products', 'Baby Products',
  'Pet Supplies', 'Hardware', 'Building Materials', 'Electronics', 'Textiles',
  'Packaging Materials', 'Industrial Supplies'
]

// Required Documents with download URLs
const requiredDocuments = [
  { 
    id: 'cipc_registration', 
    name: 'CIPC Registration Certificate', 
    description: 'Company registration document from CIPC',
    templateUrl: '/documents/cipc-registration-certificate-template.pdf'
  },
  { 
    id: 'bbbee_certificate', 
    name: 'B-BBEE Certificate', 
    description: 'B-BBEE compliance certificate',
    templateUrl: '/documents/bbbee-certificate-template.pdf'
  },
  { 
    id: 'vat_certificate', 
    name: 'VAT Registration Certificate', 
    description: 'SARS VAT registration document',
    templateUrl: '/documents/vat-registration-certificate-template.pdf'
  },
  { 
    id: 'bank_confirmation', 
    name: 'Bank Confirmation Letter', 
    description: 'Bank account confirmation letter',
    templateUrl: '/documents/bank-confirmation-letter-template.pdf'
  },
]

interface UploadedDocument {
  id: string
  documentType: string
  documentName: string
  fileName: string
  fileSize: number
  uploadedAt: string
  status: string
}

export default function SupplierOnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [createdSupplierId, setCreatedSupplierId] = useState<string | null>(null)
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([])
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const [formData, setFormData] = useState({
    // Business Info
    companyName: '',
    tradingName: '',
    registrationNumber: '',
    vatNumber: '',
    supplierType: '',
    website: '',
    description: '',
    // Contact
    contactPerson: '',
    email: '',
    phone: '',
    altPhone: '',
    // Address
    address: '',
    city: '',
    province: '',
    postalCode: '',
    // Business Details
    bbbeeLevel: '',
    deliveryDays: '3',
    minOrderValue: '',
    paymentTerms: 'net30',
    // Verticals & Categories
    selectedVerticals: [] as string[],
    selectedSubVerticals: [] as string[],
    selectedCategories: [] as string[],
    // Banking
    bankName: '',
    bankAccount: '',
    bankBranch: '',
  })

  const totalSteps = 5
  const progressPercent = (currentStep / totalSteps) * 100

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleVerticalToggle = (verticalName: string) => {
    setFormData(prev => {
      const newVerticals = prev.selectedVerticals.includes(verticalName)
        ? prev.selectedVerticals.filter(v => v !== verticalName)
        : [...prev.selectedVerticals, verticalName]
      return { ...prev, selectedVerticals: newVerticals }
    })
  }

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => {
      const newCategories = prev.selectedCategories.includes(category)
        ? prev.selectedCategories.filter(c => c !== category)
        : [...prev.selectedCategories, category]
      return { ...prev, selectedCategories: newCategories }
    })
  }

  // File upload function
  const handleFileUpload = async (documentType: string, file: File) => {
    if (!createdSupplierId) return
    
    setUploadingDoc(documentType)
    try {
      const formDataObj = new FormData()
      formDataObj.append('file', file)
      formDataObj.append('supplierId', createdSupplierId)
      formDataObj.append('documentType', documentType)
      
      const response = await fetch('/grosupply/api/documents', {
        method: 'POST',
        body: formDataObj
      })
      
      if (response.ok) {
        const data = await response.json()
        setUploadedDocuments(prev => [...prev, data.document])
      }
    } catch (error) {
      console.error('Error uploading document:', error)
    } finally {
      setUploadingDoc(null)
    }
  }

  // Handle file selection
  const handleFileSelect = (documentType: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(documentType, file)
    }
  }

  // Delete uploaded document
  const handleDeleteDocument = async (docId: string) => {
    try {
      await fetch(`/grosupply/api/documents/${docId}`, {
        method: 'DELETE'
      })
      setUploadedDocuments(prev => prev.filter(d => d.id !== docId))
    } catch (error) {
      console.error('Error deleting document:', error)
    }
  }

  // Download document
  const handleDownloadDocument = (docId: string, fileName: string) => {
    window.open(`/grosupply/api/documents/${docId}`, '_blank')
  }

  // Get uploaded document for a type
  const getUploadedDoc = (docType: string) => uploadedDocuments.find(d => d.documentType === docType)

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/merchant-os/api/grosupply/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.companyName,
          contactPerson: formData.contactPerson,
          email: formData.email,
          phone: formData.phone,
          website: formData.website,
          address: formData.address,
          city: formData.city,
          province: formData.province,
          postalCode: formData.postalCode,
          bankName: formData.bankName,
          bankAccount: formData.bankAccount,
          bankBranch: formData.bankBranch,
          supplierType: formData.supplierType,
          bbbeeLevel: formData.bbbeeLevel ? parseInt(formData.bbbeeLevel) : null,
          deliveryDays: parseInt(formData.deliveryDays) || 3,
          minOrderValue: parseFloat(formData.minOrderValue) || 0,
          paymentTerms: formData.paymentTerms,
          categories: formData.selectedCategories,
          verticals: formData.selectedVerticals,
          subVerticals: formData.selectedSubVerticals,
          notes: formData.description,
          status: 'active',
          verificationStatus: 'pending'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCreatedSupplierId(data.supplier.id)
        setSubmitStatus('success')
      } else {
        setSubmitStatus('error')
      }
    } catch {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/grosupply" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#00897B] flex items-center justify-center">
                <Truck className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-[#1A1A1A]">GroSupply</span>
            </Link>

            <div className="flex items-center gap-4">
              <span className="text-sm text-[#757575]">Step {currentStep} of {totalSteps}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Progress value={progressPercent} className="h-2" />
          <div className="flex justify-between mt-2">
            {['Business Info', 'Contact & Address', 'Verticals', 'Categories', 'Banking'].map((step, idx) => (
              <span key={idx} className={`text-xs ${currentStep > idx ? 'text-[#00897B]' : currentStep === idx + 1 ? 'text-[#1A1A1A] font-medium' : 'text-[#757575]'}`}>
                {step}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {submitStatus === 'success' ? (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Application Submitted!</h2>
              <p className="text-[#757575] mb-6">Your supplier profile has been created. Now upload your compliance documents to complete verification.</p>
            </div>

            {/* Document Upload Section */}
            <Card className="border border-gray-200">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg text-[#1A1A1A] flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#00897B]" />
                  Upload Compliance Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {requiredDocuments.map((doc) => {
                    const uploaded = getUploadedDoc(doc.id)
                    const isUploading = uploadingDoc === doc.id
                    
                    return (
                      <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {uploaded ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <FileIcon className="h-4 w-4 text-[#757575]" />
                              )}
                              <span className="font-medium text-[#1A1A1A]">{doc.name}</span>
                            </div>
                            <p className="text-xs text-[#757575]">{doc.description}</p>
                          </div>
                          
                          {uploaded ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[#757575]">{formatFileSize(uploaded.fileSize)}</span>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDownloadDocument(uploaded.id, uploaded.fileName)}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteDocument(uploaded.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <a 
                                href={doc.templateUrl} 
                                download
                                className="inline-flex items-center gap-1.5 text-xs text-[#00897B] hover:text-[#00695C] px-2 py-1.5 border border-[#00897B]/30 rounded hover:bg-[#E0F2F1] transition-colors"
                              >
                                <Download className="h-3.5 w-3.5" />
                                Template
                              </a>
                              <input
                                ref={(el) => { fileInputRefs.current[doc.id] = el }}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                className="hidden"
                                onChange={handleFileSelect(doc.id)}
                              />
                              <Button 
                                variant="outline" 
                                size="sm"
                                disabled={isUploading}
                                onClick={() => fileInputRefs.current[doc.id]?.click()}
                              >
                                {isUploading ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Upload className="h-4 w-4 mr-2" />
                                )}
                                {isUploading ? 'Uploading...' : 'Upload'}
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        {uploaded && (
                          <div className="mt-2 text-xs text-[#757575] flex items-center gap-2">
                            <span>File: {uploaded.fileName}</span>
                            <span>•</span>
                            <span>Uploaded: {new Date(uploaded.uploadedAt).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
                  <p className="text-xs text-[#757575]">
                    Uploaded {uploadedDocuments.length} of {requiredDocuments.length} documents
                  </p>
                  <Link href="/grosupply/marketplace">
                    <Button className="bg-[#00897B] hover:bg-[#00695C]">
                      Go to Marketplace
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="border border-gray-200">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-lg text-[#1A1A1A]">
                {currentStep === 1 && 'Business Information'}
                {currentStep === 2 && 'Contact & Address Details'}
                {currentStep === 3 && 'Select Your Verticals'}
                {currentStep === 4 && 'Product Categories'}
                {currentStep === 5 && 'Banking & Documents'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {/* Step 1: Business Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input id="companyName" name="companyName" value={formData.companyName} onChange={handleInputChange} placeholder="Registered company name" required />
                    </div>
                    <div>
                      <Label htmlFor="tradingName">Trading Name</Label>
                      <Input id="tradingName" name="tradingName" value={formData.tradingName} onChange={handleInputChange} placeholder="If different from company name" />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="registrationNumber">CIPC Registration Number</Label>
                      <Input id="registrationNumber" name="registrationNumber" value={formData.registrationNumber} onChange={handleInputChange} placeholder="e.g., 2023/123456/07" />
                    </div>
                    <div>
                      <Label htmlFor="vatNumber">VAT Number</Label>
                      <Input id="vatNumber" name="vatNumber" value={formData.vatNumber} onChange={handleInputChange} placeholder="e.g., 4123456789" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="supplierType">Supplier Type *</Label>
                    <Select value={formData.supplierType} onValueChange={(v) => handleSelectChange('supplierType', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your business type" />
                      </SelectTrigger>
                      <SelectContent>
                        {supplierTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <span className="font-medium">{type.label}</span>
                              <span className="text-xs text-[#757575] block">{type.desc}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" name="website" value={formData.website} onChange={handleInputChange} placeholder="https://yourcompany.co.za" />
                  </div>

                  <div>
                    <Label htmlFor="description">Business Description</Label>
                    <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Tell us about your business and what products you supply..." rows={3} />
                  </div>
                </div>
              )}

              {/* Step 2: Contact & Address */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contactPerson">Contact Person *</Label>
                      <Input id="contactPerson" name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} placeholder="Full name" required />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="email@company.co.za" required />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+27 00 000 0000" required />
                    </div>
                    <div>
                      <Label htmlFor="altPhone">Alternative Phone</Label>
                      <Input id="altPhone" name="altPhone" value={formData.altPhone} onChange={handleInputChange} placeholder="+27 00 000 0000" />
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-sm font-medium text-[#1A1A1A] mb-4">Business Address</h4>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="address">Street Address *</Label>
                        <Input id="address" name="address" value={formData.address} onChange={handleInputChange} placeholder="Street address" required />
                      </div>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="city">City *</Label>
                          <Input id="city" name="city" value={formData.city} onChange={handleInputChange} placeholder="City" required />
                        </div>
                        <div>
                          <Label htmlFor="province">Province *</Label>
                          <Select value={formData.province} onValueChange={(v) => handleSelectChange('province', v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select province" />
                            </SelectTrigger>
                            <SelectContent>
                              {provinces.map(prov => (
                                <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="postalCode">Postal Code *</Label>
                          <Input id="postalCode" name="postalCode" value={formData.postalCode} onChange={handleInputChange} placeholder="0000" required />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-sm font-medium text-[#1A1A1A] mb-4">Delivery & Payment Terms</h4>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="deliveryDays">Delivery Days</Label>
                        <Select value={formData.deliveryDays} onValueChange={(v) => handleSelectChange('deliveryDays', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7].map(d => (
                              <SelectItem key={d} value={d.toString()}>{d} day{d > 1 ? 's' : ''}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="minOrderValue">Min. Order Value (R)</Label>
                        <Input id="minOrderValue" name="minOrderValue" type="number" value={formData.minOrderValue} onChange={handleInputChange} placeholder="0" />
                      </div>
                      <div>
                        <Label htmlFor="paymentTerms">Payment Terms</Label>
                        <Select value={formData.paymentTerms} onValueChange={(v) => handleSelectChange('paymentTerms', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cod">COD</SelectItem>
                            <SelectItem value="net7">Net 7</SelectItem>
                            <SelectItem value="net15">Net 15</SelectItem>
                            <SelectItem value="net30">Net 30</SelectItem>
                            <SelectItem value="net60">Net 60</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>B-BBEE Level</Label>
                    <Select value={formData.bbbeeLevel} onValueChange={(v) => handleSelectChange('bbbeeLevel', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select B-BBEE level" />
                      </SelectTrigger>
                      <SelectContent>
                        {bbbeeLevels.map(level => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Step 3: Verticals */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-[#757575] mb-4">Select the business verticals you supply to. This helps merchants find relevant suppliers for their business type.</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {businessVerticals.map(vertical => {
                      const isSelected = formData.selectedVerticals.includes(vertical.name)
                      return (
                        <button
                          key={vertical.id}
                          type="button"
                          onClick={() => handleVerticalToggle(vertical.name)}
                          className={`flex flex-col items-center text-center p-4 rounded-lg border transition-all ${
                            isSelected
                              ? 'border-[#00897B] bg-[#E0F2F1] text-[#00897B]'
                              : 'border-gray-200 hover:border-[#00897B]/30 bg-white'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${
                            isSelected ? 'bg-[#00897B] text-white' : 'bg-gray-100 text-[#757575]'
                          }`}>
                            <vertical.icon className="h-5 w-5" />
                          </div>
                          <span className="text-xs font-medium">{vertical.name}</span>
                          <span className="text-[10px] text-[#757575] mt-1">{vertical.subVerticals.length} sub-types</span>
                        </button>
                      )
                    })}
                  </div>

                  {formData.selectedVerticals.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-sm font-medium text-[#1A1A1A] mb-2">Selected Verticals ({formData.selectedVerticals.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.selectedVerticals.map(v => (
                          <Badge key={v} className="bg-[#E0F2F1] text-[#00897B]">
                            {v}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Categories */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-[#757575] mb-4">Select the product categories you supply. You can select multiple categories.</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {productCategories.map(category => {
                      const isSelected = formData.selectedCategories.includes(category)
                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => handleCategoryToggle(category)}
                          className={`text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                            isSelected
                              ? 'border-[#00897B] bg-[#E0F2F1] text-[#00897B] font-medium'
                              : 'border-gray-200 hover:border-[#00897B]/30 bg-white'
                          }`}
                        >
                          {category}
                        </button>
                      )
                    })}
                  </div>

                  {formData.selectedCategories.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-sm font-medium text-[#1A1A1A] mb-2">Selected Categories ({formData.selectedCategories.length})</p>
                      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                        {formData.selectedCategories.map(c => (
                          <Badge key={c} className="bg-[#E0F2F1] text-[#00897B]">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: Banking & Documents */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 text-amber-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">Banking Details Security</p>
                        <p className="text-xs text-amber-700 mt-1">Your banking information is encrypted and stored securely. It will only be used for payment settlements.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="bankName">Bank Name *</Label>
                      <Input id="bankName" name="bankName" value={formData.bankName} onChange={handleInputChange} placeholder="e.g., FNB, Standard Bank" required />
                    </div>
                    <div>
                      <Label htmlFor="bankAccount">Account Number *</Label>
                      <Input id="bankAccount" name="bankAccount" value={formData.bankAccount} onChange={handleInputChange} placeholder="Account number" required />
                    </div>
                    <div>
                      <Label htmlFor="bankBranch">Branch Code</Label>
                      <Input id="bankBranch" name="bankBranch" value={formData.bankBranch} onChange={handleInputChange} placeholder="Branch code" />
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-sm font-medium text-[#1A1A1A] mb-4">Required Documents</h4>
                    <p className="text-xs text-[#757575] mb-4">After submitting your application, you will be asked to upload the following compliance documents. Download the templates below to prepare your documents:</p>
                    
                    <div className="grid sm:grid-cols-2 gap-3">
                      {requiredDocuments.map((doc) => (
                        <div key={doc.id} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-[#00897B] flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-[#1A1A1A]">{doc.name}</p>
                              <p className="text-xs text-[#757575]">{doc.description}</p>
                            </div>
                          </div>
                          <a 
                            href={doc.templateUrl} 
                            download
                            className="flex items-center justify-center gap-1.5 text-xs text-[#00897B] hover:text-[#00695C] font-medium py-1.5 px-3 bg-white border border-[#00897B]/30 rounded hover:bg-[#E0F2F1] transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download Template
                          </a>
                        </div>
                      ))}
                    </div>
                    
                    <p className="text-xs text-[#757575] mt-4 flex items-center gap-1">
                      <Award className="h-3 w-3" />
                      Suppliers with verified documents get higher visibility in the marketplace
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                {currentStep < totalSteps ? (
                  <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={nextStep}>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                    {!isSubmitting && <CheckCircle2 className="h-4 w-4 ml-2" />}
                  </Button>
                )}
              </div>

              {submitStatus === 'error' && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">Failed to submit application. Please try again.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-auto py-6 bg-white border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-xs text-[#757575]">© 2024 Groway. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
