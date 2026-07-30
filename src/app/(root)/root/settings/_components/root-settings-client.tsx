'use client'

import { useState, useTransition } from 'react'
import { useCookies } from 'next-client-cookies'
import { toast } from 'sonner'
import { KeyRound, Shield, Headphones, Eye, EyeOff } from 'lucide-react'
import { changePassword } from '@/lib/actions/auth'
import type { User } from '@/lib/types'

const panel = 'rounded-xl p-5'
const panelStyle = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }
const input = 'w-full rounded-lg px-3 py-2 pr-9 text-sm text-white outline-none'
const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }
const label = 'block text-xs font-medium mb-1.5'
const labelStyle = { color: 'rgba(255,255,255,0.5)' }

export function RootSettingsClient() {
  const cookies = useCookies()
  const [pending, start] = useTransition()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  let user: User | null = null
  try {
    const c = cookies.get('user')
    if (c) user = JSON.parse(decodeURIComponent(c)) as User
  } catch { /* ignore */ }

  const isRoot = user?.role === 'Root'
  const initials = user?.name
    ?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? '?'

  const canSubmit = currentPassword.length > 0 && newPassword.length >= 8 && newPassword === confirmPassword

  const handleSubmit = () => {
    if (!canSubmit) return
    start(async () => {
      const { error } = await changePassword({ currentPassword, newPassword })
      if (error) {
        toast.error('Failed to update password', { description: error.message })
        return
      }
      toast.success('Password updated')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    })
  }

  return (
    <div className="space-y-4">

      {/* Account */}
      <div className={panel} style={panelStyle}>
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold shrink-0"
            style={{ background: 'rgba(201,168,76,0.2)', color: '#c9a84c' }}
          >
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{user?.email}</p>
          </div>
          <div
            className="ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
            style={{ background: 'rgba(201,168,76,0.1)', color: '#c9a84c' }}
          >
            {isRoot ? <Shield className="h-3 w-3" /> : <Headphones className="h-3 w-3" />}
            {isRoot ? 'Root' : 'Support'}
          </div>
        </div>
        <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Platform-operator accounts are provisioned by another Root administrator. Contact one to change your name or role.
        </p>
      </div>

      {/* Change password */}
      <div className={panel} style={panelStyle}>
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="h-4 w-4" style={{ color: '#c9a84c' }} />
          <p className="text-sm font-semibold text-white">Change Password</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className={label} style={labelStyle}>Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                className={input}
                style={inputStyle}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowCurrent(p => !p)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                {showCurrent ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className={label} style={labelStyle}>New Password</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                className={input}
                style={inputStyle}
                placeholder="Min 8 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowNew(p => !p)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                {showNew ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className={label} style={labelStyle}>Confirm New Password</label>
            <input
              type={showNew ? 'text' : 'password'}
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
              style={inputStyle}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
            {confirmPassword.length > 0 && confirmPassword !== newPassword && (
              <p className="text-xs mt-1" style={{ color: '#f87171' }}>Passwords don&apos;t match</p>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit || pending}
            className="w-full rounded-lg py-2 text-sm font-medium disabled:opacity-40"
            style={{ background: '#c9a84c', color: '#08080f' }}
          >
            {pending ? 'Updating…' : 'Update Password'}
          </button>
        </div>
      </div>

    </div>
  )
}
