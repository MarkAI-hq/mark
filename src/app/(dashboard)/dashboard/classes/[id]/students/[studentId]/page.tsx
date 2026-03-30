// src/app/(dashboard)/dashboard/classes/[id]/students/[studentId]/page.tsx

import { notFound }                    from 'next/navigation'
import { getStudent }                  from '@/lib/actions/students'
import { getClassDetails }             from '@/lib/actions/classes'
import { getStudentSubmissions, getStudentCognitiveProfiles } from '@/lib/actions/student-details'
import { getStudentReteachHistory }    from '@/lib/actions/reteach-history'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge }                                    from '@/components/ui/badge'
import { StudentOverviewTab }          from '@/components/students/student-overview-tab'
import { StudentAssessmentsTabWrapper } from '@/components/students/student-assessments-tab-wrapper'
import { StudentCognitiveProfileTab }  from '@/components/students/student-cognitive-profile-tab'
import { StudentInterventionsTab }     from '@/components/students/student-interventions-tab'
import { StudentImpactTab }            from '@/components/students/student-impact-tab'
import { StudentProfileHeader }        from '@/components/students/student-profile-header'

interface StudentDetailPageProps {
  params: Promise<{ id: string; studentId: string }>
}

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  const { id: classId, studentId } = await params

  const [studentRes, classRes, submissionsRes, profilesRes, interventionsRes] =
    await Promise.all([
      getStudent(studentId),
      getClassDetails(classId),
      getStudentSubmissions(studentId),
      getStudentCognitiveProfiles(studentId),
      getStudentReteachHistory(studentId),
    ])

  if (studentRes.error || !studentRes.data || classRes.error || !classRes.data) {
    return notFound()
  }

  const student             = studentRes.data
  const currentClass        = classRes.data
  const submissions         = submissionsRes.data  ?? []
  const cognitiveProfiles   = profilesRes.data     ?? []
  const interventions       = interventionsRes.data ?? []
  const studentName         = `${student.first_name} ${student.last_name}`.trim()
  const hasCognitiveProfile = cognitiveProfiles.length > 0
  const hasInterventions    = interventions.length > 0

  const deliveredCount = interventions.filter(
    (i) => i.status === 'delivered' || i.status === 'completed',
  ).length

  const breadcrumbItems = [
    { label: 'Classes',         href: '/dashboard/classes' },
    { label: currentClass.name, href: `/dashboard/classes/${currentClass.class_id}` },
    { label: studentName },
  ]

  return (
    <div className="space-y-6">
      <StudentProfileHeader
        studentName={studentName}
        studentId={student.user_id}
        classId={currentClass.class_id}
        breadcrumbItems={breadcrumbItems}
        hasSubmissions={submissions.length > 0}
        hasCognitiveProfile={hasCognitiveProfile}
        student={student}
      />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>

          <TabsTrigger value="cognitive-profile">
            Cognitive Profile
          </TabsTrigger>

          {/* Interventions — uses Badge for consistency */}
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

          {/* Impact — uses Badge for consistency */}
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
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg text-muted-foreground">
              <p className="font-medium">No cognitive profile yet</p>
              <p className="text-sm mt-1">
                A profile will appear once this student completes a cognitive assessment.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="interventions" className="mt-4">
          <StudentInterventionsTab
            studentId={studentId}
            initialData={interventions}
            classId={classId} 
          />
        </TabsContent>

        <TabsContent value="impact" className="mt-4">
          <StudentImpactTab studentId={studentId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}