'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2,
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

export default function EnterpriseLoginPage() {
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
      const response = await fetch('/merchant-os/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok && data.success && data.token) {
        // groway_session cookie is required by proxy.ts for protected page routes
        document.cookie = `groway_session=${encodeURIComponent(JSON.stringify({
          userId: data.user?.id,
          role: data.user?.role,
          token: data.token
        }))}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`

        localStorage.setItem('enterprise_session', JSON.stringify({
          user: data.user,
          merchant: data.merchant,
          token: data.token
        }))

        // Honor ?redirect= param with open-redirect guard
        const redirectParam = new URLSearchParams(window.location.search).get('redirect')
        const target = redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')
          ? redirectParam
          : '/enterprise/portal'
        router.push(target)
      } else {
        setError(data.error || 'Invalid email or password')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemo = () => {
    setEmail('demo@groway.co.za')
    setPassword('demo1234')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#004D40] via-[#00695C] to-[#004D40]">
      {/* Header */}
      <header className="p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to home</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-white">Groway Enterprise</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Enterprise Portal</h1>
            <p className="text-emerald-100/80 mt-2 text-sm">
              Manage corporate clients, merchant networks, inventory transfers and white-label deployments.
            </p>
          </div>

          <Card className="border-0 shadow-2xl">
            <CardHeader>
              <CardTitle>Sign in</CardTitle>
              <CardDescription>Enter your enterprise credentials to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="enterprise@groway.co.za"
                      className="pl-9"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="pl-9 pr-9"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#00897B] hover:bg-[#00695C] text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in to Enterprise Portal'
                  )}
                </Button>

                <button
                  type="button"
                  onClick={fillDemo}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Use demo credentials (demo@groway.co.za / demo1234)
                </button>
              </form>
            </CardContent>
            <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                Corporate Admins &amp; Partners
              </Badge>
              <span>Protected by Groway Security</span>
            </CardFooter>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center">
        <p className="text-xs text-emerald-100/60">
          Groway Enterprise — powering wholesale networks, franchises and buying groups across South Africa.
        </p>
      </footer>
    </div>
  )
}
