// src/app/student/(portal)/my-pathway/page.tsx

import { redirect }       from 'next/navigation'
import { cookies }        from 'next/headers'
import { getStudentPrediction } from '@/lib/actions/prediction'
import { getStudentPredictions, getMyClassSoW } from '@/lib/actions/student-dashboard'
import { PathwayClient } from './_components/pathway-client' // <-- Clean client wrapper import [1]

export const dynamic = 'force-dynamic'

export default async function MyPathwayPage({
  searchParams,
}: {
  searchParams: Promise<{ curriculumId?: string; subject?: string }>
}) {
  const cookieStore = await cookies()
  const userCookie  = cookieStore.get('user')?.value
  if (!userCookie) redirect('/student/login')

  let user: any = null
  try { user = JSON.parse(decodeURIComponent(userCookie)) } catch { redirect('/student/login') }

  const studentId = user?.user_id ?? user?.id
  if (!studentId) redirect('/student/login')

  // 1. Resolve Class assignment to implement portal-wide gating coherence [4]
  const sowData = await getMyClassSoW()
  const hasClass = !!sowData.classId

  // 2. Resolve predictions list [4]
  const predictions = hasClass ? await getStudentPredictions(studentId) : []

  // 3. Resolve target curriculum details [4]
  const { curriculumId: curriculumIdParam, subject: subjectParam } = await searchParams
  let curriculumId = curriculumIdParam ?? ''

  if (hasClass && !curriculumId && subjectParam) {
    const match = predictions.find(
      (p) => p.subject?.toLowerCase() === subjectParam.toLowerCase(),
    )
    if (match) curriculumId = match.curriculum_id
  }

  // 4. Fetch the detailed prediction if a subject curriculum is resolved [4]
  let prediction: any = null
  if (hasClass && (curriculumId || predictions.length > 0)) {
    const targetId = curriculumId || predictions[0]?.curriculum_id
    if (targetId) {
      const { data } = await getStudentPrediction(studentId, targetId)
      prediction = data ?? null
    }
  }

  return (
    <PathwayClient
      user={user}
      hasClass={hasClass}
      predictions={predictions}
      prediction={prediction}
      curriculumId={curriculumId}
    />
  )
}