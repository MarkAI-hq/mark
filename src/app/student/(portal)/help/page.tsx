import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import { HelpClient } from './_components/help-client'

export const metadata: Metadata = { title: 'Help & Guide — Mark' }

export default async function StudentHelpPage() {
  const cookieStore = await cookies()
  const userCookie = cookieStore.get('user')?.value

  if (!userCookie) redirect('/student/login')

  let user: any = null
  try {
    user = JSON.parse(decodeURIComponent(userCookie))
  } catch {
    redirect('/student/login')
  }

  const isMarketplace = user?.enrollment_source === 'marketplace'

  return <HelpClient isMarketplace={isMarketplace} />
}
