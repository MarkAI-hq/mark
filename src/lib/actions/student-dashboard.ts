// src/lib/actions/student-dashboard.ts
'use server'

import { cookies } from 'next/headers'
import type { Citation } from '@/lib/types'

const API = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? ''

// ── Helper: forward the student JWT from cookies ───────────────────────────
async function authHeaders(): Promise<HeadersInit> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// ── Analytics ──────────────────────────────────────────────────────────────
export async function getStudentDashboard(studentId: string): Promise<{
  analytics:      StudentAnalytics | null
  currentProfile: StudentCognitiveProfile | null
}> {
  try {
    const headers = await authHeaders()

    const [analyticsRes, profileRes] = await Promise.all([
      fetch(`${API}/api/v1/analytics/student/${studentId}`,                   { headers, cache: 'no-store' }),
      fetch(`${API}/api/v1/cognitive/students/${studentId}/cognitive-profile`, { headers, cache: 'no-store' }),
    ])

    const analytics: StudentAnalytics | null = analyticsRes.ok
      ? await analyticsRes.json()
      : null

    const profileData = profileRes.ok ? await profileRes.json() : []
    const profiles: StudentCognitiveProfile[] = Array.isArray(profileData) ? profileData : []
    const currentProfile = profiles.find((p) => p.is_current) ?? profiles[0] ?? null

    return { analytics, currentProfile }
  } catch (err) {
    console.error('[getStudentDashboard]', err)
    return { analytics: null, currentProfile: null }
  }
}

// ── Submissions list ───────────────────────────────────────────────────────
export async function getStudentSubmissions(studentId: string): Promise<StudentSubmission[]> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API}/api/v1/submissions/student/${studentId}`, {
      headers,
      cache: 'no-store',
    })
    if (!res.ok) return []
    return res.json()
  } catch (err) {
    console.error('[getStudentSubmissions]', err)
    return []
  }
}

// ── Single submission detail ───────────────────────────────────────────────
export async function getSubmissionDetail(submissionId: string): Promise<SubmissionDetail | null> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API}/api/v1/submissions/${submissionId}`, {
      headers,
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch (err) {
    console.error('[getSubmissionDetail]', err)
    return null
  }
}

// ── Exam history with per-question detail ──────────────────────────────────
export async function getStudentExamHistory(studentId: string): Promise<ExamHistoryItem[]> {
  try {
    const submissions = await getStudentSubmissions(studentId)
    const graded = submissions.filter(
      (s) => s.grading_status === 'COMPLETED' || s.status === 'Graded',
    )

    const detailed = await Promise.all(
      graded.map(async (sub): Promise<ExamHistoryItem> => {
        const detail = await getSubmissionDetail(sub.submission_id)
        return {
          submission_id:    sub.submission_id,
          assessment_title: sub.assessment_title ?? sub.title ?? 'Assessment',
          graded_at:        sub.graded_at ?? sub.submitted_at ?? null,
          total_score:      detail?.total_score  ?? sub.total_score  ?? null,
          max_score:        detail?.max_score    ?? sub.max_score    ?? null,
          percentage_score: detail
            ? detail.max_score
              ? Math.round(((detail.total_score ?? 0) / detail.max_score) * 100)
              : 0
            : sub.percentage_score ?? null,
          original_submission_url: detail?.original_submission_url ?? null,
          annotated_script_url:    detail?.annotated_script_url    ?? null,
          responses: (detail?.responses ?? []).map((r) => ({
            response_id:           r.response_id,
            question_id:           r.question_id,
            student_answer:        r.student_answer        ?? '',
            points_earned:         r.points_earned         ?? null,
            max_points:            r.max_points            ?? null,
            teacher_feedback:      r.teacher_feedback      ?? null,
            ai_feedback:           r.ai_feedback           ?? null,
            blooms_level_achieved: r.blooms_level_achieved ?? null,
            identified_errors:     r.identified_errors     ?? [],
          })),
        }
      }),
    )

    return detailed.sort(
      (a, b) =>
        new Date(b.graded_at ?? 0).getTime() - new Date(a.graded_at ?? 0).getTime(),
    )
  } catch (err) {
    console.error('[getStudentExamHistory]', err)
    return []
  }
}

