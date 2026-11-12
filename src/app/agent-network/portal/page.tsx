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
  Gift,
  TrendingUp,
  CheckCircle2,
  Star,
  Award,
  Crown,
  Target,
  Copy,
  Share2,
  Home,
  UserPlus,
  Wallet,
  Trophy,
  Medal,
  Bell,
  Settings,
  ArrowLeft,
  Eye,
  Send,
  Clock,
  Plus,
  ChevronRight,
  Download,
} from 'lucide-react'

// Mock agent profile data
const agentProfile = {
  id: 'agent-001',
  name: 'John Molefe',
  email: 'john@groway.co.za',
  phone: '0821234567',
  businessName: "John's Electronics",
  referralCode: 'GROW2024JOHN',
  tier: 'silver',
  status: 'active',
  joinedAt: '2024-06-15',
  stats: {
    totalReferrals: 18,
    activeReferrals: 14,
    totalNetworkRevenue: 125000,
    totalCommissionEarned: 12500,
    pendingCommission: 2800,
    networkSize: 23,
  },
  bankDetails: {
    bank: 'FNB',
    account: '****4567',
  },
}

// Mock referrals data
const mockReferrals = [
  {
    id: 'ref-001',
    businessName: "Sipho's Spaza Shop",
    contactName: 'Sipho Mokoena',
    status: 'active',
    registeredAt: '2024-11-15',
    revenue: 15000,
    commission: 1500,
  },
  {
    id: 'ref-002',
    businessName: 'Thandi Beauty Salon',
    contactName: 'Thandi Nkosi',
    status: 'active',
    registeredAt: '2024-11-10',
    revenue: 8500,
    commission: 850,
  },
  {
    id: 'ref-003',
    businessName: "Mpho's Auto Repair",
    contactName: 'Mpho Dlamini',
    status: 'pending',
    registeredAt: '2024-12-01',
    revenue: 0,
    commission: 0,
  },
  {
    id: 'ref-004',
    businessName: 'KwaMai Shisa Nyama',
    contactName: 'Mai Ndlovu',
    status: 'active',
    registeredAt: '2024-10-20',
    revenue: 32000,
    commission: 3200,
  },
]

// Mock commission history
const mockCommissions = [
  { id: 'c-001', type: 'signup_bonus', amount: 500, status: 'paid', date: '2024-11-15' },
  { id: 'c-002', type: 'transaction', amount: 1500, status: 'paid', date: '2024-11-30' },
  { id: 'c-003', type: 'transaction', amount: 850, status: 'pending', date: '2024-12-01' },
  { id: 'c-004', type: 'milestone', amount: 2000, status: 'pending', date: '2024-12-02' },
]

// Mock network tree
const mockNetwork = [
  { level: 1, count: 18, revenue: 55000 },
  { level: 2, count: 5, revenue: 12500 },
  { level: 3, count: 0, revenue: 0 },
]

// Tier configurations
const tierConfig = {
  starter: { name: 'Starter', commission: 5, color: 'bg-gray-100 text-gray-700', icon: Star },
  bronze: { name: 'Bronze', commission: 7, color: 'bg-amber-100 text-amber-700', icon: Medal },
  silver: { name: 'Silver', commission: 10, color: 'bg-slate-100 text-slate-700', icon: Award },
  gold: { name: 'Gold', commission: 12, color: 'bg-yellow-100 text-yellow-700', icon: Crown },
  platinum: { name: 'Platinum', commission: 15, color: 'bg-purple-100 text-purple-700', icon: Trophy },
}

// Milestones
const milestones = [
  { id: 'm1', name: 'First 5 Merchants', target: 5, reward: 'R1,000 bonus', completed: true },
  { id: 'm2', name: '10 Active Merchants', target: 10, reward: 'R2,500 + Tier Upgrade', completed: true },
  { id: 'm3', name: '25 Network Partners', target: 25, reward: 'R5,000 + Enterprise Preview', completed: false, progress: 72 },
  { id: 'm4', name: 'R100k Network Revenue', target: 100000, reward: 'R5,000 bonus', completed: true },
]

