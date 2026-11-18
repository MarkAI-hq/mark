import { redirect } from 'next/navigation'
import { Timer } from 'lucide-react'
import { getSession } from '@/lib/session'
import { getPlatformFocusSessions } from '@/lib/actions/focus'
import { SYSTEMS } from '@/lib/focus/systems'
import { SessionsChart } from './_components/sessions-chart'

const panel = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }
const muted = { color: 'rgba(255,255,255,0.4)' }

const pct = (r: number | null) => (r == null ? '–' : `${Math.round(r * 100)}%`)

function StatCard({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl p-5" style={panel}>
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs" style={muted}>{sub}</p>
    </div>
  )
}

export default async function FocusSessionsPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'Root' && session.role !== 'Support') redirect('/root')

  const { data: d } = await getPlatformFocusSessions(30)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'rgba(201,168,76,0.15)' }}>
          <Timer className="h-5 w-5" style={{ color: '#c9a84c' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Focus Sessions</h1>
          <p className="mt-0.5 text-sm" style={muted}>Focus Mode usage across all schools, last 30 days.</p>
        </div>
      </div>

      {!d ? (
        <div className="rounded-xl py-10 text-center text-sm" style={{ ...panel, ...muted }}>
          Could not load focus sessions. Ensure the API is reachable.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard title="Sessions" value={d.totals.sessions.toLocaleString()} sub={`${d.totals.focus_minutes.toLocaleString()} focus minutes`} />
            <StatCard title="Learners" value={d.totals.learners.toLocaleString()} sub="Used Focus Mode at least once" />
            <StatCard title="Focusing now" value={d.totals.live_learners.toLocaleString()} sub="Active session in the last 3 hours" />
            <StatCard title="Completion rate" value={pct(d.totals.completion_rate)} sub="Completed ÷ ended sessions" />
          </div>

          <div className="rounded-xl p-5" style={panel}>
            <p className="mb-3 text-sm font-semibold text-white">Sessions per day</p>
            <SessionsChart data={d.sessions_per_day} />
          </div>

          <div className="rounded-xl p-5" style={panel}>
            <p className="mb-3 text-sm font-semibold text-white">Completion by system</p>
            {d.by_system.length === 0 ? (
              <p className="text-sm" style={muted}>No sessions yet.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {d.by_system.map((s) => (
                  <div key={s.system} className="rounded-lg px-4 py-3" style={panel}>
                    <p className="text-xs" style={muted}>{SYSTEMS[s.system]?.label ?? s.system}</p>
                    <p className="text-lg font-semibold text-white">{pct(s.completion_rate)}</p>
                    <p className="text-xs" style={muted}>{s.sessions} sessions</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl" style={panel}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs" style={muted}>
                  <th className="px-4 py-3 font-medium">School</th>
                  <th className="px-4 py-3 text-right font-medium">Sessions</th>
                  <th className="px-4 py-3 text-right font-medium">Learners</th>
                  <th className="px-4 py-3 text-right font-medium">Focus minutes</th>
                  <th className="px-4 py-3 text-right font-medium">Completion</th>
                </tr>
              </thead>
              <tbody>
                {d.by_org.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center" style={muted}>No sessions in this period.</td>
                  </tr>
                ) : (
                  d.by_org.map((o) => (
                    <tr key={o.organization_id} className="border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      <td className="px-4 py-3 text-white">{o.organization_name ?? o.organization_id}</td>
                      <td className="px-4 py-3 text-right text-white tabular-nums">{o.sessions}</td>
                      <td className="px-4 py-3 text-right text-white tabular-nums">{o.learners}</td>
                      <td className="px-4 py-3 text-right text-white tabular-nums">{o.focus_minutes}</td>
                      <td className="px-4 py-3 text-right text-white tabular-nums">{pct(o.completion_rate)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
