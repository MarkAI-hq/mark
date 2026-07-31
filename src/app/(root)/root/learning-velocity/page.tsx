import { redirect }         from 'next/navigation'
import { getSession }       from '@/lib/session'
import { getLearningVelocity } from '@/lib/actions/analytics'
import {
  hasEnoughDataForVelocity,
  LEARNING_VELOCITY_MIN_OUTCOMES,
  LEARNING_VELOCITY_MIN_SCHEMES,
}                            from '@/lib/learning-velocity'
import { Zap, Sparkles } from 'lucide-react'

function StatCard({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="text-3xl font-bold text-white mt-2">{value}</p>
      <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{sub}</p>
    </div>
  )
}

export default async function LearningVelocityPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'Root' && session.role !== 'Support') redirect('/root')

  const { data: v } = await getLearningVelocity()
  const ready = v ? hasEnoughDataForVelocity(v) : false

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: 'rgba(201,168,76,0.15)' }}
        >
          <Zap className="h-5 w-5" style={{ color: '#c9a84c' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Learning Velocity</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Actual time-to-mastery vs. curriculum-paced baseline, platform-wide.
          </p>
        </div>
      </div>

      {!v ? (
        <div
          className="rounded-xl py-10 text-center text-sm"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}
        >
          Could not load learning velocity. Ensure the API is reachable.
        </div>
      ) : !ready ? (
        <div
          className="flex items-start gap-3 rounded-xl p-5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.12)' }}
        >
          <Sparkles className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#c9a84c' }} />
          <div>
            <p className="text-sm font-medium text-white">Still collecting data</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {v.actual_sample_size.toLocaleString()} of {LEARNING_VELOCITY_MIN_OUTCOMES} mastered outcomes logged,{' '}
              {v.baseline_scheme_sample_size.toLocaleString()} of {LEARNING_VELOCITY_MIN_SCHEMES} active schemes of work in place.
              The speed multiplier will appear here once both thresholds are crossed — showing it earlier would be noise, not signal.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Speed Multiplier"
              value={`${v.speed_multiplier}x`}
              sub="Curriculum-paced days ÷ actual days to mastery"
            />
            <StatCard
              title="Actual Median Days to Mastery"
              value={String(v.actual_median_days_to_mastery)}
              sub={`${v.actual_sample_size.toLocaleString()} mastered outcomes`}
            />
            <StatCard
              title="Curriculum-Paced Baseline"
              value={String(v.curriculum_expected_days_per_outcome)}
              sub={`days/outcome, ${v.baseline_scheme_sample_size.toLocaleString()} active schemes`}
            />
          </div>

          <div
            className="rounded-xl p-5 text-xs"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}
          >
            {v.definition}
          </div>
        </>
      )}
    </div>
  )
}
