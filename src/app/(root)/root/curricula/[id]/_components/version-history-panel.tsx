'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { History, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { restoreCurriculumVersion } from '@/lib/actions/root'
import type { CurriculumSchemaVersion } from '@/lib/actions/root'

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  create:      { label: 'Create',      color: '#60a5fa' },
  manual_edit: { label: 'Manual edit', color: '#c9a84c' },
  ai_fill:     { label: 'AI fill',     color: '#a78bfa' },
  file_reload: { label: 'File reload', color: '#4ade80' },
}

export function VersionHistoryPanel({
  schemaId,
  versions,
}: {
  schemaId: string
  versions: CurriculumSchemaVersion[]
}) {
  const router = useRouter()

  if (versions.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-white">Version History</h2>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Every save creates a snapshot here. Restore any version to roll back.
          </p>
        </div>
        <div
          className="rounded-xl p-8 text-center"
          style={{ border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <History className="h-6 w-6 mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.2)' }} />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>No versions yet</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Save the schema to create the first snapshot
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h2 className="text-sm font-semibold text-white">Version History</h2>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {versions.length} snapshot{versions.length !== 1 ? 's' : ''} — most recent first.
          Restoring creates a new snapshot of the current state before rolling back.
        </p>
      </div>

      <div className="space-y-2">
        {versions.map(v => (
          <VersionRow
            key={v.id}
            version={v}
            schemaId={schemaId}
            onRestored={() => router.refresh()}
          />
        ))}
      </div>
    </div>
  )
}

function VersionRow({
  version,
  schemaId,
  onRestored,
}: {
  version:    CurriculumSchemaVersion
  schemaId:   string
  onRestored: () => void
}) {
  const [open, setOpen]     = useState(false)
  const [pending, start]    = useTransition()
  const [confirming, setConfirming] = useState(false)

  const src    = SOURCE_LABELS[version.source] ?? { label: version.source, color: 'rgba(255,255,255,0.4)' }
  const date   = new Date(version.created_at).toLocaleString()

  const handleRestore = () => {
    if (!confirming) { setConfirming(true); return }
    start(async () => {
      const { data, error } = await restoreCurriculumVersion(schemaId, version.id)
      if (error) {
        toast.error('Restore failed', { description: error.message })
        setConfirming(false)
        return
      }
      toast.success(`Restored to version ${data!.restored_from_version}`)
      setConfirming(false)
      onRestored()
    })
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Row header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-mono font-bold shrink-0"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
          >
            v{version.version_num}
          </span>
          <span
            className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium shrink-0"
            style={{ background: `${src.color}18`, color: src.color }}
          >
            {src.label}
          </span>
          <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {version.change_note || <em style={{ color: 'rgba(255,255,255,0.2)' }}>No note</em>}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className="text-xs hidden sm:block" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {date}
          </span>

          {confirming ? (
            <>
              <button
                onClick={handleRestore}
                disabled={pending}
                className="rounded px-2.5 py-1 text-xs font-medium disabled:opacity-40"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}
              >
                {pending ? 'Restoring…' : 'Confirm restore'}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="rounded px-2 py-1 text-xs"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={handleRestore}
              className="flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
            >
              <RotateCcw className="h-3 w-3" />
              Restore
            </button>
          )}

          <button onClick={() => setOpen(v => !v)} className="p-1 rounded hover:bg-white/10">
            {open
              ? <ChevronDown  className="h-3.5 w-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
              : <ChevronRight className="h-3.5 w-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
            }
          </button>
        </div>
      </div>

      {/* Expanded schema preview */}
      {open && (
        <pre
          className="p-4 text-xs font-mono overflow-x-auto"
          style={{ color: 'rgba(255,255,255,0.5)', background: '#0c0c14', maxHeight: 300, borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          {JSON.stringify(version.schema_data, null, 2)}
        </pre>
      )}
    </div>
  )
}
