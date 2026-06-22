'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { AlertTriangle, Layers, Plus, RefreshCw, Send, Wand2, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge }    from '@/components/ui/badge'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  getClassStudyPlanSummary,
  dispatchStudyPlans,
  dispatchManualPlan,
} from '@/lib/actions/study-plans'

interface StudentRow {
  student_id:      string
  name:            string
  pending_count:   number
  completed_count: number
  total_plans:     number
  buffer_count:    number
  lessons_per_day: number
  last_dispatched: string | null
}

interface ClassStudyPlansTabProps {
  classId: string
  initialStudents: StudentRow[]
}

const LESSON_TYPES = [
  { value: 'catch_up',     label: 'Catch Up' },
  { value: 'gap_closure',  label: 'Gap Closure' },
  { value: 'reteach',      label: 'Reteach' },
  { value: 'consolidation', label: 'Consolidation' },
  { value: 'exam_prep',    label: 'Exam Prep' },
]

function StatusBadge({ total, completed }: { total: number; completed: number }) {
  if (total === 0) return <Badge variant="secondary" className="text-xs">None dispatched</Badge>
  const pct = Math.round((completed / total) * 100)
  if (pct >= 80) return <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">{pct}% done</Badge>
  if (pct >= 40) return <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">{pct}% done</Badge>
  return <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-xs">{pct}% done</Badge>
}

