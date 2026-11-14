'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, Globe, Moon, Fingerprint, Smartphone, Shield, Sparkles } from 'lucide-react'
import { useState } from 'react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsModal({ open, onOpenChange }: Props) {
  const [pushNotif, setPushNotif] = useState(true)
  const [smsNotif, setSmsNotif] = useState(true)
  const [emailNotif, setEmailNotif] = useState(false)
  const [biometric, setBiometric] = useState(false)
  const [language, setLanguage] = useState('English')
  const [darkMode, setDarkMode] = useState(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Notifications */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-4 w-4 text-[#00897B]" />
                <span className="text-sm font-semibold">Notifications</span>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Push notifications</Label>
                <Switch checked={pushNotif} onCheckedChange={setPushNotif} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">SMS alerts</Label>
                <Switch checked={smsNotif} onCheckedChange={setSmsNotif} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Email notifications</Label>
                <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-[#00897B]" />
                <span className="text-sm font-semibold">Security</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Fingerprint className="h-4 w-4 text-[#757575]" />
                  <Label className="text-sm">Biometric login</Label>
                </div>
                <Switch checked={biometric} onCheckedChange={setBiometric} />
              </div>
              <Button variant="outline" size="sm" className="w-full">Change PIN</Button>
              <Button variant="outline" size="sm" className="w-full">Change Password</Button>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-[#00897B]" />
                <span className="text-sm font-semibold">Preferences</span>
              </div>
              <div>
                <Label className="text-sm">Language</Label>
                <select className="mt-1 w-full rounded-md border px-3 py-1.5 text-sm" value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option>English</option><option>Afrikaans</option><option>isiZulu</option><option>isiXhosa</option><option>Sesotho</option><option>Chichewa</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4 text-[#757575]" />
                  <Label className="text-sm">Dark mode</Label>
                </div>
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              </div>
            </CardContent>
          </Card>

          {/* App Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#757575]">Version</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-[#757575]">Build</span>
                <span className="font-medium">2026.11.14</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
