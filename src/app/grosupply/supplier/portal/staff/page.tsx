'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Mail, 
  Shield,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  Key,
  Settings,
  ChevronDown,
  Copy,
  Send,
  UserX,
  UserCheck,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'

// Permission definitions
const PERMISSION_CATEGORIES = {
  'Orders': {
    color: 'blue',
    permissions: [
      { id: 'orders_view', label: 'View Orders', description: 'View purchase orders from buyers' },
      { id: 'orders_confirm', label: 'Confirm Orders', description: 'Confirm and accept orders' },
      { id: 'orders_dispatch', label: 'Dispatch Orders', description: 'Mark orders as dispatched' },
      { id: 'orders_cancel', label: 'Cancel Orders', description: 'Cancel orders with reason' },
    ]
  },
  'Products': {
    color: 'purple',
    permissions: [
      { id: 'products_view', label: 'View Products', description: 'View product catalog' },
      { id: 'products_create', label: 'Create Products', description: 'Add new products' },
      { id: 'products_edit', label: 'Edit Products', description: 'Edit product details' },
      { id: 'products_delete', label: 'Delete Products', description: 'Remove products' },
      { id: 'products_bulk_import', label: 'Bulk Import', description: 'Import via CSV/Excel' },
    ]
  },
  'RFQs': {
    color: 'yellow',
    permissions: [
      { id: 'rfq_view', label: 'View RFQs', description: 'View requests for quotation' },
      { id: 'rfq_respond', label: 'Respond to RFQs', description: 'Submit quotes' },
      { id: 'rfq_create', label: 'Create RFQs', description: 'Create new RFQ requests' },
    ]
  },
  'Invoices': {
    color: 'red',
    permissions: [
      { id: 'invoices_view', label: 'View Invoices', description: 'View supplier invoices' },
      { id: 'invoices_create', label: 'Create Invoices', description: 'Create and submit invoices' },
      { id: 'invoices_edit', label: 'Edit Invoices', description: 'Modify draft invoices' },
    ]
  },
  'Staff': {
    color: 'teal',
    permissions: [
      { id: 'staff_view', label: 'View Staff', description: 'View team members' },
      { id: 'staff_invite', label: 'Invite Staff', description: 'Invite new team members' },
      { id: 'staff_manage', label: 'Manage Staff', description: 'Edit roles and permissions' },
    ]
  },
  'Settings': {
    color: 'gray',
    permissions: [
      { id: 'settings_view', label: 'View Settings', description: 'View supplier settings' },
      { id: 'settings_edit', label: 'Edit Settings', description: 'Modify supplier settings' },
    ]
  },
}

const ROLES = [
  { id: 'owner', label: 'Owner', description: 'Full access to all features', color: '#9333EA', fullAccess: true },
  { id: 'admin', label: 'Admin', description: 'Manage products, orders, invoices', color: '#00897B' },
  { id: 'manager', label: 'Manager', description: 'Handle orders, RFQs, invoices', color: '#0369A1' },
  { id: 'staff', label: 'Staff', description: 'Process orders and operations', color: '#059669' },
  { id: 'viewer', label: 'Viewer', description: 'Read-only access', color: '#6B7280' },
]

const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: Object.values(PERMISSION_CATEGORIES).flatMap(cat => cat.permissions.map(p => p.id)),
  admin: ['orders_view', 'orders_confirm', 'orders_dispatch', 'orders_cancel', 'products_view', 'products_create', 'products_edit', 'products_delete', 'products_bulk_import', 'rfq_view', 'rfq_respond', 'rfq_create', 'invoices_view', 'invoices_create', 'invoices_edit', 'staff_view', 'staff_invite', 'settings_view', 'settings_edit'],
  manager: ['orders_view', 'orders_confirm', 'orders_dispatch', 'products_view', 'products_create', 'products_edit', 'products_bulk_import', 'rfq_view', 'rfq_respond', 'invoices_view', 'invoices_create', 'invoices_edit', 'staff_view'],
  staff: ['orders_view', 'orders_confirm', 'orders_dispatch', 'products_view', 'products_edit', 'rfq_view', 'rfq_respond', 'invoices_view', 'invoices_create'],
  viewer: ['orders_view', 'products_view', 'rfq_view', 'invoices_view'],
}

