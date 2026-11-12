'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'

export default function GroCoreLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('demo@groway.co.za')
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
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()
      if (response.ok && data.success) {
        const tenantId = data.merchant?.id || data.user?.id || 'demo-tenant'
        try {
          localStorage.setItem('grocore_tenant_id', tenantId)
          localStorage.setItem('grocore_session', JSON.stringify({ user: data.user, merchant: data.merchant }))
        } catch {}
        toast.success('Signed in to GroCore')
        router.push('/grocore/app')
      } else {
        setError(data.error || 'Login failed')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemo = () => { setEmail('demo@groway.co.za'); setPassword('demo1234') }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/grocore" className="flex items-center gap-2 text-sm text-slate-600 hover:text-[#0F766E]">
            <ArrowLeft className="h-4 w-4" /><span>Back to landing</span>
          </Link>
          <div className="flex items-center gap-2">
            <img src="/groway-logo.png" alt="Groway" className="h-8 w-auto" />
            <span className="text-base font-bold text-slate-900">GroCore</span>
          </div>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Sign in to GroCore</CardTitle>
              <CardDescription>Enter your credentials to access the dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">{error}</div>}
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="demo@groway.co.za" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-[#0F766E] hover:bg-[#0F766E]/90" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={fillDemo}>Fill demo credentials</Button>
              </form>
              <div className="mt-4 rounded-md bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200">
                <p className="font-semibold mb-1">Demo credentials:</p>
                <p>Email: demo@groway.co.za (or spaza@groway.co.za)</p>
                <p>Password: demo1234</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <footer className="mt-auto border-t border-slate-200 bg-white py-4">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-slate-500">GroCore v1.0 — Financial OS | Groway (Pty) Ltd</div>
      </footer>
    </div>
  )
}
