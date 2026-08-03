'use client'

// src/components/students/student-dashboard-client.tsx

import { useState, useEffect } from 'react'
import {
  TrendingUp, BookOpen, Target, Award,
  AlertCircle, CheckCircle2, Clock, Download, Flame,
  Calendar, ChevronRight, ArrowRight, RotateCcw,
  BookOpenCheck, Sparkles, ShieldAlert
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge }          from '@/components/ui/badge'
import { Progress }       from '@/components/ui/progress'
import { Button }         from '@/components/ui/button'
import { ErrorTypeLabel } from '@/components/ui/error-type-label'
import Link               from 'next/link'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import { format } from 'date-fns'
import { toast }                from 'sonner'
import { ExamHistoryDetail }    from '@/components/students/exam-history-detail'
import { LearningToolkits }     from '@/components/students/learning-toolkits'
import { CertPreviewAnchor }    from '@/components/students/cert-preview-anchor'
import { NextStep }             from '@/components/students/next-step'
import { TermBillingStatusCard } from '@/components/students/term-billing-status-card'
import { ClassConfirmationUploadWidget } from '@/components/students/class-confirmation-upload-widget'
import type { ExamHistoryItem, LearningTool, StudentCognitiveProfile, StudyPlan, SocialProof, SubjectProgress, StudentPrediction, NextAction } from '@/lib/actions/student-dashboard'

