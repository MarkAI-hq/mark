// src/lib/learning-velocity.ts
// Plain (non-"use server") module — Next.js server-action files may only
// export async functions, so the shared constant/helper used by both the
// server action (analytics.ts) and client components lives here instead.

export interface LearningVelocity {
  actual_median_days_to_mastery:        number | null
  actual_sample_size:                   number
  curriculum_expected_days_per_outcome: number | null
  baseline_scheme_sample_size:          number
  speed_multiplier:                     number | null
  definition:                           string
}

// Below these, the ratio is noise, not signal — UI should show progress
// toward the threshold instead of a number that looks final.
export const LEARNING_VELOCITY_MIN_OUTCOMES = 30
export const LEARNING_VELOCITY_MIN_SCHEMES  = 3

export function hasEnoughDataForVelocity(v: LearningVelocity): boolean {
  return (
    v.actual_sample_size >= LEARNING_VELOCITY_MIN_OUTCOMES &&
    v.baseline_scheme_sample_size >= LEARNING_VELOCITY_MIN_SCHEMES
  )
}

// A mastery event can genuinely land inside a single session (minutes to a
// few hours) — displaying that in days would round to "0" and look broken,
// the exact failure mode the empty-state work was meant to avoid. Pick
// whichever unit keeps the number honest at its actual scale.
export function formatMasteryDuration(days: number | null): string {
  if (days == null) return '—'
  if (days < 1) {
    const hours = Math.max(1, Math.round(days * 24))
    return `${hours} hour${hours === 1 ? '' : 's'}`
  }
  const rounded = Math.round(days * 10) / 10
  return `${rounded} day${rounded === 1 ? '' : 's'}`
}

// A multiplier this large is usually correct (fast same-session mastery vs.
// a week-scale curriculum baseline) but reads as implausible without context
// — flag it for a footnote rather than hiding or capping it.
export const LEARNING_VELOCITY_LARGE_MULTIPLIER = 20
