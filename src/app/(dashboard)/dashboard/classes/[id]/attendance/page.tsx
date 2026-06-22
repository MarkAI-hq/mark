import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/session'
import { getClassDetails } from '@/lib/actions/classes'
import {
  getAttendanceSessions,
  getClassAttendanceSummary,
} from '@/lib/actions/attendance'
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge }  from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarCheck2, Plus, Users } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ClassAttendancePage({ params }: Props) {
  const { id: classId } = await params

  const session = await getSession()
  if (!session) redirect('/login')

  const [classRes, sessionsRes, summaryRes] = await Promise.all([
    getClassDetails(classId),
    getAttendanceSessions(classId),
    getClassAttendanceSummary(classId),
  ])

  if (classRes.error || !classRes.data) return notFound()

  const classDetails = classRes.data
  const sessions     = sessionsRes.data ?? []
  const summary      = summaryRes.data ?? null

  const attendanceRate = summary?.overall_attendance_rate != null
    ? Math.round(summary.overall_attendance_rate)
    : null

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/classes">Classes</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/dashboard/classes/${classId}`}>{classDetails.name}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Attendance</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{classDetails.name} — Attendance</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {summary ? `${summary.total_sessions} session${summary.total_sessions !== 1 ? 's' : ''} recorded` : 'No sessions yet'}
          </p>
        </div>
        <Button asChild className="gap-1.5">
          <Link href={`/dashboard/teacher/classes/${classId}/attendance`}>
            <Plus className="h-4 w-4" />
            New Session
          </Link>
        </Button>
      </div>

      {/* Summary */}
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
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Students Tracked</p>
            <p className="text-2xl font-bold mt-1">{summary?.student_summaries.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">At Risk (&lt;80%)</p>
            <p className="text-2xl font-bold mt-1 text-amber-600">{summary?.at_risk_students.length ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* At-risk banner */}
      {summary && summary.at_risk_students.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm text-amber-800">Students below 80% attendance</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
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

      {/* Session list */}
      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <CalendarCheck2 className="h-10 w-10 mb-3 opacity-25" />
          <p className="text-sm">No attendance sessions recorded yet.</p>
          <Button asChild className="mt-4 gap-1.5">
            <Link href={`/dashboard/teacher/classes/${classId}/attendance`}>
              <Plus className="h-4 w-4" />
              Record first session
            </Link>
          </Button>
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CalendarCheck2 className="h-4 w-4 text-muted-foreground" />
              All Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {sessions.map((s) => {
                const total = s.present_count + s.absent_count + s.late_count + s.excused_count
                const rate  = total > 0 ? Math.round((s.present_count / total) * 100) : null
                return (
                  <div key={s.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(s.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {s.subject && <span className="text-xs text-muted-foreground">{s.subject}</span>}
                        {s.period != null && <span className="text-xs text-muted-foreground">Period {s.period}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-xs text-muted-foreground text-right hidden sm:block">
                        <div className="flex gap-2">
                          <span className="text-green-600 font-medium">{s.present_count} present</span>
                          <span className="text-red-500 font-medium">{s.absent_count} absent</span>
                          {s.late_count > 0 && <span className="text-amber-500 font-medium">{s.late_count} late</span>}
                        </div>
                        <p className="text-right">{total} enrolled</p>
                      </div>
                      <span className="text-lg font-bold w-12 text-right">{rate != null ? `${rate}%` : '—'}</span>
                      <Button variant="outline" size="sm" asChild>
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
      )}

      {/* Per-student breakdown */}
      {summary && summary.student_summaries.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Student Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {[...summary.student_summaries]
                .sort((a, b) => (a.attendance_rate ?? 1) - (b.attendance_rate ?? 1))
                .map((s) => {
                  const rate = s.attendance_rate != null ? Math.round(s.attendance_rate) : null
                  return (
                    <div key={s.student_id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                      <p className="text-sm font-medium">{s.name}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{s.present_count}/{s.total_count} sessions</span>
                        <span className="text-sm font-bold w-10 text-right">
                          {rate != null ? `${rate}%` : '—'}
                        </span>
                        {rate != null && (
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${rate >= 80 ? 'bg-green-500' : rate >= 60 ? 'bg-amber-400' : 'bg-red-500'}`}
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
