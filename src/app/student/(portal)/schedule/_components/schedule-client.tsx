'use client'

// src/app/student/(portal)/schedule/_components/schedule-client.tsx

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import type { ColumnDef } from '@tanstack/react-table'
import {
  CalendarDays, CheckCircle2, AlertCircle, Clock,
  BookOpen, UserCheck, XCircle, MinusCircle, Sparkles,
  Target, TrendingUp, Unlock, School, BookOpenCheck, Zap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { DataTable } from '@/components/ui/data-table'
import { formatTopicTitle, splitTopicHeadline } from '@/lib/utils'
import { toast } from 'sonner'
import {
  selfInitiateStudyPlan,
  initiateFreeStudyPlan, // <-- Import for pre-class free initiations
  type PacingResponse
} from '@/lib/actions/student-dashboard'
import {
  updateStudentPaceSettings,
  type StudyScheduleResponse,
  type StudyMode,
  type NudgeChannel,
  type PaceSettings,
  type PacingSubjectSummary,
} from '@/lib/actions/study-plans'
import { AskTracyChip } from '@/components/students/ask-tracy-chip'
import { ClassConfirmationUploadWidget } from '@/components/students/class-confirmation-upload-widget'
import { WeekCalendar } from './week-calendar'
import { SyllabusTab } from './syllabus-tab'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

const ATTENDANCE_COLOR: Record<string, string> = {
  present: 'text-emerald-600',
  absent:  'text-rose-500',
  late:    'text-amber-600',
  excused: 'text-blue-500',
}
const ATTENDANCE_ICON: Record<string, any> = {
  present: CheckCircle2,
  absent:  XCircle,
  late:    Clock,
  excused: MinusCircle,
}

function AttendanceTable({ records }: { records: any[] }) {
  const columns: ColumnDef<any>[] = [
    {
      id: 'status',
      header: 'Status',
      accessorFn: (r) => r.status,
      cell: ({ row }) => {
        const record = row.original
        const Icon = ATTENDANCE_ICON[record.status] ?? CheckCircle2
        return (
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 shrink-0 ${ATTENDANCE_COLOR[record.status] ?? 'text-muted-foreground'}`} />
            <span className="text-sm font-medium capitalize">{record.status}</span>
          </div>
        )
      },
    },
    {
      id: 'subject',
      header: 'Subject',
      accessorFn: (r) => r.subject ?? r.session?.subject ?? '',
      cell: ({ getValue }) => {
        const subject = getValue<string>()
        return subject
          ? <span className="text-xs text-muted-foreground">{subject}</span>
          : <span className="text-xs text-muted-foreground/50">—</span>
      },
    },
    {
      id: 'date',
      header: 'Date',
      accessorFn: (r) => new Date(r.date ?? r.session?.date ?? r.created_at ?? 0).getTime(),
      cell: ({ row }) => {
        const record = row.original
        const dateStr = record.date
          ? format(new Date(record.date), 'EEE, MMM d')
          : record.session?.date
          ? format(new Date(record.session.date), 'EEE, MMM d')
          : null
        return dateStr ? <span className="text-xs text-muted-foreground">{dateStr}</span> : null
      },
    },
    {
      id: 'source',
      header: 'Source',
      accessorFn: (r) => (r.source === 'platform_activity' ? 'Self-study' : 'Class session'),
      cell: ({ getValue }) => (
        <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
          {getValue<string>()}
        </Badge>
      ),
    },
  ]

  const sorted = [...records].sort((a, b) =>
    new Date(b.date ?? b.created_at ?? 0).getTime() - new Date(a.date ?? a.created_at ?? 0).getTime(),
  )

  return (
    <DataTable
      columns={columns}
      data={sorted}
      filter={{ prompt: 'Search by subject...', column: 'subject' }}
    />
  )
}

function ThisWeekTable({
  entries,
  onStudyThis,
  initiating,
  initiatingEntry,
}: {
  entries: any[]
  onStudyThis: (id: string, isDelivered: boolean, subject: string, topic: string) => void
  initiating: boolean
  initiatingEntry: string | null
}) {
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'topic',
      header: 'Topic',
      cell: ({ row }) => {
        const entry = row.original
        const { headline, extraCount } = splitTopicHeadline(entry.topic)
        return (
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className={`rounded-full p-1 shrink-0 ${entry.is_delivered ? 'bg-emerald-100' : 'bg-muted'}`}>
                {entry.is_delivered
                  ? <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  : <AlertCircle className="h-3 w-3 text-muted-foreground" />
                }
              </div>
              <span className="font-medium text-sm">{headline}</span>
              {extraCount > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">+{extraCount} more</Badge>
              )}
            </div>
            {(entry.subtopics as string[])?.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {(entry.subtopics as string[]).slice(0, 3).join(' · ')}
              </p>
            )}
          </div>
        )
      },
    },
    {
      id: 'week',
      header: 'Week',
      accessorFn: (e) => e.week_number,
      cell: ({ getValue }) => <span className="text-xs text-muted-foreground tabular-nums">Wk {getValue<number>()}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      accessorFn: (e) => (e.is_delivered ? 'Delivered' : 'Upcoming'),
      cell: ({ row }) => row.original.is_delivered
        ? <Badge className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700">Delivered</Badge>
        : <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Upcoming</Badge>,
    },
    {
      id: 'duration',
      header: 'Duration',
      cell: ({ row }) => row.original.duration_lessons
        ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {row.original.duration_lessons} lesson{row.original.duration_lessons > 1 ? 's' : ''}
          </span>
        )
        : null,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const entry = row.original
        const busy = initiating && initiatingEntry === entry.id
        return (
          <Button
            size="sm"
            className={`h-7 text-xs shrink-0 gap-1 font-semibold ${
              entry.is_delivered
                ? 'bg-gold hover:bg-gold/90 text-gold-foreground'
                : 'bg-muted hover:bg-muted/80 text-foreground border border-border/80'
            }`}
            onClick={() => onStudyThis(entry.id, entry.is_delivered, entry.subject, entry.topic)}
            disabled={busy}
          >
            <Sparkles className="h-3 w-3" />
            {busy ? '…' : entry.is_delivered ? 'Review' : 'Pre-study'}
          </Button>
        )
      },
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={entries}
      filter={{ prompt: 'Search topics...', column: 'topic' }}
    />
  )
}

interface Props {
  user:               any
  sow:                any | null
  currentWeekEntries: any[]
  timetable:          any[]
  attendance:         any[]
  pacingData:         PacingResponse
  studySchedule:      StudyScheduleResponse
  paceSettings:       PaceSettings
  activeTab:          string
  classId?:           string | null // <-- Add classId prop for absolute portal gating coherence
  classFetchFailed?:  boolean
}

export function ScheduleClient({
  user, sow, currentWeekEntries, timetable, attendance, pacingData, studySchedule, paceSettings, activeTab: initialTab, classId, classFetchFailed,
}: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'week' | 'timetable' | 'attendance' | 'syllabus'>(
    initialTab as any ?? 'week',
  )
  const [initiating, startInitiate] = useTransition()
  const [initiatingEntry, setInitiatingEntry] = useState<string | null>(null)
  const studentId = user?.user_id ?? user?.id

  // Open vs Guided Pace — same curriculum-required content, the difference is
  // only whether times are fixed. Persisted to pace settings.
  const mode: StudyMode = studySchedule.mode ?? paceSettings.study_mode ?? 'open'
  const [savingMode, startSaveMode] = useTransition()
  const [settingsOpen, setSettingsOpen] = useState(false)

  function handleSetMode(next: StudyMode) {
    if (next === mode || savingMode) return
    startSaveMode(async () => {
      const { error } = await updateStudentPaceSettings(studentId, {
        lessons_per_day: paceSettings.lessons_per_day,
        preferred_reminder_time: paceSettings.preferred_reminder_time,
        reminder_enabled: paceSettings.reminder_enabled,
        study_mode: next,
      })
      if (error) {
        toast.error(error.message ?? 'Could not switch mode')
        return
      }
      router.refresh()
    })
  }

  // Accelerated-mode target: "finish this many weeks before the term milestone."
  // Blank = use the recommended default computed server-side.
  const [accelWeeks, setAccelWeeks] = useState<string>(
    paceSettings.acceleration_weeks != null ? String(paceSettings.acceleration_weeks) : '',
  )
  const [savingAccel, startSaveAccel] = useTransition()

  function handleSaveAccelWeeks() {
    if (savingAccel) return
    const trimmed = accelWeeks.trim()
    const parsed = trimmed === '' ? undefined : Math.max(1, Math.min(20, parseInt(trimmed, 10)))
    if (trimmed !== '' && Number.isNaN(parsed)) return
    startSaveAccel(async () => {
      const { error } = await updateStudentPaceSettings(studentId, {
        lessons_per_day: paceSettings.lessons_per_day,
        preferred_reminder_time: paceSettings.preferred_reminder_time,
        reminder_enabled: paceSettings.reminder_enabled,
        study_mode: 'accelerated',
        acceleration_weeks: parsed,
      })
      if (error) {
        toast.error(error.message ?? 'Could not update acceleration target')
        return
      }
      router.refresh()
    })
  }

  // Weekly study-hours target — applies regardless of mode, drives the rolling
  // daily-plan target_minutes. Blank = no target set.
  const [weeklyTarget, setWeeklyTarget] = useState<string>(
    paceSettings.weekly_target_hours != null ? String(paceSettings.weekly_target_hours) : '',
  )
  const [savingWeeklyTarget, startSaveWeeklyTarget] = useTransition()

  function handleSaveWeeklyTarget() {
    if (savingWeeklyTarget) return
    const trimmed = weeklyTarget.trim()
    const parsed = trimmed === '' ? undefined : Math.max(1, Math.min(168, parseInt(trimmed, 10)))
    if (trimmed !== '' && Number.isNaN(parsed)) return
    startSaveWeeklyTarget(async () => {
      const { error } = await updateStudentPaceSettings(studentId, {
        lessons_per_day: paceSettings.lessons_per_day,
        preferred_reminder_time: paceSettings.preferred_reminder_time,
        reminder_enabled: paceSettings.reminder_enabled,
        weekly_target_hours: parsed,
      })
      if (error) {
        toast.error(error.message ?? 'Could not update weekly target')
        return
      }
      router.refresh()
    })
  }

  // Nudge channels (Guided Pace only — that's what the active tracker uses).
  const ALL_CHANNELS: { id: NudgeChannel; label: string }[] = [
    { id: 'in_app', label: 'In-app' },
    { id: 'email', label: 'Email' },
    { id: 'whatsapp', label: 'WhatsApp' },
  ]
  const [channels, setChannels] = useState<NudgeChannel[]>(
    paceSettings.nudge_channels ?? ['in_app', 'email'],
  )
  const [, startSaveChannels] = useTransition()

  function toggleChannel(ch: NudgeChannel) {
    const next = channels.includes(ch)
      ? channels.filter((c) => c !== ch)
      : [...channels, ch]
    if (next.length === 0) return // keep at least one channel
    const prev = channels
    setChannels(next)
    startSaveChannels(async () => {
      const { error } = await updateStudentPaceSettings(studentId, {
        lessons_per_day: paceSettings.lessons_per_day,
        preferred_reminder_time: paceSettings.preferred_reminder_time,
        reminder_enabled: paceSettings.reminder_enabled,
        nudge_channels: next,
      })
      if (error) {
        toast.error('Could not update notifications')
        setChannels(prev)
      }
    })
  }

  // ── Classroom Pacing Handlers: Review vs Pre-Class Preview ──────────────────
  function handleStudyThis(entryId: string, isDelivered: boolean, subject?: string, topic?: string) {
    setInitiatingEntry(entryId)
    startInitiate(async () => {
      // If the lesson is NOT yet delivered, trigger a flipped-classroom pre-study lesson type!
      if (!isDelivered && subject && topic) {
        const { data, error } = await initiateFreeStudyPlan(subject, topic, 'pre_class')
        setInitiatingEntry(null)
        if (error) { toast.error(error.message); return }
        if (data?.plan_id) {
          toast.success('Pre-class preview plan created!')
          router.push(`/student/study-plans/${data.plan_id}/studio`)
        }
        return
      }

      // If already delivered, self-initiate standard consolidation
      const { data, error } = await selfInitiateStudyPlan(entryId)
      setInitiatingEntry(null)
      if (error) { toast.error(error.message); return }
      if (data?.plan_id) {
        toast.success('Review study plan created!')
        router.push(`/student/study-plans/${data.plan_id}/studio`)
      }
    })
  }

  const tabs = [
    { id: 'week',       label: 'This Week',  icon: BookOpen },
    { id: 'timetable',  label: 'Timetable',  icon: CalendarDays },
    { id: 'attendance', label: 'Attendance', icon: UserCheck },
    { id: 'syllabus',   label: 'Syllabus',   icon: Sparkles },
  ]

  // Merge physical timetable + SoW study slots
  const mergedTimetable = [
    ...studySchedule.physical_slots.map((s) => ({ ...s, type: 'class', source: 'timetable' })),
    ...studySchedule.study_slots,
  ]
  const displayTimetable = mergedTimetable.length > 0 ? mergedTimetable : timetable.map((s) => ({ ...s, type: 'class', source: 'timetable' }))

  // Group timetable slots by day
  const slotsByDay = DAYS.reduce<Record<string, any[]>>((acc, day) => {
    acc[day] = displayTimetable.filter((s) => s.day_of_week === day)
      .sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? ''))
    return acc
  }, {})

  // ── New mastery-gated pacing shape ──────────────────────────────────────────
  const pacingSummary = studySchedule.pacing_summary ?? []
  const milestone = studySchedule.milestone
  const hasPacing = (studySchedule.days?.length ?? 0) > 0 || pacingSummary.length > 0

  // Study blocks by day (from the engine). In Guided mode we also weave in the
  // physical lessons so it reads like a real school timetable.
  const studyBlocksByDay = DAYS.reduce<Record<string, any[]>>((acc, day) => {
    const block = (studySchedule.days ?? []).find((d) => d.day_of_week === day)
    acc[day] = block ? block.blocks : []
    return acc
  }, {})

  const guidedByDay = DAYS.reduce<Record<string, any[]>>((acc, day) => {
    const physical = studySchedule.physical_slots
      .filter((s: any) => s.day_of_week === day)
      .map((s: any) => ({ ...s, kind: 'class' as const }))
    const study = studyBlocksByDay[day].map((b: any) => ({ ...b, kind: 'study' as const }))
    acc[day] = [...physical, ...study].sort((a, b) =>
      (a.start_time ?? '').localeCompare(b.start_time ?? ''),
    )
    return acc
  }, {})

  const behindCount = pacingSummary.filter((s) => s.status === 'behind').length

  const statusStyle = (s: PacingSubjectSummary['status']) =>
    s === 'behind' ? 'text-rose-600' : s === 'ahead' ? 'text-emerald-600' : 'text-muted-foreground'

  // Attendance stats
  const presentCount = attendance.filter((a) => a.status === 'present').length
  const totalCount   = attendance.length
  const attendancePct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : null

  const isMarketplace = user?.enrollment_source === 'marketplace'

  // ── Coherent Gating: Pending Admin Approval State ──────────────────────────
  const hasClass = !!classId
  if (!hasClass && classFetchFailed) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">My Schedule</h1>
        </div>
        <Card className="border-rose-200">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center max-w-lg mx-auto">
            <AlertCircle className="h-10 w-10 text-rose-400 mb-3" />
            <h3 className="font-semibold text-lg text-foreground">Couldn&apos;t load your schedule</h3>
            <p className="text-sm text-muted-foreground mt-2 px-3">
              Something went wrong on our end — this isn&apos;t about your class registration. Please refresh, or try again shortly.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }
  if (!hasClass) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">My Schedule</h1>
          <p className="text-muted-foreground text-sm mt-1">Your active timetable, lessons, and attendance appear here.</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center max-w-lg mx-auto">
            <div className="relative mb-4">
              <CalendarDays className="h-10 w-10 text-muted-foreground/30" />
              <div className="absolute -bottom-1 -right-1 rounded-full bg-amber-500 p-0.5 text-white animate-pulse">
                <Clock className="h-3.5 w-3.5" />
              </div>
            </div>
            <h3 className="font-semibold text-lg text-foreground">Schedule Pending Approval</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              Your weekly target scheduler and physical classes timetable at{' '}
              <span className="font-semibold text-foreground">
                {user?.organization_name ?? 'your school'}
              </span>{' '}
              will configure as soon as your request is accepted.
            </p>

            <ClassConfirmationUploadWidget studentId={studentId} />

            <div className="mt-4 rounded-xl bg-amber-500/5 border border-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-300 text-left w-full">
              <p className="font-semibold mb-1">What happens next?</p>
              <p className="leading-relaxed">
                Once approved, your weekly target pace scheduler, physical timetable grid, and syllabus tracker will unlock instantly.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">My Schedule</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {sow
            ? `${sow.subject ?? ''} ${sow.grade_level ?? ''} · ${sow.term ?? ''} ${sow.academic_year ?? ''}`
            : 'Your timetable, lessons, and attendance'}
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
      <TabsList>
        {tabs.map(({ id, label, icon: Icon }) => (
          <TabsTrigger key={id} value={id} className="flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5" />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* ── This Week tab ── */}
      <TabsContent value="week">
        <div className="space-y-3">
          {currentWeekEntries.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No topics scheduled for this week</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your teacher hasn&apos;t set up a scheme of work yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ThisWeekTable
              entries={currentWeekEntries}
              onStudyThis={handleStudyThis}
              initiating={initiating}
              initiatingEntry={initiatingEntry}
            />
          )}
        </div>
      </TabsContent>

      {/* ── Timetable tab ── */}
      <TabsContent value="timetable">
        <div className="space-y-4">
          {/* Pacing settings — collapsed by default so the actual schedule
              leads, not the controls for configuring it. */}
          <div className="rounded-lg border bg-muted/20">
            <button
              onClick={() => setSettingsOpen((v) => !v)}
              className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left"
            >
              <span className="flex items-center gap-2 text-xs">
                {mode === 'open' && <Unlock className="h-3.5 w-3.5 text-muted-foreground" />}
                {mode === 'guided' && <Clock className="h-3.5 w-3.5 text-muted-foreground" />}
                {mode === 'accelerated' && <Zap className="h-3.5 w-3.5 text-muted-foreground" />}
                <span className="font-medium">
                  {mode === 'open' ? 'Open pace' : mode === 'guided' ? 'Guided pace' : 'Accelerated pace'}
                </span>
                <span className="text-muted-foreground hidden sm:inline">
                  {mode === 'open'
                    ? '— study today\'s required lessons anytime'
                    : mode === 'guided'
                      ? '— a timed timetable, paced to your goal'
                      : '— finishing ahead of the term schedule'}
                </span>
              </span>
              <span className="text-[11px] text-gold font-medium shrink-0">
                {settingsOpen ? 'Done' : 'Change'}
              </span>
            </button>

            {settingsOpen && (
              <div className="px-3 pb-3 pt-1 space-y-3 border-t">
                <div className="inline-flex rounded-lg border p-0.5 bg-background">
                  {(['open', 'guided', 'accelerated'] as StudyMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => handleSetMode(m)}
                      disabled={savingMode}
                      aria-pressed={mode === m}
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
                        mode === m
                          ? 'bg-muted shadow-sm text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {m === 'open' && <Unlock className="h-3 w-3" />}
                      {m === 'guided' && <Clock className="h-3 w-3" />}
                      {m === 'accelerated' && <Zap className="h-3 w-3" />}
                      {m === 'open' ? 'Open' : m === 'guided' ? 'Guided Pace' : 'Accelerated'}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Label htmlFor="weekly-target" className="text-xs text-muted-foreground">
                    Weekly target
                  </Label>
                  <input
                    id="weekly-target"
                    type="number"
                    min={1}
                    max={168}
                    value={weeklyTarget}
                    onChange={(e) => setWeeklyTarget(e.target.value)}
                    onBlur={handleSaveWeeklyTarget}
                    placeholder="e.g. 8"
                    className="w-16 rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gold/30"
                    disabled={savingWeeklyTarget}
                  />
                  <span className="text-xs text-muted-foreground">hour(s) a week (blank = no target)</span>
                </div>

                {mode === 'accelerated' && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Label htmlFor="accel-weeks" className="text-xs text-muted-foreground">
                      Aim to finish
                    </Label>
                    <input
                      id="accel-weeks"
                      type="number"
                      min={1}
                      max={20}
                      value={accelWeeks}
                      onChange={(e) => setAccelWeeks(e.target.value)}
                      onBlur={handleSaveAccelWeeks}
                      placeholder="3"
                      className="w-16 rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gold/30"
                      disabled={savingAccel}
                    />
                    <span className="text-xs text-muted-foreground">week(s) early (blank = recommended)</span>
                  </div>
                )}

                {mode === 'guided' && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">Nudge me on:</span>
                      {ALL_CHANNELS.map((c) => {
                        const on = channels.includes(c.id)
                        return (
                          <button
                            key={c.id}
                            onClick={() => toggleChannel(c.id)}
                            aria-pressed={on}
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                              on
                                ? 'border-gold bg-gold/15 text-gold'
                                : 'border-border text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {c.label}
                          </button>
                        )
                      })}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      These are study-reminder channels. Account-wide email/in-app notifications are in{' '}
                      <Link href="/student/settings" className="text-gold hover:underline">Settings</Link>.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pacing banner */}
          {hasPacing && (
            <Card className={behindCount > 0 ? 'border-rose-200 bg-rose-50/40' : 'border-gold/30 bg-gold/5'}>
              <CardContent className="py-3 px-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-gold shrink-0" />
                  <p className="text-sm font-medium">
                    {milestone?.label ? `Pacing toward ${milestone.label}` : 'Your pacing'}
                    {milestone?.weeks_remaining != null && (
                      <span className="text-muted-foreground font-normal">
                        {' '}· {milestone.weeks_remaining} wk{milestone.weeks_remaining === 1 ? '' : 's'} left
                      </span>
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  {pacingSummary.map((s) => (
                    <div key={s.scheme_id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium truncate">{s.subject}</span>
                      <span className={`shrink-0 flex items-center gap-1 ${statusStyle(s.status)}`}>
                        {s.status === 'behind' ? (
                          <><AlertCircle className="h-3 w-3" />Behind — {s.required_blocks_per_week} session{s.required_blocks_per_week === 1 ? '' : 's'}/wk to finish</>
                        ) : s.status === 'ahead' ? (
                          <><TrendingUp className="h-3 w-3" />Ahead of pace</>
                        ) : (
                          <><CheckCircle2 className="h-3 w-3" />On track · {s.required_blocks_per_week}/wk</>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
                {behindCount > 0 && (
                  <div className="flex justify-end pt-1">
                    <AskTracyChip
                      label="Falling behind? Ask Tracy"
                      prompt={`I'm behind pace in ${pacingSummary.filter((s) => s.status === 'behind').map((s) => s.subject).join(', ')}. Can you help me make a realistic catch-up plan?`}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Calendar overview — a real day/3-day/week grid, click an event to
              view its details read-only (like Google Calendar's view popup,
              minus any editing). The actionable list below still has the
              "Study" buttons; this is purely a visual "where am I" layer. */}
          {(() => {
            const calendarBlocksByDay: Record<string, any[]> = hasPacing
              ? (mode === 'guided' ? guidedByDay : studyBlocksByDay)
              : slotsByDay
            const hasAnyEvents = DAYS.some((d) => (calendarBlocksByDay[d] ?? []).length > 0)
            if (!hasAnyEvents) return null
            const normalized = DAYS.reduce<Record<string, any[]>>((acc, day) => {
              acc[day] = (calendarBlocksByDay[day] ?? []).map((b: any) => ({
                ...b,
                kind: b.kind ?? (b.type === 'study' || b.source === 'sow' ? 'study' : 'class'),
              }))
              return acc
            }, {})
            return <WeekCalendar days={DAYS} blocksByDay={normalized} />
          })()}

          {/* Schedule body */}
          {hasPacing ? (
            mode === 'guided' ? (
              DAYS.filter((d) => guidedByDay[d].length > 0).map((day) => (
                <div key={day}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </p>
                  <div className="space-y-1.5">
                    {guidedByDay[day].map((slot: any, i: number) => {
                      const isStudy = slot.kind === 'study'
                      return (
                        <Card 
                          key={i} 
                          className={isStudy 
                            ? 'border-dashed border-gold/40 bg-gold/[0.02]' 
                            : 'border-border/60 bg-muted/10'
                          }
                        >
                          <CardContent className="py-2.5 px-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="text-xs text-muted-foreground tabular-nums w-20 shrink-0 flex items-center gap-1">
                                  {isStudy ? <Sparkles className="h-3 w-3 text-gold/60" /> : <School className="h-3 w-3 text-muted-foreground/60" />}
                                  {slot.start_time} – {slot.end_time}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="text-sm font-semibold truncate leading-tight">{slot.subject}</p>
                                    <Badge 
                                      variant={isStudy ? "default" : "secondary"} 
                                      className={`text-[9px] px-1 py-0 uppercase tracking-wide font-bold scale-[0.9] origin-left border-0 ${
                                        isStudy ? 'bg-gold/15 text-gold hover:bg-gold/25' : 'bg-muted-foreground/10 text-muted-foreground'
                                      }`}
                                    >
                                      {isStudy ? 'Mirror Study' : 'School Class'}
                                    </Badge>
                                  </div>
                                  {isStudy && slot.topic && (
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">{formatTopicTitle(slot.topic)}</p>
                                  )}
                                  {!isStudy && slot.room && (
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">Room: {slot.room}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {isStudy ? (
                                  <Button
                                    size="sm"
                                    className="h-7 text-xs gap-1 bg-gold hover:bg-gold/90 text-gold-foreground font-bold"
                                    onClick={() => handleStudyThis(slot.sow_entry_id, true)}
                                    disabled={initiating && initiatingEntry === slot.sow_entry_id}
                                  >
                                    <Sparkles className="h-3 w-3" />
                                    {initiating && initiatingEntry === slot.sow_entry_id ? '…' : 'Study'}
                                  </Button>
                                ) : slot.period ? (
                                  <Badge variant="outline" className="text-[10px] h-5">Period {slot.period}</Badge>
                                ) : null}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              ))
            ) : (
              // Open mode — a "cover today" checklist with no fixed times.
              DAYS.filter((d) => studyBlocksByDay[d].length > 0).map((day) => (
                <div key={day}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                    {day.charAt(0).toUpperCase() + day.slice(1)} · cover today
                  </p>
                  <div className="space-y-1.5">
                    {studyBlocksByDay[day].map((b: any, i: number) => (
                      <Card key={i} className="border-dashed border-gold/40 bg-gold/[0.02]">
                        <CardContent className="py-2.5 px-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-semibold truncate leading-tight">{b.subject}</p>
                                <Badge className="text-[9px] px-1 py-0 uppercase tracking-wide font-bold scale-[0.9] origin-left border-0 bg-gold/15 text-gold hover:bg-gold/25">
                                  Mirror Study
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{formatTopicTitle(b.topic)}</p>
                            </div>
                            <Button
                              size="sm"
                              className="h-7 text-xs gap-1 shrink-0 bg-gold hover:bg-gold/90 text-gold-foreground font-bold"
                              onClick={() => handleStudyThis(b.sow_entry_id, true)}
                              disabled={initiating && initiatingEntry === b.sow_entry_id}
                            >
                              <Sparkles className="h-3 w-3" />
                              {initiating && initiatingEntry === b.sow_entry_id ? '…' : 'Study'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            )
          ) : displayTimetable.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarDays className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No timetable yet</p>
                <p className="text-xs text-muted-foreground mt-1 mb-3">
                  Once a scheme of work is set up, your paced timetable appears here. In the meantime, you can still study any topic.
                </p>
                <Button asChild size="sm" className="gap-1 bg-gold hover:bg-gold/90 text-gold-foreground">
                  <Link href="/student/subjects"><Sparkles className="h-3.5 w-3.5" />Study freely</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            DAYS.filter((d) => slotsByDay[d].length > 0).map((day) => (
              <div key={day}>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </p>
                <div className="space-y-1.5">
                  {slotsByDay[day].map((slot: any, i: number) => (
                    <Card key={i} className={slot.type === 'study' ? 'border-dashed border-gold/40 bg-gold/3' : ''}>
                      <CardContent className="py-2.5 px-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="text-xs text-muted-foreground tabular-nums w-20 shrink-0">
                              {slot.start_time} – {slot.end_time}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{slot.subject}</p>
                              {slot.type === 'study' && slot.topic && (
                                <p className="text-xs text-muted-foreground">{formatTopicTitle(slot.topic)}</p>
                              )}
                              {slot.type === 'class' && slot.room && (
                                <p className="text-xs text-muted-foreground">{slot.room}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {slot.type === 'study' && (
                              <Badge className="text-[10px] px-1.5 py-0 bg-gold/20 text-gold border-0">Study</Badge>
                            )}
                            {slot.type === 'class' && slot.period && (
                              <Badge variant="outline" className="text-[10px]">P{slot.period}</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </TabsContent>

      {/* ── Syllabus tab ── */}
      <TabsContent value="syllabus">
        <SyllabusTab data={pacingData} />
      </TabsContent>

      {/* ── Attendance tab ── */}
      <TabsContent value="attendance">
        <div className="space-y-3">
          {attendancePct !== null && (
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Overall Attendance</p>
                  <span className={`text-lg font-bold ${
                    attendancePct >= 80 ? 'text-emerald-600' : attendancePct >= 60 ? 'text-amber-600' : 'text-rose-500'
                  }`}>{attendancePct}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      attendancePct >= 80 ? 'bg-emerald-500' : attendancePct >= 60 ? 'bg-amber-400' : 'bg-rose-500'
                    }`}
                    style={{ width: `${attendancePct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {presentCount} present out of {totalCount} sessions
                </p>
              </CardContent>
            </Card>
          )}

          {attendance.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <UserCheck className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No attendance records yet</p>
              </CardContent>
            </Card>
          ) : (
            <AttendanceTable records={attendance} />
          )}
        </div>
      </TabsContent>
      </Tabs>
    </div>
  )
}