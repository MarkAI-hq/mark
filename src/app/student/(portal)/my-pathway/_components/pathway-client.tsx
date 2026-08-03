'use client'

// src/app/student/(portal)/my-pathway/_components/pathway-client.tsx

import Link from 'next/link'
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, AlertCircle,
  ArrowRight, Target, Timer, Flame, ArrowUpRight, ArrowDownRight,
  ArrowUp, ArrowDown, Info, ShieldAlert, Clock
} from 'lucide-react'
import { format } from 'date-fns'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

import { NationalExamPredictionCard } from '@/components/prediction/national-exam-prediction-card'
import { ClassConfirmationUploadWidget } from '@/components/students/class-confirmation-upload-widget'

interface Props {
  user:         any
  hasClass:     boolean
  predictions:  any[]
  prediction:   any | null
  curriculumId: string
  classFetchFailed?: boolean
}

export function PathwayClient({ user, hasClass, predictions, prediction, curriculumId, classFetchFailed }: Props) {
  const studentId = user?.user_id ?? user?.id

  if (!hasClass && classFetchFailed) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 pt-4 px-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight font-sans">My Pathway</h1>
        </div>
        <Card className="shadow-sm border-rose-200">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center max-w-lg mx-auto">
            <AlertCircle className="h-10 w-10 text-rose-400 mb-3" />
            <h3 className="font-semibold text-lg text-foreground font-sans">Couldn&apos;t load your pathway</h3>
            <p className="text-sm text-muted-foreground mt-2 px-3">
              Something went wrong on our end — this isn&apos;t about your class registration. Please refresh, or try again shortly.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Gating: Render Pending Approval State ── [4]
  if (!hasClass) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 pt-4 px-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight font-sans">My Pathway</h1>
          <p className="text-muted-foreground text-sm mt-1">Syllabus pacing targets and active predictive pathways toward national exams.</p>
        </div>
        
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center max-w-lg mx-auto">
            <div className="relative mb-4">
              <Target className="h-10 w-10 text-muted-foreground/30 animate-pulse" />
              <div className="absolute -bottom-1 -right-1 rounded-full bg-amber-500 p-0.5 text-white animate-pulse">
                <Clock className="h-3.5 w-3.5" />
              </div>
            </div>
            
            <h3 className="font-semibold text-lg text-foreground font-sans font-medium">Pathways Pending Approval</h3>
            <p className="text-sm text-muted-foreground mt-2 px-3">
              Your customized diagnostic predictions and highest-impact subject actions will configure as soon as an administrator verifies your class registration at{' '}
              <span className="font-semibold text-foreground">
                {user?.organization_name ?? 'your school'}
              </span>.
            </p>

            <ClassConfirmationUploadWidget studentId={studentId} />

            <div className="mt-4 rounded-xl bg-amber-500/5 border border-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-300 text-left w-full flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
              <div>
                <p className="font-semibold">Bypass Required</p>
                <p className="leading-relaxed mt-0.5">
                  Your custom learning pathways are calculated from your graded coursework. Talk to your teacher or coordinator if your class setup is delayed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Empty State: No predictions yet ──
  if (!prediction && predictions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center animate-fade-up">
        <Target className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-40" />
        <h2 className="text-lg font-semibold">No progress yet</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Complete a graded assessment and your goal pathway will appear here.
        </p>
      </div>
    )
  }

  // ── Subject Picker: Multiple Subjects Available ──
  if (!curriculumId && !prediction && predictions.length > 0) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-4 animate-fade-up">
        <div>
          <h1 className="text-xl font-semibold font-sans">Your progress</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pick a subject to see your pathway to its next goal.
          </p>
        </div>
        <div className="space-y-2">
          {predictions.map((p) => (
            <Link
              key={p.curriculum_id}
              href={`/student/my-pathway?curriculumId=${encodeURIComponent(p.curriculum_id)}`}
              className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 hover:bg-accent/50 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate font-sans">{p.subject}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {p.milestone_label ?? 'Exam pathway'}
                  {p.weeks_to_exam != null ? ` · ${p.weeks_to_exam} weeks left` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-xs">
                  {p.predicted_grade} · {p.predicted_score}%
                </Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  // ── Fallback error handling if prediction is still null ──
  if (!prediction) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center animate-fade-up">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold">Not enough data yet</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Complete at least one graded assessment to see your pathway.
        </p>
      </div>
    )
  }

  const urgencyClass = (u: string) =>
    u === 'high'   ? 'bg-rose-50 text-rose-700 border-rose-200'   :
    u === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
    'bg-surface-raised text-muted-foreground border-slate-200'

  const goalNoun =
    prediction.milestone_type === 'end_of_term' ? 'end of term' :
    prediction.milestone_type === 'end_of_year' ? 'end of year' :
    'exam'

  const topicStatusClass = (s: string) =>
    s === 'strong'     ? 'bg-emerald-500' :
    s === 'developing' ? 'bg-amber-400'   :
    s === 'at_risk'    ? 'bg-orange-500'  :
    'bg-rose-600'

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16 pt-4 px-4 animate-fade-up">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground font-sans">
          {prediction.subject} —{' '}
          {prediction.milestone_label ??
            `${prediction.exam_level?.toUpperCase() ?? ''} pathway`}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Predicted: {prediction.predicted_label} {prediction.predicted_grade} ({prediction.predicted_score}%)
          {prediction.gap_to_next_grade > 0 && (
            <> · You need <span className="font-medium text-foreground">+{prediction.gap_to_next_grade} pp</span> for {prediction.next_grade_label} {prediction.next_grade}</>
          )}
        </p>
      </div>

      {/* ── How you started vs now ──────────────────────────────────── */}
      {prediction.initial_predicted_score !== undefined &&
        prediction.initial_predicted_score !== prediction.predicted_score && (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Your progress
          </p>
          <div className="flex items-center gap-4">
            <div className="flex-1 text-center">
              <p className="text-xs text-muted-foreground">When you started</p>
              <p className="text-2xl font-bold text-foreground mt-0.5 font-sans">{prediction.initial_predicted_score}%</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              {prediction.predicted_score > prediction.initial_predicted_score ? (
                <ArrowUp className="h-5 w-5 text-emerald-500" />
              ) : (
                <ArrowDown className="h-5 w-5 text-rose-500" />
              )}
              <span className={`text-sm font-bold ${
                prediction.predicted_score > prediction.initial_predicted_score
                  ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {prediction.predicted_score > prediction.initial_predicted_score ? '+' : ''}
                {prediction.predicted_score - prediction.initial_predicted_score} pp
              </span>
            </div>
            <div className="flex-1 text-center">
              <p className="text-xs text-muted-foreground">Right now</p>
              <p className="text-2xl font-bold text-foreground mt-0.5 font-sans">{prediction.predicted_score}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Low data quality warning */}
      {prediction.based_on_submissions < 2 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 px-4 py-3">
          <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
            <span className="font-semibold">Prediction based on {prediction.based_on_submissions} assessment.</span>{' '}
            Complete at least 2 graded assessments to unlock trajectory tracking and see how you&apos;re improving over time.
          </p>
        </div>
      )}

      {/* ── Countdown + urgency projection ──────────────────────────── */}
      {prediction.weeks_to_exam !== undefined && prediction.weeks_to_exam !== null && (
        <div className={`rounded-xl border p-4 space-y-3 ${
          prediction.weeks_to_exam <= 4  ? 'bg-rose-50 border-rose-200'   :
          prediction.weeks_to_exam <= 12 ? 'bg-amber-50 border-amber-200' :
          'bg-surface-raised border-slate-200'
        }`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Timer className={`h-5 w-5 ${
                prediction.weeks_to_exam <= 4  ? 'text-rose-600'   :
                prediction.weeks_to_exam <= 12 ? 'text-amber-600'  :
                'text-muted-foreground'
              }`} />
              <div>
                <p className={`text-sm font-semibold font-sans ${
                  prediction.weeks_to_exam <= 4  ? 'text-rose-800'   :
                  prediction.weeks_to_exam <= 12 ? 'text-amber-800'  :
                  'text-foreground'
                }`}>
                  {prediction.weeks_to_exam} {prediction.weeks_to_exam === 1 ? 'week' : 'weeks'} to {goalNoun}
                </p>
                <p className={`text-xs ${
                  prediction.weeks_to_exam <= 4  ? 'text-rose-600'   :
                  prediction.weeks_to_exam <= 12 ? 'text-amber-600'  :
                  'text-muted-foreground'
                }`}>
                  {prediction.weeks_to_exam <= 4
                    ? 'Final push — focus on your highest-impact actions'
                    : prediction.weeks_to_exam <= 12
                    ? 'Getting close — stay consistent with your plan'
                    : 'You have time — build strong habits now'}
                </p>
              </div>
            </div>

            {/* Trajectory indicator */}
            <div className="shrink-0 text-right">
              {prediction.trajectory === 'improving' ? (
                <div className="flex items-center gap-1 text-emerald-700">
                  <ArrowUpRight className="h-4 w-4" />
                  <span className="text-xs font-semibold">+{Math.abs(prediction.trajectory_delta)} pp trend</span>
                </div>
              ) : prediction.trajectory === 'declining' ? (
                <div className="flex items-center gap-1 text-rose-700">
                  <ArrowDownRight className="h-4 w-4" />
                  <span className="text-xs font-semibold">{prediction.trajectory_delta} pp trend</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Minus className="h-4 w-4" />
                  <span className="text-xs font-semibold">Steady</span>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground mt-0.5">vs last assessment</p>
            </div>
          </div>

          {/* Urgency projection */}
          {prediction.trajectory !== 'steady' && prediction.trajectory_delta !== 0 && (
            <div className={`rounded-lg px-3 py-2 text-xs ${
              prediction.trajectory === 'improving'
                ? 'bg-emerald-100/60 text-emerald-800'
                : 'bg-rose-100/60 text-rose-800'
            }`}>
              {prediction.trajectory === 'improving' ? (
                <>
                  <Flame className="inline h-3 w-3 mr-1" />
                  At your current rate, you could reach{' '}
                  <span className="font-semibold">
                    {Math.min(100, Math.round(prediction.predicted_score + prediction.trajectory_delta * (prediction.weeks_to_exam! / 4)))}%
                  </span>{' '}
                  by exam day — keep going!
                </>
              ) : (
                <>
                  <AlertTriangle className="inline h-3 w-3 mr-1" />
                  At your current rate, your score could slip to{' '}
                  <span className="font-semibold">
                    {Math.max(0, Math.round(prediction.predicted_score + prediction.trajectory_delta * (prediction.weeks_to_exam! / 4)))}%
                  </span>{' '}
                  by exam day — take action now.
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Prediction card (full) ──────────────────────────────────── */}
      <NationalExamPredictionCard prediction={prediction} showPathway={false} />

      <Separator />

      {/* ── Highest impact actions ──────────────────────────────────── */}
      {prediction.pathway.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Highest impact actions · ranked by expected exam gain
          </h2>
          {prediction.pathway.map((action: any) => (
            <div
              key={action.rank}
              className="rounded-lg border p-4 space-y-2 bg-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground/70 w-5">{action.rank}.</span>
                  <Badge variant="outline" className={`text-[10px] ${urgencyClass(action.urgency)}`}>
                    {action.urgency.toUpperCase()}
                  </Badge>
                </div>
                <Badge variant="outline" className="text-[10px] bg-surface-raised text-muted-foreground shrink-0">
                  +{action.expected_gain_pp} pp expected
                </Badge>
              </div>
              <p className="text-sm text-foreground font-medium font-sans">{action.action}</p>
              <p className="text-xs text-muted-foreground">Topic: {action.topic}</p>
              {action.linked_id && (
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" asChild>
                  <Link href={`/student/reteach/${action.linked_id}`}>
                    View session <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <Separator />

      {/* ── Topic performance ───────────────────────────────────────── */}
      {prediction.topic_performance.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Topic performance
            </h2>
            <span className="text-[10px] text-muted-foreground font-normal normal-case">
              (estimated from overall score)
            </span>
          </div>
          {prediction.topic_performance.map((t: any) => (
            <div key={t.topic} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">{t.topic}</span>
                <span className="text-xs text-muted-foreground">
                  {t.student_mastery}% · national avg {t.national_average}%
                </span>
              </div>
              <div className="relative h-2 rounded-full bg-muted">
                {/* National average marker */}
                <div
                  className="absolute h-full w-0.5 bg-muted-foreground/40 rounded"
                  style={{ left: `${t.national_average}%` }}
                />
                {/* Student score */}
                <div
                  className={`h-full rounded-full ${topicStatusClass(t.status)}`}
                  style={{ width: `${t.student_mastery}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-medium ${
                  t.status === 'strong'     ? 'text-emerald-600' :
                  t.status === 'developing' ? 'text-amber-600'   :
                  t.status === 'at_risk'    ? 'text-orange-600'  :
                  'text-rose-600'
                }`}>
                  {t.status.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-muted-foreground/70">
                  {Math.round((t.curriculum_weight ?? 0) * 100)}% of exam
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}