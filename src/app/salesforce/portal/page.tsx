'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Users,
  DollarSign,
  MapPin,
  TrendingUp,
  CheckCircle2,
  Star,
  Target,
  Calendar,
  Clock,
  Home,
  UserPlus,
  Wallet,
  Award,
  Bell,
  Settings,
  ArrowLeft,
  Eye,
  Plus,
  ChevronRight,
  Phone,
  Building2,
  BarChart3,
  FileText,
  Car,
  CheckCircle,
  XCircle,
  RefreshCw,
  Navigation,
  MapPinned,
  Timer,
} from 'lucide-react'

// Mock agent profile data
const agentProfile = {
  id: 'agent-001',
  name: 'Thabo Molefe',
  email: 'thabo@groway.co.za',
  phone: '0821234567',
  employeeId: 'SF-2024-0156',
  tier: 'senior',
  team: 'Gauteng North',
  teamLead: 'Nomsa Ndlovu',
  status: 'active',
  joinedAt: '2024-03-15',
  stats: {
    totalMerchants: 47,
    activeMerchants: 42,
    monthlyRevenue: 185000,
    totalCommission: 22200,
    pendingCommission: 6500,
    conversionRate: 28,
    visitsThisMonth: 23,
  },
  territory: {
    name: 'Pretoria CBD & Surrounds',
    targetMerchants: 150,
    coveredMerchants: 89,
  },
}

// Mock leads data
const mockLeads = [
  {
    id: 'lead-001',
    businessName: "Sipho's Spaza Shop",
    contactName: 'Sipho Mokoena',
    phone: '0835551234',
    status: 'new',
    source: 'self-generated',
    assignedAt: '2024-12-10',
    address: '123 Church St, Pretoria CBD',
  },
  {
    id: 'lead-002',
    businessName: 'Thandi Beauty Salon',
    contactName: 'Thandi Nkosi',
    phone: '0845555678',
    status: 'contacted',
    source: 'marketing',
    assignedAt: '2024-12-08',
    address: '45 Stanza Bopape St, Sunnyside',
  },
  {
    id: 'lead-003',
    businessName: "Mpho's Auto Repair",
    contactName: 'Mpho Dlamini',
    phone: '0855559012',
    status: 'meeting',
    source: 'referral',
    assignedAt: '2024-12-05',
    address: '78 Steve Biko Rd, Arcadia',
  },
  {
    id: 'lead-004',
    businessName: 'KwaMai Shisa Nyama',
    contactName: 'Mai Ndlovu',
    phone: '0865553456',
    status: 'proposal',
    source: 'self-generated',
    assignedAt: '2024-12-03',
    address: '12 DF Malan Dr, Mamelodi',
  },
]

// Mock visits data
const mockVisits = [
  {
    id: 'v-001',
    businessName: 'KwaMai Shisa Nyama',
    type: 'demo',
    scheduledAt: '2024-12-12 10:00',
    status: 'scheduled',
    address: '12 DF Malan Dr, Mamelodi',
  },
  {
    id: 'v-002',
    businessName: 'Thandi Beauty Salon',
    type: 'follow-up',
    scheduledAt: '2024-12-12 14:00',
    status: 'scheduled',
    address: '45 Stanza Bopape St, Sunnyside',
  },
  {
    id: 'v-003',
    businessName: "Mpho's Auto Repair",
    type: 'closing',
    scheduledAt: '2024-12-13 09:00',
    status: 'scheduled',
    address: '78 Steve Biko Rd, Arcadia',
  },
]

// Mock commission history
const mockCommissions = [
  { id: 'c-001', merchant: 'Cafe Bliss', amount: 1500, status: 'paid', date: '2024-11-30' },
  { id: 'c-002', merchant: 'Tech Hub', amount: 2800, status: 'paid', date: '2024-11-30' },
  { id: 'c-003', merchant: 'Fresh Mart', amount: 1200, status: 'pending', date: '2024-12-05' },
  { id: 'c-004', merchant: 'Style Studio', amount: 2000, status: 'pending', date: '2024-12-08' },
]

