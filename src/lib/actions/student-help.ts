'use server'

import { fetcher } from '@/lib/fetch'

/** Sends a help request to every active teacher on the student's class
 *  (item 16 — students had no in-product way to reach a guide). */
export async function submitHelpRequest(message: string) {
  return fetcher<{ notified_teachers: number }>('/students/me/help-request', {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}
