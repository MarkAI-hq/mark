'use server'

// src/lib/actions/reteach-suggestions.ts
// C1: Reteach suggestions after assessment grading

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

export interface ReteachSuggestion {
  error_type:     string
  affected_count: number
  total_count:    number
  pct:            number
  priority:       'high' | 'medium' | 'low'
  session_exists: boolean
}

export async function getReteachSuggestions(
  assessmentId: string,
): Promise<ServerActionResponse<ReteachSuggestion[]>> {
  try {
    const res = await fetcher<ReteachSuggestion[]>(
      `/reteach/suggestions/assessment/${assessmentId}`,
      { cache: 'no-store' },
    )
    if (res.error) throw new Error(res.error.message)
    return { data: res.data ?? null, error: null }
  } catch (err) {
    return {
      data:  null,
      error: { message: err instanceof Error ? err.message : 'Failed to load suggestions.' },
    }
  }
}
