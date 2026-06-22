'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CalendarDays, CheckCircle2, AlertCircle, Clock,
  BookOpen, UserCheck, XCircle, MinusCircle, Sparkles,
  Target, TrendingUp, Unlock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { selfInitiateStudyPlan, type PacingResponse } from '@/lib/actions/student-dashboard'
import {
  updateStudentPaceSettings,
  type StudyScheduleResponse,
  type StudyMode,
  type NudgeChannel,
  type PaceSettings,
  type PacingSubjectSummary,
} from '@/lib/actions/study-plans'
import { SyllabusTab } from './syllabus-tab'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
const DAY_LABEL: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri',
}

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
}

export function ScheduleClient({
  user, sow, currentWeekEntries, timetable, attendance, pacingData, studySchedule, paceSettings, activeTab: initialTab,
}: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'week' | 'timetable' | 'attendance' | 'syllabus'>(
    initialTab as any ?? 'week',
  )
  const [initiating, startInitiate] = useTransition()
  const [initiatingEntry, setInitiatingEntry] = useState<string | null>(null)

  // Open vs Guided Pace — same curriculum-required content, the difference is
  // only whether times are fixed. Persisted to pace settings.
  const mode: StudyMode = studySchedule.mode ?? paceSettings.study_mode ?? 'open'
  const [savingMode, startSaveMode] = useTransition()
  const studentId = user?.user_id ?? user?.id

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

  function handleStudyThis(entryId: string) {
    setInitiatingEntry(entryId)
    startInitiate(async () => {
      const { data, error } = await selfInitiateStudyPlan(entryId)
      setInitiatingEntry(null)
      if (error) {
        toast.error(error.message)
        return
      }
      if (data?.plan_id) {
        toast.success('Study plan created!')
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
                        {entry.is_delivered && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700">
                            Delivered
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
                    {entry.is_delivered && (
                      <Button
                        size="sm"
                        className="h-7 text-xs shrink-0 gap-1 bg-gold hover:bg-gold/90 text-gold-foreground"
                        onClick={() => handleStudyThis(entry.id)}
                        disabled={initiating && initiatingEntry === entry.id}
                      >
                        <Sparkles className="h-3 w-3" />
                        {initiating && initiatingEntry === entry.id ? '…' : 'Study This'}
                      </Button>
                    )}
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
          {/* Mode toggle: Open (no clock) vs Guided Pace (timetabled). Same
              required content either way — only the times differ. */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="inline-flex rounded-lg border p-0.5 bg-muted/40">
              {(['open', 'guided'] as StudyMode[]).map((m) => (
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
                  {m === 'open' ? <Unlock className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  {m === 'open' ? 'Open' : 'Guided Pace'}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {mode === 'open'
                ? "Today's required lessons — study them anytime"
                : 'A timed timetable, paced to your goal'}
            </p>
          </div>

          {/* Nudge channels — only Guided Pace is actively tracked. */}
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

          {/* Pacing banner — exact numbers toward the resolved milestone. */}
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
                    {guidedByDay[day].map((slot: any, i: number) => (
                      <Card key={i} className={slot.kind === 'study' ? 'border-dashed border-gold/40 bg-gold/3' : ''}>
                        <CardContent className="py-2.5 px-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="text-xs text-muted-foreground tabular-nums w-20 shrink-0">
                                {slot.start_time} – {slot.end_time}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{slot.subject}</p>
                                {slot.kind === 'study' && slot.topic && (
                                  <p className="text-xs text-muted-foreground truncate">{slot.topic}</p>
                                )}
                                {slot.kind === 'class' && slot.room && (
                                  <p className="text-xs text-muted-foreground">{slot.room}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {slot.kind === 'study' ? (
                                <Button
                                  size="sm"
                                  className="h-7 text-xs gap-1 bg-gold hover:bg-gold/90 text-gold-foreground"
                                  onClick={() => handleStudyThis(slot.sow_entry_id)}
                                  disabled={initiating && initiatingEntry === slot.sow_entry_id}
                                >
                                  <Sparkles className="h-3 w-3" />
                                  {initiating && initiatingEntry === slot.sow_entry_id ? '…' : 'Study'}
                                </Button>
                              ) : slot.period ? (
                                <Badge variant="outline" className="text-[10px]">P{slot.period}</Badge>
                              ) : null}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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
                      <Card key={i} className="border-dashed border-gold/40 bg-gold/3">
                        <CardContent className="py-2.5 px-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{b.subject}</p>
                              <p className="text-xs text-muted-foreground truncate">{b.topic}</p>
                            </div>
                            <Button
                              size="sm"
                              className="h-7 text-xs gap-1 shrink-0 bg-gold hover:bg-gold/90 text-gold-foreground"
                              onClick={() => handleStudyThis(b.sow_entry_id)}
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
                    attendancePct >= 80 ? 'text-emerald-600' : attendancePct >= 60 ? 'text-amber-600' : 'text-rose-600'
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
