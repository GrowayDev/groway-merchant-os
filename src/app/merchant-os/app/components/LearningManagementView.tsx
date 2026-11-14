'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  BookOpen,
  Play,
  CheckCircle,
  Trophy,
  Star,
  Clock,
  Award,
  TrendingUp,
  GraduationCap,
  Search,
  Filter,
  BarChart3,
  ChevronRight,
  Lock,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Types
interface Course {
  id: string
  title: string
  category: 'Operations' | 'Finance' | 'Marketing' | 'Technology' | 'Compliance'
  duration: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  progress: number
  status: 'not_started' | 'in_progress' | 'completed'
  thumbnail?: string
  lessons: number
  completedLessons: number
  score?: number
  instructor: string
}

interface BadgeEarned {
  id: string
  name: string
  description: string
  earnedDate: string
  icon: string
  color: string
}

interface Leader {
  id: string
  name: string
  avatar: string
  points: number
  coursesCompleted: number
  rank: number
}

// Mock Data
const courses: Course[] = [
  {
    id: 'c1',
    title: 'Stock Management Basics',
    category: 'Operations',
    duration: '2h 30m',
    difficulty: 'Beginner',
    progress: 100,
    status: 'completed',
    lessons: 8,
    completedLessons: 8,
    score: 92,
    instructor: 'Thabo Mokoena',
  },
  {
    id: 'c2',
    title: 'Customer Service Excellence',
    category: 'Operations',
    duration: '3h 15m',
    difficulty: 'Beginner',
    progress: 65,
    status: 'in_progress',
    lessons: 10,
    completedLessons: 7,
    instructor: 'Nomsa Dlamini',
  },
  {
    id: 'c3',
    title: 'Financial Literacy for Retail',
    category: 'Finance',
    duration: '4h 00m',
    difficulty: 'Intermediate',
    progress: 30,
    status: 'in_progress',
    lessons: 12,
    completedLessons: 4,
    instructor: 'Sipho Ndlovu',
  },
  {
    id: 'c4',
    title: 'Food Safety & Hygiene',
    category: 'Compliance',
    duration: '2h 00m',
    difficulty: 'Beginner',
    progress: 0,
    status: 'not_started',
    lessons: 6,
    completedLessons: 0,
    instructor: 'Dr. Lerato Khumalo',
  },
  {
    id: 'c5',
    title: 'POS System Training',
    category: 'Technology',
    duration: '1h 45m',
    difficulty: 'Beginner',
    progress: 100,
    status: 'completed',
    lessons: 5,
    completedLessons: 5,
    score: 88,
    instructor: 'Kagiso Technologies',
  },
  {
    id: 'c6',
    title: 'Business Growth Strategies',
    category: 'Finance',
    duration: '5h 00m',
    difficulty: 'Advanced',
    progress: 0,
    status: 'not_started',
    lessons: 15,
    completedLessons: 0,
    instructor: 'Prof. Mandla Nkosi',
  },
  {
    id: 'c7',
    title: 'Digital Marketing for Small Retail',
    category: 'Marketing',
    duration: '3h 30m',
    difficulty: 'Intermediate',
    progress: 10,
    status: 'in_progress',
    lessons: 9,
    completedLessons: 1,
    instructor: 'Zanele Mthembu',
  },
  {
    id: 'c8',
    title: 'Inventory Control & Ordering',
    category: 'Operations',
    duration: '2h 45m',
    difficulty: 'Intermediate',
    progress: 0,
    status: 'not_started',
    lessons: 7,
    completedLessons: 0,
    instructor: 'Bongani Cele',
  },
]

