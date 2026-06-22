import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getMyStudyPlans, getMyGradebook, getSuggestedTopic } from '@/lib/actions/study-plans'
import { StudyPlansClient } from './_components/study-plans-client'

export default async function StudyPlansPage() {
  const cookieStore = await cookies()
  const userCookie  = cookieStore.get('user')?.value
  if (!userCookie) redirect('/student/login')

  let user: any = null
  try { user = JSON.parse(decodeURIComponent(userCookie)) }
  catch { redirect('/student/login') }

  const [
    { data: plans,     error },
    { data: gradebook },
    { data: suggestion },
  ] = await Promise.all([
    getMyStudyPlans(),
    getMyGradebook(),
    getSuggestedTopic(),
  ])

  return (
    <StudyPlansClient
      user={user}
      initialPlans={plans ?? []}
      gradebook={gradebook ?? null}
      suggestion={suggestion?.entry ? suggestion : null}
      error={error?.message ?? null}
    />
  )
}
