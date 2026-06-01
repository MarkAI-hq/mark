'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { broadcastAnnouncement } from '@/lib/actions/root'

const TARGETS = [
  { value: 'ALL',      label: 'All users' },
  { value: 'ADMINS',   label: 'Admins only' },
  { value: 'TEACHERS', label: 'Teachers only' },
  { value: 'STUDENTS', label: 'Students only' },
  { value: 'ORG',      label: 'Specific org' },
]

export function BroadcastForm() {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [step, setStep] = useState<'compose' | 'confirm'>('compose')
  const [form, setForm] = useState({
    title:      '',
    message:    '',
    targetType: 'ALL' as 'ALL' | 'ADMINS' | 'TEACHERS' | 'STUDENTS' | 'ORG',
    orgId:      '',
  })

  const send = () => {
    start(async () => {
      const { error } = await broadcastAnnouncement({
        title:      form.title,
        message:    form.message,
        targetType: form.targetType,
        orgId:      form.targetType === 'ORG' ? form.orgId : undefined,
      })
      if (error) {
        toast.error('Broadcast failed', { description: error.message })
      } else {
        toast.success('Broadcast sent')
        setForm({ title: '', message: '', targetType: 'ALL', orgId: '' })
        setStep('compose')
        router.refresh()
      }
    })
  }

  const input = 'w-full rounded-lg px-3 py-2 text-sm text-white outline-none'
  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }

  if (step === 'confirm') {
    return (
      <div className="space-y-4">
        <div className="rounded-lg p-4" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
          <p className="text-xs font-medium mb-1" style={{ color: '#c9a84c' }}>Sending broadcast</p>
          <p className="text-sm font-semibold text-white">{form.title}</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{form.message}</p>
          <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Target: <strong className="text-white">{TARGETS.find(t => t.value === form.targetType)?.label}</strong>
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setStep('compose')}
            className="flex-1 rounded-lg py-2 text-sm"
            style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
          >
            Back
          </button>
          <button
            onClick={send}
            disabled={pending}
            className="flex-1 rounded-lg py-2 text-sm font-medium disabled:opacity-50"
            style={{ background: '#c9a84c', color: '#08080f' }}
          >
            {pending ? 'Sending…' : 'Send now'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Title</label>
        <input
          className={input}
          style={inputStyle}
          placeholder="Platform maintenance at 2am UTC"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Message</label>
        <textarea
          rows={4}
          className={input}
          style={inputStyle}
          placeholder="We will be performing scheduled maintenance…"
          value={form.message}
          onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Audience</label>
        <select
          className={input}
          style={inputStyle}
          value={form.targetType}
          onChange={e => setForm(f => ({ ...f, targetType: e.target.value as typeof form.targetType }))}
        >
          {TARGETS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      {form.targetType === 'ORG' && (
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Organization ID</label>
          <input
            className={input}
            style={inputStyle}
            placeholder="UUID of the target org"
            value={form.orgId}
            onChange={e => setForm(f => ({ ...f, orgId: e.target.value }))}
          />
        </div>
      )}
      <button
        onClick={() => setStep('confirm')}
        disabled={!form.title || !form.message}
        className="w-full rounded-lg py-2 text-sm font-medium disabled:opacity-40"
        style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c' }}
      >
        Preview & send
      </button>
    </div>
  )
}
