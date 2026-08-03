// src/components/report-card/report-card.tsx
//
// Formal Uganda NCDC-style termly report card, rendered for print only
// (`hidden print:block`). Shared by the student grades page (self-print for
// marketplace students) and the teacher/admin per-student print action.
// Driven entirely by data already in GradebookResponse — fields the school
// fills by hand (comments, fees, term dates) are rendered as blank ruled rows.

import type {
  GradebookResponse, GradingScale,
} from '@/lib/actions/study-plans'

// ── Derivations ─────────────────────────────────────────────────────────────

function gradeTextColor(label: string | null | undefined): string {
  switch (label) {
    case 'A': return '#1a7f37'
    case 'B': return '#2563eb'
    case 'C': return '#a16207'
    case 'D': return '#b45309'
    default:  return label ? '#b91c1c' : '#6b7280'
  }
}

// NCDC competency identifier 1 (Basic) · 2 (Moderate) · 3 (Outstanding)
function identifier(mastery: number | null): string {
  if (mastery == null) return '—'
  if (mastery >= 70) return '3'
  if (mastery >= 50) return '2'
  return '1'
}

function gradeForPct(pct: number, scale: GradingScale): string {
  const band = scale.grades.find(g => pct >= g.minPct)
  return band?.label ?? scale.grades[scale.grades.length - 1]?.label ?? '—'
}

function resultColor(result: 1 | 2 | 3 | undefined): string {
  if (result === 1) return '#1a7f37'
  if (result === 3) return '#b91c1c'
  return '#b45309'
}

// ── Component ───────────────────────────────────────────────────────────────

export interface ReportCardProps {
  gradebook: GradebookResponse
  student: { name: string; className?: string | null }
  school: { name: string }
}

