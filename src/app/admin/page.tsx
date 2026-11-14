'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

/**
 * /admin — convenience alias that forwards to the Admin Console.
 * Unauthenticated visits are bounced by the proxy to /admin-console/login
 * with ?redirect=/admin, then land back here after signing in.
 */
export default function AdminAliasPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin-console')
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#1A1A1A]">
      <Loader2 className="h-6 w-6 animate-spin text-[#00897B]" aria-hidden="true" />
      <p className="text-sm text-white/70">Redirecting to Admin Console…</p>
      <span className="sr-only">Taking you to the Groway Admin Console</span>
    </div>
  )
}
