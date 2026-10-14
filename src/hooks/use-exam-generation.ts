// src/hooks/use-exam-generation.ts
'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateExam, getExamJobStatus } from '@/lib/actions/exam-builder'
import type { GenerateExamPayload } from '@/lib/types'
import { useAiJobProgress, type AiJobEvent } from '@/hooks/use-ai-job-progress'

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

export function useExamGeneration(): UseExamGenerationReturn {
  const router   = useRouter()
  const retryRef = useRef<string | null>(null) // exam_id pending the Bull-returnvalue-lag retry below

  const redirectToExam = useCallback((examId: string) => {
    router.push(`/dashboard/exam-builder/preview/${examId}`)
  }, [router])

  const handleDone = useCallback((evt: AiJobEvent) => {
    const examId = typeof evt.exam_id === 'string' ? evt.exam_id : undefined
    if (evt.status === 'FAILED' || evt.error) return // surfaced via hook's own error state
    if (examId) {
      redirectToExam(examId)
      return
    }
    // Bull occasionally persists returnvalue slightly after marking the job
    // complete — retry the status fetch once after 1 second, same as before.
    const jobId = retryRef.current
    if (!jobId) return
    setTimeout(async () => {
      const { data: retry } = await getExamJobStatus(jobId)
      if (retry?.exam_id) redirectToExam(retry.exam_id)
    }, 1000)
  }, [redirectToExam])

  const job = useAiJobProgress({
    sseUrl: (jobId) => `/api/v1/exam-builder/jobs/${jobId}/stream`,
    poll: async (jobId) => {
      const { data, error } = await getExamJobStatus(jobId)
      if (error) return null // transient — the interval just tries again
      if (!data) return null
      return {
        progress: data.progress,
        status:   data.status,
        done:     data.status === 'COMPLETED' || data.status === 'FAILED',
        error:    data.error,
        exam_id:  data.exam_id,
      }
    },
    maxPollAttempts: 120, // 6 minutes, same ceiling as before
    onDone: handleDone,
  })

  // Immediate "queued" feedback on click, before the enqueue POST resolves —
  // the shared hook has no job id yet at that point, so this is tracked
  // alongside it rather than inside it.
  const [submitting, setSubmitting] = useState(false)

  const generate = useCallback(async (dto: GenerateExamPayload) => {
    job.reset()
    setSubmitting(true)

    const { data: enqueued, error: enqueueError } = await generateExam(dto)

    setSubmitting(false)
    if (enqueueError || !enqueued) {
      job.reset()
      return
    }

    retryRef.current = String(enqueued.job_id)
    job.start(enqueued.job_id)
  }, [job])

  // Map the shared hook's generic AiJobStatus 1:1 onto the existing
  // GenerationState the rest of the exam-builder UI already expects.
  const state: GenerationState = submitting ? 'queued' : job.status

  const reset = useCallback(() => {
    setSubmitting(false)
    job.reset()
  }, [job])

  return { generate, state, progress: job.progress, error: job.error, reset }
}
