'use client'

// src/components/reteach/reteach-generation-confirm-dialog.tsx
// M5: Pre-generation confirmation dialog — show data context before AI call

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge }  from '@/components/ui/badge'
import { Brain, Target, Zap, BookOpen } from 'lucide-react'

export interface ReteachGenerationContext {
  studentName?:       string
  assessmentTitle:    string
  score?:             number
  errorType:          string
  errorCount?:        { on: number; of: number }
  bloomGap?:          string    // e.g. "Required Analyse · Achieved Remember"
  loText?:            string    // learning outcome from curriculum
  strategy?:          string    // remediation_type
  scope:              'individual' | 'class' | 'longitudinal' | 'group'
}

interface Props {
  open:      boolean
  context:   ReteachGenerationContext
  onConfirm: () => void
  onCancel:  () => void
  isLoading?: boolean
}

const SCOPE_LABELS = {
  individual:   'Individual session',
  class:        'Whole-class session',
  longitudinal: 'Longitudinal coaching session',
  group:        'Small-group session',
}

const STRATEGY_LABELS: Record<string, string> = {
  worked_example_fading:             'Worked Example Fading',
  concrete_representational_abstract: 'Concrete → Representational → Abstract',
  inquiry_based:                     'Inquiry-Based Learning',
  problem_based:                     'Problem-Based Learning',
  visual_mapping:                    'Visual Mapping',
  structured_note_taking:            'Structured Note-Taking',
  structured_decision_making:        'Structured Decision-Making',
}

export function ReteachGenerationConfirmDialog({ open, context, onConfirm, onCancel, isLoading }: Props) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate {SCOPE_LABELS[context.scope]}</DialogTitle>
          {context.studentName && (
            <DialogDescription>
              For {context.studentName}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground text-xs">
            Review the context the AI will use before generating this session.
          </p>

          <div className="rounded-lg border bg-muted p-3 space-y-2.5">

            {context.score !== undefined && (
              <Row icon={<Target className="h-3.5 w-3.5 text-muted-foreground" />} label="Score">
                <span className="font-semibold">{context.score}%</span>
              </Row>
            )}

            <Row icon={<Zap className="h-3.5 w-3.5 text-rose-500" />} label="Error">
              <span className="font-medium">{context.errorType}</span>
              {context.errorCount && (
                <span className="text-muted-foreground ml-1.5 text-xs">
                  ({context.errorCount.on} of {context.errorCount.of} questions)
                </span>
              )}
            </Row>

            {context.bloomGap && (
              <Row icon={<Brain className="h-3.5 w-3.5 text-purple-500" />} label="Bloom gap">
                <span className="text-purple-700">{context.bloomGap}</span>
              </Row>
            )}

            {context.loText && (
              <Row icon={<BookOpen className="h-3.5 w-3.5 text-blue-500" />} label="LO target">
                <span className="text-blue-800 italic text-xs">&ldquo;{context.loText}&rdquo;</span>
              </Row>
            )}

            {context.strategy && (
              <Row icon={<BookOpen className="h-3.5 w-3.5 text-emerald-500" />} label="Strategy">
                <Badge variant="outline" className="text-xs text-emerald-700 dark:text-emerald-300 border-emerald-200 bg-emerald-50">
                  {STRATEGY_LABELS[context.strategy] ?? context.strategy}
                </Badge>
                <span className="text-xs text-muted-foreground ml-1">(mandated by curriculum)</span>
              </Row>
            )}

          </div>

          <p className="text-xs text-muted-foreground">
            This will use 1 AI session from your monthly quota.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Generating…' : 'Generate session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <span className="text-muted-foreground text-xs">{label}: </span>
        {children}
      </div>
    </div>
  )
}
