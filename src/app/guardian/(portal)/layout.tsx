import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { GuardianShell } from '@/components/layout/guardian-shell'

export default async function GuardianPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) redirect('/login')
  if (session.role !== 'Reviewer') redirect('/login')

  return <GuardianShell user={session}>{children}</GuardianShell>
}