export function ReportCard({ gradebook, student, school }: ReportCardProps) {
  const { scale, term, subjects, uce_result } = gradebook

  const scored = subjects.filter(s => s.mastery_pct != null)
  const avgPct = scored.length
    ? Math.round(scored.reduce((s, x) => s + (x.mastery_pct ?? 0), 0) / scored.length)
    : null
  const avgCa = scored.length
    ? (subjects.filter(s => s.continuous_score != null)
        .reduce((s, x) => s + (x.continuous_score ?? 0), 0) /
        Math.max(1, subjects.filter(s => s.continuous_score != null).length)).toFixed(1)
    : '—'
  const avgExam = subjects.filter(s => s.exam_score != null).length
    ? (subjects.filter(s => s.exam_score != null)
        .reduce((s, x) => s + (x.exam_score ?? 0), 0) /
        subjects.filter(s => s.exam_score != null).length).toFixed(1)
    : '—'
  const totalPoints = subjects.reduce((s, x) => s + (x.grade_points ?? 0), 0)
  const overallGrade = avgPct != null ? gradeForPct(avgPct, scale) : '—'
  const printedOn = new Date().toLocaleDateString('en-GB')
  const termLabel = term?.label ?? 'Term'
  const year = term?.academic_year ?? new Date().getFullYear()

  const ruled = (
    <>
      <div className="rule-field" />
      <div className="rule-field" />
    </>
  )

  return (
    <div
      className="report-card-print hidden print:block text-black"
      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', fontFamily: 'Arial, sans-serif' }}
    >
      {/* ── School header ── */}
      <div className="text-center pb-2.5" style={{ borderBottom: '3px double #111' }}>
        <h1 className="text-2xl font-bold m-0" style={{ color: '#0f1f3d', letterSpacing: '.5px' }}>
          {school.name}
        </h1>
        <p className="text-[11px] text-gray-500 mt-1 mb-0">Student Termly Report Card</p>
      </div>

      <div
        className="text-center font-bold my-3 py-1.5 rounded-sm text-sm"
        style={{ background: '#0f1f3d', color: '#fff', letterSpacing: '2px' }}
      >
        {termLabel.toUpperCase()} REPORT CARD · {year}
      </div>

      {/* ── Bio ── */}
      <table className="bio w-full text-[12px] mb-3.5" style={{ borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td className="bio-lbl">Name</td>
            <td className="font-semibold" style={{ color: '#0f1f3d' }}>{student.name}</td>
            <td className="bio-lbl">Class</td>
            <td>{student.className ?? subjects[0]?.grade_level ?? '—'}</td>
            <td className="bio-lbl">Term</td>
            <td>{termLabel}</td>
          </tr>
          <tr>
            <td className="bio-lbl">Year</td>
            <td>{year}</td>
            <td className="bio-lbl">Week</td>
            <td>{term ? `${term.current_week} of ${term.total_weeks}` : '—'}</td>
            <td className="bio-lbl">Printed</td>
            <td>{printedOn}</td>
          </tr>
        </tbody>
      </table>

      {/* ── Performance Records ── */}
      <p className="text-[12px] font-bold uppercase mb-1.5" style={{ color: '#0f1f3d', letterSpacing: '.5px' }}>
        Performance Records
      </p>
      <table className="perf w-full text-[11px]" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', width: '24%' }}>Subject</th>
            <th>CA /20</th>
            <th>Exam /80</th>
            <th>Final %</th>
            <th>Grade</th>
            <th>Pts</th>
            <th>Ident.</th>
            <th style={{ textAlign: 'left', width: '22%' }}>Remarks / Descriptor</th>
            <th>T.R</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map(sub => (
            <tr key={sub.scheme_id} style={{ breakInside: 'avoid' }}>
              <td style={{ textAlign: 'left', fontWeight: 600 }}>{sub.subject}</td>
              <td>{sub.continuous_score != null ? sub.continuous_score : '—'}</td>
              <td>{sub.exam_score != null ? sub.exam_score : '—'}</td>
              <td>{sub.mastery_pct != null ? sub.mastery_pct : '—'}</td>
              <td style={{ fontWeight: 700, color: gradeTextColor(sub.grade_band?.label) }}>
                {sub.grade_band?.label ?? '—'}
              </td>
              <td>{sub.grade_points ?? '—'}</td>
              <td>{identifier(sub.mastery_pct)}</td>
              <td style={{ textAlign: 'left' }}>{sub.grade_band?.descriptor ?? '—'}</td>
              <td />
            </tr>
          ))}
          <tr className="avgrow" style={{ fontWeight: 700 }}>
            <td style={{ textAlign: 'left' }}>AVERAGE</td>
            <td>{avgCa}</td>
            <td>{avgExam}</td>
            <td>{avgPct != null ? `${avgPct}%` : '—'}</td>
            <td style={{ color: gradeTextColor(overallGrade) }}>{overallGrade}</td>
            <td>{totalPoints}</td>
            <td>—</td>
            <td style={{ textAlign: 'left' }}>—</td>
            <td />
          </tr>
        </tbody>
      </table>

      {/* ── Overall band ── */}
      <div className="flex gap-2.5 my-3.5">
        {[
          { k: 'Overall Grade', v: overallGrade, color: gradeTextColor(overallGrade) },
          { k: 'Average', v: avgPct != null ? `${avgPct}%` : '—' },
          { k: 'Total Points', v: String(totalPoints) },
          ...(uce_result
            ? [{ k: 'UCE Result', v: `Result ${uce_result.result}`, color: resultColor(uce_result.result) }]
            : []),
        ].map(b => (
          <div key={b.k} className="flex-1 text-center py-2 px-1 rounded" style={{ border: '1px solid #999' }}>
            <div className="text-[10px] uppercase text-gray-500" style={{ letterSpacing: '.5px' }}>{b.k}</div>
            <div className="text-[20px] font-extrabold" style={{ color: b.color ?? '#0f1f3d' }}>{b.v}</div>
          </div>
        ))}
      </div>

      {/* No Division I-IV under the new curriculum — UCE Result category is a
          whole-student outcome across all subjects, shown as a caption since it
          isn't a per-subject grade like the tiles above. */}
      {uce_result && (
        <p className="text-[10px] mb-3" style={{ color: '#555' }}>
          {uce_result.detail} {uce_result.actionable}
        </p>
      )}

      {/* ── Scale + Key ── */}
      <div className="flex gap-3.5 mb-3">
        <div className="flex-1 rounded p-2.5" style={{ border: '1px solid #999' }}>
          <p className="text-[12px] font-bold uppercase mb-1.5" style={{ color: '#0f1f3d' }}>Grading Scale</p>
          <div className="grid grid-cols-5 gap-1 text-center text-[10px]">
            {scale.grades.map(g => (
              <div key={g.label} className="p-1 rounded" style={{ border: '1px solid #ccc' }}>
                <b style={{ fontSize: '13px', color: gradeTextColor(g.label) }}>{g.label}</b><br />
                {g.minPct}%+<br />
                <span className="text-gray-500">{g.descriptor}</span><br />
                {g.points} pts
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 rounded p-2.5" style={{ border: '1px solid #999' }}>
          <p className="text-[12px] font-bold uppercase mb-1.5" style={{ color: '#0f1f3d' }}>Key to Terms (NCDC)</p>
          <ul className="text-[10.5px] text-gray-700 pl-4 m-0" style={{ lineHeight: 1.5 }}>
            <li>
              <b>CA</b> = Continuous Assessment ({Math.round(scale.assessmentWeights.continuous * 100)}%) ·{' '}
              <b>Exam</b> = End-of-term ({Math.round(scale.assessmentWeights.exam * 100)}%)
            </li>
            <li><b>Identifier:</b> 1 = Basic · 2 = Moderate · 3 = Outstanding</li>
            <li>Attitudes &amp; generic skills are embedded in Learning Outcomes — not scored separately.</li>
          </ul>
        </div>
      </div>

      {/* ── Comments (filled by hand) ── */}
      <div className="flex gap-3.5 mb-3">
        {['Class Teacher’s Comment', 'Head Teacher’s Comment'].map(label => (
          <div key={label} className="flex-1 rounded p-2.5" style={{ border: '1px solid #999' }}>
            <span className="text-[11px] font-bold" style={{ color: '#0f1f3d' }}>{label}</span>
            {ruled}
            <div className="mt-2 text-[10px] text-gray-500">
              Signature: <span className="inline-block w-32" style={{ borderBottom: '1px solid #bbb' }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Footer fields (filled by hand) ── */}
      <table className="foot w-full text-[11px]" style={{ borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td className="foot-lbl">Term ended on</td><td />
            <td className="foot-lbl">Next term begins</td><td />
          </tr>
          <tr>
            <td className="foot-lbl">Fees balance</td><td />
            <td className="foot-lbl">Fees next term</td><td />
          </tr>
          <tr>
            <td className="foot-lbl">Other requirement</td><td colSpan={3} />
          </tr>
        </tbody>
      </table>

      {/* ── Signatures ── */}
      <div className="flex gap-8 mt-4 text-[10px] text-gray-600">
        {['Class Teacher', 'Head Teacher', 'Parent / Guardian · Date'].map(s => (
          <div key={s} className="flex-1 text-center">
            <div className="mb-1 h-5" />
            <div style={{ borderTop: '1px solid #555', paddingTop: '3px' }}>{s}</div>
          </div>
        ))}
      </div>

      <p className="text-center text-[9.5px] text-gray-400 mt-4">
        ◈ Generated by Mirror Intelligence · mirror.ug · © {year}
      </p>
    </div>
  )
}
