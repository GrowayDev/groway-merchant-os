'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LucideIcon, Plus, FileText, Database, Inbox, FolderOpen } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

/**
 * EmptyState component for displaying when there's no data
 * Used for new tenants or when lists are empty
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  className = '',
}: EmptyStateProps) {
  return (
    <Card className={`border-dashed ${className}`}>
      <CardContent className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-[#F5F5F5] flex items-center justify-center">
            <Icon className="h-8 w-8 text-[#757575]" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-[#1A1A1A]">{title}</h3>
            {description && (
              <p className="text-sm text-[#757575] max-w-md">{description}</p>
            )}
          </div>
          
          {(action || secondaryAction) && (
            <div className="flex items-center gap-3 mt-2">
              {action && (
                <Button
                  className="bg-[#00897B] hover:bg-[#00695C]"
                  onClick={action.onClick}
                >
                  <Plus className="h-4 w-4 mr-2" />
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
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Pre-configured empty states for common scenarios
export function NoDataEmptyState({ 
  entityName = 'records',
  onAdd,
  addLabel = 'Add New'
}: { 
  entityName?: string
  onAdd?: () => void
  addLabel?: string
}) {
  return (
    <EmptyState
      icon={Database}
      title={`No ${entityName} yet`}
      description={`Get started by adding your first ${entityName.toLowerCase()}.`}
      action={onAdd ? { label: addLabel, onClick: onAdd } : undefined}
    />
  )
}

export function NoResultsEmptyState({ 
  searchTerm,
  onClear
}: { 
  searchTerm?: string
  onClear?: () => void
}) {
  return (
    <EmptyState
      icon={FileText}
      title="No results found"
      description={searchTerm 
        ? `No items match "${searchTerm}". Try a different search term.`
        : 'No items match your current filters.'
      }
      action={onClear ? { label: 'Clear Filters', onClick: onClear } : undefined}
    />
  )
}

export function NoFilesEmptyState({ 
  onUpload,
  onImport
}: { 
  onUpload?: () => void
  onImport?: () => void
}) {
  return (
    <EmptyState
      icon={FolderOpen}
      title="No files"
      description="Upload files or import from another source to get started."
      action={onUpload ? { label: 'Upload Files', onClick: onUpload } : undefined}
      secondaryAction={onImport ? { label: 'Import Data', onClick: onImport } : undefined}
    />
  )
}

export default EmptyState
