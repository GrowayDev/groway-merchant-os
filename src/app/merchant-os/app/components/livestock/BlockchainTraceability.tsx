'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
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
  Link,
  Shield,
  CheckCircle,
  QrCode,
  Search,
  History,
  MapPin,
  Calendar,
  User,
  FileText,
  Eye,
  Download,
  ExternalLink,
  Lock,
  Unlock,
  Activity,
  Zap,
  Database,
  Hash,
  Clock,
  AlertTriangle,
} from 'lucide-react'

// ============================================
// TYPES
// ============================================

interface BlockchainRecord {
  id: string
  animalId: string
  animalTag: string
  blockNumber: number
  transactionHash: string
  timestamp: string
  eventType: 'birth' | 'transfer' | 'vaccination' | 'treatment' | 'weight' | 'sale' | 'processing'
  data: Record<string, unknown>
  verifiedBy: string[]
  previousHash: string
  currentHash: string
  status: 'confirmed' | 'pending' | 'verified'
}

interface SupplyChainEvent {
  id: string
  animalId: string
  stage: 'farm' | 'transport' | 'auction' | 'abattoir' | 'processing' | 'retail' | 'consumer'
  location: string
  handler: string
  timestamp: string
  verified: boolean
  transactionHash: string
  temperature?: number
  notes?: string
}

interface TraceabilityCertificate {
  id: string
  animalId: string
  animalTag: string
  breed: string
  birthDate: string
  birthLocation: string
  currentStatus: string
  healthRecords: {
    vaccinations: number
    treatments: number
    healthChecks: number
  }
  certifications: string[]
  supplyChainLength: number
  blockchainVerified: boolean
  lastUpdated: string
}

interface BlockchainTraceabilityProps {
  farmId: string
}

const eventTypeColors: Record<string, string> = {
  birth: 'bg-pink-100 text-pink-800',
  transfer: 'bg-blue-100 text-blue-800',
  vaccination: 'bg-green-100 text-green-800',
  treatment: 'bg-amber-100 text-amber-800',
  weight: 'bg-purple-100 text-purple-800',
  sale: 'bg-cyan-100 text-cyan-800',
  processing: 'bg-red-100 text-red-800',
}

const stageColors: Record<string, string> = {
  farm: 'bg-green-500',
  transport: 'bg-blue-500',
  auction: 'bg-purple-500',
  abattoir: 'bg-red-500',
  processing: 'bg-orange-500',
  retail: 'bg-cyan-500',
  consumer: 'bg-gray-500',
}

// Mock blockchain records
const mockBlockchainRecords: BlockchainRecord[] = [
  {
    id: 'block-1',
    animalId: 'animal-001',
    animalTag: 'C001',
    blockNumber: 1234567,
    transactionHash: '0x7f9fade1c0d57a7af66ab4ead7c2eb7b11a91385',
    timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    eventType: 'birth',
    data: { breed: 'Brahman', dam: 'D045', sire: 'S012', weight: 35 },
    verifiedBy: ['Farm Manager', 'Veterinarian'],
    previousHash: '0x0000000000000000',
    currentHash: '0x7f9fade1c0d57a7af66ab4ead7c2eb7b11a91385',
    status: 'verified',
  },
  {
    id: 'block-2',
    animalId: 'animal-001',
    animalTag: 'C001',
    blockNumber: 1234568,
    transactionHash: '0x8a0gbef2d1e68b8bg77bc5fbe8d3fc8c22a02496',
    timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    eventType: 'vaccination',
    data: { vaccine: 'FMD', batch: 'FMD-2024-001', veterinarian: 'Dr. Smith' },
    verifiedBy: ['Veterinarian', 'Quality Control'],
    previousHash: '0x7f9fade1c0d57a7af66ab4ead7c2eb7b11a91385',
    currentHash: '0x8a0gbef2d1e68b8bg77bc5fbe8d3fc8c22a02496',
    status: 'verified',
  },
  {
    id: 'block-3',
    animalId: 'animal-001',
    animalTag: 'C001',
    blockNumber: 1234569,
    transactionHash: '0x9b1hcff3e2f79c9ch88cd6gcf9e4gd9d33b13507',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    eventType: 'weight',
    data: { weight: 420, method: 'scale', bodyConditionScore: 3.5 },
    verifiedBy: ['Farm Manager'],
    previousHash: '0x8a0gbef2d1e68b8bg77bc5fbe8d3fc8c22a02496',
    currentHash: '0x9b1hcff3e2f79c9ch88cd6gcf9e4gd9d33b13507',
    status: 'confirmed',
  },
]

