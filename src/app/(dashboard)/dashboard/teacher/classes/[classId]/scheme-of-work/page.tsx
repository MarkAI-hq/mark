// src/app/(dashboard)/dashboard/teacher/classes/[classId]/scheme-of-work/page.tsx
import { getSession }                               from '@/lib/session'
import { getClassDetails }                          from '@/lib/actions/classes'
import { getActiveSchemeForClass, listSchemeOfWork } from '@/lib/actions/scheme-of-work'
import { getSubjects }                              from '@/lib/actions/subjects'
import { SchemeOfWorkClient }                       from './_components/scheme-of-work-client'

interface Props {
  params: Promise<{ classId: string }>
}

export default async function SchemeOfWorkPage({ params }: Props) {
  const { classId } = await params

  const [session, classRes, activeRes, allRes, subjectsRes] = await Promise.all([
    getSession(),
    getClassDetails(classId),
    getActiveSchemeForClass(classId),
    listSchemeOfWork(),
    getSubjects(),
  ])

  const isAdmin    = session?.role === 'Admin'
  const className  = classRes.data?.name ?? null
  const gradeLevel = (classRes.data as any)?.grade_level ?? null
  const subjects   = (subjectsRes.data ?? []).map((s: any) => s.name as string)

  return (
    <SchemeOfWorkClient
      classId={classId}
      className={className}
      gradeLevel={gradeLevel}
      subjects={subjects}
      classesUrl={isAdmin ? '/dashboard/classes' : '/dashboard/teacher/classes'}
      classUrl={isAdmin ? `/dashboard/classes/${classId}` : `/dashboard/teacher/classes/${classId}`}
      activeSow={activeRes.data ?? null}
      allSchemes={allRes.data ?? []}
      error={activeRes.error?.message ?? null}
    />
  )
}