// Mock staff data
const mockStaff = [
  {
    id: '1',
    name: 'John Supplier',
    email: 'john@supplier.co.za',
    phone: '+27 82 123 4567',
    role: 'owner',
    status: 'active',
    department: 'Management',
    jobTitle: 'Owner',
    lastLoginAt: new Date().toISOString(),
    twoFactorEnabled: true,
    avatar: null
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@supplier.co.za',
    phone: '+27 83 234 5678',
    role: 'admin',
    status: 'active',
    department: 'Operations',
    jobTitle: 'Operations Manager',
    lastLoginAt: new Date(Date.now() - 86400000).toISOString(),
    twoFactorEnabled: true,
    avatar: null
  },
  {
    id: '3',
    name: 'Michael Chen',
    email: 'michael@supplier.co.za',
    phone: '+27 84 345 6789',
    role: 'manager',
    status: 'active',
    department: 'Sales',
    jobTitle: 'Sales Manager',
    lastLoginAt: new Date(Date.now() - 172800000).toISOString(),
    twoFactorEnabled: false,
    avatar: null
  },
  {
    id: '4',
    name: 'Lisa Nkosi',
    email: 'lisa@supplier.co.za',
    phone: '+27 85 456 7890',
    role: 'staff',
    status: 'active',
    department: 'Fulfillment',
    jobTitle: 'Order Processor',
    lastLoginAt: new Date(Date.now() - 259200000).toISOString(),
    twoFactorEnabled: false,
    avatar: null
  },
  {
    id: '5',
    name: 'David van der Merwe',
    email: 'david@supplier.co.za',
    phone: '+27 86 567 8901',
    role: 'staff',
    status: 'pending',
    department: 'Products',
    jobTitle: 'Catalog Manager',
    invitedAt: new Date(Date.now() - 172800000).toISOString(),
    twoFactorEnabled: false,
    avatar: null
  },
  {
    id: '6',
    name: 'Thandi Mokoena',
    email: 'thandi@supplier.co.za',
    phone: '+27 87 678 9012',
    role: 'viewer',
    status: 'inactive',
    department: 'Finance',
    jobTitle: 'Accountant',
    lastLoginAt: new Date(Date.now() - 2592000000).toISOString(),
    twoFactorEnabled: true,
    avatar: null
  },
]

