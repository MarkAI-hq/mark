'use client'

// src/app/student/(portal)/study-plans/_components/study-plans-client.tsx

import { useState, useTransition, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen, CheckCircle2, Clock, ChevronRight, Sparkles,
  AlertCircle, Clapperboard, Play, RotateCcw, Target,
  TrendingUp, TrendingDown, Minus,
} from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO, isToday, isPast } from 'date-fns'

import { Card, CardContent } from '@/components/ui/card'
import { Badge }  from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

import {
  checkInStudySession, selfInitiateFromEntry,
  type SuggestedTopicResponse, type GradebookResponse,
  type SubjectGradebook, type GradebookTopic, type NcdcLevel,
} from '@/lib/actions/study-plans'
import { initiateFreeStudyPlan, type StudyPlan } from '@/lib/actions/student-dashboard'

// ── Config ───────────────────────────────────────────────────────────────────

const LESSON_TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  catch_up:     { label: 'Catch-Up',      color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',       icon: '📚' },
  gap_closure:  { label: 'Gap Closure',   color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',   icon: '🔍' },
  reteach:      { label: 'Reteach',       color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300', icon: '🔄' },
  pre_class:    { label: 'Pre-Class',     color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300',       icon: '⏰' },
  pre_teach:    { label: 'Pre-Teach',     color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300', icon: '⚡' },
  consolidation:{ label: 'Consolidation', color: 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300',   icon: '✅' },
  exam_prep:    { label: 'Exam Prep',     color: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300',           icon: '🎯' },
}

function lessonCfg(type: string) {
  return LESSON_TYPE_CONFIG[type] ?? { label: type, color: 'bg-muted text-muted-foreground', icon: '📖' }
}

const ACHIEVEMENT_STYLE: Record<NcdcLevel, { dot: string; ring: string; label: string }> = {
  all:  { dot: 'bg-emerald-500', ring: 'border-emerald-300/60 bg-emerald-50/60 dark:bg-emerald-950/20', label: 'Mastered' },
  some: { dot: 'bg-amber-500',   ring: 'border-amber-300/60 bg-amber-50/60 dark:bg-amber-950/20',       label: 'In progress' },
  none: { dot: 'bg-muted-foreground/40', ring: 'border-border bg-muted/30', label: 'Not started' },
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function TrendArrow({ delta }: { delta: number | null }) {
  if (delta === null || delta === 0) return <Minus className="h-3.5 w-3.5 text-amber-500" />
  return delta > 0
    ? <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
    : <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
}

// ── TodayHero ─────────────────────────────────────────────────────────────────

function TodayHero({
  plan, suggestion, onStudio, onSelfInitiate, busy,
}: {
  plan: StudyPlan | null
  suggestion: SuggestedTopicResponse | null
  onStudio: (planId: string) => void
  onSelfInitiate: (sowEntryId: string) => void
  busy: boolean
}) {
  // Prefer a real assigned plan for today/overdue; else fall back to the SoW suggestion.
  if (plan) {
    const cfg = lessonCfg(plan.lesson_type)
    return (
      <div className="rounded-2xl border-2 border-gold/40 bg-gold/5 p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Badge className="text-[10px] bg-gold text-gold-foreground px-2 py-0.5">Up next today</Badge>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {plan.content?.estimated_minutes ?? 20} min
          </span>
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold leading-snug">{plan.topic}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{plan.subject}</span>
            <Badge className={`text-[10px] px-1.5 py-0 ${cfg.color}`}>{cfg.icon} {cfg.label}</Badge>
          </div>
        </div>
        <Button
          className="w-full gap-1.5 bg-gold hover:bg-gold/90 text-gold-foreground"
          onClick={() => onStudio(plan.id)}
        >
          <Clapperboard className="h-4 w-4" />
          Start Studio
        </Button>
      </div>
    )
  }

  if (suggestion) {
    return (
      <div className="rounded-2xl border-2 border-gold/40 bg-gold/5 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" />
          <Badge className="text-[10px] bg-gold text-gold-foreground px-2 py-0.5">Suggested for you</Badge>
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold leading-snug">{suggestion.entry.topic}</p>
          <span className="text-xs text-muted-foreground">{suggestion.entry.subject}</span>
          {suggestion.reason && (
            <p className="text-sm text-muted-foreground pt-1">{suggestion.reason}</p>
          )}
        </div>
        <Button
          className="w-full gap-1.5 bg-gold hover:bg-gold/90 text-gold-foreground"
          onClick={() => onSelfInitiate(suggestion.entry.id)}
          disabled={busy}
        >
          <Play className="h-4 w-4" />
          {busy ? 'Preparing…' : 'Start this lesson'}
        </Button>
      </div>
    )
  }

  return null
}

// ── ReviewStrip (FSRS) ────────────────────────────────────────────────────────

function ReviewStrip({ plans, onStudio }: { plans: StudyPlan[]; onStudio: (planId: string) => void }) {
  const due = plans
    .filter((p) => p.status === 'completed' && p.next_review_date)
    .filter((p) => {
      const d = parseISO(p.next_review_date as string)
      return isToday(d) || isPast(d)
    })
    .sort((a, b) => (a.next_review_date ?? '').localeCompare(b.next_review_date ?? ''))

  if (due.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <RotateCcw className="h-4 w-4 text-purple-500" />
        <h2 className="text-sm font-semibold">Due for review</h2>
        <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300">
          {due.length}
        </Badge>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {due.map((p) => (
          <button
            key={p.id}
            onClick={() => onStudio(p.id)}
            className="shrink-0 max-w-[200px] text-left rounded-xl border border-purple-200/60 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20 px-3 py-2 hover:bg-purple-100/60 dark:hover:bg-purple-950/40 transition-colors"
          >
            <p className="text-xs font-semibold leading-snug line-clamp-1">{p.topic}</p>
            <p className="text-[10px] text-muted-foreground">{p.subject}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── SoW ribbon ────────────────────────────────────────────────────────────────

function SowRibbon({
  topics, onStartTopic, pendingTopicId,
}: {
  topics: GradebookTopic[]
  onStartTopic: (topic: GradebookTopic) => void
  pendingTopicId: string | null
}) {
  if (topics.length === 0) return null
  const ordered = [...topics].sort((a, b) => a.week_number - b.week_number)

  return (
    <div className="flex flex-wrap gap-1.5">
      {ordered.map((t) => {
        const style = ACHIEVEMENT_STYLE[t.achievement] ?? ACHIEVEMENT_STYLE.none
        const busy = pendingTopicId === t.entry_id
        return (
          <button
            key={t.entry_id}
            onClick={() => onStartTopic(t)}
            disabled={busy}
            title={`Week ${t.week_number} · ${style.label}`}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all hover:scale-[1.02] disabled:opacity-60 ${style.ring}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
            <span className="font-medium line-clamp-1 max-w-[160px]">{t.topic}</span>
            {busy
              ? <Clock className="h-3 w-3 animate-pulse text-muted-foreground" />
              : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
          </button>
        )
      })}
    </div>
  )
}

// ── SubjectSection ────────────────────────────────────────────────────────────

function SubjectSection({
  subject, passMark, pendingPlans, onStudio, onStartTopic, pendingTopicId,
}: {
  subject: SubjectGradebook
  passMark: string
  pendingPlans: StudyPlan[]
  onStudio: (planId: string) => void
  onStartTopic: (topic: GradebookTopic) => void
  pendingTopicId: string | null
}) {
  const tri = subject.triangulation
  const weakMode =
    tri.observation === 'none' || tri.product === 'none' || tri.conversation === 'none' ||
    !tri.observation || !tri.product || !tri.conversation
  const belowPass = !subject.is_passing
  const showGap = belowPass || weakMode

  // Weakest not-yet-mastered topic to anchor the gap CTA.
  const weakestTopic = [...subject.topics]
    .filter((t) => t.achievement !== 'all')
    .sort((a, b) => a.week_number - b.week_number)[0] ?? null

  return (
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold truncate">{subject.subject}</h3>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {subject.grade_band && (
              <Badge className={`text-[10px] px-1.5 py-0 ${
                subject.is_passing
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
              }`}>
                {subject.grade_band.label}{subject.grade_points != null ? ` · ${subject.grade_points}pts` : ''}
              </Badge>
            )}
            {subject.mastery_pct != null && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                {subject.mastery_pct}% mastery
                <TrendArrow delta={subject.trend_delta} />
              </span>
            )}
            {subject.class_percentile != null && (
              <span className="text-[10px] text-muted-foreground">Top {100 - subject.class_percentile}% of class</span>
            )}
          </div>
        </div>
      </div>

      {/* Assigned pending plans for this subject */}
      {pendingPlans.length > 0 && (
        <div className="space-y-2">
          {pendingPlans.map((p) => {
            const cfg = lessonCfg(p.lesson_type)
            return (
              <button
                key={p.id}
                onClick={() => onStudio(p.id)}
                className="w-full text-left rounded-xl border border-border/60 bg-card hover:border-gold/40 hover:bg-gold/[0.03] transition-colors p-3 flex items-center gap-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-base">
                  {cfg.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug line-clamp-1">{p.topic}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge className={`text-[10px] px-1.5 py-0 ${cfg.color}`}>{cfg.label}</Badge>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />{p.content?.estimated_minutes ?? 20} min
                    </span>
                  </div>
                </div>
                <Clapperboard className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            )
          })}
        </div>
      )}

      {/* Scheme-of-work ribbon */}
      <SowRibbon topics={subject.topics} onStartTopic={onStartTopic} pendingTopicId={pendingTopicId} />

      {/* Gap callout */}
      {showGap && weakestTopic && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-300/50 bg-amber-50/50 dark:bg-amber-950/20 px-3 py-2.5">
          <div className="flex items-start gap-2 min-w-0">
            <Target className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 dark:text-amber-200">
              {belowPass
                ? `Below the ${passMark} pass mark — start with `
                : `Strengthen `}
              <span className="font-semibold">{weakestTopic.topic}</span> to close the gap.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs shrink-0 border-amber-400/60"
            onClick={() => onStartTopic(weakestTopic)}
            disabled={pendingTopicId === weakestTopic.entry_id}
          >
            {pendingTopicId === weakestTopic.entry_id ? '…' : 'Start'}
          </Button>
        </div>
      )}
    </section>
  )
}

// ── Main client ───────────────────────────────────────────────────────────────

interface Props {
  user: any
  initialPlans: StudyPlan[]
  gradebook: GradebookResponse | null
  suggestion: SuggestedTopicResponse | null
  error: string | null
}

export function StudyPlansClient({ user, initialPlans, gradebook, suggestion, error }: Props) {
  const router = useRouter()
  const plans = initialPlans

  const [checkedIn, setCheckedIn] = useState(false)
  const [checkingIn, startCheckIn] = useTransition()
  const [pendingTopicId, setPendingTopicId] = useState<string | null>(null)
  const [heroBusy, startHero] = useTransition()
  const [initiatingFree, startInitiateFree] = useTransition()
  const [freeSub, setFreeSub]     = useState(suggestion?.entry.subject ?? '')
  const [freeTopic, setFreeTopic] = useState(suggestion?.entry.topic ?? '')

  const isMarketplace = user?.enrollment_source === 'marketplace' || !user?.class_id
  const firstName = user?.name?.split(' ')[0] ?? user?.first_name ?? 'Student'
  const passMark = gradebook?.scale?.passMark ?? 'D'

  useEffect(() => {
    const todayKey = `checkin_${new Date().toISOString().slice(0, 10)}`
    if (typeof window !== 'undefined' && localStorage.getItem(todayKey)) setCheckedIn(true)
  }, [])

  // ── Derived data ──────────────────────────────────────────────────────────
  const pending   = plans.filter((p) => p.status === 'pending' || p.status === 'sent')
  const completed = plans.filter((p) => p.status === 'completed')

  const todayPlan = useMemo(() => {
    const overdue = pending.find((p) => {
      if (!p.scheduled_for) return false
      const d = parseISO(p.scheduled_for)
      return isToday(d) || isPast(d)
    })
    if (overdue) return overdue
    return [...pending].sort((a, b) => (a.scheduled_for ?? '').localeCompare(b.scheduled_for ?? ''))[0] ?? null
  }, [pending])

  // Map a SoW entry → its existing plan (prefer an active plan over a completed one).
  const planBySowEntry = useMemo(() => {
    const m = new Map<string, StudyPlan>()
    for (const p of plans) {
      if (!p.scheme_entry_id) continue
      const existing = m.get(p.scheme_entry_id)
      if (!existing || (existing.status === 'completed' && p.status !== 'completed')) {
        m.set(p.scheme_entry_id, p)
      }
    }
    return m
  }, [plans])

  const pendingBySubject = useMemo(() => {
    const m = new Map<string, StudyPlan[]>()
    for (const p of pending) {
      if (p.id === todayPlan?.id) continue // already surfaced in the hero
      const arr = m.get(p.subject) ?? []
      arr.push(p)
      m.set(p.subject, arr)
    }
    return m
  }, [pending, todayPlan])

  const subjects = useMemo(() => {
    return [...(gradebook?.subjects ?? [])].sort((a, b) => {
      if (a.is_passing !== b.is_passing) return a.is_passing ? 1 : -1
      return (a.mastery_pct ?? 0) - (b.mastery_pct ?? 0)
    })
  }, [gradebook])

  const subjectOptions = useMemo(
    () => Array.from(new Set((gradebook?.subjects ?? []).map((s) => s.subject))),
    [gradebook],
  )

  // ── Actions ─────────────────────────────────────────────────────────────────
  const goStudio = (planId: string) => router.push(`/student/study-plans/${planId}/studio`)

  function handleSelfInitiate(sowEntryId: string) {
    startHero(async () => {
      const { data, error: err } = await selfInitiateFromEntry(sowEntryId)
      if (err) { toast.error(err.message); return }
      if (data?.plan?.id) goStudio(data.plan.id)
    })
  }

  function handleStartTopic(topic: GradebookTopic) {
    const existing = planBySowEntry.get(topic.sow_entry_id)
    if (existing) { goStudio(existing.id); return }
    setPendingTopicId(topic.entry_id)
    startHero(async () => {
      const { data, error: err } = await selfInitiateFromEntry(topic.sow_entry_id)
      setPendingTopicId(null)
      if (err) { toast.error(err.message); return }
      if (data?.plan?.id) goStudio(data.plan.id)
    })
  }

  function handleCheckIn() {
    startCheckIn(async () => {
      const { data } = await checkInStudySession()
      setCheckedIn(true)
      localStorage.setItem(`checkin_${new Date().toISOString().slice(0, 10)}`, '1')
      if (data && !data.already_checked_in) toast.success(`Day ${data.streak_days} streak — keep it up!`)
    })
  }

  function handleInitiateFree() {
    if (!freeSub.trim() || !freeTopic.trim()) {
      toast.error('Enter a subject and topic to start studying.')
      return
    }
    startInitiateFree(async () => {
      const matchesSuggestion =
        suggestion?.action === 'self_initiate' &&
        freeSub.trim().toLowerCase() === suggestion.entry.subject.toLowerCase() &&
        freeTopic.trim().toLowerCase() === suggestion.entry.topic.toLowerCase()

      if (matchesSuggestion && suggestion) {
        const { data, error: err } = await selfInitiateFromEntry(suggestion.entry.id)
        if (err) { toast.error(err.message); return }
        if (data?.plan?.id) { toast.success('Study plan created!'); goStudio(data.plan.id) }
        return
      }

      const { data, error: err } = await initiateFreeStudyPlan(freeSub.trim(), freeTopic.trim())
      if (err) { toast.error(err.message); return }
      if (data?.plan_id) { toast.success('Study plan created!'); goStudio(data.plan_id) }
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center animate-fade-up">
        <AlertCircle className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">Failed to load study plans</p>
        <p className="text-xs text-muted-foreground/70">{error}</p>
      </div>
    )
  }

  const hasContent = subjects.length > 0 || plans.length > 0 || !!suggestion

  return (
    <div className="space-y-5 animate-fade-up">

      {/* Header */}
      <div className="space-y-0.5">
        <h1 className="text-xl font-semibold tracking-tight">My Learning</h1>
        <p className="text-sm text-muted-foreground">
          Your next lessons, grouped by subject, {firstName}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'To do',      value: pending.length,   color: 'text-amber-600' },
          { label: 'Completed',  value: completed.length, color: 'text-emerald-600' },
          { label: 'Subjects',   value: subjects.length,  color: 'text-foreground' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily check-in — marketplace / self-study students only */}
      {isMarketplace && !checkedIn && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-gold/30 bg-gold/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-gold shrink-0" />
            <span className="text-sm font-medium">Are you learning today?</span>
          </div>
          <Button
            size="sm"
            className="h-7 gap-1.5 bg-gold hover:bg-gold/90 text-gold-foreground shrink-0"
            onClick={handleCheckIn}
            disabled={checkingIn}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {checkingIn ? '…' : "Yes, I'm studying"}
          </Button>
        </div>
      )}

      {/* Today's most important action */}
      <TodayHero
        plan={todayPlan}
        suggestion={todayPlan ? null : suggestion}
        onStudio={goStudio}
        onSelfInitiate={handleSelfInitiate}
        busy={heroBusy}
      />

      {/* Spaced-repetition reviews due */}
      <ReviewStrip plans={plans} onStudio={goStudio} />

      {/* Subject-grouped learning queue */}
      {subjects.length > 0 && (
        <div className="space-y-6">
          {subjects.map((s) => (
            <SubjectSection
              key={s.scheme_id || s.subject}
              subject={s}
              passMark={passMark}
              pendingPlans={pendingBySubject.get(s.subject) ?? []}
              onStudio={goStudio}
              onStartTopic={handleStartTopic}
              pendingTopicId={pendingTopicId}
            />
          ))}
        </div>
      )}

      {/* Explore — start any topic */}
      <Card className="border-gold/20 bg-gold/[0.03]">
        <CardContent className="pt-4 pb-3">
          <p className="text-sm font-medium flex items-center gap-1.5 mb-2">
            <Play className="h-3.5 w-3.5 text-gold" />
            Study anything else
          </p>
          <div className="flex gap-2 flex-wrap">
            {subjectOptions.length > 0 ? (
              <Select value={freeSub} onValueChange={setFreeSub}>
                <SelectTrigger className="flex-1 min-w-[140px] h-8 text-sm">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjectOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="Subject (e.g. Mathematics)"
                value={freeSub}
                onChange={(e) => setFreeSub(e.target.value)}
                className="flex-1 min-w-[140px] h-8 text-sm"
              />
            )}
            <Input
              placeholder="Topic (e.g. Quadratic equations)"
              value={freeTopic}
              onChange={(e) => setFreeTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInitiateFree()}
              className="flex-1 min-w-[200px] h-8 text-sm"
            />
            <Button
              size="sm"
              className="h-8 gap-1.5 bg-gold hover:bg-gold/90 text-gold-foreground shrink-0"
              onClick={handleInitiateFree}
              disabled={initiatingFree}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {initiatingFree ? 'Creating…' : 'Start'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Completed history */}
      {completed.length > 0 && (
        <>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium">Completed</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="space-y-2.5">
            {completed.map((plan) => {
              const cfg = lessonCfg(plan.lesson_type)
              return (
                <div
                  key={plan.id}
                  className="rounded-xl border border-border/60 bg-card opacity-60 hover:opacity-80 transition-opacity p-4 space-y-1"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium line-through text-muted-foreground">{plan.topic}</p>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] px-1.5 py-0 ${cfg.color}`}>{cfg.icon} {cfg.label}</Badge>
                      {plan.score_after != null && (
                        <span className={`text-xs font-semibold tabular-nums ${
                          plan.score_after >= 80 ? 'text-emerald-600' : plan.score_after >= 60 ? 'text-amber-600' : 'text-rose-600'
                        }`}>{plan.score_after}%</span>
                      )}
                    </div>
                    <Link
                      href={`/student/study-plans/${plan.id}/studio`}
                      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-gold transition-colors"
                    >
                      <Clapperboard className="h-3 w-3" /> Review
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Empty state */}
      {!hasContent && (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <BookOpen className="h-8 w-8 text-muted-foreground/30 mb-1" />
          <p className="text-sm font-medium text-muted-foreground">Nothing assigned yet</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            {gradebook?.no_enrollment
              ? 'Enrol in a class or use the form above to start studying any topic.'
              : 'Use the form above to start studying any subject independently.'}
          </p>
        </div>
      )}

    </div>
  )
}
