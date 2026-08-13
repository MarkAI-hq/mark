'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FileWarning, MessageSquareWarning } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ReviewQueueClient } from './review-queue-client'
import { ConversationsReviewClient } from './conversations-review-client'
import type { FlaggedStudyPlan } from '@/lib/actions/study-plans'
import type { FlaggedConversation } from '@/lib/actions/quality-eval'

export function ReviewQueueTabs({
  lessonPlans,
  conversations,
}: {
  lessonPlans: FlaggedStudyPlan[]
  conversations: FlaggedConversation[]
}) {
  // URL-synced so a CONVERSATION_FLAGGED notification's
  // /dashboard/review-queue?tab=conversations link actually lands on the
  // right tab, not just the page with the wrong one selected.
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') ?? 'lessons')

  useEffect(() => {
    setActiveTab(searchParams.get('tab') ?? 'lessons')
  }, [searchParams])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    router.replace(`?tab=${tab}`, { scroll: false })
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList>
        <TabsTrigger value="lessons" className="flex items-center gap-1.5">
          <FileWarning className="h-3.5 w-3.5" />
          Lesson content
          {lessonPlans.length > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
              {lessonPlans.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="conversations" className="flex items-center gap-1.5">
          <MessageSquareWarning className="h-3.5 w-3.5" />
          Tutoring conversations
          {conversations.length > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
              {conversations.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="lessons" className="mt-4">
        <ReviewQueueClient initial={lessonPlans} />
      </TabsContent>
      <TabsContent value="conversations" className="mt-4">
        <ConversationsReviewClient conversations={conversations} />
      </TabsContent>
    </Tabs>
  )
}
