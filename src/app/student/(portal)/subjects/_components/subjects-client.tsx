'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpenCheck, TrendingUp, Clock, ChevronRight,
  CheckCircle2, AlertCircle, Target, Sparkles, Play,
  Upload, Loader2, FileText, Check, Plus
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge }    from '@/components/ui/badge'
import { Button }   from '@/components/ui/button'
import { toast }    from 'sonner'
import { Label }    from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SubjectProgress, StudyPlan, StudentPrediction } from '@/lib/actions/student-dashboard'
import { initiateFreeStudyPlan } from '@/lib/actions/student-dashboard'
import { uploadStudentDocument } from '@/lib/actions/student-onboarding'

interface Props {
  user:                any
  subjectProgress:     SubjectProgress[]
  studyPlans:          StudyPlan[]
  sow:                 any | null
  currentWeekEntries:  any[]
  predictions:         StudentPrediction[]
  classId?:            string | null
}

const masteryColor: Record<string, string> = {
  strong:     'text-emerald-600',
  developing: 'text-amber-600',
  at_risk:    'text-orange-600',
  critical:   'text-rose-600',
}
const masteryBg: Record<string, string> = {
  strong:     'bg-emerald-500',
  developing: 'bg-amber-400',
  at_risk:    'bg-orange-500',
  critical:   'bg-rose-600',
}
const masteryBorder: Record<string, string> = {
  strong:     'border-emerald-200',
  developing: 'border-amber-200',
  at_risk:    'border-orange-200',
  critical:   'border-rose-200',
}

