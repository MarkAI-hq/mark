import { getMyChildren } from '@/lib/actions/guardian'
import { NotificationSettingsClient } from './_components/notification-settings-client'

export default async function GuardianSettingsPage() {
  const { data: children } = await getMyChildren()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Choose which updates you get notified about, per child.
        </p>
      </div>

      <NotificationSettingsClient students={children ?? []} />
    </div>
  )
}
