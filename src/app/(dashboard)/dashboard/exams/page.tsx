// src/app/(dashboard)/dashboard/exams/page.tsx

import { Suspense }     from 'react'
import { Metadata }     from 'next'
import Link             from 'next/link'
import { ChevronRight } from 'lucide-react'
import { ExamsClient }  from '@/app/(dashboard)/dashboard/exams/exams-client'
import { getAssessments }                          from '@/lib/actions/assessments'
import { getSubjects }                             from '@/lib/actions/subjects'
import { getClasses, getMyActiveClasses, getMyCoursesAsSubjects } from '@/lib/actions/classes'
import { getSession }   from '@/lib/session'

export const metadata: Metadata = {
  title: 'Assessments - Mark',
  description: 'Manage your assessments',
}

export default async function ExamsPage() {
  const user      = await getSession()
  const isTeacher = user?.role === 'Teacher'

  const { data: assessments } = await getAssessments()

  let subjects: { id: string; name: string }[]       = []
  let classes:  { class_id: string; name: string }[] = []

  if (isTeacher) {
    const [subjectsRes, classesRes] = await Promise.all([
      getMyCoursesAsSubjects(),
      getMyActiveClasses(),
    ])
    subjects = subjectsRes.data ?? []
    classes  = (classesRes.data ?? []).map((c) => ({ class_id: c.class_id, name: c.name }))
  } else {
    const [subjectsRes, classesRes] = await Promise.all([
      getSubjects(),
      getClasses(),
    ])
    subjects = (subjectsRes.data ?? [])
      .map((s: any) => ({ id: s.subject_id ?? s.id, name: s.name }))
      .filter((s) => s.id && s.name)
    classes = (classesRes.data ?? [])
      .map((c: any) => ({ class_id: c.class_id, name: c.name }))
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">

      {/* ── Breadcrumb ───────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/dashboard/exam-builder" className="hover:text-foreground transition-colors">
          Examination Centre
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">Assessments</span>
      </nav>

      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Assessments</h2>
      </div>

      <Suspense fallback={null}>
        <ExamsClient
          assessments={assessments ?? []}
          subjects={subjects}
          classes={classes}
          role={isTeacher ? 'Teacher' : 'Admin'}
        />
      </Suspense>
    </div>
  )
}