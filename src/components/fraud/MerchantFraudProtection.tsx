'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { 
  Shield,
  AlertTriangle,
  CheckCircle2,
  Zap,
  CreditCard,
  MapPin,
  Smartphone,
  BarChart3,
  Bell,
  AlertCircle,
  Activity,
  Lock,
  FileText
} from 'lucide-react'

interface MerchantFraudAlert {
  id: string
  type: string
  severity: string
  status: string
  transactionId?: string
  amount?: number
  description: string
  riskScore: number
  createdAt: string
}

interface FraudStats {
  totalAlerts: number
  criticalAlerts: number
  resolvedThisMonth: number
  riskScore: number
  riskLevel: string
}

interface MerchantFraudProtectionProps {
  merchantId: string
  merchantName: string
}

export function MerchantFraudProtection({ merchantId, merchantName }: MerchantFraudProtectionProps) {
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<MerchantFraudAlert[]>([])
  const [stats, setStats] = useState<FraudStats | null>(null)
  const [selectedAlert, setSelectedAlert] = useState<MerchantFraudAlert | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [reportDetails, setReportDetails] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch alerts for this merchant
        const alertsResponse = await fetch(`/api/admin/fraud?view=alerts&merchantId=${merchantId}&limit=10`)
        if (alertsResponse.ok) {
          const data = await alertsResponse.json()
          setAlerts(data.alerts || [])
        }

        // Simulate stats
        setStats({
          totalAlerts: 12,
          criticalAlerts: 2,
          resolvedThisMonth: 8,
          riskScore: 35,
          riskLevel: 'low'
        })
      } catch (error) {
        console.error('Error fetching fraud data:', error)
      }
      setLoading(false)
    }
    fetchData()
  }, [merchantId])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/20'
      case 'high': return 'text-amber-400 bg-amber-500/20'
      case 'medium': return 'text-blue-400 bg-blue-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'velocity': return <Zap className="h-3 w-3" />
      case 'amount': return <CreditCard className="h-3 w-3" />
      case 'location': return <MapPin className="h-3 w-3" />
      case 'device': return <Smartphone className="h-3 w-3" />
      default: return <AlertTriangle className="h-3 w-3" />
    }
  }

  const handleReportFraud = async () => {
    if (!reportDetails.trim()) {
      toast.error('Please provide details about the suspicious activity')
      return
    }

    try {
      const response = await fetch('/api/admin/fraud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_alert',
          type: 'behavior',
          severity: 'medium',
          merchantId,
          merchantName,
          description: `Merchant-reported suspicious activity: ${reportDetails}`,
          source: 'merchant_report',
          sourceApp: 'merchant_os'
        })
      })

      if (response.ok) {
        toast.success('Fraud report submitted successfully')
        setReportDialogOpen(false)
        setReportDetails('')
      } else {
        toast.error('Failed to submit report')
      }
    } catch (error) {
      toast.error('Failed to submit report')
    }
  }

  const formatCurrency = (value?: number) => {
    if (!value) return 'N/A'
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-ZA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Card className="bg-[#1E293B] border-gray-700">
        <CardContent className="p-6 flex items-center justify-center">
          <Activity className="h-6 w-6 animate-spin text-[#00897B]" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Protection Status */}
      <Card className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#00897B]" />
            Fraud Protection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                <Lock className="h-6 w-6 text-green-400" />
              </div>
              <p className="text-xs text-gray-400">Protection</p>
              <p className="text-sm font-medium text-green-400">Active</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2"
                style={{ 
                  backgroundColor: stats?.riskScore && stats.riskScore >= 70 ? 'rgba(239, 68, 68, 0.2)' :
                    stats?.riskScore && stats.riskScore >= 40 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(34, 197, 94, 0.2)'
                }}
              >
                <span className={`text-lg font-bold ${
                  stats?.riskScore && stats.riskScore >= 70 ? 'text-red-400' :
                  stats?.riskScore && stats.riskScore >= 40 ? 'text-amber-400' : 'text-green-400'
                }`}>
                  {stats?.riskScore || 0}
                </span>
              </div>
              <p className="text-xs text-gray-400">Risk Score</p>
              <p className="text-sm font-medium text-white capitalize">{stats?.riskLevel || 'N/A'}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#00897B]/20 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="h-6 w-6 text-[#00897B]" />
              </div>
              <p className="text-xs text-gray-400">Resolved</p>
              <p className="text-sm font-medium text-white">{stats?.resolvedThisMonth || 0}</p>
            </div>
          </div>

          <Button 
            size="sm" 
            className="w-full bg-[#00897B] hover:bg-[#00695C]"
            onClick={() => setReportDialogOpen(true)}
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Report Suspicious Activity
          </Button>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <Card className="bg-[#1E293B] border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-400" />
              Active Alerts
            </span>
            {alerts.filter(a => a.status === 'new').length > 0 && (
              <Badge className="bg-red-500/20 text-red-400 border-0">
                {alerts.filter(a => a.status === 'new').length} New
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            {alerts.length > 0 ? (
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      alert.severity === 'critical' 
                        ? 'bg-red-500/10 border-red-500/30' 
                        : 'bg-[#0F172A] border-gray-700/50 hover:border-gray-600'
                    }`}
                    onClick={() => { setSelectedAlert(alert); setDetailDialogOpen(true); }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded flex items-center justify-center ${getSeverityColor(alert.severity)}`}>
                          {getTypeIcon(alert.type)}
                        </div>
                        <div>
                          <p className="text-sm text-white">{alert.description}</p>
                          <p className="text-xs text-gray-400">
                            {formatCurrency(alert.amount)} • {formatDate(alert.createdAt)}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${getSeverityColor(alert.severity)} border-0 capitalize text-xs`}>
                        {alert.severity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active alerts</p>
                <p className="text-xs">Your account is protected</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Fraud Metrics */}
      <Card className="bg-[#1E293B] border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#00897B]" />
            Protection Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Transaction Security</span>
              <span className="text-green-400">98%</span>
            </div>
            <Progress value={98} className="h-2 bg-gray-700 [&>div]:bg-green-500" />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Velocity Checks</span>
              <span className="text-green-400">Active</span>
            </div>
            <Progress value={100} className="h-2 bg-gray-700 [&>div]:bg-[#00897B]" />
          </div>
        </CardContent>
      </Card>

      {/* Alert Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-md bg-[#1E293B] border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              Alert Details
            </DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-3">
              <div className="bg-[#0F172A] rounded-lg p-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-400">Type:</span>
                    <span className="text-white ml-2 capitalize">{selectedAlert.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Severity:</span>
                    <Badge className={`ml-2 ${getSeverityColor(selectedAlert.severity)} border-0 capitalize`}>
                      {selectedAlert.severity}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-400">Amount:</span>
                    <span className="text-white ml-2">{formatCurrency(selectedAlert.amount)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Risk Score:</span>
                    <span className="text-white ml-2">{selectedAlert.riskScore}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-300">{selectedAlert.description}</p>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDetailDialogOpen(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Fraud Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-md bg-[#1E293B] border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#00897B]" />
              Report Suspicious Activity
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Report any suspicious transactions or activities
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Please describe the suspicious activity..."
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              className="bg-[#0F172A] border-gray-600 text-white min-h-[120px]"
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setReportDialogOpen(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleReportFraud}
              className="bg-[#00897B] hover:bg-[#00695C]"
            >
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
