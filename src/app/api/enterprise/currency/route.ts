import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

// GET - List currencies and exchange rates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const corporateId = searchParams.get('corporateId')
    const action = searchParams.get('action') || 'list'
    
    if (!corporateId) {
      return NextResponse.json({ error: 'corporateId is required' }, { status: 400 })
    }
    
    if (action === 'rates') {
      // Get exchange rates
      const rates = await db.exchangeRate.findMany({
        where: { corporateId, isActive: true },
        include: {
          FromCurrency: { select: { code: true, name: true, symbol: true } },
          ToCurrency: { select: { code: true, name: true, symbol: true } }
        },
        orderBy: { effectiveDate: 'desc' }
      })
      return NextResponse.json({ rates })
    }
    
    if (action === 'transactions') {
      // Get multi-currency transactions
      const transactions = await db.multiCurrencyTransaction.findMany({
        where: { corporateId },
        orderBy: { createdAt: 'desc' },
        take: 50
      })
      return NextResponse.json({ transactions })
    }
    
    if (action === 'convert') {
      // Convert amount between currencies
      const fromCurrency = searchParams.get('from')
      const toCurrency = searchParams.get('to')
      const amount = parseFloat(searchParams.get('amount') || '0')
      
      if (!fromCurrency || !toCurrency || amount <= 0) {
        return NextResponse.json({ error: 'from, to currencies and amount are required' }, { status: 400 })
      }
      
      // Find exchange rate
      const rate = await db.exchangeRate.findFirst({
        where: {
          corporateId,
          fromCurrency: { code: fromCurrency },
          toCurrency: { code: toCurrency },
          isActive: true
        },
        include: {
          FromCurrency: true,
          ToCurrency: true
        }
      })
      
      if (!rate) {
        return NextResponse.json({ error: 'Exchange rate not found' }, { status: 404 })
      }
      
      const convertedAmount = amount * rate.rate
      const buyAmount = rate.buyRate ? amount * rate.buyRate : null
      const sellAmount = rate.sellRate ? amount * rate.sellRate : null
      
      return NextResponse.json({
        originalAmount: amount,
        originalCurrency: fromCurrency,
        convertedAmount,
        targetCurrency: toCurrency,
        exchangeRate: rate.rate,
        buyAmount,
        sellAmount,
        rateEffectiveDate: rate.effectiveDate
      })
    }
    
    // List currencies
    const currencies = await db.enterpriseCurrency.findMany({
      where: { corporateId },
      orderBy: { isBase: 'desc' }
    })
    
    // Get latest exchange rates for each currency
    const rates = await db.exchangeRate.findMany({
      where: { corporateId, isActive: true },
      include: {
        FromCurrency: { select: { code: true, name: true } },
        ToCurrency: { select: { code: true, name: true } }
      },
      orderBy: { effectiveDate: 'desc' }
    })
    
    // Currency stats
    const stats = {
      totalCurrencies: currencies.length,
      activeRates: rates.length,
      baseCurrency: currencies.find(c => c.isBase)?.code || 'ZAR'
    }
    
    return NextResponse.json({ currencies, rates, stats })
  } catch (error) {
    console.error('Error fetching currency data:', error)
    return NextResponse.json({ error: 'Failed to fetch currency data' }, { status: 500 })
  }
}

