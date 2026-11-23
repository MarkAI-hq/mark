'use client'

// Play mode (Focus Mode v1, spec §5.5): renders the compact timer into the
// Document Picture-in-Picture window via a portal. The window is opened and
// closed by FocusProvider; audio stays in the main window and the PiP only
// calls the provider's actions. Re-docks automatically on `pagehide`.

import { createPortal } from 'react-dom'
import { useFocus } from './focus-provider'
import { CompactTimer } from './focus-timer'

export function PlayMode() {
  const f = useFocus()
  if (!f.pipWindow) return null
  return createPortal(<CompactTimer f={f} />, f.pipWindow.document.body)
}
