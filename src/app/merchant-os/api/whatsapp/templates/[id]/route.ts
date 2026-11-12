import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// Valid template categories
const VALID_CATEGORIES = ['auth', 'marketing', 'utility'] as const

// Valid template statuses
const VALID_STATUSES = ['pending', 'approved', 'rejected'] as const

// GET /api/whatsapp/templates/[id] - Get a single WhatsApp template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const template = await db.whatsAppTemplate.findUnique({
      where: { id },
      include: {
        config: {
          select: {
            id: true,
            phoneNumber: true,
            merchantId: true,
            status: true
          }
        }
      }
    })

    if (!template) {
      return NextResponse.json({ error: 'WhatsApp template not found' }, { status: 404 })
    }

    // Parse buttons if they exist
    let parsedButtons = null
    if (template.buttons) {
      try {
        parsedButtons = JSON.parse(template.buttons)
      } catch {
        parsedButtons = template.buttons
      }
    }

    // Extract variables from body text
    const variableRegex = /\{\{(\d+)\}\}/g
    const variables = template.bodyText.match(variableRegex) || []
    const uniqueVariables = [...new Set(variables)]

    return NextResponse.json({ 
      template: {
        ...template,
        parsedButtons,
        variables: uniqueVariables,
        variableCount: uniqueVariables.length
      }
    })
  } catch (error) {
    console.error('Error fetching WhatsApp template:', error)
    return NextResponse.json({ error: 'Failed to fetch WhatsApp template' }, { status: 500 })
  }
}

// PUT /api/whatsapp/templates/[id] - Update a WhatsApp template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if template exists
    const existingTemplate = await db.whatsAppTemplate.findUnique({
      where: { id }
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: 'WhatsApp template not found' }, { status: 404 })
    }

    // Cannot update approved templates directly
    if (existingTemplate.status === 'approved') {
      return NextResponse.json({ 
        error: 'Cannot update approved templates. Create a new version instead.' 
      }, { status: 400 })
    }

    // Validate category if provided
    if (body.category && !VALID_CATEGORIES.includes(body.category)) {
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

    // If name is being changed, validate format
    if (body.name) {
      const nameRegex = /^[a-z0-9_]+$/
      if (!nameRegex.test(body.name)) {
        return NextResponse.json({ 
          error: 'Template name must only contain lowercase letters, numbers, and underscores' 
        }, { status: 400 })
      }

      // Check for duplicate
      if (body.name !== existingTemplate.name || body.language !== existingTemplate.language) {
        const duplicate = await db.whatsAppTemplate.findFirst({
          where: {
            configId: existingTemplate.configId,
            name: body.name.toLowerCase(),
            language: body.language || existingTemplate.language,
            id: { not: id }
          }
        })

        if (duplicate) {
          return NextResponse.json({ 
            error: 'Template with this name and language already exists' 
          }, { status: 400 })
        }
      }
    }

    // Validate body text variables if provided
    if (body.bodyText) {
      const variableRegex = /\{\{(\d+)\}\}/g
      const variables = body.bodyText.match(variableRegex) || []
      const uniqueVariables = [...new Set(variables)]
      
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
    }

    // Validate buttons if provided
    let buttonsJson = existingTemplate.buttons
    if (body.buttons !== undefined) {
      if (body.buttons === null) {
        buttonsJson = null
      } else {
        if (!Array.isArray(body.buttons)) {
          return NextResponse.json({ error: 'buttons must be an array' }, { status: 400 })
        }
        
        for (const button of body.buttons) {
          if (!button.type || !['QUICK_REPLY', 'URL', 'CALL'].includes(button.type)) {
            return NextResponse.json({ 
              error: 'Button type must be one of: QUICK_REPLY, URL, CALL' 
            }, { status: 400 })
          }
          if (!button.text) {
            return NextResponse.json({ error: 'Button text is required' }, { status: 400 })
          }
        }
        
        buttonsJson = JSON.stringify(body.buttons)
      }
    }

    // Build update data
    const updateData: Prisma.WhatsAppTemplateUpdateInput = {}
    
    if (body.name !== undefined) updateData.name = body.name.toLowerCase()
    if (body.language !== undefined) updateData.language = body.language
    if (body.category !== undefined) updateData.category = body.category
    if (body.bodyText !== undefined) updateData.bodyText = body.bodyText
    if (body.headerText !== undefined) updateData.headerText = body.headerText
    if (body.footerText !== undefined) updateData.footerText = body.footerText
    if (buttonsJson !== undefined) updateData.buttons = buttonsJson
    if (body.status !== undefined) updateData.status = body.status
    if (body.whatsappTemplateId !== undefined) updateData.whatsappTemplateId = body.whatsappTemplateId

    const template = await db.whatsAppTemplate.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error updating WhatsApp template:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'Template with this name and language already exists' }, { status: 400 })
      }
    }
    return NextResponse.json({ error: 'Failed to update WhatsApp template' }, { status: 500 })
  }
}

// DELETE /api/whatsapp/templates/[id] - Delete a WhatsApp template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if template exists
    const existingTemplate = await db.whatsAppTemplate.findUnique({
      where: { id }
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: 'WhatsApp template not found' }, { status: 404 })
    }

    // Check if template is being used in pending messages
    const pendingMessages = await db.whatsAppMessage.count({
      where: {
        templateName: existingTemplate.name,
        status: 'pending'
      }
    })

    if (pendingMessages > 0) {
      return NextResponse.json({ 
        error: `Cannot delete template. ${pendingMessages} pending message(s) are using this template.` 
      }, { status: 400 })
    }

    // In a real implementation, you would delete from WhatsApp Business API here

    // Delete the template
    await db.whatsAppTemplate.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'WhatsApp template deleted successfully' })
  } catch (error) {
    console.error('Error deleting WhatsApp template:', error)
    return NextResponse.json({ error: 'Failed to delete WhatsApp template' }, { status: 500 })
  }
}
