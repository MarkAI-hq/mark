'use server'

// src/lib/actions/notifications.ts

import { cookies } from 'next/headers'

export interface AppNotification {
  notification_id: string
  type:            string
  title:           string
  message:         string
  is_read:         boolean
  metadata?:       Record<string, unknown>
  createdAt:       string
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const cookieStore = await cookies()
  const token       = cookieStore.get('token')?.value
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

const BASE = process.env.API_BASE_URL

/**
 * Fetch all notifications for the current user.
 * Used by NotificationBell to populate the dropdown.
 */
export async function getNotifications(): Promise<{
  data:  AppNotification[] | null
  error: { message: string } | null
}> {
  try {
    const res = await fetch(`${BASE}/api/v1/notifications`, {
      headers: await getAuthHeaders(),
      cache:   'no-store', // Always fresh — bell count must be accurate
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return { data: null, error: { message: body.message ?? 'Failed to fetch notifications.' } }
    }

    const data: AppNotification[] = await res.json()
    return { data, error: null }
  } catch {
    return { data: null, error: { message: 'Network error fetching notifications.' } }
  }
}

/**
 * Mark a single notification as read.
 * Called when the user opens or clicks a notification.
 */
export async function markNotificationRead(notificationId: string): Promise<{
  data:  AppNotification | null
  error: { message: string } | null
}> {
  try {
    const res = await fetch(
      `${BASE}/api/v1/notifications/${notificationId}/read`,
      {
        method:  'PATCH',
        headers: await getAuthHeaders(),
      },
    )

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return { data: null, error: { message: body.message ?? 'Failed to mark as read.' } }
    }

    const data: AppNotification = await res.json()
    return { data, error: null }
  } catch {
    return { data: null, error: { message: 'Network error marking notification.' } }
  }
}