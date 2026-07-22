import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getMyClassmates, getStudentSocialProof, getMyClassSoW, getLeaderboard } from '@/lib/actions/student-dashboard'
import { listExtrasForSchool, getMyEnrollments } from '@/lib/actions/extras'
import { getSchoolNotices } from '@/lib/actions/school-notices'
import { SchoolClient } from './_components/school-client'

export default async function SchoolPage() {
  const cookieStore = await cookies()
  const userCookie  = cookieStore.get('user')?.value
  if (!userCookie) redirect('/student/login')

  let user: any = null
  try { user = JSON.parse(decodeURIComponent(userCookie)) }
  catch { redirect('/student/login') }

  const studentId      = user?.user_id ?? user?.id
  const isMarketplace  = user?.enrollment_source === 'marketplace'

  if (!studentId) redirect('/student/login')

  const [classmatesData, socialProof, enrollmentsRes, sowData, initialLeaderboard, noticesRes] = await Promise.all([
    getMyClassmates(),
    getStudentSocialProof(studentId),
    getMyEnrollments(),
    getMyClassSoW(),
    isMarketplace ? Promise.resolve(null) : getLeaderboard('class', 'overall'),
    getSchoolNotices(),
  ])

  // Prefer school_code from the server response (classmates endpoint has it via JWT),
  // fall back to cookie for users who haven't re-logged in yet.
  const schoolCode = classmatesData.school_code
    ?? user?.school_code
    ?? user?.organization?.school_code
    ?? ''

  const extrasRes = schoolCode && !isMarketplace
    ? await listExtrasForSchool(schoolCode)
    : { data: [], error: null }

  const orgName = classmatesData.org_name
    ?? user?.organization?.name
    ?? user?.school_name
    ?? null

  return (
    <SchoolClient
      user={user}
      classmatesData={classmatesData}
      socialProof={socialProof}
      extras={extrasRes.data ?? []}
      enrollments={enrollmentsRes.data ?? []}
      isMarketplace={isMarketplace}
      classInfo={sowData.sow}
      orgName={orgName}
      initialLeaderboard={initialLeaderboard}
      notices={noticesRes.data ?? []}
    />
  )
}
