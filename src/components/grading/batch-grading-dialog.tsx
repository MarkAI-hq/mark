'use client'

import { useState, useEffect, useCallback, useTransition, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter }   from 'next/navigation'
import { toast }       from 'sonner'
import {
  Upload, X, FileText, CheckCircle2, XCircle, Loader2,
  Brain, FileSearch, MessageSquare, Save, Pencil, Zap,
  Users, UserPlus, AlertTriangle, ShieldAlert, ArrowRight
} from 'lucide-react'
import Image from 'next/image'
import { InlineEnrollDialog } from '@/components/grading/inline-enroll-dialog'

import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button }     from '@/components/ui/button'
import { Progress }   from '@/components/ui/progress'
import { Badge }      from '@/components/ui/badge'
import { Skeleton }   from '@/components/ui/skeleton'
import { Textarea }   from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn }         from '@/lib/utils'
import { getEnrolledStudents, EnrolledStudent } from '@/lib/actions/enrollments'
import {
  startBatchGrading,
  getBatchGradingStatus,
  BatchStatusResult,
} from '@/lib/actions/grading'
import {
  getLatestAudit, overrideAudit, RedesignItem
} from '@/lib/actions/audit'

// ── Types ──────────────────────────────────────────────────────────────────

type DialogView =
  | 'upload'
  | 'audit_flagged'
  | 'progress'
  | 'complete'

interface BatchGradingDialogProps {
  open:                boolean
  onOpenChange:        (open: boolean) => void
  assessmentId:        string
  classId:             string
  initialStudentId?:   string
  initialView?:        DialogView
  savedRedesignItems?: RedesignItem[]
}

interface FileWithPreview {
  file:               File
  preview?:           string
  assignedStudentId?: string
}

interface LiveSubmissionState {
  submissionId: string
  studentId:    string
  progress:     number
  step:         string
  done:         boolean
  error?:       string
  score?:       number | null
  maxScore?:    number | null
}

// ── Step config ────────────────────────────────────────────────────────────

const STEP_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  'Queued':            { icon: <Loader2 className="w-4 h-4 animate-spin" />,        label: 'Queued',             color: 'text-muted-foreground' },
  'Starting':          { icon: <Zap className="w-4 h-4" />,                         label: 'Starting',           color: 'text-blue-500'         },
  'Loading files':     { icon: <FileSearch className="w-4 h-4" />,                  label: 'Loading files',      color: 'text-blue-500'         },
  'Reading assessment':{ icon: <FileText className="w-4 h-4" />,                    label: 'Reading assessment', color: 'text-blue-500'         },
  'AI analysis':       { icon: <Brain className="w-4 h-4 animate-pulse" />,         label: 'AI grading',         color: 'text-purple-500'       },
  'Writing feedback':  { icon: <MessageSquare className="w-4 h-4 animate-pulse" />, label: 'Writing feedback',   color: 'text-purple-500'       },
  'Saving results':    { icon: <Save className="w-4 h-4" />,                        label: 'Saving results',     color: 'text-blue-500'         },
  'Grading complete':  { icon: <CheckCircle2 className="w-4 h-4" />,                label: 'Grading complete',   color: 'text-green-600'        },
  'Annotating script': { icon: <Pencil className="w-4 h-4" />,                      label: 'Annotating script',  color: 'text-green-600'        },
  'Complete':          { icon: <CheckCircle2 className="w-4 h-4" />,                label: 'Complete',           color: 'text-green-600'        },
  'Failed':            { icon: <XCircle className="w-4 h-4" />,                     label: 'Failed',             color: 'text-destructive'      },
}

const POLL_INTERVAL_MS  = 5000
const MAX_POLL_ATTEMPTS = 120

// ── Component ──────────────────────────────────────────────────────────────

