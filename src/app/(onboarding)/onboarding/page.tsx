// src/app/(onboarding)/onboarding/page.tsx

import { redirect }              from 'next/navigation'
import { getSession }            from '@/lib/session'
import { getOrganizationDetails } from '@/lib/actions/organizations'
import { OnboardingWizard }      from '@/components/onboarding/onboarding-wizard'

export default async function OnboardingPage() {
  const user = await getSession()

  if (!user)                   redirect('/login')
  if (user.role !== 'Admin')   redirect('/dashboard')
  if (user.onboarding_complete)     redirect('/dashboard')

  // The session cookie never carried an organization_name field — this was
  // previously read off (user as any).organization_name, which was always
  // undefined, leaving "Let's set up . This takes about a minute." with the
  // school name missing on every single admin's onboarding. Fetch it for real.
  const { data: org } = user.organizationId
    ? await getOrganizationDetails(user.organizationId)
    : { data: null }

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col">
      <OnboardingWizard
        adminName={user.name}
        schoolName={org?.name ?? ''}
      />
    </main>
  )
}