'use server'

import { revalidatePath } from 'next/cache'
import { fetcher } from '@/lib/fetch'
import type { StudyPlan } from '@/lib/actions/student-dashboard'

// ── Types ──────────────────────────────────────────────────────────────────

export interface SuggestedTopicEntry {
  id: string
  topic: string
  subject: string
  week_number: number
  learning_objectives: string[]
}

export interface SuggestedTopicResponse {
  entry: SuggestedTopicEntry
  reason: string
  action: 'self_initiate' | 'pre_class'
  lesson_type: string
}

export type StudyMode = 'open' | 'guided' | 'accelerated'
export type NudgeChannel = 'in_app' | 'email' | 'whatsapp' | 'sms'

export interface PacingBlock {
  day_of_week: string
  period: number | null
  start_time: string | null
  end_time: string | null
  subject: string
  topic: string
  sow_entry_id: string
  scheme_id: string
  curriculum_id: string | null
  lesson_type: string
  mastery_state: 'new' | 'in_progress' | 'behind' | 'mastered'
  estimated_minutes: number
  pacing_reason: string
  type: 'study'
  source: 'sow'
}

export interface PacingSubjectSummary {
  subject: string
  scheme_id: string
  curriculum_id: string | null
  weeks_remaining: number | null
  effective_weeks_remaining: number | null
  remaining_lessons: number
  required_blocks_per_week: number
  scheduled_blocks: number
  status: 'on_track' | 'behind' | 'ahead'
  current_topic: string | null
  milestone_label: string
  shortfall: number
}

export interface ResolvedMilestone {
  type: string
  label: string
  weeks_remaining: number | null
  is_exit_level: boolean
  is_terminal: boolean
}

export interface StudyScheduleResponse {
  mode?: StudyMode
  period_grid_source?: 'physical' | 'default'
  days?: Array<{ day_of_week: string; blocks: PacingBlock[] }>
  pacing_summary?: PacingSubjectSummary[]
  milestone?: ResolvedMilestone | null
  physical_slots: any[]
  study_slots: Array<{
    day_of_week: string
    start_time: string
    end_time: string
    subject: string
    topic: string
    type: 'study'
    source: 'sow'
    sow_entry_id: string
    estimated_minutes: number
  }>
  has_physical_timetable: boolean
}

// ── Student-facing actions ─────────────────────────────────────────────────

export async function getMyStudyPlans(status?: string) {
  const params = status ? `?status=${status}` : ''
  return fetcher<StudyPlan[]>(`/study-plans/my${params}`)
}

export async function getStudyPlan(planId: string) {
  return fetcher<StudyPlan>(`/study-plans/${planId}`)
}

export interface MarkCompletePayload {
  score_after?: number
  scene_responses?: { type: string; correct?: boolean; score?: number }[]
  outcomes_achieved?: string[]
}

export async function markStudyPlanComplete(
  planId: string,
  payload?: MarkCompletePayload,
) {
  const res = await fetcher<{
    plan: StudyPlan
    prediction: { predicted_grade: string | null; trajectory: string | null } | null
  }>(
    `/study-plans/${planId}/complete`,
    { method: 'PATCH', body: JSON.stringify(payload ?? {}) },
  )
  if (!res.error) {
    revalidatePath('/student/study-plans')
    revalidatePath('/student/dashboard')
    revalidatePath('/student/grades')
  }
  return res
}

export interface PaceSettings {
  student_id: string
  lessons_per_day: number
  preferred_reminder_time: string
  reminder_enabled: boolean
  study_mode?: StudyMode
  nudge_channels?: NudgeChannel[]
  study_days?: number[]
  acceleration_weeks?: number | null
}

export async function getStudentPaceSettings(studentId: string) {
  return fetcher<PaceSettings>(`/students/${studentId}/pace-settings`)
}

