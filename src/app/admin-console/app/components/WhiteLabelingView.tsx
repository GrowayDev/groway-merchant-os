'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  Palette,
  Globe,
  Mail,
  Image as ImageIcon,
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
  Building2,
  Phone,
  FileText,
  Paintbrush,
  Type,
  Layout,
  ExternalLink,
  Loader2,
  Download,
  FileUp,
  RotateCcw,
  Link2,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Trash2,
  Plus,
  Copy,
  CheckCircle2
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

interface SocialLink {
  platform: string
  url: string
}

interface CustomFont {
  name: string
  url: string
  type: 'heading' | 'body' | 'both'
}

const colorPresets = [
  { name: 'Groway Teal', primary: '#00897B', secondary: '#00695C', accent: '#4CAF50' },
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

const socialPlatforms = [
  { id: 'twitter', name: 'Twitter', icon: Twitter },
  { id: 'facebook', name: 'Facebook', icon: Facebook },
  { id: 'instagram', name: 'Instagram', icon: Instagram },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin },
  { id: 'youtube', name: 'YouTube', icon: Youtube },
  { id: 'website', name: 'Website', icon: Globe }
]

const defaultConfig: Partial<WhiteLabelConfig> = {
  primaryColor: '#00897B',
  secondaryColor: '#00695C',
  accentColor: '#4CAF50',
  active: true
}

