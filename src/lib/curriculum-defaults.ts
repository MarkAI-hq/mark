// src/lib/curriculum-defaults.ts
// Shared mapping from an org's school type / education system to the country and
// class-key prefix used to query the curriculum corpus (curricula.ts actions).
// Used by both the onboarding wizard and the existing-org curriculum sync panel.

export function deriveCountry(educationSystem: string): string | null {
  return educationSystem === 'uneb' ? 'uganda' : null
}

export function deriveClassKeyPrefix(schoolType: string): string | undefined {
  if (schoolType === 'primary') return 'P'
  if (schoolType === 'o-level' || schoolType === 'a-level') return 'S'
  return undefined
}
