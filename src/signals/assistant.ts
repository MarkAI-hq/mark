// src/signals/assistant.ts
'use client' // Signals are for client-side state

import { signal } from '@preact/signals-react'

/**
 * The signed-in student's name for their Tracy assistant ("Tracy" until they
 * rename it). Seeded from the server by the portal shell, and updated the moment
 * the student renames it, so the main menu changes without a page reload.
 * null = not loaded yet / use the default.
 */
export const assistantNameSignal = signal<string | null>(null)
