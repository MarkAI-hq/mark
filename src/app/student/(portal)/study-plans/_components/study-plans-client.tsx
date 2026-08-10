'use client'

// src/app/student/(portal)/study-plans/_components/study-plans-client.tsx

import { useState, useTransition, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { ColumnDef } from '@tanstack/react-table'
import {
  BookOpen, CheckCircle2, Clock, ChevronRight, Sparkles,
  AlertCircle, Clapperboard, Play, RotateCcw, Target,
  TrendingUp, TrendingDown, Minus, BookOpenCheck, Upload, FileText, Check, Plus, Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { parseISO, isToday, isPast } from 'date-fns'

import { Card, CardContent } from '@/components/ui/card'
import { Badge }  from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/ui/data-table'
import { CompletedPlansTable } from '@/components/students/completed-plans-table'
import { PendingPlansTable } from '@/components/students/pending-plans-table'

import {
  checkInStudySession, selfInitiateFromEntry,
  type SuggestedTopicResponse, type GradebookResponse,
  type SubjectGradebook, type GradebookTopic, type NcdcLevel,
} from '@/lib/actions/study-plans'
import { initiateFreeStudyPlan, type StudyPlan } from '@/lib/actions/student-dashboard'
import { uploadStudentDocument } from '@/lib/actions/student-onboarding'
import { formatTopicTitle, formatEmbeddedCaps, splitTopicHeadline } from '@/lib/utils'

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
  if (plan) {
    const cfg = lessonCfg(plan.lesson_type)
    const { headline, extraCount } = splitTopicHeadline(plan.topic)
    return (
      <div className="rounded-2xl border-2 border-gold/40 bg-gold/5 p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-gold uppercase tracking-wide">Next Up</p>
            <h3 className="font-semibold text-base leading-snug">{headline}</h3>
            {extraCount > 0 && (
              <p className="text-[11px] text-muted-foreground">+{extraCount} more topic{extraCount === 1 ? '' : 's'} this week</p>
            )}
            <p className="text-xs text-muted-foreground">{plan.subject}</p>
          </div>
          <Badge className={`text-[10px] px-1.5 py-0 shrink-0 ${cfg.color}`}>{cfg.icon} {cfg.label}</Badge>
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
    const { headline, extraCount } = splitTopicHeadline(suggestion.entry.topic)
    return (
      <div className="rounded-2xl border-2 border-gold/40 bg-gold/5 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" />
          <Badge className="text-[10px] bg-gold text-gold-foreground px-2 py-0.5">Suggested for you</Badge>
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold leading-snug">{headline}</p>
          {extraCount > 0 && (
            <p className="text-[11px] text-muted-foreground">+{extraCount} more topic{extraCount === 1 ? '' : 's'} this week</p>
          )}
          <span className="text-xs text-muted-foreground">{suggestion.entry.subject}</span>
          {suggestion.reason && (
            <p className="text-sm text-muted-foreground pt-1">{formatEmbeddedCaps(suggestion.reason)}</p>
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

  const columns: ColumnDef<StudyPlan>[] = [
    {
      accessorKey: 'topic',
      header: 'Topic',
      cell: ({ row }) => <span className="text-sm font-medium line-clamp-1">{formatTopicTitle(row.original.topic)}</span>,
    },
    { accessorKey: 'subject', header: 'Subject', cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{getValue<string>()}</span> },
    {
      id: 'due',
      header: 'Due',
      accessorFn: (p) => p.next_review_date ?? '',
      cell: ({ row }) => {
        const d = row.original.next_review_date ? parseISO(row.original.next_review_date) : null
        if (!d) return null
        return <span className="text-xs text-muted-foreground">{isToday(d) ? 'Today' : 'Overdue'}</span>
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1 text-xs text-purple-700 dark:text-purple-300 hover:text-purple-900"
          onClick={() => onStudio(row.original.id)}
        >
          <RotateCcw className="h-3 w-3" /> Review
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <RotateCcw className="h-4 w-4 text-purple-500" />
        <h2 className="text-sm font-semibold">Due for review</h2>
        <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300">
          {due.length}
        </Badge>
      </div>
      <DataTable
        columns={columns}
        data={due}
        filter={{ prompt: 'Search due topics...', column: 'topic' }}
      />
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

  const columns: ColumnDef<GradebookTopic>[] = [
    {
      id: 'week',
      header: 'Week',
      accessorFn: (t) => t.week_number,
      cell: ({ getValue }) => <span className="text-xs text-muted-foreground tabular-nums">W{getValue<number>()}</span>,
    },
    {
      accessorKey: 'topic',
      header: 'Topic',
      cell: ({ row }) => {
        const style = ACHIEVEMENT_STYLE[row.original.achievement] ?? ACHIEVEMENT_STYLE.none
        return (
          <div className="flex items-center gap-2 min-w-0">
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${style.dot}`} />
            <span className="text-sm truncate">{formatTopicTitle(row.original.topic)}</span>
          </div>
        )
      },
    },
    {
      id: 'status',
      header: 'Status',
      accessorFn: (t) => t.achievement,
      cell: ({ row }) => {
        const style = ACHIEVEMENT_STYLE[row.original.achievement] ?? ACHIEVEMENT_STYLE.none
        return <span className="text-xs text-muted-foreground">{style.label}</span>
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const busy = pendingTopicId === row.original.entry_id
        return (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-gold"
            onClick={() => onStartTopic(row.original)}
            disabled={busy}
          >
            {busy
              ? <Clock className="h-3 w-3 animate-pulse" />
              : <ChevronRight className="h-3 w-3" />}
            {busy ? 'Starting…' : 'Open'}
          </Button>
        )
      },
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={ordered}
      filter={{ prompt: 'Search topics...', column: 'topic' }}
    />
  )
}

// ── SubjectSection ────────────────────────────────────────────────────────────

function SubjectSection({
  subject, passMark, pendingPlans, onStartTopic, pendingTopicId,
}: {
  subject: SubjectGradebook
  passMark: string
  pendingPlans: StudyPlan[]
  onStartTopic: (topic: GradebookTopic) => void
  pendingTopicId: string | null
}) {
  const tri = subject.triangulation
  const weakMode =
    tri.length === 0 || tri.some((c) => !c.level || c.level === 'none')
  const belowPass = !subject.is_passing
  const showGap = belowPass || weakMode

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

      {pendingPlans.length > 0 && <PendingPlansTable plans={pendingPlans} showSubject={false} />}

      <SowRibbon topics={subject.topics} onStartTopic={onStartTopic} pendingTopicId={pendingTopicId} />

      {showGap && weakestTopic && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-300/50 bg-amber-50/50 dark:bg-amber-950/20 px-3 py-2.5">
          <div className="flex items-start gap-2 min-w-0">
            <Target className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 dark:text-amber-200">
              {belowPass
                ? `Below the ${passMark} pass mark — start with `
                : `Strengthen `}
              <span className="font-semibold">{formatTopicTitle(weakestTopic.topic)}</span> to close the gap.
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
  classId?: string | null
  sow?: any | null
}

export function StudyPlansClient({ user, initialPlans, gradebook, suggestion, error, classId, sow }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const plans = initialPlans

  const [checkedIn, setCheckedIn] = useState(false)
  const [checkingIn, startCheckIn] = useTransition()
  const [pendingTopicId, setPendingTopicId] = useState<string | null>(null)
  const [heroBusy, startHero] = useTransition()
  const [initiatingFree, startInitiateFree] = useTransition()
  const [freeSub, setFreeSub]     = useState(suggestion?.entry.subject ?? '')
  const [freeTopic, setFreeTopic] = useState(suggestion?.entry.topic ?? '')

  // ── Document Upload State ──────────────────────────────────────────────────
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [docType, setDocType] = useState<string>('term_report')
  const [uploadSuccess, setUploadSuccess] = useState(false)
  // Corrected state setter name from startUpload to setUploading [5]
  const [uploading, setUploading] = useState(false)

  // ── Sync upload and hydration states ───────────────────────────────────────
  const [isMounted, setIsMounted] = useState(false)
  const studentId = user?.user_id ?? user?.id
  const [hasUploadedBefore, setHasUploadedBefore] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const todayKey = `checkin_${new Date().toISOString().slice(0, 10)}`
    if (typeof window !== 'undefined' && localStorage.getItem(todayKey)) setCheckedIn(true)
  }, [])

  useEffect(() => {
    if (studentId) {
      const isUploaded = localStorage.getItem(`proof_uploaded_${studentId}`) === 'true'
      setHasUploadedBefore(isUploaded)
    }
  }, [studentId])

  const isMarketplace = user?.enrollment_source === 'marketplace' || !user?.class_id
  const firstName = user?.name?.split(' ')[0] ?? user?.first_name ?? 'Student'
  const passMark = gradebook?.scale?.passMark ?? 'D'

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
      if (p.id === todayPlan?.id) continue
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

  // Curriculum-authoritative — matches subjects-client.tsx's pattern. Gradebook
  // subjects require the student to already have assessment data, so a student
  // with real enrolled subjects but no grades yet saw an empty list here, which
  // silently fell through to unconstrained free-text subject/topic entry below
  // (e.g. a typed "Social Studies" + "Cell Science" that matches no real
  // curriculum at all — that's what generated the ungrounded, mislabeled plan).
  const subjectOptions = useMemo(
    () =>
      sow?.entries?.length
        ? Array.from(new Set<string>((sow.entries as any[]).map((e) => e.subject).filter(Boolean))).sort()
        : Array.from(new Set((gradebook?.subjects ?? []).map((s) => s.subject))),
    [sow, gradebook],
  )

  // Real topics for the selected subject only — never a free-typed topic that
  // doesn't exist in this student's actual curriculum.
  const topicOptions = useMemo(
    () =>
      sow?.entries?.length
        ? Array.from(
            new Set<string>(
              (sow.entries as any[])
                .filter((e) => e.subject === freeSub)
                .map((e) => e.topic)
                .filter(Boolean),
            ),
          )
        : [],
    [sow, freeSub],
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
      if (data && !data.already_checked_in) {
        toast.success(`Day ${data.streak_days} streak — keep it up!`)
        // Backend already incremented students.study_streak — refresh so the
        // header's StreakBadge (fed from the server-rendered `user` prop,
        // a snapshot from page load) actually reflects it instead of staying
        // stuck at whatever it was when the page first loaded.
        router.refresh()
      }
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

  // ── Upload Document Form Handler ──────────────────────────────────────────
  function handleDocumentSubmit() {
    if (!selectedFile) {
      toast.error('Please select a file to upload.')
      return
    }

    setUploading(true)
    const fd = new FormData()
    fd.append('file', selectedFile)
    fd.append('doc_type', docType)

    uploadStudentDocument(fd)
      .then(({ error }) => {
        setUploading(false)
        if (error) {
          toast.error(error.message)
          return
        }
        toast.success('Document uploaded successfully!')
        
        if (studentId) {
          localStorage.setItem(`proof_uploaded_${studentId}`, 'true')
        }
        
        setUploadSuccess(true)
        setHasUploadedBefore(true)
        setSelectedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
      })
      .catch(() => {
        setUploading(false)
        toast.error('Upload failed. Please try again.')
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

  const hasClass = !!classId

  if (!hasClass) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">My Study Plans</h1>
          <p className="text-muted-foreground text-sm mt-1">Your active study tasks and dynamic plans appear here.</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center max-w-lg mx-auto">
            <div className="relative mb-4">
              <BookOpenCheck className="h-10 w-10 text-muted-foreground/30" />
              <div className="absolute -bottom-1 -right-1 rounded-full bg-amber-500 p-0.5 text-white animate-pulse">
                <Clock className="h-3.5 w-3.5" />
              </div>
            </div>
            <h3 className="font-semibold text-lg text-foreground">Study Plans Pending Approval</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              Your independent study plans at{' '}
              <span className="font-semibold text-foreground">
                {user?.organization_name ?? 'your school'}
              </span>{' '}
              will unlock as soon as a school administrator approves your class request.
            </p>

            {/* ── Proof of Class Document Upload Section (Gated on Study Plans) ── */}
            <div className="w-full mt-6 border border-border/70 rounded-xl p-4 bg-muted/20 text-left space-y-4">
              <div className="flex items-start gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#C9A84C]/10 text-[#C9A84C]">
                  <Upload className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">School Approval Status</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                    Optionally upload your previous term report card or results so the administrator can verify your class and accept your request faster.
                  </p>
                </div>
              </div>

              {hasUploadedBefore || uploadSuccess ? (
                <div className="flex items-start gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-emerald-800 dark:text-emerald-300 text-xs font-medium w-full">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Provisional proof uploaded!</p>
                    <p className="text-[11px] text-muted-foreground/80 mt-0.5 leading-normal font-normal">
                      We have received your verification document. Your school administrator is currently reviewing it.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Document Type</Label>
                      <Select value={docType} onValueChange={setDocType}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="term_report">Term Report Card</SelectItem>
                          <SelectItem value="prior_results">Prior Exam Results</SelectItem>
                          <SelectItem value="other">Other Document</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Choose File</Label>
                      <div className="relative">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            setSelectedFile(e.target.files?.[0] ?? null)
                            setUploadSuccess(false)
                          }}
                          className="hidden"
                          id="study-plans-doc-file"
                        />
                        <label
                          htmlFor="study-plans-doc-file"
                          className="flex h-8 w-full items-center justify-center gap-1 px-3 border border-input rounded-lg bg-background hover:bg-muted text-xs cursor-pointer truncate font-medium transition-colors"
                        >
                          <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">{selectedFile ? selectedFile.name : 'Select PDF or Photo'}</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {selectedFile && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleDocumentSubmit}
                        disabled={uploading}
                        className="h-8 text-xs font-bold flex-1"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                            Uploading…
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Upload File to Teacher
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedFile(null)}
                        disabled={uploading}
                        className="h-8 text-xs text-muted-foreground"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 rounded-xl bg-amber-500/5 border border-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-300 text-left w-full">
              <p className="font-semibold mb-1">What happens next?</p>
              <p className="leading-relaxed">
                Once the school administrator reviews and accepts your request, your subjects, diagnostic results, and personalized study plans will unlock immediately.
              </p>
            </div>
          </CardContent>
        </Card>
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
      {isMounted && isMarketplace && !checkedIn && (
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
              <Select value={freeSub} onValueChange={(v) => { setFreeSub(v); setFreeTopic('') }}>
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
            {topicOptions.length > 0 ? (
              <Select value={freeTopic} onValueChange={setFreeTopic}>
                <SelectTrigger className="flex-1 min-w-[200px] h-8 text-sm">
                  {/* Radix only mirrors a SelectItem's formatted label once the
                      dropdown has been opened at least once — a value set
                      programmatically (e.g. pre-filled from a suggestion)
                      shows the raw string until then. Pass the formatted
                      label explicitly so it's never wrong. */}
                  <SelectValue placeholder="Topic">
                    {freeTopic ? formatTopicTitle(freeTopic) : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {topicOptions.map((t) => <SelectItem key={t} value={t}>{formatTopicTitle(t)}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder={freeSub ? `Topic (e.g. from ${freeSub})` : 'Pick a subject first'}
                value={freeTopic}
                onChange={(e) => setFreeTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInitiateFree()}
                disabled={!freeSub}
                className="flex-1 min-w-[200px] h-8 text-sm"
              />
            )}
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
          <CompletedPlansTable plans={completed} />
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