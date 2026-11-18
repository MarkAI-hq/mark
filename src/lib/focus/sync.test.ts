jest.mock('@/lib/actions/focus', () => ({
  startFocusSession: jest.fn(),
  updateFocusSession: jest.fn(),
}))

import { enqueueOp, isRetryable, type QueueOp } from './sync'

const base = { actual_focus_sec: 0, rounds_completed: 0, breaks_taken: 0, breaks_skipped: 0 }
const patch = (body: Partial<QueueOp['body']>, id = 's1'): QueueOp => ({
  type: 'patch',
  id,
  owner: 'u1',
  body: { ...base, ...body } as never,
})

describe('enqueueOp', () => {
  it('keeps a single start per session', () => {
    const start: QueueOp = { type: 'start', id: 's1', owner: 'u1', body: {} as never }
    expect(enqueueOp(enqueueOp([], start), start)).toHaveLength(1)
  })

  it('merges PATCHes for the same session, newest fields on top, counters never shrink', () => {
    let q = enqueueOp([], patch({ actual_focus_sec: 900, rounds_completed: 1, sound: 'brown' }))
    q = enqueueOp(q, patch({ actual_focus_sec: 600, sound: 'rain' }))
    expect(q).toHaveLength(1)
    expect(q[0].body).toMatchObject({ actual_focus_sec: 900, rounds_completed: 1, sound: 'rain' })
  })

  it('a later rating PATCH never erases a queued end', () => {
    let q = enqueueOp([], patch({ actual_focus_sec: 1500, status: 'completed', ended_reason: 'completed', ended_at: 'T' }))
    q = enqueueOp(q, patch({ actual_focus_sec: 1500, self_rating: 4 }))
    expect(q[0].body).toMatchObject({ status: 'completed', ended_reason: 'completed', self_rating: 4 })
  })

  it('keeps PATCHes of different sessions apart', () => {
    const q = enqueueOp(enqueueOp([], patch({}, 'a')), patch({}, 'b'))
    expect(q).toHaveLength(2)
  })
})

describe('isRetryable', () => {
  it('retries network, 5xx, 429, 401; drops other 4xx', () => {
    expect(isRetryable(undefined)).toBe(true)
    expect(isRetryable(500)).toBe(true)
    expect(isRetryable(429)).toBe(true)
    expect(isRetryable(401)).toBe(true)
    expect(isRetryable(400)).toBe(false)
    expect(isRetryable(404)).toBe(false)
  })
})

describe('flush', () => {
  const store = new Map<string, string>()
  beforeAll(() => {
    ;(global as any).localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    }
  })
  beforeEach(() => store.clear())

  it('still sends ops after an earlier flush ran on an empty queue (guard regression)', async () => {
    const actions = jest.requireMock('@/lib/actions/focus')
    actions.startFocusSession.mockResolvedValue({ data: {}, error: null })
    const { flush, enqueue, pendingCount } = await import('./sync')
    await flush('u1') // empty queue: completes synchronously
    enqueue({ type: 'start', id: 's1', owner: 'u1', body: { id: 's1' } as never })
    await flush('u1')
    expect(actions.startFocusSession).toHaveBeenCalledTimes(1)
    expect(pendingCount('u1')).toBe(0)
  })

  it("never sends another learner's queued ops", async () => {
    const actions = jest.requireMock('@/lib/actions/focus')
    actions.startFocusSession.mockClear()
    const { flush, enqueue, pendingCount } = await import('./sync')
    enqueue({ type: 'start', id: 's2', owner: 'other', body: { id: 's2' } as never })
    await flush('u1')
    expect(actions.startFocusSession).not.toHaveBeenCalled()
    expect(pendingCount('other')).toBe(1)
  })
})
