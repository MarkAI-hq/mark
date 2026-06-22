import { redirect }         from 'next/navigation'
import Link                  from 'next/link'
import { getSession }        from '@/lib/session'
import { listSchemeOfWork }  from '@/lib/actions/scheme-of-work'
import { BookOpen, ChevronRight, Layers } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge }             from '@/components/ui/badge'

const statusColor: Record<string, string> = {
  active:   'bg-green-100 text-green-800 border-green-200',
  draft:    'bg-slate-100 text-slate-700 border-slate-200',
  archived: 'bg-amber-100 text-amber-700 border-amber-200',
}

export default async function SchemeOfWorkPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role === 'Student') redirect('/student/dashboard')

  const { data: schemes } = await listSchemeOfWork()
  const list = schemes ?? []

  // Group by subject
  const bySubject = list.reduce<Record<string, typeof list>>((acc, sow) => {
    const key = sow.subject
    if (!acc[key]) acc[key] = []
    acc[key].push(sow)
    return acc
  }, {})

  const subjects = Object.keys(bySubject).sort()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Schemes of Work</h1>
        <p className="text-slate-500 mt-1 text-sm">
          All schemes of work across your school, grouped by subject.
        </p>
      </div>

      {subjects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No schemes of work yet.</p>
            <p className="text-slate-400 text-xs mt-1">
              Create one from a class page using the Scheme of Work tab.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {subjects.map((subject) => {
            const rows = bySubject[subject]
            return (
              <div key={subject}>
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="h-4 w-4 text-slate-400" />
                  <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                    {subject}
                  </h2>
                  <span className="text-xs text-slate-400">· {rows.length} scheme{rows.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="grid gap-2">
                  {rows.map((sow) => (
                    <Link
                      key={sow.id}
                      href={`/dashboard/scheme-of-work/${sow.id}`}
                      className="group"
                    >
                      <Card className="hover:border-slate-300 transition-colors">
                        <CardContent className="py-3.5 px-5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 shrink-0">
                                <BookOpen className="h-3.5 w-3.5 text-slate-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-800">{sow.title}</p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {sow.grade_level} · {sow.term} {sow.academic_year} · {sow.total_weeks} weeks
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={`text-xs capitalize ${statusColor[sow.status] ?? ''}`}>
                                {sow.status}
                              </Badge>
                              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