// Mock supply chain events
const mockSupplyChain: SupplyChainEvent[] = [
  {
    id: 'sc-1',
    animalId: 'animal-001',
    stage: 'farm',
    location: 'Leruo Farm, North Pasture',
    handler: 'John Farmer',
    timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    verified: true,
    transactionHash: '0x7f9fade1c0d57a7af66ab4ead7c2eb7b11a91385',
    notes: 'Animal born and raised on farm',
  },
  {
    id: 'sc-2',
    animalId: 'animal-001',
    stage: 'transport',
    location: 'Route: Farm → Auction',
    handler: 'SafeTrans Logistics',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    verified: true,
    transactionHash: '0xab2idgg4f3h8bd0di99de7hdg0f5he0e44c24618',
    temperature: 22,
    notes: 'Transport completed in 3 hours',
  },
  {
    id: 'sc-3',
    animalId: 'animal-001',
    stage: 'auction',
    location: 'Pretoria Livestock Auction',
    handler: 'Auction House Pty Ltd',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    verified: true,
    transactionHash: '0xbc3jehh5g4i9ce1ej00ef8ieh1g6if1f55d35729',
    notes: 'Sold to Premium Meats SA',
  },
]

// Mock certificate
const mockCertificate: TraceabilityCertificate = {
  id: 'cert-001',
  animalId: 'animal-001',
  animalTag: 'C001',
  breed: 'Brahman',
  birthDate: '2023-06-15',
  birthLocation: 'Leruo Farm, North Pasture',
  currentStatus: 'At Auction',
  healthRecords: {
    vaccinations: 5,
    treatments: 1,
    healthChecks: 8,
  },
  certifications: ['Animal Welfare Approved', 'Grass-Fed Certified', 'Antibiotic-Free'],
  supplyChainLength: 3,
  blockchainVerified: true,
  lastUpdated: new Date().toISOString(),
}

// ============================================
// MAIN COMPONENT
// ============================================

