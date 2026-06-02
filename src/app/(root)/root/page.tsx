import { Metadata } from 'next'
import Link from 'next/link'
import { Building2, Users, FileText } from 'lucide-react'
import { getPlatformStats, getOrganizations } from '@/lib/actions/root'

export const metadata: Metadata = { title: 'Platform — Mark' }

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'rgba(201,168,76,0.12)' }}>
          <Icon className="h-4 w-4" style={{ color: '#c9a84c' }} />
        </div>
        <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
    </div>
  )
}

export default async function RootPage() {
  const [statsRes, orgsRes] = await Promise.all([
    getPlatformStats(),
    getOrganizations(5, 0),
  ])

  const stats = statsRes.data
  const recentOrgs = orgsRes.data ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Live metrics across all customer organizations
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Organizations"  value={stats.organizations} icon={Building2} />
          <StatCard label="Total Users"    value={stats.users}         icon={Users}     />
          <StatCard label="Assessments"    value={stats.assessments}   icon={FileText}  />
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Most recent organizations
        </h2>
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Name</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Type</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Plan</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrgs.map(org => (
                <tr key={org.organization_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td className="px-4 py-3">
                    <Link href={`/root/organizations/${org.organization_id}`} className="text-white hover:underline font-medium">
                      {org.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>{org.type ?? '—'}</td>
                  <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>{org.subscription_tier ?? 'free'}</td>
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
              {recentOrgs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    No organizations yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {recentOrgs.length > 0 && (
          <div className="mt-2 text-right">
            <Link href="/root/organizations" className="text-xs" style={{ color: '#c9a84c' }}>
              View all organizations →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
