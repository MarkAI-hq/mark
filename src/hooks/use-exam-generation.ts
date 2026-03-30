// src/hooks/use-exam-generation.ts
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { generateExam, getExamJobStatus, ExamJobStatus } from '@/lib/actions/exam-builder'
import type { GenerateExamPayload } from '@/lib/types'

export type GenerationState =
  | 'idle'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'

interface UseExamGenerationReturn {
  generate:  (dto: GenerateExamPayload) => Promise<void>
  state:     GenerationState
  progress:  number        // 0–100
  error:     string | null
  reset:     () => void
}

const POLL_INTERVAL_MS  = 3000   // poll every 3 seconds
const MAX_POLL_ATTEMPTS = 120    // 6 minutes max before giving up

export function useExamGeneration(): UseExamGenerationReturn {
  const router = useRouter()

  const [state,    setState]    = useState<GenerationState>('idle')
  const [progress, setProgress] = useState(0)
  const [error,    setError]    = useState<string | null>(null)

  const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const attemptsRef = useRef(0)
  const jobIdRef    = useRef<string | number | null>(null)

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    attemptsRef.current = 0
  }, [])

  const redirectToExam = useCallback((examId: string) => {
    router.push(`/dashboard/exam-builder/preview/${examId}`)
  }, [router])

  const startPolling = useCallback((jobId: string | number) => {
    jobIdRef.current    = jobId
    attemptsRef.current = 0

    pollRef.current = setInterval(async () => {
      attemptsRef.current += 1

      if (attemptsRef.current > MAX_POLL_ATTEMPTS) {
        stopPolling()
        setState('failed')
        setError('Generation timed out. Please try again.')
        return
      }

      const { data: status, error: statusError } = await getExamJobStatus(jobId)

      if (statusError) {
        console.warn('Status poll error (will retry):', statusError.message)
        return
      }

      if (!status) return

      setProgress(status.progress)

      switch (status.status) {
        case 'QUEUED':
          setState('queued')
          break

        case 'PROCESSING':
          setState('processing')
          break

        case 'COMPLETED':
          stopPolling()
          setState('completed')
          setProgress(100)
          if (status.exam_id) {
            redirectToExam(status.exam_id)
          } else {
            // Bull occasionally persists returnvalue slightly after marking
            // the job complete — retry once after 1 second
            setTimeout(async () => {
              const { data: retry } = await getExamJobStatus(jobId)
              if (retry?.exam_id) {
                redirectToExam(retry.exam_id)
              } else {
                setState('failed')
                setError('Exam was generated but could not be located. Please check your assessments list.')
              }
            }, 1000)
          }
          break

        case 'FAILED':
          stopPolling()
          setState('failed')
          setError(status.error ?? 'Exam generation failed. Please try again.')
          break
      }
    }, POLL_INTERVAL_MS)
  }, [redirectToExam, stopPolling])

  const generate = useCallback(async (dto: GenerateExamPayload) => {
    setState('queued')
    setProgress(0)
    setError(null)
    stopPolling()

    const { data: enqueued, error: enqueueError } = await generateExam(dto)

    if (enqueueError || !enqueued) {
      setState('failed')
      setError(enqueueError?.message ?? 'Failed to start generation.')
      return
    }

    startPolling(enqueued.job_id)
  }, [startPolling, stopPolling])

  const reset = useCallback(() => {
    stopPolling()
    setState('idle')
    setProgress(0)
    setError(null)
    jobIdRef.current = null
  }, [stopPolling])

  return { generate, state, progress, error, reset }
}