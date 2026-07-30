// src/lib/actions/teacher.ts
import { fetcher } from '@/lib/fetch'

export async function updateTeacherProfile(data: {
  firstName: string
  lastName:  string
  phone?:    string
}) {
  try {
    const response = await fetcher('/auth/me', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        first_name:   data.firstName,
        last_name:    data.lastName,
        phone_number: data.phone,
      }),
    })
    if (response.error) throw new Error(response.error.message)
    return { data: response.data, error: null }
  } catch (err) {
    return { data: null, error: { message: err instanceof Error ? err.message : 'Failed to update profile' } }
  }
}

export async function updateTeacherPassword(data: {
  currentPassword: string
  newPassword:     string
  confirmPassword: string
}) {
  try {
    const response = await fetcher('/auth/change-password', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        current_password: data.currentPassword,
        new_password:     data.newPassword,
      }),
    })
    if (response.error) throw new Error(response.error.message)
    return { data: response.data, error: null }
  } catch (err) {
    return { data: null, error: { message: err instanceof Error ? err.message : 'Failed to update password' } }
  }
}

export async function updateNotificationPreferences(data: {
  email_enabled:    boolean
  in_app_enabled:   boolean
  type_preferences: Record<string, boolean>
}) {
  try {
    const response = await fetcher('/notifications/settings', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    })
    if (response.error) throw new Error(response.error.message)
    return { data: response.data, error: null }
  } catch (err) {
    return { data: null, error: { message: err instanceof Error ? err.message : 'Failed to save preferences' } }
  }
}