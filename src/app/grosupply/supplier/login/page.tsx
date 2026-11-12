'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Truck,
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

export default function SupplierLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    setTimeout(() => {
      const demoSupplier = {
        id: 'sup_demo_001',
        name: email.split('@')[0] || 'Demo Supplier',
        email,
        companyName: 'Demo Wholesale SA',
        tier: 'gold',
        verificationStatus: 'verified'
      }
      
      localStorage.setItem('grosupply_supplier_session', JSON.stringify({
        supplier: demoSupplier,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000
      }))
      
      router.push('/grosupply/supplier/portal')
    }, 1000)
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#E0F2F1] via-white to-[#E8F5E9]">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-[#00695C] via-[#00897B] to-[#4CAF50] text-white">
        <div>
          <Link href="/grosupply" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">GroSupply</span>
          </Link>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight">Supplier Portal</h1>
          <p className="text-lg text-teal-100">
            Manage orders, submit quotes, track payments, and grow your business.
          </p>
          
          <div className="grid grid-cols-2 gap-4 pt-6">
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-2xl font-bold">500+</p>
              <p className="text-sm text-teal-100">Active Merchants</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-2xl font-bold">R17.4M</p>
              <p className="text-sm text-teal-100">GMV Target</p>
            </div>
          </div>
        </div>

        <div className="text-sm text-teal-200">© 2026 Groway. All rights reserved.</div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center mb-8">
            <Link href="/grosupply" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-[#00897B] flex items-center justify-center">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-[#1A1A1A]">GroSupply</span>
            </Link>
          </div>

          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">Welcome Back</CardTitle>
              <CardDescription>Sign in to your supplier account</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="supplier@company.co.za"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="#" className="text-xs text-[#00897B] hover:underline">Forgot password?</Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-[#00897B] hover:bg-[#00695C]" disabled={isLoading}>
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Signing in...</>
                  ) : 'Sign In'}
                </Button>
              </form>

              <Separator className="my-6" />

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link href="/grosupply/supplier/onboarding" className="text-[#00897B] font-medium hover:underline">
                    Register as a Supplier
                  </Link>
                </p>
              </div>

              <div className="mt-6 p-3 bg-teal-50 rounded-lg border border-teal-200">
                <p className="text-xs text-teal-700 flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3" />
                  New here? Contact us to become a verified supplier
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <Link href="/grosupply" className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1">
              <ArrowLeft className="h-3 w-3" />
              Back to GroSupply Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
