// src/app/(dashboard)/dashboard/subjects/page.tsx
import { Metadata } from 'next'

import { SubjectsClient } from './subjects-client'
import { getSubjects } from '@/lib/actions/subjects'

export const metadata: Metadata = {
  title: 'Subjects - Mark',
  description: 'Manage subjects'
}

export default async function SubjectsPage() {
  // FIX: Destructure the 'data' and 'error' properties from the Server Action response.
  const { data: subjects, error } = await getSubjects()

  // Handle the error state if the API call fails.
  if (error) {
    return (
      <div className='flex-1 space-y-4 p-8 pt-6'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-3xl font-bold tracking-tight'>Error</h2>
        </div>
        <div className="text-red-500">
          <p>Failed to load subjects: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex-1 space-y-4 p-8 pt-6'>
      <div className='flex items-center justify-between mb-4'>
        <div className='text-3xl font-bold tracking-tight'>Subjects
          <h4 className='pt-3 text-lg font-normal text-muted-foreground'>Click the + New Subject button or press C to start grading.</h4>
        </div>
      </div>
      {/* Pass the unwrapped 'subjects' array, or an empty array if it's null/undefined. */}
      <SubjectsClient subjects={subjects ?? []} />
    </div>
  )
}
