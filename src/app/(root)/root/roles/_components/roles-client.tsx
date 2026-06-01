'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, X, Shield, Trash2 } from 'lucide-react'
import {
  createRole, deleteRole, setRolePermissions,
  RoleWithPermissions, PermissionItem,
} from '@/lib/actions/root'

const PLATFORM_ROLES = ['Root', 'Support', 'Admin', 'Teacher', 'Student']

export function RolesClient({
  roles,
  permissions,
}: {
  roles:       RoleWithPermissions[]
  permissions: PermissionItem[]
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [editRole, setEditRole] = useState<RoleWithPermissions | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set())

  const builtIn = roles.filter(r => PLATFORM_ROLES.includes(r.role_name))
  const custom  = roles.filter(r => !PLATFORM_ROLES.includes(r.role_name))

  const openEdit = (role: RoleWithPermissions) => {
    setEditRole(role)
    setSelectedPerms(new Set(role.permissions))
  }

  const savePerms = () => {
    if (!editRole) return
    start(async () => {
      const { error } = await setRolePermissions(editRole.role_id, Array.from(selectedPerms))
      if (error) {
        toast.error('Save failed', { description: error.message })
      } else {
        toast.success(`Permissions updated for ${editRole.role_name}`)
        setEditRole(null)
        router.refresh()
      }
    })
  }

  const handleCreate = () => {
    if (!newName.trim()) return
    start(async () => {
      const { error } = await createRole({
        role_name:   newName.trim(),
        description: newDesc.trim() || undefined,
        permissions: Array.from(selectedPerms),
      })
      if (error) {
        toast.error('Create failed', { description: error.message })
      } else {
        toast.success(`Role "${newName}" created`)
        setShowCreate(false)
        setNewName('')
        setNewDesc('')
        setSelectedPerms(new Set())
        router.refresh()
      }
    })
  }

  const handleDelete = (roleId: string, roleName: string) => {
    if (!confirm(`Delete role "${roleName}"? This cannot be undone.`)) return
    start(async () => {
      const { error } = await deleteRole(roleId)
      if (error) {
        toast.error('Delete failed', { description: error.message })
      } else {
        toast.success(`Role "${roleName}" deleted`)
        router.refresh()
      }
    })
  }

  const togglePerm = (key: string) => {
    const next = new Set(selectedPerms)
    next.has(key) ? next.delete(key) : next.add(key)
    setSelectedPerms(next)
  }

  // Group permissions by category
  const categories = Array.from(new Set(permissions.map(p => p.category))).sort()

  const RoleRow = ({ role, editable }: { role: RoleWithPermissions; editable: boolean }) => (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <td className="px-4 py-3 text-white font-medium">{role.role_name}</td>
      <td className="px-4 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{role.description ?? '—'}</td>
      <td className="px-4 py-3">
        <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(201,168,76,0.1)', color: '#c9a84c' }}>
          {role.permissions.length} permissions
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEdit(role)}
            className="text-xs px-2 py-1 rounded"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
          >
            {editable ? 'Edit permissions' : 'View'}
          </button>
          {editable && (
            <button
              onClick={() => handleDelete(role.role_id, role.role_name)}
              disabled={pending}
              className="p-1 rounded disabled:opacity-50"
              style={{ color: '#f87171' }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  )

  const PermissionGrid = () => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
      {categories.map(cat => (
        <div key={cat}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>{cat}</p>
          <div className="space-y-1">
            {permissions.filter(p => p.category === cat).map(p => (
              <label
                key={p.key}
                className="flex items-start gap-3 cursor-pointer rounded-lg p-2 transition-colors"
                style={{ background: selectedPerms.has(p.key) ? 'rgba(201,168,76,0.08)' : 'transparent' }}
              >
                <input
                  type="checkbox"
                  checked={selectedPerms.has(p.key)}
                  onChange={() => togglePerm(p.key)}
                  className="mt-0.5 shrink-0"
                />
                <div>
                  <p className="text-xs font-mono text-white">{p.key}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{p.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <>
      {/* Built-in roles */}
      <div>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Platform Roles <span style={{ color: 'rgba(255,255,255,0.3)' }}>({builtIn.length})</span>
        </h2>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
                {['Role', 'Description', 'Permissions', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {builtIn.map(r => <RoleRow key={r.role_id} role={r} editable={false} />)}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom roles */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Custom Roles <span style={{ color: 'rgba(255,255,255,0.3)' }}>({custom.length})</span>
          </h2>
          <button
            onClick={() => { setShowCreate(true); setSelectedPerms(new Set()) }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
            style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c' }}
          >
            <Plus className="h-3.5 w-3.5" /> New Role
          </button>
        </div>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
                {['Role', 'Description', 'Permissions', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {custom.map(r => <RoleRow key={r.role_id} role={r} editable={true} />)}
              {custom.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    No custom roles yet — create one above
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit permissions drawer */}
      {editRole && (
        <Overlay onClose={() => setEditRole(null)} title={`Permissions — ${editRole.role_name}`}>
          <PermissionGrid />
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setEditRole(null)} className="text-sm px-4 py-2 rounded-lg" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Cancel
            </button>
            <button
              onClick={savePerms}
              disabled={pending || PLATFORM_ROLES.includes(editRole.role_name)}
              className="text-sm px-4 py-2 rounded-lg font-medium disabled:opacity-40"
              style={{ background: '#c9a84c', color: '#08080f' }}
            >
              {pending ? 'Saving…' : 'Save permissions'}
            </button>
          </div>
        </Overlay>
      )}

      {/* Create role drawer */}
      {showCreate && (
        <Overlay onClose={() => setShowCreate(false)} title="New Custom Role">
          <div className="space-y-4 mb-4">
            <Field label="Role name">
              <input
                className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Publisher"
              />
            </Field>
            <Field label="Description">
              <input
                className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="What can this role do?"
              />
            </Field>
          </div>
          <PermissionGrid />
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setShowCreate(false)} className="text-sm px-4 py-2 rounded-lg" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={pending || !newName.trim()}
              className="text-sm px-4 py-2 rounded-lg font-medium disabled:opacity-40"
              style={{ background: '#c9a84c', color: '#08080f' }}
            >
              {pending ? 'Creating…' : 'Create role'}
            </button>
          </div>
        </Overlay>
      )}
    </>
  )
}

function Overlay({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose} />
      <div
        className="relative ml-auto h-full w-full max-w-lg overflow-y-auto p-6"
        style={{ background: '#0c0c14', borderLeft: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.4)' }}><X className="h-4 w-4" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</label>
      {children}
    </div>
  )
}
