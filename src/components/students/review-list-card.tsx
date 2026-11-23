'use client'

// The student's own review list (items saved from the end-of-lesson review
// log). Soonest due first; ticking one off resolves it. Hidden when empty so
// it never adds an empty card to the page.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { NotebookPen, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatTopicTitle } from '@/lib/utils'
import { getReviewItems, setReviewItemStatus, type ReviewItem } from '@/lib/actions/review-log'

function dueLabel(iso: string): { text: string; due: boolean } {
  const d = new Date(iso)
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  if (d <= today) return { text: 'Due now', due: true }
  return { text: d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }), due: false }
}

export function ReviewListCard() {
  const [items, setItems] = useState<ReviewItem[] | null>(null)

  useEffect(() => {
    let alive = true
    getReviewItems()
      .then(({ data }) => alive && setItems(data ?? []))
      .catch(() => alive && setItems([]))
    return () => {
      alive = false
    }
  }, [])

  if (!items?.length) return null

  async function resolve(item: ReviewItem) {
    setItems((xs) => xs?.filter((x) => x.id !== item.id) ?? null)
    const { error } = await setReviewItemStatus(item.id, 'resolved')
    if (error) {
      toast.error('Could not update — try again')
      setItems((xs) => (xs ? [...xs, item].sort((a, b) => a.due_at.localeCompare(b.due_at)) : [item]))
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <NotebookPen className="h-4 w-4 text-gold" />
          My review list
        </CardTitle>
        <CardDescription>Things you flagged as tricky. Tick one off when it no longer is.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {items.map((item) => {
            const due = dueLabel(item.due_at)
            return (
              <li key={item.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => resolve(item)}
                  aria-label={`Mark "${item.text}" as done`}
                  className="group mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-muted-foreground/40 hover:border-gold hover:bg-gold/10"
                >
                  <Check className="h-3 w-3 text-transparent group-hover:text-gold" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-sm [overflow-wrap:anywhere]">{item.text}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.subject} · {formatTopicTitle(item.topic)}
                    {item.plan_id && (
                      <>
                        {' · '}
                        <Link href={`/student/study-plans/${item.plan_id}/studio`} className="underline-offset-2 hover:text-gold hover:underline">
                          revisit lesson
                        </Link>
                      </>
                    )}
                  </p>
                </div>
                <span className={`shrink-0 text-xs ${due.due ? 'font-semibold text-gold' : 'text-muted-foreground'}`}>{due.text}</span>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
