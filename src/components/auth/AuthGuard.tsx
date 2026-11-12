'use client'

import { useEffect, useState, createContext, useContext } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface AuthUser {
  id: string
  email: string
  name: string | null
  avatar: string | null
  phone: string | null
}

interface AuthMerchant {
  id: string
  code: string
  name: string
  tradingName: string | null
  vertical: string | null
  subVertical: string | null
  logo: string | null
  currency: string
  vatRate: number
  vatRegistered: boolean
  plan: string
  planStatus: string
  status: string
  onboardingComplete: boolean
  onboardingStep: string | null
}

interface AuthContextType {
  user: AuthUser | null
  merchant: AuthMerchant | null
  branchId: string | null
  role: string
  isLoading: boolean
  isAuthenticated: boolean
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

// Auth context for sharing auth state
const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthGuard')
  }
  return context
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [merchant, setMerchant] = useState<AuthMerchant | null>(null)
  const [branchId, setBranchId] = useState<string | null>(null)
  const [role, setRole] = useState<string>('staff')

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUser(data.user)
          setMerchant(data.merchant)
          setBranchId(data.branchId)
          setRole(data.role)
          return { authenticated: true, onboardingComplete: data.merchant.onboardingComplete }
        }
      }
      return { authenticated: false, onboardingComplete: false }
    } catch (error) {
      console.error('Auth check error:', error)
      return { authenticated: false, onboardingComplete: false }
    }
  }

  const refresh = async () => {
    await checkAuth()
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
    setUser(null)
    setMerchant(null)
    router.push('/merchant-os/login')
  }

  useEffect(() => {
    const init = async () => {
      const result = await checkAuth()
      
      if (!result.authenticated) {
        // Redirect to login page
        router.push('/merchant-os/login')
      } else if (!result.onboardingComplete && pathname !== '/merchant-os/onboarding') {
        // Redirect to onboarding if not complete
        router.push('/merchant-os/onboarding')
      }
      
      setIsLoading(false)
    }
    init()
  }, [router, pathname])

  if (isLoading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#00897B] mx-auto" />
          <p className="text-sm text-[#757575]">Verifying session...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      merchant, 
      branchId, 
      role, 
      isLoading: false, 
      isAuthenticated: true,
      refresh,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}
