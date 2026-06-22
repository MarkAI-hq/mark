'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import Link from 'next/link'
import {
  BookOpen, Plus, Link2, RefreshCw, Sparkles, FileUp, FileText,
  ChevronRight, CheckCircle2, Circle, Layers,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Badge }    from '@/components/ui/badge'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  getAllSchemesForClass,
  assignSchemeToClass,
  createSchemeOfWork,
  generateSchemeOfWork,
  generateSchemeFromNotes,
  importSchemeFromPdf,
  listSchemeOfWork,
  type SchemeOfWork,
  type SowSummary,
} from '@/lib/actions/scheme-of-work'
import { getCurricula } from '@/lib/actions/curricula'
import { getSubjects }  from '@/lib/actions/subjects'

interface ClassSowTabProps {
  classId: string
  initialSchemes: SowSummary[]
}

const CURRENT_YEAR  = new Date().getFullYear()
const ACADEMIC_YEAR = `${CURRENT_YEAR}/${CURRENT_YEAR + 1}`

const statusColor: Record<string, string> = {
  active:   'bg-green-100 text-green-800 border-green-200',
  draft:    'bg-amber-100 text-amber-700 border-amber-200',
  archived: 'bg-slate-100 text-slate-600 border-slate-200',
}

export function ClassSowTab({ classId, initialSchemes }: ClassSowTabProps) {
  const [schemes,     setSchemes]     = useState<SowSummary[]>(initialSchemes)
  const [loading,     setLoading]     = useState(false)
  const [showCreate,  setShowCreate]  = useState(false)
  const [showAssign,  setShowAssign]  = useState(false)
  const [, startTransition] = useTransition()

  const load = () => {
    startTransition(async () => {
      setLoading(true)
      const res = await getAllSchemesForClass(classId)
      setSchemes(res.data ?? [])
      setLoading(false)
    })
  }

  // Group by subject
  const bySubject = schemes.reduce<Record<string, SowSummary[]>>((acc, s) => {
    if (!acc[s.subject]) acc[s.subject] = []
    acc[s.subject].push(s)
    return acc
  }, {})
  const subjects = Object.keys(bySubject).sort()

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[0, 1].map((i) => <div key={i} className="h-28 rounded-lg bg-muted" />)}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {schemes.length} scheme{schemes.length !== 1 ? 's' : ''} assigned to this class
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowAssign(true)} className="gap-1.5">
              <Link2 className="h-3.5 w-3.5" />
              Assign Existing
            </Button>
            <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              New SoW
            </Button>
          </div>
        </div>

        {subjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-10 w-10 mb-3 text-muted-foreground/40" />
            <h3 className="text-sm font-semibold">No schemes of work yet</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Create a new scheme of work for this class or assign one from your library.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <Button onClick={() => setShowCreate(true)} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Create New SoW
              </Button>
              <Button variant="outline" onClick={() => setShowAssign(true)} className="gap-1.5">
                <Link2 className="h-4 w-4" />
                Assign Existing
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {subjects.map((subject) => (
              <div key={subject}>
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {subject}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    · {bySubject[subject].length} scheme{bySubject[subject].length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-2">
                  {bySubject[subject].map((sow) => (
                    <SowCard key={sow.id} sow={sow} classId={classId} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateSowDialog
        open={showCreate}
        classId={classId}
        onClose={() => setShowCreate(false)}
        onCreated={() => { setShowCreate(false); setTimeout(() => load(), 800) }}
      />
      <AssignSowDialog
        open={showAssign}
        classId={classId}
        onClose={() => setShowAssign(false)}
        onAssigned={() => { setShowAssign(false); load() }}
      />
    </>
  )
}

// ── SoW card ────────────────────────────────────────────────────────────────

function SowCard({ sow, classId }: { sow: SowSummary; classId: string }) {
  const pct = sow.entries_total > 0
    ? Math.round((sow.entries_delivered / sow.entries_total) * 100)
    : null

  return (
    <Card className="hover:border-slate-300 transition-colors">
      <CardContent className="py-3.5 px-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
              <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{sow.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {sow.grade_level} · {sow.term} {sow.academic_year} · {sow.total_weeks} weeks
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {pct !== null && (
              <span className="text-xs text-muted-foreground">
                {sow.entries_delivered}/{sow.entries_total} delivered
              </span>
            )}
            <Badge className={`text-xs capitalize ${statusColor[sow.status] ?? ''}`}>
              {sow.status}
            </Badge>
            <Link
              href={`/dashboard/scheme-of-work/${sow.id}`}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={`/dashboard/teacher/classes/${classId}/scheme-of-work`}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Edit
            </Link>
          </div>
        </div>
        {pct !== null && (
          <div className="mt-2.5 ml-11">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Create SoW Dialog ────────────────────────────────────────────────────────

function CreateSowDialog({
  open, classId, onClose, onCreated,
}: {
  open:      boolean
  classId:   string
  onClose:   () => void
  onCreated: () => void
}) {
  const [isPending, startT] = useTransition()
  const [curricula,       setCurricula]       = useState<{ id: string; subject: string; grade_level: string; title: string }[]>([])
  const [subjectOptions,  setSubjectOptions]  = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const [subject,       setSubject]       = useState('')
  const [gradeLevel,    setGradeLevel]    = useState('')
  const [term,          setTerm]          = useState('')
  const [academicYear,  setAcademicYear]  = useState(ACADEMIC_YEAR)
  const [termStartDate, setTermStartDate] = useState('')
  const [curriculumId,  setCurriculumId]  = useState('')
  const [notes,         setNotes]         = useState('')
  const [title,         setTitle]         = useState('')

  useEffect(() => {
    if (!open) return
    getCurricula().then((res) => { if (res.data) setCurricula(res.data as any) })
    getSubjects().then(({ data }) => {
      if (data?.length) setSubjectOptions((data as any[]).map((s: any) => s.name as string))
    })
  }, [open])

  async function handleCreate(method: 'curriculum' | 'notes' | 'manual' | 'pdf') {
    if (!termStartDate) { toast.error('Term start date is required'); return }

    startT(async () => {
      let res: { data?: SchemeOfWork | null; error?: { message: string } | null }

      if (method === 'curriculum') {
        if (!curriculumId) { toast.error('Select a curriculum'); return }
        res = await generateSchemeOfWork({ curriculum_id: curriculumId, grade_level: gradeLevel || 'All', term, academic_year: academicYear, term_start_date: termStartDate })
      } else if (method === 'notes') {
        if (!notes.trim()) { toast.error('Enter notes'); return }
        res = await generateSchemeFromNotes({ subject: subject || 'General', grade_level: gradeLevel || 'All', term, academic_year: academicYear, term_start_date: termStartDate, notes })
      } else if (method === 'pdf') {
        const file = fileRef.current?.files?.[0]
        if (!file) { toast.error('Select a PDF file'); return }
        const fd = new FormData()
        fd.append('file', file)
        fd.append('subject',         subject || 'General')
        fd.append('grade_level',     gradeLevel || 'All')
        fd.append('term',            term)
        fd.append('academic_year',   academicYear)
        fd.append('term_start_date', termStartDate)
        res = await importSchemeFromPdf(fd)
      } else {
        if (!title.trim() || !subject.trim()) { toast.error('Title and subject are required'); return }
        res = await createSchemeOfWork({ subject, grade_level: gradeLevel || 'All', title, academic_year: academicYear, term, term_start_date: termStartDate })
      }

      if (res.error || !res.data) { toast.error(res.error?.message ?? 'Failed to create SoW'); return }

      const assignRes = await assignSchemeToClass(res.data.id, classId)
      if (assignRes.error) { toast.error('SoW created but could not assign to class: ' + assignRes.error.message); return }

      toast.success('Scheme of work created and assigned')
      onCreated()
    })
  }

  const subjectField = (
    <div className="space-y-1">
      <Label className="text-xs">Subject</Label>
      {subjectOptions.length > 0 ? (
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select subject" /></SelectTrigger>
          <SelectContent>
            {subjectOptions.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      ) : (
        <Input placeholder="e.g. Mathematics" value={subject} onChange={(e) => setSubject(e.target.value)} className="h-8 text-xs" />
      )}
    </div>
  )

  const sharedFields = (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label className="text-xs">Term</Label>
        <Input placeholder="Term 1, Semester 2…" value={term} onChange={(e) => setTerm(e.target.value)} className="h-8 text-xs" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Academic Year</Label>
        <Input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="h-8 text-xs" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Term Start Date</Label>
        <Input type="date" value={termStartDate} onChange={(e) => setTermStartDate(e.target.value)} className="h-8 text-xs" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Grade Level</Label>
        <Input placeholder="S1, S2, Form 4…" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} className="h-8 text-xs" />
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Create Scheme of Work</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="curriculum">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="curriculum" className="text-xs gap-1"><Sparkles className="h-3 w-3" />Curriculum</TabsTrigger>
            <TabsTrigger value="notes"      className="text-xs gap-1"><FileText className="h-3 w-3" />Notes</TabsTrigger>
            <TabsTrigger value="pdf"        className="text-xs gap-1"><FileUp   className="h-3 w-3" />PDF</TabsTrigger>
            <TabsTrigger value="manual"     className="text-xs gap-1"><Plus     className="h-3 w-3" />Manual</TabsTrigger>
          </TabsList>

          <TabsContent value="curriculum" className="space-y-3 mt-4">
            <div className="space-y-1">
              <Label className="text-xs">Curriculum</Label>
              <Select value={curriculumId} onValueChange={setCurriculumId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select curriculum…" />
                </SelectTrigger>
                <SelectContent>
                  {curricula.map((c: any) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.title ?? c.subject} {c.grade_level ? `· ${c.grade_level}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {sharedFields}
            <Button onClick={() => handleCreate('curriculum')} disabled={isPending} className="w-full gap-1.5">
              <Sparkles className="h-4 w-4" />
              {isPending ? 'Generating…' : 'Generate from Curriculum'}
            </Button>
          </TabsContent>

          <TabsContent value="notes" className="space-y-3 mt-4">
            {subjectField}
            <div className="space-y-1">
              <Label className="text-xs">Paste notes or topic list</Label>
              <Textarea
                placeholder="Week 1: Algebra — linear equations&#10;Week 2: Quadratic expressions…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                className="text-xs resize-none"
              />
            </div>
            {sharedFields}
            <Button onClick={() => handleCreate('notes')} disabled={isPending} className="w-full gap-1.5">
              <Sparkles className="h-4 w-4" />
              {isPending ? 'Generating…' : 'Generate from Notes'}
            </Button>
          </TabsContent>

          <TabsContent value="pdf" className="space-y-3 mt-4">
            {subjectField}
            <div className="space-y-1">
              <Label className="text-xs">SoW PDF (max 20 MB)</Label>
              <Input type="file" accept=".pdf" ref={fileRef} className="h-8 text-xs" />
            </div>
            {sharedFields}
            <Button onClick={() => handleCreate('pdf')} disabled={isPending} className="w-full gap-1.5">
              <FileUp className="h-4 w-4" />
              {isPending ? 'Uploading…' : 'Extract from PDF'}
            </Button>
          </TabsContent>

          <TabsContent value="manual" className="space-y-3 mt-4">
            <div className="space-y-1">
              <Label className="text-xs">Title</Label>
              <Input placeholder="e.g. Biology S4 T1" value={title} onChange={(e) => setTitle(e.target.value)} className="h-8 text-xs" />
            </div>
            {subjectField}
            {sharedFields}
            <Button onClick={() => handleCreate('manual')} disabled={isPending} className="w-full gap-1.5">
              {isPending ? 'Creating…' : 'Create Blank SoW'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

// ── Assign existing SoW dialog ───────────────────────────────────────────────

function AssignSowDialog({
  open, classId, onClose, onAssigned,
}: {
  open:       boolean
  classId:    string
  onClose:    () => void
  onAssigned: () => void
}) {
  const [schemes,   setSchemes]   = useState<SchemeOfWork[]>([])
  const [loading,   setLoading]   = useState(false)
  const [selected,  setSelected]  = useState<string | null>(null)
  const [isPending, startT]       = useTransition()

  useEffect(() => {
    if (!open) return
    setLoading(true)
    listSchemeOfWork().then((res) => {
      setSchemes(res.data ?? [])
      setLoading(false)
    })
  }, [open])

  function handleAssign() {
    if (!selected) return
    startT(async () => {
      const res = await assignSchemeToClass(selected, classId)
      if (res.error) { toast.error(res.error.message); return }
      toast.success('Scheme of work assigned to class')
      onAssigned()
    })
  }

  // Group by subject
  const bySubject = schemes.reduce<Record<string, SchemeOfWork[]>>((acc, s) => {
    if (!acc[s.subject]) acc[s.subject] = []
    acc[s.subject].push(s)
    return acc
  }, {})

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Assign Existing Scheme of Work</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Loading schemes…</div>
        ) : schemes.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No schemes of work found in your library.
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto space-y-3">
            {Object.keys(bySubject).sort().map((subject) => (
              <div key={subject}>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1 mb-1">{subject}</p>
                <div className="divide-y border rounded-lg overflow-hidden">
                  {bySubject[subject].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelected(s.id)}
                      className={`w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors ${selected === s.id ? 'bg-primary/5 border-l-2 border-primary' : ''}`}
                    >
                      <p className="text-sm font-medium">{s.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.grade_level} · {s.term} · {s.academic_year}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} size="sm">Cancel</Button>
          <Button onClick={handleAssign} disabled={!selected || isPending} size="sm" className="gap-1.5">
            <Link2 className="h-3.5 w-3.5" />
            {isPending ? 'Assigning…' : 'Assign to Class'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
