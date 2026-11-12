'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  History, User, Shield, Building2, Settings, Trash2, 
  Edit, Plus, Mail, RefreshCw, Filter, Download, Search,
  Clock, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AuditLogEntry {
  id: string;
  tenantId?: string;
  userId?: string;
  userType?: string;
  action: string;
  category: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface AuditLogViewerProps {
  tenantId?: string;
  userId?: string;
  limit?: number;
}

const actionIcons: Record<string, React.ReactNode> = {
  user_created: <Plus className="h-4 w-4 text-green-500" />,
  user_updated: <Edit className="h-4 w-4 text-blue-500" />,
  user_deleted: <Trash2 className="h-4 w-4 text-red-500" />,
  user_login: <User className="h-4 w-4 text-gray-500" />,
  user_logout: <User className="h-4 w-4 text-gray-400" />,
  tenant_created: <Building2 className="h-4 w-4 text-green-500" />,
  tenant_updated: <Edit className="h-4 w-4 text-blue-500" />,
  invitation_sent: <Mail className="h-4 w-4 text-amber-500" />,
  invitation_accepted: <Mail className="h-4 w-4 text-green-500" />,
  permission_changed: <Shield className="h-4 w-4 text-purple-500" />,
  settings_changed: <Settings className="h-4 w-4 text-blue-500" />,
  default: <History className="h-4 w-4 text-gray-500" />,
};

const categoryColors: Record<string, string> = {
  user_management: 'bg-blue-100 text-blue-800',
  tenant_management: 'bg-purple-100 text-purple-800',
  authentication: 'bg-green-100 text-green-800',
  authorization: 'bg-amber-100 text-amber-800',
  settings: 'bg-gray-100 text-gray-800',
  default: 'bg-gray-100 text-gray-600',
};

export function AuditLogViewer({ tenantId, userId, limit = 100 }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(actionFilter && { action: actionFilter }),
        ...(tenantId && { tenantId }),
        ...(userId && { userId }),
      });

      const response = await fetch(`/api/audit?${params}`);
      const data = await response.json();
      
      setLogs(data.logs || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, categoryFilter, actionFilter, tenantId, userId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-ZA'),
      time: date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const parseDetails = (details?: string) => {
    if (!details) return null;
    try {
      return JSON.parse(details);
    } catch {
      return { raw: details };
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        format: 'csv',
        ...(tenantId && { tenantId }),
        ...(userId && { userId }),
      });
      
      const response = await fetch(`/api/audit?${params}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting audit logs:', error);
    }
  };

  return (
    <Card className="bg-[#1E293B] border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <History className="h-5 w-5 text-[#00897B]" />
              Audit Log
            </CardTitle>
            <CardDescription className="text-gray-400">
              Track all user and system activities
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by action, user, or target..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-[#0F172A] border-gray-600 text-white"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px] bg-[#0F172A] border-gray-600 text-white">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-[#1E293B] border-gray-600 text-white">
              <SelectItem value="">All Categories</SelectItem>
              <SelectItem value="user_management">User Management</SelectItem>
              <SelectItem value="tenant_management">Tenant Management</SelectItem>
              <SelectItem value="authentication">Authentication</SelectItem>
              <SelectItem value="authorization">Authorization</SelectItem>
              <SelectItem value="settings">Settings</SelectItem>
            </SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[160px] bg-[#0F172A] border-gray-600 text-white">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent className="bg-[#1E293B] border-gray-600 text-white">
              <SelectItem value="">All Actions</SelectItem>
              <SelectItem value="user_created">User Created</SelectItem>
              <SelectItem value="user_updated">User Updated</SelectItem>
              <SelectItem value="user_deleted">User Deleted</SelectItem>
              <SelectItem value="user_login">User Login</SelectItem>
              <SelectItem value="invitation_sent">Invitation Sent</SelectItem>
              <SelectItem value="invitation_accepted">Invitation Accepted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Log Table */}
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 hover:bg-transparent">
                <TableHead className="text-gray-400 w-[180px]">Timestamp</TableHead>
                <TableHead className="text-gray-400 w-[120px]">Action</TableHead>
                <TableHead className="text-gray-400">User</TableHead>
                <TableHead className="text-gray-400">Category</TableHead>
                <TableHead className="text-gray-400">Target</TableHead>
                <TableHead className="text-gray-400">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading audit logs...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const { date, time } = formatDate(log.createdAt);
                  const details = parseDetails(log.details);
                  
                  return (
                    <TableRow key={log.id} className="border-gray-700 hover:bg-gray-800/50">
                      <TableCell className="text-white">
                        <div className="flex flex-col">
                          <span className="text-sm">{date}</span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {time}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {actionIcons[log.action] || actionIcons.default}
                          <span className="text-white text-sm capitalize">
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        <div className="flex flex-col">
                          <span className="text-sm">{log.userType || 'System'}</span>
                          {log.userId && (
                            <span className="text-xs text-gray-500 font-mono">
                              {log.userId.slice(0, 8)}...
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={categoryColors[log.category] || categoryColors.default}
                        >
                          {log.category.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {log.targetName ? (
                          <span>{log.targetName}</span>
                        ) : log.targetId ? (
                          <span className="font-mono text-xs">
                            {log.targetId.slice(0, 8)}...
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-400 max-w-[200px]">
                        {details && (
                          <div className="text-xs truncate" title={JSON.stringify(details, null, 2)}>
                            {Object.entries(details).slice(0, 2).map(([k, v]) => (
                              <span key={k} className="mr-2">
                                <span className="text-gray-500">{k}:</span> {String(v).slice(0, 20)}
                              </span>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} entries
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="border-gray-600 text-gray-300"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-gray-400 text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="border-gray-600 text-gray-300"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AuditLogViewer;
