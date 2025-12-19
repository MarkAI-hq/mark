// src/hooks/use-auth.ts
'use client'

import { useSyncExternalStore } from 'react'
import { userSignal } from '@/signals/auth'

export function useAuth() {
  const user = useSyncExternalStore(
    (callback) => {
      const unsub = userSignal.subscribe(callback)
      return unsub
    },
    () => userSignal.value
  )

  return { user }
}
