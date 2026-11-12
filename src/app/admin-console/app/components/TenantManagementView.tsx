'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Building2,
  Users,
  CreditCard,
  Settings,
  Search,
  Plus,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  Key,
  Crown,
} from 'lucide-react'

interface Tenant {
  id: string
  name: string
  slug: string
  domain?: string
  plan: string
  status: string
  maxUsers: number
  maxMerchants: number
  features: string[]
  userCount: number
  createdAt: string
  subscription?: {
    status: string
    currentPeriodEnd: string
    amount: number
  }
}

interface TenantStats {
  total: number
  active: number
  trial: number
  suspended: number
  byPlan: Record<string, number>
}

const PLAN_FEATURES: Record<string, { name: string; users: number; merchants: number; price: number; features: string[] }> = {
  starter: {
    name: 'Starter',
    users: 10,
    merchants: 1,
    price: 299,
    features: ['pos', 'inventory', 'basic_reports'],
  },
  professional: {
    name: 'Professional',
    users: 50,
    merchants: 5,
    price: 999,
    features: ['pos', 'inventory', 'accounting', 'advanced_reports', 'integrations', 'multi_location'],
  },
  enterprise: {
    name: 'Enterprise',
    users: 500,
    merchants: 50,
    price: 2999,
    features: ['pos', 'inventory', 'accounting', 'advanced_reports', 'integrations', 'multi_location', 'api_access', 'white_label', 'priority_support'],
  },
}

export default function TenantManagementView() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [stats, setStats] = useState<TenantStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    domain: '',
    plan: 'starter',
    status: 'active',
  })

  useEffect(() => {
    fetchTenants()
    fetchStats()
  }, [])

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/platform/tenants')
      if (response.ok) {
        const data = await response.json()
        setTenants(data.tenants || [])
      }
    } catch (error) {
      console.error('Failed to fetch tenants:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/platform/tenants?stats=true')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleCreateTenant = async () => {
    try {
      const response = await fetch('/api/platform/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        fetchTenants()
        fetchStats()
        setShowCreateDialog(false)
        setFormData({ name: '', slug: '', domain: '', plan: 'starter', status: 'active' })
      }
    } catch (error) {
      console.error('Failed to create tenant:', error)
    }
  }

  const handleUpdateTenant = async () => {
    if (!selectedTenant) return

    try {
      const response = await fetch(`/api/platform/tenants/${selectedTenant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        fetchTenants()
        setShowEditDialog(false)
        setSelectedTenant(null)
      }
    } catch (error) {
      console.error('Failed to update tenant:', error)
    }
  }

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.slug.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter
    const matchesPlan = planFilter === 'all' || tenant.plan === planFilter
    return matchesSearch && matchesStatus && matchesPlan
  })

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      active: { variant: 'default', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
      trial: { variant: 'secondary', icon: <Clock className="h-3 w-3 mr-1" /> },
      suspended: { variant: 'destructive', icon: <XCircle className="h-3 w-3 mr-1" /> },
      pending: { variant: 'outline', icon: <Clock className="h-3 w-3 mr-1" /> },
    }
    const style = styles[status] || styles.pending
    return (
      <Badge variant={style.variant} className="flex items-center">
        {style.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getPlanBadge = (plan: string) => {
    const styles: Record<string, string> = {
      starter: 'bg-gray-100 text-gray-700',
      professional: 'bg-blue-100 text-blue-700',
      enterprise: 'bg-purple-100 text-purple-700',
    }
    return (
      <Badge variant="outline" className={styles[plan] || styles.starter}>
        {plan === 'enterprise' && <Crown className="h-3 w-3 mr-1" />}
        {PLAN_FEATURES[plan]?.name || plan}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenant Management</h1>
          <p className="text-sm text-gray-500">Manage platform tenants, subscriptions, and access</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Tenant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tenant</DialogTitle>
              <DialogDescription>
                Create a new tenant organization on the platform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-') })}
                  placeholder="Acme Corporation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="acme-corporation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Custom Domain (optional)</Label>
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  placeholder="acme.groway.co.za"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan">Plan</Label>
                <Select value={formData.plan} onValueChange={(value) => setFormData({ ...formData, plan: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PLAN_FEATURES).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.name} - R{value.price}/mo ({value.users} users)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateTenant} className="bg-teal-600 hover:bg-teal-700">Create Tenant</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Tenants</p>
                <p className="text-2xl font-bold">{stats?.total || tenants.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats?.active || tenants.filter(t => t.status === 'active').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">On Trial</p>
                <p className="text-2xl font-bold text-yellow-600">{stats?.trial || tenants.filter(t => t.status === 'trial').length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Suspended</p>
                <p className="text-2xl font-bold text-red-600">{stats?.suspended || tenants.filter(t => t.status === 'suspended').length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tenants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tenants</CardTitle>
          <CardDescription>
            {filteredTenants.length} tenant{filteredTenants.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No tenants found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{tenant.name}</p>
                        <p className="text-sm text-gray-500">{tenant.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getPlanBadge(tenant.plan)}</TableCell>
                    <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{tenant.userCount || 0}/{tenant.maxUsers}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTenant(tenant)
                            setFormData({
                              name: tenant.name,
                              slug: tenant.slug,
                              domain: tenant.domain || '',
                              plan: tenant.plan,
                              status: tenant.status,
                            })
                            setShowEditDialog(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tenant</DialogTitle>
            <DialogDescription>
              Update tenant settings and configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Organization Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-domain">Custom Domain</Label>
              <Input
                id="edit-domain"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-plan">Plan</Label>
                <Select value={formData.plan} onValueChange={(value) => setFormData({ ...formData, plan: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PLAN_FEATURES).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateTenant} className="bg-teal-600 hover:bg-teal-700">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
