import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// Types for custom report builder
interface FieldConfig {
  field: string
  label: string
  type: 'string' | 'number' | 'date' | 'currency' | 'percentage'
  aggregatable: boolean
  groupable: boolean
  sortable: boolean
}

interface FilterCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'ends_with' | 
            'greater_than' | 'less_than' | 'between' | 'in' | 'not_in' | 
            'is_null' | 'is_not_null'
  value: string | number | string[] | number[] | null
}

interface GroupingConfig {
  field: string
  label?: string
}

interface AggregationConfig {
  field: string
  type: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'count_distinct'
  label?: string
}

interface SortConfig {
  field: string
  direction: 'asc' | 'desc'
}

// Available data sources and their fields
const DATA_SOURCE_CONFIG: Record<string, { table: string; fields: FieldConfig[] }> = {
  transactions: {
    table: 'transaction',
    fields: [
      { field: 'id', label: 'Transaction ID', type: 'string', aggregatable: false, groupable: true, sortable: true },
      { field: 'total', label: 'Total Amount', type: 'currency', aggregatable: true, groupable: false, sortable: true },
      { field: 'subtotal', label: 'Subtotal', type: 'currency', aggregatable: true, groupable: false, sortable: true },
      { field: 'tax', label: 'Tax', type: 'currency', aggregatable: true, groupable: false, sortable: true },
      { field: 'discount', label: 'Discount', type: 'currency', aggregatable: true, groupable: false, sortable: true },
      { field: 'paymentMethod', label: 'Payment Method', type: 'string', aggregatable: false, groupable: true, sortable: true },
      { field: 'status', label: 'Status', type: 'string', aggregatable: false, groupable: true, sortable: true },
      { field: 'createdAt', label: 'Created Date', type: 'date', aggregatable: false, groupable: true, sortable: true },
      { field: 'branchId', label: 'Branch', type: 'string', aggregatable: false, groupable: true, sortable: true },
      { field: 'customerId', label: 'Customer', type: 'string', aggregatable: false, groupable: true, sortable: true },
      { field: 'staffId', label: 'Staff', type: 'string', aggregatable: false, groupable: true, sortable: true },
    ]
  },
  products: {
    table: 'product',
    fields: [
      { field: 'id', label: 'Product ID', type: 'string', aggregatable: false, groupable: true, sortable: true },
      { field: 'name', label: 'Product Name', type: 'string', aggregatable: false, groupable: true, sortable: true },
      { field: 'sku', label: 'SKU', type: 'string', aggregatable: false, groupable: true, sortable: true },
      { field: 'price', label: 'Price', type: 'currency', aggregatable: true, groupable: false, sortable: true },
      { field: 'cost', label: 'Cost', type: 'currency', aggregatable: true, groupable: false, sortable: true },
      { field: 'quantity', label: 'Stock Quantity', type: 'number', aggregatable: true, groupable: false, sortable: true },
      { field: 'category', label: 'Category', type: 'string', aggregatable: false, groupable: true, sortable: true },
      { field: 'status', label: 'Status', type: 'string', aggregatable: false, groupable: true, sortable: true },
      { field: 'createdAt', label: 'Created Date', type: 'date', aggregatable: false, groupable: true, sortable: true },
    ]
  },
  customers: {
    table: 'customer',
    fields: [
      { field: 'id', label: 'Customer ID', type: 'string', aggregatable: false, groupable: true, sortable: true },
      { field: 'name', label: 'Customer Name', type: 'string', aggregatable: false, groupable: true, sortable: true },
      { field: 'email', label: 'Email', type: 'string', aggregatable: false, groupable: true, sortable: true },
      { field: 'phone', label: 'Phone', type: 'string', aggregatable: false, groupable: true, sortable: true },
      { field: 'totalSpent', label: 'Total Spent', type: 'currency', aggregatable: true, groupable: false, sortable: true },
      { field: 'visitCount', label: 'Visit Count', type: 'number', aggregatable: true, groupable: false, sortable: true },
      { field: 'lastVisitAt', label: 'Last Visit', type: 'date', aggregatable: false, groupable: true, sortable: true },
      { field: 'createdAt', label: 'Created Date', type: 'date', aggregatable: false, groupable: true, sortable: true },
    ]
  },
  staff: {
    table: 'staff',
    fields: [
      { field: 'id', label: 'Staff ID', type: 'string', aggregatable: false, groupable: true, sortable: true },
      { field: 'name', label: 'Staff Name', type: 'string', aggregatable: false, groupable: true, sortable: true },
      { field: 'role', label: 'Role', type: 'string', aggregatable: false, groupable: true, sortable: true },
      { field: 'email', label: 'Email', type: 'string', aggregatable: false, groupable: true, sortable: true },
      { field: 'phone', label: 'Phone', type: 'string', aggregatable: false, groupable: true, sortable: true },
      { field: 'status', label: 'Status', type: 'string', aggregatable: false, groupable: true, sortable: true },
      { field: 'createdAt', label: 'Created Date', type: 'date', aggregatable: false, groupable: true, sortable: true },
    ]
  },
  inventory: {
    table: 'stockMovement',
    fields: [
      { field: 'id', label: 'Movement ID', type: 'string', aggregatable: false, groupable: true, sortable: true },
      { field: 'productId', label: 'Product', type: 'string', aggregatable: false, groupable: true, sortable: true },
      { field: 'quantity', label: 'Quantity', type: 'number', aggregatable: true, groupable: false, sortable: true },
      { field: 'type', label: 'Movement Type', type: 'string', aggregatable: false, groupable: true, sortable: true },
      { field: 'reason', label: 'Reason', type: 'string', aggregatable: false, groupable: true, sortable: true },
      { field: 'branchId', label: 'Branch', type: 'string', aggregatable: false, groupable: true, sortable: true },
      { field: 'createdAt', label: 'Created Date', type: 'date', aggregatable: false, groupable: true, sortable: true },
    ]
  }
}

