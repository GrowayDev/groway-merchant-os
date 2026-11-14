'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
  HeartHandshake,
  Users,
  Calendar,
  Star,
  MessageCircle,
  CheckCircle,
  ArrowRight,
  Clock,
  Award,
  TrendingUp,
  Search,
  UserPlus,
  MapPin,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Send,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Types
interface MentorshipProgram {
  id: string
  name: string
  description: string
  status: 'active' | 'completed' | 'paused' | 'upcoming'
  progress: number
  mentor: Mentor
  mentee: Mentee
  startDate: string
  endDate: string
  sessionsCompleted: number
  totalSessions: number
  satisfactionScore: number
}

interface Mentor {
  id: string
  name: string
  initials: string
  expertise: string[]
  rating: number
  reviews: number
  availability: 'available' | 'busy' | 'unavailable'
  experience: string
  menteesCount: number
}

interface Mentee {
  id: string
  name: string
  initials: string
  goals: string[]
  level: 'beginner' | 'intermediate' | 'advanced'
  progress: number
}

interface Session {
  id: string
  date: string
  time: string
  duration: string
  type: 'one_on_one' | 'group' | 'workshop'
  topic: string
  mentor: string
  status: 'scheduled' | 'completed' | 'cancelled'
}

interface Message {
  id: string
  sender: string
  senderInitials: string
  content: string
  timestamp: string
  isMentor: boolean
}

// Mock Data
const mentors: Mentor[] = [
  {
    id: 'm1',
    name: 'Mandla Nkosi',
    initials: 'MN',
    expertise: ['Business Strategy', 'Financial Management', 'Growth Planning'],
    rating: 4.9,
    reviews: 28,
    availability: 'available',
    experience: '15 years in retail',
    menteesCount: 12,
  },
  {
    id: 'm2',
    name: 'Nomsa Dlamini',
    initials: 'ND',
    expertise: ['Operations', 'Supply Chain', 'Stock Management'],
    rating: 4.7,
    reviews: 19,
    availability: 'available',
    experience: '10 years spaza shop owner',
    menteesCount: 8,
  },
  {
    id: 'm3',
    name: 'Sipho Ndlovu',
    initials: 'SN',
    expertise: ['Financial Planning', 'Tax Compliance', 'Budgeting'],
    rating: 4.8,
    reviews: 22,
    availability: 'busy',
    experience: '12 years financial consulting',
    menteesCount: 15,
  },
  {
    id: 'm4',
    name: 'Zanele Mthembu',
    initials: 'ZM',
    expertise: ['Marketing', 'Customer Service', 'Digital Presence'],
    rating: 4.6,
    reviews: 15,
    availability: 'available',
    experience: '8 years marketing in retail',
    menteesCount: 6,
  },
  {
    id: 'm5',
    name: 'Bongani Cele',
    initials: 'BC',
    expertise: ['Inventory Control', 'POS Systems', 'Technology'],
    rating: 4.5,
    reviews: 11,
    availability: 'unavailable',
    experience: '6 years tech solutions',
    menteesCount: 4,
  },
]

const programs: MentorshipProgram[] = [
  {
    id: 'p1',
    name: 'New Owner Onboarding',
    description: 'Guiding new spaza shop owners through the essentials of running a successful business',
    status: 'active',
    progress: 75,
    mentor: mentors[1],
    mentee: { id: 'mt1', name: 'Lindiwe Khanyile', initials: 'LK', goals: ['Learn stock ordering', 'Understand pricing'], level: 'beginner', progress: 75 },
    startDate: '2024-10-01',
    endDate: '2025-03-31',
    sessionsCompleted: 9,
    totalSessions: 12,
    satisfactionScore: 4.8,
  },
  {
    id: 'p2',
    name: 'Business Growth Accelerator',
    description: 'Scaling strategies for established spaza shops looking to expand',
    status: 'active',
    progress: 40,
    mentor: mentors[0],
    mentee: { id: 'mt2', name: 'Sibusiso Mkhize', initials: 'SM', goals: ['Revenue growth', 'New product lines'], level: 'intermediate', progress: 40 },
    startDate: '2024-11-15',
    endDate: '2025-05-15',
    sessionsCompleted: 4,
    totalSessions: 10,
    satisfactionScore: 4.6,
  },
  {
    id: 'p3',
    name: 'Financial Management Mentorship',
    description: 'Building financial literacy and budgeting skills for sustainable operations',
    status: 'active',
    progress: 60,
    mentor: mentors[2],
    mentee: { id: 'mt3', name: 'Palesa Buthelezi', initials: 'PB', goals: ['Cash flow management', 'Tax planning'], level: 'intermediate', progress: 60 },
    startDate: '2024-09-15',
    endDate: '2025-01-15',
    sessionsCompleted: 6,
    totalSessions: 10,
    satisfactionScore: 4.9,
  },
  {
    id: 'p4',
    name: 'Operations Excellence',
    description: 'Streamlining daily operations and improving efficiency',
    status: 'completed',
    progress: 100,
    mentor: mentors[3],
    mentee: { id: 'mt4', name: 'Nkosinathi Dube', initials: 'ND', goals: ['Reduce waste', 'Improve processes'], level: 'beginner', progress: 100 },
    startDate: '2024-06-01',
    endDate: '2024-11-30',
    sessionsCompleted: 8,
    totalSessions: 8,
    satisfactionScore: 5.0,
  },
]