// ── Social proof ───────────────────────────────────────────────────────────
// ── Subject progress ───────────────────────────────────────────────────────
export async function getStudentSubjectProgress(studentId: string): Promise<SubjectProgress[]> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API}/api/v1/analytics/student/${studentId}/subject-progress`, {
      headers,
      cache: 'no-store',
    })
    if (!res.ok) return []
    return res.json()
  } catch (err) {
    console.error('[getStudentSubjectProgress]', err)
    return []
  }
}

export async function getStudentSocialProof(studentId: string): Promise<SocialProof | null> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API}/api/v1/analytics/student/${studentId}/social-proof`, {
      headers,
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch (err) {
    console.error('[getStudentSocialProof]', err)
    return null
  }
}

// ── Holistic leaderboard ────────────────────────────────────────────────────
export type LeaderboardMetric = 'overall' | 'performance' | 'activity' | 'streak'

export interface LeaderboardBreakdown {
  performance:  number
  activity:     number
  consistency:  number
  growth:       number
}

export interface LeaderboardEntry {
  rank:              number
  student_id:        string
  name:              string
  student_school_id: string | null
  is_me:             boolean
  mirror_score:      number
  avg_score:         number
  plans_completed:   number
  streak:            number
  trajectory:        string | null
  badge_count:       number
  breakdown:         LeaderboardBreakdown
}

export interface LeaderboardMe {
  rank:            number
  percentile:      number | null
  mirror_score:    number
  avg_score:       number
  plans_completed: number
  streak:          number
  trajectory:      string | null
  badge_count:     number
  breakdown:       LeaderboardBreakdown
}

export interface LeaderboardResult {
  scope:       'class' | 'school'
  metric:      LeaderboardMetric
  cohort_size: number
  me:          LeaderboardMe | null
  top:         LeaderboardEntry[]
  around_me:   LeaderboardEntry[]
}

const EMPTY_LEADERBOARD = (scope: 'class' | 'school', metric: LeaderboardMetric): LeaderboardResult => ({
  scope, metric, cohort_size: 0, me: null, top: [], around_me: [],
})

export async function getLeaderboard(
  scope: 'class' | 'school' = 'class',
  metric: LeaderboardMetric = 'overall',
): Promise<LeaderboardResult> {
  try {
    const headers = await authHeaders()
    const res = await fetch(
      `${API}/api/v1/analytics/leaderboard?scope=${scope}&metric=${metric}`,
      { headers, cache: 'no-store' },
    )
    if (!res.ok) return EMPTY_LEADERBOARD(scope, metric)
    return res.json()
  } catch (err) {
    console.error('[getLeaderboard]', err)
    return EMPTY_LEADERBOARD(scope, metric)
  }
}

// ── Learning toolkits ──────────────────────────────────────────────────────
export async function getStudentLearningTools(studentId: string): Promise<LearningTool[]> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API}/api/v1/cognitive/students/${studentId}/recommended-tools`, {
      headers,
      cache: 'no-store',
    })
    if (!res.ok) return []
    return res.json()
  } catch (err) {
    console.error('[getStudentLearningTools]', err)
    return []
  }
}

// ── Study plans ───────────────────────────────────────────────────────────
export async function getStudentStudyPlans(studentId: string): Promise<StudyPlan[]> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API}/api/v1/study-plans/student/${studentId}`, {
      headers,
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : (data.data ?? [])
  } catch (err) {
    console.error('[getStudentStudyPlans]', err)
    return []
  }
}

// ── Prediction ────────────────────────────────────────────────────────────────
export async function getStudentPredictions(studentId: string): Promise<StudentPrediction[]> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API}/api/v1/prediction/students/${studentId}/all`, {
      headers,
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : [])
  } catch (err) {
    console.error('[getStudentPredictions]', err)
    return []
  }
}

// ── Next-Best-Action (total mental clarity) ─────────────────────────────────────
export interface NextActionGoalState {
  subject: string
  predicted_grade: string | null
  predicted_score: number | null
  goal_grade: string | null
  milestone_label: string | null
  weeks_to_exam: number | null
  gap_to_next_grade: number | null
  next_grade: string | null
  is_passing: boolean | null
  goal_reached: boolean
}

export interface NextAction {
  action: {
    type: 'study'
    subject: string
    topic: string
    sow_entry_id: string
    lesson_type: string
    estimated_minutes: number
  } | null
  why: string
  outcome_if_done: string | null
  goal_state: NextActionGoalState | null
  cta?: { label: string; href: string }
}

export async function getNextAction(): Promise<NextAction | null> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API}/api/v1/students/me/next-action`, {
      headers,
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    return (data?.data ?? data) as NextAction
  } catch (err) {
    console.error('[getNextAction]', err)
    return null
  }
}

