// src/app/(dashboard)/dashboard/subjects/page.tsx

import { Suspense }       from 'react'
import { Metadata }       from 'next'
import { redirect }       from 'next/navigation'
import { getSession }     from '@/lib/session'
import { SubjectsClient } from './subjects-client'
import { getSubjects }    from '@/lib/actions/subjects'

export const metadata: Metadata = {
  title: 'Subjects — Mark',
  description: 'Manage subjects',
}

export default async function SubjectsPage() {
  const user = await getSession()
  if (!user) redirect('/login')

  const isAdmin = user.role === 'Admin'

  const { data: subjects, error } = await getSubjects()

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Error</h2>
        <p className="text-red-500">Failed to load subjects: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between pb-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Subjects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdmin
              ? 'Create and manage subjects. Press C to create a new subject.'
              : 'Subjects assigned to your classes.'}
          </p>
        </div>
      </div>
      <Suspense fallback={null}>
        <SubjectsClient subjects={subjects ?? []} isAdmin={isAdmin} />
      </Suspense>
    </div>
  )
}