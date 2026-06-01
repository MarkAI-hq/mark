// src/app/(dashboard)/dashboard/teacher/classes/[classId]/scheme-of-work/page.tsx
import { getActiveSchemeForClass, listSchemeOfWork } from '@/lib/actions/scheme-of-work'
import { SchemeOfWorkClient } from './_components/scheme-of-work-client'

interface Props {
  params: Promise<{ classId: string }>
}

export default async function SchemeOfWorkPage({ params }: Props) {
  const { classId } = await params

  const [activeRes, allRes] = await Promise.all([
    getActiveSchemeForClass(classId),
    listSchemeOfWork(),
  ])

  return (
    <SchemeOfWorkClient
      classId={classId}
      activeSow={activeRes.data ?? null}
      allSchemes={allRes.data ?? []}
      error={activeRes.error?.message ?? null}
    />
  )
}
