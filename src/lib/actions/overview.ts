'use server'

import { fetcher } from '@/lib/fetch'

export interface ClassAttendanceSummary {
  class_id:                string
  total_sessions:          number
  overall_attendance_rate: number | null
  at_risk_students:        { student_id: string; name: string; attendance_rate: number }[]
  student_summaries:       { student_id: string; name: string; attendance_rate: number | null; present_count: number; total_count: number }[]
  recent_sessions:         { id: string; date: string; present_count: number; absent_count: number; total_records: number }[]
}

export interface ClassSowStatus {
  class_id:    string
  class_name?: string
  sow_id:      string | null
  subject:     string | null
  term:        string | null
  total_weeks: number
  delivered:   number
  pending:     number
  skipped:     number
}

export interface StudyPlanClassSummary {
  students: {
    student_id:      string
    name:            string
    pending_count:   number
    completed_count: number
    total_plans:     number
    last_dispatched: string | null
  }[]
}

export async function getClassAttendanceSummary(classId: string) {
  return fetcher<ClassAttendanceSummary>(`/attendance/classes/${classId}/summary`)
}

export async function getClassSowStatus(classId: string) {
  return fetcher<{ sow: any; entries: any[] }>(`/scheme-of-work/class/${classId}/active`)
}

export async function getStudyPlanClassSummary(classId: string) {
  return fetcher<StudyPlanClassSummary>(`/study-plans/class/${classId}/summary`)
}

export async function triggerStudyPlanDispatch(classId: string, studentId?: string) {
  return fetcher<{ queued: boolean; type: string }>('/study-plans/dispatch', {
    method: 'POST',
    body: JSON.stringify({ class_id: classId, ...(studentId && { student_id: studentId }) }),
  })
}
