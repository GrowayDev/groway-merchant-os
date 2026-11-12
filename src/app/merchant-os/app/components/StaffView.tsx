'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  Plus,
  User,
  Users,
  Clock,
  Calendar,
  Coins,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  Mail,
  Phone,
  Shield,
  Briefcase,
  UserCheck,
  UserX,
  Timer,
  Coffee,
  LogIn,
  LogOut,
  FileText,
  Download,
  Filter,
  MoreVertical,
  Eye,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  AlertCircle,
  Award,
  Ban,
} from 'lucide-react'

// Types
interface Employee {
  id: string
  name: string
  phone: string
  email: string
  role: string
  department: string
  status: 'active' | 'on_leave' | 'inactive'
  clockedIn: boolean
  clockInTime?: string
  weeklyHours: number
  targetHours: number
  hourlyRate: number
  startDate: string
  permissions: string[]
  avatar?: string
}

interface Shift {
  id: string
  employeeId: string
  employeeName: string
  date: string
  startTime: string
  endTime: string
  status: 'scheduled' | 'completed' | 'absent' | 'late'
  actualStart?: string
  actualEnd?: string
}

interface TimeEntry {
  id: string
  employeeId: string
  employeeName: string
  date: string
  clockIn: string
  clockOut?: string
  hours: number
  status: 'complete' | 'in_progress' | 'break'
}

interface LeaveRequest {
  id: string
  employeeId: string
  employeeName: string
  type: 'annual' | 'sick' | 'family' | 'unpaid'
  startDate: string
  endDate: string
  days: number
  status: 'pending' | 'approved' | 'rejected'
  reason: string
}

// Roles configuration
const roles = [
  { id: 'manager', name: 'Manager', color: 'bg-purple-100 text-purple-700', permissions: ['all'] },
  { id: 'supervisor', name: 'Supervisor', color: 'bg-blue-100 text-blue-700', permissions: ['pos', 'inventory', 'reports'] },
  { id: 'cashier', name: 'Cashier', color: 'bg-green-100 text-green-700', permissions: ['pos', 'customers'] },
  { id: 'chef', name: 'Chef/Kitchen', color: 'bg-orange-100 text-orange-700', permissions: ['kitchen', 'inventory'] },
  { id: 'waiter', name: 'Waiter', color: 'bg-cyan-100 text-cyan-700', permissions: ['pos', 'customers'] },
  { id: 'stock_clerk', name: 'Stock Clerk', color: 'bg-gray-100 text-gray-700', permissions: ['inventory'] },
]

