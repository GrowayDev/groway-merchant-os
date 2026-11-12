'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  ScrollText,
  Search,
  Filter,
  Download,
  User,
  Building2,
  CreditCard,
  Shield,
  Settings,
  FileText,
  Clock,
  ChevronRight,
  Eye
} from 'lucide-react'

// Audit Log Entry
interface AuditLogEntry {
  id: string
  timestamp: string
  action: string
  category: 'merchant' | 'transaction' | 'compliance' | 'system' | 'user'
  actor: {
    name: string
    email: string
    role: string
  }
  target: {
    type: string
    id: string
    name: string
  }
  details: string
  ipAddress: string
  userAgent: string
}

// Sample Audit Logs
const auditLogs: AuditLogEntry[] = [
  {
    id: 'AL-001',
    timestamp: '2025-03-10T15:32:00',
    action: 'Merchant Approved',
    category: 'merchant',
    actor: { name: 'Sarah M.', email: 'sarah@groway.co.za', role: 'Compliance Officer' },
    target: { type: 'Merchant', id: 'M-8821', name: 'Quick Mart Sandton' },
    details: 'KYC verification completed and merchant account approved',
    ipAddress: '41.xxx.xxx.xxx',
    userAgent: 'Chrome/122.0 Windows'
  },
  {
    id: 'AL-002',
    timestamp: '2025-03-10T15:20:00',
    action: 'Transaction Refunded',
    category: 'transaction',
    actor: { name: 'John D.', email: 'john@groway.co.za', role: 'Support Agent' },
    target: { type: 'Transaction', id: 'TXN-998877', name: 'R2,500 QR Payment' },
    details: 'Full refund processed - customer complaint resolved',
    ipAddress: '105.xxx.xxx.xxx',
    userAgent: 'Firefox/123.0 MacOS'
  },
  {
    id: 'AL-003',
    timestamp: '2025-03-10T15:05:00',
    action: 'Fraud Alert Resolved',
    category: 'compliance',
    actor: { name: 'John D.', email: 'john@groway.co.za', role: 'Support Agent' },
    target: { type: 'Alert', id: 'FA-002', name: 'Geolocation Anomaly' },
    details: 'Verified with merchant - legitimate travel transaction',
    ipAddress: '105.xxx.xxx.xxx',
    userAgent: 'Firefox/123.0 MacOS'
  },
  {
    id: 'AL-004',
    timestamp: '2025-03-10T14:45:00',
    action: 'User Login',
    category: 'user',
    actor: { name: 'Thabo K.', email: 'thabo@groway.co.za', role: 'Admin' },
    target: { type: 'Session', id: 'SES-1234', name: 'Admin Console' },
    details: 'Successful MFA authentication',
    ipAddress: '169.xxx.xxx.xxx',
    userAgent: 'Safari/17.3 iPhone'
  },
  {
    id: 'AL-005',
    timestamp: '2025-03-10T14:30:00',
    action: 'System Configuration Changed',
    category: 'system',
    actor: { name: 'System Admin', email: 'admin@groway.co.za', role: 'Super Admin' },
    target: { type: 'Setting', id: 'CFG-RATE-LIMIT', name: 'Rate Limiting Rules' },
    details: 'Updated velocity check threshold from 5 to 7 transactions per 10 minutes',
    ipAddress: '10.0.0.1',
    userAgent: 'Internal Service'
  },
  {
    id: 'AL-006',
    timestamp: '2025-03-10T14:15:00',
    action: 'KYC Document Verified',
    category: 'compliance',
    actor: { name: 'Thabo K.', email: 'thabo@groway.co.za', role: 'Admin' },
    target: { type: 'Document', id: 'DOC-5678', name: 'ID Document' },
    details: 'ID document verified for Merchant M-3344',
    ipAddress: '169.xxx.xxx.xxx',
    userAgent: 'Safari/17.3 iPhone'
  },
  {
    id: 'AL-007',
    timestamp: '2025-03-10T13:50:00',
    action: 'Merchant Suspended',
    category: 'merchant',
    actor: { name: 'John D.', email: 'john@groway.co.za', role: 'Support Agent' },
    target: { type: 'Merchant', id: 'M-4521', name: 'Suspicious Trading Co' },
    details: 'Account suspended pending AML investigation',
    ipAddress: '105.xxx.xxx.xxx',
    userAgent: 'Firefox/123.0 MacOS'
  },
  {
    id: 'AL-008',
    timestamp: '2025-03-10T13:30:00',
    action: 'POPIA Request Completed',
    category: 'compliance',
    actor: { name: 'Lisa N.', email: 'lisa@groway.co.za', role: 'Compliance Officer' },
    target: { type: 'Request', id: 'P-003', name: 'Data Access Request' },
    details: 'User data export completed and sent to requester',
    ipAddress: '41.xxx.xxx.xxx',
    userAgent: 'Chrome/122.0 Windows'
  },
]

export default function AuditLogView() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('today')

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'merchant': return <Building2 className="h-4 w-4" />
      case 'transaction': return <CreditCard className="h-4 w-4" />
      case 'compliance': return <Shield className="h-4 w-4" />
      case 'system': return <Settings className="h-4 w-4" />
      case 'user': return <User className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'merchant': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'transaction': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'compliance': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'system': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'user': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Trail</h1>
          <p className="text-gray-400 text-sm">Complete logging of all admin actions with immutable records</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Actions Today', value: '1,247', icon: ScrollText },
          { label: 'Unique Users', value: '23', icon: User },
          { label: 'Merchant Actions', value: '456', icon: Building2 },
          { label: 'Compliance Actions', value: '89', icon: Shield },
        ].map((stat, index) => (
          <Card key={index} className="bg-[#1E293B] border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#00897B]/20 text-[#00897B] flex items-center justify-center">
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="bg-[#1E293B] border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search by action, actor, or target..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#0F172A] border-gray-600 text-white"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-40 bg-[#0F172A] border-gray-600 text-white">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-[#1E293B] border-gray-700 text-white">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="merchant">Merchant</SelectItem>
                <SelectItem value="transaction">Transaction</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-40 bg-[#0F172A] border-gray-600 text-white">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent className="bg-[#1E293B] border-gray-700 text-white">
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Log Table */}
      <Card className="bg-[#1E293B] border-gray-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-700">
                  <th className="text-left p-4">Timestamp</th>
                  <th className="text-left p-4">Action</th>
                  <th className="text-left p-4">Actor</th>
                  <th className="text-left p-4">Target</th>
                  <th className="text-left p-4">Details</th>
                  <th className="text-left p-4">IP Address</th>
                  <th className="text-right p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#0F172A]/50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-white">{new Date(log.timestamp).toLocaleTimeString('en-ZA')}</p>
                          <p className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleDateString('en-ZA')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getCategoryColor(log.category)}`}>
                          {getCategoryIcon(log.category)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{log.action}</p>
                          <p className="text-xs text-gray-400 capitalize">{log.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-sm text-white">{log.actor.name}</p>
                        <p className="text-xs text-gray-400">{log.actor.role}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-sm text-white">{log.target.name}</p>
                        <p className="text-xs text-gray-400">{log.target.type}: {log.target.id}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-gray-300 max-w-xs truncate">{log.details}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-gray-400 font-mono">{log.ipAddress}</p>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-700">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              Showing {filteredLogs.length} of {auditLogs.length} entries
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                Previous
              </Button>
              <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
