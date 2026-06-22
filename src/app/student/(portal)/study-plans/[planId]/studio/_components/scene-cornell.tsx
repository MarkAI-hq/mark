'use client'

import { useState } from 'react'
import { NotebookText, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { submitStudentNote, validateSceneNotes } from '@/lib/actions/student-notes'
import { toast } from 'sonner'

interface Props {
  scene:    any
  planId:   string
  subject:  string
  topic:    string
  onReady?: () => void
}

export function SceneCornell({ scene, planId, subject, topic, onReady }: Props) {
  const { title, content, bloom_level } = scene
  const { notes_column, cue_questions, summary: summaryPrompt } = content ?? {}

  const [studentNotes, setStudentNotes] = useState('')
  const [summary, setSummary]           = useState('')
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)
  const [checking, setChecking]         = useState(false)
  const [feedback, setFeedback]         = useState<string | null>(null)
  const [passed, setPassed]             = useState(false)

  async function handleCheck() {
    if (!studentNotes.trim()) return
    setChecking(true)
    setFeedback(null)
    try {
      const res = await validateSceneNotes({
        notes: [studentNotes, summary].filter(Boolean).join('\n\nSummary: '),
        modelNotes: notes_column,
        cueQuestions: cue_questions,
        subject,
        topic,
      })
      if (res.error) { toast.error('Could not check notes right now'); return }
      setFeedback(res.data!.feedback)
      if (res.data!.passed && !passed) {
        setPassed(true)
        onReady?.()
      }
    } catch {
      toast.error('Could not check notes right now')
    } finally {
      setChecking(false)
    }
  }

  async function handleSave() {
    if (!studentNotes.trim()) return
    setSaving(true)
    try {
      const fullNote = [
        `## ${title}`,
        '',
        '### Cue Questions',
        ...(cue_questions ?? []).map((q: string) => `- ${q}`),
        '',
        '### My Notes',
        studentNotes,
        '',
        '### My Summary',
        summary || '(no summary written)',
      ].join('\n')
      await submitStudentNote({ subject, topic, content: fullNote })
      toast.success('Cornell notes saved to your Knowledge Base')
      setSaved(true)
    } catch {
      toast.error('Could not save notes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <NotebookText className="h-4 w-4 text-gold shrink-0 mt-0.5" />
        <h2 className="font-semibold text-base leading-tight">{title}</h2>
        {bloom_level && (
          <Badge variant="outline" className="text-[10px] ml-auto shrink-0 capitalize border-gold/30 text-gold">
            {bloom_level}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-5 gap-0 rounded-xl border overflow-hidden min-h-[240px]">
        {/* Cue questions — left column */}
        <div className="col-span-2 border-r bg-muted/30 px-3 py-3 flex flex-col gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Cues — think about these
          </p>
          <ul className="space-y-3 flex-1">
            {(cue_questions ?? []).map((q: string, i: number) => (
              <li key={i} className="space-y-0.5">
                <span className="text-[10px] font-bold text-gold/80 uppercase tracking-wide">Q{i + 1}</span>
                <p className="text-xs text-foreground leading-snug">{q}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Student notes — right column */}
        <div className="col-span-3 px-3 py-3 flex flex-col">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Your notes
          </p>
          <textarea
            value={studentNotes}
            onChange={(e) => setStudentNotes(e.target.value)}
            placeholder="Write your own notes here — use the cue questions on the left to guide you…"
            className="flex-1 min-h-[180px] w-full bg-transparent text-sm resize-none focus:outline-none placeholder:text-muted-foreground leading-relaxed"
          />
        </div>
      </div>

      {/* Summary zone */}
      <div className="rounded-xl border bg-card p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          My summary <span className="normal-case font-normal">(in your own words, after writing your notes)</span>
        </p>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder={summaryPrompt ?? 'Summarise the key points from your notes in 2–3 sentences…'}
          rows={3}
          className="w-full bg-transparent text-sm resize-none focus:outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div className={`rounded-xl border px-4 py-3 text-sm leading-relaxed flex gap-3 items-start ${
          passed
            ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-200'
            : 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200'
        }`}>
          {passed && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />}
          <span>{feedback}</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant="outline"
          onClick={handleSave}
          disabled={!studentNotes.trim() || saving}
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Notes'}
        </Button>

        <Button
          size="sm"
          onClick={handleCheck}
          disabled={!studentNotes.trim() || checking || passed}
          className="ml-auto bg-gold hover:bg-gold/90 text-gold-foreground"
        >
          {checking ? 'Checking…' : passed ? 'Looks good ✓' : feedback ? 'Check again' : 'Check my notes'}
        </Button>
      </div>
    </div>
  )
}
