'use client'

// src/app/student/(portal)/schedule/_components/schedule-client.tsx

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  CalendarDays, CheckCircle2, AlertCircle, Clock,
  BookOpen, UserCheck, XCircle, MinusCircle, Sparkles,
  Target, TrendingUp, Unlock, School, Upload, FileText, Check, Plus, Loader2, BookOpenCheck, Zap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
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
import { uploadStudentDocument } from '@/lib/actions/student-onboarding'
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
}

export function ScheduleClient({
  user, sow, currentWeekEntries, timetable, attendance, pacingData, studySchedule, paceSettings, activeTab: initialTab, classId,
}: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<'week' | 'timetable' | 'attendance' | 'syllabus'>(
    initialTab as any ?? 'week',
  )
  const [initiating, startInitiate] = useTransition()
  const [initiatingEntry, setInitiatingEntry] = useState<string | null>(null)

  // ── Document Upload State (Gating Coherence) ──────────────────────────────
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [docType, setDocType] = useState<string>('term_report')
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploading, setUploading] = useState(false)
  const studentId = user?.user_id ?? user?.id
  const [hasUploadedBefore, setHasUploadedBefore] = useState(false)

  useEffect(() => {
    if (studentId) {
      const isUploaded = localStorage.getItem(`proof_uploaded_${studentId}`) === 'true'
      setHasUploadedBefore(isUploaded)
    }
  }, [studentId])

  // Open vs Guided Pace — same curriculum-required content, the difference is
  // only whether times are fixed. Persisted to pace settings.
  const mode: StudyMode = studySchedule.mode ?? paceSettings.study_mode ?? 'open'
  const [savingMode, startSaveMode] = useTransition()

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

  // ── Document Upload Submission Handler ──────────────────────────────────────
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

            {/* ── Proof of Class Document Upload Section (Gated on Timetable) ── */}
            <div className="w-full mt-6 border border-border/70 rounded-xl p-4 bg-muted/20 text-left space-y-4">
              <div className="flex items-start gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#C9A84C]/10 text-[#C9A84C]">
                  <Upload className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Upload class confirmation</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                    To help us set up your timetable faster, optionally upload a photo of your registration form, index card, or report card.
                  </p>
                </div>
              </div>

              {hasUploadedBefore || uploadSuccess ? (
                <div className="flex items-start gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-emerald-800 dark:text-emerald-300 text-xs font-medium w-full">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Provisional proof uploaded!</p>
                    <p className="text-[11px] text-muted-foreground/80 mt-0.5 leading-normal font-normal">
                      Your document has been submitted. Your school administrator is currently reviewing it to set up your subjects.
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
                          id="schedule-plans-doc-file"
                        />
                        <label
                          htmlFor="schedule-plans-doc-file"
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

      {/* Tab bar */}
      <div className="flex gap-1 border-b">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id as any)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === id
                ? 'border-gold text-gold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── This Week tab ── */}
      {tab === 'week' && (
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
            currentWeekEntries.map((entry: any, i: number) => (
              <Card key={i} className={entry.is_delivered ? 'border-emerald-200' : 'border-border'}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-full p-1 ${entry.is_delivered ? 'bg-emerald-100' : 'bg-muted'}`}>
                      {entry.is_delivered
                        ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        : <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{entry.topic}</p>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          Week {entry.week_number}
                        </Badge>
                        {entry.is_delivered ? (
                          <Badge className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700">
                            Delivered
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            Upcoming
                          </Badge>
                        )}
                      </div>
                      {(entry.subtopics as string[])?.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {(entry.subtopics as string[]).slice(0, 3).join(' · ')}
                        </p>
                      )}
                      {entry.duration_lessons && (
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {entry.duration_lessons} lesson{entry.duration_lessons > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className={`h-7 text-xs shrink-0 gap-1 font-semibold ${
                        entry.is_delivered 
                          ? 'bg-gold hover:bg-gold/90 text-gold-foreground' 
                          : 'bg-muted hover:bg-muted/80 text-foreground border border-border/80'
                      }`}
                      onClick={() => handleStudyThis(entry.id, entry.is_delivered, entry.subject, entry.topic)}
                      disabled={initiating && initiatingEntry === entry.id}
                    >
                      <Sparkles className="h-3 w-3" />
                      {initiating && initiatingEntry === entry.id ? '…' : entry.is_delivered ? 'Review' : 'Pre-study'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ── Timetable tab ── */}
      {tab === 'timetable' && (
        <div className="space-y-4">
          {/* Mode toggle */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="inline-flex rounded-lg border p-0.5 bg-muted/40">
              {(['open', 'guided', 'accelerated'] as StudyMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => handleSetMode(m)}
                  disabled={savingMode}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
                    mode === m
                      ? 'bg-background shadow-sm text-foreground'
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
            <p className="text-xs text-muted-foreground">
              {mode === 'open'
                ? "Today's required lessons — study them anytime"
                : mode === 'guided'
                  ? 'A timed timetable, paced to your goal'
                  : 'Move faster than the term schedule — finish topics early'}
            </p>
          </div>

          {/* Accelerated target */}
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

          {/* Nudge channels */}
          {mode === 'guided' && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Nudge me on:</span>
              {ALL_CHANNELS.map((c) => {
                const on = channels.includes(c.id)
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleChannel(c.id)}
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
          )}

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
              </CardContent>
            </Card>
          )}

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
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">{slot.topic}</p>
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
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{b.topic}</p>
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
                                <p className="text-xs text-muted-foreground">{slot.topic}</p>
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
      )}

      {/* ── Syllabus tab ── */}
      {tab === 'syllabus' && (
        <SyllabusTab data={pacingData} />
      )}

      {/* ── Attendance tab ── */}
      {tab === 'attendance' && (
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
            <div className="space-y-1.5">
              {[...attendance]
                .sort((a, b) => new Date(b.date ?? b.created_at ?? 0).getTime() - new Date(a.date ?? a.created_at ?? 0).getTime())
                .slice(0, 30)
                .map((record: any, i: number) => {
                  const Icon = ATTENDANCE_ICON[record.status] ?? CheckCircle2
                  const dateStr = record.date
                    ? format(new Date(record.date), 'EEE, MMM d')
                    : record.session?.date
                    ? format(new Date(record.session.date), 'EEE, MMM d')
                    : null
                  return (
                    <Card key={i}>
                      <CardContent className="py-2.5 px-4">
                        <div className="flex items-center gap-3">
                          <Icon className={`h-4 w-4 shrink-0 ${ATTENDANCE_COLOR[record.status] ?? 'text-muted-foreground'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium capitalize">{record.status}</p>
                            {(record.subject ?? record.session?.subject) && (
                              <p className="text-xs text-muted-foreground">{record.subject ?? record.session?.subject}</p>
                            )}
                          </div>
                          {dateStr && (
                            <p className="text-xs text-muted-foreground shrink-0">{dateStr}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}