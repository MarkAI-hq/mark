'use client'

import { useEffect, useState } from 'react'
import { BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CurriculumExamDialog } from './curriculum-exam-dialog'
import { getSubjects } from '@/lib/actions/subjects'

interface SubjectOption { id: string; name: string }

interface ExamPathSelectorProps {
  /** Skip the "Generate from Curriculum instead" banner and open the subject picker immediately. */
  autoStart?: boolean
}

export function ExamPathSelector({ autoStart = false }: ExamPathSelectorProps) {
  const [open,     setOpen]     = useState(autoStart)
  const [subject,  setSubject]  = useState<SubjectOption | null>(null)
  const [subjects, setSubjects] = useState<SubjectOption[]>([])
  const [loading,  setLoading]  = useState(autoStart)
  const [step,     setStep]     = useState<'path' | 'subject' | 'form'>(autoStart ? 'subject' : 'path')

  const loadSubjects = async () => {
    setLoading(true)
    const { data } = await getSubjects()
    if (data) {
      setSubjects((data as { subject_id?: string; id?: string; name: string }[])
        .map((s) => ({ id: s.subject_id ?? s.id ?? '', name: s.name }))
        .filter((s) => s.id))
    }
    setLoading(false)
  }

  const handleCurriculumClick = async () => {
    setStep('subject')
    setOpen(true)
    await loadSubjects()
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (autoStart) loadSubjects() }, [])

  if (!open) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
        <p className="text-sm font-medium text-amber-900 mb-3">
          Already have a curriculum loaded? Skip the upload step entirely.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="gap-2 border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200"
          onClick={handleCurriculumClick}
        >
          <BookOpen className="h-4 w-4" />
          Generate from Curriculum instead
        </Button>
      </div>
    )
  }

  if (step === 'subject') {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
        <p className="text-sm font-medium text-amber-900 mb-3">Select a subject to generate from its curriculum:</p>
        <div className="flex flex-wrap gap-2">
          {loading && <p className="text-sm text-amber-700">Loading subjects…</p>}
          {!loading && subjects.map((s) => (
            <Button
              key={s.id}
              size="sm"
              variant="outline"
              className="border-amber-300 bg-white text-amber-800 hover:bg-amber-100"
              onClick={() => { setSubject(s); setStep('form') }}
            >
              {s.name}
            </Button>
          ))}
          {!loading && subjects.length === 0 && (
            <p className="text-sm text-amber-700">No subjects found. Create subjects first.</p>
          )}
        </div>
        {!autoStart && (
          <Button variant="link" size="sm" className="mt-2 h-auto p-0 text-xs text-amber-600" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-800">
            Generating from curriculum for <strong>{subject?.name}</strong>
          </span>
        </div>
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-xs text-amber-600"
          onClick={() => { setStep('subject'); setSubject(null) }}
        >
          Choose a different subject
        </Button>
      </div>

      {subject && (
        <CurriculumExamDialog
          open={step === 'form'}
          onOpenChange={(v) => { if (!v) { setStep('subject'); setSubject(null) } }}
          subjectId={subject.id}
          subjectName={subject.name}
        />
      )}
    </>
  )
}
