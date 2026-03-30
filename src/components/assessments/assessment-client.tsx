'use client'

import { useState, useEffect }  from 'react'
import { 
  BrainCircuit, 
  Users, 
  School, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck,
  FileText,
  TrendingUp,
  BookOpen,
  Download,
  Loader2
} from 'lucide-react'
import Link                     from 'next/link'
import { Assessment }           from '@/lib/actions/assessments'
import { Button }               from '@/components/ui/button'
import {
  Card, CardContent, CardHeader,
  CardTitle, CardDescription,
} from '@/components/ui/card'
import { Badge }   from '@/components/ui/badge'
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  Tooltip, TooltipProvider, TooltipTrigger, TooltipContent
} from '@/components/ui/tooltip'
import { BatchGradingDialog }  from '@/components/grading/batch-grading-dialog'
import { InlineClassDialog }   from '@/components/classes/inline-class-dialog'
import { PredictionCard }      from './prediction-card'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface AssessmentClientProps {
  assessment:           Assessment
  enrolledStudentCount: number
  latestAudit?:         any 
}

export function AssessmentClient({ 
  assessment, 
  enrolledStudentCount,
  latestAudit 
}: AssessmentClientProps) {
  const [isGradingDialogOpen, setIsGradingDialogOpen] = useState(false)
  const [initialGradingView, setInitialGradingView] = useState<'upload' | 'audit_flagged'>('upload')
  const [inlineClassOpen,    setInlineClassOpen]    = useState(false)
  const [availableClasses,   setAvailableClasses]   = useState<{ class_id: string; name: string }[]>([])
  const [linkedClassId,      setLinkedClassId]      = useState<string | null>(assessment.classId ?? null)
  
  // --- NEW: Loading state for PDF generation ---
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    console.log('[DEBUG] AssessmentClient received assessment prop:', assessment)
  }, [assessment])

  useEffect(() => {
    if (!assessment.classId) {
      import('@/lib/actions/classes').then(({ getClasses }) => {
        getClasses().then(({ data }) => {
          setAvailableClasses((data ?? []).map(c => ({ class_id: c.class_id, name: c.name })))
        })
      })
    }
  }, [assessment.classId])

  const isAiGrading     = assessment.assessment_type === 'AI_ASSISTED_GRADING'
  const canGradeWithAI  = isAiGrading && !!linkedClassId
  const hasStudents     = enrolledStudentCount > 0
  const gradeButtonReady = canGradeWithAI && hasStudents
  const needsClass       = isAiGrading && !linkedClassId

  const auditStatus = assessment.audit_status || 'not_audited'
  const hasPrediction = latestAudit?.prediction

  const openGrading = (view: 'upload' | 'audit_flagged') => {
    setInitialGradingView(view)
    setIsGradingDialogOpen(true)
  }

  // --- NEW: Handle Diagnostic Report Download ---
  const handleDownloadReport = async () => {
    setIsDownloading(true)
    try {
      const res = await fetch('/api/reports/assessment-diagnostic', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ assessmentId: assessment.assessment_id }),
      })

      if (!res.ok) {
        toast.error('Failed to generate diagnostic report.')
        return
      }

      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${assessment.title}_Diagnostic_Report.pdf`
      a.click()
      URL.revokeObjectURL(url)

      toast.success('Report downloaded successfully.')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <>
      {/* ── Breadcrumb ─────────────────────────────────────────────── */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href="/dashboard">Dashboard</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href="/dashboard/exams">Assessments</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{assessment.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mt-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{assessment.title}</h1>
            {auditStatus === 'passed' && (
              <Badge className="bg-green-500/10 text-green-600 border-green-500/20 gap-1.5 py-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Quality Verified
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {assessment.className} — {assessment.subject}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* --- NEW: Download Report Button --- */}
          {hasPrediction && (
            <Button 
              variant="outline" 
              onClick={handleDownloadReport} 
              disabled={isDownloading}
              className="gap-2"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isDownloading ? 'Generating...' : 'Download Report'}
            </Button>
          )}

          {canGradeWithAI && (
            gradeButtonReady ? (
              <Button
                onClick={() => openGrading('upload')}
                style={{ background: '#C9A84C', color: '#060E24', border: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#E8C96A')}
                onMouseLeave={e => (e.currentTarget.style.background = '#C9A84C')}
              >
                <BrainCircuit className="mr-2 h-4 w-4" />
                Grade Now
              </Button>
            ) : (
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0}>
                      <Button disabled style={{ background: '#C9A84C', color: '#060E24', border: 'none', opacity: 0.45 }}>
                        <BrainCircuit className="mr-2 h-4 w-4" />
                        Grade Now
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[220px] text-center p-3">
                    <p className="text-xs">Enroll students in this class before grading.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          )}
        </div>
      </div>

      {/* ── Banners ────────────────────────────────────────────────── */}
      <div className="space-y-3 mt-6">
        {canGradeWithAI && !hasStudents && (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-amber-600 shrink-0" />
              <p className="text-sm font-medium text-amber-900">No students enrolled in this class yet</p>
            </div>
            <Button asChild size="sm" variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100">
              <Link href={`/dashboard/classes/${linkedClassId}`}>Enroll students</Link>
            </Button>
          </div>
        )}

        {needsClass && (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <School className="h-5 w-5 text-rose-600 shrink-0" />
              <p className="text-sm font-medium text-rose-900">This assessment isn&apos;t linked to a class yet</p>
            </div>
            <Button size="sm" variant="outline" className="border-rose-300 text-rose-800 hover:bg-rose-100 gap-2" onClick={() => setInlineClassOpen(true)}>
              <School className="h-3.5 w-3.5" /> Link a class
            </Button>
          </div>
        )}

        {auditStatus === 'flagged' && (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-600">Quality Audit Flagged</p>
                <p className="text-xs text-muted-foreground">This paper deviates from the curriculum. Predictions may be inaccurate.</p>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-amber-500/30 text-amber-600 hover:bg-amber-500/10" 
              onClick={() => openGrading('audit_flagged')}
            >
              View Audit Results
            </Button>
          </div>
        )}
      </div>

      {/* ── Main Layout ────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-12 mt-6">
        
        {/* Left Column: Details & Status (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Assessment Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Description</span>
                <p className="text-sm leading-relaxed">{assessment.description || 'No description provided.'}</p>
              </div>
              
              <div className="flex justify-between items-center py-2 border-y border-dashed">
                <span className="text-sm font-medium">Grading Type</span>
                <Badge variant="secondary">{assessment.assessment_type === 'AI_ASSISTED_GRADING' ? 'AI Mirror' : 'Manual'}</Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Enrolled Students</span>
                <Badge variant="outline" className={cn(hasStudents ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700')}>
                  {enrolledStudentCount} active
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Audit Status</span>
                <Badge className={cn(
                  auditStatus === 'passed' ? 'bg-green-500/10 text-green-600' : 
                  auditStatus === 'flagged' ? 'bg-amber-500/10 text-amber-600' : 'bg-muted text-muted-foreground'
                )}>
                  {auditStatus.replace('_', ' ')}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {hasPrediction && (
            <PredictionCard 
              prediction={latestAudit.prediction} 
              status={auditStatus} 
            />
          )}
        </div>

        {/* Right Column: Marking Scheme (8 cols) */}
        <div className="lg:col-span-8">
          {assessment.marking_scheme_url ? (
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between border-b py-3 px-6">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-bold">Marking Scheme PDF</CardTitle>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <a href={assessment.marking_scheme_url} target="_blank" rel="noreferrer">Open Fullscreen</a>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <iframe
                  src={assessment.marking_scheme_url}
                  className="w-full h-[700px]"
                  title="Marking Scheme"
                />
              </CardContent>
            </Card>
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border-2 border-dashed">
              <FileText className="h-12 w-12 mb-4 opacity-20" />
              <p>No marking scheme uploaded.</p>
            </div>
          )}
        </div>
      </div>

      {gradeButtonReady && (
        <BatchGradingDialog
          open={isGradingDialogOpen}
          onOpenChange={setIsGradingDialogOpen}
          assessmentId={assessment.assessment_id}
          classId={assessment.classId!}
          initialView={initialGradingView}
        />
      )}

      <InlineClassDialog
        open={inlineClassOpen}
        onOpenChange={setInlineClassOpen}
        existingClasses={availableClasses}
        onClassReady={(cls) => {
          setLinkedClassId(cls.class_id);
          setInlineClassOpen(false);
        }}
      />
    </>
  )
}