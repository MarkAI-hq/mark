import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getNotificationSettings } from '@/lib/actions/student-settings'
import { SettingsClient } from './_components/settings-client'

export default async function SettingsPage() {
  const cookieStore = await cookies()
  const userCookie = cookieStore.get('user')?.value
  if (!userCookie) redirect('/student/login')

  let user: any = null
  try {
    user = JSON.parse(decodeURIComponent(userCookie))
  } catch {
    redirect('/student/login')
  }

  const { data: notificationSettings } = await getNotificationSettings()

  return <SettingsClient user={user} notificationSettings={notificationSettings ?? null} />
}
