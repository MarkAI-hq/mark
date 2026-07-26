// src/config/site-domains.ts
//
// mirror.education is the flagship school's own site; every other host
// (intel.mirror.education, localhost, preview URLs) serves the platform
// pitch. Shared between src/middleware.ts (edge runtime) and server
// components/layouts (via src/lib/site-mode.ts), so keep this dependency-free.

export const SCHOOL_DOMAIN_HOSTS = ['mirror.education', 'www.mirror.education']

export const FLAGSHIP_SCHOOL_CODE = process.env.NEXT_PUBLIC_DEFAULT_SCHOOL_CODE || 'MCS-2026'

// Flagship school's WhatsApp community — shown in the nav on mirror.education
// only, so students/parents already on that site can join and be reached
// directly for term reminders, upsells, etc.
export const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/CV9Jbkm7nug6kcx5sgWMWQ?s=cl&p=a&ilr=1&amv=3'