const badges: BadgeEarned[] = [
  { id: 'b1', name: 'First Steps', description: 'Completed your first course', earnedDate: '2024-11-15', icon: '🎯', color: 'bg-teal-100 text-teal-700' },
  { id: 'b2', name: 'Quick Learner', description: 'Completed 2 courses in a week', earnedDate: '2024-11-22', icon: '⚡', color: 'bg-amber-100 text-amber-700' },
  { id: 'b3', name: 'Operations Expert', description: 'Completed all Operations courses', earnedDate: '2024-12-01', icon: '🔧', color: 'bg-blue-100 text-blue-700' },
  { id: 'b4', name: 'Tech Savvy', description: 'Completed all Technology courses', earnedDate: '2024-12-05', icon: '💻', color: 'bg-purple-100 text-purple-700' },
  { id: 'b5', name: 'High Scorer', description: 'Scored 90%+ on any course', earnedDate: '2024-12-10', icon: '🏆', color: 'bg-rose-100 text-rose-700' },
]

const leaderboard: Leader[] = [
  { id: 'l1', name: 'Thandi Zwane', avatar: 'TZ', points: 2450, coursesCompleted: 12, rank: 1 },
  { id: 'l2', name: 'Bheki Mthembu', avatar: 'BM', points: 2180, coursesCompleted: 10, rank: 2 },
  { id: 'l3', name: 'Zodwa Ndaba', avatar: 'ZN', points: 1920, coursesCompleted: 9, rank: 3 },
  { id: 'l4', name: 'Sibusiso Mkhize', avatar: 'SM', points: 1750, coursesCompleted: 8, rank: 4 },
  { id: 'l5', name: 'Palesa Buthelezi', avatar: 'PB', points: 1600, coursesCompleted: 7, rank: 5 },
  { id: 'l6', name: 'Nkosinathi Dube', avatar: 'ND', points: 1420, coursesCompleted: 6, rank: 6 },
  { id: 'l7', name: 'Lindiwe Khanyile', avatar: 'LK', points: 1350, coursesCompleted: 6, rank: 7 },
  { id: 'l8', name: 'Mandla Sithole', avatar: 'MS', points: 1180, coursesCompleted: 5, rank: 8 },
]

const categoryColors: Record<string, string> = {
  Operations: 'bg-teal-100 text-teal-700',
  Finance: 'bg-amber-100 text-amber-700',
  Marketing: 'bg-rose-100 text-rose-700',
  Technology: 'bg-purple-100 text-purple-700',
  Compliance: 'bg-blue-100 text-blue-700',
}

const difficultyColors: Record<string, string> = {
  Beginner: 'bg-green-100 text-green-700',
  Intermediate: 'bg-amber-100 text-amber-700',
  Advanced: 'bg-rose-100 text-rose-700',
}

