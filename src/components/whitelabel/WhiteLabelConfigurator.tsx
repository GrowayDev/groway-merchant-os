'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Palette,
  Globe,
  Mail,
  Image,
  Code,
  RefreshCw,
  Save,
  Eye,
  Monitor,
  Smartphone,
  Tablet,
  Check,
  X,
  Upload,
  Link2,
  Building2,
  Phone,
  FileText,
  Paintbrush,
  Type,
  Layout,
  Settings,
  ExternalLink,
  Loader2
} from 'lucide-react'

interface WhiteLabelConfig {
  id: string
  corporateId: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  logoUrl?: string
  logoDarkUrl?: string
  faviconUrl?: string
  customDomain?: string
  companyName?: string
  tagline?: string
  footerText?: string
  supportEmail?: string
  supportPhone?: string
  privacyPolicyUrl?: string
  termsUrl?: string
  customCss?: string
  emailHeaderHtml?: string
  emailFooterHtml?: string
  invoiceHeaderHtml?: string
  invoiceFooterHtml?: string
  receiptHeaderHtml?: string
  receiptFooterHtml?: string
  loginBackgroundUrl?: string
  customFonts?: string
  socialLinks?: string
  customScripts?: string
  active: boolean
}

interface Corporate {
  id: string
  name: string
  domain?: string
}

const colorPresets = [
  { name: 'GroWays Teal', primary: '#00897B', secondary: '#00695C', accent: '#4CAF50' },
  { name: 'Ocean Blue', primary: '#0077B6', secondary: '#005F8A', accent: '#00B4D8' },
  { name: 'Royal Purple', primary: '#7C3AED', secondary: '#5B21B6', accent: '#A78BFA' },
  { name: 'Sunset Orange', primary: '#F97316', secondary: '#EA580C', accent: '#FB923C' },
  { name: 'Forest Green', primary: '#059669', secondary: '#047857', accent: '#34D399' },
  { name: 'Rose Pink', primary: '#E11D48', secondary: '#BE123C', accent: '#FB7185' },
  { name: 'Midnight', primary: '#1E293B', secondary: '#0F172A', accent: '#475569' },
  { name: 'Golden', primary: '#D97706', secondary: '#B45309', accent: '#FBBF24' }
]

const fontOptions = [
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Poppins', value: 'Poppins, sans-serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Open Sans', value: 'Open Sans, sans-serif' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif' },
  { name: 'Lato', value: 'Lato, sans-serif' },
  { name: 'Playfair Display', value: 'Playfair Display, serif' },
  { name: 'Merriweather', value: 'Merriweather, serif' }
]

