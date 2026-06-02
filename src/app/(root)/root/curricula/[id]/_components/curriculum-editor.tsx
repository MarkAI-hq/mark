'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AlertTriangle, XCircle } from 'lucide-react'
import { updateCurriculumSchemaWithNote, ValidationViolation } from '@/lib/actions/root'

export function CurriculumEditor({
  schemaId,
  raw,
  onRawChange,
}: {
  schemaId:    string
  raw:         string
  onRawChange: (v: string) => void
}) {
  const router = useRouter()
  const [pending, start]    = useTransition()
  const [parseError, setParseError]   = useState<string | null>(null)
  const [violations, setViolations]   = useState<ValidationViolation[]>([])
  const [showGate, setShowGate]       = useState(false)
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set())
  const [reason, setReason]           = useState('')
  const [changeNote, setChangeNote]   = useState('')

  const errors   = violations.filter(v => v.severity === 'error')
  const warnings = violations.filter(v => v.severity === 'warning')

  const save = (overrideWarnings?: string[]) => {
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(raw)
      setParseError(null)
    } catch {
      setParseError('Invalid JSON — fix before saving.')
      return
    }

    start(async () => {
      const { data, error } = await updateCurriculumSchemaWithNote(
        schemaId,
        parsed,
        changeNote.trim() || undefined,
        overrideWarnings,
        overrideWarnings?.length ? reason : undefined,
        'manual_edit',
      )

      if (error) {
        toast.error('Save failed', { description: error.message })
        return
      }

      setViolations(data?.violations ?? [])

      if (data?.saved) {
        toast.success('Schema saved')
        setShowGate(false)
        setChangeNote('')
        router.refresh()
      } else {
        const hasErrors = (data?.violations ?? []).some(v => v.severity === 'error')
        if (hasErrors) {
          toast.error('Schema has errors — fix them before saving')
        } else {
          setShowGate(true)
        }
      }
    })
  }

  const saveWithOverrides = () => save(warnings.map(w => w.id))

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* JSON Editor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>Raw Schema</h2>
          {parseError && (
            <span className="text-xs" style={{ color: '#f87171' }}>{parseError}</span>
          )}
        </div>
        <textarea
          rows={30}
          spellCheck={false}
          className="w-full rounded-xl p-4 font-mono text-xs text-white outline-none resize-y"
          style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.07)' }}
          value={raw}
          onChange={e => { onRawChange(e.target.value); setViolations([]); setShowGate(false) }}
        />

        {/* Change note */}
        <div className="space-y-1">
          <label className="block text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Change note <span style={{ color: 'rgba(255,255,255,0.2)' }}>(optional)</span>
          </label>
          <input
            type="text"
            value={changeNote}
            onChange={e => setChangeNote(e.target.value)}
            placeholder="Brief description of what you changed"
            className="w-full rounded-lg px-3 py-2 text-xs text-white outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
        </div>

        <button
          onClick={() => save()}
          disabled={pending}
          className="w-full rounded-lg py-2 text-sm font-medium disabled:opacity-50"
          style={{ background: '#c9a84c', color: '#08080f' }}
        >
          {pending ? 'Validating…' : 'Save'}
        </button>
      </div>

      {/* Violations / Gate */}
      <div className="space-y-4">
        {violations.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Validation Results
            </h2>

            {errors.length > 0 && (
              <div className="space-y-2 mb-4">
                {errors.map(v => (
                  <div
                    key={v.id}
                    className="rounded-lg p-3 flex gap-3"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    <XCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#f87171' }} />
                    <div>
                      <p className="text-xs font-mono" style={{ color: '#f87171' }}>{v.field}</p>
                      <p className="text-xs mt-0.5 text-white">{v.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {warnings.length > 0 && showGate && (
              <div className="space-y-2">
                <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Acknowledge each warning to proceed with save.
                </p>
                {warnings.map(v => (
                  <div
                    key={v.id}
                    className="rounded-lg p-3"
                    style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id={v.id}
                        checked={acknowledged.has(v.id)}
                        onChange={e => {
                          const next = new Set(acknowledged)
                          e.target.checked ? next.add(v.id) : next.delete(v.id)
                          setAcknowledged(next)
                        }}
                        className="mt-0.5"
                      />
                      <label htmlFor={v.id} className="cursor-pointer">
                        <p className="text-xs font-mono" style={{ color: '#fbbf24' }}>{v.field}</p>
                        <p className="text-xs mt-0.5 text-white">{v.message}</p>
                      </label>
                    </div>
                  </div>
                ))}

                <div className="mt-3">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Reason for override (required)
                  </label>
                  <textarea
                    rows={2}
                    className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Why is this override acceptable?"
                  />
                </div>

                <button
                  onClick={saveWithOverrides}
                  disabled={pending || acknowledged.size < warnings.length || !reason.trim()}
                  className="w-full rounded-lg py-2 text-sm font-medium disabled:opacity-40"
                  style={{ background: 'rgba(234,179,8,0.15)', color: '#fbbf24' }}
                >
                  {pending ? 'Saving…' : `Save anyway (${acknowledged.size}/${warnings.length} acknowledged)`}
                </button>
              </div>
            )}

            {warnings.length > 0 && !showGate && violations.every(v => v.severity === 'warning') && (
              <div className="space-y-2">
                {warnings.map(v => (
                  <div
                    key={v.id}
                    className="rounded-lg p-3 flex gap-3"
                    style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}
                  >
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#fbbf24' }} />
                    <div>
                      <p className="text-xs font-mono" style={{ color: '#fbbf24' }}>{v.field}</p>
                      <p className="text-xs mt-0.5 text-white">{v.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {violations.length === 0 && (
          <div
            className="rounded-xl p-6 text-center"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Click Save to run validation
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