// Mock pipeline stages
const pipelineStages = [
  { stage: 'New', count: 8, value: 40000 },
  { stage: 'Contacted', count: 5, value: 25000 },
  { stage: 'Meeting', count: 3, value: 15000 },
  { stage: 'Proposal', count: 2, value: 10000 },
  { stage: 'Closing', count: 1, value: 5000 },
]

// Status colors
const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-purple-100 text-purple-700',
  meeting: 'bg-amber-100 text-amber-700',
  proposal: 'bg-orange-100 text-orange-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
}

export default function SalesforcePortal() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showCheckInDialog, setShowCheckInDialog] = useState(false)
  const [showAddLeadDialog, setShowAddLeadDialog] = useState(false)

  const agent = agentProfile

  return (
    <div className="min-h-screen flex bg-[#FAFAFA]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <Link href="/" className="flex items-center gap-2">
            <img src="/groway-logo.png" alt="Groway" className="h-7 w-auto" />
            <Badge variant="outline" className="text-[9px] border-[#00897B]/30 text-[#00897B]">Sales Portal</Badge>
          </Link>
        </div>

        {/* Agent Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-[#00897B] text-white">TM</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-[#1A1A1A]">{agent.name}</p>
              <div className="flex items-center gap-1">
                <Award className="h-3 w-3 text-[#00897B]" />
                <span className="text-xs text-[#00897B] font-medium capitalize">{agent.tier} Agent</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Home },
            { id: 'leads', label: 'My Leads', icon: UserPlus },
            { id: 'visits', label: 'Visits & Check-ins', icon: MapPin },
            { id: 'pipeline', label: 'Pipeline', icon: Target },
            { id: 'earnings', label: 'Earnings', icon: Wallet },
            { id: 'training', label: 'Training', icon: FileText },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                activeTab === item.id 
                  ? 'bg-[#E0F2F1] text-[#00897B]' 
                  : 'text-[#757575] hover:bg-gray-100'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="p-3 border-t border-gray-200 space-y-2">
          <Button 
            className="w-full bg-[#00897B] hover:bg-[#00695C]"
            onClick={() => setShowCheckInDialog(true)}
          >
            <Navigation className="h-4 w-4 mr-2" />
            Check-In
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setShowAddLeadDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>

        {/* Back Link */}
        <div className="p-3 border-t border-gray-200">
          <Link href="/salesforce" className="flex items-center gap-2 text-sm text-[#757575] hover:text-[#00897B]">
            <ArrowLeft className="h-4 w-4" />
            Back to Careers
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-[#1A1A1A] capitalize">{activeTab.replace('-', ' ')}</h1>
              <p className="text-xs text-[#757575]">{agent.territory.name} • {agent.team}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <ScrollArea className="flex-1">
          {activeTab === 'dashboard' && <DashboardTab agent={agent} />}
          {activeTab === 'leads' && <LeadsTab leads={mockLeads} statusColors={statusColors} />}
          {activeTab === 'visits' && <VisitsTab visits={mockVisits} />}
          {activeTab === 'pipeline' && <PipelineTab stages={pipelineStages} />}
          {activeTab === 'earnings' && <EarningsTab commissions={mockCommissions} agent={agent} />}
          {activeTab === 'training' && <TrainingTab />}
        </ScrollArea>
      </main>

      {/* Check-In Dialog */}
      <Dialog open={showCheckInDialog} onOpenChange={setShowCheckInDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>GPS Check-In</DialogTitle>
            <DialogDescription>Record your visit location</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-[#E0F2F1] rounded-lg text-center">
              <MapPinned className="h-8 w-8 text-[#00897B] mx-auto mb-2" />
              <p className="text-sm font-medium">Location detected</p>
              <p className="text-xs text-[#757575]">Pretoria CBD, Gauteng</p>
            </div>
            <div className="space-y-2">
              <Label>Select Lead/Merchant</Label>
              <select className="w-full p-2 border rounded-lg">
                <option>Sipho's Spaza Shop</option>
                <option>Thandi Beauty Salon</option>
                <option>Mpho's Auto Repair</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Visit Type</Label>
              <select className="w-full p-2 border rounded-lg">
                <option>Demo</option>
                <option>Follow-up</option>
                <option>Closing</option>
                <option>Training</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input placeholder="Visit notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckInDialog(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setShowCheckInDialog(false)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Check-In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Lead Dialog */}
      <Dialog open={showAddLeadDialog} onOpenChange={setShowAddLeadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>Create a new merchant lead</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input placeholder="Enter business name" />
            </div>
            <div className="space-y-2">
              <Label>Contact Name</Label>
              <Input placeholder="Enter contact name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="Phone number" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="Email" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input placeholder="Business address" />
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <select className="w-full p-2 border rounded-lg">
                <option>Self-generated</option>
                <option>Marketing</option>
                <option>Referral</option>
                <option>Walk-in</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddLeadDialog(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setShowAddLeadDialog(false)}>
              Add Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Dashboard Tab
function DashboardTab({ agent }: { agent: typeof agentProfile }) {
  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Total Merchants</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">{agent.stats.totalMerchants}</p>
                <p className="text-xs text-green-600">{agent.stats.activeMerchants} active</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-[#E0F2F1] flex items-center justify-center">
                <Building2 className="h-5 w-5 text-[#00897B]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Monthly Revenue</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">R{agent.stats.monthlyRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600">+18% vs last month</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Commission</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">R{agent.stats.totalCommission.toLocaleString()}</p>
                <p className="text-xs text-amber-600">R{agent.stats.pendingCommission.toLocaleString()} pending</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Conversion Rate</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">{agent.stats.conversionRate}%</p>
                <p className="text-xs text-[#757575]">{agent.stats.visitsThisMonth} visits</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Territory Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-[#1A1A1A]">Territory Coverage</h3>
              <p className="text-sm text-[#757575]">{agent.territory.name}</p>
            </div>
            <Badge variant="outline" className="text-[#00897B]">
              {Math.round(agent.territory.coveredMerchants / agent.territory.targetMerchants * 100)}% Complete
            </Badge>
          </div>
          <Progress value={agent.territory.coveredMerchants / agent.territory.targetMerchants * 100} className="h-3" />
          <div className="flex justify-between text-xs text-[#757575] mt-2">
            <span>{agent.territory.coveredMerchants} visited</span>
            <span>{agent.territory.targetMerchants} target</span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:border-[#00897B] transition-colors">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-[#E0F2F1] flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-[#00897B]" />
            </div>
            <div>
              <p className="font-medium">Add Lead</p>
              <p className="text-xs text-[#757575]">Create new prospect</p>
            </div>
            <ChevronRight className="h-5 w-5 text-[#757575] ml-auto" />
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-[#00897B] transition-colors">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Schedule Visit</p>
              <p className="text-xs text-[#757575]">Plan your day</p>
            </div>
            <ChevronRight className="h-5 w-5 text-[#757575] ml-auto" />
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-[#00897B] transition-colors">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-purple-50 flex items-center justify-center">
              <MapPin className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="font-medium">GPS Check-In</p>
              <p className="text-xs text-[#757575]">Record visit</p>
            </div>
            <ChevronRight className="h-5 w-5 text-[#757575] ml-auto" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Leads Tab
function LeadsTab({ leads, statusColors }: { leads: typeof mockLeads; statusColors: Record<string, string> }) {
  return (
    <div className="p-6 space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <Input placeholder="Search leads..." className="max-w-xs" />
        <div className="flex-1" />
        <Button className="bg-[#00897B] hover:bg-[#00695C]">
          <Plus className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Leads List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {leads.map((lead) => (
              <div key={lead.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                <Avatar>
                  <AvatarFallback className="bg-[#E0F2F1] text-[#00897B]">
                    {lead.businessName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{lead.businessName}</p>
                    <Badge className={`text-[10px] ${statusColors[lead.status]}`}>
                      {lead.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-[#757575]">{lead.contactName}</p>
                  <p className="text-xs text-[#757575]">{lead.address}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#757575]">{lead.phone}</p>
                  <p className="text-xs text-[#757575]">{lead.source}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Visits Tab
function VisitsTab({ visits }: { visits: typeof mockVisits }) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Today's Schedule</h3>
        <Button className="bg-[#00897B] hover:bg-[#00695C]">
          <Navigation className="h-4 w-4 mr-2" />
          Check-In Now
        </Button>
      </div>

      <div className="space-y-4">
        {visits.map((visit) => (
          <Card key={visit.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#E0F2F1] flex items-center justify-center">
                  <Timer className="h-6 w-6 text-[#00897B]" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{visit.businessName}</p>
                  <p className="text-sm text-[#757575]">{visit.address}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{visit.type}</Badge>
                    <span className="text-xs text-[#757575]">{visit.scheduledAt}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <MapPin className="h-4 w-4 mr-1" />
                    Navigate
                  </Button>
                  <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Complete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Pipeline Tab
function PipelineTab({ stages }: { stages: typeof pipelineStages }) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Sales Pipeline</h3>
        <Badge variant="outline" className="text-[#00897B]">
          {stages.reduce((sum, s) => sum + s.count, 0)} Total Leads
        </Badge>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {stages.map((stage, i) => (
          <Card key={i} className="text-center">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-[#757575] mb-2">{stage.stage}</p>
              <p className="text-2xl font-bold text-[#1A1A1A] mb-1">{stage.count}</p>
              <p className="text-xs text-[#757575]">R{stage.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Earnings Tab
function EarningsTab({ commissions, agent }: { commissions: typeof mockCommissions; agent: typeof agentProfile }) {
  return (
    <div className="p-6 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">R{agent.stats.totalCommission.toLocaleString()}</p>
            <p className="text-sm text-[#757575]">Total Earned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-600">R{agent.stats.pendingCommission.toLocaleString()}</p>
            <p className="text-sm text-[#757575]">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-[#1A1A1A]">12%</p>
            <p className="text-sm text-[#757575]">Commission Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Commission History */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-[#1A1A1A] mb-4">Commission History</h3>
          <div className="space-y-3">
            {commissions.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    c.status === 'paid' ? 'bg-green-50' : 'bg-amber-50'
                  }`}>
                    {c.status === 'paid' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{c.merchant}</p>
                    <p className="text-xs text-[#757575]">{c.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">R{c.amount.toLocaleString()}</p>
                  <Badge variant={c.status === 'paid' ? 'default' : 'secondary'} className="text-[10px]">
                    {c.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Training Tab
function TrainingTab() {
  return (
    <div className="p-6 space-y-6">
      <h3 className="font-semibold">Training & Resources</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: 'Product Knowledge', progress: 100, modules: 8, completed: 8 },
          { title: 'Sales Techniques', progress: 75, modules: 6, completed: 4 },
          { title: 'CRM Training', progress: 50, modules: 4, completed: 2 },
          { title: 'Territory Planning', progress: 25, modules: 3, completed: 1 },
        ].map((course, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">{course.title}</h4>
                <Badge variant={course.progress === 100 ? 'default' : 'secondary'} className="text-xs">
                  {course.progress}%
                </Badge>
              </div>
              <Progress value={course.progress} className="h-2 mb-2" />
              <p className="text-xs text-[#757575]">{course.completed}/{course.modules} modules completed</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
