import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { fetcher } from '@/lib/fetch'
import { StudioShell } from './_components/studio-shell'

interface Props {
  params: Promise<{ planId: string }>
}

export default async function StudioPage({ params }: Props) {
  const cookieStore = await cookies()
  const userCookie  = cookieStore.get('user')?.value
  if (!userCookie) redirect('/student/login')

  let user: any = null
  try { user = JSON.parse(decodeURIComponent(userCookie)) }
  catch { redirect('/student/login') }

  const { planId } = await params

  const result = await fetcher<any>(`/study-plans/${planId}/start`)
  const plan   = result?.data ?? null

  if (!plan) redirect('/student/study-plans')

  const scenes = plan?.content?.scenes ?? []

  return (
    <StudioShell
      plan={plan}
      scenes={scenes}
      user={user}
    />
  )
}
