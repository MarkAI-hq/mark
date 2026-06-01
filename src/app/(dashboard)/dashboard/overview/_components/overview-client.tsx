'use client'

import { useState, useTransition } from 'react'
import { Users, CalendarCheck, BookOpen, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import {
  getClassAttendanceSummary,
  getClassSowStatus,
  getStudyPlanClassSummary,
  triggerStudyPlanDispatch,
} from '@/lib/actions/overview'

interface Props {
  classes: any[]
}

export function OverviewClient({ classes }: Props) {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.class_id ?? '')
  const [attendance, setAttendance] = useState<any>(null)
  const [sow, setSow]               = useState<any>(null)
  const [studyPlans, setStudyPlans] = useState<any>(null)
  const [loading, setLoading]       = useState(false)
  const [isPending, startTransition] = useTransition()

  const load = async (classId: string) => {
    if (!classId) return
    setLoading(true)
    try {
      const [attRes, sowRes, spRes] = await Promise.all([
        getClassAttendanceSummary(classId),
        getClassSowStatus(classId),
        getStudyPlanClassSummary(classId),
      ])
      setAttendance(attRes.data)
      setSow(sowRes.data)
      setStudyPlans(spRes.data)
    } finally {
      setLoading(false)
    }
  }

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId)
    setAttendance(null); setSow(null); setStudyPlans(null)
    load(classId)
  }

  const handleDispatch = () => {
    startTransition(async () => {
      const res = await triggerStudyPlanDispatch(selectedClassId)
      if (res.error) toast.error(res.error.message)
      else { toast.success('Study plans queued for dispatch'); load(selectedClassId) }
    })
  }

  const sowEntries = sow?.entries ?? []
  const delivered  = sowEntries.filter((e: any) => e.is_delivered).length
  const totalWeeks = sow?.total_weeks ?? sowEntries.length

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Select value={selectedClassId} onValueChange={handleClassChange}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select a class" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((c: any) => (
              <SelectItem key={c.class_id} value={c.class_id}>
                {c.name ?? c.class_name ?? c.class_id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedClassId && (
          <Button size="sm" onClick={handleDispatch} disabled={isPending || loading} className="gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            Dispatch Study Plans
          </Button>
        )}
      </div>

      {loading && <p className="text-sm text-muted-foreground animate-pulse">Loading…</p>}

      {!loading && selectedClassId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Attendance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-primary" /> Attendance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {attendance ? (
                <>
                  <div className="text-center">
                    <p className={`text-3xl font-bold ${
                      (attendance.overall_attendance_rate ?? 0) >= 80 ? 'text-emerald-600' :
                      (attendance.overall_attendance_rate ?? 0) >= 60 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {attendance.overall_attendance_rate ?? '—'}%
                    </p>
                    <p className="text-xs text-muted-foreground">{attendance.total_sessions} sessions</p>
                  </div>
                  {attendance.at_risk_students?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-red-600 flex items-center gap-1 mb-2">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        At risk ({attendance.at_risk_students.length})
                      </p>
                      <ul className="space-y-1">
                        {attendance.at_risk_students.map((s: any) => (
                          <li key={s.student_id} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground truncate">{s.name}</span>
                            <Badge variant="destructive" className="text-xs px-1.5 py-0 ml-2">{s.attendance_rate}%</Badge>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {attendance.at_risk_students?.length === 0 && (
                    <div className="flex items-center gap-2 text-emerald-600 text-xs">
                      <CheckCircle2 className="h-4 w-4" /> No at-risk students
                    </div>
                  )}
                </>
              ) : <p className="text-xs text-muted-foreground">No attendance data yet.</p>}
            </CardContent>
          </Card>

          {/* SoW */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" /> Scheme of Work
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sow ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    {sow.subject ?? 'Unknown'} · {sow.term ?? '—'} · {sow.academic_year ?? '—'}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div>
                      <p className="text-2xl font-bold text-emerald-600">{delivered}</p>
                      <p className="text-xs text-muted-foreground">Delivered</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-600">{totalWeeks - delivered}</p>
                      <p className="text-xs text-muted-foreground">Remaining</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Term progress</span>
                      <span>{totalWeeks > 0 ? Math.round((delivered / totalWeeks) * 100) : 0}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: totalWeeks > 0 ? `${(delivered / totalWeeks) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                </>
              ) : <p className="text-xs text-muted-foreground">No active SoW assigned.</p>}
            </CardContent>
          </Card>

          {/* Study Plans */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" /> Study Plans
              </CardTitle>
              <CardDescription className="text-xs">AI-generated personalised lessons per student</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {studyPlans?.students?.length > 0 ? (
                [...studyPlans.students]
                  .sort((a: any, b: any) => b.pending_count - a.pending_count)
                  .map((s: any) => (
                    <div key={s.student_id} className="flex items-center gap-2 text-xs">
                      <span className="flex-1 text-muted-foreground truncate">{s.name}</span>
                      {s.pending_count > 0 && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0 text-amber-600 border-amber-200">
                          {s.pending_count} pending
                        </Badge>
                      )}
                      {s.completed_count > 0 && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0 text-emerald-600 border-emerald-200">
                          {s.completed_count} done
                        </Badge>
                      )}
                      {s.total_plans === 0 && <span className="text-muted-foreground/50">no plans</span>}
                    </div>
                  ))
              ) : (
                <p className="text-xs text-muted-foreground">
                  No plans dispatched yet. Click <strong>Dispatch Study Plans</strong> to generate personalised lessons.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Per-student attendance table */}
          {attendance?.student_summaries?.length > 0 && (
            <Card className="lg:col-span-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Per-Student Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/30">
                      <tr className="border-b">
                        <th className="text-left px-4 py-2.5 font-medium">Student</th>
                        <th className="text-center px-4 py-2.5 font-medium">Sessions</th>
                        <th className="text-center px-4 py-2.5 font-medium">Present</th>
                        <th className="text-center px-4 py-2.5 font-medium">Rate</th>
                        <th className="text-center px-4 py-2.5 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {[...attendance.student_summaries]
                        .sort((a: any, b: any) => (a.attendance_rate ?? 100) - (b.attendance_rate ?? 100))
                        .map((s: any) => (
                          <tr key={s.student_id} className="hover:bg-muted/10">
                            <td className="px-4 py-2.5 font-medium">{s.name}</td>
                            <td className="px-4 py-2.5 text-center text-muted-foreground">{s.total_count}</td>
                            <td className="px-4 py-2.5 text-center text-muted-foreground">{s.present_count}</td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`font-medium ${
                                s.attendance_rate === null ? 'text-muted-foreground' :
                                s.attendance_rate >= 80  ? 'text-emerald-600' :
                                s.attendance_rate >= 60  ? 'text-amber-600' : 'text-red-600'
                              }`}>
                                {s.attendance_rate !== null ? `${s.attendance_rate}%` : '—'}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              {s.attendance_rate !== null && s.attendance_rate < 80 ? (
                                <Badge variant="destructive" className="text-xs px-1.5 py-0">At Risk</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs px-1.5 py-0 text-emerald-600 border-emerald-200">OK</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
