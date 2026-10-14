// src/hooks/use-tracy-chat-stream.ts
'use client'

// The actual fetch -> reader -> buffer -> "data: " line parsing loop for
// talking to /api/tracy was byte-for-byte duplicated between tracy-page.tsx
// (teacher) and student-tracy.tsx (student) -- genuine protocol-level
// duplication, unlike the two pages' UI, which are legitimately different
// products (artifact-panel admin assistant vs. a NotebookLM-style sources/
// chat/studio tool) and aren't being merged here. This hook owns the wire
// mechanics only; what each page does with a parsed event -- storing an
// artifact, extracting a widget, stripping markers for display, detecting a
// "generate flashcards" chip -- stays entirely in each page's own code via
// the `onEvent` callback.

import { useCallback, useRef } from 'react'
import type { TracySseEvent } from '@/components/tracy/tracy-protocol'

export function useTracyChatStream() {
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const abortRef   = useRef<AbortController | null>(null)

  // Aborts the in-flight request (if any) and cancels the stream reader --
  // used by both pages' "stop generation" button and before starting a new
  // request on top of one that's still running.
  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    readerRef.current?.cancel()
    readerRef.current = null
  }, [])

  // Posts `body` to /api/tracy and calls `onEvent` for each parsed SSE frame
  // as it arrives. Throws on a genuine fetch/stream failure (including
  // AbortError when `stop()` was called mid-stream) -- callers keep their
  // own try/catch so they can show their own error copy and reset their own
  // loading state, which differs between the two pages.
  const stream = useCallback(async (
    body: Record<string, unknown>,
    onEvent: (event: TracySseEvent) => void,
  ): Promise<void> => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const res = await fetch('/api/tracy', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      signal:  controller.signal,
      body:    JSON.stringify(body),
    })
    // A non-2xx response can still carry a body (an error page/JSON, not SSE
    // frames) -- reading it as a stream would just hang the UI in "loading"
    // forever, since no line will ever match the "data: " prefix. Fail fast
    // instead so the caller's catch block can show a real error.
    if (!res.ok) throw new Error(`Tracy request failed: ${res.status}`);
    if (!res.body) throw new Error('No response body')

    const reader  = res.body.getReader()
    readerRef.current = reader
    const decoder  = new TextDecoder()
    let   buffer   = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try { onEvent(JSON.parse(line.slice(6).trim()) as TracySseEvent) } catch { /* ignore malformed frame */ }
        }
      }
    } finally {
      readerRef.current = null
    }
  }, [])

  return { stream, stop }
}