// GET /api/reports/custom - List reports or get available fields
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const action = searchParams.get('action') || 'list'
    const reportId = searchParams.get('reportId')
    const dataSource = searchParams.get('dataSource')

    // Get available data sources and fields
    if (action === 'schema') {
      if (dataSource && DATA_SOURCE_CONFIG[dataSource]) {
        return NextResponse.json({
          success: true,
          data: {
            dataSource,
            fields: DATA_SOURCE_CONFIG[dataSource].fields
          }
        })
      }
      
      return NextResponse.json({
        success: true,
        data: {
          dataSources: Object.keys(DATA_SOURCE_CONFIG).map(key => ({
            name: key,
            label: key.charAt(0).toUpperCase() + key.slice(1),
            fieldCount: DATA_SOURCE_CONFIG[key].fields.length
          }))
        }
      })
    }

    // Get report templates
    if (action === 'templates') {
      const templates = await db.reportTemplate.findMany({
        where: { isActive: true },
        orderBy: [{ category: 'asc' }, { name: 'asc' }]
      })

      return NextResponse.json({
        success: true,
        data: templates
      })
    }

    // List custom reports
    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
    }

    // Get single report
    if (reportId) {
      const report = await db.customReport.findUnique({
        where: { id: reportId },
        include: {
          ScheduledReport: true,
          ReportExecution: {
            take: 10,
            orderBy: { createdAt: 'desc' }
          }
        }
      })

      if (!report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: report
      })
    }

    // List all reports for merchant
    const reports = await db.customReport.findMany({
      where: {
        merchantId,
        status: { not: 'deleted' }
      },
      include: {
        ScheduledReport: true,
        _count: {
          select: { ReportExecution: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: reports
    })
  } catch (error) {
    console.error('Error in custom reports API:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

// POST /api/reports/custom - Create report or execute/preview
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, merchantId, reportId, ...data } = body

    // Execute/preview a report
    if (action === 'execute' || action === 'preview') {
      return await executeReport(merchantId, data, action === 'preview')
    }

    // Create new report
    if (!merchantId || !data.name || !data.selectedFields) {
      return NextResponse.json({ 
        error: 'merchantId, name, and selectedFields are required' 
      }, { status: 400 })
    }

    const report = await db.customReport.create({
      data: {
        id: nanoid(),
        merchantId,
        name: data.name,
        description: data.description,
        reportType: data.reportType || 'custom',
        category: data.category,
        selectedFields: JSON.stringify(data.selectedFields),
        filters: data.filters ? JSON.stringify(data.filters) : null,
        groupBy: data.groupBy ? JSON.stringify(data.groupBy) : null,
        aggregations: data.aggregations ? JSON.stringify(data.aggregations) : null,
        sortBy: data.sortBy ? JSON.stringify(data.sortBy) : null,
        dataSource: data.dataSource || 'transactions',
        dateRangeField: data.dateRangeField || 'createdAt',
        exportFormats: data.exportFormats ? JSON.stringify(data.exportFormats) : null,
        defaultFormat: data.defaultFormat || 'pdf',
        isPublic: data.isPublic || false,
        sharedWith: data.sharedWith ? JSON.stringify(data.sharedWith) : null,
        createdBy: data.createdBy,
        createdByName: data.createdByName,
      }
    })

    return NextResponse.json({
      success: true,
      data: report
    })
  } catch (error) {
    console.error('Error creating custom report:', error)
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
  }
}

// PUT /api/reports/custom - Update report
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { reportId, ...data } = body

    if (!reportId) {
      return NextResponse.json({ error: 'reportId is required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    
    const jsonFields = ['selectedFields', 'filters', 'groupBy', 'aggregations', 'sortBy', 'exportFormats', 'sharedWith']
    const directFields = ['name', 'description', 'reportType', 'category', 'dataSource', 'dateRangeField', 'defaultFormat', 'isPublic', 'status']

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

    const report = await db.customReport.update({
      where: { id: reportId },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: report
    })
  } catch (error) {
    console.error('Error updating custom report:', error)
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 })
  }
}

