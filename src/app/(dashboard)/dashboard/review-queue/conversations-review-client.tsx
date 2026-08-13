'use client'

import { useState } from 'react'
import { ChevronDown, ShieldAlert, ShieldCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { FlaggedConversation } from '@/lib/actions/quality-eval'

export function ConversationsReviewClient({ conversations }: { conversations: FlaggedConversation[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (conversations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <ShieldCheck className="h-8 w-8 text-emerald-500" />
          <p className="font-medium">Nothing flagged right now</p>
          <p className="text-sm text-muted-foreground">
            Tutoring conversations that fail a quality check — misconception diagnosis, giving
            away answers, factual errors — will show up here, scoped to your own classes.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-3">
      {conversations.map((c) => {
        const isOpen = expanded === c.conversation_id
        return (
          <Card key={c.conversation_id}>
            <CardContent className="flex flex-col gap-1.5 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
                <span className="font-semibold">Tutoring conversation flagged</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(c.created_at).toLocaleString()}
                </span>
              </div>
              {c.judge_notes && (
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  {c.judge_notes}
                </p>
              )}

              <Collapsible open={isOpen} onOpenChange={(v) => setExpanded(v ? c.conversation_id : null)}>
                <CollapsibleTrigger className="flex items-center gap-1 pt-1 text-xs font-medium text-foreground/70 hover:text-foreground">
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  {isOpen ? 'Hide transcript' : 'View transcript'}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-2 rounded-lg border bg-muted/30 p-3 text-sm">
                  {c.transcript.map((turn, i) => (
                    <p key={i}>
                      <span className="font-medium">{turn.role === 'user' ? 'Student: ' : 'Tracy: '}</span>
                      {turn.content}
                    </p>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
