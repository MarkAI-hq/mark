// src/app/student/(portal)/community/page.tsx
import { Suspense } from 'react'
import { listExtrasForSchool, getMyEnrollments } from '@/lib/actions/extras'
import { CommunityClient } from './_components/community-client'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function CommunityPage() {
  const cookieStore = await cookies()
  const userCookie  = cookieStore.get('user')?.value
  if (!userCookie) redirect('/student/login')

  let user: any = null
  try {
    user = JSON.parse(decodeURIComponent(userCookie))
  } catch {
    redirect('/student/login')
  }

  const schoolCode = user?.school_code ?? user?.organization?.school_code ?? ''

  const [extrasRes, enrollmentsRes] = await Promise.all([
    schoolCode ? listExtrasForSchool(schoolCode) : Promise.resolve({ data: [], error: null }),
    getMyEnrollments(),
  ])

  return (
    <Suspense fallback={null}>
      <CommunityClient
        extras={extrasRes.data ?? []}
        enrollments={enrollmentsRes.data ?? []}
      />
    </Suspense>
  )
}
