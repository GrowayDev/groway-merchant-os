'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { 
  Settings,
  User,
  Shield,
  Bell,
  Globe,
  Key,
  Clock,
  Database,
  Mail,
  Phone,
  Save,
  RefreshCw,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react'

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [mfaEnabled, setMfaEnabled] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [autoLogout, setAutoLogout] = useState('30')

  const handleSave = () => {
    toast.success('Settings saved successfully')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 text-sm">Manage your account and platform preferences</p>
        </div>
        <Button className="bg-[#00897B] hover:bg-[#00695C] text-white" onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#1E293B] border border-gray-700">
          <TabsTrigger value="profile" className="data-[state=active]:bg-[#00897B]">Profile</TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-[#00897B]">Security</TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-[#00897B]">Notifications</TabsTrigger>
          <TabsTrigger value="sessions" className="data-[state=active]:bg-[#00897B]">Sessions</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-4">
          <Card className="bg-[#1E293B] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <User className="h-4 w-4 text-[#00897B]" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-gray-300">Full Name</Label>
                  <Input 
                    defaultValue="John Doe"
                    className="bg-[#0F172A] border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Email Address</Label>
                  <Input 
                    defaultValue="john.doe@groway.co.za"
                    type="email"
                    className="bg-[#0F172A] border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Phone Number</Label>
                  <Input 
                    defaultValue="+27 82 123 4567"
                    className="bg-[#0F172A] border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Role</Label>
                  <Input 
                    defaultValue="Super Admin"
                    disabled
                    className="bg-gray-700 border-gray-600 text-gray-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Department</Label>
                <Select defaultValue="operations">
                  <SelectTrigger className="bg-[#0F172A] border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1E293B] border-gray-700 text-white">
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="management">Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-4">
          <div className="space-y-4">
            <Card className="bg-[#1E293B] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Key className="h-4 w-4 text-[#00897B]" />
                  Password
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Current Password</Label>
                  <div className="relative">
                    <Input 
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter current password"
                      className="bg-[#0F172A] border-gray-600 text-white pr-10"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">New Password</Label>
                    <Input 
                      type="password"
                      placeholder="Enter new password"
                      className="bg-[#0F172A] border-gray-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Confirm Password</Label>
                    <Input 
                      type="password"
                      placeholder="Confirm new password"
                      className="bg-[#0F172A] border-gray-600 text-white"
                    />
                  </div>
                </div>
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  Update Password
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-[#1E293B] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#00897B]" />
                  Two-Factor Authentication
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">Multi-Factor Authentication</p>
                    <p className="text-xs text-gray-400">Require MFA for all logins</p>
                  </div>
                  <Switch 
                    checked={mfaEnabled} 
                    onCheckedChange={setMfaEnabled}
                  />
                </div>
                {mfaEnabled && (
                  <div className="mt-4 p-4 bg-[#0F172A] rounded-lg">
                    <p className="text-sm text-white mb-2">Authenticator App</p>
                    <p className="text-xs text-gray-400 mb-3">Use an authenticator app to get verification codes</p>
                    <Badge className="bg-green-500/20 text-green-400">Enabled</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-[#1E293B] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#00897B]" />
                  Session Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label className="text-gray-300">Auto Logout (minutes)</Label>
                  <Select value={autoLogout} onValueChange={setAutoLogout}>
                    <SelectTrigger className="w-48 bg-[#0F172A] border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1E293B] border-gray-700 text-white">
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-4">
          <Card className="bg-[#1E293B] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-[#00897B]" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between py-3 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-white">Email Notifications</p>
                    <p className="text-xs text-gray-400">Receive alerts via email</p>
                  </div>
                </div>
                <Switch 
                  checked={emailNotifications} 
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-white">SMS Notifications</p>
                    <p className="text-xs text-gray-400">Receive alerts via SMS</p>
                  </div>
                </div>
                <Switch 
                  checked={smsNotifications} 
                  onCheckedChange={setSmsNotifications}
                />
              </div>

              <div className="space-y-4 pt-4">
                <p className="text-sm text-white font-medium">Alert Types</p>
                {[
                  { label: 'Critical System Alerts', description: 'System downtime, errors', enabled: true },
                  { label: 'Fraud Alerts', description: 'Suspicious transactions', enabled: true },
                  { label: 'Compliance Alerts', description: 'KYC, POPIA, AML', enabled: true },
                  { label: 'Merchant Applications', description: 'New merchant signups', enabled: false },
                  { label: 'Support Tickets', description: 'New ticket assignments', enabled: true },
                ].map((alert, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm text-white">{alert.label}</p>
                      <p className="text-xs text-gray-400">{alert.description}</p>
                    </div>
                    <Switch defaultChecked={alert.enabled} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="mt-4">
          <Card className="bg-[#1E293B] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#00897B]" />
                Active Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { device: 'Chrome on Windows', location: 'Johannesburg, SA', ip: '41.xxx.xxx.xxx', current: true, lastActive: 'Now' },
                  { device: 'Safari on iPhone', location: 'Johannesburg, SA', ip: '105.xxx.xxx.xxx', current: false, lastActive: '2 hours ago' },
                  { device: 'Firefox on MacOS', location: 'Cape Town, SA', ip: '169.xxx.xxx.xxx', current: false, lastActive: 'Yesterday' },
                ].map((session, index) => (
                  <div key={index} className={`flex items-center justify-between p-4 rounded-lg ${session.current ? 'bg-[#00897B]/10 border border-[#00897B]/30' : 'bg-[#0F172A] border border-gray-700/50'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${session.current ? 'bg-[#00897B]/20 text-[#00897B]' : 'bg-gray-700 text-gray-400'}`}>
                        <Lock className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-white">{session.device}</p>
                          {session.current && (
                            <Badge className="bg-[#00897B]/20 text-[#00897B]">Current</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{session.location} • {session.ip}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-400">{session.lastActive}</span>
                      {!session.current && (
                        <Button variant="outline" size="sm" className="border-red-500 text-red-400 hover:bg-red-500/20">
                          Revoke
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4 border-red-500 text-red-400 hover:bg-red-500/20">
                Sign Out All Other Sessions
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
