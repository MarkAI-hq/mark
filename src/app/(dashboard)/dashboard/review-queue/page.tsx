// src/app/(dashboard)/dashboard/review-queue/page.tsx
import { Metadata } from 'next'
import { getReviewQueue } from '@/lib/actions/study-plans'
import { ReviewQueueClient } from './review-queue-client'

export const metadata: Metadata = {
  title: 'Review queue - Mark',
  description: 'AI-generated lessons flagged for low curriculum alignment or a failed quality check.',
}

export default async function ReviewQueuePage() {
  const { data: plans, error } = await getReviewQueue()

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
            Lessons the generation pipeline flagged itself — weak curriculum grounding, low
            alignment, or a simulation that failed its quality gate. Nothing here was hidden
            from students; it&apos;s already been delivered and just needs a look.
          </h4>
        </div>
      </div>
      <ReviewQueueClient initial={plans ?? []} />
    </div>
  )
}
