import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft, User, Mail, Calendar, GraduationCap,
  BookOpen, ClipboardList, Brain, ChevronRight,
  ShieldCheck, Clock, Trophy,
} from 'lucide-react'

import { getStudent } from '@/lib/actions/students'
import { getStudentEnrollments, getStudentSubmissions, getStudentCognitiveProfiles } from '@/lib/actions/student-details'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { data: student } = await getStudent(id)
  const name = student ? `${student.first_name} ${student.last_name}`.trim() : 'Student'
  return { title: `${name} · Students · Mark` }
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function scorePercent(score: number | null, max: number | null) {
  if (score === null || !max) return null
  return Math.round((score / max) * 100)
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active:    'bg-emerald-100 text-emerald-700',
    dropped:   'bg-red-100 text-red-700',
    completed: 'bg-[#f5edda] text-[#7a6230]',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    PENDING:   'bg-muted text-muted-foreground',
    PROCESSING:'bg-blue-100 text-blue-700',
    FAILED:    'bg-red-100 text-red-700',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${map[status] ?? 'bg-muted text-muted-foreground'}`}>
      {status}
    </span>
  )
}

export default async function StudentDetailPage({ params }: Props) {
  const { id } = await params

  const [studentRes, enrollmentsRes, submissionsRes, cognitiveRes] = await Promise.all([
    getStudent(id),
    getStudentEnrollments(id),
    getStudentSubmissions(id),
    getStudentCognitiveProfiles(id),
  ])

  if (studentRes.error || !studentRes.data) notFound()

  const student     = studentRes.data
  const enrollments = enrollmentsRes.data ?? []
  const submissions = submissionsRes.data ?? []
  const cognitive   = cognitiveRes.data ?? []

  const name          = `${student.first_name} ${student.last_name}`.trim()
  const currentProfile = cognitive.find(c => c.is_current)

  const completedSubmissions = submissions.filter(s => s.grading_status === 'COMPLETED')
  const avgScore = completedSubmissions.length
    ? Math.round(
        completedSubmissions.reduce((sum, s) => {
          const pct = scorePercent(s.total_score, s.max_score)
          return sum + (pct ?? 0)
        }, 0) / completedSubmissions.length,
      )
    : null

  const displayEmail =
    student.email?.endsWith('@students.mirrorintelligence.com') || student.email?.includes('.local')
      ? null
      : student.email

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-5xl">

      {/* Back + header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground">
          <Link href="/dashboard/students">
            <ArrowLeft className="h-4 w-4" />Back to Students
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full text-white text-xl font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg, #c9a84c, #7a6230)' }}>
            {student.first_name[0]}{(student.last_name?.[0] ?? '')}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {student.student_school_id && (
                <span className="text-sm text-muted-foreground font-mono">ID: {student.student_school_id}</span>
              )}
              <StatusBadge status={student.enrollment_status} />
              {!student.is_active && <StatusBadge status="Inactive" />}
            </div>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild className="gap-1.5 border-[#e8d5a3] text-[#7a6230] hover:bg-[#f5edda]">
            <Link href={`/dashboard/students/${id}/assess`}>
              <Brain className="h-3.5 w-3.5" />Assess
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <Link href={`/dashboard/students/${id}/record`}>
              <ClipboardList className="h-3.5 w-3.5" />Proof of Learning
            </Link>
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Classes',     value: enrollments.length,                       icon: BookOpen },
          { label: 'Submissions', value: submissions.length,                        icon: ClipboardList },
          { label: 'Avg Score',   value: avgScore !== null ? `${avgScore}%` : '—', icon: Trophy },
          { label: 'Profile',     value: currentProfile?.profile_name ?? '—',      icon: Brain },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border-[#e8d5a3]/60">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Icon className="h-3.5 w-3.5" style={{ color: '#c9a84c' }} />
                <span className="text-xs">{label}</span>
              </div>
              <p className="text-xl font-bold text-foreground truncate">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Profile info */}
        <Card className="border-[#e8d5a3]/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: '#7a6230' }}>
              <User className="h-4 w-4" />Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              { icon: Mail,           label: 'Email',        value: displayEmail ?? '—' },
              { icon: Calendar,       label: 'Date of Birth',value: formatDate(student.date_of_birth) },
              { icon: User,           label: 'Gender',       value: student.gender ?? '—' },
              { icon: GraduationCap,  label: 'Grad Year',    value: student.expected_graduation_year ?? '—' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground w-24 shrink-0">{label}</span>
                <span className="font-medium truncate">{String(value)}</span>
              </div>
            ))}

            {(student.guardian_name || student.guardian_email || student.guardian_phone) && (
              <div className="pt-3 mt-3 border-t space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Guardian</p>
                {student.guardian_name  && <div className="flex gap-2"><User className="h-3.5 w-3.5 text-muted-foreground mt-0.5" /><span>{student.guardian_name}</span></div>}
                {student.guardian_email && <div className="flex gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground mt-0.5" /><span>{student.guardian_email}</span></div>}
                {student.guardian_phone && <div className="flex gap-2"><User className="h-3.5 w-3.5 text-muted-foreground mt-0.5" /><span>{student.guardian_phone}</span></div>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enrollments */}
        <Card className="border-[#e8d5a3]/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: '#7a6230' }}>
              <BookOpen className="h-4 w-4" />Classes ({enrollments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enrollments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Not enrolled in any classes.</p>
            ) : (
              <ul className="space-y-2">
                {enrollments.map(e => (
                  <li key={e.enrollment_id}
                    className="flex items-center justify-between rounded-md border border-[#e8d5a3]/60 px-3 py-2 text-sm">
                    <div>
                      <Link href={`/dashboard/classes/${e.class_id}`}
                        className="font-medium hover:underline" style={{ color: '#7a6230' }}>
                        {e.class_name}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(e.enrollment_date)}</p>
                    </div>
                    <StatusBadge status={e.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Cognitive profile */}
        <Card className="border-[#e8d5a3]/60">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: '#7a6230' }}>
              <Brain className="h-4 w-4" />Cognitive Profile
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="h-7 text-xs gap-1 text-[#7a6230] hover:bg-[#f5edda]">
              <Link href={`/dashboard/students/${id}/assess`}>
                Assess<ChevronRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {!currentProfile ? (
              <div className="text-sm text-muted-foreground">
                No cognitive profile yet.{' '}
                <Link href={`/dashboard/students/${id}/assess`} className="underline" style={{ color: '#c9a84c' }}>
                  Run an assessment
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-md px-4 py-3 border border-[#e8d5a3]" style={{ background: '#f5edda60' }}>
                  <p className="font-semibold" style={{ color: '#7a6230' }}>{currentProfile.profile_name}</p>
                  {currentProfile.profile_description && (
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{currentProfile.profile_description}</p>
                  )}
                </div>
                {currentProfile.profile_focus && (
                  <p className="text-xs text-muted-foreground"><span className="font-medium">Focus:</span> {currentProfile.profile_focus}</p>
                )}
                {(currentProfile.mental_energy_score !== null || currentProfile.learning_strategy_score !== null) && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {currentProfile.mental_energy_score !== null && (
                      <div className="text-center rounded-md border border-[#e8d5a3]/60 py-2">
                        <p className="text-lg font-bold" style={{ color: '#c9a84c' }}>{currentProfile.mental_energy_score}</p>
                        <p className="text-[10px] text-muted-foreground">Mental Energy</p>
                      </div>
                    )}
                    {currentProfile.learning_strategy_score !== null && (
                      <div className="text-center rounded-md border border-[#e8d5a3]/60 py-2">
                        <p className="text-lg font-bold" style={{ color: '#c9a84c' }}>{currentProfile.learning_strategy_score}</p>
                        <p className="text-[10px] text-muted-foreground">Learning Strategy</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent submissions */}
        <Card className="border-[#e8d5a3]/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: '#7a6230' }}>
              <ShieldCheck className="h-4 w-4" />Recent Submissions ({submissions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No submissions yet.</p>
            ) : (
              <ul className="space-y-2">
                {submissions.slice(0, 6).map(s => {
                  const pct = scorePercent(s.total_score, s.max_score)
                  return (
                    <li key={s.submission_id}
                      className="flex items-center justify-between rounded-md border border-[#e8d5a3]/60 px-3 py-2 text-sm gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{s.assessment_title ?? 'Untitled'}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-muted-foreground text-xs">
                          <Clock className="h-3 w-3" />{formatDate(s.submitted_at)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {pct !== null && (
                          <span className="font-bold text-sm" style={{ color: pct >= 70 ? '#16a34a' : pct >= 50 ? '#c9a84c' : '#dc2626' }}>
                            {pct}%
                          </span>
                        )}
                        <StatusBadge status={s.grading_status} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
