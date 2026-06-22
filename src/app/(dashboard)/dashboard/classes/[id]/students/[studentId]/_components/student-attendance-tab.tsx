'use client'

import { CalendarCheck2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SessionRecord {
  record_id:  string | null
  status:     'present' | 'absent' | 'late' | 'excused' | null
  date:       string
  period:     number | null
  subject:    string | null
  session_id: string
}

interface StudentAttendanceData {
  student_id:      string
  class_id:        string
  total_sessions:  number
  present_count:   number
  absent_count:    number
  late_count:      number
  excused_count:   number
  attendance_rate: number | null
  sessions:        SessionRecord[]
}

interface StudentAttendanceTabProps {
  data: StudentAttendanceData | null
}

const STATUS_COLORS: Record<string, string> = {
  present: 'bg-green-100 text-green-800 border-green-200',
  absent:  'bg-red-100  text-red-800  border-red-200',
  late:    'bg-amber-100 text-amber-800 border-amber-200',
  excused: 'bg-slate-100 text-slate-700 border-slate-200',
}

export function StudentAttendanceTab({ data }: StudentAttendanceTabProps) {
  if (!data || data.total_sessions === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <CalendarCheck2 className="h-10 w-10 mb-3 opacity-25" />
        <p className="text-sm">No attendance records yet for this student in this class.</p>
      </div>
    )
  }

  const rate = data.attendance_rate

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Attendance Rate</p>
            <p className="text-2xl font-bold mt-1">{rate != null ? `${rate}%` : '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Present</p>
            <p className="text-2xl font-bold mt-1 text-green-600">{data.present_count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Absent</p>
            <p className="text-2xl font-bold mt-1 text-red-500">{data.absent_count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Late / Excused</p>
            <p className="text-2xl font-bold mt-1 text-amber-500">
              {data.late_count + data.excused_count}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Session history */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CalendarCheck2 className="h-4 w-4 text-muted-foreground" />
            Session History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {data.sessions.map((s) => (
              <div key={s.record_id ?? s.session_id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">
                    {new Date(s.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  {s.subject && <p className="text-xs text-muted-foreground">{s.subject}</p>}
                </div>
                {s.status ? (
                  <Badge variant="outline" className={`text-xs capitalize ${STATUS_COLORS[s.status] ?? ''}`}>
                    {s.status}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">No record</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