const weeklySchedule: Session[] = [
  { id: 's1', date: 'Mon', time: '09:00', duration: '1h', type: 'one_on_one', topic: 'Stock Ordering Strategy', mentor: 'Nomsa Dlamini', status: 'completed' },
  { id: 's2', date: 'Mon', time: '14:00', duration: '1h', type: 'one_on_one', topic: 'Growth Planning Review', mentor: 'Mandla Nkosi', status: 'completed' },
  { id: 's3', date: 'Tue', time: '10:00', duration: '1.5h', type: 'group', topic: 'Financial Literacy Workshop', mentor: 'Sipho Ndlovu', status: 'scheduled' },
  { id: 's4', date: 'Wed', time: '11:00', duration: '1h', type: 'one_on_one', topic: 'Budget Review Session', mentor: 'Sipho Ndlovu', status: 'scheduled' },
  { id: 's5', date: 'Thu', time: '09:30', duration: '1h', type: 'workshop', topic: 'Marketing Essentials', mentor: 'Zanele Mthembu', status: 'scheduled' },
  { id: 's6', date: 'Thu', time: '15:00', duration: '45m', type: 'one_on_one', topic: 'Supply Chain Tips', mentor: 'Nomsa Dlamini', status: 'scheduled' },
  { id: 's7', date: 'Fri', time: '10:00', duration: '1h', type: 'one_on_one', topic: 'Business Growth Strategy', mentor: 'Mandla Nkosi', status: 'scheduled' },
]

const messages: Message[] = [
  { id: 'msg1', sender: 'Nomsa Dlamini', senderInitials: 'ND', content: 'Great progress on the stock ordering module! Let\'s review your reorder points this week.', timestamp: '10:30 AM', isMentor: true },
  { id: 'msg2', sender: 'Lindiwe Khanyile', senderInitials: 'LK', content: 'Thank you! I\'ve been tracking the data and noticed our bread orders could be optimized.', timestamp: '10:45 AM', isMentor: false },
  { id: 'msg3', sender: 'Nomsa Dlamini', senderInitials: 'ND', content: 'That\'s exactly the kind of insight I was hoping for. Bring the data to our next session.', timestamp: '11:00 AM', isMentor: true },
  { id: 'msg4', sender: 'Lindiwe Khanyile', senderInitials: 'LK', content: 'Will do! I\'ve also prepared questions about supplier negotiations.', timestamp: '11:15 AM', isMentor: false },
]

const statusColors: Record<string, string> = {
  active: 'bg-[#00897B]/10 text-[#00897B] border-[#00897B]/20',
  completed: 'bg-green-50 text-green-700 border-green-200',
  paused: 'bg-amber-50 text-amber-700 border-amber-200',
  upcoming: 'bg-blue-50 text-blue-700 border-blue-200',
}

const availabilityColors: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  busy: 'bg-amber-100 text-amber-700',
  unavailable: 'bg-gray-100 text-gray-500',
}

const typeColors: Record<string, string> = {
  one_on_one: 'bg-teal-100 text-teal-700',
  group: 'bg-purple-100 text-purple-700',
  workshop: 'bg-rose-100 text-rose-700',
}

