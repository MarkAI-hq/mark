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
//
// Like the other two chats it has History (past chats, rebuilt from what
// Tracy saved server-side) and lets the guardian edit a message they sent.

import { useEffect, useRef, useState } from 'react'
import { History, MessageSquarePlus, Send, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { TypingDots } from '@/components/tracy/typing-dots'
import { UsageRemainingBanner } from '@/components/tracy/usage-remaining-banner'
import {
  ARTIFACT_RE, CONFIRM_RE, NEXT_RE, extractJson,
  type TracySseEvent,
} from '@/components/tracy/tracy-protocol'
import { useTracyChatStream } from '@/hooks/use-tracy-chat-stream'
import {
  useChatAttachments, AttachButton, PendingAttachmentChips, SentAttachmentChips, type SentAttachment,
} from '@/components/tracy/chat-attachment-picker'
import type { TracyAttachmentRef } from '@/components/tracy/chat-attachments'
import { EditMessageButton, UserMessageEditor } from '@/components/tracy/edit-user-message'
import { groupServerConversations, toRows, type ServerConversation } from '@/components/tracy/server-history'
import { getTracyChatHistory } from '@/lib/actions/assistant-history'
import { toast } from 'sonner'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  isLoading?: boolean
  /** Report cards, letters etc. the guardian sent with this message. */
  attachments?: SentAttachment[]
  /** The uploaded files themselves, kept so an edit can re-send them. */
  attachmentRefs?: TracyAttachmentRef[]
  /** assistant_messages row id, once Tracy has saved this turn — needed to edit it. */
  serverId?: string
}

const BARE_MARKER_RE = /(?:^|\n)\s*(?:__)?(?:NEXT|CONFIRM|ARTIFACT)(?:__)?\s*:\s*$/

const STARTER_PROMPTS = [
  "How's my child doing overall?",
  'How has attendance been recently?',
  'What topics has my child mastered?',
]

