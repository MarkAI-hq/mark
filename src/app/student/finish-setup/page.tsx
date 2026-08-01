import { cookies } from 'next/headers'
import { FinishSetupClient } from './_components/finish-setup-client'

export const metadata = {
  title: 'Finish setup · Mirror Intelligence',
}

export default async function FinishSetupPage() {
  const cookieStore = cookies()
  const userCookie = (await cookieStore).get('user')?.value
  let studentName = ''
  if (userCookie) {
    try {
      const user = JSON.parse(decodeURIComponent(userCookie))
      studentName = user?.name ?? ''
    } catch {
      // ignore malformed cookie — greeting just falls back to empty
    }
  }

  return (
    <main className="min-h-screen bg-surface-base flex items-center justify-center px-4 py-10">
      <FinishSetupClient studentName={studentName} />
    </main>
  )
}