export function ClassStudyPlansTab({ classId, initialStudents }: ClassStudyPlansTabProps) {
  const [students,    setStudents]    = useState<StudentRow[]>(initialStudents)
  const [loading,     setLoading]     = useState(false)
  const [dispatching, setDispatching] = useState(false)
  const [customPlanStudent, setCustomPlanStudent] = useState<StudentRow | null>(null)
  const [, startTransition] = useTransition()

  const load = () => {
    startTransition(async () => {
      setLoading(true)
      const res = await getClassStudyPlanSummary(classId)
      setStudents(res.data?.students ?? [])
      setLoading(false)
    })
  }

  // No initial useEffect — data is pre-loaded by page.tsx

  const totalDispatched = students.reduce((s, r) => s + r.total_plans, 0)
  const totalCompleted  = students.reduce((s, r) => s + r.completed_count, 0)
  const completionPct   = totalDispatched > 0 ? Math.round((totalCompleted / totalDispatched) * 100) : null

  async function handleDispatchAll() {
    setDispatching(true)
    const res = await dispatchStudyPlans(classId)
    setDispatching(false)
    if (res.error) { toast.error(res.error.message); return }
    toast.success('Study plans queued for all students')
  }

  async function handleDispatchStudent(studentId: string) {
    const res = await dispatchStudyPlans(classId, studentId)
    if (res.error) { toast.error(res.error.message); return }
    toast.success('Study plans queued')
  }

  async function handleFillBuffer(studentId: string) {
    // Optimistic update — clear amber indicator immediately
    setStudents((prev) => prev.map((s) =>
      s.student_id === studentId ? { ...s, buffer_count: Math.max(s.buffer_count, 5) } : s,
    ))
    const res = await dispatchStudyPlans(classId, studentId)
    if (res.error) {
      toast.error(res.error.message)
      // Revert on failure
      load()
      return
    }
    toast.success('Buffer filled')
    // Revalidate in background for accurate count
    setTimeout(() => load(), 2000)
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-lg bg-muted" />)}
        </div>
        <div className="h-48 rounded-lg bg-muted" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {students.length} student{students.length !== 1 ? 's' : ''} · study plans generated from active scheme of work
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
            <Button size="sm" onClick={handleDispatchAll} disabled={dispatching} className="gap-1.5">
              <Send className="h-3.5 w-3.5" />
              {dispatching ? 'Queuing…' : 'Dispatch Plans for Class'}
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Dispatched</p>
              <p className="text-2xl font-bold mt-1">{totalDispatched}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Completed</p>
              <p className="text-2xl font-bold mt-1 text-emerald-600">{totalCompleted}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Completion</p>
              <p className="text-2xl font-bold mt-1">{completionPct != null ? `${completionPct}%` : '—'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Student table */}
        {students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Layers className="h-10 w-10 mb-3 opacity-25" />
            <p className="text-sm">No study plan data yet.</p>
            <Button size="sm" onClick={handleDispatchAll} disabled={dispatching} className="mt-4 gap-1.5">
              <Send className="h-3.5 w-3.5" />
              Dispatch Plans
            </Button>
          </div>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                Per-Student Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {students.map((s) => {
                  const lowBuffer = s.buffer_count < 2
                  return (
                    <div key={s.student_id} className={`flex items-center justify-between py-3 first:pt-0 last:pb-0 ${lowBuffer ? 'bg-amber-50/40 dark:bg-amber-950/10 -mx-2 px-2 rounded-lg' : ''}`}>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/classes/${classId}/students/${s.student_id}`}
                            className="text-sm font-medium hover:underline truncate"
                          >
                            {s.name}
                          </Link>
                          {lowBuffer && (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <p className="text-xs text-muted-foreground">
                            {s.pending_count} pending · {s.completed_count} completed
                          </p>
                          <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                            <Zap className="h-3 w-3" />
                            {s.lessons_per_day}/day
                          </span>
                          <span className={`text-xs font-medium ${lowBuffer ? 'text-amber-600' : 'text-muted-foreground'}`}>
                            {s.buffer_count} buffered
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-3 shrink-0">
                        <StatusBadge total={s.total_plans} completed={s.completed_count} />
                        {lowBuffer && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-xs h-7 text-amber-700 hover:text-amber-800 hover:bg-amber-100"
                            onClick={() => handleFillBuffer(s.student_id)}
                          >
                            <Zap className="h-3 w-3" />
                            Fill
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs h-7"
                          onClick={() => handleDispatchStudent(s.student_id)}
                        >
                          <Send className="h-3 w-3" />
                          Dispatch
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs h-7"
                          onClick={() => setCustomPlanStudent(s)}
                        >
                          <Wand2 className="h-3 w-3" />
                          Custom
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {customPlanStudent && (
        <CustomPlanDialog
          student={customPlanStudent}
          classId={classId}
          onClose={() => setCustomPlanStudent(null)}
          onDispatched={load}
        />
      )}
    </>
  )
}

// ── Custom Plan Dialog ───────────────────────────────────────────────────────

function CustomPlanDialog({
  student, classId, onClose, onDispatched,
}: {
  student:      StudentRow
  classId:      string
  onClose:      () => void
  onDispatched: () => void
}) {
  const [topic,       setTopic]       = useState('')
  const [lessonType,  setLessonType]  = useState('catch_up')
  const [notes,       setNotes]       = useState('')
  const [isPending,   startT]         = useTransition()

  function handleSubmit() {
    if (!topic.trim()) { toast.error('Topic is required'); return }
    startT(async () => {
      const res = await dispatchManualPlan({
        student_id:   student.student_id,
        class_id:     classId,
        topic:        topic.trim(),
        lesson_type:  lessonType,
        teacher_notes: notes.trim() || undefined,
      })
      if (res.error) { toast.error(res.error.message); return }
      toast.success(`Custom plan created for ${student.name}`)
      onDispatched()
      onClose()
    })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Custom Plan — {student.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Topic</Label>
            <Input
              placeholder="e.g. Quadratic equations"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Plan type</Label>
            <Select value={lessonType} onValueChange={setLessonType}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LESSON_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Teacher notes (optional)</Label>
            <Input
              placeholder="e.g. struggles with factorisation"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={isPending} className="gap-1.5">
            <Wand2 className="h-3.5 w-3.5" />
            {isPending ? 'Creating…' : 'Create Plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
