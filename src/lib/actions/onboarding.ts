'use server'

// src/lib/actions/onboarding.ts

import { cookies }        from 'next/headers'
import { revalidatePath } from 'next/cache'
import { fetcher }        from '@/lib/fetch'
import { getSession }     from '@/lib/session'
import type { ServerActionResponse } from '@/lib/types'

export async function saveOrganizationSetup(data: {
  type?:             string
  education_system?: string
}): Promise<ServerActionResponse<{ message: string }>> {
  const user = await getSession()
  if (!user) return { data: null, error: { message: 'Unauthenticated' } }

  try {
    const response = await fetcher<{ message: string }>(
      `/organizations/${user.organizationId}`,
      {
        method: 'PATCH',
        body:   JSON.stringify(data),
      },
    )

    if (response.error) throw new Error(response.error.message)

    revalidatePath('/dashboard/settings/organization')
    return { data: response.data, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred'
    return { data: null, error: { message } }
  }
}

export async function completeOnboarding(): Promise<ServerActionResponse<{ message: string }>> {
  const user        = await getSession()
  const cookieStore = await cookies()

  if (!user) return { data: null, error: { message: 'Unauthenticated' } }

  try {
    const response = await fetcher<{ message: string }>(
      `/organizations/${user.organizationId}`,
      {
        method: 'PATCH',
        body:   JSON.stringify({ onboarding_complete: true }),
      },
    )

    if (response.error) throw new Error(response.error.message)

    const existing = cookieStore.get('user')?.value
    if (existing) {
      const parsed  = JSON.parse(decodeURIComponent(existing))
      const updated = { ...parsed, onboarding_complete: true }
      cookieStore.set('user', JSON.stringify(updated), {
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path:     '/',
        maxAge:   60 * 60 * 24 * 7,
      })
    }

    revalidatePath('/dashboard')
    return { data: response.data, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred'
    return { data: null, error: { message } }
  }
}