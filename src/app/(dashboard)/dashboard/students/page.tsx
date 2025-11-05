// src/app/(dashboard)/dashboard/students/page.tsx
import { Metadata } from 'next';
import { getStudents } from '@/lib/actions/students';
import { StudentsClient } from './students-client'; // We will create this next

export const metadata: Metadata = {
  title: 'Students - Mark',
  description: 'Manage students in your organization.',
};

export default async function StudentsPage() {
  const { data: students, error } = await getStudents();

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Error</h2>
        <p className="text-red-500">
          Failed to load students: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-3xl font-bold tracking-tight">
          Students
          <h4 className="pt-3 text-lg font-normal text-muted-foreground">
            Manage all students in your organization.
          </h4>
        </div>
      </div>
      <StudentsClient initialStudents={students ?? []} />
    </div>
  );
}