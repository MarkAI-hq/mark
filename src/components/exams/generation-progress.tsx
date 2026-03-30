// src/components/exam-builder/generation-progress.tsx
'use client'

import { GenerationState } from '@/hooks/use-exam-generation'
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GenerationProgressProps {
  state:    GenerationState
  progress: number
  error:    string | null
  onRetry?: () => void
}

const STAGE_LABELS: Record<GenerationState, string> = {
  idle:       '',
  queued:     'Waiting in queue...',
  processing: 'Generating your exam with AI...',
  completed:  'Exam ready! Redirecting...',
  failed:     'Generation failed',
}

// Map progress value to a human-readable milestone label
function getMilestoneLabel(progress: number): string {
  if (progress < 20)  return 'Starting up...'
  if (progress < 50)  return 'Reading your notes and mapping topics...'
  if (progress < 80)  return 'Writing questions and applying Bloom\'s taxonomy...'
  if (progress < 95)  return 'Saving your exam...'
  return 'Almost done...'
}

export function GenerationProgress({
  state,
  progress,
  error,
  onRetry,
}: GenerationProgressProps) {
  if (state === 'idle') return null

  const isActive    = state === 'queued' || state === 'processing'
  const isCompleted = state === 'completed'
  const isFailed    = state === 'failed'

  return (
    <div className="w-full rounded-xl border border-border bg-card p-6 space-y-4">

      {/* Header */}
      <div className="flex items-center gap-3">
        {isActive && (
          <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
        )}
        {isCompleted && (
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
        )}
        {isFailed && (
          <XCircle className="h-5 w-5 text-destructive shrink-0" />
        )}
        {state === 'queued' && !isCompleted && !isFailed && (
          <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
        )}

        <div>
          <p className="text-sm font-medium text-foreground">
            {STAGE_LABELS[state]}
          </p>
          {isActive && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {getMilestoneLabel(progress)}
            </p>
          )}
          {isFailed && error && (
            <p className="text-xs text-destructive mt-0.5">{error}</p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {(isActive || isCompleted) && (
        <div className="space-y-1.5">
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500 ease-out',
                isCompleted ? 'bg-green-500' : 'bg-primary',
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-right">
            {progress}%
          </p>
        </div>
      )}

      {/* Retry button on failure */}
      {isFailed && onRetry && (
        <button
          onClick={onRetry}
          className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Try Again
        </button>
      )}

      {/* Time estimate */}
      {isActive && (
        <p className="text-xs text-muted-foreground">
          This usually takes 20–45 seconds. You can leave this page — we'll send you a notification when it's ready.
        </p>
      )}
    </div>
  )
}