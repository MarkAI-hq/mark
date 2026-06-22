import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  getMyClassSoW,
  getMyClassTimetable,
  getMyAttendance,
  getMyPacingData,
  type PacingResponse,
} from '@/lib/actions/student-dashboard'
import {
  getStudySchedule,
  getStudentPaceSettings,
  getRollingSchedule,
  type StudyScheduleResponse,
  type PaceSettings,
  type RollingWindow as RollingWindowData,
} from '@/lib/actions/study-plans'
import { ScheduleClient } from './_components/schedule-client'
import { RollingWindow } from './_components/rolling-window'

interface Props {
  searchParams: Promise<{ tab?: string; term?: string; academic_year?: string }>
}

export default async function SchedulePage({ searchParams }: Props) {
  const cookieStore = await cookies()
  const userCookie  = cookieStore.get('user')?.value
  if (!userCookie) redirect('/student/login')

  let user: any = null
  try { user = JSON.parse(decodeURIComponent(userCookie)) }
  catch { redirect('/student/login') }

  const studentId = user?.user_id ?? user?.id
  if (!studentId) redirect('/student/login')

  const { tab, term, academic_year } = await searchParams

  const [
    sowData,
    timetable,
    attendance,
    pacingData,
    studyScheduleRes,
    paceRes,
    rollingRes,
  ] = await Promise.all([
    getMyClassSoW(),
    getMyClassTimetable({ term, academic_year }),
    getMyAttendance(studentId),
    getMyPacingData(),
    getStudySchedule(),
    getStudentPaceSettings(studentId),
    getRollingSchedule(),
  ])

  const rolling: RollingWindowData = rollingRes.data ?? {
    has_weekly_target: false,
    weekly_target_hours: null,
    study_days: [1, 2, 3, 4, 5],
    yesterday: null,
    today: null,
    tomorrow: null,
    week: [],
  }

  const studySchedule: StudyScheduleResponse = studyScheduleRes.data ?? {
    physical_slots: [],
    study_slots: [],
    has_physical_timetable: false,
  }

  const paceSettings: PaceSettings = paceRes.data ?? {
    student_id: studentId,
    lessons_per_day: 1,
    preferred_reminder_time: '07:00',
    reminder_enabled: true,
    study_mode: 'open',
    nudge_channels: ['in_app', 'email'],
  }

  return (
    <div className="space-y-4">
      <RollingWindow initial={rolling} />
      <ScheduleClient
        user={user}
        sow={sowData.sow}
        currentWeekEntries={sowData.currentWeekEntries}
        timetable={timetable}
        attendance={attendance}
        pacingData={pacingData}
        studySchedule={studySchedule}
        paceSettings={paceSettings}
        activeTab={tab ?? 'week'}
      />
    </div>
  )
}
