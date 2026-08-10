// src/app/student/dashboard/page.tsx

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  getStudentDashboard,
  getStudentSubmissions,
  getStudentExamHistory,
  getStudentLearningTools,
  getStudentStudyPlans,
  getStudentSocialProof,
  getStudentSubjectProgress,
  getStudentPredictions,
  getMyClassSoW,
  getNextAction,
} from '@/lib/actions/student-dashboard'
import { fetcher } from '@/lib/fetch'
import { StudentDashboardClient } from '@/components/students/student-dashboard-client'

interface Props {
  searchParams: Promise<{ tour?: string }>
}

export default async function StudentDashboardPage({ searchParams }: Props) {
  const cookieStore = await cookies()
  const userCookie  = cookieStore.get('user')?.value

  if (!userCookie) redirect('/student/login')

  let user: any = null
  try {
    user = JSON.parse(decodeURIComponent(userCookie))
  } catch {
    redirect('/student/login')
  }

  const studentId = user?.user_id ?? user?.id
  if (!studentId) redirect('/student/login')

  // Only ever set by the post-onboarding redirect ("welcome") or the Help
  // page's explicit "Retake the tour" link ("replay") — a normal dashboard
  // visit carries neither, so an existing student never sees the tour just
  // because their browser/device has no local "seen it" record.
  const { tour } = await searchParams
  const tourTrigger = tour === 'welcome' || tour === 'replay' ? tour : null

  // 1. Resolve Class assignment first so we don't over-fetch data for pending students
  const sowData = await getMyClassSoW()
  const hasClass = !!sowData.classId

  // 2. If the student has no class (pending approval), skip the intensive analytics fetches [4]
  if (!hasClass) {
    return (
      <StudentDashboardClient
        user={user}
        analytics={null}
        currentProfile={null}
        submissions={[]}
        examHistory={[]}
        tools={[]}
        studyPlans={[]}
        streak={user?.study_streak ?? 0}
        socialProof={null}
        subjectProgress={[]}
        predictions={[]}
        currentWeekEntries={[]}
        nextAction={null}
        classId={sowData.classId}
        classFetchFailed={sowData.fetchFailed}
        tourTrigger={null}
      />
    )
  }

  // 3. Active students get the full parallelized data fetch
  const [
    { analytics, currentProfile },
    submissions,
    examHistory,
    tools,
    studyPlans,
    streakRes,
    socialProof,
    subjectProgress,
    predictions,
    nextAction,
  ] = await Promise.all([
    getStudentDashboard(studentId),
    getStudentSubmissions(studentId),
    getStudentExamHistory(studentId), // Note: Consider optimizing/lazy-loading this to prevent N+1 queries
    getStudentLearningTools(studentId),
    getStudentStudyPlans(studentId),
    fetcher<{ study_streak: number }>(`/students/${studentId}/streak`).catch(() => ({ data: null, error: null })),
    getStudentSocialProof(studentId),
    getStudentSubjectProgress(studentId),
    getStudentPredictions(studentId),
    getNextAction(),
  ])

  const streak = (streakRes as any)?.data?.study_streak ?? user?.study_streak ?? 0

  return (
    <StudentDashboardClient
      user={user}
      analytics={analytics}
      currentProfile={currentProfile}
      submissions={submissions}
      examHistory={examHistory}
      tools={tools}
      studyPlans={studyPlans}
      streak={streak}
      socialProof={socialProof}
      subjectProgress={subjectProgress}
      predictions={predictions}
      currentWeekEntries={sowData.currentWeekEntries}
      nextAction={nextAction}
      classId={sowData.classId}
      tourTrigger={tourTrigger}
    />
  )
}