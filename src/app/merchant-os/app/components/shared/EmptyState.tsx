'use client'

import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

/**
 * Reusable empty state component for new tenants
 * Used when there's no data to display
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="w-16 h-16 rounded-full bg-[#E0F2F1] flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-[#00897B]" />
      </div>
      <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">{title}</h3>
      <p className="text-sm text-[#757575] max-w-sm mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

/**
 * Loading skeleton for data tables
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg animate-pulse">
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
          <div className="w-20 h-8 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  )
}

/**
 * Loading skeleton for cards
 */
export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 bg-white rounded-lg border animate-pulse">
          <div className="w-8 h-8 bg-gray-200 rounded mb-3" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-6 bg-gray-200 rounded w-3/4" />
        </div>
      ))}
    </div>
  )
}

/**
 * Stats card with zero-state support
 */
interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  subValue?: string
  iconColor?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
}

export function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  iconColor = '#00897B',
  trend,
  trendValue,
}: StatCardProps) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-500',
  }

  return (
    <div className="p-4 bg-white rounded-lg border border-l-4 border-l-[#00897B]">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4" style={{ color: iconColor }} />
        <span className="text-xs text-[#757575]">{label}</span>
      </div>
      <p className="text-2xl font-bold text-[#1A1A1A]">{value}</p>
      {(subValue || trendValue) && (
        <p className={`text-xs ${trend ? trendColors[trend] : 'text-[#757575]'}`}>
          {subValue || trendValue}
        </p>
      )}
    </div>
  )
}
