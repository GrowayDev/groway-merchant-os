'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Building, Shield, Save, X } from 'lucide-react';

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
}

interface UserFormProps {
  user: User | null;
  tenantId?: string;
  onClose: () => void;
}

export function UserForm({ user, tenantId, onClose }: UserFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    type: user?.type || 'consumer',
    phone: user?.phone || '',
    email: user?.email || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    name: user?.fullName || '',
    status: user?.status || 'active',
    role: user?.role || 'member',
    kycStatus: user?.kycStatus || 'pending',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = user ? `/api/users/${user.id}` : '/api/users';
      const method = user ? 'PUT' : 'POST';
      
      const body: Record<string, unknown> = {
        type: formData.type,
        email: formData.email || null,
        firstName: formData.firstName || null,
        lastName: formData.lastName || null,
        status: formData.status,
        tenantId: tenantId || null,
        role: formData.role,
      };

      if (formData.type === 'consumer') {
        body.phone = formData.phone;
      } else {
        body.name = formData.name || `${formData.firstName} ${formData.lastName}`.trim();
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to save user');
      }

      onClose();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Failed to save user');
    } finally {
      setIsLoading(false);
    }
  };

  const isEditing = !!user;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {isEditing ? 'Edit User' : 'Create New User'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update user information and permissions'
              : 'Add a new user to the platform'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">User Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleChange('type', value)}
                    disabled={isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consumer">Consumer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="merchant">Merchant</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      placeholder="John"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      placeholder="Doe"
                    />
                  </div>
                </div>

                {formData.type === 'admin' && (
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.type === 'consumer' && (
                  <div className="grid gap-2">
                    <Label htmlFor="kycStatus">KYC Status</Label>
                    <Select
                      value={formData.kycStatus}
                      onValueChange={(value) => handleChange('kycStatus', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select KYC status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4 mt-4">
              <div className="grid gap-4">
                {formData.type === 'consumer' && (
                  <div className="grid gap-2">
                    <Label htmlFor="phone">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Number
                      </div>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="+27 12 345 6789"
                      required={formData.type === 'consumer' && !isEditing}
                    />
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="email">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </div>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="john@example.com"
                    required={formData.type === 'admin'}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4 mt-4">
              <div className="grid gap-4">
                {tenantId && (
                  <div className="grid gap-2">
                    <Label htmlFor="role">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Tenant Role
                      </div>
                    </Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => handleChange('role', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="rounded-lg border p-4 space-y-3">
                  <h4 className="font-medium">Available Permissions</h4>
                  <div className="flex flex-wrap gap-2">
                    {['users:read', 'users:write', 'users:delete', 'settings:read', 'settings:write', 'billing:read', 'billing:write', 'reports:read', 'admin:all'].map((perm) => (
                      <Badge
                        key={perm}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/10"
                      >
                        {perm}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Click on permissions to assign them to this user
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default UserForm;
