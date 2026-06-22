import { redirect }    from 'next/navigation'
import { getSession } from '@/lib/session'
import { getTeacherStudyPlansOverview } from '@/lib/actions/study-plans'
import Link from 'next/link'
import { Layers, CheckCircle2, Clock, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'text-slate-600',
  bg = 'bg-slate-100',
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number | string
  sub?: string
  color?: string
  bg?: string
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-start gap-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-sm font-medium text-slate-700 mt-0.5">{label}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

export default async function StudyPlansPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role === 'Student') redirect('/student/study-plans')

  const { data: overview } = await getTeacherStudyPlansOverview()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Study Plans</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Today&apos;s dispatch overview across all your classes.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Layers}
          label="Dispatched Today"
          value={overview?.dispatched_today ?? 0}
          bg="bg-blue-50"
          color="text-blue-600"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed Today"
          value={overview?.completed_today ?? 0}
          bg="bg-green-50"
          color="text-green-600"
        />
        <StatCard
          icon={Clock}
          label="Completion Rate"
          value={`${overview?.completion_rate ?? 0}%`}
          sub="of today's plans"
          bg="bg-amber-50"
          color="text-amber-600"
        />
        <StatCard
          icon={RefreshCw}
          label="Reviews Due"
          value={overview?.reviews_due ?? 0}
          sub="spaced repetition"
          bg="bg-purple-50"
          color="text-purple-600"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-700">
            Per-class breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-5">
          <p className="text-sm text-slate-500">
            Open a class from{' '}
            <Link href="/dashboard/classes" className="text-amber-600 hover:underline font-medium">
              Classes
            </Link>{' '}
            to see detailed study plan status per student.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
