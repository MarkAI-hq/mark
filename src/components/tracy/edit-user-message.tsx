'use client'

// Editing a message the user already sent to Tracy — shared by the teacher /
// admin, student and guardian chats. Saving replaces that message and every
// turn after it (server-side too, via the chat's `editMessageId`), then Tracy
// answers the edited text. Only offered on messages that have a saved row id.

import { useEffect, useRef, useState } from 'react'
import { Pencil } from 'lucide-react'

export function EditMessageButton({ onClick, disabled, className = '' }: {
  onClick: () => void
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Edit message"
      title="Edit message"
      className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40 ${className}`}
    >
      <Pencil className="h-3.5 w-3.5" />
    </button>
  )
}

export function UserMessageEditor({ initial, onCancel, onSave, hasAttachments }: {
  initial: string
  onCancel: () => void
  onSave: (text: string) => void
  /** Restored chats don't keep the files themselves — say so instead of silently dropping them. */
  hasAttachments?: 'kept' | 'dropped'
}) {
  const [value, setValue] = useState(initial)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`
  }, [])

  const trimmed = value.trim()
  const save = () => { if (trimmed) onSave(trimmed) }

  return (
    <div className="w-full max-w-[85%] ml-auto rounded-2xl border border-border bg-background p-2 shadow-sm">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          e.target.style.height = 'auto'
          e.target.style.height = `${Math.min(e.target.scrollHeight, 240)}px`
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') { e.preventDefault(); onCancel() }
          else if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save() }
        }}
        rows={1}
        aria-label="Edit your message"
        className="w-full resize-none bg-transparent px-2 py-1.5 text-sm text-foreground outline-none"
      />
      {hasAttachments === 'dropped' && (
        <p className="px-2 pb-1 text-[11.5px] text-muted-foreground">
          Files from the original message aren&apos;t re-sent — attach them again if Tracy needs them.
        </p>
      )}
      <div className="flex items-center justify-between gap-2 px-1 pt-1">
        <p className="text-[11.5px] text-muted-foreground">Tracy will answer again from here.</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-3 py-1.5 text-[13px] font-medium text-muted-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!trimmed}
            className="rounded-md bg-[#b88a1f] px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-[#8a6713] disabled:opacity-50"
          >
            Save &amp; send
          </button>
        </div>
      </div>
    </div>
  )
}
