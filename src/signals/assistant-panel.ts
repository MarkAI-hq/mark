// src/signals/assistant-panel.ts
'use client'

import { signal } from '@preact/signals-react'

/**
 * The student's slide-in assistant panel. Any "Ask Tracy" entry point opens it
 * in place (no new tab, no leaving a lesson half-done); `prompt` is sent as the
 * student's first message. `nonce` changes on every open so asking the same
 * thing twice still sends it.
 */
export const assistantPanelSignal = signal<{ open: boolean; prompt?: string; nonce: number }>({
  open: false,
  nonce: 0,
})

export function openAssistantPanel(prompt?: string) {
  assistantPanelSignal.value = { open: true, prompt, nonce: assistantPanelSignal.value.nonce + 1 }
}

export function closeAssistantPanel() {
  assistantPanelSignal.value = { ...assistantPanelSignal.value, open: false, prompt: undefined }
}
