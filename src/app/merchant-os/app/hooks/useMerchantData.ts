'use client'

import { useState, useEffect, useCallback } from 'react'

interface MerchantData {
  id: string
  code: string
  name: string
  tradingName: string | null
  vertical: string | null
  subVertical: string | null
  logo: string | null
  coverImage: string | null
  onboardingComplete: boolean
  status: string
  plan: string | null
  planStatus: string
  trialEndsAt: string | null
  settings: {
    currency: string
    vatRate: number
    vatRegistered: boolean
    posEnabled: boolean
    onlineStoreEnabled: boolean
    bookingEnabled: boolean
    deliveryEnabled: boolean
    loyaltyEnabled: boolean
  }
}

interface BranchData {
  id: string
  name: string
  code: string
  status: string
}

interface UserData {
  id: string
  email: string
  name: string
  role: string
}

interface MerchantSession {
  user: UserData
  merchant: MerchantData
  branch: BranchData | null
  permissions: string[]
}

interface UseMerchantDataReturn {
  merchantId: string | null
  merchant: MerchantData | null
  branch: BranchData | null
  user: UserData | null
  permissions: string[]
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
  refetch: () => Promise<void>
}

/**
 * Hook to get merchant data from session
 * Returns merchant ID, merchant data, branch, user, and permissions
 */
export function useMerchantData(): UseMerchantDataReturn {
  const [session, setSession] = useState<MerchantSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSession = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/merchant-os/api/auth/session', {
        credentials: 'include',
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated - in dev mode, use default
          if (process.env.NODE_ENV === 'development') {
            setSession({
              user: {
                id: 'dev-user',
                email: 'dev@example.com',
                name: 'Developer',
                role: 'admin',
              },
              merchant: {
                id: 'merchant-001',
                code: 'DEV001',
                name: 'Development Merchant',
                tradingName: 'Dev Store',
                vertical: 'retail',
                subVertical: 'general',
                logo: null,
                coverImage: null,
                onboardingComplete: true,
                status: 'active',
                plan: 'pro',
                planStatus: 'active',
                trialEndsAt: null,
                settings: {
                  currency: 'ZAR',
                  vatRate: 15,
                  vatRegistered: true,
                  posEnabled: true,
                  onlineStoreEnabled: false,
                  bookingEnabled: false,
                  deliveryEnabled: false,
                  loyaltyEnabled: true,
                },
              },
              branch: {
                id: 'branch-001',
                name: 'Main Branch',
                code: 'MAIN',
                status: 'active',
              },
              permissions: ['*'],
            })
            setIsLoading(false)
            return
          }
          setError('Not authenticated')
          setSession(null)
        } else {
          setError('Failed to fetch session')
        }
        setIsLoading(false)
        return
      }
      
      const data = await response.json()
      
      if (data.success && data.data) {
        setSession({
          user: data.data.user,
          merchant: data.data.merchant,
          branch: data.data.branch,
          permissions: data.data.permissions || [],
        })
      } else {
        setError(data.error || 'Failed to get session')
        setSession(null)
      }
    } catch (err) {
      console.error('Error fetching merchant session:', err)
      
      // In development mode, provide a fallback
      if (process.env.NODE_ENV === 'development') {
        setSession({
          user: {
            id: 'dev-user',
            email: 'dev@example.com',
            name: 'Developer',
            role: 'admin',
          },
          merchant: {
            id: 'merchant-001',
            code: 'DEV001',
            name: 'Development Merchant',
            tradingName: 'Dev Store',
            vertical: 'retail',
            subVertical: 'general',
            logo: null,
            coverImage: null,
            onboardingComplete: true,
            status: 'active',
            plan: 'pro',
            planStatus: 'active',
            trialEndsAt: null,
            settings: {
              currency: 'ZAR',
              vatRate: 15,
              vatRegistered: true,
              posEnabled: true,
              onlineStoreEnabled: false,
              bookingEnabled: false,
              deliveryEnabled: false,
              loyaltyEnabled: true,
            },
          },
          branch: {
            id: 'branch-001',
            name: 'Main Branch',
            code: 'MAIN',
            status: 'active',
          },
          permissions: ['*'],
        })
      } else {
        setError('Failed to fetch session')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  return {
    merchantId: session?.merchant?.id || null,
    merchant: session?.merchant || null,
    branch: session?.branch || null,
    user: session?.user || null,
    permissions: session?.permissions || [],
    isLoading,
    error,
    isAuthenticated: !!session,
    refetch: fetchSession,
  }
}

/**
 * Simple hook to just get merchantId
 * Use this when you only need the merchant ID
 */
export function useMerchantId(): string | null {
  const { merchantId } = useMerchantData()
  return merchantId
}

export default useMerchantData
