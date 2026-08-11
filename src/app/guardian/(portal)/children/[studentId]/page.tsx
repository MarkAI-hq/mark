import Link from 'next/link'
import { CreditCard } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getChildOverview } from '@/lib/actions/guardian'

export default async function GuardianChildOverviewPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  const { data: overview, error } = await getChildOverview(studentId)

  if (error || !overview) {
    return (
      <p className="text-sm text-destructive">
        Couldn&apos;t load this child&apos;s overview right now.
      </p>
    )
  }

  const { attendance, submissions, mastery, organization_name } = overview

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Overview</h1>
          {organization_name && (
            <p className="text-sm text-muted-foreground">{organization_name}</p>
          )}
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/guardian/children/${studentId}/billing`}>
            <CreditCard className="mr-2 h-4 w-4" />
            Billing
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {attendance.attendance_rate != null ? `${attendance.attendance_rate}%` : '—'}
            </p>
            <p className="text-xs text-muted-foreground">
              {attendance.present_count}/{attendance.total_sessions} sessions present
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{submissions.length}</p>
            <p className="text-xs text-muted-foreground">recent assessments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Topics mastered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {mastery.filter((m) => m.achieved_count > 0).length}
            </p>
            <p className="text-xs text-muted-foreground">of {mastery.length} tracked</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent submissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {submissions.length === 0 && (
            <p className="text-sm text-muted-foreground">No submissions yet.</p>
          )}
          {submissions.slice(0, 10).map((s) => (
            <div
              key={s.submission_id}
              className="flex items-center justify-between border-b border-border/30 pb-2 last:border-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.subject}</p>
              </div>
              <Badge variant={s.total_score != null ? 'default' : 'secondary'}>
                {s.total_score != null && s.max_score != null
                  ? `${s.total_score}/${s.max_score}`
                  : 'Pending'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
