'use client'

// src/components/students/assistant-panel.tsx
//
// The student's assistant, in place: a panel that slides in over whatever page
// they're on (a lesson, their schedule, a subject) instead of sending them to a
// new tab or away from what they were doing. Opened by openAssistantPanel(prompt)
// from any "Ask Tracy" chip; the prompt is sent straight away. The conversation
// stays put while the student keeps working, so closing and reopening the panel
// picks up where they left off. Heavier tools (sources, flashcards, history) live
// on the full chat page, one tap away.

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { ArrowUp, Maximize2, RotateCcw, Square } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { assistantPanelSignal, closeAssistantPanel } from '@/signals/assistant-panel'
import { useAssistantName } from '@/hooks/use-assistant-name'
import { useTracyChatStream } from '@/hooks/use-tracy-chat-stream'
import { AssistantMessage, UserMessage } from '@/components/tracy/chat-message'
import { GenerativeUI, EMPTY_QUIZ_DRAFT, type QuizDraft } from '@/components/tracy/generative-ui'
import { parseGenerativeUi, stripUiMarker, type GenerativeUi } from '@/components/tracy/generative-ui-protocol'
import { ARTIFACT_RE, CONFIRM_RE, NEXT_RE, WIDGET_RE, extractJson, type ToolStatus } from '@/components/tracy/tracy-protocol'
import { UsageRemainingBanner } from '@/components/tracy/usage-remaining-banner'
import { noPasteProps } from '@/lib/no-paste'

interface PanelMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  loading?: boolean
  tools?: ToolStatus[]
  ui?: GenerativeUi
  quizVerified?: boolean
  nextOptions?: { label: string; value: string }[]
  /** The reply carried something only the full page can show (an artifact or widget). */
  fullPageOnly?: boolean
}

/** Turn a finished raw reply into what the panel shows (mirrors the full chat page's rules). */
function toDisplay(raw: string): Pick<PanelMessage, 'content' | 'ui' | 'nextOptions' | 'fullPageOnly'> {
  const reply = raw.replace(/^[ \t]*__RESULT__[ \t]*:[^\n]*$/gm, '').trim()
  const parsed = parseGenerativeUi(reply)
  if (parsed) return { content: parsed.text, ui: parsed.ui }
  const text = stripUiMarker(reply)

  let nextOptions: PanelMessage['nextOptions']
  const next = text.match(NEXT_RE)
  if (next) {
    try {
      const opts = JSON.parse(extractJson(next[1]) ?? 'null')?.options
      if (Array.isArray(opts)) {
        nextOptions = opts
          .filter((o: { label?: unknown }) => o && typeof o.label === 'string')
          .slice(0, 6)
          .map((o: { label: string; value?: unknown }) => ({
            label: o.label,
            value: typeof o.value === 'string' && /\s/.test(o.value.trim()) ? o.value : o.label,
          }))
      }
    } catch { /* malformed options: text only */ }
  }

  const cut = [CONFIRM_RE, ARTIFACT_RE, WIDGET_RE, NEXT_RE]
    .map((re) => text.search(re))
    .filter((i) => i >= 0)
  const display = (cut.length ? text.slice(0, Math.min(...cut)) : text)
    .replace(/(?:^|\n)\s*(?:__)?(?:NEXT|CONFIRM|ARTIFACT|WIDGET)(?:__)?\s*:\s*$/, '')
    .trim()
  return {
    content: display || "Here's what I found — open the full chat to see it.",
    nextOptions,
    fullPageOnly: ARTIFACT_RE.test(text) || WIDGET_RE.test(text),
  }
}

