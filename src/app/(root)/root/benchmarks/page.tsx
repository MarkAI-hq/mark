import { redirect }         from 'next/navigation'
import { getSession }       from '@/lib/session'
import { getPlatformBenchmarks, type BenchmarkMetric } from '@/lib/actions/analytics'
import { BarChart2, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'

function statusColor(metric: BenchmarkMetric) {
  if (metric.value === null) return '#8b8b9a'
  if (metric.value >= metric.target)        return '#4ade80'
  if (metric.value >= metric.target * 0.9)  return '#fbbf24'
  return '#f87171'
}

function StatusIcon({ metric }: { metric: BenchmarkMetric }) {
  if (metric.value === null) return <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>No data</span>
  const color = statusColor(metric)
  if (metric.value >= metric.target)       return <CheckCircle2 className="h-4 w-4" style={{ color }} />
  if (metric.value >= metric.target * 0.9) return <AlertTriangle className="h-4 w-4" style={{ color }} />
  return <XCircle className="h-4 w-4" style={{ color }} />
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
  const color = statusColor(metric)
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${metric.value === null ? 'rgba(255,255,255,0.07)' : `${color}33`}` }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">{title}</p>
        <StatusIcon metric={metric} />
      </div>
      <p className="text-3xl font-bold text-white mt-2">{formatValue(metric)}</p>
      <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
        Target: {Math.round(metric.target * 100)}%
        {metric.sample_size != null && ` · ${metric.sample_size.toLocaleString()} samples`}
      </p>
      <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>{description}</p>
      {extra}
    </div>
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
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: 'rgba(201,168,76,0.15)' }}
        >
          <BarChart2 className="h-5 w-5" style={{ color: '#c9a84c' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Quality Benchmarks</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Platform-wide metrics against Mirror Intelligence quality targets.
          </p>
        </div>
      </div>

      {!b ? (
        <div
          className="rounded-xl py-10 text-center text-sm"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}
        >
          Could not load benchmarks. Ensure the API is reachable.
        </div>
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
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
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