export function BlockchainTraceability({ farmId }: BlockchainTraceabilityProps) {
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState<BlockchainRecord[]>(mockBlockchainRecords)
  const [supplyChain, setSupplyChain] = useState<SupplyChainEvent[]>(mockSupplyChain)
  const [certificate, setCertificate] = useState<TraceabilityCertificate>(mockCertificate)
  const [searchTag, setSearchTag] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<BlockchainRecord | null>(null)
  const [recordDetailDialogOpen, setRecordDetailDialogOpen] = useState(false)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)

  // Search animal
  const searchAnimal = async () => {
    if (!searchTag) return

    setLoading(true)
    try {
      const sessionStr = localStorage.getItem('groway_session')
      const session = sessionStr ? JSON.parse(sessionStr) : null
      const merchantId = session?.merchantId || 'test-merchant'

      const response = await fetch(
        `/api/merchant-os/agriculture/livestock/blockchain/trace?merchantId=${merchantId}&animalTag=${searchTag}`
      )

      if (response.ok) {
        const data = await response.json()
        setRecords(data.records || mockBlockchainRecords)
        setSupplyChain(data.supplyChain || mockSupplyChain)
        setCertificate(data.certificate || mockCertificate)
      }
    } catch (error) {
      console.error('Failed to search animal:', error)
    } finally {
      setLoading(false)
    }
  }

  // Generate QR code
  const generateQRCode = () => {
    setQrDialogOpen(true)
  }

  // Export certificate
  const exportCertificate = async () => {
    console.log('Exporting certificate for', certificate.animalTag)
    alert('Certificate would be exported as PDF')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Link className="w-5 h-5" />
            Blockchain Traceability
          </h2>
          <p className="text-sm text-gray-500">Immutable animal origin and supply chain tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={generateQRCode}>
            <QrCode className="w-4 h-4 mr-2" />
            Generate QR
          </Button>
          <Button
            size="sm"
            className="bg-amber-600 hover:bg-amber-700"
            onClick={exportCertificate}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Certificate
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by animal tag (e.g., C001)"
                value={searchTag}
                onChange={(e) => setSearchTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchAnimal()}
              />
            </div>
            <Button onClick={searchAnimal} disabled={loading}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Certificate Card */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-lg bg-amber-100 flex items-center justify-center">
                <Shield className="w-7 h-7 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-amber-900">Traceability Certificate</h3>
                <p className="text-sm text-amber-700">
                  Animal: <span className="font-medium">{certificate.animalTag}</span> • {certificate.breed}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {certificate.blockchainVerified ? (
                    <Badge className="bg-green-500">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Blockchain Verified
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending Verification
                    </Badge>
                  )}
                  {certificate.certifications.map((cert, idx) => (
                    <Badge key={idx} variant="outline" className="border-amber-300 text-amber-700">
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-amber-600">Certificate ID</p>
              <p className="font-mono text-sm">{certificate.id}</p>
              <p className="text-xs text-amber-600 mt-2">Last Updated</p>
              <p className="text-sm">{new Date(certificate.lastUpdated).toLocaleDateString()}</p>
            </div>
          </div>

          <Separator className="my-4 bg-amber-200" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-amber-600">Birth Date</p>
              <p className="font-medium">{new Date(certificate.birthDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-amber-600">Birth Location</p>
              <p className="font-medium">{certificate.birthLocation}</p>
            </div>
            <div>
              <p className="text-xs text-amber-600">Current Status</p>
              <p className="font-medium">{certificate.currentStatus}</p>
            </div>
            <div>
              <p className="text-xs text-amber-600">Supply Chain Steps</p>
              <p className="font-medium">{certificate.supplyChainLength} recorded</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-amber-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-700">{certificate.healthRecords.vaccinations}</p>
              <p className="text-xs text-amber-600">Vaccinations</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-700">{certificate.healthRecords.treatments}</p>
              <p className="text-xs text-amber-600">Treatments</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-700">{certificate.healthRecords.healthChecks}</p>
              <p className="text-xs text-amber-600">Health Checks</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="blockchain" className="space-y-4">
        <TabsList>
          <TabsTrigger value="blockchain">Blockchain Records</TabsTrigger>
          <TabsTrigger value="supply-chain">Supply Chain</TabsTrigger>
          <TabsTrigger value="verify">Verify Record</TabsTrigger>
        </TabsList>

        {/* Blockchain Records Tab */}
        <TabsContent value="blockchain">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="w-4 h-4" />
                Blockchain Transaction History
              </CardTitle>
              <CardDescription>Immutable record of all animal events</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {records.map((record, index) => (
                    <div key={record.id} className="relative">
                      {/* Timeline connector */}
                      {index < records.length - 1 && (
                        <div className="absolute left-5 top-12 w-0.5 h-full bg-gray-200" />
                      )}

                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          record.status === 'verified' ? 'bg-green-100' :
                          record.status === 'confirmed' ? 'bg-blue-100' : 'bg-amber-100'
                        }`}>
                          {record.status === 'verified' ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : record.status === 'confirmed' ? (
                            <Activity className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-amber-600" />
                          )}
                        </div>

                        <div
                          className="flex-1 p-4 rounded-lg border cursor-pointer hover:bg-gray-50"
                          onClick={() => {
                            setSelectedRecord(record)
                            setRecordDetailDialogOpen(true)
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge className={eventTypeColors[record.eventType]}>
                                {record.eventType}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                Block #{record.blockNumber}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400">
                              {new Date(record.timestamp).toLocaleString()}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Transaction Hash</p>
                              <p className="font-mono text-xs truncate">{record.transactionHash}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Verified By</p>
                              <p className="text-xs">{record.verifiedBy.join(', ')}</p>
                            </div>
                          </div>

                          <Button variant="ghost" size="sm" className="mt-2">
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Supply Chain Tab */}
        <TabsContent value="supply-chain">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Supply Chain Journey
              </CardTitle>
              <CardDescription>Track animal from farm to consumer</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  {['Farm', 'Transport', 'Auction', 'Abattoir', 'Processing', 'Retail', 'Consumer'].map((stage, idx) => {
                    const isCompleted = idx <= supplyChain.length - 1
                    const isCurrent = idx === supplyChain.length - 1

                    return (
                      <div key={stage} className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isCompleted
                              ? isCurrent
                                ? 'bg-amber-500 text-white'
                                : 'bg-green-500 text-white'
                              : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {isCompleted ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                        </div>
                        <p className={`text-xs mt-1 ${isCurrent ? 'font-medium text-amber-600' : ''}`}>
                          {stage}
                        </p>
                      </div>
                    )
                  })}
                </div>
                <Progress value={(supplyChain.length / 7) * 100} className="h-2" />
              </div>

              {/* Events List */}
              <ScrollArea className="h-72">
                <div className="space-y-4">
                  {supplyChain.map((event) => (
                    <div key={event.id} className="flex items-start gap-4 p-4 rounded-lg border">
                      <div className={`w-3 h-3 rounded-full mt-1.5 ${stageColors[event.stage]}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p className="font-medium capitalize">{event.stage}</p>
                            {event.verified && (
                              <Badge className="bg-green-500">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          {event.location}
                        </p>
                        <p className="text-sm text-gray-600">
                          <User className="w-3 h-3 inline mr-1" />
                          {event.handler}
                        </p>
                        {event.temperature && (
                          <p className="text-xs text-gray-500 mt-1">
                            Temperature during transport: {event.temperature}°C
                          </p>
                        )}
                        {event.notes && (
                          <p className="text-xs text-gray-500 mt-1">{event.notes}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Hash className="w-3 h-3 text-gray-400" />
                          <p className="font-mono text-xs text-gray-400 truncate">
                            {event.transactionHash}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verify Record Tab */}
        <TabsContent value="verify">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Verify Blockchain Record
              </CardTitle>
              <CardDescription>Enter a transaction hash to verify authenticity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verifyHash">Transaction Hash</Label>
                  <Input
                    id="verifyHash"
                    placeholder="0x..."
                    className="font-mono"
                  />
                </div>

                <Button className="bg-amber-600 hover:bg-amber-700">
                  <Shield className="w-4 h-4 mr-2" />
                  Verify Record
                </Button>

                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Record Verified Successfully</p>
                      <p className="text-sm text-green-600">
                        This transaction exists on the blockchain and has not been tampered with.
                      </p>
                    </div>
                  </div>

                  <Separator className="my-4 bg-green-200" />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-green-600">Block Number</p>
                      <p className="font-medium">#1234567</p>
                    </div>
                    <div>
                      <p className="text-green-600">Timestamp</p>
                      <p className="font-medium">2024-06-15 10:30:00 UTC</p>
                    </div>
                    <div>
                      <p className="text-green-600">Confirmations</p>
                      <p className="font-medium">1,234 blocks</p>
                    </div>
                    <div>
                      <p className="text-green-600">Network</p>
                      <p className="font-medium">Groway Chain Mainnet</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800">How Verification Works</p>
                      <p className="text-sm text-blue-600 mt-1">
                        Each record is cryptographically hashed and stored on the blockchain.
                        The hash ensures that the record cannot be altered without detection.
                        This provides immutable proof of the animal's history and origin.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Animal QR Code</DialogTitle>
            <DialogDescription>
              Scan to view traceability information
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <QrCode className="w-32 h-32 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">Animal: {certificate.animalTag}</p>
            <p className="text-xs text-gray-400 mt-1">
              Certificate ID: {certificate.id}
            </p>
            <Button variant="outline" size="sm" className="mt-4">
              <Download className="w-4 h-4 mr-2" />
              Download QR Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record Detail Dialog */}
      <Dialog open={recordDetailDialogOpen} onOpenChange={setRecordDetailDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Blockchain Record Details</DialogTitle>
            <DialogDescription>
              {selectedRecord?.eventType} event for {selectedRecord?.animalTag}
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={eventTypeColors[selectedRecord.eventType]}>
                    {selectedRecord.eventType}
                  </Badge>
                  <Badge className={
                    selectedRecord.status === 'verified' ? 'bg-green-500' :
                    selectedRecord.status === 'confirmed' ? 'bg-blue-500' : 'bg-amber-500'
                  }>
                    {selectedRecord.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">
                  {new Date(selectedRecord.timestamp).toLocaleString()}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Transaction Hash</p>
                    <p className="font-mono text-sm break-all">{selectedRecord.transactionHash}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Block Number</p>
                    <p className="font-medium">#{selectedRecord.blockNumber}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Verified By</p>
                    <p className="text-sm">{selectedRecord.verifiedBy.join(', ')}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-2">Event Data</p>
                <pre className="text-xs bg-gray-100 p-3 rounded-lg overflow-x-auto">
                  {JSON.stringify(selectedRecord.data, null, 2)}
                </pre>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Explorer
                </Button>
                <Button variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
