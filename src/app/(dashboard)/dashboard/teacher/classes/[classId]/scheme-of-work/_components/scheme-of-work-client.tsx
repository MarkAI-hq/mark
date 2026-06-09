'use client'

// src/app/(dashboard)/dashboard/teacher/classes/[classId]/scheme-of-work/_components/scheme-of-work-client.tsx

import { useState, useTransition, useRef } from 'react'
import {
  BookOpen, CheckCircle2, Circle, Plus, Sparkles,
  FileText, Link2, ChevronDown, ChevronUp, Layers,
  Send, Users, AlertCircle, Pencil, FileUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge }   from '@/components/ui/badge'
import { Button }  from '@/components/ui/button'
import { Input }   from '@/components/ui/input'
import { Label }   from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible'

import {
  updateSchemeEntry, updateSchemeOfWork,
  assignSchemeToClass, generateSchemeFromNotes,
  importSchemeFromCsv, importSchemeFromPdf, createSchemeOfWork,
  type SchemeOfWork, type SchemeOfWorkEntry,
} from '@/lib/actions/scheme-of-work'
import { dispatchStudyPlans } from '@/lib/actions/study-plans'

// ── Helpers ───────────────────────────────────────────────────────────────

function weekLabel(entry: SchemeOfWorkEntry) {
  if (entry.planned_week_start) {
    try {
      return `Wk ${entry.week_number} · ${format(parseISO(entry.planned_week_start), 'd MMM')}`
    } catch {}
  }
  return `Week ${entry.week_number}`
}

// ── EntryRow ──────────────────────────────────────────────────────────────

