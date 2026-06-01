import { Metadata } from 'next'
import Link from 'next/link'
import { getOrganizations } from '@/lib/actions/root'

export const metadata: Metadata = { title: 'Organizations — Mark Platform' }

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page } = await searchParams
  const currentPage = Math.max(1, parseInt(page ?? '1', 10))
  const limit  = 50
  const offset = (currentPage - 1) * limit

  const { data: orgs, error } = await getOrganizations(limit, offset)

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-white">Organizations</h1>
        <p className="text-sm" style={{ color: '#f87171' }}>{error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Organizations</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          All customer organizations on the platform
        </p>
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Name</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Code</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Type</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Country</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Plan</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Onboarded</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {(orgs ?? []).map(org => (
              <tr key={org.organization_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td className="px-4 py-3">
                  <Link
                    href={`/root/organizations/${org.organization_id}`}
                    className="text-white hover:underline font-medium"
                  >
                    {org.name}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {org.school_code ?? '—'}
                </td>
                <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>{org.type ?? '—'}</td>
                <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>{org.country_code ?? '—'}</td>
                <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>{org.subscription_tier ?? 'free'}</td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      background: org.onboarding_complete ? 'rgba(34,197,94,0.12)' : 'rgba(234,179,8,0.12)',
                      color:      org.onboarding_complete ? '#4ade80' : '#facc15',
                    }}
                  >
                    {org.onboarding_complete ? 'Yes' : 'Pending'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      background: org.is_active ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                      color:      org.is_active ? '#4ade80' : '#f87171',
                    }}
                  >
                    {org.is_active ? 'Active' : 'Suspended'}
                  </span>
                </td>
              </tr>
            ))}
            {(orgs ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  No organizations found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
