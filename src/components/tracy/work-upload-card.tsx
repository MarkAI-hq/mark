'use client'

// Dynamic input: the assistant asks for a photo of the student's OWN worked
// solution (maths, calculations, labelled diagrams). The grading engine marks it
// against the hidden answer key — method marks per step, the first wrong step,
// and whether it looks like the student's own handwritten work — and a one-line
// summary goes back into the chat so the assistant can coach from the exact step
// that went wrong.

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowRight, Camera, Check, Loader2, X } from 'lucide-react'
import { MathMarkdown } from '@/components/tracy/chat-message'
import { formatTopicTitle } from '@/lib/utils'
import type { WorkUploadUi } from '@/components/tracy/generative-ui-protocol'
import { submitPracticeWork, type WorkGradeResult } from '@/lib/actions/practice-work'

const CARD = 'w-full overflow-hidden rounded-lg border border-border bg-card text-card-foreground'
const GOLD_TEXT = 'text-[#8a6713] dark:text-[#c9a03c]'

export function WorkUploadCard({
  ui,
  active,
  onSend,
}: {
  ui: WorkUploadUi
  active: boolean
  onSend: (message: string) => void
}) {
  const { question, subject, level, topic, outcome_id, marks, answer_key, marking_points, instructions } = ui.props
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<WorkGradeResult | null>(null)
  const locked = !active || busy || !!result
  const eyebrow = [level, subject, topic ? formatTopicTitle(topic) : undefined].filter(Boolean).join(' · ')

  function pick(f: File | null) {
    setError(null)
    setFile(f)
    setPreview(f && f.type.startsWith('image/') ? URL.createObjectURL(f) : null)
  }

  async function submit() {
    if (!file || locked) return
    setBusy(true)
    setError(null)
    const form = new FormData()
    form.append('file', file)
    form.append('question', question)
    form.append('answer_key', answer_key)
    if (marking_points?.length) form.append('marking_points', JSON.stringify(marking_points))
    if (marks) form.append('marks', String(marks))
    if (subject) form.append('subject', subject)
    if (topic) form.append('topic', topic)
    if (outcome_id) form.append('outcome_id', outcome_id)
    const { data, error: err } = await submitPracticeWork(form)
    setBusy(false)
    if (err || !data) {
      setError(err?.message ?? "We couldn't mark that. Try again.")
      return
    }
    setResult(data)
    const firstWrong = data.first_error_step != null ? data.steps[data.first_error_step] : null
    onSend(
      `My working was marked: ${data.score}/${data.max_score}` +
        (data.correct
          ? ' — all correct.'
          : firstWrong
            ? `. First mistake at step ${(data.first_error_step ?? 0) + 1}: ${firstWrong.note || firstWrong.step}.`
            : '.') +
        (data.authenticity.looks_like_own_work ? '' : ' (It was flagged as possibly not my own handwritten working.)'),
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={CARD}>
      <div className="border-b border-border px-4 py-3">
        {eyebrow && <p className={`text-[11px] font-bold uppercase tracking-[.12em] ${GOLD_TEXT}`}>{eyebrow}</p>}
        <div className="mt-1 text-[15px] font-medium text-foreground [&_p]:my-0">
          <MathMarkdown>{question}</MathMarkdown>
        </div>
        {marks ? <p className="mt-1 text-[12px] text-muted-foreground">{marks} marks — show every step</p> : null}
      </div>

      <div className="space-y-3 px-4 py-4">
        {!result && (
          <>
            <p className="text-[13px] text-muted-foreground">
              {instructions ?? 'Work it out in your exercise book, then take a clear photo of your working.'}
            </p>
            {preview && (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Your working" className="max-h-64 w-full rounded-md border border-border object-contain" />
                {!busy && (
                  <button
                    type="button"
                    onClick={() => pick(null)}
                    className="absolute right-2 top-2 rounded-full bg-background/90 p-1"
                    aria-label="Remove photo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
            {file && !preview && <p className="text-[13px] text-foreground">{file.name}</p>}
            <div className="flex flex-wrap items-center gap-2">
              <label
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[13px] font-medium hover:bg-muted ${locked ? 'pointer-events-none opacity-40' : ''}`}
              >
                <Camera className="h-3.5 w-3.5" />
                {file ? 'Retake' : 'Take or choose photo'}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  capture="environment"
                  className="sr-only"
                  disabled={locked}
                  onChange={(e) => pick(e.target.files?.[0] ?? null)}
                />
              </label>
              <button
                type="button"
                onClick={submit}
                disabled={!file || locked}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#b88a1f] px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-[#9a7619] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Marking…
                  </>
                ) : (
                  <>
                    Mark my working <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
            {error && (
              <p className="flex items-center gap-1.5 text-[13px] text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                {error}
              </p>
            )}
          </>
        )}

        {result && (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] text-muted-foreground">Your mark</span>
              <span
                className={`text-[18px] font-semibold ${result.correct ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}
              >
                {result.score}/{result.max_score}
              </span>
            </div>
            {result.steps.length > 0 && (
              <ol className="space-y-1.5">
                {result.steps.map((st, i) => (
                  <li
                    key={i}
                    className={`rounded-md border px-3 py-2 text-[13px] ${st.ok ? 'border-border' : 'border-red-300 bg-red-50/60 dark:border-red-900 dark:bg-red-950/30'}`}
                  >
                    <div className="flex items-start gap-2">
                      {st.ok ? (
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={2.5} />
                      ) : (
                        <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" strokeWidth={2.5} />
                      )}
                      <div className="min-w-0 [&_p]:my-0">
                        <MathMarkdown>{st.step}</MathMarkdown>
                        {!st.ok && st.note && <p className="mt-0.5 text-[12px] text-muted-foreground">{st.note}</p>}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            <div className="text-[13.5px] text-foreground [&_p]:my-0">
              <MathMarkdown>{result.feedback}</MathMarkdown>
            </div>
            {!result.authenticity.looks_like_own_work && (
              <p className="flex items-start gap-1.5 rounded-md bg-amber-50 px-3 py-2 text-[12.5px] text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                This doesn&apos;t look like your own handwritten working, so it wasn&apos;t counted toward your
                progress. Try it yourself and upload your own steps.
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
