import { NextRequest, NextResponse } from 'next/server'

// POST - Generate a new report
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { farmId, merchantId, name, type, dateRange, includeGraphs } = data

    // Generate report based on type
    const report = {
      id: `rpt-${Date.now()}`,
      name: name || `${type.replace('_', ' ')} Report`,
      type,
      generatedAt: new Date().toISOString(),
      period: getPeriodLabel(dateRange),
      summary: generateSummary(type),
      sections: generateSections(type, includeGraphs),
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}

function getPeriodLabel(dateRange: string): string {
  const now = new Date()
  switch (dateRange) {
    case 'week':
      return `Week of ${new Date(now.setDate(now.getDate() - 7)).toLocaleDateString()}`
    case 'month':
      return `${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3) + 1
      return `Q${quarter} ${now.getFullYear()}`
    case 'year':
      return `${now.getFullYear()}`
    default:
      return 'Custom Period'
  }
}

function generateSummary(type: string) {
  switch (type) {
    case 'herd_summary':
      return [
        { title: 'Total Animals', value: 245, change: 5.2, trend: 'up' },
        { title: 'Active', value: 238, change: 3.1, trend: 'up' },
        { title: 'Average Weight', value: '385 kg', change: 2.5, trend: 'up' },
        { title: 'Mortality Rate', value: '2.1%', change: -0.5, trend: 'down' },
      ]
    case 'weight_analysis':
      return [
        { title: 'Avg Daily Gain', value: '1.2 kg/d', change: 8.5, trend: 'up' },
        { title: 'Total Weight Gain', value: '2,450 kg', change: 12.3, trend: 'up' },
        { title: 'Underperforming', value: 12, change: -15, trend: 'down' },
        { title: 'Target Met', value: '85%', change: 5, trend: 'up' },
      ]
    case 'breeding_performance':
      return [
        { title: 'Conception Rate', value: '68%', change: 3.2, trend: 'up' },
        { title: 'Calving Rate', value: '92%', change: 1.5, trend: 'up' },
        { title: 'Avg Calving Interval', value: '13.5 mo', change: -2.1, trend: 'up' },
        { title: 'Birth Weight Avg', value: '35 kg', change: 0.5, trend: 'stable' },
      ]
    case 'health_summary':
      return [
        { title: 'Health Events', value: 45, change: -10, trend: 'down' },
        { title: 'Vaccinations', value: 156, change: 12, trend: 'up' },
        { title: 'Treatments', value: 23, change: -5, trend: 'down' },
        { title: 'Recovery Rate', value: '94%', change: 2, trend: 'up' },
      ]
    case 'feed_efficiency':
      return [
        { title: 'Total Feed (kg)', value: '12,500', change: 8, trend: 'up' },
        { title: 'Avg FCR', value: '4.5', change: -3.2, trend: 'up' },
        { title: 'Feed Cost/Animal', value: 'R 245', change: -5, trend: 'down' },
        { title: 'Wastage', value: '8%', change: -1.5, trend: 'down' },
      ]
    case 'financial':
      return [
        { title: 'Revenue', value: 'R 125,000', change: 15.2, trend: 'up' },
        { title: 'Operating Costs', value: 'R 78,500', change: 8.5, trend: 'up' },
        { title: 'Net Profit', value: 'R 46,500', change: 28.3, trend: 'up' },
        { title: 'Profit/Animal', value: 'R 190', change: 22.1, trend: 'up' },
      ]
    default:
      return [
        { title: 'Total Records', value: 245, change: 5, trend: 'up' },
        { title: 'Active', value: 238, change: 3, trend: 'up' },
      ]
  }
}

function generateSections(type: string, includeGraphs: boolean) {
  const sections = []

  sections.push({
    title: 'Overview',
    content: 'table',
    type: 'table',
  })

  if (includeGraphs) {
    sections.push({
      title: 'Trends',
      content: 'chart',
      type: 'chart',
    })
  }

  sections.push({
    title: 'Details',
    content: `This report provides a comprehensive analysis of ${type.replace('_', ' ')} for the selected period.`,
    type: 'text',
  })

  return sections
}
