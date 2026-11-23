// Focus systems (Focus Mode v1, spec §5.2). Pure data + helpers, no React.

export type FocusSystemId = 'pomodoro' | 'sprint' | 'flowtime' | 'custom'
export type FocusSoundId = 'brown' | 'pink' | 'rain' | 'pulse' | 'silence'
export type FocusSurface = 'dock' | 'pip'

/** Resolved timings for one session. `focusMin: null` means count up (Flowtime). */
export interface SystemConfig {
  system: FocusSystemId
  focusMin: number | null
  breakMin: number | null
  longBreakMin: number | null
  /** A long break replaces the normal break after every N completed rounds. */
  longBreakEvery: number | null
}

export interface CustomSettings {
  focusMin: number
  breakMin: number
  longBreak: boolean
  longBreakMin: number
}

export const CUSTOM_LIMITS = {
  focusMin: { min: 5, max: 90 },
  breakMin: { min: 1, max: 30 },
  longBreakMin: { min: 5, max: 60 },
} as const

export const DEFAULT_CUSTOM: CustomSettings = {
  focusMin: 30,
  breakMin: 5,
  longBreak: false,
  longBreakMin: 15,
}

export const SYSTEMS: Record<
  FocusSystemId,
  { label: string; tagline: string; summary: string }
> = {
  pomodoro: { label: 'Pomodoro', tagline: 'Studied', summary: '25 min focus · 5 min break · 15 min every 4' },
  sprint: { label: 'Sprint', tagline: 'Studied, good for starting', summary: '12 min focus · 3 min break' },
  flowtime: { label: 'Flowtime', tagline: 'Studied', summary: 'Focus until you stop · break = focus ÷ 5' },
  custom: { label: 'Custom', tagline: 'Your own system', summary: 'Pick your own focus and break' },
}

export const SYSTEM_ORDER: FocusSystemId[] = ['pomodoro', 'sprint', 'flowtime', 'custom']

export const SOUNDS: Record<FocusSoundId, { label: string }> = {
  brown: { label: 'Brown noise' },
  pink: { label: 'Pink noise' },
  rain: { label: 'Rain' },
  pulse: { label: 'Pulse' },
  silence: { label: 'Silence' },
}

export const SOUND_ORDER: FocusSoundId[] = ['brown', 'pink', 'rain', 'pulse', 'silence']

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(n)))

export function resolveConfig(
  system: FocusSystemId,
  custom: CustomSettings = DEFAULT_CUSTOM,
): SystemConfig {
  switch (system) {
    case 'pomodoro':
      return { system, focusMin: 25, breakMin: 5, longBreakMin: 15, longBreakEvery: 4 }
    case 'sprint':
      return { system, focusMin: 12, breakMin: 3, longBreakMin: null, longBreakEvery: null }
    case 'flowtime':
      return { system, focusMin: null, breakMin: null, longBreakMin: null, longBreakEvery: null }
    case 'custom': {
      const L = CUSTOM_LIMITS
      return {
        system,
        focusMin: clamp(custom.focusMin, L.focusMin.min, L.focusMin.max),
        breakMin: clamp(custom.breakMin, L.breakMin.min, L.breakMin.max),
        longBreakMin: custom.longBreak
          ? clamp(custom.longBreakMin, L.longBreakMin.min, L.longBreakMin.max)
          : null,
        longBreakEvery: custom.longBreak ? 4 : null,
      }
    }
  }
}

/** Flowtime's suggested break: focus ÷ 5, at least 3 and at most 20 minutes. */
export function flowtimeBreakMin(focusMs: number): number {
  return clamp(focusMs / 60_000 / 5, 3, 20)
}
