'use server'

import { revalidatePath } from 'next/cache'
import { fetcher } from '@/lib/fetch'

export interface AttendanceSession {
  id: string
  class_id: string
  organization_id: string
  date: string
  period: number | null
  subject: string | null
  notes: string | null
  created_by: string
  createdAt: string
  updatedAt: string
  present_count: number
  absent_count: number
  late_count: number
  excused_count: number
  total_records: number
}

export interface StudentAttendanceEntry {
  student_id: string
  first_name: string
  last_name: string
  email: string
  status: 'present' | 'absent' | 'late' | 'excused' | null
  record_id: string | null
  notes: string | null
}

export interface SessionDetail {
  session: AttendanceSession
  students: StudentAttendanceEntry[]
}

export interface AttendanceRecord {
  id: string
  session_id: string
  student_id: string
  status: 'present' | 'absent' | 'late' | 'excused'
  notes: string | null
}

export interface AttendanceSummary {
  class_id: string
  total_sessions: number
  overall_attendance_rate: number | null
  recent_sessions: AttendanceSession[]
  student_summaries: {
    student_id: string
    name: string
    email: string
    present_count: number
    total_count: number
    attendance_rate: number | null
  }[]
  at_risk_students: {
    student_id: string
    name: string
    email: string
    attendance_rate: number | null
  }[]
}

export async function getAttendanceSessions(classId: string) {
  return fetcher<AttendanceSession[]>(`/attendance/sessions?class_id=${classId}`)
}

export async function getAttendanceSession(sessionId: string) {
  return fetcher<SessionDetail>(`/attendance/sessions/${sessionId}`)
}

export async function createAttendanceSession(data: {
  class_id: string
  date: string
  period?: number
  subject?: string
  notes?: string
}) {
  const res = await fetcher<AttendanceSession>('/attendance/sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.error) {
    revalidatePath(`/dashboard/teacher/classes/${data.class_id}/attendance`)
  }
  return res
}

export async function submitAttendance(
  sessionId: string,
  classId: string,
  records: { student_id: string; status: 'present' | 'absent' | 'late' | 'excused'; notes?: string }[],
) {
  const res = await fetcher<AttendanceRecord[]>(`/attendance/sessions/${sessionId}/records`, {
    method: 'POST',
    body: JSON.stringify({ records }),
  })
  if (!res.error) {
    revalidatePath(`/dashboard/teacher/classes/${classId}/attendance`)
  }
  return res
}

export async function updateAttendanceRecord(
  recordId: string,
  data: { status?: 'present' | 'absent' | 'late' | 'excused'; notes?: string },
) {
  return fetcher<AttendanceRecord>(`/attendance/records/${recordId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function getClassAttendanceSummary(classId: string) {
  return fetcher<AttendanceSummary>(`/attendance/classes/${classId}/summary`)
}

export async function getStudentAttendance(studentId: string, classId: string) {
  return fetcher(`/attendance/students/${studentId}?class_id=${classId}`)
}
