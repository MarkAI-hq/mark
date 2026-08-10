'use client'

// src/app/student/(portal)/knowledge-base/knowledge-base-client.tsx

import { useState, useTransition, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Library, Plus, Star, CheckCircle2, Clock, XCircle, Sparkles, BookOpen,
  FileText, ImageIcon, Upload, PenLine,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { submitStudentNote, uploadStudentNote, updateStudentNote } from '@/lib/actions/student-notes'
import { getAvailableSubjects } from '@/lib/actions/curricula'
import type { StudentNote, StudentNoteStats } from '@/lib/actions/student-notes'
import { formatTopicTitle } from '@/lib/utils'

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending:  { label: 'Pending review', icon: Clock,        color: 'text-amber-600',  bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: 'In school KB',   icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Not accepted',   icon: XCircle,      color: 'text-rose-500',    bg: 'bg-rose-50 text-rose-700 border-rose-200' },
} as const

// ── Add Note Dialog ───────────────────────────────────────────────────────────

function AddNoteDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  onSuccess: (note: StudentNote) => void
}) {
  const [tab, setTab]         = useState<'write' | 'upload'>('write')
  const [subject, setSubject] = useState('')
  const [topic, setTopic]     = useState('')
  const [content, setContent] = useState('')
  const [file, setFile]       = useState<File | null>(null)
  const [isPending, start]    = useTransition()
  const fileRef               = useRef<HTMLInputElement>(null)
  const [subjectOptions, setSubjectOptions] = useState<string[]>([])

  useEffect(() => {
    getAvailableSubjects().then(({ data }) => {
      if (data?.length) setSubjectOptions(data.map((s) => s.display_name))
    })
  }, [])

  function reset() {
    setSubject(''); setTopic(''); setContent(''); setFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleClose() { reset(); onClose() }

  function handleSubmit() {
    if (!subject.trim() || !topic.trim()) {
      toast.error('Fill in the subject and topic fields.')
      return
    }
    start(async () => {
      if (tab === 'write') {
        if (content.trim().length < 20) {
          toast.error('Note content must be at least 20 characters.')
          return
        }
        const res = await submitStudentNote({ subject, topic, content })
        if (res.error) { toast.error(res.error.message); return }
        toast.success('Note saved! +5 points earned')
        onSuccess(res.data!)
        handleClose()
      } else {
        if (!file) { toast.error('Choose a file to upload.'); return }
        const fd = new FormData()
        fd.append('file', file)
        fd.append('subject', subject)
        fd.append('topic', topic)
        const res = await uploadStudentNote(fd)
        if (res.error) { toast.error(res.error.message); return }
        toast.success('File uploaded and extracted! +5 points earned')
        onSuccess(res.data!)
        handleClose()
      }
    })
  }

  const tabCls = (t: 'write' | 'upload') =>
    `flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
      tab === t ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
    }`

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold" />
            Add to your knowledge base
          </DialogTitle>
        </DialogHeader>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 rounded-lg bg-muted w-fit">
          <button className={tabCls('write')} onClick={() => setTab('write')}>
            <PenLine className="h-3.5 w-3.5" /> Write
          </button>
          <button className={tabCls('upload')} onClick={() => setTab('upload')}>
            <Upload className="h-3.5 w-3.5" /> Upload file
          </button>
        </div>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sub">Subject</Label>
              {subjectOptions.length > 0 ? (
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger id="sub"><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {subjectOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input id="sub" placeholder="e.g. Mathematics" value={subject} onChange={(e) => setSubject(e.target.value)} />
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="top">Topic</Label>
              <Input id="top" placeholder="e.g. Quadratic Equations" value={topic} onChange={(e) => setTopic(e.target.value)} />
            </div>
          </div>

          {tab === 'write' ? (
            <div className="space-y-1.5">
              <Label htmlFor="content">Your note</Label>
              <Textarea
                id="content" rows={5}
                placeholder="Write what you understand about this topic in your own words…"
                value={content} onChange={(e) => setContent(e.target.value)} className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {content.length} chars {content.length < 20 && <span className="text-rose-500">(min 20)</span>}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>File (PDF, photo of notes)</Label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-gold/40 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {file ? (
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <FileText className="h-5 w-5 text-gold" />
                    <span className="font-medium truncate max-w-xs">{file.name}</span>
                    <button
                      className="text-muted-foreground hover:text-rose-500 ml-2"
                      onClick={(e) => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = '' }}
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Click or drag a PDF or image</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">PDF, PNG, JPG, WEBP up to 20MB</p>
                  </>
                )}
              </div>
              <input
                ref={fileRef} type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          )}

          <div className="rounded-lg bg-gold/8 border border-gold/20 px-3 py-2 text-xs text-gold-foreground/80 flex items-start gap-2">
            <Star className="h-3.5 w-3.5 text-gold shrink-0 mt-0.5" />
            <span>
              You earn <strong>5 points</strong> immediately. If your teacher approves it, it goes into the school knowledge base.
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? (tab === 'write' ? 'Saving…' : 'Uploading…') : tab === 'write' ? 'Save note' : 'Upload & extract'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Edit Note Dialog ──────────────────────────────────────────────────────────

function EditNoteDialog({
  note, open, onOpenChange, onSaved,
}: {
  note: StudentNote
  open: boolean
  onOpenChange: (v: boolean) => void
  onSaved: (note: StudentNote) => void
}) {
  const [content, setContent] = useState(note.content)
  const [isPending, startTransition] = useTransition()

  useEffect(() => { if (open) setContent(note.content) }, [open, note.content])

  function handleSave() {
    if (content.trim().length < 20) {
      toast.error('Notes need at least 20 characters.')
      return
    }
    startTransition(async () => {
      const res = await updateStudentNote(note.id, content.trim())
      if (res.error) { toast.error(res.error.message); return }
      toast.success('Note updated — back in review.')
      if (res.data) onSaved(res.data)
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{formatTopicTitle(note.topic)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">{note.subject}</p>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            className="text-sm"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
          <Button onClick={handleSave} disabled={isPending || content.trim() === note.content.trim()}>
            {isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Note card ──────────────────────────────────────────────────────────────────

function NoteCard({ note, onUpdated }: { note: StudentNote; onUpdated: (note: StudentNote) => void }) {
  const cfg = STATUS_CONFIG[note.status]
  const StatusIcon = cfg.icon
  const SourceIcon = note.source_type === 'pdf' ? FileText
    : note.source_type === 'image' ? ImageIcon
    : PenLine
  const [editOpen, setEditOpen] = useState(false)

  return (
    <>
      <Card
        className="group cursor-pointer hover:border-gold/40 transition-colors"
        onClick={() => setEditOpen(true)}
      >
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <SourceIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <p className="text-sm font-semibold text-foreground truncate">{formatTopicTitle(note.topic)}</p>
              </div>
              <p className="text-xs text-muted-foreground">{note.subject}</p>
            </div>
            <Badge variant="outline" className={`text-[10px] shrink-0 ${cfg.bg}`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {cfg.label}
            </Badge>
          </div>

          <p className="text-xs text-foreground/80 leading-relaxed line-clamp-3">{note.content}</p>

          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{new Date(note.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span className="flex items-center gap-1 text-gold font-medium">
              <Star className="h-3 w-3" />
              {note.reward_points} pts
            </span>
          </div>
        </CardContent>
      </Card>
      <EditNoteDialog note={note} open={editOpen} onOpenChange={setEditOpen} onSaved={onUpdated} />
    </>
  )
}

// ── Main client component ────────────────────────────────────────────────────

interface Props {
  user: any
  initialNotes: StudentNote[]
  initialStats: StudentNoteStats
}

export function KnowledgeBaseClient({ initialNotes, initialStats }: Props) {
  const [notes, setNotes]     = useState<StudentNote[]>(initialNotes)
  const [stats, setStats]     = useState(initialStats)
  const [dialogOpen, setDialog] = useState(false)
  const [filter, setFilter]   = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [search, setSearch]   = useState('')

  function handleNoteUpdated(note: StudentNote) {
    setNotes((prev) => prev.map((n) => (n.id === note.id ? note : n)))
  }

  function handleNoteAdded(note: StudentNote) {
    setNotes((prev) => [note, ...prev])
    setStats((prev) => ({
      total: prev.total + 1,
      approved: prev.approved,
      total_points: prev.total_points + note.reward_points,
    }))
  }

  const filtered = notes
    .filter((n) => filter === 'all' || n.status === filter)
    .filter((n) => {
      const q = search.trim().toLowerCase()
      if (!q) return true
      return (
        n.topic.toLowerCase().includes(q) ||
        n.subject.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
      )
    })
  const pendingCount  = notes.filter((n) => n.status === 'pending').length
  const approvedCount = notes.filter((n) => n.status === 'approved').length

  return (
    <>
      <AddNoteDialog
        open={dialogOpen}
        onClose={() => setDialog(false)}
        onSuccess={handleNoteAdded}
      />

      <div className="space-y-6 pb-16">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Library className="h-5 w-5 text-gold" />
              <h1 className="text-xl font-bold text-foreground">My Knowledge Base</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Notes you write here train the AI to explain things in your own words.
            </p>
          </div>
          <Button onClick={() => setDialog(true)} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Add note
          </Button>
        </div>

        {/* ── Stats ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Notes submitted</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{stats.approved}</p>
              <p className="text-xs text-muted-foreground mt-0.5">In school KB</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gold flex items-center justify-center gap-1">
                <Star className="h-5 w-5" />
                {stats.total_points}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Points earned</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Search + filter tabs ──────────────────────────────────── */}
        {notes.length > 0 && (
          <div className="space-y-2">
            <Input
              placeholder="Search notes by topic, subject, or content…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <div className="flex gap-2 flex-wrap">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filter === f
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f === 'all'
                    ? `All (${notes.length})`
                    : f === 'pending'
                    ? `Pending (${pendingCount})`
                    : f === 'approved'
                    ? `In school KB (${approvedCount})`
                    : `Rejected (${notes.filter((n) => n.status === 'rejected').length})`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Notes list ─────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            {notes.length === 0 ? (
              <>
                <h3 className="text-sm font-semibold text-foreground">Your knowledge base is empty</h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Start by writing what you understand about any topic. Your notes help the AI personalise your lessons.
                </p>
                <Button size="sm" onClick={() => setDialog(true)} className="mt-2 gap-2">
                  <Plus className="h-4 w-4" />
                  Write your first note
                </Button>
              </>
            ) : search.trim() ? (
              <p className="text-sm text-muted-foreground">No notes match &ldquo;{search.trim()}&rdquo;.</p>
            ) : (
              <p className="text-sm text-muted-foreground">No {filter} notes.</p>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((note) => (
              <NoteCard key={note.id} note={note} onUpdated={handleNoteUpdated} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
