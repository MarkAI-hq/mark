// src/app/(dashboard)/dashboard/classes/[id]/page.tsx

import { notFound }            from 'next/navigation'
import {
  getClassDetails,
  getAssignedCourses,
  getClassAnalytics,
  getClassesWithTeachers,
  getClassAssessments,
  getClassGroups,
}                              from '@/lib/actions/classes'
import { getOrganizationUsers }   from '@/lib/actions/organizations'
import { getClassReteachHistory } from '@/lib/actions/reteach-history'
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { ClassDetailTabs } from './_components/class-detail-tabs'

interface ClassDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ClassDetailPage({ params }: ClassDetailPageProps) {
  const { id } = await params

  const [
    classRes, coursesRes, analytics, classesWithTeachersRes,
    assessmentsRes, interventionsRes, groupsRes,
  ] = await Promise.all([
    getClassDetails(id),
    getAssignedCourses(id),
    getClassAnalytics(id),
    getClassesWithTeachers(),
    getClassAssessments(id),
    getClassReteachHistory(id),
    getClassGroups(id),
  ])

  if (classRes.error || !classRes.data) return notFound()

  const classDetails       = classRes.data
  const courses            = coursesRes.data     ?? []
  const assessments        = assessmentsRes.data  ?? []
  const interventions      = interventionsRes.data ?? []
  const groups             = groupsRes.data        ?? null
  const latestAssessmentId = assessments[0]?.assessment_id ?? null

  const classWithTeachers = classesWithTeachersRes.data?.find((c) => c.class_id === id)
  const teachers          = classWithTeachers?.teachers ?? []

  const { data: orgUsers } = classDetails.organization_id
    ? await getOrganizationUsers(classDetails.organization_id)
    : { data: [] }
  const orgTeachers = (orgUsers ?? []).filter((u) => u.role === 'Teacher')

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/classes">Classes</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{classDetails.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{classDetails.name}</h1>
          {classDetails.description && (
            <p className="text-muted-foreground mt-1">{classDetails.description}</p>
          )}
        </div>
        {analytics && analytics.studentSummaries.some((s) => s.submissions > 0) && (
          <div className="text-right">
            <p className="text-3xl font-bold text-primary">{analytics.averagePercentage}%</p>
            <p className="text-xs text-muted-foreground">Class average</p>
          </div>
        )}
      </div>

      <ClassDetailTabs
        classId={id}
        classDetails={classDetails}
        courses={courses}
        analytics={analytics}
        teachers={teachers}
        orgTeachers={orgTeachers}
        latestAssessmentId={latestAssessmentId}
        interventions={interventions}
        groups={groups}
      />
    </div>
  )
}