'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  Camera,
  Upload,
  Image,
  Scale,
  Brain,
  Target,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Save,
  Eye,
  Sparkles,
  FileImage,
} from 'lucide-react'

// ============================================
// TYPES
// ============================================

interface WeightEstimate {
  id: string
  animalId?: string
  animalTag?: string
  imageUrl: string
  estimatedWeight: number
  confidenceLevel: number
  weightRange: {
    min: number
    max: number
  }
  bodyConditionScore?: number
  estimatedAge?: string
  breedIndication?: string
  healthIndicators: string[]
  recommendations: string[]
  analyzedAt: string
  status: 'pending' | 'analyzing' | 'completed' | 'failed'
}

interface PhotoSession {
  id: string
  animalTag: string
  photos: {
    id: string
    url: string
    angle: 'side' | 'front' | 'rear' | 'top'
    timestamp: string
  }[]
  compositeWeight?: number
  confidenceLevel?: number
}

interface AIWeightEstimatorProps {
  farmId: string
}

const angleLabels: Record<string, string> = {
  side: 'Side View (Best for weight)',
  front: 'Front View',
  rear: 'Rear View',
  top: 'Top/Aerial View',
}

const angleColors: Record<string, string> = {
  side: 'bg-green-100 text-green-800',
  front: 'bg-blue-100 text-blue-800',
  rear: 'bg-purple-100 text-purple-800',
  top: 'bg-amber-100 text-amber-800',
}

// ============================================
// MAIN COMPONENT
// ============================================

