'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Users, Building2, Shield, Mail, Download, Upload, 
  Plus, Search, Filter, RefreshCw, ChevronDown, UserCheck,
  UserX, Clock, TrendingUp, AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { UserManagementDashboard } from '@/components/users/UserManagementDashboard'

// Quick stats for platform admin
interface PlatformStats {
  totalTenants: number
  totalUsers: number
  activeUsers: number
  pendingInvites: number
  tenantBreakdown: {
    merchantOs: number
    gopay: number
    grosell: number
    consumerWallet: number
  }
}

// Mock platform stats
const mockStats: PlatformStats = {
  totalTenants: 4,
  totalUsers: 15847,
  activeUsers: 12351,
  pendingInvites: 234,
  tenantBreakdown: {
    merchantOs: 8234,
    gopay: 3421,
    grosell: 2156,
    consumerWallet: 2036,
  }
}

// Tenant options for selector
const tenantOptions = [
  { id: '', name: 'All Tenants', slug: 'all' },
  { id: 'merchant-os-demo', name: 'Merchant OS (Demo)', slug: 'merchant-os-demo' },
  { id: 'gopay-demo', name: 'GoPay (Demo)', slug: 'gopay-demo' },
  { id: 'grosell-demo', name: 'Grosell (Demo)', slug: 'grosell-demo' },
  { id: 'consumer-wallet-demo', name: 'Consumer Wallet (Demo)', slug: 'consumer-wallet-demo' },
]

export default function UserManagementView() {
  const [selectedTenant, setSelectedTenant] = useState('')
  const [stats, setStats] = useState<PlatformStats>(mockStats)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch platform stats
  const fetchStats = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/platform/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.userStats || mockStats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const handleTenantChange = (tenantId: string) => {
    setSelectedTenant(tenantId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-[#00897B]" />
            User Management
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Platform-wide user administration across all tenants
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Tenant Selector */}
          <Select value={selectedTenant} onValueChange={handleTenantChange}>
            <SelectTrigger className="w-[200px] bg-[#1E293B] border-gray-600 text-white">
              <Building2 className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select Tenant" />
            </SelectTrigger>
            <SelectContent className="bg-[#1E293B] border-gray-600 text-white">
              {tenantOptions.map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchStats}
            disabled={isLoading}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Platform Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[#1E293B] border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-[#00897B]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalTenants}</div>
            <p className="text-xs text-gray-400 mt-1">Active organizations</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1E293B] border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Users</CardTitle>
            <Users className="h-4 w-4 text-[#00897B]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-green-400 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              +12.5% this month
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1E293B] border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.activeUsers.toLocaleString()}</div>
            <div className="mt-2">
              <Progress 
                value={(stats.activeUsers / stats.totalUsers) * 100} 
                className="h-1.5 bg-gray-700"
              />
              <p className="text-xs text-gray-400 mt-1">
                {Math.round((stats.activeUsers / stats.totalUsers) * 100)}% of total
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1E293B] border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Pending Invites</CardTitle>
            <Mail className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.pendingInvites}</div>
            <p className="text-xs text-amber-400 flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3" />
              Awaiting acceptance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tenant Breakdown */}
      <Card className="bg-[#1E293B] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#00897B]" />
            Users by Tenant
          </CardTitle>
          <CardDescription className="text-gray-400">
            Distribution of users across platform tenants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.tenantBreakdown).map(([key, value]) => {
              const tenantInfo: Record<string, { name: string; color: string }> = {
                merchantOs: { name: 'Merchant OS', color: '#4CAF50' },
                gopay: { name: 'GoPay', color: '#00897B' },
                grosell: { name: 'GroSell', color: '#8B5CF6' },
                consumerWallet: { name: 'Consumer Wallet', color: '#FF8F00' },
              }
              const info = tenantInfo[key] || { name: key, color: '#6B7280' }
              const percentage = Math.round((value / stats.totalUsers) * 100)
              
              return (
                <div key={key} className="p-3 rounded-lg bg-[#0F172A] border border-gray-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: info.color }}
                    />
                    <span className="text-sm text-gray-300">{info.name}</span>
                  </div>
                  <div className="text-xl font-bold text-white">{value.toLocaleString()}</div>
                  <div className="mt-2">
                    <Progress value={percentage} className="h-1 bg-gray-700" />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{percentage}% of total</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
          <Download className="h-4 w-4 mr-2" />
          Export All Users
        </Button>
        <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
          <Upload className="h-4 w-4 mr-2" />
          Bulk Import
        </Button>
        <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
          <Mail className="h-4 w-4 mr-2" />
          Send Invites
        </Button>
        <Button size="sm" className="bg-[#00897B] hover:bg-[#00796B]">
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* User Management Dashboard */}
      <Card className="bg-[#1E293B] border-gray-700">
        <CardContent className="p-0">
          <UserManagementDashboard 
            initialTenantId={selectedTenant}
            onTenantChange={handleTenantChange}
          />
        </CardContent>
      </Card>
    </div>
  )
}
