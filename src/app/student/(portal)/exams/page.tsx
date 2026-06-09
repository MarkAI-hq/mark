// src/app/student/(portal)/exams/page.tsx
import { getMyExamRegistrations } from '@/lib/actions/exam-registrations'
import { ExamsClient } from './_components/exams-client'

export default async function ExamsPage() {
  const res = await getMyExamRegistrations()
  return <ExamsClient registrations={res.data ?? []} />
}
