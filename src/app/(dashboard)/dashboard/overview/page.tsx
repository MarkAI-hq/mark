import { getSession } from '@/lib/session'
import { redirect }   from 'next/navigation'
import { fetcher }    from '@/lib/fetch'
import { OverviewClient } from './_components/overview-client'

async function getClasses() {
  const res = await fetcher<any[]>('/classes')
  return res.data ?? []
}

export default async function OverviewPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role === 'Student') redirect('/student/dashboard')

  const classes = await getClasses()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Organisation Overview</h1>
        <p className="text-sm text-muted-foreground">
          Attendance, SoW delivery, and study plan progress across all classes
        </p>
      </div>
      <OverviewClient classes={classes} />
    </div>
  )
}
