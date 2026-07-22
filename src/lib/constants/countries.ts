// Platform country roadmap — shown wherever a country picker appears
// (school registration, the public Learning Compass subject-preview flow).
// A country is only truly usable once a public org + subject catalog exist
// for it; callers that need availability should cross-reference this list
// against a live "available countries" endpoint rather than assume every
// entry here is live.
export const COUNTRIES = [
  { code: 'UG', name: 'Uganda' },
  { code: 'KE', name: 'Kenya' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'OTHER', name: 'Other' },
]
