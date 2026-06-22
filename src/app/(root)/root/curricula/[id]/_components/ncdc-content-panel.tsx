'use client'

import { useEffect, useState, useTransition } from 'react'
import { BookOpen, RefreshCw, Layers, Clock, FileText, GitMerge } from 'lucide-react'
import { getCorpusPreview, enrichFromCorpus, enrichFromRelated } from '@/lib/actions/root'
import type { CorpusPreview, CorpusTopicPreview } from '@/lib/actions/root'

const BLOOM_COLORS: Record<string, string> = {
  remember:  '#6b7280',
  understand:'#3b82f6',
  apply:     '#10b981',
  analyse:   '#f59e0b',
  evaluate:  '#ef4444',
  create:    '#8b5cf6',
}

function BloomBar({ counts }: { counts: Record<string, number> }) {
  const total = Object.values(counts).reduce((s, v) => s + v, 0)
  if (total === 0) return null
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden gap-px" style={{ minWidth: 60 }}>
      {Object.entries(counts).map(([level, count]) => (
        <div
          key={level}
          title={`${level}: ${Math.round((count / total) * 100)}%`}
          style={{ width: `${(count / total) * 100}%`, background: BLOOM_COLORS[level] ?? '#6b7280' }}
        />
      ))}
    </div>
  )
}

function TopicRow({ topic }: { topic: CorpusTopicPreview }) {
  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <td className="py-3 pr-4">
        <div className="text-sm font-medium text-white">{topic.topic_name}</div>
        {topic.topic_id && (
          <div className="text-xs font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {topic.topic_id}
          </div>
        )}
      </td>
      <td className="py-3 pr-4 text-center">
        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{topic.chunk_count}</span>
      </td>
      <td className="py-3 pr-4">
        <div className="flex flex-wrap gap-1">
          {topic.class_levels.map(cl => (
            <span
              key={cl}
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(201,168,76,0.12)', color: '#c9a84c' }}
            >
              {cl}
            </span>
          ))}
        </div>
      </td>
      <td className="py-3 pr-4 text-center">
        {topic.periods ? (
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{topic.periods}</span>
        ) : (
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
        )}
      </td>
      <td className="py-3 pr-4 text-center">
        {topic.page_ref ? (
          <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>p.{topic.page_ref}</span>
        ) : (
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
        )}
      </td>
      <td className="py-3">
        <BloomBar counts={topic.bloom_counts} />
      </td>
    </tr>
  )
}

export function NccdContentPanel({
  schemaId,
  onEnriched,
}: {
  schemaId:   string
  onEnriched: (newTopicCount: number) => void
}) {
  const [preview, setPreview]   = useState<CorpusPreview | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(true)
  const [isPending, startTransition] = useTransition()
  const [toast, setToast]       = useState<string | null>(null)

  useEffect(() => {
    getCorpusPreview(schemaId).then(res => {
      if (res.error) setError(res.error.message)
      else setPreview(res.data ?? null)
      setLoading(false)
    })
  }, [schemaId])

  function handleEnrich() {
    startTransition(async () => {
      const res = await enrichFromCorpus(schemaId)
      if (res.error) {
        setToast(`Error: ${res.error.message}`)
      } else if (res.data) {
        const { topicsAdded, outcomesAdded } = res.data
        setToast(`Synced: ${topicsAdded} topics · ${outcomesAdded} outcomes`)
        onEnriched(topicsAdded)
      }
      setTimeout(() => setToast(null), 5000)
    })
  }

  function handleMergeRelated() {
    startTransition(async () => {
      const res = await enrichFromRelated(schemaId)
      if (res.error) {
        setToast(`Error: ${res.error.message}`)
      } else if (res.data) {
        const { topicsAdded, outcomesAdded } = res.data
        setToast(`Merged: ${topicsAdded} topics · ${outcomesAdded} outcomes from related schemas`)
        onEnriched(topicsAdded)
      }
      setTimeout(() => setToast(null), 5000)
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-5 w-5 animate-spin rounded-full" style={{ border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'rgba(255,255,255,0.5)' }} />
      </div>
    )
  }

  if (error || !preview) {
    return (
      <div className="rounded-xl p-6 text-center space-y-4" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {error ?? 'No corpus data found for this schema.'}
        </p>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Merge topics from other enriched schemas of the same subject instead.
        </p>
        <button
          onClick={handleMergeRelated}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50"
          style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)' }}
        >
          <GitMerge className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
          {isPending ? 'Merging…' : 'Merge from Related Schemas'}
        </button>
        {toast && (
          <div className="rounded-lg px-4 py-2.5 text-sm" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
            {toast}
          </div>
        )}
      </div>
    )
  }

  const totalPeriods = preview.topics.reduce((s, t) => s + (t.periods ?? 0), 0)
  const classLevels  = [...new Set(preview.topics.flatMap(t => t.class_levels))].sort()

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div
        className="rounded-xl p-4 flex flex-wrap items-center gap-6"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
          <span className="text-sm font-medium text-white">{preview.subject}</span>
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
            {(preview.curriculum_level ?? '').toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
          <Layers className="h-3.5 w-3.5" />
          <span className="text-sm">{preview.total_chunks} chunks · {preview.topics.length} topics</span>
        </div>
        <div className="flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
          <Clock className="h-3.5 w-3.5" />
          <span className="text-sm">{totalPeriods > 0 ? `${totalPeriods} periods` : 'periods not set'}</span>
        </div>
        <div className="flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
          <FileText className="h-3.5 w-3.5" />
          <span className="text-sm">{classLevels.join(', ') || 'class not tagged'}</span>
        </div>
        <div className="ml-auto">
          <button
            onClick={handleEnrich}
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50"
            style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.25)' }}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
            {isPending ? 'Syncing…' : 'Sync Schema from NCDC Corpus'}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="rounded-lg px-4 py-2.5 text-sm"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}
        >
          {toast}
        </div>
      )}

      {/* Topic table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <th className="py-2.5 px-4 text-left text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Topic</th>
              <th className="py-2.5 px-4 text-center text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Chunks</th>
              <th className="py-2.5 px-4 text-left text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Classes</th>
              <th className="py-2.5 px-4 text-center text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Periods</th>
              <th className="py-2.5 px-4 text-center text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Page</th>
              <th className="py-2.5 px-4 text-left text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Bloom</th>
            </tr>
          </thead>
          <tbody className="px-4">
            {preview.topics.map((topic, i) => (
              <TopicRow key={topic.topic_id ?? i} topic={topic} />
            ))}
          </tbody>
        </table>
        {preview.topics.length === 0 && (
          <div className="py-8 text-center text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
            No topics found in corpus for this subject.
          </div>
        )}
      </div>

      {/* Bloom legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(BLOOM_COLORS).map(([level, color]) => (
          <div key={level} className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ background: color }} />
            <span className="text-xs capitalize" style={{ color: 'rgba(255,255,255,0.4)' }}>{level}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
