'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LifeBuoy, Send, Sparkles, BookOpen, MessageCircle, CheckCircle2, Compass } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { submitHelpRequest } from '@/lib/actions/student-help'

export function HelpClient({ isMarketplace }: { isMarketplace: boolean }) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  function handleSubmit() {
    if (!message.trim() || sending) return
    setSending(true)
    submitHelpRequest(message.trim()).then(({ data, error }) => {
      setSending(false)
      if (error) { toast.error(error.message ?? 'Could not reach your guide'); return }
      setSent(true)
      setMessage('')
      toast.success(`Sent to ${data?.notified_teachers ?? 0} guide${data?.notified_teachers === 1 ? '' : 's'}`)
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <LifeBuoy className="h-5 w-5 text-gold" /> Help & Guide
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your guide is your teacher — the person who actually knows your class and can help when you&apos;re stuck.
        </p>
      </div>

      {isMarketplace ? (
        <Card className="border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-900">
          <CardContent className="py-4 px-4 flex items-start gap-3">
            <MessageCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              You&apos;re studying independently, so there&apos;s no class guide to message directly. Tracy is your best
              first stop for questions — she can explain concepts, show your results, and point you toward what to
              study next.
            </p>
          </CardContent>
        </Card>
      ) : sent ? (
        <Card className="border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20 dark:border-emerald-900">
          <CardContent className="py-4 px-4 flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Sent to your guide</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                They&apos;ll see it in their notifications. In the meantime, Tracy can help you keep moving.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-4 px-4 space-y-2.5">
            <p className="text-sm font-medium">Ask your guide something</p>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What are you stuck on? Be specific — subject, topic, and what's confusing."
              rows={4}
              className="text-sm resize-none"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!message.trim() || sending}
                className="gap-1.5 bg-gold hover:bg-gold/90 text-gold-foreground"
              >
                <Send className="h-3.5 w-3.5" /> {sending ? 'Sending…' : 'Send to my guide'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {/* Plain <a>, not next/link's <Link> — a full page load, not a
            client-side transition, is what makes the guided tour render
            reliably (see the comment in guided-tour.tsx). */}
        <a href="/student/dashboard?tour=replay">
          <Card className="hover:border-gold/40 transition-colors h-full">
            <CardContent className="py-4 px-4 flex items-start gap-3">
              <Compass className="h-4 w-4 text-gold shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Retake the dashboard tour</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  A quick walkthrough of your dashboard, lessons, and streak — the same one you saw when you first joined.
                </p>
              </div>
            </CardContent>
          </Card>
        </a>
        <Link href="/student/tracy">
          <Card className="hover:border-gold/40 transition-colors h-full">
            <CardContent className="py-4 px-4 flex items-start gap-3">
              <Sparkles className="h-4 w-4 text-gold shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Ask Tracy instantly</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  For quick explanations, checking your results, or practice — no waiting for a reply.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/student/knowledge-base">
          <Card className="hover:border-gold/40 transition-colors h-full">
            <CardContent className="py-4 px-4 flex items-start gap-3">
              <BookOpen className="h-4 w-4 text-gold shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Your Knowledge Base</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Notes you&apos;ve saved from past lessons — often the fastest way to jog your memory.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <p className="text-xs text-muted-foreground">
        Messages to your guide go straight to your class teacher&apos;s notifications — this isn&apos;t a live chat, so
        expect a reply within a school day, not instantly.
      </p>
    </div>
  )
}
