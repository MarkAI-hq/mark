import { getSchoolEarnings, getSchoolStats } from '@/lib/actions/school-revenue'
import { getOrgExamRegistrations } from '@/lib/actions/exam-registrations'
import { listMyOrgExtrasWithStats } from '@/lib/actions/extras'
import { PartnerDashboardClient } from './_components/partner-dashboard-client'

export default async function PartnerDashboardPage() {
  const [statsRes, earningsRes, examsRes, extrasRes] = await Promise.all([
    getSchoolStats(),
    getSchoolEarnings(),
    getOrgExamRegistrations(),
    listMyOrgExtrasWithStats(),
  ])

  return (
    <PartnerDashboardClient
      stats={statsRes.data}
      earnings={earningsRes.data}
      examRegistrations={examsRes.data ?? []}
      extras={extrasRes.data ?? []}
    />
  )
}
