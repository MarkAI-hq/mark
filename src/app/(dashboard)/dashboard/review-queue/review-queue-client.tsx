'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, ChevronDown, Loader2, ShieldAlert, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { approveStudyPlan, type FlaggedStudyPlan } from '@/lib/actions/study-plans'

const LESSON_TYPE_LABEL: Record<string, string> = {
  catch_up:      'Catch Up',
  gap_closure:   'Gap Closure',
  reteach:       'Reteach',
  pre_class:     'Pre-Class',
  consolidation: 'Consolidation',
  exam_prep:     'Exam Prep',
}

// Mirrors the two paths that set flagged_for_review in study-plans.service.ts:
// zero RAG chunks retrieved (grounded: false, alignment_score: 0) vs chunks
// present but reviewAlignment() scored the content low. Anything flagged
// without either field set came from the simulation QA gate instead.
function flagReason(plan: FlaggedStudyPlan): string {
  const { grounded, alignment_score } = plan.content
  if (grounded === false) {
    return 'No curriculum grounding found — this lesson may not reflect the syllabus.'
  }
  if (typeof alignment_score === 'number') {
    return `Low curriculum alignment — scored ${Math.round(alignment_score * 100)}%.`
  }
  return 'A generated simulation failed its automated quality check.'
}

export function ReviewQueueClient({ initial }: { initial: FlaggedStudyPlan[] }) {
  const router = useRouter()
  const [rows, setRows] = useState<FlaggedStudyPlan[]>(initial)
  const [busy, setBusy] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  async function handleApprove(plan: FlaggedStudyPlan) {
    setBusy(plan.id)
    try {
      const { error } = await approveStudyPlan(plan.id)
      if (error) {
        toast.error(error.message ?? 'Could not approve')
        return
      }
      setRows((prev) => prev.filter((r) => r.id !== plan.id))
      toast.success('Marked reviewed')
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <ShieldCheck className="h-8 w-8 text-emerald-500" />
          <p className="font-medium">Nothing flagged right now</p>
          <p className="text-sm text-muted-foreground">
            Lessons that fail curriculum grounding or the simulation quality gate will show up here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-3">
      {rows.map((plan) => {
        const studentName =
          [plan.student_first_name, plan.student_last_name].filter(Boolean).join(' ') ||
          'Unnamed student'
        const isOpen = expanded === plan.id
        return (
          <Card key={plan.id}>
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
                  <span className="font-semibold">{studentName}</span>
                  <Badge variant="secondary">{plan.subject}</Badge>
                  <Badge variant="outline">
                    {LESSON_TYPE_LABEL[plan.lesson_type] ?? plan.lesson_type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{plan.topic}</p>
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  {flagReason(plan)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Generated {new Date(plan.createdAt).toLocaleString()}
                </p>

                <Collapsible open={isOpen} onOpenChange={(v) => setExpanded(v ? plan.id : null)}>
                  <CollapsibleTrigger className="flex items-center gap-1 pt-1 text-xs font-medium text-foreground/70 hover:text-foreground">
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    {isOpen ? 'Hide lesson content' : 'Preview lesson content'}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-2 rounded-lg border bg-muted/30 p-3 text-sm">
                    <p><span className="font-medium">Introduction: </span>{plan.content.introduction}</p>
                    <p><span className="font-medium">Explanation: </span>{plan.content.explanation}</p>
                    {plan.content.sources_consulted && plan.content.sources_consulted.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {plan.content.sources_consulted.length} curriculum source
                        {plan.content.sources_consulted.length === 1 ? '' : 's'} consulted.
                      </p>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </div>

              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  className="font-semibold"
                  disabled={busy === plan.id}
                  onClick={() => handleApprove(plan)}
                >
                  {busy === plan.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Mark reviewed
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
