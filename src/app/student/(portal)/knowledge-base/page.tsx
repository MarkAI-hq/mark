// src/app/student/(portal)/knowledge-base/page.tsx
import { redirect } from 'next/navigation'
import { cookies }  from 'next/headers'
import { getMyNotes, getMyNoteStats } from '@/lib/actions/student-notes'
import { KnowledgeBaseClient } from './knowledge-base-client'

export const dynamic = 'force-dynamic'

export default async function KnowledgeBasePage() {
  const cookieStore = await cookies()
  const userCookie  = cookieStore.get('user')?.value
  if (!userCookie) redirect('/student/login')

  let user: any = null
  try { user = JSON.parse(decodeURIComponent(userCookie)) } catch { redirect('/student/login') }

  const [notesRes, statsRes] = await Promise.all([
    getMyNotes(),
    getMyNoteStats(),
  ])

  return (
    <KnowledgeBaseClient
      user={user}
      initialNotes={notesRes.data ?? []}
      initialStats={statsRes.data ?? { total: 0, approved: 0, total_points: 0 }}
    />
  )
}
