'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Users,
  Scale,
  Syringe,
  Utensils,
  Leaf,
  Loader2,
  Printer,
  FileSpreadsheet,
  Filter,
} from 'lucide-react'

// ============================================
// TYPES
// ============================================

interface ReportConfig {
  name: string
  type: 'herd_summary' | 'weight_analysis' | 'breeding_performance' | 'health_summary' | 'feed_efficiency' | 'financial'
  dateRange: 'week' | 'month' | 'quarter' | 'year' | 'custom'
  startDate?: string
  endDate?: string
  includeGraphs: boolean
  species?: string[]
  camps?: string[]
}

interface GeneratedReport {
  id: string
  name: string
  type: string
  generatedAt: string
  period: string
  summary: {
    title: string
    value: string | number
    change?: number
    trend?: 'up' | 'down' | 'stable'
  }[]
  sections: {
    title: string
    content: string | Record<string, unknown>[]
    type: 'text' | 'table' | 'chart'
  }[]
}

interface AdvancedReportingProps {
  farmId: string
}

const reportTypes = [
  { id: 'herd_summary', name: 'Herd Summary', icon: Users, description: 'Overview of all animals by species, classification, and status' },
  { id: 'weight_analysis', name: 'Weight Analysis', icon: Scale, description: 'Weight trends, ADG performance, and growth tracking' },
  { id: 'breeding_performance', name: 'Breeding Performance', icon: Activity, description: 'Breeding success rates, calving intervals, and reproduction metrics' },
  { id: 'health_summary', name: 'Health Summary', icon: Syringe, description: 'Health events, treatments, vaccination status, and mortality analysis' },
  { id: 'feed_efficiency', name: 'Feed Efficiency', icon: Utensils, description: 'Feed consumption, FCR, costs, and efficiency metrics' },
  { id: 'financial', name: 'Financial Report', icon: BarChart3, description: 'Revenue, costs, and profitability analysis' },
]

// ============================================
// MAIN COMPONENT
// ============================================

