// src/lib/curriculum-defaults.ts
// Shared mapping from an org's school type / education system to the country and
// class-key prefix used to query the curriculum corpus (curricula.ts actions).
// Used by both the onboarding wizard and the existing-org curriculum sync panel.

export function deriveCountry(educationSystem: string): string | null {
  return educationSystem === 'uneb' ? 'uganda' : null
}

// ISO country code for `organizations.country_code` — distinct from deriveCountry()
// above, which returns the lowercase full name the curriculum-catalog endpoints
// (getAvailableSubjects/getAvailableClassLevels) expect. RAG grounding filters on
// country_code (normalized 'ug'/'uga' -> 'uganda' in curriculum-corpus.resolver.ts),
// so leaving this unset silently zeroes out curriculum grounding for the org.
export function deriveCountryCode(educationSystem: string): string | null {
  return educationSystem === 'uneb' ? 'UG' : null
}

export function deriveClassKeyPrefix(schoolType: string): string | undefined {
  if (schoolType === 'primary') return 'P'
  if (schoolType === 'o-level' || schoolType === 'a-level') return 'S'
  return undefined
}