export default function WhiteLabelConfigurator() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [configs, setConfigs] = useState<WhiteLabelConfig[]>([])
  const [selectedConfig, setSelectedConfig] = useState<WhiteLabelConfig | null>(null)
  const [corporates, setCorporates] = useState<Corporate[]>([])
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  // Form state
  const [formData, setFormData] = useState<Partial<WhiteLabelConfig>>({
    primaryColor: '#00897B',
    secondaryColor: '#00695C',
    accentColor: '#4CAF50',
    active: true
  })

  // Fetch configurations
  const fetchConfigs = useCallback(async () => {
    try {
      const response = await fetch('/api/whitelabel')
      if (response.ok) {
        const data = await response.json()
        setConfigs(data.configs || [])
      }
    } catch (error) {
      console.error('Error fetching configs:', error)
    }
  }, [])

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchConfigs()
      
      // Mock corporates
      setCorporates([
        { id: 'corp-001', name: 'Acme Corporation', domain: 'acme.groways.co' },
        { id: 'corp-002', name: 'TechVentures Ltd', domain: 'techventures.groways.co' },
        { id: 'corp-003', name: 'Global Retail SA', domain: 'globalretail.groways.co' }
      ])
      
      setLoading(false)
    }
    loadData()
  }, [fetchConfigs])

  // Handle form change
  const handleFormChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Apply color preset
  const applyColorPreset = (preset: typeof colorPresets[0]) => {
    setFormData(prev => ({
      ...prev,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent
    }))
  }

  // Save configuration
  const saveConfig = async () => {
    if (!formData.corporateId) {
      toast.error('Please select a corporate client')
      return
    }

    setSaving(true)
    try {
      const method = selectedConfig ? 'PUT' : 'POST'
      const response = await fetch('/api/whitelabel', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('White-label configuration saved successfully')
        fetchConfigs()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to save configuration')
      }
    } catch {
      toast.error('Failed to save configuration')
    }
    setSaving(false)
  }

  // Load existing config
  const loadConfig = (config: WhiteLabelConfig) => {
    setSelectedConfig(config)
    setFormData({
      ...config,
      socialLinks: config.socialLinks ? JSON.parse(config.socialLinks) : null,
      customFonts: config.customFonts ? JSON.parse(config.customFonts) : null
    })
  }

  // Reset form
  const resetForm = () => {
    setSelectedConfig(null)
    setFormData({
      primaryColor: '#00897B',
      secondaryColor: '#00695C',
      accentColor: '#4CAF50',
      active: true
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-[#00897B]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Palette className="h-6 w-6 text-[#00897B]" />
            White-Label Configuration
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Customize branding, domains, and templates for enterprise clients
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
            onClick={resetForm}
          >
            <X className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button 
            size="sm"
            className="bg-[#00897B] hover:bg-[#00695C] text-white"
            onClick={saveConfig}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Configuration
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Configuration List */}
        <Card className="bg-[#1E293B] border-gray-700 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base">Configurations</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {configs.map((config) => (
                  <div
                    key={config.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedConfig?.id === config.id
                        ? 'bg-[#00897B]/20 border-[#00897B]/50'
                        : 'bg-[#0F172A] border-gray-700/50 hover:border-gray-600'
                    }`}
                    onClick={() => loadConfig(config)}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: config.primaryColor }}
                      >
                        <span className="text-white text-xs font-bold">
                          {config.companyName?.charAt(0) || 'G'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">
                          {config.companyName || 'Unnamed'}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {config.customDomain || config.corporateId}
                        </p>
                      </div>
                      {config.active ? (
                        <Badge className="bg-green-500/20 text-green-400 border-0">Active</Badge>
                      ) : (
                        <Badge className="bg-gray-500/20 text-gray-400 border-0">Inactive</Badge>
                      )}
                    </div>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  className="w-full mt-4 border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-gray-500"
                  onClick={resetForm}
                >
                  + New Configuration
                </Button>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Configuration Form */}
        <Card className="bg-[#1E293B] border-gray-700 lg:col-span-2">
          <CardContent className="p-4">
            <Tabs defaultValue="branding" className="w-full">
              <TabsList className="bg-[#0F172A] border border-gray-700 grid grid-cols-5 w-full mb-4">
                <TabsTrigger value="branding" className="data-[state=active]:bg-[#00897B]">
                  <Paintbrush className="h-4 w-4 mr-1" />
                  Branding
                </TabsTrigger>
                <TabsTrigger value="domain" className="data-[state=active]:bg-[#00897B]">
                  <Globe className="h-4 w-4 mr-1" />
                  Domain
                </TabsTrigger>
                <TabsTrigger value="templates" className="data-[state=active]:bg-[#00897B]">
                  <Mail className="h-4 w-4 mr-1" />
                  Templates
                </TabsTrigger>
                <TabsTrigger value="advanced" className="data-[state=active]:bg-[#00897B]">
                  <Code className="h-4 w-4 mr-1" />
                  Advanced
                </TabsTrigger>
                <TabsTrigger value="preview" className="data-[state=active]:bg-[#00897B]">
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </TabsTrigger>
              </TabsList>

              {/* Branding Tab */}
              <TabsContent value="branding" className="space-y-6">
                {/* Corporate Selection */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Corporate Client</Label>
                  <Select 
                    value={formData.corporateId || ''} 
                    onValueChange={(v) => handleFormChange('corporateId', v)}
                  >
                    <SelectTrigger className="bg-[#0F172A] border-gray-600 text-white">
                      <SelectValue placeholder="Select corporate client" />
                    </SelectTrigger>
                    <SelectContent>
                      {corporates.map((corp) => (
                        <SelectItem key={corp.id} value={corp.id}>
                          {corp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Company Details */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Company Name</Label>
                    <Input
                      value={formData.companyName || ''}
                      onChange={(e) => handleFormChange('companyName', e.target.value)}
                      placeholder="Company Name"
                      className="bg-[#0F172A] border-gray-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Tagline</Label>
                    <Input
                      value={formData.tagline || ''}
                      onChange={(e) => handleFormChange('tagline', e.target.value)}
                      placeholder="Your tagline"
                      className="bg-[#0F172A] border-gray-600 text-white"
                    />
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                {/* Color Presets */}
                <div className="space-y-3">
                  <Label className="text-gray-300">Color Presets</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.name}
                        className="p-2 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors"
                        onClick={() => applyColorPreset(preset)}
                      >
                        <div className="flex gap-1 mb-1">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.primary }} />
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.secondary }} />
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.accent }} />
                        </div>
                        <p className="text-xs text-gray-400">{preset.name}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Colors */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.primaryColor || '#00897B'}
                        onChange={(e) => handleFormChange('primaryColor', e.target.value)}
                        className="w-12 h-10 p-1 bg-[#0F172A] border-gray-600"
                      />
                      <Input
                        value={formData.primaryColor || '#00897B'}
                        onChange={(e) => handleFormChange('primaryColor', e.target.value)}
                        className="flex-1 bg-[#0F172A] border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.secondaryColor || '#00695C'}
                        onChange={(e) => handleFormChange('secondaryColor', e.target.value)}
                        className="w-12 h-10 p-1 bg-[#0F172A] border-gray-600"
                      />
                      <Input
                        value={formData.secondaryColor || '#00695C'}
                        onChange={(e) => handleFormChange('secondaryColor', e.target.value)}
                        className="flex-1 bg-[#0F172A] border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Accent Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.accentColor || '#4CAF50'}
                        onChange={(e) => handleFormChange('accentColor', e.target.value)}
                        className="w-12 h-10 p-1 bg-[#0F172A] border-gray-600"
                      />
                      <Input
                        value={formData.accentColor || '#4CAF50'}
                        onChange={(e) => handleFormChange('accentColor', e.target.value)}
                        className="flex-1 bg-[#0F172A] border-gray-600 text-white"
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                {/* Logos */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Logo (Light)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.logoUrl || ''}
                        onChange={(e) => handleFormChange('logoUrl', e.target.value)}
                        placeholder="Logo URL"
                        className="flex-1 bg-[#0F172A] border-gray-600 text-white"
                      />
                      <Button size="icon" variant="outline" className="border-gray-600">
                        <Upload className="h-4 w-4 text-gray-400" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Logo (Dark)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.logoDarkUrl || ''}
                        onChange={(e) => handleFormChange('logoDarkUrl', e.target.value)}
                        placeholder="Dark logo URL"
                        className="flex-1 bg-[#0F172A] border-gray-600 text-white"
                      />
                      <Button size="icon" variant="outline" className="border-gray-600">
                        <Upload className="h-4 w-4 text-gray-400" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Favicon</Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.faviconUrl || ''}
                        onChange={(e) => handleFormChange('faviconUrl', e.target.value)}
                        placeholder="Favicon URL"
                        className="flex-1 bg-[#0F172A] border-gray-600 text-white"
                      />
                      <Button size="icon" variant="outline" className="border-gray-600">
                        <Upload className="h-4 w-4 text-gray-400" />
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Domain Tab */}
              <TabsContent value="domain" className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-gray-300">Custom Domain</Label>
                  <Input
                    value={formData.customDomain || ''}
                    onChange={(e) => handleFormChange('customDomain', e.target.value)}
                    placeholder="app.yourcompany.com"
                    className="bg-[#0F172A] border-gray-600 text-white"
                  />
                  <p className="text-xs text-gray-500">
                    Configure your DNS CNAME record to point to groways.co
                  </p>
                </div>

                <div className="bg-[#0F172A] p-4 rounded-lg border border-gray-700">
                  <h4 className="text-white font-medium mb-3">DNS Configuration</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span className="text-white">CNAME</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Name:</span>
                      <span className="text-white">app</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Value:</span>
                      <span className="text-white">groways.co</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">TTL:</span>
                      <span className="text-white">3600</span>
                    </div>
                  </div>
                  <Button className="w-full mt-4 bg-[#00897B] hover:bg-[#00695C] text-white">
                    <Check className="h-4 w-4 mr-2" />
                    Verify Domain
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Privacy Policy URL</Label>
                    <Input
                      value={formData.privacyPolicyUrl || ''}
                      onChange={(e) => handleFormChange('privacyPolicyUrl', e.target.value)}
                      placeholder="https://..."
                      className="bg-[#0F172A] border-gray-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Terms of Service URL</Label>
                    <Input
                      value={formData.termsUrl || ''}
                      onChange={(e) => handleFormChange('termsUrl', e.target.value)}
                      placeholder="https://..."
                      className="bg-[#0F172A] border-gray-600 text-white"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Templates Tab */}
              <TabsContent value="templates" className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-gray-300">Email Header HTML</Label>
                  <Textarea
                    value={formData.emailHeaderHtml || ''}
                    onChange={(e) => handleFormChange('emailHeaderHtml', e.target.value)}
                    placeholder="<div>Custom header HTML...</div>"
                    className="bg-[#0F172A] border-gray-600 text-white min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Email Footer HTML</Label>
                  <Textarea
                    value={formData.emailFooterHtml || ''}
                    onChange={(e) => handleFormChange('emailFooterHtml', e.target.value)}
                    placeholder="<div>Custom footer HTML...</div>"
                    className="bg-[#0F172A] border-gray-600 text-white min-h-[100px]"
                  />
                </div>

                <Separator className="bg-gray-700" />

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Invoice Header</Label>
                    <Textarea
                      value={formData.invoiceHeaderHtml || ''}
                      onChange={(e) => handleFormChange('invoiceHeaderHtml', e.target.value)}
                      placeholder="Invoice header HTML..."
                      className="bg-[#0F172A] border-gray-600 text-white min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Invoice Footer</Label>
                    <Textarea
                      value={formData.invoiceFooterHtml || ''}
                      onChange={(e) => handleFormChange('invoiceFooterHtml', e.target.value)}
                      placeholder="Invoice footer HTML..."
                      className="bg-[#0F172A] border-gray-600 text-white min-h-[80px]"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Receipt Header</Label>
                    <Textarea
                      value={formData.receiptHeaderHtml || ''}
                      onChange={(e) => handleFormChange('receiptHeaderHtml', e.target.value)}
                      placeholder="Receipt header HTML..."
                      className="bg-[#0F172A] border-gray-600 text-white min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Receipt Footer</Label>
                    <Textarea
                      value={formData.receiptFooterHtml || ''}
                      onChange={(e) => handleFormChange('receiptFooterHtml', e.target.value)}
                      placeholder="Receipt footer HTML..."
                      className="bg-[#0F172A] border-gray-600 text-white min-h-[80px]"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-gray-300">Custom CSS</Label>
                  <Textarea
                    value={formData.customCss || ''}
                    onChange={(e) => handleFormChange('customCss', e.target.value)}
                    placeholder="/* Custom CSS styles */"
                    className="bg-[#0F172A] border-gray-600 text-white font-mono min-h-[150px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Custom Scripts</Label>
                  <Textarea
                    value={formData.customScripts || ''}
                    onChange={(e) => handleFormChange('customScripts', e.target.value)}
                    placeholder="<script>...</script>"
                    className="bg-[#0F172A] border-gray-600 text-white font-mono min-h-[100px]"
                  />
                  <p className="text-xs text-gray-500">
                    Add analytics, tracking scripts, or other custom JavaScript
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Login Background Image</Label>
                  <Input
                    value={formData.loginBackgroundUrl || ''}
                    onChange={(e) => handleFormChange('loginBackgroundUrl', e.target.value)}
                    placeholder="Background image URL"
                    className="bg-[#0F172A] border-gray-600 text-white"
                  />
                </div>
              </TabsContent>

              {/* Preview Tab */}
              <TabsContent value="preview" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={previewDevice === 'desktop' ? 'default' : 'outline'}
                      size="sm"
                      className={previewDevice === 'desktop' ? 'bg-[#00897B] hover:bg-[#00695C]' : 'border-gray-600'}
                      onClick={() => setPreviewDevice('desktop')}
                    >
                      <Monitor className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={previewDevice === 'tablet' ? 'default' : 'outline'}
                      size="sm"
                      className={previewDevice === 'tablet' ? 'bg-[#00897B] hover:bg-[#00695C]' : 'border-gray-600'}
                      onClick={() => setPreviewDevice('tablet')}
                    >
                      <Tablet className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={previewDevice === 'mobile' ? 'default' : 'outline'}
                      size="sm"
                      className={previewDevice === 'mobile' ? 'bg-[#00897B] hover:bg-[#00695C]' : 'border-gray-600'}
                      onClick={() => setPreviewDevice('mobile')}
                    >
                      <Smartphone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Preview Frame */}
                <div 
                  className={`mx-auto border-4 border-gray-700 rounded-lg overflow-hidden bg-white transition-all duration-300 ${
                    previewDevice === 'desktop' ? 'w-full' :
                    previewDevice === 'tablet' ? 'w-[768px]' :
                    'w-[375px]'
                  }`}
                >
                  <div 
                    className="h-16 flex items-center px-4"
                    style={{ backgroundColor: formData.primaryColor || '#00897B' }}
                  >
                    <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                      <span className="text-white font-bold">
                        {formData.companyName?.charAt(0) || 'G'}
                      </span>
                    </div>
                    <span className="ml-3 text-white font-medium">
                      {formData.companyName || 'Company Name'}
                    </span>
                  </div>
                  <div className="p-6 bg-gray-50 min-h-[300px]">
                    <div className="bg-white rounded-lg shadow p-4 mb-4">
                      <h3 
                        className="text-lg font-semibold mb-2"
                        style={{ color: formData.primaryColor || '#00897B' }}
                      >
                        Welcome to {formData.companyName || 'Your Platform'}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">{formData.tagline || 'Your tagline here'}</p>
                      <button
                        className="px-4 py-2 rounded-lg text-white"
                        style={{ backgroundColor: formData.primaryColor || '#00897B' }}
                      >
                        Primary Button
                      </button>
                      <button
                        className="px-4 py-2 rounded-lg text-white ml-2"
                        style={{ backgroundColor: formData.secondaryColor || '#00695C' }}
                      >
                        Secondary Button
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg shadow p-4">
                        <div 
                          className="w-full h-2 rounded mb-2"
                          style={{ backgroundColor: formData.accentColor || '#4CAF50' }}
                        />
                        <p className="text-gray-600 text-sm">Card Content</p>
                      </div>
                      <div className="bg-white rounded-lg shadow p-4">
                        <div 
                          className="w-full h-2 rounded mb-2"
                          style={{ backgroundColor: formData.accentColor || '#4CAF50' }}
                        />
                        <p className="text-gray-600 text-sm">Card Content</p>
                      </div>
                    </div>
                  </div>
                  <div 
                    className="h-12 flex items-center justify-center"
                    style={{ backgroundColor: formData.secondaryColor || '#00695C' }}
                  >
                    <p className="text-white/80 text-xs">
                      {formData.footerText || '© 2026 Company. All rights reserved.'}
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
