// src/signals/auth.ts
'use client' // Signals are for client-side state

import { signal } from '@preact/signals-react';
import type { User } from '@/lib/types';

export const userSignal = signal<User | null>(null);