import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { StudentShell } from '@/components/layout/student-shell'
import { fetcher } from '@/lib/fetch'
// Loaded here (not in guided-tour.tsx, which only mounts on the dashboard)
// so it's already present before any client-side navigation into the
// dashboard — see guided-tour.tsx for why that matters. The theme file
// second, so its overrides win by source order over the library defaults.
import '@sjmc11/tourguidejs/dist/css/tour.min.css'
import '@/components/students/guided-tour-theme.css'

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

  // The `user` cookie is a snapshot from login — study_streak goes stale the
  // moment a check-in or completed lesson bumps it server-side. This layout
  // persists across client-side navigation, so this fetch only re-runs on a
  // hard load or an explicit router.refresh() (e.g. right after check-in),
  // never on every sidebar click.
  const studentId = user?.user_id ?? user?.id
  if (studentId) {
    const { data } = await fetcher<{ study_streak: number }>(`/students/${studentId}/streak`).catch(() => ({ data: null, error: null }))
    if (data?.study_streak != null) user.study_streak = data.study_streak
  }

  return (
    <StudentShell user={user} organizationName={user?.organization_name ?? null}>
      {children}
    </StudentShell>
  )
}