function EntryRow({
  entry,
  sowId,
  classId,
  onUpdated,
}: {
  entry: SchemeOfWorkEntry
  sowId: string
  classId: string
  onUpdated: (updated: SchemeOfWorkEntry) => void
}) {
  const [open, setOpen]         = useState(false)
  const [isPending, startT]     = useTransition()
  const [editOpen, setEditOpen] = useState(false)
  const [editNotes, setEditNotes] = useState(entry.notes ?? '')

  function handleToggleDelivered() {
    startT(async () => {
      const res = await updateSchemeEntry(sowId, entry.id, classId, {
        is_delivered:         !entry.is_delivered,
        actual_delivery_date: !entry.is_delivered ? new Date().toISOString().split('T')[0] : undefined,
      })
      if (res.error) { toast.error(res.error.message); return }
      onUpdated(res.data!)
      toast.success(!entry.is_delivered ? 'Topic marked as delivered' : 'Delivery status cleared')
    })
  }

  function handleSaveNotes() {
    startT(async () => {
      const res = await updateSchemeEntry(sowId, entry.id, classId, { notes: editNotes })
      if (res.error) { toast.error(res.error.message); return }
      onUpdated(res.data!)
      setEditOpen(false)
      toast.success('Notes saved')
    })
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={`rounded-xl border transition-colors ${
        entry.is_delivered
          ? 'border-emerald-200/60 bg-emerald-50/30 dark:border-emerald-900/60 dark:bg-emerald-950/10'
          : 'border-border/60 bg-card hover:bg-surface-raised/50'
      }`}>
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Delivered toggle */}
          <button
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            onClick={handleToggleDelivered}
            disabled={isPending}
            title={entry.is_delivered ? 'Mark as not delivered' : 'Mark as delivered'}
          >
            {entry.is_delivered
              ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              : <Circle className="h-5 w-5" />
            }
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`text-sm font-medium ${entry.is_delivered ? 'text-muted-foreground' : ''}`}>
                {entry.topic}
              </p>
              <span className="text-xs text-muted-foreground">{weekLabel(entry)}</span>
              {entry.is_delivered && (
                <Badge className="text-xs px-1.5 py-0 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                  Delivered
                  {entry.actual_delivery_date ? ` · ${format(parseISO(entry.actual_delivery_date), 'd MMM')}` : ''}
                </Badge>
              )}
              {(entry.subtopics ?? []).length > 0 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  {(entry.subtopics ?? []).length} subtopics
                </Badge>
              )}
            </div>
            {entry.notes && !open && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{entry.notes}</p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => { setEditNotes(entry.notes ?? ''); setEditOpen(true) }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2">
                {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3 border-t border-border/40 pt-3">
            {(entry.subtopics ?? []).length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Subtopics</p>
                <div className="flex flex-wrap gap-1.5">
                  {(entry.subtopics ?? []).map((s, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
            {(entry.learning_objectives ?? []).length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Learning Objectives</p>
                <ul className="space-y-1">
                  {(entry.learning_objectives ?? []).map((obj, i) => (
                    <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                      <span className="text-gold mt-0.5">·</span>
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {entry.notes && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                <p className="text-xs text-muted-foreground">{entry.notes}</p>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{entry.duration_lessons} lesson{entry.duration_lessons !== 1 ? 's' : ''} planned</span>
            </div>
          </div>
        </CollapsibleContent>
      </div>

      {/* Edit notes dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Edit notes — {entry.topic}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Add notes about this topic..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveNotes} disabled={isPending}>
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Collapsible>
  )
}

// ── CreateSowDialog ─────────────────────────────────────────────────────────

type CreateMode = 'manual' | 'notes' | 'csv' | 'pdf'

function CreateSowDialog({
  open,
  onClose,
  classId,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  classId: string
  onCreated: (sow: SchemeOfWork) => void
}) {
  const [mode, setMode]     = useState<CreateMode>('notes')
  const [isPending, startT] = useTransition()
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    subject:        '',
    grade_level:    '',
    title:          '',
    academic_year:  '',
    term:           '',
    term_start_date:'',
    total_weeks:    '13',
    notes:          '',
    csv:            '',
  })

  function handleSubmit() {
    const base = {
      subject:        form.subject,
      grade_level:    form.grade_level,
      academic_year:  form.academic_year,
      term:           form.term,
      term_start_date:form.term_start_date,
      total_weeks:    form.total_weeks ? parseInt(form.total_weeks, 10) : 13,
    }

    if (!base.subject || !base.grade_level || !base.term || !base.academic_year || !base.term_start_date) {
      toast.error('Please fill in all required fields.')
      return
    }

    startT(async () => {
      let res

      if (mode === 'notes') {
        if (!form.notes.trim()) { toast.error('Please paste your notes.'); return }
        res = await generateSchemeFromNotes({ ...base, notes: form.notes })
      } else if (mode === 'csv') {
        if (!form.csv.trim()) { toast.error('Please paste your CSV data.'); return }
        res = await importSchemeFromCsv({ ...base, csv: form.csv })
      } else if (mode === 'pdf') {
        if (!pdfFile) { toast.error('Please select a PDF file.'); return }
        const fd = new FormData()
        fd.append('file', pdfFile)
        fd.append('subject', base.subject)
        fd.append('grade_level', base.grade_level)
        fd.append('term', base.term)
        fd.append('academic_year', base.academic_year)
        fd.append('term_start_date', base.term_start_date)
        fd.append('total_weeks', String(base.total_weeks))
        res = await importSchemeFromPdf(fd)
      } else {
        const title = form.title || `${base.subject} — ${base.term} ${base.academic_year}`
        res = await createSchemeOfWork({ ...base, title })
      }

      if (res.error) { toast.error(res.error.message); return }

      // Auto-assign to this class
      const assignRes = await assignSchemeToClass(res.data!.id, classId)
      if (assignRes.error) toast.warning('SoW created but could not assign to class automatically. Assign it manually.')

      onCreated(res.data!)
      toast.success('Scheme of Work created!')
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Scheme of Work</DialogTitle>
        </DialogHeader>

        {/* Mode selector */}
        <div className="grid grid-cols-4 gap-2">
          {([
            { id: 'notes', label: 'From Notes', icon: FileText },
            { id: 'pdf',   label: 'Upload PDF', icon: FileUp },
            { id: 'csv',   label: 'From CSV',   icon: Layers },
            { id: 'manual',label: 'Manual',      icon: Plus },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-colors ${
                mode === id ? 'border-gold bg-gold/10 text-gold' : 'border-border hover:bg-muted text-muted-foreground'
              }`}
              onClick={() => setMode(id)}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {/* Common fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Subject *</Label>
              <Input placeholder="Mathematics" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Grade / Level *</Label>
              <Input placeholder="Form 4" value={form.grade_level} onChange={(e) => setForm((f) => ({ ...f, grade_level: e.target.value }))} />
            </div>
          </div>

          {mode === 'manual' && (
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input placeholder="Form 4 Mathematics — Term 2 2026" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Term *</Label>
              <Input placeholder="Term 2" value={form.term} onChange={(e) => setForm((f) => ({ ...f, term: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Academic year *</Label>
              <Input placeholder="2025/2026" value={form.academic_year} onChange={(e) => setForm((f) => ({ ...f, academic_year: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Term start date *</Label>
              <Input type="date" value={form.term_start_date} onChange={(e) => setForm((f) => ({ ...f, term_start_date: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Total weeks</Label>
              <Input type="number" min={1} max={52} value={form.total_weeks} onChange={(e) => setForm((f) => ({ ...f, total_weeks: e.target.value }))} />
            </div>
          </div>

          {/* Mode-specific inputs */}
          {mode === 'notes' && (
            <div className="space-y-1.5">
              <Label>Your notes *</Label>
              <p className="text-xs text-muted-foreground">
                Paste a rough plan, bullet points, or any text — AI will structure it into weekly entries.
              </p>
              <Textarea
                placeholder={`Week 1: Algebra basics - variables and expressions\nWeek 2: Linear equations\nWeek 3-4: Quadratic equations...`}
                rows={6}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          )}

          {mode === 'csv' && (
            <div className="space-y-1.5">
              <Label>CSV data *</Label>
              <p className="text-xs text-muted-foreground">
                Required columns: <code className="bg-muted px-1 rounded text-xs">week_number</code>, <code className="bg-muted px-1 rounded text-xs">topic</code>. Optional: subtopics, learning_objectives, duration_lessons, notes.
              </p>
              <Textarea
                placeholder={`week_number,topic,subtopics,learning_objectives\n1,Algebra Basics,Variables;Expressions,Define variables;Simplify expressions\n2,Linear Equations,,`}
                rows={6}
                className="font-mono text-xs"
                value={form.csv}
                onChange={(e) => setForm((f) => ({ ...f, csv: e.target.value }))}
              />
            </div>
          )}

          {mode === 'pdf' && (
            <div className="space-y-1.5">
              <Label>PDF file *</Label>
              <p className="text-xs text-muted-foreground">
                Upload a syllabus, textbook chapter, or teaching plan — AI will extract the weekly topic structure.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
              />
              {pdfFile ? (
                <div className="flex items-center gap-3 rounded-xl border border-gold/40 bg-gold/5 px-4 py-3">
                  <FileText className="h-8 w-8 shrink-0 text-gold" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{pdfFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(pdfFile.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs shrink-0"
                    onClick={() => { setPdfFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-muted-foreground/40 hover:bg-muted/30"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileUp className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Click to browse or drop a PDF</p>
                    <p className="text-xs text-muted-foreground">Max 20 MB</p>
                  </div>
                </button>
              )}
            </div>
          )}

          {mode === 'manual' && (
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              A blank SoW header will be created. You can add entries manually after creation.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending} className="gap-2">
            {isPending ? (
              <>{mode === 'notes' || mode === 'pdf' ? 'Analysing with AI...' : 'Creating...'}</>
            ) : (
              <>
                {(mode === 'notes' || mode === 'pdf') && <Sparkles className="h-4 w-4" />}
                Create SoW
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── AssignSowDialog ─────────────────────────────────────────────────────────

function AssignSowDialog({
  open,
  onClose,
  classId,
  schemes,
  onAssigned,
}: {
  open: boolean
  onClose: () => void
  classId: string
  schemes: SchemeOfWork[]
  onAssigned: (sow: SchemeOfWork) => void
}) {
  const [selectedId, setSelectedId] = useState('')
  const [isPending, startT]         = useTransition()

  function handleAssign() {
    if (!selectedId) { toast.error('Please select a scheme.'); return }
    startT(async () => {
      const res = await assignSchemeToClass(selectedId, classId)
      if (res.error) { toast.error(res.error.message); return }
      const sow = schemes.find((s) => s.id === selectedId)!
      onAssigned(sow)
      toast.success('Scheme assigned to class!')
      onClose()
    })
  }

  const available = schemes.filter((s) => s.status !== 'archived')

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Scheme of Work</DialogTitle>
        </DialogHeader>
        {available.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No schemes available. Create one first.
          </div>
        ) : (
          <div className="space-y-3">
            <Label>Select a Scheme of Work</Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a scheme..." />
              </SelectTrigger>
              <SelectContent>
                {available.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="text-left">
                      <p className="text-sm font-medium">{s.title}</p>
                      <p className="text-xs text-muted-foreground">{s.subject} · {s.grade_level} · {s.term}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAssign} disabled={isPending || !selectedId}>
            {isPending ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

interface Props {
  classId:    string
  activeSow:  SchemeOfWork | null
  allSchemes: SchemeOfWork[]
  error:      string | null
}

export function SchemeOfWorkClient({ classId, activeSow: initialSow, allSchemes: initialSchemes, error }: Props) {
  const [sow, setSow]         = useState<SchemeOfWork | null>(initialSow)
  const [entries, setEntries] = useState<SchemeOfWorkEntry[]>(initialSow?.entries ?? [])
  const [schemes, setSchemes] = useState<SchemeOfWork[]>(initialSchemes)
  const [createOpen, setCreateOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [isPending, startT]         = useTransition()

  function handleEntryUpdated(updated: SchemeOfWorkEntry) {
    setEntries((prev) => prev.map((e) => e.id === updated.id ? updated : e))
  }

  function handleSowCreated(created: SchemeOfWork) {
    setSow(created)
    setEntries(created.entries ?? [])
    setSchemes((prev) => [...prev.filter((s) => s.id !== created.id), created])
  }

  function handleAssigned(assigned: SchemeOfWork) {
    setSow(assigned)
    setEntries(assigned.entries ?? [])
  }

  function handleActivate() {
    if (!sow) return
    startT(async () => {
      const res = await updateSchemeOfWork(sow.id, { status: 'active' }, classId)
      if (res.error) { toast.error(res.error.message); return }
      setSow(res.data!)
      toast.success('Scheme of Work activated')
    })
  }

  function handleDispatch() {
    startT(async () => {
      const res = await dispatchStudyPlans(classId)
      if (res.error) { toast.error(res.error.message); return }
      toast.success('Study plans queued for all students in this class')
    })
  }

  const delivered  = entries.filter((e) => e.is_delivered).length
  const total      = entries.length
  const pct        = total > 0 ? Math.round((delivered / total) * 100) : 0

  // Group entries by week
  const sorted = [...entries].sort((a, b) => a.week_number - b.week_number)

  if (error && !sow) {
    return (
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error === 'Not Found' || error?.includes('404') ? 'No Scheme of Work assigned to this class yet.' : error}</span>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create SoW
          </Button>
          {schemes.length > 0 && (
            <Button variant="outline" onClick={() => setAssignOpen(true)} className="gap-2">
              <Link2 className="h-4 w-4" />
              Assign Existing
            </Button>
          )}
        </div>
        <CreateSowDialog open={createOpen} onClose={() => setCreateOpen(false)} classId={classId} onCreated={handleSowCreated} />
        <AssignSowDialog open={assignOpen} onClose={() => setAssignOpen(false)} classId={classId} schemes={schemes} onAssigned={handleAssigned} />
      </div>
    )
  }

  return (
    <div className="space-y-5 p-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold">{sow?.title ?? 'Scheme of Work'}</h2>
          {sow && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {sow.subject} · {sow.grade_level} · {sow.term} · {sow.academic_year}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {sow?.status === 'draft' && (
            <Button size="sm" variant="gold" onClick={handleActivate} disabled={isPending} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Activate
            </Button>
          )}
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New SoW
          </Button>
          {schemes.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)} className="gap-2">
              <Link2 className="h-4 w-4" />
              Assign
            </Button>
          )}
        </div>
      </div>

      {/* Status + progress */}
      {sow && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Status', value: sow.status, badge: true },
            { label: 'Progress', value: `${delivered} / ${total}`, badge: false },
            { label: 'Delivered', value: `${pct}%`, badge: false },
            { label: 'Weeks', value: `${sow.total_weeks} total`, badge: false },
          ].map((c) => (
            <Card key={c.label} className="p-4">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              {c.badge ? (
                <Badge className={`mt-1.5 text-xs ${
                  sow.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' :
                  sow.status === 'archived' ? 'bg-muted text-muted-foreground' :
                  'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                }`}>
                  {sow.status}
                </Badge>
              ) : (
                <p className="text-xl font-bold mt-1">{c.value}</p>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Dispatch study plans */}
      {sow?.status === 'active' && (
        <Card className="border-gold/20 bg-gold/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-gold" />
                  Dispatch Study Plans
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Generate personalised lessons for all students based on their gaps and attendance.
                </p>
              </div>
              <Button
                size="sm"
                variant="gold"
                onClick={handleDispatch}
                disabled={isPending}
                className="shrink-0 gap-2"
              >
                <Send className="h-4 w-4" />
                {isPending ? 'Queuing...' : 'Dispatch All'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entries list */}
      {sow && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              {total} topic{total !== 1 ? 's' : ''} · {delivered} delivered
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Click circle to mark delivered
              </span>
            </div>
          </div>

          {sorted.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-center animate-fade-up">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10">
                  <BookOpen className="h-8 w-8 text-gold/60" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">No entries yet</p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    This SoW has no weekly entries. Create a new SoW from notes or CSV to get weekly topics automatically.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            sorted.map((entry) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                sowId={sow.id}
                classId={classId}
                onUpdated={handleEntryUpdated}
              />
            ))
          )}
        </div>
      )}

      {/* Dialogs */}
      <CreateSowDialog open={createOpen} onClose={() => setCreateOpen(false)} classId={classId} onCreated={handleSowCreated} />
      <AssignSowDialog open={assignOpen} onClose={() => setAssignOpen(false)} classId={classId} schemes={schemes} onAssigned={handleAssigned} />
    </div>
  )
}
