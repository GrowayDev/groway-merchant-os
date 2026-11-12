'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Monitor,
  Tablet,
  MapPin,
  Clock,
  AlertTriangle,
  Lock,
  Unlock,
  LogOut,
  CreditCard,
  Settings,
  Bell,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  Plus,
  ChevronRight,
  Globe,
  Wifi,
  Fingerprint,
  Key,
  UserCheck,
  FileText
} from 'lucide-react'
import { useSecuritySettings } from '@/lib/hooks/useFraudDetection'

interface SecurityTabProps {
  onBack?: () => void
}

export function SecurityTab({ onBack }: SecurityTabProps) {
  const {
    settings,
    loading,
    fetchSettings,
    updateLimits,
    toggleCardFeature,
    revokeSession,
    revokeAllSessions,
    reportSuspiciousActivity
  } = useSecuritySettings()

  // Local state for editing limits - initialize with defaults, user can adjust
  const [dailyLimit, setDailyLimit] = useState(5000)
  const [monthlyLimit, setMonthlyLimit] = useState(50000)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [reportDescription, setReportDescription] = useState('')
  const [lockAccountDialogOpen, setLockAccountDialogOpen] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // Get current limits from settings for display
  const currentDailyLimit = settings?.walletLimits?.dailyLimit ?? dailyLimit
  const currentMonthlyLimit = settings?.walletLimits?.monthlyLimit ?? monthlyLimit

  const handleUpdateLimits = async () => {
    const success = await updateLimits(dailyLimit, monthlyLimit)
    if (success) {
      toast.success('Spending limits updated')
      fetchSettings()
    } else {
      toast.error('Failed to update limits')
    }
  }

  const handleToggleCardFeature = async (cardId: string, feature: string, enabled: boolean) => {
    const success = await toggleCardFeature(cardId, feature, enabled)
    if (success) {
      toast.success(`Card ${feature.replace('Enabled', '')} ${enabled ? 'enabled' : 'disabled'}`)
      fetchSettings()
    } else {
      toast.error('Failed to update card settings')
    }
  }

  const handleRevokeSession = async (sessionId: string, deviceName: string) => {
    const success = await revokeSession(sessionId)
    if (success) {
      toast.success(`Session on ${deviceName} revoked`)
      fetchSettings()
    } else {
      toast.error('Failed to revoke session')
    }
  }

  const handleRevokeAllSessions = async () => {
    const success = await revokeAllSessions()
    if (success) {
      toast.success('All other sessions revoked')
      fetchSettings()
    } else {
      toast.error('Failed to revoke sessions')
    }
  }

  const handleReportSuspiciousActivity = async () => {
    if (!reportDescription.trim()) {
      toast.error('Please describe the suspicious activity')
      return
    }
    const success = await reportSuspiciousActivity(reportDescription)
    if (success) {
      toast.success('Report submitted. Our team will investigate.')
      setReportDialogOpen(false)
      setReportDescription('')
      fetchSettings()
    } else {
      toast.error('Failed to submit report')
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600'
      case 'medium': return 'text-amber-600'
      case 'high': return 'text-orange-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getRiskLevelBg = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100'
      case 'medium': return 'bg-amber-100'
      case 'high': return 'bg-orange-100'
      case 'critical': return 'bg-red-100'
      default: return 'bg-gray-100'
    }
  }

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return <Smartphone className="h-4 w-4" />
      case 'tablet': return <Tablet className="h-4 w-4" />
      default: return <Monitor className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00897B]"></div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="space-y-4 pb-6">
        {/* Risk Profile Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className={`h-5 w-5 ${getRiskLevelColor(settings?.riskProfile?.level || 'low')}`} />
              Security Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">Risk Score</p>
                <p className={`text-2xl font-bold ${getRiskLevelColor(settings?.riskProfile?.level || 'low')}`}>
                  {settings?.riskProfile?.score || 0}
                </p>
              </div>
              <Badge className={`${getRiskLevelBg(settings?.riskProfile?.level || 'low')} ${getRiskLevelColor(settings?.riskProfile?.level || 'low')} capitalize`}>
                {settings?.riskProfile?.level || 'Low'} Risk
              </Badge>
            </div>
            <Progress 
              value={settings?.riskProfile?.score || 0} 
              className="h-2 bg-gray-100"
            />
            <p className="text-xs text-gray-400 mt-2">
              Last assessed: {settings?.riskProfile?.lastAssessment 
                ? new Date(settings.riskProfile.lastAssessment).toLocaleString()
                : 'Never'}
            </p>

            {/* Security Checklist */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {settings?.user?.hasPin ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span>PIN configured</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {settings?.user?.hasBiometric ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-amber-500" />
                )}
                <span>Biometric authentication</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {settings?.user?.kycLevel && settings.user.kycLevel >= 2 ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-amber-500" />
                )}
                <span>KYC Level {settings?.user?.kycLevel || 0} verified</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Spending Limits */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#00897B]" />
              Spending Limits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Daily Limit</span>
                <span className="font-medium">R {dailyLimit.toLocaleString()}</span>
              </div>
              <Slider
                value={[dailyLimit]}
                onValueChange={([value]) => setDailyLimit(value)}
                min={500}
                max={50000}
                step={500}
                className="w-full"
              />
              <p className="text-xs text-gray-400 mt-1">
                Spent: R {settings?.walletLimits?.dailySpent?.toLocaleString() || 0} of R {settings?.walletLimits?.dailyLimit?.toLocaleString() || 0}
              </p>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Monthly Limit</span>
                <span className="font-medium">R {monthlyLimit.toLocaleString()}</span>
              </div>
              <Slider
                value={[monthlyLimit]}
                onValueChange={([value]) => setMonthlyLimit(value)}
                min={1000}
                max={500000}
                step={1000}
                className="w-full"
              />
              <p className="text-xs text-gray-400 mt-1">
                Spent: R {settings?.walletLimits?.monthlySpent?.toLocaleString() || 0} of R {settings?.walletLimits?.monthlyLimit?.toLocaleString() || 0}
              </p>
            </div>

            <Button 
              onClick={handleUpdateLimits}
              className="w-full bg-[#00897B] hover:bg-[#00695C]"
            >
              Save Limits
            </Button>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-[#00897B]" />
                Active Sessions
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-red-500 hover:text-red-600"
                onClick={handleRevokeAllSessions}
              >
                Revoke All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {settings?.sessions?.map((session) => (
                <div 
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {getDeviceIcon(session.deviceType)}
                    <div>
                      <p className="text-sm font-medium">{session.deviceName || 'Unknown Device'}</p>
                      <p className="text-xs text-gray-400">
                        {session.ipAddress} • {new Date(session.lastActive).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-red-500"
                    onClick={() => handleRevokeSession(session.id, session.deviceName || 'device')}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {(!settings?.sessions || settings.sessions.length === 0) && (
                <p className="text-sm text-gray-400 text-center py-4">No active sessions</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card Security */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#00897B]" />
              Card Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {settings?.cards?.map((card) => (
                <div key={card.id} className="p-3 rounded-lg bg-gray-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">•••• {card.lastFour}</p>
                      <p className="text-xs text-gray-400 capitalize">{card.type} - {card.status}</p>
                    </div>
                    <Badge className={card.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}>
                      {card.status}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Online</span>
                      <Switch 
                        checked={card.features.online}
                        onCheckedChange={(checked) => handleToggleCardFeature(card.id, 'onlineEnabled', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Contactless</span>
                      <Switch 
                        checked={card.features.contactless}
                        onCheckedChange={(checked) => handleToggleCardFeature(card.id, 'contactlessEnabled', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">ATM</span>
                      <Switch 
                        checked={card.features.atm}
                        onCheckedChange={(checked) => handleToggleCardFeature(card.id, 'atmEnabled', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">International</span>
                      <Switch 
                        checked={card.features.international}
                        onCheckedChange={(checked) => handleToggleCardFeature(card.id, 'internationalEnabled', checked)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {(!settings?.cards || settings.cards.length === 0) && (
                <p className="text-sm text-gray-400 text-center py-4">No cards linked</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Security Alerts */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {settings?.recentAlerts?.map((alert) => (
                <div 
                  key={alert.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    alert.severity === 'critical' ? 'bg-red-500' :
                    alert.severity === 'high' ? 'bg-orange-500' :
                    alert.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.description}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge className={alert.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}>
                    {alert.status}
                  </Badge>
                </div>
              ))}
              {(!settings?.recentAlerts || settings.recentAlerts.length === 0) && (
                <div className="text-center py-6 text-gray-400">
                  <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm">No security alerts</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Security Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start text-gray-600"
              onClick={() => setReportDialogOpen(true)}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Report Suspicious Activity
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start text-gray-600"
            >
              <Key className="h-4 w-4 mr-2" />
              Change PIN
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start text-gray-600"
            >
              <Fingerprint className="h-4 w-4 mr-2" />
              Manage Biometrics
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start text-gray-600"
            >
              <FileText className="h-4 w-4 mr-2" />
              Security Audit Log
            </Button>
            <Separator className="my-2" />
            <Button 
              variant="outline" 
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => setLockAccountDialogOpen(true)}
            >
              <Lock className="h-4 w-4 mr-2" />
              Lock Account
            </Button>
          </CardContent>
        </Card>

        {/* Report Dialog */}
        <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report Suspicious Activity</DialogTitle>
              <DialogDescription>
                If you notice any unauthorized transactions or suspicious behavior, please report it immediately.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Description</Label>
                <Textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Please describe what happened..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleReportSuspiciousActivity} className="bg-[#00897B] hover:bg-[#00695C]">
                Submit Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Lock Account Dialog */}
        <Dialog open={lockAccountDialogOpen} onOpenChange={setLockAccountDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-500">
                <Lock className="h-5 w-5" />
                Lock Account
              </DialogTitle>
              <DialogDescription>
                This will temporarily lock your account. You'll need to contact support to unlock it.
                Are you sure you want to proceed?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLockAccountDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive">
                Lock My Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  )
}
