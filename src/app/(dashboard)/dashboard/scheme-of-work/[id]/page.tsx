import { redirect, notFound } from 'next/navigation'
import Link                    from 'next/link'
import { getSession }          from '@/lib/session'
import { getSchemeOfWork }     from '@/lib/actions/scheme-of-work'
import {
  BookOpen, ChevronLeft, CheckCircle2, Circle, School, CalendarDays, Hash,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Props {
  params: Promise<{ id: string }>
}

const statusColor: Record<string, string> = {
  active:   'bg-green-100 text-green-800 border-green-200',
  draft:    'bg-amber-100 text-amber-700 border-amber-200',
  archived: 'bg-slate-100 text-slate-600 border-slate-200',
}

export default async function SchemeOfWorkDetailPage({ params }: Props) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  const { data: sow, error } = await getSchemeOfWork(id)
  if (!sow || error) notFound()

  const entries        = sow.entries        ?? []
  const assignedClasses = sow.assignedClasses ?? []
  const delivered      = entries.filter((e) => e.is_delivered).length
  const progressPct    = entries.length > 0 ? Math.round((delivered / entries.length) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Breadcrumb + header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
          <Link href="/dashboard/scheme-of-work" className="hover:text-slate-600 transition-colors">
            Schemes of Work
          </Link>
          <ChevronLeft className="h-3 w-3 rotate-180" />
          <span className="text-slate-600 font-medium">{sow.subject}</span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{sow.title}</h1>
            <p className="text-slate-500 text-sm mt-1">
              {sow.subject} · {sow.grade_level} · {sow.term} {sow.academic_year}
            </p>
          </div>
          <Badge className={`text-xs capitalize shrink-0 ${statusColor[sow.status] ?? ''}`}>
            {sow.status}
          </Badge>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Hash className="h-3.5 w-3.5" />
              <span className="text-xs uppercase tracking-wide">Weeks</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{sow.total_weeks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="text-xs uppercase tracking-wide">Delivered</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{delivered}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <CalendarDays className="h-3.5 w-3.5" />
              <span className="text-xs uppercase tracking-wide">Progress</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {entries.length > 0 ? `${progressPct}%` : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <School className="h-3.5 w-3.5" />
              <span className="text-xs uppercase tracking-wide">Classes</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{assignedClasses.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly entries — takes 2/3 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Weekly Topics
                <span className="text-xs font-normal text-muted-foreground ml-1">({entries.length} entries)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {entries.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">No entries yet.</p>
              ) : (
                <div className="divide-y">
                  {entries.map((e) => (
                    <div key={e.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                      <div className="mt-0.5 shrink-0">
                        {e.is_delivered
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          : <Circle       className="h-4 w-4 text-slate-300" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 shrink-0 w-10">Wk {e.week_number}</span>
                          <span className="text-sm font-medium text-slate-800 truncate">{e.topic}</span>
                          {e.duration_lessons > 1 && (
                            <span className="text-xs text-slate-400 shrink-0">{e.duration_lessons}L</span>
                          )}
                        </div>
                        {e.learning_objectives && e.learning_objectives.length > 0 && (
                          <p className="text-xs text-slate-400 mt-0.5 ml-12 line-clamp-1">
                            {e.learning_objectives[0]}
                            {e.learning_objectives.length > 1 && ` +${e.learning_objectives.length - 1} more`}
                          </p>
                        )}
                      </div>
                      {e.is_delivered && e.actual_delivery_date && (
                        <span className="text-xs text-slate-400 shrink-0">
                          {new Date(e.actual_delivery_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar — assigned classes */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <School className="h-4 w-4 text-muted-foreground" />
                Assigned Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignedClasses.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">Not assigned to any class yet.</p>
              ) : (
                <div className="space-y-1">
                  {assignedClasses.map((cls) => (
                    <Link
                      key={cls.class_id}
                      href={`/dashboard/classes/${cls.class_id}`}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors group"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800 group-hover:text-slate-900">
                          {cls.name}
                        </p>
                        {cls.grade_level && (
                          <p className="text-xs text-slate-400">{cls.grade_level}</p>
                        )}
                      </div>
                      <ChevronLeft className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 rotate-180 transition-colors" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Term start</span>
                <span className="font-medium text-slate-700">
                  {new Date(sow.term_start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Academic year</span>
                <span className="font-medium text-slate-700">{sow.academic_year}</span>
              </div>
              {sow.curriculum_id && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Curriculum</span>
                  <span className="font-medium text-slate-700 truncate ml-4">{sow.curriculum_id}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
