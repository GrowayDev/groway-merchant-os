'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface User {
  id: string
  email: string
  name: string | null
  avatar: string | null
  phone: string | null
}

export interface Merchant {
  id: string
  code: string
  name: string
  tradingName: string | null
  vertical: string
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

export interface Branch {
  id: string
  code: string
  name: string
  type: string
}

export interface AuthState {
  user: User | null
  merchant: Merchant | null
  branch: Branch | null
  role: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  loginWithPin: (pin: string, merchantCode: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    merchant: null,
    branch: null,
    role: null,
    isAuthenticated: false,
    isLoading: true,
  })

  // Check for existing session on mount
  useEffect(() => {
    refreshSession()
  }, [])

  const refreshSession = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setState({
          user: data.user,
          merchant: data.merchant,
          branch: data.branch,
          role: data.role,
          isAuthenticated: true,
          isLoading: false,
        })
      } else {
        setState({
          user: null,
          merchant: null,
          branch: null,
          role: null,
          isAuthenticated: false,
          isLoading: false,
        })
      }
    } catch {
      setState({
        user: null,
        merchant: null,
        branch: null,
        role: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        await refreshSession()
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Login failed' }
      }
    } catch {
      return { success: false, error: 'An error occurred. Please try again.' }
    }
  }

  const loginWithPin = async (pin: string, merchantCode: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ pin, merchantCode }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        await refreshSession()
        return { success: true }
      } else {
        return { success: false, error: data.error || 'PIN login failed' }
      }
    } catch {
      return { success: false, error: 'An error occurred. Please try again.' }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } finally {
      setState({
        user: null,
        merchant: null,
        branch: null,
        role: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        loginWithPin,
        logout,
        refreshSession,
      }}
    >
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
