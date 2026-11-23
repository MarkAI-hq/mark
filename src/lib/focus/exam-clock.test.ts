import { clockOffset, crossedWarnings, examRemainingMs } from './exam-clock'

describe('exam clock', () => {
  it('corrects for a client clock that runs 2 minutes fast', () => {
    const server = Date.UTC(2026, 10, 18, 9, 0, 0)
    const client = server + 120_000
    const offset = clockOffset(new Date(server).toISOString(), client)
    expect(offset).toBe(-120_000)
    const deadline = new Date(server + 30 * 60_000).toISOString()
    expect(examRemainingMs(deadline, client, offset)).toBe(30 * 60_000)
  })

  it('never goes negative', () => {
    expect(examRemainingMs(new Date(0).toISOString(), Date.now(), 0)).toBe(0)
  })

  it('fires only warnings crossed while watching', () => {
    expect(crossedWarnings(10 * 60_000 + 500, 10 * 60_000)).toEqual([10])
    expect(crossedWarnings(7 * 60_000, 6 * 60_000)).toEqual([])
    // A long throttled gap crosses several marks at once.
    expect(crossedWarnings(11 * 60_000, 30_000)).toEqual([10, 5, 1])
  })
})
