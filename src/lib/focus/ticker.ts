'use client'

// A 1-second ticker that keeps firing in a hidden tab. Chrome throttles
// main-thread timers in background tabs to once a minute after a while, which
// would make a break alarm up to a minute late when no focus sound is playing.
// Dedicated workers are not subject to that intensive throttling, so the tick
// comes from a tiny inline worker, with a plain setInterval as fallback.
// The tick only triggers a re-render/advance — time itself still comes from
// timestamps, so a late tick never makes the clock wrong.

export function startTicker(onTick: () => void, intervalMs = 1000): () => void {
  if (typeof window !== 'undefined' && typeof Worker !== 'undefined' && typeof Blob !== 'undefined') {
    try {
      const src = `setInterval(function(){postMessage(0)},${intervalMs});`
      const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }))
      const worker = new Worker(url)
      worker.onmessage = () => onTick()
      return () => {
        worker.terminate()
        URL.revokeObjectURL(url)
      }
    } catch {
      /* fall through */
    }
  }
  const id = setInterval(onTick, intervalMs)
  return () => clearInterval(id)
}
