'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  Store, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2,
  AlertCircle,
  CheckCircle2,
  Smartphone,
  Building2
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLogin: (data: LoginData) => void
  onRegister: () => void
}

export interface LoginData {
  user: {
    id: string
    email: string
    name: string
    role: string
  }
  merchant: {
    id: string
    code: string
    name: string
    tradingName?: string
    vertical: string
    subVertical?: string
    logo?: string
    onboardingComplete: boolean
    onboardingStep?: string
  }
  branch?: {
    id: string
    name: string
    code: string
  }
  token: string
}

export function LoginDialog({ open, onOpenChange, onLogin, onRegister }: LoginDialogProps) {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'pin'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    setError(null)
    
    if (!email) {
      setError('Please enter your email')
      return
    }
    
    if (mode === 'login' && !password) {
      setError('Please enter your password')
      return
    }
    
    if (mode === 'pin' && !pin) {
      setError('Please enter your PIN')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/merchant-os/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: mode === 'login' ? password : undefined,
          pin: mode === 'pin' ? pin : undefined
        })
      })

      const result = await response.json()

      if (result.success) {
        // Store token in cookie
        document.cookie = `auth_token=${result.data.token}; path=/; max-age=${7 * 24 * 60 * 60}`
        
        // Call onLogin callback
        onLogin(result.data)
        
        // Navigate to merchant OS
        router.push('/merchant-os/app')
      } else {
        setError(result.error || 'Login failed')
      }
    } catch (err) {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00897B] to-[#4CAF50] flex items-center justify-center shadow-lg">
              <Store className="h-8 w-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">Welcome to Merchant OS</DialogTitle>
          <DialogDescription className="text-center">
            Sign in to access your business dashboard
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Mode Tabs */}
          <div className="flex border rounded-lg overflow-hidden">
            <button
              className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 ${
                mode === 'login' ? 'bg-[#00897B] text-white' : 'bg-gray-50 text-gray-600'
              }`}
              onClick={() => setMode('login')}
            >
              <Lock className="h-4 w-4" />
              Password
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 ${
                mode === 'pin' ? 'bg-[#00897B] text-white' : 'bg-gray-50 text-gray-600'
              }`}
              onClick={() => setMode('pin')}
            >
              <Smartphone className="h-4 w-4" />
              Quick PIN
            </button>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="you@business.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
          </div>

          {/* Password or PIN */}
          {mode === 'login' ? (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="pin">4-Digit PIN</Label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="pin"
                  type="password"
                  placeholder="••••"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="pl-10 text-center tracking-widest"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Button */}
          <Button
            className="w-full bg-[#00897B] hover:bg-[#00695C]"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or</span>
            </div>
          </div>

          {/* Register */}
          <Button
            variant="outline"
            className="w-full"
            onClick={onRegister}
          >
            <Building2 className="h-4 w-4 mr-2" />
            Register New Business
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
