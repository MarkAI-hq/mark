import { redirect }    from 'next/navigation'
import Link           from 'next/link'
import { getSession } from '@/lib/session'
import { getClassesWithTeachers } from '@/lib/actions/classes'
import { CalendarCheck2, Users, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function AttendancePage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role === 'Student') redirect('/student/dashboard')

  const { data: classes } = await getClassesWithTeachers()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Select a class to view or record attendance.
        </p>
      </div>

      {!classes || classes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No classes found. Create a class first.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {classes.map((cls) => (
            <Link
              key={cls.class_id}
              href={`/dashboard/classes/${cls.class_id}/attendance`}
              className="group"
            >
              <Card className="hover:border-slate-300 transition-colors">
                <CardHeader className="py-4 px-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 shrink-0">
                        <CalendarCheck2 className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold text-slate-800">
                          {cls.name}
                        </CardTitle>
                        {cls.description && (
                          <p className="text-xs text-slate-400 mt-0.5">{cls.description}</p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
