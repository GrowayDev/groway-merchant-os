import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Mock agent ID for authentication
const MOCK_AGENT_ID = 'sales-demo-001'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    // Fetch all training modules
    const modulesWhere: any = {
      active: true,
    }
    
    if (category && category !== 'all') {
      modulesWhere.category = category
    }

    let modules = await db.salesforceTrainingModule.findMany({
      where: modulesWhere,
      orderBy: { orderIndex: 'asc' },
    })

    // If no modules exist, seed demo modules
    if (modules.length === 0) {
      await seedDemoModules()
      modules = await db.salesforceTrainingModule.findMany({
        where: modulesWhere,
        orderBy: { orderIndex: 'asc' },
      })
    }

    // Fetch progress for each module
    const progressRecords = await db.salesforceTrainingProgress.findMany({
      where: { agentId: MOCK_AGENT_ID },
    })

    // Create a map of module progress
    const progressMap = progressRecords.reduce((acc: any, p: any) => {
      acc[p.moduleId] = p
      return acc
    }, {})

    // Combine modules with progress
    let trainingData = modules.map((trainingModule: any) => {
      const progress = progressMap[trainingModule.id]
      return formatModule(trainingModule, progress)
    })

    // Filter by status if provided
    if (status && status !== 'all') {
      trainingData = trainingData.filter((m: any) => m.progress.status === status)
    }

    // Calculate overall progress
    const totalModules = trainingData.length
    const completedModules = trainingData.filter((m: any) => m.progress.status === 'completed').length
    const overallProgress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0

    // Calculate total time spent
    const totalTimeSpent = trainingData.reduce((sum: number, m: any) => sum + (m.progress.timeSpent || 0), 0)

    // Get counts by category
    const categoryCounts = trainingData.reduce((acc: any, m: any) => {
      if (!acc[m.category]) {
        acc[m.category] = { total: 0, completed: 0 }
      }
      acc[m.category].total++
      if (m.progress.status === 'completed') {
        acc[m.category].completed++
      }
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      data: trainingData,
      summary: {
        totalModules,
        completedModules,
        inProgressModules: trainingData.filter((m: any) => m.progress.status === 'in_progress').length,
        notStartedModules: trainingData.filter((m: any) => m.progress.status === 'not_started').length,
        overallProgress,
        totalTimeSpent,
        certificationProgress: overallProgress >= 100,
      },
      categories: Object.entries(categoryCounts).map(([key, value]: [string, any]) => ({
        name: key,
        total: value.total,
        completed: value.completed,
        progress: Math.round((value.completed / value.total) * 100),
      })),
    })
  } catch (error) {
    console.error('Error fetching training:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch training data' },
      { status: 500 }
    )
  }
}

// POST to update progress on a module
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { moduleId, action, data } = body

    if (!moduleId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: moduleId, action' },
        { status: 400 }
      )
    }

    const validActions = ['start', 'complete', 'submit_quiz', 'update_progress']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      )
    }

    // Check if progress record exists
    let progress = await db.salesforceTrainingProgress.findUnique({
      where: {
        agentId_moduleId: {
          agentId: MOCK_AGENT_ID,
          moduleId,
        }
      }
    })

    if (!progress) {
      // Create new progress record
      progress = await db.salesforceTrainingProgress.create({
        data: {
          id: `tp-${Date.now()}`,
          agentId: MOCK_AGENT_ID,
          moduleId,
          status: 'not_started',
          progress: 0,
        }
      })
    }

    // Get the training module to check requirements
    const trainingModule = await db.salesforceTrainingModule.findUnique({
      where: { id: moduleId },
    })

    if (!trainingModule) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
        { status: 404 }
      )
    }

    let updateData: any = {}

    switch (action) {
      case 'start':
        updateData = {
          status: 'in_progress',
          startedAt: new Date(),
        }
        break

      case 'complete':
        updateData = {
          status: 'completed',
          progress: 100,
          completedAt: new Date(),
        }
        break

      case 'submit_quiz':
        const quizScore = data?.score || 0
        const passed = quizScore >= trainingModule.passingScore
        
        updateData = {
          quizScore,
          quizAttempts: { increment: 1 },
          quizPassedAt: passed ? new Date() : null,
          status: passed ? 'completed' : progress.status,
          completedAt: passed ? new Date() : progress.completedAt,
        }
        break

      case 'update_progress':
        const newProgress = data?.progress || 0
        updateData = {
          progress: newProgress,
          timeSpent: (progress.timeSpent || 0) + (data?.timeSpent || 0),
          status: newProgress >= 100 ? 'completed' : (newProgress > 0 ? 'in_progress' : 'not_started'),
          completedAt: newProgress >= 100 ? new Date() : null,
        }
        break
    }

    const updatedProgress = await db.salesforceTrainingProgress.update({
      where: { id: progress.id },
      data: updateData,
    })

    // Update agent training progress
    const allProgress = await db.salesforceTrainingProgress.findMany({
      where: { agentId: MOCK_AGENT_ID },
    })
    
    const totalModules = await db.salesforceTrainingModule.count({ where: { active: true, required: true } })
    const completedCount = allProgress.filter((p: any) => p.status === 'completed').length
    const overallProgress = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0

    await db.salesforceAgent.update({
      where: { id: MOCK_AGENT_ID },
      data: {
        trainingProgress: overallProgress,
        trainingCompleted: overallProgress >= 100,
        trainingCompletedAt: overallProgress >= 100 ? new Date() : null,
      }
    })

    return NextResponse.json({
      success: true,
      data: formatModule(trainingModule, updatedProgress),
      message: `Training ${action} successful`
    })
  } catch (error) {
    console.error('Error updating training progress:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update training progress' },
      { status: 500 }
    )
  }
}

