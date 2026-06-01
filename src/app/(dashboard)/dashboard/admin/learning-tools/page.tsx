// src/app/(dashboard)/dashboard/admin/learning-tools/page.tsx
// H1: Admin learning tools catalog — create, edit, deactivate tools

import { Suspense } from 'react'
import { getLearningTools } from '@/lib/actions/learning-tools'
import { LearningToolsClient } from './learning-tools-client'

export default async function LearningToolsPage() {
  const { data: tools, error } = await getLearningTools()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Learning Tools</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage the cognitive learning tools assigned to student profiles. Changes apply immediately to new session generation.
        </p>
      </div>
      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error.message}
        </div>
      ) : (
        <Suspense fallback={<div className="text-sm text-muted-foreground">Loading tools…</div>}>
          <LearningToolsClient initialTools={tools ?? []} />
        </Suspense>
      )}
    </div>
  )
}
