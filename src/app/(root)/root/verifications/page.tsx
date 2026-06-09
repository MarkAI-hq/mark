'use client'

import { useState, useTransition, useEffect } from 'react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { ShieldCheck, ShieldX, ShieldAlert, Clock, ExternalLink, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  listVerifications,
  reviewVerification,
  type SchoolVerificationWithOrg,
} from '@/lib/actions/school-verification'

// ── Status helpers ────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: SchoolVerificationWithOrg['status'] }) {
  const map = {
    pending:   { bg: 'rgba(234,179,8,0.12)',  color: '#facc15', label: 'Pending'    },
    approved:  { bg: 'rgba(34,197,94,0.12)',  color: '#4ade80', label: 'Approved'   },
    rejected:  { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', label: 'Rejected'   },
    more_info: { bg: 'rgba(249,115,22,0.12)', color: '#fb923c', label: 'More Info'  },
  }
  const s = map[status] ?? map.pending
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  )
}

// ── Row component ─────────────────────────────────────────────────────────────

function VerificationRow({
  row,
  onDecision,
}: {
  row: SchoolVerificationWithOrg
  onDecision: (id: string, decision: 'approved' | 'rejected' | 'more_info', notes?: string) => void
}) {
  const [expanded, setExpanded]   = useState(false)
  const [notes, setNotes]         = useState('')
  const [isPending, startT]       = useTransition()

  function decide(decision: 'approved' | 'rejected' | 'more_info') {
    startT(async () => {
      onDecision(row.id, decision, notes || undefined)
    })
  }

  return (
    <div
      className="rounded-xl border transition-all"
      style={{
        background:   row.status === 'pending' ? 'rgba(234,179,8,0.03)' : 'rgba(255,255,255,0.02)',
        borderColor:  row.status === 'pending' ? 'rgba(234,179,8,0.2)' : 'rgba(255,255,255,0.07)',
      }}
    >
      {/* Summary row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto_auto_auto] items-center gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{row.org_name}</p>
            <p className="text-xs font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {row.school_code ?? 'no code'} · {formatDistanceToNow(parseISO(row.createdAt), { addSuffix: true })}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            <FileText className="h-3.5 w-3.5" />
            {(row.documents_url ?? []).length} doc{(row.documents_url ?? []).length !== 1 ? 's' : ''}
          </div>
          <StatusPill status={row.status} />
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {/* Documents */}
          {(row.documents_url ?? []).length > 0 && (
            <div className="pt-3 space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Documents
              </p>
              {(row.documents_url ?? []).map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs py-1.5 px-2.5 rounded-lg transition-colors"
                  style={{ color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.04)' }}
                  onClick={e => e.stopPropagation()}
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1 truncate">{url}</span>
                  <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                </a>
              ))}
            </div>
          )}

          {/* Existing notes from previous review */}
          {row.notes && (
            <div className="pt-1 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Previous notes
              </p>
              <p className="text-xs rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.55)' }}>
                {row.notes}
              </p>
            </div>
          )}

          {/* Decision area — only show if not already approved */}
          {row.status !== 'approved' && (
            <div className="pt-1 space-y-2" onClick={e => e.stopPropagation()}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Decision notes (optional)
              </p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add context for the school if requesting more info or rejecting…"
                rows={2}
                className="w-full text-sm rounded-lg px-3 py-2 resize-none focus:outline-none"
                style={{
                  background:   'rgba(255,255,255,0.05)',
                  border:       '1px solid rgba(255,255,255,0.1)',
                  color:        'rgba(255,255,255,0.8)',
                }}
              />
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  disabled={isPending}
                  onClick={() => decide('approved')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                  style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }}
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> Approve
                </button>
                <button
                  disabled={isPending}
                  onClick={() => decide('more_info')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                  style={{ background: 'rgba(249,115,22,0.15)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.25)' }}
                >
                  <ShieldAlert className="h-3.5 w-3.5" /> Request Info
                </button>
                <button
                  disabled={isPending}
                  onClick={() => decide('rejected')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}
                >
                  <ShieldX className="h-3.5 w-3.5" /> Reject
                </button>
              </div>
            </div>
          )}

          {row.status === 'approved' && (
            <p className="text-xs" style={{ color: 'rgba(34,197,94,0.6)' }}>
              Approved · no further action required
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Page component ────────────────────────────────────────────────────────────

type Filter = 'all' | 'pending' | 'approved' | 'rejected' | 'more_info'

export default function VerificationsPage() {
  const [rows, setRows]       = useState<SchoolVerificationWithOrg[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState<Filter>('pending')

  useEffect(() => {
    listVerifications().then(({ data, error }) => {
      if (error) toast.error(error.message)
      else setRows(data ?? [])
      setLoading(false)
    })
  }, [])

  async function handleDecision(id: string, decision: 'approved' | 'rejected' | 'more_info', notes?: string) {
    const { data, error } = await reviewVerification(id, decision, notes)
    if (error) { toast.error(error.message); return }
    toast.success(`Verification ${decision === 'approved' ? 'approved' : decision === 'rejected' ? 'rejected' : 'flagged for more info'}.`)
    setRows(prev => prev.map(r => r.id === id ? { ...r, status: data!.status, notes: data!.notes ?? r.notes, reviewed_at: data!.reviewed_at ?? r.reviewed_at } : r))
  }

  const filtered = filter === 'all' ? rows : rows.filter(r => r.status === filter)

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'pending',   label: `Pending (${rows.filter(r => r.status === 'pending').length})`   },
    { key: 'more_info', label: `More Info (${rows.filter(r => r.status === 'more_info').length})` },
    { key: 'approved',  label: `Approved (${rows.filter(r => r.status === 'approved').length})` },
    { key: 'rejected',  label: `Rejected (${rows.filter(r => r.status === 'rejected').length})` },
    { key: 'all',       label: `All (${rows.length})`                                           },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">School Verifications</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Review and action school accreditation requests
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: filter === f.key ? 'rgba(255,255,255,0.1)' : 'transparent',
              color:      filter === f.key ? 'white' : 'rgba(255,255,255,0.4)',
              border:     filter === f.key ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="py-12 text-center text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
          <Clock className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No {filter === 'all' ? '' : filter} verifications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(row => (
            <VerificationRow key={row.id} row={row} onDecision={handleDecision} />
          ))}
        </div>
      )}
    </div>
  )
}
