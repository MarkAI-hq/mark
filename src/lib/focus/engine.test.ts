import {
  advance,
  deserialize,
  elapsedInPhase,
  end,
  focusedMs,
  formatClock,
  pause,
  remainingMs,
  resume,
  serialize,
  skipBreak,
  start,
  takeBreak,
  toProgress,
} from './engine'
import { flowtimeBreakMin, resolveConfig } from './systems'

const MIN = 60_000
const T0 = Date.UTC(2026, 10, 18, 8, 0, 0)
const at = (min: number) => T0 + min * MIN

const begin = (system: Parameters<typeof resolveConfig>[0], custom?: Parameters<typeof resolveConfig>[1]) =>
  start({ sessionId: 's1', config: resolveConfig(system, custom), sound: 'brown' }, T0)

describe('Pomodoro', () => {
  it('runs 25 focus → 5 break and counts a round', () => {
    const s0 = begin('pomodoro')
    expect(remainingMs(s0, at(10))).toBe(15 * MIN)
    const { state, transitions } = advance(s0, at(26))
    expect(transitions).toHaveLength(1)
    expect(transitions[0]).toMatchObject({ kind: 'focus_end', at: at(25), to: 'break' })
    expect(state.phase).toBe('break')
    expect(state.roundsCompleted).toBe(1)
    expect(remainingMs(state, at(26))).toBe(4 * MIN)
    expect(focusedMs(state, at(26))).toBe(25 * MIN)
  })

  it('gives a 15-minute long break after every 4 rounds', () => {
    let s = begin('pomodoro')
    // 3 × (25 + 5) + 25 = 115 → long break starts at 115.
    s = advance(s, at(115)).state
    expect(s.phase).toBe('break')
    expect(s.roundsCompleted).toBe(4)
    expect(s.isLongBreak).toBe(true)
    expect(s.phaseDurationMs).toBe(15 * MIN)
    // Back to focus at 130; round 5's break is a normal 5 minutes.
    s = advance(s, at(155)).state
    expect(s.roundsCompleted).toBe(5)
    expect(s.isLongBreak).toBe(false)
    expect(s.phaseDurationMs).toBe(5 * MIN)
  })

  it('a 2-hour sleep lands mid-break with the right remaining time', () => {
    const s0 = begin('pomodoro')
    const restored = deserialize(serialize(s0))!
    const { state, transitions } = advance(restored, at(120))
    expect(state.phase).toBe('break')
    expect(state.isLongBreak).toBe(true)
    expect(state.roundsCompleted).toBe(4)
    expect(state.breaksTaken).toBe(3)
    expect(remainingMs(state, at(120))).toBe(10 * MIN)
    expect(focusedMs(state, at(120))).toBe(100 * MIN)
    // Seven boundaries passed; the UI fires a single catch-up alert for the last.
    expect(transitions).toHaveLength(7)
    expect(transitions.at(-1)).toMatchObject({ kind: 'focus_end', isLongBreak: true })
  })
})

describe('Sprint', () => {
  it('runs 12 focus → 3 break with no long break', () => {
    let s = begin('sprint')
    s = advance(s, at(12)).state
    expect(s.phase).toBe('break')
    expect(s.phaseDurationMs).toBe(3 * MIN)
    // 4 full cycles of 15 min → back in focus at 60, still no long break.
    s = advance(s, at(60 + 12)).state
    expect(s.roundsCompleted).toBe(5)
    expect(s.isLongBreak).toBe(false)
    expect(s.phaseDurationMs).toBe(3 * MIN)
  })
})

