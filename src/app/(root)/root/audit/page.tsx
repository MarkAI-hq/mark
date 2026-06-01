import { Metadata } from 'next'
import { getAuditLogs } from '@/lib/actions/root'

export const metadata: Metadata = { title: 'Audit Log — Mark Platform' }

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?:         string
    orgContext?:   string
    resourceType?: string
    action?:       string
  }>
}) {
  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page ?? '1', 10))
  const limit  = 50
  const offset = (currentPage - 1) * limit

  const { data: logs, error } = await getAuditLogs({
    orgContext:   params.orgContext,
    resourceType: params.resourceType,
    action:       params.action,
    limit,
    offset,
  })

  const actionColor: Record<string, string> = {
    CREATE:   '#4ade80',
    READ:     '#60a5fa',
    UPDATE:   '#facc15',
    DELETE:   '#f87171',
    SUSPEND:  '#f87171',
    ACTIVATE: '#4ade80',
    ARCHIVE:  '#fb923c',
    PUBLISH:  '#a78bfa',
    SEED:     '#22d3ee',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Log</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Append-only record of all privileged operations. SOC2 CC7.2.
        </p>
      </div>

      {error && (
        <p className="text-sm" style={{ color: '#f87171' }}>{error.message}</p>
      )}

      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Time</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Actor</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Action</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Resource</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>IP</th>
            </tr>
          </thead>
          <tbody>
            {(logs ?? []).map(entry => (
              <tr key={entry.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td className="px-4 py-2.5 whitespace-nowrap font-mono text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {new Date(entry.created_at).toISOString().replace('T', ' ').slice(0, 19)}
                </td>
                <td className="px-4 py-2.5">
                  <div className="text-white text-xs font-mono">{entry.actor_id?.slice(0, 8) ?? '—'}</div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{entry.actor_role}</div>
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold font-mono"
                    style={{
                      background: `${actionColor[entry.action] ?? '#94a3b8'}18`,
                      color:       actionColor[entry.action] ?? '#94a3b8',
                    }}
                  >
                    {entry.action}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className="text-white text-xs">{entry.resource_type}</span>
                  {entry.resource_id && (
                    <span className="ml-1 font-mono text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      /{entry.resource_id.slice(0, 8)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {entry.ip_address ?? '—'}
                </td>
              </tr>
            ))}
            {(logs ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  No audit entries yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {(logs ?? []).length === limit && (
        <div className="flex justify-end gap-2">
          {currentPage > 1 && (
            <a
              href={`?page=${currentPage - 1}`}
              className="text-xs px-3 py-1.5 rounded"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
            >
              Previous
            </a>
          )}
          <a
            href={`?page=${currentPage + 1}`}
            className="text-xs px-3 py-1.5 rounded"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
          >
            Next
          </a>
        </div>
      )}
    </div>
  )
}
