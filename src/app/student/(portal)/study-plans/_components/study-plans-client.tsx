'use client'

// src/app/student/(portal)/study-plans/_components/study-plans-client.tsx

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen, CheckCircle2, Clock, ChevronRight, Sparkles,
  AlertCircle, ArrowLeft, Star, HelpCircle, ListChecks,
} from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge }   from '@/components/ui/badge'
import { Button }  from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

import { markStudyPlanComplete } from '@/lib/actions/study-plans'
import type { StudyPlan, StudyPlanContent } from '@/lib/actions/student-dashboard'
import { useCelebration } from '@/hooks/use-celebration'

// ── Config ──────────────────────────────────────────────────────────────────

const LESSON_TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  catch_up:     { label: 'Catch-Up',      color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',    icon: '📚' },
  gap_closure:  { label: 'Gap Closure',   color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300', icon: '🔍' },
  reteach:      { label: 'Reteach',       color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300', icon: '🔄' },
  pre_class:    { label: 'Pre-Class',     color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300',    icon: '⏰' },
  consolidation:{ label: 'Consolidation', color: 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300', icon: '✅' },
  exam_prep:    { label: 'Exam Prep',     color: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300',       icon: '🎯' },
}

// ── PlanCard ────────────────────────────────────────────────────────────────

function PlanCard({ plan, onClick }: { plan: StudyPlan; onClick: () => void }) {
  const cfg = LESSON_TYPE_CONFIG[plan.lesson_type] ?? { label: plan.lesson_type, color: 'bg-muted text-muted-foreground', icon: '📖' }
  const isCompleted = plan.status === 'completed'

  return (
    <button
      className="w-full text-left rounded-xl border border-border/60 bg-card hover:bg-surface-raised transition-colors p-4 space-y-2.5 group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold leading-tight ${isCompleted ? 'text-muted-foreground line-through' : ''}`}>
            {plan.topic}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{plan.subject}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0 group-hover:text-foreground transition-colors" />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge className={`text-xs px-1.5 py-0 ${cfg.color}`}>
          {cfg.icon} {cfg.label}
        </Badge>
        {isCompleted ? (
          <Badge className="text-xs px-1.5 py-0 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        ) : (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {plan.content?.estimated_minutes ?? 20} min
          </span>
        )}
        {plan.scheduled_for && (
          <span className="text-xs text-muted-foreground ml-auto">
            {format(parseISO(plan.scheduled_for), 'd MMM')}
          </span>
        )}
      </div>

      {plan.score_after !== null && plan.score_after !== undefined && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Self-reported score</span>
            <span className={`font-semibold tabular-nums ${
              plan.score_after >= 80 ? 'text-emerald-600' :
              plan.score_after >= 60 ? 'text-amber-600'   :
              'text-rose-600'
            }`}>{plan.score_after}%</span>
          </div>
          <Progress value={plan.score_after} className="h-1.5" />
        </div>
      )}
      {plan.completed_at && (
        <p className="text-[10px] text-muted-foreground">
          Completed {format(parseISO(plan.completed_at), 'd MMM yyyy · HH:mm')}
        </p>
      )}
    </button>
  )
}

// ── LessonViewer ─────────────────────────────────────────────────────────────

interface LessonViewerProps {
  plan: StudyPlan
  onClose: () => void
  onComplete: (plan: StudyPlan, score?: number) => Promise<void>
  completing: boolean
}

function LessonViewer({ plan, onClose, onComplete, completing }: LessonViewerProps) {
  const [step, setStep] = useState<'intro' | 'learn' | 'practice' | 'done'>('intro')
  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set())
  const [quizScore, setQuizScore] = useState<string>('')
  const content: StudyPlanContent = plan.content ?? {} as StudyPlanContent
  const cfg = LESSON_TYPE_CONFIG[plan.lesson_type] ?? { label: plan.lesson_type, color: '', icon: '📖' }

  const toggleAnswer = (i: number) =>
    setRevealedAnswers((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i); else next.add(i)
      return next
    })

  const handleMarkComplete = () => {
    const score = quizScore ? parseInt(quizScore, 10) : undefined
    onComplete(plan, score)
  }

  const bullets = (content.summary ?? '')
    .split(/[\n•\-]/)
    .map((s) => s.trim())
    .filter(Boolean)

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      {/* Sticky header */}
      <div className="flex items-center gap-3 pb-4 border-b shrink-0">
        <Button variant="ghost" size="sm" onClick={onClose} className="gap-1.5 -ml-1">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{plan.topic}</p>
          <p className="text-xs text-muted-foreground">{plan.subject}</p>
        </div>
        <Badge className={`text-xs shrink-0 ${cfg.color}`}>{cfg.icon} {cfg.label}</Badge>
      </div>

      {/* Step tabs */}
      <div className="flex gap-1 py-3 shrink-0">
        {(['intro', 'learn', 'practice', 'done'] as const).map((s, i) => (
          <button
            key={s}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              step === s
                ? 'bg-gold text-gold-foreground'
                : i <= ['intro', 'learn', 'practice', 'done'].indexOf(step)
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-muted text-muted-foreground'
            }`}
            onClick={() => setStep(s)}
          >
            {s === 'intro' ? 'Introduction' : s === 'learn' ? 'Learn' : s === 'practice' ? 'Practice' : 'Finish'}
          </button>
        ))}
      </div>

      {/* Step content — scrollable */}
      <div className="flex-1 overflow-y-auto space-y-4">

        {step === 'intro' && (
          <div className="space-y-4">
            {content.introduction && (
              <Card className="border-gold/20 bg-gold/5">
                <CardContent className="pt-4">
                  <div className="flex gap-3">
                    <Sparkles className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                    <p className="text-sm leading-relaxed">{content.introduction}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Estimated time</p>
                  <p className="text-lg font-bold mt-1">{content.estimated_minutes ?? 20} min</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Practice questions</p>
                  <p className="text-lg font-bold mt-1">{content.practice_questions?.length ?? 0}</p>
                </CardContent>
              </Card>
            </div>
            <Button className="w-full gap-2" onClick={() => setStep('learn')}>
              Start Learning
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 'learn' && (
          <div className="space-y-4">
            {content.explanation && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    Explanation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                    {content.explanation}
                  </p>
                </CardContent>
              </Card>
            )}
            {content.worked_example && (
              <Card className="border-gold/20 bg-gold/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Star className="h-4 w-4 text-gold" />
                    Worked Example
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap font-mono text-xs bg-background/60 rounded-lg p-3 border">
                    {content.worked_example}
                  </p>
                </CardContent>
              </Card>
            )}
            <Button className="w-full gap-2" onClick={() => setStep('practice')}>
              Try Practice Questions
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 'practice' && (
          <div className="space-y-4">
            {(content.practice_questions ?? []).length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">No practice questions for this lesson.</div>
            ) : (
              (content.practice_questions ?? []).map((q, i) => (
                <Card key={i}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold">
                        {i + 1}
                      </span>
                      <p className="text-sm font-medium">{q.question}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => toggleAnswer(i)}
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                      {revealedAnswers.has(i) ? 'Hide answer' : 'Show answer'}
                    </Button>
                    {revealedAnswers.has(i) && (
                      <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/60 p-3">
                        <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-1">Answer</p>
                        <p className="text-sm text-emerald-900 dark:text-emerald-200 whitespace-pre-wrap">{q.answer}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
            <Button className="w-full gap-2" onClick={() => setStep('done')}>
              Review Summary
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-4">
            {bullets.length > 0 && (
              <Card className="border-emerald-200/60 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Key Takeaways
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {bullets.map((b, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {plan.status !== 'completed' && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Record your score (optional)</CardTitle>
                  <CardDescription className="text-xs">How do you think you did on the practice questions?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    {[20, 40, 60, 80, 100].map((v) => (
                      <button
                        key={v}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                          quizScore === String(v)
                            ? 'bg-gold text-gold-foreground border-gold'
                            : 'border-border hover:bg-muted'
                        }`}
                        onClick={() => setQuizScore(String(v))}
                      >
                        {v}%
                      </button>
                    ))}
                  </div>
                  <Button
                    className="w-full gap-2"
                    onClick={handleMarkComplete}
                    disabled={completing}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {completing ? 'Saving...' : 'Mark as Complete'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {plan.status === 'completed' && (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/40">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <p className="text-sm font-semibold">You&apos;ve completed this lesson!</p>

                {/* M6: Outcome precision */}
                <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                  <Card className="border-emerald-200/60 bg-emerald-50/40">
                    <CardContent className="pt-3 pb-3">
                      <p className="text-xs text-muted-foreground">Practice questions</p>
                      <p className="text-lg font-bold mt-0.5">{content.practice_questions?.length ?? 0}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-emerald-200/60 bg-emerald-50/40">
                    <CardContent className="pt-3 pb-3">
                      <p className="text-xs text-muted-foreground">Self-reported score</p>
                      <p className={`text-lg font-bold mt-0.5 tabular-nums ${
                        plan.score_after !== null
                          ? plan.score_after >= 80 ? 'text-emerald-600'
                            : plan.score_after >= 60 ? 'text-amber-600'
                            : 'text-rose-600'
                          : ''
                      }`}>
                        {plan.score_after !== null ? `${plan.score_after}%` : '—'}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {plan.completed_at && (
                  <p className="text-xs text-muted-foreground">
                    Completed {format(parseISO(plan.completed_at), 'd MMM yyyy · HH:mm')}
                  </p>
                )}
                <Button variant="outline" onClick={onClose}>Back to study plans</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main client ───────────────────────────────────────────────────────────────

interface Props {
  user: any
  initialPlans: StudyPlan[]
  error: string | null
  activeFilter?: string
}

export function StudyPlansClient({ user, initialPlans, error, activeFilter }: Props) {
  const router = useRouter()
  const [plans, setPlans] = useState<StudyPlan[]>(initialPlans)
  const [selectedPlan, setSelectedPlan] = useState<StudyPlan | null>(null)
  const [completing, startTransition] = useTransition()
  const { celebrate } = useCelebration()

  const firstName = user?.name?.split(' ')[0] ?? user?.first_name ?? 'Student'

  const pending   = plans.filter((p) => p.status === 'pending' || p.status === 'sent')
  const completed = plans.filter((p) => p.status === 'completed')

  const filtered =
    !activeFilter || activeFilter === 'all'
      ? plans
      : plans.filter((p) =>
          activeFilter === 'pending'
            ? p.status === 'pending' || p.status === 'sent'
            : p.status === activeFilter,
        )

  function applyFilter(f: string) {
    const params = new URLSearchParams()
    if (f !== 'all') params.set('status', f)
    router.push(`/student/study-plans${params.toString() ? `?${params}` : ''}`)
  }

  async function handleComplete(plan: StudyPlan, score?: number) {
    startTransition(async () => {
      const res = await markStudyPlanComplete(plan.id, score)
      if (res.error) {
        toast.error(res.error.message)
        return
      }
      setPlans((prev) => prev.map((p) => p.id === plan.id ? { ...p, status: 'completed', score_after: score ?? null, completed_at: new Date().toISOString() } : p))
      toast.success('Study plan marked as complete!')
      celebrate('plan')
    })
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center animate-fade-up">
        <AlertCircle className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">Failed to load study plans</p>
        <p className="text-xs text-muted-foreground/70">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-up">

      {/* Header */}
      <div className="space-y-0.5">
        <h1 className="text-xl font-semibold tracking-tight">My Study Plans</h1>
        <p className="text-sm text-muted-foreground">
          Personalised lessons created just for you, {firstName}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending',   value: pending.length,   color: 'text-amber-600' },
          { label: 'Completed', value: completed.length, color: 'text-emerald-600' },
          { label: 'Total',     value: plans.length,     color: 'text-foreground' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5">
        {(['all', 'pending', 'completed'] as const).map((f) => (
          <button
            key={f}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              (activeFilter ?? 'all') === f
                ? 'bg-gold text-gold-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
            onClick={() => applyFilter(f)}
          >
            {f === 'all' ? 'All' : f === 'pending' ? 'Pending' : 'Completed'}
          </button>
        ))}
      </div>

      {/* Plan list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10">
            <BookOpen className="h-8 w-8 text-gold/60" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {activeFilter === 'pending' ? 'All caught up!' : activeFilter === 'completed' ? 'No completed plans yet' : 'No study plans yet'}
            </p>
            <p className="text-xs text-muted-foreground max-w-xs">
              {activeFilter === 'pending'
                ? 'You have no pending study plans. Great work!'
                : activeFilter === 'completed'
                ? 'Complete a study plan to see it here.'
                : 'Your teacher will send personalised study plans based on your assessments.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onClick={() => setSelectedPlan(plan)}
            />
          ))}
        </div>
      )}

      {/* Lesson viewer dialog */}
      <Dialog open={!!selectedPlan} onOpenChange={(o) => !o && setSelectedPlan(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-6">
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedPlan?.topic}</DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <LessonViewer
              plan={plans.find((p) => p.id === selectedPlan.id) ?? selectedPlan}
              onClose={() => setSelectedPlan(null)}
              onComplete={handleComplete}
              completing={completing}
            />
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}
