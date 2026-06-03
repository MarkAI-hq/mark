import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type AccentColor = 'default' | 'gold' | 'blue' | 'green' | 'red'

const accentStyles: Record<AccentColor, string> = {
  default: 'bg-muted text-muted-foreground',
  gold:    'bg-gold/10 text-gold',
  blue:    'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400',
  green:   'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400',
  red:     'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400',
}

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title:        string
  value:        string | number
  description?: string
  icon?:        React.ReactNode
  loading?:     boolean
  accentColor?: AccentColor
  href?:        string
}

export function StatCard({
  title,
  value,
  description,
  icon,
  loading = false,
  accentColor = 'default',
  href,
  className,
  ...props
}: StatCardProps) {
  const Wrapper = href
    ? ({ children }: { children: React.ReactNode }) => (
        <Link href={href} className="block group">
          {children}
        </Link>
      )
    : ({ children }: { children: React.ReactNode }) => <>{children}</>

  return (
    <Wrapper>
    <Card className={cn('animate-fade-up p-5', href && 'cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all', className)} {...props}>
      {loading ? (
        <div className="space-y-3">
          <div className="h-9 w-9 animate-pulse rounded-xl bg-muted" />
          <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-28 animate-pulse rounded-md bg-muted" />
        </div>
      ) : (
        <div className="space-y-3">
          {icon && (
            <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', accentStyles[accentColor])}>
              {icon}
            </div>
          )}
          <div className="text-3xl font-bold tracking-tight">{value}</div>
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">{title}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      )}
    </Card>
    </Wrapper>
  )
}
