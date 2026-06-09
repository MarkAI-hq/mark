'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter }             from 'next/navigation'
import { zodResolver }           from '@hookform/resolvers/zod'
import { useForm }               from 'react-hook-form'
import { toast }                 from 'sonner'
import { useDropzone }           from 'react-dropzone'
import { z }                     from 'zod'
import {
  Upload, X, School, BookOpen,
  Loader2, CheckCircle2, AlertTriangle,
  Brain, ShieldCheck, PartyPopper,
  Wrench, ClipboardList,
  Download, ArrowRight, Sparkles,
  TrendingUp, ShieldAlert, Trash2,
  ArrowLeft, TrendingDown,
  Maximize2, Minimize2,
} from 'lucide-react'

import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Form, FormControl, FormDescription,
  FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import { Input }      from '@/components/ui/input'
import { Button }     from '@/components/ui/button'
import { Checkbox }   from '@/components/ui/checkbox'
import { Badge }      from '@/components/ui/badge'
import { Textarea }   from '@/components/ui/textarea'
import { Assessment, createAssessment } from '@/lib/actions/assessments'
import { InlineClassDialog }        from '@/components/classes/inline-class-dialog'
import { BatchGradingDialog }       from '@/components/grading/batch-grading-dialog'
import { PredictionCard }           from '@/components/assessments/prediction-card'
import { AuditCard }                from '@/components/assessments/audit-card'
import { MirrorEditor, MirrorEditorHandle } from '@/components/editor/MirrorEditor'
import { BlueprintPreviewDialog }   from '@/components/editor/BlueprintPreviewDialog'
import type { AssessmentDiff }      from '@/components/editor/types'
import { cn }                       from '@/lib/utils'
import { getCurricula }             from '@/lib/actions/curricula'
import {
  triggerAudit,
  getLatestAudit,
  getAuditHistory,
  getRedesignSuggestions,
  saveRedesignItems,
  getRedesignItems,
  overrideAudit,
  reuploadAssessment,
  confirmRedesign,
  applyPartial,
  RedesignItem,
  RedesignVariation,
  ParsedQuestion,
  AuditHistoryEntry,
} from '@/lib/actions/audit'
import { ReviewWalkthrough, buildSteps, WalkthroughStep } from '@/components/exams/review-walkthrough'
import { ReviewSummary } from '@/components/exams/review-summary'
import { CurriculumSchemaMetadata } from '@/types/curricula'

// ── Types ──────────────────────────────────────────────────────────────────

type DialogView =
  | 'form'
  | 'auditing'
  | 'audit_passed'
  | 'audit_flagged'
  | 'review_walkthrough'
  | 'review_summary'
  | 'saved_redesign_items'

interface AuditStep {
  id:    string
  label: string
  done:  boolean
}

interface ExamDialogProps {
  open:                 boolean
  subjects:             { id: string; name: string }[]
  classes?:             { class_id: string; name: string }[]
  onOpenChange:         (open: boolean) => void
  assessment?:          Assessment
  initialCourseId?:     string
  initialClassId?:      string
  disableCourseSelect?: boolean
  disableClassSelect?:  boolean
  role?:                'Admin' | 'Teacher'
  initialView?:         DialogView
  latestAudit?:         any
  savedRedesignItems?:  RedesignItem[]
}

// ── Schema ─────────────────────────────────────────────────────────────────

const createSchema = z.object({
  title:           z.string().min(1, 'Title is required'),
  courseId:        z.string().uuid('Please select a subject'),
  classId:         z.string().uuid('Please select a class'),
  curriculumId:    z.string().min(1, 'Please select a curriculum framework'),
  scheme:          z
    .instanceof(File, { message: 'Please upload a marking guide' })
    .refine(f => f.type === 'application/pdf',  'Only PDF files are allowed')
    .refine(f => f.size <= 5 * 1024 * 1024,     'File size must be less than 5MB'),
  enableAiGrading: z.boolean().default(false).optional(),
})

const updateSchema = createSchema.partial().refine(
  data => Object.values(data).some(Boolean),
  { message: 'At least one field must be provided' },
)

const ACTION_TYPE_COLORS: Record<string, string> = {
  add_question:    'bg-[#f5edda] text-[#7a6230]',
  modify_question: 'bg-[#e8d5a3] text-[#7a6230]',
  remove_question: 'bg-red-100 text-red-700',
  rebalance_marks: 'bg-[#f5edda] text-[#a8893d]',
}

const INITIAL_STEPS: AuditStep[] = [
  { id: 'upload',    label: 'Uploading assessment',           done: false },
  { id: 'parse',     label: 'Parsing document structure',     done: false },
  { id: 'analyze',   label: 'Analysing curriculum alignment', done: false },
  { id: 'cognitive', label: 'Checking cognitive framework',   done: false },
  { id: 'score',     label: 'Computing quality score',        done: false },
]

const STEP_FLOW = [
  { id: 'create', label: 'Create' },
  { id: 'audit',  label: 'Audit'  },
  { id: 'fix',    label: 'Fix'    },
  { id: 'export', label: 'Export' },
]

function viewToStep(view: DialogView): string {
  if (view === 'form')                                                              return 'create'
  if (view === 'auditing' || view === 'audit_passed' || view === 'audit_flagged')  return 'audit'
  if (view === 'review_walkthrough' || view === 'review_summary')                  return 'fix'
  if (view === 'saved_redesign_items')                                              return 'export'
  return 'audit'
}

// ── Inline sub-components ──────────────────────────────────────────────────

