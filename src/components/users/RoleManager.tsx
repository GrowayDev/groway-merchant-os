'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Shield, Plus, Edit, Trash2, Save, X, 
  Loader2, Check, Search 
} from 'lucide-react';

interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: string;
}

interface Permission {
  category: string;
  permissions: string[];
}

const availablePermissions: Permission[] = [
  {
    category: 'Users',
    permissions: ['users:read', 'users:write', 'users:delete', 'users:invite'],
  },
  {
    category: 'Tenants',
    permissions: ['tenants:read', 'tenants:write', 'tenants:delete'],
  },
  {
    category: 'Roles',
    permissions: ['roles:read', 'roles:write', 'roles:delete'],
  },
  {
    category: 'Settings',
    permissions: ['settings:read', 'settings:write'],
  },
  {
    category: 'Billing',
    permissions: ['billing:read', 'billing:write'],
  },
  {
    category: 'Reports',
    permissions: ['reports:read', 'reports:export'],
  },
  {
    category: 'Admin',
    permissions: ['admin:all', 'admin:audit'],
  },
];

export function RoleManager() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: [] as string[],
  });

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/roles?includeSystem=true');
      const data = await response.json();
      setRoles(data.roles || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleCreateRole = () => {
    setEditingRole(null);
    setFormData({
      name: '',
      displayName: '',
      description: '',
      permissions: [],
    });
    setShowDialog(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      displayName: role.displayName,
      description: role.description || '',
      permissions: role.permissions,
    });
    setShowDialog(true);
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    
    try {
      const response = await fetch(`/api/roles?id=${roleId}`, { method: 'DELETE' });
      if (response.ok) {
        fetchRoles();
      }
    } catch (error) {
      console.error('Error deleting role:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const url = '/api/roles';
      const method = editingRole ? 'PUT' : 'POST';
      const body = editingRole 
        ? { id: editingRole.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowDialog(false);
        fetchRoles();
      }
    } catch (error) {
      console.error('Error saving role:', error);
    }
  };

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const selectAllInCategory = (category: string, selected: boolean) => {
    const categoryPerms = availablePermissions.find(p => p.category === category)?.permissions || [];
    setFormData(prev => ({
      ...prev,
      permissions: selected
        ? [...new Set([...prev.permissions, ...categoryPerms])]
        : prev.permissions.filter(p => !categoryPerms.includes(p)),
    }));
  };

  const filteredRoles = roles.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Roles & Permissions
          </h2>
          <p className="text-muted-foreground">
            Manage roles and their associated permissions
          </p>
        </div>
        <Button onClick={handleCreateRole}>
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Roles</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{role.displayName}</p>
                          <p className="text-xs text-muted-foreground">{role.name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {role.description || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {role.permissions.slice(0, 3).map((p) => (
                            <Badge key={p} variant="outline" className="text-xs">
                              {p}
                            </Badge>
                          ))}
                          {role.permissions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{role.permissions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={role.isSystem ? 'default' : 'secondary'}>
                          {role.isSystem ? 'System' : 'Custom'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRole(role)}
                            disabled={role.isSystem}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRole(role.id)}
                            disabled={role.isSystem}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Edit Role' : 'Create New Role'}
            </DialogTitle>
            <DialogDescription>
              {editingRole 
                ? 'Update role name and permissions'
                : 'Define a new role with specific permissions'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Role Name (unique identifier)</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., content_manager"
                disabled={!!editingRole?.isSystem}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="e.g., Content Manager"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this role can do..."
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label>Permissions</Label>
              <div className="space-y-3 rounded-lg border p-4">
                {availablePermissions.map((category) => (
                  <div key={category.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{category.category}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => selectAllInCategory(
                          category.category,
                          !category.permissions.every(p => formData.permissions.includes(p))
                        )}
                      >
                        {category.permissions.every(p => formData.permissions.includes(p))
                          ? 'Deselect All'
                          : 'Select All'}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {category.permissions.map((permission) => (
                        <Badge
                          key={permission}
                          variant={formData.permissions.includes(permission) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => togglePermission(permission)}
                        >
                          {formData.permissions.includes(permission) && (
                            <Check className="h-3 w-3 mr-1" />
                          )}
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name || !formData.displayName}>
              <Save className="h-4 w-4 mr-2" />
              {editingRole ? 'Update Role' : 'Create Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RoleManager;
