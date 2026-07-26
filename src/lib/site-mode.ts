// src/lib/site-mode.ts

import { headers } from 'next/headers'
import { SCHOOL_DOMAIN_HOSTS } from '@/config/site-domains'

export async function isSchoolDomain(): Promise<boolean> {
  const host = (await headers()).get('host') ?? ''
  return SCHOOL_DOMAIN_HOSTS.includes(host)
}
