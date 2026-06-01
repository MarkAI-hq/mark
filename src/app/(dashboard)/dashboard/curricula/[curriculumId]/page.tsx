import { notFound } from 'next/navigation'
import { getCurriculumById } from '@/lib/actions/curricula'
import { CurriculumDetailClient } from './_components/curriculum-detail-client'

interface Props {
  params: Promise<{ curriculumId: string }>
}

export default async function CurriculumDetailPage({ params }: Props) {
  const { curriculumId } = await params

  let schema
  try {
    const { data, error } = await getCurriculumById(curriculumId)
    if (error || !data) return notFound()
    schema = data
  } catch {
    return notFound()
  }

  return <CurriculumDetailClient schema={schema} />
}
