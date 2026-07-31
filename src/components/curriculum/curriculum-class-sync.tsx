// src/components/curriculum/curriculum-class-sync.tsx
// Server component: diffs the org's existing classes against the curriculum corpus's
// class levels (S1-S4, P1-P7, ...) for its school type/education system.

import { getSession } from '@/lib/session'
import { getOrganizationDetails } from '@/lib/actions/organizations'
import { getAvailableClassLevels } from '@/lib/actions/curricula'
import { getClasses } from '@/lib/actions/classes'
import { deriveCountry, deriveClassKeyPrefix } from '@/lib/curriculum-defaults'
import { CurriculumSyncPanel } from './curriculum-sync-panel'

export async function CurriculumClassSync() {
  const user = await getSession()
  if (!user?.organizationId) return null

  const { data: org } = await getOrganizationDetails(user.organizationId)
  if (!org?.education_system) return null

  const country = deriveCountry(org.education_system)
  if (!country) return null

  const classKeyPrefix = org.type ? deriveClassKeyPrefix(org.type) : undefined

  const [{ data: available }, { data: existing }] = await Promise.all([
    getAvailableClassLevels({ country }),
    getClasses(),
  ])
  if (!available?.length) return null

  const levels = available
    .map(l => l.class_key)
    .filter(key => !classKeyPrefix || key.startsWith(classKeyPrefix))
  if (levels.length === 0) return null

  const existingLevels = new Set(
    (existing ?? []).map(c => (c.grade_level ?? c.name).trim().toUpperCase()),
  )
  const missing = levels.filter(key => !existingLevels.has(key.toUpperCase()))
  if (missing.length === 0) return null

  return (
    <CurriculumSyncPanel
      kind="class"
      items={missing.map(key => ({ key, label: key }))}
    />
  )
}
