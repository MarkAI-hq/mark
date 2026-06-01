// src/app/student/(portal)/study-plans/page.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getMyStudyPlans } from '@/lib/actions/study-plans'
import { StudyPlansClient } from './_components/study-plans-client'

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function StudyPlansPage({ searchParams }: Props) {
  const cookieStore = await cookies()
  const userCookie  = cookieStore.get('user')?.value
  if (!userCookie) redirect('/student/login')

  let user: any = null
  try {
    user = JSON.parse(decodeURIComponent(userCookie))
  } catch {
    redirect('/student/login')
  }

  const { status } = await searchParams
  const { data: plans, error } = await getMyStudyPlans(status)

  return (
    <StudyPlansClient
      user={user}
      initialPlans={plans ?? []}
      error={error?.message ?? null}
      activeFilter={status}
    />
  )
}
