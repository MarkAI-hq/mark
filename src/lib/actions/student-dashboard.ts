// src/lib/actions/student-dashboard.ts
'use server'

import { cookies } from 'next/headers'

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
}

export interface StudyPlan {
  id:               string
  student_id:       string
  organization_id:  string
  scheme_entry_id:  string | null
  lesson_type:      'pre_class' | 'catch_up' | 'gap_closure' | 'exam_prep' | 'consolidation'
  subject:          string
  topic:            string
  content:          StudyPlanContent
  scheduled_for:    string
  delivery_channel: string
  status:           'pending' | 'sent' | 'completed' | 'skipped'
  completed_at:     string | null
  score_after:      number | null
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