// Helper function to format training module with progress
function formatModule(trainingModule: any, progress: any) {
  return {
    id: trainingModule.id,
    title: trainingModule.title,
    description: trainingModule.description,
    category: trainingModule.category,
    duration: trainingModule.duration,
    orderIndex: trainingModule.orderIndex,
    required: trainingModule.required,
    prerequisites: trainingModule.prerequisites ? JSON.parse(trainingModule.prerequisites) : [],
    content: {
      markdown: trainingModule.content,
      videoUrl: trainingModule.videoUrl,
    },
    assessment: {
      hasQuiz: trainingModule.hasQuiz,
      quizQuestions: trainingModule.quizQuestions ? JSON.parse(trainingModule.quizQuestions) : [],
      passingScore: trainingModule.passingScore,
    },
    progress: {
      status: progress?.status || 'not_started',
      percentage: progress?.progress || 0,
      startedAt: progress?.startedAt || null,
      completedAt: progress?.completedAt || null,
      timeSpent: progress?.timeSpent || 0,
      quiz: {
        score: progress?.quizScore || null,
        attempts: progress?.quizAttempts || 0,
        passedAt: progress?.quizPassedAt || null,
      },
    },
    createdAt: trainingModule.createdAt,
    updatedAt: trainingModule.updatedAt,
  }
}

// Seed demo training modules if none exist
async function seedDemoModules() {
  const demoModules = [
    {
      id: 'tm-001',
      title: 'Product Knowledge',
      description: 'Learn about Groway products and features',
      category: 'product',
      duration: 45,
      orderIndex: 1,
      required: true,
      hasQuiz: true,
      passingScore: 70,
    },
    {
      id: 'tm-002',
      title: 'Sales Techniques',
      description: 'Master effective sales strategies and closing techniques',
      category: 'sales',
      duration: 30,
      orderIndex: 2,
      required: true,
      hasQuiz: true,
      passingScore: 70,
    },
    {
      id: 'tm-003',
      title: 'CRM Training',
      description: 'Learn to use the CRM system effectively',
      category: 'crm',
      duration: 20,
      orderIndex: 3,
      required: true,
      hasQuiz: false,
      passingScore: 70,
    },
    {
      id: 'tm-004',
      title: 'Territory Planning',
      description: 'Strategies for effective territory management',
      category: 'sales',
      duration: 25,
      orderIndex: 4,
      required: false,
      hasQuiz: false,
      passingScore: 70,
    },
    {
      id: 'tm-005',
      title: 'Compliance & Ethics',
      description: 'Understanding regulatory requirements and ethical selling',
      category: 'compliance',
      duration: 15,
      orderIndex: 5,
      required: true,
      hasQuiz: true,
      passingScore: 80,
    },
  ]

  for (const demoModule of demoModules) {
    try {
      await db.salesforceTrainingModule.create({
        data: {
          ...demoModule,
          content: null,
          videoUrl: null,
          prerequisites: null,
          quizQuestions: null,
        }
      })
    } catch (e) {
      // Module may already exist
    }
  }
}
