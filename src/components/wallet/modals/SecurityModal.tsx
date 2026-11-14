'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Smartphone, Fingerprint, Eye, EyeOff, Lock, Smartphone as Phone, AlertCircle, CheckCircle2 } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SecurityModal({ open, onOpenChange }: Props) {
  const sessions = [
    { device: 'iPhone 13 Pro', location: 'Johannesburg, ZA', lastActive: 'Active now', current: true },
    { device: 'Chrome on Mac', location: 'Johannesburg, ZA', lastActive: '2 hours ago', current: false },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-[#00897B]" /> Security</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Security Status */}
          <Card className="bg-[#4CAF50]/5 border-[#4CAF50]/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-[#4CAF50]" />
                <span className="font-semibold text-sm">Your wallet is secure</span>
              </div>
              <p className="text-xs text-[#757575]">All security features are active. Your wallet is protected by PIN, biometric login, and 2FA.</p>
            </CardContent>
          </Card>

          {/* Security Features */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#00897B]" />
                <span className="text-sm">PIN</span>
              </div>
              <Badge className="bg-[#4CAF50]/20 text-[#4CAF50] border-0 text-xs">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-[#00897B]" />
                <span className="text-sm">Biometric Login</span>
              </div>
              <Badge className="bg-[#4CAF50]/20 text-[#4CAF50] border-0 text-xs">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#00897B]" />
                <span className="text-sm">Two-Factor Authentication</span>
              </div>
              <Badge className="bg-[#4CAF50]/20 text-[#4CAF50] border-0 text-xs">Enabled</Badge>
            </div>
          </div>

          {/* Active Sessions */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Active Sessions</h3>
            <div className="space-y-2">
              {sessions.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-[#757575]" />
                    <div>
                      <p className="text-sm font-medium">{s.device}</p>
                      <p className="text-[10px] text-[#757575]">{s.location} · {s.lastActive}</p>
                    </div>
                  </div>
                  {s.current ? <Badge className="bg-[#00897B] text-white border-0 text-xs">Current</Badge> : <Button size="sm" variant="ghost" className="text-red-500 text-xs">Revoke</Button>}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button variant="outline" className="w-full">Change PIN</Button>
            <Button variant="outline" className="w-full">Change Password</Button>
            <Button variant="outline" className="w-full text-red-500 border-red-200 hover:bg-red-50">Freeze Wallet</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
