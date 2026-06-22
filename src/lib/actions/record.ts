'use server'

import { cookies } from 'next/headers'
import { signRecordToken, recordShareConfigured } from '@/lib/record-share'

/**
 * Mint a signed, expiring public share link for a student's proof-of-learning
 * record. Gated to authenticated sessions (only logged-in staff/students can
 * generate links). Returns a relative path; the caller prepends the origin.
 */
export async function createRecordShareUrl(
  studentId: string,
): Promise<{ url?: string; error?: string }> {
  const token = (await cookies()).get('token')?.value
  if (!token) return { error: 'You must be signed in to share a record.' }
  if (!recordShareConfigured()) return { error: 'Public sharing is not configured.' }

  try {
    const sig = signRecordToken(studentId)
    return { url: `/record/${studentId}?token=${encodeURIComponent(sig)}` }
  } catch {
    return { error: 'Could not generate a share link.' }
  }
}
