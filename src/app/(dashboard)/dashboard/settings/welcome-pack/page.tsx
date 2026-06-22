import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getOrganizationDetails } from '@/lib/actions/organizations'
import { WelcomePackSettingsClient } from './_components/welcome-pack-settings-client'

export default async function WelcomePackSettingsPage() {
  const user = await getSession()
  if (!user || !user.organizationId) redirect('/login')
  if (user.role !== 'Admin') redirect('/dashboard')

  const { data: org, error } = await getOrganizationDetails(user.organizationId)
  if (error || !org) {
    return (
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Welcome Pack Settings</h3>
        <p className="text-sm text-muted-foreground">Failed to load organisation data.</p>
      </div>
    )
  }

  return (
    <WelcomePackSettingsClient
      organizationId={user.organizationId}
      currentConfig={org.welcome_pack_config ?? {}}
    />
  )
}