export function AIWeightEstimator({ farmId }: AIWeightEstimatorProps) {
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [estimates, setEstimates] = useState<WeightEstimate[]>([])
  const [selectedEstimate, setSelectedEstimate] = useState<WeightEstimate | null>(null)
  
  // Upload state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null)
  const [photoAngle, setPhotoAngle] = useState<'side' | 'front' | 'rear' | 'top'>('side')
  const [animalTag, setAnimalTag] = useState('')
  
  // Reference object
  const [hasReferenceObject, setHasReferenceObject] = useState(false)
  const [referenceType, setReferenceType] = useState('ruler')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setCurrentPhoto(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Analyze image using AI
  const analyzeImage = async () => {
    if (!currentPhoto) return
    
    setAnalyzing(true)
    try {
      const sessionStr = localStorage.getItem('groway_session')
      const session = sessionStr ? JSON.parse(sessionStr) : null
      const merchantId = session?.merchantId || 'test-merchant'

      const response = await fetch('/api/merchant-os/agriculture/livestock/ai/weight-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmId,
          merchantId,
          animalTag,
          imageUrl: currentPhoto,
          photoAngle,
          hasReferenceObject,
          referenceType,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const estimate: WeightEstimate = {
          id: data.id || `est-${Date.now()}`,
          animalTag,
          imageUrl: currentPhoto,
          estimatedWeight: data.estimatedWeight,
          confidenceLevel: data.confidenceLevel,
          weightRange: data.weightRange,
          bodyConditionScore: data.bodyConditionScore,
          estimatedAge: data.estimatedAge,
          breedIndication: data.breedIndication,
          healthIndicators: data.healthIndicators || [],
          recommendations: data.recommendations || [],
          analyzedAt: new Date().toISOString(),
          status: 'completed',
        }
        
        setEstimates(prev => [estimate, ...prev])
        setSelectedEstimate(estimate)
        setUploadDialogOpen(false)
        setCurrentPhoto(null)
        setAnimalTag('')
      }
    } catch (error) {
      console.error('Failed to analyze image:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  // Save estimate as weight record
  const saveAsWeightRecord = async (estimate: WeightEstimate) => {
    try {
      const sessionStr = localStorage.getItem('groway_session')
      const session = sessionStr ? JSON.parse(sessionStr) : null
      const merchantId = session?.merchantId || 'test-merchant'

      const response = await fetch(`/api/merchant-os/agriculture/livestock/weight?merchantId=${merchantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmId,
          animalTag: estimate.animalTag,
          weight: estimate.estimatedWeight,
          method: 'AI_ESTIMATE',
          bodyConditionScore: estimate.bodyConditionScore,
          notes: `AI estimated weight (confidence: ${estimate.confidenceLevel}%). Range: ${estimate.weightRange.min}-${estimate.weightRange.max} kg`,
        }),
      })

      if (response.ok) {
        // Update estimate status
        setEstimates(prev => 
          prev.map(e => e.id === estimate.id ? { ...e, saved: true } : e)
        )
      }
    } catch (error) {
      console.error('Failed to save weight record:', error)
    }
  }

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-600 bg-green-100'
    if (confidence >= 70) return 'text-lime-600 bg-lime-100'
    if (confidence >= 50) return 'text-amber-600 bg-amber-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Weight Estimation
          </h2>
          <p className="text-sm text-gray-500">Upload photos for AI-powered weight analysis</p>
        </div>
        <Button 
          size="sm" 
          className="bg-amber-600 hover:bg-amber-700"
          onClick={() => setUploadDialogOpen(true)}
        >
          <Camera className="w-4 h-4 mr-2" />
          Upload Photo
        </Button>
      </div>

      {/* How it Works */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium text-amber-900">AI-Powered Analysis</h3>
              <p className="text-sm text-amber-700 mt-1">
                Upload a clear side-view photo of your animal. For best results, include a reference object 
                (like a measuring stick) and ensure the animal is standing on level ground. The AI will estimate 
                weight, body condition, and provide health indicators.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">Recent Estimates</TabsTrigger>
          <TabsTrigger value="guide">Photo Guide</TabsTrigger>
        </TabsList>

        {/* Recent Estimates Tab */}
        <TabsContent value="recent">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Estimates List */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Recent Analysis</CardTitle>
                <CardDescription>AI-generated weight estimates</CardDescription>
              </CardHeader>
              <CardContent>
                {estimates.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Camera className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">No estimates yet</p>
                    <p className="text-sm mb-4">Upload a photo to get started</p>
                    <Button onClick={() => setUploadDialogOpen(true)}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photo
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {estimates.map((estimate) => (
                        <div
                          key={estimate.id}
                          className={`flex gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                            selectedEstimate?.id === estimate.id
                              ? 'bg-amber-50 border-amber-300'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedEstimate(estimate)}
                        >
                          {/* Thumbnail */}
                          <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <img
                              src={estimate.imageUrl}
                              alt="Animal"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{estimate.animalTag || 'Unknown Animal'}</p>
                              <Badge className={getConfidenceColor(estimate.confidenceLevel)}>
                                {estimate.confidenceLevel}% confident
                              </Badge>
                            </div>
                            
                            <p className="text-2xl font-bold text-amber-600">
                              {estimate.estimatedWeight} kg
                            </p>
                            <p className="text-sm text-gray-500">
                              Range: {estimate.weightRange.min} - {estimate.weightRange.max} kg
                            </p>
                            
                            <div className="flex items-center gap-4 mt-2">
                              {estimate.bodyConditionScore && (
                                <span className="text-xs text-gray-500">
                                  BCS: {estimate.bodyConditionScore}/5
                                </span>
                              )}
                              <span className="text-xs text-gray-500">
                                {new Date(estimate.analyzedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                saveAsWeightRecord(estimate)
                              }}
                            >
                              <Save className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Selected Estimate Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedEstimate ? 'Analysis Details' : 'Select an Estimate'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedEstimate ? (
                  <div className="text-center py-8 text-gray-500">
                    <Eye className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Select an estimate to view details</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Image */}
                    <div className="rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={selectedEstimate.imageUrl}
                        alt="Animal"
                        className="w-full h-48 object-cover"
                      />
                    </div>

                    {/* Weight */}
                    <div className="p-4 bg-amber-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Estimated Weight</p>
                      <p className="text-3xl font-bold text-amber-600">
                        {selectedEstimate.estimatedWeight} kg
                      </p>
                      <Progress 
                        value={selectedEstimate.confidenceLevel} 
                        className="h-2 mt-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedEstimate.confidenceLevel}% confidence
                      </p>
                    </div>

                    {/* Range */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Min Estimate</p>
                        <p className="text-lg font-bold">{selectedEstimate.weightRange.min} kg</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Max Estimate</p>
                        <p className="text-lg font-bold">{selectedEstimate.weightRange.max} kg</p>
                      </div>
                    </div>

                    {/* Health Indicators */}
                    {selectedEstimate.healthIndicators.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Health Indicators</p>
                        <div className="space-y-2">
                          {selectedEstimate.healthIndicators.map((indicator, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span>{indicator}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {selectedEstimate.recommendations.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Recommendations</p>
                        <div className="space-y-2">
                          {selectedEstimate.recommendations.map((rec, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm">
                              <Target className="w-4 h-4 text-amber-500 mt-0.5" />
                              <span>{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button
                      className="w-full bg-amber-600 hover:bg-amber-700"
                      onClick={() => saveAsWeightRecord(selectedEstimate)}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save as Weight Record
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Photo Guide Tab */}
        <TabsContent value="guide">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(angleLabels).map(([angle, label]) => (
              <Card key={angle}>
                <CardContent className="p-4">
                  <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                    <Camera className="w-12 h-12 text-gray-300" />
                  </div>
                  <Badge className={angleColors[angle]}>{label}</Badge>
                  <p className="text-sm text-gray-500 mt-2">
                    {angle === 'side' && 'Best angle for weight estimation. Capture the full profile of the animal.'}
                    {angle === 'front' && 'Useful for body condition and symmetry assessment.'}
                    {angle === 'rear' && 'Helpful for hindquarters development analysis.'}
                    {angle === 'top' && 'Good for overall body shape and condition.'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Tips for Best Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Good Lighting</p>
                      <p className="text-sm text-gray-500">Take photos in natural daylight for best clarity</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Reference Object</p>
                      <p className="text-sm text-gray-500">Include a measuring stick or known-size object</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Level Ground</p>
                      <p className="text-sm text-gray-500">Ensure the animal is standing on flat, level ground</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Avoid Shadows</p>
                      <p className="text-sm text-gray-500">Position yourself to minimize shadows on the animal</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Clear View</p>
                      <p className="text-sm text-gray-500">Ensure no obstructions between camera and animal</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Full Frame</p>
                      <p className="text-sm text-gray-500">Capture the entire animal within the frame</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Photo for Analysis</DialogTitle>
            <DialogDescription>
              Upload a clear photo of the animal for AI weight estimation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Animal Tag */}
            <div className="space-y-2">
              <Label htmlFor="animalTag">Animal Tag (Optional)</Label>
              <Input
                id="animalTag"
                placeholder="e.g., C001"
                value={animalTag}
                onChange={(e) => setAnimalTag(e.target.value)}
              />
            </div>

            {/* Photo Angle */}
            <div className="space-y-2">
              <Label htmlFor="photoAngle">Photo Angle</Label>
              <Select
                value={photoAngle}
                onValueChange={(value: 'side' | 'front' | 'rear' | 'top') => setPhotoAngle(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(angleLabels).map(([angle, label]) => (
                    <SelectItem key={angle} value={angle}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reference Object */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasReference"
                checked={hasReferenceObject}
                onChange={(e) => setHasReferenceObject(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="hasReference" className="font-normal">
                Photo includes a reference object (improves accuracy)
              </Label>
            </div>

            {hasReferenceObject && (
              <div className="space-y-2">
                <Label htmlFor="referenceType">Reference Type</Label>
                <Select
                  value={referenceType}
                  onValueChange={setReferenceType}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ruler">Measuring Stick/Ruler</SelectItem>
                    <SelectItem value="person">Person (avg height)</SelectItem>
                    <SelectItem value="post">Fence Post</SelectItem>
                    <SelectItem value="other">Other Known Object</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Photo Upload */}
            <div className="space-y-2">
              <Label>Photo</Label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {currentPhoto ? (
                <div className="relative">
                  <img
                    src={currentPhoto}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => setCurrentPhoto(null)}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={analyzeImage}
              disabled={!currentPhoto || analyzing}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Analyze Photo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
