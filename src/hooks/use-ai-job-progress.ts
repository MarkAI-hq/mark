// src/hooks/use-ai-job-progress.ts
'use client'

// Shared "AI job → poll/stream → result" primitive, generalized from
// BatchGradingDialog's SSE-with-fallback-poll pattern (the one AI-progress
// experience in the app that was already trustworthy end to end). Any
// feature that queues a Bull job and wants real progress feedback — exam
// generation, scheme-of-work generation, reteach — can use this instead of
// re-implementing its own poll loop with its own milestone guessing.
//
// SSE is the primary channel (real push, no polling delay). The fallback
// poll runs unconditionally alongside it — not only "on SSE failure" — for
// the same reason BatchGradingDialog does it: a dropped SSE connection that
// silently stops emitting (rather than erroring) would otherwise leave the
// UI stuck with no signal. Whichever channel reports `done` first wins.

import { useState, useRef, useCallback, useEffect } from 'react'

export type AiJobStatus = 'idle' | 'queued' | 'processing' | 'completed' | 'failed'

export interface AiJobEvent {
  progress: number
  status?: AiJobStatus | string
  done?: boolean
  error?: string
  [key: string]: unknown
}

export interface AiJobPollResult extends AiJobEvent {
  // Poll results use the same shape as SSE events so both channels can
  // feed the same reducer below.
}

interface UseAiJobProgressOptions {
  /** Builds the SSE URL for a job id. Return null to skip SSE entirely (poll-only). */
  sseUrl: (jobId: string | number) => string | null
  /** Polling fallback — called every `pollIntervalMs` until `done`. */
  poll: (jobId: string | number) => Promise<AiJobPollResult | null>
  pollIntervalMs?: number
  maxPollAttempts?: number
  onDone?: (finalEvent: AiJobEvent) => void
}

interface UseAiJobProgressReturn {
  status:   AiJobStatus
  progress: number
  error:    string | null
  /** Any extra fields the last event carried (e.g. exam_id, submission scores). */
  result:   Record<string, unknown> | null
  start:    (jobId: string | number) => void
  reset:    () => void
}

export function useAiJobProgress({
  sseUrl,
  poll,
  pollIntervalMs = 3000,
  maxPollAttempts = 120,
  onDone,
}: UseAiJobProgressOptions): UseAiJobProgressReturn {
  const [status,   setStatus]   = useState<AiJobStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [error,    setError]    = useState<string | null>(null)
  const [result,   setResult]   = useState<Record<string, unknown> | null>(null)

  const abortRef    = useRef<AbortController | null>(null)
  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const attemptsRef = useRef(0)
  const doneRef      = useRef(false)

  const cleanup = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    attemptsRef.current = 0
  }, [])

  useEffect(() => () => cleanup(), [cleanup])

  const applyEvent = useCallback((evt: AiJobEvent) => {
    if (doneRef.current) return // first channel to finish wins; ignore the other's late events

    setProgress(Math.max(0, evt.progress ?? 0))
    if (evt.status === 'FAILED' || evt.status === 'failed' || evt.error) {
      doneRef.current = true
      setStatus('failed')
      setError(evt.error ?? 'Something went wrong. Please try again.')
      cleanup()
      onDone?.(evt)
      return
    }
    if (evt.done || evt.status === 'COMPLETED' || evt.status === 'completed') {
      doneRef.current = true
      setStatus('completed')
      setProgress(100)
      setResult(evt)
      cleanup()
      onDone?.(evt)
      return
    }
    setStatus('processing')
  }, [cleanup, onDone])

  const openSSE = useCallback((jobId: string | number) => {
    const url = sseUrl(jobId)
    if (!url) return

    const ctrl = new AbortController()
    abortRef.current = ctrl

    fetch(url, { credentials: 'include', headers: { Accept: 'text/event-stream' }, signal: ctrl.signal })
      .then(async res => {
        if (!res.ok || !res.body) return
        const reader  = res.body.getReader()
        const decoder = new TextDecoder()
        let   buffer  = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer      = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.startsWith('data:')) continue
            try { applyEvent(JSON.parse(line.slice(5).trim())) } catch { /* ignore malformed frame */ }
          }
        }
      })
      .catch(err => { if (err?.name !== 'AbortError') { /* fallback poll carries on */ } })
  }, [sseUrl, applyEvent])

  const startFallbackPoll = useCallback((jobId: string | number) => {
    attemptsRef.current = 0
    pollRef.current = setInterval(async () => {
      if (doneRef.current) { cleanup(); return }
      attemptsRef.current += 1
      if (attemptsRef.current > maxPollAttempts) {
        cleanup()
        if (!doneRef.current) {
          doneRef.current = true
          setStatus('failed')
          setError('This is taking longer than expected. Please try again.')
        }
        return
      }
      const evt = await poll(jobId)
      if (evt) applyEvent(evt)
    }, pollIntervalMs)
  }, [poll, pollIntervalMs, maxPollAttempts, applyEvent, cleanup])

  const start = useCallback((jobId: string | number) => {
    cleanup()
    doneRef.current = false
    setStatus('queued')
    setProgress(0)
    setError(null)
    setResult(null)
    openSSE(jobId)
    startFallbackPoll(jobId)
  }, [cleanup, openSSE, startFallbackPoll])

  const reset = useCallback(() => {
    cleanup()
    doneRef.current = false
    setStatus('idle')
    setProgress(0)
    setError(null)
    setResult(null)
  }, [cleanup])

  return { status, progress, error, result, start, reset }
}
