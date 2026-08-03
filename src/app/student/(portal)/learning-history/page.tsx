import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getLearningHistory } from '@/lib/actions/learning-history'
import { LearningHistoryClient } from './_components/learning-history-client'

export default async function LearningHistoryPage() {
  const cookieStore = await cookies()
  const userCookie = cookieStore.get('user')?.value
  if (!userCookie) redirect('/student/login')

  const { data, error } = await getLearningHistory({})

  return <LearningHistoryClient initial={data ?? { submissions: [], mastery: [], lessons: [] }} error={error?.message ?? null} />
}
