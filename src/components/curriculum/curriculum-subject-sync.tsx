// src/components/curriculum/curriculum-subject-sync.tsx
// Server component: diffs the org's existing subjects against the curriculum corpus
// for its school type/education system, and surfaces a sync panel for what's missing.

import { getSession } from '@/lib/session'
import { getOrganizationDetails } from '@/lib/actions/organizations'
import { getAvailableSubjects } from '@/lib/actions/curricula'
import { getSubjects } from '@/lib/actions/subjects'
import { deriveCountry, deriveClassKeyPrefix } from '@/lib/curriculum-defaults'
import { CurriculumSyncPanel } from './curriculum-sync-panel'

export async function CurriculumSubjectSync() {
  const user = await getSession()
  if (!user?.organizationId) return null

  const { data: org } = await getOrganizationDetails(user.organizationId)
  if (!org?.education_system) return null

  const country = deriveCountry(org.education_system)
  if (!country) return null

  const [{ data: available }, { data: existing }] = await Promise.all([
    getAvailableSubjects({
      country,
      classKeyPrefix: org.type ? deriveClassKeyPrefix(org.type) : undefined,
    }),
    getSubjects(),
  ])
  if (!available?.length) return null

  const existingNames = new Set((existing ?? []).map(s => s.name.trim().toLowerCase()))
  const missing = available.filter(s => !existingNames.has(s.display_name.trim().toLowerCase()))
  if (missing.length === 0) return null

  return (
    <CurriculumSyncPanel
      kind="subject"
      items={missing.map(s => ({ key: s.subject_key, label: s.display_name }))}
    />
  )
}
