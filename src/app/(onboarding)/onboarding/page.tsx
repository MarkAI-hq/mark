// src/app/(onboarding)/onboarding/page.tsx

import { redirect }         from 'next/navigation'
import { getSession }       from '@/lib/session'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'

export default async function OnboardingPage() {
  const user = await getSession()

  if (!user)                   redirect('/login')
  if (user.role !== 'Admin')   redirect('/dashboard')
  if (user.onboarding_complete)     redirect('/dashboard')

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col">
      <OnboardingWizard
        adminName={user.name}
        schoolName={(user as any).organization_name ?? ''}
      />
    </main>
  )
}