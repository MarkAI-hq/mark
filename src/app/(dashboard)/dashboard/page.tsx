// src/app/(dashboard)/dashboard/page.tsx

import { redirect }                from 'next/navigation'
import { getSession }              from '@/lib/session'
import { getStats }                from '@/lib/actions/stats'
import { getSchoolAnalytics, getLearningVelocity } from '@/lib/actions/analytics'
import { getOrganizationDetails }  from '@/lib/actions/organizations'
import { DashboardClient }         from '@/components/dashboard/dashboard-client'

export default async function DashboardPage() {
  const user = await getSession()

  if (!user) redirect('/login')

  switch (user.role) {
    case 'Teacher':
      redirect('/dashboard/teacher')
    case 'Student':
      redirect('/student/dashboard')
  }

  if (user.onboarding_complete === false) redirect('/onboarding')

  const [stats, analytics, orgRes, velocityRes] = await Promise.all([
    getStats(),
    getSchoolAnalytics(),
    user.organizationId
      ? getOrganizationDetails(user.organizationId)
      : Promise.resolve({ data: null, error: null }),
    user.role === 'Admin'
      ? getLearningVelocity()
      : Promise.resolve({ data: null, error: null }),
  ])

  return (
    <DashboardClient
      stats={stats}
      analytics={analytics}
      learningVelocity={velocityRes.data}
      user={{ ...user, organizationName: orgRes.data?.name ?? '' }}
    />
  )
}