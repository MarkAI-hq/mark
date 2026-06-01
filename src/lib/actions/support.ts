'use server'

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

export interface SupportEmailPayload {
  name:    string
  email:   string
  topic:   string
  message: string
}

interface SupportEmailResponse {
  message: string
}

export async function sendSupportEmail(
  payload: SupportEmailPayload,
): Promise<ServerActionResponse<SupportEmailResponse>> {
  if (!payload.name || !payload.email || !payload.topic || !payload.message) {
    return { data: null, error: { message: 'All fields are required.' } }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(payload.email)) {
    return { data: null, error: { message: 'Invalid email address.' } }
  }

  return fetcher<SupportEmailResponse>('/support/contact', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