// POST - Create currency, exchange rate, or transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, corporateId, ...data } = body
    
    if (!corporateId) {
      return NextResponse.json({ error: 'corporateId is required' }, { status: 400 })
    }
    
    if (action === 'create_currency') {
      // Check if base currency already exists
      if (data.isBase) {
        const existingBase = await db.enterpriseCurrency.findFirst({
          where: { corporateId, isBase: true }
        })
        if (existingBase) {
          return NextResponse.json({ error: 'Base currency already exists' }, { status: 400 })
        }
      }
      
      const currency = await db.enterpriseCurrency.create({
        data: {
          id: randomUUID(),
          corporateId,
          code: data.code.toUpperCase(),
          name: data.name,
          symbol: data.symbol || data.code,
          isBase: data.isBase || false,
          isActive: data.isActive ?? true,
          decimalPlaces: data.decimalPlaces || 2
        }
      })
      
      return NextResponse.json({ currency })
    }
    
    if (action === 'create_rate') {
      // Find currencies
      const fromCurrency = await db.enterpriseCurrency.findFirst({
        where: { corporateId, code: data.fromCurrency }
      })
      const toCurrency = await db.enterpriseCurrency.findFirst({
        where: { corporateId, code: data.toCurrency }
      })
      
      if (!fromCurrency || !toCurrency) {
        return NextResponse.json({ error: 'Currency not found' }, { status: 404 })
      }
      
      const rate = await db.exchangeRate.create({
        data: {
          id: randomUUID(),
          corporateId,
          fromCurrencyId: fromCurrency.id,
          toCurrencyId: toCurrency.id,
          rate: parseFloat(data.rate) || 1,
          buyRate: data.buyRate ? parseFloat(data.buyRate) : null,
          sellRate: data.sellRate ? parseFloat(data.sellRate) : null,
          midRate: data.midRate ? parseFloat(data.midRate) : null,
          effectiveDate: data.effectiveDate || new Date().toISOString().split('T')[0],
          expiryDate: data.expiryDate,
          source: data.source || 'manual',
          isActive: data.isActive ?? true
        },
        include: {
          FromCurrency: true,
          ToCurrency: true
        }
      })
      
      return NextResponse.json({ rate })
    }
    
    if (action === 'create_transaction') {
      // Find currencies
      const originalCurrency = await db.enterpriseCurrency.findFirst({
        where: { corporateId, code: data.originalCurrency }
      })
      const baseCurrency = await db.enterpriseCurrency.findFirst({
        where: { corporateId, isBase: true }
      })
      
      if (!originalCurrency || !baseCurrency) {
        return NextResponse.json({ error: 'Currency not found' }, { status: 404 })
      }
      
      // Get exchange rate
      let exchangeRateUsed = 1
      let exchangeRateRecord = null
      
      if (originalCurrency.id !== baseCurrency.id) {
        exchangeRateRecord = await db.exchangeRate.findFirst({
          where: {
            corporateId,
            fromCurrencyId: originalCurrency.id,
            toCurrencyId: baseCurrency.id,
            isActive: true
          }
        })
        if (exchangeRateRecord) {
          exchangeRateUsed = exchangeRateRecord.rate
        }
      }
      
      const originalAmount = parseFloat(data.originalAmount) || 0
      const baseAmount = originalAmount * exchangeRateUsed
      
      const transaction = await db.multiCurrencyTransaction.create({
        data: {
          id: randomUUID(),
          corporateId,
          merchantId: data.merchantId,
          transactionType: data.transactionType,
          referenceId: data.referenceId,
          referenceType: data.referenceType,
          originalCurrencyId: originalCurrency.id,
          originalAmount,
          originalVat: data.originalVat ? parseFloat(data.originalVat) : null,
          baseCurrencyId: baseCurrency.id,
          baseAmount,
          baseVat: data.baseVat ? parseFloat(data.baseVat) : null,
          exchangeRateUsed,
          exchangeRateId: exchangeRateRecord?.id,
          conversionDate: data.conversionDate || new Date().toISOString().split('T')[0],
          conversionMethod: data.conversionMethod || 'mid',
          status: data.status || 'completed',
          notes: data.notes
        }
      })
      
      return NextResponse.json({ transaction })
    }
    
    if (action === 'bulk_rates') {
      // Bulk update exchange rates
      const rates = data.rates as Array<{
        fromCurrency: string
        toCurrency: string
        rate: number
        buyRate?: number
        sellRate?: number
      }>
      
      const results = []
      for (const rateData of rates) {
        const fromCurrency = await db.enterpriseCurrency.findFirst({
          where: { corporateId, code: rateData.fromCurrency }
        })
        const toCurrency = await db.enterpriseCurrency.findFirst({
          where: { corporateId, code: rateData.toCurrency }
        })
        
        if (fromCurrency && toCurrency) {
          const rate = await db.exchangeRate.upsert({
            where: {
              corporateId_fromCurrencyId_toCurrencyId_effectiveDate: {
                corporateId,
                fromCurrencyId: fromCurrency.id,
                toCurrencyId: toCurrency.id,
                effectiveDate: new Date().toISOString().split('T')[0]
              }
            },
            update: {
              rate: rateData.rate,
              buyRate: rateData.buyRate,
              sellRate: rateData.sellRate,
              isActive: true
            },
            create: {
              id: randomUUID(),
              corporateId,
              fromCurrencyId: fromCurrency.id,
              toCurrencyId: toCurrency.id,
              rate: rateData.rate,
              buyRate: rateData.buyRate,
              sellRate: rateData.sellRate,
              effectiveDate: new Date().toISOString().split('T')[0],
              source: 'manual'
            }
          })
          results.push(rate)
        }
      }
      
      return NextResponse.json({ updated: results.length, rates: results })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error processing currency request:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

// PUT - Update currency or exchange rate
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, id, ...data } = body
    
    if (action === 'update_currency') {
      const currency = await db.enterpriseCurrency.update({
        where: { id },
        data: {
          name: data.name,
          symbol: data.symbol,
          isActive: data.isActive,
          decimalPlaces: data.decimalPlaces,
          updatedAt: new Date()
        }
      })
      return NextResponse.json({ currency })
    }
    
    if (action === 'update_rate') {
      const rate = await db.exchangeRate.update({
        where: { id },
        data: {
          rate: data.rate ? parseFloat(data.rate) : undefined,
          buyRate: data.buyRate ? parseFloat(data.buyRate) : null,
          sellRate: data.sellRate ? parseFloat(data.sellRate) : null,
          midRate: data.midRate ? parseFloat(data.midRate) : null,
          expiryDate: data.expiryDate,
          isActive: data.isActive,
          updatedAt: new Date()
        }
      })
      return NextResponse.json({ rate })
    }
    
    if (action === 'set_base_currency') {
      // Unset current base
      await db.enterpriseCurrency.updateMany({
        where: { corporateId: data.corporateId, isBase: true },
        data: { isBase: false }
      })
      
      // Set new base
      const currency = await db.enterpriseCurrency.update({
        where: { id },
        data: { isBase: true }
      })
      return NextResponse.json({ currency })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating currency data:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

// DELETE - Delete currency or exchange rate
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }
    
    if (action === 'currency') {
      // Check if currency is in use
      const transactions = await db.multiCurrencyTransaction.count({
        where: { OR: [{ originalCurrencyId: id }, { baseCurrencyId: id }] }
      })
      if (transactions > 0) {
        return NextResponse.json({ error: 'Currency is in use and cannot be deleted' }, { status: 400 })
      }
      
      await db.enterpriseCurrency.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }
    
    if (action === 'rate') {
      await db.exchangeRate.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error deleting currency data:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
