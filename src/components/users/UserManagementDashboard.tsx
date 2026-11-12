'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Building2, Shield, Mail, Download, Upload, 
  Plus, Search, Filter, RefreshCw, ChevronDown 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserTable } from './UserTable';
import { UserForm } from './UserForm';
import { BulkUserOperations } from './BulkUserOperations';
import { UserInvitationDialog } from './UserInvitationDialog';
import { RoleManager } from './RoleManager';
import { TenantSwitcher } from './TenantSwitcher';

interface User {
  id: string;
  type: string;
  phone?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  status: string;
  kycStatus?: string;
  role?: string;
  tenantUserId?: string;
  lastActiveAt?: string;
  createdAt: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
}

interface UserCounts {
  consumers: number;
  admins: number;
  tenantUsers: number;
}

interface UserManagementDashboardProps {
  initialTenantId?: string;
  onTenantChange?: (tenantId: string) => void;
}

export function UserManagementDashboard({ 
  initialTenantId, 
  onTenantChange 
}: UserManagementDashboardProps) {
  const [activeTab, setActiveTab] = useState('users');
  const [selectedTenantId, setSelectedTenantId] = useState(initialTenantId || '');
  const [users, setUsers] = useState<User[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [userCounts, setUserCounts] = useState<UserCounts>({ consumers: 0, admins: 0, tenantUsers: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Dialog states
  const [showUserForm, setShowUserForm] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Fetch tenants
  const fetchTenants = useCallback(async () => {
    try {
      const response = await fetch('/api/tenants?limit=100');
      const data = await response.json();
      setTenants(data.tenants || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  }, []);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter && { status: statusFilter }),
        ...(userTypeFilter && { userType: userTypeFilter }),
        ...(selectedTenantId && { tenantId: selectedTenantId }),
      });
      
      const response = await fetch(`/api/users?${params}`);
      const data = await response.json();
      
      setUsers(data.users || []);
      setUserCounts(data.counts || { consumers: 0, admins: 0, tenantUsers: 0 });
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, statusFilter, userTypeFilter, selectedTenantId]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleTenantChange = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    onTenantChange?.(tenantId);
    setPage(1);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const handleRefresh = () => {
    fetchUsers();
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowUserForm(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleUserFormClose = () => {
    setShowUserForm(false);
    setEditingUser(null);
    fetchUsers();
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const params = new URLSearchParams({
        format,
        ...(selectedTenantId && { tenantId: selectedTenantId }),
      });
      
      const response = await fetch(`/api/users/bulk?${params}`);
      
      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users-export.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users-export.json';
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting users:', error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users across Merchant OS, GoPay, Grosell, and Consumer Wallet
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TenantSwitcher
            tenants={tenants}
            selectedTenantId={selectedTenantId}
            onTenantChange={handleTenantChange}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {userCounts.consumers} consumers, {userCounts.admins} admins
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tenant Members</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCounts.tenantUsers}</div>
            <p className="text-xs text-muted-foreground">
              In selected tenant
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KYC Verified</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.kycStatus === 'verified').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Identity verified
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-1 gap-2 items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                </SelectContent>
              </Select>
              <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="consumer">Consumer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="merchant">Merchant</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Export
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleExport('csv')}>
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('json')}>
                    Export as JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm" onClick={() => setShowBulkDialog(true)}>
                <Upload className="h-4 w-4 mr-1" />
                Bulk Import
              </Button>
              <Button size="sm" onClick={handleCreateUser}>
                <Plus className="h-4 w-4 mr-1" />
                Add User
              </Button>
              <Button variant="default" size="sm" onClick={() => setShowInviteDialog(true)}>
                <Mail className="h-4 w-4 mr-1" />
                Invite Users
              </Button>
            </div>
          </div>

          {/* User Table */}
          <UserTable
            users={users}
            isLoading={isLoading}
            selectedUsers={selectedUsers}
            onSelectUsers={setSelectedUsers}
            onEdit={handleEditUser}
            onRefresh={fetchUsers}
            tenantId={selectedTenantId}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * 50) + 1} to {Math.min(page * 50, total)} of {total} users
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="invitations">
          <UserInvitationDialog
            tenantId={selectedTenantId}
            onClose={() => {}}
            standalone
          />
        </TabsContent>

        <TabsContent value="roles">
          <RoleManager />
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>
                Track all user-related activities across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Audit log viewer coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {showUserForm && (
        <UserForm
          user={editingUser}
          tenantId={selectedTenantId}
          onClose={handleUserFormClose}
        />
      )}

      {showInviteDialog && (
        <UserInvitationDialog
          tenantId={selectedTenantId}
          onClose={() => {
            setShowInviteDialog(false);
            fetchUsers();
          }}
        />
      )}

      {showBulkDialog && (
        <BulkUserOperations
          tenantId={selectedTenantId}
          onClose={() => {
            setShowBulkDialog(false);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}

export default UserManagementDashboard;
