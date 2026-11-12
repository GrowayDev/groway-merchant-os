'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import {
  Syringe,
  Calendar,
  Bell,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Trash2,
  Edit,
  Filter,
} from 'lucide-react'

// ============================================
// TYPES
// ============================================

interface VaccinationSchedule {
  id: string
  name: string
  species: string
  disease: string
  firstDoseAge: number
  boosterInterval?: number
  numberOfDoses: number
  route?: string
  dosage?: number
  unit?: string
  description?: string
  reminderDaysBefore: number
  animalCount?: number
}

interface VaccinationRecord {
  id: string
  animalId: string
  animalTag?: string
  scheduleId?: string
  scheduleName?: string
  vaccineName: string
  batchNumber?: string
  expiryDate?: string
  administeredAt: string
  administeredBy?: string
  nextDueDate?: string
  costPerDose?: number
  totalCost?: number
  notes?: string
  status: 'completed' | 'upcoming' | 'overdue'
}

interface VaccinationReminder {
  id: string
  scheduleId: string
  scheduleName: string
  animalId: string
  animalTag: string
  species: string
  dueDate: string
  daysUntilDue: number
  priority: 'high' | 'medium' | 'low'
}

interface VaccinationSchedulerProps {
  farmId: string
}

const chartConfig: ChartConfig = {
  completed: { label: 'Completed', color: '#22c55e' },
  upcoming: { label: 'Upcoming', color: '#3b82f6' },
  overdue: { label: 'Overdue', color: '#ef4444' },
}

const speciesColors: Record<string, string> = {
  cattle: 'bg-amber-100 text-amber-800',
  pigs: 'bg-pink-100 text-pink-800',
  sheep: 'bg-stone-100 text-stone-800',
  goats: 'bg-orange-100 text-orange-800',
  poultry: 'bg-yellow-100 text-yellow-800',
}

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  low: 'bg-green-100 text-green-800 border-green-200',
}

// ============================================
// MAIN COMPONENT
// ============================================

