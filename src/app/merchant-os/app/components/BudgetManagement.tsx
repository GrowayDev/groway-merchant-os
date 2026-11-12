'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  Search,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Edit,
  Trash2,
  RefreshCw,
  DollarSign,
  Calendar,
  PieChart,
  BarChart3,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useMerchantData } from '../hooks/useMerchantData'

interface Budget {
  id: string
  name: string
  description?: string
  periodType: 'monthly' | 'quarterly' | 'annual' | 'custom'
  startDate: string
  endDate: string
  accountCode?: string
  accountName?: string
  category?: string
  budgetAmount: number
  spentAmount: number
  remainingAmount: number
  percentage: number
  alertEnabled: boolean
  alertThreshold: number
  status: 'draft' | 'active' | 'closed' | 'cancelled'
  alertTriggered?: boolean
}

interface BudgetSummary {
  totalBudgets: number
  activeBudgets: number
  totalBudgetAmount: number
  totalSpent: number
  totalRemaining: number
  overBudgetCount: number
  alertCount: number
}

interface ChartOfAccount {
  id: string
  code: string
  name: string
  type: string
}

const periodLabels: Record<string, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
  custom: 'Custom',
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  closed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Helper to get date ranges
const getDateRange = (periodType: string): { startDate: string; endDate: string } => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  switch (periodType) {
    case 'monthly':
      return {
        startDate: new Date(year, month, 1).toISOString().slice(0, 10),
        endDate: new Date(year, month + 1, 0).toISOString().slice(0, 10),
      }
    case 'quarterly':
      const quarterStart = Math.floor(month / 3) * 3
      return {
        startDate: new Date(year, quarterStart, 1).toISOString().slice(0, 10),
        endDate: new Date(year, quarterStart + 3, 0).toISOString().slice(0, 10),
      }
    case 'annual':
      return {
        startDate: new Date(year, 0, 1).toISOString().slice(0, 10),
        endDate: new Date(year, 11, 31).toISOString().slice(0, 10),
      }
    default:
      return {
        startDate: now.toISOString().slice(0, 10),
        endDate: now.toISOString().slice(0, 10),
      }
  }
}

