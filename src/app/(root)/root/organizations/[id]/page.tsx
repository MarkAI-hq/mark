import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getOrganization, getOrgUsers, getOrgAssessments } from '@/lib/actions/root'
import { OrgActions } from './_components/org-actions'
import { OrgEditDrawer } from './_components/org-edit-drawer'

export const metadata: Metadata = { title: 'Organization Detail — Mark Platform' }

export default async function OrgDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [orgRes, usersRes, assessmentsRes] = await Promise.all([
    getOrganization(id),
    getOrgUsers(id),
    getOrgAssessments(id),
  ])

  if (orgRes.error?.status === 404) notFound()

  if (orgRes.error || !orgRes.data) {
    return (
      <div className="space-y-4">
        <Link href="/root/organizations" className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          ← Organizations
        </Link>
        <div
          className="rounded-xl p-6 text-center"
          style={{ border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)' }}
        >
          <p className="text-sm font-medium" style={{ color: '#f87171' }}>
            {orgRes.error?.message ?? 'Failed to load organization'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            The API may be unavailable. Try refreshing the page.
          </p>
        </div>
      </div>
    )
  }

  const org  = orgRes.data
  const users = usersRes.data ?? []
  const assessments = assessmentsRes.data ?? []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/root/organizations" className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Organizations
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{org.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{org.name}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {org.school_code && (
              <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                {org.school_code}
              </span>
            )}
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                background: org.is_active ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                color:      org.is_active ? '#4ade80' : '#f87171',
              }}
            >
              {org.is_active ? 'Active' : 'Suspended'}
            </span>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {org.subscription_tier ?? 'free'} plan
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <OrgEditDrawer
            orgId={id}
            name={org.name}
            type={org.type}
            country={org.country_code}
            subscriptionTier={org.subscription_tier}
          />
          <OrgActions orgId={id} isActive={org.is_active} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Members',     value: org.stats.users },
          { label: 'Assessments', value: org.stats.assessments },
          { label: 'Type',        value: org.type ?? '—' },
          { label: 'Country',     value: org.country_code ?? '—' },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
            <p className="text-xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          </div>
        ))}
      </div>

      {/* Users */}
      <Section title="Members" count={users.length}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
              <Th>Name</Th><Th>Email</Th><Th>Role</Th><Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.user_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td className="px-4 py-2.5 text-white">{[u.first_name, u.last_name].filter(Boolean).join(' ') || '—'}</td>
                <td className="px-4 py-2.5" style={{ color: 'rgba(255,255,255,0.55)' }}>{u.email}</td>
                <td className="px-4 py-2.5" style={{ color: 'rgba(255,255,255,0.55)' }}>{u.role ?? '—'}</td>
                <td className="px-4 py-2.5">
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs"
                    style={{
                      background: u.is_active ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      color:      u.is_active ? '#4ade80' : '#f87171',
                    }}
                  >
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* Assessments */}
      <Section title="Assessments" count={assessments.length}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
              <Th>Title</Th><Th>Published</Th><Th>Audit status</Th>
            </tr>
          </thead>
          <tbody>
            {assessments.map(a => (
              <tr key={a.assessment_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td className="px-4 py-2.5 text-white">{a.title}</td>
                <td className="px-4 py-2.5">
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs"
                    style={{
                      background: a.is_published ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.06)',
                      color:      a.is_published ? '#4ade80' : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {a.is_published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-4 py-2.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {a.audit_status ?? '—'}
                </td>
              </tr>
            ))}
            {assessments.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  No assessments
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Section>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left px-4 py-3 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
      {children}
    </th>
  )
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
        {title} <span style={{ color: 'rgba(255,255,255,0.3)' }}>({count})</span>
      </h2>
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {children}
      </div>
    </div>
  )
}