// Generate mock employees
const generateEmployees = (): Employee[] => [
  { id: 'EMP-001', name: 'Sipho Ndaba', phone: '+27 82 111 2222', email: 'sipho.n@groway.co.za', role: 'manager', department: 'Operations', status: 'active', clockedIn: true, clockInTime: '08:00', weeklyHours: 42, targetHours: 45, hourlyRate: 85, startDate: '2024-01-15', permissions: ['all'] },
  { id: 'EMP-002', name: 'Thandi Zwane', phone: '+27 83 222 3333', email: 'thandi.z@groway.co.za', role: 'supervisor', department: 'Front of House', status: 'active', clockedIn: true, clockInTime: '09:30', weeklyHours: 38, targetHours: 40, hourlyRate: 65, startDate: '2024-03-20', permissions: ['pos', 'inventory', 'reports'] },
  { id: 'EMP-003', name: 'Johan Botha', phone: '+27 84 333 4444', email: 'johan.b@groway.co.za', role: 'chef', department: 'Kitchen', status: 'active', clockedIn: true, clockInTime: '07:00', weeklyHours: 45, targetHours: 45, hourlyRate: 75, startDate: '2024-02-01', permissions: ['kitchen', 'inventory'] },
  { id: 'EMP-004', name: 'Precious Mokoena', phone: '+27 85 444 5555', email: 'precious.m@groway.co.za', role: 'cashier', department: 'Front of House', status: 'active', clockedIn: false, weeklyHours: 32, targetHours: 40, hourlyRate: 45, startDate: '2024-06-10', permissions: ['pos', 'customers'] },
  { id: 'EMP-005', name: 'David Khumalo', phone: '+27 86 555 6666', email: 'david.k@groway.co.za', role: 'waiter', department: 'Front of House', status: 'on_leave', clockedIn: false, weeklyHours: 28, targetHours: 35, hourlyRate: 42, startDate: '2024-05-15', permissions: ['pos', 'customers'] },
  { id: 'EMP-006', name: 'Nomsa Dlamini', phone: '+27 87 666 7777', email: 'nomsa.d@groway.co.za', role: 'stock_clerk', department: 'Operations', status: 'active', clockedIn: false, weeklyHours: 35, targetHours: 40, hourlyRate: 40, startDate: '2024-07-01', permissions: ['inventory'] },
  { id: 'EMP-007', name: 'Michael Peters', phone: '+27 88 777 8888', email: 'michael.p@groway.co.za', role: 'chef', department: 'Kitchen', status: 'active', clockedIn: true, clockInTime: '10:00', weeklyHours: 40, targetHours: 45, hourlyRate: 70, startDate: '2024-04-01', permissions: ['kitchen', 'inventory'] },
  { id: 'EMP-008', name: 'Grace Nkosi', phone: '+27 89 888 9999', email: 'grace.n@groway.co.za', role: 'cashier', department: 'Front of House', status: 'active', clockedIn: true, clockInTime: '14:00', weeklyHours: 25, targetHours: 30, hourlyRate: 45, startDate: '2024-08-15', permissions: ['pos', 'customers'] },
]

const generateShifts = (): Shift[] => [
  { id: 'SH-001', employeeId: 'EMP-001', employeeName: 'Sipho Ndaba', date: '2026-02-15', startTime: '08:00', endTime: '17:00', status: 'completed', actualStart: '08:02', actualEnd: '17:15' },
  { id: 'SH-002', employeeId: 'EMP-002', employeeName: 'Thandi Zwane', date: '2026-02-15', startTime: '09:00', endTime: '18:00', status: 'completed', actualStart: '09:15', actualEnd: '18:00' },
  { id: 'SH-003', employeeId: 'EMP-003', employeeName: 'Johan Botha', date: '2026-02-15', startTime: '07:00', endTime: '16:00', status: 'completed', actualStart: '06:55', actualEnd: '16:30' },
  { id: 'SH-004', employeeId: 'EMP-004', employeeName: 'Precious Mokoena', date: '2026-02-15', startTime: '14:00', endTime: '22:00', status: 'in_progress', actualStart: '14:00' },
  { id: 'SH-005', employeeId: 'EMP-006', employeeName: 'Nomsa Dlamini', date: '2026-02-15', startTime: '08:00', endTime: '14:00', status: 'scheduled' },
  { id: 'SH-006', employeeId: 'EMP-007', employeeName: 'Michael Peters', date: '2026-02-15', startTime: '10:00', endTime: '19:00', status: 'in_progress', actualStart: '10:00' },
  { id: 'SH-007', employeeId: 'EMP-008', employeeName: 'Grace Nkosi', date: '2026-02-15', startTime: '14:00', endTime: '22:00', status: 'in_progress', actualStart: '14:05' },
]

const generateLeaveRequests = (): LeaveRequest[] => [
  { id: 'LV-001', employeeId: 'EMP-005', employeeName: 'David Khumalo', type: 'annual', startDate: '2026-02-14', endDate: '2026-02-21', days: 5, status: 'approved', reason: 'Family vacation' },
  { id: 'LV-002', employeeId: 'EMP-002', employeeName: 'Thandi Zwane', type: 'sick', startDate: '2026-02-20', endDate: '2026-02-21', days: 2, status: 'pending', reason: 'Doctor appointment' },
  { id: 'LV-003', employeeId: 'EMP-004', employeeName: 'Precious Mokoena', type: 'family', startDate: '2026-02-28', endDate: '2026-02-28', days: 1, status: 'pending', reason: 'Child school event' },
]

