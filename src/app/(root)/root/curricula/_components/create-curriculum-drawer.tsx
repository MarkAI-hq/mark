'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { createCurriculumSchema } from '@/lib/actions/root'

const COUNTRIES = [
  { code: 'ug', name: 'Uganda' },
  { code: 'ke', name: 'Kenya' },
  { code: 'tz', name: 'Tanzania' },
  { code: 'rw', name: 'Rwanda' },
  { code: 'ng', name: 'Nigeria' },
  { code: 'gh', name: 'Ghana' },
  { code: 'zm', name: 'Zambia' },
  { code: 'zw', name: 'Zimbabwe' },
]

const CURRICULUM_BODIES = [
  { value: 'ple',  label: 'PLE (Primary)' },
  { value: 'uce',  label: 'UCE (O-Level)' },
  { value: 'uace', label: 'UACE (A-Level)' },
  { value: 'kcpe', label: 'KCPE (Kenya Primary)' },
  { value: 'kcse', label: 'KCSE (Kenya Secondary)' },
]

const CURRICULUM_LEVELS: Record<string, { value: string; label: string }[]> = {
  ple:  [{ value: 'primary',   label: 'Primary' }],
  uce:  [{ value: 'o_level',   label: 'O-Level' }],
  uace: [{ value: 'a_level',   label: 'A-Level' }],
  kcpe: [{ value: 'primary',   label: 'Primary' }],
  kcse: [{ value: 'secondary', label: 'Secondary' }],
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: '8px 12px',
  color: 'white',
  fontSize: 14,
  outline: 'none',
}

function buildSchemaId(country: string, body: string, code: string) {
  if (!country || !body || !code) return ''
  return `${country}_${body}_${code}`.toLowerCase().replace(/\s+/g, '_')
}

export function CreateCurriculumDrawer() {
  const router = useRouter()
  const [open, setOpen]         = useState(false)
  const [pending, start]        = useTransition()
  const [country, setCountry]   = useState('')
  const [body, setBody]         = useState('')
  const [level, setLevel]       = useState('')
  const [subject, setSubject]   = useState('')
  const [code, setCode]         = useState('')

  const previewId = buildSchemaId(country, body, code)
  const levels    = body ? (CURRICULUM_LEVELS[body] ?? []) : []
  const canSubmit = country && body && level && subject.trim() && code.trim()

  const handleBodyChange = (val: string) => {
    setBody(val)
    const lvls = CURRICULUM_LEVELS[val] ?? []
    setLevel(lvls.length === 1 ? lvls[0].value : '')
  }

  const handleSubmit = () => {
    if (!canSubmit) return
    start(async () => {
      const { data, error } = await createCurriculumSchema({
        country,
        curriculum_body:  body,
        curriculum_level: level,
        subject:          subject.trim(),
        subject_code:     code.trim().toUpperCase(),
      })

      if (error) {
        toast.error('Failed to create curriculum', { description: error.message })
        return
      }

      toast.success('Curriculum created', { description: data!.schema_id })
      setOpen(false)
      router.push(`/root/curricula/${encodeURIComponent(data!.schema_id)}`)
    })
  }

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:opacity-80"
        style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.25)' }}
      >
        <Plus className="h-3.5 w-3.5" />
        New Curriculum
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-end"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            className="h-full w-full max-w-md flex flex-col"
            style={{ background: '#0c0c14', borderLeft: '1px solid rgba(255,255,255,0.07)' }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div>
                <h2 className="text-base font-semibold text-white">New Curriculum</h2>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Creates a draft scaffold — fill content in the editor
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
              >
                <X className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              <Field label="Country">
                <select value={country} onChange={e => setCountry(e.target.value)} style={inputStyle}>
                  <option value="">Select country…</option>
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Curriculum body">
                <select value={body} onChange={e => handleBodyChange(e.target.value)} style={inputStyle}>
                  <option value="">Select body…</option>
                  {CURRICULUM_BODIES.map(b => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Curriculum level">
                <select
                  value={level}
                  onChange={e => setLevel(e.target.value)}
                  disabled={!body}
                  style={{ ...inputStyle, opacity: !body ? 0.4 : 1 }}
                >
                  <option value="">Select level…</option>
                  {levels.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Subject name">
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Biology"
                  style={inputStyle}
                />
              </Field>

              <Field label="Subject code" hint="Short identifier used in schema_id">
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\s+/g, '_'))}
                  placeholder="e.g. BIO or BIO_535"
                  style={inputStyle}
                />
              </Field>

              {/* Preview */}
              {previewId && (
                <div
                  className="rounded-lg px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <p className="text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Schema ID preview
                  </p>
                  <p className="text-sm font-mono text-white">{previewId}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="px-6 py-4 shrink-0"
              style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
            >
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || pending}
                className="w-full rounded-lg py-2.5 text-sm font-semibold disabled:opacity-40 transition-opacity"
                style={{ background: '#c9a84c', color: '#08080f' }}
              >
                {pending ? 'Creating…' : 'Create curriculum'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label:    string
  hint?:    string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
        {label}
        {hint && <span className="ml-1.5 font-normal" style={{ color: 'rgba(255,255,255,0.3)' }}>{hint}</span>}
      </label>
      {children}
    </div>
  )
}
