import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center gap-4 animate-fade-up', className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/8">
        <Icon className="h-8 w-8 text-gold/60" />
      </div>
      <div className="space-y-1.5 max-w-xs">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>
      {action && (
        <Button size="sm" variant="outline" onClick={action.onClick} className="rounded-lg">
          {action.label}
        </Button>
      )}
    </div>
  )
}
