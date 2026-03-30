// src/app/(dashboard)/dashboard/teacher/classes/[classId]/students/[studentId]/page.tsx

import { notFound } from 'next/navigation'
import { getStudent } from '@/lib/actions/students'
import { getClassDetails } from '@/lib/actions/classes'
import { getStudentSubmissions, getStudentCognitiveProfiles } from '@/lib/actions/student-details'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StudentOverviewTab }             from '@/components/students/student-overview-tab'
import { StudentAssessmentsTabWrapper }   from '@/components/students/student-assessments-tab-wrapper'
import { StudentCognitiveProfileTab }     from '@/components/students/student-cognitive-profile-tab'
import { StudentProfileHeader }           from '@/components/students/student-profile-header'

interface Props {
  params: Promise<{ classId: string; studentId: string }>
}

export default async function TeacherStudentDetailPage({ params }: Props) {
  const { classId, studentId } = await params

  const [studentRes, classRes, submissionsRes, profilesRes] = await Promise.all([
    getStudent(studentId),
    getClassDetails(classId),
    getStudentSubmissions(studentId),
    getStudentCognitiveProfiles(studentId),
  ])

  if (studentRes.error || !studentRes.data || classRes.error || !classRes.data) {
    return notFound()
  }

  const student           = studentRes.data
  const currentClass      = classRes.data
  const submissions       = submissionsRes.data ?? []
  const cognitiveProfiles = profilesRes.data    ?? []
  const studentName       = `${student.first_name} ${student.last_name}`.trim()
  const hasCognitiveProfile = cognitiveProfiles.length > 0

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
      />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger
            value="cognitive-profile"
            className={!hasCognitiveProfile ? 'opacity-50' : ''}
          >
            Cognitive Profile{!hasCognitiveProfile && ' (Empty)'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
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
      </Tabs>
    </div>
  )
}