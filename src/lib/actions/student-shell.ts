'use server'

import { fetcher } from '@/lib/fetch'

/** The signed-in student's own school — name and code only, for the portal header. */
export async function getMySchool() {
  return fetcher<{ name: string | null; school_code: string | null }>('/students/me/school', {
    cache: 'no-store',
  })
}
