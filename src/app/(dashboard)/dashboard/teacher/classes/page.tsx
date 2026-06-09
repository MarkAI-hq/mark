// src/app/(dashboard)/dashboard/teacher/classes/page.tsx
import { redirect }                         from 'next/navigation'
import { getSession }                       from '@/lib/session'
import { getMyClasses, getClasses, getMyJoinRequests } from '@/lib/actions/classes'
import { TeacherClassesClient }             from './[classId]/_components/teacher-classes-client'

export const metadata = {
  title: 'My Classes — Mark',
}

export default async function TeacherClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const user = await getSession()
  if (!user)                   redirect('/login')
  if (user.role !== 'Teacher') redirect('/dashboard')

  const { tab } = await searchParams
  const defaultTab = tab === 'browse' ? 'browse' : 'my'

  const [
    { data: classes, error },
    { data: allClasses },
    { data: joinRequests },
  ] = await Promise.all([
    getMyClasses(),
    getClasses(),
    getMyJoinRequests(),
  ])

  return (
    <TeacherClassesClient
      classes={classes ?? []}
      allClasses={allClasses ?? []}
      joinRequests={joinRequests ?? []}
      organizationId={user.organizationId ?? ''}
      defaultTab={defaultTab as 'my' | 'browse'}
      error={error?.message}
      user={user}
    />
  )
}