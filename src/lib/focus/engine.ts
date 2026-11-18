// Focus session engine (Focus Mode v1, spec §5.1).
//
// A pure state machine: idle → focusing → break → focusing … → ended, plus a
// `paused` flag. Time is derived from timestamps only — `phaseStartedAt` and
// `phaseDurationMs` — never from counting ticks, so a sleeping laptop, a
// throttled background tab or a reload all land on the correct phase.
// Every function takes `now` explicitly so it can be tested without timers.

import {
  flowtimeBreakMin,
  type FocusSoundId,
  type FocusSurface,
  type SystemConfig,
} from './systems'

export const STORAGE_KEY = 'mirror.focus.v1'
export const STATE_VERSION = 1

export type FocusPhase = 'idle' | 'focusing' | 'break' | 'ended'
export type EndStatus = 'completed' | 'abandoned'
export type EndReason = 'completed' | 'user_stopped' | 'idle_timeout' | 'lid_closed'

export interface FocusState {
  v: typeof STATE_VERSION
  sessionId: string | null
  phase: FocusPhase
  paused: boolean
  pausedAt: number | null
  config: SystemConfig | null
  sound: FocusSoundId
  surface: FocusSurface
  goalSubject: string | null
  goalTopic: string | null
  startedAt: number | null
  endedAt: number | null
  phaseStartedAt: number | null
  /** null = count up (Flowtime focus). */
  phaseDurationMs: number | null
  isLongBreak: boolean
  /** Focus time from finished focus intervals; the live interval is added on read. */
  focusAccumMs: number
  roundsCompleted: number
  breaksTaken: number
  breaksSkipped: number
  endStatus: EndStatus | null
  endReason: EndReason | null
}

export type TransitionKind = 'focus_end' | 'break_end'

export interface Transition {
  kind: TransitionKind
  /** When the transition should have happened (may be in the past after sleep). */
  at: number
  /** The phase entered. */
  to: FocusPhase
  isLongBreak: boolean
}

const MIN = 60_000

export function initialState(): FocusState {
  return {
    v: STATE_VERSION,
    sessionId: null,
    phase: 'idle',
    paused: false,
    pausedAt: null,
    config: null,
    sound: 'silence',
    surface: 'dock',
    goalSubject: null,
    goalTopic: null,
    startedAt: null,
    endedAt: null,
    phaseStartedAt: null,
    phaseDurationMs: null,
    isLongBreak: false,
    focusAccumMs: 0,
    roundsCompleted: 0,
    breaksTaken: 0,
    breaksSkipped: 0,
    endStatus: null,
    endReason: null,
  }
}

export const isRunning = (s: FocusState) => s.phase === 'focusing' || s.phase === 'break'

// ── Reads ────────────────────────────────────────────────────────────────────

/** Milliseconds spent in the current phase (frozen while paused). */
export function elapsedInPhase(s: FocusState, now: number): number {
  if (s.phaseStartedAt == null) return 0
  const ref = s.paused && s.pausedAt != null ? s.pausedAt : now
  const e = Math.max(0, ref - s.phaseStartedAt)
  return s.phaseDurationMs == null ? e : Math.min(e, s.phaseDurationMs)
}

/** Remaining ms in a timed phase; null while counting up. */
export function remainingMs(s: FocusState, now: number): number | null {
  if (!isRunning(s) || s.phaseDurationMs == null) return null
  return Math.max(0, s.phaseDurationMs - elapsedInPhase(s, now))
}

/** Total focus time, breaks excluded. */
export function focusedMs(s: FocusState, now: number): number {
  const live = s.phase === 'focusing' ? elapsedInPhase(s, now) : 0
  return s.focusAccumMs + live
}

// ── Transitions ──────────────────────────────────────────────────────────────

function breakFor(s: FocusState, roundsAfter: number, focusMsOfInterval: number) {
  const c = s.config!
  if (c.focusMin == null) {
    return { ms: flowtimeBreakMin(focusMsOfInterval) * MIN, long: false }
  }
  const long =
    c.longBreakEvery != null && c.longBreakMin != null && roundsAfter % c.longBreakEvery === 0
  return { ms: (long ? c.longBreakMin! : c.breakMin!) * MIN, long }
}

export interface StartOptions {
  sessionId: string
  config: SystemConfig
  sound: FocusSoundId
  surface?: FocusSurface
  goalSubject?: string | null
  goalTopic?: string | null
}

export function start(opts: StartOptions, now: number): FocusState {
  return {
    ...initialState(),
    sessionId: opts.sessionId,
    phase: 'focusing',
    config: opts.config,
    sound: opts.sound,
    surface: opts.surface ?? 'dock',
    goalSubject: opts.goalSubject?.trim() || null,
    goalTopic: opts.goalTopic?.trim() || null,
    startedAt: now,
    phaseStartedAt: now,
    phaseDurationMs: opts.config.focusMin == null ? null : opts.config.focusMin * MIN,
  }
}

export function pause(s: FocusState, now: number): FocusState {
  if (!isRunning(s) || s.paused) return s
  return { ...s, paused: true, pausedAt: now }
}

export function resume(s: FocusState, now: number): FocusState {
  if (!isRunning(s) || !s.paused || s.pausedAt == null) return s
  // Shift the phase start forward by the paused span: remaining time is preserved.
  const shift = Math.max(0, now - s.pausedAt)
  return {
    ...s,
    paused: false,
    pausedAt: null,
    phaseStartedAt: (s.phaseStartedAt ?? now) + shift,
  }
}

