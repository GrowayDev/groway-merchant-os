'use client'

import { useState, useEffect } from 'react'

// ViewLoader component for loading states
export const ViewLoader = () => (
  <div className="flex items-center justify-center h-full min-h-[400px]">
    <div className="text-center">
      <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
  </div>
)

interface DynamicViewLoaderProps {
  viewId: string
  props?: Record<string, unknown>
}

// This component lazily loads the ViewRegistry on the client side only.
// By using dynamic import(), Turbopack does NOT analyze ViewRegistry.tsx
// at compile time, saving significant memory during dev startup.
export function DynamicViewLoader({ viewId, props = {} }: DynamicViewLoaderProps) {
  const [ViewComponent, setViewComponent] = useState<React.ComponentType<Record<string, unknown>> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    
    // Dynamic import - only resolved at runtime, NOT analyzed at compile time
    import('./ViewRegistry').then(mod => {
      if (cancelled) return
      const registry = mod.getViewRegistry()
      const Comp = registry[viewId]
      setViewComponent(() => Comp || null)
      setLoading(false)
    }).catch(() => {
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  }, [viewId])

  if (loading || !ViewComponent) {
    return <ViewLoader />
  }

  return <ViewComponent {...props} />
}