// ── Class SoW ─────────────────────────────────────────────────────────────────
export async function getMyClassSoW(): Promise<{
  sow: any | null
  currentWeekEntries: any[]
  classId: string | null
  /** True when the request itself failed (network/server error) rather than
   *  the student genuinely having no class yet — every page gating on
   *  `classId === null` needs this to avoid telling a student their account
   *  is "pending approval" when the real problem is a service outage. */
  fetchFailed?: boolean
}> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API}/api/v1/scheme-of-work/my-class`, {
      headers,
      cache: 'no-store',
    })
    if (!res.ok) return { sow: null, currentWeekEntries: [], classId: null, fetchFailed: true }
    return res.json()
  } catch (err) {
    console.error('[getMyClassSoW]', err)
    return { sow: null, currentWeekEntries: [], classId: null, fetchFailed: true }
  }
}

// ── Timetable ─────────────────────────────────────────────────────────────────
export async function getMyClassTimetable(params?: { term?: string; academic_year?: string }): Promise<any[]> {
  try {
    const headers = await authHeaders()
    const qs = new URLSearchParams()
    if (params?.term) qs.set('term', params.term)
    if (params?.academic_year) qs.set('academic_year', params.academic_year)
    const url = `${API}/api/v1/timetable/my-class${qs.toString() ? '?' + qs.toString() : ''}`
    const res = await fetch(url, { headers, cache: 'no-store' })
    if (!res.ok) return []
    return res.json()
  } catch (err) {
    console.error('[getMyClassTimetable]', err)
    return []
  }
}

// ── Attendance ────────────────────────────────────────────────────────────────
export async function getMyAttendance(studentId: string): Promise<any[]> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API}/api/v1/attendance/students/${studentId}`, {
      headers,
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : (data.records ?? [])
  } catch (err) {
    console.error('[getMyAttendance]', err)
    return []
  }
}

// ── Classmates ────────────────────────────────────────────────────────────────
export async function getMyClassmates(): Promise<{
  classmates: { user_id: string; name: string; student_school_id: string | null; is_me: boolean }[]
  class_id: string | null
  org_name: string | null
  school_code: string | null
}> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API}/api/v1/students/classmates`, {
      headers,
      cache: 'no-store',
    })
    if (!res.ok) return { classmates: [], class_id: null, org_name: null, school_code: null }
    return res.json()
  } catch (err) {
    console.error('[getMyClassmates]', err)
    return { classmates: [], class_id: null, org_name: null, school_code: null }
  }
}

// ── Self-initiate study plan from SoW entry ───────────────────────────────────
export async function selfInitiateStudyPlan(sowEntryId: string): Promise<{
  data: { plan_id: string; plan: any } | null
  error: { message: string } | null
}> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API}/api/v1/study-plans/self-initiate`, {
      method:  'POST',
      headers,
      body:    JSON.stringify({ sow_entry_id: sowEntryId }),
      cache:   'no-store',
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to initiate study plan' }))
      return { data: null, error: { message: err.message ?? 'Failed to initiate study plan' } }
    }
    const plan = await res.json()
    return { data: { plan_id: plan.id ?? plan.plan_id, plan }, error: null }
  } catch (err: any) {
    return { data: null, error: { message: err.message ?? 'Failed to initiate study plan' } }
  }
}

