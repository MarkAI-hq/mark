// src/app/(dashboard)/dashboard/courses/page.tsx
import { Metadata } from 'next';
import { getCourses } from '@/lib/actions/courses';
import { getSubjects } from '@/lib/actions/subjects';
import { CoursesClient } from './_components/courses-client';

export const metadata: Metadata = {
  title: 'Courses - Mark',
  description: 'Manage courses for your subjects.',
};

export default async function CoursesPage() {
  // Fetch initial data in parallel
  const [coursesResponse, subjectsResponse] = await Promise.all([
    getCourses(),
    getSubjects(),
  ]);

  const { data: courses, error: coursesError } = coursesResponse;
  const { data: subjects, error: subjectsError } = subjectsResponse;

  const error = coursesError || subjectsError;
  if (error) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Error</h2>
        <p className="text-red-500">
          Failed to load academic data: {error.message}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="text-3xl font-bold tracking-tight">
          Courses
          <h4 className="pt-3 text-lg font-normal text-muted-foreground">
            Manage the specific courses offered within each subject.
          </h4>
        </div>
      </div>
      <CoursesClient initialCourses={courses ?? []} subjects={subjects ?? []} />
    </>
  );
}