const LESSON_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  catch_up:     { label: 'Catch-Up',     color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300' },
  gap_closure:  { label: 'Gap Closure',  color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' },
  reteach:      { label: 'Reteach',      color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300' },
  pre_class:    { label: 'Pre-Class',    color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300' },
  consolidation:{ label: 'Consolidation',color: 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300' },
  exam_prep:    { label: 'Exam Prep',    color: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300' },
  pre_teach:    { label: 'Pre-Teach',    color: 'bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300' },
}

interface Props {
  user:                any
  analytics:           any
  currentProfile:      StudentCognitiveProfile | null
  submissions:         any[]
  examHistory:         ExamHistoryItem[]
  tools:               LearningTool[]
  studyPlans?:         StudyPlan[]
  streak?:             number
  socialProof?:        SocialProof | null
  subjectProgress?:    SubjectProgress[]
  predictions?:        StudentPrediction[]
  currentWeekEntries?: any[]
  nextAction?:         NextAction | null
  classId?:            string | null // <-- Gating prop passed from dashboard page
  /** True when class-lookup itself failed (outage), not that the student
   *  genuinely has no class yet — must show a different message than the
   *  pending-approval empty state below. */
  classFetchFailed?:   boolean
}

const perfColor = (p: number) =>
  p >= 80 ? 'text-emerald-600' : p >= 65 ? 'text-amber-600' : p >= 50 ? 'text-orange-600' : 'text-rose-600'

const perfLabel = (p: number) =>
  p >= 80 ? 'Excellent' : p >= 65 ? 'Good' : p >= 50 ? 'Developing' : 'Needs Support'

const statusColor: Record<string, string> = {
  COMPLETED:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  GRADED:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  PENDING:    'bg-muted text-muted-foreground',
  PROCESSING: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  FAILED:     'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
}

export function StudentDashboardClient({
  user, analytics, currentProfile, submissions, examHistory, tools, studyPlans = [], streak = 0, socialProof, subjectProgress = [], predictions = [], currentWeekEntries = [], nextAction = null, classId, classFetchFailed,
}: Props) {
  // ── Client-Side Local State ────────────────────────────────────────────────
  const [dataSaver, setDataSaver] = useState(false)
  const studentId = user?.user_id ?? user?.id

  useEffect(() => {
    setDataSaver(localStorage.getItem('data_saver_mode') === 'true')
  }, [])

  // pick the most urgent prediction (lowest gap_to_next_grade with fewest weeks)
  const topPrediction = predictions.length > 0
    ? [...predictions].sort((a, b) => {
        const urgencyA = (a.weeks_to_exam ?? 999) - (a.gap_to_next_grade ?? 0)
        const urgencyB = (b.weeks_to_exam ?? 999) - (b.gap_to_next_grade ?? 0)
        return urgencyA - urgencyB
      })[0]
    : null

  // Normalise: API returns camelCase, fall back to snake_case
  const avg       = analytics?.averagePercentage  ?? analytics?.average_percentage  ?? 0
  const totalSubs = analytics?.totalSubmissions   ?? analytics?.total_submissions   ?? 0
  const bloom     = analytics?.bloomDistribution  ?? analytics?.bloom_distribution  ?? []
  const errors    = analytics?.errorDistribution  ?? analytics?.error_distribution  ?? []
  const scoreHist = analytics?.scoreHistory       ?? analytics?.score_history       ?? []

  const chartData = [...scoreHist]
    .reverse()
    .slice(0, 8)
    .map((s: any) => {
      const title = s.assessmentTitle ?? s.assessment_title ?? 'Assessment'
      return {
        name:  title.length > 14 ? title.slice(0, 13) + '…' : title,
        score: s.percentage ?? 0,
      }
    })

  const radarData = bloom.map((b: any) => ({
    subject:    b.level_name,
    percentage: b.percentage,
  }))

  const recentSubs = [...submissions]
    .sort((a, b) =>
      new Date(b.graded_at ?? b.submitted_at ?? 0).getTime() -
      new Date(a.graded_at ?? a.submitted_at ?? 0).getTime(),
    )
    .slice(0, 5)

  const firstName = user?.name?.split(' ')[0] ?? user?.first_name ?? 'Student'

  const handleCompassDownload = async () => {
    try {
      const res = await fetch('/api/student/compass/pdf', { credentials: 'include' })
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = 'learning-compass.pdf'; a.click()
      URL.revokeObjectURL(url)
    } catch {
      window.open('/api/student/compass/pdf', '_blank')
    }
  }

  // Learning Activity stats (assessment-independent)
  const now = new Date()
  const todayIso = now.toISOString().slice(0, 10)
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay())
  const plansCompletedThisWeek = studyPlans.filter(
    (p) => p.status === 'completed' && p.completed_at && new Date(p.completed_at) >= weekStart,
  ).length
  const totalStudyMins = studyPlans
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + (p.content?.estimated_minutes ?? 0), 0)
  const nextPendingPlan = studyPlans.find((p) => p.status === 'pending' || p.status === 'sent')

  const dueReviews = studyPlans
    .filter((p) => p.status === 'completed' && p.next_review_date && p.next_review_date <= todayIso)
    .map((p) => ({
      ...p,
      daysOverdue: Math.max(0, Math.round(
        (now.getTime() - new Date(p.next_review_date!).getTime()) / (1000 * 60 * 60 * 24),
      )),
    }))
    .sort((a, b) => a.next_review_date!.localeCompare(b.next_review_date!))

  // ── Toggle Data Saver Mode ─────────────────────────────────────────────────
  function handleToggleDataSaver() {
    const next = !dataSaver
    setDataSaver(next)
    localStorage.setItem('data_saver_mode', String(next))
    if (next) {
      toast.success('Data Saver Active: heavy audio files are bypassed.', {
        description: 'Lesson Player will fallback to client-side Web Speech to save mobile data charges.',
      })
    } else {
      toast.success('Data Saver Deactivated: high-quality studio audio enabled.')
    }
  }

  // ── Gating: Render Pending Approval State ──────────────────────────────────
  const hasClass = !!classId
  if (!hasClass && classFetchFailed) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight font-sans">My Dashboard</h1>
        </div>
        <Card className="shadow-sm border-rose-200">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center max-w-lg mx-auto">
            <AlertCircle className="h-10 w-10 text-rose-400 mb-3" />
            <h3 className="font-semibold text-lg text-foreground font-sans">Couldn&apos;t load your dashboard</h3>
            <p className="text-sm text-muted-foreground mt-2 px-3">
              Something went wrong on our end — this isn&apos;t about your class registration. Please refresh, or try again shortly.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }
  if (!hasClass) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight font-sans">My Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Gaining structured access to school subjects and performance targets.</p>
        </div>

        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center max-w-lg mx-auto">
            <div className="relative mb-4">
              <BookOpenCheck className="h-10 w-10 text-muted-foreground/30 animate-pulse" />
              <div className="absolute -bottom-1 -right-1 rounded-full bg-amber-500 p-0.5 text-white animate-pulse">
                <Clock className="h-3.5 w-3.5" />
              </div>
            </div>

            <h3 className="font-semibold text-lg text-foreground font-sans">Account Verification Required</h3>
            <p className="text-sm text-muted-foreground mt-2 px-3">
              Your class registration request at{' '}
              <span className="font-semibold text-foreground">
                {user?.organization_name ?? 'your school'}
              </span>{' '}
              is waiting to be processed by a school administrator.
            </p>

            <ClassConfirmationUploadWidget studentId={studentId} />

            <div className="mt-4 rounded-xl bg-amber-500/5 border border-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-300 dark:text-amber-300 text-left w-full flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
              <div>
                <p className="font-semibold">Need help?</p>
                <p className="leading-relaxed mt-0.5">
                  Your registration must be confirmed before lessons, performance metrics, and subject progressions can generate. Talk to your coordinator if this takes longer than expected.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Next-Best-Action hero — total mental clarity ──────────────── */}
      <NextStep nextAction={nextAction} />

      {/* ── Term-billing status — renders nothing for free-tier students ── */}
      <TermBillingStatusCard />

      {/* ── Exam countdown banner ─────────────────────────────────────── */}
      {topPrediction && (
        <Link
          href={`/student/progress?curriculumId=${encodeURIComponent(topPrediction.curriculum_id)}`}
          className="block"
        >
          <div className="rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 flex items-center justify-between gap-3 hover:bg-gold/10 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <Target className="h-4 w-4 text-gold shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {topPrediction.subject} — {topPrediction.predicted_grade} ({topPrediction.predicted_score}%)
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {topPrediction.milestone_label
                    ? `${topPrediction.milestone_label}${topPrediction.weeks_to_exam != null ? ` · ${topPrediction.weeks_to_exam} weeks` : ''} · `
                    : topPrediction.weeks_to_exam != null
                    ? `${topPrediction.weeks_to_exam} weeks to exam · `
                    : ''}
                  {topPrediction.gap_to_next_grade > 0
                    ? `+${topPrediction.gap_to_next_grade}% to ${topPrediction.next_grade}`
                    : `Already at ${topPrediction.predicted_grade}`}
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-gold shrink-0" />
          </div>
        </Link>
      )}

      {/* ── Today's schedule strip ────────────────────────────────────── */}
      {currentWeekEntries.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {currentWeekEntries.slice(0, 4).map((entry: any, i: number) => (
            <div
              key={i}
              className="flex-shrink-0 rounded-lg border bg-card px-3 py-2 flex items-center gap-2"
            >
              <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs font-medium whitespace-nowrap">{entry.topic}</p>
                <p className="text-[10px] text-muted-foreground">{entry.subject ?? ''} · Wk {entry.week_number}</p>
              </div>
              {entry.is_delivered && (
                <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
              )}
            </div>
          ))}
          <Link
            href="/student/schedule"
            className="flex-shrink-0 rounded-lg border border-dashed bg-muted/30 px-3 py-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" />
            Full schedule
          </Link>
        </div>
      )}

      {/* ── Welcome header ────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Welcome back, {firstName}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Keep the momentum going — every session counts.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* ── Data Saver Mode Toggle Button ── */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleDataSaver}
            className={`gap-1.5 border-dashed transition-all ${
              dataSaver
                ? 'border-orange-500/50 bg-orange-50/50 text-orange-600 hover:bg-orange-50 hover:text-orange-700'
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
            title={dataSaver ? "Data Saver is Active" : "Enable Data Saver Mode"}
          >
            <Sparkles className={`h-3.5 w-3.5 ${dataSaver ? 'text-orange-500 animate-pulse' : ''}`} />
            {dataSaver ? 'Data Saver On' : 'Data Saver'}
          </Button>

          {currentProfile && (
            <Button
              variant="outline" size="sm" onClick={handleCompassDownload}
              className="gap-2 border-gold/30 text-gold hover:bg-gold/5"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Learning Compass</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Learning Activity ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className={streak > 0 ? 'border-orange-200 bg-orange-50/50' : ''}>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Study Streak</p>
            <div className="flex items-center gap-1.5">
              <Flame className={`h-7 w-7 ${streak > 0 ? 'text-orange-500' : 'text-muted-foreground/40'}`} />
              <p className={`text-4xl font-bold ${streak > 0 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                {streak}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {streak === 0 ? 'Start today!' : streak === 1 ? '1 day — keep going!' : `${streak} days in a row`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">This Week</p>
            <p className="text-4xl font-bold">{plansCompletedThisWeek}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {plansCompletedThisWeek === 1 ? 'plan completed' : 'plans completed'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Study Time</p>
            <p className="text-2xl font-bold leading-tight">
              {totalStudyMins >= 60
                ? `${Math.floor(totalStudyMins / 60)}h ${totalStudyMins % 60}m`
                : `${totalStudyMins}m`}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Total across all plans</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Assessments</p>
            <p className="text-4xl font-bold">{totalSubs}</p>
            <p className="text-xs text-muted-foreground mt-2">Graded so far</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Continue studying CTA ────────────────────────────────────── */}
      {nextPendingPlan && (
        <Link href={`/student/study-plans/${nextPendingPlan.id}/studio`} className="block">
          <div className="rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 flex items-center justify-between gap-3 hover:bg-gold/10 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <BookOpen className="h-4 w-4 text-gold shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">Continue: {nextPendingPlan.topic}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {nextPendingPlan.subject} · {nextPendingPlan.content?.estimated_minutes ?? 20} min
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-gold shrink-0" />
          </div>
        </Link>
      )}

      {/* ── FSRS Review Queue ────────────────────────────────────────── */}
      {dueReviews.length > 0 && (
        <div className="rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-violet-600 dark:text-violet-400 animate-spin" style={{ animationDuration: '6s' }} />
              <p className="text-sm font-semibold text-violet-900 dark:text-violet-200">
                {dueReviews.length === 1 ? '1 memory review due today' : `${dueReviews.length} memory reviews due today`}
              </p>
            </div>
            <span className="text-[11px] text-violet-600 dark:text-violet-400 font-bold uppercase tracking-wider scale-95 origin-right">Active Recall</span>
          </div>
          <div className="space-y-1.5">
            {dueReviews.slice(0, 5).map((plan) => (
              <Link
                key={plan.id}
                href={`/student/study-plans/${plan.id}/studio`}
                className="flex items-center justify-between gap-3 rounded-lg bg-white dark:bg-violet-900/30 border border-violet-100 dark:border-violet-800 px-3 py-2.5 hover:bg-violet-50 dark:hover:bg-violet-900/50 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">{plan.topic}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {plan.subject} · {plan.daysOverdue === 0 ? 'due today' : `${plan.daysOverdue}d overdue`}
                  </p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-violet-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ))}
          </div>
          {dueReviews.length > 5 && (
            <Link href="/student/study-plans" className="text-xs text-violet-600 dark:text-violet-400 hover:underline">
              +{dueReviews.length - 5} more in your study plans
            </Link>
          )}
        </div>
      )}

      {/* ── Certificate preview anchor ───────────────────────────────── */}
      <CertPreviewAnchor
        averageScore={avg}
        studentName={user?.name ?? user?.first_name ?? 'Student'}
        schoolName={user?.organization?.name ?? user?.school_name}
      />

      {/* ── Social proof ─────────────────────────────────────────────── */}
      {socialProof && (socialProof.rank_percentile !== null || socialProof.peers_completed_this_week > 0) && (
        <div className="flex flex-wrap gap-3">
          {socialProof.rank_percentile !== null && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gold/5 border border-gold/20">
              <Target className="h-3.5 w-3.5 text-gold shrink-0" />
              <p className="text-xs text-foreground">
                You&apos;re in the <span className="font-semibold">top {100 - socialProof.rank_percentile}%</span> of your school
              </p>
            </div>
          )}
          {socialProof.peers_completed_this_week > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-700 dark:text-emerald-300 dark:text-emerald-300">
                <span className="font-semibold">{socialProof.peers_completed_this_week}</span> schoolmate{socialProof.peers_completed_this_week === 1 ? '' : 's'} completed assessments this week
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Subject progress bars ────────────────────────────────────── */}
      {subjectProgress.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-gold" />
              Subject Progress
            </CardTitle>
            <CardDescription>Average score per subject across all assessments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {subjectProgress.map((s) => (
              <div key={s.subject} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{s.subject}</span>
                  <span className={`text-xs font-semibold ${
                    s.mastery_label === 'strong'     ? 'text-emerald-600' :
                    s.mastery_label === 'developing' ? 'text-amber-600'   :
                    s.mastery_label === 'at_risk'    ? 'text-orange-600'  : 'text-rose-600'
                  }`}>
                    {s.avg_percentage}%
                  </span>
                </div>
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      s.mastery_label === 'strong'     ? 'bg-emerald-500' :
                      s.mastery_label === 'developing' ? 'bg-amber-400'   :
                      s.mastery_label === 'at_risk'    ? 'bg-orange-500'  : 'bg-rose-600'
                    }`}
                    style={{ width: `${s.avg_percentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">{s.assessment_count} assessment{s.assessment_count !== 1 ? 's' : ''}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Score history chart ───────────────────────────────────────── */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gold" />
              Score History
            </CardTitle>
            <CardDescription>Your recent assessment scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Score']} contentStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone" dataKey="score" stroke="#C9A84C" strokeWidth={2.5}
                    dot={{ fill: '#C9A84C', r: 4 }} activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Bloom's + Errors ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {radarData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-gold" />
                Cognitive Depth
              </CardTitle>
              <CardDescription>Bloom&apos;s taxonomy breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      dataKey="percentage" stroke="#C9A84C" fill="#C9A84C"
                      fillOpacity={0.25} strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {errors.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-500" />
                Areas to improve
              </CardTitle>
              <CardDescription>
                What your answers are losing marks on — tap a label to learn more
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {errors.slice(0, 4).map((e: any, i: number) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    {/* ErrorTypeLabel — shows plain-language description on hover */}
                    <ErrorTypeLabel
                      name={e.error_name}
                      description={e.description ?? null}
                      className="text-sm text-muted-foreground"
                    />
                    <span className="font-semibold tabular-nums shrink-0">{e.percentage}%</span>
                  </div>
                  <Progress value={e.percentage} className="h-1.5" />
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Cognitive profile ─────────────────────────────────────────── */}
      {currentProfile && (
        <Card className="border-gold/20 bg-gold/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-gold" />
              Your Cognitive Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold text-gold-foreground font-bold text-lg">
                LC
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="font-semibold">{currentProfile.profile_name ?? 'Learning Profile'}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentProfile.profile_description ?? 'Your personalised learning profile.'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Mental Energy</p>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={((currentProfile.mental_energy_score ?? 0) / 24) * 100}
                        className="h-2 flex-1"
                      />
                      <span className="text-xs font-semibold w-8 tabular-nums">
                        {currentProfile.mental_energy_score ?? 0}/24
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Learning Strategy</p>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={((currentProfile.learning_strategy_score ?? 0) / 24) * 100}
                        className="h-2 flex-1"
                      />
                      <span className="text-xs font-semibold w-8 tabular-nums">
                        {currentProfile.learning_strategy_score ?? 0}/24
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Learning Toolkits ─────────────────────────────────────────── */}
      {currentProfile && tools.length > 0 && (
        <LearningToolkits profile={currentProfile} tools={tools} />
      )}

      {/* ── Exam History ──────────────────────────────────────────────── */}
      {examHistory.length > 0 && (
        <ExamHistoryDetail examHistory={examHistory} />
      )}

      {/* ── Recent submissions ────────────────────────────────────────── */}
      {recentSubs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-gold" />
              Recent Assessments
            </CardTitle>
            <CardDescription>Your latest graded work</CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {recentSubs.map((sub: any, i: number) => {
              const status = sub.grading_status ?? sub.status ?? 'PENDING'
              const score  = sub.percentage_score ?? sub.score ?? null
              const date   = sub.graded_at ?? sub.submitted_at
              const title  = sub.assessment_title ?? sub.title ?? 'Assessment'
              return (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{title}</p>
                    {date && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(date), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    {score !== null && (
                      <span className={`text-sm font-bold ${perfColor(score)}`}>{score}%</span>
                    )}
                    <Badge
                      className={`text-xs ${statusColor[status] ?? statusColor.PENDING}`}
                      variant="secondary"
                    >
                      {status === 'COMPLETED' && <CheckCircle2 className="mr-1 h-3 w-3" />}
                      {status === 'COMPLETED' ? 'Graded' : status}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* ── Study Plans ──────────────────────────────────────────────── */}
      {studyPlans.length > 0 && (() => {
        const pending   = studyPlans.filter((p) => p.status === 'pending' || p.status === 'sent')
        const completed = studyPlans.filter((p) => p.status === 'completed')
        return (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-gold" />
                  My Study Plans
                </CardTitle>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    {pending.length} pending
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    {completed.length} completed
                  </span>
                </div>
              </div>
              <CardDescription>Personalised lessons generated from your gap analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {pending.slice(0, 5).map((plan) => {
                const cfg = LESSON_TYPE_CONFIG[plan.lesson_type] ?? { label: plan.lesson_type, color: 'bg-muted text-muted-foreground' }
                return (
                  <div key={plan.id} className="flex items-center gap-3 rounded-lg border px-3 py-2.5 hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{plan.topic}</p>
                      <p className="text-xs text-muted-foreground">{plan.subject} · {plan.content?.estimated_minutes ?? 20} min</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className={`text-xs px-1.5 py-0 ${cfg.color}`}>{cfg.label}</Badge>
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                )
              })}
              {pending.length === 0 && (
                <div className="flex items-center gap-2 py-4 text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <p className="text-sm">All caught up! No pending study plans.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })()}

      {/* ── Assessment empty state ───────────────────────────────────── */}
      {totalSubs === 0 && recentSubs.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex items-center gap-4 py-5 px-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
              <BookOpen className="h-5 w-5 text-muted-foreground/30" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Assessment results appear here once your teacher grades your first assignment</p>
              <Link href="/student/subjects" className="text-xs text-gold hover:underline mt-0.5 inline-block">
                Go study a subject now →
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}