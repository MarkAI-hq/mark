'use client'

// Attach-a-file controls for the student and guardian Tracy chats: a paperclip
// button, chips for picked files (uploaded straight away so sending is
// instant), and the read-only chips shown in a sent message. The teacher page
// keeps its own richer composer (drag-and-drop, CSV parsing) but sends the
// same TracyAttachmentRef shape.

import { useCallback, useEffect, useRef, useState } from 'react'
import { Paperclip, X, Loader2, FileText, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
  uploadChatFile, type TracyAttachmentRef,
  TRACY_ACCEPT_ATTR, TRACY_READABLE_TYPES, TRACY_MAX_FILE_BYTES, TRACY_MAX_FILES,
} from './chat-attachments'

export interface PendingAttachment {
  id: string
  name: string
  type: string
  size: number
  previewUrl?: string
  state: 'uploading' | 'done' | 'error'
  path?: string
}

export function useChatAttachments() {
  const [files, setFiles] = useState<PendingAttachment[]>([])
  const filesRef = useRef(files)
  filesRef.current = files

  // Free image previews when the component goes away.
  useEffect(() => () => { filesRef.current.forEach(f => f.previewUrl && URL.revokeObjectURL(f.previewUrl)) }, [])

  const add = useCallback((list: FileList | File[]) => {
    const incoming = Array.from(list)
    const room = TRACY_MAX_FILES - filesRef.current.length
    if (incoming.length > room) toast.error(`You can attach up to ${TRACY_MAX_FILES} files at a time.`)
    for (const file of incoming.slice(0, Math.max(0, room))) {
      if (!TRACY_READABLE_TYPES.includes(file.type)) {
        toast.error(`"${file.name}" isn't supported. Use a photo (JPG, PNG, WebP) or a PDF.`)
        continue
      }
      if (file.size > TRACY_MAX_FILE_BYTES) {
        toast.error(`"${file.name}" is too large. The limit is 10 MB.`)
        continue
      }
      const id = crypto.randomUUID()
      const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      setFiles(prev => [...prev, { id, name: file.name, type: file.type, size: file.size, previewUrl, state: 'uploading' }])
      uploadChatFile(file)
        .then(({ path }) => setFiles(prev => prev.map(f => (f.id === id ? { ...f, state: 'done', path } : f))))
        .catch(() => {
          setFiles(prev => prev.map(f => (f.id === id ? { ...f, state: 'error' } : f)))
          toast.error(`Couldn't upload "${file.name}". Please try again.`)
        })
    }
  }, [])

  const remove = useCallback((id: string) => {
    setFiles(prev => {
      const gone = prev.find(f => f.id === id)
      if (gone?.previewUrl) URL.revokeObjectURL(gone.previewUrl)
      return prev.filter(f => f.id !== id)
    })
  }, [])

  /** Hands the ready files to the caller and empties the tray (previews are kept for the sent bubble). */
  const take = useCallback((): { refs: TracyAttachmentRef[]; sent: SentAttachment[] } => {
    const ready = filesRef.current.filter(f => f.state === 'done' && f.path)
    setFiles([])
    return {
      refs: ready.map(({ name, type, size, path }) => ({ name, type, size, path })),
      sent: ready.map(({ name, type, previewUrl }) => ({ name, type, previewUrl })),
    }
  }, [])

  const uploading = files.some(f => f.state === 'uploading')
  const ready = files.some(f => f.state === 'done')
  return { files, add, remove, take, uploading, ready }
}

export function AttachButton({ onFiles, disabled, className = '' }: {
  onFiles: (files: FileList) => void
  disabled?: boolean
  className?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <>
      <button
        type="button"
        aria-label="Attach a photo or PDF"
        title="Attach a photo or PDF"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={`w-[34px] h-[34px] rounded-[10px] flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${className}`}
      >
        <Paperclip className="h-4 w-4" />
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={TRACY_ACCEPT_ATTR}
        className="hidden"
        onChange={e => {
          if (e.target.files?.length) onFiles(e.target.files)
          e.target.value = '' // let the same file be picked again
        }}
      />
    </>
  )
}

export function PendingAttachmentChips({ files, onRemove }: {
  files: PendingAttachment[]
  onRemove: (id: string) => void
}) {
  if (files.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2 mb-2" aria-label="Attached files">
      {files.map(f => (
        <div key={f.id}
          className={`flex items-center gap-2 rounded-lg border bg-background pl-1.5 pr-1 py-1 text-xs max-w-[220px] ${f.state === 'error' ? 'border-destructive/60' : 'border-border'}`}>
          {f.previewUrl
            ? <img src={f.previewUrl} alt="" className="h-8 w-8 rounded object-cover shrink-0" />
            : <FileText className="h-5 w-5 text-muted-foreground shrink-0 mx-1" />}
          <span className="truncate">{f.name}</span>
          {f.state === 'uploading' && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" aria-label="Uploading" />}
          {f.state === 'error' && <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" aria-label="Upload failed" />}
          <button type="button" onClick={() => onRemove(f.id)} aria-label={`Remove ${f.name}`}
            className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}

export interface SentAttachment {
  name: string
  type: string
  previewUrl?: string
}

export function SentAttachmentChips({ files }: { files?: SentAttachment[] }) {
  if (!files?.length) return null
  return (
    <div className="flex flex-wrap gap-2 mb-1.5 justify-end">
      {files.map((f, i) => f.previewUrl
        ? <img key={i} src={f.previewUrl} alt={f.name} className="h-24 max-w-[180px] rounded-md object-cover border border-border" />
        : (
          <span key={i} className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs max-w-[220px]">
            <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">{f.name}</span>
          </span>
        ))}
    </div>
  )
}
