'use client'

import { CheckCheck, SkipForward, ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { WalkthroughStep } from './review-walkthrough'

const DIMENSION_LABELS: Record<string, string> = {
  blooms:        "Bloom's Taxonomy",
  kusa:          'KUSA Distribution',
  topics:        'Syllabus Coverage',
  command_words: 'Command Words',
  marks:         'Mark Allocation',
}

interface ReviewSummaryProps {
  steps:            WalkthroughStep[]
  acceptedDims:     Set<string>
  currentScore:     number
  projectedScore:   number
  passThreshold?:   number
  isApplying:       boolean
  onApply:          () => void
  onGoBack:         () => void
}

export function ReviewSummary({
  steps,
  acceptedDims,
  currentScore,
  projectedScore,
  passThreshold = 85,
  isApplying,
  onApply,
  onGoBack,
}: ReviewSummaryProps) {
  const acceptedCount = acceptedDims.size
  const willPass      = projectedScore >= passThreshold
  const totalChanges  = steps
    .filter(s => acceptedDims.has(s.dimension))
    .reduce((sum, s) => sum + s.insertions.length, 0)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-4 pb-3 border-b shrink-0"
        style={{ background: 'linear-gradient(to bottom, #f5edda80, transparent)' }}>
        <h3 className="text-base font-black text-foreground mb-1">Review complete</h3>
        <p className="text-xs text-muted-foreground">
          {acceptedCount === 0
            ? 'No changes selected. You can go back to review.'
            : `${acceptedCount} dimension${acceptedCount !== 1 ? 's' : ''} accepted.`}
        </p>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Dimension list */}
        <div className="space-y-2">
          {steps.map(step => {
            const isAccepted = acceptedDims.has(step.dimension)
            const label      = DIMENSION_LABELS[step.dimension] ?? step.dimension.replace(/_/g, ' ')
            return (
              <div
                key={step.dimension}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg border',
                  isAccepted
                    ? 'border-[#e8d5a3] bg-[#f5edda]/40'
                    : 'border-muted bg-muted/10',
                )}
              >
                {isAccepted
                  ? <CheckCheck className="h-4 w-4 shrink-0 text-[#c9a84c]" />
                  : <SkipForward className="h-4 w-4 shrink-0 text-muted-foreground" />}
                <span className={cn(
                  'text-sm font-semibold flex-1',
                  isAccepted ? 'text-[#7a6230]' : 'text-muted-foreground',
                )}>
                  {label}
                </span>
                {isAccepted && (
                  <span className="text-[10px] text-muted-foreground">
                    {step.insertions.length} change{step.insertions.length !== 1 ? 's' : ''}
                  </span>
                )}
                {!isAccepted && (
                  <span className="text-[10px] text-muted-foreground/60">skipped</span>
                )}
              </div>
            )
          })}
        </div>

        {/* Score bar */}
        <div className="rounded-xl border border-[#e8d5a3] bg-[#f5edda]/30 p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Projected score</span>
            <span className="font-black" style={{ color: willPass ? '#7a6230' : '#a8893d' }}>
              {projectedScore}/100
            </span>
          </div>
          <div className="relative h-2 w-full rounded-full overflow-hidden" style={{ background: '#e8d5a3' }}>
            {/* Current score */}
            <div
              className="absolute h-full rounded-full bg-muted-foreground/30"
              style={{ width: `${currentScore}%` }}
            />
            {/* Projected score */}
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${projectedScore}%`,
                background: willPass
                  ? 'linear-gradient(to right, #c9a84c, #7a6230)'
                  : '#f59e0b',
              }}
            />
            {/* Pass threshold marker */}
            <div className="absolute top-0 bottom-0 w-0.5 bg-green-500/60" style={{ left: `${passThreshold}%` }} />
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground">
            <span>Was: {currentScore}</span>
            <span className={cn('font-bold', willPass ? 'text-emerald-600' : 'text-amber-600')}>
              {willPass ? '✓ Will pass after re-audit' : `Still below ${passThreshold} pass threshold`}
            </span>
          </div>
        </div>

        {/* Amber warning */}
        {!willPass && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              The accepted fixes may not be enough to pass the audit. Consider going back and accepting more dimensions.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t shrink-0 space-y-2" style={{ background: '#f5edda18' }}>
        <Button
          className="w-full gap-2 border-0 text-white"
          style={{ background: acceptedCount > 0 ? '#c9a84c' : '#a8893d' }}
          disabled={isApplying || acceptedCount === 0}
          onClick={onApply}
        >
          {isApplying
            ? <><Loader2 className="h-4 w-4 animate-spin" />Applying…</>
            : <><CheckCheck className="h-4 w-4" />Apply {totalChanges} change{totalChanges !== 1 ? 's' : ''} & Re-Audit →</>}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
          onClick={onGoBack}
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />Go back and review skipped
        </Button>
      </div>
    </div>
  )
}
