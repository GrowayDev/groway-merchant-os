'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Pig,
  Bird,
  Horse,
  Dog,
  Rabbit,
  Fish,
  Leaf,
  Users,
  User,
  Calendar,
  Scale,
  Tag,
  Camera,
  FileText,
  Loader2,
  Upload,
  X,
  ChevronRight,
  MapPin,
} from 'lucide-react'

// Species configuration with breeds
const SPECIES_CONFIG = {
  cattle: {
    label: 'Cattle',
    icon: Pig,
    breeds: [
      'Angus', 'Hereford', 'Simmental', 'Brahman', 'Bonsmara', 'Afrikaner',
      'Nguni', 'Drakensberger', 'Santa Gertrudis', 'Charolais', 'Limousin',
      'Shorthorn', ' Sussex', 'Holstein', 'Jersey', 'Crossbreed', 'Other'
    ]
  },
  pigs: {
    label: 'Pigs',
    icon: Pig,
    breeds: [
      'Large White', 'Landrace', 'Duroc', 'Hampshire', 'Pietrain',
      'Chester White', 'Berkshire', 'Tamworth', 'Kolbroek', 'Windsnyer',
      'Crossbreed', 'Other'
    ]
  },
  sheep: {
    label: 'Sheep',
    icon: Rabbit,
    breeds: [
      'Merino', 'Dorper', 'Dorset', 'Suffolk', 'Hampshire', 'Southdown',
      'Corriedale', 'Romney', 'Border Leicester', 'Ile de France', 'Awassi',
      'Persian', 'Namaqua Afrikaner', 'Crossbreed', 'Other'
    ]
  },
  goats: {
    label: 'Goats',
    icon: Rabbit,
    breeds: [
      'Boer', 'Saanen', 'Anglo-Nubian', 'Toggenburg', 'Alpine', 'LaMancha',
      'Oberhasli', 'Kiko', 'Spanish', 'Savanna', 'Kalahari Red',
      'Indigenous', 'Crossbreed', 'Other'
    ]
  },
  poultry: {
    label: 'Poultry',
    icon: Bird,
    breeds: [
      'Ross', 'Cobb', 'Hy-Line', 'Isa Brown', 'Lohmann', 'Bovans',
      'Koekoek', 'Ovambo', 'Venda', 'Australorp', 'Rhode Island Red',
      'Leghorn', 'Plymouth Rock', 'Orpington', 'Other'
    ]
  },
  horse: {
    label: 'Horse',
    icon: Horse,
    breeds: [
      'Thoroughbred', 'Arabian', 'Quarter Horse', 'Warmblood', 'Friesian',
      'Andalusian', 'Clydesdale', 'Percheron', 'Shire', 'Appaloosa',
      'Paint Horse', 'Mustang', 'Boerperd', 'Nooitgedachter', 'Welsh Pony',
      'Crossbreed', 'Other'
    ]
  },
  game: {
    label: 'Game',
    icon: Leaf,
    breeds: [
      'Impala', 'Kudu', 'Wildebeest', 'Springbok', 'Blesbok', 'Waterbuck',
      'Eland', 'Giraffe', 'Zebra', 'Warthog', 'Bushpig', 'Nyala',
      'Sable', 'Roan', 'Buffalo', 'Elephant', 'Rhino', 'Lion', 'Leopard',
      'Other'
    ]
  }
} as const

type SpeciesKey = keyof typeof SPECIES_CONFIG

// Gender options
const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'castrated_male', label: 'Castrated Male' },
] as const

// Production type options
const PRODUCTION_TYPE_OPTIONS = [
  { value: 'breeding', label: 'Breeding' },
  { value: 'commercial', label: 'Commercial' },
] as const

// System type options
const SYSTEM_TYPE_OPTIONS = [
  { value: 'grazing', label: 'Grazing' },
  { value: 'feedlot', label: 'Feedlot' },
  { value: 'hybrid', label: 'Hybrid' },
] as const

// Classification options
const CLASSIFICATION_OPTIONS = [
  { value: 'breeding_stock', label: 'Breeding Stock' },
  { value: 'commercial_stock', label: 'Commercial Stock' },
  { value: 'replacement_stock', label: 'Replacement Stock' },
  { value: 'cull', label: 'Cull' },
] as const

// Weight unit options
const WEIGHT_UNIT_OPTIONS = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'lb', label: 'Pounds (lb)' },
] as const

