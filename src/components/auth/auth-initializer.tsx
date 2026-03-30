'use client'

// src/components/auth/auth-initializer.tsx

import { useEffect }     from 'react'
import { userSignal }    from '@/signals/auth'
import type { User }     from '@/lib/types'

interface AuthInitializerProps {
  user: User | null
}

export function AuthInitializer({ user }: AuthInitializerProps) {
  useEffect(() => {

    const current = userSignal.value
    const roleChanged = current?.role !== user?.role
    const idChanged   = current?.id   !== user?.id

    if (idChanged || roleChanged || (!current && user)) {
      userSignal.value = user
    }
  }, [user])

  return null
}