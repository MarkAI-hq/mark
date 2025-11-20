// src/components/auth/auth-initializer.tsx
'use client'

import { useEffect } from 'react';
import { userSignal } from '@/signals/auth';
import type { User } from '@/lib/types';

interface AuthInitializerProps {
  user: User | null;
}


export function AuthInitializer({ user }: AuthInitializerProps) {
  useEffect(() => {

    if (user?.id !== userSignal.value?.id) {
      userSignal.value = user;
    }
  }, [user]); // The dependency on 'user' ensures this runs whenever the server provides a new user object.

  return null; // This component renders nothing.
}