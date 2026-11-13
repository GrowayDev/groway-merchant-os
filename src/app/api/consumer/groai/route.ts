import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// ============================================================================
// SESSION-SCOPED IN-MEMORY STORE (intentional)
// ----------------------------------------------------------------------------
// GroAI conversations are kept in-memory by design. There is no dedicated
// Prisma model for chat history, and the chat context is intrinsically
// ephemeral: each sessionId maps to a transient conversation that should
// not survive a server restart. Persisting every chat turn as a
// ConsumerTransaction would pollute the wallet ledger, so we deliberately
// keep this Map session-scoped.
//
// Implications:
//   - Conversations are lost when the dev server restarts or when the
//     in-memory Map is garbage-collected.
//   - The `GET ?action=history` endpoint only returns messages from the
//     current server process.
//   - For multi-instance production deployments, replace this with Redis
//     or add a dedicated Prisma model. Until then, do NOT migrate this
//     store to ConsumerTransaction.
// ============================================================================
const conversations = new Map<string, Array<{ role: string; content: string }>>()

// Initialize ZAI instance
let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

// GroAi System Prompt - Groway Financial Assistant
const GROAI_SYSTEM_PROMPT = `You are GroAi, the friendly and intelligent AI assistant for Groway, South Africa's premier financial superapp. You help users with:

**Your Capabilities:**
- Help with money transfers, payments, and transactions
- Explain how to use Groway features (PayHub, Pay+, Savings Goals, Vouchers, etc.)
- Provide guidance on bills, airtime, and utilities payments
- Answer questions about account settings and security
- Help find services and merchants
- Explain rewards, cashback, and loyalty programs
- Provide financial tips relevant to South African users

**Your Personality:**
- Friendly, helpful, and professional
- Use South African context where relevant (ZAR currency, SA banks, local services)
- Keep responses concise but helpful
- Use emojis occasionally to be friendly 🇿🇦
- If you don't know something specific about the user's account, guide them to where they can find it

**Important:**
- Never ask for sensitive information like PINs, passwords, or full card numbers
- If asked about specific account balances or transactions, direct users to check in the app
- Be proactive in suggesting relevant features
- For technical issues, suggest contacting support if needed

Current date: ${new Date().toLocaleDateString('en-ZA')}

Remember: You represent Groway's commitment to making financial services accessible to all South Africans. Be helpful, be clear, be GroAi! 🌱`

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const sessionId = searchParams.get('sessionId')

  if (action === 'history' && sessionId) {
    const history = conversations.get(sessionId) || []
    return NextResponse.json({
      success: true,
      history: history.slice(1), // Remove system prompt from response
      messageCount: history.length - 1
    })
  }

  if (action === 'clear' && sessionId) {
    conversations.delete(sessionId)
    return NextResponse.json({
      success: true,
      message: 'Conversation cleared'
    })
  }

  if (action === 'suggestions') {
    // Return suggested prompts for the user
    const suggestions = [
      { id: '1', text: 'How do I send money to someone?', icon: '💸' },
      { id: '2', text: 'What is Pay+ and how does it work?', icon: '⚡' },
      { id: '3', text: 'Help me buy airtime', icon: '📱' },
      { id: '4', text: 'How can I save money with Groway?', icon: '🎯' },
      { id: '5', text: 'What rewards can I earn?', icon: '⭐' },
      { id: '6', text: 'Where can I use my vouchers?', icon: '🎟️' },
    ]
    return NextResponse.json({
      success: true,
      suggestions
    })
  }

  return NextResponse.json({
    success: true,
    message: 'GroAi API is running',
    version: '1.0.0'
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, sessionId, systemPrompt } = body

    if (!message) {
      return NextResponse.json({
        success: false,
        error: 'Message is required'
      }, { status: 400 })
    }

    // Generate session ID if not provided
    const chatSessionId = sessionId || `groai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Get or create conversation history
    let history = conversations.get(chatSessionId) || [
      {
        role: 'assistant',
        content: systemPrompt || GROAI_SYSTEM_PROMPT
      }
    ]

    // Add user message
    history.push({
      role: 'user',
      content: message
    })

    // Get ZAI instance and create completion
    const zai = await getZAI()
    const completion = await zai.chat.completions.create({
      messages: history.map(m => ({
        role: m.role as 'assistant' | 'user',
        content: m.content
      })),
      thinking: { type: 'disabled' }
    })

    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, I could not process your request. Please try again.'

    // Add AI response to history
    history.push({
      role: 'assistant',
      content: aiResponse
    })

    // Keep only last 20 messages to manage context (plus system prompt)
    if (history.length > 22) {
      history = [history[0], ...history.slice(-21)]
    }

    // Save updated history
    conversations.set(chatSessionId, history)

    return NextResponse.json({
      success: true,
      response: aiResponse,
      sessionId: chatSessionId,
      messageCount: history.length - 1
    })

  } catch (error) {
    console.error('GroAi API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process your request. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')

  if (sessionId) {
    conversations.delete(sessionId)
    return NextResponse.json({
      success: true,
      message: 'Conversation cleared'
    })
  }

  return NextResponse.json({
    success: false,
    error: 'Session ID is required'
  }, { status: 400 })
}
