'use client'

// src/app/student/(portal)/study-plans/[planId]/studio/_components/lesson-sidebar.tsx
//
// Persistent lesson sidebar — outline navigation, supplementary reading, and a
// notes panel, so the Studio isn't just a full-bleed scene with nothing else
// available. Reuses existing data sources (Library, Student Notes) rather
// than inventing new content pipelines.

import { useState, useEffect } from 'react'
import { CheckCircle2, Circle, Lock, BookOpen, Loader2, PanelLeftClose, PanelLeftOpen, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { getLibraryResources, type LibraryResource } from '@/lib/actions/library'
import { getMyNotes, submitStudentNote, updateStudentNote, type StudentNote } from '@/lib/actions/student-notes'

interface Props {
  scenes: any[]
  currentIndex: number
  maxReached: number
  onNavigate: (i: number) => void
  subject: string
  topic: string
  open: boolean
  onToggle: () => void
}

type Tab = 'outline' | 'read' | 'notes'

export function LessonSidebar({ scenes, currentIndex, maxReached, onNavigate, subject, topic, open, onToggle }: Props) {
  const [tab, setTab] = useState<Tab>('outline')
  const [resources, setResources] = useState<LibraryResource[] | null>(null)
  const [notes, setNotes] = useState<StudentNote[] | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [editingNote, setEditingNote] = useState<StudentNote | null>(null)
  const [editContent, setEditContent] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  function openEdit(n: StudentNote) {
    setEditingNote(n)
    setEditContent(n.content)
  }

  function handleSaveEdit() {
    if (!editingNote || editContent.trim().length < 20 || savingEdit) return
    setSavingEdit(true)
    updateStudentNote(editingNote.id, editContent.trim())
      .then(({ data, error }) => {
        if (error) { toast.error(error.message ?? 'Could not save note'); return }
        toast.success('Note updated')
        if (data) setNotes((prev) => (prev ?? []).map((n) => (n.id === data.id ? data : n)))
        setEditingNote(null)
      })
      .finally(() => setSavingEdit(false))
  }

  useEffect(() => {
    if (tab === 'read' && resources === null) {
      getLibraryResources({ subject }).then(({ data }) => setResources(data ?? []))
    }
    if (tab === 'notes' && notes === null) {
      getMyNotes().then(({ data }) => setNotes((data ?? []).filter((n) => n.topic === topic)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  function handleSaveNote() {
    if (!noteDraft.trim() || savingNote) return
    setSavingNote(true)
    submitStudentNote({ subject, topic, content: noteDraft.trim() })
      .then(({ data, error }) => {
        if (error) { toast.error(error.message ?? 'Could not save note'); return }
        toast.success('Note saved to your Knowledge Base')
        setNoteDraft('')
        if (data) setNotes((prev) => [data, ...(prev ?? [])])
      })
      .finally(() => setSavingNote(false))
  }

  if (!open) {
    return (
      <button
        onClick={onToggle}
        title="Show lesson outline, reading, and notes"
        className="flex items-center justify-center w-9 border-r shrink-0 hover:bg-muted transition-colors"
      >
        <PanelLeftOpen className="h-4 w-4 text-muted-foreground" />
      </button>
    )
  }

  return (
    <aside className="w-64 shrink-0 border-r bg-background flex flex-col h-full overflow-hidden fixed inset-y-0 left-0 z-40 md:relative md:z-auto md:bg-muted/10">
      <div className="flex items-center border-b shrink-0">
        <div className="flex flex-1">
          {([
            { id: 'outline', label: 'Outline' },
            { id: 'read', label: 'Read more' },
            { id: 'notes', label: 'Notes' },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 px-2 py-2.5 text-[11px] font-semibold border-b-2 transition-colors ${
                tab === t.id ? 'border-gold text-gold' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={onToggle} title="Hide sidebar" className="p-2 text-muted-foreground hover:text-foreground shrink-0">
          <PanelLeftClose className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {tab === 'outline' && (
          <ul className="space-y-0.5">
            {scenes.map((s, i) => {
              const locked = i > maxReached
              const isDone = i < currentIndex && i <= maxReached
              const isCurrent = i === currentIndex
              return (
                <li key={i}>
                  <button
                    disabled={locked}
                    onClick={() => onNavigate(i)}
                    aria-current={isCurrent ? 'step' : undefined}
                    className={`w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                      isCurrent ? 'bg-gold/10 text-foreground font-medium' : locked ? 'text-muted-foreground/50 cursor-not-allowed' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {locked ? (
                      <Lock className="h-3 w-3 shrink-0" />
                    ) : isDone ? (
                      <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" />
                    ) : (
                      <Circle className="h-3 w-3 shrink-0" />
                    )}
                    <span className="truncate">{s?.title ?? `Step ${i + 1}`}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {tab === 'read' && (
          resources === null ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : resources.length === 0 ? (
            <p className="text-xs text-muted-foreground">No extra reading yet for {subject}. Check the Library for more.</p>
          ) : (
            <ul className="space-y-2">
              {resources.slice(0, 15).map((r) => (
                <li key={r.id}>
                  <a
                    href={r.external_url ?? '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start gap-1.5 text-xs text-foreground/80 hover:text-gold transition-colors"
                  >
                    <BookOpen className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                    <span className="flex-1 leading-snug">{r.title}</span>
                    <ExternalLink className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground" />
                  </a>
                </li>
              ))}
            </ul>
          )
        )}

        {tab === 'notes' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder={`Jot a note on ${topic}…`}
                rows={4}
                className="text-xs resize-none"
              />
              <Button size="sm" className="w-full h-7 text-xs" onClick={handleSaveNote} disabled={!noteDraft.trim() || savingNote}>
                {savingNote ? 'Saving…' : 'Save note'}
              </Button>
            </div>
            {notes && notes.length > 0 && (
              <div className="space-y-2 pt-1 border-t">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Your notes on this topic</p>
                {notes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => openEdit(n)}
                    className="w-full text-left rounded-lg border bg-card px-2.5 py-2 text-xs text-foreground/80 leading-relaxed hover:border-gold/40 transition-colors"
                  >
                    {n.content}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={!!editingNote} onOpenChange={(v) => !v && setEditingNote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit note</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={6}
            className="text-sm"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingNote(null)} disabled={savingEdit}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit || editContent.trim().length < 20}>
              {savingEdit ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  )
}
