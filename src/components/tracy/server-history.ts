// Turns the flat assistant_messages rows Tracy persists server-side into
// separate, titled conversations. Shared by every Tracy chat surface
// (student portal, dashboard, guardian) so history behaves the same everywhere.
//
// Saved replies keep Tracy's wire markers (__UI__, __ARTIFACT__, __WIDGET__,
// __NEXT__…), so a chat reopened from History gets its cards back, not just
// the text: parseAssistantReply() mirrors what the live chats do on `done`.

import {
  ARTIFACT_RE, CONFIRM_RE, NEXT_RE, WIDGET_RE, NEXT_RE_IN_WIDGET, extractJson,
  type ConfirmationOption,
} from './tracy-protocol'
import { parseGenerativeUi, stripUiMarker, type GenerativeUi } from './generative-ui-protocol'

export interface ServerChatRow {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt?: string
  created_at?: string
  /** The chat this row belongs to; null on rows saved before chats had ids. */
  conversation_id?: string | null
}

/** A structured result Tracy attached (form, assessment, report…) — teacher chat only. */
export interface RestoredArtifact {
  type: string
  title: string
  summary?: string
  data: unknown
}

export interface ServerMessage {
  id: string
  role: 'user' | 'tracy'
  content: string
  timestamp: Date
  /** The assistant_messages row id — what an edit is sent against. */
  serverId: string
  /** Files named on a user message (the files themselves aren't kept in history). */
  attachments?: { name: string; type: string }[]
  nextOptions?: ConfirmationOption[]
  widgetHtml?: string
  ui?: GenerativeUi
  artifact?: RestoredArtifact
}

export interface ServerConversation {
  /** The conversation key — reuse it as the chat sessionId to keep writing to this chat. */
  id: string
  title: string
  lastMessage: string
  createdAt: number
  updatedAt: number
  messages: ServerMessage[]
}

/** A gap longer than this between messages starts a new conversation (legacy rows only). */
const CONVO_GAP_MS = 30 * 60 * 1000 // must match mark-api assistant-messages.service.ts
const GREETING_RE = /^(hey|hi|hello|yo|sup|hiya|howdy|good\s+(morning|afternoon|evening))[\s!?.]*$/i
const BARE_MARKER_RE = /(?:^|\n)\s*(?:__)?(?:NEXT|CONFIRM|ARTIFACT|WIDGET|UI)(?:__)?\s*:\s*$/
const RESULT_LINE_RE = /^[ \t]*__RESULT__[ \t]*:[^\n]*$/gm

function tryJson(json: string | null): any {
  if (!json) return null
  try { return JSON.parse(json) } catch { return null }
}

function toOptions(raw: unknown): ConfirmationOption[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const opts = raw
    .filter((o: any) => o && typeof o.label === 'string')
    .slice(0, 8)
    .map((o: any) => ({ label: o.label, value: typeof o.value === 'string' && o.value.trim() ? o.value : o.label }))
  return opts.length ? opts : undefined
}

export interface ParsedAssistantReply {
  content: string
  nextOptions?: ConfirmationOption[]
  widgetHtml?: string
  ui?: GenerativeUi
  artifact?: RestoredArtifact
}

/** A saved Tracy reply → the text plus whatever card it carried. */
export function parseAssistantReply(raw: string): ParsedAssistantReply {
  const reply = raw.replace(RESULT_LINE_RE, '').trim()

  const ui = parseGenerativeUi(reply)
  if (ui) return { content: ui.text, ui: ui.ui }
  const text = stripUiMarker(reply)

  const confirm = text.match(CONFIRM_RE)
  if (confirm) {
    // Confirmation prompts are one-shot ("are you sure?") — keep the lead-in only.
    const before = text.slice(0, text.search(CONFIRM_RE)).trim()
    return { content: before || tryJson(extractJson(confirm[1]))?.message || '' }
  }

  const art = text.match(ARTIFACT_RE)
  if (art) {
    const parsed = tryJson(extractJson(art[1]))
    const before = text.slice(0, Math.max(text.search(ARTIFACT_RE), 0)).trim()
    if (parsed && typeof parsed === 'object') {
      const type = typeof parsed.type === 'string' ? parsed.type : 'generic'
      return {
        content: before || parsed.summary || `Here's the ${type.replace('_', ' ')} — click to view.`,
        artifact: { type, title: parsed.title ?? 'Result', summary: parsed.summary, data: parsed.data },
      }
    }
    return { content: before }
  }

  const widget = text.match(WIDGET_RE)
  if (widget) {
    const before = text.slice(0, Math.max(text.search(WIDGET_RE), 0)).trim()
    let html = widget[1]
    let nextOptions: ConfirmationOption[] | undefined
    const nextIn = html.match(NEXT_RE_IN_WIDGET)
    if (nextIn) {
      html = html.slice(0, html.search(NEXT_RE_IN_WIDGET)).trim()
      nextOptions = toOptions(tryJson(extractJson(nextIn[1]))?.options)
    }
    return { content: before, widgetHtml: html, nextOptions }
  }

  const next = text.match(NEXT_RE)
  if (next) {
    const parsed = tryJson(extractJson(next[1]))
    const before = text.slice(0, text.search(NEXT_RE)).trim()
    return {
      content: (before || parsed?.message || '').replace(BARE_MARKER_RE, '').trim(),
      nextOptions: toOptions(parsed?.options),
    }
  }

  return { content: text.replace(BARE_MARKER_RE, '').trim() }
}

