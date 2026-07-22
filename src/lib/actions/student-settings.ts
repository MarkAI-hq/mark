'use server'

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

export interface UpdateProfileInput {
  first_name?: string
  last_name?: string
  phone_number?: string
}

export async function updateOwnProfile(
  data: UpdateProfileInput,
): Promise<ServerActionResponse<{ first_name: string; last_name: string; phone_number: string | null }>> {
  return fetcher('/students/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function changeOwnPin(
  currentPin: string,
  newPin: string,
): Promise<ServerActionResponse<{ changed: boolean }>> {
  return fetcher('/students/me/change-pin', {
    method: 'POST',
    body: JSON.stringify({ current_pin: currentPin, new_pin: newPin }),
  })
}

export interface NotificationSettings {
  user_id: string
  email_enabled: boolean
  in_app_enabled: boolean
  type_preferences: Record<string, boolean> | null
}

export async function getNotificationSettings(): Promise<ServerActionResponse<NotificationSettings>> {
  return fetcher<NotificationSettings>('/notifications/settings', { cache: 'no-store' })
}

export async function updateNotificationSettings(data: {
  email_enabled: boolean
  in_app_enabled: boolean
}): Promise<ServerActionResponse<NotificationSettings>> {
  return fetcher<NotificationSettings>('/notifications/settings', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
