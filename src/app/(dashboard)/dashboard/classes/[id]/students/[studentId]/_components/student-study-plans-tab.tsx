'use client'

import { useState, useTransition } from 'react'
import { Layers, Send, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge }   from '@/components/ui/badge'
import { Button }  from '@/components/ui/button'
import { Input }   from '@/components/ui/input'
import { Label }   from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { dispatchStudyPlans, dispatchManualPlan } from '@/lib/actions/study-plans'
import type { StudyPlan } from '@/lib/actions/student-dashboard'

interface StudentStudyPlansTabProps {
  studentId:    string
  classId:      string
  studentName:  string
  initialPlans: StudyPlan[]
}

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-800 border-amber-200',
  sent:      'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  skipped:   'bg-slate-100 text-slate-600 border-slate-200',
}

const LESSON_TYPE_LABEL: Record<string, string> = {
  catch_up:     'Catch Up',
  gap_closure:  'Gap Closure',
  reteach:      'Reteach',
  pre_teach:    'Pre-Teach',
  consolidation: 'Consolidation',
  exam_prep:    'Exam Prep',
  pre_class:    'Pre-Class',
}

const LESSON_TYPES = [
  { value: 'catch_up',      label: 'Catch Up' },
  { value: 'gap_closure',   label: 'Gap Closure' },
  { value: 'reteach',       label: 'Reteach' },
  { value: 'consolidation', label: 'Consolidation' },
  { value: 'exam_prep',     label: 'Exam Prep' },
]

export function StudentStudyPlansTab({
  studentId, classId, studentName, initialPlans,
}: StudentStudyPlansTabProps) {
  const [plans,      setPlans]      = useState(initialPlans)
  const [showCustom, setShowCustom] = useState(false)
  const [dispatching, startT]       = useTransition()

  const completed = plans.filter((p) => p.status === 'completed').length
  const total     = plans.length
  const completionPct = total > 0 ? Math.round((completed / total) * 100) : null

  async function handleDispatch() {
    startT(async () => {
      const res = await dispatchStudyPlans(classId, studentId)
      if (res.error) { toast.error(res.error.message); return }
      toast.success('Study plans queued for ' + studentName)
    })
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} plan{total !== 1 ? 's' : ''} · {completed} completed
            {completionPct != null && ` (${completionPct}%)`}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCustom(true)} className="gap-1.5">
              <Wand2 className="h-3.5 w-3.5" />
              Add Custom Plan
            </Button>
            <Button size="sm" onClick={handleDispatch} disabled={dispatching} className="gap-1.5">
              <Send className="h-3.5 w-3.5" />
              {dispatching ? 'Queuing…' : 'Dispatch from SoW'}
            </Button>
          </div>
        </div>

        {plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Layers className="h-10 w-10 mb-3 opacity-25" />
            <p className="text-sm">No study plans dispatched yet.</p>
          </div>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                Study Plan History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {plans.map((p: any) => (
                  <div key={p.id} className="flex items-start justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.topic}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{p.subject}</span>
                        {p.lesson_type && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {LESSON_TYPE_LABEL[p.lesson_type] ?? p.lesson_type}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {p.scheduled_for ? new Date(p.scheduled_for).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      {p.score_after != null && (
                        <span className="text-xs font-semibold text-emerald-600">{p.score_after}%</span>
                      )}
                      <Badge variant="outline" className={`text-xs capitalize ${STATUS_STYLES[p.status] ?? ''}`}>
                        {p.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {showCustom && (
        <CustomPlanDialog
          studentId={studentId}
          classId={classId}
          studentName={studentName}
          onClose={() => setShowCustom(false)}
          onCreated={(plan) => { setPlans((prev) => [plan, ...prev]); setShowCustom(false) }}
        />
      )}
    </>
  )
}

function CustomPlanDialog({
  studentId, classId, studentName, onClose, onCreated,
}: {
  studentId:   string
  classId:     string
  studentName: string
  onClose:     () => void
  onCreated:   (plan: any) => void
}) {
  const [topic,      setTopic]      = useState('')
  const [lessonType, setLessonType] = useState('catch_up')
  const [notes,      setNotes]      = useState('')
  const [isPending,  startT]        = useTransition()

  function handleSubmit() {
    if (!topic.trim()) { toast.error('Topic is required'); return }
    startT(async () => {
      const res = await dispatchManualPlan({
        student_id:    studentId,
        class_id:      classId,
        topic:         topic.trim(),
        lesson_type:   lessonType,
        teacher_notes: notes.trim() || undefined,
      })
      if (res.error || !res.data?.plan) { toast.error(res.error?.message ?? 'Failed'); return }
      toast.success(`Custom plan created for ${studentName}`)
      onCreated(res.data.plan)
    })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Custom Plan — {studentName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Topic</Label>
            <Input placeholder="e.g. Quadratic equations" value={topic} onChange={(e) => setTopic(e.target.value)} className="h-8 text-xs" />
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
            <Input placeholder="context for the AI" value={notes} onChange={(e) => setNotes(e.target.value)} className="h-8 text-xs" />
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
