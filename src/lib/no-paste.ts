'use client'

// Answers and chat messages must be the student's own typing. Pasting (and
// drag-dropping text) into those boxes is blocked with a short explanation, and
// each blocked attempt is announced as a `mirror:paste-blocked` window event so
// integrity signals can count it. Typing, autocorrect and the on-screen
// keyboard are unaffected.

import type { ClipboardEvent, DragEvent } from 'react'
import { toast } from 'sonner'

let lastToast = 0

function block(e: { preventDefault: () => void }, where: string) {
  e.preventDefault()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mirror:paste-blocked', { detail: { where } }))
  }
  // One toast at a time, even if they keep trying.
  const now = Date.now()
  if (now - lastToast > 4000) {
    lastToast = now
    toast('Type it in your own words', {
      description: 'Pasting is turned off for answers and chat, so your work stays yours.',
    })
  }
}

/** Spread onto a single <textarea>/<input>: `{...noPasteProps('chat')}`. */
export function noPasteProps(where: string) {
  return {
    onPaste: (e: ClipboardEvent<HTMLElement>) => block(e, where),
    onDrop: (e: DragEvent<HTMLElement>) => {
      if (e.dataTransfer?.types?.includes('text/plain')) block(e, where)
    },
  }
}

/**
 * Put on a container (`onPasteCapture`/`onDropCapture`) to cover every text box
 * inside it — e.g. all of a lesson scene's answer fields — without touching
 * each scene component.
 */
export function noPasteCaptureProps(where: string) {
  const isTextField = (t: EventTarget | null) =>
    t instanceof HTMLTextAreaElement ||
    (t instanceof HTMLInputElement && !['checkbox', 'radio', 'button', 'submit', 'range', 'file'].includes(t.type)) ||
    (t instanceof HTMLElement && t.isContentEditable)
  return {
    onPasteCapture: (e: ClipboardEvent<HTMLElement>) => {
      if (isTextField(e.target)) block(e, where)
    },
    onDropCapture: (e: DragEvent<HTMLElement>) => {
      if (isTextField(e.target) && e.dataTransfer?.types?.includes('text/plain')) block(e, where)
    },
  }
}

// ── Typing signals (integrity) ────────────────────────────────────────────────
// Cheap, privacy-light evidence that an answer was typed here: how many keys
// were pressed vs. how many characters ended up in the box, how long it took,
// and how many pastes were blocked. Sent alongside free-text answers so the
// grader can tell typed work from text that appeared some other way.

import { useCallback, useEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'

export interface TypingSignals {
  chars: number
  keystrokes: number
  ms: number
  paste_blocked: number
}

export function useTypingSignals() {
  const keys = useRef(0)
  const first = useRef<number | null>(null)
  const pastes = useRef(0)

  useEffect(() => {
    const onBlocked = () => { pastes.current += 1 }
    window.addEventListener('mirror:paste-blocked', onBlocked)
    return () => window.removeEventListener('mirror:paste-blocked', onBlocked)
  }, [])

  const onKeyDown = useCallback((e: KeyboardEvent<HTMLElement>) => {
    if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter' || e.key === 'Unidentified') {
      keys.current += 1
      if (first.current == null) first.current = Date.now()
    }
  }, [])

  const read = useCallback((text: string): TypingSignals => ({
    chars: text.length,
    keystrokes: keys.current,
    ms: first.current ? Date.now() - first.current : 0,
    paste_blocked: pastes.current,
  }), [])

  return { onKeyDown, read }
}
