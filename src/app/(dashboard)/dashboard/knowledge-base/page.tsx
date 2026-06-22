// src/app/(dashboard)/dashboard/knowledge-base/page.tsx
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getPendingNotes } from '@/lib/actions/student-notes'
import { listDocuments } from '@/lib/actions/curriculum-documents'
import { KnowledgeBaseClient } from './knowledge-base-client'

export const dynamic = 'force-dynamic'

export default async function KnowledgeBasePage() {
  const user = await getSession()
  if (!user || !user.organizationId) redirect('/login')
  if (!['Admin', 'Teacher'].includes(user.role)) redirect('/dashboard')

  const [notesRes, docsRes] = await Promise.all([
    getPendingNotes(),
    listDocuments(),
  ])

  return (
    <KnowledgeBaseClient
      initialPendingNotes={notesRes.data ?? []}
      initialDocuments={docsRes.data ?? []}
      userRole={user.role}
    />
  )
}
