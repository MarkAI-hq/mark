import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getMyGradebook } from '@/lib/actions/study-plans'
import { GradesClient } from './_components/grades-client'

export default async function GradesPage() {
  const cookieStore = await cookies()
  const userCookie  = cookieStore.get('user')?.value
  if (!userCookie) redirect('/student/login')

  let user: any = null
  try { user = JSON.parse(decodeURIComponent(userCookie)) } catch { redirect('/student/login') }

  const { data: gradebook, error } = await getMyGradebook()

  return (
    <GradesClient
      user={user}
      gradebook={gradebook ?? null}
      error={error?.message ?? null}
    />
  )
}