/** End the current focus interval and start a break at `at`. */
function enterBreak(s: FocusState, at: number): FocusState {
  const intervalMs =
    s.phaseDurationMs ?? Math.max(0, at - (s.phaseStartedAt ?? at))
  const rounds = s.roundsCompleted + 1
  const b = breakFor(s, rounds, intervalMs)
  return {
    ...s,
    phase: 'break',
    focusAccumMs: s.focusAccumMs + intervalMs,
    roundsCompleted: rounds,
    phaseStartedAt: at,
    phaseDurationMs: b.ms,
    isLongBreak: b.long,
  }
}

function enterFocus(s: FocusState, at: number, skipped: boolean): FocusState {
  const c = s.config!
  return {
    ...s,
    phase: 'focusing',
    breaksTaken: s.breaksTaken + (skipped ? 0 : 1),
    breaksSkipped: s.breaksSkipped + (skipped ? 1 : 0),
    phaseStartedAt: at,
    phaseDurationMs: c.focusMin == null ? null : c.focusMin * MIN,
    isLongBreak: false,
  }
}

/**
 * Move forward through every phase boundary that has passed by `now`. Each
 * new phase starts exactly where the previous one ended (not at `now`), so a
 * 2-hour sleep replays the cycle precisely. Returns every transition; callers
 * fire ONE catch-up alert for the last, not one per missed boundary.
 */
export function advance(
  s: FocusState,
  now: number,
): { state: FocusState; transitions: Transition[] } {
  const transitions: Transition[] = []
  let cur = s
  // Safety bound: 12 h of 1-minute phases.
  for (let i = 0; i < 1000; i++) {
    if (!isRunning(cur) || cur.paused) break
    if (cur.phaseDurationMs == null || cur.phaseStartedAt == null) break
    const endAt = cur.phaseStartedAt + cur.phaseDurationMs
    if (now < endAt) break
    if (cur.phase === 'focusing') {
      cur = enterBreak(cur, endAt)
      transitions.push({ kind: 'focus_end', at: endAt, to: 'break', isLongBreak: cur.isLongBreak })
    } else {
      cur = enterFocus(cur, endAt, false)
      transitions.push({ kind: 'break_end', at: endAt, to: 'focusing', isLongBreak: false })
    }
  }
  return { state: cur, transitions }
}

/** Flowtime "take a break" (or end a timed focus early). */
export function takeBreak(s: FocusState, now: number): FocusState {
  if (s.phase !== 'focusing') return s
  const base = s.paused ? resume(s, now) : s
  const elapsed = elapsedInPhase(base, now)
  return enterBreak({ ...base, phaseDurationMs: elapsed }, now)
}

/** Leave a break early ("Back to focus"). */
export function skipBreak(s: FocusState, now: number): FocusState {
  if (s.phase !== 'break') return s
  return enterFocus({ ...s, paused: false, pausedAt: null }, now, true)
}

/**
 * Decide whether a stopped session counts as completed: at least one finished
 * round, or (Flowtime) at least 5 minutes of focus.
 */
export function endStatusFor(s: FocusState, now: number): EndStatus {
  if (s.roundsCompleted >= 1) return 'completed'
  if (s.config?.focusMin == null && focusedMs(s, now) >= 5 * MIN) return 'completed'
  return 'abandoned'
}

export function end(s: FocusState, now: number, reason: EndReason = 'user_stopped'): FocusState {
  if (!isRunning(s)) return s
  const ref = s.paused && s.pausedAt != null ? s.pausedAt : now
  const live = s.phase === 'focusing' ? elapsedInPhase(s, ref) : 0
  // A Flowtime interval of at least a minute counts as a round when stopped.
  const flowRound = s.phase === 'focusing' && s.config?.focusMin == null && live >= MIN ? 1 : 0
  const next: FocusState = {
    ...s,
    focusAccumMs: s.focusAccumMs + live,
    roundsCompleted: s.roundsCompleted + flowRound,
    phase: 'ended',
    paused: false,
    pausedAt: null,
    endedAt: ref,
    phaseStartedAt: null,
    phaseDurationMs: null,
    isLongBreak: false,
    endReason: reason,
  }
  return { ...next, endStatus: endStatusFor(next, ref) }
}

export function setSound(s: FocusState, sound: FocusSoundId): FocusState {
  return { ...s, sound }
}

export function setSurface(s: FocusState, surface: FocusSurface): FocusState {
  return { ...s, surface }
}

// ── Persistence ──────────────────────────────────────────────────────────────

export function serialize(s: FocusState): string {
  return JSON.stringify(s)
}

/**
 * Rebuild from storage. Unknown versions or malformed data → null. The caller
 * then runs `advance()` to catch up on anything that happened while asleep.
 */
export function deserialize(raw: string | null | undefined): FocusState | null {
  if (!raw) return null
  try {
    const p = JSON.parse(raw) as Partial<FocusState>
    if (!p || p.v !== STATE_VERSION || typeof p.phase !== 'string') return null
    return { ...initialState(), ...p } as FocusState
  } catch {
    return null
  }
}

/** Server PATCH body for the current state. */
export function toProgress(s: FocusState, now: number) {
  return {
    actual_focus_sec: Math.floor(focusedMs(s, now) / 1000),
    rounds_completed: s.roundsCompleted,
    breaks_taken: s.breaksTaken,
    breaks_skipped: s.breaksSkipped,
    sound: s.sound,
    surface: s.surface,
  }
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const sec = total % 60
  const mm = h ? String(m).padStart(2, '0') : String(m)
  return `${h ? `${h}:` : ''}${mm}:${String(sec).padStart(2, '0')}`
}
