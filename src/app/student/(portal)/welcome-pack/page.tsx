import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getMyWelcomePackOrders } from '@/lib/actions/welcome-pack'
import { getMyOrgWelcomePackConfig } from '@/lib/actions/student-dashboard'
import { WelcomePackClient } from './_components/welcome-pack-client'

export default async function WelcomePackPage() {
  const cookieStore = await cookies()
  const userCookie = cookieStore.get('user')?.value
  if (!userCookie) redirect('/student/login')

  let user: any = null
  try {
    user = JSON.parse(decodeURIComponent(userCookie))
  } catch {
    redirect('/student/login')
  }

  const orgId = user?.organization_id ?? user?.org ?? user?.organization?.organization_id ?? ''

  const [{ data: orders }, packConfig] = await Promise.all([
    getMyWelcomePackOrders(),
    orgId ? getMyOrgWelcomePackConfig(orgId) : Promise.resolve(null),
  ])

  return <WelcomePackClient user={user} orders={orders ?? []} packConfig={packConfig ?? undefined} />
}
