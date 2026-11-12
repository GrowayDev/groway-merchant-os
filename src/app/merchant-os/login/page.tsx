'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Store, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  ArrowLeft,
  Smartphone,
  Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function LoginPage() {
  const router = useRouter()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null)
  const [error, setError] = useState('')
  const [loginMethod, setLoginMethod] = useState<'password' | 'pin'>('password')

  // Handle Google OAuth login
  const handleGoogleLogin = () => {
    setOauthLoading('google')
    setError('')
    // Redirect to Google OAuth
    window.location.href = '/api/auth/oauth/google/authorize?redirect=/merchant-os/app'
  }

  // Handle Apple OAuth login
  const handleAppleLogin = () => {
    setOauthLoading('apple')
    setError('')
    // Redirect to Apple OAuth
    window.location.href = '/api/auth/oauth/apple/authorize?redirect=/merchant-os/app'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/merchant-os/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          loginMethod === 'password' 
            ? { email, password } 
            : { email, pin }
        )
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Set cookie for middleware auth
        const sessionData = {
          userId: data.user.id,
          merchantId: data.merchant.id,
          branchId: data.branchId,
          token: data.token
        }
        document.cookie = `groway_session=${encodeURIComponent(JSON.stringify(sessionData))}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
        
        // Also store full session in localStorage
        localStorage.setItem('groway_session', JSON.stringify({
          user: data.user,
          merchant: data.merchant,
          branchId: data.branchId,
          token: data.token
        }))
        router.push('/merchant-os/app')
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#00695C] via-[#00897B] to-[#4CAF50]">
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
              <div className="w-16 h-16 mx-auto mb-4 bg-[#E0F2F1] text-[#00897B] rounded-xl flex items-center justify-center">
                <Store className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl font-bold text-[#1A1A1A]">
                Merchant Login
              </CardTitle>
              <CardDescription>
                Access your Merchant OS dashboard
              </CardDescription>
            </CardHeader>

            <CardContent>
              {/* Social Login Buttons */}
              <div className="space-y-3 mb-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 border-gray-300 hover:bg-gray-50"
                  onClick={handleGoogleLogin}
                  disabled={oauthLoading !== null}
                >
                  {oauthLoading === 'google' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  Continue with Google
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 border-gray-300 hover:bg-gray-50"
                  onClick={handleAppleLogin}
                  disabled={oauthLoading !== null}
                >
                  {oauthLoading === 'apple' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                  )}
                  Continue with Apple
                </Button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-[#757575]">Or sign in with email</span>
                </div>
              </div>

              <Tabs value={loginMethod} onValueChange={(v) => setLoginMethod(v as 'password' | 'pin')}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password
                  </TabsTrigger>
                  <TabsTrigger value="pin" className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Quick PIN
                  </TabsTrigger>
                </TabsList>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <TabsContent value="password" className="mt-0">
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
                  </TabsContent>

                  <TabsContent value="pin" className="mt-0">
                    <div className="space-y-2">
                      <Label htmlFor="pin">4-Digit PIN</Label>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                        <Input
                          id="pin"
                          type="password"
                          placeholder="••••"
                          value={pin}
                          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          className="pl-10 text-center tracking-[1em]"
                          maxLength={4}
                          required
                        />
                      </div>
                      <p className="text-xs text-[#757575]">
                        Quick PIN login for faster access at your terminal
                      </p>
                    </div>
                  </TabsContent>

                  {/* Error Message */}
                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full bg-[#00897B] hover:bg-[#00695C] text-white font-medium py-5"
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
              </Tabs>

              {/* Forgot Password */}
              <div className="mt-4 text-center">
                <a href="#" className="text-sm text-[#00897B] hover:underline">
                  Forgot password?
                </a>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 border-t pt-6">
              <p className="text-sm text-[#757575] text-center">
                Don&apos;t have an account?
              </p>
              <Link href="/merchant-os/signup" className="w-full">
                <Button variant="outline" className="w-full border-[#00897B] text-[#00897B] hover:bg-[#E0F2F1]">
                  Create Free Account
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Trust Badges */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <Badge variant="outline" className="bg-white/80 border-white/30 text-[#1A1A1A]">
              <Shield className="h-3 w-3 mr-1" />
              PCI-DSS Secure
            </Badge>
            <Badge variant="outline" className="bg-white/80 border-white/30 text-[#1A1A1A]">
              <Lock className="h-3 w-3 mr-1" />
              POPIA Compliant
            </Badge>
          </div>
        </div>
      </main>
    </div>
  )
}