export function AdvancedReporting({ farmId }: AdvancedReportingProps) {
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [reports, setReports] = useState<GeneratedReport[]>([])
  const [selectedReport, setSelectedReport] = useState<GeneratedReport | null>(null)
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)

  // Report configuration
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    name: '',
    type: 'herd_summary',
    dateRange: 'month',
    includeGraphs: true,
  })

  // Generate report
  const generateReport = async () => {
    setGenerating(true)
    try {
      const sessionStr = localStorage.getItem('groway_session')
      const session = sessionStr ? JSON.parse(sessionStr) : null
      const merchantId = session?.merchantId || 'test-merchant'

      const response = await fetch('/api/merchant-os/agriculture/livestock/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmId,
          merchantId,
          ...reportConfig,
        }),
      })

      if (response.ok) {
        const report = await response.json()
        setReports(prev => [report, ...prev])
        setSelectedReport(report)
        setGenerateDialogOpen(false)
      }
    } catch (error) {
      console.error('Failed to generate report:', error)
    } finally {
      setGenerating(false)
    }
  }

  // Export report
  const exportReport = async (format: 'pdf' | 'excel') => {
    if (!selectedReport) return
    
    try {
      // In a real implementation, this would call the PDF skill or xlsx skill
      console.log(`Exporting report ${selectedReport.id} as ${format}`)
      alert(`Report would be exported as ${format.toUpperCase()}`)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  // Mock generated reports
  useEffect(() => {
    const mockReports: GeneratedReport[] = [
      {
        id: 'rpt-1',
        name: 'Monthly Herd Summary - June 2025',
        type: 'herd_summary',
        generatedAt: new Date().toISOString(),
        period: 'June 2025',
        summary: [
          { title: 'Total Animals', value: 245, change: 12, trend: 'up' },
          { title: 'Average Weight', value: '385 kg', change: 5.2, trend: 'up' },
          { title: 'Avg Daily Gain', value: '1.2 kg/d', change: -0.1, trend: 'down' },
          { title: 'Mortality Rate', value: '2.1%', change: -0.5, trend: 'down' },
        ],
        sections: [
          { title: 'Herd Composition', content: 'table', type: 'table' },
          { title: 'Performance Metrics', content: 'chart', type: 'chart' },
        ],
      },
    ]
    setReports(mockReports)
    if (mockReports.length > 0) {
      setSelectedReport(mockReports[0])
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Advanced Reporting
          </h2>
          <p className="text-sm text-gray-500">Generate and export comprehensive livestock reports</p>
        </div>
        <Button 
          size="sm" 
          className="bg-amber-600 hover:bg-amber-700"
          onClick={() => setGenerateDialogOpen(true)}
        >
          <FileText className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Report Types Quick Access */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {reportTypes.map((type) => (
          <Card 
            key={type.id}
            className="cursor-pointer hover:bg-amber-50 transition-colors"
            onClick={() => {
              setReportConfig({ ...reportConfig, type: type.id as ReportConfig['type'], name: type.name })
              setGenerateDialogOpen(true)
            }}
          >
            <CardContent className="p-4 text-center">
              <type.icon className="w-8 h-8 mx-auto mb-2 text-amber-600" />
              <p className="text-sm font-medium">{type.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">Recent Reports</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* Recent Reports Tab */}
        <TabsContent value="recent">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Reports List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Generated Reports</CardTitle>
                <CardDescription>Click to view details</CardDescription>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No reports generated yet</p>
                    <Button className="mt-4" onClick={() => setGenerateDialogOpen(true)}>
                      Generate First Report
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {reports.map((report) => (
                        <div
                          key={report.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedReport?.id === report.id
                              ? 'bg-amber-50 border-amber-300'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedReport(report)}
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-amber-600" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{report.name}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(report.generatedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant="outline">{report.type.replace('_', ' ')}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Report Preview */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {selectedReport ? selectedReport.name : 'Report Preview'}
                    </CardTitle>
                    <CardDescription>
                      {selectedReport ? `Period: ${selectedReport.period}` : 'Select a report to preview'}
                    </CardDescription>
                  </div>
                  {selectedReport && (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => exportReport('excel')}>
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Excel
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => exportReport('pdf')}>
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                      <Button variant="outline" size="sm">
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!selectedReport ? (
                  <div className="text-center py-12 text-gray-500">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>Select a report to view details</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {selectedReport.summary.map((item, idx) => (
                        <Card key={idx}>
                          <CardContent className="p-4">
                            <p className="text-xs text-gray-500">{item.title}</p>
                            <p className="text-2xl font-bold">{item.value}</p>
                            {item.change !== undefined && (
                              <div className={`flex items-center gap-1 text-sm ${
                                item.trend === 'up' ? 'text-green-600' : 
                                item.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {item.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                                {item.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                                {item.change > 0 ? '+' : ''}{item.change}%
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Report Sections */}
                    <div className="space-y-4">
                      {selectedReport.sections.map((section, idx) => (
                        <Card key={idx}>
                          <CardHeader>
                            <CardTitle className="text-base">{section.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {section.type === 'table' && (
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b">
                                      <th className="text-left py-2">Category</th>
                                      <th className="text-right py-2">Count</th>
                                      <th className="text-right py-2">Avg Weight</th>
                                      <th className="text-right py-2">ADG</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr className="border-b">
                                      <td className="py-2">Cattle - Breeding</td>
                                      <td className="text-right">45</td>
                                      <td className="text-right">520 kg</td>
                                      <td className="text-right">0.8 kg/d</td>
                                    </tr>
                                    <tr className="border-b">
                                      <td className="py-2">Cattle - Commercial</td>
                                      <td className="text-right">120</td>
                                      <td className="text-right">420 kg</td>
                                      <td className="text-right">1.2 kg/d</td>
                                    </tr>
                                    <tr className="border-b">
                                      <td className="py-2">Sheep</td>
                                      <td className="text-right">65</td>
                                      <td className="text-right">55 kg</td>
                                      <td className="text-right">0.15 kg/d</td>
                                    </tr>
                                    <tr>
                                      <td className="py-2">Goats</td>
                                      <td className="text-right">15</td>
                                      <td className="text-right">42 kg</td>
                                      <td className="text-right">0.1 kg/d</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            )}
                            {section.type === 'chart' && (
                              <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
                                <PieChartIcon className="w-12 h-12 text-gray-300" />
                                <span className="ml-2 text-gray-500">Chart visualization would appear here</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <p className="text-sm text-gray-500">
                        Generated: {new Date(selectedReport.generatedAt).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Calendar className="w-4 h-4 mr-2" />
                          Schedule
                        </Button>
                        <Button variant="outline" size="sm">
                          Share
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Scheduled Reports Tab */}
        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Scheduled Reports</CardTitle>
              <CardDescription>Automated report generation schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No scheduled reports</p>
                <p className="text-sm">Schedule reports to be generated automatically</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Report Templates</CardTitle>
              <CardDescription>Pre-configured report templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportTypes.map((type) => (
                  <Card key={type.id} className="cursor-pointer hover:bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <type.icon className="w-6 h-6 text-amber-600" />
                        <p className="font-medium">{type.name}</p>
                      </div>
                      <p className="text-sm text-gray-500">{type.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generate Report Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate Report</DialogTitle>
            <DialogDescription>
              Configure and generate a new report
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reportName">Report Name</Label>
              <Input
                id="reportName"
                placeholder="e.g., Monthly Herd Summary"
                value={reportConfig.name}
                onChange={(e) => setReportConfig({ ...reportConfig, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reportType">Report Type</Label>
              <Select
                value={reportConfig.type}
                onValueChange={(value) => setReportConfig({ ...reportConfig, type: value as ReportConfig['type'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateRange">Date Range</Label>
              <Select
                value={reportConfig.dateRange}
                onValueChange={(value) => setReportConfig({ ...reportConfig, dateRange: value as ReportConfig['dateRange'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeGraphs"
                checked={reportConfig.includeGraphs}
                onChange={(e) => setReportConfig({ ...reportConfig, includeGraphs: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="includeGraphs" className="font-normal">
                Include graphs and charts
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={generateReport}
              disabled={generating || !reportConfig.name}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
