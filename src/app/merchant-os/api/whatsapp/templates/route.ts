import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// Valid template categories
const VALID_CATEGORIES = ['auth', 'marketing', 'utility'] as const

// Valid template statuses
const VALID_STATUSES = ['pending', 'approved', 'rejected'] as const

// GET /api/whatsapp/templates - List all WhatsApp templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const configId = searchParams.get('configId')
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const language = searchParams.get('language')

    const where: Prisma.WhatsAppTemplateWhereInput = {}
    
    if (configId) {
      where.configId = configId
    }
    if (category && VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
      where.category = category
    }
    if (status && VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
      where.status = status
    }
    if (language) {
      where.language = language
    }

    const templates = await db.whatsAppTemplate.findMany({
      where,
      orderBy: [
        { status: 'asc' }, // Show approved templates first
        { createdAt: 'desc' }
      ],
      include: {
        config: {
          select: {
            phoneNumber: true,
            merchantId: true
          }
        }
      }
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching WhatsApp templates:', error)
    return NextResponse.json({ error: 'Failed to fetch WhatsApp templates' }, { status: 500 })
  }
}

// POST /api/whatsapp/templates - Create a new WhatsApp template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.configId) {
      return NextResponse.json({ error: 'configId is required' }, { status: 400 })
    }
    if (!body.name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    if (!body.category) {
      return NextResponse.json({ error: 'category is required' }, { status: 400 })
    }
    if (!body.bodyText) {
      return NextResponse.json({ error: 'bodyText is required' }, { status: 400 })
    }

    // Validate category
    if (!VALID_CATEGORIES.includes(body.category)) {
      return NextResponse.json({ 
        error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` 
      }, { status: 400 })
    }

    // Validate status if provided
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` 
      }, { status: 400 })
    }

    // Check if config exists
    const config = await db.whatsAppConfig.findUnique({
      where: { id: body.configId }
    })

    if (!config) {
      return NextResponse.json({ error: 'WhatsApp configuration not found' }, { status: 404 })
    }

    // Validate template name format (WhatsApp requirements)
    const nameRegex = /^[a-z0-9_]+$/
    if (!nameRegex.test(body.name)) {
      return NextResponse.json({ 
        error: 'Template name must only contain lowercase letters, numbers, and underscores' 
      }, { status: 400 })
    }

    // Check for duplicate template name + language
    const existingTemplate = await db.whatsAppTemplate.findFirst({
      where: {
        configId: body.configId,
        name: body.name,
        language: body.language || 'en'
      }
    })

    if (existingTemplate) {
      return NextResponse.json({ 
        error: 'Template with this name and language already exists' 
      }, { status: 400 })
    }

    // Validate body text has proper variable placeholders
    const variableRegex = /\{\{(\d+)\}\}/g
    const variables = body.bodyText.match(variableRegex) || []
    const uniqueVariables = [...new Set(variables)]
    
    // Check if variables are sequential (1, 2, 3...)
    if (uniqueVariables.length > 0) {
      const varNumbers = uniqueVariables
        .map(v => parseInt(v.replace(/[{}]/g, '')))
        .sort((a, b) => a - b)
      
      for (let i = 0; i < varNumbers.length; i++) {
        if (varNumbers[i] !== i + 1) {
          return NextResponse.json({ 
            error: 'Template variables must be sequential starting from 1 (e.g., {{1}}, {{2}}, {{3}})' 
          }, { status: 400 })
        }
      }
    }

    // Validate buttons if provided
    let buttonsJson = null
    if (body.buttons) {
      if (!Array.isArray(body.buttons)) {
        return NextResponse.json({ error: 'buttons must be an array' }, { status: 400 })
      }
      
      // Validate button structure
      for (const button of body.buttons) {
        if (!button.type || !['QUICK_REPLY', 'URL', 'CALL'].includes(button.type)) {
          return NextResponse.json({ 
            error: 'Button type must be one of: QUICK_REPLY, URL, CALL' 
          }, { status: 400 })
        }
        if (!button.text) {
          return NextResponse.json({ error: 'Button text is required' }, { status: 400 })
        }
        if (button.type === 'URL' && !button.url) {
          return NextResponse.json({ error: 'URL is required for URL buttons' }, { status: 400 })
        }
        if (button.type === 'CALL' && !button.phone_number) {
          return NextResponse.json({ error: 'phone_number is required for CALL buttons' }, { status: 400 })
        }
      }
      
      buttonsJson = JSON.stringify(body.buttons)
    }

    // Create the template
    const template = await db.whatsAppTemplate.create({
      data: {
        configId: body.configId,
        name: body.name.toLowerCase(),
        language: body.language || 'en',
        category: body.category,
        bodyText: body.bodyText,
        headerText: body.headerText,
        footerText: body.footerText,
        buttons: buttonsJson,
        status: body.status || 'pending'
      }
    })

    // In a real implementation, you would submit to WhatsApp Business API here
    // For now, we'll simulate a successful submission
    const whatsappTemplateId = `${template.name}_${template.language}_${Date.now()}`
    
    const updatedTemplate = await db.whatsAppTemplate.update({
      where: { id: template.id },
      data: {
        whatsappTemplateId
      }
    })

    return NextResponse.json({ 
      template: updatedTemplate,
      whatsappTemplateId 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating WhatsApp template:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'Template with this name and language already exists' }, { status: 400 })
      }
    }
    return NextResponse.json({ error: 'Failed to create WhatsApp template' }, { status: 500 })
  }
}
