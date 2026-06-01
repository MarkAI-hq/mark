import { Metadata } from 'next'
import { getRoles, getPermissions } from '@/lib/actions/root'
import { RolesClient } from './_components/roles-client'

export const metadata: Metadata = { title: 'Roles — Mark Platform' }

export default async function RolesPage() {
  const [rolesRes, permsRes] = await Promise.all([getRoles(), getPermissions()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Roles & Permissions</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Define custom roles and assign granular permissions. Org admins can invite users to any non-platform role.
        </p>
      </div>

      <RolesClient
        roles={rolesRes.data ?? []}
        permissions={permsRes.data ?? []}
      />
    </div>
  )
}
