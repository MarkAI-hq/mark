import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  getStudentSubjectProgress,
  getStudentStudyPlans,
  getStudentPredictions,
  getMyClassSoW,
} from '@/lib/actions/student-dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge }    from '@/components/ui/badge'
import { Button }   from '@/components/ui/button'
import {
  ArrowLeft, BookOpenCheck, TrendingUp, Target,
  CheckCircle2, AlertCircle, Sparkles,
} from 'lucide-react'
import { formatTopicTitle } from '@/lib/utils'
import { CompletedPlansTable } from '@/components/students/completed-plans-table'
import { PendingPlansTable } from '@/components/students/pending-plans-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface Props {
  params: Promise<{ subject: string }>
}

const masteryColor: Record<string, string> = {
  strong: 'text-emerald-600', developing: 'text-amber-600',
  at_risk: 'text-orange-600', critical: 'text-rose-600',
}
const masteryBg: Record<string, string> = {
  strong: 'bg-emerald-500', developing: 'bg-amber-400',
  at_risk: 'bg-orange-500', critical: 'bg-rose-600',
}

export default async function SubjectDetailPage({ params }: Props) {
  const { subject: encodedSubject } = await params
  const subject = decodeURIComponent(encodedSubject)

  const cookieStore = await cookies()
  const userCookie  = cookieStore.get('user')?.value
  if (!userCookie) redirect('/student/login')

  let user: any = null
  try { user = JSON.parse(decodeURIComponent(userCookie)) }
  catch { redirect('/student/login') }

  const studentId = user?.user_id ?? user?.id

  const [progressList, plans, predictions, sowData] = await Promise.all([
    getStudentSubjectProgress(studentId),
    getStudentStudyPlans(studentId),
    getStudentPredictions(studentId),
    getMyClassSoW(),
  ])

  const progress   = progressList.find((s: any) => s.subject === subject)
  const prediction = predictions.find((p: any) => p.subject === subject)
  const subjectPlans = plans.filter((p: any) => p.subject === subject)
  const sowEntries = (sowData.currentWeekEntries ?? []).filter((e: any) => e.subject === subject)

  const pending   = subjectPlans.filter((p: any) => p.status === 'pending' || p.status === 'sent')
  const completed = subjectPlans.filter((p: any) => p.status === 'completed')
  const mastery   = progress?.mastery_label ?? 'developing'
  const avg       = progress?.avg_percentage ?? null

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/student/subjects">
          <Button variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Subjects
          </Button>
        </Link>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight">{subject}</h1>
          {avg !== null && (
            <span className={`text-lg font-bold ${masteryColor[mastery]}`}>{avg}%</span>
          )}
          {prediction && (
            <Badge variant="outline" className="border-gold/40 text-gold">
              {prediction.predicted_grade} predicted
            </Badge>
          )}
        </div>
        {avg !== null && (
          <div className="h-2 max-w-xs rounded-full bg-muted overflow-hidden mt-2">
            <div className={`h-full rounded-full ${masteryBg[mastery]}`} style={{ width: `${avg}%` }} />
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{pending.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{completed.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold">{subjectPlans.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Plans</p>
          </CardContent>
        </Card>
      </div>

      {/* Prediction detail */}
      {prediction && (
        <Card className="border-gold/30 bg-gold/5">
          <CardContent className="pt-4 pb-3 space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-gold" />
              <span className="text-sm font-semibold">Exam Prediction</span>
            </div>
            <div className="flex items-center gap-4 flex-wrap text-sm">
              <span>Predicted: <strong>{prediction.predicted_grade}</strong> ({prediction.predicted_score}%)</span>
              {prediction.gap_to_next_grade > 0 && (
                <span className="text-muted-foreground">
                  +{prediction.gap_to_next_grade}% to {prediction.next_grade}
                </span>
              )}
              {prediction.weeks_to_exam != null && (
                <span className="text-muted-foreground">{prediction.weeks_to_exam} wks to exam</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* This week from SoW */}
      {sowEntries.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <BookOpenCheck className="h-4 w-4 text-muted-foreground" />
            This Week
          </h2>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Topic</TableHead>
                  <TableHead>Week</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sowEntries.map((entry: any) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {entry.is_delivered
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          : <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                        }
                        {formatTopicTitle(entry.topic)}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">Week {entry.week_number}</TableCell>
                    <TableCell>
                      {entry.is_delivered && (
                        <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200">
                          Delivered
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Pending study plans */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold" />
            Study Plans — Waiting
          </h2>
          <PendingPlansTable plans={pending} showSubject={false} />
        </div>
      )}

      {/* Completed plans */}
      {completed.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Completed
          </h2>
          <CompletedPlansTable plans={completed} showSubject={false} />
        </div>
      )}

      {subjectPlans.length === 0 && sowEntries.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpenCheck className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="font-medium text-muted-foreground">No activity yet for {subject}</p>
            <p className="text-sm text-muted-foreground mt-1">Check back once your teacher assigns work.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
