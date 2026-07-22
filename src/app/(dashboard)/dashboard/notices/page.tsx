import { Metadata } from 'next'
import { getSchoolNotices } from '@/lib/actions/school-notices'
import { NoticesClient } from './_components/notices-client'

export const metadata: Metadata = { title: 'Notices & Calendar — Mark' }

export default async function NoticesPage() {
  const { data: notices } = await getSchoolNotices()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notices &amp; Calendar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Post announcements and events your students will see on their School Life tab.
        </p>
      </div>
      <NoticesClient initial={notices ?? []} />
    </div>
  )
}