describe('Flowtime', () => {
  it('counts up until the learner stops and suggests focus ÷ 5', () => {
    let s = begin('flowtime')
    expect(remainingMs(s, at(40))).toBeNull()
    expect(advance(s, at(500)).transitions).toHaveLength(0)
    s = takeBreak(s, at(40))
    expect(s.phase).toBe('break')
    expect(s.roundsCompleted).toBe(1)
    expect(s.phaseDurationMs).toBe(8 * MIN)
    expect(focusedMs(s, at(41))).toBe(40 * MIN)
    // Break ends on its own, focus counts up again.
    s = advance(s, at(48)).state
    expect(s.phase).toBe('focusing')
    expect(s.phaseDurationMs).toBeNull()
  })

  it('clamps the suggested break to 3..20 minutes', () => {
    expect(flowtimeBreakMin(5 * MIN)).toBe(3)
    expect(flowtimeBreakMin(200 * MIN)).toBe(20)
  })

  it('counts a stopped flowtime interval as completed after 5 minutes', () => {
    const s = end(begin('flowtime'), at(6))
    expect(s.endStatus).toBe('completed')
    expect(s.roundsCompleted).toBe(1)
    expect(toProgress(s, at(9)).actual_focus_sec).toBe(360)
  })
})

describe('Custom', () => {
  it('clamps to the allowed ranges and supports an optional long break', () => {
    const c = resolveConfig('custom', { focusMin: 200, breakMin: 0, longBreak: true, longBreakMin: 20 })
    expect(c).toMatchObject({ focusMin: 90, breakMin: 1, longBreakMin: 20, longBreakEvery: 4 })
    let s = begin('custom', { focusMin: 10, breakMin: 2, longBreak: true, longBreakMin: 20 })
    s = advance(s, at(3 * 12 + 10)).state
    expect(s.roundsCompleted).toBe(4)
    expect(s.isLongBreak).toBe(true)
    expect(s.phaseDurationMs).toBe(20 * MIN)
  })

  it('has no long break when it is turned off', () => {
    let s = begin('custom', { focusMin: 10, breakMin: 2, longBreak: false, longBreakMin: 20 })
    s = advance(s, at(3 * 12 + 10)).state
    expect(s.isLongBreak).toBe(false)
  })
})

describe('pause / resume', () => {
  it('freezes the clock and preserves remaining time', () => {
    let s = begin('pomodoro')
    s = pause(s, at(10))
    expect(remainingMs(s, at(50))).toBe(15 * MIN)
    // No transitions while paused, however long.
    expect(advance(s, at(500)).transitions).toHaveLength(0)
    s = resume(s, at(50))
    expect(remainingMs(s, at(50))).toBe(15 * MIN)
    const next = advance(s, at(65))
    expect(next.transitions[0].at).toBe(at(65))
    expect(focusedMs(next.state, at(65))).toBe(25 * MIN)
  })

  it('ending while paused does not count the paused span', () => {
    let s = begin('pomodoro')
    s = pause(s, at(10))
    s = end(s, at(40))
    expect(focusedMs(s, at(40))).toBe(10 * MIN)
    expect(s.endStatus).toBe('abandoned')
  })
})

describe('breaks and ending', () => {
  it('skipping a break counts as skipped, not taken', () => {
    let s = advance(begin('sprint'), at(12)).state
    s = skipBreak(s, at(13))
    expect(s.phase).toBe('focusing')
    expect(s.breaksSkipped).toBe(1)
    expect(s.breaksTaken).toBe(0)
    expect(remainingMs(s, at(13))).toBe(12 * MIN)
  })

  it('end during a break excludes break time from focus', () => {
    let s = advance(begin('sprint'), at(14)).state
    s = end(s, at(14))
    expect(s.endStatus).toBe('completed')
    expect(focusedMs(s, at(14))).toBe(12 * MIN)
  })

  it('deserialize rejects junk and other versions', () => {
    expect(deserialize('nope')).toBeNull()
    expect(deserialize(JSON.stringify({ v: 2, phase: 'idle' }))).toBeNull()
    expect(deserialize(null)).toBeNull()
  })

  it('elapsed is never negative even if the clock moved backwards', () => {
    expect(elapsedInPhase(begin('pomodoro'), T0 - 5000)).toBe(0)
  })

  it('formats clocks', () => {
    expect(formatClock(25 * MIN)).toBe('25:00')
    expect(formatClock(65 * MIN + 5000)).toBe('1:05:05')
  })
})
