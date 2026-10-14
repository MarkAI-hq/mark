import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { GuardianTracyClient } from './_components/guardian-tracy-client'

export default async function GuardianTracyPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return <GuardianTracyClient guardianName={session.name ?? ''} />
}
