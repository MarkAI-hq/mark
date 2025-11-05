// src/app/(dashboard)/dashboard/classes/[id]/page.tsx
import { getClassDetails, getAssignedCourses } from '@/lib/actions/classes';
import { ClassDetailClient } from './_components/class-detail-client';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

/**
 * FIX: The 'params' type is updated to satisfy the Next.js 15 build-time type checker.
 */
interface ClassDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ClassDetailPage({ params }: ClassDetailPageProps) {
  // FIX: Await the params object before accessing its properties.
  const resolvedParams = await params;
  const id = resolvedParams.id;

  // Fetch class details and assigned courses in parallel using the `id` variable.
  const [classDetailsResponse, assignedCoursesResponse] = await Promise.all([
    getClassDetails(id),
    getAssignedCourses(id),
  ]);

  const { data: classDetails, error: classError } = classDetailsResponse;
  const { data: assignedCourses, error: coursesError } = assignedCoursesResponse;

  const error = classError || coursesError;
  if (error || !classDetails) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Error</h2>
        <p className="text-red-500">
          Failed to load class data: {error?.message || 'Class not found.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb className="mb-4">
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

      <div className="flex items-center justify-between mb-4">
        <div className="text-3xl font-bold tracking-tight">
          {classDetails.name}
        </div>
      </div>

      <ClassDetailClient
        classDetails={classDetails}
        initialCourses={assignedCourses ?? []}
      />
    </>
  );
}