// ── Free-initiate study plan (no SoW entry required) ─────────────────────────
export async function initiateFreeStudyPlan(
  subject: string,
  topic: string,
  lessonType?: string,
): Promise<{
  data: { plan_id: string; plan: any } | null
  error: { message: string } | null
}> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API}/api/v1/study-plans/initiate-free`, {
      method:  'POST',
      headers,
      body:    JSON.stringify({ subject, topic, lesson_type: lessonType ?? 'consolidation' }),
      cache:   'no-store',
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to initiate study plan' }))
      return { data: null, error: { message: err.message ?? 'Failed to initiate study plan' } }
    }
    const data = await res.json()
    return { data: { plan_id: data.plan_id ?? data.plan?.id, plan: data.plan }, error: null }
  } catch (err: any) {
    return { data: null, error: { message: err.message ?? 'Failed to initiate study plan' } }
  }
}

// ── Org welcome pack config ───────────────────────────────────────────────────
export interface WelcomePackConfig {
  is_enabled?:        boolean
  pack_name?:         string
  description?:       string
  cover_image_url?:   string
  contents?:          string[]
  pack_price_usd?:    number
}

export async function getMyOrgWelcomePackConfig(orgId: string): Promise<WelcomePackConfig | null> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API}/api/v1/organizations/${orgId}`, {
      headers,
      cache: 'no-store',
    })
    if (!res.ok) return null
    const org = await res.json()
    return org.welcome_pack_config ?? null
  } catch (err) {
    console.error('[getMyOrgWelcomePackConfig]', err)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface StudyPlanContent {
  lesson_type:        string
  topic:              string
  subject:            string
  introduction:       string
  explanation:        string
  worked_example:     string
  practice_questions: { question: string; answer: string }[]
  summary:            string
  estimated_minutes:  number
  sources_consulted?: Citation[]
  grounded?:          boolean
}

export interface StudyPlan {
  id:               string
  student_id:       string
  organization_id:  string
  scheme_entry_id:  string | null
  lesson_type:      'pre_class' | 'catch_up' | 'gap_closure' | 'exam_prep' | 'consolidation' | 'reteach'
  subject:          string
  topic:            string
  content:          StudyPlanContent
  scheduled_for:    string
  delivery_channel: string
  status:           'pending' | 'sent' | 'completed' | 'skipped'
  completed_at:     string | null
  score_after:      number | null
  next_review_date: string | null
  createdAt:        string
}

export interface StudentAnalytics {
  studentId?:         string
  totalSubmissions?:  number
  averageScore?:      number
  averagePercentage?: number
  bloomDistribution?: BloomDistribution[]
  errorDistribution?: ErrorDistribution[]
  scoreHistory?:      ScoreHistoryItem[]
  // snake_case from API
  total_submissions?:  number
  average_percentage?: number
  bloom_distribution?: BloomDistribution[]
  error_distribution?: ErrorDistribution[]
  score_history?:      ScoreHistoryItem[]
}

export interface BloomDistribution {
  level_code:  string
  level_name:  string
  count:       number
  percentage:  number
}

export interface ErrorDistribution {
  error_code:  string
  error_name:  string
  count:       number
  percentage:  number
}

export interface ScoreHistoryItem {
  assessmentTitle?: string
  assessment_title?: string
  score?:           number
  maxScore?:        number
  max_score?:       number
  percentage?:      number
  gradedAt?:        string
  graded_at?:       string
}

export interface StudentCognitiveProfile {
  student_profile_id:      string
  student_id:              string
  primary_profile_id:      string | null
  profile_scores:          Record<string, number> | null
  mental_energy_score:     number
  learning_strategy_score: number
  assessment_date:         string
  is_current:              boolean
  notes:                   string | null
  profile_name:            string | null
  profile_description:     string | null
  profile_focus:           string | null
  tools?:                  LearningTool[]
}

export interface LearningTool {
  id:          string
  name:        string
  description: string
  how_to:      string | null
}

export interface StudentSubmission {
  submission_id:     string
  assessment_id:     string
  student_id:        string
  grading_status?:   string
  status?:           string
  total_score?:      number | null
  max_score?:        number | null
  percentage_score?: number | null
  submitted_at?:     string | null
  graded_at?:        string | null
  assessment_title?: string
  title?:            string
}

export interface StudentResponse {
  response_id:           string
  question_id:           string
  student_answer:        string
  points_earned:         number | null
  max_points:            number | null
  teacher_feedback:      string | null
  ai_feedback:           string | null
  blooms_level_achieved: string | null
  identified_errors:     string[]
}

export interface SubmissionDetail {
  submission_id:            string
  assessment_id:            string
  student_id:               string
  grading_status?:          string
  status?:                  string
  total_score?:             number | null
  max_score?:               number | null
  submitted_at?:            string | null
  graded_at?:               string | null
  original_submission_url?: string | null
  annotated_script_url?:    string | null
  responses:                StudentResponse[]
}

export interface ExamHistoryItem {
  submission_id:            string
  assessment_title:         string
  graded_at:                string | null
  total_score:              number | null
  max_score:                number | null
  percentage_score:         number | null
  original_submission_url?: string | null
  annotated_script_url?:    string | null
  responses:                StudentResponse[]
}

export interface SocialProof {
  rank_percentile:           number | null
  peers_completed_this_week: number
  student_avg:               number
}

export interface SubjectProgress {
  subject:          string
  assessment_count: number
  avg_percentage:   number
  latest_score:     number
  mastery_label:    'strong' | 'developing' | 'at_risk' | 'critical'
}

export interface StudentPrediction {
  student_id:         string
  curriculum_id:      string
  subject:            string
  exam_body?:         string
  predicted_score:    number
  predicted_grade:    string
  predicted_label:    string
  is_passing:         boolean
  confidence:         number
  trajectory:         'improving' | 'steady' | 'declining'
  trajectory_delta:   number
  weeks_to_exam?:     number
  gap_to_next_grade:  number
  next_grade:         string
  next_grade_label:   string
  topic_performance?: { topic: string; status: string; student_mastery: number; curriculum_weight: number }[]
  pathway?:           { action: string; urgency: string }[]
  motivational_message?: string
  based_on_submissions: number
  last_calculated:    string
  exam_level?:        string
  initial_predicted_score?: number
  // The assessment milestone this prediction targets (end-of-term / national exam).
  milestone_type?:    string
  milestone_label?:   string
}

// ── Tracy: generate study plan from student note sources ─────────────────────
export async function generateStudyPlanFromSources(
  subject: string,
  topic: string,
  type: 'flashcards' | 'quiz' | 'slide_deck' | 'study_guide',
  sourceNoteIds: string[],
): Promise<{
  data: { plan_id: string; plan: any } | null
  error: { message: string } | null
}> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API}/api/v1/study-plans/generate-from-sources`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ subject, topic, type, source_note_ids: sourceNoteIds }),
      cache: 'no-store',
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Generation failed' }))
      return { data: null, error: { message: err.message ?? 'Generation failed' } }
    }
    const data = await res.json()
    return { data: { plan_id: data.plan_id ?? data.plan?.id, plan: data.plan }, error: null }
  } catch (err: any) {
    return { data: null, error: { message: err.message ?? 'Generation failed' } }
  }
}

// ── Tracy: generate audio overview from student note sources ─────────────────
export async function generateAudioOverview(
  subject: string,
  topic: string,
  sourceNoteIds: string[],
): Promise<{
  data: { audio_url: string | null } | null
  error: { message: string } | null
}> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API}/api/v1/study-plans/generate-audio-overview`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ subject, topic, source_note_ids: sourceNoteIds }),
      cache: 'no-store',
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Audio generation failed' }))
      return { data: null, error: { message: err.message ?? 'Audio generation failed' } }
    }
    const data = await res.json()
    return { data: { audio_url: data.audio_url ?? null }, error: null }
  } catch (err: any) {
    return { data: null, error: { message: err.message ?? 'Audio generation failed' } }
  }
}

