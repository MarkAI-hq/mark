// src/app/(dashboard)/dashboard/teacher/classes/[classId]/page.tsx

import { notFound, redirect } from 'next/navigation'
import { getSession }          from '@/lib/session'
import {
  getMyClasses,
  getAssignedCourses,
  getClassAnalytics,
} from '@/lib/actions/classes'
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { TeacherClassDetailTabs } from './_components/teacher-class-detail-tabs'

interface Props {
  params: Promise<{ classId: string }>
}

export async function generateMetadata({ params }: Props) {
  const { classId } = await params
  const myClasses   = await getMyClasses()
  const cls         = myClasses.data?.find((c) => c.class_id === classId)
  return { title: cls ? `${cls.name} — Mark` : 'Class — Mark' }
}

export default async function TeacherClassDetailPage({ params }: Props) {
  const { classId } = await params

  const user = await getSession()
  if (!user)                   redirect('/login')
  if (user.role !== 'Teacher') redirect('/dashboard')

  const myClassesRes = await getMyClasses()
  const myClass      = myClassesRes.data?.find((c) => c.class_id === classId)
  if (!myClass || myClass.status !== 'active') return notFound()

  const privileges = {
    can_add_students:       myClass.can_add_students       ?? true,
    can_create_assessments: myClass.can_create_assessments ?? true,
    can_grade:              myClass.can_grade              ?? true,
    can_view_analytics:     myClass.can_view_analytics     ?? true,
  }

  const [coursesRes, analytics] = await Promise.all([
    getAssignedCourses(classId),
    getClassAnalytics(classId),
  ])

  const classDetails = {
    class_id:        myClass.class_id,
    name:            myClass.name,
    description:     myClass.description ?? null,
    organization_id: myClass.organization_id,
    created_by:      myClass.created_by,
    createdAt:       myClass.createdAt,
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/teacher/classes">Classes</BreadcrumbLink>
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
        {analytics && analytics.averagePercentage > 0 && (
          <div className="text-right">
            <p className="text-3xl font-bold text-primary">{analytics.averagePercentage}%</p>
            <p className="text-xs text-muted-foreground">Class average</p>
          </div>
        )}
      </div>

      <TeacherClassDetailTabs
        classId={classId}
        classDetails={classDetails}
        courses={coursesRes.data ?? []}
        analytics={analytics}
        privileges={privileges}
      />
    </div>
  )
}