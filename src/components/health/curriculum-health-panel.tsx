import type { CurriculumHealth, CurriculumGroupScore } from '@/lib/actions/analytics'

// SPEC-03 S3-R30/R31. Numbers only come from the API; every ratio is shown as
// "passed of counted" so nothing is a score without its denominator.

const GATE_LABEL: Record<string, string> = {
  G1: 'Outcome coverage',
  G2: 'Grounding in syllabus text',
  G3: 'Class & term scope',
  G4: 'Cognitive level',
  G5: 'Assessment alignment',
  G6: 'Factual accuracy',
}

function ratio(g: CurriculumGroupScore) {
  return g.counted ? `${g.passed} of ${g.counted}` : 'no benchmark'
}

function Pct({ v }: { v: number | null }) {
  if (v === null) return <span className="opacity-60">—</span>
  return <span>{Math.round(v * 10) / 10}%</span>
}

export function CurriculumHealthPanel({ health, dark = false }: { health: CurriculumHealth; dark?: boolean }) {
  const card = dark
    ? 'rounded-xl p-4 border border-white/10 bg-white/[0.02] text-white'
    : 'rounded-xl p-4 border bg-white text-slate-900'
  const muted = dark ? 'text-white/50' : 'text-slate-500'
  const h2 = dark ? 'text-sm font-semibold text-white' : 'text-base font-semibold text-slate-900'
  const l = health.lessons
  const gated = l.by_status.verified + l.by_status.needs_review + l.by_status.rejected

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className={h2}>Curriculum data quality</h2>
        <p className={`text-xs ${muted}`}>
          Integrity is the headline (is the curriculum data sound?). Cognitive demand compares each
          syllabus with the bands its own curriculum declares; it describes the syllabus and is not
          counted as a data defect.
        </p>
        {health.schemas.length === 0 ? (
          <p className={`text-sm ${muted}`}>No curriculum schemas in scope.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {health.schemas.map((s) => {
              const failed = s.checks.filter((c) => c.status === 'fail' && c.group === 'integrity')
              return (
                <div key={s.schema_id} className={card}>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium">
                      {s.subject ?? s.schema_id}
                      <span className={`ml-2 text-xs ${muted}`}>
                        {s.schema_id}
                        {s.country ? ` · ${s.country}` : ''}
                      </span>
                    </p>
                    <p className="text-lg font-bold"><Pct v={s.integrity.pct} /></p>
                  </div>
                  <p className={`text-xs mt-1 ${muted}`}>
                    Integrity {ratio(s.integrity)} · {s.topics} topics · {s.outcomes} outcomes · v{s.versions}
                  </p>
                  <p className={`text-xs ${muted}`}>
                    Cognitive demand {ratio(s.demand)} bands met
                    {s.observation?.rigor_warning ? ' · below global higher-order target' : ''}
                  </p>
                  {failed.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {failed.map((c) => (
                        <li key={c.id} className="text-xs">
                          <span className="font-medium">{c.label}</span>
                          {c.detail ? <span className={muted}> — {c.detail}</span> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className={h2}>Schemes linked to the curriculum</h2>
        <p className={`text-xs ${muted}`}>
          {health.schemes.ready} of {health.schemes.shown} schemes pass the activation check
          {health.schemes.total > health.schemes.shown ? ` (showing ${health.schemes.shown} of ${health.schemes.total})` : ''}.
        </p>
        <div className="space-y-2">
          {health.schemes.rows.map((r) => (
            <div key={r.scheme_id} className={`${card} flex flex-wrap items-center justify-between gap-2`}>
              <div>
                <p className="text-sm font-medium">{r.subject} — {r.grade_level} · {r.term} {r.academic_year}</p>
                <p className={`text-xs ${muted}`}>
                  {r.entries_with_refs} of {r.entries} entries linked · official text for{' '}
                  {r.official_coverage_pct === null ? '—' : `${r.official_coverage_pct}%`} of linked outcomes
                </p>
                {r.blocking.length > 0 && (
                  <p className="text-xs text-red-500 mt-0.5">{r.blocking.join(', ')}</p>
                )}
              </div>
              <p className={`text-sm font-bold ${r.ok ? 'text-emerald-500' : 'text-red-500'}`}>
                {r.ok ? 'Ready' : 'Blocked'}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className={h2}>Lesson verification</h2>
        <div className={card}>
          <p className="text-3xl font-bold"><Pct v={l.verified_pct} /></p>
          <p className={`text-xs mt-1 ${muted}`}>
            {l.by_status.verified} verified of {gated} gated · {l.by_status.needs_review} awaiting review ·{' '}
            {l.by_status.rejected} rejected · {l.by_status.legacy} older lessons (never gated, excluded)
            {l.oldest_review_age_days !== null ? ` · oldest review waiting ${l.oldest_review_age_days} d` : ''}
          </p>
          {l.mean_score !== null && (
            <p className={`text-xs ${muted}`}>
              Mean gate score {l.mean_score}
              {l.mean_attempts !== null ? ` · ${l.mean_attempts} attempts on average` : ''}
            </p>
          )}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(l.gate_failures).map(([g, n]) => (
              <p key={g} className="text-xs">
                <span className="font-medium">{GATE_LABEL[g] ?? g}</span>
                <span className={muted}> — failed {n}×</span>
              </p>
            ))}
          </div>
        </div>
      </section>

      <p className={`text-xs ${muted}`}>Generated {new Date(health.generated_at).toLocaleString()}</p>
    </div>
  )
}