export async function updateStudentPaceSettings(
  studentId: string,
  data: {
    lessons_per_day: number
    preferred_reminder_time: string
    reminder_enabled: boolean
    study_mode?: StudyMode
    nudge_channels?: NudgeChannel[]
    study_days?: number[]
    weekly_target_hours?: number
    daily_target_overrides?: Record<string, number>
    acceleration_weeks?: number
  },
) {
  const res = await fetcher<PaceSettings>(`/students/${studentId}/pace-settings`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  if (!res.error) revalidatePath('/student/schedule')
  return res
}

// ── WS5 weekly-target rolling timetable ─────────────────────────────────────

export interface PlannedLesson {
  subject: string
  scheme_id: string
  sow_entry_id: string | null
  topic: string
  lesson_type: string
  estimated_minutes: number
}

export interface DailyPlan {
  id: string
  plan_date: string
  target_minutes: number
  carried_in_minutes: number
  logged_minutes: number
  planned_lessons: PlannedLesson[]
  status: 'pending' | 'partial' | 'complete' | 'missed'
}

export interface RollingWindow {
  has_weekly_target: boolean
  weekly_target_hours: number | null
  study_days: number[]
  yesterday: DailyPlan | null
  today: DailyPlan | null
  tomorrow: DailyPlan | null
  week: DailyPlan[]
}

export async function getRollingSchedule() {
  return fetcher<RollingWindow>('/timetable/rolling', { cache: 'no-store' })
}

export async function logStudyMinutes(minutes: number, planDate?: string) {
  const res = await fetcher<DailyPlan>('/timetable/log-minutes', {
    method: 'POST',
    body: JSON.stringify({ minutes, ...(planDate ? { plan_date: planDate } : {}) }),
  })
  if (!res.error) revalidatePath('/student/schedule')
  return res
}

// ── Teacher / Admin actions ────────────────────────────────────────────────

export async function dispatchStudyPlans(classId: string, studentId?: string) {
  return fetcher<{ queued: boolean; type: string; class_id?: string; student_id?: string }>(
    '/study-plans/dispatch',
    {
      method: 'POST',
      body: JSON.stringify({ class_id: classId, ...(studentId ? { student_id: studentId } : {}) }),
    },
  )
}

export async function getClassStudyPlanSummary(classId: string) {
  return fetcher<{
    students: {
      student_id:      string
      name:            string
      pending_count:   number
      completed_count: number
      total_plans:     number
      buffer_count:    number
      lessons_per_day: number
      last_dispatched: string | null
    }[]
  }>(`/study-plans/class/${classId}/summary`)
}

export async function getStudentStudyPlansTeacher(studentId: string, status?: string) {
  const params = status ? `?status=${status}` : ''
  return fetcher<StudyPlan[]>(`/study-plans/student/${studentId}${params}`)
}

export async function dispatchManualPlan(data: {
  student_id: string
  class_id: string
  topic: string
  lesson_type?: string
  teacher_notes?: string
}) {
  return fetcher<{ queued: boolean; plan: import('@/lib/actions/student-dashboard').StudyPlan }>(
    '/study-plans/manual',
    { method: 'POST', body: JSON.stringify(data) },
  )
}

export async function getTeacherStudyPlansOverview() {
  return fetcher<{
    dispatched_today: number
    completed_today: number
    completion_rate: number
    reviews_due: number
  }>('/study-plans/overview')
}

export async function getSuggestedTopic() {
  return fetcher<SuggestedTopicResponse | null>('/study-plans/suggested-topic')
}

export async function checkInStudySession() {
  return fetcher<{ already_checked_in: boolean; streak_days: number }>(
    '/study-plans/check-in',
    { method: 'POST' },
  )
}

export async function getStudySchedule(mode?: StudyMode) {
  const qs = mode ? `?mode=${mode}` : ''
  return fetcher<StudyScheduleResponse>(`/timetable/study-schedule${qs}`)
}

export async function selfInitiateFromEntry(sowEntryId: string) {
  return fetcher<{ plan: StudyPlan }>(
    '/study-plans/self-initiate',
    { method: 'POST', body: JSON.stringify({ sow_entry_id: sowEntryId }) },
  )
}

export async function initiateFreeStudyPlan(
  subject: string,
  topic: string,
  lesson_type = 'consolidation',
) {
  return fetcher<{ plan_id: string; plan: StudyPlan }>(
    '/study-plans/initiate-free',
    { method: 'POST', body: JSON.stringify({ subject, topic, lesson_type }) },
  )
}

export interface OutcomeMasteryRow {
  curriculum_ref: string
  outcome_text: string
  achieved_count: number
  attempted_count: number
  mastery_pct: number
  last_attempted_at: string | null
}

export async function getMyOutcomeMastery() {
  return fetcher<Record<string, OutcomeMasteryRow[]>>('/study-plans/my-outcome-mastery')
}

export async function getClassOutcomeMastery(classId: string) {
  return fetcher<{
    curriculum_ref: string
    outcome_text: string
    subject: string
    student_count: number
    class_achieved_pct: number
    students_achieved: number
    students_struggling: number
  }[]>(`/study-plans/class/${classId}/outcome-mastery`)
}

// ── Living Gradebook ───────────────────────────────────────────────────────

export type NcdcLevel = 'all' | 'some' | 'none'

export interface GradeBand {
  label: string
  minPct: number
  points: number
  descriptor: string
}

export interface GradingScale {
  grades: GradeBand[]
  passMark: string
  assessmentWeights: { continuous: number; exam: number }
}

export interface GradebookTopic {
  entry_id: string
  topic: string
  week_number: number
  achievement: NcdcLevel
  sow_entry_id: string
  has_plan: boolean
}

export interface SubjectGradebook {
  subject: string
  grade_level: string
  scheme_id: string
  mastery_pct: number | null
  continuous_score: number | null
  exam_score: number | null
  grade_band: GradeBand | null
  grade_points: number | null
  is_passing: boolean
  trend_delta: number | null
  triangulation: {
    observation: NcdcLevel | null
    product: NcdcLevel | null
    conversation: NcdcLevel | null
  }
  topics: GradebookTopic[]
  activity_weeks: { week: number; count: number }[]
  plans_completed: number
  assessment_count: number
  last_active_at: string | null
  class_avg_pct: number | null
  class_top_pct: number | null
  class_bottom_pct: number | null
  class_percentile: number | null
  score_distribution: { range: string; count: number }[]
}

export interface GradebookResponse {
  scale: GradingScale
  term: {
    label: string
    academic_year: string
    total_weeks: number
    current_week: number
  } | null
  subjects: SubjectGradebook[]
  no_enrollment?: boolean
}

export async function getMyGradebook() {
  return fetcher<GradebookResponse>('/study-plans/gradebook')
}

// Teacher/admin: fetch a specific student's gradebook (same shape as getMyGradebook).
export async function getStudentGradebook(studentId: string) {
  return fetcher<GradebookResponse>(`/study-plans/student/${studentId}/gradebook`)
}
