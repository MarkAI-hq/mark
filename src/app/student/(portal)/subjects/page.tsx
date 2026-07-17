import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  getStudentSubjectProgress,
  getStudentStudyPlans,
  getMyClassSoW,
  getStudentPredictions,
} from '@/lib/actions/student-dashboard'
import { SubjectsClient } from './_components/subjects-client'

export default async function SubjectsPage() {
  const cookieStore = await cookies()
  const userCookie  = cookieStore.get('user')?.value
  if (!userCookie) redirect('/student/login')

  let user: any = null
  try { user = JSON.parse(decodeURIComponent(userCookie)) }
  catch { redirect('/student/login') }

  const studentId = user?.user_id ?? user?.id
  if (!studentId) redirect('/student/login')

  const [subjectProgress, studyPlans, sowData, predictions] = await Promise.all([
    getStudentSubjectProgress(studentId),
    getStudentStudyPlans(studentId),
    getMyClassSoW(),
    getStudentPredictions(studentId),
  ])

  return (
    <SubjectsClient
      user={user}
      subjectProgress={subjectProgress}
      studyPlans={studyPlans}
      sow={sowData.sow}
      currentWeekEntries={sowData.currentWeekEntries}
      predictions={predictions}
      classId={sowData.classId} // <-- Pass classId as a prop
    />
  )
}