export function BatchGradingDialog({
  open, onOpenChange, assessmentId, classId,
  initialStudentId, initialView = 'upload',
}: BatchGradingDialogProps) {
  const router = useRouter()

  const [files,           setFiles]           = useState<FileWithPreview[]>([])
  const [students,        setStudents]        = useState<EnrolledStudent[]>([])
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [isPending,       startTransition]    = useTransition()
  const [view,            setView]            = useState<DialogView>(initialView)
  const [liveStates,      setLiveStates]      = useState<LiveSubmissionState[]>([])
  const [showUnassigned,  setShowUnassigned]  = useState(false)
  const [enrollOpen,      setEnrollOpen]      = useState(false)

  const [auditResult,          setAuditResult]          = useState<any>(null)
  const [showOverrideInput,    setShowOverrideInput]    = useState(false)
  const [overrideReason,       setOverrideReason]       = useState('')
  const [isOverriding,         setIsOverriding]         = useState(false)

  const abortRefs   = useRef<Map<string, AbortController>>(new Map())
  const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const attemptsRef = useRef(0)
  const hasInitializedView = useRef(false)

  const resultsHref = `/dashboard/assessments/${assessmentId}/results`

  useEffect(() => {
    if (open && !hasInitializedView.current) {
      setView(initialView)
      if (initialView === 'audit_flagged') {
        getLatestAudit(assessmentId).then(({ data }) => setAuditResult(data))
      }
      hasInitializedView.current = true
    }
    if (!open) hasInitializedView.current = false
  }, [open, initialView, assessmentId])

  const handleEnrolled = useCallback(async () => {
    setStudentsLoading(true)
    const { data } = await getEnrolledStudents(classId)
    setStudents(data?.filter(s => s.status === 'active') ?? [])
    setStudentsLoading(false)
    setEnrollOpen(false)
    toast.success('Students enrolled — you can now upload submissions.')
  }, [classId])

  useEffect(() => {
    if (!open || !classId) return
    setStudentsLoading(true)
    getEnrolledStudents(classId).then(({ data }) => {
      setStudents(data?.filter(s => s.status === 'active') ?? [])
      setStudentsLoading(false)
    })
  }, [open, classId])

  useEffect(() => () => { cleanupAll() }, [])

  const cleanupAll = () => {
    abortRefs.current.forEach(ctrl => ctrl.abort())
    abortRefs.current.clear()
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    attemptsRef.current = 0
  }

  const checkAllDone = useCallback(() => {
    setLiveStates(prev => {
      const allDone = prev.length > 0 && prev.every(s => s.done)
      if (allDone) { cleanupAll(); setView('complete') }
      return prev
    })
  }, [])

  const openSSE = useCallback((submissionId: string) => {
    const ctrl    = new AbortController()
    abortRefs.current.set(submissionId, ctrl)
    const url     = `/api/v1/grading/submissions/${submissionId}/progress`

    fetch(url, { credentials: 'include', headers: { Accept: 'text/event-stream' }, signal: ctrl.signal })
      .then(async res => {
        if (!res.ok || !res.body) return
        const reader  = res.body.getReader()
        const decoder = new TextDecoder()
        let   buffer  = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer      = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.startsWith('data:')) continue
            try {
              const data = JSON.parse(line.slice(5).trim())
              setLiveStates(prev => prev.map(s =>
                s.submissionId === submissionId
                  ? { ...s, progress: data.progress, step: data.step, done: data.done ?? false, error: data.error }
                  : s,
              ))
              if (data.done) { ctrl.abort(); abortRefs.current.delete(submissionId); checkAllDone(); return }
            } catch { }
          }
        }
      })
      .catch(err => { if (err?.name !== 'AbortError') abortRefs.current.delete(submissionId) })
  }, [checkAllDone])

  const startFallbackPoll = useCallback((id: string) => {
    attemptsRef.current = 0
    pollRef.current = setInterval(async () => {
      attemptsRef.current += 1
      if (attemptsRef.current > MAX_POLL_ATTEMPTS) { clearInterval(pollRef.current!); return }
      const { data } = await getBatchGradingStatus(id)
      if (!data) return
      setLiveStates(prev => prev.map(ls => {
        const row  = data.submissions.find(s => s.student_id === ls.studentId)
        if (!row) return ls
        const done = row.grading_status === 'COMPLETED' || row.grading_status === 'FAILED'
        return {
          ...ls,
          step:     row.grading_status === 'COMPLETED' ? 'Complete' : row.grading_status === 'FAILED' ? 'Failed' : ls.step,
          done,
          score:    row.total_score,
          maxScore: row.max_score,
        }
      }))
      if (data.is_complete) { clearInterval(pollRef.current!); setView('complete') }
    }, POLL_INTERVAL_MS)
  }, [])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [
      ...prev,
      ...acceptedFiles.map(file => ({
        file,
        preview:           file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        assignedStudentId: initialStudentId ?? undefined,
      })),
    ])
  }, [initialStudentId])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: studentsLoading || students.length === 0,
    accept:   { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'application/pdf': ['.pdf'] },
    maxSize:  10 * 1024 * 1024,
  })

  const removeFile    = (index: number) => setFiles(prev => { const n = [...prev]; if (n[index]?.preview) URL.revokeObjectURL(n[index].preview!); n.splice(index, 1); return n })
  const assignStudent = (index: number, studentId: string) => setFiles(prev => { const n = [...prev]; if (n[index]) n[index].assignedStudentId = studentId; return n })

  const handleSubmit = (bypassAuditCheck = false) => {
    if (files.length === 0) return
    if (files.some(f => !f.assignedStudentId)) { setShowUnassigned(true); return }
    setShowUnassigned(false)

    startTransition(async () => {
      const formData = new FormData()
      formData.append('submissions', JSON.stringify(files.map(f => f.assignedStudentId!)))
      files.forEach(f => formData.append('files', f.file))

      const { data, error } = await startBatchGrading(assessmentId, formData)

      if (error) {
        if (!bypassAuditCheck && error.message.includes('audit flagged')) {
          const { data: auditData } = await getLatestAudit(assessmentId)
          if (auditData) { setAuditResult(auditData); setView('audit_flagged') }
          return
        }
        toast.error('Submission Failed', { description: error.message })
        return
      }

      if (data) {
        const initial: LiveSubmissionState[] = data.submissionIds.map((sid: string, i: number) => ({
          submissionId: sid,
          studentId:    files[i].assignedStudentId!,
          progress:     0,
          step:         'Queued',
          done:         false,
        }))
        setLiveStates(initial)
        setView('progress')
        data.submissionIds.forEach((sid: string) => openSSE(sid))
        startFallbackPoll(assessmentId)
      }
    })
  }

  const handleOverride = async () => {
    if (!overrideReason.trim()) return toast.warning('Please provide a reason to override.')
    setIsOverriding(true)
    const { error } = await overrideAudit(assessmentId, overrideReason)
    setIsOverriding(false)
    if (error) return toast.error(error.message)
    toast.success('Audit overridden successfully.')
    setShowOverrideInput(false)
    files.length > 0 ? handleSubmit(true) : (setView('upload'), router.refresh())
  }

  const handleClose = (shouldRedirect = false) => {
    if (shouldRedirect && view === 'complete') router.push(resultsHref)
    cleanupAll()
    setFiles([]); setLiveStates([]); setShowUnassigned(false); setView('upload'); onOpenChange(false)
    setStudentsLoading(true); setShowOverrideInput(false); setOverrideReason('')
  }

  const completedCount  = liveStates.filter(s => s.step === 'Complete').length
  const totalCount      = liveStates.length
  const unassignedCount = files.filter(f => !f.assignedStudentId).length
  const overallPct      = totalCount > 0
    ? Math.round(liveStates.reduce((sum, s) => sum + Math.max(0, s.progress), 0) / totalCount)
    : 0
  const noStudents = !studentsLoading && students.length === 0

  return (
    <>
      <Dialog open={open} onOpenChange={v => { if (!v) handleClose(view === 'complete') }}>
        <DialogContent className={cn(
          'max-h-[85vh] flex flex-col p-0 transition-all duration-300',
          view === 'upload' ? 'sm:max-w-4xl' : 'sm:max-w-2xl',
        )}>

          {/* ── UPLOAD VIEW ───────────────────────────────────────────── */}
          {view === 'upload' && (
            <>
              <DialogHeader className="px-6 pt-6 pb-4">
                <DialogTitle>Upload and Grade Student Submissions</DialogTitle>
                <DialogDescription>
                  {initialStudentId ? 'Uploading submission for pre-selected student.' : 'Upload student answer sheets and assign each file to a student.'}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 flex-1 min-h-0 overflow-hidden">
                <div className="flex flex-col min-h-0">
                  {studentsLoading ? (
                    <div className="border-2 border-dashed rounded-lg p-6 h-[200px] flex flex-col items-center justify-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-3 w-40" /><Skeleton className="h-3 w-28" />
                    </div>
                  ) : noStudents ? (
                    <div className="border-2 border-dashed border-amber-200 bg-amber-50 rounded-lg p-6 h-[200px] flex flex-col items-center justify-center gap-3 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100"><Users className="h-6 w-6 text-amber-600" /></div>
                      <div><p className="text-sm font-semibold text-amber-900">No students in this class</p></div>
                      <Button size="sm" variant="outline" className="mt-1 border-amber-300 text-amber-800 dark:text-amber-300 hover:bg-amber-100 gap-1.5" onClick={() => setEnrollOpen(true)}><UserPlus className="h-3.5 w-3.5" /> Enroll students</Button>
                    </div>
                  ) : (
                    <div {...getRootProps()} className={cn('border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer flex flex-col items-center justify-center text-center h-[200px]', 'hover:border-primary/50 hover:bg-muted/50', isDragActive && 'border-primary bg-primary/5')}>
                      <input {...getInputProps()} /><Upload className="h-12 w-12 text-muted-foreground" />
                      <p className="mt-4 text-sm font-medium">Drag & drop files here</p>
                      <p className="mt-1 text-xs text-muted-foreground">PDF, JPG, PNG — max 10MB each</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col min-h-0">
                  <h3 className="text-sm font-semibold mb-3">Uploaded Files</h3>
                  <ScrollArea className="flex-1 pr-2">
                    {files.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">{noStudents ? 'Enroll students first.' : 'No files uploaded yet.'}</p>
                    ) : (
                      files.map((fw, index) => (
                        <div key={index} className={cn('flex flex-col gap-2 p-3 border rounded-lg bg-card mb-2 transition-colors', showUnassigned && !fw.assignedStudentId && 'border-destructive/50 bg-destructive/5')}>
                          <div className="flex items-center gap-2">
                            {fw.preview ? <Image src={fw.preview} alt="P" className="w-10 h-10 object-cover rounded" width={40} height={40} /> : <FileText className="w-10 h-10 text-muted-foreground" />}
                            <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{fw.file.name}</p></div>
                            <Button variant="ghost" size="icon" onClick={() => removeFile(index)}><X className="w-4" /></Button>
                          </div>
                          <Select onValueChange={v => { assignStudent(index, v); setShowUnassigned(false) }} value={fw.assignedStudentId}>
                            <SelectTrigger className={cn('h-8 text-xs', showUnassigned && !fw.assignedStudentId && 'border-destructive')}><SelectValue placeholder="Assign student..." /></SelectTrigger>
                            <SelectContent>{students.map(s => <SelectItem key={s.student_id} value={s.student_id}>{s.first_name} {s.last_name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      ))
                    )}
                  </ScrollArea>
                </div>
              </div>

              <DialogFooter className="px-6 py-4 border-t">
                {showUnassigned && unassignedCount > 0 && <p className="text-xs text-destructive flex-1 self-center">{unassignedCount} file(s) need assignment.</p>}
                <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
                <Button onClick={() => handleSubmit()} disabled={isPending || files.length === 0 || noStudents || studentsLoading}>
                  {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Auditing & Submitting…</> : `Submit ${files.length} file(s)`}
                </Button>
              </DialogFooter>
            </>
          )}

          {/* ── AUDIT FLAGGED VIEW (The Gate) ─────────────────────────── */}
          {view === 'audit_flagged' && (
            <>
              <DialogHeader className="px-6 pt-6 pb-4 border-b bg-amber-50/50 shrink-0">
                <div className="flex items-center gap-2 text-amber-600 mb-1">
                  <AlertTriangle className="h-5 w-5" />
                  <DialogTitle>Quality Verification Required</DialogTitle>
                </div>
                <DialogDescription>
                  This assessment deviates from the curriculum. AI grading is restricted until the audit is resolved or overridden.
                </DialogDescription>
              </DialogHeader>

              <div className="px-8 py-10 flex flex-col items-center justify-center text-center gap-4">
                <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
                  <ShieldAlert className="h-8 w-8 text-amber-600" />
                </div>
                <div className="max-w-md">
                  <p className="text-sm font-medium text-foreground">Audit Score: {auditResult?.overall_score ?? '...'}/100</p>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    To ensure grading accuracy, please review the audit findings and update your assessment. 
                    You can find the detailed blueprint on the assessment page.
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 border-t bg-muted/50 shrink-0">
                {showOverrideInput ? (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-2 text-destructive mb-2"><ShieldAlert className="w-4 h-4 shrink-0" /><span className="text-sm font-semibold">Liability Override</span></div>
                    <Textarea placeholder="Provide a reason for overriding the audit..." value={overrideReason} onChange={e => setOverrideReason(e.target.value)} className="text-sm bg-background mb-3 min-h-[72px] resize-none" autoFocus />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setShowOverrideInput(false); setOverrideReason('') }}>Cancel</Button>
                      <Button variant="destructive" size="sm" onClick={handleOverride} disabled={isOverriding}>{isOverriding && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Confirm & Grade</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <Button variant="outline" size="sm" onClick={() => handleClose(false)}>
                      Close & View Audit Details
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setShowOverrideInput(true)}>Grade Anyway</Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── PROGRESS VIEW ─────────────────────────────────────────── */}
          {view === 'progress' && (
            <>
              <DialogHeader className="px-6 pt-6 pb-2"><DialogTitle>Grading in Progress</DialogTitle></DialogHeader>
              <div className="px-6 py-4 flex-1 space-y-5 overflow-y-auto">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Overall</span><span className="font-medium tabular-nums">{overallPct}%</span></div>
                  <Progress value={overallPct} className="h-2" />
                </div>
                <div className="space-y-3">
                  {liveStates.map(ls => {
                    const student = students.find(s => s.student_id === ls.studentId)
                    const name    = student ? `${student.first_name} ${student.last_name}` : ls.studentId.slice(0, 8)
                    const cfg     = STEP_CONFIG[ls.step] ?? STEP_CONFIG['Queued']
                    const isDone  = ls.step === 'Complete'
                    const isFail  = ls.step === 'Failed'
                    return (
                      <div key={ls.submissionId} className={cn('rounded-lg border p-4 transition-colors', isDone && 'border-green-200 bg-green-50', isFail && 'border-destructive/30 bg-destructive/5', !isDone && !isFail && 'bg-card')}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{name}</span>
                          <div className={cn('flex items-center gap-1.5 text-xs font-medium', cfg.color)}>{cfg.icon}<span>{cfg.label}</span></div>
                        </div>
                        <Progress value={Math.max(0, ls.progress)} className={cn('h-1.5', isDone && '[&>div]:bg-green-500', isFail && '[&>div]:bg-destructive')} />
                        {isFail && ls.error && <p className="text-xs text-destructive mt-2 truncate">{ls.error}</p>}
                      </div>
                    )
                  })}
                </div>
              </div>
              <DialogFooter className="px-6 py-4 border-t"><Button variant="outline" onClick={() => handleClose(true)}>Close — view results</Button></DialogFooter>
            </>
          )}

          {/* ── COMPLETE VIEW ─────────────────────────────────────────── */}
          {view === 'complete' && (
            <>
              <DialogHeader className="px-6 pt-6 pb-4"><DialogTitle>Grading Complete</DialogTitle></DialogHeader>
              <div className="px-6 py-6 flex-1 space-y-5">
                <Badge variant="outline" className="gap-1.5 text-green-600 text-sm py-1.5 px-3">
                  <CheckCircle2 className="w-4 h-4" />{completedCount} graded successfully
                </Badge>
                <ScrollArea className="h-[260px] border rounded-lg p-3">
                  {liveStates.map(ls => {
                    const student = students.find(s => s.student_id === ls.studentId)
                    const name    = student ? `${student.first_name} ${student.last_name}` : ls.studentId.slice(0, 8)
                    return (
                      <div key={ls.submissionId} className="flex items-center justify-between py-2.5 border-b last:border-b-0">
                        <div className="flex items-center gap-2 text-sm">
                          {ls.step === 'Complete' ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-destructive" />}
                          <span>{name}</span>
                        </div>
                        {ls.step === 'Complete' && <span className="text-sm font-semibold tabular-nums">{ls.score}/{ls.maxScore}</span>}
                      </div>
                    )
                  })}
                </ScrollArea>
              </div>
              <DialogFooter className="px-6 py-4 border-t"><Button onClick={() => handleClose(true)}>Done — view results</Button></DialogFooter>
            </>
          )}

        </DialogContent>
      </Dialog>

      <InlineEnrollDialog open={enrollOpen} onOpenChange={setEnrollOpen} classId={classId} onEnrolled={handleEnrolled} />
    </>
  )
}