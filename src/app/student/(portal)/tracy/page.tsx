import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getStudentSubjectProgress, getMyClassSoW } from '@/lib/actions/student-dashboard'
import { getMyNotes } from '@/lib/actions/student-notes'
import { StudentTracyPage } from '@/components/students/student-tracy'

export const metadata = {
  title: 'Tracy — Learning Companion',
  description: 'Your AI learning companion powered by Mirror Intelligence',
}

interface Props {
  searchParams: Promise<{ prompt?: string }>
}

export default async function StudentTracyRoute({ searchParams }: Props) {
  const cookieStore = await cookies()
  const userCookie  = cookieStore.get('user')?.value
  if (!userCookie) redirect('/student/login')

  let user: any = null
  try { user = JSON.parse(decodeURIComponent(userCookie)) }
  catch { redirect('/student/login') }

  const studentId = user?.user_id ?? user?.id
  if (!studentId) redirect('/student/login')

  const [subjectProgress, sowData, notesRes, { prompt }] = await Promise.all([
    getStudentSubjectProgress(studentId),
    getMyClassSoW(),
    getMyNotes(),
    searchParams,
  ])

  const weakSubjects  = subjectProgress
    .filter((s) => s.mastery_label === 'at_risk' || s.mastery_label === 'critical')
    .map((s) => s.subject)

  const currentTopics = sowData.currentWeekEntries.map((e: any) => e.topic).filter(Boolean)
  const initialNotes  = notesRes.data ?? []

  return (
    <StudentTracyPage
      user={user}
      weakSubjects={weakSubjects}
      currentTopics={currentTopics}
      subjectProgress={subjectProgress}
      initialNotes={initialNotes}
      initialPrompt={prompt}
    />
  )
}
