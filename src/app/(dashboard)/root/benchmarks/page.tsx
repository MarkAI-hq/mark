import { redirect }         from 'next/navigation'
import { getSession }       from '@/lib/session'
import { getPlatformBenchmarks, type BenchmarkMetric, type RagCoverageMetric } from '@/lib/actions/analytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart2, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'

function trafficLight(metric: BenchmarkMetric) {
  if (metric.value === null) return 'bg-slate-100 text-slate-500'
  if (metric.value >= metric.target)                              return 'bg-green-50  text-green-700'
  if (metric.value >= metric.target * 0.9)                       return 'bg-amber-50  text-amber-700'
  return 'bg-red-50 text-red-700'
}

function StatusIcon({ metric }: { metric: BenchmarkMetric }) {
  if (metric.value === null) return <span className="text-slate-400 text-xs">No data</span>
  if (metric.value >= metric.target)       return <CheckCircle2 className="h-4 w-4 text-green-600" />
  if (metric.value >= metric.target * 0.9) return <AlertTriangle className="h-4 w-4 text-amber-600" />
  return <XCircle className="h-4 w-4 text-red-600" />
}

function formatValue(metric: BenchmarkMetric, isPercent = true): string {
  if (metric.value === null) return '—'
  return isPercent ? `${Math.round(metric.value * 100)}%` : String(metric.value)
}

interface BenchmarkCardProps {
  title:       string
  metric:      BenchmarkMetric
  description: string
  extra?:      React.ReactNode
}

function BenchmarkCard({ title, metric, description, extra }: BenchmarkCardProps) {
  const color = trafficLight(metric)
  return (
    <Card className={`border ${color} border-opacity-30`}>
      <CardHeader className="py-4 px-5 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-slate-700">{title}</CardTitle>
          <StatusIcon metric={metric} />
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        <p className="text-3xl font-bold text-slate-900 mt-1">{formatValue(metric)}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          Target: {Math.round(metric.target * 100)}%
          {metric.sample_size != null && ` · ${metric.sample_size.toLocaleString()} samples`}
        </p>
        <p className="text-xs text-slate-400 mt-2">{description}</p>
        {extra}
      </CardContent>
    </Card>
  )
}

export default async function BenchmarksPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'Root' && session.role !== 'Support') redirect('/root')

  const { data: b } = await getPlatformBenchmarks()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
          <BarChart2 className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quality Benchmarks</h1>
          <p className="text-sm text-slate-500 mt-0.5">Platform-wide metrics against Mirror Intelligence quality targets.</p>
        </div>
      </div>

      {!b ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-slate-500">
            Could not load benchmarks. Ensure the API is reachable.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <BenchmarkCard
            title="Study Plan Completion"
            metric={b.study_plan_completion_rate}
            description="Percentage of dispatched study plans completed by students."
          />
          <BenchmarkCard
            title="Curriculum Alignment"
            metric={b.curriculum_alignment_score}
            description="Average audit score across all assessed content."
          />
          <BenchmarkCard
            title="RAG Coverage"
            metric={b.rag_coverage}
            description="Percentage of scheme-of-work entries with an embedding chunk."
            extra={b.rag_coverage.total_entries > 0 && (
              <p className="text-xs text-slate-400 mt-1">
                {b.rag_coverage.embedded_entries.toLocaleString()} / {b.rag_coverage.total_entries.toLocaleString()} entries embedded
              </p>
            )}
          />
          <BenchmarkCard
            title="Prediction Accuracy"
            metric={b.prediction_accuracy}
            description="AI national exam grade prediction accuracy (calibration in progress)."
          />
          <BenchmarkCard
            title="Grading Consistency"
            metric={b.grading_consistency}
            description="Cohen's kappa between AI and teacher marks (requires correction data)."
          />
          <BenchmarkCard
            title="Gap Closure Rate"
            metric={b.gap_closure_rate}
            description="Students who closed a flagged gap after targeted reteach (requires pre/post data)."
          />
        </div>
      )}
    </div>
  )
}
