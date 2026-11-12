'use client'

import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon, Plus, FileX, Inbox, FolderOpen } from 'lucide-react'

interface EmptyStateProps {
  /** Title displayed to user */
  title: string
  /** Description explaining what they can do */
  description: string
  /** Icon to display (defaults to Inbox) */
  icon?: LucideIcon
  /** Primary action button */
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  /** Secondary action button */
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  /** Show as a card or inline */
  variant?: 'card' | 'inline'
  /** Size of the empty state */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * EmptyState Component
 * 
 * Used to display a helpful message when there's no data for a new tenant.
 * This replaces mock/hardcoded data that was previously shown.
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   title="No children enrolled yet"
 *   description="Start by enrolling your first child to manage their attendance, daily reports, and billing."
 *   icon={Users}
 *   action={{ label: "Enroll Child", onClick: handleEnroll }}
 * />
 * ```
 */
export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  secondaryAction,
  variant = 'inline',
  size = 'md'
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: 'py-6',
      icon: 'w-12 h-12',
      iconContainer: 'w-12 h-12',
      title: 'text-base',
      description: 'text-xs max-w-xs'
    },
    md: {
      container: 'py-12',
      icon: 'w-6 h-6',
      iconContainer: 'w-16 h-16',
      title: 'text-lg',
      description: 'text-sm max-w-sm'
    },
    lg: {
      container: 'py-20',
      icon: 'w-8 h-8',
      iconContainer: 'w-20 h-20',
      title: 'text-xl',
      description: 'text-base max-w-md'
    }
  }

  const sizes = sizeClasses[size]

  const content = (
    <div className={`flex flex-col items-center justify-center text-center ${sizes.container} px-4`}>
      {/* Icon */}
      <div className={`${sizes.iconContainer} rounded-full bg-gray-100 flex items-center justify-center mb-4`}>
        <Icon className={`${sizes.icon} text-gray-400`} />
      </div>

      {/* Title */}
      <h3 className={`${sizes.title} font-medium text-gray-900 mb-2`}>
        {title}
      </h3>

      {/* Description */}
      <p className={`${sizes.description} text-gray-500 mb-6`}>
        {description}
      </p>

      {/* Actions */}
      <div className="flex gap-3">
        {action && (
          <Button
            onClick={action.onClick}
            className="bg-[#00897B] hover:bg-[#00695C]"
          >
            {action.icon && <action.icon className="h-4 w-4 mr-2" />}
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button
            variant="outline"
            onClick={secondaryAction.onClick}
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  )

  if (variant === 'card') {
    return (
      <Card>
        <CardContent className="p-0">
          {content}
        </CardContent>
      </Card>
    )
  }

  return content
}

/**
 * EmptyStateTable - Empty state specifically for tables
 */
export function EmptyStateTable({
  title = 'No records found',
  description = 'There are no records to display yet. Start by adding your first record.',
  actionLabel = 'Add New',
  onAction,
  icon = FileX
}: {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: LucideIcon
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
        <icon className="h-6 w-6 text-gray-400" />
      </div>
      <h3 className="text-base font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4 text-center max-w-sm">{description}</p>
      {onAction && (
        <Button
          size="sm"
          onClick={onAction}
          className="bg-[#00897B] hover:bg-[#00695C]"
        >
          <Plus className="h-4 w-4 mr-2" />
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

/**
 * EmptyStateDashboard - Empty state for dashboard cards
 */
export function EmptyStateDashboard({
  title,
  description,
  actionLabel,
  onAction
}: {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <FolderOpen className="h-10 w-10 text-gray-300 mb-3" />
      <h4 className="text-sm font-medium text-gray-700 mb-1">{title}</h4>
      <p className="text-xs text-gray-500 mb-3 max-w-[200px]">{description}</p>
      {onAction && actionLabel && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onAction}
          className="text-[#00897B] hover:text-[#00695C] hover:bg-[#00897B]/10"
        >
          <Plus className="h-3 w-3 mr-1" />
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

export default EmptyState
