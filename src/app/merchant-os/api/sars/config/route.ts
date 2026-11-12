import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/sars/config - List all SARS eFiling configs or filter by merchantId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')

    const where = merchantId ? { merchantId } : {}

    const configs = await db.sarsEfilingConfig.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(configs)
  } catch (error) {
    console.error('Error fetching SARS eFiling configs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SARS eFiling configurations' },
      { status: 500 }
    )
  }
}

// POST /api/sars/config - Create a new SARS eFiling config
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      merchantId,
      taxNumber,
      taxType,
      registeredName,
      efilingUsername,
      efilingStatus,
      vatReturnFrequency,
      nextVatDueDate,
      lastVatSubmitted
    } = body

    // Validate required fields
    if (!merchantId || !taxNumber || !taxType || !registeredName) {
      return NextResponse.json(
        { error: 'Missing required fields: merchantId, taxNumber, taxType, registeredName' },
        { status: 400 }
      )
    }

    // Validate taxType
    const validTaxTypes = ['vat', 'income_tax', 'paye', 'uif']
    if (!validTaxTypes.includes(taxType)) {
      return NextResponse.json(
        { error: `Invalid taxType. Must be one of: ${validTaxTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate vatReturnFrequency if provided
    if (vatReturnFrequency) {
      const validFrequencies = ['monthly', 'bi_monthly']
      if (!validFrequencies.includes(vatReturnFrequency)) {
        return NextResponse.json(
          { error: 'Invalid vatReturnFrequency. Must be monthly or bi_monthly' },
          { status: 400 }
        )
      }
    }

    // Validate date format (YYYY-MM-DD) for date fields
    const dateFields = [nextVatDueDate, lastVatSubmitted].filter(Boolean)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    for (const dateField of dateFields) {
      if (dateField && !dateRegex.test(dateField)) {
        return NextResponse.json(
          { error: 'Invalid date format. Use YYYY-MM-DD' },
          { status: 400 }
        )
      }
    }

    // Check if config already exists for merchant
    const existingConfig = await db.sarsEfilingConfig.findUnique({
      where: { merchantId }
    })

    if (existingConfig) {
      return NextResponse.json(
        { error: 'SARS eFiling config already exists for this merchant. Use PUT to update.' },
        { status: 409 }
      )
    }

    const config = await db.sarsEfilingConfig.create({
      data: {
        merchantId,
        taxNumber,
        taxType,
        registeredName,
        efilingUsername,
        efilingStatus: efilingStatus || 'pending',
        vatReturnFrequency,
        nextVatDueDate,
        lastVatSubmitted
      }
    })

    return NextResponse.json(config, { status: 201 })
  } catch (error) {
    console.error('Error creating SARS eFiling config:', error)
    return NextResponse.json(
      { error: 'Failed to create SARS eFiling configuration' },
      { status: 500 }
    )
  }
}
