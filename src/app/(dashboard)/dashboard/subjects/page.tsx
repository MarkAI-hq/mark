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
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-3xl font-bold tracking-tight">
          Subjects
          <h4 className="pt-3 text-lg font-normal text-muted-foreground">
            {isAdmin
              ? 'Click the + New Subject button or press C to create a subject.'
              : 'Subjects assigned to your classes.'}
          </h4>
        </div>
      </div>
      <Suspense fallback={null}>
        <SubjectsClient subjects={subjects ?? []} isAdmin={isAdmin} />
      </Suspense>
    </div>
  )
}