export default function SupplierStaffManagement() {
  const [staff, setStaff] = useState(mockStaff)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Dialog states
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  // Form states
  const [selectedStaff, setSelectedStaff] = useState<any>(null)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    phone: '',
    role: 'staff',
    department: '',
    jobTitle: '',
    customPermissions: [] as string[],
    sendInvite: true
  })
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    role: '',
    department: '',
    jobTitle: '',
    status: '',
    twoFactorEnabled: false
  })
  const [customPermissions, setCustomPermissions] = useState<string[]>([])

  // Stats
  const stats = {
    total: staff.length,
    active: staff.filter(s => s.status === 'active').length,
    pending: staff.filter(s => s.status === 'pending').length,
    inactive: staff.filter(s => s.status === 'inactive').length,
    byRole: {
      owner: staff.filter(s => s.role === 'owner').length,
      admin: staff.filter(s => s.role === 'admin').length,
      manager: staff.filter(s => s.role === 'manager').length,
      staff: staff.filter(s => s.role === 'staff').length,
      viewer: staff.filter(s => s.role === 'viewer').length,
    }
  }

  // Filter staff
  const filteredStaff = staff.filter(member => {
    const matchesSearch = !searchQuery || 
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || member.role === roleFilter
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  // Handle role change and update permissions
  const handleRoleChange = (role: string) => {
    setInviteForm(prev => ({
      ...prev,
      role,
      customPermissions: ROLE_PERMISSIONS[role] || []
    }))
  }

  // Open edit dialog
  const openEditDialog = (member: any) => {
    setSelectedStaff(member)
    setEditForm({
      name: member.name,
      phone: member.phone || '',
      role: member.role,
      department: member.department || '',
      jobTitle: member.jobTitle || '',
      status: member.status,
      twoFactorEnabled: member.twoFactorEnabled || false
    })
    setShowEditDialog(true)
  }

  // Open permissions dialog
  const openPermissionsDialog = (member: any) => {
    setSelectedStaff(member)
    setCustomPermissions(ROLE_PERMISSIONS[member.role] || [])
    setShowPermissionsDialog(true)
  }

  // Get role badge color
  const getRoleBadge = (role: string) => {
    const roleData = ROLES.find(r => r.id === role)
    return (
      <Badge 
        style={{ backgroundColor: `${roleData?.color}20`, color: roleData?.color }}
        className="border-0 font-medium"
      >
        {roleData?.label || role}
      </Badge>
    )
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      inactive: 'bg-gray-100 text-gray-600',
      suspended: 'bg-red-100 text-red-700'
    }
    return (
      <Badge className={`${styles[status]} border-0`}>
        {status}
      </Badge>
    )
  }

  // Format last login
  const formatLastLogin = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-500 mt-1">Manage team members and their access permissions</p>
        </div>
        <Button 
          className="bg-[#00897B] hover:bg-[#00695C]"
          onClick={() => {
            setInviteForm({
              email: '',
              name: '',
              phone: '',
              role: 'staff',
              department: '',
              jobTitle: '',
              customPermissions: ROLE_PERMISSIONS['staff'],
              sendInvite: true
            })
            setShowInviteDialog(true)
          }}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Team Member
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Staff</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending Invites</p>
                <p className="text-xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <UserX className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Inactive</p>
                <p className="text-xl font-bold text-gray-900">{stats.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {ROLES.map(role => (
              <SelectItem key={role.id} value={role.id}>{role.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Staff List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {filteredStaff.map((member) => (
              <div 
                key={member.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="bg-[#00897B] text-white">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{member.name}</p>
                      {member.twoFactorEnabled && (
                        <ShieldCheck className="h-4 w-4 text-green-500" title="2FA Enabled" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-6">
                  <div className="text-center">
                    {getRoleBadge(member.role)}
                    <p className="text-xs text-gray-500 mt-1">{member.jobTitle}</p>
                  </div>
                  {getStatusBadge(member.status)}
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {member.status === 'pending' ? 'Invited' : 'Last login'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {member.status === 'pending' 
                        ? formatLastLogin(member.invitedAt)
                        : formatLastLogin(member.lastLoginAt)
                      }
                    </p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-1">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => openEditDialog(member)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openPermissionsDialog(member)}>
                      <Shield className="h-4 w-4 mr-2" />
                      Permissions
                    </DropdownMenuItem>
                    {member.status === 'pending' && (
                      <DropdownMenuItem>
                        <Send className="h-4 w-4 mr-2" />
                        Resend Invite
                      </DropdownMenuItem>
                    )}
                    {member.status === 'inactive' && (
                      <DropdownMenuItem>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Reactivate
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {member.role !== 'owner' && (
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => {
                          setSelectedStaff(member)
                          setShowDeleteDialog(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {member.status === 'active' ? 'Deactivate' : 'Delete'}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Add a new team member to your supplier account. They will receive an email invitation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@company.co.za"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={inviteForm.phone}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+27 82 123 4567"
                />
              </div>
              <div>
                <Label htmlFor="role">Role *</Label>
                <Select value={inviteForm.role} onValueChange={handleRoleChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.filter(r => r.id !== 'owner').map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        <div>
                          <span>{role.label}</span>
                          <span className="text-xs text-gray-500 ml-2">{role.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={inviteForm.department}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="Operations, Sales, etc."
                />
              </div>
              <div>
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  value={inviteForm.jobTitle}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                  placeholder="Manager, Specialist, etc."
                />
              </div>
            </div>

            {/* Permissions Preview */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">Permissions Included</Label>
                <Badge variant="outline">{inviteForm.customPermissions.length} permissions</Badge>
              </div>
              <ScrollArea className="h-32">
                <div className="flex flex-wrap gap-1">
                  {inviteForm.customPermissions.map(perm => {
                    const category = Object.entries(PERMISSION_CATEGORIES).find(([_, cat]) => 
                      cat.permissions.some(p => p.id === perm)
                    )
                    return (
                      <Badge key={perm} variant="secondary" className="text-xs">
                        {perm.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Send invitation email</Label>
                <p className="text-xs text-gray-500">The user will receive an email to set up their account</p>
              </div>
              <Switch
                checked={inviteForm.sendInvite}
                onCheckedChange={(checked) => setInviteForm(prev => ({ ...prev, sendInvite: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]"
              onClick={() => {
                // TODO: Call API to invite user
                console.log('Inviting user:', inviteForm)
                setShowInviteDialog(false)
              }}
            >
              <Send className="h-4 w-4 mr-2" />
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>
              Update {selectedStaff?.name}&apos;s details and role.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Select 
                  value={editForm.role} 
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, role: value }))}
                  disabled={selectedStaff?.role === 'owner'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(role => (
                      <SelectItem key={role.id} value={role.id}>{role.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={editForm.status} 
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}
                  disabled={selectedStaff?.role === 'owner'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-department">Department</Label>
                <Input
                  id="edit-department"
                  value={editForm.department}
                  onChange={(e) => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-jobTitle">Job Title</Label>
                <Input
                  id="edit-jobTitle"
                  value={editForm.jobTitle}
                  onChange={(e) => setEditForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <Label>Two-Factor Authentication</Label>
                <p className="text-xs text-gray-500">Require 2FA for this user</p>
              </div>
              <Switch
                checked={editForm.twoFactorEnabled}
                onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, twoFactorEnabled: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]"
              onClick={() => {
                // TODO: Call API to update user
                console.log('Updating user:', editForm)
                setShowEditDialog(false)
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Manage Permissions</DialogTitle>
            <DialogDescription>
              Configure {selectedStaff?.name}&apos;s access permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="mb-4">
              <Label className="text-sm font-medium mb-2 block">Role-based Preset</Label>
              <Select 
                value={selectedStaff?.role} 
                onValueChange={(value) => setCustomPermissions(ROLE_PERMISSIONS[value] || [])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex items-center gap-2">
                        <span>{role.label}</span>
                        <span className="text-xs text-gray-500">- {role.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
              {Object.entries(PERMISSION_CATEGORIES).map(([categoryName, category]) => (
                <div key={categoryName} className="p-4">
                  <h4 className="font-medium text-gray-900 mb-3">{categoryName}</h4>
                  <div className="space-y-2">
                    {category.permissions.map((permission) => (
                      <div key={permission.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">{permission.label}</p>
                          <p className="text-xs text-gray-500">{permission.description}</p>
                        </div>
                        <Switch
                          checked={customPermissions.includes(permission.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setCustomPermissions(prev => [...prev, permission.id])
                            } else {
                              setCustomPermissions(prev => prev.filter(p => p !== permission.id))
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]"
              onClick={() => {
                // TODO: Call API to update permissions
                console.log('Updating permissions:', customPermissions)
                setShowPermissionsDialog(false)
              }}
            >
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete/Deactivate Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              {selectedStaff?.status === 'active' ? 'Deactivate User' : 'Delete User'}
            </DialogTitle>
            <DialogDescription>
              {selectedStaff?.status === 'active' 
                ? `Are you sure you want to deactivate ${selectedStaff?.name}? They will lose access to the supplier portal immediately.`
                : `Are you sure you want to permanently delete ${selectedStaff?.name}? This action cannot be undone.`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> {selectedStaff?.status === 'active'
                  ? 'The user will need to be reactivated to regain access.'
                  : 'All user data will be permanently removed.'
                }
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                // TODO: Call API to delete/deactivate user
                console.log('Deleting user:', selectedStaff?.id)
                setShowDeleteDialog(false)
              }}
            >
              {selectedStaff?.status === 'active' ? 'Deactivate' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