// Individual animal form schema
const individualAnimalSchema = z.object({
  species: z.string().min(1, 'Species is required'),
  breed: z.string().min(1, 'Breed is required'),
  identificationNumber: z.string().min(1, 'Identification number is required'),
  gender: z.string().min(1, 'Gender is required'),
  birthDate: z.string().optional(),
  productionType: z.string().min(1, 'Production type is required'),
  systemType: z.string().min(1, 'System type is required'),
  classification: z.string().min(1, 'Classification is required'),
  weight: z.number().min(0, 'Weight must be a positive number').optional(),
  weightUnit: z.string().default('kg'),
  damId: z.string().optional(),
  sireId: z.string().optional(),
  campId: z.string().optional(),
  photoUrl: z.string().optional(),
  notes: z.string().optional(),
})

// Batch animal form schema
const batchAnimalSchema = z.object({
  species: z.string().min(1, 'Species is required'),
  breed: z.string().min(1, 'Breed is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  batchStartDate: z.string().min(1, 'Batch start date is required'),
  productionType: z.string().min(1, 'Production type is required'),
  systemType: z.string().min(1, 'System type is required'),
  averageWeight: z.number().min(0, 'Weight must be a positive number').optional(),
  weightUnit: z.string().default('kg'),
  campId: z.string().optional(),
  notes: z.string().optional(),
})

type IndividualAnimalForm = z.infer<typeof individualAnimalSchema>
type BatchAnimalForm = z.infer<typeof batchAnimalSchema>

interface AddAnimalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  farmId: string
  onSuccess?: () => void
  // Optional data for dropdowns
  existingAnimals?: Array<{ id: string; identificationNumber: string; species: string; gender: string }>
  camps?: Array<{ id: string; name: string }>
}

