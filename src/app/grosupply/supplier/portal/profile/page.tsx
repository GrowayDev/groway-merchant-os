'use client'

import { useState } from 'react'
import {
  User,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  ShieldCheck,
  Award,
  Upload,
  Save,
  Edit,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSupplierAuth } from '../layout'

const mockProfile = {
  companyName: 'Demo Wholesale SA',
  tradingName: 'Demo Supplies',
  registrationNumber: '2023/123456/07',
  vatNumber: '4123456789',
  contactPerson: 'John Supplier',
  email: 'supplier@grosupply.co.za',
  phone: '+27 11 123 4567',
  website: 'www.demosupplies.co.za',
  address: '123 Industrial Road',
  city: 'Johannesburg',
  province: 'Gauteng',
  postalCode: '2001',
  tier: 'gold',
  rating: 4.8,
  verificationStatus: 'verified',
}

const mockDocuments = [
  { id: 'DOC-001', name: 'CIPC Registration', status: 'verified', uploadedAt: '2025-06-15', expiresAt: '2027-06-15' },
  { id: 'DOC-002', name: 'B-BBEE Certificate', status: 'verified', uploadedAt: '2025-08-20', expiresAt: '2026-08-20' },
  { id: 'DOC-003', name: 'VAT Certificate', status: 'verified', uploadedAt: '2025-03-10' },
  { id: 'DOC-004', name: 'Bank Confirmation', status: 'verified', uploadedAt: '2025-09-01' },
]

export default function SupplierProfilePage() {
  const { supplier } = useSupplierAuth()
  const [profile, setProfile] = useState(mockProfile)
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profile Settings</h1>
          <p className="text-muted">Manage your supplier profile and documents</p>
        </div>
        <Button onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? <Save className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
          {isEditing ? 'Save Changes' : 'Edit Profile'}
        </Button>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Business Profile</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="banking">Banking Details</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 mt-4">
          {/* Profile Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-[#00897B] text-white text-2xl">
                    {profile.companyName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold">{profile.companyName}</h2>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Award className="h-3 w-3 mr-1" />
                      {profile.tier} Tier
                    </Badge>
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                  <p className="text-muted">{profile.tradingName}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-medium">Rating: {profile.rating}/5.0</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Details */}
          <Card>
            <CardHeader>
              <CardTitle>Business Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Company Name</Label>
                  <Input value={profile.companyName} disabled={!isEditing} />
                </div>
                <div>
                  <Label>Trading Name</Label>
                  <Input value={profile.tradingName} disabled={!isEditing} />
                </div>
                <div>
                  <Label>Registration Number</Label>
                  <Input value={profile.registrationNumber} disabled />
                </div>
                <div>
                  <Label>VAT Number</Label>
                  <Input value={profile.vatNumber} disabled />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Details */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Contact Person</Label>
                  <Input value={profile.contactPerson} disabled={!isEditing} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={profile.email} disabled={!isEditing} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={profile.phone} disabled={!isEditing} />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input value={profile.website} disabled={!isEditing} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Street Address</Label>
                <Input value={profile.address} disabled={!isEditing} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>City</Label>
                  <Input value={profile.city} disabled={!isEditing} />
                </div>
                <div>
                  <Label>Province</Label>
                  <Input value={profile.province} disabled={!isEditing} />
                </div>
                <div>
                  <Label>Postal Code</Label>
                  <Input value={profile.postalCode} disabled={!isEditing} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Documents</CardTitle>
              <CardDescription>Your uploaded verification documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted" />
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-xs text-muted">Uploaded: {doc.uploadedAt}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.status === 'verified' ? (
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                      <Button variant="outline" size="sm">
                        <Upload className="h-3 w-3 mr-1" />
                        Update
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banking" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Banking Details</CardTitle>
              <CardDescription>Payment settlement account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-800">Secure Information</p>
                    <p className="text-sm text-amber-700">Your banking details are encrypted and only used for settlements.</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Bank Name</Label>
                  <Input placeholder="e.g., FNB" disabled={!isEditing} />
                </div>
                <div>
                  <Label>Account Number</Label>
                  <Input type="password" placeholder="••••••••" disabled />
                </div>
                <div>
                  <Label>Branch Code</Label>
                  <Input placeholder="e.g., 250655" disabled={!isEditing} />
                </div>
                <div>
                  <Label>Account Type</Label>
                  <Input value="Business Cheque" disabled />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