export function LearningManagementView() {
  const [activeTab, setActiveTab] = useState('catalog')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Dashboard stats
  const stats = useMemo(() => {
    const totalCourses = courses.length
    const completed = courses.filter((c) => c.status === 'completed').length
    const inProgress = courses.filter((c) => c.status === 'in_progress').length
    const scores = courses.filter((c) => c.score).map((c) => c.score as number)
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    return { totalCourses, completed, inProgress, avgScore }
  }, [])

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter
      const matchesStatus = statusFilter === 'all' || course.status === statusFilter
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [searchQuery, categoryFilter, statusFilter])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-[#00897B]" />
            Learning Academy
          </h1>
          <p className="text-gray-500 mt-1">Upskill your team with Spaza Shop focused courses</p>
        </div>
        <Badge className="bg-[#00897B] text-white px-3 py-1 text-sm font-medium w-fit">
          {stats.inProgress} Active Courses
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-50">
                <BookOpen className="h-5 w-5 text-[#00897B]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
                <p className="text-xs text-gray-500">Total Courses</p>
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
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <Play className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                <p className="text-xs text-gray-500">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.avgScore}%</p>
                <p className="text-xs text-gray-500">Avg Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="catalog">Course Catalog</TabsTrigger>
          <TabsTrigger value="progress">My Progress</TabsTrigger>
          <TabsTrigger value="badges">Badges & Certificates</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Tab Content: Course Catalog */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Operations">Operations</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Compliance">Compliance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Course Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
                {/* Thumbnail placeholder */}
                <div className={`h-32 flex items-center justify-center ${
                  course.status === 'completed' ? 'bg-[#00897B]/10' :
                  course.status === 'in_progress' ? 'bg-amber-50' : 'bg-gray-50'
                }`}>
                  {course.status === 'completed' ? (
                    <CheckCircle className="h-12 w-12 text-[#00897B]" />
                  ) : course.status === 'in_progress' ? (
                    <Play className="h-12 w-12 text-amber-500" />
                  ) : (
                    <BookOpen className="h-12 w-12 text-gray-300" />
                  )}
                </div>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">{course.title}</h3>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{course.instructor}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className={`text-xs ${categoryColors[course.category]}`}>
                      {course.category}
                    </Badge>
                    <Badge variant="secondary" className={`text-xs ${difficultyColors[course.difficulty]}`}>
                      {course.difficulty}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {course.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {course.completedLessons}/{course.lessons}
                    </span>
                  </div>
                  {course.status !== 'not_started' && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Progress</span>
                        <span className="font-medium text-gray-700">{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-1.5" />
                    </div>
                  )}
                  {course.score !== undefined && (
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                      <span className="font-medium text-gray-700">Score: {course.score}%</span>
                    </div>
                  )}
                  <Button
                    className={`w-full text-xs ${
                      course.status === 'completed'
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : course.status === 'in_progress'
                        ? 'bg-[#00897B] text-white hover:bg-[#00796B]'
                        : 'bg-[#00897B] text-white hover:bg-[#00796B]'
                    }`}
                    size="sm"
                  >
                    {course.status === 'completed' ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Review Course
                      </>
                    ) : course.status === 'in_progress' ? (
                      <>
                        <Play className="h-3 w-3 mr-1" />
                        Continue Learning
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 mr-1" />
                        Start Learning
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <Card className="py-12">
              <CardContent className="flex flex-col items-center text-center">
                <BookOpen className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500">No courses found matching your criteria</p>
                <Button variant="outline" className="mt-3" onClick={() => { setSearchQuery(''); setCategoryFilter('all'); setStatusFilter('all') }}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tab Content: My Progress */}
      {activeTab === 'progress' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#00897B]" />
                Overall Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Overall Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Overall Completion</span>
                  <span className="font-semibold text-[#00897B]">
                    {Math.round(courses.reduce((acc, c) => acc + c.progress, 0) / courses.length)}%
                  </span>
                </div>
                <Progress
                  value={Math.round(courses.reduce((acc, c) => acc + c.progress, 0) / courses.length)}
                  className="h-3"
                />
              </div>

              {/* Category Progress */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                {(['Operations', 'Finance', 'Marketing', 'Technology', 'Compliance'] as const).map((cat) => {
                  const catCourses = courses.filter((c) => c.category === cat)
                  const catProgress = catCourses.length > 0
                    ? Math.round(catCourses.reduce((acc, c) => acc + c.progress, 0) / catCourses.length)
                    : 0
                  return (
                    <div key={cat} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className={`text-xs ${categoryColors[cat]}`}>{cat}</Badge>
                        <span className="text-sm font-medium text-gray-600">{catProgress}%</span>
                      </div>
                      <Progress value={catProgress} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">{catCourses.length} courses</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* In Progress Courses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Play className="h-5 w-5 text-amber-500" />
                Continue Learning
              </CardTitle>
              <CardDescription>Courses you&apos;re currently working on</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {courses
                  .filter((c) => c.status === 'in_progress')
                  .map((course) => (
                    <div key={course.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                      <div className="h-12 w-12 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                        <Play className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm text-gray-900 truncate">{course.title}</h4>
                          <Badge variant="secondary" className={`text-xs shrink-0 ${categoryColors[course.category]}`}>
                            {course.category}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span>{course.completedLessons} of {course.lessons} lessons</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.duration}</span>
                        </div>
                        <Progress value={course.progress} className="h-1.5 mt-2" />
                      </div>
                      <Button size="sm" className="bg-[#00897B] text-white hover:bg-[#00796B] shrink-0">
                        <Play className="h-3 w-3 mr-1" />
                        Continue
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Completed Courses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Completed Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {courses
                  .filter((c) => c.status === 'completed')
                  .map((course) => (
                    <div key={course.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                      <div className="h-12 w-12 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 truncate">{course.title}</h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <Badge variant="secondary" className={`text-xs ${categoryColors[course.category]}`}>{course.category}</Badge>
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                            Score: {course.score}%
                          </span>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700 shrink-0">
                        <Award className="h-3 w-3 mr-1" />
                        Certified
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab Content: Badges & Certificates */}
      {activeTab === 'badges' && (
        <div className="space-y-6">
          {/* Badges Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-[#00897B]" />
                Badges Earned
              </CardTitle>
              <CardDescription>Achievements unlocked through learning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {badges.map((badge) => (
                  <div key={badge.id} className="flex flex-col items-center text-center p-4 rounded-lg border hover:shadow-md transition-shadow">
                    <div className={`h-16 w-16 rounded-full flex items-center justify-center text-2xl mb-2 ${badge.color}`}>
                      {badge.icon}
                    </div>
                    <h4 className="font-semibold text-sm text-gray-900">{badge.name}</h4>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{badge.description}</p>
                    <p className="text-xs text-gray-400 mt-2">{badge.earnedDate}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Certificates Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Certificates
              </CardTitle>
              <CardDescription>Downloadable certificates for completed courses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {courses
                  .filter((c) => c.status === 'completed')
                  .map((course) => (
                    <div key={course.id} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                      <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-[#00897B] to-[#00695C] flex items-center justify-center shrink-0">
                        <Trophy className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900">{course.title}</h4>
                        <p className="text-sm text-gray-500 mt-0.5">
                          Score: {course.score}% &middot; {course.duration} &middot; {course.lessons} lessons
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Locked Badges */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-gray-500">
                <Lock className="h-5 w-5" />
                Badges to Unlock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {[
                  { name: 'Finance Guru', description: 'Complete all Finance courses', icon: '💰' },
                  { name: 'Marketing Pro', description: 'Complete all Marketing courses', icon: '📣' },
                  { name: 'Compliance Champion', description: 'Complete all Compliance courses', icon: '✅' },
                  { name: 'Perfect Score', description: 'Score 100% on any course', icon: '💯' },
                  { name: 'Course Master', description: 'Complete all available courses', icon: '🎓' },
                ].map((badge, index) => (
                  <div key={index} className="flex flex-col items-center text-center p-4 rounded-lg border border-dashed opacity-50">
                    <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl mb-2 grayscale">
                      {badge.icon}
                    </div>
                    <h4 className="font-semibold text-sm text-gray-500">{badge.name}</h4>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{badge.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab Content: Leaderboard */}
      {activeTab === 'leaderboard' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Top Learners
            </CardTitle>
            <CardDescription>See who&apos;s leading the learning journey this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard.map((leader) => (
                <div key={leader.id} className={`flex items-center gap-4 p-3 rounded-lg border hover:bg-gray-50 transition-colors ${
                  leader.rank <= 3 ? 'border-amber-200 bg-amber-50/30' : ''
                }`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                    leader.rank === 1
                      ? 'bg-amber-400 text-white'
                      : leader.rank === 2
                      ? 'bg-gray-300 text-white'
                      : leader.rank === 3
                      ? 'bg-amber-700 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {leader.rank}
                  </div>
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className={`${leader.rank <= 3 ? 'bg-[#00897B] text-white' : 'bg-gray-200 text-gray-600'} text-sm font-medium`}>
                      {leader.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-gray-900">{leader.name}</h4>
                    <p className="text-xs text-gray-500">{leader.coursesCompleted} courses completed</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 text-[#00897B] font-semibold text-sm">
                      <Star className="h-4 w-4 fill-[#00897B]" />
                      {leader.points.toLocaleString()}
                    </div>
                    <p className="text-xs text-gray-400">points</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
