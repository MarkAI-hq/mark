import { Metadata } from 'next'
import { RootSettingsClient } from './_components/root-settings-client'

export const metadata: Metadata = { title: 'Settings — Mark Platform' }

export default function RootSettingsPage() {
  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Manage your own platform-operator account.
        </p>
      </div>

      <RootSettingsClient />
    </div>
  )
}
