import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getPlatformHealth } from '@/lib/actions/analytics'
import { Activity, AlertTriangle, CheckCircle2, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ContentHealthPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'Admin') redirect('/dashboard')

  const { data: health } = await getPlatformHealth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Content Health</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Where your school&apos;s own scheme-of-work content has gaps — thin
          term coverage, or topics mastery can never be recorded for yet.
        </p>
      </div>

      {!health ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">
              Could not load content health right now.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-slate-500" />
                Thin scheme coverage
              </CardTitle>
              <p className="text-sm text-slate-500">
                Active schemes with under 50% of their term weeks defined.
              </p>
            </CardHeader>
            <CardContent>
              {health.schemeCoverage.length === 0 ? (
                <p className="text-sm text-slate-500 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  No active schemes are below the coverage threshold.
                </p>
              ) : (
                <div className="space-y-2">
                  {health.schemeCoverage.map((s) => {
                    const pct = s.pct ?? 0
                    return (
                      <div
                        key={s.schemeId}
                        className="flex items-center justify-between rounded-lg border px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {s.subject} — {s.gradeLevel}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {s.weeksDefined} / {s.totalWeeks} weeks defined
                          </p>
                        </div>
                        <p
                          className={
                            pct < 0.3
                              ? 'text-lg font-bold text-red-500'
                              : 'text-lg font-bold text-amber-500'
                          }
                        >
                          {Math.round(pct * 100)}%
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-slate-500" />
                Missing learning objectives
              </CardTitle>
              <p className="text-sm text-slate-500">
                Active, curriculum-linked entries with no learning objectives —
                topic mastery can&apos;t be recorded for these until they&apos;re
                authored.
              </p>
            </CardHeader>
            <CardContent>
              {health.missingLearningObjectives.length === 0 ? (
                <p className="text-sm text-slate-500 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  No active scheme has entries missing learning objectives.
                </p>
              ) : (
                <div className="space-y-2">
                  {health.missingLearningObjectives.map((row) => (
                    <div
                      key={row.schemeId}
                      className="flex items-center justify-between rounded-lg border px-4 py-3"
                    >
                      <p className="text-sm text-slate-900">
                        {row.subject} — {row.gradeLevel}
                      </p>
                      <p className="text-sm font-bold text-red-500">
                        {row.missingCount} entries
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Learning analytics coverage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">
                {health.learningAnalyticsCoverage.pct !== null
                  ? `${Math.round(health.learningAnalyticsCoverage.pct * 100)}%`
                  : '—'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {health.learningAnalyticsCoverage.studentsWithAnalyticsRow} /{' '}
                {health.learningAnalyticsCoverage.activeEnrolledStudents}{' '}
                actively class-enrolled students have a learning_analytics row
                (nightly refresh at 23:00 UTC).
              </p>
            </CardContent>
          </Card>

          <p className="text-xs text-slate-400">
            Generated {new Date(health.generatedAt).toLocaleString()}
          </p>
        </>
      )}
    </div>
  )
}
