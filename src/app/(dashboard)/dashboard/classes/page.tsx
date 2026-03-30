// src/app/(dashboard)/dashboard/classes/page.tsx

import { Suspense }      from 'react'
import { Metadata }      from 'next'
import { getClasses }    from '@/lib/actions/classes'
import { ClassesClient } from './_components/classes-client'

export const metadata: Metadata = {
  title: 'Classes - Mark',
  description: 'Manage your classes and student enrollments.',
}

export default async function ClassesPage() {
  const { data: classes, error } = await getClasses()

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Error</h2>
        <p className="text-red-500">
          Failed to load classes: {error.message}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="text-3xl font-bold tracking-tight">
          Classes
          <h4 className="pt-3 text-lg font-normal text-muted-foreground">
            Create and manage your assessments or exams.
          </h4>
        </div>
      </div>
      <Suspense fallback={null}>
        <ClassesClient initialClasses={classes ?? []} />
      </Suspense>
    </>
  )
}