export function BudgetManagement() {
  // Get merchant ID from session hook
  const { merchantId } = useMerchantData()
  const { toast } = useToast()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [summary, setSummary] = useState<BudgetSummary | null>(null)
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [periodFilter, setPeriodFilter] = useState<string>('all')

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    periodType: 'monthly' as 'monthly' | 'quarterly' | 'annual' | 'custom',
    startDate: getDateRange('monthly').startDate,
    endDate: getDateRange('monthly').endDate,
    accountCode: '',
    accountName: '',
    category: '',
    budgetAmount: 0,
    alertEnabled: true,
    alertThreshold: 80,
    status: 'draft' as 'draft' | 'active',
    notes: '',
  })

  // Fetch budgets
  const fetchBudgets = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/merchant-os/api/budgets-new?merchantId=${merchantId}`)
      if (!response.ok) throw new Error('Failed to fetch budgets')

      const result = await response.json()
      setBudgets(result.data || [])
      setSummary(result.summary || null)
    } catch (error) {
      console.error('Error fetching budgets:', error)
      toast({
        title: 'Error',
        description: 'Failed to load budgets',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // Fetch chart of accounts for expense accounts
  const fetchAccounts = useCallback(async () => {
    try {
      const response = await fetch(
        `/merchant-os/api/accounting/chart-of-accounts?merchantId=${merchantId}&type=expense`
      )
      if (!response.ok) throw new Error('Failed to fetch accounts')

      const result = await response.json()
      setAccounts(result.data || [])
    } catch (error) {
      console.error('Error fetching accounts:', error)
    }
  }, [])

  useEffect(() => {
    fetchBudgets()
    fetchAccounts()
  }, [fetchBudgets, fetchAccounts])

  // Open create dialog
  const openCreateDialog = () => {
    setIsEditing(false)
    setSelectedBudget(null)
    setFormData({
      name: '',
      description: '',
      periodType: 'monthly',
      startDate: getDateRange('monthly').startDate,
      endDate: getDateRange('monthly').endDate,
      accountCode: '',
      accountName: '',
      category: '',
      budgetAmount: 0,
      alertEnabled: true,
      alertThreshold: 80,
      status: 'draft',
      notes: '',
    })
    setDialogOpen(true)
  }

  // Open edit dialog
  const openEditDialog = (budget: Budget) => {
    setIsEditing(true)
    setSelectedBudget(budget)
    setFormData({
      name: budget.name,
      description: budget.description || '',
      periodType: budget.periodType as any,
      startDate: budget.startDate,
      endDate: budget.endDate,
      accountCode: budget.accountCode || '',
      accountName: budget.accountName || '',
      category: budget.category || '',
      budgetAmount: budget.budgetAmount,
      alertEnabled: budget.alertEnabled,
      alertThreshold: budget.alertThreshold,
      status: budget.status as any,
      notes: '',
    })
    setDialogOpen(true)
  }

  // Handle period type change
  const handlePeriodChange = (periodType: string) => {
    const dates = getDateRange(periodType)
    setFormData((prev) => ({
      ...prev,
      periodType: periodType as any,
      startDate: dates.startDate,
      endDate: dates.endDate,
    }))
  }

  // Handle account selection
  const handleAccountChange = (accountCode: string) => {
    const account = accounts.find((a) => a.code === accountCode)
    setFormData((prev) => ({
      ...prev,
      accountCode,
      accountName: account?.name || '',
    }))
  }

  // Save budget
  const handleSave = async () => {
    if (!formData.name || formData.budgetAmount <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      const url = '/merchant-os/api/budgets-new'
      const method = 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          merchantId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save budget')
      }

      toast({
        title: 'Success',
        description: isEditing ? 'Budget updated successfully' : 'Budget created successfully',
      })

      setDialogOpen(false)
      fetchBudgets()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save budget',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Delete budget
  const handleDelete = async () => {
    if (!selectedBudget) return

    try {
      const response = await fetch(
        `/merchant-os/api/accounting/budgets/${selectedBudget.id}`,
        { method: 'DELETE' }
      )

      if (!response.ok) throw new Error('Failed to delete budget')

      toast({
        title: 'Success',
        description: 'Budget deleted successfully',
      })

      setDeleteDialogOpen(false)
      setSelectedBudget(null)
      fetchBudgets()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete budget',
        variant: 'destructive',
      })
    }
  }

  // Filter budgets
  const filteredBudgets = budgets.filter((budget) => {
    const matchesSearch = budget.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || budget.status === statusFilter
    const matchesPeriod = periodFilter === 'all' || budget.periodType === periodFilter
    return matchesSearch && matchesStatus && matchesPeriod
  })

  // Get progress bar color
  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= 80) return 'bg-amber-500'
    return 'bg-[#00897B]'
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-[#1A1A1A]">Budget Management</h2>
            <p className="text-sm text-[#757575]">
              Create and manage budgets, track spending against targets
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchBudgets} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create Budget
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
            <Input
              placeholder="Search budgets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Periods</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="annual">Annual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="p-3 bg-[#F5F5F5] rounded-lg">
              <p className="text-xs text-[#757575]">Total Budgets</p>
              <p className="text-lg font-bold text-[#1A1A1A]">{summary.totalBudgets}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-[#757575]">Active</p>
              <p className="text-lg font-bold text-green-600">{summary.activeBudgets}</p>
            </div>
            <div className="p-3 bg-[#E0F2F1] rounded-lg">
              <p className="text-xs text-[#757575]">Total Budget</p>
              <p className="text-lg font-bold text-[#00897B]">{formatCurrency(summary.totalBudgetAmount)}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-[#757575]">Total Spent</p>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(summary.totalSpent)}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-xs text-[#757575]">Remaining</p>
              <p className={`text-lg font-bold ${summary.totalRemaining >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                {formatCurrency(summary.totalRemaining)}
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-xs text-[#757575]">Over Budget</p>
              <p className="text-lg font-bold text-red-600">{summary.overBudgetCount}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
              <p className="text-xs text-[#757575]">Alerts</p>
              <p className="text-lg font-bold text-amber-600">{summary.alertCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* Budget List */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="animate-pulse bg-gray-200 h-20 rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredBudgets.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 text-[#757575] mx-auto mb-4" />
                <p className="text-[#757575] mb-4">No budgets found</p>
                <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Budget
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredBudgets.map((budget) => (
                <Card key={budget.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-[#1A1A1A]">{budget.name}</h3>
                          <Badge className={statusColors[budget.status]}>
                            {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
                          </Badge>
                          {budget.alertTriggered && (
                            <Badge className="bg-red-100 text-red-700">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Alert
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-[#757575]">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {periodLabels[budget.periodType]}
                          </span>
                          <span>
                            {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
                          </span>
                          {budget.accountName && (
                            <span className="flex items-center gap-1">
                              <PieChart className="h-3 w-3" />
                              {budget.accountName}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(budget)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => {
                            setSelectedBudget(budget)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[#757575]">Budget Utilization</span>
                        <span className="font-medium">{budget.percentage.toFixed(1)}%</span>
                      </div>
                      <Progress
                        value={Math.min(budget.percentage, 100)}
                        className="h-3"
                      />
                    </div>

                    {/* Amount Details */}
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="p-2 bg-[#F5F5F5] rounded">
                        <p className="text-[#757575] text-xs">Budget</p>
                        <p className="font-semibold text-[#1A1A1A]">{formatCurrency(budget.budgetAmount)}</p>
                      </div>
                      <div className="p-2 bg-blue-50 rounded">
                        <p className="text-[#757575] text-xs">Spent</p>
                        <p className="font-semibold text-blue-600">{formatCurrency(budget.spentAmount)}</p>
                      </div>
                      <div className={`p-2 rounded ${budget.remainingAmount >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                        <p className="text-[#757575] text-xs">Remaining</p>
                        <p className={`font-semibold ${budget.remainingAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(budget.remainingAmount)}
                        </p>
                      </div>
                      <div className="p-2 bg-purple-50 rounded">
                        <p className="text-[#757575] text-xs">Variance</p>
                        <p className={`font-semibold flex items-center gap-1 ${budget.remainingAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {budget.remainingAmount >= 0 ? (
                            <ArrowDownRight className="h-3 w-3" />
                          ) : (
                            <ArrowUpRight className="h-3 w-3" />
                          )}
                          {formatCurrency(Math.abs(budget.remainingAmount))}
                        </p>
                      </div>
                    </div>

                    {/* Alert Info */}
                    {budget.alertEnabled && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-[#757575]">
                        <AlertTriangle className="h-3 w-3" />
                        Alert at {budget.alertThreshold}% spent
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Create/Edit Budget Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Budget' : 'Create New Budget'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update budget details and settings'
                : 'Set up a new budget to track spending against your targets'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Budget Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Marketing Budget Q1 2026"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description..."
                  rows={2}
                />
              </div>
            </div>

            {/* Period Configuration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Period Type</Label>
                <Select value={formData.periodType} onValueChange={handlePeriodChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            {/* Account Linking */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Link to Expense Account</Label>
                <Select value={formData.accountCode} onValueChange={handleAccountChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select expense account..." />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.code}>
                        {account.code} - {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category (Optional)</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Marketing, Operations"
                />
              </div>
              <div>
                <Label>Budget Amount (R) *</Label>
                <Input
                  type="number"
                  value={formData.budgetAmount || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, budgetAmount: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Alert Configuration */}
            <div className="p-4 bg-[#F5F5F5] rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <Label htmlFor="alertEnabled" className="font-medium">
                  Enable Budget Alerts
                </Label>
                <Switch
                  id="alertEnabled"
                  checked={formData.alertEnabled}
                  onCheckedChange={(v) => setFormData({ ...formData, alertEnabled: v })}
                />
              </div>
              {formData.alertEnabled && (
                <div className="flex items-center gap-4">
                  <Label className="text-sm text-[#757575]">Alert when spent reaches</Label>
                  <Input
                    type="number"
                    value={formData.alertThreshold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        alertThreshold: parseInt(e.target.value) || 80,
                      })
                    }
                    className="w-20"
                    min={0}
                    max={100}
                  />
                  <span className="text-sm text-[#757575]">%</span>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#00897B] hover:bg-[#00695C]"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Update Budget' : 'Create Budget'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Budget</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedBudget?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
