import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { StudentShell } from '@/components/layout/student-shell'
import { FocusProvider } from '@/components/focus/focus-provider'
import { FocusDock } from '@/components/focus/focus-dock'
import { fetcher } from '@/lib/fetch'
import { getMySchool } from '@/lib/actions/student-shell'
import { getStudentPaceSettings } from '@/lib/actions/study-plans'
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
  // The login cookie carries neither the school's name nor the student's name for
  // their assistant, so both are loaded here (in parallel with the streak).
  let schoolName: string | null = null
  let assistantName: string | null = null
  if (studentId) {
    const [streakRes, schoolRes, paceRes] = await Promise.all([
      fetcher<{ study_streak: number }>(`/students/${studentId}/streak`).catch(() => ({ data: null, error: null })),
      getMySchool().catch(() => ({ data: null, error: null })),
      getStudentPaceSettings(studentId).catch(() => ({ data: null, error: null })),
    ])
    if (streakRes.data?.study_streak != null) user.study_streak = streakRes.data.study_streak
    schoolName    = schoolRes.data?.name ?? null
    assistantName = paceRes.data?.assistant_name ?? null
  }

  return (
    <StudentShell
      user={user}
      organizationName={schoolName ?? user?.organization_name ?? null}
      assistantName={assistantName}
    >
      {/* One provider for the whole portal so the focus timer and sound
          survive client-side navigation (Focus Mode v1). */}
      <FocusProvider studentId={String(studentId ?? "")}>
        {children}
        <FocusDock />
      </FocusProvider>
    </StudentShell>
  )
}