export default function WhiteLabelingView() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [configs, setConfigs] = useState<WhiteLabelConfig[]>([])
  const [selectedConfig, setSelectedConfig] = useState<WhiteLabelConfig | null>(null)
  const [corporates, setCorporates] = useState<Corporate[]>([])
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Form state
  const [formData, setFormData] = useState<Partial<WhiteLabelConfig>>(defaultConfig)

  // Social links state
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])

  // Custom fonts state
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([])

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

  // Fetch corporates
  const fetchCorporates = useCallback(async () => {
    try {
      const response = await fetch('/api/enterprise/clients')
      if (response.ok) {
        const data = await response.json()
        setCorporates(data.clients || [])
      }
    } catch (error) {
      // Use mock data if API fails
      setCorporates([
        { id: 'corp-001', name: 'Acme Corporation', domain: 'acme.groway.co.za' },
        { id: 'corp-002', name: 'TechVentures Ltd', domain: 'techventures.groway.co.za' },
        { id: 'corp-003', name: 'Global Retail SA', domain: 'globalretail.groway.co.za' },
        { id: 'corp-004', name: 'Innovate Systems', domain: 'innovate.groway.co.za' },
        { id: 'corp-005', name: 'Premier Foods', domain: 'premier.groway.co.za' }
      ])
    }
  }, [])

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchConfigs(), fetchCorporates()])
      setLoading(false)
    }
    loadData()
  }, [fetchConfigs, fetchCorporates])

  // Handle form change
  const handleFormChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(true)
  }

  // Apply color preset
  const applyColorPreset = (preset: typeof colorPresets[0]) => {
    setFormData(prev => ({
      ...prev,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent
    }))
    setHasUnsavedChanges(true)
  }

  // Save configuration
  const saveConfig = async () => {
    if (!formData.corporateId) {
      toast.error('Please select a corporate client')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...formData,
        socialLinks: socialLinks.length > 0 ? JSON.stringify(socialLinks) : null,
        customFonts: customFonts.length > 0 ? JSON.stringify(customFonts) : null
      }

      const method = selectedConfig ? 'PUT' : 'POST'
      const response = await fetch('/api/whitelabel', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        toast.success('White-label configuration saved successfully')
        setHasUnsavedChanges(false)
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
      ...config
    })
    
    // Parse social links
    if (config.socialLinks) {
      try {
        setSocialLinks(JSON.parse(config.socialLinks))
      } catch {
        setSocialLinks([])
      }
    } else {
      setSocialLinks([])
    }

    // Parse custom fonts
    if (config.customFonts) {
      try {
        setCustomFonts(JSON.parse(config.customFonts))
      } catch {
        setCustomFonts([])
      }
    } else {
      setCustomFonts([])
    }

    setHasUnsavedChanges(false)
  }

  // Reset form
  const resetForm = () => {
    setSelectedConfig(null)
    setFormData(defaultConfig)
    setSocialLinks([])
    setCustomFonts([])
    setHasUnsavedChanges(false)
  }

  // Reset to default colors
  const resetToDefault = () => {
    setFormData(prev => ({
      ...prev,
      primaryColor: '#00897B',
      secondaryColor: '#00695C',
      accentColor: '#4CAF50'
    }))
    setHasUnsavedChanges(true)
    toast.info('Colors reset to default')
  }

  // Export configuration
  const exportConfig = () => {
    const exportData = {
      ...formData,
      socialLinks,
      customFonts,
      exportedAt: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `whitelabel-config-${formData.corporateId || 'new'}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Configuration exported')
  }

  // Import configuration
  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        setFormData(prev => ({ ...prev, ...imported }))
        if (imported.socialLinks) {
          setSocialLinks(imported.socialLinks)
        }
        if (imported.customFonts) {
          setCustomFonts(imported.customFonts)
        }
        setHasUnsavedChanges(true)
        toast.success('Configuration imported')
      } catch {
        toast.error('Invalid configuration file')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  // Add social link
  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { platform: 'twitter', url: '' }])
    setHasUnsavedChanges(true)
  }

  // Update social link
  const updateSocialLink = (index: number, field: 'platform' | 'url', value: string) => {
    const updated = [...socialLinks]
    updated[index] = { ...updated[index], [field]: value }
    setSocialLinks(updated)
    setHasUnsavedChanges(true)
  }

  // Remove social link
  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index))
    setHasUnsavedChanges(true)
  }

  // Add custom font
  const addCustomFont = () => {
    setCustomFonts([...customFonts, { name: '', url: '', type: 'body' }])
    setHasUnsavedChanges(true)
  }

  // Update custom font
  const updateCustomFont = (index: number, field: keyof CustomFont, value: string) => {
    const updated = [...customFonts]
    updated[index] = { ...updated[index], [field]: value }
    setCustomFonts(updated)
    setHasUnsavedChanges(true)
  }

  // Remove custom font
  const removeCustomFont = (index: number) => {
    setCustomFonts(customFonts.filter((_, i) => i !== index))
    setHasUnsavedChanges(true)
  }

  // Copy color to clipboard
  const copyColor = (color: string) => {
    navigator.clipboard.writeText(color)
    toast.success('Color copied to clipboard')
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
        <div className="flex items-center gap-2 flex-wrap">
          {hasUnsavedChanges && (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50">
              Unsaved Changes
            </Badge>
          )}
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
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
            onClick={resetToDefault}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Default
          </Button>
          <Button 
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
            onClick={exportConfig}
            disabled={!formData.corporateId}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".json"
              onChange={importConfig}
              className="hidden"
            />
            <Button 
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
              asChild
            >
              <span>
                <FileUp className="h-4 w-4 mr-2" />
                Import
              </span>
            </Button>
          </label>
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

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Configuration List */}
        <Card className="bg-[#1E293B] border-gray-700 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base">Configurations</CardTitle>
            <CardDescription className="text-gray-400 text-xs">
              {configs.length} configurations
            </CardDescription>
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
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {config.companyName || 'Unnamed'}
                        </p>
                        <p className="text-gray-400 text-xs truncate">
                          {config.customDomain || config.corporateId}
                        </p>
                      </div>
                      {config.active ? (
                        <Badge className="bg-green-500/20 text-green-400 border-0 text-[10px]">Active</Badge>
                      ) : (
                        <Badge className="bg-gray-500/20 text-gray-400 border-0 text-[10px]">Inactive</Badge>
                      )}
                    </div>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  className="w-full mt-4 border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-gray-500"
                  onClick={resetForm}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Configuration
                </Button>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Configuration Form */}
        <Card className="bg-[#1E293B] border-gray-700 lg:col-span-3">
          <CardContent className="p-4">
            <Tabs defaultValue="branding" className="w-full">
              <ScrollArea className="w-full">
                <TabsList className="bg-[#0F172A] border border-gray-700 grid grid-cols-7 w-max min-w-full mb-4">
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
                  <TabsTrigger value="fonts" className="data-[state=active]:bg-[#00897B]">
                    <Type className="h-4 w-4 mr-1" />
                    Fonts
                  </TabsTrigger>
                  <TabsTrigger value="social" className="data-[state=active]:bg-[#00897B]">
                    <Link2 className="h-4 w-4 mr-1" />
                    Social
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
              </ScrollArea>

              {/* Branding Tab */}
              <TabsContent value="branding" className="space-y-6 mt-0">
                {/* Corporate Selection */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Corporate Client *</Label>
                  <Select 
                    value={formData.corporateId || ''} 
                    onValueChange={(v) => handleFormChange('corporateId', v)}
                    disabled={!!selectedConfig}
                  >
                    <SelectTrigger className="bg-[#0F172A] border-gray-600 text-white">
                      <SelectValue placeholder="Select corporate client" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1E293B] border-gray-700">
                      {corporates.map((corp) => (
                        <SelectItem key={corp.id} value={corp.id} className="text-white hover:bg-gray-700">
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

                <div className="space-y-2">
                  <Label className="text-gray-300">Footer Text</Label>
                  <Input
                    value={formData.footerText || ''}
                    onChange={(e) => handleFormChange('footerText', e.target.value)}
                    placeholder="© 2026 Company. All rights reserved."
                    className="bg-[#0F172A] border-gray-600 text-white"
                  />
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
                      <div className="relative">
                        <Input
                          type="color"
                          value={formData.primaryColor || '#00897B'}
                          onChange={(e) => handleFormChange('primaryColor', e.target.value)}
                          className="w-12 h-10 p-1 bg-[#0F172A] border-gray-600 cursor-pointer"
                        />
                        <button 
                          className="absolute inset-0 opacity-0"
                          onClick={() => copyColor(formData.primaryColor || '#00897B')}
                        />
                      </div>
                      <Input
                        value={formData.primaryColor || '#00897B'}
                        onChange={(e) => handleFormChange('primaryColor', e.target.value)}
                        className="flex-1 bg-[#0F172A] border-gray-600 text-white font-mono text-sm"
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
                        className="w-12 h-10 p-1 bg-[#0F172A] border-gray-600 cursor-pointer"
                      />
                      <Input
                        value={formData.secondaryColor || '#00695C'}
                        onChange={(e) => handleFormChange('secondaryColor', e.target.value)}
                        className="flex-1 bg-[#0F172A] border-gray-600 text-white font-mono text-sm"
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
                        className="w-12 h-10 p-1 bg-[#0F172A] border-gray-600 cursor-pointer"
                      />
                      <Input
                        value={formData.accentColor || '#4CAF50'}
                        onChange={(e) => handleFormChange('accentColor', e.target.value)}
                        className="flex-1 bg-[#0F172A] border-gray-600 text-white font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                {/* Logos */}
                <div className="space-y-4">
                  <Label className="text-gray-300">Logos & Images</Label>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-400 text-xs">Logo (Light Mode)</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formData.logoUrl || ''}
                          onChange={(e) => handleFormChange('logoUrl', e.target.value)}
                          placeholder="Logo URL"
                          className="flex-1 bg-[#0F172A] border-gray-600 text-white"
                        />
                        <Button size="icon" variant="outline" className="border-gray-600 shrink-0">
                          <Upload className="h-4 w-4 text-gray-400" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-400 text-xs">Logo (Dark Mode)</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formData.logoDarkUrl || ''}
                          onChange={(e) => handleFormChange('logoDarkUrl', e.target.value)}
                          placeholder="Dark logo URL"
                          className="flex-1 bg-[#0F172A] border-gray-600 text-white"
                        />
                        <Button size="icon" variant="outline" className="border-gray-600 shrink-0">
                          <Upload className="h-4 w-4 text-gray-400" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-400 text-xs">Favicon</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formData.faviconUrl || ''}
                          onChange={(e) => handleFormChange('faviconUrl', e.target.value)}
                          placeholder="Favicon URL"
                          className="flex-1 bg-[#0F172A] border-gray-600 text-white"
                        />
                        <Button size="icon" variant="outline" className="border-gray-600 shrink-0">
                          <Upload className="h-4 w-4 text-gray-400" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                {/* Contact Information */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Support Email
                    </Label>
                    <Input
                      type="email"
                      value={formData.supportEmail || ''}
                      onChange={(e) => handleFormChange('supportEmail', e.target.value)}
                      placeholder="support@company.com"
                      className="bg-[#0F172A] border-gray-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Support Phone
                    </Label>
                    <Input
                      value={formData.supportPhone || ''}
                      onChange={(e) => handleFormChange('supportPhone', e.target.value)}
                      placeholder="+27 11 123 4567"
                      className="bg-[#0F172A] border-gray-600 text-white"
                    />
                  </div>
                </div>

                {/* Active Status */}
                <div className="flex items-center justify-between p-4 bg-[#0F172A] rounded-lg border border-gray-700">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                    <div>
                      <p className="text-sm text-white">Active Configuration</p>
                      <p className="text-xs text-gray-400">Enable this white-label configuration</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.active || false}
                    onCheckedChange={(checked) => handleFormChange('active', checked)}
                  />
                </div>
              </TabsContent>

              {/* Domain Tab */}
              <TabsContent value="domain" className="space-y-6 mt-0">
                <div className="space-y-2">
                  <Label className="text-gray-300">Custom Domain</Label>
                  <Input
                    value={formData.customDomain || ''}
                    onChange={(e) => handleFormChange('customDomain', e.target.value)}
                    placeholder="app.yourcompany.com"
                    className="bg-[#0F172A] border-gray-600 text-white"
                  />
                  <p className="text-xs text-gray-500">
                    Configure your DNS CNAME record to point to groway.co.za
                  </p>
                </div>

                <div className="bg-[#0F172A] p-4 rounded-lg border border-gray-700">
                  <h4 className="text-white font-medium mb-3">DNS Configuration</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <code className="text-white bg-gray-800 px-2 py-0.5 rounded">CNAME</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Name:</span>
                      <code className="text-white bg-gray-800 px-2 py-0.5 rounded">app</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Value:</span>
                      <code className="text-white bg-gray-800 px-2 py-0.5 rounded">groway.co.za</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">TTL:</span>
                      <code className="text-white bg-gray-800 px-2 py-0.5 rounded">3600</code>
                    </div>
                  </div>
                  <Button className="w-full mt-4 bg-[#00897B] hover:bg-[#00695C] text-white">
                    <Check className="h-4 w-4 mr-2" />
                    Verify Domain
                  </Button>
                </div>

                <Separator className="bg-gray-700" />

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Privacy Policy URL
                    </Label>
                    <Input
                      value={formData.privacyPolicyUrl || ''}
                      onChange={(e) => handleFormChange('privacyPolicyUrl', e.target.value)}
                      placeholder="https://company.com/privacy"
                      className="bg-[#0F172A] border-gray-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Terms of Service URL
                    </Label>
                    <Input
                      value={formData.termsUrl || ''}
                      onChange={(e) => handleFormChange('termsUrl', e.target.value)}
                      placeholder="https://company.com/terms"
                      className="bg-[#0F172A] border-gray-600 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Login Background Image
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.loginBackgroundUrl || ''}
                      onChange={(e) => handleFormChange('loginBackgroundUrl', e.target.value)}
                      placeholder="Background image URL"
                      className="flex-1 bg-[#0F172A] border-gray-600 text-white"
                    />
                    <Button size="icon" variant="outline" className="border-gray-600 shrink-0">
                      <Upload className="h-4 w-4 text-gray-400" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Templates Tab */}
              <TabsContent value="templates" className="space-y-6 mt-0">
                <div className="space-y-4">
                  <h4 className="text-white font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#00897B]" />
                    Email Templates
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-400 text-xs">Email Header HTML</Label>
                      <Textarea
                        value={formData.emailHeaderHtml || ''}
                        onChange={(e) => handleFormChange('emailHeaderHtml', e.target.value)}
                        placeholder="<div>Custom header HTML...</div>"
                        className="bg-[#0F172A] border-gray-600 text-white min-h-[120px] font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-400 text-xs">Email Footer HTML</Label>
                      <Textarea
                        value={formData.emailFooterHtml || ''}
                        onChange={(e) => handleFormChange('emailFooterHtml', e.target.value)}
                        placeholder="<div>Custom footer HTML...</div>"
                        className="bg-[#0F172A] border-gray-600 text-white min-h-[120px] font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                <div className="space-y-4">
                  <h4 className="text-white font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#00897B]" />
                    Invoice Templates
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-400 text-xs">Invoice Header</Label>
                      <Textarea
                        value={formData.invoiceHeaderHtml || ''}
                        onChange={(e) => handleFormChange('invoiceHeaderHtml', e.target.value)}
                        placeholder="Invoice header HTML..."
                        className="bg-[#0F172A] border-gray-600 text-white min-h-[100px] font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-400 text-xs">Invoice Footer</Label>
                      <Textarea
                        value={formData.invoiceFooterHtml || ''}
                        onChange={(e) => handleFormChange('invoiceFooterHtml', e.target.value)}
                        placeholder="Invoice footer HTML..."
                        className="bg-[#0F172A] border-gray-600 text-white min-h-[100px] font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                <div className="space-y-4">
                  <h4 className="text-white font-medium flex items-center gap-2">
                    <Layout className="h-4 w-4 text-[#00897B]" />
                    Receipt Templates
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-400 text-xs">Receipt Header</Label>
                      <Textarea
                        value={formData.receiptHeaderHtml || ''}
                        onChange={(e) => handleFormChange('receiptHeaderHtml', e.target.value)}
                        placeholder="Receipt header HTML..."
                        className="bg-[#0F172A] border-gray-600 text-white min-h-[100px] font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-400 text-xs">Receipt Footer</Label>
                      <Textarea
                        value={formData.receiptFooterHtml || ''}
                        onChange={(e) => handleFormChange('receiptFooterHtml', e.target.value)}
                        placeholder="Receipt footer HTML..."
                        className="bg-[#0F172A] border-gray-600 text-white min-h-[100px] font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Fonts Tab */}
              <TabsContent value="fonts" className="space-y-6 mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-medium">Custom Fonts</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-300"
                      onClick={addCustomFont}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Font
                    </Button>
                  </div>

                  {customFonts.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Type className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No custom fonts configured</p>
                      <p className="text-xs">Add custom fonts to override the defaults</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customFonts.map((font, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-[#0F172A] rounded-lg border border-gray-700">
                          <div className="flex-1 grid grid-cols-3 gap-3">
                            <Input
                              value={font.name}
                              onChange={(e) => updateCustomFont(index, 'name', e.target.value)}
                              placeholder="Font Name"
                              className="bg-[#1E293B] border-gray-600 text-white"
                            />
                            <Input
                              value={font.url}
                              onChange={(e) => updateCustomFont(index, 'url', e.target.value)}
                              placeholder="Font URL"
                              className="bg-[#1E293B] border-gray-600 text-white"
                            />
                            <Select
                              value={font.type}
                              onValueChange={(v) => updateCustomFont(index, 'type', v)}
                            >
                              <SelectTrigger className="bg-[#1E293B] border-gray-600 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[#1E293B] border-gray-700">
                                <SelectItem value="heading">Heading</SelectItem>
                                <SelectItem value="body">Body</SelectItem>
                                <SelectItem value="both">Both</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                            onClick={() => removeCustomFont(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator className="bg-gray-700" />

                <div className="space-y-4">
                  <h4 className="text-white font-medium">Default Font Options</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-400 text-xs">Heading Font</Label>
                      <Select defaultValue="Inter">
                        <SelectTrigger className="bg-[#0F172A] border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1E293B] border-gray-700">
                          {fontOptions.map((font) => (
                            <SelectItem key={font.name} value={font.name}>
                              {font.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-400 text-xs">Body Font</Label>
                      <Select defaultValue="Inter">
                        <SelectTrigger className="bg-[#0F172A] border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1E293B] border-gray-700">
                          {fontOptions.map((font) => (
                            <SelectItem key={font.name} value={font.name}>
                              {font.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Social Tab */}
              <TabsContent value="social" className="space-y-6 mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-medium">Social Links</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-300"
                      onClick={addSocialLink}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Link
                    </Button>
                  </div>

                  {socialLinks.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No social links configured</p>
                      <p className="text-xs">Add links to your social media profiles</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {socialLinks.map((link, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-[#0F172A] rounded-lg border border-gray-700">
                          <Select
                            value={link.platform}
                            onValueChange={(v) => updateSocialLink(index, 'platform', v)}
                          >
                            <SelectTrigger className="w-32 bg-[#1E293B] border-gray-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1E293B] border-gray-700">
                              {socialPlatforms.map((platform) => {
                                const Icon = platform.icon
                                return (
                                  <SelectItem key={platform.id} value={platform.id}>
                                    <div className="flex items-center gap-2">
                                      <Icon className="h-4 w-4" />
                                      {platform.name}
                                    </div>
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                          <Input
                            value={link.url}
                            onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                            placeholder="https://..."
                            className="flex-1 bg-[#1E293B] border-gray-600 text-white"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                            onClick={() => removeSocialLink(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="space-y-6 mt-0">
                <div className="space-y-4">
                  <h4 className="text-white font-medium">Custom CSS</h4>
                  <Textarea
                    value={formData.customCss || ''}
                    onChange={(e) => handleFormChange('customCss', e.target.value)}
                    placeholder={`/* Custom CSS styles */
.my-custom-class {
  color: var(--primary);
}

.header {
  background: var(--secondary);
}`}
                    className="bg-[#0F172A] border-gray-600 text-white font-mono text-sm min-h-[200px]"
                  />
                  <p className="text-xs text-gray-500">
                    Inject custom CSS styles to override default styling. Use with caution.
                  </p>
                </div>

                <Separator className="bg-gray-700" />

                <div className="space-y-4">
                  <h4 className="text-white font-medium">Custom Scripts</h4>
                  <Textarea
                    value={formData.customScripts || ''}
                    onChange={(e) => handleFormChange('customScripts', e.target.value)}
                    placeholder={`<!-- Google Analytics -->
<script>
  // Your tracking code here
</script>`}
                    className="bg-[#0F172A] border-gray-600 text-white font-mono text-sm min-h-[150px]"
                  />
                  <p className="text-xs text-gray-500">
                    Add analytics, tracking scripts, or other custom JavaScript. These will be injected into the page head.
                  </p>
                </div>
              </TabsContent>

              {/* Preview Tab */}
              <TabsContent value="preview" className="space-y-6 mt-0">
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
                  <div className="flex items-center gap-2">
                    <Button
                      variant={previewMode === 'light' ? 'default' : 'outline'}
                      size="sm"
                      className={previewMode === 'light' ? 'bg-[#00897B] hover:bg-[#00695C]' : 'border-gray-600'}
                      onClick={() => setPreviewMode('light')}
                    >
                      Light
                    </Button>
                    <Button
                      variant={previewMode === 'dark' ? 'default' : 'outline'}
                      size="sm"
                      className={previewMode === 'dark' ? 'bg-[#00897B] hover:bg-[#00695C]' : 'border-gray-600'}
                      onClick={() => setPreviewMode('dark')}
                    >
                      Dark
                    </Button>
                  </div>
                </div>

                {/* Preview Frame */}
                <div 
                  className={`mx-auto border-4 border-gray-700 rounded-lg overflow-hidden transition-all duration-300 ${
                    previewDevice === 'desktop' ? 'w-full' :
                    previewDevice === 'tablet' ? 'w-[768px]' :
                    'w-[375px]'
                  }`}
                >
                  <div 
                    className="h-16 flex items-center px-4"
                    style={{ backgroundColor: formData.primaryColor || '#00897B' }}
                  >
                    {formData.logoUrl ? (
                      <img src={formData.logoUrl} alt="Logo" className="h-8" />
                    ) : (
                      <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                        <span className="text-white font-bold">
                          {formData.companyName?.charAt(0) || 'G'}
                        </span>
                      </div>
                    )}
                    <span className="ml-3 text-white font-medium">
                      {formData.companyName || 'Company Name'}
                    </span>
                  </div>
                  <div 
                    className={`p-6 min-h-[400px] ${previewMode === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}
                    style={formData.customCss ? { cssText: formData.customCss } as React.CSSProperties : {}}
                  >
                    <div className={`rounded-lg shadow p-4 mb-4 ${previewMode === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                      <h3 
                        className="text-lg font-semibold mb-2"
                        style={{ color: formData.primaryColor || '#00897B' }}
                      >
                        Welcome to {formData.companyName || 'Your Platform'}
                      </h3>
                      <p className={`text-sm mb-4 ${previewMode === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        {formData.tagline || 'Your tagline here'}
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          className="px-4 py-2 rounded-lg text-white"
                          style={{ backgroundColor: formData.primaryColor || '#00897B' }}
                        >
                          Primary Button
                        </button>
                        <button
                          className="px-4 py-2 rounded-lg text-white"
                          style={{ backgroundColor: formData.secondaryColor || '#00695C' }}
                        >
                          Secondary Button
                        </button>
                        <button
                          className="px-4 py-2 rounded-lg text-white"
                          style={{ backgroundColor: formData.accentColor || '#4CAF50' }}
                        >
                          Accent Button
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div 
                          key={i}
                          className={`rounded-lg shadow p-4 ${previewMode === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
                        >
                          <div 
                            className="w-full h-2 rounded mb-2"
                            style={{ backgroundColor: formData.accentColor || '#4CAF50' }}
                          />
                          <p className={`text-sm ${previewMode === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            Card {i}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div 
                    className="h-12 flex items-center justify-center px-4"
                    style={{ backgroundColor: formData.secondaryColor || '#00695C' }}
                  >
                    <p className="text-white/80 text-xs">
                      {formData.footerText || `© ${new Date().getFullYear()} ${formData.companyName || 'Company'}. All rights reserved.`}
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
