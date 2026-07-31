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
