import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricEmptyStateProps {
  /** What the metric will show once there's enough data. */
  label:   string
  /** Concrete progress toward that, e.g. "12 of 30 mastered outcomes logged so far." */
  reason:  string
  className?: string
}

/**
 * For statistically-derived metrics (ratios, percentiles, medians) a bare
 * "—" or "0x" at low sample size reads as broken or as a real (bad) number.
 * Use this instead so early-stage data honestly reads as "in progress",
 * not "empty" or "failing".
 */
export function MetricEmptyState({ label, reason, className }: MetricEmptyStateProps) {
  return (
    <div className={cn(
      'flex items-start gap-3 rounded-lg border border-dashed bg-muted/30 p-5',
      className,
    )}>
      <Sparkles className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-1">{reason}</p>
      </div>
    </div>
  )
}
