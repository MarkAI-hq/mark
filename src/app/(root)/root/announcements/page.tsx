import { Metadata } from 'next'
import { getBroadcastHistory } from '@/lib/actions/root'
import { BroadcastForm } from './_components/broadcast-form'

export const metadata: Metadata = { title: 'Announcements — Mark Platform' }

export default async function AnnouncementsPage() {
  const { data: history } = await getBroadcastHistory(20)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Announcements</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Send platform-wide alerts to users. All broadcasts are logged.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Compose */}
        <div
          className="rounded-xl p-6"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <h2 className="text-sm font-semibold text-white mb-4">New Broadcast</h2>
          <BroadcastForm />
        </div>

        {/* History */}
        <div
          className="rounded-xl p-6"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <h2 className="text-sm font-semibold text-white mb-4">Broadcast History</h2>
          <div className="space-y-3">
            {(history ?? []).map(entry => {
              const meta = entry.metadata as Record<string, unknown> | null
              return (
                <div
                  key={entry.id}
                  className="rounded-lg p-3"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-white">{entry.resource_type}</span>
                    <span className="text-xs shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {new Date(entry.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {meta && (
                    <div className="mt-1 flex items-center gap-3">
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(201,168,76,0.12)', color: '#c9a84c' }}>
                        {String(meta.target_type ?? '—')}
                      </span>
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {String(meta.recipient_count ?? 0)} recipients
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
            {(history ?? []).length === 0 && (
              <p className="text-xs text-center py-8" style={{ color: 'rgba(255,255,255,0.3)' }}>
                No broadcasts sent yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