export function VaccinationScheduler({ farmId }: VaccinationSchedulerProps) {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [schedules, setSchedules] = useState<VaccinationSchedule[]>([])
  const [records, setRecords] = useState<VaccinationRecord[]>([])
  const [reminders, setReminders] = useState<VaccinationReminder[]>([])

  // Dialog states
  const [addScheduleDialogOpen, setAddScheduleDialogOpen] = useState(false)
  const [addRecordDialogOpen, setAddRecordDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Schedule form
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    species: 'cattle',
    disease: '',
    firstDoseAge: '',
    boosterInterval: '',
    numberOfDoses: '1',
    route: 'injection',
    dosage: '',
    unit: 'ml',
    reminderDaysBefore: '7',
    description: '',
  })

  // Record form
  const [recordForm, setRecordForm] = useState({
    animalTag: '',
    scheduleId: '',
    vaccineName: '',
    batchNumber: '',
    expiryDate: '',
    administeredBy: '',
    nextDueDate: '',
    costPerDose: '',
    notes: '',
  })

  // Fetch data
  const fetchData = async () => {
    try {
      const sessionStr = localStorage.getItem('groway_session')
      const session = sessionStr ? JSON.parse(sessionStr) : null
      const merchantId = session?.merchantId || 'test-merchant'

      const [schedulesRes, recordsRes, remindersRes] = await Promise.all([
        fetch(`/api/merchant-os/agriculture/livestock/vaccination/schedules?merchantId=${merchantId}&farmId=${farmId}`),
        fetch(`/api/merchant-os/agriculture/livestock/vaccination/records?merchantId=${merchantId}&farmId=${farmId}`),
        fetch(`/api/merchant-os/agriculture/livestock/vaccination/reminders?merchantId=${merchantId}&farmId=${farmId}`),
      ])

      if (schedulesRes.ok) {
        const data = await schedulesRes.json()
        setSchedules(data.schedules || [])
      }
      if (recordsRes.ok) {
        const data = await recordsRes.json()
        setRecords(data.records || [])
      }
      if (remindersRes.ok) {
        const data = await remindersRes.json()
        setReminders(data.reminders || [])
      }
    } catch (error) {
      console.error('Failed to fetch vaccination data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [farmId])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const handleAddSchedule = async () => {
    setSubmitting(true)
    try {
      const sessionStr = localStorage.getItem('groway_session')
      const session = sessionStr ? JSON.parse(sessionStr) : null
      const merchantId = session?.merchantId || 'test-merchant'

      const response = await fetch(`/api/merchant-os/agriculture/livestock/vaccination/schedules?merchantId=${merchantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmId,
          ...scheduleForm,
          firstDoseAge: parseInt(scheduleForm.firstDoseAge),
          boosterInterval: scheduleForm.boosterInterval ? parseInt(scheduleForm.boosterInterval) : null,
          numberOfDoses: parseInt(scheduleForm.numberOfDoses),
          dosage: scheduleForm.dosage ? parseFloat(scheduleForm.dosage) : null,
          reminderDaysBefore: parseInt(scheduleForm.reminderDaysBefore),
        }),
      })

      if (response.ok) {
        setAddScheduleDialogOpen(false)
        setScheduleForm({
          name: '',
          species: 'cattle',
          disease: '',
          firstDoseAge: '',
          boosterInterval: '',
          numberOfDoses: '1',
          route: 'injection',
          dosage: '',
          unit: 'ml',
          reminderDaysBefore: '7',
          description: '',
        })
        fetchData()
      }
    } catch (error) {
      console.error('Failed to add schedule:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddRecord = async () => {
    setSubmitting(true)
    try {
      const sessionStr = localStorage.getItem('groway_session')
      const session = sessionStr ? JSON.parse(sessionStr) : null
      const merchantId = session?.merchantId || 'test-merchant'

      const response = await fetch(`/api/merchant-os/agriculture/livestock/vaccination/records?merchantId=${merchantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmId,
          ...recordForm,
          expiryDate: recordForm.expiryDate || null,
          nextDueDate: recordForm.nextDueDate || null,
          costPerDose: recordForm.costPerDose ? parseFloat(recordForm.costPerDose) : null,
        }),
      })

      if (response.ok) {
        setAddRecordDialogOpen(false)
        setRecordForm({
          animalTag: '',
          scheduleId: '',
          vaccineName: '',
          batchNumber: '',
          expiryDate: '',
          administeredBy: '',
          nextDueDate: '',
          costPerDose: '',
          notes: '',
        })
        fetchData()
      }
    } catch (error) {
      console.error('Failed to add record:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Stats
  const stats = {
    totalSchedules: schedules.length,
    completedThisMonth: records.filter(r => {
      const date = new Date(r.administeredAt)
      const now = new Date()
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    }).length,
    upcomingReminders: reminders.filter(r => r.daysUntilDue > 0 && r.daysUntilDue <= 7).length,
    overdue: reminders.filter(r => r.daysUntilDue < 0).length,
  }

  // Chart data
  const chartData = [
    { species: 'Cattle', completed: 45, upcoming: 12, overdue: 3 },
    { species: 'Sheep', completed: 30, upcoming: 8, overdue: 2 },
    { species: 'Goats', completed: 20, upcoming: 5, overdue: 1 },
    { species: 'Pigs', completed: 55, upcoming: 15, overdue: 4 },
    { species: 'Poultry', completed: 200, upcoming: 50, overdue: 10 },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Syringe className="w-5 h-5" />
            Vaccination Scheduler
          </h2>
          <p className="text-sm text-gray-500">Manage vaccination schedules and reminders</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={() => setAddRecordDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Record Vaccination
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAddScheduleDialogOpen(true)}>
            <Calendar className="w-4 h-4 mr-2" />
            New Schedule
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Active Schedules</p>
                <p className="text-xl font-bold">{stats.totalSchedules}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">This Month</p>
                <p className="text-xl font-bold">{stats.completedThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Due This Week</p>
                <p className="text-xl font-bold text-amber-600">{stats.upcomingReminders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Overdue</p>
                <p className="text-xl font-bold text-red-600">{stats.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reminders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reminders">
            Reminders
            {stats.upcomingReminders + stats.overdue > 0 && (
              <Badge className="ml-2 bg-red-500">{stats.upcomingReminders + stats.overdue}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Reminders Tab */}
        <TabsContent value="reminders">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Upcoming Vaccinations
              </CardTitle>
              <CardDescription>Animals due for vaccination</CardDescription>
            </CardHeader>
            <CardContent>
              {reminders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No upcoming vaccinations</p>
                  <p className="text-sm">All animals are up to date</p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {reminders
                      .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
                      .map((reminder) => (
                        <div
                          key={reminder.id}
                          className={`flex items-center gap-4 p-4 rounded-lg border ${
                            reminder.daysUntilDue < 0
                              ? 'bg-red-50 border-red-200'
                              : reminder.daysUntilDue <= 7
                              ? 'bg-amber-50 border-amber-200'
                              : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{reminder.animalTag}</p>
                              <Badge className={speciesColors[reminder.species] || 'bg-gray-100'}>
                                {reminder.species}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500">{reminder.scheduleName}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={priorityColors[reminder.priority]}>
                              {reminder.daysUntilDue < 0
                                ? `${Math.abs(reminder.daysUntilDue)}d overdue`
                                : reminder.daysUntilDue === 0
                                ? 'Due today'
                                : `Due in ${reminder.daysUntilDue}d`}
                            </Badge>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(reminder.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            <Syringe className="w-4 h-4 mr-1" />
                            Administer
                          </Button>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vaccination Schedules</CardTitle>
              <CardDescription>Configure vaccination programs by species</CardDescription>
            </CardHeader>
            <CardContent>
              {schedules.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No vaccination schedules</p>
                  <p className="text-sm">Create a schedule to start tracking vaccinations</p>
                  <Button className="mt-4" onClick={() => setAddScheduleDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Schedule
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {schedules.map((schedule) => (
                      <div key={schedule.id} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{schedule.name}</p>
                            <Badge className={speciesColors[schedule.species] || 'bg-gray-100'}>
                              {schedule.species}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">{schedule.disease}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span>First dose: {schedule.firstDoseAge} days</span>
                            {schedule.boosterInterval && <span>Booster: every {schedule.boosterInterval} days</span>}
                            <span>{schedule.numberOfDoses} dose(s)</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{schedule.animalCount || 0} animals</p>
                          <p className="text-xs text-gray-400">Reminder: {schedule.reminderDaysBefore}d before</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Records Tab */}
        <TabsContent value="records">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vaccination Records</CardTitle>
              <CardDescription>History of administered vaccinations</CardDescription>
            </CardHeader>
            <CardContent>
              {records.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Syringe className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No vaccination records</p>
                  <p className="text-sm">Record vaccinations to track animal health</p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {records.map((record) => (
                      <div key={record.id} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{record.animalTag || record.animalId}</p>
                            <Badge variant="outline">{record.vaccineName}</Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            {record.scheduleName || 'Ad-hoc vaccination'}
                            {record.batchNumber && ` - Batch: ${record.batchNumber}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {new Date(record.administeredAt).toLocaleDateString()}
                          </p>
                          {record.nextDueDate && (
                            <p className="text-xs text-gray-400">
                              Next: {new Date(record.nextDueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        {record.totalCost && (
                          <Badge variant="outline">R{record.totalCost.toFixed(2)}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Vaccination Status by Species</CardTitle>
                <CardDescription>Completion rates across species</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="species" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="completed" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="upcoming" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="overdue" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span>Upcoming</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>Overdue</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Monthly Vaccinations</CardTitle>
                <CardDescription>Vaccinations administered per month</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { month: 'Jan', count: 45 },
                        { month: 'Feb', count: 52 },
                        { month: 'Mar', count: 38 },
                        { month: 'Apr', count: 65 },
                        { month: 'May', count: 48 },
                        { month: 'Jun', count: 72 },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="#8B4513" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Schedule Dialog */}
      <Dialog open={addScheduleDialogOpen} onOpenChange={setAddScheduleDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Vaccination Schedule</DialogTitle>
            <DialogDescription>Set up a vaccination program for your animals</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Schedule Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Annual Vaccination"
                  value={scheduleForm.name}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="species">Species</Label>
                <Select
                  value={scheduleForm.species}
                  onValueChange={(value) => setScheduleForm({ ...scheduleForm, species: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cattle">Cattle</SelectItem>
                    <SelectItem value="pigs">Pigs</SelectItem>
                    <SelectItem value="sheep">Sheep</SelectItem>
                    <SelectItem value="goats">Goats</SelectItem>
                    <SelectItem value="poultry">Poultry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="disease">Target Disease</Label>
              <Input
                id="disease"
                placeholder="e.g., Foot and Mouth Disease"
                value={scheduleForm.disease}
                onChange={(e) => setScheduleForm({ ...scheduleForm, disease: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstDoseAge">First Dose (days)</Label>
                <Input
                  id="firstDoseAge"
                  type="number"
                  placeholder="e.g., 60"
                  value={scheduleForm.firstDoseAge}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, firstDoseAge: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="boosterInterval">Booster (days)</Label>
                <Input
                  id="boosterInterval"
                  type="number"
                  placeholder="Optional"
                  value={scheduleForm.boosterInterval}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, boosterInterval: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numberOfDoses">Number of Doses</Label>
                <Input
                  id="numberOfDoses"
                  type="number"
                  min="1"
                  value={scheduleForm.numberOfDoses}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, numberOfDoses: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="route">Route</Label>
                <Select
                  value={scheduleForm.route}
                  onValueChange={(value) => setScheduleForm({ ...scheduleForm, route: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="injection">Injection</SelectItem>
                    <SelectItem value="oral">Oral</SelectItem>
                    <SelectItem value="nasal">Nasal</SelectItem>
                    <SelectItem value="topical">Topical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dosage">Dosage</Label>
                <Input
                  id="dosage"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 2"
                  value={scheduleForm.dosage}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, dosage: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select
                  value={scheduleForm.unit}
                  onValueChange={(value) => setScheduleForm({ ...scheduleForm, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="mg">mg</SelectItem>
                    <SelectItem value="units">units</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminderDays">Reminder (days before due)</Label>
              <Input
                id="reminderDays"
                type="number"
                value={scheduleForm.reminderDaysBefore}
                onChange={(e) => setScheduleForm({ ...scheduleForm, reminderDaysBefore: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Additional notes..."
                value={scheduleForm.description}
                onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddSchedule}
              disabled={submitting || !scheduleForm.name || !scheduleForm.disease || !scheduleForm.firstDoseAge}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Schedule'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Record Dialog */}
      <Dialog open={addRecordDialogOpen} onOpenChange={setAddRecordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Vaccination</DialogTitle>
            <DialogDescription>Log a vaccination for an animal</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="animalTag">Animal Tag/ID</Label>
              <Input
                id="animalTag"
                placeholder="e.g., C001"
                value={recordForm.animalTag}
                onChange={(e) => setRecordForm({ ...recordForm, animalTag: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vaccineName">Vaccine Name</Label>
              <Input
                id="vaccineName"
                placeholder="e.g., FMD Vaccine"
                value={recordForm.vaccineName}
                onChange={(e) => setRecordForm({ ...recordForm, vaccineName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batchNumber">Batch Number</Label>
                <Input
                  id="batchNumber"
                  placeholder="Optional"
                  value={recordForm.batchNumber}
                  onChange={(e) => setRecordForm({ ...recordForm, batchNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={recordForm.expiryDate}
                  onChange={(e) => setRecordForm({ ...recordForm, expiryDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="administeredBy">Administered By</Label>
                <Input
                  id="administeredBy"
                  placeholder="e.g., Dr. Smith"
                  value={recordForm.administeredBy}
                  onChange={(e) => setRecordForm({ ...recordForm, administeredBy: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nextDueDate">Next Due Date</Label>
                <Input
                  id="nextDueDate"
                  type="date"
                  value={recordForm.nextDueDate}
                  onChange={(e) => setRecordForm({ ...recordForm, nextDueDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPerDose">Cost per Dose (R)</Label>
              <Input
                id="costPerDose"
                type="number"
                step="0.01"
                placeholder="e.g., 25.00"
                value={recordForm.costPerDose}
                onChange={(e) => setRecordForm({ ...recordForm, costPerDose: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Any additional notes..."
                value={recordForm.notes}
                onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRecordDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddRecord}
              disabled={submitting || !recordForm.animalTag || !recordForm.vaccineName}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                'Record Vaccination'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
