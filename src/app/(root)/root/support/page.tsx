'use client'

import { useState, useTransition } from 'react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { Inbox, CheckCheck, MailOpen, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  getSupportMessages,
  markSupportMessageRead,
  markSupportMessageResolved,
  type SupportMessage,
} from '@/lib/actions/root'

function statusBadge(status: SupportMessage['status']) {
  if (status === 'new')      return <Badge className="text-xs bg-amber-500/15 text-amber-400 border-amber-500/20">New</Badge>
  if (status === 'read')     return <Badge className="text-xs bg-blue-500/15 text-blue-400 border-blue-500/20">Read</Badge>
  if (status === 'resolved') return <Badge className="text-xs bg-emerald-500/15 text-emerald-400 border-emerald-500/20">Resolved</Badge>
}

function MessageRow({
  msg,
  onRead,
  onResolved,
}: {
  msg: SupportMessage
  onRead: (id: string) => void
  onResolved: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [isPending, startT] = useTransition()

  return (
    <div
      className="rounded-xl border p-4 space-y-2 cursor-pointer hover:opacity-90 transition-opacity"
      style={{
        background: msg.status === 'new' ? 'rgba(201,168,76,0.04)' : 'rgba(255,255,255,0.02)',
        borderColor: msg.status === 'new' ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.07)',
      }}
      onClick={() => setExpanded(e => !e)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {statusBadge(msg.status)}
            <span className="text-xs font-semibold" style={{ color: '#c9a84c' }}>{msg.topic}</span>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {formatDistanceToNow(parseISO(msg.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm font-medium text-white mt-1 truncate">{msg.name}</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{msg.email}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
          {msg.status === 'new' && (
            <Button
              size="sm"
              variant="ghost"
              disabled={isPending}
              className="h-7 px-2 text-xs"
              style={{ color: 'rgba(255,255,255,0.5)' }}
              onClick={() => { startT(async () => { await markSupportMessageRead(msg.id); onRead(msg.id) }) }}
            >
              <MailOpen className="h-3.5 w-3.5 mr-1" />
              Mark read
            </Button>
          )}
          {msg.status !== 'resolved' && (
            <Button
              size="sm"
              variant="ghost"
              disabled={isPending}
              className="h-7 px-2 text-xs"
              style={{ color: 'rgba(255,255,255,0.5)' }}
              onClick={() => { startT(async () => { await markSupportMessageResolved(msg.id); onResolved(msg.id) }) }}
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Resolve
            </Button>
          )}
        </div>
      </div>
      {expanded && (
        <p
          className="text-sm leading-relaxed mt-2 pt-2 border-t whitespace-pre-wrap"
          style={{ color: 'rgba(255,255,255,0.65)', borderColor: 'rgba(255,255,255,0.07)' }}
        >
          {msg.message}
        </p>
      )}
    </div>
  )
}

type Filter = 'all' | 'new' | 'read' | 'resolved'

export default function SupportInboxPage() {
  const [messages,  setMessages]  = useState<SupportMessage[] | null>(null)
  const [filter,    setFilter]    = useState<Filter>('all')
  const [loaded,    setLoaded]    = useState(false)
  const [isPending, startT]       = useTransition()

  function load(f: Filter = filter) {
    startT(async () => {
      const res = await getSupportMessages(f === 'all' ? undefined : f)
      if (res.error) { toast.error(res.error.message); return }
      setMessages(res.data ?? [])
      setLoaded(true)
    })
  }

  if (!loaded && !isPending) load()

  function handleRead(id: string) {
    setMessages(prev => prev?.map(m => m.id === id ? { ...m, status: 'read' } : m) ?? null)
  }
  function handleResolved(id: string) {
    setMessages(prev => prev?.map(m => m.id === id ? { ...m, status: 'resolved' } : m) ?? null)
  }

  const filtered = filter === 'all' ? (messages ?? []) : (messages ?? []).filter(m => m.status === filter)
  const newCount = (messages ?? []).filter(m => m.status === 'new').length

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all',      label: 'All' },
    { key: 'new',      label: 'New' },
    { key: 'read',     label: 'Read' },
    { key: 'resolved', label: 'Resolved' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Inbox className="h-6 w-6" style={{ color: '#c9a84c' }} />
            Support Inbox
            {newCount > 0 && (
              <span
                className="ml-1 text-sm font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c' }}
              >
                {newCount} new
              </span>
            )}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Messages submitted via the Help Centre contact form
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => load()}
          disabled={isPending}
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          {isPending ? 'Loading…' : 'Refresh'}
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: filter === f.key ? 'rgba(201,168,76,0.12)' : 'transparent',
              color:       filter === f.key ? '#c9a84c' : 'rgba(255,255,255,0.4)',
              border:      filter === f.key ? '1px solid rgba(201,168,76,0.25)' : '1px solid transparent',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Message list */}
      {isPending && !loaded ? (
        <div className="py-16 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
          <Clock className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Loading messages…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
          <AlertCircle className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No {filter === 'all' ? '' : filter} messages</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(msg => (
            <MessageRow
              key={msg.id}
              msg={msg}
              onRead={handleRead}
              onResolved={handleResolved}
            />
          ))}
        </div>
      )}
    </div>
  )
}
