// src/lib/session.ts
import { cookies } from 'next/headers';
import type { User } from './types';

/**
 * @returns The parsed User object or null if the user is not logged in or the cookie is invalid.
 */
export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get('user')?.value;

  if (!userCookie) {
    return null;
  }

  try {
    // Safely parse the user data from the cookie.
    const user: User = JSON.parse(userCookie);
    return user;
  } catch (error) {
    console.error('Failed to parse user cookie:', error);
    return null;
  }
}
