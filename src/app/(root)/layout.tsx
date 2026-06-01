import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { RootShell } from '@/components/layout/root-shell'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session) redirect('/login')

  const role = (session as { role?: string; roles?: string[] }).role
    ?? (session as { roles?: string[] }).roles?.[0]

  if (role !== 'Root' && role !== 'Support') redirect('/login')

  return <RootShell>{children}</RootShell>
}
