// src/app/(dashboard)/dashboard/students/pending/page.tsx
import { Metadata } from 'next'
import { getPendingStudents } from '@/lib/actions/students'
import { PendingStudentsClient } from './pending-students-client'

export const metadata: Metadata = {
  title: 'Pending approvals - Mark',
  description: 'Review and approve marketplace self-enrollment requests.',
}

export default async function PendingStudentsPage() {
  const { data: pending, error } = await getPendingStudents()

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Error</h2>
        <p className="text-red-500">
          Failed to load pending students: {error.message}
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-3xl font-bold tracking-tight">
          Pending approvals
          <h4 className="pt-3 text-lg font-normal text-muted-foreground">
            Students who self-enrolled and are waiting to join a class.
          </h4>
        </div>
      </div>
      <PendingStudentsClient initial={pending ?? []} />
    </div>
  )
}
