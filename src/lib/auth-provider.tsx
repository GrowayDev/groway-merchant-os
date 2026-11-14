'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

export interface User {
  id: string
  email: string
  name: string | null
  phone: string | null
  role: string
}

export interface Merchant {
  id: string
  code: string
  name: string
  tradingName: string | null
  vertical: string
  subVertical: string | null
  status: string
  onboardingComplete: boolean
}

export interface Session {
  user: User
  merchant: Merchant | null
  branchId: string | null
  token: string
}

interface AuthContextType {
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  loginWithPin: (email: string, pin: string) => Promise<{ success: boolean; error?: string }>
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string; merchantId?: string }>
  logout: () => Promise<void>
  selectBranch: (branchId: string) => void
}

export interface SignupData {
  name: string
  email: string
  phone: string
  password: string
  businessName: string
  vertical: string
  subVertical: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check for existing session on mount
  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const storedSession = localStorage.getItem('groway_session')
      if (storedSession) {
        const parsed = JSON.parse(storedSession)
        // Verify session with backend
        const response = await fetch('/merchant-os/api/auth/session', {
          headers: {
            'Authorization': `Bearer ${parsed.token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.valid) {
            setSession(parsed)
          } else {
            localStorage.removeItem('groway_session')
          }
        } else {
          localStorage.removeItem('groway_session')
        }
      }
    } catch (error) {
      console.error('Session check error:', error)
      localStorage.removeItem('groway_session')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/merchant-os/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const newSession: Session = {
          user: data.user,
          merchant: data.merchant,
          branchId: data.branchId,
          token: data.token
        }
        
        setSession(newSession)
        localStorage.setItem('groway_session', JSON.stringify(newSession))
        
        return { success: true }
      }

      return { success: false, error: data.error || 'Login failed' }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  const loginWithPin = async (email: string, pin: string) => {
    try {
      const response = await fetch('/merchant-os/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const newSession: Session = {
          user: data.user,
          merchant: data.merchant,
          branchId: data.branchId,
          token: data.token
        }
        
        setSession(newSession)
        localStorage.setItem('groway_session', JSON.stringify(newSession))
        
        return { success: true }
      }

      return { success: false, error: data.error || 'Login failed' }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  const signup = async (data: SignupData) => {
    try {
      const response = await fetch('/merchant-os/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        const newSession: Session = {
          user: result.user,
          merchant: result.merchant,
          branchId: result.branchId,
          token: result.token
        }
        
        setSession(newSession)
        localStorage.setItem('groway_session', JSON.stringify(newSession))
        
        return { success: true, merchantId: result.merchant?.id }
      }

      return { success: false, error: result.error || 'Registration failed' }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  const logout = async () => {
    try {
      if (session?.token) {
        await fetch('/merchant-os/api/auth/session', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.token}`
          }
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setSession(null)
      localStorage.removeItem('groway_session')
      router.push('/merchant-os')
    }
  }

  const selectBranch = (branchId: string) => {
    if (session) {
      const updatedSession = { ...session, branchId }
      setSession(updatedSession)
      localStorage.setItem('groway_session', JSON.stringify(updatedSession))
    }
  }

  return (
    <AuthContext.Provider value={{
      session,
      isLoading,
      isAuthenticated: !!session,
      login,
      loginWithPin,
      signup,
      logout,
      selectBranch
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
