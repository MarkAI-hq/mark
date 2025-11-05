// src/hooks/use-auth.ts
'use client'

import { userSignal } from '@/signals/auth';

/**
 * @returns 
 */
export function useAuth() {
  const user = userSignal.value;
  return { user };
}