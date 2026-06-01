// src/app/student/(portal)/my-pathway/page.tsx
// N6: The Pathway Page — student's personal action plan toward national exam

import { redirect }       from 'next/navigation'
import { cookies }        from 'next/headers'
import Link               from 'next/link'
import { getStudentPrediction } from '@/lib/actions/prediction'
import { NationalExamPredictionCard } from '@/components/prediction/national-exam-prediction-card'
import { Badge }          from '@/components/ui/badge'
import { Button }         from '@/components/ui/button'
import { Separator }      from '@/components/ui/separator'
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle,
  ArrowRight, BookOpen, Target,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function MyPathwayPage({
  searchParams,
}: {
  searchParams: { curriculumId?: string }
}) {
  const cookieStore = await cookies()
  const userCookie  = cookieStore.get('user')?.value
  if (!userCookie) redirect('/student/login')

  let user: any = null
  try { user = JSON.parse(userCookie) } catch { redirect('/student/login') }

  const curriculumId = searchParams.curriculumId ?? ''

  if (!curriculumId) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <Target className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-40" />
        <h2 className="text-lg font-semibold">Select a subject</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Navigate here from your dashboard to see your national exam pathway.
        </p>
      </div>
    )
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
    'bg-slate-50 text-slate-500 border-slate-200'

  const topicStatusClass = (s: string) =>
    s === 'strong'     ? 'bg-emerald-500' :
    s === 'developing' ? 'bg-amber-400'   :
    s === 'at_risk'    ? 'bg-orange-500'  :
    'bg-rose-600'

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16 pt-4 px-4">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Your path to {prediction.exam_level.toUpperCase()} {prediction.subject}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Predicted: {prediction.predicted_label} {prediction.predicted_grade} ({prediction.predicted_score}%)
          {prediction.gap_to_next_grade > 0 && (
            <> · You need <span className="font-medium text-slate-700">+{prediction.gap_to_next_grade} pp</span> for {prediction.next_grade_label} {prediction.next_grade}</>
          )}
        </p>
      </div>

      {/* ── Prediction card (full) ──────────────────────────────────── */}
      <NationalExamPredictionCard prediction={prediction} showPathway={false} />

      <Separator />

      {/* ── Highest impact actions ──────────────────────────────────── */}
      {prediction.pathway.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
            Highest impact actions · ranked by expected exam gain
          </h2>
          {prediction.pathway.map((action) => (
            <div
              key={action.rank}
              className="rounded-lg border p-4 space-y-2 bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 w-5">{action.rank}.</span>
                  <Badge variant="outline" className={`text-[10px] ${urgencyClass(action.urgency)}`}>
                    {action.urgency.toUpperCase()}
                  </Badge>
                </div>
                <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 shrink-0">
                  +{action.expected_gain_pp} pp expected
                </Badge>
              </div>
              <p className="text-sm text-slate-800 font-medium">{action.action}</p>
              <p className="text-xs text-slate-500">Topic: {action.topic}</p>
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
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
            Topic performance
          </h2>
          {prediction.topic_performance.map((t) => (
            <div key={t.topic} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700">{t.topic}</span>
                <span className="text-xs text-slate-500">
                  {t.student_mastery}% · national avg {t.national_average}%
                </span>
              </div>
              <div className="relative h-2 rounded-full bg-slate-100">
                {/* National average marker */}
                <div
                  className="absolute h-full w-0.5 bg-slate-400 rounded"
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
                <span className="text-[10px] text-slate-400">
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