// ── Rename a study plan artifact ──────────────────────────────────────────────
export async function renameArtifact(
  planId: string,
  title: string,
): Promise<void> {
  try {
    const headers = await authHeaders()
    await fetch(`${API}/api/v1/study-plans/${planId}/meta`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ title }),
      cache: 'no-store',
    })
  } catch {}
}

// ── Fire a bell notification when an artifact finishes on a hidden tab ────────
export async function createArtifactNotification(
  artifactTitle: string,
): Promise<void> {
  try {
    const headers = await authHeaders()
    await fetch(`${API}/api/v1/notifications`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'ARTIFACT_READY',
        title: 'Content ready',
        message: `${artifactTitle} has been generated.`,
        metadata: { href: '/student/knowledge-base' },
      }),
      cache: 'no-store',
    })
  } catch {}
}

// ── Curriculum Pacing Board ───────────────────────────────────────────────────

export interface PacingEntry {
  id:                string
  week_number:       number
  topic:             string
  subtopics:         string[]
  duration_lessons:  number
  is_delivered:      boolean
  is_due:            boolean
  is_behind:         boolean
  student_mastery:   number | null
  plan_count:        number
  curriculum_weight: number | null
  national_average:  number | null
  status:            'strong' | 'developing' | 'at_risk' | null
}

export interface PacingSummary {
  total_topics:          number
  topics_due:            number
  mastered:              number
  developing:            number
  at_risk:               number
  not_studied:           number
  not_due_yet:           number
  coverage_pct_actual:   number
  coverage_pct_expected: number
  pacing_gap:            number
  plans_per_week_needed: number
  projected_coverage:    number
  exam_weight_mastered:  number
}

export interface PacingScheme {
  scheme_id:       string
  subject:         string
  grade_level:     string
  term:            string
  term_start_date: string
  total_weeks:     number
  current_week:    number | null
  weeks_remaining: number | null
  is_active:       boolean
  entries:         PacingEntry[]
  summary:         PacingSummary | null
  bloom_distribution: Record<string, number> | null
}

export interface PacingResponse {
  has_sow:         boolean
  schemes:         PacingScheme[]
  fallback_topics?: Array<{ topic: string; subject: string; plan_count: number; avg_score: number | null }>
}

export async function getMyPacingData(): Promise<PacingResponse> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${API}/api/v1/students/me/curriculum-pacing`, {
      headers,
      cache: 'no-store',
    })
    if (!res.ok) return { has_sow: false, schemes: [] }
    return res.json()
  } catch {
    return { has_sow: false, schemes: [] }
  }
}