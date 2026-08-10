import { redirect }         from 'next/navigation'
import { getSession }       from '@/lib/session'
import { getPlatformHealth, type SeedTableCount, type ThinSchemeOfWork, type MissingLearningObjectives } from '@/lib/actions/analytics'
import { Activity, CheckCircle2, AlertTriangle, Database } from 'lucide-react'

function countColor(row: SeedTableCount): string {
  return row.rowCount === 0 ? '#f87171' : '#4ade80'
}

function SeedCountCard({ row }: { row: SeedTableCount }) {
  const color = countColor(row)
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}33` }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-mono text-white">{row.table}</p>
        {row.rowCount === 0
          ? <AlertTriangle className="h-4 w-4" style={{ color }} />
          : <CheckCircle2 className="h-4 w-4" style={{ color }} />}
      </div>
      <p className="text-2xl font-bold text-white mt-1">{row.rowCount.toLocaleString()}</p>
      {row.breakdown && (
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {Object.entries(row.breakdown).map(([k, v]) => `${k}: ${v}`).join(' · ')}
        </p>
      )}
    </div>
  )
}

function MissingObjectivesRow({ row }: { row: MissingLearningObjectives }) {
  return (
    <div
      className="flex items-center justify-between rounded-lg px-4 py-3"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <p className="text-sm text-white">{row.subject} — {row.gradeLevel}</p>
      <p className="text-lg font-bold" style={{ color: '#f87171' }}>{row.missingCount} entries</p>
    </div>
  )
}

function ThinSchemeRow({ scheme }: { scheme: ThinSchemeOfWork }) {
  const pct = scheme.pct ?? 0
  const color = pct < 0.3 ? '#f87171' : '#fbbf24'
  return (
    <div
      className="flex items-center justify-between rounded-lg px-4 py-3"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div>
        <p className="text-sm text-white">{scheme.subject} — {scheme.gradeLevel}</p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {scheme.weeksDefined} / {scheme.totalWeeks} weeks defined
        </p>
      </div>
      <p className="text-lg font-bold" style={{ color }}>{Math.round(pct * 100)}%</p>
    </div>
  )
}

export default async function PlatformHealthPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'Root' && session.role !== 'Support') redirect('/root')

  const { data: health } = await getPlatformHealth()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: 'rgba(201,168,76,0.15)' }}
        >
          <Activity className="h-5 w-5" style={{ color: '#c9a84c' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Health</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Reference-data integrity, content coverage, and personalization pipeline status.
          </p>
        </div>
      </div>

      {!health ? (
        <div
          className="rounded-xl py-10 text-center text-sm"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}
        >
          Could not load platform health. Ensure the API is reachable.
        </div>
      ) : (
        <>
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Database className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
              <h2 className="text-sm font-semibold text-white">Reference Data</h2>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Platform-wide seeded data — a zero here on prod usually means a seed script never ran.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {health.seedCounts.map((row) => (
                <SeedCountCard key={row.table} row={row} />
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold text-white">Thin Scheme Coverage</h2>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Active schemes with under 50% of their term weeks defined.
              </p>
            </div>
            {health.schemeCoverage.length === 0 ? (
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                No active schemes are below the coverage threshold.
              </p>
            ) : (
              <div className="space-y-2">
                {health.schemeCoverage.map((s) => (
                  <ThinSchemeRow key={s.schemeId} scheme={s} />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold text-white">Missing Learning Objectives</h2>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Active, curriculum-linked entries with no learning_objectives — topic mastery can never
                be recorded for these until the curriculum topic has outcomes authored. Run{' '}
                <code>backfill-sow-learning-objectives.ts</code> first to re-sync stale entries; what&apos;s
                left here needs real content authoring.
              </p>
            </div>
            {health.missingLearningObjectives.length === 0 ? (
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                No active scheme has entries missing learning objectives.
              </p>
            ) : (
              <div className="space-y-2">
                {health.missingLearningObjectives.map((row) => (
                  <MissingObjectivesRow key={row.schemeId} row={row} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-sm font-semibold text-white mb-3">Learning Analytics Coverage</h2>
            <div
              className="rounded-xl p-5"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <p className="text-3xl font-bold text-white">
                {health.learningAnalyticsCoverage.pct !== null
                  ? `${Math.round(health.learningAnalyticsCoverage.pct * 100)}%`
                  : '—'}
              </p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {health.learningAnalyticsCoverage.studentsWithAnalyticsRow} / {health.learningAnalyticsCoverage.activeEnrolledStudents} actively class-enrolled students have a learning_analytics row (nightly refresh at 23:00 UTC).
              </p>
            </div>
          </section>

          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Generated {new Date(health.generatedAt).toLocaleString()}
          </p>
        </>
      )}
    </div>
  )
}
