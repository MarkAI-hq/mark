// src/app/(dashboard)/dashboard/teacher/page.tsx

import { redirect }          from 'next/navigation'
import { getSession }        from '@/lib/session'
import { getStats }          from '@/lib/actions/stats'
import { getMyClasses, getClassAnalytics, getClassAssessments, getAssignedCourses } from '@/lib/actions/classes'
import { TeacherDashboardClient } from '@/components/dashboard/teacher-dashboard-client'

export default async function TeacherDashboardPage() {
  const user = await getSession()
  if (!user)                   redirect('/login')
  if (user.role !== 'Teacher') redirect('/dashboard')

  const [stats, { data: classes }] = await Promise.all([
    getStats(),
    getMyClasses(),
  ])

  const activeClasses = (classes ?? []).filter((c) => c.status === 'active')

  // Fetch analytics + assessments + courses for all active classes in parallel
  const [classAnalytics, classAssessments, classCoursesRes] = await Promise.all([
    activeClasses.length > 0
      ? Promise.all(
          activeClasses.map((cls) =>
            getClassAnalytics(cls.class_id).then((analytics) => ({
              classId:   cls.class_id,
              className: cls.name,
              analytics,
            }))
          )
        )
      : Promise.resolve([]),
    activeClasses.length > 0
      ? Promise.all(activeClasses.map((cls) => getClassAssessments(cls.class_id)))
      : Promise.resolve([]),
    activeClasses.length > 0
      ? Promise.all(activeClasses.map((cls) => getAssignedCourses(cls.class_id)))
      : Promise.resolve([]),
  ])

  // Compute accurate stats from class data rather than relying on /stats
  // which may still scope by creator

  // Total unique students across all classes
  const totalStudents = classAnalytics.reduce(
    (sum, { analytics }) => sum + (analytics?.totalStudents ?? 0), 0,
  )

  // Total unique assessments across all classes (deduplicated by assessment_id)
  const seenAssessmentIds = new Set<string>()
  for (const res of classAssessments) {
    for (const a of res.data ?? []) {
      seenAssessmentIds.add(a.assessment_id)
    }
  }
  const totalAssessments = seenAssessmentIds.size

  // Unpublished drafts across all classes (for the drafts card)
  const allAssessments = classAssessments.flatMap((res) => res.data ?? [])
  const seenDraftIds   = new Set<string>()
  const uniqueDrafts   = allAssessments.filter((a) => {
    if (a.is_published || seenDraftIds.has(a.assessment_id)) return false
    seenDraftIds.add(a.assessment_id)
    return true
  })

  // Marked papers — total submissions graded across all classes
  const markedPapers = classAnalytics.reduce(
    (sum, { analytics }) =>
      sum + (analytics?.studentSummaries.reduce((s, st) => s + st.submissions, 0) ?? 0),
    0,
  )

  // Unique courses across all classes
  const seenCourseIds = new Set<string>()
  for (const res of classCoursesRes) {
    for (const course of res.data ?? []) {
      const id = course.course_id ?? (course as any).id
      if (id) seenCourseIds.add(id)
    }
  }
  const totalCourses = seenCourseIds.size

  // Override stats with accurate teacher-scoped values
  const teacherStats = {
    ...stats,
    totalStudents,
    totalExams:   totalAssessments,
    markedPapers,
    totalCourses,
    // Replace upcomingDeadlines (drafts) with class-scoped ones
    upcomingDeadlines: uniqueDrafts.map((a) => ({
      id:      a.assessment_id,
      title:   a.title,
      dueDate: a.createdAt ?? new Date().toISOString(),
    })),
  }

  return (
    <TeacherDashboardClient
      stats={teacherStats}
      classAnalytics={classAnalytics}
      user={user}
    />
  )
}