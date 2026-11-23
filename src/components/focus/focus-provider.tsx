'use client'

// FocusProvider (Focus Mode v1, spec §5). Mounted once in the student portal
// layout so the timer and audio survive client-side navigation.
//
// Responsibilities:
//  • holds the engine state, persisted to localStorage on every transition
//  • one driving tab: BroadcastChannel('mirror-focus') mirrors state to other
//    tabs; a localStorage lease decides which tab plays audio, fires alerts
//    and syncs timed transitions
//  • alerts (chime, PiP flash, notification, ring mode)
//  • offline-tolerant sync to mark-api
//  • play mode (Document Picture-in-Picture) window lifecycle
//  • exam lock: a timed assessment pauses the session and hides the dock

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import * as engine from '@/lib/focus/engine'
import type { FocusState, Transition } from '@/lib/focus/engine'
import {
  DEFAULT_CUSTOM,
  resolveConfig,
  SYSTEMS,
  type CustomSettings,
  type FocusSoundId,
  type FocusSystemId,
} from '@/lib/focus/systems'
import * as audio from '@/lib/focus/audio'
import type { PulseDepth } from '@/lib/focus/audio'
import {
  fireAlert,
  notificationPermission,
  requestNotificationPermission,
  startRing,
} from '@/lib/focus/alerts'
import { enqueue, flush } from '@/lib/focus/sync'
import { startTicker } from '@/lib/focus/ticker'
import { getActiveFocusSession, type FocusSessionRow, type UpdateFocusBody } from '@/lib/actions/focus'

const PREFS_KEY = 'mirror.focus.prefs.v1'
const LEASE_KEY = 'mirror.focus.leader.v1'
const NOTIF_ASKED_KEY = 'mirror.focus.notif-asked.v1'
const CHANNEL = 'mirror-focus'
const LEASE_TTL_MS = 6_000
const HEARTBEAT_MS = 2_000
const PROGRESS_SYNC_MS = 60_000
const FLASH_MS = 3_000

export interface FocusPrefs {
  system: FocusSystemId
  sound: FocusSoundId
  volume: number
  custom: CustomSettings
  ringMode: boolean
  pulseDepth: PulseDepth
}

const DEFAULT_PREFS: FocusPrefs = {
  system: 'pomodoro',
  sound: 'brown',
  volume: 50,
  custom: DEFAULT_CUSTOM,
  ringMode: false,
  pulseDepth: 'low',
}

interface Stored {
  owner: string
  state: FocusState
}

// ── storage helpers (all wrapped: storage can throw in private mode) ────────
function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}
function writeJSON(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v))
  } catch {
    /* ignore */
  }
}

