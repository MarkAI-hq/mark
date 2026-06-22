'use client'

// src/app/(dashboard)/dashboard/knowledge-base/knowledge-base-client.tsx

import { useState, useRef, useTransition, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Library, Upload, Trash2, CheckCircle2, XCircle, Clock,
  FileText, AlertCircle, Loader2, Plus, BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { approveNote, rejectNote } from '@/lib/actions/student-notes'
import { uploadDocument, deleteDocument } from '@/lib/actions/curriculum-documents'
import { getSubjects } from '@/lib/actions/subjects'
import type { StudentNote } from '@/lib/actions/student-notes'
import type { CurriculumDocument } from '@/lib/actions/curriculum-documents'

// ── Note status ────────────────────────────────────────────────────────────────

const NOTE_STATUS = {
  pending:  { label: 'Pending',  bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: 'Approved', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
} as const

// ── Extraction status ──────────────────────────────────────────────────────────

const DOC_STATUS = {
  pending:    { label: 'Pending',    icon: Clock,        bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  processing: { label: 'Processing', icon: Loader2,      bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  done:       { label: 'Indexed',    icon: CheckCircle2, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  failed:     { label: 'Failed',     icon: AlertCircle,  bg: 'bg-rose-50 text-rose-700 border-rose-200' },
} as const

// ── Note review card ───────────────────────────────────────────────────────────

function NoteReviewCard({
  note,
  onApprove,
  onReject,
}: {
  note: StudentNote
  onApprove: (id: string) => void
  onReject:  (id: string) => void
}) {
  const [isPending, start] = useTransition()

  function handleApprove() {
    start(async () => {
      const res = await approveNote(note.id)
      if (res.error) { toast.error(res.error.message); return }
      toast.success('Note approved — added to school KB')
      onApprove(note.id)
    })
  }

  function handleReject() {
    start(async () => {
      const res = await rejectNote(note.id)
      if (res.error) { toast.error(res.error.message); return }
      toast.success('Note rejected')
      onReject(note.id)
    })
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{note.topic}</p>
            <p className="text-xs text-muted-foreground">{note.subject}</p>
          </div>
          <Badge variant="outline" className={`text-[10px] shrink-0 ${NOTE_STATUS[note.status].bg}`}>
            {NOTE_STATUS[note.status].label}
          </Badge>
        </div>

        <p className="text-xs text-foreground/80 leading-relaxed line-clamp-4">{note.content}</p>

        <p className="text-[10px] text-muted-foreground">
          {new Date(note.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>

        {note.status === 'pending' && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" className="flex-1 gap-1.5 text-xs h-8" onClick={handleApprove} disabled={isPending}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1.5 text-xs h-8 text-rose-600 border-rose-200 hover:bg-rose-50"
              onClick={handleReject}
              disabled={isPending}
            >
              <XCircle className="h-3.5 w-3.5" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Upload form ────────────────────────────────────────────────────────────────

function UploadDocumentForm({ onUploaded }: { onUploaded: (doc: CurriculumDocument) => void }) {
  const fileRef                         = useRef<HTMLInputElement>(null)
  const [title,   setTitle]             = useState('')
  const [subject, setSubject]           = useState('')
  const [level,   setLevel]             = useState('')
  const [year,    setYear]              = useState('')
  const [docType, setDocType]           = useState('')
  const [file,    setFile]              = useState<File | null>(null)
  const [isPending, start]              = useTransition()
  const [subjectOptions, setSubjectOptions] = useState<string[]>([])

  useEffect(() => {
    getSubjects().then(({ data }) => {
      if (data?.length) setSubjectOptions((data as any[]).map((s: any) => s.name as string))
    })
  }, [])

  function reset() {
    setTitle(''); setSubject(''); setLevel(''); setYear(''); setDocType(''); setFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleSubmit() {
    if (!title.trim() || !subject.trim() || !docType || !file) {
      toast.error('Fill in title, subject, type, and select a file.')
      return
    }
    const fd = new FormData()
    fd.append('file', file)
    fd.append('title', title)
    fd.append('subject', subject)
    fd.append('document_type', docType)
    if (level) fd.append('level', level)
    if (year)  fd.append('year',  year)

    start(async () => {
      const res = await uploadDocument(fd)
      if (res.error) { toast.error(res.error.message); return }
      toast.success('Document uploaded — processing in background')
      onUploaded(res.data!)
      reset()
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Upload className="h-4 w-4 text-gold" />
          Upload document
        </CardTitle>
        <CardDescription className="text-xs">
          PDF, DOCX, or TXT. The AI indexes it in the background and uses it to ground lessons.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="doc-title">Title</Label>
            <Input id="doc-title" placeholder="e.g. UNEB 2023 Physics P1" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-subject">Subject</Label>
            {subjectOptions.length > 0 ? (
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger id="doc-subject"><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {subjectOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input id="doc-subject" placeholder="e.g. Physics" value={subject} onChange={(e) => setSubject(e.target.value)} />
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select onValueChange={setDocType} value={docType}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="past_paper">Past Paper</SelectItem>
                <SelectItem value="teacher_notes">Teacher Notes</SelectItem>
                <SelectItem value="marking_scheme">Marking Scheme</SelectItem>
                <SelectItem value="resource">Resource</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-level">Level (opt.)</Label>
            <Input id="doc-level" placeholder="e.g. S4" value={level} onChange={(e) => setLevel(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-year">Year (opt.)</Label>
            <Input id="doc-year" placeholder="e.g. 2023" value={year} onChange={(e) => setYear(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="doc-file">File</Label>
          <Input
            id="doc-file"
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="cursor-pointer"
          />
          {file && <p className="text-xs text-muted-foreground">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}
        </div>

        <Button onClick={handleSubmit} disabled={isPending} className="gap-2">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {isPending ? 'Uploading…' : 'Upload'}
        </Button>
      </CardContent>
    </Card>
  )
}

// ── Document row ───────────────────────────────────────────────────────────────

function DocumentRow({
  doc,
  canDelete,
  onDeleted,
}: {
  doc: CurriculumDocument
  canDelete: boolean
  onDeleted: (id: string) => void
}) {
  const [isPending, start] = useTransition()
  const cfg  = DOC_STATUS[doc.extraction_status]
  const Icon = cfg.icon

  function handleDelete() {
    start(async () => {
      const res = await deleteDocument(doc.id)
      if (res.error) { toast.error(res.error.message); return }
      toast.success('Document removed')
      onDeleted(doc.id)
    })
  }

  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{doc.title}</p>
          <p className="text-xs text-muted-foreground">
            {doc.subject} · {doc.document_type.replace('_', ' ')}
            {doc.level && ` · ${doc.level}`}
            {doc.year  && ` · ${doc.year}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="outline" className={`text-[10px] ${cfg.bg}`}>
          <Icon className={`h-3 w-3 mr-1 ${doc.extraction_status === 'processing' ? 'animate-spin' : ''}`} />
          {cfg.label}
        </Badge>
        {doc.extraction_status === 'failed' && doc.extraction_error && (
          <span className="text-[10px] text-rose-500 max-w-[12rem] truncate" title={doc.extraction_error}>
            {doc.extraction_error}
          </span>
        )}
        {canDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" disabled={isPending}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove document?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes &ldquo;{doc.title}&rdquo; and all its indexed chunks from the school knowledge base. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  )
}

// ── Main client ────────────────────────────────────────────────────────────────

interface Props {
  initialPendingNotes: StudentNote[]
  initialDocuments:    CurriculumDocument[]
  userRole:            string
}

export function KnowledgeBaseClient({ initialPendingNotes, initialDocuments, userRole }: Props) {
  const [pendingNotes, setPendingNotes] = useState(initialPendingNotes)
  const [documents,    setDocuments]    = useState(initialDocuments)

  const isAdmin = userRole === 'Admin'

  function handleNoteApproved(id: string) { setPendingNotes((p) => p.filter((n) => n.id !== id)) }
  function handleNoteRejected(id: string) { setPendingNotes((p) => p.filter((n) => n.id !== id)) }
  function handleDocUploaded(doc: CurriculumDocument) { setDocuments((p) => [doc, ...p]) }
  function handleDocDeleted(id: string)  { setDocuments((p) => p.filter((d) => d.id !== id)) }

  return (
    <div className="space-y-6 pb-16">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/10">
          <BookOpen className="h-5 w-5 text-gold" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground">
            Review student notes and manage school documents for AI-grounded lessons.
          </p>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <Tabs defaultValue="notes">
        <TabsList>
          <TabsTrigger value="notes" className="gap-2">
            Student Notes
            {pendingNotes.length > 0 && (
              <Badge className="h-4 px-1.5 text-[10px] bg-amber-500 text-white hover:bg-amber-500">
                {pendingNotes.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <Library className="h-3.5 w-3.5" />
            School Documents
          </TabsTrigger>
        </TabsList>

        {/* ── Student Notes ───────────────────────────────────────────── */}
        <TabsContent value="notes" className="mt-6 space-y-4">
          {pendingNotes.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                <p className="text-sm font-medium text-foreground">All caught up!</p>
                <p className="text-xs text-muted-foreground">No student notes awaiting review.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {pendingNotes.map((note) => (
                <NoteReviewCard
                  key={note.id}
                  note={note}
                  onApprove={handleNoteApproved}
                  onReject={handleNoteRejected}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── School Documents ────────────────────────────────────────── */}
        <TabsContent value="documents" className="mt-6 space-y-6">
          <UploadDocumentForm onUploaded={handleDocUploaded} />

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Uploaded documents</CardTitle>
              <CardDescription className="text-xs">
                {documents.length} document{documents.length !== 1 ? 's' : ''} in the school knowledge base
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No documents uploaded yet.</p>
              ) : (
                <div>
                  {documents.map((doc) => (
                    <DocumentRow
                      key={doc.id}
                      doc={doc}
                      canDelete={isAdmin}
                      onDeleted={handleDocDeleted}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
