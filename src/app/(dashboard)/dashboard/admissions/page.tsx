import { Metadata } from 'next'
import { getPendingApplications } from '@/lib/actions/admissions'
import { AdmissionsClient } from './_components/admissions-client'

export const metadata: Metadata = { title: 'Admissions — Mark' }

export default async function AdmissionsPage() {
  const { data } = await getPendingApplications(1, 50)

  return (
    <AdmissionsClient
      initialApplications={data?.applications ?? []}
      total={data?.total ?? 0}
    />
  )
}
