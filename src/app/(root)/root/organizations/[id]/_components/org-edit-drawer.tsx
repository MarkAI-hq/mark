'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { updateOrgProfile, updateSubscription } from '@/lib/actions/root'

const TIERS    = ['free', 'starter', 'pro', 'enterprise']
const ORG_TYPES = ['school', 'university', 'tutoring', 'corporate', 'ngo', 'other']

export function OrgEditDrawer({
  orgId,
  name,
  type,
  country,
  subscriptionTier,
}: {
  orgId:            string
  name:             string
  type:             string | null
  country:          string | null
  subscriptionTier: string | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()

  const [form, setForm] = useState({
    name:             name,
    type:             type ?? '',
    country:          country ?? '',
    subscriptionTier: subscriptionTier ?? 'free',
  })

  const save = () => {
    start(async () => {
      const profileRes = await updateOrgProfile(orgId, {
        name:    form.name    || undefined,
        type:    form.type    || undefined,
        country: form.country || undefined,
      })

      const tierChanged = form.subscriptionTier !== (subscriptionTier ?? 'free')
      const tierRes = tierChanged ? await updateSubscription(orgId, form.subscriptionTier) : null

      if (profileRes.error || tierRes?.error) {
        toast.error('Save failed', { description: profileRes.error?.message ?? tierRes?.error?.message })
        return
      }

      toast.success('Organization updated')
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
        style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c' }}
      >
        Edit org
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={() => setOpen(false)}
          />
          <div
            className="relative ml-auto h-full w-full max-w-md overflow-y-auto p-6"
            style={{ background: '#0c0c14', borderLeft: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-white">Edit Organization</h2>
              <button onClick={() => setOpen(false)} style={{ color: 'rgba(255,255,255,0.4)' }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <Field label="Name">
                <input
                  className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </Field>

              <Field label="Type">
                <select
                  className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                >
                  <option value="">— select —</option>
                  {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>

              <Field label="Country code">
                <input
                  className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  placeholder="e.g. UG, KE, NG"
                  value={form.country}
                  onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                />
              </Field>

              <Field label="Subscription tier">
                <select
                  className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  value={form.subscriptionTier}
                  onChange={e => setForm(f => ({ ...f, subscriptionTier: e.target.value }))}
                >
                  {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-2 text-sm"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={pending}
                className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
                style={{ background: '#c9a84c', color: '#08080f' }}
              >
                {pending ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}
