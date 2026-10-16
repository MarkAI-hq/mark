import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { fetcher } from '@/lib/fetch'
import { StudioEntry } from './_components/studio-entry'
import { LessonReview } from './_components/lesson-review'

interface Props {
  params: Promise<{ planId: string }>
  searchParams: Promise<{ mode?: string; from?: string }>
}

export default async function StudioPage({ params, searchParams }: Props) {
  const cookieStore = await cookies()
  const userCookie  = cookieStore.get('user')?.value
  if (!userCookie) redirect('/student/login')

  let user: any = null
  try { user = JSON.parse(decodeURIComponent(userCookie)) }
  catch { redirect('/student/login') }

  const { planId } = await params
  const { mode, from } = await searchParams

  const result = await fetcher<any>(`/study-plans/${planId}/start`)
  const plan   = result?.data ?? null

  if (!plan) redirect('/student/study-plans')

  const scenes = plan?.content?.scenes ?? []
  const isCompleted = plan.status === 'completed'

  // A completed lesson never silently replays as if fresh anymore — the
  // student picks review (read-only) or practice (replay, not recorded)
  // before the Studio opens. Nothing here affects pending/sent plans.
  // `from` carries the entry point (e.g. "history") through review/chooser
  // so the back link returns where the student actually came from.
  if (isCompleted && mode === 'review') {
    return <LessonReview plan={plan} from={from} />
  }
  // Chooser-vs-Studio is decided client-side (and latched at mount) so the
  // server re-render that follows completing a lesson can't swap the Studio's
  // completion screen out for the chooser.
  return (
    <StudioEntry
      plan={plan}
      scenes={scenes}
      user={user}
      from={from}
      mode={mode}
    />
  )
}
