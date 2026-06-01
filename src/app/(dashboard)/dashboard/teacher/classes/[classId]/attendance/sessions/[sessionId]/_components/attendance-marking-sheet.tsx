'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ChevronLeft, CheckCircle2, XCircle, Clock, ShieldCheck, Save } from 'lucide-react'
import { toast } from 'sonner'

import { Button }  from '@/components/ui/button'
import { Badge }   from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

import { submitAttendance, type SessionDetail, type StudentAttendanceEntry } from '@/lib/actions/attendance'

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; icon: typeof CheckCircle2; active: string; hover: string }> = {
  present: { label: 'Present', icon: CheckCircle2, active: 'bg-green-500 text-white hover:bg-green-600', hover: 'hover:bg-green-50 hover:text-green-700 hover:border-green-200' },
  absent:  { label: 'Absent',  icon: XCircle,      active: 'bg-red-500 text-white hover:bg-red-600',   hover: 'hover:bg-red-50 hover:text-red-700 hover:border-red-200' },
  late:    { label: 'Late',    icon: Clock,         active: 'bg-amber-500 text-white hover:bg-amber-600', hover: 'hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200' },
  excused: { label: 'Excused', icon: ShieldCheck,   active: 'bg-blue-500 text-white hover:bg-blue-600', hover: 'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200' },
}

interface Props {
  classId: string
  detail: SessionDetail
}

export function AttendanceMarkingSheet({ classId, detail }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus | null>>(() => {
    const init: Record<string, AttendanceStatus | null> = {}
    detail.students.forEach((s) => { init[s.student_id] = s.status })
    return init
  })

  function setStatus(studentId: string, status: AttendanceStatus) {
    setStatuses((prev) => ({ ...prev, [studentId]: status }))
  }

  const markedCount   = Object.values(statuses).filter(Boolean).length
  const unmarkedCount = detail.students.length - markedCount
  const presentCount  = Object.values(statuses).filter((s) => s === 'present').length

  function markAll(status: AttendanceStatus) {
    const all: Record<string, AttendanceStatus> = {}
    detail.students.forEach((s) => { all[s.student_id] = status })
    setStatuses(all)
  }

  function handleSave() {
    const records = Object.entries(statuses)
      .filter(([, s]) => s !== null)
      .map(([student_id, status]) => ({ student_id, status: status! }))

    if (records.length === 0) {
      toast.error('Mark at least one student before saving.')
      return
    }

    startTransition(async () => {
      const res = await submitAttendance(detail.session.id, classId, records)
      if (res.error) {
        toast.error(res.error.message)
        return
      }
      toast.success(`Attendance saved — ${presentCount} present`)
      router.push(`/dashboard/teacher/classes/${classId}/attendance`)
    })
  }

  const { session } = detail
  const dateLabel = format(parseISO(session.date), 'EEEE, d MMMM yyyy')

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => router.push(`/dashboard/teacher/classes/${classId}/attendance`)}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{dateLabel}</h2>
          <p className="text-sm text-muted-foreground">
            {session.subject ?? 'Attendance sheet'}
            {session.period ? ` · Period ${session.period}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{markedCount}/{detail.students.length} marked</span>
            {unmarkedCount > 0 && (
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">{unmarkedCount} unmarked</Badge>
            )}
          </div>
          <Button onClick={handleSave} disabled={isPending} size="sm" className="gap-1.5">
            <Save className="h-3.5 w-3.5" />
            {isPending ? 'Saving...' : 'Save Attendance'}
          </Button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground mr-1">Mark all:</span>
        {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((s) => {
          const cfg = STATUS_CONFIG[s]
          return (
            <Button
              key={s}
              variant="outline"
              size="sm"
              className={`text-xs h-7 ${cfg.hover}`}
              onClick={() => markAll(s)}
            >
              {cfg.label}
            </Button>
          )
        })}
      </div>

      {/* Student list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{detail.students.length} Students</CardTitle>
          <CardDescription className="text-xs">Tap a status to mark each student</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {detail.students.map((student, i) => {
              const current = statuses[student.student_id]
              return (
                <div key={student.student_id} className="flex items-center justify-between px-5 py-3 first:pt-4 last:pb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{student.first_name} {student.last_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((s) => {
                      const cfg = STATUS_CONFIG[s]
                      const Icon = cfg.icon
                      const isActive = current === s
                      return (
                        <button
                          key={s}
                          onClick={() => setStatus(student.student_id, s)}
                          className={`flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors
                            ${isActive ? cfg.active : `border-border bg-transparent text-muted-foreground ${cfg.hover}`}
                          `}
                        >
                          <Icon className="h-3 w-3" />
                          <span className="hidden sm:inline">{cfg.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary bar */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
        {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((s) => {
          const count = Object.values(statuses).filter((v) => v === s).length
          return (
            <span key={s} className="flex items-center gap-1">
              <span className="font-medium text-foreground">{count}</span> {STATUS_CONFIG[s].label.toLowerCase()}
            </span>
          )
        })}
        <span className="flex items-center gap-1">
          <span className="font-medium text-foreground">{unmarkedCount}</span> unmarked
        </span>
      </div>
    </div>
  )
}
