'use client'

// Offline-tolerant session sync (Focus Mode v1, spec §5.7).
//
// Every call is written to a localStorage queue FIRST and removed only after
// the server accepts it, so a closed lid, a dead Wi-Fi link or a tab closed
// mid-request never loses a session. The queue is flushed on `online`, on
// every transition and on load. For a given session the newest PATCH wins:
// queued PATCHes are merged field-by-field (newest fields on top), so a later
// rating PATCH can never erase an earlier queued "end".

import {
  startFocusSession,
  updateFocusSession,
  type StartFocusBody,
  type UpdateFocusBody,
} from '@/lib/actions/focus'

export const QUEUE_KEY = 'mirror.focus.queue.v1'

// `owner` is the student id: shared laptops must never send one learner's
// queued calls with another learner's token.
export type QueueOp =
  | { type: 'start'; id: string; owner: string; body: StartFocusBody }
  | { type: 'patch'; id: string; owner: string; body: UpdateFocusBody }

function read(): QueueOp[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    const parsed = raw ? (JSON.parse(raw) as QueueOp[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function write(ops: QueueOp[]) {
  try {
    if (ops.length) localStorage.setItem(QUEUE_KEY, JSON.stringify(ops))
    else localStorage.removeItem(QUEUE_KEY)
  } catch {
    /* storage unavailable: best effort */
  }
}

/** Pure: add an op, merging PATCHes for the same session. Exported for tests. */
export function enqueueOp(queue: QueueOp[], op: QueueOp): QueueOp[] {
  if (op.type === 'start') {
    if (queue.some((q) => q.type === 'start' && q.id === op.id)) return queue
    return [...queue, op]
  }
  const i = queue.findIndex((q) => q.type === 'patch' && q.id === op.id)
  if (i === -1) return [...queue, op]
  const prev = queue[i] as Extract<QueueOp, { type: 'patch' }>
  const merged: QueueOp = {
    type: 'patch',
    id: op.id,
    owner: op.owner,
    body: {
      ...prev.body,
      ...op.body,
      // Counters only grow; never let a stale value win.
      actual_focus_sec: Math.max(prev.body.actual_focus_sec, op.body.actual_focus_sec),
      rounds_completed: Math.max(prev.body.rounds_completed, op.body.rounds_completed),
      breaks_taken: Math.max(prev.body.breaks_taken, op.body.breaks_taken),
      breaks_skipped: Math.max(prev.body.breaks_skipped, op.body.breaks_skipped),
      // An end is sticky once queued.
      ...(prev.body.status && prev.body.status !== 'active' && (!op.body.status || op.body.status === 'active')
        ? { status: prev.body.status, ended_reason: prev.body.ended_reason, ended_at: prev.body.ended_at }
        : {}),
    },
  }
  const next = queue.slice()
  next[i] = merged
  return next
}

/** Retry later on network errors, 5xx, 429 and 401 (token refresh); drop other 4xx. */
export function isRetryable(status: number | undefined): boolean {
  if (status == null) return true
  return status >= 500 || status === 429 || status === 401 || status === 408
}

let flushing: Promise<void> | null = null

export function enqueue(op: QueueOp) {
  write(enqueueOp(read(), op))
}

const RETRY_DELAYS_MS = [5_000, 15_000, 60_000, 120_000]
let retryAttempt = 0
let retryTimer: ReturnType<typeof setTimeout> | null = null

/** After a retryable failure, try again on a backoff so an ended session never waits for a reload. */
function scheduleRetry(owner: string) {
  if (retryTimer || typeof window === 'undefined') return
  const delay = RETRY_DELAYS_MS[Math.min(retryAttempt, RETRY_DELAYS_MS.length - 1)]
  retryAttempt++
  retryTimer = setTimeout(() => {
    retryTimer = null
    void flush(owner)
  }, delay)
}

/** Send this owner's queued ops in order; stops at the first retryable failure. */
export function flush(owner: string): Promise<void> {
  if (flushing) return flushing
  // NB: the guard is cleared in .finally(), which always runs after this
  // assignment. Clearing it inside the async body would run synchronously when
  // the queue is empty — before the assignment — leaving `flushing` set to a
  // settled promise forever, so no later flush would ever send anything.
  flushing = (async () => {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        scheduleRetry(owner)
        return
      }
      for (;;) {
        const queue = read()
        const op = queue.find((q) => q.owner === owner)
        if (!op) return
        let status: number | undefined
        let ok = false
        try {
          const res =
            op.type === 'start'
              ? await startFocusSession(op.body)
              : await updateFocusSession(op.id, op.body)
          ok = !res.error
          status = res.error?.status
        } catch (e) {
          status = undefined // server action unreachable (offline)
          console.warn('[focus] sync call failed, will retry', e)
        }
        if (!ok && isRetryable(status)) {
          scheduleRetry(owner)
          return
        }
        retryAttempt = 0
        // Success, or a permanent rejection: remove exactly this op. Re-read
        // so a PATCH merged in while we were awaiting is not lost.
        const latest = read()
        const idx = latest.findIndex((q) => q.type === op.type && q.id === op.id)
        if (idx !== -1) {
          const cur = latest[idx]
          // If the op changed while in flight (a newer PATCH merged), keep it.
          if (JSON.stringify(cur) === JSON.stringify(op)) latest.splice(idx, 1)
        }
        write(latest)
        if (!ok) {
          // A rejected start makes its PATCHes meaningless.
          if (op.type === 'start') write(read().filter((q) => q.id !== op.id))
          console.warn('[focus] sync op dropped', op.type, status)
        }
      }
  })().finally(() => {
    flushing = null
  })
  return flushing
}

export function pendingCount(owner: string): number {
  return read().filter((q) => q.owner === owner).length
}
