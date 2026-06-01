'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { CalendarPlus, Calendar, Users, CheckCircle2, XCircle, Clock, FileText } from 'lucide-react'
import { toast } from 'sonner'

import { Button }   from '@/components/ui/button'
import { Badge }    from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { createAttendanceSession, type AttendanceSession } from '@/lib/actions/attendance'

interface Props {
  classId: string
  initialSessions: AttendanceSession[]
  error: string | null
}

function StatusBadge({ present, absent, late, excused, total }: {
  present: number; absent: number; late: number; excused: number; total: number
}) {
  if (total === 0) return <Badge variant="secondary" className="text-xs">Not submitted</Badge>
  const rate = Math.round((present / total) * 100)
  const color = rate >= 80 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' : rate >= 60 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400'
  return (
    <div className="flex items-center gap-2">
      <Badge className={`text-xs ${color}`}>{rate}% present</Badge>
      <span className="text-xs text-muted-foreground">
        <span title="Present">{present} present</span>{' · '}
        <span title="Absent">{absent} absent</span>
        {late > 0 && <>{' · '}<span title="Late">{late} late</span></>}
        {excused > 0 && <>{' · '}<span title="Excused">{excused} excused</span></>}
      </span>
    </div>
  )
}

export function AttendanceClient({ classId, initialSessions, error }: Props) {
  const router = useRouter()
  const [sessions, setSessions] = useState(initialSessions)
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const today = format(new Date(), 'yyyy-MM-dd')
  const [date, setDate]       = useState(today)
  const [period, setPeriod]   = useState('')
  const [subject, setSubject] = useState('')
  const [notes, setNotes]     = useState('')

  function handleCreate() {
    startTransition(async () => {
      const res = await createAttendanceSession({
        class_id: classId,
        date,
        ...(period  ? { period: Number(period) } : {}),
        ...(subject ? { subject } : {}),
        ...(notes   ? { notes }   : {}),
      })

      if (res.error) {
        toast.error(res.error.message)
        return
      }

      setOpen(false)
      toast.success('Attendance session opened')
      router.push(`/dashboard/teacher/classes/${classId}/attendance/sessions/${res.data!.id}`)
    })
  }

  if (error) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p className="text-sm">Failed to load attendance sessions: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Attendance</h2>
          <p className="text-sm text-muted-foreground">{sessions.length} session{sessions.length !== 1 ? 's' : ''} recorded</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <CalendarPlus className="h-4 w-4" />
              Take Attendance
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Open Attendance Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="att-date">Date</Label>
                <Input id="att-date" type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="att-period">Period (optional)</Label>
                  <Input id="att-period" type="number" min={1} placeholder="1" value={period} onChange={(e) => setPeriod(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="att-subject">Subject (optional)</Label>
                  <Input id="att-subject" placeholder="Mathematics" value={subject} onChange={(e) => setSubject(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="att-notes">Notes (optional)</Label>
                <Input id="att-notes" placeholder="Double lesson, end of term..." value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={isPending || !date}>
                {isPending ? 'Opening...' : 'Open & Mark'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-center animate-fade-up">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10">
              <Calendar className="h-8 w-8 text-gold/60" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">No attendance sessions yet</p>
              <p className="text-xs text-muted-foreground">Click "Take Attendance" to record your first session.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <Card
              key={session.id}
              className="cursor-pointer rounded-xl shadow-xs hover:shadow-sm transition-shadow"
              onClick={() => router.push(`/dashboard/teacher/classes/${classId}/attendance/sessions/${session.id}`)}
            >
              <CardContent className="flex items-center justify-between py-4 px-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10">
                    <Calendar className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {format(parseISO(session.date), 'EEE, d MMM yyyy')}
                      {session.period ? <span className="text-muted-foreground ml-2 font-normal">Period {session.period}</span> : null}
                    </p>
                    {session.subject && (
                      <p className="text-xs text-muted-foreground">{session.subject}</p>
                    )}
                  </div>
                </div>
                <StatusBadge
                  present={session.present_count}
                  absent={session.absent_count}
                  late={session.late_count}
                  excused={session.excused_count}
                  total={session.total_records}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
