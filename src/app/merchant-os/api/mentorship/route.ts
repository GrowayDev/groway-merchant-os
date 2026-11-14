import { NextRequest, NextResponse } from 'next/server'

interface Mentor {
  id: string
  name: string
  avatar: string
  expertise: string[]
  rating: number
  reviewCount: number
  availability: 'available' | 'busy' | 'unavailable'
 bio: string
  totalMentees: number
  activeMentees: number
  completedMentees: number
  sessionCount: number
}

interface MentorshipProgram {
  id: string
  name: string
  description: string
  mentorCount: number
  menteeCount: number
  status: 'active' | 'upcoming' | 'completed' | 'paused'
  startDate: string
  endDate: string
  duration: string
  category: string
}

interface MentorshipMatch {
  id: string
  mentorId: string
  mentorName: string
  menteeId: string
  menteeName: string
  programId: string
  programName: string
  matchScore: number
  status: 'pending' | 'active' | 'completed' | 'declined'
  startDate: string
  sessionCount: number
  nextSessionDate: string
}

interface ScheduleSession {
  id: string
  title: string
  type: 'one-on-one' | 'group' | 'workshop'
  date: string
  time: string
  duration: string
  mentorName: string
  status: 'upcoming' | 'completed' | 'cancelled'
  description: string
}

const mockPrograms: MentorshipProgram[] = [
  {
    id: 'program-001',
    name: 'New Owner Onboarding',
    description: 'Comprehensive 12-week program for new spaza shop owners covering all aspects of running a successful retail business.',
    mentorCount: 8,
    menteeCount: 24,
    status: 'active',
    startDate: '2025-01-06',
    endDate: '2025-03-28',
    duration: '12 weeks',
    category: 'Onboarding',
  },
  {
    id: 'program-002',
    name: 'Business Growth Accelerator',
    description: 'Intensive 8-week program focused on scaling strategies, market expansion, and revenue growth for established shop owners.',
    mentorCount: 5,
    menteeCount: 15,
    status: 'active',
    startDate: '2025-02-03',
    endDate: '2025-03-28',
    duration: '8 weeks',
    category: 'Growth',
  },
  {
    id: 'program-003',
    name: 'Financial Management Mentorship',
    description: '10-week deep dive into financial planning, budgeting, cash flow management, and profit optimization.',
    mentorCount: 4,
    menteeCount: 12,
    status: 'upcoming',
    startDate: '2025-04-01',
    endDate: '2025-06-05',
    duration: '10 weeks',
    category: 'Finance',
  },
  {
    id: 'program-004',
    name: 'Operations Excellence',
    description: '6-week program focused on streamlining operations, improving efficiency, and implementing best practices for daily shop management.',
    mentorCount: 6,
    menteeCount: 18,
    status: 'active',
    startDate: '2025-02-17',
    endDate: '2025-03-28',
    duration: '6 weeks',
    category: 'Operations',
  },
]

const mockMentors: Mentor[] = [
  {
    id: 'mentor-001',
    name: 'Thabo Mokoena',
    avatar: 'TM',
    expertise: ['Business Strategy', 'Retail Operations', 'Financial Planning'],
    rating: 4.9,
    reviewCount: 47,
    availability: 'available',
    bio: 'Former retail chain manager with 15 years of experience in the South African retail sector. Passionate about empowering small business owners.',
    totalMentees: 32,
    activeMentees: 4,
    completedMentees: 28,
    sessionCount: 156,
  },
  {
    id: 'mentor-002',
    name: 'Nomsa Dlamini',
    avatar: 'ND',
    expertise: ['Customer Service', 'Marketing', 'Brand Building'],
    rating: 4.8,
    reviewCount: 38,
    availability: 'available',
    bio: 'Marketing specialist with a focus on township businesses. Has helped over 50 spaza shop owners build strong local brands.',
    totalMentees: 25,
    activeMentees: 3,
    completedMentees: 22,
    sessionCount: 120,
  },
  {
    id: 'mentor-003',
    name: 'Sipho Nkosi',
    avatar: 'SN',
    expertise: ['Financial Management', 'Tax Compliance', 'Cash Flow'],
    rating: 4.7,
    reviewCount: 31,
    availability: 'busy',
    bio: 'Certified accountant with extensive experience helping small retailers manage their finances and stay compliant with SARS regulations.',
    totalMentees: 20,
    activeMentees: 5,
    completedMentees: 15,
    sessionCount: 98,
  },
  {
    id: 'mentor-004',
    name: 'Zanele Mthembu',
    avatar: 'ZM',
    expertise: ['Inventory Management', 'Supply Chain', 'POS Systems'],
    rating: 4.9,
    reviewCount: 42,
    availability: 'available',
    bio: 'Supply chain expert with 12 years in retail technology. Specializes in helping shops optimize their inventory and adopt digital tools.',
    totalMentees: 28,
    activeMentees: 4,
    completedMentees: 24,
    sessionCount: 134,
  },
  {
    id: 'mentor-005',
    name: 'Bongani Khumalo',
    avatar: 'BK',
    expertise: ['Business Growth', 'Expansion', 'Franchising'],
    rating: 4.6,
    reviewCount: 25,
    availability: 'unavailable',
    bio: 'Successful entrepreneur who grew a single spaza shop into a chain of 5 stores. Now dedicated to mentoring the next generation of business owners.',
    totalMentees: 15,
    activeMentees: 0,
    completedMentees: 15,
    sessionCount: 75,
  },
]

