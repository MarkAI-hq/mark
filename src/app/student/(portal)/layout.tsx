import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { StudentShell } from '@/components/layout/student-shell'

export default async function StudentPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const userCookie  = cookieStore.get('user')?.value

  if (!userCookie) redirect('/student/login')

  let user: any = null
  try {
    user = JSON.parse(decodeURIComponent(userCookie))
  } catch {
    redirect('/student/login')
  }

  if (!user?.roles?.includes('Student')) redirect('/login')

  return (
    <StudentShell user={user} organizationName={user?.organization_name ?? null}>
      {children}
    </StudentShell>
  )
}