export function AssistantPanel() {
  const panel = useSyncExternalStore(
    (cb) => assistantPanelSignal.subscribe(cb),
    () => assistantPanelSignal.value,
    () => assistantPanelSignal.value,
  )
  const assistant = useAssistantName()
  const tracyStream = useTracyChatStream()

  const [messages, setMessages] = useState<PanelMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [liveTools, setLiveTools] = useState<ToolStatus[]>([])
  const [usageRemaining, setUsageRemaining] = useState<number | null>(null)
  const [quizDrafts, setQuizDrafts] = useState<Record<string, QuizDraft>>({})

  const sessionIdRef = useRef<string>('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const handledNonce = useRef(0)

  const send = useCallback(async (text: string) => {
    const message = text.trim()
    if (!message || streaming) return
    if (!sessionIdRef.current) sessionIdRef.current = crypto.randomUUID()
    const fresh = messages.length === 0
    setInput('')
    setLiveTools([])
    const replyId = crypto.randomUUID()
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', content: message },
      { id: replyId, role: 'assistant', content: '', loading: true },
    ])
    setStreaming(true)

    let accumulated = ''
    let trace: ToolStatus[] = []
    const patch = (p: Partial<PanelMessage>) =>
      setMessages((prev) => prev.map((m) => (m.id === replyId ? { ...m, ...p } : m)))

    try {
      await tracyStream.stream(
        { message, sessionId: sessionIdRef.current, mode: 'student', freshChat: fresh },
        (ev: any) => {
          switch (ev.type) {
            case 'tool_call':
              if (!trace.find((t) => t.name === ev.name && t.status === 'running')) {
                trace = [...trace, { name: ev.name, label: ev.label, status: 'running' }]
                setLiveTools(trace)
              }
              break
            case 'tool_result':
              trace = trace.map((t) =>
                t.name === ev.name && t.status === 'running' ? { ...t, status: ev.success ? 'done' : 'failed' } : t,
              )
              setLiveTools(trace)
              break
            case 'reset':
              accumulated = ''
              patch({ content: '' })
              break
            case 'quiz_verified':
              patch({ quizVerified: true })
              break
            case 'text_delta':
              accumulated += ev.delta ?? ''
              patch({ content: accumulated })
              break
            case 'error':
              patch({
                content:
                  ev.message === '__AUTH_PENDING__'
                    ? 'Your session expired. Refresh the page and try again.'
                    : 'Sorry, I had trouble responding. Please try again.',
                loading: false,
              })
              break
            case 'done':
              patch({ ...toDisplay(accumulated || ev.reply || ''), loading: false, tools: trace.length ? trace : undefined })
              if (typeof ev.usageRemaining === 'number') setUsageRemaining(ev.usageRemaining)
              break
          }
        },
      )
    } catch (err: any) {
      patch(
        err?.name === 'AbortError'
          ? { content: accumulated || 'Stopped.', loading: false }
          : { content: 'Sorry, I had trouble responding. Please try again.', loading: false },
      )
    } finally {
      setStreaming(false)
      setLiveTools([])
    }
  }, [messages.length, streaming, tracyStream])

  // Opened with a question → ask it once per open.
  useEffect(() => {
    if (!panel.open || panel.nonce === handledNonce.current) return
    handledNonce.current = panel.nonce
    if (panel.prompt) void send(panel.prompt)
    else setTimeout(() => inputRef.current?.focus(), 150)
  }, [panel.open, panel.nonce, panel.prompt, send])

  // Keep the newest message in view.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  function newChat() {
    tracyStream.stop()
    sessionIdRef.current = ''
    setMessages([])
    setQuizDrafts({})
    setStreaming(false)
    setInput('')
    inputRef.current?.focus()
  }

  const lastAssistantId = [...messages].reverse().find((m) => m.role === 'assistant')?.id

  return (
    <Sheet open={panel.open} onOpenChange={(open) => { if (!open) closeAssistantPanel() }}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-[440px]"
        // Keep the lesson underneath usable-feeling: no focus jump to the close button.
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-3 pr-12">
          <div className="min-w-0 flex-1">
            <SheetTitle className="text-[15px] font-medium">{assistant}</SheetTitle>
            <SheetDescription className="text-[12px]">Ask anything about what you&apos;re working on.</SheetDescription>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={newChat}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="New chat"
              title="New chat"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
          <Link
            href="/student/tracy"
            onClick={() => closeAssistantPanel()}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Open full chat"
            title="Open full chat"
          >
            <Maximize2 className="h-4 w-4" />
          </Link>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
          {messages.length === 0 && (
            <p className="pt-10 text-center text-[13px] text-muted-foreground">
              Stuck on something? Ask {assistant} and keep working — this stays open beside you.
            </p>
          )}
          {messages.map((m) =>
            m.role === 'user' ? (
              <UserMessage key={m.id}>{m.content}</UserMessage>
            ) : (
              <AssistantMessage
                key={m.id}
                content={m.content}
                streaming={!!m.loading}
                tools={m.loading ? liveTools : m.tools}
              >
                {m.ui && (
                  <div className="mt-3">
                    <GenerativeUI
                      ui={m.ui}
                      active={m.id === lastAssistantId && !streaming}
                      onSend={(t) => void send(t)}
                      variant="aside"
                      draft={quizDrafts[m.id] ?? EMPTY_QUIZ_DRAFT}
                      onDraftChange={(d) => setQuizDrafts((p) => ({ ...p, [m.id]: d }))}
                      verified={m.quizVerified}
                    />
                  </div>
                )}
                {m.nextOptions && m.id === lastAssistantId && !streaming && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.nextOptions.map((o) => (
                      <button
                        key={o.label}
                        type="button"
                        onClick={() => void send(o.value)}
                        className="rounded-full border border-border px-3 py-1 text-[12.5px] hover:border-[#b88a1f]/50 hover:bg-[#b88a1f]/5"
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
                {m.fullPageOnly && (
                  <Link
                    href="/student/tracy"
                    onClick={() => closeAssistantPanel()}
                    className="mt-2 inline-block text-[12.5px] font-medium text-[#b88a1f] hover:underline"
                  >
                    Open in the full chat →
                  </Link>
                )}
              </AssistantMessage>
            ),
          )}
        </div>

        <div className="border-t border-border p-3">
          <UsageRemainingBanner remaining={usageRemaining} />
          <form
            onSubmit={(e) => { e.preventDefault(); void send(input) }}
            className="flex items-end gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:border-[#b88a1f]/50"
          >
            <textarea
              ref={inputRef}
              {...noPasteProps('assistant-panel')}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(input) }
              }}
              rows={1}
              placeholder={`Message ${assistant}…`}
              className="max-h-32 min-h-[24px] flex-1 resize-none bg-transparent text-[14px] outline-none placeholder:text-muted-foreground"
              aria-label={`Message ${assistant}`}
            />
            {streaming ? (
              <button
                type="button"
                onClick={() => tracyStream.stop()}
                className="rounded-lg bg-muted p-1.5 text-foreground"
                aria-label="Stop"
              >
                <Square className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="rounded-lg bg-[#b88a1f] p-1.5 text-white disabled:opacity-40"
                aria-label="Send"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            )}
          </form>
          <p className="mt-1.5 text-center text-[10.5px] text-muted-foreground">
            {assistant} can make mistakes. Always verify with your teacher.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
