// src/config/site-domains.ts
//
// mirror.education is the flagship school's own site; every other host
// (intel.mirror.education, localhost, preview URLs) serves the platform
// pitch. Shared between src/middleware.ts (edge runtime) and server
// components/layouts (via src/lib/site-mode.ts), so keep this dependency-free.

export const SCHOOL_DOMAIN_HOSTS = ['mirror.education', 'www.mirror.education']

export const FLAGSHIP_SCHOOL_CODE = process.env.NEXT_PUBLIC_DEFAULT_SCHOOL_CODE || 'MCS-2026'