// Component
export function StaffView() {
  const [employees, setEmployees] = useState<Employee[]>(generateEmployees)
  const [shifts] = useState<Shift[]>(generateShifts)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(generateLeaveRequests)
  
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false)
  const [clockInOpen, setClockInOpen] = useState(false)
  const [newEmployee, setNewEmployee] = useState({ name: '', phone: '', email: '', role: 'cashier', hourlyRate: 45 })

  // Computed stats
  const totalEmployees = employees.length
  const activeEmployees = employees.filter(e => e.status === 'active').length
  const currentlyClockedIn = employees.filter(e => e.clockedIn).length
  const onLeave = employees.filter(e => e.status === 'on_leave').length
  const weeklyPayroll = employees.reduce((s, e) => s + (e.hourlyRate * e.weeklyHours), 0)

  // Get role info
  const getRoleInfo = (roleId: string) => roles.find(r => r.id === roleId) || roles[roles.length - 1]

  // Get initials
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase()

  // Filtered employees
  const filteredEmployees = useMemo(() => employees.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || e.role === roleFilter
    return matchesSearch && matchesRole
  }), [employees, searchQuery, roleFilter])

  // Clock in/out handler
  const handleClockToggle = (employee: Employee) => {
    setEmployees(prev => prev.map(e => {
      if (e.id === employee.id) {
        return {
          ...e,
          clockedIn: !e.clockedIn,
          clockInTime: !e.clockedIn ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
        }
      }
      return e
    }))
  }

  // Approve leave
  const handleLeaveAction = (leaveId: string, action: 'approve' | 'reject') => {
    setLeaveRequests(prev => prev.map(l => 
      l.id === leaveId ? { ...l, status: action === 'approve' ? 'approved' : 'rejected' } : l
    ))
  }

  // Format currency
  const formatCurrency = (amount: number) => `R${amount.toLocaleString()}`

  // Render Overview
  const renderOverview = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-[#00897B]">
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Total Staff</p>
            <p className="text-2xl font-bold">{totalEmployees}</p>
            <p className="text-xs text-[#757575]">{activeEmployees} active</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Clocked In</p>
            <p className="text-2xl font-bold text-green-600">{currentlyClockedIn}</p>
            <p className="text-xs text-green-600">Currently working</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">On Leave</p>
            <p className="text-2xl font-bold text-orange-600">{onLeave}</p>
            <p className="text-xs text-orange-600">Absent today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Weekly Payroll</p>
            <p className="text-2xl font-bold">{formatCurrency(weeklyPayroll)}</p>
            <p className="text-xs text-[#757575]">Estimated</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Avg Hours/Week</p>
            <p className="text-2xl font-bold">{Math.round(employees.reduce((s, e) => s + e.weeklyHours, 0) / totalEmployees)}h</p>
            <p className="text-xs text-[#757575]">Per employee</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setAddEmployeeOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />Add Employee
        </Button>
        <Button variant="outline" onClick={() => setClockInOpen(true)}>
          <LogIn className="h-4 w-4 mr-2" />Clock In/Out
        </Button>
        <Button variant="outline">
          <Calendar className="h-4 w-4 mr-2" />Schedule Shifts
        </Button>
        <Button variant="outline">
          <FileText className="h-4 w-4 mr-2" />Payslips
        </Button>
      </div>

      {/* Currently Working & Pending Leave */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Timer className="h-4 w-4 text-green-500" />
              Currently Working
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {employees.filter(e => e.clockedIn).map(employee => {
              const roleInfo = getRoleInfo(employee.role)
              return (
                <div key={employee.id} className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-green-200 text-green-700 text-sm">
                        {getInitials(employee.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{employee.name}</p>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] ${roleInfo.color}`}>{roleInfo.name}</Badge>
                      <span className="text-xs text-[#757575]">Since {employee.clockInTime}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleClockToggle(employee)}>
                    <LogOut className="h-3 w-3 mr-1" />Out
                  </Button>
                </div>
              )
            })}
            {currentlyClockedIn === 0 && (
              <p className="text-sm text-[#757575] text-center py-4">No one is currently clocked in</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              Pending Leave Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {leaveRequests.filter(l => l.status === 'pending').map(leave => (
              <div key={leave.id} className="flex items-center gap-3 p-2 bg-orange-50 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-orange-200 text-orange-700 text-sm">
                    {getInitials(leave.employeeName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{leave.employeeName}</p>
                  <p className="text-xs text-[#757575]">{leave.type} leave • {leave.days} day(s)</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleLeaveAction(leave.id, 'approve')}>
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleLeaveAction(leave.id, 'reject')}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {leaveRequests.filter(l => l.status === 'pending').length === 0 && (
              <p className="text-sm text-[#757575] text-center py-4">No pending requests</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Role Distribution & Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Staff by Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {roles.map(role => {
                const count = employees.filter(e => e.role === role.id).length
                if (count === 0) return null
                return (
                  <div key={role.id} className="flex items-center gap-3">
                    <Badge className={role.color}>{role.name}</Badge>
                    <div className="flex-1">
                      <Progress value={(count / totalEmployees) * 100} className="h-2" />
                    </div>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Hours This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {employees.slice(0, 5).map(emp => (
                <div key={emp.id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                      {getInitials(emp.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="truncate">{emp.name}</span>
                      <span className={emp.weeklyHours >= emp.targetHours ? 'text-green-600' : emp.weeklyHours >= emp.targetHours * 0.75 ? 'text-orange-600' : 'text-red-600'}>
                        {emp.weeklyHours}h / {emp.targetHours}h
                      </span>
                    </div>
                    <Progress value={(emp.weeklyHours / emp.targetHours) * 100} className="h-1.5 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Render Employees List
  const renderEmployees = () => (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
          <Input placeholder="Search employees..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setAddEmployeeOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />Add Employee
        </Button>
      </div>

      {/* Employee List */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filteredEmployees.map(employee => {
            const roleInfo = getRoleInfo(employee.role)
            return (
              <Card key={employee.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => setSelectedEmployee(employee)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-[#E0F2F1] text-[#00897B]">
                          {getInitials(employee.name)}
                        </AvatarFallback>
                      </Avatar>
                      {employee.clockedIn && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                          <Timer className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{employee.name}</h4>
                        {employee.status === 'on_leave' && <Badge className="bg-orange-100 text-orange-700">On Leave</Badge>}
                        {employee.status === 'inactive' && <Badge className="bg-red-100 text-red-700">Inactive</Badge>}
                      </div>
                      <Badge className={`text-[10px] mt-1 ${roleInfo.color}`}>{roleInfo.name}</Badge>
                      <div className="flex items-center gap-3 mt-2 text-xs text-[#757575]">
                        <span>{employee.department}</span>
                        <span>{formatCurrency(employee.hourlyRate)}/hr</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{employee.weeklyHours}h</p>
                      <p className="text-xs text-[#757575]">this week</p>
                      <Button 
                        size="sm" 
                        variant={employee.clockedIn ? 'outline' : 'default'}
                        className={`mt-2 ${!employee.clockedIn ? 'bg-green-600 hover:bg-green-700' : ''}`}
                        onClick={(e) => { e.stopPropagation(); handleClockToggle(employee); }}
                      >
                        {employee.clockedIn ? <><LogOut className="h-3 w-3 mr-1" />Out</> : <><LogIn className="h-3 w-3 mr-1" />In</>}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )

  // Render Schedule
  const renderSchedule = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="font-bold">Shift Schedule</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm font-medium">Feb 15 - Feb 21, 2026</span>
            <Button variant="outline" size="icon"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
        <Button className="bg-[#00897B] hover:bg-[#00695C]">
          <Plus className="h-4 w-4 mr-2" />Add Shift
        </Button>
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Today's Shifts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {shifts.map(shift => {
              const statusColors = {
                completed: 'bg-green-100 text-green-700',
                in_progress: 'bg-blue-100 text-blue-700',
                scheduled: 'bg-gray-100 text-gray-600',
                absent: 'bg-red-100 text-red-700',
                late: 'bg-orange-100 text-orange-700',
              }
              return (
                <div key={shift.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-[#E0F2F1] text-[#00897B] text-sm">
                      {getInitials(shift.employeeName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{shift.employeeName}</p>
                    <p className="text-xs text-[#757575]">{shift.startTime} - {shift.endTime}</p>
                  </div>
                  <div className="text-right">
                    {shift.actualStart && (
                      <p className="text-xs text-[#757575]">Actual: {shift.actualStart}{shift.actualEnd && ` - ${shift.actualEnd}`}</p>
                    )}
                  </div>
                  <Badge className={statusColors[shift.status]}>
                    {shift.status.replace('_', ' ')}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Week View */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Week Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="grid grid-cols-8 gap-2 mb-2">
                <div className="p-2 text-xs font-medium text-[#757575]">Employee</div>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="p-2 text-xs font-medium text-center">{day}</div>
                ))}
              </div>
              {employees.filter(e => e.status === 'active').slice(0, 5).map(emp => (
                <div key={emp.id} className="grid grid-cols-8 gap-2 mb-1">
                  <div className="p-2 text-xs truncate">{emp.name}</div>
                  {[0, 1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="p-1">
                      {Math.random() > 0.3 && (
                        <div className="bg-[#E0F2F1] text-[#00897B] text-[10px] p-1 rounded text-center">
                          {`${8 + Math.floor(Math.random() * 4)}:00-${12 + Math.floor(Math.random() * 6)}:00`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Render Leave
  const renderLeave = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-bold">Leave Management</h2>
        <Button className="bg-[#00897B] hover:bg-[#00695C]">
          <Plus className="h-4 w-4 mr-2" />Request Leave
        </Button>
      </div>

      {/* Leave Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-orange-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{leaveRequests.filter(l => l.status === 'pending').length}</p>
            <p className="text-xs text-orange-600">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{leaveRequests.filter(l => l.status === 'approved').length}</p>
            <p className="text-xs text-green-600">Approved</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{leaveRequests.filter(l => l.status === 'rejected').length}</p>
            <p className="text-xs text-red-600">Rejected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{onLeave}</p>
            <p className="text-xs text-[#757575]">On Leave Today</p>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">All Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leaveRequests.map(leave => {
              const typeColors = {
                annual: 'bg-blue-100 text-blue-700',
                sick: 'bg-red-100 text-red-700',
                family: 'bg-purple-100 text-purple-700',
                unpaid: 'bg-gray-100 text-gray-700',
              }
              const statusColors = {
                pending: 'bg-orange-100 text-orange-700',
                approved: 'bg-green-100 text-green-700',
                rejected: 'bg-red-100 text-red-700',
              }
              return (
                <div key={leave.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-[#E0F2F1] text-[#00897B] text-sm">
                      {getInitials(leave.employeeName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{leave.employeeName}</p>
                      <Badge className={typeColors[leave.type]}>{leave.type}</Badge>
                    </div>
                    <p className="text-xs text-[#757575]">{leave.startDate} - {leave.endDate} ({leave.days} days)</p>
                    <p className="text-xs text-[#757575]">{leave.reason}</p>
                  </div>
                  <Badge className={statusColors[leave.status]}>{leave.status}</Badge>
                  {leave.status === 'pending' && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleLeaveAction(leave.id, 'approve')}>
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleLeaveAction(leave.id, 'reject')}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Tabs */}
      <div className="bg-white border-b px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent h-12">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Users className="h-4 w-4 mr-2" />Overview
            </TabsTrigger>
            <TabsTrigger value="employees" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <User className="h-4 w-4 mr-2" />Employees
            </TabsTrigger>
            <TabsTrigger value="schedule" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Calendar className="h-4 w-4 mr-2" />Schedule
            </TabsTrigger>
            <TabsTrigger value="leave" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Coffee className="h-4 w-4 mr-2" />Leave
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'employees' && renderEmployees()}
        {activeTab === 'schedule' && renderSchedule()}
        {activeTab === 'leave' && renderLeave()}
      </ScrollArea>

      {/* Employee Detail Dialog */}
      <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedEmployee && (
            <>
              <DialogHeader>
                <DialogTitle>Employee Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-[#E0F2F1] text-[#00897B] text-xl">
                      {getInitials(selectedEmployee.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">{selectedEmployee.name}</h3>
                    <Badge className={getRoleInfo(selectedEmployee.role).color}>
                      {getRoleInfo(selectedEmployee.role).name}
                    </Badge>
                    <p className="text-sm text-[#757575]">{selectedEmployee.department}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-[#757575]" />{selectedEmployee.phone}</div>
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-[#757575]" />{selectedEmployee.email}</div>
                  <div className="flex items-center gap-2"><Coins className="h-4 w-4 text-[#757575]" />{formatCurrency(selectedEmployee.hourlyRate)}/hr</div>
                  <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-[#757575]" />Since {selectedEmployee.startDate}</div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold">{selectedEmployee.weeklyHours}h</p>
                    <p className="text-xs text-[#757575]">This Week</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold">{selectedEmployee.targetHours}h</p>
                    <p className="text-xs text-[#757575]">Target</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-[#00897B]">{formatCurrency(selectedEmployee.hourlyRate * selectedEmployee.weeklyHours)}</p>
                    <p className="text-xs text-[#757575]">Est. Pay</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-[#757575] mb-1">Permissions</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedEmployee.permissions.map(p => (
                      <Badge key={p} variant="secondary">{p}</Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1" variant={selectedEmployee.clockedIn ? 'outline' : 'default'}
                    onClick={() => handleClockToggle(selectedEmployee)}>
                    {selectedEmployee.clockedIn ? <><LogOut className="h-4 w-4 mr-2" />Clock Out</> : <><LogIn className="h-4 w-4 mr-2" />Clock In</>}
                  </Button>
                  <Button variant="outline" className="flex-1"><Edit className="h-4 w-4 mr-2" />Edit</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Employee Dialog */}
      <Dialog open={addEmployeeOpen} onOpenChange={setAddEmployeeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>Enter employee details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[#757575]">Full Name</label>
              <Input placeholder="Employee name" value={newEmployee.name} onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#757575]">Phone</label>
                <Input placeholder="+27 XX XXX XXXX" value={newEmployee.phone} onChange={e => setNewEmployee({ ...newEmployee, phone: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-[#757575]">Email</label>
                <Input placeholder="email@groway.co.za" value={newEmployee.email} onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#757575]">Role</label>
                <Select value={newEmployee.role} onValueChange={v => setNewEmployee({ ...newEmployee, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-[#757575]">Hourly Rate (R)</label>
                <Input type="number" value={newEmployee.hourlyRate} onChange={e => setNewEmployee({ ...newEmployee, hourlyRate: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddEmployeeOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setAddEmployeeOpen(false)}>Add Employee</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clock In Dialog */}
      <Dialog open={clockInOpen} onOpenChange={setClockInOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Quick Clock In/Out</DialogTitle>
            <DialogDescription>Select employee to clock in or out</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {employees.filter(e => e.status === 'active').map(emp => (
              <div key={emp.id} className="flex items-center gap-3 p-2 border rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-[#E0F2F1] text-[#00897B] text-sm">
                    {getInitials(emp.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{emp.name}</p>
                  <p className="text-xs text-[#757575]">{emp.clockedIn ? `Since ${emp.clockInTime}` : 'Not clocked in'}</p>
                </div>
                <Button 
                  size="sm" 
                  variant={emp.clockedIn ? 'outline' : 'default'}
                  className={!emp.clockedIn ? 'bg-green-600 hover:bg-green-700' : ''}
                  onClick={() => { handleClockToggle(emp); setClockInOpen(false); }}
                >
                  {emp.clockedIn ? 'Out' : 'In'}
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClockInOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
