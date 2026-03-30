// src/app/(dashboard)/dashboard/classes/[id]/reteach/[assessmentId]/page.tsx

import { redirect }                  from 'next/navigation'
import { getSession }                from '@/lib/session'
import { generateAssessmentReteach } from '@/lib/actions/reteach'
import { getClassReteachHistory }    from '@/lib/actions/reteach-history'
import { ClassReteachPageClient }    from './page-client'

interface PageProps {
  params:      Promise<{ id: string; assessmentId: string }>
  searchParams: Promise<{
    classId?:         string
    errorTypeId?:     string
    className?:       string
    assessmentTitle?: string
    errorType?:       string
    affected?:        string
    total?:           string
  }>
}

export default async function ClassReteachPage({ params, searchParams }: PageProps) {
  const user = await getSession()
  if (!user || !user.organizationId) redirect('/login')

  const { id: classId, assessmentId } = await params
  const sp = await searchParams

  const resolvedClassId = sp.classId ?? classId

  console.log(`[RETEACH PAGE DEBUG] classId=${classId} | assessmentId=${assessmentId} | errorType=${sp.errorType}`)

  // ── Check for an existing undelivered session before hitting Gemini ────────
  const { data: history } = await getClassReteachHistory(resolvedClassId)

  const existing = history?.find(
    r => r.error_type === sp.errorType && r.status === 'generated',
  )

  if (existing) {
    console.log(`[RETEACH PAGE DEBUG] existing session found (${existing.id}) — skipping generation`)
    redirect(`/dashboard/classes/${classId}?tab=interventions`)
  }

  // ── No existing session — generate a new one ───────────────────────────────
  const { data: session, error } = await generateAssessmentReteach(
    assessmentId,
    sp.errorTypeId,
    resolvedClassId,
  )

  console.log(`[RETEACH PAGE DEBUG] session=${session ? `title="${session.title}"` : 'NULL'} | error=${error?.message ?? 'none'}`)

  if (error || !session) {
    console.log(`[RETEACH PAGE DEBUG] generation failed — reason: ${error?.message}`)
    redirect(
      `/dashboard/classes/${classId}?reteachError=true&reason=${encodeURIComponent(error?.message ?? 'unknown')}`,
    )
  }

  return (
    <ClassReteachPageClient
      session={session!}
      classId={classId}
      className={sp.className             ?? 'Class'}
      assessmentTitle={sp.assessmentTitle ?? 'Assessment'}
      errorType={sp.errorType             ?? session!.target_error}
      affected={Number(sp.affected)       || 0}
      total={Number(sp.total)             || 0}
    />
  )
}