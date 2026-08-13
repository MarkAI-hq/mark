// src/app/(dashboard)/dashboard/review-queue/page.tsx
import { Metadata } from 'next'
import { getReviewQueue } from '@/lib/actions/study-plans'
import { getQualityReviewQueue } from '@/lib/actions/quality-eval'
import { ReviewQueueTabs } from './review-queue-tabs'

export const metadata: Metadata = {
  title: 'Review queue - Mark',
  description: 'AI-generated lessons and tutoring conversations flagged for a failed quality check.',
}

export default async function ReviewQueuePage() {
  const [{ data: plans, error }, { data: conversations }] = await Promise.all([
    getReviewQueue(),
    getQualityReviewQueue(),
  ])

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Error</h2>
        <p className="text-red-500">
          Failed to load the review queue: {error.message}
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-3xl font-bold tracking-tight">
          Review queue
          <h4 className="pt-3 text-lg font-normal text-muted-foreground">
            Content the generation pipeline flagged itself — weak curriculum grounding, a
            failed simulation quality gate, or a tutoring conversation that missed a quality
            check. Nothing here was hidden from students; it&apos;s already been delivered and
            just needs a look.
          </h4>
        </div>
      </div>
      <ReviewQueueTabs lessonPlans={plans ?? []} conversations={conversations ?? []} />
    </div>
  )
}
