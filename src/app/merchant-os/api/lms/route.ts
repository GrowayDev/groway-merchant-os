import { NextRequest, NextResponse } from 'next/server'

interface Lesson {
  id: string
  title: string
  duration: string
  completed: boolean
}

interface Course {
  id: string
  title: string
  category: string
  duration: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  description: string
  progress: number
  status: 'not_started' | 'in_progress' | 'completed'
  lessonsCount: number
  lessons: Lesson[]
  image?: string
}

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  earned: boolean
  earnedDate?: string
}

const mockCourses: Course[] = [
  {
    id: 'course-001',
    title: 'Stock Management Basics',
    category: 'Operations',
    duration: '2 hours',
    difficulty: 'beginner',
    description: 'Learn the fundamentals of stock management for spaza shops, including ordering, receiving, and tracking inventory.',
    progress: 75,
    status: 'in_progress',
    lessonsCount: 8,
    lessons: [
      { id: 'l1', title: 'Introduction to Stock Management', duration: '15 min', completed: true },
      { id: 'l2', title: 'Understanding Stock Levels', duration: '20 min', completed: true },
      { id: 'l3', title: 'Ordering Best Practices', duration: '18 min', completed: true },
      { id: 'l4', title: 'Receiving Deliveries', duration: '15 min', completed: true },
      { id: 'l5', title: 'Stock Tracking Methods', duration: '20 min', completed: true },
      { id: 'l6', title: 'Managing Expired Goods', duration: '15 min', completed: true },
      { id: 'l7', title: 'Stock Taking Procedures', duration: '18 min', completed: false },
      { id: 'l8', title: 'Quiz & Assessment', duration: '10 min', completed: false },
    ],
  },
  {
    id: 'course-002',
    title: 'Customer Service Excellence',
    category: 'Soft Skills',
    duration: '1.5 hours',
    difficulty: 'beginner',
    description: 'Master customer service skills to build loyalty and increase repeat business in your spaza shop.',
    progress: 100,
    status: 'completed',
    lessonsCount: 6,
    lessons: [
      { id: 'l9', title: 'Why Customer Service Matters', duration: '15 min', completed: true },
      { id: 'l10', title: 'Handling Difficult Customers', duration: '20 min', completed: true },
      { id: 'l11', title: 'Building Customer Relationships', duration: '15 min', completed: true },
      { id: 'l12', title: 'Upselling Techniques', duration: '18 min', completed: true },
      { id: 'l13', title: 'Communication Skills', duration: '15 min', completed: true },
      { id: 'l14', title: 'Final Assessment', duration: '10 min', completed: true },
    ],
  },
  {
    id: 'course-003',
    title: 'Financial Literacy for Retail',
    category: 'Finance',
    duration: '3 hours',
    difficulty: 'intermediate',
    description: 'Understand basic financial concepts including profit margins, cash flow, and budgeting for your retail business.',
    progress: 40,
    status: 'in_progress',
    lessonsCount: 10,
    lessons: [
      { id: 'l15', title: 'Understanding Revenue & Costs', duration: '20 min', completed: true },
      { id: 'l16', title: 'Calculating Profit Margins', duration: '18 min', completed: true },
      { id: 'l17', title: 'Cash Flow Management', duration: '22 min', completed: true },
      { id: 'l18', title: 'Budgeting Basics', duration: '20 min', completed: true },
      { id: 'l19', title: 'Reading Financial Statements', duration: '25 min', completed: false },
      { id: 'l20', title: 'Managing Expenses', duration: '18 min', completed: false },
      { id: 'l21', title: 'Pricing Strategies', duration: '20 min', completed: false },
      { id: 'l22', title: 'Tax Basics for Retail', duration: '22 min', completed: false },
      { id: 'l23', title: 'Savings & Investment', duration: '18 min', completed: false },
      { id: 'l24', title: 'Final Assessment', duration: '15 min', completed: false },
    ],
  },
  {
    id: 'course-004',
    title: 'Food Safety & Hygiene',
    category: 'Compliance',
    duration: '2.5 hours',
    difficulty: 'beginner',
    description: 'Essential food safety practices to ensure compliance with health regulations and protect your customers.',
    progress: 0,
    status: 'not_started',
    lessonsCount: 7,
    lessons: [
      { id: 'l25', title: 'Introduction to Food Safety', duration: '20 min', completed: false },
      { id: 'l26', title: 'Personal Hygiene Standards', duration: '18 min', completed: false },
      { id: 'l27', title: 'Food Storage Guidelines', duration: '22 min', completed: false },
      { id: 'l28', title: 'Cross-Contamination Prevention', duration: '20 min', completed: false },
      { id: 'l29', title: 'Temperature Control', duration: '18 min', completed: false },
      { id: 'l30', title: 'Cleaning & Sanitization', duration: '20 min', completed: false },
      { id: 'l31', title: 'Compliance Certification', duration: '15 min', completed: false },
    ],
  },
  {
    id: 'course-005',
    title: 'POS System Training',
    category: 'Technology',
    duration: '1.5 hours',
    difficulty: 'beginner',
    description: 'Learn how to effectively use your Point of Sale system for daily transactions, reporting, and stock management.',
    progress: 100,
    status: 'completed',
    lessonsCount: 5,
    lessons: [
      { id: 'l32', title: 'POS System Overview', duration: '15 min', completed: true },
      { id: 'l33', title: 'Processing Transactions', duration: '20 min', completed: true },
      { id: 'l34', title: 'Managing Payments', duration: '18 min', completed: true },
      { id: 'l35', title: 'Daily Reports & Reconciliation', duration: '22 min', completed: true },
      { id: 'l36', title: 'Troubleshooting Common Issues', duration: '15 min', completed: true },
    ],
  },
  {
    id: 'course-006',
    title: 'Business Growth Strategies',
    category: 'Business',
    duration: '4 hours',
    difficulty: 'advanced',
    description: 'Advanced strategies for scaling your spaza shop business, including expansion planning and market analysis.',
    progress: 15,
    status: 'in_progress',
    lessonsCount: 12,
    lessons: [
      { id: 'l37', title: 'Assessing Growth Opportunities', duration: '20 min', completed: true },
      { id: 'l38', title: 'Market Analysis', duration: '25 min', completed: false },
      { id: 'l39', title: 'Competitive Positioning', duration: '20 min', completed: false },
      { id: 'l40', title: 'Product Line Expansion', duration: '22 min', completed: false },
      { id: 'l41', title: 'Customer Base Growth', duration: '18 min', completed: false },
      { id: 'l42', title: 'Digital Presence', duration: '20 min', completed: false },
      { id: 'l43', title: 'Supplier Relationships', duration: '18 min', completed: false },
      { id: 'l44', title: 'Staff Management', duration: '22 min', completed: false },
      { id: 'l45', title: 'Financial Planning for Growth', duration: '25 min', completed: false },
      { id: 'l46', title: 'Risk Management', duration: '20 min', completed: false },
      { id: 'l47', title: 'Scaling Operations', duration: '22 min', completed: false },
      { id: 'l48', title: 'Growth Action Plan', duration: '15 min', completed: false },
    ],
  },
  {
    id: 'course-007',
    title: 'Digital Marketing for Small Retail',
    category: 'Marketing',
    duration: '2 hours',
    difficulty: 'intermediate',
    description: 'Learn how to leverage digital marketing channels to attract and retain customers for your spaza shop.',
    progress: 0,
    status: 'not_started',
    lessonsCount: 8,
    lessons: [
      { id: 'l49', title: 'Introduction to Digital Marketing', duration: '15 min', completed: false },
      { id: 'l50', title: 'WhatsApp Business for Retail', duration: '18 min', completed: false },
      { id: 'l51', title: 'Social Media Basics', duration: '20 min', completed: false },
      { id: 'l52', title: 'Creating Promotions', duration: '15 min', completed: false },
      { id: 'l53', title: 'Customer Engagement Online', duration: '18 min', completed: false },
      { id: 'l54', title: 'Measuring Marketing Success', duration: '20 min', completed: false },
      { id: 'l55', title: 'Building a Brand', duration: '22 min', completed: false },
      { id: 'l56', title: 'Marketing Plan Template', duration: '15 min', completed: false },
    ],
  },
  {
    id: 'course-008',
    title: 'Inventory Control & Ordering',
    category: 'Operations',
    duration: '2.5 hours',
    difficulty: 'intermediate',
    description: 'Advanced inventory control techniques including reorder points, safety stock, and efficient ordering processes.',
    progress: 0,
    status: 'not_started',
    lessonsCount: 9,
    lessons: [
      { id: 'l57', title: 'Inventory Control Principles', duration: '18 min', completed: false },
      { id: 'l58', title: 'Reorder Point Calculation', duration: '22 min', completed: false },
      { id: 'l59', title: 'Safety Stock Management', duration: '20 min', completed: false },
      { id: 'l60', title: 'Demand Forecasting', duration: '25 min', completed: false },
      { id: 'l61', title: 'Supplier Management', duration: '18 min', completed: false },
      { id: 'l62', title: 'Bulk Ordering Strategies', duration: '20 min', completed: false },
      { id: 'l63', title: 'Waste Reduction', duration: '18 min', completed: false },
      { id: 'l64', title: 'Seasonal Planning', duration: '22 min', completed: false },
      { id: 'l65', title: 'Inventory Analytics', duration: '20 min', completed: false },
    ],
  },
]