const mockMatches: MentorshipMatch[] = [
  {
    id: 'match-001',
    mentorId: 'mentor-001',
    mentorName: 'Thabo Mokoena',
    menteeId: 'user-001',
    menteeName: 'Current User',
    programId: 'program-001',
    programName: 'New Owner Onboarding',
    matchScore: 95,
    status: 'active',
    startDate: '2025-01-10',
    sessionCount: 8,
    nextSessionDate: '2025-03-05',
  },
  {
    id: 'match-002',
    mentorId: 'mentor-004',
    mentorName: 'Zanele Mthembu',
    menteeId: 'user-001',
    menteeName: 'Current User',
    programId: 'program-004',
    programName: 'Operations Excellence',
    matchScore: 88,
    status: 'active',
    startDate: '2025-02-20',
    sessionCount: 3,
    nextSessionDate: '2025-03-07',
  },
]

const mockSchedule: ScheduleSession[] = [
  {
    id: 'session-001',
    title: 'Weekly Check-in: Business Review',
    type: 'one-on-one',
    date: '2025-03-03',
    time: '10:00',
    duration: '45 min',
    mentorName: 'Thabo Mokoena',
    status: 'upcoming',
    description: 'Review weekly performance metrics and discuss challenges.',
  },
  {
    id: 'session-002',
    title: 'Operations Workshop',
    type: 'workshop',
    date: '2025-03-05',
    time: '14:00',
    duration: '90 min',
    mentorName: 'Zanele Mthembu',
    status: 'upcoming',
    description: 'Hands-on workshop covering stock rotation and ordering best practices.',
  },
  {
    id: 'session-003',
    title: 'Group Discussion: Growth Strategies',
    type: 'group',
    date: '2025-03-07',
    time: '11:00',
    duration: '60 min',
    mentorName: 'Thabo Mokoena',
    status: 'upcoming',
    description: 'Peer learning session sharing growth experiences and strategies.',
  },
  {
    id: 'session-004',
    title: 'Financial Planning Session',
    type: 'one-on-one',
    date: '2025-03-10',
    time: '09:00',
    duration: '45 min',
    mentorName: 'Thabo Mokoena',
    status: 'upcoming',
    description: 'Review financial goals and create action plan for the month.',
  },
  {
    id: 'session-005',
    title: 'Marketing Masterclass',
    type: 'workshop',
    date: '2025-03-12',
    time: '15:00',
    duration: '120 min',
    mentorName: 'Nomsa Dlamini',
    status: 'upcoming',
    description: 'Learn practical marketing techniques for small retail businesses.',
  },
  {
    id: 'session-006',
    title: 'Completed: Initial Assessment',
    type: 'one-on-one',
    date: '2025-01-10',
    time: '10:00',
    duration: '60 min',
    mentorName: 'Thabo Mokoena',
    status: 'completed',
    description: 'Initial business assessment and goal setting session.',
  },
]

export async function GET() {
  try {
    const totalMentors = mockMentors.length
    const availableMentors = mockMentors.filter(m => m.availability === 'available').length
    const activePrograms = mockPrograms.filter(p => p.status === 'active').length
    const totalMentees = mockPrograms.reduce((sum, p) => sum + p.menteeCount, 0)
    const avgRating =
      Math.round(
        (mockMentors.reduce((sum, m) => sum + m.rating, 0) / totalMentors) * 10
      ) / 10
    const upcomingSessions = mockSchedule.filter(s => s.status === 'upcoming').length

    return NextResponse.json({
      success: true,
      data: {
        programs: mockPrograms,
        mentors: mockMentors,
        matches: mockMatches,
        schedule: mockSchedule,
        stats: {
          totalMentors,
          availableMentors,
          activePrograms,
          totalMentees,
          avgRating,
          upcomingSessions,
          activeMatches: mockMatches.filter(m => m.status === 'active').length,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching mentorship data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch mentorship data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mentorId, programId, action, message } = body

    if (action === 'create-match') {
      if (!mentorId || !programId) {
        return NextResponse.json(
          { success: false, error: 'mentorId and programId are required' },
          { status: 400 }
        )
      }

      const mentor = mockMentors.find(m => m.id === mentorId)
      const program = mockPrograms.find(p => p.id === programId)

      if (!mentor) {
        return NextResponse.json(
          { success: false, error: 'Mentor not found' },
          { status: 404 }
        )
      }

      if (!program) {
        return NextResponse.json(
          { success: false, error: 'Program not found' },
          { status: 404 }
        )
      }

      const matchScore = Math.floor(Math.random() * 20) + 80

      return NextResponse.json({
        success: true,
        data: {
          match: {
            id: `match-${Date.now()}`,
            mentorId: mentor.id,
            mentorName: mentor.name,
            menteeId: 'user-001',
            menteeName: 'Current User',
            programId: program.id,
            programName: program.name,
            matchScore,
            status: 'pending' as const,
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            sessionCount: 0,
            nextSessionDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          },
          message: `Mentorship match request sent to ${mentor.name} for "${program.name}"`,
        },
      })
    }

    if (action === 'send-message') {
      if (!mentorId || !message) {
        return NextResponse.json(
          { success: false, error: 'mentorId and message are required' },
          { status: 400 }
        )
      }

      const mentor = mockMentors.find(m => m.id === mentorId)
      if (!mentor) {
        return NextResponse.json(
          { success: false, error: 'Mentor not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          message: {
            id: `msg-${Date.now()}`,
            senderId: 'user-001',
            recipientId: mentorId,
            content: message,
            timestamp: new Date().toISOString(),
            read: false,
          },
        },
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Supported actions: create-match, send-message' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error processing mentorship request:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
