import { Metadata } from 'next'
import Link from 'next/link'
import { getRootCurricula, reloadCurriculaFromFiles } from '@/lib/actions/root'
import { BookOpen, RefreshCw } from 'lucide-react'
import { ReloadButton } from './_components/reload-button'

export const metadata: Metadata = { title: 'Curricula — Mark Platform' }

export default async function CurriculaPage() {
  const { data: curricula, error } = await getRootCurricula()

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Curricula</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Manage curriculum schemas. Edits are validated before saving.
          </p>
        </div>
        <ReloadButton />
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
              {['Schema ID', 'Subject', 'Country', 'Level', 'Version', 'Status', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(curricula ?? []).map(c => (
              <tr key={c.schema_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td className="px-4 py-3 font-mono text-xs text-white">{c.schema_id}</td>
                <td className="px-4 py-3 text-white">{c.subject}</td>
                <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.country}</td>
                <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.curriculum_level}</td>
                <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.version}</td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs"
                    style={{
                      background: c.status === 'active' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.06)',
                      color:      c.status === 'active' ? '#4ade80' : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/root/curricula/${encodeURIComponent(c.schema_id)}`}
                    className="text-xs rounded px-2 py-1"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {(curricula ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  No curricula found. Try reloading from files.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
