import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// Types for scheduled report delivery
interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom'
  runAt: string // HH:MM format
  dayOfWeek?: number // 0-6 for weekly
  dayOfMonth?: number // 1-31 for monthly
  timezone: string
  customCron?: string
}

interface DeliveryConfig {
  channels: ('email' | 'webhook' | 'in_app')[]
  recipients?: string[]
  webhookUrl?: string
  webhookSecret?: string
}

// GET /api/reports/scheduled - List scheduled reports or get history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const action = searchParams.get('action') || 'list'
    const scheduleId = searchParams.get('scheduleId')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get execution history
    if (action === 'history') {
      if (!merchantId) {
        return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
      }

      const history = await db.reportExecution.findMany({
        where: {
          merchantId,
          scheduledReportId: scheduleId || undefined
        },
        include: {
          ScheduledReport: {
            select: { name: true, frequency: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      return NextResponse.json({
        success: true,
        data: history
      })
    }

    // Get upcoming scheduled runs
    if (action === 'upcoming') {
      if (!merchantId) {
        return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
      }

      const upcoming = await db.scheduledReport.findMany({
        where: {
          merchantId,
          isActive: true,
          status: 'active'
        },
        orderBy: { nextRunAt: 'asc' },
        take: limit
      })

      return NextResponse.json({
        success: true,
        data: upcoming
      })
    }

    // Get single scheduled report
    if (scheduleId) {
      const schedule = await db.scheduledReport.findUnique({
        where: { id: scheduleId },
        include: {
          CustomReport: true,
          ReportExecution: {
            take: 20,
            orderBy: { createdAt: 'desc' }
          }
        }
      })

      if (!schedule) {
        return NextResponse.json({ error: 'Scheduled report not found' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: schedule
      })
    }

    // List all scheduled reports for merchant
    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
    }

    const schedules = await db.scheduledReport.findMany({
      where: { merchantId },
      include: {
        CustomReport: {
          select: {
            name: true,
            reportType: true,
            dataSource: true
          }
        },
        _count: {
          select: { ReportExecution: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: schedules
    })
  } catch (error) {
    console.error('Error in scheduled reports API:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

// POST /api/reports/scheduled - Create scheduled report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      merchantId, 
      reportId, 
      name, 
      description,
      frequency,
      runAt,
      dayOfWeek,
      dayOfMonth,
      timezone,
      customCron,
      periodType,
      customStartDate,
      customEndDate,
      deliveryChannels,
      recipients,
      webhookUrl,
      webhookSecret,
      exportFormat,
      includeSummary,
      includeCharts,
      notifyOnSuccess,
      notifyOnFailure,
      notificationEmail,
      retryOnFailure,
      maxRetries,
      createdBy,
      createdByName
    } = body

    // Validate required fields
    if (!merchantId || !reportId || !name) {
      return NextResponse.json({ 
        error: 'merchantId, reportId, and name are required' 
      }, { status: 400 })
    }

    // Check if report exists
    const report = await db.customReport.findUnique({
      where: { id: reportId }
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Calculate next run time
    const nextRunAt = calculateNextRunTime({
      frequency: frequency || 'daily',
      runAt: runAt || '08:00',
      dayOfWeek,
      dayOfMonth,
      timezone: timezone || 'Africa/Johannesburg',
      customCron
    })

    // Create scheduled report
    const schedule = await db.scheduledReport.create({
      data: {
        id: nanoid(),
        merchantId,
        reportId,
        name,
        description,
        frequency: frequency || 'daily',
        runAt: runAt || '08:00',
        dayOfWeek,
        dayOfMonth,
        timezone: timezone || 'Africa/Johannesburg',
        customCron,
        periodType: periodType || 'previous_day',
        customStartDate,
        customEndDate,
        deliveryChannels: JSON.stringify(deliveryChannels || ['email']),
        recipients: recipients ? JSON.stringify(recipients) : null,
        webhookUrl,
        webhookSecret,
        exportFormat: exportFormat || 'pdf',
        includeSummary: includeSummary ?? true,
        includeCharts: includeCharts ?? true,
        notifyOnSuccess: notifyOnSuccess ?? false,
        notifyOnFailure: notifyOnFailure ?? true,
        notificationEmail,
        retryOnFailure: retryOnFailure ?? true,
        maxRetries: maxRetries || 3,
        createdBy,
        createdByName,
        nextRunAt
      }
    })

    // Update the custom report with schedule reference
    await db.customReport.update({
      where: { id: reportId },
      data: { scheduleId: schedule.id }
    })

    return NextResponse.json({
      success: true,
      data: schedule
    })
  } catch (error) {
    console.error('Error creating scheduled report:', error)
    return NextResponse.json({ error: 'Failed to create scheduled report' }, { status: 500 })
  }
}

// PUT /api/reports/scheduled - Update scheduled report
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { scheduleId, action, ...data } = body

    if (!scheduleId) {
      return NextResponse.json({ error: 'scheduleId is required' }, { status: 400 })
    }

    // Handle actions
    if (action === 'pause') {
      const schedule = await db.scheduledReport.update({
        where: { id: scheduleId },
        data: { 
          isActive: false, 
          status: 'paused',
          updatedAt: new Date() 
        }
      })

      return NextResponse.json({
        success: true,
        data: schedule,
        message: 'Scheduled report paused'
      })
    }

    if (action === 'resume') {
      const currentSchedule = await db.scheduledReport.findUnique({
        where: { id: scheduleId }
      })

      if (!currentSchedule) {
        return NextResponse.json({ error: 'Scheduled report not found' }, { status: 404 })
      }

      // Recalculate next run time
      const nextRunAt = calculateNextRunTime({
        frequency: currentSchedule.frequency,
        runAt: currentSchedule.runAt,
        dayOfWeek: currentSchedule.dayOfWeek ?? undefined,
        dayOfMonth: currentSchedule.dayOfMonth ?? undefined,
        timezone: currentSchedule.timezone,
        customCron: currentSchedule.customCron ?? undefined
      })

      const schedule = await db.scheduledReport.update({
        where: { id: scheduleId },
        data: { 
          isActive: true, 
          status: 'active',
          nextRunAt,
          updatedAt: new Date() 
        }
      })

      return NextResponse.json({
        success: true,
        data: schedule,
        message: 'Scheduled report resumed'
      })
    }

    if (action === 'run_now') {
      // Trigger immediate execution
      const execution = await db.reportExecution.create({
        data: {
          id: nanoid(),
          scheduledReportId: scheduleId,
          merchantId: data.merchantId,
          executionType: 'manual',
          triggeredBy: data.triggeredBy,
          triggeredByName: data.triggeredByName,
          status: 'pending'
        }
      })

      return NextResponse.json({
        success: true,
        data: execution,
        message: 'Report execution triggered'
      })
    }

    if (action === 'retry') {
      const executionId = data.executionId
      if (!executionId) {
        return NextResponse.json({ error: 'executionId is required for retry' }, { status: 400 })
      }

      // Get original execution
      const originalExecution = await db.reportExecution.findUnique({
        where: { id: executionId },
        include: { ScheduledReport: true }
      })

      if (!originalExecution) {
        return NextResponse.json({ error: 'Execution not found' }, { status: 404 })
      }

      // Create retry execution
      const retryExecution = await db.reportExecution.create({
        data: {
          id: nanoid(),
          scheduledReportId: scheduleId,
          merchantId: originalExecution.merchantId,
          executionType: 'manual',
          triggeredBy: data.triggeredBy,
          triggeredByName: data.triggeredByName,
          status: 'pending',
          retryFor: executionId,
          retryCount: originalExecution.retryCount + 1
        }
      })

      return NextResponse.json({
        success: true,
        data: retryExecution,
        message: 'Retry execution created'
      })
    }

    // Regular update
    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    
    const directFields = [
      'name', 'description', 'frequency', 'runAt', 'dayOfWeek', 'dayOfMonth',
      'timezone', 'customCron', 'periodType', 'customStartDate', 'customEndDate',
      'webhookUrl', 'webhookSecret', 'exportFormat', 'includeSummary', 'includeCharts',
      'notifyOnSuccess', 'notifyOnFailure', 'notificationEmail', 'retryOnFailure', 'maxRetries'
    ]

    const jsonFields = ['deliveryChannels', 'recipients']

    for (const field of directFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field]
      }
    }

    for (const field of jsonFields) {
      if (data[field] !== undefined) {
        updateData[field] = JSON.stringify(data[field])
      }
    }

    // Recalculate next run time if schedule changed
    if (data.frequency || data.runAt || data.dayOfWeek !== undefined || 
        data.dayOfMonth !== undefined || data.timezone || data.customCron) {
      const current = await db.scheduledReport.findUnique({ where: { id: scheduleId } })
      if (current) {
        updateData['nextRunAt'] = calculateNextRunTime({
          frequency: data.frequency || current.frequency,
          runAt: data.runAt || current.runAt,
          dayOfWeek: data.dayOfWeek ?? current.dayOfWeek ?? undefined,
          dayOfMonth: data.dayOfMonth ?? current.dayOfMonth ?? undefined,
          timezone: data.timezone || current.timezone,
          customCron: data.customCron ?? current.customCron ?? undefined
        })
      }
    }

    const schedule = await db.scheduledReport.update({
      where: { id: scheduleId },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: schedule
    })
  } catch (error) {
    console.error('Error updating scheduled report:', error)
    return NextResponse.json({ error: 'Failed to update scheduled report' }, { status: 500 })
  }
}

// DELETE /api/reports/scheduled - Delete scheduled report
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('scheduleId')

    if (!scheduleId) {
      return NextResponse.json({ error: 'scheduleId is required' }, { status: 400 })
    }

    // Get the scheduled report to find linked custom report
    const schedule = await db.scheduledReport.findUnique({
      where: { id: scheduleId },
      select: { reportId: true }
    })

    // Delete scheduled report (cascades to executions)
    await db.scheduledReport.delete({
      where: { id: scheduleId }
    })

    // Update custom report to remove schedule reference
    if (schedule) {
      await db.customReport.update({
        where: { id: schedule.reportId },
        data: { scheduleId: null }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Scheduled report deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting scheduled report:', error)
    return NextResponse.json({ error: 'Failed to delete scheduled report' }, { status: 500 })
  }
}

// Helper function to calculate next run time
function calculateNextRunTime(config: ScheduleConfig): Date {
  const now = new Date()
  const [hours, minutes] = config.runAt.split(':').map(Number)
  
  let nextRun = new Date()
  nextRun.setHours(hours, minutes, 0, 0)

  // If time has passed today, start from tomorrow
  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1)
  }

  switch (config.frequency) {
    case 'daily':
      // Already set to next day at specified time
      break

    case 'weekly':
      const targetDay = config.dayOfWeek ?? 1 // Default Monday
      const currentDay = nextRun.getDay()
      let daysUntilTarget = targetDay - currentDay
      
      if (daysUntilTarget <= 0) {
        daysUntilTarget += 7
      }
      
      // If same day but time has passed, go to next week
      if (daysUntilTarget === 0 && nextRun <= now) {
        daysUntilTarget = 7
      }
      
      nextRun.setDate(nextRun.getDate() + daysUntilTarget)
      break

    case 'monthly':
      const targetDate = config.dayOfMonth ?? 1
      nextRun.setDate(targetDate)
      
      // If that date has passed this month, go to next month
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1)
        nextRun.setDate(targetDate)
      }
      
      // Handle months with fewer days
      while (nextRun.getDate() !== targetDate) {
        nextRun.setMonth(nextRun.getMonth() + 1)
        nextRun.setDate(targetDate)
      }
      break

    case 'quarterly':
      // Run on the 1st of January, April, July, October
      const quarterMonths = [0, 3, 6, 9] // 0-indexed months
      const currentMonth = now.getMonth()
      
      let nextQuarterMonth = quarterMonths.find(m => m > currentMonth)
      if (nextQuarterMonth === undefined) {
        nextQuarterMonth = 0 // January next year
        nextRun.setFullYear(nextRun.getFullYear() + 1)
      }
      
      nextRun.setMonth(nextQuarterMonth)
      nextRun.setDate(1)
      
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 3)
      }
      break

    case 'custom':
      // For custom cron, just schedule for next day at the specified time
      // In production, this would use a proper cron parser
      break
  }

  return nextRun
}

// Email delivery function (mock implementation)
async function sendEmailDelivery(
  recipients: string[],
  subject: string,
  htmlContent: string,
  attachment?: { filename: string; content: Buffer }
): Promise<{ success: boolean; error?: string }> {
  // In production, this would use an email service like SendGrid, AWS SES, etc.
  console.log(`[MOCK] Sending email to: ${recipients.join(', ')}`)
  console.log(`[MOCK] Subject: ${subject}`)
  
  return { success: true }
}

// Webhook delivery function
async function sendWebhookDelivery(
  url: string,
  secret: string | undefined,
  payload: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    // In production, this would make an actual HTTP request
    console.log(`[MOCK] Sending webhook to: ${url}`)
    console.log(`[MOCK] Payload:`, JSON.stringify(payload, null, 2))
    
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
