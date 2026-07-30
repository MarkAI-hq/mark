// src/app/(dashboard)/dashboard/teacher/classes/[classId]/students/[studentId]/page.tsx

import { notFound } from 'next/navigation'
import { getStudent } from '@/lib/actions/students'
import { getClassDetails } from '@/lib/actions/classes'
import { getOrganizationDetails } from '@/lib/actions/organizations'
import { getStudentSubmissions, getStudentCognitiveProfiles } from '@/lib/actions/student-details'
import { getStudentReteachHistory }    from '@/lib/actions/reteach-history'
import { getStudentGapAttribution }    from '@/lib/actions/gap-attribution'
import { getStudentAttendance }        from '@/lib/actions/attendance'
import { getStudentStudyPlansTeacher, getStudentPaceSettings } from '@/lib/actions/study-plans'
import { getActiveSchemeForClass }     from '@/lib/actions/scheme-of-work'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge }                          from '@/components/ui/badge'
import { StudentOverviewTab }             from '@/components/students/student-overview-tab'
import { StudentAssessmentsTabWrapper }   from '@/components/students/student-assessments-tab-wrapper'
import { StudentCognitiveProfileTab }     from '@/components/students/student-cognitive-profile-tab'
import { StudentInterventionsTab }        from '@/components/students/student-interventions-tab'
import { StudentImpactTab }               from '@/components/students/student-impact-tab'
import { StudentProfileHeader }           from '@/components/students/student-profile-header'
import { StudentEnrichmentCards }         from '@/app/(dashboard)/dashboard/classes/[id]/students/[studentId]/_components/student-enrichment-cards'
import { StudentAttendanceTab }           from '@/app/(dashboard)/dashboard/classes/[id]/students/[studentId]/_components/student-attendance-tab'
import { StudentStudyPlansTab }           from '@/app/(dashboard)/dashboard/classes/[id]/students/[studentId]/_components/student-study-plans-tab'

interface Props {
  params: Promise<{ classId: string; studentId: string }>
}

export default async function TeacherStudentDetailPage({ params }: Props) {
  const { classId, studentId } = await params

  const [
    studentRes, classRes, submissionsRes, profilesRes, interventionsRes, gapRes,
    attendanceRes, plansRes, sowRes, paceRes,
  ] = await Promise.all([
    getStudent(studentId),
    getClassDetails(classId),
    getStudentSubmissions(studentId),
    getStudentCognitiveProfiles(studentId),
    getStudentReteachHistory(studentId),
    getStudentGapAttribution(studentId, classId),
    getStudentAttendance(studentId, classId),
    getStudentStudyPlansTeacher(studentId),
    getActiveSchemeForClass(classId),
    getStudentPaceSettings(studentId),
  ])

  if (studentRes.error || !studentRes.data || classRes.error || !classRes.data) {
    return notFound()
  }

  const student           = studentRes.data
  const currentClass      = classRes.data
  const submissions       = submissionsRes.data ?? []
  const cognitiveProfiles = profilesRes.data    ?? []
  const interventions     = interventionsRes.data ?? []
  const gapAttribution    = gapRes.data?.attributed_gaps ?? []
  const attendanceData    = (attendanceRes as any).data ?? null
  const plans             = plansRes.data         ?? []
  const curriculumId      = sowRes.data?.curriculum_id ?? null
  const paceSettings      = paceRes.data          ?? null

  const studentName       = `${student.first_name} ${student.last_name}`.trim()
  const hasCognitiveProfile = cognitiveProfiles.length > 0
  const hasInterventions  = interventions.length > 0

  const deliveredCount = interventions.filter(
    (i) => i.status === 'delivered' || i.status === 'completed',
  ).length

  const attendanceRate = (attendanceData as any)?.attendance_rate ?? null

  const completedPlans = plans.filter((p: any) => p.status === 'completed').length
  const studyPlanCompletion = plans.length > 0
    ? Math.round((completedPlans / plans.length) * 100)
    : null

  const orgRes            = student.organization_id
    ? await getOrganizationDetails(student.organization_id)
    : null
  const schoolName        = orgRes?.data?.name ?? 'Mirror Intelligence'

  const breadcrumbItems = [
    { label: 'Classes',         href: '/dashboard/teacher/classes' },
    { label: currentClass.name, href: `/dashboard/teacher/classes/${classId}` },
    { label: studentName },
  ]

  return (
    <div className="space-y-6">
      <StudentProfileHeader
        studentName={studentName}
        studentId={student.user_id}
        classId={classId}
        breadcrumbItems={breadcrumbItems}
        hasSubmissions={submissions.length > 0}
        hasCognitiveProfile={hasCognitiveProfile}
        student={student}
        readOnly={true}
        schoolName={schoolName}
        studentClassName={currentClass.name}
      />

      <Tabs defaultValue="overview" className="w-full">
        <div className="overflow-x-auto">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger
            value="cognitive-profile"
            className={!hasCognitiveProfile ? 'opacity-50' : ''}
          >
            Cognitive Profile{!hasCognitiveProfile && ' (Empty)'}
          </TabsTrigger>

          <TabsTrigger value="interventions" className="relative">
            Interventions
            {hasInterventions && (
              <Badge
                variant="secondary"
                className="ml-1.5 bg-amber-100 text-amber-800 border-amber-200 text-[10px] px-1.5 py-0"
              >
                {interventions.length}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger value="impact">
            Impact
            {deliveredCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1.5 bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] px-1.5 py-0"
              >
                {deliveredCount}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger value="study-plans">
            Study Plans
            {plans.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                {plans.length}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>
        </div>

        <TabsContent value="overview" className="mt-4">
          <StudentEnrichmentCards
            attendanceRate={attendanceRate}
            studyPlanCompletion={studyPlanCompletion}
            curriculumId={curriculumId}
            studentId={studentId}
            bufferCount={plans.filter((p: any) => p.status === 'pending' || p.status === 'sent').length}
            lessonsPerDay={paceSettings?.lessons_per_day ?? null}
          />
          <StudentOverviewTab student={student} studentId={studentId} />
        </TabsContent>

        <TabsContent value="assessments" className="mt-4">
          <StudentAssessmentsTabWrapper
            studentId={studentId}
            initialSubmissions={submissions}
          />
        </TabsContent>

        <TabsContent value="cognitive-profile" className="mt-4">
          {hasCognitiveProfile ? (
            <StudentCognitiveProfileTab
              profiles={cognitiveProfiles}
              studentId={studentId}
              classId={classId}
              studentName={studentName}
              readOnly={true}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg text-muted-foreground">
              <p>No cognitive profile data found for this student.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="interventions" className="mt-4">
          <StudentInterventionsTab
            studentId={studentId}
            initialData={interventions}
            classId={classId}
            gapAttribution={gapAttribution}
          />
        </TabsContent>

        <TabsContent value="impact" className="mt-4">
          <StudentImpactTab studentId={studentId} />
        </TabsContent>

        <TabsContent value="study-plans" className="mt-4">
          <StudentStudyPlansTab
            studentId={studentId}
            classId={classId}
            studentName={studentName}
            initialPlans={plans as any}
          />
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <StudentAttendanceTab data={attendanceData} />
        </TabsContent>
      </Tabs>
    </div>
  )
}