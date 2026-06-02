import { Metadata } from 'next'
import { getRootCurricula } from '@/lib/actions/root'
import { ReloadButton } from './_components/reload-button'
import { CurriculaBrowser } from './_components/curricula-browser'

export const metadata: Metadata = { title: 'Curricula — Mark Platform' }

export default async function CurriculaPage() {
  const { data: curricula, error } = await getRootCurricula()

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Curricula</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Browse and edit curriculum schemas by country and type.
          </p>
        </div>
        <ReloadButton />
      </div>

      {error && (
        <div
          className="rounded-xl p-4"
          style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <p className="text-sm" style={{ color: '#f87171' }}>{error.message}</p>
        </div>
      )}

      <CurriculaBrowser curricula={curricula ?? []} />
    </div>
  )
}