function StepIndicator({ view, onStepClick }: { view: DialogView; onStepClick?: (step: string) => void }) {
  const current = viewToStep(view)
  const currentIdx = STEP_FLOW.findIndex(s => s.id === current)

  return (
    <div className="flex items-center gap-0 px-6 pt-3 pb-0">
      {STEP_FLOW.map((step, i) => {
        const isDone    = i < currentIdx
        const isActive  = step.id === current
        const isClickable = isDone && !!onStepClick
        return (
          <div key={step.id} className="flex items-center">
            <button
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick!(step.id)}
              className={cn(
                'flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider transition-colors',
                isActive  && 'text-[#7a6230]',
                isDone    && 'text-[#c9a84c] cursor-pointer hover:text-[#7a6230]',
                !isActive && !isDone && 'text-muted-foreground/40 cursor-default',
              )}
            >
              <span className={cn(
                'w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black',
                isActive && 'bg-[#c9a84c] text-white',
                isDone   && 'bg-[#f5edda] text-[#7a6230]',
                !isActive && !isDone && 'bg-muted/30 text-muted-foreground/40',
              )}>
                {isDone ? '✓' : i + 1}
              </span>
              {step.label}
            </button>
            {i < STEP_FLOW.length - 1 && (
              <span className={cn('mx-1.5 text-muted-foreground/30 text-[10px]', isDone && 'text-[#e8d5a3]')}>›</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function CurriculumBadge({ name }: { name?: string }) {
  if (!name) return null
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#f5edda] text-[#7a6230] border border-[#e8d5a3]">
      <BookOpen className="h-2.5 w-2.5" />{name}
    </span>
  )
}

function ScoreDelta({ from, to }: { from?: number; to?: number }) {
  if (from === undefined || to === undefined) return null
  const delta = to - from
  if (delta === 0) return null
  const isUp = delta > 0
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-[11px] font-bold',
      isUp ? 'text-emerald-600' : 'text-amber-600',
    )}>
      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {from} → {to} ({isUp ? '+' : ''}{delta})
    </span>
  )
}

// ── Component ──────────────────────────────────────────────────────────────

export function ExamDialog({
  open,
  subjects,
  classes,
  onOpenChange,
  assessment,
  initialCourseId,
  initialClassId,
  disableCourseSelect = false,
  disableClassSelect  = false,
  role                = 'Admin',
  initialView:        initialViewProp,
  latestAudit:        latestAuditProp,
  savedRedesignItems: initialSavedItemsProp = [],
}: ExamDialogProps) {
  const router = useRouter()

  const [pdfPreview,         setPdfPreview]         = useState<string>()
  const [classList,          setClassList]          = useState<{ class_id: string; name: string }[]>(classes ?? [])
  const [curricula,          setCurricula]          = useState<CurriculumSchemaMetadata[]>([])
  const [inlineClassOpen,    setInlineClassOpen]    = useState(false)
  const [isLoadingCurricula, setIsLoadingCurricula] = useState(false)

  const [view,           setView]           = useState<DialogView>('form')
  const [createdId,      setCreatedId]      = useState<string | null>(null)
  const [createdClassId, setCreatedClassId] = useState<string | null>(null)
  const [auditResult,    setAuditResult]    = useState<any>(null)
  const [auditSteps,     setAuditSteps]     = useState<AuditStep[]>(INITIAL_STEPS)
  const [auditProgress,  setAuditProgress]  = useState(0)
  const [auditError,     setAuditError]     = useState<string | null>(null)
  const [auditCardTab,   setAuditCardTab]   = useState<'results' | 'predictions'>('results')

  const [previousFindings, setPreviousFindings] = useState<any[] | undefined>(undefined)
  const [previousScore,    setPreviousScore]    = useState<number | undefined>(undefined)
  const [cycleCount,       setCycleCount]       = useState<number | undefined>(undefined)

  const [redesignVariations,    setRedesignVariations]    = useState<RedesignVariation[] | null>(null)
  const [activeVariationId,     setActiveVariationId]     = useState<'conservative' | 'comprehensive'>('comprehensive')
  const [redesignData,          setRedesignData]          = useState<AssessmentDiff | null>(null)
  const [isRequestingRedesign,  setIsRequestingRedesign]  = useState(false)
  const [editorFilterDimension, setEditorFilterDimension] = useState<string | undefined>(undefined)
  const [createError,           setCreateError]           = useState<string | null>(null)

  // Walkthrough state
  const [chosenVariation,  setChosenVariation]  = useState<RedesignVariation | null>(null)
  const [walkthroughSteps, setWalkthroughSteps] = useState<WalkthroughStep[]>([])
  const [walkthroughIdx,   setWalkthroughIdx]   = useState(0)
  const [acceptedDims,     setAcceptedDims]     = useState<Set<string>>(new Set())
  const [selectedImages,   setSelectedImages]   = useState<Map<string, string>>(new Map())
  const [isApplying,       setIsApplying]       = useState(false)
  const [parsedQuestions,  setParsedQuestions]  = useState<ParsedQuestion[]>([])
  const [savedItems,          setSavedItems]          = useState<RedesignItem[]>([])
  const [savedItemKeys,       setSavedItemKeys]       = useState<Set<string>>(new Set())
  const [savingKey,           setSavingKey]           = useState<string | null>(null)
  const [isDownloading,       setIsDownloading]       = useState(false)

  const [showOverrideInput,  setShowOverrideInput]  = useState(false)
  const [overrideReason,     setOverrideReason]     = useState('')
  const [isOverriding,       setIsOverriding]       = useState(false)
  const [isConfirmingReaudit, setIsConfirmingReaudit] = useState(false)

  const [batchOpen,     setBatchOpen]     = useState(false)
  const [isReuploading, setIsReuploading] = useState(false)
  const [countdown,     setCountdown]     = useState<number | null>(null)

  const [previewOpen,     setPreviewOpen]     = useState(false)
  const [previewOriginal, setPreviewOriginal] = useState('')
  const [previewRevised,  setPreviewRevised]  = useState('')
  const [isExpanded,      setIsExpanded]      = useState(false)

  const mirrorEditorRef         = useRef<MirrorEditorHandle>(null)
  const reuploadInputFlaggedRef = useRef<HTMLInputElement>(null)

  const pollRef            = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasInitializedView = useRef(false)
  const countdownRef       = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPoll = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  const stopCountdown = () => {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null }
    setCountdown(null)
  }

  const applyAuditHistory = (history: AuditHistoryEntry[]) => {
    if (!history || history.length === 0) return
    const latest = history[history.length - 1]
    setCycleCount(latest.cycle_number)
    if (history.length >= 2) {
      const previous = history[history.length - 2]
      setPreviousFindings(previous.findings)
      setPreviousScore(previous.overall_score)
    } else {
      setPreviousFindings(undefined)
      setPreviousScore(undefined)
    }
  }

  const applyRedesignDiff = (auditPayload: any) => {
    if (auditPayload?.redesign_variations) {
      setRedesignVariations(auditPayload.redesign_variations as RedesignVariation[])
    }
  }

  useEffect(() => { setClassList(classes ?? []) }, [classes])

  useEffect(() => {
    setIsLoadingCurricula(true)
    getCurricula()
      .then(({ data }) => { if (data) setCurricula(data) })
      .finally(() => setIsLoadingCurricula(false))
  }, [])

  // Sync subject field and auto-select curriculum whenever the dialog opens
  // or when curricula finish loading (in case they weren't ready on open).
  useEffect(() => {
    if (!open) return

    // Fix 1: push the known subject into the form (defaultValues only run on mount)
    if (initialCourseId) {
      form.setValue('courseId', initialCourseId)
    }

    // Fix 2: auto-select curriculum when it can be inferred
    if (curricula.length === 0 || form.getValues('curriculumId')) return

    if (curricula.length === 1) {
      form.setValue('curriculumId', curricula[0].id)
      return
    }

    // Match by subject name if multiple curricula exist
    if (initialCourseId) {
      const subject = (subjects ?? []).find(s => s.id === initialCourseId)
      if (subject) {
        const match = curricula.find(
          c => c.subject.toLowerCase() === subject.name.toLowerCase()
        )
        if (match) form.setValue('curriculumId', match.id)
      }
    }
  }, [open, curricula, initialCourseId])

  // Countdown when audit passes — only opens grading dialog, does NOT close exam dialog
  useEffect(() => {
    if (view !== 'audit_passed') { stopCountdown(); return }
    setCountdown(6)
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          stopCountdown()
          setBatchOpen(true)
          return null
        }
        return prev - 1
      })
    }, 1000)
    return stopCountdown
  }, [view])

  useEffect(() => {
    if (!open) { softReset(); return }
    if (hasInitializedView.current) return
    hasInitializedView.current = true

    const assessmentId = assessment?.assessment_id
    if (assessmentId)        setCreatedId(assessmentId)
    if (assessment?.classId) setCreatedClassId(assessment.classId)

    if (initialViewProp && initialViewProp !== 'form') {
      setView(initialViewProp)
      if (assessmentId) {
        getLatestAudit(assessmentId).then(({ data }) => {
          if (data) {
            setAuditResult(data)
            applyRedesignDiff(data)
          } else if (latestAuditProp) {
            setAuditResult(latestAuditProp)
            applyRedesignDiff(latestAuditProp)
          }
        })
        getAuditHistory(assessmentId).then(({ data }) => {
          if (data) applyAuditHistory(data)
        })
      } else if (latestAuditProp) {
        setAuditResult(latestAuditProp)
        applyRedesignDiff(latestAuditProp)
      }
    }

    if (assessmentId) {
      getRedesignItems(assessmentId).then(({ data }) => {
        if (data && data.length > 0) {
          setSavedItems(data as RedesignItem[])
          setSavedItemKeys(new Set(data.map((i: RedesignItem) => `${i.section_label}::${i.title}`)))
        } else if (initialSavedItemsProp.length > 0) {
          setSavedItems(initialSavedItemsProp)
          setSavedItemKeys(new Set(initialSavedItemsProp.map(i => `${i.section_label}::${i.title}`)))
        }
      })
    } else if (initialSavedItemsProp.length > 0) {
      setSavedItems(initialSavedItemsProp)
      setSavedItemKeys(new Set(initialSavedItemsProp.map(i => `${i.section_label}::${i.title}`)))
    }
  }, [open])

  const softReset = () => {
    stopPoll()
    stopCountdown()
    setView('form')
    setAuditSteps(INITIAL_STEPS); setAuditProgress(0); setAuditError(null)
    setAuditCardTab('results')
    setRedesignData(null); setRedesignVariations(null); setActiveVariationId('comprehensive')
    setEditorFilterDimension(undefined); setCreateError(null)
    setPdfPreview(undefined)
    setShowOverrideInput(false); setOverrideReason('')
    setPreviousFindings(undefined); setPreviousScore(undefined); setCycleCount(undefined)
    setPreviewOpen(false); setPreviewOriginal(''); setPreviewRevised('')
    setIsExpanded(false)
    setChosenVariation(null); setWalkthroughSteps([]); setWalkthroughIdx(0)
    setAcceptedDims(new Set()); setSelectedImages(new Map()); setIsApplying(false)
    setParsedQuestions([])
    hasInitializedView.current = false
    // Clear fields that are re-injected on open so auto-select runs cleanly next time
    if (!assessment) {
      form.setValue('courseId', '')
      form.setValue('curriculumId', '')
    }
  }

  const subjectList = subjects ?? []
  const noClasses   = classList.length === 0

  const form = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(assessment?.assessment_id ? updateSchema : createSchema),
    defaultValues: {
      title:           assessment?.title || '',
      courseId:        initialCourseId || '',
      classId:         assessment?.classId || initialClassId || '',
      curriculumId:    assessment?.curriculum_id || '',
      scheme:          undefined,
      enableAiGrading: assessment ? assessment.assessment_type === 'AI_ASSISTED_GRADING' : false,
    },
  })

  const watchedCurriculumId = form.watch('curriculumId')
  const activeCurriculum    = curricula.find(
    c => c.id === (assessment?.curriculum_id || watchedCurriculumId)
  )

  const handleClassReady = (cls: { class_id: string; name: string }) => {
    setClassList(prev => {
      const exists = prev.find(c => c.class_id === cls.class_id)
      return exists ? prev : [...prev, cls]
    })
    form.setValue('classId', cls.class_id)
    toast.success(`Class "${cls.name}" linked to this assessment.`)
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    form.setValue('scheme', file)
    const reader = new FileReader()
    reader.onloadend = () => setPdfPreview(reader.result as string)
    reader.readAsDataURL(file)
  }, [form])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/pdf': ['.pdf'] }, multiple: false, maxSize: 5 * 1024 * 1024,
  })

  const clearFile = () => { form.setValue('scheme', undefined as any); setPdfPreview(undefined) }

  const pollForAuditResult = (assessmentId: string) => {
    let stepIdx = 0
    const stepTimer = setInterval(() => {
      if (stepIdx < INITIAL_STEPS.length - 1) {
        stepIdx++
        const stepId = INITIAL_STEPS[stepIdx].id
        setAuditSteps(prev => prev.map(s => s.id === stepId ? { ...s, done: true } : s))
        setAuditProgress(Math.round(((stepIdx + 1) / INITIAL_STEPS.length) * 90))
      }
    }, 2500)

    let attempts = 0
    pollRef.current = setInterval(async () => {
      if (++attempts > 60) {
        clearInterval(stepTimer); stopPoll()
        toast.error('Audit timed out. Please try again.')
        setView('audit_flagged')
        return
      }
      const { data } = await getLatestAudit(assessmentId)
      if (!data || !data.status) return

      clearInterval(stepTimer); stopPoll()
      setAuditSteps(prev => prev.map(s => ({ ...s, done: true }))); setAuditProgress(100)

      await new Promise(r => setTimeout(r, 2000))
      const { data: finalData } = await getLatestAudit(assessmentId)
      const resolved = finalData ?? data
      setAuditResult(resolved)
      applyRedesignDiff(resolved)

      const { data: history } = await getAuditHistory(assessmentId)
      if (history) applyAuditHistory(history)

      router.refresh()
      setAuditCardTab('results')
      setView(resolved.status === 'passed' ? 'audit_passed' : 'audit_flagged')
    }, 4000)
  }

  const triggerAndPollAudit = async (assessmentId: string) => {
    const { error } = await triggerAudit(assessmentId)
    if (error) { toast.error('Failed to start audit.', { description: error.message }); setView('form'); return }
    pollForAuditResult(assessmentId)
  }

  async function onSubmit(data: z.infer<typeof createSchema>) {
    setCreateError(null)
    setAuditSteps(INITIAL_STEPS); setAuditProgress(0)
    setView('auditing')

    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('courseId', data.courseId)
    formData.append('classId', data.classId)
    formData.append('curriculumId', data.curriculumId)
    if (data.scheme) formData.append('scheme', data.scheme)
    if (data.enableAiGrading !== undefined) formData.append('enableAiGrading', String(data.enableAiGrading))

    const { data: saved, error } = await createAssessment(formData)

    if (error) {
      toast.error(error.message)
      setCreateError(error.message)
      setAuditSteps(INITIAL_STEPS); setAuditProgress(0)
      setView('form')
      return
    }
    if (saved) {
      setAuditSteps(prev => prev.map(s => s.id === 'upload' ? { ...s, done: true } : s))
      setAuditProgress(18)
      setCreatedId(saved.id); setCreatedClassId(data.classId)
      router.refresh()
      triggerAndPollAudit(saved.id)
    }
  }

  const launchWalkthrough = (variation: RedesignVariation, pqs: ParsedQuestion[]) => {
    const steps = buildSteps(variation.diff as any)
    if (steps.length === 0) return
    setChosenVariation(variation)
    setWalkthroughSteps(steps)
    setWalkthroughIdx(0)
    setAcceptedDims(new Set())
    setSelectedImages(new Map())
    setParsedQuestions(pqs)
    setView('review_walkthrough')
  }

  const handleGetRedesign = async () => {
    if (!createdId) return
    if (chosenVariation && walkthroughSteps.length > 0) { setView('review_walkthrough'); return }
    if (redesignVariations) {
      const best = redesignVariations.reduce((a, b) => b.projected_score > a.projected_score ? b : a)
      launchWalkthrough(best, parsedQuestions)
      return
    }
    setIsRequestingRedesign(true)
    const { data, error } = await getRedesignSuggestions(createdId)
    setIsRequestingRedesign(false)
    if (error) return toast.error(error.message)
    if (data?.variations) {
      setRedesignVariations(data.variations)
      setParsedQuestions(data.parsedQuestions ?? [])
      const best = data.variations.reduce((a, b) => b.projected_score > a.projected_score ? b : a)
      launchWalkthrough(best, data.parsedQuestions ?? [])
    }
  }

  const handleApplyAllAuto = async () => {
    if (!createdId) return
    let variation = chosenVariation ?? redesignVariations?.reduce((a, b) => b.projected_score > a.projected_score ? b : a)
    if (!variation) {
      setIsRequestingRedesign(true)
      const { data, error } = await getRedesignSuggestions(createdId)
      setIsRequestingRedesign(false)
      if (error) return toast.error(error.message)
      if (!data?.variations) return
      setRedesignVariations(data.variations)
      variation = data.variations.reduce((a, b) => b.projected_score > a.projected_score ? b : a)
    }
    const allDims = [...new Set(
      variation.diff.insertions.map((i: any) => i.dimension).filter(Boolean) as string[]
    )]
    setIsApplying(true)
    const { error } = await applyPartial(createdId, variation.id, allDims)
    setIsApplying(false)
    if (error) return toast.error('Failed to apply fixes.', { description: error.message })
    setAuditSteps(INITIAL_STEPS); setAuditProgress(0); setAuditError(null)
    setView('auditing')
    toast.success('All fixes applied — re-auditing…')
    pollForAuditResult(createdId)
  }

  const handleWalkthroughAccept = (dimension: string) => {
    setAcceptedDims(prev => new Set([...prev, dimension]))
    if (walkthroughIdx < walkthroughSteps.length - 1) {
      setWalkthroughIdx(i => i + 1)
    } else {
      setView('review_summary')
    }
  }

  const handleWalkthroughSkip = () => {
    if (walkthroughIdx < walkthroughSteps.length - 1) {
      setWalkthroughIdx(i => i + 1)
    } else {
      setView('review_summary')
    }
  }

  const handleWalkthroughBack = () => {
    if (walkthroughIdx > 0) {
      setWalkthroughIdx(i => i - 1)
    } else {
      setView('audit_flagged')
    }
  }

  const handleToggleImage = (insertionId: string, imageUrl: string) => {
    setSelectedImages(prev => {
      const next = new Map(prev)
      if (next.has(insertionId) && next.get(insertionId) === imageUrl) {
        next.delete(insertionId)
      } else {
        next.set(insertionId, imageUrl)
      }
      return next
    })
  }

  const handleApplyPartial = async () => {
    if (!createdId || !chosenVariation) return
    const dims    = [...acceptedDims]
    const images  = [...selectedImages.entries()].map(([insertionId, imageUrl]) => ({ insertionId, imageUrl }))
    setIsApplying(true)
    const { error } = await applyPartial(createdId, chosenVariation.id, dims, images)
    setIsApplying(false)
    if (error) return toast.error('Failed to apply changes.', { description: error.message })
    setAuditSteps(INITIAL_STEPS); setAuditProgress(0); setAuditError(null)
    setView('auditing')
    toast.success(`${dims.length} dimension${dims.length !== 1 ? 's' : ''} applied — re-auditing…`)
    pollForAuditResult(createdId)
  }

  const handleSelectVariation = (variationId: 'conservative' | 'comprehensive') => {
    const variation = redesignVariations?.find(v => v.id === variationId)
    if (!variation) return
    setActiveVariationId(variationId)
    setRedesignData(variation.diff)
  }

  const handleConfirmAndReaudit = async () => {
    if (!createdId || !mirrorEditorRef.current) return
    const html = mirrorEditorRef.current.getHTML()
    setIsConfirmingReaudit(true)
    const { error } = await confirmRedesign(createdId, html)
    setIsConfirmingReaudit(false)
    if (error) return toast.error('Failed to confirm redesign.', { description: error.message })
    setAuditSteps(INITIAL_STEPS); setAuditProgress(0); setAuditError(null)
    setRedesignVariations(null)
    setView('auditing')
    toast.success('Redesign confirmed — re-auditing…')
    triggerAndPollAudit(createdId)
  }

  // Editor confirm: open preview instead of downloading directly
  const handleEditorConfirm = (
    html: string,
    _acceptedImages: Array<{ image_url: string | null; position: number }>,
  ) => {
    setPreviewOriginal(redesignData?.documentContent ?? '')
    setPreviewRevised(html)
    setPreviewOpen(true)
  }

  const handlePreviewDownload = async () => {
    if (!createdId) return
    const html           = previewRevised
    const acceptedImages = mirrorEditorRef.current?.getAcceptedImages() ?? []

    setIsDownloading(true)
    try {
      await fetch(
        `/api/v1/assessments/${createdId}/audit/redesign/confirm`,
        {
          method:      'POST',
          credentials: 'include',
          headers:     { 'Content-Type': 'application/json' },
          body:        JSON.stringify({ html }),
        },
      )

      const res = await fetch(
        `/api/v1/assessments/${createdId}/audit/redesign/export`,
        {
          method:      'POST',
          credentials: 'include',
          headers:     { 'Content-Type': 'application/json' },
          body:        JSON.stringify({ html, imageCandidates: acceptedImages }),
        },
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `blueprint-${createdId.slice(0, 8)}.docx`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setPreviewOpen(false)
      toast.success('Blueprint downloaded. Assessment updated.')
    } catch {
      toast.error('Failed to export blueprint.')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleOverride = async () => {
    if (!createdId) return
    if (!overrideReason.trim()) return toast.warning('Please provide a reason to override.')
    setIsOverriding(true)
    const { error } = await overrideAudit(createdId, overrideReason)
    setIsOverriding(false)
    if (error) return toast.error(error.message)
    toast.success('Audit overridden — proceeding to grading.')
    setShowOverrideInput(false)
    setOverrideReason('')
    const _id      = createdId
    const _classId = createdClassId
    onOpenChange(false)
    softReset()
    form.reset()
    if (_id && _classId) setBatchOpen(true)
  }

  const handleAddItem = async (action: any, sug: any) => {
    if (!createdId) return
    const key = `${sug.section_label}::${action.title}`
    setSavingKey(key)
    const newItem: RedesignItem = {
      section_label:           sug.section_label,
      dimension:               action.dimension,
      issue_summary:           sug.issue_summary,
      title:                   action.title,
      description:             action.description,
      marking_guide:           action.marking_guide || 'No marking guide provided.',
      action_type:             action.action_type,
      marks:                   Number(action.marks),
      bloom_level:             action.bloom_level,
      command_word:            action.command_word,
      assessment_objective_id: action.assessment_objective_id,
      syllabus_topic:          action.syllabus_topic,
      example_question_stem:   action.example_question_stem,
    }
    const updatedItems = [...savedItems, newItem]
    const { error } = await saveRedesignItems(createdId, updatedItems)
    setSavingKey(null)
    if (error) return toast.error('Failed to save item.', { description: error.message })
    setSavedItems(updatedItems)
    setSavedItemKeys(new Set([...savedItemKeys, key]))
    toast.success('Item added to assessment items.')
  }

  const handleRemoveItem = async (itemToRemove: RedesignItem) => {
    if (!createdId) return
    const key = `${itemToRemove.section_label}::${itemToRemove.title}`
    setSavingKey(key)
    const updatedItems = savedItems.filter(i => `${i.section_label}::${i.title}` !== key)
    const { error } = await saveRedesignItems(createdId, updatedItems)
    setSavingKey(null)
    if (error) return toast.error('Failed to remove item.', { description: error.message })
    setSavedItems(updatedItems)
    setSavedItemKeys(prev => { const next = new Set(prev); next.delete(key); return next })
    toast.success('Item removed.')
  }

  const handleClearAllItems = async () => {
    if (!createdId || savedItems.length === 0) return
    if (!confirm('Are you sure you want to clear all saved items?')) return
    const { error } = await saveRedesignItems(createdId, [])
    if (error) return toast.error('Failed to clear items.')
    setSavedItems([])
    setSavedItemKeys(new Set())
    toast.success('All items cleared.')
  }

  const handleDownloadDocx = async () => {
    if (!createdId || savedItems.length === 0) return toast.warning('Add at least one item first.')
    setIsDownloading(true)
    try {
      const res = await fetch(
        `/api/v1/assessments/${createdId}/audit/redesign-items/download`,
        { credentials: 'include' },
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `assessment-blueprint-${createdId.slice(0, 8)}.docx`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Assessment items downloaded.')
    } catch {
      toast.error('Failed to download assessment items.')
    } finally { setIsDownloading(false) }
  }

  const handleReuploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!createdId) return
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setIsReuploading(true)
    const formData = new FormData()
    formData.append('file', file)
    const { error } = await reuploadAssessment(createdId, formData)
    setIsReuploading(false)
    if (error) return toast.error('Reupload failed', { description: error.message })

    setAuditSteps(INITIAL_STEPS); setAuditProgress(0); setAuditError(null)
    setShowOverrideInput(false); setOverrideReason('')

    setView('auditing')
    toast.success('Assessment replaced — re-auditing…')
    pollForAuditResult(createdId)
  }

  const handleClose = () => {
    form.reset()
    softReset()
    onOpenChange(false)
  }

  const handleStepClick = (stepId: string) => {
    if (stepId === 'audit' && (view === 'review_walkthrough' || view === 'review_summary' || view === 'saved_redesign_items')) {
      setView(auditResult?.status === 'passed' ? 'audit_passed' : 'audit_flagged')
    }
  }

  const schemeValue = form.watch('scheme')

  const isWide = view === 'form' || view === 'saved_redesign_items'

  const tabActive   = 'bg-white dark:bg-[#2d2a25] shadow-sm text-[#7a6230] dark:text-[#c9a84c]'
  const tabInactive = 'text-[#a8893d]/70 hover:text-[#7a6230] dark:hover:text-[#c9a84c]'
  const assessmentItemsBtn = cn(
    'gap-1.5 shrink-0 border-[#e8d5a3] hover:bg-[#f5edda] dark:border-[#c9a84c]/30 dark:hover:bg-[#c9a84c]/10',
    savedItems.length > 0 ? 'text-[#7a6230] dark:text-[#c9a84c]' : 'text-muted-foreground',
  )

  const activeVariation = redesignVariations?.find(v => v.id === activeVariationId)

  return (
    <>
      <Dialog open={open} onOpenChange={v => {
        if (!v && countdown !== null) { stopCountdown(); return }
        if (!v) handleClose()
      }}>
        <DialogContent className={cn(
          'flex flex-col p-0 transition-all duration-300 overflow-hidden',
          isExpanded
            ? 'sm:max-w-[95vw] w-[95vw] h-[94vh] max-h-[94vh]'
            : isWide
              ? 'sm:max-w-[680px] max-h-[88vh]'
              : 'sm:max-w-[560px] max-h-[88vh]',
        )}>
          {/* Expand / collapse button — sits left of the shadcn close button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setIsExpanded(e => !e)}
                  className="absolute right-10 top-4 z-50 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {isExpanded
                    ? <Minimize2 className="h-4 w-4" />
                    : <Maximize2 className="h-4 w-4" />}
                  <span className="sr-only">{isExpanded ? 'Collapse' : 'Expand'}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-[11px]">
                {isExpanded ? 'Collapse view' : 'Expand to full view'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* ════════════════════════════════════════════════════════════
              VIEW: FORM
          ════════════════════════════════════════════════════════════ */}
          {view === 'form' && (
            <>
              <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
                <DialogTitle>{assessment?.assessment_id ? 'Edit Assessment' : 'Create Assessment'}</DialogTitle>
                <DialogDescription>Create a new assessment and link it to a curriculum framework.</DialogDescription>
              </DialogHeader>

              {createError && (
                <div className="mx-6 mt-4 flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 shrink-0">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <p className="text-xs"><span className="font-semibold">Previous attempt failed:</span> {createError}</p>
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-6">
                <Form {...form}>
                  <form id="exam-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="title" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl><Input placeholder="e.g., Mid-Term Biology Exam" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="curriculumId" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <BookOpen className="h-3.5 w-3.5 text-primary" />Curriculum Framework
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={isLoadingCurricula ? 'Loading…' : 'Select framework…'} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {curricula.map(c => <SelectItem key={c.id} value={c.id}>{c.display_name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="courseId" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Internal Subject</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={disableCourseSelect}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={subjectList.length === 0 ? 'No subjects' : 'Select…'} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {subjectList.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="classId" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class</FormLabel>
                          {noClasses && !disableClassSelect ? (
                            <Button type="button" variant="outline" size="sm"
                              className="w-full h-9 gap-2 border-[#e8d5a3] text-[#7a6230] hover:bg-[#f5edda] text-xs"
                              onClick={() => setInlineClassOpen(true)}>
                              <School className="h-3.5 w-3.5" />Create a class first
                            </Button>
                          ) : (
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={disableClassSelect}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select…">
                                    {field.value ? classList.find(c => c.class_id === field.value)?.name ?? 'Select…' : 'Select…'}
                                  </SelectValue>
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {classList.map(c => <SelectItem key={c.class_id} value={c.class_id}>{c.name}</SelectItem>)}
                                {!disableClassSelect && (
                                  <div className="flex items-center gap-2 px-3 py-2 text-xs text-primary cursor-pointer hover:bg-muted border-t mt-1"
                                    onClick={() => setInlineClassOpen(true)}>
                                    <School className="h-3.5 w-3.5" />Create new class…
                                  </div>
                                )}
                              </SelectContent>
                            </Select>
                          )}
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <FormField control={form.control} name="scheme" render={() => (
                      <FormItem>
                        <FormLabel>Marking Guide (PDF)</FormLabel>
                        <FormControl>
                          <div {...getRootProps({ className: cn(
                            'relative cursor-pointer rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 transition-colors hover:border-gray-400',
                            isDragActive && 'border-[#c9a84c] bg-[#f5edda]/40',
                          )})}>
                            <input {...getInputProps()} />
                            <div className="flex flex-col items-center justify-center gap-2 text-center">
                              <Upload className="h-8 w-8 text-muted-foreground" />
                              {schemeValue || pdfPreview ? (
                                <div className="relative w-full max-w-sm">
                                  <div className="flex items-center justify-between rounded-md border bg-muted p-2">
                                    <div className="flex items-center gap-2">
                                      <div className="h-10 w-10 shrink-0 rounded bg-white overflow-hidden">
                                        <embed src={pdfPreview} type="application/pdf" className="h-full w-full" />
                                      </div>
                                      <div className="flex flex-col text-left">
                                        <p className="text-sm font-medium truncate max-w-[150px]">{schemeValue?.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {((schemeValue?.size ?? 0) / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                      </div>
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8"
                                      onClick={e => { e.stopPropagation(); clearFile() }}>
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm">
                                  <p className="font-medium">{isDragActive ? 'Drop the file here' : 'Click or drag & drop'}</p>
                                  <p className="text-muted-foreground">PDF file (max 5MB)</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="enableAiGrading" render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Enable AI-Assisted Grading</FormLabel>
                          <FormDescription>Let Mirror grade student submissions for this assessment.</FormDescription>
                        </div>
                      </FormItem>
                    )} />
                  </form>
                </Form>
              </div>

              <DialogFooter className="px-6 py-4 border-t shrink-0">
                <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
                <Button type="submit" form="exam-form" disabled={form.formState.isSubmitting}
                  className="gap-2 border-0 text-white"
                  style={{ background: form.formState.isSubmitting ? '#a8893d' : '#c9a84c' }}>
                  {form.formState.isSubmitting
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Creating…</>
                    : <><Sparkles className="h-4 w-4" />Create & Audit</>}
                </Button>
              </DialogFooter>
            </>
          )}

          {/* ════════════════════════════════════════════════════════════
              VIEW: AUDITING
          ════════════════════════════════════════════════════════════ */}
          {view === 'auditing' && (
            <>
              <StepIndicator view={view} onStepClick={handleStepClick} />
              <DialogHeader className="px-6 pt-3 pb-4 border-b shrink-0" style={{ background: 'linear-gradient(to bottom, #f5edda60, transparent)' }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2" style={{ color: '#c9a84c' }}>
                    <Brain className="h-5 w-5 animate-pulse" />
                    <DialogTitle>Auditing Assessment Quality</DialogTitle>
                  </div>
                  <CurriculumBadge name={activeCurriculum?.display_name} />
                </div>
                <DialogDescription>Checking your marking guide against the curriculum framework…</DialogDescription>
              </DialogHeader>

              <div className="flex-1 px-6 py-8 flex flex-col gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span className="tabular-nums font-medium">{auditProgress}%</span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full" style={{ background: '#e8d5a3' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${auditProgress}%`, background: '#c9a84c' }} />
                  </div>
                </div>

                <div className="space-y-3">
                  {auditSteps.map((step, i) => {
                    const isActive = !step.done && auditSteps.slice(0, i).every(s => s.done)
                    return (
                      <div key={step.id} className={cn(
                        'flex items-center gap-3 rounded-lg px-4 py-3 border transition-all duration-300',
                        step.done  && 'border-[#e8d5a3] bg-[#f5edda]/60 dark:bg-[#c9a84c]/8',
                        isActive   && 'border-[#c9a84c]/40 bg-[#f5edda]/30 dark:bg-[#c9a84c]/5',
                        !step.done && !isActive && 'border-transparent opacity-40',
                      )}>
                        <div className="shrink-0">
                          {step.done
                            ? <CheckCircle2 className="h-4 w-4" style={{ color: '#c9a84c' }} />
                            : isActive
                              ? <Loader2 className="h-4 w-4 animate-spin" style={{ color: '#c9a84c' }} />
                              : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />}
                        </div>
                        <span className={cn('text-sm',
                          step.done  && 'font-medium text-[#7a6230] dark:text-[#c9a84c]',
                          isActive   && 'font-medium text-[#a8893d]',
                          !step.done && !isActive && 'text-muted-foreground',
                        )}>
                          {step.label}
                        </span>
                        {step.done  && <span className="ml-auto text-xs font-medium" style={{ color: '#c9a84c' }}>Done</span>}
                        {isActive   && <span className="ml-auto text-xs text-[#a8893d]/70 animate-pulse">Running…</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* ════════════════════════════════════════════════════════════
              VIEW: AUDIT PASSED
          ════════════════════════════════════════════════════════════ */}
          {view === 'audit_passed' && (
            <>
              <StepIndicator view={view} onStepClick={handleStepClick} />
              <div className="px-6 pt-3 pb-0 border-b shrink-0"
                style={{ background: 'linear-gradient(160deg, #f5edda 0%, #fffdf8 100%)' }}>
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div>
                    <div className="flex items-center gap-2 mb-1" style={{ color: '#c9a84c' }}>
                      <PartyPopper className="h-5 w-5" />
                      <h2 className="text-lg font-semibold leading-none tracking-tight">Assessment Approved!</h2>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Your assessment meets curriculum standards.
                      </p>
                      <ScoreDelta from={previousScore} to={auditResult?.overall_score} />
                    </div>
                    <CurriculumBadge name={activeCurriculum?.display_name} />
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" className={assessmentItemsBtn} onClick={() => setView('saved_redesign_items')}>
                          <ClipboardList className="h-3.5 w-3.5" />Assessment Items ({savedItems.length})
                        </Button>
                      </TooltipTrigger>
                      {savedItems.length === 0 && (
                        <TooltipContent className="text-[11px]">Accept suggestions to build your item list</TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="flex gap-1 p-1 rounded-lg w-fit mt-4 mb-4" style={{ background: '#e8d5a340' }}>
                  <button onClick={() => setAuditCardTab('results')}
                    className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150',
                      auditCardTab === 'results' ? tabActive : tabInactive)}>
                    <ShieldCheck className="h-3.5 w-3.5" />Audit Results
                  </button>
                  {auditResult?.prediction && (
                    <button onClick={() => setAuditCardTab('predictions')}
                      className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150',
                        auditCardTab === 'predictions' ? tabActive : tabInactive)}>
                      <TrendingUp className="h-3.5 w-3.5" />Predictions
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 px-6 py-5 overflow-y-auto min-h-0">
                {auditCardTab === 'results' && auditResult && (
                  <div className="animate-in fade-in duration-200">
                    <AuditCard
                      overallScore={auditResult.overall_score}
                      findings={auditResult.findings}
                      status="passed"
                      previousFindings={previousFindings}
                      cycleCount={cycleCount}
                    />
                  </div>
                )}
                {auditCardTab === 'predictions' && auditResult?.prediction && (
                  <div className="animate-in fade-in duration-200">
                    <PredictionCard prediction={auditResult.prediction} status="passed" />
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t shrink-0 flex flex-col gap-2" style={{ background: '#f5edda18' }}>
                <div className="flex gap-2">
                  <Button className="flex-1 gap-2 border-0 text-white"
                    style={{ background: '#c9a84c' }}
                    onClick={() => { stopCountdown(); onOpenChange(false); softReset(); form.reset(); setBatchOpen(true) }}>
                    <ArrowRight className="h-4 w-4" />Start Grading Students
                  </Button>
                  {countdown !== null && (
                    <Button variant="outline" size="sm" className="shrink-0 gap-1.5 text-muted-foreground"
                      onClick={stopCountdown}>
                      Not yet ✕
                    </Button>
                  )}
                </div>
                {countdown !== null && (
                  <p className="text-center text-xs text-muted-foreground animate-in fade-in">
                    Starting grading in {countdown}…
                  </p>
                )}
                <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground"
                  onClick={() => handleClose()}>
                  Close
                </Button>
              </div>
            </>
          )}

          {/* ════════════════════════════════════════════════════════════
              VIEW: AUDIT FLAGGED
          ════════════════════════════════════════════════════════════ */}
          {view === 'audit_flagged' && (
            <>
              <StepIndicator view={view} onStepClick={handleStepClick} />
              <DialogHeader className="px-6 pt-3 pb-0 border-b shrink-0"
                style={{ background: 'linear-gradient(160deg, #fff8ec 0%, #fffdf8 100%)' }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2" style={{ color: '#a8893d' }}>
                    <AlertTriangle className="h-5 w-5" />
                    <DialogTitle>Assessment Quality Audit</DialogTitle>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" className={assessmentItemsBtn} onClick={() => setView('saved_redesign_items')}>
                          <ClipboardList className="h-3.5 w-3.5" />Assessment Items ({savedItems.length})
                        </Button>
                      </TooltipTrigger>
                      {savedItems.length === 0 && (
                        <TooltipContent className="text-[11px]">Accept suggestions to build your item list</TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <DialogDescription className="mb-0">
                    This assessment deviates from the curriculum schema.
                  </DialogDescription>
                  {auditResult?.overall_score !== undefined && previousScore !== undefined && (
                    <ScoreDelta from={previousScore} to={auditResult.overall_score} />
                  )}
                </div>
                <div className="mb-3">
                  <CurriculumBadge name={activeCurriculum?.display_name} />
                </div>

                <div className="flex gap-1 p-1 rounded-lg w-fit mb-4" style={{ background: '#e8d5a340' }}>
                  <button onClick={() => setAuditCardTab('results')}
                    className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                      auditCardTab === 'results' ? tabActive : tabInactive)}>
                    <AlertTriangle className="h-3.5 w-3.5" />Audit Results
                  </button>
                  {auditResult?.prediction && (
                    <button onClick={() => setAuditCardTab('predictions')}
                      className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                        auditCardTab === 'predictions' ? tabActive : tabInactive)}>
                      <TrendingUp className="h-3.5 w-3.5" />Predictions
                    </button>
                  )}
                </div>
              </DialogHeader>

              <div className="flex-1 px-6 py-6 flex flex-col min-h-0 overflow-y-auto">
                {!auditResult ? (
                  <div className="flex flex-col items-center justify-center flex-1 gap-4">
                    <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#c9a84c' }} />
                    <p className="text-sm text-muted-foreground">Loading audit findings…</p>
                  </div>
                ) : (
                  <>
                    {auditCardTab === 'results' && (
                      <div className="animate-in fade-in duration-200">
                        <AuditCard
                          overallScore={auditResult.overall_score}
                          findings={auditResult.findings}
                          status="flagged"
                          previousFindings={previousFindings}
                          cycleCount={cycleCount}
                          onFixDimension={() => handleGetRedesign()}
                        />
                      </div>
                    )}
                    {auditCardTab === 'predictions' && auditResult?.prediction && (
                      <div className="animate-in fade-in duration-200">
                        <PredictionCard prediction={auditResult.prediction} status="flagged" />
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="px-6 py-4 border-t shrink-0" style={{ background: '#fff8ec80' }}>
                {showOverrideInput ? (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-2 mb-2 rounded-md px-3 py-2 border"
                      style={{ borderColor: '#e8d5a3', background: '#f5edda60' }}>
                      <ShieldAlert className="w-4 h-4 shrink-0" style={{ color: '#a8893d' }} />
                      <span className="text-sm font-semibold" style={{ color: '#7a6230' }}>Liability Override</span>
                    </div>
                    <Textarea
                      placeholder="Provide a reason for overriding the audit result…"
                      value={overrideReason}
                      onChange={e => setOverrideReason(e.target.value)}
                      className="text-sm bg-background mb-3 min-h-[72px] resize-none"
                      style={{ borderColor: '#e8d5a3' }}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setShowOverrideInput(false); setOverrideReason('') }}>Cancel</Button>
                      <Button size="sm" disabled={isOverriding}
                        className="gap-2 border-0 text-white"
                        style={{ background: isOverriding ? '#a8893d' : '#c9a84c' }}
                        onClick={handleOverride}>
                        {isOverriding ? <><Loader2 className="w-4 h-4 animate-spin" />Overriding…</> : <><ArrowRight className="w-4 h-4" />Confirm & Grade</>}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <input ref={reuploadInputFlaggedRef} type="file" accept=".pdf" className="hidden" onChange={handleReuploadFile} />
                      <Button variant="outline" size="sm" className="gap-2 text-muted-foreground text-xs"
                        disabled={isReuploading} onClick={() => reuploadInputFlaggedRef.current?.click()}>
                        {isReuploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        Upload different PDF
                      </Button>
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <Button size="sm" onClick={handleGetRedesign} disabled={isRequestingRedesign || isApplying} className="gap-2 border-0 text-white w-full" style={{ background: '#c9a84c' }}>
                        {isRequestingRedesign
                          ? <><Loader2 className="w-4 h-4 animate-spin" />Preparing suggestions…</>
                          : <><Wrench className="w-4 h-4" />Review &amp; Fix Issues →</>}
                      </Button>
                      <div className="flex justify-between items-center">
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs" onClick={() => setShowOverrideInput(true)}>Grade Anyway</Button>
                        <button
                          className="text-xs text-[#a8893d] hover:text-[#7a6230] underline underline-offset-2 disabled:opacity-40"
                          disabled={isRequestingRedesign || isApplying}
                          onClick={handleApplyAllAuto}
                        >
                          {isApplying ? 'Applying…' : 'Apply all fixes automatically'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ════════════════════════════════════════════════════════════
              VIEW: REVIEW WALKTHROUGH
          ════════════════════════════════════════════════════════════ */}
          {view === 'review_walkthrough' && chosenVariation && walkthroughSteps.length > 0 && (
            <>
              <StepIndicator view={view} onStepClick={handleStepClick} />
              <div className="flex-1 overflow-hidden">
                <ReviewWalkthrough
                  variation={chosenVariation}
                  parsedQuestions={parsedQuestions}
                  currentIdx={walkthroughIdx}
                  steps={walkthroughSteps}
                  acceptedDims={acceptedDims}
                  selectedImages={selectedImages}
                  onAccept={handleWalkthroughAccept}
                  onSkip={handleWalkthroughSkip}
                  onBack={handleWalkthroughBack}
                  onToggleImage={handleToggleImage}
                />
              </div>
            </>
          )}

          {/* ════════════════════════════════════════════════════════════
              VIEW: REVIEW SUMMARY
          ════════════════════════════════════════════════════════════ */}
          {view === 'review_summary' && chosenVariation && (
            <>
              <StepIndicator view={view} onStepClick={handleStepClick} />
              <div className="flex-1 overflow-hidden">
                <ReviewSummary
                  steps={walkthroughSteps}
                  acceptedDims={acceptedDims}
                  currentScore={auditResult?.overall_score ?? 0}
                  projectedScore={chosenVariation.projected_score}
                  isApplying={isApplying}
                  onApply={handleApplyPartial}
                  onGoBack={() => { setWalkthroughIdx(walkthroughSteps.length - 1); setView('review_walkthrough') }}
                />
              </div>
            </>
          )}

          {/* ════════════════════════════════════════════════════════════
              VIEW: SAVED REDESIGN ITEMS
          ════════════════════════════════════════════════════════════ */}
          {view === 'saved_redesign_items' && (() => {
            const grouped = savedItems.reduce<Record<string, RedesignItem[]>>((acc, item) => {
              ;(acc[item.section_label] ??= []).push(item); return acc
            }, {})
            return (
              <>
                <StepIndicator view={view} onStepClick={handleStepClick} />
                <DialogHeader className="px-6 pt-3 pb-4 border-b shrink-0"
                  style={{ background: 'linear-gradient(to bottom, #f5edda, transparent)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1" style={{ color: '#c9a84c' }}>
                        <ClipboardList className="h-5 w-5" />
                        <DialogTitle>Saved Assessment Items</DialogTitle>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <DialogDescription className="mb-0">
                          {savedItems.length === 0 ? 'No items saved yet.' : `${savedItems.length} item${savedItems.length !== 1 ? 's' : ''} ready for download.`}
                        </DialogDescription>
                        <CurriculumBadge name={activeCurriculum?.display_name} />
                      </div>
                    </div>
                    {savedItems.length > 0 && (
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5" onClick={handleClearAllItems}>
                        <Trash2 className="h-3.5 w-3.5" />Clear All
                      </Button>
                    )}
                  </div>
                </DialogHeader>

                <div className="flex-1 px-6 py-6 overflow-y-auto">
                  {savedItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: '#f5edda' }}>
                        <ClipboardList className="h-6 w-6" style={{ color: '#c9a84c' }} />
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                        Your assessment items list is empty. Go back and click <strong>Fix My Assessment</strong> to get AI suggestions.
                      </p>
                      <Button variant="outline" size="sm" className="gap-2 text-[#7a6230] border-[#e8d5a3] hover:bg-[#f5edda]"
                        onClick={() => setView('audit_flagged')}>
                        <ArrowLeft className="h-3.5 w-3.5" />Back to Audit
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(grouped).map(([section, items]) => (
                        <div key={section} className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: '#c9a84c' }}>
                            <ClipboardList className="w-3.5 h-3.5" />{section}
                            <span className="ml-auto font-normal normal-case text-muted-foreground">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                          </h4>
                          <div className="grid gap-3 pl-4 border-l-2" style={{ borderColor: '#e8d5a3' }}>
                            {items.map((item, j) => {
                              const key = `${item.section_label}::${item.title}`
                              const isRemoving = savingKey === key
                              return (
                                <div key={j} className="bg-card rounded-md p-3 shadow-sm border group" style={{ borderColor: '#e8d5a3' }}>
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <span className="font-bold text-sm flex-1">{item.title}</span>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <Badge className={cn('border-none text-[9px] uppercase tracking-tighter', ACTION_TYPE_COLORS[item.action_type] ?? 'bg-[#f5edda] text-[#7a6230]')}>{item.action_type.replace('_', ' ')}</Badge>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" disabled={isRemoving} onClick={() => handleRemoveItem(item)}>
                                        {isRemoving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                      </Button>
                                    </div>
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{item.description}</p>
                                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground mt-3">
                                    <span><strong>{item.marks}</strong> marks</span>
                                    <span>Bloom: <strong>{item.bloom_level}</strong></span>
                                    <span>CW: <strong>{item.command_word}</strong></span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-muted/10 shrink-0">
                  <div className="flex items-center justify-between w-full gap-3">
                    <Button variant="outline" size="sm" className="gap-1.5"
                      onClick={() => setView(chosenVariation ? 'review_summary' : 'audit_flagged')}>
                      <ArrowLeft className="h-3.5 w-3.5" />Back
                    </Button>
                    <Button size="sm" className="gap-2 border-0 text-white" style={{ background: '#c9a84c' }} disabled={isDownloading || savedItems.length === 0} onClick={handleDownloadDocx}>
                      {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      {isDownloading ? 'Generating…' : `Download Blueprint (${savedItems.length})`}
                    </Button>
                  </div>
                </DialogFooter>
              </>
            )
          })()}

        </DialogContent>
      </Dialog>

      <BlueprintPreviewDialog
        open={previewOpen}
        originalHtml={previewOriginal}
        revisedHtml={previewRevised}
        onDownload={handlePreviewDownload}
        onClose={() => setPreviewOpen(false)}
        isDownloading={isDownloading}
      />

      <InlineClassDialog open={inlineClassOpen} onOpenChange={setInlineClassOpen} existingClasses={classList} onClassReady={handleClassReady} />

      {createdId && createdClassId && (
        <BatchGradingDialog
          open={batchOpen}
          onOpenChange={setBatchOpen}
          assessmentId={createdId}
          classId={createdClassId}
          initialView="upload"
        />
      )}
    </>
  )
}
