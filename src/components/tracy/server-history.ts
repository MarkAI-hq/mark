// Turns the flat assistant_messages rows Tracy persists server-side into
// separate, titled conversations. Shared by every Tracy chat surface
// (student portal, dashboard, guardian) so history behaves the same everywhere.

export interface ServerChatRow {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt?: string
  created_at?: string
}

export interface ServerConversation {
  id: string
  title: string
  lastMessage: string
  createdAt: number
  updatedAt: number
  messages: { id: string; role: 'user' | 'tracy'; content: string; timestamp: Date }[]
}

/** A gap longer than this between messages starts a new conversation. */
const CONVO_GAP_MS = 30 * 60 * 1000
const GREETING_RE = /^(hey|hi|hello|yo|sup|hiya|howdy|good\s+(morning|afternoon|evening))[\s!?.]*$/i

/** Persisted assistant replies carry the UI wire protocol; show them as plain text. */
export function cleanServerReply(content: string): string {
  return content
    .replace(/^[ \t]*__RESULT__[ \t]*:[^\n]*$/gm, '')
    .replace(/__UI__:[\s\S]*$/m, '')
    .replace(/__NEXT__:[\s\S]*$/m, '')
    .split('\n')
    .map((l) => (/^__(ARTIFACT|WIDGET|CONFIRM)__:/.test(l) ? '(interactive content — ask again to regenerate it)' : l))
    .join('\n')
    .trim()
}

/** Unwrap the `{ data }` envelope the fetcher sometimes leaves in place. */
export function toRows(data: ServerChatRow[] | { data: ServerChatRow[] } | null | undefined): ServerChatRow[] {
  if (!data) return []
  const rows = Array.isArray(data) ? data : data.data
  return Array.isArray(rows) ? rows : []
}

export function groupServerConversations(rows: ServerChatRow[]): ServerConversation[] {
  const sorted = rows
    .map((r) => ({ ...r, ts: new Date(r.createdAt ?? r.created_at ?? 0).getTime() }))
    .filter((r) => r.content && !Number.isNaN(r.ts))
    .sort((a, b) => a.ts - b.ts)

  const groups: (typeof sorted)[] = []
  for (const r of sorted) {
    const last = groups.at(-1)
    if (last && r.ts - last[last.length - 1].ts <= CONVO_GAP_MS) last.push(r)
    else groups.push([r])
  }

  return groups.flatMap((g): ServerConversation[] => {
    const users = g.filter((r) => r.role === 'user')
    if (users.length === 0) return []
    const substantive = users.find((r) => !GREETING_RE.test(r.content.trim())) ?? users[0]
    const raw = substantive.content.trim().replace(/\s+/g, ' ')
    const titleText = raw.charAt(0).toUpperCase() + raw.slice(1).replace(/[?!.]+$/, '')
    const lastReply = [...g].reverse().find((r) => r.role === 'assistant')
    const lastText = lastReply ? cleanServerReply(lastReply.content) : ''
    return [{
      id: `srv_${g[0].id}`,
      title: titleText.length > 50 ? titleText.slice(0, 50) + '…' : titleText,
      lastMessage: lastText.length > 80 ? lastText.slice(0, 80) + '…' : lastText,
      createdAt: g[0].ts,
      updatedAt: g[g.length - 1].ts,
      messages: g.map((r) => ({
        id: r.id,
        role: r.role === 'user' ? 'user' : 'tracy',
        content: r.role === 'user' ? r.content : cleanServerReply(r.content),
        timestamp: new Date(r.ts),
      })),
    }]
  })
}