export default function AgentNetworkPortal() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showPayoutDialog, setShowPayoutDialog] = useState(false)
  const [copied, setCopied] = useState(false)

  const agent = agentProfile
  const tier = tierConfig[agent.tier as keyof typeof tierConfig]
  const TierIcon = tier.icon

  const copyReferralCode = () => {
    navigator.clipboard.writeText(agent.referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const pendingPayout = agent.stats.pendingCommission

  return (
    <div className="min-h-screen flex bg-[#FAFAFA]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <Link href="/" className="flex items-center gap-2">
            <img src="/groway-logo.png" alt="Groway" className="h-7 w-auto" />
            <Badge variant="outline" className="text-[9px] border-[#00897B]/30 text-[#00897B]">Agent Portal</Badge>
          </Link>
        </div>

        {/* Agent Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-[#E0F2F1] text-[#00897B]">JM</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-[#1A1A1A]">{agent.name}</p>
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${tier.color}`}>
                <TierIcon className="h-3 w-3" />
                {tier.name}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Home },
            { id: 'referrals', label: 'My Referrals', icon: UserPlus },
            { id: 'network', label: 'Network Tree', icon: Users },
            { id: 'earnings', label: 'Earnings', icon: Wallet },
            { id: 'milestones', label: 'Milestones', icon: Target },
            { id: 'resources', label: 'Resources', icon: Gift },
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
            onClick={() => setShowInviteDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Invite Merchant
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setShowPayoutDialog(true)}
          >
            <Wallet className="h-4 w-4 mr-2" />
            Request Payout
          </Button>
        </div>

        {/* Back Link */}
        <div className="p-3 border-t border-gray-200">
          <Link href="/agent-network" className="flex items-center gap-2 text-sm text-[#757575] hover:text-[#00897B]">
            <ArrowLeft className="h-4 w-4" />
            Back to Landing
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
              <p className="text-xs text-[#757575]">Welcome back, {agent.name}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Referral Code */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#E0F2F1] rounded-lg">
                <span className="text-xs text-[#757575]">Your Code:</span>
                <code className="text-sm font-bold text-[#00897B]">{agent.referralCode}</code>
                <button onClick={copyReferralCode} className="text-[#00897B] hover:text-[#00695C]">
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
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
          <div className="p-6">
            {activeTab === 'dashboard' && <DashboardTab agent={agent} tier={tier} onInvite={() => setShowInviteDialog(true)} />}
            {activeTab === 'referrals' && <ReferralsTab referrals={mockReferrals} />}
            {activeTab === 'network' && <NetworkTab network={mockNetwork} />}
            {activeTab === 'earnings' && <EarningsTab commissions={mockCommissions} pendingPayout={pendingPayout} />}
            {activeTab === 'milestones' && <MilestonesTab milestones={milestones} />}
            {activeTab === 'resources' && <ResourcesTab />}
          </div>
        </ScrollArea>
      </main>

      {/* Invite Merchant Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite a Merchant</DialogTitle>
            <DialogDescription>
              Refer a merchant and earn commission when they activate
            </DialogDescription>
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
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="Enter email address" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input placeholder="Enter phone number" />
            </div>
            <div className="p-3 bg-[#E0F2F1] rounded-lg text-center">
              <p className="text-xs text-[#00897B]">Your referral code will be applied</p>
              <p className="font-bold text-[#00897B]">{agent.referralCode}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setShowInviteDialog(false)}>
              <Send className="h-4 w-4 mr-2" />
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payout Dialog */}
      <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Request Payout</DialogTitle>
            <DialogDescription>Withdraw your commission earnings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-amber-50 rounded-lg text-center">
              <p className="text-sm text-amber-700">Available Balance</p>
              <p className="text-3xl font-bold text-amber-700">R{pendingPayout.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-[#757575]">Payment will be sent to</p>
              <p className="font-medium">{agent.bankDetails.bank} {agent.bankDetails.account}</p>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" defaultValue={pendingPayout} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayoutDialog(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setShowPayoutDialog(false)}>
              Request Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Dashboard Tab
function DashboardTab({ agent, tier, onInvite }: { agent: typeof agentProfile; tier: typeof tierConfig.silver; onInvite: () => void }) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Total Referrals</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">{agent.stats.totalReferrals}</p>
                <p className="text-xs text-green-600">{agent.stats.activeReferrals} active</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-[#E0F2F1] flex items-center justify-center">
                <Users className="h-5 w-5 text-[#00897B]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Network Revenue</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">R{agent.stats.totalNetworkRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600">+12% this month</p>
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
                <p className="text-xs text-[#757575]">Total Earned</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">R{agent.stats.totalCommissionEarned.toLocaleString()}</p>
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
                <p className="text-xs text-[#757575]">Commission Rate</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">{tier.commission}%</p>
                <p className="text-xs text-[#757575]">{agent.stats.networkSize} in network</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center">
                <Gift className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code Banner */}
      <Card className="bg-gradient-to-r from-[#00897B] to-[#00695C]">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-white text-center sm:text-left">
              <p className="text-sm opacity-80">Your Referral Code</p>
              <p className="text-3xl font-bold tracking-wider">{agent.referralCode}</p>
              <p className="text-xs opacity-70 mt-1">Share this code with merchants you want to refer</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => navigator.clipboard.writeText(agent.referralCode)}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button variant="secondary" onClick={onInvite}>
                <Share2 className="h-4 w-4 mr-2" />
                Invite
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:border-[#00897B] transition-colors" onClick={onInvite}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-[#E0F2F1] flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-[#00897B]" />
            </div>
            <div>
              <p className="font-medium">Invite Merchant</p>
              <p className="text-xs text-[#757575]">Add a new referral</p>
            </div>
            <ChevronRight className="h-5 w-5 text-[#757575] ml-auto" />
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-[#00897B] transition-colors">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">View Network</p>
              <p className="text-xs text-[#757575]">{agent.stats.networkSize} downline agents</p>
            </div>
            <ChevronRight className="h-5 w-5 text-[#757575] ml-auto" />
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-[#00897B] transition-colors">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-purple-50 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="font-medium">Milestones</p>
              <p className="text-xs text-[#757575]">Track your progress</p>
            </div>
            <ChevronRight className="h-5 w-5 text-[#757575] ml-auto" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Referrals Tab
function ReferralsTab({ referrals }: { referrals: typeof mockReferrals }) {
  const [filter, setFilter] = useState('all')
  
  const filtered = filter === 'all' ? referrals : referrals.filter(r => r.status === filter)
  
  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          {['all', 'active', 'pending'].map((f) => (
            <Button 
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className={filter === f ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
        <div className="flex-1" />
        <Button className="bg-[#00897B] hover:bg-[#00695C]">
          <Plus className="h-4 w-4 mr-2" />
          Add Referral
        </Button>
      </div>

      {/* Referrals List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {filtered.map((ref) => (
              <div key={ref.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                <Avatar>
                  <AvatarFallback className="bg-[#E0F2F1] text-[#00897B]">
                    {ref.businessName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{ref.businessName}</p>
                    <Badge variant={ref.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                      {ref.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-[#757575]">{ref.contactName}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">R{ref.revenue.toLocaleString()}</p>
                  <p className="text-xs text-[#757575]">Revenue</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">R{ref.commission.toLocaleString()}</p>
                  <p className="text-xs text-[#757575]">Commission</p>
                </div>
                <Button variant="ghost" size="icon">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Network Tab
function NetworkTab({ network }: { network: typeof mockNetwork }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-[#1A1A1A] mb-4">Network Structure</h3>
          <div className="space-y-4">
            {network.map((level, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-[#E0F2F1] flex items-center justify-center font-bold text-[#00897B]">
                  L{level.level}
                </div>
                <div className="flex-1">
                  <p className="font-medium">Level {level.level} {level.level === 1 ? '(Direct)' : '(Indirect)'}</p>
                  <p className="text-sm text-[#757575]">{level.count} merchants</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">R{level.revenue.toLocaleString()}</p>
                  <p className="text-xs text-[#757575]">Revenue</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Earnings Tab
function EarningsTab({ commissions, pendingPayout }: { commissions: typeof mockCommissions; pendingPayout: number }) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">R{commissions.reduce((s, c) => s + c.amount, 0).toLocaleString()}</p>
            <p className="text-sm text-[#757575]">Total Earned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-600">R{pendingPayout.toLocaleString()}</p>
            <p className="text-sm text-[#757575]">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-[#1A1A1A]">10%</p>
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
                    <p className="font-medium capitalize">{c.type.replace('_', ' ')}</p>
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

// Milestones Tab
function MilestonesTab({ milestones }: { milestones: typeof milestones }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-[#1A1A1A] mb-4">Your Progress</h3>
          <div className="space-y-4">
            {milestones.map((m) => (
              <div key={m.id} className={`p-4 rounded-lg border ${
                m.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {m.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Target className="h-5 w-5 text-gray-400" />
                    )}
                    <p className="font-medium">{m.name}</p>
                  </div>
                  {m.completed && <Badge className="bg-green-100 text-green-700 text-[10px]">Completed</Badge>}
                </div>
                <p className="text-sm text-[#757575] mb-2">{m.reward}</p>
                {!m.completed && 'progress' in m && (
                  <Progress value={m.progress} className="h-2" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Resources Tab
function ResourcesTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: 'How to Refer', description: 'Step-by-step guide to referring merchants', icon: Gift },
          { title: 'Marketing Materials', description: 'Downloadable flyers and social media assets', icon: Download },
          { title: 'Talking Points', description: 'Key benefits to share with prospects', icon: Share2 },
          { title: 'FAQ', description: 'Common questions answered', icon: Users },
        ].map((r, i) => (
          <Card key={i} className="cursor-pointer hover:border-[#00897B]">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#E0F2F1] flex items-center justify-center">
                <r.icon className="h-5 w-5 text-[#00897B]" />
              </div>
              <div>
                <p className="font-medium">{r.title}</p>
                <p className="text-sm text-[#757575]">{r.description}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-[#757575] ml-auto" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