export function AddAnimalDialog({
  open,
  onOpenChange,
  farmId,
  onSuccess,
  existingAnimals = [],
  camps = [],
}: AddAnimalDialogProps) {
  const [trackingType, setTrackingType] = useState<'individual' | 'batch'>('individual')
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesKey | ''>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Individual form
  const individualForm = useForm<IndividualAnimalForm>({
    resolver: zodResolver(individualAnimalSchema),
    defaultValues: {
      species: '',
      breed: '',
      identificationNumber: '',
      gender: '',
      birthDate: '',
      productionType: '',
      systemType: '',
      classification: '',
      weight: undefined,
      weightUnit: 'kg',
      damId: '',
      sireId: '',
      campId: '',
      photoUrl: '',
      notes: '',
    },
  })

  // Batch form
  const batchForm = useForm<BatchAnimalForm>({
    resolver: zodResolver(batchAnimalSchema),
    defaultValues: {
      species: '',
      breed: '',
      quantity: 1,
      batchStartDate: new Date().toISOString().split('T')[0],
      productionType: '',
      systemType: '',
      averageWeight: undefined,
      weightUnit: 'kg',
      campId: '',
      notes: '',
    },
  })

  // Reset forms when dialog opens/closes
  useEffect(() => {
    if (!open) {
      individualForm.reset()
      batchForm.reset()
      setSelectedSpecies('')
      setPhotoPreview(null)
    }
  }, [open, individualForm, batchForm])

  // Update species selection for individual form
  const handleSpeciesChange = (species: string) => {
    setSelectedSpecies(species as SpeciesKey)
    individualForm.setValue('species', species)
    individualForm.setValue('breed', '') // Reset breed when species changes
    individualForm.setValue('damId', '') // Reset dam when species changes
    individualForm.setValue('sireId', '') // Reset sire when species changes
  }

  // Update species selection for batch form
  const handleBatchSpeciesChange = (species: string) => {
    setSelectedSpecies(species as SpeciesKey)
    batchForm.setValue('species', species)
    batchForm.setValue('breed', '') // Reset breed when species changes
  }

  // Handle photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        setPhotoPreview(base64)
        individualForm.setValue('photoUrl', base64)
      }
      reader.readAsDataURL(file)
    }
  }

  // Remove photo
  const handleRemovePhoto = () => {
    setPhotoPreview(null)
    individualForm.setValue('photoUrl', '')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Filter potential parents by species and gender
  const potentialDams = existingAnimals.filter(
    a => a.species === selectedSpecies && a.gender === 'female'
  )
  const potentialSires = existingAnimals.filter(
    a => a.species === selectedSpecies && a.gender === 'male'
  )

  // Get available breeds for selected species
  const availableBreeds = selectedSpecies ? SPECIES_CONFIG[selectedSpecies].breeds : []

  // Submit individual animal
  const onSubmitIndividual = async (data: IndividualAnimalForm) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/merchant-os/agriculture/animals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmId,
          trackingType: 'individual',
          ...data,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('Animal added successfully', {
          description: `Added ${data.identificationNumber} to your livestock records.`,
        })
        individualForm.reset()
        setPhotoPreview(null)
        onOpenChange(false)
        onSuccess?.()
      } else {
        throw new Error(result.error || 'Failed to add animal')
      }
    } catch (error) {
      toast.error('Failed to add animal', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit batch animals
  const onSubmitBatch = async (data: BatchAnimalForm) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/merchant-os/agriculture/animals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmId,
          trackingType: 'batch',
          ...data,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('Batch added successfully', {
          description: `Added batch of ${data.quantity} ${SPECIES_CONFIG[data.species as SpeciesKey]?.label || data.species} to your livestock records.`,
        })
        batchForm.reset()
        onOpenChange(false)
        onSuccess?.()
      } else {
        throw new Error(result.error || 'Failed to add batch')
      }
    } catch (error) {
      toast.error('Failed to add batch', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            {trackingType === 'individual' ? (
              <User className="h-5 w-5 text-[#00897B]" />
            ) : (
              <Users className="h-5 w-5 text-[#00897B]" />
            )}
            Add {trackingType === 'individual' ? 'Animal' : 'Batch'}
          </DialogTitle>
          <DialogDescription>
            {trackingType === 'individual'
              ? 'Add a single animal with detailed tracking information.'
              : 'Add a group of animals as a batch for simplified tracking.'}
          </DialogDescription>
        </DialogHeader>

        {/* Tracking Type Toggle */}
        <div className="px-6 pb-4">
          <div className="flex border rounded-lg overflow-hidden">
            <button
              type="button"
              className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                trackingType === 'individual'
                  ? 'bg-[#00897B] text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setTrackingType('individual')}
            >
              <User className="h-4 w-4" />
              Individual Animal
            </button>
            <button
              type="button"
              className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                trackingType === 'batch'
                  ? 'bg-[#00897B] text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setTrackingType('batch')}
            >
              <Users className="h-4 w-4" />
              Batch / Group
            </button>
          </div>
        </div>

        <ScrollArea className="flex-1 px-6">
          {trackingType === 'individual' ? (
            /* Individual Animal Form */
            <Form {...individualForm}>
              <form id="individual-form" onSubmit={individualForm.handleSubmit(onSubmitIndividual)} className="space-y-6 pb-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-[#00897B]" />
                    Basic Information
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Species */}
                    <FormField
                      control={individualForm.control}
                      name="species"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Species *</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value)
                              handleSpeciesChange(value)
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select species" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(SPECIES_CONFIG).map(([key, config]) => {
                                const IconComponent = config.icon
                                return (
                                  <SelectItem key={key} value={key}>
                                    <div className="flex items-center gap-2">
                                      <IconComponent className="h-4 w-4" />
                                      {config.label}
                                    </div>
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Breed */}
                    <FormField
                      control={individualForm.control}
                      name="breed"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Breed *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={!selectedSpecies}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={selectedSpecies ? "Select breed" : "Select species first"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableBreeds.map((breed) => (
                                <SelectItem key={breed} value={breed}>
                                  {breed}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Identification Number */}
                    <FormField
                      control={individualForm.control}
                      name="identificationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Identification Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ear tag, RFID, etc." {...field} />
                          </FormControl>
                          <FormDescription>
                            Ear tag number, RFID chip, or other identifier
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Gender */}
                    <FormField
                      control={individualForm.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {GENDER_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Birth Date */}
                    <FormField
                      control={individualForm.control}
                      name="birthDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Birth Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Classification */}
                    <FormField
                      control={individualForm.control}
                      name="classification"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Classification *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select classification" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CLASSIFICATION_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Production Details */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-[#00897B]" />
                    Production Details
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Production Type */}
                    <FormField
                      control={individualForm.control}
                      name="productionType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Production Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select production type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PRODUCTION_TYPE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* System Type */}
                    <FormField
                      control={individualForm.control}
                      name="systemType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>System Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select system type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {SYSTEM_TYPE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Weight */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Scale className="h-4 w-4 text-[#00897B]" />
                    Initial Weight
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Weight */}
                    <FormField
                      control={individualForm.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Enter weight"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => {
                                const value = e.target.value ? parseFloat(e.target.value) : undefined
                                field.onChange(value)
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Weight Unit */}
                    <FormField
                      control={individualForm.control}
                      name="weightUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {WEIGHT_UNIT_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Parentage */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#00897B]" />
                    Parentage (Optional)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Dam (Mother) */}
                    <FormField
                      control={individualForm.control}
                      name="damId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dam (Mother)</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={!selectedSpecies || potentialDams.length === 0}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={
                                  !selectedSpecies
                                    ? "Select species first"
                                    : potentialDams.length === 0
                                      ? "No dams available"
                                      : "Select dam"
                                } />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {potentialDams.map((dam) => (
                                <SelectItem key={dam.id} value={dam.id}>
                                  {dam.identificationNumber}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select from existing females of the same species
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Sire (Father) */}
                    <FormField
                      control={individualForm.control}
                      name="sireId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sire (Father)</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={!selectedSpecies || potentialSires.length === 0}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={
                                  !selectedSpecies
                                    ? "Select species first"
                                    : potentialSires.length === 0
                                      ? "No sires available"
                                      : "Select sire"
                                } />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {potentialSires.map((sire) => (
                                <SelectItem key={sire.id} value={sire.id}>
                                  {sire.identificationNumber}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select from existing males of the same species
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Location & Photo */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#00897B]" />
                    Location & Photo
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Camp/Pen */}
                    <FormField
                      control={individualForm.control}
                      name="campId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Camp / Pen</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={camps.length === 0}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={
                                  camps.length === 0
                                    ? "No camps configured"
                                    : "Select camp/pen"
                                } />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {camps.map((camp) => (
                                <SelectItem key={camp.id} value={camp.id}>
                                  {camp.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Photo Upload */}
                    <div className="space-y-2">
                      <Label>Photo</Label>
                      <div className="flex items-start gap-3">
                        {photoPreview ? (
                          <div className="relative">
                            <img
                              src={photoPreview}
                              alt="Preview"
                              className="w-20 h-20 object-cover rounded-lg border"
                            />
                            <button
                              type="button"
                              onClick={handleRemovePhoto}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-[#00897B] hover:bg-[#E0F2F1]/20 transition-colors"
                          >
                            <Camera className="h-5 w-5 text-gray-400" />
                            <span className="text-xs text-gray-400 mt-1">Add</span>
                          </button>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Notes */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#00897B]" />
                    Additional Notes
                  </h4>

                  <FormField
                    control={individualForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Any additional notes about this animal..."
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          ) : (
            /* Batch Animal Form */
            <Form {...batchForm}>
              <form id="batch-form" onSubmit={batchForm.handleSubmit(onSubmitBatch)} className="space-y-6 pb-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-[#00897B]" />
                    Batch Information
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Species */}
                    <FormField
                      control={batchForm.control}
                      name="species"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Species *</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value)
                              handleBatchSpeciesChange(value)
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select species" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(SPECIES_CONFIG).map(([key, config]) => {
                                const IconComponent = config.icon
                                return (
                                  <SelectItem key={key} value={key}>
                                    <div className="flex items-center gap-2">
                                      <IconComponent className="h-4 w-4" />
                                      {config.label}
                                    </div>
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Breed */}
                    <FormField
                      control={batchForm.control}
                      name="breed"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Breed *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={!selectedSpecies}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={selectedSpecies ? "Select breed" : "Select species first"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableBreeds.map((breed) => (
                                <SelectItem key={breed} value={breed}>
                                  {breed}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Quantity */}
                    <FormField
                      control={batchForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              placeholder="Number of animals"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormDescription>
                            Total number of animals in this batch
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Batch Start Date */}
                    <FormField
                      control={batchForm.control}
                      name="batchStartDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Batch Start Date *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormDescription>
                            Date when this batch was acquired or started
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Production Details */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-[#00897B]" />
                    Production Details
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Production Type */}
                    <FormField
                      control={batchForm.control}
                      name="productionType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Production Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select production type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PRODUCTION_TYPE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* System Type */}
                    <FormField
                      control={batchForm.control}
                      name="systemType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>System Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select system type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {SYSTEM_TYPE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Average Weight */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Scale className="h-4 w-4 text-[#00897B]" />
                    Initial Average Weight
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Average Weight */}
                    <FormField
                      control={batchForm.control}
                      name="averageWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Average Weight</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Enter average weight"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => {
                                const value = e.target.value ? parseFloat(e.target.value) : undefined
                                field.onChange(value)
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Average weight per animal in the batch
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Weight Unit */}
                    <FormField
                      control={batchForm.control}
                      name="weightUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {WEIGHT_UNIT_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Location */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#00897B]" />
                    Location
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Camp/Pen */}
                    <FormField
                      control={batchForm.control}
                      name="campId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Camp / Pen</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={camps.length === 0}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={
                                  camps.length === 0
                                    ? "No camps configured"
                                    : "Select camp/pen"
                                } />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {camps.map((camp) => (
                                <SelectItem key={camp.id} value={camp.id}>
                                  {camp.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Notes */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#00897B]" />
                    Additional Notes
                  </h4>

                  <FormField
                    control={batchForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Any additional notes about this batch..."
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          )}
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t bg-gray-50/50">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={trackingType === 'individual' ? 'individual-form' : 'batch-form'}
            className="bg-[#00897B] hover:bg-[#00695C]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                Add {trackingType === 'individual' ? 'Animal' : 'Batch'}
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AddAnimalDialog
