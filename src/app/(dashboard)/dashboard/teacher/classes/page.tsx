// src/app/(dashboard)/dashboard/teacher/classes/page.tsx
import { redirect }      from 'next/navigation'
import { getSession }    from '@/lib/session'
import { getMyClasses }  from '@/lib/actions/classes'
import { TeacherClassesClient } from './[classId]/_components/teacher-classes-client'

export const metadata = {
  title: 'My Classes — Mark',
}

export default async function TeacherClassesPage() {
  const user = await getSession()
  if (!user)                   redirect('/login')
  if (user.role !== 'Teacher') redirect('/dashboard')

  const { data: classes, error } = await getMyClasses()

  return (
    <TeacherClassesClient
      classes={classes ?? []}
      error={error?.message}
      user={user}
    />
  )
}