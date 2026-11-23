// src/hooks/use-assistant-name.ts
'use client'

import { createContext, createElement, useContext, useSyncExternalStore, type ReactNode } from 'react'
import { assistantNameSignal } from '@/signals/assistant'

export const DEFAULT_ASSISTANT_NAME = 'Tracy'

/** The server-provided name, available from the first paint (so nothing flashes "Tracy"). */
const AssistantNameContext = createContext<string | null>(null)

export function AssistantNameProvider({ name, children }: { name: string | null | undefined; children: ReactNode }) {
  return createElement(AssistantNameContext.Provider, { value: name?.trim() || null }, children)
}

/**
 * The student's current name for their assistant: the live value (updates the moment
 * they rename it), else the server-provided one, else "Tracy". Use this anywhere the
 * assistant is named in student-facing text.
 */
export function useAssistantName(initial?: string | null): string {
  const fromServer = useContext(AssistantNameContext)
  const live = useSyncExternalStore(
    (callback) => assistantNameSignal.subscribe(callback),
    () => assistantNameSignal.value,
    () => null,
  )
  return live?.trim() || initial?.trim() || fromServer?.trim() || DEFAULT_ASSISTANT_NAME
}

/** Replace the word "Tracy" in a fixed phrase ("Ask Tracy") with the student's name for it. */
export function withAssistantName(text: string, name: string): string {
  return name === DEFAULT_ASSISTANT_NAME ? text : text.replace(/\bTracy\b/g, name)
}

/** Publish a new name (or null to reset to the default) to everything showing it. */
export function publishAssistantName(name: string | null) {
  assistantNameSignal.value = name?.trim() || null
}
