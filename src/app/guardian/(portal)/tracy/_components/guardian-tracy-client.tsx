'use client'

// A deliberately small third Tracy surface, alongside the teacher
// (artifact-panel admin assistant) and student (NotebookLM-style study
// tool) chats. A guardian asking "how is my child doing in Math?" needs a
// simple back-and-forth, not either of those UIs' full machinery — so this
// reuses only the shared wire-protocol plumbing (tracy-protocol.ts,
// use-tracy-chat-stream.ts, TypingDots, UsageRemainingBanner) and skips
// ArtifactPanel/WidgetRenderer entirely. Tracy's guardian system prompt
// never emits __ARTIFACT__/__WIDGET__/__CONFIRM__ for this mode — only
// plain text and, occasionally, a trailing __NEXT__ suggestion — so the
// marker-stripping below only needs to handle NEXT, kept defensive against
// the others in case the model ever strays.

import { useEffect, useRef, useState } from 'react'
import { Send, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { TypingDots } from '@/components/tracy/typing-dots'
import { UsageRemainingBanner } from '@/components/tracy/usage-remaining-banner'
import {
  ARTIFACT_RE, CONFIRM_RE, NEXT_RE, extractJson,
  type TracySseEvent,
} from '@/components/tracy/tracy-protocol'
import { useTracyChatStream } from '@/hooks/use-tracy-chat-stream'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  isLoading?: boolean
}

const BARE_MARKER_RE = /(?:^|\n)\s*(?:__)?(?:NEXT|CONFIRM|ARTIFACT)(?:__)?\s*:\s*$/

const STARTER_PROMPTS = [
  "How's my child doing overall?",
  'How has attendance been recently?',
  'What topics has my child mastered?',
]

export function GuardianTracyClient({ guardianName }: { guardianName: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [usageRemaining, setUsageRemaining] = useState<number | null>(null)
  const [nextSuggestion, setNextSuggestion] = useState<string | null>(null)

  const sessionIdRef = useRef<string>(crypto.randomUUID())
  const tracyStream = useTracyChatStream()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || streaming) return

    setNextSuggestion(null)
    setInput('')
    setStreaming(true)
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', content: trimmed },
      { id: crypto.randomUUID(), role: 'assistant', content: '', isLoading: true },
    ])

    let accumulated = ''

    const onEvent = (ev: TracySseEvent) => {
      switch (ev.type) {
        case 'text_delta':
          accumulated += ev.delta ?? ''
          setMessages((p) => p.map((m) => (m.isLoading ? { ...m, content: accumulated } : m)))
          break
        case 'error': {
          const msg =
            ev.message === '__AUTH_PENDING__'
              ? 'Session expired — please refresh and try again.'
              : 'Sorry, I had trouble responding. Please try again.'
          setMessages((p) => p.map((m) => (m.isLoading ? { ...m, content: msg, isLoading: false } : m)))
          break
        }
        case 'done': {
          const reply = (accumulated || ev.reply || '').trim()

          const confirmMatch = reply.match(CONFIRM_RE)
          const artifactMatch = reply.match(ARTIFACT_RE)
          const nextMatch = reply.match(NEXT_RE)

          let display = reply
          let suggestion: string | null = null

          if (confirmMatch) display = reply.slice(0, reply.search(CONFIRM_RE)).trim()
          else if (artifactMatch) display = reply.slice(0, reply.search(ARTIFACT_RE)).trim()
          else if (nextMatch) {
            display = reply.slice(0, reply.search(NEXT_RE)).trim()
            const json = extractJson(nextMatch[1])
            const parsed = json ? (() => { try { return JSON.parse(json) } catch { return null } })() : null
            if (!display) display = parsed?.message || ''
            suggestion = parsed?.options?.[0]?.value ?? parsed?.message ?? null
          }

          const cleaned = (display || reply).replace(BARE_MARKER_RE, '').trim()
          const finalContent = cleaned || "I don't have anything more to add there — what would you like to know?"

          setMessages((p) => p.map((m) => (m.isLoading ? { ...m, content: finalContent, isLoading: false } : m)))
          if (typeof ev.usageRemaining === 'number') setUsageRemaining(ev.usageRemaining)
          setNextSuggestion(suggestion)
          accumulated = ''
          break
        }
      }
    }

    try {
      await tracyStream.stream({ message: trimmed, sessionId: sessionIdRef.current }, onEvent)
    } catch {
      setMessages((p) =>
        p.map((m) => (m.isLoading ? { ...m, content: 'Sorry, I had trouble responding. Please try again.', isLoading: false } : m)),
      )
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] max-w-2xl mx-auto w-full">
      <div className="flex-1 overflow-y-auto space-y-4 py-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
              <Sparkles className="h-6 w-6 text-gold" />
            </div>
            <div>
              <p className="font-semibold">Ask Tracy about your child</p>
              <p className="text-sm text-muted-foreground mt-1">
                Hi {guardianName.split(' ')[0] || 'there'} — ask me anything about how your child is doing.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {STARTER_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="text-sm text-left rounded-lg border px-3 py-2 hover:bg-gold/5 hover:border-gold/40 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={
                m.role === 'user'
                  ? 'max-w-[85%] rounded-2xl bg-gold text-gold-foreground px-4 py-2.5 text-sm'
                  : 'max-w-[85%] rounded-2xl bg-muted px-4 py-2.5 text-sm whitespace-pre-wrap'
              }
            >
              {m.isLoading && !m.content ? <TypingDots /> : m.content}
            </div>
          </div>
        ))}

        {nextSuggestion && !streaming && (
          <div className="flex justify-start">
            <button
              onClick={() => send(nextSuggestion)}
              className="text-xs rounded-full border px-3 py-1.5 text-muted-foreground hover:text-gold hover:border-gold/40 transition-colors"
            >
              {nextSuggestion}
            </button>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      <UsageRemainingBanner remaining={usageRemaining} />

      <div className="flex items-end gap-2 border-t pt-3">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send(input)
            }
          }}
          placeholder="Ask about your child's progress…"
          className="min-h-[44px] max-h-32 resize-none"
          disabled={streaming}
        />
        <Button size="icon" onClick={() => send(input)} disabled={streaming || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