export function SubjectsClient({
  user, subjectProgress, studyPlans, sow, currentWeekEntries, predictions, classId,
}: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [initiating, startInitiate] = useTransition()
  const [initiatingSubject, setInitiatingSubject] = useState<string | null>(null)

  // ── Document Upload State ──────────────────────────────────────────────────
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [docType, setDocType] = useState<string>('term_report')
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploading, startUpload] = useTransition()

  // ── Sync upload state from onboarding ──────────────────────────────────────
  const studentId = user?.user_id ?? user?.id
  const [hasUploadedBefore, setHasUploadedBefore] = useState(false)

  useEffect(() => {
    if (studentId) {
      const isUploaded = localStorage.getItem(`proof_uploaded_${studentId}`) === 'true'
      setHasUploadedBefore(isUploaded)
    }
  }, [studentId])

  const pendingBySubject = studyPlans
    .filter((p) => p.status === 'pending' || p.status === 'sent')
    .reduce<Record<string, StudyPlan[]>>((acc, p) => {
      const key = p.subject ?? 'General'
      acc[key] = acc[key] ?? []
      acc[key].push(p)
      return acc
    }, {})

  const weekEntriesBySubject = currentWeekEntries.reduce<Record<string, any[]>>((acc, e) => {
    const key = e.subject ?? 'General'
    acc[key] = acc[key] ?? []
    acc[key].push(e)
    return acc
  }, {})

  const predictionBySubject = predictions.reduce<Record<string, StudentPrediction>>((acc, p) => {
    acc[p.subject] = p
    return acc
  }, {})

  // Primary source: ALL SoW entries (curriculum authority)
  const sowSubjects: string[] = sow?.entries
    ? Array.from(new Set<string>((sow.entries as any[]).map((e) => e.subject).filter(Boolean)))
    : []

  // Fallback: subjects from assessments / study plans
  const allSubjects = Array.from(new Set([
    ...sowSubjects,
    ...subjectProgress.map((s) => s.subject),
    ...Object.keys(pendingBySubject),
  ])).sort()

  function handleStudyNow(subject: string) {
    const firstEntry = sow?.entries?.find((e: any) => e.subject === subject)
    const topic = firstEntry?.topic ?? `Introduction to ${subject}`
    setInitiatingSubject(subject)
    startInitiate(async () => {
      const { data, error } = await initiateFreeStudyPlan(subject, topic)
      setInitiatingSubject(null)
      if (error) { toast.error(error.message); return }
      if (data?.plan_id) {
        toast.success('Study plan created!')
        router.push(`/student/study-plans/${data.plan_id}/studio`)
      }
    })
  }

  // ── Upload Document Form Handler ──────────────────────────────────────────
  function handleDocumentSubmit() {
    if (!selectedFile) {
      toast.error('Please select a file to upload.')
      return
    }

    const fd = new FormData()
    fd.append('file', selectedFile)
    fd.append('doc_type', docType)

    startUpload(async () => {
      const { error } = await uploadStudentDocument(fd)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Document uploaded successfully!')
      
      if (studentId) {
        localStorage.setItem(`proof_uploaded_${studentId}`, 'true')
      }
      
      setUploadSuccess(true)
      setHasUploadedBefore(true)
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    })
  }

  const isMarketplace = user?.enrollment_source === 'marketplace'

  if (allSubjects.length === 0) {
    const isPendingApproval = !classId

    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">My Subjects</h1>
          <p className="text-muted-foreground text-sm mt-1">Your enrolled class subjects appear here.</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center max-w-lg mx-auto">
            {isPendingApproval ? (
              <>
                <div className="relative mb-4">
                  <BookOpenCheck className="h-10 w-10 text-muted-foreground/30" />
                  <div className="absolute -bottom-1 -right-1 rounded-full bg-amber-500 p-0.5 text-white animate-pulse">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                </div>
                <h3 className="font-semibold text-lg text-foreground">Account Pending Approval</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                  Your request to join a class at{' '}
                  <span className="font-semibold text-foreground">
                    {user?.organization_name ?? 'your school'}
                  </span>{' '}
                  is waiting to be approved by a school administrator.
                </p>

                {/* ── Proof of Class Document Upload Section ─────────────────── */}
                <div className="w-full mt-6 border border-border/70 rounded-xl p-4 bg-muted/20 text-left space-y-4">
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#C9A84C]/10 text-[#C9A84C]">
                      <Upload className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">School Approval Status</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                        Provisional academic proof helps the school administrator verify your class assignment and approve your account faster.
                      </p>
                    </div>
                  </div>

                  {hasUploadedBefore || uploadSuccess ? (
                    <div className="flex items-start gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-emerald-800 dark:text-emerald-300 text-xs font-medium w-full">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Provisional proof uploaded!</p>
                        <p className="text-[11px] text-muted-foreground/80 mt-0.5 leading-normal font-normal">
                          We have received your verification document. Your school administrator is currently reviewing it.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Document Type</Label>
                          <Select value={docType} onValueChange={setDocType}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="term_report">Term Report Card</SelectItem>
                              <SelectItem value="prior_results">Prior Exam Results</SelectItem>
                              <SelectItem value="other">Other Document</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Choose File</Label>
                          <div className="relative">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={(e) => {
                                setSelectedFile(e.target.files?.[0] ?? null)
                                setUploadSuccess(false)
                              }}
                              className="hidden"
                              id="class-doc-file"
                            />
                            <label
                              htmlFor="class-doc-file"
                              className="flex h-8 w-full items-center justify-center gap-1 px-3 border border-input rounded-lg bg-background hover:bg-muted text-xs cursor-pointer truncate font-medium transition-colors"
                            >
                              <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              <span className="truncate">{selectedFile ? selectedFile.name : 'Select PDF or Photo'}</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {selectedFile && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleDocumentSubmit}
                            disabled={uploading}
                            className="h-8 text-xs font-bold flex-1"
                          >
                            {uploading ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                Uploading…
                              </>
                            ) : (
                              <>
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Upload File to Teacher
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedFile(null)}
                            disabled={uploading}
                            className="h-8 text-xs text-muted-foreground"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 rounded-xl bg-amber-500/5 border border-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-300 text-left w-full">
                  <p className="font-semibold mb-1">What happens next?</p>
                  <p className="leading-relaxed">
                    Once the school administrator reviews and accepts your request, your subjects, diagnostic results, and personalized study plans will unlock immediately.
                  </p>
                </div>
              </>
            ) : (
              <>
                <BookOpenCheck className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="font-semibold text-foreground">No subjects yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isMarketplace
                    ? 'We’re preparing your subjects for this level. Check back shortly — if this persists, contact support.'
                    : 'Ask your teacher to add a Scheme of Work for your class.'}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">My Subjects</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {sow
              ? `${sow.grade_level ?? ''} · ${sow.term ?? ''} ${sow.academic_year ?? ''}`.trim()
              : 'Your learning, organised by subject'}
          </p>
        </div>
        <Link href="/student/schedule">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs border-gold/30 text-gold hover:bg-gold/5">
            <Clock className="h-3.5 w-3.5" />
            Schedule
          </Button>
        </Link>
      </div>

      <div className="grid gap-3">
        {allSubjects.map((subject) => {
          const progress   = subjectProgress.find((s) => s.subject === subject)
          const pending    = pendingBySubject[subject] ?? []
          const weekTopics = weekEntriesBySubject[subject] ?? []
          const prediction = predictionBySubject[subject]
          const mastery    = progress?.mastery_label ?? null
          const avg        = progress?.avg_percentage ?? null
          const isStarting = initiating && initiatingSubject === subject

          return (
            <Card
              key={subject}
              className={`border ${mastery ? (masteryBorder[mastery] ?? 'border-border') : 'border-border'}`}
            >
              <CardContent className="pt-4 pb-3">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/student/subjects/${encodeURIComponent(subject)}`}
                        className="hover:text-gold transition-colors"
                      >
                        <h3 className="font-semibold text-base">{subject}</h3>
                      </Link>
                      {avg !== null ? (
                        <span className={`text-sm font-bold ${masteryColor[mastery!]}`}>{avg}%</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No assessment data yet</span>
                      )}
                      {prediction && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-gold/40 text-gold">
                          {prediction.predicted_grade} predicted
                        </Badge>
                      )}
                    </div>
                    {avg !== null && (
                      <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${masteryBg[mastery!]}`}
                          style={{ width: `${avg}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* This week's SoW topics */}
                {weekTopics.length > 0 && (
                  <div className="mb-2.5">
                    {weekTopics.slice(0, 2).map((entry: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        {entry.is_delivered
                          ? <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                          : <AlertCircle className="h-3 w-3 text-amber-400 shrink-0" />
                        }
                        <span>Week {entry.week_number}: {entry.topic}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Prediction gap */}
                {prediction && prediction.gap_to_next_grade > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2.5">
                    <Target className="h-3 w-3 text-gold shrink-0" />
                    <span>+{prediction.gap_to_next_grade}% to {prediction.next_grade}</span>
                    {prediction.weeks_to_exam != null && (
                      <span className="text-muted-foreground/60">· {prediction.weeks_to_exam} wks</span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  {pending.length > 0 ? (
                    <Link href={`/student/study-plans?subject=${encodeURIComponent(subject)}`}>
                      <Button size="sm" className="h-7 text-xs gap-1.5 bg-gold hover:bg-gold/90 text-gold-foreground">
                        <Sparkles className="h-3 w-3" />
                        {pending.length} plan{pending.length > 1 ? 's' : ''} waiting
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      size="sm"
                      className="h-7 text-xs gap-1.5 bg-gold hover:bg-gold/90 text-gold-foreground"
                      onClick={() => handleStudyNow(subject)}
                      disabled={isStarting}
                    >
                      <Play className="h-3 w-3" />
                      {isStarting ? 'Starting…' : 'Study now'}
                    </Button>
                  )}
                  <Link href={`/student/progress?subject=${encodeURIComponent(subject)}`}>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Progress
                    </Button>
                  </Link>
                  <Link href="/student/schedule">
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground">
                      Schedule <ChevronRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}