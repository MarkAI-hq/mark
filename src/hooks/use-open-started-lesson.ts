'use client'

// Open a lesson the student just started ("Study this", "Preview", topic cards).
//
// Lessons are generated synchronously and checked against the curriculum
// before the start call returns, so the outcome is already known here:
//   - ready        → open it.
//   - held, but there's an openable lesson on the same topic → say so, open that.
//   - held, nothing else → say why in place (no navigation) and offer the
//     assistant on that topic.
// Before this, every held lesson navigated to the studio, 404'd, and bounced to
// a "still being prepared" banner that never changed (nothing was preparing).

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { StartedLesson } from '@/lib/actions/student-dashboard'
import { useAssistantName } from '@/hooks/use-assistant-name'
import { formatTopicTitle } from '@/lib/utils'
import { openAssistantPanel } from '@/signals/assistant-panel'

export function useOpenStartedLesson() {
  const router = useRouter()
  const assistant = useAssistantName()

  return useCallback(
    (lesson: StartedLesson | null | undefined, opts: { readyMessage?: string } = {}): boolean => {
      if (!lesson?.plan_id) return false

      if (lesson.ready) {
        if (opts.readyMessage) toast.success(opts.readyMessage)
        router.push(`/student/study-plans/${lesson.plan_id}/studio`)
        return true
      }

      const rawTopic = lesson.alternative?.topic ?? lesson.plan?.topic ?? ''
      const topic = rawTopic ? formatTopicTitle(rawTopic) : 'this topic'

      if (lesson.alternative) {
        const alt = lesson.alternative
        toast(`Your new ${topic} lesson is with your teacher for a quick check.`, {
          description: alt.completed
            ? "Opening the one you've already finished so you can review it."
            : 'Opening the lesson on this topic that is ready now.',
        })
        router.push(
          `/student/study-plans/${alt.plan_id}/studio${alt.completed ? '?mode=review' : ''}`,
        )
        return true
      }

      const failed = lesson.held_reason === 'generation_failed'
      toast(
        failed
          ? `We couldn't build your ${topic} lesson just now.`
          : `Your ${topic} lesson is with your teacher for a quick check.`,
        {
          description: failed
            ? 'Try again in a few minutes, or get help on it straight away.'
            : "It'll appear in My Learning once it's approved. Want help with it now?",
          duration: 9000,
          action: {
            label: `Ask ${assistant}`,
            onClick: () => openAssistantPanel(`Help me with ${topic}`),
          },
        },
      )
      return false
    },
    [router, assistant],
  )
}
