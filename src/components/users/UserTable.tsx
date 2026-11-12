'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Mail,
  Shield,
  Eye,
  UserX,
  Key,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface User {
  id: string;
  type: string;
  phone?: string;
  email?: string;
  fullName: string;
  status: string;
  kycStatus?: string;
  role?: string;
  tenantUserId?: string;
  lastActiveAt?: string;
  createdAt: string;
}

interface UserTableProps {
  users: User[];
  isLoading: boolean;
  selectedUsers: string[];
  onSelectUsers: (ids: string[]) => void;
  onEdit: (user: User) => void;
  onRefresh: () => void;
  tenantId?: string;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  suspended: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  deleted: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-500',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
};

const kycStatusColors: Record<string, string> = {
  verified: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
  under_review: 'bg-blue-100 text-blue-800',
};

const typeColors: Record<string, string> = {
  consumer: 'bg-purple-100 text-purple-800',
  admin: 'bg-blue-100 text-blue-800',
  merchant: 'bg-orange-100 text-orange-800',
  agent: 'bg-teal-100 text-teal-800',
};

export function UserTable({
  users,
  isLoading,
  selectedUsers,
  onSelectUsers,
  onEdit,
  onRefresh,
  tenantId,
}: UserTableProps) {
  const allSelected = users.length > 0 && users.every(u => selectedUsers.includes(u.id));
  const someSelected = users.some(u => selectedUsers.includes(u.id));

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectUsers([]);
    } else {
      onSelectUsers(users.map(u => u.id));
    }
  };

  const handleSelectUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      onSelectUsers(selectedUsers.filter(id => id !== userId));
    } else {
      onSelectUsers([...selectedUsers, userId]);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.fullName}?`)) return;
    
    try {
      const params = new URLSearchParams({
        ...(tenantId && { tenantId }),
      });
      await fetch(`/api/users/${user.id}?${params}`, { method: 'DELETE' });
      onRefresh();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleStatusChange = async (user: User, newStatus: string) => {
    try {
      await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      onRefresh();
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const getInitials = (user: User) => {
    if (user.fullName) {
      return user.fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user.type.slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No users found</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={allSelected}
                ref={(ref) => {
                  if (ref) {
                    (ref as HTMLButtonElement & { indeterminate: boolean }).indeterminate = someSelected && !allSelected;
                  }
                }}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>User</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>KYC Status</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Last Active</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow
              key={user.id}
              className={selectedUsers.includes(user.id) ? 'bg-muted/50' : ''}
            >
              <TableCell>
                <Checkbox
                  checked={selectedUsers.includes(user.id)}
                  onCheckedChange={() => handleSelectUser(user.id)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.fullName || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email || user.phone || '-'}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={typeColors[user.type] || 'bg-gray-100'}>
                  {user.type}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={statusColors[user.status] || 'bg-gray-100'}>
                  {user.status}
                </Badge>
              </TableCell>
              <TableCell>
                {user.kycStatus ? (
                  <Badge className={kycStatusColors[user.kycStatus] || 'bg-gray-100'}>
                    {user.kycStatus}
                  </Badge>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>
                {user.role ? (
                  <Badge variant="outline">{user.role}</Badge>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {user.lastActiveAt ? (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(user.lastActiveAt), { addSuffix: true })}
                  </div>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onEdit(user)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Key className="h-4 w-4 mr-2" />
                      Reset Password
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleStatusChange(user, 'active')}>
                      <Shield className="h-4 w-4 mr-2" />
                      Activate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange(user, 'suspended')}>
                      <UserX className="h-4 w-4 mr-2" />
                      Suspend
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={() => handleDelete(user)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default UserTable;
