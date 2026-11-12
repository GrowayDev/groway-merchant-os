import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, quality = 'speed', duration = 5 } = body

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    // Create video generation task
    const task = await zai.video.generations.create({
      prompt,
      quality,
      duration,
      fps: 30,
      size: '1920x1080'
    })

    return NextResponse.json({
      success: true,
      taskId: task.id,
      status: task.task_status
    })
  } catch (error) {
    console.error('Video generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate video', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId is required' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()
    const result = await zai.async.result.query(taskId)

    const response: {
      taskId: string
      status: string
      videoUrl?: string
    } = {
      taskId,
      status: result.task_status
    }

    if (result.task_status === 'SUCCESS') {
      const videoUrl = result.video_result?.[0]?.url ||
                      (result as Record<string, unknown>).video_url as string ||
                      (result as Record<string, unknown>).url as string ||
                      (result as Record<string, unknown>).video as string
      if (videoUrl) {
        response.videoUrl = videoUrl
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Video status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check video status', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
