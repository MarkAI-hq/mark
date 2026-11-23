// src/components/tracy/chat-attachments.ts
//
// Shared wire format for files attached to a Tracy chat message. The page
// uploads each file to mark-api (via /api/upload) as soon as it is picked and
// sends Tracy only the storage path; Tracy reads the file back with the user's
// own token and gives it to the model as real image/PDF input.

export interface TracyAttachmentRef {
  name: string
  type: string
  size: number
  /** Storage key from /api/upload. Without it Tracy only sees the file's name. */
  path?: string
}

/** Types Tracy can actually read (mark-api /upload accepts exactly these). */
export const TRACY_READABLE_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp']
export const TRACY_ACCEPT_ATTR = '.pdf,.png,.jpg,.jpeg,.webp'
export const TRACY_MAX_FILE_BYTES = 10 * 1024 * 1024
export const TRACY_MAX_FILES = 4

export async function uploadChatFile(file: File): Promise<{ url: string; path: string }> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch('/api/upload', { method: 'POST', body: formData })
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
  const data = await res.json()
  return { url: data.url as string, path: data.filePath as string }
}
