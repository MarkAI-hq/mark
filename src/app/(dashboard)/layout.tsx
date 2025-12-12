import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getOrganizationDetails } from '@/lib/actions/organizations'
import { DashboardShell } from '@/components/layout/dashboard-shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: organization } = session.organizationId
    ? await getOrganizationDetails(session.organizationId)
    : { data: null }

  return (
    <DashboardShell organizationName={organization?.name}>
      {children}
    </DashboardShell>
  )
}