/** Persisted assistant replies carry the UI wire protocol; this is the plain-text version. */
export function cleanServerReply(content: string): string {
  const p = parseAssistantReply(content)
  return p.content || p.artifact?.summary || p.artifact?.title || ''
}

/**
 * What the user actually typed. The saved row is the text Tracy received,
 * which can carry study-source notes, inlined CSV data and file labels added
 * by the page or the proxy.
 */
export function cleanUserMessage(content: string): { content: string; attachments?: { name: string; type: string }[] } {
  let text = content
  // Student study sources injected ahead of the message by /api/tracy.
  text = text.replace(/^=== Student Study Sources ===[\s\S]*?\n===\n\n/, '')
  // CSV/XLSX contents the teacher chat inlines.
  text = text.replace(/\n*--- DATA FROM FILE: [^\n]*---\n[\s\S]*?\n-----------------/g, '')
  text = text.replace(/\n*\[ATTACHED FILES: [^\]]*\]/g, '')
  text = text.replace(/\n*\[Attached files: [^\]]*\]/g, '')
  const names: string[] = []
  text = text.replace(/\n*\[Attached: ([^\]]*)\]/g, (_m, list: string) => {
    names.push(...list.split(',').map((s) => s.trim()).filter(Boolean))
    return ''
  })
  return {
    content: text.trim(),
    attachments: names.length ? names.map((name) => ({ name, type: '' })) : undefined,
  }
}

/** Unwrap the `{ data }` envelope the fetcher sometimes leaves in place. */
export function toRows(data: ServerChatRow[] | { data: ServerChatRow[] } | null | undefined): ServerChatRow[] {
  if (!data) return []
  const rows = Array.isArray(data) ? data : data.data
  return Array.isArray(rows) ? rows : []
}

type TimedRow = ServerChatRow & { ts: number }

/** Oldest first; a user turn sorts before the reply saved in the same insert. */
function chronological(a: TimedRow, b: TimedRow): number {
  return a.ts - b.ts || (a.role === b.role ? 0 : a.role === 'user' ? -1 : 1)
}

/**
 * Same rule as mark-api's conversationKeys(): rows with a conversation_id
 * use it; older rows are chained by a 30-minute gap and keyed
 * `srv_<first row id>`, the key a restored legacy chat keeps writing under.
 */
function groupByConversation(rows: TimedRow[]): TimedRow[][] {
  const groups = new Map<string, TimedRow[]>()
  let legacyKey = ''
  let lastLegacyTs = -Infinity
  for (const r of rows) {
    let key: string
    if (r.conversation_id) key = r.conversation_id
    else {
      if (!legacyKey || r.ts - lastLegacyTs > CONVO_GAP_MS) legacyKey = `srv_${r.id}`
      lastLegacyTs = r.ts
      key = legacyKey
    }
    const g = groups.get(key)
    if (g) g.push(r)
    else groups.set(key, [r])
  }
  return [...groups.entries()].map(([key, g]) => Object.assign(g, { key }))
}

export function groupServerConversations(rows: ServerChatRow[]): ServerConversation[] {
  const sorted = rows
    .map((r) => ({ ...r, ts: new Date(r.createdAt ?? r.created_at ?? 0).getTime() }))
    .filter((r) => r.content && !Number.isNaN(r.ts))
    .sort(chronological)

  return groupByConversation(sorted).flatMap((g): ServerConversation[] => {
    const key = (g as TimedRow[] & { key: string }).key
    const messages: ServerMessage[] = g.map((r) => {
      if (r.role === 'user') {
        const u = cleanUserMessage(r.content)
        return { id: r.id, serverId: r.id, role: 'user', content: u.content, attachments: u.attachments, timestamp: new Date(r.ts) }
      }
      const p = parseAssistantReply(r.content)
      return { id: r.id, serverId: r.id, role: 'tracy', timestamp: new Date(r.ts), ...p }
    })

    const users = messages.filter((m) => m.role === 'user')
    if (users.length === 0) return []
    const substantive = users.find((m) => m.content && !GREETING_RE.test(m.content.trim())) ?? users[0]
    const raw = (substantive.content || substantive.attachments?.map((a) => a.name).join(', ') || 'Chat').trim().replace(/\s+/g, ' ')
    const titleText = raw.charAt(0).toUpperCase() + raw.slice(1).replace(/[?!.]+$/, '')
    const lastReply = [...messages].reverse().find((m) => m.role === 'tracy')
    const lastText = lastReply ? (lastReply.content || lastReply.artifact?.title || '') : ''
    return [{
      id: key,
      title: titleText.length > 50 ? titleText.slice(0, 50) + '…' : titleText,
      lastMessage: lastText.length > 80 ? lastText.slice(0, 80) + '…' : lastText,
      createdAt: g[0].ts,
      updatedAt: g[g.length - 1].ts,
      messages,
    }]
  })
}
