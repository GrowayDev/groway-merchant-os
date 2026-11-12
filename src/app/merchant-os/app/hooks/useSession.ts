'use client'

import { useState, useEffect, useCallback } from 'react'

export interface MerchantSession {
  userId: string
  merchantId: string
  branchId?: string
  role: string
  email: string
  name: string
  merchant?: {
    id: string
    code: string
    name: string
    tradingName?: string
    vertical: string
    subVertical?: string
    plan: string
    planStatus: string
  }
  branch?: {
    id: string
    code: string
    name: string
  }
}

interface UseSessionResult {
  session: MerchantSession | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

/**
 * Hook for accessing the current merchant session
 * 
 * This hook retrieves the session from:
 * 1. localStorage (client-side session)
 * 2. Falls back to /api/auth/me for session validation
 * 
 * @example
 * ```tsx
 * const { session, loading, isAuthenticated } = useSession()
 * 
 * if (loading) return <Loading />
 * if (!isAuthenticated) return <LoginRedirect />
 * 
 * return <div>Welcome, {session.name}</div>
 * ```
 */
export function useSession(): UseSessionResult {
  const [session, setSession] = useState<MerchantSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSession = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // First try localStorage (fastest)
      const localSession = localStorage.getItem('groway_session')
      if (localSession) {
        try {
          const parsed = JSON.parse(localSession)
          if (parsed && parsed.merchantId) {
            setSession(parsed)
            setLoading(false)
            return
          }
        } catch {
          // Invalid JSON, continue to API
        }
      }

      // Fall back to API
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.user && data.merchant) {
          const sessionData: MerchantSession = {
            userId: data.user.id,
            merchantId: data.merchant.id,
            branchId: data.branch?.id,
            role: data.role || 'staff',
            email: data.user.email,
            name: data.user.name || '',
            merchant: {
              id: data.merchant.id,
              code: data.merchant.code,
              name: data.merchant.name,
              tradingName: data.merchant.tradingName,
              vertical: data.merchant.vertical,
              subVertical: data.merchant.subVertical,
              plan: data.merchant.plan,
              planStatus: data.merchant.planStatus
            },
            branch: data.branch ? {
              id: data.branch.id,
              code: data.branch.code,
              name: data.branch.name
            } : undefined
          }
          
          // Store in localStorage for faster access
          localStorage.setItem('groway_session', JSON.stringify(sessionData))
          setSession(sessionData)
        } else {
          setSession(null)
        }
      } else if (response.status === 401) {
        setSession(null)
        localStorage.removeItem('groway_session')
      } else {
        setError('Failed to fetch session')
      }
    } catch (err) {
      console.error('Session fetch error:', err)
      setError(err instanceof Error ? err.message : 'Session error')
      setSession(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('groway_session')
      setSession(null)
      window.location.href = '/merchant-os/login'
    }
  }, [])

  // Fetch session on mount
  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  return {
    session,
    loading,
    error,
    refresh: fetchSession,
    logout,
    isAuthenticated: !!session?.merchantId
  }
}

/**
 * Hook that requires authentication - redirects if not logged in
 */
export function useRequiredSession(): MerchantSession {
  const { session, loading, isAuthenticated } = useSession()
  
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = '/merchant-os/login'
    }
  }, [loading, isAuthenticated])

  // Return a default session object while loading/redirecting
  if (!session) {
    return {
      userId: '',
      merchantId: '',
      role: '',
      email: '',
      name: ''
    }
  }

  return session
}

export default useSession
