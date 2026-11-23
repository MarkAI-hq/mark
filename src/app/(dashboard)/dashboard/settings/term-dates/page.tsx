import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getCurrentTermStatus, getSchoolTerms } from '@/lib/actions/academic-calendar'
import { TermDatesClient } from './_components/term-dates-client'

export default async function TermDatesSettingsPage() {
  const user = await getSession()
  if (!user || !user.organizationId) redirect('/login')
  if (user.role !== 'Admin') redirect('/dashboard')

  const year = new Date().getFullYear()
  const [terms, status] = await Promise.all([getSchoolTerms(year), getCurrentTermStatus()])

  if (terms.error || !terms.data) {
    return (
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Term Dates</h3>
        <p className="text-sm text-muted-foreground">Couldn&apos;t load term dates. Please try again.</p>
      </div>
    )
  }

  return <TermDatesClient year={year} initial={terms.data} status={status.data ?? null} />
}
