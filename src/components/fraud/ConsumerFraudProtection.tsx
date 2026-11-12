'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
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
  Lock,
  AlertCircle,
  FileText,
  Activity,
  Eye,
  Bell
} from 'lucide-react'

interface ConsumerFraudProtectionProps {
  userId: string
  userName?: string
  compact?: boolean
}

export function ConsumerFraudProtection({ userId, userName, compact = false }: ConsumerFraudProtectionProps) {
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [reportDetails, setReportDetails] = useState('')
  const [securityDialogOpen, setSecurityDialogOpen] = useState(false)

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
          userId,
          userName,
          description: `Consumer-reported suspicious activity: ${reportDetails}`,
          source: 'consumer_report',
          sourceApp: 'consumer_wallet'
        })
      })

      if (response.ok) {
        toast.success('Report submitted successfully. Our team will review it.')
        setReportDialogOpen(false)
        setReportDetails('')
      } else {
        toast.error('Failed to submit report')
      }
    } catch (error) {
      toast.error('Failed to submit report')
    }
  }

  if (compact) {
    return (
      <>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Shield className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#1A1A1A]">Security Status</p>
                <p className="text-xs text-green-600">Protected</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-700 border-0">Active</Badge>
          </div>
          <Button 
            size="sm" 
            variant="outline"
            className="w-full"
            onClick={() => setReportDialogOpen(true)}
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Report Suspicious Activity
          </Button>
        </div>

        {/* Report Dialog */}
        <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
          <DialogContent className="max-w-md bg-white text-[#1A1A1A]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#00897B]" />
                Report Suspicious Activity
              </DialogTitle>
              <DialogDescription className="text-gray-500">
                Report any unauthorized transactions or suspicious activities
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Please describe the suspicious activity (e.g., unrecognized transactions, account access issues)..."
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                className="bg-gray-50 border-gray-200 min-h-[120px]"
              />
              <p className="text-xs text-gray-500">
                Your report will be reviewed within 24 hours. For urgent issues, contact support.
              </p>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setReportDialogOpen(false)}
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
      </>
    )
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5 text-[#00897B]" />
        Security & Fraud Protection
      </h2>

      <div className="space-y-4">
        {/* Security Status Card */}
        <Card className="bg-gradient-to-r from-[#00897B]/10 to-[#4CAF50]/10 border-[#00897B]/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Lock className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#1A1A1A]">Your account is protected</p>
                <p className="text-xs text-gray-500">All security features are active</p>
              </div>
              <Badge className="bg-green-500 text-white border-0">Secure</Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center mb-4">
              <div className="bg-white/50 rounded-lg p-2">
                <p className="text-lg font-bold text-[#1A1A1A]">0</p>
                <p className="text-xs text-gray-500">Alerts</p>
              </div>
              <div className="bg-white/50 rounded-lg p-2">
                <p className="text-lg font-bold text-green-600">Low</p>
                <p className="text-xs text-gray-500">Risk Level</p>
              </div>
              <div className="bg-white/50 rounded-lg p-2">
                <p className="text-lg font-bold text-[#1A1A1A]">100%</p>
                <p className="text-xs text-gray-500">Protected</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">Transaction Monitoring</span>
                  <span className="text-green-600">Active</span>
                </div>
                <Progress value={100} className="h-2 bg-gray-200 [&>div]:bg-green-500" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">Real-time Protection</span>
                  <span className="text-green-600">Active</span>
                </div>
                <Progress value={100} className="h-2 bg-gray-200 [&>div]:bg-[#00897B]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline"
            className="h-auto py-4 flex-col gap-2"
            onClick={() => setSecurityDialogOpen(true)}
          >
            <Eye className="h-5 w-5 text-[#00897B]" />
            <span className="text-xs">View Activity</span>
          </Button>
          <Button 
            variant="outline"
            className="h-auto py-4 flex-col gap-2"
            onClick={() => setReportDialogOpen(true)}
          >
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <span className="text-xs">Report Issue</span>
          </Button>
        </div>

        {/* Recent Security Events */}
        <Card className="border border-gray-200">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-[#1A1A1A] mb-3">Recent Security Events</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <p className="text-xs text-[#1A1A1A]">Login from recognized device</p>
                  <p className="text-xs text-gray-500">Today, 10:30 AM</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                <Shield className="h-4 w-4 text-[#00897B]" />
                <div className="flex-1">
                  <p className="text-xs text-[#1A1A1A]">Security scan completed</p>
                  <p className="text-xs text-gray-500">Yesterday</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-md bg-white text-[#1A1A1A]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#00897B]" />
              Report Suspicious Activity
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Report any unauthorized transactions or suspicious activities
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Please describe the suspicious activity..."
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              className="bg-gray-50 border-gray-200 min-h-[120px]"
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setReportDialogOpen(false)}
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

      {/* Security Activity Dialog */}
      <Dialog open={securityDialogOpen} onOpenChange={setSecurityDialogOpen}>
        <DialogContent className="max-w-md bg-white text-[#1A1A1A]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#00897B]" />
              Security Activity
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Your recent security events and alerts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm text-[#1A1A1A]">Login from recognized device</p>
                <p className="text-xs text-gray-500">Johannesburg, SA • Today 10:30 AM</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="h-5 w-5 text-[#00897B]" />
              <div className="flex-1">
                <p className="text-sm text-[#1A1A1A]">Security scan completed</p>
                <p className="text-xs text-gray-500">No issues found • Yesterday</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Lock className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-[#1A1A1A]">PIN updated</p>
                <p className="text-xs text-gray-500">3 days ago</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setSecurityDialogOpen(false)}
              className="w-full"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
