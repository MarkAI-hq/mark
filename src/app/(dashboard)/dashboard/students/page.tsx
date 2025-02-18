import { Metadata } from 'next'

import { StudentsClient } from './students-client'
import { getStudents } from '@/lib/actions/students'

export const metadata: Metadata = {
  title: 'Students - Mark',
  description: 'Manage your students'
}

export default async function StudentsPage() {
  const { data: students } = await getStudents()

  return (
    <div className='flex-1 space-y-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-3xl font-bold tracking-tight'>Students</h2>
      </div>
      <StudentsClient students={students ?? []} />
    </div>
  )
} 