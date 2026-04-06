'use client'

import { useState, useEffect, useCallback, useTransition, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter }   from 'next/navigation'
import { toast }       from 'sonner'
import {
  Upload, X, FileText, CheckCircle2, XCircle, Loader2,
  Brain, FileSearch, MessageSquare, Save, Pencil, Zap,
  Users, UserPlus, AlertTriangle, Wrench, ShieldAlert,
  BookOpen, Lightbulb, Download, PlusCircle, RefreshCw,
  ClipboardList,
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
  getLatestAudit, overrideAudit, getRedesignSuggestions,
  saveRedesignItems, getRedesignItems, reuploadAssessment,
} from '@/lib/actions/audit'

// ── Types ──────────────────────────────────────────────────────────────────

type DialogView =
  | 'upload'
  | 'audit_flagged'
  | 'redesign_suggestions'
  | 'saved_redesign_items'
  | 'progress'
  | 'complete'

interface BatchGradingDialogProps {
  open:                boolean
  onOpenChange:        (open: boolean) => void
  assessmentId:        string
  classId:             string
  initialStudentId?:   string
  initialView?:        DialogView
  /** Pre-loaded from the server page so the tab renders immediately */
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

interface RedesignItem {
  dimension:               string
  issue_summary:           string
  title:                   string
  description:             string
  action_type:             string
  marks:                   number
  bloom_level:             string
  command_word:            string
  assessment_objective_id: string
  syllabus_topic:          string
  example_question_stem?:  string
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

// ── Audit Score Circle ─────────────────────────────────────────────────────

const AuditScoreCircle = ({ score }: { score: number }) => {
  const color = score >= 85 ? 'text-green-500' : score >= 65 ? 'text-amber-500' : 'text-red-500'
  const circumference = 301.6
  return (
    <div className="relative w-28 h-28 mx-auto mb-4">
      <svg viewBox="0 0 112 112" className="w-full h-full -rotate-90">
        <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-muted opacity-20" />
        <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="10" fill="transparent" strokeLinecap="round"
          strokeDasharray={`${(score / 100) * circumference} ${circumference}`} className={color} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold">{score}</span>
    </div>
  )
}

// ── Saved Redesign Items View ──────────────────────────────────────────────

const ACTION_TYPE_COLORS: Record<string, string> = {
  add_question:    'bg-blue-100 text-blue-700',
  modify_question: 'bg-amber-100 text-amber-700',
  remove_question: 'bg-red-100 text-red-700',
  rebalance_marks: 'bg-purple-100 text-purple-700',
}

function SavedRedesignItemsView({
  items,
  isDownloading,
  onDownload,
  onBack,
}: {
  items:         RedesignItem[]
  isDownloading: boolean
  onDownload:    () => void
  onBack:        () => void
}) {
  // Group by dimension
  const grouped = items.reduce<Record<string, RedesignItem[]>>((acc, item) => {
    ;(acc[item.dimension] ??= []).push(item)
    return acc
  }, {})

  const DIMENSION_LABELS: Record<string, string> = {
    blooms:        "Bloom's Taxonomy",
    topics:        'Syllabus Topics',
    command_words: 'Command Words',
    marks:         'Mark Allocation',
  }

  return (
    <>
      <DialogHeader className="px-6 pt-6 pb-4 border-b bg-indigo-50/50 dark:bg-indigo-950/10 shrink-0">
        <div className="flex items-center gap-2 text-indigo-600 mb-1">
          <ClipboardList className="h-5 w-5" />
          <DialogTitle>Saved Blueprint Items</DialogTitle>
        </div>
        <DialogDescription>
          {items.length === 0
            ? 'No items saved yet. Use "Fix My Assessment" to generate suggestions and add them.'
            : `${items.length} item${items.length !== 1 ? 's' : ''} saved to your redesign blueprint.`}
        </DialogDescription>
      </DialogHeader>

      <div className="px-6 py-6 flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
              <ClipboardList className="h-6 w-6 text-indigo-400" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Your blueprint is empty. Go back to the audit and click <strong>Fix My Assessment</strong> to get AI suggestions.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([dimension, dimItems]) => (
              <div key={dimension} className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5" />
                  {DIMENSION_LABELS[dimension] ?? dimension}
                  <span className="ml-auto font-normal normal-case text-muted-foreground">
                    {dimItems.length} item{dimItems.length !== 1 ? 's' : ''}
                  </span>
                </h4>
                <div className="grid gap-3 pl-4 border-l-2 border-indigo-100">
                  {dimItems.map((item, j) => (
                    <div key={j} className="bg-card border border-indigo-50 rounded-md p-3 shadow-sm">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100 flex-1">
                          {item.title}
                        </span>
                        <Badge
                          className={cn(
                            'border-none text-[9px] uppercase tracking-tighter shrink-0',
                            ACTION_TYPE_COLORS[item.action_type] ?? 'bg-indigo-100 text-indigo-700',
                          )}
                        >
                          {item.action_type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
                        {item.description}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                        <span><strong>{item.marks}</strong> marks</span>
                        <span>Bloom: <strong>{item.bloom_level}</strong></span>
                        <span>CW: <strong>{item.command_word}</strong></span>
                        <span>{item.assessment_objective_id}</span>
                        <span>{item.syllabus_topic}</span>
                      </div>
                      {item.example_question_stem && (
                        <div className="mt-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded text-xs font-medium text-slate-700 dark:text-slate-300">
                          <span className="text-indigo-600 font-bold mr-2">CBC ITEM STEM:</span>
                          {item.example_question_stem}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DialogFooter className="px-6 py-4 border-t bg-slate-50/50 dark:bg-slate-900/30 shrink-0">
        <div className="flex items-center justify-between w-full gap-3">
          <Button variant="outline" size="sm" onClick={onBack}>
            Back to Audit
          </Button>
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
            disabled={isDownloading || items.length === 0}
            onClick={onDownload}
          >
            {isDownloading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Download className="w-4 h-4" />
            }
            {isDownloading ? 'Generating…' : `Download blueprint (${items.length})`}
          </Button>
        </div>
      </DialogFooter>
    </>
  )
}

// ── Component ──────────────────────────────────────────────────────────────

export function BatchGradingDialog({
  open, onOpenChange, assessmentId, classId,
  initialStudentId, initialView = 'upload',
  savedRedesignItems: initialSavedItems = [],
}: BatchGradingDialogProps) {
  const router = useRouter()

  const [files,           setFiles]           = useState<FileWithPreview[]>([])
  const [students,        setStudents]        = useState<EnrolledStudent[]>([])
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [isPending,       startTransition]    = useTransition()
  const [view,            setView]            = useState<DialogView>(initialView)
  const [liveStates,      setLiveStates]      = useState<LiveSubmissionState[]>([])
  const [batchStatus,     setBatchStatus]     = useState<BatchStatusResult | null>(null)
  const [showUnassigned,  setShowUnassigned]  = useState(false)
  const [enrollOpen,      setEnrollOpen]      = useState(false)

  const [auditResult,          setAuditResult]          = useState<any>(null)
  const [showOverrideInput,    setShowOverrideInput]    = useState(false)
  const [overrideReason,       setOverrideReason]       = useState('')
  const [isOverriding,         setIsOverriding]         = useState(false)

  const [redesignData,         setRedesignData]         = useState<any>(null)
  const [isRequestingRedesign, setIsRequestingRedesign] = useState(false)

  // ── Redesign items state ───────────────────────────────────────────────
  // savedItems:    full objects, accumulated across saves (replaces the rebuild loop)
  // savedItemKeys: Set of `${dimension}::${title}` for O(1) "already added" lookup
  const [savedItems,    setSavedItems]    = useState<RedesignItem[]>(initialSavedItems)
  const [savedItemKeys, setSavedItemKeys] = useState<Set<string>>(
    () => new Set(initialSavedItems.map(i => `${i.dimension}::${i.title}`)),
  )
  const [savingKey,     setSavingKey]     = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  // ── Reupload state ─────────────────────────────────────────────────────
  const [isReuploading,  setIsReuploading]  = useState(false)
  const reuploadInputRef = useRef<HTMLInputElement>(null)

  const abortRefs   = useRef<Map<string, AbortController>>(new Map())
  const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const attemptsRef = useRef(0)
  const hasInitializedView = useRef(false)

  const resultsHref = `/dashboard/assessments/${assessmentId}/results`

  // ── Sync view + load audit ─────────────────────────────────────────────
  useEffect(() => {
    if (open && !hasInitializedView.current) {
      setView(initialView)
      if (initialView === 'audit_flagged' || initialView === 'saved_redesign_items') {
        getLatestAudit(assessmentId).then(({ data }) => setAuditResult(data))
      }
      // Sync saved items in case they were updated outside this dialog
      getRedesignItems(assessmentId).then(({ data }) => {
        if (data && data.length > 0) {
          setSavedItems(data)
          setSavedItemKeys(new Set(data.map((i: RedesignItem) => `${i.dimension}::${i.title}`)))
        }
      })
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
      setBatchStatus(data)
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

  // ── Submit ─────────────────────────────────────────────────────────────
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

  const handleGetRedesign = async () => {
    setIsRequestingRedesign(true)
    const { data, error } = await getRedesignSuggestions(assessmentId)
    setIsRequestingRedesign(false)
    if (error) return toast.error(error.message)
    if (data) { setRedesignData(data); setView('redesign_suggestions') }
  }

  // ── Add item to blueprint ──────────────────────────────────────────────
  const handleAddItem = async (action: any, sug: any) => {
    const key = `${sug.dimension}::${action.title}`
    setSavingKey(key)

    const newItem: RedesignItem = {
      dimension:               sug.dimension,
      issue_summary:           sug.issue_summary,
      title:                   action.title,
      description:             action.description,
      action_type:             action.action_type,
      marks:                   Number(action.marks),   // cast: AI may return strings
      bloom_level:             action.bloom_level,
      command_word:            action.command_word,
      assessment_objective_id: action.assessment_objective_id,
      syllabus_topic:          action.syllabus_topic,
      example_question_stem:   action.example_question_stem,
    }

    const updatedItems = [...savedItems, newItem]

    const { error } = await saveRedesignItems(assessmentId, updatedItems)
    setSavingKey(null)

    if (error) {
      console.error('saveRedesignItems error:', error)
      return toast.error('Failed to save item.', { description: error.message })
    }

    setSavedItems(updatedItems)
    setSavedItemKeys(prev => new Set([...prev, key]))
    toast.success('Item added to blueprint.')
  }

  // ── Download DOCX ──────────────────────────────────────────────────────
const handleDownloadDocx = async () => {
  if (savedItems.length === 0) {
    return toast.warning('Add at least one item to the blueprint first.')
  }
  setIsDownloading(true)
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
    console.log('[download] apiBase:', apiBase)
    console.log('[download] assessmentId:', assessmentId)
    console.log('[download] savedItems:', savedItems.length)

    const res = await fetch(
      `${apiBase}/api/v1/assessments/${assessmentId}/audit/redesign-items/download`,
      { credentials: 'include' },
    )

    console.log('[download] status:', res.status)
    console.log('[download] headers:', Object.fromEntries(res.headers.entries()))

    if (!res.ok) {
      const body = await res.text().catch(() => '(no body)')
      console.error('[download] error body:', body)
      throw new Error(`HTTP ${res.status}: ${body}`)
    }

    const blob = await res.blob()
    console.log('[download] blob size:', blob.size, 'type:', blob.type)

    if (blob.size === 0) throw new Error('Server returned an empty file')

    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `redesign-blueprint.docx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Blueprint downloaded.')
  } catch (err) {
    console.error('[download] caught:', err)
    toast.error('Failed to download blueprint.', {
      description: err instanceof Error ? err.message : String(err),
    })
  } finally {
    setIsDownloading(false)
  }
}
  // ── Reupload ───────────────────────────────────────────────────────────
  const handleReuploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsReuploading(true)
    const formData = new FormData()
    formData.append('file', file)

    const { data, error } = await reuploadAssessment(assessmentId, formData)
    setIsReuploading(false)

    if (error) return toast.error('Reupload failed', { description: error.message })

    toast.success('Assessment reuploaded — audit re-running.')
    const { data: freshAudit } = await getLatestAudit(assessmentId)
    if (freshAudit) setAuditResult(freshAudit)
    setView('audit_flagged')
    router.refresh()
  }

  const handleClose = (shouldRedirect = false) => {
    if (shouldRedirect && view === 'complete') router.push(resultsHref)
    cleanupAll()
    setFiles([]); setLiveStates([]); setBatchStatus(null)
    setShowUnassigned(false); setView('upload'); onOpenChange(false)
    setStudentsLoading(true); setShowOverrideInput(false); setOverrideReason('')
    setRedesignData(null)
    // NOTE: we intentionally keep savedItems / savedItemKeys alive so the
    // "Saved Items" tab still shows data when the dialog is reopened.
  }

  // ── Derived ────────────────────────────────────────────────────────────
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
          view === 'upload' ? 'sm:max-w-4xl' : 'sm:max-w-3xl',
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
                      <div><p className="text-sm font-semibold text-amber-900">No students in this class</p><p className="text-xs text-amber-700 mt-1 leading-relaxed">Enroll at least one student before uploading submissions.</p></div>
                      <Button size="sm" variant="outline" className="mt-1 border-amber-300 text-amber-800 hover:bg-amber-100 gap-1.5" onClick={() => setEnrollOpen(true)}><UserPlus className="h-3.5 w-3.5" /> Enroll students</Button>
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
                            <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{fw.file.name}</p>{showUnassigned && !fw.assignedStudentId && <p className="text-xs text-destructive mt-0.5">Assign a student</p>}</div>
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

          {/* ── AUDIT FLAGGED VIEW ────────────────────────────────────── */}
          {view === 'audit_flagged' && (
            <>
              <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/30 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-600 mb-1">
                    <AlertTriangle className="h-5 w-5" />
                    <DialogTitle>Assessment Quality Audit</DialogTitle>
                  </div>
                  {/* Quick-access button to saved blueprint items */}
                  {savedItems.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50 shrink-0"
                      onClick={() => setView('saved_redesign_items')}
                    >
                      <ClipboardList className="h-3.5 w-3.5" />
                      Blueprint ({savedItems.length})
                    </Button>
                  )}
                </div>
                <DialogDescription>This assessment deviates from the official curriculum schema. Grading may produce inaccurate results.</DialogDescription>
              </DialogHeader>

              <div className="px-6 py-6 flex-1 flex flex-col min-h-0 overflow-hidden">
                {!auditResult ? (
                  <div className="flex flex-col items-center justify-center flex-1 gap-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="text-sm text-muted-foreground">Loading audit findings...</p></div>
                ) : (
                  <div className="flex flex-col md:flex-row gap-8 flex-1 min-h-0">
                    <div className="w-full md:w-1/3 flex flex-col items-center justify-center min-h-[160px] border-b md:border-b-0 md:border-r border-border pb-6 md:pb-0 pr-0 md:pr-6 shrink-0">
                      <AuditScoreCircle score={auditResult.overall_score} />
                      <h3 className="text-center font-semibold mt-2 text-foreground">Overall Alignment</h3>
                    </div>
                    <div className="w-full md:w-2/3 flex flex-col min-h-0">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 shrink-0">Audit Findings</h4>
                      <ScrollArea className="flex-1 min-h-0 pr-4 -mr-4">
                        <div className="space-y-3 pb-4">
                          {auditResult.findings.map((finding: any, i: number) => (
                            <div key={i} className={cn('p-3 rounded-lg border flex gap-3 items-start', finding.status === 'flagged' ? 'border-amber-200 bg-amber-50 dark:bg-amber-950/20' : 'border-green-200 bg-green-50 dark:bg-green-950/20')}>
                              {finding.status === 'flagged' ? <XCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />}
                              <div className="flex-1 min-w-0">
                                <p className={cn('text-sm font-semibold capitalize', finding.status === 'flagged' ? 'text-amber-900 dark:text-amber-200' : 'text-green-900 dark:text-green-200')}>{finding.dimension.replace('_', ' ')}</p>
                                <p className="text-xs mt-1 text-muted-foreground leading-relaxed">{finding.description}</p>
                                {finding.citation && <span className="mt-2 text-[10px] font-medium text-muted-foreground/80 flex items-center gap-1.5 bg-background/50 w-fit px-1.5 py-0.5 rounded"><BookOpen className="w-3 h-3 shrink-0" />{finding.citation}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t bg-muted/30 shrink-0">
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
                  <div className="flex items-center justify-end gap-3">
                    <Button variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => setShowOverrideInput(true)}>Grade Anyway</Button>
                    <Button onClick={handleGetRedesign} disabled={isRequestingRedesign} className="gap-2">
                      {isRequestingRedesign ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}Fix My Assessment
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── REDESIGN SUGGESTIONS VIEW ──────────────────────────────── */}
          {view === 'redesign_suggestions' && redesignData && (
            <>
              <DialogHeader className="px-6 pt-6 pb-4 border-b bg-indigo-50/50 dark:bg-indigo-950/10 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-600 mb-1">
                    <Lightbulb className="h-5 w-5" />
                    <DialogTitle>CBC Alignment Blueprint</DialogTitle>
                  </div>
                  {/* Quick-access to already-saved items */}
                  {savedItems.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50 shrink-0"
                      onClick={() => setView('saved_redesign_items')}
                    >
                      <ClipboardList className="h-3.5 w-3.5" />
                      View saved ({savedItems.length})
                    </Button>
                  )}
                </div>
                <DialogDescription>
                  Click <strong>Add to blueprint</strong> on any item. When ready, download the DOCX, fix your assessment, then reupload.
                </DialogDescription>
              </DialogHeader>

              <div className="px-6 py-6 flex-1 overflow-y-auto">
                <div className="bg-indigo-600 text-white p-4 rounded-lg mb-6 text-sm font-medium shadow-sm">
                  {redesignData.overall_advice}
                </div>
                <div className="space-y-6">
                  {redesignData.detailed_suggestions.map((sug: any, i: number) => (
                    <div key={i} className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5" />{sug.issue_summary}
                      </h4>
                      <div className="grid gap-3 pl-4 border-l-2 border-indigo-100">
                        {sug.suggestions.map((action: any, j: number) => {
                          const key     = `${sug.dimension}::${action.title}`
                          const saved   = savedItemKeys.has(key)
                          const saving  = savingKey === key
                          return (
                            <div key={j} className={cn('bg-card border rounded-md p-3 shadow-sm transition-colors', saved ? 'border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/10' : 'border-indigo-50')}>
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <span className="font-bold text-sm text-slate-900 dark:text-slate-100 flex-1">{action.title}</span>
                                <div className="flex items-center gap-2 shrink-0">
                                  <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none text-[9px] uppercase tracking-tighter">
                                    {action.action_type.replace('_', ' ')}
                                  </Badge>
                                  {saved ? (
                                    <span className="flex items-center gap-1 text-[11px] text-indigo-600 font-medium">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Added
                                    </span>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs gap-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                      disabled={saving}
                                      onClick={() => handleAddItem(action, sug)}
                                    >
                                      {saving
                                        ? <Loader2 className="w-3 h-3 animate-spin" />
                                        : <PlusCircle className="w-3 h-3" />
                                      }
                                      Add to blueprint
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">{action.description}</p>
                              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                                <span><strong>{action.marks}</strong> marks</span>
                                <span>Bloom: <strong>{action.bloom_level}</strong></span>
                                <span>CW: <strong>{action.command_word}</strong></span>
                                <span>{action.assessment_objective_id}</span>
                                <span>{action.syllabus_topic}</span>
                              </div>
                              {action.example_question_stem && (
                                <div className="mt-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded text-xs font-medium text-slate-700 dark:text-slate-300">
                                  <span className="text-indigo-600 font-bold mr-2">CBC ITEM STEM:</span>
                                  {action.example_question_stem}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="px-6 py-4 border-t bg-slate-50/50 dark:bg-slate-900/30 shrink-0">
                <div className="flex items-center justify-between w-full gap-3">
                  <Button variant="outline" size="sm" onClick={() => setView('audit_flagged')}>
                    Back to Audit
                  </Button>
                  <div className="flex items-center gap-2">
                    <input
                      ref={reuploadInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={handleReuploadFile}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      disabled={isReuploading}
                      onClick={() => reuploadInputRef.current?.click()}
                    >
                      {isReuploading
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <RefreshCw className="w-4 h-4" />
                      }
                      {isReuploading ? 'Reuploading…' : 'Reupload fixed assessment'}
                    </Button>
                    <Button
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                      disabled={isDownloading || savedItems.length === 0}
                      onClick={handleDownloadDocx}
                    >
                      {isDownloading
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Download className="w-4 h-4" />
                      }
                      {isDownloading ? 'Generating…' : `Download blueprint${savedItems.length > 0 ? ` (${savedItems.length})` : ''}`}
                    </Button>
                  </div>
                </div>
              </DialogFooter>
            </>
          )}

          {/* ── SAVED REDESIGN ITEMS VIEW ──────────────────────────────── */}
          {view === 'saved_redesign_items' && (
            <SavedRedesignItemsView
              items={savedItems}
              isDownloading={isDownloading}
              onDownload={handleDownloadDocx}
              onBack={() => setView(redesignData ? 'redesign_suggestions' : 'audit_flagged')}
            />
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
                        <div className="flex items-center justify-between mt-2">
                          {[10, 30, 60, 75, 85, 100].map(milestone => (
                            <div key={milestone} className={cn('h-1.5 w-1.5 rounded-full transition-colors', ls.progress >= milestone ? (isDone ? 'bg-green-500' : isFail ? 'bg-destructive' : 'bg-primary') : 'bg-muted')} />
                          ))}
                        </div>
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
                <div className="flex flex-wrap gap-3">
                  <Badge variant="outline" className="gap-1.5 text-green-600 text-sm py-1.5 px-3">
                    <CheckCircle2 className="w-4 h-4" />{completedCount} graded successfully
                  </Badge>
                </div>
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