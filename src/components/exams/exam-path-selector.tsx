'use client'

import { useState } from 'react'
import { BookOpen, Upload } from 'lucide-react'
import { CurriculumExamDialog } from './curriculum-exam-dialog'
import { getSubjects } from '@/lib/actions/subjects'

interface SubjectOption { id: string; name: string }

export function ExamPathSelector() {
  const [open,     setOpen]     = useState(false)
  const [subject,  setSubject]  = useState<SubjectOption | null>(null)
  const [subjects, setSubjects] = useState<SubjectOption[]>([])
  const [step,     setStep]     = useState<'path' | 'subject' | 'form'>('path')

  const handleCurriculumClick = async () => {
    setStep('subject')
    const { data } = await getSubjects()
    if (data) {
      setSubjects((data as any[]).map((s: any) => ({ id: s.subject_id ?? s.id, name: s.name })).filter((s: SubjectOption) => s.id))
    }
    setOpen(true)
  }

  if (!open) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
        <p className="text-sm font-medium text-amber-900 mb-3">
          Already have a curriculum loaded? Skip the upload step entirely.
        </p>
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-amber-100 border border-amber-300 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-200 transition-colors"
          onClick={handleCurriculumClick}
        >
          <BookOpen className="h-4 w-4" />
          Generate from Curriculum instead
        </button>
      </div>
    )
  }

  if (step === 'subject') {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
        <p className="text-sm font-medium text-amber-900 mb-3">Select a subject to generate from its curriculum:</p>
        <div className="flex flex-wrap gap-2">
          {subjects.map((s) => (
            <button
              key={s.id}
              className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm text-amber-800 hover:bg-amber-100 transition-colors"
              onClick={() => { setSubject(s); setStep('form') }}
            >
              {s.name}
            </button>
          ))}
          {subjects.length === 0 && (
            <p className="text-sm text-amber-700">No subjects found. Create subjects first.</p>
          )}
        </div>
        <button className="mt-3 text-xs text-amber-600 hover:underline" onClick={() => setOpen(false)}>
          Cancel
        </button>
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
        <button className="text-xs text-amber-600 hover:underline" onClick={() => { setOpen(false); setStep('path'); setSubject(null) }}>
          Cancel
        </button>
      </div>

      {subject && (
        <CurriculumExamDialog
          open={step === 'form'}
          onOpenChange={(v) => { if (!v) { setOpen(false); setStep('path'); setSubject(null) } }}
          subjectId={subject.id}
          subjectName={subject.name}
        />
      )}
    </>
  )
}
