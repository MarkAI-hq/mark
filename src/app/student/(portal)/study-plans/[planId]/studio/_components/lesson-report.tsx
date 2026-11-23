'use client'

// End-of-lesson report (#8) — every line is computed from what the student
// actually did in this lesson; nothing is estimated. Each metric carries a
// one-line "why this matters" grounded in a well-replicated learning-science
// finding, so the report teaches the student how learning works, not just
// how they scored:
//   points turned green → mastery feedback on specific outcomes
//   first-try recall    → retrieval practice / the testing effect
//   mix-ups fixed       → misconception correction with feedback
//   next review date    → the spacing effect
//   time vs. estimate   → time-on-task, framed as information, not judgement

import { CheckCircle2, Circle, Brain, CalendarClock, Clock, Wrench } from 'lucide-react'
import type { SceneResponse } from './lesson-player'

const SCORED = new Set(['probe', 'quiz', 'hint_quiz', 'retrieval_flash', 'phenomenon_story', 'peer_teach', 'interactive'])

export interface LessonReportData {
  green: string[]
  notYet: string[]
  recallCorrect: number
  recallTotal: number
  mixupsFixed: number
  minutes: number | null
  estimatedMinutes: number | null
  nextReview: string | null
  /** Pre-filled "still tricky" candidates for the review log. */
  missed: string[]
}

interface OutcomeItem { outcome?: string; curriculum_ref?: string }

/** Pure: derive the report from the lesson's own scenes and responses. */
export function buildLessonReport(args: {
  scenes: any[]
  responses: SceneResponse[]
  achievedRefs: string[]
  startedAt: number | null
  estimatedMinutes?: number | null
  nextReview?: string | null
}): LessonReportData {
  const achieved = new Set(args.achievedRefs)
  const items: OutcomeItem[] = args.scenes
    .filter((s) => s?.type === 'outcomes_check')
    .flatMap((s) => (s?.content?.items ?? []) as OutcomeItem[])
  const green: string[] = []
  const notYet: string[] = []
  for (const it of items) {
    const label = String(it.outcome ?? '').trim()
    if (!label) continue
    if (it.curriculum_ref && achieved.has(it.curriculum_ref)) green.push(label)
    else notYet.push(label)
  }

  const scored = args.responses.filter((r) => SCORED.has(r.type) && typeof r.correct === 'boolean')
  const recallCorrect = scored.filter((r) => r.correct).length
  const mixupsFixed = args.responses.reduce((n, r) => n + (r.misconception_hits?.length ?? 0), 0)

  const missedScenes = scored
    .filter((r) => !r.correct && typeof r.sceneIndex === 'number')
    .map((r) => String(args.scenes[r.sceneIndex!]?.title ?? '').trim())
    .filter(Boolean)
  const seen = new Set<string>()
  const missed = [...notYet, ...missedScenes].filter((t) => {
    const k = t.toLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  }).slice(0, 6)

  const minutes = args.startedAt ? Math.max(1, Math.round((Date.now() - args.startedAt) / 60_000)) : null

  return {
    green,
    notYet,
    recallCorrect,
    recallTotal: scored.length,
    mixupsFixed,
    minutes,
    estimatedMinutes: args.estimatedMinutes ?? null,
    nextReview: args.nextReview ?? null,
    missed,
  }
}

function formatReviewDate(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  const days = Math.round((d.getTime() - Date.now()) / 86_400_000)
  const label = d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })
  return days <= 1 ? `tomorrow (${label})` : label
}

function Row({ icon: Icon, title, why, children }: { icon: typeof Brain; title: string; why: string; children?: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-3 first:pt-0 last:pb-0">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        {children}
        <p className="mt-1 text-xs text-muted-foreground">{why}</p>
      </div>
    </div>
  )
}

export function LessonReport({ report }: { report: LessonReportData }) {
  const { green, notYet, recallCorrect, recallTotal, mixupsFixed, minutes, estimatedMinutes, nextReview } = report
  const hasOutcomes = green.length + notYet.length > 0

  return (
    <section aria-label="Your lesson report" className="rounded-xl border bg-card p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your lesson report</h3>
      <div className="divide-y">
        {hasOutcomes && (
          <Row
            icon={CheckCircle2}
            title={`${green.length} of ${green.length + notYet.length} learning points turned green`}
            why="Knowing exactly which points you've got (and which you haven't) is what makes practice efficient."
          >
            <ul className="mt-1.5 space-y-1">
              {green.map((g) => (
                <li key={`g-${g}`} className="flex items-start gap-1.5 text-xs">
                  <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" aria-hidden />
                  <span className="min-w-0">{g}</span>
                </li>
              ))}
              {notYet.map((n) => (
                <li key={`n-${n}`} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Circle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" aria-hidden />
                  <span className="min-w-0">{n} <span className="italic">— not yet</span></span>
                </li>
              ))}
            </ul>
          </Row>
        )}

        {recallTotal > 0 && (
          <Row
            icon={Brain}
            title={`You recalled ${recallCorrect} of ${recallTotal} answers on your own`}
            why={
              recallCorrect < recallTotal
                ? 'Getting some wrong is part of it — pulling answers from memory, even unsuccessfully, builds stronger memory than re-reading.'
                : 'Pulling answers from memory builds stronger, longer-lasting memory than re-reading.'
            }
          />
        )}

        {mixupsFixed > 0 && (
          <Row
            icon={Wrench}
            title={`${mixupsFixed} common mix-up${mixupsFixed === 1 ? '' : 's'} caught and corrected`}
            why="Spotting a misconception and seeing why it's wrong is how wrong ideas actually get replaced."
          />
        )}

        {nextReview && (
          <Row
            icon={CalendarClock}
            title={`We'll bring this back ${formatReviewDate(nextReview)}`}
            why="Reviewing after a gap — just as you start to forget — makes learning stick far better than repeating it today."
          />
        )}

        {minutes !== null && (
          <Row
            icon={Clock}
            title={`${minutes} min this session${estimatedMinutes ? ` · planned for about ${estimatedMinutes}` : ''}`}
            why={
              estimatedMinutes && minutes > estimatedMinutes * 1.5
                ? 'Taking longer is fine — it often means you were working things out rather than skimming.'
                : 'Short, focused sessions done regularly beat long, occasional ones.'
            }
          />
        )}
      </div>
    </section>
  )
}
