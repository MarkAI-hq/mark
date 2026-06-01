import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getRootCurriculumById } from '@/lib/actions/root'
import { CurriculumEditor } from './_components/curriculum-editor'

export const metadata: Metadata = { title: 'Edit Curriculum — Mark Platform' }

export default async function CurriculumDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const schemaId = decodeURIComponent(id)
  const { data, error } = await getRootCurriculumById(schemaId)

  if (error?.status === 404 || !data) notFound()

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

      <CurriculumEditor schemaId={schemaId} initialData={data} />
    </div>
  )
}
