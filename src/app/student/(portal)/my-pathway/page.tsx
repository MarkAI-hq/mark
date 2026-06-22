// src/app/student/(portal)/my-pathway/page.tsx
// N6: The Pathway Page — student's personal action plan toward national exam

import { redirect }       from 'next/navigation'
import { cookies }        from 'next/headers'
import Link               from 'next/link'
import { getStudentPrediction } from '@/lib/actions/prediction'
import { getStudentPredictions } from '@/lib/actions/student-dashboard'
import { NationalExamPredictionCard } from '@/components/prediction/national-exam-prediction-card'
import { Badge }          from '@/components/ui/badge'
import { Button }         from '@/components/ui/button'
import { Separator }      from '@/components/ui/separator'
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle,
  ArrowRight, Target, Timer, Flame, ArrowUpRight, ArrowDownRight,
  ArrowUp, ArrowDown, Info,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function MyPathwayPage({
  searchParams,
}: {
  searchParams: Promise<{ curriculumId?: string; subject?: string }>
}) {
  const cookieStore = await cookies()
  const userCookie  = cookieStore.get('user')?.value
  if (!userCookie) redirect('/student/login')

  let user: any = null
  try { user = JSON.parse(decodeURIComponent(userCookie)) } catch { redirect('/student/login') }

  const { curriculumId: curriculumIdParam, subject: subjectParam } = await searchParams
  let curriculumId = curriculumIdParam ?? ''

  // No curriculumId (e.g. the nav "Progress" entry, or a legacy ?subject link):
  // resolve from the subject, otherwise show a real subject picker — never a
  // dead-end "select a subject" screen.
  if (!curriculumId) {
    const predictions = await getStudentPredictions(user.user_id)
    if (subjectParam) {
      const match = predictions.find(
        (p) => p.subject?.toLowerCase() === subjectParam.toLowerCase(),
      )
      if (match) curriculumId = match.curriculum_id
    }

    if (!curriculumId) {
      if (predictions.length === 0) {
        return (
          <div className="max-w-2xl mx-auto py-12 text-center">
            <Target className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h2 className="text-lg font-semibold">No progress yet</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Complete a graded assessment and your goal pathway will appear here.
            </p>
          </div>
        )
      }
      return (
        <div className="max-w-2xl mx-auto py-8 px-4 space-y-4">
          <div>
            <h1 className="text-xl font-semibold">Your progress</h1>
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
                  <p className="text-sm font-medium truncate">{p.subject}</p>
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
  }

  const { data: prediction, error } = await getStudentPrediction(user.user_id, curriculumId)

  if (error || !prediction) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
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
    <div className="max-w-3xl mx-auto space-y-6 pb-16 pt-4 px-4">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
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
              <p className="text-2xl font-bold text-foreground mt-0.5">{prediction.initial_predicted_score}%</p>
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
              <p className="text-2xl font-bold text-foreground mt-0.5">{prediction.predicted_score}%</p>
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
            Complete at least 2 graded assessments to unlock trajectory tracking and see how you're improving over time.
          </p>
        </div>
      )}

      {/* ── N7: Exam countdown + urgency projection ──────────────────── */}
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
                <p className={`text-sm font-semibold ${
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
          {prediction.pathway.map((action) => (
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
              <p className="text-sm text-foreground font-medium">{action.action}</p>
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

      {/* ── Topic radar ──────────────────────────────────────────────── */}
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
          {prediction.topic_performance.map((t) => (
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
