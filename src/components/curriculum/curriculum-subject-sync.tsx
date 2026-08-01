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

  const byName = new Map(available.map(s => [s.display_name.trim().toLowerCase(), s]))

  const missing = available.filter(
    s => !(existing ?? []).some(e => e.name.trim().toLowerCase() === s.display_name.trim().toLowerCase()),
  )

  // Existing subjects that match a curriculum subject by name but are missing
  // (or diverge from) the curriculum's code/description — backfill candidates.
  const staleExisting = (existing ?? []).filter(e => {
    const match = byName.get(e.name.trim().toLowerCase())
    if (!match) return false
    const codeStale = !!match.subject_code && e.code?.trim() !== match.subject_code
    const descriptionStale = !!match.description && e.description?.trim() !== match.description
    return codeStale || descriptionStale
  })

  return (
    <>
      {missing.length > 0 && (
        <CurriculumSyncPanel
          kind="subject"
          items={missing.map(s => ({
            key: s.subject_key,
            label: s.display_name,
            code: s.subject_code,
            description: s.description,
          }))}
        />
      )}
      {staleExisting.length > 0 && (
        <CurriculumSyncPanel
          kind="subject-update"
          items={staleExisting.map(e => {
            const match = byName.get(e.name.trim().toLowerCase())!
            return {
              key: e.id,
              label: e.name,
              code: match.subject_code,
              description: match.description,
              subjectId: e.id,
            }
          })}
        />
      )}
    </>
  )
}
