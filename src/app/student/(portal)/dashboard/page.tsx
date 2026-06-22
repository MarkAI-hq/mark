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

export default async function StudentDashboardPage() {
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
    sowData,
    nextAction,
  ] = await Promise.all([
    getStudentDashboard(studentId),
    getStudentSubmissions(studentId),
    getStudentExamHistory(studentId),
    getStudentLearningTools(studentId),
    getStudentStudyPlans(studentId),
    fetcher<{ study_streak: number }>(`/students/${studentId}/streak`).catch(() => ({ data: null, error: null })),
    getStudentSocialProof(studentId),
    getStudentSubjectProgress(studentId),
    getStudentPredictions(studentId),
    getMyClassSoW(),
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
    />
  )
}