const mockBadges: Badge[] = [
  { id: 'badge-001', name: 'First Steps', description: 'Complete your first lesson', icon: '🎯', earned: true, earnedDate: '2025-01-15' },
  { id: 'badge-002', name: 'Quick Learner', description: 'Complete 5 lessons in one day', icon: '⚡', earned: true, earnedDate: '2025-01-20' },
  { id: 'badge-003', name: 'Customer Champion', description: 'Complete Customer Service Excellence', icon: '🏆', earned: true, earnedDate: '2025-02-10' },
  { id: 'badge-004', name: 'Tech Savvy', description: 'Complete POS System Training', icon: '💻', earned: true, earnedDate: '2025-02-15' },
  { id: 'badge-005', name: 'Stock Master', description: 'Complete Stock Management Basics', icon: '📦', earned: false },
  { id: 'badge-006', name: 'Finance Whiz', description: 'Complete Financial Literacy course', icon: '💰', earned: false },
  { id: 'badge-007', name: 'Safety First', description: 'Complete Food Safety & Hygiene', icon: '🛡️', earned: false },
  { id: 'badge-008', name: 'Growth Mindset', description: 'Complete Business Growth Strategies', icon: '🚀', earned: false },
  { id: 'badge-009', name: 'Digital Marketer', description: 'Complete Digital Marketing course', icon: '📱', earned: false },
  { id: 'badge-010', name: 'Inventory Expert', description: 'Complete Inventory Control & Ordering', icon: '📊', earned: false },
]

