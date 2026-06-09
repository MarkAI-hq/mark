import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import { getMyCertificates } from '@/lib/actions/certificates'
import { getMyReferralCode, getMyInvites } from '@/lib/actions/referrals'
import { StudentCertificatesClient } from './_components/student-certificates-client'

export const metadata: Metadata = { title: 'My Certificates — Mark' }

export default async function StudentCertificatesPage() {
  const cookieStore = await cookies()
  const userCookie = cookieStore.get('user')?.value

  if (!userCookie) redirect('/student/login')

  let user: any = null
  try {
    user = JSON.parse(decodeURIComponent(userCookie))
  } catch {
    redirect('/student/login')
  }

  const [{ data: certs }, { data: referralCode }, { data: invites }] =
    await Promise.all([
      getMyCertificates(),
      getMyReferralCode(),
      getMyInvites(),
    ])

  return (
    <StudentCertificatesClient
      user={user}
      certificates={certs ?? []}
      referralCode={referralCode ?? null}
      invites={invites ?? null}
    />
  )
}
