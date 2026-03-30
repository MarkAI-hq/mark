// src/app/(dashboard)/dashboard/teacher/settings/layout.tsx
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'

export default async function TeacherSettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSession()
  if (!user) redirect('/login')
  if (user.role !== 'Teacher') redirect('/dashboard')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your personal account preferences.
        </p>
      </div>
      <div className="flex flex-col gap-6">{children}</div>
    </div>
  )
}