export function MentorshipView() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [messageInput, setMessageInput] = useState('')

  const dashboardStats = useMemo(() => {
    const active = programs.filter((p) => p.status === 'active').length
    const matches = mentors.reduce((acc, m) => acc + m.menteesCount, 0)
    const completionRate = Math.round((programs.filter((p) => p.status === 'completed').length / programs.length) * 100)
    const avgSatisfaction = (programs.reduce((acc, p) => acc + p.satisfactionScore, 0) / programs.length).toFixed(1)
    return { activePrograms: active, matches, completionRate, avgSatisfaction }
  }, [])

  const filteredMentors = useMemo(() => {
    return mentors.filter((m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.expertise.some((e) => e.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [searchQuery])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HeartHandshake className="h-7 w-7 text-[#00897B]" />
            Mentorship Hub
          </h1>
          <p className="text-gray-500 mt-1">Connect, learn, and grow with experienced spaza shop mentors</p>
        </div>
        <Button className="bg-[#00897B] text-white hover:bg-[#00796B]">
          <UserPlus className="h-4 w-4 mr-2" />
          Find a Mentor
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-50">
                <HeartHandshake className="h-5 w-5 text-[#00897B]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats.activePrograms}</p>
                <p className="text-xs text-gray-500">Active Programs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats.matches}</p>
                <p className="text-xs text-gray-500">Mentor Matches</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats.completionRate}%</p>
                <p className="text-xs text-gray-500">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats.avgSatisfaction}</p>
                <p className="text-xs text-gray-500">Satisfaction Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="mentors">Mentors</TabsTrigger>
          <TabsTrigger value="calendar">Schedule</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Tab: Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {programs.map((program) => (
              <Card key={program.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{program.name}</CardTitle>
                      <CardDescription className="text-xs mt-1 line-clamp-2">{program.description}</CardDescription>
                    </div>
                    <Badge variant="outline" className={`text-xs shrink-0 ${statusColors[program.status]}`}>
                      {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Mentor/Mentee */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-[#00897B] text-white text-xs">{program.mentor.initials}</AvatarFallback>
                    </Avatar>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-amber-100 text-amber-700 text-xs">{program.mentee.initials}</AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">{program.mentor.name}</span>
                      <span className="text-gray-400 mx-1">&rarr;</span>
                      <span className="font-medium text-gray-700">{program.mentee.name}</span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Progress ({program.sessionsCompleted}/{program.totalSessions} sessions)</span>
                      <span className="font-medium text-[#00897B]">{program.progress}%</span>
                    </div>
                    <Progress value={program.progress} className="h-2" />
                  </div>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {program.startDate} → {program.endDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                      <span className="font-medium">{program.satisfactionScore}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Mentors */}
      {activeTab === 'mentors' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search mentors by name or expertise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMentors.map((mentor) => (
              <Card key={mentor.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-[#00897B] text-white font-semibold">{mentor.initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{mentor.name}</h3>
                      <p className="text-xs text-gray-500">{mentor.experience}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-3 w-3 ${
                                s <= Math.floor(mentor.rating)
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">({mentor.reviews})</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className={`text-xs shrink-0 ${availabilityColors[mentor.availability]}`}>
                      {mentor.availability.charAt(0).toUpperCase() + mentor.availability.slice(1)}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {mentor.expertise.map((exp) => (
                      <Badge key={exp} variant="secondary" className="text-xs bg-teal-50 text-teal-700">
                        {exp}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {mentor.menteesCount} mentees
                    </span>
                  </div>

                  {mentor.availability === 'available' && (
                    <Button className="w-full bg-[#00897B] text-white hover:bg-[#00796B]" size="sm">
                      Request Mentorship
                    </Button>
                  )}
                  {mentor.availability === 'busy' && (
                    <Button variant="outline" className="w-full" size="sm" disabled>
                      Join Waitlist
                    </Button>
                  )}
                  {mentor.availability === 'unavailable' && (
                    <Button variant="outline" className="w-full text-gray-400" size="sm" disabled>
                      Currently Unavailable
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Calendar / Schedule */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#00897B]" />
                  This Week&apos;s Schedule
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm"><ChevronLeft className="h-4 w-4" /></Button>
                  <span className="text-sm font-medium text-gray-700">Jan 20 - Jan 26, 2025</span>
                  <Button variant="outline" size="sm"><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Weekly View Grid */}
              <div className="grid grid-cols-5 gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => {
                  const daySessions = weeklySchedule.filter((s) => s.date === day)
                  return (
                    <div key={day} className="space-y-2">
                      <div className="text-center text-sm font-semibold text-gray-600 pb-1 border-b">
                        {day}
                      </div>
                      {daySessions.length === 0 && (
                        <div className="p-3 rounded-lg border border-dashed text-center">
                          <p className="text-xs text-gray-400">No sessions</p>
                        </div>
                      )}
                      {daySessions.map((session) => (
                        <div
                          key={session.id}
                          className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                            session.status === 'completed'
                              ? 'bg-gray-50 border-gray-200'
                              : 'bg-[#00897B]/5 border-[#00897B]/20 hover:bg-[#00897B]/10'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-700">{session.time}</span>
                            <span className="text-gray-400">{session.duration}</span>
                          </div>
                          <p className="font-medium text-gray-900 line-clamp-2">{session.topic}</p>
                          <Badge variant="secondary" className={`text-[10px] ${typeColors[session.type]}`}>
                            {session.type === 'one_on_one' ? '1-on-1' : session.type.charAt(0).toUpperCase() + session.type.slice(1)}
                          </Badge>
                          <p className="text-gray-500">{session.mentor}</p>
                          {session.status === 'completed' ? (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          ) : (
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-[#00897B] hover:text-[#00796B] w-full mt-1">
                              Join Session
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Session Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-[#00897B]">{weeklySchedule.filter((s) => s.status === 'scheduled').length}</p>
                <p className="text-xs text-gray-500 mt-1">Upcoming Sessions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{weeklySchedule.filter((s) => s.status === 'completed').length}</p>
                <p className="text-xs text-gray-500 mt-1">Completed Today</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {weeklySchedule.reduce((acc, s) => acc + parseInt(s.duration), 0)}h
                </p>
                <p className="text-xs text-gray-500 mt-1">Total Hours This Week</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab: Matching Suggestions */}
      {activeTab === 'matches' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                AI Match Suggestions
              </CardTitle>
              <CardDescription>Recommended mentor-mentee pairings based on goals, availability, and expertise</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { mentee: 'Thandi Zwane', initials: 'TZ', goal: 'Learn stock management', bestMentor: 'Nomsa Dlamini', matchScore: 95, reason: 'Expertise in stock management with high availability' },
                { mentee: 'Bheki Mthembu', initials: 'BM', goal: 'Improve financial planning', bestMentor: 'Sipho Ndlovu', matchScore: 92, reason: 'Deep financial management expertise and mentoring style match' },
                { mentee: 'Zodwa Ndaba', initials: 'ZN', goal: 'Grow online presence', bestMentor: 'Zanele Mthembu', matchScore: 88, reason: 'Marketing specialist with digital retail experience' },
              ].map((match, index) => (
                <div key={index} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-amber-100 text-amber-700 text-xs font-medium">{match.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{match.mentee}</p>
                      <p className="text-xs text-gray-500">Goal: {match.goal}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 shrink-0 hidden sm:block" />
                  <div className="hidden sm:flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-[#00897B] text-white text-xs font-medium">
                        {match.bestMentor.split(' ').map((n) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{match.bestMentor}</p>
                      <p className="text-xs text-gray-500">Recommended Mentor</p>
                    </div>
                  </div>
                  <div className="flex-1" />
                  <div className="text-center shrink-0">
                    <div className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                      <TrendingUp className="h-3 w-3" />
                      {match.matchScore}% Match
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 max-w-[120px] truncate">{match.reason}</p>
                  </div>
                  <Button size="sm" className="bg-[#00897B] text-white hover:bg-[#00796B] shrink-0">
                    <HeartHandshake className="h-3 w-3 mr-1" />
                    Match
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Messages */}
      {activeTab === 'messages' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-[#00897B]" />
              Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Conversation List */}
              <div className="space-y-2 lg:col-span-1">
                {[
                  { name: 'Nomsa Dlamini', initials: 'ND', lastMessage: 'Bring the data to our next session', time: '11:00 AM', unread: 2, program: 'New Owner Onboarding' },
                  { name: 'Mandla Nkosi', initials: 'MN', lastMessage: 'Let\'s review the growth metrics', time: 'Yesterday', unread: 0, program: 'Growth Accelerator' },
                  { name: 'Sipho Ndlovu', initials: 'SN', lastMessage: 'Tax documents are ready', time: '2 days ago', unread: 1, program: 'Financial Mentorship' },
                ].map((convo, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      index === 0 ? 'bg-[#00897B]/5 border-[#00897B]/20' : 'hover:bg-gray-50'
                    }`}
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-[#00897B] text-white text-xs">{convo.initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm text-gray-900 truncate">{convo.name}</h4>
                        <span className="text-[10px] text-gray-400">{convo.time}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{convo.lastMessage}</p>
                      <p className="text-[10px] text-[#00897B] mt-0.5">{convo.program}</p>
                    </div>
                    {convo.unread > 0 && (
                      <div className="h-5 w-5 rounded-full bg-[#00897B] text-white text-[10px] flex items-center justify-center shrink-0">
                        {convo.unread}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Chat Area */}
              <div className="lg:col-span-2 flex flex-col">
                <div className="flex-1 space-y-3 p-4 rounded-lg border bg-gray-50/50 min-h-[300px]">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-2 ${msg.isMentor ? '' : 'flex-row-reverse'}`}>
                      <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                        <AvatarFallback className={`text-[10px] ${
                          msg.isMentor ? 'bg-[#00897B] text-white' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {msg.senderInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`max-w-[75%] ${msg.isMentor ? '' : 'text-right'}`}>
                        <div className="flex items-center gap-2 mb-0.5">
                          {!msg.isMentor && <div className="flex-1" />}
                          <span className="text-[10px] font-medium text-gray-600">{msg.sender}</span>
                          <span className="text-[10px] text-gray-400">{msg.timestamp}</span>
                          {msg.isMentor && <div className="flex-1" />}
                        </div>
                        <div className={`inline-block p-2.5 rounded-lg text-sm ${
                          msg.isMentor
                            ? 'bg-white border'
                            : 'bg-[#00897B] text-white'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="flex items-center gap-2 mt-3">
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button className="bg-[#00897B] text-white hover:bg-[#00796B]">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