// DELETE /api/reports/custom - Delete report
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('reportId')

    if (!reportId) {
      return NextResponse.json({ error: 'reportId is required' }, { status: 400 })
    }

    // Soft delete
    await db.customReport.update({
      where: { id: reportId },
      data: { status: 'deleted', updatedAt: new Date() }
    })

    return NextResponse.json({
      success: true,
      message: 'Report deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting custom report:', error)
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 })
  }
}

// Helper function to execute/preview a report
async function executeReport(merchantId: string, config: Record<string, unknown>, isPreview: boolean): Promise<NextResponse> {
  const executionId = nanoid()
  const startTime = Date.now()

  try {
    // Parse configuration
    const selectedFields: FieldConfig[] = typeof config.selectedFields === 'string' 
      ? JSON.parse(config.selectedFields as string) 
      : (config.selectedFields as FieldConfig[]) || []
    const filters: FilterCondition[] = typeof config.filters === 'string'
      ? JSON.parse(config.filters as string)
      : (config.filters as FilterCondition[]) || []
    const groupBy: GroupingConfig[] = typeof config.groupBy === 'string'
      ? JSON.parse(config.groupBy as string)
      : (config.groupBy as GroupingConfig[]) || []
    const aggregations: AggregationConfig[] = typeof config.aggregations === 'string'
      ? JSON.parse(config.aggregations as string)
      : (config.aggregations as AggregationConfig[]) || []
    const sortBy: SortConfig[] = typeof config.sortBy === 'string'
      ? JSON.parse(config.sortBy as string)
      : (config.sortBy as SortConfig[]) || []
    const dataSource = (config.dataSource as string) || 'transactions'
    const dateRange = config.dateRange as { start?: string; end?: string } | undefined

    const sourceConfig = DATA_SOURCE_CONFIG[dataSource]
    if (!sourceConfig) {
      return NextResponse.json({ error: 'Invalid data source' }, { status: 400 })
    }

    // Build where clause
    const whereClause: Record<string, unknown> = { merchantId }

    // Add date range filter
    if (dateRange?.start || dateRange?.end) {
      const dateField = (config.dateRangeField as string) || 'createdAt'
      whereClause[dateField] = {
        ...(dateRange.start && { gte: new Date(dateRange.start) }),
        ...(dateRange.end && { lte: new Date(dateRange.end) })
      }
    }

    // Add custom filters
    for (const filter of filters) {
      const fieldConfig = sourceConfig.fields.find(f => f.field === filter.field)
      if (!fieldConfig) continue

      switch (filter.operator) {
        case 'equals':
          whereClause[filter.field] = filter.value
          break
        case 'not_equals':
          whereClause[filter.field] = { not: filter.value }
          break
        case 'contains':
          whereClause[filter.field] = { contains: filter.value as string }
          break
        case 'starts_with':
          whereClause[filter.field] = { startsWith: filter.value as string }
          break
        case 'ends_with':
          whereClause[filter.field] = { endsWith: filter.value as string }
          break
        case 'greater_than':
          whereClause[filter.field] = { gt: filter.value as number }
          break
        case 'less_than':
          whereClause[filter.field] = { lt: filter.value as number }
          break
        case 'between':
          const values = filter.value as number[]
          whereClause[filter.field] = { gte: values[0], lte: values[1] }
          break
        case 'in':
          whereClause[filter.field] = { in: filter.value as string[] }
          break
        case 'not_in':
          whereClause[filter.field] = { notIn: filter.value as string[] }
          break
        case 'is_null':
          whereClause[filter.field] = null
          break
        case 'is_not_null':
          whereClause[filter.field] = { not: null }
          break
      }
    }

    // Build select clause
    const selectClause: Record<string, boolean> = {}
    for (const field of selectedFields) {
      selectClause[field.field] = true
    }

    // Add grouping fields to select
    for (const group of groupBy) {
      selectClause[group.field] = true
    }

    // Determine if we need aggregation
    const needsAggregation = aggregations.length > 0 || groupBy.length > 0

    // Execute query based on data source
    let records: unknown[] = []
    
    switch (dataSource) {
      case 'transactions':
        records = await db.transaction.findMany({
          where: whereClause,
          select: Object.keys(selectClause).length > 0 ? selectClause : undefined,
          orderBy: sortBy.length > 0 ? { [sortBy[0].field]: sortBy[0].direction } : { createdAt: 'desc' },
          take: isPreview ? 100 : 10000
        })
        break
      case 'products':
        records = await db.product.findMany({
          where: whereClause,
          select: Object.keys(selectClause).length > 0 ? selectClause : undefined,
          orderBy: sortBy.length > 0 ? { [sortBy[0].field]: sortBy[0].direction } : { name: 'asc' },
          take: isPreview ? 100 : 10000
        })
        break
      case 'customers':
        records = await db.customer.findMany({
          where: whereClause,
          select: Object.keys(selectClause).length > 0 ? selectClause : undefined,
          orderBy: sortBy.length > 0 ? { [sortBy[0].field]: sortBy[0].direction } : { name: 'asc' },
          take: isPreview ? 100 : 10000
        })
        break
      case 'staff':
        records = await db.staff.findMany({
          where: whereClause,
          select: Object.keys(selectClause).length > 0 ? selectClause : undefined,
          orderBy: sortBy.length > 0 ? { [sortBy[0].field]: sortBy[0].direction } : { name: 'asc' },
          take: isPreview ? 100 : 10000
        })
        break
      case 'inventory':
        records = await db.stockMovement.findMany({
          where: whereClause,
          select: Object.keys(selectClause).length > 0 ? selectClause : undefined,
          orderBy: sortBy.length > 0 ? { [sortBy[0].field]: sortBy[0].direction } : { createdAt: 'desc' },
          take: isPreview ? 100 : 10000
        })
        break
    }

    // Process aggregations if needed
    let aggregatedData: Record<string, unknown>[] = []
    if (needsAggregation && records.length > 0) {
      const groupedData = new Map<string, unknown[]>()

      // Group records
      for (const record of records) {
        const groupKey = groupBy.map(g => (record as Record<string, unknown>)[g.field] || '').join('|')
        if (!groupedData.has(groupKey)) {
          groupedData.set(groupKey, [])
        }
        groupedData.get(groupKey)!.push(record)
      }

      // Calculate aggregations for each group
      for (const [groupKey, groupRecords] of groupedData) {
        const result: Record<string, unknown> = {}
        
        // Add group values
        const groupValues = groupKey.split('|')
        groupBy.forEach((g, i) => {
          result[g.label || g.field] = groupValues[i]
        })

        // Calculate aggregations
        for (const agg of aggregations) {
          const values = groupRecords
            .map(r => (r as Record<string, unknown>)[agg.field])
            .filter(v => typeof v === 'number') as number[]

          switch (agg.type) {
            case 'sum':
              result[agg.label || `${agg.field}_sum`] = values.reduce((a, b) => a + b, 0)
              break
            case 'avg':
              result[agg.label || `${agg.field}_avg`] = values.length > 0 
                ? values.reduce((a, b) => a + b, 0) / values.length 
                : 0
              break
            case 'count':
              result[agg.label || `${agg.field}_count`] = values.length
              break
            case 'min':
              result[agg.label || `${agg.field}_min`] = values.length > 0 ? Math.min(...values) : 0
              break
            case 'max':
              result[agg.label || `${agg.field}_max`] = values.length > 0 ? Math.max(...values) : 0
              break
            case 'count_distinct':
              result[agg.label || `${agg.field}_distinct`] = new Set(values).size
              break
          }
        }

        aggregatedData.push(result)
      }

      // Sort aggregated results
      if (sortBy.length > 0) {
        aggregatedData.sort((a, b) => {
          const sort = sortBy[0]
          const aVal = a[sort.field]
          const bVal = b[sort.field]
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sort.direction === 'desc' ? bVal - aVal : aVal - bVal
          }
          return sort.direction === 'desc' 
            ? String(bVal).localeCompare(String(aVal))
            : String(aVal).localeCompare(String(bVal))
        })
      }
    }

    const duration = (Date.now() - startTime) / 1000

    // For non-preview, log execution
    if (!isPreview && config.reportId) {
      await db.reportExecution.create({
        data: {
          id: executionId,
          reportId: config.reportId as string,
          merchantId,
          executionType: 'manual',
          triggeredBy: config.triggeredBy as string,
          triggeredByName: config.triggeredByName as string,
          completedAt: new Date(),
          duration,
          status: 'completed',
          recordCount: needsAggregation ? aggregatedData.length : records.length,
          exportFormat: config.exportFormat as string || 'json'
        }
      })

      // Update report stats
      await db.customReport.update({
        where: { id: config.reportId as string },
        data: {
          lastRunAt: new Date(),
          runCount: { increment: 1 }
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        executionId,
        dataSource,
        recordCount: needsAggregation ? aggregatedData.length : records.length,
        duration,
        fields: selectedFields.map(f => f.field),
        groupBy: groupBy.map(g => g.field),
        aggregations: aggregations.map(a => ({ field: a.field, type: a.type })),
        records: needsAggregation ? aggregatedData : records,
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error executing report:', error)
    return NextResponse.json({ 
      error: 'Failed to execute report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