function relativeTime(ms: number): string {
  const diff = Date.now() - ms
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  if (d === 1) return 'Yesterday'
  if (d < 7) return `${d}d ago`
  return new Date(ms).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function GuardianTracyClient({ guardianName }: { guardianName: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [usageRemaining, setUsageRemaining] = useState<number | null>(null)
  const [nextSuggestion, setNextSuggestion] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [pastChats, setPastChats] = useState<ServerConversation[]>([])

  const sessionIdRef = useRef<string>(crypto.randomUUID())
  const tracyStream = useTracyChatStream()
  const attach = useChatAttachments()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function refreshPastChats() {
    getTracyChatHistory().then(({ data }) => {
      setPastChats(groupServerConversations(toRows(data)).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 30))
    }).catch(() => { /* offline — the current chat still works */ })
  }

  useEffect(() => { refreshPastChats() }, [])

  async function send(text: string, edit?: { messageId: string; refs?: TracyAttachmentRef[]; sent?: SentAttachment[] }) {
    const trimmed = text.trim()
    if (streaming) return
    // An edit re-asks with the edited text and the original's files; anything
    // attached in the composer is left for the next message.
    if (!edit) {
      if (!trimmed && !attach.ready) return
      if (attach.uploading) { toast('Hang on, your file is still uploading…'); return }
    } else if (!trimmed) return
    const { refs: attachmentRefs, sent: sentFiles } = edit
      ? { refs: edit.refs ?? [], sent: edit.sent ?? [] }
      : attach.take()

    const userId = crypto.randomUUID()
    const replyId = crypto.randomUUID()
    setNextSuggestion(null)
    if (!edit) setInput('')
    setStreaming(true)
    setMessages((prev) => [
      ...prev,
      {
        id: userId, role: 'user', content: trimmed,
        attachments: sentFiles.length ? sentFiles : undefined,
        attachmentRefs: attachmentRefs.length ? attachmentRefs : undefined,
      },
      { id: replyId, role: 'assistant', content: '', isLoading: true },
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
          const ids = ev.messageIds as { user?: string; assistant?: string } | undefined
          if (ids?.user || ids?.assistant) {
            setMessages((p) => p.map((m) =>
              m.id === userId ? { ...m, serverId: ids.user ?? m.serverId }
              : m.id === replyId ? { ...m, serverId: ids.assistant ?? m.serverId }
              : m))
          }

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
      await tracyStream.stream({
        message: trimmed,
        sessionId: sessionIdRef.current,
        ...(attachmentRefs.length ? { attachments: attachmentRefs } : {}),
        ...(edit ? { editMessageId: edit.messageId } : {}),
      }, onEvent)
    } catch {
      setMessages((p) =>
        p.map((m) => (m.isLoading ? { ...m, content: 'Sorry, I had trouble responding. Please try again.', isLoading: false } : m)),
      )
    } finally {
      setStreaming(false)
    }
  }

  // Edit a sent message: drop it and everything after it, then ask again.
  // Tracy deletes the same turns server-side (editMessageId), so History matches.
  function editMessage(messageId: string, text: string) {
    if (streaming) return
    const idx = messages.findIndex((m) => m.id === messageId)
    const original = messages[idx]
    setEditingId(null)
    if (idx < 0 || !original?.serverId) return
    setMessages((prev) => {
      const at = prev.findIndex((m) => m.id === messageId)
      return at < 0 ? prev : prev.slice(0, at)
    })
    void send(text, {
      messageId: original.serverId,
      refs: original.attachmentRefs,
      sent: original.attachmentRefs?.length ? original.attachments : undefined,
    })
  }

  function openPastChat(convo: ServerConversation) {
    tracyStream.stop()
    // Keep writing to this same chat, so it stays one entry in History.
    sessionIdRef.current = convo.id
    setMessages(convo.messages.map((m) => ({
      id: m.id,
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
      attachments: m.attachments,
      serverId: m.serverId,
    })))
    const last = convo.messages.at(-1)
    setNextSuggestion(last?.role === 'tracy' ? last.nextOptions?.[0]?.value ?? null : null)
    setEditingId(null)
    setStreaming(false)
    setInput('')
    setHistoryOpen(false)
  }

  function newChat() {
    tracyStream.stop()
    sessionIdRef.current = crypto.randomUUID()
    setMessages([])
    setNextSuggestion(null)
    setEditingId(null)
    setStreaming(false)
    setInput('')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-end gap-1 border-b pb-2">
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={newChat} className="gap-1.5 text-muted-foreground">
            <MessageSquarePlus className="h-4 w-4" /> New chat
          </Button>
        )}
        <Button
          variant="ghost" size="sm" className="gap-1.5 text-muted-foreground"
          onClick={() => { refreshPastChats(); setHistoryOpen(true) }}
        >
          <History className="h-4 w-4" /> History
        </Button>
      </div>

      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="right" className="w-full sm:max-w-sm overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Past chats</SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex flex-col gap-1 px-1">
            {pastChats.length === 0 && (
              <p className="px-3 text-sm text-muted-foreground">Your chats with Tracy will show up here.</p>
            )}
            {pastChats.map((c) => (
              <button
                key={c.id}
                onClick={() => openPastChat(c)}
                className={`rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted ${c.id === sessionIdRef.current ? 'bg-muted' : ''}`}
              >
                <p className="truncate text-sm font-medium">{c.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {relativeTime(c.updatedAt)}{c.lastMessage ? ` · ${c.lastMessage}` : ''}
                </p>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

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

        {messages.map((m) => {
          if (m.role === 'user' && editingId === m.id) {
            return (
              <UserMessageEditor
                key={m.id}
                initial={m.content}
                hasAttachments={m.attachments?.length ? (m.attachmentRefs?.length ? 'kept' : 'dropped') : undefined}
                onCancel={() => setEditingId(null)}
                onSave={(text) => editMessage(m.id, text)}
              />
            )
          }
          return (
            <div key={m.id} className={m.role === 'user' ? 'group flex flex-col items-end' : 'flex justify-start'}>
              <div
                className={
                  m.role === 'user'
                    ? 'max-w-[85%] rounded-2xl bg-gold text-gold-foreground px-4 py-2.5 text-sm whitespace-pre-wrap'
                    : 'max-w-[85%] rounded-2xl bg-muted px-4 py-2.5 text-sm whitespace-pre-wrap'
                }
              >
                {m.role === 'user' && <SentAttachmentChips files={m.attachments} />}
                {m.isLoading && !m.content ? <TypingDots /> : m.content}
              </div>
              {m.role === 'user' && m.serverId && (
                <div className="mt-1 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity">
                  <EditMessageButton onClick={() => setEditingId(m.id)} disabled={streaming} />
                </div>
              )}
            </div>
          )
        })}

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

      <div className="border-t pt-3">
      <PendingAttachmentChips files={attach.files} onRemove={attach.remove} />
      <div className="flex items-end gap-2">
        <AttachButton onFiles={attach.add} disabled={streaming} className="h-[44px]" />
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send(input)
            }
          }}
          placeholder="Ask about your child's progress, or attach a report card…"
          className="min-h-[44px] max-h-32 resize-none"
          disabled={streaming}
        />
        <Button size="icon" onClick={() => send(input)} disabled={streaming || attach.uploading || (!input.trim() && !attach.ready)}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
      </div>
    </div>
  )
}
