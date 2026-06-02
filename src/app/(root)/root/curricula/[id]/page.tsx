import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getRootCurriculumById, getCurriculumVersions } from '@/lib/actions/root'
import { CurriculumEditorShell } from './_components/curriculum-editor-shell'

export const metadata: Metadata = { title: 'Edit Curriculum — Mirror Intelligence' }

export default async function CurriculumDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const schemaId = decodeURIComponent(id)

  const [schemaResult, versionsResult] = await Promise.all([
    getRootCurriculumById(schemaId),
    getCurriculumVersions(schemaId),
  ])

  if (schemaResult.error?.status === 404) notFound()

  if (schemaResult.error || !schemaResult.data) {
    return (
      <div className="space-y-4">
        <Link href="/root/curricula" className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          ← Curricula
        </Link>
        <div
          className="rounded-xl p-6 text-center"
          style={{ border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)' }}
        >
          <p className="text-sm font-medium" style={{ color: '#f87171' }}>
            {schemaResult.error?.message ?? 'Failed to load curriculum schema'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            The API may be unavailable. Try refreshing the page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href="/root/curricula" className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Curricula
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
          <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>{schemaId}</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Edit Curriculum Schema</h1>
      </div>

      <CurriculumEditorShell
        schemaId={schemaId}
        initialData={schemaResult.data}
        versions={versionsResult.data ?? []}
      />
    </div>
  )
}
