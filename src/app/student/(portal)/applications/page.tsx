import { getMyApplications } from '@/lib/actions/admissions'
import { ApplicationsClient } from './_components/applications-client'

export default async function ApplicationsPage() {
  const res = await getMyApplications()
  return <ApplicationsClient applications={res.data ?? []} />
}
