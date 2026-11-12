'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Shield,
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  ArrowLeft,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function AdminConsoleLoginPage() {
  const router = useRouter()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Store session
        document.cookie = `admin_session=${encodeURIComponent(JSON.stringify({
          userId: data.user.id,
          role: data.user.role,
          token: data.token
        }))}; path=/; max-age=${8 * 60 * 60}; SameSite=Lax`
        
        localStorage.setItem('admin_session', JSON.stringify({
          user: data.user,
          token: data.token
        }))
        
        router.push('/admin-console/app')
      } else {
        setError(data.error || 'Login failed')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#1A1A1A] via-[#2D2D2D] to-[#1A1A1A]">
      {/* Header */}
      <header className="p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to Home</span>
          </Link>
          <img src="/groway-logo.png" alt="Groway" className="h-8 w-auto" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-2xl">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#1A1A1A] text-[#00897B] rounded-xl flex items-center justify-center">
                <Shield className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl font-bold text-[#1A1A1A]">
                Admin Console
              </CardTitle>
              <CardDescription>
                Internal Operations Access
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@groway.co.za"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#757575] hover:text-[#1A1A1A]"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-[#1A1A1A] hover:bg-[#333] text-white font-medium py-5"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 border-t pt-6">
              <p className="text-xs text-[#757575] text-center">
                Access restricted to authorized Groway team members only.
                <br />
                All actions are logged and audited.
              </p>
            </CardFooter>
          </Card>

          {/* Trust Badges */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <Badge variant="outline" className="bg-white/80 border-white/30 text-[#1A1A1A]">
              <Shield className="h-3 w-3 mr-1" />
              MFA Required
            </Badge>
            <Badge variant="outline" className="bg-white/80 border-white/30 text-[#1A1A1A]">
              <Lock className="h-3 w-3 mr-1" />
              IP Restricted
            </Badge>
          </div>
        </div>
      </main>
    </div>
  )
}