export async function GET() {
  try {
    const totalCourses = mockCourses.length
    const completedCourses = mockCourses.filter(c => c.status === 'completed').length
    const inProgressCourses = mockCourses.filter(c => c.status === 'in_progress').length
    const totalLessons = mockCourses.reduce((sum, c) => sum + c.lessonsCount, 0)
    const completedLessons = mockCourses.reduce(
      (sum, c) => sum + c.lessons.filter(l => l.completed).length,
      0
    )
    const avgProgress = Math.round(
      mockCourses.reduce((sum, c) => sum + c.progress, 0) / totalCourses
    )
    const earnedBadges = mockBadges.filter(b => b.earned).length

    return NextResponse.json({
      success: true,
      data: {
        courses: mockCourses,
        badges: mockBadges,
        stats: {
          totalCourses,
          completedCourses,
          inProgressCourses,
          notStartedCourses: totalCourses - completedCourses - inProgressCourses,
          totalLessons,
          completedLessons,
          avgProgress,
          earnedBadges,
          totalBadges: mockBadges.length,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching LMS data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch learning data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { courseId, action } = body

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'courseId is required' },
        { status: 400 }
      )
    }

    const course = mockCourses.find(c => c.id === courseId)
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      )
    }

    if (action === 'enroll') {
      return NextResponse.json({
        success: true,
        data: {
          enrollment: {
            id: `enrollment-${Date.now()}`,
            courseId: course.id,
            courseTitle: course.title,
            userId: 'user-001',
            enrolledAt: new Date().toISOString(),
            status: 'active',
            progress: 0,
            estimatedCompletion: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          message: `Successfully enrolled in "${course.title}"`,
        },
      })
    }

    if (action === 'update-progress') {
      const newProgress = Math.min(100, Math.max(0, body.progress || 0))
      return NextResponse.json({
        success: true,
        data: {
          courseProgress: {
            courseId: course.id,
            progress: newProgress,
            status:
              newProgress === 100
                ? 'completed'
                : newProgress > 0
                  ? 'in_progress'
                  : 'not_started',
            updatedAt: new Date().toISOString(),
          },
          message: `Progress updated for "${course.title}"`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        course,
        message: 'Course data retrieved',
      },
    })
  } catch (error) {
    console.error('Error processing LMS request:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
