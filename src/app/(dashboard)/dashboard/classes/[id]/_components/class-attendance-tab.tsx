'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { CalendarCheck2, RefreshCw, Plus, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge }  from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  getAttendanceSessions,
  getClassAttendanceSummary,
  type AttendanceSession,
  type AttendanceSummary,
} from '@/lib/actions/attendance'

interface ClassAttendanceTabProps {
  classId: string
  initialSummary: AttendanceSummary | null
  initialSessions: AttendanceSession[]
}

function StatusBadge({ rate }: { rate: number | null }) {
  if (rate === null) return <Badge variant="secondary" className="text-xs">No data</Badge>
  if (rate >= 80) return <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">Good</Badge>
  if (rate >= 60) return <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">At Risk</Badge>
  return <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">Critical</Badge>
}

export function ClassAttendanceTab({ classId, initialSummary, initialSessions }: ClassAttendanceTabProps) {
  const [summary,  setSummary]  = useState<AttendanceSummary | null>(initialSummary)
  const [sessions, setSessions] = useState<AttendanceSession[]>(initialSessions)
  const [loading,  setLoading]  = useState(false)
  const [, startTransition] = useTransition()

  const load = () => {
    startTransition(async () => {
      setLoading(true)
      const [summaryRes, sessionsRes] = await Promise.all([
        getClassAttendanceSummary(classId),
        getAttendanceSessions(classId),
      ])
      setSummary(sessionsRes.data ? (summaryRes.data ?? null) : null)
      setSessions(sessionsRes.data ?? [])
      setLoading(false)
    })
  }

  // No initial useEffect — data is pre-loaded by page.tsx

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-muted" />
          ))}
        </div>
        <div className="h-48 rounded-lg bg-muted" />
      </div>
    )
  }

  const attendanceRate = summary?.overall_attendance_rate != null
    ? Math.round(summary.overall_attendance_rate)
    : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {summary ? `${summary.total_sessions} session${summary.total_sessions !== 1 ? 's' : ''} recorded` : 'No sessions yet'}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={load} className="h-8 w-8" title="Refresh">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" asChild className="gap-1.5">
            <Link href={`/dashboard/teacher/classes/${classId}/attendance`}>
              <Plus className="h-3.5 w-3.5" />
              New Session
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Overall Rate</p>
            <p className="text-2xl font-bold mt-1">{attendanceRate != null ? `${attendanceRate}%` : '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Sessions</p>
            <p className="text-2xl font-bold mt-1">{summary?.total_sessions ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">At Risk</p>
            <p className="text-2xl font-bold mt-1 text-amber-600">{summary?.at_risk_students.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
            <div className="mt-2">
              <StatusBadge rate={summary?.overall_attendance_rate ?? null} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent sessions */}
      {sessions.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CalendarCheck2 className="h-4 w-4 text-muted-foreground" />
              Recent Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {sessions.slice(0, 8).map((s) => {
                const total = s.present_count + s.absent_count + s.late_count + s.excused_count
                const rate  = total > 0 ? Math.round((s.present_count / total) * 100) : null
                return (
                  <div key={s.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium">{new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      {s.subject && <p className="text-xs text-muted-foreground">{s.subject}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-muted-foreground hidden sm:block">
                        <span className="text-green-600 font-medium">{s.present_count}P</span>
                        {' · '}
                        <span className="text-red-500 font-medium">{s.absent_count}A</span>
                        {s.late_count > 0 && <>{' · '}<span className="text-amber-500 font-medium">{s.late_count}L</span></>}
                      </div>
                      <span className="text-sm font-semibold w-10 text-right">{rate != null ? `${rate}%` : '—'}</span>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/teacher/classes/${classId}/attendance/sessions/${s.id}`}>
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Users className="h-10 w-10 mb-3 opacity-25" />
          <p className="text-sm">No attendance sessions yet.</p>
          <Button size="sm" className="mt-4 gap-1.5" asChild>
            <Link href={`/dashboard/teacher/classes/${classId}/attendance`}>
              <Plus className="h-3.5 w-3.5" />
              Record first session
            </Link>
          </Button>
        </div>
      )}

      {/* At-risk students */}
      {summary && summary.at_risk_students.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-800">At-Risk Students (below 80%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {summary.at_risk_students.map((s) => (
                <Badge key={s.student_id} variant="outline" className="border-amber-300 text-amber-800 text-xs">
                  {s.name} · {s.attendance_rate != null ? `${Math.round(s.attendance_rate)}%` : 'No data'}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
