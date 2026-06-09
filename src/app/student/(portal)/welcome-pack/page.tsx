import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getMyWelcomePackOrders } from '@/lib/actions/welcome-pack'
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

  const { data: orders } = await getMyWelcomePackOrders()

  return <WelcomePackClient user={user} orders={orders ?? []} />
}