function loadState(owner: string): FocusState | null {
  const stored = readJSON<Stored>(engine.STORAGE_KEY)
  if (!stored || stored.owner !== owner) return null
  return engine.deserialize(JSON.stringify(stored.state))
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  // RFC4122 v4 fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

type ChannelMsg =
  | { t: 'state'; owner: string; from: string; state: FocusState }
  | { t: 'release'; from: string }

export interface FocusContextValue {
  /** Raw persisted state. */
  state: FocusState
  /** State advanced to `now` (what to render). */
  view: FocusState
  now: number
  remainingMs: number | null
  focusedMs: number
  prefs: FocusPrefs
  setPrefs: (p: Partial<FocusPrefs>) => void
  isLeader: boolean
  hydrated: boolean

  start: (goal: { subject?: string; topic?: string }) => void
  pause: () => void
  resume: () => void
  stop: () => void
  takeBreak: () => void
  skipBreak: () => void
  setSound: (s: FocusSoundId) => void
  setVolume: (v: number) => void
  finish: (rating?: number, note?: string) => void

  ringing: 'break' | 'focus' | null
  acknowledgeRing: (action: 'on_break' | 'back_to_focus') => void
  flashing: boolean
  breakText: string | null

  notifPrompt: boolean
  allowNotifications: () => Promise<void>
  dismissNotifPrompt: () => void

  audioBlocked: boolean
  unlockAudio: () => void

  pipSupported: boolean
  pipWindow: Window | null
  openPip: () => Promise<void>
  closePip: () => void

  examLocked: boolean
  lockForExam: () => () => void

  resumeOffer: FocusSessionRow | null
  acceptResume: () => void
  declineResume: () => void
}

const FocusContext = createContext<FocusContextValue | null>(null)

export function useFocus(): FocusContextValue {
  const ctx = useContext(FocusContext)
  if (!ctx) throw new Error('useFocus must be used inside <FocusProvider>')
  return ctx
}

/** Safe variant for components that may render outside the student portal. */
export function useOptionalFocus(): FocusContextValue | null {
  return useContext(FocusContext)
}

function breakMessage(t: Transition | null, s: FocusState): string | null {
  if (!t || t.kind !== 'focus_end') return null
  const min = s.phaseDurationMs ? Math.round(s.phaseDurationMs / 60_000) : 0
  return t.isLongBreak ? `Long break: ${min} minutes. Stand up and stretch.` : `Break: ${min} minutes. Look away from the screen.`
}

export function FocusProvider({ studentId, children }: { studentId: string; children: ReactNode }) {
  const owner = studentId
  const tabId = useRef<string>('')
  if (!tabId.current) tabId.current = uuid()

  const [state, setState] = useState<FocusState>(engine.initialState)
  const stateRef = useRef(state)
  const [now, setNow] = useState<number>(() => Date.now())
  const [hydrated, setHydrated] = useState(false)
  const [prefs, setPrefsState] = useState<FocusPrefs>(DEFAULT_PREFS)
  const [isLeader, setIsLeader] = useState(false)
  const isLeaderRef = useRef(false)
  const [ringing, setRinging] = useState<'break' | 'focus' | null>(null)
  const ringCancel = useRef<(() => void) | null>(null)
  const [flashUntil, setFlashUntil] = useState(0)
  const [breakText, setBreakText] = useState<string | null>(null)
  const [notifPrompt, setNotifPrompt] = useState(false)
  const [audioBlocked, setAudioBlocked] = useState(false)
  const [pipWindow, setPipWindow] = useState<Window | null>(null)
  const [pipSupported, setPipSupported] = useState(false)
  const [examLocks, setExamLocks] = useState(0)
  const pausedByExam = useRef(false)
  const [resumeOffer, setResumeOffer] = useState<FocusSessionRow | null>(null)
  const channel = useRef<BroadcastChannel | null>(null)
  const lastProgressSync = useRef(0)
  const prefsRef = useRef(prefs)
  prefsRef.current = prefs

  // ── commit: the single write path ─────────────────────────────────────────
  const commit = useCallback(
    (next: FocusState, opts: { broadcast?: boolean } = {}) => {
      stateRef.current = next
      setState(next)
      writeJSON(engine.STORAGE_KEY, { owner, state: next } satisfies Stored)
      if (opts.broadcast !== false) {
        try {
          channel.current?.postMessage({ t: 'state', owner, from: tabId.current, state: next } satisfies ChannelMsg)
        } catch {
          /* closed channel */
        }
      }
    },
    [owner],
  )

  // ── leadership lease ─────────────────────────────────────────────────────
  const claimLeadership = useCallback((force = false) => {
    const lease = readJSON<{ tab: string; ts: number }>(LEASE_KEY)
    const t = Date.now()
    if (force || !lease || lease.tab === tabId.current || t - lease.ts > LEASE_TTL_MS) {
      writeJSON(LEASE_KEY, { tab: tabId.current, ts: t })
      if (!isLeaderRef.current) {
        isLeaderRef.current = true
        setIsLeader(true)
      }
      return true
    }
    if (isLeaderRef.current) {
      isLeaderRef.current = false
      setIsLeader(false)
    }
    return false
  }, [])

  // ── sync helpers ─────────────────────────────────────────────────────────
  const syncProgress = useCallback(
    (s: FocusState, extra: Partial<UpdateFocusBody> = {}) => {
      if (!s.sessionId) return
      enqueue({
        type: 'patch',
        id: s.sessionId,
        owner,
        body: { ...engine.toProgress(s, Date.now()), ...extra },
      })
      void flush(owner)
    },
    [owner],
  )

  // ── transitions → side effects (leader only) ─────────────────────────────
  const onTransitions = useCallback(
    (transitions: Transition[], next: FocusState) => {
      if (!transitions.length || !isLeaderRef.current) return
      // One alert for the latest transition — never one per missed boundary.
      const last = transitions[transitions.length - 1]
      const toBreak = last.kind === 'focus_end'
      setBreakText(toBreak ? breakMessage(last, next) : null)
      setFlashUntil(Date.now() + FLASH_MS)
      fireAlert(
        toBreak
          ? { kind: 'break', title: last.isLongBreak ? 'Long break time' : 'Break time', body: breakMessage(last, next) ?? '' }
          : { kind: 'focus', title: 'Back to focus', body: `${SYSTEMS[next.config!.system].label}: next focus block has started.` },
      )
      ringCancel.current?.()
      ringCancel.current = null
      if (prefsRef.current.ringMode) {
        setRinging(toBreak ? 'break' : 'focus')
        ringCancel.current = startRing(toBreak ? 'break' : 'focus', () => setRinging(null))
      }
      // Ask for notification permission after the first completed focus interval.
      if (toBreak && next.roundsCompleted >= 1 && notificationPermission() === 'default' && !readJSON(NOTIF_ASKED_KEY)) {
        setNotifPrompt(true)
      }
      syncProgress(next)
    },
    [syncProgress],
  )

  // ── hydrate once ─────────────────────────────────────────────────────────
  useEffect(() => {
    const p = readJSON<Partial<FocusPrefs>>(PREFS_KEY)
    if (p) setPrefsState({ ...DEFAULT_PREFS, ...p, custom: { ...DEFAULT_CUSTOM, ...(p.custom ?? {}) } })
    setPipSupported(typeof window !== 'undefined' && 'documentPictureInPicture' in window)

    const leader = claimLeadership()
    const stored = loadState(owner)
    if (stored) {
      const { state: caught, transitions } = engine.advance(stored, Date.now())
      commit(caught, { broadcast: false })
      if (engine.isRunning(caught)) {
        if (leader) {
          onTransitions(transitions, caught)
          setAudioBlocked(caught.sound !== 'silence')
        }
      }
    }
    setHydrated(true)
    void flush(owner)

    // No local session → offer to resume one started on another device.
    if (!stored || !engine.isRunning(stored)) {
      getActiveFocusSession()
        .then((res) => {
          const row = res.data
          if (row && row.status === 'active' && !engine.isRunning(stateRef.current)) setResumeOffer(row)
        })
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner])

  // ── cross-tab channel ────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return
    const ch = new BroadcastChannel(CHANNEL)
    channel.current = ch
    ch.onmessage = (e: MessageEvent<ChannelMsg>) => {
      const msg = e.data
      if (!msg || msg.from === tabId.current) return
      if (msg.t === 'state' && msg.owner === owner) {
        stateRef.current = msg.state
        setState(msg.state)
        setResumeOffer(null)
      } else if (msg.t === 'release') {
        claimLeadership()
      }
    }
    // Storage events also mirror state (covers browsers without BroadcastChannel delivery quirks).
    const onStorage = (e: StorageEvent) => {
      if (e.key !== engine.STORAGE_KEY || !e.newValue) return
      const s = loadState(owner)
      if (s && JSON.stringify(s) !== JSON.stringify(stateRef.current)) {
        stateRef.current = s
        setState(s)
      }
    }
    window.addEventListener('storage', onStorage)
    const release = () => {
      if (isLeaderRef.current) {
        try {
          localStorage.removeItem(LEASE_KEY)
        } catch {}
        try {
          ch.postMessage({ t: 'release', from: tabId.current } satisfies ChannelMsg)
        } catch {}
      }
    }
    window.addEventListener('pagehide', release)
    return () => {
      release()
      window.removeEventListener('pagehide', release)
      window.removeEventListener('storage', onStorage)
      ch.close()
      channel.current = null
    }
  }, [owner, claimLeadership])

  // ── ticker: re-render, keep lease, advance, periodic progress sync ───────
  useEffect(() => {
    let lastLease = 0
    return startTicker(() => {
      const t = Date.now()
      setNow(t)
      if (t - lastLease >= HEARTBEAT_MS) {
        lastLease = t
        claimLeadership()
      }
      if (!isLeaderRef.current) return
      const cur = stateRef.current
      if (!engine.isRunning(cur)) return
      const { state: next, transitions } = engine.advance(cur, t)
      if (transitions.length) {
        commit(next)
        onTransitions(transitions, next)
      }
      if (next.phase === 'focusing' && !next.paused && t - lastProgressSync.current >= PROGRESS_SYNC_MS) {
        lastProgressSync.current = t
        syncProgress(next)
      }
    })
  }, [claimLeadership, commit, onTransitions, syncProgress])

  // ── retry the queue when we come back online ─────────────────────────────
  useEffect(() => {
    const on = () => void flush(owner)
    window.addEventListener('online', on)
    return () => window.removeEventListener('online', on)
  }, [owner])

  // ── audio follows state (leader only) ────────────────────────────────────
  const view = useMemo(() => engine.advance(state, now).state, [state, now])
  const examLocked = examLocks > 0
  const examLockedRef = useRef(false)
  examLockedRef.current = examLocked
  const running = engine.isRunning(view)
  useEffect(() => {
    if (!isLeader || !running || examLocked) {
      audio.fadeOut(running ? 2 : 0.3)
      const id = window.setTimeout(() => {
        if (!engine.isRunning(stateRef.current) || examLockedRef.current || !isLeaderRef.current) audio.stopSound()
      }, 2100)
      return () => window.clearTimeout(id)
    }
    if (!audio.getAudioContext()) {
      setAudioBlocked(view.sound !== 'silence')
      return
    }
    if (audio.playingSound() !== view.sound) {
      audio.setFaderImmediate(false)
      audio.playSound(view.sound)
    }
    if (view.phase === 'focusing' && !view.paused) audio.fadeIn()
    else audio.fadeOut()
  }, [isLeader, running, examLocked, view.phase, view.paused, view.sound])

  useEffect(() => {
    audio.setVolume(prefs.volume)
    audio.setPulseDepth(prefs.pulseDepth)
  }, [prefs.volume, prefs.pulseDepth])

  // ── actions ──────────────────────────────────────────────────────────────
  const setPrefs = useCallback((p: Partial<FocusPrefs>) => {
    setPrefsState((cur) => {
      const next = { ...cur, ...p }
      writeJSON(PREFS_KEY, next)
      return next
    })
  }, [])

  const stopRing = () => {
    ringCancel.current?.()
    ringCancel.current = null
    setRinging(null)
  }

  const start = useCallback(
    (goal: { subject?: string; topic?: string }) => {
      const p = prefsRef.current
      // The Start click is the user gesture that unlocks audio.
      audio.ensureAudio()
      audio.setVolume(p.volume)
      audio.setPulseDepth(p.pulseDepth)
      setAudioBlocked(false)
      claimLeadership(true)
      const config = resolveConfig(p.system, p.custom)
      const s = engine.start(
        {
          sessionId: uuid(),
          config,
          sound: p.sound,
          surface: pipWindow ? 'pip' : 'dock',
          goalSubject: goal.subject,
          goalTopic: goal.topic,
        },
        Date.now(),
      )
      commit(s)
      setResumeOffer(null)
      lastProgressSync.current = Date.now()
      enqueue({
        type: 'start',
        id: s.sessionId!,
        owner,
        body: {
          id: s.sessionId!,
          system: config.system,
          ...(config.focusMin != null ? { planned_focus_min: config.focusMin } : {}),
          ...(config.breakMin != null ? { planned_break_min: config.breakMin } : {}),
          sound: s.sound,
          surface: s.surface,
          ...(s.goalSubject ? { goal_subject: s.goalSubject } : {}),
          ...(s.goalTopic ? { goal_topic: s.goalTopic } : {}),
          started_at: new Date(s.startedAt!).toISOString(),
        },
      })
      void flush(owner)
    },
    [claimLeadership, commit, owner, pipWindow],
  )

  const act = useCallback(
    (fn: (s: FocusState, t: number) => FocusState, sync = true) => {
      const t = Date.now()
      const cur = engine.advance(stateRef.current, t).state
      const next = fn(cur, t)
      if (next === cur) return
      commit(next)
      if (sync) syncProgress(next)
    },
    [commit, syncProgress],
  )

  const pause = useCallback(() => act(engine.pause), [act])
  const resume = useCallback(() => {
    audio.ensureAudio()
    setAudioBlocked(false)
    pausedByExam.current = false
    act(engine.resume)
  }, [act])
  const takeBreak = useCallback(() => {
    stopRing()
    act((s, t) => {
      const next = engine.takeBreak(s, t)
      if (next !== s) {
        setBreakText(breakMessage({ kind: 'focus_end', at: t, to: 'break', isLongBreak: next.isLongBreak }, next))
        setFlashUntil(Date.now() + FLASH_MS)
      }
      return next
    })
  }, [act])
  const skipBreak = useCallback(() => {
    stopRing()
    setBreakText(null)
    act(engine.skipBreak)
  }, [act])

  const stop = useCallback(() => {
    stopRing()
    const t = Date.now()
    const cur = engine.advance(stateRef.current, t).state
    if (!engine.isRunning(cur)) return
    const ended = engine.end(cur, t, 'user_stopped')
    commit(ended)
    setBreakText(null)
    if (ended.sessionId) {
      enqueue({
        type: 'patch',
        id: ended.sessionId,
        owner,
        body: {
          ...engine.toProgress(ended, t),
          status: ended.endStatus!,
          ended_reason: ended.endStatus === 'completed' ? 'completed' : 'user_stopped',
          ended_at: new Date(ended.endedAt ?? t).toISOString(),
        },
      })
      void flush(owner)
    }
  }, [commit, owner])

  const finish = useCallback(
    (rating?: number, note?: string) => {
      const cur = stateRef.current
      if (cur.phase !== 'ended') return
      if (cur.sessionId && (rating || note?.trim())) {
        enqueue({
          type: 'patch',
          id: cur.sessionId,
          owner,
          body: {
            ...engine.toProgress(cur, Date.now()),
            ...(rating ? { self_rating: rating } : {}),
            ...(note?.trim() ? { note: note.trim().slice(0, 500) } : {}),
          },
        })
        void flush(owner)
      }
      commit(engine.initialState())
    },
    [commit, owner],
  )

  const setSound = useCallback(
    (sound: FocusSoundId) => {
      setPrefs({ sound })
      if (sound !== 'silence') audio.ensureAudio()
      if (engine.isRunning(stateRef.current)) act((s) => engine.setSound(s, sound))
    },
    [act, setPrefs],
  )

  const setVolume = useCallback((v: number) => setPrefs({ volume: v }), [setPrefs])

  const acknowledgeRing = useCallback(
    (action: 'on_break' | 'back_to_focus') => {
      stopRing()
      if (action === 'back_to_focus' && stateRef.current.phase === 'break') skipBreak()
    },
    [skipBreak],
  )

  const allowNotifications = useCallback(async () => {
    writeJSON(NOTIF_ASKED_KEY, true)
    setNotifPrompt(false)
    await requestNotificationPermission()
  }, [])
  const dismissNotifPrompt = useCallback(() => {
    writeJSON(NOTIF_ASKED_KEY, true)
    setNotifPrompt(false)
  }, [])

  const unlockAudio = useCallback(() => {
    audio.ensureAudio()
    audio.setVolume(prefsRef.current.volume)
    claimLeadership(true)
    setAudioBlocked(false)
    const s = engine.advance(stateRef.current, Date.now()).state
    if (engine.isRunning(s)) {
      audio.setFaderImmediate(false)
      audio.playSound(s.sound)
      if (s.phase === 'focusing' && !s.paused) audio.fadeIn()
    }
  }, [claimLeadership])

  // ── play mode (Document PiP) ─────────────────────────────────────────────
  const closePip = useCallback(() => {
    pipWindow?.close()
  }, [pipWindow])

  const openPip = useCallback(async () => {
    const dpip = (window as unknown as { documentPictureInPicture?: { requestWindow: (o: { width: number; height: number }) => Promise<Window> } }).documentPictureInPicture
    if (!dpip) return
    if (pipWindow) return
    try {
      const w = await dpip.requestWindow({ width: 320, height: 200 })
      // Copy the page's styles so Tailwind classes work inside the window.
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          const css = Array.from(sheet.cssRules).map((r) => r.cssText).join('\n')
          const style = w.document.createElement('style')
          style.textContent = css
          w.document.head.appendChild(style)
        } catch {
          if (sheet.href) {
            const link = w.document.createElement('link')
            link.rel = 'stylesheet'
            link.href = sheet.href
            w.document.head.appendChild(link)
          }
        }
      }
      w.document.documentElement.className = document.documentElement.className
      w.document.title = 'Mirror focus'
      w.addEventListener('pagehide', () => {
        setPipWindow(null)
        if (engine.isRunning(stateRef.current)) act((s) => engine.setSurface(s, 'dock'), false)
      })
      setPipWindow(w)
      if (engine.isRunning(stateRef.current)) act((s) => engine.setSurface(s, 'pip'))
    } catch (e) {
      console.warn('[focus] could not open play mode', e)
    }
  }, [pipWindow, act])

  // ── exam lock ────────────────────────────────────────────────────────────
  const lockForExam = useCallback(() => {
    setExamLocks((n) => n + 1)
    const s = engine.advance(stateRef.current, Date.now()).state
    if (engine.isRunning(s) && !s.paused) {
      pausedByExam.current = true
      act(engine.pause)
    }
    pipWindow?.close()
    stopRing()
    let released = false
    return () => {
      if (released) return
      released = true
      setExamLocks((n) => Math.max(0, n - 1))
      // Never auto-resume: the paused dock offers Resume.
    }
  }, [act, pipWindow])

  // ── resume from another device ───────────────────────────────────────────
  const acceptResume = useCallback(() => {
    const row = resumeOffer
    if (!row) return
    audio.ensureAudio()
    claimLeadership(true)
    const custom: CustomSettings = {
      ...prefsRef.current.custom,
      ...(row.planned_focus_min ? { focusMin: row.planned_focus_min } : {}),
      ...(row.planned_break_min ? { breakMin: row.planned_break_min } : {}),
    }
    const t = Date.now()
    const base = engine.start(
      {
        sessionId: row.id,
        config: resolveConfig(row.system, custom),
        sound: row.sound,
        surface: 'dock',
        goalSubject: row.goal_subject,
        goalTopic: row.goal_topic,
      },
      t,
    )
    commit({
      ...base,
      startedAt: new Date(row.started_at).getTime(),
      focusAccumMs: row.actual_focus_sec * 1000,
      roundsCompleted: row.rounds_completed,
      breaksTaken: row.breaks_taken,
      breaksSkipped: row.breaks_skipped,
    })
    setResumeOffer(null)
  }, [resumeOffer, claimLeadership, commit])

  const declineResume = useCallback(() => {
    const row = resumeOffer
    setResumeOffer(null)
    if (!row) return
    enqueue({
      type: 'patch',
      id: row.id,
      owner,
      body: {
        actual_focus_sec: row.actual_focus_sec,
        rounds_completed: row.rounds_completed,
        breaks_taken: row.breaks_taken,
        breaks_skipped: row.breaks_skipped,
        status: row.rounds_completed > 0 ? 'completed' : 'abandoned',
        ended_reason: 'user_stopped',
        ended_at: new Date().toISOString(),
      },
    })
    void flush(owner)
  }, [resumeOffer, owner])

  const value: FocusContextValue = {
    state,
    view,
    now,
    remainingMs: engine.remainingMs(view, now),
    focusedMs: engine.focusedMs(view, now),
    prefs,
    setPrefs,
    isLeader,
    hydrated,
    start,
    pause,
    resume,
    stop,
    takeBreak,
    skipBreak,
    setSound,
    setVolume,
    finish,
    ringing,
    acknowledgeRing,
    flashing: now < flashUntil,
    breakText: view.phase === 'break' ? breakText ?? breakMessage({ kind: 'focus_end', at: 0, to: 'break', isLongBreak: view.isLongBreak }, view) : null,
    notifPrompt,
    allowNotifications,
    dismissNotifPrompt,
    audioBlocked: audioBlocked && isLeader && running && !examLocked && view.sound !== 'silence',
    unlockAudio,
    pipSupported,
    pipWindow,
    openPip,
    closePip,
    examLocked,
    lockForExam,
    resumeOffer,
    acceptResume,
    declineResume,
  }

  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>
}
